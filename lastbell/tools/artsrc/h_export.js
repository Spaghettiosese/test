
/* ========================================================== EXPORT */
const _renderers = new Map();
const Art = {
  TW: TW, TH: TH, version: '2.0',
  quality: { grain: true },
  project: project, unproject: unproject, worldSize: worldSize,
  getRenderer: function (loc) {
    loc = loc || {}; const k = loc.id || 'x';
    let R = _renderers.get(k); if (!R) { R = makeRenderer(loc); _renderers.set(k, R); }
    R.loc = loc; return R;
  },
  drawPortrait: function (canvas, look, opts) { return typeof drawPortraitImpl === 'function' ? drawPortraitImpl(canvas, look, opts) : null; },
  portraitDataURL: function (look, opts, size) { const c = mk(size || 128, size || 128); Art.drawPortrait(c, look, opts); return c.toDataURL('image/png'); },
  drawTitle: function (ctx, w, h, t) { return typeof drawTitleImpl === 'function' ? drawTitleImpl(ctx, w, h, t) : null; },
  drawEnding: function (ctx, w, h, t, id) { return typeof drawEndingImpl === 'function' ? drawEndingImpl(ctx, w, h, t, id) : null; },
  drawDayCard: function (ctx, w, h, t, dayN) { return typeof drawDayCardImpl === 'function' ? drawDayCardImpl(ctx, w, h, t, dayN) : null; },
  drawItemIcon: function (ctx, x, y, size, id) { return typeof drawItemIconImpl === 'function' ? drawItemIconImpl(ctx, x, y, size, id) : null; },
  /* helpers for tools / engine */
  getFigure: getFigure,
  timeTint: timeTint,
  prebake: function (loc, time) { return Art.getRenderer(loc).prebake(time); },
  clearCache: function () { _scenes.clear(); _spr.clear(); _tab.clear(); _cards.clear(); }
};
(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this)).Art = Art;
})();
