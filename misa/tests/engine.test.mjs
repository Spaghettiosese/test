import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, R } from './helpers.mjs';
import { compileCond, condRefs } from '../src/core/cond.js';
import { findPath } from '../src/core/path.js';
import { seasonOf, dateOf, weekdayOf, clockText } from '../src/core/time.js';
import { migrate, newState } from '../src/core/state.js';

test('conditions: data strings evaluate against the game', () => {
  const g = createTestGame();
  g.state.money = 120; g.state.flags.met_nori = true; g.state.time.minutes = 17 * 60 + 30; g.state.weather = 'rain';
  const T = (c) => compileCond(c)(g);
  assert.equal(T('money>=100'), true);
  assert.equal(T('money<100'), false);
  assert.equal(T('flag:met_nori'), true);
  assert.equal(T('!flag:met_nori'), false);
  assert.equal(T('time>=17:00'), true);
  assert.equal(T('weather:rain|storm'), true);
  assert.equal(T(['money>=100', 'weather:snow']), false);
  assert.equal(T({ any: ['money>=999', 'weather:rain'] }), true);
  assert.equal(T('day:mon'), true); // day 1 is a Monday
  assert.deepEqual(condRefs('item:tea>=2&friend:hana>=4'), [['item', 'tea'], ['friend', 'hana']]);
  assert.throws(() => compileCond('nonsense:x'));
});

test('A* finds a path around walls, allows a solid goal, and reports no path', () => {
  const grid = ['.....', '.###.', '.#...', '.#.#.', '...#.'].map((r) => [...r].map((c) => c === '.'));
  const pass = (x, y) => grid[y] && grid[y][x];
  const p = findPath(pass, 0, 0, 2, 2);
  assert.ok(p && p.length && p[p.length - 1][0] === 2 && p[p.length - 1][1] === 2);
  assert.ok(findPath(pass, 0, 0, 1, 1)); // goal tile is a wall: allowed
  assert.equal(findPath(() => false, 0, 0, 3, 3), null);
});

test('calendar: days roll into weekdays and seasons', () => {
  assert.equal(seasonOf(1), 'spring'); assert.equal(seasonOf(29), 'summer'); assert.equal(seasonOf(113), 'spring');
  assert.equal(dateOf(30), 2); assert.equal(weekdayOf(8), 0);
  assert.equal(clockText(13 * 60 + 5), '1:05 PM');
  const g = createTestGame();
  g.state.time.minutes = 25 * 60;
  g.nextDay();
  assert.equal(g.day, 2); assert.ok(['sunny', 'cloudy', 'rain', 'storm', 'snow', 'windy'].includes(g.weather));
});

test('saves: migrate fills nested defaults, refuses newer saves, and round-trips', () => {
  const old = JSON.parse(JSON.stringify(newState(7)));
  delete old.mochi.affection; delete old.homeTasks;
  const m = migrate(old);
  assert.equal(typeof m.mochi.affection, 'number'); assert.ok(m.homeTasks);
  assert.throws(() => migrate({ ...newState(1), v: 999 }));
  const s = newState(3); s.inv.tea = 2;
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))).inv, { tea: 2 });
});

test('inventory, money, friendship and quests behave', () => {
  const g = createTestGame();
  const anyItem = Object.keys(R.item)[0];
  if (anyItem) { g.give(anyItem, 3, true); assert.equal(g.count(anyItem), 3); assert.ok(g.take(anyItem, 2)); assert.equal(g.count(anyItem), 1); assert.equal(g.take(anyItem, 5), false); }
  const m0 = g.money; assert.equal(g.spend(m0 + 1), false); assert.ok(g.spend(1)); assert.equal(g.money, m0 - 1);
  const npc = Object.keys(R.npc)[0];
  if (npc) { g.addFriend(npc, 250); assert.equal(g.hearts(npc), 2); }
  const q = Object.keys(R.quest)[0];
  if (q) { g.startQuest(q); assert.ok(g.questActive(q)); g.completeQuest(q); assert.ok(g.questDone(q)); }
});
