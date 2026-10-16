// Hobby minigames, drawn 1:1 at 320x224 from the master palette. Every one works with keyboard (Space/E + arrows)
// or mouse, and has a bot (see src/content/hobbies/minigames.js) so the tests can play it to the end.
//   FishGame  - power cast, wait for the bobber, strike on the bite, then hold to keep the catch bar on the fish
//   NetGame   - sneak the net over a flitting bug and swing
//   StarGame  - connect the stars of a constellation in order
//   CookGame  - 2-3 steps from chop (rhythm), stir (keep the speed in the band) and fry (stop at golden)
import { Cursor, act, actHeld, axis } from '../../input.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { sfx } from '../../audio.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { bayer, hash } from '../../gfx/noise.js';
import { clamp } from '../../rng.js';

export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const disc = (g, c, cx, cy, rx, ry = rx) => { cx = Math.round(cx); cy = Math.round(cy); for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
// Vertical colour bands with a Bayer-dithered seam (sky gradients).
export function bands(g, cols, y0, y1) {
  const n = cols.length, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) rect(g, cols[i], 0, y0 + i * h, 320, h + 1);
  for (let i = 1; i < n; i++) { const yy = Math.round(y0 + i * h); g.fillStyle = cols[i - 1]; for (let y = yy; y < yy + 4; y++) for (let x = 0; x < 320; x++) if (bayer(x, y) > (y - yy + 0.5) / 4) g.fillRect(x, y, 1, 1); }
}
export function line(g, c, x0, y0, x1, y1) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; g.fillStyle = c; for (let i = 0; i < 600; i++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
const head = (g, title, sub) => { rect(g, '#2b1d2ee0', 0, 0, 320, 18); rect(g, Rr.ink[2], 0, 18, 320, 1); drawText(g, title, 8, 7, Rr.butter[3], 1, null); if (sub) drawText(g, sub, 312 - measure(sub), 7, Rr.paper[3], 1, null); };
const hint = (g, t, y = 210) => { const w = measure(t) + 12; rect(g, '#2b1d2ed0', 160 - w / 2, y - 3, w, 11); drawTextC(g, t, 160, y, Rr.paper[4], 1, null); };
const meter = (g, x, y, w, h, v, col, back = Rr.ink[2]) => { rect(g, Rr.ink[1], x - 1, y - 1, w + 2, h + 2); rect(g, back, x, y, w, h); rect(g, col, x, y, Math.round(w * clamp(v, 0, 1)), h); rect(g, '#ffffff40', x, y, Math.round(w * clamp(v, 0, 1)), 1); };
const press = (i) => act(i);

// ===================================================================== FISHING
export class FishGame {
  constructor(rng, { fish = null, tier = 1, calm = false, skill = 0, bait = null, night = false, ocean = false } = {}) {
    this.rng = rng; this.fish = fish || { id: 'fish_crucian', name: 'Fish', rarity: 1, size: [10, 25], c: Rr.butter[1] };
    Object.assign(this, { phase: 'cast', t: 0, power: 0, done: false, score: 0, misses: 0, night, ocean, title: 'Fishing', bait });
    const r = this.fish.rarity || 1;
    this.zoneH = Math.round(30 + (tier - 1) * 9 + (calm ? 10 : 0) + skill * 1.4 - r * 2);
    this.trackH = 136; this.zone = 20; this.zv = 0; this.fy = 60; this.ft = 60; this.fv = 0;
    this.prog = 0.3; this.inZone = 0; this.reelT = 0;
    this.wait = 1.6 + rng() * 2.6 - (bait ? 0.6 : 0); this.nib = 0;
    this.speed = 30 + r * 16 + (this.fish.legend ? 25 : 0);
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    const p = this.phase;
    if (p === 'cast') { this.power = (Math.sin(this.t * 3.2 - 1.57) + 1) / 2; if (press(input)) { this.phase = 'fly'; this.ft0 = this.t; this.castP = this.power; sfx('cast'); } }
    else if (p === 'fly') { if (this.t - this.ft0 > 0.55) { this.phase = 'wait'; sfx('splash'); this.wt = 0; } }
    else if (p === 'wait') {
      this.wt += dt; this.nib = Math.max(0, this.nib - dt);
      if (this.rng() < dt * 0.8 && this.wt < this.wait - 0.4) this.nib = 0.2;
      if (press(input) && this.wt > 0.3) { this.wait += 0.6; this.nib = 0.15; } // too early: the fish hesitates
      if (this.wt >= this.wait) { this.phase = 'bite'; this.bt = 0; sfx('bite'); }
    } else if (p === 'bite') {
      this.bt += dt;
      if (press(input)) { this.phase = 'reel'; sfx('reel'); }
      else if (this.bt > 0.95) { this.misses++; if (this.misses >= 3) return this.end(false); this.phase = 'wait'; this.wt = 0; this.wait = 1.2 + this.rng() * 1.6; }
    } else if (p === 'reel') {
      this.reelT += dt;
      const held = actHeld(input);
      this.zv += (held ? 260 : -200) * dt; this.zv = clamp(this.zv, -140, 140);
      this.zone += this.zv * dt;
      if (this.zone < 0) { this.zone = 0; this.zv = Math.max(0, this.zv) * 0.2; }
      if (this.zone > this.trackH - this.zoneH) { this.zone = this.trackH - this.zoneH; this.zv = Math.min(0, this.zv) * 0.2; }
      this.ftT = (this.ftT || 0) - dt;
      if (this.ftT <= 0) { this.ft = 6 + this.rng() * (this.trackH - 12); this.ftT = 0.5 + this.rng() * (1.6 - (this.fish.rarity || 1) * 0.18); }
      this.fv += clamp(this.ft - this.fy, -1, 1) * this.speed * 3 * dt; this.fv *= Math.pow(0.12, dt); this.fy = clamp(this.fy + this.fv * dt, 4, this.trackH - 4);
      const inside = this.fy >= this.zone && this.fy <= this.zone + this.zoneH;
      if (inside) this.inZone += dt;
      this.prog += (inside ? 0.34 : -0.2 + (this.fish.rarity <= 1 ? 0.05 : 0)) * dt;
      if (this.rng() < dt * 6 && inside) sfx('reel');
      if (this.prog >= 1) return this.end(true);
      if (this.prog <= 0) return this.end(false);
    }
  }
  end(caught) {
    this.done = true; this.caught = caught;
    const perfect = this.reelT ? this.inZone / this.reelT : 0, [a, b] = this.fish.size || [10, 20];
    this.size = Math.round(a + (b - a) * Math.pow(this.rng(), 1.4 - perfect * 0.5));
    this.score = caught ? clamp(0.5 + perfect * 0.55 - this.misses * 0.05, 0.5, 1) : 0;
    this.result = caught ? { text: `${this.fish.name}! ${this.size} cm`, caught: true, size: this.size } : { text: this.misses >= 3 ? 'It swam off. Next time!' : 'It got away... next time!', caught: false };
    sfx(caught ? 'star' : 'splash');
  }
  draw(g) {
    const t = this.t, night = this.night;
    bands(g, night ? ['#0e0c24', '#1b1b3a', '#2e2a5a'] : ['#7fc8f0', '#a8dcf5', '#d4f0fa'], 0, 92);
    if (night) for (let i = 0; i < 40; i++) rect(g, (Math.floor(t * 2 + i) % 7) ? '#fffaf0' : '#8a7fb0', hash(i, 1, 4) * 320, hash(i, 2, 4) * 80, 1, 1);
    else { disc(g, Rr.paper[4], 60 + (t * 3) % 360 - 40, 30, 14, 4); disc(g, Rr.paper[4], 72 + (t * 3) % 360 - 40, 26, 9, 4); }
    // far shore
    for (let x = 0; x < 320; x += 4) rect(g, night ? Rr.forest[0] : Rr.forest[2], x, 84 - Math.round(4 + Math.sin(x * 0.05) * 3 + hash(x, 3, 1) * 3), 4, 12);
    const W = Rr.water;
    bands(g, night ? [W[0], W[1], W[1], W[0]] : [W[3], W[2], W[2], W[1]], 92, 224);
    for (let i = 0; i < 26; i++) { const y = 96 + (i * 37) % 120, x = (hash(i, 5, 2) * 360 + t * (8 + (i % 3) * 4)) % 360 - 20; rect(g, night ? W[2] : W[4], x, y, 6 + (i % 3) * 3, 1); }
    // pier / bank in the foreground with Misa's rod
    if (this.ocean) { rect(g, Rr.wood[1], 0, 186, 120, 38); for (let x = 0; x < 120; x += 12) { rect(g, Rr.wood[2], x, 186, 11, 38); rect(g, Rr.wood[3], x, 186, 11, 2); } rect(g, Rr.woodDark[1], 0, 186, 120, 1); }
    else { disc(g, Rr.forest[1], 30, 214, 60, 22); disc(g, Rr.forest[2], 24, 212, 52, 18); for (let i = 0; i < 12; i++) rect(g, Rr.forest[3], 4 + i * 6, 196 + (i % 3) * 3, 1, 4); }
    const tipX = 92, tipY = 140;
    line(g, Rr.wood[1], 34, 214, tipX, tipY); line(g, Rr.wood[3], 35, 214, tipX + 1, tipY);
    rect(g, Rr.ribbon[2], 44, 199, 4, 3);
    // bobber
    let bx = 120 + (this.castP ?? this.power) * 150, by = 132;
    if (this.phase === 'cast') { bx = tipX; by = tipY + 6; }
    if (this.phase === 'fly') { const k = clamp((this.t - this.ft0) / 0.55, 0, 1); bx = tipX + (bx - tipX) * k; by = tipY - Math.sin(k * Math.PI) * 50 + (132 - tipY) * k; }
    const dip = this.phase === 'bite' ? 3 + Math.round(Math.sin(t * 30)) : this.nib > 0 ? 1 : Math.round(Math.sin(t * 2.5));
    line(g, '#fffaf0a0', tipX, tipY, bx, by + dip - 3);
    rect(g, Rr.paper[4], bx - 2, by + dip - 4, 5, 3); rect(g, Rr.ribbon[2], bx - 2, by + dip - 1, 5, 3); rect(g, Rr.ribbon[1], bx - 2, by + dip + 1, 5, 1);
    if (this.phase === 'wait' || this.phase === 'bite') { const r = Math.floor(t * 2) % 3; rect(g, W[4], bx - 4 - r * 2, by + 3, 9 + r * 4, 1); }
    if (this.phase === 'bite') { rect(g, Rr.butter[2], bx - 1, by - 22, 3, 8); rect(g, Rr.butter[2], bx - 1, by - 12, 3, 3); }
    head(g, 'FISHING', this.phase === 'reel' ? 'HOLD SPACE / MOUSE TO REEL' : '');
    if (this.phase === 'cast') { meter(g, 110, 170, 100, 6, this.power, this.power > 0.8 ? Rr.butter[2] : Rr.mint[2]); hint(g, 'PRESS SPACE OR CLICK TO CAST'); }
    if (this.phase === 'wait') hint(g, 'WAIT FOR A BITE...');
    if (this.phase === 'bite') hint(g, 'A BITE! PRESS NOW!');
    if (this.phase === 'reel') {
      const X = 276, Y = 36, H = this.trackH;
      rect(g, Rr.ink[1], X - 3, Y - 3, 22, H + 6); rect(g, W[1], X - 2, Y - 2, 20, H + 4);
      for (let y = 0; y < H; y += 8) rect(g, W[2], X - 2, Y + y, 20, 4);
      const zy = Y + H - this.zone - this.zoneH;
      rect(g, Rr.mint[2], X, zy, 16, this.zoneH); rect(g, Rr.mint[3], X, zy, 16, 2); rect(g, Rr.mint[1], X, zy + this.zoneH - 2, 16, 2);
      const fy = Y + H - this.fy;
      disc(g, this.fish.c || Rr.butter[1], X + 8, fy, 5, 3); rect(g, Rr.ink[1], X + 4, fy - 1, 1, 1); rect(g, this.fish.c || Rr.butter[1], X + 12, fy - 3, 3, 7);
      meter(g, X - 14, Y, 6, H, 0, Rr.butter[2]);
      const ph = Math.round(H * clamp(this.prog, 0, 1)); rect(g, this.prog > 0.25 ? Rr.butter[2] : Rr.coral[2], X - 14, Y + H - ph, 6, ph);
      drawText(g, 'LINE', X - 24, Y + H + 6, Rr.paper[4], 1, null);
    }
  }
}

// ===================================================================== BUG NET
export class NetGame {
  constructor(rng, { bug = null, tier = 1 } = {}) {
    this.rng = rng; this.bug = bug || { name: 'Bug', rarity: 1, kind: 'fly', icon: null, c: Rr.paper[4] };
    Object.assign(this, { t: 0, done: false, score: 0, misses: 0, swing: 0, title: 'Bug catching', R: tier >= 2 ? 26 : 20, limit: 14 });
    this.cur = new Cursor(160, 150, 150, [10, 26, 310, 214]);
    this.bx = 160; this.by = 100; this.seed = rng() * 50; this.spd = 0.5 + (this.bug.rarity || 1) * 0.16; this.startle = 0;
    this.low = this.bug.kind === 'crawl' || this.bug.kind === 'hop';
    this.flowers = Array.from({ length: 40 }, (_, i) => [hash(i, 1, 7) * 320, 150 + hash(i, 2, 7) * 70, i % 4]);
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.startle = Math.max(0, this.startle - dt);
    const s = this.t * this.spd * (1 + this.startle * 1.5) + this.seed;
    const tx = 160 + Math.sin(s * 1.1) * 110 + Math.sin(s * 2.7) * 20, ty = this.low ? 170 + Math.sin(s * 1.9) * 22 : 100 + Math.sin(s * 1.7) * 50 + Math.cos(s * 3.1) * 12;
    const hop = this.bug.kind === 'hop' ? Math.max(0, Math.sin(s * 4)) * 26 : 0;
    this.bx += (tx - this.bx) * Math.min(1, dt * 4); this.by += (ty - hop - this.by) * Math.min(1, dt * 4);
    this.cur.update(dt, input);
    if (this.swing > 0) { this.swing -= dt; if (this.swing <= 0) this.check(); }
    else if (press(input)) { this.swing = 0.22; sfx('whistle'); }
    if (this.t > this.limit) this.finish(false);
  }
  check() {
    if (Math.hypot(this.bx - this.cur.x, this.by - this.cur.y) < this.R) return this.finish(true);
    this.misses++; this.startle = 1.5; sfx('wrong');
    if (this.misses >= 3) this.finish(false);
  }
  finish(ok) { this.done = true; this.caught = ok; this.score = ok ? clamp(1 - this.misses * 0.2 - Math.max(0, this.t - 4) / 30, 0.45, 1) : 0; this.result = ok ? { text: `Caught: ${this.bug.name}!`, caught: true } : { text: 'It fluttered away. Next time!', caught: false }; }
  draw(g, sprite) {
    const t = this.t;
    bands(g, ['#a8dcf5', '#d4f0fa', '#e8f8ff'], 0, 120);
    for (const [x, h, c] of [[30, 40, 2], [110, 55, 1], [200, 46, 2], [290, 60, 1]]) { disc(g, Rr.forest[c], x, 130 - h / 2, 40, h / 2); disc(g, Rr.forest[c + 1], x - 8, 124 - h / 2, 24, h / 3); }
    rect(g, Rr.grass[2], 0, 130, 320, 94); bands(g, [Rr.grass[3], Rr.grass[2], Rr.grass[1]], 130, 224);
    for (let i = 0; i < 70; i++) { const x = hash(i, 3, 3) * 320, y = 136 + hash(i, 4, 3) * 86, sw = Math.round(Math.sin(t * 2 + i) * 1); rect(g, Rr.grass[4], x + sw, y - 4, 1, 4); rect(g, Rr.grass[4], x + 2 + sw, y - 3, 1, 3); }
    for (const [x, y, k] of this.flowers) { const c = [Rr.coral[2], Rr.butter[2], Rr.lilac[3], Rr.paper[4]][k]; rect(g, Rr.forest[1], x, y, 1, 6); rect(g, c, x - 1, y - 1, 3, 3); rect(g, Rr.butter[3], x, y, 1, 1); }
    // the bug
    const flap = Math.floor(t * 10) % 2;
    rect(g, 'rgba(42,26,64,0.25)', this.bx - 5, (this.low ? this.by + 8 : 200), 10, 2);
    if (this.bug.icon) { const img = sprite(this.bug.icon); g.drawImage(img, Math.round(this.bx - img.width / 2), Math.round(this.by - img.height / 2 + (flap && !this.low ? -1 : 0))); }
    else disc(g, this.bug.c, this.bx, this.by, 4);
    if (!this.low && flap) { rect(g, '#ffffff80', this.bx - 9, this.by - 3, 3, 2); rect(g, '#ffffff80', this.bx + 7, this.by - 3, 3, 2); }
    // net
    const c = this.cur, sw = this.swing > 0 ? 1 - this.swing / 0.22 : 0, r = this.R;
    line(g, Rr.wood[1], c.x + r * 0.7, c.y + r * 0.7, c.x + r + 30, c.y + r + 40); line(g, Rr.wood[3], c.x + r * 0.7 + 1, c.y + r * 0.7, c.x + r + 31, c.y + r + 40);
    for (let a = 0; a < 40; a++) { const ang = a / 40 * Math.PI * 2; rect(g, Rr.paper[4], c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r * (1 - sw * 0.6), 1, 1); }
    for (let k = -r + 4; k < r; k += 5) { rect(g, '#fffaf060', c.x + k, c.y - Math.sqrt(r * r - k * k) * (1 - sw * 0.6), 1, Math.sqrt(r * r - k * k) * 2 * (1 - sw * 0.6)); }
    head(g, `CATCH THE ${this.bug.name.toUpperCase()}`, `SWINGS LEFT ${3 - this.misses}`);
    meter(g, 8, 24, 60, 4, 1 - this.t / this.limit, Rr.mint[2]);
    hint(g, 'MOVE THE NET OVER THE BUG AND PRESS SPACE / CLICK');
  }
}

// ===================================================================== STARGAZING
export class StarGame {
  constructor(rng, { con = null } = {}) {
    this.con = con || { name: 'Aries', stars: [[20, 30], [45, 22], [65, 25], [75, 35]], path: [0, 1, 2, 3], lore: '' };
    this.rng = rng; Object.assign(this, { t: 0, done: false, score: 0, misses: 0, idx: 0, idle: 0, lines: [], title: 'Stargazing' });
    this.pts = this.con.stars.map(([x, y]) => [40 + x * 2.4, 40 + y * 2.2]);
    this.bg = Array.from({ length: 110 }, (_, i) => [hash(i, 1, 9) * 320, 20 + hash(i, 2, 9) * 170, hash(i, 3, 9)]);
    this.cur = new Cursor(160, 120, 130, [4, 22, 316, 200]);
    this.skip();
  }
  skip() { while (this.con.path[this.idx] === -1) { this.idx++; this.pen = false; } }
  get target() { return this.con.path[this.idx]; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.idle += dt; this.cur.update(dt, input);
    if (!press(input)) return;
    const [tx, ty] = this.pts[this.target];
    if (Math.hypot(this.cur.x - tx, this.cur.y - ty) < 10) {
      const prev = this.con.path[this.idx - 1];
      if (this.pen && prev !== undefined && prev >= 0) this.lines.push([prev, this.target]);
      this.pen = true; this.idx++; this.idle = 0; sfx('blip'); this.skip();
      if (this.idx >= this.con.path.length) { this.done = true; sfx('star'); this.score = clamp(1 - this.misses * 0.08 - Math.max(0, this.t - this.con.path.length * 2.2) / 40, 0.4, 1); this.result = { text: `${this.con.name}: logged in your star map` }; }
    } else { this.misses++; sfx('wrong'); }
  }
  draw(g) {
    const t = this.t;
    bands(g, ['#0e0c24', '#141232', '#1b1b3a', '#2e2a5a'], 0, 224);
    for (const [x, y, k] of this.bg) rect(g, Math.floor(t * 1.5 + k * 10) % 9 ? (k > 0.7 ? '#fffaf0' : '#8a7fb0') : '#4a3348', x, y, 1, 1);
    for (let x = 0; x < 320; x += 2) rect(g, Rr.ink[0], x, 196 - Math.round(Math.sin(x * 0.02) * 6 + hash(x, 1, 2) * 2), 2, 40);
    rect(g, Rr.metal[1], 0, 204, 320, 2); for (let x = 6; x < 320; x += 18) rect(g, Rr.metal[1], x, 204, 2, 20);
    for (const [a, b] of this.lines) { const [x0, y0] = this.pts[a], [x1, y1] = this.pts[b]; line(g, Rr.sky[3], x0, y0, x1, y1); }
    const prev = this.con.path[this.idx - 1];
    if (this.pen && prev >= 0 && !this.done) { const [x0, y0] = this.pts[prev]; line(g, '#bfe6f560', x0, y0, this.cur.x, this.cur.y); }
    this.pts.forEach(([x, y], i) => {
      const tw = Math.floor(t * 3 + i) % 4 === 0, tgt = i === this.target && !this.done;
      rect(g, '#fffaf0', x - 1, y, 3, 1); rect(g, '#fffaf0', x, y - 1, 1, 3);
      if (tw || tgt) { rect(g, '#fff6a0', x - 2, y, 5, 1); rect(g, '#fff6a0', x, y - 2, 1, 5); }
      if (tgt && (this.idle > 2.5 || Math.floor(t * 2) % 2)) { const r = 5 + Math.floor(t * 4) % 3; for (let a = 0; a < 16; a++) rect(g, '#ffd76a', x + Math.cos(a * 0.39) * r, y + Math.sin(a * 0.39) * r, 1, 1); }
    });
    const c = this.cur; rect(g, '#ffd76a', c.x - 5, c.y, 3, 1); rect(g, '#ffd76a', c.x + 3, c.y, 3, 1); rect(g, '#ffd76a', c.x, c.y - 5, 1, 3); rect(g, '#ffd76a', c.x, c.y + 3, 1, 3);
    head(g, `CONNECT THE STARS: ${this.con.name.toUpperCase()}`, `${Math.min(this.idx, this.con.path.length)}/${this.con.path.length}`);
    hint(g, this.done ? this.con.lore : 'AIM AT THE GLOWING STAR AND PRESS SPACE / CLICK', 212);
  }
}

// ===================================================================== COOKING
export class CookGame {
  constructor(rng, { name = 'Onigiri', steps = ['chop', 'stir', 'fry'], icon = null, colour = Rr.butter[2] } = {}) {
    Object.assign(this, { rng, name, steps, icon, colour, si: 0, t: 0, st: 0, scores: [], done: false, score: 0, title: 'Cooking', flash: 0, msg: '', msgT: 0 });
    this.start();
  }
  get step() { return this.steps[this.si]; }
  start() {
    this.st = 0; const s = this.step;
    if (s === 'chop') { this.notes = Array.from({ length: 6 }, (_, i) => ({ at: 1.2 + i * 0.62 + (i > 2 ? 0.31 : 0), hit: null })); this.slices = 0; this.knife = 0; }
    if (s === 'stir') { this.speed = 0; this.inBand = 0; this.ang = 0; this.dur = 4.5; this.lastA = null; }
    if (s === 'fry') { this.heat = 0; this.stopped = false; }
  }
  next(score) {
    this.scores.push(clamp(score, 0, 1)); this.msg = score > 0.85 ? 'PERFECT!' : score > 0.6 ? 'NICE!' : 'OKAY!'; this.msgT = 1; sfx(score > 0.6 ? 'chime' : 'pop');
    this.si++;
    if (this.si >= this.steps.length) { this.done = true; this.score = this.scores.reduce((a, b) => a + b, 0) / this.scores.length; this.result = { text: `${this.name} is ready!` }; return; }
    this.start();
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.st += dt; this.msgT = Math.max(0, this.msgT - dt); this.flash = Math.max(0, this.flash - dt);
    const s = this.step;
    if (s === 'chop') {
      this.knife = Math.max(0, this.knife - dt * 6);
      if (press(input)) {
        this.knife = 1; sfx('fold');
        const n = this.notes.find((q) => q.hit === null && Math.abs(q.at - this.st) < 0.2);
        if (n) { n.hit = Math.abs(n.at - this.st) < 0.1 ? 1 : 0.7; this.slices++; this.flash = 0.1; }
      }
      for (const q of this.notes) if (q.hit === null && this.st - q.at > 0.2) q.hit = 0;
      if (this.notes.every((q) => q.hit !== null)) this.next(this.notes.reduce((a, q) => a + q.hit, 0) / this.notes.length);
    } else if (s === 'stir') {
      let push = actHeld(input) ? 0.9 : 0;
      const a = axis(input); if (a.x || a.y) push = 0.9;
      if (input.moved && !actHeld(input)) { const ang = Math.atan2(input.my - 132, input.mx - 160); if (this.lastA !== null) { let d = Math.abs(ang - this.lastA); if (d > Math.PI) d = 2 * Math.PI - d; push = Math.max(push, clamp(d / dt / 8, 0, 1.4)); } this.lastA = ang; }
      this.speed += (push - this.speed) * Math.min(1, dt * (push > this.speed ? 1.6 : 1.1));
      this.ang += this.speed * dt * 9;
      if (this.speed > 0.45 && this.speed < 0.78) this.inBand += dt;
      if (this.st >= this.dur) this.next(this.inBand / (this.dur - 0.8));
    } else if (s === 'fry') {
      if (!this.stopped) {
        this.heat += dt / 3.6;
        if (press(input) && this.heat > 0.1) { this.stopped = true; this.stopT = this.st; this.res = clamp(1 - Math.abs(this.heat - 0.66) / 0.3, 0.15, 1); }
        if (this.heat >= 1) { this.stopped = true; this.stopT = this.st; this.res = 0.2; }
      } else if (this.st - this.stopT > 0.6) this.next(this.res);
    }
  }
  kitchen(g) {
    rect(g, Rr.plaster[3], 0, 0, 320, 120);
    for (let y = 18; y < 120; y += 12) for (let x = (y / 12) % 2 ? 0 : 12; x < 320; x += 24) { rect(g, Rr.paper[4], x, y, 23, 11); rect(g, Rr.paper[2], x, y + 10, 23, 1); }
    rect(g, Rr.wood[2], 0, 120, 320, 104); rect(g, Rr.wood[3], 0, 120, 320, 3); rect(g, Rr.wood[1], 0, 123, 320, 2);
    for (let y = 130; y < 224; y += 9) rect(g, Rr.wood[1], 0, y, 320, 1);
    for (let i = 0; i < 12; i++) rect(g, Rr.wood[3], hash(i, 1, 5) * 300, 128 + hash(i, 2, 5) * 90, 10 + hash(i, 3, 5) * 16, 1);
  }
  draw(g, sprite) {
    this.kitchen(g);
    const s = this.step || this.steps[this.steps.length - 1], t = this.t;
    if (s === 'chop') {
      rect(g, Rr.wood[4], 70, 134, 180, 60); rect(g, Rr.wood[3], 70, 190, 180, 4); rect(g, Rr.wood[1], 70, 194, 180, 1);
      disc(g, this.colour, 130, 160, 22, 12); disc(g, '#ffffff40', 124, 155, 10, 4);
      for (let i = 0; i < this.slices; i++) { rect(g, this.colour, 176 + (i % 3) * 14, 172 - Math.floor(i / 3) * 6, 10, 5); rect(g, '#ffffff50', 176 + (i % 3) * 14, 172 - Math.floor(i / 3) * 6, 10, 1); }
      const ky = 120 + Math.round(this.knife * 26);
      rect(g, Rr.metal[3], 150, ky, 8, 36); rect(g, Rr.metal[4], 150, ky, 2, 36); rect(g, Rr.woodDark[2], 150, ky - 16, 8, 16);
      // rhythm lane
      rect(g, '#2b1d2ed0', 20, 34, 280, 20); rect(g, Rr.butter[2], 58, 32, 3, 24);
      for (const q of this.notes) { const x = 60 + (q.at - this.st) * 120; if (x < 20 || x > 300) continue; const c = q.hit === null ? Rr.paper[4] : q.hit > 0.8 ? Rr.mint[2] : q.hit > 0 ? Rr.butter[2] : Rr.ink[3]; disc(g, c, x, 44, 5, 5); rect(g, Rr.ink[1], x - 1, 43, 3, 1); }
      head(g, `CHOP  (${this.si + 1}/${this.steps.length})`, this.name.toUpperCase());
      hint(g, 'PRESS SPACE / CLICK WHEN A BEAT REACHES THE LINE');
    } else if (s === 'stir') {
      rect(g, Rr.metal[1], 100, 120, 120, 6); disc(g, Rr.metal[1], 160, 150, 58, 30); disc(g, Rr.metal[2], 160, 146, 56, 27); disc(g, this.colour, 160, 132, 50, 14); disc(g, '#ffffff30', 148, 128, 20, 5);
      rect(g, Rr.charcoal[2], 92, 136, 10, 6); rect(g, Rr.charcoal[2], 218, 136, 10, 6);
      const sx = 160 + Math.cos(this.ang) * 34, sy = 132 + Math.sin(this.ang) * 9;
      line(g, Rr.wood[1], sx, sy, sx + 26, sy - 60); line(g, Rr.wood[3], sx + 1, sy, sx + 27, sy - 60); disc(g, Rr.wood[3], sx, sy, 4, 2);
      for (let i = 0; i < 4; i++) { const yy = 112 - ((t * 20 + i * 18) % 60); rect(g, '#ffffff50', 140 + i * 12 + Math.sin(t * 3 + i) * 3, yy, 3, 2); }
      rect(g, Rr.ink[1], 40, 40, 240, 10); rect(g, Rr.ink[2], 41, 41, 238, 8); rect(g, Rr.mint[1], 41 + 238 * 0.45, 41, 238 * 0.33, 8); rect(g, Rr.butter[2], 41 + 238 * clamp(this.speed / 1.3, 0, 1) - 1, 38, 3, 14);
      meter(g, 40, 54, 240, 3, this.st / this.dur, Rr.paper[3]);
      head(g, `STIR  (${this.si + 1}/${this.steps.length})`, this.name.toUpperCase());
      hint(g, 'HOLD SPACE OR CIRCLE THE MOUSE: KEEP THE SPEED IN THE GREEN');
    } else {
      const col = this.heat < 0.5 ? this.colour : this.heat < 0.82 ? Rr.wood[3] : Rr.woodDark[1];
      disc(g, Rr.charcoal[1], 160, 158, 62, 26); disc(g, Rr.charcoal[2], 160, 155, 58, 22); rect(g, Rr.charcoal[1], 220, 152, 70, 8); rect(g, Rr.woodDark[2], 250, 151, 40, 10);
      disc(g, col, 160, 152, 30, 11); disc(g, '#ffffff30', 152, 148, 12, 3);
      for (let i = 0; i < 6; i++) if (!this.stopped) { const p = (t * 3 + i * 0.3) % 1; rect(g, '#fffaf0', 136 + i * 9, 148 - p * 10, 1, 1); }
      for (let i = 0; i < 5; i++) { const fl = Math.sin(t * 20 + i) > 0; rect(g, fl ? Rr.coral[2] : Rr.butter[2], 126 + i * 14, 184, 6, 3); }
      const grad = [this.colour, Rr.butter[2], Rr.wood[3], Rr.wood[1], Rr.woodDark[1]];
      for (let i = 0; i < 240; i++) rect(g, grad[Math.min(4, Math.floor(i / 48))], 40 + i, 40, 1, 10);
      rect(g, Rr.mint[2], 40 + 240 * 0.56, 36, 240 * 0.2, 2); rect(g, Rr.paper[4], 40 + 240 * clamp(this.heat, 0, 1) - 1, 36, 3, 18);
      head(g, `FRY  (${this.si + 1}/${this.steps.length})`, this.name.toUpperCase());
      hint(g, this.stopped ? (this.res > 0.8 ? 'GOLDEN!' : this.res > 0.4 ? 'NOT BAD' : 'A LITTLE TOASTY') : 'PRESS SPACE / CLICK WHEN IT TURNS GOLDEN');
    }
    if (this.icon) { const img = sprite(this.icon); g.drawImage(img, 300 - img.width, 24); }
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 78 - Math.round((1 - this.msgT) * 8), Rr.butter[3], 2, '#2b1d2e');
    if (this.flash > 0) rect(g, '#ffffff30', 0, 0, 320, 224);
  }
}
