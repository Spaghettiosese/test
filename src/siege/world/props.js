// Furniture and scenery for the map. Every builder returns visual primitives and collision
// boxes in a local frame: origin at the footprint centre on the floor, +z is the front.
// place() rotates them by a multiple of 90 degrees and moves them into the world.
//   visual: { t:'box', c:[x,y,z], s:[w,h,d], m:'material' }  |  { t:'cyl', c, r, h, m }  |  { t:'sph', c, r, m }
//   collider: { c, s, absorb } (absorb: how much a bullet is slowed passing through)

const box = (c, s, m) => ({ t: 'box', c, s, m });
const cyl = (c, r, h, m, seg = 14) => ({ t: 'cyl', c, r, h, m, seg });
const sph = (c, r, m) => ({ t: 'sph', c, r, m });
const col = (c, s, absorb = 1, extra = {}) => ({ c, s, absorb, ...extra });
const colorKey = (c, fallback) => 'c:' + (c || fallback);

export const BUILDERS = {
  crate({ stack = 1 }) {
    const v = [], c = [];
    for (let i = 0; i < stack; i++) v.push(box([0, 0.45 + i * 0.9, 0], [0.9, 0.9, 0.9], 'crate'), box([0, 0.45 + i * 0.9, 0], [0.94, 0.07, 0.94], 'crateTrim'), box([0, 0.2 + i * 0.9, 0], [0.94, 0.07, 0.94], 'crateTrim'));
    c.push(col([0, 0.45 * stack, 0], [0.9, 0.9 * stack, 0.9], 0.8));
    return { v, c };
  },
  barrel() { return { v: [cyl([0, 0.45, 0], 0.3, 0.9, 'barrel'), cyl([0, 0.7, 0], 0.31, 0.04, 'barrelBand'), cyl([0, 0.2, 0], 0.31, 0.04, 'barrelBand')], c: [col([0, 0.45, 0], [0.55, 0.9, 0.55], 1.5)] }; },
  tires() { return { v: [cyl([0, 0.15, 0], 0.4, 0.3, 'rubber'), cyl([0, 0.45, 0], 0.4, 0.3, 'rubber'), cyl([0.55, 0.15, 0.1], 0.38, 0.3, 'rubber')], c: [col([0.2, 0.3, 0.05], [1.4, 0.6, 0.9], 1)] }; },
  pallet() { return { v: [box([0, 0.06, 0], [1.1, 0.12, 1.1], 'palletWood'), box([0, 0.32, 0], [0.95, 0.4, 0.95], 'crate')], c: [col([0, 0.28, 0], [1.1, 0.56, 1.1], 0.8, { noStand: false })] }; },
  toolbox() { return { v: [box([0, 0.5, 0], [0.7, 1.0, 0.5], 'toolRed'), box([0, 0.55, 0.26], [0.6, 0.12, 0.02], 'chrome'), box([0, 0.85, 0.26], [0.6, 0.12, 0.02], 'chrome')], c: [col([0, 0.5, 0], [0.7, 1.0, 0.5], 1.4)] }; },
  bench({ w = 2 }) { return { v: [box([0, 0.5, 0], [w, 0.07, 0.8], 'benchTop'), box([-w / 2 + 0.1, 0.25, 0], [0.08, 0.5, 0.7], 'metalDark'), box([w / 2 - 0.1, 0.25, 0], [0.08, 0.5, 0.7], 'metalDark'), box([0, 0.96, -0.36], [w, 0.4, 0.04], 'pegboard')], c: [col([0, 0.28, 0], [w, 0.56, 0.8], 0.8, { cover: 'low' })] }; },
  desk({ w = 1.8 }) {
    return { v: [box([0, 0.73, 0], [w, 0.05, 0.8], 'deskTop'), box([-w / 2 + 0.05, 0.36, 0], [0.05, 0.72, 0.75], 'deskLeg'), box([w / 2 - 0.05, 0.36, 0], [0.05, 0.72, 0.75], 'deskLeg'), box([0, 0.5, -0.36], [w - 0.1, 0.5, 0.03], 'deskLeg'),
      box([-w * 0.25, 0.97, -0.1], [0.55, 0.34, 0.03], 'screen'), box([-w * 0.25, 0.8, -0.1], [0.1, 0.08, 0.1], 'metalDark'), box([-w * 0.25, 0.76, 0.2], [0.4, 0.02, 0.14], 'plasticBlack')],
      c: [col([0, 0.37, 0], [w, 0.74, 0.8], 0.7, { cover: 'low' })] };
  },
  chair({ }) { return { v: [box([0, 0.45, 0], [0.45, 0.06, 0.45], 'plasticBlack'), box([0, 0.75, -0.2], [0.45, 0.5, 0.05], 'plasticBlack'), cyl([0, 0.22, 0], 0.04, 0.44, 'chrome', 8), box([0, 0.03, 0], [0.5, 0.05, 0.05], 'chrome')], c: [] }; },
  table({ w = 1.6, d = 0.9 }) { return { v: [box([0, 0.74, 0], [w, 0.06, d], 'tableTop'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box([a * (w / 2 - 0.08), 0.36, b * (d / 2 - 0.08)], [0.06, 0.72, 0.06], 'metalDark'))], c: [col([0, 0.4, 0], [w, 0.8, d], 0.7, { cover: 'low' })] }; },
  counter({ w = 3 }) { return { v: [box([0, 0.5, 0], [w, 1.0, 0.7], 'counterBody'), box([0, 1.03, 0], [w + 0.1, 0.06, 0.8], 'counterTop')], c: [col([0, 0.53, 0], [w, 1.06, 0.8], 1, { cover: 'low' })] }; },
  bar({ w = 3 }) { return { v: [box([0, 0.55, 0], [w, 1.1, 0.7], 'barBody'), box([0, 1.13, 0.05], [w + 0.1, 0.06, 0.9], 'counterTop'), box([0, 1.5, -0.32], [w, 0.8, 0.04], 'mirror'), box([0, 1.1, -0.3], [w, 0.04, 0.3], 'barBody')], c: [col([0, 0.58, 0], [w, 1.16, 0.9], 1, { cover: 'low' })] }; },
  couch({ color }) {
    const m = colorKey(color, '#3d4a5a');
    return { v: [box([0, 0.25, 0], [2.0, 0.5, 0.9], m), box([0, 0.65, -0.35], [2.0, 0.5, 0.2], m), box([-0.95, 0.5, 0], [0.12, 0.55, 0.9], m), box([0.95, 0.5, 0], [0.12, 0.55, 0.9], m), box([-0.45, 0.52, 0.05], [0.85, 0.1, 0.72], m + '|2'), box([0.45, 0.52, 0.05], [0.85, 0.1, 0.72], m + '|2')], c: [col([0, 0.4, 0], [2.0, 0.8, 0.9], 0.9, { cover: 'low' })] };
  },
  shelf({ w = 2, guns = false }) {
    const v = [box([-w / 2 + 0.03, 1, 0], [0.05, 2, 0.45], 'metalDark'), box([w / 2 - 0.03, 1, 0], [0.05, 2, 0.45], 'metalDark'), box([0, 1, -0.2], [w, 2, 0.03], 'metalDark')];
    for (let i = 0; i < 5; i++) {
      v.push(box([0, 0.1 + i * 0.45, 0], [w, 0.04, 0.45], 'metalShelf'));
      const n = Math.floor(w / 0.5);
      for (let k = 0; k < n; k++) if ((k * 7 + i * 3) % 5 !== 0) v.push(guns ? box([-w / 2 + 0.3 + k * 0.5, 0.3 + i * 0.45, 0.02], [0.4, 0.14, 0.3], k % 2 ? 'gunCase' : 'ammoBox') : box([-w / 2 + 0.3 + k * 0.5, 0.26 + i * 0.45, 0.02], [0.4, 0.34 - (k % 3) * 0.06, 0.34], ['cardboard', 'cardboard', 'blueBin'][(k + i) % 3]));
    }
    return { v, c: [col([0, 1, 0], [w, 2, 0.45], 1.2)] };
  },
  archive({ }) { const v = [box([0, 1, 0], [1.2, 2, 0.5], 'metalGrey')]; for (let i = 0; i < 4; i++) v.push(box([0, 0.35 + i * 0.5, 0.26], [1.0, 0.36, 0.02], 'metalDark'), box([0, 0.35 + i * 0.5, 0.28], [0.2, 0.04, 0.02], 'chrome')); return { v, c: [col([0, 1, 0], [1.2, 2, 0.5], 1.6)] }; },
  lockers({ n = 4 }) {
    const w = 0.6, v = [], tot = n * w;
    for (let i = 0; i < n; i++) {
      const x = -tot / 2 + w / 2 + i * w;
      v.push(box([x, 1.0, 0], [w - 0.02, 2.0, 0.5], i % 3 === 1 ? 'lockerB' : 'lockerA'), box([x, 1.55, 0.255], [0.38, 0.22, 0.01], 'vent'), box([x, 0.4, 0.255], [0.38, 0.22, 0.01], 'vent'), box([x + 0.18, 1.0, 0.262], [0.03, 0.18, 0.025], 'chrome'));
    }
    v.push(box([0, 2.02, 0], [tot, 0.04, 0.5], 'metalDark'));
    return { v, c: [col([0, 1, 0], [tot, 2, 0.5], 1.6)] };
  },
  stalls({ n = 3 }) { const v = [], w = 1.1; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * w; v.push(box([x, 1.0, 0], [w - 0.05, 2.0, 0.05], 'stallPanel'), box([x + (w - 0.05) / 2, 1.0, 0.5], [0.04, 1.8, 1.0], 'stallPanel')); } return { v, c: [col([0, 1, 0], [n * w, 2, 0.1], 1)] }; },
  vending() { return { v: [box([0, 0.95, 0], [0.95, 1.9, 0.8], 'vendRed'), box([-0.1, 1.2, 0.41], [0.6, 1.0, 0.02], 'vendGlass'), box([0.35, 1.0, 0.41], [0.18, 0.6, 0.02], 'metalDark'), box([0, 0.3, 0.41], [0.7, 0.18, 0.02], 'plasticBlack')], c: [col([0, 0.95, 0], [0.95, 1.9, 0.8], 2)] }; },
  fridge() { return { v: [box([0, 0.95, 0], [0.9, 1.9, 0.75], 'chrome'), box([0.35, 1.0, 0.39], [0.04, 1.2, 0.04], 'metalDark'), box([0, 1.3, 0.38], [0.88, 0.02, 0.02], 'metalDark')], c: [col([0, 0.95, 0], [0.9, 1.9, 0.75], 2)] }; },
  server({ n = 3 }) { const v = [], c = []; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 0.85; v.push(box([x, 1.0, 0], [0.8, 2.0, 0.9], 'rack')); for (let k = 0; k < 8; k++) v.push(box([x, 0.3 + k * 0.2, 0.46], [0.7, 0.14, 0.02], k % 3 === 0 ? 'ledGreen' : 'plasticBlack')); } c.push(col([0, 1, 0], [n * 0.85, 2, 0.9], 2)); return { v, c }; },
  plant() { return { v: [cyl([0, 0.2, 0], 0.22, 0.4, 'pot'), cyl([0, 0.5, 0], 0.04, 0.5, 'barkDark', 6), sph([0, 1.0, 0], 0.42, 'leaf'), sph([0.18, 1.3, 0.1], 0.28, 'leaf')], c: [col([0, 0.6, 0], [0.45, 1.2, 0.45], 0.4)] }; },
  tv() { return { v: [box([0, 1.6, 0], [1.4, 0.8, 0.07], 'plasticBlack'), box([0, 1.6, 0.04], [1.3, 0.72, 0.01], 'screenOn')], c: [] }; },
  pooltable() { return { v: [box([0, 0.78, 0], [2.6, 0.12, 1.4], 'felt'), box([0, 0.86, 0], [2.3, 0.04, 1.1], 'feltTop'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box([a * 1.15, 0.38, b * 0.55], [0.18, 0.76, 0.18], 'tableWood')), box([0, 0.78, 0.68], [2.6, 0.14, 0.14], 'tableWood'), box([0, 0.78, -0.68], [2.6, 0.14, 0.14], 'tableWood')], c: [col([0, 0.45, 0], [2.6, 0.9, 1.4], 0.8, { cover: 'low' })] }; },
  rack({ w = 2.4 }) { return { v: [box([-w / 2 + 0.05, 0.7, 0], [0.08, 1.4, 0.5], 'metalDark'), box([w / 2 - 0.05, 0.7, 0], [0.08, 1.4, 0.5], 'metalDark'), box([0, 1.2, 0], [w, 0.06, 0.1], 'chrome'), ...[-0.8, -0.4, 0, 0.4, 0.8].map((x) => cyl([x * w / 2.4, 0.2, 0.15], 0.17, 0.05, 'plasticBlack', 10))], c: [col([0, 0.7, 0], [w, 1.4, 0.5], 1.2, { cover: 'low' })] }; },
  treadmill() { return { v: [box([0, 0.2, 0], [0.9, 0.3, 1.8], 'plasticBlack'), box([0, 0.23, 0], [0.7, 0.32, 1.6], 'rubber'), box([0, 1.1, 0.75], [0.8, 0.3, 0.1], 'metalDark'), box([-0.4, 0.8, 0.75], [0.05, 1.0, 0.05], 'metalDark'), box([0.4, 0.8, 0.75], [0.05, 1.0, 0.05], 'metalDark')], c: [col([0, 0.5, 0], [0.9, 1.0, 1.8], 1, { cover: 'low' })] }; },
  mat() { return { v: [box([0, 0.03, 0], [2.0, 0.06, 1.0], 'matBlue')], c: [] }; },
  copier() { return { v: [box([0, 0.55, 0], [0.9, 1.1, 0.8], 'copierBody'), box([0, 1.12, 0], [0.9, 0.06, 0.8], 'plasticBlack'), box([0, 1.0, 0.41], [0.5, 0.1, 0.02], 'screenOn')], c: [col([0, 0.58, 0], [0.9, 1.15, 0.8], 1.5)] }; },
  car({ color }) {
    const m = colorKey(color, '#8e1d1d');
    return { v: [box([0, 0.55, 0], [1.85, 0.6, 4.3], m + '|car'), box([0, 1.1, -0.15], [1.6, 0.55, 2.2], m + '|car'), box([0, 1.13, -0.15], [1.62, 0.4, 2.0], 'carGlass'),
      ...[[-0.92, 1.3], [0.92, 1.3], [-0.92, -1.3], [0.92, -1.3]].map(([x, z]) => cyl([x, 0.33, z], 0.33, 0.24, 'rubber', 14)), box([0, 0.6, 2.16], [1.5, 0.15, 0.04], 'chrome'), box([-0.6, 0.7, 2.17], [0.3, 0.14, 0.03], 'lightLamp'), box([0.6, 0.7, 2.17], [0.3, 0.14, 0.03], 'lightLamp')],
      c: [col([0, 0.62, 0], [1.85, 1.24, 4.3], 2.5, { }), col([0, 1.3, -0.15], [1.6, 0.6, 2.2], 1.2)], rotWrap: true };
  },
  container({ color }) {
    const m = colorKey(color, '#3b6a8a');
    const v = [box([0, 1.3, 0], [2.44, 2.6, 6.0], m + '|metal')];
    for (let i = -2; i <= 2; i++) v.push(box([1.23, 1.3, i * 1.1], [0.02, 2.5, 0.12], 'metalDark'), box([-1.23, 1.3, i * 1.1], [0.02, 2.5, 0.12], 'metalDark'));
    return { v, c: [col([0, 1.3, 0], [2.44, 2.6, 6.0], 4)] };
  },
  barrier({ w = 3 }) { return { v: [box([0, 0.4, 0], [w, 0.8, 0.5], 'concreteProp'), box([0, 0.05, 0], [w, 0.1, 0.8], 'concreteProp')], c: [col([0, 0.4, 0], [w, 0.8, 0.8], 5, { cover: 'low' })] }; },
  dumpster() { return { v: [box([0, 0.75, 0], [1.8, 1.3, 1.0], 'dumpGreen'), box([0, 1.43, 0], [1.9, 0.08, 1.1], 'dumpLid')], c: [col([0, 0.75, 0], [1.8, 1.5, 1.0], 2)] }; },
  shack() { return { v: [box([0, 1.2, 0], [3, 2.4, 2.6], 'shackWall'), box([0, 2.5, 0], [3.4, 0.14, 3.0], 'shackRoof'), box([0, 1.2, 1.31], [1.0, 1.6, 0.05], 'door'), box([-0.9, 1.5, 1.32], [0.8, 0.6, 0.03], 'carGlass')], c: [col([0, 1.3, 0], [3, 2.6, 2.6], 3)] }; },
  pole() { return { v: [cyl([0, 2.5, 0], 0.08, 5, 'metalDark', 8), box([0.3, 5.05, 0], [0.8, 0.12, 0.3], 'metalDark'), box([0.55, 4.97, 0], [0.4, 0.05, 0.22], 'lightLamp')], c: [col([0, 2.5, 0], [0.2, 5, 0.2], 3)], light: [0.5, 4.9, 0] }; },
  tree() { return { v: [cyl([0, 1.4, 0], 0.22, 2.8, 'bark', 8), sph([0, 3.3, 0], 1.7, 'leaf'), sph([0.9, 2.7, 0.5], 1.1, 'leaf'), sph([-0.8, 2.9, -0.5], 1.2, 'leaf')], c: [col([0, 1.4, 0], [0.45, 2.8, 0.45], 3)] }; },
};

// How much punishment a piece of furniture takes before it breaks, and what it is made of (the material
// picks the debris, the sound and the sparks). Kinds that are not listed (containers, barriers, tyres, trees,
// poles, the shack) are part of the scenery and cannot be destroyed.
export const DURABILITY = {
  crate: { hp: 170, mat: 'wood' }, barrel: { hp: 140, mat: 'metal' }, pallet: { hp: 110, mat: 'wood' }, toolbox: { hp: 240, mat: 'metal' },
  bench: { hp: 260, mat: 'wood' }, desk: { hp: 210, mat: 'wood' }, table: { hp: 160, mat: 'wood' }, counter: { hp: 420, mat: 'wood' }, bar: { hp: 420, mat: 'wood' },
  couch: { hp: 380, mat: 'cloth' }, shelf: { hp: 220, mat: 'metal' }, archive: { hp: 330, mat: 'metal' }, lockers: { hp: 360, mat: 'metal' }, stalls: { hp: 130, mat: 'plastic' },
  vending: { hp: 470, mat: 'glass' }, fridge: { hp: 480, mat: 'metal' }, server: { hp: 320, mat: 'electronic' }, plant: { hp: 45, mat: 'plant' },
  pooltable: { hp: 420, mat: 'wood' }, rack: { hp: 160, mat: 'metal' }, treadmill: { hp: 320, mat: 'electronic' }, copier: { hp: 260, mat: 'electronic' },
  car: { hp: 950, mat: 'metal' }, dumpster: { hp: 650, mat: 'metal' },
};

// rotate a local point by a heading (0/90/180/270 degrees, 0 = front faces +z)
export function rotXZ(x, z, deg) {
  const r = ((deg % 360) + 360) % 360;
  if (r === 90) return [z, -x]; if (r === 180) return [-x, -z]; if (r === 270) return [-z, x];
  return [x, z];
}

// expand a prop definition into world-space visuals and colliders
export function placeProp(kind, wx, wy, wz, deg, opts = {}) {
  const b = BUILDERS[kind];
  if (!b) throw new Error('unknown prop ' + kind);
  const built = b(opts), r = ((deg % 360) + 360) % 360, swap = r === 90 || r === 270;
  const outV = [], outC = [];
  for (const v of built.v) {
    const [x, z] = rotXZ(v.c[0], v.c[2], r);
    const o = { ...v, c: [wx + x, wy + v.c[1], wz + z] };
    if (v.t === 'box' && swap) o.s = [v.s[2], v.s[1], v.s[0]];
    o.deg = r;
    outV.push(o);
  }
  for (const c of built.c) {
    const [x, z] = rotXZ(c.c[0], c.c[2], r), s = swap ? [c.s[2], c.s[1], c.s[0]] : c.s;
    const cx = wx + x, cy = wy + c.c[1], cz = wz + z;
    const dur = DURABILITY[kind], stacked = kind === 'crate' ? (opts.stack || 1) : 1;
    outC.push({ min: [cx - s[0] / 2, cy - s[1] / 2, cz - s[2] / 2], max: [cx + s[0] / 2, cy + s[1] / 2, cz + s[2] / 2], absorb: c.absorb, cover: c.cover || (s[1] > 1.4 ? 'high' : 'low'), noStand: !!c.noStand, kind, ...(dur ? { hp: dur.hp * stacked, hpMax: dur.hp * stacked, mat: dur.mat } : {}) });
  }
  let light = null;
  if (built.light) { const [x, z] = rotXZ(built.light[0], built.light[2], r); light = [wx + x, wy + built.light[1], wz + z]; }
  return { visuals: outV, colliders: outC, light, kind };
}

// material definitions by key; 'c:#rrggbb' and 'c:#rrggbb|variant' are generated on demand
export const PROP_MATS = {
  crate: { color: '#b08a58', pattern: 'planks', patternScale: 7, patternColor: '#4b3418', roughness: 0.85 }, crateTrim: { color: '#6b4a28', roughness: 0.8 },
  barrel: { color: '#2d5a8e', metallic: 0.5, roughness: 0.45 }, barrelBand: { color: '#1b3a5e', metallic: 0.6, roughness: 0.4 },
  rubber: { color: '#1a1a1a', roughness: 0.9 }, palletWood: { color: '#a07c4c', pattern: 'planks', patternScale: 8, patternColor: '#3c2814', roughness: 0.9 },
  toolRed: { color: '#a82a22', metallic: 0.3, roughness: 0.5 }, chrome: { color: '#c8ccd0', metallic: 0.95, roughness: 0.2 },
  benchTop: { color: '#8d6a40', pattern: 'wood', patternScale: 5, patternColor: '#3c2a14', roughness: 0.75 }, metalDark: { color: '#2e3236', metallic: 0.6, roughness: 0.5 },
  pegboard: { color: '#c7b79a', pattern: 'fabric', patternScale: 40, patternStrength: 0.3, roughness: 0.9 }, deskTop: { color: '#cdb78f', pattern: 'wood', patternScale: 4, patternColor: '#7b6240', roughness: 0.6 },
  deskLeg: { color: '#7c7a74', metallic: 0.3, roughness: 0.6 }, screen: { color: '#0c0f12', roughness: 0.2, emissive: '#6fa0c8', emissiveStrength: 0.5 }, plasticBlack: { color: '#16181a', roughness: 0.5 },
  tableTop: { color: '#b89a6a', pattern: 'wood', patternScale: 4, patternColor: '#60482a', roughness: 0.6 }, counterBody: { color: '#4a5a6a', roughness: 0.6 }, counterTop: { color: '#d8d4cc', roughness: 0.35 },
  barBody: { color: '#3a2a20', pattern: 'walnut', patternScale: 4, patternColor: '#1a0f08', roughness: 0.5 }, mirror: { color: '#aab6bc', metallic: 0.9, roughness: 0.08 },
  metalShelf: { color: '#8a9096', metallic: 0.7, roughness: 0.45 }, cardboard: { color: '#a8864f', pattern: 'fabric', patternScale: 40, patternStrength: 0.3, roughness: 0.95 }, blueBin: { color: '#2a56a0', roughness: 0.6 },
  gunCase: { color: '#15181a', roughness: 0.4 }, ammoBox: { color: '#4a5230', roughness: 0.6 }, metalGrey: { color: '#7d868f', metallic: 0.6, roughness: 0.5 },
  lockerA: { color: '#5b7a96', metallic: 0.5, roughness: 0.45 }, lockerB: { color: '#4d6c88', metallic: 0.5, roughness: 0.45 }, vent: { color: '#2a3844', roughness: 0.6 },
  stallPanel: { color: '#bcc7cc', roughness: 0.5 }, vendRed: { color: '#a82020', roughness: 0.4 }, vendGlass: { color: '#8fbfd6', roughness: 0.05, emissive: '#bfe6ff', emissiveStrength: 0.35 },
  rack: { color: '#1d2024', metallic: 0.5, roughness: 0.5 }, ledGreen: { color: '#0a2a10', emissive: '#3dff6a', emissiveStrength: 1.2 }, pot: { color: '#8a5a3a', roughness: 0.8 },
  barkDark: { color: '#3a2a18', roughness: 0.9 }, leaf: { color: '#3d7a3a', roughness: 0.8, pattern: 'fabric', patternScale: 30, patternStrength: 0.4 }, screenOn: { color: '#101820', emissive: '#7fb6ff', emissiveStrength: 0.9, roughness: 0.2 },
  felt: { color: '#1f5a3a', pattern: 'fabric', patternScale: 80, roughness: 0.95 }, feltTop: { color: '#25704a', pattern: 'fabric', patternScale: 80, roughness: 0.95 }, tableWood: { color: '#4a2c1a', pattern: 'walnut', patternScale: 4, patternColor: '#1b0e06', roughness: 0.5 },
  matBlue: { color: '#2a4f9a', roughness: 0.9 }, copierBody: { color: '#c8c8c8', roughness: 0.5 }, carGlass: { color: '#10181f', metallic: 0.5, roughness: 0.05 }, lightLamp: { color: '#fff3c8', emissive: '#fff0b0', emissiveStrength: 1.4 },
  concreteProp: { color: '#9a978f', pattern: 'stucco', patternScale: 3, patternColor: '#6f6c66', roughness: 0.95 }, dumpGreen: { color: '#2f5a3a', metallic: 0.3, roughness: 0.6 }, dumpLid: { color: '#1c1e20', roughness: 0.6 },
  shackWall: { color: '#c9c2b0', pattern: 'stucco', patternScale: 2, roughness: 0.9 }, shackRoof: { color: '#4a4f55', metallic: 0.5, roughness: 0.6 }, door: { color: '#5c3b24', pattern: 'planks', patternScale: 9, patternColor: '#2a190c', roughness: 0.7 },
  bark: { color: '#4a3a28', pattern: 'wood', patternScale: 6, patternColor: '#1f160c', roughness: 0.95 },
};
