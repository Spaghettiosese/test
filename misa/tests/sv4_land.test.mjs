import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, inp, DT, R, FEATURES } from './helpers.mjs';
import { buildMap, passGrid, warpTarget } from '../src/world/map.js';
import { findPath } from '../src/core/path.js';
import { scheduleEntry } from '../src/world/npc.js';
import { SV4, badge, stamp, STAMPS, BADGES } from '../src/content/sv4_land/data.js';
import { soak } from '../src/content/sv4_land/play.js';

const MAPS = ['tsukimi_trailhead', 'tsukimi_forest', 'tsukimi_falls', 'tsukimi_summit', 'yukemuri_village', 'ryokan_lobby', 'ryokan_room', 'onsen_bath', 'mountain_hut', 'meadow_road', 'meadow_ranch', 'meadow_windmill', 'meadow_orchard', 'meadow_lake', 'meadow_market', 'meadow_cabin'];

test('every new map builds and every warp connects both ways to a walkable spawn', () => {
  for (const id of MAPS) {
    const m = buildMap(id); assert.ok(m.w <= 72 && m.h <= 56, id);
    for (const w of m.warps) {
      const t = warpTarget(w), dest = get('map', t.map);
      assert.ok(dest, `${id} -> ${t.map}`);
      const sp = dest.spawns[t.spawn || 'default']; assert.ok(sp, `${id} -> ${w.to}`);
      const back = buildMap(t.map).warps.some((b) => warpTarget(b).map === id); assert.ok(back, `${t.map} has no warp back to ${id}`);
      const dm = buildMap(t.map), grid = passGrid(dm, null, dm.objects);
      assert.ok(grid[sp[1]][sp[0]], `${w.to} spawn is blocked`);
    }
  }
  assert.ok(buildMap('lane').warps.some((w) => w.to === 'meadow_road:from_lane') && buildMap('town').warps.some((w) => w.to === 'tsukimi_trailhead:from_town'));
});

test('walking: every warp of every new map is reachable from its default spawn and the trail is continuous', () => {
  for (const id of MAPS) {
    const m = buildMap(id), grid = passGrid(m, null, m.objects), pass = (x, y) => grid[y] && grid[y][x], [sx, sy] = get('map', id).spawns.default;
    for (const w of m.warps) assert.ok(findPath(pass, sx, sy, w.x, w.y, 6000), `${id}: no path to warp ${w.to}`);
  }
});

test('bath etiquette, downhill, rowing and horizon bots finish', () => {
  const g = createTestGame();
  for (const id of ['yk_etiquette', 'tk_downhill', 'ml_rowing', 'tk_horizon']) {
    const def = R.minigame[id]; assert.ok(def.bot, id);
    for (const o of id === 'tk_downhill' ? [{ mode: 'ski' }, { mode: 'sled' }] : [{}]) {
      const m = def.make(g, o); let i = 0; for (; i < 60 * 90 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
      assert.ok(m.done && m.score > 0.4 && m.score <= 1, `${id} ${JSON.stringify(o)} score ${m.score}`);
    }
  }
});

test('residents: schedules resolve to real maps and spots through the day', () => {
  const g = createTestGame();
  for (const id of ['chiyo_yk', 'tetsuya_yk', 'shun_tk', 'osuzu_tk', 'daigo_ml', 'fumi_ml', 'kiyo_ml', 'ginjiro_ml', 'nagi_ml', 'mayu_yk']) {
    const d = get('npc', id); assert.ok(d, id); let seen = 0;
    for (const day of [3, 4, 6, 9, 40, 80]) for (const mins of [6 * 60, 9 * 60, 12 * 60, 15 * 60, 18 * 60]) {
      g.state.time.day = day; g.state.time.minutes = mins; const e = scheduleEntry(d, g);
      if (e) { seen++; const m = get('map', e.stop.map); assert.ok(m && ((m.spots || {})[e.stop.spot] || (m.spawns || {})[e.stop.spot]), `${id} ${e.stop.map}:${e.stop.spot}`); }
    }
    assert.ok(seen > 0, id + ' never appears');
    assert.ok(Object.values(d.lines).flat().length >= 10, id + ' needs 10+ lines');
  }
  assert.equal(['chiyo_yk', 'shun_tk', 'daigo_ml', 'ginjiro_ml', 'mayu_yk'].every((id) => get('npc', id).events.length === 3), true);
});

test('soaking collects the six stamps and the rally pays out; badges reward at 4, 8 and 12', async () => {
  const g = createTestGame(); g.state.money = 5000; g.state.energy = 20;
  const S = SV4(g);
  g.state.time.minutes = 10 * 60; S.pass = g.day; S.washed = g.day;
  g.run = async (steps) => { for (const s of steps) if (s.t === 'call') await s.fn(g); };
  await soak(g, 'public_in'); assert.ok(S.stamps.public_in && g.state.energy > 20);
  for (const id of ['public_out', 'footbath', 'cave']) { await soak(g, id); }
  S.soak.n = 0; await soak(g, 'ryokan'); await soak(g, 'hut');
  assert.equal(Object.keys(S.stamps).length, STAMPS.length); assert.ok(S.rallyPaid && g.has('gift_yk_stamp_towel'));
  for (const b of BADGES) badge(g, b[0]);
  assert.equal(Object.keys(S.badges).length, 12); assert.ok(g.has('gift_tk_golden_bell') && g.has('tool_tk_stick'));
});

test('feature count and the Region app', () => {
  const n = FEATURES.filter((f) => f.cat === 'Mountain & Meadow').length;
  assert.ok(n >= 65, `declared ${n}`);
  assert.ok(get('phoneApp', 'sv4_region') && get('festival', 'tk_koyo') && get('shop', 'sv4_ranch') && get('minigame', 'ml_rowing'));
});
