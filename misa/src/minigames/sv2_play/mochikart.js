// MOCHI KART: a top-down lane racer. Three laps down Lantern Lane, cones, puddles and slow rival karts, coins and boost pads,
// a lap timer and a ghost of your best run. Left/right (or drag) to steer, E for a boost. Three bumper hearts.
import { register } from '../../core/registry.js';
import { drawTextC, drawText } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { mulberry32 } from '../../rng.js';
import { Arcade, W, H, rect, disc, clamp, hash, ePressed, hudBar } from './kit.js';
import { axis } from '../../input.js';

const RX0 = 70, RX1 = 250, LANES = 5, LW = (RX1 - RX0) / LANES, PY = 172, LAPS = 3, LAP_LEN = 2300, PAR = 50;
export const MK_CFG = { lives: 3, goal: 3600, perTicket: 110, winBonus: 15, bg1: '#16243a', bg2: '#9ad0ff', help: 'LEFT RIGHT STEER   E BOOST   DRAG TO STEER', botCap: 100 };
export const laneX = (i) => RX0 + LW * (i + 0.5);
const colors = [K.coral[2], K.sky[2], K.mint[2], K.lilac[2], K.butter[2]];

export class MochiKart extends Arcade {
  constructor(game, opts) { super(game, opts, MK_CFG); this.rng = mulberry32((Math.random() * 1e9) | 0); this.ghost = (opts && opts.ghost) || null; }
  start() {
    Object.assign(this, { x: laneX(2), dist: 0, v: 120, boost: 1, boosting: 0, slow: 0, slide: 0, inv: 0, obs: [], gen: 260, lap: 1, lapT: 0, laps: [], coins: 0, rec: [], recT: 0, countdown: 2.4, finish: false, dnf: false });
  }
  diff() { return 1 + (this.lap - 1) * 0.35; }
  generate() {
    while (this.gen < this.dist + 520) {
      const d = this.diff(), gap = 150 - d * 25 + this.rng() * 70;
      this.gen += gap; const at = this.gen, lanes = [0, 1, 2, 3, 4];
      if (at > LAP_LEN * LAPS - 80) break;
      const nBlock = this.rng() < 0.3 * d ? 3 : this.rng() < 0.7 ? 2 : 1, blocked = [];
      for (let i = 0; i < nBlock; i++) { const l = lanes.splice(Math.floor(this.rng() * lanes.length), 1)[0]; blocked.push(l); }
      for (const l of blocked) {
        const r = this.rng();
        const kind = r < 0.2 * d ? 'kart' : r < 0.55 ? 'cone' : 'puddle';
        this.obs.push({ k: kind, d: at, lane: l, x: laneX(l), c: colors[Math.floor(this.rng() * colors.length)], sp: 0.55 + this.rng() * 0.2, hit: false });
      }
      if (this.rng() < 0.55) { const l = lanes[Math.floor(this.rng() * lanes.length)]; for (let i = 0; i < 3; i++) this.obs.push({ k: 'coin', d: at + i * 26, lane: l, x: laneX(l), hit: false }); }
      else if (this.rng() < 0.18) { const l = lanes[Math.floor(this.rng() * lanes.length)]; this.obs.push({ k: 'pad', d: at, lane: l, x: laneX(l), hit: false }); }
    }
  }
  yOf(o) { return PY - (o.d - this.dist); }
  tick(dt, input) {
    if (this.countdown > 0) { this.countdown -= dt; return; }
    const a = axis(input);
    let dir = a.x;
    if (!dir && input.down && !input.justDown) { const dx = input.mx - this.x; dir = Math.abs(dx) > 5 ? Math.sign(dx) : 0; }
    this.x = clamp(this.x + (dir * 150 - (this.slide > 0 ? Math.sin(this.t * 18) * 60 : 0)) * dt, RX0 + 10, RX1 - 10);
    this.slide = Math.max(0, this.slide - dt); this.slow = Math.max(0, this.slow - dt); this.inv = Math.max(0, this.inv - dt); this.boosting = Math.max(0, this.boosting - dt);
    if (ePressed(input) && this.boost > 0.3 && this.boosting <= 0) { this.boosting = 0.9; this.boost -= 0.3; sfx('whistle'); }
    if (this.boosting <= 0) this.boost = Math.min(1, this.boost + dt * 0.12);
    const base = 165 + (this.lap - 1) * 22 + Math.min(40, this.t * 0.7);
    const target = base * (this.boosting > 0 ? 1.55 : 1) * (this.slow > 0 ? 0.5 : 1);
    this.v += (target - this.v) * Math.min(1, dt * 2.5);
    this.dist += this.v * dt; this.lapT += dt;
    this.generate();
    for (const o of this.obs) {
      if (o.k === 'kart') o.d += 62 * o.sp * dt; // rival karts trundle ahead slowly
      const y = this.yOf(o);
      if (o.hit || y < PY - 10 || y > PY + 12) continue;
      const dx = Math.abs(o.x - this.x), reach = o.k === 'coin' ? 12 : o.k === 'pad' ? 14 : o.k === 'kart' ? 15 : 11;
      if (dx > reach) continue;
      o.hit = true;
      if (o.k === 'coin') { this.coins++; this.points += 50; sfx('coin'); }
      else if (o.k === 'pad') { this.boosting = 1.1; sfx('star'); this.points += 20; }
      else if (o.k === 'cone') { this.slow = 0.8; this.v *= 0.6; sfx('blip'); this.points = Math.max(0, this.points - 15); }
      else if (o.k === 'puddle') { this.slide = 0.9; this.slow = 0.5; sfx('splash'); }
      else if (o.k === 'kart' && this.inv <= 0) { this.lives--; this.inv = 1.6; this.slow = 1.2; this.v *= 0.4; sfx('wrong'); if (this.lives <= 0) { this.dnf = true; this.finalize(false, 'Mochi Kart broke down!'); } }
    }
    this.obs = this.obs.filter((o) => this.yOf(o) < H + 20);
    // ghost recording
    this.recT += dt; if (this.recT >= 0.2) { this.recT -= 0.2; this.rec.push([Math.round(this.dist), Math.round(this.x)]); }
    if (this.dist >= this.lap * LAP_LEN) {
      this.laps.push(this.lapT); this.points += 250; this.lapT = 0; sfx('chime');
      if (this.lap >= LAPS) { this.finalize(true, `Finished in ${this.t.toFixed(1)} seconds!`); return; }
      this.lap++; this.lapFlash = 1.6;
    }
    if (this.lapFlash > 0) this.lapFlash -= dt;
  }
  finalize(won, msg) {
    if (won) this.points += Math.round(Math.max(0, PAR - this.t) * 45) + this.lives * 150 + 400;
    else this.points += Math.round((this.dist / (LAP_LEN * LAPS)) * 600);
    this.time = this.t; this.end(won, msg);
  }
  extraResult() { return { time: this.won ? this.time : 0, ghost: this.won ? this.rec : null, coins: this.coins }; }
  ghostAt() {
    const gh = this.ghost; if (!gh || !gh.pts || !gh.pts.length) return null;
    const i = Math.min(gh.pts.length - 1, Math.floor(this.t / 0.2)), a = gh.pts[i], b = gh.pts[Math.min(gh.pts.length - 1, i + 1)], f = (this.t / 0.2) - i;
    return { d: a[0] + (b[0] - a[0]) * f, x: a[1] + (b[1] - a[1]) * f };
  }
  kart(g, x, y, c, flip, blink) {
    if (blink && Math.floor(this.clock * 14) % 2) return;
    x = Math.round(x); y = Math.round(y);
    rect(g, 'rgba(0,0,0,.3)', x - 8, y + 9, 16, 3);
    rect(g, '#2a2030', x - 9, y - 7, 4, 7); rect(g, '#2a2030', x + 5, y - 7, 4, 7); rect(g, '#2a2030', x - 9, y + 3, 4, 7); rect(g, '#2a2030', x + 5, y + 3, 4, 7);
    rect(g, '#2a2030', x - 7, y - 9, 14, 20); rect(g, c, x - 6, y - 8, 12, 18); rect(g, K.paper[4], x - 1, y - 8, 2, 18);
    disc(g, '#3a2a30', x, y + 1, 5); disc(g, '#fff6e6', x, y + 1, 4);
    rect(g, '#3a2a30', x - 4, y - 4, 2, 2); rect(g, '#3a2a30', x + 2, y - 4, 2, 2); rect(g, '#e8943a', x - 3, y - 2, 2, 2);
    if (flip) rect(g, K.butter[3], x - 6, y + 10, 12, 2);
  }
  draw(g) {
    if (this.phase === 'attract') {
      return this.attract(g, 'MOCHI KART', 'THREE LAPS. BEAT YOUR GHOST.', (gg, t) => { this.kart(gg, 130, 88 + Math.sin(t * 3) * 2, K.coral[2]); this.kart(gg, 190, 80, K.sky[2]); if (this.opts.best) drawTextC(gg, `BEST ${this.opts.best.toFixed(1)}S`, 160, 66, K.mint[3], 1, null); });
    }
    rect(g, '#5d9a52', 0, 20, W, H - 20);
    const sc = this.dist || 0;
    for (let i = 0; i < 18; i++) { const y = ((i * 41 + sc) % (H + 20)); const x = hash(i, 5) < 0.5 ? 14 + hash(i, 6) * 40 : 262 + hash(i, 7) * 40; rect(g, '#3f7a40', x, y, 6, 6); rect(g, '#7cc16a', x, y, 3, 3); if (i % 5 === 0) { rect(g, K.coral[2], x - 1, y - 8, 6, 8); rect(g, K.butter[4], x, y - 7, 4, 6); } }
    rect(g, '#7b7488', RX0, 20, RX1 - RX0, H - 20); rect(g, '#cfc7d8', RX0 - 3, 20, 3, H - 20); rect(g, '#cfc7d8', RX1, 20, 3, H - 20);
    for (let i = 0; i < 12; i++) { const off = Math.round(sc % 40); const y = i * 40 - 40 + off; for (let l = 1; l < LANES; l++) rect(g, K.paper[3], RX0 + l * LW - 1, y, 2, 16); }
    const startD = this.lap * LAP_LEN; const fy = PY - (startD - sc);
    for (const line of [PY + 0 - (0 - sc)]) { if (line > 20 && line < H) for (let i = 0; i < 18; i++) rect(g, (i + (Math.floor(i / 2))) % 2 ? '#1a1228' : '#fff', RX0 + i * 10, line, 10, 8); }
    if (fy > 20 && fy < H) for (let i = 0; i < 18; i++) rect(g, i % 2 ? '#1a1228' : '#fff', RX0 + i * 10, fy, 10, 8);
    const gh = this.phase === 'play' ? this.ghostAt() : null;
    if (gh) { const gy = PY - (gh.d - sc); if (gy > 10 && gy < H + 10) { g.globalAlpha = 0.45; this.kart(g, gh.x, gy, K.paper[4]); g.globalAlpha = 1; } }
    for (const o of [...this.obs].sort((a, b) => b.d - a.d)) {
      const y = Math.round(this.yOf(o)); if (y < 12 || y > H + 12 || o.hit && o.k !== 'cone' && o.k !== 'kart' && o.k !== 'puddle') continue;
      const x = Math.round(o.x);
      if (o.k === 'cone') { rect(g, '#3a2a30', x - 6, y - 1, 12, 4); rect(g, K.coral[2], x - 4, y - 7, 8, 7); rect(g, K.paper[4], x - 3, y - 4, 6, 2); rect(g, K.coral[2], x - 2, y - 10, 4, 3); }
      else if (o.k === 'puddle') { rect(g, '#4f7fb8', x - 11, y - 3, 22, 7); rect(g, '#8fb8e8', x - 8, y - 2, 12, 2); }
      else if (o.k === 'kart') this.kart(g, x, y, o.c, true);
      else if (o.k === 'coin') { disc(g, '#3a2a30', x, y, 5); disc(g, K.butter[3], x, y, 4); rect(g, K.butter[4], x - 1, y - 2, 2, 4); }
      else if (o.k === 'pad') { rect(g, K.sky[3], x - 11, y - 4, 22, 9); rect(g, '#fff', x - 6, y - 2, 4, 5); rect(g, '#fff', x, y - 2, 4, 5); }
    }
    if (this.phase !== 'attract') this.kart(g, this.x, PY, K.coral[2], false, this.inv > 0);
    if (this.boosting > 0) for (let i = 0; i < 4; i++) rect(g, K.butter[3], this.x - 5 + i * 3, PY + 12 + (i % 2) * 4, 2, 5);
    hudBar(g, `LAP ${Math.min(LAPS, this.lap)}/${LAPS}`, this.points, this.lives, `${(this.t || 0).toFixed(1)}S`);
    rect(g, '#1a1228', 6, 26, 8, 52); rect(g, K.mint[2], 7, 27 + Math.round(50 * (1 - this.boost)), 6, Math.round(50 * this.boost));
    drawText(g, 'E', 7, 80, K.paper[3], 1, null);
    if (this.countdown > 0) drawTextC(g, this.countdown > 1.6 ? '3' : this.countdown > 0.8 ? '2' : '1', 160, 90, K.butter[3], 3, null);
    else if (this.t < 1) drawTextC(g, 'GO!', 160, 90, K.mint[3], 3, null);
    if (this.lapFlash > 0) drawTextC(g, `LAP ${this.lap}`, 160, 90, K.butter[3], 2, null);
    this.overlay(g);
  }
}
register('minigame', 'sv2_mochi_kart', {
  title: 'Mochi Kart', resultTitle: 'ARCADE', music: 'minigame',
  make: (game, o) => new MochiKart(game, o),
  bot(m, t, inp) {
    m.autoplay = true;
    if (m.phase !== 'play') { inp.pressed = new Set(['e']); return inp; }
    // pick the lane with the longest clear run ahead, nearest to where we are
    let best = 2, bs = -1e9;
    for (let l = 0; l < LANES; l++) {
      let clear = 1e9;
      for (const o of m.obs) { if (o.lane !== l || o.k === 'coin' || o.k === 'pad' || o.hit) continue; const ahead = m.dist - 0 < o.d ? o.d - m.dist : -1; if (ahead > -12 && ahead < clear) clear = ahead; }
      const s = Math.min(clear, 300) - Math.abs(laneX(l) - m.x) * 0.6;
      if (s > bs) { bs = s; best = l; }
    }
    const dx = laneX(best) - m.x;
    inp.keys = new Set(dx > 5 ? ['arrowright'] : dx < -5 ? ['arrowleft'] : []);
    inp.pressed = new Set(m.boost > 0.9 && Math.sin(t * 3) > 0.8 ? ['e'] : []);
    return inp;
  },
});
