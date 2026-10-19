// Cooking at home 2.0: kitchen gadgets (placeable furniture that unlock recipe categories), a weekly menu board with a shopping
// list, bento lunches for school (buff, shared with classmates), dinner parties for three friends, leftovers that spoil outside
// the fridge, and the Fridge phone app. Recipes use the hobbies recipe registry (`learned` is a getter tied to the gadget).
import { register, registerMany, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { UI, rect, panel, bar, List, Tabs } from '../../ui/ui.js';
import { drawText, drawTextC } from '../../font.js';
import { sprite } from '../../artcache.js';
import { wrapMap } from '../sv2_orchard/orchard.js';
import { BUFFS } from '../hobbies/common.js';
import { knows } from '../hobbies/menus.js';
import { SV, nm, say, N, call, menu, pick } from './data.js';
import './art.js';

let GAME = null;
export const GADGETS = { ricecooker: ['furn_gadget_ricecooker', 'Rice cooker'], oven: ['furn_gadget_oven', 'Oven'], blender: ['furn_gadget_blender', 'Blender'] };
export const hasGadget = (g, k) => !!g && !!g.state.homeDecor && g.state.homeDecor.placed.some((p) => p.id === GADGETS[k][0]);
BUFFS.bento_sharp = { name: 'Bento boost', desc: '+15% Study XP', icon: 'i_book', xp: { study: 1.15 } };
BUFFS.bento_cheer = { name: 'Lunchbox cheer', desc: 'Mood slowly rises', icon: 'heart' };

// ---------------------------------------------------------------- new dishes (ingredient tokens: crop ids are `tag:<crop>`)
const D = [
  // id, name, station, shape, colour, ingredients, energy, mood, buff, time, price, desc
  ['dish_sv4_takikomi', 'Mushroom takikomi gohan', 'ricecooker', 'bowl', Rr.wood[3], { ing_rice: 2, ing_mushroom: 1, ing_soy: 1 }, 70, 10, 'cozy:180', 40, 360, 'Rice steamed with mushrooms and soy. The whole house smells of autumn.'],
  ['dish_sv4_porridge', 'Egg rice porridge', 'ricecooker', 'bowl', Rr.butter[4], { ing_rice: 1, ing_egg: 1 }, 45, 7, 'cozy:120', 25, 200, 'Okayu: gentle, golden and good for sniffly days.'],
  ['dish_sv4_chicken_rice', 'Ginger chicken rice', 'ricecooker', 'bowl', Rr.butter[3], { ing_rice: 2, ing_chicken: 1, ing_ginger: 1 }, 80, 10, 'chef:150', 45, 420, 'Hainan-style rice that cooks in one pot.'],
  ['dish_sv4_sekihan', 'Sekihan red bean rice', 'ricecooker', 'bowl', Rr.ribbon[3], { ing_rice: 2, ing_red_bean: 2 }, 65, 14, 'lucky:150', 50, 480, 'Red bean rice for celebrations.'],
  ['dish_sv4_baked_potato', 'Cheesy baked potato', 'oven', 'root', Rr.butter[3], { 'tag:potato': 2, ing_cheese: 1, ing_butter: 1 }, 60, 9, '', 40, 340, 'Crispy skin, molten cheese.'],
  ['dish_sv4_roast_chicken', 'Roast chicken dinner', 'oven', 'plate', Rr.hairGinger[2], { ing_chicken: 2, 'tag:potato': 1, 'tag:carrot': 1 }, 95, 13, 'chef:180', 70, 640, 'A golden bird with roasted veg. Dad would be proud.'],
  ['dish_sv4_sweet_buns', 'Honey sweet buns', 'oven', 'bread', Rr.wood[4], { ing_flour: 2, ing_sugar: 1, ing_butter: 1, ing_honey: 1 }, 55, 15, 'cozy:150', 60, 420, 'Fluffy buns glazed with honey.'],
  ['dish_sv4_pizza_toast', 'Pizza toast', 'oven', 'pie', Rr.ribbon[3], { ing_bread: 1, ing_cheese: 1, 'tag:tomato': 1 }, 50, 9, '', 20, 260, 'A midnight snack that grew up.'],
  ['dish_sv4_apple_crumble', 'Apple crumble', 'oven', 'pie', Rr.wood[3], { ing_apple: 2, ing_flour: 1, ing_butter: 1, ing_sugar: 1 }, 60, 16, 'focus:150', 55, 480, 'Warm fruit under a buttery crumb.'],
  ['drink_sv4_strawberry_smoothie', 'Strawberry smoothie', 'blender', 'glassdrink', Rr.sakura[2], { 'tag:strawberry': 2, ing_milk: 1 }, 30, 14, 'swift:120', 10, 220, 'Pink, frothy and gone in five seconds.'],
  ['drink_sv4_peach_smoothie', 'Peach yogurt smoothie', 'blender', 'glassdrink', Rr.coral[3], { ing_peach: 2, ing_yogurt: 1 }, 30, 13, 'swift:120', 10, 220, 'Summer in a glass.'],
  ['drink_sv4_green_juice', 'Green juice', 'blender', 'glassdrink', Rr.forest[3], { 'tag:spinach': 1, ing_apple: 1 }, 25, 8, 'green:150', 10, 200, 'Tastes better than it looks. Mostly.'],
  ['dish_sv4_tomato_soup', 'Cream of tomato soup', 'blender', 'bowl', Rr.ribbon[2], { 'tag:tomato': 2, ing_cream: 1 }, 55, 9, 'cozy:150', 30, 300, 'Silky smooth, best with toast.'],
  ['drink_sv4_matcha_smoothie', 'Matcha smoothie', 'blender', 'glassdrink', Rr.mint[2], { ing_matcha: 1, ing_milk: 1, ing_yogurt: 1 }, 30, 12, 'focus:150', 10, 240, 'Green, creamy and gently energising.'],
];
for (const [id, name, station, shape, c, ing, energy, mood, buff, time, price, desc] of D) {
  const [bid, bmin] = buff ? buff.split(':') : [], drink = id.startsWith('drink_'), sweet = /sweet|crumble|smoothie|buns/.test(id) && !/green/.test(id);
  register('item', id, { name, desc, cat: 'food', price, energy, mood, icon: itemIcon(shape, { c }), tags: ['dish', ...(drink ? ['drink'] : []), ...(sweet ? ['sweet', 'dessert'] : [])], buff: bid ? { id: bid, min: +bmin } : null });
  const def = { name, ingredients: ing, out: id, time, steps: drink ? ['chop', 'stir'] : ['chop', 'stir', 'fry'], station, skill: null, from: null, hidden: false, story: false };
  Object.defineProperty(def, 'learned', { enumerable: true, get: () => hasGadget(GAME, station) });
  register('recipe', id, def);
}
// ---------------------------------------------------------------- leftovers for every dish (spoil in the bag, keep in the fridge)
const DISHES = all('item').filter((i) => (i.tags || []).includes('dish') && !(i.tags || []).includes('trash') && !(i.tags || []).includes('drink') && !i.id.startsWith('leftover_'));
registerMany('item', Object.fromEntries(DISHES.map((d) => [`leftover_${d.id}`, { name: `Leftover ${d.name.toLowerCase()}`, desc: 'Packed in a little tub. Keep it in the fridge or it will not last the night.', cat: 'food', price: Math.max(5, Math.round((d.price || 20) * 0.2)), energy: Math.round((d.energy || 20) * 0.6), mood: Math.max(1, Math.round((d.mood || 3) * 0.5)), icon: d.icon, tags: ['leftover', 'food'] }])));
export const leftovers = (g) => Object.keys(g.state.inv).filter((i) => i.startsWith('leftover_') && g.has(i));

// ---------------------------------------------------------------- tastes and tags
export function tagsOf(id) {
  const it = get('item', id) || {}, t = new Set(it.tags || []);
  const rx = (re, tag) => { if (re.test(id)) t.add(tag); };
  rx(/chicken|karaage|nikujaga|curry|yakisoba|ramen|roast/, 'meat'); rx(/fish|sashimi|tempura|unadon|takoyaki|squid|sardine|sushi/, 'fish'); rx(/salad|stir_fry|edamame|pickles|corn|pumpkin|tomato|spinach|green|garden|veg/, 'veg');
  rx(/rice|onigiri|curry|unadon|takikomi|porridge|sekihan|bento/, 'rice'); rx(/noodle|udon|ramen|yakisoba|hiyashi|soba/, 'noodles'); rx(/karaage|tempura|fried|katsu/, 'fried'); rx(/soup|stew|nabe|oden|porridge|cocoa|tea/, 'warm');
  if (it.buff && it.buff.id === 'cozy') t.add('warm'); if (it.cat === 'food' && /cake|mochi|dango|pudding|cookie|pie|crumble|buns/.test(id)) t.add('sweet'); if (id.startsWith('drink_') || id.startsWith('bev_')) t.add('drink');
  return [...t];
}
const TASTE = { kai: ['meat', 'fried', 'rice'], suzu: ['sweet', 'warm', 'veg'], rina: ['fish', 'sweet', 'veg'], theo: ['noodles', 'warm', 'rice'], hina: ['veg', 'fish', 'sweet'], aoi: ['sweet', 'fried', 'drink'], haru: ['meat', 'noodles', 'rice'], sora: ['veg', 'warm', 'fish'], momo: ['sweet', 'sweet', 'fried'] };
const DISLIKE = { kai: ['veg'], suzu: ['fried'], rina: ['fried'], theo: ['sweet'], hina: ['meat'], aoi: ['veg'], haru: ['sweet'], sora: ['meat'], momo: ['fish'] };
export function likeScore(npc, ids) {
  const l = TASTE[npc] || ['rice', 'sweet'], d = DISLIKE[npc] || [];
  let s = 0.35; const all_ = ids.flatMap(tagsOf);
  for (const t of new Set(all_)) { if (l.includes(t)) s += 0.22; if (d.includes(t)) s -= 0.25; }
  if (new Set(ids).size >= 3) s += 0.1; return Math.max(0, Math.min(1, s));
}
const TASTE_LINES = { love: ['This is exactly what I wanted!', 'You remembered what I like. I am touched.', 'Seconds, please. And thirds.'], like: ['Mmm, this is lovely.', 'Really good! Thank you for sharing.'], meh: ['Thanks! It is... interesting.', 'Very kind of you. I will be polite and finish it.'] };

// ---------------------------------------------------------------- the weekly menu board
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const planable = (g) => all('recipe').filter((r) => knows(g, r.id) && get('item', r.out)).sort((a, b) => a.name.localeCompare(b.name));
function menuBoard(g) {
  const K = SV(g).kitchen;
  menu(g, `Weekly menu (${K.menu.filter(Boolean).length}/7 planned)`, [
    ...DAYS.map((d, i) => [`${i === g.weekday ? '> ' : ''}${d}: ${K.menu[i] ? nm(K.menu[i]) : 'empty'}`, (gg) => planDay(gg, i)]),
    ['Pack a bento', packBento], ['Host a dinner party', hostParty], ['Clear the board', (gg) => { SV(gg).kitchen.menu = Array(7).fill(null); }],
  ]);
}
function planDay(g, i) {
  const list = planable(g).slice(0, 7 * 2 + 6), K = SV(g).kitchen, cheap = list.filter((r) => g.has(r.out) || true);
  const picks = [...cheap.sort((a, b) => (SV(g).kitchen.menu.includes(a.id) ? 1 : 0) - (SV(g).kitchen.menu.includes(b.id) ? 1 : 0)).slice(0, 8)];
  menu(g, `${DAYS[i]} dinner`, [...picks.map((r) => [r.name, (gg) => { K.menu[i] = r.out; gg.toast(`${DAYS[i]}: ${r.name}`); gg.stat('mealsPlanned'); }]), ['Nothing planned', (gg) => { K.menu[i] = null; }]]);
}
export const missingFor = (g) => {
  const need = {};
  for (const id of SV(g).kitchen.menu.filter(Boolean)) { const r = get('recipe', id); if (r) for (const [k, n] of Object.entries(r.ingredients)) need[k] = (need[k] || 0) + n; }
  return Object.entries(need).map(([k, n]) => { const have = k.startsWith('tag:') ? all('item').filter((i) => (i.tags || []).includes(k.slice(4)) && i.cat === 'crop').reduce((a, i) => a + g.count(i.id), 0) : g.count(k) + (SV(g).kitchen.fridge[k] || 0); return { k, n, miss: Math.max(0, n - have), name: k.startsWith('tag:') ? k.slice(4) : nm(k) }; });
};

// ---------------------------------------------------------------- bento
const bentoFoods = (g) => Object.keys(g.state.inv).filter((i) => { const it = get('item', i); return it && g.has(i) && it.cat === 'food' && !(it.tags || []).includes('bento') && !(it.tags || []).includes('drink') && !(it.tags || []).includes('trash') && it.energy >= 10; });
function packBento(g) {
  const foods = bentoFoods(g); if (foods.length < 1) return g.say('misa', 'neutral', 'A bento needs food: cooked dishes, onigiri, tamagoyaki, leftovers... Nothing in my bag fits.');
  const chosen = [], step = () => {
    const rest = foods.filter((f) => !chosen.includes(f) && g.has(f)).slice(0, 8);
    menu(g, `Pack the bento (${chosen.length}/3)`, [...rest.map((f) => [`${nm(f)} x${g.count(f)}`, (gg) => { chosen.push(f); if (chosen.length >= 3) done(gg); else step(); }]), ...(chosen.length ? [['Close the lid', (gg) => done(gg)]] : [])]);
  };
  const done = (gg) => {
    if (!chosen.length) return; for (const f of chosen) gg.take(f, 1);
    const kinds = new Set(chosen.flatMap(tagsOf).filter((t) => ['meat', 'fish', 'veg', 'rice', 'sweet', 'noodles'].includes(t))).size;
    const tier = chosen.length >= 3 && kinds >= 3 ? 3 : chosen.length >= 2 && kinds >= 2 ? 2 : 1, B = SV(gg).kitchen.bento;
    gg.give(`bento_${tier}`, 1); B.packed++; B.last = { ids: chosen.slice(), tier, day: gg.day }; gg.advance(15); gg.addXP('cooking', 2 + tier); gg.stat('bentosPacked'); gg.sfx('chime');
    gg.say('misa', 'happy', ['One tidy box with a lid. Good enough to eat standing up.', 'Cute! The nori face is slightly wonky, which makes it better.', 'Three tiers of lunch. I have outdone myself.'][tier - 1]);
  };
  step();
}
function schoolLunch(world, game) {
  if (!['classroom', 'school_grounds', 'school_roof', 'school_halls', 'gym'].includes(world.map.id)) return null;
  if (!game.check('school') || game.minutes < 11 * 60 + 40 || game.minutes > 13 * 60 + 20) return null;
  const b = ['bento_3', 'bento_2', 'bento_1'].find((i) => game.has(i)); if (!b) return null;
  const p = world.player; let best = null, bd = 56;
  for (const n of world.presentNPCs()) { if (!n.def || !n.def.name) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
  if (!best) return null;
  return { label: `Share bento with ${best.def.name}`, dist: bd, x: best.x, y: best.y - 14, run: (g) => shareBento(g, best.id, best.def.name, b) };
}
register('targetProvider', 'sv4_bento', { find: (world, game) => (game.state.sv4_home ? schoolLunch(world, game) : null) });
function shareBento(g, npc, name, box) {
  const B = SV(g).kitchen.bento, ids = (B.last && B.last.ids) || [], s = likeScore(npc, ids), cls = s >= 0.75 ? 'love' : s >= 0.45 ? 'like' : 'meh';
  g.take(box, 1); B.shared++; g.stat('bentosShared'); g.stat('hangouts'); g.addFriend(npc, cls === 'love' ? 40 : cls === 'like' ? 24 : 10); g.addMood(cls === 'meh' ? 3 : 8);
  if (g.addBuff) g.addBuff('bento_sharp', 120);
  g.run([N(`You open the lunchbox and offer ${name} a bite.`), say(npc, cls === 'meh' ? 'neutral' : 'happy', pick(TASTE_LINES[cls], g.rng())), N(cls === 'love' ? `${name} is delighted.` : 'You eat the rest together under the sky.')]);
}

// ---------------------------------------------------------------- dinner party
function hostParty(g) {
  const K = SV(g).kitchen;
  if (g.minutes < 16 * 60 || g.minutes > 20 * 60) return g.say('misa', 'neutral', 'Dinner parties happen between four and eight in the evening.');
  if (K.partyDay === g.day) return g.say('misa', 'neutral', 'One party a day is plenty. The dishes are enough as it is.');
  const pool = Object.keys(TASTE).filter((id) => get('npc', id) && g.hearts(id) >= 2).sort((a, b) => g.hearts(b) - g.hearts(a));
  if (pool.length < 3) return g.say('misa', 'neutral', 'I need three friends with at least 2 hearts to invite.');
  const foods = bentoFoods(g).concat(Object.keys(g.state.inv).filter((i) => (get('item', i) || {}).tags && get('item', i).tags.includes('drink') && g.has(i))); if (!foods.length) return g.say('misa', 'neutral', 'The table needs food first: cook some dishes.');
  const guests = [], dishes = [];
  const pickGuest = () => menu(g, `Invite guest ${guests.length + 1}/3`, pool.filter((p) => !guests.includes(p)).slice(0, 7).map((p) => [`${get('npc', p).name} (likes ${TASTE[p].slice(0, 2).join(', ')})`, (gg) => { guests.push(p); guests.length >= 3 ? pickDish() : pickGuest(); }]));
  const pickDish = () => menu(g, `Dish ${dishes.length + 1}/3 for the table`, [...foods.filter((f) => !dishes.includes(f) && g.has(f)).slice(0, 8).map((f) => [`${nm(f)} (${tagsOf(f).slice(0, 3).join(', ')})`, (gg) => { dishes.push(f); dishes.length >= 3 ? serve() : pickDish(); }]), ...(dishes.length ? [['Serve dinner', () => serve()]] : [])]);
  const serve = () => {
    if (!dishes.length) return; for (const d of dishes) g.take(d, 1);
    const scores = guests.map((p) => [p, likeScore(p, dishes)]), avg = scores.reduce((a, [, s]) => a + s, 0) / 3, steps = [N('The table is set, the lamps are low, and three friends arrive with an armful of cushions.'), { t: 'fade', to: 1, dur: 0.5 }, { t: 'wait', dur: 0.4 }, { t: 'fade', to: 0, dur: 0.5 }];
    for (const [p, s] of scores) { const c = s >= 0.75 ? 'love' : s >= 0.45 ? 'like' : 'meh'; steps.push(say(p, c === 'meh' ? 'neutral' : 'happy', pick(TASTE_LINES[c], g.rng()))); }
    steps.push(call((gg) => {
      K.parties++; K.partyDay = gg.day; K.partyBest = Math.max(K.partyBest || 0, Math.round(avg * 100)); gg.advance(120); gg.stat('dinnerParties'); gg.stat('hangouts');
      for (const [p, s] of scores) gg.addFriend(p, 14 + Math.round(s * 30)); gg.addMood(6 + Math.round(avg * 10)); gg.addXP('cooking', 6); gg.addXP('homemaking', 4);
      SV(gg).house.photos[`party${K.parties}`] = gg.day; gg.bus.emit('dinnerParty', { guests, score: avg });
    }), say('misa', 'happy', avg >= 0.7 ? 'Everyone cleared their plates! That went better than I dreamed.' : 'The company was perfect. The menu was... a learning experience.'));
    g.run(steps);
  };
  pickGuest();
}
register('interaction', 'sv4_menu_board', { label: 'Menu board', run: menuBoard });
wrapMap('home', 'objects', (list) => [...list.map((o) => (o.spr === 'int_fridge' ? { ...o, interact: { label: 'Fridge', run: (g) => g.open('phone', 'sv4_fridge') } } : o)), { spr: 'int_hw_menu_stand', x: 1, y: 4, solid: true, shadow: 10, use: 'sv4_menu_board' }]);

// ---------------------------------------------------------------- game hooks: cooked dishes, leftovers, spoilage
register('system', 'sv4_kitchen', { init(game) {
  GAME = game;
  game.bus.on('cooked', ({ recipe, item, stars }) => {
    const K = SV(game).kitchen, it = get('item', item); if (!it) return;
    if (K.menu[game.weekday] === recipe || K.menu[game.weekday] === item) { game.addMood(8); K.planned++; game.stat('plannedMeals'); game.toast('Cooked tonight\'s planned dish: mood up!', 'heart'); }
    if (get('item', `leftover_${item}`) && game.rng() < 0.35 + (stars >= 3 ? 0.25 : 0)) { game.give(`leftover_${item}`, 1, true); game.toast('There are leftovers! Keep them in the fridge.', it.icon); game.stat('leftoversMade'); }
  });
  game.bus.on('dayStart', () => {
    let n = 0; for (const id of leftovers(game)) { n += game.count(id); game.take(id, game.count(id)); }
    if (n) game.toast(`${n} leftover${n > 1 ? 's' : ''} in the bag went off overnight`, 'i_sweat');
  });
} });

// ---------------------------------------------------------------- the Fridge phone app
const FRIDGE_CAP = 40, total = (g) => Object.values(SV(g).kitchen.fridge).reduce((a, b) => a + b, 0);
const storable = (g) => Object.keys(g.state.inv).filter((i) => { const it = get('item', i); return it && g.has(i) && !it.key && (it.cat === 'food' || it.cat === 'crop' || i.startsWith('ing_')); }).sort();
export function store(g, id) { if (!g.has(id) || total(g) >= FRIDGE_CAP) return false; g.take(id, 1); const F = SV(g).kitchen.fridge; F[id] = (F[id] || 0) + 1; return true; }
export function fetch(g, id) { const F = SV(g).kitchen.fridge; if (!F[id]) return false; g.give(id, 1, true); if (!--F[id]) delete F[id]; return true; }
register('phoneApp', 'sv4_fridge', {
  name: 'Fridge', icon: itemIcon('box', { c: '#8fb8e0' }), order: 16, when: (g) => !!g.state.sv4_home,
  open(g, app) { app.state.tabs ||= new Tabs(['Fridge', 'Bag', 'Shopping']); app.state.lists ||= [new List([], 11, 11), new List([], 11, 11)]; },
  update(dt, input, g, app) {
    const st = app.state, { x, y, w } = app.area; st.tabs.update(input, x + 4, y + 2, w - 8); const i = st.tabs.i;
    if (i === 2) return; const L = st.lists[i];
    L.set(i === 0 ? Object.keys(SV(g).kitchen.fridge) : storable(g));
    const pick_ = L.update(input, x + 8, y + 36, w - 16);
    if (pick_) { if (i === 0) { fetch(g, pick_); g.sfx('blip'); } else if (store(g, pick_)) g.sfx('blip'); else g.toast('The fridge is full'); }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, i = st.tabs.i; st.tabs.draw(g, x + 4, y + 2, w - 8);
    panel(g, x + 4, y + 18, w - 8, 150, 'paper');
    drawText(g, `FRIDGE ${total(game)}/${FRIDGE_CAP}   ENTER MOVES ONE`, x + 10, y + 22, UI.dim, 1, null);
    if (i === 2) {
      const miss = missingFor(game); drawText(g, 'SHOPPING LIST FOR THE WEEKLY MENU', x + 10, y + 34, UI.ink, 1, null);
      if (!miss.length) drawText(g, 'PLAN MEALS ON THE MENU BOARD IN THE KITCHEN', x + 10, y + 48, UI.dim, 1, null);
      miss.slice(0, 11).forEach((m, k) => drawText(g, `${m.miss ? '[ ]' : '[x]'} ${m.name.toUpperCase()} ${m.miss ? 'NEED ' + m.miss : 'OK'}`, x + 10, y + 48 + k * 10, m.miss ? UI.bad : UI.good, 1, null));
      return;
    }
    st.lists[i].draw(g, x + 8, y + 36, w - 16, (gg, id, rx, ry, sel) => drawText(gg, `${nm(id).toUpperCase()}  x${i === 0 ? SV(game).kitchen.fridge[id] : game.count(id)}`, rx + 4, ry + 2, sel ? UI.ink : UI.ink2, 1, null));
    if (!st.lists[i].items.length) drawText(g, i === 0 ? 'EMPTY. STORE LEFTOVERS HERE.' : 'NOTHING STORABLE IN THE BAG.', x + 12, y + 60, UI.dim, 1, null);
  },
});
void rect; void bar; void drawTextC; void sprite;

features('Home & Pets', [
  'Kitchen gadgets as placeable furniture: a rice cooker, an oven and a blender, each unlocking its own recipe category',
  'Fourteen new recipes: rice-cooker dishes, oven bakes and roasts, and blender smoothies and soups',
  'Weekly menu board in the kitchen: plan a dinner for each day; cooking the planned dish gives a mood bonus',
  'The Fridge app shows a shopping list of ingredients still missing for the week\'s menu',
  'Pack a bento from your cooked dishes: one to three items make a simple, pretty or feast lunch box with a study buff',
  'Share a bento at school lunch with a nearby classmate; their reaction depends on what they like (meat, sweets, veg, noodles...)',
  'Dinner parties: invite three friends in the evening and choose three dishes; each guest rates the table by their tastes',
  'Cooking sometimes makes leftovers, which spoil overnight unless you keep them in the fridge',
  'Fridge and pantry app: store up to forty food items and ingredients and take them out again from your phone',
]);
