import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, all, FEATURES } from './helpers.mjs';
import { buyAnimal } from '../src/content/sv_farm/animals.js';
import { SV } from '../src/content/sv_farm/data.js';
import { addStar } from '../src/content/sv_farm/core.js';

const sleep = (g, n = 1) => { for (let i = 0; i < n; i++) g.nextDay(); };

test('sv_farm: backyard map, warps and machines registry', () => {
  createTestGame();
  assert.ok(get('map', 'backyard'));
  assert.ok(get('map', 'yard').warps.some((w) => w.to === 'backyard:from_yard'));
  assert.ok(all('svMachine').length >= 14);
  assert.ok(FEATURES.filter((f) => f.cat === 'Farm & Animals').length >= 50);
});

test('sv_farm: animals eat hay, grow, lay eggs into the bin and get petted', () => {
  const g = createTestGame();
  g.state.money = 5000;
  assert.ok(buyAnimal(g, 'chicken'));
  const a = SV(g).animals[0];
  SV(g).hay = 12; a.born = g.day - 4; // grown up
  a.pet = g.day; sleep(g);
  assert.ok((SV(g).bin.art_egg || 0) + (SV(g).bin.art_egg_large || 0) + (SV(g).bin.art_egg_fertile || 0) >= 1);
  SV(g).hay = 0; a.fed = 0; sleep(g);
  assert.ok(a.hap < 80, 'hungry animal loses happiness');
  assert.equal(buyAnimal(g, 'goat') !== false, true);
});

test('sv_farm: machines process items over days and keep quality; shipping pays bonus', () => {
  const g = createTestGame();
  g.world = null;
  const S = SV(g);
  S.machines.push({ id: 'm1', kind: 'jar', map: 'yard', x: 3, y: 3, out: 'art_pickles_daikon', n: 1, left: 1, q: 2, ready: false });
  S.machines.push({ id: 'm2', kind: 'bee', map: 'yard', x: 5, y: 3, out: null, n: 1, left: 1, q: 0, ready: false });
  g.state.weather = 'sunny'; g.state.tomorrowWeather = 'sunny';
  sleep(g);
  assert.ok(S.machines[0].ready);
  g.give('art_jam_tomato', 2, true); addStar(g, 'art_jam_tomato', 3, 1);
  g.state.inv.art_jam_tomato = 0; delete g.state.inv.art_jam_tomato;
  g.state.economy.shipBox.art_jam_tomato = 2; S.q.art_jam_tomato = [0, 0, 1];
  const before = g.money; sleep(g);
  assert.ok(g.money - before > g.sellPrice('art_jam_tomato') * 2, 'artisan and star bonus paid');
  assert.ok(S.ship.items.art_jam_tomato === 2);
});

test('sv_farm: sprinklers water plots; unprotected crops can be eaten by crows', () => {
  const g = createTestGame();
  const S = SV(g), P = (g.state.hobbies.plots.yard ||= {});
  P['4,4'] = { till: g.day, crop: 'crop_carrot', age: 1, wat: 0, dry: 0 };
  S.machines.push({ id: 'm1', kind: 'sprinkler_1', map: 'yard', x: 4, y: 5, left: 0, ready: false });
  g.state.weather = 'sunny'; g.state.tomorrowWeather = 'sunny';
  sleep(g);
  assert.equal(P['4,4'].wat, g.day);
  S.crow = { day: g.day, keys: ['4,4'], shooed: false, active: true };
  g.minutes = 12 * 60; g.bus.emit('hour', {});
  assert.ok(!P['4,4'].crop, 'crows ate it');
});
