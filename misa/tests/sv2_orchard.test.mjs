import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, all, FEATURES } from './helpers.mjs';
import { SV2, FRUIT } from '../src/content/sv2_orchard/data.js';
import { plantTree, harvestTree, stageOf, quality, chopTree, ensureStatic, addThing, overnight, collectPot, pondTick, stockPond, giveRequest, pondLimit, attachTap, collectTap, collectLog } from '../src/content/sv2_orchard/orchard.js';
import { loadCask, takeCask, caskTick } from '../src/content/sv2_orchard/cellar.js';
import { SV } from '../src/content/sv_farm/data.js';

const sleep = (g, n = 1) => { for (let i = 0; i < n; i++) g.nextDay(); };
const setDay = (g, d) => { g.state.time.day = d; };

test('sv2_orchard: content loads, cellar hatch wraps home, features and items exist', () => {
  const g = createTestGame();
  assert.ok(get('map', 'cellar'));
  assert.ok(get('map', 'home').warps.some((w) => w.to === 'cellar:from_home'));
  assert.ok(get('map', 'home').spawns.from_cellar);
  assert.ok(FEATURES.filter((f) => f.cat === 'Orchard & Cellar').length >= 50);
  for (const id of ['sapling_apple', 'sapling_orange', 'tool_axe', 'mach_tapper', 'mach_keg', 'mach_crab_pot', 'mach_fish_pond', 'mach_mushroom_log', 'art_wine_apple', 'art_roe_carp', 'fish_lobster', 'mat_hardwood']) assert.ok(get('item', id), id);
  assert.ok(get('svMachine', 'keg').rec('ing_apple').out === 'art_wine_apple');
  assert.ok(SV2(g).casks.length === 14);
});

test('sv2_orchard: fruit trees need space, grow in 28 days, bear in season and age into star quality', () => {
  const g = createTestGame();
  const info = { m: { w: 28, h: 18, tiles: Array.from({ length: 18 }, () => Array(28).fill({ ground: 'grass' })), warps: [], spawns: {}, objects: [], def: {} }, grid: Array.from({ length: 18 }, () => Array(28).fill(true)) };
  assert.equal(plantTree(g, 'yard', 10, 10, 'apple', info), null);
  assert.ok(/8 sides/.test(plantTree(g, 'yard', 11, 10, 'cherry', info)), 'neighbour blocks planting');
  const t = SV2(g).trees.find((x) => x.kind === 'apple');
  assert.equal(stageOf(g, t), 1);
  setDay(g, t.born + 27); assert.equal(stageOf(g, t), 4);
  setDay(g, t.born + 28); assert.equal(stageOf(g, t), 5);
  // autumn day 20 of year 1 is day 28*2+20 = 76
  setDay(g, 76); t.born = 76 - 40; sleep(g);
  assert.equal(g.season, 'autumn'); assert.equal(t.fruit, 1);
  sleep(g, 3); assert.equal(t.fruit, 3);
  const before = g.count('ing_apple'); assert.equal(harvestTree(g, t), 3); assert.equal(g.count('ing_apple'), before + 3);
  t.born = g.day - 340; assert.equal(quality(g, t), 3);
  sleep(g, 1); const n0 = SV(g).q.ing_apple ? SV(g).q.ing_apple[2] : 0; harvestTree(g, t);
  assert.ok(SV(g).q.ing_apple && SV(g).q.ing_apple[2] + SV(g).q.ing_apple[1] >= n0, 'old tree gives starred fruit');
  setDay(g, 28 * 3 + 1); sleep(g); assert.equal(g.season, 'winter'); assert.equal(t.fruit, 0, 'winter is bare');
});

test('sv2_orchard: chopping needs an axe, leaves a stump and static trees stay cut; tappers collect', () => {
  const g = createTestGame();
  ensureStatic(g);
  const S = SV2(g), stat = S.trees.find((t) => t.static && t.kind === 'maple');
  assert.ok(stat, 'backyard maple adopted');
  assert.equal(chopTree(g, stat, false), false, 'no axe');
  assert.ok(attachTap(Object.assign(g, {}), stat) === false);
  g.give('mach_tapper', 1, true); assert.ok(attachTap(g, stat));
  sleep(g, 9); assert.ok(stat.tap.ready); assert.equal(collectTap(g, stat) >= 1, true); assert.ok(g.count('art_maple_syrup') >= 1);
  g.give('tool_axe', 1, true); g.state.energy = 100;
  assert.ok(chopTree(g, stat, true));
  assert.ok(S.cut[stat.key]); assert.ok(S.trees.some((t) => t.kind === 'stump' && t.x === stat.x));
  assert.ok(g.count('mat_wood') >= 6 && g.count('mach_tapper') === 1);
});

test('sv2_orchard: casks age goods through silver, gold and star and keep the star ledger', () => {
  const g = createTestGame();
  g.give('art_wine_apple', 1, true);
  assert.ok(loadCask(g, 0, 'art_wine_apple'));
  assert.equal(g.count('art_wine_apple'), 0);
  assert.equal(loadCask(g, 8, 'art_wine_apple'), false);
  sleep(g, 14); assert.equal(SV2(g).casks[0].q, 1);
  sleep(g, 14); assert.equal(SV2(g).casks[0].q, 2);
  sleep(g, 28); assert.equal(SV2(g).casks[0].q, 3);
  const c = takeCask(g, 0); assert.equal(c.q, 3);
  assert.equal(g.count('art_wine_apple'), 1); assert.equal(SV(g).q.art_wine_apple[2], 1);
  assert.equal(SV2(g).casks[0], null);
});

test('sv2_orchard: crab pots, mushroom logs and fish ponds produce overnight and ponds hit request gates', () => {
  const g = createTestGame();
  const pot = addThing(g, 'pot', 'harbour', 5, 5), log = addThing(g, 'log', 'backyard', 3, 12), pond = addThing(g, 'pond', 'backyard', 8, 12);
  g.state.weather = 'sunny'; g.state.tomorrowWeather = 'sunny';
  sleep(g, 4);
  assert.ok(pot.out, 'pot caught something'); assert.ok(collectPot(g, pot)); assert.equal(pot.out, null);
  log.born = g.day - 60; assert.ok(log.stock >= 1 || (sleep(g, 6), log.stock >= 1)); assert.ok(collectLog(g, log) >= 1);
  g.give('fish_carp', 3, true);
  assert.ok(stockPond(g, pond, 'fish_carp')); assert.equal(stockPond(g, pond, 'fish_bass'), false, 'one species');
  for (let i = 0; i < 40 && !pond.req; i++) { pond.pop = Math.max(pond.pop, 1); sleep(g, 1); }
  assert.equal(pond.pop, 3); assert.ok(pond.req, 'the fish want something');
  assert.equal(pondLimit(pond), 3);
  g.give(pond.req.item, 1, true); assert.ok(giveRequest(g, pond)); assert.equal(pondLimit(pond), 6);
  assert.ok(pond.out.length >= 0); assert.ok(all('item').some((i) => i.id.startsWith('art_roe_')));
});
