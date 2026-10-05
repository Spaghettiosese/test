// The operator model: a rigged ShapeForge Character built from parametric shapes (no art assets).
// One shared skeleton and one set of generated animation clips (idle, walk, run, strafes,
// crouch, crawl) serve every operator; the look (skin, uniform, headgear, gear) comes from the
// operator's `look` record. Held weapons use the engine's PropHandler with a per-soldier hold
// that is re-aimed every frame, so a soldier's rifle follows its target pitch.
import { Character, expandSkeleton } from '../../../engine/character.js';
import { Skeleton } from '../../../engine/skeleton.js';
import { Clip, Mixer } from '../../../engine/animation.js';
import { quat, vec3 } from '../../../engine/math.js';
import { synthesizeLocomotion, synthesizeIdle, synthesizeCrawl } from '../../../engine/gait.js';
import { HOLDS } from '../../../engine/handling.js';
import { P, rbox, cyl, sph, sq } from '../../weapons/rig.js';

// ------------------------------------------------------------------ skeleton (metres, +x = character's left)
const FINGERS = [['index', 0.026, 0.07], ['middle', 0.009, 0.077], ['ring', -0.008, 0.07], ['pinky', -0.024, 0.056]];
const WR = [0.236, 0.885, 0.03], KN_Y = WR[1] - 0.085, FX = WR[0] + 0.012;
export const SKELETON = [
  { name: 'root', parent: null, head: [0, 0, 0], tail: [0, 0.1, 0], deform: false },
  { name: 'hips', parent: 'root', head: [0, 0.97, 0], tail: [0, 1.04, 0] },
  { name: 'spine', parent: 'hips', head: [0, 1.04, 0], tail: [0, 1.22, 0] },
  { name: 'chest', parent: 'spine', head: [0, 1.22, 0], tail: [0, 1.44, 0] },
  { name: 'neck', parent: 'chest', head: [0, 1.46, 0], tail: [0, 1.57, 0] },
  { name: 'head', parent: 'neck', head: [0, 1.57, 0], tail: [0, 1.79, 0] },
  { name: 'shoulder.L', parent: 'chest', head: [0.185, 1.43, 0], tail: [0.2, 1.43, 0], mirror: true },
  { name: 'upperArm.L', parent: 'shoulder.L', head: [0.2, 1.43, 0], tail: [0.225, 1.155, 0.01], mirror: true },
  { name: 'foreArm.L', parent: 'upperArm.L', head: [0.225, 1.155, 0.01], tail: WR, mirror: true },
  { name: 'hand.L', parent: 'foreArm.L', head: WR, tail: [FX, KN_Y, WR[2] + 0.01], mirror: true },
  ...FINGERS.flatMap(([n, z, len]) => [
    { name: n + '1.L', parent: 'hand.L', head: [FX, KN_Y, WR[2] + z], tail: [FX, KN_Y - len * 0.55, WR[2] + z], mirror: true },
    { name: n + '2.L', parent: n + '1.L', head: [FX, KN_Y - len * 0.55, WR[2] + z], tail: [FX, KN_Y - len, WR[2] + z], mirror: true },
  ]),
  { name: 'thumb1.L', parent: 'hand.L', head: [WR[0] + 0.004, WR[1] - 0.03, WR[2] + 0.04], tail: [WR[0], WR[1] - 0.07, WR[2] + 0.056], mirror: true },
  { name: 'thumb2.L', parent: 'thumb1.L', head: [WR[0], WR[1] - 0.07, WR[2] + 0.056], tail: [WR[0] - 0.004, WR[1] - 0.105, WR[2] + 0.07], mirror: true },
  { name: 'thigh.L', parent: 'hips', head: [0.092, 0.96, 0], tail: [0.092, 0.5, 0.01], mirror: true },
  { name: 'shin.L', parent: 'thigh.L', head: [0.092, 0.5, 0.01], tail: [0.092, 0.09, 0], mirror: true },
  { name: 'foot.L', parent: 'shin.L', head: [0.092, 0.09, 0], tail: [0.092, 0.045, 0.13], mirror: true },
  { name: 'toe.L', parent: 'foot.L', head: [0.092, 0.045, 0.13], tail: [0.092, 0.025, 0.2], mirror: true },
];

// ------------------------------------------------------------------ helpers
const E = (q) => Array.from(quat.toEuler([0, 0, 0], q));
// a capsule from point a to point b (character space)
function limb(name, a, b, r, mat, bind, o = {}) {
  const d = vec3.sub([0, 0, 0], b, a), len = vec3.len(d);
  const q = quat.rotationTo(quat.create(), [0, 1, 0], vec3.scale([0, 0, 0], d, 1 / len));
  return P(name, { type: 'capsule', radius: r, length: Math.max(0.001, len - 2 * r), radialSegments: o.seg || 12, capSegments: 4 }, mat, bind, { position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], rotation: E(q), mirror: o.mirror, scale: o.scale });
}
const at = (x, y, z) => [x, y, z];

export function lookMaterials(look) {
  const dark = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  return {
    skin: { color: look.skin, roughness: 0.62, pattern: 'skin', patternScale: 60, patternStrength: 0.25, sheen: 0.25 },
    uni: { color: look.uni, roughness: 0.92, pattern: 'fabric', patternScale: 220, patternStrength: 0.45, sheen: 0.6 },
    uniDark: { color: dark(look.uni, 0.72), roughness: 0.92, pattern: 'fabric', patternScale: 220, patternStrength: 0.45, sheen: 0.5 },
    trim: { color: look.trim, roughness: 0.78, pattern: 'fabric', patternScale: 150, patternStrength: 0.5, sheen: 0.4 },
    trimLight: { color: dark(look.trim, 1.5), roughness: 0.8, pattern: 'fabric', patternScale: 150 },
    head: { color: look.headColor, roughness: 0.75, pattern: look.head === 'helmet' ? 'none' : 'fabric', patternScale: 200, patternStrength: 0.4, sheen: look.head === 'helmet' ? 0 : 0.4 },
    mask: { color: look.mask || '#1d1d1f', roughness: 0.9, pattern: 'fabric', patternScale: 260, patternStrength: 0.6 },
    glove: { color: '#26231f', roughness: 0.62, pattern: 'leather', patternScale: 340, patternColor: '#14110e', sheen: 0.3 },
    boot: { color: '#2a2622', roughness: 0.55, pattern: 'leather', patternScale: 240, patternColor: '#12100d' },
    black: { color: '#17181a', roughness: 0.5, metallic: 0.2 },
    steel: { color: '#8e969c', roughness: 0.35, metallic: 0.9 },
    lens: { color: '#0b0d10', roughness: 0.04, metallic: 0.9 },
    visor: { color: '#1b2630', roughness: 0.05, metallic: 0.8, emissive: '#5a8ab0', emissiveStrength: 0.15 },
    stripe: { color: look.stripe || '#c8a050', roughness: 0.7 },
    strap: { color: '#1c1b18', roughness: 0.9, pattern: 'fabric', patternScale: 300 },
    pack: { color: dark(look.uni, 0.85), roughness: 0.9, pattern: 'fabric', patternScale: 180, patternStrength: 0.5 },
    red: { color: '#c03030', roughness: 0.6 },
  };
}

function headParts(look) {
  const parts = [], H = { bone: 'head' };
  const hs = look.head;
  if (hs === 'helmet') {
    parts.push(P('Helmet', sq(0.118, 0.1, 0.13, 0.8, 0.9, 20), 'head', H, { position: at(0, 1.72, 0.005), scale: [1, 1, 1.02] }));
    parts.push(P('Helmet Rim', sq(0.123, 0.03, 0.135, 0.5, 0.9, 20), 'head', H, { position: at(0, 1.665, 0.005) }));
    parts.push(P('Helmet Stripe', rbox(0.02, 0.012, 0.22, 0.004), 'stripe', H, { position: at(0, 1.822, 0.0) }));
    parts.push(P('NVG Mount', rbox(0.05, 0.04, 0.03, 0.006), 'black', H, { position: at(0, 1.74, 0.13) }));
    if (look.visor) parts.push(P('Visor', rbox(0.15, 0.07, 0.02, 0.01), 'visor', H, { position: at(0, 1.68, 0.1), rotation: [-8, 0, 0] }));
  } else if (hs === 'cap') {
    parts.push(P('Cap', sq(0.105, 0.075, 0.115, 0.8, 0.9, 18), 'head', H, { position: at(0, 1.74, 0) }));
    parts.push(P('Cap Bill', rbox(0.11, 0.012, 0.075, 0.005), 'head', H, { position: at(0, 1.70, 0.14), rotation: [-8, 0, 0] }));
  } else if (hs === 'beret') {
    parts.push(P('Beret', sq(0.14, 0.04, 0.125, 0.6, 0.9, 18), 'head', H, { position: at(-0.015, 1.77, -0.01), rotation: [0, 0, 8] }));
    parts.push(P('Beret Badge', rbox(0.02, 0.02, 0.01, 0.003), 'stripe', H, { position: at(0.07, 1.76, 0.09) }));
  } else if (hs === 'hood') {
    parts.push(P('Hood', sq(0.125, 0.125, 0.14, 0.85, 0.9, 18), 'head', H, { position: at(0, 1.7, -0.01) }));
    parts.push(P('Hood Back', sq(0.11, 0.12, 0.12, 0.7, 0.9, 16), 'head', { bones: ['neck', 'head'], falloff: 8 }, { position: at(0, 1.58, -0.07) }));
  } else if (hs === 'gasmask') {
    parts.push(P('Mask Shell', sq(0.108, 0.115, 0.118, 0.8, 0.9, 18), 'mask', H, { position: at(0, 1.68, 0.01) }));
    parts.push(P('Lens L', sq(0.032, 0.026, 0.01, 0.6, 0.9, 12), 'lens', H, { position: at(0.04, 1.7, 0.118), mirror: true }));
    parts.push(P('Filter', cyl(0.032, 0.032, 0.05, 14), 'black', H, { position: at(0, 1.635, 0.14), rotation: [90, 0, 0] }));
    parts.push(P('Hood Top', sq(0.115, 0.07, 0.125, 0.8, 0.9, 16), 'head', H, { position: at(0, 1.745, 0) }));
  } else if (hs === 'balaclava') {
    parts.push(P('Balaclava', sq(0.108, 0.118, 0.118, 0.85, 0.9, 18), 'head', H, { position: at(0, 1.685, 0.005) }));
    parts.push(P('Eye Slot', rbox(0.15, 0.03, 0.02, 0.006), 'skin', H, { position: at(0, 1.7, 0.112) }));
  } else if (hs === 'headband') {
    parts.push(P('Headband', cyl(0.105, 0.105, 0.035, 20, false), 'head', H, { position: at(0, 1.725, 0.005) }));
  }
  // communications headset and mic
  parts.push(P('Ear Cup', cyl(0.04, 0.04, 0.035, 14), 'black', H, { position: at(0.108, 1.69, -0.005), rotation: [0, 0, 90], mirror: true }));
  parts.push(P('Headset Band', rbox(0.01, 0.012, 0.1, 0.004), 'black', H, { position: at(0.1, 1.76, 0.0), rotation: [0, 0, 20], mirror: true }));
  parts.push(P('Mic Boom', rbox(0.01, 0.01, 0.08, 0.004), 'black', H, { position: at(0.095, 1.65, 0.06), rotation: [0, -20, 0] }));
  if (look.glasses) parts.push(P('Sunglasses', rbox(0.17, 0.034, 0.035, 0.012), 'lens', H, { position: at(0, 1.695, 0.105) }));
  return parts;
}

function packParts(look) {
  const C = { bone: 'chest' }, out = [];
  switch (look.pack) {
    case 'tank': out.push(P('Tank', cyl(0.07, 0.07, 0.36, 14), 'steel', C, { position: at(0.07, 1.3, -0.17) }), P('Tank 2', cyl(0.07, 0.07, 0.36, 14), 'steel', C, { position: at(-0.07, 1.3, -0.17) }), P('Pack Frame', rbox(0.28, 0.3, 0.07, 0.02), 'pack', C, { position: at(0, 1.3, -0.12) })); break;
    case 'radio': out.push(P('Pack', rbox(0.3, 0.34, 0.12, 0.03), 'pack', C, { position: at(0, 1.3, -0.16) }), P('Radio', rbox(0.1, 0.16, 0.07, 0.01), 'black', C, { position: at(0.08, 1.4, -0.24) }), P('Antenna', cyl(0.006, 0.006, 0.4, 6), 'black', C, { position: at(0.12, 1.65, -0.24) })); break;
    case 'drone': out.push(P('Pack', rbox(0.3, 0.34, 0.12, 0.03), 'pack', C, { position: at(0, 1.3, -0.16) }), P('Drone Case', rbox(0.24, 0.12, 0.2, 0.02), 'black', C, { position: at(0, 1.22, -0.27) }), P('Drone Light', rbox(0.04, 0.02, 0.01, 0.004), 'stripe', C, { position: at(0.07, 1.22, -0.375) })); break;
    case 'bags': out.push(P('Pack', rbox(0.32, 0.38, 0.14, 0.04), 'pack', C, { position: at(0, 1.3, -0.17) }), P('Side Bag', rbox(0.08, 0.16, 0.12, 0.02), 'trim', C, { position: at(0.18, 1.2, -0.17), mirror: true }), P('Roll', cyl(0.05, 0.05, 0.34, 12), 'trimLight', C, { position: at(0, 1.5, -0.16), rotation: [0, 0, 90] })); break;
    case 'medic': out.push(P('Pack', rbox(0.3, 0.34, 0.12, 0.03), 'pack', C, { position: at(0, 1.3, -0.16) }), P('Cross V', rbox(0.04, 0.16, 0.012, 0.004), 'red', C, { position: at(0, 1.3, -0.225) }), P('Cross H', rbox(0.16, 0.04, 0.012, 0.004), 'red', C, { position: at(0, 1.3, -0.226) })); break;
    default: out.push(P('Small Pack', rbox(0.26, 0.26, 0.08, 0.02), 'pack', C, { position: at(0, 1.3, -0.14) }));
  }
  return out;
}

export function soldierDef(op, { hero = false } = {}) {
  const look = op.look, T = { bone: 'chest' }, HP = { bone: 'hips' };
  const parts = [];
  // ---- torso
  parts.push(
    P('Pelvis', sq(0.17, 0.1, 0.1, 0.5, 0.7, 14), 'uniDark', HP, { position: at(0, 1.0, 0) }),
    P('Abdomen', sq(0.155, 0.12, 0.095, 0.5, 0.7, 14), 'uni', { bones: ['hips', 'spine'], falloff: 7 }, { position: at(0, 1.12, 0) }),
    P('Chest', sq(0.185, 0.17, 0.105, 0.5, 0.65, 16), 'uni', { bones: ['spine', 'chest'], falloff: 7 }, { position: at(0, 1.31, 0) }),
    P('Neck', cyl(0.045, 0.05, 0.12, 12), 'skin', { bones: ['chest', 'neck', 'head'], falloff: 6 }, { position: at(0, 1.52, 0) }),
    P('Head', sq(0.088, 0.108, 0.098, 0.75, 0.85, 20), 'skin', { bone: 'head' }, { position: at(0, 1.675, 0.006) }),
    P('Nose', rbox(0.02, 0.03, 0.03, 0.008), 'skin', { bone: 'head' }, { position: at(0, 1.665, 0.1) }),
    // plate carrier, mag pouches, belt
    P('Plate Carrier', rbox(0.37, 0.34, 0.235, 0.05), 'trim', { bones: ['spine', 'chest'], falloff: 8 }, { position: at(0, 1.3, 0.0) }),
    P('Plate Front', rbox(0.25, 0.26, 0.03, 0.02), 'trimLight', T, { position: at(0, 1.33, 0.125) }),
    P('Mag Pouches', rbox(0.27, 0.12, 0.05, 0.015), 'black', T, { position: at(0, 1.18, 0.14) }),
    P('Shoulder Pad', rbox(0.1, 0.05, 0.11, 0.02), 'trim', { bone: 'chest' }, { position: at(0.16, 1.46, 0), mirror: true }),
    P('Belt', rbox(0.34, 0.07, 0.21, 0.02), 'strap', { bones: ['hips', 'spine'], falloff: 6 }, { position: at(0, 1.06, 0) }),
    P('Holster', rbox(0.07, 0.16, 0.05, 0.015), 'black', { bone: 'thigh.R' }, { position: at(-0.15, 0.88, 0.01) }),
    P('Patch', rbox(0.01, 0.07, 0.07, 0.003), 'stripe', { bone: 'upperArm.L' }, { position: at(0.272, 1.33, 0), mirror: true }),
  );
  // ---- arms
  parts.push(
    limb('Upper Arm', at(0.2, 1.43, 0), at(0.225, 1.155, 0.01), 0.054, 'uni', { bones: ['upperArm.L', 'foreArm.L'], falloff: 9 }, { mirror: true }),
    limb('Fore Arm', at(0.225, 1.155, 0.01), at(WR[0], WR[1] + 0.02, WR[2]), 0.046, 'uni', { bones: ['upperArm.L', 'foreArm.L', 'hand.L'], falloff: 9 }, { mirror: true }),
    P('Elbow Pad', sq(0.05, 0.06, 0.052, 0.6, 0.8, 12), 'trim', { bones: ['upperArm.L', 'foreArm.L'], falloff: 7 }, { position: at(0.228, 1.15, -0.012), mirror: true }),
    P('Glove', rbox(0.034, 0.09, 0.08, 0.014), 'glove', { bone: 'hand.L' }, { position: at(WR[0] + 0.008, WR[1] - 0.045, WR[2] + 0.003), mirror: true }),
    P('Glove Cuff', cyl(0.036, 0.04, 0.05, 14, false), 'glove', { bones: ['foreArm.L', 'hand.L'], falloff: 9 }, { position: at(WR[0], WR[1] + 0.01, WR[2]), mirror: true }),
    P('Thumb', { type: 'capsule', radius: 0.011, length: 0.05, radialSegments: 8, capSegments: 3 }, 'glove', { bones: ['hand.L', 'thumb1.L', 'thumb2.L'], falloff: 9 }, { position: at(WR[0], WR[1] - 0.066, WR[2] + 0.055), rotation: [-24, 0, -6], mirror: true }),
  );
  for (const [n, z, len] of FINGERS) parts.push(P(n + ' Finger', { type: 'capsule', radius: 0.0095, length: len - 0.019, radialSegments: hero ? 10 : 6, capSegments: 3 }, 'glove', { bones: ['hand.L', n + '1.L', n + '2.L'], falloff: 9 }, { position: at(FX, KN_Y - len / 2 + 0.004, WR[2] + z), mirror: true }));
  // ---- legs
  parts.push(
    limb('Thigh', at(0.092, 0.96, 0), at(0.092, 0.5, 0.01), 0.083, 'uni', { bones: ['hips', 'thigh.L', 'shin.L'], falloff: 8 }, { mirror: true }),
    limb('Shin', at(0.092, 0.5, 0.01), at(0.092, 0.12, 0), 0.062, 'uni', { bones: ['thigh.L', 'shin.L', 'foot.L'], falloff: 8 }, { mirror: true }),
    P('Knee Pad', sq(0.07, 0.07, 0.05, 0.6, 0.8, 12), 'trim', { bones: ['thigh.L', 'shin.L'], falloff: 7 }, { position: at(0.092, 0.5, 0.062), mirror: true }),
    P('Boot', rbox(0.1, 0.1, 0.27, 0.03), 'boot', { bone: 'foot.L' }, { position: at(0.092, 0.075, 0.065), mirror: true }),
    P('Boot Shaft', cyl(0.062, 0.066, 0.14, 12), 'boot', { bones: ['shin.L', 'foot.L'], falloff: 8 }, { position: at(0.092, 0.17, -0.005), mirror: true }),
    P('Thigh Pouch', rbox(0.06, 0.12, 0.1, 0.02), 'trim', { bone: 'thigh.L' }, { position: at(0.17, 0.82, 0.01), mirror: true }),
  );
  parts.push(...headParts(look), ...packParts(look));
  // ---- extra detail for the menu hero
  if (hero) parts.push(P('Watch', rbox(0.014, 0.034, 0.034, 0.006), 'black', { bone: 'foreArm.L' }, { position: at(WR[0] + 0.04, WR[1] + 0.07, WR[2]) }), P('Radio Pouch', rbox(0.06, 0.1, 0.05, 0.012), 'black', T, { position: at(-0.19, 1.28, 0.1) }));
  return {
    name: op.name, skeleton: SKELETON, materials: lookMaterials(look), parts, clips: [],
    firstPerson: { fov: 60 },
  };
}

// ------------------------------------------------------------------ shared animation clips
let CLIPS = null;
export function soldierClips() {
  if (CLIPS) return CLIPS;
  const sk = new Skeleton(expandSkeleton(SKELETON));
  const loco = (name, o) => synthesizeLocomotion(sk, { name, hands: 'relaxed', ...o });
  CLIPS = [
    synthesizeIdle(sk, { name: 'Idle', hipHeight: 0.955 }),
    loco('Walk', { duration: 0.95, speed: 1.9, hipHeight: 0.925, armSwing: 6, elbow: 30, elbowSwing: 6, stance: 0.62 }),
    loco('Run', { duration: 0.66, speed: 4.2, hipHeight: 0.905, armSwing: 10, elbow: 50, elbowSwing: 10, stance: 0.5, lean: 8, bob: 0.03 }),
    loco('WalkBack', { duration: 1.0, speed: 1.6, hipHeight: 0.925, heading: 180, armSwing: 4, elbow: 30 }),
    loco('StrafeL', { duration: 0.95, speed: 1.7, hipHeight: 0.925, heading: 90, armSwing: 4, elbow: 30 }),
    loco('StrafeR', { duration: 0.95, speed: 1.7, hipHeight: 0.925, heading: -90, armSwing: 4, elbow: 30 }),
    synthesizeIdle(sk, { name: 'CrouchIdle', hipHeight: 0.66, footX: 0.14 }),
    loco('CrouchWalk', { duration: 1.1, speed: 1.1, hipHeight: 0.66, armSwing: 3, elbow: 30, stance: 0.6, stepWidth: 0.12 }),
    synthesizeCrawl(sk, { name: 'Crawl', speed: 0.35 }),
  ];
  for (const c of CLIPS) c.duration = c.duration || 1;
  return CLIPS;
}

// ------------------------------------------------------------------ the character
export function makeSoldier(op, { hero = false, detail = hero ? 1.5 : 0.8 } = {}) {
  const def = soldierDef(op, { hero });
  def.clips = soldierClips();
  const ch = new Character(def, { detail });
  ch.springs = false;
  ch.opId = op.id;
  ch.holdKey = 'aim_' + ch.id;
  HOLDS[ch.holdKey] = { pos: [0, 0, 0], rot: [0, 0, 0] };
  ch.play('Idle', { fade: 0 });
  return ch;
}

// ---- weapon holding: the hold is rewritten each frame so the rifle follows pitch and stance
const HOLD_BASE = {
  rifle: { pos: [0.075, -0.075, 0.22], rot: [0, 2, 0] },
  rifleLow: { pos: [0.05, -0.2, 0.15], rot: [35, 60, 0] },
  pistol: { pos: [0.04, -0.03, 0.56], rot: [0, 4, 0] },
  pistolLow: { pos: [0.02, -0.42, 0.3], rot: [38, 0, 0] },
};
export function equipWeapon(ch, prop, { twoHanded = true } = {}) {
  ch.heldProp = prop;
  ch.holdStyle = twoHanded ? 'rifle' : 'pistol';
  const h = ch.equip(prop, { hold: ch.holdKey });
  ch.handler = h;
  return h;
}
// aim: 1 = shouldered and aiming, 0 = lowered ready; pitch in radians (+ looks down)
export function poseHold(ch, { aim = 1, pitch = 0 } = {}) {
  const H = HOLDS[ch.holdKey]; if (!H) return;
  const a = HOLD_BASE[ch.holdStyle || 'rifle'], b = HOLD_BASE[(ch.holdStyle || 'rifle') + 'Low'];
  const lerp = (x, y) => x.map((v, i) => v + (y[i] - v) * (1 - aim));
  let pos = lerp(a.pos, b.pos), rot = lerp(a.rot, b.rot);
  const c = Math.cos(pitch), s = Math.sin(pitch);
  pos = [pos[0], pos[1] * c - pos[2] * s, pos[1] * s + pos[2] * c];
  rot = [rot[0] + (pitch * 180) / Math.PI, rot[1], rot[2]];
  H.pos = pos; H.rot = rot;
}
