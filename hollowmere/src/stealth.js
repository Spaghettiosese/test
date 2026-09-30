// The stealth model, in one place. How visible you are is a product of named factors (light,
// posture, motion, cover, gear, weather...) that the Stealth tab lays out live. How loud you are
// depends on surface, gait, crowds and weather. Guards notice evidence you leave behind, and you
// can choke them out, put their lights out with a thrown knife, and read where they are looking.
const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Stealth {
  constructor(g) {
    this.g = g; this.cover = 0; this.tree = 0; this.t = 0; this.parts = []; this.detected = false; this.zoneAt = 0;
    this.grid = new Map(); this.ev = []; this.seenNow = []; this.seenT = 0;
    this.st = { spotted: 0, unseenZones: 0, chokes: 0, lightsOut: 0, evidence: 0, unseenSecs: 0 };
    for (const p of g.level.coverPts || []) this.addCover(p[0], p[1], p[2], p[3]);
    for (const b of g.level.props || []) { const k = b.userData.prop; if (k === 'barrel' || k === 'crate' || k === 'hay') this.addCover(b.userData.home[0], b.userData.home[2], 1.5, k === 'hay' ? 0.5 : 0.35); }
  }
  addCover(x, z, r, s) { const k = Math.floor(x / 8) + ',' + Math.floor(z / 8); (this.grid.get(k) || this.grid.set(k, []).get(k)).push([x, z, r, s]); }
  coverAt(x, z) {
    let c = 0; const gx = Math.floor(x / 8), gz = Math.floor(z / 8);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const p of this.grid.get((gx + a) + ',' + (gz + b)) || []) { const d = hyp(p[0] - x, p[1] - z); if (d < p[2]) c += (1 - d / p[2]) * p[3]; }
    // trees and undergrowth: a fraction of the cells around you are trunks
    // trees and undergrowth: many trunks within a few metres screen you from a distance
    const nav = this.g.nav; this.tree = 0;
    if (!nav.indoorAt(x, z)) { let trunks = 0; for (let dz = -6; dz <= 6; dz += 1.5) for (let dx = -6; dx <= 6; dx += 1.5) if (dx * dx + dz * dz <= 36 && nav.isBlocked(x + dx, z + dz)) trunks++; this.tree = clamp(trunks / 22, 0, 1); c += this.tree * 0.75; }
    return clamp(c, 0, 1);
  }
  // ---------------------------------------------------------------- visibility (0.05 to 1.6)
  compute(P, dt) {
    const g = this.g, parts = []; let v = 1;
    const light = 0.12 + P.lightLevel * 0.88; parts.push(['Light', light]); v = light;
    const post = P.prone ? 0.42 : P.crouch ? 0.55 : 1; if (post !== 1) parts.push([P.prone ? 'Prone' : 'Crouched', post]); v *= post;
    const mot = P.sprint ? 1.5 : P.speedNow < 0.4 ? 0.72 : P.creep ? 0.8 : 1; if (mot !== 1) parts.push([P.sprint ? 'Sprinting' : P.speedNow < 0.4 ? 'Still' : 'Creeping', mot]); v *= mot;
    if (P.mount) { const hm = P.mount.gait >= 2 ? 1.55 : 1.3; parts.push([P.mount.gait >= 2 ? 'Galloping' : 'Mounted', hm]); v *= hm; }
    const cv = 1 - 0.6 * this.cover * (P.crouch ? 1 : 0.45); if (cv < 0.98) parts.push(['Cover', cv]); v *= cv;
    if (P.veilT > 0) { parts.push(['Shadow Veil', 0.28]); v *= 0.28; P.veilT -= dt; }
    if (g.status?.inSmoke(P.pos)) { parts.push(['Smoke', 0.2]); v *= 0.2; }
    if (P.atk) { if (v < 0.85) parts.push(['Fighting', 0.85 / v]); v = Math.max(v, 0.85); }
    if (g.lantern?.on) { if (v < 0.8) parts.push(['Lantern', 0.8 / v]); v = Math.max(v, 0.8); }
    if (g.tools?.dragging) { parts.push(['Dragging a body', 1.25]); v *= 1.25; }
    const gm = (P.mod?.vis ?? 1) * (g.status?.mul('vis') ?? 1); if (gm !== 1) parts.push(['Gear & effects', gm]); v *= gm;
    const w = g.weather?.cur; if (w && w.sight < 0.95) { const wv = 0.5 + 0.5 * w.sight; parts.push(['Weather', wv]); v *= wv; }
    this.parts = parts; return clamp(v, 0.05, 1.6);
  }
  label(v) { return v < 0.22 ? 'Hidden' : v < 0.5 ? 'Cautious' : v < 0.9 ? 'Exposed' : 'Blazing'; }
  // gain multiplier for a guard looking at the player: c is the cosine off his facing
  detectMul(n, P, dist, c) {
    let m = 1;
    m *= c > 0.92 ? 1.3 : c > 0.75 ? 1.0 : 0.6; // he sees best straight ahead, poorly at the edges
    if (P.speedNow > 4.5) m *= 1.15;             // fast motion catches the eye
    if (n.role === 'captain' || n.faction === 'hunters') m *= 1.2;
    if (n.def.eyes > 1) m *= 1.05;
    return m;
  }
  // footstep and action noise is masked by crowds and weather
  noiseMask(pos, kind) {
    if (!['step', 'jump', 'land', 'dash', 'pick', 'prop'].includes(kind)) return 1;
    let m = this.g.weather?.noiseMul ?? 1, near = 0;
    for (const n of this.g.npcs) if (!n.dead && Math.abs(n.x - pos[0]) < 7 && Math.abs(n.z - pos[2]) < 7 && n.role === 'villager') near++;
    if (near >= 6) m *= 0.6; else if (near >= 3) m *= 0.8;
    return m;
  }
  // ---------------------------------------------------------------- evidence
  leave(type, x, z, r = 11) { this.ev.push({ type, x, z, t: this.g.time, seen: false, r }); if (this.ev.length > 30) this.ev.shift(); }
  // called by a guard's sweep: returns a piece of unseen evidence he can see
  spot(n, eye) {
    const now = this.g.time;
    for (const e of this.ev) {
      if (e.seen || now - e.t > 240) continue; const d = hyp(e.x - n.x, e.z - n.z); if (d > e.r) continue;
      const f = n.fwd; if (((e.x - n.x) * f[0] + (e.z - n.z) * f[1]) / (d || 1) < 0.4) continue;
      if (!this.g.canSee(eye, [e.x, 0.8, e.z], n.body)) continue;
      e.seen = true; this.st.evidence++; return e;
    }
    return null;
  }
  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.g, P = g.player; if (!P.pos) return;
    this.t -= dt; if (this.t <= 0) { this.t = 0.25; this.cover = this.coverAt(P.pos[0], P.pos[2]); this.coverT = 0; }
    this.seenT -= dt; if (this.seenT <= 0) { this.seenT = 0.5; this.refreshSeen(); }
    if (g.mode === 'play' && !this.detected) this.st.unseenSecs += dt;
  }
  refreshSeen() {
    const g = this.g, P = g.player, out = [], e = P.eyePos;
    for (const n of g.npcs) { if (n.dead || !n.guard || n.dist > 32 || !n.visible) continue; if (g.canSee(e, [n.x, n.y + 1.5, n.z], n.body)) out.push(n); }
    this.seenNow = out;
  }
  detectedNow() { this.detected = true; this.st.spotted++; }
  zoneChanged(zone) {
    const g = this.g;
    if (!this.detected && g.time - this.zoneAt > 25 && this.zoneAt > 0) { this.st.unseenZones++; g.progress.addXp(20, 'unseen'); g.ui.flashBanner('UNSEEN', 1200, true); }
    this.detected = false; this.zoneAt = g.time;
  }
  // ---------------------------------------------------------------- interactions
  hook(push, eye) {
    const g = this.g, P = g.player;
    for (const n of g.npcs) {
      if (n.dead || n.state === 'ko' || n.lying || n.role === 'hollow' || Math.abs(n.x - eye[0]) > 2.2 || Math.abs(n.z - eye[2]) > 2.2) continue;
      if (n.state !== 'routine' && n.state !== 'notice' || n.alert > 0.5 || n.sees) continue;
      const dx = P.pos[0] - n.x, dz = P.pos[2] - n.z, d = hyp(dx, dz), back = (dx * n.fwd[0] + dz * n.fwd[1]) / (d || 1);
      if (d < 1.8 && back < -0.2 && P.speedNow < 2.4) push(n.x, n.y + 1.6, n.z, 1.9, 'Choke out (hold E)', () => this.choke(n), 'pick', 0.7, n);
    }
  }
  choke(n) {
    const g = this.g, P = g.player; let next = 0.4;
    P.startPicking(n, 1, () => {
      n.knockOut(75); this.st.chokes++; g.stats.ko = (g.stats.ko || 0) + 1; g.progress.addXp(12, 'choked out'); g.flashText('CHOKED OUT'); g.noise(n.pos, 3, 'step', n);
      if (n.role !== 'bandit') g.rep.crime('assault', n.pos, { victim: n, range: 14 });
    }, 'Choking', { free: true, need: 1.25, watch: (dt) => {
      if (n.dead || n.state !== 'routine' && n.state !== 'notice' || n.alert > 0.7) { n.bark('Get off me!'); n.alert = 1; if (n.guard) { n.lastSeen = [...P.pos]; n.spotted(); } else n.scare(P.pos, 10); return false; }
      if (n.dist > 2.4) return false;
      next -= dt; if (next <= 0) { next = 0.4; g.noise(n.pos, 3.5, 'step', n); if (Math.random() < 0.07) { n.bark('Mmph!'); g.noise(n.pos, 13, 'combat', n); } }
      return true;
    } });
  }
  save() { return { st: this.st }; }
  load(d) { if (d?.st) Object.assign(this.st, d.st); }
}
