// Misa's phone: the pause menu. Apps are registered modules:
//   register('phoneApp', id, { name, icon, order, open?(game, app), update(dt, input, game, app), draw(g, game, app) })
// app.area = { x, y, w, h } is the drawable content rect; app.state is per-open scratch space.
import { register, get, all } from '../core/registry.js';
import { sprite } from '../artcache.js';
import { SPRITES } from '../art.js';
import { drawText, drawTextC, measure, wrap } from '../font.js';
import { clockText } from '../core/time.js';
import { UI, rect, panel, inside, tooltip } from './ui.js';

const AREA = { x: 14, y: 40, w: 292, h: 172 };

class PhoneScene {
  constructor(game, start, opts = {}) {
    this.name = 'phone'; this.opaque = false; this.game = game; this.opts = opts;
    this.apps = all('phoneApp').filter((a) => !a.when || a.when(game)).sort((a, b) => (a.order || 50) - (b.order || 50));
    if (opts.fromTitle) this.apps = this.apps.filter((a) => a.id === 'settings');
    this.i = Math.max(0, this.apps.findIndex((a) => a.id === start));
    this.t = 0; this.states = {};
    this.openApp();
  }
  get app() { return this.apps[this.i]; }
  openApp() { const a = this.app; this.ctx = { area: AREA, state: (this.states[a.id] ||= {}), scene: this }; if (a.open) a.open(this.game, this.ctx); }
  enter(game) { game.sfx('phone'); }
  close() { this.game.sfx('back'); this.game.scenes.pop(this); }
  update(dt, input, game) {
    this.t += dt;
    const k = input.pressed, n = this.apps.length;
    if (!this.ctx.state.capture && (k.has('escape') || k.has('tab') || k.has('m'))) return this.close();
    if (!this.ctx.state.capture && (k.has('q') || k.has('['))) { this.i = (this.i + n - 1) % n; this.openApp(); game.sfx('blip'); }
    if (!this.ctx.state.capture && (k.has(']') || k.has('r'))) { this.i = (this.i + 1) % n; this.openApp(); game.sfx('blip'); }
    // app icons along the top
    const L = this.strip(); this.off = L.off;
    const go = (d) => { this.i = (this.i + d + n) % n; this.openApp(); game.sfx('blip'); };
    if (L.arrows && input.justDown) { if (inside(input.mx, input.my, 14, 16, 14, 20)) return go(-1); if (inside(input.mx, input.my, 292, 16, 14, 20)) return go(1); }
    if (input.justDown && inside(input.mx, input.my, L.x, 16, L.iw * L.vis, 20)) { const j = this.off + Math.floor((input.mx - L.x) / L.iw); if (j >= 0 && j < n && j !== this.i) { this.i = j; this.openApp(); game.sfx('blip'); return; } }
    if (input.justDown && inside(input.mx, input.my, 284, 1, 32, 15)) return this.close();
    this.hover = inside(input.mx, input.my, L.x, 16, L.iw * L.vis, 20) ? this.off + Math.floor((input.mx - L.x) / L.iw) : -1;
    if (this.app.update) this.app.update(dt, input, game, this.ctx);
  }
  strip() {
    const n = this.apps.length, vis = Math.min(n, 10), arrows = n > vis, iw = arrows ? 26 : Math.min(28, 292 / n);
    let off = this.off || 0; if (this.i < off) off = this.i; if (this.i >= off + vis) off = this.i - vis + 1;
    return { n, vis, arrows, iw, off: Math.max(0, Math.min(off, n - vis)), x: arrows ? 28 : 14 };
  }
  draw(g, game) {
    g.fillStyle = '#10081888'; g.fillRect(0, 0, 320, 224);
    // phone body
    rect(g, UI.ink, 4, 1, 312, 222); rect(g, '#3b2a40', 5, 2, 310, 220); rect(g, '#f0a0b8', 6, 3, 308, 2);
    // status bar
    drawText(g, clockText(game.minutes), 12, 6, UI.text, 1, null);
    drawTextC(g, this.app.name.toUpperCase(), 160, 6, UI.gold, 1, null);
    rect(g, UI.accent, 292, 3, 20, 12); drawTextC(g, 'X', 302, 6, UI.text, 1, null);
    // app strip
    const L = this.strip();
    if (L.arrows) { for (const [ax, t] of [[14, '<'], [292, '>']]) { rect(g, UI.ink, ax, 16, 14, 20); rect(g, '#5a4660', ax + 1, 17, 12, 18); drawTextC(g, t, ax + 7, 23, UI.text, 1, null); } }
    this.apps.slice(L.off, L.off + L.vis).forEach((a, jj) => {
      const j = L.off + jj, iw = L.iw, x = Math.round(L.x + jj * iw), on = j === this.i;
      rect(g, on ? UI.paper : '#5a4660', x, 16, Math.round(iw) - 2, 20);
      if (a.icon && SPRITES[a.icon]) { const s = SPRITES[a.icon]; g.drawImage(sprite(a.icon), Math.round(x + (iw - 2) / 2 - s.w / 2), 26 - Math.round(s.h / 2)); }
      else drawTextC(g, a.name.slice(0, 3), x + iw / 2 - 1, 23, on ? UI.ink : UI.text, 1, null);
      const badge = a.badge && a.badge(game);
      if (badge) { rect(g, UI.accent, x + iw - 10, 15, 8, 8); drawTextC(g, String(badge), x + iw - 6, 16, UI.text, 1, null); }
    });
    if (this.hover >= 0 && this.apps[this.hover]) tooltip(g, this.apps[this.hover].name, ((this.game.input || {}).mx || 0) + 6, 38);
    rect(g, UI.paper, AREA.x - 2, AREA.y - 2, AREA.w + 4, AREA.h + 4);
    this.app.draw(g, game, this.ctx);
    drawText(g, 'Q/E OR TAP ICONS: SWITCH APP   ESC OR X: CLOSE', 14, 216, '#b9a6c4', 1, null);
  }
}
register('scene', 'phone', { make: (game, start, opts) => new PhoneScene(game, start, opts) });

// ---------------- core apps ----------------
const ITEM_CATS = ['all', 'food', 'gift', 'crop', 'fish', 'material', 'book', 'key'];
register('phoneApp', 'bag', {
  name: 'Bag', icon: 'i_bag', order: 10,
  open(game, app) { app.state.sel ??= 0; app.state.cat ??= 0; },
  items(game, app) {
    const cat = ITEM_CATS[app.state.cat];
    return Object.entries(game.state.inv).map(([id, n]) => ({ id, n, def: get('item', id) })).filter((e) => e.def && (cat === 'all' || e.def.cat === cat || (cat === 'key' && e.def.key)))
      .sort((a, b) => (a.def.cat || '').localeCompare(b.def.cat || '') || a.def.name.localeCompare(b.def.name));
  },
  update(dt, input, game, app) {
    const st = app.state, list = this.items(game, app), k = input.pressed, cols = 8;
    if (k.has('arrowright') || k.has('d')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowleft') || k.has('a')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + cols);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - cols);
    if (k.has('c')) { st.cat = (st.cat + 1) % ITEM_CATS.length; st.sel = 0; }
    const { x, y } = app.area;
    if (input.justDown) {
      for (let i = 0; i < ITEM_CATS.length; i++) if (inside(input.mx, input.my, x + 2 + i * 36, y + 1, 34, 15)) { st.cat = i; st.sel = 0; }
      const gx = Math.floor((input.mx - x - 4) / 22), gy = Math.floor((input.my - y - 18) / 22), j = gy * cols + gx;
      if (gx >= 0 && gx < cols && gy >= 0 && j < list.length) { if (st.sel === j && st.lastClick > 0) this.useSel(game, app, list); st.sel = j; st.lastClick = 0.35; }
    }
    st.lastClick = (st.lastClick || 0) - dt;
    st.sel = Math.max(0, Math.min(st.sel, list.length - 1));
    const sel = list[st.sel];
    st.actions = sel ? this.actions(game, sel) : [];
    for (const [i, a] of st.actions.entries()) {
      const bx = x + 186, by = y + 118 + i * 18;
      if ((input.justDown && inside(input.mx, input.my, bx, by, 100, 16)) || k.has(String(i + 1))) a.run();
    }
    if (k.has('enter') || k.has('e') || k.has(' ')) if (st.actions[0]) st.actions[0].run();
  },
  useSel(game, app, list) { const st = app.state, sel = list[st.sel]; if (sel) { const a = this.actions(game, sel); if (a[0]) a[0].run(); } },
  actions(game, e) {
    const out = [], d = e.def;
    if (d.energy || d.use) out.push({ text: d.use ? (d.useLabel || 'Use') : 'Eat', run: () => game.useItem(e.id) });
    const near = game.world && game.world.target();
    if (near && near.kind === 'npc' && !d.key) out.push({ text: `Give to ${near.npc.def.name}`, run: () => { game.scenes.pop(game.scenes.top); game.giveGift && game.giveGift(near.npc, e.id); } });
    return out;
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = this.items(game, app), cols = 8;
    ITEM_CATS.forEach((c, i) => { const on = i === st.cat; rect(g, on ? UI.accent : UI.paper2, x + 2 + i * 36, y + 1, 34, 15); drawTextC(g, c, x + 19 + i * 36, y + 5, on ? UI.text : UI.ink, 1, null); });
    for (let i = 0; i < Math.max(32, list.length); i++) {
      const gx = x + 4 + (i % cols) * 22, gy = y + 18 + Math.floor(i / cols) * 22;
      if (gy > y + h - 22) break;
      rect(g, i === st.sel && list[i] ? UI.gold : UI.paper2, gx, gy, 20, 20); rect(g, UI.paper, gx + 1, gy + 1, 18, 18);
      const e = list[i];
      if (!e) continue;
      if (e.def.icon && SPRITES[e.def.icon]) { const s = SPRITES[e.def.icon]; g.drawImage(sprite(e.def.icon), gx + 10 - Math.round(s.w / 2), gy + 10 - Math.round(s.h / 2)); }
      else drawTextC(g, e.def.name.slice(0, 2), gx + 10, gy + 7, UI.ink, 1, null);
      if (e.n > 1) drawText(g, String(e.n), gx + 19 - measure(String(e.n)), gy + 14, UI.ink, 1, '#fff6e6');
    }
    const sel = list[st.sel];
    panel(g, x + 182, y + 16, 108, 154, 'paper');
    if (!sel) { drawTextC(g, list.length ? '' : 'NOTHING HERE YET', x + 236, y + 60, UI.dim, 1, null); return; }
    drawText(g, sel.def.name, x + 188, y + 22, UI.accent2, 1, null);
    drawText(g, `${sel.def.cat || 'item'}  x${sel.n}`, x + 188, y + 31, UI.dim, 1, null);
    wrap(sel.def.desc || '', 24).slice(0, 8).forEach((l, i) => drawText(g, l, x + 188, y + 42 + i * 8, UI.ink, 1, null));
    if (sel.def.energy) drawText(g, `+${sel.def.energy} ENERGY`, x + 188, y + 108, UI.good, 1, null);
    if (sel.def.price) drawText(g, `SELLS ${sel.def.price}c`, x + 240, y + 108, UI.dim, 1, null);
    (st.actions || []).forEach((a, i) => { const by = y + 118 + i * 18; rect(g, UI.ink, x + 186, by, 100, 16); rect(g, UI.mint, x + 187, by + 1, 98, 14); drawTextC(g, `${i + 1} ${a.text}`, x + 236, by + 5, UI.ink, 1, null); });
    drawText(g, 'C: FILTER  ENTER: USE', x + 4, y + h - 8, UI.dim, 1, null);
  },
});

register('phoneApp', 'quests', {
  name: 'Journal', icon: 'i_quest', order: 20,
  badge: (game) => all('quest').filter((q) => game.questActive(q.id) && !game.state.seen['q:' + q.id]).length || 0,
  open(game, app) { app.state.sel ??= 0; app.state.tab ??= 0; },
  list(game, app) { return all('quest').filter((q) => game.quest(q.id) && (app.state.tab ? game.questDone(q.id) : game.questActive(q.id))).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0)); },
  update(dt, input, game, app) {
    const st = app.state, list = this.list(game, app), k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('c') || (input.justDown && inside(input.mx, input.my, app.area.x, app.area.y, 120, 16))) { st.tab = 1 - st.tab; st.sel = 0; }
    if (input.justDown) { const i = Math.floor((input.my - app.area.y - 19) / 14); if (input.mx < app.area.x + 120 && i >= 0 && i < list.length) st.sel = i; }
    const q = list[st.sel]; if (q) game.state.seen['q:' + q.id] = 1;
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = this.list(game, app);
    rect(g, UI.accent, x, y, 120, 16); drawTextC(g, st.tab ? 'COMPLETED (C)' : 'ACTIVE (C)', x + 60, y + 5, UI.text, 1, null);
    list.slice(0, 10).forEach((q, i) => { if (i === st.sel) rect(g, UI.gold, x, y + 19 + i * 14, 120, 13); drawText(g, (q.main ? '* ' : '') + q.name, x + 3, y + 22 + i * 14, UI.ink, 1, null); });
    if (!list.length) drawText(g, st.tab ? 'NOTHING FINISHED YET' : 'NO ACTIVE QUESTS', x + 4, y + 24, UI.dim, 1, null);
    const q = list[st.sel];
    if (!q) return;
    panel(g, x + 126, y, 166, 170, 'paper');
    drawText(g, q.name, x + 132, y + 6, UI.accent2, 1, null);
    if (q.giver) drawText(g, `FROM: ${(get('npc', q.giver) || { name: q.giver }).name}`, x + 132, y + 15, UI.dim, 1, null);
    wrap(q.desc || '', 38).slice(0, 7).forEach((l, i) => drawText(g, l, x + 132, y + 26 + i * 8, UI.ink, 1, null));
    const qs = game.quest(q.id);
    (q.stages || []).forEach((s, i) => {
      if (i > qs.stage && !qs.done) return;
      const txt = typeof s === 'function' ? s(game) : s && typeof s === 'object' ? (typeof s.text === 'function' ? s.text(game) : s.text) : s;
      const done = qs.done || i < qs.stage;
      drawText(g, (done ? '* ' : '> ') + txt, x + 132, y + 90 + i * 9, done ? UI.good : UI.ink, 1, null);
    });
  },
});

register('phoneApp', 'friends', {
  name: 'Friends', icon: 'heart', order: 30,
  open(game, app) { app.state.sel ??= 0; },
  list(game) { return all('npc').filter((n) => !n.hidden && (game.state.friends[n.id] || game.state.seen['met:' + n.id])); },
  update(dt, input, game, app) {
    const st = app.state, list = this.list(game), k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown) { const i = Math.floor((input.my - app.area.y) / 14); if (input.mx < app.area.x + 140 && i >= 0 && i < list.length) st.sel = i; }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = this.list(game);
    if (!list.length) { drawText(g, 'TALK TO PEOPLE AROUND TOWN TO MAKE FRIENDS!', x + 4, y + 10, UI.dim, 1, null); return; }
    list.slice(0, 12).forEach((n, i) => {
      if (i === st.sel) rect(g, UI.gold, x, y + i * 14, 140, 13);
      drawText(g, n.name, x + 3, y + 4 + i * 14, UI.ink, 1, null);
      const h = game.hearts(n.id);
      for (let k = 0; k < 10; k++) { g.globalAlpha = k < h ? 1 : 0.2; g.drawImage(sprite('heart'), x + 60 + k * 8, y + 4 + i * 14); }
      g.globalAlpha = 1;
    });
    const n = list[st.sel];
    if (!n) return;
    panel(g, x + 146, y, 146, 170, 'paper');
    drawText(g, n.name, x + 152, y + 6, UI.accent2, 1, null); drawText(g, n.role || '', x + 152, y + 15, UI.dim, 1, null);
    if (n.birthday) drawText(g, `BIRTHDAY: ${n.birthday.season} ${n.birthday.day}`, x + 152, y + 25, UI.ink, 1, null);
    wrap(n.bio || '', 34).slice(0, 6).forEach((l, i) => drawText(g, l, x + 152, y + 36 + i * 8, UI.ink, 1, null));
    const f = game.friend(n.id), known = f.knownGifts || [];
    drawText(g, 'KNOWN GIFTS:', x + 152, y + 92, UI.accent2, 1, null);
    known.slice(0, 8).forEach((id, i) => { const it = get('item', id); if (it && it.icon && SPRITES[it.icon]) g.drawImage(sprite(it.icon), x + 152 + (i % 8) * 16, y + 102); });
    if (!known.length) drawText(g, 'GIVE GIFTS TO LEARN', x + 152, y + 102, UI.dim, 1, null);
    drawText(g, f.talkedDay === game.day ? '* TALKED TODAY' : '- NOT TALKED TODAY', x + 152, y + 124, f.talkedDay === game.day ? UI.good : UI.dim, 1, null);
    drawText(g, f.giftedDay === game.day ? '* GIFT GIVEN TODAY' : '- NO GIFT TODAY', x + 152, y + 133, f.giftedDay === game.day ? UI.good : UI.dim, 1, null);
  },
});

// The Settings app lives in src/content/ui/settings.js

register('phoneApp', 'system', {
  name: 'Save', icon: 'i_save', order: 99,
  open(game, app) { app.state.sel = 0; },
  opts: ['Save game', 'Save and quit to title', 'Back to game'],
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) st.sel = (st.sel + 1) % 3;
    if (k.has('arrowup') || k.has('w')) st.sel = (st.sel + 2) % 3;
    let pick = (k.has('enter') || k.has(' ') || k.has('e')) ? st.sel : -1;
    if (input.justDown) { const i = Math.floor((input.my - app.area.y - 40) / 22); if (i >= 0 && i < 3) pick = i; }
    if (pick === 0) { game.save() ? game.toast(`Saved to slot ${game.slot}`, 'i_save') : game.toast('Could not save (storage blocked)'); }
    if (pick === 1) { game.save(); game.scenes.replaceAll(get('scene', 'title').make(game)); game.world = null; }
    if (pick === 2) app.scene.close();
  },
  draw(g, game, app) {
    const { x, y } = app.area;
    drawTextC(g, `SLOT ${game.slot}  -  DAY ${game.day}  -  ${Math.round(game.state.playMs / 60000)} MIN PLAYED`, x + 146, y + 16, UI.ink, 1, null);
    this.opts.forEach((o, i) => { const yy = y + 40 + i * 22; rect(g, UI.ink, x + 66, yy, 160, 18); rect(g, i === app.state.sel ? UI.gold : UI.mint, x + 67, yy + 1, 158, 16); drawTextC(g, o, x + 146, yy + 5, UI.ink, 1, null); });
    drawTextC(g, 'THE GAME ALSO SAVES EVERY TIME YOU SLEEP', x + 146, y + 120, UI.dim, 1, null);
  },
});
