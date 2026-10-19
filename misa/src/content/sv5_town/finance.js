// Cosy finance (sv5): Pip's post-office savings account with weekly interest, a piggy-bank goal tracker, gentle interest-free council loans,
// Hoshimori Co-op shares (daily random walk with news), the weekly town lottery tied to the mart capsule machine, and harbour auction day.
// Nothing here can punish the player: interest is capped, loans have no deadline, shares are capped at 50 and prices are floored.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { dateText } from '../../core/time.js';
import { S, mapPatch, prop, mailSafe, pick, clamp, once, N, say, call, sc, ch } from './state.js';
import { listApp } from './ui.js';
import '../../minigames/sv5_town/auction.js';

// ---------------------------------------------------------------- pure maths (tested)
export const INTEREST_RATE = 0.01, INTEREST_CAP = 10000, SHARE_CAP = 50, LOAN_MAX = 4000, TICKET_PRICE = 50, TICKET_CAP = 5;
export const interestFor = (bal) => Math.floor(Math.min(Math.max(0, bal), INTEREST_CAP) * INTEREST_RATE);
export const stepPrice = (p, r1, r2, bias = 0) => clamp(Math.round(p * (1 + (r1 - 0.5) * 0.08 + bias + (r2 < 0.05 ? 0.12 : r2 > 0.95 ? -0.12 : 0))), 40, 400);
export const GOALS = { bike: { name: 'A bike', price: 8000 }, boat: { name: 'A little rowboat', price: 15000 }, house: { name: 'The house project', price: 30000 } };
export const NEWS = [
  ['The harbour catch is bigger than usual.', 0.03], ['A storm delays the ferry.', -0.03], ['The council announces a new project.', 0.02], ['Tourists are flocking to the bay.', 0.04],
  ['A rainy week keeps the shotengai quiet.', -0.02], ['The Co-op wins a baking prize.', 0.03], ['A truck of fish arrives late.', -0.02], ['Festival season boosts spending.', 0.03], ['Prices at the mart wobble.', -0.01], ['A new shop opens on the square.', 0.02],
];

// ---------------------------------------------------------------- bank
export const bank = (g) => S(g).bank;
export function deposit(g, n) { n = Math.min(n, g.money); if (n <= 0) return 0; g.moneyNote && g.moneyNote('Pip savings deposit'); g.addMoney(-n, true); bank(g).bal += n; g.sfx('coin'); return n; }
export function withdraw(g, n) { n = Math.min(n, bank(g).bal); if (n <= 0) return 0; bank(g).bal -= n; g.moneyNote && g.moneyNote('Pip savings withdrawal'); g.addMoney(n, true); g.sfx('coin'); return n; }
export function payInterest(g) { const b = bank(g), i = interestFor(b.bal); b.bal += i; b.interest += i; return i; }
export function potAdd(g, goal, n) { const b = bank(g); n = Math.min(n, g.money); if (n <= 0) return 0; g.addMoney(-n, true); b.pots[goal] += n; checkGoal(g, goal); return n; }
export function potTake(g, goal) { const b = bank(g), n = b.pots[goal]; b.pots[goal] = 0; g.addMoney(n, true); return n; }
function checkGoal(g, goal) { const b = bank(g); if (b.pots[goal] >= GOALS[goal].price && !b.reached[goal]) { b.reached[goal] = g.day; g.toast(`Piggy bank full: ${GOALS[goal].name}!`, 'heart'); g.mail(`tp_goal_${goal}`, 'Pip', `Your piggy bank for ${GOALS[goal].name.toLowerCase()} is full! Take it out whenever you are ready to buy. Proud of you!`); if (g.giveStickers) g.giveStickers(2, 'piggy bank goal'); } }
export function borrow(g, n, cap = LOAN_MAX) { const b = bank(g); n = Math.min(n, Math.min(cap, LOAN_MAX) - b.loan); if (n <= 0) return 0; b.loan += n; b.borrowed += n; g.addMoney(n, true); return n; }
export function repay(g, n) { const b = bank(g); n = Math.min(n, b.loan, g.money); if (n <= 0) return 0; g.addMoney(-n, true); b.loan -= n; b.repaid += n; if (!b.loan) g.toast('Loan fully repaid. Thank you!'); return n; }

// ---------------------------------------------------------------- shares
export function shareStep(g, day = g.day) {
  const sh = S(g).shares, r = g.rngFor('tp_shares', day), news = r() < 0.35 ? pick(r, NEWS) : null;
  sh.price = stepPrice(sh.price, r(), r(), news ? news[1] : 0); sh.news = news ? news[0] : ''; sh.day = day;
  sh.hist.push(sh.price); if (sh.hist.length > 28) sh.hist.shift();
  return sh.price;
}
export function buyShares(g, n) { const sh = S(g).shares; n = Math.min(n, SHARE_CAP - sh.n, Math.floor(g.money / sh.price)); if (n <= 0) return 0; g.addMoney(-n * sh.price, true); sh.n += n; sh.cost += n * sh.price; g.stat('sharesBought', n); return n; }
export function sellShares(g, n) { const sh = S(g).shares; n = Math.min(n, sh.n); if (n <= 0) return 0; const avg = sh.cost / sh.n; g.addMoney(n * sh.price, true); sh.cost = Math.max(0, sh.cost - avg * n); sh.n -= n; return n; }

// ---------------------------------------------------------------- lottery
export const weekNo = (day) => Math.floor((day - 1) / 7);
export const ticketsThisWeek = (g) => S(g).lotto.tickets.filter((t) => t.w === weekNo(g.day)).length;
export function buyTicket(g, free = false) {
  const l = S(g).lotto; if (ticketsThisWeek(g) >= TICKET_CAP) return null;
  if (!free) { if (g.money < TICKET_PRICE) return null; g.addMoney(-TICKET_PRICE, true); }
  const num = Math.floor(g.rngFor('tp_ticket' + l.tickets.length, g.day + l.tickets.length)() * 1000);
  l.tickets.push({ n: num, w: weekNo(g.day) }); return num;
}
export const winningNumber = (g, week) => Math.floor(g.rngFor('tp_lotto', week * 7 + 1)() * 1000);
export function prizeFor(ticket, win) { const a = String(ticket).padStart(3, '0'), b = String(win).padStart(3, '0'); return a === b ? 2500 : a.slice(1) === b.slice(1) ? 400 : a[2] === b[2] ? 100 : 0; }
export function drawLottery(g) {
  const l = S(g).lotto, w = weekNo(g.day) - (g.weekday === 0 ? 1 : 0), mine = l.tickets.filter((t) => t.w === w);
  if (l.lastDraw === w + 1 || !mine.length) { l.lastDraw = w + 1; return 0; }
  const win = winningNumber(g, w), total = mine.reduce((a, t) => a + prizeFor(t.n, win), 0);
  l.lastDraw = w + 1; l.tickets = l.tickets.filter((t) => t.w > w); l.result = `Week ${w + 1}: winning number ${String(win).padStart(3, '0')}, you won ${total}c`;
  if (total) { l.wins++; l.won += total; g.addMoney(total, true); }
  g.mail(`tp_lotto_${w}`, 'Town Lottery', total ? `Winning number ${String(win).padStart(3, '0')}. You won ${total} coins! The prize is already in your pocket.` : `Winning number ${String(win).padStart(3, '0')}. No prize this week, but thank you for supporting the town fund!`);
  g.bus.emit('tpLottery', { win, total }); return total;
}

// ---------------------------------------------------------------- daily system
register('system', 'tp_finance', {
  init(g) {
    g.bus.on('dayStart', () => {
      const b = bank(g), wk = weekNo(g.day);
      if (g.weekday === 0 && b.lastInt !== wk && b.bal > 0) { b.lastInt = wk; const i = payInterest(g); if (i) g.toast(`Pip: +${i} coins interest`, 'heart'); }
      if (S(g).shares.day !== g.day) shareStep(g);
      const sh = S(g).shares; if (g.weekday === 6 && sh.n) { const d = Math.round(sh.n * sh.price * 0.01); if (d) { g.addMoney(d, true); sh.divs += d; g.toast(`Co-op dividend: +${d} coins`); } }
      if (g.weekday === 6 || g.weekday === 0) drawLottery(g);
      if (b.loan && g.day % 28 === 5) g.mail(`tp_loan_${g.day}`, 'Town Council', `A friendly note: you owe ${b.loan} coins on the council loan. No hurry and no interest, repay whenever it suits you.`);
    });
    g.bus.on('itemGot', (e) => {
      if (!e || !String(e.item).startsWith('toy_fig_')) return;
      const l = S(g).lotto; l.stubs++;
      if (l.stubs >= 5) { l.stubs -= 5; const n = buyTicket(g, true); if (n !== null) g.toast(`Capsule stubs traded for a free lottery ticket (${String(n).padStart(3, '0')})`, 'heart'); else l.stubs += 5; }
    });
  },
});

// ---------------------------------------------------------------- the Bank app
const when = () => true;
listApp('tp_bank', { name: 'Pip Bank', icon: itemIcon('coin', { c: Rr.butter[2] }), order: 43, when, pages: [
  { name: 'Savings', build(g) { const b = bank(g); return { lines: [{ t: "Pip's post-office savings", c: Rr.coral[1] }, `Balance: ${b.bal}c`, `Pocket: ${g.money}c`, `Interest: 1% every Monday on up to ${INTEREST_CAP}c (next: +${interestFor(b.bal)}c)`, `Interest earned so far: ${b.interest}c`, '', 'Your savings are safe. Pip checks twice.'],
    acts: [{ label: 'Save 100', off: g.money < 100, run: () => deposit(g, 100) }, { label: 'Save 500', off: g.money < 500, run: () => deposit(g, 500) }, { label: 'Take 100', off: b.bal < 100, run: () => withdraw(g, 100) }, { label: 'Take all', off: !b.bal, run: () => withdraw(g, b.bal) }] }; } },
  { name: 'Goals', build(g, st) {
    const ids = Object.keys(GOALS), id = ids[st.sel] || ids[0], b = bank(g), gl = GOALS[id];
    return { list: ids.map((i) => ({ t: `${GOALS[i].name} ${Math.min(100, Math.floor(100 * b.pots[i] / GOALS[i].price))}%` })), lines: [{ t: gl.name, c: Rr.coral[1] }, `${b.pots[id]} / ${gl.price} coins in the piggy bank`, b.reached[id] ? 'Goal reached! Take it out any time.' : 'Pocket change adds up.'],
      bars: [{ label: 'Piggy', v: b.pots[id], max: gl.price, c: Rr.butter[2] }], acts: [{ label: 'Add 100', off: g.money < 100, run: () => potAdd(g, id, 100) }, { label: 'Add 500', off: g.money < 500, run: () => potAdd(g, id, 500) }, { label: 'Add all', off: !g.money, run: () => potAdd(g, id, g.money) }, { label: 'Take out', off: !b.pots[id], run: () => potTake(g, id) }] }; } },
  { name: 'Loan', build(g) { const b = bank(g); return { lines: [{ t: 'Gentle council loan', c: Rr.coral[1] }, `Owed: ${b.loan}c (limit ${LOAN_MAX}c)`, 'No interest, no deadline, no penalty. Borrow to fund a town project and repay when you can.', `Borrowed so far: ${b.borrowed}c, repaid: ${b.repaid}c`],
    acts: [{ label: 'Borrow 500', off: b.loan >= LOAN_MAX, run: () => borrow(g, 500) }, { label: 'Repay 100', off: !b.loan || g.money < 100, run: () => repay(g, 100) }, { label: 'Repay all', off: !b.loan || !g.money, run: () => repay(g, b.loan) }] }; } },
  { name: 'Shares', build(g) { const sh = S(g).shares; return { lines: [{ t: 'Hoshimori Co-op shares', c: Rr.coral[1] }, `Price today: ${sh.price}c   You hold: ${sh.n} (max ${SHARE_CAP})`, sh.n ? `Value ${sh.n * sh.price}c, paid ${Math.round(sh.cost)}c` : 'Buy a share of the local co-op.', `News: ${sh.news || 'A quiet day at the Co-op.'}`, `Sunday dividends: 1% of value. Collected: ${sh.divs}c`], chart: sh.hist.slice(-20),
    acts: [{ label: 'Buy 1', off: g.money < sh.price || sh.n >= SHARE_CAP, run: () => buyShares(g, 1) }, { label: 'Buy 5', off: g.money < sh.price * 5 || sh.n > SHARE_CAP - 5, run: () => buyShares(g, 5) }, { label: 'Sell 1', off: !sh.n, run: () => sellShares(g, 1) }, { label: 'Sell all', off: !sh.n, run: () => sellShares(g, sh.n) }] }; } },
  { name: 'Lotto', build(g) { const l = S(g).lotto, mine = l.tickets.filter((t) => t.w === weekNo(g.day)); return { lines: [{ t: 'Town lottery', c: Rr.coral[1] }, `Tickets cost ${TICKET_PRICE}c, ${TICKET_CAP} a week. Draw every Sunday.`, `This week: ${mine.length ? mine.map((t) => String(t.n).padStart(3, '0')).join(' ') : 'none yet'}`, `Capsule stubs: ${l.stubs}/5 (each mart capsule gives one, 5 = free ticket)`, `Last: ${l.result || 'no draw yet'}`, `Total won: ${l.won}c in ${l.wins} wins`],
    acts: [{ label: 'Buy ticket', off: g.money < TICKET_PRICE || mine.length >= TICKET_CAP, run: () => buyTicket(g) }] }; } },
] });
mapPatch('post_office', { objects: [prop('tp_piggy', 8, 2, { use: 'tp_savings_desk', shadow: 6 })] });
register('interaction', 'tp_savings_desk', { label: "Pip's savings desk", run: (g) => g.run([say('pip', 'happy', 'Savings account? Piggy bank? Council loan? Shares? I do it all. And stamps.'), call((gg) => gg.open('phone', 'tp_bank'))]) });

// ---------------------------------------------------------------- auction day (Sundays on the harbour)
mapPatch('harbour', { objects: [prop('tp_auction_stand', 16, 5, { w: 3, h: 2, when: ['day:sun', 'time>=10:00', 'time<16:00'], use: 'tp_auction', shadow: 30 })] });
register('interaction', 'tp_auction', { label: 'Harbour auction',
  run: async (g) => {
    const a = S(g).auction;
    if (a.last === g.day) return g.say('tama', 'happy', 'That is the auction done for today. Come back next Sunday, Misa!');
    await g.run([say('tama', 'happy', 'Crates, crates, crates! Five lots, three rivals and your good eyes. We cap your bidding so nobody goes home sad.')]);
    const budget = Math.min(600, g.money); if (budget < 20) return g.say(null, null, 'You need at least 20 coins in your pocket to bid.');
    a.last = g.day; a.sessions++;
    let paid = 0;
    const r = await g.minigame('sv5_auction', { budget, seed: g.day, onLot: (lot, price) => { g.addMoney(-price, true); paid += price; g.give(lot.id, 1); a.wins++; a.spent += price; a.value += lot.v; } });
    g.stat('auctionDays'); g.bus.emit('tpAuction', { paid }); g.addXP('charm', 4);
    return g.say(null, null, `You went home with ${a.wins ? 'your winnings' : 'a story'} and spent ${paid} coins today.`);
  } });

features('Town Growth', [
  "Pip's post-office savings account: deposit and withdraw in the Pip Bank app or at the new savings desk, earning weekly interest (1% on up to 10000)",
  'Piggy-bank goal tracker for a bike, a rowboat and the house project, with progress bars, a mail and stickers when a goal is reached',
  'Gentle council loans: borrow up to 4000 coins interest-free with no deadline, to fund town projects, and repay whenever',
  'Hoshimori Co-op shares: a toy market with a daily random walk, news items, a 50 share cap and Sunday dividends',
  'Weekly town lottery with tickets, a Sunday draw and prizes mailed to Misa, capped at five tickets a week',
  'Capsule tie-in: every figurine from the mart capsule machine gives a lottery stub, and five stubs trade for a free ticket',
  'Auction day: on Sundays the harbour stand sells five mystery crates to bid on against three rivals, with a budget cap so nobody loses out',
]);

features('Town Growth', [
  "A savings desk with a piggy-bank stand in the post office opens the Pip Bank app after a word from Pip",
  "A monthly friendly mail reminds Misa about the council loan, with no interest or penalty",
  "Lottery results arrive by mail every Sunday, with the winning number and any prize already paid",
]);
