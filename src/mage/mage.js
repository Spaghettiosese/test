// The Ember Mage: a humanoid ShapeForge character (parametric shapes bound to a skeleton
// that follows the engine's humanoid bone names) plus its animation set, all authored with
// the engine's own tools: synthesizeIdle / synthesizeLocomotion for the cycles and
// keyPoseClip for the fire-casting actions. The clips carry events the game listens for
// ('fireball' when the hand opens, 'slam' when the fist hits the ground, 'footstep').
import { Character, expandSkeleton } from '../../engine/character.js';
import { Skeleton } from '../../engine/skeleton.js';
import { synthesizeIdle, synthesizeLocomotion } from '../../engine/gait.js';
import { keyPoseClip } from '../../engine/choreo.js';
import { P, rbox, cyl, sph, sq, tube } from '../weapons/rig.js';

// ---------------------------------------------------------------- skeleton
const FINGERS = [
  { name: 'index', z: 0.024, length: 0.07, radius: 0.0085 },
  { name: 'middle', z: 0.008, length: 0.078, radius: 0.009 },
  { name: 'ring', z: -0.008, length: 0.072, radius: 0.0085 },
  { name: 'pinky', z: -0.022, length: 0.058, radius: 0.0078 },
];
const SH = [0.2, 1.4, 0], EL = [0.215, 1.12, 0.01], WR = [0.225, 0.86, 0.02];
const KNUCKLE_Y = WR[1] - 0.085, FX = WR[0] + 0.005, HZ = WR[2];
const A = (dx, dy, dz) => [WR[0] + dx, WR[1] + dy, WR[2] + dz];

const SKELETON = [
  { name: 'root', parent: null, head: [0, 0, 0], tail: [0, 0.1, 0], deform: false },
  { name: 'hips', parent: 'root', head: [0, 0.955, 0], tail: [0, 1.05, 0] },
  { name: 'spine', parent: 'hips', head: [0, 1.05, 0], tail: [0, 1.2, 0] },
  { name: 'chest', parent: 'spine', head: [0, 1.2, 0], tail: [0, 1.42, 0] },
  { name: 'neck', parent: 'chest', head: [0, 1.46, 0], tail: [0, 1.55, 0] },
  { name: 'head', parent: 'neck', head: [0, 1.55, 0], tail: [0, 1.78, 0] },
  { name: 'shoulder.L', parent: 'chest', head: [0.06, 1.41, 0], tail: SH, mirror: true },
  { name: 'upperArm.L', parent: 'shoulder.L', head: SH, tail: EL, mirror: true },
  { name: 'foreArm.L', parent: 'upperArm.L', head: EL, tail: WR, mirror: true },
  { name: 'hand.L', parent: 'foreArm.L', head: WR, tail: [FX, KNUCKLE_Y, HZ], mirror: true },
  ...FINGERS.flatMap((f) => {
    const j = KNUCKLE_Y - f.length * 0.55, tip = KNUCKLE_Y - f.length;
    return [
      { name: f.name + '1.L', parent: 'hand.L', head: [FX, KNUCKLE_Y, HZ + f.z], tail: [FX, j, HZ + f.z], mirror: true },
      { name: f.name + '2.L', parent: f.name + '1.L', head: [FX, j, HZ + f.z], tail: [FX, tip, HZ + f.z], mirror: true },
    ];
  }),
  { name: 'thumb1.L', parent: 'hand.L', head: A(0.002, -0.025, 0.036), tail: A(-0.002, -0.06, 0.05), mirror: true },
  { name: 'thumb2.L', parent: 'thumb1.L', head: A(-0.002, -0.06, 0.05), tail: A(-0.006, -0.092, 0.062), mirror: true },
  { name: 'thigh.L', parent: 'hips', head: [0.095, 0.95, 0], tail: [0.1, 0.5, 0.03], mirror: true },
  { name: 'shin.L', parent: 'thigh.L', head: [0.1, 0.5, 0.03], tail: [0.1, 0.085, -0.005], mirror: true },
  { name: 'foot.L', parent: 'shin.L', head: [0.1, 0.085, -0.005], tail: [0.1, 0.03, 0.12], mirror: true },
  { name: 'toe.L', parent: 'foot.L', head: [0.1, 0.03, 0.12], tail: [0.1, 0.02, 0.2], mirror: true },
];

const MATERIALS = {
  robe: { color: '#7a1f18', roughness: 0.85, pattern: 'fabric', patternScale: 200, patternColor: '#3f0d0a', patternStrength: 0.5, sheen: 0.5 },
  robeDark: { color: '#4a1210', roughness: 0.85, pattern: 'fabric', patternScale: 160, patternStrength: 0.4 },
  trim: { color: '#e6a23a', roughness: 0.35, metallic: 0.9, pattern: 'metal', patternScale: 2 },
  leather: { color: '#4a3020', roughness: 0.6, pattern: 'leather', patternScale: 260, patternColor: '#26170d', sheen: 0.3 },
  skin: { color: '#c48a64', roughness: 0.6 },
  hair: { color: '#e8e2d6', roughness: 0.9, pattern: 'hair', patternScale: 30 },
  eye: { color: '#ffb347', roughness: 0.3, emissive: '#ff8a1e', emissiveStrength: 5 },
  ember: { color: '#ff8a2a', roughness: 0.4, emissive: '#ff5a10', emissiveStrength: 8 },
  glove: { color: '#2b1c14', roughness: 0.6, pattern: 'leather', patternScale: 320, patternColor: '#120a06', sheen: 0.35 },
};
const bind1 = (bone) => ({ bone });
const bindN = (...bones) => ({ bones, falloff: 8 });

function parts() {
  const L = [];
  // ---- body: robe skirt, tunic, belt, shoulders
  L.push(P('Robe Skirt', cyl(0.2, 0.36, 0.62, 28, false), 'robe', bindN('hips', 'thigh.L', 'thigh.R'), { position: [0, 0.66, 0] }));
  L.push(P('Robe Hem', cyl(0.36, 0.365, 0.05, 28, false), 'trim', bind1('hips'), { position: [0, 0.37, 0] }));
  L.push(P('Robe Front Panel', rbox(0.17, 0.62, 0.02, 0.006), 'robeDark', bind1('hips'), { position: [0, 0.66, 0.29], rotation: [-9, 0, 0] }));
  L.push(P('Hips', sq(0.17, 0.11, 0.13, 0.7, 0.8, 20), 'robe', bind1('hips'), { position: [0, 1.0, 0] }));
  L.push(P('Waist', sq(0.15, 0.1, 0.11, 0.7, 0.8, 20), 'robe', bind1('spine'), { position: [0, 1.13, 0] }));
  L.push(P('Chest', sq(0.185, 0.16, 0.12, 0.6, 0.75, 24), 'robe', bind1('chest'), { position: [0, 1.31, 0] }));
  L.push(P('Chest Trim', rbox(0.05, 0.3, 0.005, 0.002), 'trim', bind1('chest'), { position: [0, 1.28, 0.118] }));
  L.push(P('Belt', cyl(0.17, 0.175, 0.06, 28, false), 'leather', bind1('spine'), { position: [0, 1.06, 0] }));
  L.push(P('Buckle', rbox(0.05, 0.05, 0.02, 0.006), 'trim', bind1('spine'), { position: [0, 1.06, 0.17] }));
  L.push(P('Collar', cyl(0.1, 0.13, 0.08, 24, false), 'robeDark', bindN('chest', 'neck'), { position: [0, 1.46, 0] }));
  L.push(P('Shoulder Pad', sq(0.085, 0.05, 0.085, 0.6, 0.8, 16), 'leather', bind1('shoulder.L'), { position: [0.15, 1.43, 0], mirror: true }));
  L.push(P('Shoulder Ember', sph(0.022, 10, 8), 'ember', bind1('shoulder.L'), { position: [0.16, 1.47, 0], mirror: true }));
  // ---- head, hood-less: hair, beard, hat
  L.push(P('Neck', cyl(0.045, 0.05, 0.1, 14, false), 'skin', bind1('neck'), { position: [0, 1.5, 0] }));
  L.push(P('Head', sq(0.095, 0.115, 0.105, 0.75, 0.75, 26), 'skin', bind1('head'), { position: [0, 1.66, 0.005] }));
  L.push(P('Nose', sq(0.016, 0.022, 0.026, 0.8, 0.8, 10), 'skin', bind1('head'), { position: [0, 1.655, 0.105] }));
  L.push(P('Eye', sph(0.013, 10, 8), 'eye', bind1('head'), { position: [0.038, 1.685, 0.092], mirror: true, castShadow: false }));
  L.push(P('Brow', rbox(0.045, 0.008, 0.012, 0.003), 'hair', bind1('head'), { position: [0.038, 1.71, 0.098], rotation: [0, 0, -10], mirror: true }));
  L.push(P('Beard', sq(0.075, 0.09, 0.05, 0.6, 0.7, 16), 'hair', bind1('head'), { position: [0, 1.59, 0.075] }));
  L.push(P('Hair', sq(0.1, 0.08, 0.1, 0.7, 0.8, 18), 'hair', bind1('head'), { position: [0, 1.7, -0.03] }));
  L.push(P('Hat Brim', cyl(0.19, 0.19, 0.015, 30), 'robeDark', bind1('head'), { position: [0, 1.75, 0], rotation: [-4, 0, 0] }));
  L.push(P('Hat Band', cyl(0.115, 0.118, 0.035, 24, false), 'trim', bind1('head'), { position: [0, 1.775, 0] }));
  L.push({ ...P('Hat', { type: 'cone', radius: 0.115, height: 0.36, radialSegments: 26, heightSegments: 6, capBottom: false, arc: 360 }, 'robeDark', bind1('head'), { position: [0.0, 1.97, -0.02], rotation: [-12, 0, 0] }) });
  // ---- arms
  L.push(P('Sleeve', tube([[SH[0], SH[1] + 0.03, SH[2]], [SH[0] + 0.006, SH[1] - 0.13, SH[2]], EL, [EL[0] + 0.006, EL[1] - 0.13, EL[2]], A(0, 0.03, 0)], [0.058, 0.052, 0.046, 0.042, 0.062], { caps: false, samples: 8 }), 'robe', bindN('upperArm.L', 'foreArm.L'), { mirror: true }));
  L.push(P('Sleeve Cuff', cyl(0.062, 0.078, 0.07, 20, false), 'trim', bind1('foreArm.L'), { position: A(0, 0.05, 0), mirror: true }));
  L.push(P('Glove Wrist', cyl(0.028, 0.03, 0.06, 16, false), 'glove', bindN('foreArm.L', 'hand.L'), { position: A(0.002, -0.006, 0.001), mirror: true }));
  L.push(P('Palm', rbox(0.03, 0.09, 0.08, 0.012), 'glove', bind1('hand.L'), { position: A(0.007, -0.045, 0.003), mirror: true }));
  L.push(P('Palm Ember', sph(0.014, 10, 8), 'ember', bind1('hand.L'), { position: A(0.024, -0.05, 0.003), mirror: true, castShadow: false }));
  for (const f of FINGERS) {
    L.push(P(f.name[0].toUpperCase() + f.name.slice(1) + ' Finger', { type: 'capsule', radius: f.radius, length: f.length - f.radius, radialSegments: 10, capSegments: 4 }, 'glove', bindN('hand.L', f.name + '1.L', f.name + '2.L'), { position: [FX, KNUCKLE_Y + 0.004 - (f.length + f.radius) / 2 + f.radius, HZ + f.z], mirror: true }));
  }
  L.push(P('Thumb', { type: 'capsule', radius: 0.0105, length: 0.05, radialSegments: 10, capSegments: 4 }, 'glove', bindN('hand.L', 'thumb1.L', 'thumb2.L'), { position: A(-0.002, -0.062, 0.05), rotation: [-24, 0, -6], mirror: true }));
  // ---- legs: boots
  L.push(P('Boot Shaft', cyl(0.06, 0.05, 0.3, 16), 'leather', bindN('shin.L', 'foot.L'), { position: [0.1, 0.2, 0.0], mirror: true }));
  L.push(P('Boot Cuff', cyl(0.068, 0.062, 0.05, 16, false), 'trim', bind1('shin.L'), { position: [0.1, 0.36, 0.005], mirror: true }));
  L.push(P('Boot Foot', rbox(0.095, 0.06, 0.24, 0.02), 'leather', bindN('foot.L', 'toe.L'), { position: [0.1, 0.045, 0.05], mirror: true }));
  L.push(P('Leg', cyl(0.058, 0.05, 0.46, 14, false), 'robeDark', bindN('thigh.L', 'shin.L'), { position: [0.098, 0.6, 0.02], mirror: true }));
  return L;
}

export function mageDefinition({ clips = true } = {}) {
  const def = { name: 'Ember Mage', skeleton: SKELETON, materials: MATERIALS, parts: parts(), clips: [] };
  if (clips) def.clips = mageClips();
  return JSON.parse(JSON.stringify(def));
}

// ---------------------------------------------------------------- animations
const HANDS = {
  fist: { curl: [0.85, 1, 1, 1, 1], spread: 0 },
  claw: { curl: [0.4, 0.55, 0.6, 0.6, 0.65], spread: 0.7 },
  open: { curl: [0, 0, 0, 0, 0.05], spread: 0.6 },
  cup: { curl: [0.3, 0.45, 0.5, 0.55, 0.6], spread: 0.25 },
  relaxed: { curl: [0.2, 0.28, 0.36, 0.42, 0.5], spread: 0.15 },
};

function clipDefs(sk) {
  const out = [];
  out.push(synthesizeIdle(sk, { name: 'Idle', duration: 4, thumbHook: false, hipHeight: 0.955 }));
  out.push(synthesizeLocomotion(sk, { name: 'Walk', duration: 1.1, speed: 1.35, stance: 0.62, hipHeight: 0.945, armSwing: 14, hands: 'relaxed' }));
  out.push(synthesizeLocomotion(sk, { name: 'Run', duration: 0.68, speed: 4.4, stance: 0.42, hipHeight: 0.9, bob: 0.05, lean: 9, armSwing: 42, elbow: 70, elbowSwing: 18, kick: [0, 0.2, -0.1], drive: [0, 0.12, 0.2], swingPitchMid: 20, stepWidth: 0.09, spineLean: 3, chestLean: 3, hands: 'fist', pelvisYaw: 9, heelStrike: -10 }));

  // Fireball: draw the right hand back with a burning palm, throw it forward, follow through.
  out.push(keyPoseClip(sk, 'Fireball', [
    { t: 0, hips: [0, 0.94, 0], bones: { spine: [2, 0, 0], chest: [0, 0, 0] }, arms: { R: { target: [-0.24, 1.05, 0.2], pole: [-1, -0.4, -0.3] }, L: { target: [0.22, 1.05, 0.18], pole: [1, -0.4, -0.3] } }, legs: { L: 'plant', R: 'plant' }, hands: { R: 'relaxed', L: 'relaxed' } },
    { t: 0.22, hips: [0, 0.915, -0.02], bones: { spine: [4, 22, 0], chest: [0, 12, 0], head: [-6, -10, 0] }, arms: { R: { target: [-0.34, 1.4, -0.22], pole: [-1, 0.2, -0.6] }, L: { target: [0.28, 1.28, 0.28], pole: [1, -0.2, 0] } }, hands: { R: 'claw', L: 'open' } },
    { t: 0.4, hips: [0, 0.93, 0.03], bones: { spine: [-4, -26, 0], chest: [-4, -14, 0], head: [-4, 10, 0] }, arms: { R: { target: [-0.06, 1.42, 0.62], pole: [-1, -0.3, 0.3] }, L: { target: [0.3, 1.1, 0.05], pole: [1, -0.5, -0.4] } }, hands: { R: 'open', L: 'fist' } },
    { t: 0.62, hips: [0, 0.945, 0.02], bones: { spine: [0, -8, 0], chest: [0, -4, 0], head: [0, 0, 0] }, arms: { R: { target: [-0.14, 1.32, 0.5], pole: [-1, -0.4, 0] } }, hands: { R: 'open' } },
    { t: 0.95, hips: [0, 0.955, 0], bones: { spine: [0, 0, 0], chest: [0, 0, 0] }, arms: { R: { target: [-0.24, 1.05, 0.2], pole: [-1, -0.4, -0.3] }, L: { target: [0.22, 1.05, 0.18], pole: [1, -0.4, -0.3] } }, hands: { R: 'relaxed', L: 'relaxed' } },
  ], { events: [{ t: 0.4, name: 'fireball' }] }));

  // Flame stream: both palms forward, a steady breath of fire (loops while the button is held).
  out.push(keyPoseClip(sk, 'Flamethrower', [
    { t: 0, hips: [0, 0.93, 0], bones: { spine: [4, 0, 0], head: [-3, 0, 0] }, arms: { R: { target: [-0.12, 1.28, 0.5], pole: [-1, -0.3, 0] }, L: { target: [0.12, 1.3, 0.52], pole: [1, -0.3, 0] } }, legs: { L: { target: [0.16, 0.085, 0.16], pole: [0.1, 0, 1] }, R: { target: [-0.16, 0.085, -0.24], pole: [-0.1, 0, 1] } }, hands: { R: 'open', L: 'open' } },
    { t: 0.3, hips: [0, 0.925, -0.01], bones: { spine: [5, 1.5, 0] }, arms: { R: { target: [-0.14, 1.3, 0.53], pole: [-1, -0.3, 0] }, L: { target: [0.1, 1.28, 0.5], pole: [1, -0.3, 0] } }, hands: { R: 'claw', L: 'open' } },
    { t: 0.6, hips: [0, 0.93, 0], bones: { spine: [4, 0, 0] }, arms: { R: { target: [-0.12, 1.28, 0.5], pole: [-1, -0.3, 0] }, L: { target: [0.12, 1.3, 0.52], pole: [1, -0.3, 0] } }, hands: { R: 'open', L: 'open' } },
  ], { loop: true }));

  // Ground slam: rise with both fists overhead, then drive them down; a fire nova bursts at the impact.
  out.push(keyPoseClip(sk, 'Slam', [
    { t: 0, hips: [0, 0.955, 0], arms: { R: { target: [-0.22, 1.05, 0.2], pole: [-1, -0.4, -0.3] }, L: { target: [0.22, 1.05, 0.2], pole: [1, -0.4, -0.3] } }, legs: { L: 'plant', R: 'plant' }, hands: { R: 'relaxed', L: 'relaxed' } },
    { t: 0.45, hips: [0, 0.97, -0.02], bones: { spine: [-10, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0] }, arms: { R: { target: [-0.16, 1.98, -0.02], pole: [-1, 0, -0.5] }, L: { target: [0.16, 1.98, -0.02], pole: [1, 0, -0.5] } }, hands: { R: 'fist', L: 'fist' } },
    { t: 0.62, hips: [0, 0.8, 0.1], bones: { spine: [38, 0, 0], chest: [14, 0, 0], head: [-10, 0, 0] }, arms: { R: { target: [-0.12, 0.22, 0.52], pole: [-1, -0.2, 0.2] }, L: { target: [0.12, 0.22, 0.52], pole: [1, -0.2, 0.2] } }, legs: { L: 'plant', R: 'plant' }, hands: { R: 'fist', L: 'fist' } },
    { t: 1.05, hips: [0, 0.82, 0.08], bones: { spine: [34, 0, 0] }, hands: { R: 'open', L: 'open' } },
    { t: 1.5, hips: [0, 0.955, 0], bones: { spine: [0, 0, 0], chest: [0, 0, 0], head: [0, 0, 0] }, arms: { R: { target: [-0.22, 1.05, 0.2], pole: [-1, -0.4, -0.3] }, L: { target: [0.22, 1.05, 0.2], pole: [1, -0.4, -0.3] } }, hands: { R: 'relaxed', L: 'relaxed' } },
  ], { events: [{ t: 0.62, name: 'slam' }] }));

  // Jump: crouch, launch with the arms up, tuck, land.
  out.push(keyPoseClip(sk, 'Jump', [
    { t: 0, hips: [0, 0.955, 0], arms: { R: null, L: null }, legs: { L: 'plant', R: 'plant' }, hands: { R: 'relaxed', L: 'relaxed' } },
    { t: 0.18, hips: [0, 0.8, 0], bones: { spine: [12, 0, 0] }, arms: { R: { target: [-0.24, 0.9, -0.1], pole: [-1, 0, -0.5] }, L: { target: [0.24, 0.9, -0.1], pole: [1, 0, -0.5] } }, hands: { R: 'fist', L: 'fist' } },
    { t: 0.42, hips: [0, 1.15, 0], bones: { spine: [-4, 0, 0] }, arms: { R: { target: [-0.3, 1.7, 0.1], pole: [-1, 0, -0.3] }, L: { target: [0.3, 1.7, 0.1], pole: [1, 0, -0.3] } }, legs: { L: { target: [0.1, 0.36, 0.05], pole: [0.1, 0, 1] }, R: { target: [-0.1, 0.3, -0.12], pole: [-0.1, 0, 1] } }, hands: { R: 'open', L: 'open' } },
    { t: 0.8, hips: [0, 1.1, 0], legs: { L: { target: [0.1, 0.3, 0.1], pole: [0.1, 0, 1] }, R: { target: [-0.1, 0.28, -0.05], pole: [-0.1, 0, 1] } } },
  ], { loop: false }));
  return out;
}

export function mageClips() {
  const sk = new Skeleton(expandSkeleton(SKELETON));
  return clipDefs(sk);
}

export function createMage(opts = {}) {
  const c = new Character(mageDefinition(), opts);
  c.name = 'Ember Mage';
  c.springs = false;
  c.play('Idle', { fade: 0 });
  return c;
}

// Where a bone's head is right now, in world space (for spawning fire at the hands).
export function bonePoint(character, name, offset = [0, 0, 0]) {
  const sk = character.skeleton, i = sk.boneIndex(name), w = sk.world, o = i * 16;
  const local = [w[o + 12] + offset[0] * w[o] + offset[1] * w[o + 4] + offset[2] * w[o + 8], w[o + 13] + offset[0] * w[o + 1] + offset[1] * w[o + 5] + offset[2] * w[o + 9], w[o + 14] + offset[0] * w[o + 2] + offset[1] * w[o + 6] + offset[2] * w[o + 10]];
  const m = character.world;
  return [m[0] * local[0] + m[4] * local[1] + m[8] * local[2] + m[12], m[1] * local[0] + m[5] * local[1] + m[9] * local[2] + m[13], m[2] * local[0] + m[6] * local[1] + m[10] * local[2] + m[14]];
}
