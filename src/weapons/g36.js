// G38C carbine, first person: a grey polymer receiver under a tall carry handle that houses a
// dome-lensed optic, a short ribbed handguard with a slotted tip, a short barrel with a prong
// flash hider, a skeletal side-folding stock and a thirty-round translucent magazine with the
// cartridges showing through the wall. Moving parts: the magazine, the charging handle on top of
// the carry handle and the muzzle flash.
// Actions: Idle, Fire (fast automatic), Reload, Reload Empty (also racks the handle), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.08, -0.145, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.034;
const MAG_SEAT = [0, -0.015, 0.03];
const KNOB = [0.0, 0.134, -0.06];
const OPTIC = 0.112;
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const G36_POINTS = { muzzle: [0, BORE, 0.5], eject: [-0.024, 0.044, 0.0], sightRear: [0, OPTIC, -0.06], sightFront: [0, OPTIC, 0.12] };
const magBack = (y) => 0.01 + 1.0 * y * y - 0.07 * y;

const MATERIALS = {
  poly: { color: '#4a4f50', roughness: 0.74, pattern: 'leather', patternScale: 250, patternColor: '#242829', patternStrength: 0.5 },
  polyDark: { color: '#2a2d2e', roughness: 0.78, pattern: 'leather', patternScale: 260, patternColor: '#101112', patternStrength: 0.5 },
  steel: { color: '#25272a', roughness: 0.42, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  smoke: { color: '#26323a', roughness: 0.25, opacity: 0.78, pattern: 'leather', patternScale: 300, patternColor: '#0d1318', patternStrength: 0.25 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#050505', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.55, doubleSided: true },
  dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  // ---- receiver and carry handle
  P('Receiver', profile([[-0.16, -0.01], [0.12, -0.01], [0.12, 0.05], [-0.16, 0.05]], 0.038, 0.01), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Top', profile([[-0.15, 0.048], [-0.1, 0.066], [0.1, 0.066], [0.12, 0.05]], 0.034, 0.006), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.018, 0.05, 0.001), 'dark', WPN, { position: W([-0.0195, 0.044, 0.0]) }),
  P('Carry Handle', profile([[-0.09, 0.064], [-0.075, 0.108], [-0.04, 0.14], [0.06, 0.14], [0.1, 0.116], [0.12, 0.066], [0.1, 0.066], [0.082, 0.1], [0.052, 0.118], [-0.03, 0.118], [-0.055, 0.1], [-0.07, 0.064]], 0.03, 0.007), 'polyDark', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Optic Tube', cyl(0.019, 0.019, 0.14, 22), 'polyDark', WPN, { position: W([0, OPTIC, 0.02]), rotation: ALONG_Z }),
  P('Optic Dome', { type: 'sphere', radius: 0.02, widthSegments: 14, heightSegments: 8 }, 'polyDark', WPN, { position: W([0, OPTIC, 0.094]), scale: [1, 1, 0.55] }),
  P('Optic Lens', cyl(0.0175, 0.0175, 0.002, 22), 'lens', WPN, { position: W([0, OPTIC, 0.108]), rotation: ALONG_Z, castShadow: false }),
  P('Optic Rear', cyl(0.022, 0.018, 0.03, 22), 'polyDark', WPN, { position: W([0, OPTIC, -0.062]), rotation: ALONG_Z }),
  P('Optic Eye Lens', cyl(0.0135, 0.0135, 0.002, 18), 'lens', WPN, { position: W([0, OPTIC, -0.0775]), rotation: ALONG_Z, castShadow: false }),
  P('Optic Dot', sph(0.0012, 8, 6), 'dot', WPN, { position: W([0, OPTIC, 0.102]), castShadow: false }),
  P('Handle Rail', rbox(0.016, 0.008, 0.12, 0.002), 'steel', WPN, { position: W([0, 0.142, 0.01]) }),
  // ---- handguard, barrel, hider
  P('Handguard', profile([[0.1, 0.044], [0.1, -0.012], [0.3, -0.016], [0.3, 0.036], [0.26, 0.048]], 0.046, 0.012), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Handguard Ribs', rbox(0.0475, 0.002, 0.004, 0), 'polyDark', WPN, { position: W([0, 0.0, 0.14]), modifiers: array(9, 0.016), castShadow: false }),
  P('Handguard Tip', rbox(0.04, 0.016, 0.02, 0.005), 'steel', WPN, { position: W([0, 0.044, 0.29]) }),
  P('Barrel', cyl(0.0085, 0.0085, 0.18, 14), 'steel', WPN, { position: W([0, BORE, 0.37]), rotation: ALONG_Z }),
  P('Hider Prongs', gearTube(0.0135, 0.05, 5, 0.34), 'steel', WPN, { position: W([0, BORE, 0.47]) }),
  P('Muzzle Bore', cyl(0.0052, 0.0052, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.4955]), rotation: ALONG_Z }),
  // ---- grip, trigger, folding stock
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'polyDark', WPN, { position: W([0, -0.03, 0.002]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.02]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0.0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.01], [-0.07, -0.01], [-0.096, -0.1], [-0.084, -0.115], [-0.054, -0.115], [-0.046, -0.098], [-0.042, -0.075], [-0.04, -0.06], [-0.036, -0.04]], 0.03, 0.007), 'polyDark', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock Pivot', rbox(0.034, 0.06, 0.022, 0.005), 'steel', WPN, { position: W([0, 0.025, -0.17]) }),
  P('Stock Frame', profile([[-0.18, 0.05], [-0.36, 0.05], [-0.38, 0.04], [-0.38, -0.09], [-0.36, -0.095], [-0.3, -0.05], [-0.26, -0.03], [-0.2, -0.01], [-0.19, 0.004], [-0.3, -0.014], [-0.345, -0.05], [-0.35, 0.03], [-0.19, 0.036]], 0.032, 0.006), 'polyDark', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Pad', rbox(0.036, 0.13, 0.012, 0.004), 'rubber', WPN, { position: W([0, -0.026, -0.386]), rotation: [-4, 0, 0] }),
  // ---- charging handle
  P('Handle Post', cyl(0.004, 0.004, 0.02, 10), 'steel', CH, { position: W([0, 0.146, -0.06]) }),
  P('Handle Knob', sq(0.008, 0.007, 0.012, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB), rotation: [0, 0, 0] }),
  // ---- thirty-round translucent magazine
  P('Magazine', profile([...[0, -0.04, -0.08, -0.12, -0.16, -0.19].map((y) => [magBack(y), y]), ...[-0.19, -0.16, -0.12, -0.08, -0.04, 0].map((y) => [magBack(y) + 0.06, y])], 0.026, 0.004), 'smoke', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Floor', rbox(0.03, 0.01, 0.07, 0.004), 'polyDark', MAG, { position: W([0, -0.195, magBack(-0.195) + 0.03]), rotation: [-18, 0, 0] }),
  ...[0, 1, 2, 3, 4].map((i) => P('Round ' + i, { type: 'capsule', radius: 0.0052, length: 0.02, radialSegments: 8, capSegments: 3 }, 'brass', MAG, { position: W([0, -0.03 - i * 0.032, magBack(-0.03 - i * 0.032) + 0.03]), rotation: [0, 0, 90], castShadow: false })),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.505]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.026, height: 0.11, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.56]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.036, -0.054, -0.104], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.054, 0.0, 0.2], r: [0, -4, -70] },
  magSeat: MAG_SEAT, magOut: [0, -0.07, 0.012],
  lhMag: { p: [0.03, -0.23, 0.03], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.05, -0.2, 0.1], r: [0, 0, -90] },
  magPose: { p: [-0.06, -0.12, 0.4], r: [-28, -6, 36] },
  kick: { back: 0.03, up: 0.008, pitch: -3.2, yaw: 0.6, roll: -0.6 }, fireDur: 0.12, flashOn: 0.025,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [0.03, 0.04, -0.02]), r: [-50, 0, -50] }, hookPose: HANDS.hook, back: -0.07 },
});

export const G36 = {
  id: 'g36', name: 'G38C Carbine', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.505], tail: [0, BORE, 0.56] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: G36_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const g36Definition = (o) => weaponDefinition(G36, o);
export const createG36 = () => createWeapon(G36);
