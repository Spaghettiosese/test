// Economy area phone apps: Wallet (balance, daily totals, savings jar, savings goal, history) and
// Storage (bag and room chest side by side: move items at home, sort, favourite-lock, bag value).
import { register, get, features } from '../../core/registry.js';
import { dateText, clockText } from '../../core/time.js';
import { sellPrice, BUFFS, hasBuff, pushHistory } from './core.js';
import { rect, panel, btn, drawText, drawTextC, measure, fit, C, RAMPS, K, inside, coinGlyph, slot, scrollbar } from './gfx.js';

export const GOALS = [
  { id: 'bike', name: 'A bike', price: 8000 }, { id: 'telescope', name: 'A real telescope', price: 12000 },
  { id: 'greenhouse', name: 'A greenhouse', price: 20000 }, { id: 'ticket', name: 'A ferry trip to see Mum', price: 30000 },
];

register('phoneApp', 'wallet', {
  name: 'Wallet', icon: 'econ_i_wallet', order: 42,
  open(game, app) { app.state.top ??= 0; },
  update(dt, input, game, app) {
    const ec = game.state.economy, { x, y, w } = app.area, st = app.state, bx = x + 4;
    const hit = (bxx, byy, bw) => input.justDown && inside(input.mx, input.my, bxx, byy, bw, 14);
    if (hit(bx, y + 92, 66) || input.pressed.has('1')) { if (game.money >= 100) { game.moneyNote('Into the savings jar'); game.addMoney(-100, true); ec.jar += 100; game.sfx('coin'); } else game.toast('Not enough coins'); }
    if (hit(bx + 70, y + 92, 60) || input.pressed.has('2')) { if (ec.jar > 0) { const n = ec.jar; ec.jar = 0; game.moneyNote('Out of the savings jar'); game.addMoney(n, true); game.sfx('coin'); } }
    if (hit(bx, y + 136, 130) || input.pressed.has('g')) { const i = GOALS.findIndex((g) => g.id === ec.goal); ec.goal = GOALS[(i + 1) % GOALS.length].id; game.sfx('blip'); }
    const n = ec.history.length, rows = Math.floor((app.area.h - 18) / 10);
    if (K.down(input) || input.wheel > 0) st.top = Math.min(Math.max(0, n - rows), st.top + 1);
    if (K.up(input) || input.wheel < 0) st.top = Math.max(0, st.top - 1);
    void w;
  },
  draw(g, game, app) {
    const ec = game.state.economy, { x, y, w, h } = app.area, lw = 138;
    panel(g, x, y, lw, h, 'paper');
    drawText(g, 'Balance', x + 6, y + 6, RAMPS.ink[2], 1, null);
    coinGlyph(g, x + 6, y + 16); drawText(g, `${game.money} coins`, x + 18, y + 17, C.coralD, 1, null);
    const today = ec.history.filter((e) => e.d === game.day);
    const inn = today.filter((e) => e.n > 0).reduce((a, e) => a + e.n, 0), out = -today.filter((e) => e.n < 0).reduce((a, e) => a + e.n, 0);
    drawText(g, `Today in +${inn}`, x + 6, y + 30, RAMPS.forest[1], 1, null); drawText(g, `out -${out}`, x + 86, y + 30, C.coralD, 1, null);
    drawText(g, `Shipping box: ${Object.values(ec.shipBox).reduce((a, b) => a + b, 0)} items`, x + 6, y + 42, C.ink, 1, null);
    if (ec.lastShip) drawText(g, fit(`Last payout ${ec.lastShip.total}c (${dateText(ec.lastShip.day)})`, lw - 12), x + 6, y + 51, RAMPS.ink[3], 1, null);
    // jar
    rect(g, RAMPS.paper[1], x + 4, y + 62, lw - 8, 1);
    drawText(g, 'Savings jar (+1% on Mondays)', x + 6, y + 67, RAMPS.ink[2], 1, null);
    rect(g, RAMPS.sky[1], x + 6, y + 77, 10, 12); rect(g, RAMPS.sky[4], x + 7, y + 79, 8, 9); rect(g, RAMPS.butter[2], x + 8, y + 84 - Math.min(4, Math.floor(ec.jar / 500)), 6, 4 + Math.min(4, Math.floor(ec.jar / 500)));
    drawText(g, `${ec.jar} coins saved`, x + 20, y + 80, C.ink, 1, null);
    btn(g, x + 4, y + 92, 66, 14, '1 Save 100', { disabled: game.money < 100, tone: 'mint' });
    btn(g, x + 74, y + 92, 60, 14, '2 Take all', { disabled: !ec.jar });
    // goal
    const goal = GOALS.find((gg) => gg.id === ec.goal) || GOALS[0], have = game.money + ec.jar, p = Math.min(1, have / goal.price);
    drawText(g, `Saving for: ${goal.name}`, x + 6, y + 112, C.ink, 1, null);
    rect(g, C.ink, x + 6, y + 122, lw - 14, 8); rect(g, RAMPS.paper[2], x + 7, y + 123, lw - 16, 6); rect(g, p >= 1 ? RAMPS.forest[3] : C.gold, x + 7, y + 123, Math.round((lw - 16) * p), 6);
    drawTextC(g, `${Math.min(have, goal.price)} / ${goal.price}`, x + lw / 2, y + 123, C.ink, 1, null);
    btn(g, x + 4, y + 136, 130, 14, 'G: change goal', {});
    const buffs = Object.keys(BUFFS).filter((b) => hasBuff(game, b));
    drawText(g, fit(buffs.length ? 'Buffs: ' + buffs.map((b) => BUFFS[b].name).join(', ') : 'No food buffs right now', lw - 12), x + 6, y + h - 10, RAMPS.ink[3], 1, null);
    // history
    const hx = x + lw + 4, hw = w - lw - 4, rows = Math.floor((h - 18) / 10), top = app.state.top || 0;
    panel(g, hx, y, hw, h, 'paper');
    drawText(g, 'History', hx + 6, y + 5, RAMPS.ink[2], 1, null);
    if (!ec.history.length) drawText(g, 'Nothing yet', hx + 6, y + 20, RAMPS.ink[3], 1, null);
    ec.history.slice(top, top + rows).forEach((e, i) => {
      const yy = y + 16 + i * 10, amt = e.n ? `${e.n > 0 ? '+' : ''}${e.n}` : '';
      drawText(g, fit(e.t, hw - 20 - measure(amt)), hx + 6, yy, e.d === game.day ? C.ink : RAMPS.ink[3], 1, null);
      drawText(g, amt, hx + hw - 8 - measure(amt), yy, e.n > 0 ? RAMPS.forest[1] : C.coralD, 1, null);
    });
    scrollbar(g, hx + hw - 4, y + 16, rows * 10, top, rows, ec.history.length);
    void clockText;
  },
});

const SORTS = ['category', 'name', 'value'];
const atHome = (game) => (game.world && game.world.map ? game.world.map.id : game.state.map) === 'home';
function listOf(game, src, sort) {
  const box = src === 'bag' ? game.state.inv : game.state.storage;
  const rows = Object.entries(box).filter(([id, n]) => n > 0 && get('item', id) && !(src === 'bag' && get('item', id).key)).map(([id, n]) => ({ id, n, def: get('item', id) }));
  const cmp = { category: (a, b) => (a.def.cat || '').localeCompare(b.def.cat || '') || a.def.name.localeCompare(b.def.name), name: (a, b) => a.def.name.localeCompare(b.def.name), value: (a, b) => (sellPrice(game, b.id) * b.n) - (sellPrice(game, a.id) * a.n) }[sort];
  return rows.sort(cmp);
}
register('phoneApp', 'storage', {
  name: 'Storage', icon: 'econ_i_box', order: 15,
  open(game, app) { app.state.col ??= 0; app.state.sel ??= 0; app.state.sort ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, src = st.col ? 'chest' : 'bag', list = listOf(game, src, SORTS[st.sort]), cols = 5, { x, y } = app.area;
    if (input.pressed.has('o')) { st.sort = (st.sort + 1) % 3; game.sfx('blip'); }
    if (input.pressed.has('x')) { st.col = 1 - st.col; st.sel = 0; }
    if (K.right(input)) { if (st.sel % cols === cols - 1 || st.sel === list.length - 1) { if (!st.col) { st.col = 1; st.sel = 0; } } else st.sel++; }
    if (K.left(input)) { if (st.sel % cols === 0) { if (st.col) { st.col = 0; st.sel = 0; } } else st.sel--; }
    if (K.down(input)) st.sel = Math.min(list.length - 1, st.sel + cols);
    if (K.up(input)) st.sel = Math.max(0, st.sel - cols);
    if (input.justDown) for (let c = 0; c < 2; c++) { const gx = Math.floor((input.mx - x - 4 - c * 146) / 22), gy = Math.floor((input.my - y - 16) / 22), j = gy * cols + gx, l = listOf(game, c ? 'chest' : 'bag', SORTS[st.sort]); if (gx >= 0 && gx < cols && gy >= 0 && j < l.length) { st.col = c; st.sel = j; } }
    const cur = listOf(game, st.col ? 'chest' : 'bag', SORTS[st.sort]);
    st.sel = Math.max(0, Math.min(st.sel, cur.length - 1));
    const e = cur[st.sel];
    if (!e) return;
    if (input.pressed.has('f') || (input.justDown && inside(input.mx, input.my, x + 220, y + app.area.h - 16, 70, 14))) { const f = game.state.economy.favs; if (f[e.id]) delete f[e.id]; else f[e.id] = 1; game.sfx('select'); }
    if (input.pressed.has('enter') || input.pressed.has(' ') || (input.justDown && inside(input.mx, input.my, x + 130, y + app.area.h - 16, 86, 14))) {
      if (!atHome(game)) { game.toast('The chest is in your room at home', null); return; }
      const inv = game.state.inv, sto = game.state.storage, n = e.n;
      if (st.col === 0) { delete inv[e.id]; sto[e.id] = (sto[e.id] || 0) + n; }
      else { if (!inv[e.id] && game.bagUsed() >= game.state.bagSize) { game.toast('Your bag is full', null); return; } delete sto[e.id]; inv[e.id] = (inv[e.id] || 0) + n; }
      game.sfx('pop');
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, cols = 5, sort = SORTS[st.sort];
    ['bag', 'chest'].forEach((src, c) => {
      const cx = x + c * 146, list = listOf(game, src, sort), on = st.col === c;
      rect(g, on ? C.coral : RAMPS.paper[1], cx, y, 140, 12);
      const label = src === 'bag' ? `Bag ${game.bagUsed()}/${game.state.bagSize}` : `Chest (${list.length})`;
      drawText(g, label, cx + 4, y + 3, on ? C.text : C.ink, 1, null);
      const rows = Math.floor((h - 40) / 22);
      for (let i = 0; i < cols * rows; i++) {
        const e = list[i], gx = cx + 4 + (i % cols) * 22, gy = y + 16 + Math.floor(i / cols) * 22;
        if (!e) { rect(g, RAMPS.paper[2], gx, gy, 20, 20); continue; }
        slot(g, gx, gy, e.def.icon, e.n, { sel: on && i === st.sel });
        if (game.state.economy.favs[e.id]) { rect(g, C.coral, gx + 1, gy + 1, 5, 5); rect(g, C.paperHi, gx + 2, gy + 3, 3, 1); }
      }
      if (list.length > cols * rows) drawText(g, `+${list.length - cols * rows} more`, cx + 4, y + 16 + rows * 22, RAMPS.ink[3], 1, null);
    });
    const cur = listOf(game, st.col ? 'chest' : 'bag', sort)[st.sel];
    const bagValue = listOf(game, 'bag', sort).reduce((a, e) => a + sellPrice(game, e.id) * e.n, 0);
    rect(g, RAMPS.paper[2], x, y + h - 20, w, 20);
    drawText(g, cur ? fit(`${cur.def.name} x${cur.n}  sells ${sellPrice(game, cur.id)}c`, 124) : `Bag worth ${bagValue}c`, x + 4, y + h - 13, C.ink, 1, null);
    btn(g, x + 130, y + h - 16, 86, 14, atHome(game) ? (st.col ? 'Enter: to bag' : 'Enter: to chest') : 'Chest at home', { disabled: !atHome(game) || !cur });
    btn(g, x + 220, y + h - 16, 70, 14, cur && game.state.economy.favs[cur.id] ? 'F: unlock' : 'F: favourite', { disabled: !cur });
    drawText(g, `O: sort by ${sort}`, x + w - 4 - measure(`O: sort by ${sort}`), y + 3, RAMPS.ink[2], 1, null);
  },
});
void pushHistory; void drawTextC;

features('Inventory & items', [
  'Storage phone app: your bag and the room chest side by side, moving whole stacks between them while at home',
  'Sort the bag and chest by category, name or value',
  'Favourite (lock) items so shops and the shipping box never offer to sell them',
  'See what your whole bag is worth at today\'s prices',
]);
features('Phone & apps', [
  'Wallet app: balance, today\'s coins in and out, shipping box status, savings jar, a savings goal bar (bike, telescope, greenhouse, a trip to Mum) and a scrolling history',
]);
