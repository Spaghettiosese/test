// Travelling merchant: Mimi's cart in the park (Fri + Sun, 10 AM to 7 PM) and a rare night boat at the harbour dock
// (about one evening in seven, 8 PM to midnight). Stock is seeded per day: rare seeds, a recipe, furniture, a one-off treasure.
import { register, get, all, features } from '../../core/registry.js';
import { spr, RAMPS as K } from '../town/lib.js';
import { spotPos } from '../../systems/festivals.js';
import { shopOpen } from '../economy/core.js';
import { S, say, N, call, pick, has } from './state.js';

// ---------------------------------------------------------------- sprites
const awning = (R, fl) => {
  for (let i = 0; i < 9; i++) { R(2 + i * 6, 6, 6, 8, i % 2 ? K.paper[4] : K.coral[2]); R(2 + i * 6, 14, 6, 2 + (i % 2), i % 2 ? K.paper[3] : K.coral[1]); }
  R(2, 5, 54, 1, K.coral[3]); R(1, 2, 2, 22, K.wood[1]); R(55, 2, 2, 22, K.wood[1]);
  for (let i = 0; i < 6; i++) R(6 + i * 9, 1 + (fl ? (i % 2) : 1 - (i % 2)), 4, 3, [K.butter[3], K.lilac[3], K.sky[3]][i % 3]);
  R(4, 1, 50, 1, K.wood[0]);
};
function cartSprite(name, fl) {
  spr(name, 58, 50, (R) => {
    awning(R, fl);
    R(3, 24, 52, 14, K.wood[3]); R(3, 24, 52, 2, K.wood[4]); R(3, 36, 52, 2, K.wood[1]); R(3, 30, 52, 1, K.wood[2]);
    for (const x of [8, 24, 40]) { R(x, 20, 10, 5, [K.coral[3], K.forest[3], K.butter[3]][(x / 16) | 0]); R(x + 1, 18, 8, 3, K.paper[4]); }
    R(30, 17, 4, 4, K.ribbon[2]); R(12, 38, 2, 8, K.wood[1]); R(44, 38, 2, 8, K.wood[1]);
    for (const x of [10, 46]) { R.e(x, 42, 6, 6, K.wood[0]); R.e(x, 42, 4, 4, K.wood[2]); R(x, 38, 1, 8, K.wood[0]); R(x - 4, 42, 9, 1, K.wood[0]); }
    R(54, 28, 3, 10, K.metal[2]); R(0, 28, 4, 3, K.metal[2]);
  });
}
cartSprite('svl_cart_a', true); cartSprite('svl_cart_b', false);
function merchant(name, f) {
  spr(name, 22, 38, (R) => {
    R.e(11, 36, 7, 2, K.ink[3]);
    R(6, 20, 10, 15, K.lilac[2]); R(6, 20, 10, 2, K.lilac[3]); R(6, 33, 10, 2, K.lilac[0]); R(10, 22, 2, 12, K.butter[3]);
    R(7, 34, 3, 3, K.ink[2]); R(12, 34, 3, 3, K.ink[2]);
    R(5, 22 + f, 3, 9, K.lilac[1]); R(14, f ? 14 : 22, 3, f ? 9 : 9, K.lilac[1]);
    R.e(11, 13, 5, 5, '#e8b890'); R(7, 11, 8, 2, '#e8b890'); R(8, 14, 1, 1, K.ink[0]); R(13, 14, 1, 1, K.ink[0]); R(10, 17, 3, 1, K.coral[1]);
    R(5, 6, 12, 5, K.butter[3]); R(3, 10, 16, 2, K.butter[2]); R(9, 3, 4, 3, K.butter[4]); R(6, 9, 10, 1, K.butter[1]);
    R(6, 19, 10, 3, K.coral[2]);
  }, { outline: 'selective' });
}
merchant('svl_merchant_a', 0); merchant('svl_merchant_b', 1);
spr('svl_boat', 64, 40, (R) => {
  R(2, 26, 60, 8, K.wood[2]); R(0, 22, 6, 6, K.wood[3]); R(58, 22, 6, 6, K.wood[3]); R(4, 33, 56, 3, K.wood[0]); R(2, 26, 60, 2, K.wood[4]);
  R(31, 2, 2, 24, K.wood[1]); R(33, 4, 16, 12, K.paper[4]); R(33, 4, 16, 2, K.coral[2]); R(33, 14, 16, 2, K.paper[2]);
  R(12, 16, 12, 10, K.wood[3]); R(13, 17, 10, 2, K.wood[4]); R(15, 12, 2, 4, K.ink[2]);
  R(46, 18, 3, 8, K.metal[2]); R(47, 14, 1, 4, K.metal[1]); R(45, 12, 5, 4, K.butter[4]); R(46, 13, 3, 2, K.butter[3]);
  R(4, 22, 20, 4, K.lilac[3]); R(6, 21, 6, 1, K.lilac[4]);
});
spr('svl_lantern_hang', 8, 14, (R) => { R(3, 0, 2, 3, K.metal[2]); R(1, 3, 6, 8, K.coral[2]); R(2, 4, 4, 6, K.butter[4]); R(1, 3, 6, 1, K.coral[3]); R(1, 10, 6, 1, K.coral[1]); R(3, 11, 2, 3, K.coral[3]); });

// ---------------------------------------------------------------- stock
const RARE_ONE = ['min_meteorite', 'gift_music_box', 'gift_vinyl_record', 'furn_star_tree', 'gift_compass', 'book_star_atlas', 'fish_ice_lantern', 'gift_watch_chain', 'min_moonstone', 'gift_retro_cartridge'];
const knownRecipes = (g) => Object.keys((g.state.hobbies && g.state.hobbies.recipes) || {});
function stockFor(g, boat) {
  const r = g.rngFor(boat ? 'svboat_stock' : 'svcart_stock'), out = [], used = new Set();
  const add = (id, mult, lo = 0.9, hi = 1.35) => {
    const it = get('item', id); if (!it || used.has(id)) return; used.add(id);
    const base = Math.max(it.price || 30, 20), price = Math.round((base * mult * (lo + r() * (hi - lo))) / 5) * 5;
    out.push({ item: id, price: Math.max(price, 25), limit: 1 });
  };
  const seeds = all('item').filter((i) => i.cat === 'seed').sort((a, b) => b.price - a.price).slice(0, 14);
  const furn = all('item').filter((i) => i.id.startsWith('furn_') && i.price >= (boat ? 400 : 240)).map((i) => i.id);
  const rare = RARE_ONE.filter(has);
  if (boat) { for (let k = 0; k < 2; k++) add(pick(r, rare), 2.4, 1.1, 1.8); for (let k = 0; k < 2; k++) add(pick(r, furn), 1.5); add(pick(r, all('item').filter((i) => i.cat === 'mineral').map((i) => i.id)), 2.2); }
  else { for (let k = 0; k < 3; k++) if (seeds.length) add(pick(r, seeds).id, 5, 1, 2); for (let k = 0; k < 2; k++) add(pick(r, furn), 1.2); add(pick(r, rare), 2.6, 1.2, 2); }
  return out;
}
function recipeSlot(g, boat, n) {
  const r = g.rngFor(boat ? 'svboat_rec' : 'svcart_rec'), known = new Set(knownRecipes(g));
  const pool = all('recipe').filter((x) => !known.has(x.id)).sort((a, b) => a.id.localeCompare(b.id));
  if (!pool.length) return null;
  for (let i = 0; i < n; i++) r();
  return pool[Math.floor(r() * pool.length)];
}
function recipeService(boat, n) {
  return {
    id: `svl_recipe_${boat ? 'b' : 'c'}${n}`, icon: 'i_quest',
    get name() { const g = this.g; const rc = g && recipeSlot(g, boat, n); return rc ? `Recipe: ${rc.name}` : 'Recipe card (sold out)'; },
    desc: 'A handwritten recipe card from far away.',
    when(g) { this.g = g; return !!recipeSlot(g, boat, n); },
    price(g) { const rc = recipeSlot(g, boat, n); return rc ? 350 + 40 * ((rc.skill | 0) + 1) + (boat ? 250 : 0) : 0; },
    run(g) { const rc = recipeSlot(g, boat, n); if (!rc || !g.learnRecipe || !g.learnRecipe(rc.id, boat ? 'night boat' : 'travelling cart')) return false; g.stat('svRecipesBought'); return true; },
  };
}
const KEEP_C = { name: 'Mimi', look: { hair: '#c9763a', top: '#8a5fc0', bottom: '#4a3a5a', skin: '#e8b890', accent: '#ffd76a' } };
const KEEP_B = { name: 'Old Nagi', look: { hair: '#dcdce8', top: '#2a4a6a', bottom: '#2a2a3a', skin: '#c68a62', accent: '#e8c838' } };
register('shop', 'sv_cart', {
  name: 'Mimi\'s Travelling Cart', owner: null, keeper: KEEP_C, hours: ['10:00', '19:00'], days: [4, 6], closedWeather: ['storm'], color: K.coral[2], buys: ['gift', 'mineral', 'shell'], bonusCats: ['mineral'],
  greet: { default: ['Fresh off the road! Rare things, one of each, and no refunds on wishes.', 'Mimi the wanderer! I only stop here on Fridays and Sundays, so choose well.', 'Seeds from three valleys over. Do not ask how I got them.'], thanks: ['A treasure! Take care of it.', 'My cart is lighter, my heart is heavier.'], sold: ['Oh, how nice. I will find a home for it.'] },
  stock: [], stockFn: (g) => stockFor(g, false),
  get services() { return this._svc ||= [recipeService(false, 0), recipeService(false, 1)]; },
});
register('shop', 'sv_boat', {
  name: 'The Night Boat', owner: null, keeper: KEEP_B, hours: ['20:00', '24:00'], closedWeather: ['storm'], color: K.navy ? K.navy[2] : K.lilac[2], buys: ['gift', 'mineral', 'fish'], bonusCats: ['fish'],
  greet: { default: ['Shh. The moon is listening. What can an old sailor sell you?', 'Treasures from the other side of the tide. Only tonight.', 'I was never here, you never saw me, and the price is fair.'], thanks: ['The sea is generous.', 'Sail well.'] },
  stock: [], stockFn: (g) => stockFor(g, true),
  get services() { return this._svc ||= [recipeService(true, 0)]; },
});
// is the night boat in port tonight? (about 1 evening in 7, never in storms)
export const boatTonight = (g) => g.weather !== 'storm' && g.rngFor('svboat')() < 0.15;
export const cartOpen = (g) => shopOpen(g, get('shop', 'sv_cart'));
export const boatOpen = (g) => boatTonight(g) && shopOpen(g, get('shop', 'sv_boat'));
const POS = { park: { spot: 'lawn', dx: 0, dy: 0, mx: 2, my: 1, open: cartOpen, shop: 'sv_cart', who: 'Mimi', cartSpr: true },
  harbour: { spot: 'dock', dx: -2, dy: 0, mx: 1, my: 0, open: boatOpen, shop: 'sv_boat', who: 'Old Nagi' } };
const anchor = (w) => { const c = POS[w.map.id]; return c && c.open(w.game) ? { c, p: spotPos(w.map.id, c.spot, c.dx, c.dy), m: spotPos(w.map.id, c.spot, c.dx + c.mx, c.dy + c.my) } : null; };

register('worldLayer', 'svl_cart', {
  sprites(world, game) {
    const a = anchor(world); if (!a || !a.p) return [];
    const f = Math.floor(game.clock * 2) % 2, out = [];
    out.push({ y: a.p.y, draw: () => { world.shadow(a.p.x, a.p.y, a.c.cartSpr ? 26 : 28); world.drawFeet(a.c.cartSpr ? (f ? 'svl_cart_a' : 'svl_cart_b') : 'svl_boat', a.p.x, a.p.y); if (!a.c.cartSpr) world.drawFeet('svl_lantern_hang', a.p.x + 20, a.p.y - 12); } });
    out.push({ y: a.m.y + 1, draw: () => { world.shadow(a.m.x, a.m.y, 8); world.drawFeet(Math.floor(game.clock * 1.5) % 2 ? 'svl_merchant_a' : 'svl_merchant_b', a.m.x, a.m.y); } });
    return out;
  },
  solids(world) { const a = anchor(world); return a && a.p && a.c.cartSpr ? [[a.p.x - 22, a.p.y - 8, 44, 8]] : []; },
});
register('targetProvider', 'svl_cart', {
  find(world, game) {
    const a = anchor(world); if (!a || !a.m) return null;
    const d = Math.hypot(a.m.x - world.player.x, a.m.y - world.player.y);
    if (d > 38) return null;
    return { label: a.c.cartSpr ? 'Browse the travelling cart' : 'Hail the night boat', dist: d, x: a.m.x, y: a.m.y - 20, run: (g) => visit(g, a.c) };
  },
});
function visit(g, c) {
  const s = S(g).cart, key = c.shop, first = !s.bought[key + '_met'];
  s.bought[key + '_met'] = 1;
  const intro = first ? [say(null, null, c.cartSpr ? 'A merchant in a wide yellow hat waves from behind a cart stacked with crates.' : 'A lantern bobs at the dock. A weathered sailor tips his cap from a tiny boat.'),
    say('misa', 'surprised', c.cartSpr ? 'A travelling cart! It looks like it came from the other side of the world.' : 'A boat at night? Is this even legal?')] : [];
  return g.run([...intro, call(() => { g.stat(c.cartSpr ? 'cartVisits' : 'boatVisits'); }), { t: 'shop', id: c.shop }]);
}
export function initCart(game) {
  (game.extraLights ||= []).push((world) => { const a = anchor(world); return a && a.p ? [{ kind: 'lantern', x: a.p.x + (a.c.cartSpr ? 0 : 20), y: a.p.y - 24 }] : []; });
  game.bus.on('hour', () => { if (game.world && game.world.refreshRects) game.world.refreshRects(); });
  game.bus.on('mapEnter', ({ map }) => {
    const m = map || (game.world && game.world.map.id), c = POS[m];
    if (c && c.open(game) && S(game).cart.toastDay !== game.day + ':' + m) { S(game).cart.toastDay = game.day + ':' + m; game.toast(c.cartSpr ? 'The travelling cart is here!' : 'A mysterious boat is at the dock tonight...', 'i_star'); }
  });
}
register('system', 'svl_cart', { init: initCart });
register('boardNote', 'svl_cart_note', { title: 'Travelling cart', text: 'Mimi the wanderer parks her cart in the park every Friday and Sunday, 10 AM to 7 PM. Rare seeds, recipes and furniture. One of each!', color: K.lilac[3] });
register('boardNote', 'svl_boat_note', { title: 'Night boat?', text: 'Fishermen whisper about a lantern boat that visits the harbour dock some evenings after 8 PM. Nobody agrees on when.', color: K.sky[3], when: 'stat:cartVisits>=1' });

features('Town Life', [
  'Travelling cart: Mimi the wanderer sets up in the park on Fridays and Sundays (10 AM to 7 PM) with an animated, flag-flapping cart',
  'Mimi\'s cart stock is seeded per day: three rare seeds, two furniture pieces and one expensive one-off treasure at varied prices',
  'The cart sells hand-written recipe cards you have not learned yet, two per visit',
  'Mimi\'s cart is a solid prop with a lantern that glows at dusk, and it closes in thunderstorms',
  'A rare night boat ties up at the harbour dock about one evening in seven (8 PM to midnight) with old Captain Nagi',
  'The night boat sells pricier treasures, a mineral and a recipe card, and buys fish and gifts',
  'A toast announces the cart or the boat when you walk onto the map while they are open',
  'The town board carries a note about Mimi\'s cart, and a hint about the night boat once you have met her',
]);
