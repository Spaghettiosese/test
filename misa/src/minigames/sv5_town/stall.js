// Market stall / pop-up cafe customer simulation (sv5). A queue of customers with patience bars asks for goods from your display.
// Left/Right pick a slot, Space serves it; then haggle: Space accepts the offer, Up asks for the full price (may annoy), Down gives a
// friendly 15% discount. X waves a customer off. opts: { goods:[{id,qty,price}], duration, tier, awning, sign, mode:'stall'|'cafe', seed, featured, target }
// Fields: sold[], revenue, happy, lost, served.
import { register, get } from '../../core/registry.js';
import { mulberry32 } from '../../rng.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const FACES = [K.coral[3], K.butter[3], K.mint[3], K.lilac[3], K.sky[3]];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const counterChance = (greed, tier) => clamp(0.2 + (greed - 0.7) * 1.6 + tier * 0.06, 0.1, 0.85);

export class StallGame {
  constructor(game, o = {}) {
    const demo = ['crop_turnip', 'crop_tomato', 'crop_tulip'].filter((i) => get('item', i)).map((id) => ({ id, qty: 4, price: (get('item', id).price || 40) * 1.4 | 0 }));
    this.o = o; this.goods = (o.goods && o.goods.length ? o.goods : demo.length ? demo : [{ id: 'x', qty: 5, price: 50 }]).map((g) => ({ ...g, name: (get('item', g.id) || { name: g.id }).name, start: g.qty }));
    this.rng = mulberry32(((game && game.day) || 1) * 131 + (o.seed || 0)); this.T = o.duration || 75; this.tier = o.tier || 0; this.cafe = o.mode === 'cafe';
    this.patience0 = (this.cafe ? 14 : 16) + (o.awning || 0) * 4 + this.tier * 1.5; this.gap = Math.max(2.2, 5.5 - (o.sign || 0) * 0.7 - this.tier * 0.3);
    const worth = this.goods.reduce((a, g) => a + g.qty * g.price, 0), pace = (this.T / this.gap) * (worth / Math.max(1, this.goods.reduce((a, g) => a + g.qty, 0)));
    this.target = o.target || Math.max(1, Math.min(worth, pace) * 0.7);
    Object.assign(this, { t: 0, next: 1.2, q: [], cur: 0, sold: [], revenue: 0, happy: 0, lost: 0, served: 0, msg: 'Welcome!', msgT: 0, done: false, score: 0, id: 0, cd: 0 });
  }
  front() { return this.q[0]; }
  spawn() {
    const open = this.goods.map((g, i) => ({ g, i })).filter(({ g }) => g.qty > 0); if (!open.length || this.q.length >= 5) return;
    const w = open.map(({ i }) => (i === (this.o.featured || 0) ? 2 : 1)), tot = w.reduce((a, b) => a + b, 0); let r = this.rng() * tot, pick = open[0].i;
    for (let k = 0; k < open.length; k++) { r -= w[k]; if (r <= 0) { pick = open[k].i; break; } }
    this.q.push({ want: pick, greed: 0.72 + this.rng() * 0.36, patience: this.patience0, max: this.patience0, phase: 'want', offer: 0, tried: false, face: FACES[this.id++ % 5] });
  }
  say(m) { this.msg = m; this.msgT = 2; }
  sell(c, price, happy) {
    const g = this.goods[c.want]; g.qty--; this.sold.push({ id: g.id, price: Math.round(price) }); this.revenue += Math.round(price); this.served++; if (happy) this.happy++; this.q.shift(); this.say(`Sold ${g.name} for ${Math.round(price)}`);
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.msgT -= dt; this.cd -= dt;
    if (this.t < this.T) { this.next -= dt; if (this.next <= 0) { this.spawn(); this.next = this.gap * (0.7 + this.rng() * 0.6); } }
    else if (!this.q.length) { this.finish(); return; }
    else if (this.t > this.T + 20) { this.lost += this.q.length; this.q = []; }
    for (const c of this.q) c.patience -= dt;
    for (let i = this.q.length - 1; i >= 0; i--) if (this.q[i].patience <= 0) { this.q.splice(i, 1); this.lost++; this.say('A customer gave up waiting'); }
    const k = input.pressed, c = this.front();
    if (k.has('arrowleft') || k.has('a')) this.cur = (this.cur + this.goods.length - 1) % this.goods.length;
    if (k.has('arrowright') || k.has('d')) this.cur = (this.cur + 1) % this.goods.length;
    if (input.justDown && input.my > 150 && input.my < 205) { const i = Math.floor((input.mx - 20) / 70); if (i >= 0 && i < this.goods.length) { this.cur = i; k.add(' '); } }
    if (!c) return;
    if (k.has('x')) { this.q.shift(); this.lost++; this.say('You wave them off politely'); return; }
    if (c.phase === 'want') {
      if (k.has(' ') || k.has('enter') || k.has('e')) {
        const g = this.goods[this.cur];
        if (this.cur === c.want && g.qty > 0) { c.phase = 'offer'; c.offer = Math.round(g.price * c.greed); this.say(`They offer ${c.offer}`); } else { c.patience -= 3; this.say(g.qty > 0 ? 'Not what they wanted' : 'Sold out of that!'); }
      }
    } else {
      const g = this.goods[c.want];
      if (k.has(' ') || k.has('enter') || k.has('e')) this.sell(c, c.offer, c.offer >= g.price * 0.9);
      else if (k.has('arrowup') || k.has('w')) { if (c.tried) this.say('They will not budge again'); else if (this.rng() < counterChance(c.greed, this.tier)) this.sell(c, g.price, true); else { c.tried = true; c.patience -= 4; c.offer = Math.round(c.offer * 0.92); this.say(`Hmm... how about ${c.offer}?`); } }
      else if (k.has('arrowdown') || k.has('s')) this.sell(c, g.price * 0.85, true);
    }
  }
  finish() { if (this.done) return; this.done = true; this.score = clamp(this.revenue / this.target, 0, 1); this.result = { text: `${this.served} served, ${this.revenue} coins` }; if (this.o.onDone) this.o.onDone(this); }
  draw(g) {
    rect(g, K.sky[3], 0, 0, 320, 224); rect(g, K.grass[2], 0, 80, 320, 144); rect(g, K.wood[2], 0, 110, 320, 10); rect(g, K.wood[3], 0, 110, 320, 2);
    drawText(g, this.cafe ? 'POP-UP CAFE' : 'MARKET STALL', 8, 6, K.ink[1], 1, null); drawText(g, `TIME ${Math.max(0, Math.ceil(this.T - this.t))}`, 130, 6, K.ink[1], 1, null);
    drawText(g, `COINS ${this.revenue}`, 200, 6, K.forest[1], 1, null); drawText(g, `LOST ${this.lost}`, 270, 6, K.coral[1], 1, null);
    this.q.forEach((c, i) => { const x = 40 + i * 50, y = 62; rect(g, c.face, x, y, 22, 40); rect(g, K.ink[1], x + 5, y + 8, 3, 3); rect(g, K.ink[1], x + 14, y + 8, 3, 3);
      rect(g, K.ink[1], x, y + 44, 22, 4); rect(g, c.patience / c.max > 0.4 ? K.mint[2] : K.coral[2], x, y + 44, 22 * Math.max(0, c.patience / c.max), 4);
      if (i === 0) { const g2 = this.goods[c.want]; rect(g, K.paper[4], x - 8, y - 22, 40, 16); drawTextC(g, c.phase === 'offer' ? `${c.offer}c` : g2.name.slice(0, 8).toUpperCase(), x + 11, y - 18, K.ink[1], 1, null); } });
    this.goods.forEach((it, i) => { const x = 20 + i * 70; rect(g, i === this.cur ? K.butter[3] : K.paper[3], x, 150, 62, 54); rect(g, K.ink[2], x, 150, 62, 1); rect(g, it.qty ? K.coral[3] : K.charcoal[2], x + 22, 160, 18, 14);
      drawTextC(g, it.name.slice(0, 9).toUpperCase(), x + 31, 178, K.ink[1], 1, null); drawTextC(g, `${it.price}c  x${it.qty}`, x + 31, 190, K.ink[2], 1, null); });
    const c = this.front(); drawText(g, c ? (c.phase === 'want' ? 'SPACE: serve  X: wave off' : 'SPACE accept  UP full price  DOWN 15% off') : 'Waiting for customers...', 8, 212, K.ink[1], 1, null);
    if (this.msgT > 0) drawText(g, this.msg, 8, 20, K.ink[2], 1, null);
  }
}
const bot = (m, t, inp) => {
  const step = Math.floor(t * 5); if (step === m.botStep) return inp; m.botStep = step;
  const c = m.front(); if (!c) return inp;
  const key = (k) => { inp.pressed = new Set([k]); return inp; };
  if (c.phase === 'want') {
    if (m.goods[c.want].qty <= 0) return key('x');
    if (m.cur !== c.want) return key('arrowright');
    return key(' ');
  }
  return key(c.greed >= 0.9 || c.tried ? ' ' : 'arrowup');
};
register('minigame', 'sv5_stall', { title: 'Market Stall', resultTitle: 'STALL CLOSED!', make: (g, o) => new StallGame(g, o), bot });
register('minigame', 'sv5_cafe', { title: 'Pop-up Cafe', resultTitle: 'CAFE CLOSED!', make: (g, o) => new StallGame(g, { ...o, mode: 'cafe', duration: (o && o.duration) || 70 }), bot });
