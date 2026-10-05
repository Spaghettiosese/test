// M94 lever-action carbine, first person: a blued receiver with a swinging lever loop and a
// loading gate, an octagonal barrel over a tube magazine, a wooden forearm with a barrel band,
// a buckhorn rear sight, a straight-grip walnut stock and a crescent butt plate.
// Moving parts: the lever, the hammer, a loose cartridge for the loading gate, the flash.
// Actions: Idle, Fire (the lever is worked after every shot), Reload (cartridges thumbed into the
// loading gate, then a cycle to chamber one), Inspect (the carbine is spun about its lever loop
// and caught, then cocked).
import { P, rbox, cyl, sph, sq, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, weaponDefinition, createWeapon, quat, vec3 } from './rig.js';
import { sampleKeys, lerpArr } from '../../engine/choreo.js';

const W0 = [-0.07, -0.15, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.04;
const PIVOT = [0, 0.0, -0.045]; // the lever's hinge under the receiver
const HAMMER = [0, 0.05, -0.098];
const ROUND_REST = [0, 0.04, 0.1];
const WPN = { bone: 'weapon' };
const LEV = { bone: 'lever' };
const HAM = { bone: 'hammer' };
const RND = { bone: 'round' };
export const LEVER_POINTS = { muzzle: [0, BORE, 0.55], eject: [0, 0.052, 0.0], sightRear: [0, 0.07, 0.14], sightFront: [0, 0.062, 0.53] };

const MATERIALS = {
  blued: { color: '#252a30', roughness: 0.34, metallic: 0.95, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  case: { color: '#6d5a40', roughness: 0.4, metallic: 0.6, pattern: 'metal', patternScale: 6, patternStrength: 0.7 },
  steel: { color: '#8b8d91', roughness: 0.22, metallic: 1, pattern: 'metal', patternScale: 4 },
  wood: { color: '#7d4a24', roughness: 0.38, pattern: 'walnut', patternScale: 20, patternColor: '#3d1f0c', sheen: 0.3 },
  woodDark: { color: '#5d3418', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#2c1508' },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  dark: { color: '#050505', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};
const oct = (r, len) => ({ type: 'cylinder', radiusTop: r, radiusBottom: r, height: len, radialSegments: 8, heightSegments: 1, capTop: true, capBottom: true, arc: 360 });

const GUN = [
  // ---- receiver
  P('Receiver', profile([[-0.105, 0.052], [-0.105, -0.004], [-0.04, -0.02], [0.07, -0.02], [0.105, 0.0], [0.105, 0.052]], 0.032, 0.006), 'case', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Top', rbox(0.03, 0.006, 0.2, 0.002), 'blued', WPN, { position: W([0, 0.055, 0.0]) }),
  P('Tang', profile([[-0.105, 0.05], [-0.16, 0.044], [-0.165, 0.036], [-0.105, 0.036]], 0.016, 0.003), 'case', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.016, 0.002, 0.07, 0.0005), 'dark', WPN, { position: W([0, 0.0586, 0.0]), castShadow: false }),
  P('Loading Gate', profile([[0.0, 0.01], [0.07, 0.01], [0.07, 0.034], [0.0, 0.034]], 0.004, 0.0015), 'brass', WPN, { position: W([-0.0165, 0, 0.03]), rotation: SIDE }),
  P('Gate Screw', cyl(0.003, 0.003, 0.004, 8), 'steel', WPN, { position: W([-0.0175, 0.022, 0.0]), rotation: [0, 0, 90] }),
  P('Receiver Pin', cyl(0.0035, 0.0035, 0.034, 8), 'steel', WPN, { position: W([0, 0.02, 0.07]), rotation: [0, 0, 90] }),
  // ---- barrel, magazine tube, forearm, band
  P('Barrel', oct(0.0112, 0.46), 'blued', WPN, { position: W([0, BORE, 0.34]), rotation: ALONG_Z }),
  P('Magazine Tube', cyl(0.0085, 0.0085, 0.34, 14), 'blued', WPN, { position: W([0, 0.016, 0.28]), rotation: ALONG_Z }),
  P('Tube Cap', cyl(0.0105, 0.0105, 0.012, 14), 'steel', WPN, { position: W([0, 0.016, 0.455]), rotation: ALONG_Z }),
  P('Forearm', profile([[0.1, 0.034], [0.34, 0.034], [0.34, 0.01], [0.3, -0.012], [0.1, -0.012]], 0.04, 0.012), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Forearm Cap', rbox(0.042, 0.04, 0.012, 0.005), 'blued', WPN, { position: W([0, 0.012, 0.342]) }),
  P('Barrel Band', torus(0.0165, 0.0036, { tubularSegments: 20 }), 'blued', WPN, { position: W([0, 0.026, 0.4]), rotation: [90, 0, 0] }),
  P('Muzzle Crown', cyl(0.0095, 0.0095, 0.008, 14), 'steel', WPN, { position: W([0, BORE, 0.568]), rotation: ALONG_Z }),
  P('Muzzle Bore', cyl(0.0052, 0.0052, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.5722]), rotation: ALONG_Z }),
  // ---- sights
  P('Front Ramp', rbox(0.01, 0.01, 0.02, 0.003), 'blued', WPN, { position: W([0, 0.056, 0.53]) }),
  P('Front Blade', rbox(0.003, 0.014, 0.004, 0.0006), 'blued', WPN, { position: W([0, 0.067, 0.535]) }),
  P('Rear Base', rbox(0.016, 0.01, 0.03, 0.003), 'blued', WPN, { position: W([0, 0.058, 0.15]) }),
  ...[1, -1].map((sd) => P('Buckhorn Arm', rbox(0.005, 0.016, 0.01, 0.002), 'blued', WPN, { position: W([sd * 0.0075, 0.07, 0.14]) })),
  // ---- stock
  P('Stock', profile([[-0.105, 0.052], [-0.2, 0.05], [-0.34, 0.044], [-0.41, 0.034], [-0.415, -0.07], [-0.4, -0.08], [-0.3, -0.056], [-0.2, -0.04], [-0.13, -0.036], [-0.105, -0.014]], 0.034, 0.009), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Wrist Checkering', rbox(0.0345, 0.02, 0.02, 0.003), 'woodDark', WPN, { position: W([0, 0.0, -0.13]) }),
  P('Butt Plate', profile([[-0.415, 0.036], [-0.424, 0.032], [-0.428, -0.07], [-0.42, -0.08], [-0.414, -0.07]], 0.036, 0.004), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- hammer
  P('Hammer', rbox(0.007, 0.034, 0.016, 0.003), 'blued', HAM, { position: W([0, HAMMER[1] + 0.0155, HAMMER[2] - 0.0098]), rotation: [-38, 0, 0] }),
  P('Hammer Spur', rbox(0.01, 0.005, 0.012, 0.0015), 'blued', HAM, { position: W([0, HAMMER[1] + 0.0345, HAMMER[2] - 0.0205]), rotation: [-38, 0, 0] }),
  // ---- lever loop
  P('Lever Loop', torus(0.036, 0.0045, { tubularSegments: 28 }), 'case', LEV, { position: W([0, -0.05, 0.0]), rotation: [0, 0, 90], scale: [1, 1, 1.75] }),
  P('Lever Link', rbox(0.006, 0.05, 0.012, 0.003), 'case', LEV, { position: W([0, -0.02, -0.04]) }),
  P('Lever Latch', rbox(0.008, 0.01, 0.02, 0.003), 'steel', LEV, { position: W([0, -0.015, 0.03]) }),
  P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.034], [-0.004, -0.044], [-0.008, -0.041], [-0.003, -0.03]], 0.006, 0.0012), 'steel', LEV, { position: W([0, 0, 0.0]), rotation: SIDE }),
  // ---- loose cartridge (for the loading gate)
  P('Cartridge Case', { type: 'capsule', radius: 0.0052, length: 0.026, radialSegments: 10, capSegments: 3 }, 'brass', RND, { position: W(ROUND_REST), rotation: ALONG_Z }),
  P('Cartridge Bullet', sq(0.0048, 0.0048, 0.01, 1, 1, 10), 'copper', RND, { position: W([ROUND_REST[0], ROUND_REST[1], ROUND_REST[2] + 0.02]) }),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.08, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.585]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.03, height: 0.13, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.65]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const READY = { p: [...W0], r: [0, 5, -3] };
const GRIP_R = { attach: 'weapon', p: [-0.034, -0.052, -0.135], r: [-66, 0, 2] };
const LEVER_R = { attach: 'lever', p: [-0.01, -0.095, -0.03], r: [-72, 0, 2] }; // fingers through the loop
const SUPPORT_L = { attach: 'weapon', p: [0.05, -0.03, 0.2], r: [-12, -4, -76] };
const POUCH = { attach: 'world', p: [0.22, -0.62, 0.22], r: [-60, 30, -30] };
const GATE_L = { attach: 'weapon', p: [-0.036, -0.012, 0.06], r: [-20, 20, 70] }; // thumb at the loading gate
const GATE_POSE = { p: [-0.0, -0.13, 0.38], r: [-8, -48, 14] };
const sway = (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 5 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; };
const LEVER_OPEN = 56, HAMMER_FALL = 38; // degrees: the hammer is modelled cocked, so 0 is its rest and a positive turn drops it
const cycle = (t0) => [k(t0, { v: 0 }), k(t0 + 0.2, { v: LEVER_OPEN }, 'out'), k(t0 + 0.34, { v: LEVER_OPEN }), k(t0 + 0.52, { v: 0 }, 'in')];
// the spin: the carbine turns about the lever loop, which the right hand holds in place
const SPIN_POSE = { p: offset(W0, [0.03, 0.06, 0.0]), r: [0, 3, -2] };
const SPIN_T0 = 1.5, SPIN_T1 = 2.5, TURNS = 1;
const FINGER = [0, -0.05, 0.0];
const qBase = quat.fromEuler(quat.create(), ...SPIN_POSE.r);
const pivotWorld = vec3.add([0, 0, 0], SPIN_POSE.p, vec3.transformQuat([0, 0, 0], FINGER, qBase));
const spinPose = (t) => {
  const u = (t - SPIN_T0) / (SPIN_T1 - SPIN_T0), e = u * u * (3 - 2 * u);
  const q = quat.multiply(quat.create(), qBase, quat.fromEuler(quat.create(), -360 * TURNS * e, 0, 0));
  const off = vec3.transformQuat([0, 0, 0], FINGER, q);
  return { p: [pivotWorld[0] - off[0], pivotWorld[1] - off[1], pivotWorld[2] - off[2]], r: Array.from(quat.toEuler([0, 0, 0], q)) };
};
const SPIN_HAND = { attach: 'world', p: [pivotWorld[0] - 0.03, pivotWorld[1] - 0.075, pivotWorld[2] - 0.05], r: [-70, 0, 0] };
const mixPose = (a, b, s) => ({ p: lerpArr(a.p, b.p, s), r: lerpArr(a.r, b.r, s) });
const INSPECT_BASE = [
  k(0, READY), k(0.5, { p: [-0.0, -0.12, 0.36], r: [-8, -56, 12] }), k(1.1, { p: [0.0, -0.12, 0.36], r: [-8, -58, 12] }), k(1.35, SPIN_POSE), k(SPIN_T1, SPIN_POSE),
  k(SPIN_T1 + 0.2, { p: offset(SPIN_POSE.p, [0, -0.02, -0.01]), r: [3, 3, -2] }, 'snap'), k(3.4, { p: offset(W0, [0, -0.01, 0.0]), r: [-3, 5, -3] }), k(3.8, READY),
];

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20, weapon: sway,
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })], fingersL: [k(0, { pose: HANDS.cup }), k(1.5, { pose: { curl: [0.35, 0.5, 0.55, 0.6, 0.65], spread: 0.1 } }), k(3, { pose: HANDS.cup })],
  },
  Fire: {
    duration: 0.62, fps: 60,
    weapon: [k(0, READY), k(0.03, { p: offset(W0, [0.003, 0.016, -0.05]), r: [-8.5, 5.5, -3.8] }, 'snap'), k(0.16, { p: offset(W0, [0.001, 0.006, -0.012]), r: [-3, 5, -3] }), k(0.4, { p: offset(W0, [0, -0.004, 0.004]), r: [1.5, 5, -3] }), k(0.62, READY)],
    handR: [k(0, GRIP_R), k(0.14, GRIP_R), k(0.2, LEVER_R, 'out'), k(0.5, LEVER_R), k(0.58, GRIP_R, 'in'), k(0.62, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(0.03, { ...SUPPORT_L, p: offset(SUPPORT_L.p, [0, 0.006, -0.01]) }, 'snap'), k(0.62, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.14, { pose: HANDS.squeeze }), k(0.2, { pose: HANDS.hook }), k(0.5, { pose: HANDS.hook }), k(0.58, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.cup }), k(0.62, { pose: HANDS.cup })],
    spins: { lever: cycle(0.2), hammer: [k(0, { v: 0 }), k(0.012, { v: HAMMER_FALL }, 'snap'), k(0.3, { v: HAMMER_FALL }), k(0.4, { v: 0 }, 'out')] },
    toggles: { flash: [k(0, { v: 1 }), k(0.04, { v: 1 }, 'hold'), k(0.041, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, { t: 0.28, name: 'eject' }, { t: 0.5, name: 'boltHome' }],
  },
  Reload: (() => {
    // three cartridges thumbed into the gate, then a cycle to chamber one
    const LOAD = [0.55, 1.2, 1.85], d = 3.4;
    const left = [k(0, SUPPORT_L)], fing = [k(0, { pose: HANDS.cup })], round = [k(0, { attach: 'weapon', p: ROUND_REST, r: [0, 0, 0] }), k(0.1, { ...HIDDEN }, 'hold')];
    const IN_HAND = { attach: 'hand.L', p: [0.0, -0.045, 0.0], r: [0, 0, 0] };
    LOAD.forEach((t, i) => {
      left.push(k(t - 0.45, { ...POUCH }), k(t - 0.33, { ...POUCH, p: offset(POUCH.p, [0, 0.01, 0.01]) }), k(t - 0.12, { ...GATE_L, p: offset(GATE_L.p, [-0.05, -0.05, -0.02]) }), k(t, GATE_L, 'snap'), k(t + 0.1, { ...GATE_L, p: offset(GATE_L.p, [-0.03, -0.03, 0]) }));
      fing.push(k(t - 0.45, { pose: HANDS.relaxed }), k(t - 0.33, { pose: HANDS.pinch }), k(t - 0.01, { pose: HANDS.pinch }), k(t + 0.05, { pose: HANDS.push }), k(t + 0.1, { pose: HANDS.relaxed }));
      round.push(k(t - 0.34, HIDDEN, 'hold'), k(t - 0.33, IN_HAND, 'hold'), k(t - 0.01, IN_HAND), k(t, { attach: 'weapon', p: offset(ROUND_REST, [-0.02, -0.04, 0]), r: [0, 0, 0] }, 'hold'), k(t + 0.05, HIDDEN, 'hold'));
    });
    left.push(k(2.6, SUPPORT_L), k(d, SUPPORT_L)); fing.push(k(2.6, { pose: HANDS.cup }), k(d, { pose: HANDS.cup }));
    return {
      duration: d, fps: 30,
      weapon: [k(0, READY), k(0.3, GATE_POSE), k(2.0, GATE_POSE), k(2.5, READY), k(d, READY)],
      handR: [k(0, GRIP_R), k(2.6, GRIP_R), k(2.7, LEVER_R, 'out'), k(3.1, LEVER_R), k(3.25, GRIP_R, 'in'), k(d, GRIP_R)],
      handL: left, fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.6, { pose: HANDS.pistolGrip }), k(2.7, { pose: HANDS.hook }), k(3.1, { pose: HANDS.hook }), k(3.25, { pose: HANDS.pistolGrip })], fingersL: fing,
      props: { round },
      spins: { lever: [k(0, { v: 0 }), k(2.7, { v: 0 }), k(2.9, { v: LEVER_OPEN }, 'out'), k(3.05, { v: LEVER_OPEN }), k(3.22, { v: 0 }, 'in')] },
      events: [...LOAD.map((t) => ({ t, name: 'shellIn' })), { t: 2.9, name: 'charge' }, { t: 3.22, name: 'boltHome' }],
    };
  })(),
  Inspect: {
    duration: 4.2, fps: 60,
    weapon: (t) => (t >= SPIN_T0 && t <= SPIN_T1 ? spinPose(t) : sampleKeys(INSPECT_BASE, t, mixPose)),
    handR: [k(0, GRIP_R), k(1.15, GRIP_R), k(1.32, { ...LEVER_R }), k(1.38, SPIN_HAND), k(SPIN_T1 + 0.05, SPIN_HAND), k(SPIN_T1 + 0.3, LEVER_R), k(3.1, LEVER_R), k(3.4, GRIP_R), k(4.2, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(1.2, SUPPORT_L), k(1.38, { attach: 'world', p: [pivotWorld[0] + 0.22, pivotWorld[1] - 0.2, pivotWorld[2] + 0.05], r: [-50, 20, -20] }), k(SPIN_T1, { attach: 'world', p: [pivotWorld[0] + 0.22, pivotWorld[1] - 0.2, pivotWorld[2] + 0.05], r: [-50, 20, -20] }), k(3.2, SUPPORT_L), k(4.2, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(1.3, { pose: HANDS.pistolGrip }), k(1.38, { pose: HANDS.point }), k(SPIN_T1 + 0.05, { pose: HANDS.point }), k(SPIN_T1 + 0.3, { pose: HANDS.hook }), k(3.1, { pose: HANDS.hook }), k(3.4, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.cup }), k(1.2, { pose: HANDS.cup }), k(1.38, { pose: HANDS.relaxed }), k(SPIN_T1, { pose: HANDS.relaxed }), k(3.2, { pose: HANDS.cup }), k(4.2, { pose: HANDS.cup })],
    spins: { lever: [k(0, { v: 0 }), k(2.85, { v: 0 }), k(3.0, { v: LEVER_OPEN }, 'out'), k(3.15, { v: LEVER_OPEN }), k(3.3, { v: 0 }, 'in')] },
    events: [{ t: 3.0, name: 'charge' }, { t: 3.3, name: 'boltHome' }],
  },
};

export const LEVER = {
  id: 'lever', name: 'M94 Lever-Action', W0, BORE,
  bones: [
    { name: 'lever', head: PIVOT },
    { name: 'hammer', head: HAMMER },
    { name: 'flash', head: [0, BORE, 0.585], tail: [0, BORE, 0.65] },
  ],
  props: { round: ROUND_REST }, propsDefault: { round: { attach: 'weapon', p: ROUND_REST, r: [0, 0, 0] } },
  slides: {}, spins: { lever: 'x', hammer: 'x' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS, points: LEVER_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const leverDefinition = (o) => weaponDefinition(LEVER, o);
export const createLever = () => createWeapon(LEVER);
