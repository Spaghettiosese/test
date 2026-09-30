import { Game } from './game.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
let game;
try { game = new Game(); } catch (e) { $('loading').hidden = true; throw e; }
window.__game = game; game.debug = q.has('debug');
if (q.has('res')) game.pixelHeight = +q.get('res');

// ---------------------------------------------------------------- input
const cv = $('screen');
let drag = null;
const locked = () => document.pointerLockElement === cv;
game.canvasLock = () => { if (game.mode !== 'play') return; try { const r = cv.requestPointerLock?.(); if (r && r.catch) r.catch(() => {}); } catch { /* sandboxed: drag to look */ } };
const sens = () => 0.0022 * (+$('sens').value || 1);
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (game.mode === 'boot' || game.mode === 'menu') { if (k === 'enter' && game.mode === 'menu') start(); return; }
  if (game.ui.dlg) { e.preventDefault(); if (k === 'e' || k === ' ' || k === 'enter') game.ui.advanceDialogue(); else if (k >= '1' && k <= '9') game.ui.choose(+k - 1); else if (k === 'escape') game.ui.closeDialogue(); return; }
  if (game.ui.sheetOpen) { if (k === 'e' || k === 'escape' || k === ' ' || k === 'enter') { e.preventDefault(); game.ui.closeNote(); } return; }
  if (game.mode === 'cutscene') { if (k === 'escape' || k === 'enter') game.story.skip(); return; }
  if (game.mode === 'play' && k === 'escape') { pause(true); return; }
  if (game.mode === 'end') return;
  if (k === 'tab') { e.preventDefault(); game.ui.toggleJournal(); return; }
  if (game.mode === 'journal') { if (k === 'escape') game.ui.toggleJournal(); return; }
  if (k === ' ' || k === 'arrowup' || k === 'arrowdown') e.preventDefault();
  game.input.keys.add(k); if (!e.repeat) { game.input.pressed.add(k); if (k === 'e') { game.player.usePress = true; } }
  if (game.debug && !e.repeat) {
    if (k === '[') game.clock.hours = (game.clock.hours + 23) % 24; if (k === ']') game.clock.hours = (game.clock.hours + 1) % 24;
    if (k === 'j') game.player.hp = game.player.maxHp;
  }
});
addEventListener('keyup', (e) => game.input.keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { game.input.keys.clear(); if (game.player) { game.player.lmb = game.player.rmb = false; } });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousedown', (e) => {
  game.sfx.unlock();
  if (game.ui.dlg) { if (e.target === cv || e.target.closest('#dialog')) { if (!e.target.closest('button')) game.ui.advanceDialogue(); } return; }
  if (game.ui.sheetOpen) { game.ui.closeNote(); return; }
  if (game.mode === 'pause') return;
  if (game.mode !== 'play') return;
  if (e.target !== cv) return;
  if (!locked()) game.canvasLock();
  const P = game.player;
  if (e.button === 0) { P.lmb = true; P.lmbPress = true; }
  if (e.button === 2) P.rmb = true;
  drag = { x: e.clientX, y: e.clientY };
});
addEventListener('mouseup', (e) => { const P = game.player; if (!P) return; if (e.button === 0) P.lmb = false; if (e.button === 2) P.rmb = false; drag = null; });
addEventListener('mousemove', (e) => {
  if (game.mode !== 'play') return;
  let dx = 0, dy = 0;
  if (locked()) { dx = e.movementX; dy = e.movementY; } else if (drag) { dx = e.clientX - drag.x; dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; }
  game.input.dYaw -= dx * sens(); game.input.dPitch -= dy * sens();
});
document.addEventListener('pointerlockchange', () => {
  if (!locked() && game.mode === 'play') { pause(true); }
});
function pause(on) {
  if (on) { game.mode = 'pause'; $('menu').hidden = false; $('play').textContent = 'Resume'; const h = $('menu').querySelector('.blurb'); h.textContent = 'The night waits. Ravenspire waits longer.'; game.input.keys.clear(); }
  else { $('menu').hidden = true; game.mode = 'play'; game.canvasLock(); }
}
$('vol').oninput = (e) => game.sfx.setVolume(+e.target.value);
$('play').onclick = () => { game.sfx.unlock(); if (game.mode === 'pause') pause(false); else start(); };
addEventListener('resize', () => game.resize());
function start() {
  if (game.mode !== 'menu') return;
  $('menu').hidden = true; game.sfx.unlock();
  game.story.intro();
}

// ---------------------------------------------------------------- boot
let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  if (game.mode !== 'boot') {
    if (game.mode !== 'pause' && !game.manual) game.step(dt);
    game.render(dt);
  }
  requestAnimationFrame(frame);
}
(async () => {
  const bar = document.querySelector('#loading b'), label = $('loading');
  try {
    await game.build((p, msg) => { bar.style.animation = 'none'; bar.style.left = '0'; bar.style.width = Math.round(p * 100) + '%'; label.firstChild.textContent = msg.toUpperCase(); });
  } catch (e) { $('loading').hidden = true; $('fatal').hidden = false; $('fatal').textContent = 'Failed to build the world: ' + e.message; console.error(e); throw e; }
  game.story.spawnCryptHollows();
  $('loading').hidden = true;
  game.mode = 'menu';
  if (q.has('skipintro') || q.has('nomenu')) { $('menu').hidden = true; game.story.beginPlay(); }
  if (q.has('at')) { const [x, y, z] = q.get('at').split(',').map(Number); game.player.cc.position = [x, y || 0.1, z]; game.setCheckpoint([x, y || 0.1, z]); }
  if (q.has('hour')) { game.clock.hours = +q.get('hour'); for (const n of game.npcs) { n.leaveActivity(); n.snapToSchedule(); } }
  if (q.has('yaw')) game.player.yaw = +q.get('yaw') * Math.PI / 180;
  if (q.has('pitch')) game.player.pitch = +q.get('pitch') * Math.PI / 180;
})();
requestAnimationFrame(frame);
