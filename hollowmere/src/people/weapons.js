// Hand-held props, built from shapes. Every prop's origin is the grip and its long axis is +Y
// (blade or handle up), edge toward +Z: the same convention the engine's tools use, so one
// hand socket (HAND_SOCKET) holds them all.
import * as E from '../../../engine/index.js';

export const HAND_SOCKET = { position: [0.013, -0.058, 0.004], rotation: [90, 0, 0] };
const M = (name, o) => new E.Material({ name, ...o });
const mats = () => ({
  steel: M('Steel', { color: '#9aa3ad', metallic: 1, roughness: 0.22, pattern: 'metal', patternScale: 5, patternColor: '#4a5058', patternStrength: 0.6 }),
  dark: M('Blackened', { color: '#2a2a32', metallic: 1, roughness: 0.3, pattern: 'metal', patternScale: 4, patternColor: '#0c0c10' }),
  rune: M('Rune', { color: '#6a3fb0', emissive: '#9a5cff', emissiveStrength: 2.2, roughness: 0.3 }),
  brass: M('Brass', { color: '#b8923e', metallic: 1, roughness: 0.3 }),
  leather: M('Grip leather', { color: '#3c2a1d', roughness: 0.7, pattern: 'leather', patternScale: 60, patternColor: '#1a0f08' }),
  wood: M('Wood', { color: '#6b4a2a', roughness: 0.7, pattern: 'wood', patternScale: 10, patternColor: '#2e1c0e' }),
  rope: M('Rope', { color: '#a58f60', roughness: 0.9, pattern: 'hair', patternScale: 6 }),
  cloth: M('Rag', { color: '#2a211a', roughness: 0.95, pattern: 'fabric', patternScale: 60 }),
  flame: M('Flame', { color: '#ffcf7a', emissive: '#ff9a2a', emissiveStrength: 5 }),
  pewter: M('Pewter', { color: '#8d8a85', metallic: 0.9, roughness: 0.4 }),
});

// blade outline in (z, y): a tapered double edge
function bladeOutline(len, w) { return [[0, 0], [w, 0.01], [w * 0.95, len * 0.7], [w * 0.5, len * 0.94], [0, len], [-w * 0.5, len * 0.94], [-w * 0.95, len * 0.7], [-w, 0.01]]; }

export function makeSword(kind = 'arming') {
  const m = mats(), k = new E.Kit({});
  const cfg = { arming: { len: 0.78, w: 0.024, blade: m.steel, guard: 0.2, mat: m.brass }, dark: { len: 0.82, w: 0.022, blade: m.dark, guard: 0.22, mat: m.steel }, nightfang: { len: 0.86, w: 0.021, blade: m.steel, guard: 0.24, mat: m.steel, rune: true }, captain: { len: 0.9, w: 0.026, blade: m.steel, guard: 0.26, mat: m.brass }, dagger: { len: 0.24, w: 0.016, blade: m.steel, guard: 0.09, mat: m.brass } }[kind] || {};
  const { len, w, blade, guard, mat } = cfg;
  k.cyl(m.leather, [0, 0.055, 0], 0.014, 0.11, [0, 0, 0], 8);
  k.add(mat, E.sphere({ radius: 0.022, widthSegments: 8, heightSegments: 6 }), [0, -0.005, 0]);
  k.box(mat, [0, 0.118, 0], [0.028, 0.022, guard], [0, 0, 0], 0.004);
  const bl = E.extrude({ outline: bladeOutline(len, w), depth: 0.008, bevel: 0.002 });
  k.add(blade, bl, [0, 0.128, 0], [0, 90, 0]);
  if (cfg.rune) {
    k.box(m.rune, [0.0055, 0.128 + len * 0.45, 0], [0.002, len * 0.55, 0.008]);
    k.box(m.rune, [-0.0055, 0.128 + len * 0.45, 0], [0.002, len * 0.55, 0.008]);
  }
  const n = k.toNode('Sword'); n.userData.length = len + 0.128; n.userData.tip = [0, len + 0.128, 0]; return n;
}
export function makeSpear() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.wood, [0, 0.55, 0], 0.016, 1.9, [0, 0, 0], 8);
  k.add(m.steel, E.extrude({ outline: [[0, 0], [0.028, 0.02], [0.02, 0.12], [0, 0.22], [-0.02, 0.12], [-0.028, 0.02]], depth: 0.008, bevel: 0.002 }), [0, 1.5, 0], [0, 90, 0]);
  const n = k.toNode('Spear'); n.userData.length = 1.75; return n;
}
export function makeMace() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.wood, [0, 0.22, 0], 0.017, 0.5, [0, 0, 0], 8);
  k.add(m.dark, E.sphere({ radius: 0.055, widthSegments: 10, heightSegments: 8 }), [0, 0.52, 0]);
  for (let i = 0; i < 6; i++) k.cyl(m.dark, [Math.cos(i) * 0.06, 0.52 + Math.sin(i * 1.7) * 0.03, Math.sin(i) * 0.06], 0.008, 0.04, [90, i * 60, 0], 5);
  return k.toNode('Mace');
}
export function makeTorch() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.wood, [0, 0.2, 0], 0.018, 0.5, [0, 0, 0], 8);
  k.add(m.cloth, E.sphere({ radius: 0.038, widthSegments: 8, heightSegments: 6 }), [0, 0.47, 0], [0, 0, 0], [1, 1.5, 1]);
  const flame = new E.Mesh(E.cone({ radius: 0.035, height: 0.13, radialSegments: 6, heightSegments: 1 }), m.flame, 'Flame'); flame.position.set([0, 0.52, 0]); flame.castShadow = false;
  const n = k.toNode('Torch'); n.add(flame); n.userData.flame = flame; n.userData.tip = [0, 0.6, 0];
  const light = new E.Light('point', { color: '#ff9c4a', intensity: 9, range: 9, flicker: 0.6 }); light.position.set([0, 0.6, 0.05]); n.add(light); n.userData.light = light;
  return n;
}
export function makeMug() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.pewter, [0, 0.05, 0], 0.036, 0.1, [0, 0, 0], 10);
  k.add(m.pewter, E.torus({ radius: 0.03, tube: 0.007, radialSegments: 6, tubularSegments: 10 }), [0.04, 0.05, 0], [0, 90, 0]);
  return k.toNode('Mug');
}
export function makeBroom() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.wood, [0, 0.55, 0], 0.014, 1.3, [0, 0, 0], 6);
  k.add(m.rope, E.cone({ radius: 0.06, height: 0.3, radialSegments: 8, heightSegments: 1 }), [0, -0.05, 0], [180, 0, 0]);
  return k.toNode('Broom');
}
export function makeHammer() {
  const m = mats(), k = new E.Kit({});
  k.cyl(m.wood, [0, 0.22, 0], 0.017, 0.5, [0, 0, 0], 8);
  k.box(m.dark, [0, 0.47, 0.01], [0.06, 0.07, 0.13], [0, 0, 0], 0.006);
  return k.toNode('Smith hammer');
}
export function makeShield() {
  const m = mats(), k = new E.Kit({});
  k.add(m.wood, E.extrude({ outline: [[-0.16, 0.2], [0.16, 0.2], [0.17, -0.05], [0, -0.3], [-0.17, -0.05]], depth: 0.025, bevel: 0.006 }), [0, 0, 0]);
  return k.toNode('Shield');
}
