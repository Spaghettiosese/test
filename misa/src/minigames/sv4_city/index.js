// Kitaminato minigames (all have bots): kc_spree (timed shopping spree / vendor stocking), kc_claw (claw machine, 5 tries), kc_feed (aquarium
// feeding show), kc_flash (flash mob rhythm), kc_shift (bookshop shelving shift). Controls: arrows or WASD and E/Space; pointer works where noted.
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { W, H, rect, disc, clamp, hash, ePressed, botIn } from '../sv2_play/kit.js';

const pressedAny = (input, ...ks) => ks.some((k) => input.pressed.has(k));
const LEFT = ['arrowleft', 'a'], RIGHT = ['arrowright', 'd'], UP = ['arrowup', 'w'], DOWN = ['arrowdown', 's'];
const frameBg = (g, title, c = '#241a3a') => { rect(g, c, 0, 0, W, H); rect(g, '#1a1228', 0, 0, W, 18); rect(g, K.lilac[1], 0, 17, W, 1); drawText(g, title, 6, 5, K.butter[3], 1, null); };
const timeBar = (g, f, y = 20) => { rect(g, K.charcoal[2], 6, y, W - 12, 5); rect(g, f > 0.25 ? K.mint[2] : K.coral[2], 6, y, Math.round((W - 12) * clamp(f, 0, 1)), 5); };
const COLORS = [K.coral[2], K.sky[3], K.butter[3], K.mint[3], K.lilac[3], K.forest[3], K.wood[3], K.paper[4]];

// ---------------------------------------------------------------- shopping spree
class Spree {
  constructor(game, opts) {
    this.r = game.rngFor('kcspree' + game.minutes); this.vendor = opts.mode === 'vendor'; this.limit = this.vendor ? 38 : 42; this.t = 0; this.cx = 0; this.cy = 0; this.done = false; this.score = 0;
    this.targets = []; while (this.targets.length < 5) { const k = Math.floor(this.r() * 8); if (!this.targets.includes(k)) this.targets.push(k); }
    this.got = []; this.wrong = 0; this.deal();
  }
  deal() { this.grid = Array.from({ length: 18 }, () => Math.floor(this.r() * 8)); this.targets.filter((x) => !this.got.includes(x)).forEach((k, i) => { this.grid[(i * 7 + Math.floor(this.r() * 5)) % 18] = k; }); }
  pick(i) {
    const k = this.grid[i];
    if (this.targets.includes(k) && !this.got.includes(k)) { this.got.push(k); this.deal(); } else { this.wrong++; this.t += 3; }
    if (this.got.length >= 5) this.end();
  }
  end() { this.done = true; this.score = clamp(this.got.length / 5 - this.wrong * 0.04, 0, 1); this.result = { text: `${this.got.length} of 5 items, ${this.wrong} mistakes` }; }
  update(dt, input) {
    if (this.done) return; this.t += dt;
    if (pressedAny(input, ...LEFT)) this.cx = (this.cx + 5) % 6; if (pressedAny(input, ...RIGHT)) this.cx = (this.cx + 1) % 6; if (pressedAny(input, ...UP)) this.cy = (this.cy + 2) % 3; if (pressedAny(input, ...DOWN)) this.cy = (this.cy + 1) % 3;
    if (input.justDown) { const cx = Math.floor((input.mx - 20) / 46), cy = Math.floor((input.my - 70) / 46); if (cx >= 0 && cx < 6 && cy >= 0 && cy < 3) { this.cx = cx; this.cy = cy; this.pick(cy * 6 + cx); } } else if (ePressed(input)) this.pick(this.cy * 6 + this.cx);
    if (this.t >= this.limit) this.end();
  }
  finish() { this.end(); }
  draw(g) {
    frameBg(g, this.vendor ? 'STOCK THE STALL' : 'SHOPPING SPREE'); timeBar(g, 1 - this.t / this.limit);
    drawText(g, 'FIND:', 8, 32, K.paper[3], 1, null);
    this.targets.forEach((k, i) => { rect(g, '#000', 48 + i * 30, 28, 24, 18); rect(g, this.got.includes(k) ? K.charcoal[2] : COLORS[k], 50 + i * 30, 30, 20, 14); if (this.got.includes(k)) drawText(g, 'OK', 54 + i * 30, 34, K.mint[3], 1, null); });
    this.grid.forEach((k, i) => { const x = 20 + (i % 6) * 46, y = 70 + Math.floor(i / 6) * 46, sel = i === this.cy * 6 + this.cx; rect(g, sel ? K.butter[3] : K.lilac[1], x - 2, y - 2, 44, 44); rect(g, '#33264a', x, y, 40, 40); if (k % 2) disc(g, x + 20, y + 20, 13, COLORS[k]); else rect(g, COLORS[k], x + 7, y + 7, 26, 26); rect(g, K.paper[4], x + 11, y + 11, 5, 3); });
    drawText(g, `MISTAKES ${this.wrong}`, 8, 212, K.coral[3], 1, null);
  }
}
register('minigame', 'kc_spree', { title: 'Shopping Spree', make: (game, opts) => new Spree(game, opts || {}), bot: (m, t) => {
  const want = m.grid.findIndex((k) => m.targets.includes(k) && !m.got.includes(k)); if (want < 0) return botIn();
  const wx = want % 6, wy = Math.floor(want / 6);
  if (m.cx !== wx) return botIn([], [(wx - m.cx + 6) % 6 <= 3 ? 'arrowright' : 'arrowleft']);
  if (m.cy !== wy) return botIn([], [(wy - m.cy + 3) % 3 === 1 ? 'arrowdown' : 'arrowup']);
  return t % 0.05 < 0.017 ? botIn([], ['e']) : botIn([], ['e']);
} });

// ---------------------------------------------------------------- claw machine
class Claw {
  constructor(game) { this.r = game.rngFor('kcclaw' + game.minutes); this.x = 60; this.t = 0; this.tries = 5; this.phase = 'aim'; this.ph = 0; this.won = 0; this.done = false; this.score = 0; this.prizes = [0, 1, 2].map((i) => ({ x: 50 + i * 90 + Math.floor(this.r() * 50), k: Math.floor(this.r() * 8), taken: false })); this.grab = null; }
  update(dt, input) {
    if (this.done) return; this.t += dt;
    if (this.phase === 'aim') { this.x = 160 + Math.sin(this.t * 1.7) * 130; if (ePressed(input) || input.justDown) { this.phase = 'drop'; this.ph = 0; this.tries--; } }
    else if (this.phase === 'drop') { this.ph += dt; if (this.ph > 0.7) { this.grab = this.prizes.find((p) => !p.taken && Math.abs(p.x - this.x) < 13); if (this.grab && this.r() < 0.85) { this.grab.taken = true; this.won++; } this.phase = 'rise'; this.ph = 0; } }
    else if (this.phase === 'rise') { this.ph += dt; if (this.ph > 0.6) { this.grab = null; if (this.tries <= 0 || this.won >= 3) { this.done = true; this.score = clamp(this.won / 3, 0, 1); this.result = { text: `${this.won} prizes` }; } else this.phase = 'aim'; } }
  }
  finish() { this.done = true; this.score = clamp(this.won / 3, 0, 1); }
  draw(g) {
    frameBg(g, 'CLAW MACHINE', '#2a1a40'); rect(g, K.coral[1], 20, 30, 280, 170); rect(g, '#1a1030', 28, 38, 264, 150);
    drawText(g, `TRIES ${this.tries}  WON ${this.won}`, 8, 5 + 0, K.paper[4], 1, null);
    for (const p of this.prizes) if (!p.taken) { disc(g, p.x, 170, 14, COLORS[p.k]); rect(g, K.paper[4], p.x - 6, 165, 3, 3); rect(g, K.paper[4], p.x + 3, 165, 3, 3); }
    const dy = this.phase === 'drop' ? this.ph / 0.7 : this.phase === 'rise' ? 1 - this.ph / 0.6 : 0, y = 50 + dy * 90;
    rect(g, K.metal[3], this.x - 1, 38, 2, y - 38); rect(g, K.metal[4], this.x - 10, y, 20, 5); rect(g, K.metal[3], this.x - 12, y + 5, 3, 12); rect(g, K.metal[3], this.x + 9, y + 5, 3, 12);
    if (this.grab) disc(g, this.x, y + 20, 10, COLORS[this.grab.k]);
  }
}
register('minigame', 'kc_claw', { title: 'Claw Machine', make: (game) => new Claw(game), bot: (m) => {
  const p = m.prizes.find((q) => !q.taken); return m.phase === 'aim' && p && Math.abs(p.x - m.x) < 6 ? botIn([], ['e']) : botIn();
} });

// ---------------------------------------------------------------- aquarium feeding show
class Feed {
  constructor(game) {
    this.r = game.rngFor('kcfeed' + game.minutes); this.t = 0; this.limit = 42; this.fx = 160; this.cool = 0; this.pellets = []; this.done = false; this.score = 0;
    this.fish = Array.from({ length: 6 }, (_, i) => ({ x: 40 + this.r() * 240, y: 80 + (i % 3) * 36 + this.r() * 12, vx: (i % 2 ? 1 : -1) * (24 + this.r() * 20), big: i >= 4, fed: 0, c: [K.coral, K.butter, K.mint, K.sky, K.navy, K.lilac][i] }));
  }
  end() { this.done = true; const f = this.fish.filter((q) => !q.big).reduce((a, q) => a + Math.min(3, q.fed), 0); this.score = clamp(f / 12, 0, 1); this.result = { text: `${f} of 12 meals for the little fish` }; }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.cool -= dt;
    const dx = (pressedAny({ pressed: input.keys }, ...RIGHT) ? 1 : 0) - (pressedAny({ pressed: input.keys }, ...LEFT) ? 1 : 0); this.fx = clamp(this.fx + dx * 150 * dt, 24, 296);
    if (input.moved || input.down) this.fx = clamp(input.mx, 24, 296);
    if ((ePressed(input) || input.justDown) && this.cool <= 0) { this.pellets.push({ x: this.fx, y: 34 }); this.cool = 0.22; }
    for (const q of this.fish) { q.x += q.vx * dt; if (q.x < 24 || q.x > 296) q.vx = -q.vx; q.y += Math.sin(this.t * 1.3 + q.x * 0.02) * 6 * dt; }
    for (const p of this.pellets) { p.y += 60 * dt; const eater = this.fish.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < (q.big ? 16 : 12)).sort((a, b) => (b.big ? 1 : 0) - (a.big ? 1 : 0))[0]; if (eater) { eater.fed++; p.y = 999; } }
    this.pellets = this.pellets.filter((p) => p.y < 190);
    if (this.t >= this.limit || this.fish.filter((q) => !q.big).every((q) => q.fed >= 3)) this.end();
  }
  finish() { this.end(); }
  draw(g) {
    frameBg(g, 'FEEDING SHOW', '#0e2a4a'); rect(g, K.sky[1], 12, 28, 296, 176); rect(g, K.sky[2], 14, 30, 292, 172); rect(g, K.butter[1], 14, 192, 292, 10); timeBar(g, 1 - this.t / this.limit);
    rect(g, K.metal[3], this.fx - 8, 26, 16, 6); rect(g, K.metal[4], this.fx - 3, 30, 6, 4);
    for (const p of this.pellets) rect(g, K.wood[3], p.x - 1, p.y, 3, 3);
    for (const q of this.fish) { const w = q.big ? 22 : 12; disc(g, q.x, q.y, w / 2, q.c[2], w / 3); rect(g, q.c[3], q.x - 3, q.y - 2, 6, 2); const d = q.vx > 0 ? 1 : -1; rect(g, q.c[1], q.x - d * (w / 2 + 3), q.y - 3, 4, 6); rect(g, '#000', q.x + d * 3, q.y - 2, 2, 2); if (!q.big) for (let i = 0; i < 3; i++) rect(g, i < q.fed ? K.butter[3] : K.charcoal[2], q.x - 7 + i * 5, q.y - 12, 4, 3); }
    drawText(g, 'LITTLE FISH NEED 3 MEALS. BIG ONES STEAL!', 20, 210, K.paper[3], 1, null);
  }
}
register('minigame', 'kc_feed', { title: 'Feeding Show', make: (game) => new Feed(game), bot: (m) => {
  const t = m.fish.filter((q) => !q.big && q.fed < 3).sort((a, b) => a.fed - b.fed)[0]; if (!t) return botIn();
  const aim = clamp(t.x + t.vx * (t.y - 34) / 60, 24, 296), keys = Math.abs(aim - m.fx) < 5 ? [] : [aim > m.fx ? 'arrowright' : 'arrowleft'];
  return botIn(keys, Math.abs(aim - m.fx) < 9 && m.cool <= 0 ? ['e'] : []);
} });

// ---------------------------------------------------------------- flash mob rhythm
const LANES = [['arrowleft', 'a'], ['arrowdown', 's'], ['arrowup', 'w'], ['arrowright', 'd']], ARROW = ['<', 'v', '^', '>'];
class Flash {
  constructor(game, opts) { this.r = game.rngFor('kcflash' + game.minutes); this.t = -1; this.n = 24; this.notes = Array.from({ length: this.n }, (_, i) => ({ lane: Math.floor(this.r() * 4), at: 1 + i * 0.55, hit: false, miss: false })); this.hits = 0; this.done = false; this.score = 0; this.flash = [0, 0, 0, 0]; void opts; }
  y(n) { return 180 - (n.at - this.t) * 110; }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash = this.flash.map((v) => Math.max(0, v - dt * 4));
    LANES.forEach((ks, l) => { if (pressedAny(input, ...ks)) { this.flash[l] = 1; const n = this.notes.find((q) => !q.hit && !q.miss && q.lane === l && Math.abs(this.y(q) - 180) < 16); if (n) { n.hit = true; this.hits++; } } });
    for (const n of this.notes) if (!n.hit && !n.miss && this.y(n) > 204) n.miss = true;
    if (this.notes.every((n) => n.hit || n.miss)) { this.done = true; this.score = clamp(this.hits / this.n, 0, 1); this.result = { text: `${this.hits} of ${this.n} steps` }; }
  }
  finish() { this.done = true; this.score = clamp(this.hits / this.n, 0, 1); }
  draw(g) {
    frameBg(g, 'FLASH MOB', '#2a1a40'); drawText(g, `${this.hits}/${this.n}`, 270, 5, K.mint[3], 1, null);
    for (let l = 0; l < 4; l++) { const x = 70 + l * 52; rect(g, '#33264a', x, 24, 44, 190); rect(g, this.flash[l] > 0 ? K.butter[3] : K.lilac[1], x, 174, 44, 12); drawTextC(g, ARROW[l], x + 22, 176, K.ink[1], 1, null); }
    for (const n of this.notes) if (!n.hit && !n.miss) { const y = this.y(n); if (y > 20 && y < 214) { rect(g, COLORS[n.lane], 74 + n.lane * 52, y - 5, 36, 12); drawTextC(g, ARROW[n.lane], 92 + n.lane * 52, y - 3, K.ink[1], 1, null); } }
    for (let i = 0; i < 6; i++) { const bob = Math.abs(Math.sin(this.t * 6 + i)) * 6; rect(g, COLORS[i], 14 + (i % 2) * 14, 60 + i * 24 - bob, 10, 14); disc(g, 19 + (i % 2) * 14, 56 + i * 24 - bob, 5, K.skinLight[3]); }
  }
}
register('minigame', 'kc_flash', { title: 'Flash Mob', make: (game, opts) => new Flash(game, opts || {}), bot: (m) => {
  const n = m.notes.find((q) => !q.hit && !q.miss && Math.abs(m.y(q) - 180) < 4); return n ? botIn([], [LANES[n.lane][0]]) : botIn();
} });

// ---------------------------------------------------------------- bookshop shift
class Shift {
  constructor(game, opts) { this.r = game.rngFor('kcshift' + game.minutes); this.rank = (opts && opts.rank) || 1; this.per = Math.max(1.3, 2.6 - this.rank * 0.25) * (opts && opts.tired ? 1.2 : 1); this.i = 0; this.n = 14; this.t = 0; this.ok = 0; this.bad = 0; this.cur = Math.floor(this.r() * 3); this.flash = 0; this.done = false; this.score = 0; }
  next() { this.i++; this.t = 0; this.cur = Math.floor(this.r() * 3); if (this.i >= this.n) { this.done = true; this.score = clamp(this.ok / this.n, 0, 1); this.result = { text: `${this.ok} of ${this.n} books shelved` }; } }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash = Math.max(0, this.flash - dt * 3);
    const keys = [LEFT, DOWN, RIGHT]; let pick = -1; keys.forEach((ks, k) => { if (pressedAny(input, ...ks)) pick = k; });
    if (pick >= 0) { if (pick === this.cur) { this.ok++; this.flash = 1; } else this.bad++; this.next(); } else if (this.t > this.per) { this.bad++; this.next(); }
  }
  finish() { this.done = true; this.score = clamp(this.ok / this.n, 0, 1); }
  draw(g) {
    frameBg(g, 'BOOKSHOP SHIFT', '#2a2230'); timeBar(g, 1 - this.t / this.per); drawText(g, `${this.i}/${this.n}`, 280, 5, K.paper[4], 1, null);
    ['ROMANCE', 'MYSTERY', 'TRAVEL'].forEach((n, k) => { const x = 20 + k * 100; rect(g, K.wood[2], x, 130, 90, 60); rect(g, [K.coral, K.navy, K.mint][k][2], x + 4, 134, 82, 12); drawTextC(g, n, x + 45, 150, K.paper[4], 1, null); for (let b = 0; b < 6; b++) rect(g, COLORS[(b + k * 2) % 8], x + 6 + b * 13, 162, 10, 24); });
    rect(g, [K.coral, K.navy, K.mint][this.cur][2], 130, 50, 60, 40); rect(g, K.paper[4], 134, 56, 52, 4); rect(g, K.paper[3], 134, 64, 38, 3); drawTextC(g, 'WHICH SHELF?', 160, 96, K.paper[3], 1, null);
    drawTextC(g, 'LEFT / DOWN / RIGHT', 160, 205, K.dim || K.paper[2], 1, null);
  }
}
register('minigame', 'kc_shift', { title: 'Bookshop Shift', make: (game, opts) => new Shift(game, opts || {}), bot: (m) => botIn([], [['arrowleft', 'arrowdown', 'arrowright'][m.cur]]) });
void hash;
