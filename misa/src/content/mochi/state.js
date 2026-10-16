// Mochi's save data, bond (0-10 hearts), daily needs and the items of the mochi area.
// state.mochi is the engine's original slice (affection, fedDay, pettedDay, gifts) extended here.
import { register, registerMany, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { addSfx } from '../../audio.js';
import { RAMPS } from '../../gfx/palette.js';

export const NEEDS = ['food', 'play', 'groom', 'love'];
export const NEED_NAMES = { food: 'Food', play: 'Play', groom: 'Grooming', love: 'Affection' };

register('stateSlice', 'mochi', {
  default: () => ({
    affection: 20, fedDay: 0, pettedDay: 0, gifts: 0, fed: false,
    bond: 40, bondEvents: [], bondDay: {},
    needs: { food: 70, play: 60, groom: 70, love: 70 },
    playDay: 0, groomDay: 0, mouseDay: 0, comfortDay: 0, photoDay: 0, treatDay: 0,
    box: false, harness: false, walking: false, walkMaps: {},
    taste: {}, tried: {}, journal: [], favouriteFound: false,
    poses: {}, giftWaiting: null, giftDay: 0, giftsFound: {},
    checkups: 0, checkupDay: 0,
    kuro: { stage: 'none', fed: 0, lastFed: 0, accept: 0, introDay: 0, home: '' },
    daifuku: { petDay: 0, fetchDay: 0, treatDay: 0, events: [] },
    strays: {}, duckDay: 0,
  }),
});

export const ms = (game) => game.state.mochi;
export const hearts = (game) => Math.min(10, Math.floor((ms(game).bond || 0) / 100));
export const clamp100 = (v) => Math.max(0, Math.min(100, v));

// Bond points: 100 per heart. Each source counts once per day so the bond grows steadily over the term.
export function addBond(game, n, source = 'misc') {
  const s = ms(game), today = game.day;
  if (source !== 'event') {
    if (s.bondDay[source] === today) return 0;
    s.bondDay[source] = today;
  }
  const before = hearts(game);
  s.bond = Math.max(0, Math.min(1000, (s.bond || 0) + n));
  s.affection = Math.min(100, Math.round(s.bond / 10));
  const after = hearts(game);
  if (after > before) { game.toast(`Mochi: ${after} heart${after > 1 ? 's' : ''}`, 'heart'); game.sfx('heart'); game.bus.emit('mochiBond', { hearts: after }); }
  return n;
}
export function fillNeed(game, need, n) { const s = ms(game); s.needs[need] = clamp100((s.needs[need] || 0) + n); }

// Mood from her needs: the lowest one speaks loudest.
export function mood(game) {
  const s = ms(game), n = s.needs, low = NEEDS.reduce((a, k) => (n[k] < n[a] ? k : a), 'food');
  const avg = NEEDS.reduce((a, k) => a + n[k], 0) / 4;
  if (game.weather === 'storm' && game.world && game.world.map && game.world.map.id === 'home') return { id: 'scared', text: 'Scared of the thunder', icon: 'i_exclaim' };
  if (n[low] < 25) return { id: low, text: { food: 'Hungry', play: 'Bored', groom: 'Scruffy', love: 'Lonely' }[low], icon: { food: 'i_question', play: 'i_music', groom: 'i_sweat', love: 'i_chat' }[low] };
  if (avg > 80) return { id: 'blissful', text: 'Blissful', icon: 'heart' };
  if (avg > 55) return { id: 'happy', text: 'Happy', icon: 'heart' };
  return { id: 'content', text: 'Content', icon: 'i_music' };
}

// ---------- items ----------
// Cat foods for the taste journal. pref is her baseline liking (the per-save favourite is rolled on top).
export const FOODS = [
  { id: 'kibble', name: 'Crunchy kibble', c: RAMPS.wood[2], shape: 'bowl', pref: 0.45 },
  { id: 'tuna', name: 'Tuna', c: '#e88a8a', shape: 'fish', pref: 0.7 },
  { id: 'salmon', name: 'Salmon flakes', c: '#f4a070', shape: 'bowl', pref: 0.85 },
  { id: 'chicken', name: 'Chicken bits', c: '#f0d0a0', shape: 'bowl', pref: 0.6 },
  { id: 'sardine', name: 'Sardines', c: '#8aa8c8', shape: 'fish', pref: 0.55 },
  { id: 'bonito', name: 'Bonito flakes', c: '#e8b890', shape: 'bowl', pref: 0.65 },
  { id: 'pouch', name: 'Wet food pouch', c: '#b89ae0', shape: 'bottle', pref: 0.5 },
  { id: 'shrimp', name: 'Tiny shrimp', c: '#ff9a8a', shape: 'bowl', pref: 0.6 },
];
for (const f of FOODS) f.icon = itemIcon(f.shape, { c: f.c });

// Morning gifts she leaves by the bed (cat: misc, small sell values).
export const GIFTS = [
  ['mochi_gift_button', 'Shiny button', 'A brass-coloured button. Mochi looked very proud.', 'coin', '#e0a84a'],
  ['mochi_gift_feather', 'Pigeon feather', 'A soft grey feather, slightly chewed.', 'feather', '#a8a8c0'],
  ['mochi_gift_leaf', 'Perfect leaf', 'She picked the best leaf in the whole yard.', 'leafy', '#74a85a'],
  ['mochi_gift_sock', 'Lost sock', 'So that\'s where it went.', 'shirt', '#86cdb0'],
  ['mochi_gift_cap', 'Bottle cap', 'Batted all the way across the kitchen.', 'coin', '#e0707a'],
  ['mochi_gift_ribbon', 'Ribbon scrap', 'A red ribbon from somebody\'s present.', 'paper', '#e43b44'],
  ['mochi_gift_earring', 'Lost earring', 'A tiny silver star earring. Whose could it be?', 'star', '#c8c8dc'],
  ['mochi_gift_pebble', 'Smooth pebble', 'Round, cool and very serious.', 'rock', '#aaa3a0'],
  ['mochi_gift_flower', 'Squashed flower', 'Carried gently. Mostly.', 'flower', '#f4a8c0'],
  ['mochi_gift_hairtie', 'Hair tie', 'One of Misa\'s. Mochi considers it hers now.', 'toy', '#b89ae0'],
  ['mochi_gift_bottlecap', 'Marble', 'A blue marble that rolls under everything.', 'gem', '#7fb2e0'],
  ['mochi_gift_shell', 'Tiny shell', 'How did a shell get into the house?', 'shell', '#f2dcaa'],
];
registerMany('item', Object.fromEntries(GIFTS.map(([id, name, desc, shape, c]) => [id, { name, desc, cat: 'misc', price: 8, icon: itemIcon(shape, { c }), tags: ['mochi_gift'] }])));
registerMany('item', {
  mochi_star_pebble: { name: 'Shooting-star pebble', desc: 'Mochi\'s gift of the year. It glitters like a little piece of sky.', cat: 'key', key: true, price: 0, icon: itemIcon('gem', { c: '#ffd76a' }) },
  key_mochi_harness: { name: 'Mochi\'s harness', desc: 'A red harness and lead. Talk to Mochi to take her for a walk.', cat: 'key', key: true, price: 0, icon: itemIcon('toy', { c: '#e43b44' }) },
  mochi_treat: { name: 'Churu treat', desc: 'A squeezy tube of tuna paste. Cats go wild for it. Give one to Mochi.', cat: 'misc', price: 12, icon: itemIcon('bottle', { c: '#ffd76a' }) },
});

// ---------- cat sounds ----------
addSfx('hiss', ({ noise }) => noise(0.35, 0.05, 2500));
addSfx('trill', ({ tone }) => { tone(700, 0.08, 'sine', 0.05, 200); tone(900, 0.12, 'sine', 0.05, 150, 0.07); });
addSfx('chirp', ({ tone }) => { tone(1300, 0.04, 'sine', 0.04, 400); tone(1300, 0.04, 'sine', 0.04, 400, 0.09); });
addSfx('mew', ({ tone }) => tone(1100, 0.16, 'sine', 0.05, 300));
addSfx('woof', ({ tone, noise }) => { tone(220, 0.12, 'square', 0.05, -60); noise(0.08, 0.03, 300); });
addSfx('quack', ({ tone }) => { tone(420, 0.09, 'sawtooth', 0.03, -120); tone(400, 0.09, 'sawtooth', 0.03, -120, 0.13); });
addSfx('flutter', ({ noise }) => { noise(0.05, 0.03, 3000); noise(0.05, 0.03, 3000, 0.06); noise(0.05, 0.02, 3000, 0.12); });

// ---------- needs tick ----------
register('system', 'mochiNeeds', {
  init(game) {
    game.bus.on('hour', () => {
      const s = ms(game), n = s.needs;
      n.food = clamp100(n.food - 4); n.play = clamp100(n.play - 5); n.groom = clamp100(n.groom - 2); n.love = clamp100(n.love - 4);
      if (s.walking) { n.play = clamp100(n.play + 6); n.love = clamp100(n.love + 4); }
    });
    game.bus.on('dayStart', () => {
      const s = ms(game), n = s.needs;
      n.food = Math.min(n.food, 35); n.play = clamp100(n.play - 15); n.groom = clamp100(n.groom - (game.season === 'spring' ? 15 : 8)); n.love = clamp100(n.love - 10);
      // a day with every need cared for nudges the bond
      if (s.lastCare === game.day - 1) addBond(game, 10, 'allcare');
    });
    game.bus.on('homeTask', ({ id }) => {
      if (id === 'feed') { fillNeed(game, 'food', 100); addBond(game, 15, 'feed'); }
      if (id === 'laundry') ms(game).warmLaundry = game.day;
    });
    game.mochiHearts = () => hearts(game);
    game.mochiBond = (n, src) => addBond(game, n, src);
  },
});
export function checkAllCare(game) { const s = ms(game); if (NEEDS.every((k) => s.needs[k] >= 60)) s.lastCare = game.day; }

features('Mochi', [
  'Mochi\'s bond: 10 hearts that grow with feeding, petting, play, grooming and walks',
  'Mochi has four daily needs (food, play, grooming and affection) that slowly drop through the day',
  'Mochi\'s mood (happy, hungry, bored, scruffy, lonely, blissful, scared) follows her needs and the weather',
  'A day with all of Mochi\'s needs cared for adds a little extra bond the next morning',
  'Mochi sheds more in spring, so she needs brushing more often',
  'Churu treats for Mochi: a quick boost of affection and a happy trill',
  'Cat sounds: Mochi trills, chirps at birds and hisses; Kuro mews; Daifuku woofs and the ducks quack',
]);
