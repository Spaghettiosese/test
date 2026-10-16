// Mochi's minigames (each has a `bot` so the test suite plays it to the end):
//   mochi_feed     the taste journal: serve one of today's three foods; her reactions teach you her favourite
//   mochi_play     feather wand: wiggle the feather low to make her crouch and pounce
//   mochi_brush    brushing: stroke loose fur off along the grain (she sheds more in spring)
//   daifuku_fetch  throw the ball for Daifuku at the park with a timing meter
import { register, features } from '../../core/registry.js';
import { Cursor, act, actHeld } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { sfx } from '../../audio.js';
import { clamp, range } from '../../rng.js';
import { drawCat, drawHand, drawRoom, hud, rect, ell, tri } from '../../minigames/pet.js';
import { FOODS, ms, addBond, fillNeed, checkAllCare } from './state.js';

const INK = '#2a1a22';
const REACT = [
  { id: 'no', text: 'turns up her nose', score: 0.3 },
  { id: 'meh', text: 'nibbles politely', score: 0.55 },
  { id: 'like', text: 'eats it all up', score: 0.8 },
  { id: 'love', text: 'LOVES it', score: 1 },
];
const REACT_ICON = ['i_anger', 'i_sweat', 'heart', 'heart'];

// ---------------- taste model ----------------
export function favourite(game) { const r = game.rngFor('mochiFav', 1); return FOODS[Math.floor(r() * FOODS.length)].id; }
export function tasteOf(game, id, day = game.day) {
  const f = FOODS.find((x) => x.id === id), noise = (game.rngFor('mochiTaste' + id, day)() - 0.5) * 0.3;
  return clamp(f.pref + (favourite(game) === id ? 0.4 : -0.05) + noise, 0, 1.2);
}
const reactionOf = (v) => (v >= 0.92 ? 3 : v >= 0.62 ? 2 : v >= 0.42 ? 1 : 0);
export function todaysMenu(game) {
  const s = ms(game), r = game.rngFor('mochiMenu'), pool = FOODS.map((f) => f.id).sort(() => r() - 0.5);
  const untried = pool.filter((id) => !s.tried[id]);
  const menu = [...untried.slice(0, 1), ...pool.filter((id) => !untried.slice(0, 1).includes(id))].slice(0, 3);
  if (!menu.includes(favourite(game)) && r() < 0.3) menu[2] = favourite(game);
  return menu.sort(() => r() - 0.5);
}

class FeedGame {
  constructor(game) {
    this.game = game; this.rng = game.rng;
    Object.assign(this, { t: 0, sel: 1, phase: 'pick', wait: 0, done: false, score: 0, served: 0, refused: 0, hearts: [], catX: 160, title: 'Feed Mochi', msg: 'Pick a bowl. Your journal remembers what she thinks.' });
    this.menu = todaysMenu(game);
    this.best = -1;
  }
  bowlX(i) { return 60 + i * 100; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.hearts = this.hearts.filter((h) => (h.y -= 16 * dt, h.life -= dt) > 0);
    const k = input.pressed;
    if (this.phase === 'pick') {
      if (k.has('arrowleft') || k.has('a')) { this.sel = (this.sel + 2) % 3; sfx('blip'); }
      if (k.has('arrowright') || k.has('d')) { this.sel = (this.sel + 1) % 3; sfx('blip'); }
      let click = false;
      if ((input.moved || input.justDown) && input.my > 140) { const i = clamp(Math.floor((input.mx - 10) / 100), 0, 2); if (i !== this.sel) this.sel = i; click = input.justDown; }
      if (click || k.has(' ') || k.has('e') || k.has('enter')) this.serve();
      this.catX += (this.bowlX(this.sel) - this.catX) * Math.min(1, dt * 1.5) * 0.4;
    } else if (this.phase === 'walk') {
      this.catX += (this.bowlX(this.sel) - this.catX) * Math.min(1, dt * 5);
      this.wait -= dt;
      if (this.wait <= 0) this.react();
    } else {
      this.wait -= dt;
      if (this.phase === 'eat' && this.rng() < dt * 6) this.hearts.push({ x: this.catX + range(this.rng, -20, 20), y: 80, life: 1 });
      if (this.wait <= 0) {
        if (this.phase === 'eat') this.finish();
        else { this.phase = 'pick'; this.msg = this.served >= 3 ? 'Nothing else today. She will eat the kibble later.' : 'Hmm. Try another bowl!'; if (this.served >= 3) this.finish(); }
      }
    }
  }
  serve() { this.phase = 'walk'; this.wait = 0.9; this.served++; sfx('select'); this.msg = 'Mochi pads over to sniff...'; }
  react() {
    const id = this.menu[this.sel], v = tasteOf(this.game, id), r = reactionOf(v), s = ms(this.game);
    s.tried[id] = (s.tried[id] || 0) + 1;
    s.taste[id] = Math.max(s.taste[id] ?? -1, r);
    s.journal.unshift({ day: this.game.day, food: id, r }); s.journal.length = Math.min(s.journal.length, 30);
    this.best = Math.max(this.best, r); this.lastFood = id; this.lastR = r;
    const name = FOODS.find((f) => f.id === id).name.toLowerCase();
    if (r >= 2) { this.phase = 'eat'; this.wait = 2.2; sfx(r === 3 ? 'trill' : 'eat'); this.msg = `Mochi ${REACT[r].text}: ${name}!`; }
    else { this.refused += r === 0 ? 1 : 0; this.phase = r === 1 ? 'eat' : 'sniff'; this.wait = r === 1 ? 1.6 : 1.3; sfx(r === 1 ? 'eat' : 'wrong'); this.msg = `Mochi ${REACT[r].text}. (${name})`; if (r === 1 && this.served < 3) { this.phase = 'sniff'; } }
    if (r === 3 && id === favourite(this.game)) {
      s.favLoves = (s.favLoves || 0) + 1;
      if (s.favLoves >= 2 && !s.favouriteFound) { s.favouriteFound = true; this.msg = `You found her favourite: ${name}!`; this.game.toast(`Taste journal: Mochi's favourite is ${name}!`, 'i_star'); this.game.stat('mochiFavFound'); }
    }
  }
  finish() {
    this.done = true;
    const r = Math.max(0, this.best);
    this.score = clamp(REACT[r].score - this.refused * 0.08, 0.3, 1);
    this.result = { text: this.lastFood ? `${FOODS.find((f) => f.id === this.lastFood).name}: ${['no thanks', 'okay', 'yum', 'favourite!'][r]}` : 'Dinner is served' };
    const g = this.game;
    if (g.state.mochi) { fillNeed(g, 'food', r >= 2 ? 100 : 70); addBond(g, r === 3 ? 25 : r === 2 ? 12 : 4, 'feedtaste'); checkAllCare(g); }
  }
  draw(g, sprite) {
    drawRoom(g);
    const s = ms(this.game), mood = this.phase === 'eat' ? 'eat' : this.phase === 'sniff' ? 'sniff' : 'idle';
    drawCat(g, Math.round(this.catX), 132, { k: 0.5, t: this.t, mood, look: [clamp((this.bowlX(this.sel) - this.catX) / 40, -1, 1), 1] });
    for (const h of this.hearts) g.drawImage(sprite('heart'), Math.round(h.x), Math.round(h.y));
    for (let i = 0; i < 3; i++) {
      const id = this.menu[i], f = FOODS.find((x) => x.id === id), bx = this.bowlX(i), on = i === this.sel, known = s.taste[id];
      rect(g, INK, bx - 44, 142, 88, 58); rect(g, on ? '#ffd76a' : '#fff6e6', bx - 43, 143, 86, 56); rect(g, on ? '#ffeaa0' : '#f3e2c7', bx - 43, 191, 86, 8);
      // bowl
      ell(g, INK, bx, 160, 19, 8); ell(g, '#e0707a', bx, 160, 18, 7); ell(g, '#f29aa0', bx - 3, 157, 12, 3); ell(g, f.c, bx, 156, 12, 3); rect(g, '#fffaf0', bx - 6, 155, 3, 1);
      g.drawImage(sprite(f.icon), bx - 8 - 1, 165);
      drawTextC(g, f.name, bx, 184, '#2b1d2e', 1, null);
      if (known !== undefined && known >= 0) { for (let j = 0; j <= known; j++) g.drawImage(sprite('heart'), bx + 26 - j * 9, 146); if (known === 0) drawText(g, 'no', bx + 26, 147, '#bd5460', 1, null); }
      else drawText(g, 'new', bx + 20, 147, '#5eaa92', 1, null);
      if (s.favouriteFound && id === favourite(this.game)) g.drawImage(sprite('i_star'), bx - 42, 144);
    }
    hud(g, 'Feed Mochi: taste journal', this.msg);
    drawText(g, 'Arrows or tap a bowl', 210, 6, '#fff6a0', 1, null);
  }
}

// ---------------- feather wand ----------------
class PlayGame {
  constructor(game) {
    this.game = game; this.rng = game.rng;
    Object.assign(this, { t: 0, fun: 0, catches: 0, done: false, score: 0, catX: 160, crouchT: 0, jumpT: -1, jx0: 0, jx1: 0, stillT: 0, hearts: [], msg: 'Wiggle the feather low to the floor. Tap or hold to drag it.', title: 'Feather wand' });
    this.cur = new Cursor(220, 120, 160, [10, 30, 310, 196]);
    this.fx = 220; this.fy = 150; this.fvx = 0; this.fvy = 0;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cur.update(dt, input);
    this.hearts = this.hearts.filter((h) => (h.y -= 18 * dt, h.life -= dt) > 0);
    // feather on a string: spring toward a point under the wand tip
    const tx = this.cur.x, ty = this.cur.y + 34;
    this.fvx += (tx - this.fx) * 30 * dt; this.fvy += (ty - this.fy) * 30 * dt + 60 * dt;
    this.fvx *= Math.pow(0.04, dt); this.fvy *= Math.pow(0.04, dt);
    this.fx += this.fvx * dt; this.fy = Math.min(196, this.fy + this.fvy * dt);
    const moving = this.cur.speedNow > 30;
    this.stillT = moving ? 0 : this.stillT + dt;
    if (moving && this.fy > 120) this.fun = Math.min(1, this.fun + dt * 0.02);
    if (this.jumpT >= 0) {
      this.jumpT += dt;
      this.catX = this.jx0 + (this.jx1 - this.jx0) * Math.min(1, this.jumpT / 0.45);
      if (this.jumpT >= 0.45) {
        this.jumpT = -1;
        if (Math.abs(this.fx - this.catX) < 26 && this.fy > 140) { this.catches++; this.fun = Math.min(1, this.fun + 0.2); sfx('pop'); this.msg = ['Got it! Mochi bats the feather proudly.', 'Caught! Her tail is going crazy.', 'Pounce! Gotcha!'][this.catches % 3]; for (let i = 0; i < 4; i++) this.hearts.push({ x: this.catX + range(this.rng, -20, 20), y: 120, life: 1.2 }); }
        else { this.fun = Math.min(1, this.fun + 0.08); sfx('blip'); this.msg = 'So close! She shakes it off and gets ready again.'; }
      }
    } else {
      const d = this.fx - this.catX;
      if (this.fy > 135 && Math.abs(d) < 90) {
        this.crouchT += dt;
        if (this.crouchT > 0.9) { this.crouchT = 0; this.jumpT = 0; this.jx0 = this.catX; this.jx1 = clamp(this.fx, 50, 270); sfx('trill'); }
      } else { this.crouchT = Math.max(0, this.crouchT - dt * 2); this.catX += clamp(d, -1, 1) * 18 * dt; }
      if (this.stillT > 2.5 && this.t > 3) this.msg = 'Wiggle it! A still feather is boring.';
    }
    if (this.fun >= 1 || this.t > 45) this.finish();
  }
  finish() {
    if (this.done) return;
    this.done = true; this.score = clamp(this.fun, 0.3, 1);
    this.result = { text: `${this.catches} catch${this.catches === 1 ? '' : 'es'}! Mochi is happily worn out.` };
    const g = this.game;
    if (g.state.mochi) { fillNeed(g, 'play', 40 + this.score * 60); addBond(g, Math.round(10 + this.score * 20), 'play'); ms(g).playDay = g.day; g.stat('mochiPlays'); checkAllCare(g); }
  }
  draw(g, sprite) {
    drawRoom(g);
    rect(g, '#bd5460', 70, 180, 180, 10); rect(g, '#e0707a', 72, 178, 176, 8); // rug
    const jumping = this.jumpT >= 0, h = jumping ? Math.sin((this.jumpT / 0.45) * Math.PI) * 40 : 0;
    drawCat(g, Math.round(this.catX), 186 - Math.round(h), { k: 0.5, t: this.t, mood: this.crouchT > 0.15 || jumping ? 'crouch' : 'idle', tailSway: 1.5, look: [clamp((this.fx - this.catX) / 40, -1, 1), clamp((this.fy - 120) / 40, -1, 1)] });
    for (const hh of this.hearts) g.drawImage(sprite('heart'), Math.round(hh.x), Math.round(hh.y));
    // wand stick + string + feather
    const wx = this.cur.x, wy = this.cur.y;
    for (let i = 0; i < 40; i++) rect(g, i % 6 < 3 ? '#a67548' : '#d3a574', wx + 30 - i * 0.75 + 30 * 0, wy - 30 + i * 0.75 + 0, 2, 2);
    const n = 12;
    for (let i = 0; i <= n; i++) { const a = i / n; rect(g, '#fffaf0', Math.round(wx + (this.fx - wx) * a), Math.round(wy + (this.fy - wy) * a + Math.sin(a * Math.PI) * 6), 1, 1); }
    const fx = Math.round(this.fx), fy = Math.round(this.fy), sw = Math.round(Math.sin(this.t * 9) * 2);
    tri(g, INK, [fx - 1, fy - 1], [fx - 7 + sw, fy + 13], [fx + 7 + sw, fy + 13]);
    tri(g, '#e0707a', [fx, fy], [fx - 6 + sw, fy + 12], [fx + 6 + sw, fy + 12]); tri(g, '#ffd76a', [fx, fy + 4], [fx - 3 + sw, fy + 12], [fx + 3 + sw, fy + 12]);
    rect(g, '#7fb2e0', fx - 1, fy - 3, 3, 3);
    drawHand(g, wx + 30, wy - 30, this.t, 0);
    hud(g, 'Feather wand', this.msg);
    rect(g, '#5a3a86', 120, 7, 100, 5); rect(g, '#ffd76a', 121, 8, Math.round(98 * this.fun), 3);
    drawText(g, `Catches ${this.catches}`, 236, 6, '#fff6a0', 1, null);
  }
}

// ---------------- brushing ----------------
class BrushGame {
  constructor(game) {
    this.game = game; this.rng = game.rng;
    const n = game.season === 'spring' ? 18 : 12;
    Object.assign(this, { t: 0, done: false, score: 0, annoy: 0, annoyT: 0, fur: 0, purrT: 0, msg: game.season === 'spring' ? 'Spring shedding! Brush down along her fur.' : 'Brush gently down along her fur.', title: 'Brush Mochi' });
    this.cur = new Cursor(220, 100, 130, [10, 24, 310, 214]);
    this.tufts = [];
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2, r = Math.sqrt(this.rng());
      const onHead = this.rng() < 0.3;
      this.tufts.push(onHead ? { x: 160 + Math.cos(a) * r * 30, y: 98 + Math.sin(a) * r * 18, a: 1 } : { x: 160 + Math.cos(a) * r * 40, y: 150 + Math.sin(a) * r * 26, a: 1 });
    }
    this.total = n;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cur.update(dt, input);
    if (this.annoyT > 0) this.annoyT -= dt;
    const brushing = actHeld(input) && this.cur.speedNow > 12 && this.annoyT <= 0;
    if (brushing) {
      if (this.cur.vy < -140) { this.annoy++; this.annoyT = 1.2; sfx('hiss'); this.msg = 'Against the grain! Brush downward, please.'; }
      else for (const tf of this.tufts) if (tf.a > 0 && Math.hypot(tf.x - this.cur.x, tf.y - this.cur.y) < 16) { tf.a -= dt * (this.cur.vy > 20 ? 3.5 : 1.5); if (tf.a <= 0) { this.fur++; sfx('pop'); } }
      this.purrT -= dt; if (this.purrT <= 0) { sfx('purr'); this.purrT = 0.4; }
    }
    this.tufts = this.tufts.filter((tf) => tf.a > 0);
    if (!this.tufts.length || this.t > 60) this.finish();
  }
  finish() {
    if (this.done) return;
    this.done = true;
    this.score = clamp(1 - this.annoy * 0.15 - this.tufts.length / this.total, 0.3, 1);
    this.result = { text: `${this.fur} tufts of fur. She is soft as a cloud.` };
    const g = this.game;
    if (g.state.mochi) { fillNeed(g, 'groom', 100); addBond(g, Math.round(8 + this.score * 14), 'groom'); ms(g).groomDay = g.day; g.stat('mochiBrushed'); checkAllCare(g); }
  }
  draw(g, sprite) {
    drawRoom(g, false);
    ell(g, '#86cdb0', 160, 194, 74, 10); ell(g, '#b8e6d2', 160, 191, 62, 6);
    drawCat(g, 160, 192, { k: 1, t: this.t, mood: this.annoyT > 0 ? 'annoyed' : this.fur > 2 ? 'happy' : 'idle', look: [clamp((this.cur.x - 160) / 30, -1, 1), clamp((this.cur.y - 96) / 30, -1, 1)] });
    for (const tf of this.tufts) { const x = Math.round(tf.x), y = Math.round(tf.y); g.globalAlpha = Math.max(0.3, tf.a); ell(g, '#ffd9a0', x, y, 4, 3); rect(g, '#fff1d6', x - 3, y - 4, 2, 2); rect(g, '#ffd9a0', x + 2, y - 5, 1, 3); g.globalAlpha = 1; }
    // brush: wooden handle + bristle head
    const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
    rect(g, INK, x - 13, y - 5, 26, 10); rect(g, '#a67548', x - 12, y - 4, 24, 5); rect(g, '#d3a574', x - 12, y - 4, 24, 1);
    for (let i = -11; i <= 11; i += 2) rect(g, '#fffaf0', x + i, y + 1, 1, 4);
    rect(g, INK, x + 12, y - 3, 22, 5); rect(g, '#7a4f3a', x + 13, y - 2, 20, 3);
    hud(g, 'Brush Mochi', this.msg);
    drawText(g, `Fur ${this.fur}/${this.total}`, 236, 6, '#fff6a0', 1, null);
  }
}

// ---------------- fetch with Daifuku ----------------
class FetchGame {
  constructor(game) {
    this.game = game; this.rng = game.rng;
    Object.assign(this, { t: 0, throws: 0, total: 0, done: false, score: 0, phase: 'aim', p: 0, pd: 1, ballX: 40, ballY: 160, dogX: 60, dogDir: 1, land: 0, msg: 'Press Space or tap when the bar is in the green.', title: 'Fetch with Daifuku', q: 0 });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    if (this.phase === 'aim') {
      this.p += this.pd * dt * 1.1; if (this.p > 1) { this.p = 1; this.pd = -1; } if (this.p < 0) { this.p = 0; this.pd = 1; }
      if (act(input)) { this.phase = 'fly'; this.ft = 0; this.land = 70 + this.p * 220; this.q = this.p >= 0.62 && this.p <= 0.86 ? 1 : this.p > 0.86 ? 0.55 : 0.4 + this.p * 0.3; sfx('whistle'); }
    } else if (this.phase === 'fly') {
      this.ft += dt; const k = Math.min(1, this.ft / 0.8);
      this.ballX = 40 + (this.land - 40) * k; this.ballY = 160 - Math.sin(k * Math.PI) * (40 + this.p * 50) + (this.land > 300 ? 0 : 0);
      this.dogX += (this.land - this.dogX) * Math.min(1, dt * 3); this.dogDir = 1;
      if (k >= 1) { this.phase = 'fetch'; sfx('pop'); }
    } else if (this.phase === 'fetch') {
      const arrived = Math.abs(this.dogX - this.land) < 4;
      if (!arrived) this.dogX += Math.sign(this.land - this.dogX) * 140 * dt;
      else { this.phase = 'back'; sfx('woof'); }
    } else if (this.phase === 'back') {
      this.dogDir = -1; this.dogX -= 120 * dt; this.ballX = this.dogX + (this.dogDir > 0 ? 14 : -14); this.ballY = 156;
      if (this.dogX <= 64) {
        this.throws++; this.total += this.q;
        this.msg = this.q >= 1 ? 'Perfect throw! Daifuku does a happy spin.' : this.q > 0.5 ? 'A bit too far, he had to dig it out of a bush.' : 'A short one. He looks at you, unimpressed.';
        if (this.throws >= 3) this.finish(); else { this.phase = 'aim'; this.p = 0; this.pd = 1; this.ballX = 40; this.ballY = 160; }
      }
    }
  }
  finish() {
    if (this.done) return;
    this.done = true; this.score = clamp(this.throws ? this.total / 3 : 0.3, 0.3, 1);
    this.result = { text: this.score > 0.8 ? 'Daifuku is panting with joy!' : 'Good boy! He wants to go again.' };
  }
  draw(g, sprite) {
    rect(g, '#bfe6f5', 0, 0, 320, 120); rect(g, '#effaff', 0, 20, 320, 8); rect(g, '#d4f0fa', 0, 90, 320, 30);
    for (let i = 0; i < 6; i++) { ell(g, '#4f8a58', 20 + i * 60, 118, 30, 14); ell(g, '#74a85a', 14 + i * 60, 112, 18, 8); }
    rect(g, '#94c06a', 0, 120, 320, 104); rect(g, '#6a9c56', 0, 120, 320, 2);
    for (let i = 0; i < 40; i++) rect(g, '#c4dc84', (i * 47) % 320, 130 + ((i * 29) % 90), 3, 1);
    rect(g, '#3f8fb8', 300, 140, 20, 50);
    const fr = Math.floor(this.t * 8) % 4, spr = this.phase === 'aim' ? `dai_sit_${Math.floor(this.t * 3) % 4}` : `dai_walk_${fr}`;
    g.drawImage(sprite(spr, this.dogDir < 0), Math.round(this.dogX) - 16, 170 - (this.phase === 'aim' ? 26 : 25));
    g.drawImage(sprite('dai_ball'), Math.round(this.ballX) - 4, Math.round(this.ballY) - 4);
    drawHand(g, 26, 150, this.t, 0);
    if (this.phase === 'aim') {
      rect(g, INK, 60, 196, 202, 9); rect(g, '#f3e2c7', 61, 197, 200, 7); rect(g, '#86cdb0', 61 + 200 * 0.62, 197, 200 * 0.24, 7);
      rect(g, '#e0707a', 61 + Math.round(this.p * 198), 194, 2, 13);
    }
    hud(g, `Fetch with Daifuku (${Math.min(3, this.throws + 1)}/3)`, this.msg);
  }
}

registerAll();
function registerAll() {
  register('minigame', 'mochi_feed', {
    title: 'Feed Mochi', resultTitle: 'Dinner time!', make: (g) => new FeedGame(g), music: 'home',
    bot: (m, t, inp) => { if (m.phase === 'pick' && Math.floor(t * 4) % 3 === 0) inp.pressed = new Set([Math.floor(t * 3) % 2 ? 'arrowright' : ' ']); return inp; },
  });
  register('minigame', 'mochi_play', {
    title: 'Feather wand', resultTitle: 'Play time!', make: (g) => new PlayGame(g), music: 'home',
    bot: (m, t, inp) => Object.assign(inp, { moved: true, mx: m.catX + Math.sin(t * 3) * 50, my: 140 + Math.sin(t * 7) * 10 }),
  });
  register('minigame', 'mochi_brush', {
    title: 'Brush Mochi', resultTitle: 'So fluffy!', make: (g) => new BrushGame(g), music: 'home',
    bot: (m, t, inp) => { const tf = m.tufts[0]; const ph = (t * 60) % 28; return Object.assign(inp, { down: ph < 26, moved: true, mx: tf ? tf.x : 160, my: tf ? tf.y - 14 + ph : 100 }); },
  });
  register('minigame', 'daifuku_fetch', {
    title: 'Fetch with Daifuku', resultTitle: 'Good boy!', make: (g) => new FetchGame(g),
    bot: (m, t, inp) => { if (m.phase === 'aim' && m.p > 0.7 && m.p < 0.8) inp.pressed = new Set([' ']); return inp; },
  });
}

register('system', 'mochiGames', {
  init(game) {
    game.mochiPlay = () => game.minigame('mochi_play', {});
    game.mochiBrush = () => {
      if (ms(game).groomDay === game.day && ms(game).needs.groom > 90) return game.say('misa', 'happy', 'She is already brushed and shiny. Any more and she will float away.');
      return game.minigame('mochi_brush', {});
    };
  },
});

features('Mochi', [
  'Taste journal feeding: Mochi is offered three of eight cat foods each day and reacts with no thanks, okay, yum or love',
  'The taste journal remembers every reaction, and her secret favourite food is different in every save',
  'Find Mochi\'s favourite: once she loves it twice it gets a star in the journal',
  'Feather wand minigame: wiggle the feather low so Mochi crouches, wiggles her bottom and pounces',
  'Brushing minigame: stroke loose tufts of fur off along the grain; brushing the wrong way makes her hiss',
  'Close-up cat screens share one hand-drawn pixel Mochi that blinks, purrs, leans into strokes and watches your hand',
  'Petting, feeding, brushing and play all work with the mouse, the keyboard or touch',
]);
features('Animals', [
  'Fetch with Daifuku: a timing meter for the perfect throw, and he brings the ball back each time',
]);
