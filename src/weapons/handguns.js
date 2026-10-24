// Five pistols on the Desert Eagle's rig and a Colt Python on the .44's. Each pistol keeps the
// Desert Eagle's anchors (grip, trigger, slide pivot, magazine seat) so it shares its slide-lock,
// reloads and trigger-finger spin; the Python keeps the .44's frame, cylinder and crane.
import { P, rbox, cyl, sph, profile, torus, ALONG_Z, SIDE, offset } from './rig.js';
import { DEAGLE } from './deagle.js';
import { REVOLVER } from './revolver.js';
import { arrayZ, flashParts, WPN } from './kit.js';

const W = (p) => offset(DEAGLE.W0, p);
const SLD = { bone: 'slide' }, MAG = { bone: 'mag' }, TRG = { bone: 'trigger' };
const FLASH = { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true };
const BASE_MATS = {
  groove: { color: '#060607', roughness: 0.85 },
  white: { color: '#ece8dc', roughness: 0.5 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  steel: { color: '#8b8d91', roughness: 0.25, metallic: 1, pattern: 'metal', patternScale: 4 },
  flash: FLASH,
};

// A pistol on the Desert Eagle's anchors. o: slide extent (back, front, bottom, top, width,
// round), bore height, materials (slide, frame, grip, mag) and features (hammer, 1911 grip
// safety, open-top slide, rail, squared trigger guard, decocker, front serrations).
function pistol(o) {
  const { back = -0.09, front = 0.11, bottom = 0.03, top = 0.066, width = 0.025, round = 0.004, bore = 0.046 } = o;
  const h = top - bottom, sight = top + 0.0075;
  const parts = [];
  if (o.openTop) {
    // Beretta: the slide's top is cut away over the barrel, which shows between the two rails
    parts.push(
      P('Slide', profile([[back, bottom], [0.0, bottom], [0.0, top - 0.006], [back + 0.006, top], [back, top - 0.006]], width, round), 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      ...[1, -1].map((s) => P(s > 0 ? 'Slide Rail L' : 'Slide Rail R', profile([[0.0, bottom], [front - 0.02, bottom], [front - 0.02, top - 0.012], [0.02, top - 0.012], [0.0, top - 0.004]], 0.006, 0.0015), 'slide', SLD, { position: W([s * (width / 2 - 0.003), 0, 0]), rotation: SIDE })),
      P('Slide Nose', profile([[front - 0.022, bottom], [front, bottom], [front, top - 0.012], [front - 0.006, top - 0.008], [front - 0.022, top - 0.008]], width, round), 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Barrel', cyl(0.0078, 0.0078, front - 0.022, 16), 'steel', SLD, { position: W([0, bore + 0.002, (front - 0.022) / 2]), rotation: ALONG_Z }),
    );
  } else {
    parts.push(P('Slide', profile([[back, bottom], [front, bottom], [front, top - 0.006], [front - 0.008, top], [back + 0.006, top], [back, top - 0.006]], width, round), 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }));
    if (o.bushing) parts.push(P('Barrel Bushing', cyl(0.0098, 0.0098, 0.006, 18), 'slide', SLD, { position: W([0, bore, front + 0.002]), rotation: ALONG_Z }));
  }
  parts.push(
    P('Serrations', rbox(width + 0.0012, h * 0.7, 0.0022, 0), 'groove', SLD, { position: W([0, bottom + h * 0.5, back + 0.01]), modifiers: arrayZ(o.serrations || 7, 0.0052) }),
    P('Ejection Port', rbox(0.002, Math.min(0.016, h * 0.5), 0.034, 0.001), 'groove', SLD, { position: W([-(width / 2 + 0.0004), bore + 0.006, -0.004]) }),
    P('Rear Sight', rbox(0.017, 0.009, 0.01, 0.002), 'slide', SLD, { position: W([0, top + 0.0035, back + 0.016]) }),
    P('Rear Notch', rbox(0.004, 0.006, 0.0104, 0), 'groove', SLD, { position: W([0, top + 0.0062, back + 0.016]), castShadow: false }),
    ...[1, -1].map((s) => P(s > 0 ? 'Rear Dot L' : 'Rear Dot R', rbox(0.0022, 0.0022, 0.0008, 0), o.dots || 'white', SLD, { position: W([s * 0.0052, top + 0.005, back + 0.0108]), castShadow: false })),
    P('Front Sight', rbox(0.0045, 0.009, 0.007, 0.0012), 'slide', SLD, { position: W([0, top + 0.0035, front - 0.012]) }),
    P('Front Dot', rbox(0.0024, 0.0024, 0.0008, 0), o.frontDot || o.dots || 'white', SLD, { position: W([0, top + 0.005, front - 0.0157]), castShadow: false }),
    P('Muzzle Bore', cyl(0.0046, 0.0046, 0.003, 14), 'groove', SLD, { position: W([0, bore, front + 0.0012]), rotation: ALONG_Z }),
  );
  if (o.frontSerrations) parts.push(P('Front Serrations', rbox(width + 0.0012, h * 0.6, 0.0022, 0), 'groove', SLD, { position: W([0, bottom + h * 0.5, front - 0.045]), modifiers: arrayZ(4, 0.0052) }));
  if (o.decocker) parts.push(...[1, -1].map((s) => P(s > 0 ? 'Decocker L' : 'Decocker R', rbox(0.004, 0.008, 0.02, 0.0015), 'steel', SLD, { position: W([s * (width / 2 + 0.002), top - 0.01, back + 0.03]) })));
  // ---- frame, grip, controls
  const ff = o.frameFront ?? front - 0.01;
  parts.push(
    P('Frame', profile([[back - 0.002, bottom + 0.001], [-0.124, -0.111], [-0.054, -0.111], [-0.03, -0.012], [0.042, -0.012], [0.056, 0.002], [ff, 0.002], [ff, bottom + 0.001]], width - 0.002, 0.004), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Grip', profile([[-0.09, 0.024], [-0.032, 0.024], [-0.032, -0.01], [-0.054, -0.108], [-0.12, -0.108]], width + 0.008, 0.007), 'grip', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Trigger Guard', torus(0.017, 0.0034, { tubularSegments: 24 }), 'frame', WPN, { position: W([0, -0.02, 0.006]), rotation: [0, 0, 90], scale: [1, 1, o.guardScale || 1.5] }),
    P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.02], [-0.006, -0.03], [-0.01, -0.027], [-0.005, -0.017]], 0.007, 0.0012), 'steel', TRG, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Slide Stop', rbox(0.004, 0.006, 0.022, 0.0015), 'steel', WPN, { position: W([width / 2 + 0.002, bottom - 0.004, -0.012]) }),
    P('Mag Release', rbox(0.005, 0.009, 0.009, 0.002), 'steel', WPN, { position: W([width / 2 + 0.002, -0.022, -0.04]) }),
  );
  if (o.squareGuard) parts.push(P('Guard Front', rbox(0.0068, 0.026, 0.006, 0.002), 'frame', WPN, { position: W([0, -0.02, 0.031]) }));
  if (o.hookGuard) parts.push(P('Guard Hook', rbox(0.0068, 0.008, 0.012, 0.003), 'frame', WPN, { position: W([0, -0.036, 0.036]), rotation: [-30, 0, 0] }));
  if (o.hammer) parts.push(P('Hammer', profile([[-0.086, 0.04], [-0.096, 0.042], [-0.106, 0.058], [-0.104, 0.066], [-0.096, 0.066], [-0.09, 0.054]], 0.008, 0.0015), o.hammerMat || 'steel', WPN, { position: W([0, 0, 0]), rotation: SIDE }));
  if (o.gripSafety) parts.push(
    P('Beavertail', profile([[-0.088, 0.036], [-0.11, 0.034], [-0.118, 0.026], [-0.1, 0.018], [-0.09, 0.012]], width - 0.004, 0.003), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Thumb Safety', rbox(0.004, 0.006, 0.026, 0.0015), 'frame', WPN, { position: W([width / 2 + 0.002, bottom - 0.002, -0.08]) }),
    P('Mainspring Housing', profile([[-0.096, 0.004], [-0.122, -0.106], [-0.116, -0.108], [-0.092, -0.004]], width - 0.004, 0.002), 'groove', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
  );
  if (o.rail) parts.push(
    P('Accessory Rail', rbox(0.02, 0.007, ff - 0.062, 0.001), 'frame', WPN, { position: W([0, -0.0015, (ff + 0.062) / 2]) }),
    P('Rail Slots', rbox(0.0205, 0.003, 0.0035, 0), 'groove', WPN, { position: W([0, -0.004, 0.068]), modifiers: arrayZ(Math.floor((ff - 0.07) / 0.01), 0.01), castShadow: false }),
  );
  if (o.panels) parts.push(P('Grip Panel Screws', cyl(0.003, 0.003, width + 0.0094, 10), 'steel', WPN, { position: W([0, -0.03, -0.08]), rotation: [0, 0, 90] }));
  // ---- magazine (the Desert Eagle's seat), muzzle flash
  parts.push(
    P('Magazine', profile([[-0.084, 0.024], [-0.038, 0.024], [-0.056, -0.108], [-0.112, -0.108]], 0.02, 0.003), 'magSteel', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
    P('Mag Base', rbox(0.027, 0.01, 0.07, 0.003), o.magBase || 'frame', MAG, { position: W([0, -0.113, -0.083]) }),
    P('Top Round', { type: 'capsule', radius: 0.0048, length: 0.018, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.026, -0.062]), rotation: ALONG_Z }),
    ...flashParts(W, bore, front, 0.8),
  );
  const points = { muzzle: [0, bore, front + 0.002], eject: [-(width / 2 + 0.002), bore + 0.008, -0.004], sightRear: [0, sight, back + 0.016], sightFront: [0, sight, front - 0.012] };
  return { parts: [...parts, ...(o.extra || [])], points };
}
const handgun = (id, name, materials, o) => ({ ...DEAGLE, id, name, materials: { ...BASE_MATS, magSteel: { color: '#2a2b2e', roughness: 0.4, metallic: 0.9 }, ...materials }, ...pistol(o) });

export const M1911 = handgun('m1911', 'M1911A1', {
  slide: { color: '#2b2f33', roughness: 0.45, metallic: 0.85, pattern: 'metal', patternScale: 3, patternStrength: 0.6 },
  frame: { color: '#2b2f33', roughness: 0.45, metallic: 0.85, pattern: 'metal', patternScale: 3, patternStrength: 0.6 },
  grip: { color: '#6a3a1c', roughness: 0.45, pattern: 'checker', patternScale: 150, patternColor: '#3a1c0a', patternStrength: 0.6 },
}, { back: -0.092, front: 0.112, top: 0.064, width: 0.024, round: 0.006, bore: 0.045, hammer: true, gripSafety: true, bushing: true, guardScale: 1.35, panels: true, serrations: 8, dots: 'groove', frontDot: 'groove' });

export const BERETTA = handgun('beretta', 'Beretta 92FS', {
  slide: { color: '#1d1e20', roughness: 0.55, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  frame: { color: '#202123', roughness: 0.55, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  grip: { color: '#141415', roughness: 0.7, pattern: 'checker', patternScale: 180, patternColor: '#060606', patternStrength: 0.5 },
}, { back: -0.096, front: 0.122, top: 0.064, width: 0.025, bore: 0.046, openTop: true, hammer: true, decocker: true, squareGuard: true, guardScale: 1.6 });

export const P226 = handgun('p226', 'SIG P226', {
  slide: { color: '#1b1c1e', roughness: 0.4, metallic: 0.8, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  frame: { color: '#232427', roughness: 0.5, metallic: 0.6, pattern: 'metal', patternScale: 2 },
  grip: { color: '#18191b', roughness: 0.8, pattern: 'checker', patternScale: 220, patternColor: '#08090a', patternStrength: 0.6 },
}, { back: -0.092, front: 0.108, top: 0.069, width: 0.027, round: 0.002, bore: 0.047, hammer: true, rail: true, frontSerrations: false, guardScale: 1.55, extra: [P('Decocker', rbox(0.004, 0.012, 0.016, 0.002), 'steel', WPN, { position: W([0.0155, 0.012, -0.03]) })] });

export const USP = handgun('usp', 'HK USP .45', {
  slide: { color: '#1e1f21', roughness: 0.5, metallic: 0.7, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  frame: { color: '#18191a', roughness: 0.78, pattern: 'leather', patternScale: 240, patternColor: '#0c0c0d', patternStrength: 0.5 },
  grip: { color: '#18191a', roughness: 0.85, pattern: 'checker', patternScale: 260, patternColor: '#09090a', patternStrength: 0.55 },
}, { back: -0.095, front: 0.112, top: 0.067, width: 0.027, round: 0.007, bore: 0.047, hammer: true, rail: true, guardScale: 1.75, magBase: 'grip', extra: [P('Control Lever', rbox(0.004, 0.008, 0.024, 0.002), 'steel', WPN, { position: W([0.0155, 0.024, -0.08]) })] });

export const FIVESEVEN = handgun('fiveseven', 'FN Five-seveN', {
  slide: { color: '#232527', roughness: 0.45, metallic: 0.6, pattern: 'metal', patternScale: 2, patternStrength: 0.4 },
  frame: { color: '#8f8162', roughness: 0.8, pattern: 'leather', patternScale: 240, patternColor: '#6c5f45', patternStrength: 0.45 },
  grip: { color: '#8a7c5d', roughness: 0.85, pattern: 'checker', patternScale: 260, patternColor: '#6a5d42', patternStrength: 0.5 },
}, { back: -0.086, front: 0.12, bottom: 0.032, top: 0.062, width: 0.022, round: 0.004, bore: 0.045, rail: true, hookGuard: true, guardScale: 1.8, magBase: 'grip', extra: [P('Ambi Safety', rbox(0.026, 0.005, 0.012, 0.002), 'groove', WPN, { position: W([0, 0.004, -0.024]) })] });

// ---- Colt Python: the .44's frame, crane and cylinder with a 6" barrel, ventilated rib and
// a full-length underlug, in deep royal blue with checkered walnut
const RW = (p) => offset(REVOLVER.W0, p);
const RB = 0.04, MUZ = 0.236;
const PYTHON_DROP = ['Front Ramp', 'Red Insert', 'Barrel', 'Barrel Rib', 'Ejector Lug', 'Muzzle Crown', 'Barrel Stamp'];
export const PYTHON = {
  ...REVOLVER, id: 'python', name: 'Colt Python',
  materials: {
    ...REVOLVER.materials,
    blued: { color: '#101827', roughness: 0.12, metallic: 1, pattern: 'metal', patternScale: 3, patternStrength: 0.3 },
    bluedDark: { color: '#0b0f18', roughness: 0.3, metallic: 0.95 },
    walnut: { color: '#5c3218', roughness: 0.35, pattern: 'checker', patternScale: 160, patternColor: '#2a1307', patternStrength: 0.55 },
  },
  parts: [
    ...REVOLVER.parts.filter((p) => !PYTHON_DROP.includes(p.name)),
    P('Barrel', cyl(0.0108, 0.0108, MUZ - 0.044, 22), 'blued', WPN, { position: RW([0, RB, (MUZ + 0.044) / 2]), rotation: ALONG_Z }),
    P('Vent Rib', rbox(0.011, 0.006, MUZ - 0.05, 0.002), 'blued', WPN, { position: RW([0, RB + 0.0135, (MUZ + 0.05) / 2]) }),
    P('Rib Vents', rbox(0.0112, 0.0036, 0.008, 0), 'bluedDark', WPN, { position: RW([0, RB + 0.0118, 0.066]), modifiers: arrayZ(8, 0.021), castShadow: false }),
    P('Underlug', rbox(0.0126, 0.02, MUZ - 0.052, 0.004), 'blued', WPN, { position: RW([0, RB - 0.019, (MUZ + 0.052) / 2]) }),
    P('Front Ramp', profile([[MUZ - 0.03, 0.054], [MUZ - 0.002, 0.054], [MUZ - 0.006, 0.0668], [MUZ - 0.014, 0.0668]], 0.004, 0.0008), 'bluedDark', WPN, { position: RW([0, 0, 0]), rotation: SIDE }),
    P('Muzzle Crown', cyl(0.0048, 0.0048, 0.003, 14), 'bore', WPN, { position: RW([0, RB, MUZ + 0.0005]), rotation: ALONG_Z }),
    P('Barrel Stamp', rbox(0.0004, 0.004, 0.07, 0), 'silver', WPN, { position: RW([0.011, RB, 0.13]), castShadow: false }),
  ],
  points: { ...REVOLVER.points, muzzle: [0, RB, MUZ + 0.002], sightFront: [0, 0.064, MUZ - 0.01] },
};
