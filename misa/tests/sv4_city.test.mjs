import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, all, FEATURES, inp, DT } from './helpers.mjs';
import { buildMap, warpTarget } from '../src/world/map.js';
import { CITY_MAPS, S, STAMPS, stamp } from '../src/content/sv4_city/core.js';
import { nextDep, DEP, trainState, fareNow, rideScript, timetableText } from '../src/content/sv4_city/trains.js';
import { scheduleEntry } from '../src/world/npc.js';

const NPCS = ['kc_sora', 'kc_umi', 'kc_bunta', 'kc_gen', 'kc_ibuki', 'kc_chie', 'kc_ryo', 'kc_mio', 'kc_haruka', 'kc_daigo', 'kc_nao', 'kc_lena', 'kc_tsubasa', 'kc_kuma'];

test('every Kitaminato map builds and all its warps resolve and come back', () => {
  assert.ok(CITY_MAPS.length >= 17, 'station, platform and the 16 city maps');
  for (const id of CITY_MAPS) {
    const m = buildMap(id); assert.ok(m.w > 0 && get('map', id).spawns.default, id);
    for (const w of m.warps) {
      const t = warpTarget(w), dest = get('map', t.map);
      assert.ok(dest && dest.spawns[w.to.split(':')[1]], `${id} -> ${w.to}`);
      if (!w.to.startsWith('town:') && CITY_MAPS.includes(t.map)) assert.ok(buildMap(t.map).warps.some((b) => warpTarget(b).map === id), `${t.map} has no way back to ${id}`);
    }
  }
  assert.equal(buildMap('kita_arcade').w, 70); assert.equal(buildMap('kita_station_plaza').w, 60);
  assert.ok(buildMap('town').warps.some((w) => w.to === 'station:from_town') && get('map', 'town').spawns.from_station);
  assert.ok(buildMap('station').warps.some((w) => w.to === 'station_platform:from_gate'));
});

test('timetable and the train animation follow the clock', () => {
  assert.equal(DEP.hoshi[0], 360); assert.equal(DEP.hoshi.at(-1), 22 * 60 + 30); assert.equal(nextDep('hoshi', 23 * 60), null);
  const g = createTestGame();
  assert.equal(trainState(g, 6 * 60 - 20), null);
  assert.ok(trainState(g, 7 * 60 - 3).stopped && !trainState(g, 7 * 60 - 8).stopped && trainState(g, 7 * 60 + 5).x > 1);
  assert.match(timetableText(g, 'hoshi', 2), /AM/); assert.equal(fareNow(g), 180);
  g.give('key_city_train_pass', 1, true); assert.equal(fareNow(g), 120);
});

test('the train ride runs, takes 20 minutes and lands in Kitaminato', async () => {
  const g = createTestGame(); g.state.time.minutes = 9 * 60;
  const { CutsceneScene } = await import('../src/ui/cutscene.js');
  let done = false; const steps = []; g.run = (s) => { steps.push(...s); return Promise.resolve(); };
  rideScript(g, 'kita');
  assert.ok(steps.some((s) => s.t === 'scene' && s.name === 'kc_window') && steps.filter((s) => s.t === 'time').reduce((a, s) => a + s.add, 0) === 20);
  assert.ok(steps.some((s) => s.t === 'warp' && s.map === 'kita_station_plaza'));
  g.run = undefined; void CutsceneScene; void done;
  const bd = get('backdrop', 'kc_window'); const ctx = new Proxy({}, { get: (t, k) => (k === 'canvas' ? {} : () => {}), set: () => true });
  for (const season of ['spring', 'winter']) { g.state.time.day = season === 'spring' ? 1 : 85; bd.draw(ctx, g, 3); }
  stamp(g, 'ride'); assert.ok(S(g).stamps.ride);
});

test('stamps: 40 of them, unique, and recorded', () => {
  assert.equal(STAMPS.length, 40); assert.equal(new Set(STAMPS.map((s) => s.id)).size, 40);
  const g = createTestGame(); assert.ok(stamp(g, 'map_kita_arcade')); assert.equal(stamp(g, 'map_kita_arcade'), false);
});

test('residents resolve: schedules at real spots, lines, arcs', () => {
  const g = createTestGame();
  for (const id of NPCS) {
    const d = get('npc', id); assert.ok(d, id);
    const n = Object.values(d.lines).flat().length; assert.ok(n >= 10, `${id} has ${n} lines`);
    for (const m of [600, 900, 1260]) { const e = scheduleEntry(d, g, m); if (e) { const map = get('map', e.stop.map); assert.ok(map && (map.spots[e.stop.spot]), `${id} ${e.stop.map}:${e.stop.spot}`); } }
  }
  for (const id of ['kc_sora', 'kc_umi', 'kc_bunta', 'kc_gen', 'kc_ibuki', 'kc_chie']) assert.equal(get('npc', id).events.length, 3, id);
});

test('shops, outfits and the bookshop job exist and work', () => {
  const g = createTestGame();
  for (const id of ['kc_stationery', 'kc_electronics', 'kc_import', 'kc_vintage', 'kc_pet', 'kc_boutique', 'kc_kiosk']) assert.ok(get('shop', id), id);
  for (const o of ['kc_sailor', 'kc_trench', 'kc_overalls', 'kc_ballet']) assert.ok(get('outfit', o));
  g.useItem('cloth_city_sailor'); // not owned: no-op
  g.give('cloth_city_sailor', 1, true); g.useItem('cloth_city_sailor'); assert.ok(g.state.outfits.includes('kc_sailor'));
  assert.ok(get('minigame', 'kc_shift'));
});

test('city minigame bots all finish with sane scores', () => {
  const g = createTestGame();
  for (const id of ['kc_spree', 'kc_claw', 'kc_feed', 'kc_flash', 'kc_shift']) {
    const def = get('minigame', id), m = def.make(g, {});
    for (let i = 0; i < 60 * 120 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done && m.score >= 0 && m.score <= 1, id);
    if (id !== 'kc_feed' && id !== 'kc_claw') assert.ok(m.score > 0.6, `${id} bot score ${m.score}`);
  }
});

test('festivals, quest chain and hotel pieces are registered', () => {
  for (const f of ['kc_lantern_night', 'kc_summer_fireworks']) assert.ok(get('festival', f));
  assert.ok(get('quest', 'kc_city_quest').stages.length === 6 && get('phoneApp', 'kc_city'));
  assert.ok(FEATURES.filter((f) => /^Kitaminato/.test(f.cat)).length >= 60);
  assert.ok(all('interaction').filter((i) => i.id.startsWith('kc_')).length > 40);
});
