// Art "Pixel Copy" (+ the Art Club free painting), Music "Recorder Rhythm" (+ club songs) and the seasonal PE games.
import { Cursor, act, axis } from '../../input.js';
import { addSfx } from '../../audio.js';
import { CardGame, K, INK, rect, disc, ell, txt, txtC, txtR, blit, btn, inRect, card, meter, keycap, sfx, clamp, dither, line } from './common.js';

// ======================= ART: PIXEL COPY =======================
const PAL = [K.paper[4], K.ink[1], K.coral[2], K.butter[2], K.sky[2], K.forest[2], K.wood[2], K.lilac[2]];
// 8x8 pictures; digits index PAL.
export const PICTURES = [
  { name: 'Heart', px: ['00000000', '02200220', '22222222', '22222222', '02222220', '00222200', '00022000', '00000000'] },
  { name: 'Star', px: ['00033000', '00033000', '33333333', '03333330', '00333300', '03300330', '33000033', '00000000'] },
  { name: 'Cat', px: ['60000060', '66000660', '66666666', '61666616', '66633666', '66666666', '06666660', '00000000'] },
  { name: 'House', px: ['00022000', '00222200', '02222220', '22222222', '06666660', '06446160', '06446660', '55555555'] },
  { name: 'Flower', px: ['00700700', '07770777', '00737700', '00077000', '00050000', '05550550', '00555500', '00050000'] },
  { name: 'Fish', px: ['00000000', '00044000', '04444404', '44144444', '44444444', '04444404', '00044000', '00000000'] },
  { name: 'Mushroom', px: ['00222200', '02202220', '22222022', '20222222', '00066000', '00066000', '00666600', '55555555'] },
  { name: 'Lantern', px: ['00011000', '00111100', '01333310', '01333310', '01333310', '01333310', '00111100', '00011000'] },
  { name: 'Moon', px: ['00033300', '00333000', '03330000', '03330000', '03330000', '03333000', '00333330', '00033300'] },
];

export class ArtGame extends CardGame {
  constructor(game, opts = {}) {
    const free = !!opts.free;
    super(game, opts, {
      title: free ? 'Art club canvas' : opts.exam ? 'Art exam' : 'Pixel Copy', chip: free ? 'Art club' : 'Art', color: K.sakura, limit: free ? 60 : opts.exam ? 70 : opts.quiz ? 30 : 50,
      how: free ? ['Paint anything you like on the 12x12 canvas. Today\'s theme is shown on the easel.', 'Press Done when you are happy with it. It goes in your club gallery!']
        : ['Memorise the picture, then redraw it on the grid from memory.', 'Number keys or click a colour. Click cells or move with arrows and press space.'],
      keys: '1-8: colour   Arrows + space or click: paint   Enter: done',
    });
    this.free = free; this.N = free ? 12 : 8;
    this.rounds = free ? 1 : opts.quiz ? 1 : opts.exam ? 3 : 2;
    const pool = PICTURES.slice(); this.pics = [];
    while (this.pics.length < this.rounds) this.pics.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    this.theme = free ? ['the sea', 'Mochi', 'a flower', 'the night sky', 'your favourite food', 'the school'][Math.floor(this.rng() * 6)] : '';
    Object.assign(this, { round: 0, col: 1, cx: 0, cy: 0, scores: [], wait: 0 });
    this.load();
  }
  get cell() { return this.free ? 12 : 16; }
  get gx() { return 160 - (this.N * this.cell) / 2; }
  get gy() { return 36; }
  load() { this.grid = Array.from({ length: this.N }, () => Array(this.N).fill(0)); this.look = this.free ? 0 : Math.max(2.5, 5 - this.diff * 2.5); }
  get pic() { return this.pics[this.round]; }
  progress() { return clamp((this.scores.reduce((a, b) => a + b, 0) + (this.free ? 0.8 : this.match() * 0.6)) / this.rounds, 0.2, 1); }
  info() { return this.free ? '' : this.look > 0 ? `Look! ${Math.ceil(this.look)}` : `Picture ${this.round + 1}/${this.rounds}`; }
  match() { let ok = 0; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (+this.pic.px[y][x] === this.grid[y][x]) ok++; return ok / 64; }
  submit() {
    if (this.free) {
      const used = new Set(this.grid.flat()).size, filled = this.grid.flat().filter((v) => v).length / (this.N * this.N);
      this.result = null;
      this.painting = this.grid.map((r) => r.join('')).join('/');
      this.finish(clamp(0.4 + filled * 0.6 + used * 0.05, 0.4, 1), 'Painting added to your club gallery!');
      this.result.painting = this.painting; this.result.theme = this.theme;
      return;
    }
    const m = this.match(), sc = clamp((m - 0.5) / 0.45, 0.2, 1);
    this.scores.push(sc); sfx(sc > 0.7 ? 'chime' : 'pop'); this.flash = 0.2; this.wait = 1.6; this.reveal = true;
    this.pop(`${Math.round(m * 100)}% match!`, 160, 30 + this.N * this.cell + 12, K.butter[0]);
  }
  paint(x, y) { if (x >= 0 && y >= 0 && x < this.N && y < this.N && this.grid[y][x] !== this.col) { this.grid[y][x] = this.col; sfx('blip'); } }
  play(dt, input) {
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) { this.reveal = false; this.round++; if (this.round >= this.rounds) this.finish(this.scores.reduce((a, b) => a + b, 0) / this.rounds); else this.load(); }
      return;
    }
    if (this.look > 0) { this.look -= dt; if (act(input) && this.t > 1) this.look = 0; return; }
    const k = input.pressed;
    for (let i = 1; i <= 8; i++) if (k.has(String(i))) this.col = i - 1;
    if (k.has('arrowright') || k.has('d')) this.cx = Math.min(this.N - 1, this.cx + 1);
    if (k.has('arrowleft') || k.has('a')) this.cx = Math.max(0, this.cx - 1);
    if (k.has('arrowdown') || k.has('s')) this.cy = Math.min(this.N - 1, this.cy + 1);
    if (k.has('arrowup') || k.has('w')) this.cy = Math.max(0, this.cy - 1);
    if (k.has(' ') || k.has('e')) this.paint(this.cx, this.cy);
    if (k.has('enter')) return this.submit();
    const c = this.cell, mx = Math.floor((input.mx - this.gx) / c), my = Math.floor((input.my - this.gy) / c);
    if (input.down && mx >= 0 && my >= 0 && mx < this.N && my < this.N) { this.cx = mx; this.cy = my; this.paint(mx, my); }
    if (input.justDown) {
      PAL.forEach((_, i) => { if (inRect(input.mx, input.my, [16 + (i % 2) * 22, 50 + Math.floor(i / 2) * 22, 20, 20])) this.col = i; });
      if (inRect(input.mx, input.my, [252, 180, 56, 16])) this.submit();
    }
  }
  scene(g) {
    blit(g, 'school_art_bg', 320, 224, (c) => {
      rect(c, K.plaster[3], 0, 0, 320, 224); dither(c, K.plaster[2], 0, 150, 320, 74);
      rect(c, K.wood[1], 0, 200, 320, 24); rect(c, K.wood[2], 0, 200, 320, 2);
      // easel legs
      line(c, K.wood[1], 120, 210, 140, 30, 3); line(c, K.wood[1], 200, 210, 180, 30, 3);
      // paint splotches
      [[270, 60, K.coral], [290, 90, K.sky], [262, 120, K.butter], [296, 140, K.forest]].forEach(([x, y, r]) => { ell(c, r[1], x, y, 7, 5); ell(c, r[2], x - 1, y - 1, 5, 3); });
    });
    const c = this.cell, N = this.N, gx = this.gx, gy = this.gy;
    card(g, gx - 6, gy - 6, N * c + 12, N * c + 12, { fill: K.paper[4] });
    const showPic = !this.free && (this.look > 0 || this.reveal);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = this.look > 0 ? +this.pic.px[y][x] : this.grid[y][x];
      rect(g, (x + y) % 2 ? K.paper[3] : K.paper[4], gx + x * c, gy + y * c, c, c);
      if (v) rect(g, PAL[v], gx + x * c, gy + y * c, c, c);
      if (this.reveal && +this.pic.px[y][x] !== this.grid[y][x]) { rect(g, K.coral[1], gx + x * c + c / 2 - 1, gy + y * c + c / 2 - 1, 3, 3); }
    }
    if (this.look <= 0 && !this.reveal) { rect(g, INK, gx + this.cx * c, gy + this.cy * c, c, 1); rect(g, INK, gx + this.cx * c, gy + this.cy * c + c - 1, c, 1); rect(g, INK, gx + this.cx * c, gy + this.cy * c, 1, c); rect(g, INK, gx + this.cx * c + c - 1, gy + this.cy * c, 1, c); }
    // palette
    card(g, 10, 40, 50, 112);
    txtC(g, 'Colour', 35, 44, K.sakura[0]);
    PAL.forEach((p, i) => { const x = 16 + (i % 2) * 22, y = 54 + Math.floor(i / 2) * 22; rect(g, this.col === i ? K.butter[1] : INK, x - 1, y - 1, 20, 20); rect(g, p, x, y, 18, 18); txt(g, String(i + 1), x + 2, y + 2, i === 1 ? K.paper[4] : INK); });
    if (showPic && this.look > 0) { card(g, 230, 36, 82, 40); txtC(g, 'Remember it!', 271, 44, K.sakura[0]); txtC(g, this.pic.name, 271, 56, INK); meter(g, 240, 66, 62, 3, this.look / 5, K.sakura[2]); }
    if (this.free) { card(g, 236, 36, 76, 44); txtC(g, 'Theme:', 274, 44, K.sakura[0]); txtC(g, this.theme, 274, 56, INK); }
    if (this.look <= 0 && !this.reveal) btn(g, 252, 180, 56, 16, 'Done', { color: K.sakura });
  }
}
export function artBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.look > 0 || m.wait > 0) return input;
  if (m.free) { if (t > 3) input.pressed.add('enter'); else Object.assign(input, { mx: m.gx + (t * 40 % 12) * m.cell, my: m.gy + 30, down: true }); return input; }
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const want = +m.pic.px[y][x];
    if (m.grid[y][x] !== want) { input.pressed.add(String(want + 1)); m.cx = x; m.cy = y; input.pressed.add(' '); return input; }
  }
  input.pressed.add('enter'); return input;
}

// ======================= MUSIC: RECORDER RHYTHM =======================
const NOTE_HZ = [523, 659, 784];
NOTE_HZ.forEach((f, i) => addSfx('school_rec' + i, ({ tone }) => { tone(f, 0.22, 'sine', 0.07); tone(f * 2, 0.12, 'triangle', 0.015); }));
// Songs: beats per lane step strings ('0','1','2' lanes, '.' rest), one char per half beat.
export const SONGS = {
  scale: { name: 'Do re mi warm-up', bpm: 96, notes: '0.1.2.1.0...0.0.1.1.2...2.1.0...0.1.2.2.1.0.' },
  frog: { name: 'Frog song', bpm: 100, notes: '0.1.2.1.0...2.1.0.1.2...0...0...0...0...0012..1.0.' },
  lantern: { name: 'Lantern lullaby', bpm: 92, notes: '2...1.0.1...2.2.2...1.1.1...2.2.2...1.0.1.2.' },
  festival: { name: 'Festival march', bpm: 120, notes: '0.0.2.2.1.1.2...0.1.2.0.1.2.1...2.1.0.1.2.2.2...0.2.1.2.0...' },
  band: { name: 'Garage band riff', bpm: 128, notes: '0.02.1.0.2.12.0...0.02.1.0.2.12.2...1.1.20.2.1.0..' },
};
const LANES = [['arrowleft', 'a', 'j'], ['arrowdown', 's', 'k'], ['arrowright', 'd', 'l']];
const HITY = 176;
export class RhythmGame extends CardGame {
  constructor(game, opts = {}) {
    const club = !!opts.club;
    const ids = club ? ['festival', 'band', 'lantern'] : ['scale', 'frog', 'lantern'];
    const sid = opts.song || ids[Math.floor(((game && game.rng) || Math.random)() * ids.length)];
    super(game, opts, {
      title: opts.exam ? 'Music exam' : SONGS[sid].name, chip: club ? 'Music club' : 'Music', color: K.lilac, limit: 0,
      how: ['Notes slide down three lanes. Play each one as it reaches the line.', 'Keys: left, down, right (or A S D). Or click the lane.'],
      keys: 'Left / Down / Right  or  A S D  or click',
    });
    const song = SONGS[sid];
    this.beat = 60 / (song.bpm * (1 + this.diff * 0.25)) / 2;
    this.notes = []; [...song.notes].forEach((ch, i) => { if (ch !== '.') this.notes.push({ lane: +ch, at: 1.5 + i * this.beat, hit: 0 }); });
    if (opts.quiz) this.notes = this.notes.slice(0, 12);
    this.end = this.notes[this.notes.length - 1].at + 1.2;
    Object.assign(this, { combo: 0, best: 0, perfect: 0, good: 0, miss: 0, glow: [0, 0, 0], speed: 90 + this.diff * 30 });
  }
  progress() { return clamp((this.perfect + this.good * 0.6) / this.notes.length, 0.2, 1); }
  info() { return `Combo ${this.combo}`; }
  judge(lane) {
    const now = this.playT, cand = this.notes.filter((n) => !n.hit && n.lane === lane && Math.abs(n.at - now) < 0.2).sort((a, b) => Math.abs(a.at - now) - Math.abs(b.at - now))[0];
    this.glow[lane] = 0.15;
    if (!cand) return;
    const d = Math.abs(cand.at - now);
    cand.hit = d < 0.07 ? 2 : 1;
    if (cand.hit === 2) this.perfect++; else this.good++;
    this.combo++; this.best = Math.max(this.best, this.combo);
    sfx('school_rec' + lane);
    this.pop(cand.hit === 2 ? 'Perfect' : 'Good', 100 + lane * 60, HITY - 22, cand.hit === 2 ? K.butter[3] : K.mint[3]);
  }
  play(dt, input) {
    this.glow = this.glow.map((v) => Math.max(0, v - dt));
    const k = input.pressed;
    LANES.forEach((keys, i) => { if (keys.some((x) => k.has(x))) this.judge(i); });
    if (input.justDown && input.mx > 70 && input.mx < 250) this.judge(clamp(Math.floor((input.mx - 70) / 60), 0, 2));
    for (const n of this.notes) if (!n.hit && this.playT - n.at > 0.2) { n.hit = -1; this.miss++; this.combo = 0; }
    if (this.playT > this.end) {
      const acc = (this.perfect + this.good * 0.7) / this.notes.length;
      this.finish(clamp(acc + (this.best >= this.notes.length * 0.8 ? 0.05 : 0), 0.2, 1), `${this.perfect} perfect, ${this.good} good. Best combo ${this.best}!`);
    }
  }
  scene(g) {
    blit(g, 'school_music_bg', 320, 224, (c) => {
      rect(c, K.lilac[1], 0, 0, 320, 224); dither(c, K.lilac[0], 0, 19, 320, 60);
      // music stand and staff lines on the sides
      for (let i = 0; i < 5; i++) { rect(c, K.lilac[3], 8, 50 + i * 6, 54, 1); rect(c, K.lilac[3], 258, 50 + i * 6, 54, 1); }
      rect(c, K.charcoal[1], 70, 19, 180, 205);
      for (let i = 0; i <= 3; i++) rect(c, K.charcoal[3], 70 + i * 60, 19, 1, 205);
    });
    const cols = [K.coral, K.butter, K.sky];
    for (let i = 0; i < 3; i++) { if (this.glow[i] > 0) { g.globalAlpha = this.glow[i] * 4; rect(g, cols[i][3], 71 + i * 60, 19, 59, 205); g.globalAlpha = 1; } }
    rect(g, K.paper[4], 70, HITY, 180, 2);
    for (let i = 0; i < 3; i++) { ell(g, INK, 100 + i * 60, HITY + 1, 13, 7); ell(g, cols[i][1], 100 + i * 60, HITY + 1, 12, 6); ell(g, cols[i][3], 100 + i * 60, HITY, 8, 3); keycap(g, 96 + i * 60, 199, ['<', 'v', '>'][i]); }
    for (const n of this.notes) {
      if (n.hit > 0) continue;
      const y = HITY - (n.at - this.playT) * this.speed;
      if (y < 10 || y > 224) continue;
      const x = 100 + n.lane * 60, c = cols[n.lane];
      ell(g, INK, x, y, 11, 6); ell(g, n.hit < 0 ? K.ink[3] : c[2], x, y, 10, 5); rect(g, c[4], x - 5, y - 3, 6, 1);
      if (n.hit === 0) { rect(g, INK, x + 9, y - 18, 2, 18); rect(g, INK, x + 11, y - 18, 4, 2); }
    }
    card(g, 6, 100, 58, 48);
    txtC(g, 'Score', 35, 106, K.lilac[0]);
    txtC(g, `${this.perfect + this.good}/${this.notes.length}`, 35, 118, INK);
    txtC(g, `Miss ${this.miss}`, 35, 132, K.ink[3]);
    // recorder
    rect(g, INK, 272, 70, 12, 120); rect(g, K.paper[3], 273, 71, 10, 118); rect(g, K.wood[3], 273, 71, 10, 14);
    for (let i = 0; i < 6; i++) disc(g, INK, 278, 96 + i * 14, 2);
  }
}
export function rhythmBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  const n = m.notes.find((x) => !x.hit && Math.abs(x.at - m.playT) < 0.03);
  if (n) input.pressed.add(LANES[n.lane][0]);
  return input;
}

// ======================= PE (rotates with the season, badminton when it rains) =======================
export class PEGame extends CardGame {
  constructor(game, opts = {}) {
    const season = opts.mode || (game && game.weather && /rain|storm/.test(game.weather) ? 'badminton' : { spring: 'sprint', autumn: 'dodge', winter: 'rope', summer: 'sprint' }[(game && game.season) || 'spring']);
    const M = {
      sprint: { title: opts.relay ? 'Class relay' : '100 m sprint', how: ['Alternate left and right (or A and D) to run. Keep a steady rhythm!', 'Pressing the same key twice makes Misa stumble.'], keys: 'Left / Right in turn  or click left, right' },
      dodge: { title: 'Dodgeball', how: ['Dodge the balls! Move with left and right or the mouse.', 'Golden balls can be caught with space for bonus points.'], keys: 'Left / Right or mouse: move   Space: catch gold' },
      rope: { title: 'Jump rope', how: ['Jump when the rope swings down to your feet.', 'Press space or click. It speeds up as you go!'], keys: 'Space or click: jump' },
      badminton: { title: 'Indoor badminton', how: ['Rainy day, so PE is in the gym! Hit the shuttle back as it reaches you.', 'Press space or click when it is inside the ring.'], keys: 'Space or click: swing' },
    }[season];
    super(game, opts, { title: M.title, chip: opts.relay ? 'Sports day' : 'PE', color: K.forest, limit: season === 'sprint' ? 0 : opts.quiz ? 15 : 30, how: M.how, keys: M.keys });
    this.mode = season;
    Object.assign(this, { dist: 0, speed: 0, lastKey: null, stumble: 0, rivals: [], hits: 0, catches: 0, balls: [], spawnT: 1, px: 160, jumps: 0, combo: 0, bestCombo: 0, misses: 0, angle: 0, jumpT: 0, shut: null, rally: 0, bestRally: 0, swing: 0 });
    if (season === 'sprint') {
      this.goal = opts.relay ? 200 : 100;
      const names = opts.relay ? ['2-A', '2-C', '2-D'] : ['Kai', 'Rina', 'Hina'];
      const sp = opts.relay ? [6.3, 6.6, 6.0] : [8.2, 6.4, 7.0];
      this.rivals = names.map((n, i) => ({ name: n, d: 0, v: sp[i] * (0.92 + this.diff * 0.12) }));
    }
  }
  progress() {
    if (this.mode === 'sprint') return clamp(this.dist / this.goal, 0.2, 1);
    if (this.mode === 'dodge') return clamp(1 - this.hits * 0.12 + this.catches * 0.05, 0.3, 1);
    if (this.mode === 'rope') return clamp(this.jumps / (18 + this.diff * 10) - this.misses * 0.03, 0.3, 1);
    return clamp(this.hits / 16 - this.misses * 0.03, 0.3, 1);
  }
  info() { return this.mode === 'sprint' ? `${Math.floor(this.dist)} m` : this.mode === 'dodge' ? `Hits ${this.hits}` : this.mode === 'rope' ? `Jumps ${this.jumps}` : `Rally ${this.rally}`; }
  timeUp() { const p = this.progress(); this.finish(p, this.mode === 'rope' ? `${this.jumps} jumps, best streak ${this.bestCombo}!` : this.mode === 'badminton' ? `Best rally: ${this.bestRally}!` : null); }
  play(dt, input) { this[this.mode](dt, input); }
  sprint(dt, input) {
    const k = input.pressed; let key = null;
    if (k.has('arrowleft') || k.has('a')) key = 'L'; if (k.has('arrowright') || k.has('d')) key = 'R';
    if (input.justDown) key = input.mx < 160 ? 'L' : 'R';
    if (this.stumble > 0) this.stumble -= dt;
    else if (key) { if (key === this.lastKey) { this.stumble = 0.35; this.speed *= 0.5; sfx('wrong'); } else { this.speed = Math.min(10.5, this.speed + 1.15); sfx('step'); } this.lastKey = key; }
    this.speed = Math.max(0, this.speed - dt * 3.2);
    this.dist += this.speed * dt;
    for (const r of this.rivals) r.d += r.v * dt * (this.playT < 1 ? this.playT : 1);
    if (this.dist >= this.goal) {
      const place = 1 + this.rivals.filter((r) => r.d >= this.goal).length;
      this.place = place;
      this.finish(clamp(1.15 - place * 0.15 - Math.max(0, this.playT - this.goal / 8.5) * 0.02, 0.35, 1), `You finished ${['first', 'second', 'third', 'fourth'][place - 1]}! Time ${this.playT.toFixed(1)} s`);
      this.result.place = place;
    }
  }
  dodge(dt, input) {
    const a = axis(input).x;
    if (a) this.px += a * 150 * dt; else if (input.moved) this.px = input.mx;
    this.px = clamp(this.px, 30, 290);
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 0.9 - this.diff * 0.35 - Math.min(0.3, this.playT * 0.01); const gold = this.rng() < 0.15; this.balls.push({ x: 20 + this.rng() * 280, y: 30, vx: (this.rng() - 0.5) * 60, vy: 90 + this.rng() * 50 + this.diff * 40, gold }); }
    for (const b of this.balls) { b.x += b.vx * dt; b.y += b.vy * dt; }
    if (this.stumble > 0) this.stumble -= dt;
    for (const b of this.balls) {
      if (b.y > 168 && b.y < 196 && Math.abs(b.x - this.px) < 16 && !b.gone) {
        if (b.gold && act(input)) { b.gone = true; this.catches++; sfx('chime'); this.pop('Caught it!', this.px, 150, K.butter[3]); }
        else if (!b.gold && this.stumble <= 0) { b.gone = true; this.hits++; this.stumble = 0.8; this.shake = 0.2; sfx('wrong'); this.pop('Oof! Gently does it', this.px, 150, K.coral[3]); }
      }
    }
    this.balls = this.balls.filter((b) => b.y < 230 && !b.gone);
  }
  rope(dt, input) {
    const sp = 2.6 + this.diff * 1.2 + Math.min(2, this.jumps * 0.05);
    const prev = this.angle; this.angle += sp * dt;
    if (act(input) && this.jumpT <= 0) { this.jumpT = 0.42; sfx('blip'); }
    if (this.jumpT > 0) this.jumpT -= dt;
    // the rope passes the feet at angle = pi (mod 2pi)
    const pass = Math.floor((prev - Math.PI) / (Math.PI * 2)) !== Math.floor((this.angle - Math.PI) / (Math.PI * 2));
    if (pass) {
      if (this.jumpT > 0.05) { this.jumps++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); if (this.combo % 5 === 0) this.pop(`${this.combo} in a row!`, 160, 80, K.butter[3]); sfx('step'); }
      else { this.misses++; this.combo = 0; sfx('wrong'); this.pop('Tangled! Again', 160, 80, K.coral[3]); }
    }
  }
  badminton(dt, input) {
    if (!this.shut) this.shut = { k: 0, dir: 1, dur: 1.4 - this.diff * 0.4 };
    const s = this.shut;
    s.k += dt / s.dur * s.dir;
    if (this.swing > 0) this.swing -= dt;
    if (s.dir > 0 && act(input) && this.swing <= 0) {
      this.swing = 0.25;
      if (s.k > 0.78 && s.k < 1.05) { s.dir = -1; this.hits++; this.rally++; this.bestRally = Math.max(this.bestRally, this.rally); sfx('pop'); if (s.k > 0.88 && s.k < 0.98) this.pop('Smash!', 220, 120, K.butter[3]); }
      else sfx('blip');
    }
    if (s.dir > 0 && s.k > 1.15) { this.misses++; this.rally = 0; sfx('wrong'); this.shut = null; this.pop('Missed. Next serve!', 200, 110, K.coral[3]); }
    else if (s.dir < 0 && s.k <= 0) { s.dir = 1; s.k = 0; s.dur = Math.max(0.7, s.dur * 0.97); }
  }
  scene(g) {
    const m = this.mode;
    if (m === 'sprint') {
      blit(g, 'school_pe_track', 320, 224, (c) => {
        rect(c, K.sky[3], 0, 0, 320, 70); rect(c, K.grassSpring[2], 0, 70, 320, 20); for (let x = 0; x < 320; x += 6) rect(c, K.grassSpring[3], x, 70 + (x % 4), 2, 2);
        rect(c, K.brick[3], 0, 90, 320, 134); for (let i = 0; i < 5; i++) rect(c, K.paper[4], 0, 100 + i * 24, 320, 1);
        rect(c, K.plaster[3], 0, 50, 320, 20); for (let x = 4; x < 320; x += 12) ell(c, [K.coral[2], K.sky[2], K.butter[2], K.forest[2]][(x / 12) % 4 | 0], x, 58, 3, 4);
      });
      const off = (this.dist * 12) % 64;
      for (let x = -off; x < 320; x += 64) rect(g, K.paper[4], x, 92, 2, 128);
      const fin = 60 + (this.goal - this.dist) * 12; if (fin < 320) { for (let y = 92; y < 220; y += 4) rect(g, (y / 4) % 2 ? INK : K.paper[4], fin, y, 4, 4); }
      const runner = (x, y, col, name, t) => { const b = Math.round(Math.abs(Math.sin(t)) * 3); ell(g, 'rgba(42,26,64,0.3)', x, y + 14, 8, 2); rect(g, INK, x - 5, y - 14 - b, 10, 22); rect(g, col, x - 4, y - 13 - b, 8, 10); rect(g, K.paper[4], x - 4, y - 3 - b, 8, 8); disc(g, INK, x, y - 19 - b, 6); disc(g, hairOf(name), x, y - 20 - b, 5); rect(g, K.skinLight[3], x - 3, y - 19 - b, 7, 4); rect(g, INK, x - 4 + Math.round(Math.sin(t) * 3), y + 5 - b, 3, 8); rect(g, INK, x + 1 - Math.round(Math.sin(t) * 3), y + 5 - b, 3, 8); txtC(g, name, x, y - 34 - b, K.paper[4], K.ink[0]); };
      this.rivals.forEach((r, i) => runner(clamp(60 + (r.d - this.dist) * 12, -20, 340), 112 + i * 24, [K.coral[2], K.butter[2], K.hairGinger[2]][i], r.name, r.d * 2.3));
      runner(60, 184, K.navy[2], 'Misa', this.dist * 2.3);
      card(g, 220, 24, 94, 26); meter(g, 228, 40, 78, 4, this.dist / this.goal, K.forest[2]); txt(g, 'Goal', 228, 28, K.forest[0]);
      if (this.stumble > 0) txtC(g, 'Whoops! Left, right, left, right...', 160, 196, K.coral[4], K.ink[0]);
    } else if (m === 'dodge') {
      blit(g, 'school_pe_court', 320, 224, (c) => { rect(c, K.grassAutumn[3], 0, 0, 320, 224); rect(c, K.dirt[3], 10, 24, 300, 196); rect(c, K.paper[4], 10, 110, 300, 2); rect(c, K.paper[4], 10, 24, 2, 196); rect(c, K.paper[4], 308, 24, 2, 196); for (let i = 0; i < 40; i++) rect(c, K.dirt[2], (i * 73) % 300 + 10, (i * 41) % 190 + 26, 3, 1); });
      for (let i = 0; i < 4; i++) { const x = 50 + i * 70; rect(g, INK, x - 5, 30, 10, 22); rect(g, [K.coral[2], K.sky[2], K.butter[2], K.forest[2]][i], x - 4, 31, 8, 10); disc(g, INK, x, 26, 6); disc(g, K.skinLight[3], x, 26, 5); }
      for (const b of this.balls) { ell(g, 'rgba(42,26,64,0.3)', b.x, b.y + 8, 5, 2); disc(g, INK, b.x, b.y, 7); disc(g, b.gold ? K.butter[2] : K.coral[2], b.x, b.y, 6); rect(g, b.gold ? K.butter[4] : K.coral[4], b.x - 3, b.y - 3, 2, 2); line(g, b.gold ? K.butter[1] : K.coral[1], b.x - 6, b.y, b.x + 6, b.y, 1); }
      const blink = this.stumble > 0 && Math.floor(this.t * 12) % 2;
      if (!blink) { const x = this.px; ell(g, 'rgba(42,26,64,0.3)', x, 196, 10, 3); rect(g, INK, x - 7, 170, 14, 26); rect(g, K.navy[2], x - 6, 171, 12, 12); rect(g, K.paper[4], x - 6, 183, 12, 12); disc(g, INK, x, 164, 8); disc(g, K.hairBrown[2], x, 164, 7); rect(g, K.skinLight[3], x - 5, 165, 10, 5); }
    } else if (m === 'rope') {
      blit(g, 'school_pe_gymrope', 320, 224, (c) => { rect(c, K.wood[4], 0, 0, 320, 224); for (let y = 24; y < 224; y += 10) rect(c, K.wood[3], 0, y, 320, 1); rect(c, K.plaster[3], 0, 19, 320, 60); for (let x = 20; x < 320; x += 60) { rect(c, K.sky[3], x, 30, 30, 24); rect(c, K.sky[4], x + 2, 32, 12, 8); } rect(c, K.coral[2], 0, 150, 320, 2); });
      const a = this.angle, ry = 113 - Math.cos(a) * 73, depth = Math.sin(a) > 0;
      const jy = this.jumpT > 0 ? -Math.round(Math.sin((0.42 - this.jumpT) / 0.42 * Math.PI) * 26) : 0;
      const drawRope = () => { let px = 60, py = 120; for (let i = 1; i <= 20; i++) { const u = i / 20, x = 60 + u * 200, y = 120 + (ry - 120) * Math.sin(u * Math.PI); line(g, K.coral[1], px, py, x, y, 2); px = x; py = y; } };
      if (!depth) drawRope();
      [[52, K.forest[2]], [268, K.sky[2]]].forEach(([x, col]) => { rect(g, INK, x - 6, 110, 12, 50); rect(g, col, x - 5, 111, 10, 20); disc(g, INK, x, 104, 7); disc(g, K.skinLight[3], x, 104, 6); });
      const x = 160, y = 180 + jy; ell(g, 'rgba(42,26,64,0.3)', x, 184, 10, 3); rect(g, INK, x - 7, y - 28, 14, 28); rect(g, K.navy[2], x - 6, y - 27, 12, 13); rect(g, K.paper[4], x - 6, y - 14, 12, 12); disc(g, INK, x, y - 34, 8); disc(g, K.hairBrown[2], x, y - 34, 7); rect(g, K.skinLight[3], x - 5, y - 33, 10, 5);
      if (depth) drawRope();
      txtC(g, `Streak ${this.combo}`, 160, 30, K.wood[0]);
    } else {
      blit(g, 'school_pe_badminton', 320, 224, (c) => { rect(c, K.wood[4], 0, 0, 320, 224); for (let y = 24; y < 224; y += 10) rect(c, K.wood[3], 0, y, 320, 1); rect(c, K.sky[2], 0, 150, 320, 2); rect(c, K.coral[2], 30, 60, 2, 150); rect(c, K.coral[2], 290, 60, 2, 150); rect(c, K.metal[1], 158, 60, 4, 120); for (let y = 64; y < 120; y += 4) rect(c, K.paper[3], 140, y, 40, 1); for (let x = 140; x < 180; x += 4) rect(c, K.paper[3], x, 64, 1, 56); });
      const s = this.shut || { k: 0 }, u = clamp(s.k, 0, 1.2);
      const sx = 60 + u * 190, sy = 150 - Math.sin(u * Math.PI) * 100;
      ring(g, K.butter[1], 250, 150, 16);
      const x2 = 50; rect(g, INK, x2 - 6, 130, 12, 40); rect(g, K.ribbon[2], x2 - 5, 131, 10, 16); disc(g, INK, x2, 124, 7); disc(g, K.hairBlonde[2], x2, 124, 6);
      const x = 262, swing = this.swing > 0; rect(g, INK, x - 7, 140, 14, 34); rect(g, K.navy[2], x - 6, 141, 12, 14); disc(g, INK, x, 132, 8); disc(g, K.hairBrown[2], x, 132, 7);
      line(g, K.metal[1], x - 6, 150, swing ? x - 24 : x - 12, swing ? 138 : 128, 2); ell(g, K.paper[4], swing ? x - 26 : x - 14, swing ? 134 : 122, 5, 6);
      disc(g, K.paper[4], sx, sy, 3); rect(g, K.coral[2], sx - (s.dir > 0 ? 6 : -3), sy - 1, 4, 3);
      txtC(g, 'Rina is your partner. Keep the rally going!', 160, 30, K.wood[0]);
    }
  }
}
const hairOf = (n) => ({ Kai: K.hairBlack[2], Rina: K.hairBlonde[2], Hina: K.hairGinger[2], Misa: K.hairBrown[2] }[n] || K.hairBlack[1]);
const ring = (g, c, x, y, r) => { for (let a = 0; a < 40; a++) rect(g, c, Math.round(x + Math.cos(a / 40 * 6.283) * r), Math.round(y + Math.sin(a / 40 * 6.283) * r * 0.6), 2, 1); };
export function peBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  const f = Math.round(t * 60);
  if (m.mode === 'sprint') { if (f % 6 === 0) input.pressed.add(m.lastKey === 'L' ? 'arrowright' : 'arrowleft'); }
  else if (m.mode === 'dodge') { const b = m.balls.find((x) => !x.gold && x.y > 120 && Math.abs(x.x - m.px) < 22); if (b) input.keys.add(b.x < m.px ? 'arrowright' : 'arrowleft'); }
  else if (m.mode === 'rope') { const c = Math.cos(m.angle); if (c < -0.86 && Math.sin(m.angle) > 0 && m.jumpT <= 0) input.pressed.add(' '); }
  else if (m.shut && m.shut.dir > 0 && m.shut.k > 0.88 && m.shut.k < 0.98 && m.swing <= 0) input.pressed.add(' ');
  return input;
}
