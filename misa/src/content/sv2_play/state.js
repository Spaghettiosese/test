// Arcade & Travel (sv2_play): save slice, items and sprites shared by the arcade, bicycle, Star Drops, bounties and pocket tools.
// Save data: state.sv2 = { tickets, ticketsTotal, hs:{star,kart,kumo}, plays, ghost, bestTime, goalsMet, prizes, bike, light, watch, drops, hw }
// Events emitted: sv2ArcadePlayed { key, points, tickets }, sv2BikeRide { km }, sv2DropFound { id }, sv2BountyDone { id, type }.
// Condition kinds added: bike (owned and riding), starDrops>=N.
import { register, get } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { spr, line, signText } from '../town/lib.js';
export { say, N, call, has, giveOr, stickers, idle, pick, nameOf } from '../sv_life/state.js';

export const DEFAULT = () => ({
  tickets: 0, ticketsTotal: 0, hs: { star: [], kart: [], kumo: [] }, plays: { star: 0, kart: 0, kumo: 0 }, ghost: null, bestTime: 0, goalsMet: {}, prizes: {},
  bike: { owned: false, name: '', paint: 0, tires: 0, basket: 0, bell: 0, riding: false, parked: null, last: null, km: 0, px: 0, applied: 0, regenDay: -1, regen: 0, rides: 0 },
  light: { on: false, battery: 100 }, watch: 0,
  drops: { got: {}, pending: [], cartBought: false },
  hw: { day: -1, list: [], done: 0, seq: 1 },
});
register('stateSlice', 'sv2', { default: DEFAULT });
export const S = (g) => (g.state.sv2 ||= DEFAULT());
addCondKind('bike', (g) => !!S(g).bike.riding);
addCondKind('starDrops', (g) => Object.keys(S(g).drops.got).length);

// ---------------------------------------------------------------- items
function item(id, name, cat, price, shape, c, desc, extra = {}) {
  const { c2, ...rest } = extra;
  register('item', id, { name, cat, price, desc, icon: itemIcon(shape, { c, c2 }), ...rest });
}
item('sv2_token', 'Arcade token', 'misc', 15, 'coin', K.butter[3], 'A brass token stamped with a star. One play at any Hoshimori cabinet.', { tags: ['arcade'] });
item('sv2_battery', 'Pocket battery', 'misc', 45, 'box', K.mint[2], 'Slots into the pocket lantern for 60 more percent of light.', { use: (g) => { const l = S(g).light; if (l.battery >= 100) { g.toast('The lantern is already full.'); return true; } l.battery = Math.min(100, l.battery + 60); g.sfx('buy'); g.toast(`Lantern battery ${Math.round(l.battery)}%`); return false; } });
item('sv2_lantern', 'Pocket lantern', 'tool', 180, 'tool', K.butter[3], 'A clip-on paper lantern with a warm LED. Use it to switch it on or off.', { use: (g) => { toggleLight(g); return true; }, useLabel: 'Switch' });
item('sv2_watch', 'Pocket watch', 'tool', 220, 'tool', K.metal[3], 'A brass watch on a chain. Use it to show or hide the watch on screen.', { use: (g) => { cycleWatch(g); return true; }, useLabel: 'Show' });
item('sv2_compass', 'Little compass', 'tool', 160, 'star', K.sky[3], 'Its needle points at where you are headed. Pairs with the pocket watch.', { tags: ['gift'] });
item('sv2_bike_key', 'Bike key', 'key', 0, 'key', K.coral[2], 'The key to your bicycle. Use it to hop on or off outdoors (or press B).', { key: true, use: (g) => { g.sv2ToggleRide && g.sv2ToggleRide(); return true; }, useLabel: 'Ride' });
item('sv2_star_fruit', 'Shimmering fruit', 'food', 3000, 'fruit', K.butter[4], 'A glowing star-shaped fruit from far away. Eating it does something wonderful.', { use: (g) => { S(g).drops.cartBought = true; g.bus.emit('sv2FruitEaten', {}); return false; }, useLabel: 'Eat' });
const prize = (id, name, price, shape, c, desc, extra) => item(id, name, 'decor', price, shape, c, desc, { tags: ['cute', 'decor', 'prize'], ...extra });
prize('prize_pixel_cat', 'Pixel cat plush', 90, 'toy', K.paper[4], 'A square little cat made of felt pixels.');
prize('prize_star_keychain', 'Star keychain', 70, 'star', K.butter[3], 'Clicks cheerfully on your bag zip.');
prize('prize_cloud_plush', 'Kumo cloud plush', 130, 'toy', K.sky[3], 'The cloud-cat waiter, enormously squeezable.');
prize('prize_mini_cabinet', 'Mini arcade cabinet', 260, 'box', K.coral[2], 'A palm-sized cabinet that plays one very short song.');
prize('prize_rainbow_gum', 'Rainbow gum', 40, 'sweet', K.ribbon[2], 'Five flavours that change while you chew.', { cat: 'food', energy: 8, mood: 4, tags: ['sweet'] });
prize('prize_gold_trophy', 'Golden arcade trophy', 900, 'star', K.butter[4], 'Engraved: HOSHIMORI ARCADE CHAMPION. It weighs more than it looks.');
prize('prize_ticket_lantern', 'Ticket lantern', 180, 'star', K.coral[3], 'A lantern made of folded arcade tickets that glows when it thinks you are winning.');

// ---------------------------------------------------------------- light / watch toggles (pocket tools; the world layers live in tools.js)
export function toggleLight(g) {
  const l = S(g).light;
  if (!l.on && l.battery <= 0) { g.toast('The battery is flat. Sleep to recharge or use a Pocket battery.'); g.sfx('wrong'); return; }
  l.on = !l.on; g.sfx(l.on ? 'select' : 'back'); g.toast(l.on ? `Lantern on (${Math.round(l.battery)}%)` : 'Lantern off');
}
export function cycleWatch(g) {
  const s = S(g), max = g.has('sv2_compass') ? 2 : 1;
  s.watch = (s.watch + 1) % (max + 1); g.sfx('blip'); g.toast(['Watch hidden', 'Pocket watch on', 'Watch and compass on'][s.watch]);
}

// ---------------------------------------------------------------- sprites
const CAB = [['star', K.lilac[2], K.coral[2]], ['kart', K.sky[2], K.butter[3]], ['kumo', K.coral[2], K.mint[3]]];
for (const [id, body, glow] of CAB) {
  spr(`sv2_cab_${id}`, 30, 52, (R) => {
    R(2, 8, 26, 42, K.charcoal[1]); R(2, 8, 3, 42, body); R(25, 8, 3, 42, K.charcoal[0]);
    R(2, 0, 26, 9, body); R(2, 0, 26, 2, K.paper[4]); R(4, 3, 22, 4, K.charcoal[0]);
    signText(R, id === 'star' ? 'STAR' : id === 'kart' ? 'KART' : 'KUMO', 7, 3, glow);
    R(6, 12, 18, 16, '#0c1224'); R(7, 13, 16, 14, id === 'star' ? '#241848' : id === 'kart' ? '#587a58' : '#4a3040');
    if (id === 'star') { R(14, 20, 3, 3, K.paper[4]); R(9, 15, 2, 2, K.butter[3]); R(20, 17, 2, 2, K.paper[3]); R(11, 24, 3, 2, K.paper[1]); R(18, 14, 3, 2, K.lilac[3]); }
    if (id === 'kart') { R(11, 13, 1, 14, K.paper[3]); R(19, 13, 1, 14, K.paper[3]); R(14, 21, 4, 5, K.coral[2]); R(15, 16, 2, 2, K.butter[3]); }
    if (id === 'kumo') { R(8, 24, 14, 1, K.wood[3]); R(16, 17, 6, 1, K.wood[3]); R(11, 20, 5, 4, K.paper[4]); R(12, 19, 3, 1, K.paper[4]); R(19, 15, 2, 2, K.coral[3]); }
    R(6, 12, 18, 1, K.paper[2]);
    R(3, 30, 24, 8, K.charcoal[2]); R(3, 30, 24, 1, K.paper[1]); R.e(9, 34, 2, 2, K.ribbon[2]); R(9, 33, 1, 1, K.paper[4]); R(9, 36, 1, 3, K.metal[2]);
    R(17, 33, 3, 3, glow); R(22, 33, 3, 3, K.mint[3]);
    R(11, 40, 8, 5, K.charcoal[0]); R(14, 41, 2, 3, K.butter[3]); R(4, 46, 22, 3, K.charcoal[0]);
  });
}
spr('sv2_prize_counter', 94, 56, (R) => {
  R(2, 6, 90, 10, K.wood[1]);
  for (let i = 0; i < 6; i++) { const x = 6 + i * 15, c = [K.paper[4], K.coral[3], K.sky[3], K.butter[3], K.mint[3], K.lilac[3]][i]; R.e(x + 5, 10, 5, 5, c); R(x + 2, 3, 2, 3, c); R(x + 6, 3, 2, 3, c); R(x + 3, 9, 1, 1, K.ink[0]); R(x + 7, 9, 1, 1, K.ink[0]); }
  R(2, 16, 90, 34, K.wood[3]); R(2, 16, 90, 3, K.wood[4]); R(2, 48, 90, 3, K.wood[1]);
  R(6, 22, 82, 12, K.sky[4]); R(6, 22, 82, 1, K.paper[4]);
  for (let i = 0; i < 5; i++) { R(10 + i * 16, 26, 10, 6, [K.coral[2], K.butter[3], K.mint[2], K.lilac[2], K.ribbon[2]][i]); R(12 + i * 16, 24, 6, 2, K.paper[4]); }
  R(2, 0, 90, 5, K.coral[2]); R(2, 0, 90, 1, K.coral[3]); for (let i = 0; i < 9; i++) R(2 + i * 10, 5, 5, 2, K.paper[4]);
  signText(R, 'PRIZES', 30, 38, K.butter[4]); R(8, 37, 10, 7, K.butter[3]); R(9, 38, 8, 5, K.butter[4]);
});
spr('sv2_bike_stall', 62, 54, (R) => {
  R(2, 4, 58, 8, K.sky[2]); for (let i = 0; i < 6; i++) R(2 + i * 10, 4, 5, 8, K.paper[4]); R(2, 12, 58, 2, K.sky[1]);
  R(3, 14, 3, 36, K.wood[2]); R(56, 14, 3, 36, K.wood[2]); R(6, 36, 50, 14, K.wood[3]); R(6, 36, 50, 2, K.wood[4]);
  signText(R, 'BIKES', 20, 18, K.coral[2]);
  for (const [x, c] of [[10, K.coral[2]], [32, K.mint[2]]]) { R.e(x + 4, 33, 4, 4, K.charcoal[1]); R.e(x + 4, 33, 2, 2, K.paper[3]); R.e(x + 18, 33, 4, 4, K.charcoal[1]); R.e(x + 18, 33, 2, 2, K.paper[3]); line(R, x + 4, 33, x + 10, 27, c); line(R, x + 10, 27, x + 18, 33, c); line(R, x + 10, 27, x + 16, 27, c); R(x + 16, 25, 4, 2, K.charcoal[0]); R(x + 8, 25, 5, 2, K.charcoal[0]); }
  R(6, 46, 50, 4, K.wood[1]); R(26, 22, 10, 6, K.butter[3]); R(27, 23, 8, 4, K.butter[4]);
});

// Bicycle: wheels are drawn under Misa, the frame, handlebars and basket over her. Three paints.
const PAINTS = [K.coral[2], K.sky[2], K.mint[2], K.butter[3], K.lilac[2]];
export const PAINT_NAMES = ['Coral', 'Sky blue', 'Mint', 'Sunshine', 'Lilac'];
PAINTS.forEach((c, i) => {
  const spoke = (R, cx, cy) => { R.e(cx, cy, 7, 7, K.charcoal[0]); R.e(cx, cy, 5, 5, K.paper[2]); R.e(cx, cy, 4, 4, '#4a3a4a'); R(cx - 4, cy, 9, 1, K.paper[3]); R(cx, cy - 4, 1, 9, K.paper[3]); R(cx, cy, 1, 1, K.metal[2]); };
  spr(`sv2_bike_side_u${i}`, 38, 16, (R) => { spoke(R, 8, 8); spoke(R, 29, 8); });
  for (const bk of [0, 1, 2, 3]) spr(`sv2_bike_side_o${i}_${bk}`, 38, 26, (R) => {
    line(R, 8, 18, 15, 9, c, 2); line(R, 15, 9, 20, 18, c, 2); line(R, 15, 9, 26, 9, c, 2); line(R, 26, 9, 29, 18, c, 2); line(R, 20, 18, 8, 18, c, 1);
    R(11, 6, 8, 3, K.charcoal[0]); R(25, 5, 2, 5, K.metal[2]); R(24, 4, 7, 2, K.charcoal[0]); R(20, 17, 3, 3, K.metal[2]);
    if (bk) { R(28, 8, 9, 6, K.wood[2]); R(28, 8, 9, 1, K.wood[4]); for (let x = 29; x < 36; x += 2) R(x, 9, 1, 5, K.wood[1]); if (bk > 1) R(27, 5, 10, 3, K.forest[2]); if (bk > 2) R(30, 3, 3, 3, K.ribbon[2]); }
    R(30, 4, 2, 2, K.butter[4]);
  });
  spr(`sv2_bike_front_u${i}`, 10, 16, (R) => { R(3, 1, 4, 14, K.charcoal[0]); R(4, 2, 2, 12, K.paper[2]); });
  for (const bk of [0, 1, 2, 3]) spr(`sv2_bike_front_o${i}_${bk}`, 26, 22, (R) => {
    R(11, 4, 4, 14, c); R(3, 3, 20, 3, K.charcoal[0]); R(2, 2, 4, 5, K.paper[3]); R(20, 2, 4, 5, K.paper[3]); R(11, 0, 4, 3, K.butter[4]);
    if (bk) { R(6, 8, 14, 8, K.wood[2]); R(6, 8, 14, 1, K.wood[4]); for (let x = 7; x < 20; x += 2) R(x, 9, 1, 7, K.wood[1]); if (bk > 1) R(8, 5, 10, 3, K.forest[2]); }
  });
  spr(`sv2_bike_park${i}`, 40, 24, (R) => { spoke(R, 8, 15); spoke(R, 30, 15); line(R, 8, 15, 15, 6, c, 2); line(R, 15, 6, 21, 15, c, 2); line(R, 15, 6, 27, 6, c, 2); line(R, 27, 6, 30, 15, c, 2); line(R, 21, 15, 8, 15, c, 1); R(12, 3, 8, 3, K.charcoal[0]); R(26, 2, 6, 2, K.charcoal[0]); R(26, 2, 2, 5, K.metal[2]); });
});
void get;
