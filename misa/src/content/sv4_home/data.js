// Shared data for the sv4_home area: save slice, small helpers and the items it adds (dyes, sewing patterns, accessories,
// pet supplies, bento boxes, leftovers, souvenirs). Save data: game.state.sv4_home
//   reno:  { started, active: { id, start, days, done (work days) } | null, done: { id: day }, log: [] }
//   plant: { balcony: [null | { seed, item, planted, grown, watered }] x6, greenhouse: [...] x8 }
//   bath: { day, soaks }   guest: { stays, morning: npcId | null, day }
//   style: { dye: { top, bottom, hair }, acc: { hair, face, neck, head }, owned: [accId], presets: [null | {...}] x4, worn: { outfit: days }, base, mix, patterns: [] }
//   pets: { id: { since, bond, needs, tricks, ... } }   petArc: { events: [] }   show: { wins, best, entered }
//   kitchen: { menu: [7], fridge: { item: n }, bento: {...}, parties, partyDay }
//   house: { paid, lastMonth, calls, photos, score, parcels }
import { register, registerMany, get } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as C } from '../../gfx/palette.js';
import { ACC } from './art.js';

export const SV = (g) => g.state.sv4_home;
register('stateSlice', 'sv4_home', {
  default: () => ({
    reno: { started: false, active: null, done: {}, log: [] },
    plant: { balcony: Array(6).fill(null), greenhouse: Array(8).fill(null) },
    bath: { day: 0, soaks: 0 }, guest: { stays: {}, morning: null, day: 0 },
    style: { dye: {}, acc: {}, owned: [], presets: [null, null, null, null], worn: {}, base: null, mix: null, patterns: [] },
    pets: {}, petArc: { events: [], day: 0 }, show: { wins: 0, best: 0, entered: 0, day: 0 },
    kitchen: { menu: Array(7).fill(null), fridge: {}, bento: { day: 0, packed: 0, shared: 0, box: null }, parties: 0, partyDay: 0, planned: 0 },
    house: { paid: 0, lastMonth: -1, calls: { cursor: 0, last: 0, seen: {} }, photos: {}, score: 0, parcels: {}, billsLate: 0 },
  }),
});

export const nm = (id) => (get('item', id) || { name: id }).name;
export const has = (id) => !!get('item', id);
export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const call = (fn) => ({ t: 'call', fn });
export const menu = (g, prompt, opts) => g.run([{ t: 'choice', prompt, options: [...opts.map(([text, fn, when]) => ({ text, when, steps: [call((gg) => fn(gg))] })), { text: 'Never mind', steps: [] }] }]);
export const rnd = (g, tag, n) => Math.floor(g.rngFor(tag)() * n);
export const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

// ---------------------------------------------------------------- dyes (hair / top / bottom) and hair-colour families
export const DYES = {
  rose: ['Rose', '#e86a8a'], sky: ['Sky blue', '#5f9ae0'], mint: ['Mint', '#7ac8a8'], butter: ['Honey', '#e8c050'],
  lilac: ['Lilac', '#a98ae0'], coral: ['Coral', '#e8745a'], ink: ['Midnight', '#343a58'], snow: ['Snow', '#e6e6f0'],
};
export const HAIR_FAMILIES = { natural: ['Natural brown', null], honey: ['Honey blonde', '#d8a050'], cherry: ['Cherry pink', '#e87aa0'], midnight: ['Midnight blue', '#3a4a8a'], mint: ['Minty green', '#58b090'], lilac: ['Lilac dream', '#a98ae0'], ginger: ['Ginger', '#c8602a'] };
registerMany('item', Object.fromEntries(Object.entries(DYES).map(([k, [n, c]]) => [`dye_${k}`, {
  name: `${n} dye`, desc: `A pot of ${n.toLowerCase()} fabric and hair dye. Use it to recolour your hair, top or trousers.`, cat: 'misc', price: 60, icon: itemIcon('bottle', { c }), tags: ['dye'],
  useLabel: 'Dye something', use: (g) => { g.sv4Dye && g.sv4Dye(k); return true; },
}])));
export const SEWING = {
  sailor: ['Summer sailor outfit', { top: '#f4f4ff', bottom: '#2a3a6a' }, 'A crisp white sailor top and navy skirt.'],
  overalls: ['Denim overalls', { top: '#4a78b8', bottom: '#3a5a90' }, 'Hard-wearing overalls with big pockets.'],
  gardener: ['Gardener smock', { top: '#6aa05a', bottom: '#6a5a3a' }, 'A leafy smock with deep pockets for seeds.'],
  stargazer: ['Stargazer cloak', { top: '#4a3a7a', bottom: '#2a2a50' }, 'Deep violet for cold nights on the roof.'],
  baker: ['Baker\'s apron look', { top: '#f6e8d0', bottom: '#8a6a4a' }, 'Flour-proof and smells faintly of bread.'],
  festival: ['Lantern kimono', { top: '#c83a5a', bottom: '#e8c050' }, 'A red and gold kimono for the best festival nights.'],
};
for (const [k, [name, look, desc]] of Object.entries(SEWING)) {
  register('outfit', `sv4_${k}`, { name, look, desc });
  registerMany('item', {
    [`pattern_${k}`]: { name: `Pattern: ${name.toLowerCase()}`, desc: `A paper sewing pattern. Sew it at the workshop machine with 4 cloth and 2 yarn. ${desc}`, cat: 'misc', price: 240, icon: itemIcon('paper', { c: look.top }), tags: ['pattern'] },
    [`cloth_sv4_${k}`]: { name, desc, cat: 'clothes', price: 420, icon: itemIcon('shirt', { c: look.top }), outfit: `sv4_${k}`, tags: ['clothes', 'handmade'],
      useLabel: 'Try on', use: (g) => { if (!g.state.outfits.includes(`sv4_${k}`)) g.state.outfits.push(`sv4_${k}`); g.toast(`${name} added to your wardrobe`, null); return false; } },
  });
}
// accessories: buying (or being given) one adds it to the accessory case when used
const ACC_SHAPE = { hair: 'toy', face: 'toy', neck: 'shirt', head: 'hat' };
registerMany('item', Object.fromEntries(Object.values(ACC).map((a) => [`acc_${a.id}`, {
  name: a.name, desc: `${a.desc} Use it to add it to your accessory case.`, cat: 'clothes', price: a.price, icon: itemIcon(ACC_SHAPE[a.slot], { c: a.c[2] }), tags: ['clothes', 'accessory'], useLabel: 'Add to case',
  use: (g) => { const s = SV(g).style; if (!s.owned.includes(a.id)) s.owned.push(a.id); g.toast(`${a.name} is in your accessory case`, null); return false; },
}])));

// ---------------------------------------------------------------- pet supplies, bento, leftovers, souvenirs
registerMany('item', {
  pet_hay: { name: 'Timothy hay', desc: 'Sweet hay for rabbits. Used when you feed a rabbit.', cat: 'misc', price: 14, icon: itemIcon('leafy', { c: '#c8b050' }), tags: ['pet'] },
  pet_greens: { name: 'Fresh greens', desc: 'Leafy bits for a rabbit or a turtle.', cat: 'misc', price: 12, icon: itemIcon('leafy', { c: '#58a05a' }), tags: ['pet'] },
  pet_pellets: { name: 'Turtle pellets', desc: 'Floating pellets for a pet turtle.', cat: 'misc', price: 10, icon: itemIcon('seed', { c: '#8a6a3a' }), tags: ['pet'] },
  pet_millet: { name: 'Millet spray', desc: 'A parakeet\'s favourite snack, still on the stem.', cat: 'misc', price: 12, icon: itemIcon('seed', { c: '#e8c850' }), tags: ['pet'] },
  pet_puppy_food: { name: 'Puppy kibble', desc: 'Small crunchy bites for growing pups.', cat: 'misc', price: 14, icon: itemIcon('bowl', { c: '#a96a48' }), tags: ['pet'] },
  toy_pet_rope: { name: 'Rope tug toy', desc: 'A knotted rope. Azuki will not let go.', cat: 'misc', price: 40, icon: itemIcon('toy', { c: '#e8745a' }), tags: ['pet', 'toy'] },
  toy_pet_bell: { name: 'Bell ball', desc: 'A jingly ball for a puppy, rabbit or parakeet.', cat: 'misc', price: 30, icon: itemIcon('toy', { c: '#e8c050' }), tags: ['pet', 'toy'] },
  toy_pet_mirror: { name: 'Bird mirror', desc: 'A little mirror and a bell for a parakeet.', cat: 'misc', price: 36, icon: itemIcon('toy', { c: '#8fb8e0' }), tags: ['pet', 'toy'] },
  pet_shampoo: { name: 'Pet shampoo', desc: 'Gentle lavender shampoo for a puppy bath.', cat: 'misc', price: 40, icon: itemIcon('bottle', { c: '#b89ae0' }), tags: ['pet'] },
  pet_ribbon_show: { name: 'Show rosette', desc: 'A rosette ribbon from the park pet show.', cat: 'misc', price: 150, icon: itemIcon('star', { c: '#e43b44' }), tags: ['pet', 'trophy'] },
  bento_1: { name: 'Simple bento', desc: 'A tidy lunch box. Eat it at lunch for a little focus.', cat: 'food', price: 40, energy: 35, mood: 6, icon: itemIcon('box', { c: '#e8745a' }), tags: ['bento'], buff: { id: 'bento_sharp', min: 180 } },
  bento_2: { name: 'Pretty bento', desc: 'A lunch box with a cute face made of nori and cheese.', cat: 'food', price: 70, energy: 50, mood: 10, icon: itemIcon('box', { c: '#f4a8c0' }), tags: ['bento'], buff: { id: 'bento_sharp', min: 240 } },
  bento_3: { name: 'Feast bento', desc: 'A three-tier lunch box packed with love and variety.', cat: 'food', price: 110, energy: 65, mood: 14, icon: itemIcon('box', { c: '#e8c050' }), tags: ['bento'], buff: { id: 'bento_sharp', min: 300 } },
  mat_sv4_glaze: { name: 'Rice-paper glaze', desc: 'A glaze for the bathhouse tiles. Left over from the builders.', cat: 'misc', price: 20, icon: itemIcon('bottle', { c: '#8fe0c0' }), tags: ['material'] },
});
export const SOUVENIRS = [
  ['souv_whale_tooth', 'Carved whale charm', 'Scrimshaw-style carving from a harbour in the far north.', 'gem', '#e8e0c8'],
  ['souv_coral_comb', 'Coral hair comb', 'A pink comb from a tropical market.', 'toy', '#f4a8a0'],
  ['souv_tin_ship', 'Tin toy ship', 'A tiny ship with a wind-up propeller.', 'toy', '#8fb8e0'],
  ['souv_spice_tin', 'Spice tin', 'Dad swears it is the world\'s best curry spice.', 'box', '#c8602a'],
  ['souv_postmark_map', 'Postcard map', 'A map with every port they visited marked in red.', 'paper', '#e8c880'],
  ['souv_glass_float', 'Glass fishing float', 'A green glass float, sea-worn and cool to touch.', 'gem', '#58b090'],
  ['souv_ship_bell', 'Little ship bell', 'It rings exactly like the one on the research ship.', 'star', '#e8c050'],
  ['souv_aurora_globe', 'Aurora snow globe', 'Green lights swirl over a tiny ship.', 'gem', '#8fe0c0'],
];
registerMany('item', Object.fromEntries(SOUVENIRS.map(([id, name, desc, shape, c]) => [id, { name, desc, cat: 'gift', price: 150, icon: itemIcon(shape, { c }), tags: ['souvenir', 'gift'] }])));
export const homeFilled = C;
