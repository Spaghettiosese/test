// Five more long guns on existing rigs: a Mossberg 590A1 and a SPAS-12 on the pump gun's
// (shell-by-shell loading, the pump racked by the left hand), a sawed-off on the double
// barrel's (the barrels break open on the hinge), an AA-12 on the AK's and a Marlin 1895 on the
// Winchester's lever action.
import { P, rbox, cyl, lathe, gearTube, profile, torus, ALONG_Z, SIDE, offset } from './rig.js';
import { SHOTGUN } from './shotgun.js';
import { DOUBLE } from './double.js';
import { AK47, akActions } from './ak47.js';
import { WINCHESTER } from './winchester.js';
import { arrayZ, flashParts, boxMag, pistolGrip, triggerParts, WPN } from './kit.js';

const FLASH = { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true };
const notFlash = (p) => p.bind.bone !== 'flash';
// a ribbed pump: lathe profile (radius, along) with n grooves
const pumpProfile = (r, half, n) => {
  const pts = [[r - 0.005, -half], [r - 0.001, -half + 0.008], [r, -half + 0.02]];
  const step = (2 * half - 0.05) / n;
  for (let i = 0; i < n; i++) { const z = -half + 0.025 + i * step; pts.push([r, z], [r, z + step * 0.55], [r - 0.0024, z + step * 0.62], [r - 0.0024, z + step * 0.95]); }
  pts.push([r, half - 0.02], [r - 0.001, half - 0.008], [r - 0.005, half]);
  return pts;
};

// ================================================================ pump rig
const WS = (p) => offset(SHOTGUN.W0, p);
const BS = 0.038, PUMP0 = [0, 0.008, 0.27];
const SADDLE = ['Side Saddle', 'Saddle Strap', ...[0, 1, 2, 3].flatMap((i) => ['Saddle Shell ' + i, 'Saddle Head ' + i])];

// Mossberg 590A1: parkerized, a perforated heat shield, ghost-ring sights, black synthetic
// furniture with a corncob pump and the side saddle
const MOSS_SIGHT = 0.078;
export const MOSSBERG = {
  ...SHOTGUN, id: 'mossberg', name: 'Mossberg 590A1',
  materials: {
    ...SHOTGUN.materials,
    blued: { color: '#2a2b2c', roughness: 0.62, metallic: 0.55, pattern: 'metal', patternScale: 2, patternStrength: 0.6 },
    walnut: { color: '#18191a', roughness: 0.82, pattern: 'leather', patternScale: 240, patternColor: '#0a0a0a', patternStrength: 0.5 },
    checkering: { color: '#141515', roughness: 0.9, pattern: 'checker', patternScale: 220, patternColor: '#070707', patternStrength: 0.5 },
    whiteLine: { color: '#141414', roughness: 0.9 },
    hull: { color: '#2c6b35', roughness: 0.42 },
    flash: FLASH,
  },
  parts: [
    ...SHOTGUN.parts.filter((p) => notFlash(p) && !['Pump', 'Vent Rib', 'Rib Posts', 'Front Bead', 'Mid Bead'].includes(p.name)),
    P('Pump', lathe(pumpProfile(0.0245, 0.09, 9), 26), 'walnut', { bone: 'pump' }, { position: WS(PUMP0), rotation: ALONG_Z, scale: [1.08, 1, 1] }),
    P('Heat Shield', rbox(0.03, 0.02, 0.3, 0.006), 'blued', WPN, { position: WS([0, BS + 0.011, 0.44]) }),
    P('Shield Holes', rbox(0.031, 0.006, 0.01, 0.002), 'dark', WPN, { position: WS([0, BS + 0.012, 0.31]), modifiers: arrayZ(10, 0.027), castShadow: false }),
    P('Ghost Ring Base', rbox(0.026, 0.008, 0.03, 0.003), 'blued', WPN, { position: WS([0, 0.068, -0.07]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Ghost Ear L' : 'Ghost Ear R', rbox(0.003, 0.02, 0.014, 0.001), 'blued', WPN, { position: WS([s * 0.0105, 0.078, -0.07]) })),
    P('Ghost Ring', torus(0.0058, 0.0016, { tubularSegments: 18 }), 'steel', WPN, { position: WS([0, MOSS_SIGHT, -0.07]), rotation: [90, 0, 0] }),
    P('Front Ramp', profile([[0.575, 0.05], [0.61, 0.05], [0.606, MOSS_SIGHT + 0.004], [0.596, MOSS_SIGHT + 0.004]], 0.006, 0.0012), 'blued', WPN, { position: WS([0, 0, 0]), rotation: SIDE }),
    ...flashParts(WS, BS, 0.625, 1.3),
  ],
  points: { ...SHOTGUN.points, sightRear: [0, MOSS_SIGHT, -0.07], sightFront: [0, MOSS_SIGHT + 0.004, 0.6] },
};

// SPAS-12: black, the long perforated heat shield, a big ribbed pump, a pistol grip and the
// top-folding stock opened out, with its hook
const SPAS_SIGHT = 0.074;
export const SPAS12 = {
  ...SHOTGUN, id: 'spas12', name: 'SPAS-12',
  materials: {
    ...SHOTGUN.materials,
    blued: { color: '#1f2022', roughness: 0.6, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.5 },
    polymer: { color: '#151617', roughness: 0.75, pattern: 'leather', patternScale: 240, patternColor: '#090909', patternStrength: 0.5 },
    hull: { color: '#1c3f8c', roughness: 0.42 },
    flash: FLASH,
  },
  parts: [
    ...SHOTGUN.parts.filter((p) => notFlash(p) && !['Pump', 'Action Bar L', 'Action Bar R', 'Vent Rib', 'Rib Posts', 'Front Bead', 'Mid Bead', 'Stock', 'Wrist Checkering', 'White Line', 'Recoil Pad', 'Rear Swivel', ...SADDLE].includes(p.name)),
    P('Heat Shield', rbox(0.036, 0.036, 0.42, 0.01), 'blued', WPN, { position: WS([0, BS + 0.002, 0.36]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Shield Holes L' : 'Shield Holes R', rbox(0.0365, 0.008, 0.012, 0.003), 'dark', WPN, { position: WS([0, BS + 0.004 + s * 0.009, 0.17]), modifiers: arrayZ(12, 0.032), castShadow: false })),
    P('Pump', lathe(pumpProfile(0.028, 0.1, 10), 26), 'polymer', { bone: 'pump' }, { position: WS(PUMP0), rotation: ALONG_Z, scale: [1.0, 1.05, 1] }),
    ...[1, -1].map((s) => P(s > 0 ? 'Action Bar L' : 'Action Bar R', rbox(0.0022, 0.006, 0.17, 0.0008), 'steel', { bone: 'pump' }, { position: WS([s * 0.0125, 0.016, 0.1]) })),
    P('Rear Notch', rbox(0.02, 0.012, 0.016, 0.003), 'blued', WPN, { position: WS([0, 0.07, -0.08]) }),
    P('Notch', rbox(0.004, 0.006, 0.0165, 0), 'dark', WPN, { position: WS([0, 0.0745, -0.08]), castShadow: false }),
    ...[1, -1].map((s) => P(s > 0 ? 'Front Ear L' : 'Front Ear R', rbox(0.003, 0.024, 0.012, 0.001), 'blued', WPN, { position: WS([s * 0.009, 0.066, 0.57]) })),
    P('Front Post', rbox(0.0026, 0.016, 0.004, 0.0006), 'blued', WPN, { position: WS([0, SPAS_SIGHT - 0.008, 0.57]) }),
    pistolGrip(WS, 'polymer', -0.032),
    P('Grip Frame', rbox(0.03, 0.016, 0.06, 0.004), 'blued', WPN, { position: WS([0, -0.006, -0.085]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Stock Strut L' : 'Stock Strut R', cyl(0.005, 0.005, 0.32, 10), 'blued', WPN, { position: WS([s * 0.018, 0.046, -0.265]), rotation: ALONG_Z })),
    P('Butt Plate', profile([[-0.42, 0.06], [-0.44, 0.06], [-0.446, 0.04], [-0.446, -0.06], [-0.436, -0.07], [-0.42, -0.055], [-0.425, 0.0]], 0.05, 0.006), 'blued', WPN, { position: WS([0, 0, 0]), rotation: SIDE }),
    P('Stock Hook', torus(0.022, 0.0045, { tubularSegments: 20, arc: 200 }), 'blued', WPN, { position: WS([0, 0.03, -0.36]), rotation: [0, 90, 90] }),
    ...flashParts(WS, BS, 0.625, 1.3),
  ],
  points: { ...SHOTGUN.points, sightRear: [0, SPAS_SIGHT, -0.08], sightFront: [0, SPAS_SIGHT, 0.57] },
};

// ================================================================ double rig
const WD = (p) => offset(DOUBLE.W0, p);
const BD = 0.036, GAP = 0.0118, BREECH = 0.07, SHORT = 0.34;
const BRL = { bone: 'barrels' };
// Sawed-off: barrels cut to 34 cm, a short forend, the stock sawn off behind the grip and two
// exposed hammers
export const SAWEDOFF = {
  ...DOUBLE, id: 'sawedoff', name: 'Sawed-off Double',
  materials: { ...DOUBLE.materials, walnut: { color: '#5a2f15', roughness: 0.42, pattern: 'walnut', patternScale: 28, patternColor: '#2c1306', sheen: 0.25 } },
  parts: [
    ...DOUBLE.parts.filter((p) => notFlash(p) && !['Barrel 0', 'Barrel 1', 'Muzzle Bore 0', 'Muzzle Bore 1', 'Top Rib', 'Bottom Rib', 'Bead', 'Forend', 'Forend Checkering', 'Stock', 'Grip Checkering', 'Grip Cap', 'Recoil Pad'].includes(p.name)),
    ...[-GAP, GAP].map((x, i) => P('Barrel ' + i, cyl(0.0122, 0.0118, SHORT - BREECH, 22), 'blued', BRL, { position: WD([x, BD, (SHORT + BREECH) / 2]), rotation: ALONG_Z })),
    ...[-GAP, GAP].map((x, i) => P('Muzzle Bore ' + i, cyl(0.0094, 0.0094, 0.003, 16), 'dark', BRL, { position: WD([x, BD, SHORT + 0.0005]), rotation: ALONG_Z })),
    P('Top Rib', rbox(0.01, 0.006, SHORT - BREECH - 0.01, 0.002), 'blued', BRL, { position: WD([0, BD + 0.0115, (SHORT + BREECH) / 2]) }),
    P('Bead', { type: 'sphere', radius: 0.0024, widthSegments: 10, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, 'brass', BRL, { position: WD([0, 0.058, SHORT - 0.012]) }),
    P('Forend', profile([[0.13, 0.03], [0.29, 0.03], [0.3, 0.018], [0.29, -0.002], [0.15, -0.006], [0.13, 0.0]], 0.05, 0.01), 'walnut', BRL, { position: WD([0, 0, 0]), rotation: SIDE }),
    P('Grip', profile([[-0.07, 0.052], [-0.12, 0.044], [-0.15, 0.03], [-0.172, -0.01], [-0.18, -0.072], [-0.16, -0.086], [-0.128, -0.082], [-0.108, -0.06], [-0.09, -0.02], [-0.07, 0.0]], 0.043, 0.012), 'walnut', WPN, { position: WD([0, 0, 0]), rotation: SIDE }),
    P('Saw Cut', rbox(0.04, 0.05, 0.004, 0.002), 'checkering', WPN, { position: WD([0, 0.008, -0.172]), rotation: [20, 0, 0] }),
    ...[-1, 1].map((s) => P(s > 0 ? 'Hammer L' : 'Hammer R', profile([[-0.03, 0.05], [-0.022, 0.05], [-0.03, 0.078], [-0.042, 0.084], [-0.046, 0.08], [-0.036, 0.07]], 0.006, 0.0015), 'caseHard', WPN, { position: WD([s * 0.012, 0, 0]), rotation: SIDE })),
    ...flashParts(WD, BD, SHORT, 1.35).map((p) => ({ ...p, position: [p.position[0] + GAP, p.position[1], p.position[2]] })), // the right barrel fires first
  ],
  points: { ...DOUBLE.points, muzzle: [0, BD, SHORT + 0.002], sightFront: [0, 0.058, SHORT - 0.012], sightRear: [0, 0.058, 0.02] },
};

// ================================================================ AK rig
const WA = (p) => offset(AK47.W0, p);
const BA = 0.036;
// AA-12: a boxy receiver with the carry handle and its sights on top, a perforated barrel
// shroud, a straight stock in line with the bore and an 8-round box magazine; fully automatic
const AA_SIGHT = 0.128;
export const AA12 = {
  ...AK47, id: 'aa12', name: 'AA-12',
  materials: {
    ...AK47.materials,
    poly: { color: '#1e1f20', roughness: 0.75, pattern: 'leather', patternScale: 240, patternColor: '#0c0c0c', patternStrength: 0.5 },
    park: { color: '#2b2d2e', roughness: 0.6, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.5 },
    shell: { color: '#a8231b', roughness: 0.45 },
  },
  parts: [
    P('Receiver', rbox(0.056, 0.082, 0.36, 0.008), 'park', WPN, { position: WA([0, 0.03, 0.0]) }),
    P('Receiver Ribs', rbox(0.0565, 0.006, 0.3, 0.002), 'dark', WPN, { position: WA([0, 0.05, 0.0]), modifiers: arrayZ(2, 0, -0.02), castShadow: false }),
    P('Ejection Port', rbox(0.002, 0.022, 0.06, 0.001), 'dark', WPN, { position: WA([-0.0285, 0.045, 0.03]) }),
    ...[-0.11, 0.1].map((z, i) => P(i ? 'Handle Front Post' : 'Handle Rear Post', rbox(0.022, 0.036, 0.024, 0.004), 'park', WPN, { position: WA([0, 0.088, z]) })),
    P('Carry Handle', rbox(0.024, 0.014, 0.25, 0.004), 'park', WPN, { position: WA([0, 0.112, -0.005]) }),
    P('Rear Notch', rbox(0.016, 0.012, 0.012, 0.002), 'park', WPN, { position: WA([0, 0.124, -0.1]) }),
    P('Notch', rbox(0.004, 0.006, 0.0125, 0), 'dark', WPN, { position: WA([0, AA_SIGHT + 0.0, -0.1]), castShadow: false }),
    P('Front Post', rbox(0.003, 0.016, 0.004, 0.0006), 'steel', WPN, { position: WA([0, AA_SIGHT - 0.006, 0.1]) }),
    P('Shroud', rbox(0.04, 0.042, 0.24, 0.008), 'park', WPN, { position: WA([0, BA, 0.3]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Shroud Holes L' : 'Shroud Holes R', rbox(0.0405, 0.01, 0.012, 0.004), 'dark', WPN, { position: WA([0, BA + s * 0.008, 0.2]), modifiers: arrayZ(7, 0.03), castShadow: false })),
    P('Barrel', cyl(0.012, 0.012, 0.04, 18), 'steel', WPN, { position: WA([0, BA, 0.44]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0094, 0.0094, 0.003, 14), 'dark', WPN, { position: WA([0, BA, 0.4605]), rotation: ALONG_Z }),
    P('Stock', rbox(0.05, 0.1, 0.25, 0.012), 'poly', WPN, { position: WA([0, 0.02, -0.3]) }),
    P('Butt Pad', rbox(0.052, 0.11, 0.02, 0.008), 'rubber', WPN, { position: WA([0, 0.02, -0.433]) }),
    pistolGrip(WA, 'poly'),
    ...triggerParts(WA, 'poly', 'steel'),
    P('Magwell', rbox(0.056, 0.03, 0.09, 0.004), 'park', WPN, { position: WA([0, -0.006, 0.07]) }),
    P('Charging Arm', cyl(0.004, 0.004, 0.02, 10), 'steel', { bone: 'chargeRot' }, { position: WA([-0.032, 0.044, 0.02]), rotation: [0, 0, 90] }),
    P('Charging Knob', rbox(0.01, 0.016, 0.01, 0.003), 'park', { bone: 'chargeRot' }, { position: WA([-0.044, 0.044, 0.02]) }),
    ...boxMag(WA, 'poly', { yTop: 0.012, yBot: -0.155, z: 0.07, depth: 0.078, width: 0.05, round: false }),
    P('Mag Shell', cyl(0.0105, 0.0105, 0.05, 14), 'shell', { bone: 'mag' }, { position: WA([0, 0.022, 0.07]), rotation: ALONG_Z }),
    ...flashParts(WA, BA, 0.46, 1.3),
  ],
  points: { muzzle: [0, BA, 0.462], eject: [-0.03, 0.045, 0.03], sightRear: [0, AA_SIGHT, -0.1], sightFront: [0, AA_SIGHT, 0.1] },
  actions: akActions({ mag: [+(-0.163 + 0.27).toFixed(3), +(0.07 - 0.195).toFixed(3)], support: { p: [0.055, 0.004, 0.3] } }),
};

// ================================================================ lever rig
const WL = (p) => offset(WINCHESTER.W0, p);
const BL = 0.036, MAR_SIGHT = 0.078, MUZ = 0.56;
const LEV = { bone: 'lever' };
// Marlin 1895 SBL: stainless with grey laminate, an 18.5" round barrel, a rail and ghost ring
// over the receiver, a fibre-optic front sight and the big loop lever
export const MARLIN = {
  ...WINCHESTER, id: 'marlin', name: 'Marlin 1895 SBL',
  materials: {
    ...WINCHESTER.materials,
    blued: { color: '#b4b7bb', roughness: 0.32, metallic: 1, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
    caseHard: { color: '#9a9da2', roughness: 0.35, metallic: 1 },
    walnut: { color: '#5d5f63', roughness: 0.42, pattern: 'walnut', patternScale: 60, patternColor: '#2c2d30', sheen: 0.2 },
    fiber: { color: '#ff5a1a', roughness: 0.4, emissive: '#ff5a1a', emissiveStrength: 1.4 },
    flash: FLASH,
  },
  parts: [
    ...WINCHESTER.parts.filter((p) => notFlash(p) && !['Barrel', 'Rear Sight Base', 'Buckhorn L', 'Buckhorn R', 'Front Blade', 'Front Dot', 'Muzzle Bore', 'Lever Top', 'Lever Bottom', 'Lever Front', 'Lever Rear', 'Lever Latch', 'Butt Plate'].includes(p.name)),
    P('Barrel', cyl(0.0112, 0.0112, MUZ - 0.1, 20), 'blued', WPN, { position: WL([0, BL, (MUZ + 0.1) / 2]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0058, 0.0058, 0.003, 14), 'dark', WPN, { position: WL([0, BL, MUZ + 0.0005]), rotation: ALONG_Z }),
    P('Receiver Rail', rbox(0.02, 0.008, 0.15, 0.002), 'blued', WPN, { position: WL([0, 0.066, -0.01]) }),
    P('Ghost Ring Base', rbox(0.022, 0.01, 0.02, 0.003), 'blued', WPN, { position: WL([0, 0.074, -0.06]) }),
    P('Ghost Ring', torus(0.0056, 0.0018, { tubularSegments: 18 }), 'blued', WPN, { position: WL([0, MAR_SIGHT, -0.06]), rotation: [90, 0, 0] }),
    P('Front Ramp', profile([[MUZ - 0.04, 0.046], [MUZ - 0.006, 0.046], [MUZ - 0.01, MAR_SIGHT - 0.002], [MUZ - 0.02, MAR_SIGHT - 0.002]], 0.005, 0.001), 'blued', WPN, { position: WL([0, 0, 0]), rotation: SIDE }),
    P('Fiber Optic', cyl(0.0016, 0.0016, 0.012, 8), 'fiber', WPN, { position: WL([0, MAR_SIGHT - 0.0005, MUZ - 0.016]), rotation: ALONG_Z, castShadow: false }),
    P('Butt Pad', profile([[-0.44, 0.048], [-0.458, 0.046], [-0.462, -0.07], [-0.456, -0.078], [-0.44, -0.074]], 0.038, 0.005), 'rubber', WPN, { position: WL([0, 0, 0]), rotation: SIDE }),
    // the big loop: the same hinge, a loop deep enough for a gloved hand
    P('Lever Top', rbox(0.007, 0.006, 0.12, 0.002), 'blued', LEV, { position: WL([0, -0.003, 0.03]) }),
    P('Lever Bottom', rbox(0.009, 0.008, 0.15, 0.003), 'blued', LEV, { position: WL([0, -0.092, 0.03]) }),
    P('Lever Front', rbox(0.009, 0.094, 0.008, 0.003), 'blued', LEV, { position: WL([0, -0.046, 0.104]) }),
    P('Lever Rear', rbox(0.009, 0.094, 0.008, 0.003), 'blued', LEV, { position: WL([0, -0.046, -0.044]) }),
    P('Lever Latch', rbox(0.012, 0.008, 0.012, 0.002), 'caseHard', LEV, { position: WL([0, -0.0035, 0.09]) }),
    ...flashParts(WL, BL, MUZ, 1.15),
  ],
  points: { ...WINCHESTER.points, muzzle: [0, BL, MUZ + 0.002], sightRear: [0, MAR_SIGHT, -0.06], sightFront: [0, MAR_SIGHT, MUZ - 0.016] },
};
