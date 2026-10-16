// KUMO QUEST: a fixed-screen cafe platformer. Kumo the cloud-cat waiter hops across shelves collecting the orders,
// stomps dust bunnies, dodges dripping spills, then rings the bell at Mika's counter. Four levels, three lives.
// Arrows move, E (or Up) jumps; or drag the pointer (tap above Kumo to jump).
import { register } from '../../core/registry.js';
import { drawTextC, drawText } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { mulberry32 } from '../../rng.js';
import { Arcade, W, H, rect, disc, clamp, hudBar } from './kit.js';
import { axis } from '../../input.js';

export const KQ_CFG = { lives: 3, goal: 4200, perTicket: 70, winBonus: 20, bg1: '#2a1c2e', bg2: '#ffcf8a', help: 'ARROWS MOVE   E JUMP   TAP ABOVE TO JUMP', botCap: 100 };
const FLOOR = 200, G = 520, JUMP = 218, LEVEL_T = 32;
// platforms [x, y, w] (top surface y); spacing 40 so one jump (about 46) climbs a rung
export const LEVELS = [
  { plats: [[30, 160, 90], [200, 160, 90], [110, 120, 100]], dishes: [[60, 160], [250, 160], [160, 120]], bunnies: [[0, 120, 1]], spills: 0, bell: [292, 200] },
  { plats: [[20, 160, 80], [220, 160, 80], [110, 120, 100], [30, 80, 70], [220, 80, 70]], dishes: [[50, 160], [260, 160], [160, 120], [60, 80], [250, 80]], bunnies: [[0, 140, 1], [1, 100, -1]], spills: 1, bell: [292, 200] },
  { plats: [[16, 160, 70], [130, 160, 60], [234, 160, 70], [70, 120, 70], [180, 120, 70], [120, 80, 80]], dishes: [[40, 160], [265, 160], [100, 120], [215, 120], [160, 80], [160, 160]], bunnies: [[0, 150, 1], [3, 70, -1], [2, 100, 1]], spills: 2, bell: [292, 200] },
  { plats: [[16, 160, 60], [112, 160, 96], [244, 160, 60], [60, 120, 70], [190, 120, 70], [20, 80, 60], [130, 80, 60], [240, 80, 60]], dishes: [[40, 160], [160, 160], [275, 160], [95, 120], [225, 120], [45, 80], [160, 80], [265, 80]], bunnies: [[0, 130, 1], [4, 80, -1], [1, 60, 1], [3, 70, 1]], spills: 3, bell: [292, 200] },
];

export class KumoQuest extends Arcade {
  constructor(game, opts) { super(game, opts, KQ_CFG); this.rng = mulberry32((Math.random() * 1e9) | 0); }
  start() { this.level = 0; this.loadLevel(); this.coffee = 0; }
  loadLevel() {
    const L = LEVELS[this.level];
    this.plats = [[0, FLOOR, W], ...L.plats];
    this.dishes = L.dishes.map(([x, y], i) => ({ x, y: y - 8, got: false, k: i % 3 }));
    this.bunnies = L.bunnies.map(([pi, , dir]) => { const pl = this.plats[pi] || this.plats[0]; return { x: pl[0] + pl[2] / 2, y: pl[1], pl, dir, sp: 18 + this.level * 7, dead: 0 }; });
    this.spills = []; this.spillAcc = 0; this.spillN = L.spills;
    this.k = { x: 30, y: FLOOR, vx: 0, vy: 0, on: true, face: 1, inv: 1 };
    this.timeLeft = LEVEL_T; this.bellOn = false; this.fx = []; this.banner = 1.8; this.clear = 0;
    const cp = this.plats[2]; this.coffeeItem = this.level >= 1 && cp ? { x: cp[0] + 10, y: cp[1] - 8, got: false } : null;
  }
  hurt(why) {
    const k = this.k; if (k.inv > 0) return;
    this.lives--; sfx('wrong'); this.points = Math.max(0, this.points - 50);
    if (this.lives <= 0) { this.end(false, why || 'The cafe was too busy!'); return; }
    this.level = this.level; const keep = this.points, lives = this.lives; this.loadLevel(); this.points = keep; this.lives = lives; this.k.inv = 2;
  }
  support(k, prevY) {
    for (const [px, py, pw] of this.plats) if (k.x > px - 3 && k.x < px + pw + 3 && prevY <= py + 1 && k.y >= py) return py;
    return null;
  }
  tick(dt, input) {
    const k = this.k, a = axis(input), boost = this.coffee > 0 ? 1.4 : 1;
    this.coffee = Math.max(0, this.coffee - dt); k.inv = Math.max(0, k.inv - dt); this.banner = Math.max(0, this.banner - dt);
    let dir = a.x, jump = input.pressed.has('e') || input.pressed.has(' ') || input.pressed.has('arrowup') || input.pressed.has('w');
    if (!dir && input.down) { const dx = input.mx - k.x; dir = Math.abs(dx) > 6 ? Math.sign(dx) : 0; if (input.justDown && input.my < k.y - 20) jump = true; }
    if (this.clear > 0) { this.clear -= dt; if (this.clear <= 0) { this.level++; if (this.level >= LEVELS.length) { this.points += 500; this.end(true, 'Mika closes the cafe with a smile!'); return; } const keep = this.points, lives = this.lives; this.loadLevel(); this.points = keep; this.lives = lives; } return; }
    k.vx = dir * 84 * boost; if (dir) k.face = dir;
    if (jump && k.on) { k.vy = -JUMP * (this.coffee > 0 ? 1.06 : 1); k.on = false; sfx('blip'); }
    const prev = k.y; k.vy += G * dt; k.x = clamp(k.x + k.vx * dt, 8, W - 8); k.y += k.vy * dt;
    k.on = false;
    if (k.vy >= 0) { const s = this.support(k, prev); if (s !== null) { k.y = s; k.vy = 0; k.on = true; } }
    if (k.y > FLOOR) { k.y = FLOOR; k.vy = 0; k.on = true; }
    // timer
    this.timeLeft -= dt; if (this.timeLeft <= 0) { this.hurt('Orders took too long!'); return; }
    // dishes + coffee
    for (const d of this.dishes) if (!d.got && Math.abs(d.x - k.x) < 9 && Math.abs(d.y - (k.y - 6)) < 11) { d.got = true; this.points += 100 + this.level * 25; sfx('coin'); for (let i = 0; i < 4; i++) this.fx.push({ x: d.x, y: d.y, vx: (this.rng() - 0.5) * 60, vy: -30 - this.rng() * 30, life: 0.4 }); }
    const c = this.coffeeItem; if (c && !c.got && Math.abs(c.x - k.x) < 9 && Math.abs(c.y - (k.y - 6)) < 11) { c.got = true; this.coffee = 7; this.points += 50; sfx('star'); }
    if (!this.bellOn && this.dishes.every((d) => d.got)) { this.bellOn = true; this.banner = 1.6; sfx('bell'); }
    const L = LEVELS[this.level];
    if (this.bellOn && Math.abs(L.bell[0] - k.x) < 14 && k.y >= FLOOR - 4) { this.points += 250 + Math.round(this.timeLeft) * 12; this.clear = 1.6; sfx('chime'); this.banner = 0; }
    // bunnies
    for (const b of this.bunnies) {
      if (b.dead > 0) { b.dead -= dt; continue; }
      const [px, , pw] = b.pl; b.x += b.dir * b.sp * dt; if (b.x < px + 6 || b.x > px + pw - 6) { b.dir *= -1; b.x = clamp(b.x, px + 6, px + pw - 6); }
      if (Math.abs(b.x - k.x) < 9 && k.y > b.y - 12 && k.y < b.y + 8) {
        if (k.vy > 20 && k.y - 6 < b.y - 4) { b.dead = 6; k.vy = -150; this.points += 75; sfx('pop'); } else this.hurt('Bumped by a dust bunny!');
      }
    }
    // spills drip from the ceiling
    this.spillAcc += dt;
    if (this.spillN > 0 && this.spillAcc > 2.4 - this.level * 0.3) { this.spillAcc = 0; this.spills.push({ x: 20 + this.rng() * (W - 40), y: 24, warn: 0.9, vy: 0 }); }
    for (const s of this.spills) {
      if (s.warn > 0) { s.warn -= dt; continue; }
      s.vy += 300 * dt; s.y += s.vy * dt;
      if (Math.abs(s.x - k.x) < 6 && s.y > k.y - 14 && s.y < k.y) { this.hurt('Splash!'); s.y = 999; }
      for (const [px, py, pw] of this.plats) if (s.x > px && s.x < px + pw && s.y >= py && s.y - s.vy * dt < py) s.y = 999;
    }
    this.spills = this.spills.filter((s) => s.y < 230);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 150 * dt; f.life -= dt; }
    this.fx = this.fx.filter((f) => f.life > 0);
  }
  kumo(g, x, y, face, inv, t) {
    if (inv > 0 && Math.floor(t * 14) % 2) return;
    x = Math.round(x); y = Math.round(y);
    rect(g, 'rgba(0,0,0,.25)', x - 7, y - 1, 14, 2);
    disc(g, '#3a2a30', x - 4, y - 8, 6); disc(g, '#3a2a30', x + 4, y - 8, 6); disc(g, '#3a2a30', x, y - 11, 7);
    disc(g, '#fff6e6', x - 4, y - 8, 5); disc(g, '#fff6e6', x + 4, y - 8, 5); disc(g, '#fff6e6', x, y - 11, 6);
    rect(g, '#3a2a30', x - 6, y - 19, 3, 4); rect(g, '#3a2a30', x + 3, y - 19, 3, 4);
    rect(g, '#3a2a30', x - 3 + face, y - 12, 1, 2); rect(g, '#3a2a30', x + 2 + face, y - 12, 1, 2); rect(g, '#f7a0a8', x - 1 + face, y - 9, 2, 1);
    rect(g, K.coral[2], x - 5, y - 5, 10, 2); rect(g, K.paper[4], x + face * 6 - 3, y - 12, 6, 2);
  }
  draw(g) {
    if (this.phase === 'attract') {
      return this.attract(g, 'KUMO QUEST', 'DELIVER THE ORDERS AT CAFE KUMO', (gg, t) => { this.kumo(gg, 160 + Math.sin(t * 2) * 40, 90, 1, 0, t); rect(gg, K.wood[2], 100, 92, 120, 4); });
    }
    rect(g, '#4a3040', 0, 20, W, H - 20); rect(g, '#5a3a4a', 0, 20, W, 70);
    for (let i = 0; i < 8; i++) { rect(g, K.butter[3], 20 + i * 40, 36, 14, 18); rect(g, '#7fb2e0', 21 + i * 40, 37, 12, 16); rect(g, K.paper[4], 26 + i * 40, 37, 1, 16); }
    for (let i = 0; i < 6; i++) { rect(g, K.coral[3], 30 + i * 52, 22, 2, 8); disc(g, K.butter[3], 31 + i * 52, 32, 3); }
    rect(g, K.woodDark[2], 0, FLOOR, W, H - FLOOR); rect(g, K.wood[2], 0, FLOOR, W, 3);
    for (const [px, py, pw] of this.plats.slice(1)) { rect(g, '#2a1a22', px - 1, py - 1, pw + 2, 8); rect(g, K.wood[3], px, py, pw, 4); rect(g, K.wood[4], px, py, pw, 1); rect(g, K.wood[1], px + 4, py + 4, 3, 3); rect(g, K.wood[1], px + pw - 7, py + 4, 3, 3); }
    const L = LEVELS[this.level];
    // Mika's counter + bell
    rect(g, K.wood[1], L.bell[0] - 14, FLOOR - 14, 28, 14); rect(g, K.wood[3], L.bell[0] - 14, FLOOR - 16, 28, 3);
    const lit = this.bellOn && Math.floor(this.clock * 4) % 2; disc(g, '#3a2a30', L.bell[0], FLOOR - 21, 5); disc(g, lit ? K.butter[4] : K.metal[2], L.bell[0], FLOOR - 21, 4);
    for (const d of this.dishes) if (!d.got) { const bob = Math.round(Math.sin(this.clock * 4 + d.x) * 1.5), x = Math.round(d.x), y = Math.round(d.y) + bob; disc(g, '#3a2a30', x, y, 6); disc(g, [K.coral[3], K.butter[3], K.mint[3]][d.k], x, y, 5); rect(g, '#fff', x - 2, y - 3, 2, 2); if (d.k === 1) rect(g, K.ribbon[2], x - 1, y - 8, 2, 3); }
    const c = this.coffeeItem; if (c && !c.got) { rect(g, '#3a2a30', c.x - 5, c.y - 5, 10, 10); rect(g, K.paper[4], c.x - 4, c.y - 4, 8, 8); rect(g, '#6b3a22', c.x - 3, c.y - 3, 6, 3); rect(g, K.paper[4], c.x + 4, c.y - 2, 3, 4); }
    for (const b of this.bunnies) { if (b.dead > 0) continue; const x = Math.round(b.x), y = Math.round(b.y); rect(g, 'rgba(0,0,0,.25)', x - 6, y - 1, 12, 2); disc(g, '#3a2a30', x, y - 5, 7); disc(g, K.paper[1], x, y - 5, 6); rect(g, '#3a2a30', x - 4, y - 14, 2, 5); rect(g, '#3a2a30', x + 2, y - 14, 2, 5); rect(g, '#3a2a30', x - 3, y - 6, 1, 2); rect(g, '#3a2a30', x + 2, y - 6, 1, 2); }
    for (const s of this.spills) { const x = Math.round(s.x); if (s.warn > 0) { if (Math.floor(s.warn * 10) % 2) { rect(g, K.coral[2], x - 4, 26, 8, 3); rect(g, K.coral[2], x - 1, 29, 2, 4); } } else { rect(g, '#3a2a30', x - 3, Math.round(s.y) - 7, 6, 9); rect(g, '#8fb8e8', x - 2, Math.round(s.y) - 6, 4, 7); } }
    this.kumo(g, this.k.x, this.k.y, this.k.face, this.k.inv, this.clock);
    for (const f of this.fx) rect(g, K.butter[3], Math.round(f.x), Math.round(f.y), 2, 2);
    const got = this.dishes.filter((d) => d.got).length;
    hudBar(g, `LEVEL ${this.level + 1}`, this.points, this.lives, `ORDERS ${got}/${this.dishes.length}`);
    rect(g, '#1a1228', 6, 24, 90, 4); rect(g, this.timeLeft < 8 ? K.coral[2] : K.mint[2], 7, 25, Math.round(88 * clamp(this.timeLeft / LEVEL_T, 0, 1)), 2);
    if (this.coffee > 0) drawText(g, 'COFFEE BOOST', 238, 24, K.butter[3], 1, null);
    if (this.banner > 0 && this.phase === 'play') drawTextC(g, this.bellOn ? 'RING THE BELL!' : `ORDERS UP: LEVEL ${this.level + 1}`, 160, 100, K.butter[3], 2, null);
    if (this.clear > 0) drawTextC(g, 'ORDER DELIVERED!', 160, 100, K.mint[3], 2, null);
    this.overlay(g);
  }
}
register('minigame', 'sv2_kumo_quest', {
  title: 'Kumo Quest', resultTitle: 'ARCADE', music: 'minigame',
  make: (game, o) => new KumoQuest(game, o),
  bot(m, t, inp) {
    m.autoplay = true;
    if (m.phase !== 'play') { inp.pressed = new Set(['e']); return inp; }
    const k = m.k, L = LEVELS[m.level], rung = (y) => Math.round((FLOOR - y) / 40);
    let tgt = m.bellOn ? { x: L.bell[0], y: FLOOR } : null;
    if (!tgt) { let bd = 1e9; for (const d of m.dishes) if (!d.got) { const s = Math.abs(d.x - k.x) + Math.abs(d.y + 8 - k.y) * 1.5; if (s < bd) { bd = s; tgt = { x: d.x, y: d.y + 8 }; } } }
    if (!tgt) return inp;
    const cur = rung(k.y), want = rung(tgt.y);
    let goX = tgt.x, jump = false;
    if (want > cur && k.on) {
      // climb: find the closest platform exactly one rung above
      let bp = null, bd = 1e9; for (const [px, py, pw] of m.plats) if (py === k.y - 40) { const cx = clamp(k.x, px + 8, px + pw - 8), d = Math.abs(cx - k.x); if (d < bd) { bd = d; bp = cx; } }
      if (bp !== null) { goX = bp; if (Math.abs(bp - k.x) < 6) jump = true; }
    }
    if (want < cur) { if (!k.on) goX = k.x + k.face * 40; else for (const [px, py, pw] of m.plats) if (Math.abs(py - k.y) < 3 && k.x >= px - 3 && k.x <= px + pw + 3 && py < FLOOR) { goX = k.x - px < px + pw - k.x ? px - 10 : px + pw + 10; } }
    for (const b of m.bunnies) if (b.dead <= 0 && Math.abs(b.y - k.y) < 6 && Math.abs(b.x - k.x) < 26 && k.on) jump = true;
    const dx = goX - k.x;
    inp.keys = new Set(Math.abs(dx) > 4 ? [dx > 0 ? 'arrowright' : 'arrowleft'] : []);
    inp.pressed = new Set(jump ? ['e'] : []);
    return inp;
  },
});
