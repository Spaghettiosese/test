// The application shell: splash, menus, operator select, loading, the match loop (rounds, side
// swaps, results), tutorials, the observer mode, pause, input and settings.
import { Store } from '../data/store.js';
import { Game } from '../game/game.js';
import { GameAudio } from '../game/audio.js';
import { MaterialLib } from '../world/materials.js';
import { Match } from '../game/match.js';
import { Tutorial, TUTORIALS } from '../game/tutorial.js';
import { MenuScene } from './menuscene.js';
import { Hud } from './hud.js';
import { OpSelect } from './opselect.js';
import { MenuUI } from './menuui.js';
import { PLAYLISTS } from './screens.js';
import { emblem, opIcon } from './icons.js';
import { OPS_BY_ID } from '../data/operators.js';
import { HARBOR } from '../data/harbor.js';

const LISTS = Object.fromEntries(PLAYLISTS.map((p) => [p.id, p]));
LISTS.skirmish = { id: 'skirmish', name: 'Skirmish', mode: 'secure', level: 2, down: true, tag: 'CASUAL', xp: 0.8, prep: 20, action: 100, toWin: 1 };
const FIXTURES = [['Nova Vanguard', 'Obsidian'], ['Ironclad Five', 'Tidewatch'], ['Kestrel Ops', 'Northwatch']];
const REASONS = { elimination: 'All enemies eliminated', exploded: 'The defuser detonated', defused: 'The defuser was disabled', time: 'Time ran out', secured: 'The area was secured' };
const TIPS = ['Crouch to keep your footsteps quiet.', 'Reinforced walls only open to hard breach charges and thermite.', 'Press X in the preparation phase to launch your drone.', 'Hold F over a downed teammate to revive them.', 'Shoot through soft walls: bullets lose damage but keep going.', 'Barricaded doors can be cleared with a hammer or explosives.', 'The defuser takes seven seconds to plant. Clear the room first.', 'Listen for hammer blows: someone is opening a wall.'];
const TOD = { day: 15.2, dusk: 18.4, night: 22.5 };
const KEYHELP = [['W A S D', 'Move'], ['Shift', 'Sprint'], ['C / Z', 'Crouch / prone'], ['Q / E', 'Lean'], ['Space', 'Jump / vault a window'], ['Mouse', 'Look (or arrow keys)'], ['Left / right mouse', 'Fire / aim down sights'], ['R', 'Reload'], ['1 / 2', 'Primary / secondary'], ['3 / 4', 'Operator / second gadget'], ['G', 'Use gadget · B detonate'], ['F', 'Interact (hold): doors, reinforce, plant, revive'], ['V', 'Melee'], ['X', 'Drone / camera'], ['T', 'Ping / mark an enemy'], ['Tab', 'Scoreboard'], ['Esc / P', 'Pause'], ['H', 'This help']];

export function keyName(e) {
  const c = e.code || '';
  if (c.startsWith('Key')) return c.slice(3).toLowerCase();
  if (c.startsWith('Digit')) return c.slice(5);
  if (c.startsWith('Shift')) return 'shift';
  if (c.startsWith('Control')) return 'control';
  if (c === 'Space') return ' ';
  return (e.key || '').toLowerCase();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });

export class App {
  constructor() {
    this.layer = document.getElementById('ui'); this.canvas = document.getElementById('stage');
    this.store = new Store(); this.audio = new GameAudio();
    this.game = new Game(this.canvas, { settings: this.store.settings, audio: this.audio, lib: new MaterialLib() });
    this.menu = new MenuScene(this.game.renderer, this.game.lib);
    this.hud = new Hud(this); this.os = new OpSelect(this); this.ui = new MenuUI(this);
    this.overlay = document.createElement('div'); this.layer.appendChild(this.overlay);
    this.overlay.addEventListener('click', (e) => this.overlayClick(e));
    this.toastHost = document.createElement('div'); this.layer.appendChild(this.toastHost);
    this.fadeEl = document.getElementById('fade'); this.lockHint = document.getElementById('lockhint'); this.splash = document.getElementById('splash');
    this.state = 'splash'; this.match = null; this.tutorial = null; this.watching = null; this.timeScale = 1; this.menuOffset = 0;
    this.lockFailed = false; this.releasing = false; this.mouse = { x: 0, y: 0 }; this.arrows = new Set(); this.helpOpen = false;
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.applySettings();
    this.ui.opSel = this.ui.favOp('atk').id; this.ui.lockOp = this.ui.opSel; this.ui.show(true); this.ui.render(); this.ui.hero();
    this.bindInput();
    this.last = performance.now(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    if (this.splash) this.splash.addEventListener('click', () => this.enter());
    document.body.classList.add('ready');
  }
  resize() {
    this.uiScale = Math.max(0.55, Math.min(1.3, Math.min(window.innerWidth / 1800, window.innerHeight / 1020)));
    this.layer.style.zoom = this.uiScale; this.hud.applyZoom();
  }
  botOwns() { return true; }
  unread() { return this.ui.unread(); }

  // ---------------------------------------------------------------- settings
  applySettings() {
    const s = this.store.settings, au = this.audio;
    au.setVolume(s.volume); au.speech = !!s.voice; au.musicVol = s.musicVol; au.enabled = true;
    this.game.settings = s; this.game.applySettings();
    const cb = { protanopia: ['#2a7de1', '#f0b020'], deuteranopia: ['#2a7de1', '#f0b020'], tritanopia: ['#18b5a8', '#e0407a'] }[s.colorblind] || ['#1f8fe0', '#e5382a'];
    document.documentElement.style.setProperty('--atk', cb[0]); document.documentElement.style.setProperty('--def', cb[1]);
    this.hud.applyZoom();
    if (au.ctx && au.music && s.musicVol <= 0) au.stopMusic();
  }
  toast(text) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; this.toastHost.appendChild(d); setTimeout(() => d.remove(), 3300); }
  fade(ms = 700) { const f = this.fadeEl; if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; setTimeout(() => { f.style.transition = `opacity ${ms}ms`; f.style.opacity = 0; }, 40); }

  // ---------------------------------------------------------------- flow: splash and menu
  enter() {
    if (this.state !== 'splash') return;
    this.audio.unlock(); this.applySettings(); if (this.store.settings.musicVol > 0) this.audio.startMusic('menu');
    this.splash.hidden = true; this.toMenu();
  }
  toMenu() {
    this.exitLock(); this.game.dispose(); this.match = null; this.tutorial = null; this.watching = null; this.timeScale = 1; this.helpOpen = false;
    this.state = 'menu'; this.hud.show(false); this.hud.setTutorial(null); this.os.close(); this.overlay.innerHTML = ''; this.lockHint.hidden = true;
    this.ui.page = 'play'; this.ui.show(true); this.ui.render(); this.ui.hero(); this.fade();
    if (this.audio.ctx && this.store.settings.musicVol > 0) this.audio.startMusic('menu');
  }
  startPlaylist(id) {
    if (id === 'range') { location.href = 'range.html'; return; }
    const L = LISTS[id]; if (!L) return;
    if (L.need && this.store.level.level < L.need) { this.toast(`Reach clearance level ${L.need} to unlock ${L.name}`); return; }
    const s = this.store.settings, toWin = L.toWin ?? (id === 'custom' ? s.rounds : 3);
    this.audio.unlock(); this.match = new Match(L, { toWin, startSide: Math.random() < 0.5 ? 'atk' : 'def' }); this.tutorial = null; this.watching = null;
    if (id === 'custom') this.toast(`Custom: first to ${toWin}, preparation ${s.prep}s, round ${s.action}s (change in Settings > Match)`);
    this.startOpSelect();
  }
  startOpSelect() {
    const m = this.match, L = m.list;
    this.exitLock(); this.state = 'os'; this.hud.show(false); this.ui.show(false); this.overlay.innerHTML = ''; this.lockHint.hidden = true; this.fade(500);
    this.os.open({ side: m.side, round: m.roundNo, toWin: m.toWin, mode: L.mode, seconds: m.roundNo === 1 ? 40 : 25 }, (sel) => this.launchRound(sel));
  }

  // ---------------------------------------------------------------- flow: starting a round
  todHours() { const t = this.store.settings.tod; return t === 'random' ? [TOD.day, TOD.dusk, TOD.night][Math.floor(Math.random() * 3)] : (TOD[t] ?? TOD.day); }
  roundCfg(L, sel) {
    const s = this.store.settings, custom = L.id === 'custom', follow = !(L.ranked || L.id === 'elite');
    const cfg = {
      player: { team: sel.side, op: sel.op, primary: sel.loadout.primary, secondary: sel.loadout.secondary, gadget2: sel.loadout.gadget2 },
      site: sel.side === 'def' ? sel.site : undefined, spawn: sel.side === 'atk' ? sel.spawn : undefined,
      level: follow ? s.difficulty : L.level, down: custom ? s.down : (L.down ?? true), friendlyFire: custom ? s.friendlyFire : !!L.ff,
      prep: custom ? s.prep : (L.prep ?? 45), action: custom ? s.action : (L.action ?? 180), mode: L.mode, tod: this.todHours(), seed: (Math.random() * 1e9) | 0,
    };
    cfg[sel.side] = sel.mates;
    return cfg;
  }
  showLoading(title, sub) {
    this.overlay.innerHTML = `<div class="scr loading"><div>${emblem()}<h2>${title}</h2><p>${sub}</p><p style="margin-top:14px;max-width:420px">${TIPS[Math.floor(Math.random() * TIPS.length)]}</p><div class="bar"><b></b></div></div></div>`;
  }
  async launchRound(sel) {
    const m = this.match; this.state = 'loading'; this.os.close();
    this.showLoading(HARBOR.name, `Round ${m.roundNo} · ${sel.side === 'atk' ? 'Attack' : 'Defend'}`);
    await frames(3);
    try { this.game.startRound(this.roundCfg(m.list, sel)); } catch (err) { console.error(err); this.toast('Could not start the round: ' + err.message); this.toMenu(); return; }
    this.hud.bind(this.game); this.hud.setTutorial(null); this.beginPlay();
  }
  beginPlay() {
    this.state = 'game'; this.ui.show(false); this.os.close(); this.overlay.innerHTML = ''; this.hud.show(true);
    this.endHandled = false; this.endT = 0; this.skip = false; this.advancing = false; this.timeScale = 1; this.helpOpen = false;
    this.wireStats(); this.fade(900);
    if (this.audio.ctx) this.audio.stopMusic();
    this.lockHint.hidden = this.locked || this.lockFailed || !this.game.playerActor;
    this.arrows.clear();
  }
  wireStats() {
    const sim = this.game.sim, me = this.game.playerActor, st = this.store, hud = this.hud; if (!me) return;
    const track = (k, n = 1) => { for (const c of st.track(k, n)) this.toast(`Challenge complete: ${c.text}`); };
    sim.on('revive', (e) => { if (e.by === me) track('revive'); });
    sim.on('throw', (e) => { if (e.actor === me) track('throw'); });
    sim.on('death', (e) => { if (e.killer === me && e.actor.team !== me.team && e.wpn && e.wpn.melee) track('melee'); });
    sim.on('hit', (e) => { if (e.shooter === me && e.target.team !== me.team && st.settings.hitMarker) hud.hitMark(e.headshot); });
  }

  // ---------------------------------------------------------------- tutorials
  startTutorial(id) {
    const t = this.store.profile.tutorial; id = id || (!t.basic ? 'basic' : !t.attack ? 'attack' : !t.defense ? 'defense' : 'basic');
    this.audio.unlock(); this.match = null; this.watching = null; this.launchTutorial(id);
  }
  async launchTutorial(id) {
    const T = TUTORIALS[id]; this.state = 'loading'; this.ui.show(false); this.os.close(); this.showLoading(`${T.title} tutorial`, 'Harbor Garage');
    await frames(3);
    const cfg = { player: { team: T.team, op: T.op, primary: T.primary, secondary: T.secondary, gadget2: T.gadget2 }, site: T.site, spawn: T.spawn, level: T.level, prep: T.prep, action: T.action, mode: 'bomb', tod: TOD.day, down: true, seed: 11 };
    try { this.game.startRound(cfg); } catch (err) { console.error(err); this.toast('Could not start: ' + err.message); this.toMenu(); return; }
    this.hud.bind(this.game); this.tutorial = new Tutorial(id, this); this.tutorial.attach(this.game); this.beginPlay();
  }
  tutorialDone(id) {
    const st = this.store, p = st.profile;
    p.tutorial[id] = true; st.save();
    if (id === 'basic') this.toast2(st.track('tutorial_basic'));
    if (p.tutorial.attack && p.tutorial.defense) this.toast2(st.track('tutorial_atkdef'));
    this.hud.bannerShow('TUTORIAL COMPLETE', 'Returning to the menu', 4); this.audio.ui('levelup');
  }
  toast2(list) { for (const c of list) this.toast(`Mission complete: ${c.text} Claim it from the menu.`); }

  // ---------------------------------------------------------------- observer mode (Esports)
  async watch(i, picks) {
    const fx = FIXTURES[i] || FIXTURES[0]; this.audio.unlock(); this.match = null; this.tutorial = null; this.watching = { i, fx, pick: picks ? picks[i] : undefined };
    this.state = 'loading'; this.ui.show(false); this.showLoading(`${fx[0]} vs ${fx[1]}`, 'Forge Pro League · Harbor Garage');
    await frames(3);
    try { this.game.startRound({ player: null, level: 3, prep: 25, action: 120, mode: 'bomb', tod: TOD.day, seed: (Math.random() * 1e9) | 0 }); } catch (err) { console.error(err); this.toast('Could not start: ' + err.message); this.toMenu(); return; }
    this.hud.bind(this.game); this.beginPlay();
    this.toast('Observer: Space/arrows change target, 1 / 2 / 3 set speed, Esc to leave');
  }

  // ---------------------------------------------------------------- the frame loop
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    try { this.frame(dt); } catch (err) { if (!this.failed) { this.failed = true; console.error(err); this.toast('Error: ' + err.message); } }
  }
  frame(dt) {
    switch (this.state) {
      case 'splash': case 'menu': this.menu.update(dt); this.menu.render({ offset: this.menuOffset }); break;
      case 'os': this.menu.update(dt); this.menu.render({ offset: 1.1 }); this.os.update(dt); break;
      case 'game': this.tick(dt); break;
      case 'pause': case 'result': if (this.game.sim) this.game.render(0); break;
      default:
    }
  }
  matchLike() { return this.match || this.pseudo || (this.pseudo = { roundNo: 1, sideScores: () => ({ atk: 0, def: 0 }) }); }
  tick(dt) {
    const g = this.game, sim = g.sim; if (!sim) return;
    this.pollLook(dt);
    const n = this.watching ? this.timeScale : 1;
    for (let i = 0; i < n; i++) { g.update(dt); if (this.tutorial) this.tutorial.update(dt); }
    g.render(dt);
    this.hud.update(dt, this.matchLike());
    this.lockHint.hidden = this.locked || this.lockFailed || !g.playerActor;
    if (this.tutorial && this.tutorial.done && this.tutorial.doneT > 4.5 && !this.advancing) { this.advancing = true; this.toMenu(); return; }
    this.roundFlow(dt);
  }
  roundFlow(dt) {
    const sim = this.game.sim, r = sim.round; if (r.phase !== 'end') return;
    if (!this.endHandled) { this.endHandled = true; this.endT = 0; this.onRoundEnd(); }
    this.endT += dt;
    if (!this.advancing && (this.endT > (this.watching ? 5 : 7) || (this.skip && this.endT > 1.2))) { this.advancing = true; this.afterRound(); }
  }
  onRoundEnd() {
    const sim = this.game.sim, res = sim.round.result || { winner: 'def', reason: 'time' }, me = this.game.playerActor, hud = this.hud;
    if (this.tutorial) { if (!this.tutorial.done) hud.bannerShow('TRY AGAIN', 'The tutorial restarts', 5); return; }
    if (this.watching) { hud.bannerShow(`${res.winner === 'atk' ? this.watching.fx[0] : this.watching.fx[1]} WINS`.toUpperCase(), REASONS[res.reason] || '', 5); return; }
    const last = this.match.record(sim, me), m = this.match, sc = m.score;
    hud.bannerShow(last.mine ? 'ROUND WON' : 'ROUND LOST', `${REASONS[res.reason] || ''} · ${sc.me} – ${sc.foe}`, 6);
    this.audio.ui(last.mine ? 'win' : 'lose');
  }
  afterRound() {
    if (this.tutorial) { if (this.tutorial.done) this.toMenu(); else this.launchTutorial(this.tutorial.id); return; }
    if (this.watching) return this.finishWatch();
    const m = this.match; if (m.over) return this.matchEnd();
    m.next(); this.fade(400); this.startOpSelect();
  }

  // ---------------------------------------------------------------- results
  matchEnd() {
    const m = this.match, rw = m.rewards(), st = this.store, t = m.totals;
    const before = { mmr: st.profile.mmr, level: st.level.level, rank: st.rank.name };
    const out = st.recordMatch({ me: t, won: m.won, draw: m.draw, roundsWon: m.score.me, roundsLost: m.score.foe, seconds: m.seconds, op: m.opId(), ranked: m.ranked, enlisted: !!m.list.enlisted, map: HARBOR.name, mode: m.list.name, xp: rw.xp, renown: rw.renown });
    this.exitLock(); this.hud.show(false); this.lockHint.hidden = true; this.state = 'result';
    const acc = t.shots ? Math.round((t.hits / t.shots) * 100) : 0;
    const kpi = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
    const rounds = m.results.map((r) => `<div class="statrow"><span>Round ${r.n} · ${r.side === 'atk' ? 'Attack' : 'Defense'}</span><span style="color:${r.mine ? '#7fd1ff' : '#ff8a80'}">${r.mine ? 'WON' : 'LOST'} · ${REASONS[r.reason] || r.reason}</span></div>`).join('');
    const parts = rw.parts.map(([a, b]) => `<div class="statrow"><span>${a}</span><span>+${b} XP</span></div>`).join('');
    const mmr = m.ranked ? `<div class="statrow"><span>Rank points</span><span>${st.profile.mmr - before.mmr >= 0 ? '+' : ''}${st.profile.mmr - before.mmr} (${st.profile.mmr})</span></div>` : '';
    const ups = out.ups.map((u) => `<div class="statrow" style="color:var(--gold)"><span>Clearance level ${u.level}</span><span>+${u.renown} renown${u.credits ? ' · +' + u.credits + ' credits' : ''}</span></div>`).join('');
    const chal = out.earned.map((c) => `<div class="statrow" style="color:var(--green)"><span>Challenge complete</span><span>${c.text}</span></div>`).join('');
    this.overlay.innerHTML = `<div class="scr result"><div class="box"><h1 class="${m.won ? 'win' : 'lose'}">${m.draw ? 'DRAW' : m.won ? 'VICTORY' : 'DEFEAT'}</h1><div class="why">${HARBOR.name} · ${m.list.name} · ${m.score.me} – ${m.score.foe}</div>
      <div class="kpis">${kpi(t.kills, 'Kills')}${kpi(t.deaths, 'Deaths')}${kpi(t.assists, 'Assists')}${kpi(t.headshots, 'Headshots')}${kpi(acc + '%', 'Accuracy')}${kpi(t.score, 'Score')}</div>
      <div class="split"><div><h3 style="font:700 26px var(--display);text-transform:uppercase;margin:0 0 6px">Rounds</h3>${rounds}</div>
      <div><h3 style="font:700 26px var(--display);text-transform:uppercase;margin:0 0 6px">Rewards</h3>${parts}<div class="statrow" style="color:#fff"><span>Total</span><span>+${rw.xp} XP · +${rw.renown} renown</span></div>${mmr}${ups}${chal}</div></div>
      <div style="margin-top:18px;display:flex;gap:10px"><button class="btn red" data-r="again">Play again</button><button class="btn ghost" data-r="menu">Main menu</button></div></div></div>`;
    this.audio.ui(m.won ? 'win' : 'lose');
  }
  finishWatch() {
    const w = this.watching, res = this.game.sim.round.result || { winner: 'def' }, winner = res.winner === 'atk' ? 0 : 1;
    let txt = 'Match finished.';
    if (w.pick !== undefined) {
      const ok = w.pick === winner; txt = ok ? 'Your pick won! +250 renown' : 'Your pick lost this time.';
      if (ok) { this.store.addRenown(250); this.store.profile.pickPoints = (this.store.profile.pickPoints || 0) + 1; this.store.save(); }
    }
    this.exitLock(); this.hud.show(false); this.state = 'result'; this.lockHint.hidden = true;
    this.overlay.innerHTML = `<div class="scr result"><div class="box"><h1 class="win">${w.fx[winner]} win</h1><div class="why">${w.fx[0]} vs ${w.fx[1]} · ${REASONS[res.reason] || ''}</div><p style="font:500 22px var(--body)">${txt}</p><div style="margin-top:18px;display:flex;gap:10px"><button class="btn red" data-r="menu">Back to menu</button></div></div></div>`;
  }

  // ---------------------------------------------------------------- pause, help, overlays
  pause() {
    if (this.state !== 'game') return;
    this.exitLock(); this.state = 'pause'; this.lockHint.hidden = true;
    const p = this.game.player; if (p) { p.keys.clear(); p.mouse.l = p.mouse.r = false; }
    this.hud.show(true);
    this.overlay.innerHTML = `<div class="scr pause"><div class="box"><h2>Paused</h2>${this.match ? `<div class="hint">Round ${this.match.roundNo} · ${this.match.score.me} – ${this.match.score.foe}</div>` : ''}<button class="btn" data-r="resume">Resume</button><button class="btn ghost" data-r="help">Controls</button><button class="btn ghost" data-r="settings">Settings</button><button class="btn red" data-r="quit">${this.match ? 'Forfeit match' : 'Leave'}</button></div></div>`;
  }
  resume() { if (this.state !== 'pause') return; this.ui.closeModal(); this.overlay.innerHTML = ''; this.state = 'game'; this.requestLock(); }
  helpHtml() {
    const k = this.store.settings.keys;
    return `<div class="scr pause"><div class="box" style="width:min(640px,94vw)"><h2>Controls</h2>${KEYHELP.map(([a, b]) => `<div class="statrow"><span>${a}</span><span class="hint" style="text-transform:none">${b}</span></div>`).join('')}<div class="hint" style="margin-top:8px">Bindings can be changed in Settings. Current fire/aim: mouse buttons. Drone key: ${k.drone.toUpperCase()}.</div><div style="margin-top:12px"><button class="btn" data-r="${this.state === 'pause' ? 'back' : 'closehelp'}">Close</button></div></div></div>`;
  }
  overlayClick(e) {
    const b = e.target.closest('[data-r]'); if (!b) return; this.audio.unlock(); this.audio.ui('click');
    switch (b.dataset.r) {
      case 'resume': return this.resume();
      case 'help': this.overlay.innerHTML = this.helpHtml(); return;
      case 'back': this.pause(); return;
      case 'closehelp': this.helpOpen = false; this.overlay.innerHTML = ''; return;
      case 'settings': this.ui.openModal('settings', 'gameplay'); return;
      case 'quit': this.toMenu(); return;
      case 'again': if (this.match) { const L = this.match.list; this.overlay.innerHTML = ''; this.startPlaylist(L.id); } return;
      case 'menu': this.toMenu(); return;
      default:
    }
  }

  // ---------------------------------------------------------------- input
  get locked() { return document.pointerLockElement === this.canvas; }
  requestLock() {
    if (this.lockFailed || !this.canvas.requestPointerLock || this.locked) return;
    try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => this.lockDenied()); } catch { this.lockDenied(); }
  }
  lockDenied() { if (this.lockFailed) return; this.lockFailed = true; this.lockHint.hidden = true; document.body.classList.add('freecursor'); if (this.state === 'game') this.hud.say('Mouse capture is blocked here: use the screen edges or the arrow keys to look', 6); }
  exitLock() { if (this.locked) { this.releasing = true; try { document.exitPointerLock(); } catch { /* not locked */ } } }
  pollLook(dt) {
    const p = this.game.player; if (!p || this.state !== 'game') return;
    let dx = 0, dy = 0; const sp = 620 * dt;
    if (this.arrows.has('arrowleft')) dx -= sp; if (this.arrows.has('arrowright')) dx += sp; if (this.arrows.has('arrowup')) dy -= sp; if (this.arrows.has('arrowdown')) dy += sp;
    if (this.lockFailed && !this.locked) { // free cursor: pushing it towards an edge keeps turning
      const nx = this.mouse.x * 2 - 1, ny = this.mouse.y * 2 - 1, ex = 0.62, ey = 0.7;
      if (Math.abs(nx) > ex) dx += Math.sign(nx) * ((Math.abs(nx) - ex) / (1 - ex)) * 820 * dt;
      if (Math.abs(ny) > ey) dy += Math.sign(ny) * ((Math.abs(ny) - ey) / (1 - ey)) * 520 * dt;
    }
    if (dx || dy) p.mouseMove(dx, dy);
  }
  bindInput() {
    const down = (e) => this.onKey(e, true), up = (e) => this.onKey(e, false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    document.addEventListener('pointerlockchange', () => {
      if (this.locked) { this.releasing = false; this.lockHint.hidden = true; return; }
      if (this.releasing) { this.releasing = false; return; }
      if (this.state === 'game') this.pause();
    });
    document.addEventListener('pointerlockerror', () => this.lockDenied());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX / window.innerWidth; this.mouse.y = e.clientY / window.innerHeight;
      if (this.mouseTrack) this.mouseTrack(this.mouse.x * 2 - 1, this.mouse.y * 2 - 1);
      const p = this.game.player; if (this.state !== 'game' || !p) return;
      if (this.locked) p.mouseMove(e.movementX, e.movementY); else if (this.lockFailed) p.mouseMove(e.movementX * 0.7, e.movementY * 0.7);
    });
    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'game') return; this.audio.unlock();
      if (e.target.closest && e.target.closest('.scr.pause,.modal')) return;
      if (!this.locked && !this.lockFailed) this.requestLock();
      if (this.endHandled) this.skip = true;
      const p = this.game.player; if (p) p.mouseButton(e.button, true);
    });
    window.addEventListener('mouseup', (e) => { const p = this.game.player; if (this.state === 'game' && p) p.mouseButton(e.button, false); });
    window.addEventListener('wheel', (e) => { const p = this.game.player; if (this.state === 'game' && p) p.wheel(e.deltaY > 0 ? 1 : -1); }, { passive: true });
    window.addEventListener('contextmenu', (e) => { if (this.state === 'game' || this.state === 'os') e.preventDefault(); });
    window.addEventListener('blur', () => { const p = this.game.player; if (p) { p.keys.clear(); p.mouse.l = p.mouse.r = false; } this.arrows.clear(); if (this.state === 'game' && !this.watching) this.pause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'game') this.pause(); });
  }
  onKey(e, isDown) {
    const k = keyName(e);
    if (isDown && this.ui.listen) { e.preventDefault(); this.ui.captureKey(k); return; }
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') return;
    switch (this.state) {
      case 'splash': if (isDown && k !== 'shift' && k !== 'control') this.enter(); return;
      case 'os': if (isDown) { if (k === 'escape') this.toMenu(); else this.os.key(k); } return;
      case 'menu': if (isDown && k === 'escape') this.ui.closeModal(); return;
      case 'pause': if (isDown && (k === 'escape' || k === 'p')) { if (this.ui.modal) this.ui.closeModal(); else this.resume(); } return;
      case 'result': if (isDown && (k === 'enter' || k === 'escape')) this.toMenu(); return;
      case 'game': break;
      default: return;
    }
    const g = this.game, p = g.player;
    if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f1', 'f3', 'f6', 'f7'].includes(k)) e.preventDefault();
    if (isDown && (k === 'escape' || k === 'p')) { this.pause(); return; }
    if (k.startsWith('arrow')) { if (isDown) this.arrows.add(k); else this.arrows.delete(k); }
    if (isDown && k === 'h') { this.helpOpen = !this.helpOpen; this.overlay.innerHTML = this.helpOpen ? this.helpHtml() : ''; return; }
    if (isDown && this.endHandled && (k === 'enter' || k === ' ')) this.skip = true;
    if (!p) { // observer
      if (isDown && (k === ' ' || k === 'arrowright' || k === 'arrowleft')) this.cycleTarget(k === 'arrowleft' ? -1 : 1);
      if (isDown && (k === '1' || k === '2' || k === '3')) { this.timeScale = k === '1' ? 1 : k === '2' ? 2 : 4; this.toast(`Speed x${this.timeScale}`); }
      return;
    }
    if (isDown) p.keyDown(k); else p.keyUp(k);
  }
  cycleTarget(dir) {
    const g = this.game, live = g.sim.actors.filter((a) => a.alive); if (!live.length) return;
    const i = live.indexOf(g.followActor); g.followActor = live[(i + dir + live.length) % live.length]; g.followT = 12;
  }
}
void opIcon; void OPS_BY_ID; void sleep;
