// Mountain & Meadow minigames, all with bots: bath etiquette quiz, downhill ski/sled, lake rowing and the dawn sea of clouds.
import { register } from '../../core/registry.js';
import { drawText, drawTextC, wrapPx } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';
import { axis } from '../../input.js';
import { sfx } from '../../audio.js';

const W = 320, H = 224, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const rngOf = (game, tag) => (game && game.rngFor ? game.rngFor(tag) : Math.random);
const press = (input, ...k) => Object.assign(input, { pressed: new Set(k), keys: new Set(k) });

// ------------------------------------------------------------------ bath etiquette quiz
const QS = [
  ['Wash your body before you get into the bath.', true], ['Dip your towel into the bath water.', false], ['Wear your swimsuit in the bath.', false], ['Tie up long hair so it stays out of the water.', true],
  ['Dive in and splash for fun.', false], ['Dry off a little before you return to the changing room.', true], ['Soap up inside the bath itself.', false], ['Keep your voice low and calm.', true],
  ['Take photos of the other bathers.', false], ['Drink some water after your soak.', true],
];
export class Etiquette {
  constructor(game) {
    const rng = rngOf(game, 'sv4_etiq'), pool = QS.slice();
    this.qs = []; while (this.qs.length < 6) this.qs.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    Object.assign(this, { i: 0, t: 0, fb: 0, right: 0, done: false, score: 0, last: null, tt: 0 });
  }
  answer(yes) {
    if (this.fb > 0 || this.done) return;
    const ok = this.qs[this.i][1] === yes; this.last = ok; this.fb = 0.8; if (ok) { this.right++; sfx('chime'); } else sfx('wrong');
  }
  update(dt, input) {
    if (this.done) return;
    this.tt += dt;
    if (this.fb > 0) { this.fb -= dt; if (this.fb <= 0) { this.i++; this.t = 0; if (this.i >= this.qs.length) this.finish(); } return; }
    this.t += dt;
    const k = input.pressed;
    if (k.has('arrowleft') || k.has('a')) this.answer(false); else if (k.has('arrowright') || k.has('d')) this.answer(true);
    else if (input.justDown) this.answer(input.mx >= W / 2);
    if (this.t > 10 && this.fb <= 0) { this.last = false; this.fb = 0.8; }
  }
  finish() { this.done = true; this.score = this.right / this.qs.length; this.result = { text: `${this.right} OF ${this.qs.length} CORRECT` }; }
  draw(g) {
    rect(g, '#2a3a52', 0, 0, W, H); rect(g, '#e8dcc8', 0, 150, W, 74); for (let i = 0; i < 14; i++) rect(g, '#ffffff22', (hash(i, 1, 1) * 300 + this.tt * 6) % 320, 20 + hash(i, 2, 1) * 100 - (this.tt * 5 + i * 9) % 30, 18, 4);
    rect(g, '#1a1228', 0, 0, W, 16); drawText(g, 'BATH ETIQUETTE', 6, 5, K.butter[3], 1, null); drawText(g, `${Math.min(this.i + 1, this.qs.length)}/${this.qs.length}`, 280, 5, K.paper[4], 1, null);
    if (this.i < this.qs.length) {
      rect(g, K.paper[4], 24, 36, 272, 62); rect(g, K.ink[2], 24, 36, 272, 2);
      wrapPx(this.qs[this.i][0], 252).slice(0, 3).forEach((l, j) => drawText(g, l, 34, 46 + j * 12, K.ink[1], 1, null));
      rect(g, K.mint[2], 30, 118, 120, 40); rect(g, K.coral[2], 170, 118, 120, 40);
      drawTextC(g, 'YES, PROPER', 90, 134, K.paper[4], 1, null); drawTextC(g, 'NO, RUDE', 230, 134, K.paper[4], 1, null);
      drawText(g, '< A / D >', 130, 168, K.ink[2], 1, null); rect(g, K.sky[3], 30, 108, Math.round(260 * (1 - this.t / 10)), 4);
    }
    if (this.fb > 0) drawTextC(g, this.last ? 'CORRECT!' : 'NOT QUITE!', 160, 190, this.last ? K.forest[2] : K.ribbon[1], 2);
  }
}
register('minigame', 'yk_etiquette', { title: 'Bath etiquette', make: (g) => new Etiquette(g), resultTitle: 'MANNERS CHECK', bot: (m, t, input) => (m.fb <= 0 && m.t > 0.4 && !m.done ? press(input, m.qs[m.i][1] ? 'arrowright' : 'arrowleft') : input) });

// ------------------------------------------------------------------ downhill ski / sled
export class Downhill {
  constructor(game, opts = {}) {
    const rng = rngOf(game, 'sv4_ski'), sled = opts.mode === 'sled';
    this.mode = sled ? 'sled' : 'ski'; this.len = 2400; this.d = 0; this.x = 160; this.speed = sled ? 120 : 110; this.slow = 0; this.t = 0; this.passed = 0; this.missed = 0; this.bumps = 0; this.gates = []; this.trees = []; this.done = false; this.score = 0;
    let cx = 160;
    for (let r = 1; r * 60 < this.len; r++) {
      if (r % 2 === 0) { cx = clamp(cx + (rng() - 0.5) * 120, 60, 260); this.gates.push({ d: r * 60, cx, hit: false }); }
      else { const prev = this.gates[this.gates.length - 1], nx = clamp((prev ? prev.cx : 160) + (rng() - 0.5) * 120, 60, 260); for (let k = 0; k < 2; k++) { const x = 20 + rng() * 280; if (Math.abs(x - (prev ? prev.cx : 160)) > 44 && Math.abs(x - nx) > 44) this.trees.push({ d: r * 60, x, hit: false }); } }
    }
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; const a = axis(input).x; if (a) this.x = clamp(this.x + a * 130 * dt, 14, 306); else if (input.down) this.x = clamp(this.x + clamp(input.mx - this.x, -1, 1) * 130 * dt, 14, 306);
    this.slow = Math.max(0, this.slow - dt); const v = this.speed * (this.slow > 0 ? 0.5 : 1); const prev = this.d; this.d += v * dt;
    for (const gt of this.gates) if (!gt.hit && gt.d >= prev && gt.d < this.d) { gt.hit = true; if (Math.abs(this.x - gt.cx) < 30) { this.passed++; sfx('blip'); } else this.missed++; }
    for (const tr of this.trees) if (!tr.hit && tr.d >= prev && tr.d < this.d && Math.abs(this.x - tr.x) < 13) { tr.hit = true; this.bumps++; this.slow = 0.9; sfx('thud'); }
    if (this.d >= this.len) this.finish();
  }
  finish() { this.done = true; this.score = clamp(0.25 + 0.55 * (this.passed / Math.max(1, this.gates.length)) + 0.2 * (1 - Math.min(8, this.bumps) / 8), 0, 1); this.result = { text: `${this.passed} GATES, ${this.bumps} BUMPS` }; }
  draw(g) {
    rect(g, '#a8c8e8', 0, 0, W, 40); rect(g, '#e8f0fa', 0, 40, W, H); rect(g, '#cfdcef', 0, 0, W, 14);
    const py = 170, vis = (d) => py - (d - this.d) * 1.1;
    for (let i = 0; i < 24; i++) rect(g, '#ffffff', (hash(i, 3, 3) * 320 + this.d * 0.3) % 320, (hash(i, 4, 3) * 224 + this.d * 1.1) % 224, 2, 2);
    for (const tr of this.trees) { const y = vis(tr.d); if (y > 20 && y < 240) { rect(g, K.wood[1], tr.x - 1, y - 2, 3, 6); g.fillStyle = K.forest[2]; g.beginPath(); g.moveTo(tr.x, y - 18); g.lineTo(tr.x - 8, y); g.lineTo(tr.x + 8, y); g.fill(); rect(g, '#fff', tr.x - 3, y - 12, 6, 2); } }
    for (const gt of this.gates) { const y = vis(gt.d); if (y > 20 && y < 240) { const c = gt.hit ? (Math.abs(gt.cx - this.x) < 60 ? K.mint[2] : K.charcoal[3]) : K.ribbon[2]; rect(g, K.ink[2], gt.cx - 30, y - 8, 2, 10); rect(g, K.ink[2], gt.cx + 28, y - 8, 2, 10); rect(g, c, gt.cx - 28, y - 8, 7, 5); rect(g, c, gt.cx + 21, y - 8, 7, 5); } }
    const lean = Math.sign(axis({ keys: new Set() }).x);
    rect(g, K.coral[2], this.x - 4, py - 10 + lean, 8, 10); rect(g, K.skinLight[3], this.x - 3, py - 15, 6, 5); rect(g, K.navy[2], this.x - 4, py - 17, 8, 3);
    if (this.mode === 'ski') { rect(g, K.ink[2], this.x - 6, py, 3, 10); rect(g, K.ink[2], this.x + 3, py, 3, 10); } else rect(g, K.wood[2], this.x - 8, py, 16, 4);
    rect(g, '#1a1228', 0, 0, W, 16); drawText(g, this.mode === 'ski' ? 'SKI RUN' : 'SLED RUN', 6, 5, K.butter[3], 1, null); drawText(g, `GATES ${this.passed}`, 140, 5, K.paper[4], 1, null); rect(g, K.sky[3], 220, 6, Math.round(90 * this.d / this.len), 4);
    if (this.slow > 0) drawTextC(g, 'BUMP!', this.x, py - 30, K.ribbon[1], 1, null);
  }
}
export function downhillBot(m, t, input) {
  let tx = m.x;
  const gate = m.gates.find((q) => !q.hit && q.d > m.d - 4 && q.d - m.d < 150);
  if (gate) tx = gate.cx;
  const tree = m.trees.find((q) => !q.hit && q.d - m.d > -2 && q.d - m.d < 44 && Math.abs(q.x - m.x) < 16);
  if (tree && !(gate && Math.abs(gate.cx - tree.x) < 20)) tx = tree.x + (m.x >= tree.x ? 22 : -22);
  const k = []; if (tx > m.x + 3) k.push('arrowright'); else if (tx < m.x - 3) k.push('arrowleft');
  input.keys = new Set(k); input.pressed = new Set(); return input;
}
register('minigame', 'tk_downhill', { title: 'Downhill', make: (g, o) => new Downhill(g, o), resultTitle: 'SNOW GLIDE!', bot: downhillBot });

// ------------------------------------------------------------------ rowing
export class Rowing {
  constructor(game, opts = {}) { Object.assign(this, { t: 0, p: 0, beat: opts.calm === false ? 0.8 : 0.7, side: '', perfect: 0, strokes: 0, crabs: 0, done: false, score: 0, limit: 42, flash: 0 }); }
  stroke(side) {
    this.strokes++; const ph = (this.t % this.beat), off = Math.min(ph, this.beat - ph);
    if (side === this.side) { this.crabs++; this.p = Math.max(0, this.p - 0.012); this.flash = -0.4; sfx('wrong'); } else if (off < 0.16) { this.p += 0.03; this.perfect++; this.flash = 0.4; sfx('blip'); } else { this.p += 0.014; this.flash = 0.2; }
    this.side = side;
  }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash -= Math.sign(this.flash) * dt;
    const k = input.pressed; if (k.has('arrowleft') || k.has('a')) this.stroke('L'); else if (k.has('arrowright') || k.has('d')) this.stroke('R'); else if (input.justDown) this.stroke(input.mx < W / 2 ? 'L' : 'R');
    if (this.p >= 1 || this.t >= this.limit) { this.done = true; this.score = clamp(Math.min(1, this.p) * 0.75 + 0.25 * (this.perfect / Math.max(1, this.strokes)), 0, 1); this.result = { text: `${Math.round(Math.min(1, this.p) * 100)}% OF THE LAKE` }; }
  }
  draw(g) {
    rect(g, '#7fc4e0', 0, 0, W, H); for (let i = 0; i < 30; i++) rect(g, '#ffffff55', (hash(i, 1, 6) * 330 + this.t * 8) % 330, 30 + hash(i, 2, 6) * 190, 10, 1);
    rect(g, '#5a9a58', 0, 0, W, 26); rect(g, '#5a9a58', 0, 200, W, 24);
    const bx = 30 + this.p * 250; rect(g, K.wood[2], bx - 20, 120, 40, 12); rect(g, K.wood[3], bx - 20, 120, 40, 3); rect(g, K.coral[2], bx - 4, 112, 8, 8); rect(g, K.skinLight[3], bx - 3, 107, 6, 5);
    const sw = Math.sin(this.t * 6) * (this.flash ? 6 : 1); rect(g, K.wood[1], bx - 14, 128 + sw, 2, 14); rect(g, K.wood[1], bx + 12, 128 - sw, 2, 14);
    rect(g, K.coral[2], 276, 96, 6, 6); rect(g, K.paper[4], 276, 102, 6, 34); drawText(g, 'FINISH', 262, 140, K.paper[4], 1, null);
    rect(g, '#1a1228', 0, 0, W, 16); drawText(g, 'LAKE ROWING', 6, 5, K.butter[3], 1, null); drawText(g, `${Math.max(0, Math.ceil(this.limit - this.t))}S`, 290, 5, K.paper[4], 1, null);
    const ph = (this.t % this.beat) / this.beat, r = 22 - ph * 16; g.strokeStyle = '#fff'; g.beginPath(); g.arc(160, 180, Math.max(6, r), 0, 7); g.stroke(); rect(g, '#fff', 156, 176, 8, 8);
    drawTextC(g, 'ALTERNATE LEFT / RIGHT ON THE BEAT', 160, 206, K.paper[4], 1, null);
  }
}
register('minigame', 'ml_rowing', { title: 'Lake rowing', make: (g, o) => new Rowing(g, o), resultTitle: 'ROWED!', bot: (m, t, input) => { const n = Math.floor((m.t + 0.02) / m.beat); if (n > (m.bn ?? -1)) { m.bn = n; return press(input, m.side === 'L' ? 'arrowright' : 'arrowleft'); } input.pressed = new Set(); input.keys = new Set(); return input; } });

// ------------------------------------------------------------------ dawn sea of clouds
export class Horizon {
  constructor(game, opts = {}) { Object.assign(this, { t: 0, fog: !!opts.fog, cx: 160, cy: 120, shots: [], cool: 0, done: false, score: 0, ph: hash(Math.floor((game && game.day) || 1), 1, 1) * 6 }); this.tx = 160; this.ty = 110; }
  get sun() { return clamp(this.t / 16, 0, 1); }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.cool -= dt;
    this.tx = 160 + Math.sin(this.t * 0.5 + this.ph) * 90; this.ty = 118 + Math.cos(this.t * 0.37 + this.ph) * 32;
    const a = axis(input); this.cx = clamp(this.cx + a.x * 95 * dt, 10, 310); this.cy = clamp(this.cy + a.y * 95 * dt, 40, 190);
    if (input.down && !input.justDown) { this.cx += clamp(input.mx - this.cx, -1, 1) * 80 * dt; this.cy += clamp(input.my - this.cy, -1, 1) * 80 * dt; }
    if ((input.pressed.has(' ') || input.pressed.has('e') || input.justDown) && this.cool <= 0) this.shoot();
    if (this.shots.length >= 3 || this.t > 24) this.finish();
  }
  shoot() {
    const d = Math.hypot(this.cx - this.tx, this.cy - this.ty), al = clamp(1 - d / 70, 0, 1), s = this.sun, light = s < 0.3 ? 0.4 : s > 0.92 ? 0.6 : 1;
    this.shots.push(al * light * (this.fog ? 1 : 0.92)); this.cool = 1; sfx('camera');
  }
  finish() { this.done = true; const s = this.shots.slice().sort((a, b) => b - a); this.score = clamp((s[0] || 0) * 0.6 + (s.reduce((a, b) => a + b, 0) / 3) * 0.4, 0, 1); this.result = { text: `${this.shots.length} SHOTS TAKEN` }; }
  draw(g) {
    const s = this.sun;
    rect(g, s < 0.4 ? '#2a2f5a' : '#e8a070', 0, 0, W, 90); rect(g, s < 0.4 ? '#4a4a7a' : '#f4c888', 0, 90, W, 40); rect(g, '#8aa8d8', 0, 0, W, 30);
    g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(160, 130 - s * 70, 16 + s * 4, 0, 7); g.fill();
    for (let r = 0; r < 12; r++) for (let i = 0; i < 9; i++) { rect(g, r % 2 ? '#f4f8fc' : '#e4ecf6', ((i * 50 + r * 23 + this.t * (3 + r * 0.4)) % 380) - 30, 126 + r * 8, 52, 10); }
    rect(g, '#00000033', 0, 0, 0, 0);
    g.strokeStyle = '#fff6a0'; g.beginPath(); g.arc(this.tx, this.ty, 18, 0, 7); g.stroke(); g.strokeStyle = '#ff9aa8'; g.beginPath(); g.arc(this.tx, this.ty, 10, 0, 7); g.stroke();
    g.strokeStyle = '#fff'; g.strokeRect(this.cx - 22, this.cy - 15, 44, 30); rect(g, '#fff', this.cx - 1, this.cy - 5, 2, 10); rect(g, '#fff', this.cx - 5, this.cy - 1, 10, 2);
    rect(g, '#1a1228', 0, 0, W, 16); drawText(g, 'SEA OF CLOUDS', 6, 5, K.butter[3], 1, null); drawText(g, `SHOTS ${this.shots.length}/3`, 250, 5, K.paper[4], 1, null);
    if (this.cool > 0.5) { rect(g, '#ffffff66', 0, 0, W, H); }
    drawTextC(g, 'ARROWS MOVE THE FRAME, SPACE TAKES THE PHOTO', 160, 208, K.paper[4], 1, null);
  }
}
register('minigame', 'tk_horizon', { title: 'Sea of clouds', make: (g, o) => new Horizon(g, o), resultTitle: 'WHAT A VIEW', bot: (m, t, input) => {
  const k = []; if (m.tx > m.cx + 2) k.push('arrowright'); else if (m.tx < m.cx - 2) k.push('arrowleft'); if (m.ty > m.cy + 2) k.push('arrowdown'); else if (m.ty < m.cy - 2) k.push('arrowup');
  input.keys = new Set(k); input.pressed = new Set(); if (m.sun >= 0.45 && m.sun <= 0.88 && m.cool <= 0 && Math.hypot(m.tx - m.cx, m.ty - m.cy) < 8) input.pressed = new Set([' ']); return input;
} });
