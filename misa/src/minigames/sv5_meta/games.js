// Seasonal activity minigames (320x224, drawn 1:1). Seven small mechanics (timing bar, catch, tap, race, lane runner, stack,
// sequence) are re-skinned by the theme of each of the 28 minigame activities in content/sv5_meta/data.js; every one has a bot.
// Controls: arrows/WASD or move the pointer, Space/E/Enter/click to act. Taps on the screen work for every mechanic.
import { register } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { Cursor, act } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { mulberry32, clamp } from '../../rng.js';
import { sfx } from '../../audio.js';
import { ACTS } from '../../content/sv5_meta/data.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
const pressed = (i, ...keys) => keys.some((k) => i.pressed.has(k));
const tri = (u) => { const v = ((u % 2) + 2) % 2; return v < 1 ? v : 2 - v; };

// ---------------------------------------------------------------- tiny item shapes, centred on (x, y), about 12 px
export function shape(g, kind, x, y, c, c2, t = 0) {
  x = Math.round(x); y = Math.round(y);
  switch (kind) {
    case 'petal': rect(g, c, x - 2, y - 3, 5, 6, c); rect(g, c, x - 1, y - 4, 3, 1); rect(g, c2, x - 1, y - 2, 2, 3); break;
    case 'stick': rect(g, c, x - 5, y - 1, 10, 2); rect(g, c, x + 2, y - 3, 2, 2); break;
    case 'tad': disc(g, c, x, y, 3); rect(g, c, x + 3, y, 4, 1); rect(g, c2, x - 1, y - 1, 1, 1); break;
    case 'leaf': rect(g, c, x - 4, y - 2, 8, 4); rect(g, c, x - 3, y - 3, 5, 1); rect(g, c2, x - 3, y, 6, 1); break;
    case 'star': rect(g, c, x - 1, y - 5, 3, 11); rect(g, c, x - 5, y - 1, 11, 3); rect(g, c2, x - 1, y - 1, 3, 3); break;
    case 'bird': rect(g, c, x - 5, y - 2, 4, 2); rect(g, c, x + 2, y - 2, 4, 2); rect(g, c, x - 1, y - 1, 3, 3); break;
    case 'sprout': rect(g, c, x, y - 2, 2, 8); rect(g, c, x - 5, y - 5, 5, 3); rect(g, c2, x + 2, y - 6, 5, 3); break;
    case 'drop': disc(g, c, x, y + 1, 3); rect(g, c, x, y - 4, 1, 3); rect(g, c2, x - 1, y, 1, 2); break;
    case 'paw': disc(g, c, x, y + 2, 3); for (const dx of [-4, -1, 2, 5]) rect(g, c2, x + dx - 1, y - 3 + (dx === -1 || dx === 2 ? -1 : 0), 2, 2); break;
    case 'tray': rect(g, c, x - 6, y - 2, 12, 5); rect(g, c2, x - 6, y - 2, 12, 1); rect(g, K.ink[1], x - 6, y + 3, 12, 1); break;
    case 'melon': disc(g, c, x, y, 7); disc(g, c2, x, y, 5); rect(g, '#2a2a2a', x - 2, y - 2, 1, 1); rect(g, '#2a2a2a', x + 2, y + 1, 1, 1); break;
    case 'bug': rect(g, c, x - 3, y - 1, 6, 4); rect(g, c2, x - 5, y - 3, 3, 3); rect(g, c2, x + 3, y - 3, 3, 3); rect(g, '#1e1624', x - 1, y - 2, 2, 1); break;
    case 'ice': rect(g, c2, x - 3, y - 5, 7, 5); rect(g, c, x - 4, y - 3, 9, 3); rect(g, '#d8a070', x - 1, y, 3, 6); break;
    case 'wasp': rect(g, c, x - 4, y - 2, 8, 5); rect(g, '#1e1624', x - 2, y - 2, 1, 5); rect(g, '#1e1624', x + 1, y - 2, 1, 5); rect(g, '#ffffff', x - 3, y - 4, 3, 2); break;
    case 'rocket': rect(g, c, x - 2, y - 5, 5, 9); rect(g, c2, x - 1, y - 7, 3, 3); rect(g, c2, x - 1, y + 4, 3, 3 + (Math.floor(t * 12) % 2)); break;
    case 'tube': rect(g, c, x - 1, y - 6, 3, 12); rect(g, c2, x - 1, y - 6, 1, 12); break;
    case 'orb': g.globalAlpha = 0.25; disc(g, c, x, y, 7); g.globalAlpha = 0.6; disc(g, c, x, y, 4); g.globalAlpha = 1; rect(g, c2, x - 1, y - 1, 3, 3); break;
    case 'nut': disc(g, c, x, y, 4); rect(g, c2, x - 2, y - 3, 2, 3); rect(g, '#5a3a22', x - 1, y - 6, 3, 2); break;
    case 'ember': rect(g, c, x - 2, y - 2, 5, 5); rect(g, '#ffd76a', x - 1, y - 1, 3, 3); break;
    case 'moth': rect(g, c, x - 5, y - 2, 4, 4); rect(g, c, x + 2, y - 2, 4, 4); rect(g, '#d8c8a8', x - 1, y - 2, 3, 5); break;
    case 'straw': rect(g, c, x - 4, y - 4, 8, 9); rect(g, c2, x - 3, y - 3, 2, 8); rect(g, c2, x + 1, y - 3, 2, 8); rect(g, '#7a5a3a', x - 4, y, 8, 1); break;
    case 'pump': disc(g, c, x, y + 1, 6); rect(g, c2, x - 3, y - 4, 2, 9); rect(g, '#5aa860', x - 1, y - 7, 3, 3); break;
    case 'mush': rect(g, c, x - 4, y - 4, 9, 4); rect(g, c, x - 3, y - 5, 7, 1); rect(g, c2, x - 1, y, 3, 5); rect(g, '#ffffff', x - 2, y - 3, 1, 1); rect(g, '#ffffff', x + 2, y - 2, 1, 1); break;
    case 'ball': disc(g, c, x, y, 4); rect(g, c2, x + 1, y + 1, 3, 2); break;
    case 'snowball': disc(g, c, x, y, 5); rect(g, c2, x + 1, y + 2, 4, 2); break;
    case 'flag': rect(g, c, x - 1, y - 6, 2, 12); rect(g, c2, x + 1, y - 6, 6, 4); break;
    case 'rock': disc(g, c, x, y + 1, 4); rect(g, '#9a9aaa', x - 2, y - 2, 3, 2); break;
    case 'skate': rect(g, c, x - 5, y + 2, 11, 2); rect(g, c2, x - 3, y - 4, 5, 6); rect(g, c, x - 3, y - 4, 2, 6); break;
    case 'mallet': rect(g, c, x - 2, y - 2, 4, 9); rect(g, c2, x - 6, y - 7, 12, 6); break;
    case 'cup': rect(g, c, x - 4, y - 3, 8, 8); rect(g, c2, x - 3, y - 2, 6, 2); rect(g, c, x + 4, y - 1, 2, 4); rect(g, '#ffffff', x - 1, y - 7 + Math.floor(t * 4) % 2, 1, 3); break;
    case 'flake': rect(g, c, x - 1, y - 5, 3, 11); rect(g, c, x - 5, y - 1, 11, 3); rect(g, c2, x - 3, y - 3, 7, 7); rect(g, c, x - 1, y - 1, 3, 3); break;
    default: disc(g, c, x, y, 4);
  }
}

// ---------------------------------------------------------------- shared scenery and HUD
function scenery(g, th, t) {
  const [a, b, ground] = th.bg;
  rect(g, a, 0, 0, 320, 70); rect(g, b, 0, 70, 320, 80); rect(g, ground, 0, 150, 320, 74);
  rect(g, 'rgba(0,0,0,.12)', 0, 150, 320, 2);
  const fx = th.fx;
  if (fx === 'none') return;
  for (let i = 0; i < 18; i++) {
    const s = 10 + (i * 7) % 13, px = (i * 53 + (fx === 'rain' ? 0 : Math.sin(t * 0.7 + i) * 10)) % 330, py = ((t * s * (fx === 'rain' ? 9 : 1) + i * 37) % 150);
    if (fx === 'petal') { rect(g, K.sakura[2], px, py, 3, 2); rect(g, K.sakura[3], px + 1, py, 1, 1); }
    else if (fx === 'leaf') { rect(g, i % 2 ? '#d8742a' : '#e8a040', px, py, 3, 2); }
    else if (fx === 'snow') { rect(g, '#ffffff', px, py, 2, 2); }
    else if (fx === 'rain') { rect(g, 'rgba(160,190,230,.7)', px, py % 150, 1, 4); }
    else if (fx === 'spark') { g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 3 + i); rect(g, '#ffe9a0', px, py % 130, 1, 1); g.globalAlpha = 1; }
    else if (fx === 'cloud' && i < 4) { rect(g, '#ffffffc0', (px + t * 6) % 340 - 10, 14 + i * 24, 30, 6); rect(g, '#ffffffc0', (px + t * 6) % 340, 10 + i * 24, 18, 4); }
  }
}
function bars(g, title, bottom, right) {
  rect(g, '#2b1d2ee0', 0, 0, 320, 14); drawText(g, title, 6, 4, K.butter[3]);
  if (right) drawText(g, right, 314 - right.length * 4, 4, K.paper[4]);
  rect(g, '#2b1d2ec0', 0, 212, 320, 12); drawTextC(g, bottom, 160, 215, K.paper[3], 1, null);
}
const seedOf = (game, id) => ((game && game.day) || 3) * 7919 + (((game && game.state && game.state.stats && game.state.stats.sv5Acts) || 0) * 104729) + [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);

class Base {
  constructor(game, th, o = {}) { this.th = th; this.p = th.p || {}; this.r = mulberry32(seedOf(game, o.id || th.title) >>> 0); Object.assign(this, { t: 0, done: false, score: 0, flash: 0 }); }
  end(score, text, extra = {}) { this.done = true; this.score = clamp(score, 0, 1); this.result = { text, ...extra }; sfx('levelup'); }
  finish() { this.finishNow(); }
  finishNow() { this.end(this.partial ? this.partial() : 0, 'Stopped early'); }
}

// ---------------------------------------------------------------- 1. timing bar
class Timing extends Base {
  constructor(game, th, o) {
    super(game, th, o);
    Object.assign(this, { rounds: this.p.rounds || 5, speed: this.p.speed || 1.1, zone: this.p.zone || 0.16, round: 0, u: 0, pts: 0, wait: 0, fb: '', perfect: 0 });
    this.newZone();
  }
  newZone() { this.cz = 0.22 + this.r() * 0.56; this.u = this.r() * 2; }
  get m() { return tri(this.u); }
  partial() { return this.pts / this.rounds; }
  update(dt, input) {
    if (this.done) return; this.t += dt;
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { if (++this.round >= this.rounds) return this.end(this.pts / this.rounds, `${this.perfect} perfect of ${this.rounds}`, { perfect: this.perfect }); this.newZone(); } return; }
    this.u += dt * this.speed * (1 + this.round * 0.08);
    if (act(input)) {
      const d = Math.abs(this.m - this.cz), z = this.zone;
      const res = d < z * 0.25 ? 'PERFECT!' : d < z * 0.5 ? 'GOOD!' : d < z ? 'OK' : 'MISS';
      this.pts += { 'PERFECT!': 1, 'GOOD!': 0.75, OK: 0.4, MISS: 0 }[res]; if (res === 'PERFECT!') this.perfect++;
      this.fb = res; this.wait = 0.7; sfx(res === 'MISS' ? 'wrong' : res === 'OK' ? 'blip' : 'chime');
    }
  }
  draw(g) {
    scenery(g, this.th, this.t);
    const A = this.th.a, big = this.fb && this.wait > 0 ? this.fb : '';
    for (let i = 0; i < this.rounds; i++) shape(g, A.shape, 70 + i * 36, 40, i < this.round ? A.c : '#ffffff55', A.c2, this.t);
    const grow = this.wait > 0 ? 2.2 : 1.7;
    g.save(); g.translate(160, 110); g.scale(grow, grow); shape(g, A.shape, 0, 0, A.c, A.c2, this.t); g.restore();
    rect(g, '#1e1624', 38, 164, 244, 18); rect(g, '#46365c', 40, 166, 240, 14);
    rect(g, K.mint[2], 40 + (this.cz - this.zone) * 240, 166, this.zone * 2 * 240, 14); rect(g, K.butter[3], 40 + (this.cz - this.zone * 0.25) * 240, 166, this.zone * 0.5 * 240, 14);
    rect(g, '#ffffff', 40 + this.m * 240 - 1, 162, 3, 22);
    if (big) drawTextC(g, big, 160, 140, K.butter[3], 2, null);
    bars(g, this.th.title, 'Press Space or tap when the marker is in the green', `${this.round + (this.wait > 0 ? 1 : 0)}/${this.rounds}`);
  }
}

// ---------------------------------------------------------------- 2. catch falling things
class Catch extends Base {
  constructor(game, th, o) { super(game, th, o); Object.assign(this, { time: this.p.time || 22, x: 160, items: [], next: 0.6, good: 0, bad: 0, spawned: 0 }); }
  partial() { return (this.good - this.bad * 0.5) / Math.max(1, this.spawned * 0.85); }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const ax = (input.keys.has('arrowright') || input.keys.has('d') ? 1 : 0) - (input.keys.has('arrowleft') || input.keys.has('a') ? 1 : 0);
    if (ax) this.x += ax * 190 * dt; else if (input.moved || input.down) this.x += clamp(input.mx - this.x, -330 * dt, 330 * dt);
    this.x = clamp(this.x, 20, 300);
    this.next -= dt;
    if (this.next <= 0 && this.t < this.time - 1.5) {
      this.next = (0.55 + this.r() * 0.5) / (this.p.rate || 1); const bad = this.th.b && this.r() < 0.3;
      this.items.push({ x: 24 + this.r() * 272, y: 20, vy: 60 + this.r() * 40 + this.t * 1.2, bad, ph: this.r() * 6 }); if (!bad) this.spawned++;
    }
    for (const it of this.items) {
      it.y += it.vy * dt; it.x += Math.sin(this.t * 2 + it.ph) * 14 * dt;
      if (!it.gone && it.y > 182 && it.y < 200 && Math.abs(it.x - this.x) < 22) { it.gone = true; if (it.bad) { this.bad++; sfx('wrong'); this.flash = 0.25; } else { this.good++; sfx('coin'); } }
    }
    this.items = this.items.filter((i) => !i.gone && i.y < 206);
    if (this.t >= this.time) this.end(this.partial(), `${this.good} caught`, { caught: this.good });
  }
  draw(g) {
    scenery(g, this.th, this.t);
    for (const it of this.items) { const s = it.bad ? this.th.b : this.th.a; shape(g, s.shape, it.x, it.y, s.c, s.c2, this.t); }
    rect(g, '#1e1624', this.x - 20, 190, 40, 9); rect(g, this.flash > 0 ? K.ribbon[2] : K.wood[2], this.x - 19, 191, 38, 7); rect(g, K.wood[3], this.x - 19, 191, 38, 2);
    bars(g, this.th.title, 'Move the basket with arrows or the pointer. Avoid the dark ones', `${Math.max(0, Math.ceil(this.time - this.t))}S  ${this.good}`);
  }
}

// ---------------------------------------------------------------- 3. tap targets
class Tap extends Base {
  constructor(game, th, o) { super(game, th, o); Object.assign(this, { time: this.p.time || 22, targets: [], next: 0.5, hits: 0, wrong: 0, spawned: 0, fx: [] }); this.cur = new Cursor(160, 120, 170, [6, 20, 314, 206]); }
  partial() { return (this.hits - this.wrong * 0.5) / Math.max(1, this.spawned * 0.85); }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.cur.update(dt, input);
    this.next -= dt;
    if (this.next <= 0 && this.t < this.time - 1.5 && this.targets.length < 5) {
      this.next = (0.5 + this.r() * 0.5) / (this.p.rate || 1);
      let x = 0, y = 0; for (let k = 0; k < 10; k++) { x = 24 + this.r() * 272; y = 40 + this.r() * 140; if (this.targets.every((q) => Math.hypot(q.x - x, q.y - y) > 26)) break; }
      const decoy = this.th.b && this.r() < 0.25; this.targets.push({ x, y, life: this.p.life || 1.5, decoy, t: 0 }); if (!decoy) this.spawned++;
    }
    for (const q of this.targets) { q.life -= dt; q.t += dt; }
    if (act(input)) {
      let best = null, bd = 15; for (const q of this.targets) { const d = Math.hypot(q.x - this.cur.x, q.y - this.cur.y); if (d < bd) { best = q; bd = d; } }
      if (best) { best.life = -1; if (best.decoy) { this.wrong++; sfx('wrong'); this.fx.push({ x: best.x, y: best.y, t: 0, bad: true }); } else { this.hits++; sfx('coin'); this.fx.push({ x: best.x, y: best.y, t: 0 }); } }
    }
    this.targets = this.targets.filter((q) => q.life > 0); for (const f of this.fx) f.t += dt; this.fx = this.fx.filter((f) => f.t < 0.5);
    if (this.t >= this.time) this.end(this.partial(), `${this.hits} of ${this.spawned}`, { hits: this.hits });
  }
  draw(g) {
    scenery(g, this.th, this.t);
    for (const q of this.targets) { const s = q.decoy ? this.th.b : this.th.a, pop = Math.min(1, q.t * 6); g.globalAlpha = Math.min(1, q.life * 3); shape(g, s.shape, q.x, q.y - (1 - pop) * 6, s.c, s.c2, this.t); g.globalAlpha = 1; }
    for (const f of this.fx) { g.globalAlpha = 1 - f.t * 2; drawTextC(g, f.bad ? 'OOPS' : '+1', f.x, f.y - 10 - f.t * 20, f.bad ? K.ribbon[2] : K.butter[3], 1, null); g.globalAlpha = 1; }
    const c = this.cur; rect(g, '#1e1624', c.x - 6, c.y, 13, 1); rect(g, '#1e1624', c.x, c.y - 6, 1, 13); rect(g, '#fff', c.x - 5, c.y, 11, 1); rect(g, '#fff', c.x, c.y - 5, 1, 11);
    bars(g, this.th.title, 'Aim with the pointer or arrows, press Space or tap to catch', `${Math.max(0, Math.ceil(this.time - this.t))}S  ${this.hits}`);
  }
}

// ---------------------------------------------------------------- 4. race (mash)
class Race extends Base {
  constructor(game, th, o) { super(game, th, o); Object.assign(this, { len: this.p.len || 100, me: 0, rival: 0, rivalT: 10 + this.r() * 1.5, go: 1.2, rname: this.p.rival || 'Rival', presses: 0, myT: 0 }); }
  partial() { return 0.2 + 0.4 * clamp(this.me / this.len, 0, 1); }
  update(dt, input) {
    if (this.done) return; this.t += dt;
    if (this.t < this.go) return;
    const rt = this.t - this.go; this.rival = clamp(rt / this.rivalT, 0, 1) * this.len * (0.96 + 0.08 * Math.sin(rt * 2));
    if (act(input) || input.pressed.has('arrowright') || input.pressed.has('d')) { this.me += 2; this.presses++; if (this.presses % 4 === 0) sfx('blip'); }
    if (this.me >= this.len) { this.myT = rt; const lead = clamp((this.rivalT - rt) / this.rivalT, 0, 1); return this.end(0.62 + 0.38 * Math.min(1, lead * 2.5), `Won by ${(Math.max(0, this.rivalT - rt)).toFixed(1)}s`, { won: true }); }
    if (rt >= this.rivalT) { this.end(0.2 + 0.4 * clamp(this.me / this.len, 0, 1), `${this.rname} won this one`, { won: false }); }
  }
  draw(g) {
    scenery(g, this.th, this.t);
    const fin = 286, x0 = 30, lane = (y, p, c, c2, label) => { rect(g, 'rgba(0,0,0,.18)', x0, y, fin - x0, 22); rect(g, '#ffffff', fin, y, 3, 22); const px = x0 + (fin - x0 - 14) * clamp(p / this.len, 0, 1); rect(g, c, px, y + 4, 12, 14); rect(g, c2, px + 2, y + 6, 8, 4); shape(g, this.th.a.shape, px + 6, y - 6 - Math.abs(Math.sin(this.t * 10)) * 3, this.th.a.c, this.th.a.c2, this.t); drawText(g, label, x0 + 2, y + 24, '#2b1d2e', 1, null); };
    lane(70, this.me, K.coral[2], K.coral[4], 'MISA'); lane(120, this.rival, K.sky[2], K.sky[4], this.rname.toUpperCase());
    if (this.t < this.go) drawTextC(g, 'READY...', 160, 170, K.butter[3], 2, null); else if (this.t < this.go + 0.6) drawTextC(g, 'GO!', 160, 170, K.butter[3], 2, null);
    bars(g, this.th.title, 'Mash Space, tap or press right as fast as you can', `${Math.round(this.me / this.len * 100)}%`);
  }
}

// ---------------------------------------------------------------- 5. lane runner
const LANE_X = [100, 160, 220];
class Lane extends Base {
  constructor(game, th, o) { super(game, th, o); Object.assign(this, { time: this.p.time || 24, lane: 1, px: 160, items: [], next: 0.7, good: 0, bad: 0, spawned: 0, flash: 0 }); }
  partial() { return (this.good - this.bad) / Math.max(1, this.spawned * 0.8); }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (pressed(input, 'arrowleft', 'a')) this.lane = Math.max(0, this.lane - 1);
    if (pressed(input, 'arrowright', 'd')) this.lane = Math.min(2, this.lane + 1);
    if (input.justDown) { const l = input.mx < 110 ? 0 : input.mx > 210 ? 2 : 1; this.lane = l; }
    this.px += (LANE_X[this.lane] - this.px) * Math.min(1, dt * 14);
    this.next -= dt;
    if (this.next <= 0 && this.t < this.time - 2) {
      this.next = (0.5 + this.r() * 0.35) / (this.p.rate || 1); const lane = Math.floor(this.r() * 3), bad = this.th.b && this.r() < 0.35;
      this.items.push({ lane, y: 18, bad, vy: 85 + this.t * 2 }); if (!bad) this.spawned++;
    }
    for (const it of this.items) { it.y += it.vy * dt; if (!it.gone && it.lane === this.lane && Math.abs(it.y - 180) < 12) { it.gone = true; if (it.bad) { this.bad++; this.flash = 0.3; sfx('wrong'); } else { this.good++; sfx('coin'); } } }
    this.items = this.items.filter((i) => !i.gone && i.y < 214);
    if (this.t >= this.time) this.end(this.partial(), `${this.good} collected`, { good: this.good });
  }
  draw(g) {
    scenery(g, this.th, this.t);
    for (let l = 0; l < 3; l++) { rect(g, 'rgba(255,255,255,.18)', LANE_X[l] - 24, 16, 48, 196); rect(g, 'rgba(0,0,0,.12)', LANE_X[l] - 24, 16, 1, 196); }
    for (const it of this.items) { const s = it.bad ? this.th.b : this.th.a; shape(g, s.shape, LANE_X[it.lane], it.y, s.c, s.c2, this.t); }
    const x = this.px, y = 184; rect(g, this.flash > 0 ? K.ribbon[2] : K.coral[2], x - 7, y - 10, 14, 18); rect(g, '#f4d0b0', x - 5, y - 16, 10, 7); rect(g, '#2a1c20', x - 5, y - 17, 10, 3);
    bars(g, this.th.title, 'Left and right or tap a lane. Collect the good, dodge the dark', `${Math.max(0, Math.ceil(this.time - this.t))}S  ${this.good}`);
  }
}

// ---------------------------------------------------------------- 6. stack
class Stack extends Base {
  constructor(game, th, o) {
    super(game, th, o);
    Object.assign(this, { n: this.p.n || 6, blocks: [{ x: 160, w: 84 }], w0: 84, u: 0.5, sx: 160, wait: 0, fb: '', ratios: [], falling: [] });
  }
  get speed() { return 1.0 + this.blocks.length * 0.1; }
  get top() { return this.blocks[this.blocks.length - 1]; }
  partial() { return this.ratios.reduce((a, b) => a + b, 0) / this.n; }
  update(dt, input) {
    if (this.done) return; this.t += dt;
    for (const f of this.falling) { f.y += 160 * dt; f.vx *= 1; f.x += f.vx * dt; } this.falling = this.falling.filter((f) => f.y < 230);
    if (this.wait > 0) { this.wait -= dt; return; }
    this.u += dt * this.speed * (this.p.speed || 1) * 0.9; this.sx = 50 + tri(this.u) * 220;
    if (act(input)) {
      const top = this.top, dx = this.sx - top.x, w = top.w;
      if (Math.abs(dx) < 4) { this.blocks.push({ x: top.x, w }); this.ratios.push(1); this.fb = 'PERFECT!'; sfx('chime'); }
      else if (Math.abs(dx) >= w) { this.falling.push({ x: this.sx, y: 150, w, vx: dx * 0.2 }); this.fb = 'MISSED'; this.ratios.push(0); sfx('wrong'); this.wait = 0.6; return this.stop(); }
      else {
        const nw = w - Math.abs(dx), nx = top.x + dx / 2; this.blocks.push({ x: nx, w: nw }); this.ratios.push(nw / this.w0);
        this.falling.push({ x: this.sx + Math.sign(dx) * (nw / 2), y: 150, w: Math.abs(dx), vx: dx * 0.3 }); this.fb = nw / w > 0.85 ? 'GOOD!' : 'OK'; sfx('blip');
      }
      this.wait = 0.35;
      if (this.blocks.length - 1 >= this.n) this.stop();
    }
  }
  stop() { this.stopping = true; this.end(this.ratios.reduce((a, b) => a + b, 0) / this.n, `${this.blocks.length - 1} of ${this.n} stacked`, { height: this.blocks.length - 1 }); }
  draw(g) {
    scenery(g, this.th, this.t); const A = this.th.a, bh = this.n > 4 ? 14 : 22, base = 200;
    this.blocks.forEach((b, i) => { const y = base - (i + 1) * bh; rect(g, '#1e1624', b.x - b.w / 2 - 1, y - 1, b.w + 2, bh + 2); rect(g, i % 2 ? A.c2 : A.c, b.x - b.w / 2, y, b.w, bh); rect(g, 'rgba(255,255,255,.35)', b.x - b.w / 2, y, b.w, 2); });
    for (const f of this.falling) rect(g, A.c, f.x - f.w / 2, f.y, f.w, bh);
    if (!this.done) { const y = base - (this.blocks.length + 1) * bh; const sy = Math.max(20, y - 8); rect(g, '#1e1624', this.sx - this.top.w / 2 - 1, sy - 1, this.top.w + 2, bh + 2); rect(g, A.c, this.sx - this.top.w / 2, sy, this.top.w, bh); }
    if (this.fb && this.wait > 0) drawTextC(g, this.fb, 160, 50, K.butter[3], 2, null);
    bars(g, this.th.title, 'Press Space or tap to drop the piece on the stack', `${this.blocks.length - 1}/${this.n}`);
  }
}

// ---------------------------------------------------------------- 7. sequence memory
const DIRS = [['arrowleft', 'a'], ['arrowdown', 's'], ['arrowup', 'w'], ['arrowright', 'd']], DPOS = [[84, 150], [160, 176], [160, 124], [236, 150]];
class Seq extends Base {
  constructor(game, th, o) {
    super(game, th, o);
    this.lens = this.p.lens || [3, 4, 5];
    Object.assign(this, { round: 0, phase: 'show', idx: 0, timer: 0.8, seq: [], mistakes: 0, cleared: 0, lit: -1, fb: '' });
    this.newRound();
  }
  newRound() { this.seq = Array.from({ length: this.lens[this.round]}, () => Math.floor(this.r() * 4)); this.phase = 'show'; this.idx = 0; this.timer = 0.9; }
  partial() { return this.cleared / this.lens.length; }
  press(d) {
    this.lit = d; this.litT = 0.18;
    if (d === this.seq[this.idx]) { this.idx++; sfx('blip'); if (this.idx >= this.seq.length) { this.cleared++; this.fb = 'NICE!'; sfx('chime'); this.round++; if (this.round >= this.lens.length) return this.end(Math.max(0.3, this.cleared / this.lens.length - this.mistakes * 0.12), `${this.cleared} rounds, ${this.mistakes} slips`, { slips: this.mistakes }); this.phase = 'pause'; this.timer = 0.8; } }
    else { this.mistakes++; this.fb = 'OOPS'; sfx('wrong'); if (this.mistakes >= 3) return this.end(this.cleared / this.lens.length * 0.8, `${this.cleared} rounds, ${this.mistakes} slips`, { slips: this.mistakes }); this.phase = 'pause'; this.timer = 0.9; this.retry = true; }
  }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.litT = Math.max(0, (this.litT || 0) - dt); if (this.litT <= 0) this.lit = this.phase === 'show' ? this.lit : -1;
    this.timer -= dt;
    if (this.phase === 'pause' && this.timer <= 0) { if (this.retry) { this.retry = false; this.idx = 0; this.phase = 'show'; this.timer = 0.9; } else this.newRound(); this.fb = ''; }
    else if (this.phase === 'show' && this.timer <= 0) {
      if (this.idx < this.seq.length) { this.lit = this.seq[this.idx]; this.litT = 0.4; sfx('blip'); this.idx++; this.timer = 0.62; } else { this.phase = 'input'; this.idx = 0; this.lit = -1; }
    } else if (this.phase === 'input') {
      for (let d = 0; d < 4; d++) if (pressed(input, ...DIRS[d])) { this.press(d); return; }
      if (input.justDown) { const d = DPOS.findIndex(([x, y]) => Math.hypot(input.mx - x, input.my - y) < 30); if (d >= 0) this.press(d); }
    }
  }
  draw(g) {
    scenery(g, this.th, this.t); const A = this.th.a;
    shape(g, A.shape, 160, 70, A.c, A.c2, this.t);
    DPOS.forEach(([x, y], d) => { const on = this.lit === d && (this.litT || 0) > 0; rect(g, '#1e1624', x - 22, y - 16, 44, 32); rect(g, on ? K.butter[3] : '#46365c', x - 21, y - 15, 42, 30); const lbl = ['<', 'v', '^', '>'][d]; drawTextC(g, lbl, x, y - 3, on ? '#1e1624' : K.paper[3], 2, null); });
    drawTextC(g, this.phase === 'show' ? 'WATCH...' : this.phase === 'input' ? 'YOUR TURN' : this.fb, 160, 102, K.butter[3], 1, null);
    bars(g, this.th.title, 'Repeat the pattern with the arrows or tap the pads', `${Math.min(this.round + 1, this.lens.length)}/${this.lens.length}`);
  }
}

// ---------------------------------------------------------------- bots
const pickBot = (i, ...keys) => { i.pressed = new Set(keys); return i; };
const BOTS = {
  timing(m, t, i) { if (m.wait <= 0 && Math.abs(m.m - m.cz) < m.zone * 0.3) pickBot(i, ' '); return i; },
  catch(m, t, i) { const c = m.items.filter((q) => !q.bad && !q.gone).sort((a, b) => b.y - a.y)[0]; if (c) { i.mx = c.x; i.moved = true; } return i; },
  tap(m, t, i) { const q = m.targets.filter((x) => !x.decoy).sort((a, b) => a.life - b.life)[0]; if (q) { i.mx = q.x; i.my = q.y; i.moved = true; pickBot(i, ' '); } return i; },
  race(m, t, i) { return Math.floor(t * 60) % 2 ? pickBot(i, ' ') : i; },
  lane(m, t, i) {
    const score = [0, 1, 2].map((l) => { const near = m.items.filter((q) => q.lane === l && q.y > 40 && q.y < 176).sort((a, b) => b.y - a.y)[0]; return !near ? 0.2 : near.bad ? -2 : 1 + near.y / 200; });
    const best = score.indexOf(Math.max(...score)); const cur = m.lane;
    if (score[cur] < 0 || best !== cur && score[best] > score[cur] + 0.3) pickBot(i, best < cur ? 'arrowleft' : 'arrowright');
    return i;
  },
  stack(m, t, i) { if (m.wait <= 0 && Math.abs(m.sx - m.top.x) < 2.2) pickBot(i, ' '); return i; },
  seq(m, t, i) { if (m.phase === 'input' && Math.floor(t * 60) % 6 === 0) pickBot(i, DIRS[m.seq[m.idx]][0]); return i; },
};
const MECH = { timing: Timing, catch: Catch, tap: Tap, race: Race, lane: Lane, stack: Stack, seq: Seq };
export const MINI_CLASSES = MECH;

for (const a of ACTS) {
  if (!a.mini) continue;
  const th = a.mini, M = MECH[th.mech];
  register('minigame', a.id, { title: th.title, resultTitle: 'NICE WORK!', music: 'minigame', make: (game, o) => new M(game, th, { ...(o || {}), id: a.id }), bot: BOTS[th.mech] });
}
