// Master palette (art direction spec): hue-shifted ramps, dark -> light. Index 2 is usually the base.
// Every tile, prop and character should take its colours from here so seasons and grades stay coherent.
export const RAMPS = {
  ink:        ['#1e1624','#2a1a22','#4a3348','#6b5068'],
  paper:      ['#8a7868','#c9b8a2','#f4e4c1','#fff1d6','#fffaf0'],
  skinLight:  ['#8f5552','#c4826f','#e3a98a','#f8d5b8','#fff0e2'],
  skinTan:    ['#7d4d45','#b07760','#d6a07c','#f2c9a4','#fde6cf'],
  skinDeep:   ['#4f2c30','#76403f','#9c5f4a','#c68a62','#e0b088'],
  hairBrown:  ['#3a2228','#5a3a2e','#8b5a44','#b98262','#e0b08a'],
  hairBlack:  ['#141220','#24203a','#38334f','#5a5478','#8a84aa'],
  hairBlonde: ['#7a4e2a','#c4943e','#e8c56a','#f8e7a0','#fffbe0'],
  hairPink:   ['#7a2650','#d6508c','#ff85b8','#ffc2dc','#fff0f6'],
  hairBlue:   ['#1e2f6a','#3a6fc4','#6fb3f2','#bfe3ff','#f0faff'],
  hairSilver: ['#4a4a66','#8f8fae','#c8c8dc','#f2f2fa','#ffffff'],
  hairRed:    ['#5c1a26','#8f1f2e','#d93b3b','#ff7a6b','#ffc0a8'],
  hairPurple: ['#2a1a5c','#5b3fa8','#9474e0','#c9b3ff','#f0e8ff'],
  hairGinger: ['#5a2a1a','#a24a2a','#d9763f','#f5a868','#ffd8b0'],
  hairGreen:  ['#1f3d34','#2f6b52','#4fa078','#8fd0a4','#d8f5e0'],
  navy:       ['#1f2840','#2c4270','#3d5a8c','#5f80b4','#8aa8d8'],
  coral:      ['#6a2a3a','#bd5460','#e0707a','#f29aa0','#ffd0cc'],
  mint:       ['#2d5a50','#5eaa92','#86cdb0','#b8e6d2','#e8fff4'],
  butter:     ['#8a5a1e','#e0a84a','#ffd76a','#ffeaa0','#fffbe0'],
  sky:        ['#2d4a7a','#5a8cc0','#7fb2e0','#bfe6f5','#effaff'],
  lilac:      ['#3d2a6a','#7a5cb0','#b89ae0','#ddd0f5','#f8f2ff'],
  charcoal:   ['#141220','#262436','#3a3850','#5a5874','#8a88a4'],
  denim:      ['#141a2c','#1f2840','#2a3552','#3f4c70','#6a7aa0'],
  forest:     ['#1f3d2e','#2f5f40','#4f8a58','#7fb87a','#c0e6a8'],
  ribbon:     ['#5c1220','#a22633','#e43b44','#ff7a80','#ffc4c4'],
  wood:       ['#4f3028','#7a4f3a','#a67548','#d3a574','#f0c890'],
  woodDark:   ['#2e1c1e','#4a2e2a','#6a4436','#8f6248','#b88a62'],
  plaster:    ['#8a6a6a','#c5a58e','#d9bfa8','#f0dcc8','#fff4e8'],
  stone:      ['#3a3448','#575064','#7d7480','#aaa3a0','#d4cfc8','#f2efe8'],
  brick:      ['#4a2430','#7a3a3e','#a8524a','#cc7660','#e8a088'],
  roofRed:    ['#5a2430','#8f3a3a','#c45a46','#e8866a','#f8b898'],
  roofSlate:  ['#262c48','#36406a','#4c5c8c','#6f84b0','#a0b4d8'],
  roofTeal:   ['#1a3a44','#2a5a62','#3f8080','#62a8a0','#a0d4c4'],
  metal:      ['#3a4250','#5a6678','#8a9aab','#b9c6d2','#e8f0f6'],
  vermilion:  ['#5a1a1e','#a02a28','#e0503a','#f4805a','#ffb090'],
  grass:      ['#2f4f44','#4a7650','#6a9c56','#94c06a','#c4dc84','#f0f4b8'],
  leaf:       ['#1f3a36','#2f5a44','#4a8050','#74a85a','#a8cc70'],
  grassSpring:['#2f5048','#4a7a58','#6aa45e','#9ccc74','#cce690','#f4f8c4'],
  grassAutumn:['#4a3a2e','#6e5a36','#988040','#c0a050','#e0c470','#f8e8a8'],
  grassWinter:['#4a5a6c','#6a8090','#90a8b0','#c0d4dc','#e8f0f6','#ffffff'],
  leafAutumn: ['#5a2420','#a8402a','#e07a34','#f4b048','#ffe08a'],
  sakura:     ['#a8406a','#e07a9a','#f4a8c0','#ffd0e0','#fff0f6'],
  water:      ['#1f3a66','#2d5f8f','#3f8fb8','#6cc4dc','#a8e4f0','#e8fbff'],
  sand:       ['#8a6a4a','#c4a070','#e0c48e','#f2dcaa','#fff2d0'],
  dirt:       ['#5a3a2e','#8a5e44','#b08560','#d0a87c','#e8cca0'],
  snow:       ['#5a6a8c','#8a9cc0','#c0d0e8','#e8f0fa','#ffffff'],
  chalkboard: ['#1e3430','#2a4a40','#3f6a5a','#5e8a76','#e8f0e0'],
};

export const EYES = {
  brown: ['#4a2414', '#7a4020', '#b0703c', '#e0a868'], blue: ['#0f2a66', '#1f5fbf', '#4aa8f0', '#9ed8ff'],
  green: ['#146b45', '#2fb36b', '#7ae8a8', '#d8ffe8'], violet: ['#2a0a5c', '#5a1fb3', '#a066ff', '#e6ccff'],
  amber: ['#8a4210', '#e08a1e', '#ffc94a', '#fff1b8'], grey: ['#2e2a3d', '#5a5478', '#8f8fae', '#d8d8e8'],
};
export const INK = '#2a1a22';
export const SHADOW = 'rgba(42,26,64,0.30)';

// Time-of-day multiply grade: [hour, colour]. White = unchanged.
export const DAY_GRADE = [
  [0, '#4e4c8a'], [4.5, '#4e4c8a'], [5.5, '#6a6aa8'], [6.3, '#e8b8c0'], [7.5, '#fff0e0'], [10, '#ffffff'],
  [16, '#ffffff'], [17.3, '#ffe2b8'], [18.5, '#e8a0a0'], [19.3, '#a090c8'], [20.5, '#5c5a9c'], [24, '#4e4c8a'],
];
export const SEASON_GRADE = { spring: '#fff6f8', summer: '#ffffff', autumn: '#fff0dc', winter: '#eef4ff' };
export const WEATHER_GRADE = { rain: '#b4c0d4', storm: '#8f9ab8', snow: '#e4ecfa', cloudy: '#d0d4dc', windy: '#f4f4f0' };

// Season-swapped materials: grass, leaf and flower colours change with the season.
export function materials(season) {
  const R = RAMPS;
  const grass = { spring: R.grassSpring, summer: R.grass, autumn: R.grassAutumn, winter: R.grassWinter }[season] || R.grass;
  const leaf = { spring: R.leaf, summer: R.leaf, autumn: R.leafAutumn, winter: R.leaf }[season] || R.leaf;
  const flower = { spring: [R.sakura[2], R.lilac[3], R.paper[4]], summer: [R.coral[2], R.butter[2], R.lilac[2]], autumn: [R.leafAutumn[2], R.butter[1], R.coral[1]], winter: [R.snow[4]] }[season];
  return { ...R, grass, leaf, flower, season };
}

const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export function lerpHex(a, b, t) { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
export function multiplyHex(a, b) { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => (v * B[i]) / 255)); }
export function gradeAt(hour) {
  const k = DAY_GRADE;
  for (let i = 0; i < k.length - 1; i++) if (hour >= k[i][0] && hour <= k[i + 1][0]) return lerpHex(k[i][1], k[i + 1][1], (hour - k[i][0]) / (k[i + 1][0] - k[i][0] || 1));
  return k[0][1];
}
