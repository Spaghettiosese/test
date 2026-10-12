// Job minigames, part 2 (economy area): library re-shelving by colour-coded call numbers, Wren's Clocks gear
// repair puzzles, and fish market sorting by kind and size on a conveyor.
import { Buttons, clickBtn, topBar, hint, Pops, rect, disc, panel, btn, drawText, drawTextC, measure, C, RAMPS, clamp, timeScore } from './kit.js';
import { ring } from '../../content/economy/gfx.js';

// =============================================================== LIBRARY SHELVING
const SECTIONS = [
  { base: 100, name: 'Philosophy', c: RAMPS.lilac }, { base: 300, name: 'Society', c: RAMPS.butter }, { base: 500, name: 'Science', c: RAMPS.mint },
  { base: 600, name: 'Cooking', c: RAMPS.coral }, { base: 700, name: 'Arts', c: RAMPS.sky }, { base: 800, name: 'Stories', c: RAMPS.hairPink },
];
const SLOTS = 9, SX = 14, SW = 17;
export class LibraryShift {
  constructor(game, { rank = 1, tired = false } = {}) {
    Object.assign(this, { game, rng: game.rng, rank: clamp(rank, 1, 5), tired, t: 0, done: false, score: 0, mistakes: 0, held: -1, wobble: 0, btns: new Buttons(), pops: new Pops() });
    const r = this.rng, secs = SECTIONS.slice().sort(() => r() - 0.5).slice(0, 3);
    const gaps = Math.min(9, 4 + this.rank);
    this.shelves = secs.map((s) => {
      const nums = new Set(); while (nums.size < SLOTS) nums.add(s.base + Math.floor(r() * 100));
      return { sec: s, books: [...nums].sort((a, b) => a - b).map((n) => ({ n, in: true, h: 30 + Math.floor(r() * 7), tone: Math.floor(r() * 2) })) };
    });
    const all = []; this.shelves.forEach((sh, si) => sh.books.forEach((b, bi) => all.push([si, bi])));
    all.sort(() => r() - 0.5);
    this.cart = all.slice(0, gaps).map(([si, bi]) => { const b = this.shelves[si].books[bi]; b.in = false; return { si, bi, n: b.n, h: b.h, tone: b.tone, placed: false }; });
    this.cart.sort(() => r() - 0.5);
    this.layout();
  }
  layout() {
    const b = [];
    this.cart.forEach((c, i) => { if (!c.placed) b.push({ id: 'cart' + i, x: 212 + (i % 5) * 20, y: 64 + Math.floor(i / 5) * 56, w: 18, h: 44, kind: 'cart', i }); });
    if (this.held >= 0) this.shelves.forEach((sh, si) => sh.books.forEach((bk, bi) => { if (!bk.in) b.push({ id: `gap${si}_${bi}`, x: SX + bi * SW, y: 30 + si * 58, w: SW, h: 44, kind: 'gap', si, bi }); }));
    this.btns.set(b);
    if (this.held >= 0 && !this.btns.get(this.btns.focus)?.kind?.startsWith('gap')) { const f = b.find((x) => x.kind === 'gap'); if (f && this.justPicked) this.btns.focus = f.id; }
    this.justPicked = false;
  }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt; this.wobble = Math.max(0, this.wobble - dt); this.pops.update(dt);
    if (input.pressed.has('escape') && this.held >= 0) { this.held = -1; this.layout(); }
    const hit = this.btns.update(input);
    if (!hit) return;
    const b = this.btns.get(hit);
    if (b.kind === 'cart') { this.held = this.held === b.i ? -1 : b.i; this.justPicked = true; game.sfx('page'); this.layout(); return; }
    if (b.kind === 'gap' && this.held >= 0) {
      const c = this.cart[this.held];
      if (c.si === b.si && c.bi === b.bi) {
        c.placed = true; this.shelves[b.si].books[b.bi].in = true; this.held = -1; game.sfx('fold');
        this.pops.add('Shelved!', b.x + 8, b.y, C.gold);
        if (this.cart.every((x) => x.placed)) return this.finish();
      } else {
        this.mistakes++; this.wobble = 0.35; game.sfx('wrong');
        const sh = this.shelves[b.si];
        this.pops.add(c.si !== b.si ? 'Wrong colour shelf' : (c.n < sh.books[b.bi].n ? 'Further left...' : 'Further right...'), b.x + 8, b.y, C.sky);
      }
      this.layout();
    }
  }
  finish() {
    this.done = true;
    const n = this.cart.length, raw = (n / (n + this.mistakes * 0.6)) * timeScore(this.t, n * 6, n * 10);
    this.score = clamp(this.tired ? Math.min(raw, 0.7) : raw, 0, 1);
    this.result = { text: `${n} books shelved, ${this.mistakes} wrong tries` };
  }
  spine(g, x, y, h, n, sec, tone, lift = 0) {
    const ramp = sec.c, top = y + 44 - h - lift;
    rect(g, ramp[1], x, top, SW - 2, h); rect(g, ramp[2 + tone], x + 1, top, SW - 4, h - 1); rect(g, ramp[4], x + 2, top + 2, 1, h - 6);
    rect(g, ramp[0], x + 1, top + 4, SW - 4, 1); rect(g, ramp[0], x + 1, top + h - 4, SW - 4, 1);
    rect(g, '#fffaf0', x + 1, top + h - 13, SW - 4, 8); drawText(g, String(n), x + 1, top + h - 12, C.ink, 1, null);
  }
  draw(g) {
    rect(g, RAMPS.plaster[3], 0, 19, 320, 194);
    for (let y = 19; y < 213; y += 8) rect(g, RAMPS.plaster[2], 0, y, 320, 1);
    // bookcase
    rect(g, RAMPS.woodDark[1], SX - 8, 23, SLOTS * SW + 14, 188); rect(g, RAMPS.woodDark[2], SX - 6, 25, SLOTS * SW + 10, 184);
    this.shelves.forEach((sh, si) => {
      const y = 30 + si * 58;
      rect(g, RAMPS.woodDark[0], SX - 4, y, SLOTS * SW + 6, 44);
      rect(g, sh.sec.c[2], SX - 4, y + 44, SLOTS * SW + 6, 10); rect(g, sh.sec.c[3], SX - 4, y + 44, SLOTS * SW + 6, 1); rect(g, RAMPS.woodDark[3], SX - 6, y + 54, SLOTS * SW + 10, 3);
      drawText(g, `${sh.sec.base}s ${sh.sec.name}`, SX, y + 46, sh.sec.c[0], 1, null);
      sh.books.forEach((bk, bi) => {
        const x = SX + bi * SW;
        if (bk.in) this.spine(g, x, y, bk.h, bk.n, sh.sec, bk.tone);
        else { rect(g, 'rgba(30,22,36,.35)', x, y + 6, SW - 2, 38); if (this.held >= 0) { const on = this.btns.isFocus(`gap${si}_${bi}`); rect(g, on ? C.gold : 'rgba(255,215,106,.35)', x, y + 42, SW - 2, 2); if (on) rect(g, 'rgba(255,215,106,.3)', x, y + 6, SW - 2, 36); } }
      });
    });
    // cart
    panel(g, 204, 40, 110, 140, 'paper');
    drawText(g, 'Returns cart', 212, 46, C.coralD, 1, null);
    rect(g, RAMPS.metal[1], 206, 108, 106, 3); rect(g, RAMPS.metal[1], 206, 164, 106, 3);
    this.cart.forEach((c, i) => {
      if (c.placed) return;
      const x = 212 + (i % 5) * 20, y = 64 + Math.floor(i / 5) * 56, held = this.held === i, on = this.btns.isFocus('cart' + i);
      const dx = held && this.wobble > 0 ? Math.round(Math.sin(this.t * 60) * 2) : 0;
      this.spine(g, x + 1 + dx, y, c.h, c.n, this.shelves[c.si].sec, c.tone, held ? 6 : on ? 2 : 0);
      if (on) rect(g, C.gold, x, y + 45, 18, 1);
    });
    disc(g, RAMPS.charcoal[2], 214, 184, 4); disc(g, RAMPS.charcoal[2], 302, 184, 4);
    this.pops.draw(g);
    hint(g, this.held >= 0 ? 'Now click the gap where it belongs (numbers go up left to right)' : 'Pick a book from the cart: its colour is its shelf');
    topBar(g, 'Library re-shelving', `${this.cart.filter((c) => c.placed).length}/${this.cart.length} books`, this.cart.filter((c) => c.placed).length / this.cart.length);
  }
}
export function libraryBot(m, t, input) {
  if ((m._bt = (m._bt || 0) - 1) > 0) return input;
  m._bt = 8;
  if (m.held < 0) { const i = m.cart.findIndex((c) => !c.placed); return clickBtn(input, m.btns.get('cart' + i)); }
  const c = m.cart[m.held];
  return clickBtn(input, m.btns.get(`gap${c.si}_${c.bi}`));
}

// =============================================================== CLOCK REPAIR (gear mesh)
const RAD = [8, 12, 17];
const BOARD = [16, 30, 300, 176];
export class ClockShift {
  constructor(game, { rank = 1, tired = false } = {}) {
    Object.assign(this, { game, rng: game.rng, rank: clamp(rank, 1, 5), tired, t: 0, done: false, score: 0, clicks: 0, optimal: 0, solvedT: 0, btns: new Buttons(), pops: new Pops(), rot: 0 });
    this.puzzles = 2 + (this.rank >= 3 ? 1 : 0); this.n = 0; this.scores = [];
    this.make();
  }
  make() {
    for (let tries = 0; tries < 200; tries++) if (this.tryMake()) return;
    // fallback: a straight line (always solvable)
    const y = 110, sizes = [1, 1]; let x = 50;
    this.driver = { x, y, r: 12 }; this.pegs = []; let prev = this.driver;
    for (const s of sizes) { x = prev.x + prev.r + RAD[s]; this.pegs.push({ x, y, size: -1, sol: s }); prev = { x, y, r: RAD[s] }; }
    this.target = { x: prev.x + prev.r + 12, y, r: 12 };
    this.after();
  }
  tryMake() {
    const r = this.rng, len = 2 + Math.min(3, Math.floor(this.rank / 2) + (this.n % 2));
    const driver = { x: 40, y: 60 + Math.floor(r() * 90), r: 12 }, chain = [], placed = [driver];
    let prev = driver;
    const ok = (x, y, rr, skip) => x - rr > BOARD[0] + 4 && x + rr < BOARD[0] + BOARD[2] - 4 && y - rr > BOARD[1] + 4 && y + rr < BOARD[1] + BOARD[3] - 4 && placed.every((p) => p === skip || Math.hypot(p.x - x, p.y - y) > p.r + rr + 4);
    for (let i = 0; i <= len; i++) {
      const last = i === len, s = last ? -1 : Math.floor(r() * 3), rr = last ? 12 : RAD[s];
      let done = false;
      for (let k = 0; k < 30 && !done; k++) {
        const a = (r() - 0.5) * Math.PI * 0.9, d = prev.r + rr;
        const x = Math.round(prev.x + Math.cos(a) * d), y = Math.round(prev.y + Math.sin(a) * d);
        if (!ok(x, y, rr, prev)) continue;
        const g = last ? { x, y, r: rr } : { x, y, r: rr, sol: s };
        placed.push(g); if (!last) chain.push(g); prev = g; done = true;
      }
      if (!done) return false;
    }
    this.driver = driver; this.target = prev;
    if (this.target.x < 160) return false;
    this.pegs = chain.map((p) => ({ x: p.x, y: p.y, size: -1, sol: p.sol }));
    // decoy pegs
    for (let k = 0, add = 1 + Math.min(3, this.rank); k < 40 && add > 0; k++) {
      const x = BOARD[0] + 24 + Math.floor(r() * (BOARD[2] - 48)), y = BOARD[1] + 24 + Math.floor(r() * (BOARD[3] - 48));
      if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + 20)) { this.pegs.push({ x, y, size: -1, sol: -1 }); placed.push({ x, y, r: 16 }); add--; }
    }
    this.after();
    return true;
  }
  after() {
    this.optimal = this.pegs.reduce((a, p) => a + (p.sol >= 0 ? p.sol + 1 : 0), 0); this.clicks = 0; this.solvedT = 0; this.solved = false;
    this.btns.set(this.pegs.map((p, i) => ({ id: 'peg' + i, x: p.x - 10, y: p.y - 10, w: 20, h: 20, i })));
    this.solve();
  }
  gears() { return [{ ...this.driver, kind: 'driver' }, ...this.pegs.filter((p) => p.size >= 0).map((p) => ({ x: p.x, y: p.y, r: RAD[p.size], peg: p })), { ...this.target, kind: 'target' }]; }
  solve() {
    const gs = this.gears(), mesh = (a, b) => Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r)) <= 1.6, jam = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1.6;
    gs.forEach((g) => { g.on = false; g.dir = 0; g.jam = false; });
    gs[0].on = true; gs[0].dir = 1;
    const q = [gs[0]];
    while (q.length) { const a = q.shift(); for (const b of gs) if (!b.on && mesh(a, b)) { b.on = true; b.dir = -a.dir; q.push(b); } }
    let jammed = false;
    for (const a of gs) for (const b of gs) if (a !== b && jam(a, b)) { a.jam = b.jam = true; if (a.on || b.on) jammed = true; }
    this.live = gs; this.jammed = jammed;
    this.solved = !jammed && gs[gs.length - 1].on;
  }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt; this.pops.update(dt);
    if (!this.jammed) this.rot += dt * 1.6;
    if (this.solved) {
      this.solvedT += dt;
      if (this.solvedT > 1.6) {
        this.scores.push(clamp(1 - Math.max(0, this.clicks - this.optimal) * 0.04, 0.5, 1)); this.n++;
        if (this.n >= this.puzzles) return this.finish();
        this.make();
      }
      return;
    }
    const hit = this.btns.update(input);
    if (hit) {
      const p = this.pegs[this.btns.get(hit).i];
      p.size = p.size >= 2 ? -1 : p.size + 1; this.clicks++; game.sfx('fold');
      this.solve();
      if (this.solved) { game.sfx('chime'); this.pops.add('Tick tock! It works!', 160, 40, C.gold); }
      else if (this.jammed) this.pops.add('Jammed! Too close.', p.x, p.y - 22, C.coral);
    }
    if (input.pressed.has('x')) { this.pegs.forEach((p) => { p.size = -1; }); this.solve(); }
  }
  finish() {
    this.done = true;
    const raw = (this.scores.reduce((a, b) => a + b, 0) / this.puzzles) * timeScore(this.t, this.puzzles * 25, this.puzzles * 40);
    this.score = clamp(this.tired ? Math.min(raw, 0.7) : raw, 0, 1);
    this.result = { text: `${this.puzzles} clocks ticking again` };
  }
  gear(g, x, y, r, rot, ramp, live, jam) {
    const teeth = Math.max(6, Math.round(r * 0.75)), col = jam ? RAMPS.coral : ramp;
    for (let i = 0; i < teeth; i++) { const a = rot + (i / teeth) * Math.PI * 2; rect(g, col[1], Math.round(x + Math.cos(a) * (r - 0.5)) - 2, Math.round(y + Math.sin(a) * (r - 0.5)) - 2, 4, 4); }
    disc(g, col[1], x, y, r - 1); disc(g, col[2], x, y, r - 2); ring(g, col[3], x - 1, y - 1, r - 3, 1);
    disc(g, col[1], x, y, Math.max(2, Math.floor(r / 3))); disc(g, col[4], x - 1, y - 1, 1);
    for (let k = 0; k < 3; k++) { const a = rot + k * 2.09; rect(g, col[1], Math.round(x + Math.cos(a) * r * 0.55), Math.round(y + Math.sin(a) * r * 0.55), 2, 2); }
    void live;
  }
  draw(g) {
    rect(g, RAMPS.woodDark[1], 0, 19, 320, 194);
    const [bx, by, bw, bh] = BOARD;
    rect(g, RAMPS.forest[0], bx, by, bw, bh); rect(g, RAMPS.forest[1], bx + 2, by + 2, bw - 4, bh - 4);
    for (let x = bx + 10; x < bx + bw; x += 16) for (let y = by + 10; y < by + bh; y += 16) rect(g, RAMPS.forest[0], x, y, 1, 1);
    // lamp glow
    disc(g, 'rgba(255,240,180,0.06)', 160, 40, 90);
    for (const p of this.pegs) { disc(g, RAMPS.woodDark[0], p.x, p.y + 1, 3); disc(g, RAMPS.metal[2], p.x, p.y, 2); }
    for (const gg of this.live) {
      const spin = gg.on && !this.jammed ? this.rot * gg.dir * (12 / gg.r) : 0;
      if (gg.kind === 'driver') { this.gear(g, gg.x, gg.y, gg.r, spin, RAMPS.metal, true, false); drawTextC(g, 'Motor', gg.x, gg.y + gg.r + 4, RAMPS.metal[4], 1, null); }
      else if (gg.kind === 'target') {
        this.gear(g, gg.x, gg.y, gg.r, spin, RAMPS.coral, gg.on, false);
        const cx = gg.x + gg.r + 26, cy = gg.y;
        disc(g, RAMPS.woodDark[2], cx, cy, 20); disc(g, '#fffaf0', cx, cy, 17);
        for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; rect(g, C.ink, Math.round(cx + Math.cos(a) * 14), Math.round(cy + Math.sin(a) * 14), 1, 1); }
        const ha = (gg.on && !this.jammed ? this.rot * 0.3 : 0) - Math.PI / 2, ma = (gg.on && !this.jammed ? this.rot * 3 : 1) - Math.PI / 2;
        for (let k = 0; k < 8; k++) rect(g, C.ink, Math.round(cx + Math.cos(ha) * k), Math.round(cy + Math.sin(ha) * k), 1, 1);
        for (let k = 0; k < 13; k++) rect(g, C.coralD, Math.round(cx + Math.cos(ma) * k), Math.round(cy + Math.sin(ma) * k), 1, 1);
        disc(g, C.ink, cx, cy, 1);
      } else this.gear(g, gg.x, gg.y, gg.r, spin, RAMPS.butter, gg.on, gg.jam);
    }
    for (const b of this.btns.list) if (this.btns.isFocus(b.id) && !this.solved) { const p = this.pegs[b.i], r = p.size >= 0 ? RAD[p.size] + 4 : 8; ring(g, C.gold, p.x, p.y, r, 1); }
    this.pops.draw(g);
    hint(g, 'Click a peg to cycle gear sizes. Connect the motor to the clock!  X: clear');
    topBar(g, 'Wren\'s Clocks repair bench', `Clock ${Math.min(this.puzzles, this.n + 1)}/${this.puzzles}`, this.n / this.puzzles);
  }
}
export function clockBot(m, t, input) {
  if ((m._bt = (m._bt || 0) - 1) > 0) return input;
  m._bt = 7;
  const i = m.pegs.findIndex((p) => p.size !== p.sol);
  if (i < 0 || m.solved) return input;
  return clickBtn(input, m.btns.get('peg' + i));
}

// =============================================================== FISH MARKET SORTING
const KINDS = [
  { name: 'Mackerel', body: RAMPS.sky, stripe: RAMPS.navy[1] }, { name: 'Sea bream', body: RAMPS.coral, stripe: RAMPS.coral[4] },
  { name: 'Flounder', body: RAMPS.sand, stripe: RAMPS.dirt[1] }, { name: 'Squid', body: { 0: '#c8b8c8', 1: '#e8d8e0', 2: '#fff0f4', 3: '#fffaf0', 4: '#ffffff' }, stripe: RAMPS.hairPink[2] },
];
export class FishShift {
  constructor(game, { rank = 1, tired = false } = {}) {
    Object.assign(this, { game, rng: game.rng, rank: clamp(rank, 1, 5), tired, t: 0, done: false, score: 0, btns: new Buttons(), pops: new Pops(), fish: [], flying: [], spawnT: 0.4, hits: 0, misses: 0, sent: 0 });
    this.kinds = this.rank >= 3 ? 3 : 2; this.total = 10 + this.rank * 2; this.speed = 30 + this.rank * 6;
    this.crates = []; for (let k = 0; k < this.kinds; k++) for (let s = 0; s < 2; s++) this.crates.push({ k, s });
    const w = Math.floor(300 / this.crates.length);
    this.btns.set(this.crates.map((c, i) => ({ id: 'crate' + i, x: 10 + i * w, y: 150, w: w - 4, h: 50, i })));
    this.counts = this.crates.map(() => 0); this.bin = 0;
  }
  get front() { return this.fish.filter((f) => !f.gone).sort((a, b) => b.x - a.x)[0]; }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt; this.pops.update(dt);
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.sent < this.total) { this.fish.push({ x: -20, k: Math.floor(this.rng() * this.kinds), s: this.rng() < 0.5 ? 0 : 1, wig: this.rng() * 6 }); this.sent++; this.spawnT = Math.max(1.1, 2.6 - this.rank * 0.25) * (0.8 + this.rng() * 0.4); }
    for (const f of this.fish) if (!f.gone) { f.x += this.speed * dt; if (f.x > 300) { f.gone = true; this.misses++; this.bin++; this.pops.add('To the check-later bin', 250, 80, C.sky); game.sfx('splash'); } }
    for (const fl of this.flying) fl.t += dt * 2.2;
    this.flying = this.flying.filter((fl) => fl.t < 1);
    let hit = this.btns.update(input);
    for (let i = 0; i < this.crates.length; i++) if (input.pressed.has(String(i + 1))) hit = 'crate' + i;
    if (hit && this.front) {
      const i = this.btns.get(hit).i, f = this.front, c = this.crates[i], b = this.btns.get(hit);
      f.gone = true; this.flying.push({ f, x0: f.x, y0: 104, x1: b.x + b.w / 2, y1: b.y + 20, t: 0 });
      if (c.k === f.k && c.s === f.s) { this.hits++; this.counts[i]++; game.sfx('pop'); this.pops.add('Nice!', b.x + b.w / 2, b.y - 6, C.gold); }
      else { this.misses++; this.counts[i]++; game.sfx('wrong'); this.pops.add(`That was a ${f.s ? 'big' : 'small'} ${KINDS[f.k].name.toLowerCase()}`, b.x + b.w / 2, b.y - 6, C.sky); }
    }
    if (this.sent >= this.total && this.fish.every((f) => f.gone) && !this.flying.length) {
      this.done = true;
      const raw = this.hits / this.total;
      this.score = clamp(this.tired ? Math.min(raw, 0.7) : raw, 0, 1);
      this.result = { text: `${this.hits} of ${this.total} fish sorted right` };
    }
  }
  drawFish(g, x, y, k, s, t) {
    const K = KINDS[k], rx = s ? 15 : 9, ry = s ? 6 : 4, b = K.body, wig = Math.round(Math.sin(t * 8) * 1);
    if (K.name === 'Squid') {
      disc(g, b[1], x, y, ry + 1); rect(g, b[2], x - rx, y - ry, rx + 2, ry * 2); rect(g, b[3], x - rx + 1, y - ry + 1, rx, 2);
      for (let i = 0; i < 4; i++) rect(g, b[1], x + 2, y - ry + 1 + i * Math.max(2, Math.floor(ry / 2)), rx - 2 + ((i + wig) % 2) * 2, 1);
      rect(g, C.ink, x - 2, y - 1, 1, 1); rect(g, K.stripe, x - rx + 2, y - 1, 3, 2); return;
    }
    rect(g, b[1], x + rx - 2, y - ry + wig, 5, ry * 2 - 1); rect(g, b[2], x + rx, y - ry + 1 + wig, 3, ry * 2 - 3);
    for (let yy = -ry; yy <= ry; yy++) { const w = Math.floor(rx * Math.sqrt(1 - (yy * yy) / (ry * ry))); rect(g, yy < 0 ? b[3] : yy > ry / 2 ? b[1] : b[2], x - w, y + yy, w * 2 + 1, 1); }
    if (K.name === 'Mackerel') for (let i = -rx + 3; i < rx - 2; i += 3) rect(g, K.stripe, x + i, y - ry + 1, 1, ry);
    if (K.name === 'Sea bream') rect(g, b[4], x - rx + 3, y - ry + 1, rx, 1);
    if (K.name === 'Flounder') for (let i = 0; i < 3; i++) rect(g, K.stripe, x - rx / 2 + i * 4, y - 1 + (i % 2), 2, 2);
    rect(g, '#fffaf0', x - rx + 2, y - 2, 2, 2); rect(g, C.ink, x - rx + 2, y - 1, 1, 1);
  }
  draw(g) {
    rect(g, RAMPS.sky[3], 0, 19, 320, 60); rect(g, RAMPS.water[2], 0, 62, 320, 20);
    for (let x = (Math.floor(this.t * 10) % 16) - 16; x < 320; x += 16) rect(g, RAMPS.water[4], x, 66 + ((x / 16) % 2), 6, 1);
    rect(g, RAMPS.wood[2], 0, 80, 320, 70); for (let y = 84; y < 150; y += 8) rect(g, RAMPS.wood[1], 0, y, 320, 1);
    // conveyor
    rect(g, RAMPS.metal[1], 0, 92, 300, 26); rect(g, RAMPS.charcoal[2], 0, 95, 300, 20);
    for (let x = (Math.floor(this.t * this.speed) % 12) - 12; x < 300; x += 12) rect(g, RAMPS.charcoal[3], x, 95, 2, 20);
    rect(g, RAMPS.metal[3], 300, 90, 6, 30);
    // check-later bin
    rect(g, RAMPS.sky[1], 296, 120, 22, 24); rect(g, RAMPS.sky[2], 298, 122, 18, 6); drawText(g, String(this.bin), 304, 132, C.text, 1, null);
    for (const f of this.fish) if (!f.gone) this.drawFish(g, Math.round(f.x), 105, f.k, f.s, this.t + f.wig);
    const fr = this.front;
    if (fr) { const rx = fr.s ? 16 : 10; rect(g, C.gold, Math.round(fr.x) - rx, 88, rx * 2 + 4, 2); drawTextC(g, 'v', Math.round(fr.x), 82, C.gold, 1, null); }
    // crates
    rect(g, RAMPS.paper[2], 0, 146, 320, 67);
    this.crates.forEach((c, i) => {
      const b = this.btns.get('crate' + i), on = this.btns.isFocus(b.id);
      rect(g, RAMPS.wood[1], b.x, b.y + 14, b.w, 36); rect(g, RAMPS.wood[3], b.x + 2, b.y + 16, b.w - 4, 32); rect(g, RAMPS.wood[1], b.x + 2, b.y + 30, b.w - 4, 2);
      for (let k = 0; k < Math.min(4, this.counts[i]); k++) this.drawFish(g, b.x + b.w / 2 - 6 + (k % 2) * 8, b.y + 24 - (k >> 1) * 4, c.k, 0, 0);
      panel(g, b.x, b.y, b.w, 14, on ? { ink: C.gold, fill: RAMPS.butter[3], hi: '#ffffff', lo: C.paper2, shadow: 'rgba(30,22,36,.4)' } : 'card');
      const lbl = `${i + 1}  ${c.s ? 'Big' : 'Small'}`;
      drawTextC(g, lbl, b.x + b.w / 2, b.y + 4, C.ink, 1, null);
      this.drawFish(g, b.x + b.w / 2, b.y + 42, c.k, c.s, 0);
    });
    for (const fl of this.flying) { const p = fl.t, x = fl.x0 + (fl.x1 - fl.x0) * p, y = fl.y0 + (fl.y1 - fl.y0) * p - Math.sin(p * Math.PI) * 30; this.drawFish(g, Math.round(x), Math.round(y), fl.f.k, fl.f.s, 0); }
    this.pops.draw(g);
    hint(g, 'Send the marked fish to its crate: click it or press its number');
    topBar(g, 'Fish market sorting', `${this.hits} sorted`, (this.hits + this.misses) / this.total);
  }
}
export function fishBot(m, t, input) {
  const f = m.front;
  if (!f || f.x < 60) return input;
  if ((m._bt = (m._bt || 0) - 1) > 0) return input;
  m._bt = 6;
  const i = m.crates.findIndex((c) => c.k === f.k && c.s === f.s);
  return clickBtn(input, m.btns.get('crate' + i));
}
void btn; void measure;
