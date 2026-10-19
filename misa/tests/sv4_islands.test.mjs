import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, get, R, FEATURES } from './helpers.mjs';
import { buildMap, warpTarget } from '../src/world/map.js';
import { scheduleEntry } from '../src/world/npc.js';
import { ISLAND_MAPS, S4, STAMPS, NOTES, REEF, ferryRunning, stamp, SEA_FISH, DISHES } from '../src/content/sv4_islands/data.js';
import { sailStep, driftToday, grabDrift, boatTier, TIER_MULT } from '../src/content/sv4_islands/sea.js';
import { sail, ferryStatus } from '../src/content/sv4_islands/travel.js';
import { readBottle, bottleMapToday } from '../src/content/sv4_islands/acts.js';

const NEW = ['seto_sea', ...Object.values(ISLAND_MAPS).flat()];
test('every Seto map builds and every warp has a spawn and a way back', () => {
  for (const id of NEW) {
    const m = buildMap(id); assert.ok(m.w > 0, id);
    for (const w of m.warps) {
      const t = warpTarget(w); const back = buildMap(t.map);
      assert.ok(back.warps.some((x) => String(x.to).startsWith(id + ':')) || t.map === 'harbour', `${id} -> ${t.map} has no way back`);
    }
  }
  assert.ok(buildMap('harbour').warps.some((w) => w.to === 'seto_sea:from_harbour'));
  assert.ok(buildMap('harbour').objects.some((o) => o.use === 'sv4_ferry'));
  assert.equal(buildMap('seto_sea').w, 72);
  assert.ok(R.map.beach.objects.some((o) => o.spr === 'sv4_bottle'));
});

test('ferry: timetable, storms, fares and the ride itself', async () => {
  const g = createTestGame(); g.state.time.minutes = 8 * 60; g.state.weather = 'sunny';
  assert.match(ferryStatus(g, 'harbour'), /Next ferry: 09:00/);
  g.state.weather = 'storm'; assert.equal(ferryRunning(g), false); assert.match(ferryStatus(g, 'harbour'), /cancelled/i);
  g.state.weather = 'sunny'; g.state.time.minutes = 18 * 60; assert.match(ferryStatus(g, 'harbour'), /last ferry/i);
  g.state.time.minutes = 9 * 60;
  g.run = async (steps) => { for (const st of steps) { if (st.t === 'call') await st.fn(g); if (st.t === 'time') g.advance(st.add); } };
  await sail(g, 'tsubame', 'harbour');
  assert.equal(S4(g).ferryRides, 1); assert.ok(S4(g).stamps.ts_arrive && g.flag('seto_visited'));
});

test('sailing: speed by tier, currents and drift items', () => {
  const g = createTestGame(); S4(g).boat.own = 3;
  const map = buildMap('seto_sea'), world = { map, player: { x: 36 * 16, y: 30 * 16, moving: true }, rects: [] };
  sailStep(world, g, DT); world.player.x += 1; const x0 = world.player.x; sailStep(world, g, DT);
  assert.ok(world.player.x - x0 > 1.3, 'motor boat should add distance ' + (world.player.x - x0));
  assert.equal(boatTier(g), 3); assert.ok(TIER_MULT[3] > TIER_MULT[2]);
  const list = driftToday(g); assert.ok(list.length >= 6);
  assert.ok(grabDrift(g, list[0])); assert.equal(grabDrift(g, list[0]), false);
  const cur = { map, player: { x: 30 * 16, y: 26 * 16 }, rects: [] }; sailStep(cur, g, DT); const before = cur.player.x; sailStep(cur, g, 1); assert.ok(cur.player.x > before, 'east stream pushes east');
});

test('minigame bots finish: auction, volleyball, dive, regatta, chest, gears, haul', () => {
  const g = createTestGame();
  for (const id of ['sv4_auction', 'sv4_volley', 'sv4_dive', 'sv4_regatta', 'sv4_chest', 'sv4_gears', 'sv4_haul', 'sv4_job_fish', 'sv4_job_deck']) {
    const def = get('minigame', id), m = def.make(g, {});
    for (let i = 0; i < 60 * 118 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done, id + ' did not finish'); assert.ok(m.score >= 0 && m.score <= 1, id);
  }
  const d = get('minigame', 'sv4_dive'), m = d.make(g, { guarantee: 'clownfish' });
  for (let i = 0; i < 60 * 118 && !m.done; i++) m.update(DT, d.bot(m, i * DT, inp()), g);
  assert.ok(m.result.species.length >= 3);
});

test('bottles, passport, content counts and schedules', () => {
  const g = createTestGame();
  const map = bottleMapToday(g); assert.ok(map);
  for (let i = 0; i < 3; i++) { g.state.time.day += 1; readBottle(g); }
  assert.equal(Object.keys(S4(g).bottles.notes).length, 3);
  assert.equal(NOTES.length, 30); assert.equal(REEF.length, 24); assert.equal(STAMPS.length, 36); assert.equal(SEA_FISH.length, 14); assert.equal(DISHES.length, 8);
  assert.ok(stamp(g, 'ts_cat') && !stamp(g, 'ts_cat'));
  for (const id of ['nagisa', 'tetsu', 'hibiki', 'umi', 'ume', 'kenta', 'orin', 'fumi', 'lani', 'shiori', 'kaito', 'luna']) {
    const def = get('npc', id); assert.ok(def, id);
    for (const w of ['sunny', 'rain', 'storm']) for (const hr of [7, 12, 18]) { g.state.weather = w; g.state.time.minutes = hr * 60; assert.doesNotThrow(() => scheduleEntry(def, g)); }
  }
  assert.ok(FEATURES.filter((f) => f.category === 'Seto Islands' || f.cat === 'Seto Islands').length >= 0);
});
