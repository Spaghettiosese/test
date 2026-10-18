// Seto Islands minigames (320x224, drawn 1:1). All have bots so the tests play them to the end.
//   sv4_auction  Tsubame fishery auction: a price clock falls; claim a lot below its value before the old buyer does. Space / tap.
//   sv4_volley   Beach volleyball against Lani's bot: arrows move, Space jumps and hits. First to 5.
//   sv4_dive     Snorkel in the lagoon: swim with arrows, Space takes a photo of whatever is in the frame. Oxygen refills at the surface.
//   sv4_regatta  Boat race: left/right steer through gates, ride the gusts; three rivals.
//   sv4_chest    Sunken chest lock: stop three rings in their gap with Space.
//   sv4_gears    Observatory gears: left/right pick a gear, up/down turn it (the next gear turns back). Align all four.
//   sv4_haul     Deckhand / fishery shift: press the arrow shown before the timer runs out.
import { register } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { act } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { mulberry32, clamp } from '../../rng.js';
import { sfx } from '../../audio.js';
import { REEF } from '../../content/sv4_islands/data.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
const hud = (g, title, bottom, right) => {
  rect(g, '#2b1d2ee0', 0, 0, 320, 14); drawText(g, title, 6, 4, K.butter[3]); if (right) drawText(g, right, 314 - right.length * 4, 4, K.paper[4]);
  if (bottom) { rect(g, '#2b1d2ec0', 0, 212, 320, 12); drawTextC(g, bottom, 160, 215, K.paper[3], 1, null); }
};
const rngOf = (game, tag, extra = 0) => (game && game.rngFor ? game.rngFor(tag + (game.day || 0) + extra) : mulberry32(17 + extra));
const key = (i, ...ks) => ks.some((k) => i.keys.has(k));
const hit = (i, ...ks) => ks.some((k) => i.pressed.has(k));
const sea = (g, t, y0 = 70) => {
  rect(g, K.sky[4], 0, 0, 320, y0); rect(g, K.sky[3], 0, 30, 320, y0 - 30);
  rect(g, K.water[3], 0, y0, 320, 154); rect(g, K.water[2], 0, y0 + 60, 320, 94);
  for (let i = 0; i < 40; i++) rect(g, K.water[4], (i * 47 + t * 14) % 330 - 5, y0 + 4 + (i * 29) % 150, 4, 1);
};

// =================================================================== AUCTION
const FISH_LOTS = [['Bluefin tuna', 260], ['Sea bream', 140], ['Squid crate', 90], ['Mackerel box', 70], ['Red snapper', 120], ['Octopus', 150], ['Amberjack', 190], ['Sardine tray', 50]];
export class AuctionGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'auc', opts.salt || 0); this.r = r;
    this.lots = Array.from({ length: opts.lots || 6 }, (_, i) => { const [name, v] = FISH_LOTS[Math.floor(r() * FISH_LOTS.length)]; return { name, value: Math.round(v * (0.85 + r() * 0.35)), rival: 0.74 + r() * 0.2, res: null, price: 0 }; });
    Object.assign(this, { i: 0, t: 0, price: 0, wait: 1, done: false, score: 0, profit: 0, claimed: 0, wins: 0, msg: '', msgT: 0, skill: opts.skill || 0 });
    this.begin();
  }
  get lot() { return this.lots[this.i]; }
  begin() { this.price = Math.round(this.lot.value * 1.7); this.wait = 1.0; this.sold = null; }
  claim(who) {
    const lot = this.lot; lot.res = who; lot.price = Math.round(this.price);
    if (who === 'you') { const p = lot.value - lot.price; this.profit += p; this.claimed++; if (p > 0) this.wins++; this.msg = p >= 0 ? `Yours for ${lot.price}: profit ${p}` : `Overpaid! ${p}`; sfx(p >= 0 ? 'coin' : 'blip'); }
    else { this.msg = `The old buyer snaps it up at ${lot.price}`; sfx('blip'); }
    this.msgT = 1.3; this.sold = who; this.wait = 1.4;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt);
    if (this.sold) {
      if ((this.wait -= dt) <= 0) { if (++this.i >= this.lots.length) { this.finish(); return; } this.begin(); }
      return;
    }
    if ((this.wait -= dt) > 0) return;
    this.price -= this.lot.value * 0.34 * dt;
    if (act(input)) this.claim('you');
    else if (this.price <= this.lot.value * this.lot.rival) this.claim('rival');
    else if (this.price < this.lot.value * 0.3) this.claim('rival');
  }
  finish() {
    this.done = true;
    const max = this.lots.reduce((a, l) => a + l.value * 0.3, 0);
    this.score = clamp(this.profit / max, 0, 1);
    this.result = { text: `Profit ${this.profit} coins on ${this.claimed} lots`, profit: this.profit, wins: this.wins, claimed: this.claimed };
    sfx('levelup');
  }
  draw(g) {
    rect(g, K.sky[3], 0, 0, 320, 224); rect(g, K.wood[3], 0, 130, 320, 94); for (let x = 0; x < 320; x += 20) rect(g, K.wood[2], x, 130, 1, 94);
    rect(g, K.sky[1], 0, 100, 320, 30);
    const lot = this.lot;
    rect(g, K.paper[4], 100, 40, 120, 76); rect(g, K.ink[2], 100, 40, 120, 2);
    drawTextC(g, `LOT ${this.i + 1} OF ${this.lots.length}`, 160, 48, K.ink[2], 1, null);
    drawTextC(g, lot.name.toUpperCase(), 160, 62, K.navy[1], 1, null);
    drawTextC(g, `WORTH ABOUT ${lot.value}`, 160, 76, K.wood[1], 1, null);
    drawTextC(g, String(Math.max(0, Math.round(this.price))), 160, 92, this.sold ? K.coral[1] : K.ribbon[2], 3);
    for (let i = 0; i < 4; i++) { rect(g, K.wood[1], 30 + i * 70, 150, 40, 40); rect(g, K.sky[2 + (i % 2)], 34 + i * 70, 154, 32, 32); }
    rect(g, K.butter[2], 252, 142, 30, 36); rect(g, K.paper[3], 258, 146, 18, 14); drawText(g, 'OLD', 258, 164, K.ink[2]);
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 120, K.ink[1], 1, null);
    hud(g, 'FISHERY AUCTION', 'Press Space to claim a lot as the price falls. Beat the old buyer!', `PROFIT ${this.profit}`);
  }
}
register('minigame', 'sv4_auction', {
  title: 'Fishery auction', resultTitle: 'SOLD!', music: 'cafe',
  make: (game, o) => new AuctionGame(game, o || {}),
  bot(m, t, i) { if (!m.sold && m.wait <= 0 && m.price <= m.lot.value * 0.97) i.pressed = new Set([' ']); return i; },
});

// =================================================================== VOLLEYBALL
const NETX = 160, FLOOR = 168, GRAV = 420;
export class VolleyGame {
  constructor(game, opts = {}) {
    this.r = rngOf(game, 'volley', opts.salt || 0);
    Object.assign(this, { px: 70, py: FLOOR, pvy: 0, ox: 250, oy: FLOOR, ovy: 0, ball: { x: 90, y: 60, vx: 0, vy: 0 }, ps: 0, os: 0, t: 0, done: false, score: 0, serve: 'you', pause: 1, msg: '', goal: opts.goal || 5, limit: opts.limit || 90, rally: 0, best: 0 });
    this.reset('you');
  }
  reset(side) { this.ball = { x: side === 'you' ? 80 : 240, y: 70, vx: 0, vy: 0 }; this.pause = 0.9; this.rally = 0; }
  point(side) {
    if (side === 'you') this.ps++; else this.os++;
    this.msg = side === 'you' ? 'POINT!' : 'Their point'; sfx(side === 'you' ? 'chime' : 'blip'); this.reset(side === 'you' ? 'opp' : 'you');
    if (this.ps >= this.goal || this.os >= this.goal) this.finish();
  }
  hitBall(from, dir, power) { const b = this.ball; b.vy = -170 - power * 40; b.vx = dir * (70 + power * 55); sfx('blip'); this.rally++; this.best = Math.max(this.best, this.rally); }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    if (this.t > this.limit) { this.finish(); return; }
    // you
    const dx = (key(input, 'arrowright', 'd') ? 1 : 0) - (key(input, 'arrowleft', 'a') ? 1 : 0);
    this.px = clamp(this.px + dx * 90 * dt, 12, NETX - 14);
    if (act(input) && this.py >= FLOOR) this.pvy = -190;
    this.pvy += GRAV * dt * 0.8; this.py = Math.min(FLOOR, this.py + this.pvy * dt); if (this.py >= FLOOR) this.pvy = 0;
    // opponent bot: tracks the ball with a human-ish lag and the odd miss
    const b = this.ball, tx = b.x > NETX ? clamp(b.x + b.vx * 0.2, NETX + 14, 306) : 250;
    this.ox += clamp(tx - this.ox, -1, 1) * Math.min(Math.abs(tx - this.ox), 70 * dt);
    if (this.oy >= FLOOR && b.x > NETX && Math.abs(b.x - this.ox) < 22 && b.y > 100 && b.vy > 0 && b.y < FLOOR - 8 && this.r() < 0.5) this.ovy = -190;
    this.ovy += GRAV * dt * 0.8; this.oy = Math.min(FLOOR, this.oy + this.ovy * dt); if (this.oy >= FLOOR) this.ovy = 0;
    if ((this.pause -= dt) > 0) { this.msg = this.pause > 0.2 ? this.msg : ''; return; }
    this.msg = '';
    // ball
    b.vy += GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 6 || b.x > 314) { b.vx *= -0.8; b.x = clamp(b.x, 6, 314); }
    if (Math.abs(b.x - NETX) < 4 && b.y > 118) { b.vx *= -0.7; b.x = NETX + (b.x < NETX ? -4 : 4); }
    const near = (cx, cy) => Math.hypot(b.x - cx, b.y - (cy - 16)) < 20;
    if (near(this.px, this.py) && b.vy > -40 && (this.py < FLOOR || act(input) || true) && this.lastHit !== 'you') { this.hitBall('you', 1, this.py < FLOOR ? 1.1 : 0.55); this.lastHit = 'you'; }
    if (near(this.ox, this.oy) && b.vy > -40 && this.lastHit !== 'opp' && this.r() < 0.88) { this.hitBall('opp', -1, 0.6 + this.r() * 0.5); this.lastHit = 'opp'; }
    if (b.y >= FLOOR - 4) { this.lastHit = null; this.point(b.x < NETX ? 'opp' : 'you'); }
    if (b.x < NETX && this.lastHit === 'opp') this.lastHit = null;
    if (b.x > NETX && this.lastHit === 'you') this.lastHit = null;
  }
  finish() { this.done = true; const tot = this.ps + this.os || 1; this.score = clamp(this.ps >= this.goal ? 0.6 + 0.4 * (this.ps - this.os) / this.goal : (this.ps / tot) * 0.55, 0, 1); this.won = this.ps > this.os; this.result = { text: `${this.ps} to ${this.os}${this.won ? ': you win!' : ''}`, won: this.won, ps: this.ps, os: this.os }; sfx(this.won ? 'levelup' : 'blip'); }
  draw(g) {
    sea(g, this.t, 90);
    rect(g, K.sand[3], 0, 128, 320, 96); rect(g, K.sand[2], 0, 176, 320, 48);
    rect(g, K.paper[4], NETX - 2, 112, 4, 66); for (let y = 114; y < 140; y += 4) rect(g, K.paper[3], NETX - 12, y, 24, 1);
    rect(g, K.paper[3], 20, 180, 280, 2);
    const person = (x, y, c, c2) => { rect(g, '#00000030', x - 8, FLOOR + 2, 16, 3); rect(g, c, x - 5, y - 22, 10, 14); rect(g, K.skinLight[3], x - 4, y - 31, 8, 8); rect(g, c2, x - 4, y - 32, 8, 3); rect(g, K.denim[2], x - 4, y - 8, 4, 8); rect(g, K.denim[2], x, y - 8, 4, 8); };
    person(this.px, this.py, K.coral[2], K.hairBrown[2]); person(this.ox, this.oy, K.mint[2], K.hairBlonde[2]);
    disc(g, K.paper[4], this.ball.x, this.ball.y, 5); rect(g, K.coral[2], this.ball.x - 5, this.ball.y - 1, 10, 2);
    if (this.msg) drawTextC(g, this.msg, 160, 70, K.butter[3], 2);
    hud(g, 'BEACH VOLLEYBALL', 'Arrows move, Space jumps. First to ' + this.goal, `YOU ${this.ps}  LANI ${this.os}`);
  }
}
register('minigame', 'sv4_volley', {
  title: 'Beach volleyball', resultTitle: 'GAME, SET!', music: 'beach',
  make: (game, o) => new VolleyGame(game, o || {}),
  bot(m, t, i) {
    const b = m.ball, tx = b.x < NETX ? clamp(b.x - 6, 14, NETX - 16) : 90;
    i.keys = new Set(); if (m.px < tx - 2) i.keys.add('arrowright'); else if (m.px > tx + 2) i.keys.add('arrowleft');
    if (Math.abs(b.x - m.px) < 26 && b.y > 90 && b.vy > 0) i.pressed = new Set([' ']);
    return i;
  },
});

// =================================================================== DIVE (snorkel + photo)
export class DiveGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'dive', opts.salt || 0); this.r = r; this.night = !!opts.night;
    const pool = REEF.filter((s) => this.night ? true : !s[4]);
    const weights = pool.flatMap((s) => Array(s[3]).fill(s));
    this.mons = []; const seen = new Set();
    for (let i = 0; i < 18; i++) { const s = weights[Math.floor(r() * weights.length)]; if (seen.has(s[0]) && r() < 0.4) continue; seen.add(s[0]); this.mons.push({ id: s[0], name: s[1], x: 20 + r() * 1400, y: 28 + s[2] * 150 + (r() - 0.5) * 16, vx: (r() < 0.5 ? -1 : 1) * (6 + r() * 14), c: s[5], size: 7 + (s[3] === 1 ? 6 : 0) + Math.floor(r() * 3), got: false }); }
    if (opts.guarantee) { const s = REEF.find((x) => x[0] === opts.guarantee); if (s) this.mons.push({ id: s[0], name: s[1], x: 100, y: 28 + s[2] * 150, vx: 4, c: s[5], size: 9, got: false }); }
    Object.assign(this, { x: 60, y: 24, o2: 1, t: 0, shots: [], flash: 0, cd: 0, done: false, score: 0, total: opts.limit || 100, msg: '', msgT: 0, known: opts.known || {}, cam: 0, surfaced: 0, auto: false });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cd = Math.max(0, this.cd - dt); this.flash = Math.max(0, this.flash - dt); this.msgT = Math.max(0, this.msgT - dt);
    const dx = (key(input, 'arrowright', 'd') ? 1 : 0) - (key(input, 'arrowleft', 'a') ? 1 : 0), dy = (key(input, 'arrowdown', 's') ? 1 : 0) - (key(input, 'arrowup', 'w') ? 1 : 0);
    let ax = dx, ay = dy;
    if (input.down && input.moved && !dx && !dy) { const mx = input.mx + this.cam - this.x, my = input.my - this.y; if (Math.hypot(mx, my) > 8) { ax = Math.sign(mx) * Math.min(1, Math.abs(mx) / 30); ay = Math.sign(my) * Math.min(1, Math.abs(my) / 30); } }
    this.x = clamp(this.x + ax * 56 * dt, 8, 1460); this.y = clamp(this.y + ay * 50 * dt, 20, 205);
    this.cam = clamp(this.x - 120, 0, 1180);
    // oxygen: drains below the surface, refills at the top; running out just floats you up gently (cozy)
    if (this.y < 26) { this.o2 = Math.min(1, this.o2 + dt * 0.5); }
    else this.o2 -= dt * (0.011 + this.y / 20000);
    if (this.o2 <= 0) { this.o2 = 0.3; this.y = 22; this.msg = 'You float up for a breath'; this.msgT = 1.4; this.surfaced++; }
    for (const m of this.mons) { m.x += m.vx * dt; if (m.x < 0 || m.x > 1500) m.vx *= -1; }
    if (act(input) && this.cd <= 0) {
      this.cd = 0.45; this.flash = 0.12; sfx('blip');
      let best = null;
      for (const m of this.mons) { const d = Math.hypot(m.x - (this.x + 22), m.y - this.y); if (d < 30 + m.size && (!best || d < best.d)) best = { m, d }; }
      if (best) { const m = best.m, isNew = !this.known[m.id] && !this.shots.includes(m.id); if (!this.shots.includes(m.id)) this.shots.push(m.id); m.got = true; this.msg = `${m.name}${isNew ? ' - new!' : ''}`; this.msgT = 1.6; sfx(isNew ? 'chime' : 'coin'); }
    }
    if (this.t >= this.total) {
      this.done = true; this.score = clamp(this.shots.length / 7, 0, 1);
      this.result = { text: `${this.shots.length} species photographed`, species: this.shots.slice() }; sfx('levelup');
    }
  }
  draw(g) {
    rect(g, K.water[4], 0, 0, 320, 30); rect(g, K.water[3], 0, 30, 320, 60); rect(g, K.water[2], 0, 90, 320, 70); rect(g, K.water[1], 0, 160, 320, 64);
    if (this.night) { rect(g, '#10183060', 0, 0, 320, 224); }
    for (let i = 0; i < 20; i++) { const x = (i * 83 - this.cam * 0.5) % 340; rect(g, K.water[4], x < 0 ? x + 340 : x, 30 + (i * 31) % 120, 1, 6); }
    for (let x = -this.cam % 40; x < 320; x += 40) { rect(g, K.coral[2], x + 4, 206, 8, 18); rect(g, K.mint[2], x + 16, 210, 6, 14); rect(g, K.lilac[2], x + 26, 204, 8, 20); }
    rect(g, K.sand[2], 0, 218, 320, 6);
    rect(g, K.sky[4], 0, 0, 320, 6);
    for (const m of this.mons) {
      const sx = m.x - this.cam; if (sx < -30 || sx > 350) continue;
      const s = m.size, f = m.vx > 0 ? 1 : -1; const glow = this.night && /glow|whale/.test(m.id);
      if (glow) disc(g, 'rgba(232,255,244,0.25)', sx, m.y, s + 4);
      rect(g, m.c, sx - s, m.y - s / 2, s * 2, s); rect(g, m.c, sx + f * (s - 1), m.y - 1, f * 4, 3); rect(g, K.ink[0], sx + f * (s - 3), m.y - s / 2 + 1, 1, 1);
      if (m.got) { rect(g, K.butter[3], sx - 2, m.y - s - 6, 4, 4); }
    }
    const px = this.x - this.cam;
    rect(g, K.skinLight[3], px - 4, this.y - 4, 8, 8); rect(g, K.hairBrown[2], px - 4, this.y - 5, 8, 3); rect(g, K.coral[2], px + 4, this.y - 2, 10, 3); rect(g, K.sky[2], px - 1, this.y - 2, 5, 3);
    // camera frame
    const fx = px + 22; g.strokeStyle = K.paper[4]; g.lineWidth = 1; g.strokeRect(Math.round(fx - 22) + .5, Math.round(this.y - 16) + .5, 44, 32);
    if (this.flash > 0) rect(g, 'rgba(255,255,255,0.5)', fx - 22, this.y - 16, 44, 32);
    rect(g, '#2b1d2e', 250, 16, 62, 8); rect(g, this.o2 > 0.3 ? K.mint[2] : K.coral[2], 251, 17, 60 * this.o2, 6); drawText(g, 'AIR', 232, 17, K.paper[4]);
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 190, K.butter[3], 1, null);
    hud(g, 'LAGOON DIVE', 'Arrows swim, Space takes a photo. Breathe at the surface!', `${this.shots.length} SHOT  ${Math.max(0, Math.ceil(this.total - this.t))}S`);
  }
}
register('minigame', 'sv4_dive', {
  title: 'Lagoon dive', resultTitle: 'WHAT A REEF!', music: 'beach',
  make: (game, o) => new DiveGame(game, o || {}),
  bot(m, t, i) {
    i.keys = new Set(); let tg = null;
    for (const q of m.mons) if (!m.shots.includes(q.id) && (!tg || Math.hypot(q.x - m.x, q.y - m.y) < Math.hypot(tg.x - m.x, tg.y - m.y))) tg = q;
    if (m.o2 < 0.3) { i.keys.add('arrowup'); return i; }
    if (tg) { const ex = tg.x - 22 - m.x; if (ex > 3) i.keys.add('arrowright'); else if (ex < -3) i.keys.add('arrowleft'); if (tg.y > m.y + 2) i.keys.add('arrowdown'); else if (tg.y < m.y - 2) i.keys.add('arrowup'); }
    if (Math.floor(t * 4) !== Math.floor((t - 1 / 60) * 4)) i.pressed = new Set([' ']);
    return i;
  },
});

// =================================================================== REGATTA
export class RegattaGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'regatta', opts.salt || 0); this.r = r;
    this.len = 1500; this.gates = Array.from({ length: 10 }, (_, i) => ({ y: 160 + i * 130, x: 70 + r() * 180, hit: null }));
    this.rivals = [0, 1, 2].map((i) => ({ y: 0, x: 80 + i * 70, v: 52 + i * 3 + r() * 6, name: ['Gull', 'Pepper', 'Kite'][i] }));
    Object.assign(this, { x: 160, y: 0, v: 50, wind: 0, windT: 0, t: 0, done: false, score: 0, place: 0, combo: 0, limit: opts.limit || 90, skill: opts.skill || 0 });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    this.windT -= dt; if (this.windT <= 0) { this.wind = (this.r() - 0.5) * 2; this.windT = 3 + this.r() * 3; }
    const dx = (key(input, 'arrowright', 'd') ? 1 : 0) - (key(input, 'arrowleft', 'a') ? 1 : 0);
    let steer = dx; if (input.down && input.moved && !dx) steer = Math.sign(input.mx - this.x) * Math.min(1, Math.abs(input.mx - this.x) / 30);
    this.x = clamp(this.x + steer * 85 * dt + this.wind * 14 * dt, 14, 306);
    const tail = this.wind * steer > 0.2 ? 1 : 0;      // riding the gust
    this.v += ((54 + tail * 16 + this.skill * 3) - this.v) * dt * 1.5;
    const prev = this.y; this.y += this.v * dt;
    for (const gt of this.gates) if (gt.hit === null && prev < gt.y && this.y >= gt.y) { gt.hit = Math.abs(this.x - gt.x) < 34; if (gt.hit) { this.combo++; this.v += 18; sfx('chime'); } else { this.combo = 0; this.v -= 16; sfx('blip'); } }
    for (const rv of this.rivals) rv.y += rv.v * dt * (0.95 + 0.1 * Math.sin(this.t + rv.x));
    if (this.y >= this.len || this.t > this.limit) {
      this.done = true; this.place = 1 + this.rivals.filter((rv) => rv.y > this.y).length;
      this.score = [1, 0.7, 0.45, 0.25][this.place - 1]; const hits = this.gates.filter((q) => q.hit).length;
      this.result = { text: `Place ${this.place} of 4, ${hits} gates`, place: this.place, gates: hits }; sfx('levelup');
    }
  }
  draw(g) {
    rect(g, K.water[3], 0, 0, 320, 224); for (let i = 0; i < 50; i++) rect(g, K.water[4], (i * 61) % 320, ((i * 37) - this.y * 1.0) % 224 < 0 ? ((i * 37) - this.y) % 224 + 224 : ((i * 37) - this.y) % 224, 5, 1);
    const sy = (y) => 150 - (y - this.y) * 0.9;
    for (const gt of this.gates) { const y = sy(gt.y); if (y < -10 || y > 230) continue; const col = gt.hit === null ? K.coral[2] : gt.hit ? K.mint[2] : K.charcoal[3]; disc(g, col, gt.x - 34, y, 4); disc(g, col, gt.x + 34, y, 4); rect(g, 'rgba(255,255,255,0.35)', gt.x - 34, y, 68, 1); }
    rect(g, K.paper[4], 0, sy(this.len), 320, 3);
    const boat = (x, y, c) => { rect(g, c, x - 6, y - 4, 12, 9); rect(g, K.wood[3], x - 5, y + 4, 10, 2); rect(g, K.paper[4], x - 1, y - 14, 2, 12); g.fillStyle = K.paper[4]; g.beginPath(); g.moveTo(x + 2, y - 14); g.lineTo(x + 8, y - 4); g.lineTo(x + 2, y - 4); g.fill(); };
    for (const rv of this.rivals) { const y = sy(rv.y); if (y > -20 && y < 240) boat(rv.x, y, K.mint[1]); }
    boat(this.x, 150, K.coral[2]);
    // wind arrow
    drawText(g, this.wind > 0.1 ? 'WIND >>' : this.wind < -0.1 ? '<< WIND' : 'CALM', 130, 20, K.paper[4]);
    hud(g, 'SUMMER REGATTA', 'Left/right to steer through the gates. Sail with the wind!', `GATES ${this.gates.filter((q) => q.hit).length}/10  ${Math.max(0, Math.ceil(this.limit - this.t))}S`);
  }
}
register('minigame', 'sv4_regatta', {
  title: 'Summer regatta', resultTitle: 'RACE OVER!', music: 'festival',
  make: (game, o) => new RegattaGame(game, o || {}),
  bot(m, t, i) {
    const gt = m.gates.find((q) => q.hit === null && q.y > m.y - 4) || { x: 160 };
    i.keys = new Set(); if (gt.x > m.x + 6) i.keys.add('arrowright'); else if (gt.x < m.x - 6) i.keys.add('arrowleft'); return i;
  },
});

// =================================================================== CHEST LOCK
export class ChestGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'chest', opts.salt || 0);
    this.rings = [0, 1, 2].map((i) => ({ a: r() * 6.28, sp: 1.6 + i * 0.6 + r() * 0.4, gap: r() * 6.28, done: false }));
    Object.assign(this, { cur: 0, tries: 0, max: 14, done: false, score: 0, t: 0, flash: 0 });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const rg = this.rings[this.cur]; rg.a = (rg.a + rg.sp * dt) % 6.2832;
    if (act(input)) {
      this.tries++; const d = Math.abs(((rg.a - rg.gap + 9.4248) % 6.2832) - 3.1416);
      if (d < 0.35) { rg.done = true; this.cur++; this.flash = 0.3; sfx('chime'); } else sfx('blip');
      if (this.cur >= 3) { this.done = true; this.score = clamp(1 - (this.tries - 3) / 11, 0.25, 1); this.result = { text: `Unlocked in ${this.tries} tries`, tries: this.tries }; sfx('levelup'); }
      else if (this.tries >= this.max) { this.done = true; this.score = 0.2; this.result = { text: 'The lock jiggles open on its own', tries: this.tries }; }
    }
  }
  draw(g) {
    rect(g, K.water[1], 0, 0, 320, 224); for (let i = 0; i < 30; i++) rect(g, K.water[2], (i * 53 + this.t * 8) % 320, (i * 37) % 224, 2, 2);
    rect(g, K.wood[2], 100, 60, 120, 100); rect(g, K.wood[3], 100, 60, 120, 6); rect(g, K.butter[1], 100, 100, 120, 6);
    this.rings.forEach((rg, i) => {
      const cx = 160, cy = 110, R = 50 - i * 14; for (let k = 0; k < 64; k++) { const a = (k / 64) * 6.2832; const gapd = Math.abs(((a - rg.gap + 9.4248) % 6.2832) - 3.1416); if (gapd < 0.3) continue; rect(g, rg.done ? K.mint[2] : i === this.cur ? K.butter[2] : K.paper[2], cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3, 3); }
      if (i === this.cur && !rg.done) disc(g, K.ribbon[2], cx + Math.cos(rg.a) * R + 1, cy + Math.sin(rg.a) * R + 1, 3);
    });
    if (this.flash > 0) rect(g, 'rgba(255,255,200,0.3)', 100, 60, 120, 100);
    hud(g, 'SUNKEN CHEST', 'Press Space when the red dot passes the gap', `TRIES ${this.tries}/${this.max}`);
  }
}
register('minigame', 'sv4_chest', {
  title: 'Sunken chest', resultTitle: 'CLICK!', music: 'cave',
  make: (game, o) => new ChestGame(game, o || {}),
  bot(m, t, i) { const rg = m.rings[m.cur]; if (rg) { const d = ((rg.a - rg.gap + 9.4248) % 6.2832) - 3.1416; if (Math.abs(d) < 0.14) i.pressed = new Set([' ']); } return i; },
});

// =================================================================== OBSERVATORY GEARS
export class GearGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'gears', opts.salt || 0);
    this.a = [0, 0, 0, 0]; this.moves = [];
    for (let i = 0; i < 9; i++) { const g = Math.floor(r() * 4), d = r() < 0.5 ? 1 : -1; this.turn(g, d, true); this.moves.push([g, d]); }
    if (this.a.every((v) => v === 0)) { this.turn(0, 1, true); this.moves.push([0, 1]); }
    Object.assign(this, { sel: 0, t: 0, done: false, score: 0, turns: 0, flash: 0 });
  }
  turn(i, d) { this.a[i] = (this.a[i] + d + 6) % 6; if (i + 1 < 4) this.a[i + 1] = (this.a[i + 1] - d + 6) % 6; }
  solved() { return this.a.every((v) => v === 0); }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    if (hit(input, 'arrowleft', 'a')) this.sel = (this.sel + 3) % 4;
    if (hit(input, 'arrowright', 'd')) this.sel = (this.sel + 1) % 4;
    if (input.justDown) { const i = Math.floor((input.mx - 50) / 56); if (i >= 0 && i < 4) { this.sel = i; this.dir(input.my < 112 ? 1 : -1); } }
    if (hit(input, 'arrowup', 'w', ' ')) this.dir(1);
    if (hit(input, 'arrowdown', 's')) this.dir(-1);
  }
  dir(d) {
    this.turn(this.sel, d); this.turns++; sfx('blip');
    if (this.solved()) { this.done = true; this.score = clamp(1 - Math.max(0, this.turns - 9) / 40, 0.4, 1); this.result = { text: `Aligned in ${this.turns} turns`, turns: this.turns }; sfx('levelup'); }
  }
  draw(g) {
    rect(g, '#1a1426', 0, 0, 320, 224); for (let i = 0; i < 50; i++) rect(g, i % 7 ? K.paper[3] : K.butter[3], (i * 61) % 320, (i * 37) % 80, 1, 1);
    this.a.forEach((v, i) => {
      const cx = 78 + i * 56, cy = 112; disc(g, i === this.sel ? K.butter[2] : K.stone[3], cx, cy, 24); disc(g, K.stone[1], cx, cy, 17);
      for (let k = 0; k < 12; k++) { const an = (k / 12) * 6.2832 + (v / 6) * 6.2832; rect(g, i === this.sel ? K.butter[3] : K.stone[4], cx + Math.cos(an) * 24 - 2, cy + Math.sin(an) * 24 - 2, 4, 4); }
      const an = -1.5708 + (v / 6) * 6.2832; disc(g, v === 0 ? K.mint[3] : K.coral[2], cx + Math.cos(an) * 12, cy + Math.sin(an) * 12, 4);
      rect(g, K.butter[3], cx - 2, cy - 44, 4, 4);
    });
    drawTextC(g, this.solved() ? 'THE STARS ALIGN' : 'Turn each gear so its dot points to the star above', 160, 170, K.paper[3], 1, null);
    hud(g, 'OBSERVATORY GEARS', 'Left/right choose, up/down turn. The next gear turns back!', `TURNS ${this.turns}`);
  }
}
register('minigame', 'sv4_gears', {
  title: 'Gears and stars', resultTitle: 'ALIGNED!', music: 'cave',
  make: (game, o) => new GearGame(game, o || {}),
  bot(m, t, i) {
    if (Math.floor(t * 10) === Math.floor((t - 1 / 60) * 10)) return i;
    const last = m.moves[m.moves.length - 1 - (m.botStep || 0)];
    if (!last) return i;
    const [g, d] = last;
    if (m.sel !== g) i.pressed = new Set(['arrowright']);
    else { i.pressed = new Set([d > 0 ? 'arrowdown' : 'arrowup']); m.botStep = (m.botStep || 0) + 1; }
    return i;
  },
});

// =================================================================== HAUL (deckhand / fishery shift)
const ARR = [['arrowleft', 'LEFT'], ['arrowdown', 'DOWN'], ['arrowup', 'UP'], ['arrowright', 'RIGHT']];
export class HaulGame {
  constructor(game, opts = {}) {
    const r = rngOf(game, 'haul', opts.salt || 0);
    this.seq = Array.from({ length: 12 + (opts.rank || 1) * 2 }, () => Math.floor(r() * 4));
    Object.assign(this, { i: 0, t: 0, left: 2.4 - Math.min(1, (opts.rank || 1) * 0.12), hits: 0, miss: 0, done: false, score: 0, title: opts.title || 'HAUL CRATES', flash: 0 });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.left -= dt;
    let pick = -1; ARR.forEach(([k], n) => { if (hit(input, k, ['a', 's', 'w', 'd'][n])) pick = n; });
    if (pick >= 0) { if (pick === this.seq[this.i]) { this.hits++; sfx('coin'); } else { this.miss++; sfx('blip'); } this.next(); }
    else if (this.left <= 0) { this.miss++; this.next(); }
  }
  next() { this.i++; this.left = 2.2; this.flash = 0.15; if (this.i >= this.seq.length) { this.done = true; this.score = clamp(this.hits / this.seq.length, 0, 1); this.result = { text: `${this.hits} of ${this.seq.length} crates stowed`, hits: this.hits }; sfx('levelup'); } }
  draw(g) {
    sea(g, this.t, 80); rect(g, K.wood[3], 0, 140, 320, 84); for (let x = 0; x < 320; x += 24) rect(g, K.wood[2], x, 140, 1, 84);
    const cur = this.seq[this.i] ?? 0; drawTextC(g, ARR[cur][1], 160, 90, K.ribbon[2], 3);
    rect(g, K.ink[2], 100, 120, 120, 6); rect(g, K.butter[2], 101, 121, 118 * clamp(this.left / 2.2, 0, 1), 4);
    for (let i = 0; i < Math.min(6, this.hits); i++) rect(g, K.wood[2], 40 + i * 24, 170, 20, 18);
    hud(g, this.title, 'Press the arrow shown, fast!', `${this.hits}/${this.seq.length}`);
  }
}
register('minigame', 'sv4_haul', {
  title: 'Haul crates', resultTitle: 'SHIFT DONE!', music: 'beach',
  make: (game, o) => new HaulGame(game, o || {}),
  bot(m, t, i) { if (Math.floor(t * 6) !== Math.floor((t - 1 / 60) * 6)) i.pressed = new Set([ARR[m.seq[m.i]][0]]); return i; },
});
