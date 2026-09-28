// MP5-style 9mm submachine gun, first person: a stamped receiver with its raised side rib,
// the cocking tube over the barrel with a hooded front sight, a rotary drum rear sight,
// a slim handguard, three-lug barrel, polymer trigger group and grip, a retractable
// two-rod stock and a sharply curved 30-round magazine. Moving parts: the magazine, the
// charging handle (slides back and rotates up into its notch) and the muzzle flash.
// Actions: Idle, Fire (one round of 800 rpm automatic fire), Reload (lock the charging
// handle back, change the magazine, then the "HK slap" sends the bolt home), Inspect.
import { P, rbox, cyl, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.09, -0.165, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.035;
const TUBE = 0.061; // cocking tube axis over the barrel
const SIGHT = 0.086;
const MAG_SEAT = [0, 0.0, 0.05];
const KNOB = [0.044, TUBE, 0.235]; // charging handle knob, forward
export const SMG_POINTS = { muzzle: [0, BORE, 0.336], eject: [-0.022, 0.052, 0.06], sightRear: [0, SIGHT, -0.118], sightFront: [0, SIGHT, 0.29] };

const MATERIALS = {
  paint: { color: '#26282b', roughness: 0.55, metallic: 0.35, pattern: 'metal', patternScale: 2, patternStrength: 0.5 },
  steel: { color: '#303236', roughness: 0.42, metallic: 0.85, pattern: 'metal', patternScale: 3 },
  polymer: { color: '#1b1c1d', roughness: 0.75, pattern: 'leather', patternScale: 260, patternColor: '#0a0a0a', patternStrength: 0.6 },
  magSteel: { color: '#3a3c3f', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 2 },
  rubber: { color: '#121212', roughness: 0.9, pattern: 'leather', patternScale: 300 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1, pattern: 'metal', patternScale: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  dark: { color: '#070707', roughness: 0.9 },
  white: { color: '#e8e4d8', roughness: 0.6 },
  red: { color: '#c02a1e', roughness: 0.6 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'chargeRot' };
// back edge of the curved 9mm magazine at height y (it sweeps well forward at the bottom)
const magBack = (y) => 0.03 + 1.5 * y * y - 0.06 * y;

const GUN = [
  // ---- receiver, cocking tube, sights
  P('Receiver', profile([[-0.15, 0.022], [0.125, 0.022], [0.125, 0.074], [-0.14, 0.074], [-0.15, 0.064]], 0.034, 0.011), 'paint', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Rib', rbox(0.037, 0.005, 0.22, 0.002), 'paint', WPN, { position: W([0, 0.05, -0.02]) }),
  P('Ejection Port', rbox(0.002, 0.016, 0.045, 0.001), 'dark', WPN, { position: W([-0.0172, 0.052, 0.06]) }),
  P('Cocking Tube', cyl(0.0115, 0.0115, 0.18, 20), 'paint', WPN, { position: W([0, TUBE, 0.215]), rotation: ALONG_Z }),
  P('Handle Slot', rbox(0.002, 0.006, 0.11, 0.001), 'dark', WPN, { position: W([0.0116, TUBE, 0.185]) }),
  P('Handle Notch', rbox(0.002, 0.012, 0.008, 0.001), 'dark', WPN, { position: W([0.0116, TUBE + 0.006, 0.135]) }),
  P('Front Sight Base', rbox(0.012, 0.02, 0.016, 0.003), 'paint', WPN, { position: W([0, TUBE + 0.016, 0.29]) }),
  P('Front Sight Hood', torus(0.012, 0.0028, { tubularSegments: 24 }), 'paint', WPN, { position: W([0, SIGHT, 0.29]), rotation: [90, 0, 0], scale: [1, 3, 1] }),
  P('Front Sight Post', cyl(0.0014, 0.002, 0.012, 8), 'steel', WPN, { position: W([0, SIGHT - 0.006, 0.29]) }),
  P('Rear Sight Base', rbox(0.022, 0.012, 0.03, 0.003), 'paint', WPN, { position: W([0, 0.078, -0.118]) }),
  P('Rear Drum', cyl(0.0105, 0.0105, 0.024, 20), 'steel', WPN, { position: W([0, SIGHT, -0.118]), rotation: [0, 0, 90] }),
  P('Drum Aperture', cyl(0.0022, 0.0022, 0.002, 10), 'dark', WPN, { position: W([0, SIGHT, -0.129]), rotation: ALONG_Z, castShadow: false }),
  P('Drum Aperture Front', cyl(0.0022, 0.0022, 0.002, 10), 'dark', WPN, { position: W([0, SIGHT, -0.107]), rotation: ALONG_Z, castShadow: false }),
  // ---- handguard and barrel
  P('Handguard', rbox(0.044, 0.04, 0.15, 0.016, 3), 'polymer', WPN, { position: W([0, BORE - 0.003, 0.2]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Handguard Groove L' : 'Handguard Groove R', rbox(0.002, 0.003, 0.12, 0.001), 'dark', WPN, { position: W([s * 0.0215, BORE - 0.006, 0.2]) })),
  P('Barrel', cyl(0.0078, 0.0078, 0.07, 18), 'steel', WPN, { position: W([0, BORE, 0.3]), rotation: ALONG_Z }),
  P('Barrel Lugs', gearTube(0.011, 0.012, 3, 0.35), 'steel', WPN, { position: W([0, BORE, 0.31]) }),
  P('Muzzle Bore', cyl(0.0048, 0.0048, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.3355]), rotation: ALONG_Z }),
  P('Front Sling Loop', torus(0.008, 0.0018), 'steel', WPN, { position: W([0.014, TUBE, 0.28]) }),
  // ---- trigger group, grip, magwell
  P('Trigger Housing', profile([[-0.11, 0.024], [0.025, 0.024], [0.025, 0.004], [0.004, -0.014], [-0.105, -0.014], [-0.112, 0.0]], 0.03, 0.004), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.012], [-0.077, -0.012], [-0.1, -0.108], [-0.091, -0.122], [-0.056, -0.122], [-0.05, -0.1], [-0.046, -0.07], [-0.041, -0.052], [-0.036, -0.032]], 0.034, 0.009), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Trigger Guard', torus(0.019, 0.0036, { tubularSegments: 24 }), 'polymer', WPN, { position: W([0, -0.03, -0.004]), rotation: [0, 0, 90], scale: [1, 1, 1.35] }),
  P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.028], [-0.004, -0.038], [-0.008, -0.035], [-0.003, -0.025]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Selector', rbox(0.004, 0.006, 0.026, 0.0015), 'steel', WPN, { position: W([0.017, 0.006, -0.052]), rotation: [-25, 0, 0] }),
  ...[['white', -0.068], ['red', -0.042]].map(([m, z], i) => P('Selector Mark ' + i, rbox(0.001, 0.004, 0.004, 0), m, WPN, { position: W([0.0152, 0.014, z]), castShadow: false })),
  P('Magwell', rbox(0.031, 0.034, 0.044, 0.004), 'paint', WPN, { position: W([0, 0.008, 0.05]) }),
  P('Mag Paddle', rbox(0.02, 0.004, 0.016, 0.0015), 'steel', WPN, { position: W([0, -0.011, 0.022]) }),
  P('Receiver Pins', cyl(0.003, 0.003, 0.036, 10), 'steel', WPN, { position: W([0, 0.03, -0.09]), rotation: [0, 0, 90] }),
  // ---- retractable stock
  ...[1, -1].map((s) => P(s > 0 ? 'Stock Rod L' : 'Stock Rod R', cyl(0.0045, 0.0045, 0.23, 12), 'steel', WPN, { position: W([s * 0.017, 0.052, -0.265]), rotation: ALONG_Z })),
  P('Stock Cap', rbox(0.042, 0.052, 0.018, 0.006), 'polymer', WPN, { position: W([0, 0.048, -0.156]) }),
  P('Butt Plate', profile([[-0.37, 0.078], [-0.386, 0.08], [-0.394, 0.064], [-0.394, -0.048], [-0.386, -0.066], [-0.37, -0.064], [-0.37, 0.03]], 0.05, 0.006), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- charging handle (slides and rotates into its notch)
  P('Charging Handle', cyl(0.004, 0.004, 0.03, 10), 'steel', CH, { position: W([0.026, TUBE, 0.235]), rotation: [0, 0, 90] }),
  P('Charging Knob', sq(0.008, 0.009, 0.009, 0.8, 0.8, 14), 'polymer', CH, { position: W(KNOB) }),
  // ---- curved 30-round magazine
  P('Magazine', profile([...[0.016, -0.03, -0.08, -0.13, -0.18, -0.22].map((y) => [magBack(y), y]), ...[-0.22, -0.18, -0.13, -0.08, -0.03, 0.016].map((y) => [magBack(y) + 0.034, y])], 0.022, 0.003), 'magSteel', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  ...[1, -1].map((s) => P(s > 0 ? 'Mag Rib L' : 'Mag Rib R', rbox(0.002, 0.13, 0.012, 0.001), 'magSteel', MAG, { position: W([s * 0.0112, -0.1, magBack(-0.1) + 0.017]), rotation: [-17, 0, 0] })),
  P('Mag Floorplate', rbox(0.026, 0.008, 0.042, 0.003), 'magSteel', MAG, { position: W([0, -0.224, magBack(-0.22) + 0.017]), rotation: [-34, 0, 0] }),
  P('Top Round', { type: 'capsule', radius: 0.0048, length: 0.014, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0.003, 0.022, 0.044]), rotation: ALONG_Z }),
  P('Top Bullet', sq(0.0046, 0.0046, 0.006, 1, 1, 10), 'copper', MAG, { position: W([0.003, 0.022, 0.056]) }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.055, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.345]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.024, height: 0.1, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.385]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.036, -0.052, -0.108], r: [-66, 0, 2] };
const SUPPORT_L = { attach: 'weapon', p: [0.052, 0.006, 0.2], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 5, -3] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
const MAG_BELOW = { p: offset(MAG_SEAT, [0, -0.07, 0.014]), r: [4, 0, 0] };
const LH_MAG = { p: [0.03, -0.25, 0.03], r: [-92, 0, 0] };
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };
const LH_SLAP_MAG = { attach: 'weapon', p: [0.05, -0.26, 0.14], r: [0, 0, -90] };
// left hand on the charging handle knob (in the handle's frame)
const KNOB_REL = [KNOB[0], 0, 0];
const L_HOOK = { attach: 'chargeRot', p: offset(KNOB_REL, [0.04, -0.035, -0.03]), r: [-40, 10, -30] };
const L_ABOVE = { attach: 'chargeRot', p: offset(KNOB_REL, [0.03, 0.055, -0.03]), r: [-20, 0, -140] }; // palm raised over the handle
const L_SLAP = { attach: 'chargeRot', p: offset(KNOB_REL, [0.03, 0.028, -0.03]), r: [-20, 0, -140] };
const HANDLE_BACK = -0.1, HANDLE_UP = 25;
const CH_POSE = { p: [-0.08, -0.14, 0.34], r: [-10, -4, 30] }; // rolled: the left side and handle face the eye
const MAG_POSE = { p: [-0.075, -0.1, 0.37], r: [-24, -6, 50] };

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
    duration: 0.13, fps: 60,
    weapon: [k(0, READY), k(0.02, { p: [W0[0] + 0.002, W0[1] + 0.006, W0[2] - 0.024], r: [-2.6, 5.4, -3.4] }, 'snap'), k(0.13, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.13, { pose: HANDS.squeeze })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.03, { pose: { curl: [0.45, 0.7, 0.74, 0.77, 0.8], spread: 0.04 } }, 'snap'), k(0.13, { pose: HANDS.wrap })],
    toggles: { flash: [k(0, { v: 1 }), k(0.025, { v: 1 }, 'hold'), k(0.026, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    duration: 2.5, fps: 30,
    weapon: [
      k(0, READY), k(0.22, CH_POSE), k(0.4, CH_POSE),
      k(0.58, MAG_POSE), k(1.2, MAG_POSE),
      k(1.32, { p: offset(MAG_POSE.p, [0.004, 0.012, 0]), r: [-27, -6, 51] }, 'snap'), // magazine tapped home
      k(1.5, CH_POSE), k(1.62, CH_POSE),
      k(1.68, { p: offset(CH_POSE.p, [0.004, -0.012, 0.004]), r: [-7, -4, 27] }, 'snap'), // the HK slap
      k(2.2, READY), k(2.5, READY),
    ],
    handR: [k(0, GRIP_R), k(1.22, GRIP_R), k(1.25, { attach: 'weapon', p: [-0.036, -0.05, -0.104], r: [-66, 0, 2] }), k(1.32, GRIP_R), k(2.5, GRIP_R)],
    handL: [
      k(0, SUPPORT_L),
      k(0.16, { ...L_HOOK, p: offset(L_HOOK.p, [0.02, 0.02, 0.02]) }),
      k(0.22, L_HOOK), k(0.36, L_HOOK), k(0.42, L_HOOK), // pull back and lock up
      k(0.52, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }), // thumb on the paddle
      k(0.58, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }),
      k(0.66, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.02, 0]) }, 'out'),
      k(0.82, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }),
      k(0.96, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
      k(1.14, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.06, -0.01]) }),
      k(1.2, { attach: 'weapon', ...LH_MAG }),
      k(1.28, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }, 'in'),
      k(1.3, { ...LH_SLAP_MAG, p: offset(LH_SLAP_MAG.p, [0, -0.04, 0]) }), k(1.32, LH_SLAP_MAG, 'snap'),
      k(1.52, L_ABOVE), k(1.62, L_ABOVE),
      k(1.68, L_SLAP, 'snap'),
      k(1.78, { ...L_SLAP, p: offset(L_SLAP.p, [0.02, 0.04, 0]) }),
      k(2.15, SUPPORT_L), k(2.5, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(1.22, { pose: HANDS.pistolGrip }), k(1.25, { pose: { curl: [0.5, 0.35, 0.82, 0.88, 0.92], spread: 0 } }), k(1.32, { pose: HANDS.pistolGrip }), k(2.5, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.16, { pose: HANDS.relaxed }), k(0.22, { pose: HANDS.hook }), k(0.42, { pose: HANDS.hook }), k(0.5, { pose: HANDS.grab }), k(0.7, { pose: HANDS.relaxed }), k(0.9, { pose: HANDS.grab }), k(1.28, { pose: HANDS.grab }), k(1.3, { pose: HANDS.flat }), k(1.55, { pose: HANDS.flat }), k(1.8, { pose: HANDS.relaxed }), k(2.15, { pose: HANDS.wrap }), k(2.5, { pose: HANDS.wrap })],
    props: {
      mag: [
        k(0, SEATED), k(0.58, SEATED),
        k(0.66, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.02, 0]) }, 'out'),
        k(0.7, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.02, -0.06, 0]), r: [10, 0, 20] }),
        k(0.96, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
        k(0.97, HIDDEN, 'hold'), k(0.98, { ...IN_HAND }, 'hold'),
        k(1.2, IN_HAND), k(1.28, SEATED, 'in'), k(2.5, SEATED),
      ],
    },
    slides: { charge: [k(0, { v: 0 }), k(0.22, { v: 0 }), k(0.34, { v: HANDLE_BACK }), k(1.66, { v: HANDLE_BACK }), k(1.7, { v: 0 }, 'snap')] },
    spins: { chargeRot: [k(0, { v: 0 }), k(0.34, { v: 0 }), k(0.42, { v: HANDLE_UP }), k(1.64, { v: HANDLE_UP }), k(1.68, { v: 0 }, 'snap')] },
    events: [{ t: 0.4, name: 'charge' }, { t: 0.62, name: 'magOut' }, { t: 1.28, name: 'magIn' }, { t: 1.7, name: 'boltHome' }],
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

export const SMG = {
  id: 'smg', name: 'MP5 SMG', W0, BORE,
  bones: [
    { name: 'charge', head: [0, TUBE, 0.235] },
    { name: 'chargeRot', parent: 'charge', head: [0, TUBE, 0.235], tail: [0.04, TUBE, 0.235] },
    { name: 'flash', head: [0, BORE, 0.345], tail: [0, BORE, 0.39] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { charge: 'z' },
  spins: { chargeRot: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: SMG_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const smgDefinition = (o) => weaponDefinition(SMG, o);
export const createSMG = () => createWeapon(SMG);
