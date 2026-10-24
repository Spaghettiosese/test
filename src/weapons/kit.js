// Shared part builders for the guns that are built on another gun's rig (handguns.js, smgs.js,
// rifles.js, shotguns.js). Positions are in weapon space through the caller's W().
import { P, rbox, cyl, profile, torus, gearTube, ALONG_Z, SIDE } from './rig.js';

export const arrayZ = (count, dz, dy = 0) => [{ type: 'array', count, offsetX: 0, offsetY: dy, offsetZ: dz, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const WPN = { bone: 'weapon' };

// muzzle flash at z (a star and a cone on the 'flash' bone)
export const flashParts = (W, bore, z, size = 1) => [
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.065 * size, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, bore, z + 0.008]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.026 * size, height: 0.11 * size, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, bore, z + 0.008 + 0.055 * size]), rotation: [90, 0, 0], castShadow: false }),
];
export const boreParts = (W, bore, z, r = 0.0045, mat = 'dark') => P('Muzzle Bore', cyl(r, r, 0.003, 12), mat, WPN, { position: W([0, bore, z + 0.0005]), rotation: ALONG_Z });

// the rifle rigs' pistol grip (where the right hand closes on the AK, M4 and MP5 rigs), moved by dz
export const pistolGrip = (W, mat, dz = 0, width = 0.034) => P('Pistol Grip', profile([[-0.03, 0.0], [-0.075, 0.0], [-0.105, -0.108], [-0.096, -0.126], [-0.062, -0.126], [-0.052, -0.1], [-0.046, -0.06], [-0.036, -0.03]].map(([z, y]) => [z + dz, y]), width, 0.009), mat, WPN, { position: W([0, 0, 0]), rotation: SIDE });
export const triggerParts = (W, guardMat, trigMat, { y = -0.03, z = 0.002, scale = 1.4, bone = 'weapon' } = {}) => [
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), guardMat, WPN, { position: W([0, y, z]), rotation: [0, 0, 90], scale: [1, 1, scale] }),
  P('Trigger', profile([[-0.004, 0.006], [0.004, 0.006], [0.002, -0.022], [-0.004, -0.032], [-0.008, -0.029], [-0.003, -0.018]].map(([a, b]) => [a + z - 0.002, b + y + 0.03]), 0.006, 0.0012), trigMat, { bone }, { position: W([0, 0, 0]), rotation: SIDE }),
];
// straight box magazine on the 'mag' bone: from yTop down to yBot, centred on z
export function boxMag(W, mat, { yTop = 0.016, yBot, z, depth = 0.05, width = 0.025, rake = 0, floor = mat, ribs = 'dark', round = true }) {
  const h = yTop - yBot, cy = (yTop + yBot) / 2, MAG = { bone: 'mag' };
  const out = [
    P('Magazine', rbox(width, h, depth, 0.003), mat, MAG, { position: W([0, cy, z - rake * (cy - yTop)]), rotation: [-Math.atan(rake) * 57.3, 0, 0] }),
    P('Mag Floor', rbox(width + 0.004, 0.009, depth + 0.006, 0.003), floor, MAG, { position: W([0, yBot - 0.003, z - rake * (yBot - yTop)]), rotation: [-Math.atan(rake) * 57.3, 0, 0] }),
  ];
  if (ribs) out.push(P('Mag Ribs', rbox(width + 0.0012, 0.002, depth * 0.8, 0), ribs, MAG, { position: W([0, yTop - 0.04, z - rake * (-0.056)]), modifiers: arrayZ(Math.max(2, Math.floor((h - 0.06) / 0.03)), -rake * -0.03, -0.03), castShadow: false }));
  if (round) out.push(P('Top Round', { type: 'capsule', radius: 0.0048, length: Math.min(0.03, depth * 0.5), radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, yTop + 0.006, z]), rotation: ALONG_Z }));
  return out;
}
// curved magazine on the 'mag' bone: back(y) is its back edge, depth its front-to-back size
export function curvedMag(W, mat, { back, depth, yTop = 0.016, yBot, width = 0.024, floor = mat, steps = 7 }) {
  const ys = Array.from({ length: steps }, (_, i) => yTop + ((yBot - yTop) * i) / (steps - 1));
  const MAG = { bone: 'mag' }, tilt = Math.atan2(back(yBot) - back(yBot + 0.03), 0.03) * 57.3;
  return [
    P('Magazine', profile([...ys.map((y) => [back(y), y]), ...ys.slice().reverse().map((y) => [back(y) + depth, y])], width, 0.003), mat, MAG, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Mag Floor', rbox(width + 0.004, 0.009, depth + 0.008, 0.003), floor, MAG, { position: W([0, yBot - 0.003, back(yBot) + depth / 2]), rotation: [-tilt, 0, 0] }),
    P('Top Round', { type: 'capsule', radius: 0.005, length: 0.02, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, yTop + 0.007, back(yTop) + depth * 0.45]), rotation: ALONG_Z }),
  ];
}
// the bottom centre of a curved magazine (where the rigs' left hand takes it)
export const curvedBottom = (back, depth, yBot) => [yBot - 0.008, back(yBot) + depth / 2];

// picatinny rail along z at height y (its top), with teeth
export const rail = (W, mat, z0, z1, y, { width = 0.022, name = 'Rail', bone = 'weapon' } = {}) => [
  P(name, rbox(width, 0.006, z1 - z0, 0.001), mat, { bone }, { position: W([0, y - 0.003, (z0 + z1) / 2]) }),
  P(name + ' Teeth', rbox(width, 0.003, 0.0045, 0), mat, { bone }, { position: W([0, y + 0.0015, z0 + 0.005]), modifiers: arrayZ(Math.floor((z1 - z0 - 0.006) / 0.01), 0.01) }),
];
// a reflex sight: base, window frame, lens and dot, its window centred at height y
export const reflexSight = (W, z, y, { body = 'optic', lens = 'lens', dot = 'dot', base = 0.0 } = {}) => [
  P('Sight Base', rbox(0.03, y - 0.012 - base, 0.07, 0.004), body, WPN, { position: W([0, (y - 0.012 + base) / 2, z]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Wall L' : 'Sight Wall R', rbox(0.004, 0.03, 0.044, 0.0015), body, WPN, { position: W([s * 0.0165, y, z]) })),
  P('Sight Hood', rbox(0.037, 0.005, 0.044, 0.002), body, WPN, { position: W([0, y + 0.0165, z]) }),
  P('Sight Window', rbox(0.029, 0.026, 0.0015, 0), lens, WPN, { position: W([0, y, z + 0.02]), castShadow: false }),
  P('Sight Dot', { type: 'sphere', radius: 0.0006, widthSegments: 8, heightSegments: 6, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, dot, WPN, { position: W([0, y, z + 0.019]), castShadow: false }),
];
// a telescopic sight along z at height y, from z0 (eyepiece) to z1 (objective)
export const scopeParts = (W, mat, glass, z0, z1, y, { r = 0.016, bell = 0.026 } = {}) => [
  P('Scope Tube', cyl(r, r, z1 - z0 - 0.1, 22), mat, WPN, { position: W([0, y, (z0 + z1) / 2]), rotation: ALONG_Z }),
  P('Scope Eyepiece', cyl(r * 1.35, r * 1.2, 0.07, 22), mat, WPN, { position: W([0, y, z0 + 0.035]), rotation: ALONG_Z }),
  P('Scope Objective', cyl(bell, r, 0.08, 24), mat, WPN, { position: W([0, y, z1 - 0.04]), rotation: ALONG_Z }),
  P('Scope Lens', cyl(bell * 0.9, bell * 0.9, 0.002, 24), glass, WPN, { position: W([0, y, z1 + 0.001]), rotation: ALONG_Z, castShadow: false }),
  P('Elevation Turret', gearTube(0.011, 0.016, 20, 0.08), mat, WPN, { position: W([0, y + r + 0.006, (z0 + z1) / 2]), rotation: [-90, 0, 0] }),
  P('Windage Turret', gearTube(0.011, 0.016, 20, 0.08), mat, WPN, { position: W([-(r + 0.006), y, (z0 + z1) / 2]), rotation: [0, -90, 0] }),
  ...[z0 + 0.1, z1 - 0.12].map((z, i) => P('Scope Ring ' + i, rbox(0.026, 0.03, 0.016, 0.004), mat, WPN, { position: W([0, y - r - 0.004, z]) })),
];
