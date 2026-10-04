// ShapeWatch: boot, menus, input and the frame loop. Flow: loading -> menu (a bot match plays
// behind it) -> hero select -> live match -> end screen -> back to the menu or another match.
import * as E from '../../engine/index.js';
import { Sim } from './sim.js';
import { Brain } from './ai.js';
import { View } from './view.js';
import { Sfx } from './audio.js';
import { Portraits, Hud, SelectScreen, Gallery, renderScoreboard, renderEnd } from './ui.js';
import { HERO, HEROES, TEAM_COLORS } from './heroes.js';
import { clamp, forward } from './util.js';

const $ = (id) => document.getElementById(id);
const DEG = E.DEG;
let view;
try { view = new View($('stage')); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'ShapeWatch needs WebGL2. ' + e.message; throw e; }
const sfx = new Sfx(); view.sound = sfx;

// ------------------------------------------------------------------ settings
const settings = { sens: 1, fov: 90, vol: 0.6, side: 0, diff: 1, mut: 1, hero: 'sabre', skin: 'default' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('shapewatch') || '{}')); } catch { /* storage blocked */ }
const save = () => { try { localStorage.setItem('shapewatch', JSON.stringify(settings)); } catch { /* ignore */ } };
if (!HERO[settings.hero]) settings.hero = 'sabre';

// ------------------------------------------------------------------ state
let sim, hud, portraits, select, gallery, mode = 'loading', paused = false, acc = 0, last = performance.now(), fpsS = 60, endShown = false, scoreT = 0, started = false, overT = 0;
const keys = new Set(), mouse = { l: false, r: false };
const touch = { on: false, stick: { id: null, x: 0, y: 0 }, look: null, fire: new Set() };
const me = () => sim?.player;
const locked = () => document.pointerLockElement === $('stage');
const lockMouse = () => { if (touch.on) return; try { const r = $('stage').requestPointerLock?.(); if (r?.catch) r.catch(() => {}); } catch { /* sandboxed: drag to look */ } };
const show = (id, on = true) => { $(id).hidden = !on; };

// ------------------------------------------------------------------ flow
function startAttract() {
  sim = new Sim({ autoPlayer: true, seed: (Math.random() * 1e6) | 0, difficulty: 1, mutators: false });
  sim.setupT = 0.2; for (let i = 0; i < 60 * 38; i++) sim.step(1 / 60); sim.events.length = 0; view.attach(sim, { skin: 'default' }); view.mode = 'orbit'; mode = 'menu'; endShown = false;
  for (const id of ['hud', 'select', 'gallery', 'help', 'pause', 'end', 'score']) show(id, false); show('menu');
  sim.recompose?.(0);
}
function startMatch() {
  sfx.unlock(); started = true;
  settings.side = +$('oSide').value; settings.diff = +$('oDiff').value; settings.mut = +$('oMut').value; save();
  sim = new Sim({ playerTeam: settings.side, playerHero: settings.hero, difficulty: settings.diff, mutators: !!settings.mut, seed: (Math.random() * 1e6) | 0 });
  const u = sim.player; if (settings.skin && !SKIN_OK(settings.skin)) settings.skin = 'default';
  view.attach(sim, { skin: settings.skin }); hud.reset(sim); view.fovH = settings.fov; paused = false; endShown = false; overT = 0;
  view.mode = 'select'; mode = 'select'; positionPreview();
  for (const id of ['menu', 'help', 'pause', 'end', 'hud', 'gallery']) show(id, false);
  openSelect(false);
}
const SKIN_OK = (s) => ['default', 'frosted', 'noir', 'gilded'].includes(s);
function positionPreview() { const u = sim.player; view.previewAnchor = { pos: [...u.pos], facing: forward(u.yaw, 0) }; view.previewHero = u.hero; }
function openSelect(mid) {
  const u = sim.player;
  select.open(sim, {
    mid, skin: settings.skin,
    onPick: (id) => {
      settings.hero = id; save(); view.previewHero = id;
      if (!mid && sim.state === 'setup') { sim.swapHero(u, id); sim.recompose(u.team); }
    },
    onSkin: (s) => { settings.skin = s; save(); view.mySkin = s; },
    onReady: () => {
      if (!mid) { sim.readyUp = true; return; }
      closeMid();
    },
  });
}
function closeMid() {
  const u = sim.player; select.close(); u.held = false;
  const pick = select.sel;
  if (pick !== u.hero) { u.pendingHero = pick; settings.hero = pick; save(); if (u.alive) { sim.spawn(u); } }
  mode = 'play'; view.mode = 'fps'; show('hud'); lockMouse();
}
function enterPlay() {
  select.close(); mode = 'play'; view.mode = 'fps'; show('hud'); hud.reset(sim); lockMouse(); sfx.announce('start');
  const atk = sim.playerTeam === 0; hud.banner(atk ? 'ATTACK' : 'DEFEND', atk ? 'ESCORT THE PAYLOAD TO THE END OF FROSTGATE' : 'HOLD BACK THE PAYLOAD', atk ? '#5ab0ff' : '#ff6a72');
  view.fovCur = settings.fov;
}
function pauseGame(on) {
  if (mode !== 'play' && mode !== 'paused') return;
  paused = on; mode = on ? 'paused' : 'play'; show('pause', on);
  if (on) { for (const k of ['sens', 'fov', 'vol']) $(k).value = settings[k]; keys.clear(); mouse.l = mouse.r = false; if (document.pointerLockElement) document.exitPointerLock(); } else lockMouse();
}
function openHeroChange() {
  const u = sim?.player; if (!u || !sim || mode !== 'play' || sim.state !== 'live') return;
  const spawnZ = u.team === 0 ? -72 : 160;
  if (u.alive && Math.abs(u.pos[2] - spawnZ) > 16) { hud.popup('CHANGE HERO AT YOUR SPAWN', 'save'); return; }
  u.held = true; mode = 'select-mid'; show('hud', false); if (document.pointerLockElement) document.exitPointerLock();
  view.mode = 'select'; view.previewAnchor = { pos: [...sim.level.spawns[u.team][2]], facing: forward(u.team ? Math.PI : 0, 0) }; view.previewHero = u.hero;
  openSelect(true);
}
function endMatch() {
  if (endShown) return; endShown = true; mode = 'over'; renderEnd(sim, portraits); show('end'); show('hud', false); if (document.pointerLockElement) document.exitPointerLock();
}
function toMenu() { for (const id of ['end', 'pause', 'select', 'hud', 'score']) show(id, false); select.close(); paused = false; if (document.pointerLockElement) document.exitPointerLock(); startAttract(); }

// ------------------------------------------------------------------ events from the simulation
view.onHit = (e) => { if (e.tgt && !e.tgt.alive) return; hud.hitmark(e.head ? 'head' : ''); };
view.onHurt = (e) => { if (e.src) hud.damageDir(e.src); };
view.onKill = (e) => {
  if (mode === 'menu') return;
  hud.feedRow(e); const p = me();
  if (e.killer === p) {
    hud.hitmark('kill'); sfx.kill(); hud.popup('ELIMINATED', 'kill', e.victim.name.toUpperCase());
    if (p.streak === 2) hud.popup('DOUBLE ELIMINATION', 'streak'); else if (p.streak === 3) hud.popup('TRIPLE ELIMINATION', 'streak'); else if (p.streak >= 4) hud.popup(p.streak + ' ELIMINATION STREAK', 'streak');
    if (e.head) hud.popup('PRECISION KILL', 'streak');
  } else if (e.assists?.includes(p)) hud.popup('ASSIST', 'save', e.victim.name.toUpperCase());
};
view.onEvent = (e) => {
  if (mode === 'menu') return;
  switch (e.type) {
    case 'live': if (mode === 'select') enterPlay(); break;
    case 'checkpoint': hud.banner('CHECKPOINT REACHED', `+${e.bonus} SECONDS ADDED`, '#ffd36b'); sfx.announce('checkpoint'); break;
    case 'overtime': hud.banner('OVERTIME', 'THE PAYLOAD IS STILL IN PLAY', '#ffd36b'); sfx.announce('overtime'); break;
    case 'mutator': hud.banner('RIFT SURGE', MUT_NAME(e.id), '#c79bff'); sfx.announce('surge'); break;
    case 'mutatorEnd': hud.popup('THE SURGE FADES', 'save'); break;
    case 'ult': { const u = e.unit, mine = u.team === sim.playerTeam; hud.popup(`${mine ? 'ALLY' : 'ENEMY'} ULTIMATE · ${u.def.ult.name.toUpperCase()}`, mine ? 'save' : 'kill', u.isPlayer ? '' : u.name.toUpperCase()); break; }
    case 'core': if (e.unit === me()) hud.popup('ECHO CORE', 'streak', '+12% ULT'); break;
    case 'revive': if (e.unit === me()) { hud.popup('REVIVED', 'save'); } break;
    case 'over': { const won = e.winner === sim.playerTeam; hud.banner(won ? 'VICTORY' : 'DEFEAT', e.why.toUpperCase(), won ? '#5ab0ff' : '#ff6a72'); sfx.announce(won ? 'win' : 'lose'); overT = 0; break; }
    case 'spawn': if (e.unit === me() && mode === 'play') view.mode = 'fps'; break;
  }
};
const MUT_NAME = (id) => ({ lowgrav: 'LOW GRAVITY', overclock: 'OVERCLOCK: COOLDOWNS TWICE AS FAST', glass: 'GLASS CANNON: +40% DAMAGE', blizzard: 'WHITEOUT: THE PAYLOAD SURGES' }[id]);

// ------------------------------------------------------------------ input
const cv = $('stage');
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('mousedown', (e) => { sfx.unlock(); if (mode === 'play' && !locked()) lockMouse(); if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true; });
addEventListener('mouseup', (e) => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; });
addEventListener('pointermove', (e) => {
  if (mode !== 'play' || e.pointerType === 'touch') return;
  if (e.pointerType === 'mouse' && e.buttons !== undefined) { mouse.l = !!(e.buttons & 1); mouse.r = !!(e.buttons & 2); }
  if (!locked() && !e.buttons) return; look(e.movementX, e.movementY, 0.0022);
});
function look(dx, dy, base) {
  const u = me(); if (!u || !u.alive || sim.state === 'setup') return;
  const zoom = view.fovCur ? view.fovCur / settings.fov : 1, s = base * settings.sens * zoom ** 0.9;
  u.yaw -= dx * s; u.pitch = clamp(u.pitch - dy * s, -1.5, 1.5); view._dyaw = (view._dyaw || 0) + dx * 0.0004; view._dpitch = (view._dpitch || 0) + dy * 0.0004;
}
document.addEventListener('pointerlockchange', () => { if (!locked() && mode === 'play' && sim.state !== 'over') pauseGame(true); });
addEventListener('blur', () => { keys.clear(); mouse.l = mouse.r = false; });
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'tab') { e.preventDefault(); if (mode === 'play' || mode === 'over') { show('score'); renderScoreboard(sim, portraits); } return; }
  if (e.repeat) { if (['w', 'a', 's', 'd', ' '].includes(k)) keys.add(k); return; }
  keys.add(k); sfx.unlock();
  if (k === ' ' && mode === 'play') e.preventDefault();
  if (mode === 'select' && (k === 'enter' || k === ' ')) { select.onReady?.(); return; }
  if (k === 'escape') { if (mode === 'select-mid') { select.close(); me().held = false; mode = 'play'; view.mode = 'fps'; show('hud'); lockMouse(); } else if (mode === 'select') pauseGame2(); else if (mode === 'paused') pauseGame(false); return; }
  if (mode === 'select-mid' && k === 'enter') { select.onReady?.(); return; }
  if (mode !== 'play') return;
  const u = me(); if (!u) return;
  if (k === 'shift') u.in.a1 = true; if (k === 'e') u.in.a2 = true; if (k === 'q') u.in.ult = true; if (k === 'r') u.in.reload = true; if (k === 'h') openHeroChange();
  if (k === 'f' && false) u.in.a1 = true;
});
addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); keys.delete(k); if (k === 'tab') show('score', false); });
function pauseGame2() { // pause menu from the hero select screen
  mode = 'paused-select'; show('pause'); for (const k of ['sens', 'fov', 'vol']) $(k).value = settings[k];
}
for (const k of ['sens', 'fov', 'vol']) $(k).addEventListener('input', () => { settings[k] = +$(k).value; if (k === 'vol') sfx.setVolume(settings.vol); if (k === 'fov') view.fovH = settings.fov; save(); });
$('pResume').onclick = () => { sfx.ui(); if (mode === 'paused-select') { mode = sim.state === 'setup' ? 'select' : 'select-mid'; show('pause', false); } else pauseGame(false); };
$('pHero').onclick = () => { sfx.ui(); show('pause', false); paused = false; if (mode === 'paused') { mode = 'play'; openHeroChange(); } else mode = sim.state === 'setup' ? 'select' : 'select-mid'; };
$('pQuit').onclick = () => { sfx.ui(); toMenu(); };
$('rsHero').onclick = () => openHeroChange();

// ------------------------------------------------------------------ touch
function enableTouch() { if (touch.on) return; touch.on = true; document.body.classList.add('touch'); if (mode === 'play') show('touch'); }
if (matchMedia('(pointer: coarse)').matches) enableTouch();
addEventListener('touchstart', () => { enableTouch(); if (mode === 'play') show('touch'); }, { passive: true, capture: true });
cv.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' || mode !== 'play') return; e.preventDefault(); sfx.unlock(); if (!touch.look) touch.look = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
addEventListener('pointermove', (e) => { const l = touch.look; if (!l || e.pointerId !== l.id) return; look(e.clientX - l.x, e.clientY - l.y, 0.0042); l.x = e.clientX; l.y = e.clientY; });
const endLook = (e) => { if (touch.look && e.pointerId === touch.look.id) touch.look = null; };
addEventListener('pointerup', endLook); addEventListener('pointercancel', endLook);
{
  const st = $('stick'), knob = st.firstElementChild, R = 50;
  const move = (e) => { const r = st.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } touch.stick.x = dx / R; touch.stick.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
  st.addEventListener('pointerdown', (e) => { e.preventDefault(); touch.stick.id = e.pointerId; st.setPointerCapture(e.pointerId); move(e); });
  st.addEventListener('pointermove', (e) => { if (e.pointerId === touch.stick.id) move(e); });
  const up = (e) => { if (e.pointerId !== touch.stick.id) return; touch.stick.id = null; touch.stick.x = touch.stick.y = 0; knob.style.transform = ''; };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  const btn = (id, down, upf) => { const b = $(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('on'); sfx.unlock(); down?.(); }); const u = () => { b.classList.remove('on'); upf?.(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); };
  btn('tFire', () => { mouse.l = true; }, () => { mouse.l = false; }); btn('tAlt', () => { mouse.r = true; }, () => { mouse.r = false; });
  btn('tJump', () => keys.add(' '), () => keys.delete(' ')); btn('tA1', () => { if (me()) me().in.a1 = true; }); btn('tA2', () => { if (me()) me().in.a2 = true; });
  btn('tUlt', () => { if (me()) me().in.ult = true; }); btn('tRel', () => { if (me()) me().in.reload = true; }); btn('tTab', () => { show('score', $('score').hidden); renderScoreboard(sim, portraits); });
}

// ------------------------------------------------------------------ menu buttons
$('mPlay').onclick = () => { sfx.unlock(); sfx.ui('select'); startMatch(); };
$('mHeroes').onclick = () => { sfx.unlock(); sfx.ui(); show('menu', false); show('gallery'); gallery.build(); };
$('gBack').onclick = () => { sfx.ui(); show('gallery', false); show('menu'); };
$('mHelp').onclick = () => { sfx.unlock(); sfx.ui(); show('help'); };
$('hBack').onclick = () => { sfx.ui(); show('help', false); };
$('eAgain').onclick = () => { sfx.ui('select'); startMatch(); };
$('eMenu').onclick = () => { sfx.ui(); toMenu(); };

// ------------------------------------------------------------------ player input -> unit
function drivePlayer() {
  const u = me(); if (!u || !u.alive || mode !== 'play' || paused) return;
  const k = keys, st = touch.stick; let mx = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0), mz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
  if (!mx && !mz && Math.hypot(st.x, st.y) > 0.12) { mx = st.x; mz = -st.y; }
  u.in.move = [mx, mz]; u.in.jump = k.has(' '); u.in.fire1 = mouse.l; u.in.fire2 = mouse.r;
}

// ------------------------------------------------------------------ frame
const HZ = 1 / 60;
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now; fpsS += (1 / Math.max(dt, 1e-3) - fpsS) * 0.05;
  if (mode !== 'loading') {
    if (!paused && mode !== 'paused-select') {
      drivePlayer();
      acc += dt; let n = 0;
      while (acc >= HZ && n++ < 4) { sim.step(HZ); view.handle(sim.events); acc -= HZ; }
      if (mode === 'menu' && sim.state === 'over' && sim.overT > 6) startAttract();
    }
    view.syncPreview(dt); view.syncUnits(dt); view.syncProjs(dt); view.syncZones(dt); view.syncWorld(dt);
    view.updateCamera(dt); view.updateViewmodel(dt); view.updateOverlays(dt); view.tick(dt); view.render(dt);
    if (mode === 'select' || mode === 'select-mid') select.update(dt);
    if (mode === 'play' || mode === 'over' || mode === 'paused') { hud.update(dt, fpsS); if (!$('score').hidden) { scoreT -= dt; if (scoreT <= 0) { scoreT = 0.3; renderScoreboard(sim, portraits); } } }
    if (sim.state === 'over' && (mode === 'play' || mode === 'over')) { overT ||= now; if (now - overT > 3500 && !endShown) endMatch(); }
    if (mode === 'play' && touch.on) show('touch'); else if (touch.on) show('touch', false);
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ boot
async function boot() {
  const bar = $('ldBar'), msg = $('ldMsg');
  await new Promise((r) => setTimeout(r, 30));
  portraits = new Portraits(view); msg.textContent = 'Forging heroes…';
  await portraits.generate((p) => { bar.style.width = Math.round(p * 100) + '%'; });
  msg.textContent = 'Building Frostgate…';
  hud = new Hud(view, portraits); select = new SelectScreen(view, portraits, sfx); gallery = new Gallery(portraits, sfx);
  $('oSide').value = settings.side; $('oDiff').value = settings.diff; $('oMut').value = settings.mut; $('sens').value = settings.sens; $('fov').value = settings.fov; $('vol').value = settings.vol; sfx.setVolume(settings.vol); view.fovH = settings.fov;
  startAttract(); hud.reset(sim);
  $('loading').hidden = true; mode = 'menu';
  window.__sw = { get sim() { return sim; }, view, hud, select, gallery, settings, startMatch, startAttract, pauseGame, openHeroChange, autoplay(on = true) { const u = sim.player; u.bot = on ? new Brain(sim, u, 1) : null; }, get mode() { return mode; }, set mode(m) { mode = m; }, keys, mouse, enterPlay, endMatch, step: (n = 1) => { for (let i = 0; i < n; i++) { drivePlayer(); sim.step(HZ); view.handle(sim.events); } } };
}
requestAnimationFrame(frame);
boot().catch((e) => { $('fatal').hidden = false; $('fatal').textContent = 'ShapeWatch failed to start: ' + e.message; console.error(e); });
