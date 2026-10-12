// Shop scene (economy area). Open with game.open('shop', shopId, onDone) or the script step { t:'shop', id }.
// Shop registry schema (documented here, registered from src/content/economy/shops.js and by any area):
//   register('shop', id, {
//     name, owner: npcId | keeperId, keeper?: { name, look }, machine?: true (vending machines draw no person),
//     greet?: { default: [...], morning, afternoon, evening, night, rain, sale, h4 (4+ hearts with the owner) } | (game) => string,
//     thanks?: [...], hours?: ['9:00','17:00'], closed?: [weekdayIdx], days?: [weekdayIdx], when?: Cond, closedWeather?: [...],
//     stock: [itemId | { item, price?, when?, limit? (per week), stickers? (pay in Star Stickers) }],
//     stockFn?(game) -> more entries (runtime stock, e.g. every item tagged 'furniture'),
//     services?: [{ id, name, desc, price, icon, when?(game), run(game) -> false to cancel }],
//     buys?: ['fish', 'crop', ...] categories it buys (or ['all']), buyTags?: [...], bonusCats?: [...] (+10% when selling those),
//     mode?: 'ship' (shipping box: items are paid tomorrow), color?: header accent
//   })
import { register, get, all } from '../core/registry.js';
import { image, recolor, lookPairs } from '../gfx/chars.js';
import { drawPortrait } from './portraits.js';
import { SPRITES } from '../art.js';
import { sprite } from '../artcache.js';
import { rect, panel, btn, icon, slot, wrapPx, fit, header, coinGlyph, starGlyph, scrollbar, inside, K, C, RAMPS, drawText, drawTextC, measure } from '../content/economy/gfx.js';
import { buyPrice, sellPrice, weeklySale, saleCatOf, SALE_CATS, noteSold, hoursText, charge, pay, weekOf } from '../content/economy/core.js';

const swapped = {};
// Keeper portrait: the cast portrait when the owner is a registered NPC, else a palette swap of Misa's portrait
// sheet using the keeper's look, else a soft silhouette.
export function drawKeeper(g, shop, mood, mouth, blink, x, y) {
  const owner = shop.owner;
  if (shop.machine) return drawMachine(g, x, y, shop.color || RAMPS.coral[2]);
  if (owner && get('npc', owner) && drawPortrait(g, owner, mood, mouth, blink, x, y)) return true;
  const look = shop.keeper && shop.keeper.look, base = image('misa_portraits');
  if (look && base) {
    const key = shop.keeper.name;
    const img = swapped[key] ||= recolor(base, lookPairs(look));
    const row = { neutral: 0, happy: 1, surprised: 2, sad: 3 }[mood] ?? 0;
    g.drawImage(img, (mouth * 2 + blink) * 64, row * 64, 64, 64, x, y, 64, 64);
    return true;
  }
  rect(g, RAMPS.lilac[3], x, y, 64, 64);
  const c = (look && look.top) || RAMPS.lilac[1];
  rect(g, c, x + 14, y + 44, 36, 20); rect(g, (look && look.hair) || RAMPS.ink[2], x + 20, y + 14, 24, 28);
  return false;
}
function drawMachine(g, x, y, c) {
  rect(g, RAMPS.sky[3], x, y, 64, 64);
  rect(g, c, x + 10, y + 4, 44, 60); rect(g, RAMPS.coral[3], x + 10, y + 4, 44, 3);
  rect(g, '#d8f0ff', x + 14, y + 10, 36, 30);
  const cans = [RAMPS.ribbon[2], RAMPS.sky[1], RAMPS.forest[3], RAMPS.butter[2], RAMPS.mint[2], RAMPS.woodDark[3]];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { rect(g, cans[(i + r * 2) % 6], x + 16 + i * 6, y + 13 + r * 14, 4, 9); rect(g, '#ffffff', x + 16 + i * 6, y + 14 + r * 14, 1, 3); rect(g, C.coral, x + 16 + i * 6, y + 23 + r * 14, 4, 1); }
  rect(g, C.deep, x + 14, y + 46, 22, 10); rect(g, RAMPS.butter[2], x + 40, y + 46, 8, 4); rect(g, C.ink, x + 42, y + 52, 4, 6);
  return true;
}

// Normalised buy rows for a shop: items (with price, condition, weekly limit) and services.
export function shopRows(game, shop) {
  const out = [], seen = new Set();
  const entries = [...(shop.stock || []), ...(shop.stockFn ? shop.stockFn(game) || [] : [])];
  // other areas can list items in a shop with item.shop / item.shops
  for (const it of all('item')) if ((it.shop === shop.id || (it.shops || []).includes(shop.id)) && !entries.some((e) => (typeof e === 'string' ? e : e.item) === it.id)) entries.push(it.id);
  for (const e0 of entries) {
    const e = typeof e0 === 'string' ? { item: e0 } : e0, def = get('item', e.item);
    if (!def || seen.has(e.item) || (e.when && !game.check(e.when))) continue;
    seen.add(e.item);
    const left = e.limit ? e.limit - boughtThisWeek(game, shop.id, e.item) : Infinity;
    out.push({ kind: 'item', id: e.item, def, price: e.stickers ? e.stickers : buyPrice(game, e.item, shop.id, e), stickers: !!e.stickers, left, sale: !e.price && weeklySale(game) === saleCatOf(e.item) });
  }
  for (const s of shop.services || []) if (!s.when || s.when(game)) out.push({ kind: 'service', id: s.id, def: s, price: typeof s.price === 'function' ? s.price(game) : s.price, left: Infinity });
  return out;
}
function boughtThisWeek(game, shopId, id) { const v = game.state.economy.visits[`b:${shopId}:${id}`]; return v && v.w === weekOf(game.day) ? v.n : 0; }
function noteBought(game, shopId, id, n) { const k = `b:${shopId}:${id}`, w = weekOf(game.day), v = game.state.economy.visits[k]; game.state.economy.visits[k] = { w, n: (v && v.w === w ? v.n : 0) + n }; }
export function canSell(game, shop, id) {
  const it = get('item', id);
  if (!it || it.key || it.noSell || !it.price || game.state.economy.favs[id]) return false;
  const buys = shop.buys || [];
  return buys.includes('all') || buys.includes(it.cat) || (shop.buyTags || []).some((t) => (it.tags || []).includes(t));
}
export function sellRows(game, shop) {
  return Object.entries(game.state.inv).filter(([id, n]) => n > 0 && canSell(game, shop, id))
    .map(([id, n]) => ({ kind: 'sell', id, def: get('item', id), n, price: sellPrice(game, id, shop.mode === 'ship' ? 'shipbox' : shop.id) }))
    .sort((a, b) => (a.def.cat || '').localeCompare(b.def.cat || '') || a.def.name.localeCompare(b.def.name));
}
function boxRows(game) {
  return Object.entries(game.state.economy.shipBox).map(([id, n]) => ({ kind: 'box', id, def: get('item', id), n, price: sellPrice(game, id, 'shipbox') })).filter((r) => r.def);
}
function pickLine(game, shop, key) {
  const gr = shop.greet;
  if (typeof gr === 'function') return gr(game);
  if (!gr) return 'Welcome!';
  const pools = [];
  if (gr.h4 && shop.owner && game.hearts(shop.owner) >= 4) pools.push(gr.h4);
  if (key && gr[key]) pools.push(gr[key]);
  if (gr.rain && /rain|storm/.test(game.weather)) pools.push(gr.rain);
  if (gr[game.part]) pools.push(gr[game.part]);
  if (gr.sale) pools.push(gr.sale.map((l) => l.replace('{sale}', SALE_CATS[weeklySale(game)].toLowerCase())));
  pools.push(gr.default || ['Welcome!']);
  const pool = pools[Math.floor(Math.random() * Math.min(2, pools.length))];
  return pool[Math.floor(Math.random() * pool.length)];
}

const L = { list: { x: 80, y: 70, w: 146, rows: 9, rh: 14 }, det: { x: 230, y: 56, w: 84, h: 144 } };

class ShopScene {
  constructor(game, shopId, onDone) {
    const shop = get('shop', shopId);
    if (!shop) throw new Error(`unknown shop ${shopId}`);
    this.name = 'shop'; this.music = shop.music; Object.assign(this, { game, shop, onDone, t: 0, sel: 0, top: 0, qty: 1, tab: 0, focus: 'list', floaters: [], blinkT: 3 });
    this.tabs = shop.mode === 'ship' ? ['Ship', 'In the box'] : shop.buyOnly ? ['Buy'] : ((shop.buys && shop.buys.length) || (shop.buyTags && shop.buyTags.length) ? ['Buy', 'Sell'] : ['Buy']);
    if (shop.sellOnly) this.tabs = ['Sell'];
    this.say(pickLine(game, shop, 'default'), 'happy');
    this.refresh();
  }
  get tabName() { return this.tabs[this.tab]; }
  say(text, mood = 'neutral') { this.line = text || ''; this.shown = 0; this.mood = mood; }
  refresh() {
    const g = this.game, n = this.tabName;
    this.rows = n === 'Buy' ? shopRows(g, this.shop) : n === 'In the box' ? boxRows(g) : sellRows(g, this.shop);
    this.sel = Math.max(0, Math.min(this.sel, this.rows.length - 1));
    this.fixScroll(); this.clampQty();
  }
  fixScroll() { const r = L.list.rows; if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + r) this.top = this.sel - r + 1; this.top = Math.max(0, Math.min(this.top, Math.max(0, this.rows.length - r))); }
  get cur() { return this.rows[this.sel]; }
  maxQty() {
    const r = this.cur, g = this.game;
    if (!r) return 0;
    if (r.kind === 'service') return 1;
    if (r.kind === 'item') { const afford = r.stickers ? Math.floor(g.count('star_sticker') / Math.max(1, r.price)) : Math.floor(g.money / Math.max(1, r.price)); return Math.max(0, Math.min(99, afford, r.left, r.def.cat === 'tool' || r.def.cat === 'clothes' || r.def.cat === 'decor' ? 1 : 99)); }
    return r.n;
  }
  clampQty() { this.qty = Math.max(1, Math.min(this.qty, Math.max(1, this.maxQty()))); }
  close() { this.game.sfx('back'); this.game.scenes.pop(this); this.onDone && this.onDone(); }
  switchTab(i) { this.tab = (i + this.tabs.length) % this.tabs.length; this.sel = 0; this.top = 0; this.qty = 1; this.refresh(); this.game.sfx('blip'); }

  act() {
    const g = this.game, r = this.cur, shop = this.shop;
    if (!r) return;
    const q = this.qty;
    if (r.kind === 'service') {
      if (g.money < r.price) { this.say(shop.broke || 'Oh dear, not quite enough coins.', 'sad'); g.sfx('wrong'); return; }
      const ok = r.def.run(g, this);
      if (ok === false) return;
      if (r.price) charge(g, r.price, `${shop.name}: ${r.def.name}`);
      this.float(-r.price, false); g.sfx('buy');
      this.afterTrade();
      if (typeof ok === 'string') this.say(ok, 'happy'); else this.say(pickLine(g, shop, 'thanks') || 'Thank you!', 'happy');
      this.refresh(); return;
    }
    if (r.kind === 'item') {
      if (this.maxQty() < 1) { if (r.left <= 0) this.say('Sold out this week, sorry! More next week.', 'sad'); else this.say(r.stickers ? 'You need a few more Star Stickers for that one.' : (shop.broke || 'Oh dear, not quite enough coins.'), 'sad'); g.sfx('wrong'); return; }
      const cost = r.price * q;
      if (r.stickers) g.take('star_sticker', cost); else charge(g, cost, `${shop.name}: ${q > 1 ? q + 'x ' : ''}${r.def.name}`);
      g.give(r.id, q, true);
      if (r.left !== Infinity) noteBought(g, shop.id, r.id, q);
      g.state.economy.stats.bought += q;
      g.toast(`Bought ${q > 1 ? q + ' ' : ''}${r.def.name}`, r.def.icon);
      this.float(-cost, r.stickers); g.sfx('buy');
      g.bus.emit('shopBuy', { shop: shop.id, item: r.id, n: q, cost });
      this.afterTrade();
      if (shop.onBuy) shop.onBuy(g, r.id, q, this);
      this.say(pickLine(g, shop, 'thanks'), 'happy');
    } else if (r.kind === 'sell') {
      const gain = r.price * q;
      g.take(r.id, q);
      if (shop.mode === 'ship') {
        g.state.economy.shipBox[r.id] = (g.state.economy.shipBox[r.id] || 0) + q;
        this.say(`In the box! Pip pays about ${gain} coins in the morning.`, 'happy'); g.sfx('pop');
      } else {
        pay(g, gain, `Sold ${q > 1 ? q + 'x ' : ''}${r.def.name} at ${shop.name}`, true);
        noteSold(g, r.id, q); this.float(gain, false); g.sfx('coin');
        g.bus.emit('shopSell', { shop: shop.id, item: r.id, n: q, gain });
        this.afterTrade();
        this.say(pickLine(g, shop, 'sold') || 'Lovely, thank you!', 'happy');
      }
    } else if (r.kind === 'box') {
      const box = g.state.economy.shipBox; box[r.id] -= q; if (box[r.id] <= 0) delete box[r.id];
      g.give(r.id, q, true); g.sfx('blip'); this.say('Taken back out of the box.', 'neutral');
    }
    this.qty = 1; this.refresh();
  }
  afterTrade() {
    const g = this.game, owner = this.shop.owner, v = g.state.economy.visits;
    if (owner && get('npc', owner) && v['f:' + owner] !== g.day) { v['f:' + owner] = g.day; g.addFriend(owner, 8); }
  }
  float(n, stickers) { this.floaters.push({ n, stickers, t: 0 }); }

  update(dt, input, game) {
    this.t += dt; this.shown += dt * 45; this.blinkT -= dt; if (this.blinkT < -0.15) this.blinkT = 2.5 + Math.random() * 2;
    this.floaters = this.floaters.filter((f) => (f.t += dt) < 1.2);
    const k = input.pressed, n = this.rows.length;
    if (K.back(input) || (input.justDown && inside(input.mx, input.my, 296, 2, 18, 12))) return this.close();
    if (k.has('tab') || k.has(']') || k.has('r')) this.switchTab(this.tab + 1);
    if (k.has('q') || k.has('[')) this.switchTab(this.tab - 1);
    if (input.justDown) this.tabs.forEach((_, i) => { const tw = Math.floor(L.list.w / this.tabs.length); if (inside(input.mx, input.my, L.list.x + i * tw, 56, tw, 12) && i !== this.tab) this.switchTab(i); });
    if (n) {
      if (K.down(input)) { this.sel = (this.sel + 1) % n; this.qty = 1; this.fixScroll(); game.sfx('blip'); }
      if (K.up(input)) { this.sel = (this.sel + n - 1) % n; this.qty = 1; this.fixScroll(); game.sfx('blip'); }
      if (input.wheel) { this.top = Math.max(0, Math.min(Math.max(0, n - L.list.rows), this.top + Math.sign(input.wheel))); }
      const { x, y, w, rows, rh } = L.list, i = Math.floor((input.my - y) / rh) + this.top;
      if (inside(input.mx, input.my, x, y, w, rows * rh) && i >= 0 && i < n && (input.moved || input.justDown)) { if (this.sel !== i) this.qty = 1; this.sel = i; if (input.justDown && this.lastRow === i && this.t - this.lastClick < 0.35) this.act(); if (input.justDown) { this.lastRow = i; this.lastClick = this.t; } }
      if (K.right(input) || k.has('+') || k.has('=')) { this.qty = Math.min(Math.max(1, this.maxQty()), this.qty + 1); game.sfx('blip'); }
      if (K.left(input) || k.has('-')) { this.qty = Math.max(1, this.qty - 1); game.sfx('blip'); }
      const d = L.det, qy = d.y + 104;
      if (input.justDown && inside(input.mx, input.my, d.x + 4, qy, 14, 12)) this.qty = Math.max(1, this.qty - 1);
      if (input.justDown && inside(input.mx, input.my, d.x + 66, qy, 14, 12)) this.qty = Math.min(Math.max(1, this.maxQty()), this.qty + 1);
      if ((input.justDown && inside(input.mx, input.my, d.x + 4, d.y + 122, d.w - 8, 16)) || k.has('enter') || k.has(' ') || k.has('e')) this.act();
      this.hoverAct = inside(input.mx, input.my, d.x + 4, d.y + 122, d.w - 8, 16);
    }
    this.clampQty();
  }

  draw(g, game) {
    const shop = this.shop, accent = shop.color || C.coral;
    // backdrop: warm wallpaper with a soft stripe pattern
    rect(g, RAMPS.paper[2], 0, 0, 320, 224);
    for (let x = 0; x < 320; x += 16) rect(g, RAMPS.paper[3], x, 17, 8, 207);
    header(g, shop.name);
    rect(g, accent, 0, 15, 320, 2);
    const coinsTxt = String(game.money); coinGlyph(g, 286 - measure(coinsTxt), 4); drawText(g, coinsTxt, 297 - measure(coinsTxt), 5, C.text, 1, null);
    rect(g, C.coral, 300, 3, 14, 10); drawTextC(g, 'X', 307, 5, C.text, 1, null);
    // keeper portrait
    panel(g, 6, 22, 68, 68, 'paper');
    const talking = this.shown < this.line.length;
    drawKeeper(g, shop, this.mood, talking && Math.floor(this.t * 8) % 2 ? 1 : 0, this.blinkT < 0 ? 1 : 0, 8, 24);
    const kname = shop.machine ? 'Drinks' : shop.keeper ? shop.keeper.name : (get('npc', shop.owner) || {}).name || shop.name;
    const tw = Math.min(68, measure(kname) + 8);
    rect(g, accent, 6 + (68 - tw) / 2, 86, tw, 9); drawTextC(g, fit(kname, 64), 40, 88, C.text, 1, null);
    // side info
    let iy = 100;
    for (const l of wrapPx(hoursText(shop), 66).slice(0, 3)) { drawText(g, l, 7, iy, RAMPS.ink[2], 1, null); iy += 8; }
    iy += 3;
    const sale = SALE_CATS[weeklySale(game)];
    if (!shop.mode && !shop.machine) { rect(g, C.coral, 6, iy, 68, 18); drawTextC(g, 'Weekly sale', 40, iy + 3, C.text, 1, null); drawTextC(g, fit(`${sale} -20%`, 66), 40, iy + 10, RAMPS.butter[3], 1, null); iy += 22; }
    const used = Object.keys(game.state.inv).filter((id) => { const d = get('item', id); return d && !d.key; }).length;
    drawText(g, `Bag ${used}/${game.state.bagSize}`, 7, iy, RAMPS.ink[2], 1, null); iy += 9;
    starGlyph(g, 7, iy); drawText(g, `x${game.count('star_sticker')}`, 16, iy + 1, RAMPS.ink[2], 1, null); iy += 10;
    if (shop.mode === 'ship') { const box = Object.values(game.state.economy.shipBox).reduce((a, b) => a + b, 0); drawText(g, `In box: ${box}`, 7, iy, RAMPS.ink[2], 1, null); }
    if (shop.id === 'cafe') { drawText(g, 'Loyalty card', 7, iy, RAMPS.ink[2], 1, null); for (let i = 0; i < 10; i++) { const x = 7 + (i % 5) * 13, y = iy + 9 + Math.floor(i / 5) * 10; rect(g, C.paper1, x, y, 10, 8); rect(g, i < game.state.economy.loyalty ? C.coral : C.paperHi, x + 1, y + 1, 8, 6); } }
    // speech bubble
    panel(g, 80, 22, 234, 30, 'night');
    rect(g, 'rgba(43,29,46,.94)', 77, 32, 3, 6); rect(g, C.deep, 76, 32, 1, 6);
    const lines = wrapPx(this.line, 222); let budget = Math.floor(this.shown);
    lines.slice(0, 3).forEach((l, i) => { const s = l.slice(0, Math.max(0, budget)); budget -= l.length + 1; if (s) drawText(g, s, 86, 27 + i * 8, C.text); });
    // tabs
    const tabW = Math.floor(L.list.w / this.tabs.length);
    this.tabs.forEach((t, i) => { const on = i === this.tab, x = L.list.x + i * tabW; rect(g, C.ink, x, 56, tabW - 1, 13); rect(g, on ? C.paper : RAMPS.paper[1], x + 1, 57, tabW - 3, on ? 12 : 11); drawTextC(g, t, x + tabW / 2 - 1, 60, on ? C.ink : RAMPS.ink[2], 1, null); });
    // list
    const { x, y, w, rows, rh } = L.list;
    panel(g, x, y - 1, w, rows * rh + 4, 'paper');
    if (!this.rows.length) {
      const msg = this.tabName === 'Buy' ? 'Nothing for sale right now.' : this.tabName === 'In the box' ? 'The box is empty.' : 'Nothing in your bag that they buy.';
      wrapPx(msg, w - 16).forEach((l, i) => drawTextC(g, l, x + w / 2, y + 40 + i * 9, RAMPS.ink[3], 1, null));
    }
    for (let r = 0; r < rows; r++) {
      const i = this.top + r, row = this.rows[i];
      if (!row) break;
      const yy = y + 1 + r * rh, on = i === this.sel;
      if (on) { rect(g, RAMPS.butter[3], x + 2, yy, w - 6, rh); rect(g, RAMPS.butter[2], x + 2, yy + rh - 1, w - 6, 1); }
      const ic = row.def.icon;
      if (ic && SPRITES[ic]) { const s = SPRITES[ic]; g.drawImage(sprite(ic), x + 3 + Math.round((16 - s.w) / 2), yy + Math.round((rh - s.h) / 2)); }
      const pTxt = row.kind === 'box' ? `x${row.n}` : `${row.price}${row.stickers ? '' : 'c'}`;
      const pw = measure(pTxt) + (row.stickers ? 9 : 0);
      const dim = row.kind === 'item' && (row.left <= 0 || (row.stickers ? game.count('star_sticker') < row.price : game.money < row.price));
      drawText(g, fit(row.def.name + (row.n > 1 && row.kind === 'sell' ? ` x${row.n}` : ''), w - 30 - pw), x + 21, yy + 4, dim ? RAMPS.ink[3] : C.ink, 1, null);
      if (row.stickers) starGlyph(g, x + w - 6 - pw, yy + 3);
      drawText(g, pTxt, x + w - 5 - measure(pTxt), yy + 4, row.sale ? C.coralD : dim ? RAMPS.ink[3] : RAMPS.wood[1], 1, null);
      if (row.sale) rect(g, C.coral, x + 19, yy + 2, 1, rh - 4);
    }
    scrollbar(g, x + w - 3, y + 1, rows * rh, this.top, rows, this.rows.length);
    // detail
    const d = L.det, r = this.cur;
    panel(g, d.x, d.y, d.w, d.h, 'paper');
    if (r) {
      slot(g, d.x + 4, d.y + 4, r.def.icon, 0);
      const owned = r.kind === 'service' ? '' : `Own ${game.count(r.id)}`;
      drawText(g, owned, d.x + 28, d.y + 6, RAMPS.ink[2], 1, null);
      if (r.def.cat) drawText(g, r.def.cat, d.x + 28, d.y + 15, RAMPS.ink[3], 1, null);
      const nl = wrapPx(r.def.name, d.w - 8).slice(0, 2);
      nl.forEach((l, i) => drawText(g, l, d.x + 4, d.y + 28 + i * 8, C.coralD, 1, null));
      const extra = [];
      if (r.def.energy) extra.push(`+${r.def.energy} energy`);
      wrapPx(r.def.desc || '', d.w - 8).slice(0, 6 - nl.length).forEach((l, i) => drawText(g, l, d.x + 4, d.y + 30 + nl.length * 8 + i * 8, C.ink, 1, null));
      if (extra.length) drawText(g, extra[0], d.x + 4, d.y + 92, RAMPS.forest[1], 1, null);
      if (r.left !== Infinity && r.left !== undefined && r.kind === 'item') drawText(g, r.left > 0 ? `${r.left} left this week` : 'Sold out', d.x + 4, d.y + 92, C.coralD, 1, null);
      const max = this.maxQty();
      if (r.kind !== 'service') {
        btn(g, d.x + 4, d.y + 104, 14, 12, '-', { disabled: this.qty <= 1 });
        drawTextC(g, `x${this.qty}`, d.x + d.w / 2, d.y + 107, C.ink, 1, null);
        btn(g, d.x + 66, d.y + 104, 14, 12, '+', { disabled: this.qty >= max });
      }
      const verb = { item: 'Buy', service: 'Get', sell: this.shop.mode === 'ship' ? 'Ship' : 'Sell', box: 'Take' }[r.kind];
      const total = r.kind === 'box' ? '' : r.kind === 'service' ? ` ${r.price}c` : ` ${r.price * this.qty}${r.stickers ? '*' : 'c'}`;
      btn(g, d.x + 4, d.y + 122, d.w - 8, 16, verb + total, { focus: true, hover: this.hoverAct, disabled: (r.kind === 'item' && max < 1) || (r.kind === 'service' && game.money < r.price), t: this.t, tone: r.kind === 'sell' ? 'mint' : 'paper' });
    }
    for (const f of this.floaters) { const txt = `${f.n > 0 ? '+' : ''}${f.n}${f.stickers ? ' stars' : 'c'}`; drawText(g, txt, 270 - measure(txt), 20 - Math.round(f.t * 8) + 0, f.n > 0 ? RAMPS.forest[3] : RAMPS.coral[3]); }
    drawText(g, 'Up/down pick  left/right amount  Enter buy  Tab switch  Esc leave', 6, 211, RAMPS.ink[2], 1, null);
  }
}
register('scene', 'shop', { make: (game, shopId, onDone) => new ShopScene(game, shopId, onDone) });
