// Epilogue Life (game year 4+, after the ending): adult life in Hoshimori with three long-term goals,
//   1. Co-own Cafe Kumo with Mika (menu, daily specials, staff, rating, weekly ledger)
//   2. Buy Wren's Clocks from Tobias (daily income, repair orders)
//   3. Found the Hoshimori Lantern Foundation (four donation tiers that dress up the town)
// plus seasonal Alumni gatherings with the cast, the Hall of Fame phone app, and New Game+ with a Legacy bonus.
// Legacy lives outside the save file under localStorage key 'misa-life:legacy' (with an in-memory fallback).
import { register, get, features } from '../../core/registry.js';
import { seasonOf, dateOf, dateText } from '../../core/time.js';
import { UI, rect, panel, drawText, drawTextC, inside, bar } from '../../ui/ui.js';
import { Y, say, N, call, fade, bd, wait, choice, ask, runP, defEvent, st, stickers, giveOr, isAlum, yr, avg, nm, first, cast, topFriends, GRAD_DAY, actsEnding, actsDone } from './util.js';
import { enrolledKohai, SPEC } from './kohai.js';
import { nearSpot } from './years.js';
import { goalsFor, claim } from './goals.js';

const E = (g) => Y(g).epi;
const alum = (g) => !!Y(g).graduated;

// ---------------------------------------------------------------- legacy (New Game+)
const LKEY = 'misa-life:legacy';
let MEM = null;
const DEFL = () => ({ runs: 0, pts: 0, best: 0, endings: {}, hof: [], carried: { fishCaught: 0, harvested: 0, cooked: 0, requestsDone: 0 } });
export function loadLegacy() {
  try { const raw = globalThis.localStorage && globalThis.localStorage.getItem(LKEY); if (raw) return { ...DEFL(), ...JSON.parse(raw) }; } catch { /* ignore */ }
  return MEM ? { ...DEFL(), ...JSON.parse(JSON.stringify(MEM)) } : DEFL();
}
export function saveLegacy(l) { MEM = JSON.parse(JSON.stringify(l)); try { globalThis.localStorage && globalThis.localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } }
export function resetLegacy() { MEM = null; try { globalThis.localStorage && globalThis.localStorage.removeItem(LKEY); } catch { /* ignore */ } }
export function legacyPoints(g) {
  const G0 = Y(g).grad; if (!G0) return 0;
  const base = { scholar: 40, second_chance: 30, cafe: 40, keeper: 45, wanderer: 25 }[G0.base] || 25, bond = { together: 20, close: 10, quiet: 0 }[G0.bond] || 0;
  const C = E(g).cafe;
  return base + bond + Math.round((G0.score || 0) / 10) + C.stage * 5 + (E(g).clock.owned ? 15 : 0) + E(g).fund.tier * 8 + Math.min(20, Object.keys(Y(g).goalsClaimed).length);
}
export const legacyBonus = (l) => ({ money: Math.min(6000, 400 * l.runs + 3 * l.pts), xp: 12 * l.runs, bag: Math.min(8, 2 * l.runs), heart: Math.min(90, 30 * l.runs), carry: 0.1 });
export function applyLegacy(g) {
  const l = loadLegacy(); if (!l.runs || Y(g).legacyApplied) return false;
  const b = legacyBonus(l);
  g.state.money += b.money; g.state.bagSize += b.bag;
  for (const sk of ['study', 'cooking', 'fishing', 'gardening']) g.state.skills[sk] = (g.state.skills[sk] || 0) + b.xp;
  for (const id of ['kai', 'suzu', 'rina', 'theo', 'hina']) g.friend(id).pts += b.heart;
  for (const [k, v] of Object.entries(l.carried)) g.state.stats[k] = (g.state.stats[k] || 0) + Math.floor(v * b.carry);
  g.give('sv3y_legacy_charm', 1, true); g.setFlag('legacy_run', l.runs);
  Y(g).legacyApplied = true; g.bus.emit('svLegacy', { runs: l.runs });
  return true;
}
export function prestige(g) {
  const Z = Y(g);
  if (!Z.graduated) return null;
  const l = loadLegacy(), pts = legacyPoints(g);
  l.runs++; l.pts += pts; l.best = Math.max(l.best, (Z.grad && Z.grad.score) || 0); l.endings[Z.ending] = (l.endings[Z.ending] || 0) + 1;
  l.hof.unshift({ ending: Z.grad.title, score: Z.grad.score, pts, day: g.day }); l.hof.length = Math.min(l.hof.length, 10);
  for (const k of Object.keys(l.carried)) l.carried[k] = Math.max(l.carried[k], st(g, k));
  saveLegacy(l);
  return { legacy: l, pts };
}
export async function newGamePlus(g, startWorld = true) {
  const r = prestige(g); if (!r) return null;
  const slot = g.slot || 1;
  g.newGame(slot);
  applyLegacy(g);
  if (startWorld) { try { const m = await import('../../ui/title.js'); m.startWorld(g, true); } catch { /* headless */ } }
  try { g.save(); } catch { /* ignore */ }
  return r;
}
register('system', 'sv3_legacy', { init(g) { g.bus.on('newGame', () => applyLegacy(g)); } });

// ---------------------------------------------------------------- epilogue intro
defEvent({ key: (g) => (alum(g) && g.day > Y(g).grad.day ? 'epi_intro' : null),
  run: async (g) => {
    E(g).started = g.day; g.bus.emit('svEpilogue', {});
    g.mail('sv3y_epi_mum', 'Mum', 'Your first morning as a graduate! The ship is anchored for the week and the galley smells of curry. Tell Mochi we say hi. And you are not allowed to be an adult too fast.');
    g.mail('sv3y_epi_mika', 'Mika', 'The counter has a free stool and a new apron hook. Come by when you want to talk about co-owning the place. No pressure. A little pressure.');
    g.mail('sv3y_epi_tobias', 'Tobias', 'When you have a moment (and some savings), come see me about the shop. I have been thinking about the future of the tower.');
    await runP(g, [N('Epilogue Life. No bell, no timetable, only a long calendar and a cat who still thinks breakfast is the main event.'), say('misa', 'happy', 'Okay, Mochi. Let\'s go find out what we are when we grow up.'), call((gg) => gg.toast('Epilogue Life: three long-term goals unlocked', 'i_star'))]);
  } });

// ---------------------------------------------------------------- 1. Cafe Kumo co-owner
const CAFE_STAGES = [{ name: 'Visitor', cost: 0 }, { name: 'Co-owner', cost: 2500 }, { name: 'Menu board', cost: 4000 }, { name: 'Terrace seats', cost: 9000 }, { name: 'Star Cafe renovation', cost: 20000 }];
export const cafeCap = (g) => 20 + 10 * E(g).cafe.stage;
export const specialOptions = (g) => Object.keys(g.state.inv).filter((id) => { const it = get('item', id); return it && it.cat === 'food' && it.price >= 20 && g.count(id) > 0; }).sort((a, b) => get('item', b).price - get('item', a).price).slice(0, 5);
export function cafeDay(g) {
  const C = E(g).cafe; if (C.stage < 1) return null;
  const wk = g.isWeekend ? 5 : 0, staff = C.staff.length;
  const customers = Math.round(6 + C.rating / 2 + staff * 4 + wk + (g.weather === 'rain' ? -2 : 0));
  let revenue = customers * (110 + C.stage * 25), spec = 0;
  if (C.special && get('item', C.special) && g.count(C.special) > 0) { const n = Math.min(g.count(C.special), Math.floor(customers / 2)); g.take(C.special, n); spec = n; revenue += Math.round(n * (get('item', C.special).price * 1.6 + 30)); }
  const wages = staff * 90, profit = Math.max(0, Math.round(revenue * 0.4) - wages);
  C.days++; C.served += customers; C.profit += profit;
  if (C.rating < cafeCap(g) && (C.days % 4 === 0 || spec > 3)) C.rating++;
  C.last = { customers, revenue, wages, profit, spec };
  g.addMoney(profit, true);
  if (staff && C.days % 7 === 0) for (const s of C.staff) g.addFriend(s, 10);
  if (g.weekday === 0) g.mail(`sv3y_ledger_${g.day}`, 'Mika', `Cafe Kumo weekly ledger: ${C.served} customers served in total, rating ${C.rating}/${cafeCap(g)}, lifetime co-owner profit ${C.profit}. ${C.special ? 'Daily special: ' + get('item', C.special).name + '.' : 'No daily special set. Try one!'}`);
  g.toast(`Cafe Kumo: +${profit} coins`, 'i_coin');
  return C.last;
}
export async function cafeUpgrade(g) {
  const C = E(g).cafe, next = CAFE_STAGES[C.stage + 1];
  if (!next) return runP(g, [say('mika', 'happy', 'Cafe Kumo is fully renovated! It has a star on the sign now. A star!')]);
  const cost = C.stage === 0 && Y(g).track === 'cafe' ? 0 : next.cost;
  const i = await ask(g, `${next.name}: ${cost} coins`, ['Do it', 'Not now']);
  if (i !== 0) return;
  if (!g.spend(cost)) return;
  C.stage++; g.stat('cafeStages'); g.sfx('chime');
  if (C.stage === 1) { g.give('sv3y_coowner_apron', 1, true); g.give('sv3y_menu_card', 1, true); g.setFlag('sv3y_cafe_coowner'); g.addFriend('mika', 60); }
  if (C.stage === 4) g.setFlag('sv3y_cafe_star');
  await runP(g, [say('mika', 'happy', C.stage === 1 ? 'Welcome, partner. The sign still says Cafe Kumo, but the receipts say Kumo and Aoki.' : `${next.name} is done! The customers are going to love it.`)]);
}
async function cafeDesk(g) {
  const C = E(g).cafe;
  const i = await ask(g, `Co-owner's desk (${CAFE_STAGES[C.stage].name}, rating ${C.rating}/${cafeCap(g)})`, ['Set the daily special', 'Hire staff', 'Upgrade the cafe', 'Ledger', 'Leave']);
  if (i === 0) {
    const opts = specialOptions(g);
    if (!opts.length) return runP(g, [N('You need a food item in your bag to set as the special. Cook something!')]);
    const k = await ask(g, 'Which dish is today\'s special?', [...opts.map((id) => `${get('item', id).name} x${g.count(id)}`), 'No special']);
    C.special = opts[k] || null; return runP(g, [N(C.special ? `Special: ${get('item', C.special).name}. The chalkboard looks great.` : 'Special cleared.')]);
  }
  if (i === 1) {
    if (C.staff.length >= C.stage) return runP(g, [N(C.stage ? 'Every spot is filled for now. Upgrade the cafe for more room.' : 'Become a co-owner first.')]);
    const pool = [...enrolledKohai(g), 'kai', 'suzu', 'hina', 'theo', 'rina'].filter((id) => get('npc', id) && g.hearts(id) >= 3 && !C.staff.includes(id));
    if (!pool.length) return runP(g, [N('Nobody with 3+ hearts is free to hire. Spend some time with your friends first.')]);
    const k = await ask(g, 'Hire who? (90 coins a day)', [...pool.slice(0, 5).map((id) => nm(id)), 'Nobody']);
    if (pool[k]) { C.staff.push(pool[k]); g.stat('staffHired'); await runP(g, [say(pool[k], 'happy', 'Me? Behind the counter? Okay! I will do my very best!')]); }
    return;
  }
  if (i === 2) return cafeUpgrade(g);
  if (i === 3) { const l = C.last; return runP(g, [N(l ? `Yesterday: ${l.customers} customers, ${l.revenue} takings, ${l.wages} wages, ${l.profit} to you. Staff: ${C.staff.map(first).join(', ') || 'none'}.` : 'No takings yet. Open for a day!')]); }
}
register('targetProvider', 'sv3y_cafe_desk', {
  find(world, g) {
    const n = E(g).cafe.stage >= 1 ? nearSpot(world, 'cafe', 'kitchen', 36) || nearSpot(world, 'cafe', 'counter', 28) : null;
    return n ? { x: n.x, y: n.y, dist: n.d + 4, label: 'Co-owner\'s desk', run: (game) => { cafeDesk(game); } } : null;
  },
});
register('talkHook', 'sv3y_mika_partner', {
  npc: 'mika', priority: 43, when: (g) => alum(g) && E(g).cafe.stage === 0,
  steps: (g) => [say('mika', 'happy', 'Misa! I have been waiting. Cafe Kumo needs a second pair of hands, and a second name on the sign.'), choice('Become a co-owner?', ['Tell me more', say('mika', 'neutral', `Co-owner: ${Y(g).track === 'cafe' ? 'free, you earned it' : '2500 coins to buy in'}. You set the daily special, hire staff and keep forty percent of the takings.`), call((gg) => cafeUpgrade(gg))], ['Maybe later', say('mika', 'happy', 'The apron will wait. Aprons are patient.')])],
});

// ---------------------------------------------------------------- 2. Wren's Clocks
export const CLOCK_PRICE = 40000;
register('talkHook', 'sv3y_tobias_shop', {
  npc: 'tobias', priority: 43, when: (g) => alum(g) && !E(g).clock.owned && g.hearts('tobias') >= 4,
  steps: () => [say('tobias', 'neutral', 'Misa. I am getting old, and the clocks are not. The shop needs someone who loves winding things. Forty thousand coins and the key is yours. The bell included.'),
    choice('Buy Wren\'s Clocks?', ['Buy it', call(async (g) => { if (!g.spend(CLOCK_PRICE)) return; E(g).clock.owned = true; g.give('sv3y_clock_deed', 1, true); g.setFlag('sv3y_clock_owner'); g.stat('shopsBought'); g.addFriend('tobias', 80); await runP(g, [say('tobias', 'happy', 'The bell never rang so well. The shop is yours, and I will stay on as your grumpy apprentice.')]); })], ['Not yet', say('tobias', 'neutral', 'Time is the one thing I cannot sell you. Think it over.')])],
});
async function clockLedger(g) {
  const K = E(g).clock;
  const i = await ask(g, `Wren's Clocks: ${K.orders} repairs done`, ['Repair a clock (+250)', 'Check the tower bell', 'Leave']);
  if (i === 0) {
    if (K.repairDay === g.day) return runP(g, [say('tobias', 'neutral', 'You did one today. Let the oil settle.')]);
    if (!g.useEnergy(8)) return;
    K.repairDay = g.day; K.orders++; g.advance(60); g.addMoney(250); g.addXP('crafting', 12); g.stat('clockRepairs');
    await runP(g, [N('Springs, tiny screws, a drop of oil. The clock ticks once, then settles into a heartbeat.'), say('tobias', 'happy', 'Perfect. You have the hands.')]);
  } else if (i === 1) await runP(g, [N('Up in the tower the great bell sways in its cradle. Gold light pours through the louvres. The whole bay is below.')]);
}
register('targetProvider', 'sv3y_clock_ledger', {
  find(world, g) {
    const n = E(g).clock.owned ? nearSpot(world, 'clock_shop', 'counter', 34) : null;
    return n ? { x: n.x, y: n.y, dist: n.d + 4, label: 'Shop ledger', run: (game) => { clockLedger(game); } } : null;
  },
});

// ---------------------------------------------------------------- 3. Hoshimori Lantern Foundation
export const FUND_TIERS = [[5000, 'Lane lanterns'], [15000, 'Seaside boardwalk lights'], [40000, 'Community concert stage'], [80000, 'Star Lantern beacon']];
export function donate(g, n) {
  const F = E(g).fund; if (!g.spend(n)) return false;
  F.total += n; g.stat('foundationGiven', n);
  while (F.tier < FUND_TIERS.length && F.total >= FUND_TIERS[F.tier][0]) {
    F.tier++; g.setFlag('sv3y_fund_t' + F.tier); stickers(g, F.tier); g.sfx('star'); g.toast(`Foundation: ${FUND_TIERS[F.tier - 1][1]}!`, 'i_star');
    g.mail(`sv3y_fund_${F.tier}`, 'Hoshimori Lantern Foundation', `Thanks to your generosity, the town now has: ${FUND_TIERS[F.tier - 1][1]}. The mayor sends warm regards and a very large thank-you cake.`);
    if (F.tier === 4) g.give('sv3y_foundation_pin', 1, true);
  }
  return true;
}
async function fundBox(g) {
  const F = E(g).fund, next = FUND_TIERS[F.tier];
  const i = await ask(g, `Lantern Foundation: ${F.total} given${next ? `, next at ${next[0]} (${next[1]})` : ', all projects funded'}`, ['Give 500', 'Give 2000', 'Give 10000', 'Read the plaque'], [N('A brass box on a stone post by the fountain. A small plaque lists the projects it has paid for.')]);
  if (i === 3) return runP(g, [N(FUND_TIERS.map(([n, t], k) => `${k < F.tier ? 'DONE' : n}: ${t}`).join('   '))]);
  const amt = [500, 2000, 10000][i]; if (donate(g, amt)) await runP(g, [N(`You give ${amt} coins. The box clinks quietly.`)]);
}
register('targetProvider', 'sv3y_fund_box', {
  find(world, g) {
    const n = alum(g) ? nearSpot(world, 'town', 'fountain', 40) : null;
    return n ? { x: n.x, y: n.y, dist: n.d + 6, label: 'Lantern Foundation box', run: (game) => { fundBox(game); } } : null;
  },
});

// ---------------------------------------------------------------- daily epilogue tick
register('system', 'sv3_epilogue', {
  init(g) {
    g.bus.on('dayStart', () => {
      if (!alum(g)) return;
      cafeDay(g);
      const K = E(g).clock; if (K.owned && g.weekday !== 6) { K.days++; g.addMoney(150, true); if (K.days % 14 === 0) g.mail(`sv3y_clock_${K.days}`, 'Tobias', `Clock shop report: ${K.orders} repairs so far and 14 more days of ticking. Grumpy apprentice is doing fine.`); }
    });
  },
});

// ---------------------------------------------------------------- Alumni gatherings (each season)
const ALU_SEASONS = {
  spring: { day: 12, name: 'Hanami Reunion', bd: 'hanami', head: 'The cherry tree in Sakura Park, a picnic sheet the size of a small country, and everyone from school in a bad mood about being old.', act: ['Spread the picnic and pour the tea', 'Join the sakura petal contest', 'Take the reunion photo'] },
  summer: { day: 10, name: 'Beach Day', bd: 'fireworks', head: 'Shell Beach at dusk. Someone has brought a net, someone else has brought watermelon, and a lot of people have brought opinions about the watermelon.', act: ['Split the watermelon', 'Set off the fireworks', 'Build a sandcastle lighthouse'] },
  autumn: { day: 22, name: 'Homecoming', bd: 'leaves', head: 'The day after the Culture Festival, Hoshimori High lets alumni back in for tea and a tour. The corridors smell exactly the same.', act: ['Tour the old classroom', 'Visit the club room', 'Help the festival cleanup'] },
  winter: { day: 26, name: 'Year-End Gathering', bd: 'winter_market', head: 'The winter market glows. Lanterns, steamed buns, and a long table where everybody tries to say what the year meant.', act: ['Toast with hot cocoa', 'Write wishes on paper stars', 'Walk the market with friends'] },
};
const ALU = {
  kai: ['I run laps around the harbour every morning now. The fish are confused.', 'The team made me captain of a thing. Do not ask which thing.'], suzu: ['Chapter nine is done. You are in it. Under another name. A good name.', 'I sold a short story! For a coupon! A real coupon!'],
  rina: ['I have a binder for adulthood. It is thin. It is alarming.', 'Do not look at my schedule. It has a gap. A gap!'], theo: ['The mural has a new corner. It is you, from behind. It is flattering.', '...I am on a ferry on weekends. Drawing waves.'],
  hina: ['I found a beetle the size of a teacup! His name is Misa Junior!', 'The bug lab gave me a key. A KEY.'], fujita: ['The new third-years are loud. I miss you. A little. Do not tell them.', 'I framed the class photo. It is above my desk.'],
  ogawa: ['The tomatoes this year are SO big. They need seatbelts.', 'I still check the garden gate for you at lunchtime.'], hana: ['The notebook has a new page: Misa, aged twenty. Only good things.', 'Tea is hot. Sit. Tell me everything.'],
  tobias: ['The bell is ringing slightly late. I have decided it is on purpose.', 'A good clock tells time. A great clock tells stories.'], mika: ['The new menu has a Misa Special. It has too much butter. Perfect.', 'I am training a new cat to sit on the counter. It is not working.'],
  sachiko: ['I saved you the last melon bread. Do not tell the crowd.', 'The coupon book is now a hardcover. Collect them all.'], jun: ['The fish are biting. The fish are always biting. Those are the lies I live on.', 'Come out on the boat. The sea misses you.'],
  kiko: ['The fortune slips have been oddly accurate this season. Do not ask.', 'The shrine bell rang by itself again. I think it is your doing.'], pip: ['New address, new neighbour, same ridiculous postbox!', 'Your letters are my favourite sort of heavy.'], goro: ['Daifuku wants a walk. I want a nap. We compromised: a walk to the nap.', 'The tulips are doing well. So am I.'],
};
export async function alumniScene(g, season) {
  const A = ALU_SEASONS[season], Z = E(g);
  const crew = cast().filter((d) => g.hearts(d.id) >= 4).sort((a, b) => g.hearts(b.id) - g.hearts(a.id)).slice(0, 4).map((d) => d.id);
  const kids = enrolledKohai(g).filter((k) => g.hearts(k) >= 3).slice(0, 1);
  await runP(g, [fade(1, 0.6), bd(A.bd), fade(0, 0.6), N(`${A.name}. ${A.head}`), ...crew.map((id, i) => say(id, 'happy', (ALU[id] || ['It is so good to see you.'])[(g.day + i) % (ALU[id] || [1, 2]).length])), ...kids.map((k) => say(k, 'happy', SPEC[k].l.d[0].replace(/^[a-z]+\|/, '')))]);
  const i = await ask(g, 'What do you do?', A.act);
  for (const id of crew) g.addFriend(id, 8 + i * 2);
  g.addMood(12 + i * 2); g.addMoney(100 + 50 * i, true);
  const key = `${season}_${yr(g)}`; Z.alumni[key] = { choice: i, day: g.day };
  g.stat('alumniEvents'); g.bus.emit('svAlumni', { season });
  await runP(g, [N(['A perfect, ordinary afternoon.', 'Somebody laughs so hard that the others start too.', 'A photo is taken that no one will look at for ten years, and then everyone will.'][i]), say(crew[0] || 'misa', 'happy', 'Same time next season?'), say('misa', 'happy', 'Always.'), fade(1, 0.4), bd(null), fade(0, 0.5)]);
}
for (const season of Object.keys(ALU_SEASONS)) defEvent({ key: (g) => (alum(g) && g.day > GRAD_DAY && seasonOf(g.day) === season && dateOf(g.day) >= ALU_SEASONS[season].day && dateOf(g.day) <= ALU_SEASONS[season].day + 3 && g.minutes >= 16 * 60 && g.minutes < 21 * 60 ? `alumni_${season}_${yr(g)}` : null), run: (g) => alumniScene(g, season) });

// ---------------------------------------------------------------- Hall of Fame app
const HTABS = ['HALL', 'GOALS', 'LEGACY'];
register('phoneApp', 'sv3y_hall', {
  name: 'Hall of Fame', icon: 'i_trophy', order: 38, when: (g) => !!(g.state.sv3y && g.state.sv3y.graduated),
  open(game, app) { app.state.tab ??= 0; app.state.sel = 0; app.state.confirm = 0; },
  update(dt, input, game, app) {
    const s = app.state, k = input.pressed;
    if (k.has('c') || k.has('arrowright')) { s.tab = (s.tab + 1) % HTABS.length; s.confirm = 0; game.sfx('blip'); }
    if (k.has('arrowleft')) { s.tab = (s.tab + HTABS.length - 1) % HTABS.length; s.confirm = 0; game.sfx('blip'); }
    if (input.justDown) HTABS.forEach((_, i) => { if (inside(input.mx, input.my, app.area.x + i * 58, app.area.y, 56, 14)) s.tab = i; });
    if (s.tab === 1) {
      const list = goalsFor(Math.max(4, yr(game)));
      if (k.has('arrowdown')) s.sel = (s.sel + 1) % list.length; if (k.has('arrowup')) s.sel = (s.sel + list.length - 1) % list.length;
      if (k.has('enter') || k.has(' ')) claim(game, list[s.sel % list.length]);
    }
    if (s.tab === 2 && (k.has('n') || (input.justDown && inside(input.mx, input.my, app.area.x, app.area.y + 150, app.area.w, 18)))) {
      if (s.confirm && game.clock - s.confirm < 6) { s.confirm = 0; newGamePlus(game, true); } else { s.confirm = game.clock; game.toast('Press N again to begin New Game+', 'i_star'); }
    }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, s = app.state, Z = Y(game), C = E(game).cafe, l = loadLegacy();
    HTABS.forEach((t, i) => { rect(g, UI.ink, x + i * 58, y, 56, 14); rect(g, i === s.tab ? UI.gold : UI.paper2, x + i * 58 + 1, y + 1, 54, 12); drawTextC(g, t, x + i * 58 + 28, y + 4, UI.ink, 1, null); });
    const T = (t, yy, c = UI.ink, xx = 4) => drawText(g, t, x + xx, y + yy, c, 1, null);
    if (s.tab === 0) {
      T((Z.grad ? Z.grad.title : 'UNKNOWN').toUpperCase(), 22, UI.accent2);
      T(`Graduated day ${Z.grad ? Z.grad.day : '?'}   Memory score ${Z.grad ? Z.grad.score : 0}`, 34);
      T(`Cafe Kumo: ${CAFE_STAGES[C.stage].name}, rating ${C.rating}, ${C.served} served`, 52);
      T(`Wren's Clocks: ${E(game).clock.owned ? 'owned, ' + E(game).clock.orders + ' repairs' : 'not yet'}`, 64);
      T(`Lantern Foundation: ${E(game).fund.total} given, tier ${E(game).fund.tier}/4`, 76);
      T(`Alumni gatherings: ${Object.keys(E(game).alumni).length}`, 88);
      T(`Kohai letters kept: ${Z.letters.filter((q) => String(q.from).startsWith('kh_')).length}`, 100);
      T(actsEnding(game) ? `Story ending: ${String(actsEnding(game)).replace(/_/g, ' ')}` : `Story acts finished: ${actsDone(game)}/2`, 112, UI.dim);
      Z.hof.slice(0, 2).forEach((h, i) => T(`#${i + 1} ${h.title}: ${h.score}`, 130 + i * 11, UI.dim));
    } else if (s.tab === 1) {
      const list = goalsFor(Math.max(4, yr(game)));
      T(`EPILOGUE YEAR ${Math.max(1, yr(game) - 3)} GOALS (ENTER)`, 20, UI.accent2);
      list.forEach((gl, i) => { const yy = 34 + i * 20, v = Math.min(gl.need, gl.fn(game)), done = !!Z.goalsClaimed[gl.id], rd = v >= gl.need; rect(g, i === s.sel ? UI.gold : UI.paper2, x, y + yy, w, 19); T(gl.text.toUpperCase(), yy + 2, UI.ink, 4); bar(g, x + 150, y + yy + 4, 90, 8, gl.need ? v / gl.need : 1, rd ? UI.good : UI.accent); T(done ? 'CLAIMED' : rd ? 'CLAIM!' : `${v}/${gl.need}`, yy + 5, done ? UI.dim : rd ? UI.good : UI.ink, 246); });
    } else {
      const b = legacyBonus({ runs: l.runs + 1, pts: l.pts + legacyPoints(game) });
      T(`LEGACY: ${l.runs} RUN${l.runs === 1 ? '' : 'S'}   ${l.pts} POINTS`, 22, UI.accent2);
      T(`This run is worth ${legacyPoints(game)} legacy points.`, 36);
      T('NEW GAME+ GIVES:', 54, UI.accent2);
      T(`+${b.money} starting coins, +${b.bag} bag slots, +${b.xp} XP in study, cooking, fishing and gardening`, 66);
      T(`Core friends start with extra hearts, 10% of your fish, harvests, dishes and requests carry over`, 78);
      rect(g, UI.ink, x, y + 150, w, 18); rect(g, s.confirm && game.clock - s.confirm < 6 ? UI.bad : UI.gold, x + 1, y + 151, w - 2, 16);
      drawTextC(g, s.confirm && game.clock - s.confirm < 6 ? 'PRESS N AGAIN TO RESTART WITH YOUR LEGACY' : 'N: BEGIN NEW GAME+ (YOUR SAVE IS REPLACED)', x + w / 2, y + 156, UI.ink, 1, null);
    }
  },
});

// ---------------------------------------------------------------- achievements
const ach = (id, name, desc, cond, icon = 'i_trophy', extra = {}) => register('achievement', id, { name, desc, cond, icon, ...extra });
ach('sv3y_y2', 'Second year', 'Start your second school year.', 'grade>=2', 'i_school');
ach('sv3y_y3', 'Senior year', 'Start your final school year.', 'grade>=3', 'i_school');
ach('sv3y_kohai', 'Senpai of the bay', 'Have all nine kohai enrol.', 'stat:kohaiEnrolled>=9', 'heart');
ach('sv3y_trip', 'Pilgrim bell', 'Go on the Year 2 school trip.', 'flag:school_trip_done', 'i_star');
ach('sv3y_captain', 'Captain Misa', 'Become a club captain.', 'stat:clubRoles>=2', 'i_trophy');
ach('sv3y_grad', 'Class of the Star Lantern', 'Graduate from Hoshimori High.', 'flag:sv3y_graduated', 'i_star', { title: 'Graduate' });
ach('sv3y_cafe', 'Kumo and Aoki', 'Become a co-owner of Cafe Kumo.', 'flag:sv3y_cafe_coowner', 'i_coin');
ach('sv3y_clock', 'Keeper of time', 'Buy Wren\'s Clocks.', 'flag:sv3y_clock_owner', 'i_coin');
ach('sv3y_fund', 'A lantern for everyone', 'Complete all Foundation projects.', 'flag:sv3y_fund_t4', 'i_star', { title: 'Founder' });
ach('sv3y_ng', 'Another lap', 'Begin New Game+.', 'flag:legacy_run', 'i_star');

features('Years & Graduation', [
  'Epilogue Life begins after the credits, with letters from Mum, Mika and Tobias and three long-term goals',
  'Goal 1: co-own Cafe Kumo with Mika through five stages, with a daily special, staff, a rating and a weekly ledger',
  'Cafe Kumo takings are paid every morning: customers depend on rating, staff, weekends and weather, and the special sells your own cooking',
  'Goal 2: buy Wren\'s Clocks from Tobias for 40000 coins, then earn a daily wage and repair clocks at the counter',
  'Goal 3: found the Hoshimori Lantern Foundation by donating at the fountain; four tiers unlock lane lanterns, boardwalk lights, a concert stage and a beacon',
  'Seasonal Alumni gatherings with the cast: Hanami Reunion, Beach Day, Homecoming and the Year-End Gathering',
  'Hall of Fame phone app: your ending, graduation score, epilogue records and epilogue-year goals',
  'New Game+ Legacy: restart with starting coins, bag slots, skill XP, head-start hearts and a fraction of your stats, stored outside the save',
  'Ten new achievements for school years, kohai, the trip, graduation and the epilogue goals',
]);
void bd; void wait; void giveOr; void isAlum; void avg; void topFriends; void dateText;
