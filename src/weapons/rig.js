// Shared first-person weapon rig for ShapeForge: a pair of gloved arms in a combat shirt,
// the shape helpers every gun uses, and a choreography baker that turns a few key poses
// per channel (weapon, wrists, fingers, attachable props, sliding parts) into ordinary
// editable Clips. It generalises the engine's M1 Garand rig so any gun can plug into it.
//
// Rig space: the eye sits at the origin looking down +Z, +Y is up and +X is the viewer's
// left. Weapon space: the origin is just ahead of the trigger, +Z runs to the muzzle.
import { Character, expandSkeleton } from '../../engine/character.js';
import { Skeleton } from '../../engine/skeleton.js';
import { quat, vec3, mat4 } from '../../engine/math.js';
import { twoBoneIK, setWorldRotation } from '../../engine/ik.js';
import { applyHandPose, blendHandPoses } from '../../engine/gait.js';
import { sampleKeys, sampleXf, lerpArr, bakePoses } from '../../engine/choreo.js';

// ---------------------------------------------------------------- arms skeleton
const FINGERS = [
  { name: 'index', z: 0.026, length: 0.08, radius: 0.0095 },
  { name: 'middle', z: 0.009, length: 0.088, radius: 0.0099 },
  { name: 'ring', z: -0.008, length: 0.082, radius: 0.0095 },
  { name: 'pinky', z: -0.024, length: 0.066, radius: 0.0085 },
];
const SH = [0.16, -0.33, 0.02];
const EL = [SH[0] + 0.01, SH[1] - 0.36, SH[2]], WR = [EL[0] + 0.015, EL[1] - 0.36, EL[2] + 0.01];
const KNUCKLE_Y = WR[1] - 0.09, FINGER_X = WR[0] + 0.01, HAND_Z = WR[2] + 0.005;
const A = (dx, dy, dz) => [WR[0] + dx, WR[1] + dy, WR[2] + dz]; // wrist-relative
// The right shoulder is pulled back into the stock at pose time.
export const RIGHT_SHOULDER = [-0.07, 0.02, -0.24];

export const ARM_BONES = [
  { name: 'upperArm.L', parent: 'root', head: SH, tail: EL, mirror: true },
  { name: 'foreArm.L', parent: 'upperArm.L', head: EL, tail: WR, mirror: true },
  { name: 'hand.L', parent: 'foreArm.L', head: WR, tail: [FINGER_X, KNUCKLE_Y, HAND_Z], mirror: true },
  ...FINGERS.flatMap((f) => {
    const j = KNUCKLE_Y - f.length * 0.55, tip = KNUCKLE_Y - f.length;
    return [
      { name: f.name + '1.L', parent: 'hand.L', head: [FINGER_X, KNUCKLE_Y, HAND_Z + f.z], tail: [FINGER_X, j, HAND_Z + f.z], mirror: true },
      { name: f.name + '2.L', parent: f.name + '1.L', head: [FINGER_X, j, HAND_Z + f.z], tail: [FINGER_X, tip, HAND_Z + f.z], mirror: true },
    ];
  }),
  { name: 'thumb1.L', parent: 'hand.L', head: A(0.002, -0.025, 0.038), tail: A(-0.002, -0.065, 0.056), mirror: true },
  { name: 'thumb2.L', parent: 'thumb1.L', head: A(-0.002, -0.065, 0.056), tail: A(-0.006, -0.102, 0.07), mirror: true },
];

export const ARM_MATERIALS = {
  sleeve: { color: '#4d5238', roughness: 0.92, pattern: 'fabric', patternScale: 380, patternStrength: 0.45, sheen: 0.7 },
  sleeveDark: { color: '#3b3f2c', roughness: 0.9, pattern: 'fabric', patternScale: 280, sheen: 0.6 },
  velcro: { color: '#2e3124', roughness: 0.95, pattern: 'felt', patternScale: 90 },
  glove: { color: '#2b2622', roughness: 0.62, pattern: 'leather', patternScale: 340, patternColor: '#15110e', sheen: 0.35 },
  gloveKnit: { color: '#6b5d45', roughness: 0.9, pattern: 'fabric', patternScale: 420, patternStrength: 0.5 },
  knuckle: { color: '#1b1917', roughness: 0.5 },
  watchBody: { color: '#1a1b1c', roughness: 0.45 },
  watchFace: { color: '#9aa88e', roughness: 0.2, emissive: '#9fd9a0', emissiveStrength: 0.25 },
};

// ---------------------------------------------------------------- shape helpers
export const P = (name, shape, material, bind, o = {}) => ({ name, shape, material, bind, position: o.position || [0, 0, 0], rotation: o.rotation || [0, 0, 0], scale: o.scale || [1, 1, 1], modifiers: o.modifiers || [], ...(o.mirror ? { mirror: true } : {}), ...(o.castShadow === false ? { castShadow: false } : {}) });
export const rbox = (width, height, depth, bevel = 0, segments = 1) => ({ type: 'box', width, height, depth, bevel, bevelSegments: 2, segments });
export const cyl = (radiusTop, radiusBottom, height, radialSegments = 20, caps = true) => ({ type: 'cylinder', radiusTop, radiusBottom, height, radialSegments, heightSegments: 1, capTop: caps, capBottom: caps, arc: 360 });
export const sph = (radius, w = 14, h = 10) => ({ type: 'sphere', radius, widthSegments: w, heightSegments: h, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 });
export const sq = (rx, ry, rz, e1, e2, seg = 24) => ({ type: 'superquadric', rx, ry, rz, e1, e2, widthSegments: seg, heightSegments: Math.round(seg * 0.66), phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 });
export const tube = (path, radii, extra = {}) => ({ type: 'tube', path, radii, radialSegments: 16, samples: 8, caps: true, flatten: 1, arc: 360, arcOffset: 0, twist: 0, ...extra });
export const torus = (radius, tubeR, extra = {}) => ({ type: 'torus', radius, tube: tubeR, radialSegments: 8, tubularSegments: 24, arc: 360, tubeScaleY: 1, ...extra });
// A lathe profile [[radius, along]] revolved about the barrel axis (use with ALONG_Z).
export const lathe = (points, segments = 24, smooth = 0) => ({ type: 'lathe', points, segments, arc: 360, smooth });
// Extruded cross-section along Z (gear = ribbed or fluted tubes), depth = length.
export const gearTube = (radius, length, teeth, toothDepth = 0.1, bevel = 0) => ({ type: 'extrude', shape: 'gear', radius, teeth, toothDepth, depth: length, bevel, points: 5, inner: 0.45 });
export const ALONG_Z = [90, 0, 0]; // lathe / cylinder axis (+Y) turned to run along the barrel
export const SIDE = [0, -90, 0]; // side-profile extrusions: outline [z, y], thickness along X
// A side profile: outline points are [z, y] in weapon space, `width` is the thickness in X.
export function profile(outline, width, bevel = 0.002) {
  let area = 0;
  for (let i = 0; i < outline.length; i++) { const a = outline[i], b = outline[(i + 1) % outline.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const pts = area < 0 ? [...outline].reverse() : outline;
  return { type: 'extrude', outline: pts.map((p) => [p[0], p[1]]), depth: width, bevel, shape: 'polygon', points: 5, inner: 0.45, radius: 0.5, teeth: 12, toothDepth: 0.12 };
}
// Points along a circular arc (for curved magazines, trigger guards...)
export function arc(cz, cy, r, a0, a1, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; out.push([cz + Math.sin(a) * r, cy + Math.cos(a) * r]); }
  return out;
}

// ---------------------------------------------------------------- the arms
export function armParts() {
  return [
    P('Sleeve', tube([[SH[0], SH[1] + 0.04, SH[2]], [SH[0] + 0.005, SH[1] - 0.18, SH[2]], EL, [EL[0] + 0.008, EL[1] - 0.17, EL[2] + 0.005], A(0, 0.04, 0)], [0.056, 0.05, 0.044, 0.039, 0.036], { caps: false, samples: 8 }), 'sleeve', { bones: ['upperArm.L', 'foreArm.L'], falloff: 7 }, { mirror: true, modifiers: [{ type: 'displace', amount: 0.005, scale: 18, seed: 7, octaves: 2 }] }),
    P('Elbow Pad', sq(0.046, 0.055, 0.05, 0.6, 0.8, 16), 'sleeveDark', { bones: ['upperArm.L', 'foreArm.L'], falloff: 7 }, { position: [EL[0], EL[1], EL[2] - 0.012], mirror: true }),
    P('Cuff', cyl(0.039, 0.04, 0.04, 22, false), 'sleeveDark', { bone: 'foreArm.L' }, { position: A(0, 0.05, 0), mirror: true }),
    P('Cuff Strap', rbox(0.02, 0.022, 0.07, 0.004), 'velcro', { bone: 'foreArm.L' }, { position: A(-0.035, 0.05, 0.012), rotation: [0, 0, 0], mirror: true }),
    P('Glove Cuff', cyl(0.031, 0.034, 0.05, 18, false), 'gloveKnit', { bones: ['foreArm.L', 'hand.L'], falloff: 8 }, { position: A(0.002, 0.012, 0.001), mirror: true }),
    P('Wrist', cyl(0.025, 0.028, 0.05, 18, false), 'glove', { bones: ['foreArm.L', 'hand.L'], falloff: 8 }, { position: A(0.002, -0.012, 0.001), mirror: true }),
    P('Palm', rbox(0.03, 0.092, 0.082, 0.013), 'glove', { bone: 'hand.L' }, { position: A(0.007, -0.047, 0.003), mirror: true }),
    P('Knuckle Guard', rbox(0.012, 0.022, 0.07, 0.005), 'knuckle', { bone: 'hand.L' }, { position: A(0.024, -0.082, 0.002), mirror: true }),
    ...FINGERS.map((f) => P(f.name[0].toUpperCase() + f.name.slice(1) + ' Finger', { type: 'capsule', radius: f.radius, length: f.length - f.radius, radialSegments: 12, capSegments: 5 }, 'glove', { bones: ['hand.L', f.name + '1.L', f.name + '2.L'], falloff: 9 }, { position: [FINGER_X, KNUCKLE_Y + 0.004 - (f.length + f.radius) / 2, HAND_Z + f.z], mirror: true })),
    P('Thumb', { type: 'capsule', radius: 0.011, length: 0.058, radialSegments: 12, capSegments: 5 }, 'glove', { bones: ['hand.L', 'thumb1.L', 'thumb2.L'], falloff: 9 }, { position: A(-0.002, -0.065, 0.054), rotation: [-24, 0, -6], mirror: true }),
    // digital watch over the left glove cuff
    P('Watch Strap', torus(0.033, 0.004, { tubeScaleY: 2.4, tubularSegments: 28 }), 'watchBody', { bone: 'foreArm.L' }, { position: A(0.002, 0.022, 0.001) }),
    P('Watch Case', rbox(0.012, 0.036, 0.036, 0.006), 'watchBody', { bone: 'foreArm.L' }, { position: A(0.036, 0.022, 0.001) }),
    P('Watch Face', rbox(0.002, 0.024, 0.024, 0.001), 'watchFace', { bone: 'foreArm.L' }, { position: A(0.0425, 0.022, 0.001), castShadow: false }),
  ];
}

// ---------------------------------------------------------------- common hand poses
export const HANDS = {
  pistolGrip: { curl: [0.5, 0.15, 0.82, 0.88, 0.92], spread: 0 }, // index along the frame / on the trigger
  squeeze: { curl: [0.5, 0.42, 0.86, 0.9, 0.94], spread: 0 },
  wrap: { curl: [0.35, 0.58, 0.64, 0.68, 0.72], spread: 0.08 }, // around a handguard
  pistolWrap: { curl: [0.3, 0.78, 0.84, 0.88, 0.92], spread: 0 }, // support hand over the gun hand
  revolverGrip: { curl: [0.5, 0.18, 0.95, 1.0, 1.04], spread: 0 },
  cup: { curl: [0.3, 0.45, 0.5, 0.55, 0.6], spread: 0.1 },
  relaxed: { curl: [0.2, 0.3, 0.38, 0.45, 0.5], spread: 0.15 },
  grab: { curl: [0.45, 0.62, 0.7, 0.74, 0.78], spread: 0.02 }, // holding a magazine
  pinch: { curl: [0.15, 0.5, 0.6, 0.85, 0.9], spread: 0 }, // a shell between thumb and fingers
  push: { curl: [-0.1, 0.75, 0.85, 0.9, 0.95], spread: 0 }, // thumb straight
  flat: { curl: [0.05, 0.05, 0.06, 0.08, 0.1], spread: 0.1 },
  hook: { curl: [0.35, 0.6, 0.7, 0.75, 0.8], spread: 0 },
  point: { curl: [0.5, 0.05, 0.8, 0.85, 0.9], spread: 0 },
};

export const HIDDEN = { attach: 'world', p: [0, -5000, 0], r: [0, 0, 0] }; // past the far plane
// Express `xf` ({p, r} in some space) in the frame of `frame` ({p, r} in the same space):
// used to keep a held prop exactly where it will be when the hand reaches its next key.
export function inFrame(frame, xf) {
  const fq = quat.fromEuler(quat.create(), ...frame.r), iq = quat.invert(quat.create(), fq);
  const d = vec3.transformQuat([0, 0, 0], [xf.p[0] - frame.p[0], xf.p[1] - frame.p[1], xf.p[2] - frame.p[2]], iq);
  const q = quat.multiply(quat.create(), iq, quat.fromEuler(quat.create(), ...xf.r));
  return { p: d, r: Array.from(quat.toEuler([0, 0, 0], q)) };
}
export const k = (t, v, ease) => ({ t, ...v, ...(ease ? { ease } : {}) });
export const offset = (base, p) => base.map((v, i) => v + p[i]);

// ---------------------------------------------------------------- baking
const mixV = (a, b, s) => a.v + (b.v - a.v) * s;
const mixPose = (a, b, s) => blendHandPoses(a.pose, b.pose, s);
const HIDE_DROP = -5000; // beyond the far plane whichever way the parent bone is turned

// gun: { W0, props: { bone: restHead }, slides: { bone: axis }, spins: { bone: axis }, toggles: [bone] }
// A (an action): { duration, fps, loop, weapon: keys | fn(t), handR, handL, fingersR, fingersL,
//   props: { bone: xfKeys }, slides: { bone: vKeys }, spins: { bone: degKeys }, toggles: { bone: vKeys }, events }
export function performAction(sk, gun, name, A) {
  const idx = (n) => sk.boneIndex(n);
  const rest = (n) => sk.bones[idx(n)].head;
  const times = [], poses = [];
  const frames = Math.round(A.duration * A.fps);
  const n = A.loop ? frames : frames + 1;
  const W0 = gun.W0;
  const axisVec = (ax, v) => (ax === 'x' ? [v, 0, 0] : ax === 'y' ? [0, v, 0] : [0, 0, v]);
  for (let f = 0; f < n; f++) {
    const t = (f / frames) * A.duration;
    sk.resetPose();
    const wk = typeof A.weapon === 'function' ? A.weapon(t) : sampleKeys(A.weapon, t, (a, b, s) => ({ p: lerpArr(a.p, b.p, s), r: lerpArr(a.r, b.r, s) }));
    const wq = quat.fromEuler(quat.create(), ...wk.r);
    const wi = idx('weapon');
    sk.pos.set([wk.p[0] - W0[0], wk.p[1] - W0[1], wk.p[2] - W0[2]], wi * 3);
    sk.rot.set(wq, wi * 4);
    sk.pos.set(gun.rightShoulder || RIGHT_SHOULDER, idx('upperArm.R') * 3);
    for (const [bone, axis] of Object.entries(gun.slides || {})) {
      const keys = (A.slides || {})[bone] || [{ t: 0, v: 0 }];
      sk.pos.set(axisVec(axis, sampleKeys(keys, t, mixV)), idx(bone) * 3);
    }
    for (const [bone, axis] of Object.entries(gun.spins || {})) {
      const keys = (A.spins || {})[bone] || [{ t: 0, v: 0 }];
      const e = axisVec(axis, sampleKeys(keys, t, mixV));
      sk.rot.set(quat.fromEuler(quat.create(), e[0], e[1], e[2]), idx(bone) * 4);
    }
    for (const bone of gun.toggles || []) {
      const keys = (A.toggles || {})[bone] || [{ t: 0, v: gun.toggleDefault?.[bone] ?? 1 }];
      if (sampleKeys(keys, t, mixV) < 0.5) sk.pos.set([0, HIDE_DROP, 0], idx(bone) * 3);
    }
    sk.update();
    const weapon = { p: wk.p, q: wq };
    // moving parts of the gun can be attachment parents too (a hand riding the bolt knob or the pump)
    const parts = { weapon };
    for (const b of gun.bones || []) { const i = idx(b.name); parts[b.name] = { p: sk.worldHead(i), q: sk.worldRotation(i) }; }
    const hands = {};
    for (const [side, keys, fingerKeys, pole] of [['R', A.handR, A.fingersR, gun.poleR || [-1.8, -0.9, -0.1]], ['L', A.handL, A.fingersL, gun.poleL || [1.4, -1, -0.2]]]) {
      const x = sampleXf(keys, t, { ...parts, ...hands });
      twoBoneIK(sk, idx('upperArm.' + side), idx('foreArm.' + side), idx('hand.' + side), x.p, pole);
      setWorldRotation(sk, idx('hand.' + side), x.q);
      applyHandPose(sk, side, sampleKeys(fingerKeys, t, mixPose));
      sk.update();
      hands['hand.' + side] = { p: sk.worldHead(idx('hand.' + side)), q: sk.worldRotation(idx('hand.' + side)) };
    }
    // attachable props (magazines, shells): world transform from keys attached to the weapon or a hand
    for (const bone of Object.keys(gun.props || {})) {
      const keys = (A.props || {})[bone] || [{ t: 0, ...gun.propsDefault[bone] }];
      const c = sampleXf(keys, t, { ...parts, ...hands });
      const i = idx(bone), c0 = rest(bone);
      sk.pos.set([c.p[0] - c0[0], c.p[1] - c0[1], c.p[2] - c0[2]], i * 3);
      sk.rot.set(c.q, i * 4);
    }
    sk.update();
    times.push(t); poses.push(sk.snapshotPose());
  }
  const posBones = ['weapon', 'upperArm.R', ...Object.keys(gun.props || {}), ...Object.keys(gun.slides || {}), ...(gun.toggles || [])];
  const clip = bakePoses(sk, name, times, poses, { loop: !!A.loop, posBones: [...new Set(posBones)], stepBones: gun.toggles || [], events: A.events || [] });
  if (A.loop) clip.duration = A.duration;
  sk.resetPose(); sk.update();
  return clip;
}

// Builds a full character definition for a gun.
// gun: { name, W0, bones (weapon children, rest heads in weapon space), props, materials, parts, actions, firstPerson }
export function weaponDefinition(gun, { withClips = true } = {}) {
  const W = (p) => offset(gun.W0, p);
  const skeleton = [
    { name: 'root', parent: null, head: [0, 0, 0], tail: [0, 0.1, 0], deform: false },
    { name: 'weapon', parent: 'root', head: gun.W0, tail: W([0, 0, 0.15]) },
    ...gun.bones.map((b) => ({ name: b.name, parent: b.parent || 'weapon', head: W(b.head), tail: W(b.tail || [b.head[0], b.head[1], b.head[2] + 0.05]) })),
    ...Object.entries(gun.props || {}).map(([name, head]) => ({ name, parent: 'root', head: W(head), tail: W([head[0], head[1] + 0.05, head[2]]) })),
    ...ARM_BONES,
  ];
  const def = {
    name: gun.name, skeleton, materials: { ...gun.materials, ...ARM_MATERIALS }, parts: [...gun.parts, ...armParts()],
    clips: [], firstPerson: gun.firstPerson,
  };
  if (withClips) {
    const sk = new Skeleton(expandSkeleton(skeleton));
    def.clips = Object.entries(gun.actions).map(([n, a]) => performAction(sk, gun, n, a));
  }
  return JSON.parse(JSON.stringify(def));
}

// Where a weapon-space point is right now, in rig space (muzzle, ejection port, sights).
export function weaponPoint(character, p, gun) {
  const sk = character.skeleton, i = sk.boneIndex('weapon');
  const local = offset(gun.W0, p); // rest position in rig space
  const w = sk.joints.subarray(i * 16, i * 16 + 16);
  return vec3.transformMat4([0, 0, 0], local, w);
}
// Same, in world space (after the character's own transform).
export function weaponPointWorld(character, p, gun) {
  return vec3.transformMat4([0, 0, 0], weaponPoint(character, p, gun), character.world);
}
export const createWeapon = (gun) => new Character(weaponDefinition(gun));
export { mat4, quat, vec3 };
