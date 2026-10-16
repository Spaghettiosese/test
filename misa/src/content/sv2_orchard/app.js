// Orchard phone app, the morning report, achievements, the system that wires the overnight work, and the feature list.
import { register, get, features } from '../../core/registry.js';
import { SV2, FRUIT, WILD, TREE_MAPS } from './data.js';
import { overnight, orchardSystem, ensureStatic, stageOf, ageOf, daysToFruit, quality, treeName, pondStatus, POT_MAPS } from './orchard.js';
import { caskTick, SLOTS, slotsOpen, nextTierDays } from './cellar.js';
import { nm, STAR } from '../sv_farm/core.js';
import { panel, rect, drawText, C, fit, inside, RAMPS as Rr } from '../economy/gfx.js';

const mapName = (id) => (get('map', id) || { name: id }).name;
export function counts(g) {
  const S = SV2(g), n = { ripe: 0, taps: 0, logs: 0, pots: 0, ponds: 0, casks: 0, aged: 0, wants: 0 };
  for (const t of S.trees) { if (t.fruit > 0) n.ripe++; if (t.tap && t.tap.ready) n.taps++; }
  for (const h of S.things) { if (h.kind === 'log' && h.stock) n.logs++; else if (h.kind === 'pot' && h.out) n.pots++; else if (h.kind === 'pond') { if (h.out.length) n.ponds++; if (h.req && g.has(h.req.item)) n.wants++; } }
  for (const c of S.casks) if (c) { n.casks++; if (c.q >= 1) n.aged++; }
  return n;
}
export const readyTotal = (g) => { const n = counts(g); return n.ripe + n.taps + n.logs + n.pots + n.ponds + n.aged; };
function report(g, o, aged) {
  const S = SV2(g), n = counts(g), L = [];
  const trees = S.trees.filter((t) => FRUIT[t.kind]), growing = trees.filter((t) => stageOf(g, t) < 5).length;
  if (trees.length) L.push(`Trees: ${trees.length} fruit trees, ${n.ripe} ready to shake${growing ? `, ${growing} still growing` : ''}.`);
  if (n.taps || S.trees.some((t) => t.tap)) L.push(`Tappers: ${n.taps} full bucket${n.taps === 1 ? '' : 's'}.`);
  if (n.logs || S.things.some((h) => h.kind === 'log')) L.push(`Mushroom logs: ${n.logs} with a harvest.`);
  if (S.casks.some(Boolean)) L.push(`Cellar: ${n.casks} casks full, ${n.aged} aged${aged ? `, ${aged} reached a new tier overnight` : ''}.`);
  if (S.things.some((h) => h.kind === 'pot')) L.push(`Crab pots: ${n.pots} with a catch.`);
  if (S.things.some((h) => h.kind === 'pond')) L.push(`Ponds: ${n.ponds} with roe or treasure${n.wants ? `, ${n.wants} request you can fill` : ''}.`);
  if (o.seeds) L.push(`The wind carried ${o.seeds} seed${o.seeds > 1 ? 's' : ''} into the back yard.`);
  if (o.grown) L.push('A young fruit tree has grown up!');
  S.report = L;
  const total = readyTotal(g);
  if (L.length) g.toast(total ? `Orchard report: ${[n.ripe && `${n.ripe} tree${n.ripe > 1 ? 's' : ''} ripe`, n.taps && `${n.taps} tap${n.taps > 1 ? 's' : ''}`, n.aged && `${n.aged} cask${n.aged > 1 ? 's' : ''} aged`, n.pots && `${n.pots} pot${n.pots > 1 ? 's' : ''}`, n.ponds && `${n.ponds} pond${n.ponds > 1 ? 's' : ''}`, n.logs && `${n.logs} log${n.logs > 1 ? 's' : ''}`].filter(Boolean).join(', ')}` : 'Orchard report: quiet night, all growing', 'i_leaf');
}
function goroGift(g) {
  if (g.day < 3 || g.flag('sv2_goro_axe') || !get('item', 'tool_axe')) return;
  g.setFlag('sv2_goro_axe', true); g.give('tool_axe', 1, true);
  if (g.mail) g.mail('sv2_goro_axe', 'goro', 'Misa, I found my spare axe in the shed. Take it! Old trees want clearing, and saplings sell at Sunny Mart. - Goro');
  g.toast('Goro left a spare axe in your bag', 'i_star');
}
register('system', 'sv2_orchard', {
  init(game) {
    orchardSystem(game);
    const fix = () => game.state.sv2_orchard && ensureStatic(game);
    game.bus.on('gameStart', fix); game.bus.on('gameLoaded', fix); game.bus.on('mapEnter', fix);
    game.bus.on('dayStart', () => {
      if (!game.state.sv2_orchard) return;
      const o = overnight(game), aged = caskTick(game);
      goroGift(game); report(game, o, aged);
    });
  },
});

// ---------------------------------------------------------------- achievements
const ach = (id, name, desc, cond, icon = 'i_star', extra = {}) => register('achievement', id, { name, desc, cond, icon, ...extra });
ach('sv2_first_fruit', 'First fruits', 'Shake your first fruit from a home-grown tree.', 'stat:svTreeFruit>=1');
ach('sv2_orchardist', 'Orchardist', 'Pick 100 fruits from your own trees.', 'stat:svTreeFruit>=100', 'i_trophy', { title: 'Orchardist' });
ach('sv2_lumberjack', 'Timber!', 'Fell or clear 15 trees and stumps.', 'stat:svChopped>=15');
ach('sv2_syrup', 'Sweet tap', 'Collect from your tappers 8 times.', 'stat:svTapped>=8');
ach('sv2_first_cask', 'Patience pays', 'Take your first aged good out of a cellar cask.', 'stat:svCaskDone>=1');
ach('sv2_star_cask', 'Cellar master', 'Age something to star quality in a cask.', 'stat:svCaskStar>=1', 'i_trophy', { title: 'Cellar Master' });
ach('sv2_big_cellar', 'Deep cellar', 'Upgrade the cellar to tier 3.', 'flag:sv2_cellar3');
ach('sv2_pots', 'Pot luck', 'Haul up 20 good catches from crab pots.', 'stat:svPotCatch>=20');
ach('sv2_pond', 'Pond keeper', 'Collect something from a fish pond.', 'stat:svPondHarvest>=1');
ach('sv2_pond_full', 'Happy fish', 'Fill three fish pond requests.', 'stat:svPondRequests>=3', 'i_trophy');

// ---------------------------------------------------------------- phone app
const TABS = ['TREES', 'CELLAR', 'WATER', 'PONDS', 'NEWS'];
function rowsOf(g, tab) {
  const S = SV2(g), out = [], ok = C.ink, dim = C.dim, good = C.good;
  if (tab === 0) {
    for (const t of S.trees.filter((x) => FRUIT[x.kind] || x.tap)) {
      if (FRUIT[t.kind]) {
        const d = daysToFruit(g, t), s = stageOf(g, t);
        out.push([`${treeName(t)} (${mapName(t.map)}): ${t.fruit ? `${t.fruit} ripe!` : s < 5 ? `grows up in ${d}d` : d ? `fruit in ${d}d` : 'resting'}${quality(g, t) ? `, ${STAR[quality(g, t)].toLowerCase()}` : ''}`, t.fruit ? good : ok]);
      } else out.push([`${treeName(t)} tapper: ${t.tap.ready ? 'READY ' + nm(t.tap.out) : `${nm(t.tap.out).toLowerCase()} in ${t.tap.left}d`}`, t.tap.ready ? good : ok]);
    }
    const wild = S.trees.filter((t) => WILD[t.kind]).length, stumps = S.trees.filter((t) => t.kind === 'stump').length;
    out.push([`Wild trees: ${wild}, stumps: ${stumps}. Axe: ${g.has('tool_axe_3') ? 'iron' : g.has('tool_axe_2') ? 'copper' : g.has('tool_axe') ? 'basic' : 'none'}`, dim]);
    if (!S.trees.some((t) => FRUIT[t.kind])) out.push(['No fruit trees yet. Saplings are sold at Sunny Mart.', dim]);
  } else if (tab === 1) {
    out.push([`Cellar tier ${S.cellar}: ${slotsOpen(g)} casks${S.cellar >= 3 ? ', climate control' : ''}`, dim]);
    SLOTS.forEach((s, i) => { if (s[2] > S.cellar) return; const c = S.casks[i]; out.push([c ? `${nm(c.item)}: ${c.q ? STAR[c.q].toLowerCase() : 'fresh'}${c.q < 3 ? `, next tier in ${nextTierDays(g, c)}d` : ', perfect!'}` : `Cask ${i + 1}: empty`, c && c.q ? good : c ? ok : dim]); });
  } else if (tab === 2) {
    for (const h of S.things.filter((x) => x.kind === 'pot')) out.push([`Crab pot (${mapName(h.map)}): ${h.out ? 'CATCH ' + nm(h.out) : h.bait ? 'baited' : 'empty'}`, h.out ? good : ok]);
    for (const h of S.things.filter((x) => x.kind === 'log')) out.push([`Mushroom log (${mapName(h.map)}): ${h.stock ? h.stock + ' ready' : 'growing'}`, h.stock ? good : ok]);
    if (!S.things.some((h) => h.kind === 'pot' || h.kind === 'log')) out.push(['Craft crab pots and logs at the workbench.', dim]);
  } else if (tab === 3) {
    for (const h of S.things.filter((x) => x.kind === 'pond')) {
      out.push([`Pond: ${pondStatus(h)}`, h.req ? Rr.coral[1] : ok]);
      out.push([`  ${h.out.length ? h.out.length + ' products ready' : 'nothing yet'}, ${h.made} roe made`, h.out.length ? good : dim]);
    }
    if (!S.things.some((h) => h.kind === 'pond')) out.push(['Craft a fish pond for the back yard.', dim]);
  } else {
    const n = counts(g), total = readyTotal(g);
    out.push([total ? `Collect-all reminder: ${total} thing${total > 1 ? 's' : ''} ready.` : 'Nothing is ready to collect.', total ? good : dim]);
    if (n.wants) out.push([`${n.wants} pond request${n.wants > 1 ? 's' : ''} you can fill from your bag.`, good]);
    for (const l of S.report) out.push([l, ok]);
  }
  return out;
}
register('phoneApp', 'sv2_orchard', {
  name: 'Orchard', icon: 'i_leaf', order: 45,
  badge: (game) => (game.state.sv2_orchard ? readyTotal(game) : 0) || 0,
  open(game, app) { app.state.tab ??= 0; app.state.top = 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y, w, h } = app.area, n = rowsOf(game, st.tab).length, per = Math.floor((h - 34) / 10);
    if (k.has('arrowright') || k.has('d') || k.has('c')) { st.tab = (st.tab + 1) % TABS.length; st.top = 0; }
    if (k.has('arrowleft') || k.has('a')) { st.tab = (st.tab + TABS.length - 1) % TABS.length; st.top = 0; }
    if (input.justDown) for (let i = 0; i < TABS.length; i++) if (inside(input.mx, input.my, x + 2 + i * Math.floor((w - 4) / 5), y + 2, Math.floor((w - 4) / 5) - 1, 13)) { st.tab = i; st.top = 0; }
    if (k.has('arrowdown') || k.has('s') || input.wheel > 0) st.top = Math.min(Math.max(0, n - per), st.top + 1);
    if (k.has('arrowup') || k.has('w') || input.wheel < 0) st.top = Math.max(0, st.top - 1);
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, tw = Math.floor((w - 4) / 5), R = rowsOf(game, st.tab), per = Math.floor((h - 34) / 10);
    panel(g, x, y, w, h, 'paper');
    TABS.forEach((t, i) => { rect(g, i === st.tab ? Rr.butter[3] : Rr.paper[2], x + 2 + i * tw, y + 2, tw - 1, 13); drawText(g, t, x + 2 + i * tw + 3, y + 6, C.ink, 1, null); });
    R.slice(st.top, st.top + per).forEach(([t, col], i) => drawText(g, fit(t, w - 12), x + 6, y + 22 + i * 10, col, 1, null));
    drawText(g, 'LEFT/RIGHT: TABS  UP/DOWN: SCROLL', x + 6, y + h - 10, C.dim, 1, null);
  },
});

void TREE_MAPS; void POT_MAPS; void ageOf;
features('Orchard & Cellar', [
  'Six fruit-tree saplings (cherry, plum, peach, apple, persimmon, orange) are sold at Sunny Mart',
  'Plant a sapling facing open soil in the front or back yard: all 8 neighbouring tiles must be clear of trees and machines',
  'Saplings refuse garden plots, the animal pen, doorways and hard ground, and a toast says why',
  'Fruit trees take 28 days to mature, growing through sprout, sapling, young and full-grown sprites',
  'Cherries ripen in spring, plums and peaches in summer, apples and persimmons in autumn',
  'Orange trees are evergreen: fruit in summer and autumn, and all year once the greenhouse is built',
  'A mature tree in season grows one new fruit every morning, up to three on the branch',
  'Ripe fruit shows on the branches and in a bounce bubble above the tree',
  'Shake a ripe tree to collect all its fruit at once, with leaves flying and the branches rattling',
  'Tree age sets quality: fruit is silver after a year, gold after two and star after three',
  'Seasonal tree art: spring blossom, summer leaves, autumn colour, and bare branches in winter (oranges stay green)',
  'Fruit left on a tree rots when its season ends',
  'The axe: sold at Kinoko Woodworks, craftable at the workbench, and upgraded to copper and iron at Tobias\'s counter',
  'Chop wild trees, old fruit trees and stumps for wood and hardwood; the energy cost drops with a better axe',
  'Felled trees leave a stump, and digging the stump out frees the tile for planting',
  'Clear the wild oak, maple and pine of the back yard to open up room for an orchard',
  'Seedlings and young saplings can be pulled up by hand with no axe',
  'Chopping and picking earn foraging XP, and the Forager professions can double a fruit pick',
  'Goro leaves a spare axe in the mail a few days into the game',
  'Tree tappers attach to mature oak, maple and pine trees, including the ones already in the yard',
  'Tappers run on their own: maple syrup in 9 days (double in spring), oak resin in 7, pine tar in 5',
  'A tapped tree shows its bucket, and a bubble when the syrup, resin or tar is ready',
  'Wild trees send seeds into the back yard on spring and summer nights, capped at 14 so it stays cozy',
  'New wild seedlings grow from sprout to full tree in 21 days and can be tapped or chopped',
  'Mushroom logs grow shiitake, with maitake in autumn, and rest in winter',
  'Mushroom logs improve with age: silver caps after 28 days and gold after 56',
  'A hatch in the sunroom floor leads down to the cellar, a stone room with lamps, shelves and crates',
  'The cellar holds aging casks (6 at first, 10 at tier 2, 14 at tier 3)',
  'Casks accept wine, cheese, pickles, jam, mead and roe',
  'Goods age to silver after 14 days, gold after 28 and star after 56, with the cask hoops changing colour',
  'Starred goods keep their star when put into a cask and keep ageing from there',
  'Aged casks show a bubble with the item and a quality star badge',
  'The cellar ledger summarises the casks and collects everything aged in one go',
  'Cellar upgrades with coins and hardwood add casks, and tier 3 adds climate control: casks age 25 percent faster',
  'Kegs turn any fruit (including your orchard fruit) into wine in 6 days',
  'Kegs press vegetables into juice, steep tea and coffee into cold brews, and ferment honey into mead',
  'The preserves jar also makes jam from tree fruit',
  'Kegs are sold at Kinoko Woodworks or built at the workbench from hardwood',
  'Crab pots go on water at the harbour and the beach and are checked each morning',
  'Pots catch crab, shrimp, lobster, clam and mussel, with different odds at the harbour and the beach',
  'Unbaited pots sometimes bring up junk; bait removes it and triples the lobster odds, using one bait per night',
  'Stormy nights keep the pots empty',
  'Trapper and Mariner professions give a chance of an extra shellfish from every pot',
  'Fish ponds need a clear 2x2 patch in the back yard and are sold at Bait and Tackle',
  'Stock a pond with fish you caught: one species per pond, and you can net them back out',
  'Pond fish breed each night, up to a population gate at 3, 6 and 9',
  'At each gate the fish ask for something (kelp, nori, shrimp, fish flakes, premium bait or coral) and show it in a bubble',
  'Ponds make roe for every fish species, ink from squid and octopus, and pearls from rare fish',
  'The Orchard phone app lists tree ripening times, tappers, casks, pots, logs and ponds in five tabs',
  'The Orchard app badge counts everything ready to collect, as a daily collect-all reminder',
  'A morning Orchard report toast summarises what ripened, aged or washed in overnight',
  'Ten Orchard achievements cover first fruit, tapping, chopping, casks, crab pots and ponds',
  'Bus events treeHarvested, caskCollected, potCollected and pondHarvested fire for other systems, with stats for each',
]);
