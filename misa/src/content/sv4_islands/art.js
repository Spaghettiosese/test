// Seto Islands art: stilt houses and island buildings (one parametrised generator), furniture blocks, props, the sailing boat, the glowing moss,
// the sunken chest, bottles, cats on roofs. All hd sprites via the clipped spr() helper (1 art px = 1 screen px, the outline margin is automatic).
import { spr, signText, signW } from '../town/lib.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';

const WD = Rr.wood, DK = Rr.woodDark, PA = Rr.paper, ST = Rr.stone, FO = Rr.forest, BU = Rr.butter, SK = Rr.sky, CO = Rr.coral, MI = Rr.mint, LI = Rr.lilac;

// ---------------------------------------------------------------- buildings: spr name, tiles wide, total height, options
// o: wall ramp, roof ramp, sign text, door x (px), door w, windows [x...], stilts (px of posts under the floor), thatch, extra(R)
function building(name, tw, H, o = {}) {
  const W = tw * 32, wall = o.wall || WD, roof = o.roof || Rr.roofTeal, st = o.stilts ?? 0, roofH = o.roofH || 30, thatch = !!o.thatch;
  spr(name, W, H, (R) => {
    const wy = roofH, wh = H - roofH - st;
    // stilts
    for (let x = 6; x < W - 4; x += 20) { R(x, H - st, 4, st, DK[1]); R(x, H - st, 1, st, DK[2]); }
    if (st) R(2, H - st - 2, W - 4, 3, DK[2]);
    // wall planks
    R(4, wy, W - 8, wh, wall[3]); R(4, wy, W - 8, 2, wall[4]); R(4, wy + wh - 2, W - 8, 2, wall[1]);
    for (let x = 8; x < W - 8; x += 7) { R(x, wy + 2, 1, wh - 4, wall[2]); if (hash(x, 3, 9) > 0.55) R(x + 2, wy + 6 + (x % 9), 1, 4, wall[1]); }
    R(4, wy, 2, wh, wall[4]); R(W - 6, wy, 2, wh, wall[1]);
    // roof
    if (thatch) {
      R.t([-2, wy + 4], [W + 1, wy + 4], [W / 2, 2], BU[1]); R.t([2, wy + 2], [W / 2, wy + 2], [W / 2, 6], BU[2]);
      for (let y = 8; y < wy + 2; y += 4) for (let x = 3 + (y % 8); x < W - 4; x += 8) if (Math.abs(x - W / 2) < (y - 2) * (W / 2) / (wy + 2)) R(x, y, 4, 1, DK[3]);
    } else {
      R.t([-2, wy + 4], [W + 1, wy + 4], [W / 2, 3], roof[2]); R.t([2, wy + 2], [W / 2, wy + 2], [W / 2, 6], roof[3]); R(-2, wy + 3, W + 3, 3, roof[1]);
      for (let y = 10; y < wy + 2; y += 5) R(Math.round(W / 2 - (y - 3) * (W / 2) / (wy + 1)), y, Math.round((y - 3) * W / (wy + 1)), 1, roof[1]);
    }
    // door
    const dx = o.door ?? Math.round(W / 2 - 8), dw = o.doorW || 16, dh = Math.min(30, wh - 4);
    R(dx - 1, wy + wh - dh - 1, dw + 2, dh + 1, DK[0]); R(dx, wy + wh - dh, dw, dh, DK[2]); R(dx + 2, wy + wh - dh + 2, dw - 4, dh - 4, DK[3]); R(dx + dw - 4, wy + wh - dh + dh / 2, 2, 2, BU[2]);
    // windows
    for (const wx of o.windows || []) { R(wx - 1, wy + 7, 12, 12, DK[1]); R(wx, wy + 8, 10, 10, o.glow ? BU[2] : SK[3]); R(wx, wy + 8, 10, 2, o.glow ? BU[3] : SK[4]); R(wx + 4, wy + 8, 1, 10, DK[1]); R(wx, wy + 12, 10, 1, DK[1]); }
    if (o.sign) { const sw = signW(o.sign) + 6, sx = Math.round(W / 2 - sw / 2); R(sx, wy - 2 + 3, sw, 11, DK[1]); R(sx + 1, wy + 2, sw - 2, 9, o.signBg || PA[3]); signText(R, o.sign, sx + 3, wy + 4, o.signInk || DK[1]); }
    if (o.extra) o.extra(R, { W, H, wy, wh, st });
  });
  return name;
}
export const BLD = {};
const B = (name, ...a) => { BLD[name] = a; return building(name, ...a); };
B('sv4_house_a', 3, 88, { wall: WD, roof: Rr.roofTeal, stilts: 12, door: 38, windows: [10, 70], roofH: 34 });
B('sv4_house_b', 3, 88, { wall: PA, roof: Rr.roofRed, stilts: 12, door: 38, windows: [10, 70], roofH: 34 });
B('sv4_house_c', 4, 92, { wall: SK, roof: Rr.roofSlate, stilts: 12, door: 56, windows: [12, 100], roofH: 36 });
B('sv4_house_d', 3, 86, { wall: MI, roof: Rr.roofRed, stilts: 12, door: 20, windows: [60], roofH: 32 });
B('sv4_inn', 5, 108, { wall: PA, roof: Rr.roofRed, stilts: 10, door: 72, doorW: 18, windows: [14, 40, 112, 136], sign: 'INN', glow: true, roofH: 40 });
B('sv4_fishery', 6, 108, { wall: SK, roof: Rr.roofSlate, stilts: 10, door: 84, doorW: 24, windows: [16, 42, 140, 164], sign: 'FISHERY', roofH: 40 });
B('sv4_school', 5, 104, { wall: PA, roof: Rr.roofTeal, stilts: 8, door: 72, doorW: 18, windows: [14, 40, 112, 136], sign: 'SCHOOL', roofH: 38,
  extra: (R, { W }) => { R(W / 2 - 3, 0, 6, 8, DK[2]); R(W / 2 - 4, 6, 8, 5, BU[2]); R(W / 2 - 1, 11, 2, 3, BU[1]); } });
B('sv4_diner', 5, 100, { wall: WD, roof: Rr.roofRed, stilts: 10, door: 72, doorW: 18, windows: [14, 40, 116, 140], sign: 'UMI DINER', glow: true, roofH: 38,
  extra: (R, { W, wy }) => { for (let x = 8; x < W - 8; x += 12) { R(x, wy + 28, 6, 10, CO[2]); R(x, wy + 28, 6, 2, CO[3]); } } });
B('sv4_shellshop', 3, 86, { wall: MI, roof: Rr.roofTeal, stilts: 10, door: 36, windows: [10, 72], sign: 'SHELLS', roofH: 34 });
B('sv4_store', 3, 86, { wall: SK, roof: Rr.roofRed, stilts: 8, door: 36, windows: [10, 72], sign: 'STORE', roofH: 34 });
B('sv4_hut', 4, 86, { wall: PA, thatch: true, stilts: 14, door: 52, windows: [14, 94], roofH: 36, glow: true });
B('sv4_bar', 4, 84, { wall: WD, thatch: true, stilts: 6, door: 52, windows: [], sign: 'BAR', roofH: 34,
  extra: (R, { W, wy, wh }) => { R(8, wy + 14, W - 16, 4, DK[1]); R(8, wy + 16, W - 16, 12, DK[2]); R(8, wy + 14, W - 16, 1, DK[3]); for (let x = 16; x < W - 18; x += 18) { R(x, wy + 4, 4, 10, SK[3]); R(x + 1, wy + 3, 2, 2, SK[4]); } } });
B('sv4_cabin', 3, 80, { wall: WD, roof: Rr.roofSlate, stilts: 0, door: 38, windows: [10], roofH: 30 });
B('sv4_rest', 3, 74, { wall: PA, roof: Rr.roofRed, stilts: 0, door: 38, windows: [12, 70], roofH: 28 });

// torii / shrine gate
spr('sv4_torii', 96, 80, (R) => {
  R(10, 22, 10, 56, Rr.vermilion[2]); R(76, 22, 10, 56, Rr.vermilion[2]); R(10, 22, 3, 56, Rr.vermilion[3]); R(76, 22, 3, 56, Rr.vermilion[3]);
  R(2, 10, 92, 8, Rr.vermilion[2]); R(2, 10, 92, 2, Rr.vermilion[3]); R(0, 6, 96, 5, DK[1]); R(14, 28, 68, 5, Rr.vermilion[1]); R(46, 18, 4, 10, Rr.vermilion[1]);
  R(8, 74, 14, 4, ST[2]); R(74, 74, 14, 4, ST[2]);
});
spr('sv4_shrine_small', 64, 70, (R) => {
  R(6, 54, 52, 12, ST[2]); R(6, 54, 52, 2, ST[4]); R(12, 28, 40, 28, WD[3]); R(12, 28, 40, 3, WD[4]); R(26, 38, 12, 18, DK[2]);
  R.t([4, 30], [60, 30], [32, 6], Rr.roofSlate[2]); R.t([10, 28], [32, 28], [32, 10], Rr.roofSlate[3]); R(4, 29, 56, 3, Rr.roofSlate[1]); R(30, 2, 4, 5, BU[2]);
  R(16, 32, 4, 4, Rr.vermilion[2]); R(44, 32, 4, 4, Rr.vermilion[2]);
});
// lighthouse #2
spr('sv4_tower', 96, 224, (R) => {
  R(10, 206, 76, 16, ST[1]); R(14, 200, 68, 8, ST[2]);
  for (let y = 70; y < 204; y++) { const k = (y - 70) / 134, hw = 22 + Math.round(k * 10), cx = 48; R(cx - hw, y, hw * 2, 1, Math.floor((y - 70) / 22) % 2 ? Rr.vermilion[2] : PA[4]); R(cx - hw, y, 3, 1, Math.floor((y - 70) / 22) % 2 ? Rr.vermilion[3] : PA[3]); R(cx + hw - 4, y, 4, 1, Math.floor((y - 70) / 22) % 2 ? Rr.vermilion[1] : PA[1]); }
  R(32, 168, 32, 36, DK[2]); R(34, 170, 28, 34, DK[3]); R(46, 184, 3, 3, BU[2]);
  for (const y of [90, 120, 146]) { R(44, y, 8, 12, SK[3]); R(44, y, 8, 2, SK[4]); R(43, y - 1, 10, 1, DK[1]); R(43, y + 12, 10, 1, DK[1]); }
  R(24, 60, 48, 10, ST[3]); R(22, 68, 52, 4, ST[2]); R(24, 54, 48, 2, DK[1]); for (let x = 24; x < 72; x += 8) R(x, 54, 1, 6, DK[1]);
  R(32, 34, 32, 22, SK[4]); R(34, 36, 28, 18, BU[3]); R(40, 38, 16, 14, '#fffbe0'); R(46, 30, 4, 6, DK[1]);
  R.t([28, 34], [68, 34], [48, 10], Rr.roofRed[2]); R.t([34, 33], [48, 33], [48, 14], Rr.roofRed[3]); R(46, 4, 4, 8, ST[2]);
});
// ruined observatory dome
spr('sv4_observatory', 160, 140, (R) => {
  R(6, 118, 148, 18, ST[1]); R(10, 112, 140, 8, ST[2]);
  R(14, 62, 132, 52, ST[3]); R(14, 62, 132, 3, ST[4]); R(14, 112, 132, 2, ST[1]);
  for (let y = 66; y < 112; y += 8) for (let x = 14 + ((y / 8) % 2) * 8; x < 146; x += 16) R(x, y, 15, 1, ST[2]);
  R.e(80, 62, 62, 52, ST[3]); R(18, 62, 124, 8, ST[3]);
  R.e(80, 62, 56, 46, ST[2]); R.e(78, 58, 40, 32, ST[3]);
  R(74, 14, 14, 54, '#2a2640'); R(72, 12, 18, 3, ST[1]);        // the slit
  R(8, 44, 20, 30, 'rgba(0,0,0,0)'); R(110, 20, 32, 40, '#8aa8d8'); R.t([110, 20], [142, 20], [110, 50], '#a0b4d8');   // the missing dome piece (sky)
  R(46, 100, 20, 14, '#2a2640'); R(46, 98, 20, 3, ST[1]);
  R(20, 108, 14, 5, FO[2]); R(110, 106, 22, 6, FO[3]); R(60, 70, 5, 10, FO[2]); R(120, 64, 4, 18, FO[2]);
});
spr('sv4_gear_console', 64, 56, (R) => {
  R(2, 40, 60, 14, ST[1]); R(4, 14, 56, 28, ST[2]); R(4, 14, 56, 3, ST[4]); R(8, 18, 48, 20, '#2a2640');
  for (let i = 0; i < 4; i++) { R.e(18 + i * 10, 28, 4, 4, BU[2]); R.e(18 + i * 10, 28, 2, 2, BU[1]); }
  for (let i = 0; i < 9; i++) R(10 + (i * 5), 20 + (i * 3) % 8, 1, 1, '#fffbe0');
  R(26, 4, 12, 10, BU[1]); R(30, 2, 4, 4, BU[3]);
});
spr('sv4_ruin_pillar', 28, 70, (R) => {
  R(2, 60, 24, 8, ST[1]); R(5, 20, 18, 42, ST[2]); R(5, 20, 5, 42, ST[3]); R(20, 20, 3, 42, ST[1]); R(3, 14, 22, 7, ST[3]); R(8, 8, 6, 6, ST[2]);
  for (let y = 26; y < 58; y += 8) R(5, y, 18, 1, ST[1]); R(8, 40, 4, 12, FO[2]); R(16, 30, 4, 10, FO[3]);
});
spr('sv4_ruin_wall', 64, 40, (R) => {
  R(2, 28, 60, 10, ST[1]); R(2, 12, 40, 18, ST[2]); R(2, 12, 40, 2, ST[4]); R(42, 20, 20, 10, ST[2]); R(10, 14, 1, 14, ST[1]); R(26, 14, 1, 14, ST[1]); R(8, 8, 8, 5, FO[2]); R(48, 18, 8, 3, FO[3]);
});
spr('sv4_cave_arch', 96, 80, (R) => {
  R(0, 30, 96, 48, ST[1]); R.e(48, 70, 36, 38, '#1a1426'); R(12, 70, 72, 10, '#1a1426'); R.e(48, 66, 30, 32, '#241c34');
  R(0, 28, 96, 6, ST[2]); R(10, 22, 76, 8, ST[3]); R(24, 14, 48, 8, ST[2]); R(2, 62, 12, 16, ST[2]); R(82, 60, 12, 18, ST[2]); R(34, 28, 8, 3, FO[2]); R(60, 26, 10, 4, FO[3]);
});

// ---------------------------------------------------------------- props
const sx = (name, w, h, fn, o) => spr(name, w, h, fn, o);
sx('sv4_cat_roof', 18, 14, (R) => {
  R(2, 7, 13, 6, PA[3]); R(2, 7, 13, 1, PA[4]); R.e(14, 6, 3, 3, PA[3]); R(12, 1, 2, 4, PA[3]); R(16, 1, 2, 4, PA[3]); R(13, 5, 1, 1, DK[1]); R(16, 5, 1, 1, DK[1]);
  R(0, 6, 3, 2, PA[3]); R(1, 4, 2, 3, PA[3]); R(4, 8, 4, 2, WD[3]); R(10, 9, 4, 2, WD[3]);
});
sx('sv4_cat_roof_b', 18, 14, (R) => {
  R(2, 7, 13, 6, WD[3]); R(2, 7, 13, 1, WD[4]); R.e(14, 6, 3, 3, WD[3]); R(12, 1, 2, 4, WD[3]); R(16, 1, 2, 4, WD[3]); R(13, 5, 1, 1, DK[1]); R(16, 5, 1, 1, DK[1]);
  R(0, 6, 3, 2, WD[3]); R(1, 3, 2, 4, WD[3]); R(6, 8, 2, 4, DK[3]);
});
sx('sv4_squid_rack', 96, 52, (R) => {
  R(4, 6, 4, 44, DK[2]); R(88, 6, 4, 44, DK[2]); R(2, 4, 92, 4, DK[3]); R(2, 4, 92, 1, DK[4]);
  for (let i = 0; i < 6; i++) { const x = 12 + i * 13; R(x, 8, 1, 4, DK[1]); R(x - 3, 12, 8, 10, PA[3]); R(x - 3, 12, 8, 2, PA[4]); R(x - 2, 22, 6, 12, i % 2 ? PA[2] : CO[3]); for (let t = 0; t < 4; t++) R(x - 2 + t * 2, 34, 1, 5 + (t % 2), PA[2]); }
  R(10, 46, 76, 3, WD[1]);
});
sx('sv4_net', 64, 46, (R) => {
  R(4, 2, 4, 42, DK[2]); R(56, 2, 4, 42, DK[2]); R(2, 2, 60, 3, DK[3]);
  for (let y = 6; y < 40; y += 5) for (let x = 8; x < 56; x += 5) { R(x, y, 5, 1, SK[1]); R(x, y, 1, 5, SK[1]); }
  R(14, 30, 6, 6, MI[2]); R(40, 24, 5, 5, CO[2]);
});
sx('sv4_boat_small', 64, 34, (R) => {
  R(4, 18, 56, 10, WD[2]); R.t([0, 16], [8, 28], [8, 16], WD[3]); R.t([64, 16], [56, 28], [56, 16], WD[3]); R(4, 16, 56, 3, WD[4]); R(6, 26, 52, 2, WD[1]);
  R(30, 2, 3, 16, DK[2]); R.t([34, 3], [34, 15], [50, 15], PA[4]); R(14, 14, 8, 4, SK[2]);
});
sx('sv4_boat_big', 96, 48, (R) => {
  R(6, 26, 84, 14, PA[3]); R.t([0, 22], [12, 40], [12, 22], PA[3]); R(6, 22, 84, 5, PA[4]); R(6, 38, 84, 3, SK[1]); R(10, 32, 76, 2, CO[2]);
  R(40, 4, 22, 20, PA[4]); R(40, 4, 22, 3, SK[2]); R(44, 10, 6, 6, SK[3]); R(54, 10, 6, 6, SK[3]); R(48, 0, 3, 5, DK[2]);
});
sx('sv4_crate_fish', 28, 22, (R) => { R(2, 8, 24, 12, WD[3]); R(2, 8, 24, 2, WD[4]); R(2, 18, 24, 2, WD[1]); R(5, 4, 8, 5, SK[2]); R(14, 3, 8, 6, CO[2]); R(8, 3, 3, 2, PA[4]); });
sx('sv4_barrel', 18, 22, (R) => { R(2, 4, 14, 16, WD[2]); R(2, 4, 14, 2, WD[4]); R(2, 9, 14, 2, DK[2]); R(2, 15, 14, 2, DK[2]); R.e(9, 4, 7, 2, WD[3]); });
sx('sv4_buoy', 16, 22, (R) => { R.e(8, 14, 6, 7, CO[2]); R(2, 12, 12, 3, PA[4]); R(7, 2, 2, 7, DK[1]); R(5, 1, 6, 2, BU[2]); });
sx('sv4_palm', 56, 84, (R) => {
  R(24, 30, 6, 52, WD[2]); R(24, 30, 2, 52, WD[3]); for (let y = 36; y < 80; y += 6) R(24, y, 6, 1, WD[1]);
  for (const [dx, dy, l] of [[-18, 4, 24], [18, 2, 24], [-12, -8, 20], [14, -8, 20], [0, -12, 14]]) { for (let i = 0; i < l; i++) { const x = 27 + Math.round(dx * i / l), y = 30 + Math.round(dy * i / l) + Math.round((i * i) / 18); R(x, y, 4, 2, i % 3 ? FO[3] : FO[2]); } }
  R(22, 30, 4, 4, WD[1]); R(28, 31, 4, 4, WD[1]);
});
sx('sv4_umbrella', 44, 56, (R) => {
  R(21, 14, 3, 40, WD[3]); R.t([2, 20], [42, 20], [22, 4], CO[2]); R.t([2, 20], [22, 20], [22, 4], PA[4]); R(2, 19, 40, 2, CO[1]);
  R(8, 14, 5, 6, CO[2]); R(30, 14, 5, 6, PA[4]);
});
sx('sv4_volley_net', 96, 56, (R) => {
  R(4, 6, 4, 48, WD[3]); R(88, 6, 4, 48, WD[3]); R(4, 6, 88, 2, PA[4]);
  for (let y = 10; y < 30; y += 4) for (let x = 8; x < 88; x += 4) { R(x, y, 4, 1, PA[3]); R(x, y, 1, 4, PA[3]); }
  R(4, 28, 88, 2, PA[4]);
});
sx('sv4_bottle', 14, 18, (R) => { R(5, 1, 4, 4, WD[3]); R(4, 5, 6, 3, MI[3]); R(3, 8, 8, 8, MI[2]); R(4, 9, 2, 5, MI[4]); R(6, 10, 4, 4, PA[3]); R(11, 7, 1, 1, '#ffffff'); });
sx('sv4_chest', 40, 30, (R) => {
  R(2, 12, 36, 16, WD[2]); R(2, 12, 36, 3, WD[3]); R(2, 26, 36, 2, WD[1]); R(2, 4, 36, 10, WD[3]); R.e(20, 4, 18, 3, WD[3]); R(2, 4, 36, 2, WD[4]);
  R(2, 18, 36, 3, BU[1]); R(17, 14, 6, 9, BU[2]); R(19, 17, 2, 3, DK[1]); R(5, 8, 3, 3, MI[2]); R(30, 20, 5, 4, MI[2]);
});
sx('sv4_chest_open', 40, 34, (R) => {
  R(2, 16, 36, 16, WD[2]); R(2, 16, 36, 3, WD[3]); R(2, 30, 36, 2, WD[1]); R(2, 22, 36, 3, BU[1]);
  R(4, 4, 32, 10, WD[3]); R(4, 4, 32, 2, WD[4]); R(6, 10, 28, 4, DK[2]);
  R(8, 12, 24, 6, BU[2]); R(10, 10, 6, 4, BU[3]); R(20, 9, 8, 5, BU[2]); R(14, 8, 3, 3, '#ffffff'); R(26, 11, 3, 3, MI[3]);
});
sx('sv4_moss', 36, 22, (R) => {
  R.e(18, 14, 15, 7, FO[1]); R.e(18, 12, 13, 6, MI[1]); R.e(14, 10, 7, 4, MI[2]); R.e(24, 12, 6, 3, MI[3]); for (let i = 0; i < 9; i++) R(5 + i * 3, 6 + (i * 5) % 7, 2, 2, MI[4]);
});
sx('sv4_moss_lit', 36, 22, (R) => {
  R.e(18, 14, 15, 7, MI[1]); R.e(18, 12, 13, 6, MI[2]); R.e(14, 10, 7, 4, MI[3]); R.e(24, 12, 6, 3, MI[4]); for (let i = 0; i < 9; i++) R(5 + i * 3, 6 + (i * 5) % 7, 2, 2, '#ffffff'); R(16, 4, 3, 3, '#e8fff4');
});
sx('sv4_stall_a', 64, 62, (R) => {
  R(4, 22, 4, 38, DK[2]); R(56, 22, 4, 38, DK[2]); R(6, 40, 52, 18, WD[3]); R(6, 40, 52, 3, WD[4]);
  for (let x = 2; x < 62; x += 8) { R(x, 6, 4, 16, CO[2]); R(x + 4, 6, 4, 16, PA[4]); } R(2, 20, 60, 3, CO[1]);
  R(12, 32, 8, 8, BU[2]); R(24, 31, 8, 9, MI[2]); R(38, 33, 8, 7, SK[2]);
});
sx('sv4_stall_b', 64, 62, (R) => {
  R(4, 22, 4, 38, DK[2]); R(56, 22, 4, 38, DK[2]); R(6, 40, 52, 18, WD[3]); R(6, 40, 52, 3, WD[4]);
  for (let x = 2; x < 62; x += 8) { R(x, 6, 4, 16, MI[2]); R(x + 4, 6, 4, 16, PA[4]); } R(2, 20, 60, 3, MI[1]);
  R(12, 31, 10, 9, BU[3]); R(26, 30, 10, 10, CO[3]); R(40, 32, 8, 8, LI[2]); R(30, 12, 3, 8, BU[2]);
});
sx('sv4_lantern_post', 18, 52, (R) => { R(7, 14, 4, 36, DK[2]); R(7, 14, 1, 36, DK[3]); R(3, 3, 12, 12, BU[2]); R(4, 4, 10, 10, PA[4]); R(3, 3, 12, 2, DK[1]); R(3, 13, 12, 2, DK[1]); R(7, 6, 4, 6, '#fff6c0'); });
sx('sv4_hammock', 64, 40, (R) => { R(2, 6, 4, 32, DK[2]); R(58, 6, 4, 32, DK[2]); for (let x = 6; x < 58; x++) { const y = 14 + Math.round(Math.sin(((x - 6) / 52) * Math.PI) * 9); R(x, y, 1, 4, x % 6 < 3 ? CO[2] : PA[4]); } });
sx('sv4_ferry_sign', 40, 56, (R) => {
  R(18, 24, 4, 30, DK[2]); R(2, 2, 36, 24, DK[2]); R(4, 4, 32, 20, PA[3]); signText(R, 'FERRY', 8, 7, DK[1]); R(6, 15, 28, 1, DK[3]); R(6, 18, 18, 1, DK[3]); R(6, 20, 22, 1, DK[3]);
  R(14, 50, 12, 4, WD[1]);
});
sx('sv4_berth_sign', 40, 52, (R) => {
  R(18, 24, 4, 26, DK[2]); R(2, 2, 36, 24, SK[1]); R(4, 4, 32, 20, SK[3]); signText(R, 'BOATS', 7, 7, SK[0]); R(8, 16, 24, 2, SK[2]); R(12, 19, 16, 2, SK[2]);
});
sx('sv4_post_sign', 24, 44, (R) => { R(10, 12, 4, 30, DK[2]); R(2, 2, 20, 12, WD[3]); R(2, 2, 20, 2, WD[4]); R(5, 6, 14, 1, DK[1]); R(5, 9, 10, 1, DK[1]); });
sx('sv4_bonfire_logs', 40, 28, (R) => { R(4, 18, 32, 5, DK[2]); R(8, 14, 24, 5, WD[2]); R.t([12, 16], [28, 16], [20, 2], CO[2]); R.t([15, 16], [25, 16], [20, 6], BU[2]); R.t([18, 16], [22, 16], [20, 9], '#fffbe0'); });
sx('sv4_stool', 14, 14, (R) => { R.e(7, 4, 6, 3, WD[3]); R(3, 6, 8, 7, WD[2]); });
sx('sv4_bench_s', 40, 24, (R) => { R(2, 8, 36, 5, WD[3]); R(2, 8, 36, 1, WD[4]); R(4, 13, 3, 9, DK[2]); R(33, 13, 3, 9, DK[2]); R(2, 2, 36, 3, WD[2]); });
sx('sv4_arch_garden', 64, 62, (R) => {
  R(4, 22, 8, 38, ST[2]); R(52, 22, 8, 38, ST[2]); R(4, 22, 3, 38, ST[3]); R(2, 14, 60, 10, ST[3]); R(2, 14, 60, 2, ST[4]); for (let x = 6; x < 58; x += 6) R(x, 18 + (x % 8) / 2, 4, 3, x % 12 ? FO[3] : CO[2]);
  R(4, 40, 8, 6, FO[2]); R(52, 34, 8, 8, FO[3]); R(30, 12, 5, 5, LI[3]);
});
sx('sv4_garden_wall', 32, 40, (R) => { R(0, 14, 32, 24, ST[2]); R(0, 14, 32, 3, ST[4]); R(0, 36, 32, 2, ST[1]); for (let x = 0; x < 32; x += 8) R(x, 18, 1, 18, ST[1]); R(4, 10, 8, 5, FO[2]); R(20, 8, 10, 7, FO[3]); });
sx('sv4_boulder', 40, 34, (R) => { R.e(20, 22, 18, 10, ST[1]); R.e(20, 18, 16, 12, ST[2]); R.e(15, 13, 8, 6, ST[3]); R(8, 26, 8, 3, FO[2]); });
sx('sv4_rope_coil', 20, 12, (R) => { R.e(10, 7, 8, 4, WD[3]); R.e(10, 6, 5, 2, WD[2]); R(2, 8, 5, 2, WD[4]); });
sx('sv4_dock_post', 12, 30, (R) => { R(3, 6, 6, 22, DK[2]); R(3, 6, 2, 22, DK[3]); R.e(6, 6, 4, 2, DK[3]); R(2, 14, 8, 2, WD[3]); });
sx('sv4_island_tree', 56, 72, (R) => { R(24, 36, 8, 34, DK[2]); R(24, 36, 3, 34, DK[3]); R.e(28, 24, 24, 20, FO[2]); R.e(24, 20, 16, 14, FO[3]); R.e(36, 28, 12, 10, FO[1]); R(18, 14, 4, 3, FO[4]); });
sx('sv4_sun_lounger', 48, 24, (R) => { R(2, 10, 44, 6, PA[4]); R(2, 10, 44, 1, '#ffffff'); R(2, 4, 12, 7, CO[2]); R(4, 16, 3, 6, DK[2]); R(40, 16, 3, 6, DK[2]); R(14, 10, 20, 6, SK[2]); });

// ---------------------------------------------------------------- generic furniture blocks (interiors), name, w, h, ramp, top tint
const blk = (name, w, h, ramp = WD, top = 5) => sx(name, w, h, (R) => {
  R(0, top, w, h - top, ramp[2]); R(0, top, w, 3, ramp[4]); R(0, top, 2, h - top, ramp[3]); R(w - 3, top, 3, h - top, ramp[1]); R(0, h - 3, w, 3, ramp[0] || ramp[1]);
  R(0, 0, w, top, ramp[3]); R(0, 0, w, 1, ramp[4]);
});
blk('sv4_counter', 96, 36, WD, 6); blk('sv4_counter_s', 64, 36, WD, 6); blk('sv4_shelf', 64, 56, DK, 4); blk('sv4_desk_s', 32, 26, WD, 4); blk('sv4_table_s', 48, 30, WD, 5);
blk('sv4_bed', 48, 40, PA, 8); blk('sv4_board', 96, 40, ST, 0); blk('sv4_pool', 64, 32, SK, 0); blk('sv4_crate_stack', 32, 32, WD, 6);
sx('sv4_blackboard', 96, 36, (R) => { R(0, 0, 96, 34, DK[2]); R(3, 3, 90, 28, FO[0]); signText(R, 'SEA', 8, 8, PA[4]); R(30, 9, 30, 1, PA[3]); R(8, 20, 40, 1, PA[2]); R(8, 24, 24, 1, PA[2]); R(80, 22, 6, 6, CO[2]); });
sx('sv4_rug_r', 96, 48, (R) => { R(0, 0, 96, 48, CO[2]); R(3, 3, 90, 42, PA[4]); R(7, 7, 82, 34, SK[2]); R(48, 12, 4, 24, PA[4]); }, { outline: false });
sx('sv4_window_sea', 48, 36, (R) => { R(0, 0, 48, 34, DK[2]); R(3, 3, 42, 28, SK[3]); R(3, 3, 42, 6, SK[4]); R(3, 20, 42, 11, SK[1]); R(23, 3, 2, 28, DK[2]); R.e(34, 12, 4, 4, '#fffbe0'); });
sx('sv4_telescope_s', 28, 50, (R) => { R(12, 20, 4, 28, DK[2]); R(2, 8, 24, 8, ST[3]); R(2, 8, 24, 2, ST[4]); R(22, 6, 6, 10, BU[2]); R(4, 46, 20, 3, DK[1]); });
sx('sv4_stairs_spiral', 64, 64, (R) => { R.e(32, 36, 28, 20, ST[2]); R.e(32, 32, 28, 20, ST[3]); R.e(32, 28, 18, 12, ST[2]); R.e(32, 26, 8, 6, ST[4]); for (let i = 0; i < 6; i++) R(14 + i * 8, 40 - i * 5, 12, 3, ST[4]); });

// ---------------------------------------------------------------- sea map: the boat under Misa (stern) and the bow strip over her legs
spr('sv4_boat_hull', 34, 18, (R) => {
  R(3, 6, 28, 8, WD[2]); R(3, 6, 28, 2, WD[4]); R.t([0, 6], [5, 14], [5, 6], WD[3]); R.t([34, 6], [29, 14], [29, 6], WD[3]); R(5, 12, 24, 2, WD[1]);
}, { outline: 'selective' });
spr('sv4_boat_rim', 34, 10, (R) => { R(3, 4, 28, 4, WD[3]); R(3, 4, 28, 1, WD[4]); R(3, 7, 28, 1, WD[1]); R.t([0, 3], [5, 8], [5, 3], WD[3]); R.t([34, 3], [29, 8], [29, 3], WD[3]); }, { outline: 'selective' });
spr('sv4_sail', 28, 46, (R) => { R(13, 2, 2, 42, DK[2]); R.t([16, 4], [16, 38], [27, 38], PA[4]); R.t([12, 8], [12, 38], [2, 38], PA[3]); }, { outline: 'selective' });
spr('sv4_buoy_flag', 18, 34, (R) => { R.e(9, 26, 6, 6, CO[2]); R(3, 24, 12, 3, PA[4]); R(8, 4, 2, 20, DK[1]); R(10, 4, 8, 6, BU[2]); R(10, 4, 8, 1, BU[3]); }, { outline: 'selective' });
spr('sv4_drift', 18, 16, (R) => { R.e(9, 10, 7, 4, WD[3]); R(3, 8, 12, 3, WD[4]); R(5, 5, 3, 3, MI[3]); R(11, 4, 2, 4, SK[3]); R(8, 3, 2, 2, '#ffffff'); }, { outline: 'selective' });
spr('sv4_dock_sign', 24, 40, (R) => { R(10, 12, 4, 26, DK[2]); R(2, 2, 20, 12, PA[3]); R(2, 2, 20, 2, PA[4]); R(5, 7, 14, 1, DK[1]); R(5, 10, 10, 1, DK[1]); }, { outline: 'selective' });
spr('sv4_whirl', 28, 12, (R) => { R(2, 5, 24, 2, SK[3]); R(6, 3, 16, 2, SK[4]); R(8, 8, 12, 2, SK[2]); }, { outline: false });
