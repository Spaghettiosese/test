// Town Growth (sv5) sprites: construction sites, the eight town projects, stalls, vans, houses, shopfronts and civic props.
// All props use the town toolkit `spr` (selective outline, the engine pads the 1 px margin). Names are prefixed tp_.
import { spr, RAMPS as K, signText } from '../town/lib.js';
import { facade } from '../town/facade.js';
import { itemIcon } from '../../gfx/icons.js';

export const PROJECT_SIZE = { bus: [1, 1], library: [5, 3], skate: [4, 3], night: [10, 2], promenade: [6, 1], garden: [4, 3], recycle: [3, 2], weather: [2, 2] };

// ---------------------------------------------------------------- construction sites (two stages per project)
for (const [id, [w, h]] of Object.entries(PROJECT_SIZE)) {
  for (const stage of [1, 2]) {
    const W = w * 32, H = h * 32 + (stage === 2 ? 20 : 6);
    spr(`tp_site${stage}_${id}`, W, H, (R, M) => {
      R(2, H - 14, W - 4, 12, M.dirt[2]); R(2, H - 14, W - 4, 2, M.dirt[3]); R(6, H - 9, 5, 2, M.dirt[1]); R(W - 18, H - 7, 6, 2, M.dirt[1]);
      if (stage === 2) {
        for (let x = 6; x < W - 4; x += 28) { R(x, 6, 3, H - 18, M.wood[2]); R(x, 6, 1, H - 18, M.wood[3]); }
        R(4, 12, W - 8, 3, M.wood[3]); R(4, Math.floor(H / 2), W - 8, 3, M.wood[3]); R(4, H - 24, W - 8, 3, M.wood[2]);
        R(10, Math.floor(H / 2) + 3, Math.min(W - 20, 60), H - 24 - Math.floor(H / 2) - 3, M.sky[3]); R(10, Math.floor(H / 2) + 3, Math.min(W - 20, 60), 2, M.sky[4]);
      } else {
        R(W - 30, H - 24, 18, 10, M.wood[3]); R(W - 30, H - 24, 18, 2, M.wood[4]); R(W - 28, H - 28, 14, 4, M.wood[2]);
      }
      for (let x = 4; x < W - 14; x += 22) { R(x, H - 12, 16, 3, M.butter[3]); for (let k = 0; k < 16; k += 8) R(x + k, H - 12, 4, 3, M.charcoal[1]); R(x + 1, H - 9, 2, 6, M.metal[2]); R(x + 13, H - 9, 2, 6, M.metal[2]); }
      R(W - 12, H - 16, 7, 9, M.vermilion[2]); R(W - 11, H - 19, 5, 3, M.vermilion[3]); R(W - 12, H - 8, 9, 2, M.charcoal[1]); R(W - 11, H - 14, 5, 1, M.paper[4]);
      R(8, H - 26, 30, 11, M.butter[3]); R(8, H - 26, 30, 1, M.butter[4]); signText(R, stage === 1 ? 'SOON' : 'BUILDING', 11, H - 23, M.charcoal[1]);
    });
  }
}

// ---------------------------------------------------------------- finished projects
spr('tp_bus_sign', 22, 58, (R, M) => {
  R(9, 14, 3, 42, M.metal[2]); R(9, 14, 1, 42, M.metal[3]); R(5, 54, 11, 3, M.metal[1]);
  R(2, 3, 18, 14, M.mint[2]); R(2, 3, 18, 2, M.mint[3]); R(3, 7, 16, 8, M.sky[3]); R(4, 8, 5, 4, M.paper[4]); R(10, 8, 5, 4, M.paper[4]); R(16, 8, 2, 4, M.butter[3]); R(4, 13, 14, 1, M.mint[1]);
  R(2, 17, 18, 8, M.paper[4]); signText(R, 'LOOP', 4, 19, M.mint[1]);
});
spr('tp_wing', 160, 98, (R, M) => {
  R(0, 6, 160, 90, M.wood[3]); R(0, 6, 160, 4, M.wood[4]); R(0, 92, 160, 4, M.woodDark[2]);
  for (let s = 0; s < 3; s++) { const x = 6 + s * 52; R(x, 14, 46, 52, M.woodDark[2]); R(x + 2, 16, 42, 48, M.woodDark[1]); for (let r = 0; r < 4; r++) { R(x + 2, 28 + r * 12, 42, 2, M.woodDark[3]); for (let b = 0; b < 9; b++) R(x + 3 + b * 4 + (r % 2), 17 + r * 12, 3, 11, [M.coral[2], M.sky[2], M.butter[2], M.mint[2], M.lilac[2]][(b + r + s) % 5]); } }
  R(20, 72, 120, 20, M.sky[1]); R(24, 74, 112, 16, M.sky[2]); R.e(80, 82, 38, 7, M.butter[3]); R(48, 58, 16, 18, M.coral[2]); R(48, 58, 16, 4, M.coral[3]); R(100, 62, 8, 20, M.metal[2]); R(98, 56, 12, 8, M.butter[3]); R(98, 56, 12, 1, M.butter[4]);
});
spr('tp_skate', 128, 90, (R, M) => {
  R(2, 12, 124, 76, M.stone[2]); R(2, 12, 124, 3, M.stone[3]); R(2, 85, 124, 3, M.stone[1]);
  R.t([62, 84], [124, 84], [124, 30], M.stone[4]); R.t([70, 84], [124, 84], [124, 40], M.stone[3]); R(116, 24, 8, 62, M.stone[3]);
  R(8, 56, 40, 3, M.metal[3]); R(8, 59, 2, 14, M.metal[1]); R(44, 59, 2, 14, M.metal[1]); R(10, 48, 36, 1, M.metal[4]);
  for (let i = 0; i < 6; i++) R(10 + i * 18, 20 + (i % 2) * 8, 10, 4, [M.coral[2], M.mint[2], M.butter[2], M.lilac[2], M.sky[2], M.ribbon[2]][i]);
  R(6, 34, 16, 6, M.vermilion[2]); R(30, 70, 20, 4, M.sky[3]);
});
spr('tp_garden', 128, 92, (R, M) => {
  R(2, 14, 124, 76, M.dirt[2]); R(2, 14, 124, 3, M.dirt[3]);
  for (const [x, y, c] of [[8, 24, M.forest[3]], [68, 24, M.leaf[2]], [8, 56, M.coral[3]], [68, 56, M.butter[3]]]) { R(x, y, 52, 26, M.wood[2]); R(x, y, 52, 3, M.wood[4]); R(x + 2, y + 3, 48, 21, M.dirt[1]); for (let i = 0; i < 6; i++) { R(x + 5 + i * 8, y + 5, 2, 8, M.forest[2]); R.e(x + 6 + i * 8, y + 5, 3, 3, c); R(x + 5 + i * 8, y + 15, 2, 6, M.forest[2]); R.e(x + 6 + i * 8, y + 15, 3, 3, c); } }
  R(58, 2, 3, 40, M.wood[2]); R(46, 12, 28, 3, M.wood[2]); R.e(60, 6, 5, 5, M.butter[3]); R(56, 4, 8, 2, M.wood[1]);
  for (let x = 2; x < 126; x += 8) { R(x, 82, 5, 8, M.paper[3]); R(x, 82, 5, 1, M.paper[4]); }
});
spr('tp_recycle', 96, 62, (R, M) => {
  R(2, 10, 92, 50, M.metal[3]); R(2, 10, 92, 4, M.metal[4]); R(2, 56, 92, 4, M.metal[1]); R(0, 6, 96, 8, M.roofTeal[2]); R(0, 6, 96, 3, M.roofTeal[3]);
  for (const [x, c] of [[10, M.sky[2]], [38, M.butter[2]], [66, M.forest[2]]]) { R(x, 26, 22, 30, c); R(x, 26, 22, 3, M.paper[3]); R(x + 2, 29, 18, 24, c); R(x + 8, 34, 6, 10, M.paper[4]); R(x + 10, 36, 2, 6, c); }
  R.t([40, 16], [56, 16], [48, 24], M.forest[3]); signText(R, 'RECYCLE', 28, 16, M.charcoal[1]);
});
spr('tp_weather', 64, 94, (R, M) => {
  R(24, 30, 16, 62, M.paper[4]); R(24, 30, 4, 62, M.paper[3]); R(36, 30, 4, 62, M.paper[2]); R(22, 88, 20, 4, M.stone[2]);
  R(28, 60, 8, 12, M.sky[2]); R(28, 76, 8, 8, M.sky[2]); R(12, 22, 40, 10, M.coral[2]); R(12, 22, 40, 2, M.coral[3]);
  R(31, 6, 2, 18, M.metal[2]); R(12, 6, 40, 2, M.metal[3]); R.e(14, 8, 4, 4, M.vermilion[2]); R.e(50, 8, 4, 4, M.vermilion[2]); R.e(32, 8, 3, 3, M.metal[4]);
  R(44, 44, 10, 18, M.paper[4]); R(45, 46, 8, 14, M.sky[3]); R(45, 54, 8, 6, M.sky[1]); R(8, 38, 12, 8, M.metal[3]); R(10, 36, 8, 2, M.metal[2]);
});
spr('tp_nm_stall_a', 64, 66, (R, M) => nightStall(R, M, M.coral));
spr('tp_nm_stall_b', 64, 66, (R, M) => nightStall(R, M, M.mint));
spr('tp_nm_stall_c', 64, 66, (R, M) => nightStall(R, M, M.lilac));
function nightStall(R, M, A) {
  R(4, 14, 3, 46, M.woodDark[2]); R(57, 14, 3, 46, M.woodDark[2]);
  R(0, 8, 64, 14, A[2]); for (let x = 0; x < 64; x += 8) R(x, 8, 4, 14, M.paper[3]); R(0, 8, 64, 2, A[3]); for (let x = 2; x < 64; x += 8) R.e(x + 3, 24, 3, 3, A[2]);
  R(2, 38, 60, 22, M.wood[2]); R(2, 38, 60, 3, M.wood[4]); R(2, 56, 60, 4, M.wood[1]);
  for (let i = 0; i < 5; i++) R.e(10 + i * 11, 34, 4, 4, [M.butter[3], M.coral[3], M.mint[3], M.sky[3], M.lilac[3]][i]);
  R.e(14, 28, 3, 4, M.butter[4]); R.e(50, 28, 3, 4, M.butter[4]);
}
spr('tp_nm_lights', 320, 18, (R, M) => {
  for (let x = 0; x < 318; x += 4) R(x, 3 + Math.round(Math.sin(x / 40 * Math.PI) * 2), 4, 1, M.charcoal[2]);
  for (let x = 6; x < 316; x += 20) { const y = 5 + Math.round(Math.sin(x / 40 * Math.PI) * 2); R(x, y, 3, 5, [M.butter[3], M.coral[3], M.mint[3], M.lilac[3]][(x / 20 | 0) % 4]); R(x + 1, y + 1, 1, 2, M.paper[4]); }
}, { outline: false });
spr('tp_prom_planter', 30, 40, (R, M) => {
  R(3, 22, 24, 15, M.stone[3]); R(3, 22, 24, 3, M.stone[4]); R(3, 34, 24, 3, M.stone[1]); R(5, 14, 20, 9, M.dirt[1]);
  for (let i = 0; i < 5; i++) { R(6 + i * 4, 8 + (i % 2) * 3, 2, 8, M.forest[2]); R.e(7 + i * 4, 8 + (i % 2) * 3, 3, 3, [M.coral[3], M.butter[3], M.lilac[3], M.sky[3], M.ribbon[3]][i]); }
});
spr('tp_prom_sign', 40, 46, (R, M) => {
  R(18, 20, 4, 24, M.woodDark[2]); R(3, 3, 34, 20, M.wood[3]); R(3, 3, 34, 3, M.wood[4]); R(5, 7, 30, 14, M.sky[3]); R.t([8, 18], [14, 12], [20, 18], M.paper[4]); R.t([18, 18], [26, 10], [34, 18], M.paper[4]); R(5, 18, 30, 3, M.sky[1]);
});
spr('tp_podium', 62, 62, (R, M) => {
  R(14, 34, 34, 26, M.wood[3]); R(12, 30, 38, 6, M.wood[4]); R(12, 34, 38, 1, M.wood[1]); R(16, 38, 30, 18, M.wood[2]);
  R(6, 4, 50, 22, M.coral[2]); R(6, 4, 50, 3, M.coral[3]); R(8, 8, 46, 16, M.paper[4]); signText(R, 'TOWN COUNCIL', 11, 13, M.coral[1]); R(4, 2, 3, 28, M.woodDark[2]); R(55, 2, 3, 28, M.woodDark[2]);
});
spr('tp_sugg_box', 26, 44, (R, M) => {
  R(11, 22, 4, 20, M.woodDark[2]); R(3, 4, 20, 20, M.mint[2]); R(3, 4, 20, 3, M.mint[3]); R(6, 10, 14, 2, M.charcoal[1]); R(5, 14, 16, 8, M.paper[4]); signText(R, 'IDEAS', 6, 16, M.mint[1]);
});
spr('tp_paper_rack', 36, 46, (R, M) => {
  R(4, 14, 28, 28, M.metal[2]); R(4, 14, 28, 3, M.metal[4]); R(6, 18, 24, 12, M.paper[4]); R(6, 18, 24, 3, M.paper[3]); signText(R, 'NEWS', 9, 22, M.charcoal[1]); R(8, 32, 20, 8, M.paper[3]); R(6, 40, 3, 4, M.metal[1]); R(27, 40, 3, 4, M.metal[1]);
});
spr('tp_vol_sign', 40, 50, (R, M) => {
  R(18, 24, 4, 24, M.woodDark[2]); R(2, 4, 36, 22, M.forest[2]); R(2, 4, 36, 3, M.forest[3]); R(4, 8, 32, 16, M.paper[4]); signText(R, 'HELP', 11, 11, M.forest[1]); signText(R, 'DAY', 14, 18, M.forest[1]);
});
spr('tp_auction_stand', 96, 64, (R, M) => {
  R(2, 24, 92, 36, M.wood[2]); R(2, 24, 92, 4, M.wood[4]); R(2, 56, 92, 4, M.wood[1]);
  R(0, 8, 96, 16, M.navy[2]); for (let x = 0; x < 96; x += 12) R(x, 8, 6, 16, M.paper[3]); R(0, 8, 96, 2, M.navy[3]);
  R(40, 32, 16, 12, M.paper[4]); signText(R, 'LOT', 42, 35, M.navy[1]); R(70, 30, 18, 10, M.woodDark[2]); R(76, 24, 6, 8, M.woodDark[3]);
  for (const [x, c] of [[8, M.butter[2]], [22, M.coral[2]]]) { R(x, 36, 12, 12, c); R(x, 36, 12, 2, M.paper[4]); }
});
spr('tp_piggy', 30, 40, (R, M) => {
  R(10, 22, 4, 16, M.woodDark[2]); R(18, 22, 4, 16, M.woodDark[2]); R(4, 8, 22, 15, M.coral[3]); R(4, 8, 22, 3, M.coral[4]); R.e(24, 14, 3, 4, M.coral[2]); R(22, 5, 3, 4, M.coral[2]); R(12, 6, 6, 2, M.charcoal[1]); R(8, 12, 2, 2, M.ink[1]);
});
spr('tp_van', 96, 56, (R, M) => {
  R(2, 12, 66, 34, M.paper[4]); R(2, 12, 66, 3, M.paper[3]); R(66, 20, 28, 26, M.sky[2]); R(70, 22, 18, 10, M.sky[4]); R(2, 36, 92, 6, M.coral[2]); R(88, 36, 6, 8, M.butter[3]);
  signText(R, 'MOVING', 10, 20, M.coral[1]); R(14, 28, 18, 4, M.coral[2]);
  for (const x of [14, 70]) { R.e(x + 6, 48, 7, 6, M.charcoal[1]); R.e(x + 6, 48, 3, 3, M.metal[3]); }
  R(76, 8, 14, 4, M.metal[2]);
});
spr('tp_boxes', 44, 34, (R, M) => {
  R(2, 14, 20, 18, M.wood[3]); R(2, 14, 20, 3, M.wood[4]); R(9, 14, 6, 18, M.paper[3]); R(22, 22, 18, 10, M.wood[2]); R(22, 22, 18, 2, M.wood[4]); R(8, 4, 14, 10, M.wood[3]); R(8, 4, 14, 2, M.wood[4]);
});
spr('tp_basket', 24, 24, (R, M) => {
  R(3, 12, 18, 9, M.wood[2]); R(3, 12, 18, 2, M.wood[4]); for (let i = 0; i < 5; i++) R.e(5 + i * 3, 9 - (i % 2) * 2, 2, 3, [M.coral[3], M.butter[3], M.lilac[3], M.sky[3], M.ribbon[3]][i]);
});
spr('tp_umbrella_stand', 30, 44, (R, M) => {
  R(5, 24, 20, 18, M.metal[2]); R(5, 24, 20, 3, M.metal[4]); for (const [x, c] of [[8, M.sky[2]], [14, M.coral[2]], [20, M.butter[2]]]) { R(x, 6, 2, 20, M.woodDark[2]); R.t([x - 4, 8], [x + 6, 8], [x + 1, 2], c); }
});
spr('tp_tea_table', 44, 44, (R, M) => {
  R(2, 18, 40, 6, M.wood[3]); R(2, 18, 40, 2, M.wood[4]); R(5, 24, 3, 17, M.wood[2]); R(36, 24, 3, 17, M.wood[2]); R.e(14, 14, 4, 4, M.paper[4]); R(12, 10, 4, 4, M.paper[4]); R(26, 8, 8, 10, M.mint[3]); R(26, 8, 8, 2, M.mint[4]); R(34, 11, 3, 4, M.mint[2]);
});
spr('tp_swap_box', 36, 44, (R, M) => {
  R(4, 8, 28, 22, M.sky[2]); R(4, 8, 28, 3, M.sky[3]); R(8, 13, 20, 14, M.wood[2]); for (let b = 0; b < 5; b++) R(9 + b * 4, 14, 3, 12, [M.coral[2], M.butter[2], M.mint[2], M.lilac[2], M.sky[3]][b]); R(6, 30, 3, 12, M.woodDark[2]); R(27, 30, 3, 12, M.woodDark[2]);
});
spr('tp_lantern_string', 64, 20, (R, M) => {
  for (let x = 0; x < 62; x += 4) R(x, 2 + Math.round(Math.sin(x / 30 * Math.PI) * 2), 4, 1, M.charcoal[2]);
  for (let x = 4; x < 60; x += 14) R.e(x + 3, 10 + Math.round(Math.sin(x / 30 * Math.PI) * 2), 4, 5, [M.coral[3], M.butter[3]][(x / 14 | 0) % 2]);
}, { outline: false });
spr('tp_bench_prom', 52, 40, (R, M) => {
  R(2, 16, 48, 5, M.wood[3]); R(2, 16, 48, 2, M.wood[4]); R(2, 8, 48, 6, M.wood[2]); R(2, 8, 48, 2, M.wood[3]); R(6, 21, 3, 14, M.metal[1]); R(43, 21, 3, 14, M.metal[1]);
});

// ---------------------------------------------------------------- the market stall (8 variants: awning, sign, till)
for (const aw of [0, 1]) for (const sg of [0, 1]) for (const tl of [0, 1]) {
  spr(`tp_stall_${aw}${sg}${tl}`, 64, 66, (R, M) => {
    R(4, 18, 3, 42, M.woodDark[2]); R(57, 18, 3, 42, M.woodDark[2]);
    if (aw) { R(0, 8, 64, 14, M.coral[2]); for (let x = 0; x < 64; x += 8) R(x, 8, 4, 14, M.paper[3]); R(0, 8, 64, 2, M.coral[3]); } else { R(2, 12, 60, 4, M.wood[2]); R(2, 12, 60, 1, M.wood[3]); R(6, 8, 52, 4, M.paper[2]); }
    R(2, 38, 60, 22, M.wood[2]); R(2, 38, 60, 3, M.wood[4]); R(2, 56, 60, 4, M.wood[1]);
    for (let i = 0; i < 4; i++) R.e(12 + i * 13, 34, 5, 4, [M.coral[3], M.forest[3], M.butter[3], M.lilac[3]][i]);
    if (sg) { R(14, 24, 36, 12, M.butter[3]); R(14, 24, 36, 1, M.butter[4]); R(14, 35, 36, 1, M.butter[1]); signText(R, 'MISA', 20, 27, M.wood[1]); }
    if (tl) { R(48, 42, 12, 10, M.metal[2]); R(48, 42, 12, 2, M.metal[4]); R(50, 46, 8, 2, M.mint[3]); R(50, 49, 8, 3, M.charcoal[1]); }
  });
}

// ---------------------------------------------------------------- shopfronts (4 shops, 4 tiles wide) and homes (6)
const SHOP = { top: 0, roofH: 24, wallH: 62, roof: 'flat', posts: true, wall: 'plaster' };
const shopFacade = (name, ramp, awn, text) => facade(name, { ...SHOP, w: 4, wallRamp: ramp, door: { x: 50, style: 'glass' },
  windows: [{ x: 8, y: 10, w: 34, h: 26, shop: true }, { x: 88, y: 10, w: 32, h: 26, shop: true }],
  awnings: [{ x: 4, w: 120, y: 0, a: awn, b: 'paper' }], signs: [{ text, y: 6, ramp: awn, light: true, ink: awn, inkI: 0 }] });
shopFacade('tp_shop_flower', 'mint', 'coral', 'Petal Pot');
shopFacade('tp_shop_books', 'butter', 'sky', 'Nook Books');
shopFacade('tp_shop_thrift', 'lilac', 'butter', 'Second Spring');
shopFacade('tp_shop_bikes', 'sky', 'vermilion', 'Spoke Sprocket');
const HOUSE = (name, wall, roof, curtain, door) => facade(name, { w: 4, top: 6, roofH: 28, wallH: 54, wall: 'plaster', wallRamp: wall, roof: 'kawara', roofRamp: roof, chimney: 98,
  door: { x: 50, style: 'wood', ramp: door }, windows: [{ x: 8, curtain, box: true }, { x: 92, curtain, box: true }] });
HOUSE('tp_house_1', 'butter', 'roofRed', 'coral', 'wood'); HOUSE('tp_house_2', 'sky', 'roofSlate', 'lilac', 'woodDark'); HOUSE('tp_house_3', 'mint', 'roofTeal', 'butter', 'wood');
HOUSE('tp_house_4', 'paper', 'roofRed', 'mint', 'woodDark'); HOUSE('tp_house_5', 'sakura', 'roofSlate', 'coral', 'wood'); HOUSE('tp_house_6', 'plaster', 'roofTeal', 'sky', 'woodDark');

// ---------------------------------------------------------------- item icons shared by the content modules
export const icon = (shape, c, c2) => itemIcon(shape, { c, ...(c2 ? { c2 } : {}) });
export { K };
