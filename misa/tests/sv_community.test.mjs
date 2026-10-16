// Community Hall: bundle data is valid, deposits/rooms/hall restoration work, perks fire, the scene survives play.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, inp, DT } from './helpers.mjs';
import { BUNDLES, ROOM_ORDER, BUNDLE, deposit, S } from '../src/content/sv_community/data.js';

test('every bundle slot names a real item, needs fit, and each room has bundles', () => {
  assert.ok(BUNDLES.length >= 28);
  for (const b of BUNDLES) {
    assert.ok(b.need >= 1 && b.need <= b.slots.length, b.id);
    for (const [item, n] of b.slots) assert.ok(item === 'coins' || get('item', item), `${b.id}: ${item}`);
    for (const id of Object.keys((b.reward || {}).items || {})) assert.ok(get('item', id), `${b.id} reward ${id}`);
  }
  for (const r of ROOM_ORDER) assert.ok(BUNDLES.some((b) => b.room === r), r);
});

test('depositing items completes a bundle, a room, then the hall; perks and events fire', () => {
  const g = createTestGame(), seen = [];
  for (const e of ['bundleDone', 'roomRestored', 'hallRestored']) g.bus.on(e, () => seen.push(e));
  g.give('fish_crucian', 1); g.give('fish_carp', 1); g.give('fish_bluegill', 1); g.give('fish_loach', 1);
  const b = BUNDLE.fish_river;
  assert.equal(deposit(g, b.id, 0).ok, true);
  assert.equal(deposit(g, b.id, 0).ok, false, 'a slot cannot be filled twice');
  for (let i = 1; i < 4; i++) deposit(g, b.id, i);
  assert.ok(S(g).done.fish_river && g.flag('hall_b_fish_river'));
  assert.equal(g.state.stats.bundlesDone, 1);
  g.hall.fillRoom('fish');
  assert.ok(g.flag('hall_room_fish') && g.flag('upg_bus_discount') && g.flag('hall_any_room'));
  const before = g.money; g.bus.emit('stat', { k: 'busRides', v: 1 }); assert.equal(g.money, before + 25, 'bus rebate');
  const bag = g.state.bagSize; g.hall.fillAll();
  assert.ok(g.flag('community_restored') && g.flag('upg_greenhouse') && g.flag('upg_hall_path'));
  assert.equal(g.state.bagSize, bag + 4);
  assert.deepEqual(seen.filter((e) => e === 'hallRestored').length, 1);
  assert.equal(seen.filter((e) => e === 'roomRestored').length, 6);
  assert.equal(g.hall.progress().done, BUNDLES.length);
});

test('the bundle scene accepts taps and keys without errors, and coins can fill a vault bundle', () => {
  const g = createTestGame();
  g.addMoney(2000);
  const scene = get('scene', 'ch_bundles').make(g, 'vault');
  scene.update(DT, inp({ pressed: new Set(['e']) }), g);
  assert.ok(S(g).done.vault_1, 'vault_1 takes 1500 coins');
  scene.update(DT, inp({ pressed: new Set(['arrowdown']) }), g);
  for (let i = 0; i < 40; i++) scene.update(DT, inp({ justDown: true, mx: 100, my: 40 }), g);
  assert.ok(scene.bundle, 'scene keeps a selected bundle');
});
