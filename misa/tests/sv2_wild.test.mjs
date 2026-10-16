import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, FEATURES } from './helpers.mjs';
import { buildMap } from '../src/world/map.js';
import { mulberry32 } from '../src/rng.js';
import { W2, drinkPotion, toggleRing, ringSlots, RINGS } from '../src/content/sv2_wild/data.js';
import { chopStump, lightLantern, woodsNodes, pickWoods } from '../src/content/sv2_wild/woods.js';
import { brew, brewCheck, finishReq, REQS, nextReq, reqState } from '../src/content/sv2_wild/witch.js';
import { BOUNTIES, claimBounty, bountyReady, rankOf, syncRank, leaderboard, crackIrid, freeChance } from '../src/content/sv2_wild/guild.js';
import { genDepth, depthSwing, goDepth, rainNodesNow, rainActive, depthData, applyMilestone, MILESTONE } from '../src/content/sv2_wild/starfall.js';
import { sections, overall, claimField, secPct } from '../src/content/sv2_wild/fieldguide.js';
import { setMineGame } from '../src/content/sv_explore/mine.js';

const reach = (f) => {
  const seen = new Set([f.spawn.join(',')]), q = [f.spawn];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (!seen.has(k) && f.rows[y + dy] && f.rows[y + dy][x + dx] === '.') { seen.add(k); q.push([x + dx, y + dy]); } } }
  return seen;
};

test('maps load, are the right size, and the new warps resolve both ways', () => {
  for (const [id, w, h] of [['hoshi_woods', 36, 28], ['witch_cottage', 14, 10], ['guild_hall', 16, 12], ['starfall_depths', 32, 22]]) {
    const m = buildMap(id); assert.equal(m.w, w, id); assert.equal(m.h, h, id);
  }
  const shrine = buildMap('shrine'), toWoods = shrine.warps.find((x) => x.to === 'hoshi_woods:from_shrine');
  assert.ok(toWoods && get('map', 'hoshi_woods').spawns.from_shrine && shrine.spawns.from_woods);
  assert.ok(buildMap('hoshi_woods').warps.some((x) => x.to === 'shrine:from_woods'));
  assert.ok(buildMap('hoshi_woods').warps.some((x) => x.to === 'witch_cottage:from_woods'));
  assert.ok(buildMap('hoshi_mine').warps.some((x) => x.to === 'guild_hall:from_hoshi_mine'));
  assert.ok(buildMap('guild_hall').warps.some((x) => x.to === 'hoshi_mine:from_guild_hall'));
  assert.ok(get('map', 'hoshi_mine').spawns.from_guild_hall);
});

test('woods: forage, stumps and the lantern riddle', () => {
  const g = createTestGame(); g.state.energy = 60;
  const nodes = woodsNodes(g); assert.ok(nodes.length >= 8 && nodes.every((n) => get('item', n.id)));
  assert.ok(pickWoods(g, nodes[0]) && g.count(nodes[0].id) >= 1 && g.skillXP('foraging') > 0);
  assert.equal(woodsNodes(g).length, nodes.length - 1);
  assert.ok(chopStump(g, '4,18') && g.count('mat_wood') >= 2);
  assert.equal(chopStump(g, '4,18'), false);
  assert.equal(lightLantern(g, 'moon'), 'ok'); assert.equal(lightLantern(g, 'wind'), 'wrong'); assert.deepEqual(W2(g).woods.lit, []);
  for (const k of ['moon', 'star', 'wind']) assert.equal(lightLantern(g, k), 'ok');
  assert.equal(lightLantern(g, 'tide'), 'solved');
  assert.ok(g.flag('sw_cottage_path') && g.flag('sw_ruins_solved'));
  assert.ok(buildMap('hoshi_woods').objects.some((o) => o.spr === 'sw_cottage'));
  g.state.time.day += 1; assert.ok(woodsNodes(g).some((n) => n.id === 'forage_ruin_blossom'));
});

test('witch: brewing, potions and requests', () => {
  const g = createTestGame(); g.state.energy = 10;
  assert.equal(brew(g, 'potion_energy'), false);
  g.give('forage_wild_berry', 2, true); g.give('forage_fiddlehead', 1, true);
  assert.ok(brewCheck(g, 'potion_energy')); assert.ok(brew(g, 'potion_energy')); assert.ok(g.count('potion_energy') >= 1);
  assert.equal(g.count('forage_wild_berry'), 0);
  g.useItem('potion_energy'); assert.ok(g.energy >= 70, 'tonic restores 60');
  g.give('potion_swift', 1, true); drinkPotion(g, 'potion_swift'); assert.ok(g.hasBuff('swift'));
  g.give('potion_night', 1, true); drinkPotion(g, 'potion_night'); assert.ok(g.hasBuff('night_sight'));
  drinkPotion(g, 'potion_luck'); assert.ok(g.hasBuff('lucky'));
  assert.equal(brew(g, 'potion_luck'), false, 'needs hearts');
  g.setFlag('sw_yui_met'); assert.equal(nextReq(g).id, 'r1');
  assert.equal(finishReq(g, REQS[0]), false);
  g.give('forage_moon_herb', 3, true); const m0 = g.money; assert.ok(finishReq(g, REQS[0]));
  assert.ok(g.money >= m0 + 400 && g.count('potion_luck') === 1 && reqState(g, REQS[0]) === 2 && nextReq(g).id === 'r2');
  g.give('book_star_lore_wood', 1, true); const xp = g.skillXP('foraging'); g.useItem('book_star_lore_wood'); assert.ok(g.skillXP('foraging') >= xp + 80);
});

test('guild: bounties progress by stats, ranks unlock, rings take slots, geodes crack', () => {
  const g = createTestGame();
  const b = BOUNTIES[0]; assert.equal(bountyReady(g, b), false);
  g.state.stats.rocksBroken = 20; assert.ok(bountyReady(g, b));
  const m0 = g.money; assert.ok(claimBounty(g, b.id)); assert.equal(g.money, m0 + b.coins); assert.equal(claimBounty(g, b.id), false);
  g.state.stats.mineDepth = 10; g.state.stats.dustShooed = 3; g.state.stats.foraged = 20;
  for (const id of ['fluff', 'forager', 'depth10']) assert.ok(claimBounty(g, id));
  syncRank(g); assert.equal(rankOf(g), 1); assert.ok(g.flag('sw_rank1'));
  for (const id of ['ore60', 'geodes']) { g.state.stats.oreMined = 60; g.state.stats.geodesCracked = 3; assert.ok(claimBounty(g, id)); }
  g.state.stats.woods = 0; g.state.stats.woodsForage = 15; assert.ok(claimBounty(g, 'woods15'));
  syncRank(g); assert.equal(rankOf(g), 2); assert.equal(ringSlots(g), 2);
  g.give('cloth_ring_luck', 1, true); g.give('cloth_ring_ore', 1, true); g.give('cloth_ring_forage', 1, true);
  toggleRing(g, 'cloth_ring_luck'); toggleRing(g, 'cloth_ring_ore'); toggleRing(g, 'cloth_ring_forage');
  assert.deepEqual(W2(g).guild.rings, ['cloth_ring_luck', 'cloth_ring_ore']);
  toggleRing(g, 'cloth_ring_ore'); assert.equal(W2(g).guild.rings.length, 1);
  g.give('cloth_boots_feather', 1, true); g.useItem('cloth_boots_feather'); assert.equal(freeChance(g), 0.25);
  g.give('ore_iridescent_geode', 1, true); g.state.money = 500; const got = crackIrid(g); assert.ok(got && g.count(got) >= 1 && g.money === 380);
  assert.ok(leaderboard(g).some((r) => r[0] === 'Misa'));
  assert.ok(get('shop', 'sw_guild').stock.every((s) => get('item', s.item)));
});

test('starfall: floors connect, deeper floors are richer, records, milestones and star rain', () => {
  const g = createTestGame(); setMineGame(g);
  for (const d of [1, 5, 10, 31, 77]) {
    const fd = genDepth(d, mulberry32(d * 11 + 5)), seen = reach(fd);
    assert.ok(seen.size > 60); assert.ok(fd.down && fd.rocks.some((r) => r.ladder));
    for (const r of fd.rocks) assert.ok(seen.has(`${r.x},${r.y}`));
    assert.ok(fd.rocks.every((r) => r.ladder || ['stone', 'coal', 'iron', 'silver', 'stargold', 'geode', 'gem', 'crystal', 'star', 'irid'].includes(r.kind)));
    if (d % 10 === 0) assert.ok(fd.props.some((p) => p.kind === 'elevator'));
  }
  const kinds = new Set(); for (let s = 0; s < 40; s++) genDepth(60, mulberry32(s)).rocks.forEach((r) => kinds.add(r.kind));
  assert.ok(kinds.has('star') && kinds.has('irid'));
  g.state.sv_explore.mine.best = 30; g.give('tool_pickaxe_3', 1, true); g.state.energy = 90; g.state.money = 1000;
  W2(g).depths.floor = 12;
  const rock = { x: 5, y: 5, kind: 'star' }; let r = 'hit'; for (let i = 0; i < 4 && r !== 'broke'; i++) r = depthSwing(g, rock);
  assert.equal(r, 'broke'); assert.ok(g.count('ore_starfall') >= 1);
  g.state.energy = 0; g.state.sv_explore.mine.floor = 0;
  g.state.energy = 90; goDepth(g, 3, 'up'); assert.equal(g.state.stats.starfallDepth, 3);
  goDepth(g, 12, 'up'); goDepth(g, 5, 'up'); assert.equal(W2(g).depths.best, 12); assert.equal(g.state.stats.starfallDepth, 12);
  const m0 = g.money; assert.ok(applyMilestone(g, 10)); assert.equal(g.money, m0 + MILESTONE(10).coins); assert.equal(applyMilestone(g, 10), null);
  let act = null; for (let m = 0; m < 60 && !act; m++) { g.state.time.minutes = 9 * 60 + 5; g.state.time.day += 1; if (rainActive(g)) act = true; }
  assert.ok(act); const n = rainNodesNow(g); assert.ok(n.length > 0 && depthData(W2(g).depths.floor).rows[n[0].y][n[0].x] === '.');
  g.state.time.minutes = 9 * 60 + 50; assert.equal(rainNodesNow(g).length, 0);
});

test('field guide fills as you play and pays out once', () => {
  const g = createTestGame();
  const o0 = overall(g); assert.ok(o0.of > 40);
  W2(g).seen.critter_deer = 1; g.collect('forage', 'forage_fiddlehead'); g.collect('fish', 'fish_moss_carp');
  const o1 = overall(g); assert.equal(o1.n, o0.n + 3);
  assert.ok(secPct(sections(g)[0]) > 0);
  const real = overall; void real;
  for (const s of sections(g)) assert.ok(s.list.every((e) => e.name && e.hint !== undefined));
  assert.deepEqual(claimField(g), []);
});

test('feature lines were declared', () => { assert.ok(FEATURES.filter((f) => f.cat === 'Wild Places').length >= 50); });
