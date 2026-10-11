// Procedural hero models built from ShapeForge primitives. Every hero is a rig of nodes (hips,
// spine, head, two arms, two legs) so the view can swing limbs, tilt the torso to the aim and
// topple the body on death, but each of the twenty has its own silhouette: body proportions,
// headgear, armour, a back piece and animated bits (orbiters, wings, jet flames, portals...).
// Weapons are separate nodes: a world model for the hands and the same builder at first-person
// scale for the viewmodel.
import * as E from '../../engine/index.js';
import { HERO, SKINS } from './heroes.js';

const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  let m = matCache.get(key);
  if (!m) { m = new E.Material({ name: 'M' + color, color, roughness: 0.55, ...o }); matCache.set(key, m); }
  return m;
}
export const glow = (c, s = 2.2) => mat(c, { emissive: c, emissiveStrength: s, roughness: 0.4 });
const pal = E.archPalette();

function group(name, build) { const k = new E.Kit(pal); build(k); return k.toNode(name); }
const at = (n, x, y, z) => { n.position.set([x, y, z]); return n; };
const SP = (r, tl = 180, w = 14, h = 10) => ({ type: 'sphere', radius: r, widthSegments: w, heightSegments: h, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: tl });
const sph = (k, m, r, p, s, rot) => k.shape(m, SP(r), [], p, rot || [0, 0, 0], s || [1, 1, 1]);
const dome = (k, m, r, p, s, rot, tl = 100) => k.shape(m, SP(r, tl), [], p, rot || [0, 0, 0], s || [1, 1, 1]);
const tor = (k, m, R, t, p, rot, s, seg = 24) => k.shape(m, { type: 'torus', radius: R, tube: t, radialSegments: 8, tubularSegments: seg, arc: 360, tubeScaleY: 1 }, [], p, rot || [0, 0, 0], s || [1, 1, 1]);
const cone = (k, m, r, h, p, rot, seg = 10) => k.shape(m, { type: 'cone', radius: r, height: h, radialSegments: seg, heightSegments: 1, capBottom: true, arc: 360 }, [], p, rot || [0, 0, 0]);
const ext = (k, m, shape, size, depth, p, rot, o = {}) => k.shape(m, { type: 'extrude', shape, radius: 0.5, depth: 1, points: 5, inner: 0.45, bevel: 0.01, ...o }, [], p, rot || [0, 0, 0], [size, size, depth]);
const lathe = (k, m, pts, p, rot, s, segs = 16) => k.shape(m, { type: 'lathe', points: pts, segments: segs, arc: 360, smooth: 0 }, [], p, rot || [0, 0, 0], s || [1, 1, 1]);

export const headY = (id) => (0.88 + BODY[id].t[1] + 0.14) * HERO[id].height / 1.8;
export function heroColors(heroId, skinId = 'default') {
  const d = HERO[heroId], skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  return skin.map(d.colors);
}
const HAIR = { orbit: '#1d1430', ranger: '#4a2f1a', cinder: '#ff7a1a', flicker: '#ffd23a', shade: '#1a1226', trapper: '#3a2a1c', riftwalker: '#14243a', halo: '#f2d27a', serene: '#15151c', pylon: '#3b2a1e', zephyr: '#2a1346', siphon: '#d9d2e6', sion: '#1a1a1a', stormcaller: '#e9f2ff', ricochet: '#2b1a12', mirage: '#ff7ad9', lantern: '#1e140c', thorn: '#8a3a5a', vesper: '#1b2428', mauler: '#2c2a2a', sabre: '#2a2018', skyhawk: '#5a3d22' };

// ------------------------------------------------------------------ weapons
// built pointing +Z with the grip at the origin; returns { node, muzzle:[x,y,z], spin?: Node }
export function buildWeapon(heroId, c) {
  const dark = mat('#2b2e36', { metallic: 0.7, roughness: 0.45 }), body = mat(c.primary, { metallic: 0.35, roughness: 0.45 }), sec = mat(c.secondary, { metallic: 0.4 });
  const acc = glow(c.accent, 2.4), steel = mat('#8e949f', { metallic: 0.85, roughness: 0.3 }), wood = mat('#6b4a2c', { roughness: 0.7 });
  let muzzle = [0, 0.04, 0.6], spin = null;
  const node = group('Weapon ' + heroId, (k) => {
    switch (heroId) {
      case 'bulwark': // forearm pulse cannon
        k.box(body, [0, 0.05, 0.3], [0.2, 0.18, 0.6], [0, 0, 0], 0.03); k.cyl(dark, [0, 0.05, 0.68], 0.07, 0.3, [90, 0, 0], 12); k.cyl(acc, [0, 0.05, 0.84], 0.05, 0.04, [90, 0, 0], 12); k.box(sec, [0, 0.16, 0.2], [0.12, 0.06, 0.34]);
        muzzle = [0, 0.05, 0.88]; break;
      case 'mauler': // sawed scrap cannon
        k.box(body, [0, 0.03, 0.25], [0.22, 0.2, 0.5], [0, 0, 0], 0.03); k.cyl(dark, [0, 0.06, 0.62], 0.1, 0.42, [90, 0, 0], 10); k.cyl(sec, [0, 0.06, 0.4], 0.12, 0.08, [90, 0, 0], 10); k.box(acc, [0, 0.17, 0.3], [0.04, 0.05, 0.3]); k.cyl(dark, [0.12, 0.06, 0.62], 0.04, 0.4, [90, 0, 0], 8);
        muzzle = [0, 0.06, 0.84]; break;
      case 'orbit': // gravity driver
        k.box(body, [0, 0.03, 0.2], [0.14, 0.16, 0.5], [0, 0, 0], 0.03); tor(k, acc, 0.11, 0.025, [0, 0.04, 0.5], [90, 0, 0]); tor(k, acc, 0.08, 0.02, [0, 0.04, 0.62], [90, 0, 0]); k.box(dark, [0, 0.04, 0.5], [0.05, 0.05, 0.3]);
        muzzle = [0, 0.04, 0.78]; break;
      case 'wrecker': // hydraulic fist
        k.box(dark, [0, 0.0, 0.1], [0.34, 0.32, 0.34], [0, 0, 0], 0.07); k.box(body, [0, 0.0, 0.28], [0.4, 0.36, 0.22], [0, 0, 0], 0.08);
        for (const x of [-0.13, -0.04, 0.05, 0.14]) k.box(acc, [x, 0.0, 0.4], [0.075, 0.3, 0.05], [0, 0, 0], 0.02);
        k.cyl(steel, [0, 0.22, -0.02], 0.045, 0.5, [90, 0, 0], 8); k.cyl(dark, [0, -0.2, 0.0], 0.04, 0.4, [90, 0, 0], 8);
        muzzle = [0, 0, 0.5]; break;
      case 'bastille': { // six-barrel rotary cannon, the barrel cluster spins
        k.box(body, [0, 0.0, 0.1], [0.3, 0.28, 0.5], [0, 0, 0], 0.04); k.box(dark, [0, 0.2, 0.12], [0.1, 0.14, 0.4]); k.cyl(sec, [0, 0, 0.52], 0.17, 0.12, [90, 0, 0], 14); k.cyl(dark, [0, -0.2, 0.1], 0.07, 0.32, [0, 0, 0], 8);
        const s = new E.Node('Barrels'); s.position.set([0, 0, 0.58]); s.add(group('BarrelMesh', (kk) => { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; kk.cyl(dark, [Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.3], 0.036, 0.62, [90, 0, 0], 8); } kk.cyl(steel, [0, 0, 0.0], 0.15, 0.05, [90, 0, 0], 14); kk.cyl(steel, [0, 0, 0.62], 0.14, 0.04, [90, 0, 0], 14); kk.cyl(acc, [0, 0, 0.64], 0.06, 0.02, [90, 0, 0], 10); }));
        spin = s; muzzle = [0, 0, 1.2]; k.dynamic.push(s); break; }
      case 'sabre': // pulse rifle
        k.box(body, [0, 0.04, 0.28], [0.1, 0.16, 0.62], [0, 0, 0], 0.02); k.box(dark, [0, 0.04, 0.74], [0.05, 0.05, 0.36]); k.box(dark, [0, 0.15, 0.3], [0.06, 0.07, 0.3]); k.box(sec, [0, -0.1, 0.18], [0.07, 0.22, 0.12], [-8, 0, 0]); k.box(acc, [0.055, 0.05, 0.4], [0.012, 0.04, 0.22]); k.box(dark, [0, 0.0, -0.1], [0.08, 0.14, 0.3]);
        muzzle = [0, 0.04, 0.94]; break;
      case 'ranger': // long-barrel revolver
        k.box(steel, [0, 0.04, 0.2], [0.09, 0.12, 0.32], [0, 0, 0], 0.02); k.cyl(steel, [0, 0.05, 0.5], 0.032, 0.36, [90, 0, 0], 10); k.cyl(dark, [0, 0.04, 0.28], 0.09, 0.15, [90, 0, 0], 12); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; k.cyl(steel, [Math.cos(a) * 0.055, 0.04 + Math.sin(a) * 0.055, 0.28], 0.018, 0.16, [90, 0, 0], 6); }
        k.box(wood, [0, -0.1, 0.02], [0.07, 0.2, 0.1], [-18, 0, 0], 0.02); k.box(acc, [0, 0.12, 0.12], [0.02, 0.04, 0.04]); k.box(dark, [0, 0.11, 0.4], [0.02, 0.03, 0.03]);
        muzzle = [0, 0.05, 0.7]; break;
      case 'cinder': // ember gauntlet-rod
        k.box(dark, [0, 0.03, 0.22], [0.09, 0.1, 0.5], [0, 0, 0], 0.02); k.cyl(body, [0, 0.04, 0.55], 0.06, 0.3, [90, 0, 0], 8, 0.09); sph(k, acc, 0.07, [0, 0.04, 0.72]); k.cyl(sec, [0, 0.03, 0.05], 0.05, 0.2, [90, 0, 0], 8);
        muzzle = [0, 0.04, 0.8]; break;
      case 'vesper': // rail rifle with scope
        k.box(body, [0, 0.04, 0.35], [0.09, 0.14, 0.9], [0, 0, 0], 0.02); k.cyl(dark, [0, 0.05, 0.98], 0.035, 0.5, [90, 0, 0], 8); k.cyl(dark, [0, 0.17, 0.3], 0.055, 0.34, [90, 0, 0], 10); k.cyl(glow(c.accent, 3), [0, 0.17, 0.48], 0.05, 0.01, [90, 0, 0], 10); k.box(acc, [0.05, 0.04, 0.5], [0.012, 0.03, 0.5]); k.box(sec, [0, -0.1, 0.2], [0.07, 0.2, 0.1]);
        muzzle = [0, 0.05, 1.25]; break;
      case 'flicker': // chrono pistol
        k.box(body, [0, 0.03, 0.14], [0.08, 0.12, 0.32], [0, 0, 0], 0.02); k.box(dark, [0, 0.03, 0.34], [0.045, 0.05, 0.12]); k.box(sec, [0, -0.07, 0.04], [0.06, 0.18, 0.08], [-10, 0, 0]); k.cyl(acc, [0, 0.1, 0.18], 0.03, 0.1, [90, 0, 0], 8); tor(k, acc, 0.06, 0.012, [0, 0.03, 0.3], [90, 0, 0]);
        muzzle = [0, 0.03, 0.42]; break;
      case 'shade': // suppressed machine pistol
        k.box(dark, [0, 0.03, 0.14], [0.08, 0.14, 0.3], [0, 0, 0], 0.02); k.cyl(dark, [0, 0.04, 0.46], 0.04, 0.34, [90, 0, 0], 10); k.cyl(sec, [0, 0.04, 0.5], 0.05, 0.14, [90, 0, 0], 10); k.box(body, [0, -0.1, 0.04], [0.06, 0.24, 0.08], [-8, 0, 0]); k.box(dark, [0, -0.12, 0.2], [0.05, 0.22, 0.07]); k.box(acc, [0.045, 0.06, 0.2], [0.01, 0.02, 0.18]);
        muzzle = [0, 0.04, 0.68]; break;
      case 'trapper': // bolt-action rifle with a wooden stock
        k.box(wood, [0, 0.0, 0.0], [0.09, 0.15, 0.5], [0, 0, 0], 0.03); k.box(steel, [0, 0.06, 0.4], [0.07, 0.09, 0.4], [0, 0, 0], 0.01); k.cyl(steel, [0, 0.07, 0.82], 0.03, 0.55, [90, 0, 0], 8); k.cyl(dark, [0, 0.17, 0.36], 0.04, 0.26, [90, 0, 0], 8); k.box(dark, [0.07, 0.07, 0.3], [0.1, 0.02, 0.02]); sph(k, steel, 0.025, [0.12, 0.07, 0.3]); k.box(wood, [0, -0.08, 0.3], [0.07, 0.1, 0.22]);
        muzzle = [0, 0.07, 1.1]; break;
      case 'skyhawk': // shoulder rocket launcher
        k.cyl(sec, [0, 0.06, 0.3], 0.13, 0.82, [90, 0, 0], 12); k.cyl(dark, [0, 0.06, 0.74], 0.16, 0.12, [90, 0, 0], 12); k.cyl(dark, [0, 0.06, -0.12], 0.15, 0.1, [90, 0, 0], 12); k.box(body, [0, 0.2, 0.2], [0.06, 0.1, 0.3]); k.box(acc, [0, 0.27, 0.34], [0.05, 0.03, 0.12]); k.box(dark, [0, -0.1, 0.1], [0.06, 0.2, 0.08], [-8, 0, 0]);
        muzzle = [0, 0.06, 0.82]; break;
      case 'riftwalker': // rift pistol with a ring muzzle
        k.box(body, [0, 0.03, 0.15], [0.09, 0.13, 0.34], [0, 0, 0], 0.02); tor(k, acc, 0.09, 0.02, [0, 0.04, 0.4], [0, 0, 0]); tor(k, acc, 0.07, 0.014, [0, 0.04, 0.47], [0, 0, 0]); k.box(dark, [0, 0.04, 0.36], [0.04, 0.04, 0.2]); k.box(sec, [0, -0.08, 0.04], [0.065, 0.2, 0.08], [-10, 0, 0]); sph(k, acc, 0.035, [0, 0.12, 0.14]);
        muzzle = [0, 0.04, 0.52]; break;
      case 'halo': // caduceus pistol
        k.box(body, [0, 0.03, 0.14], [0.08, 0.12, 0.3], [0, 0, 0], 0.02); k.box(sec, [0, 0.03, 0.34], [0.05, 0.06, 0.12]); k.box(sec, [0, -0.07, 0.04], [0.06, 0.18, 0.08], [-10, 0, 0]); tor(k, acc, 0.07, 0.015, [0, 0.07, 0.22], [0, 90, 0], null, 16); k.cyl(sec, [0, 0.07, 0.22], 0.012, 0.3, [90, 0, 0], 6);
        muzzle = [0, 0.03, 0.42]; break;
      case 'serene': // biotic rifle
        k.box(body, [0, 0.04, 0.3], [0.09, 0.16, 0.72], [0, 0, 0], 0.03); k.box(sec, [0, 0.04, 0.78], [0.05, 0.06, 0.34]); k.cyl(sec, [0, 0.17, 0.32], 0.06, 0.36, [90, 0, 0], 10); k.cyl(acc, [0, 0.17, 0.5], 0.052, 0.012, [90, 0, 0], 10); ext(k, acc, 'star', 0.1, 0.03, [0.052, 0.04, 0.3], [0, 90, 0], { points: 4, inner: 0.35 }); k.box(dark, [0, -0.1, 0.16], [0.07, 0.2, 0.1]); k.cyl(acc, [0, -0.01, 0.62], 0.025, 0.14, [90, 0, 0], 8);
        muzzle = [0, 0.05, 1.0]; break;
      case 'pylon': // rivet gun
        k.box(body, [0, 0.03, 0.15], [0.1, 0.14, 0.34], [0, 0, 0], 0.025); k.cyl(dark, [0, 0.04, 0.38], 0.05, 0.16, [90, 0, 0], 8); k.box(acc, [0, 0.12, 0.12], [0.05, 0.05, 0.18]); k.box(sec, [0, -0.08, 0.05], [0.07, 0.2, 0.09], [-10, 0, 0]); k.cyl(steel, [0, 0.14, 0.3], 0.04, 0.14, [0, 0, 0], 8);
        muzzle = [0, 0.04, 0.48]; break;
      case 'zephyr': // sonic blaster
        k.box(body, [0, 0.03, 0.18], [0.12, 0.14, 0.4], [0, 0, 0], 0.03); k.cyl(acc, [0, 0.03, 0.46], 0.09, 0.06, [90, 0, 0], 14); k.cyl(sec, [0, 0.03, 0.5], 0.06, 0.06, [90, 0, 0], 14); k.box(dark, [0, -0.08, 0.06], [0.07, 0.2, 0.09], [-10, 0, 0]); tor(k, acc, 0.1, 0.01, [0, 0.03, 0.56], [90, 0, 0]);
        muzzle = [0, 0.03, 0.62]; break;
      case 'cantor': // a hovering shard of discord, no gun at all
        sph(k, glow(c.accent, 3), 0.08, [0, 0.1, 0.25]); for (let i = 0; i < 3; i++) { const a = i * 2.09; sph(k, glow('#c06bff', 2.6), 0.03, [Math.cos(a) * 0.14, 0.1 + Math.sin(a) * 0.05, 0.25 + Math.sin(a) * 0.14]); } tor(k, acc, 0.14, 0.008, [0, 0.1, 0.25], [70, 0, 0]);
        muzzle = [0, 0.1, 0.34]; break;
      case 'siphon': // drain claw
        k.box(dark, [0, 0.02, 0.1], [0.14, 0.14, 0.34], [0, 0, 0], 0.04); for (const x of [-0.06, 0, 0.06]) { cone(k, mat('#d9d2e6', { metallic: 0.2 }), 0.025, 0.3, [x, 0.0, 0.42], [90, 0, 0], 6); } k.cyl(acc, [0, 0.04, 0.3], 0.07, 0.04, [90, 0, 0], 12); tor(k, acc, 0.075, 0.012, [0, 0.04, 0.22], [90, 0, 0]); k.cyl(sec, [0.1, 0.1, 0.0], 0.02, 0.4, [0, 0, 20], 6);
        muzzle = [0, 0.03, 0.6]; break;
      case 'sion': // double-bladed war axe
        k.cyl(mat('#3a2a1c'), [0, 0.0, 0.5], 0.05, 1.5, [90, 0, 0], 8); for (const sy of [-1, 1]) { k.box(steel, [0, sy * 0.3, 1.05], [0.05, 0.5, 0.42], [0, 0, sy * -8], 0.02); cone(k, steel, 0.16, 0.2, [0, sy * 0.58, 1.05], [0, 0, sy > 0 ? 0 : 180], 4); } k.box(acc, [0, 0, 1.05], [0.07, 0.2, 0.08]); tor(k, dark, 0.07, 0.015, [0, 0, 0.05], [90, 0, 0]);
        muzzle = [0, 0, 1.2]; break;
      case 'stormcaller': // tesla rod
        k.cyl(dark, [0, 0.03, 0.2], 0.05, 0.5, [90, 0, 0], 8); for (let i = 0; i < 3; i++) tor(k, acc, 0.08 - i * 0.012, 0.012, [0, 0.03, 0.34 + i * 0.1], [90, 0, 0]); sph(k, acc, 0.07, [0, 0.03, 0.7]); cone(k, acc, 0.03, 0.14, [0, 0.03, 0.8], [90, 0, 0], 5);
        muzzle = [0, 0.03, 0.8]; break;
      case 'ricochet': // angled carbine with a rubber bumper
        k.box(body, [0, 0.04, 0.3], [0.1, 0.16, 0.7], [0, 0, 0], 0.02); k.box(acc, [0, 0.0, 0.7], [0.12, 0.12, 0.08]); k.box(dark, [0, 0.14, 0.34], [0.05, 0.06, 0.34]); k.box(sec, [0, -0.1, 0.16], [0.07, 0.22, 0.1], [-8, 0, 0]); k.box(dark, [0.06, 0.04, 0.5], [0.02, 0.1, 0.2], [0, 0, 25]);
        muzzle = [0, 0.04, 0.8]; break;
      case 'mirage': // twin prism needlers
        for (const sx of [-0.06, 0.06]) { k.box(body, [sx, 0.03, 0.18], [0.06, 0.1, 0.34], [0, 0, 0], 0.015); k.cyl(acc, [sx, 0.03, 0.4], 0.02, 0.12, [90, 0, 0], 6); } k.box(dark, [0, -0.07, 0.08], [0.08, 0.16, 0.08], [-8, 0, 0]);
        muzzle = [0, 0.03, 0.48]; break;
      case 'lantern': // lantern-staff pistol
        k.box(body, [0, 0.03, 0.14], [0.08, 0.12, 0.3], [0, 0, 0], 0.02); k.cyl(sec, [0, 0.04, 0.34], 0.025, 0.2, [90, 0, 0], 6); k.box(dark, [0, 0.18, 0.18], [0.12, 0.02, 0.12]); k.box(glow(c.accent, 3.4), [0, 0.26, 0.18], [0.1, 0.12, 0.1], [0, 0, 0], 0.02); k.box(dark, [0, 0.34, 0.18], [0.12, 0.02, 0.12]); k.box(sec, [0, -0.07, 0.04], [0.06, 0.18, 0.08], [-10, 0, 0]);
        muzzle = [0, 0.04, 0.46]; break;
      case 'thorn': // living-wood thorn launcher
        k.box(mat('#5a3a22', { roughness: 0.9 }), [0, 0.03, 0.2], [0.1, 0.14, 0.44], [0, 0, 0], 0.03); for (let i = 0; i < 4; i++) cone(k, acc, 0.02, 0.1, [0.05 * (i % 2 ? 1 : -1), 0.1, 0.1 + i * 0.1], [0, 0, (i % 2 ? -50 : 50)], 5); cone(k, body, 0.05, 0.3, [0, 0.04, 0.55], [90, 0, 0], 6); sph(k, acc, 0.05, [0, 0.12, 0.05]);
        muzzle = [0, 0.04, 0.72]; break;
      default: k.box(body, [0, 0.03, 0.3], [0.1, 0.14, 0.6]);
    }
  });
  return { node, muzzle, spin };
}

// ------------------------------------------------------------------ bodies
// torso [w,h,d], limb thickness, shoulder width, head radius
const BODY = {
  bulwark: { t: [0.74, 0.62, 0.46], limb: 0.19, sh: 0.25, hd: 0.155 },
  mauler: { t: [0.72, 0.62, 0.44], limb: 0.2, sh: 0.22, hd: 0.15 },
  orbit: { t: [0.44, 0.52, 0.26], limb: 0.105, sh: 0.08, hd: 0.14 },
  wrecker: { t: [0.8, 0.62, 0.46], limb: 0.2, sh: 0.2, hd: 0.15 },
  bastille: { t: [0.82, 0.6, 0.52], limb: 0.2, sh: 0.27, hd: 0.15 },
  sabre: { t: [0.5, 0.54, 0.3], limb: 0.12, sh: 0.1, hd: 0.14 },
  ranger: { t: [0.5, 0.54, 0.3], limb: 0.115, sh: 0.09, hd: 0.14 },
  cinder: { t: [0.46, 0.54, 0.28], limb: 0.11, sh: 0.09, hd: 0.14 },
  vesper: { t: [0.44, 0.54, 0.26], limb: 0.105, sh: 0.08, hd: 0.135 },
  flicker: { t: [0.42, 0.5, 0.24], limb: 0.1, sh: 0.08, hd: 0.14 },
  shade: { t: [0.44, 0.5, 0.24], limb: 0.1, sh: 0.07, hd: 0.135 },
  trapper: { t: [0.56, 0.58, 0.36], limb: 0.135, sh: 0.11, hd: 0.15 },
  skyhawk: { t: [0.5, 0.56, 0.32], limb: 0.125, sh: 0.1, hd: 0.14 },
  riftwalker: { t: [0.48, 0.54, 0.28], limb: 0.11, sh: 0.09, hd: 0.14 },
  halo: { t: [0.44, 0.54, 0.26], limb: 0.105, sh: 0.08, hd: 0.14 },
  serene: { t: [0.46, 0.56, 0.27], limb: 0.105, sh: 0.08, hd: 0.14 },
  pylon: { t: [0.56, 0.58, 0.36], limb: 0.135, sh: 0.11, hd: 0.145 },
  zephyr: { t: [0.46, 0.5, 0.26], limb: 0.11, sh: 0.09, hd: 0.14 },
  cantor: { t: [0.5, 0.54, 0.3], limb: 0.115, sh: 0.09, hd: 0.14 },
  siphon: { t: [0.44, 0.52, 0.26], limb: 0.105, sh: 0.075, hd: 0.14 },
  sion: { t: [0.86, 0.66, 0.5], limb: 0.22, sh: 0.28, hd: 0.16 },
  stormcaller: { t: [0.44, 0.52, 0.26], limb: 0.105, sh: 0.08, hd: 0.14 },
  ricochet: { t: [0.5, 0.54, 0.3], limb: 0.115, sh: 0.09, hd: 0.14 },
  mirage: { t: [0.42, 0.5, 0.24], limb: 0.1, sh: 0.075, hd: 0.135 },
  lantern: { t: [0.48, 0.55, 0.28], limb: 0.11, sh: 0.085, hd: 0.14 },
  thorn: { t: [0.46, 0.54, 0.27], limb: 0.108, sh: 0.08, hd: 0.14 },
};

// Each look can supply: head(k,m) torso(k,m) arm(k,m,side) leg(k,m,side) back(add,m) hand(k,m,side) plus flags
// m = { cp, cs, ca, dark, skin, c, r, tw, th, td, limb, hair, anim }
const W = '#f4f1e6';
const LOOKS = {
  // ---------------------------------------------------------------- TANKS
  bulwark: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; k.box(cp, [0, 0.03, 0], [r * 2.4, r * 2.15, r * 2.3], [0, 0, 0], 0.06); k.box(ca, [0, r * 0.1, r * 1.16], [r * 2.0, r * 0.5, 0.03]); k.box(cs, [0, r * 1.15, 0], [r * 0.6, r * 0.3, r * 2.3]); for (const sx of [-1, 1]) k.box(dark, [sx * r * 1.2, 0, r * 0.2], [0.03, r * 1.2, r * 0.9]); k.box(cs, [0, -r * 0.8, r * 0.7], [r * 1.5, r * 0.6, r * 1.0], [0, 0, 0], 0.03); },
    torso(k, m) { const { cp, cs, ca, tw, th, td } = m; k.box(cs, [0, th * 0.62, td * 0.5 + 0.02], [tw * 0.82, th * 0.55, 0.07], [0, 0, 0], 0.03); ext(k, ca, 'polygon', 0.2, 0.03, [0, th * 0.62, td * 0.5 + 0.07], [0, 0, 0], { points: 6 }); k.box(cs, [0, th - 0.02, 0], [tw * 1.0, 0.12, td * 1.1], [0, 0, 0], 0.04); },
    arm(k, m, side) { const { cp, cs, ca, dark, limb } = m; k.box(cs, [0, 0.03, 0], [limb * 2.1, 0.22, limb * 2.1], [0, 0, side * 10], 0.06); k.box(cp, [0, -0.12, 0], [limb * 1.6, 0.12, limb * 1.6], [0, 0, 0], 0.04); if (side > 0) { k.cyl(dark, [0, -0.5, 0], limb * 0.9, 0.2, [0, 0, 0], 12); tor(k, ca, limb * 0.95, 0.02, [0, -0.4, 0], [0, 0, 0]); } },
    leg(k, m) { const { cs, limb } = m; k.box(cs, [0, -0.36, limb * 0.8], [limb * 1.5, 0.2, limb * 0.5], [0, 0, 0], 0.05); k.box(cs, [0, -0.62, 0.02], [limb * 1.4, 0.2, limb * 1.5], [0, 0, 0], 0.04); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Projector', (k) => { k.box(cs, [0, 0.28, 0], [tw * 0.8, 0.5, 0.22], [0, 0, 0], 0.04); for (const sx of [-1, 1]) { k.cyl(dark, [sx * 0.18, 0.62, -0.02], 0.07, 0.28, [0, 0, 0], 10); k.cyl(ca, [sx * 0.18, 0.78, -0.02], 0.05, 0.04, [0, 0, 0], 10); } k.cyl(ca, [0, 0.3, -0.12], 0.13, 0.06, [90, 0, 0], 14); }, 0, 0.1, -td / 2 - 0.12); },
  },
  mauler: {
    head(k, m) { const { cp, cs, ca, dark, skin, r } = m; for (let i = -2; i <= 2; i++) cone(k, cs, 0.04, 0.2 - Math.abs(i) * 0.03, [0, r * 1.05 + 0.03, i * 0.055], [i * 8, 0, 0], 6); k.box(dark, [0, -r * 0.35, r * 0.9], [r * 1.6, r * 0.7, 0.05]); for (const sx of [-1, 1]) k.cyl(cs, [sx * r * 0.62, -r * 0.45, r * 1.0], r * 0.28, 0.1, [90, 0, 0], 10); k.cyl(glow(m.c.accent, 3), [r * 0.38, r * 0.2, r * 0.98], r * 0.3, 0.05, [90, 0, 0], 12); k.box(dark, [0, r * 0.2, r * 0.95], [r * 2.0, r * 0.1, 0.03]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; tor(k, dark, 0.3, 0.09, [tw * 0.3, th * 0.7, 0], [0, 0, 55], [1, 1, 1], 18); k.box(dark, [-tw * 0.15, th * 0.45, td * 0.5 + 0.02], [tw * 0.5, th * 0.7, 0.05], [0, 0, 0], 0.02); for (const [x, y] of [[-0.2, 0.2], [0.05, 0.45], [-0.25, 0.5]]) k.cyl(ca, [x, y, td * 0.5 + 0.06], 0.025, 0.03, [90, 0, 0], 6); },
    arm(k, m, side) { const { cp, cs, ca, dark, limb } = m; if (side < 0) { k.box(cs, [0, 0.0, 0], [limb * 2.5, 0.3, limb * 2.5], [0, 0, 8], 0.04); for (const [x, z] of [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.12], [0.12, -0.12]]) k.cyl(ca, [x, 0.17, z], 0.025, 0.03, [0, 0, 0], 6); k.box(cs, [0, -0.46, 0], [limb * 1.4, 0.26, limb * 1.4], [0, 0, 0], 0.03); } else { for (let i = 0; i < 4; i++) tor(k, dark, limb * 0.78, 0.03, [0, -0.2 - i * 0.1, 0], [90, 0, 0], null, 12); } },
    leg(k, m, side) { const { cs, dark, limb } = m; if (side > 0) k.box(dark, [0, -0.3, 0.02], [limb * 1.5, 0.4, limb * 1.6], [0, 0, 0], 0.03); else { k.box(cs, [0, -0.2, limb * 0.7], [limb * 1.3, 0.14, 0.05]); k.cyl(cs, [0, -0.5, 0], limb * 0.8, 0.1, [0, 0, 0], 8); } },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Scrap', (k) => { k.box(dark, [0.12, 0.3, 0], [0.4, 0.55, 0.24], [0, 0, 10], 0.03); for (const x of [-0.18, -0.06]) k.cyl(cs, [x, 0.66, 0], 0.06, 0.6, [0, 0, 14], 8); for (const x of [-0.2, -0.08]) cone(k, glow(m.c.accent, 3), 0.045, 0.1, [x - 0.07, 1.0, 0], [0, 0, 14], 6); for (let i = 0; i < 3; i++) tor(k, cs, 0.12, 0.025, [0.28, 0.12 + i * 0.06, -0.1], [90, 0, 0], null, 10); }, 0, 0.1, -td / 2 - 0.14); },
  },
  orbit: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.12, [0, r * 0.1, -r * 0.05], [1, 1.05, 1.05], [0, 0, 0], 105); sph(k, h, r * 0.55, [0, r * 1.15, -r * 0.4]); k.box(h, [0, -r * 0.5, -r * 0.95], [r * 0.7, r * 2.4, r * 0.5], [4, 0, 0], 0.05); for (const sx of [-1, 1]) { k.cyl(dark, [sx * r * 0.5, r * 0.95, r * 0.3], r * 0.34, 0.07, [60, 0, 0], 10); k.cyl(glow(m.c.accent, 3), [sx * r * 0.5, r * 0.95, r * 0.37], r * 0.24, 0.02, [60, 0, 0], 10); } k.box(dark, [0, r * 0.7, r * 0.4], [r * 2.0, r * 0.08, r * 0.1], [-30, 0, 0]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (const sx of [-1, 1]) k.box(cs, [sx * tw * 0.3, th * 0.7, td * 0.5 + 0.015], [tw * 0.2, th * 0.5, 0.03], [0, 0, sx * -16], 0.01); for (const sx of [-1, 1]) k.box(cp, [sx * 0.1, -0.36, -0.1], [0.2, 0.7, 0.05], [8, 0, sx * 4], 0.02); for (let i = 0; i < 3; i++) sph(k, glow(m.c.accent, 3), 0.025, [-0.15 + i * 0.15, 0.04, td * 0.5 + 0.02]); },
    arm(k, m, side) { const { cs, ca, limb } = m; tor(k, ca, limb * 0.8, 0.018, [0, -0.5, 0], [0, 0, 0], null, 14); tor(k, ca, limb * 0.8, 0.014, [0, -0.44, 0], [0, 0, 0], null, 14); },
    leg(k, m) { const { cs, dark, limb } = m; k.box(cs, [0, -0.5, 0], [limb * 1.4, 0.4, limb * 1.5], [0, 0, 0], 0.04); },
    back(add, m) { const { ca, dark, td } = m; const a = add('Orbiters', (k) => { for (let i = 0; i < 3; i++) { const an = i * 2.09; sph(k, glow(m.c.accent, 3), 0.055, [Math.cos(an) * 0.52, 0.0 + Math.sin(an * 2) * 0.1, Math.sin(an) * 0.52]); } tor(k, glow(m.c.accent, 1.2), 0.52, 0.007, [0, 0, 0], [0, 0, 0], null, 40); }, 0, 0.3, 0); m.anim.push({ node: a, kind: 'spin', axis: [0, 1, 0], speed: 70 }); const g = add('GravRing', (k) => { tor(k, glow('#b78bff', 1.4), 0.46, 0.012, [0, 0, 0], [90, 0, 0], null, 40); tor(k, glow('#b78bff', 1.0), 0.36, 0.01, [0, 0, 0], [90, 0, 0], null, 36); }, 0, 0.5, -td / 2 - 0.35); m.anim.push({ node: g, kind: 'spin', axis: [0, 0, 1], speed: -40 }); },
  },
  wrecker: {
    torsoSkin: true,
    head(k, m) { const { cp, cs, ca, dark, skin, r } = m; k.box(ca, [0, r * 0.45, 0], [r * 2.1, r * 0.3, r * 2.1], [0, 0, 0], 0.03); for (const sx of [-1, 1]) { k.box(dark, [sx * r * 0.42, r * 0.28, r * 1.02], [r * 0.6, r * 0.12, 0.03], [0, 0, sx * -8]); sph(k, skin, r * 0.28, [sx * r * 1.0, 0, 0], [0.5, 1, 0.8]); } k.box(skin, [0, -r * 0.9, r * 0.35], [r * 1.5, r * 0.55, r * 1.2], [0, 0, 0], 0.04); k.box(mat('#d8d8de'), [0, -r * 0.65, r * 0.98], [r * 1.0, r * 0.14, 0.04]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cp, [0, 0.04, 0], [tw * 1.05, 0.2, td * 1.1], [0, 0, 0], 0.04); k.box(mat('#e6c34a', { metallic: 0.7, roughness: 0.3 }), [0, 0.06, td * 0.5 + 0.03], [0.34, 0.22, 0.05], [0, 0, 0], 0.03); ext(k, ca, 'star', 0.12, 0.03, [0, 0.06, td * 0.5 + 0.07]); for (const sx of [-1, 1]) k.box(dark, [sx * tw * 0.25, th * 0.55, td * 0.5 + 0.015], [0.06, th * 0.95, 0.03], [0, 0, sx * -24]); },
    arm(k, m, side) { const { cp, cs, ca, dark, skin, limb } = m; for (let i = 0; i < 3; i++) k.box(mat('#e9e4d6'), [0, -0.24 - i * 0.07, 0], [limb * 1.12, 0.04, limb * 1.12]); k.cyl(mat('#8e949f', { metallic: 0.8, roughness: 0.3 }), [limb * 0.7, -0.28, 0], 0.03, 0.34, [0, 0, 0], 8); k.cyl(ca, [limb * 0.7, -0.14, 0], 0.045, 0.03, [0, 0, 0], 8); k.box(dark, [0, -0.64, 0.03], [0.34, 0.34, 0.38], [0, 0, 0], 0.07); for (const x of [-0.12, 0, 0.12]) k.box(ca, [x, -0.64, 0.23], [0.07, 0.28, 0.04]); },
    leg(k, m) { const { cp, cs, dark, limb } = m; k.box(cp, [0, -0.16, 0.0], [limb * 1.55, 0.4, limb * 1.6], [0, 0, 0], 0.05); k.box(mat('#e9e4d6'), [0, -0.68, 0.04], [limb * 1.35, 0.1, limb * 1.7]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Pump', (k) => { k.box(dark, [0, 0.26, 0], [tw * 0.7, 0.4, 0.2], [0, 0, 0], 0.04); for (const sx of [-1, 1]) { k.cyl(mat('#8e949f', { metallic: 0.8 }), [sx * 0.17, 0.58, 0], 0.045, 0.3, [0, 0, 0], 8); k.cyl(ca, [sx * 0.17, 0.45, 0], 0.06, 0.04, [0, 0, 0], 8); } }, 0, 0.1, -td / 2 - 0.1); },
  },
  bastille: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; k.box(cp, [0, r * 0.1, 0], [r * 2.2, r * 1.7, r * 2.2], [0, 0, 0], 0.07); k.box(ca, [0, r * 0.15, r * 1.12], [r * 1.7, r * 0.2, 0.03]); k.box(cs, [0, -r * 0.2, -r * 1.0], [r * 2.2, r * 1.5, r * 0.5], [0, 0, 0], 0.04); for (const sx of [-1, 1]) k.box(cs, [sx * r * 1.15, -r * 0.2, 0], [0.04, r * 1.2, r * 1.3]); for (let i = 0; i < 4; i++) k.box(cs, [-r * 0.9 + i * r * 0.6, r * 0.95, 0], [r * 0.3, 0.02, r * 2.0], [0, 0, 0]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.55, td * 0.5 + 0.03], [tw * 0.9, th * 0.7, 0.08], [0, 0, 0], 0.04); for (let i = 0; i < 9; i++) k.cyl(glow(m.c.accent, 1.6), [-0.34 + i * 0.085, th * 0.85 - i * 0.08, td * 0.5 + 0.1], 0.028, 0.09, [90, 0, 0], 6); k.box(dark, [0, th * 0.85, td * 0.5 + 0.06], [0.06, 0.6, 0.02], [0, 0, 45]); },
    arm(k, m, side) { const { cp, cs, ca, dark, limb } = m; for (let i = 0; i < 3; i++) k.box(i % 2 ? cp : cs, [0, 0.07 - i * 0.07, 0], [limb * (2.5 - i * 0.2), 0.1, limb * (2.3 - i * 0.15)], [0, 0, side * 6], 0.03); k.box(cs, [0, -0.32, limb * 0.5], [limb * 1.3, 0.14, 0.06]); },
    leg(k, m) { const { cp, cs, dark, limb } = m; k.box(cs, [0, -0.36, limb * 0.8], [limb * 1.6, 0.26, limb * 0.5], [0, 0, 0], 0.05); k.box(cs, [0, -0.1, 0], [limb * 1.6, 0.28, limb * 1.7], [0, 0, 0], 0.04); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Drum', (k) => { k.cyl(dark, [0, 0.3, 0], 0.26, 0.4, [0, 0, 90], 16); k.cyl(cs, [0, 0.3, 0], 0.28, 0.06, [0, 0, 90], 16); k.cyl(dark, [0.25, 0.3, 0.15], 0.04, 0.5, [60, 0, 90], 6); }, 0, 0.12, -td / 2 - 0.22); },
  },
  // ---------------------------------------------------------------- DAMAGE
  sabre: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; k.box(cp, [0, r * 0.55, 0], [r * 2.15, r * 1.0, r * 2.2], [0, 0, 0], 0.04); k.box(dark, [0, r * 0.12, r * 0.95], [r * 1.6, r * 0.34, 0.05]); k.box(ca, [0, r * 0.12, r * 1.0], [r * 1.35, r * 0.1, 0.02]); k.box(dark, [r * 1.0, -r * 0.2, r * 0.55], [0.02, 0.02, r * 1.0], [0, 20, 0]); sph(k, ca, 0.012, [r * 0.85, -r * 0.3, r * 1.05]); k.box(cs, [0, -r * 0.9, r * 0.3], [r * 1.5, 0.02, r * 0.4]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(dark, [0, th * 0.55, td * 0.5 + 0.03], [tw * 0.9, th * 0.7, 0.08], [0, 0, 0], 0.03); for (const x of [-0.14, 0, 0.14]) k.box(cs, [x, th * 0.3, td * 0.5 + 0.09], [0.1, 0.12, 0.05], [0, 0, 0], 0.01); k.box(ca, [tw * 0.3, th * 0.8, td * 0.5 + 0.08], [0.1, 0.06, 0.02]); },
    arm(k, m) { const { dark, limb } = m; k.box(dark, [0, -0.28, 0], [limb * 1.25, 0.1, limb * 1.25], [0, 0, 0], 0.02); k.box(dark, [0, -0.04, 0.0], [limb * 1.2, 0.08, limb * 1.2], [0, 0, 0], 0.02); },
    leg(k, m) { const { cs, dark, limb } = m; k.box(dark, [0, -0.38, limb * 0.7], [limb * 1.3, 0.14, 0.05]); k.box(cs, [limb * 0.75, -0.2, 0], [0.07, 0.18, limb * 1.0], [0, 0, 0], 0.02); },
    back(add, m) { const { cs, ca, dark, tw, td } = m; add('Pack', (k) => { k.box(cs, [0, 0.3, 0], [tw * 0.8, 0.46, 0.16], [0, 0, 0], 0.03); k.box(ca, [0.12, 0.45, -0.09], [0.06, 0.2, 0.03]); k.cyl(dark, [-0.12, 0.72, 0], 0.012, 0.4, [0, 0, 0], 6); k.cyl(mat('#6b6e55'), [0, 0.12, -0.14], 0.07, 0.4, [0, 0, 90], 8); }, 0, 0.1, -td / 2 - 0.08); },
  },
  ranger: {
    head(k, m) { const { cp, cs, ca, dark, skin, r, hair } = m, felt = mat('#5b3b22', { roughness: 0.8 }); k.cyl(felt, [0, r * 0.75, 0], r * 2.45, 0.03, [0, 0, 0], 20); k.cyl(felt, [0, r * 1.3, 0], r * 1.0, r * 1.1, [0, 0, 0], 16, r * 1.2); k.cyl(ca, [0, r * 0.95, 0], r * 1.22, 0.05, [0, 0, 0], 16); k.box(mat('#b8372e'), [0, -r * 0.55, r * 0.7], [r * 1.7, r * 0.8, r * 1.0], [0, 0, 0], 0.03); k.box(mat('#b8372e'), [r * 0.7, -r * 0.7, -r * 0.1], [0.12, 0.2, 0.05], [0, 0, -20]); k.box(mat(hair), [0, -r * 0.2, r * 0.98], [r * 1.2, r * 0.1, 0.03]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.6, td * 0.5 + 0.02], [tw * 0.92, th * 0.7, 0.05], [0, 0, 0], 0.02); ext(k, mat('#e6c34a', { metallic: 0.8, roughness: 0.3 }), 'star', 0.1, 0.03, [-tw * 0.22, th * 0.72, td * 0.5 + 0.06]); k.box(dark, [0, th * 0.55, td * 0.5 + 0.04], [0.07, th * 1.3, 0.03], [0, 0, 38]); for (let i = 0; i < 5; i++) k.cyl(mat('#e6c34a', { metallic: 0.7 }), [-0.17 + i * 0.085, th * 0.28 + i * 0.1, td * 0.5 + 0.07], 0.024, 0.07, [90, 0, 0], 6); k.box(dark, [0, 0.04, 0], [tw * 1.05, 0.1, td * 1.1]); k.box(mat('#e6c34a', { metallic: 0.8 }), [0, 0.04, td * 0.5 + 0.05], [0.12, 0.09, 0.03]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.5, 0], [limb * 1.05, 0.18, limb * 1.05], [0, 0, 0], 0.02); if (side > 0) k.box(dark, [limb * 0.4, -0.36, 0], [0.06, 0.04, limb * 1.0]); },
    leg(k, m, side) { const { cs, ca, dark, limb } = m; k.box(mat('#5b3b22', { roughness: 0.85 }), [0, -0.16, 0.0], [limb * 1.5, 0.42, limb * 1.6], [0, 0, 0], 0.03); for (let i = 0; i < 4; i++) k.box(mat('#5b3b22'), [0, -0.38 - i * 0.04, limb * 0.82], [limb * 1.3, 0.03, 0.04]); cone(k, ca, 0.03, 0.09, [0, -0.8, -limb * 1.0], [-90, 0, 0], 6); tor(k, ca, 0.04, 0.01, [0, -0.8, -limb * 0.95], [0, 90, 0], null, 10); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Poncho', (k) => { k.box(cs, [0, -0.3, 0], [tw * 1.45, 0.62, 0.07], [4, 0, 0], 0.02); k.box(ca, [0, -0.6, 0.0], [tw * 1.45, 0.05, 0.075], [4, 0, 0]); k.cyl(mat('#6b5a3a'), [0, 0.02, -0.07], 0.07, tw * 1.3, [0, 0, 90], 8); }, 0, m.th - 0.04, -td / 2 - 0.05); },
  },
  cinder: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; const f1 = glow(m.c.accent, 2.6), f2 = glow('#ff6a1a', 2.8); for (let i = -3; i <= 3; i++) cone(k, i % 2 ? f1 : f2, 0.07, 0.28 - Math.abs(i) * 0.03, [i * 0.06, r * 1.1 + 0.05, -0.02 - Math.abs(i) * 0.012], [-14 - Math.abs(i) * 4, 0, -i * 7], 6); for (const sx of [-1, 1]) k.box(glow('#ffd23f', 3.6), [sx * r * 0.4, r * 0.05, r * 0.98], [r * 0.3, r * 0.14, 0.02]); k.box(dark, [0, -r * 0.7, r * 0.5], [r * 1.6, r * 0.8, r * 1.2], [0, 0, 0], 0.03); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cp, [0, th * 0.5, td * 0.5 + 0.02], [tw * 1.0, th * 1.0, 0.04], [0, 0, 0], 0.03); for (const sx of [-1, 1]) k.box(glow('#ff6a1a', 2.6), [sx * 0.05, th * 0.5, td * 0.5 + 0.05], [0.025, th * 0.9, 0.015], [0, 0, sx * 6]); k.box(cs, [0, th - 0.04, 0], [tw * 1.08, 0.14, td * 1.15], [0, 0, 0], 0.04); tor(k, ca, 0.2, 0.015, [0, 0.05, 0], [90, 0, 0], [1, 1.2, 1]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; if (side > 0) { k.box(dark, [0, -0.42, 0], [limb * 1.5, 0.28, limb * 1.5], [0, 0, 0], 0.04); k.box(glow('#ff6a1a', 2.4), [0, -0.42, limb * 0.8], [limb * 0.8, 0.06, 0.02]); } else k.box(ca, [0, -0.24, 0], [limb * 1.15, 0.03, limb * 1.15]); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.62, 0.02], [limb * 1.4, 0.3, limb * 1.6], [0, 0, 0], 0.03); k.box(glow('#ff6a1a', 2.2), [0, -0.5, limb * 0.8], [limb * 1.0, 0.03, 0.02]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; const a = add('Coat', (k) => { k.box(cp, [-0.1, -0.35, 0], [0.22, 0.8, 0.05], [6, 0, 5], 0.02); k.box(cp, [0.1, -0.35, 0], [0.22, 0.8, 0.05], [6, 0, -5], 0.02); k.box(ca, [-0.1, -0.74, 0.0], [0.22, 0.03, 0.055], [6, 0, 5]); k.box(ca, [0.1, -0.74, 0.0], [0.22, 0.03, 0.055], [6, 0, -5]); k.cyl(dark, [0.15, 0.3, -0.1], 0.025, 0.5, [0, 0, 18], 6); k.cyl(dark, [0.2, 0.3, -0.1], 0.025, 0.5, [0, 0, 22], 6); }, 0, 0.1, -td / 2 - 0.02); const em = add('Embers', (k) => { for (let i = 0; i < 4; i++) { const an = i * 1.57; sph(k, glow('#ffb02e', 3.4), 0.035, [Math.cos(an) * 0.5, Math.sin(an * 1.7) * 0.15, Math.sin(an) * 0.5]); } }, 0, 0.5, 0); m.anim.push({ node: em, kind: 'spin', axis: [0, 1, 0], speed: 90 }); },
  },
  vesper: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; dome(k, cp, r * 1.3, [0, r * 0.18, -r * 0.3], [1, 1.1, 1.05], [0, 0, 0], 125); cone(k, cp, r * 0.9, r * 1.6, [0, r * 0.4, -r * 1.2], [-70, 0, 0], 8); k.box(cs, [0, -r * 0.55, r * 0.5], [r * 1.9, r * 0.9, r * 1.4], [0, 0, 0], 0.04); k.box(dark, [0, r * 0.25, r * 1.08], [r * 1.8, r * 0.34, 0.05], [0, 0, 0], 0.02); k.cyl(glow(m.c.accent, 3.4), [-r * 0.45, r * 0.22, r * 1.14], r * 0.3, 0.05, [90, 0, 0], 12); k.cyl(dark, [r * 0.45, r * 0.22, r * 1.13], r * 0.2, 0.05, [90, 0, 0], 10); k.cyl(dark, [-r * 0.45, r * 0.22, r * 1.3], r * 0.34, 0.2, [90, 0, 0], 12); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (let i = 0; i < 5; i++) k.box(i % 2 ? cp : cs, [-0.17 + i * 0.085, th * 0.7 - i * 0.04, td * 0.5 + 0.02], [0.09, th * 0.9 - i * 0.04, 0.04], [0, 0, (i - 2) * 3], 0.01); k.box(dark, [0, th * 0.55, td * 0.5 + 0.05], [0.05, th * 1.4, 0.02], [0, 0, 35]); k.box(cs, [0, th - 0.02, 0.04], [tw * 0.86, 0.14, td * 1.25], [0, 0, 0], 0.04); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; for (let i = 0; i < 4; i++) k.box(cs, [0, -0.1 - i * 0.07, 0], [limb * 1.1, 0.04, limb * 1.1]); if (side > 0) { k.box(dark, [0, -0.46, 0], [limb * 1.25, 0.2, limb * 1.25], [0, 0, 0], 0.02); k.box(glow(m.c.accent, 3), [0, -0.46, limb * 0.66], [limb * 0.6, 0.06, 0.02]); } },
    leg(k, m) { const { cs, dark, limb } = m; for (let i = 0; i < 5; i++) k.box(cs, [0, -0.2 - i * 0.1, 0], [limb * 1.28, 0.04, limb * 1.4]); k.box(dark, [0, -0.7, 0.04], [limb * 1.4, 0.2, limb * 1.7], [0, 0, 0], 0.03); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; const a = add('Ghillie', (k) => { for (let i = 0; i < 7; i++) { const x = -0.2 + i * 0.066; k.box(i % 2 ? cp : cs, [x, -0.18 - (i % 3) * 0.06, 0], [0.07, 0.62 + (i % 3) * 0.12, 0.04], [6 + (i % 2) * 4, 0, (i - 3) * 3], 0.01); } k.cyl(mat('#31403a'), [0, 0.06, -0.06], 0.07, 0.5, [0, 0, 90], 8); }, 0, m.th - 0.04, -td / 2 - 0.04); m.anim.push({ node: a, kind: 'sway', amp: 3, speed: 1.6, base: [0, 0, 0] }); },
  },
  flicker: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.1, [0, r * 0.15, 0], [1, 1.02, 1.05], [0, 0, 0], 100); for (let i = -2; i <= 2; i++) cone(k, h, 0.05, 0.2 - Math.abs(i) * 0.025, [i * 0.065, r * 1.0 + 0.06, -0.01 + (i % 2) * 0.03], [-20, 0, -i * 14], 6); cone(k, h, 0.05, 0.2, [0, r * 0.7, -r * 1.05], [-130, 0, 0], 6); k.box(dark, [0, r * 0.3, r * 0.5], [r * 2.2, r * 0.12, r * 1.6], [-10, 0, 0]); for (const sx of [-1, 1]) { k.cyl(dark, [sx * r * 0.5, r * 0.2, r * 1.02], r * 0.5, 0.1, [90, 0, 0], 14); k.cyl(glow(m.c.accent, 3.4), [sx * r * 0.5, r * 0.2, r * 1.09], r * 0.38, 0.03, [90, 0, 0], 14); } },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.8, 0], [tw * 1.08, th * 0.3, td * 1.1], [0, 0, 0], 0.05); k.cyl(dark, [0, th * 0.55, td * 0.5 + 0.03], 0.14, 0.06, [90, 0, 0], 16); k.cyl(glow(m.c.accent, 3.2), [0, th * 0.55, td * 0.5 + 0.07], 0.1, 0.03, [90, 0, 0], 16); k.box(mat('#ffffff'), [0, th * 0.25, td * 0.5 + 0.02], [tw * 0.9, 0.04, 0.02]); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(cs, [0, -0.3, 0], [limb * 1.3, 0.1, limb * 1.3], [0, 0, 0], 0.03); k.box(mat('#ffffff'), [0, -0.12, 0], [limb * 1.12, 0.03, limb * 1.12]); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(mat('#ffffff'), [0, -0.78, 0.07], [limb * 1.5, 0.12, limb * 2.3], [0, 0, 0], 0.05); k.box(ca, [0, -0.84, 0.07], [limb * 1.55, 0.03, limb * 2.35]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Battery', (k) => { k.box(cs, [0, 0.3, 0], [0.34, 0.4, 0.16], [0, 0, 0], 0.03); for (const sx of [-1, 1]) { k.box(dark, [sx * 0.2, 0.34, -0.02], [0.03, 0.34, 0.1]); } k.box(glow(m.c.accent, 3), [0, 0.3, -0.09], [0.2, 0.06, 0.02]); }, 0, 0.1, -td / 2 - 0.08); const r = add('ChronoRing', (k) => { tor(k, glow(m.c.accent, 2.6), 0.16, 0.012, [0, 0, 0], [90, 0, 0], null, 24); for (let i = 0; i < 4; i++) { const a = i * 1.57; k.box(glow('#ffffff', 3), [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0], [0.025, 0.025, 0.025]); } }, 0, 0.3, m.td / 2 + 0.09); m.anim.push({ node: r, kind: 'spin', axis: [0, 0, 1], speed: 140 }); },
  },
  shade: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; dome(k, cs, r * 1.28, [0, r * 0.1, -r * 0.3], [1, 1.1, 1.05], [0, 0, 0], 135); cone(k, cs, r * 0.8, r * 1.5, [0, r * 0.2, -r * 1.2], [-75, 0, 0], 8); k.box(cp, [0, -r * 0.35, r * 0.62], [r * 1.9, r * 1.0, r * 1.2], [0, 0, 0], 0.04); k.box(dark, [0, r * 0.12, r * 1.1], [r * 1.7, r * 0.5, 0.05], [0, 0, 0], 0.02); k.box(glow(m.c.accent, 3.8), [0, r * 0.15, r * 1.14], [r * 1.35, r * 0.1, 0.03]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (let i = 0; i < 4; i++) k.box(i % 2 ? cp : cs, [0, th * 0.78 - i * 0.12, td * 0.5 + 0.015 + i * 0.004], [tw * (1.0 - i * 0.05), 0.15, 0.03], [0, 0, (i % 2 ? 4 : -4)], 0.01); for (const sx of [-1, 1]) k.box(glow(m.c.accent, 2.4), [sx * tw * 0.28, th * 0.4, td * 0.5 + 0.04], [0.015, th * 0.6, 0.01], [0, 0, sx * -10]); for (let i = 0; i < 3; i++) k.box(mat('#9aa0ad', { metallic: 0.8 }), [-0.14 + i * 0.07, 0.03, td * 0.5 + 0.03], [0.03, 0.1, 0.02], [0, 0, 20]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; for (let i = 0; i < 3; i++) k.box(i % 2 ? dark : cs, [0, -0.1 - i * 0.12, 0], [limb * 1.18, 0.08, limb * 1.18]); if (side < 0) k.box(glow(m.c.accent, 3), [limb * 0.6, -0.34, 0], [0.012, 0.3, 0.05]); },
    leg(k, m) { const { cs, dark, limb } = m; for (let i = 0; i < 5; i++) k.box(i % 2 ? dark : cs, [0, -0.15 - i * 0.12, 0], [limb * 1.25, 0.08, limb * 1.4]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; const a = add('Shroud', (k) => { for (let i = 0; i < 5; i++) { const x = -0.18 + i * 0.09; k.box(i % 2 ? cp : cs, [x, -0.38 - (i % 2) * 0.1, 0], [0.09, 0.86 + (i % 2) * 0.2, 0.03], [10, 0, (i - 2) * 4], 0.005); } k.box(cs, [0, 0.25, 0.0], [tw * 1.1, 0.14, 0.05]); }, 0, 0.45, -td / 2 - 0.04); m.anim.push({ node: a, kind: 'sway', amp: 5, speed: 2.1, base: [0, 0, 0] }); add('Blades', (k) => { for (const sx of [-1, 1]) k.box(mat('#9aa0ad', { metallic: 0.8 }), [sx * 0.08, 0.3, 0], [0.025, 0.4, 0.01], [0, 0, sx * 40]); }, 0, 0.35, -td / 2 - 0.1); },
  },
  trapper: {
    head(k, m) { const { cp, cs, ca, dark, skin, r, hair } = m, fur = mat('#d8d0c0', { roughness: 0.95 }), h = mat(hair); k.cyl(cp, [0, r * 0.95, 0], r * 0.95, r * 0.8, [0, 0, 0], 12, r * 1.05); tor(k, fur, r * 1.1, 0.07, [0, r * 0.55, 0], [90, 0, 0], null, 16); for (const sx of [-1, 1]) k.box(fur, [sx * r * 1.12, -r * 0.05, 0], [0.09, r * 1.5, r * 1.6], [0, 0, sx * 8], 0.03); k.box(h, [0, -r * 0.75, r * 0.7], [r * 1.5, r * 0.9, r * 0.9], [0, 0, 0], 0.05); k.box(dark, [0, r * 0.5, r * 1.0], [r * 1.5, r * 0.18, 0.04], [-5, 0, 0]); for (const sx of [-1, 1]) k.cyl(glow(m.c.accent, 1.6), [sx * r * 0.4, r * 0.5, r * 1.03], r * 0.2, 0.03, [90, 0, 0], 10); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m, fur = mat('#d8d0c0', { roughness: 0.95 }); tor(k, fur, 0.3, 0.1, [0, th - 0.03, 0], [90, 0, 0], [1, 1, 0.7], 16); k.box(cs, [0, th * 0.5, td * 0.5 + 0.02], [tw * 0.3, th * 1.0, 0.05]); k.box(dark, [0, th * 0.45, td * 0.5 + 0.04], [0.06, th * 1.3, 0.02], [0, 0, 40]); for (const sx of [-1, 1]) k.box(cs, [sx * tw * 0.3, 0.14, td * 0.5 + 0.08], [0.16, 0.18, 0.08], [0, 0, 0], 0.02); k.box(dark, [0, 0.04, 0], [tw * 1.06, 0.1, td * 1.1]); },
    arm(k, m) { const { cs, dark, limb } = m, fur = mat('#d8d0c0', { roughness: 0.95 }); k.box(fur, [0, -0.04, 0], [limb * 1.4, 0.12, limb * 1.4], [0, 0, 0], 0.04); k.box(dark, [0, -0.46, 0], [limb * 1.1, 0.2, limb * 1.1], [0, 0, 0], 0.03); },
    leg(k, m) { const { cs, dark, limb } = m, fur = mat('#d8d0c0', { roughness: 0.95 }); k.box(fur, [0, -0.52, 0], [limb * 1.6, 0.12, limb * 1.7], [0, 0, 0], 0.04); k.box(mat('#4a3728', { roughness: 0.9 }), [0, -0.68, 0.03], [limb * 1.4, 0.26, limb * 1.7], [0, 0, 0], 0.04); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Pack', (k) => { k.box(cs, [0, 0.32, 0], [tw * 0.9, 0.6, 0.26], [0, 0, 0], 0.05); k.cyl(mat('#7a6a4a'), [0, 0.7, -0.04], 0.11, tw * 0.9, [0, 0, 90], 10); tor(k, mat('#8e949f', { metallic: 0.8, roughness: 0.35 }), 0.14, 0.025, [0.04, 0.22, -0.15], [0, 0, 0], null, 14); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cone(k, mat('#8e949f', { metallic: 0.8 }), 0.02, 0.07, [0.04 + Math.cos(a) * 0.14, 0.22 + Math.sin(a) * 0.14, -0.15], [0, 0, (a * 180 / Math.PI) - 90], 4); } for (const x of [-0.14, 0.14]) k.cyl(ca, [x, 0.4, 0.14], 0.03, 0.14, [0, 0, 0], 6); }, 0, 0.1, -td / 2 - 0.15); },
  },
  skyhawk: {
    head(k, m) { const { cp, cs, ca, dark, r } = m; dome(k, cs, r * 1.18, [0, r * 0.12, 0], [1, 1.08, 1.08], [0, 0, 0], 110); k.box(dark, [0, r * 0.35, r * 0.7], [r * 2.1, r * 0.1, r * 0.8], [-20, 0, 0]); for (const sx of [-1, 1]) { k.cyl(dark, [sx * r * 0.5, r * 0.2, r * 1.0], r * 0.55, 0.12, [90, 0, 0], 14); k.cyl(glow(m.c.accent, 2.6), [sx * r * 0.5, r * 0.2, r * 1.07], r * 0.42, 0.03, [90, 0, 0], 14); k.cyl(cs, [sx * r * 1.15, 0, 0], r * 0.5, 0.1, [0, 0, 90], 12); } k.box(dark, [0, r * 0.2, 0], [r * 2.4, 0.06, 0.06]); k.cyl(dark, [r * 1.1, -r * 0.5, r * 0.55], 0.012, 0.3, [0, 20, 20], 6); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (const sx of [-1, 1]) k.box(dark, [sx * tw * 0.3, th * 0.55, td * 0.5 + 0.02], [0.07, th * 1.0, 0.03], [0, 0, sx * -6]); k.box(cs, [0, th * 0.75, td * 0.5 + 0.04], [tw * 0.5, 0.14, 0.06], [0, 0, 0], 0.02); ext(k, ca, 'arrow', 0.12, 0.03, [0, th * 0.4, td * 0.5 + 0.03]); k.box(dark, [0, 0.04, 0], [tw * 1.06, 0.12, td * 1.1]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; k.box(cs, [0, -0.46, 0], [limb * 1.25, 0.2, limb * 1.25], [0, 0, 0], 0.03); if (side > 0) { k.box(cs, [0, 0.05, 0], [limb * 2.0, 0.22, limb * 2.0], [0, 0, 8], 0.06); for (let i = 0; i < 3; i++) k.cyl(dark, [-0.06 + i * 0.06, 0.2, 0], 0.025, 0.1, [0, 0, 0], 6); } },
    leg(k, m) { const { cs, dark, limb } = m; k.box(cs, [0, -0.5, 0.02], [limb * 1.4, 0.3, limb * 1.55], [0, 0, 0], 0.04); k.box(dark, [0, -0.78, 0.05], [limb * 1.4, 0.14, limb * 1.9]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Jetpack', (k) => { k.box(cs, [0, 0.34, 0], [0.42, 0.5, 0.22], [0, 0, 0], 0.05); for (const sx of [-1, 1]) { k.cyl(cp, [sx * 0.26, 0.28, -0.04], 0.1, 0.6, [0, 0, 0], 12); k.cyl(dark, [sx * 0.26, -0.04, -0.04], 0.12, 0.08, [0, 0, 0], 12); cone(k, cs, 0.1, 0.16, [sx * 0.26, 0.66, -0.04], [0, 0, 0], 12); k.box(ca, [sx * 0.26, 0.28, -0.14], [0.05, 0.4, 0.02]); } k.box(dark, [0, 0.55, -0.12], [0.3, 0.1, 0.06]); }, 0, 0.1, -td / 2 - 0.14); const fl = []; for (const sx of [-1, 1]) { const f = add('Flame', (k) => { cone(k, glow('#ff9a3c', 3.2), 0.1, 0.5, [0, -0.25, 0], [180, 0, 0], 10); cone(k, glow('#fff1b0', 3.6), 0.05, 0.3, [0, -0.15, 0], [180, 0, 0], 8); }, sx * 0.26, 0.0, -td / 2 - 0.18); f.visible = false; fl.push(f); } m.flames = fl; },
  },
  riftwalker: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.1, [0, r * 0.14, -r * 0.04], [1, 1.04, 1.06], [0, 0, 0], 100); k.box(h, [-r * 0.5, r * 0.95, 0], [r * 0.9, r * 0.5, r * 1.9], [0, 0, 8], 0.05); tor(k, ca, r * 1.02, 0.012, [0, r * 0.6, 0], [90, 0, 0], null, 24); ext(k, glow(m.c.accent, 3), 'polygon', r * 0.5, 0.03, [0, r * 0.62, r * 1.04], [0, 0, 0], { points: 4 }); for (const sx of [-1, 1]) k.box(glow(m.c.accent, 1.8), [sx * r * 0.7, -r * 0.1, r * 0.8], [0.01, r * 0.5, 0.015], [0, 0, sx * 6]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.5, td * 0.5 + 0.015], [tw * 0.5, th * 0.95, 0.03]); for (const sx of [-1, 1]) { k.box(cp, [sx * tw * 0.32, th * 0.5, td * 0.5 + 0.03], [tw * 0.3, th * 1.0, 0.04], [0, 0, sx * -4], 0.02); k.box(glow(m.c.accent, 2.4), [sx * tw * 0.17, th * 0.5, td * 0.5 + 0.055], [0.015, th * 0.9, 0.01]); } for (let i = 0; i < 3; i++) tor(k, glow(m.c.accent, 2.2), 0.05, 0.01, [-0.15 + i * 0.15, 0.04, td * 0.5 + 0.03], [0, 0, 0], null, 10); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; if (side < 0) { tor(k, glow(m.c.accent, 2.8), limb * 1.3, 0.025, [0, -0.4, 0], [0, 0, 0], null, 20); k.cyl(dark, [0, -0.4, 0], limb * 1.1, 0.12, [0, 0, 0], 12); tor(k, glow(m.c.accent, 2.0), limb * 1.0, 0.015, [0, -0.3, 0], [0, 0, 0], null, 16); } else { k.box(cs, [0, -0.4, 0], [limb * 1.15, 0.22, limb * 1.15], [0, 0, 0], 0.03); k.box(glow(m.c.accent, 2.6), [0, -0.4, limb * 0.6], [0.03, 0.12, 0.01]); } },
    leg(k, m) { const { cs, ca, dark, limb } = m; tor(k, glow(m.c.accent, 2.0), limb * 0.95, 0.014, [0, -0.7, 0], [0, 0, 0], null, 14); k.box(dark, [0, -0.46, 0], [limb * 1.3, 0.4, limb * 1.45], [0, 0, 0], 0.03); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('CoatTails', (k) => { k.box(cp, [-0.1, -0.35, 0], [0.22, 0.8, 0.05], [8, 0, 4], 0.02); k.box(cp, [0.1, -0.35, 0], [0.22, 0.8, 0.05], [8, 0, -4], 0.02); k.box(glow(m.c.accent, 2.2), [0, -0.35, -0.02], [0.012, 0.76, 0.01], [8, 0, 0]); }, 0, 0.1, -td / 2 - 0.02); const p = add('Portal', (k) => { tor(k, glow(m.c.accent, 3.0), 0.34, 0.025, [0, 0, 0], [90, 0, 0], null, 36); tor(k, glow('#7fe7ff', 2.0), 0.26, 0.012, [0, 0, 0], [90, 0, 0], null, 30); k.cyl(mat('#0a0620', { emissive: '#4a1e8a', emissiveStrength: 0.8, opacity: 0.85, doubleSided: true }), [0, 0, 0], 0.26, 0.02, [90, 0, 0], 28); }, 0, 0.55, -td / 2 - 0.36); m.anim.push({ node: p, kind: 'spin', axis: [0, 0, 1], speed: 35 }); },
  },
  // ---------------------------------------------------------------- SUPPORT
  halo: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.1, [0, r * 0.12, -r * 0.06], [1, 1.05, 1.08], [0, 0, 0], 105); k.box(h, [0, -r * 0.6, -r * 1.0], [r * 0.5, r * 2.3, r * 0.5], [5, 0, 0], 0.05); sph(k, h, r * 0.3, [0, r * 0.6, -r * 1.05]); k.box(cs, [0, r * 0.6, r * 1.0], [r * 1.5, r * 0.14, 0.03], [-10, 0, 0]); for (const sx of [-1, 1]) cone(k, mat(W, { roughness: 0.4 }), 0.04, 0.2, [sx * r * 1.05, r * 0.6, 0.02], [0, 0, sx * -70], 6); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.62, td * 0.5 + 0.03], [tw * 0.7, th * 0.6, 0.05], [0, 0, 0], 0.03); k.box(ca, [0, th * 0.65, td * 0.5 + 0.07], [0.05, 0.22, 0.02]); k.box(ca, [0, th * 0.65, td * 0.5 + 0.07], [0.22, 0.05, 0.02]); for (const sx of [-1, 1]) k.box(cp, [sx * 0.1, -0.14, td * 0.5 + 0.01], [0.17, 0.4, 0.04], [0, 0, sx * -6], 0.02); k.box(cs, [0, 0.04, 0], [tw * 1.05, 0.08, td * 1.1]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; k.box(cs, [0, -0.44, 0], [limb * 1.3, 0.24, limb * 1.3], [0, 0, 0], 0.03); k.box(cs, [0, 0.0, 0], [limb * 1.5, 0.1, limb * 1.5], [0, 0, 0], 0.03); cone(k, mat(W, { roughness: 0.4 }), 0.03, 0.16, [side * limb * 0.9, -0.2, -limb * 0.5], [0, 0, side * 60], 6); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(cs, [0, -0.5, 0.02], [limb * 1.4, 0.4, limb * 1.5], [0, 0, 0], 0.03); k.box(ca, [0, -0.3, limb * 0.76], [limb * 1.0, 0.03, 0.02]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; const wings = []; for (const sx of [-1, 1]) { const w = add('Wing', (k) => { for (let i = 0; i < 5; i++) { k.box(glow('#fff7d6', 0.9), [sx * (0.2 + i * 0.13), 0.3 - i * 0.08, 0], [0.34 - i * 0.03, 0.08, 0.015], [0, 0, sx * (-18 - i * 5)], 0.005); k.box(mat('#fff7d6', { roughness: 0.4 }), [sx * (0.18 + i * 0.12), 0.38 - i * 0.06, -0.01], [0.3, 0.04, 0.012], [0, 0, sx * (-12 - i * 6)]); } }, sx * 0.08, m.th - 0.2, -td / 2 - 0.05); w.setEuler(0, sx * -18, 0); wings.push(w); m.anim.push({ node: w, kind: 'flap', amp: 6, speed: 1.4, base: [0, sx * -18, 0], side: sx }); } const hl = add('Halo', (k) => { tor(k, glow('#ffe9a0', 3.2), 0.19, 0.016, [0, 0, 0], [0, 0, 0], null, 28); }, 0, m.th + 0.44, 0); m.anim.push({ node: hl, kind: 'bob', amp: 0.02, speed: 2, base: [0, m.th + 0.44, 0] }); },
  },
  serene: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.1, [0, r * 0.1, -r * 0.05], [1, 1.05, 1.08], [0, 0, 0], 108); for (let i = 0; i < 5; i++) sph(k, h, r * (0.26 - i * 0.02), [r * 0.9, -r * 0.2 - i * r * 0.5, -r * 0.5 + i * 0.015]); for (const sx of [-1, 1]) { tor(k, mat('#c9a43a', { metallic: 0.7, roughness: 0.3 }), r * 0.4, 0.014, [sx * r * 0.45, r * 0.1, r * 1.0], [0, 0, 0], null, 14); k.cyl(glow(m.c.accent, 2.2), [sx * r * 0.45, r * 0.1, r * 1.0], r * 0.36, 0.01, [90, 0, 0], 12); } k.box(dark, [0, r * 0.1, r * 1.0], [r * 0.3, 0.015, 0.015]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (const sx of [-1, 1]) k.box(cs, [sx * tw * 0.3, th * 0.4, td * 0.5 + 0.03], [tw * 0.36, th * 1.2, 0.05], [0, 0, sx * -3], 0.02); ext(k, glow(m.c.accent, 2.4), 'star', 0.1, 0.02, [tw * 0.3, th * 0.7, td * 0.5 + 0.07], [0, 0, 0], { points: 4, inner: 0.35 }); tor(k, dark, 0.14, 0.015, [0, th - 0.02, 0.02], [70, 0, 0], null, 14); k.box(dark, [0, 0.03, 0], [tw * 1.0, 0.07, td * 1.08]); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(cs, [0, -0.2, 0], [limb * 1.45, 0.52, limb * 1.45], [0, 0, 0], 0.03); k.box(glow(m.c.accent, 2.4), [0, -0.46, limb * 0.76], [0.03, 0.14, 0.01]); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.5, 0.0], [limb * 1.3, 0.4, limb * 1.4], [0, 0, 0], 0.03); k.box(ca, [0, -0.7, limb * 0.8], [limb * 1.0, 0.03, 0.02]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Coat', (k) => { k.box(cs, [-0.1, -0.32, 0], [0.22, 0.86, 0.05], [8, 0, 3], 0.02); k.box(cs, [0.1, -0.32, 0], [0.22, 0.86, 0.05], [8, 0, -3], 0.02); }, 0, 0.1, -td / 2 - 0.02); add('Biotank', (k) => { k.box(dark, [0, 0.32, 0], [0.34, 0.5, 0.15], [0, 0, 0], 0.03); for (const sx of [-1, 1]) { k.cyl(mat('#ffffff', { opacity: 0.5 }), [sx * 0.1, 0.34, -0.02], 0.06, 0.44, [0, 0, 0], 10); k.cyl(glow(m.c.accent, 2.4), [sx * 0.1, 0.28, -0.02], 0.045, 0.3, [0, 0, 0], 10); } k.cyl(glow('#7fffa8', 2.4), [0, 0.58, -0.02], 0.025, 0.12, [0, 0, 90], 8); }, 0, 0.1, -td / 2 - 0.12); },
  },
  pylon: {
    head(k, m) { const { cp, cs, ca, dark, skin, r, hair } = m, h = mat(hair); dome(k, ca, r * 1.2, [0, r * 0.3, 0], [1, 0.9, 1.1], [0, 0, 0], 95); k.box(ca, [0, r * 0.35, r * 0.9], [r * 1.9, 0.04, r * 0.75]); k.box(mat('#ffffff'), [0, r * 1.15, 0], [0.04, 0.04, r * 2.1]); for (const sx of [-1, 1]) { k.cyl(dark, [sx * r * 0.45, r * 0.7, r * 0.6], r * 0.32, 0.1, [60, 0, 0], 10); k.cyl(glow('#7fe7ff', 2.0), [sx * r * 0.45, r * 0.7, r * 0.66], r * 0.22, 0.02, [60, 0, 0], 10); } k.box(h, [0, -r * 0.7, r * 0.7], [r * 1.5, r * 0.8, r * 0.8], [0, 0, 0], 0.05); k.box(dark, [0, -r * 0.35, r * 1.0], [r * 1.0, r * 0.1, 0.03]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.6, td * 0.5 + 0.02], [tw * 0.8, th * 0.7, 0.04]); for (const sx of [-1, 1]) k.box(cp, [sx * tw * 0.28, th * 0.65, td * 0.5 + 0.05], [0.07, th * 0.95, 0.03]); k.box(cp, [0, th * 0.25, td * 0.5 + 0.04], [tw * 0.6, th * 0.5, 0.05], [0, 0, 0], 0.02); k.box(dark, [0, th * 0.35, td * 0.5 + 0.08], [0.2, 0.14, 0.04]); for (const x of [-0.06, 0, 0.06]) k.cyl(ca, [x, th * 0.4, td * 0.5 + 0.11], 0.015, 0.05, [0, 0, 0], 5); k.box(mat('#6b4a2c', { roughness: 0.8 }), [0, 0.05, 0], [tw * 1.08, 0.12, td * 1.12]); k.box(dark, [-tw * 0.3, -0.02, td * 0.5 + 0.06], [0.1, 0.16, 0.05]); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.5, 0], [limb * 1.15, 0.2, limb * 1.15], [0, 0, 0], 0.02); k.box(cs, [0, -0.2, 0], [limb * 1.1, 0.34, limb * 1.1]); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.38, limb * 0.78], [limb * 1.3, 0.16, 0.06]); k.box(mat('#5a4a32', { roughness: 0.9 }), [0, -0.7, 0.04], [limb * 1.4, 0.22, limb * 1.8], [0, 0, 0], 0.03); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Gear', (k) => { k.box(cs, [0, 0.3, 0], [tw * 0.9, 0.5, 0.24], [0, 0, 0], 0.04); k.cyl(dark, [-0.16, 0.74, -0.05], 0.018, 0.6, [0, 0, 0], 6); sph(k, ca, 0.04, [-0.16, 1.05, -0.05]); k.box(ca, [0.12, 0.55, -0.14], [0.08, 0.2, 0.03]); tor(k, dark, 0.13, 0.03, [0.1, 0.15, -0.16], [0, 0, 0], null, 14); k.box(mat('#8e949f', { metallic: 0.8 }), [0.34, -0.04, 0.0], [0.05, 0.5, 0.05], [0, 0, 8]); tor(k, mat('#8e949f', { metallic: 0.8 }), 0.07, 0.03, [0.36, 0.26, 0.0], [0, 90, 0], null, 12); }, 0, 0.1, -td / 2 - 0.14); },
  },
  zephyr: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); sph(k, h, r * 1.2, [0, r * 0.55, -r * 0.2], [1.15, 0.95, 1.05]); for (const sx of [-1, 1]) { k.cyl(dark, [sx * r * 1.15, 0, 0], r * 0.75, 0.15, [0, 0, 90], 14); k.cyl(glow(m.c.accent, 3), [sx * r * 1.25, 0, 0], r * 0.5, 0.04, [0, 0, 90], 14); } tor(k, dark, r * 1.18, 0.03, [0, 0, 0], [90, 90, 0], [1, 1, 1], 24); k.box(dark, [0, r * 0.15, r * 1.0], [r * 1.9, r * 0.28, 0.03]); k.box(glow(m.c.accent, 2.6), [0, r * 0.15, r * 1.02], [r * 1.6, r * 0.06, 0.02]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.85, 0], [tw * 1.05, th * 0.3, td * 1.1], [0, 0, 0], 0.05); for (const sx of [-1, 1]) k.box(glow(m.c.accent, 2.4), [sx * tw * 0.3, th * 0.45, td * 0.5 + 0.02], [0.03, th * 0.8, 0.01], [0, 0, sx * -10]); k.box(mat('#ffffff'), [0, th * 0.2, td * 0.5 + 0.015], [tw * 1.02, 0.04, 0.01]); for (let i = 0; i < 3; i++) k.cyl(glow(m.c.accent, 3), [-0.1 + i * 0.1, th * 0.6, td * 0.5 + 0.03], 0.02, 0.02, [90, 0, 0], 6); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(glow(m.c.accent, 2.2), [0, -0.2, limb * 0.58], [0.025, 0.4, 0.01]); k.box(dark, [0, -0.46, 0], [limb * 1.3, 0.2, limb * 1.3], [0, 0, 0], 0.04); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.62, 0.06], [limb * 1.4, 0.2, limb * 2.0], [0, 0, 0], 0.04); for (const z of [-0.12, 0.2]) { k.cyl(dark, [0, -0.82, z], 0.06, limb * 1.5, [0, 0, 90], 12); k.cyl(glow(m.c.accent, 2.6), [0, -0.82, z], 0.04, limb * 1.55, [0, 0, 90], 10); } },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; const sp = add('Speaker', (k) => { k.box(dark, [0, 0.3, 0], [tw * 0.9, 0.48, 0.2], [0, 0, 0], 0.04); for (const sy of [0.18, 0.42]) { k.cyl(cs, [0, sy, -0.11], 0.1, 0.03, [90, 0, 0], 14); k.cyl(glow(m.c.accent, 2.4), [0, sy, -0.13], 0.05, 0.02, [90, 0, 0], 14); } k.cyl(dark, [0.18, 0.62, -0.05], 0.015, 0.4, [0, 0, 0], 6); }, 0, 0.1, -td / 2 - 0.1); m.anim.push({ node: sp, kind: 'pulse', amp: 0.04, speed: 5, base: [1, 1, 1] }); },
  },
  cantor: {
    head(k, m) { const { cp, cs, ca, dark, skin, r } = m; for (const sx of [-1, 1]) { sph(k, skin, r * 0.28, [sx * r * 1.0, 0, 0], [0.5, 1, 0.8]); tor(k, mat('#e6c34a', { metallic: 0.7 }), 0.02, 0.006, [sx * r * 1.05, -r * 0.35, 0], [0, 90, 0], null, 8); } k.box(mat('#2a2018'), [0, -r * 0.8, r * 0.6], [r * 0.8, r * 0.3, r * 0.5], [0, 0, 0], 0.03); sph(k, glow(m.c.accent, 3.4), r * 0.1, [0, r * 0.45, r * 1.0]); k.box(dark, [0, r * 0.35, r * 1.0], [r * 0.5, 0.012, 0.02]); for (const sx of [-1, 1]) k.box(dark, [sx * r * 0.4, r * 0.12, r * 1.0], [r * 0.4, 0.014, 0.02]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [tw * 0.1, th * 0.55, td * 0.5 + 0.02], [tw * 0.5, th * 1.15, 0.05], [0, 0, 28], 0.02); k.box(ca, [0, th * 0.1, td * 0.5 + 0.02], [tw * 1.1, 0.12, 0.06], [0, 0, 0], 0.02); const beads = mat('#6b3a1e', { roughness: 0.5 }); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; sph(k, beads, 0.028, [Math.cos(a) * 0.17, th - 0.04 - Math.max(0, Math.sin(a)) * 0.0, Math.sin(a) * 0.14 + 0.08]); } for (let i = 0; i < 4; i++) sph(k, beads, 0.03, [(i - 1.5) * 0.04, th - 0.1 - i * 0.04, td * 0.5 + 0.12]); },
    arm(k, m, side) { const { cp, cs, ca, dark, skin, limb } = m; if (side > 0) { k.box(cp, [0, -0.2, 0], [limb * 2.0, 0.5, limb * 2.0], [0, 0, 4], 0.03); } else { for (let i = 0; i < 3; i++) k.box(mat('#e9e4d6'), [0, -0.35 - i * 0.07, 0], [limb * 1.1, 0.04, limb * 1.1]); } },
    leg(k, m) { const { cp, cs, ca, dark, limb } = m; k.box(cs, [0, -0.3, 0], [limb * 2.3, 0.62, limb * 2.0], [0, 0, 0], 0.03); k.box(mat('#8a6a3c', { roughness: 0.9 }), [0, -0.78, 0.04], [limb * 1.3, 0.06, limb * 1.8]); },
    back(add, m) { const { ca, td } = m; const o = add('Orbs', (k) => { sph(k, glow(m.c.accent, 3.4), 0.1, [0.4, 0, 0]); sph(k, glow('#c06bff', 3.4), 0.1, [-0.4, 0, 0]); tor(k, glow(m.c.accent, 1.0), 0.4, 0.006, [0, 0, 0], [0, 0, 0], null, 36); }, 0, 0.4, -td / 2 - 0.3); m.anim.push({ node: o, kind: 'spin', axis: [0, 1, 0], speed: 55 }); },
  },
  siphon: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, cp, r * 1.3, [0, r * 0.15, -r * 0.3], [1, 1.1, 1.05], [0, 0, 0], 130); cone(k, cp, r * 0.9, r * 1.5, [0, r * 0.1, -r * 1.2], [-80, 0, 0], 8); k.box(dark, [0, r * 0.05, r * 1.1], [r * 1.5, r * 0.6, 0.05], [0, 0, 0], 0.02); for (const sx of [-1, 1]) k.cyl(glow(m.c.accent, 4), [sx * r * 0.4, r * 0.1, r * 1.15], r * 0.2, 0.04, [90, 0, 0], 10); k.box(h, [0, -r * 0.4, -r * 0.8], [r * 1.2, r * 1.6, r * 0.4], [5, 0, 0], 0.05); k.box(glow(m.c.accent, 1.4), [0, -r * 0.55, r * 1.05], [0.02, r * 0.5, 0.01]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (let i = 0; i < 5; i++) k.cyl(mat('#cfe6c0', { opacity: 0.6 }), [-0.17 + i * 0.085, th * 0.8 - i * 0.12, td * 0.5 + 0.06], 0.026, 0.12, [0, 0, 22], 8), k.cyl(glow(m.c.accent, 2.6), [-0.17 + i * 0.085, th * 0.8 - i * 0.12 - 0.02, td * 0.5 + 0.06], 0.018, 0.08, [0, 0, 22], 6); k.box(dark, [0, th * 0.55, td * 0.5 + 0.03], [0.05, th * 1.3, 0.02], [0, 0, 30]); k.box(cs, [0, th - 0.02, 0], [tw * 1.06, 0.14, td * 1.18], [0, 0, 0], 0.04); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; for (let i = 0; i < 3; i++) k.box(glow(m.c.accent, 2.0), [limb * 0.55, -0.1 - i * 0.12, limb * 0.1], [0.012, 0.08, limb * 0.8], [0, 0, 0]); if (side > 0) { for (const z of [-0.04, 0, 0.04]) cone(k, mat('#d9d2e6'), 0.012, 0.2, [z, -0.76, 0.04], [160, 0, 0], 5); } },
    leg(k, m) { const { cs, dark, limb } = m; for (let i = 0; i < 4; i++) k.box(i % 2 ? dark : cs, [0, -0.15 - i * 0.14, 0], [limb * 1.24, 0.08, limb * 1.38]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Tanks', (k) => { k.box(dark, [0, 0.3, 0], [0.34, 0.5, 0.14], [0, 0, 0], 0.03); for (const sx of [-1, 1]) { k.cyl(mat('#cfe6c0', { opacity: 0.5 }), [sx * 0.1, 0.34, -0.03], 0.065, 0.46, [0, 0, 0], 10); k.cyl(glow(m.c.accent, 2.4), [sx * 0.1, 0.26, -0.03], 0.05, 0.28, [0, 0, 0], 10); } k.cyl(dark, [0.12, 0.1, 0.05], 0.015, 0.4, [0, 0, 70], 6); }, 0, 0.1, -td / 2 - 0.1); const dr = add('Drops', (k) => { for (let i = 0; i < 4; i++) { const a = i * 1.57; sph(k, glow(m.c.accent, 3), 0.032, [Math.cos(a) * 0.45, Math.sin(a * 1.3) * 0.12, Math.sin(a) * 0.45], [1, 1.4, 1]); } }, 0, 0.45, 0); m.anim.push({ node: dr, kind: 'spin', axis: [0, 1, 0], speed: -60 }); const cl = add('Cloak', (k) => { for (let i = 0; i < 4; i++) k.box(i % 2 ? cp : cs, [-0.15 + i * 0.1, -0.4, 0], [0.1, 0.9 + (i % 2) * 0.12, 0.03], [8, 0, (i - 1.5) * 4]); }, 0, 0.45, -td / 2 - 0.06); m.anim.push({ node: cl, kind: 'sway', amp: 3, speed: 1.4, base: [0, 0, 0] }); },
  },
  // ---------------------------------------------------------------- EXPANSION
  sion: {
    head(k, m) { const { cp, cs, ca, dark, skin, r } = m, bone = mat('#cfc9b4'); dome(k, mat('#4a5448'), r * 1.22, [0, r * 0.35, -r * 0.1], [1, 1, 1.05], [0, 0, 0], 95); for (const sx of [-1, 1]) { cone(k, bone, 0.07, 0.4, [sx * r * 1.1, r * 0.9, 0], [0, 0, sx * -35], 6); k.cyl(glow(m.c.accent, 4), [sx * r * 0.42, r * 0.1, r * 1.0], r * 0.22, 0.04, [90, 0, 0], 8); } k.box(dark, [0, -r * 0.7, r * 0.8], [r * 1.6, r * 0.7, 0.05]); for (let i = -3; i <= 3; i++) k.box(bone, [i * r * 0.2, -r * 0.7, r * 0.84], [0.02, r * 0.45, 0.02]); tor(k, mat('#8e949f', { metallic: 0.8 }), r * 0.9, 0.025, [0, -r * 0.55, r * 0.2], [80, 0, 0], null, 12); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m, bone = mat('#cfc9b4'); for (let i = 0; i < 4; i++) { k.box(bone, [0, th * 0.82 - i * 0.12, td * 0.5 + 0.02], [tw * (0.66 - i * 0.05), 0.04, 0.03]); } k.box(bone, [0, th * 0.55, td * 0.5 + 0.02], [0.04, th * 0.7, 0.03]); for (const sx of [-1, 1]) { k.box(dark, [sx * tw * 0.52, th - 0.02, 0], [0.3, 0.2, td * 1.0], [0, 0, sx * 14], 0.05); for (let i = 0; i < 3; i++) cone(k, bone, 0.05, 0.22, [sx * (tw * 0.5 + i * 0.07), th + 0.12, (i - 1) * 0.12], [0, 0, sx * -20], 5); } k.box(glow(m.c.accent, 2), [0, th * 0.4, td * 0.5 + 0.03], [tw * 0.4, 0.05, 0.02]); k.box(dark, [0, 0.0, 0], [tw * 1.06, 0.14, td * 1.1], [0, 0, 0], 0.04); },
    arm(k, m, side) { const { dark, limb } = m; for (let i = 0; i < 3; i++) tor(k, mat('#8e949f', { metallic: 0.8 }), limb * 0.8, 0.025, [0, -0.15 - i * 0.12, 0], [0, 0, 0], null, 12); k.box(dark, [0, -0.46, 0], [limb * 1.3, 0.2, limb * 1.3], [0, 0, 0], 0.03); },
    leg(k, m) { const { cs, dark, limb } = m; k.box(dark, [0, -0.3, limb * 0.8], [limb * 1.5, 0.3, 0.06]); k.box(cs, [0, -0.64, 0.03], [limb * 1.4, 0.2, limb * 1.8]); },
    back(add, m) { const { cp, cs, dark, tw, td } = m; add('Rags', (k) => { for (let i = 0; i < 3; i++) k.box(i % 2 ? dark : cs, [-0.2 + i * 0.2, -0.3, 0], [0.2, 0.8 + (i % 2) * 0.15, 0.04], [6, 0, (i - 1) * 4]); }, 0, 0.1, -td / 2 - 0.02); const ch = add('Chains', (k) => { for (let i = 0; i < 5; i++) tor(k, mat('#8e949f', { metallic: 0.8 }), 0.05, 0.012, [0.3 + (i % 2) * 0.03, 0.3 - i * 0.1, 0], [i % 2 ? 90 : 0, 0, 0], null, 8); }, 0, 0.4, -td / 2 - 0.08); m.anim.push({ node: ch, kind: 'sway', amp: 4, speed: 1.8, base: [0, 0, 0] }); },
  },
  stormcaller: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.12, [0, r * 0.15, -r * 0.05], [1, 1.04, 1.06], [0, 0, 0], 105); for (let i = -2; i <= 2; i++) cone(k, h, 0.045, 0.28 - Math.abs(i) * 0.04, [i * 0.06, r * 1.0 + 0.1, -0.02], [-10 - Math.abs(i) * 6, 0, -i * 18], 5); for (const sx of [-1, 1]) k.box(glow(m.c.accent, 3.4), [sx * r * 0.4, r * 0.05, r * 0.98], [r * 0.28, r * 0.12, 0.02]); k.box(glow(m.c.accent, 2.4), [0, r * 0.62, r * 0.96], [r * 0.15, r * 0.4, 0.02], [0, 0, 20]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.55, td * 0.5 + 0.02], [tw * 0.7, th * 0.8, 0.04], [0, 0, 0], 0.02); for (const sx of [-1, 1]) k.box(glow(m.c.accent, 2.6), [sx * 0.08, th * 0.55, td * 0.5 + 0.05], [0.015, th * 0.7, 0.01], [0, 0, sx * 14]); ext(k, glow(m.c.accent, 3), 'arrow', 0.12, 0.03, [0, th * 0.62, td * 0.5 + 0.07], [0, 0, 0]); k.box(dark, [0, 0.03, 0], [tw * 1.04, 0.1, td * 1.1]); },
    arm(k, m) { const { cs, dark, limb } = m; k.box(cs, [0, -0.2, 0], [limb * 1.35, 0.5, limb * 1.35], [0, 0, 0], 0.03); tor(k, glow(m.c.accent, 3), limb * 0.9, 0.014, [0, -0.5, 0], [0, 0, 0], null, 12); },
    leg(k, m) { const { cs, dark, limb } = m; k.box(dark, [0, -0.5, 0.02], [limb * 1.3, 0.4, limb * 1.5], [0, 0, 0], 0.03); k.box(glow(m.c.accent, 2.2), [0, -0.3, limb * 0.76], [limb, 0.02, 0.01]); },
    back(add, m) { const { cp, cs, dark, td } = m; add('Cape', (k) => { k.box(cp, [0, -0.3, 0], [0.5, 0.9, 0.04], [8, 0, 0], 0.02); k.box(glow(m.c.accent, 2), [0, -0.74, 0], [0.5, 0.025, 0.045], [8, 0, 0]); }, 0, 0.5, -td / 2 - 0.03); const o = add('Orbs', (k) => { for (let i = 0; i < 3; i++) { const a = i * 2.09; sph(k, glow(m.c.accent, 3.6), 0.045, [Math.cos(a) * 0.42, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.42]); } }, 0, 0.62, 0); m.anim.push({ node: o, kind: 'spin', axis: [0, 1, 0], speed: 160 }); },
  },
  ricochet: {
    head(k, m) { const { cp, cs, ca, dark, skin, r, hair } = m, h = mat(hair); dome(k, h, r * 1.1, [0, r * 0.1, -r * 0.05], [1, 1.04, 1.06], [0, 0, 0], 100); k.cyl(cp, [0, r * 0.75, 0], r * 1.4, 0.03, [0, 0, 0], 16); dome(k, cp, r * 1.0, [0, r * 0.75, 0], [1, 0.8, 1], [0, 0, 0], 90); k.box(ca, [0, r * 0.82, r * 0.05], [r * 2.05, 0.03, r * 0.5]); k.box(dark, [0, r * 0.1, r * 1.0], [r * 1.5, r * 0.18, 0.03]); k.box(mat(hair), [0, -r * 0.35, r * 0.95], [r * 0.9, r * 0.12, 0.03]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.55, td * 0.5 + 0.02], [tw * 0.85, th * 0.8, 0.04], [0, 0, 0], 0.02); for (let i = -1; i <= 1; i++) k.box(ca, [i * 0.12, th * 0.6, td * 0.5 + 0.05], [0.04, th * 0.7, 0.01], [0, 0, i * 14]); for (const sx of [-1, 1]) k.cyl(mat('#e6c34a', { metallic: 0.7 }), [sx * 0.14, th * 0.9, td * 0.5 + 0.04], 0.03, 0.04, [90, 0, 0], 6); k.box(dark, [0, 0.03, 0], [tw * 1.05, 0.1, td * 1.1]); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(ca, [0, -0.1, 0], [limb * 1.2, 0.05, limb * 1.2]); k.box(dark, [0, -0.46, 0], [limb * 1.15, 0.2, limb * 1.15], [0, 0, 0], 0.03); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(dark, [0, -0.68, 0.04], [limb * 1.4, 0.24, limb * 1.8], [0, 0, 0], 0.03); k.box(ca, [0, -0.54, limb * 0.8], [limb * 1.1, 0.03, 0.02]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Quiver', (k) => { k.box(dark, [0, 0.32, 0], [tw * 0.7, 0.5, 0.16], [0, 0, 0], 0.03); for (let i = 0; i < 4; i++) { k.cyl(ca, [-0.12 + i * 0.08, 0.64, -0.02], 0.02, 0.2, [0, 0, 0], 5); } for (const sx of [-1, 1]) k.box(mat('#cfd3da', { metallic: 0.7 }), [sx * 0.2, 0.2, -0.12], [0.05, 0.28, 0.02], [0, 0, sx * 12]); }, 0, 0.1, -td / 2 - 0.1); },
  },
  mirage: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.12, [0, r * 0.12, -r * 0.05], [1, 1.06, 1.08], [0, 0, 0], 108); k.box(h, [r * 0.8, -r * 0.2, -r * 0.4], [r * 0.5, r * 1.6, r * 0.5], [0, 0, 10], 0.05); k.box(glow(m.c.accent, 3), [0, r * 0.12, r * 1.0], [r * 1.5, r * 0.14, 0.03]); k.box(dark, [0, r * 0.12, r * 0.98], [r * 1.7, r * 0.3, 0.03]); k.cyl(glow(m.c.accent, 2.4), [-r * 1.05, 0, 0], r * 0.3, 0.05, [0, 0, 90], 10); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; for (let i = 0; i < 4; i++) k.box(glow(i % 2 ? m.c.accent : '#7ff0ff', 2), [0, th * 0.82 - i * 0.12, td * 0.5 + 0.015], [tw * 0.9, 0.02, 0.01]); k.box(cs, [0, th * 0.4, td * 0.5 + 0.015], [tw * 0.4, th * 0.7, 0.02], [0, 0, 0], 0.01); },
    arm(k, m) { const { cs, ca, dark, limb } = m; k.box(glow(m.c.accent, 2.2), [limb * 0.58, -0.2, 0], [0.012, 0.4, 0.05]); k.box(cs, [0, -0.46, 0], [limb * 1.15, 0.18, limb * 1.15], [0, 0, 0], 0.03); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(glow(m.c.accent, 2), [limb * 0.66, -0.4, 0], [0.012, 0.7, 0.05]); k.box(dark, [0, -0.68, 0.04], [limb * 1.4, 0.22, limb * 1.8], [0, 0, 0], 0.03); },
    back(add, m) { const { cp, cs, ca, dark, td } = m; const g = add('Prism', (k) => { k.shape(glow(m.c.accent, 2.8), { type: 'extrude', shape: 'polygon', radius: 0.5, points: 4, depth: 1, bevel: 0 }, [], [0, 0, 0], [0, 0, 0], [0.22, 0.32, 0.05]); k.shape(glow('#7ff0ff', 2.2), { type: 'extrude', shape: 'polygon', radius: 0.5, points: 4, depth: 1, bevel: 0 }, [], [0.14, -0.1, 0.02], [0, 0, 20], [0.14, 0.2, 0.04]); }, 0, 0.5, -td / 2 - 0.2); m.anim.push({ node: g, kind: 'bob', amp: 0.03, speed: 3, base: [0, 0.5, -td / 2 - 0.2] }); },
  },
  lantern: {
    head(k, m) { const { cp, cs, ca, dark, skin, r, hair } = m, h = mat(hair); dome(k, h, r * 1.12, [0, r * 0.12, -r * 0.05], [1, 1.05, 1.08], [0, 0, 0], 108); k.box(h, [0, -r * 0.6, -r * 1.0], [r * 0.5, r * 2.0, r * 0.5], [4, 0, 0], 0.05); cone(k, cp, r * 1.6, r * 0.6, [0, r * 0.9, 0], [0, 0, 0], 10); k.cyl(cp, [0, r * 0.7, 0], r * 1.6, 0.03, [0, 0, 0], 16); sph(k, glow(m.c.accent, 3), r * 0.18, [0, r * 1.4, 0]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.5, td * 0.5 + 0.02], [tw * 0.4, th * 0.9, 0.04]); for (const sx of [-1, 1]) k.box(cp, [sx * tw * 0.3, th * 0.5, td * 0.5 + 0.03], [tw * 0.3, th, 0.04], [0, 0, sx * -3], 0.02); k.box(ca, [0, 0.04, 0], [tw * 1.06, 0.08, td * 1.1]); sph(k, glow(m.c.accent, 3), 0.045, [0, th * 0.6, td * 0.5 + 0.07]); },
    arm(k, m) { const { cp, cs, ca, dark, limb } = m; k.box(cp, [0, -0.2, 0], [limb * 1.7, 0.5, limb * 1.7], [0, 0, 0], 0.03); k.box(ca, [0, -0.46, 0], [limb * 1.8, 0.04, limb * 1.8]); },
    leg(k, m) { const { cs, ca, dark, limb } = m; k.box(m.cp, [0, -0.3, 0], [limb * 1.4, 0.6, limb * 1.5], [0, 0, 0], 0.03); k.box(dark, [0, -0.7, 0.04], [limb * 1.4, 0.2, limb * 1.8]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Robe', (k) => { k.box(cp, [-0.1, -0.35, 0], [0.24, 0.9, 0.05], [8, 0, 3], 0.02); k.box(cp, [0.1, -0.35, 0], [0.24, 0.9, 0.05], [8, 0, -3], 0.02); }, 0, 0.1, -td / 2 - 0.02); const l = add('Lantern', (k) => { k.cyl(dark, [0, 0.14, 0], 0.01, 0.3, [0, 0, 0], 4); k.box(dark, [0, 0.0, 0], [0.16, 0.02, 0.16]); k.box(glow(m.c.accent, 3.6), [0, -0.12, 0], [0.12, 0.2, 0.12], [0, 0, 0], 0.02); k.box(dark, [0, -0.24, 0], [0.16, 0.02, 0.16]); k.cyl(dark, [0, 0.29, 0], 0.03, 0.02, [0, 0, 0], 6); }, 0.45, 0.35, -0.05); m.anim.push({ node: l, kind: 'sway', amp: 8, speed: 2, base: [0, 0, 0] }); },
  },
  thorn: {
    head(k, m) { const { cp, cs, ca, dark, r, hair } = m, h = mat(hair); dome(k, h, r * 1.14, [0, r * 0.12, -r * 0.05], [1, 1.06, 1.1], [0, 0, 0], 110); for (let i = 0; i < 5; i++) { const a = -0.8 + i * 0.4; cone(k, mat('#4a8a3a'), 0.035, 0.22, [Math.sin(a) * r * 0.9, r * 1.05, Math.cos(a) * r * 0.5 - r * 0.1], [-15, 0, -a * 50], 5); } for (const sx of [-1, 1]) sph(k, glow(m.c.accent, 3), r * 0.1, [sx * r * 0.7, r * 0.8, r * 0.3]); k.box(dark, [0, r * 0.1, r * 1.0], [r * 0.9, r * 0.1, 0.02]); },
    torso(k, m) { const { cp, cs, ca, dark, tw, th, td } = m; k.box(cs, [0, th * 0.5, td * 0.5 + 0.02], [tw * 0.7, th * 0.85, 0.04], [0, 0, 0], 0.02); for (let i = 0; i < 4; i++) k.shape(mat('#5ab04a'), { type: 'extrude', shape: 'heart', radius: 0.5, depth: 1, bevel: 0 }, [], [(i % 2 ? 0.1 : -0.1), th * 0.8 - i * 0.12, td * 0.5 + 0.05], [0, 0, i * 40], [0.09, 0.09, 0.02]); sph(k, glow(m.c.accent, 3), 0.045, [0, th * 0.55, td * 0.5 + 0.06]); k.box(dark, [0, 0.03, 0], [tw * 1.04, 0.09, td * 1.1]); },
    arm(k, m, side) { const { cs, ca, dark, limb } = m; for (let i = 0; i < 4; i++) cone(k, mat('#4a8a3a'), 0.025, 0.12, [limb * 0.62 * (side || 1), -0.1 - i * 0.1, 0], [0, 0, (side || 1) * -70], 5); k.box(dark, [0, -0.46, 0], [limb * 1.15, 0.18, limb * 1.15], [0, 0, 0], 0.03); },
    leg(k, m) { const { cs, ca, dark, limb } = m; for (let i = 0; i < 3; i++) tor(k, mat('#4a8a3a'), limb * 0.8, 0.02, [0, -0.15 - i * 0.16, 0], [0, 0, 0], null, 10); k.box(dark, [0, -0.7, 0.04], [limb * 1.4, 0.2, limb * 1.8]); },
    back(add, m) { const { cp, cs, ca, dark, tw, td } = m; add('Cloak', (k) => { for (let i = 0; i < 4; i++) k.box(i % 2 ? cp : cs, [-0.15 + i * 0.1, -0.35, 0], [0.11, 0.9 + (i % 2) * 0.1, 0.03], [8, 0, (i - 1.5) * 4]); }, 0, 0.5, -td / 2 - 0.03); const b = add('Blossoms', (k) => { for (let i = 0; i < 5; i++) { const a = i * 1.26; sph(k, glow(i % 2 ? m.c.accent : '#7dff8a', 2.6), 0.04, [Math.cos(a) * 0.42, Math.sin(a * 1.3) * 0.1, Math.sin(a) * 0.42]); } }, 0, 0.5, 0); m.anim.push({ node: b, kind: 'spin', axis: [0, 1, 0], speed: -70 }); },
  },

};

// ------------------------------------------------------------------ build
export function buildHero(heroId, skinId = 'default') {
  const d = HERO[heroId], c = heroColors(heroId, skinId), B = BODY[heroId], L = LOOKS[heroId], s = d.height / 1.8;
  const cp = mat(c.primary, { roughness: 0.5, metallic: 0.15 }), cs = mat(c.secondary, { roughness: 0.6, metallic: 0.2 }), ca = glow(c.accent), skin = mat(c.skin, { roughness: 0.7 });
  const dark = mat('#23262d', { roughness: 0.6, metallic: 0.3 });
  const [tw, th, td] = B.t, limb = B.limb, r = B.hd;
  const m = { cp, cs, ca, dark, skin, c, r, tw, th, td, limb, hair: HAIR[heroId] || '#2a2018', anim: [], flames: null };
  const root = new E.Node('Hero ' + heroId), body = new E.Node('Body'); root.add(body); body.scale.set([s, s, s]);
  const legLen = 0.86, hips = at(new E.Node('Hips'), 0, legLen, 0); body.add(hips);
  const spine = at(new E.Node('Spine'), 0, 0.02, 0); hips.add(spine);
  const legCp = L.torsoSkin ? skin : cs;
  // ---- legs (pivot at the hip, mesh hangs down)
  // legs: thigh pivots at the hip, the shin at the knee so strides can bend
  const legNode = (side) => {
    const piv = at(new E.Node('Leg'), side * tw * 0.27, -0.02, 0), lm = legCp === skin ? cp : cs;
    piv.add(group('ThighMesh', (k) => k.box(lm, [0, -0.2, 0], [limb * 1.15, 0.42, limb * 1.25], [0, 0, 0], 0.03)));
    const shin = at(new E.Node('Shin'), 0, -0.38, 0); piv.add(shin);
    shin.add(group('ShinMesh', (k) => { k.box(lm, [0, -0.17, 0], [limb * 1.1, 0.38, limb * 1.2], [0, 0, 0], 0.03); k.box(dark, [0, -0.4, 0.04], [limb * 1.3, 0.16, limb * 1.9], [0, 0, 0], 0.03); }));
    if (L.leg) { const extra = group('LegExtra', (k) => L.leg(k, m, side)); extra.position.set([0, 0.38, 0]); shin.add(extra); }
    piv.shin = shin; return piv;
  };
  const legL = legNode(1), legR = legNode(-1); hips.add(legL, legR);
  // ---- torso
  spine.add(group('Torso', (k) => {
    k.box(L.torsoSkin ? skin : cp, [0, th / 2, 0], [tw, th, td], [0, 0, 0], 0.07);
    k.box(cs, [0, 0.03, 0], [tw * 0.92, 0.1, td * 1.04], [0, 0, 0], 0.02); // belt
    if (!L.torso) k.box(ca, [0, th * 0.58, td / 2 + 0.005], [tw * 0.16, th * 0.2, 0.02]); // chest emblem
    L.torso?.(k, m);
  }));
  // ---- head
  const head = at(new E.Node('Head'), 0, th + 0.14, 0); spine.add(head);
  head.add(group('HeadMesh', (k) => {
    k.shape(skin, SP(r, 180, 16, 12), [], [0, 0, 0], [0, 0, 0], [0.95, 1.08, 1]);
    for (const sx of [-1, 1]) k.box(dark, [sx * r * 0.36, r * 0.02, r * 0.9], [r * 0.15, r * 0.2, 0.02]); // eyes
    k.box(skin, [0, -r * 1.0, 0], [0.09, 0.08, 0.09]); // neck
    L.head?.(k, m);
  }));
  // ---- arms (pivot at the shoulder; right arm holds the weapon)
  const armNode = (side) => {
    const piv = at(new E.Node('Arm'), side * (tw / 2 + B.sh * 0.5), th - 0.08, 0);
    piv.add(group('ArmMesh', (k) => {
      k.box(L.torsoSkin ? skin : cp, [0, -0.17, 0], [limb, 0.34, limb], [0, 0, 0], 0.03);
      k.box(L.torsoSkin ? skin : cs, [0, -0.45, 0], [limb * 0.88, 0.3, limb * 0.88], [0, 0, 0], 0.03);
      if (heroId !== 'wrecker') k.shape(dark, SP(limb * 0.62, 180, 10, 8), [], [0, -0.64, 0]);
      L.arm?.(k, m, side);
    }));
    return piv;
  };
  const armL = armNode(1), armR = armNode(-1); spine.add(armL, armR);
  const wpn = buildWeapon(heroId, c); wpn.node.scale.set([0.9, 0.9, 0.9]);
  const hand = at(new E.Node('Hand'), 0, -0.62, 0.0); hand.setEuler(90, 0, 0); armR.add(hand); hand.add(wpn.node);
  armR.setEuler(-70, 0, 0); armL.setEuler(-55, 0, 18);
  // ---- back pieces and floating extras (nodes are parented to the spine so they follow the aim)
  const add = (name, build, x, y, z, rot) => { const n = group(name, build); n.position.set([x, y, z]); if (rot) n.setEuler(...rot); spine.add(n); return n; };
  L.back?.(add, m);
    // team ring on the floor
  const ring = new E.Mesh(E.torus({ radius: 0.6, tube: 0.035, radialSegments: 4, tubularSegments: 32, arc: 360, tubeScaleY: 0.4 }), glow('#3a9bff', 1.6), 'TeamRing');
  ring.position.set([0, 0.03, 0]); ring.castShadow = false; ring.receiveShadow = false; root.add(ring);
  root.userData = { body, hips, spine, head, armL, armR, legL, legR, shinL: legL.shin, shinR: legR.shin, ring, weapon: wpn.node, muzzle: wpn.muzzle, weaponSpin: wpn.spin, scaleK: s, d, anim: m.anim, flames: m.flames, hero: heroId };
  root.traverse((n) => { if (n.isMesh || n.geometry) n.pickable = false; });
  return root;
}

// advance the animated bits of a model (spinning orbiters, flapping wings, flickering jets...)
export function animateHero(model, t, { flying = false, speed = 0 } = {}) {
  const d = model.userData;
  for (const a of d.anim || []) {
    const n = a.node;
    switch (a.kind) {
      case 'spin': { const ang = t * a.speed + (a.phase || 0); n.setEuler(a.axis[0] * ang, a.axis[1] * ang, a.axis[2] * ang); break; }
      case 'sway': n.setEuler(a.base[0] + Math.sin(t * a.speed) * a.amp + Math.min(1, speed / 5) * 8, a.base[1], a.base[2] + Math.sin(t * a.speed * 0.7) * a.amp * 0.5); break;
      case 'flap': n.setEuler(a.base[0], a.base[1] + a.side * Math.sin(t * a.speed * 2) * a.amp, a.base[2]); break;
      case 'bob': n.position.set([a.base[0], a.base[1] + Math.sin(t * a.speed) * a.amp, a.base[2]]); break;
      case 'pulse': { const k = 1 + Math.sin(t * a.speed) * a.amp; n.scale.set([k, k, k]); break; }
    }
  }
  if (d.flames) for (const f of d.flames) { f.visible = flying; if (flying) { const k = 0.8 + Math.random() * 0.5; f.scale.set([k, 0.8 + Math.random() * 0.7, k]); } }
}

// ------------------------------------------------------------------ deployables
export function buildPylon(c) {
  return group('Pylon', (k) => { k.cyl(mat('#373d44', { metallic: 0.6 }), [0, 0.1, 0], 0.4, 0.2, [0, 0, 0], 12); k.cyl(mat(c.primary), [0, 0.55, 0], 0.18, 0.8, [0, 0, 0], 10); k.shape(glow('#9dff9d', 3), SP(0.2), [], [0, 1.1, 0]); tor(k, glow('#9dff9d', 2), 0.3, 0.015, [0, 0.8, 0], [90, 0, 0], null, 24); });
}
export function buildSentry(c) {
  const root = new E.Node('Sentry');
  root.add(group('SentryBase', (k) => { for (let i = 0; i < 3; i++) { const a = i * 2.09; k.cyl(mat('#373d44', { metallic: 0.6 }), [Math.cos(a) * 0.28, 0.25, Math.sin(a) * 0.28], 0.03, 0.5, [Math.sin(a) * 25, 0, -Math.cos(a) * 25], 6); } k.cyl(mat(c.primary), [0, 0.55, 0], 0.22, 0.2, [0, 0, 0], 10); }));
  const head = group('SentryHead', (k) => { k.box(mat(c.primary), [0, 0, 0], [0.4, 0.3, 0.5], [0, 0, 0], 0.04); k.cyl(mat('#23262d'), [0.09, 0, 0.42], 0.035, 0.45, [90, 0, 0], 8); k.cyl(mat('#23262d'), [-0.09, 0, 0.42], 0.035, 0.45, [90, 0, 0], 8); k.box(glow(c.accent, 3), [0, 0.12, 0.2], [0.18, 0.05, 0.1]); });
  head.position.set([0, 0.85, 0]); root.add(head); root.userData.head = head;
  return root;
}
