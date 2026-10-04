// DOM user interface: portraits rendered by the engine, vector ability icons, the in-match HUD,
// the hero select screen, the hero gallery, the scoreboard and the end-of-match cards.
import * as E from '../../engine/index.js';
import { HEROES, HERO, ROLES, SKINS, TEAM_COLORS } from './heroes.js';
import { buildHero, heroColors } from './models.js';
import { MAP_NAME } from './map.js';
import { fmtTime, clamp, v3, forward, wrapAngle, yawTo } from './util.js';
import { MUTATORS } from './sim.js';

const $ = (id) => document.getElementById(id);
const TEAM_HEX = ['#3a9bff', '#ff4a52'];

// ------------------------------------------------------------------ portraits
export class Portraits {
  constructor(view) { this.view = view; this.cache = new Map(); }
  // Render the hero's head and shoulders with the engine, copy the result into a 2D canvas.
  async generate(onProgress) {
    const v = this.view, r = v.renderer, saved = { ...r.settings };
    Object.assign(r.settings, { adaptiveResolution: false, renderScale: 1, bloom: true, vignette: 0.2, grain: 0, dofAperture: 0, ssr: false });
    const scene = new E.Scene(), env = scene.environment;
    E.applyTimeOfDay(env, 14); Object.assign(env, { fogDensity: 0, shadowRadius: 3, shadowFar: 0, volumetric: 0, ao: true });
    const cam = new E.Camera(); cam.fov = 26 * E.DEG; cam.near = 0.05;
    const key = new E.Light('point', { color: '#fff3e0', intensity: 24, range: 12 }); key.position.set([1.4, 2.6, 2.4]); scene.add(key);
    const rim = new E.Light('point', { color: '#8fb8ff', intensity: 16, range: 12 }); rim.position.set([-1.6, 2.2, -1.2]); scene.add(rim);
    for (const [i, h] of HEROES.entries()) {
      const m = buildHero(h.id, 'default'); m.userData.ring.visible = false; scene.add(m);
      m.userData.armR.setEuler(-30, 0, -6); m.userData.armL.setEuler(-25, 0, 18);
      const s = h.height / 1.8, hy = 1.57 * s; m.setEuler(0, 160, 0);
      cam.position.set([0.12, hy + 0.0, 1.95 * s]); cam.target.set([0, hy - 0.12, 0]);
      env.zenithColor = tint(h.colors.accent, 0.5, 0.2); env.horizonColor = tint(h.colors.primary, 0.55, 0.45); env.skyColor = tint(h.colors.primary, 0.5, 0.35); env.clouds = false;
      r.render(scene, cam, { background: 'sky', shadows: false });
      const c = document.createElement('canvas'); c.width = c.height = 160;
      const g = c.getContext('2d'), W = r.canvas.width, H = r.canvas.height, side = Math.min(W, H) * 0.92;
      g.drawImage(r.canvas, (W - side) / 2, (H - side) / 2, side, side, 0, 0, 160, 160);
      this.cache.set(h.id, c); scene.remove(m);
      onProgress?.((i + 1) / HEROES.length);
      await new Promise((res) => setTimeout(res, 0));
    }
    Object.assign(r.settings, saved);
  }
  get(id) { return this.cache.get(id); }
  // copy into a fresh canvas element (so each place in the UI has its own)
  canvas(id, size = 64) {
    const c = document.createElement('canvas'); c.width = c.height = size; const src = this.cache.get(id);
    if (src) c.getContext('2d').drawImage(src, 0, 0, size, size); return c;
  }
  paint(c, id) { const src = this.cache.get(id); if (!src) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); }
}
function tint(hex, mix, bright) { const c = E.hexToRGB(hex); return [c[0] * mix + bright, c[1] * mix + bright, c[2] * mix + bright]; }

// ------------------------------------------------------------------ ability icons
const ICONS = {
  bulwark: { w1: 'cannon', w2: 'shield', a1: 'charge', a2: 'shout', ult: 'dome' },
  mauler: { w1: 'scatter', w2: 'hook', a1: 'leap', a2: 'brace', ult: 'meteor' },
  orbit: { w1: 'orb', w2: 'pull', a1: 'hover', a2: 'bubble', ult: 'hole' },
  sabre: { w1: 'rifle', w2: 'rockets', a1: 'slide', a2: 'syringe', ult: 'overdrive' },
  cinder: { w1: 'flame', w2: 'burst', a1: 'step', a2: 'wall', ult: 'inferno' },
  vesper: { w1: 'rail', w2: 'scope', a1: 'grapple', a2: 'sonar', ult: 'lance' },
  flicker: { w1: 'pistols', w2: 'blade', a1: 'blink', a2: 'rewind', ult: 'bomb' },
  halo: { w1: 'pistol', w2: 'beam', a1: 'wing', a2: 'sanct', ult: 'resurge' },
  pylon: { w1: 'rivet', w2: 'dart', a1: 'pylon', a2: 'turret', ult: 'grid' },
  zephyr: { w1: 'sonic', w2: 'note', a1: 'pulse', a2: 'wdash', ult: 'barrier' },
};
const GLYPH = {
  circle: (g) => { g.beginPath(); g.arc(48, 48, 22, 0, 7); g.stroke(); },
  cannon: (g) => { g.strokeRect(18, 38, 40, 20); g.fillRect(58, 42, 22, 12); g.beginPath(); g.moveTo(80, 48); g.lineTo(90, 48); g.stroke(); },
  scatter: (g) => { for (const [x, y] of [[30, 48], [48, 34], [48, 62], [66, 48], [66, 28], [66, 68]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } },
  shield: (g) => { g.beginPath(); g.moveTo(48, 14); g.lineTo(78, 26); g.lineTo(74, 56); g.quadraticCurveTo(66, 78, 48, 86); g.quadraticCurveTo(30, 78, 22, 56); g.lineTo(18, 26); g.closePath(); g.stroke(); g.globalAlpha = 0.35; g.fill(); },
  charge: (g) => { g.beginPath(); g.moveTo(14, 30); g.lineTo(54, 48); g.lineTo(14, 66); g.stroke(); g.beginPath(); g.moveTo(40, 30); g.lineTo(80, 48); g.lineTo(40, 66); g.stroke(); },
  shout: (g) => { for (const r of [14, 26, 38]) { g.beginPath(); g.arc(48, 48, r, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(48, 48, r, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); } g.beginPath(); g.arc(48, 48, 6, 0, 7); g.fill(); },
  dome: (g) => { g.beginPath(); g.arc(48, 62, 34, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(14, 62); g.lineTo(82, 62); g.stroke(); g.beginPath(); g.arc(48, 62, 14, Math.PI, 0); g.fill(); },
  hook: (g) => { g.beginPath(); g.moveTo(20, 20); g.lineTo(48, 48); g.stroke(); g.beginPath(); g.arc(56, 56, 16, Math.PI, Math.PI * 2.6); g.stroke(); g.beginPath(); g.moveTo(72, 60); g.lineTo(80, 70); g.lineTo(66, 68); g.fill(); },
  leap: (g) => { g.beginPath(); g.moveTo(16, 74); g.quadraticCurveTo(46, 6, 80, 70); g.stroke(); g.beginPath(); g.moveTo(80, 70); g.lineTo(68, 66); g.lineTo(78, 56); g.fill(); },
  brace: (g) => { g.strokeRect(24, 24, 48, 48); g.beginPath(); g.moveTo(24, 24); g.lineTo(72, 72); g.moveTo(72, 24); g.lineTo(24, 72); g.stroke(); },
  meteor: (g) => { g.beginPath(); g.arc(60, 60, 14, 0, 7); g.fill(); g.beginPath(); g.moveTo(10, 10); g.lineTo(52, 52); g.moveTo(26, 8); g.lineTo(54, 40); g.moveTo(8, 26); g.lineTo(40, 54); g.stroke(); },
  orb: (g) => { g.beginPath(); g.arc(48, 48, 14, 0, 7); g.fill(); g.beginPath(); g.ellipse(48, 48, 34, 12, -0.5, 0, 7); g.stroke(); },
  pull: (g) => { for (const a of [0, 1.2, 2.4, 3.6, 4.8]) { g.beginPath(); g.moveTo(48 + Math.cos(a) * 36, 48 + Math.sin(a) * 36); g.lineTo(48 + Math.cos(a) * 12, 48 + Math.sin(a) * 12); g.stroke(); } g.beginPath(); g.arc(48, 48, 6, 0, 7); g.fill(); },
  hover: (g) => { g.beginPath(); g.moveTo(48, 12); g.lineTo(70, 40); g.lineTo(56, 40); g.lineTo(56, 70); g.lineTo(40, 70); g.lineTo(40, 40); g.lineTo(26, 40); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(30, 82); g.lineTo(66, 82); g.stroke(); },
  bubble: (g) => { g.beginPath(); g.arc(48, 48, 30, 0, 7); g.stroke(); g.globalAlpha = 0.3; g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(36, 36, 6, 0, 7); g.fill(); },
  hole: (g) => { g.beginPath(); g.arc(48, 48, 10, 0, 7); g.fill(); for (const r of [20, 30, 40]) { g.beginPath(); g.arc(48, 48, r, 0.4, 4.4); g.stroke(); } },
  rifle: (g) => { g.fillRect(14, 42, 56, 10); g.fillRect(70, 45, 16, 4); g.fillRect(28, 52, 8, 16); g.fillRect(44, 34, 14, 8); },
  rockets: (g) => { for (const y of [28, 48, 68]) { g.beginPath(); g.moveTo(16, y); g.lineTo(62, y); g.lineTo(76, y + 0); g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(62, y - 7); g.lineTo(80, y); g.lineTo(62, y + 7); g.fill(); } },
  slide: (g) => { g.beginPath(); g.moveTo(14, 30); g.lineTo(80, 30); g.moveTo(24, 48); g.lineTo(80, 48); g.moveTo(34, 66); g.lineTo(80, 66); g.stroke(); g.beginPath(); g.moveTo(80, 18); g.lineTo(92, 48); g.lineTo(80, 78); g.fill(); },
  syringe: (g) => { g.save(); g.translate(48, 48); g.rotate(-0.8); g.strokeRect(-24, -8, 40, 16); g.fillRect(16, -2, 18, 4); g.fillRect(-34, -10, 6, 20); g.fillRect(-12, -4, 18, 8); g.restore(); },
  overdrive: (g) => { g.beginPath(); g.arc(48, 48, 30, 0, 7); g.stroke(); g.beginPath(); g.moveTo(48, 12); g.lineTo(48, 84); g.moveTo(12, 48); g.lineTo(84, 48); g.stroke(); g.beginPath(); g.arc(48, 48, 8, 0, 7); g.fill(); },
  flame: (g) => { g.beginPath(); g.moveTo(48, 12); g.quadraticCurveTo(80, 42, 62, 66); g.quadraticCurveTo(54, 82, 48, 84); g.quadraticCurveTo(26, 78, 28, 56); g.quadraticCurveTo(30, 40, 40, 36); g.quadraticCurveTo(40, 24, 48, 12); g.fill(); },
  burst: (g) => { for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; g.beginPath(); g.moveTo(24, 48); g.lineTo(24 + Math.cos(a) * 58, 48 + Math.sin(a) * 58); g.stroke(); } g.beginPath(); g.arc(24, 48, 8, 0, 7); g.fill(); },
  step: (g) => { g.beginPath(); g.arc(24, 48, 8, 0, 7); g.fill(); g.setLineDash([6, 6]); g.beginPath(); g.moveTo(32, 48); g.lineTo(64, 48); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(74, 48, 12, 0, 7); g.stroke(); },
  wall: (g) => { for (const x of [18, 34, 50, 66]) { g.beginPath(); g.moveTo(x, 78); g.quadraticCurveTo(x + 12, 52, x + 6, 22); g.quadraticCurveTo(x + 22, 48, x + 14, 78); g.fill(); } },
  inferno: (g) => { GLYPH.flame(g); g.globalAlpha = 0.6; g.beginPath(); g.arc(48, 70, 34, 0, 7); g.stroke(); },
  rail: (g) => { g.fillRect(10, 44, 70, 8); g.fillRect(80, 46, 10, 4); g.beginPath(); g.moveTo(20, 30); g.lineTo(60, 30); g.moveTo(20, 66); g.lineTo(60, 66); g.stroke(); },
  scope: (g) => { g.beginPath(); g.arc(48, 48, 30, 0, 7); g.stroke(); g.beginPath(); g.moveTo(48, 10); g.lineTo(48, 86); g.moveTo(10, 48); g.lineTo(86, 48); g.stroke(); g.beginPath(); g.arc(48, 48, 5, 0, 7); g.fill(); },
  grapple: (g) => { g.beginPath(); g.moveTo(16, 80); g.quadraticCurveTo(40, 40, 70, 28); g.stroke(); g.beginPath(); g.moveTo(66, 14); g.lineTo(86, 28); g.lineTo(66, 44); g.closePath(); g.fill(); },
  sonar: (g) => { g.beginPath(); g.arc(48, 48, 8, 0, 7); g.fill(); for (const r of [20, 32, 44]) { g.beginPath(); g.arc(48, 48, r, 0, 7); g.stroke(); } },
  lance: (g) => { g.lineWidth = 8; g.beginPath(); g.moveTo(8, 88); g.lineTo(86, 10); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(22, 88); g.lineTo(88, 22); g.moveTo(8, 74); g.lineTo(74, 8); g.stroke(); },
  pistols: (g) => { for (const y of [34, 58]) { g.fillRect(16, y, 34, 10); g.fillRect(22, y + 10, 8, 14); g.fillRect(50, y + 3, 24, 4); } },
  blade: (g) => { g.beginPath(); g.moveTo(16, 80); g.lineTo(80, 16); g.lineTo(72, 40); g.lineTo(40, 72); g.closePath(); g.fill(); g.fillRect(14, 70, 18, 8); },
  blink: (g) => { g.beginPath(); g.arc(22, 48, 10, 0, 7); g.stroke(); g.beginPath(); g.moveTo(36, 48); g.lineTo(60, 48); g.stroke(); g.beginPath(); g.moveTo(54, 36); g.lineTo(70, 48); g.lineTo(54, 60); g.stroke(); g.beginPath(); g.arc(78, 48, 10, 0, 7); g.fill(); },
  rewind: (g) => { g.beginPath(); g.arc(48, 48, 28, 0.5, 5.4); g.stroke(); g.beginPath(); g.moveTo(66, 16); g.lineTo(60, 36); g.lineTo(80, 34); g.fill(); g.beginPath(); g.moveTo(48, 32); g.lineTo(48, 48); g.lineTo(60, 54); g.stroke(); },
  bomb: (g) => { g.beginPath(); g.arc(46, 54, 22, 0, 7); g.fill(); g.beginPath(); g.moveTo(58, 36); g.quadraticCurveTo(70, 22, 80, 24); g.stroke(); g.beginPath(); g.arc(82, 22, 5, 0, 7); g.fill(); },
  pistol: (g) => { g.fillRect(18, 34, 46, 12); g.fillRect(24, 46, 12, 22); g.fillRect(64, 37, 18, 6); },
  beam: (g) => { g.beginPath(); g.moveTo(14, 70); g.bezierCurveTo(30, 20, 60, 90, 82, 30); g.lineWidth = 6; g.stroke(); g.beginPath(); g.arc(14, 70, 7, 0, 7); g.fill(); g.beginPath(); g.moveTo(74, 24); g.lineTo(88, 30); g.lineTo(78, 42); g.fill(); },
  wing: (g) => { g.beginPath(); g.moveTo(48, 70); g.quadraticCurveTo(14, 60, 10, 20); g.quadraticCurveTo(34, 34, 48, 50); g.quadraticCurveTo(62, 34, 86, 20); g.quadraticCurveTo(82, 60, 48, 70); g.fill(); },
  sanct: (g) => { g.beginPath(); g.arc(48, 48, 34, 0, 7); g.stroke(); g.beginPath(); g.moveTo(40, 22); g.lineTo(56, 22); g.lineTo(56, 40); g.lineTo(74, 40); g.lineTo(74, 56); g.lineTo(56, 56); g.lineTo(56, 74); g.lineTo(40, 74); g.lineTo(40, 56); g.lineTo(22, 56); g.lineTo(22, 40); g.lineTo(40, 40); g.closePath(); g.fill(); },
  resurge: (g) => { GLYPH.wing(g); g.beginPath(); g.arc(48, 14, 8, 0, 7); g.stroke(); },
  rivet: (g) => { g.fillRect(14, 38, 44, 14); g.fillRect(58, 42, 22, 6); g.fillRect(22, 52, 10, 18); for (const x of [22, 36, 50]) { g.beginPath(); g.arc(x, 45, 2, 0, 7); g.fillStyle = '#000'; g.fill(); g.fillStyle = '#fff'; } },
  dart: (g) => { g.beginPath(); g.moveTo(14, 80); g.lineTo(74, 22); g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(66, 10); g.lineTo(86, 14); g.lineTo(82, 34); g.fill(); g.lineWidth = 3; g.strokeRect(20, 52, 18, 18); },
  pylon: (g) => { g.fillRect(36, 30, 24, 46); g.beginPath(); g.arc(48, 24, 14, 0, 7); g.fill(); g.fillRect(24, 76, 48, 8); },
  turret: (g) => { g.fillRect(26, 42, 40, 22); g.fillRect(66, 46, 22, 5); g.fillRect(66, 56, 22, 5); g.beginPath(); g.moveTo(34, 64); g.lineTo(22, 86); g.moveTo(58, 64); g.lineTo(70, 86); g.stroke(); },
  grid: (g) => { for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(20 + i * 18, 18); g.lineTo(20 + i * 18, 78); g.moveTo(18, 20 + i * 18); g.lineTo(78, 20 + i * 18); g.stroke(); } g.beginPath(); g.arc(48, 48, 8, 0, 7); g.fill(); },
  sonic: (g) => { g.beginPath(); g.moveTo(14, 38); g.lineTo(32, 38); g.lineTo(52, 22); g.lineTo(52, 74); g.lineTo(32, 58); g.lineTo(14, 58); g.closePath(); g.fill(); for (const r of [16, 28]) { g.beginPath(); g.arc(52, 48, r, -0.8, 0.8); g.stroke(); } },
  note: (g) => { g.beginPath(); g.arc(34, 68, 12, 0, 7); g.fill(); g.fillRect(44, 18, 6, 52); g.beginPath(); g.moveTo(50, 18); g.quadraticCurveTo(76, 24, 74, 48); g.lineWidth = 6; g.stroke(); },
  pulse: (g) => { g.beginPath(); g.arc(20, 48, 8, 0, 7); g.fill(); for (const r of [22, 40, 58]) { g.beginPath(); g.arc(20, 48, r, -0.7, 0.7); g.stroke(); } },
  wdash: (g) => { GLYPH.slide(g); },
  barrier: (g) => { for (const r of [14, 26, 38]) { g.beginPath(); g.arc(48, 48, r, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(48, 36); g.lineTo(56, 52); g.lineTo(40, 52); g.closePath(); g.fill(); },
};
export function drawIcon(canvas, heroId, slot, color = '#fff') {
  const g = canvas.getContext('2d'), kind = ICONS[heroId]?.[slot] || 'circle';
  g.clearRect(0, 0, canvas.width, canvas.height); g.save(); g.scale(canvas.width / 96, canvas.height / 96);
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 5; g.lineCap = g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
  (GLYPH[kind] || GLYPH.circle)(g); g.restore();
}

// ------------------------------------------------------------------ HUD
export class Hud {
  constructor(view, portraits) {
    this.view = view; this.portraits = portraits; this.el = {}; this.lastSig = {}; this.dir = []; this.feedN = 0;
    this.xhair = $('xhair'); this.markEls = new Map(); this.teamEls = new Map(); this.hero = null; this.hitTimer = 0; this.ultWasReady = false;
    this.bannerT = 0; this.tickN = -1;
  }
  reset(sim) {
    this.sim = sim; this.hero = null; $('feed').innerHTML = ''; $('popups').innerHTML = ''; $('teamList').innerHTML = ''; this.teamEls.clear();
    for (const el of this.markEls.values()) el.remove(); this.markEls.clear(); this.dir.forEach((d) => d.el.remove()); this.dir = []; this.ultWasReady = false;
    const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.deploy);
    for (const u of mates) {
      const d = document.createElement('div'); d.className = 't-card'; d.innerHTML = '<canvas width="64" height="64"></canvas><div><div class="tn"></div><div class="tb"><i></i></div><div class="tu"><i></i></div></div>';
      $('teamList').append(d); this.teamEls.set(u.id, { d, c: d.querySelector('canvas'), n: d.querySelector('.tn'), b: d.querySelector('.tb i'), u: d.querySelector('.tu'), uf: d.querySelector('.tu i'), hero: null });
    }
    $('vPlayer').textContent = 'YOU';
  }
  banner(text, sub = '', color = '#fff') {
    const b = $('banner'); b.innerHTML = `<span style="color:${color}">${text}</span>${sub ? `<small>${sub}</small>` : ''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  popup(text, cls = '', sub = '') { const d = document.createElement('div'); d.className = 'pop ' + cls; d.innerHTML = text + (sub ? `<small>${sub}</small>` : ''); $('popups').append(d); setTimeout(() => d.remove(), 2600); while ($('popups').children.length > 4) $('popups').firstChild.remove(); }
  hitmark(kind) { const h = $('hitmark'); h.className = 'hud hitmark ' + (kind || ''); h.style.transition = 'none'; h.style.opacity = 1; requestAnimationFrame(() => { h.style.transition = 'opacity .3s'; h.style.opacity = 0; }); }
  feedRow(e) {
    const me = this.sim.player, row = document.createElement('div'), k = e.killer, v = e.victim;
    row.className = 'f-row' + (v.team !== this.sim.playerTeam ? '' : ' enemy') + (k === me ? ' me' : '');
    const kn = k ? k.name : (e.deployKill ? HERO[e.deployKill.deploy.owner.hero].name + ' SENTRY' : 'THE STORM'), vn = v.name;
    row.innerHTML = '';
    if (k) row.append(this.portraits.canvas(k.hero, 40));
    const t = document.createElement('span'); t.innerHTML = `<b>${kn}</b>${e.head ? ' <span class="ar" title="headshot">⌖</span>' : ''} <span class="ar">▸</span> <b>${vn}</b>`;
    row.append(t); row.append(this.portraits.canvas(v.hero, 40));
    $('feed').prepend(row); setTimeout(() => row.remove(), 6200); while ($('feed').children.length > 6) $('feed').lastChild.remove();
  }
  damageDir(src) {
    const me = this.sim.player; if (!src || !me) return;
    const el = document.createElement('div'); el.className = 'dmgdir'; $('dmgdirs').append(el); const d = { el, src, t: 0.9 }; this.dir.push(d);
    requestAnimationFrame(() => { el.style.opacity = 1; });
  }
  update(dt, fps) {
    const sim = this.sim, me = sim.player, view = this.view; if (!sim || !me) return;
    const P = sim.payload, total = sim.total();
    // ---- objective bar
    const t = sim.state === 'setup' ? Math.ceil(sim.setupT) : sim.timer;
    $('obTime').firstChild.textContent = sim.state === 'setup' ? String(t) : fmtTime(t);
    $('obTime').classList.toggle('ot', sim.inOvertime); $('obOT').textContent = sim.inOvertime ? 'OVERTIME ' + Math.max(0, sim.overtime).toFixed(1) : (sim.state === 'setup' ? 'SETUP' : '');
    $('obPushed').textContent = P.dist.toFixed(1); $('obLeft').textContent = Math.max(0, total - P.dist).toFixed(1);
    const pct = P.dist / total * 100; $('obFill').style.width = pct + '%'; $('obPay').style.left = pct + '%'; $('obPay').classList.toggle('contested', P.contested);
    $('obPushers').textContent = P.pushers; document.querySelectorAll('.ob-cp').forEach((c, i) => c.classList.toggle('done', P.cp > i));
    const atk = sim.playerTeam === 0;
    $('obStatus').textContent = sim.state === 'setup' ? (atk ? 'ATTACK: ESCORT THE PAYLOAD' : 'DEFEND: STOP THE PAYLOAD') : P.contested ? 'PAYLOAD CONTESTED' : P.pushers ? 'PAYLOAD MOVING' : P.defenders && !atk ? 'HOLDING' : '';
    // ---- mutator
    const mu = sim.mutator; $('mutBar').hidden = !mu;
    if (mu) { $('mutName').textContent = 'RIFT SURGE: ' + MUTATORS[mu.id].name; $('mutDesc').textContent = MUTATORS[mu.id].desc; $('mutT').textContent = Math.ceil(mu.t) + 's'; }
    // ---- team
    for (const [id, r] of this.teamEls) {
      const u = sim.units.find((x) => x.id === id); if (!u) continue;
      if (r.hero !== u.hero) { r.hero = u.hero; this.portraits.paint(r.c, u.hero); }
      r.n.textContent = (u.isPlayer ? 'YOU' : u.name).toUpperCase() + ' · ' + u.def.name; r.d.classList.toggle('dead', !u.alive); r.d.classList.toggle('me', u.isPlayer);
      r.b.style.width = (u.alive ? clamp((u.hp + u.armor) / (u.maxHp + u.maxArmor), 0, 1) * 100 : 0) + '%';
      const up = u.ult / u.def.ult.cost; r.uf.style.width = up * 100 + '%'; r.u.classList.toggle('rdy', up >= 0.999);
    }
    // ---- vitals
    if (this.hero !== me.hero) {
      this.hero = me.hero; this.portraits.paint($('vPortrait'), me.hero); $('vHero').textContent = me.def.name;
      for (const [id, slot] of [['abil1', 'a1'], ['abil2', 'a2'], ['abilW2', 'w2']]) drawIcon($(id).querySelector('canvas'), me.hero, slot);
      drawIcon($('ultIcon'), me.hero, 'ult', '#ffd36b');
      $('wName').textContent = me.def.w1.name.toUpperCase(); $('abilW2').title = me.def.w2.name; $('abil1').title = me.def.a1.name; $('abil2').title = me.def.a2.name; $('ultBtn').title = me.def.ult.name;
      this.xhair.className = 'hud xhair ' + (['bulwark', 'mauler', 'orbit', 'cinder'].includes(me.hero) ? 'circle' : me.hero === 'vesper' ? 'dot' : '');
    }
    const maxT = me.maxHp + me.maxArmor, cur = Math.ceil(me.alive ? me.hp + me.armor + me.shield : 0);
    $('vHp').textContent = cur; $('vMax').textContent = '/ ' + maxT;
    const sig = `${Math.ceil(me.hp / 25)}|${Math.ceil(me.armor / 25)}|${Math.ceil(me.shield / 25)}|${maxT}`;
    if (sig !== this.lastSig.hp) {
      this.lastSig.hp = sig; const segs = Math.ceil(maxT / 25); let html = '';
      const hpN = Math.ceil(me.hp / 25), arN = Math.ceil(me.armor / 25), shN = Math.ceil(me.shield / 25), hpMax = Math.ceil(me.maxHp / 25), arMax = Math.ceil(me.maxArmor / 25);
      for (let i = 0; i < hpMax; i++) html += `<i class="${i < hpN ? 'hp' : ''}"></i>`; for (let i = 0; i < arMax; i++) html += `<i class="${i < arN ? 'ar' : ''}"></i>`; for (let i = 0; i < shN; i++) html += '<i class="sh"></i>';
      $('vBar').innerHTML = html;
    }
    $('lowhp').style.opacity = me.alive ? clamp(1 - (me.hp + me.armor) / (maxT * 0.4), 0, 0.9) * 0.9 + view.dmgFlash * 0.25 : 0;
    // ---- ammo
    const w = me.def.w1; $('ammo').textContent = me.ammo; $('ammoMax').textContent = '/ ' + w.ammo;
    $('wHint').textContent = me.reloadT > 0 ? 'RELOADING' : me.ammo <= Math.ceil(w.ammo * 0.25) ? 'RELOAD [R]' : me.hero === 'bulwark' && me.s.barrier ? 'BARRIER ' + Math.round(me.s.barrier.hp / me.s.barrier.max * 100) + '%' : me.hero === 'vesper' && me.s.lance ? (me.s.lance.ready ? 'FIRE!' : 'CHARGING…') : me.hero === 'zephyr' ? 'AURA: ' + (me.s.aura || 'heal').toUpperCase() : '';
    // ---- abilities
    const setAbil = (id, cdLeft, cdMax, text, active) => { const a = $(id); a.querySelector('em').style.transform = `scaleY(${cdMax > 0 ? clamp(cdLeft / cdMax, 0, 1) : 0})`; a.querySelector('small').textContent = text; a.classList.toggle('cd', cdLeft > 0.05); a.classList.toggle('use', !!active); };
    const d = me.def;
    if (d.a1.charges) setAbil('abil1', me.charges > 0 ? 0 : d.a1.cd - me.chargeT, d.a1.cd, String(me.charges), false); else setAbil('abil1', me.cd.a1, d.a1.cd, me.cd.a1 > 0.05 ? Math.ceil(me.cd.a1) : '', me.dash && !d.a1.charges);
    setAbil('abil2', me.cd.a2, d.a2.cd, me.cd.a2 > 0.05 ? Math.ceil(me.cd.a2) : '', false);
    if (me.hero === 'bulwark' && me.s.barrier) setAbil('abilW2', me.s.barrier.hp, me.s.barrier.max, '', me.s.barrier.up), $('abilW2').querySelector('em').style.transform = `scaleY(${1 - me.s.barrier.hp / me.s.barrier.max})`;
    else if (d.w2.cd !== undefined) setAbil('abilW2', me.cd.w2, d.w2.cd, me.cd.w2 > 0.05 ? Math.ceil(me.cd.w2) : '', false);
    else setAbil('abilW2', 0, 1, '', me.s.scoped || (me.hero === 'halo' && me.in.fire2));
    $('abilW2').hidden = false;
    const up = me.ult / d.ult.cost, ready = up >= 0.999;
    $('ultRing').style.strokeDasharray = `${Math.min(100, up * 100)} 100`; $('ultPct').textContent = Math.floor(up * 100); $('ultBtn').classList.toggle('ready', ready); $('ultBtn').classList.toggle('on', !!me.s.ulting || !!me.st.overdrive);
    if (ready && !this.ultWasReady && me.alive) { this.popup('ULTIMATE READY', 'streak', ''); view.sound?.ultReady(); }
    this.ultWasReady = ready && me.alive;
    $('prompt').textContent = ready && me.alive && sim.state === 'live' ? 'PRESS Q — ' + d.ult.name.toUpperCase() : '';
    // ---- crosshair
    const sp = (w.spread || 1) * (me.moving > 1 ? 1 : 0.65), fov = view.camera.fov, px = Math.max(10, Math.tan(sp * Math.PI / 180 * 1.2) / Math.tan(fov / 2) * innerHeight * 0.5 + 8);
    this.xhair.style.width = this.xhair.style.height = (this.xhair.classList.contains('dot') ? 6 : this.xhair.classList.contains('circle') ? Math.max(26, px * 1.4) : px) + 'px';
    this.xhair.style.opacity = me.alive && !view.scoped && !(sim.state === 'setup') ? 1 : 0;
    if (me.alive && this.tickN++ % 3 === 0) { const o = sim.eye(me), hit = sim.trace(o, sim.aimDir(me), 120, { team: me.team, skip: me }); this.xhair.classList.toggle('enemy', hit.kind === 'unit'); }
    $('scope').hidden = !view.scoped; if (view.scoped) $('scopeCharge').setAttribute('d', arcPath(me.s.charge || 0));
    // ---- respawn panel
    const dead = !me.alive && sim.state !== 'over'; $('respawn').hidden = !dead;
    if (dead) { const k = me.killedBy; $('rsBy').textContent = k ? `${k.name} · ${k.def.name}` : 'ELIMINATED'; $('rsKillerHp').style.width = k && k.alive ? clamp((k.hp + k.armor) / (k.maxHp + k.maxArmor), 0, 1) * 100 + '%' : '0%'; $('rsT').textContent = me.held ? '—' : Math.max(0, Math.ceil(me.respawnT)); }
    // ---- damage direction arrows
    const cam = view.camera.position;
    for (const dd of this.dir) {
      dd.t -= dt; if (!dd.src || !dd.src.pos) continue;
      const ang = wrapAngle(yawTo(me.pos, dd.src.pos) - me.yaw); dd.el.style.transform = `rotate(${(-ang * 180 / Math.PI).toFixed(1)}deg)`; if (dd.t < 0.3) dd.el.style.opacity = 0;
    }
    this.dir = this.dir.filter((dd) => { if (dd.t <= 0) { dd.el.remove(); return false; } return true; });
    // ---- world markers
    this.updateMarks();
    $('fps').textContent = fps ? Math.round(fps) + ' FPS' : '';
  }
  updateMarks() {
    const sim = this.sim, me = sim.player, view = this.view, live = new Set(), cam = view.camera.position;
    const mk = (key, cls, html, p) => {
      live.add(key); const s = view.project(p); let el = this.markEls.get(key);
      if (!el) { el = document.createElement('div'); this.markEls.set(key, el); $('marks').append(el); }
      if (!s || (s.off && !cls.includes('obj'))) { el.style.display = 'none'; return; }
      el.style.display = ''; el.className = 'mk ' + cls; if (el._h !== html) { el.innerHTML = html; el._h = html; }
      let x = s.x, y = s.y; if (cls.includes('obj')) { x = clamp(x, 280, innerWidth - 120); y = clamp(y, 110, innerHeight - 150); }
      el.style.left = x + 'px'; el.style.top = y + 'px';
    };
    for (const u of sim.units) {
      if (u.deploy || u === me || !u.alive) continue;
      const d = v3.dist(u.pos, cam), head = [u.pos[0], u.pos[1] + u.def.height + 0.45, u.pos[2]];
      if (u.team === me.team) { if (d < 80) mk('u' + u.id, 'ally' + (u.ult >= u.def.ult.cost ? ' ult' : ''), `${u.name.toUpperCase()}<div class="mhp"><i style="width:${clamp((u.hp + u.armor) / (u.maxHp + u.maxArmor), 0, 1) * 100}%"></i></div>`, head); }
      else if (u.st.reveal || (u.hurt[me.id] && sim.time - u.hurt[me.id] < 2)) mk('u' + u.id, 'enemy', `<span class="dia"></span><div class="mhp"><i style="width:${clamp((u.hp + u.armor) / (u.maxHp + u.maxArmor), 0, 1) * 100}%"></i></div>`, head);
    }
    // the payload
    const P = sim.payload, atk = me.team === 0, pd = v3.dist2d(P.pos, me.pos);
    if (me.alive || true) mk('payload', 'obj', `<span class="dia"></span>${atk ? 'ESCORT' : 'DEFEND'}<small>${Math.round(pd)} M</small>`, [P.pos[0], P.pos[1] + 3.2, P.pos[2]]);
    sim.packs.forEach((p, i) => { if (p.ready && v3.dist2d(p.pos, me.pos) < 30 && me.hp < me.maxHp) mk('p' + i, 'pack', '', [p.pos[0], 1.5, p.pos[2]]); });
    for (const [k, el] of this.markEls) if (!live.has(k)) { el.remove(); this.markEls.delete(k); }
  }
}
function arcPath(f) { if (f <= 0.01) return ''; const r = 80, a0 = -Math.PI / 2 - 0.9, a1 = a0 + 1.8 * clamp(f, 0, 1); const p = (a) => `${(Math.cos(a) * r * 0.9).toFixed(2)},${(Math.sin(a) * r * 0.9).toFixed(2)}`; return `M ${p(a0)} A ${r * 0.9} ${r * 0.9} 0 ${f > 0.55 ? 1 : 0} 1 ${p(a1)}`; }

// ------------------------------------------------------------------ hero select
export class SelectScreen {
  constructor(view, portraits, sfx) { this.view = view; this.portraits = portraits; this.sfx = sfx; this.sel = 'sabre'; this.open_ = false; this.tiles = new Map(); this.buildTiles(); }
  buildTiles() {
    const roles = $('selRoles'); roles.innerHTML = '';
    for (const role of ['tank', 'damage', 'support']) {
      const g = document.createElement('div'); g.className = 'r-group'; g.innerHTML = `<div class="rbadge ${role}"></div>`; const tiles = document.createElement('div'); tiles.className = 'r-tiles';
      for (const h of HEROES.filter((x) => x.role === role)) {
        const b = document.createElement('button'); b.className = 'h-tile'; b.type = 'button'; b.dataset.name = h.name; b.title = h.name; b.append(this.portraits.canvas(h.id, 96));
        b.onclick = () => this.pick(h.id); b.onmouseenter = () => this.sfx.ui('hover'); tiles.append(b); this.tiles.set(h.id, b);
      }
      g.append(tiles); roles.append(g);
    }
    $('selSkin').innerHTML = SKINS.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  }
  open(sim, { mid = false, onReady, onPick, onSkin, skin = 'default' } = {}) {
    this.sim = sim; this.mid = mid; this.onReady = onReady; this.onPick = onPick; this.onSkin = onSkin; this.open_ = true; this.t = 0; this.revealT = [];
    const me = sim.player; this.sel = me.hero; $('select').hidden = false; $('selSkin').value = skin;
    $('selSide').textContent = sim.playerTeam === 0 ? 'ATTACK' : 'DEFEND'; $('selSide').className = sim.playerTeam === 0 ? '' : 'def'; $('selMap').textContent = MAP_NAME;
    $('selReady').textContent = mid ? 'CONFIRM' : 'READY'; document.querySelector('.sel-assemble span').textContent = mid ? 'CHOOSE YOUR HERO' : 'ASSEMBLE YOUR TEAM';
    $('selTeam').style.display = mid ? 'none' : ''; this.buildTeam(); this.refresh();
    $('selSkin').onchange = () => { this.sfx.ui('select'); this.onSkin?.($('selSkin').value); };
    $('selReady').onclick = () => { this.sfx.ui('ready'); this.onReady?.(); };
  }
  buildTeam() {
    const sim = this.sim, box = $('selTeam'); box.innerHTML = ''; this.slots = [];
    const mates = sim.units.filter((u) => u.team === sim.playerTeam && !u.deploy);
    mates.forEach((u, i) => {
      const s = document.createElement('div'); s.className = 's-slot' + (u.isPlayer ? ' me' : ' pending'); s.innerHTML = `<div class="s-badge"></div><div class="s-hex"><div></div></div><div class="s-name"></div>`;
      box.append(s); const rec = { s, u, shown: u.isPlayer, at: u.isPlayer ? 0 : 1.2 + i * 1.5 + Math.random() * 3 }; this.slots.push(rec); this.paintSlot(rec);
    });
  }
  paintSlot(rec) {
    const { s, u } = rec, hex = s.querySelector('.s-hex > div'), name = s.querySelector('.s-name'), badge = s.querySelector('.s-badge');
    if (!rec.shown) { s.classList.add('pending'); hex.innerHTML = '…'; name.textContent = u.name; badge.style.display = 'none'; return; }
    s.classList.remove('pending'); badge.style.display = ''; badge.style.backgroundImage = `url("${roleIcon(u.def.role)}")`;
    hex.innerHTML = ''; const c = document.createElement('canvas'); c.width = c.height = 128; this.portraits.paint(c, u.hero); hex.append(c); name.textContent = u.isPlayer ? 'YOU' : u.name;
  }
  pick(id) { if (id === this.sel) return; this.sfx.ui('select'); this.sel = id; this.onPick?.(id); this.refresh(); }
  refresh() {
    const h = HERO[this.sel], me = this.sim.player;
    $('selName').textContent = h.name; $('selRole').className = 'ricon ' + h.role;
    for (const [id, b] of this.tiles) b.classList.toggle('on', id === this.sel);
    const kb = ['LMB', 'RMB', 'SHIFT', 'E', 'Q'], list = [['w1', h.w1.name, h.w1.kind === 'hitscan' ? `${h.w1.dmg}${h.w1.pellets ? '×' + h.w1.pellets : ''} damage per shot` : h.w1.kind === 'proj' ? `${h.w1.dmg} damage projectile` : 'Precision rail shot'], ['w2', h.w2.name, h.w2.desc], ['a1', h.a1.name, h.a1.desc], ['a2', h.a2.name, h.a2.desc], ['ult', h.ult.name, h.ult.desc]];
    $('selInfo').innerHTML = `<div class="role">${ROLES[h.role].label} · ${h.title.toUpperCase()}</div><div class="blurb">${h.blurb}</div>` + list.map((a, i) => `<div class="ab"><kbd>${kb[i]}</kbd><div><b>${a[1].toUpperCase()}</b>${a[2]}</div></div>`).join('');
    const slot = this.slots?.find((s) => s.u.isPlayer); if (slot) this.paintSlot(slot);
  }
  update(dt) {
    if (!this.open_) return; this.t += dt;
    if (!this.mid) {
      $('selT').textContent = Math.max(0, Math.ceil(this.sim.setupT)); $('selT').style.color = this.sim.setupT < 5 ? '#ff6a6a' : '';
      for (const r of this.slots) if (!r.shown && this.t > r.at) { r.shown = true; this.paintSlot(r); this.sfx.ui('hover'); }
      // heroes picked by the bots follow along after a recompose
      for (const r of this.slots) if (r.shown && !r.u.isPlayer && r.painted !== r.u.hero) { r.painted = r.u.hero; this.paintSlot(r); }
    } else $('selT').textContent = '';
    $('selLat').textContent = 'OFFLINE · BOTS READY';
  }
  close() { this.open_ = false; $('select').hidden = true; }
}
const roleIcon = (role) => ({ tank: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z'/%3E%3C/svg%3E", damage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='%23fff'%3E%3Crect x='5' y='6' width='3.4' height='13' rx='1.4'/%3E%3Crect x='10.3' y='3' width='3.4' height='16' rx='1.4'/%3E%3Crect x='15.6' y='6' width='3.4' height='13' rx='1.4'/%3E%3C/g%3E%3C/svg%3E", support: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'/%3E%3C/svg%3E" }[role]);

// ------------------------------------------------------------------ gallery
export class Gallery {
  constructor(portraits, sfx) { this.portraits = portraits; this.sfx = sfx; }
  build() {
    const grid = $('gGrid'); grid.innerHTML = '';
    for (const role of ['tank', 'damage', 'support']) {
      const col = document.createElement('div'); col.className = 'g-col'; col.innerHTML = `<h3><i class="ricon ${role}"></i>${ROLES[role].label}</h3>`; const t = document.createElement('div'); t.className = 'g-tiles';
      for (const h of HEROES.filter((x) => x.role === role)) {
        const b = document.createElement('button'); b.className = 'g-tile'; b.type = 'button'; b.append(this.portraits.canvas(h.id, 128)); const n = document.createElement('b'); n.textContent = h.name; b.append(n);
        b.onclick = () => { this.sfx.ui('select'); this.show(h.id); }; b.onmouseenter = () => this.sfx.ui('hover'); t.append(b); b.dataset.id = h.id;
      }
      col.append(t); grid.append(col);
    }
    this.show('sabre');
  }
  show(id) {
    const h = HERO[id]; document.querySelectorAll('.g-tile').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    const kb = ['LMB', 'RMB', 'SHIFT', 'E', 'Q'];
    $('gDetail').innerHTML = `<div class="role">${ROLES[h.role].label} · ${h.title.toUpperCase()}</div><h3>${h.name}</h3><p>${h.blurb}</p><div class="st"><span><b>${h.hp + h.armor}</b> HEALTH</span><span><b>${h.speed.toFixed(1)}</b> M/S</span><span><b>${h.w1.dmg}${h.w1.pellets ? '×' + h.w1.pellets : ''}</b> DMG</span></div>` +
      [[h.w1.name, h.w1.kind === 'hitscan' ? 'Primary fire' : h.w1.kind === 'proj' ? 'Primary projectile' : 'Primary rail shot'], [h.w2.name, h.w2.desc], [h.a1.name, h.a1.desc], [h.a2.name, h.a2.desc], [h.ult.name + ' (ULTIMATE)', h.ult.desc]].map((a, i) => `<div class="ab"><kbd>${kb[i]}</kbd><div><b>${a[0].toUpperCase()}</b>${a[1]}</div></div>`).join('');
  }
}

// ------------------------------------------------------------------ scoreboard and end cards
export function renderScoreboard(sim, portraits) {
  const card = $('scCard'); card.innerHTML = '';
  for (const team of [sim.playerTeam, 1 - sim.playerTeam]) {
    const box = document.createElement('div'); box.className = 'sc-team ' + (team === 0 ? 'a' : 'd'); box.innerHTML = `<h4>${team === sim.playerTeam ? 'YOUR TEAM' : 'ENEMY TEAM'} · ${TEAM_COLORS[team].name}</h4><div class="sc-row head"><i></i><span style="text-align:left">PLAYER</span><span>E</span><span>A</span><span>D</span><span>DMG</span><span>HEAL</span><span>ULT</span></div>`;
    for (const u of sim.units.filter((x) => x.team === team && !x.deploy)) {
      const r = document.createElement('div'); r.className = 'sc-row' + (u.isPlayer ? ' me' : '') + (u.alive ? '' : ' dead'); r.append(portraits.canvas(u.hero, 40));
      const rest = document.createElement('span'); rest.style.display = 'contents'; rest.innerHTML = `<b>${u.isPlayer ? 'YOU' : u.name} <small style="color:#9fb0cc">${u.def.name}</small></b><span>${u.stats.elims}</span><span>${u.stats.assists}</span><span>${u.stats.deaths}</span><span>${Math.round(u.stats.dmg)}</span><span>${Math.round(u.stats.heal)}</span><span>${Math.floor(u.ult / u.def.ult.cost * 100)}%</span>`;
      r.append(...rest.childNodes); box.append(r);
    }
    card.append(box);
  }
}
export function renderEnd(sim, portraits) {
  const won = sim.winner === sim.playerTeam, t = $('eTitle'); t.textContent = won ? 'VICTORY' : 'DEFEAT'; t.className = won ? 'win' : 'lose';
  $('eWhy').textContent = (sim.winner === 0 ? 'ATTACKERS' : 'DEFENDERS') + ' WIN · ' + (sim.why || '').toUpperCase();
  const us = sim.units.filter((u) => !u.deploy), best = (f) => us.slice().sort((a, b) => f(b) - f(a))[0];
  const cards = [['MOST ELIMINATIONS', best((u) => u.stats.elims), (u) => u.stats.elims + ' ELIMS'], ['MOST DAMAGE', best((u) => u.stats.dmg), (u) => Math.round(u.stats.dmg) + ' DAMAGE'], ['MOST HEALING', best((u) => u.stats.heal), (u) => Math.round(u.stats.heal) + ' HEALED'], ['YOUR MATCH', sim.player, (u) => `${u.stats.elims} / ${u.stats.assists} / ${u.stats.deaths}`]];
  $('ePotg').innerHTML = '';
  for (const [label, u, f] of cards) { const c = document.createElement('div'); c.className = 'e-card'; c.append(portraits.canvas(u.hero, 96)); c.insertAdjacentHTML('beforeend', `<small>${label}</small><b>${u.isPlayer ? 'YOU' : u.name.toUpperCase()}</b><span>${u.def.name} · ${f(u)}</span>`); $('ePotg').append(c); }
}
