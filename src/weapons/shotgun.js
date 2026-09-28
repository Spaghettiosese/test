// Pump-action 12 gauge shotgun, first person: blued receiver, vent-rib barrel with brass
// and ivory beads, a ribbed walnut pump on the magazine tube, a checkered walnut stock with
// a white-line recoil pad, and a side saddle carrying four spare shells. Moving parts: the
// pump (with its action bars), the bolt, a shell for loading, and the muzzle flash.
// Actions: Idle, Fire (shot, then rack), Pump, Reload Start, Insert Shell (loops once per
// shell), Reload End, Inspect.
import { P, rbox, cyl, sph, lathe, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, HIDDEN, k, offset, inFrame, weaponDefinition, createWeapon } from './rig.js';

const W0 = [-0.08, -0.17, 0.27];
const W = (p) => offset(W0, p);
const BORE = 0.038;
const TUBE = 0.006; // magazine tube axis height
const SIGHT = 0.058; // bead height over the rib
const PUMP0 = [0, TUBE + 0.002, 0.27]; // pump centre at rest
const SHELL_SEAT = [0, TUBE, 0.06];
export const SHOTGUN_POINTS = { muzzle: [0, BORE, 0.625], eject: [-0.026, BORE, 0.035], sightRear: [0, SIGHT, 0.0], sightFront: [0, SIGHT, 0.61] };

const MATERIALS = {
  walnut: { color: '#6a381b', roughness: 0.32, pattern: 'walnut', patternScale: 30, patternColor: '#3a1b0a', sheen: 0.3 },
  checkering: { color: '#5a2f16', roughness: 0.55, pattern: 'checker', patternScale: 220, patternColor: '#2a1408', patternStrength: 0.6 },
  blued: { color: '#1f2226', roughness: 0.3, metallic: 0.95, pattern: 'metal', patternScale: 3 },
  steel: { color: '#8e9092', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 4 },
  rubber: { color: '#151313', roughness: 0.88, pattern: 'leather', patternScale: 260 },
  whiteLine: { color: '#e8e2d4', roughness: 0.6 },
  hull: { color: '#a8231b', roughness: 0.42 },
  brass: { color: '#c9a24e', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 1 },
  ivory: { color: '#efe6d0', roughness: 0.35 },
  dark: { color: '#0d0d0e', roughness: 0.9 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

const WPN = { bone: 'weapon' };
const PUMP = { bone: 'pump' };
const SHELL = { bone: 'shell' };
// a 12 gauge shell lying along +Z with its brass head at the back, centred on `c`
const shellParts = (name, c, bind, axis = ALONG_Z, dir = [0, 0, 1]) => [
  P(name + ' Hull', cyl(0.0102, 0.0102, 0.056, 16), 'hull', bind, { position: W(c), rotation: axis }),
  P(name + ' Head', cyl(0.0112, 0.0108, 0.012, 16), 'brass', bind, { position: W(c.map((v, i) => v - dir[i] * 0.03)), rotation: axis }),
];
// ribbed pump profile (radius, along) for the lathe
const PUMP_PROFILE = (() => {
  const pts = [[0.017, -0.088], [0.022, -0.08], [0.0235, -0.068]];
  for (let i = 0; i < 10; i++) { const z = -0.058 + i * 0.012; pts.push([0.0245, z], [0.0245, z + 0.005], [0.0222, z + 0.007], [0.0222, z + 0.011]); }
  pts.push([0.0235, 0.066], [0.022, 0.08], [0.017, 0.088]);
  return pts;
})();

const GUN = [
  // ---- receiver
  P('Receiver', profile([[-0.105, 0.0], [0.105, 0.0], [0.105, 0.058], [0.092, 0.066], [-0.088, 0.066], [-0.105, 0.052]], 0.037, 0.006), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Trigger Plate', profile([[-0.1, 0.002], [0.064, 0.002], [0.064, -0.012], [0.05, -0.014], [-0.09, -0.014], [-0.1, -0.008]], 0.031, 0.003), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Loading Port', rbox(0.024, 0.002, 0.07, 0.001), 'dark', WPN, { position: W([0, -0.0005, 0.065]) }),
  P('Shell Lifter', rbox(0.018, 0.002, 0.05, 0.001), 'steel', WPN, { position: W([0, 0.001, 0.07]) }),
  P('Ejection Port', rbox(0.002, 0.024, 0.074, 0.001), 'dark', WPN, { position: W([-0.0186, BORE, 0.035]) }),
  P('Trigger Guard', torus(0.02, 0.0034, { tubularSegments: 24 }), 'blued', WPN, { position: W([0, -0.032, -0.016]), rotation: [0, 0, 90], scale: [1, 1, 1.45] }),
  P('Trigger', profile([[-0.01, -0.012], [-0.002, -0.012], [-0.006, -0.03], [-0.014, -0.04], [-0.017, -0.037], [-0.01, -0.027]], 0.006, 0.0014), 'blued', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Cross-bolt Safety', cyl(0.0045, 0.0045, 0.036, 12), 'blued', WPN, { position: W([0, -0.006, -0.05]), rotation: [0, 0, 90] }),
  P('Slide Release', rbox(0.004, 0.006, 0.016, 0.0015), 'blued', WPN, { position: W([0.016, -0.012, 0.032]) }),
  ...[-0.06, 0.06].map((z) => P('Receiver Pin ' + z, cyl(0.0035, 0.0035, 0.039, 10), 'steel', WPN, { position: W([0, 0.01, z]), rotation: [0, 0, 90] })),
  // ---- bolt (seen in the ejection port, rides back with the pump)
  P('Bolt', rbox(0.006, 0.02, 0.066, 0.002), 'steel', { bone: 'bolt' }, { position: W([-0.015, BORE, 0.035]) }),
  // ---- barrel, rib, magazine tube
  P('Barrel', cyl(0.0118, 0.0118, 0.52, 22), 'blued', WPN, { position: W([0, BORE, 0.36]), rotation: ALONG_Z }),
  P('Barrel Collar', cyl(0.0145, 0.0145, 0.03, 22), 'blued', WPN, { position: W([0, BORE, 0.116]), rotation: ALONG_Z }),
  P('Vent Rib', rbox(0.008, 0.0026, 0.5, 0.0008), 'blued', WPN, { position: W([0, 0.0545, 0.365]) }),
  P('Rib Posts', rbox(0.004, 0.0055, 0.004, 0), 'blued', WPN, { position: W([0, 0.0512, 0.125]), modifiers: [{ type: 'array', count: 17, offsetX: 0, offsetY: 0, offsetZ: 0.03, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
  P('Front Bead', sph(0.0026, 10, 8), 'brass', WPN, { position: W([0, SIGHT, 0.61]) }),
  P('Mid Bead', sph(0.0018, 10, 8), 'ivory', WPN, { position: W([0, SIGHT - 0.0006, 0.36]) }),
  P('Muzzle Bore', cyl(0.0095, 0.0095, 0.003, 16), 'dark', WPN, { position: W([0, BORE, 0.6205]), rotation: ALONG_Z }),
  P('Magazine Tube', cyl(0.0112, 0.0112, 0.4, 20), 'blued', WPN, { position: W([0, TUBE, 0.3]), rotation: ALONG_Z }),
  P('Barrel Lug', rbox(0.018, 0.04, 0.022, 0.004), 'blued', WPN, { position: W([0, 0.022, 0.49]) }),
  P('Magazine Cap', gearTube(0.0138, 0.032, 22, 0.08, 0.001), 'blued', WPN, { position: W([0, TUBE, 0.516]) }),
  P('Front Swivel', torus(0.008, 0.0018), 'steel', WPN, { position: W([0, TUBE - 0.02, 0.52]), rotation: [0, 90, 0] }),
  // ---- pump (walnut) and action bars
  P('Pump', lathe(PUMP_PROFILE, 26), 'walnut', PUMP, { position: W(PUMP0), rotation: ALONG_Z, scale: [1.08, 1, 1] }),
  ...[1, -1].map((s) => P(s > 0 ? 'Action Bar L' : 'Action Bar R', rbox(0.0022, 0.006, 0.17, 0.0008), 'steel', PUMP, { position: W([s * 0.0125, 0.016, 0.1]) })),
  // ---- side saddle with four shells (left side)
  P('Side Saddle', rbox(0.004, 0.05, 0.1, 0.002), 'rubber', WPN, { position: W([0.0205, 0.032, 0.02]) }),
  ...[-0.015, 0.008, 0.031, 0.054].flatMap((z, i) => [
    P('Saddle Shell ' + i, cyl(0.0102, 0.0102, 0.05, 14), 'hull', WPN, { position: W([0.033, 0.04, z]) }),
    P('Saddle Head ' + i, cyl(0.0112, 0.0112, 0.011, 14), 'brass', WPN, { position: W([0.033, 0.009, z]) }),
  ]),
  P('Saddle Strap', rbox(0.024, 0.012, 0.1, 0.003), 'rubber', WPN, { position: W([0.033, 0.036, 0.02]) }),
  // ---- stock
  P('Stock', profile([[-0.1, 0.06], [-0.13, 0.043], [-0.18, 0.038], [-0.26, 0.05], [-0.43, 0.048], [-0.438, 0.044], [-0.438, -0.1], [-0.43, -0.106], [-0.3, -0.074], [-0.19, -0.05], [-0.14, -0.04], [-0.114, -0.028], [-0.1, -0.014]], 0.043, 0.012), 'walnut', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Wrist Checkering', profile([[-0.12, 0.034], [-0.2, 0.03], [-0.21, -0.044], [-0.13, -0.034]], 0.0445, 0.002), 'checkering', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('White Line', profile([[-0.438, 0.046], [-0.442, 0.046], [-0.442, -0.104], [-0.438, -0.104]], 0.044, 0.001), 'whiteLine', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Recoil Pad', profile([[-0.442, 0.047], [-0.462, 0.047], [-0.466, 0.038], [-0.466, -0.098], [-0.46, -0.108], [-0.442, -0.106]], 0.045, 0.005), 'rubber', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  P('Rear Swivel', torus(0.008, 0.0018), 'steel', WPN, { position: W([0, -0.1, -0.38]), rotation: [0, 90, 0] }),
  // ---- a shell being loaded (moves from the hand into the loading port)
  ...shellParts('Loading Shell', offset(SHELL_SEAT, [0, 0, 0.005]), SHELL),
  // ---- muzzle flash (toggled)
  P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 8, inner: 0.35, radius: 0.085, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.64]), castShadow: false }),
  P('Flash Core', { type: 'cone', radius: 0.04, height: 0.16, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, 0.7]), rotation: [90, 0, 0], castShadow: false }),
];

// ---------------------------------------------------------------- choreography
const GRIP_R = { attach: 'weapon', p: [-0.037, -0.058, -0.14], r: [-62, 0, 4] };
const SUPPORT_L = { attach: 'pump', p: [0.052, -0.03, 0.0], r: [0, -4, -70] };
const READY = { p: [...W0], r: [0, 4, -3] };
const PUMP_BACK = -0.09;
const HIDDEN_SHELL = HIDDEN;
// loading: the gun rolls over so the loading port faces the eye
const ROLLED = { p: [-0.07, -0.17, 0.44], r: [-10, 22, 48] };
const ROLLED2 = { p: [-0.07, -0.168, 0.44], r: [-11, 22, 49] };
const SHELL_BELOW = { p: offset(SHELL_SEAT, [0, -0.04, -0.01]), r: [0, 0, 0] };
const RH_BELOW = { p: [-0.012, -0.075, -0.035], r: [-150, 0, 180] }; // right hand under the port, thumb on the shell
const IN_HAND = { attach: 'hand.R', ...inFrame(RH_BELOW, SHELL_BELOW) };
const FETCH = { attach: 'world', p: [-0.2, -0.62, 0.18], r: [-40, -20, 30] }; // at the shell pouch
const pumpCycle = (t, eject = true) => ({
  pump: [k(t, { v: 0 }), k(t + 0.12, { v: PUMP_BACK }, 'snap'), k(t + 0.16, { v: PUMP_BACK }), k(t + 0.26, { v: 0 }, 'snap')],
  events: [...(eject ? [{ t: t + 0.11, name: 'eject' }] : []), { t: t + 0.12, name: 'pumpBack' }, { t: t + 0.26, name: 'pumpHome' }],
});
const firePump = pumpCycle(0.3), rack = pumpCycle(0.12, false), pressCheck = { pump: [k(0, { v: 0 }), k(2.6, { v: 0 }), k(2.8, { v: -0.035 }), k(3.1, { v: -0.035 }), k(3.2, { v: 0 }, 'snap')] };

const ACTIONS = {
  Idle: {
    duration: 3, loop: true, fps: 20,
    weapon: (t) => { const a = (t / 3) * Math.PI * 2; return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [0.7 * Math.sin(2 * a), 4 + 0.9 * Math.sin(a), -3 + 0.6 * Math.cos(a)] }; },
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(1.5, { pose: { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: HANDS.wrap })],
  },
  Fire: {
    duration: 0.95, fps: 60,
    weapon: [
      k(0, READY),
      k(0.04, { p: offset(W0, [0.006, 0.035, -0.085]), r: [-17, 7, -7] }, 'snap'),
      k(0.26, { p: offset(W0, [0, 0.006, 0.006]), r: [-2, 5, -4] }),
      k(0.36, { p: offset(W0, [0.006, 0.004, -0.004]), r: [-1, 7, -10] }, 'snap'), // rack
      k(0.56, { p: offset(W0, [0.004, 0.0, 0.004]), r: [0.5, 6, -8] }),
      k(0.95, READY),
    ],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.3, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.3, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(0.6, { pose: HANDS.wrap })],
    slides: { pump: firePump.pump, bolt: firePump.pump },
    toggles: { flash: [k(0, { v: 1 }), k(0.045, { v: 1 }, 'hold'), k(0.046, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, ...firePump.events],
  },
  Pump: {
    duration: 0.6, fps: 60,
    weapon: [k(0, READY), k(0.14, { p: offset(W0, [0.006, 0.004, -0.004]), r: [-1, 7, -10] }, 'snap'), k(0.4, { p: offset(W0, [0.004, 0, 0.004]), r: [0.5, 6, -8] }), k(0.6, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(0.1, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(0.45, { pose: HANDS.wrap })],
    slides: { pump: rack.pump, bolt: rack.pump },
    events: rack.events,
  },
  'Reload Start': {
    duration: 0.5, fps: 30,
    weapon: [k(0, READY), k(0.4, ROLLED), k(0.5, ROLLED)],
    handR: [k(0, GRIP_R), k(0.12, GRIP_R), k(0.5, FETCH)],
    handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(0.2, { pose: HANDS.relaxed }), k(0.5, { pose: HANDS.pinch })],
    fingersL: [k(0, { pose: HANDS.wrap })],
    props: { shell: [k(0, HIDDEN_SHELL), k(0.45, HIDDEN_SHELL), k(0.46, IN_HAND, 'hold'), k(0.5, IN_HAND)] },
  },
  'Insert Shell': {
    // starts and ends at the pouch with a shell in hand, so it chains for every shell
    duration: 0.62, fps: 30,
    weapon: [k(0, ROLLED), k(0.28, ROLLED2), k(0.34, { p: offset(ROLLED.p, [0, 0.004, 0.004]), r: [-12, 22, 49] }, 'snap'), k(0.62, ROLLED)],
    handR: [
      k(0, FETCH),
      k(0.2, { attach: 'weapon', ...RH_BELOW, p: offset(RH_BELOW.p, [0, -0.02, 0.0]) }),
      k(0.24, { attach: 'weapon', ...RH_BELOW }),
      k(0.3, { attach: 'weapon', ...RH_BELOW, p: offset(RH_BELOW.p, [0, 0.04, 0.0]) }), // thumb it into the port
      k(0.36, { attach: 'weapon', ...RH_BELOW, p: offset(RH_BELOW.p, [0, 0.04, 0.05]) }, 'snap'), // and forward into the tube
      k(0.62, FETCH),
    ],
    handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pinch }), k(0.24, { pose: HANDS.pinch }), k(0.3, { pose: HANDS.push }), k(0.4, { pose: HANDS.push }), k(0.5, { pose: HANDS.relaxed }), k(0.62, { pose: HANDS.pinch })],
    fingersL: [k(0, { pose: HANDS.wrap })],
    props: {
      shell: [
        k(0, IN_HAND), k(0.24, IN_HAND),
        k(0.3, { attach: 'weapon', ...SHELL_BELOW, p: offset(SHELL_BELOW.p, [0, 0.04, 0]) }),
        k(0.36, { attach: 'weapon', ...SHELL_BELOW, p: offset(SHELL_BELOW.p, [0, 0.04, 0.05]) }, 'snap'),
        k(0.37, HIDDEN_SHELL, 'hold'),
        k(0.58, HIDDEN_SHELL), k(0.59, IN_HAND, 'hold'), k(0.62, IN_HAND),
      ],
    },
    events: [{ t: 0.36, name: 'shellIn' }],
  },
  'Reload End': {
    duration: 0.55, fps: 30,
    weapon: [k(0, ROLLED), k(0.45, READY), k(0.55, READY)],
    handR: [k(0, FETCH), k(0.42, GRIP_R), k(0.55, GRIP_R)],
    handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.relaxed }), k(0.42, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap })],
  },
  Inspect: {
    duration: 4.6, fps: 30,
    weapon: [
      k(0, READY),
      k(0.4, { p: [-0.04, -0.17, 0.34], r: [-4, 26, -10] }),
      k(0.85, { p: [0.01, -0.14, 0.42], r: [-8, 56, -18] }), // left side: side saddle
      k(1.9, { p: [0.014, -0.138, 0.425], r: [-10, 58, -20] }),
      k(2.5, { p: [0.0, -0.14, 0.4], r: [-10, -44, 22] }), // right side: ejection port
      k(3.5, { p: [0.004, -0.138, 0.4], r: [-12, -46, 24] }),
      k(4.1, { p: offset(W0, [0, -0.005, 0]), r: [1, 4, -3] }),
      k(4.6, READY),
    ],
    handR: [k(0, GRIP_R), k(4.6, GRIP_R)],
    handL: [k(0, SUPPORT_L), k(4.6, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.pistolGrip }), k(4.6, { pose: HANDS.pistolGrip })],
    fingersL: [k(0, { pose: HANDS.wrap }), k(2.6, { pose: HANDS.wrap }), k(2.75, { pose: { curl: [0.45, 0.75, 0.8, 0.82, 0.85], spread: 0.03 } }), k(3.3, { pose: HANDS.wrap }), k(4.6, { pose: HANDS.wrap })],
    // press check: the pump comes back far enough to see the shell in the chamber
    slides: { pump: pressCheck.pump, bolt: pressCheck.pump },
    events: [{ t: 3.2, name: 'pumpHome' }],
  },
};

export const SHOTGUN = {
  id: 'shotgun', name: '12 Gauge Pump', W0, BORE,
  bones: [
    { name: 'pump', head: PUMP0, tail: offset(PUMP0, [0, 0, 0.08]) },
    { name: 'bolt', head: [0, BORE, 0.035] },
    { name: 'flash', head: [0, BORE, 0.64], tail: [0, BORE, 0.69] },
  ],
  props: { shell: SHELL_SEAT },
  propsDefault: { shell: HIDDEN_SHELL },
  slides: { pump: 'z', bolt: 'z' },
  toggles: ['flash'],
  toggleDefault: { flash: 0 },
  materials: MATERIALS, parts: GUN, actions: ACTIONS,
  points: SHOTGUN_POINTS,
  firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload Start', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Pump: 'Idle', 'Reload Start': 'Insert Shell', 'Insert Shell': 'Reload End', 'Reload End': 'Idle', Inspect: 'Idle' } },
};

export const shotgunDefinition = (o) => weaponDefinition(SHOTGUN, o);
export const createShotgun = () => createWeapon(SHOTGUN);
