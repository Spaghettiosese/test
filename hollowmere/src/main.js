import { Game } from './game.js';
import { Menu } from './menu.js';

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
// Layout-independent key name (KeyE -> 'e'), so it works in embedded frames and other layouts.
const keyName = (e) => (/^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : e.key.toLowerCase());
const grabFocus = () => { try { window.focus(); if (document.activeElement && document.activeElement !== document.body && document.activeElement !== cv) document.activeElement.blur(); cv.focus({ preventScroll: true }); } catch { /* ignore */ } };
cv.tabIndex = 0; cv.style.outline = 'none';
// Browsers only allow audio after a gesture, and a frame only gets keys once focused, so every gesture does both.
for (const t of ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click']) addEventListener(t, () => { game.sfx.unlock(); if (t !== 'keydown') grabFocus(); }, { capture: true });
addEventListener('keydown', (e) => {
  const k = keyName(e);
  if (game.mode === 'boot' || game.mode === 'menu') { if (k === 'enter' && game.mode === 'menu') document.querySelector('#menu button.go')?.click(); if (k === 'escape' && game.mode === 'menu' && !$('menuPanel').hidden) menu.back(); return; }
  if (game.mode === 'pause') { if (k === 'escape') { if (!$('menuPanel').hidden) menu.back(); else pause(false); } return; }
  if (game.ui.dlg) { e.preventDefault(); if (k === 'e' || k === ' ' || k === 'enter') game.ui.advanceDialogue(); else if (k >= '1' && k <= '9') game.ui.choose(+k - 1); else if (k === 'escape') game.ui.closeDialogue(); return; }
  if (game.ui.sheetOpen) { if (k === 'e' || k === 'escape' || k === ' ' || k === 'enter') { e.preventDefault(); game.ui.closeNote(); } return; }
  if (game.mode === 'cutscene') { if (k === 'escape' || k === 'enter') game.story.skip(); return; }
  if (game.mode === 'play' && k === 'escape') { pause(true); return; }
  if (game.mode === 'end') return;
  if (k === 'tab') { e.preventDefault(); game.ui.toggleJournal(); return; }
  if ((k === 'm' || k === 'p') && (game.mode === 'play' || game.mode === 'journal')) { e.preventDefault(); game.ui.toggleJournal(k === 'm' ? 'map' : 'perks'); return; }
  if (k === 'n' && game.mode === 'play') { game.wmap.pin(); return; }
  if (k === 'x' && e.shiftKey && game.mode === 'play') { game.wmap.unpin(); }
  if ((k === '=' || k === '+') && game.mode === 'play') { game.wmap.zoom = Math.min(3, game.wmap.zoom * 1.25); return; }
  if (k === '-' && game.mode === 'play') { game.wmap.zoom = Math.max(0.5, game.wmap.zoom / 1.25); return; }
  if (k === 'f5' && game.mode === 'play') { e.preventDefault(); game.saves.save('quick'); return; }
  if (game.mode === 'journal') { if (k === 'escape') game.ui.toggleJournal(); else if (k >= '1' && k <= '9') game.ui.setTab(+k - 1); else if (k === '0') game.ui.setTab(9); return; }
  if (k === ' ' || k === 'arrowup' || k === 'arrowdown') e.preventDefault();
  game.input.keys.add(k); if (!e.repeat) { game.input.pressed.add(k); if (k === 'e') { game.player.usePress = true; } }
  if (game.debug && !e.repeat) {
    if (k === '[') game.clock.hours = (game.clock.hours + 23) % 24; if (k === ']') game.clock.hours = (game.clock.hours + 1) % 24;
    if (k === 'j') game.player.hp = game.player.maxHp;
  }
});
addEventListener('keyup', (e) => { game.input.keys.delete(keyName(e)); game.input.keys.delete(e.key.toLowerCase()); });
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
  game.input.dYaw -= dx * sens(); game.input.dPitch -= dy * sens() * (game.opts.v.invertY ? -1 : 1);
});
document.addEventListener('pointerlockchange', () => {
  if (!locked() && game.mode === 'play') { pause(true); }
});
const menu = new Menu(game, {
  resume: () => pause(false),
  load: (slot) => loadSlot(slot),
  newGame: (o) => newGame(o),
  quit: () => { game.profile.setPending({ title: true }); location.reload(); },
});
game.menu = menu;
function pause(on) {
  if (on) { if (game.mode !== 'play') return; game.mode = 'pause'; menu.showPause(); game.ui.el.cross.hidden = true; game.input.keys.clear(); if (game.player) { game.player.lmb = game.player.rmb = false; } }
  else { $('menu').hidden = true; game.mode = 'play'; game.canvasLock(); }
}
game.pause = pause;
// loading needs a fresh world: from the title it is fresh already, mid-game the page reloads first
function loadSlot(slot) {
  game.sfx.unlock(); grabFocus();
  if (game.mode !== 'menu') { game.profile.setPending({ load: slot }); location.reload(); return; }
  if (game.saves.load(slot)) { $('menu').hidden = true; game.story.resume(); } else game.ui.toast('That save could not be loaded');
}
function newGame({ chapter = null, ng = false } = {}) {
  game.sfx.unlock(); grabFocus();
  if (game.mode !== 'menu') return;
  $('menu').hidden = true;
  if (ng) game.campaign.newGamePlus(game.profile.takeCarry());
  if (chapter && chapter !== 'c1') game.campaign.startAt(chapter); else game.story.intro();
}
$('vol').oninput = (e) => { game.sfx.setVolume(+e.target.value); game.saves.saveSettings({ vol: +e.target.value }); };
$('sens').oninput = (e) => game.saves.saveSettings({ sens: +e.target.value });
$('diff').onchange = (e) => { game.difficulty = +e.target.value; game.saves.saveSettings({ diff: game.difficulty }); };
addEventListener('resize', () => game.resize());
addEventListener('wheel', (e) => { if (game.mode === 'play' && game.xbow?.up) game.xbow.cycle(e.deltaY > 0 ? 1 : -1); }, { passive: true });

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
  game.mode = 'menu'; game.opts.apply();
  { const st = game.saves.settings(); if (st.vol !== undefined) { $('vol').value = st.vol; game.sfx.setVolume(st.vol); } if (st.sens) $('sens').value = st.sens; if (st.diff !== undefined) { game.difficulty = st.diff; $('diff').value = st.diff; }
  }
  menu.sel.diff = game.difficulty; menu.showTitle();
  const pend = game.profile.takePending();
  if (pend?.load) loadSlot(pend.load);
  else if (pend?.ngplus && game.profile.d.carry) { menu.sel.ng = true; menu.panel('new'); }
  if (q.has('chapter')) { $('menu').hidden = true; game.campaign.startAt(q.get('chapter')); }
  else if (q.has('skipintro') || q.has('nomenu')) { $('menu').hidden = true; game.story.beginPlay(); }
  if (q.has('at')) { const [x, y, z] = q.get('at').split(',').map(Number); game.player.cc.position = [x, y || 0.1, z]; game.setCheckpoint([x, y || 0.1, z]); }
  if (q.has('hour')) { game.clock.hours = +q.get('hour'); for (const n of game.npcs) { n.leaveActivity(); n.snapToSchedule(); } }
  if (q.has('yaw')) game.player.yaw = +q.get('yaw') * Math.PI / 180;
  if (q.has('pitch')) game.player.pitch = +q.get('pitch') * Math.PI / 180;
})();
requestAnimationFrame(frame);
