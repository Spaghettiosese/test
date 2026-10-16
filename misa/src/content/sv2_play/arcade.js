// Arcade: Star Runner, Mochi Kart and Kumo Quest cabinets (Sunny Mart corner + three cabinets in the shotengai), a prize counter
// where tickets buy toys, furniture and rare gifts, high-score tables stored in the save, and the best-lap ghost.
// Cabinets: interactions sv2_cab_star / sv2_cab_kart / sv2_cab_kumo / sv2_cab_mart; prize counter: sv2_prize.
// Try it: __misa.warp('shotengai', 19, 9, 'up')  or  __misa.warp('mart', 15, 9, 'right')
import { register, get, features } from '../../core/registry.js';
import '../../minigames/sv2_play/starrunner.js';
import '../../minigames/sv2_play/mochikart.js';
import '../../minigames/sv2_play/kumoquest.js';
import { S, say, N, call, has, stickers } from './state.js';

export const GAMES = {
  star: { id: 'sv2_star_runner', name: 'Star Runner', goal: 4500, cost: 30, rivals: [['KAI', 4500], ['KIKO', 3300], ['PIP', 2500], ['THEO', 1700]], blurb: 'Mochi vs. the dust bunnies! Arrows move, Mochi shoots by herself, E drops a bomb. Grab power-ups. Bosses on stages 3 and 6.' },
  kart: { id: 'sv2_mochi_kart', name: 'Mochi Kart', goal: 3600, cost: 30, rivals: [['PIP', 3600], ['KAI', 2900], ['RINA', 2300], ['SUZU', 1700]], blurb: 'Three laps. Left and right steer, E boosts. Dodge cones and slow karts, grab coins, and chase your best-lap ghost.' },
  kumo: { id: 'sv2_kumo_quest', name: 'Kumo Quest', goal: 2600, cost: 25, rivals: [['SUZU', 2600], ['MIKA', 2000], ['HINA', 1500], ['GORO', 900]], blurb: 'Hop across the cafe shelves, collect every order, stomp dust bunnies and ring the bell. E jumps.' },
};
export const KEYS = Object.keys(GAMES);
const NAME = { star: 'Star Runner', kart: 'Mochi Kart', kumo: 'Kumo Quest' };

// The shown table: seeded rivals plus the player's own scores, best five.
export function table(g, key) {
  const gm = GAMES[key];
  return [...gm.rivals.map(([n, s]) => ({ n, s })), ...S(g).hs[key].map((e) => ({ n: 'MISA', s: e.s, me: true }))].sort((a, b) => b.s - a.s).slice(0, 5);
}
export const best = (g, key) => S(g).hs[key].reduce((a, e) => Math.max(a, e.s), 0);
export const goalsMet = (g) => KEYS.filter((k) => best(g, k) >= GAMES[k].goal).length;
export const tokens = (g) => g.count('sv2_token');

// Pay for a play with a token, else coins. Returns false when Misa cannot afford it.
export function pay(g, key) {
  if (g.has('sv2_token')) { g.take('sv2_token', 1); return true; }
  if (!g.spend(GAMES[key].cost)) { g.toast('Not enough coins for a play.'); g.sfx('wrong'); return false; }
  g.sfx('coin'); return true;
}
// Apply a finished game to the save. Pure state changes + toasts, so tests can call it directly.
export function recordPlay(g, key, data) {
  const s = S(g), gm = GAMES[key], pts = data.points | 0, tk = data.tickets | 0, prev = best(g, key);
  s.plays[key]++; s.tickets += tk; s.ticketsTotal += tk; g.stat('arcadePlays'); g.stat('arcadeTickets', tk);
  s.hs[key].push({ s: pts, d: g.day }); s.hs[key].sort((a, b) => b.s - a.s); s.hs[key].length = Math.min(s.hs[key].length, 5);
  const out = { newBest: pts > prev && pts > 0, tickets: tk, goal: false };
  if (key === 'kart' && data.extra && data.extra.time && data.extra.ghost && (!s.bestTime || data.extra.time < s.bestTime)) { s.ghost = { pts: data.extra.ghost, time: data.extra.time }; s.bestTime = data.extra.time; out.ghost = true; }
  if (pts >= gm.goal && !s.goalsMet[key]) {
    s.goalsMet[key] = g.day; out.goal = true; g.stat('arcadeGoals');
    g.toast(`You beat ${gm.rivals[0][0]}'s score on ${gm.name}!`, 'i_star');
    if (get('npc', gm.rivals[0][0].toLowerCase())) g.addFriend(gm.rivals[0][0].toLowerCase(), 15);
  }
  if (tk) g.toast(`+${tk} ticket${tk > 1 ? 's' : ''} (${s.tickets} total)`, 'i_star');
  if (out.newBest && prev) g.toast(`New ${gm.name} high score: ${pts}`, 'i_star');
  g.addMood(3); g.advance(12);
  g.bus.emit('sv2ArcadePlayed', { key, points: pts, tickets: tk, won: !!data.won });
  return out;
}

// A single call step that pays and plays, so a failed payment never opens the game.
function playStep(key) {
  const gm = GAMES[key];
  return call(async (g) => {
    if (!pay(g, key)) return;
    const s = S(g);
    const r = await g.minigame(gm.id, { hs: table(g, key), ghost: key === 'kart' ? s.ghost : null, best: key === 'kart' ? s.bestTime : 0 });
    if (r && r.data && r.data.points !== undefined) recordPlay(g, key, r.data);
  });
}
const tableLines = (g, key) => table(g, key).map((e, i) => `${i + 1}. ${e.n} ${e.s}`).join('   ');
export function cabinetSteps(g, key) {
  const gm = GAMES[key], tk = tokens(g);
  return [{ t: 'choice', prompt: `${gm.name}  Best ${best(g, key)}  Tickets ${S(g).tickets}`, options: [
    { text: tk ? `Play (1 token, ${tk} left)` : `Play (${gm.cost} coins)`, steps: [playStep(key)] },
    { text: 'High scores', steps: [N(tableLines(g, key))] },
    { text: 'How to play', steps: [N(gm.blurb)] },
    { text: 'Leave', steps: [] },
  ] }];
}
for (const key of KEYS) register('interaction', 'sv2_cab_' + key, { label: (g) => `Play ${NAME[key]}`, run: (g) => g.run(cabinetSteps(g, key)) });
register('interaction', 'sv2_cab_mart', {
  label: 'Arcade cabinet',
  run: (g) => g.run([N('A three-in-one cabinet glows in the corner. Tokens are 15 coins at the prize counter in the shotengai, or 25-30 coins a play.'), { t: 'choice', prompt: 'Which game?', options: [
    ...KEYS.map((k) => ({ text: `${NAME[k]} (best ${best(g, k)})`, steps: [call((gg) => gg.run(cabinetSteps(gg, k)))] })),
    { text: 'Leave', steps: [] }] }]),
});

// ---------------------------------------------------------------- prize counter (tickets)
// [item, tickets, category]. Items that do not exist in this build are skipped.
const PRIZES = [
  ['toy_yarn_ball', 20, 'toys'], ['toy_catnip_mouse', 25, 'toys'], ['toy_feather_wand', 30, 'toys'], ['prize_star_keychain', 45, 'toys'], ['prize_pixel_cat', 60, 'toys'], ['prize_cloud_plush', 90, 'toys'], ['prize_mini_cabinet', 160, 'toys'], ['toy_fig_gold_mochi', 500, 'toys'],
  ['furn_plushie_cat', 160, 'furn'], ['furn_maneki', 180, 'furn'], ['furn_neon_sign', 260, 'furn'], ['furn_star_bunny_lamp', 340, 'furn'], ['prize_ticket_lantern', 120, 'furn'], ['furn_jukebox', 600, 'furn'],
  ['gift_music_box', 220, 'rare'], ['gift_compass', 240, 'rare'], ['gift_vinyl_record', 260, 'rare'], ['gift_retro_cartridge', 300, 'rare'], ['book_star_atlas', 320, 'rare'], ['gift_watch_chain', 360, 'rare'], ['prize_gold_trophy', 900, 'rare'],
  ['sv2_token', 10, 'bits'], ['sv2_battery', 15, 'bits'], ['prize_rainbow_gum', 12, 'bits'], ['sv2_compass', 140, 'bits'], ['star_sticker', 80, 'bits'],
];
export const prizesIn = (cat) => PRIZES.filter(([id, , c]) => c === cat && has(id));
const nm = (id) => (get('item', id) || { name: id }).name;
function buy(g, id, cost) {
  const s = S(g);
  if (s.tickets < cost) { g.toast(`Need ${cost} tickets (you have ${s.tickets}).`); g.sfx('wrong'); return false; }
  g.give(id, 1, true); s.tickets -= cost; s.prizes[id] = (s.prizes[id] || 0) + 1; g.stat('prizesBought'); g.sfx('buy'); g.toast(`Prize: ${nm(id)}`, get('item', id).icon);
  return true;
}
export function prizeSteps(g) {
  const cat = (c, label) => ({ text: label, steps: [{ t: 'choice', prompt: `${label}  (${S(g).tickets} tickets)`, options: [...prizesIn(c).map(([id, cost]) => ({ text: `${nm(id)}  ${cost}T`, steps: [call((gg) => { buy(gg, id, cost); })] })), { text: 'Back', steps: [] }] }] });
  return [say('misa', 'happy', `Hi! I have ${S(g).tickets} tickets.`), { t: 'choice', prompt: 'Prize counter', options: [cat('toys', 'Toys'), cat('furn', 'Furniture'), cat('rare', 'Rare gifts'), cat('bits', 'Tokens and extras'), { text: 'Sell nothing, just look', steps: [N('Rows of plushies grin down from the shelf. A sign reads: TICKETS NEVER EXPIRE.')] }] }];
}
register('interaction', 'sv2_prize', { label: 'Prize counter', run: (g) => g.run(prizeSteps(g)) });

// ---------------------------------------------------------------- hook the maps
export function hookObjects(mapId, fn) {
  const m = get('map', mapId); if (!m) return;
  const d = Object.getOwnPropertyDescriptor(m, 'objects');
  const base = d && d.get ? d.get : () => (d ? d.value : m.objects) || [];
  let lastIn = null, lastOut = null;
  Object.defineProperty(m, 'objects', { get: () => { const b = base(); if (b !== lastIn) { lastIn = b; lastOut = fn(b); } return lastOut; }, enumerable: true, configurable: true });
}
hookObjects('mart', (objs) => objs.map((o) => (o.spr === 'int_arcade' ? { ...o, interact: undefined, use: 'sv2_cab_mart' } : o)));
hookObjects('shotengai', (objs) => [...objs,
  { spr: 'sv2_cab_star', x: 17, y: 10, use: 'sv2_cab_star', shadow: 12, light: { kind: 'screen', y: -26 } },
  { spr: 'sv2_cab_kart', x: 18, y: 10, use: 'sv2_cab_kart', shadow: 12, light: { kind: 'screen', y: -26 } },
  { spr: 'sv2_cab_kumo', x: 19, y: 10, use: 'sv2_cab_kumo', shadow: 12, light: { kind: 'screen', y: -26 } },
  { spr: 'sv2_prize_counter', x: 20, y: 10, w: 3, use: 'sv2_prize', shadow: 40 },
]);
void stickers;

register('boardNote', 'sv2_arcade_note', { title: 'Arcade news', text: 'New cabinets in the shotengai and a corner machine at Sunny Mart! Star Runner, Mochi Kart and Kumo Quest. Beat Kai\'s scores for bragging rights, and trade tickets at the prize counter.', color: '#9ad0ff' });

features('Arcade & Travel', [
  'Three-in-one arcade cabinet in the Sunny Mart corner: pick Star Runner, Mochi Kart or Kumo Quest',
  'Three standalone cabinets and a ticket prize counter under the shotengai arcade roof',
  'Star Runner: top-down dust bunny shooter with auto-aim, Mochi bombs, six stages and a boss on stages 3 and 6',
  'Star Runner power-ups: spread shot, rapid fire, shield, speed, extra heart and extra bomb, with kill combos',
  'Mochi Kart: three-lap lane racer with cones, puddles, rival karts, coins, boost pads and a rising pace each lap',
  'Mochi Kart records your best run and races a translucent ghost kart against it next time',
  'Kumo Quest: fixed-screen cafe platformer with jump-through shelves, stompable dust bunnies and dripping spills',
  'Kumo Quest has four levels, a level timer, coffee speed boosts and Mika\'s counter bell to deliver each round',
  'Every arcade game has an attract screen, lives, rising difficulty, a game over card and a result with tickets',
  'All arcade games play with arrows and E, with mouse drag or with touch: drag to steer, tap above to jump',
  'Arcade plays cost a token or 25 to 30 coins; tokens are cheap at the prize counter',
  'High-score tables stored in the save: rival entries from Kai, Kiko, Pip and friends plus your best five per game',
  'Beating the top rival score on a game gives a toast and a friendship boost with that rival',
  'Prize counter trades tickets for toys, furniture, rare gifts, tokens, batteries and Star Stickers',
  'Seven new prize items: pixel cat plush, Kumo plush, mini arcade cabinet, ticket lantern, gum, star keychain and a golden trophy',
  'Town board notice announcing the new arcade corner',
]);
