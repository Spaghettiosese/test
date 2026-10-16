// Special Orders: multi-day jobs from townsfolk with real goals, deadlines and rewards.
// Posted weekly on a second board next to the town noticeboard and at Pip's post office sorting table; tracked in the Orders
// phone app and a line under the objective tracker. Goal types: have {items} (handed in), stat {k,n} (progress since accepted),
// ev {ev,match,n} (counted from bus events: cooked, fishCaught, bugCaught, harvested, shellFound, mineralFound).
import { register, get, all, features } from '../../core/registry.js';
import { spr, RAMPS as K } from '../town/lib.js';
import { spotPos } from '../../systems/festivals.js';
import { UI, rect, panel, drawText, drawTextC, wrap, inside } from '../../ui/ui.js';
import { weekOf } from '../economy/core.js';
import { S, say, N, call, pick, has, nameOf, giveOr, stickers } from './state.js';

const fishPool = () => all('item').filter((i) => i.cat === 'fish' && i.price <= 260 && i.price >= 30).map((i) => i.id);
const cropPool = () => all('item').filter((i) => i.cat === 'crop' && i.price <= 140).map((i) => i.id);
const nm = (id) => (get('item', id) || { name: id }).name;
// T: id, who, title, text, mk(r) -> goal, days, reward
const T = (id, who, title, text, mk, days, reward) => ({ id, who, title, text, mk, days, reward });
export const TEMPLATES = [
  T('mika_cater', 'mika', 'Catering for Cafe Kumo', 'A bus tour booked at the last minute! Could you cook 5 onigiri for the trays? You can use my kitchen or yours.', () => ({ t: 'ev', ev: 'cooked', match: { item: 'dish_onigiri' }, n: 5, label: 'onigiri cooked' }), 6, { coins: 450, stickers: 2, friend: 50, item: 'dish_kumo_star_parfait' }),
  T('mika_eggs', 'mika', 'Egg and milk run', 'The delivery truck broke down. I need 6 eggs and 4 milk for tomorrow\'s pancakes. Please!', () => ({ t: 'have', items: { ing_egg: 6, ing_milk: 4 } }), 4, { coins: 300, stickers: 1, friend: 35 }),
  T('jun_fish', 'jun', 'The one that got away', 'There is a {fish} out there with my name on it. Catch one and I will stop telling that story. Probably.', (r) => { const f = pick(r, fishPool()); return { t: 'ev', ev: 'fishCaught', match: { item: f }, n: 1, label: nm(f) + ' caught', fish: f }; }, 7, { coins: 400, stickers: 2, friend: 45, item: 'gift_lucky_lure' }),
  T('jun_shell', 'jun', 'Shells for the shop window', 'Tourists love a bowl of pretty shells. Fetch me 5 from the beach and I will pay handsomely.', () => ({ t: 'stat', k: 'shellsFound', n: 5, label: 'shells found' }), 6, { coins: 280, friend: 30 }),
  T('kiko_mush', 'kiko', 'Mushrooms for the offering', 'The forest path is full of mushrooms right now. Could you gather 10 for the shrine feast?', () => ({ t: 'have', items: { ing_mushroom: 10 } }), 8, { coins: 350, stickers: 2, friend: 45, item: 'furn_lantern_paper' }),
  T('tobias_clock', 'tobias', 'A clock for Mrs. Ito', 'Her mantel clock has stopped for good. I need a brass gear, clock parts and a mainspring to build her a repaired one. Bring them and I shall do the rest.', () => ({ t: 'have', items: { mat_brass_gear: 1, mat_clock_parts: 1, mat_spring: 1 } }), 9, { coins: 700, stickers: 3, friend: 60, item: 'gift_watch_chain' }),
  T('pip_steps', 'pip', 'Parcel round helper', 'My feet are filing a complaint. Walk 3000 steps around town while I rest, and I will tell everyone you are marvellous.', () => ({ t: 'stat', k: 'steps', n: 3000, label: 'steps walked' }), 5, { coins: 200, friend: 30 }),
  T('sachiko_crop', 'sachiko', 'Fresh for the shelves', 'My supplier fell through. Bring me 6 {crop} and the shop stays full this week.', (r) => { const c = pick(r, cropPool()); return { t: 'have', items: { [c]: 6 } }; }, 7, { coins: 380, stickers: 1, friend: 40 }),
  T('hina_bugs', 'hina', 'Bug census', 'The nature club is counting insects for the school report. Catch 4 bugs and bring the tally to me.', () => ({ t: 'ev', ev: 'bugCaught', match: {}, n: 4, label: 'bugs caught' }), 6, { coins: 260, friend: 40, item: 'mat_rainbow_wool' }),
  T('goro_harvest', 'goro', 'Help with the harvest', 'My back says no, my garden says yes. Harvest 8 crops for me and I will teach you a secret about tomatoes.', () => ({ t: 'ev', ev: 'harvested', match: {}, n: 8, label: 'crops harvested' }), 8, { coins: 320, stickers: 1, friend: 40 }),
  T('suzu_books', 'suzu', 'Book club homework', 'Read two books this week so we can argue about them. It is called a book club. Arguing is the point.', () => ({ t: 'stat', k: 'booksRead', n: 2, label: 'books read' }), 7, { coins: 240, stickers: 1, friend: 40 }),
  T('rina_study', 'rina', 'Study-off', 'I have done five study sessions this week. Try to match three. I dare you.', () => ({ t: 'stat', k: 'studySessions', n: 3, label: 'study sessions' }), 6, { coins: 300, stickers: 1, friend: 35 }),
  T('hana_cook', 'hana', 'Grandma\'s kitchen', 'I forgot your name again, but not the recipes. Cook three dishes for me and I will tell you which one is the best. Maybe.', () => ({ t: 'ev', ev: 'cooked', match: {}, n: 3, label: 'dishes cooked' }), 6, { coins: 330, stickers: 2, friend: 55, item: 'dish_starlight_mochi' }),
  T('ogawa_water', 'ogawa', 'Greenhouse duty', 'Water the plants 15 times this week and the greenhouse will love you. So will I. Respect.', () => ({ t: 'stat', k: 'watered', n: 15, label: 'plants watered' }), 7, { coins: 270, friend: 35 }),
  T('kai_run', 'kai', 'Run with me', 'Training camp! Walk or run 5000 steps with me. Okay, near me. Okay, anywhere.', () => ({ t: 'stat', k: 'steps', n: 5000, label: 'steps walked' }), 6, { coins: 320, stickers: 1, friend: 40, item: 'gift_sports_towel' }),
  T('fujita_sky', 'fujita', 'Sky report homework', 'Watch two Sky Reports on TV and tell me the constellation of the week. Astronomy club credit!', () => ({ t: 'stat', k: 'skyReports', n: 2, label: 'sky reports watched' }), 8, { coins: 250, stickers: 1, friend: 35 }),
  T('theo_postcards', 'theo', 'Paper and ink', 'I need 5 pieces of paper for a sketch series. Do not ask why 5. It just feels right.', () => ({ t: 'have', items: { mat_paper: 5 } }), 7, { coins: 220, friend: 40, item: 'gift_star_sketch' }),
];
const byId = (id) => TEMPLATES.find((t) => t.id === id);

function build(g, tpl, r) {
  const goal = tpl.mk(r);
  if (goal.t === 'have') { for (const id of Object.keys(goal.items)) if (!has(id)) return null; }
  if (goal.t === 'ev' && goal.match.item && !has(goal.match.item)) return null;
  const o = S(g).orders;
  const text = tpl.text.replace('{fish}', goal.fish ? nm(goal.fish).toLowerCase() : '').replace('{crop}', goal.t === 'have' ? nm(Object.keys(goal.items)[0]).toLowerCase() : '');
  return { id: o.seq++, tpl: tpl.id, who: tpl.who, title: tpl.title, text, goal, days: tpl.days, reward: { ...tpl.reward, item: tpl.reward.item && has(tpl.reward.item) ? tpl.reward.item : null } };
}
export function refreshOrders(g) {
  const o = S(g).orders, wk = weekOf(g.day);
  if (o.week === wk) return;
  o.week = wk; o.offers = [];
  const r = g.rngFor('svl_orders', wk * 7 + 1), pool = TEMPLATES.filter((t) => !o.active.some((a) => a.tpl === t.id));
  for (let i = 0; i < 80 && o.offers.length < 4 && pool.length; i++) {
    const t = pick(r, pool); if (o.offers.some((x) => x.tpl === t.id)) continue;
    const ofr = build(g, t, r); if (ofr) o.offers.push(ofr);
  }
}
export const activeOrders = (g) => S(g).orders.active;
export function progress(g, a) {
  const q = a.goal;
  if (q.t === 'have') { let have = 0, need = 0; for (const [id, n] of Object.entries(q.items)) { have += Math.min(n, g.count(id)); need += n; } return { have, need }; }
  if (q.t === 'stat') return { have: Math.min(q.n, Math.max(0, (g.state.stats[q.k] || 0) - a.base)), need: q.n };
  return { have: Math.min(q.n, a.prog || 0), need: q.n };
}
export const ready = (g, a) => { const p = progress(g, a); return p.have >= p.need; };
export function accept(g, ofr) {
  const o = S(g).orders;
  if (o.active.length >= 3) return 'You already have 3 special orders. Finish one first!';
  o.offers = o.offers.filter((x) => x.id !== ofr.id);
  o.active.push({ ...ofr, start: g.day, due: g.day + ofr.days, base: ofr.goal.t === 'stat' ? (g.state.stats[ofr.goal.k] || 0) : 0, prog: 0 });
  g.sfx('select'); g.stat('svOrdersTaken'); return `Accepted! ${nameOf(ofr.who)} is counting on you. ${ofr.days} days.`;
}
export function claim(g, a) {
  const o = S(g).orders;
  if (!ready(g, a)) return 'Not finished yet.';
  if (a.goal.t === 'have') for (const [id, n] of Object.entries(a.goal.items)) g.take(id, n);
  o.active = o.active.filter((x) => x.id !== a.id); o.done[a.tpl] = (o.done[a.tpl] || 0) + 1; o.doneCount++;
  const R = a.reward;
  g.addMoney(R.coins); if (R.friend && get('npc', a.who)) g.addFriend(a.who, R.friend); if (R.stickers) stickers(g, R.stickers, 'special order');
  if (R.item) g.give(R.item, 1);
  g.addXP('charm', 8); g.stat('svOrdersDone'); g.sfx('chime'); g.bus.emit('svOrderDone', { id: a.tpl, who: a.who });
  return `Order complete! +${R.coins} coins${R.item ? ', ' + nm(R.item) : ''}.`;
}
export function dropOrder(g, a) { const o = S(g).orders; o.active = o.active.filter((x) => x.id !== a.id); g.sfx('back'); return 'Order dropped.'; }
const goalText = (a) => { const q = a.goal; return q.t === 'have' ? Object.entries(q.items).map(([id, n]) => `${n} ${nm(id)}`).join(', ') : `${q.n} ${q.label || ''}`; };
const rewardText = (R) => `${R.coins}c${R.stickers ? ` + ${R.stickers} stickers` : ''}${R.item ? ' + ' + nm(R.item) : ''}`;

// ---------------------------------------------------------------- shared panel (phone app + board scene)
function rows(g, st) { return st.tab ? S(g).orders.active : S(g).orders.offers; }
export function panelUpdate(dt, input, g, st, area) {
  const k = input.pressed, list = rows(g, st), { x, y } = area;
  st.sel = Math.max(0, Math.min(st.sel | 0, Math.max(0, list.length - 1)));
  if (k.has('c') || (input.justDown && inside(input.mx, input.my, x, y, 130, 14))) { st.tab = 1 - (st.tab | 0); st.sel = 0; st.msg = ''; g.sfx('blip'); return; }
  if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + 1);
  if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
  if (input.justDown) { const i = Math.floor((input.my - y - 17) / 26); if (input.mx < x + 130 && i >= 0 && i < list.length) st.sel = i; }
  const cur = list[st.sel]; if (!cur) return;
  const bx = x + 140, by = y + area.h - 18;
  const act = k.has('enter') || k.has('1') || (input.justDown && inside(input.mx, input.my, bx, by, 70, 15));
  const drop = st.tab && (k.has('2') || k.has('x') || (input.justDown && inside(input.mx, input.my, bx + 76, by, 66, 15)));
  if (act) st.msg = st.tab ? (ready(g, cur) ? claim(g, cur) : 'Keep going! Not done yet.') : accept(g, cur);
  if (drop) st.msg = dropOrder(g, cur);
}
export function panelDraw(g, game, st, area) {
  const { x, y, w, h } = area, list = rows(game, st);
  rect(g, UI.accent, x, y, 130, 14); drawTextC(g, st.tab ? 'ACTIVE ORDERS (C)' : 'ON THE BOARD (C)', x + 65, y + 4, UI.text, 1, null);
  list.forEach((a, i) => {
    const yy = y + 17 + i * 26, on = i === st.sel;
    rect(g, on ? UI.gold : '#e8d9b8', x, yy, 130, 24); rect(g, UI.ink, x, yy + 23, 130, 1);
    drawText(g, nameOf(a.who), x + 3, yy + 3, UI.accent2, 1, null);
    drawText(g, a.title.slice(0, 26), x + 3, yy + 12, UI.ink, 1, null);
    if (st.tab) { const p = progress(game, a), left = a.due - game.day; drawText(g, `${p.have}/${p.need}`, x + 100, yy + 3, ready(game, a) ? UI.good : UI.dim, 1, null); drawText(g, `${Math.max(0, left)}D`, x + 112, yy + 12, left <= 1 ? UI.bad : UI.dim, 1, null); }
  });
  if (!list.length) drawText(g, st.tab ? 'NO ACTIVE ORDERS' : 'NO NEW ORDERS THIS WEEK', x + 4, y + 22, UI.dim, 1, null);
  panel(g, x + 134, y, w - 134, h, 'paper');
  const a = list[st.sel];
  if (a) {
    drawText(g, a.title.slice(0, 32), x + 140, y + 6, UI.accent2, 1, null);
    drawText(g, `FROM: ${nameOf(a.who).toUpperCase()}`, x + 140, y + 15, UI.dim, 1, null);
    wrap(a.text, 36).slice(0, 7).forEach((l, i) => drawText(g, l, x + 140, y + 26 + i * 8, UI.ink, 1, null));
    drawText(g, 'GOAL: ' + goalText(a), x + 140, y + 86, UI.ink, 1, null);
    drawText(g, 'REWARD: ' + rewardText(a.reward), x + 140, y + 95, UI.good, 1, null);
    drawText(g, `${a.days} DAYS TO FINISH`, x + 140, y + 104, UI.dim, 1, null);
    if (st.tab) { const p = progress(game, a); rect(g, UI.ink, x + 140, y + 114, 140, 7); rect(g, '#d9c9a8', x + 141, y + 115, 138, 5); rect(g, ready(game, a) ? UI.good : UI.accent, x + 141, y + 115, Math.round(138 * p.have / Math.max(1, p.need)), 5); }
    const by = y + h - 18;
    rect(g, UI.ink, x + 140, by, 70, 15); rect(g, st.tab && !ready(game, a) ? '#c9bda8' : UI.mint, x + 141, by + 1, 68, 13); drawTextC(g, st.tab ? '1 HAND IN' : '1 ACCEPT', x + 175, by + 4, UI.ink, 1, null);
    if (st.tab) { rect(g, UI.ink, x + 216, by, 66, 15); rect(g, '#f0b8b8', x + 217, by + 1, 64, 13); drawTextC(g, '2 DROP', x + 249, by + 4, UI.ink, 1, null); }
  }
  if (st.msg) wrap(st.msg, 36).slice(0, 2).forEach((l, i) => drawText(g, l, x + 140, y + h - 40 + i * 8, UI.accent2, 1, null));
}
class OrdersScene {
  constructor(game, where, onDone) { refreshOrders(game); Object.assign(this, { name: 'sv_orders', opaque: true, game, onDone, st: { tab: 0, sel: 0, msg: '' }, where, t: 0 }); this.area = { x: 14, y: 30, w: 292, h: 172 }; }
  update(dt, input, game) { this.t += dt; if (input.pressed.has('escape') || input.pressed.has('q') || input.pressed.has('e') && this.t > 0.3 || (input.justDown && inside(input.mx, input.my, 270, 2, 48, 16))) { game.sfx('back'); game.scenes.pop(this); this.onDone && this.onDone(); return; } panelUpdate(dt, input, game, this.st, this.area); }
  draw(g, game) {
    rect(g, '#2a3a2e', 0, 0, 320, 224); rect(g, '#3d5a44', 6, 22, 308, 194);
    for (let i = 0; i < 40; i++) rect(g, i % 2 ? '#476650' : '#35503c', 8 + (i * 37) % 300, 24 + (i * 53) % 188, 2, 2);
    drawText(g, this.where === 'post' ? 'PIP\'S SPECIAL ORDERS' : 'SPECIAL ORDERS BOARD', 10, 8, UI.gold, 1, null); drawText(g, 'ESC: CLOSE', 258, 8, UI.text, 1, null);
    panelDraw(g, game, this.st, this.area);
  }
}
register('scene', 'sv_orders', { make: (game, where, onDone) => new OrdersScene(game, where, onDone) });
register('phoneApp', 'sv_orders', {
  name: 'Orders', icon: 'i_quest', order: 22,
  badge: (g) => S(g).orders.active.filter((a) => ready(g, a)).length,
  open(game, app) { refreshOrders(game); app.state.tab ??= S(game).orders.active.length ? 1 : 0; app.state.sel ??= 0; app.state.msg = ''; },
  update(dt, input, game, app) { panelUpdate(dt, input, game, app.state, app.area); },
  draw(g, game, app) { panelDraw(g, game, app.state, app.area); },
});

// ---------------------------------------------------------------- world: board sprite + providers + HUD
spr('svl_order_board', 44, 46, (R) => {
  R(4, 40, 4, 6, K.wood[1]); R(36, 40, 4, 6, K.wood[1]);
  R(0, 4, 44, 36, K.wood[2]); R(0, 4, 44, 2, K.wood[4]); R(0, 38, 44, 2, K.wood[0]);
  R(3, 8, 38, 28, K.forest[2]); R(3, 8, 38, 2, K.forest[3]);
  R(6, 12, 14, 10, K.paper[4]); R(8, 15, 10, 1, K.ink[3]); R(8, 18, 8, 1, K.ink[3]); R(7, 11, 2, 2, K.coral[3]);
  R(24, 14, 13, 11, K.butter[3]); R(26, 17, 9, 1, K.ink[3]); R(26, 20, 7, 1, K.ink[3]); R(29, 13, 2, 2, K.sky[3]);
  R(12, 26, 16, 8, K.paper[3]); R(14, 29, 12, 1, K.ink[3]); R(19, 25, 2, 2, K.coral[3]);
  R(16, 0, 12, 5, K.coral[2]); R(18, 1, 8, 1, K.paper[4]); R(20, 2, 4, 2, K.butter[4]);
});
const bpos = (w) => (w.map.id === 'town' ? spotPos('town', 'noticeboard', 2, 0) : null);
register('worldLayer', 'svl_order_board', {
  sprites(world) { const p = bpos(world); return p ? [{ y: p.y, draw: () => { world.shadow(p.x, p.y, 14); world.drawFeet('svl_order_board', p.x, p.y); } }] : []; },
});
const near = (world, mapId, spot, dx = 0, dy = 0, r = 26) => { if (world.map.id !== mapId) return null; const p = spotPos(mapId, spot, dx, dy), d = p ? Math.hypot(p.x - world.player.x, p.y - world.player.y) : 1e9; return d < r ? { p, d } : null; };
const openScene = (where) => (g) => new Promise((res) => { g.open('sv_orders', where, res); });
register('targetProvider', 'svl_orders', {
  find(world, game) {
    let n = near(world, 'town', 'noticeboard', 2, 0, 34);
    if (n) return { label: 'Special Orders board', dist: n.d + 2, x: n.p.x, y: n.p.y - 24, run: openScene('board') };
    n = near(world, 'post_office', 'sorting', 0, 0, 30);
    if (n) return { label: 'Ask Pip for special orders', dist: n.d + 4, x: n.p.x, y: n.p.y - 20, run: openScene('post') };
    return null;
  },
});
register('hud', 'svl_orders', {
  draw(g, game) {
    if (!game.world || game.hideHud || game.settings.tracker === false) return;
    const list = S(game).orders.active; if (!list.length) return;
    const a = list.slice().sort((p, q) => p.due - q.due)[0], p = progress(game, a), left = a.due - game.day;
    const t = `Order: ${a.title.slice(0, 24)} ${p.have}/${p.need} (${Math.max(0, left)}d)`;
    rect(g, '#2b1d2eb0', 2, 39, t.length * 5 + 14, 10); rect(g, ready(game, a) ? '#7fd49a' : '#ffd76a', 3, 41, 6, 6); drawText(g, t, 12, 42, ready(game, a) ? '#c8ffd6' : '#fff6c0', 1, null);
  },
});
register('system', 'svl_orders', {
  init(game) {
    refreshOrders(game);
    game.bus.on('dayStart', () => {
      refreshOrders(game);
      const o = S(game).orders;
      for (const a of o.active.filter((x) => game.day > x.due)) { o.active = o.active.filter((x) => x !== a); game.mail(`svl_expired_${a.id}`, nameOf(a.who), `Oh well, the order "${a.title}" ran out of time. No hard feelings! Maybe next week.`); }
      for (const a of o.active) if (ready(game, a) && !a.notified) { a.notified = 1; game.toast(`Order ready: ${a.title}`, 'i_quest'); }
    });
    const count = (ev) => (e) => { for (const a of S(game).orders.active) { const q = a.goal; if (q.t !== 'ev' || q.ev !== ev) continue; if (q.match.item && q.match.item !== (e || {}).item) continue; a.prog = (a.prog || 0) + ((ev === 'harvested' && e.n) || 1); if (a.prog >= q.n && !a.notified) { a.notified = 1; game.toast(`Order ready: ${a.title}`, 'i_quest'); } } };
    for (const ev of ['cooked', 'fishCaught', 'bugCaught', 'harvested']) game.bus.on(ev, count(ev));
  },
});
register('boardNote', 'svl_orders_note', { title: 'Special orders', text: 'A second board next to this one lists multi-day special orders from townsfolk. Pip keeps a copy at the post office. Check the Orders app!', color: K.forest[4] });

features('Town Life', [
  'Special Orders board beside the town noticeboard, with four fresh multi-day orders posted every week',
  'Pip keeps the same special orders at the post office sorting table',
  'Mika\'s catering order: cook five onigiri before the deadline for coins, Star Stickers and a parfait',
  'Captain Jun\'s order asks you to catch one specific fish, chosen differently each week',
  'Kiko needs ten mushrooms for the shrine feast, handed in at the board',
  'Tobias\'s clock order: bring a brass gear, clock parts and a mainspring so he can build a repaired clock',
  'Orders that track steps, books read, study sessions, plants watered, shells, bugs and harvests count progress from the day you accept',
  'Order rewards mix coins, Star Stickers, rare items and friendship with the person who asked',
  'Orders have deadlines, a mail arrives when one expires, and you can hold three at once',
  'Orders phone app lists active jobs with progress bars, hand-in and drop buttons, and a badge when one is ready',
  'A line under the objective tracker shows your most urgent special order and its progress',
]);
