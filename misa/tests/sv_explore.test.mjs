import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, R, inp, DT } from './helpers.mjs';
import { genFloor, floorData, mineSwing, rollDrops, applyReward, faintEffects, KIND_WEIGHTS, hitsNeeded, setMineGame } from '../src/content/sv_explore/mine.js';
import { mulberry32 } from '../src/rng.js';
import { forageNodes } from '../src/content/sv_explore/forage.js';
import { panSpots, panLoot } from '../src/content/sv_explore/pan.js';
import { startUpgrade, UPGRADES, collectTools, smelt, crackGeode } from '../src/content/sv_explore/tools.js';
import { PROFS, chooseProfession, pendingProfessions } from '../src/content/sv_explore/prof.js';
import { DustGame } from '../src/minigames/sv_explore/dust.js';
import { SV } from '../src/content/sv_explore/data.js';

const reach = (f) => {
  const seen = new Set([f.spawn.join(',')]), q = [f.spawn];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (!seen.has(k) && f.rows[y + dy] && f.rows[y + dy][x + dx] === '.') { seen.add(k); q.push([x + dx, y + dy]); } } }
  return seen;
};

test('mine floors: all 30 floors generate connected, with a ladder rock and no rock on the arrival', () => {
  for (let f = 1; f <= 30; f++) for (const seed of [1, 2, 3]) {
    const fd = genFloor(f, mulberry32(f * 31 + seed)), seen = reach(fd);
    assert.ok(seen.size > 60, `floor ${f} has room to walk`);
    for (const r of fd.rocks) assert.ok(seen.has(`${r.x},${r.y}`), `floor ${f} rock reachable`);
    assert.ok(!fd.rocks.some((r) => r.x === fd.spawn[0] && r.y === fd.spawn[1]));
    if (f < 30) assert.ok(fd.down && fd.rocks.some((r) => r.ladder), `floor ${f} hides a ladder`);
    const kinds = new Set(KIND_WEIGHTS(f).filter(([, w]) => w).map(([k]) => k));
    assert.ok(fd.rocks.every((r) => kinds.has(r.kind) || r.ladder));
  }
});

test('mine: same day same floor, different day different floor; swings cost energy, ore drops, fainting is safe', () => {
  const g = createTestGame();
  setMineGame(g);
  const a = floorData(3).rows.join(''); g.state.time.day += 1; const b = floorData(3).rows.join(''); g.state.time.day -= 1;
  assert.notEqual(a, b);
  assert.equal(floorData(3).rows.join(''), a);
  g.give('tool_pickaxe', 1, true);
  SV(g).mine.floor = 12;
  const fd = floorData(12), rock = { x: 5, y: 5, kind: 'copper' };
  g.state.energy = 50;
  assert.equal(mineSwing(g, rock), 'broke');
  assert.equal(g.state.energy, 47);
  assert.ok(g.count('ore_copper') >= 1 && g.skillLevel('mining') >= 0 && g.skillXP('mining') >= 3);
  assert.equal(mineSwing(g, { x: 6, y: 5, kind: 'silver' }), 'blocked');
  assert.equal(hitsNeeded('iron', 1), 2); assert.equal(hitsNeeded('iron', 2), 1);
  const iron = { x: 7, y: 5, kind: 'iron' };
  assert.equal(mineSwing(g, iron), 'hit'); assert.equal(mineSwing(g, iron), 'broke');
  assert.ok(Object.keys(rollDrops(g, 16, 'gem')).every((id) => id.startsWith('min_')));
  g.state.money = 1000; g.state.energy = 0;
  const loss = faintEffects(g);
  assert.ok(loss >= 10 && loss <= 200 && g.money === 1000 - loss && g.energy >= 30 && SV(g).mine.floor === 0);
  assert.ok(fd.rocks.length > 10);
});

test('mine rewards pay once; depth record updates', () => {
  const g = createTestGame(); setMineGame(g);
  const before = g.money;
  assert.ok(applyReward(g, 5)); assert.equal(applyReward(g, 5), null);
  assert.ok(g.money > before && g.count('mat_bar_copper') >= 4);
});

test('forage: seasonal nodes exist on town/park/shrine, respawn by day, vanish when picked', () => {
  const g = createTestGame();
  for (const mapId of ['town', 'park', 'lane', 'shrine', 'beach']) {
    const n = forageNodes(g, mapId);
    assert.ok(n.length >= 2, `${mapId} has forage today (${g.season})`);
    for (const x of n) assert.equal(get('item', x.id).cat === 'crop' || get('item', x.id).cat === 'shell', true);
  }
  const before = forageNodes(g, 'park').map((n) => n.key).join();
  g.state.time.day += 1;
  assert.notEqual(forageNodes(g, 'park').map((n) => n.key).join(), before);
});

test('panning: spots on the shore, pan finds items', () => {
  const g = createTestGame();
  assert.ok(panSpots(g, 'beach').length >= 1);
  for (let i = 0; i < 30; i++) assert.ok(get('item', panLoot(g, 2)));
});

test('tool upgrades take two days; smelting and geodes work', () => {
  const g = createTestGame();
  while (g.has('tool_hoe')) g.take('tool_hoe'); g.give('tool_hoe', 1, true); g.give('mat_bar_iron', 2, true); g.state.money = 2000;
  const u = UPGRADES.find((x) => x.from === 'tool_hoe');
  assert.ok(startUpgrade(g, u));
  assert.ok(!g.has('tool_hoe') && !g.has('tool_hoe_2'));
  g.nextDay(); assert.equal(SV(g).tools.ready.length, 0);
  g.nextDay(); assert.deepEqual(SV(g).tools.ready, ['tool_hoe_2']);
  collectTools(g); assert.ok(g.has('tool_hoe_2'));
  g.give('ore_copper', 3, true); g.give('ore_coal', 1, true);
  assert.ok(smelt(g, 'mat_bar_copper') && g.has('mat_bar_copper'));
  g.give('min_geode', 1, true);
  assert.ok(get('item', crackGeode(g, 'min_geode')));
});

test('professions: choose at 5, price hook applies, level-10 needs matching level-5', () => {
  const g = createTestGame();
  g.state.skills.fishing = 10 * 5 * 6;
  assert.deepEqual(pendingProfessions(g).map((p) => p.skill), ['fishing']);
  const base = g.sellPrice('fish_crucian');
  assert.ok(chooseProfession(g, 'fishing', 5, 'angler'));
  assert.ok(g.sellPrice('fish_crucian') > base || base === 0);
  assert.ok(!chooseProfession(g, 'fishing', 5, 'trapper'));
  g.state.skills.fishing = 10 * 10 * 11;
  assert.ok(!chooseProfession(g, 'fishing', 10, 'mariner'));
  assert.ok(chooseProfession(g, 'fishing', 10, 'fishmonger'));
  assert.ok(Object.values(PROFS).length >= 54); // later packs register more
  const bag = g.state.bagSize; g.state.skills.homemaking = 10 * 5 * 6; chooseProfession(g, 'homemaking', 5, 'cosy');
  g.state.skills.homemaking = 10 * 10 * 11; chooseProfession(g, 'homemaking', 10, 'nest');
  assert.equal(g.state.bagSize, bag + 4);
});

test('dust minigame can be won by a bot and lost by waiting', () => {
  const m = new DustGame(mulberry32(3), {});
  for (let i = 0; i < 60 * 20 && !m.done; i++) m.update(DT, inp({ moved: true, mx: m.x, my: m.y, keys: new Set([' ']) }));
  assert.ok(m.done && m.result.shooed);
  const l = new DustGame(mulberry32(3), {});
  for (let i = 0; i < 60 * 20 && !l.done; i++) l.update(DT, inp());
  assert.ok(l.done && !l.result.shooed && l.score === 0);
  assert.ok(R.minigame.sv_dust_shoo);
});
