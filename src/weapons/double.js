// Side-by-side double-barrel 12 gauge, first person: a colour case-hardened boxlock action
// with a top lever and a tang safety, two triggers, twin barrels joined by a matted rib with
// a brass bead, a splinter forend, and a walnut stock with a checkered pistol grip. The
// barrels (with the forend and the two chambered shells) swing down on the hinge pin.
// Moving parts: the barrels, the top lever, the chambered shells, a pair of fresh shells
// and the muzzle flash.
// Actions: Idle, Fire (one barrel), Reload (open, the extractors throw both hulls, drop two
// fresh shells in, snap it shut), Inspect.
import { P, rbox, cyl, sph, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.08, -0.17, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.036;
const GAP = 0.0118; // each barrel's axis sits this far either side of the rib
const BREECH = 0.07; // breech face
const MUZZLE = 0.6;
const SIGHT = 0.058;
const HINGE = [0, 0.008, 0.112];
const OPEN = 38; // degrees the barrels drop
const PAIR = [0, BORE, BREECH + 0.032]; // two shells seated in the chambers
export const DOUBLE_POINTS = { muzzle: [0, BORE, MUZZLE], eject: [0, BORE, BREECH], sightRear: [0, SIGHT, 0.02], sightFront: [0, SIGHT, MUZZLE - 0.01] };

const MATERIALS = {
  walnut: { color: '#5e3218', roughness: 0.3, pattern: 'walnut', patternScale: 28, patternColor: '#341708', sheen: 0.35 },
  checkering: { color: '#502a13', roughness: 0.55, pattern: 'checker', patternScale: 220, patternColor: '#241006', patternStrength: 0.6 },
  caseHard: { color: '#6d6a66', roughness: 0.28, metallic: 1, pattern: 'metal', patternScale: 2, patternColor: '#46557a', patternStrength: 0.7 },
  blued: { color: '#1b1e22', roughness: 0.28, metallic: 0.95, pattern: 'metal', patternScale: 3 },
  steel: { color: '#8e9092', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 4 },
  hull: { color: '#1f4f8c', roughness: 0.42 },
  brass: { color: '#c9a24e', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 1 },
  rubber: { color: '#151313', roughness: 0.88, pattern: 'leather', patternScale: 260 },
  dark: { color: '#0d0d0e', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const BRL = { bone: 'barrels' };
// a pair of 12 gauge shells, side by side along +Z, brass heads at the back, centred on `c`
const shellPair = (name, c, bind) => [-GAP, GAP].flatMap((x, i) => [
  P(`${name} Hull ${i}`, cyl(0.0101, 0.0101, 0.056, 16), 'hull', bind, { position: W(offset(c, [x, 0, 0.004])), rotation: ALONG_Z }),
  P(`${name} Head ${i}`, cyl(0.0112, 0.0108, 0.012, 16), 'brass', bind, { position: W(offset(c, [x, 0, -0.027])), rotation: ALONG_Z }),
]);

const GUN = [
  // ---- action: boxlock body, standing breech, top lever, safety, triggers
  P('Action', profile([[-0.07, 0.0], [0.13, 0.0], [0.13, 0.012], [BREECH, 0.018], [BREECH, 0.056], [0.05, 0.062], [-0.05, 0.05], [-0.07, 0.036]], 0.05, 0.008), 'caseHard', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Breech Face', rbox(0.05, 0.04, 0.003, 0.004), 'steel', WPN, { position: W([0, BORE, BREECH - 0.0015]) }),
  ...[-GAP, GAP].map((x, i) => P('Firing Pin ' + i, cyl(0.0018, 0.0018, 0.002, 8), 'dark', WPN, { position: W([x, BORE, BREECH]), rotation: ALONG_Z })),
  P('Hinge Pin', cyl(0.006, 0.006, 0.052, 14), 'steel', WPN, { position: W(HINGE), rotation: [0, 0, 90] }),
  P('Top Lever', profile([[-0.004, 0], [0.004, 0], [0.006, -0.046], [0.0, -0.058], [-0.006, -0.046]], 0.012, 0.003), 'blued', { bone: 'lever' }, { position: W([0, 0.064, 0.04]), rotation: [-90, 0, 0] }),
  P('Tang', rbox(0.016, 0.006, 0.07, 0.003), 'caseHard', WPN, { position: W([0, 0.052, -0.07]) }),
  P('Safety', rbox(0.008, 0.005, 0.014, 0.002), 'blued', WPN, { position: W([0, 0.057, -0.06]) }),
  P('Trigger Plate', rbox(0.03, 0.012, 0.16, 0.004), 'blued', WPN, { position: W([0, -0.002, -0.02]) }),
  P('Trigger Guard', torus(0.022, 0.0034, { tubularSegments: 24 }), 'blued', WPN, { position: W([0, -0.034, -0.02]), rotation: [0, 0, 90], scale: [1, 1, 1.6] }),
  ...[[-0.004, 0.002], [-0.03, -0.001]].map(([z, x], i) => P(i ? 'Rear Trigger' : 'Front Trigger', profile([[z - 0.004, -0.008], [z + 0.004, -0.008], [z, -0.026], [z - 0.008, -0.036], [z - 0.011, -0.033], [z - 0.004, -0.024]], 0.006, 0.0014), 'steel', WPN, { position: W([x, 0, 0]), rotation: SIDE })),
  // ---- barrels, rib, bead, forend, chambered shells (all swing on the hinge)
  ...[-GAP, GAP].map((x, i) => P('Barrel ' + i, cyl(0.0122, 0.0112, MUZZLE - BREECH, 22), 'blued', BRL, { position: W([x, BORE, (MUZZLE + BREECH) / 2]), rotation: ALONG_Z })),
  ...[-GAP, GAP].map((x, i) => P('Muzzle Bore ' + i, cyl(0.0092, 0.0092, 0.003, 16), 'dark', BRL, { position: W([x, BORE, MUZZLE + 0.0005]), rotation: ALONG_Z })),
  ...[-GAP, GAP].map((x, i) => P('Chamber Ring ' + i, cyl(0.0132, 0.0132, 0.03, 22), 'blued', BRL, { position: W([x, BORE, BREECH + 0.015]), rotation: ALONG_Z })),
  P('Top Rib', rbox(0.01, 0.006, MUZZLE - BREECH - 0.01, 0.002), 'blued', BRL, { position: W([0, BORE + 0.0115, (MUZZLE + BREECH) / 2]) }),
  P('Bottom Rib', rbox(0.008, 0.006, MUZZLE - BREECH - 0.2, 0.002), 'blued', BRL, { position: W([0, BORE - 0.012, (MUZZLE + BREECH) / 2 + 0.1]) }),
  P('Bead', sph(0.0026, 10, 8), 'brass', BRL, { position: W([0, SIGHT, MUZZLE - 0.01]) }),
  P('Lumps', rbox(0.02, 0.022, 0.05, 0.003), 'blued', BRL, { position: W([0, 0.016, BREECH + 0.03]) }),
  P('Extractor', rbox(0.02, 0.008, 0.004, 0.001), 'steel', BRL, { position: W([0, BORE - 0.004, BREECH + 0.002]) }),
  P('Forend', profile([[0.13, 0.03], [0.34, 0.03], [0.35, 0.018], [0.34, -0.002], [0.15, -0.006], [0.13, 0.0]], 0.05, 0.01), 'walnut', BRL, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Forend Checkering', profile([[0.18, 0.02], [0.3, 0.02], [0.3, 0.002], [0.18, 0.0]], 0.0505, 0.002), 'checkering', BRL, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Forend Iron', rbox(0.03, 0.01, 0.06, 0.004), 'caseHard', BRL, { position: W([0, -0.006, 0.16]) }),
  ...shellPair('Chambered', PAIR, { bone: 'chambered' }),
  // ---- stock with a pistol grip
  P('Stock', profile([[-0.07, 0.052], [-0.13, 0.043], [-0.18, 0.038], [-0.26, 0.048], [-0.43, 0.046], [-0.438, 0.042], [-0.438, -0.1], [-0.43, -0.106], [-0.3, -0.078], [-0.2, -0.058], [-0.15, -0.075], [-0.128, -0.08], [-0.108, -0.06], [-0.09, -0.02], [-0.07, 0.0]], 0.043, 0.012), 'walnut', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip Checkering', profile([[-0.1, 0.03], [-0.17, 0.03], [-0.17, -0.056], [-0.132, -0.066], [-0.108, -0.04]], 0.0445, 0.002), 'checkering', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip Cap', rbox(0.03, 0.006, 0.026, 0.003), 'blued', WPN, { position: W([0, -0.08, -0.14]), rotation: [18, 0, 0] }),
  P('Recoil Pad', profile([[-0.438, 0.044], [-0.458, 0.044], [-0.462, 0.036], [-0.462, -0.098], [-0.456, -0.108], [-0.438, -0.104]], 0.045, 0.005), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- two fresh shells on their way to the chambers
  ...shellPair('Fresh', PAIR, { bone: 'pair' }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 8, inner: 0.35, radius: 0.085, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([GAP, BORE, MUZZLE + 0.015]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.04, height: 0.16, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([GAP, BORE, MUZZLE + 0.075]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.037, -0.062, -0.14], r: [-62, 0, 4] };
// the left hand rides the forend, so it follows the barrels when they drop
const FOREND = offset([0, 0.012, 0.25], HINGE.map((v) => -v));
const SUPPORT_L = { attach: 'barrels', p: offset(FOREND, [0.054, -0.032, 0]), r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 4, -3] };
const SEATED = { attach: 'barrels', p: offset(PAIR, HINGE.map((v) => -v)), r: [0, 0, 0] };
// in the barrels' frame: the pair lined up behind the chambers, the hand behind it pushing along the bore
const REL = (p) => offset(p, HINGE.map((v) => -v));
const PAIR_BEHIND = { p: REL(offset(PAIR, [0, 0.004, -0.07])), r: [0, 0, 0] };
const RH_BEHIND = { attach: 'barrels', p: REL(offset(PAIR, [-0.01, -0.02, -0.16])), r: [-90, 0, 20] };
const OPEN_POSE = { p: [-0.05, -0.2, 0.42], r: [8, 16, 22] }; // chambers tipped up to the eye
const FETCH = { attach: 'world', p: [-0.2, -0.62, 0.18], r: [-40, -20, 30] };
const IN_HAND = { attach: 'hand.R', ...inFrame(RH_BEHIND, PAIR_BEHIND) };

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    duration: 0.5, fps: 60,
    weapon: [k(0, READY), k(0.04, { p: offset(W0, [0.006, 0.04, -0.09]), r: [-19, 7, -8] }, 'snap'), k(0.26, { p: offset(W0, [0, 0.006, 0.006]), r: [-2, 5, -4] }), k(0.5, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.25, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.05, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(0.35, { pose: HANDS.wrap })],
    toggles: { flash: [k(0, { v: 1 }), k(0.045, { v: 1 }, 'hold'), k(0.046, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    duration: 2.6, fps: 30,
    weapon: [
      k(0, READY), k(0.3, OPEN_POSE),
      k(0.46, { p: offset(OPEN_POSE.p, [0, 0.03, -0.02]), r: [-6, 16, 22] }, 'snap'), // flick: the extractors throw the hulls
      k(0.62, OPEN_POSE), k(1.5, OPEN_POSE),
      k(1.8, { p: offset(W0, [0, -0.02, 0.04]), r: [10, 6, -4] }),
      k(1.88, { p: offset(W0, [0, 0.01, 0.02]), r: [-8, 5, -4] }, 'snap'), // snap it shut
      k(2.3, READY), k(2.6, READY),
    ],
    handR: [
      k(0, GRIP_R), k(0.3, GRIP_R), k(0.62, GRIP_R),
      k(0.9, FETCH), k(1.0, FETCH),
      k(1.3, RH_BEHIND),
      k(1.42, { ...RH_BEHIND, p: offset(RH_BEHIND.p, [0, -0.004, 0.07]) }, 'in'), // push them home
      k(1.72, GRIP_R), k(2.6, GRIP_R),
    ],
    handL: [k(0, SUPPORT_L), k(2.6, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.1, { pose: HANDS.push }), k(0.26, { pose: HANDS.pistolGrip }), k(0.62, { pose: HANDS.pistolGrip }), k(0.9, { pose: HANDS.pinch }), k(1.4, { pose: HANDS.pinch }), k(1.5, { pose: HANDS.relaxed }), k(1.72, { pose: HANDS.pistolGrip }), k(2.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(2.6, { pose: HANDS.wrap })],
    props: {
      pair: [k(0, HIDDEN), k(0.96, HIDDEN), k(0.97, IN_HAND, 'hold'), k(1.3, IN_HAND), k(1.42, SEATED, 'in'), k(1.43, HIDDEN, 'hold'), k(2.6, HIDDEN)],
    },
    toggles: { chambered: [k(0, { v: 1 }), k(0.45, { v: 1 }, 'hold'), k(0.46, { v: 0 }, 'hold'), k(1.42, { v: 0 }, 'hold'), k(1.43, { v: 1 }, 'hold')] },
    spins: {
      barrels: [k(0, { v: 0 }), k(0.14, { v: 0 }), k(0.3, { v: OPEN }, 'snap'), k(1.8, { v: OPEN }), k(1.88, { v: 0 }, 'snap')],
      lever: [k(0, { v: 0 }), k(0.06, { v: 0 }), k(0.14, { v: -32 }), k(1.84, { v: -32 }), k(1.88, { v: 0 }, 'snap')],
    },
    events: [{ t: 0.28, name: 'open' }, { t: 0.46, name: 'eject2' }, { t: 1.42, name: 'magIn' }, { t: 1.88, name: 'close' }],
  },
  Inspect: {
    duration: 4.2, fps: 30,
    weapon: [
      k(0, READY),
      k(0.4, { p: [-0.04, -0.17, 0.34], r: [-4, 26, -10] }),
      k(0.85, { p: [0.01, -0.14, 0.42], r: [-8, 54, -18] }), // left side: the case colours
      k(1.8, { p: [0.014, -0.138, 0.425], r: [-10, 56, -20] }),
      k(2.4, { p: [0.0, -0.14, 0.4], r: [-10, -44, 22] }), // right side
      k(3.3, { p: [0.004, -0.138, 0.4], r: [-12, -46, 24] }),
      k(3.8, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }),
      k(4.2, READY),
    ],
    handR: [k(0, GRIP_R), k(4.2, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(4.2, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(4.2, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(4.2, { pose: HANDS.wrap })],
  },
};

export const DOUBLE = {
  id: 'double', name: 'Double Barrel 12 ga', W0, BORE,
  bones: [
    { name: 'barrels', head: HINGE, tail: offset(HINGE, [0, 0, 0.1]) },
    { name: 'chambered', parent: 'barrels', head: PAIR, tail: offset(PAIR, [0, 0, 0.03]) },
    { name: 'lever', head: [0, 0.064, 0.04], tail: [0, 0.1, 0.04] },
    { name: 'flash', parent: 'barrels', head: [GAP, BORE, MUZZLE + 0.015], tail: [GAP, BORE, MUZZLE + 0.06] },
  ],
  props: { pair: PAIR },
  propsDefault: { pair: HIDDEN },
  spins: { barrels: 'x', lever: 'y' },
  toggles: ['flash', 'chambered'],
  toggleDefault: { flash: 0, chambered: 1 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: DOUBLE_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const doubleDefinition = (o) => weaponDefinition(DOUBLE, o);
export const createDouble = () => createWeapon(DOUBLE);
