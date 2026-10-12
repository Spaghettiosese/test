import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, R } from './helpers.mjs';
import { shopRows, sellRows } from '../src/ui/shop.js';
import { finishShift, jobRank } from '../src/content/economy/jobs.js';
import { refreshBoard } from '../src/content/economy/board.js';

test('economy: shops stock real items, prices are sane, the shipping box pays overnight', () => {
  const g = createTestGame();
  for (const s of Object.values(R.shop)) for (const r of shopRows(g, s)) assert.ok(r.price > 0, `${s.id} ${r.id} has a price`);
  assert.ok(shopRows(g, get('shop', 'mart')).length > 60);
  g.give('ing_egg', 3, true);
  assert.ok(sellRows(g, get('shop', 'mart')).some((r) => r.id === 'ing_egg'));
  const before = g.money;
  g.take('ing_egg', 3); g.state.economy.shipBox.ing_egg = 3;
  g.nextDay();
  assert.ok(g.money > before && !Object.keys(g.state.economy.shipBox).length);
});

test('economy: job shifts pay, raise rank and requests refresh daily', async () => {
  const g = createTestGame();
  g.open = () => null; // no UI in tests
  for (let i = 0; i < 4; i++) { g.state.energy = 100; finishShift(g, 'cafe', { score: 1, stars: 3 }, 1); g.state.economy.jobs.cafe.lastDay = 0; }
  assert.ok(jobRank(g, 'cafe') >= 2 && g.money > 300 && g.flag('econ_eom_cafe'));
  refreshBoard(g);
  assert.equal(g.state.economy.requests.board.length, 3);
  assert.ok(g.state.economy.requests.weekly);
});
