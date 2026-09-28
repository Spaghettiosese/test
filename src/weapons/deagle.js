// Desert Eagle .50 AE, first person, two-handed: a massive slide with a ribbed top and rear
// serrations, a triangular barrel housing carrying the full-length rail and front sight,
// a chunky steel frame with a big trigger guard, a checkered rubber grip and a seven-round
// magazine that lives in the grip. Moving parts: the slide (it cycles on every shot and locks
// back on the last round), the trigger, the magazine and the muzzle flash.
// Actions: Idle, Idle Empty (slide locked back), Fire, Fire Last (the slide stays back),
// Reload (tactical: strip the magazine, fetch one, seat it, slap it home), Reload Empty (the
// same, then the slide is released), Inspect (right side, a press check, then the pistol is
// spun twice on the trigger finger and caught).
import { P, rbox, cyl, sph, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon, quat, vec3 } from './rig.js';
import { sampleKeys, lerpArr } from '../../engine/choreo.js';

const W0 = [-0.055, -0.086, 0.38];
const W = (p) => offset(W0, p);
const BORE = 0.05;
const SIGHT = 0.087;
const SLIDE_BACK = -0.038;
const MAG_SEAT = [0, -0.05, -0.075];
export const DEAGLE_POINTS = { muzzle: [0, BORE, 0.2], eject: [-0.02, 0.056, -0.005], sightRear: [0, SIGHT, -0.075], sightFront: [0, SIGHT, 0.178] };

const MATERIALS = {
  slide: { color: '#4b4e54', roughness: 0.3, metallic: 0.95, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  frame: { color: '#34363b', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 2 },
  steel: { color: '#8b8d91', roughness: 0.22, metallic: 1, pattern: 'metal', patternScale: 4 },
  rubber: { color: '#151515', roughness: 0.9, pattern: 'checker', patternScale: 230, patternColor: '#060606', patternStrength: 0.55 },
  groove: { color: '#070708', roughness: 0.85 },
  dark: { color: '#050505', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  white: { color: '#ece8dc', roughness: 0.5 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const SLD = { bone: 'slide' };
const MAG = { bone: 'mag' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];

const GUN = [
  // ---- slide: ribbed top, serrations, ejection port, sights
  P('Slide', profile([[-0.088, 0.03], [0.108, 0.03], [0.108, 0.07], [0.1, 0.076], [-0.07, 0.076], [-0.088, 0.062]], 0.03, 0.004), 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Slide Rib', rbox(0.013, 0.004, 0.19, 0.001), 'slide', SLD, { position: W([0, 0.078, 0.008]) }),
  P('Rib Slots', rbox(0.0145, 0.0014, 0.0032, 0), 'groove', SLD, { position: W([0, 0.0805, -0.08]), modifiers: array(16, 0.0115) }),
  P('Serrations', rbox(0.0312, 0.03, 0.0022, 0), 'groove', SLD, { position: W([0, 0.052, -0.078]), modifiers: array(7, 0.0055) }),
  P('Ejection Port', rbox(0.002, 0.022, 0.05, 0.001), 'dark', SLD, { position: W([-0.0157, 0.056, 0.005]) }),
  P('Rear Sight Base', rbox(0.02, 0.006, 0.014, 0.002), 'slide', SLD, { position: W([0, 0.079, -0.075]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Rear Blade L' : 'Rear Blade R', rbox(0.0065, 0.008, 0.012, 0.0015), 'slide', SLD, { position: W([s * 0.0068, 0.0835, -0.075]) })),
  P('Rear Dot L', rbox(0.0022, 0.0022, 0.0008, 0), 'white', SLD, { position: W([0.0068, 0.0835, -0.0812]), castShadow: false }),
  P('Rear Dot R', rbox(0.0022, 0.0022, 0.0008, 0), 'white', SLD, { position: W([-0.0068, 0.0835, -0.0812]), castShadow: false }),
  P('Slide Stamp', rbox(0.0004, 0.006, 0.07, 0), 'steel', SLD, { position: W([-0.0152, 0.038, 0.03]), castShadow: false }),
  // ---- barrel housing (fixed): triangular wedge with the rail on top, muzzle, front sight
  P('Barrel Housing', rbox(0.027, 0.046, 0.088, 0.008), 'slide', WPN, { position: W([0, 0.052, 0.152]) }),
  P('Housing Rail', rbox(0.013, 0.004, 0.088, 0.001), 'slide', WPN, { position: W([0, 0.077, 0.152]) }),
  P('Rail Notches', rbox(0.0145, 0.0014, 0.0032, 0), 'groove', WPN, { position: W([0, 0.0795, 0.116]), modifiers: array(7, 0.0115) }),
  P('Muzzle Ring', cyl(0.0125, 0.0125, 0.006, 22), 'frame', WPN, { position: W([0, BORE, 0.194]), rotation: ALONG_Z }),
  P('Muzzle Bore', cyl(0.0072, 0.0072, 0.003, 16), 'dark', WPN, { position: W([0, BORE, 0.1975]), rotation: ALONG_Z }),
  P('Front Sight Block', rbox(0.008, 0.012, 0.014, 0.002), 'slide', WPN, { position: W([0, 0.0825, 0.178]) }),
  P('Front Dot', sph(0.0018, 8, 6), 'white', WPN, { position: W([0, SIGHT + 0.0004, 0.1712]), castShadow: false }),
  // ---- frame: dust cover, trigger guard, slide stop, safety, mag release
  P('Frame', profile([[-0.09, 0.032], [-0.125, -0.115], [-0.055, -0.115], [-0.03, -0.012], [0.045, -0.012], [0.062, 0.004], [0.19, 0.004], [0.19, 0.032]], 0.028, 0.004), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Trigger Guard', torus(0.017, 0.0036, { tubularSegments: 24 }), 'frame', WPN, { position: W([0, -0.02, 0.006]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
  P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.02], [-0.006, -0.03], [-0.01, -0.027], [-0.005, -0.017]], 0.008, 0.0015), 'steel', { bone: 'trigger' }, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Slide Stop', rbox(0.006, 0.008, 0.024, 0.002), 'steel', WPN, { position: W([0.0165, 0.024, -0.018]) }),
  P('Safety', rbox(0.007, 0.008, 0.026, 0.002), 'steel', WPN, { position: W([0.0225, 0.017, -0.07]), rotation: [-15, 0, 0] }),
  P('Safety Dot', rbox(0.0008, 0.0035, 0.0035, 0), 'white', WPN, { position: W([0.0262, 0.0185, -0.076]), castShadow: false }),
  P('Mag Release', rbox(0.006, 0.01, 0.01, 0.002), 'steel', WPN, { position: W([0.0205, -0.026, -0.042]) }),
  // ---- checkered rubber grip
  P('Grip', profile([[-0.091, 0.028], [-0.031, 0.028], [-0.031, -0.01], [-0.055, -0.113], [-0.126, -0.113]], 0.036, 0.008), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip Screw L', cyl(0.0032, 0.0032, 0.0392, 10), 'steel', WPN, { position: W([0, -0.03, -0.083]), rotation: [0, 0, 90] }),
  // ---- magazine, its base plate sticking out under the grip
  P('Magazine', profile([[-0.086, 0.025], [-0.038, 0.025], [-0.058, -0.112], [-0.117, -0.112]], 0.022, 0.003), 'frame', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Base', rbox(0.031, 0.012, 0.078, 0.003), 'steel', MAG, { position: W([0, -0.118, -0.089]) }),
  P('Top Round', { type: 'capsule', radius: 0.0064, length: 0.02, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.026, -0.062]), rotation: ALONG_Z }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 7, inner: 0.35, radius: 0.075, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.205]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.032, height: 0.14, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.27]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.03, -0.055, -0.13], r: [-66, 0, 0] };
const SUPPORT_L = { attach: 'weapon', p: [0.03, -0.066, -0.118], r: [-62, 0, 0] };
const READY = { p: [...W0], r: [0, 4, -3] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
const MAG_BELOW = { p: offset(MAG_SEAT, [0, -0.09, 0]), r: [0, 0, 0] };
const LH_MAG = { p: [0.03, -0.2, -0.085], r: [-92, 0, 0] }; // left hand round the pulled magazine
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };
const LH_SLAP = { attach: 'weapon', p: [0.05, -0.17, -0.085], r: [0, 0, -90] };
const POUCH = { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] };
const MAG_POSE = { p: [-0.02, 0.0, 0.36], r: [-58, -12, 50] }; // canted so the grip base faces the eye
const RACK = { attach: 'slide', p: [0.03, 0.006, -0.07], r: [-30, 0, -90] }; // fingers over the rear serrations (slide frame)
const RELAXED_L = { attach: 'world', p: [0.24, -0.42, 0.3], r: [-40, 0, -20] };
const sway = (dy = 0) => (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a) + dy, W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; };
const KICK = { p: offset(W0, [0.002, 0.04, -0.07]), r: [-17, 4.5, -4] };

// ---- the spin: the pistol turns about the trigger finger, which stays where it is in the world
const RIGHT_SIDE = { p: [0.0, -0.115, 0.4], r: [-6, -52, 8] };
const PRESS = { p: [-0.03, -0.13, 0.4], r: [-12, -22, 24] };
const SPIN_POSE = { p: offset(W0, [0.01, 0.045, 0.02]), r: [0, 3, -2] };
const SPIN_T0 = 2.75, SPIN_T1 = 4.0, TURNS = 2;
const FINGER = [0, -0.012, 0.006]; // the trigger guard's inside, in weapon space
const qBase = quat.fromEuler(quat.create(), ...SPIN_POSE.r);
const pivotWorld = vec3.add([0, 0, 0], SPIN_POSE.p, vec3.transformQuat([0, 0, 0], FINGER, qBase));
const spinPose = (t) => {
  const u = (t - SPIN_T0) / (SPIN_T1 - SPIN_T0), e = 1 - Math.pow(1 - u, 1.8);
  const q = quat.multiply(quat.create(), qBase, quat.fromEuler(quat.create(), 360 * TURNS * e, 0, 0));
  const off = vec3.transformQuat([0, 0, 0], FINGER, q);
  return { p: [pivotWorld[0] - off[0], pivotWorld[1] - off[1], pivotWorld[2] - off[2]], r: Array.from(quat.toEuler([0, 0, 0], q)) };
};
// the hand hangs beside the finger's plane of travel with the index hooked through the guard
const SPIN_HAND = { attach: 'world', p: [pivotWorld[0] - 0.102, pivotWorld[1] + 0.06, pivotWorld[2] - 0.127], r: [-60, 40, 0] };
const mixPose = (a, b, s) => ({ p: lerpArr(a.p, b.p, s), r: lerpArr(a.r, b.r, s) });
const INSPECT_BASE = [
  k(0, READY), k(0.5, RIGHT_SIDE), k(1.35, { ...RIGHT_SIDE, p: offset(RIGHT_SIDE.p, [0.004, 0.002, 0]) }),
  k(1.75, PRESS), k(2.45, PRESS), k(2.7, SPIN_POSE), k(4.0, SPIN_POSE),
  k(4.25, { p: offset(SPIN_POSE.p, [0, -0.02, -0.01]), r: [4, 3, -2] }, 'snap'), // caught
  k(4.9, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }), k(5.4, READY),
];

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: sway(),
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(1.5, { pose: { curl: [0.4, 0.64, 0.7, 0.74, 0.78], spread: 0.05 } }), k(3, { pose: HANDS.pistolWrap })],
  },
  'Idle Empty': {
    duration: 3, loop: true, fps: 20,
    weapon: sway(),
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(1.5, { pose: { curl: [0.4, 0.64, 0.7, 0.74, 0.78], spread: 0.05 } }), k(3, { pose: HANDS.pistolWrap })],
    slides: { slide: [k(0, { v: SLIDE_BACK })] },
  },
  Fire: {
    // a heavy kick: the slide cycles, the muzzle climbs and the arms take it before it settles
    duration: 0.55, fps: 60,
    weapon: [k(0, READY), k(0.03, KICK, 'snap'), k(0.14, { p: offset(W0, [0.001, 0.015, -0.02]), r: [-8, 4.2, -3.4] }), k(0.34, { p: offset(W0, [0, 0.002, 0.002]), r: [-1.5, 4, -3] }), k(0.55, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.12, { pose: HANDS.squeeze }), k(0.3, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(0.04, { pose: { curl: [0.45, 0.74, 0.78, 0.82, 0.84], spread: 0.03 } }, 'snap'), k(0.4, { pose: HANDS.pistolWrap })],
    slides: { slide: [k(0, { v: 0 }), k(0.03, { v: SLIDE_BACK }, 'snap'), k(0.075, { v: 0 }, 'snap')] },
    spins: { trigger: [k(0, { v: 16 }), k(0.03, { v: 16 }), k(0.3, { v: 0 })] },
    toggles: { flash: [k(0, { v: 1 }), k(0.04, { v: 1 }, 'hold'), k(0.041, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, { t: 0.03, name: 'eject' }],
  },
  'Fire Last': {
    duration: 0.55, fps: 60,
    weapon: [k(0, READY), k(0.03, KICK, 'snap'), k(0.14, { p: offset(W0, [0.001, 0.015, -0.02]), r: [-8, 4.2, -3.4] }), k(0.34, { p: offset(W0, [0, 0.002, 0.002]), r: [-1.5, 4, -3] }), k(0.55, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.12, { pose: HANDS.squeeze }), k(0.3, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(0.04, { pose: { curl: [0.45, 0.74, 0.78, 0.82, 0.84], spread: 0.03 } }, 'snap'), k(0.4, { pose: HANDS.pistolWrap })],
    slides: { slide: [k(0, { v: 0 }), k(0.03, { v: SLIDE_BACK }, 'snap')] }, // the slide stays locked open
    spins: { trigger: [k(0, { v: 16 }), k(0.03, { v: 16 }), k(0.3, { v: 0 })] },
    toggles: { flash: [k(0, { v: 1 }), k(0.04, { v: 1 }, 'hold'), k(0.041, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, { t: 0.03, name: 'eject' }, { t: 0.06, name: 'slideLock' }],
  },
};

// The two reloads share one magazine change; the empty one starts with the slide locked open and
// ends by dropping it. `slideOpen` picks which.
function reload(empty) {
  const d = empty ? 2.7 : 2.2, t1 = 1.32; // t1: the magazine is seated
  const slap = 1.36;
  const hold = empty ? SLIDE_BACK : 0;
  return {
    duration: d, fps: 30,
    weapon: [
      k(0, READY), k(0.24, MAG_POSE), k(t1 - 0.02, MAG_POSE),
      k(slap, { p: offset(MAG_POSE.p, [0, 0.012, 0.004]), r: [-61, -12, 51] }, 'snap'), // the slap seats it
      k(1.7, MAG_POSE),
      ...(empty ? [k(1.86, { p: offset(MAG_POSE.p, [0.003, 0.004, -0.008]), r: [-54, -12, 52] }, 'snap')] : []),
      k(empty ? 2.35 : 1.95, READY), k(d, READY),
    ],
    handR: [
      k(0, GRIP_R), k(0.2, GRIP_R), k(0.26, { attach: 'weapon', p: offset(GRIP_R.p, [0.002, 0.012, 0.006]), r: GRIP_R.r }), k(0.36, GRIP_R), // thumb on the release
      k(d, GRIP_R),
    ],
    handL: [
      k(0, SUPPORT_L),
      k(0.22, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.02, -0.03, 0]) }),
      k(0.32, { attach: 'weapon', ...LH_MAG }),
      k(0.44, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, -0.09, 0]) }, 'out'), // pull it out
      k(0.6, POUCH), k(0.76, { ...POUCH, p: offset(POUCH.p, [0, -0.01, 0.01]) }),
      k(0.98, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, -0.1, 0]) }),
      k(1.1, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, -0.09, 0]) }),
      k(t1, { attach: 'weapon', ...LH_MAG }, 'in'), // and up into the grip
      k(t1 + 0.02, { ...LH_SLAP, p: offset(LH_SLAP.p, [0, -0.04, 0]) }), k(slap, LH_SLAP, 'snap'),
      k(1.62, { ...LH_SLAP, p: offset(LH_SLAP.p, [0.02, -0.04, 0]) }),
      k(empty ? 2.3 : 1.95, SUPPORT_L), k(d, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.22, { pose: HANDS.pistolGrip }), k(0.28, { pose: HANDS.push }), k(0.38, { pose: HANDS.pistolGrip }),
      ...(empty ? [k(1.7, { pose: HANDS.pistolGrip }), k(1.78, { pose: HANDS.push }), k(1.95, { pose: HANDS.pistolGrip })] : []), k(d, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(0.22, { pose: HANDS.relaxed }), k(0.32, { pose: HANDS.grab }), k(0.5, { pose: HANDS.grab }), k(0.62, { pose: HANDS.relaxed }), k(0.78, { pose: HANDS.grab }), k(t1, { pose: HANDS.grab }), k(slap, { pose: HANDS.flat }), k(1.7, { pose: HANDS.relaxed }), k(empty ? 2.3 : 1.95, { pose: HANDS.pistolWrap }), k(d, { pose: HANDS.pistolWrap })],
    props: {
      mag: [
        k(0, SEATED), k(0.32, SEATED),
        k(0.44, { attach: 'weapon', ...MAG_BELOW }, 'out'),
        k(0.48, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.05, 0]), r: [10, 0, 20] }),
        k(0.74, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
        k(0.75, HIDDEN, 'hold'), k(0.76, { ...IN_HAND }, 'hold'),
        k(1.1, IN_HAND), k(t1, SEATED, 'in'), k(d, SEATED),
      ],
    },
    slides: { slide: empty ? [k(0, { v: hold }), k(1.74, { v: hold }), k(1.8, { v: 0 }, 'snap')] : [k(0, { v: 0 })] },
    events: [{ t: 0.44, name: 'magOut' }, { t: t1, name: 'magIn' }, ...(empty ? [{ t: 1.8, name: 'boltHome' }] : [])],
  };
}
ACTIONS.Reload = reload(false);
ACTIONS['Reload Empty'] = reload(true);

ACTIONS.Inspect = {
  // right side, a press check, then the pistol is spun twice about the trigger finger and caught
  duration: 5.4, fps: 60,
  weapon: (t) => (t >= SPIN_T0 && t <= SPIN_T1 ? spinPose(t) : sampleKeys(INSPECT_BASE, t, mixPose)),
  handR: [k(0, GRIP_R), k(2.4, GRIP_R), k(2.68, SPIN_HAND), k(SPIN_T1 + 0.1, SPIN_HAND), k(4.4, GRIP_R), k(5.4, GRIP_R)],
  handL: [
    k(0, SUPPORT_L), k(1.4, SUPPORT_L),
    k(1.62, { ...RACK, p: offset(RACK.p, [0.02, 0.03, 0.01]) }), k(1.78, RACK), // take hold of the slide
    k(2.2, RACK), // drawn back and let go
    k(2.4, { ...RACK, p: offset(RACK.p, [0.03, 0.04, 0.02]) }),
    k(2.68, RELAXED_L), k(SPIN_T1 + 0.1, RELAXED_L), k(4.5, SUPPORT_L), k(5.4, SUPPORT_L),
  ],
  fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.4, { pose: HANDS.pistolGrip }), k(2.68, { pose: HANDS.point }), k(SPIN_T1 + 0.1, { pose: HANDS.point }), k(4.4, { pose: HANDS.pistolGrip }), k(5.4, { pose: HANDS.pistolGrip })],
  fingersL: [k(0, { pose: HANDS.pistolWrap }), k(1.4, { pose: HANDS.pistolWrap }), k(1.62, { pose: HANDS.relaxed }), k(1.78, { pose: HANDS.grab }), k(2.2, { pose: HANDS.grab }), k(2.4, { pose: HANDS.relaxed }), k(2.68, { pose: HANDS.relaxed }), k(4.4, { pose: HANDS.relaxed }), k(4.6, { pose: HANDS.pistolWrap }), k(5.4, { pose: HANDS.pistolWrap })],
  // press check: the slide comes back far enough to show brass, and snaps home
  slides: { slide: [k(0, { v: 0 }), k(1.8, { v: 0 }), k(2.0, { v: -0.026 }), k(2.2, { v: -0.026 }), k(2.3, { v: 0 }, 'snap')] },
  events: [{ t: 1.9, name: 'charge' }, { t: 2.3, name: 'boltHome' }, { t: 2.75, name: 'click' }, { t: SPIN_T1 + 0.2, name: 'click' }],
};

export const DEAGLE = {
  id: 'deagle', name: 'Desert Eagle .50 AE', W0, BORE,
  rightShoulder: [0, 0, 0.02], // arms out in front: no rifle stock pulling the shoulder back
  poleR: [-1.4, -1.2, -0.1], poleL: [1.2, -1.2, -0.1],
  bones: [
    { name: 'slide', head: [0, 0.052, 0] },
    { name: 'trigger', head: [0, -0.004, -0.005] },
    { name: 'flash', head: [0, BORE, 0.205], tail: [0, BORE, 0.26] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { slide: 'z' },
  spins: { trigger: 'x' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: DEAGLE_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const deagleDefinition = (o) => weaponDefinition(DEAGLE, o);
export const createDeagle = () => createWeapon(DEAGLE);
