// Winchester Model 1894-style lever-action rifle, first person: a blued receiver with a top
// ejection port and a brass loading gate, a long octagonal barrel over a tube magazine, a
// buckhorn rear sight and a blade front sight, a walnut forend and a straight walnut stock
// with a steel butt plate. Moving parts: the lever loop (with the trigger), the bolt, a
// cartridge for loading and the muzzle flash.
// Actions: Idle, Fire (shot, then the lever is worked: it swings down, the bolt runs back and
// ejects, then it closes), Reload (rolled to show the loading gate, three rounds thumbed in),
// Inspect (both sides, a half-cock look into the action, lever worked once).
import { P, rbox, cyl, sph, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.08, -0.17, 0.28];
const W = (p) => offset(W0, p);
const BORE = 0.036, SIGHT = 0.07;
const PIVOT = [0, -0.002, -0.03]; // the lever's hinge, under the rear of the receiver
const ROUND_SEAT = [-0.0175, 0.028, 0.03]; // at the loading gate
export const WINCHESTER_POINTS = { muzzle: [0, BORE, 0.6], eject: [0, 0.064, 0.0], sightRear: [0, SIGHT, 0.12], sightFront: [0, SIGHT, 0.58] };

const MATERIALS = {
  walnut: { color: '#6a3a1c', roughness: 0.38, pattern: 'walnut', patternScale: 24, patternColor: '#341808', sheen: 0.3 },
  blued: { color: '#1f242b', roughness: 0.3, metallic: 0.95, pattern: 'metal', patternScale: 3 },
  caseHard: { color: '#6a655f', roughness: 0.3, metallic: 1, pattern: 'metal', patternScale: 2, patternColor: '#3e4a62', patternStrength: 0.7 },
  brass: { color: '#c9a24e', roughness: 0.26, metallic: 1, pattern: 'metal', patternScale: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  steel: { color: '#8e9092', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 4 },
  dark: { color: '#0b0b0c', roughness: 0.9 },
  rubber: { color: '#141212', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};
const WPN = { bone: 'weapon' }, LEV = { bone: 'lever' }, BLT = { bone: 'bolt' }, RND = { bone: 'round' };
const roundParts = (name, c, bind) => [
  P(name + ' Case', cyl(0.0055, 0.0055, 0.04, 12), 'brass', bind, { position: W(offset(c, [0, 0, -0.008])), rotation: ALONG_Z }),
  P(name + ' Bullet', { type: 'superquadric', rx: 0.0052, ry: 0.0052, rz: 0.014, e1: 1, e2: 1, widthSegments: 10, heightSegments: 7, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, 'copper', bind, { position: W(offset(c, [0, 0, 0.023])) }),
];

const GUN = [
  // ---- receiver, tang, loading gate, ejection port
  P('Receiver', profile([[-0.1, 0.0], [0.1, 0.0], [0.1, 0.056], [0.085, 0.062], [-0.06, 0.062], [-0.1, 0.044]], 0.034, 0.006), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Tang', rbox(0.02, 0.008, 0.07, 0.003), 'blued', WPN, { position: W([0, 0.052, -0.13]) }),
  P('Loading Gate', rbox(0.003, 0.02, 0.05, 0.001), 'brass', WPN, { position: W([-0.0175, 0.03, 0.03]) }),
  P('Ejection Port', rbox(0.016, 0.002, 0.07, 0.001), 'dark', WPN, { position: W([0, 0.0625, 0.02]) }),
  P('Receiver Screws', cyl(0.003, 0.003, 0.036, 10), 'steel', WPN, { position: W([0, 0.03, -0.075]), rotation: [0, 0, 90] }),
  P('Hammer', profile([[-0.095, 0.05], [-0.082, 0.05], [-0.074, 0.07], [-0.086, 0.078], [-0.1, 0.07]], 0.008, 0.0015), 'caseHard', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- bolt (seen through the port, runs back with the lever)
  P('Bolt', rbox(0.014, 0.01, 0.07, 0.002), 'steel', BLT, { position: W([0, 0.058, 0.01]) }),
  // ---- barrel, tube magazine, sights, forend
  P('Barrel', cyl(0.0105, 0.0105, 0.5, 8), 'blued', WPN, { position: W([0, BORE, 0.35]), rotation: ALONG_Z }),
  P('Barrel Collar', cyl(0.0125, 0.0125, 0.03, 16), 'blued', WPN, { position: W([0, BORE, 0.11]), rotation: ALONG_Z }),
  P('Magazine Tube', cyl(0.0088, 0.0088, 0.4, 16), 'blued', WPN, { position: W([0, 0.014, 0.32]), rotation: ALONG_Z }),
  P('Tube Cap', cyl(0.0098, 0.0098, 0.012, 16), 'caseHard', WPN, { position: W([0, 0.014, 0.52]), rotation: ALONG_Z }),
  P('Barrel Band', rbox(0.03, 0.044, 0.012, 0.004), 'blued', WPN, { position: W([0, 0.026, 0.5]) }),
  P('Rear Sight Base', rbox(0.012, 0.006, 0.02, 0.002), 'blued', WPN, { position: W([0, 0.049, 0.12]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Buckhorn L' : 'Buckhorn R', rbox(0.003, 0.016, 0.004, 0.001), 'blued', WPN, { position: W([s * 0.0045, 0.059, 0.12]) })),
  P('Front Blade', rbox(0.003, 0.016, 0.008, 0.001), 'blued', WPN, { position: W([0, 0.055, 0.58]) }),
  P('Front Dot', sph(0.0018, 8, 6), 'brass', WPN, { position: W([0, SIGHT - 0.0008, 0.58]), castShadow: false }),
  P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.6005]), rotation: ALONG_Z }),
  P('Forend', rbox(0.034, 0.034, 0.26, 0.012, 2), 'walnut', WPN, { position: W([0, 0.012, 0.25]) }),
  P('Forend Cap', rbox(0.036, 0.036, 0.012, 0.004), 'blued', WPN, { position: W([0, 0.012, 0.385]) }),
  // ---- stock (straight, no pistol grip)
  P('Stock', profile([[-0.1, 0.05], [-0.14, 0.04], [-0.3, 0.046], [-0.43, 0.05], [-0.44, 0.046], [-0.44, -0.07], [-0.43, -0.076], [-0.3, -0.05], [-0.18, -0.034], [-0.14, -0.026], [-0.1, -0.012]], 0.036, 0.01), 'walnut', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Plate', profile([[-0.44, 0.048], [-0.452, 0.046], [-0.456, -0.07], [-0.45, -0.078], [-0.44, -0.074]], 0.038, 0.004), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- lever loop with the trigger (hinged under the receiver)
  P('Lever Top', rbox(0.007, 0.006, 0.12, 0.002), 'blued', LEV, { position: W([0, -0.003, 0.03]) }),
  P('Lever Bottom', rbox(0.008, 0.007, 0.12, 0.002), 'blued', LEV, { position: W([0, -0.066, 0.03]) }),
  P('Lever Front', rbox(0.008, 0.07, 0.008, 0.002), 'blued', LEV, { position: W([0, -0.034, 0.09]) }),
  P('Lever Rear', rbox(0.008, 0.07, 0.008, 0.002), 'blued', LEV, { position: W([0, -0.034, -0.03]) }),
  P('Lever Latch', rbox(0.012, 0.008, 0.012, 0.002), 'caseHard', LEV, { position: W([0, -0.0035, 0.09]) }),
  P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.022], [-0.006, -0.034], [-0.01, -0.031], [-0.005, -0.019]], 0.007, 0.0012), 'steel', LEV, { position: W([0, 0, 0.015]), rotation: SIDE }),
  // ---- a cartridge being loaded
  ...roundParts('Loading Round', ROUND_SEAT, RND),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 7, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.61]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.03, height: 0.13, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.67]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.037, -0.058, -0.14], r: [-62, 0, 4] };
const SUPPORT_L = { attach: 'weapon', p: [0.05, 0.0, 0.26], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 4, -3] };
const LEVER_R = { attach: 'lever', p: [-0.02, -0.07, 0.0], r: [-64, 0, 4] }; // fist through the loop
const LEVER_DOWN = -62; // degrees the loop swings down and forward
const BOLT_BACK = -0.05;
const GATE_POSE = { p: [0.0, -0.15, 0.4], r: [-6, -50, 12] }; // right side to the eye: the loading gate
const GATE_R = { attach: 'weapon', p: [-0.06, 0.03, 0.03], r: [-90, 0, 0] };
const IN_HAND = { attach: 'hand.R', ...inFrame({ p: [-0.06, 0.03, 0.03], r: [-90, 0, 0] }, { p: [-0.0175, 0.028, 0.03], r: [0, 0, 0] }) };
const FETCH = { attach: 'world', p: [-0.2, -0.62, 0.18], r: [-40, -20, 30] };
const lever = (t) => ({ lever: [k(t, { v: 0 }), k(t + 0.2, { v: LEVER_DOWN }, 'snap'), k(t + 0.34, { v: LEVER_DOWN }), k(t + 0.54, { v: 0 }, 'snap')], bolt: [k(t, { v: 0 }), k(t + 0.18, { v: BOLT_BACK }, 'snap'), k(t + 0.34, { v: BOLT_BACK }), k(t + 0.54, { v: 0 }, 'snap')] });

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    // the shot, then the lever is worked: loop down, bolt back and the case thrown, loop up
    duration: 1.1, fps: 60,
    weapon: [
      k(0, READY), k(0.04, { p: offset(W0, [0.006, 0.035, -0.08]), r: [-16, 7, -7] }, 'snap'), k(0.26, { p: offset(W0, [0, 0.008, 0.004]), r: [-4, 5, -4] }),
      k(0.4, { p: offset(W0, [0.004, -0.004, -0.01]), r: [1, 6, -6] }, 'snap'), k(0.62, { p: offset(W0, [0.004, -0.006, -0.012]), r: [1, 6, -6] }),
      k(0.82, { p: offset(W0, [0.002, 0.002, -0.002]), r: [-1, 5, -4] }, 'snap'), k(1.1, READY),
    ],
    handR: [k(0, GRIP_R), k(0.22, GRIP_R), k(0.32, LEVER_R), k(0.84, LEVER_R), k(0.98, GRIP_R), k(1.1, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(1.1, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.2, { pose: HANDS.pistolGrip }), k(0.32, { pose: HANDS.hook }), k(0.84, { pose: HANDS.hook }), k(0.98, { pose: HANDS.pistolGrip }), k(1.1, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.05, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(0.4, { pose: HANDS.wrap }), k(1.1, { pose: HANDS.wrap })],
    slides: { bolt: lever(0.3).bolt },
    spins: { lever: lever(0.3).lever },
    toggles: { flash: [k(0, { v: 1 }), k(0.045, { v: 1 }, 'hold'), k(0.046, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, { t: 0.36, name: 'eject' }, { t: 0.4, name: 'pumpBack' }, { t: 0.84, name: 'pumpHome' }],
  },
  Reload: {
    // roll the gun to show the loading gate and thumb in three rounds, one fetched at a time
    duration: 3.6, fps: 30,
    weapon: [k(0, READY), k(0.4, GATE_POSE), k(3.2, GATE_POSE), k(3.6, READY)],
    handR: [
      k(0, GRIP_R), k(0.1, GRIP_R), k(0.4, FETCH),
      ...[0, 1, 2].flatMap((i) => { const t = 0.5 + i * 0.95; return [k(t, FETCH), k(t + 0.3, GATE_R), k(t + 0.4, { ...GATE_R, p: offset(GATE_R.p, [0.03, 0, 0]) }, 'snap'), k(t + 0.55, { ...GATE_R, p: offset(GATE_R.p, [0.0, 0, 0]) }), k(t + 0.85, FETCH)]; }),
      k(3.3, GRIP_R), k(3.6, GRIP_R),
    ],
    handL: [k(0, SUPPORT_L), k(3.6, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.4, { pose: HANDS.pinch }), k(3.2, { pose: HANDS.pinch }), k(3.4, { pose: HANDS.pistolGrip }), k(3.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(3.6, { pose: HANDS.wrap })],
    props: {
      round: [0, 1, 2].flatMap((i) => { const t = 0.5 + i * 0.95; return [k(t - 0.01, HIDDEN), k(t, IN_HAND, 'hold'), k(t + 0.4, IN_HAND), k(t + 0.41, HIDDEN, 'hold')]; }),
    },
    events: [0, 1, 2].map((i) => ({ t: 0.5 + i * 0.95 + 0.42, name: 'shellIn' })).concat([{ t: 3.3, name: 'magIn' }]),
  },
  Inspect: {
    duration: 4.6, fps: 30,
    weapon: [
      k(0, READY), k(0.4, { p: [-0.04, -0.17, 0.34], r: [-4, 26, -10] }),
      k(0.85, { p: [0.01, -0.14, 0.42], r: [-8, 54, -18] }), k(1.5, { p: [0.014, -0.138, 0.425], r: [-10, 56, -20] }), // left: the lever and hammer
      k(2.2, { p: [0.0, -0.14, 0.4], r: [-10, -44, 22] }), k(3.4, { p: [0.004, -0.138, 0.4], r: [-12, -46, 24] }), // right: the gate
      k(4.0, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }), k(4.6, READY),
    ],
    handR: [k(0, GRIP_R), k(2.0, GRIP_R), k(2.2, LEVER_R), k(3.0, LEVER_R), k(3.4, GRIP_R), k(4.6, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(4.6, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.0, { pose: HANDS.pistolGrip }), k(2.2, { pose: HANDS.hook }), k(3.0, { pose: HANDS.hook }), k(3.4, { pose: HANDS.pistolGrip }), k(4.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(4.6, { pose: HANDS.wrap })],
    // work the lever half way to look into the action
    spins: { lever: [k(0, { v: 0 }), k(2.3, { v: 0 }), k(2.6, { v: -34 }, 'snap'), k(2.9, { v: -34 }), k(3.2, { v: 0 }, 'snap')] },
    slides: { bolt: [k(0, { v: 0 }), k(2.3, { v: 0 }), k(2.6, { v: -0.03 }, 'snap'), k(2.9, { v: -0.03 }), k(3.2, { v: 0 }, 'snap')] },
    events: [{ t: 2.6, name: 'pumpBack' }, { t: 3.2, name: 'pumpHome' }],
  },
};

export const WINCHESTER = {
  id: 'winchester', name: 'Winchester 1894', W0, BORE,
  bones: [
    { name: 'lever', head: PIVOT, tail: offset(PIVOT, [0, 0, 0.08]) },
    { name: 'bolt', head: [0, 0.058, 0.01] },
    { name: 'flash', head: [0, BORE, 0.61], tail: [0, BORE, 0.66] },
  ],
  props: { round: ROUND_SEAT },
  propsDefault: { round: HIDDEN },
  slides: { bolt: 'z' },
  spins: { lever: 'x' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: WINCHESTER_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const winchesterDefinition = (o) => weaponDefinition(WINCHESTER, o);
export const createWinchester = () => createWeapon(WINCHESTER);
