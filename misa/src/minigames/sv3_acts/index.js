// Story Acts minigames (none can be failed, every one has a bot):
//   sv3_sigil   repeat a sequence of wave glyphs (arrow keys) to wake a Tide Lantern
//   sv3_chain   press when the beam crosses each Tide Lantern to light the chain (Night of a Hundred Lights)
//   sv3_roast   marshmallow timing at the camp fire
//   sv3_cue     hit your stage cues in the school play
//   sv3_heist   creep past the guard while his back is turned (hold Space or the mouse), freeze when he looks
import { register } from '../../core/registry.js';
import { act, actHeld } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';

const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const hash = (i, k = 1) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const press = (inp, k) => { inp.pressed = new Set([k]); return inp; };
const bar = (g, text) => { R(g, '#2b1d2ed0', 0, 0, 320, 14); drawTextC(g, text, 160, 3, '#ffd76a', 1, null); };
const help = (g, text) => { R(g, '#2b1d2ed0', 0, 210, 320, 14); drawTextC(g, text, 160, 212, '#fff6c0', 1, null); };
const star5 = (g, cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); };

// ---------------------------------------------------------------- sigil memory
const DIRS = ['arrowup', 'arrowright', 'arrowdown', 'arrowleft'], ALT = { w: 'arrowup', d: 'arrowright', s: 'arrowdown', a: 'arrowleft' };
class Sigil {
  constructor(g, o = {}) {
    const len = o.len || 5, seed = o.seed || 3;
    Object.assign(this, { seq: Array.from({ length: len }, (_, i) => DIRS[Math.floor(hash(i + seed, seed) * 4)]), phase: 'show', i: 0, t: 0, pos: 0, wrong: 0, done: false, score: 0, flash: 0, title: o.title || 'Wave sigil' });
  }
  update(dt, inp) {
    this.t += dt; this.flash -= dt;
    if (this.phase === 'show') { if (this.t > 0.8) { this.t = 0; this.i++; if (this.i >= this.seq.length) { this.phase = 'input'; this.pos = 0; this.i = 0; } } return; }
    if (this.phase === 'win') { if (this.t > 1.4) { this.done = true; this.score = Math.max(0.5, 1 - this.wrong * 0.1); } return; }
    let k = DIRS.find((d) => inp.pressed.has(d)) || Object.keys(ALT).find((a) => inp.pressed.has(a));
    if (ALT[k]) k = ALT[k];
    if (k) {
      if (k === this.seq[this.pos]) { this.pos++; this.flash = 0.25; if (this.pos >= this.seq.length) { this.phase = 'win'; this.t = 0; } }
      else { this.wrong++; this.phase = 'show'; this.i = 0; this.t = -0.6; }
    }
  }
  glyph(g, d, x, y, c) { const a = DIRS.indexOf(d); R(g, c, x - 2, y - 14, 4, 28); R(g, c, x - 14, y - 2, 28, 4); const dx = [0, 1, 0, -1][a], dy = [-1, 0, 1, 0][a]; R(g, c, x + dx * 14 - 5, y + dy * 14 - 5, 10, 10); }
  draw(g) {
    R(g, '#0c1226', 0, 0, 320, 224); for (let i = 0; i < 50; i++) R(g, '#4a6aa8', hash(i, 2) * 320, hash(i, 3) * 224, 1, 1);
    star5(g, 160, 100, 56 + Math.sin(this.t * 3) * 2, '#16264a'); star5(g, 160, 100, 44, '#1e3866');
    if (this.phase === 'show') { const d = this.seq[Math.min(this.i, this.seq.length - 1)]; if (this.t > 0) this.glyph(g, d, 160, 100, '#9cf0e0'); }
    else for (let k = 0; k < this.seq.length; k++) R(g, k < this.pos ? '#9cf0e0' : '#2a4a70', 160 - this.seq.length * 9 + k * 18, 100, 12, 12);
    if (this.phase === 'win') { star5(g, 160, 100, 60, '#fff6c0'); drawTextC(g, 'THE LANTERN WAKES', 160, 180, '#fff6c0', 1, null); }
    bar(g, `${this.title}: ${this.phase === 'show' ? 'watch the glyphs' : 'repeat them with the arrow keys'}`);
    help(g, 'A wrong key just shows the sigil again');
  }
}
register('minigame', 'sv3_sigil', { title: 'Wave sigil', make: (g, o) => new Sigil(g, o || {}), resultTitle: 'THE SIGIL SHINES',
  bot: (m, t, inp) => (m.phase === 'input' ? press(inp, m.seq[m.pos]) : inp) });

// ---------------------------------------------------------------- timing bar (chain / roast / cue)
const THEMES = {
  chain: { title: 'The chain of lights', help: 'Press Space when the beam is over the glowing lantern', bg: '#0c1030', n: 5, speed: 0.75, zone: 0.14, label: 'LANTERNS' },
  roast: { title: 'Marshmallow time', help: 'Press Space when it is golden, not black', bg: '#1a1426', n: 4, speed: 0.6, zone: 0.2, label: 'MARSHMALLOWS' },
  cue: { title: 'Stage cues', help: 'Press Space on your cue lights', bg: '#2a1228', n: 6, speed: 0.85, zone: 0.16, label: 'CUES' },
};
class Timing {
  constructor(g, o = {}, theme = 'chain') {
    const th = { ...THEMES[theme], ...o };
    Object.assign(this, { th, theme, mark: 0, dir: 1, round: 0, hits: 0, miss: 0, t: 0, done: false, score: 0, flash: 0, good: false, c: this.pick(0, th), end: 0 });
  }
  pick(r, th = this.th) { return 0.25 + hash(r + 1, th.n) * 0.5; }
  update(dt, inp) {
    this.t += dt; this.flash -= dt;
    if (this.end) { this.end += dt; if (this.end > 1.2) { this.done = true; this.score = Math.max(0.5, this.hits / this.th.n); } return; }
    this.mark += this.dir * this.th.speed * dt; if (this.mark > 1) { this.mark = 1; this.dir = -1; } if (this.mark < 0) { this.mark = 0; this.dir = 1; }
    if (act(inp)) {
      const ok = Math.abs(this.mark - this.c) <= this.th.zone / 2;
      this.good = ok; this.flash = 0.5; if (ok) this.hits++; else this.miss++;
      this.round++; this.c = this.pick(this.round);
      if (this.round >= this.th.n) this.end = 0.01;
    }
  }
  draw(g) {
    const th = this.th;
    R(g, th.bg, 0, 0, 320, 224); for (let i = 0; i < 40; i++) R(g, '#ffffff22', hash(i, 5) * 320, hash(i, 6) * 120, 1, 1);
    for (let i = 0; i < th.n; i++) {
      const x = 160 - th.n * 14 + i * 28 + 8, lit = i < this.hits + (this.good ? 0 : 0) && i < this.round, cur = i === this.round;
      if (this.theme === 'roast') { R(g, lit ? '#e8d0a0' : '#8a6a58', x - 6, 60, 12, 12); R(g, '#5a4030', x - 1, 72, 2, 20); }
      else { R(g, '#2a2448', x - 6, 56, 12, 18); R(g, lit ? '#ffe9a0' : cur ? '#6a5a90' : '#3a3460', x - 5, 57, 10, 16); if (lit) { g.save(); g.globalAlpha = 0.3; R(g, '#ffe9a0', x - 12, 50, 24, 30); g.restore(); } }
    }
    const x0 = 40, w = 240, y = 130; R(g, '#1a1226', x0 - 2, y - 2, w + 4, 24); R(g, '#3a2a48', x0, y, w, 20);
    R(g, this.flash > 0 ? (this.good ? '#86e0a0' : '#e08080') : '#ffd76a', x0 + (this.c - th.zone / 2) * w, y, th.zone * w, 20);
    R(g, '#fffaf0', x0 + this.mark * w - 2, y - 6, 4, 32);
    if (this.flash > 0) drawTextC(g, this.good ? 'PERFECT!' : 'OOPS', 160, 168, this.good ? '#86e0a0' : '#e08080', 2, null);
    drawTextC(g, `${th.label} ${Math.min(this.round, th.n)}/${th.n}`, 160, 190, '#b9a6c4', 1, null);
    bar(g, th.title); help(g, th.help);
  }
}
for (const th of Object.keys(THEMES)) {
  register('minigame', `sv3_${th}`, { title: THEMES[th].title, make: (g, o) => new Timing(g, o || {}, th), resultTitle: th === 'roast' ? 'GOLDEN AND GOOEY' : th === 'chain' ? 'THE BAY IS LIT' : 'CURTAIN CALL',
    bot: (m, t, inp) => (!m.end && Math.abs(m.mark - m.c) < Math.min(0.025, m.th.zone / 4) ? press(inp, ' ') : inp) });
}

// ---------------------------------------------------------------- heist: freeze while he looks
class Heist {
  constructor(g, o = {}) {
    Object.assign(this, { x: 0, t: 0, phase: 'away', pt: 1.6, warn: false, alerts: 0, done: false, score: 0, flash: 0, k: 0, win: 0, title: o.title || 'Operation Moth' });
  }
  update(dt, inp) {
    this.t += dt; this.flash -= dt; this.pt -= dt;
    if (this.win) { this.win += dt; if (this.win > 1.3) { this.done = true; this.score = Math.max(0.4, 1 - this.alerts * 0.15); } return; }
    if (this.pt <= 0) {
      this.k++;
      if (this.phase === 'away') { this.phase = 'look'; this.pt = 0.9 + hash(this.k, 2) * 0.5; this.warn = false; }
      else { this.phase = 'away'; this.pt = 1.4 + hash(this.k, 4) * 1.2; }
    }
    this.warn = this.phase === 'away' && this.pt < 0.45;
    const moving = actHeld(inp) || inp.keys.has('arrowright') || inp.keys.has('d');
    if (moving) {
      if (this.phase === 'look') { this.alerts++; this.flash = 0.6; this.x = Math.max(0, this.x - 0.08); this.phase = 'away'; this.pt = 1.2; }
      else this.x = Math.min(1, this.x + 0.2 * dt);
    }
    if (this.x >= 1) this.win = 0.01;
  }
  draw(g) {
    R(g, '#10142a', 0, 0, 320, 224); for (let i = 0; i < 40; i++) R(g, '#ffffff33', hash(i, 7) * 320, hash(i, 8) * 80, 1, 1);
    R(g, '#242038', 0, 90, 320, 134); R(g, '#1a1830', 0, 170, 320, 54); R(g, '#3a3450', 240, 70, 68, 90); R(g, '#ffd76a', 262, 100, 14, 20);
    const look = this.phase === 'look';
    R(g, '#4a4a68', 200, 130, 14, 34); R(g, look ? '#e0707a' : '#7a7a98', 202, 120, 10, 12);
    if (look) { g.save(); g.globalAlpha = 0.3; g.fillStyle = '#fff4c0'; g.beginPath(); g.moveTo(206, 126); g.lineTo(0, 190); g.lineTo(0, 130); g.fill(); g.restore(); }
    if (this.warn) drawTextC(g, '!', 207, 100, '#ffd76a', 3, null);
    R(g, '#2a2a3a', 20, 178, 280, 3); R(g, '#e8d4a8', 20 + this.x * 260 - 4, 164 + (this.flash > 0 ? 2 : 0), 8, 14); R(g, this.flash > 0 ? '#e08080' : '#3d5a8c', 20 + this.x * 260 - 4, 170, 8, 8);
    drawTextC(g, this.win ? 'IN!' : look ? 'FREEZE' : 'GO', 160, 196, look ? '#e08080' : '#86e0a0', 2, null);
    bar(g, this.title); help(g, `Hold Space to creep while his back is turned. Alerts: ${this.alerts}`);
  }
}
register('minigame', 'sv3_heist', { title: 'Operation Moth', make: (g, o) => new Heist(g, o || {}), resultTitle: 'IN AND OUT',
  bot: (m, t, inp) => { if (m.phase === 'away' && !m.warn && m.pt > 0.2) inp.keys = new Set([' ']); return inp; } });
