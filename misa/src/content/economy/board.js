// Economy area: the town request board (interaction 'noticeboard') and the Requests phone app.
// 3 requests a day plus one weekly big order, from townsfolk: deliver an item, catch a fish, bring a dish, grow a crop,
// or help at a shop for one shift. Rewards: coins, friendship, Charm XP and Star Stickers.
// Other areas can pin notes on the board: register('boardNote', id, { title, text, when?: Cond|fn, color?, run?(game) })
// (e.g. the story's paper-star riddle). The board also shows the weekly sale, Basho's Friday stall and the Saturday market.
import { register, get, all, features } from '../../core/registry.js';
import { dateText, WEEKDAYS } from '../../core/time.js';
import { Buttons } from '../../minigames/jobs/kit.js';
import { buyPrice, weeklySale, SALE_CATS, weekOf, pay, giveStickers } from './core.js';
import { JOBS } from './jobs.js';
import { rect, panel, btn, icon, drawText, drawTextC, measure, wrapPx, fit, header, C, RAMPS, K, starGlyph, coinGlyph, slot } from './gfx.js';

const FOLK = ['Mrs. Sato', 'Mr. Kimura', 'Old Sailor Ken', 'Poet Yae', 'Little Sota', 'Mrs. Knit', 'Mr. Shogi', 'Auntie Tama'];
const DELIVER = ['ing_egg', 'ing_milk', 'ing_flour', 'ing_tea', 'ing_honey', 'ing_bread', 'snack_melon_bread', 'snack_onigiri_salmon', 'snack_cookies', 'bev_green_tea', 'ing_carrot', 'ing_tomato', 'mat_paper', 'mat_string', 'gift_postcard', 'ing_red_bean', 'snack_rice_crackers', 'ing_apple', 'ing_strawberry', 'mat_yarn'];
const LINES = {
  deliver: ['I\'m all out of {item} and my knees won\'t make it to the shops. Could you bring me {n}?', 'Baking for my grandchildren! I need {n} {item}, please.', 'Would someone kindly bring {n} {item}? I\'ll make it worth your while.'],
  fish: ['I\'ve been craving {item} all week. Could you catch me one?', 'For my cat\'s birthday: one {item}, if you can find it!'],
  dish: ['I\'m feeling under the weather. A home-cooked {item} would mean the world.', 'Potluck tonight and I can\'t cook! Could you make a {item}?'],
  crop: ['My garden failed this year. Could you spare {n} {item}?', 'Looking for fresh {item} for a family recipe. {n}, please!'],
  shift: ['{place} is swamped this week! Could you help out for one shift?'],
  weekly: ['Big order for the community centre: {n} {item}. Many thanks from all of us!', 'The Sunny Pines kitchen needs {n} {item} for the weekend. Can you help?'],
};

const pick = (r, a) => a[Math.floor(r() * a.length)];
function requester(game, r) {
  const npcs = all('npc').filter((n) => !n.hidden && n.gifts);
  if (npcs.length && r() < 0.7) { const n = pick(r, npcs); return { who: n.id, whoName: n.name }; }
  return { who: null, whoName: pick(r, FOLK) };
}
const itemsWhere = (f) => all('item').filter(f);
function makeRequest(game, r, kind, weekly = false) {
  const R = requester(game, r), id = game.state.economy.requests.nextId++;
  let item = null, n = 1, coins = 0, job = null;
  if (kind === 'deliver') { item = pick(r, DELIVER.filter((x) => get('item', x))); n = weekly ? 4 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3); coins = Math.round((buyPrice(game, item) * n * 1.3 + 40) / 5) * 5; }
  if (kind === 'fish') { const pool = itemsWhere((it) => it.cat === 'fish' && it.price && it.price <= 300); if (!pool.length) return null; item = pick(r, pool).id; coins = get('item', item).price * 2 + 60; }
  if (kind === 'dish') { const pool = itemsWhere((it) => it.id.startsWith('dish_') && it.price); if (!pool.length) return null; item = pick(r, pool).id; coins = Math.round(get('item', item).price * 1.5) + 80; }
  if (kind === 'crop') { const pool = itemsWhere((it) => it.cat === 'crop' && it.price); if (!pool.length) return null; item = pick(r, pool).id; n = 1 + Math.floor(r() * 3); coins = get('item', item).price * n * 2 + 50; }
  if (kind === 'shift') { const ok = Object.keys(JOBS).filter((j) => JOBS[j].unlock(game)); job = pick(r, ok); coins = 150; }
  const it = item && get('item', item);
  const text = pick(r, LINES[weekly ? 'weekly' : kind]).replace('{item}', it ? it.name.toLowerCase() : '').replace('{n}', n).replace('{place}', job ? JOBS[job].name : '');
  if (weekly) coins = Math.max(coins, 300);
  return { id, kind, ...R, item, n, job, text, weekly, day: game.day, accepted: false, done: false,
    reward: { coins, friend: weekly ? 40 : 25, stickers: weekly ? 3 : kind === 'dish' || kind === 'shift' || r() < 0.3 ? 1 : 0 } };
}
export function refreshBoard(game) {
  const rq = game.state.economy.requests;
  if (rq.day !== game.day) {
    const r = game.rngFor('econ_requests'), kinds = ['deliver', 'deliver', 'fish', 'dish', 'crop', 'shift'];
    rq.day = game.day; rq.board = [];
    for (let k = 0; k < 40 && rq.board.length < 3; k++) { const q = makeRequest(game, r, pick(r, kinds)); if (q && !rq.board.some((x) => x.kind === q.kind && x.item === q.item)) rq.board.push(q); }
  }
  if (!rq.weekly || rq.weekly.week !== weekOf(game.day)) { const q = makeRequest(game, game.rngFor('econ_weekly', weekOf(game.day) * 7 + 1), 'deliver', true); q.week = weekOf(game.day); rq.weekly = q; }
}
export const progressOf = (game, q) => (q.kind === 'shift' ? (q.done ? 1 : 0) : Math.min(q.n, game.count(q.item)));
export function canHandIn(game, q) { return q.accepted && !q.done && q.kind !== 'shift' && game.has(q.item, q.n); }
function complete(game, q) {
  const rq = game.state.economy.requests;
  if (q.kind !== 'shift') game.take(q.item, q.n);
  q.done = true; rq.done++;
  pay(game, q.reward.coins, `Request for ${q.whoName}`);
  if (q.who && get('npc', q.who)) game.addFriend(q.who, q.reward.friend);
  if (q.reward.stickers) giveStickers(game, q.reward.stickers, 'request done');
  game.addXP('charm', 6); game.stat('requestsDone'); game.sfx('chime');
  rq.active = rq.active.filter((x) => x !== q.id);
  game.bus.emit('requestDone', { id: q.id, kind: q.kind, who: q.who });
}
const allReqs = (game) => { const rq = game.state.economy.requests; return [...rq.board, ...(rq.weekly ? [rq.weekly] : [])]; };
export const activeReqs = (game) => allReqs(game).filter((q) => q.accepted && !q.done);

// ---------------------------------------------------------------- the cork board scene
function notices(game) {
  const out = [];
  const sale = SALE_CATS[weeklySale(game)];
  out.push({ title: 'Weekly sale', text: `This week only: ${sale.toLowerCase()} are 20% off in every shop in Hoshimori!`, color: RAMPS.coral[3] });
  out.push({ title: 'Basho\'s stall', text: `The travelling merchant Basho sets up in the Shotengai every Friday, 10 AM to 7 PM. Rare goods from far away!${game.weekday === 4 ? ' (Today!)' : ''}`, color: RAMPS.lilac[3] });
  out.push({ title: 'Farmers\' market', text: `Every Saturday morning in the square, 8 AM to 1 PM. Fresh local produce. We buy your crops too!${game.weekday === 5 ? ' (Today!)' : ''}`, color: RAMPS.forest[4] });
  const hiring = Object.values(JOBS).filter((j) => j.unlock(game)).map((j) => j.name);
  out.push({ title: 'Help wanted', text: `Part-time helpers wanted at: ${hiring.join(', ')}. Ask at the counter. Book shifts in the Jobs app.`, color: RAMPS.sky[4] });
  for (const n of all('boardNote')) if (!n.when || (typeof n.when === 'function' ? n.when(game) : game.check(n.when))) out.push({ ...n, story: true });
  return out;
}

class BoardScene {
  constructor(game, onDone) {
    refreshBoard(game);
    Object.assign(this, { name: 'noticeboard', game, onDone, t: 0, btns: new Buttons(), msg: '' });
    game.bus.emit('noticeboardOpened', {});
    this.layout();
  }
  layout() {
    const g = this.game, reqs = allReqs(g), notes = notices(g), b = [];
    reqs.forEach((q, i) => b.push({ id: 'q' + q.id, x: 14 + (i % 2) * 104, y: 26 + Math.floor(i / 2) * 58, w: 98, h: 52, q }));
    notes.forEach((n, i) => b.push({ id: 'n' + i, x: 14 + (i % 4) * 51, y: 146 + Math.floor(i / 4) * 30, w: 47, h: 26, n }));
    this.notes = notes; this.btns.set(b);
    const cur = this.btns.get(this.btns.focus);
    this.actions = [];
    if (cur && cur.q) {
      const q = cur.q;
      if (!q.accepted && !q.done) this.actions.push({ text: 'Accept', run: () => { if (activeReqs(g).length >= 4) { this.msg = 'You already have 4 requests. Finish one first!'; g.sfx('wrong'); return; } q.accepted = true; g.state.economy.requests.active.push(q.id); g.sfx('select'); this.msg = q.kind === 'shift' ? 'Accepted! It counts when you finish a shift there.' : 'Accepted! Bring the items back here and Pip will deliver them.'; } });
      if (canHandIn(g, q)) this.actions.push({ text: 'Hand in', run: () => { complete(g, q); this.msg = `Done! ${q.whoName} will be so pleased.`; } });
      if (q.accepted && !q.done) this.actions.push({ text: 'Drop it', run: () => { q.accepted = false; g.state.economy.requests.active = g.state.economy.requests.active.filter((x) => x !== q.id); g.sfx('back'); this.msg = 'Unpinned. Maybe someone else can help.'; } });
    } else if (cur && cur.n && cur.n.run) this.actions.push({ text: 'Look closer', run: () => { this.close(); cur.n.run(g); } });
    this.actions.forEach((a, i) => { a.x = 230; a.y = 176 - (this.actions.length - 1 - i) * 18; a.w = 82; a.h = 15; });
  }
  close() { this.game.sfx('back'); this.game.scenes.pop(this); this.onDone && this.onDone(); }
  update(dt, input, game) {
    this.t += dt;
    if (K.back(input)) return this.close();
    for (const [i, a] of this.actions.entries()) if ((input.justDown && input.mx >= a.x && input.mx < a.x + a.w && input.my >= a.y && input.my < a.y + a.h) || input.pressed.has(String(i + 1))) { a.run(); this.layout(); return; }
    const before = this.btns.focus, hit = this.btns.update(input);
    if (hit && this.actions[0] && !input.justDown) { this.actions[0].run(); }
    if (this.btns.focus !== before) { this.msg = ''; game.sfx('page'); }
    this.layout();
  }
  draw(g, game) {
    rect(g, RAMPS.woodDark[2], 0, 0, 320, 224);
    rect(g, '#b8875a', 6, 20, 214, 192); for (let i = 0; i < 260; i++) rect(g, i % 3 ? '#a6784e' : '#c99a6b', 8 + ((i * 53) % 210), 22 + ((i * 29) % 188), 1, 1);
    rect(g, RAMPS.wood[1], 6, 20, 214, 2); rect(g, RAMPS.wood[1], 6, 210, 214, 2);
    header(g, 'Hoshimori town board', dateText(game.day));
    for (const b of this.btns.list) {
      const on = this.btns.isFocus(b.id), lift = on ? 1 : 0;
      if (b.q) {
        const q = b.q, fill = q.done ? RAMPS.paper[2] : q.weekly ? RAMPS.butter[4] : C.paperHi;
        rect(g, 'rgba(30,22,36,.35)', b.x + 2, b.y + 2, b.w, b.h); rect(g, fill, b.x, b.y - lift, b.w, b.h); rect(g, on ? C.gold : RAMPS.paper[1], b.x, b.y + b.h - 1 - lift, b.w, 1);
        if (on) { rect(g, C.gold, b.x - 1, b.y - 1 - lift, b.w + 2, 1); rect(g, C.gold, b.x - 1, b.y - 1 - lift, 1, b.h + 2); rect(g, C.gold, b.x + b.w, b.y - 1 - lift, 1, b.h + 2); }
        rect(g, q.weekly ? C.coral : RAMPS.sky[1], b.x + b.w / 2 - 2, b.y - 2 - lift, 4, 4);
        drawText(g, fit(q.weekly ? 'Weekly order' : q.whoName, b.w - 8), b.x + 4, b.y + 5 - lift, q.weekly ? C.coralD : RAMPS.ink[2], 1, null);
        if (q.item) icon(g, get('item', q.item).icon, b.x + 12, b.y + 24 - lift); else icon(g, 'econ_i_jobs', b.x + 12, b.y + 24 - lift);
        drawText(g, fit(q.item ? `${q.n > 1 ? q.n + 'x ' : ''}${get('item', q.item).name}` : JOBS[q.job].name, b.w - 26), b.x + 22, b.y + 17 - lift, C.ink, 1, null);
        drawText(g, q.kind === 'shift' ? 'one shift' : `have ${progressOf(game, q)}/${q.n}`, b.x + 22, b.y + 26 - lift, RAMPS.ink[3], 1, null);
        coinGlyph(g, b.x + 4, b.y + 38 - lift); drawText(g, String(q.reward.coins), b.x + 15, b.y + 40 - lift, RAMPS.wood[1], 1, null);
        if (q.reward.stickers) { starGlyph(g, b.x + 46, b.y + 39 - lift); drawText(g, `x${q.reward.stickers}`, b.x + 55, b.y + 40 - lift, RAMPS.wood[1], 1, null); }
        const tag = q.done ? 'Done' : q.accepted ? (canHandIn(game, q) ? 'Ready' : 'Taken') : '';
        if (tag) { rect(g, q.done ? RAMPS.forest[3] : canHandIn(game, q) ? C.coral : RAMPS.sky[1], b.x + b.w - 30, b.y + 36 - lift, 28, 11); drawTextC(g, tag, b.x + b.w - 16, b.y + 39 - lift, C.text, 1, null); }
      } else {
        const n = b.n;
        rect(g, 'rgba(30,22,36,.35)', b.x + 2, b.y + 2, b.w, b.h); rect(g, n.color || RAMPS.paper[4], b.x, b.y - lift, b.w, b.h);
        if (on) { rect(g, C.gold, b.x - 1, b.y - 1 - lift, b.w + 2, 1); rect(g, C.gold, b.x - 1, b.y + b.h - lift, b.w + 2, 1); }
        rect(g, RAMPS.ribbon[2], b.x + b.w / 2 - 1, b.y - 2 - lift, 3, 3);
        wrapPx(n.title, b.w - 6).slice(0, 2).forEach((l, i) => drawTextC(g, l, b.x + b.w / 2, b.y + 6 + i * 8 - lift, C.ink, 1, null));
      }
    }
    // detail panel
    panel(g, 226, 22, 90, 190, 'paper');
    const cur = this.btns.get(this.btns.focus);
    if (cur && cur.q) {
      const q = cur.q;
      drawText(g, fit(q.whoName, 80), 231, 27, C.coralD, 1, null);
      wrapPx(q.text, 80).slice(0, 9).forEach((l, i) => drawText(g, l, 231, 37 + i * 8, C.ink, 1, null));
      const ry = 112;
      drawText(g, 'Reward', 231, ry, RAMPS.ink[2], 1, null);
      coinGlyph(g, 231, ry + 9); drawText(g, `${q.reward.coins} coins`, 242, ry + 10, C.ink, 1, null);
      if (q.who && get('npc', q.who)) drawText(g, `+friendship`, 231, ry + 20, C.ink, 1, null);
      if (q.reward.stickers) { starGlyph(g, 231, ry + 29); drawText(g, `${q.reward.stickers} Star Sticker${q.reward.stickers > 1 ? 's' : ''}`, 241, ry + 30, C.ink, 1, null); }
    } else if (cur && cur.n) {
      drawText(g, fit(cur.n.title, 80), 231, 27, C.coralD, 1, null);
      wrapPx(cur.n.text, 80).slice(0, 14).forEach((l, i) => drawText(g, l, 231, 37 + i * 8, C.ink, 1, null));
    }
    this.actions.forEach((a, i) => btn(g, a.x, a.y, a.w, a.h, `${i + 1} ${a.text}`, { tone: i === 0 ? 'mint' : 'paper', focus: i === 0, t: this.t }));
    if (this.msg) { const ls = wrapPx(this.msg, 200); panel(g, 10, 200 - ls.length * 8, 206, ls.length * 8 + 8, 'night'); ls.forEach((l, i) => drawText(g, l, 15, 204 - ls.length * 8 + i * 8, C.text)); }
    drawText(g, `Active ${activeReqs(game).length}/4   Done ${game.state.economy.requests.done}`, 10, 214, RAMPS.paper[3], 1, null);
    drawText(g, 'Arrows pick  Enter/1-3 act  Esc leave', 160, 214, RAMPS.paper[3], 1, null);
  }
}
register('scene', 'noticeboard', { make: (game, onDone) => new BoardScene(game, onDone) });
register('interaction', 'noticeboard', { label: 'Town request board', run: (g) => new Promise((res) => g.open('noticeboard', res)) });

register('system', 'econ_requests', {
  init(game) {
    game.bus.on('dayStart', () => refreshBoard(game));
    game.bus.on('jobShift', (e) => { for (const q of activeReqs(game)) if (q.kind === 'shift' && q.job === e.job) { complete(game, q); game.toast(`Request done: helped at ${JOBS[q.job].name}`, null); } });
    game.requestsActive = () => activeReqs(game);
  },
});

register('phoneApp', 'requests', {
  name: 'Requests', icon: 'econ_i_board', order: 46,
  badge: (game) => activeReqs(game).filter((q) => canHandIn(game, q)).length || 0,
  open(game, app) { app.state.sel ??= 0; },
  update(dt, input, game, app) { const n = activeReqs(game).length; if (n) { if (K.down(input)) app.state.sel = (app.state.sel + 1) % n; if (K.up(input)) app.state.sel = (app.state.sel + n - 1) % n; } },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, list = activeReqs(game);
    drawText(g, `Active requests ${list.length}/4    Completed ${game.state.economy.requests.done}`, x + 4, y + 4, C.coralD, 1, null);
    if (!list.length) { wrapPx('No requests yet. Check the board in the town square: townsfolk pin up 3 new requests every day, and a big order every week.', w - 20).forEach((l, i) => drawText(g, l, x + 10, y + 24 + i * 9, RAMPS.ink[2], 1, null)); return; }
    list.slice(0, 4).forEach((q, i) => {
      const yy = y + 16 + i * 38, on = i === app.state.sel;
      panel(g, x, yy, w, 35, on ? { ink: C.ink, fill: RAMPS.butter[4], hi: '#ffffff', lo: RAMPS.butter[3], shadow: 'rgba(30,22,36,.4)' } : 'card');
      slot(g, x + 4, yy + 7, q.item ? get('item', q.item).icon : 'econ_i_jobs', 0);
      drawText(g, fit(`${q.weekly ? 'Weekly order for ' : ''}${q.whoName}: ${q.item ? (q.n > 1 ? q.n + 'x ' : '') + get('item', q.item).name : 'one shift at ' + JOBS[q.job].name}`, w - 34), x + 28, yy + 5, C.ink, 1, null);
      drawText(g, fit(q.text, w - 34), x + 28, yy + 14, RAMPS.ink[2], 1, null);
      const prog = q.kind === 'shift' ? 'Finish a shift there' : `Have ${progressOf(game, q)}/${q.n}${canHandIn(game, q) ? ' - hand it in at the board!' : ''}`;
      drawText(g, prog, x + 28, yy + 24, canHandIn(game, q) ? RAMPS.forest[1] : RAMPS.ink[3], 1, null);
      const rw = `${q.reward.coins}c${q.reward.stickers ? ` +${q.reward.stickers} stars` : ''}`; drawText(g, rw, x + w - 6 - measure(rw), yy + 24, RAMPS.wood[1], 1, null);
    });
    void h; void WEEKDAYS;
  },
});

features('Side arcs & quests', [
  'Town request board in the square: 3 new requests from townsfolk every day, pinned as paper notes',
  'Request types: deliver groceries, catch a fish, bring a home-cooked dish, grow a crop, or help at a shop for one shift',
  'A weekly big order on the board with a bigger reward and 3 Star Stickers',
  'Requests reward coins, friendship with the person who asked, Charm XP and sometimes Star Stickers',
  'Accept up to 4 requests at once, hand items in at the board for Pip to deliver, or drop a request with no penalty',
  'Requests phone app: active requests with live progress, rewards and a hand-in reminder badge',
  'The board refreshes every morning: untaken requests make way for new ones, while accepted ones wait for you',
  'The board also shows the weekly sale, Basho\'s Friday stall, the Saturday market and who is hiring',
]);
