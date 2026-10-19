// Harbour auction day (sv5): five crates, three cheerful rival bidders with hidden limits. Press Space (or tap BID) to raise the price;
// when nobody bids for a moment the hammer falls. A budget cap keeps it cosy: you can never spend more than `budget`.
// opts: { budget, seed, onLot(lot, price) }. Fields: spent, value, wins[].
import { register, get } from '../../core/registry.js';
import { mulberry32 } from '../../rng.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';

const POOL = ['fish_sea_bream', 'crop_pumpkin', 'min_amethyst', 'shell_pearl', 'min_amber', 'furn_wind_chime', 'furn_lantern_paper', 'gift_music_box', 'mat_pearl', 'mat_brass_gear', 'gift_compass', 'min_moonstone', 'shell_conch', 'furn_candles'];
const BIDDERS = ['Old Sen', 'Auntie Tama', 'Captain Jun'];
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const r5 = (n) => Math.max(5, Math.round(n / 5) * 5);

export class AuctionGame {
  constructor(game, o = {}) {
    this.rng = mulberry32(((game && game.day) || 1) * 977 + (o.seed || 0)); this.o = o; this.budget = o.budget ?? 500;
    const ids = POOL.filter((i) => get('item', i)); const pool = ids.length ? ids : ['star_sticker'];
    this.lots = Array.from({ length: 5 }, (_, i) => {
      const id = pool[Math.floor(this.rng() * pool.length)], it = get('item', id) || { name: 'Crate', price: 100, icon: null }, v = r5((it.price || 100) * (0.9 + this.rng() * 0.6));
      return { id, name: it.name, icon: it.icon, v, start: r5(v * 0.3), inc: r5(v * 0.06), caps: BIDDERS.map(() => v * (0.55 + this.rng() * 0.6)) };
    });
    Object.assign(this, { li: 0, phase: 'show', pt: 0, tick: 0, idle: 0, leader: -1, price: this.lots[0].start, spent: 0, value: 0, wins: [], done: false, score: 0, msg: '', t: 0 });
  }
  get lot() { return this.lots[this.li]; }
  canBid() { return this.phase === 'bid' && this.leader !== 0 && this.price + this.lot.inc <= this.budget - this.spent; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.pt += dt;
    if (this.phase === 'show') { if (this.pt > 1.4) { this.phase = 'bid'; this.pt = 0; this.tick = 0; this.msg = 'Bidding open!'; } return; }
    if (this.phase === 'sold') { if (this.pt > 1.5) this.next(); return; }
    const k = input.pressed, click = input.justDown && input.mx > 230 && input.my > 160;
    if ((k.has(' ') || k.has('e') || k.has('enter') || click) && this.canBid()) { this.price += this.lot.inc; this.leader = 0; this.idle = 0; this.msg = `You bid ${this.price}!`; }
    this.tick += dt;
    if (this.tick >= 0.7) {
      this.tick = 0; const L = this.lot; let bid = false;
      L.caps.forEach((cap, i) => { if (!bid && this.leader !== i + 1 && cap >= this.price + L.inc && this.rng() < 0.45) { this.price += L.inc; this.leader = i + 1; this.idle = 0; bid = true; this.msg = `${BIDDERS[i]} bids ${this.price}`; } });
      if (!bid) { this.idle++; if (this.idle >= (this.leader === -1 ? 4 : 3)) this.hammer(); }
    }
  }
  hammer() {
    const L = this.lot; this.phase = 'sold'; this.pt = 0;
    if (this.leader === 0) { this.spent += this.price; this.value += L.v; this.wins.push({ id: L.id, price: this.price, value: L.v }); this.msg = `SOLD to you for ${this.price}!`; if (this.o.onLot) this.o.onLot(L, this.price); }
    else if (this.leader > 0) this.msg = `Sold to ${BIDDERS[this.leader - 1]} for ${this.price}.`;
    else this.msg = 'No bids. The crate is withdrawn.';
  }
  next() {
    this.li++;
    if (this.li >= this.lots.length) { this.done = true; const tv = this.lots.reduce((a, l) => a + l.v, 0); this.score = this.wins.length ? Math.max(0, Math.min(1, 0.4 + (this.value - this.spent) / (tv * 0.5))) : 0.2; this.result = { text: `${this.wins.length} crates won, ${this.spent} coins spent` }; return; }
    Object.assign(this, { phase: 'show', pt: 0, idle: 0, leader: -1, price: this.lot.start, msg: '' });
  }
  finish() { if (!this.done) { this.done = true; this.score = this.wins.length ? 0.4 : 0.1; } }
  draw(g, sprite) {
    rect(g, K.navy[1], 0, 0, 320, 224); rect(g, K.sky[1], 0, 0, 320, 70); rect(g, K.water[2], 0, 70, 320, 12);
    rect(g, K.wood[2], 0, 130, 320, 94); rect(g, K.wood[3], 0, 130, 320, 3);
    drawText(g, 'HARBOUR AUCTION', 8, 6, K.butter[3], 1, null); drawText(g, `Lot ${Math.min(this.li + 1, 5)}/5`, 250, 6, K.paper[4], 1, null);
    const L = this.lot; rect(g, K.paper[4], 100, 40, 120, 80); rect(g, K.ink[2], 100, 40, 120, 1); rect(g, K.ink[2], 100, 119, 120, 1);
    rect(g, K.wood[3], 140, 52, 40, 30); rect(g, K.wood[4], 140, 52, 40, 4); rect(g, K.paper[3], 156, 52, 8, 30);
    drawTextC(g, L.name.toUpperCase(), 160, 100, K.ink[1], 1, null); drawTextC(g, `Looks worth about ${r5(L.v * 0.8)} to ${r5(L.v * 1.3)}`, 160, 110, K.ink[3], 1, null);
    drawText(g, `PRICE ${this.price}`, 20, 140, K.butter[3], 1, null);
    drawText(g, `LEADER: ${this.leader === 0 ? 'YOU' : this.leader > 0 ? BIDDERS[this.leader - 1].toUpperCase() : 'NOBODY'}`, 20, 152, this.leader === 0 ? K.mint[3] : K.paper[4], 1, null);
    drawText(g, `BUDGET LEFT ${this.budget - this.spent}`, 20, 164, K.paper[4], 1, null); drawText(g, this.msg, 20, 182, K.coral[3], 1, null);
    rect(g, this.canBid() ? K.mint[2] : K.charcoal[2], 230, 160, 80, 36); drawTextC(g, 'BID (SPACE)', 270, 174, K.ink[1], 1, null);
  }
}
const bot = (m, t, inp) => { if (m.canBid() && m.price + m.lot.inc <= m.lot.v * 0.85 && Math.floor(t * 4) !== m.botT) { m.botT = Math.floor(t * 4); inp.pressed = new Set([' ']); } return inp; };
register('minigame', 'sv5_auction', { title: 'Harbour Auction', resultTitle: 'HAMMER DOWN!', make: (g, o) => new AuctionGame(g, o), bot });
