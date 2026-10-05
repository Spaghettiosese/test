// HTML for the menu screens and pages. Each function returns a string; App binds the events.
import { OPERATORS, OPS_BY_ID, attackers, defenders, ORGS, PRICE } from '../data/operators.js';
import { GADGETS } from '../data/gadgets.js';
import { WEAPONS, WEAPON_CLASSES } from '../data/weapons.js';
import { icon, gadgetIcon, opIcon, weaponIcon, emblem, laurel } from './icons.js';
import { NEWCOMER, xpForLevel, levelFromXp, RANKS, rankOf, PASS_TIERS, PASS_XP, passRewards, UNIFORMS, HEADGEAR, WEAPON_SKINS, CHARMS, TITLES, BANNERS, shopItems } from '../data/progression.js';
import { HARBOR } from '../data/harbor.js';

const pips = (n, of = 3) => `<span class="pips">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const coin = (cur) => `<span class="coin ${cur}">${cur === 'credits' ? 'C' : '6'}</span>`;
export const price = (p, cur) => `<span class="price">${coin(cur)}${p}</span>`;

export const NAV = [['play', 'Play'], ['operators', 'Operators'], ['pass', 'Battle Pass'], ['locker', 'Locker'], ['career', 'Career'], ['esports', 'Esports'], ['shop', 'Shop']];

export function topbar(app, active) {
  const st = app.store, lv = st.level, p = st.profile;
  return `<div class="topbar"><span class="btnglyph">LB</span><div class="nav">${NAV.map(([id, label]) => `<button data-nav="${id}" class="${active === id ? 'on' : ''}">${label}${id === 'operators' && p.unlockedOps.length < OPERATORS.length ? '<i class="dot"></i>' : ''}${id === 'locker' ? '<i class="dot"></i>' : ''}${id === 'esports' ? '<i class="dot red"></i>' : ''}</button>`).join('')}</div><span class="btnglyph">RB</span>
  <div class="topright"><span class="btnglyph round" title="Chat">⧉</span><div class="sq">${icon('squad')} 1/${5}</div><div class="avatar" data-act="profile">${icon('squad')}</div>${laurel(lv.level)}
  <div class="curr"><span><i class="coin">${icon('key')}</i> ${p.credits}</span><span><i class="coin blue">6</i> ${p.renown}</span></div>
  <button class="gearbtn" data-act="settings" title="Settings">${icon('gear')}<small class="btnglyph round" style="width:16px;height:16px;min-width:16px;font-size:9px">≡</small></button></div></div>`;
}

// ------------------------------------------------------------------------------------------ main menu
export function mainMenu(app) {
  const st = app.store, p = st.profile, lv = st.level, tut = p.tutorial;
  const next = !tut.basic ? 'basic' : !tut.attack ? 'attack' : !tut.defense ? 'defense' : 'done';
  const tutLabel = next === 'done' ? ['REPLAY', 'BASICS'] : next === 'basic' ? [tut.step ? 'CONTINUE' : 'START', 'BASICS'] : ['CONTINUE', next === 'attack' ? 'ATTACK' : 'DEFENSE'];
  const target = Math.max(2, lv.level + 1), need = xpForLevel(lv.level);
  const mission = (c) => { const prog = p.newcomer[c.id] || 0, done = p.newcomer.done[c.id]; return `<div class="mission ${done ? 'done' : ''}"><div class="tx">${c.text}${done && !p.newcomer['claimed_' + c.id] ? `<button class="claim" data-claim="${c.id}">CLAIM</button>` : ''}</div><div class="row"><span>${prog}/${c.target}</span><span class="xp">+${c.xp} XP</span></div><div class="meter"><b style="width:${prog / c.target * 100}%"></b></div></div>`; };
  const dailies = p.daily.list.map((c) => `<div class="mission ${c.progress >= c.target ? 'done' : ''}"><div class="tx">${c.text}${c.progress >= c.target && !c.claimed ? `<button class="claim" data-claimd="${c.id}">CLAIM</button>` : ''}</div><div class="row"><span>${c.progress}/${c.target}</span><span class="xp">${c.claimed ? 'CLAIMED' : '+' + c.xp + ' XP'}</span></div><div class="meter"><b style="width:${c.progress / c.target * 100}%"></b></div></div>`).join('');
  const tab = app.menuTab === 'daily' ? 1 : 0;
  return `${topbar(app, 'play')}
  <div class="menu-left"><div class="modetabs"><span class="btnglyph">LT</span><button class="tab on">${icon('shield')} Core Siege</button><button class="tab" data-act="skirmish">${icon('swords')} Skirmish</button><span class="btnglyph">RT</span></div>
    <div class="season">${emblem()}<div class="vr"></div><div><div class="t1">YEAR 1 SEASON 1</div><div class="t2">Operation First Light</div><div class="t3"><span style="color:${st.rank.color}">${icon('shield')}</span> ${p.placement >= 10 ? st.rank.name.toUpperCase() + ' · ' + p.mmr : 'NOT RANKED'}</div></div></div>
    <div class="squadrow"><span class="btnglyph round">⧉</span>${icon('squad')} <a data-act="squad" style="cursor:pointer">Open Squad Panel</a></div>
    <button class="tile" data-act="tutorial"><div class="art">${tutArt()}</div><span class="btnglyph round">A</span><div class="lbl">${tutLabel[0]}<b>${tutLabel[1]}</b></div></button>
    <button class="bigbtn" data-act="playlists">Playlists</button></div>
  <div class="menu-right"><div class="card hl"><small>REACH CLEARANCE LEVEL ${target}</small><h3>${lv.level < 2 ? 'Unlock Enlisted' : lv.level < 5 ? 'Unlock Operators' : 'Rank Up'}</h3><div class="bar"><i><b style="width:${lv.into / lv.need * 100}%"></b><em>${lv.into} / ${lv.need} XP</em></i>${laurel(target)}</div></div>
    <div class="card newcomer"><h4>${tab ? 'Daily' : 'Newcomer'}</h4><div class="pg"><i class="${tab ? '' : 'on'}" data-tab="newcomer"></i><i class="${tab ? 'on' : ''}" data-tab="daily"></i></div>${tab ? dailies : NEWCOMER.map(mission).join('')}</div>
    <div class="banner" data-act="news"><div class="brand">SIEGEFORGE</div><div class="big">FORGE<br>FIX</div><canvas class="qr" id="qrc" width="29" height="29" style="position:absolute;right:18px;top:18px;width:108px;height:108px;background:#fff;padding:6px;image-rendering:pixelated"></canvas><div class="nm">SIEGEFORGE</div><div class="dots"><i></i><i class="o"></i></div></div>
    <div class="notifrow"><button data-act="notif">${icon('bell')} x${app.unread()} UNREAD</button><button class="sp" data-act="access">ACCESSIBILITY</button></div></div>`;
}
function tutArt() {
  return `<svg viewBox="0 0 462 296" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f7882"/><stop offset="1" stop-color="#1c2129"/></linearGradient></defs><rect width="462" height="296" fill="url(#tg)"/><g opacity=".5" stroke="#fff" stroke-width="2" fill="none"><path d="M60 250 L120 120 L190 250 M130 250 L210 80 L300 250"/></g><g fill="#0b0d12" opacity=".92"><ellipse cx="300" cy="140" rx="30" ry="34"/><path d="M250 270 C255 190 345 190 350 270z"/><rect x="200" y="140" width="95" height="14" rx="3" transform="rotate(-12 200 140)"/></g><g fill="#fff" opacity=".35"><rect x="40" y="40" width="70" height="4"/><rect x="40" y="52" width="46" height="4"/></g></svg>`;
}
export function drawQr(canvas, seed = 7) {
  const c = canvas.getContext('2d'), n = 29; c.fillStyle = '#fff'; c.fillRect(0, 0, n, n); c.fillStyle = '#000';
  let s = seed; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (r() < 0.48) c.fillRect(x, y, 1, 1);
  const finder = (ox, oy) => { c.fillStyle = '#fff'; c.fillRect(ox - 1, oy - 1, 9, 9); c.fillStyle = '#000'; c.fillRect(ox, oy, 7, 7); c.fillStyle = '#fff'; c.fillRect(ox + 1, oy + 1, 5, 5); c.fillStyle = '#000'; c.fillRect(ox + 2, oy + 2, 3, 3); };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
}

// ------------------------------------------------------------------------------------------ modals
export const PLAYLISTS = [
  { id: 'quick', name: 'Quick Match', mode: 'bomb', desc: 'Bomb · casual 5v5 against bots · first to 3 rounds', level: 2, down: true, tag: 'CASUAL', xp: 1, ranked: false },
  { id: 'enlisted', name: 'Enlisted', mode: 'bomb', desc: 'Bomb · Veteran bots · first to 3 · counts towards your rank', level: 3, down: true, tag: 'RANKED', xp: 1.4, ranked: true, enlisted: true, need: 2 },
  { id: 'secure', name: 'Secure Area', mode: 'secure', desc: 'Attackers must hold the room for 10 s · first to 3', level: 2, down: true, tag: 'CASUAL', xp: 1.1 },
  { id: 'elite', name: 'Realistic', mode: 'bomb', desc: 'Elite bots, no down-but-not-out, friendly fire on', level: 4, down: false, ff: true, tag: 'HARDCORE', xp: 1.8, need: 4 },
  { id: 'custom', name: 'Custom Match', mode: 'bomb', desc: 'Your settings: difficulty, time of day, rounds, preparation', level: null, tag: 'CUSTOM', xp: 0.6 },
  { id: 'range', name: 'Shooting Range', mode: 'range', desc: 'Free practice with every weapon at 10 to 200 m', tag: 'TRAINING', xp: 0 },
];
export function playlistsModal(app) {
  const lv = app.store.level.level;
  return `<div class="modal" data-close="1"><div class="box"><h2>Playlists <button data-close="1">${icon('close')}</button></h2><div class="hint" style="margin-bottom:12px">Choose a playlist. Bots fill both teams; you take one operator slot.</div>${PLAYLISTS.map((p) => { const lock = p.need && lv < p.need; return `<button class="listrow" data-play="${p.id}" ${lock ? 'disabled style="opacity:.5"' : ''}><b>${p.name}</b><span>${p.desc}${lock ? ` — reach clearance level ${p.need}` : ''}</span><span class="badge">${p.tag}</span></button>`; }).join('')}</div></div>`;
}
export function squadModal(app) {
  const names = ['Ghost', 'Maverick', 'Nomad', 'Viper'], lv = ['Regular', 'Veteran', 'Elite', 'Realistic'][Math.min(3, app.store.settings.difficulty - 1)] || 'Veteran';
  return `<div class="modal" data-close="1"><div class="box"><h2>Squad <button data-close="1">${icon('close')}</button></h2><div class="hint">Your squad fills with bots. Their skill follows the difficulty you set in Settings (${lv}).</div>
  <div style="margin:14px 0"><div class="statrow"><span>${app.store.settings.playerName} (you)</span><span>Leader</span></div>${names.map((n, i) => `<div class="statrow"><span>${n}</span><span class="hint">Bot · ${['Support', 'Entry', 'Flex', 'Anchor'][i]}</span></div>`).join('')}</div>
  <label class="field" style="grid-template-columns:200px 1fr"><span>Your name</span><input type="text" id="pname" maxlength="14" value="${app.store.settings.playerName}"></label></div></div>`;
}
export function notifModal(app) {
  const news = [['FORGE FIX 1.0', 'Destructible walls, two floors and hatches. Hammer a soft wall, burn a reinforced one.'], ['AI update', 'Bots now stack, flank, call out contacts and retake the defuser.'], ['New: Harbor Garage', 'The two-storey depot with four bomb sites and a rooftop rappel.'], ['Tip: sound', 'Footsteps carry through floors; crouch to stay quiet.'], ['Tip: reinforce', 'Defenders can steel up ten walls in the preparation phase.'], ['Tip: drones', 'Attackers launch a drone in prep (X) to mark defenders.'], ['Tip: DBNO', 'Hold F over a downed teammate to revive them.'], ['Controls', 'Press H in a match to see every key.'], ['Welcome', 'Complete the Basics to earn your first clearance level.']];
  return `<div class="modal" data-close="1"><div class="box"><h2>Notifications <button data-close="1">${icon('close')}</button></h2>${news.map(([a, b]) => `<div class="listrow" style="cursor:default"><b style="min-width:210px;font-size:22px">${a}</b><span>${b}</span></div>`).join('')}</div></div>`;
}
export function accessModal(app) {
  const s = app.store.settings;
  return `<div class="modal" data-close="1"><div class="box"><h2>Accessibility <button data-close="1">${icon('close')}</button></h2>
  <label class="field"><span>Colour-blind mode</span><select data-set="colorblind">${['off', 'protanopia', 'deuteranopia', 'tritanopia'].map((o) => `<option ${s.colorblind === o ? 'selected' : ''}>${o}</option>`).join('')}</select><span></span></label>
  <label class="field"><span>Subtitles for callouts</span><input type="checkbox" data-set="subtitles" ${s.subtitles ? 'checked' : ''}><span></span></label>
  <label class="field"><span>Spoken callouts</span><input type="checkbox" data-set="voice" ${s.voice ? 'checked' : ''}><span></span></label>
  <label class="field"><span>HUD size</span><input type="range" min="0.8" max="1.3" step="0.05" value="${s.hudScale}" data-set="hudScale"><span>${s.hudScale}</span></label>
  <label class="field"><span>Film grain</span><input type="checkbox" data-set="grain" ${s.grain ? 'checked' : ''}><span></span></label>
  <label class="field"><span>Chromatic aberration</span><input type="checkbox" data-set="chromatic" ${s.chromatic ? 'checked' : ''}><span></span></label>
  <label class="field"><span>Hit marker</span><input type="checkbox" data-set="hitMarker" ${s.hitMarker ? 'checked' : ''}><span></span></label></div></div>`;
}
export function settingsModal(app, tab = 'gameplay') {
  const s = app.store.settings, K = s.keys;
  const range = (k, min, max, step) => `<label class="field"><span>${LABEL[k] || k}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${s[k]}" data-set="${k}"><span>${s[k]}</span></label>`;
  const check = (k) => `<label class="field"><span>${LABEL[k] || k}</span><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><span></span></label>`;
  const sel = (k, opts) => `<label class="field"><span>${LABEL[k] || k}</span><select data-set="${k}">${opts.map(([v, t]) => `<option value="${v}" ${String(s[k]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select><span></span></label>`;
  const tabs = ['gameplay', 'controls', 'audio', 'video', 'match'];
  let body = '';
  if (tab === 'gameplay') body = range('sens', 0.3, 2.5, 0.05) + range('adsSens', 0.3, 1.5, 0.05) + range('fov', 60, 100, 1) + check('invertY') + check('aimToggle') + sel('crosshair', [['dot', 'Dot'], ['cross', 'Cross'], ['circle', 'Circle']]) + `<label class="field"><span>Crosshair colour</span><input type="color" data-set="crosshairColor" value="${s.crosshairColor}"><span></span></label>` + check('specThird') + check('showFps');
  else if (tab === 'controls') body = `<div class="hint" style="margin-bottom:8px">Click a key, then press the new key.</div>` + Object.entries(K).map(([a, k]) => `<div class="field" style="grid-template-columns:1fr 160px"><span>${KEYLABEL[a] || a}</span><button class="keybtn" data-rebind="${a}">${k === ' ' ? 'SPACE' : k.toUpperCase()}</button></div>`).join('') + `<div style="margin-top:12px"><button class="btn ghost" data-act="resetkeys">Reset keys</button></div>`;
  else if (tab === 'audio') body = range('volume', 0, 1, 0.05) + range('musicVol', 0, 1, 0.05) + check('voice') + check('subtitles');
  else if (tab === 'video') body = sel('quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]) + range('renderScale', 0.5, 1, 0.05) + check('grain') + check('chromatic') + range('hudScale', 0.8, 1.3, 0.05);
  else body = sel('difficulty', [[0, 'Recruit'], [1, 'Regular'], [2, 'Veteran'], [3, 'Elite'], [4, 'Realistic']]) + sel('tod', [['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night'], ['random', 'Random']]) + range('prep', 15, 90, 5) + range('action', 90, 300, 10) + range('rounds', 1, 5, 1) + check('down') + check('friendlyFire');
  return `<div class="modal" data-close="1"><div class="box"><h2>Settings <button data-close="1">${icon('close')}</button></h2><div class="chips">${tabs.map((t) => `<button class="chip ${t === tab ? 'on' : ''}" data-stab="${t}">${t}</button>`).join('')}</div>${body}<div style="margin-top:14px;display:flex;gap:10px"><button class="btn red" data-act="resetprofile">Reset progress</button></div></div></div>`;
}
const LABEL = { sens: 'Mouse sensitivity', adsSens: 'Aim sensitivity', fov: 'Field of view', invertY: 'Invert Y axis', aimToggle: 'Toggle aim', crosshair: 'Crosshair', specThird: 'Third-person spectate', showFps: 'Show FPS', volume: 'Master volume', musicVol: 'Music volume', voice: 'Spoken callouts', subtitles: 'Callout subtitles', quality: 'Graphics quality', renderScale: 'Render scale', grain: 'Film grain', chromatic: 'Chromatic aberration', hudScale: 'HUD size', difficulty: 'Bot difficulty', tod: 'Time of day', prep: 'Preparation (s)', action: 'Round time (s)', rounds: 'Rounds to win', down: 'Down but not out', friendlyFire: 'Friendly fire' };
const KEYLABEL = { forward: 'Move forward', back: 'Move back', left: 'Strafe left', right: 'Strafe right', sprint: 'Sprint', crouch: 'Crouch', prone: 'Prone', leanL: 'Lean left', leanR: 'Lean right', jump: 'Jump / vault', reload: 'Reload', use: 'Interact / hold actions', melee: 'Melee', gadget: 'Use gadget (G)', drone: 'Drone / cameras', ping: 'Ping', scoreboard: 'Scoreboard', inspect: 'Inspect weapon', primary: 'Primary weapon', secondary: 'Secondary weapon', gadget1: 'Operator gadget', gadget2: 'Secondary gadget', detonate: 'Detonate charges', next: 'Next item', map: 'Map', help: 'Help' };

// ------------------------------------------------------------------------------------------ pages
export function operatorsPage(app) {
  const st = app.store, side = app.opFilter || 'all', sel = OPS_BY_ID[app.opSel] || OPERATORS[0];
  const list = OPERATORS.filter((o) => side === 'all' || o.side === side);
  const owned = st.owns('operator', sel.id);
  return `${topbar(app, 'operators')}<div class="page half" style="right:30%"><h2>Operators</h2><div class="sub">${st.profile.unlockedOps.length} of ${OPERATORS.length} unlocked</div>
  <div class="chips">${[['all', 'All'], ['atk', 'Attackers'], ['def', 'Defenders']].map(([id, t]) => `<button class="chip ${side === id ? 'on' : ''}" data-ofilter="${id}">${t}</button>`).join('')}</div>
  <div class="opsplit"><div class="grid ops">${list.map((o) => { const ow = st.owns('operator', o.id); return `<button class="opcard ${o.id === sel.id ? 'sel' : ''} ${ow ? '' : 'locked'}" data-op="${o.id}">${opIcon(o)}<b>${o.name}</b><span class="${o.side === 'atk' ? 'side-atk' : 'side-def'}">${o.side === 'atk' ? 'Attacker' : 'Defender'}</span> <span>· ${o.role}</span>${ow ? '' : `<i class="lockic">${icon('lock')}</i>`}</button>`; }).join('')}</div>
  <div class="detail"><div class="org">${ORGS[sel.org].name} · ${sel.side === 'atk' ? 'ATTACKER' : 'DEFENDER'}</div><h3>${sel.name}</h3><div class="hint">${sel.role}</div>
    <div class="statrow"><span>Difficulty</span>${pips(sel.diff)}</div><div class="statrow"><span>Speed</span>${pips(sel.speed)}</div><div class="statrow"><span>Armor</span>${pips(sel.armor)}</div>
    <div class="statrow" style="align-items:flex-start;flex-direction:column;gap:2px"><span>${gadgetIcon(sel.ability)} ${GADGETS[sel.ability].name}</span><span class="hint" style="text-transform:none;font-family:var(--body)">${GADGETS[sel.ability].desc}</span></div>
    <div class="statrow"><span>Primary</span><span class="hint">${sel.primary.map((w) => WEAPONS[w].label).join(' · ')}</span></div><div class="statrow"><span>Secondary</span><span class="hint">${sel.secondary.map((w) => WEAPONS[w].label).join(' · ')}</span></div><div class="statrow"><span>Gadgets</span><span class="hint">${sel.gadgets.map((g) => GADGETS[g].name).join(' · ')}</span></div>
    <div style="margin-top:14px">${owned ? `<button class="btn" data-act="setfav" data-op="${sel.id}">Set as favourite</button>` : `<button class="btn red" data-buyop="${sel.id}" ${st.profile.renown < PRICE(sel) ? 'disabled' : ''}>Unlock ${price(PRICE(sel), 'renown')}</button>`}</div></div></div></div>`;
}
export function passPage(app) {
  const st = app.store, tier = st.passTier(), rewards = passRewards(), p = st.profile;
  const into = st.profile.xp % PASS_XP;
  return `${topbar(app, 'pass')}<div class="page"><h2>Battle Pass</h2><div class="sub">Season 1 · Operation First Light · Tier ${tier} / ${PASS_TIERS} · ${into} / ${PASS_XP} XP to next tier ${p.pass.premium ? '· <b style="color:var(--gold)">PREMIUM</b>' : ''}</div>
  ${p.pass.premium ? '' : `<div style="margin-bottom:14px"><button class="btn red" data-buy="pass">Unlock premium ${price(1200, 'credits')}</button></div>`}
  <div class="tierrow">${rewards.map((r) => { const reached = r.tier <= tier, cf = p.pass.claimedFree.includes(r.tier), cp = p.pass.claimedPrem.includes(r.tier); return `<div class="tier ${reached ? 'reached' : ''}"><div class="n">${r.tier}</div><div class="free"><div class="rw">${r.free.name}</div>${cf ? '<span class="claimed">CLAIMED</span>' : reached ? `<button class="claim" data-pclaim="${r.tier}:free">CLAIM</button>` : ''}</div><div class="prem"><div class="rw">${r.premium.name}</div>${cp ? '<span class="claimed">CLAIMED</span>' : reached && p.pass.premium ? `<button class="claim" data-pclaim="${r.tier}:premium">CLAIM</button>` : !p.pass.premium ? icon('lock') : ''}</div></div>`; }).join('')}</div>
  <div class="hint">Earn pass XP from every match. Free rewards are always claimable; the premium track needs the pass.</div></div>`;
}
export function lockerPage(app) {
  const st = app.store, cat = app.lockCat || 'uniform', eq = st.profile.equipped, own = st.profile.owned;
  const defs = { uniform: UNIFORMS, headgear: HEADGEAR, skin: WEAPON_SKINS, charm: CHARMS.map((c) => ({ ...c })), title: TITLES, banner: BANNERS }[cat];
  const eqKey = cat === 'title' ? st.profile.title : cat === 'banner' ? st.profile.banner : eq[cat];
  const cards = defs.map((d) => { const owned = d.price === 0 || (own[cat] || []).includes(d.id); const isEq = eqKey === d.id || (cat === 'charm' && eq.charm === d.id);
    return `<button class="opcard ${isEq ? 'sel' : ''} ${owned ? '' : 'locked'}" data-lock="${d.id}"><span style="font-size:44px;display:block;text-align:center;height:56px;color:${d.uni || d.tint || d.c2 || '#fff'}">${d.icon || (cat === 'banner' ? '▰' : cat === 'title' ? '❝' : cat === 'skin' ? '▮' : cat === 'headgear' ? '◒' : '▇')}</span><b style="font-size:21px">${d.name}</b><span>${isEq ? 'Equipped' : owned ? 'Owned' : (d.credit ? 'Credits ' : 'Renown ') + d.price}</span></button>`; }).join('');
  return `${topbar(app, 'locker')}<div class="page" style="right:40%"><h2>Locker</h2><div class="sub">Customise every operator. Uniforms and headgear show on the preview.</div>
  <div class="chips">${['uniform', 'headgear', 'skin', 'charm', 'title', 'banner'].map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-lcat="${c}">${c === 'skin' ? 'weapon skins' : c}</button>`).join('')}</div><div class="grid ops">${cards}</div></div>
  <div class="page" style="left:62%;background:transparent"><div class="hint" style="margin-top:12px;text-align:right">Preview operator: ${OPERATORS.filter((o) => app.store.owns('operator', o.id)).map((o) => `<button class="chip ${o.id === app.lockOp ? 'on' : ''}" data-lop="${o.id}">${o.name}</button>`).join('')}</div></div>`;
}
export function careerPage(app) {
  const st = app.store, p = st.profile, s = p.stats, rk = st.rank, lv = st.level;
  const kd = s.deaths ? (s.kills / s.deaths).toFixed(2) : s.kills.toFixed(2), acc = s.shots ? Math.round(s.hits / s.shots * 100) : 0, hs = s.kills ? Math.round(s.headshots / s.kills * 100) : 0, wr = s.matches ? Math.round(s.wins / s.matches * 100) : 0;
  const fav = Object.entries(s.opPlays).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const banner = BANNERS.find((b) => b.id === p.banner) || BANNERS[0];
  return `${topbar(app, 'career')}<div class="page"><h2>Career</h2>
  <div class="detail" style="background:linear-gradient(90deg,${banner.c1},${banner.c2});display:flex;align-items:center;gap:22px;margin-bottom:16px"><div class="avatar" style="width:84px;height:84px">${icon('squad')}</div><div><div style="font:700 44px var(--display);text-transform:uppercase">${st.settings.playerName}</div><div class="hint" style="color:#fff">${(TITLES.find((t) => t.id === p.title) || TITLES[0]).name} · Clearance level ${lv.level}</div></div><div style="margin-left:auto;text-align:right"><div style="font:700 36px var(--display);color:${rk.color}">${p.placement >= 10 ? rk.name.toUpperCase() : 'NOT RANKED'}</div><div class="hint" style="color:#fff">${p.placement >= 10 ? p.mmr + ' MMR' : `Placement ${p.placement}/10 in Enlisted`}</div></div></div>
  <div class="kpis"><div class="kpi"><b>${s.matches}</b><span>Matches</span></div><div class="kpi"><b>${wr}%</b><span>Win rate</span></div><div class="kpi"><b>${kd}</b><span>K/D</span></div><div class="kpi"><b>${acc}%</b><span>Accuracy</span></div><div class="kpi"><b>${hs}%</b><span>Headshots</span></div><div class="kpi"><b>${s.kills}</b><span>Kills</span></div><div class="kpi"><b>${s.plants}</b><span>Defusers planted</span></div><div class="kpi"><b>${s.defuses}</b><span>Defusers disabled</span></div><div class="kpi"><b>${s.reinforced}</b><span>Walls reinforced</span></div><div class="kpi"><b>${s.breached}</b><span>Panels breached</span></div><div class="kpi"><b>${Math.round(s.seconds / 60)}</b><span>Minutes played</span></div><div class="kpi"><b>${s.assists}</b><span>Assists</span></div></div>
  <div class="split"><div><h3 style="font:700 28px var(--display);text-transform:uppercase;margin:0 0 6px">Match history</h3>${p.history.length ? `<table class="table"><tr><th>Result</th><th>Mode</th><th>Score</th><th>Operator</th><th>K/D</th><th>XP</th></tr>${p.history.slice(0, 10).map((h) => `<tr><td style="color:${h.won ? '#7fd1ff' : '#ff8a80'}">${h.won ? 'VICTORY' : 'DEFEAT'}</td><td>${h.mode}${h.ranked ? ' ★' : ''}</td><td>${h.score}</td><td>${(OPS_BY_ID[h.op] || { name: h.op }).name}</td><td>${h.kills}/${h.deaths}</td><td>+${h.xp}</td></tr>`).join('')}</table>` : '<div class="hint">No matches yet. Play one from the Playlists.</div>'}</div>
  <div><h3 style="font:700 28px var(--display);text-transform:uppercase;margin:0 0 6px">Favourite operators</h3>${fav.length ? fav.map(([id, n]) => `<div class="statrow"><span>${OPS_BY_ID[id] ? opIcon(OPS_BY_ID[id]) : ''} ${OPS_BY_ID[id] ? OPS_BY_ID[id].name : id}</span><span>${n} matches · ${s.opKills[id] || 0} kills</span></div>`).join('') : '<div class="hint">Play with an operator to see it here.</div>'}
  <h3 style="font:700 28px var(--display);text-transform:uppercase;margin:18px 0 6px">Ranks</h3>${RANKS.map((r) => `<div class="statrow"><span style="color:${r.color}">${icon('shield')} ${r.name}</span><span class="hint">${r.min}+ MMR</span></div>`).join('')}</div></div></div>`;
}
const TEAMS = [['Nova Vanguard', 'NV', 31, 7], ['Ironclad Five', 'IC', 28, 10], ['Kestrel Ops', 'KO', 25, 13], ['Obsidian', 'OB', 22, 16], ['Halberd Gaming', 'HG', 19, 19], ['Tidewatch', 'TW', 15, 23], ['Ashford Esports', 'AE', 12, 26], ['Northwatch', 'NW', 9, 29]];
export function esportsPage(app) {
  const me = app.store.profile;
  const fx = [['Nova Vanguard', 'Obsidian', 'Harbor Garage'], ['Ironclad Five', 'Tidewatch', 'Harbor Garage'], ['Kestrel Ops', 'Northwatch', 'Harbor Garage']];
  const pick = app.pickem || {};
  return `${topbar(app, 'esports')}<div class="page"><h2>Esports</h2><div class="sub">Forge Pro League · Season 1 · all matches are played by the game's own AI at Elite level</div>
  <div class="split"><div><h3 style="font:700 28px var(--display);text-transform:uppercase;margin:0 0 6px">Standings</h3><table class="table"><tr><th>#</th><th>Team</th><th>W</th><th>L</th></tr>${TEAMS.map((t, i) => `<tr><td>${i + 1}</td><td>${t[0]}</td><td>${t[2]}</td><td>${t[3]}</td></tr>`).join('')}</table></div>
  <div><h3 style="font:700 28px var(--display);text-transform:uppercase;margin:0 0 6px">Live &amp; upcoming</h3>${fx.map((f, i) => `<div class="listrow" style="cursor:default"><b style="min-width:0;flex:1;font-size:23px">${f[0]} vs ${f[1]}</b><span>${f[2]}</span><button class="btn ghost" data-pick="${i}:0" style="${pick[i] === 0 ? 'background:#fff;color:#000' : ''}">${f[0].split(' ')[0]}</button><button class="btn ghost" data-pick="${i}:1" style="${pick[i] === 1 ? 'background:#fff;color:#000' : ''}">${f[1].split(' ')[0]}</button></div>`).join('')}
  <button class="btn red" data-act="watch" style="margin-top:8px">${icon('play')} Watch a live match</button><div class="hint" style="margin-top:10px">Pick a winner above, then watch: right picks earn renown. Pick'em points: ${me.pickPoints || 0}</div></div></div></div>`;
}
export function shopPage(app) {
  const st = app.store, cat = app.shopCat || 'operator', items = shopItems().filter((i) => cat === 'all' || i.kind === cat || (cat === 'operator' && i.kind === 'operator'));
  const cats = ['operator', 'uniform', 'headgear', 'skin', 'weapon', 'charm', 'title', 'banner', 'pass'];
  return `${topbar(app, 'shop')}<div class="page"><h2>Shop</h2><div class="sub">Spend renown on operators and gear; credits on premium items.</div><div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-scat="${c}">${c === 'skin' ? 'weapon skins' : c}</button>`).join('')}</div>
  <div class="grid ops">${items.map((i) => { const [kind, id] = i.id.split(':'); const k = kind === 'op' ? 'operator' : kind === 'head' ? 'headgear' : kind; const ow = i.kind === 'pass' ? st.profile.pass.premium : st.owns(k === 'pass' ? 'x' : k, id); const op = i.op ? OPS_BY_ID[i.op] : null; const w = i.weapon ? WEAPONS[i.weapon] : null;
    return `<div class="opcard ${ow ? 'locked' : ''}">${op ? opIcon(op) : w ? `<div style="height:54px">${weaponIcon(w.cls)}</div>` : `<span style="font-size:44px;display:block;text-align:center;height:56px">${i.kind === 'pass' ? '★' : '▇'}</span>`}<b style="font-size:21px">${i.name}</b><span>${i.sub}</span><div style="margin-top:6px">${ow ? '<span class="hint">OWNED</span>' : `<button class="btn" data-buy="${i.id}" ${st.profile[i.currency] < i.price ? 'disabled' : ''}>${price(i.price, i.currency)}</button>`}</div></div>`; }).join('')}</div></div>`;
}

// ------------------------------------------------------------------------------------------ operator select
export function siteMapSvg(sim, highlight = null, sel = null) {
  // a plan of both floors from the map definition
  const d = HARBOR, cw = 9, pad = 6;
  const floor = (f, ox) => {
    let s = ''; const colors = { G: '#35506e', P: '#44505c', W: '#4e4a38', h: '#2b323a', j: '#2b323a', k: '#2b323a', L: '#3a5a78', R: '#4a4a38', O: '#3a5a3a', A: '#454a52', e: '#2b323a', f: '#2b323a', g: '#2b323a', K: '#3a5a78', Y: '#4e4a38', C: '#4e4438' };
    for (let z = 0; z < d.bd; z++) for (let x = 0; x < d.bw; x++) { const L = d.plan[f][d.bd - 1 - z][x]; const hl = highlight && highlight.f === f && highlight.rooms.includes(L); s += `<rect x="${ox + x * cw}" y="${pad + (d.bd - 1 - z) * cw}" width="${cw}" height="${cw}" fill="${hl ? '#f1c24c' : colors[L] || '#333'}" opacity="${hl ? 0.95 : 0.9}" stroke="#0b0d12" stroke-width=".6"/>`; }
    return s + `<text x="${ox}" y="${pad - 1}" fill="#aab" font-size="10" font-family="Oswald,sans-serif">${f + 1}F</text>`;
  };
  const w = d.bw * cw;
  return `<svg viewBox="0 0 ${w * 2 + 30} ${d.bd * cw + pad + 4}">${floor(0, 2)}${floor(1, w + 22)}</svg>`;
}
export const OS_TABS = [['locations', 'Locations'], ['operators', 'Operators'], ['loadout', 'Loadout'], ['ready', 'Ready']];
export function opGridHtml(app, os) {
  const st = app.store; const row = (list) => list.map((o) => {
    const enabled = o.side === os.side, owned = st.owns('operator', o.id), taken = os.taken.has(o.id) && os.chosen !== o.id;
    return `<button class="optile ${os.chosen === o.id ? 'sel' : ''} ${enabled ? '' : 'off'} ${owned ? '' : 'locked'} ${taken ? 'taken' : ''}" data-os-op="${o.id}">${opIcon(o)}${owned ? '' : `<i class="lk">${icon('lock')}</i>`}</button>`;
  }).join('');
  return `<div class="opgrid">${row(attackers)}<div class="sep"></div>${row(defenders)}</div>`;
}
export function loadoutHtml(app, os) {
  const op = OPS_BY_ID[os.chosen], st = app.store, lo = os.loadout;
  const wcell = (slot, id) => { const w = WEAPONS[id], owned = st.owns('weapon', id); return `<button class="lo ${lo[slot] === id ? 'sel' : ''} ${owned ? '' : 'dis'}" data-os-w="${slot}:${id}" ${owned ? '' : 'disabled'}>${weaponIcon(w.cls)}<div><small>${WEAPON_CLASSES[w.cls]}</small><b>${w.label}</b></div></button>`; };
  const gcell = (id) => `<button class="lo ${lo.gadget2 === id ? 'sel' : ''}" data-os-g="${id}">${gadgetIcon(id)}<div><small>Gadget</small><b>${GADGETS[id].name}</b></div></button>`;
  return `<div class="opinfo" style="top:150px"><div class="nameline"><div class="optile">${opIcon(op)}</div><div><h1>${op.name}</h1><div class="org">Choose your loadout</div></div></div>
    <div style="margin-top:18px;font:600 15px var(--display);letter-spacing:.1em;color:var(--dim)">PRIMARY</div><div class="loadout">${op.primary.map((id) => wcell('primary', id)).join('')}</div>
    <div style="margin-top:14px;font:600 15px var(--display);letter-spacing:.1em;color:var(--dim)">SECONDARY</div><div class="loadout">${op.secondary.map((id) => wcell('secondary', id)).join('')}</div>
    <div style="margin-top:14px;font:600 15px var(--display);letter-spacing:.1em;color:var(--dim)">SECONDARY GADGET</div><div class="loadout">${op.gadgets.map(gcell).join('')}</div></div>
    <div class="osfoot" style="left:70px;bottom:34px">${wstats(WEAPONS[lo.primary])}</div>`;
}
function wstats(w) { const bar = (v, max) => `<span style="display:inline-block;width:90px;height:7px;background:rgba(255,255,255,.2);vertical-align:middle"><b style="display:block;height:100%;width:${Math.min(100, v / max * 100)}%;background:#fff"></b></span>`; return `<div style="display:grid;gap:3px;grid-template-columns:auto auto auto;column-gap:14px"><span>${w.label}</span><span></span><span></span><span>Damage</span>${bar(w.dmg * w.pellets, 130)}<span>${w.dmg}${w.pellets > 1 ? '×' + w.pellets : ''}</span><span>Rate</span>${bar(w.rpm, 950)}<span>${w.rpm} rpm</span><span>Magazine</span>${bar(w.mag, 40)}<span>${w.mag}</span></div>`; }
export function opInfoHtml(op, org = true) {
  return `<div class="opinfo"><div class="nameline"><div class="optile">${opIcon(op)}</div><div><h1>${op.name}</h1><div class="org">${icon('shield')} ${ORGS[op.org].name}</div></div></div>
    <div class="abil"><div class="l"><h4>${gadgetIcon(op.ability)} ${GADGETS[op.ability].name}</h4><p>${GADGETS[op.ability].desc}</p></div><div class="r"><div>Difficulty ${pips(op.diff)}</div><div>Speed ${pips(op.speed)}</div><div>Armor ${pips(op.armor)}</div></div></div></div>`;
  void org;
}
