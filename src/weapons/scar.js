// SC-17 battle rifle, first person: a flat dark-earth receiver with a full-length top rail carrying a
// holographic sight and flip-up irons, a long free-float handguard with slotted sides and a bottom
// rail, a heavy barrel with a slotted flash hider, a folding stock with a cheek riser and a
// twenty-round curved box magazine. Moving parts: the magazine, the side charging handle (right)
// and the muzzle flash.
// Actions: Idle, Fire (heavy automatic), Reload, Reload Empty (also racks the handle), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.085, -0.15, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.038;
const MAG_SEAT = [0, -0.02, 0.045];
const KNOB = [-0.026, 0.05, 0.06];
const SIGHT = 0.104;
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const SCAR_POINTS = { muzzle: [0, BORE, 0.66], eject: [-0.026, 0.05, 0.0], sightRear: [0, SIGHT, 0.02], sightFront: [0, SIGHT, 0.5] };
const magBack = (y) => 0.012 + 1.5 * y * y - 0.08 * y;

const MATERIALS = {
  tan: { color: '#8a7656', roughness: 0.5, metallic: 0.35, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  tanPoly: { color: '#7b6a4c', roughness: 0.78, pattern: 'leather', patternScale: 250, patternColor: '#4f4430', patternStrength: 0.5 },
  steel: { color: '#2b2d2f', roughness: 0.42, metallic: 0.92, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  dark: { color: '#050505', roughness: 0.9 },
  rubber: { color: '#101010', roughness: 0.92 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.35, doubleSided: true },
  dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  // ---- receiver
  P('Lower Receiver', profile([[-0.17, -0.012], [0.1, -0.012], [0.1, 0.034], [-0.17, 0.034]], 0.034, 0.007), 'tan', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Upper Receiver', profile([[-0.18, 0.03], [0.21, 0.03], [0.21, 0.066], [-0.18, 0.066]], 0.038, 0.007), 'tan', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.02, 0.06, 0.001), 'dark', WPN, { position: W([-0.0195, 0.05, 0.03]) }),
  P('Charging Slot', rbox(0.002, 0.008, 0.12, 0.001), 'dark', WPN, { position: W([-0.0195, 0.05, 0.1]), castShadow: false }),
  P('Selector', rbox(0.004, 0.006, 0.026, 0.0015), 'steel', WPN, { position: W([-0.0182, 0.02, -0.05]) }),
  P('Mag Release', cyl(0.0055, 0.0055, 0.006, 12), 'steel', WPN, { position: W([-0.0182, -0.004, 0.032]), rotation: [0, 0, 90] }),
  P('Magwell', rbox(0.032, 0.03, 0.062, 0.004), 'tan', WPN, { position: W([0, -0.01, 0.045]) }),
  // ---- top rail and sights
  P('Top Rail', rbox(0.024, 0.008, 0.52, 0.001), 'steel', WPN, { position: W([0, 0.07, 0.04]) }),
  P('Rail Slots', rbox(0.0242, 0.0032, 0.004, 0), 'dark', WPN, { position: W([0, 0.0745, -0.21]), modifiers: array(38, 0.0135), castShadow: false }),
  P('Holo Base', rbox(0.03, 0.012, 0.07, 0.004), 'steel', WPN, { position: W([0, 0.078, 0.02]) }),
  P('Holo Hood Left', rbox(0.004, 0.036, 0.074, 0.001), 'steel', WPN, { position: W([0.0165, 0.1, 0.02]) }),
  P('Holo Hood Right', rbox(0.004, 0.036, 0.074, 0.001), 'steel', WPN, { position: W([-0.0165, 0.1, 0.02]) }),
  P('Holo Roof', rbox(0.037, 0.005, 0.074, 0.002), 'steel', WPN, { position: W([0, 0.12, 0.02]) }),
  P('Holo Lens', rbox(0.029, 0.034, 0.002, 0.0005), 'lens', WPN, { position: W([0, 0.101, 0.0555]), rotation: [-10, 0, 0], castShadow: false }),
  P('Holo Dot', sph(0.0014, 8, 6), 'dot', WPN, { position: W([0, SIGHT, 0.052]), castShadow: false }),
  P('Flip Rear Sight', rbox(0.014, 0.022, 0.006, 0.0015), 'steel', WPN, { position: W([0, 0.084, -0.1]) }),
  P('Front Sight Base', rbox(0.016, 0.03, 0.03, 0.005), 'steel', WPN, { position: W([0, 0.052, 0.5]) }),
  P('Front Sight Post', rbox(0.004, 0.03, 0.004, 0.0008), 'steel', WPN, { position: W([0, 0.082, 0.5]) }),
  // ---- handguard, barrel, hider
  P('Handguard', rbox(0.046, 0.052, 0.3, 0.012, 2), 'tan', WPN, { position: W([0, 0.043, 0.36]) }),
  P('Handguard Slots', rbox(0.0464, 0.007, 0.022, 0.001), 'dark', WPN, { position: W([0, 0.04, 0.26]), modifiers: array(9, 0.03), castShadow: false }),
  P('Bottom Rail', rbox(0.014, 0.008, 0.24, 0.001), 'steel', WPN, { position: W([0, 0.012, 0.36]) }),
  P('Barrel', cyl(0.0092, 0.0092, 0.16, 16), 'steel', WPN, { position: W([0, BORE, 0.56]), rotation: ALONG_Z }),
  P('Gas Block', rbox(0.02, 0.02, 0.03, 0.005), 'steel', WPN, { position: W([0, 0.062, 0.45]) }),
  P('Flash Hider', gearTube(0.0138, 0.07, 6, 0.28), 'steel', WPN, { position: W([0, BORE, 0.63]) }),
  P('Muzzle Bore', cyl(0.0058, 0.0058, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.6665]), rotation: ALONG_Z }),
  // ---- grip, trigger, stock
  P('Trigger Guard', rbox(0.012, 0.004, 0.07, 0.0015), 'tan', WPN, { position: W([0, -0.05, -0.003]) }),
  P('Trigger Guard Front', rbox(0.012, 0.038, 0.004, 0.0015), 'tan', WPN, { position: W([0, -0.032, 0.03]) }),
  P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.03], [-0.004, -0.042], [-0.008, -0.04], [-0.003, -0.028]], 0.005, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.012], [-0.075, -0.012], [-0.098, -0.105], [-0.086, -0.118], [-0.056, -0.118], [-0.048, -0.1], [-0.045, -0.078], [-0.04, -0.07], [-0.043, -0.058], [-0.036, -0.04]], 0.03, 0.007), 'tanPoly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock Hinge', rbox(0.034, 0.06, 0.024, 0.005), 'steel', WPN, { position: W([0, 0.038, -0.19]) }),
  P('Stock', profile([[-0.2, 0.062], [-0.4, 0.062], [-0.41, 0.052], [-0.41, -0.09], [-0.396, -0.096], [-0.34, -0.056], [-0.28, -0.028], [-0.22, 0.002], [-0.2, 0.03]], 0.04, 0.008), 'tanPoly', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Cheek Riser', rbox(0.034, 0.02, 0.1, 0.008), 'tanPoly', WPN, { position: W([0, 0.074, -0.3]) }),
  P('Butt Pad', rbox(0.042, 0.14, 0.012, 0.004), 'rubber', WPN, { position: W([0, -0.015, -0.416]), rotation: [-4, 0, 0] }),
  // ---- charging handle
  P('Handle Arm', cyl(0.0036, 0.0036, 0.024, 10), 'steel', CH, { position: W([-0.0195, 0.05, 0.06]), rotation: [0, 0, 90] }),
  P('Handle Knob', sq(0.007, 0.009, 0.007, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB) }),
  // ---- twenty-round curved magazine
  P('Magazine', profile([...[0, -0.04, -0.08, -0.12, -0.16].map((y) => [magBack(y), y]), ...[-0.16, -0.12, -0.08, -0.04, 0].map((y) => [magBack(y) + 0.05, y])], 0.024, 0.003), 'tanPoly', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Floor', rbox(0.028, 0.01, 0.06, 0.004), 'steel', MAG, { position: W([0, -0.165, magBack(-0.165) + 0.026]), rotation: [-24, 0, 0] }),
  P('Mag Rib', rbox(0.0022, 0.1, 0.012, 0.001), 'steel', MAG, { position: W([0.0121, -0.08, magBack(-0.08) + 0.024]), rotation: [-14, 0, 0] }),
  P('Top Round', { type: 'capsule', radius: 0.0058, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.01, 0.05]), rotation: ALONG_Z }),
  P('Top Bullet', sq(0.0055, 0.0055, 0.008, 1, 1, 10), 'copper', MAG, { position: W([0, 0.01, 0.064]) }),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.08, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.67]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.028, height: 0.12, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.73]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.036, -0.054, -0.108], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.05, 0.01, 0.24], r: [0, -4, -70] },
  magSeat: MAG_SEAT, magOut: [0, -0.07, 0.01],
  lhMag: { p: [0.03, -0.23, 0.05], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.05, -0.2, 0.12], r: [0, 0, -90] },
  magPose: { p: [-0.07, -0.13, 0.4], r: [-30, -6, 38] },
  kick: { back: 0.04, up: 0.011, pitch: -4.6, yaw: 0.7, roll: -0.8 }, fireDur: 0.2, flashOn: 0.03,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [-0.03, 0.05, -0.03]), r: [-40, 10, 60] }, hookPose: HANDS.hook, back: -0.08 },
});

export const SCAR = {
  id: 'scar', name: 'SC-17 Battle Rifle', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.67], tail: [0, BORE, 0.73] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: SCAR_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const scarDefinition = (o) => weaponDefinition(SCAR, o);
export const createScar = () => createWeapon(SCAR);
