// Seto Islands: interactions (village life, auction, school volunteering, shrine, ruins puzzle, cave chest, tower, garden, volleyball,
// lagoon diving and the Reef Guide, bungalow, bonfire and shooting stars, night market), shops, island jobs, bottles, the Seto Passport app
// and the regatta / lantern floating festivals.
import { register, registerMany, get, features } from '../../core/registry.js';
import { UI, panel, bar, drawText, icon } from '../../ui/ui.js';
import { tap, hit } from '../ui/kit.js';
import { JOBS, startShift } from '../economy/jobs.js';
import { tideAt } from '../coast/tides.js';
import '../../minigames/sv4_islands/games.js';
import { HaulGame } from '../../minigames/sv4_islands/games.js';
import { S4, STAMPS, stamp, stampsOf, stampTotal, PASSPORT_REWARDS, NOTES, REEF, reefCount, DISHES, RARE, markDone, todayDone, islandOfMap, ISLANDS } from './data.js';
import { stayNight } from './travel.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const call = (fn) => ({ t: 'call', fn });
const N = (text) => say(null, null, text);
const npcOr = (id) => (get('npc', id) ? id : null);
const hourOf = (g) => g.minutes / 60;
const between = (g, a, b) => hourOf(g) >= a && hourOf(g) < b;
const isNight = (g) => hourOf(g) >= 19 || hourOf(g) < 5;
const gold = (g, n, why) => { g.addMoney(n, true); g.toast(`+${n} coins${why ? ' (' + why + ')' : ''}`, 'i_coin'); };
const stick = (g, n) => { if (get('item', 'star_sticker')) g.give('star_sticker', n, true); };
const pickW = (rng, list) => { const t = list.reduce((a, x) => a + x[1], 0); let r = rng() * t; for (const [v, w] of list) if ((r -= w) < 0) return v; return list[0][0]; };

// ---------------------------------------------------------------- message in a bottle (one a day, 30 notes)
const BOTTLE_MAPS = ['beach', 'tsubame_pier', 'tsubame_village', 'lantern_isle_shore', 'coral_beach'];
export const bottleMapToday = (g) => BOTTLE_MAPS[Math.floor(g.rngFor('seto_bottle')() * BOTTLE_MAPS.length)];
export const bottleHere = (g, map) => { const b = S4(g).bottles; return Object.keys(b.notes).length < NOTES.length && b.last !== g.day && bottleMapToday(g) === map; };
export function readBottle(g) {
  const b = S4(g).bottles, n = Object.keys(b.notes).length;
  if (b.last === g.day || n >= NOTES.length) return g.say(null, null, 'Just sand and shells.');
  b.notes[n] = g.day; b.last = g.day; g.sfx('chime'); g.stat('bottlesRead'); g.bus.emit('bottleRead', { n: n + 1 });
  const steps = [N(`A message in a bottle! (${n + 1} of ${NOTES.length})`), N(`"${NOTES[n]}"`)];
  if (n + 1 >= NOTES.length) steps.push(call(() => { g.setFlag('seto_bottles_done'); g.give('furn_bottle_ship', 1); gold(g, 1500, 'the sea says thanks'); stick(g, 3); g.achieve && g.achieve('seto_bottles'); }), N('The sea keeps its promises. A tiny ship in a bottle washes up with the thirtieth note.'));
  return g.run(steps);
}
export const bottleObj = (map, x, y) => ({ spr: 'sv4_bottle', x, y, solid: false, shadow: 0, when: (g) => bottleHere(g, map), interact: { label: 'Pick up the bottle', run: readBottle } });

// ---------------------------------------------------------------- shops
const shop = (id, def) => register('shop', id, { color: '#3f8fb8', ...def });
shop('sv4_shells', { name: 'Ume\'s Shell Crafts', owner: 'ume', buys: ['shell'], greet: { default: ['Every shell was picked by hand. Mostly mine.', 'A chime for your window? It sings in the wind.'] }, thanks: ['Hang it where the breeze lives!'],
  stock: ['gift_shell_wind_chime', 'gift_sea_glass_bracelet', 'gift_conch_horn', 'furn_shell_lantern', 'gift_tsubame_charm', 'mat_sea_salt_flake', { item: 'gift_pearl_pin', when: 'flag:seto_visited' }] });
shop('sv4_fishery', { name: 'Tsubame Fishery Counter', owner: 'tetsu', buys: ['fish'], bonusCats: ['fish'], hours: ['6:00', '15:00'], greet: { default: ['Fresh off the boats. Sell, buy, or just admire.'] }, thanks: ['Good fish, good day.'],
  stock: ['mat_bait_worms', 'mat_bait_shrimp', 'ing_shrimp', 'ing_kelp', 'ing_salt', 'mat_sea_salt_flake'] });
shop('sv4_resort', { name: 'Atoll Resort Store', owner: 'lani', greet: { default: ['Sun cream is on the shelf, sun is outside. Enjoy!'] }, thanks: ['Have a bright day!'],
  stock: ['tool_snorkel', 'gift_beach_ball', 'drink_coconut_juice', 'snack_coconut_chips', 'furn_island_hammock', 'dish_coral_shaved_ice'] });
shop('sv4_bar', { name: 'Kaito\'s Beach Bar', owner: 'kaito', greet: { default: ['Welcome to the only bar where the floor is the beach.'] }, thanks: ['Cheers to that!'], stock: ['drink_coconut_juice', 'drink_tropic_smoothie', 'dish_coral_shaved_ice', 'dish_grilled_corn_bar'] });
shop('sv4_market', { name: 'Luna\'s Night Stall', owner: 'luna', greet: { default: ['Lantern light makes everything look lucky. Browse!'] }, thanks: ['Come back under the lanterns!'], buys: ['fish'],
  stock: ['mat_glass_float', 'gift_shell_wind_chime', 'gift_beach_ball', 'snack_coconut_chips', 'gift_conch_horn', 'drink_tropic_smoothie'] });
shop('sv4_market_food', { name: 'Market Food Stall', owner: 'luna', greet: { default: ['Hot, sweet, salty. Pick two.'] }, thanks: ['Enjoy!'], stock: ['dish_grilled_corn_bar', 'dish_coral_shaved_ice', 'drink_coconut_juice', 'snack_coconut_chips'] });
shop('sv4_diner', {
  name: 'Umi Diner', owner: 'umi', hours: ['10:00', '21:00'], greet: { default: ['Eight dishes, all of them good. Sit anywhere!'], rain: ['Soup weather. I will not take no for an answer.'] }, thanks: ['Eat slowly. The sea is not going anywhere.'],
  stock: DISHES.map((d) => d[0]),
  onBuy(g, id) { const r = get('recipe', id); if (r && g.learnRecipe && !(g.knowsRecipe && g.knowsRecipe(id))) { g.learnRecipe(id); g.toast(`Umi taught you ${get('item', id).name}`, 'i_star'); } stamp(g, 'ts_diner'); },
});

// ---------------------------------------------------------------- island jobs (extend the economy job table)
JOBS.islandfishery = { name: 'Tsubame Fishery', role: 'Fishery helper', boss: 'tetsu', bossName: 'Tetsu', minigame: 'sv4_job_fish', wage: 260, energy: 22, xp: { fishing: 10 }, after: ['15:30', '16:30'], free: ['7:00', '13:00'], closed: [6], unlock: (g) => !!g.flag('seto_visited'), unlockText: 'After your first island trip' };
JOBS.deckhand = { name: 'Seto Ferry', role: 'Ferry deckhand', boss: 'nagisa', bossName: 'Captain Nagisa', minigame: 'sv4_job_deck', wage: 240, energy: 20, xp: { charm: 6, fishing: 5 }, after: ['15:30', '16:30'], free: ['7:00', '15:00'], closed: [], unlock: (g) => !!g.flag('seto_visited'), unlockText: 'After your first island trip' };
register('minigame', 'sv4_job_fish', { title: 'Fishery shift', resultTitle: 'SHIFT DONE!', make: (g, o) => new HaulGame(g, { ...o, title: 'FISHERY SHIFT' }), bot: get('minigame', 'sv4_haul').bot });
register('minigame', 'sv4_job_deck', { title: 'Deckhand shift', resultTitle: 'SHIFT DONE!', make: (g, o) => new HaulGame(g, { ...o, title: 'DECKHAND SHIFT', salt: 5 }), bot: get('minigame', 'sv4_haul').bot });

// ---------------------------------------------------------------- interactions
const look = (label, text) => ({ label, run: (g) => g.say(null, null, text) });
const stampOnEnter = { tsubame_school: 'ts_school', lantern_ruins: 'li_ruins', lantern_cave: 'li_cave', lantern_garden: 'li_garden', tsubame_fishery: null, coral_market: 'co_market' };
const gearsRun = async (g) => {
  if (g.flag('seto_gears_done')) return g.run([N('The four gears turn on their own, tracing tonight\'s sky on the dome.'), call(() => { if (!todayDone(g, 'stars') && isNight(g)) { markDone(g, 'stars'); g.addMood(8); g.toast('The dome shows you the stars: +mood', 'i_star'); } })]);
  const r = await g.minigame('sv4_gears', {});
  if (!r || r.quit || !(r.data && r.data.turns)) return;
  g.setFlag('seto_gears_done'); stamp(g, 'li_gears'); g.give('gift_astrolabe', 1);
  await g.run([N('Click. The gears mesh, the dome shudders, and a slit of starlight slides across the floor.'), N('A brass astrolabe drops out of a hidden drawer.'),
    call(() => { if (g.flag('lantern_lit')) g.toast('Far away, the Star Lantern seems to answer with a blink', 'i_star'); })]);
};
const tideLow = (g) => tideAt(g) === 'low';
const chestRun = async (g) => {
  const s = S4(g);
  if (!tideLow(g)) return g.say(null, null, 'The chest glints under the water. It is far too deep until the tide goes out.');
  if (g.day - s.chest < 7 && s.chest) return g.say(null, null, 'The chest is shut and empty. The sea will bring something new in a week.');
  const r = await g.minigame('sv4_chest', {}); if (!r || r.quit) return;
  s.chest = g.day; g.setFlag('seto_chest_day', g.day); stamp(g, 'li_chest');
  const rng = g.rngFor('seto_chest'), coins = 200 + Math.round(r.score * 400), extra = pickW(rng, [['min_sunken_coin', 40], ['mat_pearl', 20], ['gift_old_compass', 8], ['furn_pirate_flag', 8], ['mat_glass_float', 24]]);
  g.give(extra, 1, true); gold(g, coins, 'sunken treasure'); g.give('min_sunken_coin', 1, true); g.collect('mineral', 'min_sunken_coin');
  await g.run([N(`Inside: ${coins} coins, a sunken coin and ${get('item', extra).name.toLowerCase()}!`)]);
};
const diveRun = async (g) => {
  if (!between(g, 7, 22)) return g.say(null, null, 'The lagoon is closed for diving at this hour. Lani insists on sleep.');
  if (!g.has('tool_snorkel') && g.flag('seto_snorkel_day') !== g.day) return g.say(null, null, 'You need a snorkel set: rent or buy one at the snorkel hut on the sand.');
  if (g.energy < 10) return g.say(null, null, 'Too tired to swim. A smoothie first?');
  const s = S4(g), night = isNight(g);
  const r = await g.minigame('sv4_dive', { night, known: s.reef.species, guarantee: s.reef.dives === 0 ? 'clownfish' : null, salt: s.reef.dives });
  g.useEnergy(10); g.advance(90); s.reef.dives++; g.stat('dives'); stamp(g, 'co_dive');
  const shots = (r && r.data && r.data.species) || [];
  let fresh = 0;
  for (const id of shots) { if (!s.reef.species[id]) { s.reef.species[id] = g.day; fresh++; g.bus.emit('reefPhoto', { id }); g.collect('reef', id); } if (['manta', 'whaleshark', 'reefshark'].includes(id)) stamp(g, 'co_photo'); }
  const n = reefCount(g);
  if (n >= 10) stamp(g, 'co_reef10');
  if (n >= 24) { stamp(g, 'co_reef24'); if (!g.flag('seto_reef_full')) { g.setFlag('seto_reef_full'); g.give('furn_coral_aquarium', 1); stick(g, 3); } }
  for (const [k, c] of [[8, 300], [16, 700]]) if (n >= k && !s.claimed['reef' + k]) { s.claimed['reef' + k] = 1; gold(g, c, 'Reef Guide'); }
  gold(g, shots.length * 20, 'photo prints');
  await g.run([N(fresh ? `${fresh} new species added to the Reef Guide! (${n} of ${REEF.length})` : 'No new species this time, but the reef was lovely.')]);
};
const bonfireRun = async (g) => {
  if (hourOf(g) < 17.5) return g.say(null, null, 'The bonfire is stacked and waiting. Come back around sunset (17:30).');
  if (hourOf(g) >= 23) return g.say(null, null, 'Only embers glow now. Tomorrow evening, perhaps.');
  if (todayDone(g, 'bonfire') && hourOf(g) < 20.5) return g.say(null, null, 'The fire crackles. Everyone is humming.');
  const night = hourOf(g) >= 20.5, clear = g.weather !== 'rain' && g.weather !== 'storm';
  const first = !todayDone(g, 'bonfire');
  markDone(g, 'bonfire');
  const steps = [];
  if (first) steps.push({ t: 'fade', to: 1, dur: 0.4 }, call(() => g.advance(60)), { t: 'fade', to: 0, dur: 0.4 }, N('The sun melts into the sea and the whole beach turns gold. Kaito lights the bonfire; Lani passes round roasted corn.'), say(npcOr('lani'), 'happy', 'Sunset on the atoll. Best thing we sell, and it is free.'), call(() => { stamp(g, 'co_bonfire'); g.addMood(15); g.stat('bonfires'); }));
  if (night && clear) {
    const rng = g.rngFor('shootingstar'), star = rng() < 0.45 || g.check('date:summer-12');
    steps.push(N('The stars come out, thousands of them.'));
    if (star) steps.push({ t: 'wait', dur: 1 }, N('A shooting star scratches the sky from edge to edge!'), call(() => { stamp(g, 'co_star'); g.addMood(12); g.stat('shootingStars'); }), { t: 'choice', prompt: 'Make a wish', options: [
      { text: 'Safe voyages for everyone', steps: [call(() => g.addBuff && g.addBuff('lucky', 240))] }, { text: 'More friends', steps: [call(() => g.addXP('charm', 12))] }, { text: 'A quiet, cozy life', steps: [call(() => g.addEnergy(20))] }]});
    else steps.push(N('No shooting stars tonight, but the Milky Way spills across the water. Maybe tomorrow.'));
  }
  return g.run(steps);
};
const hutBed = async (g) => {
  const s = S4(g);
  if (s.bungalow !== g.day) return g.say(null, null, 'The bungalow bed belongs to someone else tonight. Ask Lani at the front desk.');
  await g.sleep();
  const v = get('map', 'coral_hut_resort').spawns.default; await g.warp('coral_hut_resort', v[0], v[1], 'up');
};
const teachRun = async (g) => {
  if (!g.check('weekday') || !between(g, 8.5, 14.5)) return g.say('hibiki', 'neutral', 'School hours are weekdays from 8:30. Come by and I will happily hand you the chalk.');
  if (todayDone(g, 'teach')) return g.say('hibiki', 'happy', 'You were wonderful today. Same time next week?');
  if (g.energy < 15) return g.say('hibiki', 'sad', 'You look worn out. Rest, then teach.');
  const s = S4(g), steps = [say('hibiki', 'happy', 'Six kids, one room, zero patience. Teach them anything for a morning?'), { t: 'choice', prompt: 'Today\'s lesson', options: [
    { text: 'Sea creatures', steps: [say('misa', 'happy', 'Who knows what an octopus has three of?'), say(null, 'happy', 'Nana: HEARTS! Daichi: Arms! Riku: Three... lunches?')] },
    { text: 'Counting with fish', steps: [say('misa', 'happy', 'If Mei catches three fish and Hotaru steals two...'), say(null, 'happy', 'Hotaru: I would NEVER. Mei: She would.')] },
    { text: 'Draw the harbour', steps: [say('misa', 'happy', 'Draw what you can see from the pier.'), say(null, 'happy', 'Sora draws the ferry as a whale. It is somehow better.')] }] },
  call(() => { todayDone(g, 'teach'); markDone(g, 'teach'); s.taught++; g.useEnergy(15); gold(g, 150, 'volunteer pay'); g.addFriend('hibiki', 20); g.addXP('charm', 12); g.addXP('study', 6); g.advance(180); stamp(g, 'ts_teach'); g.stat('classesTaught'); g.bus.emit('classTaught', { n: s.taught }); }),
  say('hibiki', 'happy', 'The kids will talk about this for a week. Thank you, Misa.')];
  if (s.taught === 2) steps.push(call(() => { g.give('gift_tsubame_charm', 1); g.toast('Hibiki gives you a swallow charm', 'i_star'); }));
  return g.run(steps);
};

registerMany('interaction', {
  sv4_cat: { label: 'Wave at the roof cat', run: (g) => { const c = S4(g).cats; const k = g.day; if (c[k]) return g.say(null, null, 'The cat blinks slowly. That counts as a conversation.'); c[k] = 1; stamp(g, 'ts_cat'); g.addMood(4); g.stat('catsGreeted'); return g.say(null, 'happy', ['A cat on every roof. This one yawns and lets you admire its whiskers.', 'The cat stares down like a tiny lighthouse.', 'It pretends not to notice you. It is noticing you very hard.'][Math.floor(g.rng() * 3)]); } },
  sv4_squid: { label: 'Look at the drying squid', run: (g) => { stamp(g, 'ts_squid'); return g.say(null, null, 'Rows of squid hang in the sun like pale lanterns. They smell like salt, sea and promise. A handwritten sign: "Taste: 30 coins. Ume approved."'); } },
  sv4_net: { label: 'Help mend the net', run: (g) => { if (todayDone(g, 'net')) return g.say(null, null, 'The net is mended for today. Your knots hold.'); if (g.energy < 6) return g.say(null, null, 'Too tired for knots.'); markDone(g, 'net'); g.useEnergy(6); g.advance(30); g.addXP('fishing', 6); g.addXP('crafting', 4); stamp(g, 'ts_net'); gold(g, 40, 'Tetsu pays in coins and grunts'); return g.say(null, 'happy', 'Over, under, pull. A lot like knitting, only with more fish smell.'); } },
  sv4_village_sign: look('Village sign', 'TSUBAME ISLAND. Population: 112 people, 61 cats. Ferry to Hoshimori Harbour: east pier. Please do not feed the gulls. They know where you live.'),
  sv4_shop_shells: { label: 'Ume\'s Shell Crafts', run: (g) => { stamp(g, 'ts_shells'); return g.open('shop', 'sv4_shells'); } },
  sv4_shop_fishery: { label: 'Fishery counter', run: (g) => g.open('shop', 'sv4_fishery') },
  sv4_shop_resort: { label: 'Resort store', run: (g) => g.open('shop', 'sv4_resort') },
  sv4_shop_bar: { label: 'Beach bar', run: (g) => { stamp(g, 'co_bar'); return g.open('shop', 'sv4_bar'); } },
  sv4_shop_market: { label: 'Night stall', run: (g) => (between(g, 17, 23.5) ? g.open('shop', 'sv4_market') : g.say(null, null, 'The stall is shuttered. The market wakes at 17:00.')) },
  sv4_market_snack: { label: 'Food stall', run: (g) => (between(g, 17, 23.5) ? g.open('shop', 'sv4_market_food') : g.say(null, null, 'Nothing cooking yet. The market opens at 17:00.')) },
  sv4_market_fortune: { label: 'Fortune stall (50 coins)', run: (g) => { if (!between(g, 17, 23.5)) return g.say(null, null, 'Closed until the lanterns are lit.'); if (todayDone(g, 'fortune')) return g.say('luna', 'happy', 'One fortune a night. The lanterns get jealous.'); if (!g.spend(50)) return null; markDone(g, 'fortune'); g.addBuff && g.addBuff('lucky', 180); return g.say('luna', 'happy', 'Great fortune: a stranger will share their dessert. Eat it. It is a sign.'); } },
  sv4_market_game: { label: 'Lock stall (30 coins)', run: async (g) => { if (!between(g, 17, 23.5)) return g.say(null, null, 'Shuttered for the day.'); if (!g.spend(30)) return; const r = await g.minigame('sv4_chest', { salt: 9 }); if (r && !r.quit) { gold(g, 20 + Math.round(r.score * 90), 'prize'); } } },
  sv4_diner: { label: 'Order at the diner', run: (g) => (between(g, 10, 21) ? g.open('shop', 'sv4_diner') : g.say('umi', 'neutral', 'The kitchen is closed. Back at ten, with a fresh pot.')) },
  sv4_inn_bed: { label: 'Rest at the inn', run: (g) => { stamp(g, 'ts_inn'); return stayNight(g, 'tsubame_inn', 'default', 'Tsubame Inn', 60); } },
  sv4_inn_tea: { label: 'Have tea by the window', run: (g) => { if (g.weather === 'storm') { if (todayDone(g, 'storm')) return g.say(null, null, 'The storm drums on the roof. Ume tops up your cup.'); markDone(g, 'storm'); g.addMood(20); g.addEnergy(15); g.advance(90); return g.run([N('The island hums with the storm. Everyone crowds into the inn lobby: Ume knits, Tetsu tells the one about the whale, Kenta builds a fort from cushions.'), say('misa', 'happy', 'I have never felt so cozy in a typhoon.')]); } if (todayDone(g, 'tea')) return g.say(null, null, 'The teapot is empty, but the view is full.'); markDone(g, 'tea'); g.addMood(6); g.advance(20); return g.say(null, 'happy', 'Barley tea and a view of nets drying in the evening light.'); } },
  sv4_tower_bed: { label: 'Borrow the keeper\'s cot', run: (g) => stayNight(g, 'lantern_tower', 'default', 'The keeper\'s cot', 0) },
  sv4_hut_desk: { label: 'Front desk (bungalow 120 coins)', run: (g) => { const s = S4(g); if (s.bungalow === g.day) return g.say('lani', 'happy', 'Your bungalow is ready: the one at the end of the pier, with the best sunrise.'); return g.run([say('lani', 'happy', 'A night in an overwater bungalow: 120 coins, with extra energy and cheer in the morning.'), { t: 'choice', prompt: 'Book tonight?', options: [{ text: 'Book it', when: 'money>=120', steps: [call(() => { if (g.spend(120)) { s.bungalow = g.day; g.toast('Bungalow booked for tonight', 'i_star'); } })] }, { text: 'Not now', steps: [] }] }]); } },
  sv4_hut_bed: { label: 'Bungalow bed', run: hutBed },
  sv4_hammock: { label: 'Lie in the hammock', run: (g) => { if (todayDone(g, 'hammock')) return g.say(null, null, 'Still swaying from your last nap.'); markDone(g, 'hammock'); g.advance(60); g.addEnergy(20); g.addMood(8); return g.say(null, 'sleepy', 'The hammock rocks you like the sea itself. Gone.'); } },
  sv4_auction: { label: 'Fishery auction', run: async (g) => {
    if (!between(g, 6, 15)) return g.say('tetsu', 'neutral', 'Auction is over for today. Fish wait for nobody.');
    if (todayDone(g, 'auction')) return g.say('tetsu', 'happy', 'One round a day, young lady. Come back tomorrow with a sharper eye.');
    const r = await g.minigame('sv4_auction', { skill: g.skillLevel('fishing') }); if (!r || r.quit) return;
    markDone(g, 'auction'); g.advance(60); const d = r.data || {}, prof = Math.max(0, d.profit || 0), s = S4(g);
    s.auctionBest = Math.max(s.auctionBest, prof); if (d.wins > 0) stamp(g, 'ts_auction'); g.addXP('fishing', 8); g.addFriend('tetsu', 8);
    gold(g, prof, 'auction commission');
  } },
  sv4_job_fishery: { label: 'Fishery shift', run: (g) => startShift(g, 'islandfishery') },
  sv4_job_deck: { label: 'Ferry deckhand shift', run: (g) => startShift(g, 'deckhand') },
  sv4_school_teach: { label: 'Teach a class', run: teachRun },
  sv4_shrine_pray: { label: 'Pray at the shrine', run: (g) => { stamp(g, 'ts_shrine'); if (todayDone(g, 'pray')) return g.say(null, null, 'Two bows, two claps, one bow. The swallows chitter approval.'); markDone(g, 'pray'); g.addMood(8); g.addBuff && g.addBuff('lucky', 120); return g.say(null, 'happy', 'You wish for safe seas. A swallow lands on the eaves and sings once.'); } },
  sv4_gears: { label: 'Examine the gear console', run: gearsRun },
  sv4_telescope: { label: 'Look through the telescope', run: (g) => { if (!isNight(g)) return g.say(null, null, 'Only blue sky through the lens. Come back after dark.'); if (todayDone(g, 'scope')) return g.say(null, null, 'You have seen enough stars for one night. (Never enough.)'); markDone(g, 'scope'); g.addMood(8); g.addXP('study', 6); const acts = g.state.sv3_acts; return g.say(null, 'happy', acts?.letters && Object.keys(acts.letters).length ? 'The stars are crisp. On the telescope base, scratched in tiny letters: "Tide lantern, third from the east." The Tidekeeper was here.' : 'The stars are crisp. You find Tsubame, the swallow, and a lonely planet that looks like a lantern.'); } },
  sv4_logbook: { label: 'Read the weathered log', run: (g) => { stamp(g, 'li_orin'); const pages = ['The lamp of Lantern Isle was lit by two keepers. One kept the flame, one kept the tide.', 'When the Star Lantern on the mainland went dark, ours began to blink in answer. Nobody lit it.', 'Legend says a third light lives under the tower, waiting for a keeper who can listen.']; const i = (g.state.stats.seto_log || 0) % pages.length; g.state.stats.seto_log = i + 1; return g.say(null, null, pages[i]); } },
  sv4_chest: { label: 'The sunken chest', run: chestRun },
  sv4_moss: { label: 'Glowing moss', run: (g) => { if (isNight(g) || hourOf(g) < 7 || hourOf(g) >= 17) stamp(g, 'li_moss'); if (todayDone(g, 'moss')) return g.say(null, null, 'The moss pulses gently. You leave it be.'); markDone(g, 'moss'); g.give('min_glow_moss', 1); g.collect('mineral', 'min_glow_moss'); return g.say(null, 'happy', 'You pinch off a tiny tuft. The moss glows brighter for a second, as if saying thanks.'); } },
  sv4_tower_lamp: { label: 'Examine the lamp', run: async (g) => { stamp(g, 'li_tower'); if (hourOf(g) >= 17) stamp(g, 'li_view'); if (g.flag('seto_tower_done')) return g.say(null, null, g.flag('lantern_lit') ? 'The lamp and the mainland Star Lantern wink at each other across the water.' : 'The lens is spotless. From up here, the whole archipelago lies still.'); g.setFlag('seto_tower_done'); g.give('furn_lighthouse_model', 1); return g.run([N('You climb the last step. The lamp room is glass on every side, and the sea is a circle of blue.'), N('Under the lens, a tiny tin box. Inside: a model of this very tower, with a lamp that blinks.')]); } },
  sv4_garden_pods: { label: 'Pick seed pods', run: (g) => { if (todayDone(g, 'pods')) return g.say(null, null, 'You have already collected from the pods today.'); markDone(g, 'pods'); const rng = g.rngFor('seto_pods'), r = RARE[Math.floor(rng() * RARE.length)]; const id = 'seed_' + r[0]; g.give(id, 2, true); return g.say(null, 'happy', `Two ${get('item', id).name.toLowerCase()} rattle out of the pods. Fumi nods approvingly from the bench.`); } },
  sv4_sea_glass: { label: 'Search for sea glass', run: (g) => { stamp(g, 'li_glass'); if (todayDone(g, 'glass')) return g.say(null, null, 'Only pebbles now. Tomorrow\'s tide will bring more.'); markDone(g, 'glass'); g.give('mat_sea_glass', 2, true); return g.say(null, 'happy', 'Two frosty glass pieces, green and sky blue.'); } },
  sv4_volley: { label: 'Play beach volleyball', run: async (g) => { if (!between(g, 8, 19)) return g.say('lani', 'neutral', 'Court lights are off. Volleyball is daytime only!'); if (g.energy < 10) return g.say(null, null, 'Too tired to jump.'); const r = await g.minigame('sv4_volley', {}); if (!r || r.quit) return; g.useEnergy(10); g.advance(45); stamp(g, 'co_volley'); g.addXP('charm', 5); if (r.data && r.data.won) { S4(g).volleyWins++; gold(g, 120, 'winner\'s smoothie fund'); g.addFriend('lani', 10); } else g.addFriend('lani', 4); } },
  sv4_dive: { label: 'Dive in the lagoon', run: diveRun },
  sv4_snorkel_rent: { label: 'Snorkel hut', run: (g) => g.run([say(null, null, 'Snorkel hut: rent a set for the day (40 coins) or buy one (400).'), { t: 'choice', prompt: 'Snorkel set', options: [
    { text: 'Rent for today (40)', when: 'money>=40', steps: [call(() => { if (g.spend(40)) { g.setFlag('seto_snorkel_day', g.day); g.toast('Snorkel rented for today', 'i_star'); } })] },
    { text: 'Buy (400)', when: 'money>=400', steps: [call(() => { if (g.spend(400)) g.give('tool_snorkel', 1); })] }, { text: 'No thanks', steps: [] }] }]) },
  sv4_reefguide: { label: 'Reef Guide board', run: (g) => g.say('shiori', 'happy', `${reefCount(g)} of ${REEF.length} reef species photographed. Every one is in your Seto Passport app, under Coral. Dive, point, snap!`) },
  sv4_bonfire: { label: 'Sunset bonfire', run: bonfireRun },
});

// ---------------------------------------------------------------- systems
register('system', 'sv4_islands', {
  init(game) {
    game.bus.on('mapEnter', (e) => { const id = (e && (e.map || e.id)) || (game.world && game.world.map.id); const st = stampOnEnter[id]; if (st) stamp(game, st); if (id === 'coral_market' && isNight(game)) stamp(game, 'co_market'); });
    game.bus.on('fishCaught', () => { const id = game.world && game.world.map.id; if (['tsubame_pier', 'tsubame_village', 'seto_sea'].includes(id) && get('fish', 'x') !== 1) stamp(game, 'ts_fish'); });
    game.bus.on('harvested', (e) => { if (e && /crop_(moonbloom|sea_grape|lantern_pepper|star_jasmine)/.test(e.item || e.crop || '')) stamp(game, 'li_seed'); });
    game.bus.on('dayStart', () => { const s = S4(game); if (s.bungalow === game.day - 1 && game.flag('seto_hut_slept')) { game.setFlag('seto_hut_slept', false); game.addEnergy(25); game.addMood(15); game.toast('Slept over the water: refreshed!', 'i_sun'); } });
    game.bus.on('sleep', () => { const s = S4(game); if (game.world && game.world.map.id === 'coral_hut_resort' && s.bungalow === game.day) { game.setFlag('seto_hut_slept'); stamp(game, 'co_bungalow'); } });
    game.bus.on('regattaDone', () => stamp(game, 'co_regatta'));
    for (const [n, name, reward] of PASSPORT_REWARDS) void n, void name, void reward;
  },
});

// ---------------------------------------------------------------- Seto Passport phone app
const claimPassport = (game) => {
  const s = S4(game), total = stampTotal(game);
  for (const [n, name, r] of PASSPORT_REWARDS) {
    if (total >= n && !s.claimed['pp' + n]) {
      s.claimed['pp' + n] = 1; if (r.money) game.addMoney(r.money, true); for (const [id, k] of Object.entries(r.items || {})) game.give(id, k, true);
      game.flag('seto_passport_' + n); game.setFlag('seto_passport_' + n); game.toast(`${name}: passport reward!`, 'i_trophy'); game.sfx('levelup'); stick(game, 1);
    }
  }
};
const TABS = ['tsubame', 'lantern', 'coral'];
register('phoneApp', 'sv4_passport', {
  name: 'Seto Passport', icon: 'i_star', order: 66,
  when: (game) => !!game.flag('seto_visited'),
  badge: (game) => PASSPORT_REWARDS.some(([n]) => stampTotal(game) >= n && !S4(game).claimed['pp' + n]) ? 1 : 0,
  open(game, app) { app.state.tab = 0; claimPassport(game); },
  update(dt, input, game, app) {
    const { x, y } = app.area, k = input.pressed, st = app.state;
    TABS.forEach((t, i) => { if (hit(input, x + i * 96, y, 95, 18)) st.tab = i; });
    if (k.has('arrowright') || k.has('d') || k.has('c')) st.tab = (st.tab + 1) % 3;
    if (k.has('arrowleft') || k.has('a')) st.tab = (st.tab + 2) % 3;
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, key = TABS[st.tab], s = S4(game);
    TABS.forEach((t, i) => tap(g, game, x + i * 96, y, 95, 18, ISLANDS[t].name.split(' ')[0] + ' ' + stampsOf(game, t) + '/12', { focused: st.tab === i, style: st.tab === i ? 'mint' : 'paper' }));
    const T = (t, xx, yy, c = UI.ink) => drawText(g, t, xx, yy, c, 1, null);
    const list = STAMPS.filter((q) => q[1] === key);
    list.forEach((q, i) => { const col = i % 2, row = Math.floor(i / 2), xx = x + 6 + col * 142, yy = y + 24 + row * 22, got = s.stamps[q[0]]; panel(g, xx, yy, 136, 19, got ? 'mint' : 'paper', { shadow: false, accent: false }); T(got ? q[2].slice(0, 30) : '?????', xx + 5, yy + 3, got ? UI.ink : UI.dim); T(got ? 'STAMPED' : q[3].slice(0, 32), xx + 5, yy + 11, got ? UI.good : UI.dim); });
    T(`Stamps ${stampTotal(game)}/36   Bottles ${Object.keys(s.bottles.notes).length}/30   Reef ${reefCount(game)}/24`, x + 6, y + 158, UI.accent2);
    const next = PASSPORT_REWARDS.find(([n]) => !s.claimed['pp' + n]);
    T(next ? `Next seal at ${next[0]} stamps: ${next[1]}` : 'Golden seal earned: the sea knows your name!', x + 6, y + 170);
  },
});

// ---------------------------------------------------------------- festivals
const T = (spot, spr, dx = 0, dy = 0, extra = {}) => ({ spot, spr, dx, dy, ...extra });
register('festival', 'seto_regatta', {
  name: 'Seto Summer Regatta', icon: 'i_sun', date: 'summer-18', maps: ['coral_beach'], hours: ['10:00', '18:00'],
  desc: 'A boat race off Coral Atoll. Ferries run as usual: sail, ferry or swim over and take the helm!',
  decor: { coral_beach: [T('dock', 'sv4_lantern_post', -2, 0, { light: 'lantern' }), T('dock', 'sv4_lantern_post', 2, 0, { light: 'lantern' }), T('bar', 'sv4_buoy', 3, 1), T('volley', 'sv4_buoy', -3, 1)] },
  activities: [{ id: 'race', map: 'coral_beach', spot: 'dock', dy: 1, label: 'Enter the regatta', minigame: 'sv4_regatta', daily: true, opts: {}, prize: (g, r) => {
    const place = (r.data || {}).place || 4, s = S4(g); s.regattaBest = Math.max(s.regattaBest, 5 - place); stamp(g, 'co_regatta'); g.bus.emit('regattaDone', { place });
    gold(g, [600, 350, 200, 100][place - 1], `place ${place}`); if (place === 1) { g.give('gift_conch_horn', 1); stick(g, 2); g.toast('Regatta champion!', 'i_trophy'); }
  } }],
  lines: { lani: 'happy|Ready to race? The wind loves a confident sailor!' },
  closeAt: '18:00', closeMap: 'coral_beach',
  script: () => [say(npcOr('lani'), 'happy', 'And that is the regatta! Ice cream for everyone who finished. Everyone finished. Ice cream for everyone.'), { t: 'mood', n: 10 }],
});
register('festival', 'seto_lantern_float', {
  name: 'Tsubame Lantern Floating', icon: 'i_star', date: 'autumn-24', maps: ['tsubame_pier'], hours: ['17:30', '21:30'],
  desc: 'Islanders float paper lanterns on the water for the sailors who never came home, and for the ones who did.',
  decor: { tsubame_pier: [T('pier_end', 'sv4_lantern_post', -2, 0, { light: 'lantern' }), T('pier_end', 'sv4_lantern_post', 2, 0, { light: 'lantern' }), T('fishing', 'sv4_lantern_post', 0, 1, { light: 'lantern' }), T('ferry', 'sv4_lantern_post', 1, 1, { light: 'lantern' })] },
  activities: [{ id: 'float', map: 'tsubame_pier', spot: 'pier_end', dy: 0, label: 'Float a paper lantern', daily: true, run: (g) => g.run([N('Tetsu hands you a paper lantern and a brush.'), { t: 'choice', prompt: 'Write on the lantern', options: [
    { text: 'Thank you', steps: [N('You write "thank you" in your neatest hand.')] }, { text: 'Be safe', steps: [N('You write "be safe" and add a tiny swallow.')] }, { text: 'See you next year', steps: [N('You write "see you next year". The sea always listens to that one.')] }] },
    call(() => { g.addMood(15); g.addXP('charm', 6); g.stat('lanternsReleased'); g.give('gift_tsubame_charm', 1, true); })]) }],
  lines: { tetsu: 'happy|Float one for the sea. She likes company.', hibiki: 'happy|My class folded forty lanterns. Forty-one if you count the one that is a squid.' },
  closeAt: '21:00', closeMap: 'tsubame_pier',
  script: () => [N('Forty lanterns drift away from the pier, glowing, until the sea is a second sky.'), say(npcOr('tetsu'), 'happy', 'Same time next year. Be here.'), { t: 'mood', n: 15 }],
});

features('Seto Islands', [
  'Tsubame Island: a 60x40 fishing village on stilts with drying squid racks, hanging nets, a cat on nearly every roof and lantern-lit lanes',
  'Greet roof cats, look at the squid racks and mend nets for Tetsu to earn coins and fishing skill',
  'Tsubame Inn with a guest bed, window tea and a cozy storm-day gathering when a typhoon traps you on the island',
  'Fishery auction hall: a falling-price minigame against the old buyer, paid as a commission on your profit',
  'A one-room school with six named children where you can volunteer as a guest teacher on weekdays',
  'Swallow Shrine on the hill: a daily prayer for a luck buff',
  'Umi Diner serves 8 island dishes you can buy and learn the recipes for (kaisendon, dried squid, fish soup, octopus rice, salt bream, tuna don, seaweed salad, fisher nabe)',
  'Ume\'s Shell Crafts sells wind chimes, sea glass bracelets, conch horns and shell lanterns, and buys shells',
  'Lantern Isle: a ruined stone observatory with a four-gear and starlight puzzle that rewards a brass astrolabe once',
  'Telescope at the observatory: night stargazing with a tie to the Tidekeeper\'s lantern letters',
  'Tidal cave with glowing moss and a sunken treasure chest minigame you can crack only at low tide, once a week',
  'Lantern Tower: a second lighthouse with a three-floor stair, a keeper\'s cot, a view from the lamp room and a one-time model-tower reward',
  'Walled garden with a plot of soil and seed pods that give rare seeds (moonbloom, sea grape, lantern pepper, star jasmine) to plant on the island',
  'Four rare Lantern Isle crops registered with the garden system (moonbloom, sea grape, lantern pepper, star jasmine)',
  'Coral Atoll: white-sand beach with a beach bar, resort store, loungers, a hammock and the Coral Beach volleyball court',
  'Beach volleyball against Lani: first to five, with a winner\'s bonus',
  'Coral Lagoon dive: swim, photograph and collect 24 reef species into a Reef Guide with a calm oxygen rule (you simply float up for air)',
  'Night dives add glowing fish and the whale shark',
  'Reef Guide milestones pay at 8 and 16 species and give a reef aquarium at all 24',
  'Rent a snorkel set for the day or buy one at the snorkel hut',
  'Rent an overwater bungalow for the night: a sleep bonus of extra energy and cheer in the morning',
  'Coral Night Market (17:00 to 23:30): food, a fortune stall, a lock-picking prize stall and lanterns',
  'Sunset bonfire on Coral Beach with Lani and Kaito, and a chance of a shooting star and a wish after 20:30 on clear nights',
  'Seto Passport phone app: 3 islands with 12 stamps each, with bronze, silver and golden seal rewards at 12, 24 and 36 stamps',
  'A message in a bottle washes up on one of five beaches every day: 30 collectible notes with a final reward',
  'Typhoon season: ferries and boat launches stop on storm days and windy days in late summer, and the island stays cozy',
  'Two island jobs: Tsubame fishery helper and ferry deckhand, with an arrow-crate minigame',
  'Seto Summer Regatta on summer 18: a gate racing minigame against three rival boats with a champion prize',
  'Tsubame Lantern Floating on autumn 24: write a wish and float a paper lantern from the pier',
]);
