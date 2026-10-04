// The in-match HUD: per-mode objective bar, team roster, vitals, abilities, crosshair and hit
// feedback, kill feed, pings and world markers, minimap, voice subtitles, kill cam and Play of the
// Game overlays, and the communication wheel. Screens (menus, select, scoreboard...) are in screens.js.
import { HERO, ROLES, SUBCLASSES } from './heroes.js';
import { MUTATORS } from './sim.js';
import { drawIcon, roleSvg, subSvg, ROLE_COLORS } from './icons.js';
import { pingColor } from './view.js';
import { fmtTime, clamp, v3, wrapAngle, yawTo } from './util.js';

export const $ = (id) => document.getElementById(id);
export const el = (tag, cls = '', html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
export const badges = (def, size = 16) => `<span class="badges">${roleSvg(def.role, size, ROLE_COLORS[def.role])}${subSvg(SUBCLASSES[def.sub]?.icon, size, '#cfe0ff')}</span>`;
const TEAM_HEX = ['#3a9bff', '#ff4a52'];

// ------------------------------------------------------------------ minimap
export class Minimap {
  constructor(canvas) { this.c = canvas; this.g = canvas.getContext('2d'); this.size = canvas.width; this.range = 52; this.rotate = true; this.level = null; this.seen = new Map(); }
  setLevel(level, viewTeam) {
    this.level = level; const B = level.bounds, W = B.x1 - B.x0, H = B.z1 - B.z0; this.ppm = Math.min(3, 1500 / Math.max(W, H));
    const c = document.createElement('canvas'); c.width = Math.ceil(W * this.ppm) + 8; c.height = Math.ceil(H * this.ppm) + 8; const g = c.getContext('2d'); this.off = c;
    g.fillStyle = '#16233b'; g.fillRect(0, 0, c.width, c.height); g.translate(4, 4);
    const X = (x) => (x - B.x0) * this.ppm, Z = (z) => (z - B.z0) * this.ppm;
    // walkable ground slightly lighter than the void outside the bounds
    g.fillStyle = '#243656'; g.fillRect(0, 0, W * this.ppm, H * this.ppm);
    const boxes = [...level.boxes].sort((a, b) => a.y1 - b.y1);
    for (const b of boxes) { const h = b.y1; if (h < 0.35) continue; const t = clamp(h / 12, 0, 1), lift = b.y0 > 2.5 ? 0.55 : 1; g.globalAlpha = lift; g.fillStyle = `rgb(${Math.round(70 + t * 90)},${Math.round(88 + t * 95)},${Math.round(120 + t * 85)})`; g.fillRect(X(b.x0), Z(b.z0), (b.x1 - b.x0) * this.ppm, (b.z1 - b.z0) * this.ppm); }
    g.globalAlpha = 1;
    if (level.path) { g.strokeStyle = 'rgba(255,214,107,.7)'; g.setLineDash([6, 5]); g.lineWidth = 3; g.beginPath(); level.path.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1])))); g.stroke(); g.setLineDash([]); }
    for (const t of [0, 1]) { const sp = level.spawns[t], cx = sp.reduce((a, p) => a + p[0], 0) / sp.length, cz = sp.reduce((a, p) => a + p[2], 0) / sp.length; g.fillStyle = TEAM_HEX[t === viewTeam ? 0 : 1]; g.globalAlpha = 0.7; g.fillRect(X(cx) - 14, Z(cz) - 8, 28, 16); g.globalAlpha = 1; }
    for (const p of level.points || []) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(p.pos[0]), Z(p.pos[2]), p.r * this.ppm, 0, 7); g.stroke(); }
    this.B = B;
  }
  draw(sim, me, view) {
    const g = this.g, S = this.size, cx = S / 2, cy = S / 2, s = S / (this.range * 2), yaw = this.rotate ? (me?.yaw ?? 0) : 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const px = me ? me.pos[0] : 0, pz = me ? me.pos[2] : 0, B = this.B, ppm = this.ppm;
    g.save(); g.clearRect(0, 0, S, S); g.beginPath(); g.arc(cx, cy, cx - 1, 0, 7); g.clip(); g.fillStyle = '#0c1424'; g.fillRect(0, 0, S, S);
    const m = (x, z) => [cx + s * (-(x - px) * cs + (z - pz) * sn), cy - s * ((x - px) * sn + (z - pz) * cs)];
    // static layer: image (ix, iy) -> screen
    const x0 = B.x0 - 4 / ppm, z0 = B.z0 - 4 / ppm, k = s / ppm;
    g.setTransform(-k * cs, -k * sn, k * sn, -k * cs, cx + s * (-(x0 - px) * cs + (z0 - pz) * sn), cy - s * ((x0 - px) * sn + (z0 - pz) * cs));
    g.drawImage(this.off, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    const team = me?.team, vt = sim.playerTeam, marks = (x, z, col, r = 4, shape = 'dot', rot = 0) => { const [X, Z] = m(x, z); if (Math.hypot(X - cx, Z - cy) > cx - 3) return; g.fillStyle = col; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); if (shape === 'tri') { const a = rot - yaw; g.moveTo(X + Math.sin(a) * (r + 2), Z - Math.cos(a) * (r + 2)); g.lineTo(X + Math.sin(a + 2.5) * r, Z - Math.cos(a + 2.5) * r); g.lineTo(X + Math.sin(a - 2.5) * r, Z - Math.cos(a - 2.5) * r); g.closePath(); } else if (shape === 'dia') { g.moveTo(X, Z - r); g.lineTo(X + r, Z); g.lineTo(X, Z + r); g.lineTo(X - r, Z); g.closePath(); } else g.arc(X, Z, r, 0, 7); g.fill(); g.stroke(); };
    // objectives
    const P = sim.payload; if (P && P.active !== false) marks(P.pos[0], P.pos[2], P.contested ? '#ffd36b' : '#fff', 6, 'dia');
    for (const p of sim.level.points || []) if (sim.control || sim.cap) { const own = sim.control ? sim.control.owner : (sim.cap.done ? 0 : -1); marks(p.pos[0], p.pos[2], own < 0 ? '#e8eef9' : own === vt ? '#3a9bff' : '#ff4a52', 6, 'dia'); }
    for (const p of sim.packs) if (p.ready) marks(p.pos[0], p.pos[2], '#7dff9a', 2.5);
    // units
    for (const u of sim.units) {
      if (u.deploy || !u.alive) continue;
      const mate = team != null && u.team === team && sim.modeId !== 'ffa' || u === me;
      if (u === me) { marks(u.pos[0], u.pos[2], '#fff', 5.5, 'tri', u.yaw); continue; }
      if (mate) marks(u.pos[0], u.pos[2], '#3a9bff', 4.2, 'tri', u.yaw);
      else {
        const spotted = u.st.reveal || u.bounty || (me && u.hurt?.[me.id] != null && sim.time - u.hurt[me.id] < 2.5) || (me && sim.time - (this.seen.get(u.id) ?? -9) < 1.2);
        if (spotted) marks(u.pos[0], u.pos[2], '#ff4a52', 4.2, 'dia');
      }
    }
    for (const p of sim.pings || []) if (p.team === team) marks(p.pos[0], p.pos[2], pingColor(p.kind), 5, 'dia');
    g.restore();
    g.strokeStyle = 'rgba(190,215,255,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, cx - 1, 0, 7); g.stroke();
  }
  // enemies that the player can currently see on screen show up on the map for a moment
  spot(sim, me) {
    if (!me?.alive) return; const eye = sim.eye(me), f = sim.aimDir(me);
    for (const u of sim.units) {
      if (u.deploy || !u.alive || u.team === me.team) continue; const c = sim.center(u), d = v3.sub(c, eye), l = v3.len(d); if (l > 60 || l < 0.1) continue;
      if (v3.dot(d, f) / l < 0.45) continue; if (sim.visibleTo(me, u) && sim.los(eye, c)) this.seen.set(u.id, sim.time);
    }
  }
}

// ------------------------------------------------------------------ communication wheel
export const WHEEL = [
  { id: 'group', label: 'GROUP UP', icon: '◎' }, { id: 'push', label: 'PUSH', icon: '▲' }, { id: 'defend', label: 'DEFEND', icon: '⛉' }, { id: 'ultReady', label: 'ULT READY', icon: '★' },
  { id: 'thanks', label: 'THANKS', icon: '♥' }, { id: 'help', label: 'NEED HEALING', icon: '✚' }, { id: 'fallback', label: 'FALL BACK', icon: '▼' }, { id: 'hello', label: 'HELLO', icon: '☺' },
];
export class CommWheel {
  constructor(root, onPick) {
    this.root = root; this.onPick = onPick; this.open = false; this.x = this.y = 0; this.sel = -1; root.innerHTML = '<div class="w-ring"></div><div class="w-core"><b>COMMS</b><span id="wLabel">HOLD & AIM</span></div>';
    this.slots = WHEEL.map((w, i) => { const a = (i / WHEEL.length) * Math.PI * 2 - Math.PI / 2, d = el('div', 'w-slot', `<i>${w.icon}</i><span>${w.label}</span>`); d.style.left = `calc(50% + ${Math.cos(a) * 11}rem)`; d.style.top = `calc(50% + ${Math.sin(a) * 11}rem)`; root.append(d); return d; });
  }
  show() { this.open = true; this.x = this.y = 0; this.sel = -1; this.root.hidden = false; this.refresh(); }
  hide(pick = true) { if (!this.open) return; this.open = false; this.root.hidden = true; if (pick && this.sel >= 0) this.onPick(WHEEL[this.sel].id); }
  move(dx, dy) { if (!this.open) return; this.x += dx; this.y += dy; const l = Math.hypot(this.x, this.y); if (l > 140) { this.x *= 140 / l; this.y *= 140 / l; } this.sel = l > 28 ? Math.round(((Math.atan2(this.y, this.x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * WHEEL.length) % WHEEL.length : -1; this.refresh(); }
  refresh() { this.slots.forEach((s, i) => s.classList.toggle('on', i === this.sel)); $('wLabel').textContent = this.sel >= 0 ? WHEEL[this.sel].label : 'HOLD & AIM'; this.root.style.setProperty('--wx', this.x / 140); this.root.style.setProperty('--wy', this.y / 140); }
}

// ------------------------------------------------------------------ HUD
const STATUS_TAGS = {
  stun: ['STUNNED', '#ff6a6a'], sleep: ['ASLEEP', '#9fb4ff'], frozen: ['FROZEN', '#8fe8ff'], root: ['ROOTED', '#9aff6a'], silenced: ['SILENCED', '#ff9a6a'], slow: ['SLOWED', '#8fb4ff'], burn: ['BURNING', '#ff8a3a'],
  marked: ['MARKED', '#ff5a5a'], discord: ['DISCORD', '#c06bff'], nohealing: ['ANTI-HEAL', '#c9ff6a'], reveal: ['REVEALED', '#ffd36b'],
  speed: ['SPEED', '#7dffb0'], resist: ['RESIST', '#7fc4ff'], dmgBoost: ['DAMAGE+', '#ffb02e'], overdrive: ['OVERDRIVE', '#ffb02e'], nano: ['NANO', '#ffd36b'], healAmp: ['AMPED', '#7dffb0'], fortify: ['FORTIFY', '#7fc4ff'], cloak: ['CLOAKED', '#c9b6ff'], brace: ['BRACE', '#7fc4ff'], warded: ['WARDED', '#8fe8ff'], deadeye: ['DEADEYE', '#ffd36b'],
};
const BAD = new Set(['stun', 'sleep', 'frozen', 'root', 'silenced', 'slow', 'burn', 'marked', 'discord', 'nohealing', 'reveal']);

export class Hud {
  constructor(view, portraits) {
    this.view = view; this.portraits = portraits; this.lastSig = {}; this.dir = []; this.markEls = new Map(); this.teamEls = new Map(); this.hero = null; this.ultWasReady = false; this.tickN = -1; this.recap = []; this.mapT = 0;
    this.xhair = $('xhair'); this.minimap = new Minimap($('minimap')); this.healOut = { amt: 0, t: 0 }; this.healIn = { amt: 0, t: 0 }; this.settings = { minimap: true, xhair: 'auto', xcolor: '#ffffff', numbers: true };
    this.subEl = $('subs');
  }
  reset(sim) {
    this.sim = sim; this.hero = null; this.mode = sim.modeId; $('feed').innerHTML = ''; $('popups').innerHTML = ''; $('teamList').innerHTML = ''; this.teamEls.clear(); this.subEl.innerHTML = '';
    for (const e of this.markEls.values()) e.remove(); this.markEls.clear(); this.dir.forEach((d) => d.el.remove()); this.dir = []; this.ultWasReady = false; this.recap = []; this.objKey = null;
    const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.deploy);
    if (sim.modeId !== 'ffa') for (const u of mates) {
      const d = el('div', 't-card', '<canvas width="64" height="64"></canvas><div class="t-mid"><div class="tn"></div><div class="tb"><i class="ar"></i><i class="hp"></i></div><div class="tu"><i></i></div></div><div class="t-badges"></div><div class="t-rs"></div>');
      $('teamList').append(d); this.teamEls.set(u.id, { d, c: d.querySelector('canvas'), n: d.querySelector('.tn'), b: d.querySelector('.tb .hp'), a: d.querySelector('.tb .ar'), u: d.querySelector('.tu'), uf: d.querySelector('.tu i'), bd: d.querySelector('.t-badges'), rs: d.querySelector('.t-rs'), hero: null });
    }
    this.minimap.setLevel(sim.level, sim.playerTeam); this.minimap.seen.clear();
    $('minimap').parentElement.hidden = !this.settings.minimap;
    this.buildObjective(sim);
    $('vPlayer').textContent = 'YOU';
  }
  // ---------------------------------------------------------------- announcements and feedback
  banner(text, sub = '', color = '#fff') { const b = $('banner'); b.innerHTML = `<span style="color:${color}">${text}</span>${sub ? `<small>${sub}</small>` : ''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
  popup(text, cls = '', sub = '') { const d = el('div', 'pop ' + cls, text + (sub ? `<small>${sub}</small>` : '')); $('popups').append(d); setTimeout(() => d.remove(), 2600); while ($('popups').children.length > 4) $('popups').firstChild.remove(); }
  hitmark(kind) { const h = $('hitmark'); h.className = 'hud hitmark ' + (kind || ''); h.style.transition = 'none'; h.style.opacity = 1; requestAnimationFrame(() => { h.style.transition = 'opacity .3s'; h.style.opacity = 0; }); }
  feedRow(e) {
    const me = this.sim.player, k = e.killer, v = e.victim, row = el('div', 'f-row' + (v.team !== this.sim.playerTeam || this.sim.modeId === 'ffa' && v !== me ? '' : ' enemy') + (k === me ? ' me' : '') + (v === me ? ' died' : ''));
    const owner = e.deployKill?.deploy?.owner, kn = k ? k.name : (owner ? owner.name + "'s " + e.deployKill.deploy.kind : 'THE STORM'), vn = v.name;
    if (k) { row.append(this.portraits.canvas(k.hero, 40)); row.insertAdjacentHTML('beforeend', badges(k.def, 11)); }
    const t = el('span', '', `<b>${k === me ? 'YOU' : kn}</b>${e.head ? ' <span class="ar head" title="headshot">⌖</span>' : ''} <span class="ar">▸</span> <b>${v === me ? 'YOU' : vn}</b>`);
    row.append(t); row.append(this.portraits.canvas(v.hero, 40));
    $('feed').prepend(row); setTimeout(() => row.remove(), 6200); while ($('feed').children.length > 6) $('feed').lastChild.remove();
  }
  damageDir(src) { const me = this.sim.player; if (!src || !me) return; const d = el('div', 'dmgdir'); $('dmgdirs').append(d); this.dir.push({ el: d, src, t: 0.9 }); requestAnimationFrame(() => { d.style.opacity = 1; }); }
  noteDamage(e) { if (!e.src) return; const t = this.sim.time, r = this.recap.find((x) => x.src === e.src); if (r) { r.amt += e.amt; r.t = t; } else this.recap.push({ src: e.src, amt: e.amt, t }); this.recap = this.recap.filter((x) => t - x.t < 8); }
  heal(e) {
    const me = this.sim.player, o = e.src === me ? this.healOut : this.healIn; o.amt += e.amt; o.t = this.sim.time;
  }
  subtitle({ name, hero, text, ally, pri }) {
    const row = el('div', 'sub' + (ally ? '' : ' foe') + (pri >= 3 ? ' big' : ''));
    if (hero && HERO[hero] && this.portraits.get(hero)) row.append(this.portraits.canvas(hero, 36)); row.insertAdjacentHTML('beforeend', `<b>${name}</b><span>${text}</span>`);
    this.subEl.append(row); setTimeout(() => row.classList.add('out'), 3600); setTimeout(() => row.remove(), 4200); while (this.subEl.children.length > 4) this.subEl.firstChild.remove();
  }
  // ---------------------------------------------------------------- objective bar, one layout per mode
  buildObjective(sim) {
    const m = sim.modeId, bar = $('objbar'); this.objKey = m; this.o = {};
    const pips = (n) => Array.from({ length: n }, () => '<i></i>').join('');
    if (m === 'escort' || m === 'hybrid') {
      const cps = (sim.level.checkpoints || []).map((d) => `<div class="ob-cp" data-d="${d}" style="left:${(d / sim.level.pathLen * 100).toFixed(1)}%"></div>`).join('');
      bar.innerHTML = `<div class="ob-row"><div class="ob-dist atk"><b id="obPushed">0.0</b><small>M</small></div><div class="ob-time" id="obTime"><span>5:00</span><i id="obOT"></i></div><div class="ob-dist def"><b id="obLeft">188</b><small>M</small></div></div>
        <div class="ob-cap" id="obCap" hidden><div class="ob-cap-ring"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" id="obCapRing" cx="50" cy="50" r="42" pathLength="100"/></svg><b id="obCapPct">0%</b></div></div>
        <div class="ob-track" id="obTrack"><div class="ob-fill" id="obFill"></div>${cps}<div class="ob-pay" id="obPay"><span id="obPushers">0</span></div></div><div class="ob-status" id="obStatus"></div>`;
    } else if (m === 'control') {
      bar.innerHTML = `<div class="ob-row ctl"><div class="ctl-side a"><div class="ctl-pips" id="cpA">${pips(2)}</div><b id="ctlA">0%</b></div><div class="ctl-mid"><div class="ob-time" id="obTime"><span>ROUND 1</span><i id="obOT"></i></div><div class="ctl-point" id="ctlPoint"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" id="ctlRing" cx="50" cy="50" r="42" pathLength="100"/></svg><b id="ctlOwner">·</b></div></div><div class="ctl-side d"><b id="ctlD">0%</b><div class="ctl-pips" id="cpD">${pips(2)}</div></div></div>
        <div class="ob-track ctl-track"><div class="ob-fill a" id="ctlFillA"></div><div class="ob-fill d" id="ctlFillD"></div></div><div class="ob-status" id="obStatus"></div>`;
    } else if (m === 'tdm') {
      bar.innerHTML = `<div class="ob-row"><div class="ob-dist atk big"><b id="tdA">0</b></div><div class="ob-time" id="obTime"><span>8:00</span><i id="obOT">FIRST TO ${sim.scoreTarget}</i></div><div class="ob-dist def big"><b id="tdD">0</b></div></div><div class="ob-track"><div class="ob-fill a" id="tdFillA"></div><div class="ob-fill d" id="tdFillD"></div></div><div class="ob-status" id="obStatus"></div>`;
    } else if (m === 'ffa') {
      bar.innerHTML = `<div class="ob-row"><div class="ob-dist atk big"><b id="ffaMe">0</b><small id="ffaRank">1ST</small></div><div class="ob-time" id="obTime"><span>6:00</span><i id="obOT">FIRST TO ${sim.scoreTarget}</i></div></div><div class="ffa-board" id="ffaBoard"></div><div class="ob-status" id="obStatus"></div>`;
    } else {
      bar.innerHTML = `<div class="ob-row"><div class="ob-dist atk"><b id="trKills">0</b><small>TARGETS</small></div><div class="ob-time" id="obTime"><span>RANGE</span><i id="obOT"></i></div><div class="ob-dist def"><b id="trAcc">0</b><small>% ACC</small></div></div><div class="ob-status" id="obStatus">TRAINING RANGE · INFINITE ULTIMATE</div>`;
    }
  }
  updateObjective() {
    const sim = this.sim, m = sim.modeId, me = sim.player, vt = sim.playerTeam, set = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
    const t = sim.state === 'setup' ? Math.ceil(sim.setupT) : sim.timer;
    const timeEl = $('obTime').firstChild;
    if (m === 'escort' || m === 'hybrid') {
      const P = sim.payload, total = sim.total(), capPhase = m === 'hybrid' && !sim.cap.done;
      timeEl.textContent = sim.state === 'setup' ? String(t) : fmtTime(t); $('obTime').classList.toggle('ot', sim.inOvertime); set('obOT', sim.inOvertime ? 'OVERTIME ' + Math.max(0, sim.overtime).toFixed(1) : (sim.state === 'setup' ? 'SETUP' : ''));
      set('obPushed', P.dist.toFixed(1)); set('obLeft', Math.max(0, total - P.dist).toFixed(1));
      const pct = P.dist / total * 100; $('obFill').style.width = pct + '%'; $('obPay').style.left = pct + '%'; $('obPay').classList.toggle('contested', !!P.contested); $('obPay').style.opacity = capPhase ? 0.35 : 1; set('obPushers', P.pushers);
      document.querySelectorAll('.ob-cp').forEach((c, i) => c.classList.toggle('done', P.cp > i));
      $('obCap').hidden = !capPhase; if (capPhase) { const c = sim.cap; $('obCapRing').style.strokeDasharray = `${c.prog * 100} 100`; set('obCapPct', Math.floor(c.prog * 100) + '%'); $('obCap').classList.toggle('contested', !!c.contested); }
      const atk = vt === 0;
      $('obStatus').textContent = sim.state === 'setup' ? (atk ? (capPhase ? 'ATTACK: CAPTURE THE POINT' : 'ATTACK: ESCORT THE PAYLOAD') : 'DEFEND: STOP THEM') : capPhase ? (sim.cap.contested ? 'POINT CONTESTED' : sim.cap.present ? (atk ? 'CAPTURING' : 'ENEMY CAPTURING') : atk ? 'CAPTURE THE POINT' : 'DEFEND THE POINT') : P.contested ? 'PAYLOAD CONTESTED' : P.pushers ? 'PAYLOAD MOVING' : P.defenders && !atk ? 'HOLDING' : '';
      $('obTrack').classList.toggle('flip', false);
    } else if (m === 'control') {
      const c = sim.control, mine = (i) => (vt === 0 ? i : 1 - i);
      timeEl.textContent = 'ROUND ' + sim.round; $('obTime').classList.toggle('ot', !!c.contested); set('obOT', sim.state === 'setup' ? 'SETUP ' + Math.ceil(sim.setupT) : sim.state === 'roundbreak' ? 'ROUND OVER' : c.contested ? 'CONTESTED' : '');
      const a = c.ctl[vt] ?? 0, d = c.ctl[1 - vt] ?? 0; set('ctlA', Math.floor(a) + '%'); set('ctlD', Math.floor(d) + '%'); $('ctlFillA').style.width = a / 2 + '%'; $('ctlFillD').style.width = d / 2 + '%';
      $('ctlRing').style.strokeDasharray = `${c.owner >= 0 ? 100 : c.capProg * 100} 100`; $('ctlRing').style.stroke = c.owner >= 0 ? (c.owner === vt ? '#3a9bff' : '#ff4a52') : c.capTeam >= 0 ? (c.capTeam === vt ? '#3a9bff' : '#ff4a52') : '#fff';
      set('ctlOwner', c.owner < 0 ? '·' : c.owner === vt ? '▲' : '▼'); $('ctlPoint').classList.toggle('contested', !!c.contested);
      $('cpA').children[0].classList.toggle('on', sim.wins[vt] >= 1); $('cpA').children[1].classList.toggle('on', sim.wins[vt] >= 2); $('cpD').children[0].classList.toggle('on', sim.wins[1 - vt] >= 1); $('cpD').children[1].classList.toggle('on', sim.wins[1 - vt] >= 2);
      $('obStatus').textContent = sim.state === 'setup' ? 'TAKE AND HOLD THE POINT' : c.owner < 0 ? 'POINT IS NEUTRAL: CAPTURE IT' : c.owner === vt ? 'YOUR TEAM CONTROLS THE POINT' : 'ENEMY CONTROLS THE POINT';
    } else if (m === 'tdm') {
      timeEl.textContent = sim.state === 'setup' ? String(t) : fmtTime(t); set('tdA', sim.score[vt]); set('tdD', sim.score[1 - vt]); $('tdFillA').style.width = sim.score[vt] / sim.scoreTarget * 50 + '%'; $('tdFillD').style.width = sim.score[1 - vt] / sim.scoreTarget * 50 + '%';
      $('obStatus').textContent = sim.state === 'setup' ? 'FIRST TO ' + sim.scoreTarget + ' ELIMINATIONS' : sim.score[vt] > sim.score[1 - vt] ? 'YOUR TEAM LEADS' : sim.score[vt] < sim.score[1 - vt] ? 'ENEMY TEAM LEADS' : 'TIED';
    } else if (m === 'ffa') {
      timeEl.textContent = sim.state === 'setup' ? String(t) : fmtTime(t);
      const list = sim.units.filter((u) => !u.deploy).sort((a, b) => b.stats.elims - a.stats.elims || a.stats.deaths - b.stats.deaths), rank = list.indexOf(me) + 1;
      set('ffaMe', me.stats.elims); set('ffaRank', rank + ['TH', 'ST', 'ND', 'RD'][rank > 3 ? 0 : rank]);
      const board = $('ffaBoard'), sig = list.slice(0, 4).map((u) => u.id + ':' + u.stats.elims).join('|'); if (board._s !== sig) { board._s = sig; board.innerHTML = list.slice(0, 4).map((u, i) => `<div class="${u === me ? 'me' : ''}"><i>${i + 1}</i>${u === me ? 'YOU' : u.name}<b>${u.stats.elims}</b></div>`).join(''); }
      $('obStatus').textContent = sim.state === 'setup' ? 'EVERY HERO FOR THEMSELVES' : '';
    } else {
      const dummies = sim.units.filter((u) => u.dummy), killed = dummies.filter((u) => !u.alive).length + (me.stats.elims || 0) - dummies.filter((u) => !u.alive).length;
      set('trKills', me.stats.elims); set('trAcc', me.stats.shots ? Math.round(me.stats.hits / me.stats.shots * 100) : 0); void killed;
    }
    const mu = sim.mutator; $('mutBar').hidden = !mu;
    if (mu) { $('mutName').textContent = 'RIFT SURGE: ' + MUTATORS[mu.id].name; $('mutDesc').textContent = MUTATORS[mu.id].desc; $('mutT').textContent = Math.ceil(mu.t) + 's'; }
  }
  // ---------------------------------------------------------------- per-hero resource meter
  resource(me) {
    const s = me.s;
    switch (me.hero) {
      case 'bulwark': return s.barrier ? ['BARRIER', s.barrier.hp / s.barrier.max, s.barrier.up ? '#6fd0ff' : '#ff6a6a'] : null;
      case 'wrecker': return ['POWER BLOCK', (s.pcharge || 0) / 120 + (s.block ? Math.min(0.99, (s.block.stored || 0) / 120) : 0), '#ffb02e'];
      case 'bastille': return s.spun > 0.02 ? ['SPIN-UP', s.spun, '#ffe68a'] : null;
      case 'skyhawk': return ['JETPACK', (s.fuel ?? 100) / 100, '#ff9a3c'];
      case 'vesper': case 'serene': return s.scoped ? ['SCOPE', s.charge || 0, '#6fffe0'] : null;
      case 'shade': return s.beacon ? ['BEACON', s.beacon.t / 20, '#ff3d9a'] : s.hack ? ['HACKING', 1 - s.hack.t / 1.2, '#ff3d9a'] : null;
      case 'siphon': return s.coal ? ['COALESCENCE', s.coal.t / 5, '#d8ff8a'] : null;
      case 'cantor': return s.trans ? ['TRANSCENDENCE', s.trans.t / 6, '#ffe28a'] : s.harmony ? ['HARMONY LINKED', 1, '#7ff0ff'] : null;
      case 'zephyr': return ['AURA · ' + (s.aura || 'heal').toUpperCase(), 1, s.aura === 'speed' ? '#ffb02e' : '#59f0a8'];
      case 'ranger': return s.noon ? ['HIGH NOON', s.noon.t / 4.5, '#ffd36b'] : null;
      case 'halo': return s.beam && s.beam.alive ? ['AEGIS LINK · ' + s.beam.name.toUpperCase(), 1, '#9fe9ff'] : null;
      default: return null;
    }
  }
  // ---------------------------------------------------------------- per-frame
  update(dt, fps) {
    const sim = this.sim, me = sim.player, view = this.view; if (!sim || !me) return;
    if (this.objKey !== sim.modeId) this.buildObjective(sim);
    this.updateObjective();
    // ---- team roster
    for (const [id, r] of this.teamEls) {
      const u = sim.units.find((x) => x.id === id); if (!u) continue;
      if (r.hero !== u.hero) { r.hero = u.hero; this.portraits.paint(r.c, u.hero); r.bd.innerHTML = badges(u.def, 13); }
      r.n.textContent = (u.isPlayer ? 'YOU' : u.name).toUpperCase() + ' · ' + u.def.name; r.d.classList.toggle('dead', !u.alive); r.d.classList.toggle('me', u.isPlayer);
      const tot = u.maxHp + u.maxArmor + 1e-6; r.b.style.width = (u.alive ? clamp(u.hp / tot, 0, 1) * 100 : 0) + '%'; r.a.style.width = (u.alive ? clamp((u.armor + u.shield) / tot, 0, 1) * 100 : 0) + '%';
      const up = u.ult / u.def.ult.cost; r.uf.style.width = up * 100 + '%'; r.u.classList.toggle('rdy', up >= 0.999);
      r.rs.textContent = !u.alive ? Math.max(0, Math.ceil(u.respawnT)) : ''; r.d.classList.toggle('low', u.alive && (u.hp + u.armor) / tot < 0.3);
    }
    // ---- vitals
    if (this.hero !== me.hero) {
      this.hero = me.hero; this.portraits.paint($('vPortrait'), me.hero); $('vHero').textContent = me.def.name; $('vSub').innerHTML = badges(me.def, 15) + `<em>${me.def.sub.toUpperCase()}</em>`;
      for (const [id, slot] of [['abil1', 'a1'], ['abil2', 'a2'], ['abilW2', 'w2']]) drawIcon($(id).querySelector('canvas'), me.hero, slot);
      drawIcon($('ultIcon'), me.hero, 'ult', '#ffd36b'); drawIcon($('wIcon'), me.hero, 'w1', '#ffffff');
      $('wName').textContent = me.def.w1.name.toUpperCase(); $('abilW2').title = me.def.w2.name; $('abil1').title = me.def.a1.name; $('abil2').title = me.def.a2.name; $('ultBtn').title = me.def.ult.name;
      $('abil1').querySelector('kbd').textContent = 'SHIFT'; $('abil2').querySelector('kbd').textContent = 'E';
      const style = this.settings.xhair === 'auto' ? (['bulwark', 'mauler', 'orbit', 'wrecker', 'bastille', 'cinder', 'riftwalker'].includes(me.hero) ? 'circle' : ['vesper', 'serene', 'ranger'].includes(me.hero) ? 'dot' : 'cross') : this.settings.xhair;
      this.xhair.className = 'hud xhair ' + style; this.xhair.style.setProperty('--xc', this.settings.xcolor);
    }
    const maxT = me.maxHp + me.maxArmor, cur = Math.ceil(me.alive ? me.hp + me.armor + me.shield : 0);
    $('vHp').textContent = cur; $('vMax').textContent = '/ ' + maxT;
    const sig = `${Math.ceil(me.hp / 25)}|${Math.ceil(me.armor / 25)}|${Math.ceil(me.shield / 25)}|${maxT}`;
    if (sig !== this.lastSig.hp) {
      this.lastSig.hp = sig; let html = ''; const hpN = Math.ceil(me.hp / 25), arN = Math.ceil(me.armor / 25), shN = Math.ceil(me.shield / 25), hpMax = Math.ceil(me.maxHp / 25), arMax = Math.ceil(me.maxArmor / 25);
      for (let i = 0; i < hpMax; i++) html += `<i class="${i < hpN ? 'hp' : ''}"></i>`; for (let i = 0; i < arMax; i++) html += `<i class="${i < arN ? 'ar' : ''}"></i>`; for (let i = 0; i < shN; i++) html += '<i class="sh"></i>';
      $('vBar').innerHTML = html;
    }
    $('lowhp').style.opacity = me.alive ? clamp(1 - (me.hp + me.armor) / (maxT * 0.4), 0, 0.9) * 0.9 + view.dmgFlash * 0.25 : 0;
    $('whiteout').style.opacity = clamp(view.whiteout, 0, 1);
    // heal feedback: green numbers by the crosshair (healing out) and on the vitals (healing in)
    const ho = this.healOut, hi = this.healIn, tNow = sim.time;
    if (ho.amt > 0 && tNow - ho.t > 0.9) ho.amt = 0; if (hi.amt > 0 && tNow - hi.t > 1.2) hi.amt = 0;
    const hoEl = $('healOut'), hiEl = $('vHeal'); hoEl.textContent = ho.amt > 0 ? '+' + Math.round(ho.amt) : ''; hoEl.style.opacity = ho.amt > 0 ? clamp(1 - (tNow - ho.t) / 0.9, 0.2, 1) : 0; hiEl.textContent = hi.amt > 0 ? '+' + Math.round(hi.amt) : ''; hiEl.style.opacity = hi.amt > 0 ? 1 : 0; $('vitals').classList.toggle('healing', hi.amt > 0);
    // hero resource
    const rs = me.alive ? this.resource(me) : null, rEl = $('vRes'); rEl.hidden = !rs; if (rs) { rEl.firstChild.textContent = rs[0]; rEl.lastChild.firstChild.style.width = clamp(rs[1], 0, 1) * 100 + '%'; rEl.lastChild.firstChild.style.background = rs[2]; }
    // status chips
    const chips = [], st = me.st; for (const k of Object.keys(st)) { const tag = STATUS_TAGS[k]; if (tag && st[k]?.t > 0) chips.push([k, tag, st[k].t]); }
    const sSig = chips.map((c) => c[0] + Math.ceil(c[2])).join(','); if (sSig !== this.lastSig.st) { this.lastSig.st = sSig; $('vStatus').innerHTML = chips.map(([k, [txt, col], t]) => `<span class="chip ${BAD.has(k) ? 'bad' : 'good'}" style="--c:${col}">${txt}<em>${Math.ceil(t)}</em></span>`).join(''); }
    // ---- ammo
    const w = me.def.w1, melee = w.kind === 'melee' || !w.ammo; $('ammo').textContent = melee ? '∞' : Math.ceil(me.ammo); $('ammoMax').textContent = melee ? '' : '/ ' + w.ammo;
    $('wHint').textContent = me.reloadT > 0 ? 'RELOADING' : !melee && me.ammo <= Math.ceil(w.ammo * 0.25) ? 'RELOAD [R]' : me.s.barrier?.up ? 'BARRIER ' + Math.round(me.s.barrier.hp / me.s.barrier.max * 100) + '%' : me.s.lance ? (me.s.lance.ready ? 'FIRE!' : 'CHARGING…') : '';
    // ---- abilities
    const setAbil = (id, cdLeft, cdMax, text, active, locked) => { const a = $(id); a.querySelector('em').style.transform = `scaleY(${cdMax > 0 ? clamp(cdLeft / cdMax, 0, 1) : 0})`; a.querySelector('small').textContent = text; a.classList.toggle('cd', cdLeft > 0.05); a.classList.toggle('use', !!active); a.classList.toggle('locked', !!locked); };
    const d = me.def, silenced = !!st.silenced;
    if (d.a1.charges) setAbil('abil1', me.charges > 0 ? 0 : d.a1.cd - me.chargeT, d.a1.cd, String(me.charges), false, silenced); else setAbil('abil1', me.cd.a1, d.a1.cd, me.cd.a1 > 0.05 ? Math.ceil(me.cd.a1) : '', me.dash && !d.a1.charges, silenced);
    setAbil('abil2', me.cd.a2, d.a2.cd, me.cd.a2 > 0.05 ? Math.ceil(me.cd.a2) : '', false, silenced);
    if (me.hero === 'bulwark' && me.s.barrier) { setAbil('abilW2', me.s.barrier.hp, me.s.barrier.max, '', me.s.barrier.up); $('abilW2').querySelector('em').style.transform = `scaleY(${1 - me.s.barrier.hp / me.s.barrier.max})`; }
    else if (d.w2.cd !== undefined) setAbil('abilW2', me.cd.w2, d.w2.cd, me.cd.w2 > 0.05 ? Math.ceil(me.cd.w2) : '', false, silenced); else setAbil('abilW2', 0, 1, '', me.s.scoped || me.s.block || me.s.bunker || (me.hero === 'halo' && me.in.fire2), false);
    const up = me.ult / d.ult.cost, ready = up >= 0.999;
    $('ultRing').style.strokeDasharray = `${Math.min(100, up * 100)} 100`; $('ultPct').textContent = Math.floor(up * 100); $('ultBtn').classList.toggle('ready', ready); $('ultBtn').classList.toggle('on', !!me.s.ulting || !!me.st.overdrive); $('ultBtn').classList.toggle('locked', silenced);
    if (ready && !this.ultWasReady && me.alive) { this.popup('ULTIMATE READY', 'streak', ''); view.sound?.ultReady(); this.onUltReady?.(); }
    this.ultWasReady = ready && me.alive;
    $('prompt').textContent = ready && me.alive && sim.state === 'live' ? 'PRESS Q — ' + d.ult.name.toUpperCase() : '';
    // ---- crosshair
    const sp = (w.spread || 1) * (me.moving > 1 ? 1 : 0.65), fov = view.camera.fov, px = Math.max(10, Math.tan(sp * Math.PI / 180 * 1.2) / Math.tan(fov / 2) * innerHeight * 0.5 + 8), xh = this.xhair;
    xh.style.width = xh.style.height = (xh.classList.contains('dot') ? 6 : xh.classList.contains('circle') ? Math.max(26, px * 1.4) : xh.classList.contains('none') ? 0 : px) + 'px';
    xh.style.opacity = me.alive && !view.scoped && !(sim.state === 'setup') && view.curMode === 'fps' && !view.replay ? 1 : 0;
    if (me.alive && this.tickN++ % 3 === 0) { const o = sim.eye(me), hit = sim.trace(o, sim.aimDir(me), 120, { team: me.team, skip: me }); xh.classList.toggle('enemy', hit.kind === 'unit'); }
    $('scope').hidden = !view.scoped; if (view.scoped) $('scopeCharge').setAttribute('d', arcPath(me.s.charge || 0));
    // ---- respawn panel (kill cam has its own overlay)
    const dead = !me.alive && sim.state !== 'over' && !view.replay; $('respawn').hidden = !dead || !!this.killcamOn;
    if (dead) {
      const k = me.killedBy; $('rsBy').innerHTML = k ? `${k.name} <small>${k.def.name}</small>` : 'ELIMINATED'; $('rsKillerHp').style.width = k && k.alive ? clamp((k.hp + k.armor) / (k.maxHp + k.maxArmor), 0, 1) * 100 + '%' : '0%'; $('rsT').textContent = me.held ? '—' : Math.max(0, Math.ceil(me.respawnT));
      const sig2 = this.recap.map((r) => r.src.id + ':' + Math.round(r.amt)).join(); if (sig2 !== this.lastSig.recap) { this.lastSig.recap = sig2; $('rsRecap').innerHTML = this.recap.slice().sort((a, b) => b.amt - a.amt).slice(0, 3).map((r) => `<div><span>${r.src.name} · ${r.src.def.name}</span><b>${Math.round(r.amt)}</b></div>`).join(''); }
      const sp2 = view.spectating; $('rsSpec').textContent = sp2 ? 'SPECTATING ' + sp2.name.toUpperCase() + ' · [←/→] SWITCH' : '';
    }
    // ---- damage direction arrows
    for (const dd of this.dir) { dd.t -= dt; if (!dd.src || !dd.src.pos) continue; const ang = wrapAngle(yawTo(me.pos, dd.src.pos) - me.yaw); dd.el.style.transform = `rotate(${(-ang * 180 / Math.PI).toFixed(1)}deg)`; if (dd.t < 0.3) dd.el.style.opacity = 0; }
    this.dir = this.dir.filter((dd) => { if (dd.t <= 0) { dd.el.remove(); return false; } return true; });
    this.updateMarks();
    this.mapT -= dt; if (this.mapT <= 0 && this.settings.minimap) { this.mapT = 0.1; this.minimap.spot(sim, me); this.minimap.draw(sim, me.alive ? me : (view.spectating || me), view); }
    $('fps').textContent = fps ? Math.round(fps) + ' FPS' : '';
  }
  updateMarks() {
    const sim = this.sim, me = sim.player, view = this.view, live = new Set(), cam = view.camera.position, vt = sim.playerTeam, ffa = sim.modeId === 'ffa';
    const mk = (key, cls, html, p, clampEdge = false) => {
      live.add(key); const s = view.project(p); let e = this.markEls.get(key);
      if (!e) { e = el('div'); this.markEls.set(key, e); $('marks').append(e); }
      if (!s || (s.off && !clampEdge)) { e.style.display = 'none'; return; }
      e.style.display = ''; const c = 'mk ' + cls + (s.off ? ' edge' : ''); if (e.className !== c) e.className = c; if (e._h !== html) { e.innerHTML = html; e._h = html; }
      let x = s.x, y = s.y; if (clampEdge) { x = clamp(x, 120, innerWidth - 120); y = clamp(y, 110, innerHeight - 150); if (s.off) { const a = Math.atan2(y - innerHeight / 2, x - innerWidth / 2); x = innerWidth / 2 + Math.cos(a) * Math.min(innerWidth, innerHeight) * 0.38; y = innerHeight / 2 + Math.sin(a) * Math.min(innerWidth, innerHeight) * 0.38; } }
      e.style.left = x + 'px'; e.style.top = y + 'px'; const sc = clamp(14 / Math.max(6, s.w), 0.7, 1.1); e.style.setProperty('--s', sc.toFixed(2));
    };
    const pc = (u) => clamp((u.hp + u.armor) / (u.maxHp + u.maxArmor), 0, 1) * 100;
    for (const u of sim.units) {
      if (u.deploy || u === me || !u.alive) continue;
      const d = v3.dist(u.pos, cam), head = [u.pos[0], u.pos[1] + u.def.height + 0.45, u.pos[2]], mate = u.team === me.team && !ffa;
      if (mate) { if (d < 90) mk('u' + u.id, 'ally' + (u.ult >= u.def.ult.cost ? ' ult' : ''), `<span class="r">${roleSvg(u.def.role, 11, ROLE_COLORS[u.def.role])}</span>${u.name.toUpperCase()}<div class="mhp"><i style="width:${pc(u)}%"></i></div>`, head); }
      else if (u.bounty) mk('u' + u.id, 'enemy bounty', `<span class="dia"></span>★ BOUNTY<div class="mhp"><i style="width:${pc(u)}%"></i></div>`, head);
      else if (u.st.reveal || u.st.marked || (u.hurt[me.id] && sim.time - u.hurt[me.id] < 2)) mk('u' + u.id, 'enemy', `<span class="dia"></span><div class="mhp"><i style="width:${pc(u)}%"></i></div>`, head);
    }
    const P = sim.payload, atk = me.team === 0;
    if (P && P.active !== false) mk('payload', 'obj', `<span class="dia"></span>${atk ? 'ESCORT' : 'DEFEND'}<small>${Math.round(v3.dist2d(P.pos, me.pos))} M</small>`, [P.pos[0], P.pos[1] + 3.2, P.pos[2]], true);
    const pt = sim.level.points?.[0]; if (pt && (sim.control || (sim.cap && !sim.cap.done))) { const own = sim.control ? sim.control.owner : -1, label = own < 0 ? 'CAPTURE' : own === vt ? 'HOLD' : 'RETAKE'; mk('point', 'obj', `<span class="dia"></span>${sim.modeId === 'hybrid' ? (atk ? 'CAPTURE' : 'DEFEND') : label}<small>${Math.round(v3.dist2d(pt.pos, me.pos))} M</small>`, [pt.pos[0], 4.2, pt.pos[2]], true); }
    sim.packs.forEach((p, i) => { if (p.ready && v3.dist2d(p.pos, me.pos) < 30 && me.hp < me.maxHp) mk('p' + i, 'pack', '', [p.pos[0], 1.5, p.pos[2]]); });
    for (const p of sim.pings || []) if (p.team === me.team) { const label = { enemy: 'ENEMY', go: 'GO HERE', objective: 'OBJECTIVE', health: 'HEALTH', help: 'NEEDS HELP', ally: 'ALLY', defend: 'DEFEND' }[p.kind] || 'PING'; mk('ping' + p.id, 'ping ' + p.kind, `<span class="pi" style="--c:${pingColor(p.kind)}"></span>${label}<small>${p.owner.isPlayer ? 'YOU' : p.owner.name.toUpperCase()} · ${Math.round(v3.dist2d(p.pos, me.pos))} M</small>`, [p.pos[0], p.pos[1] + 1.4, p.pos[2]], true); }
    for (const [k, e] of this.markEls) if (!live.has(k)) { e.remove(); this.markEls.delete(k); }
  }
}
function arcPath(f) { if (f <= 0.01) return ''; const r = 80, a0 = -Math.PI / 2 - 0.9, a1 = a0 + 1.8 * clamp(f, 0, 1); const p = (a) => `${(Math.cos(a) * r * 0.9).toFixed(2)},${(Math.sin(a) * r * 0.9).toFixed(2)}`; return `M ${p(a0)} A ${r * 0.9} ${r * 0.9} 0 ${f > 0.55 ? 1 : 0} 1 ${p(a1)}`; }
