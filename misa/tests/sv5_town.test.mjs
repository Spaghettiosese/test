import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, get } from './helpers.mjs';
import { PROJECTS, fund, trustOf, projState, daysLeft, tickProjects, ceremonySteps } from '../src/content/sv5_town/projects.js';
import { SHOPS } from '../src/content/sv5_town/shops.js';
import { FAMILIES, arrivedCount, happiness, population } from '../src/content/sv5_town/people.js';
import { StallGame, counterChance } from '../src/minigames/sv5_town/stall.js';
import { AuctionGame } from '../src/minigames/sv5_town/auction.js';
import { interestFor, stepPrice, deposit, payInterest, buyShares, sellShares, shareStep, buyTicket, prizeFor, borrow, repay, SHARE_CAP } from '../src/content/sv5_town/finance.js';
import { makeIssue, publish, logEvent, submitIdea, grantAward, leaderboard, awardLevel } from '../src/content/sv5_town/civic.js';
import { S } from '../src/content/sv5_town/state.js';

const day = (g, d) => { g.state.time.day = d; g.bus.emit('dayStart', {}); };

test('town projects: trust gates funding, construction takes days, then the project is done', () => {
  const g = createTestGame();
  g.state.money = 5000; assert.equal(fund(g, 'bus', 500), 0, 'no trust yet');
  g.setFlag('community_restored', true);
  assert.ok(trustOf(g) >= 3);
  assert.equal(fund(g, 'bus', 700), 700); assert.equal(projState(g, 'bus'), 'idle');
  assert.equal(fund(g, 'bus', 9999), 500); assert.equal(projState(g, 'bus'), 'building');
  assert.ok(g.flag('tp_bus_site')); assert.equal(g.money, 5000 - 1200);
  const d0 = g.day; assert.equal(daysLeft(g, 'bus'), 3);
  day(g, d0 + 2); assert.equal(projState(g, 'bus'), 'building');
  day(g, d0 + 3); assert.equal(projState(g, 'bus'), 'done'); assert.ok(g.flag('tp_bus_done'));
  assert.ok(ceremonySteps(g, 'bus').length > 5);
  assert.equal(fund(g, 'weather', 100), 0, 'weather station needs the recycling centre first');
  assert.equal(PROJECTS.length, 8);
});

test('shops open on their dates and owners are registered with schedules', () => {
  const g = createTestGame();
  for (const s of SHOPS) { assert.ok(get('npc', s.owner) && get('shop', `tp_shop_${s.id}`)); assert.ok(!g.flag(`tp_shop_${s.id}_open`)); }
  day(g, 42); assert.ok(g.flag('tp_shop_flower_open')); assert.ok(!g.flag('tp_shop_books_open'));
  day(g, 200); for (const s of SHOPS) assert.ok(g.flag(`tp_shop_${s.id}_open`), s.id);
});

test('population arrivals follow the calendar and census numbers react', () => {
  const g = createTestGame(); const p0 = population(g), h0 = happiness(g);
  day(g, 70); assert.equal(arrivedCount(g), 1); assert.ok(g.flag('tp_in_ayame') && g.flag('tp_van_ayame'));
  day(g, 71); assert.ok(!g.flag('tp_van_ayame'), 'the van leaves the next day');
  day(g, 260); assert.equal(arrivedCount(g), FAMILIES.length);
  assert.ok(population(g) > p0 && happiness(g) > h0);
});

test('stall minigame: the bot serves customers, haggles and earns coins', () => {
  const g = createTestGame(); g.state.time.day = 3;
  const m = new StallGame(g, { goods: [{ id: 'crop_turnip', qty: 6, price: 60 }, { id: 'crop_tomato', qty: 6, price: 80 }], duration: 40 });
  const bot = get('minigame', 'sv5_stall').bot;
  for (let i = 0; i < 60 * 120 && !m.done; i++) m.update(DT, bot(m, i * DT, inp()), g);
  assert.ok(m.done && m.served > 2 && m.revenue > 100 && m.score > 0 && m.score <= 1);
  assert.ok(counterChance(1, 4) > counterChance(0.7, 0));
});

test('auction bot wins crates within its budget', () => {
  const g = createTestGame(); const m = new AuctionGame(g, { budget: 400 }); let paid = 0; m.o.onLot = (l, p) => { paid += p; };
  const bot = get('minigame', 'sv5_auction').bot;
  for (let i = 0; i < 60 * 200 && !m.done; i++) m.update(DT, bot(m, i * DT, inp()), g);
  assert.ok(m.done && m.spent <= 400 && paid === m.spent);
});

test('finance: interest, loans, shares and the lottery behave', () => {
  const g = createTestGame(); g.state.money = 3000;
  assert.equal(interestFor(1000), 10); assert.equal(interestFor(50000), 100); assert.equal(interestFor(-5), 0);
  deposit(g, 1000); assert.equal(g.money, 2000); assert.equal(payInterest(g), 10); assert.equal(S(g).bank.bal, 1010);
  assert.equal(borrow(g, 9999), 4000); assert.equal(S(g).bank.loan, 4000); assert.equal(borrow(g, 100), 0); assert.equal(repay(g, 1500), 1500); assert.equal(S(g).bank.loan, 2500);
  for (let i = 0; i < 400; i++) { const p = stepPrice(100 + (i % 7) * 50, (i * 7 % 10) / 10, (i * 3 % 10) / 10, 0.05); assert.ok(p >= 40 && p <= 400); }
  const a = shareStep(g, 10), b = (S(g).shares.price = 100, shareStep(g, 10)); assert.equal(a, b, 'deterministic per day');
  g.state.money = 100000; assert.equal(buyShares(g, 999), SHARE_CAP); assert.equal(sellShares(g, 20), 20); assert.equal(S(g).shares.n, SHARE_CAP - 20);
  assert.equal(prizeFor(123, 123), 2500); assert.equal(prizeFor(923, 123), 400); assert.equal(prizeFor(120, 123), 0); assert.equal(prizeFor(993, 123), 100);
  for (let i = 0; i < 5; i++) assert.notEqual(buyTicket(g), null); assert.equal(buyTicket(g), null);
});

test('newspaper issues come from real events; suggestions and awards work', () => {
  const g = createTestGame(); g.state.time.day = 15; logEvent(g, 'project', 'Work begins on the Community Garden'); logEvent(g, 'misc', 'A small thing');
  const i = publish(g); assert.ok(i && /GARDEN|Garden/.test(i.head) && i.items.length >= 3); assert.equal(publish(g), null);
  assert.ok(makeIssue(g).items.some((t) => t.startsWith('Weather')));
  assert.ok(submitIdea(g, 'benches')); assert.ok(!submitIdea(g, 'tea'));
  day(g, 18); assert.equal(S(g).sugg.list[0].state, 'approved'); day(g, 21); assert.ok(g.flag('tp_idea_benches'));
  assert.ok(leaderboard(g).some((r) => r.id === 'misa'));
  g.setFlag('community_restored', true); S(g).vol.pts = 100; const lv = awardLevel(g); assert.ok(lv >= 1);
  const m0 = g.money; assert.equal(grantAward(g, 1), lv); assert.ok(g.money > m0); assert.equal(grantAward(g, 1), lv);
});
