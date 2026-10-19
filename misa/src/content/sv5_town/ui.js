// listApp(): a small phone-app factory used by the Town Growth apps. A page is built every frame:
//   page.build(game, st) -> { list?: [{ t, c? }] (selectable, st.sel), lines: [string | { t, c }], bars?: [{ label, v, max, c }], acts: [{ label, run(game), off? }] }
// Controls: left/right (A/D) change page, up/down (W/S) move the list or scroll, 1-4 press the buttons, the pointer works too.
import { register } from '../../core/registry.js';
import { rect, panel, btn, drawText, fit, wrapPx, C, RAMPS, K, inside } from '../economy/gfx.js';

export function listApp(id, def) {
  register('phoneApp', id, {
    name: def.name, icon: def.icon, order: def.order, when: def.when, badge: def.badge,
    open(game, app) { Object.assign(app.state, { page: def.start || 0, sel: 0, top: 0 }); },
    update(dt, input, game, app) {
      const st = app.state, { x, y, w, h } = app.area, pages = def.pages;
      const go = (d) => { st.page = (st.page + d + pages.length) % pages.length; st.sel = 0; st.top = 0; game.sfx('blip'); };
      if (K.left(input)) go(-1); if (K.right(input)) go(1);
      if (input.justDown && inside(input.mx, input.my, x, y, w, 14)) { const i = Math.floor((input.mx - x) / (w / pages.length)); if (i !== st.page) { st.page = i; st.sel = 0; st.top = 0; } }
      const pg = pages[st.page].build(game, st), n = pg.list ? pg.list.length : 0;
      if (n) {
        if (K.down(input)) st.sel = Math.min(n - 1, st.sel + 1); if (K.up(input)) st.sel = Math.max(0, st.sel - 1);
        if (input.justDown) { const i = Math.floor((input.my - (y + 18)) / 12) + (st.ltop || 0); if (input.mx < x + 140 && i >= 0 && i < n && input.my > y + 18 && input.my < y + h - 20) st.sel = i; }
        st.ltop = Math.max(0, st.sel - 8);
      } else { if (K.down(input)) st.top++; if (K.up(input)) st.top = Math.max(0, st.top - 1); }
      pg.acts.forEach((a, i) => {
        const bx = x + 2 + i * Math.floor(w / pg.acts.length), bw = Math.floor(w / pg.acts.length) - 4;
        if (a.off) return;
        if (input.pressed.has(String(i + 1)) || (input.justDown && inside(input.mx, input.my, bx, y + h - 17, bw, 15))) { Promise.resolve(a.run(game, st)).catch((e) => console.error(id, e)); }
      });
    },
    draw(g, game, app) {
      const st = app.state, { x, y, w, h } = app.area, pages = def.pages, pg = pages[st.page].build(game, st);
      const tw = w / pages.length;
      pages.forEach((p, i) => { rect(g, i === st.page ? C.gold : RAMPS.paper[2], x + i * tw, y, tw - 1, 13); rect(g, C.ink, x + i * tw, y + 13, tw - 1, 1); drawText(g, fit(p.name, tw - 6), x + i * tw + 3, y + 3, C.ink, 1, null); });
      const by = y + 18, bh = h - 40;
      let lx = x + 2, lw = w - 4;
      if (pg.list) {
        lw = 134; panel(g, x, by - 2, lw + 4, bh + 4, 'paper');
        pg.list.slice(st.ltop || 0, (st.ltop || 0) + 9).forEach((r, i) => { const yy = by + i * 12, sel = (st.ltop || 0) + i === st.sel; if (sel) rect(g, RAMPS.butter[3], x + 2, yy - 1, lw, 11); drawText(g, fit(r.t, lw - 6), x + 4, yy + 1, r.c || C.ink, 1, null); });
        lx = x + lw + 10; lw = w - lw - 12;
      } else panel(g, x, by - 2, w, bh + 4, 'paper');
      let yy = by; const rows = [];
      for (const l of pg.lines || []) { const t = typeof l === 'string' ? l : l.t, c = typeof l === 'string' ? C.ink : l.c || C.ink; for (const s of t === '' ? [''] : wrapPx(t, lw - 6)) rows.push([s, c]); }
      const cap = Math.floor((bh - (pg.bars ? pg.bars.length * 13 : 0) - (pg.chart ? 44 : 0)) / 10), top = Math.min(st.top || 0, Math.max(0, rows.length - cap)); st.top = top;
      for (const [s, c] of rows.slice(top, top + cap)) { drawText(g, s, lx + 3, yy + 1, c, 1, null); yy += 10; }
      if (pg.chart) { const ch = pg.chart, mx = Math.max(...ch), mn = Math.min(...ch), cw = Math.max(2, Math.floor((lw - 8) / ch.length)), cy = by + bh - (pg.bars ? pg.bars.length * 13 : 0) - 42;
        ch.forEach((v, i) => { const hh = 4 + Math.round(34 * (v - mn) / Math.max(1, mx - mn)); rect(g, i === ch.length - 1 ? C.coral : RAMPS.sky[2], lx + 4 + i * cw, cy + 38 - hh, cw - 1, hh); }); }
      yy = by + bh - (pg.bars ? pg.bars.length * 13 : 0);
      for (const b of pg.bars || []) { drawText(g, fit(b.label, 80), lx + 3, yy + 1, C.ink, 1, null); const bw = lw - 90; rect(g, C.ink, lx + 84, yy, bw, 9); rect(g, RAMPS.paper[2], lx + 85, yy + 1, bw - 2, 7); rect(g, b.c || C.mint, lx + 85, yy + 1, Math.round((bw - 2) * Math.max(0, Math.min(1, b.v / (b.max || 1)))), 7); yy += 13; }
      pg.acts.forEach((a, i) => { const bw = Math.floor(w / pg.acts.length) - 4; btn(g, x + 2 + i * Math.floor(w / pg.acts.length), y + h - 17, bw, 15, `${i + 1} ${a.label}`, { disabled: !!a.off, tone: a.tone }); });
    },
  });
}
