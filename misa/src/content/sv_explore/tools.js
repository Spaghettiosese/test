// Tool upgrades, smelting and geode cracking at Tobias's counter in the clock shop (plus a parcel pick-up at the yard mailbox).
// Upgrades take bars + coins, the old tool leaves your bag and the new tier comes back two mornings later (a message tells you).
// Tool chains: rod 1>2>3, net 1>2, can 1>2, hoe 1>2 (tiers hobbies already reads), pickaxe 1>2>3 and panning dish 1>2 (read by mine.js, pan.js).
import { register, get, features } from '../../core/registry.js';
import { SV } from './data.js';
import { fx } from './util.js';

export const UPGRADES = [
  { from: 'tool_rod', to: 'tool_rod_2', bars: { mat_bar_copper: 2 }, coins: 800 },
  { from: 'tool_rod_2', to: 'tool_rod_3', bars: { mat_bar_iron: 3, mat_bar_silver: 1 }, coins: 2000 },
  { from: 'tool_net', to: 'tool_net_2', bars: { mat_bar_copper: 2 }, coins: 700 },
  { from: 'tool_can', to: 'tool_can_2', bars: { mat_bar_copper: 2 }, coins: 700 },
  { from: 'tool_hoe', to: 'tool_hoe_2', bars: { mat_bar_iron: 2 }, coins: 800 },
  { from: 'tool_pickaxe', to: 'tool_pickaxe_2', bars: { mat_bar_copper: 4 }, coins: 1000 },
  { from: 'tool_pickaxe_2', to: 'tool_pickaxe_3', bars: { mat_bar_iron: 4, mat_bar_silver: 2 }, coins: 2500 },
  { from: 'tool_pan', to: 'tool_pan_2', bars: { mat_bar_iron: 2 }, coins: 600 },
];
export const SMELT = { mat_bar_copper: ['ore_copper', 3, 1], mat_bar_iron: ['ore_iron', 3, 1], mat_bar_silver: ['ore_silver', 3, 1], mat_bar_star_gold: ['ore_star_gold', 3, 2] };
export const GEODES = { min_geode: [25, [['min_quartz', 30], ['min_pyrite', 20], ['min_amethyst', 18], ['min_obsidian', 12], ['min_jade', 8], ['min_topaz', 8], ['min_ammonite', 4]]],
  ore_frozen_geode: [40, [['min_aquamarine', 20], ['min_amethyst', 15], ['min_quartz', 15], ['min_jade', 10], ['min_moonstone', 10], ['min_ruby', 6], ['min_emerald', 6], ['min_shark_tooth', 6], ['min_ammonite', 6], ['min_trilobite', 4], ['min_amber', 2]]],
  ore_star_geode: [75, [['min_moonstone', 20], ['min_ruby', 15], ['min_emerald', 15], ['min_diamond', 12], ['min_star_shard', 12], ['min_amber', 8], ['min_meteorite', 6], ['min_trilobite', 6]]] };
const barName = (id) => id.replace('mat_bar_', '').replace('_', '-');
const costText = (u) => `${Object.entries(u.bars).map(([id, n]) => `${n} ${barName(id)}`).join(' + ')}, ${u.coins}c`;
const T = (game) => SV(game).tools;
const nm = (id) => get('item', id).name;

export function canUpgrade(game, u) {
  return game.has(u.from) && game.money >= u.coins && Object.entries(u.bars).every(([id, n]) => game.has(id, n)) && !T(game).queue.some((q) => q.from === u.from);
}
export function startUpgrade(game, u) {
  if (!game.has(u.from)) return false;
  if (T(game).queue.some((q) => q.from === u.from)) { game.toast('Tobias already has that tool on his bench'); return false; }
  if (game.money < u.coins) { game.toast('Not enough coins'); return false; }
  for (const [id, n] of Object.entries(u.bars)) if (!game.has(id, n)) { game.toast(`You need ${n} ${nm(id).toLowerCase()}${n > 1 ? 's' : ''}`); return false; }
  game.take(u.from, 1); for (const [id, n] of Object.entries(u.bars)) game.take(id, n);
  game.addMoney(-u.coins, true);
  T(game).queue.push({ from: u.from, to: u.to, ready: game.day + 2 }); T(game).upgrades++;
  game.sfx('buy'); game.stat('toolUpgrades');
  return true;
}
export function collectTools(game) {
  const t = T(game), got = t.ready.splice(0, t.ready.length);
  for (const id of got) { game.give(id, 1, true); game.bus.emit('toolUpgraded', { tool: id }); }
  if (got.length) { game.sfx('chime'); game.toast(`Collected: ${got.map(nm).join(', ')}`, get('item', got[0]).icon); }
  return got;
}
export function smelt(game, bar) {
  const [ore, n, coal] = SMELT[bar];
  if (!game.has(ore, n) || !game.has('ore_coal', coal)) { game.toast(`Needs ${n} ${nm(ore).toLowerCase()} and ${coal} coal`); return false; }
  game.take(ore, n); game.take('ore_coal', coal); game.advance(30); game.give(bar, 1);
  T(game).smelted++; game.addXP('crafting', 3); game.addXP('mining', 1); game.sfx('pour'); game.stat('barsSmelted');
  return true;
}
export function crackGeode(game, id) {
  const [price, table] = GEODES[id];
  if (!game.has(id)) return null;
  if (game.money < price) { game.toast('Not enough coins'); return null; }
  game.take(id, 1); game.addMoney(-price, true);
  const pool = table.filter(([m]) => get('item', m));
  let r = game.rng() * pool.reduce((a, [, w]) => a + w, 0), pick = pool[0][0];
  for (const [m, w] of pool) if ((r -= w) < 0) { pick = m; break; }
  game.give(pick, 1); game.collect('mineral', pick); game.stat('mineralsFound'); game.stat('geodesCracked'); T(game).cracked++;
  game.addXP('mining', 3); game.sfx('star');
  game.bus.emit('mineralFound', { item: pick }); game.bus.emit('geodeCracked', { item: pick });
  return pick;
}

// ---------------------------------------------------------------- Tobias's counter menus
const say = (text, mood = 'neutral') => ({ t: 'say', who: 'tobias', mood, text });
const call = (fn) => ({ t: 'call', fn });
function upgradeMenu(game) {
  const opts = UPGRADES.filter((u) => game.has(u.from) && !T(game).queue.some((q) => q.from === u.from)).map((u) => ({ text: `${nm(u.to)}: ${costText(u)}`, steps: [call((g) => { if (startUpgrade(g, u)) return g.run([say(`Leave it with me. Come back in two days and it will be ready. Like new, only better.`, 'happy')]); })] }));
  if (!opts.length) return game.run([say(T(game).queue.length ? 'I am still working on your tool. Two days, remember.' : 'Hm. None of your tools can be improved right now. Bring me a rod, net, can, hoe, pickaxe or panning dish.')]);
  return game.run([say('Which tool shall I improve? Bars and coins up front, ready in two days.'), { t: 'choice', prompt: 'Upgrade which tool?', options: [...opts, { text: 'Never mind', steps: [] }] }]);
}
function smeltMenu(game) {
  const opts = Object.entries(SMELT).map(([bar, [ore, n, coal]]) => ({ text: `${nm(bar)}: ${n} ore + ${coal} coal`, steps: [call((g) => { if (smelt(g, bar)) return g.run([say(`Bellows, tongs and half an hour later: one ${nm(bar).toLowerCase()}. Not bad!`, 'happy')]); })] }));
  return game.run([say('My little forge is yours. Ore and coal go in, bars come out, half an hour each.'), { t: 'choice', prompt: 'Smelt which bar?', options: [...opts, { text: 'Never mind', steps: [] }] }]);
}
function geodeMenu(game) {
  const opts = Object.entries(GEODES).filter(([id]) => game.has(id)).map(([id, [price]]) => ({ text: `${nm(id)} (${price}c)`, steps: [call(async (g) => {
    const r = crackGeode(g, id); if (!r) return;
    await g.run([{ t: 'sfx', name: 'dig' }, say('*tap tap* ...and a good crack.'), { t: 'say', who: null, text: `Inside the geode: ${nm(r)}!` }]);
  })] }));
  if (game.has('daifuku_geode') && !T(game).daifuku) opts.unshift({ text: "Daifuku's geode (free)", steps: [call(async (g) => {
    g.take('daifuku_geode', 1); T(g).daifuku = true;
    for (const id of ['min_moonstone', 'min_amethyst', 'min_star_shard']) { g.give(id, 1); g.collect('mineral', id); g.bus.emit('mineralFound', { item: id }); }
    g.stat('geodesCracked'); g.sfx('star');
    await g.run([say('A dog dug this up? Then it deserves a proper opening. Let us see...', 'surprised'), { t: 'sfx', name: 'dig' }, say('Moonstone, amethyst and a real star shard. That dog has taste!', 'happy')]);
  })] });
  if (!opts.length) return game.run([say('Bring me a geode and I will crack it for a few coins. Mine ones come from Hoshi Mine, deep in the tide-pool cave.')]);
  return game.run([say('Geodes! Dull outside, treasure inside. Which one?'), { t: 'choice', prompt: 'Crack which geode?', options: [...opts, { text: 'Never mind', steps: [] }] }]);
}
function buyMenu(game) {
  const items = [['tool_pickaxe', 600], ['tool_pan', 350]];
  const opts = items.map(([id, p]) => ({ text: `${nm(id)} (${p}c)`, steps: [call((g) => { if (g.has(id)) return g.toast('You already have one'); if (g.spend(p)) { g.give(id, 1); g.sfx('buy'); } })] }));
  return game.run([say('I keep a few spares from my brother Kinoko. Pickaxe or panning dish?'), { t: 'choice', prompt: 'Buy what?', options: [...opts, { text: 'Never mind', steps: [] }] }]);
}
export function openTobias(game) {
  const t = T(game);
  const opts = [
    { text: 'Upgrade a tool', steps: [call((g) => upgradeMenu(g))] },
    ...(t.ready.length ? [{ text: `Collect tools (${t.ready.length})`, steps: [call((g) => { collectTools(g); })] }] : []),
    { text: 'Smelt ore into bars', steps: [call((g) => smeltMenu(g))] },
    { text: 'Crack a geode', steps: [call((g) => geodeMenu(g))] },
    { text: 'Buy a pickaxe or pan', steps: [call((g) => buyMenu(g))] },
    { text: 'Never mind', steps: [] },
  ];
  const intro = game.flag('sv_tobias_tools') ? [] : [say('Welcome to the back bench. Clocks by day, tools and rocks by... also day. I upgrade tools, smelt ore and crack geodes.', 'happy'), { t: 'set', flag: 'sv_tobias_tools' }];
  const pend = t.queue.length ? [say(`Your ${nm(t.queue[0].to).toLowerCase()} will be ready on day ${t.queue[0].ready}.`)] : [];
  return game.run([...intro, ...pend, { t: 'choice', prompt: "Tobias's bench", options: opts }]);
}

register('targetProvider', 'sv_tobias', {
  find(world, game) {
    if (!game.state.sv_explore) return null;
    const p = world.player;
    if (world.map.id === 'clock_shop') {
      const d = Math.hypot(9 * 16 + 8 - p.x, 5 * 16 + 4 - p.y);
      if (d < 34) return { label: 'Ask Tobias about tools, ore and geodes', dist: d - 20, x: 9 * 16 + 8, y: 4 * 16 + 8, run: (g) => openTobias(g) };
    }
    if (world.map.id === 'yard' && SV(game).tools.ready.length) {
      const d = Math.hypot(16 * 16 + 8 - p.x, 15 * 16 + 12 - p.y);
      if (d < 30) return { label: 'Pick up a parcel from Tobias', dist: d - 16, x: 16 * 16 + 8, y: 15 * 16 + 8, run: (g) => { collectTools(g); fx(g, 16 * 16 + 8, 15 * 16, 6); } };
    }
    return null;
  },
});

export function toolsSystem(game) {
  game.bus.on('dayStart', () => {
    const t = T(game), done = t.queue.filter((q) => q.ready <= game.day);
    if (!done.length) return;
    t.queue = t.queue.filter((q) => q.ready > game.day);
    for (const q of done) { t.ready.push(q.to); game.mail(`sv_tool_${q.to}_${game.day}`, 'Tobias', `Your ${nm(q.to).toLowerCase()} is ready. Collect it at the clock shop counter or from your mailbox.`); }
  });
  game.upgradeTool = (u) => startUpgrade(game, UPGRADES.find((x) => x.to === u || x.from === u) || u);
}
// Woodworks sells the basic pickaxe and panning dish (a runtime addition to the existing shop's stock list).
{
  const sh = get('shop', 'woodworks');
  if (sh && Array.isArray(sh.stock)) sh.stock.push({ item: 'tool_pickaxe', price: 600 }, { item: 'tool_pan', price: 350 });
}

features('Exploring', [
  'Tobias at the clock shop counter upgrades tools: bring bars and coins, leave the tool, and it is ready two mornings later',
  'Upgrade chains: fishing rod to fibreglass to carbon, bug net, watering can and hoe to their upgraded tiers, pickaxe to copper to star, panning dish to iron',
  'A message from Tobias arrives when a tool is ready; collect it at his counter or from the parcel by your yard mailbox',
  'Upgraded tools work better: wider fishing catch bar, three-plot watering, cheaper hoeing, 1-energy pickaxe swings, rarer panning',
  "Tobias's forge smelts three ore and some coal into a copper, iron, silver or star-gold bar in half an hour",
  'Tobias cracks geodes for a fee and gives you whatever is inside, from quartz to a real star shard',
  "Daifuku's geode can be cracked for free at Tobias's bench (moonstone, amethyst and a star shard)",
  'Cracked geode gems go to Collections and the museum donate flow',
  'Kinoko Woodworks now sells the pickaxe (600) and panning dish (350); Tobias keeps spares too',
  'Ore and bars sell at Woodworks and in the shipping box; bars are worth far more than the raw ore',
]);
