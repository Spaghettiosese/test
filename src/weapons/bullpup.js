// Bullpup assault rifles, first person. The action and the magazine sit behind the pistol grip so
// a full-length barrel fits in a short rifle: a moulded polymer body with a built-in butt pad, a
// vertical foregrip, an integral 1.5x optic (AUG-A3) or a carry-handle with an open rear sight
// (FA-G2), a slotted flash hider and a 30-round magazine in the stock. Moving parts: the magazine,
// the charging handle on the left of the body and the muzzle flash.
// Actions: Idle, Fire (full auto), Reload, Reload Empty (ends by racking the handle), Inspect
// (both flanks, then a press check).
import { P, rbox, cyl, sq, sph, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { rifleActions } from './gen.js';

const BORE = 0.05;
const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
const CH = { bone: 'charge' };

const MATERIALS = {
  body: { color: '#3d4a36', roughness: 0.62, pattern: 'leather', patternScale: 240, patternColor: '#1f261c', patternStrength: 0.5 },
  bodyTan: { color: '#8a7a58', roughness: 0.6, pattern: 'leather', patternScale: 240, patternColor: '#5a4e36', patternStrength: 0.5 },
  bodyGrey: { color: '#5b6066', roughness: 0.58, pattern: 'leather', patternScale: 240, patternColor: '#30343a', patternStrength: 0.5 },
  steel: { color: '#25272a', roughness: 0.42, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
  park: { color: '#34363a', roughness: 0.55, metallic: 0.7, pattern: 'metal', patternScale: 2 },
  polymer: { color: '#1c1d1e', roughness: 0.8, pattern: 'leather', patternScale: 260, patternColor: '#0a0a0a', patternStrength: 0.5 },
  smoke: { color: '#2c3138', roughness: 0.3, opacity: 0.9, pattern: 'leather', patternScale: 300, patternColor: '#13161a', patternStrength: 0.3 },
  rubber: { color: '#101010', roughness: 0.92 },
  dark: { color: '#060606', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.55, doubleSided: true },
  reticle: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 12 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

// v: how this particular rifle differs
function build(v) {
  const W0 = [-0.075, -0.15, 0.2];
  const W = (p) => offset(W0, p);
  const MUZ = v.muzzle, SIGHT = v.optic ? 0.112 : 0.108;
  const MAG_SEAT = [0, -0.016, -0.1];
  const KNOB = [0.034, 0.05, -0.02];
  const magBack = (y) => -0.13 + 0.55 * y * y - 0.1 * y; // the back edge of the slightly forward-curved magazine
  const body = v.body;
  const parts = [
    // ---- moulded body
    P('Body', profile([[-0.3, 0.07], [-0.14, 0.078], [0.1, 0.078], [0.19, 0.068], [0.2, 0.05], [0.2, 0.0], [0.15, -0.016], [0.045, -0.016], [-0.03, -0.022], [-0.14, -0.03], [-0.21, -0.052], [-0.3, -0.07]], 0.05, 0.012), body, WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Cheek Piece', profile([[-0.27, 0.07], [-0.2, 0.086], [-0.12, 0.088], [-0.1, 0.078]], 0.04, 0.008), body, WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Butt Pad', rbox(0.05, 0.145, 0.018, 0.006), 'rubber', WPN, { position: W([0, 0.0, -0.31]), rotation: [-4, 0, 0] }),
    P('Butt Plate Screw', cyl(0.004, 0.004, 0.006, 8), 'steel', WPN, { position: W([0, 0.045, -0.321]), rotation: [90, 0, 0] }),
    P('Ejection Port', rbox(0.002, 0.026, 0.07, 0.001), 'dark', WPN, { position: W([-0.0255, 0.036, 0.0]) }),
    P('Brass Deflector', rbox(0.006, 0.02, 0.026, 0.003), 'park', WPN, { position: W([-0.027, 0.036, 0.05]) }),
    P('Charging Slot', rbox(0.002, 0.008, 0.16, 0.001), 'dark', WPN, { position: W([0.0255, 0.05, 0.03]) }),
    P('Body Seam', rbox(0.0522, 0.003, 0.34, 0.001), 'dark', WPN, { position: W([0, 0.0, 0.0]) }),
    // ---- front end: shroud, barrel, flash hider
    P('Front Shroud', cyl(0.021, 0.021, 0.08, 20), 'steel', WPN, { position: W([0, BORE, 0.235]), rotation: ALONG_Z }),
    P('Shroud Collar', cyl(0.024, 0.024, 0.014, 20), 'park', WPN, { position: W([0, BORE, 0.2]), rotation: ALONG_Z }),
    P('Barrel', cyl(0.0095, 0.0095, MUZ - 0.2, 18), 'steel', WPN, { position: W([0, BORE, (MUZ + 0.2) / 2]), rotation: ALONG_Z }),
    P('Gas Port Block', rbox(0.02, 0.02, 0.03, 0.005), 'park', WPN, { position: W([0, BORE + 0.001, 0.31]) }),
    P('Flash Hider', gearTube(0.0135, 0.045, 6, 0.28), 'steel', WPN, { position: W([0, BORE, MUZ - 0.012]) }),
    P('Muzzle Bore', cyl(0.0052, 0.0052, 0.003, 12), 'dark', WPN, { position: W([0, BORE, MUZ + 0.0105]), rotation: ALONG_Z }),
    // ---- foregrip
    P('Grip Mount', rbox(0.03, 0.014, 0.06, 0.004), 'park', WPN, { position: W([0, -0.02, 0.135]) }),
    P('Foregrip', cyl(0.0155, 0.0135, 0.075, 18), 'polymer', WPN, { position: W([0, -0.062, 0.135]) }),
    P('Foregrip Cap', cyl(0.0138, 0.0138, 0.008, 18), 'polymer', WPN, { position: W([0, -0.103, 0.135]) }),
    ...[0, 1, 2].map((i) => P('Foregrip Groove', torus(0.0145, 0.0012, { tubularSegments: 20 }), 'dark', WPN, { position: W([0, -0.046 - i * 0.017, 0.135]), rotation: [90, 0, 0] })),
    // ---- pistol grip, trigger group
    P('Pistol Grip', profile([[0.05, -0.014], [-0.015, -0.014], [-0.034, -0.1], [-0.03, -0.12], [0.004, -0.128], [0.03, -0.12], [0.044, -0.09], [0.052, -0.05]], 0.034, 0.008), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Grip Panel', rbox(0.036, 0.07, 0.003, 0.001), 'rubber', WPN, { position: W([0, -0.075, 0.0]), rotation: [-14, 0, 0] }),
    P('Trigger Guard', torus(0.022, 0.0035, { tubularSegments: 24 }), 'polymer', WPN, { position: W([0, -0.035, 0.06]), rotation: [0, 0, 90], scale: [1, 1, 1.6] }),
    P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.03], [-0.004, -0.04], [-0.008, -0.038], [-0.003, -0.026]], 0.006, 0.0012), 'steel', WPN, { position: W([0, 0, 0.05]), rotation: SIDE }),
    P('Safety Cross-bolt', cyl(0.006, 0.006, 0.07, 14), 'steel', WPN, { position: W([0, 0.01, 0.03]), rotation: [0, 0, 90] }),
    P('Safety Button', cyl(0.0075, 0.0075, 0.004, 14), 'park', WPN, { position: W([0.036, 0.01, 0.03]), rotation: [0, 0, 90] }),
    P('Mag Release', rbox(0.01, 0.012, 0.02, 0.003), 'park', WPN, { position: W([0.0, -0.025, -0.05]) }),
    // ---- magazine well and magazine (behind the grip)
    P('Magwell', rbox(0.04, 0.03, 0.062, 0.006), body, WPN, { position: W([0, -0.03, -0.1]) }),
    P('Magazine', profile([...[-0.016, -0.05, -0.1, -0.15, -0.19].map((y) => [magBack(y), y]), ...[-0.19, -0.15, -0.1, -0.05, -0.016].map((y) => [magBack(y) + 0.056, y])], 0.03, 0.005), 'smoke', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Mag Floor', rbox(0.034, 0.008, 0.062, 0.003), 'polymer', MAG, { position: W([0, -0.194, magBack(-0.19) + 0.029]) }),
    ...[-0.04, -0.09, -0.14].map((y, i) => P('Mag Window ' + i, rbox(0.0322, 0.01, 0.014, 0.001), 'dark', MAG, { position: W([0, y, magBack(y) + 0.028]), castShadow: false })),
    P('Top Round', { type: 'capsule', radius: 0.0055, length: 0.016, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, -0.012, -0.1]), rotation: ALONG_Z }),
    // ---- charging handle (left of the body), slides back along its slot
    P('Charge Stem', cyl(0.004, 0.004, 0.016, 8), 'steel', CH, { position: W([0.03, 0.05, -0.02]), rotation: [0, 0, 90] }),
    P('Charge Knob', sq(0.007, 0.009, 0.011, 0.7, 0.7, 12), 'steel', CH, { position: W(KNOB) }),
    // ---- muzzle flash
    P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 6, inner: 0.35, radius: 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, MUZ + 0.012]), castShadow: false }),
    P('Flash Core', { type: 'cone', radius: 0.028, height: 0.12, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, MUZ + 0.07]), rotation: [90, 0, 0], castShadow: false }),
  ];
  if (v.optic) { // integral 1.5x optic with a built-in carry handle
    parts.push(
      P('Optic Body', cyl(0.0225, 0.0225, 0.13, 22), 'steel', WPN, { position: W([0, 0.108, 0.01]), rotation: ALONG_Z }),
      P('Optic Front Bell', cyl(0.0225, 0.0285, 0.03, 22), 'steel', WPN, { position: W([0, 0.108, 0.085]), rotation: ALONG_Z }),
      P('Optic Rear Eyecup', cyl(0.0265, 0.0235, 0.032, 22), 'polymer', WPN, { position: W([0, 0.108, -0.065]), rotation: ALONG_Z }),
      P('Front Lens', cyl(0.0255, 0.0255, 0.002, 20), 'lens', WPN, { position: W([0, 0.108, 0.101]), rotation: ALONG_Z, castShadow: false }),
      P('Rear Lens', cyl(0.0215, 0.0215, 0.002, 20), 'lens', WPN, { position: W([0, 0.108, -0.0815]), rotation: ALONG_Z, castShadow: false }),
      P('Optic Mount', rbox(0.036, 0.034, 0.12, 0.006), body, WPN, { position: W([0, 0.082, 0.0]) }),
      P('Windage Turret', cyl(0.0085, 0.0085, 0.012, 12), 'park', WPN, { position: W([0.0275, 0.108, 0.01]), rotation: [0, 0, 90] }),
      P('Elevation Turret', cyl(0.0085, 0.0085, 0.012, 12), 'park', WPN, { position: W([0, 0.1375, 0.01]) }),
      P('Reticle Dot', sph(0.0014, 8, 6), 'reticle', WPN, { position: W([0, 0.108, 0.04]), castShadow: false }),
    );
  } else { // carry handle with a notched rear sight and a front post on the barrel
    parts.push(
      P('Carry Handle', profile([[-0.1, 0.078], [-0.1, 0.1], [-0.085, 0.112], [0.05, 0.112], [0.065, 0.1], [0.065, 0.078]], 0.03, 0.007), body, WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Handle Slot', rbox(0.034, 0.012, 0.09, 0.003), 'dark', WPN, { position: W([0, 0.092, -0.02]), castShadow: false }),
      P('Rear Aperture Block', rbox(0.02, 0.012, 0.016, 0.003), 'park', WPN, { position: W([0, 0.118, -0.082]) }),
      P('Rear Aperture', cyl(0.0035, 0.0035, 0.018, 10), 'dark', WPN, { position: W([0, 0.119, -0.082]), rotation: ALONG_Z, castShadow: false }),
      P('Front Sight Block', rbox(0.016, 0.024, 0.024, 0.004), 'park', WPN, { position: W([0, 0.074, 0.24]) }),
      P('Front Post', rbox(0.003, 0.03, 0.004, 0.0006), 'park', WPN, { position: W([0, 0.098, 0.24]) }),
      P('Bipod Stow Rod', cyl(0.004, 0.004, 0.16, 8), 'steel', WPN, { position: W([0.024, 0.016, 0.12]), rotation: ALONG_Z }),
    );
  }
  const SIGHT_REAR = v.optic ? [0, SIGHT, -0.08] : [0, 0.119, -0.082], SIGHT_FRONT = v.optic ? [0, SIGHT, 0.1] : [0, 0.098, 0.24];
  const points = { muzzle: [0, BORE, MUZ + 0.02], eject: [-0.03, 0.036, 0.0], sightRear: SIGHT_REAR, sightFront: SIGHT_FRONT };

  // ---------------------------------------------------------------- choreography
  const ready = { p: [...W0], r: [0, 5, -3] };
  const actions = rifleActions({
    W0, ready,
    gripR: { attach: 'weapon', p: [-0.04, -0.07, -0.03], r: [-62, 0, 2] },
    supportL: { attach: 'weapon', p: [0.05, -0.118, 0.12], r: [-6, 0, -84] },
    leftPose: { curl: [0.5, 0.66, 0.7, 0.74, 0.78], spread: 0.04 },
    fingersL: { curl: [0.55, 0.7, 0.74, 0.77, 0.8], spread: 0.04 },
    magSeat: MAG_SEAT, magOut: [0, -0.07, -0.01],
    lhMag: { p: [0.032, -0.26, -0.1], r: [-92, 0, 0] },
    lhSlap: { attach: 'weapon', p: [0.05, -0.27, -0.12], r: [0, 0, -90] },
    magPose: { p: [-0.1, -0.1, 0.36], r: [-38, 22, 52] },
    kick: { back: 0.032, up: 0.008, pitch: -3.2, yaw: 0.5, roll: -0.6 }, fireDur: 0.16,
    handle: { bone: 'charge', hook: { p: offset(KNOB, [0.03, 0.04, -0.02]), r: [-40, -10, -60] }, hookPose: HANDS.hook, back: -0.075 },
  });
  const def = {
    id: v.id, name: v.name, W0, BORE,
    bones: [
      { name: 'charge', head: KNOB },
      { name: 'flash', head: [0, BORE, MUZ + 0.012], tail: [0, BORE, MUZ + 0.07] },
    ],
    props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
    slides: { charge: 'z' }, toggles: ['flash'], toggleDefault: { flash: 0 },
    materials: MATERIALS, parts, actions, points,
    firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
  };
  return def;
}

export const AUG = build({ id: 'aug', name: 'AUG-A3', body: 'body', optic: true, muzzle: 0.47 });
export const FAMAS = build({ id: 'famas', name: 'FA-G2', body: 'bodyGrey', optic: false, muzzle: 0.43 });
export const augDefinition = (o) => weaponDefinition(AUG, o);
export const createAug = () => createWeapon(AUG);
export const createFamas = () => createWeapon(FAMAS);
