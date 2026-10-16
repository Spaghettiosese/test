// The Adventurers' Guild: a hall off the Hoshi Mine entrance lobby (door in the lobby's north-east corner, wrapped onto the mine map),
// Captain Marlow at the counter, monster-free Spirit Bounties tied to mine/forage/woods stats, a rank ladder, the Guild Rewards shop,
// Hoshi Rings (slots) and boots/lanterns with passive effects, iridescent geode cracking and the depth leaderboard.
import { register, get, features } from '../../core/registry.js';
import { townMap, grid } from '../town/lib.js';
import { npc, sc, ch, open, leave, mood, time } from '../social/util.js';
import { addLuck } from '../sv_life/state.js';
import { W2, RINGS, ringSlots, wearing, toggleRing, wearBoots, clamp } from './data.js';
import './art.js';

const GS = (g) => W2(g).guild;
const stat = (k) => (g) => g.state.stats[k] || 0;
const nm = (id) => (get('item', id) || { name: id }).name;

// ---------------------------------------------------------------- Spirit Bounties
export const BOUNTIES = [
  { id: 'swings', name: 'First swings', desc: 'Break 20 rocks in Hoshi Mine.', val: stat('rocksBroken'), goal: 20, coins: 150, pts: 1 },
  { id: 'fluff', name: 'Fluff collector', desc: 'Gently shoo 3 dust sprites.', val: stat('dustShooed'), goal: 3, coins: 200, items: { mat_stardust: 2 } },
  { id: 'forager', name: "Forager's tithe", desc: 'Forage 20 wild finds anywhere.', val: stat('foraged'), goal: 20, coins: 250 },
  { id: 'depth10', name: 'Ten floors down', desc: 'Reach mine floor 10.', val: stat('mineDepth'), goal: 10, coins: 400, stickers: 1 },
  { id: 'ore60', name: 'Ore for the guild', desc: 'Mine 60 pieces of ore.', val: stat('oreMined'), goal: 60, coins: 500, items: { mat_bar_copper: 2 } },
  { id: 'geodes', name: 'Geode gazer', desc: 'Crack 3 geodes.', val: stat('geodesCracked'), goal: 3, coins: 500, items: { min_quartz: 2 } },
  { id: 'woods15', name: 'Woodland scout', desc: 'Pick 15 forage in Hoshi Woods.', val: stat('woodsForage'), goal: 15, coins: 600, items: { potion_energy: 1 } },
  { id: 'friends', name: 'Woodland friends', desc: 'Pet or feed woodland creatures 10 times.', val: (g) => (g.state.stats.critterPets || 0) + (g.state.stats.critterFed || 0), goal: 10, coins: 500, items: { mat_tanuki_leaf: 1 } },
  { id: 'minerals', name: 'Mineral cabinet', desc: 'Find 20 minerals and gems.', val: stat('mineralsFound'), goal: 20, coins: 1000, stickers: 1 },
  { id: 'depth20', name: 'Deep diver', desc: 'Reach mine floor 20.', val: stat('mineDepth'), goal: 20, coins: 900, stickers: 2 },
  { id: 'brews', name: 'Fresh brews', desc: 'Brew 5 potions with Madame Yui.', val: stat('potionsBrewed'), goal: 5, coins: 700, items: { cloth_boots_trail: 1 } },
  { id: 'dust15', name: 'Dust whisperer', desc: 'Shoo 15 dust sprites.', val: stat('dustShooed'), goal: 15, coins: 900, items: { mat_bar_iron: 2 } },
  { id: 'depth30', name: 'Bottom of the mine', desc: 'Reach mine floor 30.', val: stat('mineDepth'), goal: 30, coins: 1500, stickers: 3 },
  { id: 'fall10', name: 'Into the Starfall', desc: 'Reach depth 10 in Starfall Depths.', val: stat('starfallDepth'), goal: 10, coins: 1800, items: { ore_starfall: 2 } },
  { id: 'rain', name: 'Catch a falling star', desc: 'Gather 12 star fragments from star rain.', val: stat('starFragments'), goal: 12, coins: 2000, items: { mat_star_fragment: 2 } },
  { id: 'fall30', name: 'Starfall veteran', desc: 'Reach depth 30 in Starfall Depths.', val: stat('starfallDepth'), goal: 30, coins: 3000, stickers: 5, items: { min_prism_shard: 1 } },
];
export const RANKS = ['Rookie', 'Copper', 'Silver', 'Gold', 'Star'];
const RANK_AT = [0, 3, 6, 9, 12];
export const bountyVal = (g, b) => Math.min(b.goal, Math.floor(b.val(g)));
export const bountyReady = (g, b) => !GS(g).claimed[b.id] && b.val(g) >= b.goal;
export const claimedCount = (g) => Object.keys(GS(g).claimed).length;
export const rankOf = (g) => RANK_AT.reduce((r, n, i) => (claimedCount(g) >= n ? i : r), 0);
export function syncRank(game) {
  const r = rankOf(game), gs = GS(game);
  if (r > gs.rank) { gs.rank = r; game.toast(`Guild rank up: ${RANKS[r]}!`, 'i_trophy'); }
  for (let i = 1; i <= gs.rank; i++) game.setFlag('sw_rank' + i);
}
export function claimBounty(game, id) {
  const b = BOUNTIES.find((x) => x.id === id);
  if (!b || !bountyReady(game, b)) return false;
  GS(game).claimed[id] = game.day;
  game.addMoney(b.coins, true);
  for (const [it, n] of Object.entries(b.items || {})) { game.give(it, n, true); if (it.startsWith('min_')) { game.collect('mineral', it); game.bus.emit('mineralFound', { item: it }); } }
  if (b.stickers && game.giveStickers) game.giveStickers(b.stickers, 'a guild bounty');
  game.stat('bountiesDone'); game.sfx('star'); game.bus.emit('bountyDone', { id });
  syncRank(game);
  return true;
}
const rewardText = (b) => `${b.coins} coins${Object.entries(b.items || {}).map(([i, n]) => `, ${n} ${nm(i).toLowerCase()}`).join('')}${b.stickers ? `, ${b.stickers} Star Sticker${b.stickers > 1 ? 's' : ''}` : ''}`;
export function boardMenu(game) {
  syncRank(game);
  const open_ = BOUNTIES.filter((b) => !GS(game).claimed[b.id]).slice(0, 5);
  if (!open_.length) return game.run([{ t: 'say', who: null, text: 'Every bounty on the board is stamped DONE. Captain Marlow has promised new ones when the tide turns.' }]);
  const opts = open_.map((b) => ({
    text: `${bountyReady(game, b) ? '[CLAIM] ' : ''}${b.name} ${bountyVal(game, b)}/${b.goal}`,
    steps: [{ t: 'call', fn: (g) => { if (bountyReady(g, b)) { claimBounty(g, b.id); return g.run([{ t: 'say', who: 'marlow', mood: 'happy', text: `Bounty done: ${b.name}! Here is your reward: ${rewardText(b)}.` }]); } return g.run([{ t: 'say', who: null, text: `${b.name}: ${b.desc} (${bountyVal(g, b)}/${b.goal}). Reward: ${rewardText(b)}.` }]); } }],
  }));
  return game.run([{ t: 'say', who: null, text: `Spirit Bounties. Guild rank: ${RANKS[rankOf(game)]} (${claimedCount(game)} bounties done). No monsters, no fights, just good honest digging.` }, { t: 'choice', prompt: 'Spirit Bounties', options: [...opts, { text: 'Leave the board', steps: [] }] }]);
}

// ---------------------------------------------------------------- leaderboard
const RIVALS = [['Old Sen', 44, 6], ['Natsu', 31, 4], ['Rei', 22, 3], ['Basho', 14, 5], ['Hiro', 8, 4]];
export const totalDepth = (g) => ((g.state.sv_explore && g.state.sv_explore.mine.best) || 0) + (W2(g).depths.best || 0);
export function leaderboard(game) {
  const rows = RIVALS.map(([n, base, per]) => [n, base + Math.floor(game.day / per / 3)]);
  rows.push(['Captain Marlow', 52]); rows.push(['Misa', totalDepth(game), true]);
  return rows.sort((a, b) => b[1] - a[1]);
}
export function leaderboardText(game) {
  const rows = leaderboard(game);
  return 'DEPTH RECORDS (mine floors + Starfall depth): ' + rows.slice(0, 7).map((r, i) => `${i + 1}. ${r[0]} ${r[1]}`).join('   ');
}

// ---------------------------------------------------------------- geodes
const GEODE_TABLE = [['min_ruby', 14], ['min_emerald', 14], ['min_moonstone', 15], ['min_amethyst', 15], ['min_diamond', 20], ['min_star_shard', 18], ['min_prism_shard', 4]];
export function crackIrid(game) {
  if (!game.has('ore_iridescent_geode')) return null;
  if (game.money < 120) { game.toast('Not enough coins (120)'); return null; }
  game.take('ore_iridescent_geode', 1); game.addMoney(-120, true);
  const pool = GEODE_TABLE.filter(([id]) => get('item', id));
  let r = game.rng() * pool.reduce((a, [, w]) => a + w, 0), pick = pool[0][0];
  for (const [id, w] of pool) if ((r -= w) < 0) { pick = id; break; }
  game.give(pick, 1); game.collect('mineral', pick); game.stat('mineralsFound'); game.stat('geodesCracked'); GS(game).cracked++;
  game.addXP('mining', 6); game.sfx('star');
  game.bus.emit('mineralFound', { item: pick }); game.bus.emit('geodeCracked', { item: pick });
  return pick;
}

// ---------------------------------------------------------------- gear menu
export function gearMenu(game) {
  const gs = GS(game), rings = Object.keys(RINGS).filter((id) => game.has(id) || wearing(game, id));
  const opts = rings.map((id) => ({ text: `${wearing(game, id) ? 'Remove' : 'Wear'} ${RINGS[id][0].replace('Hoshi Ring of ', '')} ring`, steps: [{ t: 'call', fn: (g) => toggleRing(g, id) }] }));
  for (const id of ['cloth_boots_trail', 'cloth_boots_feather']) if (game.has(id) || gs.boots === id) opts.push({ text: `${gs.boots === id ? 'Remove' : 'Wear'} ${id === 'cloth_boots_trail' ? 'trail' : 'feather'} boots`, steps: [{ t: 'call', fn: (g) => wearBoots(g, id) }] });
  const slots = `Ring slots: ${gs.rings.length}/${ringSlots(game)} (Silver rank adds a slot, Star rank adds another). Boots: ${gs.boots ? nm(gs.boots) : 'none'}. Lantern: ${game.has('tool_lantern_star') ? 'Star lantern' : game.has('tool_lantern_guild') ? 'Guild lantern' : 'none'}.`;
  if (!opts.length) return game.run([{ t: 'say', who: null, text: `${slots} You do not own any rings or boots yet. The Guild Rewards shelf sells them.` }]);
  return game.run([{ t: 'say', who: null, text: slots }, { t: 'choice', prompt: 'Gear', options: [...opts, { text: 'Done', steps: [] }] }]);
}
const TALES = [
  'Once I rowed a ferry through fog so thick the gulls walked. We arrived on time. The fog did not.',
  'A dust sprite followed me home once. It sat on my pillow for a week. Best roommate I ever had.',
  'There is a floor in the mine where the walls hum a lullaby. Fall asleep there and you wake up rested enough for a month.',
  'The first prism shard was found by a boy using a spoon. He sold it for a bicycle and has regretted it ever since. The bicycle was very good, though.',
  'On the night of the big storm, the lighthouse lamp flickered in a pattern. Three long, two short. I still do not know who was sending it.',
  'A tanuki once tried to join the guild. It paid its dues in leaves. We have never had a more honest member.',
];
export function tallTale(game) {
  const gs = GS(game);
  if (gs.taleDay === game.day) return game.run([{ t: 'say', who: 'marlow', text: 'Same story twice in a day and the sea gets suspicious. Come back tomorrow, lass.' }]);
  gs.taleDay = game.day; game.addMood(5); game.advance(15); game.stat('tallTales');
  return game.run([{ t: 'say', who: 'marlow', mood: 'happy', text: TALES[game.day % TALES.length] }]);
}
export function counterMenu(game) {
  syncRank(game);
  return game.run([
    { t: 'say', who: 'marlow', mood: 'neutral', text: `Guild rank ${RANKS[rankOf(game)]}. What can the counter do for you?` },
    { t: 'choice', prompt: 'Adventurers\' Guild', options: [
      { text: 'Spirit Bounties', steps: [{ t: 'call', fn: (g) => boardMenu(g) }] },
      { text: 'Guild Rewards shop', steps: [{ t: 'shop', id: 'sw_guild' }] },
      { text: 'Rings and boots', steps: [{ t: 'call', fn: (g) => gearMenu(g) }] },
      { text: 'Crack a geode (120c)', steps: [{ t: 'call', fn: async (g) => {
        if (!g.has('ore_iridescent_geode')) return g.run([{ t: 'say', who: 'marlow', text: 'Bring me an iridescent geode from Starfall Depths and I will crack it for 120 coins. Plain geodes are Tobias\'s business.' }]);
        const r = crackIrid(g); if (r) await g.run([{ t: 'sfx', name: 'dig' }, { t: 'say', who: 'marlow', mood: 'surprised', text: `Tap, tap, CRACK. Well, look at that. A ${nm(r)}!` }]);
      } }] },
      { text: 'Ask for a story', steps: [{ t: 'call', fn: (g) => tallTale(g) }] },
      { text: 'Depth records', steps: [{ t: 'call', fn: (g) => g.run([{ t: 'say', who: 'marlow', text: leaderboardText(g) }]) }] },
      { text: 'Leave', steps: [] },
    ] },
  ]);
}
register('interaction', 'sw_counter', { label: 'Talk at the guild counter', run: (g) => counterMenu(g) });
register('interaction', 'sw_board', { label: 'Read the bounty board', run: (g) => boardMenu(g) });
register('interaction', 'sw_records', { label: 'Look at the trophy case', run: (g) => g.run([{ t: 'say', who: null, text: `Brass plaques and dusty cups. ${leaderboardText(g)}` }]) });

// ---------------------------------------------------------------- shop
register('shop', 'sw_guild', {
  name: 'Guild Rewards', owner: 'marlow', color: '#c8a838', buys: [],
  greet: { default: ['Rank has its privileges. Mostly lanterns.', 'Everything on this shelf was earned by somebody. Now it is your turn.'] }, thanks: ['Wear it well.'],
  stock: [
    { item: 'tool_lantern_guild', price: 700 },
    { item: 'cloth_boots_trail', price: 900 },
    { item: 'cloth_ring_luck', price: 1200, when: 'flag:sw_rank1' },
    { item: 'cloth_ring_forage', price: 1400, when: 'flag:sw_rank2' },
    { item: 'cloth_ring_ore', price: 1500, when: 'flag:sw_rank2' },
    { item: 'tool_lantern_star', price: 1800, when: 'flag:sw_rank3' },
    { item: 'cloth_boots_feather', price: 2400, when: 'flag:sw_rank3' },
    { item: 'mat_hardwood', price: 150, when: 'flag:sw_rank1' },
  ],
});

// ---------------------------------------------------------------- the hall
const G = grid(16, 12, '#');
G.fill(1, 2, 14, 9, '.'); G.fill(1, 6, 14, 3, 'c'); G.fill(7, 11, 2, 1, 'd');
townMap('guild_hall', {
  name: "Adventurers' Guild", outdoor: false, indoor: true, music: 'cafe', bg: '#1e1624',
  legend: { '#': 'wall_wood', '.': 'wood', 'c': 'carpet_blue', 'd': 'doorway' },
  rows: G.rows(),
  objects: [
    { spr: 'sw_board', x: 2, y: 2, w: 2, h: 1, shadow: 0, use: 'sw_board' },
    { spr: 'sw_banner', x: 5, y: 2, solid: false, dy: -4, shadow: 0 },
    { spr: 'sw_guild_counter', x: 6, y: 3, w: 3, h: 1, shadow: 0, use: 'sw_counter', light: { kind: 'lamp' } },
    { spr: 'sw_banner', x: 10, y: 2, solid: false, dy: -4, shadow: 0 },
    { spr: 'sw_trophy_case', x: 12, y: 2, w: 2, h: 1, shadow: 0, use: 'sw_records' },
    { spr: 'sw_ship_model', x: 13, y: 5, shadow: 12, interact: { label: 'Look at the model ship', run: (g) => g.say('misa', 'happy', 'A tiny ship in full sail. There is a brass plate: THE SWALLOW, LOST WITH ALL HANDS, FOUND WITH ALL HANDS. Huh?') } },
    { spr: 'town_bush_flower', x: 1, y: 8, shadow: 8, interact: { label: 'Look at the plant', run: (g) => g.say(null, null, 'A guild fern with a tiny sign: PLEASE DO NOT MINE THE FERN.') } },
    { spr: 'town_bush', x: 14, y: 8, shadow: 8 },
  ],
  warps: [{ x: 7, y: 11, w: 2, enter: 'down', to: 'hoshi_mine:from_guild_hall' }],
  spawns: { default: [7, 10, 'up'], from_hoshi_mine: [7, 10, 'up'] },
  spots: { counter: [7, 4, 'up'], counter_back: [7, 2, 'down'], board: [3, 3, 'up'], bench: [11, 8], door: [7, 10] },
  onEnter(game) {
    if (!game.state.sv2_wild) return;
    if (!game.flag('sw_guild_met')) {
      game.setFlag('sw_guild_met');
      game.run(sc('marlow', ...open('marlow'),
        '@A warm hall that smells of lamp oil and old rope. Maps cover one wall, a model ship sits by the window, and a broad man with a white beard polishes a brass compass behind the counter.',
        'Well now. A visitor who knocked with her boots, not her fists. I am Captain Marlow, retired, and this is the Adventurers\' Guild of Hoshimori Bay.',
        'Before you ask: nobody fights anything here. The mine has had sixty years of peace. Our work is digging, shooing dust sprites and picking pretty things for a good cause.',
        'happy|The board holds Spirit Bounties. Finish one, claim your reward, and your rank grows. Rank buys better gear. Fair enough?', '>Fair enough, Captain!', mood(5)));
    }
  },
});

// ---------------------------------------------------------------- the door in the mine lobby (wraps hoshi_mine's lazy getters)
{
  const mine = get('map', 'hoshi_mine');
  if (mine) {
    const wrapGetter = (key, fn) => { const d = Object.getOwnPropertyDescriptor(mine, key), base = d && d.get ? d.get : () => mine[key]; Object.defineProperty(mine, key, { enumerable: true, configurable: true, get: () => fn(base.call(mine)) }); };
    wrapGetter('warps', (w) => (w.length ? [...w, { x: 13, y: 1, to: 'guild_hall:from_hoshi_mine' }] : w));
    wrapGetter('spawns', (s) => ({ ...s, from_guild_hall: [13, 2, 'down'] }));
  }
  register('worldLayer', 'sw_guild_door', {
    below(g, world, game) {
      if (world.map.id !== 'hoshi_mine' || !game.state.sv_explore || game.state.sv_explore.mine.floor !== 0) return;
      world.drawFeet('sw_guild_door', 13 * 16 + 8, 1 * 16 + 4);
    }
  });
}

// ---------------------------------------------------------------- passive hooks (rings, boots, lanterns)
const inMines = (g) => !!g.world && g.world.map && ['hoshi_mine', 'starfall_depths'].includes(g.world.map.id);
export function freeChance(game) {
  const gs = GS(game); let p = gs.boots === 'cloth_boots_feather' ? 0.25 : gs.boots === 'cloth_boots_trail' ? 0.12 : 0;
  if (inMines(game)) p += game.has('tool_lantern_star') ? 0.2 : game.has('tool_lantern_guild') ? 0.1 : 0;
  return Math.min(0.5, p);
}
export function guildSystem(game) {
  game.svLuck = (n) => addLuck(game, n);
  game.freeChance = () => freeChance(game);
  const useEnergy = game.useEnergy.bind(game);
  game.useEnergy = (n) => { if (n > 0 && game.state.sv2_wild && game.energy >= n && Math.random() < freeChance(game)) return true; return useEnergy(n); };
  const addEnergy = game.addEnergy.bind(game);
  game.addEnergy = (n) => { if (n === -4 && game.state.sv2_wild && inMines(game) && game.has('tool_lantern_star')) { game.toast('Your star lantern flares and the dust sprite sneezes instead.'); return; } return addEnergy(n); };
  game.bus.on('dayStart', () => {
    if (!game.state.sv2_wild) return;
    syncRank(game);
    if (wearing(game, 'cloth_ring_luck')) { addLuck(game, 6); game.toast('Hoshi Ring of Luck: +6 luck today', 'i_star'); }
  });
  game.bus.on('mined', (e) => {
    if (!game.state.sv2_wild || !e || !e.item || !e.item.startsWith('ore_') || e.item === 'ore_stone' || !wearing(game, 'cloth_ring_ore') || game._ringGuard) return;
    if (Math.random() < 0.2) { game._ringGuard = true; game.give(e.item, 1); game._ringGuard = false; game.toast('Ring of Ore: an extra chunk!', get('item', e.item).icon); game.stat('ringBonus'); }
  });
  game.bus.on('foraged', (e) => {
    if (!game.state.sv2_wild || !e || !e.item || !wearing(game, 'cloth_ring_forage')) return;
    if (Math.random() < 0.3) { game.give(e.item, 1); game.toast('Ring of Moss: a double pick!', get('item', e.item).icon); game.stat('ringBonus'); }
  });
  game.bus.on('gameLoaded', () => syncRank(game));
}

// ---------------------------------------------------------------- Captain Marlow
npc('marlow', {
  name: 'Captain Marlow', role: "Retired captain, Adventurers' Guild", color: '#c8a838',
  bio: 'Captain Marlow: broad shoulders, a snow-white beard, a navy coat with brass buttons and a compass that has never once pointed north. Ran the harbour ferry for forty years before opening the guild.',
  look: { hair: '#e8e8f0', top: '#2a3a5a', bottom: '#3a3a4a', skin: '#d6a07c', eyes: '#2a2a3a', accent: '#e8c838', shoe: '#2a2018' },
  birthday: { season: 'winter', day: 17 },
  hint: 'runs the guild counter from morning to evening. Likes fish stories, good rope and anything shiny from the deep.',
  schedule: [{ stops: [{ at: '08:00', map: 'guild_hall', spot: 'counter_back' }, { at: '19:30', map: 'guild_hall', spot: 'bench' }, { at: '21:00', map: null }] }],
  gifts: {
    love: ['fish_yellowtail', 'fish_sea_bream', 'min_diamond', 'ore_starfall'],
    like: ['fish_bonito', 'mat_bar_iron', 'mat_bar_silver', 'min_topaz', 'forage_matsutake'],
    dislike: ['forage_dandelion'],
    hate: [],
    likeTags: ['fish'],
  },
  lines: {
    default: ['Steady as she goes. That is the whole secret of everything.', 'Forty years on the ferry and the sea never once thanked me. The mine thanks me constantly, in dust.', 'happy|A bounty a day keeps the barnacles away.', 'The compass points to whatever I am about to lose. Very useful.', 'Mind the ladders, lass. And the stairs. And, honestly, most floors.'],
    morning: ['Morning, Misa. The board gets restocked at dawn. By me. With a pen.', 'Coffee. Black. Strong enough to hold a spoon upright.'],
    evening: ['Evening. The lamps are lit, the maps are rolled. Go home and eat something hot.'],
    rain: ['Rain on the harbour is a lullaby. Rain in the mine is a leak. Mind the difference.', 'Good weather for a long story. Shall I tell you about the storm of year nineteen?'],
    at_guild_hall: ['Welcome back to the hall. Do wipe the dust sprite fluff off your boots. They tickle the floorboards.', 'Anything interesting in the deep today?'],
    h2: ['You keep coming back. Good. The best adventurers are the ones who come back.', 'happy|I have been told I tell the same stories. I have been told that by the same people. Repeatedly.'],
    h4: ['The stars fall every hour down there, Misa. I saw one land once and it hummed like a cello.', 'happy|You remind me of a mate I had on the ferry. She also did not listen and also was always right.'],
    h6: ['If I were thirty years younger I would race you to the bottom of Starfall. As I am not, you do it for me.'],
    firstMeet: ['Hm! A new face at the door. Come in, lass, the kettle is on and the stairs are not that steep.'],
    birthday: ['happy|Eh? A present? For an old captain? ...Well I will be. Thank you, lass.'],
    gift_love: ['surprised|By the tides, that is a beauty! You have the eye of a true skipper!', 'happy|I shall put this where the sun catches it. Thank you, Misa.'],
    gift_like: ['happy|Now that is thoughtful. The guild thanks you.', 'happy|Hah! Good stuff. Goes right on the shelf.'],
    gift_neutral: ['Much obliged. Everything finds a use eventually.'],
    gift_dislike: ['Hm. Thank you, I suppose. I will keep it out of the draft.'],
    gift_hate: ['Hm.'],
    greet: ['Ahoy.', 'Welcome, lass.', 'Ah, there you are.'],
    catchup: ['Where have you been? The sea has not been the same. Well. Welcome back.'],
    giftBack: ['Take this, a guild charm from my old ferry days. It has been to sea six hundred times.'],
    textReply: ['(Text) Ahoy. Captain Marlow here. How do I turn off the capital letters.'],
  },
  events: [
    { id: 'marlow_h2', hearts: 2, map: 'guild_hall', when: 'time>=10:00&time<18:00',
      thanks: 'The Swallow sails again, on the shelf at least. Thank you, Misa.',
      script: () => sc('marlow', ...open('marlow'),
        'Misa. A delicate task. The Swallow model has lost her mainsail again. My fingers are the size of cod. Yours are not.',
        '@He sets the little ship on the counter. A scrap of white cloth, a spool of thread and a pair of tweezers lie beside it.',
        ch('How do you rig the sail?',
          ['Stitch it carefully', '@Tiny stitches, tiny knots. The sail snaps taut.', 'happy|Fine seamanship. You have a future on any deck.', 25],
          ['Glue it', '@A dab of glue and a long held breath. It holds. Mostly.', 'Hm. Not traditional. Effective. I approve of effective.', 20],
          ['Fold it into a paper boat first', '*>music', '@You fold a paper pattern, cut the cloth to match, and the sail fits perfectly.', 'surprised|Ha! A paper pattern! In forty years I never thought of that!', 30]),
        '@The Swallow sits straight and proud, her white sail catching the lamplight.', 'Thank you, lass. She was my first command, you know. Not this model. The real one.', time(60), mood(8), leave('marlow')) },
    { id: 'marlow_h5', hearts: 5, map: 'guild_hall', when: 'time>=17:00&time<20:00',
      thanks: 'Keep the compass. It points to whatever you are about to find. Which is usually dinner.',
      script: () => sc('marlow', ...open('marlow'),
        'Come, sit. I keep this one for people who earned it.',
        '@He unrolls an old chart. Small crosses mark the bay in faded ink, and a circle in the north is labelled "Starfall".',
        'The night the Swallow went down, a star fell on the water beside us. It hissed. We thought it was the end. It was the beginning of the guild, truth be told.',
        'We were pulled out by a light under the sea. I never found out whose. I have been looking down ever since.',
        ch('What do you say?',
          ['Maybe it was a spirit', 'happy|Maybe. Maybe that is why the dust sprites are so polite.', 30],
          ['We will find out together', 'surprised|Together. Hm. I have not heard that word in a while. Yes. Together.', 35],
          ['Thank you for telling me', 'Thank you for listening, lass. That is rarer than a prism shard.', 30]),
        '@He presses the brass compass into your hand. Its needle spins, shivers, then points straight at the door.', 'It has never been wrong. Only inconvenient.', time(60), mood(14), leave('marlow')) },
  ],
  social: { free: () => 'work', busy: { work: 'The guild never closes, Misa. Come by the counter any time.' } },
});

features('Wild Places', [
  'Adventurers\' Guild hall: a new interior behind a door in the north-east corner of the Hoshi Mine entrance room, with a counter, bounty board, trophy case and model ship',
  'Captain Marlow: retired ferry captain at the guild counter, with schedule, gifts, lines for every context and two heart events (the Swallow\'s sail and the Starfall chart)',
  'Spirit Bounties: 16 monster-free goals on the board tied to mine floors, rocks broken, ore, dust sprites shooed, geodes, minerals, foraging, potions, woodland friends and Starfall depth',
  'Guild ranks Rookie, Copper, Silver, Gold and Star rise with each bounty claimed and unlock shop stock and extra ring slots',
  'Guild Rewards shop: guild and star lanterns, trail and feather boots, three Hoshi Rings and hardwood, unlocked by rank',
  'Guild lanterns: carry one in your bag and 10% (guild) or 20% (star) of mine swings cost no energy; the star lantern also stops dust sprites tickling you',
  'Boots with perks: trail boots make 12% of energy costs free and feather boots 25%; wear or remove them from the guild gear menu or your bag',
  'Hoshi Ring slots: one ring slot to start, a second at Silver rank and a third at Star rank; wear or remove rings from the bag or the guild gear menu',
  'Hoshi Ring of Luck gives +6 daily luck, Ring of Ore a 20% chance of extra ore from mined rocks, Ring of Moss a 30% chance of a double forage pick',
  'Captain Marlow tells a different tall tale at the counter once a day, good for a little mood',
  'First visit to the guild plays a short scene where Marlow explains the bounty board',
  'Claiming a bounty pays coins, items and Star Stickers and announces each rank-up',
  'Marlow loves yellowtail, sea bream, diamonds and Starfall ore, and has his birthday on Winter 17',
  'Captain Marlow cracks iridescent geodes from Starfall Depths for 120 coins: rubies, diamonds, star shards and the rare prism shard',
  'Depth records on the board and the trophy case: you against the guild\'s veteran adventurers, ranked by mine floors plus Starfall depth',
]);
void clamp;
