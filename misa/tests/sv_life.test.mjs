import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, FEATURES } from './helpers.mjs';
import { shopRows } from '../src/ui/shop.js';
import { refreshOrders, accept, claim, progress, ready, TEMPLATES } from '../src/content/sv_life/orders.js';
import { luckValue, S } from '../src/content/sv_life/state.js';
import { NOTES, findNote, foundCount } from '../src/content/sv_life/secrets.js';
import { evaluate, heartPct, evalSteps, THRESH } from '../src/content/sv_life/evaluation.js';
import { mailFor, gossip } from '../src/content/sv_life/social_extras.js';

const mk = () => { const g = createTestGame(); g.run = async () => {}; g.open = () => null; return g; };

test('sv_life: cart and boat stock is seeded, priced and includes recipes', () => {
  const g = mk();
  for (const id of ['sv_cart', 'sv_boat']) {
    const a = shopRows(g, get('shop', id)), b = shopRows(g, get('shop', id));
    assert.ok(a.length >= 5 && a.every((r) => r.price > 0), id);
    assert.deepEqual(a.map((r) => r.id), b.map((r) => r.id));
  }
  assert.ok(shopRows(g, get('shop', 'sv_cart')).some((r) => r.kind === 'service'));
});

test('sv_life: special orders accept, progress and pay out', () => {
  const g = mk();
  assert.ok(TEMPLATES.length >= 16);
  refreshOrders(g);
  const o = S(g).orders;
  assert.equal(o.offers.length, 4);
  const have = o.offers.find((x) => x.goal.t === 'have') || o.offers[0];
  accept(g, have);
  const a = o.active[0];
  assert.ok(!ready(g, a) || a.goal.t === 'stat');
  if (a.goal.t === 'have') for (const [id, n] of Object.entries(a.goal.items)) g.give(id, n, true);
  else if (a.goal.t === 'stat') g.state.stats[a.goal.k] = (g.state.stats[a.goal.k] || 0) + a.goal.n;
  else a.prog = a.goal.n;
  assert.ok(ready(g, a) && progress(g, a).have === progress(g, a).need);
  const m = g.money; claim(g, a);
  assert.ok(g.money > m && !o.active.length && o.doneCount === 1);
});

test('sv_life: daily luck, secret notes, mail, gossip and evaluation', () => {
  const g = mk();
  const v = luckValue(g); assert.ok(v >= 0 && v <= 100);
  assert.equal(NOTES.length, 30); assert.equal(new Set(NOTES.map((n) => n[0])).size, 30);
  for (const n of NOTES) { assert.ok(get('map', n[1]).spots[n[2]], `${n[1]}:${n[2]}`); if (n[5]) assert.ok(get('map', n[5][0]).spots[n[5][1]]); }
  findNote(g, NOTES[4]); assert.equal(foundCount(g), 1); assert.ok(S(g).secrets.maps[NOTES[4][0]]);
  assert.ok(mailFor(g, 'mika', 5)); assert.equal(mailFor(g, 'mika', 5), null);
  assert.ok(gossip(g).length > 20);
  const r = evaluate(g); assert.equal(r.cats.length, 8); assert.ok(r.total >= 0 && r.total <= 8000 && r.lanterns >= 0 && THRESH.length === 4);
  assert.ok(heartPct(g) >= 0 && heartPct(g) <= 100);
  assert.ok(evalSteps(g, r).length > 8);
  assert.ok(FEATURES.filter((f) => f.cat === 'Town Life').length >= 50);
});
