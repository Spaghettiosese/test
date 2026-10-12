// Economy area core: save data, prices (seasonal, weekly sale, fish market swings), buffs, wallet history,
// the home shipping box, Star Stickers from home tasks, and the `job:<id>` condition kind.
//
// Services added to `game` (other areas may call them; all optional-safe):
//   game.buyPrice(itemId, shopId?, entry?)  game.sellPrice(itemId, shopId?)   game.moneyNote(text)  (labels the next money change)
//   game.econ  -> the economy save slice    game.addBuff(id, minutes)  game.hasBuff(id)
//   game.shopOpen(shopId) -> bool           game.shopHours(shopId) -> 'Open 9:00 AM - 5:00 PM, closed Sun'
//   game.giveStickers(n, why)
// Bus events emitted: shopBuy {shop, item, n, cost}, shopSell {shop, item, n, gain}, shipped {items, total}, jobShift, requestDone
import { register, get, all, features } from '../../core/registry.js';
import { addCondKind, COND_KINDS } from '../../core/cond.js';
import { clockText, WEEKDAYS, seasonOf, parseHM } from '../../core/time.js';
import { rect, drawText, C, disc } from './gfx.js';

export const abs = (game) => game.day * 1440 + game.minutes;
export const weekOf = (day) => Math.floor((day - 1) / 7);
const round5 = (n) => (n < 20 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5);

register('stateSlice', 'economy', {
  default: () => ({
    history: [], jar: 0, jarPaidWeek: 0, goal: 'bike',
    shipBox: {}, lastShip: null,
    sold: { week: 0, n: {} },
    visits: {}, loyalty: 0, loyaltyFree: 0,
    buffs: {}, favs: {},
    vendingCoinDay: 0, gacha: 0,
    requests: { day: 0, board: [], active: [], done: 0, weekly: null, nextId: 1 },
    catalogue: { orders: [], bought: {} },
    jobs: { booked: [], log: [] },
    stats: { bought: 0, sold: 0, spent: 0, earned: 0 },
  }),
});

// ------------------------------------------------------------------ sale categories and prices
export const SALE_CATS = {
  snacks: 'Snacks', drinks: 'Drinks', ingredients: 'Ingredients', materials: 'Craft materials', gifts: 'Gifts', books: 'Books', tools: 'Tools', treats: 'Pet treats',
};
export function saleCatOf(id) {
  const it = get('item', id) || {}, tags = it.tags || [];
  if (tags.includes('pet')) return 'treats';
  if (id.startsWith('ing_')) return 'ingredients';
  if (id.startsWith('bev_')) return 'drinks';
  if (id.startsWith('snack_') || id.startsWith('food_')) return 'snacks';
  if (it.cat === 'material') return 'materials';
  if (it.cat === 'gift') return 'gifts';
  if (it.cat === 'book') return 'books';
  if (it.cat === 'tool') return 'tools';
  return null;
}
export function weeklySale(game) {
  const keys = Object.keys(SALE_CATS), r = game.rngFor('econ_sale', weekOf(game.day) * 7 + 1);
  return keys[Math.floor(r() * keys.length)];
}
const inSeason = (it, season) => Array.isArray(it.seasons) && it.seasons.includes(season);
export function seasonalMult(game, it, selling) {
  if (!Array.isArray(it.seasons)) return 1;
  if (inSeason(it, game.season)) return selling ? 0.9 : 0.85;
  return selling ? 1.1 : 1.25;
}
export function buyPrice(game, id, shopId, entry) {
  const it = get('item', id);
  if (!it) return 0;
  let p = (entry && entry.price) ?? it.buy ?? round5(Math.max(10, (it.price || 5) * 2.2));
  p *= seasonalMult(game, it, false);
  if (weeklySale(game) === saleCatOf(id) && !(entry && entry.price)) p *= 0.8;
  if (shopId === 'mart' && game.hearts('sachiko') >= 8) p *= 0.95;
  return round5(p);
}
// Fish prices swing +-15% with the season (fixed per fish and season) and drop 2% per fish of that kind sold this week (to -20%).
export function fishSwing(game, id) {
  const r = game.rngFor('econ_fish_' + id, Math.floor((game.day - 1) / 28) * 28 + 1)();
  return 0.85 + r * 0.3;
}
export function sellPrice(game, id, shopId) {
  const it = get('item', id);
  if (!it || it.noSell || it.key || !it.price) return 0;
  let p = it.price;
  if (it.cat === 'fish') {
    const sold = game.state.economy.sold;
    const n = sold.week === weekOf(game.day) ? sold.n[id] || 0 : 0;
    p *= fishSwing(game, id) * Math.max(0.8, 1 - n * 0.02);
  } else p *= seasonalMult(game, it, true);
  const shop = shopId && get('shop', shopId);
  if (shop && shop.bonusCats && shop.bonusCats.includes(it.cat)) p *= 1.1;
  return Math.max(1, Math.round(p));
}
export function noteSold(game, id, n) {
  const s = game.state.economy.sold, w = weekOf(game.day);
  if (s.week !== w) { s.week = w; s.n = {}; }
  s.n[id] = (s.n[id] || 0) + n;
  game.state.economy.stats.sold += n;
}

// ------------------------------------------------------------------ opening hours
// shop.hours: [open, close] ('9:00', '17:00'); shop.closed: [weekday idx 0=Mon]; shop.days: only these weekdays;
// shop.when: Cond. Close may exceed 24:00 for late carts.
export function shopOpen(game, shop) {
  if (!shop) return false;
  if (shop.days && !shop.days.includes(game.weekday)) return false;
  if (shop.closed && shop.closed.includes(game.weekday)) return false;
  if (shop.when && !game.check(shop.when)) return false;
  if (shop.closedWeather && shop.closedWeather.includes(game.weather)) return false;
  if (shop.hours) { const [a, b] = shop.hours.map(parseHM); if (game.minutes < a || game.minutes >= b) return false; }
  return true;
}
const DAYN = WEEKDAYS;
export function hoursText(shop) {
  const parts = [];
  const short = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`; };
  if (shop.hours) { const [a, b] = shop.hours.map(parseHM); parts.push(`${short(a)} - ${short(b)}`); }
  if (shop.days) parts.push(shop.days.map((d) => DAYN[d] + 's').join(', ') + ' only');
  if (shop.closed && shop.closed.length) parts.push('closed ' + shop.closed.map((d) => DAYN[d]).join(', '));
  if (shop.hoursNote) parts.push(shop.hoursNote);
  return parts.join(', ') || 'Always open';
}

// ------------------------------------------------------------------ buffs
export const BUFFS = {
  perk: { name: 'Energized', desc: '+1 energy every 10 minutes', mins: 120, color: '#ffd76a' },
  cozy: { name: 'Cozy glow', desc: '+1 cozy every 10 minutes', mins: 180, color: '#f29aa0' },
  calm: { name: 'Calm focus', desc: '+20% tips on job shifts', mins: 180, color: '#86cdb0' },
  cool: { name: 'Cooled down', desc: '+1 energy every 20 minutes', mins: 120, color: '#7fb2e0' },
  pampered: { name: 'Pampered', desc: '+1 cozy every 10 minutes', mins: 360, color: '#c9b3ff' },
};
export function addBuff(game, id, mins) {
  const b = BUFFS[id]; if (!b) return;
  game.state.economy.buffs[id] = Math.max(game.state.economy.buffs[id] || 0, abs(game)) + (mins || b.mins);
  game.toast(`${b.name}: ${b.desc}`, null);
}
export const hasBuff = (game, id) => (game.state.economy.buffs[id] || 0) > abs(game);

// ------------------------------------------------------------------ wallet history
export function pushHistory(game, delta, label) {
  const h = game.state.economy.history;
  h.unshift({ d: game.day, m: game.minutes, n: delta, t: label });
  if (h.length > 80) h.length = 80;
}
export function pay(game, n, label, quiet = false) { game._econNote = label; game.addMoney(n, quiet); }
export function charge(game, n, label) { if (game.money < n) { game.toast('Not enough coins'); return false; } game._econNote = label; game.addMoney(-n, true); return true; }
export function giveStickers(game, n, why) { if (n > 0) { game.give('star_sticker', n, true); game.toast(`+${n} Star Sticker${n > 1 ? 's' : ''}${why ? ': ' + why : ''}`, get('item', 'star_sticker').icon); game.stat('starStickers', n); } }

// ------------------------------------------------------------------ the system
register('system', 'economy', {
  init(game) {
    Object.defineProperty(game, 'econ', { get: () => game.state.economy, configurable: true });
    game.buyPrice = (id, shop, entry) => buyPrice(game, id, shop, entry);
    game.sellPrice = (id, shop) => sellPrice(game, id, shop);
    game.moneyNote = (t) => { game._econNote = t; };
    game.addBuff = (id, m) => addBuff(game, id, m);
    game.hasBuff = (id) => hasBuff(game, id);
    game.shopOpen = (id) => shopOpen(game, get('shop', id));
    game.shopHours = (id) => { const s = get('shop', id); return s ? hoursText(s) : ''; };
    game.giveStickers = (n, why) => giveStickers(game, n, why);
    game.bus.on('moneyChanged', (e) => {
      if (!e.delta) return;
      const label = game._econNote || (e.delta > 0 ? 'Coins received' : 'Coins spent');
      game._econNote = null;
      pushHistory(game, e.delta, label);
      const st = game.state.economy.stats;
      if (e.delta > 0) st.earned += e.delta; else st.spent -= e.delta;
    });
    // relabel money that other systems paid just before announcing why
    const relabel = (text) => { const h = game.state.economy.history[0]; if (h && h.d === game.day && /^Coins (received|spent)$/.test(h.t)) h.t = text; };
    game.bus.on('homeTask', (e) => {
      relabel('Home task allowance');
      // Star Stickers from home tasks: one for a 3-star job, one more for finishing every task of the day.
      if (e.stars >= 3 && e.id !== 'feed') giveStickers(game, 1, 'great job');
      const ht = game.state.homeTasks;
      if (ht && ht.list && ht.list.length && ht.list.every((x) => x.done) && game.flag('econ_allTasksDay') !== game.day) { game.setFlag('econ_allTasksDay', game.day); giveStickers(game, 1, 'all home tasks done'); }
    });
    game.bus.on('questDone', () => relabel('Quest reward'));
    // food buffs: any eaten item with a `buff` field (works for other areas' dishes too)
    game.bus.on('itemUsed', (e) => { const it = get('item', e.item); if (it && it.buff && e.ate) addBuff(game, it.buff); });
    game.bus.on('dayStart', () => onDayStart(game));
  },
});

function onDayStart(game) {
  const ec = game.state.economy;
  // shipping box pays out overnight
  const items = Object.entries(ec.shipBox);
  if (items.length) {
    let total = 0, count = 0;
    for (const [id, n] of items) { total += sellPrice(game, id, 'shipbox') * n; count += n; noteSold(game, id, n); }
    ec.shipBox = {};
    ec.lastShip = { day: game.day, count, total };
    pay(game, total, 'Shipping box sales', true);
    game.mail(`econ_ship_${game.day}`, 'Pip', `Morning! I picked up your shipping box: ${count} item${count > 1 ? 's' : ''} sold for ${total} coins. Paid straight into your wallet!`);
    game.bus.emit('shipped', { count, total });
  }
  // savings jar: 1% a week, paid on Mondays
  const w = weekOf(game.day);
  if (game.weekday === 0 && ec.jar > 0 && ec.jarPaidWeek !== w) {
    const interest = Math.max(1, Math.floor(ec.jar * 0.01));
    ec.jar += interest; ec.jarPaidWeek = w;
    pushHistory(game, 0, `Savings jar interest +${interest}`);
    game.toast(`Savings jar grew by ${interest} coins`, null);
  }
  // expired buffs are dropped
  for (const [k, v] of Object.entries(ec.buffs)) if (v <= abs(game)) delete ec.buffs[k];
}

// Buff ticks: every 10 in-game minutes while walking around.
let lastTick = -1;
register('worldTick', 'econ_buffs', {
  update(dt, world, game) {
    const t = abs(game), ten = Math.floor(t / 10);
    if (ten === lastTick) return;
    const first = lastTick < 0; lastTick = ten;
    if (first) return;
    if (hasBuff(game, 'perk')) game.addEnergy(1);
    if (hasBuff(game, 'cozy') || hasBuff(game, 'pampered')) game.addMood(1);
    if (hasBuff(game, 'cool') && ten % 2 === 0) game.addEnergy(1);
  },
});
// Small buff icons under the coins panel.
register('hud', 'econ_buffs', {
  draw(g, game) {
    if (!game.world || game.hideHud) return;
    const ids = Object.keys(BUFFS).filter((id) => hasBuff(game, id));
    ids.forEach((id, i) => {
      const x = 306 - i * 12, y = 28, left = Math.ceil(((game.state.economy.buffs[id] || 0) - abs(game)) / 60);
      rect(g, C.deep, x - 1, y - 1, 11, 11); disc(g, BUFFS[id].color, x + 4, y + 4, 4); rect(g, '#ffffff', x + 2, y + 2, 2, 1);
      drawText(g, String(left), x + 3, y + 11, C.text);
    });
  },
});

// job:<id> reads the job rank (0 if never worked), e.g. 'job:cafe>=2'.
if (!COND_KINDS.includes('job')) addCondKind('job', (g, a) => (g.jobRank ? g.jobRank(a) : 0));

features('Money, shops & economy', [
  'Weekly sale: one category of goods (snacks, drinks, tools...) is 20% off in every shop each week',
  'Seasonal prices: fruit and vegetables are cheaper in season and dearer out of season, and sell for a little more out of season',
  'Fish prices swing up to 15% each season per fish and drop a little for every fish of that kind you sell in a week',
  'Home shipping box: drop items in during the day and Pip pays you for them the next morning, with a message',
  'Wallet history: every coin in and out is logged with a reason (shop, wages, shipping, allowance, rewards)',
  'Savings jar that pays 1% interest every Monday',
  'Sachiko\'s family discount: 5% off at Sunny Mart once you reach 8 hearts with her',
]);
features('Skills & wellbeing', [
  'Food and drink buffs with HUD icons: Energized (coffee), Cozy glow (cakes, cocoa), Calm focus (tea), Cooled down (shaved ice)',
]);
features('Home', [
  'Star Stickers for a 3-star home task and for finishing every home task of the day',
]);
