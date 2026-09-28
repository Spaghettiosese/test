// M4A1 carbine, first person. Flat-top upper with an Aimpoint-style red dot co-witnessed
// with the A2 front sight base, ribbed M4 handguard, birdcage flash hider, six-position
// stock, A2 grip and a 30-round polymer magazine. Moving parts: the magazine (hand to
// well), charging handle, bolt carrier (seen through the ejection port) and muzzle flash.
// Actions: Idle, Fire (one round of full auto), Reload, Inspect.
import { P, rbox, cyl, sph, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.085, -0.15, 0.25];
const W = (p) => offset(W0, p);
const BORE = 0.036; // bore axis height in weapon space
const SIGHT = 0.098; // holographic reticle / front post height (the sight line)
const MAG_SEAT = [0, -0.02, 0.038];
export const M4_POINTS = { muzzle: [0, BORE, 0.44], eject: [-0.022, BORE, -0.01], sightRear: [0, SIGHT, -0.024], sightFront: [0, SIGHT, 0.29] };

const MATERIALS = {
  anodized: { color: '#383b3e', roughness: 0.42, metallic: 0.55, pattern: 'metal', patternScale: 3 },
  polymer: { color: '#292b2c', roughness: 0.78, pattern: 'leather', patternScale: 260, patternColor: '#0c0c0c', patternStrength: 0.6 },
  phosphate: { color: '#2f312e', roughness: 0.5, metallic: 0.8, pattern: 'metal', patternScale: 2 },
  nickel: { color: '#9a9c9e', roughness: 0.22, metallic: 1, pattern: 'metal', patternScale: 4 },
  pmag: { color: '#7b6a50', roughness: 0.82, pattern: 'leather', patternScale: 220, patternColor: '#4d4130', patternStrength: 0.5 },
  rubber: { color: '#141414', roughness: 0.9, pattern: 'leather', patternScale: 300 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1, pattern: 'metal', patternScale: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  lens: { color: '#2c4a5a', roughness: 0.05, metallic: 0, opacity: 0.12, doubleSided: true },
  optic: { color: '#3a3b36', roughness: 0.55, metallic: 0.35, pattern: 'metal', patternScale: 3 },
  dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const MAG = { bone: 'mag' };
// back edge of the curved magazine at height y (weapon space); the front edge is 0.058 ahead
const magBack = (y) => 0.008 + 0.9 * y * y - 0.06 * y;

const RIFLE = [
  // ---- upper receiver
  P('Upper Receiver', profile([[-0.135, 0.012], [0.075, 0.012], [0.075, 0.058], [-0.12, 0.058], [-0.135, 0.05]], 0.03, 0.004), 'anodized', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Brass Deflector', sq(0.006, 0.012, 0.014, 0.6, 0.6, 12), 'anodized', WPN, { position: W([-0.016, 0.045, -0.052]) }),
  P('Forward Assist', cyl(0.0075, 0.0075, 0.04, 14), 'anodized', WPN, { position: W([-0.019, 0.046, -0.092]), rotation: [100, 0, 0] }),
  P('Forward Assist Knob', cyl(0.009, 0.009, 0.01, 14), 'phosphate', WPN, { position: W([-0.019, 0.042, -0.114]), rotation: [100, 0, 0] }),
  P('Ejection Port', rbox(0.002, 0.018, 0.06, 0.001), 'rubber', WPN, { position: W([-0.0152, BORE, -0.01]) }),
  P('Dust Cover', rbox(0.002, 0.018, 0.062, 0.001), 'anodized', WPN, { position: W([-0.0175, 0.017, -0.01]), rotation: [0, 0, -12] }),
  P('Top Rail', rbox(0.022, 0.006, 0.2, 0.001), 'anodized', WPN, { position: W([0, 0.061, -0.032]) }),
  P('Rail Teeth', rbox(0.022, 0.004, 0.0055, 0), 'anodized', WPN, { position: W([0, 0.066, -0.127]), modifiers: [{ type: 'array', count: 20, offsetX: 0, offsetY: 0, offsetZ: 0.01, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  // ---- lower receiver
  P('Lower Receiver', profile([[-0.13, 0.012], [0.075, 0.012], [0.075, -0.012], [0.071, -0.05], [0.004, -0.05], [0.0, -0.014], [-0.1, -0.014], [-0.13, -0.004]], 0.028, 0.003), 'anodized', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Magwell Flare', rbox(0.031, 0.008, 0.074, 0.003), 'anodized', WPN, { position: W([0, -0.047, 0.0375]) }),
  P('Trigger Guard', rbox(0.012, 0.004, 0.07, 0.0015), 'anodized', WPN, { position: W([0, -0.05, -0.003]) }),
  P('Trigger Guard Front', rbox(0.012, 0.038, 0.004, 0.0015), 'anodized', WPN, { position: W([0, -0.032, 0.03]) }),
  P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.03], [-0.004, -0.042], [-0.008, -0.04], [-0.003, -0.028]], 0.005, 0.0012), 'phosphate', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Pistol Grip', profile([[-0.03, -0.012], [-0.075, -0.012], [-0.098, -0.105], [-0.086, -0.118], [-0.056, -0.118], [-0.048, -0.1], [-0.045, -0.078], [-0.04, -0.07], [-0.043, -0.058], [-0.036, -0.04]], 0.03, 0.007), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Selector', rbox(0.004, 0.006, 0.024, 0.0015), 'phosphate', WPN, { position: W([0.016, 0.0, -0.056]), rotation: [-30, 0, 0] }),
  P('Mag Release', cyl(0.0055, 0.0055, 0.006, 12), 'phosphate', WPN, { position: W([-0.016, -0.018, 0.012]), rotation: [0, 0, 90] }),
  P('Bolt Catch', rbox(0.004, 0.022, 0.012, 0.002), 'phosphate', WPN, { position: W([0.016, -0.004, 0.0]) }),
  ...[-0.118, 0.066].map((z, i) => P(i ? 'Pivot Pin' : 'Takedown Pin', cyl(0.0045, 0.0045, 0.032, 12), 'phosphate', WPN, { position: W([0, 0.006, z]), rotation: [0, 0, 90] })),
  // ---- buffer tube and stock
  P('Buffer Tube', cyl(0.0155, 0.0155, 0.25, 20), 'anodized', WPN, { position: W([0, BORE - 0.004, -0.255]), rotation: ALONG_Z }),
  P('Castle Nut', gearTube(0.019, 0.01, 8, 0.1), 'phosphate', WPN, { position: W([0, BORE - 0.004, -0.14]) }),
  P('Stock', profile([[-0.235, 0.058], [-0.395, 0.058], [-0.405, 0.05], [-0.405, -0.085], [-0.392, -0.09], [-0.34, -0.052], [-0.28, -0.022], [-0.24, 0.006], [-0.232, 0.03]], 0.04, 0.008), 'polymer', WPN, { position: W([0, 0, 0]), rotation: SIDE, modifiers: [{ type: 'taper', axis: 'z', amount: -0.12, curve: 1 }] }),
  P('Stock Latch', rbox(0.01, 0.018, 0.05, 0.003), 'polymer', WPN, { position: W([0, -0.0, -0.26]) }),
  P('Butt Pad', profile([[-0.405, 0.052], [-0.415, 0.05], [-0.415, -0.086], [-0.405, -0.088]], 0.042, 0.004), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  // ---- charging handle (moves)
  P('Charging Handle', rbox(0.012, 0.007, 0.03, 0.002), 'anodized', { bone: 'charge' }, { position: W([0, 0.053, -0.13]) }),
  P('Charging Handle Wings', rbox(0.052, 0.009, 0.012, 0.003), 'anodized', { bone: 'charge' }, { position: W([0, 0.053, -0.142]) }),
  // ---- bolt carrier, seen in the ejection port (moves)
  P('Bolt Carrier', cyl(0.0125, 0.0125, 0.07, 16), 'nickel', { bone: 'carrier' }, { position: W([-0.004, BORE, -0.012]), rotation: ALONG_Z }),
  // ---- barrel, handguard, front sight
  P('Delta Ring', cyl(0.031, 0.031, 0.014, 24), 'anodized', WPN, { position: W([0, BORE, 0.082]), rotation: ALONG_Z }),
  P('Handguard', gearTube(0.026, 0.165, 18, 0.06, 0.002), 'polymer', WPN, { position: W([0, BORE - 0.002, 0.172]), scale: [1, 1.12, 1] }),
  P('Handguard Cap', cyl(0.024, 0.024, 0.01, 24), 'anodized', WPN, { position: W([0, BORE, 0.26]), rotation: ALONG_Z }),
  P('Barrel', cyl(0.0092, 0.0095, 0.34, 20), 'phosphate', WPN, { position: W([0, BORE, 0.26]), rotation: ALONG_Z }),
  P('Front Sight Base', profile([[0.268, 0.018], [0.302, 0.018], [0.298, 0.05], [0.291, 0.068], [0.279, 0.068], [0.271, 0.05]], 0.022, 0.003), 'phosphate', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', profile([[0.277, 0.064], [0.293, 0.064], [0.29, 0.104], [0.281, 0.104]], 0.0035, 0.001), 'phosphate', WPN, { position: W([s * 0.0085, 0, 0]), rotation: SIDE })),
  P('Front Sight Post', cyl(0.0016, 0.0022, 0.034, 8), 'phosphate', WPN, { position: W([0, SIGHT - 0.017, 0.285]) }),
  P('Bayonet Lug', rbox(0.008, 0.016, 0.02, 0.002), 'phosphate', WPN, { position: W([0, 0.01, 0.295]) }),
  P('Sling Swivel', torus(0.009, 0.0018), 'phosphate', WPN, { position: W([0, 0.004, 0.278]), rotation: [0, 90, 0] }),
  P('Flash Hider', gearTube(0.0115, 0.045, 5, 0.3), 'phosphate', WPN, { position: W([0, BORE, 0.418]) }),
  P('Flash Hider Core', cyl(0.009, 0.0095, 0.05, 16), 'rubber', WPN, { position: W([0, BORE, 0.418]), rotation: ALONG_Z }),
  // ---- holographic sight, co-witnessed with the front post
  P('Sight Base', rbox(0.034, 0.018, 0.105, 0.004), 'optic', WPN, { position: W([0, 0.073, -0.035]) }),
  P('Sight Battery Cap', cyl(0.009, 0.009, 0.012, 16), 'optic', WPN, { position: W([0.019, 0.073, -0.06]), rotation: [0, 0, 90] }),
  P('Sight Buttons', rbox(0.02, 0.008, 0.004, 0.002), 'rubber', WPN, { position: W([0, 0.074, -0.089]) }),
  P('Sight Lever', rbox(0.004, 0.008, 0.028, 0.002), 'anodized', WPN, { position: W([-0.019, 0.068, -0.03]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Hood Wall L' : 'Hood Wall R', rbox(0.004, 0.036, 0.052, 0.0015), 'optic', WPN, { position: W([s * 0.0175, 0.098, 0.0]) })),
  P('Hood Top', rbox(0.039, 0.005, 0.052, 0.002), 'optic', WPN, { position: W([0, 0.1165, 0.0]) }),
  P('Rear Window', rbox(0.031, 0.03, 0.0015, 0), 'lens', WPN, { position: W([0, 0.098, -0.024]), castShadow: false }),
  P('Front Window', rbox(0.031, 0.03, 0.0015, 0), 'lens', WPN, { position: W([0, 0.098, 0.024]), castShadow: false }),
  P('Reticle Ring', torus(0.0042, 0.00028, { tubularSegments: 32, radialSegments: 4 }), 'dot', WPN, { position: W([0, SIGHT, 0.023]), rotation: [90, 0, 0], castShadow: false }),
  P('Reticle Dot', sph(0.0005, 8, 6), 'dot', WPN, { position: W([0, SIGHT, 0.023]), castShadow: false }),
  // folded rear back-up sight
  P('Rear BUIS', rbox(0.018, 0.012, 0.03, 0.003), 'anodized', WPN, { position: W([0, 0.069, -0.105]) }),
  // ---- magazine (moves: out of the well into the left hand)
  P('Magazine', profile([...[0, -0.04, -0.08, -0.12, -0.16, -0.19].map((y) => [magBack(y), y]), ...[-0.19, -0.16, -0.12, -0.08, -0.04, 0].map((y) => [magBack(y) + 0.058, y])], 0.022, 0.003), 'pmag', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Mag Floorplate', rbox(0.026, 0.012, 0.066, 0.004), 'pmag', MAG, { position: W([0, -0.195, magBack(-0.195) + 0.029]), rotation: [-22, 0, 0] }),
  ...[1, -1].map((s) => P(s > 0 ? 'Mag Grip L' : 'Mag Grip R', rbox(0.002, 0.05, 0.046, 0.001), 'rubber', MAG, { position: W([s * 0.0112, -0.1, magBack(-0.1) + 0.029]), rotation: [-12, 0, 0] })),
  P('Top Round', { type: 'capsule', radius: 0.0048, length: 0.046, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0.003, 0.009, 0.032]), rotation: ALONG_Z }),
  P('Top Bullet', { type: 'cone', radius: 0.0042, height: 0.018, radialSegments: 10, heightSegments: 2, capBottom: true, arc: 360 }, 'copper', MAG, { position: W([0.003, 0.009, 0.064]), rotation: ALONG_Z }),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 5, inner: 0.3, radius: 0.06, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.45]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.026, height: 0.11, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.49]), rotation: [90, 0, 0], castShadow: false }),
  ...[0, 72, 144, 216, 288].map((a) => P('Flash Spike ' + a, { type: 'cone', radius: 0.008, height: 0.07, radialSegments: 6, heightSegments: 1, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([Math.sin((a * Math.PI) / 180) * 0.03, BORE + Math.cos((a * Math.PI) / 180) * 0.03, 0.445]), rotation: [0, 0, -a], castShadow: false })),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.036, -0.052, -0.108], r: [-66, 0, 2] };
const SUPPORT_L = { attach: 'weapon', p: [0.052, 0.006, 0.215], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 5, -3] };
const SEATED = { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] };
// left hand around a fresh magazine held just under the well, and the magazine in that hand
const MAG_BELOW = { p: offset(MAG_SEAT, [0, -0.07, 0.012]), r: [4, 0, 0] };
const LH_MAG = { p: [0.03, -0.25, 0.0], r: [-92, 0, 0] };
const IN_HAND = { attach: 'hand.L', ...inFrame(LH_MAG, MAG_BELOW) };
const LH_SLAP = { attach: 'weapon', p: [0.05, -0.245, 0.08], r: [0, 0, -90] };
const CHARGE_BACK = -0.075;
const HOOK_CH = { attach: 'charge', p: [-0.03, -0.035, -0.065], r: [-40, -20, 70] };

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    // one round of automatic fire; restarting it every 80 ms gives ~750 rounds a minute
    duration: 0.16, fps: 60,
    weapon: [k(0, READY), k(0.025, { p: [W0[0] + 0.002, W0[1] + 0.008, W0[2] - 0.032], r: [-3.2, 4.6, -3.6] }, 'snap'), k(0.16, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.16, { pose: HANDS.squeeze })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.03, { pose: { curl: [0.45, 0.7, 0.74, 0.77, 0.8], spread: 0.04 } }, 'snap'), k(0.16, { pose: HANDS.wrap })],
    slides: { carrier: [k(0, { v: 0 }), k(0.02, { v: -0.06 }, 'snap'), k(0.06, { v: 0 }, 'in')] },
    toggles: { flash: [k(0, { v: 1 }), k(0.03, { v: 1 }, 'hold'), k(0.031, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }],
  },
  Reload: {
    duration: 2.7, fps: 30,
    weapon: [
      k(0, READY),
      k(0.3, { p: [-0.075, -0.1, 0.37], r: [-24, -6, 50] }), // rolled over: the magwell faces the eye
      k(0.5, { p: [-0.075, -0.102, 0.37], r: [-22, -6, 48] }),
      k(1.1, { p: [-0.075, -0.1, 0.37], r: [-25, -6, 52] }),
      k(1.26, { p: [-0.073, -0.098, 0.37], r: [-26, -6, 52] }),
      k(1.36, { p: [-0.07, -0.088, 0.37], r: [-29, -6, 53] }, 'snap'), // magazine slapped home
      k(1.6, { p: [-0.06, -0.17, 0.3], r: [-10, 12, -16] }), // top toward the eye: charging handle
      k(1.95, { p: [-0.06, -0.17, 0.3], r: [-10, 12, -18] }),
      k(2.02, { p: [-0.062, -0.175, 0.295], r: [-8, 11, -15] }, 'snap'),
      k(2.45, READY), k(2.7, READY),
    ],
    handR: [
      k(0, GRIP_R), k(0.3, GRIP_R),
      k(0.36, { attach: 'weapon', p: [-0.036, -0.05, -0.104], r: [-66, 0, 2] }), // index presses the mag release
      k(1.45, GRIP_R),
      k(1.62, { attach: 'charge', p: [-0.03, -0.03, -0.075], r: [-30, -20, 60] }),
      k(1.72, HOOK_CH),
      k(1.92, HOOK_CH),
      k(1.98, { attach: 'weapon', p: [-0.07, 0.02, -0.25], r: [-30, -20, 60] }, 'snap'),
      k(2.35, GRIP_R), k(2.7, GRIP_R),
    ],
    handL: [
      k(0, SUPPORT_L),
      k(0.26, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }), // hand on the old magazine
      k(0.36, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }),
      k(0.46, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.02, 0]) }, 'out'), // strips it out
      k(0.64, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }), // to the vest
      k(0.8, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
      k(1.06, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0.01, -0.06, -0.01]) }),
      k(1.14, { attach: 'weapon', ...LH_MAG }),
      k(1.26, { attach: 'weapon', ...LH_MAG, p: offset(LH_MAG.p, [0, 0.07, 0]) }, 'in'), // seated
      k(1.31, { attach: 'weapon', ...LH_SLAP, p: offset(LH_SLAP.p, [0, -0.05, 0]) }),
      k(1.36, LH_SLAP, 'snap'), // palm slap
      k(1.45, { attach: 'weapon', ...LH_SLAP, p: offset(LH_SLAP.p, [0.01, -0.04, 0]) }),
      k(1.72, SUPPORT_L), k(2.7, SUPPORT_L),
    ],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.3, { pose: HANDS.pistolGrip }), k(0.36, { pose: { curl: [0.5, 0.35, 0.82, 0.88, 0.92], spread: 0 } }), k(0.45, { pose: HANDS.pistolGrip }), k(1.45, { pose: HANDS.pistolGrip }), k(1.62, { pose: HANDS.relaxed }), k(1.72, { pose: HANDS.hook }), k(1.92, { pose: HANDS.hook }), k(2.0, { pose: HANDS.flat }, 'snap'), k(2.35, { pose: HANDS.pistolGrip }), k(2.7, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.2, { pose: HANDS.relaxed }), k(0.3, { pose: HANDS.grab }), k(0.5, { pose: HANDS.relaxed }), k(0.7, { pose: HANDS.relaxed }), k(0.8, { pose: HANDS.grab }), k(1.26, { pose: HANDS.grab }), k(1.31, { pose: HANDS.flat }), k(1.5, { pose: HANDS.relaxed }), k(1.72, { pose: HANDS.wrap }), k(2.7, { pose: HANDS.wrap })],
    props: {
      mag: [
        k(0, SEATED), k(0.36, SEATED),
        k(0.46, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.02, 0]) }, 'out'),
        k(0.5, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.02, -0.06, 0]), r: [10, 0, 20] }), // let go: it tumbles away
        k(0.8, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
        k(0.81, HIDDEN, 'hold'),
        k(0.82, { ...IN_HAND }, 'hold'), // a fresh one from the vest
        k(1.14, IN_HAND),
        k(1.26, SEATED, 'in'), k(2.7, SEATED),
      ],
    },
    slides: {
      charge: [k(0, { v: 0 }), k(1.72, { v: 0 }), k(1.92, { v: CHARGE_BACK }), k(1.98, { v: 0 }, 'snap')],
      carrier: [k(0, { v: 0 }), k(1.72, { v: 0 }), k(1.92, { v: CHARGE_BACK }), k(1.98, { v: 0 }, 'snap')],
    },
    events: [{ t: 0.36, name: 'magOut' }, { t: 1.26, name: 'magIn' }, { t: 1.92, name: 'charge' }, { t: 1.98, name: 'boltHome' }],
  },
  Inspect: {
    duration: 4.4, fps: 30,
    weapon: [
      k(0, READY),
      k(0.35, { p: [-0.07, -0.16, 0.3], r: [-4, -24, 8] }),
      k(0.75, { p: [0.0, -0.135, 0.36], r: [-8, -58, 14] }), // right side: ejection port, forward assist
      k(1.6, { p: [0.004, -0.133, 0.365], r: [-10, -60, 16] }),
      k(2.2, { p: [0.0, -0.13, 0.36], r: [-8, 40, -26] }), // left side: selector, bolt catch
      k(3.2, { p: [0.004, -0.13, 0.36], r: [-10, 44, -30] }),
      k(3.7, { p: [-0.06, -0.19, 0.3], r: [4, 10, -8] }),
      k(4.1, { p: [W0[0], W0[1] - 0.005, W0[2]], r: [1, 4, -3] }),
      k(4.4, READY),
    ],
    handR: [
      k(0, GRIP_R), k(2.3, GRIP_R),
      k(2.45, { attach: 'charge', p: [-0.03, -0.03, -0.075], r: [-30, -20, 60] }),
      k(2.55, HOOK_CH), k(2.7, { attach: 'charge', p: HOOK_CH.p, r: HOOK_CH.r }), k(3.0, HOOK_CH),
      k(3.1, { attach: 'weapon', p: [-0.06, 0.0, -0.2], r: [-30, -20, 60] }),
      k(3.35, GRIP_R), k(4.4, GRIP_R),
    ],
    handL: [k(0, SUPPORT_L), k(4.4, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(2.3, { pose: HANDS.pistolGrip }), k(2.45, { pose: HANDS.relaxed }), k(2.55, { pose: HANDS.hook }), k(3.0, { pose: HANDS.hook }), k(3.1, { pose: HANDS.relaxed }), k(3.35, { pose: HANDS.pistolGrip }), k(4.4, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.7, { pose: { curl: [0.4, 0.66, 0.7, 0.74, 0.78], spread: 0.05 } }), k(3.6, { pose: { curl: [0.4, 0.66, 0.7, 0.74, 0.78], spread: 0.05 } }), k(4.4, { pose: HANDS.wrap })],
    // press check: the charging handle comes back far enough to see brass in the chamber
    slides: {
      charge: [k(0, { v: 0 }), k(2.55, { v: 0 }), k(2.7, { v: -0.03 }), k(2.95, { v: -0.03 }), k(3.02, { v: 0 }, 'snap')],
      carrier: [k(0, { v: 0 }), k(2.55, { v: 0 }), k(2.7, { v: -0.03 }), k(2.95, { v: -0.03 }), k(3.02, { v: 0 }, 'snap')],
    },
    events: [{ t: 3.02, name: 'boltHome' }],
  },
};

export const M4A1 = {
  id: 'm4a1', name: 'M4A1', W0, BORE,
  bones: [
    { name: 'charge', head: [0, 0.053, -0.13] },
    { name: 'carrier', head: [0, BORE, -0.012] },
    { name: 'flash', head: [0, BORE, 0.45], tail: [0, BORE, 0.5] },
  ],
  props: { mag: MAG_SEAT },
  propsDefault: { mag: SEATED },
  slides: { charge: 'z', carrier: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: RIFLE, actions: ACTIONS,
  points: M4_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
};

export const m4a1Definition = (o) => weaponDefinition(M4A1, o);
export const createM4A1 = () => createWeapon(M4A1);
