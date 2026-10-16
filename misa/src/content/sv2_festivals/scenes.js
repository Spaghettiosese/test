// Festival Set Pieces UI: the bag item picker (`game.open('sv2_pick', opts, onDone)`), the Grange display board
// (`sv2_grange`), the festival result card (`sv2_result`), the Festival Album phone app and the cutscene backdrops.
// Everything is tap-friendly (targets >= 16 px). Keys: arrows move, E/Enter/Space picks, Esc/B closes.
import { register, get } from '../../core/registry.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { yearOf } from '../../core/time.js';
import { spr, RAMPS as K } from '../town/lib.js';
import { UI, panel, rect, inside, iconC, drawText, drawTextC, drawTextR, measure, wrapPx } from '../../ui/ui.js';
import { rect as brect, disc, sky, stars, moon, sea, skyline, misa, npc } from '../events/backdrops.js';
import { PIECES, RIBBONS, S, bagIds, scoreBoard, starOf, ribbonCount, momentsToday } from './data.js';

const clip = (s, px) => { s = String(s); while (s.length > 1 && measure(s) > px) s = s.slice(0, -1); return s; };
const button = (g, x, y, w, h, text, on = true, hot = false) => {
  rect(g, K.ink[1], x, y, w, h); rect(g, on ? (hot ? UI.gold : K.mint[2]) : K.paper[1], x + 1, y + 1, w - 2, h - 2);
  drawTextC(g, text, x + w / 2, y + Math.round((h - 5) / 2), on ? K.ink[1] : K.paper[0], 1, null);
};

// ---------------------------------------------------------------- icons
spr('sv2_i_album', 16, 16, (R) => { // phone icon: a rosette ribbon on a card
  R(2, 2, 12, 12, K.paper[3]); R(2, 2, 12, 1, K.paper[4]); R(2, 13, 12, 1, K.paper[1]);
  R.e(8, 7, 3, 3, K.ribbon[2]); R.e(8, 7, 1, 1, K.butter[3]); R(6, 10, 2, 4, K.sky[2]); R(9, 10, 2, 4, K.sky[3]);
}, {});

// ---------------------------------------------------------------- shared item grid
class ItemGrid {
  constructor(x, y, cols, rows, cell) { Object.assign(this, { x, y, cols, rows, cell, page: 0, sel: 0, ids: [] }); }
  set(ids) { this.ids = ids; this.sel = Math.max(0, Math.min(this.sel, ids.length - 1)); this.page = Math.floor(this.sel / this.per); }
  get per() { return this.cols * this.rows; }
  get pages() { return Math.max(1, Math.ceil(this.ids.length / this.per)); }
  get cur() { return this.ids[this.sel]; }
  // -> 'pick' (tapped a new item), 'tap' (tapped the selected item / pressed confirm) or null
  update(input, game) {
    const k = input.pressed, n = this.ids.length;
    if (!n) return null;
    const mv = (d) => { this.sel = Math.max(0, Math.min(n - 1, this.sel + d)); this.page = Math.floor(this.sel / this.per); game.sfx('blip'); };
    if (k.has('arrowright') || k.has('d')) mv(1);
    if (k.has('arrowleft') || k.has('a')) mv(-1);
    if (k.has('arrowdown') || k.has('s')) mv(this.cols);
    if (k.has('arrowup') || k.has('w')) mv(-this.cols);
    if (input.wheel > 0 && this.page < this.pages - 1) { this.page++; this.sel = this.page * this.per; }
    if (input.wheel < 0 && this.page > 0) { this.page--; this.sel = this.page * this.per; }
    if (k.has('e') || k.has('enter') || k.has(' ')) return 'tap';
    if (input.justDown) {
      const by = this.y + this.rows * this.cell + 2, bw = this.cols * this.cell;
      if (inside(input.mx, input.my, this.x, by, 16, 12) && this.page > 0) { this.page--; this.sel = this.page * this.per; game.sfx('blip'); return null; }
      if (inside(input.mx, input.my, this.x + bw - 16, by, 16, 12) && this.page < this.pages - 1) { this.page++; this.sel = this.page * this.per; game.sfx('blip'); return null; }
      const lx = input.mx - this.x, ly = input.my - this.y;
      if (lx >= 0 && ly >= 0 && lx < bw && ly < this.rows * this.cell) {
        const i = this.page * this.per + Math.floor(ly / this.cell) * this.cols + Math.floor(lx / this.cell);
        if (i < n) { const same = i === this.sel; this.sel = i; return same ? 'tap' : 'pick'; }
      }
    }
    return null;
  }
  draw(g, game, left) {
    for (let j = 0; j < this.per; j++) {
      const i = this.page * this.per + j, cx = this.x + (j % this.cols) * this.cell, cy = this.y + Math.floor(j / this.cols) * this.cell;
      rect(g, i === this.sel && i < this.ids.length ? UI.gold : K.ink[2], cx, cy, this.cell - 1, this.cell - 1);
      rect(g, i < this.ids.length ? K.paper[3] : K.ink[3], cx + 1, cy + 1, this.cell - 3, this.cell - 3);
      if (i >= this.ids.length) continue;
      const id = this.ids[i], it = get('item', id), l = left ? left(id) : game.count(id);
      if (it && it.icon && SPRITES[it.icon]) { g.globalAlpha = l > 0 ? 1 : 0.3; iconC(g, it.icon, cx + (this.cell - 1) / 2, cy + (this.cell - 1) / 2 - 2); g.globalAlpha = 1; }
      if (l > 1) drawText(g, `x${l}`, cx + 2, cy + this.cell - 9, K.ink[1], 1, null);
      const st = starOf(game, id); if (st) rect(g, [0, '#c0c8d8', '#ffd76a', '#ff9ac0'][st], cx + this.cell - 7, cy + 2, 4, 4);
    }
    const by = this.y + this.rows * this.cell + 2, bw = this.cols * this.cell;
    button(g, this.x, by, 16, 12, '<', this.page > 0); button(g, this.x + bw - 16, by, 16, 12, '>', this.page < this.pages - 1);
    drawTextC(g, `PAGE ${this.page + 1}/${this.pages}`, this.x + bw / 2, by + 4, '#d6c8e0', 1, null);
  }
}
const itemName = (id) => (get('item', id) || { name: id }).name;

// ---------------------------------------------------------------- bag picker
class PickScene {
  constructor(game, o = {}, onDone) {
    this.name = 'sv2_pick'; this.music = 'library';
    Object.assign(this, { game, o, onDone, t: 0, ids: bagIds(game, o.filter) });
    this.grid = new ItemGrid(14, 32, 10, 4, 28); this.grid.set(this.ids);
  }
  finish(v) { this.game.scenes.pop(this); this.game.sfx(v ? 'select' : 'back'); this.onDone && this.onDone(v); }
  update(dt, input) {
    this.t += dt;
    const k = input.pressed;
    if (k.has('escape') || k.has('backspace') || k.has('b')) return this.finish(null);
    if (input.justDown && inside(input.mx, input.my, 294, 1, 24, 14)) return this.finish(null);
    if (input.justDown && inside(input.mx, input.my, 14, 198, 90, 16)) return this.finish(null);
    if (input.justDown && inside(input.mx, input.my, 216, 198, 90, 16) && this.grid.cur) return this.finish(this.grid.cur);
    const ev = this.grid.update(input, this.game);
    if (ev === 'tap' && this.grid.cur) this.finish(this.grid.cur);
  }
  draw(g, game) {
    rect(g, K.ink[1], 0, 0, 320, 224);
    for (let y = 16; y < 224; y += 8) for (let x = ((y / 8) % 2) * 8; x < 320; x += 16) rect(g, '#2a1d30', x, y, 8, 8);
    rect(g, K.coral[2], 0, 0, 320, 16); rect(g, K.coral[3], 0, 0, 320, 2);
    drawText(g, (this.o.title || 'CHOOSE AN ITEM').toUpperCase(), 8, 5, K.ink[0], 1, null);
    rect(g, K.ink[1], 296, 2, 20, 12); rect(g, K.coral[1], 297, 3, 18, 10); drawTextC(g, 'X', 306, 5, UI.text, 1, null);
    if (this.o.prompt) drawText(g, clip(this.o.prompt, 300), 14, 21, '#e8dcf0', 1, null);
    if (!this.ids.length) drawTextC(g, 'YOUR BAG HAS NOTHING THAT FITS.', 160, 84, '#e8dcf0', 1, null);
    this.grid.draw(g, game);
    panel(g, 14, 160, 292, 34, 'paper');
    const id = this.grid.cur, it = id && get('item', id);
    if (it) {
      if (it.icon && SPRITES[it.icon]) iconC(g, it.icon, 30, 177);
      drawText(g, clip(it.name.toUpperCase(), 230), 44, 165, K.ink[1], 1, null);
      wrapPx(it.desc || '', 250).slice(0, 2).forEach((l, i) => drawText(g, l, 44, 174 + i * 8, K.ink[3], 1, null));
      const ex = this.o.extra && this.o.extra(id); if (ex) drawTextR(g, clip(ex, 90), 300, 165, K.coral[1], 1, null);
    }
    button(g, 14, 198, 90, 16, this.o.cancelLabel || 'NEVER MIND', true); button(g, 216, 198, 90, 16, this.o.confirmLabel || 'CHOOSE', !!id, true);
  }
}
register('scene', 'sv2_pick', { make: (game, o, onDone) => new PickScene(game, o, onDone) });
export const pickItem = (game, o) => new Promise((res) => game.open('sv2_pick', o, res));

// ---------------------------------------------------------------- Grange display board
const SLOT = (i) => ({ x: 14 + (i % 3) * 40, y: 36 + Math.floor(i / 3) * 40, w: 38, h: 38 });
class GrangeScene {
  constructor(game, o = {}, onDone) {
    this.name = 'sv2_grange'; this.music = 'festival';
    Object.assign(this, { game, onDone, t: 0, board: Array(9).fill(null), slot: 0, msg: '', msgT: 0, ids: bagIds(game) });
    const last = (S(game).grange.lastBoard || []).filter((id) => game.count(id) > 0);
    last.slice(0, 9).forEach((id, i) => { if (this.left(id) > 0) this.board[i] = id; });
    this.grid = new ItemGrid(150, 40, 6, 5, 27); this.grid.set(this.ids);
  }
  used(id) { return this.board.filter((b) => b === id).length; }
  left(id) { return this.game.count(id) - this.used(id); }
  say(t) { this.msg = t; this.msgT = 2; }
  place(id) {
    if (!id) return;
    if (this.left(id) <= 0) return this.say('You have no more of those.');
    let s = this.board[this.slot] ? this.board.findIndex((b) => !b) : this.slot;
    if (s < 0) return this.say('The board is full. Tap a slot to take something off.');
    this.board[s] = id; this.game.sfx('blip');
    const nx = this.board.findIndex((b) => !b); this.slot = nx < 0 ? s : nx;
  }
  count() { return this.board.filter(Boolean).length; }
  finish(v) { this.game.scenes.pop(this); if (v) S(this.game).grange.lastBoard = v; this.game.sfx(v ? 'select' : 'back'); this.onDone && this.onDone(v); }
  update(dt, input) {
    this.t += dt; this.msgT -= dt;
    const k = input.pressed;
    if (k.has('escape') || k.has('b')) return this.finish(null);
    if (input.justDown && inside(input.mx, input.my, 294, 1, 24, 14)) return this.finish(null);
    if (k.has('backspace') || k.has('x')) { this.board[this.slot] = null; }
    if (k.has('j') && this.count()) return this.finish(this.board.filter(Boolean));
    if (input.justDown) {
      for (let i = 0; i < 9; i++) { const r = SLOT(i); if (inside(input.mx, input.my, r.x, r.y, r.w, r.h)) { if (this.board[i] && this.slot === i) { this.board[i] = null; this.game.sfx('back'); } this.slot = i; } }
      if (inside(input.mx, input.my, 14, 160, 56, 16)) { this.board.fill(null); this.slot = 0; this.game.sfx('back'); }
      if (inside(input.mx, input.my, 74, 160, 60, 16)) { if (this.count()) return this.finish(this.board.filter(Boolean)); this.say('Put at least one item on the board.'); }
    }
    const ev = this.grid.update(input, this.game);
    if (ev) this.place(this.grid.cur);
  }
  draw(g, game) {
    rect(g, K.wood[0], 0, 0, 320, 224);
    for (let y = 16; y < 224; y += 10) rect(g, K.wood[1], 0, y, 320, 1);
    rect(g, K.ribbon[2], 0, 0, 320, 16); rect(g, K.ribbon[3], 0, 0, 320, 2);
    drawText(g, 'GRANGE DISPLAY BOARD', 8, 5, K.paper[4], 1, null);
    rect(g, K.ink[1], 296, 2, 20, 12); rect(g, K.coral[1], 297, 3, 18, 10); drawTextC(g, 'X', 306, 5, UI.text, 1, null);
    rect(g, K.wood[3], 8, 22, 130, 134); rect(g, K.wood[4], 9, 23, 128, 2); rect(g, K.paper[3], 11, 28, 124, 124);
    drawText(g, 'TAP A SLOT, THEN AN ITEM', 14, 29, K.ink[3], 1, null);
    for (let i = 0; i < 9; i++) {
      const r = SLOT(i), id = this.board[i];
      rect(g, i === this.slot ? UI.gold : K.wood[2], r.x, r.y + 2, r.w, r.h - 2); rect(g, id ? K.paper[4] : K.paper[2], r.x + 1, r.y + 3, r.w - 2, r.h - 4);
      if (id) { const it = get('item', id); if (it && it.icon && SPRITES[it.icon]) iconC(g, it.icon, r.x + r.w / 2, r.y + r.h / 2 - 1); const st = starOf(game, id); if (st) rect(g, [0, '#c0c8d8', '#ffd76a', '#ff9ac0'][st], r.x + r.w - 7, r.y + 5, 4, 4); }
      else drawTextC(g, String(i + 1), r.x + r.w / 2, r.y + r.h / 2 - 2, K.paper[1], 1, null);
    }
    const sc = scoreBoard(game, this.board);
    button(g, 14, 160, 56, 16, 'CLEAR', this.count() > 0); button(g, 74, 160, 60, 16, 'JUDGE!', this.count() > 0, true);
    panel(g, 8, 180, 130, 38, 'paper');
    drawText(g, `ITEMS ${this.count()}/9   KINDS ${sc.kinds}`, 13, 184, K.ink[1], 1, null);
    drawText(g, `STARS ${sc.stars}  CROPS ${sc.crops}  FOOD ${sc.foods}`, 13, 193, K.ink[2], 1, null);
    rect(g, K.ink[1], 13, 204, 120, 8); rect(g, K.paper[1], 14, 205, 118, 6); rect(g, sc.total >= 80 ? K.butter[2] : K.mint[2], 14, 205, Math.round(118 * sc.total / 100), 6);
    drawText(g, 'YOUR BAG', 150, 25, K.paper[4], 1, null);
    this.grid.draw(g, game, (id) => this.left(id));
    const id = this.grid.cur;
    if (id) drawText(g, clip(itemName(id).toUpperCase(), 108), 200, 25, K.butter[3], 1, null);
    drawText(g, 'VARIETY, QUALITY, THEME AND A FULL BOARD.', 150, 200, K.paper[3], 1, null);
    drawText(g, 'GORO LIKES CROPS. MIKA LIKES FOOD.', 150, 208, K.paper[2], 1, null);
    if (this.msgT > 0) { panel(g, 30, 100, 260, 20, 'dark'); drawTextC(g, this.msg, 160, 107, UI.text, 1, null); }
  }
}
register('scene', 'sv2_grange', { make: (game, o, onDone) => new GrangeScene(game, o, onDone) });
export const openGrange = (game) => new Promise((res) => game.open('sv2_grange', {}, res));

// ---------------------------------------------------------------- result card
class ResultScene {
  constructor(game, o, onDone) { this.name = 'sv2_result'; this.music = 'festival'; Object.assign(this, { game, o, onDone, t: 0 }); game.sfx(o.rank && o.rank <= 3 ? 'sv2_ribbon' : 'chime'); }
  update(dt, input) {
    this.t += dt;
    if (this.t > 0.9 && (input.pressed.has('e') || input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('escape') || input.justDown)) { this.game.scenes.pop(this); this.onDone && this.onDone(); }
  }
  draw(g) {
    const o = this.o, t = this.t;
    rect(g, K.ink[1], 0, 0, 320, 224);
    for (let i = 0; i < 40; i++) { const a = i * 2.399, sp = 30 + (i * 53) % 90, tt = Math.min(t, 3); rect(g, [K.coral[3], K.butter[3], K.sky[3], K.mint[3]][i % 4], 160 + Math.cos(a) * sp * tt, 80 + Math.sin(a) * sp * tt * 0.7 + 50 * tt * tt, 2, 2); }
    panel(g, 40, 22, 240, 178, 'butter');
    drawTextC(g, (o.title || 'FESTIVAL').toUpperCase(), 160, 32, K.coral[1], 2, null);
    if (o.sub) drawTextC(g, clip(o.sub, 220), 160, 52, K.ink[2], 1, null);
    const rb = RIBBONS[o.rank];
    if (rb) {
      const sc = Math.min(1, t * 2), cx = 160, cy = 92;
      rect(g, rb.c, cx - 14 * sc - 2, cy + 8, 10, 26 * sc); rect(g, rb.c2, cx + 4, cy + 8, 10, 26 * sc);
      disc(g, cx, cy, 22 * sc, rb.c); disc(g, cx, cy, 16 * sc, rb.c2, 16 * sc); disc(g, cx, cy, 9 * sc, rb.c);
      drawTextC(g, `${rb.name.toUpperCase()} RIBBON`, cx, 130, K.ink[1], 1, null);
    } else if (o.score != null) drawTextC(g, 'THANKS FOR JOINING IN!', 160, 90, K.ink[2], 1, null);
    if (o.score != null) drawTextC(g, `SCORE ${Math.round(o.score * Math.min(1, t / 1.0))}`, 160, 142, K.ink[0], 2, null);
    (o.lines || []).slice(0, 4).forEach((l, i) => drawTextC(g, clip(l, 224), 160, 160 + i * 9, K.ink[2], 1, null));
    if (t > 0.9) drawTextC(g, 'TAP OR PRESS SPACE', 160, 190, K.coral[1], 1, null);
  }
}
register('scene', 'sv2_result', { make: (game, o, onDone) => new ResultScene(game, o, onDone) });
export const resultCard = (game, o) => new Promise((res) => game.open('sv2_result', o, res));

// ---------------------------------------------------------------- Festival Album (phone app)
const statusOf = (g, p) => {
  const att = Object.keys(g.state.festivals.attended || {}).some((k) => k.startsWith(p.id + '@')), plays = S(g).plays[p.id] || 0;
  return { att: att || plays > 0, plays, best: S(g).best[p.id], got: p.souv ? !!S(g).souv[p.souv] : null };
};
register('phoneApp', 'sv2_album', {
  name: 'Festivals', icon: 'sv2_i_album', order: 49,
  badge: (game) => game.festivalsOn().filter((f) => PIECES.some((p) => p.id === f.id)).length + momentsToday(game).length,
  open(game, app) { app.state.sel = app.state.sel || 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area, n = PIECES.length;
    if (k.has('arrowdown') || k.has('s')) st.sel = (st.sel + 1) % n;
    if (k.has('arrowup') || k.has('w')) st.sel = (st.sel + n - 1) % n;
    if (input.justDown) PIECES.forEach((_, i) => { if (inside(input.mx, input.my, x + 2, y + 2 + i * 11, 120, 11)) st.sel = i; });
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, sv = S(game), p = PIECES[st.sel];
    PIECES.forEach((q, i) => {
      const yy = y + 2 + i * 11, s = statusOf(game, q), on = i === st.sel;
      rect(g, on ? UI.gold : K.paper[2], x + 2, yy, 120, 10); rect(g, s.att ? K.mint[2] : K.paper[1], x + 4, yy + 3, 4, 4);
      drawText(g, clip(q.name.toUpperCase(), 84), x + 11, yy + 2, s.att ? K.ink[1] : K.ink[3], 1, null);
      if (s.best) { const rb = RIBBONS[s.best.rank]; if (rb) { rect(g, rb.c, x + 108, yy + 2, 6, 6); rect(g, rb.c2, x + 110, yy + 4, 2, 2); } }
      if (q.mini) drawText(g, '*', x + 116, yy + 2, K.coral[1], 1, null);
    });
    const bx = x + 128, bw = w - 130, s = statusOf(game, p);
    panel(g, bx, y + 2, bw, 140, 'paper');
    drawText(g, clip(p.name.toUpperCase(), bw - 12), bx + 6, y + 8, K.coral[1], 1, null);
    drawText(g, `${p.when.toUpperCase()}${p.mini ? '  (MINI EVENT)' : ''}`, bx + 6, y + 18, K.ink[3], 1, null);
    wrapPx(p.blurb, bw - 14).slice(0, 3).forEach((l, i) => drawText(g, l, bx + 6, y + 30 + i * 8, K.ink[1], 1, null));
    drawText(g, s.att ? `ATTENDED   PLAYED ${s.plays}X` : 'NOT ATTENDED YET', bx + 6, y + 60, s.att ? K.forest[2] : K.ink[3], 1, null);
    drawText(g, s.best ? `BEST SCORE ${s.best.score}  (YEAR ${s.best.year})` : 'BEST SCORE --', bx + 6, y + 70, K.ink[1], 1, null);
    drawText(g, 'RIBBONS', bx + 6, y + 82, K.ink[3], 1, null);
    const rs = Object.entries(sv.ribbons).filter(([k]) => k.startsWith(p.id + '@'));
    if (!rs.length) drawText(g, 'NONE YET', bx + 48, y + 82, K.ink[3], 1, null);
    rs.slice(0, 6).forEach(([k, r], i) => { const rb = RIBBONS[r.rank]; rect(g, rb.c, bx + 48 + i * 14, y + 81, 11, 9); rect(g, rb.c2, bx + 51 + i * 14, y + 83, 5, 5); drawText(g, 'Y' + k.split('@')[1], bx + 47 + i * 14, y + 92, K.ink[3], 1, null); });
    if (p.souv) { const it = get('item', p.souv); if (it && SPRITES[it.icon]) { g.globalAlpha = s.got ? 1 : 0.3; iconC(g, it.icon, bx + 14, y + 114); g.globalAlpha = 1; } drawText(g, s.got ? clip(it.name.toUpperCase(), bw - 36) : 'SOUVENIR: ???', bx + 28, y + 108, s.got ? K.forest[2] : K.ink[3], 1, null); drawText(g, s.got ? 'IN YOUR COLLECTION' : 'JOIN IN TO EARN IT', bx + 28, y + 118, K.ink[3], 1, null); }
    else drawText(g, 'NO SOUVENIR, JUST A WARM MEMORY', bx + 6, y + 112, K.ink[3], 1, null);
    const tot = PIECES.filter((q) => q.souv).length;
    drawText(g, `SOUVENIRS ${Object.keys(sv.souv).length}/${tot}   RIBBONS ${ribbonCount(game)} (BLUE ${ribbonCount(game, 1)})`, x + 4, y + 148, K.ink[1], 1, null);
    const sec = sv.secret; if (sec && sec.day === game.day && sec.to && !sec.gave) drawText(g, `SECRET FRIEND TODAY: ${get('npc', sec.to).name.toUpperCase()}`, x + 4, y + 158, K.coral[1], 1, null);
  },
});

// ---------------------------------------------------------------- backdrops
const dusk = ['#2a1c3c', '#5a2c4a', '#a8486a', '#e8806a', '#ffb27a'];
const glow = (g, x, y, r, c, a) => { g.globalAlpha = a; disc(g, x, y, r, c); g.globalAlpha = 1; };
register('backdrop', 'sv2_luau', { music: 'beach', draw(g, game, t) {
  sky(g, dusk, 0, 120); disc(g, 250, 110, 16, '#ffd89a'); sea(g, 112, ['#3a2a58', '#5a3a6a', '#8a4a74', '#e8806a'], t, 150);
  brect(g, K.sand[3], 0, 150, 320, 74); brect(g, K.sand[2], 0, 150, 320, 3);
  for (const x of [28, 292]) { brect(g, K.wood[1], x, 108, 3, 46); glow(g, x + 1, 104, 14 + Math.sin(t * 9 + x) * 2, '#ffd76a', 0.25); disc(g, x + 1, 104, 4 + (Math.floor(t * 8 + x) % 2), '#ffb04a'); }
  // the communal pot over a fire
  for (let i = 0; i < 5; i++) { const fx = 150 + i * 5, h = 10 + ((Math.floor(t * 9) + i * 3) % 6); brect(g, i % 2 ? '#ffd76a' : '#ff8a3a', fx, 188 - h, 4, h); }
  disc(g, 160, 176, 26, K.charcoal[1], 18); disc(g, 160, 170, 24, K.charcoal[2], 14); brect(g, K.charcoal[0], 134, 168, 52, 3); disc(g, 160, 168, 20, '#e0a050', 6);
  for (let i = 0; i < 6; i++) { const s = (t * 0.6 + i / 6) % 1; g.globalAlpha = 1 - s; disc(g, 150 + i * 4 + Math.sin(s * 9 + i) * 3, 160 - s * 40, 3 + s * 3, K.paper[4]); g.globalAlpha = 1; }
  npc(g, 'mika', 'down', 120, 196, t); npc(g, 'kai', 'down', 198, 198, t); npc(g, 'jun', 'down', 232, 192, t); npc(g, 'hina', 'down', 90, 192, t); misa(g, 'up', 160, 214, t);
} });
register('backdrop', 'sv2_jellies', { music: 'night', draw(g, game, t) {
  sky(g, ['#070a1e', '#0c1230', '#141c44'], 0, 110); stars(g, t, 60, 100, 3); moon(g, 262, 34, 11);
  sea(g, 106, ['#050c22', '#0a1634', '#102048', '#1c3060'], t, 190);
  for (let i = 0; i < 11; i++) {
    const x = (i * 41 + t * (5 + i % 3 * 2)) % 360 - 20, y = 126 + (i * 29) % 56 + Math.sin(t * 1.3 + i) * 5, s = 0.6 + (y - 120) / 90, pulse = 0.5 + Math.sin(t * 2 + i) * 0.25, c = [K.water[4], K.lilac[3], K.sakura[3], K.mint[3]][i % 4];
    glow(g, x, y, 14 * s, c, 0.12 * pulse + 0.06); glow(g, x, y, 8 * s, c, 0.2 + pulse * 0.15);
    disc(g, x, y, 5 * s, c, 4 * s); brect(g, K.paper[4], x - 2 * s, y - 2 * s, 2 * s, s);
    for (let k = -2; k <= 2; k++) { g.globalAlpha = 0.5; brect(g, c, x + k * 2 * s, y + 4 * s, 1, (5 + Math.sin(t * 3 + k + i) * 2) * s); g.globalAlpha = 1; }
  }
  brect(g, K.sand[0], 0, 188, 320, 36); brect(g, K.sand[1], 0, 188, 320, 2); skyline(g, 106, '#0a0f26', 6);
  misa(g, 'up', 150, 214, t); npc(g, 'hina', 'up', 188, 216, t);
} });
register('backdrop', 'sv2_firefly', { music: 'night', draw(g, game, t) {
  sky(g, ['#070e1c', '#0c1a2c', '#12283a'], 0, 120); stars(g, t, 25, 70, 8);
  brect(g, '#0b1a1a', 0, 118, 320, 106); disc(g, 200, 160, 60, '#0e2a3a', 14); disc(g, 200, 160, 54, '#12384a', 11);
  for (let x = 0; x < 320; x += 6) brect(g, '#06100f', x, 150 + Math.sin(x * 0.3) * 4 + (x % 4), 3, 14);
  for (let i = 0; i < 34; i++) { const x = (i * 53 + Math.sin(t * 0.6 + i) * 18) % 320, y = 110 + (i * 37) % 90 + Math.cos(t * 0.7 + i * 2) * 8, on = (Math.sin(t * 2.2 + i * 1.7) + 1) / 2; glow(g, x, y, 6, '#c8ff70', 0.14 * on); brect(g, on > 0.35 ? '#e8ff9a' : '#4a6a3a', x, y, 2, 2); }
  misa(g, 'up', 120, 212, t); npc(g, 'hina', 'up', 150, 214, t);
} });
register('backdrop', 'sv2_nye', { music: 'festival', draw(g, game, t) {
  sky(g, ['#0a0820', '#141036', '#201a4c'], 0, 160); stars(g, t, 40, 110, 12);
  const cols = [K.ribbon, K.butter, K.sky, K.sakura, K.mint, K.lilac];
  for (let k = 0; k < 5; k++) { const cyc = Math.floor((t * 0.8 + k * 0.6)), p = (t * 0.8 + k * 0.6) % 1, cx = 40 + ((cyc * 97 + k * 61) % 240), cy = 34 + ((cyc * 31 + k * 17) % 50); if (p > 0.1) { g.globalAlpha = 1 - p; for (let a = 0; a < 18; a++) { const an = a / 18 * 6.283, r = (p - 0.1) * 46; brect(g, cols[(cyc + k) % 6][3], cx + Math.cos(an) * r, cy + Math.sin(an) * r + p * 14, 2, 2); } g.globalAlpha = 1; } }
  skyline(g, 168, '#10091f', 3);
  brect(g, '#1a1228', 140, 70, 40, 100); brect(g, '#241a38', 144, 74, 32, 92); brect(g, '#1a1228', 134, 64, 52, 10); brect(g, '#241a38', 150, 52, 20, 14);
  disc(g, 160, 92, 12, K.paper[4]); disc(g, 160, 92, 10, '#fff1d6'); brect(g, K.ink[1], 159, 84, 1, 8); brect(g, K.ink[1], 159, 91, 7, 1);
  brect(g, '#10091f', 0, 168, 320, 56);
  for (let i = 0; i < 9; i++) { const x = 20 + i * 36; brect(g, '#1c1230', x, 196 + (i % 3) * 4, 14, 20); disc(g, x + 7, 192 + (i % 3) * 4, 6, '#241a3a'); }
  npc(g, 'kai', 'up', 110, 214, t); npc(g, 'suzu', 'up', 210, 214, t); misa(g, 'up', 160, 218, t);
} });
register('backdrop', 'sv2_snowfort', { music: 'town', draw(g, game, t) {
  sky(g, ['#9db8d8', '#b8d0e8', '#d6e6f4'], 0, 120); brect(g, K.snow[3], 0, 118, 320, 106); brect(g, '#ffffff', 0, 118, 320, 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6 - r; c++) { const x = 100 + r * 16 + c * 32, y = 168 - r * 18; brect(g, K.snow[1], x, y + 14, 31, 3); brect(g, '#ffffff', x, y, 30, 15); brect(g, K.snow[2], x + 1, y + 1, 28, 4); }
  brect(g, K.ribbon[2], 168, 100, 2, 14); brect(g, K.ribbon[3], 170, 100, 10, 6);
  for (let i = 0; i < 50; i++) brect(g, '#ffffff', (i * 47 + t * (10 + i % 5 * 4) * 0.4) % 320, (i * 29 + t * (18 + i % 4 * 6)) % 224, 2, 2);
  misa(g, 'right', 80, 206, t); npc(g, 'kai', 'left', 250, 206, t);
} });
register('backdrop', 'sv2_kite', { music: 'beach', draw(g, game, t) {
  sky(g, ['#7fb2e0', '#9ccaec', '#bfe6f5'], 0, 130); sea(g, 120, ['#2d5f8f', '#3f8fb8', '#6cc4dc', '#a8e4f0'], t, 160); brect(g, K.sand[3], 0, 160, 320, 64);
  for (let i = 0; i < 3; i++) { const x = 90 + i * 70 + Math.sin(t * 0.9 + i) * 14, y = 40 + i * 14 + Math.cos(t * 1.1 + i) * 6, c = [K.ribbon, K.butter, K.mint][i]; for (let k = 0; k < 9; k++) { brect(g, c[2], x - k, y - 9 + k, 2 * k + 1, 1); brect(g, c[3], x - k, y + k, 2 * (9 - k) + 1, 1); } for (let k = 0; k < 8; k++) brect(g, K.paper[3], x - 1 + Math.sin(t * 3 + k + i) * 2, y + 10 + k * 4, 2, 2); }
  misa(g, 'up', 150, 210, t);
} });
