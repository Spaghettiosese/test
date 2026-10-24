// Four SMGs on existing rigs. The UZI and the MAC-10 keep the MP7's anchors (magazine in the
// grip, a charging knob on top) and reuse its reload with their longer magazines; the MP5SD and
// the MP40 keep the MP5's (magazine ahead of the grip, a hooked charging handle on the left).
import { P, rbox, cyl, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset } from './rig.js';
import { MP7, mp7Actions } from './mp7.js';
import { SMG, mp5Actions } from './smg.js';
import { arrayZ, flashParts, WPN } from './kit.js';

const COMMON = {
  steel: { color: '#2c2e31', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 3 },
  dark: { color: '#070707', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  copper: { color: '#b86c3a', roughness: 0.3, metallic: 1 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};
const MAG = { bone: 'mag' }, CH = { bone: 'charge' };

// ---------------------------------------------------------------- MP7-rig guns
const W7 = (p) => offset(MP7.W0, p);
const B7 = 0.045;
const gz = (y) => -0.052 + 0.22 * y; // the MP7's grip slant: the grip and its magazine lean back
const slant = (y0, y1, front, back) => [[gz(y0) + front, y0], [gz(y1) + front, y1], [gz(y1) - back, y1], [gz(y0) - back, y0]];
const gripMag = (yBot, mat, floor) => [
  P('Magazine', profile(slant(0.004, yBot, 0.012, 0.014), 0.021, 0.002), mat, MAG, { position: W7([0, 0, 0]), rotation: SIDE }),
  P('Mag Baseplate', profile(slant(yBot + 0.004, yBot - 0.008, 0.016, 0.018), 0.028, 0.003), floor, MAG, { position: W7([0, 0, 0]), rotation: SIDE }),
  P('Top Round', { type: 'capsule', radius: 0.0045, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W7([0, 0.008, gz(0.008) + 0.001]), rotation: ALONG_Z }),
];
const grip7 = (mat) => P('Pistol Grip', profile([[gz(-0.006) + 0.024, -0.006], [gz(-0.12) + 0.022, -0.12], [gz(-0.124) - 0.024, -0.124], [gz(-0.006) - 0.026, -0.006]], 0.034, 0.007), mat, WPN, { position: W7([0, 0, 0]), rotation: SIDE });
const trigger7 = (mat) => [
  P('Trigger Guard', torus(0.02, 0.0036, { tubularSegments: 24 }), mat, WPN, { position: W7([0, -0.03, -0.006]), rotation: [0, 0, 90], scale: [1, 1, 1.35] }),
  P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.026], [-0.004, -0.036], [-0.008, -0.033], [-0.003, -0.022]], 0.006, 0.0012), 'steel', WPN, { position: W7([0, 0, 0]), rotation: SIDE }),
];
const WRAP_UNDER = (z, y = -0.004) => ({ support: { p: [0.052, y, z], r: [0, -4, -70] }, supportPose: HANDS.wrap });

// UZI: a stamped box with grooved sides, the top cover's cocking knob, a grip safety and a long
// 32-round magazine through the grip; folding metal stock, unfolded
export const UZI = {
  ...MP7, id: 'uzi', name: 'UZI',
  materials: { ...COMMON, park: { color: '#2b2d2e', roughness: 0.6, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.6 }, poly: { color: '#151617', roughness: 0.8, pattern: 'checker', patternScale: 240, patternColor: '#0a0a0a', patternStrength: 0.5 } },
  parts: [
    P('Receiver', rbox(0.05, 0.062, 0.34, 0.006), 'park', WPN, { position: W7([0, 0.035, 0.0]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Side Groove L' : 'Side Groove R', rbox(0.002, 0.008, 0.28, 0.001), 'dark', WPN, { position: W7([s * 0.0252, 0.044, 0.0]), modifiers: arrayZ(2, 0, -0.018) })),
    P('Top Cover', rbox(0.046, 0.008, 0.31, 0.003), 'park', WPN, { position: W7([0, 0.068, -0.01]) }),
    P('Knob Slot', rbox(0.008, 0.002, 0.12, 0.0005), 'dark', WPN, { position: W7([0, 0.0725, -0.07]) }),
    P('Ejection Port', rbox(0.002, 0.018, 0.04, 0.001), 'dark', WPN, { position: W7([-0.0254, 0.04, 0.03]) }),
    P('Rear Sight', rbox(0.02, 0.016, 0.018, 0.003), 'park', WPN, { position: W7([0, 0.08, -0.15]) }),
    P('Rear Aperture', torus(0.004, 0.0017, { tubularSegments: 16 }), 'park', WPN, { position: W7([0, 0.096, -0.15]), rotation: [90, 0, 0] }),
    P('Front Sight Base', rbox(0.016, 0.012, 0.016, 0.003), 'park', WPN, { position: W7([0, 0.076, 0.15]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Front Ear L' : 'Front Ear R', rbox(0.003, 0.022, 0.012, 0.001), 'park', WPN, { position: W7([s * 0.008, 0.088, 0.15]) })),
    P('Front Post', rbox(0.0024, 0.016, 0.003, 0.0005), 'steel', WPN, { position: W7([0, 0.089, 0.15]) }),
    P('Barrel Nut', gearTube(0.016, 0.02, 14, 0.12), 'park', WPN, { position: W7([0, B7, 0.18]) }),
    P('Barrel', cyl(0.009, 0.009, 0.04, 16), 'steel', WPN, { position: W7([0, B7, 0.2]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: W7([0, B7, 0.2205]), rotation: ALONG_Z }),
    grip7('poly'),
    P('Grip Safety', profile(slant(-0.016, -0.08, -0.024, 0.03), 0.026, 0.003), 'park', WPN, { position: W7([0, 0, 0]), rotation: SIDE }),
    ...trigger7('park'),
    P('Selector', rbox(0.004, 0.008, 0.022, 0.0015), 'steel', WPN, { position: W7([0.026, 0.008, -0.04]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Stock Strut L' : 'Stock Strut R', rbox(0.006, 0.01, 0.25, 0.002), 'park', WPN, { position: W7([s * 0.02, 0.02, -0.295]), rotation: [-6, 0, 0] })),
    P('Butt Plate', profile([[-0.415, 0.05], [-0.432, 0.05], [-0.438, 0.03], [-0.438, -0.06], [-0.428, -0.07], [-0.415, -0.06]], 0.05, 0.004), 'park', WPN, { position: W7([0, 0, 0]), rotation: SIDE }),
    P('Cocking Knob', sq(0.008, 0.008, 0.009, 0.7, 0.7, 14), 'park', CH, { position: W7([0, 0.078, -0.12]) }),
    ...gripMag(-0.236, 'steel', 'steel'),
    ...flashParts(W7, B7, 0.22, 0.85),
  ],
  points: { muzzle: [0, B7, 0.222], eject: [-0.026, 0.04, 0.03], sightRear: [0, 0.096, -0.15], sightFront: [0, 0.096, 0.15] },
  actions: mp7Actions({ mag: [-0.1, 0], ...WRAP_UNDER(0.11) }),
};

// MAC-10: a compact sheet-metal box, threaded barrel, cocking knob on top, a front strap for the
// support hand, the wire stock collapsed along the sides
export const MAC10 = {
  ...MP7, id: 'mac10', name: 'MAC-10',
  materials: { ...COMMON, park: { color: '#232527', roughness: 0.65, metallic: 0.55, pattern: 'metal', patternScale: 2, patternStrength: 0.6 }, poly: { color: '#141415', roughness: 0.8 }, strap: { color: '#26261f', roughness: 0.95, pattern: 'fabric', patternScale: 200 } },
  parts: [
    P('Receiver', rbox(0.052, 0.07, 0.26, 0.004), 'park', WPN, { position: W7([0, 0.03, 0.0]) }),
    P('Knob Slot', rbox(0.008, 0.002, 0.1, 0.0005), 'dark', WPN, { position: W7([0, 0.0652, -0.07]) }),
    P('Ejection Port', rbox(0.002, 0.016, 0.034, 0.001), 'dark', WPN, { position: W7([-0.0262, 0.04, 0.02]) }),
    P('Rear Aperture', rbox(0.016, 0.014, 0.006, 0.002), 'park', WPN, { position: W7([0, 0.072, -0.11]) }),
    P('Rear Hole', cyl(0.0022, 0.0022, 0.0065, 10), 'dark', WPN, { position: W7([0, 0.074, -0.11]), rotation: ALONG_Z, castShadow: false }),
    ...[1, -1].map((s) => P(s > 0 ? 'Front Ear L' : 'Front Ear R', rbox(0.003, 0.018, 0.01, 0.001), 'park', WPN, { position: W7([s * 0.009, 0.073, 0.11]) })),
    P('Front Post', rbox(0.0024, 0.014, 0.003, 0.0005), 'steel', WPN, { position: W7([0, 0.074, 0.11]) }),
    P('Barrel', cyl(0.0105, 0.0105, 0.05, 16), 'steel', WPN, { position: W7([0, B7, 0.155]), rotation: ALONG_Z }),
    P('Barrel Thread', gearTube(0.0112, 0.03, 18, 0.06), 'steel', WPN, { position: W7([0, B7, 0.163]) }),
    P('Muzzle Bore', cyl(0.005, 0.005, 0.003, 12), 'dark', WPN, { position: W7([0, B7, 0.1805]), rotation: ALONG_Z }),
    P('Front Strap', torus(0.03, 0.004, { tubularSegments: 20, tubeScaleY: 2.5 }), 'strap', WPN, { position: W7([0, -0.012, 0.1]), rotation: [0, 90, 0], scale: [0.8, 1, 1] }),
    grip7('poly'),
    ...trigger7('park'),
    P('Safety', rbox(0.004, 0.006, 0.02, 0.0015), 'steel', WPN, { position: W7([0.027, 0.006, -0.03]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Stock Rod L' : 'Stock Rod R', cyl(0.0035, 0.0035, 0.25, 10), 'steel', WPN, { position: W7([s * 0.029, 0.012, -0.01]), rotation: ALONG_Z })),
    P('Stock Butt', rbox(0.066, 0.012, 0.012, 0.004), 'steel', WPN, { position: W7([0, 0.012, -0.138]) }),
    P('Stock Pad', rbox(0.014, 0.1, 0.012, 0.004), 'steel', WPN, { position: W7([0, -0.03, -0.142]) }),
    P('Cocking Knob', sq(0.0075, 0.009, 0.0075, 0.7, 0.7, 14), 'park', CH, { position: W7([0, 0.074, -0.12]) }),
    ...gripMag(-0.214, 'steel', 'steel'),
    ...flashParts(W7, B7, 0.18, 0.8),
  ],
  points: { muzzle: [0, B7, 0.182], eject: [-0.027, 0.04, 0.02], sightRear: [0, 0.074, -0.11], sightFront: [0, 0.074, 0.11] },
  actions: mp7Actions({ mag: [-0.072, 0], ...WRAP_UNDER(0.07, -0.024) }),
};

// ---------------------------------------------------------------- MP5-rig guns
const W5 = (p) => offset(SMG.W0, p);
const B5 = 0.035, TUBE = 0.061, SIGHT5 = 0.086;

// MP5SD6: the MP5 with its integral suppressor, a slim SD handguard and the front sight on the can
const SD_DROP = ['Front Sight Base', 'Front Sight Hood', 'Front Sight Post', 'Handguard', 'Handguard Groove L', 'Handguard Groove R', 'Barrel', 'Barrel Lugs', 'Muzzle Bore', 'Front Sling Loop', 'Muzzle Flash', 'Flash Core'];
export const MP5SD = {
  ...SMG, id: 'mp5sd', name: 'MP5SD6',
  materials: { ...SMG.materials, can: { color: '#1f2022', roughness: 0.62, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.5 } },
  parts: [
    ...SMG.parts.filter((p) => !SD_DROP.includes(p.name)),
    P('SD Handguard', rbox(0.04, 0.036, 0.12, 0.013, 2), 'polymer', WPN, { position: W5([0, B5 - 0.006, 0.17]) }),
    P('Suppressor', cyl(0.021, 0.021, 0.27, 24), 'can', WPN, { position: W5([0, B5, 0.268]), rotation: ALONG_Z }),
    P('Suppressor Cap', cyl(0.0215, 0.019, 0.012, 24), 'can', WPN, { position: W5([0, B5, 0.408]), rotation: ALONG_Z }),
    P('Suppressor Bore', cyl(0.005, 0.005, 0.003, 12), 'dark', WPN, { position: W5([0, B5, 0.4145]), rotation: ALONG_Z }),
    P('Front Sight Base', rbox(0.012, 0.022, 0.016, 0.003), 'paint', WPN, { position: W5([0, 0.064, 0.37]) }),
    P('Front Sight Hood', torus(0.011, 0.0026, { tubularSegments: 24 }), 'paint', WPN, { position: W5([0, SIGHT5, 0.37]), rotation: [90, 0, 0], scale: [1, 3, 1] }),
    P('Front Sight Post', cyl(0.0014, 0.002, 0.012, 8), 'steel', WPN, { position: W5([0, SIGHT5 - 0.006, 0.37]) }),
    ...flashParts(W5, B5, 0.414, 0.45),
  ],
  points: { ...SMG.points, muzzle: [0, B5, 0.416], sightFront: [0, SIGHT5, 0.37] },
};

// MP40: a round receiver tube, bakelite lower and grip, a long straight 32-round magazine in its
// housing, the bolt handle on the left that locks up into the safety notch, underfolding stock open
const MP40_KNOB = [0.044, B5, -0.06];
export const MP40 = {
  ...SMG, id: 'mp40', name: 'MP40',
  materials: {
    ...COMMON,
    blued: { color: '#24272b', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
    bakelite: { color: '#2a1d16', roughness: 0.45, pattern: 'leather', patternScale: 200, patternColor: '#170f0b', patternStrength: 0.4 },
  },
  bones: [
    { name: 'charge', head: [0, B5, -0.06] },
    { name: 'chargeRot', parent: 'charge', head: [0, B5, -0.06], tail: [0.04, B5, -0.06] },
    { name: 'flash', head: [0, B5, 0.35], tail: [0, B5, 0.4] },
  ],
  parts: [
    P('Receiver', cyl(0.02, 0.02, 0.3, 22), 'blued', WPN, { position: W5([0, B5, -0.01]), rotation: ALONG_Z }),
    P('Receiver Ribs', gearTube(0.0205, 0.12, 10, 0.05), 'blued', WPN, { position: W5([0, B5, -0.1]) }),
    P('End Cap', cyl(0.0215, 0.0215, 0.012, 22), 'blued', WPN, { position: W5([0, B5, -0.164]), rotation: ALONG_Z }),
    P('Handle Slot', rbox(0.002, 0.007, 0.12, 0.001), 'dark', WPN, { position: W5([0.0196, B5, -0.08]) }),
    P('Safety Notch', rbox(0.002, 0.012, 0.008, 0.001), 'dark', WPN, { position: W5([0.0196, B5 + 0.007, -0.15]) }),
    P('Ejection Port', rbox(0.002, 0.014, 0.04, 0.001), 'dark', WPN, { position: W5([-0.0196, B5, 0.03]) }),
    P('Lower Frame', profile([[-0.165, 0.02], [0.03, 0.02], [0.03, -0.004], [0.002, -0.012], [-0.12, -0.012], [-0.165, 0.0]], 0.03, 0.005), 'bakelite', WPN, { position: W5([0, 0, 0]), rotation: SIDE }),
    P('Pistol Grip', profile([[-0.03, -0.012], [-0.077, -0.012], [-0.1, -0.108], [-0.091, -0.122], [-0.056, -0.122], [-0.05, -0.1], [-0.046, -0.07], [-0.041, -0.052], [-0.036, -0.032]], 0.032, 0.008), 'bakelite', WPN, { position: W5([0, 0, 0]), rotation: SIDE }),
    P('Trigger Guard', torus(0.019, 0.0034, { tubularSegments: 24 }), 'blued', WPN, { position: W5([0, -0.03, -0.004]), rotation: [0, 0, 90], scale: [1, 1, 1.35] }),
    P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.028], [-0.004, -0.038], [-0.008, -0.035], [-0.003, -0.025]], 0.006, 0.0012), 'steel', WPN, { position: W5([0, 0, 0]), rotation: SIDE }),
    P('Mag Housing', rbox(0.032, 0.064, 0.046, 0.004), 'blued', WPN, { position: W5([0, -0.012, 0.055]) }),
    P('Mag Release', cyl(0.006, 0.006, 0.006, 12), 'steel', WPN, { position: W5([0.019, -0.03, 0.055]), rotation: [0, 0, 90] }),
    P('Barrel', cyl(0.0095, 0.0095, 0.2, 18), 'blued', WPN, { position: W5([0, B5, 0.24]), rotation: ALONG_Z }),
    P('Barrel Nut', gearTube(0.0175, 0.022, 14, 0.12), 'blued', WPN, { position: W5([0, B5, 0.145]) }),
    P('Rest Bar', rbox(0.01, 0.016, 0.034, 0.002), 'blued', WPN, { position: W5([0, B5 - 0.018, 0.3]) }),
    P('Muzzle Nut', cyl(0.012, 0.012, 0.014, 16), 'blued', WPN, { position: W5([0, B5, 0.337]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: W5([0, B5, 0.3445]), rotation: ALONG_Z }),
    P('Front Sight Base', rbox(0.012, 0.03, 0.014, 0.003), 'blued', WPN, { position: W5([0, 0.058, 0.315]) }),
    P('Front Hood', torus(0.011, 0.0024, { tubularSegments: 24, arc: 200 }), 'blued', WPN, { position: W5([0, 0.07, 0.315]), rotation: [90, 0, 0], scale: [1, 2.6, 1] }),
    P('Front Post', rbox(0.0024, 0.014, 0.003, 0.0006), 'steel', WPN, { position: W5([0, 0.069, 0.315]) }),
    P('Rear Sight', rbox(0.016, 0.018, 0.008, 0.002), 'blued', WPN, { position: W5([0, 0.065, -0.04]) }),
    P('Rear Notch', rbox(0.004, 0.006, 0.0085, 0), 'dark', WPN, { position: W5([0, 0.072, -0.04]), castShadow: false }),
    ...[1, -1].map((s) => P(s > 0 ? 'Stock Strut L' : 'Stock Strut R', rbox(0.005, 0.012, 0.26, 0.002), 'blued', WPN, { position: W5([s * 0.017, 0.0, -0.29]), rotation: [-5, 0, 0] })),
    P('Butt Plate', profile([[-0.415, 0.036], [-0.432, 0.036], [-0.438, 0.02], [-0.438, -0.07], [-0.43, -0.08], [-0.415, -0.07]], 0.048, 0.004), 'blued', WPN, { position: W5([0, 0, 0]), rotation: SIDE }),
    P('Charging Stem', cyl(0.0035, 0.0035, 0.024, 10), 'steel', { bone: 'chargeRot' }, { position: W5([0.032, B5, -0.06]), rotation: [0, 0, 90] }),
    P('Charging Knob', sq(0.008, 0.009, 0.009, 0.8, 0.8, 14), 'bakelite', { bone: 'chargeRot' }, { position: W5(MP40_KNOB) }),
    P('Magazine', rbox(0.024, 0.28, 0.034, 0.003), 'blued', MAG, { position: W5([0, -0.12, 0.055]) }),
    P('Mag Ribs', rbox(0.0252, 0.004, 0.026, 0.001), 'dark', MAG, { position: W5([0, -0.06, 0.055]), modifiers: arrayZ(6, 0, -0.03), castShadow: false }),
    P('Mag Floor', rbox(0.028, 0.009, 0.038, 0.003), 'blued', MAG, { position: W5([0, -0.262, 0.055]) }),
    P('Top Round', { type: 'capsule', radius: 0.0048, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W5([0, 0.024, 0.06]), rotation: ALONG_Z }),
    ...flashParts(W5, B5, 0.344, 0.85),
  ],
  points: { muzzle: [0, B5, 0.346], eject: [-0.021, B5 + 0.004, 0.03], sightRear: [0, 0.072, -0.04], sightFront: [0, 0.072, 0.315] },
  actions: mp5Actions({ mag: [-0.042, -0.078], support: { p: [0.05, 0.01, 0.135] } }),
};
