// Festival minigames: goldfish scooping, ring toss, lantern release (sky or water), bean throwing, beach clean-up.
// Each has a bot so tests play it to the end. Drawn at 320x224, 1:1, palette ramps.
import { registerMany, features } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { Cursor, act, actHeld } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { rect, disc, sky, stars, sea, hills, misa, spr } from './backdrops.js';
import { mulberry32 } from '../../rng.js';

const seedRng = (g) => (g && g.rng ? g.rng : mulberry32(7));
function hud(g, title, left, right) {
  rect(g, '#2b1d2ee0', 0, 0, 320, 14); drawText(g, title, 6, 4, K.butter[3]); if (right) drawText(g, right, 314 - right.length * 4, 4, K.paper[4]);
  if (left) { rect(g, '#2b1d2ec0', 0, 212, 320, 12); drawTextC(g, left, 160, 215, K.paper[3], 1, null); }
}

// ---------- goldfish scooping ----------
class Goldfish {
  constructor(game) {
    const r = seedRng(game);
    this.fish = Array.from({ length: 9 }, (_, i) => ({ x: 70 + r() * 180, y: 70 + r() * 100, a: r() * 6.28, sp: 18 + r() * 22, gold: i === 0, c: i % 3 }));
    this.cur = new Cursor(160, 120, 110, [52, 52, 268, 196]);
    Object.assign(this, { t: 0, time: 30, paper: 1, caught: 0, dip: false, dipT: 0, done: false, score: 0, splash: [] });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cur.update(dt, input);
    for (const f of this.fish) {
      if (f.got) continue;
      f.a += (Math.sin(this.t * 0.7 + f.x * 0.05) * 0.8) * dt;
      const d = Math.hypot(f.x - this.cur.x, f.y - this.cur.y);
      if (this.dip && d < 30) f.a = Math.atan2(f.y - this.cur.y, f.x - this.cur.x) * 0.3 + f.a * 0.7;
      f.x += Math.cos(f.a) * f.sp * dt * (f.gold ? 1.5 : 1); f.y += Math.sin(f.a) * f.sp * dt * 0.8;
      if (f.x < 62 || f.x > 258) { f.a = Math.PI - f.a; f.x = Math.max(62, Math.min(258, f.x)); }
      if (f.y < 62 || f.y > 186) { f.a = -f.a; f.y = Math.max(62, Math.min(186, f.y)); }
    }
    const held = actHeld(input);
    if (held && !this.dip) { this.dip = true; this.dipT = 0; this.splash.push({ x: this.cur.x, y: this.cur.y, t: 0 }); }
    if (this.dip) { this.dipT += dt; this.paper -= dt * (0.05 + Math.min(0.5, this.cur.speedNow / 400)); }
    if (!held && this.dip) {
      this.dip = false;
      const f = this.fish.find((q) => !q.got && Math.hypot(q.x - this.cur.x, q.y - this.cur.y) < 11);
      if (f && this.dipT > 0.05) { f.got = true; this.caught += f.gold ? 2 : 1; this.paper -= 0.12; this.gold ||= f.gold; }
      else this.paper -= 0.04;
    }
    this.splash = this.splash.filter((s) => (s.t += dt) < 0.6);
    if (this.paper <= 0 || this.t >= this.time || this.fish.every((f) => f.got)) { this.done = true; this.score = Math.min(1, this.caught / 5); this.result = { text: `${this.caught} goldfish${this.paper <= 0 ? ' (the paper tore!)' : ''}`, caught: this.caught, gold: !!this.gold }; }
  }
  draw(g) {
    rect(g, K.wood[1], 0, 0, 320, 224); for (let y = 0; y < 224; y += 12) rect(g, K.wood[2], 0, y, 320, 1);
    rect(g, K.sky[0], 46, 46, 228, 156); rect(g, K.sky[1], 48, 48, 224, 152); rect(g, K.water[2], 52, 52, 216, 144);
    for (let i = 0; i < 18; i++) rect(g, K.water[3], 60 + ((i * 47 + this.t * 8) % 200), 60 + (i * 29) % 130, 6, 1);
    for (const f of this.fish) {
      if (f.got) continue;
      const c = f.gold ? K.butter : f.c === 2 ? K.paper : K.vermilion, dx = Math.cos(f.a) >= 0 ? 1 : -1;
      disc(g, f.x, f.y, 5, c[2], 3); disc(g, f.x + dx, f.y - 1, 2, c[4] || c[3], 1);
      rect(g, f.x - dx * 8 - 1, f.y - 3 + Math.sin(this.t * 12 + f.x) * 1, 3, 6, c[1]);
      if (f.c === 2 && !f.gold) rect(g, f.x - 2, f.y - 2, 3, 2, K.vermilion[2]);
      rect(g, K.ink[1], f.x + dx * 3, f.y - 1, 1, 1);
    }
    for (const s of this.splash) { g.globalAlpha = 1 - s.t / 0.6; const r = 6 + s.t * 20; for (let a = 0; a < 16; a++) rect(g, K.water[5], s.x + Math.cos(a / 16 * 6.28) * r, s.y + Math.sin(a / 16 * 6.28) * r * 0.6, 1, 1); g.globalAlpha = 1; }
    const { x, y } = this.cur, ry = this.dip ? 0 : -4;
    rect(g, K.ribbon[1], x + 9, y + ry - 1, 22, 3); rect(g, K.ribbon[3], x + 9, y + ry - 1, 22, 1);
    disc(g, x, y + ry, 11, K.ribbon[2], 9); disc(g, x, y + ry, 9, this.paper > 0.35 ? K.paper[4] : K.paper[2], 7);
    if (this.paper < 0.5) { rect(g, K.water[2], x - 3, y + ry - 2, 4, 3); } if (this.paper < 0.25) rect(g, K.water[2], x + 2, y + ry + 1, 4, 3);
    if (this.dip) { g.globalAlpha = 0.35; rect(g, K.water[2], x - 9, y - 7, 19, 14); g.globalAlpha = 1; }
    // bowl
    rect(g, K.sky[3], 278, 150, 34, 44); rect(g, K.sky[4], 278, 150, 34, 2); rect(g, K.water[3], 280, 160, 30, 32);
    for (let i = 0; i < this.caught; i++) rect(g, K.vermilion[2], 284 + (i % 4) * 6, 184 - Math.floor(i / 4) * 5, 4, 2);
    hud(g, 'GOLDFISH SCOOPING', 'Hold to dip the paper scoop, let go under a fish. Gentle moves!', `${Math.max(0, Math.ceil(this.time - this.t))}s  CAUGHT ${this.caught}`);
    rect(g, K.ink[1], 8, 40, 8, 120); rect(g, K.paper[1], 9, 41, 6, 118); rect(g, this.paper > 0.3 ? K.paper[4] : K.coral[3], 9, 41 + 118 * (1 - Math.max(0, this.paper)), 6, 118 * Math.max(0, this.paper)); drawText(g, 'POI', 4, 164, K.paper[3]);
  }
}
const goldfishBot = (m, t, i) => {
  const f = m.fish.filter((q) => !q.got).sort((a, b) => Math.hypot(a.x - m.cur.x, a.y - m.cur.y) - Math.hypot(b.x - m.cur.x, b.y - m.cur.y))[0];
  if (!f) return i;
  const d = Math.hypot(f.x - m.cur.x, f.y - m.cur.y);
  i.mx = f.x; i.my = f.y; i.moved = true;
  if (m.dip) { if (m.dipT > 0.08) return i; i.down = true; return i; }
  if (d < 6) i.down = true;
  return i;
};

// ---------- ring toss ----------
class RingToss {
  constructor(game) {
    const r = seedRng(game);
    this.prizes = [];
    for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) this.prizes.push({ x: 72 + k * 44 + (row % 2) * 10, y: 70 + row * 34, kind: Math.floor(r() * 5), big: row === 0 && k % 2 === 1 });
    Object.assign(this, { t: 0, rings: 5, hits: 0, phase: 'aim', ax: 0, py: 0, fly: null, done: false, score: 0, flash: [] });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    if (this.phase === 'aim') { this.ax = Math.sin(this.t * 2.2); if (act(input)) { this.phase = 'power'; this.pt = 0; } }
    else if (this.phase === 'power') { this.pt += dt; this.py = (Math.sin(this.pt * 2.6 - 1.57) + 1) / 2; if (act(input)) { const tx = 160 + this.ax * 130, ty = 170 - this.py * 120; this.fly = { x0: 160, y0: 200, tx, ty, p: 0 }; this.phase = 'fly'; } }
    else if (this.phase === 'fly') {
      this.fly.p += dt * 1.6;
      if (this.fly.p >= 1) {
        const pz = this.prizes.find((q) => !q.won && Math.hypot(q.x - this.fly.tx, q.y - this.fly.ty) < (q.big ? 7 : 10));
        if (pz) { pz.won = true; this.hits++; this.flash.push({ x: pz.x, y: pz.y, t: 0 }); }
        this.rings--; this.phase = this.rings > 0 ? 'aim' : 'end'; this.t = 0;
        if (!this.rings) { this.done = true; this.score = Math.min(1, this.hits / 3); this.result = { text: this.hits ? `${this.hits} prize${this.hits > 1 ? 's' : ''} won!` : 'So close!', hits: this.hits }; }
      }
    }
    this.flash = this.flash.filter((f) => (f.t += dt) < 1);
  }
  draw(g) {
    rect(g, K.ribbon[1], 0, 0, 320, 224); for (let x = 0; x < 320; x += 16) rect(g, x % 32 ? K.ribbon[2] : K.paper[4], x, 0, 16, 40);
    rect(g, K.woodDark[1], 40, 40, 240, 140); for (let row = 0; row < 3; row++) { rect(g, K.wood[3], 44, 76 + row * 34, 232, 4); rect(g, K.wood[1], 44, 80 + row * 34, 232, 2); }
    const cols = [K.coral, K.butter, K.mint, K.lilac, K.sky];
    for (const p of this.prizes) {
      rect(g, K.wood[2], p.x - 1, p.y - 2, 2, 8);
      if (p.won) continue;
      const c = cols[p.kind];
      if (p.big) { disc(g, p.x, p.y - 6, 8, c[2], 7); rect(g, p.x - 7, p.y - 16, 4, 4, c[2]); rect(g, p.x + 3, p.y - 16, 4, 4, c[2]); rect(g, p.x - 3, p.y - 8, 1, 2, K.ink[1]); rect(g, p.x + 2, p.y - 8, 1, 2, K.ink[1]); disc(g, p.x - 3, p.y - 10, 2, c[4]); }
      else { rect(g, p.x - 5, p.y - 10, 10, 10, c[2]); rect(g, p.x - 5, p.y - 10, 10, 2, c[4]); rect(g, p.x - 1, p.y - 10, 2, 10, K.paper[4]); }
    }
    for (const f of this.flash) { g.globalAlpha = 1 - f.t; for (let a = 0; a < 8; a++) rect(g, K.butter[4], f.x + Math.cos(a * 0.785) * f.t * 20, f.y - 6 + Math.sin(a * 0.785) * f.t * 20, 2, 2); g.globalAlpha = 1; }
    rect(g, K.wood[2], 0, 180, 320, 44); rect(g, K.wood[3], 0, 180, 320, 3);
    if (this.phase === 'aim' || this.phase === 'power') {
      const tx = 160 + this.ax * 130; rect(g, K.butter[4], tx - 1, 46, 2, 130); g.globalAlpha = 0.5; rect(g, K.butter[3], tx - 3, 46, 6, 130); g.globalAlpha = 1;
      if (this.phase === 'power') { const ty = 170 - this.py * 120; disc(g, tx, ty, 6, K.butter[4], 3); rect(g, K.ink[1], 300, 50, 10, 124); rect(g, K.mint[2], 301, 51 + 122 * (1 - this.py), 8, 122 * this.py); }
    }
    if (this.fly) { const f = this.fly, p = Math.min(1, f.p), x = f.x0 + (f.tx - f.x0) * p, y = f.y0 + (f.ty - f.y0) * p - Math.sin(p * Math.PI) * 50, r = 9 - p * 3; for (let a = 0; a < 20; a++) rect(g, K.butter[2], x + Math.cos(a / 20 * 6.28) * r, y + Math.sin(a / 20 * 6.28) * r * 0.5, 2, 1); }
    for (let i = 0; i < this.rings; i++) { for (let a = 0; a < 14; a++) rect(g, K.butter[2], 20 + i * 18 + Math.cos(a / 14 * 6.28) * 6, 196 + Math.sin(a / 14 * 6.28) * 3, 2, 1); }
    hud(g, 'RING TOSS', this.phase === 'aim' ? 'Press to stop the aim line' : this.phase === 'power' ? 'Press to set the distance' : '', `RINGS ${this.rings}  PRIZES ${this.hits}`);
  }
}
const ringBot = (m, t, i) => {
  const target = m.prizes.find((p) => !p.won); if (!target) { i.pressed = new Set([' ']); return i; }
  if (m.phase === 'aim' && Math.abs(160 + m.ax * 130 - target.x) < 4) i.pressed = new Set([' ']);
  if (m.phase === 'power' && Math.abs(170 - m.py * 120 - target.y) < 5) i.pressed = new Set([' ']);
  return i;
};

// ---------- lantern release (sky lanterns, or floating lanterns on the water with opts.water) ----------
class Lanterns {
  constructor(game, opts = {}) { Object.assign(this, { water: !!opts.water, t: 0, left: 6, good: 0, wind: 0, flying: [], done: false, score: 0, wait: 0 }); }
  get calm() { return Math.abs(this.wind) < 0.28; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.wait -= dt;
    this.wind = Math.sin(this.t * 1.7) * 0.7 + Math.sin(this.t * 4.3) * 0.3;
    if (this.left > 0 && this.wait <= 0 && act(input)) {
      const ok = this.calm;
      this.flying.push({ x: 160, y: this.water ? 190 : 170, ok, t: 0, drift: this.wind });
      if (ok) this.good++; this.left--; this.wait = 0.5;
    }
    for (const l of this.flying) { l.t += dt; if (this.water) { l.x += (l.ok ? 6 : 14 * l.drift) * dt + Math.sin(l.t * 2) * 0.2; l.y -= (l.ok ? 9 : 5) * dt; } else { l.y -= (l.ok ? 26 : 12) * dt; l.x += (l.ok ? Math.sin(l.t) * 4 : l.drift * 30) * dt; } }
    if (this.left === 0 && this.wait <= -2.5) { this.done = true; this.score = this.good / 6; this.result = { text: `${this.good} of 6 lanterns sailed away perfectly`, good: this.good }; }
  }
  draw(g) {
    if (this.water) { sky(g, ['#120e2a', '#1c1840', '#2a2458'], 0, 110); stars(g, this.t, 50, 100, 31); sea(g, 110, ['#0c1430', '#141e40', '#1e2a58', '#2e3e70'], this.t, 200); rect(g, K.woodDark[1], 0, 196, 320, 28); rect(g, K.wood[1], 0, 196, 320, 2); }
    else { sky(g, ['#120e2a', '#1c1840', '#2a2458', '#3a2c60'], 0, 180); stars(g, this.t, 70, 160, 33); hills(g, 186, '#1a1430', 6); }
    for (const l of this.flying) {
      const s = this.water ? Math.max(0.4, 1 - l.t * 0.04) : Math.max(0.3, 1 - l.t * 0.05), a = l.ok ? 1 : Math.max(0.3, 1 - l.t * 0.15);
      g.globalAlpha = 0.25 * a; disc(g, l.x, l.y + (this.water ? 8 : 0), 12 * s, K.butter[3], this.water ? 3 : 12 * s); g.globalAlpha = a;
      rect(g, K.butter[3], l.x - 5 * s, l.y - 8 * s, 10 * s, 12 * s); rect(g, K.butter[4], l.x - 5 * s, l.y - 8 * s, 3 * s, 12 * s); rect(g, K.paper[4], l.x - 5 * s, l.y - 8 * s, 10 * s, 1);
      if (this.water) rect(g, K.wood[1], l.x - 6 * s, l.y + 4 * s, 12 * s, 2); g.globalAlpha = 1;
    }
    misa(g, 'up', 160, this.water ? 220 : 214, this.t);
    if (this.left > 0 && this.wait <= 0) { rect(g, K.butter[3], 155, this.water ? 172 : 160, 10, 12); rect(g, K.butter[4], 155, this.water ? 172 : 160, 3, 12); }
    // wind gauge
    rect(g, K.ink[1], 60, 20, 200, 10); rect(g, K.coral[1], 61, 21, 198, 8); rect(g, K.mint[2], 160 - 0.28 * 99, 21, 0.56 * 99, 8);
    rect(g, K.paper[4], 160 + this.wind * 99 - 1, 18, 3, 14); drawTextC(g, this.calm ? 'CALM - NOW!' : 'WINDY...', 160, 34, this.calm ? K.mint[3] : K.coral[3], 1, null);
    hud(g, this.water ? 'FLOATING LANTERNS' : 'LANTERN RELEASE', 'Let each lantern go when the wind is calm', `LEFT ${this.left}  PERFECT ${this.good}`);
  }
}
const lanternBot = (m, t, i) => { if (m.calm && Math.abs(m.wind) < 0.15) i.pressed = new Set([' ']); return i; };

// ---------- bean throwing (Setsubun) ----------
const SLOTS = [[60, 80], [160, 70], [260, 80], [100, 150], [220, 150]];
class Beans {
  constructor(game) { Object.assign(this, { rng: seedRng(game), t: 0, time: 25, hits: 0, oops: 0, pops: [], beans: [], done: false, score: 0, spawn: 0.6 }); this.cur = new Cursor(160, 120, 160, [10, 30, 310, 200]); }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.spawn -= dt; this.cur.update(dt, input);
    if (this.spawn <= 0) {
      const free = SLOTS.map((_, i) => i).filter((i) => !this.pops.some((p) => p.slot === i));
      if (free.length) { const slot = free[Math.floor(this.rng() * free.length)]; this.pops.push({ slot, t: 0, life: 1.4 + this.rng() * 0.6, fuku: this.rng() < 0.22 }); }
      this.spawn = 0.45 + this.rng() * 0.4;
    }
    for (const p of this.pops) p.t += dt;
    this.pops = this.pops.filter((p) => p.t < p.life && !p.hit);
    if (act(input)) {
      this.beans.push({ x: this.cur.x, y: this.cur.y, t: 0 });
      const p = this.pops.find((q) => Math.hypot(SLOTS[q.slot][0] - this.cur.x, SLOTS[q.slot][1] - this.cur.y) < 18);
      if (p) { p.hit = true; if (p.fuku) this.oops++; else this.hits++; }
    }
    this.beans = this.beans.filter((b) => (b.t += dt) < 0.3);
    if (this.t >= this.time) { this.done = true; this.score = Math.max(0, Math.min(1, (this.hits - this.oops) / 12)); this.result = { text: `Oni chased out: ${this.hits}${this.oops ? `  (oops, ${this.oops} lucky faces)` : ''}`, hits: this.hits }; }
  }
  draw(g) {
    rect(g, K.plaster[3], 0, 0, 320, 224); for (let y = 0; y < 224; y += 4) rect(g, K.plaster[2], 0, y, 320, 1);
    rect(g, K.wood[1], 0, 196, 320, 28);
    for (const [i, [x, y]] of SLOTS.entries()) {
      rect(g, K.woodDark[1], x - 26, y - 30, 52, 50); rect(g, K.sky[3], x - 22, y - 26, 44, 42); rect(g, K.woodDark[2], x - 1, y - 26, 2, 42);
      const p = this.pops.find((q) => q.slot === i);
      if (p) {
        const up = Math.min(1, p.t * 6, (p.life - p.t) * 6), yy = y + 10 - up * 16;
        g.save(); g.beginPath(); g.rect(x - 22, y - 26, 44, 42); g.clip();
        if (p.fuku) { disc(g, x, yy, 12, K.paper[4], 11); disc(g, x - 6, yy + 3, 3, K.sakura[3], 2); disc(g, x + 6, yy + 3, 3, K.sakura[3], 2); rect(g, x - 5, yy - 2, 3, 1, K.ink[1]); rect(g, x + 2, yy - 2, 3, 1, K.ink[1]); rect(g, x - 2, yy + 5, 4, 1, K.ribbon[2]); rect(g, x - 12, yy - 12, 24, 6, K.ink[1]); }
        else spr(g, 'ev_oni_mask', x, yy + 11);
        g.restore();
      }
      rect(g, K.wood[2], x - 26, y + 16, 52, 4); rect(g, K.wood[3], x - 26, y + 16, 52, 1);
    }
    for (const b of this.beans) for (let k = 0; k < 5; k++) rect(g, K.butter[3], b.x - 6 + k * 3 + b.t * 10 * (k - 2), b.y - 4 + Math.sin(k) * 4 + b.t * 20, 2, 2);
    const { x, y } = this.cur; for (let k = 0; k < 3; k++) rect(g, K.butter[2], x - 3 + k * 3, y - 1, 2, 2); rect(g, K.ink[1], x - 6, y - 6, 3, 1); rect(g, K.ink[1], x + 4, y - 6, 3, 1); rect(g, K.ink[1], x - 6, y + 5, 3, 1); rect(g, K.ink[1], x + 4, y + 5, 3, 1);
    hud(g, 'BEAN THROWING', 'Oni out! Luck in! Throw beans at the oni, not the lucky faces', `${Math.max(0, Math.ceil(this.time - this.t))}s  ONI ${this.hits}`);
  }
}
const beansBot = (m, t, i) => { const p = m.pops.find((q) => !q.fuku && q.t > 0.15); if (p) { const [x, y] = SLOTS[p.slot]; i.mx = x; i.my = y; i.moved = true; if (Math.hypot(m.cur.x - x, m.cur.y - y) < 4) i.pressed = new Set([' ']); } return i; };

// ---------- beach clean-up ----------
const TRASH = ['can', 'bottle', 'bag', 'net', 'cup'];
class Cleanup {
  constructor(game) {
    const r = seedRng(game);
    this.items = Array.from({ length: 22 }, (_, i) => ({ x: 20 + r() * 280, y: 70 + r() * 130, kind: i < 18 ? TRASH[i % 5] : 'shell' }));
    Object.assign(this, { t: 0, time: 60, px: 160, py: 190, got: 0, shells: 0, done: false, score: 0, dir: 'up', moving: false });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    let vx = (input.keys.has('arrowright') || input.keys.has('d') ? 1 : 0) - (input.keys.has('arrowleft') || input.keys.has('a') ? 1 : 0), vy = (input.keys.has('arrowdown') || input.keys.has('s') ? 1 : 0) - (input.keys.has('arrowup') || input.keys.has('w') ? 1 : 0);
    if (!vx && !vy && input.down) { const dx = input.mx - this.px, dy = input.my - this.py; if (Math.hypot(dx, dy) > 3) { vx = dx; vy = dy; } }
    const n = Math.hypot(vx, vy); this.moving = n > 0;
    if (n) { this.px = Math.max(10, Math.min(310, this.px + (vx / n) * 80 * dt)); this.py = Math.max(64, Math.min(208, this.py + (vy / n) * 80 * dt)); this.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down'; }
    for (const it of this.items) if (!it.got && Math.hypot(it.x - this.px, it.y - (this.py - 4)) < 10) { it.got = true; if (it.kind === 'shell') this.shells++; else this.got++; }
    const trash = this.items.filter((i) => i.kind !== 'shell');
    if (this.t >= this.time || trash.every((i) => i.got)) { this.done = true; this.score = this.got / trash.length; this.result = { text: `${this.got} pieces of litter collected${this.shells ? `, ${this.shells} shells found` : ''}`, got: this.got, shells: this.shells }; }
  }
  draw(g) {
    sky(g, [K.sky[2], K.sky[3]], 0, 30); sea(g, 30, K.water, this.t, 60);
    for (let x = 0; x < 320; x++) rect(g, K.water[4], x, 58 + Math.round(Math.sin(x * 0.08 + this.t * 2) * 2), 1, 2);
    rect(g, K.sand[3], 0, 62, 320, 162); for (let i = 0; i < 60; i++) rect(g, i % 2 ? K.sand[2] : K.sand[4], (i * 71) % 320, 66 + (i * 37) % 156, 2, 1);
    for (const it of this.items) {
      if (it.got) continue;
      const { x, y } = it;
      if (it.kind === 'can') { rect(g, x - 4, y - 3, 8, 5, K.ribbon[2]); rect(g, x - 4, y - 3, 8, 1, K.metal[4]); rect(g, x - 1, y - 2, 3, 2, K.paper[4]); }
      else if (it.kind === 'bottle') { rect(g, x - 5, y - 2, 9, 4, K.mint[3]); rect(g, x + 4, y - 1, 3, 2, K.mint[2]); rect(g, x - 4, y - 2, 6, 1, K.mint[4]); }
      else if (it.kind === 'bag') { disc(g, x, y, 5, K.paper[4], 3); rect(g, x - 2, y - 4, 1, 2, K.paper[3]); rect(g, x + 2, y - 4, 1, 2, K.paper[3]); }
      else if (it.kind === 'net') { for (let k = 0; k < 4; k++) { rect(g, x - 6, y - 3 + k * 2, 12, 1, K.forest[3]); rect(g, x - 6 + k * 4, y - 3, 1, 7, K.forest[3]); } }
      else if (it.kind === 'cup') { rect(g, x - 3, y - 4, 6, 7, K.paper[4]); rect(g, x - 3, y - 4, 6, 2, K.sky[2]); }
      else { disc(g, x, y, 4, K.coral[3], 3); for (let k = -2; k <= 2; k += 2) rect(g, x + k, y - 2, 1, 4, K.coral[2]); }
    }
    misa(g, this.dir, this.px, this.py, this.t, this.moving ? 'walk' : 'idle');
    spr(g, 'ev_trash_bags', 300, 220);
    hud(g, 'BEACH CLEAN-UP', 'Walk over litter to pick it up. Shells are a bonus!', `${Math.max(0, Math.ceil(this.time - this.t))}s  LITTER ${this.got}`);
  }
}
const cleanupBot = (m, t, i) => {
  const it = m.items.filter((q) => !q.got && q.kind !== 'shell').sort((a, b) => Math.hypot(a.x - m.px, a.y - m.py) - Math.hypot(b.x - m.px, b.y - m.py))[0];
  if (it) { i.down = true; i.mx = it.x; i.my = it.y + 4; }
  return i;
};

registerMany('minigame', {
  fest_goldfish: { title: 'Goldfish scooping', music: 'festival', make: (g) => new Goldfish(g), bot: goldfishBot },
  fest_ringtoss: { title: 'Ring toss', music: 'festival', make: (g) => new RingToss(g), bot: ringBot },
  fest_lanterns: { title: 'Lantern release', music: 'night', make: (g, o) => new Lanterns(g, o), bot: lanternBot },
  fest_beans: { title: 'Bean throwing', music: 'festival', make: (g) => new Beans(g), bot: beansBot },
  fest_cleanup: { title: 'Beach clean-up', music: 'beach', make: (g) => new Cleanup(g), bot: cleanupBot },
});

features('Festival minigames', [
  'Goldfish scooping: dip a paper scoop under darting goldfish before the paper tears; a rare golden fish counts double',
  'Ring toss: stop the aim line, then the distance meter, to land rings on the prizes',
  'Lantern release: let paper lanterns go when the wind is calm so they sail up into the night',
  'Floating lanterns: the same lantern release on the water for the Obon lantern night',
  'Bean throwing: chase the oni out of the windows with beans, but don\'t hit the lucky faces',
  'Beach clean-up: a one-minute dash to pick up litter along the shore, with shells as a bonus',
]);
