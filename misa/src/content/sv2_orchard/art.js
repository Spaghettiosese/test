// Orchard, cellar and water art: fruit trees (young and full, seasonal), saplings, stumps, ripe fruit, tappers, mushroom logs,
// crab pots, fish ponds, kegs, cellar casks, the hatch and cellar props. All hd sprites; the engine adds the outline margin.
import { spr } from '../town/lib.js';
import { FRUIT, WILD } from './data.js';

const TR = ['#4e3524', '#6b4a34', '#8a6446', '#a67c58']; // trunk ramp dark..light
const LEAF = {
  spring: ['#a9dc82', '#7bbf5c', '#58a046'], summer: ['#76bd5e', '#52a049', '#3a7d3c'], autumn: ['#e8b050', '#d27d2e', '#a65426'],
};
const KIND_COL = {
  cherry: { spring: ['#ffdbe6', '#f7a9c4', '#e583a8'], autumn: ['#e89a5a', '#cc6a3a', '#a04a2c'] },
  plum: { spring: ['#f8eaf6', '#e5bde2', '#c98fc6'], autumn: ['#d8a050', '#b8742e', '#8c5226'] },
  peach: { spring: ['#ffd2c4', '#f7a79a', '#e07c7c'], autumn: ['#e6b85a', '#cc8a34', '#a06226'] },
  apple: { autumn: ['#b6c860', '#92aa44', '#6e8a34'] },
  persimmon: { autumn: ['#f0a848', '#d98128', '#b25a1e'], summer: ['#84c264', '#5aa84e', '#3e8440'] },
  orange: { spring: ['#5fa85c', '#418a46', '#2e6c3a'], summer: ['#5fa85c', '#418a46', '#2e6c3a'], autumn: ['#5fa85c', '#418a46', '#2e6c3a'], winter: ['#4e9654', '#37783f', '#285e34'] },
  oak: { autumn: ['#d8a048', '#b8782a', '#8c5424'] },
  maple: { spring: ['#c8603a', '#a8402c', '#84301f'], summer: ['#b04a3a', '#8e3328', '#6e2420'], autumn: ['#f06a3a', '#d04a2a', '#a22f20'] },
  pine: { spring: ['#4a9a5c', '#347c48', '#245e38'], summer: ['#4a9a5c', '#347c48', '#245e38'], autumn: ['#468c54', '#31703f', '#225434'], winter: ['#3e8450', '#2c6a40', '#1f5232'] },
};
const cols = (kind, season) => (KIND_COL[kind] && KIND_COL[kind][season]) || LEAF[season] || null; // null = bare

function blob(R, cx, cy, rx, ry, c) {
  R.e(cx, cy, rx, ry, c[2]);
  R.e(cx - 1, cy - 1, Math.max(1, rx - 2), Math.max(1, ry - 2), c[1]);
  R.e(cx - 2, cy - 3, Math.max(1, Math.round(rx * 0.55)), Math.max(1, Math.round(ry * 0.45)), c[0]);
}
function bare(R, W, H, tx, base, trunkH, spread) {
  R(tx - 2, H - trunkH, 5, trunkH, TR[1]); R(tx - 2, H - trunkH, 2, trunkH, TR[2]); R(tx + 1, H - trunkH, 2, trunkH, TR[0]);
  const top = H - trunkH;
  for (let i = 0; i < 6; i++) {
    const dir = i % 2 ? 1 : -1, len = spread - i * 2, y0 = top + 4 + i * 3;
    for (let s = 0; s < len; s++) R(tx + dir * (2 + s), y0 - Math.floor(s * 0.7), 2, 2, i % 3 ? TR[1] : TR[2]);
  }
  R(tx - 1, top - 8, 2, 10, TR[1]); R(tx - 4, top - 3, 2, 2, TR[1]); R(tx + 3, top - 5, 2, 2, TR[1]);
  void base;
}
function treeFull(R, kind, season, W, H, canopy) {
  const c = cols(kind, season), tx = Math.floor(W / 2);
  if (!c) { bare(R, W, H, tx, H, Math.round(H * 0.62), Math.round(W * 0.3)); if (season === 'winter') { R(tx - 14, H - 40, 5, 1, '#fff'); R(tx + 8, H - 44, 5, 1, '#fff'); } return; }
  R(tx - 3, canopy.ty, 6, H - canopy.ty, TR[1]); R(tx - 3, canopy.ty, 2, H - canopy.ty, TR[2]); R(tx + 1, canopy.ty, 2, H - canopy.ty, TR[0]);
  R(tx - 5, H - 3, 10, 3, TR[1]); R(tx - 5, H - 3, 3, 3, TR[2]);
  for (const [dx, dy, rx, ry] of canopy.blobs) blob(R, tx + dx, dy, rx, ry, c);
}
const FULL = { w: 50, h: 64, ty: 30, blobs: [[0, 22, 20, 16], [-12, 30, 11, 10], [12, 30, 11, 10], [0, 12, 12, 9]] };
const YOUNG = { w: 30, h: 40, ty: 20, blobs: [[0, 14, 12, 10], [-6, 20, 7, 6], [6, 20, 7, 6]] };

for (const k of Object.keys(FRUIT)) {
  spr(`sv2_t_full_${k}`, FULL.w, FULL.h, (R, M, season) => treeFull(R, k, season, FULL.w, FULL.h, FULL), { seasonal: true });
  spr(`sv2_t_young_${k}`, YOUNG.w, YOUNG.h, (R, M, season) => treeFull(R, k, season, YOUNG.w, YOUNG.h, YOUNG), { seasonal: true });
  spr(`sv2_fr_${k}`, 5, 5, (R) => { const c = FRUIT[k].c; R.e(2, 2, 2, 2, c); R(1, 1, 1, 1, '#ffffffaa'.slice(0, 7)); R(3, 0, 1, 1, '#3a7d3c'); });
}
for (const k of Object.keys(WILD)) spr(`sv2_t_young_${k}`, YOUNG.w, YOUNG.h, (R, M, season) => treeFull(R, k, season === 'spring' && k === 'oak' ? 'summer' : season, YOUNG.w, YOUNG.h, YOUNG), { seasonal: true });
spr('sv2_t_sapling', 18, 28, (R, M, season) => {
  R(8, 12, 2, 16, TR[1]); R(8, 12, 1, 16, TR[2]);
  const c = LEAF[season] || ['#d8e4ee', '#bcd0e0', '#9ab4cc'];
  if (season === 'winter') { R(5, 14, 3, 1, TR[1]); R(10, 10, 3, 1, TR[1]); R(6, 8, 1, 4, TR[1]); return; }
  blob(R, 9, 9, 6, 6, c); blob(R, 5, 14, 3, 3, c); blob(R, 13, 13, 3, 3, c);
}, { seasonal: true });
spr('sv2_t_sprout', 14, 16, (R) => { R(6, 6, 2, 10, '#5aa048'); R.e(3, 6, 3, 2, '#7bbf5c'); R.e(10, 4, 3, 2, '#8fd06c'); R(6, 14, 4, 2, '#7a5a40'); });
spr('sv2_stump', 26, 18, (R) => {
  R(3, 6, 20, 12, TR[1]); R(3, 6, 6, 12, TR[2]); R(18, 6, 5, 12, TR[0]); R.e(13, 6, 10, 4, TR[3]); R.e(13, 6, 7, 3, '#c8a070'); R.e(13, 6, 4, 2, '#a67c58'); R.e(13, 6, 1, 1, '#8a6446');
  R(2, 15, 4, 3, TR[1]); R(20, 15, 4, 3, TR[0]);
});
spr('sv2_tap_0', 12, 16, (R) => { R(0, 3, 4, 2, '#8c8f98'); R(3, 5, 8, 10, '#a8acb6'); R(3, 5, 8, 2, '#d8dce6'); R(4, 7, 6, 8, '#6a6e7a'); R(5, 8, 3, 1, '#2a2e3a'); });
spr('sv2_tap_1', 12, 16, (R) => { R(0, 3, 4, 2, '#8c8f98'); R(3, 5, 8, 10, '#a8acb6'); R(3, 5, 8, 2, '#d8dce6'); R(4, 7, 6, 8, '#e0a040'); R(5, 8, 2, 4, '#f6d070'); R(4, 7, 6, 1, '#f6d070'); });

// ------------------------------------------------------------------ mushroom log, crab pot, pond
const logBody = (R) => { R(1, 8, 28, 12, TR[1]); R(1, 8, 28, 3, TR[2]); R(1, 17, 28, 3, TR[0]); R.e(3, 14, 3, 6, TR[3]); R.e(3, 14, 2, 4, '#c8a070'); R.e(3, 14, 1, 2, '#a67c58'); for (let x = 8; x < 26; x += 5) R(x, 10, 1, 8, TR[0]); };
spr('sv2_log_0', 32, 22, (R) => logBody(R));
spr('sv2_log_1', 32, 22, (R) => { logBody(R); for (const [x, y, w] of [[10, 4, 6], [19, 5, 5], [15, 2, 5]]) { R.e(x + 2, y + 2, w / 2 + 1, 2, '#8a5a38'); R(x + 1, y + 3, 2, 5, '#e8dcc8'); R.e(x + 2, y + 1, 2, 1, '#b07e50'); } });
const cage = (R, dy) => {
  R(2, 8 + dy, 18, 12, '#5a4636'); R(3, 9 + dy, 16, 10, '#2e5a7a'); R.e(11, 9 + dy, 9, 4, '#7a6048'); R.e(11, 9 + dy, 7, 3, '#3a6a8a');
  for (let x = 4; x < 19; x += 3) R(x, 9 + dy, 1, 10, '#a68a64'); for (let y = 11; y < 19; y += 3) R(3, y + dy, 16, 1, '#a68a64');
  R(10, 1 + dy, 2, 8, '#c8c8d0'); R.e(11, 2 + dy, 3, 3, '#e8483c'); R(8, 2 + dy, 6, 1, '#fff6e6');
};
spr('sv2_pot_0', 24, 24, (R) => cage(R, 0)); spr('sv2_pot_1', 24, 24, (R) => cage(R, 1));
spr('sv2_pot_ready', 24, 24, (R) => { cage(R, 0); R(6, 14, 3, 2, '#ff8a60'); R(13, 15, 3, 2, '#f0a070'); });
for (let f = 0; f < 3; f++) {
  spr(`sv2_pond_${f}`, 66, 54, (R) => {
    R.e(33, 30, 32, 22, '#7c8088'); R.e(33, 29, 31, 21, '#a2a6b0'); R.e(33, 31, 28, 19, '#5c606a');
    R.e(33, 30, 27, 18, '#2f7fb0'); R.e(33, 29, 25, 16, '#4aa0d4'); R.e(33, 28, 20, 12, '#6cbce8');
    for (let i = 0; i < 6; i++) R(14 + i * 7 + ((f * 3 + i * 2) % 5), 18 + ((i * 5 + f * 4) % 20), 5, 1, '#c8ecfb');
    R.e(50 - f, 40, 4, 2, '#4f9c48'); R.e(49 - f, 39, 2, 1, '#ffd0e0');
    for (let x = 4; x < 62; x += 8) R(x, 46 + (x % 3), 5, 4, '#8c909a');
  });
  spr(`sv2_pfish_${f}`, 10, 6, (R) => { R.e(4, 3, 3, 2, '#f09a3a'); R(7 + (f % 2), 2, 2, 3, '#e07828'); R(2, 2, 1, 1, '#2a1a22'); });
}

// ------------------------------------------------------------------ keg (a regular sv_farm machine: sv_m_keg_<state>)
const keg = (R, tap, dr) => {
  R.e(12, 8, 10, 4, '#a67c58'); R(2, 8, 20, 18, '#8a6446'); R(2, 8, 5, 18, '#a67c58'); R(18, 8, 4, 18, '#6b4a34'); R.e(12, 26, 10, 3, '#6b4a34');
  R(2, 12, 20, 2, '#5a5e6a'); R(2, 21, 20, 2, '#5a5e6a'); R(5, 8, 1, 18, '#6b4a34'); R(11, 8, 1, 18, '#6b4a34'); R(16, 8, 1, 18, '#6b4a34');
  R(10, 15, 5, 4, '#c8a040'); R(11, 19, 3, 2, tap); if (dr) R(12, 22 + dr, 1, 2, '#c03a58');
  R.e(12, 8, 6, 2, '#c8a070');
};
spr('sv_m_keg_idle', 26, 32, (R) => keg(R, '#8c8f98', 0));
spr('sv_m_keg_work0', 26, 32, (R) => keg(R, '#d8dce6', 1));
spr('sv_m_keg_work1', 26, 32, (R) => keg(R, '#d8dce6', 3));
spr('sv_m_keg_ready', 26, 32, (R) => { keg(R, '#f6d070', 0); R(1, 27, 3, 2, '#fff6a0'); R(22, 5, 2, 2, '#fff6a0'); });

// ------------------------------------------------------------------ cellar
const HOOP = { e: '#5a5e6a', 0: '#5a5e6a', 1: '#d0d6e2', 2: '#f0c840', 3: '#c284f6' };
function cask(R, key, filled) {
  R(1, 24, 30, 6, '#5a4636'); R(1, 24, 30, 2, '#7a6048'); R(3, 28, 4, 4, '#4e3524'); R(25, 28, 4, 4, '#4e3524');
  R.e(16, 15, 15, 10, '#6b4a34'); R.e(16, 14, 14, 9, '#8a6446'); R.e(15, 12, 11, 5, '#a67c58');
  for (const x of [6, 13, 20, 27]) R(x, 8, 2, 14, HOOP[key]); R(11, 18, 8, 3, '#3a2a1c');
  R.e(2, 15, 2, 7, '#c8a070'); R.e(2, 15, 1, 5, '#a67c58');
  R(15, 15, 5, 4, '#c8a040'); R(16, 19, 3, 3, '#8c8f98');
  if (filled) { R(8, 10, 6, 6, '#fff6e6'); R(9, 12, 4, 1, '#8a5a38'); R(9, 14, 3, 1, '#8a5a38'); }
}
spr('sv2_cask_e', 34, 32, (R) => cask(R, 'e', false));
for (let q = 0; q < 4; q++) spr(`sv2_cask_${q}`, 34, 32, (R) => cask(R, q, true));
spr('sv2_hatch', 30, 26, (R) => {
  R(1, 3, 28, 22, '#5a4030'); R(2, 4, 26, 20, '#8a6446'); R(2, 4, 26, 2, '#a67c58');
  for (let x = 7; x < 27; x += 6) R(x, 5, 1, 19, '#6b4a34'); R(4, 10, 22, 1, '#4e3524'); R(4, 18, 22, 1, '#4e3524');
  R.e(15, 14, 4, 3, '#c8a040'); R.e(15, 14, 2, 1, '#6b4a34');
});
spr('sv2_ledger', 62, 44, (R) => {
  R(2, 4, 58, 36, '#5a4030'); R(4, 6, 54, 32, '#3e4a40'); R(4, 6, 54, 2, '#58685c');
  R(8, 12, 22, 1, '#e8e4d8'); R(8, 17, 30, 1, '#e8e4d8'); R(8, 22, 18, 1, '#e8e4d8'); R(8, 27, 26, 1, '#e8e4d8');
  R.e(46, 24, 6, 6, '#d8d0c0'); R.e(46, 24, 3, 3, '#a8a090'); R(10, 40, 3, 4, '#4e3524'); R(49, 40, 3, 4, '#4e3524');
});
spr('sv2_shelf', 62, 48, (R) => {
  R(1, 2, 60, 46, '#5a4030'); R(3, 4, 56, 42, '#2e2420');
  for (const y of [18, 32, 46]) R(3, y - 2, 56, 3, '#8a6446');
  for (let i = 0; i < 7; i++) { const x = 6 + i * 8; R(x, 8, 5, 10, ['#c42a48', '#8a4a9c', '#f4a424', '#d8383a', '#e0c070', '#5aa84e', '#c284f6'][i]); R(x + 1, 6, 3, 2, '#d8d0c0'); }
  for (let i = 0; i < 6; i++) { const x = 8 + i * 9; R.e(x + 2, 26, 3, 5, i % 2 ? '#c8c8d0' : '#8a6446'); R(x, 34, 7, 8, ['#e8dcc8', '#e0c070', '#d8a050'][i % 3]); }
});
spr('sv2_crate', 32, 30, (R) => { R(1, 6, 30, 24, '#8a6446'); R(1, 6, 30, 4, '#a67c58'); R(1, 6, 3, 24, '#6b4a34'); R(28, 6, 3, 24, '#6b4a34'); R(4, 14, 24, 2, '#6b4a34'); R(4, 22, 24, 2, '#6b4a34'); R.e(10, 6, 4, 2, '#d27d2e'); R.e(20, 6, 4, 2, '#d8383a'); });
