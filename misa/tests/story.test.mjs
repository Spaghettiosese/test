import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, R } from './helpers.mjs';

const tick = () => new Promise((r) => setTimeout(r, 5));

test('quest matcher advances stages on events and chains rewards', async () => {
  const g = createTestGame();
  R.quest.t_demo = { id: 't_demo', name: 'Demo', stages: [{ text: 'a', done: { on: 'mapEnter', map: 'cafe' } }, { text: 'b', done: { has: 'flag:t_go' } }], reward: { flags: ['t_done'] } };
  g.startQuest('t_demo');
  g.bus.emit('mapEnter', { map: 'mart' }); await tick();
  assert.equal(g.quest('t_demo').stage, 0);
  g.bus.emit('mapEnter', { map: 'cafe' }); await tick();
  assert.equal(g.quest('t_demo').stage, 1);
  g.setFlag('t_go'); await tick();
  assert.ok(g.questDone('t_demo') && g.flag('t_done'));
  delete R.quest.t_demo;
});

test('the prologue starts on a new game and chapter 1 waits for chapter 0 to finish', async () => {
  const g = createTestGame(); await tick(); await tick();
  assert.ok(g.state.story.started[0] !== undefined);
  g.state.time.day = 2; g.bus.emit('dayStart', { day: 2 }); await tick();
  assert.equal(g.state.story.started[1], undefined);
  g.completeQuest('main_ch0'); await tick(); await tick();
  assert.ok(g.flag('chapter_0_done'));
  g.bus.emit('dayStart', { day: 2 }); await tick();
  assert.ok(g.state.story.started[1] !== undefined);
});
