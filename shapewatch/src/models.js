// Procedural hero models built from ShapeForge primitives. Every hero is a small rig of nodes
// (hips, spine, head, two arms, two legs) so the view can swing limbs, tilt the torso to the
// aim and topple the body on death. Weapons are separate nodes: a world model for the hands
// and the same builder at first-person scale for the viewmodel.
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

// small kit wrapper: build(k) fills a Kit, returns a Node group
function group(name, build) { const k = new E.Kit(pal); build(k); return k.toNode(name); }
const at = (n, x, y, z) => { n.position.set([x, y, z]); return n; };

export function heroColors(heroId, skinId = 'default') {
  const d = HERO[heroId], skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  return skin.map(d.colors);
}

// ------------------------------------------------------------------ weapons
// built pointing +Z with the grip at the origin; returns { node, muzzle:[x,y,z] }
export function buildWeapon(heroId, c) {
  const dark = mat('#2b2e36', { metallic: 0.7, roughness: 0.45 }), body = mat(c.primary, { metallic: 0.35, roughness: 0.45 }), sec = mat(c.secondary, { metallic: 0.4 });
  const acc = glow(c.accent, 2.4);
  let muzzle = [0, 0.04, 0.6];
  const node = group('Weapon ' + heroId, (k) => {
    switch (heroId) {
      case 'bulwark': // forearm pulse cannon
        k.box(body, [0, 0.05, 0.3], [0.2, 0.18, 0.6], [0, 0, 0], 0.03); k.cyl(dark, [0, 0.05, 0.68], 0.07, 0.3, [90, 0, 0], 12); k.cyl(acc, [0, 0.05, 0.84], 0.05, 0.04, [90, 0, 0], 12); k.box(sec, [0, 0.16, 0.2], [0.12, 0.06, 0.34]);
        muzzle = [0, 0.05, 0.88]; break;
      case 'mauler': // sawed scrap cannon
        k.box(body, [0, 0.03, 0.25], [0.22, 0.2, 0.5], [0, 0, 0], 0.03); k.cyl(dark, [0, 0.06, 0.62], 0.1, 0.42, [90, 0, 0], 10); k.cyl(sec, [0, 0.06, 0.4], 0.12, 0.08, [90, 0, 0], 10); k.box(acc, [0, 0.17, 0.3], [0.04, 0.05, 0.3]); k.cyl(dark, [0.12, 0.06, 0.62], 0.04, 0.4, [90, 0, 0], 8);
        muzzle = [0, 0.06, 0.84]; break;
      case 'orbit': // gravity driver
        k.box(body, [0, 0.03, 0.2], [0.14, 0.16, 0.5], [0, 0, 0], 0.03); k.shape(acc, { type: 'torus', radius: 0.11, tube: 0.025, radialSegments: 8, tubularSegments: 20, arc: 360, tubeScaleY: 1 }, [], [0, 0.04, 0.5], [90, 0, 0]); k.shape(acc, { type: 'torus', radius: 0.08, tube: 0.02, radialSegments: 8, tubularSegments: 20, arc: 360, tubeScaleY: 1 }, [], [0, 0.04, 0.62], [90, 0, 0]); k.box(dark, [0, 0.04, 0.5], [0.05, 0.05, 0.3]);
        muzzle = [0, 0.04, 0.78]; break;
      case 'sabre': // pulse rifle
        k.box(body, [0, 0.04, 0.28], [0.1, 0.16, 0.62], [0, 0, 0], 0.02); k.box(dark, [0, 0.04, 0.74], [0.05, 0.05, 0.36]); k.box(dark, [0, 0.15, 0.3], [0.06, 0.07, 0.3]); k.box(sec, [0, -0.1, 0.18], [0.07, 0.22, 0.12], [-8, 0, 0]); k.box(acc, [0.055, 0.05, 0.4], [0.012, 0.04, 0.22]); k.box(dark, [0, 0.0, -0.1], [0.08, 0.14, 0.3]);
        muzzle = [0, 0.04, 0.94]; break;
      case 'cinder': // ember gauntlet-rod
        k.box(dark, [0, 0.03, 0.22], [0.09, 0.1, 0.5], [0, 0, 0], 0.02); k.cyl(body, [0, 0.04, 0.55], 0.06, 0.3, [90, 0, 0], 8, 0.09); k.shape(acc, { type: 'sphere', radius: 0.07, widthSegments: 12, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0, 0.04, 0.72]); k.cyl(sec, [0, 0.03, 0.05], 0.05, 0.2, [90, 0, 0], 8);
        muzzle = [0, 0.04, 0.8]; break;
      case 'vesper': // rail rifle with scope
        k.box(body, [0, 0.04, 0.35], [0.09, 0.14, 0.9], [0, 0, 0], 0.02); k.cyl(dark, [0, 0.05, 0.98], 0.035, 0.5, [90, 0, 0], 8); k.cyl(dark, [0, 0.17, 0.3], 0.055, 0.34, [90, 0, 0], 10); k.cyl(glow(c.accent, 3), [0, 0.17, 0.48], 0.05, 0.01, [90, 0, 0], 10); k.box(acc, [0.05, 0.04, 0.5], [0.012, 0.03, 0.5]); k.box(sec, [0, -0.1, 0.2], [0.07, 0.2, 0.1]);
        muzzle = [0, 0.05, 1.25]; break;
      case 'flicker': // chrono pistol
        k.box(body, [0, 0.03, 0.14], [0.08, 0.12, 0.32], [0, 0, 0], 0.02); k.box(dark, [0, 0.03, 0.34], [0.045, 0.05, 0.12]); k.box(sec, [0, -0.07, 0.04], [0.06, 0.18, 0.08], [-10, 0, 0]); k.cyl(acc, [0, 0.1, 0.18], 0.03, 0.1, [90, 0, 0], 8);
        muzzle = [0, 0.03, 0.42]; break;
      case 'halo': // caduceus pistol
        k.box(body, [0, 0.03, 0.14], [0.08, 0.12, 0.3], [0, 0, 0], 0.02); k.box(sec, [0, 0.03, 0.34], [0.05, 0.06, 0.12]); k.box(sec, [0, -0.07, 0.04], [0.06, 0.18, 0.08], [-10, 0, 0]); k.shape(acc, { type: 'torus', radius: 0.07, tube: 0.015, radialSegments: 8, tubularSegments: 16, arc: 360, tubeScaleY: 1 }, [], [0, 0.07, 0.22], [0, 90, 0]);
        muzzle = [0, 0.03, 0.42]; break;
      case 'pylon': // rivet pistol with tool belt feel
        k.box(body, [0, 0.03, 0.15], [0.1, 0.14, 0.34], [0, 0, 0], 0.025); k.cyl(dark, [0, 0.04, 0.38], 0.05, 0.16, [90, 0, 0], 8); k.box(acc, [0, 0.12, 0.12], [0.05, 0.05, 0.18]); k.box(sec, [0, -0.08, 0.05], [0.07, 0.2, 0.09], [-10, 0, 0]);
        muzzle = [0, 0.04, 0.48]; break;
      case 'zephyr': // sonic blaster
        k.box(body, [0, 0.03, 0.18], [0.12, 0.14, 0.4], [0, 0, 0], 0.03); k.cyl(acc, [0, 0.03, 0.46], 0.09, 0.06, [90, 0, 0], 14); k.cyl(sec, [0, 0.03, 0.5], 0.06, 0.06, [90, 0, 0], 14); k.box(dark, [0, -0.08, 0.06], [0.07, 0.2, 0.09], [-10, 0, 0]);
        muzzle = [0, 0.03, 0.56]; break;
      default: k.box(body, [0, 0.03, 0.3], [0.1, 0.14, 0.6]);
    }
  });
  return { node, muzzle };
}

// ------------------------------------------------------------------ hero bodies
const LOOKS = {
  heavy: { torso: [0.64, 0.6, 0.4], limb: 0.17, shoulder: 0.2, head: 0.15 },
  brute: { torso: [0.66, 0.62, 0.4], limb: 0.18, shoulder: 0.2, head: 0.15 },
  sleek: { torso: [0.42, 0.5, 0.24], limb: 0.1, shoulder: 0.08, head: 0.135 },
  soldier: { torso: [0.5, 0.54, 0.3], limb: 0.12, shoulder: 0.1, head: 0.14 },
  mage: { torso: [0.46, 0.54, 0.28], limb: 0.11, shoulder: 0.09, head: 0.14 },
  sniper: { torso: [0.44, 0.54, 0.26], limb: 0.105, shoulder: 0.08, head: 0.135 },
  angel: { torso: [0.44, 0.54, 0.26], limb: 0.105, shoulder: 0.08, head: 0.14 },
  engineer: { torso: [0.52, 0.56, 0.32], limb: 0.125, shoulder: 0.1, head: 0.145 },
};

export function buildHero(heroId, skinId = 'default') {
  const d = HERO[heroId], c = heroColors(heroId, skinId), L = LOOKS[d.look] || LOOKS.soldier, s = d.height / 1.8;
  const cp = mat(c.primary, { roughness: 0.5, metallic: 0.15 }), cs = mat(c.secondary, { roughness: 0.6, metallic: 0.2 }), ca = glow(c.accent), skin = mat(c.skin, { roughness: 0.7 });
  const dark = mat('#23262d', { roughness: 0.6, metallic: 0.3 });
  const root = new E.Node('Hero ' + heroId), body = new E.Node('Body'); root.add(body); body.scale.set([s, s, s]);
  const legLen = 0.86, hips = at(new E.Node('Hips'), 0, legLen, 0); body.add(hips);
  const spine = at(new E.Node('Spine'), 0, 0.02, 0); hips.add(spine);
  const [tw, th, td] = L.torso, limb = L.limb;
  // ---- legs (pivot at the hip, mesh hangs down)
  const legNode = (side) => {
    const piv = at(new E.Node('Leg'), side * tw * 0.27, -0.02, 0);
    piv.add(at(group('LegMesh', (k) => { k.box(cs, [0, -0.38, 0], [limb * 1.15, 0.72, limb * 1.25], [0, 0, 0], 0.03); k.box(dark, [0, -0.78, 0.04], [limb * 1.3, 0.16, limb * 1.9], [0, 0, 0], 0.03); if (d.look === 'heavy' || d.look === 'brute') k.box(cp, [0, -0.2, 0.02], [limb * 1.4, 0.3, limb * 1.5], [0, 0, 0], 0.04); }), 0, 0, 0));
    return piv;
  };
  const legL = legNode(1), legR = legNode(-1); hips.add(legL, legR);
  // ---- torso
  spine.add(at(group('Torso', (k) => {
    k.box(cp, [0, th / 2, 0], [tw, th, td], [0, 0, 0], 0.07);
    k.box(cs, [0, 0.03, 0], [tw * 0.92, 0.1, td * 1.04], [0, 0, 0], 0.02); // belt
    k.box(ca, [0, th * 0.58, td / 2 + 0.005], [tw * 0.16, th * 0.2, 0.02]); // chest emblem
    if (d.look === 'heavy' || d.look === 'brute') { for (const sx of [-1, 1]) k.box(sx > 0 || d.look === 'heavy' ? cs : dark, [sx * (tw / 2 + 0.06), th - 0.06, 0], [0.26, 0.18, 0.34], [0, 0, sx * 14], 0.05); }
  }), 0, 0, 0));
  // ---- head
  const head = at(new E.Node('Head'), 0, th + 0.14, 0); spine.add(head);
  head.add(group('HeadMesh', (k) => {
    k.shape(skin, { type: 'sphere', radius: L.head, widthSegments: 16, heightSegments: 12, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0, 0, 0], [0, 0, 0], [0.95, 1.08, 1]);
    for (const sx of [-1, 1]) k.box(dark, [sx * L.head * 0.36, L.head * 0.02, L.head * 0.9], [L.head * 0.15, L.head * 0.2, 0.02]); // eyes
    k.box(skin, [0, -L.head * 1.0, 0], [0.09, 0.08, 0.09]); // neck
    headgear(k, d.look, heroId, L, { cp, cs, ca, dark, skin, c });
  }));
  // ---- arms (pivot at the shoulder; right arm holds the weapon)
  const armNode = (side) => {
    const piv = at(new E.Node('Arm'), side * (tw / 2 + L.shoulder * 0.5), th - 0.08, 0);
    piv.add(group('ArmMesh', (k) => {
      k.box(cp, [0, -0.17, 0], [limb, 0.34, limb], [0, 0, 0], 0.03);
      k.box(cs, [0, -0.45, 0], [limb * 0.88, 0.3, limb * 0.88], [0, 0, 0], 0.03);
      k.shape(dark, { type: 'sphere', radius: limb * 0.62, widthSegments: 10, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0, -0.64, 0]);
      if (d.look === 'heavy') k.box(cp, [0, -0.1, 0], [limb * 1.55, 0.22, limb * 1.55], [0, 0, 0], 0.05);
    }));
    return piv;
  };
  const armL = armNode(1), armR = armNode(-1); spine.add(armL, armR);
  const wpn = buildWeapon(heroId, c); wpn.node.scale.set([0.9, 0.9, 0.9]);
  const hand = at(new E.Node('Hand'), 0, -0.62, 0.0); hand.setEuler(90, 0, 0); armR.add(hand); hand.add(wpn.node);
  armR.setEuler(-70, 0, 0); armL.setEuler(-55, 0, 18);
  extras(spine, hips, d.look, heroId, L, { tw, th, td, cp, cs, ca, dark, skin, c, s });
  // team ring on the floor
  const ring = new E.Mesh(E.cylinder({ radiusTop: 0.6, radiusBottom: 0.6, height: 0.02, radialSegments: 28, capTop: true, capBottom: false }), glow('#3a9bff', 1.6), 'TeamRing');
  ring.position.set([0, 0.03, 0]); ring.castShadow = false; ring.receiveShadow = false; root.add(ring);
  root.userData = { body, hips, spine, head, armL, armR, legL, legR, ring, weapon: wpn.node, muzzle: wpn.muzzle, scaleK: s, d };
  root.traverse((n) => { if (n.isMesh || n.geometry) n.pickable = false; });
  return root;
}
function headgear(k, look, id, L, m) {
  const { cp, cs, ca, dark, skin, c } = m, r = L.head;
  switch (look) {
    case 'heavy': k.box(cp, [0, 0.03, 0], [r * 2.3, r * 1.9, r * 2.2], [0, 0, 0], 0.05); k.box(ca, [0, 0.01, r * 1.1], [r * 1.9, r * 0.45, 0.03]); k.box(cs, [0, r * 1.05, 0], [r * 0.5, r * 0.3, r * 2.2]); break;
    case 'brute': for (let i = -2; i <= 2; i++) k.shape(cs, { type: 'superquadric', rx: 0.025, ry: 0.11 - Math.abs(i) * 0.015, rz: 0.04, e1: 1, e2: 1, widthSegments: 8, heightSegments: 6, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 0.3, taperBottom: 1 }, [], [0, r * 1.05, i * 0.055], [0, 0, 0]); k.box(dark, [0, -r * 0.35, r * 0.85], [r * 1.5, r * 0.55, 0.04]); break;
    case 'soldier': k.box(cp, [0, r * 0.55, 0], [r * 2.15, r * 1.0, r * 2.2], [0, 0, 0], 0.04); k.box(dark, [0, r * 0.12, r * 0.95], [r * 1.6, r * 0.34, 0.05]); k.box(ca, [0, r * 0.12, r * 1.0], [r * 1.35, r * 0.1, 0.02]); break;
    case 'mage': k.cyl(dark, [0, r * 0.95, 0], r * 0.95, 0.04, [0, 0, 0], 14); k.cyl(dark, [0, r * 1.7, 0], r * 0.62, r * 1.5, [0, 0, 0], 14); k.cyl(ca, [0, r * 1.25, 0], r * 0.66, 0.05, [0, 0, 0], 14); for (let i = 0; i < 3; i++) k.shape(ca, { type: 'superquadric', rx: 0.05, ry: 0.13, rz: 0.04, e1: 1, e2: 1, widthSegments: 8, heightSegments: 6, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 0.1, taperBottom: 1 }, [], [(i - 1) * 0.09, -r * 0.1, -r * 0.95], [-20, 0, (i - 1) * 18]); break;
    case 'sniper': k.box(cp, [0, r * 0.45, -r * 0.1], [r * 2.3, r * 1.2, r * 2.4], [0, 0, 0], 0.07); k.box(cs, [0, -r * 0.55, r * 0.6], [r * 2.0, r * 0.7, r * 1.0], [0, 0, 0], 0.04); for (const sx of [-1, 1]) k.cyl(glow(c.accent, 3.2), [sx * r * 0.4, r * 0.1, r * 0.98], r * 0.28, 0.04, [90, 0, 0], 10); break;
    case 'angel': k.shape(glow('#ffe9a0', 2.5), { type: 'torus', radius: r * 0.95, tube: 0.018, radialSegments: 8, tubularSegments: 28, arc: 360, tubeScaleY: 1 }, [], [0, r * 1.9, 0]); k.box(mat('#6b4a2c'), [0, r * 0.7, -r * 0.2], [r * 2.1, r * 0.8, r * 1.9], [0, 0, 0], 0.05); break;
    case 'engineer': k.shape(cp, { type: 'sphere', radius: r * 1.12, widthSegments: 14, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 95 }, [], [0, r * 0.2, 0]); k.box(cp, [0, r * 0.15, r * 0.95], [r * 1.6, 0.03, r * 0.7]); k.box(ca, [0, r * 0.9, r * 0.5], [r * 0.5, r * 0.25, r * 0.4]); break;
    default: // sleek: hair, goggles or headphones
      if (id === 'orbit') { k.box(cp, [0, r * 0.55, -r * 0.1], [r * 2.1, r * 0.9, r * 2.1], [0, 0, 0], 0.06); k.box(cp, [0, -r * 0.6, -r * 0.9], [r * 0.7, r * 2.2, r * 0.5], [0, 0, 0], 0.05); k.box(ca, [0, r * 0.1, r * 0.98], [r * 1.5, r * 0.3, 0.03]); }
      else if (id === 'flicker') { k.box(cp, [0, r * 0.65, -r * 0.1], [r * 2.2, r * 0.8, r * 2.1], [0, 0, 0], 0.07); for (const sx of [-1, 1]) k.cyl(glow(c.accent, 3), [sx * r * 0.45, r * 0.15, r * 1.0], r * 0.42, 0.06, [90, 0, 0], 12); k.box(dark, [0, r * 0.15, r * 0.97], [r * 2.0, r * 0.14, 0.03]); }
      else { k.box(dark, [0, r * 0.6, -r * 0.15], [r * 2.1, r * 0.8, r * 2.0], [0, 0, 0], 0.07); for (const sx of [-1, 1]) { k.cyl(cs, [sx * r * 1.1, 0, 0], r * 0.7, 0.11, [0, 0, 90], 14); k.cyl(glow(c.accent, 2.8), [sx * r * 1.17, 0, 0], r * 0.45, 0.04, [0, 0, 90], 14); } k.box(cs, [0, r * 1.05, 0], [r * 2.3, 0.05, 0.07]); }
  }
}
function extras(spine, hips, look, id, L, m) {
  const { tw, th, td, cp, cs, ca, dark, c } = m;
  const add = (name, build, x, y, z, rot) => { const n = group(name, build); n.position.set([x, y, z]); if (rot) n.setEuler(...rot); spine.add(n); return n; };
  switch (id) {
    case 'bulwark': add('Pack', (k) => { k.box(cs, [0, 0.28, 0], [tw * 0.8, 0.5, 0.2], [0, 0, 0], 0.04); k.cyl(ca, [0, 0.3, -0.12], 0.14, 0.06, [90, 0, 0], 12); }, 0, 0.1, -td / 2 - 0.1); break;
    case 'mauler': add('Scrap', (k) => { k.box(dark, [0.12, 0.3, 0], [0.34, 0.5, 0.22], [0, 0, 12], 0.03); k.cyl(cs, [-0.15, 0.4, 0], 0.07, 0.55, [0, 0, 20], 8); for (let i = 0; i < 3; i++) k.cyl(ca, [-0.15 + i * 0.04, 0.7 + i * 0.03, 0], 0.025, 0.1, [0, 0, 20], 6); }, 0, 0.1, -td / 2 - 0.12); break;
    case 'orbit': add('Orbiters', (k) => { for (let i = 0; i < 3; i++) { const a = i * 2.1; k.shape(glow(c.accent, 3), { type: 'sphere', radius: 0.05, widthSegments: 10, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [Math.cos(a) * 0.5, 0.35 + Math.sin(a * 2) * 0.1, Math.sin(a) * 0.5]); } k.shape(glow(c.accent, 1.5), { type: 'torus', radius: 0.5, tube: 0.008, radialSegments: 6, tubularSegments: 36, arc: 360, tubeScaleY: 1 }, [], [0, 0.35, 0]); }, 0, 0.3, 0); break;
    case 'sabre': add('Pack', (k) => { k.box(cs, [0, 0.3, 0], [tw * 0.8, 0.46, 0.16], [0, 0, 0], 0.03); k.box(ca, [0.12, 0.45, -0.09], [0.06, 0.2, 0.03]); }, 0, 0.1, -td / 2 - 0.08); break;
    case 'cinder': add('Coat', (k) => { k.box(cp, [0, -0.2, -0.02], [tw * 1.02, 0.5, td * 1.15], [0, 0, 0], 0.05); k.box(ca, [0, -0.43, 0.0], [tw * 1.05, 0.04, td * 1.2]); }, 0, 0.1, 0); break;
    case 'vesper': add('Scarf', (k) => { k.box(cs, [0, th - 0.02, 0.04], [tw * 0.8, 0.12, td * 1.2], [0, 0, 0], 0.04); k.box(cs, [-0.18, th - 0.26, -td / 2 - 0.02], [0.1, 0.42, 0.04], [0, 0, 6], 0.02); k.box(cs, [0.05, 0.3, -td / 2 - 0.1], [0.1, 0.6, 0.12]); }, 0, 0, 0); break;
    case 'flicker': add('Chrono', (k) => { k.cyl(dark, [0, th * 0.55, 0.02], 0.16, 0.05, [90, 0, 0], 16); k.cyl(glow(c.accent, 3.2), [0, th * 0.55, td / 2 + 0.02], 0.12, 0.03, [90, 0, 0], 16); k.box(cs, [0, 0.3, -td / 2 - 0.07], [0.22, 0.3, 0.12]); }, 0, 0, 0); break;
    case 'halo': {
      const wing = (sx) => { const n = group('Wing', (k) => { k.shape(glow('#fff7d6', 0.7), { type: 'plane', width: 0.9, depth: 0.55, subdivisions: 2 }, [], [sx * 0.45, 0.02, 0], [0, 0, sx * -25]); k.box(mat('#fff7d6', { roughness: 0.4 }), [sx * 0.35, 0.05, 0], [0.7, 0.02, 0.12], [0, 0, sx * -25]); }); n.position.set([sx * 0.1, th - 0.08, -td / 2 - 0.05]); n.setEuler(0, sx * -20, 0); spine.add(n); n.userData.wing = sx; };
      wing(1); wing(-1); break;
    }
    case 'pylon': add('Pack', (k) => { k.box(cs, [0, 0.3, 0], [tw * 0.9, 0.5, 0.22], [0, 0, 0], 0.04); k.cyl(dark, [-0.15, 0.62, -0.05], 0.035, 0.5, [0, 0, 0], 8); k.box(ca, [0.12, 0.55, -0.13], [0.08, 0.2, 0.03]); k.cyl(cp, [0.2, 0.14, -0.1], 0.05, 0.3, [0, 0, 90], 8); }, 0, 0.1, -td / 2 - 0.12); break;
    case 'zephyr': add('Speaker', (k) => { k.box(dark, [0, 0.3, 0], [tw * 0.9, 0.48, 0.2], [0, 0, 0], 0.04); for (const sy of [0.18, 0.42]) { k.cyl(cs, [0, sy, -0.11], 0.1, 0.03, [90, 0, 0], 14); k.cyl(glow(c.accent, 2.4), [0, sy, -0.13], 0.05, 0.02, [90, 0, 0], 14); } }, 0, 0.1, -td / 2 - 0.1); break;
  }
}

// ------------------------------------------------------------------ deployables
export function buildPylon(c) {
  return group('Pylon', (k) => { k.cyl(mat('#373d44', { metallic: 0.6 }), [0, 0.1, 0], 0.4, 0.2, [0, 0, 0], 12); k.cyl(mat(c.primary), [0, 0.55, 0], 0.18, 0.8, [0, 0, 0], 10); k.shape(glow('#9dff9d', 3), { type: 'sphere', radius: 0.2, widthSegments: 14, heightSegments: 10, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0, 1.1, 0]); });
}
export function buildSentry(c) {
  const root = new E.Node('Sentry');
  root.add(group('SentryBase', (k) => { for (let i = 0; i < 3; i++) { const a = i * 2.09; k.cyl(mat('#373d44', { metallic: 0.6 }), [Math.cos(a) * 0.28, 0.25, Math.sin(a) * 0.28], 0.03, 0.5, [Math.sin(a) * 25, 0, -Math.cos(a) * 25], 6); } k.cyl(mat(c.primary), [0, 0.55, 0], 0.22, 0.2, [0, 0, 0], 10); }));
  const head = group('SentryHead', (k) => { k.box(mat(c.primary), [0, 0, 0], [0.4, 0.3, 0.5], [0, 0, 0], 0.04); k.cyl(mat('#23262d'), [0.09, 0, 0.42], 0.035, 0.45, [90, 0, 0], 8); k.cyl(mat('#23262d'), [-0.09, 0, 0.42], 0.035, 0.45, [90, 0, 0], 8); k.box(glow(c.accent, 3), [0, 0.12, 0.2], [0.18, 0.05, 0.1]); });
  head.position.set([0, 0.85, 0]); root.add(head); root.userData.head = head;
  return root;
}
