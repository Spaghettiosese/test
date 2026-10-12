// Job minigames, part 1 (economy area): Cafe Kumo shift (take orders and serve) and Sunny Mart cashier
// (scan heavy things first so fragile ones end up on top of the bag, then count out the change).
// Instances follow the minigame interface: update(dt, input, game), draw(g, sprite, game), done, score 0..1, result.
import { Buttons, clickBtn, topBar, hint, itemDraw, drawPerson, emote, Pops, rect, disc, panel, btn, drawText, drawTextC, measure, C, RAMPS, clamp, starGlyph } from './kit.js';

// =============================================================== CAFE KUMO
const DRINKS = [{ id: 'bev_latte', name: 'Latte' }, { id: 'bev_matcha_latte', name: 'Matcha' }, { id: 'bev_cocoa', name: 'Cocoa' }, { id: 'bev_earl_grey', name: 'Tea' }];
const SIZES = ['S', 'M', 'L'];
const CAKES = [{ id: 'snack_strawberry_shortcake', name: 'Shortcake' }, { id: 'snack_cheesecake', name: 'Cheese' }, { id: 'snack_choco_cake', name: 'Choco' }];
const SPOTS = [64, 160, 256];

export class CafeShift {
  constructor(game, { rank = 1, tired = false } = {}) {
    this.game = game; this.rng = game.rng; this.rank = clamp(rank, 1, 5); this.tired = tired;
    this.useSize = this.rank >= 2; this.useCake = this.rank >= 3;
    this.total = Math.min(9, 4 + this.rank); this.spawned = 0; this.results = [];
    this.cust = [null, null, null]; this.tray = { d: -1, s: -1, c: -1 }; this.wait = 0.6;
    this.t = 0; this.done = false; this.score = 0; this.btns = new Buttons(); this.pops = new Pops(); this.steam = 0;
    this.layout();
  }
  layout() {
    const b = [];
    DRINKS.forEach((d, i) => b.push({ id: 'd' + i, x: 8 + i * 33, y: 160, w: 31, h: 26, kind: 'd', i }));
    if (this.useSize) SIZES.forEach((s, i) => b.push({ id: 's' + i, x: 145 + i * 21, y: 160, w: 19, h: 26, kind: 's', i }));
    if (this.useCake) CAKES.forEach((c, i) => b.push({ id: 'c' + i, x: 214 + i * 33, y: 160, w: 31, h: 26, kind: 'c', i }));
    b.push({ id: 'clear', x: 8, y: 191, w: 58, h: 16, kind: 'clear' });
    this.cust.forEach((c, i) => b.push({ id: 'cust' + i, x: SPOTS[i] - 34, y: 32, w: 68, h: 96, kind: 'cust', i, disabled: !c || c.state !== 'wait' }));
    this.btns.set(b);
  }
  newOrder() {
    const r = this.rng;
    return { d: Math.floor(r() * 4), s: this.useSize ? Math.floor(r() * 3) : -1, c: this.useCake && r() < 0.6 ? Math.floor(r() * 3) : -1 };
  }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt; this.pops.update(dt); this.steam += dt;
    // arrivals
    this.wait -= dt;
    const free = this.cust.findIndex((c) => !c);
    if (free >= 0 && this.spawned < this.total && this.wait <= 0) {
      const patMax = Math.max(14, 30 - this.rank * 3);
      this.cust[free] = { idx: Math.floor(this.rng() * 8), order: this.newOrder(), pat: patMax, patMax, state: 'wait', t: 0 };
      this.spawned++; this.wait = 1.6 + this.rng() * 2.2;
    }
    for (let i = 0; i < 3; i++) {
      const c = this.cust[i]; if (!c) continue;
      c.t += dt;
      if (c.state === 'wait') { c.pat -= dt; if (c.pat <= 0) { c.state = 'leave'; c.t = 0; this.results.push(0); this.pops.add('Maybe next time!', SPOTS[i], 70, C.sky); } }
      else if (c.t > 1.3) this.cust[i] = null;
    }
    this.layout();
    const hit = this.btns.update(input);
    if (hit) {
      const b = this.btns.get(hit);
      if (b.kind === 'd') { this.tray.d = b.i; game.sfx('pour'); }
      if (b.kind === 's') { this.tray.s = b.i; game.sfx('blip'); }
      if (b.kind === 'c') { this.tray.c = b.i; game.sfx('blip'); }
      if (b.kind === 'clear') { this.tray = { d: -1, s: -1, c: -1 }; game.sfx('back'); }
      if (b.kind === 'cust') this.serve(b.i, game);
    }
    // number keys serve customers 1-3
    for (let i = 0; i < 3; i++) if (input.pressed.has(String(i + 1))) this.serve(i, game);
    if (this.spawned >= this.total && this.cust.every((c) => !c)) {
      this.done = true;
      const raw = this.results.reduce((a, b) => a + b, 0) / this.total;
      this.score = clamp(this.tired ? Math.min(raw, 0.7) : raw, 0, 1);
      const happy = this.results.filter((r) => r >= 0.7).length;
      this.result = { text: `${happy} of ${this.total} customers left smiling` };
    }
  }
  serve(i, game) {
    const c = this.cust[i];
    if (!c || c.state !== 'wait' || this.tray.d < 0) return;
    const o = c.order, t = this.tray;
    const ok = o.d === t.d && (o.s < 0 || o.s === t.s) && (o.c < 0 ? t.c < 0 : o.c === t.c);
    const v = ok ? 0.7 + 0.3 * (c.pat / c.patMax) : 0.35;
    this.results.push(v); c.state = ok ? 'happy' : 'meh'; c.t = 0;
    this.pops.add(ok ? (v > 0.9 ? 'Perfect!' : 'Thank you!') : 'Hmm, close enough!', SPOTS[i], 70, ok ? C.gold : C.sky);
    game.sfx(ok ? 'chime' : 'wrong');
    this.tray = { d: -1, s: -1, c: -1 };
  }
  draw(g) {
    // wall, window, menu board
    rect(g, RAMPS.lilac[3], 0, 19, 320, 100);
    for (let x = 0; x < 320; x += 12) rect(g, RAMPS.lilac[4], x, 19, 4, 100);
    rect(g, RAMPS.wood[1], 0, 104, 320, 3);
    rect(g, RAMPS.woodDark[2], 8, 26, 40, 34); rect(g, RAMPS.sky[3], 10, 28, 36, 30); rect(g, RAMPS.sky[4], 10, 28, 36, 8); rect(g, RAMPS.woodDark[2], 27, 28, 2, 30);
    rect(g, RAMPS.chalkboard[1], 272, 26, 42, 36); rect(g, RAMPS.chalkboard[2], 274, 28, 38, 32);
    drawText(g, 'MENU', 285, 31, RAMPS.chalkboard[4], 1, null); for (let i = 0; i < 3; i++) rect(g, RAMPS.chalkboard[3], 278, 40 + i * 6, 22 + (i % 2) * 8, 1);
    // customers
    this.cust.forEach((c, i) => {
      if (!c) return;
      const x = SPOTS[i] + (c.state === 'leave' || c.state === 'meh' || c.state === 'happy' ? Math.round(c.t * c.t * 40) * (i === 0 ? -1 : 1) : 0);
      drawPerson(g, c.idx, x, 130, c.t, c.state === 'happy' ? 'happy' : 'idle');
      if (c.state === 'happy') emote(g, x + 14, 70, 'heart');
      if (c.state === 'leave') emote(g, x + 14, 70, 'sweat');
    });
    // counter
    rect(g, RAMPS.wood[3], 0, 112, 320, 4); rect(g, RAMPS.wood[2], 0, 116, 320, 34); rect(g, RAMPS.wood[1], 0, 148, 320, 3);
    for (let x = 6; x < 320; x += 40) rect(g, RAMPS.wood[1], x, 120, 1, 26);
    // order bubbles
    this.cust.forEach((c, i) => {
      if (!c || c.state !== 'wait') return;
      const o = c.order, n = 1 + (o.c >= 0 ? 1 : 0), w = 14 + n * 22 + (o.s >= 0 ? 8 : 0), x = SPOTS[i] - Math.floor(w / 2), y = 24;
      const focus = this.btns.isFocus('cust' + i);
      panel(g, x, y, w, 30, 'card'); rect(g, C.paperHi, SPOTS[i] - 2, y + 30, 5, 3); rect(g, C.ink, SPOTS[i] - 1, y + 33, 3, 1);
      itemDraw(g, DRINKS[o.d].id, x + 15, y + 12);
      if (o.s >= 0) drawText(g, SIZES[o.s], x + 25, y + 13, C.coralD, 1, null);
      if (o.c >= 0) itemDraw(g, CAKES[o.c].id, x + w - 15, y + 12);
      const p = c.pat / c.patMax;
      rect(g, C.paper1, x + 4, y + 24, w - 8, 3); rect(g, p > 0.5 ? C.mint : p > 0.25 ? C.gold : C.coral, x + 4, y + 24, Math.round((w - 8) * p), 3);
      drawText(g, String(i + 1), x + 3, y + 3, RAMPS.ink[3], 1, null);
      if (focus) { rect(g, C.gold, x - 2, y - 2, w + 4, 1); rect(g, C.gold, x - 2, y + 31, w + 4, 1); }
    });
    // tray
    panel(g, 124, 118, 72, 26, 'card');
    drawText(g, 'Tray', 128, 121, RAMPS.ink[3], 1, null);
    if (this.tray.d >= 0) { itemDraw(g, DRINKS[this.tray.d].id, 140, 134); for (let k = 0; k < 2; k++) rect(g, '#ffffff', 138 + k * 4, 122 - (Math.floor(this.steam * 6 + k * 3) % 5), 1, 2); }
    if (this.tray.s >= 0) drawText(g, SIZES[this.tray.s], 151, 133, C.coralD, 1, null);
    if (this.tray.c >= 0) itemDraw(g, CAKES[this.tray.c].id, 176, 134);
    // buttons
    rect(g, RAMPS.paper[2], 0, 151, 320, 62); rect(g, RAMPS.paper[1], 0, 151, 320, 1);
    for (const b of this.btns.list) {
      if (b.kind === 'cust') continue;
      const on = this.btns.isFocus(b.id), sel = (b.kind === 'd' && this.tray.d === b.i) || (b.kind === 's' && this.tray.s === b.i) || (b.kind === 'c' && this.tray.c === b.i);
      btn(g, b.x, b.y, b.w, b.h, b.kind === 's' ? SIZES[b.i] : b.kind === 'clear' ? 'Clear' : '', { hover: on, tone: sel ? 'mint' : 'paper', focus: on, t: this.t });
      if (b.kind === 'd') itemDraw(g, DRINKS[b.i].id, b.x + b.w / 2, b.y + 12 - (on ? 1 : 0));
      if (b.kind === 'c') itemDraw(g, CAKES[b.i].id, b.x + b.w / 2, b.y + 12 - (on ? 1 : 0));
    }
    drawText(g, 'Drink', 10, 154, RAMPS.ink[2], 1, null);
    if (this.useSize) drawText(g, 'Size', 147, 154, RAMPS.ink[2], 1, null);
    if (this.useCake) drawText(g, 'Cake', 216, 154, RAMPS.ink[2], 1, null);
    drawText(g, 'Fill the tray, then click the customer (or press 1-3)', 72, 197, RAMPS.ink[2], 1, null);
    this.pops.draw(g);
    topBar(g, 'Cafe Kumo shift', `Customer ${Math.min(this.total, this.results.length + 1)}/${this.total}`, this.results.length / this.total);
  }
}
export function cafeBot(m, t, input) {
  if ((m._bt = (m._bt || 0) - 1) > 0) return input;
  m._bt = 9;
  const c = m.cust.map((c, i) => ({ c, i })).filter((x) => x.c && x.c.state === 'wait').sort((a, b) => a.c.pat - b.c.pat)[0];
  if (!c) return input;
  const o = c.c.order, tr = m.tray;
  if (tr.d !== o.d) return clickBtn(input, m.btns.get('d' + o.d));
  if (o.s >= 0 && tr.s !== o.s) return clickBtn(input, m.btns.get('s' + o.s));
  if (o.c >= 0 && tr.c !== o.c) return clickBtn(input, m.btns.get('c' + o.c));
  return clickBtn(input, m.btns.get('cust' + c.i));
}

// =============================================================== SUNNY MART CASHIER
const HEAVY = ['ing_rice', 'ing_milk', 'ing_cabbage', 'ing_potato', 'bev_water', 'ing_pumpkin', 'bev_sports_drink'];
const FRAGILE = ['ing_egg', 'ing_bread', 'snack_pudding', 'snack_melon_bread', 'snack_cookies', 'ing_tomato', 'ing_strawberry'];
const NORMAL = ['snack_potato_chips', 'ing_soy', 'ing_noodles', 'ing_curry', 'snack_choco_bar', 'ing_tea', 'ing_salt', 'bev_green_tea', 'snack_rice_crackers'];
const COINS = [500, 100, 50, 10, 5];
import { get } from '../../core/registry.js';
const priceOf = (id) => { const it = get('item', id); return it ? it.buy || it.price * 2 : 50; };

export class MartShift {
  constructor(game, { rank = 1, tired = false } = {}) {
    Object.assign(this, { game, rng: game.rng, rank: clamp(rank, 1, 5), tired, t: 0, done: false, score: 0, results: [], btns: new Buttons(), pops: new Pops() });
    this.total = Math.min(5, 2 + this.rank); this.n = 0;
    this.next();
  }
  next() {
    const r = this.rng, k = Math.min(7, 3 + Math.min(this.rank, 3)), items = [];
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    items.push({ id: pick(HEAVY), w: 'heavy' }, { id: pick(FRAGILE), w: 'fragile' });
    while (items.length < k) { const roll = r(); items.push(roll < 0.3 ? { id: pick(HEAVY), w: 'heavy' } : roll < 0.6 ? { id: pick(FRAGILE), w: 'fragile' } : { id: pick(NORMAL), w: 'normal' }); }
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    items.forEach((it, i) => { it.price = priceOf(it.id); it.slot = i; });
    const total = items.reduce((a, b) => a + b.price, 0);
    const paid = total < 500 && r() < 0.5 ? 500 : Math.ceil((total + 1) / 1000) * 1000;
    this.cur = { idx: Math.floor(r() * 8), items, bag: [], total, paid, given: [], phase: 'scan', t: 0, mood: 'idle' };
    this.layout();
  }
  layout() {
    const c = this.cur, b = [];
    if (c.phase === 'scan') c.items.forEach((it, i) => { if (!c.bag.includes(it)) b.push({ id: 'it' + i, x: 108 + i * 29, y: 112, w: 26, h: 28, kind: 'item', it }); });
    if (c.phase === 'change') {
      COINS.forEach((v, i) => b.push({ id: 'coin' + v, x: 110 + i * 34, y: 166, w: 31, h: 22, kind: 'coin', v }));
      b.push({ id: 'undo', x: 110, y: 192, w: 50, h: 16, kind: 'undo' });
      b.push({ id: 'give', x: 214, y: 192, w: 96, h: 16, kind: 'give' });
    }
    this.btns.set(b);
  }
  get givenSum() { return this.cur.given.reduce((a, b) => a + b, 0); }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt; this.pops.update(dt);
    const c = this.cur; c.t += dt;
    if (c.phase === 'bye') { if (c.t > 1.2) { this.n++; if (this.n >= this.total) return this.finish(); this.next(); } return; }
    const hit = this.btns.update(input);
    if (!hit) return;
    const b = this.btns.get(hit);
    if (b.kind === 'item') {
      c.bag.push(b.it); game.sfx('blip'); this.pops.add(`${b.it.price}`, b.x + 13, b.y, C.gold);
      if (c.bag.length === c.items.length) { c.phase = 'change'; c.t = 0; game.sfx('select'); }
      this.layout();
    } else if (b.kind === 'coin') { c.given.push(b.v); game.sfx('coin'); }
    else if (b.kind === 'undo') { c.given.pop(); game.sfx('back'); }
    else if (b.kind === 'give') {
      const due = c.paid - c.total, exact = this.givenSum === due;
      let bad = 0;
      c.bag.forEach((it, i) => { if (it.w === 'fragile') bad += c.bag.slice(i + 1).filter((x) => x.w === 'heavy').length; });
      const order = bad ? 0.5 : 1, change = exact ? 1 : 0.4;
      const v = 0.4 * order + 0.6 * change;
      this.results.push(v);
      c.phase = 'bye'; c.t = 0; c.mood = v > 0.8 ? 'happy' : 'idle';
      this.pops.add(exact ? (bad ? 'Eggs got a bit squished...' : 'Perfect!') : 'Hm, the change was off. Thanks anyway!', 70, 60, exact && !bad ? C.gold : C.sky);
      game.sfx(v > 0.8 ? 'chime' : 'wrong');
      this.btns.set([]);
    }
  }
  finish() {
    this.done = true;
    const raw = this.results.reduce((a, b) => a + b, 0) / this.total;
    this.score = clamp(this.tired ? Math.min(raw, 0.7) : raw, 0, 1);
    this.result = { text: `${this.results.filter((r) => r > 0.8).length} of ${this.total} perfect checkouts` };
  }
  draw(g) {
    const c = this.cur;
    // shop shelves
    rect(g, RAMPS.butter[4], 0, 19, 320, 86);
    const prod = [RAMPS.coral[2], RAMPS.sky[2], RAMPS.mint[2], RAMPS.butter[2], RAMPS.lilac[2], RAMPS.forest[3]];
    for (let s = 0; s < 3; s++) { const y = 30 + s * 24; rect(g, RAMPS.metal[2], 96, y + 16, 224, 3); for (let i = 0; i < 26; i++) { const h = 8 + ((i * 7 + s * 3) % 6); rect(g, prod[(i + s) % 6], 100 + i * 8, y + 16 - h, 6, h); rect(g, '#ffffff', 101 + i * 8, y + 17 - h, 1, 2); } }
    rect(g, RAMPS.butter[2], 0, 19, 320, 6); drawTextC(g, 'SUNNY MART', 160, 20, RAMPS.butter[0], 1, null);
    // customer
    drawPerson(g, c.idx, 52 + (c.phase === 'bye' ? -Math.round(c.t * c.t * 50) : 0), 112, c.t, c.mood);
    if (c.phase === 'bye' && c.mood === 'happy') emote(g, 64 - Math.round(c.t * c.t * 50), 52, 'heart');
    // register display
    panel(g, 6, 22, 80, 24, 'night');
    drawText(g, 'TOTAL', 12, 27, C.sky, 1, null);
    const sum = c.bag.reduce((a, b) => a + b.price, 0), st = String(c.phase === 'scan' ? sum : c.total);
    drawText(g, st, 80 - measure(st), 27, C.gold, 1, null);
    if (c.phase !== 'scan') { drawText(g, 'PAID', 12, 36, C.sky, 1, null); drawText(g, String(c.paid), 80 - measure(String(c.paid)), 36, C.text, 1, null); }
    // counter and belt
    rect(g, RAMPS.metal[1], 0, 104, 320, 4); rect(g, RAMPS.metal[3], 0, 108, 320, 40); rect(g, RAMPS.charcoal[2], 100, 110, 220, 34);
    for (let x = 100 + (Math.floor(this.t * 20) % 10); x < 320; x += 10) rect(g, RAMPS.charcoal[3], x, 110, 1, 34);
    rect(g, RAMPS.ribbon[2], 92, 110, 6, 34); rect(g, RAMPS.ribbon[4], 93, 112, 4, 2);
    for (const b of this.btns.list) if (b.kind === 'item') {
      const on = this.btns.isFocus(b.id);
      panel(g, b.x, b.y - (on ? 2 : 0), b.w, b.h, on ? { ink: C.gold, fill: C.paperHi, hi: '#ffffff', lo: C.paper2, shadow: 'rgba(30,22,36,.5)' } : 'card');
      itemDraw(g, b.it.id, b.x + 13, b.y + 11 - (on ? 2 : 0));
      if (b.it.w === 'heavy') { rect(g, RAMPS.charcoal[2], b.x + 2, b.y + 19 - (on ? 2 : 0), measure('KG') + 4, 8); drawText(g, 'KG', b.x + 4, b.y + 20 - (on ? 2 : 0), C.text, 1, null); }
      if (b.it.w === 'fragile') { rect(g, C.coral, b.x + 2, b.y + 19 - (on ? 2 : 0), 8, 8); drawTextC(g, '!', b.x + 6, b.y + 20 - (on ? 2 : 0), C.text, 1, null); }
    }
    // bag
    rect(g, RAMPS.paper[2], 0, 148, 320, 65); rect(g, RAMPS.paper[1], 0, 148, 320, 1);
    rect(g, RAMPS.sand[1], 14, 152, 76, 56); rect(g, RAMPS.sand[3], 16, 154, 72, 52); rect(g, RAMPS.sand[1], 14, 152, 76, 3);
    c.bag.forEach((it, i) => itemDraw(g, it.id, 28 + (i % 3) * 24, 196 - Math.floor(i / 3) * 18));
    drawText(g, 'Bag', 19, 157, RAMPS.sand[0], 1, null);
    if (c.phase === 'scan') {
      drawText(g, 'Click items to scan them. Heavy (KG) first,', 104, 158, C.ink, 1, null);
      drawText(g, 'fragile (!) last so they sit on top!', 104, 168, C.ink, 1, null);
    } else if (c.phase === 'change') {
      const due = c.paid - c.total;
      drawText(g, `Change due: ${due}`, 104, 154, C.coralD, 1, null);
      drawText(g, `Counted: ${this.givenSum}`, 214, 154, this.givenSum === due ? RAMPS.forest[1] : C.ink, 1, null);
    }
    for (const b of this.btns.list) {
      const on = this.btns.isFocus(b.id);
      if (b.kind === 'coin') { btn(g, b.x, b.y, b.w, b.h, '', { hover: on, focus: on, t: this.t }); disc(g, b.v >= 100 ? RAMPS.metal[2] : RAMPS.butter[1], b.x + 9, b.y + 11, 6); disc(g, b.v >= 100 ? RAMPS.metal[3] : RAMPS.butter[2], b.x + 9, b.y + 11, 4); drawText(g, String(b.v), b.x + 16, b.y + 9, C.ink, 1, null); }
      if (b.kind === 'undo') btn(g, b.x, b.y, b.w, b.h, 'Undo', { hover: on, focus: on, t: this.t });
      if (b.kind === 'give') btn(g, b.x, b.y, b.w, b.h, 'Hand over', { hover: on, focus: on, t: this.t, tone: 'mint' });
    }
    this.pops.draw(g);
    topBar(g, 'Sunny Mart register', `Customer ${Math.min(this.total, this.n + 1)}/${this.total}`, this.n / this.total);
  }
}
export function martBot(m, t, input) {
  if ((m._bt = (m._bt || 0) - 1) > 0) return input;
  m._bt = 8;
  const c = m.cur;
  if (c.phase === 'scan') {
    const left = c.items.filter((it) => !c.bag.includes(it)), rank = { heavy: 0, normal: 1, fragile: 2 };
    left.sort((a, b) => rank[a.w] - rank[b.w]);
    return clickBtn(input, m.btns.get('it' + left[0].slot));
  }
  if (c.phase === 'change') {
    const need = c.paid - c.total - m.givenSum;
    if (need === 0) return clickBtn(input, m.btns.get('give'));
    if (need < 0) return clickBtn(input, m.btns.get('undo'));
    const v = COINS.find((x) => x <= need);
    return clickBtn(input, m.btns.get('coin' + v));
  }
  return input;
}
void starGlyph;
