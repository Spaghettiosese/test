// Close-up chore minigames. Each has update(dt,input), draw(g,sprite), done, score (0..1).
// Every one works with mouse OR keyboard (arrows/WASD + Space/E).
import { Cursor, act, actHeld } from './input.js';
import { drawText, drawTextC } from './font.js';
import { sfx } from './audio.js';
import { pick, range, clamp } from './rng.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
const timeScore = (t, par, slack) => clamp(1 - (t - par) / slack, 0.34, 1);

// ======================= DISHES =======================
const PX = 160, PY = 116, PR = 50, CELL = 5;
export class DishGame {
  constructor(rng, { plates = 4 } = {}) {
    Object.assign(this, { rng, total: plates, left: plates, phase: 'scrub', t: 0, time: 0, done: false, score: 0, rack: 0, rise: 0, flash: 0, bubbles: [], title: 'Wash the dishes' });
    this.cur = new Cursor(PX + 40, PY + 20, 110, [20, 30, 300, 200]);
    this.hint = 'HOLD MOUSE / SPACE AND SCRUB';
    this.newPlate();
  }
  newPlate() {
    const cells = [], n = Math.ceil((PR * 2) / CELL);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i + 0.5) * CELL - PR, y = (j + 0.5) * CELL - PR;
      if (Math.hypot(x, y) < PR - 3) cells.push({ x, y, d: 0 });
    }
    const blobs = 5 + Math.floor(this.rng() * 3);
    for (let b = 0; b < blobs; b++) {
      const a = this.rng() * Math.PI * 2, r = this.rng() * (PR - 18), bx = Math.cos(a) * r, by = Math.sin(a) * r, br = range(this.rng, 8, 15);
      for (const c of cells) if (Math.hypot(c.x - bx, c.y - by) < br) c.d = 1;
    }
    this.cells = cells;
    this.init = cells.reduce((a, c) => a + c.d, 0) || 1;
    this.clean = 0; this.phase = 'scrub';
  }
  update(dt, input) {
    if (this.done) return;
    this.time += dt; this.t += dt;
    this.bubbles = this.bubbles.filter((b) => (b.life -= dt) > 0);
    for (const b of this.bubbles) { b.y -= 12 * dt; b.x += Math.sin(b.life * 8 + b.x) * 6 * dt; }
    this.cur.update(dt, input);
    if (this.flash > 0) this.flash -= dt;
    if (this.phase === 'scrub') {
      const sp = this.cur.speedNow;
      if (actHeld(input) && sp > 15) {
        const lx = this.cur.x - PX, ly = this.cur.y - PY, k = Math.min(1, sp / 80);
        for (const c of this.cells) if (c.d > 0 && Math.hypot(c.x - lx, c.y - ly) < 11) c.d = Math.max(0, c.d - dt * 2.4 * k);
        if (Math.random() < 0.5) this.bubbles.push({ x: this.cur.x + range(this.rng, -8, 8), y: this.cur.y + range(this.rng, -6, 4), life: range(this.rng, 0.5, 1.1), r: this.rng() < 0.3 ? 2 : 1 });
        if (Math.random() < 0.15) sfx('scrub');
      }
      this.clean = 1 - this.cells.reduce((a, c) => a + c.d, 0) / this.init;
      if (this.clean >= 0.97) { this.phase = 'rinse'; sfx('chime'); }
    } else if (this.phase === 'rinse') {
      if (act(input)) { this.phase = 'rise'; this.rise = 0; this.flash = 0.4; sfx('pop'); }
    } else if (this.phase === 'rise') {
      this.rise += dt;
      if (this.rise > 0.85) {
        this.rack++; this.left--; sfx('star');
        if (this.left <= 0) { this.done = true; this.score = timeScore(this.time, this.total * 12, this.total * 16); }
        else this.newPlate();
      }
    }
  }
  draw(g) {
    rect(g, '#d8ecef', 0, 0, 320, 224);
    for (let y = 0; y < 224; y += 16) for (let x = (y / 16) % 2 ? 0 : 8; x < 320; x += 16) rect(g, '#c6e0e4', x, y, 8, 8);
    // basin
    rect(g, '#8a9aab', 20, 26, 280, 176); rect(g, '#b9c6d2', 24, 30, 272, 168); rect(g, '#9ed0e8', 28, 34, 264, 160);
    rect(g, '#b7e0f2', 28, 34, 264, 6);
    // tap
    rect(g, '#8a9aab', 150, 4, 20, 8); rect(g, '#b9c6d2', 156, 12, 8, 24); rect(g, '#8a9aab', 154, 34, 12, 4);
    // dirty stack (left) and rack (right)
    for (let i = 0; i < this.left - (this.phase === 'rise' ? 0 : 1); i++) { rect(g, '#fffaf0', 36, 150 - i * 6, 38, 5); rect(g, '#e6d7bd', 36, 153 - i * 6, 38, 2); rect(g, '#b58a5a', 42 + (i * 7) % 20, 150 - i * 6, 4, 2); }
    rect(g, '#7a4f3a', 244, 44, 46, 4); rect(g, '#7a4f3a', 244, 44, 3, 40); rect(g, '#7a4f3a', 287, 44, 3, 40);
    for (let i = 0; i < this.rack; i++) { rect(g, '#fffaf0', 249 + i * 9, 48, 6, 32); rect(g, '#dff5ff', 250 + i * 9, 50, 2, 28); }
    // plate
    let oy = 0;
    if (this.phase === 'rise') oy = -Math.min(1, this.rise / 0.85) * 82;
    const px = this.phase === 'rise' ? PX + (Math.min(1, this.rise / 0.85)) * (247 + this.rack * 9 - PX) : PX;
    disc(g, '#e6d7bd', px, PY + oy + 2, PR + 2); disc(g, '#fffaf0', px, PY + oy, PR); disc(g, '#f3ead8', px, PY + oy, PR - 9); disc(g, '#fffaf0', px, PY + oy, PR - 12);
    rect(g, '#7fb2e0', px - 5, PY + oy - PR + 4, 10, 2);
    if (this.phase !== 'rise') for (const c of this.cells) if (c.d > 0.02) rect(g, c.d > 0.5 ? '#9a6b47' : '#c99a6b', PX + c.x - CELL / 2, PY + c.y - CELL / 2, CELL, CELL);
    if (this.phase === 'rise') for (let i = 0; i < 5; i++) rect(g, '#fff6a0', px + Math.sin(this.rise * 9 + i * 2) * 40, PY + oy + Math.cos(this.rise * 7 + i * 3) * 34, 2, 2);
    for (const b of this.bubbles) { rect(g, '#ffffffcc', b.x, b.y, b.r + 1, b.r + 1); rect(g, '#bfe6f5', b.x + 1, b.y + 1, 1, 1); }
    // sponge
    if (this.phase === 'scrub') {
      rect(g, '#d9b13f', this.cur.x - 11, this.cur.y - 7, 22, 14); rect(g, '#ffd76a', this.cur.x - 11, this.cur.y - 7, 22, 9); rect(g, '#79b86a', this.cur.x - 11, this.cur.y + 2, 22, 5);
      rect(g, '#fff6a0', this.cur.x - 8, this.cur.y - 5, 3, 2);
    }
    if (this.flash > 0) rect(g, '#ffffff66', 0, 0, 320, 224);
    // hud
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, `PLATE ${this.total - this.left + 1}/${this.total}`, 8, 8, '#fffaf0');
    rect(g, '#5a3a86', 220, 8, 90, 7); rect(g, '#86cdb0', 221, 9, Math.round(88 * Math.min(1, this.clean)), 5);
    if (this.phase === 'rinse') drawTextC(g, 'SPARKLING! PRESS SPACE / CLICK TO RINSE', 160, 208, '#fff6a0');
    else if (this.phase === 'scrub') drawTextC(g, this.hint, 160, 208, '#2b1d2e', 1, null);
  }
}

// ======================= SWEEP =======================
export const PAN = { x: 258, y: 148, w: 50, h: 56 };
export class SweepGame {
  constructor(rng, { dust = 55, coins = 2 } = {}) {
    Object.assign(this, { rng, time: 0, done: false, score: 0, bonus: 0, title: 'Sweep the floor' });
    this.cur = new Cursor(60, 100, 150, [10, 24, 310, 214]);
    this.dust = [];
    const mk = (coin) => ({ x: range(rng, 24, 236), y: range(rng, 34, 200), vx: 0, vy: 0, in: false, coin });
    for (let i = 0; i < dust; i++) this.dust.push(mk(false));
    for (let i = 0; i < coins; i++) this.dust.push(mk(true));
    this.n = dust;
  }
  get collected() { return this.dust.filter((d) => !d.coin && d.in).length / this.n; }
  update(dt, input) {
    if (this.done) return;
    this.time += dt;
    this.cur.update(dt, input);
    const sp = this.cur.speedNow, R = 14;
    for (const d of this.dust) {
      if (d.in) continue;
      const dx = d.x - this.cur.x, dy = d.y - this.cur.y;
      if (dx * dx + dy * dy < R * R && sp > 20) {
        const k = Math.min(1, 260 / (sp || 1));
        d.vx += (this.cur.vx * k * 1.1 - d.vx) * 0.6; d.vy += (this.cur.vy * k * 1.1 - d.vy) * 0.6;
      }
      d.x += d.vx * dt; d.y += d.vy * dt;
      const f = Math.pow(0.03, dt); d.vx *= f; d.vy *= f;
      d.x = clamp(d.x, 8, 312); d.y = clamp(d.y, 28, 216);
      if (d.x > PAN.x + 4 && d.x < PAN.x + PAN.w - 4 && d.y > PAN.y + 6 && d.y < PAN.y + PAN.h - 4) { d.in = true; d.vx = d.vy = 0; if (d.coin) { this.bonus++; sfx('star'); } else if (Math.random() < 0.3) sfx('pop'); }
    }
    if (this.collected >= 0.95) { this.done = true; this.score = timeScore(this.time, 22, 40); }
  }
  draw(g, sprite) {
    for (let y = 0; y < 224; y += 16) for (let x = 0; x < 320; x += 16) g.drawImage(sprite('t_wood'), x, y);
    rect(g, '#00000018', 0, 0, 320, 224);
    // dustpan
    rect(g, '#8a9aab', PAN.x - 2, PAN.y - 2, PAN.w + 4, PAN.h + 4); rect(g, '#b9c6d2', PAN.x, PAN.y, PAN.w, PAN.h); rect(g, '#d0dae4', PAN.x, PAN.y, PAN.w, 4);
    rect(g, '#7a4f3a', PAN.x + PAN.w - 2, PAN.y + 20, 20, 4);
    for (const d of this.dust) {
      if (d.coin) { g.drawImage(sprite('i_coin'), Math.round(d.x - 4), Math.round(d.y - 4)); continue; }
      rect(g, d.in ? '#8f7d68' : '#c9b8a2', d.x - 1, d.y - 1, 3, 3); rect(g, '#a39078', d.x, d.y + 1, 2, 1);
    }
    // broom
    const c = this.cur;
    rect(g, '#7a4f3a', c.x - 1, c.y - 30, 3, 26);
    rect(g, '#d9b13f', c.x - 12, c.y - 5, 24, 4); rect(g, '#f0d070', c.x - 13, c.y - 1, 26, 8); rect(g, '#c9a13f', c.x - 13, c.y + 5, 26, 2);
    for (let i = -12; i < 13; i += 3) rect(g, '#a67548', c.x + i, c.y + 2, 1, 5);
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, 'SWEEP DUST INTO THE PAN', 8, 8, '#fffaf0');
    rect(g, '#5a3a86', 220, 8, 90, 7); rect(g, '#86cdb0', 221, 9, Math.round(88 * Math.min(1, this.collected / 0.95)), 5);
    if (this.time < 6) drawTextC(g, 'MOVE MOUSE OR WASD. SHINY THINGS HIDE IN THE DUST', 160, 210, '#fffaf0');
  }
}

// ======================= LAUNDRY =======================
const DIRS = ['left', 'right', 'down'];
const KEYDIR = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowdown: 'down', s: 'down' };
export class LaundryGame {
  constructor(rng, { items = 5 } = {}) {
    Object.assign(this, { rng, items, item: 0, step: 0, ring: 1, hits: 0, wrong: 0, done: false, score: 0, shake: 0, time: 0, stack: 0, flash: 0, title: 'Fold the laundry' });
    this.total = items * 3;
    this.plan = Array.from({ length: items }, () => Array.from({ length: 3 }, () => pick(rng, DIRS)));
    this.colors = ['#7fb2e0', '#f7a1b1', '#ffd76a', '#86cdb0', '#c9a5e8'];
  }
  get target() { return this.plan[this.item][this.step]; }
  advance(hit) {
    if (hit) { this.hits++; this.flash = 0.25; sfx('fold'); } else sfx('wrong');
    this.ring = 1; this.step++;
    if (this.step >= 3) { this.step = 0; this.item++; this.stack++; }
    if (this.item >= this.items) { this.done = true; this.score = clamp(this.hits / this.total - this.wrong * 0.03, 0.34, 1); }
  }
  update(dt, input) {
    if (this.done) return;
    this.time += dt; this.ring -= dt / 1.7; this.shake = Math.max(0, this.shake - dt); this.flash = Math.max(0, this.flash - dt);
    let dir = null;
    for (const k of input.pressed) if (KEYDIR[k]) dir = KEYDIR[k];
    if (input.justDown) dir = input.mx < 115 ? 'left' : input.mx > 205 ? 'right' : input.my > 135 ? 'down' : null;
    if (dir) { if (dir === this.target) this.advance(true); else { this.wrong++; this.shake = 0.25; sfx('wrong'); } }
    else if (this.ring <= 0) this.advance(false);
  }
  draw(g) {
    rect(g, '#f3e2c7', 0, 0, 320, 224); rect(g, '#d9bfa0', 0, 150, 320, 74);
    for (let x = 0; x < 320; x += 20) rect(g, '#e9d3b2', x, 150, 1, 74);
    const col = this.colors[this.item % 5];
    const sx = this.shake > 0 ? Math.sin(this.time * 90) * 3 : 0;
    const cx = 160 + sx, cy = 100;
    if (!this.done) {
      const s = this.step;
      // shirt: body + sleeves; folded sleeves shrink the width
      const bodyW = 60;
      rect(g, col, cx - bodyW / 2, cy - 30, bodyW, 70);
      rect(g, '#00000018', cx - bodyW / 2, cy + 34, bodyW, 6);
      rect(g, '#ffffff33', cx - bodyW / 2 + 4, cy - 26, 10, 60);
      if (s < 1) { rect(g, col, cx - 60, cy - 30, 30, 26); rect(g, '#00000022', cx - 60, cy - 6, 30, 2); }
      if (s < 2) { rect(g, col, cx + 30, cy - 30, 30, 26); rect(g, '#00000022', cx + 30, cy - 6, 30, 2); }
      rect(g, '#ffffffaa', cx - 8, cy - 30, 16, 5);
      if (s >= 1) rect(g, '#00000022', cx - 30, cy - 30, 3, 70);
      if (s >= 2) rect(g, '#00000022', cx + 27, cy - 30, 3, 70);
      // target zones
      const zone = { left: [50, 60, 60, 80], right: [210, 60, 60, 80], down: [110, 138, 100, 40] }[this.target];
      const pulse = 0.35 + 0.25 * Math.sin(this.time * 10);
      g.fillStyle = `rgba(255,246,160,${pulse})`; g.fillRect(...zone);
      const arrow = { left: '<', right: '>', down: 'v' }[this.target];
      drawTextC(g, arrow === 'v' ? 'DOWN' : arrow === '<' ? 'LEFT' : 'RIGHT', zone[0] + zone[2] / 2, zone[1] + zone[3] / 2 - 2, '#2b1d2e', 2, null);
      // timing ring bar
      rect(g, '#5a3a86', 100, 190, 120, 7); rect(g, this.ring > 0.35 ? '#86cdb0' : '#e0707a', 101, 191, Math.round(118 * clamp(this.ring, 0, 1)), 5);
    }
    // folded stack
    for (let i = 0; i < this.stack; i++) { rect(g, this.colors[i % 5], 250, 200 - i * 7, 50, 7); rect(g, '#00000022', 250, 205 - i * 7, 50, 2); }
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, `SHIRT ${Math.min(this.item + 1, this.items)}/${this.items}`, 8, 8, '#fffaf0');
    drawText(g, 'PRESS THE ARROW OR CLICK THE GLOWING FOLD', 100, 8, '#fff6a0');
    if (this.flash > 0) rect(g, '#ffffff22', 0, 0, 320, 224);
  }
}

// ======================= PLANTS =======================
export class PlantGame {
  constructor(rng, { pots = 3 } = {}) {
    Object.assign(this, { rng, pots, pot: 0, level: 0, wasPouring: false, phase: 'pour', wait: 0, results: [], done: false, score: 0, t: 0, msg: '', drops: [], title: 'Water the plants' });
    this.newBand();
  }
  newBand() { const c = range(this.rng, 0.4, 0.78); this.band = [c - 0.09, c + 0.09]; this.level = 0; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    this.drops = this.drops.filter((d) => (d.y += 140 * dt) < 165);
    if (this.phase === 'pour') {
      const pouring = actHeld(input);
      if (pouring) {
        this.level += dt * 0.38;
        if (Math.random() < 0.8) { this.drops.push({ x: 152 + Math.random() * 6, y: 82 }); if (Math.random() < 0.3) sfx('pour'); }
      }
      let res = null;
      if (this.level >= 1.1) res = 0.5;
      else if (this.wasPouring && !pouring && this.level > 0.03) {
        if (this.level >= this.band[0] && this.level <= this.band[1]) res = 1;
        else if (this.level > this.band[1]) res = 0.5;
        else this.msg = 'A LITTLE MORE...';
      }
      this.wasPouring = pouring;
      if (res !== null) { this.results.push(res); this.phase = 'grow'; this.wait = 1.3; this.msg = res === 1 ? 'PERFECT!' : 'A BIT SOGGY...'; sfx(res === 1 ? 'chime' : 'wrong'); }
    } else {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (this.results.length >= this.pots) { this.done = true; this.score = this.results.reduce((a, b) => a + b, 0) / this.pots; }
        else { this.pot++; this.phase = 'pour'; this.msg = ''; this.newBand(); }
      }
    }
  }
  draw(g) {
    rect(g, '#bfe6f5', 0, 0, 320, 150); rect(g, '#a4d4e6', 0, 100, 320, 50); rect(g, '#b4d896', 0, 150, 320, 74);
    rect(g, '#9cc57c', 0, 150, 320, 4);
    for (let i = 0; i < 6; i++) rect(g, '#fffaf0', 30 + i * 52, 30 + (i % 2) * 20, 22, 6);
    // finished pots on shelf
    for (let i = 0; i < this.results.length; i++) if (i !== this.pot || this.phase === 'grow') this.drawPot(g, 46 + i * 28, 196, i === this.pot && this.phase === 'grow' ? 1 : 1, this.results[i]);
    // current pot
    const x = 160, y = 176;
    if (this.phase === 'pour') this.drawPot(g, x, y, 0, null);
    else this.drawPot(g, x, y, Math.min(1, (1.3 - this.wait) / 0.9), this.results[this.pot]);
    // watering can
    if (this.phase === 'pour') {
      const tilt = actHeldVisual(this);
      rect(g, '#5a8cc0', 168, 56, 30, 22); rect(g, '#7fb2e0', 168, 56, 30, 8); rect(g, '#5a8cc0', 196, 60, 10, 6); rect(g, '#5a8cc0', 160 - (tilt ? 4 : 0), 74, 12, 4);
      rect(g, '#5a8cc0', 172, 50, 18, 3); rect(g, '#5a8cc0', 172, 50, 3, 8); rect(g, '#5a8cc0', 187, 50, 3, 8);
      for (const d of this.drops) rect(g, '#7fb2e0', d.x, d.y, 2, 4);
    }
    // meter
    rect(g, '#2b1d2e', 262, 40, 26, 120); rect(g, '#fffaf0', 264, 42, 22, 116);
    const bt = 158 - this.band[1] * 116, bh = (this.band[1] - this.band[0]) * 116;
    rect(g, '#86cdb0', 264, bt, 22, bh);
    rect(g, '#7fb2e0', 264, 158 - Math.min(1, this.level) * 116, 22, Math.min(1, this.level) * 116);
    rect(g, '#2b1d2e', 262, 158 - Math.min(1, this.level) * 116, 26, 1);
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, `POT ${Math.min(this.pot + 1, this.pots)}/${this.pots}`, 8, 8, '#fffaf0');
    drawText(g, 'HOLD MOUSE / SPACE TO POUR. LET GO IN THE GREEN', 70, 8, '#fff6a0');
    if (this.msg) drawTextC(g, this.msg, 160, 30, '#2b1d2e', 2, null);
  }
  drawPot(g, x, y, growth, res) {
    const h = 6 + growth * 26;
    rect(g, '#bd5460', x - 12, y - 16, 24, 16); rect(g, '#e0707a', x - 14, y - 20, 28, 6); rect(g, '#6a4a30', x - 11, y - 19, 22, 3);
    if (growth > 0) {
      rect(g, '#4f9558', x - 1, y - 20 - h, 3, h);
      rect(g, '#79b86a', x - 10, y - 20 - h * 0.6, 10, 5); rect(g, '#79b86a', x + 2, y - 20 - h * 0.8, 10, 5);
      if (growth >= 1) { rect(g, res === 1 ? '#f7a1b1' : '#c9a5e8', x - 6, y - 26 - h, 14, 8); rect(g, '#ffd76a', x - 1, y - 24 - h, 4, 4); }
    } else { rect(g, '#a3a04f', x - 1, y - 27, 3, 8); rect(g, '#8a8a4a', x - 6, y - 27, 6, 2); }
  }
}
const actHeldVisual = (g) => g.wasPouring;

// ======================= FEED MOCHI =======================
const FOODS = [{ id: 'fish', name: 'Fish', icon: 'i_fish' }, { id: 'chicken', name: 'Chicken', icon: 'i_chicken' }, { id: 'kibble', name: 'Kibble', icon: 'i_kibble' }];
export class FeedGame {
  constructor(rng) {
    Object.assign(this, { rng, fav: Math.floor(rng() * 3), sel: 1, wrong: 0, phase: 'pick', wait: 0, done: false, score: 0, t: 0, hearts: [], title: 'Feed Mochi', msg: 'WHICH DOES MOCHI WANT TODAY? WATCH HER TAIL!' });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.hearts = this.hearts.filter((h) => (h.y -= 14 * dt, h.life -= dt) > 0);
    if (this.phase === 'pick') {
      if (input.pressed.has('arrowleft') || input.pressed.has('a')) { this.sel = (this.sel + 2) % 3; sfx('blip'); }
      if (input.pressed.has('arrowright') || input.pressed.has('d')) { this.sel = (this.sel + 1) % 3; sfx('blip'); }
      if (input.moved && input.my > 130) this.sel = clamp(Math.floor((input.mx - 40) / 80), 0, 2);
      if (this.sel === this.fav && Math.random() < dt * 3) this.hearts.push({ x: 160 + range(this.rng, -14, 14), y: 92, life: 1 });
      if (act(input) && !(input.justDown && input.my < 130)) {
        if (this.sel === this.fav) { this.phase = 'eat'; this.wait = 1.8; sfx('meow'); this.msg = 'NOM NOM NOM!'; }
        else { this.wrong++; this.phase = 'sniff'; this.wait = 1.0; sfx('wrong'); this.msg = 'MOCHI SNIFFS... AND TURNS AWAY.'; }
      }
    } else {
      this.wait -= dt;
      if (this.phase === 'eat' && Math.random() < dt * 6) this.hearts.push({ x: 160 + range(this.rng, -20, 20), y: 100, life: 1 });
      if (this.wait <= 0) {
        if (this.phase === 'eat') { this.done = true; this.score = clamp(1 - this.wrong * 0.33, 0.34, 1); }
        else { this.phase = 'pick'; this.msg = 'HMM. TRY ANOTHER ONE!'; }
      }
    }
  }
  draw(g, sprite) {
    rect(g, '#f4ead6', 0, 0, 320, 224); rect(g, '#dccdb0', 0, 120, 320, 104);
    for (let x = 0; x < 320; x += 32) rect(g, '#e8dbc0', x, 120, 1, 104);
    rect(g, '#fff1d6', 0, 116, 320, 5);
    // mochi
    const wag = this.sel === this.fav && this.phase === 'pick';
    const sleepy = this.phase === 'sniff';
    const mx = 160 + (sleepy ? 18 : 0);
    g.save(); g.translate(mx, 92); g.scale(5, 5);
    g.drawImage(sprite(this.t % 4.5 < 0.14 ? 'mochi_sit_b' : 'mochi_sit_' + (Math.floor(this.t * 2.2) % 4)), -13, -13);
    g.restore();
    const tw = wag ? Math.round(Math.sin(this.t * 14) * 3) : 0;
    rect(g, '#d98d45', mx + 32 + tw, 80, 6, 12); rect(g, '#d98d45', mx + 34 + tw * 1.5, 72, 6, 10);
    if (this.phase === 'eat') { rect(g, '#f2b56b', mx - 20, 104, 40, 8 + Math.round(Math.sin(this.t * 20) * 2)); }
    for (const h of this.hearts) g.drawImage(sprite('heart'), Math.round(h.x), Math.round(h.y));
    for (let i = 0; i < 3; i++) {
      const bx = 40 + i * 80, sel = i === this.sel;
      rect(g, sel ? '#e0707a' : '#a67548', bx, 140, 64, 48); rect(g, '#fff1d6', bx + 3, 143, 58, 42);
      g.save(); g.translate(bx + 16, 148); g.scale(2, 2); g.drawImage(sprite(FOODS[i].icon), 0, 0); g.restore();
      drawTextC(g, FOODS[i].name, bx + 32, 178, '#2b1d2e', 1, null);
      if (sel) drawTextC(g, '^', bx + 32, 192, '#e0707a', 2, null);
    }
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, 'FEED MOCHI', 8, 8, '#fffaf0');
    drawText(g, 'ARROWS / MOUSE TO PICK, SPACE / CLICK TO SERVE', 70, 8, '#fff6a0');
    drawTextC(g, this.msg, 160, 208, '#2b1d2e', 1, null);
  }
}

export const MINIGAMES = { dishes: DishGame, sweep: SweepGame, laundry: LaundryGame, plants: PlantGame, feed: FeedGame };
