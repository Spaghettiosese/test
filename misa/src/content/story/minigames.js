// Story minigames: the clock tower gears, the ema plaque poem, the Star Lantern lens, the newspaper microfiche,
// night fishing for the Moon Bream, the rooftop constellations, pounding Starlight Mochi, quiz duels and band practice.
// Every one has a bot so tests/minigames.test.mjs plays it to the end. None of them can be failed.
import { register, features } from '../../core/registry.js';
import { act, Cursor } from '../../input.js';
import { drawText, drawTextC, measure, wrapPx } from '../../font.js';
import { UI, rect, panel } from '../../ui/ui.js';

const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const P = (i, k) => i.pressed.has(k);
const LEFT = (i) => P(i, 'arrowleft') || P(i, 'a'), RIGHT = (i) => P(i, 'arrowright') || P(i, 'd');
const UP = (i) => P(i, 'arrowup') || P(i, 'w'), DOWN = (i) => P(i, 'arrowdown') || P(i, 's');
const OK = (i) => P(i, ' ') || P(i, 'enter') || P(i, 'e');
const HOLD = (i) => i.keys.has(' ') || i.keys.has('e') || i.down;
const press = (inp, k) => { inp.pressed = new Set([k]); return inp; };
const help = (g, text) => { R(g, '#2b1d2ed0', 0, 210, 320, 14); drawTextC(g, text, 160, 212, '#fff6c0', 1, null); };
const title = (g, text) => { R(g, '#2b1d2ed0', 0, 0, 320, 14); drawTextC(g, text, 160, 3, '#ffd76a', 1, null); };
function gear(g, cx, cy, r, ang, c, c2) {
  g.fillStyle = c2; const teeth = Math.max(6, Math.round(r / 2.2));
  for (let k = 0; k < teeth; k++) { const a = ang + (k / teeth) * Math.PI * 2; R(g, c2, cx + Math.cos(a) * (r + 1) - 2, cy + Math.sin(a) * (r + 1) - 2, 4, 4); }
  g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = c2; g.beginPath(); g.arc(cx, cy, r * 0.35, 0, Math.PI * 2); g.fill(); R(g, '#2b1d2e', cx - 1, cy - 1, 3, 3);
}

// ---------------------------------------------------------------- gears (Chapter 4)
const SIZES = [8, 13, 18], SNAME = ['small', 'medium', 'large'];
class Gears {
  constructor() { Object.assign(this, { need: [1, 0, 2, 0, 1], have: [0, 2, 1, 2, 0], sel: 0, moves: 0, t: 0, done: false, score: 0, win: 0 }); }
  ok(i) { return this.have[i] === this.need[i]; }
  get chain() { let n = 0; while (n < 5 && this.ok(n)) n++; return n; }
  update(dt, inp) {
    this.t += dt;
    if (this.win) { this.win += dt; if (this.win > 1.6) { this.done = true; this.score = Math.max(0.5, 1 - Math.max(0, this.moves - 9) * 0.04); } return; }
    if (LEFT(inp)) this.sel = (this.sel + 4) % 5; if (RIGHT(inp)) this.sel = (this.sel + 1) % 5;
    const cyc = (d) => { this.have[this.sel] = (this.have[this.sel] + d + 3) % 3; this.moves++; };
    if (UP(inp) || OK(inp)) cyc(1); if (DOWN(inp)) cyc(-1);
    if (inp.justDown) { const i = Math.floor((inp.mx - 40) / 48); if (i >= 0 && i < 5) { this.sel = i; cyc(1); } }
    if (this.chain === 5) this.win = 0.01;
  }
  draw(g) {
    R(g, '#3a2a30', 0, 0, 320, 224); for (let i = 0; i < 20; i++) R(g, '#4a3438', i * 16, 0, 1, 224);
    title(g, 'The jammed chime: fit the right gear in each gap');
    const ch = this.chain, spin = this.t * 2;
    gear(g, 20, 112, 16, spin, '#c8a048', '#8a6a2a');
    for (let i = 0; i < 5; i++) {
      const x = 64 + i * 48, r = SIZES[this.have[i]], turning = i < ch;
      R(g, i === this.sel ? '#ffd76a' : '#6a5050', x - 20, 150, 40, 3);
      R(g, '#5a4048', x - SIZES[this.need[i]] - 2, 74, 2, 8); R(g, '#5a4048', x + SIZES[this.need[i]], 74, 2, 8); // gap marks
      gear(g, x, 112, r, turning ? (i % 2 ? -spin : spin) * (13 / r) : 0.3, this.ok(i) ? '#e8c060' : '#a89080', this.ok(i) ? '#a07a30' : '#706058');
      drawTextC(g, SNAME[this.have[i]], x, 158, i === this.sel ? '#ffd76a' : '#c8b8b0', 1, null);
    }
    R(g, '#c8a048', 300, 70, 12, 20); R(g, ch === 5 ? '#fff4c0' : '#8a7a5a', 296, 90, 20, 14);
    if (this.win) drawTextC(g, 'Ding... dong!', 160, 186, '#fff4c0', 2, '#2b1d2e');
    help(g, 'Left/right: pick a gap   Up/down/click: change gear');
  }
}
register('minigame', 'story_gears', { title: 'Fix the chime', make: () => new Gears(), resultTitle: 'IT CHIMES!',
  bot: (m, t, inp) => (m.ok(m.sel) ? press(inp, 'arrowright') : press(inp, 'arrowup')) });

// ---------------------------------------------------------------- ema plaques (Chapter 7)
export const POEM = ['When the sea forgets the sky', 'and the long night hides the way,', 'seven lights go home to hearts', 'that hold them safe and warm.', 'Call them back with kindness,', 'and the star will cross the bay.'];
class Ema {
  constructor() { Object.assign(this, { order: [3, 0, 5, 1, 4, 2], sel: 0, held: -1, swaps: 0, t: 0, done: false, score: 0, win: 0 }); }
  right(i) { return this.order[i] === i; }
  update(dt, inp) {
    this.t += dt;
    if (this.win) { this.win += dt; if (this.win > 1.8) { this.done = true; this.score = Math.max(0.5, 1 - Math.max(0, this.swaps - 5) * 0.06); } return; }
    if (LEFT(inp) || UP(inp)) this.sel = (this.sel + 5) % 6; if (RIGHT(inp) || DOWN(inp)) this.sel = (this.sel + 1) % 6;
    let pick = OK(inp);
    if (inp.justDown) { const i = this.hit(inp.mx, inp.my); if (i >= 0) { this.sel = i; pick = true; } }
    if (pick) {
      if (this.held < 0) this.held = this.sel;
      else { const a = this.held, b = this.sel; [this.order[a], this.order[b]] = [this.order[b], this.order[a]]; if (a !== b) this.swaps++; this.held = -1; }
    }
    if (this.order.every((v, i) => v === i)) this.win = 0.01;
  }
  pos(i) { return [20 + (i % 3) * 100, 40 + Math.floor(i / 3) * 80]; }
  hit(mx, my) { for (let i = 0; i < 6; i++) { const [x, y] = this.pos(i); if (mx >= x && mx < x + 90 && my >= y && my < y + 66) return i; } return -1; }
  draw(g) {
    R(g, '#3a2a24', 0, 0, 320, 224); R(g, '#5a3a2a', 10, 30, 300, 170); for (let k = 0; k < 6; k++) R(g, '#4a3024', 10, 30 + k * 30, 300, 2);
    title(g, 'The ema board: put the poem back in order');
    for (let i = 0; i < 6; i++) {
      const [x, y] = this.pos(i), lift = i === this.held ? -4 : 0, glow = this.right(i);
      R(g, '#2b1d2e', x + 44, y - 6 + lift, 2, 8);
      R(g, i === this.sel ? '#ffd76a' : '#2b1d2e', x - 1, y + 1 + lift, 92, 62);
      R(g, glow ? '#f8e8c0' : '#e8c890', x, y + 2 + lift, 90, 60); R(g, glow ? '#fff4d8' : '#f0d8a8', x, y + 2 + lift, 90, 4);
      R(g, '#c84a4a', x + 40, y + 6 + lift, 10, 10);
      wrapPx(POEM[this.order[i]], 82).slice(0, 3).forEach((l, k) => drawText(g, l, x + 4, y + 22 + k * 11 + lift, '#3a2a30', 1, null));
    }
    if (this.win) drawTextC(g, 'Something clicks behind the board...', 160, 194, '#fff4c0', 1, '#2b1d2e');
    help(g, this.held >= 0 ? 'Pick where it should go' : 'Pick a plaque to move (Enter or click)');
  }
}
register('minigame', 'story_ema', { title: 'The ema plaques', make: () => new Ema(), resultTitle: 'THE POEM IS WHOLE',
  bot: (m, t, inp) => {
    const wrong = m.order.findIndex((v, i) => v !== i);
    if (wrong < 0) return inp;
    const target = m.held < 0 ? wrong : m.order.indexOf(wrong);
    if (m.sel !== target) return press(inp, 'arrowright');
    return press(inp, 'enter');
  } });

// ---------------------------------------------------------------- the lens (Finale)
const PNAMES = ['Vega', 'Altair', 'Deneb', 'Sirius', 'Spica', 'Polaris', 'Little Lantern'];
const PCOL = ['#9cc8f0', '#f0e090', '#c8f0e8', '#e0f0ff', '#d0b8f0', '#fff2c0', '#ffc890'];
class Lens {
  constructor() { Object.assign(this, { rot: [3, 6, 1, 5, 2, 7, 4], target: [0, 0, 0, 0, 0, 0, 0], sel: 0, moves: 0, t: 0, done: false, score: 0, win: 0 }); }
  ok(i) { return this.rot[i] === this.target[i]; }
  update(dt, inp) {
    this.t += dt;
    if (this.win) { this.win += dt; if (this.win > 2.4) { this.done = true; this.score = Math.max(0.6, 1 - Math.max(0, this.moves - 20) * 0.02); } return; }
    if (LEFT(inp)) this.sel = (this.sel + 6) % 7; if (RIGHT(inp)) this.sel = (this.sel + 1) % 7;
    if (UP(inp) || OK(inp)) { this.rot[this.sel] = (this.rot[this.sel] + 1) % 8; this.moves++; }
    if (DOWN(inp)) { this.rot[this.sel] = (this.rot[this.sel] + 7) % 8; this.moves++; }
    if (inp.justDown) { for (let i = 0; i < 7; i++) { const [x, y] = this.at(i); if (Math.hypot(inp.mx - x, inp.my - y) < 12) { this.sel = i; this.rot[i] = (this.rot[i] + 1) % 8; this.moves++; } } }
    if (this.rot.every((r, i) => r === this.target[i])) this.win = 0.01;
  }
  at(i) { const a = -Math.PI / 2 + (i / 7) * Math.PI * 2; return [160 + Math.cos(a) * 62, 112 + Math.sin(a) * 62, a]; }
  draw(g) {
    R(g, '#0e0a22', 0, 0, 320, 224);
    g.strokeStyle = '#3a3060'; g.lineWidth = 3; g.beginPath(); g.arc(160, 112, 62, 0, Math.PI * 2); g.stroke();
    title(g, 'Turn each prism until its beam points to the heart of the lens');
    for (let i = 0; i < 7; i++) {
      const [x, y, a] = this.at(i), dir = a + Math.PI + (this.rot[i] * Math.PI) / 4, len = this.ok(i) ? 62 : 26;
      g.globalAlpha = this.ok(i) ? 0.9 : 0.45; g.strokeStyle = PCOL[i]; g.lineWidth = this.ok(i) ? 2 : 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(dir) * len, y + Math.sin(dir) * len); g.stroke(); g.globalAlpha = 1;
      if (i === this.sel) R(g, '#ffd76a', x - 9, y - 9, 18, 18);
      R(g, '#2b1d2e', x - 7, y - 7, 14, 14); R(g, PCOL[i], x - 6, y - 6, 12, 12); R(g, '#ffffff', x - 4, y - 4, 3, 3);
    }
    const n = this.rot.filter((r, i) => r === this.target[i]).length;
    g.fillStyle = n === 7 ? '#fff4c0' : '#5a5080'; g.beginPath(); g.arc(160, 112, 4 + n, 0, Math.PI * 2); g.fill();
    drawTextC(g, PNAMES[this.sel], 160, 190, PCOL[this.sel], 1, null);
    if (this.win) { g.globalAlpha = Math.min(0.8, this.win / 2); R(g, '#fff4c0', 0, 0, 320, 224); g.globalAlpha = 1; drawTextC(g, 'The beams meet in a star!', 160, 104, '#2b1d2e', 2, null); }
    help(g, 'Left/right: choose a prism   Up/down/click: turn it');
  }
}
register('minigame', 'story_lens', { title: 'Light the Star Lantern', make: () => new Lens(), resultTitle: 'A STAR OVER THE BAY',
  bot: (m, t, inp) => (m.ok(m.sel) ? press(inp, 'arrowright') : press(inp, 'arrowup')) });

// ---------------------------------------------------------------- microfiche (Chapter 2)
const HEADLINES = ['Harbour gulls win hearts', 'New bench for Sakura Park', 'Record tuna at the pier', 'School roof repaired', 'Mart opens a seed aisle', 'Shrine bell recast', 'Tide tables for spring', 'Clock tower turns 60', 'Cafe Kumo opens!', 'Hanami crowds return', 'Bus timetable changes', 'Lost dog found on beach', 'Winter fair a success', 'Spring storm warning', 'Starlight Festival cancelled: Lantern lens damaged in storm', 'Fishing boat Sayori repainted', 'Library extends hours', 'Pumpkin record for Mr. Hayashi'];
export const FICHE_TARGET = 14;
class Fiche {
  constructor() { Object.assign(this, { x: 0, v: 0, t: 0, done: false, score: 0, msg: '', msgT: 0, found: 0, misses: 0 }); }
  update(dt, inp) {
    this.t += dt; this.msgT -= dt;
    if (this.found) { this.found += dt; if (this.found > 2) { this.done = true; this.score = Math.max(0.5, 1 - this.misses * 0.1 - Math.max(0, this.t - 25) * 0.01); } return; }
    const dir = (inp.keys.has('arrowright') || inp.keys.has('d') ? 1 : 0) - (inp.keys.has('arrowleft') || inp.keys.has('a') ? 1 : 0);
    if (inp.down && !inp.justDown) this.v += (inp.mx > 160 ? 1 : -1) * dt * 260;
    this.v += dir * dt * 300; this.v *= Math.pow(0.12, dt);
    this.x = Math.max(0, Math.min((HEADLINES.length - 1) * 120, this.x + this.v * dt));
    if (OK(inp)) {
      const i = Math.round(this.x / 120);
      if (i === FICHE_TARGET && Math.abs(this.v) < 60) { this.found = 0.01; }
      else { this.misses++; this.msg = Math.abs(this.v) >= 60 ? 'Too blurry. Slow down first.' : 'Not this one.'; this.msgT = 1.2; }
    }
  }
  draw(g) {
    R(g, '#1a1814', 0, 0, 320, 224); title(g, 'Newspaper archive: find the story about the lantern');
    const blur = Math.min(1, Math.abs(this.v) / 120);
    for (let i = 0; i < HEADLINES.length; i++) {
      const x = 160 + i * 120 - this.x - 55;
      if (x < -120 || x > 330) continue;
      R(g, '#e8dcc0', x, 50, 110, 120); R(g, '#c8b898', x, 50, 110, 3);
      drawText(g, `${1990 + Math.floor(i / 3) + (i >= FICHE_TARGET ? 16 : 0)}`, x + 4, 56, '#7a6a5a', 1, null);
      if (blur < 0.5) wrapPx(HEADLINES[i], 100).slice(0, 4).forEach((l, k) => drawText(g, l, x + 5, 70 + k * 11, '#3a2a30', 1, null));
      else for (let k = 0; k < 3; k++) R(g, '#8a7a6a', x + 5, 72 + k * 11, 90, 3);
      for (let k = 0; k < 5; k++) R(g, '#b8a888', x + 5, 120 + k * 8, 100, 2);
    }
    R(g, '#ffd76a', 102, 44, 116, 2); R(g, '#ffd76a', 102, 172, 116, 2);
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 186, '#ffb0b0', 1, null);
    if (this.found) drawTextC(g, 'There it is!', 160, 186, '#fff4c0', 2, '#2b1d2e');
    help(g, 'Hold left/right to scroll   Enter: this one!');
  }
}
register('minigame', 'story_fiche', { title: 'Newspaper archive', make: () => new Fiche(), resultTitle: 'FOUND IT',
  bot: (m, t, inp) => { const d = FICHE_TARGET * 120 - m.x; if (Math.abs(d) < 30 && Math.abs(m.v) < 40) return press(inp, 'enter'); if (Math.abs(d) > 30 && Math.abs(m.v) < 120) inp.keys = new Set([d > 0 ? 'arrowright' : 'arrowleft']); return inp; } });

// ---------------------------------------------------------------- night fishing (Chapter 5)
class NightFish {
  constructor(game) { Object.assign(this, { phase: 'wait', wait: 2.2, t: 0, bite: 0, mark: 0.5, mv: 0, prog: 0, misses: 0, done: false, score: 0, fishT: 0, rng: (game && game.rng) || Math.random }); }
  update(dt, inp) {
    this.t += dt;
    if (this.phase === 'wait') { this.wait -= dt; if (OK(inp)) this.misses += 0.25; if (this.wait <= 0) { this.phase = 'bite'; this.bite = 1.1; } }
    else if (this.phase === 'bite') { this.bite -= dt; if (OK(inp)) this.phase = 'reel'; else if (this.bite <= 0) { this.misses++; this.phase = 'wait'; this.wait = 1.5 + this.rng() * 1.5; } }
    else if (this.phase === 'reel') {
      this.fishT += dt;
      const pull = Math.sin(this.fishT * 2.1) * 0.5 + Math.sin(this.fishT * 3.7) * 0.3;
      this.mv += (HOLD(inp) ? -1.6 : 1.2) * dt + pull * dt; this.mv *= Math.pow(0.3, dt);
      this.mark = Math.max(0, Math.min(1, this.mark + this.mv * dt * 2.4));
      const inZone = Math.abs(this.mark - 0.5) < 0.16;
      this.prog = Math.max(0, Math.min(1, this.prog + (inZone ? 0.22 : -0.05) * dt));
      if (this.prog >= 1) { this.phase = 'caught'; this.wait = 1.6; }
    } else if (this.phase === 'caught') { this.wait -= dt; if (this.wait <= 0) { this.done = true; this.score = Math.max(0.5, 1 - this.misses * 0.1); } }
  }
  draw(g) {
    R(g, '#0e1030', 0, 0, 320, 224); for (let i = 0; i < 40; i++) R(g, '#fffaf0', (i * 83) % 320, (i * 37) % 90, 1, 1);
    g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(250, 40, 14, 0, Math.PI * 2); g.fill();
    R(g, '#1a2450', 0, 110, 320, 114); for (let k = 0; k < 6; k++) R(g, '#e8e0b0', 244 + Math.sin(this.t * 2 + k) * 4, 116 + k * 8, 12 - k, 1);
    R(g, '#5a3a2a', 0, 150, 90, 12); R(g, '#3a2a20', 10, 162, 6, 62); R(g, '#3a2a20', 70, 162, 6, 62);
    g.strokeStyle = '#c8d0dc'; g.beginPath(); g.moveTo(80, 120); g.lineTo(170, 60); g.lineTo(190, 128 + (this.phase === 'bite' ? 4 : 0)); g.stroke();
    R(g, '#e0707a', 187, 124 + (this.phase === 'bite' ? 5 : Math.sin(this.t * 2)), 6, 6);
    title(g, 'Night fishing off the pier');
    if (this.phase === 'wait') drawTextC(g, 'Wait for a bite...', 160, 190, '#c8d0dc', 1, null);
    if (this.phase === 'bite') drawTextC(g, 'BITE! Press now!', 160, 186, '#ffd76a', 2, '#2b1d2e');
    if (this.phase === 'reel') {
      R(g, '#2b1d2e', 288, 40, 16, 150); R(g, '#86cdb066', 289, 40 + 150 * 0.34, 14, 150 * 0.32); R(g, '#ffd76a', 286, 40 + this.mark * 146, 20, 4);
      R(g, '#2b1d2e', 40, 196, 202, 8); R(g, '#86cdb0', 41, 197, 200 * this.prog, 6);
      drawText(g, 'Hold to reel, keep the line in the green', 40, 184, '#fff6c0', 1, null);
    }
    if (this.phase === 'caught') drawTextC(g, 'A Moon Bream!', 160, 186, '#fff4c0', 2, '#2b1d2e');
    help(g, 'Space/Enter or click');
  }
}
register('minigame', 'story_nightfish', { title: 'Night fishing', make: (g) => new NightFish(g), resultTitle: 'WHAT A CATCH',
  bot: (m, t, inp) => { if (m.phase === 'bite') return press(inp, ' '); if (m.phase === 'reel' && m.mark > 0.5) inp.keys = new Set([' ']); return inp; } });

// ---------------------------------------------------------------- constellations (Chapter 6)
export const CONSTELLATIONS = [
  { name: 'Lyra, home of Vega', pts: [[90, 60], [110, 80], [100, 110], [130, 112], [120, 82]] },
  { name: 'Aquila, home of Altair', pts: [[200, 50], [180, 80], [205, 85], [230, 90], [215, 120]] },
  { name: 'Cygnus, home of Deneb', pts: [[150, 130], [160, 150], [170, 170], [130, 152], [192, 148]] },
];
class StarLines {
  constructor() { Object.assign(this, { c: 0, k: 0, cur: new Cursor(160, 112, 140, [0, 16, 320, 208]), t: 0, wrong: 0, done: false, score: 0, flash: 0 }); }
  get pts() { return CONSTELLATIONS[this.c].pts; }
  update(dt, inp) {
    this.t += dt; this.flash -= dt; this.cur.update(dt, inp);
    if (this.c >= CONSTELLATIONS.length) { if ((this.flash -= dt) < -1.5) { this.done = true; this.score = Math.max(0.5, 1 - this.wrong * 0.05); } return; }
    if (act(inp)) {
      const p = this.pts[this.k];
      if (Math.hypot(this.cur.x - p[0], this.cur.y - p[1]) < 12) { this.k++; if (this.k >= this.pts.length) { this.c++; this.k = 0; this.flash = 1; } }
      else this.wrong++;
    }
  }
  draw(g) {
    R(g, '#0a0a24', 0, 0, 320, 224); for (let i = 0; i < 90; i++) R(g, '#6a6a9a', (i * 97) % 320, 16 + (i * 53) % 190, 1, 1);
    R(g, '#1a1830', 0, 196, 320, 28); R(g, '#3a3050', 0, 194, 320, 2);
    const done = Math.min(this.c, CONSTELLATIONS.length);
    CONSTELLATIONS.forEach((cn, ci) => {
      const n = ci < done ? cn.pts.length : ci === this.c ? this.k : 0;
      g.strokeStyle = ci < done ? '#9cc8f0' : '#ffd76a'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < n; i++) (i ? g.lineTo : g.moveTo).call(g, cn.pts[i][0] + 0.5, cn.pts[i][1] + 0.5); g.stroke();
      cn.pts.forEach((p, i) => { const next = ci === this.c && i === this.k; R(g, next && Math.floor(this.t * 3) % 2 ? '#ffd76a' : '#fffaf0', p[0] - 1, p[1] - 1, i === 0 ? 4 : 3, i === 0 ? 4 : 3); });
    });
    const c = this.cur; R(g, '#86cdb0', c.x - 6, c.y, 4, 1); R(g, '#86cdb0', c.x + 3, c.y, 4, 1); R(g, '#86cdb0', c.x, c.y - 6, 1, 4); R(g, '#86cdb0', c.x, c.y + 3, 1, 4);
    title(g, this.c < CONSTELLATIONS.length ? `Trace ${CONSTELLATIONS[this.c].name}` : 'The summer triangle!');
    help(g, 'Move the sight and press on each star in turn (the blinking one is next)');
  }
}
register('minigame', 'story_stars', { title: 'Club night', make: () => new StarLines(), resultTitle: 'STARGAZERS',
  bot: (m, t, inp) => { if (m.c >= CONSTELLATIONS.length) return inp; const p = m.pts[m.k]; Object.assign(inp, { mx: p[0], my: p[1], moved: true, justDown: Math.floor(t * 10) % 2 === 0 }); return inp; } });

// ---------------------------------------------------------------- pounding Starlight Mochi (Chapter 7)
class Pound {
  constructor() { Object.assign(this, { t: 0, beats: 0, good: 0, total: 10, ph: 0, done: false, score: 0, last: '', lastT: 0, squish: 0 }); }
  update(dt, inp) {
    this.t += dt; this.ph = (this.ph + dt * 0.8) % 1; this.lastT -= dt; this.squish = Math.max(0, this.squish - dt * 4);
    if (this.beats >= this.total) { if (this.lastT < -0.6) { this.done = true; this.score = Math.max(0.4, this.good / this.total); } return; }
    if (OK(inp) || inp.justDown) {
      const d = Math.abs(this.ph - 0.5), hit = d < 0.09;
      this.beats++; if (hit) this.good++; this.squish = 1;
      this.last = hit ? (d < 0.04 ? 'Perfect!' : 'Good!') : 'Squish.'; this.lastT = 0.8;
    }
  }
  draw(g) {
    R(g, '#f0e0d0', 0, 0, 320, 224); R(g, '#c8a07a', 0, 150, 320, 74);
    R(g, '#8a5a3a', 110, 150, 100, 40); R(g, '#a8744a', 110, 150, 100, 6);
    const s = this.squish, w = 60 + s * 16, h = 22 - s * 8;
    g.fillStyle = this.beats >= this.total ? '#f8c8d8' : '#fff6f0'; g.beginPath(); g.ellipse(160, 150 - h / 2, w / 2, h / 2 + 2, 0, 0, Math.PI * 2); g.fill();
    const y = 40 + Math.abs(Math.sin(this.ph * Math.PI)) * 0; const mallet = 60 + Math.sin(this.ph * Math.PI * 2) * 30;
    R(g, '#7a4f3a', 200, mallet, 4, 50); R(g, '#a8744a', 180, mallet + 40, 44, 16);
    R(g, '#2b1d2e', 60, 20, 200, 10); R(g, '#86cdb0', 60 + 200 * 0.41, 21, 200 * 0.18, 8); R(g, '#ffd76a', 60 + this.ph * 196, 18, 4, 14);
    title(g, `Starlight Mochi: pound in rhythm (${Math.min(this.beats, this.total)}/${this.total})`);
    if (this.lastT > 0) drawTextC(g, this.last, 160, 100, '#bd5460', 2, null);
    help(g, 'Press when the marker is in the green');
  }
}
register('minigame', 'story_pound', { title: 'Starlight Mochi', make: () => new Pound(), resultTitle: 'SOFT AND STARRY',
  bot: (m, t, inp) => (Math.abs(m.ph - 0.5) < 0.03 ? press(inp, ' ') : inp) });

// ---------------------------------------------------------------- quiz (Chapter 1 and Rival Notes)
export const QUIZ = {
  intro: [
    ['What makes the tides rise and fall?', ['The Moon\'s gravity', 'The wind', 'Whales'], 0],
    ['Which planet has the famous rings?', ['Mars', 'Saturn', 'Venus'], 1],
    ['Water boils at what temperature?', ['50 degrees', '100 degrees', '200 degrees'], 1],
    ['What is the closest star to Earth?', ['Vega', 'Polaris', 'The Sun'], 2],
  ],
  duel: [
    ['7 x 8 = ?', ['54', '56', '64'], 1],
    ['Which is a mammal?', ['Dolphin', 'Shark', 'Tuna'], 0],
    ['The capital of Japan?', ['Osaka', 'Kyoto', 'Tokyo'], 2],
    ['Plants make food by...', ['Photosynthesis', 'Hibernation', 'Erosion'], 0],
    ['How many seasons in a year?', ['Three', 'Four', 'Five'], 1],
  ],
  final: [
    ['The square root of 81?', ['8', '9', '7'], 1],
    ['What gas do we breathe out?', ['Oxygen', 'Helium', 'Carbon dioxide'], 2],
    ['A haiku has how many lines?', ['Three', 'Five', 'Seven'], 0],
    ['Which star is the North Star?', ['Sirius', 'Polaris', 'Spica'], 1],
    ['12 x 12 = ?', ['144', '124', '132'], 0],
  ],
};
class Quiz {
  constructor(game, opts) { Object.assign(this, { qs: QUIZ[opts.set] || QUIZ.intro, rival: opts.rival || 0, i: 0, sel: 0, right: 0, t: 0, fb: 0, fbOk: false, done: false, score: 0 }); }
  update(dt, inp) {
    this.t += dt;
    if (this.fb > 0) { this.fb -= dt; if (this.fb <= 0) { this.i++; this.sel = 0; if (this.i >= this.qs.length) { this.done = true; this.score = this.right / this.qs.length; this.result = { text: this.rival ? `You ${this.right} - ${this.rival} Rina` : `${this.right} of ${this.qs.length} right` }; } } return; }
    const n = 3;
    if (UP(inp)) this.sel = (this.sel + n - 1) % n; if (DOWN(inp)) this.sel = (this.sel + 1) % n;
    let pick = OK(inp);
    if (inp.justDown) { const k = Math.floor((inp.my - 96) / 24); if (k >= 0 && k < 3) { this.sel = k; pick = true; } }
    if (pick) { this.fbOk = this.sel === this.qs[this.i][2]; if (this.fbOk) this.right++; this.fb = 0.9; }
  }
  draw(g) {
    R(g, '#2a4a3a', 0, 0, 320, 224); R(g, '#7a5a3a', 0, 0, 320, 6); R(g, '#7a5a3a', 0, 218, 320, 6);
    const q = this.qs[Math.min(this.i, this.qs.length - 1)];
    title(g, `Question ${Math.min(this.i + 1, this.qs.length)} of ${this.qs.length}${this.rival ? '   (Rina is answering too!)' : ''}`);
    wrapPx(q[0], 280).forEach((l, k) => drawTextC(g, l, 160, 50 + k * 12, '#f0f0e0', 1, null));
    q[1].forEach((a, k) => {
      const y = 96 + k * 24, on = k === this.sel, show = this.fb > 0;
      R(g, '#f0f0e0', 60, y, 200, 20); R(g, show && k === q[2] ? '#86cdb0' : show && on ? '#e0a0a0' : on ? '#ffd76a' : '#e0e0d0', 61, y + 1, 198, 18);
      drawTextC(g, a, 160, y + 6, '#2b1d2e', 1, null);
    });
    drawText(g, `Right: ${this.right}`, 12, 196, '#f0f0e0', 1, null);
    help(g, 'Up/down and Enter, or click an answer');
  }
}
register('minigame', 'story_quiz', { title: 'Quiz', make: (g, o) => new Quiz(g, o || {}), resultTitle: 'PENCILS DOWN',
  bot: (m, t, inp) => { if (m.fb > 0 || m.i >= m.qs.length) return inp; const c = m.qs[m.i][2]; return m.sel === c ? press(inp, 'enter') : press(inp, 'arrowdown'); } });

// ---------------------------------------------------------------- band practice (Theo's Garage Band)
const LANES = ['arrowleft', 'arrowdown', 'arrowup', 'arrowright'], LCOL = ['#e0707a', '#86cdb0', '#7fb2e0', '#ffd76a'];
class Band {
  constructor(game, opts) {
    const song = opts.song || 0, notes = [];
    for (let i = 0; i < 28; i++) notes.push({ at: 1.5 + i * 0.5, lane: (i * (song + 3) + Math.floor(i / 4)) % 4, hit: false, miss: false });
    Object.assign(this, { notes, t: 0, hits: 0, done: false, score: 0, fx: [] });
  }
  update(dt, inp) {
    this.t += dt;
    for (const [li, k] of LANES.entries()) {
      const alt = ['a', 's', 'w', 'd'][li];
      if (!P(inp, k) && !P(inp, alt)) continue;
      const n = this.notes.find((x) => !x.hit && !x.miss && x.lane === li && Math.abs(x.at - this.t) < 0.16);
      if (n) { n.hit = true; this.hits++; this.fx.push({ lane: li, t: 0.3 }); }
    }
    for (const n of this.notes) if (!n.hit && !n.miss && this.t - n.at > 0.16) n.miss = true;
    this.fx = this.fx.filter((f) => (f.t -= dt) > 0);
    if (this.t > this.notes[this.notes.length - 1].at + 1) { this.done = true; this.score = this.hits / this.notes.length; this.result = { text: `${this.hits} of ${this.notes.length} notes` }; }
  }
  draw(g) {
    R(g, '#1a1226', 0, 0, 320, 224); title(g, 'Band practice: hit the notes as they reach the line');
    for (let l = 0; l < 4; l++) {
      const x = 100 + l * 32; R(g, '#2b2238', x, 16, 28, 194); R(g, LCOL[l], x, 180, 28, 3);
      for (const f of this.fx) if (f.lane === l) { g.globalAlpha = f.t * 3; R(g, LCOL[l], x - 2, 172, 32, 18); g.globalAlpha = 1; }
    }
    for (const n of this.notes) { if (n.hit) continue; const y = 180 - (n.at - this.t) * 120; if (y < 10 || y > 214) continue; R(g, n.miss ? '#5a4a60' : LCOL[n.lane], 102 + n.lane * 32, y - 4, 24, 8); }
    drawText(g, `Hits: ${this.hits}`, 12, 30, '#fff6c0', 1, null);
    help(g, 'Arrow keys (or A S W D) for the four lanes');
  }
}
register('minigame', 'story_band', { title: 'Band practice', make: (g, o) => new Band(g, o || {}), resultTitle: 'ENCORE!',
  bot: (m, t, inp) => { const n = m.notes.find((x) => !x.hit && !x.miss && Math.abs(x.at - m.t) < 0.05); return n ? press(inp, LANES[n.lane]) : inp; } });

features('Story minigames', [
  'Clock tower gear puzzle: fit small, medium and large gears into each gap until the chime rings again',
  'Ema plaque puzzle: swap six wooden plaques back into the order of Hana\'s poem (plaques glow softly when right)',
  'Star Lantern lens puzzle: turn seven prisms on a ring until their beams meet in a star',
  'Newspaper microfiche: scroll the archive and stop on the right headline (it blurs when you scroll fast)',
  'Night fishing for the Moon Bream: wait for the bite, then reel while keeping the line in the green',
  'Constellation tracing on the school roof: Lyra, Aquila and Cygnus, the summer triangle',
  'Pounding Starlight Mochi in rhythm with the mallet',
  'Quiz duels with multiple-choice questions (a pop quiz on the first day, and Rina\'s rivalry rounds)',
  'Band practice rhythm game with four lanes and three songs',
]);
