// SV-10 marksman rifle, first person: a slim milled receiver with a side-mounted 4x scope, a long
// fluted barrel under a short wooden handguard, a thumbhole skeleton stock with a cheek rest, a
// ten-round box magazine and the slotted flash hider. Moving parts: the magazine, the charging
// handle on the right and the muzzle flash.
// Actions: Idle, Fire (semi-automatic), Reload, Reload Empty (also racks the handle), Inspect.
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const W0 = [-0.075, -0.155, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.04;
const MAG_SEAT = [0, -0.02, 0.05];
const KNOB = [-0.026, 0.044, 0.02];
const SCOPE_Y = 0.108;
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];
export const DMR_POINTS = { muzzle: [0, BORE, 0.68], eject: [-0.03, 0.045, 0.02], sightRear: [0, SCOPE_Y, -0.075], sightFront: [0, SCOPE_Y, 0.1] };
const magBack = (y) => 0.02 + 1.2 * y * y - 0.05 * y;

const MATERIALS = {
  steel: { color: '#2b2d2f', roughness: 0.42, metallic: 0.92, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#3a3c38', roughness: 0.55, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  wood: { color: '#7a4a25', roughness: 0.4, pattern: 'walnut', patternScale: 22, patternColor: '#3f200d', sheen: 0.25 },
  woodDark: { color: '#5d3418', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#2c1508' },
  poly: { color: '#24262a', roughness: 0.75, pattern: 'leather', patternScale: 260, patternColor: '#0b0b0b', patternStrength: 0.5 },
  rubber: { color: '#101010', roughness: 0.92 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.55, doubleSided: true },
  dark: { color: '#050505', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const GUN = [
  P('Receiver', profile([[-0.15, 0.012], [0.14, 0.012], [0.14, 0.062], [-0.15, 0.062]], 0.034, 0.007), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Receiver Cover', profile([[-0.14, 0.06], [-0.1, 0.074], [0.1, 0.074], [0.14, 0.064], [0.14, 0.058], [-0.14, 0.058]], 0.034, 0.005), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Ejection Port', rbox(0.002, 0.02, 0.06, 0.001), 'dark', WPN, { position: W([-0.0182, 0.044, 0.03]) }),
  P('Side Rail', rbox(0.006, 0.034, 0.18, 0.002), 'park', WPN, { position: W([0.0205, 0.04, 0.0]) }),
  P('Rail Slots', rbox(0.0062, 0.032, 0.004, 0), 'dark', WPN, { position: W([0.0205, 0.04, -0.07]), modifiers: array(12, 0.0145), castShadow: false }),
  // ---- barrel, handguard, hider
  P('Barrel', cyl(0.0095, 0.0095, 0.56, 18), 'steel', WPN, { position: W([0, BORE, 0.4]), rotation: ALONG_Z }),
  P('Barrel Flutes', gearTube(0.0125, 0.22, 10, 0.2), 'steel', WPN, { position: W([0, BORE, 0.5]) }),
  P('Gas Block', rbox(0.022, 0.03, 0.03, 0.006), 'park', WPN, { position: W([0, BORE + 0.006, 0.36]) }),
  P('Gas Tube', cyl(0.0105, 0.0105, 0.2, 14), 'steel', WPN, { position: W([0, 0.066, 0.26]), rotation: ALONG_Z }),
  P('Upper Handguard', rbox(0.04, 0.026, 0.18, 0.012, 2), 'wood', WPN, { position: W([0, 0.058, 0.24]) }),
  P('Lower Handguard', profile([[0.14, 0.03], [0.36, 0.03], [0.36, 0.004], [0.32, -0.012], [0.15, -0.012], [0.14, 0.0]], 0.042, 0.011), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Handguard Grooves', rbox(0.0435, 0.002, 0.004, 0), 'woodDark', WPN, { position: W([0, 0.0, 0.18]), modifiers: array(7, 0.02), castShadow: false }),
  P('Flash Hider', gearTube(0.0135, 0.07, 6, 0.28), 'steel', WPN, { position: W([0, BORE, 0.65]) }),
  P('Muzzle Bore', cyl(0.0055, 0.0055, 0.003, 12), 'dark', WPN, { position: W([0, BORE, 0.6865]), rotation: ALONG_Z }),
  P('Front Sight', rbox(0.004, 0.024, 0.008, 0.001), 'park', WPN, { position: W([0, 0.066, 0.57]) }),
  P('Front Sight Base', rbox(0.016, 0.02, 0.024, 0.004), 'park', WPN, { position: W([0, 0.05, 0.57]) }),
  // ---- scope on the left rail (centre line high)
  P('Scope Mount', rbox(0.036, 0.04, 0.09, 0.006), 'park', WPN, { position: W([0, 0.082, 0.0]) }),
  P('Scope Tube', cyl(0.0185, 0.0185, 0.17, 24), 'steel', WPN, { position: W([0, SCOPE_Y, 0.02]), rotation: ALONG_Z }),
  P('Objective Bell', cyl(0.0185, 0.0285, 0.04, 24), 'steel', WPN, { position: W([0, SCOPE_Y, 0.125]), rotation: ALONG_Z }),
  P('Eyepiece', cyl(0.0255, 0.0215, 0.036, 22), 'poly', WPN, { position: W([0, SCOPE_Y, -0.083]), rotation: ALONG_Z }),
  P('Objective Lens', cyl(0.0265, 0.0265, 0.002, 22), 'lens', WPN, { position: W([0, SCOPE_Y, 0.146]), rotation: ALONG_Z, castShadow: false }),
  P('Eyepiece Lens', cyl(0.019, 0.019, 0.002, 20), 'lens', WPN, { position: W([0, SCOPE_Y, -0.1022]), rotation: ALONG_Z, castShadow: false }),
  P('Elevation Turret', cyl(0.0095, 0.0095, 0.016, 14), 'park', WPN, { position: W([0, SCOPE_Y + 0.025, 0.01]) }),
  P('Windage Turret', cyl(0.0095, 0.0095, 0.016, 14), 'park', WPN, { position: W([0.025, SCOPE_Y, 0.01]), rotation: [0, 0, 90] }),
  P('Adjustment Ring', cyl(0.0205, 0.0205, 0.012, 24), 'park', WPN, { position: W([0, SCOPE_Y, -0.052]), rotation: ALONG_Z }),
  // ---- trigger group, thumbhole stock
  P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'steel', WPN, { position: W([0, -0.03, 0.002]), rotation: [0, 0, 90], scale: [1, 1, 1.4] }),
  P('Trigger', profile([[-0.004, 0.012], [0.004, 0.012], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Stock', profile([[-0.15, 0.056], [-0.2, 0.062], [-0.34, 0.052], [-0.43, 0.04], [-0.44, 0.03], [-0.44, -0.095], [-0.43, -0.102], [-0.36, -0.07], [-0.3, -0.045], [-0.22, -0.034], [-0.14, -0.02], [-0.1, -0.12], [-0.06, -0.125], [-0.048, -0.1], [-0.04, -0.06], [-0.03, -0.03], [-0.06, -0.012]], 0.036, 0.009), 'wood', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Thumbhole', rbox(0.0365, 0.04, 0.07, 0.012), 'dark', WPN, { position: W([0, -0.03, -0.185]), castShadow: false }),
  P('Cheek Rest', rbox(0.034, 0.024, 0.14, 0.008), 'wood', WPN, { position: W([0, 0.07, -0.26]) }),
  P('Butt Plate', rbox(0.038, 0.12, 0.012, 0.004), 'rubber', WPN, { position: W([0, -0.03, -0.446]), rotation: [-4, 0, 0] }),
  P('Safety Lever', rbox(0.004, 0.006, 0.07, 0.0015), 'steel', WPN, { position: W([0.0185, 0.02, -0.03]) }),
  P('Magwell', rbox(0.03, 0.03, 0.05, 0.004), 'steel', WPN, { position: W([0, 0.0, 0.05]) }),
  // ---- charging handle (right)
  P('Handle Arm', cyl(0.0035, 0.0035, 0.024, 10), 'steel', CH, { position: W([-0.0195, 0.044, 0.02]), rotation: [0, 0, 90] }),
  P('Handle Knob', sq(0.007, 0.009, 0.007, 0.8, 0.8, 14), 'steel', CH, { position: W(KNOB) }),
  // ---- ten-round box magazine
  P('Magazine', profile([...[0.016, -0.03, -0.08, -0.12, -0.15].map((y) => [magBack(y), y]), ...[-0.15, -0.12, -0.08, -0.03, 0.016].map((y) => [magBack(y) + 0.04, y])], 0.024, 0.003), 'steel', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Rib', rbox(0.0022, 0.12, 0.012, 0.001), 'steel', MAG, { position: W([0.0121, -0.07, magBack(-0.07) + 0.02]), rotation: [-14, 0, 0] }),
  P('Mag Floor', rbox(0.028, 0.008, 0.05, 0.003), 'steel', MAG, { position: W([0, -0.156, magBack(-0.15) + 0.021]), rotation: [-20, 0, 0] }),
  P('Top Round', { type: 'capsule', radius: 0.0058, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.024, 0.052]), rotation: ALONG_Z }),
  P('Top Bullet', sq(0.0055, 0.0055, 0.008, 1, 1, 10), 'copper', MAG, { position: W([0, 0.024, 0.066]) }),
  // ---- muzzle flash
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.085, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.7]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.03, height: 0.13, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.765]), rotation: [90, 0, 0], castShadow: false }),
];

const actions = rifleActions({
  W0, ready: { p: [...W0], r: [0, 5, -3] },
  gripR: { attach: 'weapon', p: [-0.036, -0.056, -0.118], r: [-66, 0, 2] },
  supportL: { attach: 'weapon', p: [0.052, 0.004, 0.2], r: [0, -4, -70] },
  magSeat: MAG_SEAT, magOut: [0, -0.07, 0.01],
  lhMag: { p: [0.03, -0.22, 0.06], r: [-92, 0, 0] },
  lhSlap: { attach: 'weapon', p: [0.05, -0.24, 0.16], r: [0, 0, -90] },
  magPose: { p: [-0.07, -0.13, 0.4], r: [-30, -6, 38] },
  kick: { back: 0.045, up: 0.012, pitch: -5.4, yaw: 0.6, roll: -0.8 }, fireDur: 0.28, flashOn: 0.03,
  handle: { bone: 'charge', hook: { p: offset(KNOB, [-0.03, 0.05, -0.03]), r: [-40, 10, 60] }, hookPose: HANDS.hook, back: -0.09 },
});

export const DMR = {
  id: 'dmr', name: 'SV-10 Marksman', W0, BORE,
  bones: [{ name: 'charge', head: KNOB }, { name: 'flash', head: [0, BORE, 0.7], tail: [0, BORE, 0.765] }],
  props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
  slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions, points: DMR_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};
export const dmrDefinition = (o) => weaponDefinition(DMR, o);
export const createDMR = () => createWeapon(DMR);
