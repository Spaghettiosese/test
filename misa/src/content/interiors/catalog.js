// Furniture catalogue: every piece is an item (cat 'decor', tag 'furniture') with an hd sprite, a footprint on the
// decorate grid and a comfort value. Shops (Kinoko Woodworks, owned by economy) can stock any `furn_*` id; prices are
// sell values, so the shop decides its markup.
//   CATALOG[id] = { name, theme, price, comfort, kind: 'floor'|'rug'|'wall', w, h, spr | vars: [spr...], act?, light?, plant?, season?, desc }
// Wallpapers (`furn_wp_*`) and floorings (`furn_fl_*`) unlock a style in the decorate menu when used.
import { registerMany } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { S, D, C, block, panelDoor, drawerStack, grain, leg, books, foliage, pot, cushion, glint, hash } from './kit.js';
import { PAPERS, FLOORS } from './rooms.js';

const W = C.wood, WD = C.woodDark, P = C.paper, M = C.metal;
const r5 = (r) => [r[0], r[1], r[2], r[3], r[4] || r[3]];
export const THEMES = { wood: 'Cozy wood', ocean: 'Ocean', retro: 'Retro', starry: 'Starry', forest: 'Forest', cafe: 'Cafe', season: 'Seasonal' };

// ---------- parametric drawers ----------
const chairFront = (R, fr, seat) => { R(2, 0, 16, 14, fr[2]); R(2, 0, 16, 2, fr[3]); R(4, 3, 12, 9, fr[1]); R(5, 4, 10, 7, seat[3]); R(5, 4, 10, 1, seat[4] || seat[3]); leg(R, 2, 18, 3, 10, fr); leg(R, 15, 18, 3, 10, fr); block(R, 0, 13, 20, 7, 4, r5([fr[0], fr[1], fr[2], fr[3], fr[4]])); R(2, 13, 16, 3, seat[2]); R(2, 13, 16, 1, seat[3]); };
const chairBack = (R, fr, seat) => { leg(R, 2, 18, 3, 10, fr); leg(R, 15, 18, 3, 10, fr); block(R, 0, 13, 20, 6, 3, r5(fr)); R(2, 0, 16, 18, fr[2]); R(2, 0, 16, 2, fr[3]); R(4, 4, 12, 2, seat[2]); R(4, 9, 12, 2, fr[1]); R(17, 2, 1, 16, fr[1]); };
const sofaFront = (R, c, legs = WD) => { R(4, 0, 64, 20, c[2]); R(4, 0, 64, 3, c[3]); R(5, 1, 30, 1, c[4]); cushion(R, 8, 4, 28, 16, c); cushion(R, 36, 4, 28, 16, c); R(0, 12, 10, 28, c[2]); R(0, 12, 10, 3, c[3]); R(62, 12, 10, 28, c[1]); R(62, 12, 10, 3, c[2]); block(R, 8, 20, 56, 20, 7, c); R(8, 27, 56, 1, c[1]); R(36, 21, 1, 6, c[1]); leg(R, 4, 40, 4, 4, legs); leg(R, 64, 40, 4, 4, legs); R(12, 6, 8, 7, C.butter[3]); R(12, 6, 8, 1, C.butter[4]); };
const lampGlow = (R, x, y, w, h, c) => { R(x, y, w, h, c[3]); R(x + 1, y + 1, w - 2, Math.max(1, h - 3), c[4]); };
const rugRect = (R, w, h, a, b, edge, pat) => { R(0, 1, w, h - 2, edge); R(1, 0, w - 2, h, edge); R(2, 2, w - 4, h - 4, a); if (pat) pat(R, w, h, a, b); for (let x = 2; x < w - 2; x += 3) { R(x, 0, 1, 1, P[3]); R(x, h - 1, 1, 1, P[3]); } };

// ---------- catalogue ----------
// shape: icon shape; c: icon colour
const F = {};
const add = (id, def, draw) => {
  F[id] = { w: 1, h: 1, kind: 'floor', comfort: 2, act: null, ...def };
  if (draw) { const [sw, sh, fn, opts] = draw; F[id].spr = (def.kind === 'rug' ? D : S)(id, sw, sh, fn, opts || {}); }
};
// seating
const chair = (id, name, theme, fr, seat, price) => { S(id, 20, 28, (R) => chairFront(R, fr, seat)); S(id + '_b', 20, 28, (R) => chairBack(R, fr, seat)); add(id, { name, theme, price, comfort: 2, vars: [id, id + '_b'], act: 'sit', desc: 'A chair to sit on. Rotate it to face either way.', shape: 'furniture', c: seat[2] }); };
chair('furn_chair_wood', 'Pine chair', 'wood', WD, W, 120);
chair('furn_chair_ocean', 'Driftwood chair', 'ocean', [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]], C.sky, 140);
chair('furn_chair_retro', 'Diner chair', 'retro', M, C.coral, 160);
chair('furn_chair_starry', 'Moon chair', 'starry', C.navy, C.lilac, 180);
S('furn_stool_cafe', 18, 22, (R) => { R.e(9, 3, 8, 3, C.coral[2]); R.e(8, 2, 6, 2, C.coral[3]); R(4, 5, 2, 17, WD[2]); R(12, 5, 2, 17, WD[1]); R(5, 14, 8, 1, WD[2]); });
add('furn_stool_cafe', { name: 'Cafe stool', theme: 'cafe', price: 90, comfort: 1, act: 'sit', spr: 'furn_stool_cafe', desc: 'A round red stool, just like the ones at Cafe Kumo.', shape: 'furniture', c: C.coral[2] });
S('furn_sofa_cozy', 72, 44, (R) => sofaFront(R, C.butter)); S('furn_sofa_cozy_b', 72, 44, (R) => { R(2, 0, 68, 26, C.butter[1]); cushion(R, 6, 4, 30, 20, C.butter); cushion(R, 36, 4, 30, 20, C.butter); R(0, 6, 8, 34, C.butter[2]); R(64, 6, 8, 34, C.butter[1]); R(6, 24, 60, 16, C.butter[1]); leg(R, 4, 40, 4, 4, WD); leg(R, 64, 40, 4, 4, WD); });
add('furn_sofa_cozy', { name: 'Honey sofa', theme: 'wood', price: 900, comfort: 6, w: 3, act: 'sit', vars: ['furn_sofa_cozy', 'furn_sofa_cozy_b'], desc: 'A squashy honey-coloured sofa built for naps.', shape: 'furniture', c: C.butter[2] });
S('furn_sofa_ocean', 72, 44, (R) => sofaFront(R, C.sky, [C.sand[0], C.sand[1], C.sand[2]]));
add('furn_sofa_ocean', { name: 'Seaside sofa', theme: 'ocean', price: 950, comfort: 6, w: 3, act: 'sit', desc: 'Sky-blue cushions that feel like a summer breeze.', shape: 'furniture', c: C.sky[2] });
S('furn_armchair_forest', 40, 42, (R) => { R(4, 0, 32, 22, C.forest[2]); R(4, 0, 32, 3, C.forest[3]); cushion(R, 8, 4, 24, 16, C.forest); R(0, 12, 8, 26, C.forest[2]); R(0, 12, 8, 3, C.forest[3]); R(32, 12, 8, 26, C.forest[1]); block(R, 6, 20, 28, 18, 6, C.forest); leg(R, 3, 38, 3, 4, WD); leg(R, 34, 38, 3, 4, WD); R(14, 6, 6, 5, C.butter[2]); });
add('furn_armchair_forest', { name: 'Moss armchair', theme: 'forest', price: 520, comfort: 5, w: 2, act: 'sit', desc: 'A deep green armchair, soft as a mossy log.', shape: 'furniture', c: C.forest[2] });
S('furn_beanbag_starry', 34, 26, (R) => { R.e(17, 15, 16, 10, C.lilac[1]); R.e(16, 13, 15, 10, C.lilac[2]); R.e(14, 10, 10, 6, C.lilac[3]); R.e(19, 16, 8, 4, C.lilac[1]); R(10, 8, 2, 1, C.butter[3]); R(22, 12, 1, 1, C.butter[3]); R(8, 16, 1, 1, '#ffffff'); });
add('furn_beanbag_starry', { name: 'Starry beanbag', theme: 'starry', price: 380, comfort: 4, act: 'sit', desc: 'A lilac beanbag sprinkled with little stars.', shape: 'furniture', c: C.lilac[2] });
S('furn_zabuton', 28, 18, (R) => { cushion(R, 0, 4, 28, 14, C.ribbon); R(12, 9, 4, 3, C.ribbon[1]); R(1, 4, 2, 2, C.butter[2]); R(25, 4, 2, 2, C.butter[2]); });
add('furn_zabuton', { name: 'Floor cushion', theme: 'wood', price: 80, comfort: 2, act: 'sit', solid: false, desc: 'A plump zabuton for sitting on the floor.', shape: 'toy', c: C.ribbon[2] });
S('furn_bench_wood', 48, 26, (R) => { leg(R, 3, 14, 4, 12, WD); leg(R, 41, 14, 4, 12, WD); R(0, 0, 48, 10, W[2]); R(0, 0, 48, 2, W[3]); R(0, 5, 48, 1, W[1]); block(R, 0, 9, 48, 7, 4, r5([WD[1], W[1], W[2], W[3], W[4]])); grain(R, 1, 1, 46, 8, W, 3); });
add('furn_bench_wood', { name: 'Garden bench', theme: 'wood', price: 260, comfort: 2, w: 2, act: 'sit', desc: 'A sturdy slatted bench.', shape: 'furniture', c: W[2] });
// tables
S('furn_table_wood', 48, 40, (R) => { leg(R, 3, 18, 4, 22, WD); leg(R, 41, 18, 4, 22, WD); block(R, 0, 4, 48, 18, 12, r5([WD[1], W[1], W[2], W[3], W[4]])); grain(R, 1, 5, 46, 10, W, 9); R(20, 0, 8, 8, C.sky[3]); R(21, 1, 6, 1, '#ffffff'); R(22, -0, 4, 1, C.coral[3]); });
add('furn_table_wood', { name: 'Pine table', theme: 'wood', price: 420, comfort: 3, w: 2, desc: 'A farmhouse table with a little flower vase.', shape: 'furniture', c: W[3] });
S('furn_table_cafe', 36, 34, (R) => { R(16, 14, 4, 18, C.charcoal[2]); R(10, 31, 16, 3, C.charcoal[1]); R.e(18, 8, 17, 7, WD[2]); R.e(18, 7, 16, 6, P[4]); R.e(15, 5, 8, 2, '#ffffff'); R(12, 3, 6, 5, P[4]); R(13, 4, 4, 1, W[1]); R(22, 2, 3, 6, C.coral[2]); });
add('furn_table_cafe', { name: 'Bistro table', theme: 'cafe', price: 300, comfort: 2, desc: 'A round marble-topped cafe table.', shape: 'furniture', c: P[3] });
S('furn_table_retro', 48, 38, (R) => { R(22, 14, 4, 22, M[2]); R(14, 34, 20, 4, M[1]); block(R, 0, 4, 48, 12, 8, C.mint); R(0, 11, 48, 2, M[3]); R(6, 0, 8, 7, C.coral[3]); R(7, 1, 6, 1, '#ffffff'); R(30, 2, 10, 4, C.butter[2]); });
add('furn_table_retro', { name: 'Diner table', theme: 'retro', price: 380, comfort: 2, w: 2, desc: 'Mint formica with chrome trim, milkshake not included.', shape: 'furniture', c: C.mint[2] });
S('furn_lowtable', 56, 28, (R) => { leg(R, 4, 14, 4, 14, WD); leg(R, 48, 14, 4, 14, WD); block(R, 0, 4, 56, 12, 9, r5([WD[0], WD[1], WD[2], WD[3], WD[4]])); R(22, 0, 8, 6, P[4]); R(23, 2, 6, 2, C.forest[3]); R(34, 3, 6, 3, C.sand[3]); });
add('furn_lowtable', { name: 'Chabudai', theme: 'wood', price: 340, comfort: 3, w: 2, desc: 'A low tea table for sitting on cushions.', shape: 'furniture', c: WD[2] });
S('furn_kotatsu', 56, 40, (R) => { R(0, 10, 56, 26, C.coral[2]); R(0, 10, 56, 3, C.coral[3]); for (let x = 4; x < 56; x += 8) R(x, 14, 4, 4, C.coral[4]); R(0, 34, 56, 2, C.coral[1]); block(R, 4, 4, 48, 8, 6, r5([WD[1], W[1], W[2], W[3], W[4]])); R.e(16, 6, 4, 2, C.leafAutumn[2]); R.e(24, 7, 4, 2, C.leafAutumn[2]); });
add('furn_kotatsu', { name: 'Kotatsu', theme: 'season', season: 'winter', price: 800, comfort: 5, w: 2, act: 'kotatsu', desc: 'A heated table with a quilt. Extra cozy in winter.', shape: 'furniture', c: C.coral[2] });
S('furn_desk_starry', 56, 44, (R) => { R(2, 16, 4, 28, C.navy[1]); block(R, 0, 12, 56, 10, 6, C.navy); drawerStack(R, 36, 22, 18, 22, 3, C.navy); leg(R, 2, 22, 3, 22, C.navy); R(8, 2, 10, 2, C.butter[2]); R(12, 4, 2, 9, C.butter[1]); R.e(12, 3, 2, 1, C.butter[4]); R(24, 6, 10, 7, C.lilac[3]); R(25, 7, 8, 1, '#ffffff'); R(42, 4, 6, 6, C.sky[2]); R(44, 2, 2, 2, C.butter[3]); });
add('furn_desk_starry', { name: 'Stargazer desk', theme: 'starry', price: 640, comfort: 3, w: 2, act: 'study', desc: 'A navy desk with a little star lamp. Great for homework.', shape: 'furniture', c: C.navy[2] });
S('furn_side_table', 24, 28, (R) => { block(R, 0, 4, 24, 24, 5, [C.sand[0], C.sand[1], C.sky[4], P[4], '#ffffff']); panelDoor(R, 3, 12, 18, 10, [C.sky[0], C.sky[1], C.sky[3], C.sky[4]], 'top'); R(8, 0, 6, 5, C.mint[3]); });
add('furn_side_table', { name: 'Beach side table', theme: 'ocean', price: 200, comfort: 1, desc: 'A little white cabinet with a sea-glass knob.', shape: 'furniture', c: C.sky[3] });
// beds
S('furn_futon', 44, 64, (R) => { R(0, 0, 44, 64, P[2]); R(1, 1, 42, 62, P[3]); cushion(R, 10, 3, 24, 9, C.sky); R(1, 16, 42, 46, C.coral[3]); R(1, 16, 42, 2, C.coral[4]); for (let y = 22; y < 60; y += 7) R(4, y, 36, 1, C.coral[2]); });
add('furn_futon', { name: 'Futon', theme: 'wood', price: 300, comfort: 3, w: 2, h: 2, act: 'nap', solid: false, desc: 'A rolled-out futon. Nap anywhere!', shape: 'furniture', c: C.coral[3] });
S('furn_bed_canopy', 48, 72, (R) => { R(0, 0, 4, 72, C.butter[1]); R(44, 0, 4, 72, C.butter[1]); R(0, 0, 48, 6, C.lilac[2]); for (let x = 2; x < 46; x += 6) R(x, 6, 4, 3, C.lilac[3]); R(4, 10, 40, 58, P[4]); cushion(R, 8, 12, 32, 10, { 1: P[1], 2: P[3], 3: P[4], 4: '#ffffff' }); R(4, 24, 40, 40, C.lilac[2]); R(4, 24, 40, 3, C.lilac[3]); for (let y = 32; y < 62; y += 8) for (let x = 8; x < 42; x += 9) R(x, y, 2, 2, C.butter[3]); R(0, 64, 48, 8, C.navy[2]); R(0, 64, 48, 1, C.navy[3]); });
add('furn_bed_canopy', { name: 'Starry canopy bed', theme: 'starry', price: 1800, comfort: 6, w: 2, h: 2, act: 'nap', desc: 'A dreamy bed with a lilac canopy and star quilt.', shape: 'furniture', c: C.lilac[2] });
S('furn_hammock', 64, 40, (R) => { R(0, 0, 4, 40, W[1]); R(60, 0, 4, 40, W[1]); for (let x = 4; x < 60; x++) { const y = 8 + Math.round(Math.sin(((x - 4) / 56) * Math.PI) * 14); R(x, y, 1, 6, ((x >> 2) % 2) ? C.sky[3] : P[4]); R(x, y + 6, 1, 1, C.sky[1]); } R(2, 36, 60, 4, W[2]); });
add('furn_hammock', { name: 'Hammock', theme: 'ocean', price: 700, comfort: 5, w: 2, act: 'nap', desc: 'A striped hammock for lazy afternoons. Very cozy.', shape: 'furniture', c: C.sky[3] });
S('furn_bed_forest', 40, 64, (R) => { R(0, 0, 40, 64, C.forest[1]); R(0, 0, 40, 10, W[2]); R(2, 2, 36, 6, W[3]); for (let x = 4; x < 38; x += 6) R(x, 2, 2, 6, W[1]); R(2, 10, 36, 50, P[4]); cushion(R, 6, 12, 28, 10, { 1: P[1], 2: P[3], 3: P[4], 4: '#ffffff' }); R(2, 25, 36, 33, C.forest[3]); R(2, 25, 36, 3, C.forest[4]); for (let y = 30; y < 56; y += 7) R(6 + (y % 3) * 4, y, 6, 2, C.leaf[2]); R(0, 58, 40, 6, W[2]); });
add('furn_bed_forest', { name: 'Fern bed', theme: 'forest', price: 1200, comfort: 5, w: 2, h: 2, act: 'nap', desc: 'A log-frame bed with a leafy quilt.', shape: 'furniture', c: C.forest[3] });
// storage
S('furn_bookshelf', 32, 64, (R) => { block(R, 0, 0, 32, 64, 3, r5([WD[0], W[1], W[2], W[3], W[4]])); for (let s = 0; s < 4; s++) { const y = 5 + s * 14; R(3, y, 26, 12, W[1]); books(R, 3, y + 1, 26, 11, s + 61); R(2, y + 12, 28, 2, W[3]); } });
add('furn_bookshelf', { name: 'Tall bookshelf', theme: 'wood', price: 520, comfort: 3, act: 'read', desc: 'Packed with paperbacks and picture books.', shape: 'book', c: W[2] });
S('furn_shelf_low', 48, 34, (R) => { block(R, 0, 6, 48, 28, 4, r5([WD[0], W[1], W[2], W[3], W[4]])); R(3, 12, 42, 9, W[1]); books(R, 3, 12, 20, 9, 77); R(26, 15, 6, 6, C.sakura[3]); R(36, 13, 6, 8, C.sky[2]); R(2, 21, 44, 2, W[3]); drawerStack(R, 3, 24, 42, 8, 1, W); R(6, 0, 8, 7, C.forest[2]); R(7, 0, 6, 2, C.forest[3]); R(30, 2, 8, 5, C.butter[2]); });
add('furn_shelf_low', { name: 'Trinket shelf', theme: 'wood', price: 300, comfort: 2, w: 2, desc: 'A low shelf for books, shells and little treasures.', shape: 'furniture', c: W[2] });
S('furn_dresser_retro', 40, 40, (R) => { block(R, 0, 4, 40, 32, 4, C.coral); drawerStack(R, 3, 10, 34, 24, 3, C.coral); leg(R, 3, 36, 3, 4, M); leg(R, 34, 36, 3, 4, M); R(6, 0, 10, 5, C.butter[2]); R(26, 0, 8, 5, C.mint[3]); });
add('furn_dresser_retro', { name: 'Retro dresser', theme: 'retro', price: 460, comfort: 2, w: 2, desc: 'Coral drawers with chrome legs.', shape: 'furniture', c: C.coral[2] });
S('furn_sea_chest', 40, 28, (R) => { R(0, 6, 40, 22, C.sky[1]); R.e(20, 7, 20, 5, C.sky[2]); R(0, 7, 40, 4, C.sky[2]); R(0, 11, 40, 2, C.sand[3]); [4, 18, 32].forEach((x) => R(x, 4, 4, 24, C.sand[2])); R(17, 13, 6, 6, C.butter[2]); R(1, 26, 38, 2, C.sky[0]); });
add('furn_sea_chest', { name: 'Sea chest', theme: 'ocean', price: 380, comfort: 2, w: 2, desc: 'A sailor\'s chest that smells faintly of salt.', shape: 'box', c: C.sky[1] });
S('furn_cabinet_cafe', 32, 56, (R) => { block(R, 0, 0, 32, 56, 3, r5([WD[0], WD[1], WD[2], WD[3], WD[4]])); R(3, 5, 26, 28, C.sky[4]); for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) { R(5 + i * 6, 9 + s * 13, 4, 6, [P[4], C.coral[3], C.mint[3], C.butter[3]][(i + s) % 4]); R(5 + i * 6, 15 + s * 13, 5, 1, P[2]); } R(15, 5, 2, 28, WD[2]); glint(R, 5, 6); panelDoor(R, 3, 36, 26, 16, WD, 'top'); });
add('furn_cabinet_cafe', { name: 'Teacup cabinet', theme: 'cafe', price: 560, comfort: 2, desc: 'A glass cabinet of mismatched teacups.', shape: 'cup', c: C.coral[3] });
// lights
S('furn_lamp_floor', 16, 48, (R) => { R(1, 0, 14, 12, C.butter[3]); R(0, 4, 16, 8, C.butter[2]); R(2, 1, 6, 2, C.butter[4]); R(0, 11, 16, 1, C.butter[1]); R(7, 12, 2, 32, W[2]); R(7, 12, 1, 32, W[3]); R.e(8, 45, 6, 2, W[1]); });
add('furn_lamp_floor', { name: 'Floor lamp', theme: 'wood', price: 260, comfort: 2, light: true, act: 'lamp', desc: 'A warm reading lamp. Switch it on at night.', shape: 'plant', c: C.butter[2] });
S('furn_lamp_mushroom', 20, 24, (R) => { R.e(10, 7, 9, 7, C.coral[2]); R.e(9, 5, 7, 4, C.coral[3]); R(1, 8, 18, 2, C.coral[1]); R(4, 3, 2, 2, P[4]); R(12, 5, 2, 2, P[4]); R(8, 10, 4, 10, P[3]); R(6, 20, 8, 4, C.coral[1]); });
add('furn_lamp_mushroom', { name: 'Mushroom lamp', theme: 'retro', price: 180, comfort: 2, light: true, act: 'lamp', solid: false, desc: 'A spotty red mushroom that glows.', shape: 'mushroom', c: C.coral[2] });
S('furn_lamp_star', 22, 26, (R) => { R.t([11, 0], [14, 7], [8, 7], C.butter[2]); R.t([0, 7], [22, 7], [11, 14], C.butter[2]); R.t([11, 11], [4, 18], [7, 9], C.butter[2]); R.t([11, 11], [18, 18], [15, 9], C.butter[2]); R(9, 6, 4, 4, C.butter[4]); R(10, 16, 2, 6, C.navy[2]); R(5, 22, 12, 4, C.navy[1]); });
add('furn_lamp_star', { name: 'Star lamp', theme: 'starry', price: 240, comfort: 2, light: true, act: 'lamp', solid: false, desc: 'A little star that glows butter-yellow.', shape: 'star', c: C.butter[2] });
S('furn_lantern_paper', 20, 38, (R) => { R(3, 0, 14, 2, WD[2]); R(1, 2, 18, 28, P[4]); for (let y = 6; y < 30; y += 6) R(1, y, 18, 1, P[2]); R(1, 2, 2, 28, P[3]); R(17, 2, 2, 28, P[2]); R(3, 30, 14, 2, WD[2]); R(5, 32, 2, 6, WD[1]); R(13, 32, 2, 6, WD[1]); R(6, 10, 8, 10, C.butter[4]); });
add('furn_lantern_paper', { name: 'Paper andon', theme: 'forest', price: 220, comfort: 2, light: true, act: 'lamp', desc: 'A paper floor lantern with a soft glow.', shape: 'paper', c: P[3] });
S('furn_lamp_jelly', 18, 32, (R) => { R.e(9, 7, 8, 7, C.lilac[3]); R.e(8, 5, 5, 4, C.lilac[4]); R(1, 8, 16, 2, C.lilac[2]); for (let x = 3; x < 16; x += 3) R(x, 10, 1, 10 + (x % 4), C.lilac[3]); R(4, 26, 10, 6, C.sky[1]); R(5, 26, 8, 1, C.sky[3]); });
add('furn_lamp_jelly', { name: 'Jellyfish lamp', theme: 'ocean', price: 280, comfort: 2, light: true, act: 'lamp', solid: false, desc: 'A wobbly glowing jellyfish.', shape: 'bottle', c: C.lilac[3] });
S('furn_candles', 22, 18, (R) => { [[3, 8], [9, 4], [15, 10]].forEach(([x, y]) => { R(x, y, 4, 18 - y, P[4]); R(x, y, 1, 18 - y, '#ffffff'); R(x + 1, y - 3, 2, 3, C.butter[3]); R(x + 1, y - 2, 1, 1, '#ffffff'); }); R(0, 16, 22, 2, WD[2]); });
add('furn_candles', { name: 'Candle trio', theme: 'cafe', price: 120, comfort: 2, light: true, act: 'lamp', solid: false, desc: 'Three cream candles on a little tray.', shape: 'bottle', c: P[3] });
// plants
S('furn_plant_monstera', 32, 46, (R) => { pot(R, 16, 46, 16, 12, C.stone); foliage(R, 16, 20, 14, 15, C.forest, 21); for (let i = 0; i < 5; i++) R(6 + i * 5, 12 + (i % 2) * 8, 1, 4, C.forest[1]); R(15, 30, 2, 4, C.forest[1]); });
add('furn_plant_monstera', { name: 'Monstera', theme: 'forest', price: 260, comfort: 2, plant: true, act: 'plant', desc: 'Big glossy leaves with holes. Very trendy.', shape: 'plant', c: C.forest[2] });
S('furn_cactus', 18, 28, (R) => { pot(R, 9, 28, 14, 9); R(6, 2, 6, 18, C.forest[2]); R(6, 2, 2, 18, C.forest[3]); R(1, 8, 5, 3, C.forest[2]); R(1, 5, 3, 5, C.forest[2]); R(12, 10, 5, 3, C.forest[1]); R(14, 7, 3, 5, C.forest[1]); R(8, 0, 2, 2, C.coral[3]); for (let y = 5; y < 18; y += 4) R(9, y, 1, 1, P[4]); });
add('furn_cactus', { name: 'Cactus', theme: 'retro', price: 90, comfort: 1, plant: true, act: 'plant', solid: false, desc: 'A prickly friend with a pink flower.', shape: 'plant', c: C.forest[2] });
S('furn_fern', 30, 34, (R) => { pot(R, 15, 34, 14, 10, C.sky); for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.85; for (let k = 2; k < 14; k++) R(15 + Math.round(Math.cos(a) * k), 22 + Math.round(Math.sin(a) * k * 0.8), 2, 2, k > 10 ? C.leaf[3] : C.leaf[2]); } R(14, 12, 2, 12, C.leaf[1]); });
add('furn_fern', { name: 'Boston fern', theme: 'forest', price: 160, comfort: 2, plant: true, act: 'plant', solid: false, desc: 'Feathery fronds in a sky-blue pot.', shape: 'plant', c: C.leaf[2] });
S('furn_bonsai', 30, 32, (R) => { R(3, 22, 24, 7, C.stone[2]); R(2, 21, 26, 3, C.stone[3]); R(13, 10, 3, 12, WD[2]); R(16, 12, 5, 2, WD[2]); foliage(R, 10, 10, 6, 4, C.leaf, 31); foliage(R, 21, 8, 6, 4, C.leaf, 32); foliage(R, 15, 4, 5, 3, C.leaf, 33); });
add('furn_bonsai', { name: 'Bonsai pine', theme: 'wood', price: 420, comfort: 3, plant: true, act: 'plant', desc: 'A tiny, very patient pine tree.', shape: 'plant', c: C.leaf[2] });
S('furn_sunflower', 22, 46, (R) => { pot(R, 11, 46, 14, 10); R(10, 12, 2, 24, C.forest[2]); R(4, 22, 6, 3, C.forest[3]); R(12, 28, 6, 3, C.forest[2]); R.e(11, 9, 9, 9, C.butter[2]); R.e(10, 8, 7, 7, C.butter[3]); R.e(11, 9, 4, 4, W[1]); R(9, 7, 2, 1, W[2]); });
add('furn_sunflower', { name: 'Potted sunflower', theme: 'season', season: 'summer', price: 140, comfort: 2, plant: true, act: 'plant', solid: false, desc: 'A sunflower that always turns to the window.', shape: 'flower', c: C.butter[2] });
S('furn_succulents', 30, 16, (R) => { R(0, 8, 30, 8, W[2]); R(0, 8, 30, 2, W[3]); R(1, 14, 28, 2, W[1]); [[5, C.mint], [15, C.sakura], [24, C.forest]].forEach(([x, r]) => { R.e(x, 6, 4, 3, r[2]); R.e(x - 1, 5, 2, 1, r[3]); R(x, 3, 1, 2, r[3]); }); });
add('furn_succulents', { name: 'Succulent tray', theme: 'cafe', price: 110, comfort: 1, plant: true, act: 'plant', solid: false, desc: 'Three chubby succulents in a wooden tray.', shape: 'plant', c: C.mint[2] });
// rugs (flat, under furniture)
const rug = (id, name, theme, price, w, h, sw, sh, fn, c, desc) => add(id, { name, theme, price, comfort: 2, kind: 'rug', w, h, desc, shape: 'paper', c }, [sw, sh, fn]);
rug('furn_rug_round', 'Round braided rug', 'wood', 220, 2, 2, 64, 44, (R) => { R.e(32, 22, 31, 21, C.butter[1]); R.e(32, 22, 29, 19, C.butter[2]); R.e(32, 22, 22, 14, C.coral[3]); R.e(32, 22, 16, 10, C.butter[3]); R.e(32, 22, 8, 5, C.coral[3]); }, C.butter[2], 'A braided rug in honey and rose.');
rug('furn_rug_wave', 'Wave rug', 'ocean', 260, 3, 2, 96, 56, (R) => rugRect(R, 96, 56, C.sky[2], C.sky[4], C.navy[2], (R2, w, h) => { for (let y = 10; y < h - 6; y += 10) for (let x = 4; x < w - 4; x++) R2(x, y + Math.round(Math.sin(x / 4) * 2), 1, 2, C.sky[4]); }), C.sky[2], 'Rolling blue waves to curl your toes on.');
rug('furn_rug_star', 'Star rug', 'starry', 300, 2, 2, 64, 56, (R) => { rugRect(R, 64, 56, C.navy[2], C.navy[3], C.navy[0]); R.t([32, 10], [38, 26], [26, 26], C.butter[2]); R.t([14, 24], [50, 24], [32, 36], C.butter[2]); R.t([32, 32], [20, 46], [26, 28], C.butter[2]); R.t([32, 32], [44, 46], [38, 28], C.butter[2]); for (let i = 0; i < 10; i++) R(4 + Math.floor(hash(i, 1, 5) * 56), 4 + Math.floor(hash(i, 2, 5) * 48), 1, 1, '#fffaf0'); }, C.navy[2], 'A night-sky rug with a big golden star.');
rug('furn_rug_checker', 'Checker rug', 'retro', 240, 2, 2, 64, 56, (R) => rugRect(R, 64, 56, P[4], C.coral[3], C.coral[1], (R2) => { for (let y = 2; y < 54; y += 8) for (let x = 2; x < 62; x += 8) if (((x + y) >> 3) % 2) R2(x, y, 8, 8, C.coral[3]); }), C.coral[3], 'Bold coral checkers, very retro.');
rug('furn_rug_leaf', 'Leaf rug', 'forest', 240, 2, 2, 64, 44, (R) => { R.e(32, 22, 31, 21, C.forest[1]); R.e(32, 22, 29, 19, C.forest[3]); R(8, 21, 48, 2, C.forest[1]); for (let i = 0; i < 6; i++) { R(14 + i * 7, 12 + i % 2, 1, 9, C.forest[2]); R(14 + i * 7, 24, 1, 9 - i % 2, C.forest[2]); } }, C.forest[3], 'A rug shaped like a giant leaf.');
// wall items (hang on wall faces)
const wall = (id, name, theme, price, sw, sh, fn, def) => add(id, { name, theme, price, comfort: 1, kind: 'wall', ...def }, [sw, sh, fn]);
wall('furn_poster_sea', 'Seaside poster', 'ocean', 80, 22, 30, (R) => { R(0, 0, 22, 30, P[4]); R(2, 2, 18, 24, C.sky[3]); R(2, 16, 18, 10, C.sky[1]); R(2, 15, 18, 2, C.sky[4]); R.e(15, 7, 3, 3, C.butter[3]); R(5, 12, 6, 4, P[4]); R(7, 8, 1, 5, WD[2]); R(3, 27, 12, 1, C.ink[3]); }, { desc: 'A travel poster of a sunny bay.', shape: 'paper', c: C.sky[3] });
wall('furn_poster_band', 'Band poster', 'retro', 90, 22, 30, (R) => { R(0, 0, 22, 30, C.charcoal[2]); R(2, 2, 18, 8, C.coral[3]); R(4, 4, 14, 3, P[4]); R.e(11, 18, 6, 6, C.butter[2]); R.e(11, 18, 2, 2, C.charcoal[1]); R(3, 26, 16, 1, C.mint[3]); }, { desc: 'THE STARLINGS, live at the harbour hall.', shape: 'paper', c: C.coral[3] });
wall('furn_clock_wall', 'Wall clock', 'wood', 200, 22, 24, (R) => { R.e(11, 11, 10, 10, WD[1]); R.e(11, 11, 9, 9, W[3]); R.e(11, 11, 7, 7, P[4]); R(9, 21, 4, 3, WD[1]); }, { clock: true, comfort: 2, desc: 'A round wooden clock. It keeps perfect time.', shape: 'coin', c: W[3] });
wall('furn_painting_forest', 'Forest painting', 'forest', 260, 36, 28, (R) => { R(0, 0, 36, 28, C.butter[1]); R(1, 1, 34, 26, C.butter[2]); R(3, 3, 30, 22, C.sky[3]); R(3, 15, 30, 10, C.forest[3]); R.t([8, 6], [14, 18], [2, 18], C.forest[1]); R.t([22, 4], [30, 18], [14, 18], C.forest[2]); R(3, 20, 30, 5, C.leaf[3]); R(28, 5, 3, 3, P[4]); }, { comfort: 2, desc: 'Pine trees under a soft blue sky.', shape: 'paper', c: C.forest[2] });
wall('furn_star_chart', 'Star chart', 'starry', 240, 36, 30, (R) => { R(0, 0, 36, 30, WD[2]); R(2, 2, 32, 26, C.navy[1]); for (let i = 0; i < 18; i++) R(3 + Math.floor(hash(i, 3, 9) * 30), 3 + Math.floor(hash(i, 4, 9) * 24), 1, 1, i % 4 ? '#fffaf0' : C.butter[3]); R(8, 8, 8, 1, C.lilac[3]); R(16, 8, 1, 7, C.lilac[3]); R(16, 15, 9, 1, C.lilac[3]); R(25, 15, 1, 6, C.lilac[3]); }, { comfort: 2, desc: 'Constellations of the spring sky.', shape: 'star', c: C.navy[2] });
wall('furn_bunting', 'Party bunting', 'cafe', 70, 64, 14, (R) => { R(0, 1, 64, 1, WD[2]); [C.coral, C.butter, C.sky, C.mint].forEach((c, i) => { for (let k = 0; k < 2; k++) { const x = 3 + (i * 2 + k) * 8; R(x, 2, 6, 3, c[2]); R(x + 1, 5, 4, 3, c[2]); R(x + 2, 8, 2, 3, c[2]); R(x, 2, 6, 1, c[3]); } }); }, { w: 2, desc: 'Triangle flags in four happy colours.', shape: 'ticket', c: C.coral[2] });
wall('furn_photo_frame', 'Photo frame', 'wood', 60, 18, 16, (R) => { R(0, 0, 18, 16, W[2]); R(0, 0, 18, 1, W[3]); R(2, 2, 14, 12, C.sky[3]); R.e(7, 9, 3, 3, C.butter[2]); R.e(11, 10, 3, 3, C.hairBrown[2]); R(2, 11, 14, 3, C.forest[3]); }, { desc: 'A photo of Misa, Mum and Dad at the aquarium.', shape: 'stamp', c: W[2], act: 'photo' });
wall('furn_wind_chime', 'Wind chime', 'season', 100, 12, 30, (R) => { R(1, 0, 10, 10, C.sky[4]); R.e(6, 6, 5, 5, C.sky[3]); R(2, 2, 2, 2, '#ffffff'); R(5, 10, 1, 8, P[1]); R(2, 18, 8, 10, P[4]); R(4, 20, 4, 1, C.coral[2]); }, { season: 'summer', desc: 'A glass fuurin that rings on summer breezes.', shape: 'bottle', c: C.sky[3], act: 'chime' });
wall('furn_shelf_wall', 'Wall shelf', 'wood', 110, 32, 18, (R) => { R(0, 10, 32, 3, W[3]); R(0, 10, 32, 1, W[4]); R(3, 13, 2, 4, W[1]); R(27, 13, 2, 4, W[1]); R(4, 4, 6, 6, C.mint[2]); R(14, 2, 4, 8, C.coral[3]); R(21, 5, 8, 5, P[4]); R(22, 6, 6, 1, C.sky[1]); }, { desc: 'A little shelf with a cup and a jar.', shape: 'furniture', c: W[3] });
wall('furn_koinobori', 'Carp streamer', 'season', 120, 40, 20, (R) => { R(0, 0, 2, 20, WD[2]); [[C.navy, 2], [C.coral, 10]].forEach(([c, y]) => { R(2, y, 30, 7, c[2]); R(2, y, 30, 2, c[3]); R(32, y + 1, 4, 5, c[2]); R.e(6, y + 3, 2, 2, P[4]); R(5, y + 3, 1, 1, C.ink[1]); for (let x = 12; x < 30; x += 5) R(x, y + 3, 2, 2, c[1]); }); }, { w: 2, season: 'spring', desc: 'Koinobori carp flags for Children\'s Day.', shape: 'fish', c: C.coral[2] });
// fun pieces
S('furn_plushie_cat', 20, 20, (R) => { R.e(10, 13, 8, 7, C.butter[2]); R.e(10, 7, 7, 6, C.butter[2]); R.t([4, 4], [4, 0], [8, 2], C.butter[2]); R.t([12, 2], [16, 0], [16, 4], C.butter[2]); R(6, 7, 2, 2, C.ink[1]); R(12, 7, 2, 2, C.ink[1]); R(9, 10, 2, 1, C.coral[2]); R(4, 10, 2, 1, C.coral[3]); R(14, 10, 2, 1, C.coral[3]); R(8, 15, 4, 3, P[4]); });
add('furn_plushie_cat', { name: 'Cat plushie', theme: 'wood', price: 120, comfort: 2, solid: false, act: 'hug', spr: 'furn_plushie_cat', desc: 'A soft orange cat. Mochi pretends not to be jealous.', shape: 'toy', c: C.butter[2] });
S('furn_fish_tank', 48, 40, (R) => { block(R, 0, 26, 48, 14, 3, r5([WD[0], WD[1], WD[2], WD[3], WD[4]])); R(1, 2, 46, 24, C.water[3]); R(1, 2, 46, 3, C.water[4]); R(1, 22, 46, 4, C.sand[3]); R(6, 12, 2, 10, C.forest[3]); R(9, 15, 2, 7, C.forest[2]); R.e(26, 12, 4, 2, C.leafAutumn[3]); R(30, 11, 2, 3, C.leafAutumn[2]); R.e(16, 17, 3, 2, C.butter[2]); R(36, 8, 2, 2, C.water[5]); R(38, 4, 1, 1, C.water[5]); R(0, 0, 48, 2, M[2]); glint(R, 3, 5); });
add('furn_fish_tank', { name: 'Fish tank', theme: 'ocean', price: 680, comfort: 3, w: 2, act: 'fish', spr: 'furn_fish_tank', desc: 'Two goldfish named Sushi and Tempura.', shape: 'fish', c: C.water[3] });
S('furn_record_player', 32, 30, (R) => { block(R, 0, 8, 32, 22, 4, C.coral); drawerStack(R, 3, 16, 26, 12, 1, C.coral); R.e(13, 6, 9, 4, C.charcoal[1]); R.e(13, 6, 3, 1, C.coral[3]); R(24, 0, 2, 7, M[3]); R(22, 6, 4, 2, M[2]); });
add('furn_record_player', { name: 'Record player', theme: 'retro', price: 540, comfort: 3, act: 'music', spr: 'furn_record_player', desc: 'Plays crackly old jazz records.', shape: 'coin', c: C.coral[2] });
S('furn_music_box', 20, 18, (R) => { block(R, 0, 6, 20, 12, 4, r5([WD[0], WD[1], WD[2], WD[3], WD[4]])); R(2, 0, 16, 7, C.lilac[3]); R(2, 0, 16, 1, C.lilac[4]); R(8, 2, 4, 3, C.butter[3]); R(18, 10, 3, 2, C.butter[2]); });
add('furn_music_box', { name: 'Music box', theme: 'starry', price: 320, comfort: 3, solid: false, act: 'musicbox', spr: 'furn_music_box', desc: 'Wind it up and it plays a slow, sweet lullaby.', shape: 'box', c: C.lilac[3] });
S('furn_globe', 20, 30, (R) => { R.e(10, 10, 9, 9, C.sky[2]); R.e(8, 8, 6, 5, C.sky[3]); R(4, 7, 6, 4, C.forest[3]); R(11, 12, 5, 4, C.forest[3]); R(12, 5, 4, 2, C.forest[2]); R(17, 2, 2, 18, C.butter[1]); R(9, 20, 2, 6, WD[2]); R(4, 26, 12, 4, WD[1]); });
add('furn_globe', { name: 'Desk globe', theme: 'starry', price: 210, comfort: 1, solid: false, act: 'spin', spr: 'furn_globe', desc: 'Spin it and point at somewhere new.', shape: 'rock', c: C.sky[2] });
add('furn_piano', { name: 'Upright piano', theme: 'cafe', price: 2400, comfort: 4, w: 2, act: 'piano', spr: 'int_piano', desc: 'A real upright piano. Plays a little out of tune.', shape: 'furniture', c: C.charcoal[2] });
S('furn_fan', 20, 38, (R) => { R.e(10, 9, 9, 9, M[3]); R.e(10, 9, 7, 7, C.sky[3]); for (let k = 0; k < 4; k++) R.e(10 + Math.round(Math.cos(k * 1.57) * 4), 9 + Math.round(Math.sin(k * 1.57) * 4), 2, 2, C.sky[4]); R.e(10, 9, 2, 2, M[1]); R(9, 18, 2, 16, M[2]); R(3, 34, 14, 4, M[1]); });
add('furn_fan', { name: 'Electric fan', theme: 'season', season: 'summer', price: 180, comfort: 2, solid: false, act: 'fan', spr: 'furn_fan', desc: 'Say "ahhh" into it for a robot voice.', shape: 'tool', c: C.sky[3] });
S('furn_star_tree', 34, 58, (R) => { R(15, 48, 4, 6, WD[2]); R(9, 52, 16, 6, C.ribbon[2]); R.t([17, 6], [32, 48], [2, 48], C.forest[1]); R.t([17, 6], [28, 38], [6, 38], C.forest[2]); R.t([17, 6], [24, 26], [10, 26], C.forest[3]); for (let i = 0; i < 10; i++) R(8 + Math.floor(hash(i, 1, 7) * 18), 18 + Math.floor(hash(i, 2, 7) * 28), 2, 2, [C.coral[3], C.butter[3], C.sky[3]][i % 3]); R.t([17, 0], [20, 6], [14, 6], C.butter[3]); R(16, 2, 2, 2, '#ffffff'); });
add('furn_star_tree', { name: 'Starry Eve tree', theme: 'season', season: 'winter', price: 600, comfort: 4, light: true, act: 'lamp', spr: 'furn_star_tree', desc: 'A little fir with twinkling ornaments.', shape: 'plant', c: C.forest[2] });
S('furn_scratch_post', 18, 38, (R) => { R(5, 6, 8, 28, C.sand[2]); for (let y = 8; y < 34; y += 3) R(5, y, 8, 1, C.sand[1]); R(5, 6, 2, 28, C.sand[3]); R(0, 34, 18, 4, C.forest[2]); R(0, 34, 18, 1, C.forest[3]); R(3, 0, 12, 6, C.forest[2]); R(3, 0, 12, 2, C.forest[3]); R(13, 6, 1, 8, C.ink[3]); R.e(13, 15, 2, 2, C.coral[3]); });
add('furn_scratch_post', { name: 'Scratching post', theme: 'forest', price: 150, comfort: 2, act: 'mochi', spr: 'furn_scratch_post', desc: 'Saves the sofa. Mochi approves.', shape: 'tool', c: C.sand[2] });
S('furn_tea_trolley', 36, 32, (R) => { R(2, 8, 2, 20, M[2]); R(32, 8, 2, 20, M[2]); block(R, 0, 6, 36, 5, 3, r5([WD[0], W[1], W[2], W[3], W[4]])); block(R, 0, 20, 36, 4, 2, r5([WD[0], W[1], W[2], W[3], W[4]])); R.e(5, 30, 3, 2, C.charcoal[1]); R.e(31, 30, 3, 2, C.charcoal[1]); R(6, 0, 10, 7, P[4]); R(16, 2, 3, 3, P[4]); R(8, 2, 6, 1, C.sakura[3]); R(22, 2, 4, 5, C.coral[3]); R(28, 3, 4, 4, C.butter[2]); R(8, 16, 20, 4, C.sand[3]); });
add('furn_tea_trolley', { name: 'Tea trolley', theme: 'cafe', price: 420, comfort: 3, act: 'tea', spr: 'furn_tea_trolley', desc: 'Teapot, cups and a plate of biscuits on wheels.', shape: 'cup', c: P[3] });
add('furn_maneki', { name: 'Lucky cat', theme: 'wood', price: 150, comfort: 1, solid: false, spr: 'int_maneki', desc: 'A beckoning cat for good luck.', shape: 'toy', c: P[4] });
S('furn_ship_wheel', 30, 30, (R) => { for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; for (let i = 0; i < 14; i++) R(15 + Math.round(Math.cos(a) * i), 15 + Math.round(Math.sin(a) * i), 2, 2, W[2]); } for (let a = 0; a < 60; a++) { const t = a / 9.55; R(15 + Math.round(Math.cos(t) * 10), 15 + Math.round(Math.sin(t) * 10), 2, 2, W[3]); } R.e(15, 15, 3, 3, C.butter[2]); });
add('furn_ship_wheel', { name: 'Ship\'s wheel', theme: 'ocean', price: 300, comfort: 2, kind: 'wall', spr: 'furn_ship_wheel', desc: 'Captain Jun would approve.', shape: 'coin', c: W[2] });
S('furn_neon_sign', 40, 18, (R) => { R(0, 0, 40, 18, C.charcoal[1]); R(3, 4, 6, 2, C.coral[3]); R(3, 4, 2, 8, C.coral[3]); R(3, 10, 6, 2, C.coral[3]); R(12, 4, 2, 8, C.mint[3]); R(16, 4, 6, 2, C.butter[3]); R(18, 4, 2, 8, C.butter[3]); R(25, 4, 6, 8, C.sky[3]); R(27, 6, 2, 4, C.charcoal[1]); R(34, 4, 2, 8, C.lilac[3]); });
add('furn_neon_sign', { name: 'Neon sign', theme: 'retro', price: 360, comfort: 2, kind: 'wall', light: true, act: 'lamp', w: 2, spr: 'furn_neon_sign', desc: 'Glowing letters that buzz softly.', shape: 'ticket', c: C.mint[3] });
S('furn_mushroom_stool', 22, 20, (R) => { R.e(11, 6, 10, 6, C.coral[2]); R.e(10, 4, 7, 3, C.coral[3]); R(4, 3, 3, 2, P[4]); R(14, 5, 3, 2, P[4]); R(7, 10, 8, 10, P[3]); R(7, 10, 2, 10, P[4]); });
add('furn_mushroom_stool', { name: 'Toadstool seat', theme: 'forest', price: 140, comfort: 2, act: 'sit', solid: false, spr: 'furn_mushroom_stool', desc: 'A spotty mushroom you can actually sit on.', shape: 'mushroom', c: C.coral[2] });
S('furn_jukebox', 34, 56, (R) => { R.e(17, 12, 16, 12, C.coral[2]); R(1, 12, 32, 44, C.coral[2]); R.e(17, 12, 12, 9, C.butter[3]); R(5, 12, 24, 14, C.butter[3]); R(7, 14, 20, 10, C.charcoal[2]); for (let x = 8; x < 26; x += 3) R(x, 16, 2, 6, C.butter[2]); R(3, 28, 28, 6, M[3]); for (let x = 5; x < 30; x += 4) R(x, 29, 2, 2, C.mint[3]); R(6, 38, 22, 14, C.coral[1]); for (let y = 40; y < 52; y += 3) R(8, y, 18, 1, C.coral[3]); R(1, 12, 2, 44, C.coral[3]); });
add('furn_jukebox', { name: 'Jukebox', theme: 'retro', price: 1400, comfort: 4, act: 'music', light: true, spr: 'furn_jukebox', desc: 'Pick a song and it lights up like a sunset.', shape: 'furniture', c: C.coral[2] });
S('furn_bean_lamp', 14, 34, (R) => { R(5, 0, 4, 2, C.butter[1]); R(3, 2, 8, 22, C.leafAutumn[3]); R(4, 4, 6, 18, C.butter[4]); for (let y = 6; y < 22; y += 4) R(3, y, 8, 1, C.leafAutumn[2]); R(6, 24, 2, 6, WD[2]); R(2, 30, 10, 4, WD[1]); });
add('furn_bean_lamp', { name: 'Lantern lamp', theme: 'cafe', price: 230, comfort: 2, light: true, act: 'lamp', solid: false, spr: 'furn_bean_lamp', desc: 'An amber glass lantern on a stand.', shape: 'bottle', c: C.leafAutumn[3] });
S('furn_cat_bed_box', 30, 20, (R) => { block(R, 0, 4, 30, 16, 4, [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]]); R(3, 4, 24, 6, C.sand[1]); R(4, 2, 8, 3, C.sand[3]); R(19, 2, 8, 3, C.sand[3]); R(8, 12, 14, 4, C.coral[3]); });
add('furn_cat_box', { name: 'Cardboard box', theme: 'wood', price: 20, comfort: 1, act: 'mochi', spr: 'furn_cat_bed_box', desc: 'The most expensive cat toy money can\'t buy.', shape: 'box', c: C.sand[2] });
S('furn_aquarium_lamp', 26, 30, (R) => { R.e(13, 12, 12, 12, C.water[3]); R.e(13, 10, 9, 8, C.water[4]); R.e(11, 13, 3, 2, C.coral[3]); R(14, 12, 2, 2, C.coral[2]); R(4, 24, 18, 6, M[2]); R(4, 24, 18, 1, M[3]); });
add('furn_bubble_lamp', { name: 'Bubble globe lamp', theme: 'ocean', price: 260, comfort: 2, light: true, act: 'lamp', solid: false, spr: 'furn_aquarium_lamp', desc: 'A glowing bubble with a paper fish inside.', shape: 'bottle', c: C.water[3] });

// ---------- register items ----------
export const CATALOG = F;
const items = {};
for (const [id, f] of Object.entries(F)) items[id] = {
  name: f.name, desc: `${f.desc} (${THEMES[f.theme]})`, cat: 'decor', price: f.price, tags: ['furniture', 'theme_' + f.theme].concat(f.light ? ['light'] : [], f.plant ? ['plant'] : [], f.kind === 'wall' ? ['wall'] : [], f.kind === 'rug' ? ['rug'] : [], f.season ? ['season_' + f.season] : []),
  icon: itemIcon(f.shape || 'furniture', { c: f.c || '#a67548' }), useLabel: 'Put in decor box',
  use(game) { const st = game.state.homeDecor; st.box[id] = (st.box[id] || 0) + 1; game.toast(`${f.name} went into the decor box`, 'i_star'); return false; },
};
// wallpapers and floorings
const WP_PRICE = 150, FL_PRICE = 200;
export const STARTER_PAPERS = ['plaster', 'rose', 'wood_panel', 'kitchen_tile', 'bath_tile', 'shoji'];
export const STARTER_FLOORS = ['planks', 'wood_dark', 'planks_pale', 'tatami', 'kitchen', 'bath'];
for (const k of Object.keys(PAPERS)) if (!PAPERS[k].hidden && !STARTER_PAPERS.includes(k)) items['furn_wp_' + k] = {
  name: `Wallpaper: ${PAPERS[k].name.toLowerCase()}`, desc: 'A roll of wallpaper. Use it to add this pattern to the decorate menu.', cat: 'decor', price: WP_PRICE, tags: ['wallpaper'],
  icon: itemIcon('paper', { c: '#86cdb0' }), useLabel: 'Add to styles',
  use(game) { const st = game.state.homeDecor; if (!st.papers.includes(k)) st.papers.push(k); game.toast(`New wallpaper: ${PAPERS[k].name}`, 'i_star'); return false; },
};
for (const k of Object.keys(FLOORS)) if (!STARTER_FLOORS.includes(k)) items['furn_fl_' + k] = {
  name: `Flooring: ${FLOORS[k].name.toLowerCase()}`, desc: 'A bundle of flooring. Use it to add this floor to the decorate menu.', cat: 'decor', price: FL_PRICE, tags: ['flooring'],
  icon: itemIcon('box', { c: '#d3a574' }), useLabel: 'Add to styles',
  use(game) { const st = game.state.homeDecor; if (!st.floors.includes(k)) st.floors.push(k); game.toast(`New floor: ${FLOORS[k].name}`, 'i_star'); return false; },
};
registerMany('item', items);
void pot; void glint;
