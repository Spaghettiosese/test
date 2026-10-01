// How the player looks, and what the world remembers of it. The hood hides the face, the cloak
// and the sword make a silhouette, blood and uniforms are things people notice. When a crime is
// seen, the witness remembers WHAT they saw, not who you are: a description. Guards who hear the
// description (it travels from the witness at a walking pace) will only recognise you if what you
// look like now still fits it. Change the hood, the cloak or the uniform and you are, for most
// purposes, somebody else.
import { GEAR } from './gear.js';

const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const UNIFORMS = {
  uni_watch: { kind: 'watch', faction: 'watch', label: 'Watch uniform' },
  uni_keep: { kind: 'keep', faction: 'keep', label: 'Keep livery' },
  uni_servant: { kind: 'servant', faction: 'servant', label: "Servant's livery" },
};
const SERVANTS = new Set(['cook', 'maid']);
const shares = (a, b) => a === b || (a === 'watch' && b === 'keep') || (a === 'keep' && b === 'watch');

export class Look {
  constructor(g) {
    this.g = g; g.reg?.('look', this);
    this.hood = true; this.hoodK = 1; this.bloody = 0; this.descs = []; this.seq = 0; this.changeT = 0; this.hoodBefore = true;
  }
  // ------------------------------------------------------------ what you look like right now
  traits() {
    const g = this.g, P = g.player, d = g.rep.disguise;
    return { hood: d ? false : this.hood, cloak: d ? 'uniform' : (g.gear.eq.body || 'traveller'), uniform: d ? (d.kind || d.faction) : null, armed: !!P.drawn, bloody: this.bloody > 0 };
  }
  describe(D) {
    const who = D.hood ? 'a hooded figure' : D.face ? 'a bare-faced traveller' : 'a figure';
    const wear = D.uniform ? ` wearing ${D.uniform === 'watch' ? 'a Watch uniform' : D.uniform === 'keep' ? 'Keep livery' : 'servant\'s livery'}` : D.cloak && D.cloak !== 'traveller' && D.cloak !== 'uniform' ? ` in a ${GEAR[D.cloak]?.name?.toLowerCase() || 'fine cloak'}` : ' in a dark travelling cloak';
    return `${who}${wear}${D.armed ? ', sword drawn' : ''}${D.bloody ? ', blood on their clothes' : ''}${D.face ? ' (face seen)' : ''}`;
  }
  // ------------------------------------------------------------ the hood
  toggleHood() {
    const g = this.g, P = g.player;
    if (g.rep.disguise) { g.toast('The uniform comes with its own cap'); return; }
    if (this.changeT > g.time || P.dead || P.carried) return;
    this.changeT = g.time + 0.5 * (1 - 0.5 * (P.mod?.chameleon || 0) / 2);
    this.hood = !this.hood; g.sfx.cloth?.(); P.playVm('Reach', 0.05);
    g.toast(this.hood ? 'Hood up: your face is hidden' : 'Hood down: your face can be seen');
  }
  // ------------------------------------------------------------ being remembered
  // what an observer at distance d could make out of you
  snapshot(src, dist) {
    const g = this.g, T = this.traits();
    const lit = g.lightAt(g.player.pos[0], 1.5, g.player.pos[2]) > 0.1 || dist < 5;
    return { id: ++this.seq, f: 'watch', face: !T.hood && dist < 12 && lit, hood: T.hood, cloak: T.cloak, uniform: T.uniform, armed: T.armed, bloody: T.bloody, t: g.time, at: src ? [src.x, src.z] : [g.player.pos[0], g.player.pos[2]], seen: src ? [src.id] : [], str: 1 };
  }
  add(D) {
    // a crime in the same clothes soon after another just sharpens the same description
    D.seen = D.seen || [];
    const same = this.descs.find((x) => x.f === D.f && x.hood === D.hood && x.cloak === D.cloak && x.uniform === D.uniform && this.g.time - x.t < 240);
    if (same) { same.t = D.t; same.str = 1; same.face = same.face || D.face; same.armed = D.armed; same.bloody = D.bloody; same.at = D.at; for (const id of D.seen) if (!same.seen.includes(id)) same.seen.push(id); return same; }
    this.descs.push(D); if (this.descs.length > 8) this.descs.shift(); return D;
  }
  // called by Reputation when witnesses saw something. Guards hold the description at once;
  // a villager carries it to a guard first.
  testify(witnesses, faction) {
    for (const n of witnesses) {
      const D = this.snapshot(n, n.dist ?? hyp(n.x - this.g.player.pos[0], n.z - this.g.player.pos[2])); D.f = faction;
      if (n.guard) this.add(D); else n.witnessDesc = D;
    }
  }
  delivered(witness, guard) { const D = witness.witnessDesc; if (!D) return; witness.witnessDesc = null; D.t = this.g.time; D.at = [guard.x, guard.z]; D.seen = [witness.id, guard.id]; this.add(D); }
  // does a guard know about this description yet? it spreads outward from where it was given
  known(n, D) {
    if (D.seen.includes(n.id) || n.faction === 'hunters') return true;   // saw it themselves, or are paid to know
    if (!n.guard) return !!D.poster && n.role === 'villager';             // townsfolk know what is on the notices
    if (!shares(n.faction, D.f)) return false;
    return this.g.time >= D.t + hyp(n.x - D.at[0], n.z - D.at[1]) / 5;
  }
  // 0..1: how well does what this observer can see fit what they have been told?
  match(n, dist) {
    if (!this.descs.length) return 0;
    const g = this.g, T = this.traits(); let best = 0;
    const bounty = Math.max(g.rep.total('watch'), g.rep.total('keep'), g.rep.total('bandits'));
    for (const D of this.descs) {
      if (!this.known(n, D)) continue;
      const face = D.face && !T.hood && dist < 16;
      let m;
      if (face) m = 1;
      else {
        let s = 0, w = 0; const cmp = (ok, wt) => { w += wt; if (ok) s += wt; };
        cmp(D.hood === T.hood, 0.3); cmp(D.cloak === T.cloak, 0.3); cmp((D.uniform || null) === (T.uniform || null), 0.25); cmp(D.armed === T.armed, 0.05); cmp(!!D.bloody === !!T.bloody, 0.1);
        m = (s / w) * 0.85; if (D.face && T.hood) m *= 0.9;
      }
      // the memory fades with time, and with a bounty that has been worked off
      const age = clamp(1 - (g.time - D.t) / 700, 0, 1);
      m *= age * clamp(0.35 + bounty / 60, 0, 1);
      if (m > best) best = m;
    }
    // elites look harder; a crowd hides you
    if (best > 0) { if (n.role === 'captain') best = Math.min(1, best * 1.15); if (g.social?.crowdK > 0) best *= 1 - 0.3 * g.social.crowdK; }
    return best;
  }
  // the whole household saw it: a description with a face on it that everybody already knows
  exposed(faction) { const g = this.g, D = this.snapshot(null, 3); D.f = faction; D.face = true; D.t = g.time - 200; this.add(D); }
  forget(faction = null) { this.descs = faction ? this.descs.filter((D) => !shares(D.f, faction)) : []; }
  // ------------------------------------------------------------ blood and washing
  bleed(secs) { this.bloody = Math.max(this.bloody, secs); }
  washSpots() {
    const L = this.g.level, out = [...(L.wells || [])];
    for (const f of L.fishSpots || []) out.push([f.x, f.z]);
    return out;
  }
  wash() {
    const g = this.g, P = g.player;
    P.startPicking(this, 1, () => { this.bloody = 0; g.toast('You scrub the blood away.'); g.sfx.splash?.(); g.progress.addXp(3, ''); }, 'Washing', { free: true, need: 2.4, watch: () => P.speedNow < 0.7 });
  }
  // ------------------------------------------------------------ uniforms
  uniformOf(n) {
    if (n.role === 'bandit' || n.role === 'hollow' || n.faction === 'hunters' || n.def?.boss) return null;
    if (n.guard && (n.faction === 'watch' || n.faction === 'keep')) return n.faction === 'keep' ? 'uni_keep' : 'uni_watch';
    if (SERVANTS.has(n.id)) return 'uni_servant';
    return null;
  }
  strip(n, item) {
    const g = this.g, P = g.player; let next = 0.5;
    P.startPicking(n, 1, () => {
      n.stripped = true; P.inv.add(item, 1); g.stats.stripped = (g.stats.stripped || 0) + 1; g.progress.addXp(8, 'a new face'); g.sfx.cloth?.();
      g.toast(`Took the ${UNIFORMS[item].label.toLowerCase()}. Wear it from the book (Gear tab) or with U.`);
    }, 'Stripping the clothes', { free: true, need: 2.8, watch: (dt) => { next -= dt; if (next <= 0) { next = 0.5; g.noise(n.pos, 3, 'step', n); } return P.speedNow < 0.7 && n.dist < 3; } });
  }
  hook(push, eye) {
    const g = this.g;
    if (this.bloody > 0) for (const [x, z] of this.washSpots()) if (hyp(x - eye[0], z - eye[2]) < 3.2) { push(x, 0.9, z, 3.4, 'Wash the blood from your clothes (hold E)', () => this.wash(), 'prop', 0.3, this); break; }
    for (const n of g.npcs) {
      if (n.stripped || (!n.dead && n.state !== 'ko') || Math.abs(n.x - eye[0]) > 2.6 || Math.abs(n.z - eye[2]) > 2.6) continue;
      const item = this.uniformOf(n); if (!item) continue;
      push(n.x, n.y + 0.4, n.z, 2.6, `Strip the ${UNIFORMS[item].label.toLowerCase()} (hold E)`, () => this.strip(n, item), 'body', 0.5, n);
    }
  }
  // put a uniform on (or take it off): the item stays in the pack either way
  wear(item) {
    const g = this.g, P = g.player, u = UNIFORMS[item]; if (!u || !P.inv.has(item)) return false;
    if (g.rep.disguise?.item === item) { this.takeOff(); return true; }
    if (P.carried || P.atk) { g.toast('Not now'); return false; }
    if (!g.rep.disguise) this.hoodBefore = this.hood;
    g.rep.wear(u.faction, u.label, u.kind, item); g.stats.disguises = (g.stats.disguises || 0) + 1; g.sfx.cloth?.(); P.playVm('Reach', 0.05);
    return true;
  }
  takeOff() { const g = this.g; if (!g.rep.disguise) return; g.rep.remove(); this.hood = this.hoodBefore; }
  // ------------------------------------------------------------ frame
  update(dt) {
    const g = this.g;
    if (this.bloody > 0) this.bloody = Math.max(0, this.bloody - dt * (g.weather?.cur?.rain > 0.5 ? 3 : 1));
    this.hoodK += ((this.hood && !g.rep.disguise ? 1 : 0) - this.hoodK) * Math.min(1, dt * 5);
    if (g.pix) g.pix.vig = 0.85 + (g.mode === 'play' ? 0.45 * this.hoodK : 0);
    this.t = (this.t || 0) - dt;
    if (this.t <= 0 && this.descs.length) {
      this.t = 2;
      const bounty = Math.max(g.rep.total('watch'), g.rep.total('keep'), g.rep.total('bandits'));
      this.descs = this.descs.filter((D) => g.time - D.t < 700 && (bounty > 0 || g.time - D.t < 20));
      for (const D of this.descs) D.poster = g.rep.total(D.f) >= 100;   // a price this high gets nailed up in the square
    }
  }
  save() { return { hood: this.hood, bloody: this.bloody, descs: this.descs, seq: this.seq, drawn: !!this.g.player?.drawn }; }
  load(d) { if (!d) return; this.g.player?.setDrawn?.(!!d.drawn); this.hood = d.hood !== false; this.hoodK = this.hood ? 1 : 0; this.bloody = d.bloody || 0; this.descs = (d.descs || []).map((D) => ({ ...D, seen: D.seen || [], t: Math.min(D.t, this.g.time) })); this.seq = d.seq || 0; }
}
