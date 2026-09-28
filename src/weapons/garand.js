// M1 Garand, first person: a full-length walnut stock with a steel butt plate, parkerized
// receiver with the aperture rear sight and its windage and elevation knobs, walnut upper
// handguards, a lower band, the gas cylinder with its protected front sight, the operating
// rod and handle on the right, and an eight-round en-bloc clip. Moving parts: the operating
// rod and bolt, the clip, and the muzzle flash.
// Actions: Idle, Fire (semi-automatic: the op rod cycles and throws the case), Reload (rack
// the op rod, the empty clip pings out, thumb a fresh clip in, the bolt slams home), Inspect.
import { P, rbox, cyl, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.08, -0.175, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.042;
const SIGHT = 0.098;
const CLIP = [0, 0.036, 0.04]; // en-bloc clip seated in the receiver
const OP0 = [-0.028, 0.044, 0.118]; // operating rod handle
const OP_BACK = -0.1;
export const GARAND_POINTS = { muzzle: [0, BORE, 0.74], eject: [0, 0.075, 0.04], sightRear: [0, SIGHT, -0.08], sightFront: [0, SIGHT, 0.705] };

const MATERIALS = {
  walnut: { color: '#6b3b1c', roughness: 0.4, pattern: 'walnut', patternScale: 26, patternColor: '#3c1c0b', sheen: 0.25 },
  park: { color: '#3b3d37', roughness: 0.62, metallic: 0.6, pattern: 'metal', patternScale: 3, patternStrength: 0.6 },
  steel: { color: '#56585a', roughness: 0.35, metallic: 0.95, pattern: 'metal', patternScale: 4 },
  blued: { color: '#24262a', roughness: 0.35, metallic: 0.9, pattern: 'metal', patternScale: 3 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1, pattern: 'metal', patternScale: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  dark: { color: '#070707', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const OP = { bone: 'oprod' };
const CL = { bone: 'clip' };

const GUN = [
  // ---- stock: butt, wrist, and the forend running under the barrel
  P('Stock', profile([
    [-0.1, 0.03], [-0.13, 0.043], [-0.18, 0.04], [-0.26, 0.05], [-0.43, 0.05], [-0.438, 0.046], [-0.438, -0.1], [-0.43, -0.106], [-0.3, -0.074], [-0.19, -0.05],
    [-0.14, -0.04], [-0.114, -0.03], [-0.1, -0.022], [0.07, -0.022], [0.09, -0.014], [0.44, -0.008], [0.452, 0.004], [0.452, 0.026], [0.13, 0.026], [0.12, 0.02], [-0.09, 0.02],
  ], 0.046, 0.01), 'walnut', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Plate', profile([[-0.438, 0.048], [-0.448, 0.048], [-0.452, 0.04], [-0.452, -0.098], [-0.446, -0.108], [-0.438, -0.104]], 0.046, 0.003), 'park', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Trap', rbox(0.002, 0.03, 0.03, 0.004), 'park', WPN, { position: W([0, -0.03, -0.451]) }),
  P('Rear Swivel', torus(0.008, 0.0018), 'steel', WPN, { position: W([0, -0.09, -0.34]), rotation: [0, 90, 0] }),
  // ---- receiver and rear sight
  P('Receiver', profile([[-0.1, 0.018], [0.132, 0.018], [0.132, 0.062], [0.1, 0.068], [0.0, 0.068], [-0.02, 0.078], [-0.1, 0.078], [-0.11, 0.06]], 0.034, 0.005), 'park', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Well', rbox(0.026, 0.004, 0.07, 0.001), 'dark', WPN, { position: W([0, 0.068, 0.04]) }),
  P('Rear Sight Base', rbox(0.028, 0.014, 0.03, 0.003), 'park', WPN, { position: W([0, 0.084, -0.08]) }),
  P('Rear Aperture', torus(0.0065, 0.0024, { tubularSegments: 20 }), 'park', WPN, { position: W([0, SIGHT, -0.08]), rotation: [90, 0, 0] }),
  P('Aperture Ears', rbox(0.022, 0.012, 0.006, 0.002), 'park', WPN, { position: W([0, SIGHT - 0.008, -0.078]) }),
  P('Windage Knob', gearTube(0.0085, 0.008, 18, 0.12), 'steel', WPN, { position: W([-0.021, 0.086, -0.08]), rotation: [0, 90, 0] }),
  P('Elevation Knob', gearTube(0.011, 0.008, 22, 0.1), 'steel', WPN, { position: W([0.021, 0.084, -0.08]), rotation: [0, -90, 0] }),
  P('Clip Latch', rbox(0.004, 0.012, 0.02, 0.002), 'park', WPN, { position: W([0.0185, 0.05, -0.02]) }),
  // ---- bolt (rides on the op rod) and the operating rod with its handle on the right
  P('Bolt', rbox(0.018, 0.018, 0.07, 0.004), 'steel', OP, { position: W([0, 0.064, -0.04]) }),
  P('Bolt Face', cyl(0.006, 0.006, 0.01, 12), 'steel', OP, { position: W([0, 0.064, 0.0]), rotation: ALONG_Z }),
  P('Op Rod Handle', rbox(0.012, 0.018, 0.02, 0.004), 'park', OP, { position: W(OP0) }),
  P('Op Rod Hump', sph(0.0085, 12, 8), 'park', OP, { position: W(offset(OP0, [-0.006, 0.004, 0.004])) }),
  P('Op Rod', cyl(0.0045, 0.0045, 0.5, 12), 'park', OP, { position: W([-0.018, 0.026, 0.37]), rotation: ALONG_Z }),
  // ---- barrel, handguards, lower band, gas cylinder and front sight
  P('Barrel', cyl(0.0105, 0.0105, 0.61, 20), 'park', WPN, { position: W([0, BORE, 0.435]), rotation: ALONG_Z }),
  P('Rear Handguard', rbox(0.034, 0.024, 0.16, 0.011, 2), 'walnut', WPN, { position: W([0, BORE + 0.006, 0.225]) }),
  P('Front Handguard', rbox(0.032, 0.022, 0.13, 0.01, 2), 'walnut', WPN, { position: W([0, BORE + 0.005, 0.41]) }),
  P('Handguard Ferrule', cyl(0.0175, 0.0175, 0.012, 20), 'park', WPN, { position: W([0, BORE, 0.306]), rotation: ALONG_Z, scale: [1.05, 1, 1.1] }),
  P('Lower Band', rbox(0.04, 0.05, 0.022, 0.012), 'park', WPN, { position: W([0, BORE - 0.012, 0.485]) }),
  P('Gas Cylinder', cyl(0.0155, 0.0155, 0.1, 20), 'park', WPN, { position: W([0, BORE - 0.006, 0.675]), rotation: ALONG_Z }),
  P('Gas Lock', rbox(0.03, 0.03, 0.016, 0.006), 'park', WPN, { position: W([0, BORE - 0.014, 0.72]) }),
  P('Gas Plug', gearTube(0.008, 0.01, 6, 0.3), 'steel', WPN, { position: W([0, BORE - 0.016, 0.731]) }),
  P('Stacking Swivel', torus(0.009, 0.002), 'steel', WPN, { position: W([0, BORE - 0.036, 0.66]), rotation: [0, 90, 0] }),
  P('Bayonet Lug', rbox(0.008, 0.012, 0.03, 0.002), 'park', WPN, { position: W([0, BORE - 0.03, 0.7]) }),
  P('Front Sight Base', rbox(0.014, 0.024, 0.02, 0.003), 'park', WPN, { position: W([0, 0.072, 0.705]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', rbox(0.003, 0.026, 0.014, 0.001), 'park', WPN, { position: W([s * 0.0085, SIGHT - 0.012, 0.705]) })),
  P('Front Post', rbox(0.0026, 0.022, 0.004, 0.0006), 'park', WPN, { position: W([0, SIGHT - 0.011, 0.705]) }),
  P('Muzzle Crown', cyl(0.0105, 0.011, 0.012, 20), 'park', WPN, { position: W([0, BORE, 0.735]), rotation: ALONG_Z }),
  P('Muzzle Bore', cyl(0.004, 0.004, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.7415]), rotation: ALONG_Z }),
  P('Front Swivel', torus(0.008, 0.0018), 'steel', WPN, { position: W([0, -0.028, 0.49]), rotation: [0, 90, 0] }),
  // ---- trigger group
  P('Trigger Guard', torus(0.021, 0.0038, { tubularSegments: 24 }), 'park', WPN, { position: W([0, -0.036, -0.018]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
  P('Trigger', profile([[-0.01, -0.02], [-0.002, -0.02], [-0.006, -0.036], [-0.014, -0.046], [-0.017, -0.043], [-0.01, -0.033]], 0.006, 0.0014), 'park', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Safety', rbox(0.01, 0.012, 0.006, 0.002), 'park', WPN, { position: W([0, -0.03, 0.018]) }),
  // ---- en-bloc clip with its eight rounds
  P('Clip', rbox(0.03, 0.05, 0.052, 0.002), 'steel', CL, { position: W(CLIP) }),
  ...[[0.0055, 0.057], [-0.0055, 0.064]].flatMap(([x, y], i) => [
    P('Clip Round ' + i, cyl(0.006, 0.006, 0.05, 12), 'brass', CL, { position: W([x, y, CLIP[2] - 0.006]), rotation: ALONG_Z }),
    P('Clip Bullet ' + i, { type: 'superquadric', rx: 0.0055, ry: 0.0055, rz: 0.014, e1: 1, e2: 1, widthSegments: 10, heightSegments: 7, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, 'copper', CL, { position: W([x, y, CLIP[2] + 0.021]) }),
  ]),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 7, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.75]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.03, height: 0.13, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.8]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.037, -0.058, -0.14], r: [-62, 0, 4] };
const SUPPORT_L = { attach: 'weapon', p: [0.052, -0.022, 0.28], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 4, -3] };
const SEATED = { attach: 'weapon', p: CLIP, r: [0, 0, 0] };
// right hand on the op rod handle (in the handle's frame), and over the receiver with a clip
const R_OP = { attach: 'oprod', p: [-0.045, -0.02, -0.035], r: [-40, -10, 40] };
const R_EDGE = { attach: 'weapon', p: [-0.05, 0.03, 0.05], r: [-40, -10, 40] }; // edge of the hand holding the op rod back
const CLIP_ABOVE = { p: offset(CLIP, [0, 0.07, -0.005]), r: [0, 0, 0] };
const RH_ABOVE = { p: [-0.03, 0.125, -0.04], r: [-150, 0, 160] }; // thumb down on the clip
const IN_HAND = { attach: 'hand.R', ...inFrame(RH_ABOVE, CLIP_ABOVE) };
const FETCH = { attach: 'world', p: [-0.2, -0.62, 0.18], r: [-40, -20, 30] };
const LOAD = { p: [-0.07, -0.2, 0.44], r: [-4, 14, 30] }; // canted so the receiver's top faces the eye

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    duration: 0.24, fps: 60,
    weapon: [k(0, READY), k(0.03, { p: offset(W0, [0.004, 0.02, -0.05]), r: [-9, 5.5, -5] }, 'snap'), k(0.13, { p: offset(W0, [0, 0.004, -0.004]), r: [-1.5, 4.2, -3.4] }), k(0.24, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.16, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.04, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(0.2, { pose: HANDS.wrap })],
    slides: { oprod: [k(0, { v: 0 }), k(0.035, { v: OP_BACK }, 'snap'), k(0.07, { v: 0 }, 'snap')] },
    toggles: { flash: [k(0, { v: 1 }), k(0.035, { v: 1 }, 'hold'), k(0.036, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    duration: 2.6, fps: 30,
    weapon: [
      k(0, READY), k(0.3, LOAD), k(0.52, LOAD),
      k(0.56, { p: offset(LOAD.p, [0, -0.006, 0.004]), r: [-2, 14, 30] }, 'snap'), // ping
      k(0.7, LOAD), k(1.5, LOAD),
      k(1.56, { p: offset(LOAD.p, [0, -0.01, 0]), r: [-6, 14, 30] }, 'snap'), // clip thumbed home
      k(1.8, LOAD),
      k(1.86, { p: offset(LOAD.p, [0.002, 0.006, -0.01]), r: [-3, 15, 31] }, 'snap'), // bolt slams
      k(2.3, READY), k(2.6, READY),
    ],
    handR: [
      k(0, GRIP_R), k(0.2, { ...R_OP, p: offset(R_OP.p, [-0.02, 0.02, 0.02]) }),
      k(0.3, R_OP), k(0.5, R_OP), // haul the op rod back
      k(0.64, R_OP),
      k(0.9, FETCH), k(0.98, FETCH),
      k(1.3, { attach: 'weapon', ...RH_ABOVE, p: offset(RH_ABOVE.p, [0, 0.02, 0]) }),
      k(1.4, { attach: 'weapon', ...RH_ABOVE }),
      k(1.56, { attach: 'weapon', ...RH_ABOVE, p: offset(RH_ABOVE.p, [0, -0.07, 0]) }, 'snap'), // thumb the clip in
      k(1.7, R_EDGE), k(1.8, R_EDGE),
      k(1.86, { ...R_EDGE, p: offset(R_EDGE.p, [-0.02, 0.06, -0.02]) }, 'snap'), // hand jumps clear of the bolt
      k(2.25, GRIP_R), k(2.6, GRIP_R),
    ],
    handL: [k(0, SUPPORT_L), k(2.6, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.2, { pose: HANDS.relaxed }), k(0.3, { pose: HANDS.hook }), k(0.64, { pose: HANDS.hook }), k(0.9, { pose: HANDS.grab }), k(1.4, { pose: HANDS.grab }), k(1.5, { pose: HANDS.push }), k(1.6, { pose: HANDS.push }), k(1.7, { pose: HANDS.flat }), k(1.9, { pose: HANDS.relaxed }), k(2.25, { pose: HANDS.pistolGrip }), k(2.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(2.6, { pose: HANDS.wrap })],
    props: {
      clip: [
        k(0, SEATED), k(0.5, SEATED),
        k(0.58, { attach: 'weapon', p: offset(CLIP, [-0.03, 0.22, -0.06]), r: [40, 0, 30] }, 'out'), // ping!
        k(0.59, HIDDEN, 'hold'), k(0.94, HIDDEN), k(0.95, IN_HAND, 'hold'),
        k(1.4, IN_HAND),
        k(1.56, SEATED, 'snap'), k(2.6, SEATED),
      ],
    },
    slides: { oprod: [k(0, { v: 0 }), k(0.3, { v: 0 }), k(0.46, { v: OP_BACK }), k(1.84, { v: OP_BACK }), k(1.88, { v: 0 }, 'snap')] },
    events: [{ t: 0.46, name: 'charge' }, { t: 0.52, name: 'ping' }, { t: 1.56, name: 'magIn' }, { t: 1.88, name: 'boltHome' }],
  },
  Inspect: {
    duration: 4.2, fps: 30,
    weapon: [
      k(0, READY),
      k(0.4, { p: [-0.04, -0.17, 0.36], r: [-4, 26, -10] }),
      k(0.85, { p: [0.01, -0.15, 0.44], r: [-8, 54, -18] }), // left side: clip latch
      k(1.7, { p: [0.014, -0.148, 0.445], r: [-10, 56, -20] }),
      k(2.3, { p: [0.0, -0.15, 0.42], r: [-10, -42, 22] }), // right side: op rod
      k(3.3, { p: [0.004, -0.148, 0.42], r: [-12, -44, 24] }),
      k(3.8, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }),
      k(4.2, READY),
    ],
    handR: [k(0, GRIP_R), k(4.2, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(4.2, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(4.2, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(4.2, { pose: HANDS.wrap })],
  },
};

export const GARAND = {
  id: 'garand', name: 'M1 Garand', W0, BORE,
  bones: [
    { name: 'oprod', head: OP0, tail: offset(OP0, [0, 0, 0.08]) },
    { name: 'flash', head: [0, BORE, 0.75], tail: [0, BORE, 0.8] },
  ],
  props: { clip: CLIP },
  propsDefault: { clip: SEATED },
  slides: { oprod: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: GARAND_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const garandDefinition = (o) => weaponDefinition(GARAND, o);
export const createGarand = () => createWeapon(GARAND);
