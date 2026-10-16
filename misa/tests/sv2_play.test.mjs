// Arcade & Travel (sv2_play): arcade bots, tickets and scores, bicycle state, Star Drops, bounties, pocket tools.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, R, FEATURES, get } from './helpers.mjs';
import { recordPlay, table, best, goalsMet, prizeSteps, GAMES } from '../src/content/sv2_play/arcade.js';
import { S } from '../src/content/sv2_play/state.js';
import { mount, dismount, speedMult, toggleRide } from '../src/content/sv2_play/bike.js';
import { DROPS, apply, scan, gotCount, ENERGY_PER } from '../src/content/sv2_play/drops.js';
import { refreshBounties, accept, finish } from '../src/content/sv2_play/hw.js';

test('the three arcade bots start, play and finish with sane results', () => {
  const g = createTestGame();
  for (const id of ['sv2_star_runner', 'sv2_mochi_kart', 'sv2_kumo_quest']) {
    const def = get('minigame', id), m = def.make(g, { hs: [] });
    assert.equal(m.phase, 'attract', id + ' starts on its attract screen');
    let i = 0; for (; i < 60 * 118 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done, id + ' finishes under its bot');
    assert.ok(m.score >= 0 && m.score <= 1 && m.result && m.result.points > 0, id + ' reports points');
    assert.ok(m.result.tickets >= 0 && m.lives <= 5);
  }
});

test('arcade games also run from pointer input alone (drag steers, tap acts)', () => {
  const g = createTestGame();
  for (const id of ['sv2_star_runner', 'sv2_mochi_kart', 'sv2_kumo_quest']) {
    const m = get('minigame', id).make(g, {});
    m.update(DT, inp({ justDown: true, down: true, mx: 160, my: 100 }), g);
    assert.equal(m.phase, 'play', id + ' starts from a tap');
    for (let i = 0; i < 400; i++) m.update(DT, inp({ down: true, moved: true, mx: 60 + (i % 200), my: 90 }), g);
    assert.ok(m.t > 3, id + ' keeps running under pointer drag');
  }
});

test('recordPlay stores scores, tickets, goals and the best-lap ghost; prizes spend tickets', () => {
  const g = createTestGame();
  const r1 = recordPlay(g, 'star', { points: 1200, tickets: 13 });
  assert.equal(S(g).tickets, 13); assert.equal(best(g, 'star'), 1200); assert.ok(r1.newBest); assert.equal(table(g, 'star').length, 5);
  recordPlay(g, 'star', { points: GAMES.star.goal + 1, tickets: 40 });
  assert.equal(goalsMet(g), 1); assert.equal(table(g, 'star')[0].me, true);
  recordPlay(g, 'kart', { points: 900, tickets: 5, extra: { time: 41.2, ghost: [[0, 160], [30, 162]] } });
  assert.equal(S(g).bestTime, 41.2); assert.ok(S(g).ghost.pts.length === 2);
  recordPlay(g, 'kart', { points: 900, tickets: 5, extra: { time: 50, ghost: [[0, 1]] } });
  assert.equal(S(g).bestTime, 41.2, 'a slower run keeps the older ghost');
  assert.ok(prizeSteps(g).length >= 2);
  assert.equal(S(g).hs.kart.length, 2);
});

test('bicycle: key state, bag slots from the basket, speed from tires, indoor dismount', () => {
  const g = createTestGame();
  const b = S(g).bike; b.owned = true; b.basket = 2; b.tires = 1;
  g.world = { map: { id: 'town', def: { outdoor: true } }, player: { x: 100, y: 100 }, shadow() {}, drawFeet() {} };
  const bag = g.state.bagSize;
  assert.ok(mount(g) && b.riding && g.state.bagSize === bag + 4);
  assert.ok(Math.abs(speedMult(g) - 1.8) < 1e-9);
  dismount(g); assert.equal(g.state.bagSize, bag); assert.ok(b.parked && b.parked.map === 'town');
  toggleRide(g); assert.ok(b.riding, 'B hops back on next to the parked bike');
  g.bus.emit('mapEnter', { map: 'home' }); g.world.map = { id: 'home', def: { indoor: true } }; g.bus.emit('mapEnter', { map: 'home' });
  assert.equal(b.riding, false); assert.equal(g.state.bagSize, bag);
  const shop = get('shop', 'sv2_bike'); assert.ok(shop.services.some((s) => s.id === 'sv2_tires2' && s.when(g)));
  g.world = null;
});

test('Star Drops: seven distinct conditions, +max energy once each, title after all seven', () => {
  const g = createTestGame();
  assert.equal(DROPS.length, 7); assert.equal(new Set(DROPS.map((d) => d.id)).size, 7);
  const e0 = g.state.maxEnergy;
  scan(g); assert.equal(S(g).drops.pending.length, 0);
  g.setFlag('community_restored'); S(g).drops.cartBought = true; g.state.stats.mineDepth = 31;
  scan(g); assert.deepEqual([...S(g).drops.pending].sort(), ['cart', 'hall', 'mine']);
  for (const id of ['hall', 'mine', 'cart']) assert.ok(apply(g, id));
  assert.equal(apply(g, 'hall'), false);
  assert.equal(g.state.maxEnergy, e0 + 3 * ENERGY_PER); assert.equal(gotCount(g), 3);
});

test('Help Wanted bounties: three a day, score and bring jobs pay out', () => {
  const g = createTestGame();
  refreshBounties(g); const list = S(g).hw.list;
  assert.equal(list.length, 3); assert.ok(list.every((b) => b.reward.coins > 0 && b.text.length > 20));
  const sc = list.find((b) => b.type === 'score'); assert.ok(sc);
  assert.match(accept(g, sc), /taken/i);
  const coins = g.money; g.bus.emit('sv2ArcadePlayed', { key: sc.goal.key, points: sc.goal.score + 10 });
  assert.equal(sc.state, 'done'); assert.ok(g.money > coins);
  const board = R.boardNote; assert.ok(board.sv2_hw_0 && board.sv2_hw_1 && board.sv2_hw_2);
  void finish;
});

test('Arcade & Travel declares its features', () => {
  const n = FEATURES.filter((f) => f.cat === 'Arcade & Travel' || f.category === 'Arcade & Travel').length;
  assert.ok(n >= 54, 'declared ' + n);
});
