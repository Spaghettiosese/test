// One shared Material per look, created on demand by key. Keys:
//   wall:<mat>   structural wall material (plaster, brick, ...)       paint:<name>  interior paint
//   floor:<finish>  room floor finish                                   c:#hex[|variant]  coloured prop
//   plus every key of PROP_MATS and a few fixed ones (ceiling, glass, steel...)
import { Material } from '../../../engine/scene.js';
import { MATS } from './grid.js';
import { PROP_MATS } from './props.js';

const PAINT = {
  cream: { color: '#d8cfb8', pattern: 'stucco', patternScale: 1.2, patternColor: '#b3a98f', roughness: 0.95 },
  blue: { color: '#58789a', pattern: 'stucco', patternScale: 1.2, patternColor: '#3d566f', roughness: 0.9 },
  green: { color: '#6c8c68', pattern: 'stucco', patternScale: 1.2, patternColor: '#4b6648', roughness: 0.9 },
  grey: { color: '#9aa0a6', pattern: 'stucco', patternScale: 1.2, patternColor: '#737a80', roughness: 0.92 },
  tan: { color: '#bb9d74', pattern: 'planks', patternScale: 4, patternColor: '#7d6340', roughness: 0.85 },
  brick: { color: '#8c5a49', pattern: 'brick', patternScale: 9, patternColor: '#b4a98f', roughness: 0.88 },
  brickExt: { color: '#7d5242', pattern: 'brick', patternScale: 9, patternColor: '#a39b8a', roughness: 0.92 },
};
const FLOOR = {
  concrete: { color: '#77746f', pattern: 'stucco', patternScale: 2.2, patternColor: '#58554f', roughness: 0.9 },
  tile: { color: '#cbc8be', pattern: 'checker', patternScale: 1.6, patternColor: '#9e9b92', roughness: 0.35 },
  carpet: { color: '#4a5b70', pattern: 'fabric', patternScale: 60, patternStrength: 0.5, roughness: 0.98 },
  wood: { color: '#8f6c44', pattern: 'planks', patternScale: 4, patternColor: '#3b2916', roughness: 0.55 },
  rubber: { color: '#2d3034', pattern: 'dirt', patternScale: 4, patternColor: '#1a1c1e', roughness: 0.9 },
  metal: { color: '#40474f', pattern: 'metal', patternScale: 3, patternColor: '#20252a', metallic: 0.6, roughness: 0.45 },
  ground: { color: '#74746c', pattern: 'dirt', patternScale: 5, patternColor: '#64645c', patternStrength: 0.5, roughness: 0.97 },
};
const FIXED = {
  ceiling: { color: '#e4e0d6', roughness: 0.95 }, slabEdge: { color: '#8a877f', pattern: 'stucco', patternScale: 2, roughness: 0.95 },
  glass: { color: '#a7cde0', roughness: 0.04, metallic: 0.15, opacity: 0.28, doubleSided: true },
  steel: MATS.steel, roof: { color: '#5d6166', pattern: 'dirt', patternScale: 3, patternColor: '#44474b', roughness: 0.95 }, hatchwood: MATS.hatchwood, floor: MATS.floor,
  barricade: { color: '#8a6a40', pattern: 'planks', patternScale: 6, patternColor: '#31220f', roughness: 0.85 },
  stairs: { color: '#7d7a72', pattern: 'stucco', patternScale: 3, patternColor: '#55524c', roughness: 0.9 },
  rail: { color: '#d6b13c', metallic: 0.5, roughness: 0.5 },
  lamp: { color: '#fff6e0', emissive: '#fff1cc', emissiveStrength: 1.6, roughness: 0.5 },
  asphalt: { color: '#4a4b4d', pattern: 'dirt', patternScale: 1.2, patternColor: '#323335', roughness: 0.95 },
  perimeter: { color: '#9b978e', pattern: 'stucco', patternScale: 2, patternColor: '#6c685f', roughness: 0.95 },
  parapet: { color: '#8f8b83', pattern: 'stucco', patternScale: 2, patternColor: '#625e56', roughness: 0.95 },
  stripe: { color: '#d6b020', roughness: 0.6 },
  skylight: { color: '#6a8aa0', roughness: 0.08, metallic: 0.2 },
};

export class MaterialLib {
  constructor() { this.cache = new Map(); }
  get(key) {
    let m = this.cache.get(key);
    if (m) return m;
    m = new Material({ name: key, ...this.def(key) });
    this.cache.set(key, m);
    return m;
  }
  def(key) {
    if (key.startsWith('wall:')) { const w = MATS[key.slice(5)]; return { color: w.color, pattern: w.pattern, patternScale: w.patternScale, patternColor: w.patternColor, roughness: w.roughness ?? 0.9, metallic: w.metallic ?? 0 }; }
    if (key.startsWith('paint:')) return PAINT[key.slice(6)] || PAINT.cream;
    if (key.startsWith('floor:')) return FLOOR[key.slice(6)] || FLOOR.concrete;
    if (key.startsWith('c:')) {
      const [hex, variant] = key.slice(2).split('|');
      const base = { color: hex, roughness: 0.55 };
      if (variant === 'car') return { ...base, metallic: 0.65, roughness: 0.28 };
      if (variant === 'metal') return { ...base, metallic: 0.6, roughness: 0.5, pattern: 'corrugated', patternScale: 5, patternColor: '#202428' };
      if (variant === '2') return { ...base, roughness: 0.9, pattern: 'fabric', patternScale: 120, sheen: 0.5 };
      return { ...base, roughness: 0.9, pattern: 'fabric', patternScale: 120, sheen: 0.4 };
    }
    return PROP_MATS[key] || FIXED[key] || { color: '#ff00ff' };
  }
}
export const PAINTS = Object.keys(PAINT);
