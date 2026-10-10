// ShapeWatch: boot, menus, input and the frame loop. Flow: loading -> menu (a bot match plays behind
// it) -> mode and map -> hero select -> live match (kill cam on death) -> victory -> Play of the Game
// -> report -> back to the menu or another match.
import * as E from '../../engine/index.js';
import { Sim } from './sim.js';
import { Brain } from './ai.js';
import { View } from './view.js';
import { Sfx } from './audio.js';
import { Music } from './music.js';
import { Comms } from './comms.js';
import { Voice, LINES } from './voice.js';
import { Portraits } from './portraits.js';
import { Hud, CommWheel, $, el } from './ui.js';
import { MenuScreen, PlayScreen, SelectScreen, Gallery, CareerScreen, SettingsPanel, EndScreen, renderScoreboard, DIFFS } from './screens.js';
import { Career, matchScore } from './stats.js';
import { Recorder, ReplayPlayer } from './replay.js';
import { HERO, HEROES } from './heroes.js';
import { MAPS, MODES } from './maps.js';
import { MUTATORS } from './sim.js';
import { clamp, forward } from './util.js';

const DEG = E.DEG;
let view;
try { view = new View($('stage')); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'ShapeWatch needs WebGL2. ' + e.message; throw e; }
const sfx = new Sfx(); view.sound = sfx;
const voice = new Voice();
const music = new Music(sfx);
const comms = new Comms(voice);
let heat = 0; // recent combat around the player, drives the music

// ------------------------------------------------------------------ settings
const settings = { sens: 1, fov: 90, vol: 0.6, music: 0.5, voice: true, voiceVol: 0.9, subs: true, invert: false, minimap: true, rotateMap: true, numbers: true, xhair: 'auto', xcolor: '#ffffff', showFps: false, chatter: 'all', side: 0, diff: 1, mut: 1, mode: 'escort', map: 'frostgate', hero: 'sabre', skin: 'default' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('shapewatch2') || '{}')); } catch { /* storage blocked */ }
const save = () => { try { localStorage.setItem('shapewatch2', JSON.stringify(settings)); } catch { /* ignore */ } };
if (!HERO[settings.hero]) settings.hero = 'sabre'; if (!MODES[settings.mode]) settings.mode = 'escort'; if (!MAPS[settings.map]?.modes.includes(settings.mode)) settings.map = Object.values(MAPS).find((m) => m.modes.includes(settings.mode)).id;

// ------------------------------------------------------------------ state
let sim, hud, portraits, select, gallery, menuScreen, playScreen, careerScreen, settingsPanel, endScreen, career, recorder, wheel, replay = null, replayKind = null, clipQueue = [], pendingKillcam = null;
let mode = 'loading', paused = false, acc = 0, last = performance.now(), fpsS = 60, endShown = false, scoreT = 0, overT = 0, report = null, lastLowHp = -99;
const keys = new Set(), mouse = { l: false, r: false };
const touch = { on: false, stick: { id: null, x: 0, y: 0 }, look: null };
const me = () => sim?.player;
const locked = () => document.pointerLockElement === $('stage');
const lockMouse = () => { if (touch.on) return; try { const r = $('stage').requestPointerLock?.(); if (r?.catch) r.catch(() => {}); } catch { /* sandboxed: drag to look */ } };
const unlockMouse = () => { if (document.pointerLockElement) document.exitPointerLock(); };
const show = (id, on = true) => { $(id).hidden = !on; };
const SCREENS = ['menu', 'hud', 'select', 'gallery', 'help', 'pause', 'end', 'score', 'play', 'career', 'settings', 'killcam', 'potg', 'wheel'];
const hideAll = () => { for (const id of SCREENS) show(id, false); };

function applySettings(k) {
  sfx.setVolume(settings.vol); music.setVolume(settings.music); comms.level = settings.chatter; view.fovH = settings.fov; voice.enabled = settings.voice; voice.volume = settings.voiceVol; voice.subs = settings.subs;
  if (hud) { hud.settings.minimap = settings.minimap; hud.settings.xhair = settings.xhair; hud.settings.xcolor = settings.xcolor; hud.minimap.rotate = settings.rotateMap; $('mmWrap').hidden = !settings.minimap; hud.hero = null; }
  view.showNumbers = settings.numbers; $('fps').style.display = settings.showFps ? '' : 'none';
  if (k) save();
}

// ------------------------------------------------------------------ flow
const ATTRACT = [['frostgate', 'escort'], ['sunscar', 'escort'], ['junction', 'hybrid'], ['lumen', 'control'], ['foundry', 'tdm'], ['lumen', 'tdm']];
function startAttract() {
  stopReplay(true);
  const [map, md] = ATTRACT[Math.floor(Math.random() * ATTRACT.length)];
  sim = new Sim({ autoPlayer: true, seed: (Math.random() * 1e6) | 0, difficulty: 1, mutators: false, mode: md, map });
  sim.setupT = 0.2; for (let i = 0; i < 60 * 24; i++) sim.step(1 / 60); sim.events.length = 0; recorder = null; comms.reset(null);
  view.attach(sim, { skin: 'default' }); view.mode = 'orbit'; mode = 'menu'; endShown = false; paused = false;
  hideAll(); show('menu'); menuScreen?.refresh(settings);
}
// Quick Play: a random mode, map and side, so the next match is never the same as the last
const QUICK = ['escort', 'escort', 'hybrid', 'control', 'control', 'tdm'];
let quickMatch = false, nextT = 0;
function startQuick() {
  settings.mode = QUICK[Math.floor(Math.random() * QUICK.length)];
  const maps = Object.values(MAPS).filter((m) => m.modes.includes(settings.mode)); settings.map = maps[Math.floor(Math.random() * maps.length)].id;
  settings.side = Math.random() < 0.5 ? 0 : 1; startMatch(true);
}
function startMatch(quick = false) {
  sfx.unlock(); voice.unlock(); stopReplay(true); save(); quickMatch = quick === true; nextT = 0;
  const M = MODES[settings.mode], team = M.teams ? (settings.mode === 'control' || settings.mode === 'tdm' ? (Math.random() < 0.5 ? 0 : 1) : settings.side) : 0;
  sim = new Sim({ playerTeam: SIDE_MODES.has(settings.mode) || settings.mode === 'control' ? team : (M.teams ? settings.side : 0), playerHero: settings.hero, difficulty: settings.diff, mutators: !!settings.mut && settings.mode !== 'training', seed: (Math.random() * 1e6) | 0, mode: settings.mode, map: settings.map });
  if (settings.mode === 'training') sim.setupT = 9999;
  recorder = new Recorder(sim); comms.reset(sim);
  view.attach(sim, { skin: settings.skin }); hud.reset(sim); view.fovH = settings.fov; paused = false; endShown = false; overT = 0; report = null; clipQueue = []; pendingKillcam = null; lastLowHp = -99;
  view.mode = 'select'; mode = 'select'; positionPreview(); voice.stop();
  hideAll(); openSelect(false);
}
const SIDE_MODES = new Set(['escort', 'hybrid']);
function positionPreview() { const u = sim.player; view.previewAnchor = { pos: [...u.pos], facing: forward(u.yaw, 0) }; view.previewHero = u.hero; view.previewTurn = 0; view.mySkin = settings.skin; }
function openSelect(mid) {
  const u = sim.player;
  select.open(sim, {
    mid, skin: settings.skin,
    onPick: (id) => { settings.hero = id; save(); view.previewHero = id; if (!mid && sim.state === 'setup') { sim.swapHero(u, id); sim.recompose(u.team); } },
    onSkin: (s) => { settings.skin = s; save(); view.mySkin = s; },
    onReady: () => { if (!mid) { sim.readyUp = true; return; } closeMid(); },
  });
}
function closeMid() {
  const u = sim.player; select.close(); u.held = false;
  const pick = select.sel;
  if (pick !== u.hero) { u.pendingHero = pick; settings.hero = pick; save(); if (u.alive) sim.spawn(u); }
  mode = 'play'; view.mode = 'fps'; show('hud'); lockMouse();
}
const BRIEF = {
  escort: (a) => [a ? 'ATTACK' : 'DEFEND', a ? 'ESCORT THE PAYLOAD TO THE END OF THE MAP' : 'HOLD BACK THE PAYLOAD', a ? '#5ab0ff' : '#ff6a72'],
  hybrid: (a) => [a ? 'ATTACK' : 'DEFEND', a ? 'CAPTURE THE POINT, THEN ESCORT THE PAYLOAD' : 'DEFEND THE POINT, THEN THE PAYLOAD', a ? '#5ab0ff' : '#ff6a72'],
  control: () => ['CONTROL', 'CAPTURE AND HOLD THE POINT · BEST OF THREE', '#ffd36b'],
  tdm: () => ['TEAM DEATHMATCH', 'FIRST TO ' + sim.scoreTarget + ' ELIMINATIONS', '#ff9a4a'],
  ffa: () => ['FREE FOR ALL', 'FIRST TO ' + sim.scoreTarget + ' ELIMINATIONS', '#c79bff'],
  training: () => ['TRAINING RANGE', 'TRY EVERY ABILITY · INFINITE ULTIMATE', '#7dffb0'],
};
function enterPlay() {
  select.close(); mode = 'play'; view.mode = 'fps'; show('hud'); hud.reset(sim); lockMouse(); sfx.announce('start'); voice.announce('start');
  const [t, s, c] = BRIEF[sim.modeId](sim.playerTeam === 0); hud.banner(t, s, c);
  view.fovCur = settings.fov; applySettings();
  const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.isPlayer && !u.deploy && sim.modeId !== 'ffa'); if (mates.length) setTimeout(() => { const m = mates[Math.floor(Math.random() * mates.length)]; voice.hero(m.hero, 'hello', { name: m.name.toUpperCase(), force: true }); }, 1400);
}
function pauseGame(on) {
  if (mode !== 'play' && mode !== 'paused') return;
  paused = on; mode = on ? 'paused' : 'play'; show('pause', on);
  if (on) { keys.clear(); mouse.l = mouse.r = false; wheel.hide(false); unlockMouse(); voice.stop(); } else lockMouse();
}
function openHeroChange() {
  const u = sim?.player; if (!u || mode !== 'play' || sim.state === 'over') return;
  const near = (sim.mode.spawnList(u) || []).some((p) => Math.hypot(p[0] - u.pos[0], p[2] - u.pos[2]) < 22);
  if (u.alive && !near && sim.modeId !== 'training') { hud.popup('CHANGE HERO AT YOUR SPAWN', 'save'); return; }
  u.held = true; mode = 'select-mid'; show('hud', false); unlockMouse();
  view.mode = 'select'; view.previewAnchor = { pos: [...(u.alive ? u.pos : (u.deadAt || u.pos))], facing: forward(u.yaw, 0) }; view.previewHero = u.hero; view.previewTurn = 0;
  openSelect(true);
}
function toMenu() { hideAll(); select.close(); paused = false; unlockMouse(); voice.stop(); startAttract(); }

// ------------------------------------------------------------------ replays: kill cam and Play of the Game
function startReplay(clip, kind) {
  replay = new ReplayPlayer(sim, clip); replayKind = kind;
  view.attach(replay.sim, { replay: true }); view.me = replay.sim.player; view.mode = kind === 'killcam' ? 'fps' : 'chase'; view.fovCur = settings.fov;
  if (kind === 'killcam') { show('hud', false); show('killcam'); $('kcName').textContent = (clip.name || '').toUpperCase() + ' · ' + HERO[clip.hero].name; const c = $('kcCard'); c.innerHTML = ''; c.append(portraits.canvas(clip.hero, 64)); c.insertAdjacentHTML('beforeend', `<div><b>${clip.name}</b><span>${HERO[clip.hero].name} · ${HERO[clip.hero].sub.toUpperCase()}</span></div>`); sfx.stinger('killcam'); mode = 'killcam'; }
  else { show('potg'); $('potgTitle').textContent = clip.title; const w = $('potgWho'); w.innerHTML = ''; w.append(portraits.canvas(clip.hero, 80)); w.insertAdjacentHTML('beforeend', `<div><b>${clip.name === 'You' ? 'YOU' : clip.name}</b><span>${HERO[clip.hero].name}${clip.hl?.kills > 1 ? ' · ' + clip.hl.kills + ' ELIMINATIONS' : ''}</span></div>`); $('potgHint').innerHTML = clipQueue.length ? '<kbd>SPACE</kbd> NEXT' : '<kbd>SPACE</kbd> CONTINUE'; sfx.stinger('potg'); mode = 'potg'; }
}
function stopReplay(silent = false) {
  if (!replay) return; replay = null; show('killcam', false); show('potg', false);
  if (!silent && sim) { view.attach(sim, { skin: settings.skin }); }
}
function endKillcam() {
  stopReplay(); pendingKillcam = null;
  if (sim.state === 'over') { mode = 'over'; return; }
  mode = 'play'; view.mode = 'fps'; show('hud');
}
function endClip() {
  stopReplay(true);
  if (clipQueue.length) { startReplay(clipQueue.shift(), 'potg'); return; }
  view.attach(sim, { skin: settings.skin }); view.mode = 'orbit'; showReport();
}
function beginPotg(list) { clipQueue = list.slice(1); hideAll(); unlockMouse(); startReplay(list[0], 'potg'); }

function endMatch() {
  if (endShown) return; endShown = true; unlockMouse(); hideAll(); voice.stop();
  recorder?.finish(); const clips = recorder ? recorder.best(1) : [];
  const p = me(), won = sim.winner === sim.playerTeam || (sim.modeId === 'ffa' && sim.winnerUnit === p);
  report = sim.modeId === 'training' ? { gain: 0, parts: [], medals: [], before: career.level, after: career.level, leveled: false, challenges: [], score: matchScore(p.stats) } : career.commit(sim, p, won);
  if (clips.length && sim.modeId !== 'training') beginPotg(clips); else showReport();
}
function showReport() {
  mode = 'end'; hideAll(); const clips = recorder ? recorder.best(3) : [];
  endScreen.render(sim, report, { clips, onAgain: () => { sfx.ui('select'); nextT = 0; if (quickMatch) startQuick(); else startMatch(); }, onMenu: () => { sfx.ui(); nextT = 0; toMenu(); }, onHighlights: () => { sfx.ui('select'); nextT = 0; clipQueue = []; beginPotg(recorder.best(3)); } });
  if (quickMatch) { nextT = 20; const d = el('div', 'e-next', 'NEXT QUICK PLAY IN <b id="eNextT">20</b> <button class="btn ghost small" id="eNextX" type="button">STAY HERE</button>'); document.querySelector('#end .e-btns')?.before(d); $('eNextX').onclick = () => { nextT = 0; d.remove(); }; }
  menuScreen.refresh(settings);
}

// ------------------------------------------------------------------ events from the simulation
view.onHit = (e) => { heat = Math.min(1, heat + 0.05); if (e.tgt && !e.tgt.alive) return; hud.hitmark(e.crit ? (e.head ? 'crit head' : 'crit') : e.head ? 'head' : ''); if (e.crit && !e.head && Math.random() < 0.5) hud.popup('CRITICAL HIT', 'crit'); };
view.onHurt = (e) => { heat = Math.min(1, heat + 0.08); if (e.src) hud.damageDir(e.src); hud.noteDamage(e); const p = me(); if (p && p.alive && (p.hp + p.armor) / (p.maxHp + p.maxArmor) < 0.3 && sim.time - lastLowHp > 14) { lastLowHp = sim.time; voice.hero(p.hero, 'hurt', { name: 'YOU', force: false }); } };
view.onHeal = (e) => { hud.heal(e); comms.onEvent(e); };
view.onKill = (e) => {
  if (mode === 'menu') return;
  comms.onEvent(e);
  hud.feedRow(e); const p = me();
  if (e.killer === p) {
    hud.hitmark('kill'); sfx.kill(); hud.popup('ELIMINATED', 'kill', e.victim.name.toUpperCase());
    if (p.streak === 2) hud.popup('DOUBLE ELIMINATION', 'streak'); else if (p.streak === 3) hud.popup('TRIPLE ELIMINATION', 'streak'); else if (p.streak >= 4) hud.popup(p.streak + ' ELIMINATION STREAK', 'streak');
    if (e.head) hud.popup('PRECISION KILL', 'streak'); if (p.s.ulting || p.st.overdrive) hud.popup('ULTIMATE ELIMINATION', 'streak');
    if (Math.random() < 0.4) voice.hero(p.hero, 'kill', { name: 'YOU', minGap: 9 });
  } else if (e.assists?.includes(p)) hud.popup('ASSIST', 'save', e.victim.name.toUpperCase());
  else if (e.killer && e.killer.team === sim.playerTeam && sim.modeId !== 'ffa' && Math.random() < 0.18) voice.hero(e.killer.hero, 'kill', { name: e.killer.name.toUpperCase(), minGap: 7 });
  if (e.victim === p && !replay) {
    const k = e.killer;
    if (k && recorder && p.respawnT >= 3.2 && sim.modeId !== 'training' && sim.state === 'live') { const clip = recorder.killcam(p, k); if (clip) pendingKillcam = { clip, t: 0.7 }; }
  }
};
view.onUlt = (e) => {
  heat = Math.min(1, heat + 0.3);
  const u = e.unit, mine = u.team === sim.playerTeam && sim.modeId !== 'ffa';
  if (mode !== 'menu') hud.popup(`${u.isPlayer ? 'YOUR' : mine ? 'ALLY' : 'ENEMY'} ULTIMATE · ${u.def.ult.name.toUpperCase()}`, mine ? 'save' : 'kill', u.isPlayer ? '' : u.name.toUpperCase());
};
const CALL_TEXT = new Set(['hello', 'thanks', 'group', 'help', 'push', 'fallback', 'defend', 'ultReady', 'enemy', 'go', 'objective', 'health', 'sorry', 'cheer', 'compliment', 'ally']);
view.onEvent = (e) => {
  if (mode === 'menu') return;
  switch (e.type) {
    case 'live': if (mode === 'select') enterPlay(); else if (mode === 'play' && sim.modeId === 'control') { hud.banner('GO!', 'ROUND ' + sim.round, '#ffd36b'); sfx.announce('round'); } break;
    case 'roundStart': hud.banner('ROUND ' + e.round, 'TAKE AND HOLD THE POINT', '#ffd36b'); voice.announce('start'); if (mode === 'play') { view.mode = 'fps'; } break;
    case 'round': { const won = e.winner === sim.playerTeam; hud.banner(won ? 'ROUND WON' : 'ROUND LOST', `${e.wins[sim.playerTeam]} — ${e.wins[1 - sim.playerTeam]}`, won ? '#5ab0ff' : '#ff6a72'); sfx.announce('round'); voice.announce(won ? 'roundWin' : 'roundLoss'); break; }
    case 'checkpoint': hud.banner('CHECKPOINT REACHED', `+${e.bonus} SECONDS ADDED · ${sim.playerTeam === 0 ? 'FORWARD SPAWN ONLINE' : 'ATTACKERS HAVE A FORWARD SPAWN'}`, '#ffd36b'); sfx.announce('checkpoint'); voice.announce('checkpoint'); break;
    case 'captured': hud.banner('POINT CAPTURED', sim.playerTeam === 0 ? 'NOW ESCORT THE PAYLOAD' : 'THE PAYLOAD IS ROLLING', '#ffd36b'); voice.announce('capture'); break;
    case 'capture': { const mineC = e.team === sim.playerTeam; hud.banner(mineC ? 'POINT CAPTURED' : 'POINT LOST', mineC ? 'HOLD IT TO FILL YOUR METER' : 'RETAKE THE POINT', mineC ? '#5ab0ff' : '#ff6a72'); voice.announce('capture'); break; }
    case 'overtime': hud.banner('OVERTIME', 'THE OBJECTIVE IS STILL IN PLAY', '#ffd36b'); sfx.announce('overtime'); voice.announce('overtime'); break;
    case 'mutator': hud.banner('RIFT SURGE', MUTATORS[e.id].name + ' · ' + MUTATORS[e.id].desc.toUpperCase(), '#c79bff'); sfx.announce('surge'); voice.announce('surge'); break;
    case 'mutatorEnd': hud.popup('THE SURGE FADES', 'save'); break;
    case 'ult': {
      const u = e.unit, mine = u.team === sim.playerTeam && sim.modeId !== 'ffa';
      comms.onEvent(e);
      if (mine || u.isPlayer) voice.hero(u.hero, 'ult', { name: u.isPlayer ? 'YOU' : u.name.toUpperCase(), force: true, ally: true }); else voice.announce('ultEnemy', u.def.ult.name);
      break;
    }
    case 'callout': comms.onEvent(e); break;
    case 'bounty': { const u = e.unit, mine = u.team === sim.playerTeam && sim.modeId !== 'ffa'; hud.banner(mine ? 'BOUNTY ON YOUR TEAM' : 'BOUNTY PLACED', `${u.isPlayer ? 'YOU' : u.name.toUpperCase()} · ${u.def.name} IS ON A ${u.streak} STREAK`, mine ? '#ffd36b' : '#ff6a72'); sfx.stinger('round'); break; }
    case 'bountyClaimed': { const k = e.killer; hud.popup('BOUNTY CLAIMED', 'streak', k.isPlayer ? '+30% ULT' : k.name.toUpperCase()); break; }
    case 'core': if (e.unit === me()) hud.popup('ECHO CORE', 'streak', '+12% ULT'); break;
    case 'revive': if (e.unit === me()) hud.popup('REVIVED', 'save'); break;
    case 'pack': break;
    case 'over': { const p = me(), won = e.winner === sim.playerTeam || (sim.modeId === 'ffa' && sim.winnerUnit === p); hud.banner(won ? 'VICTORY' : 'DEFEAT', e.why.toUpperCase(), won ? '#5ab0ff' : '#ff6a72'); sfx.announce(won ? 'win' : 'lose'); voice.announce(won ? 'victory' : 'defeat'); overT = 0;
      const mates = sim.units.filter((u) => !u.deploy && !u.isPlayer && (u.team === sim.playerTeam)); const m = mates[Math.floor(Math.random() * mates.length)] || p; setTimeout(() => voice.hero(m.hero, won ? 'win' : 'lose', { name: m.name.toUpperCase(), force: true }), 900); break; }
    case 'spawn': if (e.unit === me() && mode === 'play') view.mode = 'fps'; break;
  }
};
voice.onSub = (s) => { if (mode === 'play' || mode === 'over' || mode === 'select') hud?.subtitle(s); };

// ------------------------------------------------------------------ input
const cv = $('stage');
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('mousedown', (e) => {
  sfx.unlock(); voice.unlock(); if (mode === 'play' && !locked()) lockMouse();
  if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true;
  if (e.button === 1) { e.preventDefault(); doPing(); }
  if (mode === 'gallery') { gallerySpin = { x: e.clientX, v: view.previewTurn }; }
});
addEventListener('mouseup', (e) => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; gallerySpin = null; });
let gallerySpin = null;
addEventListener('pointermove', (e) => {
  if (mode === 'gallery' && gallerySpin && e.buttons) { view.previewTurn = gallerySpin.v + (e.clientX - gallerySpin.x) * 0.6; return; }
  if (mode !== 'play' || e.pointerType === 'touch') return;
  if (e.pointerType === 'mouse' && e.buttons !== undefined) { mouse.l = !!(e.buttons & 1); mouse.r = !!(e.buttons & 2); }
  if (wheel.open) { wheel.move(e.movementX, e.movementY); return; }
  if (!locked() && !e.buttons) return; look(e.movementX, e.movementY, 0.0022);
});
function look(dx, dy, base) {
  const u = me(); if (!u || !u.alive || sim.state === 'setup') return;
  const zoom = view.fovCur ? view.fovCur / settings.fov : 1, s = base * settings.sens * zoom ** 0.9, inv = settings.invert ? -1 : 1;
  u.yaw -= dx * s; u.pitch = clamp(u.pitch - dy * s * inv, -1.5, 1.5); view._dyaw = (view._dyaw || 0) + dx * 0.0004; view._dpitch = (view._dpitch || 0) + dy * 0.0004;
}
document.addEventListener('pointerlockchange', () => { if (!locked() && mode === 'play' && sim.state !== 'over') pauseGame(true); });
addEventListener('blur', () => { keys.clear(); mouse.l = mouse.r = false; wheel?.hide(false); });
function doPing() { const u = me(); if (!u || !u.alive || mode !== 'play' || sim.state === 'setup') return; sim.ping(u); }
function doCall(id) { const u = me(); if (!u || mode !== 'play') return; sim.callout(u, id); comms.playerCall(id); hud.popup('COMMS · ' + id.replace(/([A-Z])/g, ' $1').toUpperCase(), 'save'); }
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'tab') { e.preventDefault(); if (mode === 'play' || mode === 'over') { show('score'); renderScoreboard(sim, portraits); } return; }
  if (e.repeat) { if (['w', 'a', 's', 'd', ' '].includes(k)) keys.add(k); return; }
  keys.add(k); sfx.unlock(); voice.unlock();
  if (k === ' ' && (mode === 'play' || mode === 'killcam' || mode === 'potg')) e.preventDefault();
  if (mode === 'killcam' && (k === ' ' || k === 'enter' || k === 'escape')) { endKillcam(); return; }
  if (mode === 'potg' && (k === ' ' || k === 'enter' || k === 'escape')) { endClip(); return; }
  if (mode === 'select' && (k === 'enter' || k === ' ')) { select.onReady?.(); return; }
  if ((mode === 'select' || mode === 'select-mid') && (k === 'arrowright' || k === 'arrowleft')) { const i = HEROES.findIndex((h) => h.id === select.sel), n = HEROES[(i + (k === 'arrowright' ? 1 : HEROES.length - 1)) % HEROES.length]; select.pick(n.id); return; }
  if (k === 'escape') {
    if ($('settings').hidden === false) { settingsPanel.close(); return; }
    if (mode === 'select-mid') { select.close(); me().held = false; mode = 'play'; view.mode = 'fps'; show('hud'); lockMouse(); } else if (mode === 'select') pauseGame2(); else if (mode === 'paused') pauseGame(false); else if (mode === 'paused-select') { mode = sim.state === 'setup' ? 'select' : 'select-mid'; show('pause', false); } else if (mode === 'play') pauseGame(true); return;
  }
  if (mode === 'select-mid' && k === 'enter') { select.onReady?.(); return; }
  if (mode !== 'play') return;
  const u = me(); if (!u) return;
  if (!u.alive && (k === 'arrowleft' || k === 'arrowright' || k === ' ')) { view.cycleSpectate(k === 'arrowleft' ? -1 : 1); return; }
  if (k === 'shift') u.in.a1 = true; if (k === 'e') u.in.a2 = true; if (k === 'q') u.in.ult = true; if (k === 'r') u.in.reload = true; if (k === 'h') openHeroChange();
  if (k === 'z') doPing(); if (k === 'c' && u.alive && sim.modeId !== 'ffa' && sim.modeId !== 'training') wheel.show();
  if (k === 'm') { settings.minimap = !settings.minimap; applySettings(true); }
});
addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); keys.delete(k); if (k === 'tab') show('score', false); if (k === 'c') wheel.hide(true); });
function pauseGame2() { mode = 'paused-select'; show('pause'); }
$('pResume').onclick = () => { sfx.ui(); if (mode === 'paused-select') { mode = sim.state === 'setup' ? 'select' : 'select-mid'; show('pause', false); } else pauseGame(false); };
$('pSettings').onclick = () => { sfx.ui(); show('pause', false); settingsPanel.open(() => show('pause')); };
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
  btn('tUlt', () => { if (me()) me().in.ult = true; }); btn('tRel', () => { if (me()) me().in.reload = true; }); btn('tTab', () => { show('score', $('score').hidden); renderScoreboard(sim, portraits); }); btn('tPing', () => doPing());
}
$('hBack').onclick = () => { sfx.ui(); show('help', false); };

// ------------------------------------------------------------------ menu navigation
function openPlay() { menuScreen.root.hidden = true; playScreen.open(); mode = 'play-select'; }
function backToMenu() { for (const id of ['play', 'gallery', 'career', 'help']) show(id, false); menuScreen.root.hidden = false; menuScreen.refresh(settings); view.mode = 'orbit'; mode = 'menu'; }
function openGallery() { menuScreen.root.hidden = true; mode = 'gallery'; const u = sim.units[0]; const L = sim.level; const c = L.spawns[0][2] || L.spawns[0][0]; view.previewAnchor = { pos: [c[0], c[1] || 0, c[2]], facing: [0, 0, 1] }; view.mySkin = gallery.skin; gallery.open(); view.mode = 'gallery'; view.previewHero = gallery.cur; void u; }
function openCareer() { menuScreen.root.hidden = true; careerScreen.open(); mode = 'career'; }

// ------------------------------------------------------------------ player input -> unit
function drivePlayer() {
  const u = me(); if (!u || !u.alive || mode !== 'play' || paused) return;
  const k = keys, st = touch.stick; let mx = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0), mz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
  if (!mx && !mz && Math.hypot(st.x, st.y) > 0.12) { mx = st.x; mz = -st.y; }
  u.in.move = [mx, mz]; u.in.jump = k.has(' '); const blocked = wheel.open; u.in.fire1 = mouse.l && !blocked; u.in.fire2 = mouse.r && !blocked;
}

// ------------------------------------------------------------------ music
function driveMusic(dt) {
  heat *= Math.exp(-dt * 0.35);
  const theme = sim?.level?.theme, p = me();
  let mood = 'menu';
  if (mode === 'select' || mode === 'select-mid' || mode === 'paused-select') mood = 'select';
  else if (mode === 'play' || mode === 'killcam' || mode === 'paused') mood = sim.inOvertime ? 'overtime' : 'match';
  else if (mode === 'potg') mood = 'potg';
  else if (mode === 'over' || mode === 'end') mood = (sim.winner === sim.playerTeam || (sim.modeId === 'ffa' && sim.winnerUnit === p)) ? 'victory' : 'defeat';
  music.setMood(mood, mood === 'menu' ? null : theme);
  if (mood === 'match' && p) {
    let near = 0; for (const u of sim.units) if (u.alive && !u.deploy && u.team !== p.team && Math.hypot(u.pos[0] - p.pos[0], u.pos[2] - p.pos[2]) < 26) near++;
    const contested = sim.payload?.contested || sim.control?.contested || sim.cap?.contested;
    music.setIntensity(0.12 + heat * 0.7 + Math.min(4, near) * 0.07 + (contested ? 0.25 : 0) + (sim.state === 'setup' ? -0.1 : 0));
  }
}

// ------------------------------------------------------------------ frame
const HZ = 1 / 60;
function liteEvents(events) {
  for (const e of events) { if (e.type === 'kill') view.onKill?.(e); else view.onEvent?.(e); }
}
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now; fpsS += (1 / Math.max(dt, 1e-3) - fpsS) * 0.05;
  if (mode !== 'loading') {
    const stepping = !paused && mode !== 'paused-select' && mode !== 'paused' && !(mode === 'end') && !(mode === 'potg') && mode !== 'gallery' && mode !== 'career' && mode !== 'play-select';
    if (stepping || mode === 'gallery' || mode === 'play-select' || mode === 'career') {
      if (stepping) {
        drivePlayer(); acc += dt; let n = 0;
        while (acc >= HZ && n++ < 4) { sim.step(HZ); if (replay) liteEvents(sim.events); else view.handle(sim.events); acc -= HZ; }
        if (mode === 'menu' && sim.state === 'over' && sim.overT > 6) startAttract();
      } else { acc += dt; let n = 0; while (acc >= HZ && n++ < 4) { sim.step(HZ); view.handle(sim.events); acc -= HZ; } }
    }
    // the replay (kill cam or Play of the Game) drives the view while it runs
    if (replay) {
      const evs = replay.step(dt); view.handle(evs); view.me = replay.sim.player;
      const bar = replayKind === 'killcam' ? $('kcBar') : $('potgBar'); bar.style.width = replay.progress * 100 + '%';
      if (replay?.done) { replay.hold = (replay.hold || 0) + dt; if (replay.hold > (replayKind === 'killcam' ? 0.25 : 0.7)) { if (replayKind === 'killcam') endKillcam(); else endClip(); } }
    }
    if (pendingKillcam && !replay && mode === 'play' && sim.state === 'live') { pendingKillcam.t -= dt; if (pendingKillcam.t <= 0 && !me().alive) { const c = pendingKillcam.clip; pendingKillcam = null; startReplay(c, 'killcam'); } }
    view.syncPreview(dt); view.syncUnits(dt); view.fx.syncProjs(dt); view.fx.syncZones(dt); view.syncWorld(dt);
    view.updateCamera(dt); view.updateViewmodel(dt); view.updateOverlays(dt); view.tick(dt); view.render(dt);
    if (nextT > 0 && mode === 'end') { nextT -= dt; const n = $('eNextT'); if (n) n.textContent = Math.ceil(nextT); if (nextT <= 0) startQuick(); }
    driveMusic(dt); if (mode === 'play' || mode === 'select' || mode === 'killcam') comms.tick(dt);
    if (mode === 'select' || mode === 'select-mid') select.update(dt);
    if (mode === 'play' || mode === 'over' || mode === 'paused') {
      hud.killcamOn = false; hud.update(dt, fpsS);
      if (!$('score').hidden) { scoreT -= dt; if (scoreT <= 0) { scoreT = 0.3; renderScoreboard(sim, portraits); } }
    }
    if (sim.state === 'over' && (mode === 'play' || mode === 'over' || mode === 'killcam')) { if (mode === 'killcam') endKillcam(); overT ||= now; if (now - overT > 3600 && !endShown) endMatch(); }
    if (mode === 'play' && touch.on) show('touch'); else if (touch.on) show('touch', false);
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ boot
async function boot() {
  const bar = $('ldBar'), msg = $('ldMsg');
  await new Promise((r) => setTimeout(r, 30));
  career = new Career(); portraits = new Portraits(); msg.textContent = 'Forging heroes…';
  await portraits.generate((p) => { bar.style.width = Math.round(p * 100) + '%'; });
  msg.textContent = 'Building the maps…';
  hud = new Hud(view, portraits); wheel = new CommWheel($('wheel'), doCall); select = new SelectScreen(view, portraits, sfx, voice); gallery = new Gallery(view, portraits, career, voice, sfx); endScreen = new EndScreen(portraits, sfx);
  settingsPanel = new SettingsPanel(settings, sfx, applySettings);
  playScreen = new PlayScreen({ settings, sfx, onStart: () => { playScreen.close(); startMatch(); }, onBack: backToMenu });
  careerScreen = new CareerScreen(portraits, career, sfx); careerScreen.onBack = backToMenu; gallery.onBack = backToMenu;
  menuScreen = new MenuScreen({ portraits, career, sfx, onPlay: openPlay, onQuick: () => startQuick(), onHeroes: openGallery, onCareer: openCareer, onSettings: () => settingsPanel.open(), onHelp: () => show('help') });
  hud.onUltReady = () => { const p = me(); if (p) voice.hero(p.hero, 'ready', { name: 'YOU', minGap: 25 }); };
  voice.unlock(); applySettings();
  startAttract(); hud.reset(sim); view.fovH = settings.fov;
  $('loading').hidden = true; mode = 'menu';
  window.__sw = { E, get sim() { return sim; }, view, hud, select, gallery, settings, career, voice, sfx, get recorder() { return recorder; }, get replay() { return replay; }, startMatch, startAttract, pauseGame, openHeroChange, openPlay, openGallery, openCareer, startReplay, endMatch, endKillcam, endClip, doPing, doCall, wheel, portraits, autoplay(on = true) { const u = sim.player; u.bot = on ? new Brain(sim, u, 1) : null; }, get mode() { return mode; }, set mode(m) { mode = m; }, keys, mouse, enterPlay, step: (n = 1) => { for (let i = 0; i < n; i++) { drivePlayer(); sim.step(HZ); if (replay) liteEvents(sim.events); else view.handle(sim.events); } } };
}
requestAnimationFrame(frame);
boot().catch((e) => { $('fatal').hidden = false; $('fatal').textContent = 'ShapeWatch failed to start: ' + e.message; console.error(e); });
