// Medieval people built from the engine's parametric shapes: head, hands, limbs and a wardrobe
// of dark-fantasy outfits (peasant, guard, captain, noble, priest, smith, rogue, duke...).
// personDefinition(spec) returns a ShapeForge character definition ready for new Character().
import { BASE_SKELETON, FINGERS, SPRINGS } from './skeleton.js';

const P = (name, shape, material, bind, o = {}) => ({ name, shape, material, bind, position: o.position || [0, 0, 0], rotation: o.rotation || [0, 0, 0], scale: o.scale || [1, 1, 1], modifiers: o.modifiers || [], ...(o.mirror ? { mirror: true } : {}), ...(o.castShadow === false ? { castShadow: false } : {}) });
const sq = (rx, ry, rz, e1, e2, extra = {}) => ({ type: 'superquadric', rx, ry, rz, e1, e2, widthSegments: 24, heightSegments: 16, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1, ...extra });
const rbox = (width, height, depth, bevel, extra = {}) => ({ type: 'box', width, height, depth, bevel, bevelSegments: 2, ...extra });
const sphere = (radius, extra = {}) => ({ type: 'sphere', radius, widthSegments: 16, heightSegments: 10, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, ...extra });
const cyl = (rt, rb, height, seg = 16, extra = {}) => ({ type: 'cylinder', radiusTop: rt, radiusBottom: rb, height, radialSegments: seg, heightSegments: 2, capTop: true, capBottom: true, arc: 360, ...extra });
const lathe = (points, segments = 24, extra = {}) => ({ type: 'lathe', points, segments, arc: 360, smooth: 1, ...extra });
const tube = (path, radii, extra = {}) => ({ type: 'tube', path, radii, radialSegments: 14, samples: 5, caps: false, flatten: 1, arc: 360, arcOffset: 0, twist: 0, ...extra });

export const SKIN = { pale: ['#cdb3a0', '#a9705c'], fair: ['#c9a58c', '#a8654c'], tan: ['#b58a68', '#8f5a3d'], brown: ['#8a5f42', '#5e3624'], dark: ['#6b4530', '#472a1a'], ashen: ['#a89c94', '#7d6a66'], sallow: ['#b8a582', '#8a7050'] };
export const HAIR = { black: '#1c1714', brown: '#3b2a1f', auburn: '#5a2c1c', blond: '#a58a52', grey: '#8d8a86', white: '#d7d3cb', red: '#7a2e1a' };

function materials(s) {
  const skin = SKIN[s.skin || 'fair'], c = s.colors || {};
  if (s.outfit === 'hollow') { skin[0] = skin[0]; }
  return {
    skin: { color: skin[0], roughness: 0.6, pattern: 'skin', patternScale: 6, patternColor: skin[1], sheen: 0.25 },
    lips: { color: '#8a4a42', roughness: 0.5 },
    hair: { color: HAIR[s.hair?.color || 'brown'] || s.hair?.color, roughness: 0.65, pattern: 'hair', patternScale: 4, sheen: 0.4 },
    eye: { color: s.glowEyes ? '#c8a0ff' : '#e9e2da', roughness: 0.1, pattern: 'eye', patternColor: s.eyes || '#3d4d5c', ...(s.glowEyes ? { emissive: '#a56cff', emissiveStrength: 3 } : {}) },
    cloth: { color: c.cloth || '#5a4a3c', roughness: 0.9, pattern: 'fabric', patternScale: 180, sheen: 0.5 },
    cloth2: { color: c.cloth2 || '#3a2f28', roughness: 0.9, pattern: 'fabric', patternScale: 200, sheen: 0.4, doubleSided: true },
    trim: { color: c.trim || '#b08a3a', roughness: 0.4, metallic: 0.8, pattern: 'metal', patternScale: 2 },
    leather: { color: c.leather || '#4a3222', roughness: 0.65, pattern: 'leather', patternScale: 260, patternColor: '#20130a', sheen: 0.2 },
    glove: { color: c.glove || c.leather || '#3a281c', roughness: 0.65, pattern: 'leather', patternScale: 320, patternColor: '#170e07' },
    steel: { color: '#7d8590', roughness: 0.38, metallic: 1, pattern: 'metal', patternScale: 4, patternColor: '#3c4048', patternStrength: 0.7 },
    mail: { color: '#59616b', roughness: 0.5, metallic: 1, pattern: 'corrugated', patternScale: 60, patternColor: '#2c3037', patternStrength: 0.9, doubleSided: true },
    dark: { color: '#211e22', roughness: 0.45, metallic: 0.8, pattern: 'metal', patternScale: 3, patternColor: '#0b0a0c' },
    tabard: { color: c.tabard || '#7a1f26', roughness: 0.9, pattern: 'fabric', patternScale: 160, sheen: 0.5, doubleSided: true },
    emblem: { color: '#141115', roughness: 0.8, doubleSided: true },
    fur: { color: c.fur || '#7d7466', roughness: 1, pattern: 'hair', patternScale: 14, patternColor: '#3c362e', sheen: 0.6 },
    gem: { color: '#8a1230', roughness: 0.1, metallic: 0.3, emissive: '#c01840', emissiveStrength: 0.4 },
    robe: { color: c.robe || '#3a3540', roughness: 0.95, pattern: 'fabric', patternScale: 140, sheen: 0.6, doubleSided: true },
    rope: { color: '#a58f60', roughness: 0.9, pattern: 'hair', patternScale: 6 },
    sole: { color: '#1a130e', roughness: 0.8, pattern: 'leather', patternScale: 300, patternColor: '#0a0604' },
    bone: { color: '#d8ceb8', roughness: 0.7 },
    hose: { color: c.hose || '#3b3833', roughness: 0.95, pattern: 'fabric', patternScale: 220, sheen: 0.3 },
  };
}

// ---------------------------------------------------------------- shared body
function head(s) {
  const f = s.face || {}, hy = 1.705;
  const parts = [
    P('Head', sq(0.097, 0.114, 0.105, 0.78, 0.9), 'skin', { bone: 'head' }, { position: [0, hy, 0.012], modifiers: [{ type: 'profile', axis: 'y', values: [0.72, 0.9, 1.0, 1.0, 0.94] }] }),
    P('Jaw', sq(0.074 * (f.jaw || 1), 0.048, 0.07, 0.62, 0.85), 'skin', { bone: 'head' }, { position: [0, 1.625, 0.038] }),
    P('Nose', { type: 'capsule', radius: 0.0135 * (f.nose || 1), length: 0.026, radialSegments: 10, capSegments: 4 }, 'skin', { bone: 'head' }, { position: [0, 1.699, 0.111], rotation: [-22, 0, 0], scale: [1.05, 1, 1.1] }),
    P('Ear', sq(0.012, 0.031, 0.021, 0.8, 0.8, { widthSegments: 10, heightSegments: 8 }), 'skin', { bone: 'head' }, { position: [0.094, 1.695, 0.004], rotation: [0, -12, 8], mirror: true }),
    P('Eye', sphere(0.0135, { widthSegments: 12, heightSegments: 8 }), 'eye', { bone: 'head' }, { position: [0.036, 1.721, 0.103], rotation: [0, 6, 0], mirror: true, castShadow: false }),
    P('Eyelid', sphere(0.0152, { widthSegments: 12, heightSegments: 6, thetaLength: 80 }), 'skin', { bone: 'head' }, { position: [0.036, 1.7215, 0.1025], rotation: [-30, 6, 0], mirror: true, castShadow: false }),
    P('Brow', rbox(0.04, 0.009, 0.013, 0.004), s.hair?.style === 'bald' ? 'skin' : 'hair', { bone: 'head' }, { position: [0.038, 1.745, 0.108], rotation: [-10, 8, -9 * (f.brow || 1)], mirror: true }),
    P('Mouth', { type: 'capsule', radius: 0.0048, length: 0.03, radialSegments: 8, capSegments: 3 }, 'lips', { bone: 'head' }, { position: [0, 1.651, 0.1], rotation: [0, 0, 90], scale: [1, 1, 0.7] }),
    P('Cheekbone', sq(0.03, 0.014, 0.018, 0.9, 0.9, { widthSegments: 12, heightSegments: 8 }), 'skin', { bone: 'head' }, { position: [0.047, 1.69, 0.076], rotation: [0, 30, -12], mirror: true }),
    P('Brow Ridge', sq(0.034, 0.011, 0.016, 0.8, 0.8, { widthSegments: 12, heightSegments: 6 }), 'skin', { bone: 'head' }, { position: [0.032, 1.736, 0.095], rotation: [-8, 10, -6], mirror: true }),
    P('Chin', sq(0.021, 0.015, 0.017, 0.8, 0.8, { widthSegments: 10, heightSegments: 8 }), 'skin', { bone: 'head' }, { position: [0, 1.607, 0.094] }),
    P('Neck', cyl(0.05, 0.058, 0.15, 14, { heightSegments: 3, capTop: false, capBottom: false }), 'skin', { bones: ['chest', 'neck', 'head'], falloff: 6 }, { position: [0, 1.565, 0.0] }),
  ];
  if (s.scar) parts.push(P('Scar', rbox(0.006, 0.05, 0.004, 0.001), 'lips', { bone: 'head' }, { position: [0.045, 1.71, 0.106], rotation: [0, 8, 22], castShadow: false }));
  return parts;
}
function hair(s) {
  const style = s.hair?.style || 'short', out = [];
  if (style === 'bald') return out;
  const shell = (phiS, phiL, thS, thL, sc = 1.035) => sq(0.097, 0.114, 0.105, 0.78, 0.9, { phiStart: phiS, phiLength: phiL, thetaStart: thS, thetaLength: thL });
  const mods = [{ type: 'profile', axis: 'y', values: [0.72, 0.9, 1.0, 1.0, 0.94] }, { type: 'solidify', thickness: 0.005 }];
  if (style === 'short') out.push(P('Hair', shell(100, 160, 30, 85), 'hair', { bone: 'head' }, { position: [0, 1.705, 0.01], scale: [1.035, 1.02, 1.035], modifiers: mods }));
  if (style === 'long') {
    out.push(P('Hair', shell(90, 180, 20, 110), 'hair', { bone: 'head' }, { position: [0, 1.705, 0.01], scale: [1.04, 1.03, 1.04], modifiers: mods }));
    out.push(P('Hair Fall', rbox(0.19, 0.42, 0.05, 0.02), 'hair', { bones: ['head', 'neck', 'chest'], falloff: 5 }, { position: [0, 1.5, -0.085], modifiers: [{ type: 'taper', axis: 'y', amount: 0.3, curve: 1 }] }));
  }
  if (style === 'wild') out.push(P('Hair', shell(60, 240, 20, 100), 'hair', { bone: 'head' }, { position: [0, 1.71, 0.005], scale: [1.09, 1.05, 1.09], modifiers: [{ type: 'displace', amount: 0.012, scale: 30, seed: 4, octaves: 2 }, ...mods] }));
  if (style === 'tonsure') out.push(P('Hair', shell(90, 180, 70, 60), 'hair', { bone: 'head' }, { position: [0, 1.705, 0.01], scale: [1.035, 1.02, 1.035], modifiers: mods }));
  const b = s.beard;
  if (b === 'short') out.push(P('Beard', sq(0.078, 0.06, 0.07, 0.8, 0.85, { phiStart: 90, phiLength: 180, thetaStart: 70, thetaLength: 110 }), 'hair', { bone: 'head' }, { position: [0, 1.63, 0.045], modifiers: [{ type: 'solidify', thickness: 0.006 }] }));
  if (b === 'long') out.push(P('Beard', sq(0.08, 0.15, 0.075, 0.8, 0.85, { phiStart: 90, phiLength: 180, thetaStart: 60, thetaLength: 120 }), 'hair', { bones: ['head', 'neck'], falloff: 6 }, { position: [0, 1.56, 0.05], modifiers: [{ type: 'taper', axis: 'y', amount: 0.5, curve: 1 }, { type: 'solidify', thickness: 0.006 }] }));
  if (s.mustache) out.push(P('Mustache', tube([[0, 1.671, 0.114], [0.02, 1.67, 0.111], [0.04, 1.661, 0.101], [0.05, 1.645, 0.093]], [0.0105, 0.0085, 0.006, 0.003], { radialSegments: 8, samples: 4, caps: true, flatten: 0.75 }), 'hair', { bone: 'head' }, { mirror: true }));
  return out;
}
function hands(s, mat) {
  const m = mat || s.gloves || 'skin';
  return [
    P('Palm', rbox(0.03, 0.085, 0.074, 0.013), m, { bone: 'hand.L' }, { mirror: true, position: [0.274, 0.885, 0.015], rotation: [0, 0, 6] }),
    ...FINGERS.map((f) => P(f.name[0].toUpperCase() + f.name.slice(1) + ' Finger', { type: 'capsule', radius: f.radius, length: f.length - f.radius, radialSegments: 8, capSegments: 3 }, m, { bones: ['hand.L', f.name + '1.L', f.name + '2.L'], falloff: 9 }, { position: [0.277, 0.845 + 0.004 - (f.length + f.radius) / 2, f.z], mirror: true })),
    P('Thumb', { type: 'capsule', radius: 0.0105, length: 0.034, radialSegments: 8, capSegments: 3 }, m, { bones: ['hand.L', 'thumb1.L', 'thumb2.L'], falloff: 9 }, { position: [0.262, 0.87, 0.055], rotation: [-28, 0, -22], mirror: true }),
  ];
}
const sleeve = (mat, wrist = 0.038, extra = {}) => P('Sleeve', tube([[0.165, 1.452, -0.01], [0.207, 1.33, -0.015], [0.235, 1.175, -0.02], [0.25, 1.05, -0.004], [0.262, 0.965, 0.007]], [0.056, 0.049, 0.043, 0.04, wrist], { radialSegments: 14 }), mat, { bones: ['chest', 'shoulder.L', 'upperArm.L', 'foreArm.L'], falloff: 7 }, { mirror: true, ...extra });
const legs = (mat, extra = {}) => P('Leg', tube([[0.092, 1.0, 0.0], [0.1, 0.76, 0.012], [0.105, 0.53, 0.02], [0.108, 0.33, 0.0], [0.11, 0.17, -0.012]], [0.082, 0.068, 0.055, 0.052, 0.058], { radialSegments: 14 }), mat, { bones: ['hips', 'thigh.L', 'shin.L'], falloff: 7 }, { mirror: true, ...extra });
const torso = (mat, r = 1, extra = {}) => P('Torso', sq(0.158 * r, 0.285, 0.1 * r, 0.55, 0.62, { widthSegments: 26, heightSegments: 18 }), mat, { bones: ['hips', 'spine', 'chest', 'neck'], falloff: 5 }, { position: [0, 1.225, 0.0], modifiers: [{ type: 'profile', axis: 'y', values: [0.9, 0.86, 0.9, 1.0, 1.07, 1.02, 0.75] }], ...extra });
const pelvis = (mat) => P('Pelvis', sq(0.15, 0.09, 0.098, 0.5, 0.62, { taperBottom: 0.7 }), mat, { bones: ['hips', 'thigh.L', 'thigh.R', 'spine'], falloff: 6 }, { position: [0, 0.99, -0.004] });
const belt = (mat = 'leather', buckle = 'trim') => [
  P('Belt', sq(0.166, 0.024, 0.11, 0.12, 0.62, { widthSegments: 28, heightSegments: 6 }), mat, { bones: ['hips', 'spine'], falloff: 8 }, { position: [0, 1.03, 0.0] }),
  P('Buckle', rbox(0.05, 0.04, 0.012, 0.005), buckle, { bone: 'hips' }, { position: [0, 1.03, 0.112] }),
];
const boots = (mat = 'leather', tall = 0.17) => [
  P('Boot Shaft', cyl(0.056, 0.05, tall, 14, { heightSegments: 2, capTop: false }), mat, { bones: ['shin.L', 'foot.L'], falloff: 8 }, { mirror: true, position: [0.11, 0.03 + tall + 0.0, -0.008] }),
  P('Boot Foot', sq(0.047, 0.047, 0.125, 0.6, 0.78), mat, { bones: ['foot.L', 'toe.L'], falloff: 6 }, { mirror: true, position: [0.113, 0.068, 0.045], modifiers: [{ type: 'taper', axis: 'z', amount: -0.32, curve: 1.2 }, { type: 'squash', axis: 'y', min: -0.043, max: 1 }] }),
  P('Boot Sole', rbox(0.088, 0.013, 0.262, 0.005), 'sole', { bones: ['foot.L', 'toe.L'], falloff: 6 }, { mirror: true, position: [0.113, 0.019, 0.048], modifiers: [{ type: 'taper', axis: 'z', amount: -0.3, curve: 1.3 }] }),
];
const cape = (mat, len = 0.72, w = 0.34) => P('Cape', rbox(w, len, 0.012, 0.004), mat, { bone: 'cape' }, { position: [0, 1.46 - len / 2 + 0.0, -0.13], modifiers: [{ type: 'taper', axis: 'y', amount: -0.25, curve: 1 }] });
const shoulderCape = (mat) => P('Mantle', sq(0.19, 0.11, 0.13, 0.8, 0.8, { phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 100 }), mat, { bones: ['chest', 'shoulder.L', 'shoulder.R', 'neck'], falloff: 5 }, { position: [0, 1.47, -0.005], modifiers: [{ type: 'solidify', thickness: 0.01 }] });

// ---------------------------------------------------------------- outfits
const OUTFITS = {
  peasant(s) {
    const p = [torso('cloth'), P('Tunic Skirt', cyl(0.165, 0.2, 0.34, 16, { capTop: false, capBottom: false }), 'cloth', { bones: ['hips', 'thigh.L', 'thigh.R'], falloff: 5 }, { position: [0, 0.83, 0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
      sleeve('cloth', 0.036), pelvis('hose'), legs('hose'), ...belt('rope', 'leather'), ...boots('leather', 0.13), ...hands(s)];
    if (s.apron) p.push(P('Apron', rbox(0.28, 0.62, 0.014, 0.006), 'leather', { bones: ['spine', 'hips'], falloff: 6 }, { position: [0, 0.98, 0.112] }));
    if (s.cap) p.push(P('Cap', sq(0.104, 0.07, 0.11, 0.8, 0.85, { phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 110 }), 'cloth2', { bone: 'head' }, { position: [0, 1.76, 0.008] }));
    if (s.hood) p.push(P('Hood', sq(0.112, 0.125, 0.12, 0.85, 0.9, { thetaStart: 0, thetaLength: 125, phiStart: 70, phiLength: 220 }), 'cloth2', { bone: 'head' }, { position: [0, 1.71, -0.005], modifiers: [{ type: 'solidify', thickness: 0.006 }] }), shoulderCape('cloth2'));
    return p;
  },
  woman(s) {
    const p = [P('Bodice', sq(0.145, 0.22, 0.095, 0.55, 0.62, { widthSegments: 24, heightSegments: 14 }), 'cloth', { bones: ['hips', 'spine', 'chest', 'neck'], falloff: 5 }, { position: [0, 1.26, 0], modifiers: [{ type: 'profile', axis: 'y', values: [0.8, 0.82, 1.0, 1.08, 0.95] }] }),
      P('Dress', lathe([[0.15, 0], [0.19, -0.12], [0.25, -0.34], [0.3, -0.62], [0.315, -0.86]], 22, { smooth: 2 }), 'cloth2', { bones: ['hips', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R'], falloff: 3 }, { position: [0, 1.07, 0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
      sleeve('cloth', 0.034), ...boots('leather', 0.06), ...hands(s)];
    if (s.apron) p.push(P('Apron', rbox(0.3, 0.6, 0.014, 0.006), 'cloth2', { bones: ['spine', 'hips', 'thigh.L', 'thigh.R'], falloff: 4 }, { position: [0, 0.8, 0.14] }));
    if (s.scarf !== false) p.push(P('Headscarf', sq(0.108, 0.122, 0.116, 0.85, 0.9, { thetaStart: 0, thetaLength: 118, phiStart: 60, phiLength: 240 }), 'cloth2', { bone: 'head' }, { position: [0, 1.71, 0.0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }));
    return p;
  },
  guard(s) {
    const p = [torso('mail', 1.06), P('Mail Skirt', cyl(0.17, 0.21, 0.3, 16, { capTop: false, capBottom: false }), 'mail', { bones: ['hips', 'thigh.L', 'thigh.R'], falloff: 5 }, { position: [0, 0.83, 0] }),
      sleeve('mail', 0.04), pelvis('dark'), legs('hose'), ...belt('leather', 'steel'), ...boots('dark', 0.24),
      ...hands(s, 'glove'),
      P('Tabard Front', rbox(0.27, 0.66, 0.012, 0.005), 'tabard', { bone: 'tabard' }, { position: [0, 0.98, 0.128] }),
      P('Tabard Back', rbox(0.27, 0.62, 0.012, 0.005), 'tabard', { bone: 'tabardBack' }, { position: [0, 0.99, -0.128] }),
      P('Tabard Chest', rbox(0.3, 0.3, 0.014, 0.005), 'tabard', { bones: ['chest', 'spine'], falloff: 6 }, { position: [0, 1.31, 0.107] }),
      P('Raven Crest', { type: 'extrude', shape: 'star', points: 4, inner: 0.35, radius: 0.05, teeth: 12, toothDepth: 0.1, depth: 0.004, bevel: 0.001 }, 'emblem', { bones: ['chest', 'spine'], falloff: 6 }, { position: [0, 1.32, 0.116], castShadow: false }),
      P('Pauldron', sphere(0.075, { widthSegments: 12, heightSegments: 8 }), 'steel', { bones: ['chest', 'shoulder.L', 'upperArm.L'], falloff: 8 }, { position: [0.18, 1.445, -0.01], scale: [1.15, 0.62, 1.15], mirror: true }),
      P('Vambrace', cyl(0.043, 0.036, 0.15, 12, { capTop: false, capBottom: false }), 'steel', { bone: 'foreArm.L' }, { position: [0.257, 1.0, 0.003], rotation: [0, 0, 7], mirror: true }),
      P('Gorget', cyl(0.07, 0.085, 0.06, 16, { capTop: false, capBottom: false }), 'steel', { bones: ['chest', 'neck'], falloff: 8 }, { position: [0, 1.52, 0.0] })];
    if (s.helm !== false) {
      p.push(P('Coif', sq(0.112, 0.13, 0.118, 0.85, 0.9, { thetaStart: 25, thetaLength: 150, phiStart: 95, phiLength: 170 }), 'mail', { bone: 'head' }, { position: [0, 1.665, 0.004], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
        P('Helm', lathe([[0.121, -0.01], [0.126, 0.05], [0.119, 0.11], [0.09, 0.15], [0.04, 0.172], [0, 0.176]], 14, { smooth: 1 }), 'steel', { bone: 'head' }, { position: [0, 1.715, 0.006], scale: [1, 1, 1.06] }),
        P('Helm Band', lathe([[0.128, 0.0], [0.133, 0.014], [0.128, 0.03], [0.122, 0.03], [0.122, 0.0]], 14), 'dark', { bone: 'head' }, { position: [0, 1.7, 0.006], scale: [1, 1, 1.06] }),
        P('Nasal', rbox(0.016, 0.1, 0.014, 0.003), 'steel', { bone: 'head' }, { position: [0, 1.712, 0.128] }),
        P('Cheek Plate', rbox(0.012, 0.075, 0.07, 0.003), 'steel', { bone: 'head' }, { position: [0.108, 1.68, 0.03], rotation: [0, -8, 0], mirror: true }));
    }
    return p;
  },
  captain(s) {
    const p = OUTFITS.guard({ ...s, helm: false });
    p.push(P('Great Helm', lathe([[0.13, 0], [0.135, 0.09], [0.13, 0.16], [0.1, 0.215], [0.045, 0.245], [0, 0.25]], 20, { smooth: 1 }), 'dark', { bone: 'head' }, { position: [0, 1.65, 0.006], scale: [1, 1, 1.05] }),
      P('Visor Slit', rbox(0.15, 0.014, 0.01, 0.002), 'emblem', { bone: 'head' }, { position: [0, 1.735, 0.14], castShadow: false }),
      P('Crest', rbox(0.02, 0.09, 0.22, 0.008), 'tabard', { bone: 'head' }, { position: [0, 1.93, -0.02], modifiers: [{ type: 'bend', axis: 'z', toward: 'y', angle: 24 }] }),
      cape('tabard', 0.85, 0.42), P('Breastplate', sq(0.16, 0.18, 0.108, 0.55, 0.6, { widthSegments: 22, heightSegments: 14 }), 'dark', { bones: ['spine', 'chest'], falloff: 6 }, { position: [0, 1.3, 0.004] }));
    return p;
  },
  noble(s) {
    const p = [torso('cloth', 1.02), P('Coat Skirt', cyl(0.165, 0.245, 0.5, 18, { capTop: false, capBottom: false }), 'cloth', { bones: ['hips', 'thigh.L', 'thigh.R'], falloff: 4 }, { position: [0, 0.76, 0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
      sleeve('cloth', 0.04), pelvis('hose'), legs('hose'), ...belt('trim', 'trim'), ...boots('leather', 0.2), ...hands(s),
      P('Trim Collar', cyl(0.085, 0.1, 0.05, 16, { capTop: false, capBottom: false }), 'trim', { bones: ['chest', 'neck'], falloff: 8 }, { position: [0, 1.52, 0] }),
      P('Chain', { type: 'torus', radius: 0.11, tube: 0.008, radialSegments: 6, tubularSegments: 22, arc: 360, tubeScaleY: 1 }, 'trim', { bones: ['chest', 'spine'], falloff: 6 }, { position: [0, 1.44, 0.03], rotation: [82, 0, 0] })];
    if (s.cloak !== false) p.push(cape('cloth2', 0.95, 0.4));
    if (s.hat) p.push(P('Hat', lathe([[0.11, 0], [0.114, 0.05], [0.1, 0.1], [0.07, 0.115], [0, 0.118]], 20), 'cloth2', { bone: 'head' }, { position: [0, 1.79, -0.004], rotation: [-6, 0, 0] }), P('Hat Brim', lathe([[0.1, 0], [0.16, 0.004], [0.165, 0.016], [0.1, 0.012]], 24), 'cloth2', { bone: 'head' }, { position: [0, 1.792, -0.004], rotation: [-6, 0, 0] }));
    return p;
  },
  duke(s) {
    const p = OUTFITS.noble({ ...s, hat: false });
    p.push(P('Fur Mantle', sq(0.22, 0.13, 0.15, 0.8, 0.8, { thetaStart: 0, thetaLength: 105 }), 'fur', { bones: ['chest', 'shoulder.L', 'shoulder.R', 'neck'], falloff: 5 }, { position: [0, 1.47, -0.005], modifiers: [{ type: 'solidify', thickness: 0.02 }] }),
      P('Circlet', { type: 'torus', radius: 0.104, tube: 0.008, radialSegments: 6, tubularSegments: 28, arc: 360, tubeScaleY: 1 }, 'trim', { bone: 'head' }, { position: [0, 1.78, 0.008], rotation: [90, 0, 0], scale: [1, 1.05, 1] }),
      P('Circlet Gem', sphere(0.014, { widthSegments: 8, heightSegments: 6 }), 'gem', { bone: 'head' }, { position: [0, 1.782, 0.112] }));
    return p;
  },
  priest(s) {
    const p = [P('Robe Top', sq(0.16, 0.26, 0.108, 0.55, 0.62, { widthSegments: 24, heightSegments: 16 }), 'robe', { bones: ['hips', 'spine', 'chest', 'neck'], falloff: 5 }, { position: [0, 1.24, 0], modifiers: [{ type: 'profile', axis: 'y', values: [0.9, 0.88, 0.95, 1.05, 1.1, 1.0, 0.75] }] }),
      P('Robe Skirt', lathe([[0.17, 0], [0.22, -0.2], [0.29, -0.55], [0.34, -0.95]], 24, { smooth: 2 }), 'robe', { bones: ['hips', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R'], falloff: 3 }, { position: [0, 1.06, 0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
      P('Wide Sleeve', tube([[0.165, 1.452, -0.01], [0.215, 1.32, -0.015], [0.25, 1.16, -0.02], [0.27, 1.02, 0.0], [0.28, 0.93, 0.01]], [0.06, 0.06, 0.07, 0.085, 0.09], { radialSegments: 14 }), 'robe', { bones: ['chest', 'shoulder.L', 'upperArm.L', 'foreArm.L'], falloff: 7 }, { mirror: true }),
      P('Rope Belt', sq(0.166, 0.02, 0.112, 0.12, 0.62, { widthSegments: 24, heightSegments: 6 }), 'rope', { bones: ['hips', 'spine'], falloff: 8 }, { position: [0, 1.06, 0.0] }),
      P('Stole', rbox(0.11, 0.85, 0.014, 0.005), 'trim', { bones: ['chest', 'spine', 'hips'], falloff: 5 }, { position: [0, 1.05, 0.112] }),
      P('Pale Sigil', { type: 'torus', radius: 0.034, tube: 0.005, radialSegments: 6, tubularSegments: 18, arc: 360, tubeScaleY: 1 }, 'bone', { bones: ['chest', 'spine'], falloff: 6 }, { position: [0, 1.36, 0.118], rotation: [90, 0, 0] }),
      ...hands(s), ...boots('leather', 0.02)];
    if (s.hood) p.push(P('Hood', sq(0.112, 0.125, 0.12, 0.85, 0.9, { thetaStart: 0, thetaLength: 125, phiStart: 70, phiLength: 220 }), 'robe', { bone: 'head' }, { position: [0, 1.71, -0.005], modifiers: [{ type: 'solidify', thickness: 0.006 }] }), shoulderCape('robe'));
    return p;
  },
  hollow(s) {
    const p = [torso('cloth', 0.85), P('Rags', cyl(0.15, 0.22, 0.5, 8, { capTop: false, capBottom: false }), 'cloth2', { bones: ['hips', 'thigh.L', 'thigh.R'], falloff: 5 }, { position: [0, 0.8, 0], modifiers: [{ type: 'displace', amount: 0.03, scale: 12, seed: 3, octaves: 2 }, { type: 'solidify', thickness: 0.006 }] }),
      P('Ragged Sleeve', tube([[0.165, 1.452, -0.01], [0.207, 1.33, -0.015], [0.235, 1.175, -0.02], [0.25, 1.05, -0.004], [0.262, 0.965, 0.007]], [0.036, 0.03, 0.026, 0.024, 0.022], { radialSegments: 8 }), 'skin', { bones: ['chest', 'shoulder.L', 'upperArm.L', 'foreArm.L'], falloff: 7 }, { mirror: true }),
      pelvis('hose'), P('Bare Leg', tube([[0.092, 1.0, 0.0], [0.1, 0.76, 0.012], [0.105, 0.53, 0.02], [0.108, 0.33, 0.0], [0.11, 0.17, -0.012]], [0.05, 0.04, 0.034, 0.03, 0.034], { radialSegments: 8 }), 'skin', { bones: ['hips', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R'], falloff: 7 }, { mirror: true }),
      ...hands(s, 'skin'),
      P('Skull Jaw', sq(0.06, 0.03, 0.06, 0.7, 0.8, { widthSegments: 10, heightSegments: 6 }), 'bone', { bone: 'head' }, { position: [0, 1.63, 0.048] }),
      P('Socket', sphere(0.028, { widthSegments: 8, heightSegments: 6 }), 'dark', { bone: 'head' }, { position: [0.04, 1.72, 0.09], scale: [1, 1.2, 0.8], mirror: true, castShadow: false }),
      P('Rib Cage', { type: 'torus', radius: 0.11, tube: 0.011, radialSegments: 5, tubularSegments: 14, arc: 360, tubeScaleY: 1 }, 'bone', { bones: ['spine', 'chest'], falloff: 6 }, { position: [0, 1.3, 0.02], rotation: [90, 0, 0], modifiers: [{ type: 'array', count: 4, offsetX: 0, offsetY: 0, offsetZ: 0.06, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 0.94 }] })];
    return p;
  },
  smith(s) {
    return [torso('cloth', 1.15), sleeve('skin', 0.05), pelvis('hose'), legs('hose'), ...belt('leather', 'steel'), ...boots('leather', 0.16), ...hands(s, 'glove'),
      P('Apron', rbox(0.34, 0.75, 0.016, 0.006), 'leather', { bones: ['spine', 'hips', 'thigh.L', 'thigh.R'], falloff: 5 }, { position: [0, 0.98, 0.125] }),
      P('Apron Bib', rbox(0.24, 0.3, 0.014, 0.005), 'leather', { bones: ['chest', 'spine'], falloff: 6 }, { position: [0, 1.3, 0.115] })];
  },
  rogue(s) {
    const p = [torso('leather', 1.0), P('Coat Skirt', cyl(0.165, 0.23, 0.42, 16, { capTop: false, capBottom: false }), 'leather', { bones: ['hips', 'thigh.L', 'thigh.R'], falloff: 5 }, { position: [0, 0.8, 0], modifiers: [{ type: 'solidify', thickness: 0.006 }] }),
      sleeve('leather', 0.036), pelvis('hose'), legs('hose'), ...belt('leather', 'steel'), ...boots('leather', 0.22), ...hands(s, 'glove'),
      P('Cape', rbox(0.4, 0.9, 0.012, 0.004), 'cloth2', { bone: 'cape' }, { position: [0, 1.0, -0.13], modifiers: [{ type: 'taper', axis: 'y', amount: -0.3, curve: 1 }] }),
      shoulderCape('cloth2'),
      P('Scarf', cyl(0.07, 0.078, 0.07, 14, { capTop: false, capBottom: false }), 'cloth', { bones: ['chest', 'neck'], falloff: 8 }, { position: [0, 1.54, 0.005] }),
      P('Bandolier', rbox(0.05, 0.5, 0.012, 0.004), 'leather', { bones: ['chest', 'spine'], falloff: 8 }, { position: [0.02, 1.27, 0.11], rotation: [0, 0, 38] }),
      P('Dagger Sheath', rbox(0.024, 0.16, 0.024, 0.006), 'leather', { bone: 'hips' }, { position: [0.17, 0.98, 0.04], rotation: [8, 0, -6] })];
    // the Gray Hand's mark: a pale half-mask over the mouth and nose
    if (s.mask) p.push(P('Mask', sq(0.07, 0.045, 0.05, 0.7, 0.8, { widthSegments: 12, heightSegments: 8 }), 'bone', { bone: 'head' }, { position: [0, 1.655, 0.06] }),
      P('Mask Mark', rbox(0.014, 0.034, 0.006, 0.001), 'emblem', { bone: 'head' }, { position: [0, 1.66, 0.108] }));
    if (s.hood !== false) p.push(P('Hood', sq(0.116, 0.13, 0.126, 0.85, 0.9, { thetaStart: 0, thetaLength: 130, phiStart: 62, phiLength: 236 }), 'cloth2', { bone: 'head' }, { position: [0, 1.712, -0.008], modifiers: [{ type: 'solidify', thickness: 0.007 }] }),
      P('Hood Point', { type: 'cone', radius: 0.05, height: 0.14, radialSegments: 10, capBottom: true }, 'cloth2', { bone: 'head' }, { position: [0, 1.79, -0.11], rotation: [-118, 0, 0] }));
    return p;
  },
};

const SEG = ['widthSegments', 'heightSegments', 'radialSegments', 'tubularSegments', 'capSegments', 'segments', 'samples'];
// The look is chunky on purpose (the game renders at 480x270): thin out the tessellation of every part.
function lowpoly(parts, k) {
  if (k >= 1) return parts;
  for (const p of parts) for (const key of SEG) if (typeof p.shape[key] === 'number') p.shape[key] = Math.max(key === 'samples' ? 2 : 5, Math.round(p.shape[key] * k));
  return parts;
}
export function personDefinition(spec) {
  const s = { ...spec };
  const outfit = OUTFITS[s.outfit || 'peasant'];
  const parts = lowpoly([...head(s), ...hair(s), ...outfit(s)], spec.poly ?? 0.55);
  const extra = [];
  const want = new Set();
  for (const p of parts) for (const b of [p.bind?.bone, ...(p.bind?.bones || [])]) if (b && SPRINGS[b]) want.add(b);
  for (const b of want) extra.push(SPRINGS[b]);
  const def = { name: s.name || 'Person', skeleton: [...BASE_SKELETON, ...extra], materials: materials(s), parts, clips: [] };
  return def;
}
export const OUTFIT_NAMES = Object.keys(OUTFITS);
