// L7 Marauder, a belt-fed light machine gun, first person. A boxy receiver under a hinged top
// cover, a perforated barrel shroud with a carry handle, a long ribbed barrel and flash hider,
// folded bipod legs, a ribbed polymer stock and a 100-round belt box hung under the feed tray.
// Moving parts: the top cover (hinged at the rear), the belt box, the charging handle on the
// right and the muzzle flash.
// Actions: Idle, Fire (heavy automatic), Reload (cover up, box off, box on, cover down),
// Reload Empty (also racks the handle), Inspect (cover open to show the belt, press check).
import { P, rbox, cyl, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.08, -0.17, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.052;
const MAG_SEAT = [0, -0.02, 0.01];
const KNOB = [-0.036, 0.05, 0.0];
const HINGE = [0, 0.074, -0.12];
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const CVR = { bone: 'cover' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const LMG_POINTS = { muzzle: [0, BORE, 0.47], eject: [-0.03, 0.045, 0.0], sightRear: [0, 0.105, -0.07], sightFront: [0, 0.098, 0.4] };

const MATERIALS = {
  steel: { color: '#2a2c2e', roughness: 0.46, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#3b3e3a', roughness: 0.58, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  poly: { color: '#262826', roughness: 0.78, pattern: 'leather', patternScale: 260, patternColor: '#0b0b0b', patternStrength: 0.55 },
  olive: { color: '#4a5236', roughness: 0.6, metallic: 0.2, pattern: 'metal', patternScale: 2 },
  box: { color: '#566040', roughness: 0.55, metallic: 0.4, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  stencil: { color: '#d6d2bc', roughness: 0.7 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  link: { color: '#6f7176', roughness: 0.3, metallic: 1 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#050505', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  // ---- receiver, feed tray, hinged cover
  P('Receiver', profile([[-0.16, 0.0], [0.13, 0.0], [0.13, 0.074], [-0.16, 0.074]], 0.05, 0.008), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Feed Tray', rbox(0.044, 0.006, 0.12, 0.002), 'park', WPN, { position: W([0, 0.077, 0.01]) }),
  P('Ejection Port', rbox(0.002, 0.026, 0.07, 0.001), 'dark', WPN, { position: W([-0.0255, 0.04, 0.0]) }),
  P('Receiver Rail', rbox(0.014, 0.006, 0.26, 0.001), 'steel', WPN, { position: W([0, 0.078, -0.01]), castShadow: false }),
  P('Cover', profile([[-0.12, 0.074], [0.12, 0.074], [0.12, 0.092], [0.09, 0.098], [-0.1, 0.098], [-0.12, 0.09]], 0.054, 0.006), 'steel', CVR, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Cover Latch', rbox(0.02, 0.01, 0.014, 0.003), 'park', CVR, { position: W([0, 0.098, 0.112]) }),
  P('Cover Rib', rbox(0.02, 0.004, 0.14, 0.001), 'park', CVR, { position: W([0, 0.1, -0.0]) }),
  P('Rear Sight Leaf', rbox(0.022, 0.006, 0.026, 0.002), 'park', CVR, { position: W([0, 0.104, -0.07]), rotation: [-6, 0, 0] }),
  P('Rear Notch', rbox(0.004, 0.004, 0.002, 0), 'dark', CVR, { position: W([0, 0.108, -0.082]), castShadow: false }),
  // ---- barrel, shroud, gas block, handle, flash hider, bipod
  P('Barrel Shroud', gearTube(0.0225, 0.17, 14, 0.12), 'park', WPN, { position: W([0, BORE, 0.2]) }),
  P('Shroud Vent Dots', rbox(0.0455, 0.003, 0.004, 0), 'dark', WPN, { position: W([0, BORE, 0.14]), modifiers: array(8, 0.017), castShadow: false }),
  P('Barrel', cyl(0.0105, 0.0105, 0.4, 18), 'steel', WPN, { position: W([0, BORE, 0.3]), rotation: ALONG_Z }),
  P('Barrel Ribs', gearTube(0.0125, 0.1, 12, 0.14), 'steel', WPN, { position: W([0, BORE, 0.37]) }),
  P('Gas Block', rbox(0.026, 0.034, 0.04, 0.007), 'park', WPN, { position: W([0, BORE + 0.01, 0.33]) }),
  P('Gas Tube', cyl(0.0105, 0.0105, 0.16, 14), 'steel', WPN, { position: W([0, 0.074, 0.26]), rotation: ALONG_Z }),
  P('Carry Handle', torus(0.034, 0.0045, { tubularSegments: 22, arc: 180 }), 'steel', WPN, { position: W([0, BORE + 0.01, 0.25]), rotation: [0, 90, 0], scale: [1, 1.1, 1] }),
  P('Flash Hider', gearTube(0.0165, 0.05, 6, 0.3), 'steel', WPN, { position: W([0, BORE, 0.435]) }),
  P('Muzzle Bore', cyl(0.0062, 0.0062, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.4605]), rotation: ALONG_Z }),
  P('Front Sight Base', rbox(0.016, 0.024, 0.022, 0.004), 'park', WPN, { position: W([0, BORE + 0.036, 0.4]) }),
  P('Front Post', rbox(0.003, 0.02, 0.004, 0.0006), 'park', WPN, { position: W([0, 0.098, 0.4]) }),
  ...[1, -1].map((sd) => P('Bipod Leg', cyl(0.0048, 0.0048, 0.17, 10), 'steel', WPN, { position: W([sd * 0.03, 0.004, 0.37]), rotation: ALONG_Z })),
  ...[1, -1].map((sd) => P('Bipod Foot', rbox(0.01, 0.01, 0.016, 0.003), 'rubber', WPN, { position: W([sd * 0.03, 0.004, 0.46]) })),
  P('Bipod Hinge', rbox(0.07, 0.014, 0.02, 0.004), 'park', WPN, { position: W([0, 0.018, 0.3]) }),
  // ---- trigger group, grip, stock
  P('Trigger Guard', torus(0.02, 0.0034, { tubularSegments: 24 }), 'steel', WPN, { position: W([0, -0.03, -0.004]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
  P('Trigger', profile([[-0.004, 0.0], [0.004, 0.0], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.034, 0.0], [-0.078, 0.0], [-0.104, -0.108], [-0.095, -0.126], [-0.06, -0.126], [-0.05, -0.1], [-0.044, -0.06], [-0.036, -0.03]], 0.036, 0.009), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Selector', rbox(0.004, 0.006, 0.026, 0.0015), 'steel', WPN, { position: W([0.0255, 0.016, -0.05]) }),
  P('Stock', profile([[-0.16, 0.07], [-0.2, 0.074], [-0.3, 0.062], [-0.322, 0.05], [-0.322, -0.1], [-0.31, -0.108], [-0.25, -0.07], [-0.2, -0.04], [-0.16, -0.02]], 0.042, 0.01), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock Ribs', rbox(0.0425, 0.003, 0.003, 0), 'dark', WPN, { position: W([0, 0.058, -0.2]), modifiers: array(6, -0.017), castShadow: false }),
  P('Butt Pad', rbox(0.044, 0.158, 0.014, 0.004), 'rubber', WPN, { position: W([0, -0.026, -0.328]), rotation: [-2, 0, 0] }),
  // ---- charging handle (right side)
  P('Handle Arm', cyl(0.004, 0.004, 0.026, 8), 'steel', CH, { position: W([-0.0285, 0.05, 0.0]), rotation: [0, 0, 90] }),
  P('Handle Knob', sq(0.0075, 0.01, 0.0075, 0.7, 0.7, 12), 'steel', CH, { position: W(KNOB) }),
  // ---- belt box and belt (hangs under the feed tray)
  P('Belt Box', rbox(0.072, 0.1, 0.134, 0.006), 'box', MAG, { position: W([0, -0.082, 0.014]) }),
  P('Box Lid Seam', rbox(0.0725, 0.003, 0.136, 0.0005), 'dark', MAG, { position: W([0, -0.04, 0.014]), castShadow: false }),
  P('Box Handle', torus(0.026, 0.003, { tubularSegments: 16, arc: 180 }), 'steel', MAG, { position: W([0.037, -0.07, 0.014]), rotation: [0, 0, -90] }),
  P('Box Stencil', rbox(0.0008, 0.05, 0.07, 0), 'stencil', MAG, { position: W([-0.0365, -0.085, 0.014]), castShadow: false }),
  P('Box Latch', rbox(0.014, 0.012, 0.016, 0.003), 'park', MAG, { position: W([0.037, -0.06, 0.07]) }),
  ...[0, 1, 2, 3, 4].map((i) => P('Belt Round ' + i, { type: 'capsule', radius: 0.0052, length: 0.026, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, -0.03 + i * 0.0072 - i * i * 0.0007, 0.0 - 0.012 + i * 0.006]), rotation: [i * 6, 0, 90] })),
  ...[0, 1, 2, 3, 4].map((i) => P('Belt Link ' + i, rbox(0.03, 0.004, 0.006, 0.001), 'link', MAG, { position: W([0, -0.0295 + i * 0.0072 - i * i * 0.0007, 0.0 - 0.012 + i * 0.006]) })),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.09, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.466]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.034, height: 0.14, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.54]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.036, -0.054, -0.112], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.05, -0.006, 0.2], r: [0, -4, -70] },
  magSeat: MAG_SEAT, magOut: [0, -0.1, 0.0],
  lhMag: { p: [0.032, -0.3, 0.014], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.05, -0.31, 0.01], r: [0, 0, -90] },
  magPose: { p: [-0.05, -0.15, 0.47], r: [-8, -2, 30] },
  kick: { back: 0.034, up: 0.008, pitch: -3.0, yaw: 0.8, roll: -0.8 }, fireDur: 0.1, flashOn: 0.02,
  cover: { bone: 'cover', open: -78 }, reloadScale: 1.62,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [-0.03, 0.05, -0.03]), r: [-40, 10, 60] }, hookPose: HANDS.hook, back: -0.11 },
});

export const LMG = {
  id: 'lmg', name: 'L7 Marauder', W0, BORE,
  bones: [
    { name: 'charge', head: KNOB },
    { name: 'cover', head: HINGE, tail: [0, 0.074, 0.1] },
    { name: 'flash', head: [0, BORE, 0.466], tail: [0, BORE, 0.54] },
  ],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, spins: { cover: 'x' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: LMG_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const lmgDefinition = (o) => weaponDefinition(LMG, o);
export const createLMG = () => createWeapon(LMG);
