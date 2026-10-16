// Community Hall art: the hall facade (closed and bright), hall sprites (kodama-like leaf spirits), dust and cobweb
// overlays, bundle boards, and the restored furnishings of every room. All hd props (1 art px = 1 screen px) built with
// the town toolkit `spr()`, which clips drawing to the content box so outlines always have room.
import { spr, RAMPS as C, hash, line, signText, signW } from '../town/lib.js';

const paperHi = C.paper[4], inkc = C.ink[1];

// ---------------------------------------------------------------- hall sprites (kodama-like leaf spirits)
// Four tints (leaf, mint, sun, rose) x two bobbing frames. 22x26: a pale round head, little face, leaf hat.
export const KODAMA_TINTS = { leaf: C.forest, mint: C.mint, sun: C.butter, rose: C.sakura };
export const kodama = (tint, frame) => `ch_kodama_${tint}${frame}`;
for (const [tint, r] of Object.entries(KODAMA_TINTS)) {
  for (const f of [0, 1]) {
    spr(kodama(tint, f), 22, 26, (R) => {
      const y = f; // second frame bobs one pixel and tilts the hat
      R(7, 22, 3, 3, C.paper[2]); R(12, 22, 3, 3, C.paper[2]); // feet
      R.e(11, 14 + y, 8, 9, C.paper[3]); R.e(9, 12 + y, 5, 6, paperHi); R(15, 17 + y, 3, 4, C.paper[2]); // head, light from top-left
      R.t([11, 0 + y], [4, 8 + y], [18, 8 + y], r[2]); R.t([11, 1 + y], [6, 7 + y], [11, 7 + y], r[3]); R(11, 3 + y, 1, 5, r[1]); // leaf hat with a vein
      R(6, 8 + y, 11, 1, r[1]);
      R(7, 12 + y, 2, 3, inkc); R(13, 12 + y, 2, 3, inkc); R(7, 12 + y, 1, 1, '#ffffff'); R(13, 12 + y, 1, 1, '#ffffff'); // eyes with catchlights
      R(10, 17 + y, 2, 1, C.coral[1]); R(5, 16 + y, 2, 1, C.coral[3]); R(15, 16 + y, 2, 1, C.coral[3]); // mouth and cheeks
      if (f) R(18, 5, 2, 2, r[3]); // a falling spark of leaf-light
    }, {});
  }
}

// ---------------------------------------------------------------- dust and cobwebs (flat overlays on the floor)
// Sparse specks, soft smudges and corner cobwebs; opaque colours so the floor shows between them.
export function dust(name, tw, th, seed) {
  spr(name, tw * 32, th * 32, (R) => {
    const W = tw * 32, H = th * 32;
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
      const h = hash(x, y, seed);
      if (h < 0.13) R(x, y, 2 + (h > 0.08 ? 1 : 0), 1 + (h > 0.1 ? 1 : 0), h < 0.05 ? C.stone[3] : C.plaster[1]);
      else if (h > 0.985) R(x - 3, y, 7, 2, C.plaster[1]); // longer drifts
    }
    for (let k = 0; k < tw * th; k++) { // paw-sized smudges
      const sx = Math.floor(hash(k, 3, seed) * (W - 14)), sy = Math.floor(hash(k, 9, seed) * (H - 8));
      R.e(sx + 6, sy + 3, 6, 2, C.paper[1]); R(sx + 4, sy + 3, 5, 1, C.plaster[2]);
    }
    // cobwebs in the four corners
    for (const [ox, oy, dx, dy] of [[0, 0, 1, 1], [W - 1, 0, -1, 1], [0, H - 1, 1, -1], [W - 1, H - 1, -1, -1]]) {
      for (let a = 0; a < 4; a++) line(R, ox, oy, ox + dx * (14 + a * 4), oy + dy * (4 + a * 5), C.stone[4]);
      for (const r of [6, 11]) line(R, ox + dx * r, oy + dy * 2, ox + dx * 2, oy + dy * r, C.stone[4]);
    }
  }, { outline: false });
  return name;
}
dust('ch_dust_5x5', 5, 5, 11); dust('ch_dust_6x5', 6, 5, 23); dust('ch_dust_7x5', 7, 5, 37); dust('ch_dust_lobby', 22, 3, 51);

// ---------------------------------------------------------------- facade
function facade(name, open) {
  spr(name, 192, 112, (R) => {
    const P = C.plaster;
    R(0, 34, 192, 78, open ? P[3] : P[1]); R(0, 34, 192, 3, open ? P[4] : P[2]); R(0, 94, 192, 18, open ? C.wood[2] : C.woodDark[2]); R(0, 94, 192, 2, open ? C.wood[3] : C.woodDark[3]);
    for (let x = 8; x < 192; x += 24) R(x, 36, 1, 58, open ? P[2] : P[0]); // board seams
    // roof: wide slate eaves with a ridge
    R.t([96, 0], [0, 36], [192, 36], open ? C.roofTeal[2] : C.roofSlate[1]);
    for (let y = 6; y < 36; y += 5) R(Math.max(0, 96 - (y + 2) * 2.6), y, Math.min(192, (y + 2) * 5.2), 1, open ? C.roofTeal[1] : C.roofSlate[0]);
    R(0, 34, 192, 3, open ? C.roofTeal[3] : C.roofSlate[2]);
    R(92, 0, 8, 4, open ? C.butter[2] : C.stone[2]);
    // door (tile 2 of the facade), arched
    R(64, 60, 32, 52, C.woodDark[0]); R(66, 62, 28, 50, open ? C.wood[1] : C.woodDark[2]); R(66, 62, 14, 50, open ? C.wood[2] : C.woodDark[3]); R(79, 62, 2, 50, C.woodDark[1]);
    R.e(80, 60, 15, 4, C.woodDark[0]); R(88, 88, 3, 3, open ? C.butter[3] : C.stone[3]);
    if (open) { R(70, 70, 8, 38, C.butter[3]); R(82, 70, 8, 38, C.butter[2]); R(68, 108, 24, 4, C.butter[4]); } // warm light spilling out
    else { line(R, 66, 66, 94, 108, C.wood[1], 2); line(R, 94, 66, 66, 108, C.wood[1], 2); R(68, 82, 24, 6, C.wood[2]); R(68, 82, 24, 1, C.wood[3]); } // boarded up
    // windows
    for (const wx of [10, 38, 114, 142]) {
      R(wx, 46, 28, 36, C.woodDark[1]); R(wx + 2, 48, 24, 32, open ? C.butter[3] : C.charcoal[1]);
      if (open) { R(wx + 2, 48, 24, 8, C.butter[4]); R(wx + 2, 48, 6, 32, C.coral[3]); R(wx + 20, 48, 6, 32, C.coral[3]); R(wx + 13, 48, 2, 32, C.woodDark[1]); R(wx + 2, 63, 24, 2, C.woodDark[1]); }
      else { R(wx + 2, 52, 24, 5, C.wood[1]); R(wx + 2, 66, 24, 5, C.wood[1]); R(wx + 2, 52, 24, 1, C.wood[2]); R(wx + 2, 66, 24, 1, C.wood[2]); }
      R(wx - 2, 82, 32, 4, open ? C.wood[3] : C.woodDark[3]);
      if (open) for (let k = 0; k < 4; k++) { R(wx + 2 + k * 7, 78, 4, 4, [C.sakura[2], C.butter[2], C.coral[2], C.mint[2]][k]); R(wx + 3 + k * 7, 82, 2, 1, C.forest[2]); } // flower box
    }
    // signboard over the door
    const text = open ? 'COMMUNITY HALL' : 'CLOSED', tw = Math.max(signW(text), 20) + 10, sx = 80 - Math.round(tw / 2);
    R(sx, 42, tw, 12, open ? C.wood[3] : C.woodDark[2]); R(sx, 42, tw, 1, open ? C.wood[4] : C.woodDark[3]); R(sx + 1, 43 + 9, tw - 2, 1, open ? C.wood[1] : C.woodDark[1]);
    signText(R, text, sx + Math.round((tw - signW(text)) / 2), 45, open ? C.woodDark[0] : C.paper[3]);
    // steps
    R(56, 104, 48, 8, C.stone[3]); R(56, 104, 48, 2, C.stone[4]); R(52, 108, 56, 4, C.stone[2]);
    if (open) { // hanging paper lanterns and a leaf emblem
      for (const lx of [50, 108]) { R(lx + 2, 36, 1, 8, C.woodDark[1]); R.e(lx + 3, 52, 4, 6, C.vermilion[2]); R(lx - 1, 51, 9, 1, C.vermilion[1]); R(lx + 1, 46, 5, 2, C.woodDark[1]); R(lx + 1, 59, 5, 2, C.woodDark[1]); R(lx + 1, 49, 2, 3, C.butter[4]); }
      R.t([80, 32], [76, 38], [84, 38], C.forest[3]);
    } else { for (let k = 0; k < 6; k++) R(2 + k * 31, 96 + (k % 2) * 4, 8, 3, C.plaster[1]); R(156, 76, 22, 3, C.stone[3]); line(R, 150, 36, 170, 46, C.stone[4]); line(R, 150, 36, 162, 52, C.stone[4]); }
  }, {});
  return name;
}
export const HALL_CLOSED = facade('ch_hall_closed', false), HALL_OPEN = facade('ch_hall_open', true);

// ---------------------------------------------------------------- bundle boards (one tint per room)
export const BOARD_TINT = { fish: C.sky, pantry: C.butter, craft: C.lilac, garden: C.mint, night: C.navy, vault: C.vermilion };
for (const [room, r] of Object.entries(BOARD_TINT)) {
  spr(`ch_board_${room}`, 64, 48, (R) => {
    R(0, 0, 64, 46, C.woodDark[1]); R(2, 2, 60, 42, C.wood[1]); R(3, 3, 58, 40, C.dirt[3]);
    R(3, 3, 58, 7, r[2]); R(3, 3, 58, 2, r[3]); R(3, 9, 58, 1, r[1]); signText(R, room === 'night' ? 'SKY' : room.toUpperCase(), 32 - Math.round(signW(room === 'night' ? 'SKY' : room.toUpperCase()) / 2), 4, C.paper[4]);
    for (let k = 0; k < 5; k++) { const x = 6 + k * 11, y = 14 + ((k * 7) % 9); R(x, y, 9, 12, k % 2 ? C.paper[3] : paperHi); R(x, y, 9, 1, C.paper[2]); R(x + 4, y - 1, 2, 2, C.ribbon[2]); R(x + 1, y + 3, 6, 1, C.paper[1]); R(x + 1, y + 6, 5, 1, C.paper[1]); }
    R(8, 30, 14, 10, r[3]); R(8, 30, 14, 1, r[4]); R.t([15, 32], [11, 38], [19, 38], C.forest[3]);
    R(0, 44, 64, 2, C.woodDark[0]);
  }, {});
}

// ---------------------------------------------------------------- Fish Tank room
for (const [n, full] of [['ch_tank_dry', 0], ['ch_tank_full', 1]]) {
  spr(n, 96, 64, (R) => {
    R(0, 10, 96, 54, C.metal[1]); R(3, 13, 90, 46, full ? C.water[2] : C.forest[0]); R(3, 13, 90, 10, full ? C.water[3] : C.leaf[1]);
    R(3, 13, 90, 2, full ? C.water[4] : C.leaf[2]); R(3, 50, 90, 9, full ? C.sand[2] : C.dirt[1]);
    R(0, 0, 96, 10, C.metal[2]); R(0, 0, 96, 2, C.metal[3]); R(8, 3, 22, 4, full ? C.butter[3] : C.metal[1]); R(0, 60, 96, 4, C.woodDark[1]);
    if (full) {
      for (const [x, y, c] of [[14, 28, C.coral[2]], [44, 36, C.butter[3]], [66, 26, C.sakura[2]], [30, 22, C.vermilion[3]]]) { R.e(x, y, 5, 3, c); R.t([x + 5, y], [x + 9, y - 3], [x + 9, y + 3], c); R(x - 3, y - 1, 1, 1, inkc); }
      R.e(76, 38, 7, 3, C.paper[3]); R.t([83, 38], [88, 34], [88, 42], C.paper[2]); R(70, 37, 1, 1, inkc);
      for (const x of [10, 52, 82]) { for (let k = 0; k < 14; k++) R(x + (k % 2 ? 1 : 0), 49 - k * 2, 3, 2, C.forest[3]); }
      for (const [x, y] of [[26, 18], [60, 20], [34, 30]]) R(x, y, 2, 2, C.water[5]);
      R(60, 8, 24, 3, C.water[4]);
    } else { line(R, 18, 20, 40, 52, C.stone[4]); line(R, 40, 52, 36, 58, C.stone[4]); line(R, 70, 16, 56, 40, C.stone[4]); R(14, 40, 10, 8, C.forest[1]); R(60, 36, 12, 10, C.forest[1]); }
  }, {});
}

// ---------------------------------------------------------------- Pantry
for (const [n, full] of [['ch_shelf_empty', 0], ['ch_shelf_full', 1]]) {
  spr(n, 64, 72, (R) => {
    R(0, 0, 64, 72, C.woodDark[1]); R(2, 2, 60, 68, C.woodDark[0]);
    for (const sy of [4, 26, 48]) {
      R(2, sy + 16, 60, 5, C.wood[2]); R(2, sy + 16, 60, 1, C.wood[3]);
      if (full) for (let k = 0; k < 5; k++) { const c = [C.coral[2], C.butter[2], C.mint[2], C.sakura[2], C.sky[2]][(k + sy) % 5], x = 6 + k * 11; R(x, sy + 4, 9, 12, C.metal[4]); R(x + 1, sy + 7, 7, 8, c); R(x + 1, sy + 7, 2, 8, C.paper[4]); R(x + 1, sy + 2, 7, 3, C.wood[3]); }
      else { R(8, sy + 12, 10, 4, C.stone[3]); R(40, sy + 10, 4, 6, C.stone[2]); line(R, 4, sy + 1, 14, sy + 8, C.stone[4]); }
    }
  }, {});
}
spr('ch_stove', 64, 56, (R) => { // kitchen range, brought back to life by the pantry spirits
  R(0, 14, 64, 42, C.metal[2]); R(0, 14, 64, 3, C.metal[4]); R(2, 17, 60, 36, C.metal[1]); R(6, 24, 22, 24, C.charcoal[1]); R(8, 26, 18, 20, C.vermilion[1]); R(10, 32, 14, 12, C.butter[2]);
  R(34, 22, 24, 4, C.charcoal[1]); for (const x of [38, 48]) R(x, 30, 6, 6, C.butter[3]); R(0, 0, 8, 14, C.metal[2]); R(0, 0, 8, 3, C.metal[4]);
  for (const x of [4, 8]) R(x, 6, 1, 4, C.paper[3]);
}, {});

// ---------------------------------------------------------------- Craft room
for (const [n, ready] of [['ch_loom_covered', 0], ['ch_loom', 1]]) {
  spr(n, 64, 60, (R) => {
    if (!ready) { R.e(32, 36, 28, 20, C.paper[2]); R(4, 36, 56, 20, C.paper[2]); R.e(32, 20, 18, 12, C.paper[3]); R(8, 52, 48, 3, C.paper[1]); line(R, 16, 30, 22, 54, C.paper[1]); line(R, 44, 30, 40, 54, C.paper[1]); return; }
    R(2, 4, 6, 56, C.wood[1]); R(56, 4, 6, 56, C.wood[1]); R(2, 4, 2, 56, C.wood[2]); R(2, 0, 60, 8, C.wood[2]); R(2, 0, 60, 2, C.wood[3]); R(2, 52, 60, 8, C.wood[1]);
    for (let x = 10; x < 56; x += 3) R(x, 8, 1, 40, [C.sakura[2], C.butter[2], C.sky[2], C.mint[2]][Math.floor(x / 3) % 4]);
    R(8, 36, 48, 12, C.sakura[3]); for (let x = 8; x < 56; x += 4) R(x, 36, 2, 12, C.lilac[3]); R(10, 24, 44, 3, C.wood[3]); R(26, 28, 12, 4, C.wood[0]);
  }, {});
}
spr('ch_craft_table', 64, 40, (R) => {
  R(0, 8, 64, 8, C.wood[3]); R(0, 8, 64, 2, C.wood[4]); R(2, 16, 4, 24, C.wood[1]); R(58, 16, 4, 24, C.wood[1]); R(6, 20, 52, 3, C.wood[2]);
  R(6, 2, 6, 8, C.sakura[2]); R(14, 4, 6, 6, C.butter[3]); R(40, 0, 12, 8, C.paper[4]); R(41, 2, 10, 1, C.paper[1]); R(24, 5, 10, 3, C.lilac[2]);
}, {});

// ---------------------------------------------------------------- Mill
spr('ch_mill', 64, 60, (R) => {
  R(4, 30, 56, 30, C.stone[2]); R(4, 30, 56, 3, C.stone[4]); R(8, 36, 48, 20, C.stone[1]); R.e(32, 30, 26, 8, C.stone[3]); R.e(32, 28, 20, 5, C.stone[4]);
  R(30, 6, 5, 24, C.wood[1]); R(22, 14, 22, 3, C.wood[2]); R.t([8, 14], [32, 0], [56, 14], C.wood[2]); R(14, 14, 36, 1, C.wood[3]);
  R(12, 44, 8, 8, C.paper[4]); R(44, 44, 8, 8, C.paper[4]); R(24, 44, 16, 12, C.paper[3]);
}, {});

// ---------------------------------------------------------------- Garden room
for (const [n, bloom] of [['ch_planter_dead', 0], ['ch_planter', 1]]) {
  spr(n, 36, 34, (R) => {
    R(2, 18, 32, 14, C.brick[2]); R(2, 18, 32, 3, C.brick[3]); R(4, 21, 28, 9, C.dirt[1]);
    if (bloom) for (const [x, c] of [[8, C.sakura[2]], [16, C.butter[3]], [24, C.coral[2]], [30, C.lilac[2]]]) { R(x, 10, 1, 10, C.forest[2]); R.e(x, 8, 3, 3, c); R(x, 7, 1, 1, C.butter[4]); R(x - 3, 14, 3, 1, C.forest[3]); }
    else { line(R, 10, 20, 14, 8, C.woodDark[2]); line(R, 22, 20, 18, 10, C.woodDark[2]); line(R, 28, 20, 29, 12, C.woodDark[2]); }
  }, {});
}
spr('ch_trellis', 64, 76, (R) => {
  R(2, 0, 4, 76, C.wood[2]); R(58, 0, 4, 76, C.wood[2]); R(2, 0, 60, 5, C.wood[3]);
  for (let y = 10; y < 70; y += 12) R(6, y, 52, 2, C.wood[1]); for (let x = 14; x < 54; x += 12) R(x, 5, 2, 66, C.wood[1]);
  for (let k = 0; k < 24; k++) { const x = 6 + Math.floor(hash(k, 1, 5) * 50), y = 6 + Math.floor(hash(k, 2, 5) * 60); R.e(x, y, 3, 2, C.forest[2 + (k % 2)]); if (k % 4 === 0) R.e(x, y, 2, 2, C.sakura[2]); }
}, {});
spr('ch_pond', 96, 56, (R) => {
  R(0, 8, 96, 48, C.stone[3]); R(4, 12, 88, 40, C.stone[2]); R(6, 14, 84, 36, C.water[2]); R(6, 14, 84, 3, C.water[3]);
  for (const [x, y] of [[20, 28], [58, 36], [74, 24]]) { R.e(x, y, 8, 3, C.forest[3]); R(x - 1, y - 1, 3, 1, C.sakura[3]); }
  for (const [x, y] of [[34, 22], [44, 40], [64, 30]]) R(x, y, 6, 1, C.water[5]);
  R.e(18, 40, 5, 3, C.coral[2]); R.t([23, 40], [27, 37], [27, 43], C.coral[2]);
}, {});

// ---------------------------------------------------------------- Night Sky room
spr('ch_telescope', 44, 66, (R) => {
  line(R, 22, 36, 6, 64, C.wood[1], 3); line(R, 22, 36, 38, 64, C.wood[1], 3); line(R, 22, 36, 22, 64, C.wood[2], 3); R(16, 32, 12, 6, C.metal[2]);
  for (let k = 0; k < 4; k++) R(8 + k * 6, 6 + (3 - k) * 6, 14, 10, C.butter[1 + (k % 2)]); // brass tube, tilted by stacking
  R(2, 24, 10, 8, C.butter[2]); R(2, 24, 10, 2, C.butter[4]); R.e(5, 28, 2, 3, C.sky[3]);
}, {});
spr('ch_star_rug', 128, 64, (R) => {
  R(0, 0, 128, 64, C.navy[0]); R(3, 3, 122, 58, C.navy[1]); R(6, 6, 116, 52, C.navy[2]);
  for (let k = 0; k < 30; k++) R(8 + Math.floor(hash(k, 4, 9) * 110), 8 + Math.floor(hash(k, 5, 9) * 46), k % 5 ? 1 : 2, k % 5 ? 1 : 2, k % 3 ? C.butter[4] : paperHi);
  const pts = [[24, 40], [44, 28], [62, 34], [84, 18], [102, 26]]; for (let i = 0; i < 4; i++) line(R, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], C.sky[3]);
  for (const [x, y] of pts) R(x - 1, y - 1, 3, 3, C.butter[3]);
  R.e(110, 48, 8, 8, C.butter[3]); R.e(114, 46, 7, 7, C.navy[2]);
}, { outline: false });
spr('ch_globe_stand', 36, 52, (R) => {
  R(14, 36, 8, 14, C.woodDark[2]); R(6, 46, 24, 5, C.woodDark[1]); R(16, 4, 4, 4, C.brass || C.butter[2]);
  R.e(18, 22, 15, 15, C.navy[2]); R.e(14, 17, 8, 8, C.navy[3]); R(6, 22, 24, 1, C.butter[2]); R(18, 6, 1, 32, C.butter[2]);
  for (const [x, y] of [[10, 16], [24, 14], [22, 28], [12, 30], [28, 24]]) R(x, y, 2, 2, C.butter[4]);
}, {});

// ---------------------------------------------------------------- Vault
for (const [n, open] of [['ch_vault_shut', 0], ['ch_vault_open', 1]]) {
  spr(n, 64, 68, (R) => {
    R(0, 4, 64, 64, C.metal[1]); R(2, 6, 60, 60, C.metal[2]); R(2, 6, 60, 3, C.metal[4]); R(2, 6, 3, 60, C.metal[3]); R(0, 62, 64, 6, C.charcoal[1]);
    R(8, 12, 48, 46, open ? C.butter[1] : C.metal[1]); R(10, 14, 44, 42, open ? C.butter[2] : C.metal[2]);
    if (open) { for (let k = 0; k < 12; k++) R.e(14 + (k % 4) * 10, 24 + Math.floor(k / 4) * 11, 4, 3, k % 2 ? C.butter[3] : C.butter[4]); for (const [x, y] of [[24, 8], [40, 5], [52, 11]]) { R(x, y, 1, 4, paperHi); R(x - 1, y + 1, 3, 1, paperHi); } }
    else { R.e(32, 35, 14, 14, C.metal[3]); R.e(32, 35, 10, 10, C.metal[2]); R(31, 25, 2, 20, C.metal[4]); R(22, 34, 20, 2, C.metal[4]); R.e(32, 35, 3, 3, C.butter[3]); }
    R(4, 56, 8, 6, C.charcoal[1]); R(52, 56, 8, 6, C.charcoal[1]);
  }, {});
}

// ---------------------------------------------------------------- lanterns, sheets, gate, bunting, heart tree
for (const [n, lit] of [['ch_lantern_off', 0], ['ch_lantern_on', 1]]) {
  spr(n, 20, 48, (R) => {
    R(8, 20, 4, 28, C.woodDark[2]); R(4, 44, 12, 4, C.woodDark[1]); R(2, 4, 16, 3, C.woodDark[1]);
    R(3, 7, 14, 14, lit ? C.butter[3] : C.stone[2]); R(5, 9, 10, 10, lit ? C.butter[4] : C.stone[1]); R(3, 7, 2, 14, lit ? C.butter[2] : C.stone[3]); R(3, 21, 14, 2, C.woodDark[1]);
    if (lit) { R(8, 12, 4, 4, '#ffffff'); }
  }, {});
}
spr('ch_sheet', 34, 34, (R) => { // a dust sheet over an old chair
  R.e(17, 20, 14, 11, C.paper[2]); R(3, 20, 28, 11, C.paper[2]); R.e(14, 14, 8, 6, C.paper[3]); R(4, 28, 26, 3, C.paper[1]); line(R, 12, 22, 12, 30, C.paper[1]); line(R, 22, 22, 24, 30, C.paper[1]);
}, {});
spr('ch_gate_off', 64, 72, (R) => {
  R(2, 12, 10, 60, C.stone[2]); R(52, 12, 10, 60, C.stone[2]); R(2, 12, 3, 60, C.stone[3]); R(52, 12, 3, 60, C.stone[3]); R(0, 4, 64, 10, C.stone[3]); R(0, 4, 64, 3, C.stone[4]);
  R(12, 20, 40, 52, C.charcoal[0]); for (const y of [30, 44, 58]) { R(5, y, 4, 2, C.stone[1]); R(55, y, 4, 2, C.stone[1]); }
}, {});
spr('ch_gate_on', 64, 72, (R) => {
  R(2, 12, 10, 60, C.stone[2]); R(52, 12, 10, 60, C.stone[2]); R(2, 12, 3, 60, C.stone[3]); R(52, 12, 3, 60, C.stone[3]); R(0, 4, 64, 10, C.stone[3]); R(0, 4, 64, 3, C.stone[4]);
  R(12, 20, 40, 52, C.navy[1]); R(14, 22, 36, 48, C.lilac[2]); R(18, 26, 28, 44, C.lilac[3]); R(24, 32, 16, 38, C.sakura[4]);
  for (const y of [30, 44, 58]) { R(5, y, 4, 2, C.mint[3]); R(55, y, 4, 2, C.mint[3]); }
  for (const [x, y] of [[20, 40], [40, 36], [30, 54], [22, 62], [38, 60]]) R(x, y, 2, 2, C.butter[4]);
}, {});
spr('ch_bunting', 192, 26, (R) => {
  line(R, 0, 4, 96, 14, C.woodDark[2]); line(R, 96, 14, 191, 4, C.woodDark[2]);
  for (let i = 0; i < 12; i++) { const x = 8 + i * 15, y = 4 + Math.round(Math.sin((x / 192) * Math.PI) * 10); R.t([x, y + 1], [x + 10, y + 1], [x + 5, y + 12], [C.coral[2], C.butter[3], C.mint[2], C.sky[2], C.sakura[2]][i % 5]); }
}, {});
// the hall's heart tree: bare and grey until the hall is restored, then a glowing blossom tree
for (const [n, live] of [['ch_heart_tree_dead', 0], ['ch_heart_tree', 1]]) {
  spr(n, 80, 96, (R) => {
    R(34, 40, 12, 56, live ? C.wood[1] : C.woodDark[2]); R(34, 40, 4, 56, live ? C.wood[2] : C.woodDark[3]); R(24, 86, 32, 10, live ? C.wood[1] : C.woodDark[2]);
    line(R, 38, 50, 14, 30, live ? C.wood[1] : C.woodDark[2], 3); line(R, 42, 46, 66, 24, live ? C.wood[1] : C.woodDark[2], 3);
    if (live) { for (const [x, y, r] of [[40, 22, 26], [16, 36, 14], [64, 32, 15], [40, 8, 14]]) { R.e(x, y, r, Math.round(r * 0.8), C.sakura[2]); R.e(x - 4, y - 4, Math.round(r * 0.6), Math.round(r * 0.45), C.sakura[3]); } for (let k = 0; k < 14; k++) R(10 + Math.floor(hash(k, 6, 2) * 60), 8 + Math.floor(hash(k, 7, 2) * 40), 2, 2, C.sakura[4]); R(34, 70, 12, 3, C.butter[3]); }
    else { line(R, 14, 30, 8, 18, C.woodDark[2]); line(R, 66, 24, 72, 10, C.woodDark[2]); line(R, 40, 40, 40, 14, C.woodDark[2], 2); }
    R(32, 78, 16, 3, C.paper[3]); for (let x = 32; x < 48; x += 4) R(x, 81, 2, 5, C.paper[2]); // shimenawa rope with paper streamers
  }, {});
}
spr('ch_crates', 64, 42, (R) => {
  R(2, 16, 28, 24, C.wood[1]); R(2, 16, 28, 3, C.wood[2]); line(R, 2, 18, 30, 38, C.wood[0]); R(32, 4, 28, 36, C.wood[1]); R(32, 4, 28, 3, C.wood[2]); line(R, 32, 6, 60, 38, C.wood[0]); R(36, 22, 20, 3, C.paper[2]);
}, {});
