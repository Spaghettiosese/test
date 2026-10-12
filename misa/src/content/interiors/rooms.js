// Room rendering for every interior map that sets `interiors: true` in its def:
//  - tall wall faces (two wall rows = a 64 px face: 8 px cap, wallpaper, optional wainscot, 6 px baseboard)
//    painted with a wallpaper pattern chosen per room (home) or per wall tile (`paper` field on the tile def);
//  - door frames on wall openings and a shadowed threshold;
//  - windows (def.windows) whose glass shows the sky for the hour, season and weather (rain streaks, snow);
//  - sun pools on the floor in the day (leaning with the hour, with dust motes) and moon pools at night;
//  - optional decals (def.decals: court lines, chalk marks) baked with the walls.
// Map fields read here: interiors: true, rooms: [{ id, name, x, y, w, h, char }], windows: [{ x, y, w, side, kind, curtain }],
//   paper (default wallpaper), decals: (F, map) => {} painter.
import { register, registerMany, get } from '../../core/registry.js';
import { RAMPS as C } from '../../gfx/palette.js';
import { hash, bayer } from '../../gfx/noise.js';

const T2 = 32;
export const FLOORS = {
  planks: { name: 'Honey planks', tile: 'int_fl_planks' },
  wood_dark: { name: 'Walnut planks', tile: 'int_fl_walnut' },
  planks_pale: { name: 'Birch planks', tile: 'int_fl_birch' },
  tatami: { name: 'Tatami mats', tile: 'int_fl_tatami' },
  kitchen: { name: 'Blue check tiles', tile: 'int_fl_kitchen' },
  kitchen_mint: { name: 'Mint check tiles', tile: 'int_fl_kitchen_mint' },
  kitchen_coral: { name: 'Rose check tiles', tile: 'int_fl_kitchen_coral' },
  kitchen_butter: { name: 'Lemon check tiles', tile: 'int_fl_kitchen_butter' },
  bath: { name: 'Sky mosaic', tile: 'int_fl_bath' },
  bath_lilac: { name: 'Lilac mosaic', tile: 'int_fl_bath_lilac' },
  carpet_coral: { name: 'Rose carpet', tile: 'int_fl_carpet' },
  carpet_sky: { name: 'Sky carpet', tile: 'int_fl_carpet_sky' },
  carpet_mint: { name: 'Mint carpet', tile: 'int_fl_carpet_mint' },
  carpet_lilac: { name: 'Starry carpet', tile: 'int_fl_carpet_lilac' },
  linoleum: { name: 'Mint linoleum', tile: 'int_fl_lino' },
  stone: { name: 'Slate stone', tile: 'int_fl_stone' },
};
registerMany('tile', {
  int_fl_planks: { floor: 'planks' },
  int_fl_walnut: { floor: 'wood_dark' },
  int_fl_birch: { floor: 'planks', tint: 'sand' },
  int_fl_tatami: { floor: 'tatami' },
  int_fl_kitchen: { floor: 'kitchen' },
  int_fl_kitchen_mint: { floor: 'kitchen', tint: 'mint' },
  int_fl_kitchen_coral: { floor: 'kitchen', tint: 'coral' },
  int_fl_kitchen_butter: { floor: 'kitchen', tint: 'butter' },
  int_fl_bath: { floor: 'bath' },
  int_fl_bath_lilac: { floor: 'bath', tint: 'lilac' },
  int_fl_carpet: { floor: 'carpet' },
  int_fl_carpet_sky: { floor: 'carpet', tint: 'sky' },
  int_fl_carpet_mint: { floor: 'carpet', tint: 'mint' },
  int_fl_carpet_lilac: { floor: 'carpet', tint: 'lilac' },
  int_fl_carpet_green: { floor: 'carpet', tint: 'forest' },
  int_fl_carpet_navy: { floor: 'carpet', tint: 'navy' },
  int_fl_lino: { floor: 'linoleum' },
  int_fl_lino_sky: { floor: 'linoleum', tint: 'sky' },
  int_fl_lino_butter: { floor: 'linoleum', tint: 'butter' },
  int_fl_stone: { floor: 'stone' },
  int_fl_gym: { floor: 'gym' },
  int_fl_door: { floor: 'planks', door: true },
  int_fl_roof: { ground: 'paved' },
  // walls: `paper` picks the wallpaper painted on the face
  int_wall: { wall: 'plaster', solid: true },
  int_wall_wood: { wall: 'wood', solid: true, paper: 'wood_panel' },
  int_wall_dark: { wall: 'wood', solid: true, paper: 'wood_dark' },
  int_wall_cafe: { wall: 'brick', solid: true, paper: 'cafe' },
  int_wall_mart: { wall: 'plaster', solid: true, paper: 'mart' },
  int_wall_library: { wall: 'plaster', solid: true, paper: 'library' },
  int_wall_post: { wall: 'plaster', solid: true, paper: 'post' },
  int_wall_clock: { wall: 'wood', solid: true, paper: 'clock' },
  int_wall_stone: { wall: 'stone', solid: true, paper: 'stone' },
  int_wall_school: { wall: 'school', solid: true, paper: 'school' },
  int_wall_gym: { wall: 'school', solid: true, paper: 'gym' },
  int_wall_attic: { wall: 'wood', solid: true, paper: 'attic' },
  int_wall_goro: { wall: 'plaster', solid: true, paper: 'shoji' },
  int_wall_kitchen: { wall: 'plaster', solid: true, paper: 'kitchen_tile' },
  int_wall_bath: { wall: 'plaster', solid: true, paper: 'bath_tile' },
  int_rail: { wall: 'stone', solid: true, paper: 'stone' },
});

// ---------- wallpapers ----------
// paint(F, x, y, w, h) fills the paper area (screen px, map space). wains: wood ramp for a wainscot, or null.
const dots = (F, x, y, w, h, c, step, s) => { for (let j = y + 3; j < y + h - 1; j += step) for (let i = x + ((Math.floor(j / step) % 2) * (step >> 1)); i < x + w; i += step) if (hash(i, j, s) > 0.08) F(i, j, 2, 2, c); };
export const PAPERS = {
  plaster: { name: 'Cream plaster', paint(F, x, y, w, h) { F(x, y, w, h, C.plaster[3]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const v = hash(i, j, 81); if (v > 0.975) F(i, j, 1, 1, C.plaster[4]); else if (v < 0.02) F(i, j, 1, 1, C.plaster[2]); } } },
  rose: { name: 'Rose plaster', wains: 'wood', paint(F, x, y, w, h) { F(x, y, w, h, C.coral[4]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash(i, j, 82) > 0.97) F(i, j, 1, 1, C.coral[3]); } },
  stripes_mint: { name: 'Mint stripes', paint(F, x, y, w, h) { F(x, y, w, h, C.mint[4]); for (let i = x - (x % 8); i < x + w; i += 8) if (i >= x) { F(i, y, 3, h, C.mint[3]); F(i + 3, y, 1, h, C.mint[2]); } } },
  stripes_butter: { name: 'Lemon stripes', wains: 'wood', paint(F, x, y, w, h) { F(x, y, w, h, C.butter[4]); for (let i = x - (x % 10); i < x + w; i += 10) if (i >= x) { F(i, y, 4, h, C.butter[3]); F(i + 5, y, 1, h, C.butter[3]); } } },
  stripes_lilac: { name: 'Lilac pinstripes', paint(F, x, y, w, h) { F(x, y, w, h, C.lilac[4]); for (let i = x - (x % 6); i < x + w; i += 6) if (i >= x) F(i, y, 1, h, C.lilac[3]); } },
  polka: { name: 'Coral polka dots', paint(F, x, y, w, h) { F(x, y, w, h, C.paper[3]); dots(F, x, y, w, h, C.coral[3], 8, 83); } },
  sakura: { name: 'Sakura print', paint(F, x, y, w, h) { F(x, y, w, h, C.sakura[4]); for (let j = y + 2; j < y + h - 3; j += 11) for (let i = x + ((j * 7) % 13); i < x + w - 3; i += 13) { F(i + 1, j, 1, 1, C.sakura[2]); F(i, j + 1, 3, 1, C.sakura[2]); F(i + 1, j + 2, 1, 1, C.sakura[2]); F(i + 1, j + 1, 1, 1, C.butter[2]); } } },
  leaves: { name: 'Fern leaves', paint(F, x, y, w, h) { F(x, y, w, h, C.forest[4]); for (let j = y + 2; j < y + h - 4; j += 10) for (let i = x + ((j * 5) % 12); i < x + w - 4; i += 12) { F(i + 2, j, 1, 5, C.forest[2]); F(i, j + 1, 2, 1, C.forest[3]); F(i + 3, j + 2, 2, 1, C.forest[3]); F(i, j + 3, 2, 1, C.forest[3]); } } },
  waves: { name: 'Ocean waves', wains: 'woodPale', paint(F, x, y, w, h) { F(x, y, w, h, C.sky[3]); for (let j = y + 4; j < y + h; j += 7) for (let i = x; i < x + w; i++) { const k = (i + (Math.floor(j / 7) % 2) * 4) % 8; F(i, j + (k < 2 ? 0 : k < 4 ? 1 : k < 6 ? 2 : 1), 1, 1, C.sky[4]); } } },
  stars: { name: 'Night sky stars', paint(F, x, y, w, h) { F(x, y, w, h, C.navy[1]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const v = hash(i, j, 84); if (v > 0.992) { F(i, j, 1, 1, C.butter[3]); } else if (v > 0.985) F(i, j, 1, 1, C.lilac[3]); } for (let j = y + 6; j < y + h - 6; j += 17) for (let i = x + ((j * 3) % 19); i < x + w - 4; i += 19) { F(i + 2, j, 1, 5, C.butter[3]); F(i, j + 2, 5, 1, C.butter[3]); F(i + 2, j + 2, 1, 1, '#ffffff'); } } },
  gingham: { name: 'Butter gingham', paint(F, x, y, w, h) { F(x, y, w, h, C.paper[4]); for (let i = x - (x % 8); i < x + w; i += 8) if (i >= x) F(i, y, 4, h, C.butter[4]); for (let j = y; j < y + h; j += 8) F(x, j, w, 4, C.butter[4]); for (let j = y; j < y + h; j += 8) for (let i = x - (x % 8); i < x + w; i += 8) if (i >= x) F(i, j, 4, 4, C.butter[3]); } },
  diamond: { name: 'Retro diamonds', paint(F, x, y, w, h) { F(x, y, w, h, C.paper[3]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const a = (i + j) % 12, b = (i - j + 1200) % 12; if (a === 0 || b === 0) F(i, j, 1, 1, C.coral[3]); if ((a === 6 && b === 6)) F(i, j, 1, 1, C.butter[2]); } } },
  wood_panel: { name: 'Pine boards', paint(F, x, y, w, h) { for (let i = x - (x % 8); i < x + w; i += 8) { const s = hash(i, 3, 85) > 0.6 ? 3 : 4; F(Math.max(x, i), y, 8 - Math.max(0, x - i), h, C.wood[s]); if (i >= x) F(i, y, 1, h, C.wood[2]); } for (let j = y; j < y + h; j += 3) for (let i = x; i < x + w; i += 5) if (hash(i, j, 86) > 0.85) F(i, j, 2, 1, C.wood[2]); } },
  wood_dark: { name: 'Walnut boards', paint(F, x, y, w, h) { for (let i = x - (x % 8); i < x + w; i += 8) { F(Math.max(x, i), y, 8 - Math.max(0, x - i), h, hash(i, 4, 87) > 0.5 ? C.woodDark[3] : C.woodDark[2]); if (i >= x) F(i, y, 1, h, C.woodDark[1]); } } },
  kitchen_tile: { name: 'White kitchen tiles', paint(F, x, y, w, h) { F(x, y, w, h, C.paper[4]); for (let j = y + h; j > y; j -= 8) F(x, j - 1, w, 1, C.paper[1]); for (let j = y + h; j > y; j -= 8) for (let i = x - (x % 8) + ((Math.floor((y + h - j) / 8) % 2) * 4); i < x + w; i += 8) if (i >= x) F(i, Math.max(y, j - 8), 1, 7, C.paper[1]); } },
  bath_tile: { name: 'Sky bath tiles', paint(F, x, y, w, h) { F(x, y, w, h, C.sky[4]); for (let j = y + h; j > y; j -= 6) F(x, j - 1, w, 1, C.sky[3]); for (let i = x - (x % 6); i < x + w; i += 6) if (i >= x) F(i, y, 1, h, C.sky[3]); for (let j = y; j < y + h; j += 6) for (let i = x - (x % 6); i < x + w; i += 6) if (i >= x && hash(i, j, 88) > 0.86) F(i + 1, j, 5, 5, C.sky[3]); } },
  shoji: { name: 'Shoji paper', paint(F, x, y, w, h) { F(x, y, w, h, C.paper[4]); for (let i = x - (x % 10); i < x + w; i += 10) if (i >= x) F(i, y, 1, h, C.wood[3]); for (let j = y + 4; j < y + h; j += 9) F(x, j, w, 1, C.wood[3]); } },
  clouds: { name: 'Fluffy clouds', paint(F, x, y, w, h) { F(x, y, w, h, C.sky[3]); for (let j = y + 4; j < y + h - 6; j += 14) for (let i = x + ((j * 11) % 23); i < x + w - 12; i += 23) { F(i + 2, j, 6, 1, '#ffffff'); F(i, j + 1, 12, 3, '#ffffff'); F(i + 1, j + 4, 10, 1, C.sky[4]); } } },
  // map-specific papers (not offered in the decorate menu)
  cafe: { hidden: true, wains: 'woodDark', paint(F, x, y, w, h) { F(x, y, w, h, C.brick[3]); for (let r = 0; r * 6 < h; r++) { F(x, y + r * 6 + 5, w, 1, C.brick[1]); for (let i = x - (x % 14) + ((r % 2) * 7); i < x + w; i += 14) if (i >= x) F(i, y + r * 6, 1, 5, C.brick[1]); for (let i = x; i < x + w; i += 3) if (hash(i, r, 89) > 0.8) F(i, y + r * 6 + 1, 2, 1, C.brick[4]); } } },
  mart: { hidden: true, paint(F, x, y, w, h) { F(x, y, w, h, C.paper[4]); F(x, y + h - 10, w, 4, C.mint[2]); F(x, y + h - 6, w, 1, C.mint[1]); F(x, y + 4, w, 1, C.butter[3]); } },
  library: { hidden: true, wains: 'woodDark', paint(F, x, y, w, h) { F(x, y, w, h, C.forest[2]); for (let i = x - (x % 12); i < x + w; i += 12) if (i >= x) F(i, y, 1, h, C.forest[1]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash(i, j, 90) > 0.985) F(i, j, 1, 1, C.forest[3]); } },
  post: { hidden: true, wains: 'wood', paint(F, x, y, w, h) { F(x, y, w, h, C.sky[4]); F(x, y + 3, w, 2, C.coral[2]); F(x, y + 5, w, 1, C.paper[4]); F(x, y + 6, w, 1, C.sky[1]); } },
  clock: { hidden: true, paint(F, x, y, w, h) { F(x, y, w, h, C.butter[4]); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash(i, j, 91) > 0.97) F(i, j, 1, 1, C.paper[2]); }, wains: 'woodDark' },
  stone: { hidden: true, paint(F, x, y, w, h) { for (let r = 0; r * 8 < h; r++) { F(x, y + r * 8, w, 8, C.stone[3]); for (let i = x - (x % 16) + ((r % 2) * 8); i < x + w; i += 16) { if (i >= x) F(i, y + r * 8, 1, 8, C.stone[1]); if (hash(i, r, 92) > 0.5) F(Math.max(x, i + 1), y + r * 8 + 1, 6, 1, C.stone[4]); } F(x, y + r * 8 + 7, w, 1, C.stone[2]); } } },
  school: { hidden: true, paint(F, x, y, w, h) { F(x, y, w, h, C.paper[3]); F(x, y + h - 14, w, 14, C.mint[3]); F(x, y + h - 15, w, 1, C.mint[2]); F(x, y + h - 14, w, 1, C.mint[4]); for (let j = y; j < y + h - 15; j++) for (let i = x; i < x + w; i++) if (hash(i, j, 93) > 0.985) F(i, j, 1, 1, C.paper[4]); } },
  gym: { hidden: true, paint(F, x, y, w, h) { F(x, y, w, h, C.paper[2]); F(x, y + h - 20, w, 20, C.sky[2]); F(x, y + h - 20, w, 1, C.sky[3]); for (let i = x - (x % 32); i < x + w; i += 32) if (i >= x) F(i, y + h - 20, 1, 20, C.sky[1]); } },
  attic: { hidden: true, paint(F, x, y, w, h) { for (let i = x - (x % 6); i < x + w; i += 6) { F(Math.max(x, i), y, 6 - Math.max(0, x - i), h, hash(i, 5, 94) > 0.5 ? C.wood[2] : C.wood[1]); if (i >= x) F(i, y, 1, h, C.woodDark[2]); } F(x, y + 10, w, 3, C.woodDark[2]); F(x, y + 10, w, 1, C.woodDark[3]); } },
};
export const PAPER_KEYS = Object.keys(PAPERS).filter((k) => !PAPERS[k].hidden);
const WAINS = { wood: C.wood, woodDark: C.woodDark, woodPale: C.paper };

// ---------- per-map style resolution (home rooms can be restyled; see decorate.js) ----------
let styleOf = () => null; // (mapId, roomId) -> { paper?, floor? }
export const setStyleResolver = (fn) => { styleOf = fn; };
export function roomAt(def, tx, ty) { return (def.rooms || []).find((r) => tx >= r.x && ty >= r.y && tx < r.x + r.w && ty < r.y + r.h) || null; }

// ---------- static wall layer (cached per map + style signature) ----------
let cache = { key: null, canvas: null };
function wallKey(world, game) {
  const def = world.map.def;
  return world.map.id + '|' + (def.rooms || []).map((r) => { const s = styleOf(world.map.id, r.id) || {}; return s.paper || ''; }).join(',') + '|' + world.game.season + '|' + (def.upKey ? def.upKey(game) : '');
}
const isWall = (m, x, y) => { const t = x < 0 || y < 0 || x >= m.w || y >= m.h ? null : m.tiles[y][x]; return !!(t && t.wall); };
const isFloor = (m, x, y) => { const t = x < 0 || y < 0 || x >= m.w || y >= m.h ? null : m.tiles[y][x]; return !!(t && !t.solid && !t.wall); };
export function faceAt(m, tx, ty) { return isWall(m, tx, ty) && isFloor(m, tx, ty + 1) && (isWall(m, tx - 1, ty) || isWall(m, tx + 1, ty)); }

function buildWalls(world) {
  const m = world.map, def = m.def, W = m.w * T2, H = m.h * T2;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const F = (x, y, w, h, col) => { if (w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const WD = C.woodDark;
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    if (!faceAt(m, tx, ty)) continue;
    const tall = isWall(m, tx, ty - 1), top = (tall ? ty - 1 : ty) * T2, bot = (ty + 1) * T2, x = tx * T2;
    const room = roomAt(def, tx, ty + 1), st = (room && styleOf(m.id, room.id)) || {};
    const pk = st.paper || (room && room.paper) || m.tiles[ty][tx].paper || def.paper || 'plaster', P = PAPERS[pk] || PAPERS.plaster;
    const cap = tall ? 8 : 6, base = tall ? 6 : 4;
    F(x, top, T2, cap, WD[1]); F(x, top, T2, 1, WD[2]); F(x, top + cap - 1, T2, 1, WD[0]);
    const py = top + cap, ph = bot - base - py;
    P.paint(F, x, py, T2, ph);
    F(x, py, T2, 1, 'rgba(42,26,64,0.28)'); F(x, py + 1, T2, 1, 'rgba(42,26,64,0.12)');
    if (P.wains && tall) { const Wr = WAINS[P.wains]; const wy = bot - base - 18; F(x, wy, T2, 18, Wr[3]); F(x, wy, T2, 2, Wr[4]); F(x, wy + 2, T2, 1, Wr[1]); for (let i = x + 3; i < x + T2; i += 16) { F(i, wy + 5, 11, 10, Wr[2]); F(i, wy + 5, 11, 1, Wr[1]); F(i, wy + 14, 11, 1, Wr[4]); } }
    F(x, bot - base, T2, base, WD[2]); F(x, bot - base, T2, 1, WD[3]); F(x, bot - 2, T2, 2, WD[1]);
    // corners: the left neighbour casts a soft shadow, the right edge catches light
    if (!faceAt(m, tx - 1, ty)) { const open = isFloor(m, tx - 1, ty) || isFloor(m, tx - 1, ty + 1) && !isWall(m, tx - 1, ty); F(x, py, 3, ph, 'rgba(42,26,64,0.18)'); F(x, py, 1, ph, 'rgba(42,26,64,0.2)'); if (open) { F(x, top, 3, bot - top, WD[2]); F(x + 3, top, 1, bot - top, WD[3]); } }
    if (!faceAt(m, tx + 1, ty)) { const open = isFloor(m, tx + 1, ty) || isFloor(m, tx + 1, ty + 1) && !isWall(m, tx + 1, ty); F(x + T2 - 1, py, 1, ph, 'rgba(255,250,240,0.25)'); if (open) { F(x + T2 - 3, top, 3, bot - top, WD[1]); F(x + T2 - 4, top, 1, bot - top, WD[3]); } }
  }
  // openings: shade the passage floor under the lintel and lay a threshold strip
  for (let ty = 1; ty < m.h - 1; ty++) for (let tx = 0; tx < m.w; tx++) {
    if (!isFloor(m, tx, ty) || !isWall(m, tx - 1, ty) || !isWall(m, tx + 1, ty)) continue;
    if (isFloor(m, tx - 1, ty) || isFloor(m, tx + 1, ty)) continue;
    const x = tx * T2, y = ty * T2;
    F(x, y, T2, 10, 'rgba(42,26,64,0.22)');
    if (isFloor(m, tx, ty + 1) && !isWall(m, tx - 1, ty + 1)) { F(x, y + T2 - 4, T2, 4, WD[2]); F(x, y + T2 - 4, T2, 1, WD[3]); F(x, y + T2 - 1, T2, 1, WD[1]); }
  }
  if (def.decals) def.decals(F, m, g);
  return c;
}

// ---------- windows ----------
const SKY = { day: ['#7fc8f0', '#a8dcf5', '#d4f0fa'], dawn: ['#6a5a9a', '#f4a08a', '#ffd8a8'], sunset: ['#4a3a7a', '#e0707a', '#ffb070'], night: ['#0e0c24', '#1b1b3a', '#2e2a5a'] };
function skyFor(game) {
  const h = (game.minutes / 60) % 24, wet = ['rain', 'storm'].includes(game.weather), grey = wet || game.weather === 'cloudy' || game.weather === 'snow';
  let s = h < 5 || h >= 20 ? SKY.night : h < 7 ? SKY.dawn : h >= 17.5 ? SKY.sunset : SKY.day;
  if (grey && s === SKY.day) s = game.weather === 'snow' ? ['#a8b4c8', '#c8d0dc', '#e4e8f0'] : wet ? ['#6a7890', '#8a96a8', '#a8b0bc'] : ['#9ab0c8', '#b8c8d8', '#d8e0e8'];
  return s;
}
const TREE = { spring: [C.sakura[2], C.sakura[3]], summer: [C.leaf[2], C.leaf[3]], autumn: [C.leafAutumn[2], C.leafAutumn[3]], winter: [C.snow[3], '#ffffff'] };
export function drawWindowGlass(g, game, x, y, w, h, seed = 0) {
  const sky = skyFor(game), t = game.clock;
  const F = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(a, b, c, d); };
  const b1 = Math.floor(h * 0.35), b2 = Math.floor(h * 0.7);
  F(x, y, w, b1, sky[0]); F(x, y + b1, w, b2 - b1, sky[1]); F(x, y + b2, w, h - b2, sky[2]);
  for (let i = 0; i < w; i += 2) { F(x + i + ((b1) % 2), y + b1 - 1, 1, 1, sky[1]); F(x + i + (b2 % 2), y + b2 - 1, 1, 1, sky[2]); }
  const night = sky === SKY.night;
  if (night) for (let i = 0; i < 4; i++) { const sx = Math.floor(hash(seed, i, 7) * w), sy = Math.floor(hash(seed, i, 8) * h * 0.6); F(x + sx, y + sy, 1, 1, (Math.floor(t * 2 + i) % 5) ? '#fffaf0' : '#8a7fb0'); }
  if (night && (seed % 3) === 0) { F(x + w - 8, y + 3, 4, 4, '#fff1d6'); F(x + w - 7, y + 3, 3, 1, '#fffaf0'); }
  if (!night && game.weather === 'sunny' || game.weather === 'windy') { const cx = Math.floor(((t * 2 + seed * 13) % (w + 16)) - 10); F(x + cx, y + 4, 8, 2, '#ffffff'); F(x + cx + 2, y + 3, 4, 1, '#ffffff'); }
  // a tree top outside, season-tinted
  const tr = TREE[game.season] || TREE.summer;
  for (let i = 0; i < w; i++) { const hh = 3 + Math.floor(3 * Math.abs(Math.sin((i + seed * 5) * 0.35))); F(x + i, y + h - hh, 1, hh, night ? '#1a2030' : tr[i % 5 === 0 ? 1 : 0]); }
  if (['rain', 'storm'].includes(game.weather)) for (let i = 0; i < Math.ceil(w / 4); i++) { const rx = Math.floor(hash(seed, i, 3) * w), ry = Math.floor((hash(seed, i, 4) * h + t * 60) % h); for (let k = 0; k < 3; k++) if (ry + k < h) F(x + rx, y + ry + k, 1, 1, 'rgba(225,240,255,0.7)'); }
  if (game.weather === 'snow') for (let i = 0; i < Math.ceil(w / 5); i++) { const rx = Math.floor((hash(seed, i, 5) * w + Math.sin(t + i) * 2 + w) % w), ry = Math.floor((hash(seed, i, 6) * h + t * 12) % h); F(x + rx, y + ry, 1, 1, '#ffffff'); }
  if (game.season === 'spring' && !night) { const px = Math.floor((hash(seed, 9, 1) * w + t * 8) % w), py = Math.floor((t * 10 + seed * 7) % h); F(x + px, y + py, 2, 1, C.sakura[3]); }
  // glass reflections
  F(x + 2, y + 2, 2, 1, 'rgba(255,255,255,0.7)'); F(x + 2, y + 3, 1, 1, 'rgba(255,255,255,0.7)'); F(x + 5, y + 5, 1, 1, 'rgba(255,255,255,0.5)');
}
// Window frame on a wall face. win = { x, y, w(tiles), kind: 'square'|'tall'|'round'|'high'|'wide', curtain: ramp }
function windowRect(win, m) {
  const tw = win.w || 1, x = win.x * T2, faceBot = (win.y + 1) * T2, tall = isWall(m, win.x, win.y - 1);
  const top = (tall ? win.y - 1 : win.y) * T2;
  const kind = win.kind || 'square';
  if (win.side) return null;
  if (kind === 'high') return { x: x + 4, y: top + 10, w: tw * T2 - 8, h: 14 };
  if (kind === 'tall') return { x: x + (tw * T2 - (tw * 32 - 8)) / 2, y: top + 12, w: tw * 32 - 8, h: 38 };
  if (kind === 'round') return { x: x + tw * 16 - 11, y: top + 14, w: 22, h: 22, round: true };
  const ww = tw === 1 ? 26 : tw * 32 - 6;
  return { x: x + Math.floor((tw * T2 - ww) / 2), y: (tall ? top + 14 : top + 6), w: ww, h: tall ? 26 : 18 };
}
function drawWindow(g, game, win, m, ox, oy, i) {
  const F = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(a - ox, b - oy, c, d); };
  if (win.side) { // a window in a side wall seen from above: a glass strip along the wall cap
    const x = win.x * T2 + (win.side === 'left' ? 18 : 6), y = win.y * T2 + 4, h = (win.h || 1) * T2 - 8;
    F(x - 2, y - 2, 12, h + 4, C.woodDark[1]); F(x - 1, y - 1, 10, h + 2, C.wood[2]);
    g.save(); g.translate(-ox, -oy); drawWindowGlass(g, game, x, y, 8, h, i + 3); g.restore();
    for (let k = y + 14; k < y + h - 4; k += 16) F(x, k, 8, 2, C.wood[2]);
    F(win.side === 'left' ? x + 8 : x - 3, y, 3, h, C.paper[4]); F(win.side === 'left' ? x + 10 : x - 3, y, 1, h, C.paper[2]);
    return;
  }
  const r = windowRect(win, m);
  const { x, y, w, h } = r, cur = win.curtain ? C[win.curtain] : null;
  if (r.round) {
    for (let j = -12; j <= 12; j++) { const ww = Math.floor(Math.sqrt(144 - j * j)); F(x + 11 - ww, y + 11 + j, ww * 2 + 1, 1, C.woodDark[1]); }
    for (let j = -10; j <= 10; j++) { const ww = Math.floor(Math.sqrt(100 - j * j)); F(x + 11 - ww, y + 11 + j, ww * 2 + 1, 1, C.wood[2]); }
    g.save(); g.beginPath(); for (let j = -9; j <= 9; j++) { const ww = Math.floor(Math.sqrt(81 - j * j)); g.rect(x + 11 - ww - ox, y + 11 + j - oy, ww * 2 + 1, 1); } g.clip(); g.translate(-ox, -oy); drawWindowGlass(g, game, x + 2, y + 2, 19, 19, i); g.restore();
    F(x + 10, y + 2, 2, 19, C.wood[2]); F(x + 2, y + 10, 19, 2, C.wood[2]); F(x + 10, y + 2, 1, 19, C.wood[3]);
    return;
  }
  F(x - 2, y - 2, w + 4, h + 4, C.woodDark[1]); F(x - 1, y - 1, w + 2, h + 2, C.wood[3]); F(x - 1, y - 1, w + 2, 1, C.wood[4]);
  g.save(); g.translate(-ox, -oy); drawWindowGlass(g, game, x, y, w, h, i); g.restore();
  // mullions
  const panes = Math.max(1, Math.round(w / 28));
  for (let p = 1; p < panes * 2; p++) F(x + Math.round((w * p) / (panes * 2)) - 1, y, 2, h, C.wood[2]);
  if (win.kind !== 'high') F(x, y + Math.floor(h / 2) - 1, w, 2, C.wood[2]);
  if (win.kind !== 'high') { F(x - 3, y + h + 2, w + 6, 3, C.paper[3]); F(x - 3, y + h + 2, w + 6, 1, C.paper[4]); F(x - 3, y + h + 4, w + 6, 1, C.paper[1]); }
  if (cur) { // tied-back curtains
    F(x - 4, y - 4, 6, h + 2, cur[2]); F(x - 4, y - 4, 2, h + 2, cur[3]); F(x + 1, y - 4, 1, h + 2, cur[1]); F(x - 3, y + Math.floor(h * 0.6), 5, 2, cur[1]);
    F(x + w - 2, y - 4, 6, h + 2, cur[2]); F(x + w - 2, y - 4, 2, h + 2, cur[3]); F(x + w + 3, y - 4, 1, h + 2, cur[1]); F(x + w - 2, y + Math.floor(h * 0.6), 5, 2, cur[1]);
    F(x - 5, y - 6, w + 10, 2, C.woodDark[2]); F(x - 5, y - 6, w + 10, 1, C.woodDark[3]);
  }
}

// ---------- sun and moon pools ----------
function sunStrength(game) {
  const h = (game.minutes / 60) % 24;
  if (h < 6.5 || h > 18.3) return 0;
  const wx = { sunny: 1, windy: 0.9, cloudy: 0.35, snow: 0.45, rain: 0, storm: 0 }[game.weather] ?? 0.8;
  const ramp = Math.min(1, (h - 6.5) / 1.2, (18.3 - h) / 1.2);
  return wx * ramp;
}
function poolShape(win, m, game) {
  const h = (game.minutes / 60) % 24, lean = Math.max(-1.1, Math.min(1.1, (12.5 - h) / 4.5));
  if (win.side) {
    const dir = win.side === 'left' ? 1 : -1, x0 = win.x * T2 + (dir > 0 ? T2 : 0), y0 = win.y * T2 + 6, len = 52 + Math.abs(lean) * 10;
    return { side: true, dir, x0, y0, len, w: (win.h || 1) * T2 - 12, lean: 0.45 };
  }
  const r = windowRect(win, m), bot = (win.y + 1) * T2;
  const len = win.kind === 'high' ? 150 : (win.kind === 'tall' ? 70 : 54) + (game.season === 'winter' ? 12 : 0);
  return { x0: r.x, y0: bot, w: r.w, len, lean: win.kind === 'high' ? lean * 0.9 + 0.5 : lean * 0.55 };
}
function drawPool(g, world, win, col, a, dust) {
  const m = world.map, game = world.game, P = poolShape(win, m, game), ox = Math.round(world.cam.x), oy = Math.round(world.cam.y);
  g.save(); g.globalCompositeOperation = 'lighter';
  if (P.side) {
    for (let k = 0; k < P.len; k++) {
      const fade = k > P.len * 0.7 ? 1 - (k - P.len * 0.7) / (P.len * 0.3) : 1;
      const x = P.x0 + P.dir * k, y = P.y0 + Math.round(k * P.lean);
      g.fillStyle = col(a * fade);
      for (let j = 0; j < P.w; j += 1) { if (fade < 1 && bayer(x, y + j) > fade) continue; if (j % 15 === 14) continue; g.fillRect(x - ox, y + j - oy, 1, 1); }
    }
  } else {
    for (let k = 0; k < P.len; k++) {
      const fade = k > P.len * 0.6 ? 1 - (k - P.len * 0.6) / (P.len * 0.4) : 1, x = Math.round(P.x0 + k * P.lean), y = P.y0 + k;
      g.fillStyle = col(a * fade);
      if (fade >= 1) { const half = Math.round(P.w / 2); g.fillRect(x - ox, y - oy, half - 1, 1); g.fillRect(x + half + 1 - ox, y - oy, P.w - half - 1, 1); }
      else for (let i = 0; i < P.w; i += 1) if (bayer(x + i, y) < fade) g.fillRect(x + i - ox, y - oy, 1, 1);
    }
  }
  g.restore();
  if (dust) {
    g.fillStyle = 'rgba(255,250,235,0.75)';
    for (let i = 0; i < 4; i++) {
      const ph = (game.clock * 0.08 + hash(i, win.x, 3)) % 1, k = Math.floor((P.side ? P.len : P.len * 0.7) * hash(i, win.y, 4)), lift = Math.floor(ph * 18);
      const x = P.side ? P.x0 + P.dir * k : Math.round(P.x0 + k * P.lean + hash(i, 1, 5) * P.w), y = (P.side ? P.y0 + hash(i, 2, 6) * P.w : P.y0 + k) - lift;
      if (Math.floor(game.clock * 3 + i) % 4) g.fillRect(Math.round(x - ox), Math.round(y - oy), 1, 1);
    }
  }
}
const moonUp = (game) => { const h = (game.minutes / 60) % 24; return (h >= 20 || h < 5) && !['rain', 'storm', 'cloudy'].includes(game.weather); };

register('worldLayer', 'interiors_rooms', {
  below(g, world, game) {
    const def = world.map.def;
    if (!def.interiors) return;
    const key = wallKey(world, game);
    if (cache.key !== key || cache.map !== world.map) cache = { key, map: world.map, canvas: buildWalls(world) };
    const ox = Math.round(world.cam.x), oy = Math.round(world.cam.y);
    g.drawImage(cache.canvas, -ox, -oy);
    (def.windows || []).forEach((w, i) => { if (!w.when || game.check(w.when)) drawWindow(g, game, w, world.map, ox, oy, i); });
    if (def.liveDecor) def.liveDecor(g, world, game, ox, oy);
  },
  sprites(world, game) {
    const def = world.map.def;
    if (!def.interiors || !def.windows || def.outdoor) return [];
    const s = sunStrength(game);
    if (s <= 0.02) return [];
    return [{ y: -1e9, draw: (g) => (def.windows || []).forEach((w) => { if (!w.when || game.check(w.when)) drawPool(g, world, w, (a) => `rgba(255,236,190,${(a * 0.2).toFixed(3)})`, s, true); }) }];
  },
  overlay(g, world, game) {
    const def = world.map.def;
    if (!def.interiors || !def.windows || def.outdoor || !moonUp(game)) return;
    (def.windows || []).forEach((w) => { if ((!w.when || game.check(w.when)) && w.kind !== 'high') drawPool(g, world, w, (a) => `rgba(154,176,255,${(a * 0.16).toFixed(3)})`, 1, false); });
  },
});
export const invalidateRooms = () => { cache = { key: null, canvas: null }; };
export { get };
