// Gardening show / ikebana: flower arranging minigame, bouquets that the cast loves (gift_sv4h_* tagged 'bouquet'), ribbons,
// and a seasonal flower show in the park. Try it: __misa.warp('park', 31, 11, 'up'); __misa.give('crop_tulip', 4); __misa.give('sv4h_wrap', 2)
import { register, get, features } from '../../core/registry.js';
import { seasonOf, yearOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { S, clamp, item, gain, addRibbon, rivals, rankOf, say, N, call, idle, nameOf, addObjects, stat } from './state.js';
import { hasBuff } from '../economy/core.js';
import '../../minigames/sv4_hobbies/ikebana.js';

// ---------------------------------------------------------------- flowers
export const STEMS = [['violet', 'Cut violets', 'spring', '#a98be0', 30, false], ['zinnia', 'Cut zinnias', 'summer', '#f08a5a', 30, false], ['dahlia', 'Cut dahlias', 'autumn', '#e0507a', 35, false], ['narcissus', 'Cut narcissus', 'winter', '#f6e27a', 35, false], ['orchid', 'Moon orchid', null, '#d9a8ff', 120, true]];
for (const [k, nm, ss, c, pr, rare] of STEMS) item('sv4h_stem_' + k, nm, 'crop', pr, 'flower', c, `Fresh cut ${nm.toLowerCase().replace('cut ', '')} for arranging${rare ? '. A rare bloom.' : '.'}`, { tags: ['flower', 'stem', k], seasons: ss ? [ss] : undefined });
item('sv4h_wrap', 'Wrapping paper', 'misc', 8, 'paper', K.ribbon[3], 'Pretty paper and ribbon to wrap a bouquet.', { tags: ['material'] });
const BQ = [['posy', 'Little posy', 70, 0, ['flower', 'handmade', 'gift', 'cute']], ['bouquet', 'Handmade bouquet', 170, 1, ['flower', 'handmade', 'gift', 'bouquet']], ['grand', 'Grand bouquet', 340, 2, ['flower', 'handmade', 'gift', 'bouquet', 'grand']]];
for (const [k, nm, pr, t, tags] of BQ) item('gift_sv4h_' + k, nm, 'gift', pr, 'flower', [K.coral[3], K.ribbon[2], K.butter[3]][t], t === 2 ? 'A magnificent bouquet in ribbon and tissue. The cast adores them.' : 'A bouquet you arranged yourself. Flowers make a lovely gift.', { c2: K.mint[3], tags: [...tags, 'bouquet'].filter((x, i, a) => a.indexOf(x) === i && (k !== 'posy' || x !== 'bouquet')) });
const SEAS = { tulip: 'spring', pansy: 'spring', dandelion: 'spring', sunflower: 'summer', morning_glory: 'summer', hibiscus: 'summer', cosmos: 'autumn', chrysanthemum: 'autumn', camellia: 'winter', snowdrop: 'winter', crocus: 'winter', plum_blossom: 'winter' };
const COL = { tulip: '#f06a8a', pansy: '#a98be0', dandelion: '#f6d84a', sunflower: '#f6c844', morning_glory: '#6a8cf0', hibiscus: '#f0506a', cosmos: '#f08aa6', chrysanthemum: '#e8d9a0', camellia: '#e6584f', snowdrop: '#f4f4ff', crocus: '#b48cf0', plum_blossom: '#f4b0c8' };
const key = (id) => Object.keys(SEAS).find((k) => id.endsWith(k));
export const isStem = (id) => /^(crop_|forage_|flower_)/.test(id) && !!key(id) && !!get('item', id);
export function stemInfo(id) {
  const it = get('item', id), k = key(id);
  if (id.startsWith('sv4h_stem_')) { const s = STEMS.find((x) => x[0] === id.slice(10)); return { id, name: it.name.replace('Cut ', ''), c: s[3], season: s[2], rare: s[5] }; }
  return { id, name: it.name, c: COL[k], season: SEAS[k], rare: (it.rarity || 0) >= 3 };
}
export function bagStems(g) {
  return Object.entries(g.state.inv).filter(([id, n]) => n > 0 && (isStem(id) || id.startsWith('sv4h_stem_'))).slice(0, 8).map(([id, n]) => ({ ...stemInfo(id), n: Math.min(n, 3) }));
}
export const tierOf = (score) => (score >= 0.8 ? 'grand' : score >= 0.5 ? 'bouquet' : 'posy');

// ---------------------------------------------------------------- arranging
export function makeBouquet(g, res) {
  for (const id of res.used) g.take(id, 1);
  const tier = tierOf(res.acc), id = 'gift_sv4h_' + tier, f = S(g).flower;
  g.give(id, 1, true); f.made++; f.best = Math.max(f.best, Math.round(res.acc * 100) / 100);
  gain(g, 'ikebana', 10 + res.acc * 20); g.addMood(3); g.advance(30); g.stat('bouquetsMade'); g.bus.emit('bouquetMade', { item: id, score: res.acc });
  return id;
}
async function runArrange(g, stems) {
  return g.minigame('sv4h_ikebana', { stems, season: seasonOf(g.day), level: g.skillLevel('ikebana') + (hasBuff(g, 'sv4h_steady') ? 2 : 0), noResult: true });
}
export async function arrange(g) {
  const stems = bagStems(g), total = stems.reduce((a, s) => a + s.n, 0);
  if (total < 3) return g.run([N('You need at least three stems: flowers from your garden, the woods, or cut flowers from the stationery stall.')]);
  if (!g.has('sv4h_wrap')) return g.run([N('You also need wrapping paper from the stationery stall.')]);
  const r = await runArrange(g, stems); if (!r || r.quit || !r.data) return;
  g.take('sv4h_wrap', 1);
  const id = makeBouquet(g, r.data);
  await g.run([N(`${r.data.text} You made a ${get('item', id).name.toLowerCase()}. Cast members who like flowers will love it!`)]);
}

// ---------------------------------------------------------------- flower show
const showKey = (g) => `${yearOf(g.day)}-${seasonOf(g.day)}`;
const RIV = [['goro', 0.55], ['hina', 0.5], ['mika', 0.45], ['hana', 0.6]];
export async function enterShow(g) {
  const f = S(g).flower, k = showKey(g);
  if (f.shows[k]) return g.run([N('You already entered the show this season. The judges are still smiling about it.')]);
  const stems = bagStems(g); if (stems.reduce((a, s) => a + s.n, 0) < 3) return g.run([N('You need at least three stems to enter the show.')]);
  const r = await runArrange(g, stems); if (!r || r.quit || !r.data) return;
  for (const id of r.data.used) g.take(id, 1);
  const score = clamp(r.data.acc + (hasBuff(g, 'sv4h_bloom') ? 0.05 : 0) + g.skillLevel('ikebana') * 0.01, 0, 1);
  const riv = RIV.filter(([id]) => get('npc', id)).map(([, b]) => clamp(b + g.rngFor('sv4hshow' + k)() * 0.3, 0, 1)), rank = rankOf(score, riv);
  f.shows[k] = rank; const prize = [0, 350, 180, 80, 25][rank];
  g.addMoney(prize, true); gain(g, 'ikebana', [0, 50, 35, 22, 10][rank]); g.stat('flowerShows');
  if (rank <= 3) addRibbon(g, 'flower', `${seasonOf(g.day)} flower show`, rank);
  if (rank === 1) { g.give('gift_sv4h_grand', 1, true); g.addMood(8); }
  await g.run([N(rank === 1 ? `Best in show! The ${seasonOf(g.day)} blue ribbon is yours, plus ${prize} coins and a grand bouquet.` : rank <= 3 ? `Placed ${rank}! A ribbon and ${prize} coins.` : `The judges liked your effort. ${prize} coins for entering.`)]);
}
register('festival', 'sv4h_flower_show', {
  name: 'Flower Show', icon: 'i_leaf', date: ['spring-10', 'summer-23', 'autumn-11', 'winter-10'], maps: ['park'], hours: ['09:00', '17:00'], desc: 'The seasonal flower show at the park. Arrange your best stems and impress the judges.',
  activities: [{ id: 'sv4h_show_entry', map: 'park', spot: 'lawn', dx: 2, dy: 0, label: 'Enter the flower show', daily: true, run: (g) => enterShow(g) }],
});
register('interaction', 'sv4h_flower_stand', {
  label: 'Flower stand',
  run(g) {
    const f = S(g).flower, ribs = S(g).ribbons.filter((r) => r.kind === 'flower');
    return g.run([{ t: 'choice', prompt: `Flower stand  (${f.made} bouquets, best ${Math.round(f.best * 100)}%)`, options: [
      { text: 'Arrange a bouquet', steps: [call((gg) => arrange(gg))] },
      { text: 'Flower show', steps: [N(g.festivalToday && g.festivalToday() && g.festivalToday().id === 'sv4h_flower_show' ? 'The show is on today! Use the entry mat on the lawn.' : 'The flower show is held on the 10th or so of each season in the park. Bring three fine stems.')] },
      { text: `My flower ribbons (${ribs.length})`, steps: [N(ribs.length ? ribs.map((r) => `${['', 'Blue', 'Red', 'White'][r.rank]}: ${r.name}`).join('; ') : 'No flower ribbons yet.')] },
      { text: 'Leave', steps: [] }] }]);
  },
});
addObjects('park', [{ spr: 'sv4h_flower_stand', x: 31, y: 10, w: 2, use: 'sv4h_flower_stand', shadow: 22 }]);

// The cast loves bouquets (and posies are liked because the cast already likes flowers).
for (const id of ['hana', 'rina', 'mika', 'sachiko', 'theo', 'suzu', 'kiko', 'goro']) {
  const n = get('npc', id); if (!n) continue;
  n.gifts ||= {}; (n.gifts.loveTags ||= []).includes('bouquet') || n.gifts.loveTags.push('bouquet');
}
features('Creative Hobbies', [
  'Ikebana skill (levels 1 to 10) with a flower stand in the park to arrange at',
  'Flower arranging minigame: take three stems and cut each at the ideal height for shin, soe and hikae',
  'Scores reward colour variety, in-season flowers and rare blooms; garden, woodland and cut flowers all work',
  'Bouquets come in three grades (little posy, handmade bouquet, grand bouquet) as gift_sv4h_* items',
  'Hana, Rina, Mika, Sachiko, Theo, Suzu, Kiko and Goro love bouquets by tag, and everyone likes flowers',
  'Seasonal Flower Show in the park (spring, summer, autumn, winter) against Goro, Hina, Mika and Hana, with blue, red and white ribbons',
  'Best in show wins a grand bouquet; the Fresh bloom buff makes shows easier',
]);
void stat; void idle; void nameOf; void say;
