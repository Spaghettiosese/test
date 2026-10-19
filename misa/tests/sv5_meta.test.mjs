import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, R, FEATURES, get, all } from './helpers.mjs';
import { ACTS, BYSEASON } from '../src/content/sv5_meta/data.js';
import { avail, finishActivity, runActivity, stampCount, checkProgress, yearlyCheck } from '../src/content/sv5_meta/seasons.js';
import { S } from '../src/content/sv5_meta/state.js';
import { spotPos } from '../src/systems/festivals.js';
import { buildMap, passGrid } from '../src/world/map.js';
import { TIPS, tryTip, queued, resetTips, advice } from '../src/content/sv5_meta/tips.js';
import { encodeThumb, decodeThumb, downscale, applyFilter, saveSnap, deleteSnap, MAX_SNAPS } from '../src/content/sv5_meta/photo.js';
import { genWeek, rollWish, checkWish, claimChallenge, progressOf, setComfort } from '../src/content/sv5_meta/challenges.js';
import { entries, progress, whereTo, backfill } from '../src/content/sv5_meta/hoshipedia.js';
import '../src/minigames/sv5_meta/games.js';

const seasonDay = { spring: 3, summer: 31, autumn: 59, winter: 87 };

test('sv5: 56 activities, 14 per season, 28 minigames with bots, all maps and spots exist, rewards reference real items', () => {
  assert.equal(ACTS.length, 56);
  for (const s of Object.keys(seasonDay)) assert.equal(BYSEASON[s].length, 14);
  assert.equal(new Set(ACTS.map((a) => a.id)).size, 56);
  const bad = [];
  for (const a of ACTS) {
    if (!get('map', a.map)) bad.push(a.id + ': map'); else if (!spotPos(a.map, a.spot, a.d[0], a.d[1])) bad.push(a.id + ': spot');
    if (a.rw.i && !get('item', a.rw.i)) bad.push(`${a.id}: item ${a.rw.i}`);
    if (a.rw.f && !get('npc', a.rw.f[0])) bad.push(`${a.id}: npc`);
    if (a.mini && !(R.minigame[a.id] && R.minigame[a.id].bot)) bad.push(a.id + ': minigame/bot');
  }
  assert.deepEqual(bad, []);
  assert.equal(ACTS.filter((a) => a.mini).length, 28);
});

test('sv5: every activity spot is standable (a walkable tile within reach)', () => {
  const bad = [];
  for (const a of ACTS) {
    const g0 = createTestGame(), m = buildMap(a.map), q = spotPos(a.map, a.spot, a.d[0], a.d[1]), tx = Math.floor(q.x / 16), ty = Math.floor(q.y / 16);
    const g = passGrid(m, g0); let ok = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const row = g[ty + dy]; if (row && (row[tx + dx] === true || row[tx + dx] === 1)) ok = true; }
    if (!ok) bad.push(`${a.id} ${a.map}:${a.spot} +${a.d}`);
  }
  assert.deepEqual(bad, []);
});

test('sv5: minigame bots finish and score in range', () => {
  const g = createTestGame();
  for (const a of ACTS.filter((x) => x.mini)) {
    const def = R.minigame[a.id], m = def.make(g, {});
    for (let i = 0; i < 60 * 90 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done && m.score >= 0 && m.score <= 1, a.id);
    m.draw && void 0;
  }
});

test('sv5: availability by season, hours, weather and daily limit; stamps, rewards and badge', async () => {
  const g = createTestGame(); const a = ACTS.find((x) => x.id === 'sv5s_picnic'), cic = ACTS.find((x) => x.id === 'sv5s_cicada');
  g.state.time.day = seasonDay.spring; g.state.time.minutes = 10 * 60; g.state.weather = 'sunny';
  assert.ok(avail(g, a).ok); assert.ok(!avail(g, cic).ok);
  g.state.time.minutes = 3 * 60; assert.ok(!avail(g, a).ok); g.state.time.minutes = 10 * 60;
  const m0 = g.state.money; finishActivity(g, a, 3);
  assert.ok(S(g).stamps[a.id] && S(g).gold[a.id]); assert.ok(g.state.stats.sv5Acts === 1);
  assert.ok(!avail(g, a).ok && avail(g, a).why === 'Done for today');
  g.state.time.day += 1; assert.ok(avail(g, a).ok);
  const puddle = ACTS.find((x) => x.id === 'sv5s_puddle'); g.state.weather = 'sunny'; assert.ok(!avail(g, puddle).ok); g.state.weather = 'rain'; assert.ok(avail(g, puddle).ok);
  for (const x of BYSEASON.spring) finishActivity(g, x, 2);
  assert.equal(stampCount(g, 'spring'), 14); assert.ok(S(g).badges.spring); assert.ok(g.state.outfits.includes('sv5_spring'));
  assert.ok(g.state.titles.includes('Spring Wanderer')); void m0;
  g.run = async () => {}; g.minigame = async () => ({ score: 0.9, stars: 3 });
  g.state.time.day = seasonDay.summer; g.state.time.minutes = 11 * 60; g.state.weather = 'sunny';
  const r = await runActivity(g, ACTS.find((x) => x.id === 'sv5s_melon')); assert.equal(r.stars, 3);
});

test('sv5: yearly Four Seasons ceremony needs five activities in each season', () => {
  const g = createTestGame(); g.run = () => {};
  for (const se of Object.keys(seasonDay)) for (const x of BYSEASON[se].slice(0, 5)) { g.state.time.day = seasonDay[se]; finishActivity(g, x, 1); }
  g.state.time.day = 113; assert.ok(yearlyCheck(g)); assert.ok(!yearlyCheck(g));
});

test('sv5: seasonal outfits and decor are registered', () => {
  for (const id of ['sv5_spring', 'sv5_summer', 'sv5_autumn', 'sv5_winter', 'sv5_four']) assert.ok(get('outfit', id));
  const d = all('item').filter((i) => i.id.startsWith('furn_sv5_')); assert.equal(d.length, 8); assert.ok(d.every((i) => i.cat === 'decor'));
});

test('sv5: hoshipedia unlocks from bus events and backfills', () => {
  const g = createTestGame(); resetTips(); S(g).dex = { item: {}, npc: {}, map: {}, recipe: {}, wild: {} };
  const before = progress(g).got; g.give('star_sticker', 1, true);
  assert.ok(S(g).dex.item.star_sticker); g.bus.emit('meet', { npc: 'kai' }); g.bus.emit('mapEnter', { map: 'park' }); g.bus.emit('recipeLearned', { id: all('recipe')[0].id });
  assert.ok(S(g).dex.npc.kai && S(g).dex.map.park && S(g).dex.recipe[all('recipe')[0].id]);
  assert.ok(progress(g).got >= before + 4 && progress(g).pct >= 0);
  assert.ok(entries(g, 'items').length > 1000 && entries(g, 'wild').length > 50 && whereTo('star_sticker').length);
  g.state.inv.apple_test = 1; backfill(g);
});

test('sv5: tips never repeat and respect the toggle', () => {
  assert.ok(TIPS.length >= 30); const g = createTestGame(); resetTips(); S(g).tips = { shown: {}, order: [], off: 0 };
  assert.ok(tryTip(g, 'bag', {})); assert.ok(!tryTip(g, 'bag', {})); assert.ok(S(g).tips.shown.bag);
  g.settings.tips = false; assert.ok(!tryTip(g, 'quest', {})); g.settings.tips = true;
  assert.ok(tryTip(g, 'quest', {})); const q = queued(); g.bus.emit('questStart', { id: 'x' }); assert.equal(queued(), q);
  assert.ok(Array.isArray(advice(g)) && advice(g).length >= 1);
});

test('sv5: photo thumbnails round trip through the save slice, filters change pixels, album is capped', () => {
  const w = 320, h = 224, src = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; src[o] = x > 160 ? 200 : 40; src[o + 1] = y > 100 ? 180 : 90; src[o + 2] = 120; src[o + 3] = 255; }
  const small = downscale(src, w, h), enc = encodeThumb(small), dec = decodeThumb(enc);
  assert.equal(dec.length, small.length); for (let i = 0; i < small.length; i += 4) assert.equal(dec[i], (small[i] >> 4) * 17);
  const g = createTestGame(); const s = saveSnap(g, enc, { filter: 'sepia', frame: 'cozy', stickers: 2 });
  const copy = JSON.parse(JSON.stringify(g.state)); assert.equal(copy.sv5.snaps[0].data, enc); assert.equal(copy.sv5.snaps[0].id, s.id);
  assert.equal(g.state.stats.sv5Snaps, 1);
  const f = new Uint8ClampedArray(small); applyFilter(f, 'night'); assert.notDeepEqual([...f], [...small]);
  for (let i = 0; i < 25; i++) saveSnap(g, enc); assert.equal(S(g).snaps.length, MAX_SNAPS);
  assert.ok(deleteSnap(g, S(g).snaps[0].id));
});

test('sv5: weekly challenges are deterministic, claim once; daily wish stars give a reward at seven', () => {
  const g = createTestGame(); S(g).chal.week = -1; genWeek(g); const list = S(g).chal.list;
  assert.equal(list.length, 5); assert.equal(new Set(list.map((c) => c.stat)).size, 5);
  const g2 = createTestGame(); g2.state.seed = g.state.seed; S(g2).chal.week = -1; genWeek(g2); assert.deepEqual(S(g2).chal.list.map((c) => c.text), list.map((c) => c.text));
  g.state.stats[list[0].stat] = list[0].base + list[0].goal; const m = g.state.money; assert.ok(claimChallenge(g, 0)); assert.ok(!claimChallenge(g, 0)); assert.ok(g.state.money > m);
  for (let d = 0; d < 7; d++) { g.state.time.day += 1; S(g).wish.day = 0; rollWish(g); const w = S(g).wish; g.state.stats[w.goal.stat] = (g.state.stats[w.goal.stat] || 0) + w.goal.n + 1; assert.ok(checkWish(g)); }
  assert.equal(S(g).wish.rewards, 1); assert.equal(S(g).wish.stars, 0);
});

test('sv5: achievements 2.0 are 60 ach5_ entries that trigger, cozy mode stops energy loss', () => {
  const a5 = all('achievement').filter((a) => a.id.startsWith('ach5_')); assert.equal(a5.length, 60);
  const g = createTestGame(); g.state.stats.sv5Snaps = 1; g.checkAchievements(); assert.ok(g.state.achievements.ach5_snap1);
  g.state.energy = 80; setComfort(g, 'cozyMode', true); g.addEnergy(-30); assert.equal(g.state.energy, 80); assert.ok(g.useEnergy(50)); assert.equal(g.state.energy, 80);
  setComfort(g, 'cozyMode', false); g.addEnergy(-30); assert.equal(g.state.energy, 50);
});

test('sv5: features declared', () => assert.ok(FEATURES.filter((f) => f.cat === 'Seasons & Meta').length >= 75));
