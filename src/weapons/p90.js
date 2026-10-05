// PS-90 personal defence weapon, first person: a smooth bullpup body with a thumbhole grip, a
// 50-round translucent magazine lying along the top rail, a reflex sight, a short barrel with a
// muzzle brake and a left-side charging knob; empty cases drop out of a port under the body.
// Moving parts: the top magazine (slides rearwards to come off), the charging knob and the flash.
// Actions: Idle, Fire (very fast automatic), Reload (slide the magazine back, fit a new one from
// above, slap it forward), Reload Empty (also racks the knob), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.06, -0.14, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.034;
const MAG_SEAT = [0, 0.084, 0.02];
const KNOB = [0.03, 0.05, 0.08];
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const P90_POINTS = { muzzle: [0, BORE, 0.34], eject: [0, -0.03, -0.02], sightRear: [0, 0.125, -0.02], sightFront: [0, 0.125, 0.08] };

const MATERIALS = {
  body: { color: '#2d3033', roughness: 0.66, pattern: 'leather', patternScale: 260, patternColor: '#121315', patternStrength: 0.5 },
  bodyTan: { color: '#8c7b58', roughness: 0.64, pattern: 'leather', patternScale: 260, patternColor: '#5d4f36', patternStrength: 0.5 },
  steel: { color: '#25272a', roughness: 0.42, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#34363a', roughness: 0.55, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  smoke: { color: '#1f2a33', roughness: 0.25, opacity: 0.82, pattern: 'leather', patternScale: 300, patternColor: '#0d1318', patternStrength: 0.25 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#050505', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.5, doubleSided: true },
  dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  // ---- body: upper housing, thumbhole stock, grip loop
  P('Upper Housing', profile([[-0.2, 0.012], [-0.18, 0.052], [-0.1, 0.064], [0.12, 0.064], [0.19, 0.05], [0.2, 0.02], [0.2, 0.0], [0.04, -0.012], [-0.2, -0.004]], 0.044, 0.012), 'body', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Rear Stock', profile([[-0.2, 0.01], [-0.2, -0.062], [-0.185, -0.085], [-0.12, -0.092], [-0.075, -0.05], [-0.06, -0.01]], 0.04, 0.012), 'body', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Thumbhole', rbox(0.0442, 0.04, 0.06, 0.012), 'dark', WPN, { position: W([0, -0.028, -0.128]), castShadow: false }),
  P('Butt Pad', rbox(0.04, 0.1, 0.012, 0.004), 'rubber', WPN, { position: W([0, -0.04, -0.205]), rotation: [-5, 0, 0] }),
  P('Grip Loop', profile([[0.02, -0.01], [0.006, -0.1], [0.04, -0.118], [0.082, -0.108], [0.088, -0.07], [0.078, -0.01]], 0.034, 0.01), 'body', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Finger Hole', rbox(0.0342, 0.05, 0.034, 0.01), 'dark', WPN, { position: W([0, -0.05, 0.052]), castShadow: false }),
  P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.02]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0.028]), rotation: SIDE }),
  P('Selector', rbox(0.004, 0.006, 0.024, 0.0015), 'steel', WPN, { position: W([0.0235, 0.014, 0.0]) }),
  P('Ejection Port', rbox(0.016, 0.002, 0.05, 0.001), 'dark', WPN, { position: W([0, -0.0125, -0.02]), castShadow: false }),
  P('Port Cover Seam', rbox(0.0445, 0.002, 0.003, 0), 'dark', WPN, { position: W([0, 0.03, 0.15]), castShadow: false }),
  // ---- top rail, sights, magazine rail
  P('Top Rail', rbox(0.026, 0.01, 0.34, 0.002), 'park', WPN, { position: W([0, 0.069, 0.0]) }),
  P('Rail Slots', rbox(0.0262, 0.0032, 0.004, 0), 'dark', WPN, { position: W([0, 0.0745, -0.16]), modifiers: array(24, 0.0135), castShadow: false }),
  P('Reflex Base', rbox(0.03, 0.01, 0.05, 0.003), 'park', WPN, { position: W([0, 0.08, 0.1]) }),
  P('Reflex Hood', profile([[0.082, 0.085], [0.082, 0.125], [0.112, 0.125], [0.12, 0.1], [0.12, 0.085]], 0.032, 0.005), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Reflex Lens', rbox(0.026, 0.034, 0.002, 0.0005), 'lens', WPN, { position: W([0, 0.108, 0.1115]), rotation: [-8, 0, 0], castShadow: false }),
  P('Reflex Dot', sph(0.0014, 8, 6), 'dot', WPN, { position: W([0, 0.108, 0.108]), castShadow: false }),
  // ---- barrel and muzzle brake
  P('Barrel Shroud', cyl(0.0185, 0.0185, 0.07, 18), 'steel', WPN, { position: W([0, BORE, 0.235]), rotation: ALONG_Z }),
  P('Barrel', cyl(0.0085, 0.0085, 0.12, 14), 'steel', WPN, { position: W([0, BORE, 0.26]), rotation: ALONG_Z }),
  P('Muzzle Brake', gearTube(0.0135, 0.05, 6, 0.3), 'steel', WPN, { position: W([0, BORE, 0.31]) }),
  P('Muzzle Bore', cyl(0.005, 0.005, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.3355]), rotation: ALONG_Z }),
  // ---- charging knob (left side)
  P('Knob Stem', cyl(0.004, 0.004, 0.02, 8), 'steel', CH, { position: W([0.0235, 0.05, 0.08]), rotation: [0, 0, 90] }),
  P('Knob', sq(0.0085, 0.012, 0.012, 0.7, 0.7, 12), 'steel', CH, { position: W(KNOB) }),
  // ---- top magazine (slides back to release): translucent with a window of brass
  P('Magazine Body', rbox(0.042, 0.032, 0.25, 0.008), 'smoke', MAG, { position: W([0, 0.094, 0.015]) }),
  P('Mag Floor Plate', rbox(0.044, 0.006, 0.26, 0.003), 'body', MAG, { position: W([0, 0.108, 0.015]) }),
  P('Mag Front Cap', rbox(0.044, 0.034, 0.012, 0.004), 'body', MAG, { position: W([0, 0.094, 0.14]) }),
  P('Mag Rear Cap', rbox(0.044, 0.034, 0.012, 0.004), 'body', MAG, { position: W([0, 0.094, -0.11]) }),
  ...[0, 1, 2, 3, 4, 5].map((i) => P('Round ' + i, { type: 'capsule', radius: 0.0048, length: 0.02, radialSegments: 8, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.092, -0.07 + i * 0.03]), rotation: [0, 0, 90], castShadow: false })),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.06, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.345]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.024, height: 0.1, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.4]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.034, -0.062, 0.0], r: [-62, 0, 2] },
  supportL: { attach: 'weapon', p: [0.052, -0.012, 0.1], r: [0, -2, -80] },
  magSeat: MAG_SEAT, magOut: [0, 0.03, -0.11], magBelowR: [0, 0, 0],
  lhMag: { p: [0.03, 0.22, 0.02], r: [90, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.03, 0.2, 0.0], r: [0, 0, -90] },
  magPose: { p: [-0.05, -0.12, 0.38], r: [-8, 6, -46] },
  kick: { back: 0.02, up: 0.005, pitch: -2.0, yaw: 0.5, roll: -0.5 }, fireDur: 0.08, flashOn: 0.02,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [0.04, 0.04, -0.02]), r: [-40, 10, -60] }, hookPose: HANDS.hook, back: -0.06 },
});

export const P90 = {
  id: 'p90', name: 'PS-90', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.345], tail: [0, BORE, 0.4] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: P90_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const p90Definition = (o) => weaponDefinition(P90, o);
export const createP90 = () => createWeapon(P90);
