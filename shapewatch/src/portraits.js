// Hero portraits, rendered by the engine into small canvases. Every hero gets its own pose, camera
// angle and lens, key/rim light colours and a 3D backdrop built from their palette (a sun, gears,
// stars, flames, hex tiles...), so no two portraits share a composition.
import * as E from '../../engine/index.js';
import { HEROES, HERO } from './heroes.js';
import { buildHero, headY, glow, mat } from './models.js';

// cam: [x, y, z] relative to the head (z in hero heights), look: target y offset, fov (deg), roll (deg),
// pose: arm and head euler angles, bg: backdrop kind, tone: [glow, base] override
const SPEC = {
  bulwark: { yaw: 16, cam: [0.1, -0.12, 1.55], look: -0.1, fov: 34, roll: 0, bg: 'sun', pose: { armR: [-30, 0, -30], armL: [-100, 0, 40], head: [0, -6, 0] } },
  mauler: { yaw: 28, cam: [-0.3, -0.18, 1.45], look: -0.12, fov: 38, roll: -6, bg: 'gears', pose: { armR: [-35, 0, -35], armL: [-30, 0, 35], head: [4, 10, -4] } },
  orbit: { yaw: 14, cam: [0.18, 0.04, 1.32], look: -0.08, fov: 30, roll: 5, bg: 'rings', pose: { armR: [-20, 0, -20], armL: [-140, 0, 25], head: [-4, -10, 4] } },
  wrecker: { yaw: 8, cam: [0, -0.2, 1.4], look: -0.1, fov: 36, roll: 0, bg: 'burst', pose: { armR: [-110, 0, -4], armL: [-100, 0, 6], head: [4, 0, 0] } },
  bastille: { yaw: 22, cam: [0.22, -0.1, 1.6], look: -0.1, fov: 36, roll: 3, bg: 'chevrons', pose: { armR: [-40, 0, -18], armL: [-30, 0, 22], head: [0, -8, 0] } },
  sabre: { yaw: 20, cam: [0.14, 0.02, 1.4], look: -0.08, fov: 30, roll: -3, bg: 'grid', pose: { armR: [-35, 0, -14], armL: [-45, 0, 25], head: [-2, -6, 0] } },
  ranger: { yaw: 36, cam: [0.3, -0.04, 1.25], look: -0.08, fov: 30, roll: -8, bg: 'stars', pose: { armR: [-20, 0, -30], armL: [-20, 0, 30], head: [-6, 14, 0] } },
  cinder: { yaw: 12, cam: [-0.08, 0.1, 1.36], look: -0.02, fov: 30, roll: 0, bg: 'flames', pose: { armR: [-30, 0, -30], armL: [-120, 0, 35], head: [-6, 0, 0] } },
  vesper: { yaw: 34, cam: [0.4, 0.06, 1.2], look: -0.06, fov: 26, roll: 8, bg: 'crosshair', pose: { armR: [-30, 0, -14], armL: [-40, 0, 18], head: [-4, 12, 4] } },
  flicker: { yaw: 6, cam: [-0.12, 0.1, 1.22], look: -0.04, fov: 34, roll: -10, bg: 'clock', pose: { armR: [-30, 0, -35], armL: [-150, 0, 30], head: [-8, -8, 8] } },
  shade: { yaw: 40, cam: [0.4, 0.0, 1.18], look: -0.06, fov: 26, roll: 6, bg: 'diamonds', pose: { armR: [-30, 0, -25], armL: [-60, 0, 30], head: [4, 16, -6] } },
  trapper: { yaw: 14, cam: [0.1, -0.06, 1.38], look: -0.08, fov: 30, roll: 0, bg: 'snow', pose: { armR: [-30, 0, -20], armL: [-30, 0, 24], head: [-2, 0, 0] } },
  skyhawk: { yaw: 10, cam: [0.0, -0.16, 1.48], look: -0.02, fov: 36, roll: -5, bg: 'clouds', pose: { armR: [-40, 0, -30], armL: [-130, 0, 35], head: [-8, 0, -4] } },
  riftwalker: { yaw: 18, cam: [0.2, 0.04, 1.28], look: -0.06, fov: 30, roll: 4, bg: 'hex', pose: { armR: [-70, 0, -30], armL: [-30, 0, 30], head: [-2, -10, 0] } },
  halo: { yaw: 8, cam: [0.06, 0.12, 1.3], look: 0.02, fov: 34, roll: 0, bg: 'wings', pose: { armR: [-45, 0, -45], armL: [-45, 0, 45], head: [-10, 0, 0] } },
  serene: { yaw: 24, cam: [0.24, 0.04, 1.3], look: -0.06, fov: 28, roll: 3, bg: 'cross', pose: { armR: [-30, 0, -14], armL: [-30, 0, 22], head: [-2, -8, 3] } },
  pylon: { yaw: 18, cam: [0.1, -0.06, 1.38], look: -0.08, fov: 32, roll: -2, bg: 'hazard', pose: { armR: [-45, 0, -18], armL: [-45, 0, 24], head: [2, -6, 0] } },
  zephyr: { yaw: 4, cam: [-0.2, 0.0, 1.3], look: -0.06, fov: 32, roll: -12, bg: 'bars', pose: { armR: [-30, 0, -40], armL: [-130, 0, 35], head: [-4, 0, 10] } },
  cantor: { yaw: 0, cam: [0, 0.02, 1.35], look: -0.06, fov: 28, roll: 0, bg: 'lotus', pose: { armR: [-70, 0, -22], armL: [-70, 0, 22], head: [-4, 0, 0] } },
  siphon: { yaw: 30, cam: [0.3, 0.08, 1.22], look: -0.04, fov: 28, roll: 6, bg: 'drops', pose: { armR: [-30, 0, -28], armL: [-100, 0, 30], head: [-6, 12, 5] } },
};
const TONE = { bulwark: ['#ffb02e', '#1b3f78'], mauler: ['#f2c14e', '#5a1e12'], orbit: ['#5cf2e0', '#2b1a63'], wrecker: ['#ff5a2a', '#4c2e08'], bastille: ['#e8d34a', '#27301a'], sabre: ['#ff7a1a', '#102a55'], ranger: ['#e9c46a', '#6e2d12'], cinder: ['#ffd23f', '#3a0f08'], vesper: ['#b6ff4a', '#0c3a35'], flicker: ['#40e0ff', '#2a2208'], shade: ['#ff3d9a', '#150f26'], trapper: ['#f4a23a', '#27401e'], skyhawk: ['#ff9a3c', '#2a63b4'], riftwalker: ['#c06bff', '#0d3b57'], halo: ['#fff1a8', '#4d3a12'], serene: ['#f6c453', '#0f4a43'], pylon: ['#ffe14d', '#14401c'], zephyr: ['#59f0a8', '#4a0f3a'], cantor: ['#7ff0ff', '#6b3508'], siphon: ['#9aff4a', '#38104a'] };

function backdrop(kind, c1, c2, rnd) {
  const k = new E.Kit(E.archPalette()), G = glow(c1, 1.6), G2 = glow(c1, 3), D = mat(c2, { roughness: 0.9 }), D2 = mat(shade(c2, 1.5), { roughness: 0.9 });
  k.box(D, [0, 0, -2.4], [9, 9, 0.2]); // base panel
  const Z = -1.9, ex = (shape, size, pos, rot, o) => k.shape(G, { type: 'extrude', shape, radius: 0.5, depth: 1, points: 5, inner: 0.45, bevel: 0.0, ...o }, [], pos, rot || [0, 0, 0], [size, size, 0.05]);
  const tor = (R, t, pos, rot = [90, 0, 0], m = G) => k.shape(m, { type: 'torus', radius: R, tube: t, radialSegments: 6, tubularSegments: 40, arc: 360, tubeScaleY: 1 }, [], pos, rot);
  switch (kind) {
    case 'sun': k.cyl(G2, [0, 0.1, Z], 0.62, 0.04, [90, 0, 0], 32); for (let i = 0; i < 16; i++) { const a = i / 16 * 360; k.box(G, [Math.cos(a * Math.PI / 180) * 1.25, 0.1 + Math.sin(a * Math.PI / 180) * 1.25, Z - 0.02], [1.0, 0.07, 0.03], [0, 0, a]); } break;
    case 'gears': ex('gear', 2.0, [0.25, 0.1, Z], [0, 0, 8], { teeth: 12, toothDepth: 0.14 }); k.shape(D, { type: 'extrude', shape: 'gear', radius: 0.5, depth: 1, teeth: 12, toothDepth: 0.14, bevel: 0 }, [], [0.25, 0.1, Z + 0.06], [0, 0, 8], [1.6, 1.6, 0.05]); ex('gear', 1.0, [-0.85, -0.45, Z], [0, 0, 20], { teeth: 8, toothDepth: 0.16 }); ex('gear', 0.7, [0.9, 0.7, Z], [0, 0, 5], { teeth: 8, toothDepth: 0.16 }); break;
    case 'rings': for (let i = 0; i < 5; i++) tor(0.35 + i * 0.28, 0.012 + (i % 2) * 0.01, [0.1, 0.1, Z + i * 0.01]); for (let i = 0; i < 6; i++) { const a = i * 1.05; k.shape(G2, { type: 'sphere', radius: 0.05, widthSegments: 8, heightSegments: 6, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0.1 + Math.cos(a) * (0.6 + i * 0.12), 0.1 + Math.sin(a) * (0.6 + i * 0.12), Z + 0.1]); } break;
    case 'burst': for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, w = 0.2 + (i % 2) * 0.1; k.box(i % 2 ? G : G2, [Math.cos(a) * 1.5, 0.1 + Math.sin(a) * 1.5, Z - 0.02], [2.4, w, 0.03], [0, 0, a * 180 / Math.PI]); } k.cyl(D, [0, 0.1, Z + 0.02], 0.55, 0.03, [90, 0, 0], 24); break;
    case 'chevrons': for (let i = 0; i < 5; i++) ex('arrow', 1.6 - i * 0.12, [0, -0.7 + i * 0.5, Z], [0, 0, 180], {}); break;
    case 'grid': for (let i = -6; i <= 6; i++) { k.box(G, [i * 0.28, 0.1, Z], [0.012, 3.6, 0.02]); k.box(G, [0, 0.1 + i * 0.28, Z], [3.6, 0.012, 0.02]); } k.box(G2, [0, -0.2, Z + 0.01], [1.8, 0.03, 0.03]); break;
    case 'stars': for (let i = 0; i < 16; i++) { const x = (rnd() - 0.5) * 3.2, y = (rnd() - 0.5) * 3.0, s = 0.12 + rnd() * 0.3; ex('star', s, [x, y, Z + rnd() * 0.2], [0, 0, rnd() * 72]); } k.cyl(G2, [0.55, 0.5, Z - 0.1], 0.4, 0.03, [90, 0, 0], 24); break;
    case 'flames': for (let i = 0; i < 14; i++) { const x = (i / 13 - 0.5) * 3.4, h = 0.9 + rnd() * 1.4; k.shape(i % 2 ? G : G2, { type: 'cone', radius: 0.2 + rnd() * 0.12, height: h, radialSegments: 8, heightSegments: 1, capBottom: true, arc: 360 }, [], [x, -1.2 + h / 2, Z + rnd() * 0.3], [0, 0, (rnd() - 0.5) * 24]); } break;
    case 'crosshair': tor(0.9, 0.018, [0.2, 0.1, Z]); tor(0.55, 0.012, [0.2, 0.1, Z]); k.box(G, [0.2, 0.1, Z], [3.2, 0.014, 0.02]); k.box(G, [0.2, 0.1, Z], [0.014, 3.2, 0.02]); for (const a of [0, 90, 180, 270]) k.box(G2, [0.2 + Math.cos(a * Math.PI / 180) * 0.9, 0.1 + Math.sin(a * Math.PI / 180) * 0.9, Z + 0.01], [0.3, 0.04, 0.03], [0, 0, a]); break;
    case 'clock': tor(1.0, 0.03, [0, 0.1, Z]); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.box(G, [Math.cos(a) * 0.9, 0.1 + Math.sin(a) * 0.9, Z], [0.2, 0.04, 0.03], [0, 0, a * 180 / Math.PI]); } k.box(G2, [0.2, 0.4, Z + 0.01], [0.5, 0.05, 0.03], [0, 0, 60]); k.box(G2, [-0.1, 0.5, Z + 0.01], [0.04, 0.8, 0.03], [0, 0, 20]); break;
    case 'diamonds': for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * 1.05 + (Math.floor(i / 3) % 2) * 0.5 - 0.2, y = (Math.floor(i / 3) - 1) * 1.05 + 0.1; ex('polygon', 0.9, [x, y, Z], [0, 0, 0], { points: 4 }); k.shape(D, { type: 'extrude', shape: 'polygon', radius: 0.5, points: 4, depth: 1, bevel: 0 }, [], [x, y, Z + 0.04], [0, 0, 0], [0.8, 0.8, 0.04]); } break;
    case 'snow': for (let i = 0; i < 60; i++) k.shape(i % 5 ? G : G2, { type: 'sphere', radius: 0.02 + rnd() * 0.04, widthSegments: 6, heightSegments: 4, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [(rnd() - 0.5) * 3.4, (rnd() - 0.5) * 3.2, Z + rnd() * 0.4]); for (const x of [-1.2, -0.6, 0.9, 1.4]) k.shape(D2, { type: 'cone', radius: 0.42, height: 1.6, radialSegments: 6, heightSegments: 1, capBottom: true, arc: 360 }, [], [x, -0.5, Z - 0.1]); break;
    case 'clouds': for (let i = 0; i < 7; i++) { const x = (rnd() - 0.5) * 3, y = -0.9 + rnd() * 1.8; for (let j = 0; j < 4; j++) k.shape(mat('#ffffff', { emissive: '#bcd8ff', emissiveStrength: 0.4 }), { type: 'sphere', radius: 0.2 + rnd() * 0.15, widthSegments: 10, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [x + j * 0.22, y + (j % 2) * 0.08, Z + rnd() * 0.2], [0, 0, 0], [1.3, 0.8, 0.6]); } break;
    case 'hex': for (let i = 0; i < 18; i++) { const col = i % 6, row = Math.floor(i / 6), x = (col - 2.5) * 0.62 + (row % 2) * 0.31, y = (row - 1) * 0.54 + 0.1; if (rnd() < 0.75) k.shape(rnd() < 0.5 ? G : G2, { type: 'extrude', shape: 'polygon', radius: 0.5, points: 6, depth: 1, bevel: 0 }, [], [x, y, Z + rnd() * 0.2], [0, 0, 0], [0.5, 0.5, 0.04]); } break;
    case 'wings': for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) k.box(i % 2 ? G : G2, [sx * (0.5 + i * 0.28), 0.3 + i * 0.12 - 0.3 * (i > 3), Z], [0.9, 0.12, 0.03], [0, 0, sx * (30 - i * 6)]); k.cyl(G2, [0, 0.2, Z - 0.1], 0.5, 0.03, [90, 0, 0], 28); break;
    case 'cross': for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * 1.1 + (Math.floor(i / 3) % 2) * 0.45, y = (Math.floor(i / 3) - 1) * 1.1 + 0.1, s = 0.5 + (i % 2) * 0.2; k.box(i % 2 ? G : G2, [x, y, Z], [s * 0.3, s, 0.04]); k.box(i % 2 ? G : G2, [x, y, Z], [s, s * 0.3, 0.04]); } break;
    case 'hazard': for (let i = -8; i <= 8; i++) k.box(i % 2 ? G : D2, [i * 0.34, 0.1, Z], [0.17, 4.2, 0.03], [0, 0, 28]); k.cyl(G2, [0.9, 0.7, Z + 0.03], 0.28, 0.03, [90, 0, 0], 20); break;
    case 'bars': for (let i = 0; i < 15; i++) { const h = 0.5 + Math.abs(Math.sin(i * 1.7 + 0.4)) * 1.9, x = (i - 7) * 0.24; k.box(i % 3 ? G : G2, [x, -1.15 + h / 2, Z], [0.15, h, 0.03]); } break;
    case 'lotus': for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; k.shape(i % 2 ? G : G2, { type: 'sphere', radius: 0.35, widthSegments: 12, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [Math.cos(a) * 0.8, 0.1 + Math.sin(a) * 0.8, Z], [0, 0, a * 180 / Math.PI], [1.4, 0.45, 0.2]); } tor(1.5, 0.014, [0, 0.1, Z]); break;
    case 'drops': for (let i = 0; i < 16; i++) k.shape(i % 3 ? G : G2, { type: 'sphere', radius: 0.07 + rnd() * 0.12, widthSegments: 8, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [(rnd() - 0.5) * 3.2, (rnd() - 0.5) * 3, Z + rnd() * 0.3], [0, 0, 0], [1, 1.5, 1]); break;
  }
  return k.toNode('Backdrop ' + kind);
}
function shade(hex, k) { const c = E.hexToRGB(hex); const h = (v) => Math.max(0, Math.min(255, Math.round(v * 255 * k))).toString(16).padStart(2, '0'); return '#' + h(c[0]) + h(c[1]) + h(c[2]); }

export const heroPose = (id) => SPEC[id]?.pose || { armR: [-40, 0, -10], armL: [-30, 0, 20], head: [0, 0, 0] };
export const heroTone = (id) => TONE[id] || ['#ffffff', '#223'];

export class Portraits {
  constructor() { this.cache = new Map(); this.size = 192; }
  async generate(onProgress, only = null) {
    const holder = document.createElement('div'); holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:256px;height:256px;pointer-events:none;';
    const cv = document.createElement('canvas'); cv.style.cssText = 'width:256px;height:256px'; holder.append(cv); document.body.append(holder);
    let r; try { r = new E.Renderer(cv); } catch (e) { holder.remove(); throw e; }
    Object.assign(r.settings, { adaptiveResolution: false, renderScale: 1, bloom: true, vignette: 0.28, grain: 0, dofAperture: 0, ssr: false, volumetrics: false, godRays: false, sharpen: 0.1, aberration: 0, saturation: 1.15 });
    r.pixelRatio = 1;
    const list = only ? HEROES.filter((h) => only.includes(h.id)) : HEROES;
    for (const [i, h] of list.entries()) {
      const spec = SPEC[h.id], tone = TONE[h.id], scene = new E.Scene(), env = scene.environment;
      E.applyTimeOfDay(env, 14); Object.assign(env, { fogDensity: 0, shadowRadius: 3, shadowFar: 0, volumetric: 0, ao: true, exposure: 0.95 });
      env.zenithColor = env.horizonColor = env.skyColor = E.hexToRGB(tone[1]); env.clouds = false;
      let seed = (h.id.charCodeAt(0) * 97 + h.id.length * 31) | 0; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const s = h.height / 1.8, m = buildHero(h.id, 'default'), d = m.userData; d.ring.visible = false; scene.add(m);
      d.armR.setEuler(...spec.pose.armR); d.armL.setEuler(...spec.pose.armL); d.head.setEuler(...spec.pose.head);
      for (const a of d.anim) if (a.kind === 'spin') a.node.setEuler(a.axis[0] * 40, a.axis[1] * 40, a.axis[2] * 40);
      if (d.flames) d.flames.forEach((f) => { f.visible = h.id === 'skyhawk'; });
      m.setEuler(0, spec.yaw, 0);
      const bg = backdrop(spec.bg, tone[0], tone[1], rnd); bg.scale.set([s, s, s]); bg.position.set([0, headY(h.id) * 0.92, 0]); scene.add(bg);
      const key = new E.Light('point', { color: shade(h.colors.accent, 0.5) === '#000000' ? '#fff3e0' : mixHex('#fff1e0', h.colors.accent, 0.22), intensity: 26, range: 12 }); key.position.set([1.5 * s + spec.cam[0], headY(h.id) + 1.2, 2.4 * s]); scene.add(key);
      const rim = new E.Light('point', { color: mixHex('#8fb8ff', h.colors.primary, 0.4), intensity: 20, range: 12 }); rim.position.set([-1.6 * s, headY(h.id) + 0.8, -0.6 * s]); scene.add(rim);
      const fill = new E.Light('point', { color: tone[0], intensity: 6, range: 8 }); fill.position.set([0.2, headY(h.id) - 0.4, 1.5 * s]); scene.add(fill);
      const cam = new E.Camera(), hy = headY(h.id); cam.fov = spec.fov * E.DEG; cam.near = 0.05;
      cam.position.set([spec.cam[0] * s, hy + spec.cam[1] * s, spec.cam[2] * s * 1.45]); cam.target.set([0, hy + spec.look * s, 0]);
      const ro = spec.roll * Math.PI / 180; cam.up.set([Math.sin(ro), Math.cos(ro), 0]);
      r.render(scene, cam, { background: 'sky', shadows: false });
      const c = document.createElement('canvas'); c.width = c.height = this.size; const g = c.getContext('2d');
      g.drawImage(r.canvas, 0, 0, r.canvas.width, r.canvas.height, 0, 0, this.size, this.size);
      this.cache.set(h.id, c);
      onProgress?.((i + 1) / list.length);
      await new Promise((res) => setTimeout(res, 0));
    }
    holder.remove();
  }
  get(id) { return this.cache.get(id); }
  // copy into a fresh canvas element (so each place in the UI has its own)
  canvas(id, size = 64) {
    const c = document.createElement('canvas'); c.width = c.height = size; const src = this.cache.get(id);
    if (src) c.getContext('2d').drawImage(src, 0, 0, size, size); return c;
  }
  paint(c, id) { const src = this.cache.get(id); if (!src) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); }
  url(id) { const c = this.cache.get(id); return c ? c.toDataURL('image/jpeg', 0.86) : ''; }
}
function mixHex(a, b, t) { const A = E.hexToRGB(a), B = E.hexToRGB(b), h = (v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0'); return '#' + [0, 1, 2].map((i) => h(A[i] + (B[i] - A[i]) * t)).join(''); }
