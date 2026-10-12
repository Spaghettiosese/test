// Homework worksheets (a 30-second quiz) and the after-school club activities.
import { Cursor, act, axis, actHeld } from '../../input.js';
import { CardGame, K, INK, rect, disc, ell, line, txt, txtC, txtR, wrapPx, blit, btn, inRect, card, notebook, meter, sfx, clamp, dither } from './common.js';
import { KANJI } from './japanese.js';
import { WORDS } from './english.js';
import { TIMELINES } from './history.js';

// ======================= HOMEWORK QUIZ =======================
const BANK = {
  science: [['Water boils at...', '100 C', '50 C', '0 C'], ['Plants breathe in...', 'Carbon dioxide', 'Salt', 'Sand'], ['The moon shines by...', 'Reflecting sunlight', 'Burning gas', 'Its own lamps'], ['A magnet pulls on...', 'Iron', 'Wood', 'Glass'], ['Frogs start life as...', 'Tadpoles', 'Caterpillars', 'Chicks'], ['The closest star to us is...', 'The sun', 'Polaris', 'Vega'], ['Ice is water that is...', 'Frozen', 'Boiling', 'Salty']],
  art: [['Red + yellow makes...', 'Orange', 'Green', 'Purple'], ['Blue + yellow makes...', 'Green', 'Pink', 'Brown'], ['Red + blue makes...', 'Purple', 'Orange', 'Grey'], ['Warm colours include...', 'Red and orange', 'Blue and teal', 'Grey and black'], ['A picture of a person is a...', 'Portrait', 'Landscape', 'Still life'], ['Light from the top-left puts shadows...', 'Bottom right', 'Top left', 'Nowhere']],
  music: [['A whole note lasts...', '4 beats', '1 beat', '2 beats'], ['A half note lasts...', '2 beats', '4 beats', '3 beats'], ['Do re mi fa so la ti... next?', 'Do', 'Re', 'Fa'], ['Soft in music is...', 'Piano', 'Forte', 'Presto'], ['Loud in music is...', 'Forte', 'Piano', 'Largo'], ['A recorder is played by...', 'Blowing', 'Hitting', 'Plucking']],
  pe: [['Before running, always...', 'Warm up', 'Eat a big meal', 'Sleep'], ['How many players in a soccer team on the field?', '11', '5', '20'], ['Drinking water helps you...', 'Stay hydrated', 'Get sleepy', 'Run slower'], ['A relay team passes a...', 'Baton', 'Shuttle', 'Net'], ['Stretching helps keep muscles...', 'Flexible', 'Frozen', 'Tiny']],
};
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function makeQuestion(subject, rng, diff = 0) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  if (subject === 'math') {
    const op = pick(diff > 0.4 ? ['+', '-', 'x'] : ['+', '-']);
    let a = 2 + Math.floor(rng() * (10 + diff * 30)), b = 2 + Math.floor(rng() * (9 + diff * 10));
    if (op === 'x') { a = 2 + Math.floor(rng() * 9); b = 2 + Math.floor(rng() * 9); }
    if (op === '-' && b > a) [a, b] = [b, a];
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const w = new Set([ans]); while (w.size < 3) w.add(ans + (Math.floor(rng() * 7) - 3 || 4));
    return { q: `${a} ${op} ${b} = ?`, opts: shuffle(rng, [...w].map(String)), ans: String(ans) };
  }
  if (subject === 'japanese') {
    const k = pick(KANJI), others = shuffle(rng, KANJI.filter((x) => x.mean !== k.mean)).slice(0, 2);
    return { q: 'What does this kanji mean?', kanji: k, opts: shuffle(rng, [k.mean, ...others.map((o) => o.mean)]), ans: k.mean };
  }
  if (subject === 'english') {
    const [w, clue] = pick(WORDS), others = shuffle(rng, WORDS.filter((x) => x[0] !== w)).slice(0, 2);
    return { q: clue, opts: shuffle(rng, [w, ...others.map((o) => o[0])]), ans: w };
  }
  if (subject === 'history') {
    const set = pick(TIMELINES), ev = shuffle(rng, set.ev.slice()).slice(0, 3), first = ev.reduce((a, b) => (a[0] < b[0] ? a : b));
    return { q: 'Which happened first?', opts: ev.map((e) => e[1]), ans: first[1] };
  }
  const [q, a, ...wrong] = pick(BANK[subject] || BANK.science);
  return { q, opts: shuffle(rng, [a, ...wrong]), ans: a };
}

export class QuizGame extends CardGame {
  constructor(game, opts = {}) {
    const subject = opts.subject || 'math', name = opts.subjectName || subject;
    super(game, opts, {
      title: opts.title || `${name} worksheet`, chip: 'Homework', color: K.sky, limit: opts.limit || 30,
      how: [`Answer the ${name} questions before the timer runs out.`, 'Click an answer, or use up/down and space.'],
      keys: 'Up / Down: choose   Space or click: answer',
    });
    this.subject = subject; this.n = opts.count || 4;
    this.qs = Array.from({ length: this.n }, () => makeQuestion(subject, this.rng, this.diff));
    Object.assign(this, { qi: 0, right: 0, sel: 0, wait: 0, last: null });
  }
  get q() { return this.qs[this.qi]; }
  progress() { return clamp(this.right / this.n, 0.2, 1); }
  info() { return `${Math.min(this.qi + 1, this.n)}/${this.n}`; }
  answer(i) {
    const ok = this.q.opts[i] === this.q.ans;
    this.last = { i, ok }; this.wait = 0.7;
    if (ok) { this.right++; sfx('chime'); } else { sfx('wrong'); }
  }
  timeUp() { this.finish(clamp(this.right / this.n, 0.2, 1), `${this.right} of ${this.n} correct.`); }
  play(dt, input) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.qi++; this.last = null; this.sel = 0; if (this.qi >= this.n) this.finish(clamp(this.right / this.n, 0.2, 1), `${this.right} of ${this.n} correct.`); } return; }
    const k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) this.sel = (this.sel + 1) % 3;
    if (k.has('arrowup') || k.has('w')) this.sel = (this.sel + 2) % 3;
    for (let i = 0; i < 3; i++) if (k.has(String(i + 1))) return this.answer(i);
    const rs = [0, 1, 2].map((i) => [70, 120 + i * 24, 220, 20]);
    if (input.moved) { const i = rs.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) this.sel = i; }
    if (input.justDown) { const i = rs.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) return this.answer(i); return; }
    if (act(input)) this.answer(this.sel);
  }
  scene(g) {
    blit(g, 'school_hw_bg', 320, 224, (c) => {
      rect(c, K.wood[2], 0, 0, 320, 224); for (let y = 0; y < 224; y += 16) rect(c, K.wood[1], 0, y + 15, 320, 1);
      rect(c, 'rgba(255,215,106,0.12)', 0, 0, 120, 224);
      // desk lamp glow and a pencil
      line(c, K.butter[1], 288, 200, 312, 150, 3); rect(c, K.butter[2], 286, 196, 6, 6);
    });
    notebook(g, 40, 24, 250, 184);
    const q = this.q || this.qs[this.n - 1];
    if (q.kanji) {
      txt(g, q.q, 64, 34, INK);
      const ox = 150, oy = 46, s = 0.6;
      rect(g, K.coral[3], ox - 2, oy - 2, 64, 64); rect(g, K.paper[4], ox - 1, oy - 1, 62, 62);
      for (const st of q.kanji.s) for (let i = 1; i < st.length; i++) line(g, K.navy[0], ox + st[i - 1][0] * s, oy + st[i - 1][1] * s, ox + st[i][0] * s, oy + st[i][1] * s, 3);
    } else wrapPx(q.q, 200).forEach((l, i) => txt(g, l, 64, 44 + i * 10, INK));
    q.opts.forEach((o, i) => {
      const r = [70, 120 + i * 24, 220, 20], last = this.last;
      let fill = this.sel === i ? K.butter[3] : K.paper[3];
      if (last) { if (o === q.ans) fill = K.mint[3]; else if (last.i === i) fill = K.coral[3]; }
      rect(g, INK, r[0], r[1], r[2], r[3]); rect(g, fill, r[0] + 1, r[1] + 1, r[2] - 2, r[3] - 2);
      txt(g, `${i + 1}`, r[0] + 6, r[1] + 7, K.sky[1]); txt(g, o, r[0] + 18, r[1] + 7, INK);
    });
    if (this.last) txtC(g, this.last.ok ? 'Correct!' : 'Oops, the right one is in green', 165, 196, this.last.ok ? K.forest[1] : K.coral[1]);
  }
}
export function quizBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || Math.round(t * 60) % 10) return input;
  input.pressed.add(String(m.q.opts.indexOf(m.q.ans) + 1)); return input;
}

// ======================= ASTRONOMY CLUB: CONSTELLATIONS =======================
export const CONSTELLATIONS = [
  { id: 'big_dipper', name: 'Big Dipper', pts: [[40, 60], [70, 58], [96, 66], [118, 80], [150, 74], [158, 104], [126, 110]] },
  { id: 'orion', name: 'Orion', pts: [[60, 40], [130, 46], [88, 90], [100, 92], [112, 94], [70, 140], [140, 136]] },
  { id: 'cassiopeia', name: 'Cassiopeia', pts: [[30, 70], [70, 100], [100, 70], [140, 100], [176, 64]] },
  { id: 'cygnus', name: 'Cygnus (Deneb)', pts: [[100, 30], [100, 70], [100, 110], [60, 64], [140, 76]] },
  { id: 'lyra', name: 'Lyra (Vega)', pts: [[100, 40], [90, 70], [120, 70], [114, 104], [84, 104]] },
  { id: 'leo', name: 'Leo', pts: [[50, 120], [80, 96], [110, 100], [140, 80], [150, 56], [130, 44], [170, 100]] },
  { id: 'scorpius', name: 'Scorpius', pts: [[40, 50], [60, 64], [80, 80], [96, 104], [112, 126], [140, 132], [160, 118]] },
  { id: 'canis_major', name: 'Canis Major (Sirius)', pts: [[100, 40], [80, 70], [110, 84], [96, 120], [130, 130], [70, 126]] },
];
export class AstroGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Constellation tracing', chip: 'Astronomy', color: K.lilac, limit: 45,
      how: ['Connect the stars of each constellation in order, starting from the glowing one.', 'Click the next star, or move with the arrows and press space.'],
      keys: 'Click or space: link the next star',
    });
    const pool = CONSTELLATIONS.slice(); this.list = [];
    while (this.list.length < 3) this.list.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    this.cur = new Cursor(160, 110, 130, [40, 24, 300, 200]);
    Object.assign(this, { ci: 0, next: 1, wrong: 0, wait: 0, found: [] });
    this.field = Array.from({ length: 70 }, () => [Math.floor(this.rng() * 320), 20 + Math.floor(this.rng() * 204), this.rng()]);
  }
  get con() { return this.list[this.ci]; }
  pts() { return this.con.pts.map(([x, y]) => [x + 60, y + 30]); }
  progress() { return clamp((this.ci + this.next / this.con.pts.length) / 3, 0.3, 1); }
  info() { return `${this.found.length}/3`; }
  play(dt, input) {
    this.cur.update(dt, input);
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.ci++; this.next = 1; if (this.ci >= 3) this.finish(clamp(1 - this.wrong * 0.05, 0.4, 1), 'Logged 3 constellations in the club stargazing book!'); } return; }
    if (!act(input)) return;
    const p = this.pts(), i = p.findIndex(([x, y]) => Math.hypot(x - this.cur.x, y - this.cur.y) < 9);
    if (i < 0) return;
    if (i === this.next) { this.next++; sfx('star'); if (this.next >= p.length) { this.found.push(this.con.id); this.wait = 1.4; this.flash = 0.25; this.pop(this.con.name + '!', 160, 40, K.butter[3]); } }
    else if (i >= this.next) { this.wrong++; sfx('wrong'); this.pop('Not that one yet', p[i][0], p[i][1] - 14, K.coral[3]); }
  }
  scene(g) {
    blit(g, 'school_astro_bg', 320, 224, (c) => {
      const bands = ['#0e0c24', '#1b1b3a', '#2e2a5a'];
      bands.forEach((b, i) => rect(c, b, 0, 19 + i * 60, 320, 70));
      for (let i = 0; i < 2; i++) dither(c, bands[i + 1], 0, 79 + i * 60, 320, 6);
      // roof railing silhouette
      rect(c, K.charcoal[0], 0, 200, 320, 24); for (let x = 0; x < 320; x += 14) rect(c, K.charcoal[1], x, 186, 2, 14); rect(c, K.charcoal[1], 0, 186, 320, 2);
    });
    for (const [x, y, s] of this.field) rect(g, (Math.floor(this.t * 2 + s * 10) % 7) ? '#8a7fb0' : '#fffaf0', x, y, 1, 1);
    const p = this.pts(), C = this.con;
    if (this.diff < 0.6) for (let i = 1; i < p.length; i++) { for (let k = 0; k < 10; k += 2) { const u = k / 10; rect(g, '#4a4a7a', p[i - 1][0] + (p[i][0] - p[i - 1][0]) * u, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u, 1, 1); } }
    for (let i = 1; i < this.next && i < p.length; i++) line(g, K.butter[3], p[i - 1][0], p[i - 1][1], p[i][0], p[i][1], 1);
    p.forEach(([x, y], i) => {
      const lit = i < this.next, nxt = i === this.next && this.wait <= 0;
      if (nxt) disc(g, 'rgba(255,215,106,0.35)', x, y, 6 + Math.round(Math.sin(this.t * 6)));
      disc(g, lit ? K.butter[3] : '#c8c8f0', x, y, 2); rect(g, '#ffffff', x, y - 3, 1, 7); rect(g, '#ffffff', x - 3, y, 7, 1);
    });
    if (this.wait > 0) txtC(g, C.name, 160, 192, K.butter[3]);
    card(g, 6, 26, 60, 50); txtC(g, 'Logbook', 36, 31, K.lilac[1]); this.found.forEach((id, i) => txtC(g, CONSTELLATIONS.find((c) => c.id === id).name.split(' ')[0], 36, 43 + i * 9, INK));
    const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
    rect(g, K.mint[3], x - 6, y, 4, 1); rect(g, K.mint[3], x + 3, y, 4, 1); rect(g, K.mint[3], x, y - 6, 1, 4); rect(g, K.mint[3], x, y + 3, 1, 4);
  }
}
export function astroBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || Math.round(t * 60) % 8) return input;
  const p = m.pts()[m.next]; return Object.assign(input, { mx: p[0], my: p[1], moved: true, justDown: true });
}

// ======================= SOCCER CLUB: PENALTY KICKS =======================
export class SoccerGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Penalty practice', chip: 'Soccer', color: K.forest, limit: 0,
      how: ['Five penalty kicks. First stop the swinging aim marker, then stop the power bar in the green.', 'Space or click for each step. Kai is in goal!'],
      keys: 'Space or click: aim, then power',
    });
    Object.assign(this, { kick: 0, goals: 0, step: 'aim', aim: 0, power: 0, wait: 0, ball: null, keeper: 160, dive: 0, msg: '' });
  }
  progress() { return clamp(this.goals / 5, 0.2, 1); }
  info() { return `Goals ${this.goals}/${this.kick}`; }
  play(dt, input) {
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.ball) { const b = this.ball; b.k = Math.min(1, b.k + dt * 2.2); this.keeper += (this.dive - this.keeper) * Math.min(1, dt * 6); }
      if (this.wait <= 0) { this.ball = null; this.keeper = 160; if (this.kick >= 5) this.finish(clamp(0.2 + this.goals * 0.17, 0.2, 1), `${this.goals} goals out of 5! Kai: "Let's gooo!"`); else { this.step = 'aim'; this.msg = ''; } }
      return;
    }
    const sp = 1.6 + this.diff;
    if (this.step === 'aim') { this.aim = Math.sin(this.playT * sp * 1.5); if (act(input)) { this.step = 'power'; this.pt = 0; sfx('blip'); } }
    else { this.pt += dt; this.power = (Math.sin(this.pt * sp * 2 - Math.PI / 2) + 1) / 2; if (act(input)) this.shoot(); }
  }
  shoot() {
    this.kick++;
    const tx = 160 + this.aim * 74, good = this.power > 0.62 && this.power < 0.9, weak = this.power < 0.62;
    this.dive = 160 + (this.rng() < 0.55 ? Math.sign(this.aim || 1) : -Math.sign(this.aim || 1)) * (40 + this.rng() * 30);
    const saved = Math.abs(this.dive - tx) < 22 || weak && Math.abs(this.dive - tx) < 40, wide = !good && !weak;
    const goal = !saved && !wide && Math.abs(this.aim) < 1.05;
    if (goal) { this.goals++; this.msg = 'GOAL!'; sfx('whistle'); this.flash = 0.3; } else { this.msg = wide ? 'Over the bar!' : 'Saved by Kai!'; sfx('wrong'); }
    this.ball = { k: 0, tx, ty: wide ? 24 : 80 + (1 - this.power) * 30 };
    this.wait = 1.4;
  }
  scene(g) {
    blit(g, 'school_soccer_bg', 320, 224, (c) => {
      rect(c, K.sky[3], 0, 0, 320, 60); rect(c, K.grassSpring[2], 0, 60, 320, 164);
      for (let y = 60; y < 224; y += 20) rect(c, K.grassSpring[3], 0, y, 320, 10);
      rect(c, K.paper[4], 70, 52, 180, 4); rect(c, K.paper[4], 70, 52, 4, 74); rect(c, K.paper[4], 246, 52, 4, 74);
      for (let x = 74; x < 246; x += 6) rect(c, 'rgba(255,255,255,0.35)', x, 56, 1, 70); for (let y = 60; y < 126; y += 6) rect(c, 'rgba(255,255,255,0.35)', 74, y, 172, 1);
      rect(c, K.paper[4], 40, 126, 240, 2); ell(c, K.paper[4], 160, 190, 3, 2);
    });
    // keeper (Kai)
    const kx = Math.round(this.keeper); rect(g, INK, kx - 9, 92, 18, 32); rect(g, K.coral[2], kx - 8, 93, 16, 16); rect(g, K.charcoal[2], kx - 8, 109, 16, 14); disc(g, INK, kx, 86, 8); disc(g, K.hairBlack[2], kx, 85, 7); rect(g, K.skinTan[3], kx - 5, 87, 10, 5); rect(g, K.butter[2], kx - 14, 98, 5, 5); rect(g, K.butter[2], kx + 9, 98, 5, 5);
    // ball
    const b = this.ball, bx = b ? 160 + (b.tx - 160) * b.k : 160, by = b ? 186 + (b.ty - 186) * b.k : 186, r = b ? Math.round(6 - b.k * 2) : 6;
    ell(g, 'rgba(42,26,64,0.3)', bx, by + r + 2, r, 2); disc(g, INK, bx, by, r + 1); disc(g, K.paper[4], bx, by, r); rect(g, INK, bx - 1, by - 1, 3, 3);
    if (!this.ball && this.step === 'aim') { const ax = 160 + this.aim * 74; rect(g, K.coral[2], ax - 1, 60, 3, 60); disc(g, K.coral[2], ax, 90, 4); }
    card(g, 280, 60, 30, 120); meter(g, 290, 70, 10, 100, 0, K.mint[2]);
    rect(g, K.mint[2], 290, 70 + 100 * (1 - 0.9), 10, 100 * 0.28);
    if (this.step === 'power' && !this.ball) rect(g, K.coral[1], 286, 70 + Math.round(100 * (1 - this.power)), 18, 2);
    if (this.msg) txtC(g, this.msg, 160, 140, this.msg === 'GOAL!' ? K.butter[3] : K.paper[4], K.ink[0]);
    for (let i = 0; i < 5; i++) { disc(g, INK, 20 + i * 12, 200, 4); disc(g, i < this.kick ? K.butter[2] : K.paper[2], 20 + i * 12, 200, 3); }
  }
}
export function soccerBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0) return input;
  if (m.step === 'aim' && Math.abs(m.aim) > 0.7 && Math.abs(m.aim) < 0.85) input.pressed.add(' ');
  if (m.step === 'power' && m.power > 0.7 && m.power < 0.85) input.pressed.add(' ');
  return input;
}

// ======================= LITERATURE CLUB: HAIKU =======================
const HAIKU_WORDS = [['moon', 1], ['star', 1], ['cat', 1], ['sea', 1], ['rain', 1], ['soft', 1], ['the', 1], ['on', 1], ['a', 1], ['light', 1], ['old', 1],
  ['lantern', 2], ['quiet', 2], ['sleeping', 2], ['blossom', 2], ['harbour', 2], ['falling', 2], ['window', 2], ['petals', 2], ['silver', 2],
  ['shining', 2], ['over', 2], ['morning', 2], ['gently', 2], ['evening', 3], ['butterfly', 3], ['lighthouse', 2], ['beautiful', 3], ['memory', 3], ['wandering', 3]];
export class HaikuGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Haiku corner', chip: 'Literature', color: K.forest, limit: 60,
      how: ['Write a haiku: lines of 5, then 7, then 5 syllables.', 'Click word tiles (dots show syllables). Backspace or Undo removes a word.'],
      keys: 'Click words or arrows + space   Backspace: undo',
    });
    const pool = HAIKU_WORDS.slice().sort(() => this.rng() - 0.5);
    this.tiles = pool.slice(0, 16);
    if (!this.tiles.some((w) => w[1] === 1)) this.tiles[0] = ['moon', 1];
    this.theme = ['moon', 'sea', 'rain', 'cat', 'star'][Math.floor(this.rng() * 5)];
    if (!this.tiles.some((w) => w[0] === this.theme)) this.tiles[15] = [this.theme, 1];
    this.lines = [[], [], []]; this.li = 0; this.sel = 0; this.wait = 0;
  }
  syl(i) { return this.lines[i].reduce((a, w) => a + w[1], 0); }
  progress() { return clamp((this.syl(0) + this.syl(1) + this.syl(2)) / 17, 0.3, 1); }
  info() { return `Line ${Math.min(3, this.li + 1)}/3`; }
  rect(i) { return [16 + (i % 4) * 74, 128 + Math.floor(i / 4) * 18, 70, 15]; }
  add(w) {
    const want = [5, 7, 5][this.li];
    if (this.syl(this.li) + w[1] > want) { sfx('wrong'); this.pop(`Too long! This line needs ${want}`, 160, 116, K.coral[3]); return; }
    this.lines[this.li].push(w); sfx('page');
    if (this.syl(this.li) === want) {
      this.li++; sfx('chime');
      if (this.li >= 3) {
        const used = this.lines.flat().map((x) => x[0]), theme = used.includes(this.theme);
        this.poem = this.lines.map((l) => l.map((x) => x[0]).join(' '));
        this.finish(clamp(0.7 + (theme ? 0.2 : 0) + new Set(used).size * 0.01, 0.5, 1), theme ? 'A lovely haiku, right on theme! It goes in the club zine.' : 'A lovely haiku! It goes in the club zine.');
        this.result.poem = this.poem;
      }
    }
  }
  play(dt, input) {
    const k = input.pressed;
    if (k.has('backspace')) { const l = this.lines[this.li]; if (l.length) l.pop(); else if (this.li > 0) { this.li--; this.lines[this.li].pop(); } }
    if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % 16;
    if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + 15) % 16;
    if (k.has('arrowdown') || k.has('s')) this.sel = (this.sel + 4) % 16;
    if (k.has('arrowup') || k.has('w')) this.sel = (this.sel + 12) % 16;
    if (input.justDown) { const i = this.tiles.findIndex((_, j) => inRect(input.mx, input.my, this.rect(j))); if (i >= 0) { this.sel = i; this.add(this.tiles[i]); } else if (inRect(input.mx, input.my, [128, 202, 64, 14])) { const l = this.lines[this.li]; if (l.length) l.pop(); } return; }
    if (k.has(' ') || k.has('enter') || k.has('e')) this.add(this.tiles[this.sel]);
  }
  scene(g) {
    blit(g, 'school_lit_bg', 320, 224, (c) => { rect(c, K.forest[4], 0, 0, 320, 224); dither(c, K.forest[3], 0, 120, 320, 104); });
    notebook(g, 30, 24, 260, 92, K.forest[3]);
    txt(g, `Theme: ${this.theme}`, 50, 30, K.forest[1]);
    for (let i = 0; i < 3; i++) {
      const want = [5, 7, 5][i], y = 46 + i * 20;
      txt(g, this.lines[i].map((w) => w[0]).join(' ') || (i === this.li ? '...' : ''), 50, y, i === this.li ? INK : K.ink[3]);
      for (let s = 0; s < want; s++) { rect(g, s < this.syl(i) ? K.forest[2] : K.paper[2], 230 + s * 7, y, 5, 5); }
    }
    this.tiles.forEach((w, i) => {
      const [x, y, tw, th] = this.rect(i), on = this.sel === i;
      rect(g, INK, x, y, tw, th); rect(g, on ? K.butter[3] : K.paper[3], x + 1, y + 1, tw - 2, th - 2);
      txt(g, w[0], x + 4, y + 5, INK); for (let s = 0; s < w[1]; s++) rect(g, K.forest[2], x + tw - 6 - s * 4, y + 6, 2, 2);
    });
    btn(g, 128, 202, 64, 14, 'Undo', { color: K.forest });
  }
}
export function haikuBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (Math.round(t * 60) % 6) return input;
  const need = [5, 7, 5][m.li] - m.syl(m.li), i = m.tiles.findIndex((w) => w[1] === 1 && need >= 1);
  if (i >= 0) { const r = m.rect(i); Object.assign(input, { mx: r[0] + 5, my: r[1] + 5, justDown: true }); }
  return input;
}

// ======================= NATURE CLUB: GREENHOUSE =======================
const NEEDS = ['water', 'weed', 'bug'];
export class GreenhouseGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Greenhouse care', chip: 'Nature', color: K.forest, limit: 35,
      how: ['Plants show what they need: a drop (water), a weed, or a bug.', 'Pick the right tool (1 2 3) and click the plant. Arrows + space work too.'],
      keys: '1 water  2 weed  3 shoo bug   Click or space: use',
    });
    this.pots = Array.from({ length: 8 }, (_, i) => ({ need: null, t: 1 + i * 0.6 + this.rng() * 2, happy: 0, grow: this.rng() }));
    Object.assign(this, { tool: 0, sel: 0, tended: 0, wrong: 0 });
  }
  potRect(i) { return [28 + (i % 4) * 70, 60 + Math.floor(i / 4) * 70, 54, 60]; }
  progress() { return clamp(this.tended / 12 - this.wrong * 0.03 + 0.2, 0.3, 1); }
  info() { return `Tended ${this.tended}`; }
  timeUp() { this.finish(this.progress(), `You tended ${this.tended} plants. The greenhouse looks so happy!`); }
  use(i) {
    const p = this.pots[i];
    if (!p.need) { this.pop('All good here', this.potRect(i)[0] + 27, this.potRect(i)[1], K.mint[3]); return; }
    if (NEEDS[this.tool] === p.need) { p.need = null; p.happy = 1; p.t = 2 + this.rng() * 3; p.grow = Math.min(1, p.grow + 0.25); this.tended++; sfx(this.tool === 0 ? 'water' : 'pop'); }
    else { this.wrong++; sfx('wrong'); this.pop(`It needs ${p.need === 'bug' ? 'the bug shooed' : p.need === 'weed' ? 'weeding' : 'water'}`, this.potRect(i)[0] + 27, this.potRect(i)[1], K.coral[3]); }
  }
  play(dt, input) {
    for (const p of this.pots) { if (p.happy > 0) p.happy -= dt; if (!p.need) { p.t -= dt * (1 + this.diff * 0.6); if (p.t <= 0) p.need = NEEDS[Math.floor(this.rng() * 3)]; } }
    const k = input.pressed;
    for (let i = 0; i < 3; i++) if (k.has(String(i + 1))) this.tool = i;
    if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % 8;
    if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + 7) % 8;
    if (k.has('arrowdown') || k.has('s') || k.has('arrowup') || k.has('w')) this.sel = (this.sel + 4) % 8;
    if (input.justDown) {
      for (let i = 0; i < 3; i++) if (inRect(input.mx, input.my, [96 + i * 44, 196, 40, 16])) { this.tool = i; return; }
      const i = this.pots.findIndex((_, j) => inRect(input.mx, input.my, this.potRect(j))); if (i >= 0) { this.sel = i; this.use(i); } return;
    }
    if (k.has(' ') || k.has('e') || k.has('enter')) this.use(this.sel);
  }
  scene(g) {
    blit(g, 'school_green_bg', 320, 224, (c) => {
      rect(c, K.mint[4], 0, 0, 320, 224);
      for (let x = 0; x < 320; x += 40) rect(c, K.metal[3], x, 19, 2, 170); for (let y = 19; y < 190; y += 40) rect(c, K.metal[3], 0, y, 320, 2);
      dither(c, '#ffffff', 0, 19, 320, 30);
      rect(c, K.wood[2], 0, 186, 320, 38); rect(c, K.wood[3], 0, 186, 320, 2);
      for (let i = 0; i < 2; i++) { rect(c, K.wood[1], 14, 116 + i * 70, 292, 5); rect(c, K.wood[3], 14, 116 + i * 70, 292, 1); }
    });
    this.pots.forEach((p, i) => {
      const [x, y] = this.potRect(i), cx = x + 27, on = this.sel === i, h = 12 + Math.round(p.grow * 18);
      rect(g, INK, cx - 12, y + 40, 24, 16); rect(g, K.brick[3], cx - 11, y + 41, 22, 14); rect(g, K.brick[4], cx - 13, y + 38, 26, 4); rect(g, K.dirt[1], cx - 10, y + 39, 20, 2);
      const wilt = p.need === 'water';
      rect(g, K.forest[1], cx, y + 39 - h, 2, h);
      ell(g, wilt ? K.grassAutumn[3] : K.forest[2], cx - 6, y + 39 - h * 0.6, 5, 3); ell(g, wilt ? K.grassAutumn[3] : K.forest[3], cx + 7, y + 39 - h * 0.8, 5, 3);
      if (p.grow > 0.6) { disc(g, K.sakura[2], cx + 1, y + 37 - h, 4); disc(g, K.butter[2], cx + 1, y + 37 - h, 1); }
      if (p.need === 'weed') { rect(g, K.grassAutumn[1], cx + 7, y + 30, 2, 9); rect(g, K.grassAutumn[1], cx + 4, y + 33, 3, 2); rect(g, K.grassAutumn[1], cx + 9, y + 32, 3, 2); }
      if (p.need === 'bug') { ell(g, INK, cx - 8, y + 30, 3, 2); rect(g, K.ribbon[2], cx - 9, y + 29, 2, 2); }
      if (p.need) { const by = y + 2 + Math.round(Math.sin(this.t * 5 + i)); rect(g, INK, cx - 7, by, 14, 12); rect(g, K.paper[4], cx - 6, by + 1, 12, 10); rect(g, K.paper[4], cx - 1, by + 12, 3, 2);
        if (p.need === 'water') { rect(g, K.sky[2], cx - 1, by + 3, 3, 6); rect(g, K.sky[2], cx, by + 2, 1, 1); } else if (p.need === 'weed') { rect(g, K.forest[2], cx - 3, by + 3, 2, 6); rect(g, K.forest[2], cx + 1, by + 4, 2, 5); } else { ell(g, INK, cx, by + 6, 3, 2); } }
      if (p.happy > 0) txtC(g, '+', cx + 12, y + 12 - Math.round((1 - p.happy) * 8), K.mint[1]);
      if (on) { rect(g, K.butter[1], x, y + 58, 54, 2); }
    });
    ['Water', 'Weed', 'Shoo'].forEach((n, i) => btn(g, 96 + i * 44, 196, 40, 16, `${i + 1} ${n}`, { on: this.tool === i, color: K.forest }));
  }
}
export function greenhouseBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (Math.round(t * 60) % 6) return input;
  const i = m.pots.findIndex((p) => p.need);
  if (i < 0) return input;
  if (NEEDS[m.tool] !== m.pots[i].need) { input.pressed.add(String(NEEDS.indexOf(m.pots[i].need) + 1)); return input; }
  const r = m.potRect(i); return Object.assign(input, { mx: r[0] + 20, my: r[1] + 30, justDown: true });
}

// ======================= COOKING CLUB: COOK-OFF =======================
const DISHES = [
  { name: 'Omurice', steps: ['Rice', 'Ketchup', 'Egg', 'Pan'] },
  { name: 'Miso soup', steps: ['Water', 'Dashi', 'Tofu', 'Miso'] },
  { name: 'Pancakes', steps: ['Flour', 'Egg', 'Milk', 'Pan'] },
  { name: 'Curry', steps: ['Onion', 'Carrot', 'Water', 'Roux'] },
  { name: 'Onigiri', steps: ['Rice', 'Salt', 'Umeboshi', 'Nori'] },
];
const ING = ['Rice', 'Ketchup', 'Egg', 'Pan', 'Water', 'Dashi', 'Tofu', 'Miso', 'Flour', 'Milk', 'Onion', 'Carrot', 'Roux', 'Salt', 'Umeboshi', 'Nori'];
const ING_C = { Rice: K.paper[4], Ketchup: K.ribbon[2], Egg: K.butter[2], Pan: K.metal[2], Water: K.sky[3], Dashi: K.wood[3], Tofu: K.paper[3], Miso: K.wood[2], Flour: K.paper[4], Milk: '#ffffff', Onion: K.lilac[3], Carrot: K.hairGinger[2], Roux: K.woodDark[2], Salt: K.stone[4], Umeboshi: K.coral[2], Nori: K.forest[0] };
export class CookOffGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Cook-off', chip: 'Cooking', color: K.coral, limit: 0,
      how: ['Follow the recipe card: add the ingredients in order.', 'Then stir: press space when the spoon is in the gold zone. The club judges your dish!'],
      keys: 'Click ingredients or arrows + space',
    });
    this.dish = DISHES[Math.floor(this.rng() * DISHES.length)];
    const extra = ING.filter((x) => !this.dish.steps.includes(x)).sort(() => this.rng() - 0.5).slice(0, 4);
    this.shelf = [...this.dish.steps, ...extra].sort(() => this.rng() - 0.5);
    Object.assign(this, { si: 0, sel: 0, wrong: 0, stage: 'add', stirs: 0, good: 0, sp: 0 });
  }
  progress() { return clamp(0.3 + this.si * 0.1 + this.good * 0.05, 0.3, 1); }
  info() { return this.dish.name; }
  rectOf(i) { return [14 + (i % 4) * 46, 120 + Math.floor(i / 4) * 40, 42, 36]; }
  add(i) {
    const ing = this.shelf[i];
    if (ing === this.dish.steps[this.si]) { this.si++; sfx('pop'); this.pop(`+ ${ing}`, 250, 70, K.butter[3]); if (this.si >= 4) { this.stage = 'stir'; this.pop('Now stir!', 250, 60, K.butter[3]); } }
    else { this.wrong++; sfx('wrong'); this.pop('Check the recipe card!', 100, 110, K.coral[3]); }
  }
  play(dt, input) {
    const k = input.pressed;
    if (this.stage === 'add') {
      if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % 8;
      if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + 7) % 8;
      if (k.has('arrowdown') || k.has('s') || k.has('arrowup') || k.has('w')) this.sel = (this.sel + 4) % 8;
      if (input.justDown) { const i = this.shelf.findIndex((_, j) => inRect(input.mx, input.my, this.rectOf(j))); if (i >= 0) { this.sel = i; this.add(i); } return; }
      if (k.has(' ') || k.has('e') || k.has('enter')) this.add(this.sel);
      return;
    }
    this.sp += dt * (2.4 + this.diff);
    if (act(input)) {
      this.stirs++;
      const z = (Math.sin(this.sp) + 1) / 2;
      if (z > 0.4 && z < 0.6) { this.good++; sfx('chime'); } else sfx('pour');
      if (this.stirs >= 5) {
        const sc = clamp(0.45 + this.good * 0.11 - this.wrong * 0.05, 0.3, 1);
        const judges = Math.round(sc * 10);
        this.finish(sc, `The judges give your ${this.dish.name} ${judges} out of 10!`);
      }
    }
  }
  scene(g) {
    blit(g, 'school_cook_bg', 320, 224, (c) => {
      rect(c, K.paper[3], 0, 0, 320, 224); for (let y = 19; y < 110; y += 10) for (let x = (y / 10) % 2 ? 0 : 5; x < 320; x += 10) rect(c, K.paper[2], x, y, 9, 9);
      rect(c, K.metal[3], 0, 110, 320, 114); rect(c, K.metal[4], 0, 110, 320, 2);
    });
    card(g, 14, 26, 120, 84); txtC(g, 'Recipe card', 74, 31, K.coral[1]); txtC(g, this.dish.name, 74, 42, INK);
    this.dish.steps.forEach((s, i) => txt(g, `${i + 1}. ${s}`, 26, 55 + i * 12, i < this.si ? K.forest[1] : INK));
    this.shelf.forEach((ing, i) => {
      const [x, y, w, h] = this.rectOf(i), on = this.sel === i && this.stage === 'add';
      rect(g, INK, x, y, w, h); rect(g, on ? K.butter[3] : K.paper[4], x + 1, y + 1, w - 2, h - 2);
      ell(g, INK, x + w / 2, y + 14, 9, 7); ell(g, ING_C[ing], x + w / 2, y + 14, 8, 6); rect(g, '#ffffff', x + w / 2 - 4, y + 10, 2, 1);
      txtC(g, ing, x + w / 2, y + 26, INK);
    });
    // pot
    ell(g, INK, 250, 150, 44, 10); rect(g, INK, 206, 150, 89, 40); ell(g, INK, 250, 190, 44, 10);
    rect(g, K.charcoal[2], 207, 150, 87, 40); ell(g, K.charcoal[3], 250, 150, 43, 9);
    const fill = this.dish.steps.slice(0, this.si).map((s) => ING_C[s]);
    ell(g, fill.length ? fill[fill.length - 1] : K.charcoal[1], 250, 152, 38, 7);
    if (this.stage === 'stir') {
      const z = (Math.sin(this.sp) + 1) / 2;
      card(g, 196, 40, 108, 22); rect(g, K.paper[2], 202, 50, 96, 6); rect(g, K.butter[2], 202 + 96 * 0.4, 50, 96 * 0.2, 6); rect(g, INK, 202 + Math.round(z * 96) - 1, 46, 3, 14);
      txt(g, `Stir ${this.stirs}/5`, 202, 43, K.coral[1]);
      line(g, K.wood[2], 250 + Math.round((z - 0.5) * 50), 152, 270 + Math.round((z - 0.5) * 30), 110, 3);
    }
    for (let i = 0; i < 3; i++) { const sx = 230 + i * 18, sy = 130 - ((this.t * 20 + i * 9) % 30); rect(g, 'rgba(255,255,255,0.6)', sx + Math.round(Math.sin(this.t * 3 + i) * 3), sy, 2, 4); }
  }
}
export function cookBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (Math.round(t * 60) % 6) return input;
  if (m.stage === 'add') { const i = m.shelf.indexOf(m.dish.steps[m.si]); const r = m.rectOf(i); return Object.assign(input, { mx: r[0] + 5, my: r[1] + 5, justDown: true }); }
  const z = (Math.sin(m.sp) + 1) / 2; if (z > 0.45 && z < 0.55) input.pressed.add(' ');
  return input;
}
