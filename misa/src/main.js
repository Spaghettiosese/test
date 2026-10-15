// Boot: canvas, input, asset loading, main loop. Everything else lives in core/, world/, ui/, systems/ and content/.
import { Game } from './core/game.js';
import { MINUTE_SECONDS, DAY_END } from './core/time.js';
import { blankInput } from './input.js';
import { loadOverrides } from './artcache.js';
import { loadImage } from './gfx/chars.js';
import * as audio from './audio.js';
import { installTouchControls } from './touch.js';
import { all } from './core/registry.js';
import './content/index.js';

const VW = 320, VH = 224;
const cv = document.getElementById('game');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

function fit() {
  // With touch controls in portrait, keep the lower part of the screen free for the thumbs.
  const touch = document.body.classList.contains('touch'), portrait = innerHeight > innerWidth;
  const aw = Math.min(innerWidth - (touch ? 0 : 16), 1600);
  const ah = touch ? (portrait ? innerHeight * 0.56 : innerHeight) : innerHeight - (document.getElementById('hint') ? 40 : 8);
  const fs = Math.min(aw / VW, ah / VH), s = fs >= 1 && !touch ? Math.floor(fs) : fs; // phones: fill the screen
  cv.style.width = VW * s + 'px'; cv.style.height = VH * s + 'px';
  document.body.style.alignItems = touch && portrait ? 'flex-start' : 'center';
  if (touch && portrait) cv.style.marginTop = '8px'; else cv.style.marginTop = '';
}
addEventListener('resize', fit); fit();

// ---------- input ----------
const input = blankInput();
input.wheel = 0;
let pressedNow = new Set();
const KEYS_TO_BLOCK = new Set([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab']);
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (KEYS_TO_BLOCK.has(k)) e.preventDefault();
  if (!input.keys.has(k)) pressedNow.add(k);
  input.keys.add(k);
  audio.unlock();
});
addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
installTouchControls({
  press: (k) => { if (!input.keys.has(k)) pressedNow.add(k); input.keys.add(k); audio.unlock(); },
  release: (k) => input.keys.delete(k),
  onLayout: fit,
});
addEventListener('blur', () => input.keys.clear());
function ptr(e) {
  const r = cv.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * VW, y = ((e.clientY - r.top) / r.height) * VH;
  if (x !== input.mx || y !== input.my) input.moved = true;
  input.mx = x; input.my = y;
}
cv.addEventListener('pointermove', ptr);
cv.addEventListener('pointerdown', (e) => { cv.focus(); ptr(e); input.down = true; input.justDown = true; input.button = e.button; audio.unlock(); try { cv.setPointerCapture(e.pointerId); } catch { /* ignore */ } });
cv.addEventListener('pointerup', () => { input.down = false; });
cv.addEventListener('wheel', (e) => { input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
cv.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- game ----------
const game = new Game();
game.audio = audio;
game.input = input;
window.__misa = game; // debugging hook
audio.setVolumes(game.settings);
game.initSystems();

let minuteAcc = 0;
function update(dt) {
  input.pressed = pressedNow;
  game.clock += dt;
  if (game.scenes.timeRuns && game.state) {
    game.state.playMs += dt * 1000;
    minuteAcc += dt / MINUTE_SECONDS * (game.timeScale || 1);
    if (minuteAcc >= 1) { const m = Math.floor(minuteAcc); minuteAcc -= m; game.advance(m); }
    if (game.state.time.minutes >= DAY_END && !game.passingOut) { game.passingOut = true; game.bus.emit('passOut', {}); }
  }
  game.scenes.update(dt, input);
  for (const t of game.toasts) t.t -= dt;
  game.toasts = game.toasts.filter((t) => t.t > 0);
  audio.tick(dt, game);
}
function endFrame() { pressedNow = new Set(); input.pressed = pressedNow; input.justDown = false; input.moved = false; input.wheel = 0; }
function render() {
  g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
  game.scenes.draw(g);
  for (const f of all('hud')) if (f.always || game.scenes.top?.name === 'world') f.draw(g, game);
}

let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  try { update(dt); render(); } catch (e) { console.error(e); }
  endFrame();
  requestAnimationFrame(frame);
}

const sheets = (typeof window !== 'undefined' && window.MOONKAI_SHEETS) || {};
const src = (k, path) => sheets[k] || path;
const castIds = all('npc').map((n) => n.id);
// Extra images registered by content: register('image', key, { src: 'assets/...png' }) (outfit sheets, etc.)
const extraImages = all('image').map((im) => loadImage(im.id, src(im.id, im.src)));
Promise.all([
  ...extraImages,
  loadOverrides().catch(() => {}),
  loadImage('misa_sheet', src('misa_sheet', 'assets/moonkai/misa_sheet.png')),
  loadImage('misa_portraits', src('misa_portraits', 'assets/moonkai/misa_portraits.png')),
  ...castIds.flatMap((id) => [loadImage('cast_' + id, src('cast_' + id, `assets/cast/${id}.png`)), loadImage(`cast_${id}_portraits`, src(`cast_${id}_portraits`, `assets/cast/${id}_portraits.png`))]),
]).finally(() => { game.open('title'); requestAnimationFrame(frame); });
