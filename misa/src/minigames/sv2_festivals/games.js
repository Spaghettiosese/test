// Festival set-piece minigames (320x224, drawn 1:1): the Flower Dance rhythm game, the Egg Hunt against Rina, the
// Grange strength tester and the midnight fireworks countdown. Every game has a bot so tests play it to the end.
// Controls: arrows/WASD or tap a lane (dance); move the pointer and press Space/click (egg hunt, strength, fireworks).
import { register } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { Cursor, act } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { mulberry32, clamp } from '../../rng.js';
import { sfx } from '../../audio.js';
import { rect, disc, sky, stars, skyline, misa, npc } from '../../content/events/backdrops.js';

const hud = (g, title, bottom, right) => {
  rect(g, '#2b1d2ee0', 0, 0, 320, 14); drawText(g, title, 6, 4, K.butter[3]); if (right) drawText(g, right, 314 - right.length * 4, 4, K.paper[4]);
  if (bottom) { rect(g, '#2b1d2ec0', 0, 212, 320, 12); drawTextC(g, bottom, 160, 215, K.paper[3], 1, null); }
};
const rngOf = (game, tag) => (game && game.rngFor ? game.rngFor(tag + (game.day || 0)) : mulberry32(11));
const pressed = (i, ...keys) => keys.some((k) => i.pressed.has(k));

// =================================================================== FLOWER DANCE (rhythm)
const LANES = [['arrowleft', 'a'], ['arrowdown', 's'], ['arrowup', 'w'], ['arrowright', 'd']];
const LANE_X = [100, 140, 180, 220], HIT_Y = 186, TOP_Y = 112, FALL = 1.25, WIN = 0.24;
function arrow(g, lane, cx, cy, c, c2) {
  const d = ['l', 'd', 'u', 'r'][lane];
  for (let i = 0; i < 8; i++) {
    const w = 2 * i + 1;
    if (d === 'l') rect(g, c, cx - 7 + i, cy - i, 1, w); else if (d === 'r') rect(g, c, cx + 7 - i, cy - i, 1, w);
    else if (d === 'u') rect(g, c, cx - i, cy - 7 + i, w, 1); else rect(g, c, cx - i, cy + 7 - i, w, 1);
  }
  rect(g, c2, cx - 1, cy - 1, 3, 3);
}
export class DanceGame {
  constructor(game, opts = {}) {
    const r = mulberry32(((game && game.day) || 7) * 13 + (opts.partner ? opts.partner.length * 7 : 0));
    this.partner = opts.partner || null;
    this.notes = []; let t = 2.2, last = -1;
    for (let i = 0; i < 26; i++) { let lane = Math.floor(r() * 4); if (lane === last && r() < 0.6) lane = (lane + 1) % 4; last = lane; this.notes.push({ t, lane, res: null }); t += i % 4 === 3 ? 0.95 : 0.6; }
    this.end = this.notes[this.notes.length - 1].t + 1.1;
    Object.assign(this, { t: 0, done: false, score: 0, pts: 0, combo: 0, best: 0, perfect: 0, good: 0, miss: 0, fb: null, press: [0, 0, 0, 0], petals: Array.from({ length: 22 }, (_, i) => ({ x: r() * 320, y: r() * 100, s: 8 + r() * 14, p: r() * 6 })) });
  }
  hit(lane) {
    this.press[lane] = 0.15;
    let n = null;
    for (const q of this.notes) if (q.lane === lane && q.res === null && Math.abs(q.t - this.t) <= WIN && (!n || Math.abs(q.t - this.t) < Math.abs(n.t - this.t))) n = q;
    if (!n) { this.combo = 0; return; }
    const d = Math.abs(n.t - this.t);
    n.res = d < 0.09 ? 'perfect' : d < 0.16 ? 'good' : 'ok';
    this.pts += n.res === 'perfect' ? 1 : n.res === 'good' ? 0.7 : 0.4;
    if (n.res === 'perfect') this.perfect++; else if (n.res === 'good') this.good++;
    this.combo++; this.best = Math.max(this.best, this.combo); this.fb = { text: n.res.toUpperCase() + '!', t: 0, lane };
    sfx(n.res === 'perfect' ? 'chime' : 'blip');
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    for (let l = 0; l < 4; l++) { this.press[l] = Math.max(0, this.press[l] - dt); if (pressed(input, ...LANES[l])) this.hit(l); }
    if (input.justDown && input.my > 96) { const l = LANE_X.findIndex((x) => Math.abs(input.mx - x) < 20); if (l >= 0) this.hit(l); }
    for (const n of this.notes) if (n.res === null && this.t > n.t + WIN) { n.res = 'miss'; this.miss++; this.combo = 0; }
    if (this.fb) this.fb.t += dt;
    if (this.t >= this.end) { this.done = true; this.score = clamp(this.pts / this.notes.length, 0, 1); this.result = { text: `${this.perfect} perfect, best combo ${this.best}`, perfect: this.perfect, good: this.good, miss: this.miss, combo: this.best }; sfx('levelup'); }
  }
  draw(g) {
    const t = this.t;
    sky(g, ['#f6c8d8', '#f8d8e0', '#fbe6ea'], 0, 104);
    for (const p of this.petals) { const x = (p.x + t * p.s * 0.6 + Math.sin(t + p.p) * 6) % 330, y = (p.y + t * p.s) % 104; rect(g, K.sakura[2], x, y, 3, 2); rect(g, K.sakura[3], x + 1, y, 1, 1); }
    rect(g, K.wood[3], 0, 82, 320, 22); rect(g, K.wood[2], 0, 82, 320, 2); for (let x = 0; x < 320; x += 20) rect(g, K.wood[2], x, 84, 1, 20);
    const sw = Math.sin(t * 3.2) * 3;
    misa(g, 'down', 130 + sw, 102, t, 'idle'); if (this.partner) npc(g, this.partner, 'down', 190 - sw, 102, t);
    rect(g, '#2b1d2e', 0, 104, 320, 120); rect(g, '#3a2a48', 70, 104, 180, 108);
    for (let l = 0; l < 4; l++) { const x = LANE_X[l]; rect(g, this.press[l] > 0 ? '#5a4a78' : '#46365c', x - 18, TOP_Y - 6, 36, 98); rect(g, '#2b1d2e', x - 19, TOP_Y - 6, 1, 98); }
    for (let l = 0; l < 4; l++) arrow(g, l, LANE_X[l], HIT_Y, this.press[l] > 0 ? K.butter[3] : K.paper[1], K.ink[1]);
    for (const n of this.notes) {
      if (n.res && n.res !== 'miss') continue;
      const y = HIT_Y - (n.t - t) / FALL * (HIT_Y - TOP_Y); if (y < TOP_Y - 8 || y > 214) continue;
      g.globalAlpha = n.res === 'miss' ? 0.3 : 1; arrow(g, n.lane, LANE_X[n.lane], y, [K.coral[2], K.butter[2], K.sky[2], K.mint[2]][n.lane], K.paper[4]); g.globalAlpha = 1;
    }
    if (this.fb && this.fb.t < 0.6) { g.globalAlpha = 1 - this.fb.t / 0.6; drawTextC(g, this.fb.text, LANE_X[this.fb.lane], HIT_Y - 26 - this.fb.t * 20, K.butter[3], 1, null); g.globalAlpha = 1; }
    hud(g, 'FLOWER DANCE', 'Press the arrows (or tap the lanes) as the petals reach the line', `COMBO ${this.combo}`);
  }
}
register('minigame', 'sv2_dance', {
  title: 'Flower Dance', resultTitle: 'WHAT A DANCE!', music: 'festival',
  make: (game, o) => new DanceGame(game, o || {}),
  bot(m, t, i) { for (const n of m.notes) if (n.res === null && Math.abs(n.t - m.t) < 0.03) { i.pressed = new Set([LANES[n.lane][0]]); break; } return i; },
});

// =================================================================== EGG HUNT
const place = (r, n) => {
  const pts = [];
  for (let tries = 0; pts.length < n && tries < 2000; tries++) {
    const x = 22 + r() * 276, y = 40 + r() * 158;
    if (Math.hypot(x - 160, y - 118) < 22 || pts.some((p) => Math.hypot(p.x - x, p.y - y) < 24)) continue;
    pts.push({ x, y });
  }
  return pts;
};
export class EggHunt {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'sv2egg'); this.r = r;
    const vals = [...Array(14).fill(1), 2, 2, 5];
    this.eggs = place(r, vals.length).map((p, i) => ({ ...p, v: vals[i], hide: Math.floor(r() * 3), got: null }));
    this.cur = new Cursor(160, 150, 150, [8, 22, 312, 208]);
    Object.assign(this, { t: 0, time: opts.time || 45, done: false, score: 0, mine: 0, rina: 0, found: 0, gold: false, rx: 24, ry: 36, target: null, rpause: 1.2, flash: [], msg: '' });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cur.update(dt, input);
    if (act(input)) {
      let best = null, bd = 13;
      for (const e of this.eggs) { const d = Math.hypot(e.x - this.cur.x, e.y - this.cur.y); if (!e.got && d < bd) { best = e; bd = d; } }
      if (best) { best.got = 'me'; this.mine += best.v; this.found++; if (best.v === 5) this.gold = true; this.flash.push({ x: best.x, y: best.y, t: 0, v: best.v }); sfx(best.v > 1 ? 'chime' : 'coin'); }
      else { this.msg = 'Nothing there'; this.msgT = 0.6; }
    }
    // Rina scurries to a random egg
    if (this.rpause > 0) this.rpause -= dt;
    else {
      if (!this.target || this.target.got) { const left = this.eggs.filter((e) => !e.got); this.target = left.length ? left[Math.floor(this.r() * left.length)] : null; }
      if (this.target) {
        const dx = this.target.x - this.rx, dy = this.target.y - this.ry, d = Math.hypot(dx, dy);
        if (d < 4) { this.target.got = 'rina'; this.rina += this.target.v; this.target = null; this.rpause = 1; } else { this.rx += dx / d * 45 * dt; this.ry += dy / d * 45 * dt; }
      }
    }
    this.flash = this.flash.filter((f) => (f.t += dt) < 0.8);
    if (this.msgT > 0) this.msgT -= dt;
    if (this.t >= this.time || this.eggs.every((e) => e.got)) this.finish();
  }
  finish() {
    if (this.done) return;
    this.done = true; this.score = clamp(this.mine / 12, 0, 1);
    this.result = { text: `You ${this.mine}  Rina ${this.rina}`, mine: this.mine, rina: this.rina, found: this.found, gold: this.gold, won: this.mine > this.rina };
    sfx(this.mine > this.rina ? 'levelup' : 'chime');
  }
  draw(g) {
    const t = this.t;
    rect(g, K.grass[3], 0, 0, 320, 224); for (let i = 0; i < 90; i++) rect(g, i % 2 ? K.grass[2] : K.grass[4], (i * 53) % 316, (i * 37) % 220, 3, 1);
    rect(g, K.stone[4], 120, 78, 80, 80); rect(g, K.stone[3], 122, 80, 76, 76);
    disc(g, 160, 118, 15, K.stone[2]); disc(g, 160, 118, 11, K.water[3]); disc(g, 160, 118, 3, K.water[5]);
    for (const e of this.eggs) {
      if (e.got) continue;
      const near = Math.hypot(e.x - this.cur.x, e.y - this.cur.y) < 36, c = e.v === 5 ? K.butter : e.v === 2 ? K.sakura : [K.sky, K.mint, K.lilac][e.hide];
      if (near || e.v === 5 && Math.floor(t * 2) % 3 === 0) { rect(g, c[3], e.x - 3, e.y - 5, 6, 8); rect(g, c[4], e.x - 2, e.y - 4, 2, 2); if (near) rect(g, K.paper[4], e.x + 5, e.y - 7 + Math.floor(t * 6) % 2, 1, 3); }
      else { rect(g, c[2], e.x - 2, e.y - 3, 4, 3); }
      const bc = [K.leaf, K.forest, K.grass][e.hide]; // the hiding bush
      disc(g, e.x, e.y + 3, 9, bc[2], 5); disc(g, e.x - 2, e.y + 1, 6, bc[3], 4); rect(g, bc[1], e.x - 8, e.y + 7, 16, 1);
    }
    for (const f of this.flash) { g.globalAlpha = 1 - f.t / 0.8; drawTextC(g, `+${f.v}`, f.x, f.y - 8 - f.t * 18, K.butter[2], 1, null); g.globalAlpha = 1; }
    npc(g, 'rina', 'down', this.rx, this.ry + 14, t);
    const { x, y } = this.cur; disc(g, x, y + 3, 7, K.wood[2], 4); disc(g, x, y + 1, 6, K.wood[3], 3); rect(g, K.wood[1], x - 6, y - 3, 12, 1); rect(g, K.wood[1], x - 5, y - 8, 1, 6); rect(g, K.wood[1], x + 4, y - 8, 1, 6); rect(g, K.wood[1], x - 5, y - 8, 10, 1);
    hud(g, 'EGG HUNT', this.msgT > 0 ? this.msg : 'Move the basket near a bush that sparkles, then click or press Space', `${Math.max(0, Math.ceil(this.time - t))}S  YOU ${this.mine}  RINA ${this.rina}`);
  }
}
register('minigame', 'sv2_egg_hunt', {
  title: 'Egg Hunt', resultTitle: 'HUNT OVER', music: 'festival',
  make: (game, o) => new EggHunt(game, o || {}),
  bot(m, t, i) {
    const left = m.eggs.filter((e) => !e.got).sort((a, b) => Math.hypot(a.x - m.cur.x, a.y - m.cur.y) - Math.hypot(b.x - m.cur.x, b.y - m.cur.y))[0];
    if (!left) return i;
    i.mx = left.x; i.my = left.y; i.moved = true;
    if (Math.hypot(left.x - m.cur.x, left.y - m.cur.y) < 4) i.pressed = new Set([' ']);
    return i;
  },
});

// =================================================================== STRENGTH TESTER
export class StrengthGame {
  constructor() { Object.assign(this, { t: 0, tries: 0, powers: [], v: 0, hold: 0, swing: 0, done: false, score: 0, wait: 0, ring: 0 }); }
  get meter() { const p = (this.t * 0.9) % 2; return p < 1 ? p : 2 - p; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.ring = Math.max(0, this.ring - dt);
    if (this.swing > 0) { this.swing -= dt; if (this.swing <= 0 && this.tries >= 3) this.finish(); return; }
    if (act(input)) { const p = this.meter, pw = Math.round(p * 100) / 100; this.powers.push(pw); this.tries++; this.v = pw; this.swing = 0.9; if (pw >= 0.93) { this.ring = 1.2; sfx('levelup'); } else sfx('blip'); }
  }
  finish() { this.done = true; const best = Math.max(...this.powers); this.score = best; this.result = { text: `Best swing ${Math.round(best * 100)}${best >= 0.93 ? ' - DING!' : ''}`, best, ding: best >= 0.93 }; }
  draw(g) {
    sky(g, ['#9ed8ff', '#bfe6f5', '#effaff'], 0, 150); rect(g, K.grass[3], 0, 150, 320, 74);
    rect(g, K.wood[1], 150, 24, 20, 150); rect(g, K.wood[3], 152, 24, 4, 150); rect(g, K.metal[2], 155, 30, 10, 130);
    const lvl = this.swing > 0 ? this.v : 0, y = 160 - lvl * 128;
    rect(g, K.vermilion[2], 156, y, 8, 160 - y); disc(g, 160, 28, 9, this.ring > 0 ? K.butter[3] : K.metal[3]); rect(g, K.metal[1], 156, 36, 8, 2);
    if (this.ring > 0) for (let a = 0; a < 12; a++) rect(g, K.butter[3], 160 + Math.cos(a / 12 * 6.28) * (12 + (1.2 - this.ring) * 20), 28 + Math.sin(a / 12 * 6.28) * (12 + (1.2 - this.ring) * 20), 2, 2);
    for (let i = 0; i <= 10; i++) rect(g, K.ink[1], 146, 160 - i * 12.8, 4, 1);
    misa(g, 'right', 112, 190, this.t, this.swing > 0.4 ? 'walk' : 'idle');
    rect(g, K.wood[2], 124, 168, 3, 22); rect(g, K.metal[2], 118 - (this.swing > 0 ? 6 : 0), 163, 14, 7);
    // power bar
    rect(g, K.ink[1], 224, 36, 22, 134); rect(g, K.paper[1], 226, 38, 18, 130);
    for (let i = 0; i < 130; i += 2) rect(g, i > 112 ? K.butter[3] : i > 70 ? K.mint[2] : K.sky[2], 226, 168 - i, 18, 2);
    const my = 168 - this.meter * 130; rect(g, K.ink[0], 222, my - 1, 26, 3); rect(g, K.ribbon[2], 224, my, 22, 1);
    drawText(g, `SWING ${Math.min(3, this.tries + (this.swing > 0 ? 0 : 1))}/3`, 224, 174, K.ink[1]);
    hud(g, 'STRENGTH TESTER', 'Press Space or click when the bar is near the top!', this.powers.length ? `BEST ${Math.round(Math.max(...this.powers) * 100)}` : '');
  }
}
register('minigame', 'sv2_strength', {
  title: 'Strength Tester', resultTitle: 'RING THE BELL', music: 'festival',
  make: () => new StrengthGame(),
  bot(m, t, i) { if (m.swing <= 0 && m.meter > 0.95) i.pressed = new Set([' ']); return i; },
});

// =================================================================== MIDNIGHT FIREWORKS
export class Fireworks {
  constructor(game) {
    const r = rngOf(game, 'sv2fw');
    this.shells = Array.from({ length: 12 }, (_, i) => ({ t0: 1 + i * 1.5 + r() * 0.4, x: 40 + r() * 240, apex: 40 + r() * 40, q: null, burstAt: 0, hue: i % 6 }));
    Object.assign(this, { t: 0, total: 22, done: false, score: 0, flash: 0, fin: false });
  }
  prog(s) { return (this.t - s.t0) / 1.3; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 2);
    if (act(input)) {
      let best = null;
      for (const s of this.shells) { const p = this.prog(s); if (s.q === null && p > 0.4 && p < 1.25 && (!best || Math.abs(p - 1) < Math.abs(this.prog(best) - 1))) best = s; }
      if (best) { best.q = clamp(1 - Math.abs(this.prog(best) - 1) / 0.6, 0.15, 1); best.burstAt = this.t; this.flash = best.q > 0.7 ? 0.4 : 0; sfx(best.q > 0.7 ? 'sv2_boom' : 'sv2_crackle'); }
    }
    for (const s of this.shells) if (s.q === null && this.prog(s) > 1.3) s.q = 0;
    if (!this.fin && this.t > 19.6) { this.fin = true; sfx('sv2_boom'); sfx('sv2_ribbon'); this.flash = 1; }
    if (this.t >= this.total) { this.done = true; this.score = clamp(this.shells.reduce((a, s) => a + (s.q || 0), 0) / this.shells.length / 0.85, 0, 1); this.result = { text: `${this.shells.filter((s) => s.q > 0.7).length} perfect bursts`, perfect: this.shells.filter((s) => s.q > 0.7).length }; }
  }
  draw(g) {
    const t = this.t, cols = [K.ribbon, K.butter, K.sky, K.sakura, K.mint, K.lilac];
    sky(g, ['#0e0a24', '#171233', '#241c48'], 0, 170); stars(g, t, 40, 110, 5);
    if (this.flash > 0) { g.globalAlpha = this.flash * 0.35; rect(g, '#ffffff', 0, 0, 320, 170); g.globalAlpha = 1; }
    for (const s of this.shells) {
      const p = this.prog(s), c = cols[s.hue];
      if (s.q === null && p > 0 && p <= 1.3) { const y = 170 - Math.min(1, p) * (170 - s.apex); rect(g, c[3], s.x, y, 2, 2); for (let k = 1; k < 6; k++) { g.globalAlpha = 0.5 - k * 0.08; rect(g, c[2], s.x, y + k * 3, 1, 2); } g.globalAlpha = 1; }
      if (s.q !== null && s.burstAt) {
        const age = t - s.burstAt; if (age < 1.5) { const r0 = (12 + s.q * 40) * Math.min(1, age * 2.2); g.globalAlpha = Math.max(0, 1 - age / 1.5); for (let a = 0; a < 20; a++) { const an = a / 20 * 6.283; rect(g, c[3], s.x + Math.cos(an) * r0, s.apex + Math.sin(an) * r0 + age * 14, 2, 2); if (s.q > 0.7) rect(g, c[4], s.x + Math.cos(an) * r0 * 0.6, s.apex + Math.sin(an) * r0 * 0.6 + age * 12, 1, 1); } g.globalAlpha = 1; }
      }
    }
    if (this.fin) for (let k = 0; k < 6; k++) { const age = t - 19.6, r0 = Math.min(1, age * 1.2) * (30 + k * 6); g.globalAlpha = Math.max(0, 1 - age / 2.4); for (let a = 0; a < 18; a++) { const an = a / 18 * 6.283 + k; rect(g, cols[k][3], 50 + k * 44 + Math.cos(an) * r0, 60 + (k % 2) * 20 + Math.sin(an) * r0 + age * 10, 2, 2); } g.globalAlpha = 1; }
    skyline(g, 170, '#120c22', 4); rect(g, '#120c22', 150, 90, 20, 82); rect(g, K.butter[3], 156, 100, 8, 8); rect(g, '#120c22', 146, 84, 28, 8);
    rect(g, '#1a1226', 0, 170, 320, 54); misa(g, 'up', 150, 212, t);
    const left = Math.max(0, Math.ceil(this.total - 2 - t));
    if (t > 8 && t < 20) drawTextC(g, String(left), 160, 36, K.paper[4], 4, null);
    if (t >= 19.6) drawTextC(g, 'HAPPY NEW YEAR!', 160, 36, K.butter[3], 2, null);
    hud(g, 'MIDNIGHT COUNTDOWN', 'Click or press Space when a rocket reaches the top of its climb', `${Math.max(0, Math.ceil(this.total - t))}S`);
  }
}
register('minigame', 'sv2_fireworks', {
  title: 'Midnight Countdown', resultTitle: 'HAPPY NEW YEAR!', music: 'festival',
  make: (game) => new Fireworks(game),
  bot(m, t, i) { if (m.shells.some((s) => s.q === null && Math.abs(m.prog(s) - 1) < 0.04)) i.pressed = new Set([' ']); return i; },
});
