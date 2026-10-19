// Photo mode and the Snapshots album. Open with P, the small P button, or Snapshots in the phone: the HUD hides, the camera pans
// (arrows/WASD or drag) within the map, and you pick a filter (sepia, dreamy, night-vision), a frame and up to 8 stickers.
// Shots are stored in the save as 80x56 thumbnails: 12-bit colour + run-length text (encodeThumb / decodeThumb), 18 kept.
import { register, get, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, drawTextC, inside } from '../../ui/ui.js';
import { dateText } from '../../core/time.js';
import { shape } from '../../minigames/sv5_meta/games.js';
import { S, idle, clamp } from './state.js';
import { chips } from './ui.js';

export const TW = 80, TH = 56, MAX_SNAPS = 18;
export const FILTERS = ['none', 'sepia', 'dreamy', 'night'], FRAMES = ['none', 'polaroid', 'film', 'hearts', 'cozy'], STICKERS = ['star', 'heart', 'sparkle', 'flower', 'sun', 'paw'];

// ---------------------------------------------------------------- pure pixel helpers (testable in node)
export function applyFilter(d, kind) {
  if (kind === 'none') return d;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], l = 0.3 * r + 0.59 * g + 0.11 * b;
    if (kind === 'sepia') { d[i] = Math.min(255, l * 1.07 + 24); d[i + 1] = Math.min(255, l * 0.86 + 14); d[i + 2] = l * 0.62; }
    else if (kind === 'dreamy') { d[i] = Math.min(255, r * 0.8 + 70); d[i + 1] = Math.min(255, g * 0.78 + 52); d[i + 2] = Math.min(255, b * 0.85 + 70); }
    else if (kind === 'night') { const v = Math.min(255, l * 1.5 + 8); d[i] = v * 0.18; d[i + 1] = v; d[i + 2] = v * 0.3; if ((i / 4 / 320 | 0) % 2) { d[i + 1] *= 0.86; } }
  }
  return d;
}
export function downscale(src, sw, sh, w = TW, h = TH) {
  const out = new Uint8ClampedArray(w * h * 4), fx = sw / w, fy = sh / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let sy = Math.floor(y * fy); sy < Math.max(Math.floor(y * fy) + 1, Math.floor((y + 1) * fy)); sy++) for (let sx = Math.floor(x * fx); sx < Math.max(Math.floor(x * fx) + 1, Math.floor((x + 1) * fx)); sx++) { const o = (sy * sw + sx) * 4; r += src[o]; g += src[o + 1]; b += src[o + 2]; n++; }
    const o = (y * w + x) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
  }
  return out;
}
const hx = (v) => (v >> 4).toString(16);
export function encodeThumb(d, w = TW, h = TH) {
  let s = '', last = '', run = 0;
  const flush = () => { if (run) s += last + run.toString(36) + ';'; };
  for (let i = 0; i < w * h; i++) { const c = hx(d[i * 4]) + hx(d[i * 4 + 1]) + hx(d[i * 4 + 2]); if (c === last) run++; else { flush(); last = c; run = 1; } }
  flush(); return s;
}
export function decodeThumb(s, w = TW, h = TH) {
  const out = new Uint8ClampedArray(w * h * 4); let p = 0, i = 0;
  while (i < s.length && p < w * h) {
    const c = s.substr(i, 3), e = s.indexOf(';', i), run = parseInt(s.slice(i + 3, e), 36); i = e + 1;
    for (let k = 0; k < run && p < w * h; k++, p++) { out[p * 4] = parseInt(c[0], 16) * 17; out[p * 4 + 1] = parseInt(c[1], 16) * 17; out[p * 4 + 2] = parseInt(c[2], 16) * 17; out[p * 4 + 3] = 255; }
  }
  return out;
}
export function saveSnap(g, data, meta = {}) {
  const s = S(g); const snap = { id: ++s.snapSeq, day: g.day, map: g.state.map || '', filter: meta.filter || 'none', frame: meta.frame || 'none', stickers: meta.stickers || 0, data };
  s.snaps.unshift(snap); while (s.snaps.length > MAX_SNAPS) s.snaps.pop();
  g.stat('sv5Snaps'); if (snap.filter !== 'none') g.stat('sv5FilterShots'); if (snap.frame !== 'none') g.stat('sv5FramedShots'); if (snap.stickers) g.stat('sv5StickerShots');
  g.bus.emit('sv5Snap', { id: snap.id }); return snap;
}
export const deleteSnap = (g, id) => { const s = S(g); const n = s.snaps.length; s.snaps = s.snaps.filter((x) => x.id !== id); return n !== s.snaps.length; };

// ---------------------------------------------------------------- frames and stickers
function drawFrame(g, kind, t) {
  if (kind === 'polaroid') { rect(g, '#fffaf0', 0, 0, 320, 10); rect(g, '#fffaf0', 0, 0, 10, 224); rect(g, '#fffaf0', 310, 0, 10, 224); rect(g, '#fffaf0', 0, 186, 320, 38); }
  else if (kind === 'film') { rect(g, '#14101a', 0, 0, 320, 16); rect(g, '#14101a', 0, 208, 320, 16); for (let x = 4; x < 320; x += 14) { rect(g, '#f0e8d8', x, 5, 8, 6); rect(g, '#f0e8d8', x, 213, 8, 6); } }
  else if (kind === 'hearts') { rect(g, '#f7a1b1', 0, 0, 320, 6); rect(g, '#f7a1b1', 0, 218, 320, 6); rect(g, '#f7a1b1', 0, 0, 6, 224); rect(g, '#f7a1b1', 314, 0, 6, 224); for (let x = 12; x < 320; x += 24) { drawHeart(g, x, 3, '#fff'); drawHeart(g, x, 221, '#fff'); } }
  else if (kind === 'cozy') { rect(g, '#8a6a4a', 0, 0, 320, 8); rect(g, '#8a6a4a', 0, 216, 320, 8); rect(g, '#8a6a4a', 0, 0, 8, 224); rect(g, '#8a6a4a', 312, 0, 8, 224); rect(g, '#d8b078', 2, 2, 316, 2); rect(g, '#d8b078', 2, 220, 316, 2); for (const [x, y] of [[0, 0], [310, 0], [0, 214], [310, 214]]) rect(g, '#e8c050', x, y, 10, 10); }
}
function drawHeart(g, x, y, c) { rect(g, c, x - 2, y - 1, 2, 1); rect(g, c, x + 1, y - 1, 2, 1); rect(g, c, x - 2, y, 5, 1); rect(g, c, x - 1, y + 1, 3, 1); rect(g, c, x, y + 2, 1, 1); }
function drawSticker(g, kind, x, y, t) {
  if (kind === 'star') shape(g, 'star', x, y, '#ffd76a', '#fff6c0', t);
  else if (kind === 'heart') { for (let i = 0; i < 2; i++) drawHeart(g, x, y, i ? '#f7a1b1' : '#e0506a'); rect(g, '#e0506a', x - 3, y - 2, 7, 3); rect(g, '#e0506a', x - 2, y + 1, 5, 2); rect(g, '#e0506a', x - 1, y + 3, 3, 1); }
  else if (kind === 'sparkle') { rect(g, '#ffffff', x - 1, y - 6, 3, 13); rect(g, '#ffffff', x - 6, y - 1, 13, 3); rect(g, '#ffe9a0', x - 1, y - 1, 3, 3); }
  else if (kind === 'flower') { for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) rect(g, '#f7a1b1', x + dx - 2, y + dy - 2, 4, 4); rect(g, '#ffd76a', x - 1, y - 1, 3, 3); }
  else if (kind === 'sun') { shape(g, 'ball', x, y, '#ffd76a', '#fff6c0', t); for (let a = 0; a < 8; a++) rect(g, '#ffd76a', x + Math.round(Math.cos(a * Math.PI / 4) * 8), y + Math.round(Math.sin(a * Math.PI / 4) * 8), 2, 2); }
  else if (kind === 'paw') shape(g, 'paw', x, y, '#d8a070', '#f0c8a0', t);
}

// ---------------------------------------------------------------- the photo scene
const BTNS = ['FILTER', 'FRAME', 'STICKER', 'CLEAR', 'SHOT', 'EXIT'];
class PhotoScene {
  constructor(game) { Object.assign(this, { name: 'sv5_photo', opaque: false, game, filter: 0, frame: 0, stk: -1, placed: [], shoot: false, flash: 0, t: 0, msg: '', lx: null, ly: null, pausesTime: true }); }
  enter(g) { g.hideHud = true; g.sfx('phone'); this.cam0 = g.world ? { ...g.world.cam } : null; }
  exit(g) { g.hideHud = false; }
  pan(dx, dy) { const w = this.game.world; if (!w) return; const m = w.map; w.cam.x = clamp(w.cam.x + dx, 0, Math.max(0, m.pw * 2 - 320)); w.cam.y = clamp(w.cam.y + dy, 0, Math.max(0, m.ph * 2 - 224)); }
  press(i) {
    if (i === 0) this.filter = (this.filter + 1) % FILTERS.length; else if (i === 1) this.frame = (this.frame + 1) % FRAMES.length;
    else if (i === 2) this.stk = this.stk + 1 >= STICKERS.length ? -1 : this.stk + 1; else if (i === 3) this.placed = [];
    else if (i === 4) this.shoot = true; else this.game.scenes.pop(this);
    this.game.sfx('blip');
  }
  update(dt, input, game) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 2); const k = input.keys, sp = 130 * dt;
    this.pan(((k.has('arrowright') || k.has('d')) - (k.has('arrowleft') || k.has('a'))) * sp, ((k.has('arrowdown') || k.has('s')) - (k.has('arrowup') || k.has('w'))) * sp);
    const p = input.pressed;
    if (p.has('1')) this.press(0); if (p.has('2')) this.press(1); if (p.has('3')) this.press(2); if (p.has('c')) this.press(3); if (p.has('escape')) return this.press(5); if (p.has('enter') || p.has(' ')) this.press(4);
    if (input.justDown) {
      if (input.my >= 200) { const i = Math.floor(input.mx / (320 / BTNS.length)); this.press(clamp(i, 0, BTNS.length - 1)); }
      else if (this.stk >= 0 && this.placed.length < 8) { this.placed.push({ k: STICKERS[this.stk], x: input.mx, y: input.my }); game.sfx('chime'); }
      this.lx = input.mx; this.ly = input.my;
    } else if (input.down && this.stk < 0 && input.my < 200 && this.lx !== null) { this.pan(this.lx - input.mx, this.ly - input.my); this.lx = input.mx; this.ly = input.my; } else if (!input.down) this.lx = null;
  }
  draw(g, game) {
    const f = FILTERS[this.filter];
    if (f !== 'none' && g.getImageData) { const cw = g.canvas.width, ch = g.canvas.height, id = g.getImageData(0, 0, cw, ch); applyFilter(id.data, f); g.putImageData(id, 0, 0); }
    for (const s of this.placed) drawSticker(g, s.k, s.x, s.y, this.t);
    drawFrame(g, FRAMES[this.frame], this.t);
    if (this.shoot) {
      this.shoot = false;
      if (g.getImageData) { const cw = g.canvas.width, ch = g.canvas.height, id = g.getImageData(0, 0, cw, ch); const data = encodeThumb(downscale(id.data, cw, ch)); saveSnap(game, data, { filter: f, frame: FRAMES[this.frame], stickers: this.placed.length }); this.flash = 1; this.msg = 'SAVED TO SNAPSHOTS'; game.sfx('chime'); game.toast('Snapshot saved', 'i_camera'); }
      else this.msg = 'CANNOT CAPTURE HERE';
    }
    if (this.flash > 0) { g.globalAlpha = this.flash; rect(g, '#ffffff', 0, 0, 320, 224); g.globalAlpha = 1; }
    rect(g, '#2b1d2ee8', 0, 200, 320, 24);
    BTNS.forEach((b, i) => { const x = i * (320 / BTNS.length); rect(g, i === 4 ? UI.accent : '#46365c', x + 2, 203, 320 / BTNS.length - 4, 18); const label = i === 0 ? FILTERS[this.filter] : i === 1 ? FRAMES[this.frame] : i === 2 ? (this.stk < 0 ? 'sticker' : STICKERS[this.stk]) : b.toLowerCase(); drawTextC(g, label.toUpperCase(), x + 160 / BTNS.length * 1 - 0 + 0, 209, UI.text, 1, null); });
    drawText(g, this.stk >= 0 ? 'TAP TO PLACE A STICKER' : 'DRAG OR ARROWS TO LOOK AROUND', 6, 190, '#ffffff', 1, '#000000');
    if (this.msg) drawText(g, this.msg, 214, 190, '#ffe9a0', 1, '#000000');
  }
}
register('scene', 'sv5_photo', { make: (game) => new PhotoScene(game) });
register('system', 'sv5_photo', { init(game) { game.sv5Photo = () => { if (idle(game)) game.open('sv5_photo'); }; } });

// ---------------------------------------------------------------- Snapshots album
const CACHE = new Map();
function thumbCanvas(snap) {
  if (typeof document === 'undefined') return null;
  const key = snap.id + snap.data.length; if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d'), id = x.createImageData(TW, TH); id.data.set(decodeThumb(snap.data)); x.putImageData(id, 0, 0); CACHE.set(key, c); return c;
}
register('phoneApp', 'sv5_album', {
  name: 'Snapshots', icon: 'i_camera', order: 51,
  open(game, app) { Object.assign(app.state, { sel: 0, row: 0, view: false, capture: false }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, list = S(game).snaps, k = input.pressed;
    if (st.view) { if (input.justDown || k.has('escape') || k.has('enter')) { st.view = false; st.capture = false; } return; }
    if (input.justDown && inside(input.mx, input.my, x + 176, y + 120, 112, 18)) { app.scene.close(); game.sv5Photo && game.sv5Photo(); return; }
    if (!list.length) return;
    const cols = 2;
    if (k.has('arrowright') || k.has('d')) st.sel = Math.min(list.length - 1, st.sel + 1); if (k.has('arrowleft') || k.has('a')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + cols); if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - cols);
    if (input.wheel) st.row = clamp(st.row + Math.sign(input.wheel), 0, Math.max(0, Math.ceil(list.length / cols) - 2));
    if (input.justDown) {
      if (inside(input.mx, input.my, x + 176, y + 98, 112, 18)) { deleteSnap(game, list[st.sel].id); st.sel = Math.max(0, st.sel - 1); game.sfx('back'); return; }
      const cx = Math.floor((input.mx - x) / 86), cy = Math.floor((input.my - y - 14) / 60);
      if (cx >= 0 && cx < cols && cy >= 0 && cy < 2 && input.mx < x + 172) { const i = (st.row + cy) * cols + cx; if (i < list.length) { if (st.sel === i) { st.view = true; st.capture = true; } st.sel = i; } }
    }
    if (k.has('enter') || k.has('e')) { st.view = true; st.capture = true; }
    st.row = clamp(st.row, Math.max(0, Math.floor(st.sel / cols) - 1), Math.floor(st.sel / cols));
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = S(game).snaps;
    rect(g, UI.accent, x, y, 292, 12); drawText(g, `SNAPSHOTS ${list.length}/${MAX_SNAPS}`, x + 4, y + 3, UI.text, 1, null);
    if (st.view && list[st.sel]) { const c = thumbCanvas(list[st.sel]); rect(g, '#14101a', x, y + 12, 292, 160); if (c) g.drawImage(c, x + 26, y + 14, 240, 168 - 12); drawTextC(g, 'TAP TO CLOSE', x + 146, y + 160, UI.text, 1, null); return; }
    if (!list.length) { drawText(g, 'NO PHOTOS YET.', x + 8, y + 24, UI.dim, 1, null); drawText(g, 'PRESS P IN THE WORLD, OR TAP BELOW.', x + 8, y + 36, UI.dim, 1, null); }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const i = (st.row + r) * 2 + c, s = list[i]; if (!s) continue; const px = x + c * 86, py = y + 14 + r * 60;
      rect(g, i === st.sel ? UI.gold : UI.paper2, px, py, 84, 59); const cv = thumbCanvas(s); if (cv) g.drawImage(cv, px + 2, py + 2); else rect(g, '#8a7a9a', px + 2, py + 2, 80, 55);
    }
    panel(g, x + 176, y + 14, 116, 80, 'paper'); const s = list[st.sel];
    if (s) { drawText(g, `#${s.id}`, x + 182, y + 20, UI.accent2, 1, null); drawText(g, dateText(s.day).toUpperCase(), x + 182, y + 30, UI.ink, 1, null); drawText(g, ((get('map', s.map) || { name: s.map }).name || '').toUpperCase().slice(0, 24), x + 182, y + 40, UI.ink2, 1, null); drawText(g, `FILTER ${s.filter}`.toUpperCase(), x + 182, y + 52, UI.dim, 1, null); drawText(g, `FRAME ${s.frame}`.toUpperCase(), x + 182, y + 62, UI.dim, 1, null); drawText(g, `STICKERS ${s.stickers}`, x + 182, y + 72, UI.dim, 1, null); }
    rect(g, UI.bad, x + 176, y + 98, 112, 18); drawTextC(g, 'DELETE', x + 232, y + 104, UI.text, 1, null);
    rect(g, UI.mint, x + 176, y + 120, 112, 18); drawTextC(g, 'TAKE A PHOTO', x + 232, y + 126, UI.ink, 1, null);
    drawText(g, 'TAP A PHOTO TWICE TO ENLARGE', x, y + 164, UI.dim, 1, null); void w; void h;
  },
});

features('Seasons & Meta', [
  'Photo mode: press P, tap the small P button or use the Snapshots app to hide the HUD and look around with a free camera inside the map',
  'Photo filters: sepia, dreamy and night-vision, applied live to the world view',
  'Photo frames (polaroid, film strip, hearts, cozy wood) and up to eight stickers (star, heart, sparkle, flower, sun, paw) placed by tapping',
  'Snapshots album phone app keeps the last 18 photos as small thumbnails in your save, with enlarge and delete',
]);
