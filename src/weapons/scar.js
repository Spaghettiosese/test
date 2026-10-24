// SCAR-H-style 7.62 battle rifle, first person: a flat-dark-earth monolithic upper with a
// full-length top rail and flip-up sights, a quad-rail free-float handguard, a slotted muzzle
// brake, a folding-style adjustable stock, a pistol grip and a straight 20-round magazine.
// It shares the AK-47's moving parts (magazine, right-side reciprocating charging handle,
// muzzle flash) and so its animations: fire, a rock-and-lock reload and the inspect.
import { P, rbox, cyl, gearTube, profile, torus, ALONG_Z, SIDE, offset, weaponDefinition, createWeapon } from './rig.js';
import { AK47, akActions } from './ak47.js';

const { W0, bones } = AK47;
const W = (p) => offset(W0, p);
const BORE = 0.036, SIGHT = 0.1;
export const SCAR_POINTS = { muzzle: [0, BORE, 0.5], eject: [0.03, 0.05, 0.02], sightRear: [0, SIGHT, -0.04], sightFront: [0, SIGHT, 0.43] };
const array = (count, offsetZ, y = 0) => [{ type: 'array', count, offsetX: 0, offsetY: y, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];

const MATERIALS = {
  fde: { color: '#a58f6b', roughness: 0.55, metallic: 0.35, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  fdePoly: { color: '#957f5c', roughness: 0.8, pattern: 'leather', patternScale: 250, patternColor: '#6d5a40', patternStrength: 0.5 },
  steel: { color: '#2b2d2f', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 3 },
  dark: { color: '#070707', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};
const WPN = { bone: 'weapon' }, MAG = { bone: 'mag' }, CH = { bone: 'chargeRot' };
const KNOB = [-0.028, 0.044, 0.02];

const PARTS = [
  P('Upper', profile([[-0.14, 0.02], [0.17, 0.02], [0.17, 0.07], [-0.14, 0.07]], 0.04, 0.009), 'fde', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Top Rail', rbox(0.022, 0.006, 0.46, 0.001), 'steel', WPN, { position: W([0, 0.073, 0.09]) }),
  P('Rail Teeth', rbox(0.022, 0.002, 0.004, 0), 'dark', WPN, { position: W([0, 0.0765, -0.12]), modifiers: array(32, 0.0115), castShadow: false }),
  P('Ejection Port', rbox(0.002, 0.02, 0.06, 0.001), 'dark', WPN, { position: W([0.0202, 0.045, 0.03]) }),
  P('Rear Sight', rbox(0.014, 0.022, 0.012, 0.002), 'steel', WPN, { position: W([0, 0.087, -0.04]) }),
  P('Rear Aperture', torus(0.0045, 0.002, { tubularSegments: 16 }), 'steel', WPN, { position: W([0, SIGHT, -0.04]), rotation: [90, 0, 0] }),
  P('Front Sight Base', rbox(0.014, 0.03, 0.016, 0.003), 'steel', WPN, { position: W([0, 0.088, 0.43]) }),
  P('Front Post', rbox(0.0024, 0.018, 0.004, 0.0006), 'steel', WPN, { position: W([0, SIGHT - 0.003, 0.43]) }),
  P('Handguard', rbox(0.042, 0.054, 0.3, 0.01, 2), 'fdePoly', WPN, { position: W([0, 0.042, 0.31]) }),
  P('Handguard Rail Top', rbox(0.016, 0.005, 0.28, 0.001), 'steel', WPN, { position: W([0, 0.072, 0.31]) }),
  P('Handguard Rail Bottom', rbox(0.016, 0.005, 0.26, 0.001), 'steel', WPN, { position: W([0, 0.0, 0.31]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Handguard Rail L' : 'Handguard Rail R', rbox(0.005, 0.016, 0.26, 0.001), 'steel', WPN, { position: W([s * 0.0225, 0.042, 0.31]) })),
  P('Handguard Slots', rbox(0.0435, 0.012, 0.012, 0), 'dark', WPN, { position: W([0, 0.042, 0.2]), modifiers: array(7, 0.032), castShadow: false }),
  P('Barrel', cyl(0.0085, 0.0085, 0.2, 18), 'steel', WPN, { position: W([0, BORE, 0.4]), rotation: ALONG_Z }),
  P('Brake', gearTube(0.0125, 0.05, 6, 0.3), 'steel', WPN, { position: W([0, BORE, 0.475]) }),
  P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.5015]), rotation: ALONG_Z }),
  P('Lower', profile([[-0.12, 0.03], [0.09, 0.03], [0.09, -0.01], [0.05, -0.014], [-0.03, -0.014], [-0.12, 0.0]], 0.038, 0.007), 'fdePoly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'fdePoly', WPN, { position: W([0, -0.03, 0.002]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, 0.012], [0.004, 0.012], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, 0.0], [-0.075, 0.0], [-0.105, -0.108], [-0.096, -0.126], [-0.062, -0.126], [-0.052, -0.1], [-0.046, -0.06], [-0.036, -0.03]], 0.034, 0.009), 'fdePoly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Safety', rbox(0.004, 0.006, 0.03, 0.0015), 'steel', WPN, { position: W([0.0195, 0.0, -0.05]) }),
  P('Magwell', rbox(0.034, 0.034, 0.05, 0.004), 'fde', WPN, { position: W([0, 0.0, 0.05]) }),
  P('Stock Tube', rbox(0.04, 0.056, 0.22, 0.01), 'fdePoly', WPN, { position: W([0, 0.035, -0.25]) }),
  P('Cheek Rest', rbox(0.034, 0.012, 0.14, 0.004), 'fdePoly', WPN, { position: W([0, 0.071, -0.22]) }),
  P('Butt Plate', profile([[-0.36, 0.06], [-0.38, 0.056], [-0.388, -0.05], [-0.38, -0.06], [-0.36, -0.058]], 0.04, 0.004), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Charging Arm', cyl(0.0035, 0.0035, 0.024, 10), 'steel', CH, { position: W([-0.0195, 0.044, 0.02]), rotation: [0, 0, 90] }),
  P('Charging Knob', rbox(0.01, 0.014, 0.01, 0.003), 'steel', CH, { position: W(KNOB) }),
  P('Magazine', rbox(0.026, 0.19, 0.052, 0.004), 'steel', MAG, { position: W([0, -0.1, 0.05]) }),
  P('Mag Ribs', rbox(0.0272, 0.003, 0.054, 0), 'dark', MAG, { position: W([0, -0.04, 0.05]), modifiers: array(9, -0.017, 0) }),
  P('Mag Floor', rbox(0.03, 0.01, 0.058, 0.003), 'fdePoly', MAG, { position: W([0, -0.2, 0.05]) }),
  P('Top Round', { type: 'capsule', radius: 0.0055, length: 0.016, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.024, 0.048]), rotation: ALONG_Z }),
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.512]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.028, height: 0.12, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.57]), rotation: [90, 0, 0], castShadow: false }),
];

// its straight 20-round magazine ends 6.6 cm higher and 14.5 cm further back than the AK's banana
export const SCAR = { ...AK47, id: 'scar', name: 'SCAR-H', bones, materials: MATERIALS, parts: PARTS, points: SCAR_POINTS, actions: akActions({ mag: [0.066, -0.145] }) };
export const scarDefinition = (o) => weaponDefinition(SCAR, o);
export const createSCAR = () => createWeapon(SCAR);
