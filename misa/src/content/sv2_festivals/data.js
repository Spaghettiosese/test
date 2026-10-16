// Festival Set Pieces: shared state, helpers, souvenir items, ribbons, scoring (Grange), achievements.
// Save data: state.sv2fest = { best:{pieceId:{score,rank,year}}, ribbons:{'id@year':{rank,score,day}}, souv:{itemId:day},
//   plays:{pieceId:n}, done:{'id:act@day':1}, secret:{day,to,from,gave,got}, grange:{lastBoard:[...]} }
// Condition kinds added: festsouv>=N (souvenirs collected), festribbons>=N (ribbons won).
// Bus events emitted: sv2Result {id, score, rank}, sv2Souvenir {item}, sv2Piece {id}.
import { register, registerMany, get, all } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { yearOf, dateOf } from '../../core/time.js';
import { addSfx } from '../../audio.js';

register('stateSlice', 'sv2fest', { default: () => ({ best: {}, ribbons: {}, souv: {}, plays: {}, done: {}, secret: { day: 0 }, grange: {} }) });
export const S = (g) => {
  const s = (g.state.sv2fest ||= {});
  for (const k of ['best', 'ribbons', 'souv', 'plays', 'done', 'grange']) s[k] ||= {};
  s.secret ||= { day: 0 };
  return s;
};

export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const call = (fn) => ({ t: 'call', fn });
export const nameOf = (id) => (get('npc', id) || { name: id }).name.split(' ')[0];
export const has = (id) => !!get('item', id);
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
export const scene = (name) => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name }, { t: 'fade', to: 0, dur: 0.6 }];
export const endScene = [{ t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.6 }];

addSfx('sv2_boom', ({ tone, noise }) => { noise(0.35, 0.07, 300); tone(110, 0.25, 'sawtooth', 0.05, -60); });
addSfx('sv2_crackle', ({ tone, noise }) => { noise(0.5, 0.04, 2400); tone(1800, 0.2, 'triangle', 0.025, -900, 0.05); });
addSfx('sv2_ribbon', ({ tone }) => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.05, 0, i * 0.09)));
addSfx('sv2_dong', ({ tone }) => { tone(196, 0.5, 'sine', 0.07); tone(392, 0.4, 'triangle', 0.03); });

// ---------------------------------------------------------------- the pieces (album order)
export const PIECES = [
  { id: 'hanami', name: 'Flower Dance', when: 'Spring 7', souv: 'gift_sv2_flower_crown', blurb: 'Pick a partner (4+ hearts) and dance to the beat under the blossoms.' },
  { id: 'eggfest', name: 'Egg Hunt', when: 'Spring 11', souv: 'gift_sv2_golden_egg', blurb: 'Find more hidden eggs than Rina before the bell.' },
  { id: 'luau', name: 'Tide Luau Potluck', when: 'Summer 24', souv: 'gift_sv2_shell_lei', blurb: 'Add a dish to the communal pot and watch the town react.' },
  { id: 'jellies', name: 'Moonlight Jellies', when: 'Summer 26', souv: 'gift_sv2_jelly_lamp', blurb: 'Glowing jellyfish drift along the shore after dark.' },
  { id: 'harvest', name: 'Grange Display', when: 'Autumn 13', souv: 'gift_sv2_grange_rosette', blurb: 'Arrange nine items on the board for the judges.' },
  { id: 'starryeve', name: 'Secret Gift', when: 'Winter 24', souv: 'gift_sv2_star_ornament', blurb: 'Draw a secret friend, give a gift and receive one.' },
  { id: 'icefest', name: 'Ice Fishing Day', when: 'Winter 11', souv: 'gift_sv2_ice_trophy', blurb: 'Four casts on the harbour against Captain Jun and friends.' },
  { id: 'newyear', name: 'Midnight Countdown', when: 'Winter 28', souv: 'gift_sv2_hamaya', blurb: 'Light the sky at the clock tower as the year turns.' },
  { id: 'sv2_firefly', name: 'First Firefly Night', when: 'Summer 5', souv: 'gift_sv2_firefly_charm', mini: true, blurb: 'The first lights of the year over the park pond.' },
  { id: 'sv2_picnic', name: 'Blossom Picnic', when: 'Spring 9', souv: null, mini: true, blurb: 'A quiet picnic under the sakura with a friend.' },
  { id: 'sv2_kite', name: 'Kite Breeze Day', when: 'Spring 24', souv: 'gift_sv2_kite_charm', mini: true, blurb: 'Fly a kite on the sandbar.' },
  { id: 'sv2_seaglass', name: 'Sea Glass Dawn', when: 'Autumn 3', souv: null, mini: true, blurb: 'Early tide-line treasure hunt.' },
  { id: 'sv2_maple', name: 'Maple Stroll', when: 'Autumn 10', souv: 'gift_sv2_pressed_maple', mini: true, blurb: 'Collect the reddest leaf on the shrine path.' },
  { id: 'sv2_snowfort', name: 'Snow Fort Day', when: 'Winter 3', souv: 'gift_sv2_snow_charm', mini: true, blurb: 'Build a fort in the park with a friend.' },
];

// ---------------------------------------------------------------- seasonal mini events ("moments"): season + date
export const MOMENT_DATES = { sv2_picnic: ['spring', 9], sv2_kite: ['spring', 24], sv2_firefly: ['summer', 5], sv2_seaglass: ['autumn', 3], sv2_maple: ['autumn', 10], sv2_snowfort: ['winter', 3] };
export const momentsToday = (g) => Object.entries(MOMENT_DATES).filter(([, [se, d]]) => g.season === se && dateOf(g.day) === d).map(([id]) => id);

// ---------------------------------------------------------------- souvenir items
registerMany('item', {
  gift_sv2_flower_crown: { name: 'Flower crown', desc: 'A ring of woven blossoms from the Hanami dance. Keeps its scent all year.', cat: 'gift', price: 120, tags: ['souvenir', 'flower', 'cute'], icon: itemIcon('flower', { c: K.sakura[2] }) },
  gift_sv2_golden_egg: { name: 'Golden egg charm', desc: 'A little gilded egg from the Egg Hunt. Rina insists it is hers by rights.', cat: 'gift', price: 150, tags: ['souvenir', 'cute', 'rare'], icon: itemIcon('star', { c: K.butter[2] }) },
  gift_sv2_painted_egg: { name: 'Painted egg', desc: 'A hard-boiled egg painted with tiny spring flowers.', cat: 'gift', price: 40, tags: ['souvenir', 'cute'], icon: itemIcon('fruit', { c: K.mint[2] }) },
  gift_sv2_shell_lei: { name: 'Shell lei', desc: 'A luau garland of shells and sea-glass beads.', cat: 'gift', price: 140, tags: ['souvenir', 'handmade', 'shell'], icon: itemIcon('shell', { c: K.coral[3] }) },
  gift_sv2_jelly_lamp: { name: 'Jelly lamp', desc: 'A jar holding a faint blue glow, borrowed from the moonlight jellies. Returned to the sea each dawn, in spirit.', cat: 'gift', price: 180, tags: ['souvenir', 'cute', 'stars'], icon: itemIcon('bottle', { c: K.water[3] }) },
  gift_sv2_grange_rosette: { name: 'Grange rosette', desc: 'A ribbon rosette from the Harvest Fair display board.', cat: 'gift', price: 160, tags: ['souvenir', 'handmade'], icon: itemIcon('stamp', { c: K.ribbon[2] }) },
  gift_sv2_star_ornament: { name: 'Star ornament', desc: 'A paper star from the Starry Eve tree. Someone wrote your name on the back.', cat: 'gift', price: 130, tags: ['souvenir', 'stars', 'handmade'], icon: itemIcon('star', { c: K.butter[3] }) },
  gift_sv2_ice_trophy: { name: 'Ice fishing trophy', desc: 'A tiny trophy shaped like a fish through a hole in the ice.', cat: 'gift', price: 200, tags: ['souvenir', 'fishing'], icon: itemIcon('fish', { c: K.sky[3] }) },
  gift_sv2_hamaya: { name: 'Hamaya arrow', desc: 'A lucky shrine arrow for the new year, tied with a bell.', cat: 'gift', price: 150, tags: ['souvenir', 'rare'], icon: itemIcon('feather', { c: K.vermilion[2] }) },
  gift_sv2_firefly_charm: { name: 'Firefly charm', desc: 'A glass bead with a speck of green light that never quite fades.', cat: 'gift', price: 110, tags: ['souvenir', 'cute', 'stars'], icon: itemIcon('bug', { c: K.leaf[4] }) },
  gift_sv2_kite_charm: { name: 'Kite charm', desc: 'A palm-sized paper kite on a thread.', cat: 'gift', price: 90, tags: ['souvenir', 'cute', 'handmade'], icon: itemIcon('paper', { c: K.sky[2] }) },
  gift_sv2_pressed_maple: { name: 'Pressed maple', desc: 'The reddest leaf on the shrine path, flattened in a book.', cat: 'gift', price: 70, tags: ['souvenir', 'flower', 'book'], icon: itemIcon('leafy', { c: K.vermilion[3] }) },
  gift_sv2_snow_charm: { name: 'Snow fort charm', desc: 'A pebble-sized snowman that does not melt.', cat: 'gift', price: 80, tags: ['souvenir', 'cute'], icon: itemIcon('toy', { c: K.snow[3] }) },
});

export const souvenir = (g, itemId) => {
  if (!itemId || !has(itemId)) return false;
  const s = S(g);
  if (s.souv[itemId]) return false;
  s.souv[itemId] = g.day; g.give(itemId, 1, true);
  g.toast(`Souvenir: ${get('item', itemId).name}`, get('item', itemId).icon);
  g.stat('sv2Souvenirs'); g.bus.emit('sv2Souvenir', { item: itemId });
  return true;
};
export const stickers = (g, n, why) => { if (n > 0 && has('star_sticker')) { g.give('star_sticker', n, true); g.stat('starStickers', n); g.toast(`+${n} Star Sticker${n > 1 ? 's' : ''}${why ? ': ' + why : ''}`, get('item', 'star_sticker').icon); } };

// ---------------------------------------------------------------- once-a-day guard (only consumed when the piece is actually played)
export const doneToday = (g, key) => !!S(g).done[`${key}@${g.day}`];
export const markDone = (g, key) => { const d = S(g).done; for (const k of Object.keys(d)) if (!k.endsWith('@' + g.day)) delete d[k]; d[`${key}@${g.day}`] = 1; };

// ---------------------------------------------------------------- ribbons and best scores
export const RIBBONS = [null, { name: 'Blue', c: '#4aa8f0', c2: '#9ed8ff' }, { name: 'Red', c: '#e43b44', c2: '#ff9a9a' }, { name: 'White', c: '#f4e4c1', c2: '#ffffff' }, { name: 'Green', c: '#4f8a58', c2: '#94c06a' }];
export const rankOfScore = (s, a = 85, b = 65, c = 40) => (s >= a ? 1 : s >= b ? 2 : s >= c ? 3 : 4);
export function recordResult(g, id, { score = 0, rank = 4 } = {}) {
  const s = S(g), y = yearOf(g.day), key = `${id}@${y}`, sc = Math.round(score);
  const old = s.ribbons[key], b = s.best[id];
  if (!old || rank < old.rank) s.ribbons[key] = { rank, score: sc, day: g.day };
  const record = !b || sc > b.score;
  s.best[id] = { score: record ? sc : b.score, rank: b ? Math.min(b.rank, rank) : rank, year: record ? y : b.year };
  s.plays[id] = (s.plays[id] || 0) + 1;
  g.stat('sv2Entries'); if (rank === 1) g.stat('sv2Blue'); if (rank <= 3) g.stat('sv2Podium');
  g.bus.emit('sv2Result', { id, score: sc, rank });
  return { record };
}
export const ribbonCount = (g, rank) => Object.values(S(g).ribbons).filter((r) => !rank || r.rank === rank).length;
addCondKind('festsouv', (g) => Object.keys(S(g).souv).length);
addCondKind('festribbons', (g) => ribbonCount(g));

// ---------------------------------------------------------------- the bag
export function bagIds(g, filter) {
  return Object.entries(g.state.inv || {}).filter(([id, n]) => n > 0 && get('item', id) && !get('item', id).key && get('item', id).cat !== 'key' && (!filter || filter(id, get('item', id)))).map(([id]) => id)
    .sort((a, b) => (get('item', b).price || 0) - (get('item', a).price || 0) || (a < b ? -1 : 1));
}
export const isDishy = (id, it) => it && (it.cat === 'food' && !id.startsWith('ing_'));

// ---------------------------------------------------------------- Grange scoring
export const starOf = (g, id) => { const L = g.state.sv_farm && g.state.sv_farm.q && g.state.sv_farm.q[id]; if (!L) return 0; for (let i = 2; i >= 0; i--) if (L[i] > 0) return i + 1; return 0; };
const HARVEST_CATS = ['crop', 'food', 'fish'];
export function scoreBoard(g, ids) {
  const list = ids.filter(Boolean).map((id) => { const it = get('item', id) || {}; return { id, cat: it.cat || 'misc', price: it.price || 0, star: starOf(g, id), tags: it.tags || [] }; });
  const n = list.length;
  if (!n) return { total: 0, variety: 0, quality: 0, theme: 0, bonus: 0, kinds: 0, stars: 0, crops: 0, foods: 0, judges: { goro: 1, mika: 1, ogawa: 1 }, n: 0 };
  const kinds = new Set(list.map((i) => i.cat)).size, uniq = new Set(list.map((i) => i.id)).size;
  const stars = list.reduce((a, i) => a + i.star, 0);
  const variety = Math.min(30, kinds * 6 + uniq);
  const quality = Math.min(25, stars * 3) + Math.min(20, Math.round(list.reduce((a, i) => a + Math.min(i.price, 500), 0) / n / 20));
  const theme = Math.min(15, Math.round(list.filter((i) => HARVEST_CATS.includes(i.cat)).length * 1.7));
  const bonus = (n === 9 ? 10 : 0) + (uniq === n && n >= 5 ? 0 : 0);
  const total = Math.min(100, variety + quality + theme + bonus);
  const crops = list.filter((i) => i.cat === 'crop').length, foods = list.filter((i) => i.cat === 'food').length;
  const j = (b) => Math.max(1, Math.min(10, Math.round(total / 10 + b)));
  return { total, variety, quality, theme, bonus, kinds, stars, crops, foods, n, judges: { goro: j(crops >= 3 ? 1.5 : crops ? 0 : -1), mika: j(foods >= 2 ? 1.5 : foods ? 0 : -1), ogawa: j(kinds >= 5 ? 1.5 : kinds >= 3 ? 0 : -1) } };
}
export function grangeRivals(g) {
  const r = g.rngFor('sv2grange' + yearOf(g.day));
  return [['goro', 'Goro', 50 + Math.round(r() * 24)], ['mika', 'Mika', 46 + Math.round(r() * 22)], ['hina', 'Hina', 34 + Math.round(r() * 22)]];
}

// ---------------------------------------------------------------- achievements
const ach = (id, name, desc, cond, icon = 'i_trophy', extra = {}) => register('achievement', id, { name, desc, cond, icon, ...extra });
ach('sv2_dancer', 'Petal waltz', 'Dance at the Hanami Flower Dance.', 'stat:flowerDances>=1', 'heart');
ach('sv2_egg_finder', 'Egg-cellent', 'Beat Rina at the Egg Hunt.', 'stat:eggWins>=1', 'i_star');
ach('sv2_potluck', 'Pot of plenty', 'Add a dish to the Luau potluck pot.', 'stat:luauPots>=1', 'i_star');
ach('sv2_jelly_night', 'Night glow', 'Watch the Moonlight Jellies.', 'stat:jellyNights>=1', 'i_star');
ach('sv2_grange', 'Blue ribbon board', 'Win the Grange Display with a Blue ribbon.', 'stat:grangeWins>=1', 'i_trophy', { title: 'Grange Champion' });
ach('sv2_secret', 'Secret friend', 'Take part in the Starry Eve secret gift exchange.', 'stat:secretGifts>=1', 'heart');
ach('sv2_ice', 'Hole in one', 'Enter the Ice Fishing Day contest.', 'stat:iceContests>=1', 'i_fishicon');
ach('sv2_countdown', 'Happy new year!', 'Light the sky at the midnight countdown.', 'stat:nyeCountdowns>=1', 'i_star');
ach('sv2_ribbons3', 'Ribbon collector', 'Win 3 Blue ribbons at festival set pieces.', 'stat:sv2Blue>=3', 'i_trophy');
ach('sv2_souv6', 'Keepsake shelf', 'Collect 6 festival souvenirs.', 'festsouv>=6', 'i_trophy', { title: 'Festival Regular' });
ach('sv2_moments', 'Small moments', 'Enjoy 4 seasonal mini events.', 'stat:miniMoments>=4', 'heart');

export { all };
