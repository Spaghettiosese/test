// Ten rifles on existing rigs. The HK416, M16A2 and G36 keep the M4's anchors (grip, magazine
// seat, charging handle at the back of the receiver, bolt carrier in the port) and share its
// animations. The AK-74, AKS-74U, RPK, FN FAL, M14, Thompson and Barrett M82 keep the AK's (grip,
// magazine seat, a charging handle on the right) and share its rock-and-lock reload, with the
// left hand following each gun's own magazine and handguard.
import { P, rbox, cyl, sq, gearTube, profile, torus, ALONG_Z, SIDE, HANDS, offset } from './rig.js';
import { M4A1, m4Actions } from './m4a1.js';
import { AK47, akActions } from './ak47.js';
import { arrayZ, flashParts, boxMag, curvedMag, curvedBottom, rail, reflexSight, scopeParts, pistolGrip, triggerParts, WPN } from './kit.js';

const MAG = { bone: 'mag' };
const FLASH = { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true };
const notFlash = (p) => p.bind.bone !== 'flash';

// ================================================================ M4 rig
const W4 = (p) => offset(M4A1.W0, p);
const B4 = 0.036;
const M4_SIGHT_GROUP = ['Sight Base', 'Sight Battery Cap', 'Sight Buttons', 'Sight Lever', 'Hood Wall L', 'Hood Wall R', 'Hood Top', 'Rear Window', 'Front Window', 'Reticle Ring', 'Reticle Dot'];
const M4_FRONT = ['Delta Ring', 'Handguard', 'Handguard Cap', 'Barrel', 'Front Sight Base', 'Sight Ear L', 'Sight Ear R', 'Front Sight Post', 'Bayonet Lug', 'Sling Swivel', 'Flash Hider', 'Flash Hider Core'];
const M4_STOCK = ['Stock', 'Stock Latch', 'Butt Pad'];
const m4Keep = (drop) => M4A1.parts.filter((p) => notFlash(p) && !drop.includes(p.name));

// HK416: the M4's receivers in RAL 8000 with a free-float quad rail, HK flip sights, a crane
// stock and a steel magazine
export const HK416 = {
  ...M4A1, id: 'hk416', name: 'HK416',
  materials: {
    ...M4A1.materials,
    anodized: { color: '#857655', roughness: 0.55, metallic: 0.35, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
    polymer: { color: '#7a6b4e', roughness: 0.8, pattern: 'leather', patternScale: 240, patternColor: '#5a4e38', patternStrength: 0.5 },
    pmag: { color: '#3a3c3f', roughness: 0.45, metallic: 0.8, pattern: 'metal', patternScale: 2 },
    dark: { color: '#0a0a0a', roughness: 0.9 },
    flash: FLASH,
  },
  parts: [
    ...m4Keep([...M4_FRONT, ...M4_STOCK]),
    P('Rail Handguard', rbox(0.05, 0.05, 0.25, 0.006), 'anodized', WPN, { position: W4([0, B4 - 0.002, 0.205]) }),
    ...rail(W4, 'anodized', 0.082, 0.328, 0.064, { name: 'Handguard Rail' }),
    P('Bottom Rail', rbox(0.022, 0.006, 0.23, 0.001), 'anodized', WPN, { position: W4([0, B4 - 0.03, 0.205]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Side Rail L' : 'Side Rail R', rbox(0.006, 0.022, 0.23, 0.001), 'anodized', WPN, { position: W4([s * 0.028, B4 - 0.002, 0.205]) })),
    P('Barrel', cyl(0.0095, 0.0095, 0.105, 18), 'phosphate', WPN, { position: W4([0, B4, 0.382]), rotation: ALONG_Z }),
    P('Flash Hider', gearTube(0.0115, 0.04, 4, 0.35), 'phosphate', WPN, { position: W4([0, B4, 0.452]) }),
    P('Flash Hider Core', cyl(0.0085, 0.0085, 0.042, 14), 'dark', WPN, { position: W4([0, B4, 0.452]), rotation: ALONG_Z }),
    P('Front Flip Base', rbox(0.016, 0.012, 0.02, 0.003), 'anodized', WPN, { position: W4([0, 0.072, 0.312]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Front Flip Ear L' : 'Front Flip Ear R', rbox(0.003, 0.026, 0.012, 0.001), 'anodized', WPN, { position: W4([s * 0.0075, 0.088, 0.312]) })),
    P('Front Flip Post', rbox(0.0024, 0.02, 0.003, 0.0006), 'phosphate', WPN, { position: W4([0, 0.088, 0.312]) }),
    P('Crane Stock', rbox(0.046, 0.07, 0.17, 0.012), 'polymer', WPN, { position: W4([0, 0.02, -0.32]) }),
    P('Stock Chin', rbox(0.04, 0.06, 0.09, 0.012), 'polymer', WPN, { position: W4([0, -0.035, -0.36]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Battery Tube L' : 'Battery Tube R', cyl(0.011, 0.011, 0.15, 14), 'polymer', WPN, { position: W4([s * 0.022, 0.044, -0.31]), rotation: ALONG_Z })),
    P('Butt Pad', rbox(0.048, 0.13, 0.012, 0.005), 'rubber', WPN, { position: W4([0, -0.012, -0.41]) }),
    ...flashParts(W4, B4, 0.472),
  ],
  points: { ...M4A1.points, muzzle: [0, B4, 0.474], sightFront: [0, 0.098, 0.312] },
};

// M16A2: the carry handle with the A2 rear sight, long ribbed handguards, a 20" barrel with the
// front sight base and birdcage, a fixed A2 stock and aluminium magazines
const A2 = 0.1;
export const M16A2 = {
  ...M4A1, id: 'm16a2', name: 'M16A2',
  materials: {
    ...M4A1.materials,
    anodized: { color: '#26282a', roughness: 0.5, metallic: 0.5, pattern: 'metal', patternScale: 3 },
    polymer: { color: '#1c1d1e', roughness: 0.75, pattern: 'leather', patternScale: 240, patternColor: '#0b0b0b', patternStrength: 0.5 },
    pmag: { color: '#45474a', roughness: 0.4, metallic: 0.75, pattern: 'metal', patternScale: 2 },
    dark: { color: '#0a0a0a', roughness: 0.9 },
    flash: FLASH,
  },
  parts: [
    ...m4Keep([...M4_FRONT.filter((n) => n !== 'Delta Ring'), ...M4_STOCK, ...M4_SIGHT_GROUP, 'Top Rail', 'Rail Teeth', 'Rear BUIS', 'Buffer Tube', 'Castle Nut']),
    // carry handle and A2 rear sight
    P('Handle Rear Post', rbox(0.016, 0.032, 0.05, 0.003), 'anodized', WPN, { position: W4([0, 0.074, -0.1]) }),
    P('Handle Front Post', rbox(0.016, 0.03, 0.02, 0.003), 'anodized', WPN, { position: W4([0, 0.073, 0.034]) }),
    P('Handle Bar', rbox(0.016, 0.012, 0.15, 0.003), 'anodized', WPN, { position: W4([0, 0.091, -0.034]) }),
    P('Rear Sight Body', rbox(0.022, 0.014, 0.034, 0.003), 'anodized', WPN, { position: W4([0, 0.094, -0.1]) }),
    P('Aperture Plate', rbox(0.014, 0.016, 0.004, 0.002), 'phosphate', WPN, { position: W4([0, A2, -0.096]) }),
    P('Aperture', cyl(0.0018, 0.0018, 0.005, 10), 'dark', WPN, { position: W4([0, A2, -0.096]), rotation: ALONG_Z, castShadow: false }),
    P('Windage Knob', gearTube(0.006, 0.006, 12, 0.15), 'phosphate', WPN, { position: W4([-0.014, 0.094, -0.1]), rotation: [0, -90, 0] }),
    P('Elevation Drum', gearTube(0.011, 0.018, 18, 0.08), 'phosphate', WPN, { position: W4([0, 0.084, -0.074]), rotation: [0, 90, 0] }),
    // handguards, barrel, front sight base, birdcage
    P('Handguard', gearTube(0.029, 0.3, 24, 0.05, 0.002), 'polymer', WPN, { position: W4([0, B4 - 0.002, 0.245]), scale: [1, 1.08, 1] }),
    P('Handguard Cap', cyl(0.026, 0.026, 0.01, 24), 'anodized', WPN, { position: W4([0, B4, 0.4]), rotation: ALONG_Z }),
    P('Barrel', cyl(0.0092, 0.0095, 0.2, 20), 'phosphate', WPN, { position: W4([0, B4, 0.49]), rotation: ALONG_Z }),
    P('Front Sight Base', profile([[0.418, 0.018], [0.452, 0.018], [0.448, 0.05], [0.441, 0.068], [0.429, 0.068], [0.421, 0.05]], 0.022, 0.003), 'phosphate', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', profile([[0.427, 0.064], [0.443, 0.064], [0.44, 0.106], [0.431, 0.106]], 0.0035, 0.001), 'phosphate', WPN, { position: W4([s * 0.0085, 0, 0]), rotation: SIDE })),
    P('Front Sight Post', cyl(0.0016, 0.0022, 0.034, 8), 'phosphate', WPN, { position: W4([0, A2 - 0.017, 0.435]) }),
    P('Bayonet Lug', rbox(0.008, 0.016, 0.02, 0.002), 'phosphate', WPN, { position: W4([0, 0.01, 0.445]) }),
    P('Sling Swivel', torus(0.009, 0.0018), 'phosphate', WPN, { position: W4([0, 0.004, 0.428]), rotation: [0, 90, 0] }),
    P('Birdcage', gearTube(0.0115, 0.045, 5, 0.3), 'phosphate', WPN, { position: W4([0, B4, 0.6]) }),
    P('Birdcage Core', cyl(0.009, 0.0095, 0.05, 16), 'dark', WPN, { position: W4([0, B4, 0.6]), rotation: ALONG_Z }),
    // fixed A2 stock
    P('Stock', profile([[-0.13, 0.056], [-0.47, 0.056], [-0.482, 0.046], [-0.482, -0.088], [-0.47, -0.096], [-0.36, -0.06], [-0.24, -0.02], [-0.16, 0.0], [-0.13, 0.012]], 0.042, 0.008), 'polymer', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    P('Butt Plate', rbox(0.044, 0.148, 0.01, 0.004), 'anodized', WPN, { position: W4([0, -0.02, -0.488]) }),
    P('Trapdoor', rbox(0.0435, 0.03, 0.002, 0.0008), 'dark', WPN, { position: W4([0, -0.04, -0.4935]), castShadow: false }),
    ...flashParts(W4, B4, 0.623),
  ],
  points: { ...M4A1.points, muzzle: [0, B4, 0.625], sightRear: [0, A2, -0.096], sightFront: [0, A2, 0.435] },
};

// G36: a black polymer receiver and carry handle with a red dot on top, vented handguard,
// translucent magazine and skeleton stock; its charging handle runs under the carry handle
const G36_SIGHT = 0.146;
const g36Back = (y) => 0.012 + 0.5 * y * y - 0.04 * y;
export const G36 = {
  ...M4A1, id: 'g36', name: 'G36',
  bones: [
    { name: 'charge', head: [0, 0.078, -0.02] },
    { name: 'carrier', head: [0, B4, -0.012] },
    { name: 'flash', head: [0, B4, 0.5], tail: [0, B4, 0.55] },
  ],
  materials: {
    poly: { color: '#1a1b1c', roughness: 0.72, pattern: 'leather', patternScale: 240, patternColor: '#0c0c0c', patternStrength: 0.5 },
    steel: { color: '#2c2e31', roughness: 0.4, metallic: 0.9, pattern: 'metal', patternScale: 3 },
    nickel: { color: '#9a9c9e', roughness: 0.22, metallic: 1 },
    magT: { color: '#4a3b26', roughness: 0.25, opacity: 0.82 },
    optic: { color: '#2a2b2c', roughness: 0.5, metallic: 0.3 },
    lens: { color: '#2c4a5a', roughness: 0.05, opacity: 0.12, doubleSided: true },
    dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
    rubber: { color: '#141414', roughness: 0.9 },
    dark: { color: '#070707', roughness: 0.9 },
    brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
    flash: FLASH,
  },
  parts: [
    P('Receiver', profile([[-0.15, 0.0], [0.095, 0.0], [0.095, 0.064], [-0.14, 0.064], [-0.15, 0.054]], 0.036, 0.006), 'poly', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    P('Ejection Port', rbox(0.002, 0.018, 0.05, 0.001), 'dark', WPN, { position: W4([-0.0182, B4, -0.01]) }),
    P('Bolt Carrier', cyl(0.0125, 0.0125, 0.07, 16), 'nickel', { bone: 'carrier' }, { position: W4([-0.004, B4, -0.012]), rotation: ALONG_Z }),
    P('Handle Rear Post', rbox(0.03, 0.034, 0.03, 0.005), 'poly', WPN, { position: W4([0, 0.08, -0.115]) }),
    P('Handle Front Post', rbox(0.03, 0.034, 0.026, 0.005), 'poly', WPN, { position: W4([0, 0.08, 0.076]) }),
    P('Carry Handle', rbox(0.032, 0.032, 0.23, 0.007), 'poly', WPN, { position: W4([0, 0.112, -0.02]) }),
    P('Eyecup', cyl(0.013, 0.013, 0.02, 18), 'rubber', WPN, { position: W4([0, 0.112, -0.14]), rotation: ALONG_Z }),
    P('Objective', cyl(0.011, 0.011, 0.002, 18), 'lens', WPN, { position: W4([0, 0.112, 0.096]), rotation: ALONG_Z, castShadow: false }),
    ...reflexSight(W4, 0.0, G36_SIGHT, { base: 0.128 }),
    P('Charging Handle', rbox(0.012, 0.01, 0.03, 0.003), 'poly', { bone: 'charge' }, { position: W4([0, 0.078, -0.02]) }),
    P('Charging Wing', rbox(0.04, 0.008, 0.012, 0.003), 'poly', { bone: 'charge' }, { position: W4([0, 0.078, -0.03]) }),
    P('Lower', profile([[-0.13, 0.002], [0.03, 0.002], [0.03, -0.04], [0.004, -0.046], [-0.03, -0.012], [-0.13, -0.012]], 0.03, 0.004), 'poly', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    P('Pistol Grip', profile([[-0.03, -0.012], [-0.075, -0.012], [-0.098, -0.105], [-0.086, -0.118], [-0.056, -0.118], [-0.048, -0.1], [-0.045, -0.078], [-0.04, -0.07], [-0.043, -0.058], [-0.036, -0.04]], 0.031, 0.008), 'poly', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    P('Trigger', profile([[-0.004, -0.012], [0.004, -0.012], [0.002, -0.03], [-0.004, -0.042], [-0.008, -0.04], [-0.003, -0.028]], 0.005, 0.0012), 'steel', WPN, { position: W4([0, 0, 0]), rotation: SIDE }),
    P('Selector', rbox(0.004, 0.006, 0.024, 0.0015), 'steel', WPN, { position: W4([0.017, -0.002, -0.06]), rotation: [-30, 0, 0] }),
    P('Magwell', rbox(0.032, 0.03, 0.062, 0.004), 'poly', WPN, { position: W4([0, -0.012, 0.04]) }),
    P('Mag Paddle', rbox(0.02, 0.004, 0.014, 0.0015), 'poly', WPN, { position: W4([0, -0.029, 0.004]) }),
    P('Handguard', rbox(0.05, 0.056, 0.22, 0.01, 2), 'poly', WPN, { position: W4([0, B4 - 0.006, 0.205]) }),
    P('Handguard Vents', rbox(0.0505, 0.012, 0.012, 0), 'dark', WPN, { position: W4([0, B4 - 0.002, 0.125]), modifiers: arrayZ(6, 0.03), castShadow: false }),
    P('Barrel', cyl(0.0095, 0.0095, 0.17, 18), 'steel', WPN, { position: W4([0, B4, 0.39]), rotation: ALONG_Z }),
    P('Flash Hider', gearTube(0.0118, 0.05, 4, 0.35), 'steel', WPN, { position: W4([0, B4, 0.47]) }),
    P('Flash Hider Core', cyl(0.0085, 0.0085, 0.052, 14), 'dark', WPN, { position: W4([0, B4, 0.47]), rotation: ALONG_Z }),
    P('Stock Hinge', rbox(0.034, 0.06, 0.03, 0.006), 'poly', WPN, { position: W4([0, 0.03, -0.165]) }),
    P('Stock Top Bar', rbox(0.03, 0.016, 0.25, 0.005), 'poly', WPN, { position: W4([0, 0.05, -0.29]) }),
    P('Stock Lower Bar', rbox(0.03, 0.016, 0.25, 0.005), 'poly', WPN, { position: W4([0, -0.035, -0.29]), rotation: [10, 0, 0] }),
    P('Butt Plate', rbox(0.034, 0.13, 0.016, 0.006), 'rubber', WPN, { position: W4([0, 0.0, -0.414]) }),
    ...curvedMag(W4, 'magT', { back: g36Back, depth: 0.056, yTop: 0.004, yBot: -0.2, width: 0.023 }),
    ...[0, 1, 2].map((i) => P('Mag Stud ' + i, rbox(0.003, 0.008, 0.008, 0.001), 'magT', MAG, { position: W4([0.0125, -0.04 - i * 0.05, g36Back(-0.04 - i * 0.05) + 0.028]) })),
    ...flashParts(W4, B4, 0.495),
  ],
  points: { muzzle: [0, B4, 0.497], eject: [-0.02, B4, -0.01], sightRear: [0, G36_SIGHT, -0.006], sightFront: [0, G36_SIGHT, 0.04] },
  actions: m4Actions({ mag: [curvedBottom(g36Back, 0.056, -0.2)[0] + 0.2, curvedBottom(g36Back, 0.056, -0.2)[1] - 0.083] }),
};

// ================================================================ AK rig
const WA = (p) => offset(AK47.W0, p);
const BA = 0.036;
const AK_BOTTOM = [-0.27, 0.195]; // the AK-47's magazine bottom, where its rig's left hand takes it
const magShift = ([y, z]) => [+(y - AK_BOTTOM[0]).toFixed(3), +(z - AK_BOTTOM[1]).toFixed(3)];
const AK_MAG = ['Magazine', 'Mag Rib L', 'Mag Rib R', 'Mag Floor', 'Top Round', 'Top Bullet'];
const AK_MUZZLE = ['Barrel', 'Brake Base', 'Slant Brake', 'Muzzle Bore'];
const AK_FRONT = ['Gas Block', 'Gas Tube', 'Upper Handguard', 'Upper Guard Ferrule', 'Lower Handguard', 'Handguard Grooves', 'Cleaning Rod', 'Front Sight Base', 'Sight Ear L', 'Sight Ear R', 'Front Post', 'Front Swivel'];
const akKeep = (drop) => AK47.parts.filter((p) => notFlash(p) && !drop.includes(p.name));
const akFront = (W, mat, z, h = 0.03) => [
  P('Front Sight Base', rbox(0.018, h, 0.022, 0.004), mat, WPN, { position: W([0, 0.082 - 0.008 - h / 2 + 0.004, z]) }),
  ...[1, -1].map((s) => P(s > 0 ? 'Sight Ear L' : 'Sight Ear R', rbox(0.003, 0.028, 0.014, 0.001), mat, WPN, { position: W([s * 0.0085, 0.074, z]) })),
  P('Front Post', rbox(0.0024, 0.02, 0.004, 0.0006), mat, WPN, { position: W([0, 0.074, z]) }),
];

// AK-74: laminated furniture, the two-port brake and the plum 5.45 magazine
const ak74Back = (y) => 0.024 + 1.1 * y * y - 0.08 * y;
const AK74_MAG = (W) => curvedMag(W, 'plum', { back: ak74Back, depth: 0.04, yBot: -0.25, width: 0.024 });
const AK74_SHIFT = magShift(curvedBottom(ak74Back, 0.04, -0.25));
const AK74_MATS = {
  ...AK47.materials,
  wood: { color: '#6e3420', roughness: 0.38, pattern: 'walnut', patternScale: 40, patternColor: '#35140a', sheen: 0.3 },
  woodDark: { color: '#4a2215', roughness: 0.45, pattern: 'walnut', patternScale: 30, patternColor: '#22100a' },
  bakelite: { color: '#4a2219', roughness: 0.5 },
  plum: { color: '#6a3324', roughness: 0.55, pattern: 'leather', patternScale: 200, patternColor: '#4a2014', patternStrength: 0.3 },
};
const ak74Brake = (W, z) => [
  P('Brake', cyl(0.0125, 0.0125, 0.058, 18), 'steel', WPN, { position: W([0, BA, z - 0.029]), rotation: ALONG_Z }),
  ...[1, -1].map((s) => P(s > 0 ? 'Brake Port L' : 'Brake Port R', rbox(0.004, 0.012, 0.014, 0.002), 'dark', WPN, { position: W([s * 0.011, BA, z - 0.018]) })),
  P('Muzzle Bore', cyl(0.0042, 0.0042, 0.003, 12), 'dark', WPN, { position: W([0, BA, z + 0.0005]), rotation: ALONG_Z }),
];
export const AK74 = {
  ...AK47, id: 'ak74', name: 'AK-74', materials: AK74_MATS,
  parts: [
    ...akKeep([...AK_MAG, ...AK_MUZZLE]),
    P('Barrel', cyl(0.0085, 0.0085, 0.355, 18), 'steel', WPN, { position: WA([0, BA, 0.297]), rotation: ALONG_Z }),
    ...ak74Brake(WA, 0.53), ...AK74_MAG(WA), ...flashParts(WA, BA, 0.53),
  ],
  points: { ...AK47.points, muzzle: [0, BA, 0.532] },
  actions: akActions({ mag: AK74_SHIFT }),
};

// AKS-74U: short barrel and handguard with the gas block and front sight together, the
// booster, the rear sight on the hinged top cover and the skeleton stock open
export const AKS74U = {
  ...AK47, id: 'aks74u', name: 'AKS-74U', materials: AK74_MATS,
  parts: [
    ...akKeep([...AK_MAG, ...AK_MUZZLE, ...AK_FRONT, 'Stock', 'Butt Plate', 'Rear Sight Base', 'Rear Leaf', 'Rear Notch']),
    P('Barrel', cyl(0.0085, 0.0085, 0.2, 18), 'steel', WPN, { position: WA([0, BA, 0.23]), rotation: ALONG_Z }),
    P('Lower Handguard', profile([[0.15, 0.03], [0.265, 0.03], [0.265, 0.004], [0.25, -0.012], [0.16, -0.012], [0.15, 0.0]], 0.042, 0.011), 'wood', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Upper Handguard', rbox(0.04, 0.026, 0.11, 0.012, 2), 'wood', WPN, { position: WA([0, 0.056, 0.21]) }),
    P('Gas Block', rbox(0.026, 0.05, 0.034, 0.006), 'park', WPN, { position: WA([0, 0.05, 0.285]) }),
    ...akFront(WA, 'park', 0.29, 0.016).map((p) => (p.name === 'Front Sight Base' ? { ...p, position: WA([0, 0.08, 0.29]) } : { ...p, position: [p.position[0], p.position[1] + 0.012, p.position[2]] })),
    P('Booster', cyl(0.018, 0.018, 0.052, 20), 'steel', WPN, { position: WA([0, BA, 0.355]), rotation: ALONG_Z }),
    P('Booster Cone', cyl(0.012, 0.018, 0.014, 20), 'steel', WPN, { position: WA([0, BA, 0.388]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: WA([0, BA, 0.3955]), rotation: ALONG_Z }),
    P('Rear Sight', rbox(0.018, 0.014, 0.016, 0.003), 'park', WPN, { position: WA([0, 0.085, -0.11]) }),
    P('Rear Notch', rbox(0.004, 0.005, 0.017, 0), 'dark', WPN, { position: WA([0, 0.0905, -0.11]), castShadow: false }),
    P('Stock Top Strut', rbox(0.012, 0.012, 0.25, 0.003), 'steel', WPN, { position: WA([0, 0.035, -0.27]) }),
    P('Stock Lower Strut', rbox(0.012, 0.012, 0.25, 0.003), 'steel', WPN, { position: WA([0, -0.04, -0.27]), rotation: [9, 0, 0] }),
    P('Butt Plate', rbox(0.022, 0.12, 0.016, 0.005), 'steel', WPN, { position: WA([0, -0.015, -0.4]) }),
    ...AK74_MAG(WA), ...flashParts(WA, BA, 0.395, 0.9),
  ],
  points: { ...AK47.points, muzzle: [0, BA, 0.397], sightRear: [0, 0.09, -0.11], sightFront: [0, 0.09, 0.29] },
  actions: akActions({ mag: AK74_SHIFT, support: { p: [0.052, 0.004, 0.215] } }),
};

// RPK: the AK's receiver with a heavy long barrel, a folded bipod, a club-foot stock and the
// 40-round magazine
const akBack = (y) => 0.02 + 1.9 * y * y - 0.1 * y;
export const RPK = {
  ...AK47, id: 'rpk', name: 'RPK',
  materials: { ...AK47.materials, wood: { color: '#7d4a24', roughness: 0.42, pattern: 'walnut', patternScale: 22, patternColor: '#3f200d', sheen: 0.25 } },
  parts: [
    ...akKeep([...AK_MAG, ...AK_MUZZLE, 'Front Sight Base', 'Sight Ear L', 'Sight Ear R', 'Front Post', 'Front Swivel', 'Stock', 'Butt Plate']),
    P('Barrel', cyl(0.011, 0.011, 0.5, 20), 'steel', WPN, { position: WA([0, BA, 0.37]), rotation: ALONG_Z }),
    ...akFront(WA, 'park', 0.6, 0.038),
    P('Muzzle Nut', cyl(0.0125, 0.0125, 0.02, 16), 'steel', WPN, { position: WA([0, BA, 0.63]), rotation: ALONG_Z }),
    P('Muzzle Bore', cyl(0.0045, 0.0045, 0.003, 12), 'dark', WPN, { position: WA([0, BA, 0.6405]), rotation: ALONG_Z }),
    P('Bipod Clamp', rbox(0.03, 0.03, 0.02, 0.005), 'park', WPN, { position: WA([0, BA - 0.004, 0.57]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Bipod Leg L' : 'Bipod Leg R', cyl(0.0045, 0.0045, 0.24, 10), 'park', WPN, { position: WA([s * 0.011, BA - 0.022, 0.45]), rotation: ALONG_Z })),
    P('Stock', profile([[-0.14, 0.05], [-0.3, 0.042], [-0.44, 0.036], [-0.452, 0.026], [-0.452, -0.1], [-0.43, -0.122], [-0.38, -0.124], [-0.36, -0.075], [-0.24, -0.045], [-0.14, -0.03]], 0.038, 0.008), 'wood', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Butt Plate', rbox(0.038, 0.13, 0.008, 0.003), 'steel', WPN, { position: WA([0, -0.035, -0.456]) }),
    ...curvedMag(WA, 'steel', { back: akBack, depth: 0.042, yBot: -0.32, width: 0.025 }),
    ...flashParts(WA, BA, 0.64),
  ],
  points: { ...AK47.points, muzzle: [0, BA, 0.642], sightFront: [0, 0.082, 0.6] },
  actions: akActions({ mag: magShift(curvedBottom(akBack, 0.042, -0.32)) }),
};

// FN FAL: a long receiver with the carry handle folded on the left, a vented synthetic
// handguard, a slotted flash hider, an aperture rear sight and the straight 20-round magazine
const FAL_SIGHT = 0.1;
export const FAL = {
  ...AK47, id: 'fal', name: 'FN FAL',
  materials: {
    ...AK47.materials,
    steel: { color: '#2a2c2e', roughness: 0.48, metallic: 0.85, pattern: 'metal', patternScale: 3, patternStrength: 0.5 },
    synth: { color: '#1b1c1d', roughness: 0.8, pattern: 'leather', patternScale: 240, patternColor: '#0c0c0c', patternStrength: 0.5 },
  },
  parts: [
    P('Receiver', profile([[-0.16, 0.012], [0.17, 0.012], [0.17, 0.064], [0.15, 0.072], [-0.14, 0.072], [-0.16, 0.06]], 0.036, 0.006), 'steel', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Top Cover', rbox(0.032, 0.008, 0.26, 0.003), 'steel', WPN, { position: WA([0, 0.075, -0.01]) }),
    P('Ejection Port', rbox(0.002, 0.018, 0.06, 0.001), 'dark', WPN, { position: WA([-0.0182, 0.045, 0.02]) }),
    P('Carry Handle', rbox(0.006, 0.014, 0.1, 0.003), 'synth', WPN, { position: WA([0.021, 0.06, 0.08]) }),
    P('Rear Sight Base', rbox(0.022, 0.012, 0.024, 0.003), 'steel', WPN, { position: WA([0, 0.08, -0.12]) }),
    P('Rear Aperture', torus(0.0045, 0.002, { tubularSegments: 16 }), 'steel', WPN, { position: WA([0, FAL_SIGHT, -0.12]), rotation: [90, 0, 0] }),
    P('Rear Aperture Post', rbox(0.004, 0.014, 0.004, 0.001), 'steel', WPN, { position: WA([0, 0.09, -0.12]) }),
    P('Lower', profile([[-0.15, 0.014], [0.09, 0.014], [0.09, -0.006], [0.06, -0.016], [-0.03, -0.016], [-0.15, 0.0]], 0.034, 0.005), 'steel', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    pistolGrip(WA, 'synth'),
    ...triggerParts(WA, 'steel', 'steel'),
    P('Magwell', rbox(0.034, 0.03, 0.07, 0.004), 'steel', WPN, { position: WA([0, -0.002, 0.058]) }),
    P('Handguard', rbox(0.048, 0.05, 0.24, 0.012, 2), 'synth', WPN, { position: WA([0, BA - 0.006, 0.29]) }),
    P('Handguard Vents', rbox(0.0485, 0.01, 0.014, 0), 'dark', WPN, { position: WA([0, BA - 0.004, 0.2]), modifiers: arrayZ(6, 0.034), castShadow: false }),
    P('Barrel', cyl(0.009, 0.009, 0.2, 18), 'steel', WPN, { position: WA([0, BA, 0.5]), rotation: ALONG_Z }),
    P('Gas Block', rbox(0.022, 0.034, 0.03, 0.005), 'steel', WPN, { position: WA([0, BA + 0.012, 0.425]) }),
    ...akFront(WA, 'steel', 0.53, 0.04).map((p) => ({ ...p, position: [p.position[0], p.position[1] + (FAL_SIGHT - 0.082), p.position[2]] })),
    P('Bayonet Lug', rbox(0.008, 0.012, 0.024, 0.002), 'steel', WPN, { position: WA([0, BA - 0.016, 0.56]) }),
    P('Flash Hider', gearTube(0.0118, 0.055, 6, 0.28), 'steel', WPN, { position: WA([0, BA, 0.62]) }),
    P('Flash Hider Core', cyl(0.0085, 0.0085, 0.056, 14), 'dark', WPN, { position: WA([0, BA, 0.62]), rotation: ALONG_Z }),
    P('Stock', profile([[-0.15, 0.06], [-0.3, 0.054], [-0.46, 0.05], [-0.47, 0.04], [-0.47, -0.088], [-0.455, -0.1], [-0.32, -0.062], [-0.2, -0.03], [-0.15, -0.016]], 0.038, 0.009), 'synth', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Butt Plate', rbox(0.04, 0.142, 0.01, 0.004), 'steel', WPN, { position: WA([0, -0.022, -0.475]) }),
    P('Charging Arm', cyl(0.0035, 0.0035, 0.02, 10), 'steel', { bone: 'chargeRot' }, { position: WA([-0.024, 0.044, 0.02]), rotation: [0, 0, 90] }),
    P('Charging Knob', rbox(0.008, 0.014, 0.008, 0.003), 'steel', { bone: 'chargeRot' }, { position: WA([-0.034, 0.044, 0.02]) }),
    ...boxMag(WA, 'steel', { yTop: 0.016, yBot: -0.18, z: 0.058, depth: 0.058, width: 0.026 }),
    ...flashParts(WA, BA, 0.648),
  ],
  points: { muzzle: [0, BA, 0.65], eject: [-0.022, 0.045, 0.02], sightRear: [0, FAL_SIGHT, -0.12], sightFront: [0, FAL_SIGHT, 0.53] },
  actions: akActions({ mag: magShift([-0.188, 0.058]) }),
};

// M14: a one-piece walnut stock with a semi-pistol grip, the operating rod handle on the right,
// gas cylinder, flash suppressor with its front sight, an aperture rear sight with knobs and
// the 20-round magazine
const M14_SIGHT = 0.096;
export const M14 = {
  ...AK47, id: 'm14', name: 'M14',
  materials: {
    ...AK47.materials,
    wood: { color: '#6b3b1c', roughness: 0.4, pattern: 'walnut', patternScale: 26, patternColor: '#3c1c0b', sheen: 0.25 },
    park: { color: '#3b3d37', roughness: 0.62, metallic: 0.6, pattern: 'metal', patternScale: 3, patternStrength: 0.6 },
  },
  parts: [
    P('Stock', profile([[0.46, 0.028], [0.46, 0.0], [0.42, -0.016], [0.06, -0.02], [0.05, -0.028], [-0.034, -0.028], [-0.05, -0.06], [-0.068, -0.108], [-0.09, -0.12], [-0.12, -0.108], [-0.2, -0.076], [-0.43, -0.106], [-0.44, -0.1], [-0.44, 0.04], [-0.43, 0.046], [-0.2, 0.038], [-0.14, 0.03], [-0.12, 0.022], [0.16, 0.022], [0.17, 0.028]], 0.044, 0.01), 'wood', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Butt Plate', rbox(0.045, 0.14, 0.008, 0.003), 'park', WPN, { position: WA([0, -0.03, -0.444]) }),
    P('Receiver', profile([[-0.12, 0.022], [0.16, 0.022], [0.16, 0.062], [0.12, 0.068], [-0.02, 0.068], [-0.04, 0.076], [-0.12, 0.076], [-0.13, 0.06]], 0.034, 0.005), 'park', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Bolt', rbox(0.018, 0.016, 0.06, 0.004), 'steel', WPN, { position: WA([0, 0.066, -0.06]) }),
    P('Rear Sight Base', rbox(0.026, 0.014, 0.028, 0.003), 'park', WPN, { position: WA([0, 0.082, -0.1]) }),
    P('Rear Aperture', torus(0.0055, 0.0022, { tubularSegments: 18 }), 'park', WPN, { position: WA([0, M14_SIGHT, -0.1]), rotation: [90, 0, 0] }),
    P('Windage Knob', gearTube(0.0085, 0.008, 18, 0.12), 'steel', WPN, { position: WA([-0.02, 0.084, -0.1]), rotation: [0, 90, 0] }),
    P('Elevation Knob', gearTube(0.011, 0.008, 22, 0.1), 'steel', WPN, { position: WA([0.02, 0.083, -0.1]), rotation: [0, -90, 0] }),
    P('Handguard', rbox(0.032, 0.022, 0.2, 0.01, 2), 'wood', WPN, { position: WA([0, BA + 0.008, 0.29]) }),
    P('Barrel', cyl(0.0095, 0.0095, 0.44, 18), 'park', WPN, { position: WA([0, BA, 0.4]), rotation: ALONG_Z }),
    P('Gas Cylinder', cyl(0.013, 0.013, 0.08, 18), 'park', WPN, { position: WA([0, BA - 0.022, 0.5]), rotation: ALONG_Z }),
    P('Front Band', rbox(0.04, 0.05, 0.016, 0.01), 'park', WPN, { position: WA([0, BA - 0.008, 0.465]) }),
    P('Flash Suppressor', gearTube(0.012, 0.06, 5, 0.3), 'park', WPN, { position: WA([0, BA, 0.62]) }),
    P('Suppressor Core', cyl(0.0085, 0.0085, 0.062, 14), 'dark', WPN, { position: WA([0, BA, 0.62]), rotation: ALONG_Z }),
    ...akFront(WA, 'park', 0.61, 0.03).map((p) => ({ ...p, position: [p.position[0], p.position[1] + (M14_SIGHT - 0.082), p.position[2]] })),
    ...triggerParts(WA, 'park', 'park'),
    P('Op Rod', cyl(0.0045, 0.0045, 0.28, 10), 'park', { bone: 'charge' }, { position: WA([-0.018, 0.03, 0.16]), rotation: ALONG_Z }),
    P('Charging Arm', rbox(0.012, 0.016, 0.02, 0.004), 'park', { bone: 'chargeRot' }, { position: WA([-0.024, 0.044, 0.02]) }),
    P('Charging Knob', sq(0.0085, 0.009, 0.009, 0.7, 0.7, 14), 'park', { bone: 'chargeRot' }, { position: WA([-0.032, 0.046, 0.024]) }),
    ...boxMag(WA, 'park', { yTop: 0.02, yBot: -0.17, z: 0.06, depth: 0.058, width: 0.026, floor: 'steel' }),
    ...flashParts(WA, BA, 0.65),
  ],
  points: { muzzle: [0, BA, 0.652], eject: [-0.02, 0.06, 0.03], sightRear: [0, M14_SIGHT, -0.1], sightFront: [0, M14_SIGHT, 0.61] },
  actions: akActions({ mag: magShift([-0.178, 0.06]) }),
};

// Thompson M1928A1: blued receiver with the actuator on top, walnut butt, pistol grip and
// vertical foregrip, a finned barrel with the Cutts compensator and a 30-round stick magazine
const TOMMY_SIGHT = 0.088;
export const THOMPSON = {
  ...AK47, id: 'thompson', name: 'Thompson M1928A1',
  bones: [
    { name: 'charge', head: [0, 0.074, 0.02] },
    { name: 'chargeRot', parent: 'charge', head: [0, 0.074, 0.02], tail: [0, 0.114, 0.02] },
    { name: 'flash', head: [0, BA, 0.49], tail: [0, BA, 0.55] },
  ],
  materials: {
    ...AK47.materials,
    blued: { color: '#1e2329', roughness: 0.3, metallic: 0.95, pattern: 'metal', patternScale: 3 },
    wood: { color: '#7a4422', roughness: 0.35, pattern: 'walnut', patternScale: 24, patternColor: '#3d1c09', sheen: 0.3 },
  },
  parts: [
    P('Receiver', rbox(0.044, 0.062, 0.25, 0.007), 'blued', WPN, { position: WA([0, 0.037, 0.0]) }),
    P('Actuator Slot', rbox(0.008, 0.002, 0.13, 0.0005), 'dark', WPN, { position: WA([0, 0.0685, -0.02]) }),
    P('Ejection Port', rbox(0.002, 0.016, 0.036, 0.001), 'dark', WPN, { position: WA([-0.0222, 0.045, 0.03]) }),
    P('Rear Sight', rbox(0.02, 0.018, 0.024, 0.003), 'blued', WPN, { position: WA([0, 0.076, -0.1]) }),
    P('Rear Leaf', rbox(0.016, 0.014, 0.004, 0.001), 'blued', WPN, { position: WA([0, TOMMY_SIGHT, -0.092]) }),
    P('Rear Peep', cyl(0.0018, 0.0018, 0.005, 10), 'dark', WPN, { position: WA([0, TOMMY_SIGHT, -0.092]), rotation: ALONG_Z, castShadow: false }),
    P('Lower Frame', profile([[-0.125, 0.008], [0.09, 0.008], [0.09, -0.01], [0.04, -0.014], [-0.03, -0.014], [-0.125, 0.0]], 0.04, 0.005), 'blued', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    pistolGrip(WA, 'wood'),
    ...triggerParts(WA, 'blued', 'blued'),
    P('Selector', rbox(0.004, 0.008, 0.02, 0.0015), 'steel', WPN, { position: WA([0.022, 0.004, -0.06]) }),
    P('Magwell', rbox(0.034, 0.024, 0.05, 0.004), 'blued', WPN, { position: WA([0, -0.006, 0.06]) }),
    P('Finned Barrel', gearTube(0.016, 0.15, 24, 0.25), 'blued', WPN, { position: WA([0, BA, 0.2]) }),
    P('Barrel', cyl(0.0092, 0.0092, 0.18, 16), 'blued', WPN, { position: WA([0, BA, 0.34]), rotation: ALONG_Z }),
    P('Compensator', rbox(0.026, 0.028, 0.055, 0.004), 'blued', WPN, { position: WA([0, BA + 0.002, 0.455]) }),
    P('Comp Slots', rbox(0.016, 0.002, 0.004, 0), 'dark', WPN, { position: WA([0, BA + 0.0165, 0.438]), modifiers: arrayZ(4, 0.01), castShadow: false }),
    P('Muzzle Bore', cyl(0.0058, 0.0058, 0.003, 12), 'dark', WPN, { position: WA([0, BA, 0.4835]), rotation: ALONG_Z }),
    P('Front Blade', rbox(0.003, 0.018, 0.01, 0.001), 'blued', WPN, { position: WA([0, TOMMY_SIGHT - 0.009 + 0.0, 0.462]) }),
    P('Foregrip', profile([[0.236, 0.016], [0.29, 0.016], [0.292, -0.094], [0.28, -0.108], [0.246, -0.108], [0.234, -0.094]], 0.032, 0.01), 'wood', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Foregrip Grooves', rbox(0.0325, 0.004, 0.05, 0), 'woodDark', WPN, { position: WA([0, -0.02, 0.263]), modifiers: arrayZ(4, 0, -0.022), castShadow: false }),
    P('Stock', profile([[-0.13, 0.05], [-0.3, 0.04], [-0.44, 0.032], [-0.45, 0.024], [-0.45, -0.1], [-0.44, -0.108], [-0.3, -0.064], [-0.2, -0.036], [-0.13, -0.02]], 0.038, 0.009), 'wood', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Butt Plate', rbox(0.04, 0.136, 0.008, 0.003), 'blued', WPN, { position: WA([0, -0.035, -0.454]) }),
    P('Actuator', sq(0.008, 0.008, 0.009, 0.7, 0.7, 14), 'blued', { bone: 'chargeRot' }, { position: WA([0, 0.074, 0.02]) }),
    ...boxMag(WA, 'blued', { yTop: 0.012, yBot: -0.215, z: 0.06, depth: 0.04, width: 0.024 }),
    ...flashParts(WA, BA, 0.484, 0.95),
  ],
  points: { muzzle: [0, BA, 0.486], eject: [-0.023, 0.045, 0.03], sightRear: [0, TOMMY_SIGHT, -0.092], sightFront: [0, TOMMY_SIGHT, 0.462] },
  actions: akActions({ mag: magShift([-0.222, 0.06]), support: { p: [0.034, -0.05, 0.228], r: [-78, 0, -4] }, supportPose: HANDS.squeeze }),
};

// Barrett M82A1: a long upper receiver with a scope on its rail, a heavy barrel with the
// double-chamber brake, a folded bipod, the carry handle and a 10-round .50 BMG magazine
const BB = 0.05;
export const M82 = {
  ...AK47, id: 'm82', name: 'Barrett M82A1',
  bones: [...AK47.bones.filter((b) => b.name !== 'flash'), { name: 'flash', head: [0, BB, 1.04], tail: [0, BB, 1.1] }],
  materials: {
    ...AK47.materials,
    park: { color: '#3a3b37', roughness: 0.6, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.6 },
    scope: { color: '#1c1d1e', roughness: 0.4, metallic: 0.4, pattern: 'metal', patternScale: 2 },
    glass: { color: '#3a5a7a', roughness: 0.05, metallic: 0.3 },
  },
  parts: [
    P('Upper Receiver', rbox(0.06, 0.07, 0.62, 0.008), 'park', WPN, { position: WA([0, 0.05, 0.12]) }),
    P('Upper Holes', rbox(0.0605, 0.024, 0.04, 0.008), 'dark', WPN, { position: WA([0, 0.05, 0.14]), modifiers: arrayZ(4, 0.06), castShadow: false }),
    ...rail(WA, 'park', -0.18, 0.2, 0.092, { width: 0.026 }),
    ...scopeParts(WA, 'scope', 'glass', -0.2, 0.18, 0.134, { r: 0.017, bell: 0.028 }),
    P('Carry Handle', torus(0.03, 0.005, { tubularSegments: 16, arc: 180 }), 'park', WPN, { position: WA([0, 0.084, 0.34]), rotation: [0, 90, 0] }),
    P('Lower Receiver', profile([[-0.46, 0.06], [0.06, 0.06], [0.06, 0.0], [0.03, -0.018], [-0.03, -0.018], [-0.13, -0.004], [-0.4, -0.004], [-0.46, -0.06]], 0.05, 0.006), 'park', WPN, { position: WA([0, 0, 0]), rotation: SIDE }),
    P('Recoil Pad', rbox(0.052, 0.13, 0.03, 0.01), 'rubber', WPN, { position: WA([0, 0.004, -0.475]) }),
    pistolGrip(WA, 'rubber'),
    ...triggerParts(WA, 'park', 'steel'),
    P('Magwell', rbox(0.05, 0.03, 0.1, 0.004), 'park', WPN, { position: WA([0, -0.01, 0.07]) }),
    P('Barrel', cyl(0.0145, 0.0145, 0.6, 20), 'park', WPN, { position: WA([0, BB, 0.73]), rotation: ALONG_Z }),
    P('Brake', rbox(0.07, 0.042, 0.09, 0.012), 'park', WPN, { position: WA([0, BB, 0.99]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Brake Vents L' : 'Brake Vents R', rbox(0.004, 0.03, 0.022, 0.002), 'dark', WPN, { position: WA([s * 0.034, BB, 0.972]), modifiers: arrayZ(2, 0.036) })),
    P('Muzzle Bore', cyl(0.0065, 0.0065, 0.003, 14), 'dark', WPN, { position: WA([0, BB, 1.0355]), rotation: ALONG_Z }),
    P('Bipod Yoke', rbox(0.05, 0.03, 0.03, 0.006), 'park', WPN, { position: WA([0, BB - 0.02, 0.5]) }),
    ...[1, -1].map((s) => P(s > 0 ? 'Bipod Leg L' : 'Bipod Leg R', cyl(0.006, 0.006, 0.34, 10), 'park', WPN, { position: WA([s * 0.02, BB - 0.03, 0.67]), rotation: ALONG_Z })),
    P('Charging Arm', cyl(0.004, 0.004, 0.02, 10), 'steel', { bone: 'chargeRot' }, { position: WA([-0.036, 0.044, 0.02]), rotation: [0, 0, 90] }),
    P('Charging Knob', sq(0.009, 0.01, 0.01, 0.7, 0.7, 14), 'park', { bone: 'chargeRot' }, { position: WA([-0.048, 0.044, 0.02]) }),
    ...boxMag(WA, 'park', { yTop: 0.014, yBot: -0.12, z: 0.07, depth: 0.09, width: 0.04, floor: 'steel' }),
    ...flashParts(WA, BB, 1.04, 1.4),
  ],
  points: { muzzle: [0, BB, 1.04], eject: [-0.032, 0.06, 0.05], sightRear: [0, 0.134, -0.17], sightFront: [0, 0.134, 0.15] },
  actions: akActions({ mag: magShift([-0.128, 0.07]), support: { p: [0.058, 0.022, 0.32] } }),
};
