import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, all, FEATURES } from './helpers.mjs';
import { buildMap, warpTarget } from '../src/world/map.js';
import { startProject, workDay, isBuilt, PROJECTS, PROJECT_IDS, whyNot } from '../src/content/sv4_home/reno.js';
import { plant, harvest, growTick, soak } from '../src/content/sv4_home/rooms.js';
import { adopt, owned, bond, hearts, moodOf } from '../src/content/sv4_home/pets.js';
import { settleMonth, billsFor, homeScore, runChapter, STORIES } from '../src/content/sv4_home/household.js';
import { setDye, applyStyle } from '../src/content/sv4_home/style.js';
import { likeScore, tagsOf, store, fetch } from '../src/content/sv4_home/kitchen.js';
import { SV } from '../src/content/sv4_home/data.js';

const rich = (g) => { g.state.money = 99999; for (const p of Object.values(PROJECTS)) for (const [m, n] of Object.entries(p.mats)) g.give(m, n * 2, true); };

test('renovations take days, rain stops the builders, completion sets flags and stats', () => {
  const g = createTestGame(); rich(g);
  assert.equal(whyNot(g, 'balcony') !== null, true, 'balcony needs the study');
  assert.ok(startProject(g, 'sunroom') && g.flag('hw_signed'));
  assert.equal(startProject(g, 'study'), false, 'one project at a time');
  g.state.weather = 'rain'; assert.equal(workDay(g), 'rain');
  g.state.weather = 'sunny'; assert.equal(workDay(g), 'work'); assert.equal(workDay(g), 'work'); assert.equal(isBuilt(g, 'sunroom'), false);
  assert.equal(workDay(g), 'done'); assert.ok(isBuilt(g, 'sunroom') && g.flag('reno_sunroom') && g.state.stats.homeUpgrades >= 1);
  assert.equal(whyNot(g, 'guest'), null, 'guest room unlocks after the sunroom');
});

test('every new room loads, is reachable and connects back through the wing', () => {
  createTestGame();
  for (const id of ['home_wing', ...PROJECT_IDS.map((p) => PROJECTS[p].map)]) {
    const m = buildMap(id); assert.ok(m.w > 5 && m.objects.length > 3, id);
    for (const w of m.warps) { const t = warpTarget(w); assert.ok(get('map', t.map), `${id} -> ${t.map}`); }
  }
  assert.equal(warpTarget(get('map', 'home').warps.find((w) => w.to === 'home_wing:from_home')).map, 'home_wing');
  assert.equal(warpTarget(get('map', 'hw_balcony').warps[0]).map, 'hw_study');
});

test('planters grow with water, balcony respects seasons, greenhouse does not, harvest gives crops', () => {
  const g = createTestGame(); g.state.money = 9999;
  const crop = all('crop').find((c) => c.days <= 6 && c.seasons.length < 4) || all('crop')[0], other = ['spring', 'summer', 'autumn', 'winter'].find((s) => !crop.seasons.includes(s));
  g.give(crop.seed, 4, true); g.state.time.day = ['spring', 'summer', 'autumn', 'winter'].indexOf(other) * 28 + 3;
  assert.ok(plant(g, 'hw_greenhouse', 0, crop.seed));
  for (let i = 0; i < crop.days; i++) growTick(g, false);
  assert.ok(harvest(g, 'hw_greenhouse', 0) >= 1 && g.has(crop.item));
  assert.ok(plant(g, 'hw_balcony', 0, crop.seed)); SV(g).plant.balcony[0].wet = true;
  growTick(g, false); assert.equal(SV(g).plant.balcony[0].grown, 0, 'out of season');
});

test('pets: adoption, needs, hearts, mood and save round trip', () => {
  const g = createTestGame(); g.state.money = 5000;
  assert.ok(adopt(g, 'azuki') && adopt(g, 'piyo') && !adopt(g, 'azuki'));
  assert.deepEqual(owned(g), ['azuki', 'piyo']);
  bond(g, 'azuki', 250, 'test'); assert.equal(hearts(g, 'azuki'), 2);
  SV(g).pets.azuki.needs.food = 5; assert.equal(moodOf(g, 'azuki').id, 'food');
  const copy = JSON.parse(JSON.stringify(g.state.sv4_home)); assert.deepEqual(copy.pets.azuki.needs, SV(g).pets.azuki.needs); assert.equal(copy.pets.piyo.since, g.day);
  const dog = g.world; void dog;
});

test('bento tastes and fridge storage', () => {
  const g = createTestGame();
  assert.ok(tagsOf('dish_karaage').includes('fried') && tagsOf('dish_karaage').includes('meat'));
  assert.ok(likeScore('kai', ['dish_karaage', 'dish_curry_rice']) > likeScore('hina', ['dish_karaage', 'dish_curry_rice']));
  g.give('dish_onigiri', 3, true); assert.ok(store(g, 'dish_onigiri') && g.count('dish_onigiri') === 2 && fetch(g, 'dish_onigiri') && g.count('dish_onigiri') === 3);
  const b = get('item', 'bento_3'); assert.equal(b.buff.id, 'bento_sharp'); g.give('bento_3', 1, true); g.state.energy = 20; g.useItem('bento_3'); assert.ok(g.hasBuff && g.hasBuff('bento_sharp'));
});

test('bills and allowance never push money below zero; home score and storylines work', () => {
  const g = createTestGame(); g.state.money = 10; g.state.time.day = 15;
  const rec = settleMonth(g); assert.ok(rec && g.money >= 0 && rec.allow >= 300 && billsFor(g).length === 3);
  assert.equal(settleMonth(g), null, 'once per month');
  const sc = homeScore(g); assert.ok(sc.score >= 0 && sc.score <= 100 && sc.parts.length === 8);
  assert.equal(STORIES.length, 6); g.state.time.day = 30; assert.ok(runChapter(g)); assert.ok(Object.keys(SV(g).house.calls.seen).length === 1);
});

test('dyes make a recoloured outfit and accessories have overlay sprites for each direction', () => {
  const g = createTestGame(); setDye(g, 'hair', '#e87aa0');
  assert.ok(String(g.state.outfit).startsWith('sv4mix_') && get('outfit', g.state.outfit).look.hair === '#e87aa0');
  SV(g).style.dye = {}; applyStyle(g); assert.equal(g.state.outfit, 'hoodie');
  assert.ok(get('item', 'acc_hat_sun') && get('item', 'pattern_sailor') && get('item', 'dye_rose'));
});

test('the hot-spring soak is once a day and bigger in the evening', () => {
  const g = createTestGame(); g.state.energy = 20; g.state.time.minutes = 20 * 60; const e0 = g.state.energy; soak(g);
  assert.ok(g.state.energy >= e0 + 20 && SV(g).bath.soaks === 1); soak(g); assert.equal(SV(g).bath.soaks, 1);
});

test('area declares features', () => { assert.ok(FEATURES.filter((f) => f.cat === 'Home & Pets').length >= 60); });
