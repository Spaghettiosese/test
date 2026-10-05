// K-7 Scout bolt-action rifle, first person: a walnut sporter stock with a cheek rest and a pistol
// grip, a medium barrel with a crowned muzzle, a compact scout scope with knurled turrets and a
// five-round box magazine. Moving parts: the bolt (lifts on its own axis, then runs back and
// forward), the magazine, the elevation turret and the muzzle flash.
// Actions: Idle, Fire (shot, then work the bolt), Reload, Inspect.
import { P, rbox, cyl, sph, sq, tube, lathe, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.1, -0.225, 0.31];
const W = (p) => offset(W0, p);
const BORE = 0.03;
const SIGHT = 0.1; // scope axis height
const MAG_SEAT = [0, -0.03, 0.045];
const KNOB = [-0.056, BORE - 0.036, -0.117]; // bolt knob, bolt closed
export const SCOUT_POINTS = { muzzle: [0, BORE, 0.62], eject: [-0.024, BORE + 0.01, -0.01], sightRear: [0, SIGHT, -0.2], sightFront: [0, SIGHT, 0.28] };

const MATERIALS = {
  stock: { color: '#7a4a25', roughness: 0.4, pattern: 'walnut', patternScale: 22, patternColor: '#3f200d', sheen: 0.25 },
  stockDark: { color: '#5a3217', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#2a1307' },
  blued: { color: '#262729', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 3 },
  barrel: { color: '#2f3032', roughness: 0.45, metallic: 0.85, pattern: 'metal', patternScale: 2 },
  boltSteel: { color: '#a4a6a8', roughness: 0.2, metallic: 1, pattern: 'metal', patternScale: 5 },
  scope: { color: '#1c1d1e', roughness: 0.55, metallic: 0.3, pattern: 'metal', patternScale: 2 },
  knurl: { color: '#252627', roughness: 0.5, metallic: 0.5 },
  rubber: { color: '#121212', roughness: 0.9, pattern: 'leather', patternScale: 300 },
  lens: { color: '#3a6a8a', roughness: 0.02, metallic: 0.6, opacity: 0.55 },
  engraving: { color: '#d8d4c6', roughness: 0.6 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1, pattern: 'metal', patternScale: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const BOLT = { bone: 'bolt' };
const LIFTB = { bone: 'boltLift' };
const MAG = { bone: 'mag' };
const port = () => rbox(0.002, 0.018, 0.011, 0.0008);

const RIFLE = [
  // ---- stock (olive thumbhole)
  P('Forend', profile([[0.085, 0.014], [0.44, 0.014], [0.458, 0.004], [0.458, -0.022], [0.44, -0.036], [0.11, -0.036], [0.085, -0.03]], 0.054, 0.009), 'stock', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Forend Grooves', rbox(0.056, 0.004, 0.2, 0.001), 'stockDark', WPN, { position: W([0, -0.018, 0.29]) }),
  P('Action Bed', profile([[-0.135, 0.024], [0.09, 0.024], [0.09, -0.036], [-0.02, -0.036], [-0.035, -0.03], [-0.135, -0.03]], 0.056, 0.006), 'stock', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Grip', profile([[-0.035, -0.03], [-0.09, -0.03], [-0.113, -0.122], [-0.103, -0.138], [-0.062, -0.138], [-0.056, -0.118], [-0.052, -0.094], [-0.046, -0.074], [-0.042, -0.05]], 0.036, 0.009), 'stock', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Comb', profile([[-0.13, 0.024], [-0.2, 0.036], [-0.43, 0.036], [-0.44, 0.026], [-0.44, -0.022], [-0.2, -0.032], [-0.13, -0.03]], 0.044, 0.008), 'stock', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Lower Strut', profile([[-0.1, -0.138], [-0.42, -0.104], [-0.44, -0.104], [-0.44, -0.07], [-0.4, -0.07], [-0.13, -0.104], [-0.105, -0.112]], 0.04, 0.007), 'stock', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Cheek Piece', rbox(0.04, 0.022, 0.17, 0.008), 'stockDark', WPN, { position: W([0, 0.05, -0.33]) }),
  ...[-0.29, -0.37].map((z) => P('Cheek Post ' + z, cyl(0.004, 0.004, 0.022, 10), 'blued', WPN, { position: W([0, 0.036, z]) })),
  P('Cheek Knob', cyl(0.009, 0.009, 0.008, 14), 'rubber', WPN, { position: W([0.026, 0.03, -0.33]), rotation: [0, 0, 90] }),
  P('Butt Plate', profile([[-0.44, 0.034], [-0.462, 0.034], [-0.466, 0.02], [-0.466, -0.098], [-0.46, -0.11], [-0.44, -0.11]], 0.046, 0.005), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  ...[-0.444, -0.452].map((z) => P('Butt Spacer ' + z, rbox(0.047, 0.14, 0.003, 0.001), 'stockDark', WPN, { position: W([0, -0.037, z]) })),
  P('Trigger Guard', torus(0.018, 0.0032, { tubularSegments: 24 }), 'blued', WPN, { position: W([0, -0.052, -0.012]), rotation: [0, 0, 90], scale: [1, 1, 1.35] }),
  P('Trigger', profile([[-0.006, -0.03], [0.001, -0.03], [-0.002, -0.048], [-0.009, -0.058], [-0.012, -0.055], [-0.006, -0.045]], 0.005, 0.0012), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Safety', rbox(0.004, 0.01, 0.018, 0.0015), 'blued', WPN, { position: W([-0.029, 0.012, -0.12]) }),
  P('Mag Catch', rbox(0.02, 0.012, 0.008, 0.003), 'blued', WPN, { position: W([0, -0.042, 0.096]) }),
  ...[[-0.41, -0.09], [0.43, -0.034]].map(([z, y]) => P('Sling Stud ' + z, torus(0.008, 0.002), 'blued', WPN, { position: W([0, y - 0.006, z]), rotation: [0, 90, 0] })),
  // ---- receiver and bolt
  P('Receiver', cyl(0.0178, 0.0178, 0.215, 24), 'blued', WPN, { position: W([0, BORE, -0.0075]), rotation: ALONG_Z }),
  P('Receiver Flat', rbox(0.03, 0.012, 0.21, 0.003), 'blued', WPN, { position: W([0, BORE - 0.012, -0.0075]) }),
  P('Ejection Port', rbox(0.002, 0.014, 0.07, 0.001), 'rubber', WPN, { position: W([-0.0176, BORE + 0.006, -0.01]) }),
  P('Scope Rail', rbox(0.021, 0.008, 0.25, 0.002), 'blued', WPN, { position: W([0, 0.052, -0.01]) }),
  P('Rail Teeth', rbox(0.021, 0.004, 0.006, 0), 'blued', WPN, { position: W([0, 0.058, -0.125]), modifiers: [{ type: 'array', count: 24, offsetX: 0, offsetY: 0, offsetZ: 0.01, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  P('Bolt Shroud', lathe([[0.0135, -0.025], [0.0135, 0.012], [0.01, 0.025]], 20), 'blued', BOLT, { position: W([0, BORE, -0.14]), rotation: ALONG_Z }),
  P('Cocking Indicator', cyl(0.004, 0.004, 0.012, 10), 'engraving', BOLT, { position: W([0, BORE, -0.17]), rotation: ALONG_Z }),
  P('Bolt Body', cyl(0.0105, 0.0105, 0.13, 20), 'boltSteel', LIFTB, { position: W([0, BORE, -0.07]), rotation: ALONG_Z }),
  P('Bolt Handle', tube([[-0.006, BORE, -0.108], [-0.03, BORE - 0.006, -0.11], [-0.048, BORE - 0.026, -0.115], [KNOB[0] + 0.003, KNOB[1] + 0.006, KNOB[2]]], [0.0048, 0.0042], { samples: 6 }), 'blued', LIFTB, { position: W([0, 0, 0]) }),
  P('Bolt Knob', sq(0.011, 0.012, 0.011, 0.7, 0.6, 18), 'rubber', LIFTB, { position: W(KNOB) }),
  // ---- barrel and brake
  P('Barrel Shank', cyl(0.0138, 0.0138, 0.1, 22), 'barrel', WPN, { position: W([0, BORE, 0.15]), rotation: ALONG_Z }),
  P('Barrel', cyl(0.0125, 0.0125, 0.34, 22), 'barrel', WPN, { position: W([0, BORE, 0.32]), rotation: ALONG_Z }),
  P('Barrel Taper', cyl(0.0095, 0.0125, 0.12, 20), 'barrel', WPN, { position: W([0, BORE, 0.54]), rotation: ALONG_Z }),
  P('Muzzle Crown', cyl(0.0125, 0.0105, 0.012, 20), 'blued', WPN, { position: W([0, BORE, 0.604]), rotation: ALONG_Z }),
  P('Muzzle Bore', cyl(0.0058, 0.0058, 0.004, 14), 'rubber', WPN, { position: W([0, BORE, 0.611]), rotation: ALONG_Z }),
  // ---- iron sights: a ramp front sight and a folding rear leaf
  P('Front Ramp', rbox(0.012, 0.016, 0.03, 0.004), 'blued', WPN, { position: W([0, BORE + 0.02, 0.56]) }),
  P('Front Post', rbox(0.003, 0.014, 0.004, 0.0006), 'blued', WPN, { position: W([0, BORE + 0.036, 0.57]) }),
  P('Rear Leaf', rbox(0.022, 0.01, 0.014, 0.003), 'blued', WPN, { position: W([0, BORE + 0.024, 0.2]) }),
  // ---- scout scope (short, forward-mounted)
  ...[-0.06, 0.09].flatMap((z) => [
    P('Ring Base ' + z, rbox(0.024, 0.03, 0.018, 0.004), 'scope', WPN, { position: W([0, 0.071, z]) }),
    P('Ring ' + z, torus(0.0172, 0.0035, { tubularSegments: 28 }), 'scope', WPN, { position: W([0, SIGHT, z]), rotation: [90, 0, 0], scale: [1, 3.6, 1] }),
  ]),
  P('Scope Tube', cyl(0.014, 0.014, 0.22, 28), 'scope', WPN, { position: W([0, SIGHT, 0.04]), rotation: ALONG_Z }),
  P('Ocular Bell', lathe([[0.0205, -0.045], [0.0215, -0.02], [0.0185, 0.004], [0.015, 0.045]], 28), 'scope', WPN, { position: W([0, SIGHT, -0.155]), rotation: ALONG_Z }),
  P('Eyepiece', torus(0.0195, 0.0035, { tubularSegments: 28 }), 'rubber', WPN, { position: W([0, SIGHT, -0.2]), rotation: [90, 0, 0] }),
  P('Power Ring', gearTube(0.0185, 0.02, 30, 0.07), 'knurl', WPN, { position: W([0, SIGHT, -0.095]) }),
  P('Turret Saddle', rbox(0.037, 0.036, 0.062, 0.012), 'scope', WPN, { position: W([0, SIGHT, 0.015]) }),
  P('Windage Turret', gearTube(0.0118, 0.02, 24, 0.08), 'knurl', WPN, { position: W([-0.028, SIGHT, 0.015]), rotation: [0, 90, 0] }),
  P('Parallax Knob', gearTube(0.0145, 0.014, 28, 0.06), 'knurl', WPN, { position: W([0.025, SIGHT, 0.015]), rotation: [0, 90, 0] }),
  P('Elevation Turret', gearTube(0.0128, 0.024, 24, 0.08), 'knurl', { bone: 'turret' }, { position: W([0, SIGHT + 0.03, 0.015]), rotation: [-90, 0, 0] }),
  P('Turret Cap', cyl(0.0125, 0.0125, 0.003, 24), 'scope', { bone: 'turret' }, { position: W([0, SIGHT + 0.0435, 0.015]) }),
  P('Turret Index', rbox(0.002, 0.0015, 0.011, 0), 'engraving', { bone: 'turret' }, { position: W([0, SIGHT + 0.0452, 0.02]) }),
  P('Objective Bell', lathe([[0.015, -0.06], [0.0175, -0.04], [0.026, 0.0], [0.028, 0.035], [0.028, 0.06]], 32), 'scope', WPN, { position: W([0, SIGHT, 0.22]), rotation: ALONG_Z }),
  P('Objective Lens', cyl(0.0255, 0.0255, 0.002, 28), 'lens', WPN, { position: W([0, SIGHT, 0.276]), rotation: ALONG_Z, castShadow: false }),
  P('Ocular Lens', cyl(0.0175, 0.0175, 0.002, 28), 'lens', WPN, { position: W([0, SIGHT, -0.198]), rotation: ALONG_Z, castShadow: false }),
  // ---- magazine (5 rounds of .338)
  P('Magazine', profile([[0.004, -0.02], [0.088, -0.02], [0.088, -0.078], [0.084, -0.086], [0.008, -0.086], [0.004, -0.078]], 0.03, 0.003), 'blued', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Floorplate', rbox(0.034, 0.008, 0.09, 0.003), 'stockDark', MAG, { position: W([0, -0.088, 0.046]) }),
  P('Mag Round', { type: 'capsule', radius: 0.0072, length: 0.064, radialSegments: 12, capSegments: 3 }, 'brass', MAG, { position: W([0.003, -0.012, 0.038]), rotation: ALONG_Z }),
  P('Mag Bullet', { type: 'cone', radius: 0.0055, height: 0.03, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'copper', MAG, { position: W([0.003, -0.012, 0.085]), rotation: ALONG_Z }),
  // ---- muzzle flash (toggled): a brake throws it sideways
  P('Flash Core', { type: 'cone', radius: 0.03, height: 0.14, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.7]), rotation: [90, 0, 0], castShadow: false }),
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.075, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.63]), castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.038, -0.064, -0.122], r: [-72, 0, 2] };
const SUPPORT_L = { attach: 'weapon', p: [0.057, -0.042, 0.29], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 4, -3] };
const BOLT_POSE = { p: [-0.075, -0.15, 0.42], r: [-5, 12, -24] };
const BOLT_POSE2 = { p: [-0.075, -0.152, 0.42], r: [-4, 12, -22] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
// right hand around the bolt knob (in the frame of the rotating bolt)
const KNOB_REL = [KNOB[0], KNOB[1] - BORE, KNOB[2] + 0.115];
const ON_KNOB = { attach: 'boltLift', p: offset(KNOB_REL, [-0.022, -0.008, -0.045]), r: [-64, 0, 30] };
const NEAR_KNOB = { attach: 'weapon', p: offset(KNOB, [-0.04, -0.03, -0.07]), r: [-64, 0, 30] };
const LIFT = -62, BOLT_BACK = -0.105;
// left hand around the magazine
const MAG_BELOW = { p: offset(MAG_SEAT, [0, -0.06, 0.004]), r: [3, 0, 0] };
const LH_MAG = { p: [0.034, -0.165, 0.015], r: [-92, 0, 0] };
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };

// Working the bolt: up, back (the case flies), forward, down. `t` is when the hand reaches the knob.
function boltCycle(t) {
  return {
    handR: [k(t - 0.14, NEAR_KNOB), k(t, ON_KNOB), k(t + 0.52, ON_KNOB), k(t + 0.66, NEAR_KNOB)],
    fingersR: [k(t - 0.14, { pose: HANDS.relaxed }), k(t, { pose: HANDS.grab }), k(t + 0.5, { pose: HANDS.grab }), k(t + 0.62, { pose: HANDS.relaxed })],
    lift: [k(t + 0.02, { v: 0 }), k(t + 0.1, { v: LIFT }, 'snap'), k(t + 0.4, { v: LIFT }), k(t + 0.48, { v: 0 }, 'snap')],
    bolt: [k(t + 0.1, { v: 0 }), k(t + 0.22, { v: BOLT_BACK }, 'snap'), k(t + 0.26, { v: BOLT_BACK }), k(t + 0.38, { v: 0 }, 'snap')],
    events: [{ t: t + 0.1, name: 'boltUp' }, { t: t + 0.2, name: 'eject' }, { t: t + 0.38, name: 'boltHome' }, { t: t + 0.48, name: 'boltDown' }],
  };
}
const cycFire = boltCycle(0.58), cycReload = boltCycle(2.12);

const ACTIONS = {
  Idle: {
    duration: 3.6, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3.6) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.6 * Math.sin(2 * a), 4 + 0.8 * Math.sin(a), -3 + 0.5 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.8, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3.6, { pose: HANDS.wrap })],
  },
  Fire: {
    duration: 1.5, fps: 60,
    weapon: [
      k(0, READY),
      k(0.04, { p: offset(W0, [0.004, 0.03, -0.075]), r: [-15, 6.5, -6] }, 'snap'),
      k(0.3, { p: offset(W0, [0, 0.004, 0.01]), r: [-1, 4.5, -3.5] }),
      k(0.48, BOLT_POSE), // raised and canted: the bolt is in view
      k(1.05, BOLT_POSE2),
      k(1.35, READY), k(1.5, READY),
    ],
    handR: [k(0, GRIP_R), k(0.36, GRIP_R), ...cycFire.handR, k(1.32, GRIP_R), k(1.5, GRIP_R)],
    handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.3, { pose: HANDS.pistolGrip }), ...cycFire.fingersR, k(1.32, { pose: HANDS.pistolGrip }), k(1.5, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.05, { pose: { curl: [0.45, 0.72, 0.76, 0.79, 0.82], spread: 0.04 } }, 'snap'), k(0.5, { pose: HANDS.wrap })],
    spins: { boltLift: cycFire.lift },
    slides: { bolt: cycFire.bolt },
    toggles: { flash: [k(0, { v: 1 }), k(0.045, { v: 1 }, 'hold'), k(0.046, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, ...cycFire.events],
  },
  Reload: {
    duration: 3.2, fps: 30,
    weapon: [
      k(0, READY),
      k(0.3, { p: [-0.06, -0.12, 0.47], r: [-18, -10, 52] }), // rolled: the magazine faces the eye
      k(1.5, { p: [-0.06, -0.12, 0.47], r: [-20, -10, 54] }),
      k(1.58, { p: [-0.058, -0.11, 0.47], r: [-22, -10, 55] }, 'snap'),
      k(1.95, BOLT_POSE), // raised and canted: the bolt is in view
      k(2.6, BOLT_POSE2),
      k(3.05, READY), k(3.2, READY),
    ],
    handR: [k(0, GRIP_R), k(1.9, GRIP_R), ...cycReload.handR, k(3.0, GRIP_R), k(3.2, GRIP_R)],
    handL: [
      k(0, SUPPORT_L),
      k(0.3, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.06, 0]) }),
      k(0.4, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.06, 0]) }),
      k(0.52, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.02, 0]) }, 'out'),
      k(0.72, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }),
      k(0.9, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
      k(1.18, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.05, -0.01]) }),
      k(1.28, { attach: 'weapon', ...LH_MAG }),
      k(1.42, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.06, 0]) }, 'in'),
      k(1.5, { attach: 'weapon', p: [0.05, -0.13, 0.05], r: [0, 0, -90] }),
      k(1.58, { attach: 'weapon', p: [0.048, -0.118, 0.05], r: [0, 0, -90] }, 'snap'), // tap it home
      k(1.9, SUPPORT_L), k(3.2, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(1.9, { pose: HANDS.pistolGrip }), ...cycReload.fingersR, k(3.0, { pose: HANDS.pistolGrip }), k(3.2, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.22, { pose: HANDS.relaxed }), k(0.32, { pose: HANDS.grab }), k(0.56, { pose: HANDS.relaxed }), k(0.8, { pose: HANDS.relaxed }), k(0.9, { pose: HANDS.grab }), k(1.42, { pose: HANDS.grab }), k(1.5, { pose: HANDS.flat }), k(1.7, { pose: HANDS.relaxed }), k(1.9, { pose: HANDS.wrap }), k(3.2, { pose: HANDS.wrap })],
    props: {
      mag: [
        k(0, SEATED), k(0.4, SEATED),
        k(0.52, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.02, 0]) }, 'out'),
        k(0.56, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.02, -0.05, 0]), r: [10, 0, 20] }),
        k(0.86, { attach: 'world', p: [-0.05, -1.1, 0.45], r: [120, 40, 90] }, 'in'),
        k(0.87, HIDDEN, 'hold'),
        k(0.88, { ...IN_HAND }, 'hold'),
        k(1.28, IN_HAND),
        k(1.42, SEATED, 'in'), k(3.2, SEATED),
      ],
    },
    spins: { boltLift: cycReload.lift },
    slides: { bolt: cycReload.bolt },
    events: [{ t: 0.4, name: 'magOut' }, { t: 1.42, name: 'magIn' }, ...cycReload.events],
  },
  Inspect: {
    duration: 4.6, fps: 30,
    weapon: [
      k(0, READY),
      k(0.4, { p: [-0.05, -0.17, 0.38], r: [-4, -26, 8] }),
      k(0.85, { p: [0.03, -0.14, 0.46], r: [-8, -60, 12] }), // right side: bolt, windage turret
      k(1.7, { p: [0.034, -0.138, 0.465], r: [-10, -62, 14] }),
      k(2.3, { p: [-0.02, -0.14, 0.42], r: [-22, 34, -34] }), // turned to the eye: scope top and left side
      k(3.5, { p: [-0.018, -0.138, 0.42], r: [-24, 36, -36] }),
      k(4.1, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }),
      k(4.6, READY),
    ],
    handR: [k(0, GRIP_R), k(4.6, GRIP_R)],
    handL: [
      k(0, SUPPORT_L), k(2.35, SUPPORT_L),
      k(2.6, { attach: 'turret', p: [0.05, 0.1, -0.06], r: [-30, 0, -30] }),
      k(2.72, { attach: 'turret', p: [0.04, 0.08, -0.045], r: [-30, 0, -30] }),
      k(3.25, { attach: 'turret', p: [0.04, 0.08, -0.045], r: [-30, 0, -30] }),
      k(3.45, { attach: 'weapon', p: [0.07, 0.0, 0.2], r: [0, -4, -70] }),
      k(3.7, SUPPORT_L), k(4.6, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(4.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(2.35, { pose: HANDS.wrap }), k(2.6, { pose: HANDS.relaxed }), k(2.72, { pose: HANDS.pinch }), k(3.25, { pose: HANDS.pinch }), k(3.4, { pose: HANDS.relaxed }), k(3.7, { pose: HANDS.wrap }), k(4.6, { pose: HANDS.wrap })],
    // two clicks up on the elevation turret, then back down
    spins: { turret: [k(0, { v: 0 }), k(2.75, { v: 0 }), k(2.9, { v: 30 }), k(3.05, { v: 30 }), k(3.2, { v: 0 })] },
    events: [{ t: 2.9, name: 'click' }, { t: 3.2, name: 'click' }],
  },
};

export const SCOUT = {
  id: 'scout', name: 'K-7 Scout Rifle', W0, BORE,
  bones: [
    { name: 'bolt', head: [0, BORE, -0.115] },
    { name: 'boltLift', parent: 'bolt', head: [0, BORE, -0.115], tail: [0, BORE, -0.06] },
    { name: 'turret', head: [0, SIGHT + 0.03, 0.015], tail: [0, SIGHT + 0.06, 0.015] },
    { name: 'flash', head: [0, BORE, 0.62], tail: [0, BORE, 0.68] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { bolt: 'z' },
  spins: { boltLift: 'z', turret: 'y' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: RIFLE, actions: ACTIONS,
  points: SCOUT_POINTS,
  scoped: true,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const scoutDefinition = (o) => weaponDefinition(SCOUT, o);
export const createScout = () => createWeapon(SCOUT);
