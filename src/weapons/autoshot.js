// D-12 drum shotgun, first person: a boxy gas-operated receiver with a carry handle, a fat barrel
// under a vented heat shield, a muzzle brake, a vertical foregrip, a fixed stock and a 20-round
// drum magazine hanging under the action. Moving parts: the drum, the charging handle on top
// and the muzzle flash.
// Actions: Idle, Fire (heavy automatic), Reload (drop the drum, spin a new one in), Reload Empty
// (also racks the handle), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.075, -0.15, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.05;
const MAG_SEAT = [0, -0.1, 0.02];
const KNOB = [0.0, 0.092, -0.02];
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const D12_POINTS = { muzzle: [0, BORE, 0.54], eject: [-0.03, 0.045, 0.0], sightRear: [0, 0.122, -0.06], sightFront: [0, 0.098, 0.4] };

const MATERIALS = {
  steel: { color: '#26282a', roughness: 0.45, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#383b3d', roughness: 0.55, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  poly: { color: '#232527', roughness: 0.78, pattern: 'leather', patternScale: 260, patternColor: '#0a0a0a', patternStrength: 0.55 },
  drum: { color: '#303336', roughness: 0.4, metallic: 0.8, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  window: { color: '#242f38', roughness: 0.2, opacity: 0.75 },
  shell: { color: '#a1281f', roughness: 0.6 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#050505', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  P('Receiver', profile([[-0.17, -0.012], [0.17, -0.012], [0.17, 0.07], [-0.17, 0.07]], 0.05, 0.008), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Lid', profile([[-0.16, 0.07], [0.15, 0.07], [0.15, 0.082], [-0.16, 0.082]], 0.044, 0.004), 'park', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.03, 0.08, 0.001), 'dark', WPN, { position: W([-0.0255, 0.04, 0.02]) }),
  P('Charging Slot', rbox(0.016, 0.002, 0.18, 0.0005), 'dark', WPN, { position: W([0, 0.0825, -0.02]), castShadow: false }),
  P('Top Rail', rbox(0.022, 0.006, 0.3, 0.001), 'steel', WPN, { position: W([0, 0.085, -0.0]) }),
  P('Rail Slots', rbox(0.0222, 0.0032, 0.004, 0), 'dark', WPN, { position: W([0, 0.0885, -0.14]), modifiers: array(20, 0.0145), castShadow: false }),
  P('Carry Handle', torus(0.04, 0.0055, { tubularSegments: 24, arc: 180 }), 'steel', WPN, { position: W([0, 0.085, -0.035]), rotation: [0, 90, 0] }),
  P('Rear Aperture', cyl(0.007, 0.007, 0.016, 12), 'steel', WPN, { position: W([0, 0.116, -0.06]), rotation: ALONG_Z }),
  P('Aperture Hole', cyl(0.0035, 0.0035, 0.018, 10), 'dark', WPN, { position: W([0, 0.116, -0.06]), rotation: ALONG_Z, castShadow: false }),
  // ---- barrel, heat shield, brake
  P('Barrel', cyl(0.0185, 0.0185, 0.36, 20), 'steel', WPN, { position: W([0, BORE, 0.35]), rotation: ALONG_Z }),
  P('Heat Shield', gearTube(0.0285, 0.2, 16, 0.12), 'park', WPN, { position: W([0, BORE, 0.28]) }),
  P('Shield Vents', rbox(0.058, 0.004, 0.006, 0), 'dark', WPN, { position: W([0, BORE + 0.028, 0.2]), modifiers: array(7, 0.025), castShadow: false }),
  P('Gas Block', rbox(0.034, 0.034, 0.04, 0.008), 'park', WPN, { position: W([0, BORE + 0.006, 0.4]) }),
  P('Muzzle Brake', gearTube(0.0235, 0.055, 8, 0.28), 'steel', WPN, { position: W([0, BORE, 0.515]) }),
  P('Muzzle Bore', cyl(0.0125, 0.0125, 0.003, 16), 'dark', WPN, { position: W([0, BORE, 0.5435]), rotation: ALONG_Z }),
  P('Front Post Base', rbox(0.016, 0.02, 0.02, 0.004), 'park', WPN, { position: W([0, BORE + 0.036, 0.42]) }),
  P('Front Post', rbox(0.003, 0.02, 0.004, 0.0006), 'park', WPN, { position: W([0, 0.098, 0.42]) }),
  // ---- foregrip
  P('Grip Mount', rbox(0.034, 0.014, 0.06, 0.004), 'park', WPN, { position: W([0, 0.01, 0.26]) }),
  P('Foregrip', cyl(0.0165, 0.0145, 0.085, 18), 'poly', WPN, { position: W([0, -0.04, 0.26]) }),
  ...[0, 1, 2].map((i) => P('Foregrip Groove', torus(0.0158, 0.0012, { tubularSegments: 20 }), 'dark', WPN, { position: W([0, -0.022 - i * 0.017, 0.26]), rotation: [90, 0, 0] })),
  // ---- trigger group, grip, stock
  P('Trigger Guard', torus(0.02, 0.0034, { tubularSegments: 24 }), 'steel', WPN, { position: W([0, -0.03, 0.0]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
  P('Trigger', profile([[-0.004, 0.0], [0.004, 0.0], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.012], [-0.07, -0.012], [-0.098, -0.1], [-0.09, -0.12], [-0.054, -0.12], [-0.046, -0.095], [-0.04, -0.06], [-0.034, -0.03]], 0.036, 0.009), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Selector', rbox(0.004, 0.006, 0.026, 0.0015), 'steel', WPN, { position: W([0.0255, 0.016, -0.04]) }),
  P('Stock', profile([[-0.17, 0.066], [-0.22, 0.07], [-0.34, 0.052], [-0.37, 0.04], [-0.37, -0.09], [-0.358, -0.1], [-0.28, -0.06], [-0.2, -0.032], [-0.17, -0.014]], 0.04, 0.01), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Butt Pad', rbox(0.042, 0.15, 0.014, 0.004), 'rubber', WPN, { position: W([0, -0.026, -0.376]), rotation: [-3, 0, 0] }),
  // ---- charging handle (top)
  P('Handle Stem', cyl(0.006, 0.006, 0.02, 8), 'steel', CH, { position: W([0, 0.086, -0.02]) }),
  P('Handle T', rbox(0.04, 0.012, 0.014, 0.004), 'steel', CH, { position: W(KNOB) }),
  // ---- drum magazine (axis across the gun)
  P('Drum', cyl(0.07, 0.07, 0.066, 28), 'drum', MAG, { position: W([0, -0.118, 0.02]), rotation: [0, 0, 90] }),
  P('Drum Rim L', cyl(0.074, 0.074, 0.006, 28), 'steel', MAG, { position: W([0.035, -0.118, 0.02]), rotation: [0, 0, 90] }),
  P('Drum Rim R', cyl(0.074, 0.074, 0.006, 28), 'steel', MAG, { position: W([-0.035, -0.118, 0.02]), rotation: [0, 0, 90] }),
  P('Drum Neck', rbox(0.04, 0.05, 0.06, 0.008), 'drum', MAG, { position: W([0, -0.05, 0.02]) }),
  P('Drum Window', rbox(0.0008, 0.034, 0.04, 0), 'window', MAG, { position: W([0.0332, -0.118, 0.02]), castShadow: false }),
  P('Drum Shell', cyl(0.0095, 0.0095, 0.03, 12), 'shell', MAG, { position: W([0.0332, -0.118, 0.02]), rotation: [0, 0, 90], castShadow: false }),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => P('Drum Rib ' + i, rbox(0.068, 0.006, 0.02, 0.002), 'steel', MAG, { position: W([0, -0.118 + Math.sin((i * Math.PI) / 4) * 0.071, 0.02 + Math.cos((i * Math.PI) / 4) * 0.071]), rotation: [-i * 45, 0, 0] })),
  P('Top Shell', cyl(0.0095, 0.0095, 0.034, 12), 'shell', MAG, { position: W([0, -0.024, 0.02]), rotation: ALONG_Z }),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.1, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.555]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.038, height: 0.16, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.64]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.038, -0.06, -0.108], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.05, -0.08, 0.25], r: [-6, 0, -84] },
  leftPose: { curl: [0.5, 0.66, 0.7, 0.74, 0.78], spread: 0.04 },
  magSeat: MAG_SEAT, magOut: [0, -0.1, 0.0],
  lhMag: { p: [0.04, -0.3, 0.02], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.06, -0.3, 0.0], r: [0, 0, -90] },
  magPose: { p: [-0.07, -0.13, 0.4], r: [-26, -6, 38] },
  kick: { back: 0.045, up: 0.012, pitch: -5.0, yaw: 0.8, roll: -1.0 }, fireDur: 0.2, flashOn: 0.03, reloadScale: 1.28,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [0.05, 0.03, -0.01]), r: [-30, 0, -80] }, hookPose: HANDS.hook, back: -0.08 },
});

export const D12 = {
  id: 'd12', name: 'D-12 Drum Shotgun', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.555], tail: [0, BORE, 0.64] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: D12_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const d12Definition = (o) => weaponDefinition(D12, o);
export const createD12 = () => createWeapon(D12);
