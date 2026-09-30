// AK-47, first person: a stamped receiver under a ribbed dust cover, a gas tube under wooden
// handguards, the slant muzzle brake, a tangent rear sight, a fixed wood stock and pistol grip,
// and the famous 30-round banana magazine. Moving parts: the magazine, the charging handle on
// the right side (slides back along the receiver) and the muzzle flash.
// Actions: Idle, Fire (one round of ~600 rpm automatic fire), Reload (rock the magazine out and
// a fresh one in, then rack the charging handle), Inspect (both sides, press check).
import { P, rbox, cyl, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.07, -0.15, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.036;
const SIGHT = 0.082;
const MAG_SEAT = [0, -0.02, 0.05];
const KNOB = [-0.028, 0.044, 0.02]; // charging handle, on the right of the receiver
export const AK_POINTS = { muzzle: [0, BORE, 0.5], eject: [0.03, 0.05, 0.02], sightRear: [0, SIGHT, -0.02], sightFront: [0, SIGHT, 0.46] };

const MATERIALS = {
  steel: { color: '#2b2d2f', roughness: 0.45, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#3a3c38', roughness: 0.6, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  wood: { color: '#7a4a25', roughness: 0.4, pattern: 'walnut', patternScale: 22, patternColor: '#3f200d', sheen: 0.25 },
  woodDark: { color: '#5d3418', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#2c1508' },
  bakelite: { color: '#7a2f14', roughness: 0.5, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  rubber: { color: '#151313', roughness: 0.9 },
  dark: { color: '#070707', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'chargeRot' };
// the banana magazine's back edge at height y (it curves strongly forward towards the bottom)
const magBack = (y) => 0.02 + 1.9 * y * y - 0.1 * y;

const GUN = [
  // ---- receiver, dust cover, sights
  P('Receiver', profile([[-0.14, 0.02], [0.14, 0.02], [0.14, 0.062], [-0.14, 0.062]], 0.036, 0.008), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Dust Cover', profile([[-0.135, 0.06], [-0.1, 0.078], [0.1, 0.078], [0.135, 0.066], [0.135, 0.058], [-0.135, 0.058]], 0.036, 0.006), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.02, 0.06, 0.001), 'dark', WPN, { position: W([0.0182, 0.045, 0.03]) }),
  P('Trunnion', rbox(0.036, 0.05, 0.03, 0.006), 'steel', WPN, { position: W([0, 0.044, 0.155]) }),
  P('Rear Sight Base', rbox(0.024, 0.008, 0.04, 0.003), 'park', WPN, { position: W([0, 0.084, 0.135]) }),
  P('Rear Leaf', rbox(0.02, 0.006, 0.034, 0.002), 'park', WPN, { position: W([0, 0.09, 0.09]), rotation: [-5, 0, 0] }),
  P('Rear Notch', rbox(0.004, 0.004, 0.004, 0), 'dark', WPN, { position: W([0, 0.093, 0.076]), castShadow: false }),
  P('Front Sight Base', rbox(0.018, 0.026, 0.022, 0.004), 'park', WPN, { position: W([0, 0.058, 0.455]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', rbox(0.003, 0.028, 0.014, 0.001), 'park', WPN, { position: W([s * 0.0085, SIGHT - 0.008, 0.46]) })),
  P('Front Post', rbox(0.0024, 0.02, 0.004, 0.0006), 'park', WPN, { position: W([0, SIGHT - 0.008, 0.46]) }),
  // ---- barrel, gas tube, handguards, muzzle brake
  P('Barrel', cyl(0.0085, 0.0085, 0.44, 18), 'steel', WPN, { position: W([0, BORE, 0.34]), rotation: ALONG_Z }),
  P('Gas Block', rbox(0.024, 0.03, 0.03, 0.006), 'park', WPN, { position: W([0, BORE + 0.006, 0.4]) }),
  P('Gas Tube', cyl(0.0125, 0.0125, 0.25, 18), 'steel', WPN, { position: W([0, 0.064, 0.29]), rotation: ALONG_Z }),
  P('Upper Handguard', rbox(0.04, 0.026, 0.18, 0.012, 2), 'wood', WPN, { position: W([0, 0.056, 0.27]) }),
  P('Upper Guard Ferrule', rbox(0.038, 0.022, 0.01, 0.004), 'park', WPN, { position: W([0, 0.056, 0.36]) }),
  P('Lower Handguard', profile([[0.15, 0.03], [0.4, 0.03], [0.4, 0.004], [0.36, -0.012], [0.16, -0.012], [0.15, 0.0]], 0.042, 0.011), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Handguard Grooves', rbox(0.0435, 0.002, 0.004, 0), 'woodDark', WPN, { position: W([0, 0.0, 0.2]), modifiers: [{ type: 'array', count: 8, offsetX: 0, offsetY: 0, offsetZ: 0.02, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  P('Cleaning Rod', cyl(0.0035, 0.0035, 0.32, 10), 'steel', WPN, { position: W([0, 0.03, 0.31]), rotation: ALONG_Z }),
  P('Brake Base', cyl(0.0115, 0.0115, 0.024, 18), 'steel', WPN, { position: W([0, BORE, 0.488]), rotation: ALONG_Z }),
  P('Slant Brake', profile([[0.482, 0.03], [0.5, 0.03], [0.5, 0.044], [0.494, 0.052], [0.482, 0.042]], 0.024, 0.004), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: W([0, BORE - 0.002, 0.5015]), rotation: ALONG_Z }),
  P('Front Swivel', torus(0.008, 0.0018), 'steel', WPN, { position: W([0, -0.014, 0.4]), rotation: [0, 90, 0] }),
  // ---- trigger group, grip, safety
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'steel', WPN, { position: W([0, -0.03, 0.002]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, 0.012], [0.004, 0.012], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, 0.0], [-0.075, 0.0], [-0.105, -0.108], [-0.096, -0.126], [-0.062, -0.126], [-0.052, -0.1], [-0.046, -0.06], [-0.036, -0.03]], 0.034, 0.009), 'bakelite', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip Screw', cyl(0.003, 0.003, 0.038, 10), 'steel', WPN, { position: W([0, -0.118, -0.08]), rotation: [0, 0, 90] }),
  P('Safety Lever', rbox(0.004, 0.006, 0.09, 0.0015), 'steel', WPN, { position: W([0.019, 0.02, -0.02]) }),
  P('Magwell', rbox(0.032, 0.03, 0.05, 0.004), 'steel', WPN, { position: W([0, 0.0, 0.05]) }),
  // ---- wooden stock
  P('Stock', profile([[-0.14, 0.05], [-0.18, 0.05], [-0.3, 0.04], [-0.42, 0.03], [-0.44, 0.024], [-0.446, -0.09], [-0.44, -0.098], [-0.32, -0.062], [-0.2, -0.036], [-0.14, -0.028]], 0.036, 0.008), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Plate', profile([[-0.446, 0.026], [-0.456, 0.024], [-0.46, -0.09], [-0.454, -0.1], [-0.446, -0.092]], 0.038, 0.004), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- charging handle on the right (slides back and rotates up)
  P('Charging Arm', cyl(0.0035, 0.0035, 0.024, 10), 'steel', CH, { position: W([-0.0195, 0.044, 0.02]), rotation: [0, 0, 90] }),
  P('Charging Knob', sq(0.007, 0.009, 0.007, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB) }),
  // ---- 30-round banana magazine
  P('Magazine', profile([...[0.016, -0.03, -0.08, -0.13, -0.18, -0.23, -0.26].map((y) => [magBack(y), y]), ...[-0.26, -0.23, -0.18, -0.13, -0.08, -0.03, 0.016].map((y) => [magBack(y) + 0.042, y])], 0.024, 0.003), 'steel', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  ...[1, -1].map((s) => P(s > 0 ? 'Mag Rib L' : 'Mag Rib R', rbox(0.0022, 0.16, 0.012, 0.001), 'steel', MAG, { position: W([s * 0.0121, -0.12, magBack(-0.12) + 0.02]), rotation: [-24, 0, 0] })),
  P('Mag Floor', rbox(0.028, 0.008, 0.05, 0.003), 'steel', MAG, { position: W([0, -0.266, magBack(-0.26) + 0.021]), rotation: [-40, 0, 0] }),
  P('Top Round', { type: 'capsule', radius: 0.0055, length: 0.016, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.024, 0.048]), rotation: ALONG_Z }),
  P('Top Bullet', sq(0.005, 0.005, 0.007, 1, 1, 10), 'copper', MAG, { position: W([0, 0.024, 0.06]) }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.512]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.028, height: 0.12, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.57]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.036, -0.052, -0.108], r: [-66, 0, 2] };
const SUPPORT_L = { attach: 'weapon', p: [0.052, 0.004, 0.28], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 5, -3] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
const MAG_BELOW = { p: offset(MAG_SEAT, [0, -0.07, 0.014]), r: [4, 0, 0] };
const LH_MAG = { p: [0.03, -0.28, 0.06], r: [-92, 0, 0] };
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };
const LH_SLAP_MAG = { attach: 'weapon', p: [0.05, -0.29, 0.16], r: [0, 0, -90] };
// left hand on the charging handle knob (in the handle's frame)
const KNOB_REL = [KNOB[0], 0, 0];
const L_HOOK = { attach: 'chargeRot', p: offset(KNOB_REL, [-0.03, 0.05, -0.03]), r: [-40, 10, 60] };
const L_ABOVE = { attach: 'chargeRot', p: offset(KNOB_REL, [-0.02, 0.09, -0.03]), r: [-20, 0, 140] }; // palm raised over the handle
const L_SLAP = { attach: 'chargeRot', p: offset(KNOB_REL, [-0.02, 0.06, -0.03]), r: [-20, 0, 140] };
const HANDLE_BACK = -0.1, HANDLE_UP = -25;
const CH_POSE = { p: [0.02, -0.15, 0.4], r: [-8, -30, -20] }; // rolled: the left side and handle face the eye
const MAG_POSE = { p: [-0.07, -0.13, 0.42], r: [-30, -6, 38] };

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 5 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    // one round of automatic fire; restarting it every 75 ms gives ~800 rounds a minute
    duration: 0.16, fps: 60,
    weapon: [k(0, READY), k(0.02, { p: [W0[0] + 0.003, W0[1] + 0.008, W0[2] - 0.03], r: [-3.4, 5.6, -3.6] }, 'snap'), k(0.16, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.16, { pose: HANDS.squeeze })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.03, { pose: { curl: [0.45, 0.7, 0.74, 0.77, 0.8], spread: 0.04 } }, 'snap'), k(0.16, { pose: HANDS.wrap })],
    toggles: { flash: [k(0, { v: 1 }), k(0.025, { v: 1 }, 'hold'), k(0.026, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    // a rock-and-lock magazine change: strip the old one, fetch a new one, rock it in, slap it home
    duration: 2.1, fps: 30,
    weapon: [
      k(0, READY), k(0.3, MAG_POSE), k(1.1, MAG_POSE),
      k(1.2, { p: offset(MAG_POSE.p, [0.004, 0.012, 0]), r: [-33, -6, 41] }, 'snap'), // seated
      k(1.4, MAG_POSE), k(1.8, READY), k(2.1, READY),
    ],
    handR: [k(0, GRIP_R), k(2.1, GRIP_R)],
    handL: [
      k(0, SUPPORT_L),
      k(0.24, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.03, 0]) }),
      k(0.4, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.03, 0]) }), // thumb on the catch
      k(0.5, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.03, 0]) }, 'out'),
      k(0.66, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }),
      k(0.8, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
      k(0.98, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.06, -0.01]) }),
      k(1.04, { attach: 'weapon', ...LH_MAG }),
      k(1.14, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.05, 0]) }, 'in'),
      k(1.16, { ...LH_SLAP_MAG, p: offset(LH_SLAP_MAG.p, [0, -0.04, 0]) }), k(1.2, LH_SLAP_MAG, 'snap'),
      k(1.5, { ...LH_SLAP_MAG, p: offset(LH_SLAP_MAG.p, [0.02, -0.04, 0]) }),
      k(1.85, SUPPORT_L), k(2.1, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.1, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.24, { pose: HANDS.relaxed }), k(0.4, { pose: HANDS.grab }), k(0.66, { pose: HANDS.grab }), k(0.8, { pose: HANDS.relaxed }), k(0.9, { pose: HANDS.grab }), k(1.14, { pose: HANDS.grab }), k(1.2, { pose: HANDS.flat }), k(1.5, { pose: HANDS.flat }), k(1.85, { pose: HANDS.wrap }), k(2.1, { pose: HANDS.wrap })],
    props: {
      mag: [
        k(0, SEATED), k(0.4, SEATED),
        k(0.5, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.02, 0]) }, 'out'),
        k(0.56, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.02, -0.06, 0]), r: [10, 0, 20] }),
        k(0.8, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
        k(0.81, HIDDEN, 'hold'), k(0.82, { ...IN_HAND }, 'hold'),
        k(1.04, IN_HAND), k(1.14, SEATED, 'in'), k(2.1, SEATED),
      ],
    },
    events: [{ t: 0.5, name: 'magOut' }, { t: 1.16, name: 'magIn' }],
  },
  Inspect: {
    duration: 4.2, fps: 30,
    weapon: [
      k(0, READY),
      k(0.35, { p: [-0.07, -0.16, 0.3], r: [-4, -24, 8] }),
      k(0.75, { p: [0.0, -0.13, 0.36], r: [-8, -58, 14] }), // right side
      k(1.5, { p: [0.004, -0.128, 0.365], r: [-10, -60, 16] }),
      k(2.1, { p: [0.0, -0.13, 0.36], r: [-8, 40, -26] }), // left side: selector and handle
      k(3.1, { p: [0.004, -0.13, 0.36], r: [-10, 44, -30] }),
      k(3.6, { p: [-0.06, -0.17, 0.3], r: [4, 10, -8] }),
      k(3.95, { p: [W0[0], W0[1] - 0.005, W0[2]], r: [1, 5, -3] }),
      k(4.2, READY),
    ],
    handR: [k(0, GRIP_R), k(4.2, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(2.2, SUPPORT_L), k(2.35, L_HOOK), k(2.9, L_HOOK), k(3.1, SUPPORT_L), k(4.2, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(4.2, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(2.2, { pose: HANDS.wrap }), k(2.35, { pose: HANDS.hook }), k(2.9, { pose: HANDS.hook }), k(3.1, { pose: HANDS.wrap }), k(4.2, { pose: HANDS.wrap })],
    // press check: the handle comes back far enough to see brass
    slides: { charge: [k(0, { v: 0 }), k(2.4, { v: 0 }), k(2.55, { v: -0.03 }), k(2.8, { v: -0.03 }), k(2.88, { v: 0 }, 'snap')] },
    events: [{ t: 2.88, name: 'boltHome' }],
  },
};

export const AK47 = {
  id: 'ak47', name: 'AK-47', W0, BORE,
  bones: [
    { name: 'charge', head: KNOB },
    { name: 'chargeRot', parent: 'charge', head: KNOB, tail: [KNOB[0] - 0.04, KNOB[1], KNOB[2]] },
    { name: 'flash', head: [0, BORE, 0.512], tail: [0, BORE, 0.57] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { charge: 'z' },
  spins: { chargeRot: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: AK_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const ak47Definition = (o) => weaponDefinition(AK47, o);
export const createAK47 = () => createWeapon(AK47);
