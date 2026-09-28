// .44 Magnum double-action revolver (S&W Model 29 style), first person, two-handed.
// Blued frame with a 6.5" ribbed barrel, adjustable rear sight and a red-insert front ramp,
// a fluted six-shot cylinder on a swing-out crane, an ejector rod and star that push the
// empties out, a hammer and trigger that move with every double-action pull, walnut target
// grips, and a speedloader. Moving parts: crane (swings out), cylinder (turns), ejector
// (slides), cartridges, hammer, trigger, latch, speedloader, muzzle and cylinder-gap flash.
// Actions: Idle, Fire (a double-action pull: the hammer rises, the cylinder turns, bang),
// Reload (open, eject all six, speedloader, close), Inspect (both sides, open, spin, flick shut).
import { P, rbox, cyl, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.07, -0.1, 0.37];
const W = (p) => offset(W0, p);
const BORE = 0.04;
const CY = BORE - 0.0125, CZ = 0.011; // cylinder axis: the top chamber lines up with the bore
const SIGHT = 0.064;
const PIVOT = [0.01, 0.006, CZ]; // crane hinge, low on the left of the frame
const LOADER_REST = [0, CY, CZ - 0.045];
export const REVOLVER_POINTS = { muzzle: [0, BORE, 0.222], eject: [0.03, CY, CZ - 0.03], sightRear: [0, SIGHT, -0.035], sightFront: [0, SIGHT, 0.214], cylinder: [0, CY, CZ] };

const MATERIALS = {
  blued: { color: '#1a1f2a', roughness: 0.22, metallic: 1, pattern: 'metal', patternScale: 3 },
  bluedDark: { color: '#111318', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 2 },
  walnut: { color: '#4f2a14', roughness: 0.36, pattern: 'walnut', patternScale: 22, patternColor: '#241006', sheen: 0.25 },
  brass: { color: '#b8914a', roughness: 0.42, metallic: 0.9, pattern: 'metal', patternScale: 1 },
  lead: { color: '#7c7d80', roughness: 0.5, metallic: 0.6 },
  bore: { color: '#050505', roughness: 0.9 },
  loader: { color: '#161616', roughness: 0.6 },
  silver: { color: '#c9ccd0', roughness: 0.2, metallic: 1 },
  redInsert: { color: '#d8261b', roughness: 0.4, emissive: '#ff3322', emissiveStrength: 0.4 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const CYL = { bone: 'cyl' };
const chamber = (i, r = 0.0125) => { const a = ((90 + i * 60) * Math.PI) / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };

const GUN = [
  // ---- frame
  P('Top Strap', rbox(0.018, 0.008, 0.07, 0.003), 'blued', WPN, { position: W([0, 0.052, CZ]) }),
  P('Frame Bottom', rbox(0.022, 0.008, 0.05, 0.003), 'blued', WPN, { position: W([0, 0.003, CZ]) }),
  P('Recoil Shield', rbox(0.03, 0.058, 0.012, 0.005), 'blued', WPN, { position: W([0, 0.027, -0.018]) }),
  P('Frame Front', rbox(0.024, 0.052, 0.012, 0.004), 'blued', WPN, { position: W([0, 0.03, 0.04]) }),
  P('Grip Frame', profile([[-0.024, 0.056], [-0.012, 0.056], [-0.012, -0.004], [-0.022, -0.02], [-0.046, -0.02], [-0.05, 0.02], [-0.036, 0.05]], 0.022, 0.004), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Side Plate Screw', cyl(0.0022, 0.0022, 0.024, 10), 'silver', WPN, { position: W([0, 0.03, -0.035]), rotation: [0, 0, 90] }),
  P('Cylinder Latch', rbox(0.004, 0.01, 0.018, 0.0015), 'bluedDark', { bone: 'latch' }, { position: W([0.0135, 0.03, -0.034]) }),
  P('Trigger Guard', torus(0.017, 0.0032, { tubularSegments: 24 }), 'blued', WPN, { position: W([0, -0.013, 0.004]), rotation: [0, 0, 90], scale: [1, 1, 1.3] }),
  P('Trigger', profile([[-0.002, -0.004], [0.006, -0.004], [0.004, -0.02], [-0.004, -0.03], [-0.008, -0.027], [-0.003, -0.017]], 0.008, 0.0015), 'blued', { bone: 'trigger' }, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Hammer', profile([[-0.028, 0.034], [-0.021, 0.036], [-0.03, 0.062], [-0.042, 0.068], [-0.046, 0.064], [-0.036, 0.056]], 0.008, 0.0015), 'blued', { bone: 'hammer' }, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- sights
  P('Rear Sight Base', rbox(0.016, 0.005, 0.02, 0.0015), 'blued', WPN, { position: W([0, 0.0585, -0.03]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Rear Blade L' : 'Rear Blade R', rbox(0.0055, 0.006, 0.005, 0.0008), 'bluedDark', WPN, { position: W([s * 0.0045, 0.063, -0.036]) })),
  P('Front Ramp', profile([[0.196, 0.054], [0.222, 0.054], [0.219, 0.067], [0.211, 0.067]], 0.004, 0.0008), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Red Insert', rbox(0.0042, 0.005, 0.004, 0), 'redInsert', WPN, { position: W([0, 0.0635, 0.215]), castShadow: false }),
  // ---- barrel, rib and ejector lug
  P('Barrel', cyl(0.0108, 0.0108, 0.168, 22), 'blued', WPN, { position: W([0, BORE, 0.13]), rotation: ALONG_Z }),
  P('Barrel Rib', rbox(0.011, 0.007, 0.168, 0.002), 'blued', WPN, { position: W([0, 0.0515, 0.13]) }),
  P('Ejector Lug', rbox(0.011, 0.012, 0.028, 0.003), 'blued', WPN, { position: W([0, CY - 0.002, 0.09]) }),
  P('Muzzle Crown', cyl(0.0048, 0.0048, 0.003, 14), 'bore', WPN, { position: W([0, BORE, 0.2145]), rotation: ALONG_Z }),
  P('Barrel Stamp', rbox(0.0004, 0.004, 0.06, 0), 'silver', WPN, { position: W([0.011, BORE, 0.12]), castShadow: false }),
  // ---- walnut target grips with a silver medallion
  P('Grips', profile([[-0.022, 0.0], [-0.049, 0.0], [-0.066, -0.06], [-0.074, -0.105], [-0.066, -0.118], [-0.036, -0.118], [-0.03, -0.1], [-0.026, -0.06], [-0.02, -0.03], [-0.017, -0.012]], 0.034, 0.009), 'walnut', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  ...[1, -1].map((s) => P(s > 0 ? 'Medallion L' : 'Medallion R', cyl(0.005, 0.005, 0.002, 16), 'silver', WPN, { position: W([s * 0.0172, -0.02, -0.036]), rotation: [0, 0, 90] })),
  // ---- crane, cylinder, ejector and cartridges (nested moving parts)
  P('Crane', rbox(0.012, 0.022, 0.006, 0.002), 'blued', { bone: 'crane' }, { position: W([0.005, 0.016, CZ + 0.025]) }),
  P('Cylinder', cyl(0.0205, 0.0205, 0.044, 30), 'blued', CYL, { position: W([0, CY, CZ]), rotation: ALONG_Z }),
  P('Cylinder Rear Face', cyl(0.0195, 0.0195, 0.001, 30), 'bluedDark', CYL, { position: W([0, CY, CZ - 0.0222]), rotation: ALONG_Z, castShadow: false }),
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
    const [cx, cy] = chamber(i), [fx, fy] = chamber(i + 0.5, 0.0203);
    return [
      P('Chamber ' + i, cyl(0.0056, 0.0056, 0.002, 12), 'bore', CYL, { position: W([cx, CY + cy, CZ + 0.0222]), rotation: ALONG_Z, castShadow: false }),
      P('Chamber Rear ' + i, cyl(0.0059, 0.0059, 0.0012, 12), 'bore', CYL, { position: W([cx, CY + cy, CZ - 0.0229]), rotation: ALONG_Z, castShadow: false }),
      P('Flute ' + i, rbox(0.004, 0.004, 0.028, 0.0015), 'bluedDark', CYL, { position: W([fx, CY + fy, CZ + 0.004]), rotation: [0, 0, 90 + (i + 0.5) * 60] }),
    ];
  }),
  P('Ejector Rod', cyl(0.0036, 0.0036, 0.067, 12), 'blued', { bone: 'ejector' }, { position: W([0, CY, 0.0665]), rotation: ALONG_Z }),
  P('Ejector Tip', gearTube(0.0045, 0.008, 12, 0.15), 'blued', { bone: 'ejector' }, { position: W([0, CY, 0.097]) }),
  P('Ejector Star', { type: 'extrude', shape: 'star', points: 6, inner: 0.55, radius: 0.0135, teeth: 12, toothDepth: 0.12, depth: 0.003, bevel: 0 }, 'bluedDark', { bone: 'ejector' }, { position: W([0, CY, CZ - 0.0235]), rotation: [0, 0, 30] }),
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
    const [cx, cy] = chamber(i);
    return [
      P('Case ' + i, cyl(0.0058, 0.0058, 0.03, 12), 'brass', { bone: 'rounds' }, { position: W([cx, CY + cy, CZ - 0.008]), rotation: ALONG_Z }),
      P('Case Rim ' + i, cyl(0.0066, 0.0066, 0.0015, 12), 'brass', { bone: 'rounds' }, { position: W([cx, CY + cy, CZ - 0.0232]), rotation: ALONG_Z }),
    ];
  }),
  // ---- speedloader with six fresh rounds
  P('Speedloader Body', cyl(0.02, 0.019, 0.012, 24), 'loader', { bone: 'loader' }, { position: W(LOADER_REST), rotation: ALONG_Z }),
  P('Speedloader Knob', gearTube(0.008, 0.016, 16, 0.12), 'loader', { bone: 'loader' }, { position: W(offset(LOADER_REST, [0, 0, -0.014])) }),
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
    const [cx, cy] = chamber(i);
    return [
      P('Loader Case ' + i, cyl(0.0058, 0.0058, 0.03, 10), 'brass', { bone: 'loaderRounds' }, { position: W(offset(LOADER_REST, [cx, cy, 0.021])) , rotation: ALONG_Z }),
      P('Loader Bullet ' + i, { type: 'capsule', radius: 0.0052, length: 0.006, radialSegments: 10, capSegments: 3 }, 'lead', { bone: 'loaderRounds' }, { position: W(offset(LOADER_REST, [cx, cy, 0.039])), rotation: ALONG_Z }),
    ];
  }),
  // ---- muzzle flash, plus the flare that spits from the cylinder gap
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 7, inner: 0.35, radius: 0.08, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.235]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.035, height: 0.14, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.29]), rotation: [90, 0, 0], castShadow: false }),
  ...[1, -1].map((s) => P(s > 0 ? 'Gap Flash L' : 'Gap Flash R', { type: 'extrude', shape: 'star', points: 5, inner: 0.4, radius: 0.02, teeth: 12, toothDepth: 0.12, depth: 0.003, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([s * 0.022, BORE, 0.036]), rotation: [0, 90, 0], castShadow: false })),
];

// ---------------------------------------------------------------- choreography
// palms flat on either grip panel; the support fingers wrap over the gun hand's fingers
const GRIP_R = { attach: 'weapon', p: [-0.026, -0.044, -0.092], r: [-66, 0, 0] };
const SUPPORT_L = { attach: 'weapon', p: [0.027, -0.062, -0.09], r: [-62, 0, 0] };
const READY = { p: [...W0], r: [0, 4, -4] };
const OPEN = { p: [-0.03, -0.13, 0.33], r: [-8, -6, 34] };
const UP = { p: [-0.02, -0.08, 0.3], r: [-62, -4, 20] };
const DOWN = { p: [-0.035, -0.125, 0.34], r: [42, -6, 24] };
const OUT = -90; // crane swung fully out
const L_FRAME = { attach: 'weapon', p: [0.034, -0.04, -0.005], r: [-40, 0, -40] }; // left hand cradling the frame
// the right hand holding the speedloader behind the open cylinder (cylinder frame)
const R_LOAD = { attach: 'cyl', p: [-0.022, 0.0, -0.118], r: [-90, 0, 0] };
const LOADER_AT = { p: [0, 0, -0.07], r: [0, 0, 0] }; // aligned behind the chambers, in the cylinder frame
const IN_HAND = { attach: 'hand.R', ...inFrame(R_LOAD, LOADER_AT) };
const PALM_ROD = { attach: 'ejector', p: [-0.003, 0.047, 0.107], r: [0, 90, 0] }; // palm on the ejector tip

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.8 * Math.sin(2 * a), 3 + 0.9 * Math.sin(a), -2 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.revolverGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(1.5, { pose: { curl: [0.4, 0.64, 0.7, 0.74, 0.78], spread: 0.05 } }), k(3, { pose: HANDS.pistolWrap })],
  },
  Fire: {
    // a double-action pull: the trigger draws the hammer back and turns the cylinder, then it falls
    duration: 0.6, fps: 60,
    weapon: [k(0, READY), k(0.065, READY), k(0.1, { p: offset(W0, [0.002, 0.03, -0.04]), r: [-24, 5, -4] }, 'snap'), k(0.35, { p: offset(W0, [0, 0.004, 0.004]), r: [-2, 3, -2] }), k(0.6, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.revolverGrip }), k(0.06, { pose: HANDS.squeeze }), k(0.25, { pose: HANDS.revolverGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(0.1, { pose: { curl: [0.45, 0.72, 0.76, 0.8, 0.82], spread: 0.03 } }, 'snap'), k(0.4, { pose: HANDS.pistolWrap })],
    spins: {
      trigger: [k(0, { v: 0 }), k(0.06, { v: 18 }), k(0.2, { v: 18 }), k(0.32, { v: 0 })],
      hammer: [k(0, { v: 0 }), k(0.06, { v: -40 }), k(0.065, { v: 0 }, 'snap')],
      cyl: [k(0, { v: 0 }), k(0.06, { v: 60 })],
    },
    toggles: { flash: [k(0, { v: 0 }), k(0.064, { v: 0 }, 'hold'), k(0.065, { v: 1 }, 'hold'), k(0.105, { v: 1 }, 'hold'), k(0.106, { v: 0 }, 'hold')] },
    events: [{ t: 0.065, name: 'shot' }],
  },
  Reload: {
    duration: 3.0, fps: 30,
    weapon: [k(0, READY), k(0.25, OPEN), k(0.45, OPEN), k(0.65, UP), k(0.9, UP), k(1.3, DOWN), k(2.05, DOWN), k(2.3, OPEN), k(2.36, { p: offset(OPEN.p, [0, 0.004, 0]), r: [-10, -6, 30] }, 'snap'), k(2.8, READY), k(3.0, READY)],
    handR: [
      k(0, GRIP_R), k(0.18, GRIP_R),
      k(0.21, { attach: 'weapon', p: [-0.024, -0.04, -0.09], r: [-66, 0, 0] }), // thumb on the latch
      k(0.5, GRIP_R),
      k(0.68, { attach: 'ejector', p: [-0.003, 0.08, 0.14], r: [0, 90, 0] }),
      k(0.74, PALM_ROD), k(0.8, { ...PALM_ROD, p: offset(PALM_ROD.p, [0, 0, -0.024]) }, 'snap'), // slap the ejector
      k(0.9, { attach: 'weapon', p: [-0.1, 0.08, 0.1], r: [0, 90, 0] }),
      k(1.12, { attach: 'world', p: [-0.22, -0.62, 0.18], r: [-60, -20, 30] }), // speedloader pouch
      k(1.22, { attach: 'world', p: [-0.22, -0.63, 0.18], r: [-60, -20, 30] }),
      k(1.55, { ...R_LOAD, p: offset(R_LOAD.p, [0, 0, -0.03]) }),
      k(1.72, { ...R_LOAD, p: offset(R_LOAD.p, [0, 0, 0.012]) }, 'in'), // rounds into the chambers
      k(1.85, { ...R_LOAD, p: offset(R_LOAD.p, [0, 0, 0.012]), r: [-90, 0, -30] }), // twist to release
      k(2.0, { attach: 'weapon', p: [-0.07, -0.02, -0.12], r: [-60, 0, 20] }),
      k(2.35, GRIP_R), k(3.0, GRIP_R),
    ],
    handL: [k(0, SUPPORT_L), k(0.3, L_FRAME), k(2.25, L_FRAME), k(2.36, { ...L_FRAME, p: offset(L_FRAME.p, [0.005, 0.01, 0]) }, 'snap'), k(2.75, SUPPORT_L), k(3.0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.revolverGrip }), k(0.5, { pose: HANDS.revolverGrip }), k(0.66, { pose: HANDS.flat }), k(0.9, { pose: HANDS.flat }), k(1.12, { pose: HANDS.relaxed }), k(1.22, { pose: HANDS.pinch }), k(1.9, { pose: HANDS.pinch }), k(2.05, { pose: HANDS.relaxed }), k(2.35, { pose: HANDS.revolverGrip }), k(3.0, { pose: HANDS.revolverGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(0.3, { pose: HANDS.cup }), k(2.2, { pose: HANDS.cup }), k(2.4, { pose: HANDS.push }), k(2.75, { pose: HANDS.pistolWrap }), k(3.0, { pose: HANDS.pistolWrap })],
    props: {
      loader: [
        k(0, HIDDEN), k(1.21, HIDDEN), k(1.22, IN_HAND, 'hold'),
        k(1.55, { attach: 'cyl', ...LOADER_AT }), // IN_HAND and the cylinder frame agree here
        k(1.72, { attach: 'cyl', p: [0, 0, -0.029], r: [0, 0, 0] }, 'in'),
        k(1.85, { attach: 'cyl', p: [0, 0, -0.029], r: [0, 0, -30] }),
        k(2.0, { attach: 'hand.R', ...inFrame(R_LOAD, { p: [0, 0, -0.029], r: [0, 0, -30] }) }),
        k(2.02, { attach: 'hand.R', ...inFrame(R_LOAD, { p: [0, 0, -0.029], r: [0, 0, -30] }) }),
        k(2.3, { attach: 'world', p: [-0.2, -1.1, 0.35], r: [80, 40, 120] }, 'in'), // dropped
        k(2.31, HIDDEN, 'hold'), k(3.0, HIDDEN),
      ],
    },
    slides: {
      latch: [k(0, { v: 0 }), k(0.18, { v: 0 }), k(0.22, { v: 0.004 }), k(0.4, { v: 0.004 }), k(0.45, { v: 0 })],
      ejector: [k(0, { v: 0 }), k(0.74, { v: 0 }), k(0.8, { v: -0.024 }, 'snap'), k(0.95, { v: 0 })],
    },
    spins: { crane: [k(0, { v: 0 }), k(0.28, { v: 0 }), k(0.42, { v: OUT }, 'snap'), k(2.25, { v: OUT }), k(2.36, { v: 0 }, 'snap')] },
    toggles: {
      rounds: [k(0, { v: 1 }), k(0.83, { v: 1 }, 'hold'), k(0.84, { v: 0 }, 'hold'), k(1.84, { v: 0 }, 'hold'), k(1.85, { v: 1 }, 'hold')],
      loaderRounds: [k(0, { v: 1 }), k(1.84, { v: 1 }, 'hold'), k(1.85, { v: 0 }, 'hold'), k(2.9, { v: 0 }, 'hold'), k(2.95, { v: 1 }, 'hold')],
    },
    events: [{ t: 0.3, name: 'open' }, { t: 0.8, name: 'eject6' }, { t: 1.72, name: 'magIn' }, { t: 2.36, name: 'close' }],
  },
  Inspect: {
    duration: 4.4, fps: 30,
    weapon: [
      k(0, READY),
      k(0.4, { p: [0.0, -0.12, 0.33], r: [-6, -50, 10] }), // right side
      k(1.2, { p: [0.004, -0.118, 0.335], r: [-8, -52, 12] }),
      k(1.7, { p: [-0.02, -0.12, 0.32], r: [-10, 30, 30] }), // left side, cylinder up
      k(3.05, { p: [-0.02, -0.12, 0.32], r: [-12, 32, 32] }),
      k(3.15, { p: [-0.03, -0.125, 0.33], r: [-4, 10, -18] }, 'snap'), // wrist flick shuts the cylinder
      k(3.8, { p: offset(W0, [0, -0.005, 0]), r: [1, 3, -2] }),
      k(4.4, READY),
    ],
    handR: [k(0, GRIP_R), k(1.75, GRIP_R), k(1.8, { attach: 'weapon', p: [-0.024, -0.04, -0.09], r: [-66, 0, 0] }), k(1.95, GRIP_R), k(4.4, GRIP_R)],
    handL: [
      k(0, SUPPORT_L), k(1.8, SUPPORT_L),
      k(2.05, { attach: 'crane', p: [0.06, -0.02, 0.0], r: [0, 0, -100] }),
      k(2.25, { attach: 'crane', p: [0.058, -0.03, 0.0], r: [0, 0, -100] }), // fingers flick the cylinder round
      k(2.45, { attach: 'crane', p: [0.06, -0.02, 0.0], r: [0, 0, -100] }),
      k(2.8, L_FRAME), k(3.4, L_FRAME), k(3.9, SUPPORT_L), k(4.4, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.revolverGrip }), k(4.4, { pose: HANDS.revolverGrip })],
    fingersL: [k(0, { pose: HANDS.pistolWrap }), k(1.8, { pose: HANDS.pistolWrap }), k(2.05, { pose: HANDS.relaxed }), k(2.25, { pose: HANDS.flat }, 'snap'), k(2.5, { pose: HANDS.relaxed }), k(2.8, { pose: HANDS.cup }), k(3.4, { pose: HANDS.cup }), k(3.9, { pose: HANDS.pistolWrap }), k(4.4, { pose: HANDS.pistolWrap })],
    slides: { latch: [k(0, { v: 0 }), k(1.78, { v: 0 }), k(1.82, { v: 0.004 }), k(1.95, { v: 0 })] },
    spins: {
      crane: [k(0, { v: 0 }), k(1.84, { v: 0 }), k(1.98, { v: OUT }, 'snap'), k(3.08, { v: OUT }), k(3.14, { v: 0 }, 'snap')],
      cyl: [k(0, { v: 0 }), k(2.2, { v: 0 }), k(2.3, { v: 150 }, 'snap'), k(2.9, { v: 720 }, 'out')],
    },
    events: [{ t: 1.95, name: 'open' }, { t: 2.3, name: 'click' }, { t: 2.6, name: 'click' }, { t: 3.14, name: 'close' }],
  },
};

export const REVOLVER = {
  id: 'revolver', name: '.44 Magnum Revolver', W0, BORE,
  rightShoulder: [0, 0, 0.02], // arms out in front: no rifle stock pulling the shoulder back
  poleR: [-1.4, -1.2, -0.1], poleL: [1.2, -1.2, -0.1],
  bones: [
    { name: 'crane', head: PIVOT },
    { name: 'cyl', parent: 'crane', head: [0, CY, CZ], tail: [0, CY, CZ + 0.05] },
    { name: 'ejector', parent: 'cyl', head: [0, CY, CZ], tail: [0, CY, CZ + 0.05] },
    { name: 'rounds', parent: 'ejector', head: [0, CY, CZ], tail: [0, CY, CZ + 0.03] },
    { name: 'hammer', head: [0, 0.038, -0.03] },
    { name: 'trigger', head: [0, -0.004, 0.004] },
    { name: 'latch', head: [0.0135, 0.03, -0.034] },
    { name: 'loaderRounds', parent: 'loader', head: LOADER_REST },
    { name: 'flash', head: [0, BORE, 0.235], tail: [0, BORE, 0.28] },
  ],
  props: { loader: LOADER_REST },
  propsDefault: { loader: HIDDEN },
  slides: { latch: 'z', ejector: 'z' },
  spins: { crane: 'z', cyl: 'z', hammer: 'x', trigger: 'x' },
  toggles: ['flash', 'rounds', 'loaderRounds'],
  toggleDefault: { flash: 0, rounds: 1, loaderRounds: 1 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: REVOLVER_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const revolverDefinition = (o) => weaponDefinition(REVOLVER, o);
export const createRevolver = () => createWeapon(REVOLVER);
void sph;
