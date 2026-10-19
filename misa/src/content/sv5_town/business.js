// Misa's own businesses (sv5): a Saturday market stall in the town square (and the Meadow farmers' market when it exists) with a customer
// simulation minigame, reputation tiers, stall upgrades and a daily profit ledger; later a Sunday pop-up cafe with a menu designed from
// known recipes and staff hired from the cast; the Business Ledger phone app. State: S(g).stall / S(g).cafe.
import { register, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { sellPrice } from '../economy/core.js';
import { S, mapPatch, prop, N, say, call, clamp } from './state.js';
import { listApp } from './ui.js';
import '../../minigames/sv5_town/stall.js';
import './art.js';

export const TIERS = [[0, 'Newcomer'], [15, 'Familiar Face'], [40, 'Local Favourite'], [80, 'Market Star'], [150, 'Bay Legend']];
export const tierOf = (rep) => TIERS.filter(([n]) => rep >= n).length - 1;
export const UP_COST = { awning: [300, 700], sign: [250, 600], till: [400, 900] };
export const UP_DESC = { awning: 'Awning: customers wait 4 seconds longer per level', sign: 'Signage: customers arrive faster', till: 'Till: +10% on every sale per level' };
export const PERMIT = 300, FEE = 40, CAFE_PERMIT = 1200, WAGE = 60;
export const JOB_LOVERS = ['kai', 'rina', 'aoi', 'haru', 'hina', 'theo', 'suzu', 'kiyo'];

async function chooseFrom(g, title, cands, max) {
  const chosen = [];
  while (chosen.length < max) {
    const rest = cands.filter((c) => !chosen.includes(c.key)).slice(0, 5); if (!rest.length) break;
    let pick = null;
    await g.run([{ t: 'choice', prompt: `${title} (${chosen.length}/${max})`, options: [...rest.map((c) => ({ text: c.label, steps: [{ t: 'call', fn: () => { pick = c.key; } }] })), { text: chosen.length ? 'Done' : 'Cancel', steps: [] }] }]);
    if (!pick) break; chosen.push(pick);
  }
  return chosen;
}
const bagGoods = (g) => Object.keys(g.state.inv).map((id) => ({ id, it: get('item', id), n: g.state.inv[id] })).filter((x) => x.it && !x.it.key && x.n > 0 && (x.it.price || 0) >= 10 && !x.it.noSell)
  .sort((a, b) => (b.it.price * Math.min(b.n, 8)) - (a.it.price * Math.min(a.n, 8)));
export const listPrice = (g, id, rep = 0) => Math.max(5, Math.round(sellPrice(g, id) * (1.35 + 0.03 * tierOf(rep)) / 5) * 5);

// ---------------------------------------------------------------- the Saturday stall
export const stallSprite = (g) => { const u = S(g).stall.ups; return `tp_stall_${u.awning > 0 ? 1 : 0}${u.sign > 0 ? 1 : 0}${u.till > 0 ? 1 : 0}`; };
export function logStall(g, kind, row) { const b = S(g)[kind]; b.log.unshift({ day: g.day, ...row }); if (b.log.length > 30) b.log.length = 30; }
export function settleStall(g, res, venue) {
  const st = S(g).stall, till = 1 + 0.1 * st.ups.till, revenue = Math.round(res.revenue * till);
  const gainRep = Math.max(0, res.happy + res.served * 0.5 - res.lost * 0.5);
  st.rep += gainRep; st.sales += res.served; st.earned += revenue; st.spent += FEE; st.sessions++; st.last = g.day; st.best = Math.max(st.best, revenue);
  g.addMoney(revenue - FEE, true); logStall(g, 'stall', { venue, revenue, fee: FEE, served: res.served, lost: res.lost, happy: res.happy });
  g.stat('stallSessions'); g.stat('stallSales', res.served); g.bus.emit('tpStall', { revenue, served: res.served, venue });
  return revenue;
}
export async function stallSession(g, venue) {
  const st = S(g).stall;
  if (st.last === g.day) return g.run([N('You already ran your stall today. The tablecloth needs a wash.')]);
  if (g.energy < 12) return g.run([N('You are too tired to haggle. Rest and try again.')]);
  const cands = bagGoods(g).map((x) => ({ key: x.id, label: `${x.it.name} x${x.n} (${listPrice(g, x.id, st.rep)}c)` }));
  if (!cands.length) return g.run([N('Your bag has nothing worth selling. Grow, fish or craft something first!')]);
  const ids = await chooseFrom(g, 'Display (first is featured)', cands, 4); if (!ids.length) return;
  const goods = ids.map((id) => { const qty = Math.min(g.count(id), 8); g.take(id, qty); return { id, qty, price: listPrice(g, id, st.rep) }; });
  let report = null;
  const r = await g.minigame('sv5_stall', { goods, tier: tierOf(st.rep), awning: st.ups.awning, sign: st.ups.sign, seed: g.day, featured: 0, onDone: (m) => { report = m; } });
  const m = report || { revenue: 0, served: 0, happy: 0, lost: 0, goods: goods.map((q) => ({ ...q })) };
  for (const q of m.goods) if (q.qty > 0) g.give(q.id, q.qty, true);
  g.useEnergy(12); g.advance(120); g.addXP('charm', 6);
  if (r && r.quit && !report) return;
  const rev = settleStall(g, m, venue);
  return g.run([N(`The stall is packed up. ${m.served} customers served, ${m.lost} walked away. Takings ${rev} coins, minus the ${FEE} coin fee.`), say('misa', 'happy', `Reputation: ${TIERS[tierOf(st.rep)][1]}.`)]);
}
register('interaction', 'tp_stall', { label: 'Your market stall', run: (g, o) => {
  const st = S(g).stall, venue = g.world && g.world.map && g.world.map.id === 'town' ? 'Hoshimori Square' : "Meadow farmers' market";
  if (!st.permit) return g.run([N(`A vacant stall with a number painted on it. A clerk's note: Rent a permanent market spot for ${PERMIT} coins.`), { t: 'choice', prompt: `Rent the stall? (${PERMIT} coins)`, options: [{ text: 'Rent it', when: `money>=${PERMIT}`, steps: [call((gg) => { gg.addMoney(-PERMIT, true); S(gg).stall.permit = gg.day; gg.setFlag('tp_stall_permit', true); gg.toast('Market stall rented!', 'heart'); }), say('misa', 'happy', 'My very own stall! I need a sign. And a cash box. And customers.')] }, { text: 'Not yet', steps: [] }] }]);
  return g.run([{ t: 'choice', prompt: `Your stall (${TIERS[tierOf(st.rep)][1]})`, options: [
    { text: 'Open for business', steps: [call(() => stallSession(g, venue))] }, { text: 'Upgrade the stall', steps: [call(() => upgradeMenu(g))] }, { text: 'Open the ledger', steps: [call(() => g.open('phone', 'tp_ledger'))] }, { text: 'Leave', steps: [] }] }]);
} });
async function upgradeMenu(g) {
  const ups = S(g).stall.ups; const opts = Object.keys(UP_COST).filter((k) => ups[k] < 2).map((k) => ({ k, cost: UP_COST[k][ups[k]] }));
  if (!opts.length) return g.run([N('The stall is fully upgraded. It looks like a tiny shop.')]);
  return g.run([{ t: 'choice', prompt: 'Upgrade', options: [...opts.map((o) => ({ text: `${UP_DESC[o.k].split(':')[0]} (${o.cost}c)`, when: `money>=${o.cost}`, steps: [call((gg) => { gg.addMoney(-o.cost, true); S(gg).stall.ups[o.k]++; gg.toast(`Stall upgrade: ${o.k}`, 'heart'); })] })), { text: 'Back', steps: [] }] }]);
}
mapPatch('town', { objects: [{ ...prop('tp_stall_000', 16, 20, { w: 2, shadow: 22, use: 'tp_stall', when: 'day:sat&time<17:00' }), sprFn: stallSprite }] });
let meadowDone = false;
export function patchMeadow() {
  if (meadowDone) return true; const m = get('map', 'meadow_market'); if (!m) return false;
  meadowDone = true; mapPatch('meadow_market', { objects: [{ ...prop('tp_stall_000', 30, 9, { w: 2, shadow: 22, use: 'tp_stall', when: 'weekend&time<17:00' }), sprFn: stallSprite }] }); return true;
}
patchMeadow();

// ---------------------------------------------------------------- the pop-up cafe
export const knownRecipes = (g) => all('recipe').filter((r) => r && r.out && get('item', r.out) && (g.knowsRecipe ? g.knowsRecipe(r.id) : r.learned) && Object.keys(r.ingredients).every((k) => !k.startsWith('tag:')));
export const portionsOf = (g, r) => Math.min(6, Math.min(...Object.entries(r.ingredients).map(([k, n]) => Math.floor(g.count(k) / n))));
export async function cafeSession(g) {
  const c = S(g).cafe;
  if (c.last === g.day) return g.run([N('The cafe cart is clean and closed. One service a day!')]);
  if (g.energy < 15) return g.run([N('You need a little more energy before running a cafe.')]);
  const cands = knownRecipes(g).map((r) => ({ key: r.id, r, p: portionsOf(g, r) })).filter((x) => x.p > 0).map((x) => ({ key: x.key, label: `${get('item', x.r.out).name} (${x.p} portions)` }));
  if (!cands.length) return g.run([N('You have no ingredients for any recipe you know. Stock up at the mart first!')]);
  const ids = await chooseFrom(g, 'Design the menu', cands, 4); if (!ids.length) return;
  c.menu = ids;
  const goods = ids.map((id) => { const r = get('recipe', id), p = portionsOf(g, r); for (const [k, n] of Object.entries(r.ingredients)) g.take(k, n * p); return { id: r.out, qty: p, price: Math.max(20, Math.round(sellPrice(g, r.out) * 1.7 / 5) * 5) }; });
  const staff = c.staff.filter((s) => get('npc', s)), tier = tierOf(c.rep + S(g).stall.rep / 2);
  let report = null;
  const r = await g.minigame('sv5_cafe', { goods, tier: tier + staff.length, awning: staff.length, sign: S(g).stall.ups.sign, seed: g.day, onDone: (m) => { report = m; } });
  const m = report || { revenue: 0, served: 0, happy: 0, lost: 0, goods };
  for (const q of m.goods) if (q.qty > 0) g.give(q.id, q.qty, true);
  const wages = WAGE * staff.length; g.useEnergy(15); g.advance(150); g.addXP('cooking', 8);
  if (r && r.quit && !report) return;
  const rev = Math.round(m.revenue * (1 + 0.1 * S(g).stall.ups.till));
  c.sessions++; c.earned += rev; c.rep += Math.max(0, m.happy + m.served * 0.5 - m.lost * 0.5); c.last = g.day; g.addMoney(rev - wages, true);
  for (const s of staff) g.addFriend(s, 4);
  logStall(g, 'cafe', { revenue: rev, fee: wages, served: m.served, lost: m.lost, happy: m.happy }); g.stat('cafeSessions'); g.bus.emit('tpCafe', { revenue: rev });
  return g.run([N(`Service done. ${m.served} guests, ${rev} coins, ${wages} in staff wages. Cafe reputation: ${TIERS[clamp(tierOf(c.rep), 0, 4)][1]}.`)]);
}
async function hireMenu(g) {
  const c = S(g).cafe, cands = JOB_LOVERS.filter((id) => get('npc', id) && g.hearts(id) >= 2 && !c.staff.includes(id)).map((id) => ({ key: id, label: `${get('npc', id).name} (${WAGE}c/day)` }));
  const opts = [];
  if (c.staff.length < 2) for (const x of cands.slice(0, 3)) opts.push({ text: `Hire ${x.label}`, steps: [call((gg) => { c.staff.push(x.key); gg.addFriend(x.key, 5); gg.toast(`${get('npc', x.key).name} joins the cafe crew`, 'heart'); })] });
  for (const s of c.staff) opts.push({ text: `Let ${get('npc', s) ? get('npc', s).name : s} go (kindly)`, steps: [call(() => { c.staff = c.staff.filter((q) => q !== s); })] });
  if (!opts.length) return g.run([N(c.staff.length >= 2 ? 'The crew is full: two helpers is all the cart can fit.' : 'No friend with 2 hearts is looking for cafe work yet.')]);
  return g.run([{ t: 'choice', prompt: `Cafe crew (${c.staff.length}/2)`, options: [...opts, { text: 'Back', steps: [] }] }]);
}
register('interaction', 'tp_cafe_cart', { label: 'Your pop-up cafe', run: (g) => {
  const c = S(g).cafe;
  if (!c.open) {
    const ok = tierOf(S(g).stall.rep) >= 2 && g.skillLevel('cooking') >= 3;
    return g.run([N(`A cart permit form: Pop-up cafe, ${CAFE_PERMIT} coins. Requires: stall reputation Local Favourite and Cooking level 3. ${ok ? 'You qualify.' : 'You do not qualify yet.'}`), { t: 'choice', prompt: 'Buy the permit?', options: [{ text: 'Open a cafe', when: `money>=${CAFE_PERMIT}`, steps: [call((gg) => { if (!ok) return gg.toast('Not qualified yet'); gg.addMoney(-CAFE_PERMIT, true); c.open = gg.day; gg.setFlag('tp_cafe_open', true); gg.toast('Pop-up cafe permit granted!', 'heart'); })] }, { text: 'Later', steps: [] }] }]);
  }
  return g.run([{ t: 'choice', prompt: 'Pop-up cafe', options: [{ text: 'Open the cafe', steps: [call(() => cafeSession(g))] }, { text: 'Cafe crew', steps: [call(() => hireMenu(g))] }, { text: 'Business ledger', steps: [call(() => g.open('phone', 'tp_ledger'))] }, { text: 'Leave', steps: [] }] }]);
} });
mapPatch('town', { objects: [prop('tp_stall_111', 34, 21, { w: 2, shadow: 22, use: 'tp_cafe_cart', when: 'day:sun&time<18:00' })] });

// ---------------------------------------------------------------- the Business Ledger app
const rows = (b, n = 6) => b.log.slice(0, n).map((e) => `D${e.day}: +${e.revenue} -${e.fee}  served ${e.served}`);
listApp('tp_ledger', { name: 'Business', icon: itemIcon('paper', { c: Rr.butter[2] }), order: 35, pages: [
  { name: 'Stall', build(g) { const s = S(g).stall, t = tierOf(s.rep); return { lines: [{ t: 'Market stall ledger', c: Rr.coral[1] }, s.permit ? `Reputation: ${TIERS[t][1]} (${Math.floor(s.rep)} pts${TIERS[t + 1] ? `, next at ${TIERS[t + 1][0]}` : ''})` : 'No stall permit yet (rent one at the Saturday market).', `Sessions ${s.sessions}, customers served ${s.sales}`, `Takings ${s.earned}c, fees ${s.spent}c, profit ${s.earned - s.spent}c`, `Best day ${s.best}c`, `Upgrades: awning ${s.ups.awning}, sign ${s.ups.sign}, till ${s.ups.till}`, '', ...rows(s)],
    bars: [{ label: 'Reputation', v: s.rep - TIERS[t][0], max: TIERS[t + 1] ? TIERS[t + 1][0] - TIERS[t][0] : 1, c: Rr.butter[2] }], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
  { name: 'Cafe', build(g) { const c = S(g).cafe; return { lines: [{ t: 'Pop-up cafe ledger', c: Rr.coral[1] }, c.open ? `Open since day ${c.open}` : 'The cafe permit is unlocked at stall reputation Local Favourite and Cooking 3.', `Services ${c.sessions}, takings ${c.earned}c`, `Crew: ${c.staff.length ? c.staff.map((s) => (get('npc', s) || { name: s }).name).join(', ') : 'nobody yet'}`, `Menu: ${c.menu.length ? c.menu.map((r) => (get('item', (get('recipe', r) || {}).out) || { name: r }).name).join(', ') : 'not designed yet'}`, '', ...rows(c)], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
] });

features('Town Growth', [
  'Rent a permanent Saturday market stall in the town square (300 coins) and run it from the stall prop',
  "The same stall appears at the Meadow Hills farmers' market on weekends when that area exists",
  'Stall customer simulation: a queue of impatient customers asks for goods from a display you choose, with live patience bars',
  'Haggling at the stall: accept an offer, push for full price (may fail and annoy) or give a friendly 15% discount',
  'Display skills: choose up to four goods from your bag, the first one is featured and attracts more shoppers',
  'Stall reputation tiers from Newcomer to Bay Legend that raise prices and bring regular customers',
  'Stall upgrades: awning (more patience), signage (faster arrivals) and a till (+10% per level), shown on the stall sprite',
  'Daily profit ledger in the Business app: takings, fees, customers served and recent sessions',
  'Pop-up cafe cart on Sundays: unlock with stall reputation and Cooking level, then design a menu from recipes Misa knows',
  'Cafe crew: hire up to two friends who like jobs for a small daily wage, which makes customers more patient',
  'Business Ledger phone app with separate stall and cafe books and your running profit',
]);

features('Town Growth', [
  "Closing the stall early keeps the sales made so far and puts unsold goods back in the bag",
  "Stall fee of 40 coins per session is logged in the ledger beside takings, so profit is honest",
]);
