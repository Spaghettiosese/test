// Tiny list/tap helpers for the phone apps: 16 px rows, wheel + mouse-drag scrolling (touch drags already arrive as wheel ticks).
import { UI, rect, inside, drawText, scrollbar } from '../../ui/ui.js';
import { clamp } from './state.js';
export const RH = 16;
// zone {x,y,w,h}; st {top, sel}. Returns the index tapped this frame or -1.
export function scrollList(input, st, n, zone) {
  const vis = Math.floor(zone.h / RH), maxTop = Math.max(0, n - vis);
  st.top = clamp(st.top || 0, 0, maxTop);
  const inz = inside(input.mx, input.my, zone.x, zone.y, zone.w + 18, zone.h);
  if (input.wheel && inz) st.top = clamp(st.top + Math.sign(input.wheel), 0, maxTop);
  let tapped = -1;
  if (input.justDown && inz) { st.dragY = input.my; st.dragTop = st.top; st.dragging = false; const i = st.top + Math.floor((input.my - zone.y) / RH); if (i < n && input.mx < zone.x + zone.w) tapped = i; }
  if (input.down && st.dragY != null) { const d = input.my - st.dragY; if (Math.abs(d) > 7) st.dragging = true; if (st.dragging) st.top = clamp(st.dragTop - Math.round(d / RH), 0, maxTop); } else st.dragY = null;
  return tapped;
}
export function keyNav(input, st, n, vis) {
  const k = input.pressed; if (!n) return;
  if (k.has('arrowdown') || k.has('s')) st.sel = clamp((st.sel || 0) + 1, 0, n - 1);
  if (k.has('arrowup') || k.has('w')) st.sel = clamp((st.sel || 0) - 1, 0, n - 1);
  st.sel = clamp(st.sel || 0, 0, n - 1);
  if (st.sel < st.top) st.top = st.sel; if (st.sel >= st.top + vis) st.top = st.sel - vis + 1;
}
export function listRows(g, st, zone, n, label) {
  const vis = Math.floor(zone.h / RH);
  for (let r = 0; r < vis; r++) {
    const i = st.top + r; if (i >= n) break; const yy = zone.y + r * RH, row = label(i);
    if (i === st.sel) rect(g, UI.gold, zone.x, yy, zone.w, RH - 1); else if (r % 2) rect(g, UI.paper2, zone.x, yy, zone.w, RH - 1);
    if (row.dot) rect(g, row.dot, zone.x + 2, yy + 4, 6, 6);
    drawText(g, String(row.text).slice(0, Math.floor((zone.w - 14) / 4)).toUpperCase(), zone.x + 11, yy + 4, row.dim ? UI.dim : UI.ink, 1, null);
    if (row.right) drawText(g, row.right, zone.x + zone.w - 3 - row.right.length * 4, yy + 4, UI.accent2, 1, null);
  }
  scrollbar(g, zone.x + zone.w + 4, zone.y, zone.h, st.top, vis, n);
}
// Chip row: returns the tapped chip index or -1. chips: strings; active index.
export function chips(g, input, x, y, w, labels, active, h = 14) {
  const cw = Math.floor(w / labels.length); let hit = -1;
  labels.forEach((l, i) => { const cx = x + i * cw; rect(g, i === active ? UI.accent : UI.paper2, cx, y, cw - 2, h); drawText(g, l.toUpperCase(), cx + Math.max(2, Math.floor((cw - 2 - l.length * 4) / 2)), y + 4, i === active ? UI.text : UI.ink, 1, null); if (input && input.justDown && inside(input.mx, input.my, cx, y, cw - 2, h)) hit = i; });
  return hit;
}
