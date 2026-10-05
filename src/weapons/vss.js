// VS-9 Whisper, first person: a quiet marksman rifle with a thick integral suppressor over a
// perforated barrel, a slim matte receiver, a short side-mounted scope, a skeleton stock with a
// cut-out and a twenty-round box magazine. Moving parts: the magazine, the charging handle on
// the right and a faint muzzle glow (suppressed: there is almost no flash).
// Actions: Idle, Fire (semi-automatic, soft), Reload, Reload Empty (also racks the handle), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.075, -0.15, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.04;
const MAG_SEAT = [0, -0.02, 0.05];
const KNOB = [-0.026, 0.044, 0.02];
const SCOPE_Y = 0.106;
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const VSS_POINTS = { muzzle: [0, BORE, 0.7], eject: [-0.03, 0.045, 0.02], sightRear: [0, SCOPE_Y, -0.06], sightFront: [0, SCOPE_Y, 0.1] };
const magBack = (y) => 0.02 + 1.1 * y * y - 0.05 * y;

const MATERIALS = {
  steel: { color: '#2d3033', roughness: 0.5, metallic: 0.85, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  matte: { color: '#34383a', roughness: 0.7, metallic: 0.5, pattern: 'metal', patternScale: 2, patternStrength: 0.3 },
  can: { color: '#1d2022', roughness: 0.62, metallic: 0.7, pattern: 'metal', patternScale: 4, patternStrength: 0.5 },
  poly: { color: '#24262a', roughness: 0.75, pattern: 'leather', patternScale: 260, patternColor: '#0b0b0b', patternStrength: 0.5 },
  wood: { color: '#6c4325', roughness: 0.42, pattern: 'walnut', patternScale: 22, patternColor: '#341b0b', sheen: 0.2 },
  rubber: { color: '#101010', roughness: 0.92 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.55, doubleSided: true },
  dark: { color: '#050505', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 16, opacity: 0.55, doubleSided: true },
};

const GUN = [
  P('Receiver', profile([[-0.16, 0.012], [0.12, 0.012], [0.12, 0.06], [-0.16, 0.06]], 0.032, 0.007), 'matte', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Cover', profile([[-0.15, 0.058], [-0.1, 0.07], [0.1, 0.07], [0.12, 0.06]], 0.032, 0.005), 'matte', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.018, 0.06, 0.001), 'dark', WPN, { position: W([-0.0172, 0.044, 0.03]) }),
  P('Side Rail', rbox(0.006, 0.03, 0.16, 0.002), 'steel', WPN, { position: W([0.019, 0.04, 0.0]) }),
  P('Safety Lever', rbox(0.004, 0.006, 0.06, 0.0015), 'steel', WPN, { position: W([-0.0175, 0.022, -0.03]) }),
  P('Magwell', rbox(0.03, 0.03, 0.05, 0.004), 'matte', WPN, { position: W([0, 0.0, 0.05]) }),
  // ---- the suppressor: thick can, vented barrel inside, end cap
  P('Perforated Barrel', cyl(0.0105, 0.0105, 0.2, 16), 'steel', WPN, { position: W([0, BORE, 0.2]), rotation: ALONG_Z }),
  P('Vent Holes', rbox(0.0212, 0.0212, 0.004, 0.001), 'dark', WPN, { position: W([0, BORE, 0.12]), modifiers: array(8, 0.016), castShadow: false }),
  P('Suppressor Can', cyl(0.0205, 0.0205, 0.44, 24), 'can', WPN, { position: W([0, BORE, 0.47]), rotation: ALONG_Z }),
  P('Can Rear Collar', cyl(0.0225, 0.0225, 0.02, 24), 'steel', WPN, { position: W([0, BORE, 0.255]), rotation: ALONG_Z }),
  ...[0.34, 0.42, 0.5, 0.58, 0.64].map((z, i) => P('Can Ring ' + i, cyl(0.0222, 0.0222, 0.007, 24), 'steel', WPN, { position: W([0, BORE, z]), rotation: ALONG_Z })),
  P('Can Front Cap', cyl(0.0215, 0.0195, 0.02, 24), 'steel', WPN, { position: W([0, BORE, 0.69]), rotation: ALONG_Z }),
  P('Muzzle Bore', cyl(0.0065, 0.0065, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.7005]), rotation: ALONG_Z }),
  P('Handguard', rbox(0.04, 0.03, 0.2, 0.01), 'poly', WPN, { position: W([0, 0.034, 0.2]) }),
  P('Lower Handguard', profile([[0.12, 0.02], [0.3, 0.02], [0.3, -0.004], [0.26, -0.016], [0.13, -0.016], [0.12, 0.0]], 0.04, 0.01), 'poly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- short scope on the side rail
  P('Scope Mount', rbox(0.034, 0.036, 0.07, 0.006), 'steel', WPN, { position: W([0, 0.082, 0.0]) }),
  P('Scope Tube', cyl(0.0165, 0.0165, 0.12, 22), 'steel', WPN, { position: W([0, SCOPE_Y, 0.01]), rotation: ALONG_Z }),
  P('Objective Bell', cyl(0.0165, 0.025, 0.03, 22), 'steel', WPN, { position: W([0, SCOPE_Y, 0.085]), rotation: ALONG_Z }),
  P('Eyepiece', cyl(0.0225, 0.019, 0.03, 20), 'poly', WPN, { position: W([0, SCOPE_Y, -0.062]), rotation: ALONG_Z }),
  P('Objective Lens', cyl(0.0235, 0.0235, 0.002, 20), 'lens', WPN, { position: W([0, SCOPE_Y, 0.1005]), rotation: ALONG_Z, castShadow: false }),
  P('Eyepiece Lens', cyl(0.0165, 0.0165, 0.002, 18), 'lens', WPN, { position: W([0, SCOPE_Y, -0.0775]), rotation: ALONG_Z, castShadow: false }),
  P('Elevation Turret', cyl(0.009, 0.009, 0.014, 12), 'steel', WPN, { position: W([0, SCOPE_Y + 0.022, 0.0]) }),
  // ---- trigger group, skeleton stock
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'steel', WPN, { position: W([0, -0.03, 0.002]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, 0.012], [0.004, 0.012], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.012], [-0.07, -0.012], [-0.094, -0.1], [-0.082, -0.116], [-0.052, -0.116], [-0.046, -0.098], [-0.042, -0.07], [-0.036, -0.04]], 0.03, 0.007), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock Top Bar', rbox(0.022, 0.016, 0.28, 0.005), 'wood', WPN, { position: W([0, 0.046, -0.31]) }),
  P('Stock Lower Bar', rbox(0.022, 0.016, 0.26, 0.005), 'wood', WPN, { position: W([0, -0.05, -0.29]), rotation: [-14, 0, 0] }),
  P('Stock Rear Strut', rbox(0.022, 0.14, 0.016, 0.005), 'wood', WPN, { position: W([0, -0.02, -0.435]) }),
  P('Stock Front Strut', rbox(0.022, 0.1, 0.016, 0.005), 'wood', WPN, { position: W([0, -0.01, -0.17]) }),
  P('Cheek Rest', rbox(0.03, 0.02, 0.12, 0.007), 'wood', WPN, { position: W([0, 0.064, -0.3]) }),
  P('Butt Plate', rbox(0.038, 0.14, 0.012, 0.004), 'rubber', WPN, { position: W([0, -0.02, -0.446]), rotation: [-4, 0, 0] }),
  // ---- charging handle (right)
  P('Handle Arm', cyl(0.0035, 0.0035, 0.024, 10), 'steel', CH, { position: W([-0.0195, 0.044, 0.02]), rotation: [0, 0, 90] }),
  P('Handle Knob', sq(0.007, 0.009, 0.007, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB) }),
  // ---- twenty-round magazine
  P('Magazine', profile([...[0.016, -0.03, -0.08, -0.12, -0.15].map((y) => [magBack(y), y]), ...[-0.15, -0.12, -0.08, -0.03, 0.016].map((y) => [magBack(y) + 0.04, y])], 0.024, 0.003), 'steel', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Rib', rbox(0.0022, 0.12, 0.012, 0.001), 'steel', MAG, { position: W([0.0121, -0.07, magBack(-0.07) + 0.02]), rotation: [-12, 0, 0] }),
  P('Mag Floor', rbox(0.028, 0.008, 0.05, 0.003), 'steel', MAG, { position: W([0, -0.156, magBack(-0.15) + 0.021]), rotation: [-20, 0, 0] }),
  P('Top Round', { type: 'capsule', radius: 0.0058, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.024, 0.052]), rotation: ALONG_Z }),
  P('Top Bullet', sq(0.0055, 0.0055, 0.008, 1, 1, 10), 'copper', MAG, { position: W([0, 0.024, 0.066]) }),
  // ---- a faint glow at the can's end
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.04, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.71]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.016, height: 0.06, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.74]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.034, -0.054, -0.1], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.05, 0.002, 0.2], r: [0, -4, -70] },
  magSeat: MAG_SEAT, magOut: [0, -0.07, 0.01],
  lhMag: { p: [0.03, -0.22, 0.06], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.05, -0.24, 0.16], r: [0, 0, -90] },
  magPose: { p: [-0.07, -0.13, 0.4], r: [-30, -6, 38] },
  kick: { back: 0.025, up: 0.007, pitch: -3.2, yaw: 0.4, roll: -0.5 }, fireDur: 0.24, flashOn: 0.02,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [-0.03, 0.05, -0.03]), r: [-40, 10, 60] }, hookPose: HANDS.hook, back: -0.09 },
});

export const VSS = {
  id: 'vss', name: 'VS-9 Whisper', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.71], tail: [0, BORE, 0.74] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: VSS_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const vssDefinition = (o) => weaponDefinition(VSS, o);
export const createVSS = () => createWeapon(VSS);
