// Year-by-year economy and world scaling: modest price drift (sell prices and Sunny Mart / Cafe Kumo buy prices), new shop items
// that unlock each year (pushed onto the shop stock arrays), better crop yields, and flag-driven town developments
// (planters and pennants in year 2, a souvenir stall in year 3, a graduation tree, and the Foundation's lanterns and lights).
import { register, get, features } from '../../core/registry.js';
import { spr, RAMPS as K } from '../town/lib.js';
import { spotPos } from '../../systems/festivals.js';
import { drawTextC } from '../../font.js';
import { Y, say, N, ask, runP, yr, isAlum, nm, st } from './util.js';
import './items.js';
import { nearSpot } from './years.js';

// ---------------------------------------------------------------- price drift
export const sellDrift = (y, it) => 1 + (it && (it.cat === 'crop' || it.cat === 'fish') ? 0.04 : 0.02) * (Math.min(y, 8) - 1);
export const buyDrift = (y) => 1 + 0.03 * (Math.min(y, 8) - 1);
const r5 = (n) => Math.round(n / 5) * 5;
export function applyBuyDrift(y) {
  for (const sid of ['mart', 'cafe']) {
    const shop = get('shop', sid); if (!shop) continue;
    for (const e of shop.stock || []) {
      const id = typeof e === 'string' ? e : e.item; if (typeof e !== 'string' && e.price) continue;
      const it = get('item', id); if (!it || !it.price || it.id.startsWith('sv3y_')) continue;
      if (it._buy0 === undefined) it._buy0 = it.buy === undefined ? null : it.buy;
      const base = it._buy0 !== null ? it._buy0 : r5(Math.max(10, it.price * 2.2));
      it.buy = r5(base * buyDrift(y));
    }
  }
}

// ---------------------------------------------------------------- year-gated stock
const push = (shopId, entry) => { const s = get('shop', shopId); if (s && Array.isArray(s.stock) && !s.stock.some((e) => (typeof e === 'string' ? e : e.item) === entry.item)) s.stock.push(entry); };
export const YEAR_STOCK = [
  ['mart', { item: 'sv3y_study_planner', when: 'year>=2', price: 150 }], ['mart', { item: 'sv3y_exam_charm', when: 'year>=2', price: 120 }], ['mart', { item: 'sv3y_lucky_pencil', when: 'year>=2', price: 90 }],
  ['mart', { item: 'sv3y_energy_bento', when: 'year>=3', price: 140 }], ['cafe', { item: 'sv3y_autumn_parfait', when: 'year>=2&season:autumn|winter', price: 160 }], ['cafe', { item: 'sv3y_senior_course', when: 'year>=3', price: 260 }],
];
for (const [s, e] of YEAR_STOCK) push(s, e);

// ---------------------------------------------------------------- sprites for the developments
spr('sv3y_planter', 30, 20, (R) => { R(1, 8, 28, 11, K.wood[2]); R(1, 8, 28, 2, K.wood[4]); R(1, 17, 28, 2, K.wood[0]); R(2, 5, 26, 5, K.forest[2]); [[4, 1, K.coral[3]], [11, 0, K.butter[3]], [18, 2, K.lilac[3]], [24, 1, K.sky[3]]].forEach(([x, y, c]) => { R(x, y + 3, 1, 4, K.forest[3]); R(x - 1, y, 4, 4, c); R(x, y + 1, 2, 2, K.butter[4]); }); });
spr('sv3y_pennants', 46, 26, (R) => { R(1, 0, 2, 26, K.wood[1]); R(43, 0, 2, 26, K.wood[1]); for (let i = 0; i < 6; i++) { const x = 4 + i * 6, c = [K.coral[2], K.butter[2], K.sky[2], K.mint[2], K.lilac[2], K.ribbon[2]][i]; R(x, 3 + (i % 2), 6, 2, K.wood[4]); R(x, 5 + (i % 2), 5, 4, c); R(x + 1, 9 + (i % 2), 3, 2, c); } });
spr('sv3y_stall', 44, 40, (R) => { R(3, 18, 3, 22, K.wood[1]); R(38, 18, 3, 22, K.wood[1]); R(2, 24, 40, 14, K.wood[2]); R(2, 24, 40, 2, K.wood[4]); R(0, 6, 44, 14, K.coral[2]); for (let i = 0; i < 6; i++) R(i * 8, 6, 4, 14, K.paper[4]); R(0, 18, 44, 2, K.coral[0]); R(8, 27, 8, 6, K.butter[3]); R(20, 27, 8, 6, K.sky[3]); R(31, 28, 6, 5, K.lilac[3]); });
const tree = (n, w, h, cx, ty, rr) => spr('sv3y_tree_' + n, w, h, (R) => { R(cx - 1 - n, ty, 2 + n * 2, h - ty - 2, K.wood[1]); R(cx - 1 - n, ty, 1, h - ty - 2, K.wood[2]); R.e && R.e(cx, ty - rr / 2, rr, rr * 0.8, K.coral[3]); R.e && R.e(cx - rr / 2, ty - rr / 3, rr * 0.6, rr * 0.5, K.coral[2]); R.e && R.e(cx + rr / 2, ty - rr / 4, rr * 0.55, rr * 0.45, K.coral[4]); for (let i = 0; i <= n + 1; i++) R(cx - rr + 3 + i * 5, ty + 2 + (i % 2) * 3, 2, 4, K.ribbon[2]); });
tree(0, 24, 32, 12, 14, 9); tree(1, 32, 42, 16, 18, 13); tree(2, 40, 54, 20, 24, 17);
spr('sv3y_lantern_post', 12, 38, (R) => { R(5, 8, 2, 28, K.metal[1]); R(3, 34, 6, 3, K.metal[1]); R(1, 1, 10, 9, K.coral[1]); R(2, 2, 8, 7, K.butter[3]); R(3, 3, 6, 5, K.butter[4]); R(4, 0, 4, 2, K.metal[2]); });
spr('sv3y_string_lights', 56, 16, (R) => { R(0, 1, 56, 1, K.ink[2]); for (let i = 0; i < 9; i++) { const x = 3 + i * 6, y = 2 + (i % 2) * 2; R(x, y, 1, 2, K.ink[2]); R(x - 1, y + 2, 3, 3, [K.butter[3], K.coral[3], K.sky[3]][i % 3]); } });
spr('sv3y_stage_board', 44, 34, (R) => { R(4, 8, 3, 26, K.wood[1]); R(37, 8, 3, 26, K.wood[1]); R(0, 0, 44, 16, K.navy[2]); R(0, 0, 44, 2, K.navy[4]); R(2, 3, 40, 10, K.navy[1]); R(8, 6, 4, 4, K.butter[3]); R(20, 5, 4, 6, K.coral[3]); R(32, 6, 4, 4, K.mint[3]); });
spr('sv3y_beacon', 20, 46, (R) => { R(8, 16, 4, 30, K.metal[1]); R(5, 42, 10, 4, K.metal[1]); R.e && R.e(10, 10, 9, 9, K.butter[1]); R.e && R.e(10, 10, 6, 6, K.butter[3]); R.e && R.e(10, 10, 3, 3, K.butter[4]); });
spr('sv3y_star_sign', 24, 26, (R) => { R(11, 12, 2, 14, K.metal[1]); R.t && R.t([12, 0], [4, 10], [20, 10], K.butter[3]); R.t && R.t([2, 6], [22, 6], [12, 16], K.butter[2]); R(10, 7, 4, 4, K.butter[4]); });

// ---------------------------------------------------------------- the dressing table
const flag = (k) => (g) => !!g.flag(k);
export const DRESS = [
  { id: 'planter_a', map: 'town', spot: 'fountain', dx: -4, dy: 2, spr: 'sv3y_planter', when: (g) => yr(g) >= 2 },
  { id: 'planter_b', map: 'town', spot: 'fountain', dx: 4, dy: 2, spr: 'sv3y_planter', when: (g) => yr(g) >= 2 },
  { id: 'pennants', map: 'town', spot: 'clocktower', dx: -4, dy: 3, spr: 'sv3y_pennants', when: (g) => yr(g) >= 2 },
  { id: 'stall', map: 'town', spot: 'market_1', dx: 3, dy: 1, spr: 'sv3y_stall', when: (g) => yr(g) >= 3 || isAlum(g) },
  { id: 'tree', map: 'school_grounds', spot: 'bench', dx: 3, dy: 1, spr: (g) => 'sv3y_tree_' + Math.min(2, Math.max(0, yr(g) - 4)), when: (g) => !!Y(g).graduated },
  { id: 'lanterns_a', map: 'lane', spot: 'crossroad', dx: -2, dy: 1, spr: 'sv3y_lantern_post', when: flag('sv3y_fund_t1') },
  { id: 'lanterns_b', map: 'lane', spot: 'bus_stop', dx: 2, dy: 1, spr: 'sv3y_lantern_post', when: flag('sv3y_fund_t1') },
  { id: 'lights', map: 'harbour', spot: 'dock', dx: 0, dy: 0, spr: 'sv3y_string_lights', when: flag('sv3y_fund_t2') },
  { id: 'stage', map: 'town', spot: 'stage', dx: 0, dy: 1, spr: 'sv3y_stage_board', when: flag('sv3y_fund_t3') },
  { id: 'beacon', map: 'lighthouse', spot: 'door', dx: 2, dy: 1, spr: 'sv3y_beacon', when: flag('sv3y_fund_t4') },
  { id: 'star', map: 'town', spot: 'cafe_terrace', dx: 2, dy: 0, spr: 'sv3y_star_sign', when: flag('sv3y_cafe_star') },
];
register('worldLayer', 'sv3y_dressing', {
  sprites(world, game) {
    const out = [], id = world.map.id;
    for (const d of DRESS) {
      if (d.map !== id || !d.when(game)) continue;
      const p = spotPos(d.map, d.spot, d.dx, d.dy); if (!p) continue;
      const name = typeof d.spr === 'function' ? d.spr(game) : d.spr;
      out.push({ y: p.y, draw: () => { world.shadow(p.x, p.y, 8); world.drawFeet(name, p.x, p.y); if (d.id === 'pennants') drawTextC(world.g, `YEAR ${Math.min(yr(game), 9)}`, world.sx(p.x), world.sy(p.y) - 36, '#fff6c0', 1, null); } });
    }
    return out;
  },
});
register('targetProvider', 'sv3y_dressing_use', {
  find(world, g) {
    const n = (map, spot, dx, dy, r) => { if (world.map.id !== map) return null; const p = spotPos(map, spot, dx, dy); if (!p) return null; const d = Math.hypot(p.x - world.player.x, p.y - world.player.y); return d < r ? { p, d } : null; };
    let h = (yr(g) >= 3 || isAlum(g)) && n('town', 'market_1', 3, 1, 34);
    if (h) return { label: 'Class souvenir stall', dist: h.d + 3, x: h.p.x, y: h.p.y - 14, run: (game) => stall(game) };
    h = Y(g).graduated && n('school_grounds', 'bench', 3, 1, 34);
    if (h) return { label: 'Read the ribbon tags', dist: h.d + 3, x: h.p.x, y: h.p.y - 20, run: (game) => ribbons(game) };
    return null;
  },
});
async function stall(g) {
  const i = await ask(g, 'Class souvenir stall: a box of sweets from the old capital, 120 coins', ['Buy one', 'No thanks'], [N('Hand-painted signs, a tin cashbox and an enormous stack of omiyage boxes. A first-year is minding the till.')]);
  if (i === 0 && g.spend(120)) { g.give('sv3y_trip_omiyage', 1); g.stat('souvenirsBought'); }
}
function ribbons(g) {
  const L = Y(g).letters;
  return runP(g, [N(L.length ? `Ribbon tags on the graduation tree: ${L.slice(0, 8).map((l) => l.name.split(' ')[0]).join(', ')}${L.length > 8 ? ' and more' : ''}.` : 'Ribbons flutter on the little tree. No names yet.'), say('misa', 'happy', 'Every ribbon is a person. The tree gets taller each year, and so does the list.')]);
}

// ---------------------------------------------------------------- the system
register('system', 'sv3_world', {
  init(g) {
    const prevSell = g.sellMult;
    g.sellMult = (it) => (prevSell ? prevSell(it) : 1) * sellDrift(yr(g), it);
    const drift = () => applyBuyDrift(yr(g));
    g.bus.on('gameStart', drift); g.bus.on('gameLoaded', drift); g.bus.on('newGame', drift); g.bus.on('loaded', drift);
    g.bus.on('dayStart', () => { if (g.date === undefined && (g.day - 1) % 112 === 0) drift(); });
    g.bus.on('harvested', (e) => {
      if (!e || !e.item || yr(g) < 2) return;
      if (g.rngFor('yield' + st(g, 'harvested'))() < Math.min(0.3, 0.06 * (yr(g) - 1))) { g.give(e.item, 1, true); g.toast('Bonus harvest!', 'i_leaf'); }
    });
  },
});

features('Years & Graduation', [
  'Prices drift upward a little each year: sell prices (crops and fish +4% per year, the rest +2%) and Sunny Mart and Cafe Kumo buy prices (+3%)',
  'New shop items unlock each year: planners, exam charms and lucky pencils in Sunny Mart, the autumn chestnut parfait and the Senior Course at Cafe Kumo',
  'Crops give a chance of a bonus harvest that grows every school year',
  'Year 2 town developments: flower planters by the fountain and a row of pennants that shows the year',
  'Year 3 town development: a class souvenir stall in the market selling trip sweets',
  'A graduation tree grows in the school grounds each year after the ceremony, with a ribbon for every farewell letter',
  'Foundation developments: lane lanterns, harbour string lights, a concert stage board and a Star Lantern beacon',
  'A golden star sign appears by the Cafe Kumo terrace once the cafe is fully renovated',
]);
void nearSpot; void nm;
