import { SPRITES } from './art.js';
import { sprite, sprite2, loadOverrides } from './artcache.js';
import { loadMisa, drawMisa } from './moonkai.js';
import { PetGame } from './pet.js';
import { drawText, drawTextC, measure } from './font.js';
import { blankInput, axis, act } from './input.js';
import { mulberry32, pick, clamp } from './rng.js';
import { sfx, musicTick, toggleMusic } from './audio.js';
import {
  TILE, W, H, GRID, OBJECTS, DECOR, WINDOWS, SPAWN, DOOR_STEP, DUST_SPOTS, SOFA_SPOT,
  solidRects, moveBody, nearestInteract, footprint, distToRect,
} from './world.js';
import { Cat } from './cat.js';
import { CHORES, dailyChores, starsFor, isAllDone, clockText } from './chores.js';
import { MINIGAMES } from './minigames.js';
import { Cutscene } from './cutscene.js';
import { INTRO, pickEvent, scriptFor } from './events.js';

const VW = 320, VH = 224;
const cv = document.getElementById('game');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

// ---------- canvas scaling ----------
function fit() {
  const aw = Math.min(innerWidth - 32, 1280), ah = innerHeight - 70;
  const s = Math.max(1, Math.floor(Math.min(aw / VW, ah / VH))) || 1;
  const fs = Math.min(aw / VW, ah / VH);
  const k = fs >= 1 ? s : fs;
  cv.style.width = VW * k + 'px'; cv.style.height = VH * k + 'px';
}
addEventListener('resize', fit); fit();

// ---------- input ----------
const input = blankInput();
const held = input.keys;
let pressedNow = new Set();
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (!held.has(k)) pressedNow.add(k);
  held.add(k);
});
addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
addEventListener('blur', () => held.clear());
function ptr(e) {
  const r = cv.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * VW, y = ((e.clientY - r.top) / r.height) * VH;
  if (x !== input.mx || y !== input.my) input.moved = true;
  input.mx = x; input.my = y;
}
cv.addEventListener('pointermove', ptr);
cv.addEventListener('pointerdown', (e) => { cv.focus(); ptr(e); input.down = true; input.justDown = true; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', () => { input.down = false; });
cv.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- state ----------
const rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
const SAVE_KEY = 'misa-cozy-home-v1';
const state = {
  day: 1, minutes: 7 * 60, mood: 40, stars: 0, chores: [], decor: [], flags: {}, raining: false, blackout: 0,
  eventsToday: [], teaLeft: 2, bowlFull: false, dishesDone: 0,
};
const Z = 2; // the world is drawn at 2x with a camera that follows Misa
const cam = { x: 0, y: 0 };
const player = { x: SPAWN.x, y: SPAWN.y, dir: 'down', face: 'right', at: 0, run: false, moving: false };
const cat = new Cat(7.5 * TILE, 11.9 * TILE);
const pip = { show: false };
const hearts = [];
const toasts = [];
const rain = Array.from({ length: 70 }, () => ({ x: Math.random() * VW, y: Math.random() * VH, s: 90 + Math.random() * 60 }));
let mode = 'title', mini = null, miniId = null, resultT = 0, cs = null, summary = null;
let eventTimer = 35, petCd = 0, clock = 0, sceneName = null, hasSave = false;
const scene = { shootT: -1, shoot() { this.shootT = 0; } };

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ day: state.day, stars: state.stars, decor: state.decor, flags: state.flags })); } catch { /* storage unavailable */ } }
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) { Object.assign(state, { day: s.day, stars: s.stars, decor: s.decor || [], flags: s.flags || {} }); return true; } } catch { /* ignore */ }
  return false;
}

// ---------- the API cutscenes use ----------
const api = {
  state, rng, scene,
  get sceneName() { return sceneName; }, set sceneName(v) { sceneName = v; },
  toast(text) { toasts.push({ text, t: 3.2 }); },
  addMood(n) { state.mood = Math.max(0, Math.min(100, state.mood + n)); },
  addStars(n) { state.stars += n; },
  giveDecor(id) { if (!state.decor.includes(id)) { state.decor.push(id); api.toast(`New: ${DECOR[id].name}!`); save(); } },
  addChore(id) {
    const c = state.chores.find((x) => x.id === id);
    if (c) c.done = false; else state.chores.push({ id, done: false });
    api.toast(`New chore: ${CHORES[id].short}`);
  },
  showPip(v) { pip.show = v; },
  startRain() {
    state.raining = true;
    const c = state.chores.find((x) => x.id === 'plants');
    if (c && !c.done) { c.done = true; state.stars += 1; api.addMood(6); api.toast('The rain watered the plants! +1 star'); }
  },
  startBlackout() { state.blackout = 50; },
  startZoomies() { cat.set('zoom', 9); cat.tx = cat.x; cat.ty = cat.y; },
  catComes() {
    for (const [dx, dy] of [[12, 2], [-12, 2], [0, 12], [0, -12], [0, 0]]) {
      cat.x = player.x + dx; cat.y = player.y + dy;
      if (!solidRects(state.decor).some((r) => cat.x > r[0] && cat.x < r[0] + r[2] && cat.y > r[1] && cat.y < r[1] + r[3])) break;
    }
    cat.set('sit', 6);
  },
};
window.__misa = { state, api, player, cat, get mode() { return mode; }, event: (id) => startCutscene(scriptFor(id, api)), sleep: () => sleep() }; // debugging hooks

function startCutscene(steps, done) {
  cs = new Cutscene(steps, api, () => { cs = null; if (mode === 'cutscene') mode = 'world'; done && done(); });
  if (!cs.done) mode = 'cutscene'; else { cs = null; done && done(); }
}
const say = (who, mood, text) => ({ t: 'say', who, mood, text });

function startDay(intro) {
  Object.assign(state, { minutes: 7 * 60, raining: false, blackout: 0, eventsToday: [], teaLeft: 2, bowlFull: false });
  state.chores = dailyChores(rng, state.day);
  Object.assign(player, { x: SPAWN.x, y: SPAWN.y, dir: 'down', face: 'right' });
  Object.assign(cat, { x: 7.5 * TILE, y: 11.9 * TILE }); cat.set('nap', 8);
  pip.show = false; eventTimer = state.day === 1 ? 35 : 45; mode = 'world'; sceneName = null;
  if (intro) startCutscene(INTRO);
  else startCutscene([{ t: 'fade', to: 1, dur: 0 }, { t: 'fade', to: 0, dur: 1 },
    say('MISA', 'happy', pick(rng, ['A new day! The sunbeam is on the rug again.', 'Good morning, little house!', 'Smells like a good day for chores. Really!']))]);
}

// ---------- chores ----------
function startChore(id) {
  const c = state.chores.find((x) => x.id === id);
  if (!c) return api.toast('Nothing to do here right now.');
  if (c.done) return api.toast('Already done. Nice work!');
  if (id === 'plants' && state.raining) { api.startRain(); return; }
  miniId = id; mini = new MINIGAMES[id](rng, id === 'dishes' ? { plates: 4 } : {});
  mode = 'mini'; resultT = 0; sfx('select');
}
function finishChore() {
  const c = state.chores.find((x) => x.id === miniId);
  const stars = starsFor(mini.score) + (mini.bonus || 0);
  if (c) c.done = true;
  state.stars += stars; api.addMood(CHORES[miniId].mood + stars * 2);
  if (miniId === 'feed') { state.bowlFull = true; cat.set('follow', 20); }
  api.toast(`${CHORES[miniId].short} done! +${stars} star${stars > 1 ? 's' : ''}`);
  mini = null; mode = 'world'; save();
  if (isAllDone(state.chores)) startCutscene([say('MISA', 'happy', 'That is everything! Now I can have tea, cuddle Mochi, or call it a night.')]);
}

function interact(o) {
  const it = o.interact;
  if (it.kind === 'chore') return startChore(it.id);
  switch (it.id) {
    case 'tea':
      if (state.teaLeft <= 0) return api.toast('Misa is tea-full for today.');
      state.teaLeft--; state.minutes += 15; api.addMood(6);
      return startCutscene([say('MISA', 'happy', pick(rng, ['One chamomile, with honey. The kettle sings.', 'Mint tea. The whole kitchen smells green and warm.'])), { t: 'call', fn: () => api.toast('Cozy +6') }]);
    case 'read':
      state.minutes += 20; api.addMood(3);
      return startCutscene([say('MISA', 'happy', pick(rng, ['"The Very Sleepy Fox". Read it twice already, reading it again.', 'A cookbook. Page 42 has a stain shaped like Mochi.', 'Poems about rain. Perfect.']))]);
    case 'rest': {
      const near = Math.hypot(cat.x - player.x, cat.y - player.y) < 60;
      state.minutes += 30; api.addMood(near ? 10 : 4);
      return startCutscene(near
        ? [say('MISA', 'happy', 'Come here, you.'), say('MOCHI', 'happy', 'Purrrrr...'), { t: 'sfx', name: 'purr' }, say('MISA', 'sleepy', 'The best part of every day, right here.'), { t: 'call', fn: () => api.toast('Cuddle time! Cozy +10') }]
        : [say('MISA', 'neutral', 'A nice sit. It would be even nicer with a cat on my lap.')]);
    }
    case 'desk': {
      const done = state.chores.filter((c) => c.done).length;
      return startCutscene([say('MISA', 'neutral', `Dear diary. Day ${state.day}. ${done} of ${state.chores.length} chores done, ${state.stars} stars so far.`)]);
    }
    case 'sleep':
      if (!isAllDone(state.chores) && state.minutes < 20 * 60) return startCutscene([say('MISA', 'surprised', 'Not tired yet, and there are chores waiting. Maybe after 8 PM?')]);
      return sleep();
  }
}

function sleep(forced) {
  const done = state.chores.filter((c) => c.done).length, total = state.chores.length;
  const bonus = done === total ? 10 : 0;
  startCutscene([
    ...(forced ? [say('MISA', 'sleepy', 'Yaaawn... the sofa is so soft... just resting my eyes...')] : [say('MISA', 'sleepy', 'Goodnight, Mochi. Goodnight, little house.')]),
    { t: 'fade', to: 1, dur: 1 }, { t: 'scene', name: 'night' },
    { t: 'fade', to: 0, dur: 1 },
    say('MOCHI', 'sleepy', 'Prrr... zzz...'),
    { t: 'fade', to: 1, dur: 1 }, { t: 'scene', name: null },
    { t: 'call', fn: () => { api.addMood(bonus); summary = { day: state.day, done, total, stars: state.stars, mood: state.mood, decor: state.decor.length }; mode = 'summary'; } },
  ]);
}

// ---------- update ----------
function updateWorld(dt) {
  const a = axis(input);
  let vx = a.x, vy = a.y;
  const wmx = (input.mx + cam.x) / Z, wmy = (input.my + cam.y) / Z;
  if (!vx && !vy && input.down && !input.justDown) {
    const dx = wmx - player.x, dy = wmy - (player.y - 12);
    if (Math.hypot(dx, dy) > 5) { vx = dx; vy = dy; }
  }
  const n = Math.hypot(vx, vy);
  const rects = solidRects(state.decor);
  const wasMoving = player.moving, wasRun = player.run;
  player.moving = n > 0; player.run = player.moving && held.has('shift');
  if (n) {
    const sp = (player.run ? 84 : 54) * dt;
    moveBody(player, (vx / n) * sp, (vy / n) * sp, rects);
    player.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
    if (Math.abs(vx) > 0.2) player.face = vx < 0 ? 'left' : 'right';
  }
  if (player.moving !== wasMoving || player.run !== wasRun) player.at = 0;
  player.at += dt;

  clock += dt;
  state.minutes += dt * 2;
  if (state.blackout > 0) state.blackout -= dt;
  petCd -= dt;
  const night = state.minutes > 19.5 * 60;
  cat.update(dt, { player, rects, rng, night });
  if (cat.moving === false && cat.state === 'nap' && rng() < dt * 0.4) hearts.push({ x: cat.x, y: cat.y - 18, life: 1.4, z: true });

  // interaction
  const { near, catNear } = targets();
  if (input.pressed.has('p') && Math.hypot(cat.x - player.x, cat.y - player.y) < 30) petCat();
  else if (act(input)) {
    let target = near;
    if (input.justDown && !input.pressed.size) {
      target = near && OBJECTS.includes(near) && hitObj(near, wmx, wmy) ? near : null;
      if (!target && catNear && Math.hypot(cat.x - wmx, cat.y - 6 - wmy) < 14) target = 'cat';
    } else if (catNear) target = 'cat';
    if (target === 'cat') petCat();
    else if (target) interact(target);
  }

  // random events
  eventTimer -= dt;
  if (eventTimer <= 0 && !pip.show) {
    eventTimer = 40 + rng() * 35;
    if (rng() < 0.7) {
      const id = pickEvent(rng, state);
      if (id) { state.eventsToday.push(id); startCutscene(scriptFor(id, api)); }
    }
  }
  if (state.minutes >= 22 * 60) { state.minutes = 22 * 60 - 1; sleep(true); }
}
const hitObj = (o, x, y) => { const f = footprint(o); return x > f[0] - 8 && x < f[0] + f[2] + 8 && y > f[1] - 24 && y < f[1] + f[3] + 4; };
// Mochi wins the prompt when she is closer than the nearest station.
function targets() {
  let near = nearestInteract(player.x, player.y);
  const cd = Math.hypot(cat.x - player.x, cat.y - player.y);
  let catNear = cd < 22;
  if (catNear && near && distToRect(player.x, player.y, footprint(near)) < cd - 4) catNear = false;
  if (catNear) near = null;
  return { near, catNear };
}
function petCat() {
  miniId = 'pet'; mini = new PetGame(rng); mode = 'mini'; sfx('meow');
  if (cat.state === 'nap') cat.set('sit', 6);
}
function finishPet() {
  const aff = mini.affection;
  mini = null; mode = 'world'; miniId = null;
  if (petCd <= 0 && aff > 0.05) {
    petCd = 40; api.addMood(Math.round(aff * 10));
    if (aff >= 1) { state.stars += 1; api.toast('Mochi adores you! Cozy +10, +1 star'); } else api.toast(`Pet Mochi. Cozy +${Math.round(aff * 10)}`);
    for (let i = 0; i < 3; i++) hearts.push({ x: cat.x + (i - 1) * 6, y: cat.y - 16 - i * 3, life: 1.2 });
  } else if (aff > 0.05) api.toast('Mochi purrs happily');
  cat.set('sit', 8);
}

function update(dt) {
  input.pressed = pressedNow;
  toasts.forEach((t) => (t.t -= dt)); while (toasts.length && toasts[0].t <= 0) toasts.shift();
  for (const h of hearts) { h.y -= 10 * dt; h.life -= dt; }
  while (hearts.length && hearts[0].life <= 0) hearts.shift();
  if (state.raining || sceneName === 'rain') for (const r of rain) { r.y += r.s * dt; r.x -= 20 * dt; if (r.y > VH) { r.y = -4; r.x = Math.random() * (VW + 20); } }
  if (scene.shootT >= 0) scene.shootT += dt;
  musicTick(dt, mode !== 'world');
  if (mode === 'title') {
    if (pressedNow.has('n')) { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } Object.assign(state, { day: 1, stars: 0, decor: [], flags: {} }); startDay(true); }
    else if (pressedNow.has('enter') || pressedNow.has(' ') || input.justDown) { sfx('select'); startDay(!hasSave); }
  } else if (mode === 'world') updateWorld(dt);
  else if (mode === 'cutscene') { cs && cs.update(dt, input); if (cs) cat.update(dt, { player, rects: solidRects(state.decor), rng, night: false }); }
  else if (mode === 'mini') {
    mini.update(dt, input);
    if (miniId === 'pet') { if (pressedNow.has('escape')) mini.finish(); if (mini.done) finishPet(); }
    else if (pressedNow.has('escape')) { mini = null; mode = 'world'; api.toast('Chore paused'); }
    else if (mini.done) { mode = 'result'; resultT = 0; sfx('chime'); }
  } else if (mode === 'result') {
    resultT += dt;
    if (resultT > 0.8 && act(input)) finishChore();
  } else if (mode === 'summary') {
    if (act(input)) { state.day++; save(); startDay(false); }
  }
  if (pressedNow.has('m')) toggleMusic();
  pressedNow = new Set(); input.pressed = pressedNow; input.justDown = false; input.moved = false;
}

// ---------- rendering ----------
let floorLayer = null;
function buildFloor() {
  floorLayer = document.createElement('canvas'); floorLayer.width = W * TILE * Z; floorLayer.height = H * TILE * Z;
  const f = floorLayer.getContext('2d'); f.imageSmoothingEnabled = false;
  const names = { k: 't_kitchen', w: 't_wood', b: 't_bath', s: 't_sun', d: 't_door_floor' };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = GRID[y][x];
    let n = names[c];
    if (c === '#') n = y + 1 < H && GRID[y + 1][x] !== '#' ? 't_wall_face' : 't_wall_top';
    f.drawImage(sprite2(n), x * TILE * Z, y * TILE * Z);
  }
  for (const [x, y] of WINDOWS) f.drawImage(sprite2('window'), x * TILE * Z, y * TILE * Z);
  for (const o of OBJECTS) if (o.wallDecor) f.drawImage(sprite2(o.spr), o.x * TILE * Z, ((o.y + o.h) * TILE - SPRITES[o.spr].h) * Z);
}

function objSprite(o) {
  const st = state;
  switch (o.id) {
    case 'basket': return st.chores.some((c) => c.id === 'laundry' && !c.done) ? 'basket_full' : 'basket';
    case 'bowl': return st.bowlFull ? 'bowl_full' : 'bowl_empty';
    case 'pot1': case 'pot2': case 'pot3': case 'pot4': return st.chores.some((c) => c.id === 'plants' && !c.done) ? 'pot_wilt' : 'pot_ok';
    default: return o.spr;
  }
}
// world-space (1x) position -> screen (2x, camera-relative)
function drawSpr(name, x, y, flip) { g.drawImage(sprite2(name, flip), Math.round(x * Z - cam.x), Math.round(y * Z - cam.y)); }
function drawFeet(name, wx, wy, flip) { const d = SPRITES[name]; drawSpr(name, wx - d.w / 2, wy - d.h + 1, flip); }
function shadow(wx, wy, w) { g.fillStyle = '#0000002e'; g.fillRect(Math.round(wx * Z - cam.x - w), Math.round(wy * Z - cam.y - 3), w * 2, 5); }
function objPos(o) { const s = SPRITES[o.spr]; return [o.x * TILE + (o.dx || 0), (o.y + o.h) * TILE - s.h + (o.dy || 0)]; }

function drawWorld() {
  if (!floorLayer) buildFloor();
  cam.x = clamp(player.x * Z - VW / 2, 0, W * TILE * Z - VW); cam.y = clamp(player.y * Z - 44 - VH / 2, 0, H * TILE * Z - VH);
  g.drawImage(floorLayer, -Math.round(cam.x), -Math.round(cam.y));
  const list = [];
  for (const o of OBJECTS) {
    if (o.wallDecor) continue;
    const [x, y] = objPos(o);
    if (o.flat) { drawSpr(o.spr, x, y); continue; }
    const fp = footprint(o);
    list.push({ d: fp[1] + fp[3], fn: () => {
      drawSpr(objSprite(o), x, y);
      if (o.id === 'sink' && state.chores.some((c) => c.id === 'dishes' && !c.done)) drawSpr('dishpile', x + 4, y - 2);
    } });
  }
  for (const id of state.decor) {
    const d = DECOR[id]; if (!d) continue;
    const [x, y] = objPos(d);
    if (d.wallDecor) drawSpr(d.spr, x, y); else list.push({ d: (d.y + d.h) * TILE + (d.dy ? 1 : 0), fn: () => drawSpr(d.spr, x, y) });
  }
  if (state.chores.some((c) => c.id === 'sweep' && !c.done)) DUST_SPOTS.forEach(([x, y]) => drawSpr('dust', x * TILE, y * TILE + 4));
  list.push({ d: cat.y, fn: () => {
    shadow(cat.x, cat.y, 10);
    drawFeet(cat.sprite, cat.x, cat.y + 1, cat.dir < 0 && cat.moving);
    if (cat.state === 'nap') drawSpr('zzz', cat.x + 4, cat.y - 20 + Math.sin(clock * 2) * 1.5);
  } });
  list.push({ d: player.y, fn: () => {
    shadow(player.x, player.y, 12);
    const sx = player.x * Z - cam.x, sy = player.y * Z - cam.y + 2;
    drawMisa(g, player.dir, player.moving ? (player.run ? 'run' : 'walk') : 'idle', player.at, sx, sy);
  } });
  if (pip.show) list.push({ d: DOOR_STEP.y, fn: () => { shadow(DOOR_STEP.x, DOOR_STEP.y, 10); drawFeet('pip', DOOR_STEP.x, DOOR_STEP.y); } });
  list.sort((a, b) => a.d - b.d).forEach((e) => e.fn());
  for (const h of hearts) { g.globalAlpha = Math.min(1, h.life); drawSpr(h.z ? 'zzz' : 'heart', h.x - 3, h.y); g.globalAlpha = 1; }
  lighting();
  if (state.raining) { g.fillStyle = '#bfe6f5'; for (const r of rain) g.fillRect(Math.round(r.x), Math.round(r.y), 1, 3); }
}

function lighting() {
  const m = state.minutes;
  let col = null;
  if (m < 8 * 60) col = `rgba(255,200,140,${0.14 * (8 * 60 - m) / 60})`;
  else if (m > 17 * 60) col = m < 20 * 60 ? `rgba(255,150,80,${0.16 * (m - 17 * 60) / 180})` : `rgba(40,40,110,${Math.min(0.42, 0.16 + 0.26 * (m - 20 * 60) / 120)})`;
  if (col) { g.fillStyle = col; g.fillRect(0, 0, VW, VH); }
  if (state.raining) { g.fillStyle = 'rgba(80,110,150,0.16)'; g.fillRect(0, 0, VW, VH); }
  if (state.blackout > 0) {
    const a = Math.min(0.88, state.blackout);
    const o = drawWorld.dark || (drawWorld.dark = document.createElement('canvas'));
    o.width = VW; o.height = VH;
    const d = o.getContext('2d');
    d.fillStyle = `rgba(6,4,24,${a})`; d.fillRect(0, 0, VW, VH);
    d.globalCompositeOperation = 'destination-out';
    for (const [r, al] of [[62, 0.25], [50, 0.3], [38, 0.35], [26, 0.5], [16, 1]]) { d.fillStyle = `rgba(0,0,0,${al})`; d.beginPath(); d.arc(player.x * Z - cam.x, player.y * Z - cam.y - 24, r * 1.5, 0, 7); d.fill(); }
    g.drawImage(o, 0, 0);
  }
}

function panel(x, y, w, h) { g.fillStyle = '#2b1d2ecc'; g.fillRect(x, y, w, h); g.fillStyle = '#fff1d666'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); }
function drawHUD() {
  g.fillStyle = '#2b1d2ed9'; g.fillRect(0, 0, VW, 12); g.fillStyle = '#fff1d655'; g.fillRect(0, 12, VW, 1);
  drawText(g, `DAY ${state.day}`, 4, 4, '#ffd76a');
  const hearts5 = Math.round(state.mood / 20);
  for (let i = 0; i < 5; i++) { g.globalAlpha = i < hearts5 ? 1 : 0.25; drawSpr('heart', 34 + i * 8, 3); }
  g.globalAlpha = 1;
  drawSpr('i_coin', 78, 2); drawText(g, `${state.stars}`, 88, 4, '#fffaf0');
  let cx = 112;
  for (const c of state.chores) {
    const t = (c.done ? '*' : '') + CHORES[c.id].tiny;
    drawText(g, t, cx, 4, c.done ? '#86cdb0' : '#fffaf0'); cx += measure(t) + 6;
  }
  const ct = clockText(state.minutes);
  drawText(g, ct, VW - measure(ct) - 4, 4, '#fffaf0');
  if (mode === 'world') {
    const { near, catNear } = targets();
    const label = near ? near.interact.label : catNear ? 'Pet Mochi' : null;
    if (label) {
      const t = `E: ${label}`, w = measure(t) + 8, x = Math.round(Math.max(2, Math.min(VW - w - 2, player.x * Z - cam.x - w / 2))), y = Math.max(16, Math.round(player.y * Z - cam.y - 66));
      panel(x, y, w, 12); drawText(g, t, x + 4, y + 4, '#fff6a0');
    }
  }
}
function drawToasts() {
  toasts.slice(-3).forEach((t, i, arr) => {
    const w = measure(t.text) + 12, y = 196 - (arr.length - 1 - i) * 15;
    g.globalAlpha = Math.min(1, t.t); panel(Math.round(VW / 2 - w / 2), y, w, 13); drawTextC(g, t.text, VW / 2, y + 4, '#fffaf0'); g.globalAlpha = 1;
  });
}

// close-up storybook scenes for cutscenes
function drawScene(name) {
  const t = clock;
  if (name === 'night' || name === 'rain') {
    const night = name === 'night';
    g.fillStyle = night ? '#171233' : '#65788c'; g.fillRect(0, 0, VW, VH);
    if (night) {
      for (let i = 0; i < 60; i++) { const x = (i * 97) % 300 + 10, y = (i * 53) % 110 + 10; g.fillStyle = (Math.floor(t * 2 + i) % 5) ? '#fffaf0' : '#8a7fb0'; g.fillRect(x, y, 1 + (i % 7 === 0), 1 + (i % 7 === 0)); }
      g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(240, 50, 18, 0, 7); g.fill(); g.fillStyle = '#171233'; g.beginPath(); g.arc(247, 46, 16, 0, 7); g.fill();
      if (scene.shootT >= 0 && scene.shootT < 1.2) {
        const p = scene.shootT / 1.2, x = 40 + p * 200, y = 20 + p * 70;
        for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,246,160,${1 - i / 14})`; g.fillRect(Math.round(x - i * 3), Math.round(y - i * 1.5), 3, 2); }
      }
    } else {
      g.fillStyle = '#7d90a4'; g.fillRect(0, 60, VW, 60);
      for (const r of rain) { g.fillStyle = '#bfe6f5'; g.fillRect(Math.round(r.x), Math.round(r.y), 1, 4); }
      if (Math.floor(t * 0.7) % 4 === 0 && (t * 10) % 7 < 1) { g.fillStyle = '#ffffff55'; g.fillRect(0, 0, VW, VH); }
    }
    g.fillStyle = '#7a4f3a'; g.fillRect(0, 0, VW, 12); g.fillRect(0, 0, 12, 112); g.fillRect(VW - 12, 0, 12, 112); g.fillRect(VW / 2 - 3, 0, 6, 104);
    g.fillStyle = '#c39264'; g.fillRect(0, 104, VW, 8); g.fillStyle = '#e3b184'; g.fillRect(0, 104, VW, 2);
    g.fillStyle = night ? '#3a2a4a' : '#5a4a58'; g.fillRect(0, 112, VW, VH - 112);
    drawMisa(g, 'left', 'idle', clock, 118, 112, 2);
    g.save(); g.translate(190, 108); g.scale(3, 3); g.drawImage(sprite(night ? `mochi_sit_${Math.floor(clock * 2) % 4}` : `mochi_sleep_${Math.floor(clock) % 2}`), -13, -25); g.restore();
  }
}

function drawTitle() {
  g.fillStyle = '#f7d9b5'; g.fillRect(0, 0, VW, VH);
  g.fillStyle = '#f4b58a'; g.fillRect(0, 130, VW, 94);
  for (let i = 0; i < 9; i++) { g.fillStyle = '#fff6e6'; g.fillRect((i * 47 + Math.floor(clock * 6)) % 340 - 20, 20 + (i % 3) * 22, 26, 6); }
  g.fillStyle = '#a67548'; g.fillRect(0, 168, VW, 56); g.fillStyle = '#c39264'; g.fillRect(0, 168, VW, 4);
  drawMisa(g, 'down', 'idle', clock, 118, 206, 2);
  g.save(); g.translate(212, 200); g.scale(3, 3); g.drawImage(sprite(Math.floor(clock * 2.2) % 9 === 8 ? 'mochi_sit_b' : `mochi_sit_${Math.floor(clock * 2.2) % 4}`), -13, -25); g.restore();
  drawTextC(g, "MISA'S", 160, 22, '#7a4f3a', 4, '#fff6e6'); drawTextC(g, 'LITTLE HOUSE', 160, 48, '#e0707a', 3, '#fff6e6');
  if (Math.floor(clock * 2) % 2) drawTextC(g, hasSave ? `CLICK OR ENTER TO CONTINUE (DAY ${state.day})` : 'CLICK OR ENTER TO START', 160, 84, '#2b1d2e', 1, null);
  if (hasSave) drawTextC(g, 'PRESS N FOR A NEW GAME', 160, 94, '#7a4f3a', 1, null);
  drawTextC(g, 'WASD MOVE - E INTERACT - P PET MOCHI - SHIFT RUN', 160, 212, '#2b1d2e', 1, null);
}

function drawResult() {
  mini.draw(g, sprite);
  panel(70, 70, 180, 70);
  drawTextC(g, 'ALL DONE!', 160, 78, '#ffd76a', 2);
  const s = starsFor(mini.score) + (mini.bonus || 0);
  for (let i = 0; i < Math.min(5, s); i++) g.drawImage(sprite('i_star'), 160 - Math.min(5, s) * 9 + i * 18, 98 + Math.round(Math.sin(resultT * 8 + i) * 2));
  if (mini.bonus) drawTextC(g, `+${mini.bonus} SHINY FOUND!`, 160, 120, '#fffaf0');
  if (resultT > 0.8) drawTextC(g, 'PRESS SPACE / CLICK', 160, 128 + (mini.bonus ? 4 : -2), '#fff6a0');
}

function drawSummary() {
  g.fillStyle = '#171233'; g.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 40; i++) { g.fillStyle = '#fffaf0'; g.fillRect((i * 83) % 316, (i * 41) % 200, 1, 1); }
  panel(50, 40, 220, 132);
  drawTextC(g, `DAY ${summary.day} COMPLETE`, 160, 50, '#ffd76a', 2);
  drawTextC(g, `CHORES DONE: ${summary.done}/${summary.total}`, 160, 80, '#fffaf0');
  drawTextC(g, `STARS: ${summary.stars}`, 160, 92, '#fffaf0');
  drawTextC(g, `HOUSE DECOR: ${summary.decor}/${Object.keys(DECOR).length}`, 160, 104, '#fffaf0');
  const h5 = Math.round(summary.mood / 20);
  for (let i = 0; i < 5; i++) { g.globalAlpha = i < h5 ? 1 : 0.25; g.drawImage(sprite('heart'), 132 + i * 12, 120, 14, 12); }
  g.globalAlpha = 1;
  drawTextC(g, summary.done === summary.total ? 'A PERFECT COZY DAY!' : 'TOMORROW WILL BE BETTER!', 160, 142, '#86cdb0');
  drawTextC(g, 'PRESS SPACE FOR THE NEXT DAY', 160, 158, '#fff6a0');
}

function render() {
  g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
  if (mode === 'title') return drawTitle();
  if (mode === 'summary') return drawSummary();
  if (mode === 'mini') { mini.draw(g, sprite); return; }
  if (mode === 'result') return drawResult();
  if (mode === 'cutscene' && sceneName) drawScene(sceneName); else drawWorld();
  if (mode !== 'cutscene' || !sceneName) drawHUD();
  drawToasts();
  if (cs) {
    if (cs.fade > 0) { g.fillStyle = `rgba(0,0,0,${cs.fade})`; g.fillRect(0, 0, VW, VH); }
    cs.draw(g, sprite, !sceneName && mode === 'cutscene' && player.y * Z - cam.y > 120);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  clock += mode === 'world' ? 0 : dt;
  try { update(dt); render(); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
hasSave = load();
Promise.all([loadOverrides().catch(() => {}), loadMisa()]).finally(() => requestAnimationFrame(frame));
