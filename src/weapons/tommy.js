// M28 Chicago submachine gun, first person: a blued steel receiver with a finned barrel and a
// slotted compensator, a walnut stock, a walnut vertical foregrip and a fifty-round drum hung
// under the receiver. Moving parts: the drum (hand to well), the cocking knob on top and the
// muzzle flash.
// Actions: Idle, Fire (steady automatic), Reload (drum off and a new one on), Reload Empty
// (also hauls the knob back), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.07, -0.165, 0.26];
const W = (p) => offset(W0, p);
const BORE = 0.04;
const MAG_SEAT = [0, -0.07, 0.04];
const KNOB = [0.0, 0.082, -0.03];
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const TOMMY_POINTS = { muzzle: [0, BORE, 0.5], eject: [-0.026, 0.05, 0.0], sightRear: [0, 0.092, -0.04], sightFront: [0, 0.092, 0.34] };

const MATERIALS = {
  blued: { color: '#25282b', roughness: 0.38, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.45 },
  steel: { color: '#6f7377', roughness: 0.3, metallic: 1, pattern: 'metal', patternScale: 4, patternStrength: 0.4 },
  wood: { color: '#78471f', roughness: 0.38, pattern: 'walnut', patternScale: 22, patternColor: '#3a1d08', sheen: 0.3 },
  woodDark: { color: '#5a3216', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#2a1307' },
  drum: { color: '#2a2e31', roughness: 0.5, metallic: 0.8, pattern: 'metal', patternScale: 2, patternStrength: 0.5 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#050505', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  // ---- receiver, rear sight, port
  P('Receiver', profile([[-0.14, 0.0], [0.12, 0.0], [0.12, 0.062], [-0.14, 0.062]], 0.046, 0.01), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Top', rbox(0.04, 0.006, 0.26, 0.002), 'blued', WPN, { position: W([0, 0.065, -0.01]) }),
  P('Ejection Port', rbox(0.002, 0.02, 0.07, 0.001), 'dark', WPN, { position: W([-0.0235, 0.04, 0.0]) }),
  P('Cocking Slot', rbox(0.006, 0.002, 0.12, 0.0006), 'dark', WPN, { position: W([0, 0.0685, -0.03]), castShadow: false }),
  P('Rear Sight Base', rbox(0.026, 0.01, 0.03, 0.003), 'blued', WPN, { position: W([0, 0.072, -0.1]) }),
  P('Rear Sight Leaf', rbox(0.02, 0.022, 0.004, 0.001), 'blued', WPN, { position: W([0, 0.088, -0.102]), rotation: [-8, 0, 0] }),
  P('Rear Notch', rbox(0.004, 0.008, 0.002, 0), 'dark', WPN, { position: W([0, 0.094, -0.1045]), castShadow: false }),
  P('Selector', rbox(0.004, 0.012, 0.012, 0.002), 'steel', WPN, { position: W([-0.0245, 0.02, -0.05]) }),
  // ---- finned barrel, compensator
  P('Barrel Jacket', cyl(0.0165, 0.0165, 0.2, 18), 'blued', WPN, { position: W([0, BORE, 0.22]), rotation: ALONG_Z }),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => P('Cooling Fin ' + i, cyl(0.0205, 0.0205, 0.004, 18), 'blued', WPN, { position: W([0, BORE, 0.13 + i * 0.016]), rotation: ALONG_Z })),
  P('Barrel', cyl(0.0095, 0.0095, 0.1, 14), 'steel', WPN, { position: W([0, BORE, 0.37]), rotation: ALONG_Z }),
  P('Compensator', cyl(0.0145, 0.0145, 0.07, 16), 'blued', WPN, { position: W([0, BORE, 0.455]), rotation: ALONG_Z }),
  ...[0, 1, 2].map((i) => P('Comp Slot ' + i, rbox(0.03, 0.004, 0.012, 0.001), 'dark', WPN, { position: W([0, BORE + 0.0146, 0.435 + i * 0.016]), castShadow: false })),
  P('Muzzle Bore', cyl(0.0058, 0.0058, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.4905]), rotation: ALONG_Z }),
  P('Front Sight', rbox(0.004, 0.022, 0.006, 0.001), 'blued', WPN, { position: W([0, 0.066, 0.34]) }),
  P('Front Sight Base', rbox(0.016, 0.016, 0.03, 0.004), 'blued', WPN, { position: W([0, 0.05, 0.34]) }),
  // ---- wooden furniture
  P('Forend', profile([[0.06, 0.02], [0.2, 0.02], [0.205, -0.022], [0.17, -0.034], [0.07, -0.026]], 0.048, 0.01), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Vertical Grip', cyl(0.017, 0.015, 0.1, 14), 'wood', WPN, { position: W([0, -0.082, 0.17]) }),
  P('Grip Band', cyl(0.0185, 0.0185, 0.006, 14), 'steel', WPN, { position: W([0, -0.04, 0.17]) }),
  P('Pistol Grip', profile([[-0.03, -0.01], [-0.06, -0.01], [-0.086, -0.1], [-0.074, -0.118], [-0.044, -0.118], [-0.04, -0.098], [-0.038, -0.07], [-0.034, -0.04]], 0.032, 0.008), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Trigger Guard', torus(0.02, 0.0036, { tubularSegments: 24 }), 'blued', WPN, { position: W([0, -0.026, 0.0]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, 0.0], [0.004, 0.0], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.02]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock', profile([[-0.14, 0.05], [-0.2, 0.056], [-0.34, 0.044], [-0.4, 0.034], [-0.4, -0.09], [-0.385, -0.096], [-0.33, -0.06], [-0.26, -0.03], [-0.2, -0.016], [-0.14, 0.0]], 0.04, 0.01), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock Collar', rbox(0.046, 0.07, 0.016, 0.004), 'blued', WPN, { position: W([0, 0.03, -0.142]) }),
  P('Butt Plate', rbox(0.04, 0.13, 0.012, 0.004), 'steel', WPN, { position: W([0, -0.026, -0.405]), rotation: [-3, 0, 0] }),
  // ---- cocking knob on top (rides back in the slot)
  P('Knob Stem', cyl(0.004, 0.004, 0.014, 8), 'steel', CH, { position: W([0, 0.074, -0.03]) }),
  P('Cocking Knob', sq(0.0085, 0.01, 0.0085, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB) }),
  // ---- fifty-round drum under the receiver
  P('Drum Shell', cyl(0.078, 0.078, 0.056, 28), 'drum', MAG, { position: W([0, -0.12, 0.04]), rotation: [0, 0, 90] }),
  P('Drum Face Left', cyl(0.07, 0.07, 0.003, 28), 'steel', MAG, { position: W([0.0295, -0.12, 0.04]), rotation: [0, 0, 90] }),
  P('Drum Face Right', cyl(0.07, 0.07, 0.003, 28), 'steel', MAG, { position: W([-0.0295, -0.12, 0.04]), rotation: [0, 0, 90] }),
  P('Drum Hub', cyl(0.018, 0.018, 0.062, 14), 'blued', MAG, { position: W([0, -0.12, 0.04]), rotation: [0, 0, 90] }),
  P('Drum Neck', rbox(0.034, 0.05, 0.05, 0.006), 'drum', MAG, { position: W([0, -0.055, 0.04]) }),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => P('Drum Rib ' + i, rbox(0.058, 0.01, 0.012, 0.002), 'drum', MAG, { position: W([0, -0.12 + Math.cos((i / 8) * Math.PI * 2) * 0.079, 0.04 + Math.sin((i / 8) * Math.PI * 2) * 0.079]), rotation: [-(i / 8) * 360, 0, 0] })),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.06, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.5]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.024, height: 0.1, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.555]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.034, -0.056, -0.1], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.034, -0.082, 0.17], r: [0, -4, -80] },
  magSeat: MAG_SEAT, magOut: [0, -0.1, 0.0],
  lhMag: { p: [0.07, -0.18, 0.04], r: [0, 0, -90] },
  lhSlap: { attach: 'weapon', p: [0.06, -0.14, 0.04], r: [0, 0, -90] },
  magPose: { p: [-0.07, -0.13, 0.4], r: [-30, -6, 38] },
  kick: { back: 0.03, up: 0.009, pitch: -3.6, yaw: 0.7, roll: -0.7 }, fireDur: 0.17, flashOn: 0.03,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [0.03, 0.04, -0.02]), r: [-50, 0, -50] }, hookPose: HANDS.hook, back: -0.1 },
});

export const TOMMY = {
  id: 'tommy', name: 'M28 Chicago', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.5], tail: [0, BORE, 0.555] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: TOMMY_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const tommyDefinition = (o) => weaponDefinition(TOMMY, o);
export const createTommy = () => createWeapon(TOMMY);
