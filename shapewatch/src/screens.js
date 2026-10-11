// The menu-side screens: main menu, mode and map picker, hero select, hero gallery, career,
// settings, scoreboard and the end-of-match report.
import * as E from '../../engine/index.js';
import { HEROES, HERO, ROLES, SKINS, SUBCLASSES } from './heroes.js';
import { MAPS, MODES, THEMES, makeLevel } from './maps.js';
import { MATCHUP } from './ai.js';
import { drawIcon, roleSvg, subSvg, ROLE_COLORS } from './icons.js';
import { LINES } from './voice.js';
import { levelInfo, titleFor, MEDALS, TIER, matchScore, SKIN_UNLOCK, masteryInfo, MASTERY_TITLES, endorseLevel } from './stats.js';
import { $, el, badges } from './ui.js';
import { fmtTime } from './util.js';

const ROLE_PASSIVE = { tank: 'Heavy: takes less knockback, shrugs off part of every stun, and healing repairs armor.', damage: 'Hunter: moves 8% faster, can slide out of a sprint (X), and every hit cuts the target\'s healing by 20% for 1.5 s.', support: 'Resilient: health regeneration starts after 1.6 s instead of 4.5 s, and runs faster.' };
const KEYS = ['LMB', 'RMB', 'SHIFT', 'E', 'Q'];
const ABILS = ['w1', 'w2', 'a1', 'a2', 'ult'];
export const DIFFS = [['EASY', 'Bots hesitate and miss a lot.'], ['NORMAL', 'A fair fight.'], ['HARD', 'Fast reactions, real aim and counter-picks.'], ['ELITE', 'Near-perfect aim, combos and coordinated ults.'], ['ADAPTIVE', 'Starts fair, then tracks how well you are doing.']];
const SIDE_MODES = new Set(['escort', 'hybrid']);
const VARIANTS = [['', 'STANDARD', 'The normal rules.'], ['mystery', 'MYSTERY HEROES', 'Arcade: a random hero every time you spawn.'], ['mayhem', 'TOTAL MAYHEM', 'Arcade: double health, cooldowns four times faster.'], ['surge', 'RIFT SURGES', 'Arcade: a random rule change every minute or so.']];
const bars = (r) => ['damage', 'survival', 'mobility', 'utility', 'difficulty'].map((k) => `<div class="rt"><span>${k.toUpperCase()}</span><div>${Array.from({ length: 5 }, (_, i) => `<i class="${i < r[k] ? 'on' : ''}"></i>`).join('')}</div></div>`).join('');
const weaponLine = (h) => { const w = h.w1; return w.kind === 'melee' ? `${w.dmg} melee damage per punch` : w.kind === 'beam' ? `${(w.dmg * w.rate).toFixed(0)} damage per second` : w.kind === 'proj' ? `${w.dmg} damage projectile${w.splash ? ' · splash' : ''}` : w.kind === 'special' ? 'Precision weapon · charges while scoped' : `${w.dmg}${w.pellets ? '×' + w.pellets : ''} damage per shot`; };
const abilityHtml = (h, canvases = true) => ABILS.map((slot, i) => { const a = h[slot], name = a.name + (slot === 'ult' ? ' · ULTIMATE' : ''), desc = slot === 'w1' ? weaponLine(h) : a.desc; return `<div class="ab"><div class="ab-i"><canvas width="64" height="64" data-slot="${slot}"></canvas><kbd>${KEYS[i]}</kbd></div><div><b>${name.toUpperCase()}</b>${desc}${a.cd ? `<em>${a.cd}s cooldown</em>` : ''}</div></div>`; }).join('');
const paintAbilities = (root, id) => root.querySelectorAll('canvas[data-slot]').forEach((c) => drawIcon(c, id, c.dataset.slot, c.dataset.slot === 'ult' ? '#ffd36b' : '#ffffff'));
const tipsFor = (h) => { const m = MATCHUP[h.sub] || {}, strong = Object.entries(m).filter(([, v]) => v > 0).map(([k]) => k), weak = Object.entries(m).filter(([, v]) => v < 0).map(([k]) => k); return `${strong.length ? `<span class="tip good">STRONG VS ${strong.map((s) => s.toUpperCase()).join(' · ')}</span>` : ''}${weak.length ? `<span class="tip bad">WEAK VS ${weak.map((s) => s.toUpperCase()).join(' · ')}</span>` : ''}`; };
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const fmtT = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`; };

// ------------------------------------------------------------------ level thumbnails
export function drawLevelPreview(canvas, level, theme) {
  const g = canvas.getContext('2d'), B = level.bounds, W = B.x1 - B.x0, H = B.z1 - B.z0, k = Math.min((canvas.width - 14) / W, (canvas.height - 14) / H), ox = (canvas.width - W * k) / 2, oz = (canvas.height - H * k) / 2;
  const grad = g.createLinearGradient(0, 0, 0, canvas.height); const sky = theme.horizon.map((v) => Math.round(v * 120)), zen = theme.zenith.map((v) => Math.round(v * 90)); grad.addColorStop(0, `rgb(${zen})`); grad.addColorStop(1, `rgb(${sky})`); g.fillStyle = grad; g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = 'rgba(8,14,28,.55)'; g.fillRect(ox - 3, oz - 3, W * k + 6, H * k + 6);
  const X = (x) => ox + (x - B.x0) * k, Z = (z) => oz + (z - B.z0) * k, boxes = [...level.boxes].sort((a, b) => a.y1 - b.y1);
  for (const b of boxes) { if (b.y1 < 0.35) continue; const t = Math.min(1, b.y1 / 12), a = b.y0 > 2.5 ? 0.5 : 1; g.globalAlpha = a; g.fillStyle = `rgb(${Math.round(90 + t * 100)},${Math.round(110 + t * 95)},${Math.round(140 + t * 85)})`; g.fillRect(X(b.x0), Z(b.z0), Math.max(1, (b.x1 - b.x0) * k), Math.max(1, (b.z1 - b.z0) * k)); }
  g.globalAlpha = 1;
  if (level.path) { g.strokeStyle = '#ffd36b'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); level.path.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1])))); g.stroke(); g.setLineDash([]); }
  for (const p of level.points || []) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(p.pos[0]), Z(p.pos[2]), Math.max(4, p.r * k), 0, 7); g.stroke(); }
  [['#3a9bff', 0], ['#ff4a52', 1]].forEach(([c, t]) => { const sp = level.spawns[t], x = sp.reduce((a, p) => a + p[0], 0) / sp.length, z = sp.reduce((a, p) => a + p[2], 0) / sp.length; g.fillStyle = c; g.fillRect(X(x) - 7, Z(z) - 4, 14, 8); });
}

// ------------------------------------------------------------------ main menu
export class MenuScreen {
  constructor({ portraits, career, sfx, onPlay, onQuick, onHeroes, onCareer, onSettings, onHelp }) { Object.assign(this, { portraits, career, sfx }); this.root = $('menu'); this.cb = { onPlay, onQuick, onHeroes, onCareer, onSettings, onHelp }; this.build(); }
  build() {
    this.root.innerHTML = `<div class="m-top"><div class="m-logo"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="l1"/><path d="M50 14 L82 68 H18 Z" class="l2"/><circle cx="50" cy="50" r="12" class="l3"/></svg><div><b>SHAPE<i>WATCH</i></b><small>A SHAPEFORGE HERO SHOOTER</small></div></div><div class="m-profile panel" id="mProfile"></div></div>
      <div class="m-body"><nav class="m-nav"><button class="m-btn primary" data-a="play" type="button">PLAY <small>7 MODES · ARCADE RULES · 5 MAPS · 26 HEROES</small></button><button class="m-btn" data-a="quick" type="button">QUICK PLAY <small id="mQuick">RANDOM MODE, MAP AND SIDE</small></button><button class="m-btn" data-a="heroes" type="button">HEROES <small>STATS · ABILITIES · VOICELINES</small></button><button class="m-btn" data-a="career" type="button">CAREER <small>LEVEL · MEDALS · HISTORY</small></button><button class="m-btn" data-a="settings" type="button">SETTINGS <small>AUDIO · HUD · CONTROLS</small></button><button class="m-btn" data-a="help" type="button">HOW TO PLAY <small>CONTROLS · SYSTEMS</small></button></nav>
      <aside class="m-daily panel" id="mDaily"></aside></div><div class="m-foot">Built on the ShapeForge Engine · every hero, map, voice and sound is generated in code</div>`;
    for (const b of this.root.querySelectorAll('.m-btn')) { b.onmouseenter = () => this.sfx.ui('hover'); b.onclick = () => { this.sfx.unlock(); this.sfx.ui('select'); ({ play: this.cb.onPlay, quick: this.cb.onQuick, heroes: this.cb.onHeroes, career: this.cb.onCareer, settings: this.cb.onSettings, help: this.cb.onHelp })[b.dataset.a](); }; }
  }
  refresh(settings) {
    const L = this.career.level, d = this.career.data, top = this.career.topHeroes(1)[0];
    $('mProfile').innerHTML = `<div class="lv"><b>${L.level}</b><small>LEVEL</small></div><div class="pf"><b>${titleFor(L.level).toUpperCase()}</b><div class="xp"><i style="width:${L.pct * 100}%"></i></div><small>${L.into} / ${L.need} XP · ${d.wins}W ${d.losses}L${top ? ' · MAIN ' + HERO[top[0]].name : ''}</small></div>${top ? '' : ''}`;
    const ch = this.career.refreshChallenges().list;
    $('mDaily').innerHTML = `<h3>DAILY CHALLENGES</h3>` + ch.map((c) => `<div class="ch ${c.done ? 'done' : ''}"><span>${c.text}</span><div class="bar"><i style="width:${Math.min(100, c.progress / c.goal * 100)}%"></i></div><em>${c.done ? '✔ +' + c.xp + ' XP' : Math.min(c.progress, c.goal) + ' / ' + c.goal + ' · ' + c.xp + ' XP'}</em></div>`).join('');
    if (settings) $('mQuick').textContent = `RANDOM MODE, MAP AND SIDE · ${DIFFS[settings.diff][0]} BOTS`;
  }
}

// ------------------------------------------------------------------ mode and map picker
export class PlayScreen {
  constructor({ settings, sfx, onStart, onBack }) { Object.assign(this, { settings, sfx, onStart, onBack }); this.root = $('play'); this.previews = new Map(); }
  open() { this.build(); this.root.hidden = false; }
  close() { this.root.hidden = true; }
  validMap(mode, map) { return MAPS[map]?.modes.includes(mode) ? map : Object.values(MAPS).find((m) => m.modes.includes(mode)).id; }
  build() {
    const S = this.settings; S.map = this.validMap(S.mode, S.map);
    this.root.innerHTML = `<div class="pl-head"><button class="btn ghost" id="plBack" type="button">&larr; BACK</button><h2>SELECT A GAME</h2></div>
      <div class="pl-modes" id="plModes">${Object.values(MODES).map((m) => `<button class="pl-mode ${S.mode === m.id ? 'on' : ''}" data-m="${m.id}" type="button"><b>${m.name}</b><span>${m.blurb}</span><em>${m.teams ? '5v5' : m.id === 'ffa' ? '8 PLAYERS' : 'SOLO'}</em></button>`).join('')}</div>
      <div class="pl-maps" id="plMaps"></div>
      <div class="pl-opts panel"><div class="opt"><label>BOT SKILL</label><div class="chips" id="plDiff">${DIFFS.map((d, i) => `<button class="chip-b ${S.diff === i ? 'on' : ''}" data-d="${i}" title="${d[1]}" type="button">${d[0]}</button>`).join('')}</div><small id="plDiffTip">${DIFFS[S.diff][1]}</small></div>
        <div class="opt" id="plSideBox"><label>SIDE</label><div class="chips" id="plSide"><button class="chip-b ${S.side === 0 ? 'on' : ''}" data-s="0" type="button">ATTACK</button><button class="chip-b ${S.side === 1 ? 'on' : ''}" data-s="1" type="button">DEFEND</button></div></div>
        <div class="opt"><label>RULES</label><div class="chips" id="plVar">${VARIANTS.map(([v, n]) => `<button class="chip-b ${(S.variant || '') === v ? 'on' : ''}" data-v="${v}" type="button">${n}</button>`).join('')}</div><small id="plVarTip">${VARIANTS.find((x) => x[0] === (S.variant || ''))[2]}</small></div>
        <div class="opt"><label>YOUR HERO</label><div class="pl-hero"><span id="plHero">${HERO[S.hero].name}</span><small>Picked on the next screen</small></div></div>
        <button class="btn go" id="plGo" type="button">START MATCH</button></div>`;
    $('plBack').onclick = () => { this.sfx.ui(); this.onBack(); };
    for (const b of this.root.querySelectorAll('.pl-mode')) { b.onmouseenter = () => this.sfx.ui('hover'); b.onclick = () => { this.sfx.ui('select'); S.mode = b.dataset.m; this.build(); }; }
    for (const b of this.root.querySelectorAll('#plDiff .chip-b')) b.onclick = () => { this.sfx.ui('select'); S.diff = +b.dataset.d; this.root.querySelectorAll('#plDiff .chip-b').forEach((x) => x.classList.toggle('on', x === b)); $('plDiffTip').textContent = DIFFS[S.diff][1]; };
    for (const b of this.root.querySelectorAll('#plSide .chip-b')) b.onclick = () => { this.sfx.ui('select'); S.side = +b.dataset.s; this.root.querySelectorAll('#plSide .chip-b').forEach((x) => x.classList.toggle('on', x === b)); };
    for (const b of this.root.querySelectorAll('#plVar .chip-b')) b.onclick = () => { this.sfx.ui('select'); S.variant = b.dataset.v; this.root.querySelectorAll('#plVar .chip-b').forEach((x) => x.classList.toggle('on', x === b)); $('plVarTip').textContent = VARIANTS.find((x) => x[0] === S.variant)[2]; };
    $('plSideBox').style.display = SIDE_MODES.has(S.mode) ? '' : 'none';
    $('plGo').onclick = () => { this.sfx.ui('ready'); this.onStart(); };
    const box = $('plMaps');
    for (const m of Object.values(MAPS).filter((x) => x.modes.includes(S.mode))) {
      const c = el('button', 'pl-map' + (S.map === m.id ? ' on' : ''), `<canvas width="300" height="180"></canvas><div><b>${m.name}</b><span>${m.tagline}</span><em>${m.size} · ${m.theme.toUpperCase()}</em></div>`); c.type = 'button';
      let lv = this.previews.get(m.id + S.mode); if (!lv) { lv = makeLevel(m.id, S.mode); this.previews.set(m.id + S.mode, lv); }
      drawLevelPreview(c.querySelector('canvas'), lv, THEMES[m.theme]);
      c.onmouseenter = () => this.sfx.ui('hover'); c.onclick = () => { this.sfx.ui('select'); S.map = m.id; box.querySelectorAll('.pl-map').forEach((x) => x.classList.toggle('on', x === c)); }; box.append(c);
    }
  }
}

// ------------------------------------------------------------------ hero select
export class SelectScreen {
  constructor(view, portraits, sfx, voice) { this.view = view; this.portraits = portraits; this.sfx = sfx; this.voice = voice; this.sel = 'sabre'; this.open_ = false; this.tiles = new Map(); this.buildTiles(); }
  buildTiles() {
    const roles = $('selRoles'); roles.innerHTML = '';
    for (const role of ['tank', 'damage', 'support']) {
      const g = el('div', 'r-group', `<div class="rbadge ${role}">${roleSvg(role, 22, ROLE_COLORS[role])}</div>`), tiles = el('div', 'r-tiles');
      for (const h of HEROES.filter((x) => x.role === role)) {
        const b = el('button', 'h-tile'); b.type = 'button'; b.dataset.name = h.name; b.title = h.name + ' · ' + h.sub; b.append(this.portraits.canvas(h.id, 96)); b.insertAdjacentHTML('beforeend', `<span class="sb">${subSvg(SUBCLASSES[h.sub].icon, 11, '#fff')}</span>`);
        b.onclick = () => this.pick(h.id); b.onmouseenter = () => this.sfx.ui('hover'); tiles.append(b); this.tiles.set(h.id, b);
      }
      g.append(tiles); roles.append(g);
    }
    $('selSkin').innerHTML = SKINS.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  }
  open(sim, { mid = false, onReady, onPick, onSkin, skin = 'default' } = {}) {
    this.sim = sim; this.mid = mid; this.onReady = onReady; this.onPick = onPick; this.onSkin = onSkin; this.open_ = true; this.t = 0;
    const me = sim.player; this.sel = me.hero; $('select').hidden = false; $('selSkin').value = skin;
    const M = MODES[sim.modeId]; $('selSide').textContent = sim.modeId === 'ffa' ? 'FREE FOR ALL' : sim.modeId === 'training' ? 'TRAINING' : sim.playerTeam === 0 ? (sim.modeId === 'control' || sim.modeId === 'elim' || sim.modeId === 'tdm' ? 'TEAM BLUE' : 'ATTACK') : (sim.modeId === 'control' || sim.modeId === 'elim' || sim.modeId === 'tdm' ? 'TEAM RED' : 'DEFEND'); $('selSide').className = sim.playerTeam === 1 && sim.modeId !== 'ffa' ? 'def' : ''; $('selMap').textContent = sim.level.name; $('selModeName').textContent = M.name;
    $('selReady').textContent = mid ? 'CONFIRM' : 'READY'; document.querySelector('.sel-assemble span').textContent = mid ? 'CHOOSE YOUR HERO' : sim.modeId === 'ffa' || sim.modeId === 'training' ? 'PICK YOUR HERO' : 'ASSEMBLE YOUR TEAM';
    $('selTeam').style.display = mid || sim.modeId === 'ffa' || sim.modeId === 'training' ? 'none' : ''; this.buildTeam(); this.refresh();
    $('selSkin').onchange = () => { this.sfx.ui('select'); this.onSkin?.($('selSkin').value); };
    $('selReady').onclick = () => { this.sfx.ui('ready'); this.onReady?.(); };
    $('selVoice').onclick = () => this.voice.hero(this.sel, 'pick', { force: true, minGap: 0 });
  }
  buildTeam() {
    const sim = this.sim, box = $('selTeam'); box.innerHTML = ''; this.slots = [];
    const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.deploy);
    mates.forEach((u, i) => { const s = el('div', 's-slot' + (u.isPlayer ? ' me' : ' pending'), '<div class="s-badge"></div><div class="s-hex"><div></div></div><div class="s-name"></div>'); box.append(s); const rec = { s, u, shown: u.isPlayer, at: 1.2 + i * 1.5 + Math.random() * 3 }; this.slots.push(rec); this.paintSlot(rec); });
  }
  paintSlot(rec) {
    const { s, u } = rec, hex = s.querySelector('.s-hex > div'), name = s.querySelector('.s-name'), badge = s.querySelector('.s-badge');
    if (!rec.shown) { s.classList.add('pending'); hex.innerHTML = '…'; name.textContent = u.name; badge.style.display = 'none'; return; }
    s.classList.remove('pending'); badge.style.display = ''; badge.innerHTML = roleSvg(u.def.role, 16, '#fff');
    hex.innerHTML = ''; const c = el('canvas'); c.width = c.height = 128; this.portraits.paint(c, u.hero); hex.append(c); name.textContent = u.isPlayer ? 'YOU' : u.name; rec.painted = u.hero;
  }
  pick(id) { if (id === this.sel) return; this.sfx.ui('select'); this.sel = id; this.onPick?.(id); this.refresh(); this.voice.hero(id, 'pick', { force: true, minGap: 0 }); }
  refresh() {
    const h = HERO[this.sel];
    $('selName').textContent = h.name; $('selRole').innerHTML = roleSvg(h.role, 36, ROLE_COLORS[h.role]) ; $('selSub').innerHTML = `${subSvg(SUBCLASSES[h.sub].icon, 18, '#fff')}<span>${h.sub.toUpperCase()}</span><em>${h.title.toUpperCase()}</em>`;
    for (const [id, b] of this.tiles) { b.classList.toggle('on', id === this.sel); if (this.career) { const lv = this.career.mastery(id).level; b.dataset.lv = lv > 1 ? lv : ''; } }
    // skins: only the ones this hero's mastery has unlocked can be picked
    if (this.career) { const lv = this.career.mastery(h.id).level, cur = $('selSkin').value; $('selSkin').innerHTML = SKINS.map((s) => `<option value="${s.id}" ${lv >= SKIN_UNLOCK[s.id] ? '' : 'disabled'}>${s.name}${lv >= SKIN_UNLOCK[s.id] ? '' : ' · MASTERY ' + SKIN_UNLOCK[s.id]}</option>`).join(''); $('selSkin').value = lv >= (SKIN_UNLOCK[cur] ?? 1) ? cur : 'default'; $('selMastery').innerHTML = masteryHtml(this.career.mastery(h.id)); }
    $('selInfo').innerHTML = `<div class="role">${ROLES[h.role].label} · ${h.sub.toUpperCase()}</div><div class="blurb">${h.blurb}</div><div class="ratings">${bars(h.rating)}</div><div class="passive"><b>${ROLES[h.role].label} PASSIVE</b>${ROLE_PASSIVE[h.role]}</div><div class="passive subp"><b>${h.sub.toUpperCase()} PASSIVE</b>${SUBCLASSES[h.sub].passive}</div><div class="tips">${tipsFor(h)}</div><div class="stats-line"><span><b>${h.hp + h.armor}</b> HEALTH</span><span><b>${h.speed.toFixed(1)}</b> M/S</span><span><b>×1.25</b> VS CC</span><span><b>×${h.crit.head}</b> HEAD</span></div>` + abilityHtml(h);
    paintAbilities($('selInfo'), h.id);
    const slot = this.slots?.find((s) => s.u.isPlayer); if (slot) this.paintSlot(slot);
    this.teamCount();
  }
  teamCount() {
    const sim = this.sim, box = $('selComp'); if (!box || sim.modeId === 'ffa' || sim.modeId === 'training') { if (box) box.innerHTML = ''; return; }
    const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.deploy), cnt = { tank: 0, damage: 0, support: 0 }; for (const u of mates) cnt[u.def.role === undefined ? 'damage' : u.def.role]++; cnt[HERO[this.sel].role] += 0;
    const mine = HERO[this.sel].role; const c2 = { tank: 0, damage: 0, support: 0 }; for (const u of mates) c2[u.isPlayer ? mine : u.def.role]++;
    box.innerHTML = ['tank', 'damage', 'support'].map((r) => `<span class="${c2[r] === ROLES[r].limit ? 'ok' : 'warn'}">${roleSvg(r, 14, ROLE_COLORS[r])} ${c2[r]}/${ROLES[r].limit}</span>`).join('');
  }
  update(dt) {
    if (!this.open_) return; this.t += dt;
    if (!this.mid && this.slots?.length) {
      $('selT').textContent = Math.max(0, Math.ceil(this.sim.setupT)); $('selT').style.color = this.sim.setupT < 5 ? '#ff6a6a' : '';
      for (const r of this.slots) if (!r.shown && this.t > r.at) { r.shown = true; this.paintSlot(r); this.sfx.ui('hover'); }
      for (const r of this.slots) if (r.shown && !r.u.isPlayer && r.painted !== r.u.hero) this.paintSlot(r);
    } else if (this.mid) $('selT').textContent = ''; else $('selT').textContent = Math.max(0, Math.ceil(this.sim.setupT));
    $('selLat').textContent = 'OFFLINE · BOTS READY';
  }
  close() { this.open_ = false; $('select').hidden = true; }
}

// ------------------------------------------------------------------ hero gallery
export class Gallery {
  constructor(view, portraits, career, voice, sfx) { Object.assign(this, { view, portraits, career, voice, sfx }); this.root = $('gallery'); this.filter = 'all'; this.cur = 'sabre'; this.skin = 'default'; }
  open() {
    this.root.hidden = false; this.root.innerHTML = `<header class="g-head"><button class="btn ghost" id="gBack" type="button">&larr; BACK</button><h2>HEROES</h2><div class="g-filters" id="gFilters">${['all', 'tank', 'damage', 'support'].map((f) => `<button class="chip-b ${this.filter === f ? 'on' : ''}" data-f="${f}" type="button">${f === 'all' ? 'ALL' : ROLES[f].label}</button>`).join('')}</div><span class="g-hint">DRAG TO ROTATE</span></header><div class="g-list panel" id="gList"></div><aside class="g-detail panel" id="gDetail"></aside>`;
    $('gBack').onclick = () => { this.sfx.ui(); this.onBack?.(); };
    for (const b of $('gFilters').children) b.onclick = () => { this.sfx.ui('select'); this.filter = b.dataset.f; for (const x of $('gFilters').children) x.classList.toggle('on', x === b); this.list(); };
    this.list(); this.show(this.cur);
  }
  close() { this.root.hidden = true; }
  list() {
    const box = $('gList'); box.innerHTML = '';
    for (const role of ['tank', 'damage', 'support']) {
      if (this.filter !== 'all' && this.filter !== role) continue;
      const col = el('div', 'g-col', `<h3>${roleSvg(role, 20, ROLE_COLORS[role])}${ROLES[role].label}<small>${ROLES[role].blurb}</small></h3>`), t = el('div', 'g-tiles');
      for (const h of HEROES.filter((x) => x.role === role)) {
        const b = el('button', 'g-tile' + (h.id === this.cur ? ' on' : ''), `<span class="sb">${subSvg(SUBCLASSES[h.sub].icon, 13, '#fff')}</span><b>${h.name}</b>`); b.type = 'button'; b.prepend(this.portraits.canvas(h.id, 128)); b.dataset.id = h.id;
        b.onclick = () => { this.sfx.ui('select'); this.show(h.id); this.voice.hero(h.id, 'pick', { force: true, minGap: 0 }); }; b.onmouseenter = () => this.sfx.ui('hover'); t.append(b);
      }
      col.append(t); box.append(col);
    }
  }
  show(id) {
    this.cur = id; const h = HERO[id]; this.view.previewHero = id; this.view.previewTurn = 0; if (!this.career.skinUnlocked(id, this.skin)) this.skin = 'default'; this.view.mySkin = this.skin;
    this.root.querySelectorAll('.g-tile').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    const s = this.career.data.heroes[id], lines = LINES[id];
    const career = s ? `<div class="career-box"><h4>YOUR CAREER WITH ${h.name}</h4><div class="stats-line"><span><b>${fmtT(s.time)}</b> PLAYED</span><span><b>${s.matches}</b> MATCHES</span><span><b>${pct(s.wins, s.matches)}%</b> WIN</span></div><div class="stats-line"><span><b>${s.elims}</b> ELIMS</span><span><b>${pct(s.hits, s.shots)}%</b> ACC</span><span><b>${pct(s.crits, s.hits)}%</b> CRIT</span><span><b>${s.bestStreak}</b> STREAK</span></div></div>` : `<div class="career-box dim"><h4>YOUR CAREER WITH ${h.name}</h4>No matches yet. Take ${h.name} into a game.</div>`;
    $('gDetail').innerHTML = `<div class="g-title"><div><div class="role">${ROLES[h.role].label} · ${h.sub.toUpperCase()}</div><h3>${h.name}</h3><small>${h.title.toUpperCase()}</small></div><div class="g-badges">${roleSvg(h.role, 38, ROLE_COLORS[h.role])}${subSvg(SUBCLASSES[h.sub].icon, 30, '#cfe0ff')}</div></div>
      <p>${h.blurb}</p><div class="ratings">${bars(h.rating)}</div><div class="stats-line"><span><b>${h.hp}</b> HEALTH</span><span><b>${h.armor}</b> ARMOR</span><span><b>${h.speed.toFixed(1)}</b> M/S</span><span><b>×1.25</b> VS CC</span><span><b>×${h.crit.head}</b> HEAD</span></div>
      <div class="passive"><b>${ROLES[h.role].label} PASSIVE</b>${ROLE_PASSIVE[h.role]}</div><div class="passive subp"><b>${h.sub.toUpperCase()} PASSIVE</b>${SUBCLASSES[h.sub].passive}</div><div class="tips">${tipsFor(h)}</div>
      ${masteryHtml(this.career.mastery(id))}
      <div class="g-skins">${SKINS.map((k) => { const ok = this.career.skinUnlocked(id, k.id); return `<button class="chip-b ${k.id === this.skin && ok ? 'on' : ''} ${ok ? '' : 'locked'}" data-k="${k.id}" type="button" ${ok ? '' : 'disabled'} title="${ok ? '' : 'Unlocks at mastery level ' + SKIN_UNLOCK[k.id]}">${k.name}${ok ? '' : ' 🔒' + SKIN_UNLOCK[k.id]}</button>`; }).join('')}</div>
      <div class="g-abil">${abilityHtml(h)}</div>
      <div class="g-voice"><h4>VOICELINES</h4>${['pick', 'ult', 'kill', 'win'].map((k) => `<button class="vl" data-k="${k}" type="button"><i>▶</i><b>${k === 'pick' ? 'SELECTED' : k === 'ult' ? 'ULTIMATE' : k === 'kill' ? 'ELIMINATION' : 'VICTORY'}</b><span>“${lines[k][0]}”</span></button>`).join('')}</div>${career}`;
    paintAbilities($('gDetail'), id);
    for (const b of $('gDetail').querySelectorAll('.g-skins .chip-b')) b.onclick = () => { this.sfx.ui('select'); this.skin = b.dataset.k; this.view.mySkin = this.skin; $('gDetail').querySelectorAll('.g-skins .chip-b').forEach((x) => x.classList.toggle('on', x === b)); };
    for (const b of $('gDetail').querySelectorAll('.vl')) b.onclick = () => this.voice.say(id, LINES[id][b.dataset.k][0], { pri: 3, force: true, minGap: 0 });
  }
}

// ------------------------------------------------------------------ career
export class CareerScreen {
  constructor(portraits, career, sfx) { Object.assign(this, { portraits, career, sfx }); this.root = $('career'); }
  open() {
    const d = this.career.data, L = this.career.level, T = this.career.totals();
    this.root.hidden = false;
    const tiles = [['MATCHES', d.matches], ['WIN RATE', pct(d.wins, d.matches) + '%'], ['TIME PLAYED', fmtT(d.time)], ['ELIMINATIONS', T.elims], ['DAMAGE', Math.round(T.dmg).toLocaleString()], ['HEALING', Math.round(T.heal).toLocaleString()], ['ACCURACY', pct(T.hits, T.shots) + '%'], ['CRIT RATE', pct(T.crits, T.hits) + '%'], ['BEST STREAK', T.bestStreak], ['ULTIMATES', T.ults]];
    const heroes = Object.entries(d.heroes).filter(([id]) => HERO[id]).sort((a, b) => b[1].time - a[1].time);
    const maxT = Math.max(1, ...heroes.map((h) => h[1].time));
    this.root.innerHTML = `<header class="g-head"><button class="btn ghost" id="cBack" type="button">&larr; BACK</button><h2>CAREER</h2></header>
      <div class="cr-grid"><section class="panel cr-level"><div class="lv big"><b>${L.level}</b><small>LEVEL</small></div><div><b class="ttl">${titleFor(L.level).toUpperCase()}</b><div class="xp"><i style="width:${L.pct * 100}%"></i></div><small>${L.into} / ${L.need} XP TO NEXT LEVEL</small></div></section>
      <section class="panel cr-tiles">${tiles.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</section>
      <section class="panel cr-heroes"><h3>HEROES PLAYED</h3>${heroes.length ? heroes.map(([id, s]) => `<div class="hr" data-id="${id}"><i></i><div><b>${HERO[id].name} <small class="mlv">M${masteryInfo(s.mxp || 0).level}</small></b><div class="bar"><i style="width:${s.time / maxT * 100}%"></i></div></div><span>${fmtT(s.time)}</span><span>${s.elims} E</span><span>${pct(s.wins, s.matches)}% W</span></div>`).join('') : '<p class="dim">Play a match to start your career.</p>'}</section>
      <section class="panel cr-rivals"><h3>REGULARS & RIVALS</h3><div class="rv-top"><span>ENDORSEMENT LEVEL <b>${endorseLevel(d.endorse || 0)}</b></span>${(() => { const n = this.career.nemesis(); return n ? `<span class="nem">NEMESIS <b>${n.name.toUpperCase()}</b> ${n.d}–${n.k}</span>` : ''; })()}</div>${Object.entries(d.rivals || {}).sort((a, b) => (b[1].k + b[1].d) - (a[1].k + a[1].d)).slice(0, 8).map(([n, r]) => `<div class="rv"><b>${n.toUpperCase()}</b><span>${HERO[r.hero]?.name || ''}</span><span>YOU ${r.k} · THEM ${r.d}</span><span>${r.with}W/${r.vs}V</span></div>`).join('') || '<p class="dim">Play a few matches to meet the regulars.</p>'}</section>
      <section class="panel cr-medals"><h3>MEDALS</h3><div class="mg">${MEDALS.map((m) => `<div class="md ${d.medals[m.id] ? 'has' : ''}"><div class="mdi">${medalIcon(m.id)}</div><b>${m.name}</b><span>${d.medals[m.id] || 0}×</span></div>`).join('')}</div></section>
      <section class="panel cr-hist"><h3>RECENT MATCHES</h3>${d.history.length ? d.history.map((h) => `<div class="hi ${h.won ? 'win' : 'lose'}"><i></i><b>${HERO[h.hero]?.name || h.hero}</b><span>${h.won ? 'VICTORY' : 'DEFEAT'}</span><span>${MODES[h.mode]?.name || h.mode} · ${h.map}</span><span>${h.k}/${h.a}/${h.d}</span><em>+${h.xp} XP</em></div>`).join('') : '<p class="dim">No matches yet.</p>'}</section></div>
      <div class="cr-foot"><button class="btn ghost" id="cReset" type="button">RESET CAREER</button></div>`;
    this.root.querySelectorAll('.hr').forEach((r) => r.querySelector('i').replaceWith(this.portraits.canvas(r.dataset.id, 40)));
    $('cBack').onclick = () => { this.sfx.ui(); this.onBack?.(); };
    $('cReset').onclick = () => { if (confirm('Erase your career progress?')) { this.career.reset(); this.open(); } };
  }
  close() { this.root.hidden = true; }
}
export const medalIcon = (id) => `<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>${{ elims: '<path d="M7 17l10-10M7 7l10 10" stroke="currentColor" stroke-width="2.2" fill="none"/>', dmg: '<path d="M13 2 5 14h6l-1 8 9-13h-6z"/>', heal: '<path d="M10 5h4v5h5v4h-5v5h-4v-5H5v-4h5z"/>', crits: '<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z"/>', obj: '<path d="M12 4l7 4v8l-7 4-7-4V8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5"/>', streak: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>', ult: '<path d="M12 2l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 9.5 9 9z"/>', assist: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c0-3 2.5-5 5-5s5 2 5 5zM11 19c0-3 2.5-5 5-5s5 2 5 5z"/>', head: '<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke="currentColor" stroke-width="1.8"/>', untouched: '<path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="2" fill="none"/>' }[id] || ''}</svg>`;

// ------------------------------------------------------------------ settings
const COLOR_NAMES = { '#ffffff': 'WHITE', '#6dff9c': 'GREEN', '#ffd36b': 'GOLD', '#5fd8ff': 'CYAN', '#ff6ad0': 'PINK' };
const fmtSet = (v, max) => (max <= 1.3 && max > 0 ? Math.round(v * 100) + '%' : String(Math.round(v * 100) / 100));
export const SETTINGS_SCHEMA = [
  ['AUDIO', [['vol', 'Master volume', 'range', 0, 1, 0.05], ['music', 'Music volume', 'range', 0, 1, 0.05], ['voice', 'Hero voicelines', 'toggle'], ['voiceVol', 'Voice volume', 'range', 0, 1, 0.05], ['subs', 'Subtitles', 'toggle'], ['chatter', 'Team chatter', 'select', ['all', 'important', 'off']]]],
  ['CONTROLS', [['sens', 'Mouse sensitivity', 'range', 0.3, 2.5, 0.05], ['fov', 'Field of view', 'range', 70, 105, 1], ['invert', 'Invert vertical look', 'toggle']]],
  ['HUD', [['minimap', 'Minimap', 'toggle'], ['rotateMap', 'Rotate minimap with view', 'toggle'], ['numbers', 'Damage numbers', 'toggle'], ['xhair', 'Crosshair', 'select', ['auto', 'cross', 'circle', 'dot', 'none']], ['xcolor', 'Crosshair colour', 'select', ['#ffffff', '#6dff9c', '#ffd36b', '#5fd8ff', '#ff6ad0']], ['hudScale', 'HUD scale', 'range', 0.8, 1.3, 0.05], ['showFps', 'Show FPS', 'toggle']]],
  ['ACCESSIBILITY', [['shake', 'Screen shake', 'range', 0, 1, 0.05], ['flash', 'Flash and hit effects', 'range', 0, 1, 0.05], ['enemyColor', 'Enemy colour', 'select', ['red', 'magenta', 'yellow', 'orange']]]],
];
export class SettingsPanel {
  constructor(settings, sfx, onChange) { Object.assign(this, { settings, sfx, onChange }); this.root = $('settings'); }
  open(onClose) {
    this.root.hidden = false; this.onClose = onClose; const S = this.settings;
    this.root.innerHTML = `<div class="st-card panel"><h2>SETTINGS</h2><div class="st-cols">${SETTINGS_SCHEMA.map(([sec, rows]) => `<section><h3>${sec}</h3>${rows.map(([k, label, type, a, b, c]) => type === 'range' ? `<label>${label}<input data-k="${k}" type="range" min="${a}" max="${b}" step="${c}" value="${S[k]}"><em>${fmtSet(S[k], b)}</em></label>` : type === 'toggle' ? `<label class="tg">${label}<input data-k="${k}" type="checkbox" ${S[k] ? 'checked' : ''}><i></i></label>` : `<label>${label}<select data-k="${k}">${a.map((o) => `<option value="${o}" ${S[k] === o ? 'selected' : ''}>${o.startsWith('#') ? '■ ' + (COLOR_NAMES[o] || o) : o.toUpperCase()}</option>`).join('')}</select></label>`).join('')}</section>`).join('')}</div><div class="st-foot"><button class="btn" id="stClose" type="button">DONE</button></div></div>`;
    for (const inp of this.root.querySelectorAll('[data-k]')) inp.addEventListener('input', () => { const k = inp.dataset.k; S[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' ? +inp.value : inp.value; if (inp.type === 'range') inp.nextElementSibling.textContent = fmtSet(S[k], +inp.max); this.onChange(k); });
    $('stClose').onclick = () => { this.sfx.ui(); this.close(); };
  }
  close() { if (this.root.hidden) return; this.root.hidden = true; this.onClose?.(); }
}

// ------------------------------------------------------------------ scoreboard
export function renderScoreboard(sim, portraits, target = $('scCard')) {
  const card = target; card.innerHTML = '';
  const M = MODES[sim.modeId], mine = sim.playerTeam;
  const head = el('div', 'sc-head', `<b>${sim.level.name}</b><span>${M.name} · ${fmtTime(sim.time - (sim.startTime || 0))}</span>${sim.modeId === 'tdm' ? `<em>${sim.score[mine]} — ${sim.score[1 - mine]}</em>` : sim.modeId === 'control' || sim.modeId === 'elim' ? `<em>${sim.wins[mine]} — ${sim.wins[1 - mine]}</em>` : ''}`); card.append(head);
  const rows = (units, cls, title) => {
    const box = el('div', 'sc-team ' + cls, `<h4>${title}</h4><div class="sc-row head"><i></i><span class="l">PLAYER</span><span>E</span><span>A</span><span>D</span><span>DMG</span><span>HEAL</span><span>CRIT</span><span>ULT</span></div>`);
    for (const u of units.slice().sort((a, b) => matchScore(b.stats) - matchScore(a.stats))) {
      const r = el('div', 'sc-row' + (u.isPlayer ? ' me' : '') + (u.alive ? '' : ' dead')); r.append(portraits.canvas(u.hero, 40));
      r.insertAdjacentHTML('beforeend', `<span class="l"><b>${u.isPlayer ? 'YOU' : u.name}</b> ${badges(u.def, 12)}<small>${u.def.name}</small></span><span>${u.stats.elims}</span><span>${u.stats.assists}</span><span>${u.stats.deaths}</span><span>${Math.round(u.stats.dmg)}</span><span>${Math.round(u.stats.heal)}</span><span>${u.stats.crits}</span><span>${u.team === sim.playerTeam || sim.state === 'over' || sim.modeId === 'training' ? Math.floor(u.ult / u.def.ult.cost * 100) + '%' : '—'}</span>`);
      box.append(r);
    }
    card.append(box);
  };
  const all = sim.units.filter((x) => !x.deploy && !x.dummy);
  if (sim.modeId === 'ffa') rows(all, 'a', 'ALL PLAYERS'); else if (sim.modeId === 'training') rows(all, 'a', 'TRAINING'); else { rows(all.filter((u) => u.team === mine), 'a', 'YOUR TEAM'); rows(all.filter((u) => u.team !== mine), 'd', 'ENEMY TEAM'); }
}

// ------------------------------------------------------------------ mastery bar, coaching, endorsements
function masteryHtml(m) {
  const t = Object.entries(MASTERY_TITLES).filter(([lv]) => m.level >= +lv).pop();
  return `<div class="mastery"><b>MASTERY ${m.level}${t ? ` <em>${t[1].toUpperCase()}</em>` : ''}</b><div class="mbar"><i style="width:${m.pct * 100}%"></i></div><small>${m.level >= 20 ? 'MAX' : Math.round(m.into) + ' / ' + m.need}</small></div>`;
}
function endExtras(report, me) {
  const out = [], M = report.mastery;
  if (M) out.push(`<div class="e-mast panel"><div class="e-mh"><b>${HERO[M.hero].name} MASTERY</b>${M.after.level > M.before.level ? `<em>LEVEL ${M.after.level}!</em>` : ''}</div>${masteryHtml(M.after)}${M.unlocked.length ? `<div class="e-unlock">UNLOCKED: ${M.unlocked.map((k) => SKINS.find((s) => s.id === k).name + ' SKIN').join(' · ')}</div>` : ''}</div>`);
  if (report.coach && (report.coach.tips.length || report.coach.vs.length)) out.push(`<div class="e-coach panel"><h4>COACH</h4>${report.coach.vs.map((v) => `<div class="cv ${v.bad ? 'bad' : v.good ? 'good' : ''}"><span>${v.label}</span><b>${v.cur >= 10 ? Math.round(v.cur) : v.cur.toFixed(1)}</b><small>avg ${v.avg >= 10 ? Math.round(v.avg) : v.avg.toFixed(1)} · ${v.d >= 0 ? '+' : ''}${Math.round(v.d * 100)}%</small></div>`).join('')}${report.coach.tips.map((t) => `<p>• ${t}</p>`).join('')}</div>`);
  if (report.endorsed?.length || report.newNemesis?.length) out.push(`<div class="e-endo panel"><h4>ENDORSEMENTS${report.endorseUp ? ' · LEVEL UP!' : ''}</h4>${report.endorsed.map((e) => `<div><b>${e.name.toUpperCase()}</b><span>${e.kind}</span></div>`).join('') || '<p class="dim">No endorsements this time.</p>'}${(report.newNemesis || []).map((n) => `<div class="nem"><b>NEW NEMESIS</b><span>${n.toUpperCase()}</span></div>`).join('')}</div>`);
  return out.length ? `<div class="e-extras">${out.join('')}</div>` : '';
}
// ------------------------------------------------------------------ end of match report
export class EndScreen {
  constructor(portraits, sfx) { Object.assign(this, { portraits, sfx }); this.root = $('end'); }
  render(sim, report, { onAgain, onMenu, onHighlights, clips }) {
    const me = sim.player, won = sim.winner === sim.playerTeam || (sim.modeId === 'ffa' && sim.winnerUnit === me), side = SIDE_MODES.has(sim.modeId);
    const winText = sim.modeId === 'ffa' ? (sim.winnerUnit?.isPlayer ? 'YOU' : sim.winnerUnit?.name?.toUpperCase() || '') + ' WIN' + (sim.winnerUnit?.isPlayer ? '' : 'S') : sim.modeId === 'training' ? 'PRACTICE' : side ? (sim.winner === 0 ? 'ATTACKERS WIN' : 'DEFENDERS WIN') : (sim.winner === sim.playerTeam ? 'YOUR TEAM WINS' : 'ENEMY TEAM WINS');
    const objMode = sim.modeId === 'escort' || sim.modeId === 'hybrid' || sim.modeId === 'control' || sim.modeId === 'elim';
    const us = sim.units.filter((u) => !u.deploy && !u.dummy), best = (f) => us.slice().sort((a, b) => f(b) - f(a))[0];
    const mvp = best((u) => matchScore(u.stats)), title = sim.modeId === 'training' ? 'SESSION COMPLETE' : won ? 'VICTORY' : 'DEFEAT';
    const cards = [['MOST ELIMINATIONS', best((u) => u.stats.elims), (u) => u.stats.elims + ' ELIMS'], ['MOST DAMAGE', best((u) => u.stats.dmg), (u) => Math.round(u.stats.dmg) + ' DAMAGE'], ['MOST HEALING', best((u) => u.stats.heal), (u) => Math.round(u.stats.heal) + ' HEALED'], ['MOST CRITS', best((u) => u.stats.crits), (u) => u.stats.crits + ' CRITS'], ['ON THE OBJECTIVE', best((u) => u.stats.obj), (u) => Math.round(u.stats.obj) + ' SEC']];
    this.root.innerHTML = `<div class="e-wrap"><div class="e-banner"><b class="${won ? 'win' : 'lose'}">${title}</b><span>${winText} · ${(sim.why || '').toUpperCase()}</span></div>
      <div class="e-grid"><section class="e-you panel"><div class="e-me"><div id="eMeP"></div><div><b>${me.name === 'You' ? 'YOU' : me.name}</b><span>${me.def.name} · ${me.def.sub.toUpperCase()}</span>${mvp === me ? '<em class="mvp">MATCH MVP</em>' : ''}</div><div class="e-score"><b>${report.score}</b><small>SCORE</small></div></div>
        <div class="e-kda"><span><b>${me.stats.elims}</b>ELIMS</span><span><b>${me.stats.assists}</b>ASSISTS</span><span><b>${me.stats.deaths}</b>DEATHS</span><span><b>${Math.round(me.stats.dmg)}</b>DAMAGE</span><span><b>${Math.round(me.stats.heal)}</b>HEALING</span><span><b>${pct(me.stats.hits, me.stats.shots)}%</b>ACCURACY</span></div>
        <div class="e-medals">${report.medals.length ? report.medals.map((m) => `<div class="medal t${m.tier}" title="${m.desc}: ${m.value}"><div class="mdi">${medalIcon(m.id)}</div><b>${m.name}</b><span>${TIER[m.tier]}</span></div>`).join('') : '<p class="dim">No medals this time. Try getting crits, healing or holding the objective.</p>'}</div>
        <div class="e-xp"><div class="lvl"><b id="eLvl">${report.before.level}</b></div><div class="xpw"><div class="xp"><i id="eXp" style="width:${report.before.pct * 100}%"></i></div><small id="eXpT">+${report.gain} XP</small></div></div>
        <div class="e-parts">${report.parts.map(([k, v]) => `<div><span>${k}</span><b>+${v}</b></div>`).join('')}</div>${report.leveled ? `<div class="e-level">LEVEL UP! ${report.after.level} · ${titleFor(report.after.level).toUpperCase()}</div>` : ''}${report.challenges.length ? `<div class="e-chal">${report.challenges.map((c) => `✔ CHALLENGE COMPLETE: ${c.text}`).join('<br>')}</div>` : ''}</section>
        <section class="e-board panel" id="eBoard"></section></div>
      ${endExtras(report, me)}
      <div class="e-best">${cards.filter(([k, u, f]) => u && (k !== 'ON THE OBJECTIVE' || objMode) && !/^0 /.test(f(u))).map(([k, u, f]) => `<div class="e-card" data-h="${u.hero}"><i></i><small>${k}</small><b>${u.isPlayer ? 'YOU' : u.name.toUpperCase()}</b><span>${u.def.name} · ${f(u)}</span></div>`).join('')}</div>
      <div class="e-btns"><button class="btn" id="eAgain" type="button">PLAY AGAIN</button>${clips.length ? '<button class="btn ghost" id="eHl" type="button">▶ HIGHLIGHTS</button>' : ''}<button class="btn ghost" id="eMenu" type="button">MAIN MENU</button></div></div>`;
    $('eMeP').append(this.portraits.canvas(me.hero, 96)); this.root.querySelectorAll('.e-card').forEach((c) => c.querySelector('i').replaceWith(this.portraits.canvas(c.dataset.h, 72)));
    renderScoreboard(sim, this.portraits, $('eBoard'));
    $('eAgain').onclick = onAgain; $('eMenu').onclick = onMenu; if ($('eHl')) $('eHl').onclick = onHighlights;
    // animate the xp bar, rolling over levels
    let from = report.before.pct, lvl = report.before.level; const steps = report.after.level - report.before.level; let n = 0; const total = steps + 1;
    const tick = () => { const target = n < steps ? 1 : report.after.pct; const bar = $('eXp'); if (!bar) return; bar.style.transition = 'width .9s ease-out'; bar.style.width = target * 100 + '%'; setTimeout(() => { if (n < steps) { n++; lvl++; if ($('eLvl')) $('eLvl').textContent = lvl; const b2 = $('eXp'); if (b2) { b2.style.transition = 'none'; b2.style.width = '0%'; } requestAnimationFrame(() => requestAnimationFrame(tick)); } }, 950); };
    void from; void total; setTimeout(tick, 600);
    this.root.hidden = false;
  }
}
