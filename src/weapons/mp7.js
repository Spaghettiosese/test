// MP7-style 4.6x30mm personal defence weapon, first person: a compact polymer receiver with
// a full-length top rail and flip-up iron sights, a short barrel with a slotted flash hider,
// a folding vertical foregrip, a retractable stock, an ambidextrous T charging handle at
// the back of the rail, and a 40-round magazine that lives inside the pistol grip.
// Moving parts: the magazine, the charging handle and the muzzle flash.
// Actions: Idle, Fire (one round of ~950 rpm automatic fire), Reload (the magazine drops
// out of the grip, a fresh one is pushed up into it, then the T handle is racked), Inspect.
import { P, rbox, cyl, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.095, -0.19, 0.3];
const W = (p) => offset(W0, p);
const BORE = 0.045;
const RAIL = 0.084; // top of the rail
const SIGHT = 0.104;
// the grip (and the magazine inside it) slants back as it goes down
const gz = (y) => -0.052 + 0.22 * y;
const MAG_SEAT = [0, -0.06, gz(-0.06)];
const CH0 = [0, 0.074, -0.12]; // T charging handle at rest
export const MP7_POINTS = { muzzle: [0, BORE, 0.262], eject: [-0.026, 0.05, 0.05], sightRear: [0, SIGHT, -0.085], sightFront: [0, SIGHT, 0.135] };

const MATERIALS = {
  polymer: { color: '#23262a', roughness: 0.7, pattern: 'leather', patternScale: 240, patternColor: '#15171a', patternStrength: 0.5 },
  grip: { color: '#1d2023', roughness: 0.82, pattern: 'checker', patternScale: 260, patternColor: '#0e0f11', patternStrength: 0.5 },
  steel: { color: '#2c2e31', roughness: 0.38, metallic: 0.9, pattern: 'metal', patternScale: 3 },
  rail: { color: '#1f2124', roughness: 0.45, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  magPoly: { color: '#2a2d31', roughness: 0.65, pattern: 'leather', patternScale: 200, patternStrength: 0.4 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  dark: { color: '#070707', roughness: 0.9 },
  white: { color: '#e8e4d8', roughness: 0.6 },
  red: { color: '#c02a1e', roughness: 0.6 },
  tritium: { color: '#8cff9a', roughness: 0.4, emissive: '#6aff80', emissiveStrength: 1.2 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const slant = (y0, y1, front, back) => [[gz(y0) + front, y0], [gz(y1) + front, y1], [gz(y1) - back, y1], [gz(y0) - back, y0]];

const GUN = [
  // ---- receiver, rail, sights
  P('Upper Receiver', profile([[-0.15, 0.02], [0.14, 0.02], [0.16, 0.034], [0.16, 0.07], [0.12, 0.076], [-0.14, 0.076], [-0.15, 0.066]], 0.046, 0.008), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Lower Receiver', profile([[-0.13, 0.024], [0.12, 0.024], [0.12, 0.006], [0.1, -0.006], [0.02, -0.006], [0.0, -0.014], [-0.11, -0.014], [-0.13, 0.0]], 0.042, 0.006), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Rail', rbox(0.022, 0.007, 0.25, 0.001), 'rail', WPN, { position: W([0, RAIL - 0.0035, 0.01]) }),
  P('Rail Teeth', rbox(0.022, 0.003, 0.005, 0.0005), 'rail', WPN, { position: W([0, RAIL + 0.0015, -0.1]), modifiers: [{ type: 'array', count: 22, offsetX: 0, offsetY: 0, offsetZ: 0.01, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  P('Rear Sight Base', rbox(0.022, 0.012, 0.024, 0.002), 'polymer', WPN, { position: W([0, RAIL + 0.008, -0.085]) }),
  P('Rear Aperture', torus(0.0062, 0.0022, { tubularSegments: 20 }), 'polymer', WPN, { position: W([0, SIGHT, -0.085]), rotation: [90, 0, 0] }),
  P('Front Sight Base', rbox(0.02, 0.012, 0.018, 0.002), 'polymer', WPN, { position: W([0, RAIL + 0.008, 0.135]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', rbox(0.003, 0.02, 0.01, 0.001), 'polymer', WPN, { position: W([s * 0.008, SIGHT - 0.002, 0.135]) })),
  P('Front Post', rbox(0.0024, 0.018, 0.003, 0.0005), 'steel', WPN, { position: W([0, SIGHT - 0.008, 0.135]) }),
  P('Front Dot', { type: 'sphere', radius: 0.0012, widthSegments: 8, heightSegments: 6, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, 'tritium', WPN, { position: W([0, SIGHT + 0.0005, 0.1335]), castShadow: false }),
  P('Ejection Port', rbox(0.002, 0.016, 0.05, 0.001), 'dark', WPN, { position: W([-0.0235, 0.05, 0.05]) }),
  P('Side Slots', rbox(0.002, 0.008, 0.018, 0.001), 'dark', WPN, { position: W([0.0235, 0.046, 0.08]), modifiers: [{ type: 'array', count: 3, offsetX: 0, offsetY: 0, offsetZ: 0.026, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  P('Receiver Pins', cyl(0.003, 0.003, 0.05, 10), 'steel', WPN, { position: W([0, 0.03, -0.1]), rotation: [0, 0, 90] }),
  P('Front Pin', cyl(0.003, 0.003, 0.05, 10), 'steel', WPN, { position: W([0, 0.03, 0.11]), rotation: [0, 0, 90] }),
  // ---- barrel and flash hider
  P('Barrel', cyl(0.0085, 0.0085, 0.07, 18), 'steel', WPN, { position: W([0, BORE, 0.19]), rotation: ALONG_Z }),
  P('Flash Hider', gearTube(0.0115, 0.034, 6, 0.22), 'steel', WPN, { position: W([0, BORE, 0.244]) }),
  P('Muzzle Bore', cyl(0.004, 0.004, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.2615]), rotation: ALONG_Z }),
  // ---- folding vertical foregrip
  P('Foregrip Hinge', rbox(0.026, 0.014, 0.03, 0.004), 'polymer', WPN, { position: W([0, -0.01, 0.1]) }),
  P('Foregrip', profile([[0.086, -0.012], [0.114, -0.012], [0.116, -0.11], [0.108, -0.118], [0.09, -0.118], [0.084, -0.11]], 0.028, 0.009), 'grip', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Foregrip Ribs', rbox(0.03, 0.003, 0.004, 0.001), 'polymer', WPN, { position: W([0, -0.03, 0.084]), modifiers: [{ type: 'array', count: 5, offsetX: 0, offsetY: -0.016, offsetZ: 0, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  // ---- trigger group and the pistol grip (hollow: the magazine lives in it)
  P('Trigger Guard', torus(0.02, 0.0036, { tubularSegments: 24 }), 'polymer', WPN, { position: W([0, -0.03, -0.006]), rotation: [0, 0, 90], scale: [1, 1, 1.3] }),
  P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.028], [-0.004, -0.038], [-0.008, -0.035], [-0.003, -0.025]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[gz(-0.012) + 0.024, -0.012], [gz(-0.12) + 0.022, -0.12], [gz(-0.124) - 0.024, -0.124], [gz(-0.012) - 0.026, -0.012]], 0.034, 0.008), 'grip', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip Backstrap', profile([[gz(-0.02) - 0.022, -0.02], [gz(-0.11) - 0.022, -0.11], [gz(-0.11) - 0.03, -0.11], [gz(-0.02) - 0.03, -0.02]], 0.03, 0.004), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Release', rbox(0.038, 0.006, 0.008, 0.002), 'steel', WPN, { position: W([0, -0.018, gz(-0.018) - 0.028]) }),
  P('Selector', rbox(0.004, 0.007, 0.022, 0.0015), 'steel', WPN, { position: W([0.0235, 0.008, -0.05]), rotation: [-20, 0, 0] }),
  ...[['white', -0.066], ['red', -0.036]].map(([m, z], i) => P('Selector Mark ' + i, rbox(0.001, 0.004, 0.004, 0), m, WPN, { position: W([0.0215, 0.016, z]), castShadow: false })),
  // ---- retractable stock
  ...[1, -1].map((s) => P(s > 0 ? 'Stock Rod L' : 'Stock Rod R', cyl(0.004, 0.004, 0.12, 12), 'steel', WPN, { position: W([s * 0.016, 0.03, -0.2]), rotation: ALONG_Z })),
  P('Butt Plate', profile([[-0.255, 0.06], [-0.272, 0.062], [-0.278, 0.05], [-0.278, -0.04], [-0.27, -0.052], [-0.255, -0.05], [-0.255, 0.02]], 0.046, 0.006), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- T charging handle (slides back along the rail)
  P('Charging Handle', rbox(0.056, 0.01, 0.014, 0.004), 'polymer', CH, { position: W(CH0) }),
  P('Charging Stem', rbox(0.008, 0.008, 0.04, 0.002), 'steel', CH, { position: W(offset(CH0, [0, 0.0, 0.02])) }),
  // ---- 40-round magazine inside the grip (its base sticks out under the grip)
  P('Magazine', profile(slant(0.004, -0.14, 0.013, 0.015), 0.022, 0.002), 'magPoly', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Baseplate', profile(slant(-0.134, -0.146, 0.017, 0.019), 0.03, 0.004), 'magPoly', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Top Round', { type: 'capsule', radius: 0.0034, length: 0.02, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.006, gz(0.006) + 0.002]), rotation: ALONG_Z }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.05, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.27]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.022, height: 0.09, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.305]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.036, -0.052, -0.108], r: [-66, 0, 2] };
const SUPPORT_L = { attach: 'weapon', p: [0.034, -0.05, 0.066], r: [-78, 0, -4] }; // round the vertical foregrip
const READY = { p: [...W0], r: [0, 5, -3] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
const down = (d) => [0, -d, -0.22 * d]; // along the grip axis
const MAG_BELOW = { p: offset(MAG_SEAT, down(0.07)), r: [0, 0, 0] };
// the left hand takes the magazine by its base, fingers wrapped round the front of it
const LH_MAG = { p: [0.03, -0.2, 0.0], r: [-100, 0, 0] };
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };
const LH_SLAP = { attach: 'weapon', p: [0.03, -0.19, -0.03], r: [-100, 0, 0] };
// left hand pinching the T handle (in the handle's frame: its head sits at CH0)
const L_T = { attach: 'charge', p: [0.05, -0.03, -0.06], r: [-50, 20, -70] };
const MAG_POSE = { p: [-0.06, -0.1, 0.42], r: [-34, -10, 42] }; // rolled so the grip base faces the eye
const CH_POSE = { p: [-0.05, -0.2, 0.44], r: [-12, 12, 26] };

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 5 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.squeeze }), k(1.5, { pose: { curl: [0.45, 0.5, 0.8, 0.85, 0.9], spread: 0 } }), k(3, { pose: HANDS.squeeze })],
  },
  Fire: {
    // one round of automatic fire; restarting it every 63 ms gives ~950 rounds a minute
    duration: 0.12, fps: 60,
    weapon: [k(0, READY), k(0.018, { p: [W0[0] + 0.002, W0[1] + 0.005, W0[2] - 0.02], r: [-2.2, 5.4, -3.4] }, 'snap'), k(0.12, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.12, { pose: HANDS.squeeze })],
    fingersL: [k(0, { pose: HANDS.squeeze })],
    toggles: { flash: [k(0, { v: 1 }), k(0.022, { v: 1 }, 'hold'), k(0.023, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    duration: 2.3, fps: 30,
    weapon: [
      k(0, READY), k(0.25, MAG_POSE), k(1.1, MAG_POSE),
      k(1.2, { p: offset(MAG_POSE.p, [0, 0.014, 0.004]), r: [-37, -10, 43] }, 'snap'), // palm slap seats it
      k(1.45, CH_POSE), k(1.75, CH_POSE),
      k(1.8, { p: offset(CH_POSE.p, [0.002, 0.004, -0.008]), r: [-10, 12, 28] }, 'snap'),
      k(2.1, READY), k(2.3, READY),
    ],
    handR: [k(0, GRIP_R), k(2.3, GRIP_R)],
    handL: [
      k(0, SUPPORT_L),
      k(0.22, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, -0.02, 0.03]) }),
      k(0.3, { attach: 'weapon', ...LH_MAG }),
      k(0.4, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, down(0.07)) }, 'out'), // strip it out of the grip
      k(0.56, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }),
      k(0.7, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
      k(0.92, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, down(0.1)) }),
      k(0.98, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, down(0.07)) }),
      k(1.06, { attach: 'weapon', ...LH_MAG }, 'in'),
      k(1.12, { ...LH_SLAP, p: offset(LH_SLAP.p, [0, -0.04, 0]) }), k(1.18, LH_SLAP, 'snap'),
      k(1.4, { ...L_T, p: offset(L_T.p, [0.02, 0.03, -0.02]) }),
      k(1.48, L_T), k(1.68, L_T), // pull the T handle back...
      k(1.74, { ...L_T, p: offset(L_T.p, [0.02, 0.04, -0.02]) }), // ...and let it fly
      k(2.05, SUPPORT_L), k(2.3, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.3, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.squeeze }), k(0.2, { pose: HANDS.relaxed }), k(0.3, { pose: HANDS.grab }), k(0.46, { pose: HANDS.grab }), k(0.6, { pose: HANDS.relaxed }), k(0.72, { pose: HANDS.grab }), k(1.08, { pose: HANDS.grab }), k(1.12, { pose: HANDS.flat }), k(1.3, { pose: HANDS.relaxed }), k(1.46, { pose: HANDS.pinch }), k(1.7, { pose: HANDS.pinch }), k(1.76, { pose: HANDS.relaxed }), k(2.05, { pose: HANDS.squeeze }), k(2.3, { pose: HANDS.squeeze })],
    props: {
      mag: [
        k(0, SEATED), k(0.3, SEATED),
        k(0.4, { attach: 'weapon', ...MAG_BELOW }, 'out'),
        k(0.44, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.05, 0]), r: [10, 0, 20] }),
        k(0.7, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
        k(0.71, HIDDEN, 'hold'), k(0.72, { ...IN_HAND }, 'hold'),
        k(0.98, IN_HAND), k(1.06, SEATED, 'in'), k(2.3, SEATED),
      ],
    },
    slides: { charge: [k(0, { v: 0 }), k(1.48, { v: 0 }), k(1.66, { v: -0.07 }), k(1.72, { v: -0.07 }), k(1.76, { v: 0 }, 'snap')] },
    events: [{ t: 0.36, name: 'magOut' }, { t: 1.06, name: 'magIn' }, { t: 1.66, name: 'charge' }, { t: 1.76, name: 'boltHome' }],
  },
  Inspect: {
    duration: 3.8, fps: 30,
    weapon: [
      k(0, READY),
      k(0.35, { p: [-0.06, -0.16, 0.3], r: [-4, -24, 8] }),
      k(0.75, { p: [0.0, -0.13, 0.34], r: [-8, -56, 14] }), // right side: ejection port
      k(1.5, { p: [0.004, -0.128, 0.345], r: [-10, -58, 16] }),
      k(2.1, { p: [0.0, -0.13, 0.34], r: [-8, 40, -26] }), // left side: selector
      k(2.9, { p: [0.004, -0.13, 0.34], r: [-10, 44, -30] }),
      k(3.3, { p: [-0.06, -0.17, 0.3], r: [4, 10, -8] }),
      k(3.6, { p: [W0[0], W0[1] - 0.005, W0[2]], r: [1, 5, -3] }),
      k(3.8, READY),
    ],
    handR: [k(0, GRIP_R), k(3.8, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(3.8, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(3.8, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.squeeze }), k(3.8, { pose: HANDS.squeeze })],
  },
};

export const MP7 = {
  id: 'mp7', name: 'MP7 PDW', W0, BORE,
  bones: [
    { name: 'charge', head: CH0 },
    { name: 'flash', head: [0, BORE, 0.27], tail: [0, BORE, 0.31] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { charge: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: MP7_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const mp7Definition = (o) => weaponDefinition(MP7, o);
export const createMP7 = () => createWeapon(MP7);
