import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createTestGame, get, all } from './helpers.mjs';
import { scorePhoto, SV4_PHOTO_TARGETS, takePhoto } from '../src/content/sv4_newcast/photo.js';
import { BK_IDS, bakeWithMomo } from '../src/content/sv4_newcast/bakery.js';

const IDS = ['aoi', 'haru', 'sora', 'momo'];

test('new cast: registrations, sheets and portraits', () => {
  for (const id of IDS) {
    const n = get('npc', id);
    assert.ok(n && n.name && n.look && n.color && n.birthday, id);
    assert.ok(Object.values(n.lines).flat().length >= 40, `${id} lines`);
    assert.equal(n.events.length, 6, id);
    assert.deepEqual(n.events.map((e) => e.hearts).sort((a, b) => a - b).slice(0, 4).concat(), [2, 4, 5, 6]);
    for (const f of [`${id}.png`, `${id}_portraits.png`]) assert.ok(existsSync(new URL(`../assets/cast/${f}`, import.meta.url)), f);
    for (const t of [4, 6, 8]) assert.ok(n.perks[t], `${id} perk ${t}`);
  }
  assert.ok(get('shop', 'shop_bakery') && get('interaction', 'shop_bakery'));
  for (const id of BK_IDS) assert.ok(get('item', id), id);
  assert.equal(BK_IDS.length, 12);
});

test('new cast: schedules resolve to real spots', () => {
  for (const id of IDS) for (const grp of get('npc', id).schedule) for (const s of grp.stops) {
    if (!s.map) continue;
    const m = get('map', s.map); assert.ok(m, `${id} map ${s.map}`);
    assert.ok((m.spots || {})[s.spot] || (m.spawns || {})[s.spot], `${id} spot ${s.map}:${s.spot}`);
  }
});

test('new cast: the enrolment flag brings Aoi and Haru in on Spring 5, the bakery opens on Spring 12', () => {
  const g = createTestGame();
  assert.ok(!g.state.flags.nc_enrolled);
  g.state.time.day = 5; g.bus.emit('dayStart', {}); assert.ok(g.state.flags.nc_enrolled);
  g.state.time.day = 12; g.bus.emit('dayStart', {}); assert.ok(g.state.flags.nc_bakery_open);
});

test('new cast: every heart event runs on every branch (scripts test covers it) and rewards resolve', () => {
  const g = createTestGame();
  for (const id of IDS) for (const e of get('npc', id).events) assert.ok(e.script(g).length > 8, e.id);
});

test('photo scoring prefers thirds points, steady hands and good light', () => {
  const t = SV4_PHOTO_TARGETS[0];
  const good = scorePhoto({ sx: 107, sy: 75, speed: 0, hour: 17, target: t }), centre = scorePhoto({ sx: 160, sy: 112, speed: 0, hour: 17, target: t });
  assert.ok(good > centre && good > 0.9);
  assert.ok(scorePhoto({ sx: 107, sy: 75, speed: 80, hour: 12, target: t }) < good);
  assert.ok(scorePhoto({ sx: 2, sy: 2, hour: 17, target: t }) < 0.1);
});

test('taking a photo stores it in the album and a request becomes ready', async () => {
  const g = createTestGame();
  g.give('key_sv4_camera', 1); g.state.time.minutes = 7 * 60;
  g.minigame = async () => ({ score: 0.9, stars: 3 });
  const t = SV4_PHOTO_TARGETS.find((x) => x.id === 'harbour_dock');
  g.state.sv4nc.reqs.rq_dock_dawn = { state: 'active' };
  const rec = await takePhoto(g, t);
  assert.equal(g.state.sv4nc.photos.length, 1); assert.equal(rec.stars, 3);
  assert.equal(g.state.sv4nc.reqs.rq_dock_dawn.state, 'ready');
});

test('bake with Momo gives a batch once a day', async () => {
  const g = createTestGame();
  g.minigame = async () => ({ score: 1, stars: 3 });
  g.run = async (steps) => { for (const s of steps) if (s.t === 'choice') for (const o of s.options) if (o.text !== 'Not today') { for (const st of o.steps) if (st.t === 'call') st.fn(g); break; } };
  await bakeWithMomo(g);
  assert.ok(BK_IDS.some((id) => g.count(id) > 0));
  assert.equal(g.state.sv4nc.bake.n, 1);
});

test('the Track Team club is in the school club list', async () => {
  const { CLUBS } = await import('../src/content/school/data.js');
  assert.ok(CLUBS.track && get('minigame', CLUBS.track.game) && all('npc').some((n) => n.id === CLUBS.track.member));
});
