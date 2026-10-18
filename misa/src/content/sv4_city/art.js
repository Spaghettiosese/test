// Kitaminato art: station props, the train, city facades, the ferris wheel, aquarium/cinema/museum props, pedestrians.
// Every sprite is hd (1 art px = 1 screen px) and drawn with the town toolkit so outlines get their margin.
import { register } from '../../core/registry.js';
import { spr, line, signText, signW, hash } from '../town/lib.js';
import { facade } from '../town/facade.js';
import { RAMPS as K } from '../../gfx/palette.js';

register('tile', 'kc_track', { ground: 'gravel', solid: true });
register('tile', 'kc_platform', { ground: 'plaza' });
register('tile', 'kc_tile_dark', { ground: 'asphalt' });

// ---------------------------------------------------------------- generic builders
const frame = (R, w, h, r) => { R(0, 0, w, h, r[1]); R(1, 1, w - 2, h - 2, r[2]); R(1, 1, w - 2, 1, r[3]); R(1, 1, 1, h - 2, r[3]); R(1, h - 2, w - 2, 1, r[0]); };
// A shelf unit with rows of coloured goods.
function shelf(name, w, h, wood, goods, rows = 3) {
  spr(name, w, h, (R) => {
    frame(R, w, h, wood); const rh = Math.floor((h - 6) / rows);
    for (let r = 0; r < rows; r++) {
      const y = 3 + r * rh; R(3, y + rh - 3, w - 6, 2, wood[0]);
      for (let x = 4, i = 0; x < w - 8; x += 7, i++) { const c = goods[(i + r * 2) % goods.length], gh = 6 + ((i * 5 + r * 3) % 5); R(x, y + rh - 3 - gh, 5, gh, c); R(x, y + rh - 3 - gh, 5, 1, K.paper[4]); R(x + 4, y + rh - 3 - gh, 1, gh, K.ink[2]); }
    }
  });
}
// A stall with a striped awning, goods on the counter and a small sign.
function stall(name, w, h, a, b, goods, text) {
  spr(name, w, h, (R) => {
    R(2, 14, 3, h - 14, K.wood[1]); R(w - 5, 14, 3, h - 14, K.wood[1]);
    for (let i = 0; i < Math.floor(w / 6); i++) { R(1 + i * 6, 3, 6, 11, i % 2 ? b[3] : a[2]); R(1 + i * 6, 14, 6, 2 + (i % 2), i % 2 ? b[2] : a[1]); }
    R(1, 2, w - 2, 2, a[3]);
    R(3, h - 26, w - 6, 20, K.wood[3]); R(3, h - 26, w - 6, 3, K.wood[4]); R(3, h - 8, w - 6, 2, K.wood[1]);
    goods.forEach((c, i) => { R(6 + i * 10, h - 33, 8, 7, c); R(6 + i * 10, h - 33, 8, 2, K.paper[4]); });
    if (text) { const tw = signW(text); R(Math.floor(w / 2) - Math.floor(tw / 2) - 3, h - 22, tw + 6, 9, K.paper[3]); signText(R, text, Math.floor(w / 2) - Math.floor(tw / 2), h - 20, K.ink[1]); }
  });
}
// A glass case (museum / jewellery) with items inside.
function glassCase(name, w, h, goods) {
  spr(name, w, h, (R) => {
    R(0, h - 16, w, 16, K.woodDark[3]); R(0, h - 16, w, 2, K.woodDark[4]); R(0, h - 3, w, 3, K.woodDark[1]);
    R(2, 4, w - 4, h - 20, K.sky[4]); R(2, 4, w - 4, 2, K.paper[4]); R(2, 4, 2, h - 20, K.paper[4]); R(w - 4, 4, 2, h - 20, K.sky[3]);
    R(3, h - 24, w - 6, 8, K.coral[1]);
    goods.forEach((c, i) => { const x = 7 + i * Math.floor((w - 12) / goods.length); R.e(x + 3, h - 29, 4, 5, c); R(x, h - 27, 7, 3, c); R(x + 1, h - 31, 3, 2, K.paper[4]); });
  });
}

// ---------------------------------------------------------------- Hoshimori Station
spr('kc_st_arch', 64, 80, (R, M) => {
  R(2, 22, 60, 56, M.brick[2]); R(2, 22, 60, 3, M.brick[3]); for (let y = 28; y < 76; y += 5) R(2, y, 60, 1, M.brick[1]);
  R(0, 12, 64, 12, M.roofSlate[2]); R(0, 12, 64, 3, M.roofSlate[4]); R(0, 22, 64, 3, M.roofSlate[0]);
  R(12, 28, 40, 12, M.paper[3]); R(12, 28, 40, 1, M.paper[4]); signText(R, 'STATION', 17, 31, M.navy[1]);
  R(22, 44, 20, 34, M.woodDark[1]); R(24, 46, 16, 32, M.sky[2]); R(24, 46, 16, 6, M.sky[3]); R(31, 46, 2, 32, M.metal[2]);
  R(6, 46, 10, 12, M.butter[3]); R(48, 46, 10, 12, M.butter[3]); R(8, 3, 48, 9, M.navy[2]); R(8, 3, 48, 2, M.navy[3]); signText(R, 'KITAMINATO', 11, 5, M.paper[4]);
});
spr('kc_st_gate', 32, 44, (R) => { R(2, 28, 10, 14, K.metal[2]); R(2, 28, 10, 3, K.metal[4]); R(20, 28, 10, 14, K.metal[2]); R(20, 28, 10, 3, K.metal[4]); R(4, 24, 6, 4, K.mint[2]); R(22, 24, 6, 4, K.coral[2]); R(2, 38, 28, 3, K.ink[2]); R(12, 32, 8, 2, K.butter[2]); }, {});
spr('kc_st_board', 48, 58, (R) => {
  R(2, 0, 44, 36, K.navy[1]); R(3, 1, 42, 34, K.navy[2]); R(3, 1, 42, 3, K.navy[3]); signText(R, 'TIMETABLE', 6, 6, K.butter[3]);
  for (let i = 0; i < 4; i++) { R(6, 14 + i * 5, 14, 3, K.paper[3]); R(24, 14 + i * 5, 16, 3, i % 2 ? K.mint[3] : K.sky[3]); }
  R(20, 36, 8, 20, K.metal[2]); R(14, 54, 20, 3, K.metal[1]);
});
spr('kc_st_kiosk', 64, 58, (R) => {
  R(2, 18, 60, 38, K.sky[2]); R(2, 18, 60, 3, K.sky[3]); R(0, 6, 64, 14, K.coral[2]); for (let i = 0; i < 8; i++) if (i % 2) R(i * 8, 6, 8, 14, K.paper[3]); R(0, 6, 64, 2, K.coral[3]);
  R(6, 28, 52, 12, K.paper[3]); R(6, 28, 52, 2, K.paper[4]); R(10, 22, 6, 6, K.butter[3]); R(20, 22, 6, 6, K.coral[3]); R(30, 22, 6, 6, K.mint[3]); R(42, 22, 8, 6, K.lilac[3]);
  R(2, 40, 60, 14, K.wood[3]); R(2, 40, 60, 2, K.wood[4]); signText(R, 'KIOSK', 22, 10, K.paper[4]);
});
spr('kc_rails', 32, 22, (R) => { R(0, 4, 32, 3, K.metal[1]); R(0, 4, 32, 1, K.metal[3]); R(0, 15, 32, 3, K.metal[1]); R(0, 15, 32, 1, K.metal[3]); for (let x = 2; x < 32; x += 8) R(x, 1, 4, 20, K.woodDark[2]); }, { outline: false });
spr('kc_platform_edge', 32, 8, (R) => { R(0, 0, 32, 8, K.butter[3]); for (let x = 0; x < 32; x += 4) R(x, 1, 2, 6, K.butter[1]); R(0, 7, 32, 1, K.butter[0]); }, { outline: false });
spr('kc_st_pillar', 20, 100, (R) => { R(5, 6, 10, 90, K.metal[2]); R(5, 6, 3, 90, K.metal[4]); R(12, 6, 3, 90, K.metal[1]); R(0, 0, 20, 8, K.navy[2]); R(2, 94, 16, 4, K.metal[1]); });
function train(name, open) {
  spr(name, 300, 78, (R) => {
    for (let c = 0; c < 3; c++) {
      const x = c * 100; R(x + 1, 10, 97, 54, K.paper[4]); R(x + 1, 10, 97, 4, K.paper[3]); R(x + 1, 38, 97, 5, K.sky[2]); R(x + 1, 43, 97, 2, K.sky[1]); R(x + 1, 60, 97, 5, K.metal[1]);
      R(x + 1, 6, 97, 5, K.metal[3]); R(x + 20, 3, 24, 4, K.metal[2]); R(x + 55, 3, 18, 4, K.metal[2]);
      for (let w = 0; w < 4; w++) { const wx = x + 8 + w * 22; if ((w === 0 || w === 3) && open) { R(wx - 1, 17, 17, 43, K.butter[3]); R(wx + 1, 19, 13, 41, K.butter[4]); } else { R(wx, 18, 15, 17, K.sky[1]); R(wx, 18, 15, 17, K.sky[3]); R(wx, 18, 15, 3, K.sky[4]); R(wx + 3, 25, 2, 6, K.paper[4]); } }
      R(x, 14, 1, 48, K.metal[1]); R(x + 98, 14, 1, 48, K.metal[1]);
      R(x + 4, 66, 20, 8, K.charcoal[2]); R(x + 74, 66, 20, 8, K.charcoal[2]); R(x + 6, 68, 5, 5, K.metal[3]); R(x + 80, 68, 5, 5, K.metal[3]);
    }
    R(1, 9, 3, 3, K.vermilion[2]); R(296, 9, 3, 3, K.vermilion[2]); R(260, 22, 36, 16, K.butter[3]); R(284, 50, 12, 4, K.butter[4]);
  });
}
train('kc_train_a', false); train('kc_train_b', true);

// ---------------------------------------------------------------- big city props
spr('kc_fountain', 160, 96, (R, M) => {
  R.e(80, 70, 76, 24, M.stone[3]); R.e(80, 68, 76, 22, M.stone[5]); R.e(80, 68, 70, 19, M.sky[3]); R.e(80, 69, 62, 16, M.sky[2]); R.e(60, 66, 20, 5, M.sky[4]);
  R.e(80, 62, 28, 9, M.stone[4]); R(70, 36, 20, 28, M.stone[4]); R(70, 36, 6, 28, M.stone[5]); R(84, 36, 6, 28, M.stone[2]); R.e(80, 36, 18, 5, M.stone[3]); R.e(80, 35, 15, 4, M.sky[3]);
  R(76, 14, 8, 22, M.stone[4]); R.e(80, 14, 6, 3, M.stone[5]); R.e(80, 8, 3, 3, M.sky[4]);
  for (let a = 0; a < 8; a++) { const x = 80 + Math.round(Math.cos(a * 0.785) * 62), y = 70 + Math.round(Math.sin(a * 0.785) * 18); R(x - 2, y - 4, 4, 5, M.stone[4]); }
});
spr('kc_fountain_win', 160, 96, (R, M) => { // frozen over in winter
  R.e(80, 70, 76, 24, M.stone[3]); R.e(80, 68, 76, 22, M.stone[5]); R.e(80, 68, 70, 19, M.snow[4]); R(70, 36, 20, 28, M.stone[4]); R.e(80, 36, 18, 5, M.snow[4]); R(76, 14, 8, 22, M.stone[4]); R.e(80, 12, 8, 5, M.snow[4]);
});
spr('kc_info', 64, 62, (R) => {
  R(2, 18, 60, 42, K.mint[2]); R(2, 18, 60, 3, K.mint[3]); R(0, 6, 64, 14, K.sky[2]); R(0, 6, 64, 2, K.sky[4]); signText(R, 'INFO', 24, 10, K.paper[4]);
  R(6, 28, 52, 10, K.paper[3]); R(8, 24, 8, 4, K.coral[2]); R(40, 24, 14, 4, K.butter[3]); R(2, 44, 60, 14, K.wood[3]); R(2, 44, 60, 2, K.wood[4]);
});
spr('kc_subway_sign', 36, 66, (R) => { R(16, 14, 4, 50, K.metal[2]); R(8, 0, 20, 20, K.navy[2]); R(8, 0, 20, 3, K.navy[4]); R.e(18, 10, 6, 6, K.paper[4]); R(16, 6, 4, 8, K.navy[2]); R(13, 9, 10, 2, K.navy[2]); R(10, 62, 16, 3, K.metal[1]); });
spr('kc_subway_stairs', 56, 46, (R) => { R(0, 0, 56, 46, K.stone[3]); R(4, 4, 48, 38, K.charcoal[1]); for (let i = 0; i < 6; i++) { R(6 + i * 2, 6 + i * 6, 44 - i * 4, 5, K.stone[2 + (i % 2)]); } R(0, 0, 4, 46, K.metal[2]); R(52, 0, 4, 46, K.metal[2]); R(0, 0, 56, 3, K.metal[3]); });
spr('kc_planter_big', 40, 34, (R, M) => { R(2, 14, 36, 18, M.stone[3]); R(2, 14, 36, 3, M.stone[5]); R(4, 17, 32, 13, M.woodDark[2]); for (let i = 0; i < 7; i++) { R.e(7 + i * 5, 12 - (i % 3), 4, 5, M.leaf[2 + (i % 2)]); R(6 + i * 5, 6 - (i % 3), 2, 2, M.flower[i % M.flower.length]); } });
spr('kc_street_clock', 26, 84, (R) => { R(11, 24, 4, 58, K.metal[1]); R(11, 24, 1, 58, K.metal[3]); R.e(13, 14, 11, 11, K.metal[1]); R.e(13, 14, 9, 9, K.paper[4]); R(13, 8, 1, 7, K.ink[1]); R(13, 14, 5, 1, K.ink[1]); R(7, 78, 12, 4, K.metal[1]); });
spr('kc_ped_stand', 14, 4, (R) => { R(1, 1, 12, 2, K.ink[2]); }, { outline: false });

// pedestrians: 6 palettes x 2 walk frames
const PED = [['#e0707a', '#3a3850', '#4a3436'], ['#7fb2e0', '#3f4c70', '#2a203a'], ['#ffd76a', '#5a4a3a', '#b98262'], ['#86cdb0', '#3a3850', '#141220'], ['#b89ae0', '#2a3552', '#8b5a44'], ['#f4f0f0', '#4a4a66', '#d6508c']];
PED.forEach(([top, bot, hair], i) => [0, 1].forEach((f) => spr(`kc_ped_${i}_${f}`, 16, 30, (R) => {
  R(4, 27, 8, 2, K.ink[2]); R(5, 18, 3, 9 + (f ? -1 : 0), bot); R(8, 18, 3, 9 + (f ? 0 : -1), bot); R(4, 9, 8, 10, top); R(4, 9, 8, 2, K.paper[4]);
  R(2, 10 + f, 2, 7, top); R(12, 11 - f, 2, 7, top); R.e(8, 5, 4, 4, '#f2c9a4'); R(4, 1, 8, 4, hair); R(4, 3, 2, 5, hair);
}, { outline: 'ink' })));

// ---------------------------------------------------------------- harbour walk
const ferris = (name, ang) => spr(name, 150, 182, (R, M) => {
  const cx = 75, cy = 78, rr = 66;
  R(cx - 38, 168, 76, 8, M.metal[1]); R.t([cx - 34, 170], [cx - 4, 170], [cx - 2, cy], M.metal[2]); R.t([cx + 34, 170], [cx + 4, 170], [cx + 2, cy], M.metal[1]);
  for (let i = 0; i < 3; i++) { const t = rr * (0.33 * (i + 1)); for (let a = 0; a < 40; a++) { const q = (a / 40) * Math.PI * 2; R(Math.round(cx + Math.cos(q) * t), Math.round(cy + Math.sin(q) * t), 1, 1, M.metal[3]); } }
  for (let a = 0; a < 160; a++) { const q = (a / 160) * Math.PI * 2; R(Math.round(cx + Math.cos(q) * rr), Math.round(cy + Math.sin(q) * rr), 2, 2, M.butter[3]); }
  for (let i = 0; i < 8; i++) {
    const q = ang + (i * Math.PI) / 4, x = Math.round(cx + Math.cos(q) * rr), y = Math.round(cy + Math.sin(q) * rr);
    line(R, cx, cy, x, y, M.metal[3], 1);
    R(x - 6, y + 1, 13, 10, [M.coral, M.sky, M.butter, M.mint][i % 4][2]); R(x - 6, y + 1, 13, 2, M.paper[4]); R(x - 5, y + 4, 11, 4, K.sky[4]);
  }
  R.e(cx, cy, 5, 5, M.metal[2]); R.e(cx, cy, 2, 2, M.butter[3]);
});
[0, 1, 2, 3].forEach((i) => ferris('kc_ferris_' + i, i * 0.196));
spr('kc_ferris_booth', 48, 54, (R) => { R(2, 16, 44, 36, K.coral[2]); R(2, 16, 44, 3, K.coral[3]); R(0, 8, 48, 10, K.butter[3]); R(6, 24, 36, 12, K.sky[3]); signText(R, 'FERRIS', 10, 11, K.coral[1]); R(2, 42, 44, 10, K.wood[3]); });
spr('kc_boardwalk_rail', 32, 24, (R) => { R(0, 6, 32, 3, K.paper[3]); R(0, 6, 32, 1, K.paper[4]); for (let x = 2; x < 32; x += 10) R(x, 6, 3, 17, K.paper[2]); R(0, 20, 32, 3, K.paper[2]); }, {});
spr('kc_boat', 90, 52, (R) => { R(8, 30, 74, 14, K.paper[4]); R(4, 28, 12, 8, K.paper[3]); R(8, 40, 74, 4, K.navy[2]); R(30, 14, 30, 16, K.paper[3]); R(34, 18, 6, 6, K.sky[2]); R(44, 18, 6, 6, K.sky[2]); R(46, 4, 6, 10, K.coral[2]); R(36, 8, 2, 8, K.metal[2]); });
stall('kc_stall_taco', 64, 58, K.coral, K.paper, [K.butter[3], K.coral[3], K.wood[4], K.butter[2]], 'TAKO');
stall('kc_stall_drink', 64, 58, K.sky, K.paper, [K.mint[3], K.sky[3], K.butter[3], K.lilac[3]], 'DRINKS');
stall('kc_stall_flower', 64, 58, K.mint, K.paper, [K.coral[3], K.butter[3], K.lilac[3], K.sakura ? K.sakura[3] : K.coral[2]], 'FLOWER');
stall('kc_stall_photo', 64, 58, K.lilac, K.paper, [K.metal[3], K.sky[3], K.paper[4], K.coral[3]], 'PHOTO');
spr('kc_balloon', 22, 44, (R) => { R(10, 22, 1, 20, K.ink[3]); R.e(10, 11, 8, 10, K.ribbon[2]); R.e(7, 8, 3, 4, K.ribbon[4]); R.t([8, 21], [13, 21], [10, 25], K.ribbon[1]); });
spr('kc_kid', 24, 40, (R) => { R(8, 31, 3, 5, K.denim[3]); R(13, 31, 3, 5, K.denim[3]); R(7, 20, 10, 12, K.butter[3]); R(7, 20, 10, 2, K.butter[4]); R(5, 22, 3, 8, K.butter[2]); R(16, 22, 3, 8, K.butter[2]); R.e(12, 14, 6, 6, '#f2c9a4'); R(6, 6, 12, 5, K.hairBlack[2]); R(7, 12, 2, 2, K.ink[1]); R(14, 12, 2, 2, K.ink[1]); R(11, 17, 3, 1, K.coral[2]); }, { outline: 'ink' });
spr('kc_parcel', 26, 20, (R) => { R(2, 4, 22, 14, K.wood[3]); R(2, 4, 22, 3, K.wood[4]); R(11, 4, 4, 14, K.coral[2]); R(2, 10, 22, 2, K.wood[1]); R(16, 8, 6, 4, K.paper[4]); });

// cats of the alley colony
const cat = (name, base, dark, pose) => spr(name, 26, 22, (R) => {
  if (pose === 'sit') { R.e(13, 15, 6, 6, base); R(8, 4, 10, 10, base); R.t([8, 5], [10, 0], [12, 5], base); R.t([14, 5], [17, 0], [18, 5], base); R(10, 8, 2, 2, K.ink[1]); R(15, 8, 2, 2, K.ink[1]); R(12, 11, 3, 1, K.coral[2]); R(4, 17, 6, 3, dark); R(18, 13, 4, 7, dark); }
  else if (pose === 'loaf') { R.e(13, 14, 10, 6, base); R(4, 8, 9, 8, base); R.t([4, 9], [6, 4], [8, 9], base); R.t([10, 9], [12, 4], [13, 9], base); R(6, 11, 2, 2, K.ink[1]); R(10, 11, 2, 2, K.ink[1]); R(16, 10, 6, 4, dark); }
  else { R.e(13, 16, 10, 4, base); R(4, 11, 7, 7, base); R.t([4, 12], [6, 8], [8, 12], base); R(5, 14, 4, 1, K.ink[1]); R(14, 12, 6, 3, dark); R(20, 16, 4, 2, dark); }
}, { outline: 'ink' });
cat('kc_cat_a', K.paper[4], K.metal[3], 'sit'); cat('kc_cat_b', K.hairGinger[2], K.hairGinger[1], 'loaf'); cat('kc_cat_c', K.charcoal[3], K.charcoal[1], 'sleep'); cat('kc_cat_d', K.butter[3], K.wood[3], 'sit');
spr('kc_torii', 72, 84, (R, M) => { R(6, 18, 8, 64, M.vermilion[2]); R(58, 18, 8, 64, M.vermilion[2]); R(6, 18, 3, 64, M.vermilion[3]); R(58, 18, 3, 64, M.vermilion[3]); R(0, 6, 72, 8, M.vermilion[2]); R(0, 6, 72, 3, M.vermilion[3]); R(4, 18, 64, 5, M.vermilion[1]); R(2, 26, 68, 4, M.vermilion[1]); R(4, 78, 10, 4, M.stone[2]); R(58, 78, 10, 4, M.stone[2]); R(30, 14, 12, 12, M.woodDark[2]); });
spr('kc_temple', 160, 120, (R, M) => {
  R(14, 76, 132, 42, M.woodDark[2]); R(14, 76, 132, 3, M.woodDark[4]); for (let x = 20; x < 140; x += 22) R(x, 80, 3, 36, M.vermilion[2]);
  R(20, 94, 120, 22, M.paper[3]); R(70, 92, 20, 26, M.woodDark[1]); R(72, 94, 16, 24, M.woodDark[3]);
  R.t([0, 78], [160, 78], [80, 30], M.roofSlate[2]); R.t([10, 76], [150, 76], [80, 34], M.roofSlate[3]); for (let y = 40; y < 76; y += 6) R(80 - (y - 30) * 1.55, y, (y - 30) * 3.1, 1, M.roofSlate[1]);
  R(0, 76, 160, 5, M.roofSlate[0]); R(76, 18, 8, 14, M.butter[2]); R.e(80, 34, 5, 4, M.butter[3]);
});
spr('kc_tea_lantern', 20, 56, (R) => { R(8, 24, 4, 30, K.woodDark[2]); R.e(10, 14, 8, 10, K.coral[2]); R(4, 8, 12, 2, K.ink[2]); R(4, 20, 12, 2, K.ink[2]); R(6, 12, 8, 8, K.butter[4]); signText(R, 'A', 8, 12, K.ribbon[1]); });

// ---------------------------------------------------------------- aquarium, cinema, museum, game centre, hotel, ramen
const tank = (name, w, h, fr) => spr(name, w, h, (R) => {
  R(0, 0, w, h, K.navy[0]); R(2, 2, w - 4, h - 6, K.sky[2]); R(2, 2, w - 4, 6, K.sky[3]); for (let y = 8; y < h - 6; y += 6) R(2, y, w - 4, 3, K.sky[1 + ((y / 6) % 2)]);
  R(2, h - 12, w - 4, 8, K.sand ? K.sand[3] : K.butter[2]); for (let i = 0; i < 5; i++) { R(6 + i * 18, h - 20, 3, 10, K.forest[3]); R(8 + i * 18, h - 24, 2, 14, K.forest[2]); }
  for (let i = 0; i < 5; i++) { const x = 8 + ((i * 29 + fr * 8 * (i % 2 ? 1 : -1)) % (w - 20)), y = 10 + (i * 11) % (h - 36); R.e(Math.abs(x), y, 5, 3, [K.coral, K.butter, K.mint, K.lilac, K.sky][i][3]); R.t([Math.abs(x) + 5, y], [Math.abs(x) + 9, y - 3], [Math.abs(x) + 9, y + 3], [K.coral, K.butter, K.mint, K.lilac, K.sky][i][2]); R(Math.abs(x) - 2, y - 1, 1, 1, K.ink[0]); }
  R(0, 0, w, 2, K.metal[3]); R(0, h - 4, w, 4, K.metal[2]);
});
tank('kc_tank_0', 96, 64, 0); tank('kc_tank_1', 96, 64, 1); tank('kc_tank_big_0', 160, 80, 0); tank('kc_tank_big_1', 160, 80, 1);
spr('kc_tunnel_arch', 64, 64, (R) => { R(0, 0, 64, 64, K.navy[1]); R.e(32, 38, 28, 26, K.sky[2]); R.e(32, 38, 26, 24, K.sky[1]); R.e(32, 40, 22, 20, K.sky[2]); for (let i = 0; i < 4; i++) R.e(18 + i * 9, 30 + (i % 2) * 8, 4, 2, K.butter[3]); R(26, 28, 12, 4, K.mint[3]); R(0, 60, 64, 4, K.navy[0]); });
spr('kc_screen', 192, 70, (R) => { R(0, 0, 192, 70, K.charcoal[1]); R(4, 4, 184, 58, K.paper[4]); R(4, 4, 184, 6, K.paper[3]); R(0, 62, 192, 6, K.coral[1]); R(8, 62, 8, 6, K.coral[2]); });
spr('kc_seat_row', 96, 32, (R) => { for (let i = 0; i < 4; i++) { const x = i * 24; R(x + 2, 6, 20, 18, K.ribbon[1]); R(x + 2, 6, 20, 4, K.ribbon[2]); R(x + 4, 14, 16, 10, K.ribbon[2]); R(x, 14, 3, 12, K.ribbon[0]); R(x + 21, 14, 3, 12, K.ribbon[0]); } });
spr('kc_popcorn', 36, 48, (R) => { R(8, 22, 20, 24, K.paper[4]); for (let i = 0; i < 5; i++) R(8 + i * 4, 22, 2, 24, K.ribbon[2]); for (let i = 0; i < 7; i++) R.e(10 + i * 3, 20 - (i % 3) * 2, 3, 3, K.butter[4]); });
spr('kc_poster', 36, 50, (R) => { R(0, 0, 36, 50, K.charcoal[1]); R(2, 2, 32, 46, K.lilac[2]); R(2, 2, 32, 18, K.sky[2]); R.e(18, 24, 9, 9, K.butter[3]); R(8, 38, 20, 3, K.paper[4]); R(11, 43, 14, 2, K.paper[3]); }, {});
spr('kc_capsule', 80, 76, (R) => { for (let r = 0; r < 2; r++) { const y = r * 36; R(0, y + 2, 80, 32, K.metal[3]); R(0, y + 2, 80, 3, K.metal[4]); R(4, y + 7, 60, 22, K.charcoal[1]); R(6, y + 9, 56, 18, K.paper[3]); R(6, y + 9, 56, 4, K.sky[3]); R(66, y + 8, 10, 20, K.charcoal[2]); R(68, y + 10, 6, 4, K.mint[3]); R(0, y + 32, 80, 3, K.metal[1]); } });
spr('kc_locker_row', 96, 60, (R) => { for (let i = 0; i < 6; i++) { R(i * 16, 2, 15, 56, K.metal[2]); R(i * 16, 2, 15, 3, K.metal[4]); R(i * 16 + 3, 8, 9, 22, K.metal[3]); R(i * 16 + 3, 34, 9, 18, K.metal[3]); R(i * 16 + 10, 20, 2, 3, K.butter[3]); } });
spr('kc_ramen_counter', 128, 48, (R) => {
  R(0, 16, 128, 30, K.wood[3]); R(0, 16, 128, 5, K.wood[4]); R(0, 42, 128, 4, K.wood[1]);
  for (let i = 0; i < 4; i++) { const x = 8 + i * 30; R.e(x + 10, 16, 9, 3, K.paper[4]); R.e(x + 10, 14, 8, 2, K.butter[3]); R(x + 6, 12, 2, 2, K.coral[2]); R(x + 11, 11, 3, 2, K.forest[3]); }
  R(52, 0, 24, 14, K.paper[3]); R(54, 2, 20, 10, K.metal[2]); R(54, 2, 20, 2, K.metal[4]);
});
spr('kc_noren_ramen', 96, 42, (R) => { R(0, 0, 96, 4, K.woodDark[2]); for (let i = 0; i < 4; i++) { R(2 + i * 23, 4, 21, 34, K.ribbon[2]); R(2 + i * 23, 4, 2, 34, K.ribbon[3]); R(2 + i * 23, 36, 21, 2, K.ribbon[1]); } signText(R, 'RAMEN', 34, 14, K.paper[4]); });
spr('kc_claw', 52, 76, (R) => { R(0, 0, 52, 76, K.coral[2]); R(2, 2, 48, 52, K.sky[4]); R(2, 2, 48, 4, K.paper[4]); R(24, 4, 4, 18, K.metal[2]); R.t([18, 22], [34, 22], [26, 36], K.metal[3]); for (let i = 0; i < 5; i++) R.e(9 + i * 8, 46, 4, 5, [K.butter, K.mint, K.lilac, K.coral, K.sky][i][3]); R(2, 56, 48, 8, K.charcoal[2]); R(8, 58, 8, 4, K.butter[3]); R.e(36, 60, 3, 3, K.ribbon[2]); R(2, 66, 48, 8, K.coral[1]); });
spr('kc_photo_booth', 44, 70, (R) => { R(0, 0, 44, 70, K.lilac[2]); R(0, 0, 44, 4, K.lilac[4]); R(4, 8, 36, 16, K.charcoal[1]); signText(R, 'PURI', 8, 13, K.butter[3]); R(6, 28, 32, 36, K.lilac[1]); R(8, 30, 28, 34, K.coral[3]); R(2, 66, 40, 4, K.lilac[0]); });
spr('kc_rack_dress', 44, 60, (R) => { R(2, 8, 40, 3, K.metal[2]); R(4, 11, 2, 46, K.metal[1]); R(38, 11, 2, 46, K.metal[1]); for (let i = 0; i < 5; i++) { const c = [K.coral, K.sky, K.butter, K.lilac, K.mint][i]; R(7 + i * 6, 11, 5, 26, c[2]); R(7 + i * 6, 11, 5, 3, c[4]); R(7 + i * 6, 34, 5, 3, c[1]); } R(2, 55, 40, 3, K.metal[1]); });
spr('kc_dressform', 26, 56, (R) => { R.e(13, 12, 7, 9, K.paper[3]); R(8, 20, 10, 18, K.coral[2]); R(5, 24, 16, 18, K.coral[2]); R(5, 24, 16, 3, K.coral[4]); R(12, 42, 2, 12, K.wood[2]); R(6, 52, 14, 3, K.wood[2]); });
spr('kc_plush', 32, 34, (R) => { R.e(16, 22, 11, 9, K.hairGinger[3]); R.e(16, 11, 8, 8, K.hairGinger[3]); R(7, 3, 5, 5, K.hairGinger[2]); R(20, 3, 5, 5, K.hairGinger[2]); R(12, 10, 2, 2, K.ink[1]); R(18, 10, 2, 2, K.ink[1]); R(15, 14, 3, 2, K.coral[2]); });
glassCase('kc_case_a', 56, 52, [K.butter[3], K.sky[3], K.coral[3], K.mint[3]]); glassCase('kc_case_b', 56, 52, [K.lilac[3], K.metal[3], K.paper[4]]);
spr('kc_fossil', 100, 76, (R) => { R(8, 60, 84, 12, K.stone[3]); R(8, 60, 84, 3, K.stone[5]); R.e(50, 36, 38, 22, K.paper[3]); for (let i = 0; i < 9; i++) { R(16 + i * 8, 22, 3, 36, K.paper[4]); R(16 + i * 8, 22, 3, 2, K.paper[3]); } R(48, 12, 8, 40, K.paper[4]); R.e(86, 34, 8, 6, K.paper[4]); R(88, 30, 3, 3, K.ink[1]); R(10, 40, 18, 6, K.paper[3]); });
spr('kc_painting', 52, 42, (R) => { R(0, 0, 52, 42, K.woodDark[2]); R(3, 3, 46, 36, K.sky[3]); R(3, 3, 46, 14, K.sky[4]); R.t([3, 39], [24, 14], [46, 39], K.forest[2]); R.e(38, 11, 4, 4, K.butter[3]); }, {});
spr('kc_exhibit_sign', 40, 54, (R) => { R(18, 24, 4, 28, K.metal[1]); R(2, 0, 36, 26, K.paper[3]); R(2, 0, 36, 3, K.paper[4]); R(5, 7, 30, 2, K.ink[2]); R(5, 12, 24, 2, K.ink[3]); R(5, 17, 28, 2, K.ink[3]); R(8, 50, 24, 3, K.metal[1]); });
spr('kc_map_board', 56, 56, (R) => { R(2, 0, 52, 40, K.woodDark[2]); R(4, 2, 48, 36, K.paper[3]); R(8, 8, 18, 10, K.forest[3]); R(30, 14, 16, 12, K.sky[3]); R(10, 24, 30, 3, K.metal[2]); R.e(40, 8, 3, 3, K.ribbon[2]); R(26, 40, 4, 14, K.metal[1]); R(18, 52, 20, 3, K.metal[1]); });
spr('kc_uni_sign', 70, 50, (R) => { R(4, 0, 62, 36, K.stone[4]); R(4, 0, 62, 4, K.stone[5]); R(8, 10, 54, 20, K.navy[2]); signText(R, 'UNIVERSITY', 11, 17, K.paper[4]); R(2, 36, 66, 10, K.stone[3]); });
spr('kc_pet_cage', 48, 44, (R) => { R(0, 18, 48, 24, K.wood[3]); R(0, 18, 48, 3, K.wood[4]); for (let x = 4; x < 46; x += 6) R(x, 4, 1, 16, K.metal[2]); R(0, 3, 48, 2, K.metal[3]); R.e(14, 14, 5, 4, K.paper[4]); R(11, 8, 2, 4, K.paper[4]); R.e(34, 15, 5, 3, K.hairGinger[3]); });
shelf('kc_shelf_pen', 56, 64, K.wood, [K.sky[3], K.coral[3], K.butter[3], K.mint[3], K.lilac[3]]);
shelf('kc_shelf_gadget', 56, 64, K.metal, [K.charcoal[3], K.sky[3], K.ribbon[2], K.mint[3]]);
shelf('kc_shelf_import', 56, 64, K.woodDark, [K.butter[3], K.coral[3], K.forest[3], K.paper[4], K.ribbon[2]]);
shelf('kc_shelf_vintage', 56, 64, K.woodDark, [K.brick[3], K.butter[2], K.sky[2], K.paper[3], K.lilac[2]]);
shelf('kc_shelf_book', 56, 70, K.wood, [K.navy[3], K.ribbon[2], K.forest[3], K.butter[3], K.lilac[3], K.paper[3]], 4);

// ---------------------------------------------------------------- facades (storefronts and city blocks)
const SHOP = (o) => ({ w: 5, top: 10, roofH: 16, wallH: 104, roof: 'flat', posts: true, ...o });
export const SHOPFRONTS = [
  ['stationery', 'Stationery', 'lilac', 'plaster'], ['electronics', 'Electronics', 'navy', 'plaster'], ['import', 'Import foods', 'butter', 'plaster'], ['vintage', 'Vintage', 'wood', 'siding'],
  ['pet', 'Pet shop', 'mint', 'plaster'], ['boutique', 'Boutique', 'coral', 'plaster'], ['sweets', 'Sweets', 'coral', 'plaster'], ['florist', 'Florist', 'forest', 'plaster'],
  ['bakery', 'Bakery', 'butter', 'plaster'], ['toys', 'Toys', 'sky', 'plaster'], ['optician', 'Optician', 'sky', 'plaster'], ['camera', 'Camera', 'charcoal', 'plaster'],
];
for (const [id, label, ramp, wall] of SHOPFRONTS) {
  const text = label.length > 12 ? label.slice(0, 12) : label;
  facade(`kc_shop_${id}`, SHOP({ wall, wallRamp: wall === 'siding' ? 'woodDark' : 'paper', door: { x: 66, style: 'glass' },
    windows: [{ x: 10, y: 56, w: 46, h: 34, shop: true }, { x: 108, y: 56, w: 46, h: 34, shop: true }, { x: 12, y: 8, curtain: ramp === 'wood' ? 'butter' : ramp }, { x: 112, y: 8, curtain: ramp === 'wood' ? 'butter' : ramp }],
    awnings: [{ x: 4, w: 156, y: 44, a: ramp === 'wood' ? 'coral' : ramp, b: 'paper' }], signs: [{ text, y: 52, ramp: ramp === 'wood' ? 'woodDark' : ramp, light: true, ink: ramp === 'wood' ? 'woodDark' : ramp, inkI: 0 }] }));
}
facade('kc_f_bookstore', SHOP({ wall: 'brick', wallRamp: 'brick', door: { x: 66, style: 'wood', ramp: 'woodDark' }, windows: [{ x: 10, y: 56, w: 46, h: 34, shop: true }, { x: 108, y: 56, w: 46, h: 34, shop: true }, { x: 20, y: 8, curtain: 'butter' }, { x: 112, y: 8, curtain: 'butter' }], awnings: [{ x: 4, w: 156, y: 44, a: 'navy', b: 'paper' }], signs: [{ text: 'Bunta Books', y: 52, ramp: 'navy' }] }));
facade('kc_f_gamecentre', SHOP({ wall: 'plaster', wallRamp: 'charcoal', door: { x: 66, style: 'slide' }, windows: [{ x: 8, y: 56, w: 46, h: 34, shop: true }, { x: 110, y: 56, w: 46, h: 34, shop: true }, { x: 20, y: 8, curtain: 'lilac' }, { x: 112, y: 8, curtain: 'lilac' }], awnings: [{ x: 4, w: 156, y: 44, a: 'lilac', b: 'butter' }], signs: [{ text: 'Game Centre', y: 52, ramp: 'lilac', light: true, ink: 'ribbon' }] }));
facade('kc_f_ramen_gate', SHOP({ wall: 'siding', wallRamp: 'woodDark', door: { x: 66, style: 'double', ramp: 'woodDark' }, windows: [{ x: 14, y: 56, w: 40, h: 34, shop: true }, { x: 110, y: 56, w: 40, h: 34, shop: true }, { x: 66, y: 8, curtain: 'coral' }], noren: [{ x: 14, w: 40, y: 58, ramp: 'ribbon', text: 'RAMEN' }, { x: 110, w: 40, y: 58, ramp: 'ribbon', text: 'RAMEN' }], signs: [{ text: 'Ramen Street', y: 44, ramp: 'ribbon' }] }));
facade('kc_f_hotel', { w: 6, top: 12, roofH: 18, wallH: 120, wall: 'plaster', wallRamp: 'sky', roof: 'flat', posts: false, door: { x: 82, style: 'glass' },
  windows: [8, 56, 112, 152].flatMap((x) => [{ x, y: 8, w: 26, h: 24 }, { x, y: 48, w: 26, h: 24 }]), signs: [{ text: 'Capsule Hotel', y: 88, ramp: 'navy', light: true, ink: 'navy', inkI: 0 }] });
facade('kc_f_tea', SHOP({ w: 6, wall: 'siding', wallRamp: 'woodDark', door: { x: 82, style: 'wood' }, windows: [{ x: 14, y: 56, w: 44, h: 32, shop: true }, { x: 124, y: 56, w: 44, h: 32, shop: true }, { x: 82, y: 8, curtain: 'mint' }], noren: [{ x: 76, w: 40, y: 58, ramp: 'navy' }], signs: [{ text: 'Tea house', y: 44, ramp: 'forest' }] }));
facade('kc_f_tea_b', SHOP({ w: 5, wall: 'siding', wallRamp: 'wood', roof: 'kawara', roofH: 48, top: 4, wallH: 84, door: { x: 66, style: 'wood' }, windows: [{ x: 12, y: 40, w: 40, h: 32, shop: true }, { x: 108, y: 40, w: 40, h: 32, shop: true }], noren: [{ x: 60, w: 40, y: 42, ramp: 'forest' }], signs: [{ text: 'Sweets and tea', y: 30, ramp: 'wood' }] }));
facade('kc_f_dept', { w: 10, top: 18, roofH: 22, wallH: 150, wall: 'plaster', wallRamp: 'paper', roof: 'flat', posts: false, door: { x: 146, style: 'double', ramp: 'metal' },
  windows: [14, 62, 110, 214, 262].flatMap((x) => [{ x, y: 10, w: 36, h: 26 }, { x, y: 50, w: 36, h: 26 }, { x, y: 90, w: 36, h: 26 }]).concat([{ x: 154, y: 12, w: 36, h: 26 }, { x: 154, y: 52, w: 36, h: 26 }]),
  awnings: [{ x: 120, w: 100, y: 92, a: 'coral', b: 'paper' }], signs: [{ text: 'Hoshizora Dept Store', y: 128, ramp: 'ribbon', light: true, ink: 'ribbon', inkI: 0 }] });
facade('kc_f_cinema', { w: 8, top: 20, roofH: 20, wallH: 120, wall: 'shop', wallRamp: 'charcoal', roof: 'flat', posts: false, door: { x: 100, style: 'double', ramp: 'ribbon' },
  windows: [{ x: 14, y: 40, w: 56, h: 36, shop: true }, { x: 186, y: 40, w: 56, h: 36, shop: true }, { x: 14, y: 6, w: 56, h: 24 }, { x: 186, y: 6, w: 56, h: 24 }], awnings: [{ x: 70, w: 116, y: 78, a: 'ribbon', b: 'butter' }], signs: [{ text: 'Star Cinema', y: 58, ramp: 'ribbon', light: true, ink: 'butter', inkI: 3 }] });
facade('kc_f_aquarium', { w: 9, top: 20, roofH: 40, wallH: 108, wall: 'plaster', wallRamp: 'sky', roof: 'tin', roofRamp: 'roofTeal', door: { x: 118, style: 'glass' },
  windows: [{ x: 12, y: 14, w: 60, h: 40, shop: true }, { x: 216, y: 14, w: 60, h: 40, shop: true }, { x: 12, y: 66, w: 50, h: 24, curtain: 'mint' }, { x: 226, y: 66, w: 50, h: 24, curtain: 'mint' }], awnings: [{ x: 92, w: 100, y: 56, a: 'mint', b: 'paper' }], signs: [{ text: 'Bay Aquarium', y: 96, ramp: 'navy', light: true, ink: 'navy', inkI: 0 }] });
facade('kc_f_museum', { w: 8, top: 24, roofH: 40, wallH: 120, wall: 'brick', wallRamp: 'brick', roof: 'slate', roofRamp: 'roofSlate', door: { x: 100, style: 'double', ramp: 'woodDark' },
  windows: [{ x: 16, y: 10, w: 40, h: 40 }, { x: 70, y: 10, w: 20, h: 40 }, { x: 166, y: 10, w: 20, h: 40 }, { x: 200, y: 10, w: 40, h: 40 }, { x: 16, y: 62, w: 40, h: 30 }, { x: 200, y: 62, w: 40, h: 30 }], signs: [{ text: 'City Museum', y: 100, ramp: 'paper', light: true, ink: 'navy' }] });
facade('kc_f_unihall', { w: 10, top: 40, roofH: 40, wallH: 130, wall: 'brick', wallRamp: 'brick', roof: 'slate', roofRamp: 'roofSlate', tower: { x: 130, w: 60 }, door: { x: 146, style: 'double', ramp: 'woodDark' },
  windows: [14, 62, 214, 262].flatMap((x) => [{ x, y: 10, w: 34, h: 38 }, { x, y: 62, w: 34, h: 38 }]).concat([{ x: 100, y: 62, w: 34, h: 38 }, { x: 186, y: 62, w: 34, h: 38 }]), signs: [{ text: 'Main Hall', y: 108, ramp: 'paper', light: true, ink: 'navy' }] });
facade('kc_f_station', { w: 12, top: 30, roofH: 34, wallH: 120, wall: 'brick', wallRamp: 'brick', roof: 'slate', roofRamp: 'roofSlate', posts: false, door: { x: 166, style: 'double', ramp: 'metal' },
  windows: [14, 66, 118, 238, 290, 342].flatMap((x) => [{ x, y: 10, w: 36, h: 46 }]), tower: { x: 150, w: 84 }, awnings: [{ x: 140, w: 112, y: 92, a: 'navy', b: 'paper' }], signs: [{ text: 'Kitaminato Station', y: 100, ramp: 'navy', light: true, ink: 'navy', inkI: 0 }] });
const BLOCK = (name, wall, ramp, roofRamp, n = 5) => facade(name, { w: n, top: 8, roofH: 14, wallH: 150, wall, wallRamp: ramp, roof: 'flat', posts: false, windows: Array.from({ length: n * 2 }, (_, i) => i).flatMap((i) => [{ x: 10 + (i % n) * 32 + (i >= n ? 0 : 0), y: 8 + Math.floor(i / n) * 40, w: 22, h: 26 }]).slice(0, n * 2).concat(Array.from({ length: n }, (_, i) => ({ x: 10 + i * 32, y: 88, w: 22, h: 26 }))), ac: [8] });
BLOCK('kc_block_a', 'plaster', 'sky'); BLOCK('kc_block_b', 'plaster', 'paper'); BLOCK('kc_block_c', 'brick', 'brick', 'roofSlate', 6); BLOCK('kc_block_d', 'plaster', 'lilac', 'roofSlate', 4);
facade('kc_f_lecture', { w: 8, top: 14, roofH: 30, wallH: 110, wall: 'plaster', wallRamp: 'paper', roof: 'slate', roofRamp: 'roofSlate', door: { x: 100, style: 'glass' }, windows: [18, 56, 160, 198].flatMap((x) => [{ x, y: 10, w: 28, h: 34 }, { x, y: 56, w: 28, h: 34 }]), signs: [{ text: 'Lecture Hall B', y: 96, ramp: 'navy' }] });

void hash;
