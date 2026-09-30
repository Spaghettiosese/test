// Three set-piece fights. Red Cael (the bandit chief) grows bolder as he bleeds and drinks when
// near death; the Warden of the Choir wakes in the mine's cavern and slams the floor (jump or
// dash to avoid it) and calls hollows; the Drowned Saint rises at the sunken shrine, blinks behind
// you and weeps homing tears that a sword can cut down. Bosses cannot be assassinated or choked
// out, and each leaves a trophy for the cabin's shelf.
import * as E from '../../engine/index.js';
import { NPC } from './npc.js';

const hyp = Math.hypot;
const DEFS = {
  warden: { id: 'boss_warden', name: 'The Warden of the Choir', banner: 'THE WARDEN WAKES', trophy: 'warden', hp: 460, dmg: 1.9, at: [-241, 156.5], rect: [-247, 145.5, -227, 159], arena: [-237.5, 152], voice: 0.35, height: 1.42, build: 1.5, skin: 'ashen', cloth: '#1a2a34', hollowType: 'brute',
    loot: [['gold', 320], ['gem', 2], ['choircrown', 1], ['whetstone', 2]] },
  saint: { id: 'boss_saint', name: 'The Drowned Saint', banner: 'THE SAINT RISES', trophy: 'saint', hp: 400, dmg: 1.35, at: [-190, -225.5], circle: [-190, -232, 9], arena: [-190, -232], voice: 1.35, height: 1.2, build: 0.95, skin: 'ashen', cloth: '#7aa0b8', hollowType: null,
    loot: [['gold', 260], ['ring', 1], ['drownedveil', 1], ['sainttear', 1]] },
};
const DIFF = [0.7, 1, 1.3];

export class Boss {
  constructor(g) {
    this.g = g; g.reg?.('boss', this);
    this.defeated = new Set(); this.b = {}; this.orbs = []; this.cael = { key: 'cael', name: 'Red Cael', npc: null, p: 0, done: false }; this.t = 0; this.barK = 0; this.seq = 0;
    this.orbGeo = E.sphere({ radius: 0.17, widthSegments: 8, heightSegments: 6 }); this.orbMat = new E.Material({ name: 'Tear', color: '#bfe8ff', emissive: '#6ad0ff', emissiveStrength: 6, roughness: 0.2 });
    let el = document.getElementById('bossbar');
    if (!el) { el = document.createElement('div'); el.id = 'bossbar'; el.className = 'hud bossbar px'; el.hidden = true; el.innerHTML = '<b id="bossName"></b><div class="bar hp"><i id="bossFill"></i></div>'; document.body.appendChild(el); }
    this.el = el; this.nameEl = el.querySelector('#bossName'); this.fillEl = el.querySelector('#bossFill');
  }
  // ------------------------------------------------------------ waking them
  inTrigger(d) {
    const P = this.g.player.pos;
    if (d.rect) return P[0] > d.rect[0] && P[0] < d.rect[2] && P[2] > d.rect[1] && P[2] < d.rect[3];
    return hyp(P[0] - d.circle[0], P[2] - d.circle[1]) < d.circle[2];
  }
  spawn(key) {
    const g = this.g, d = DEFS[key], q = g.nav.nearestWalkable(d.at[0], d.at[1], 4) || d.at, poi = 'boss_' + key;
    g.level.pois[poi] = { name: poi, x: q[0], z: q[1], y: g.nav.floorAt(q[0], q[1]), yaw: 0, type: 'stand', approach: [q[0], q[1]] };
    const n = new NPC(g, { id: d.id, name: d.name, role: 'hollow', hollowType: d.hollowType, boss: true, speedMul: key === 'warden' ? 0.95 : 1.05, hostile: true, pos: [q[0], q[1]], yaw: 0, hp: d.hp, dmg: d.dmg, block: 0, eyes: 1.4, weapon: null, detail: 0.6, loot: d.loot, schedule: [{ h0: 0, h1: 24, poi, act: 'stand' }],
      spec: { outfit: 'hollow', skin: d.skin, hair: { style: 'bald' }, glowEyes: true, colors: { cloth: d.cloth, hose: '#14181c', cloth2: '#20282e' }, height: d.height, build: d.build, weapon: null, voice: d.voice } });
    n.maxHp = d.hp; g.npcs.push(n); n.rising = 2.4; n.setAnim('Cower', 0.1); n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos];
    this.b[key] = { key, npc: n, def: d, spawn: [q[0], q[1]], cd: 4, sum: 0, frenzy: false, slam: null, blinkCd: 6, tearCd: 3, done: false, name: d.name };
    g.ui.flashBanner(d.banner, 2600, true); g.sfx.hollowCry?.(n.pos); g.sfx.boom?.(0.7); g.shake = Math.max(g.shake || 0, 0.6); g.emitBurst?.([q[0], 0.1, q[1]], 'dust');
  }
  summon(n, k) { const g = this.g; for (let i = 0; i < k; i++) { const a = Math.random() * 6.28, q = g.nav.nearestWalkable(n.x + Math.sin(a) * 5, n.z + Math.cos(a) * 5, 4); if (q) g.story.spawnHollow(q[0], q[1], true, false, Math.random() < 0.4 ? 'screamer' : null); } g.sfx.hollowCry?.(n.pos); g.toast('The hollows answer the call'); }
  // ------------------------------------------------------------ effects
  ring(x, z, r) {
    const g = this.g; for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283; g.flames.emit([x + Math.cos(a) * r, 0.12, z + Math.sin(a) * r], { count: 1, color: [3.6, 0.5, 0.35, 0.9], colorEnd: [1.2, 0.1, 0.1, 0], size: 0.11, grow: 0.3, spread: 0.05, up: 0.35, life: 0.5, jitter: 0.03 }); }
  }
  doSlam(b) {
    const g = this.g, P = g.player, n = b.npc, s = b.slam, diff = DIFF[g.difficulty ?? 1];
    g.sfx.boom?.(0.8); g.shake = Math.max(g.shake || 0, 0.85); g.emitBurst?.([s.x, 0.1, s.z], 'dust'); g.noise([s.x, 0, s.z], 34, 'crash');
    for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283; g.smoke.emit([s.x + Math.cos(a) * 1.5, 0.15, s.z + Math.sin(a) * 1.5], { count: 1, color: [0.5, 0.45, 0.4, 0.5], colorEnd: [0.4, 0.36, 0.32, 0], size: 0.25, grow: 3, spread: 0.1, up: 0.2, life: 0.9, jitter: 0.1, vx: Math.cos(a) * 5, vz: Math.sin(a) * 5 }); }
    const d = hyp(P.pos[0] - s.x, P.pos[2] - s.z), air = !P.cc.grounded && P.pos[1] > g.nav.floorAt(P.pos[0], P.pos[2]) + 0.35;
    if (d < s.r && !air && P.dashT <= 0) { const r = P.incoming(40 * diff, [s.x, s.z], { from: n, unblockable: true }); if (r === 'hit') { P.stagger = Math.max(P.stagger, 0.7); g.flashText?.('CRUSHED'); } } else if (d < s.r + 1) g.flashText?.('DODGED');
  }
  fireTears(b, k) {
    const g = this.g, n = b.npc, P = g.player.pos, base = Math.atan2(P[0] - n.x, P[2] - n.z);
    for (let i = 0; i < k; i++) {
      const a = base + (i - (k - 1) / 2) * 0.38, m = new E.Mesh(this.orbGeo, this.orbMat, 'tear'); m.castShadow = false; g.scene.add(m);
      const o = { mesh: m, p: [n.x, n.y + 1.5, n.z], v: [Math.sin(a) * 6.5, 0.4, Math.cos(a) * 6.5], life: 6.5, from: n }; m.position.set(o.p); this.orbs.push(o);
    }
    g.sfx.whisper?.(); g.sfx.hollowCry?.(n.pos);
  }
  blink(b) {
    const g = this.g, n = b.npc, P = g.player, f = P.flat, nav = g.nav;
    const q = nav.nearestWalkable(P.pos[0] - f[0] * 3.0, P.pos[2] - f[1] * 3.0, 3); if (!q || nav.isBlocked(q[0], q[1])) return;
    g.emitBurst?.([n.x, n.y + 0.2, n.z], 'poof'); n.x = q[0]; n.z = q[1]; n.y = nav.floorAt(q[0], q[1]); n.stopMove(); n.stagger = Math.max(n.stagger, 0.45); n.state = 'stagger'; g.emitBurst?.([n.x, n.y + 0.2, n.z], 'poof');
    g.sfx.whisper?.(); g.flashText?.('SHE IS BEHIND YOU');
  }
  // the player's sword cuts tears out of the air
  slashOrbs(eye, f, reach) {
    let any = false;
    for (const o of this.orbs) { const dx = o.p[0] - eye[0], dy = o.p[1] - eye[1], dz = o.p[2] - eye[2], d = Math.hypot(dx, dy, dz); if (d < reach + 0.4 && (dx * f[0] + dy * f[1] + dz * f[2]) / (d || 1) > 0.25) { o.life = 0; any = true; this.g.spark(o.p, [0, 1, 0], 10); this.g.flashText?.('CUT'); } }
    return any;
  }
  // ------------------------------------------------------------ each boss's rules
  special(b, dt) {
    const g = this.g, n = b.npc, fight = n.state === 'chase' || n.state === 'attack' || n.state === 'stagger'; if (!fight || n.rising > 0) return;
    const hp = n.hp / n.maxHp;
    if (b.key === 'warden') {
      for (const th of [0.75, 0.5, 0.25]) if (hp < th && !b['s' + th]) { b['s' + th] = true; this.summon(n, 2); }
      if (hp < 0.3 && !b.frenzy) { b.frenzy = true; n.def.speedMul = 1.3; g.flashText('THE WARDEN IS ENRAGED'); }
      if (b.slam) {
        b.slam.t -= dt; this.ring(b.slam.x, b.slam.z, b.slam.r); n.speed = 0; n.stagger = Math.max(n.stagger, 0.2);
        if (b.slam.t <= 0) { this.doSlam(b); b.slam = null; b.cd = b.frenzy ? 3.6 : 6.2; n.state = 'chase'; n.stagger = 0; }
        return;
      }
      b.cd -= dt;
      if (b.cd <= 0 && n.dist < 8.5 && n.sees) { b.slam = { t: b.frenzy ? 0.85 : 1.25, x: n.x, z: n.z, r: 5.6 }; n.atk = null; n.stopMove(); n.state = 'stagger'; n.stagger = b.slam.t; n.ch.upper.playOnce('Hands Up', { fadeIn: 0.12, fadeOut: 0.6 }); g.sfx.hollowCry?.(n.pos); g.toast('Jump or dash clear of the ring'); }
    } else if (b.key === 'saint') {
      b.tearCd -= dt; b.blinkCd -= dt;
      if (b.tearCd <= 0 && n.dist > 3.5 && n.dist < 28 && n.sees) { this.fireTears(b, hp < 0.5 ? 5 : 3); b.tearCd = hp < 0.5 ? 3.6 : 5.2; }
      if (b.blinkCd <= 0 && n.dist > 5) { this.blink(b); b.blinkCd = hp < 0.5 ? 6 : 9; }
      if (hp < 0.5 && !b.weep) { b.weep = true; g.flashText('THE SAINT WEEPS'); n.def.speedMul = 1.25; }
    }
  }
  updateCael() {
    const g = this.g, c = this.cael; if (!c.npc) c.npc = g.npcs.find((n) => n.id === 'cael'); const n = c.npc; if (!n) return null;
    if (n.dead) { if (!c.done) { c.done = true; g.ui.flashBanner('RED CAEL FALLS', 2200, true); g.progress.addXp(200, 'the bandit chief'); g.hideout?.addTrophy('cael'); g.stats.bosses = (g.stats.bosses || 0) + 1; } return null; }
    n.def.brave = true; n.maxHp = n.maxHp || n.def.hp || 120;
    if (!c.loot) { c.loot = true; n.loot.push(['redbrand', 1]); }
    const fight = (n.state === 'chase' || n.state === 'attack') && n.dist < 40; if (!fight) return null;
    const hp = n.hp / n.maxHp;
    if (hp < 0.66 && c.p < 1) { c.p = 1; n.def.dmg *= 1.2; n.bark('Is that all you have?'); g.toast('Cael fights harder'); }
    if (hp < 0.4 && c.p < 2) { c.p = 2; n.hp = Math.min(n.maxHp, n.hp + n.maxHp * 0.22); n.bark('Red Cael does not bleed out in a ditch!'); g.flashText('CAEL DRINKS'); g.sfx.drink?.(); }
    if (hp < 0.22 && c.p < 3) { c.p = 3; n.bark('To me! To ME!'); let k = 0; for (const o of g.npcs) if (o.role === 'bandit' && !o.dead && o !== n && o.dist < 70 && o.state !== 'chase' && o.state !== 'attack') { o.state = 'chase'; o.alert = 1; o.lastSeen = [...g.player.pos]; k++; } if (k) g.toast('Cael\'s men come running'); }
    return c;
  }
  dead(b) {
    const g = this.g, d = b.def; b.done = true; this.defeated.add(b.key); g.ui.flashBanner(d.name.toUpperCase() + ' FALLS', 2800, true); g.sfx.bell?.(3); g.slowmo = 0.9;
    g.progress.addXp(key2xp(b.key), 'a great foe'); g.hideout?.addTrophy(d.trophy); g.stats.bosses = (g.stats.bosses || 0) + 1; g.toast('Search the body: the fallen leave gifts.');
    for (const o of this.orbs) o.life = 0;
  }
  reset() { // the player fell: the boss forgets and heals
    for (const b of Object.values(this.b)) { const n = b.npc; if (n.dead) continue; n.hp = n.maxHp; n.x = b.spawn[0]; n.z = b.spawn[1]; n.state = 'routine'; n.alert = 0; n.stopMove(); n.atk = null; n.slotKey = ''; b.slam = null; b.cd = 4; b.frenzy = false; n.def.speedMul = b.key === 'warden' ? 0.95 : 1.05; b.sum = 0; for (const k of ['s0.75', 's0.5', 's0.25']) b[k] = false; }
    for (const o of this.orbs) o.life = 0;
  }
  // ------------------------------------------------------------ frame
  update(dt) {
    const g = this.g; if (g.mode !== 'play' && g.mode !== 'talk') { return; }
    this.t += dt;
    for (const key of Object.keys(DEFS)) if (!this.b[key] && !this.defeated.has(key) && this.inTrigger(DEFS[key])) this.spawn(key);
    let show = this.updateCael();
    for (const b of Object.values(this.b)) {
      const n = b.npc; if (n.dead) { if (!b.done) this.dead(b); continue; }
      this.special(b, dt);
      if (n.dist < 55 && (n.state === 'chase' || n.state === 'attack' || n.state === 'stagger') && n.rising <= 0) show = b;
    }
    // tears
    const P = g.player, pp = [P.pos[0], P.pos[1] + 1.0, P.pos[2]];
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i]; o.life -= dt;
      const dx = pp[0] - o.p[0], dy = pp[1] - o.p[1], dz = pp[2] - o.p[2], d = Math.hypot(dx, dy, dz) || 1, sp = 7.2, k = Math.min(1, dt * 1.5);
      o.v[0] += (dx / d * sp - o.v[0]) * k; o.v[1] += (dy / d * sp - o.v[1]) * k; o.v[2] += (dz / d * sp - o.v[2]) * k;
      const step = [o.v[0] * dt, o.v[1] * dt, o.v[2] * dt], len = Math.hypot(...step) || 1e-4;
      const h = g.world.raycast(o.p, [step[0] / len, step[1] / len, step[2] / len], len + 0.1, { ignore: P.cc.body, mask: 0xffff & ~(2 | 4 | 8) });
      if (h) o.life = 0; else { o.p[0] += step[0]; o.p[1] += step[1]; o.p[2] += step[2]; }
      o.mesh.position.set(o.p);
      if (Math.random() < dt * 25) g.sparks.emit(o.p, { count: 1, color: [2, 4, 6, 0.9], colorEnd: [0.4, 1, 2, 0], size: 0.05, grow: 0.3, spread: 0.05, up: 0, life: 0.4, jitter: 0.03 });
      if (d < 0.8 && !P.dead) { const r = P.incoming(12 * DIFF[g.difficulty ?? 1], [o.p[0] - o.v[0], o.p[2] - o.v[2]], { from: o.from }); if (r === 'hit') g.flashText?.('TEAR'); o.life = 0; }
      if (o.life <= 0) { g.scene.remove(o.mesh); this.orbs.splice(i, 1); }
    }
    // the bar
    if (show) { const n = show.npc; this.nameEl.textContent = show.name; this.fillEl.style.width = Math.max(0, n.hp / n.maxHp * 100) + '%'; this.el.hidden = false; this.barK = 1; }
    else if (this.barK > 0) { this.barK -= dt * 2; if (this.barK <= 0) this.el.hidden = true; }
  }
  save() { return { d: [...this.defeated], c: this.cael.done }; }
  load(d) { if (!d) return; this.defeated = new Set(d.d || []); this.cael.done = !!d.c; }
}
const key2xp = (k) => ({ warden: 320, saint: 280 }[k] || 200);
