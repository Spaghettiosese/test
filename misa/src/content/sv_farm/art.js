// Farm & Animals art: five animals (baby and adult, idle/walk), machine states, sprinklers, scarecrows, crows,
// coop, barn, trough, bin, greenhouse frame. All hd sprites; the engine adds the 1 px outline margin.
import { spr, RAMPS as Rr } from '../town/lib.js';
import { SPECIES } from './data.js';
import { all } from '../../core/registry.js';

const INK = '#2a1a22', W = '#fffaf0', W2 = '#e8dccc', ORANGE = '#f0a030', RED = '#d93b3b';
const A = (name, w, h, draw) => spr(name, w, h, (R) => draw(R), { outline: 'ink' });
const P = (name, w, h, draw) => spr(name, w, h, (R) => draw(R));

// ------------------------------------------------------------------ animals: _i0 _i1 (idle / peck) _w0 _w1 (walk)
function chicken(R, f, walk) {
  const dy = f && !walk ? 2 : 0;
  R(0, 4, 3, 4, W2); R(1, 3, 2, 3, W);
  R.e(7, 9, 6, 4, W); R.e(6, 10, 4, 2, W2); R(5, 8, 5, 1, '#fff'); R(5, 7, 4, 1, W);
  R.e(12, 5 + dy, 2, 2, W); R(11, 1 + dy, 3, 2, RED); R(14, 5 + dy, 2, 1, ORANGE); R(14, 6 + dy, 1, 2, RED); R(12, 5 + dy, 1, 1, INK);
  R(6, 13, 1, 2, ORANGE); R(9 + (walk ? f * 2 - 1 : 0), 13, 1, 2, ORANGE);
}
function duck(R, f, walk) {
  const dy = f && !walk ? 2 : 0;
  R.e(8, 10, 7, 4, W); R.e(7, 11, 5, 2, W2); R(0, 8, 3, 3, W); R(1, 7, 2, 2, W);
  R.e(13, 5 + dy, 3, 3, '#3a8f5a'); R(13, 4 + dy, 2, 1, '#52b070'); R(16, 6 + dy, 3, 2, '#f0c040'); R(14, 5 + dy, 1, 1, INK); R(10, 3 + dy, 3, 5, '#3a8f5a');
  R(10, 7, 3, 1, W); R(6, 14, 3, 1, ORANGE); R(10 + (walk ? f : 0), 14, 3, 1, ORANGE);
}
function rabbit(R, f, walk) {
  const hop = walk ? f * 2 : 0;
  R.e(7, 10 - hop, 6, 4, '#e8dcc8'); R.e(6, 11 - hop, 4, 2, '#cdbba0'); R.e(1, 9 - hop, 2, 2, W);
  R.e(12, 6 - hop, 3, 3, '#e8dcc8'); R(11, 0 - hop, 2, 6, '#e8dcc8'); R(14, 1 - hop, 2, 5, '#e8dcc8'); R(12, 1 - hop, 1, 4, '#f0a8b8'); R(15, 2 - hop, 1, 3, '#f0a8b8');
  R(13, 6 - hop, 1, 1, INK); R(15, 8 - hop, 1, 1, '#f08090'); R(5, 14 - hop, 3, 1, '#cdbba0'); R(10, 14 - hop, 3, 1, '#cdbba0');
}
function goat(R, f, walk) {
  const dy = f && !walk ? 2 : 0, s = walk ? f : 0;
  R.e(11, 11, 8, 5, '#f0e8dc'); R.e(10, 13, 6, 2, '#d8cdbd'); R(2, 8, 3, 3, '#f0e8dc');
  R.e(20, 7 + dy, 3, 3, '#f0e8dc'); R(19, 2 + dy, 1, 4, '#9a8468'); R(21, 1 + dy, 1, 4, '#9a8468'); R(22, 9 + dy, 2, 3, '#d8cdbd'); R(23, 7 + dy, 2, 2, '#e8c8b0'); R(21, 7 + dy, 1, 1, INK);
  R(17, 8 + dy, 2, 2, '#d8cdbd');
  for (const x of [5, 8, 14, 17]) R(x + (walk && x > 10 ? s : 0), 15, 2, 5, '#cdbba0');
}
function alpaca(R, f, walk) {
  const dy = f && !walk ? 2 : 0;
  R.e(9, 21, 8, 6, '#ecdcc0'); R.e(8, 23, 6, 3, '#d4c0a0'); R(1, 17, 3, 5, '#ecdcc0');
  R(14, 8, 4, 14, '#ecdcc0'); R(15, 8, 1, 14, '#f4e8d0');
  R.e(17, 6 + dy, 3, 3, '#ecdcc0'); R(14, 0 + dy, 3, 4, '#f4e8d0'); R(16, 1 + dy, 2, 3, '#f4e8d0'); R(19, 7 + dy, 3, 3, '#d4c0a0'); R(18, 5 + dy, 1, 1, INK); R(20, 8 + dy, 1, 1, INK);
  R(16, 1 + dy, 2, 2, '#c8a888'); R(17, 0 + dy, 1, 2, '#c8a888');
  for (const x of [4, 7, 12, 15]) R(x + (walk && x > 9 ? f : 0), 26, 2, 4, '#b89c78');
}
function baby(R, col, dk, kind, f, walk) {
  R.e(6, 7, 4, 3, col); R.e(5, 8, 3, 1, dk); R.e(10, 4 + (f && !walk ? 1 : 0), 2, 2, col); R(11, 3, 2, 1, dk);
  R(11, 5 + (f && !walk ? 1 : 0), 1, 1, INK); R(5 + (walk ? f : 0), 10, 1, 2, dk); R(8, 10, 1, 2, dk);
  if (kind === 'chicken') { R(13, 5, 1, 1, ORANGE); R(11, 2, 1, 1, RED); }
  if (kind === 'duck') R(13, 5, 2, 1, '#f0c040');
  if (kind === 'rabbit') { R(10, 0, 1, 3, col); R(12, 1, 1, 3, col); }
  if (kind === 'goat') { R(10, 1, 1, 2, '#9a8468'); R(12, 1, 1, 2, '#9a8468'); }
  if (kind === 'alpaca') { R(10, 0, 3, 3, '#f4e8d0'); R(10, 7, 1, 3, col); }
}
const BODY = { chicken: ['#ffe06a', '#e0b840', 16, 15], duck: ['#fff0a0', '#e0c050', 20, 16], rabbit: ['#e8dcc8', '#cdbba0', 17, 15], goat: ['#f0e8dc', '#cdbba0', 25, 20], alpaca: ['#ecdcc0', '#b89c78', 23, 30] };
const FN = { chicken, duck, rabbit, goat, alpaca };
for (const sp of Object.keys(SPECIES)) {
  const [c, dk, w, h] = BODY[sp];
  for (const [tag, f, walk] of [['i0', 0, false], ['i1', 1, false], ['w0', 0, true], ['w1', 1, true]]) {
    A(`sv_a_${sp}_a_${tag}`, w, h, (R) => FN[sp](R, f, walk));
    A(`sv_a_${sp}_b_${tag}`, 15, 13, (R) => baby(R, c, dk, sp, f, walk));
  }
}
A('sv_crow_0', 14, 12, (R) => { R.e(6, 7, 5, 3, '#2a2840'); R(1, 5, 3, 3, '#2a2840'); R.e(10, 4, 2, 2, '#2a2840'); R(12, 4, 3, 1, '#c8a040'); R(10, 3, 1, 1, '#fff'); R(5, 10, 1, 2, '#7a6a50'); R(8, 10, 1, 2, '#7a6a50'); R(3, 6, 4, 1, '#4a4868'); });
A('sv_crow_1', 14, 12, (R) => { R.e(6, 6, 5, 3, '#2a2840'); R(1, 4, 3, 3, '#2a2840'); R.e(10, 3, 2, 2, '#2a2840'); R(12, 3, 3, 1, '#c8a040'); R(10, 2, 1, 1, '#fff'); R(5, 9, 1, 2, '#7a6a50'); R(8, 9, 1, 2, '#7a6a50'); R(2, 3, 5, 2, '#4a4868'); });

// ------------------------------------------------------------------ machines: idle / work0 / work1 / ready
const MS = ['idle', 'work0', 'work1', 'ready'], wk = (s) => (s === 'work0' ? 0 : s === 'work1' ? 1 : -1);
const WD = Rr.wood, MT = Rr.metal, GL = Rr.sky[4];
const MACHINES = {
  jar: [24, 26, (R, s) => {
    R(3, 22, 18, 4, WD[2]); R(3, 22, 18, 1, WD[3]); R(5, 6, 14, 17, '#cfe8f0'); R(5, 6, 2, 17, '#f4fcff'); R(5, 3, 14, 3, MT[3]); R(5, 3, 14, 1, MT[4] || MT[3]);
    const fill = s === 'ready' ? 15 : wk(s) >= 0 ? 8 : 0; if (fill) R(7, 22 - fill, 11, fill, s === 'ready' ? Rr.ribbon[2] : Rr.hairGinger[2]);
    if (s === 'ready') R(8, 9, 2, 8, Rr.ribbon[3]);
    if (wk(s) >= 0) { R(9 + wk(s) * 4, 11 - wk(s), 1, 1, '#fff'); R(13 - wk(s) * 3, 14, 1, 1, '#fff'); }
  }],
  dehydrator: [26, 28, (R, s) => {
    R(3, 3, 20, 24, WD[2]); R(3, 3, 20, 2, WD[3]); R(5, 6, 16, 19, WD[0] || WD[1]);
    for (let i = 0; i < 3; i++) { R(6, 9 + i * 6, 14, 2, MT[3]); if (s === 'ready') for (let x = 0; x < 3; x++) R(8 + x * 4, 7 + i * 6, 3, 2, Rr.hairGinger[2]); }
    if (wk(s) >= 0) for (let i = 0; i < 3; i++) R(7 + ((i + wk(s)) % 2) * 5, 8 + i * 6, 2, 1, Rr.coral[3]);
    R(21, 14, 1, 4, MT[2]);
  }],
  mayo: [26, 26, (R, s) => {
    R(3, 12, 20, 12, MT[2]); R(3, 12, 20, 2, MT[3]); R(5, 24, 3, 2, MT[1]); R(18, 24, 3, 2, MT[1]);
    R.e(13, 10 + (wk(s) === 1 ? 1 : 0), 7, 3, W); R(7, 8, 12, 2, W2);
    if (wk(s) >= 0) R(9 + wk(s) * 2, 6, 6, 3, Rr.butter[3]);
    R.e(8, 18, 2, 2, Rr.coral[2]); R(21, 16, 4, 2, MT[3]); R(22, 18, 2, 3, MT[3]);
    if (s === 'ready') { R(20, 20, 6, 5, W); R(20, 20, 6, 1, Rr.butter[3]); }
  }],
  cheese: [24, 26, (R, s) => {
    R(4, 11, 16, 14, WD[2]); R(4, 14, 16, 1, MT[2]); R(4, 20, 16, 1, MT[2]); R(4, 11, 3, 14, WD[3]);
    const d = wk(s) === 1 ? 2 : 0; R(11, 2 + d, 2, 10 - d, MT[3]); R(6, 2 + d, 12, 2, WD[3]);
    if (s === 'ready') { R.e(12, 9, 7, 3, Rr.butter[3]); R(5, 9, 14, 3, Rr.butter[2]); R(8, 9, 2, 2, Rr.butter[1]); }
  }],
  loom: [30, 30, (R, s) => {
    R(2, 5, 3, 23, WD[2]); R(25, 5, 3, 23, WD[2]); R(2, 3, 26, 3, WD[3]); R(4, 24, 22, 3, WD[3]); R(7, 10, 16, 1, WD[1]);
    for (let x = 0; x < 6; x++) R(7 + x * 3, 11, 1, 12, Rr.paper[3]);
    if (wk(s) >= 0) R(8 + wk(s) * 9, 16, 6, 2, Rr.butter[2]);
    if (s === 'ready') { R(7, 17, 16, 7, Rr.coral[3]); R(7, 17, 16, 1, Rr.coral[2]); R(7, 21, 16, 1, Rr.coral[2]); }
  }],
  tea: [24, 28, (R, s) => {
    R(4, 12, 16, 14, WD[2]); R(4, 12, 16, 3, WD[3]); R(4, 17, 16, 1, MT[2]); R(4, 22, 16, 1, MT[2]); R(3, 10, 18, 3, WD[3]);
    if (wk(s) >= 0) { R(8 + wk(s) * 5, 6 - wk(s), 2, 3, '#fff'); R(13 - wk(s) * 3, 3 + wk(s), 2, 3, '#e8f4f4'); }
    if (s === 'ready') { R(6, 7, 12, 4, Rr.forest[3]); R(8, 6, 3, 2, Rr.forest[2]); R(13, 5, 3, 3, Rr.forest[2]); }
  }],
  mill: [28, 32, (R, s) => {
    R(8, 12, 12, 16, Rr.paper[3]); R(8, 12, 3, 16, Rr.paper[4]); R.t([6, 12], [14, 4], [22, 12], Rr.brick[2]); R(11, 22, 6, 6, WD[1]);
    const hubx = 14, huby = 11, a = [0, 1].map((i) => i); void a;
    const pts = (wk(s) === 1 ? [[0, -9], [9, 0], [0, 9], [-9, 0]] : [[7, -7], [7, 7], [-7, 7], [-7, -7]]);
    for (const [dx, dy] of pts) { const sx = Math.sign(dx), sy = Math.sign(dy); for (let t = 1; t <= 8; t++) R(hubx + Math.round((dx * t) / 9), huby + Math.round((dy * t) / 9), 1, 1, WD[3]); R(hubx + dx - (sx > 0 ? 1 : 0), huby + dy - (sy > 0 ? 1 : 0), 2, 2, Rr.paper[4]); }
    R.e(hubx, huby, 1, 1, WD[1]);
    if (s === 'ready') R(19, 24, 7, 6, Rr.paper[4]);
  }],
  compost: [28, 24, (R, s) => {
    R(2, 8, 24, 15, WD[2]); for (let x = 2; x < 26; x += 6) R(x, 8, 1, 15, WD[1]); R(2, 8, 24, 2, WD[3]);
    R.e(14, 8, 10, 4, s === 'ready' ? Rr.dirt[0] : Rr.forest[1]); R(8, 6, 4, 2, Rr.forest[3]); R(16, 5, 5, 3, Rr.dirt[2]);
    if (wk(s) >= 0) R(10 + wk(s) * 6, 2, 2, 3, '#e8f4f4');
    if (s === 'ready') { R(9, 4, 1, 1, '#fff6a0'); R(18, 3, 1, 1, '#fff6a0'); }
  }],
  bee: [24, 26, (R, s) => {
    R(4, 10, 16, 12, Rr.butter[2]); R(4, 14, 16, 2, WD[1]); R(4, 19, 16, 2, WD[1]); R(2, 6, 20, 5, WD[3]); R(5, 22, 3, 4, WD[2]); R(16, 22, 3, 4, WD[2]); R(10, 17, 4, 2, INK);
    if (wk(s) >= 0) { R(3 + wk(s) * 14, 4 + wk(s) * 2, 2, 1, INK); R(19 - wk(s) * 12, 8 - wk(s), 2, 1, INK); }
    if (s === 'ready') { R(9, 21, 6, 5, Rr.butter[3]); R(9, 21, 6, 1, '#fff6a0'); }
  }],
};
for (const [kind, [w, h, draw]] of Object.entries(MACHINES)) for (const s of MS) A(`sv_m_${kind}_${s}`, w, h, (R) => draw(R, s));
// sprinklers (0 idle, 1 and 2 spraying) and scarecrows
const SPR_C = [Rr.metal[3], Rr.hairGinger[2], Rr.butter[2]];
for (let t = 1; t <= 3; t++) for (let f = 0; f < 3; f++) A(`sv_m_sprinkler_${t}_${f}`, 16, 20, (R) => {
  R(6, 9, 3, 10, Rr.metal[2]); R(5, 17, 5, 2, Rr.metal[1]); R(4, 6, 7, 3, SPR_C[t - 1]); R(4, 6, 7, 1, '#fff'); R(7, 4, 1, 2, SPR_C[t - 1]);
  if (f) for (const [x, y] of [[2, 4], [12, 4], [1, 7], [13, 7], [7, 1]]) R(x + (f - 1), y - f, 1, 1, Rr.sky[3]);
});
for (let t = 1; t <= 2; t++) A(`sv_m_scarecrow${t === 1 ? '' : '_2'}_idle`, 24, 42, (R) => {
  const sh = t === 1 ? Rr.coral[2] : Rr.lilac[2];
  R(11, 14, 2, 26, WD[2]); R(2, 17, 20, 2, WD[2]); R(8, 15, 8, 11, sh); R(8, 15, 8, 2, sh === Rr.coral[2] ? Rr.coral[3] : Rr.lilac[3]); R(3, 19, 3, 3, Rr.butter[3]); R(18, 19, 3, 3, Rr.butter[3]);
  R.e(12, 11, 3, 3, Rr.paper[3]); R(10, 11, 1, 1, INK); R(14, 11, 1, 1, INK); R(5, 8, 14, 2, Rr.butter[2]); R(8, 3, 8, 6, Rr.butter[2]); R(8, 7, 8, 1, t === 1 ? Rr.coral[1] : Rr.lilac[1]);
  R(8, 27, 3, 3, Rr.butter[3]); R(14, 28, 3, 2, Rr.butter[3]);
  if (t === 2) { R(20, 9, 1, 10, WD[3]); R(21, 9, 3, 3, Rr.sakura[2]); }
});

// ------------------------------------------------------------------ buildings and props
P('sv_coop', 100, 80, (R) => {
  R(4, 30, 92, 50, Rr.wood[2]); for (let x = 4; x < 96; x += 6) R(x, 30, 1, 50, Rr.wood[1]); R(4, 30, 92, 2, Rr.wood[3]);
  R(0, 24, 100, 8, Rr.brick[2]); R(2, 14, 96, 12, Rr.brick[2]); R(8, 6, 84, 10, Rr.brick[1]); R(22, 0, 56, 8, Rr.brick[1]);
  for (let x = 2; x < 98; x += 8) { R(x, 14, 1, 12, Rr.brick[1]); }
  R(0, 24, 100, 1, Rr.brick[3]); R(40, 50, 22, 30, Rr.charcoal[1]); R(38, 48, 26, 3, Rr.wood[3]); R(36, 74, 30, 6, Rr.wood[1]);
  R(12, 44, 14, 14, Rr.charcoal[1]); R(13, 45, 12, 12, '#f4e8a0'); R(18, 45, 1, 12, Rr.wood[2]); R(70, 44, 14, 14, Rr.charcoal[1]); R(71, 45, 12, 12, '#f4e8a0'); R(76, 45, 1, 12, Rr.wood[2]);
  R(46, 36, 8, 8, Rr.paper[4]); R(48, 38, 4, 4, Rr.butter[3]);
});
P('sv_barn', 132, 104, (R) => {
  R(4, 40, 124, 64, Rr.brick[2]); for (let x = 4; x < 128; x += 7) R(x, 40, 1, 64, Rr.brick[1]);
  R(0, 30, 132, 12, Rr.charcoal[2]); R(8, 18, 116, 14, Rr.charcoal[2]); R(24, 8, 84, 12, Rr.charcoal[2]); R(42, 0, 48, 10, Rr.charcoal[3]);
  R(0, 30, 132, 2, Rr.charcoal[3]); R(46, 56, 40, 48, Rr.paper[4]); R(44, 54, 44, 3, Rr.paper[3]);
  for (let i = 0; i < 44; i++) { const y = 57 + Math.floor(i * 0.9); R(48 + Math.min(i, 36), y, 2, 2, Rr.brick[1]); R(84 - Math.min(i, 36), y, 2, 2, Rr.brick[1]); }
  R(65, 56, 2, 48, Rr.brick[2]); R(56, 12, 20, 14, Rr.paper[4]); R(56, 12, 20, 2, Rr.brick[1]); R(65, 12, 2, 14, Rr.brick[1]); R(12, 60, 14, 14, Rr.paper[4]); R(18, 60, 2, 14, Rr.brick[1]); R(106, 60, 14, 14, Rr.paper[4]); R(112, 60, 2, 14, Rr.brick[1]);
});
for (const full of [0, 1]) P(`sv_trough_${full}`, 56, 22, (R) => {
  R(2, 8, 52, 13, Rr.wood[2]); R(2, 8, 52, 2, Rr.wood[3]); R(4, 10, 48, 8, Rr.wood[1]); R(5, 19, 4, 3, Rr.wood[1]); R(47, 19, 4, 3, Rr.wood[1]);
  if (full) { for (let x = 6; x < 50; x += 4) R(x, 6 + ((x / 4) % 2), 5, 5, Rr.butter[2]); R(8, 5, 40, 2, Rr.butter[3]); }
});
for (const full of [0, 1]) P(`sv_bin_${full}`, 28, 28, (R) => {
  R(2, 8, 24, 19, Rr.wood[2]); R(2, 8, 24, 3, Rr.wood[3]); R(2, 16, 24, 2, Rr.wood[1]); R(12, 20, 4, 3, Rr.metal[3]);
  if (full) { R.e(9, 6, 3, 3, Rr.paper[4]); R.e(16, 6, 3, 3, Rr.butter[3]); R.e(13, 4, 3, 3, Rr.paper[3]); }
});
P('sv_haystack', 40, 34, (R) => { R.e(20, 22, 18, 11, Rr.butter[2]); R.e(20, 14, 13, 8, Rr.butter[2]); R(2, 24, 36, 2, Rr.butter[1]); for (let x = 6; x < 36; x += 5) R(x, 10 + (x % 3), 1, 18, Rr.butter[1]); R.e(14, 12, 4, 2, Rr.butter[3]); });
P('sv_board', 34, 42, (R) => { R(4, 14, 4, 28, Rr.wood[1]); R(26, 14, 4, 28, Rr.wood[1]); R(0, 2, 34, 20, Rr.wood[2]); R(0, 2, 34, 2, Rr.wood[3]); R(4, 6, 26, 12, Rr.paper[4]); R(8, 9, 8, 6, Rr.hairGinger[2]); R(19, 9, 8, 2, Rr.ink ? Rr.ink[2] : INK); R(19, 13, 6, 2, Rr.coral[2]); });
P('sv_gh_back', 256, 64, (R) => {
  R(0, 8, 256, 56, '#cfe8f0'); for (let x = 0; x < 256; x += 32) { R(x, 8, 2, 56, Rr.metal[3]); } R(0, 36, 256, 2, Rr.metal[3]); R(0, 8, 256, 3, Rr.metal[3]);
  R.t([0, 8], [128, 0], [256, 8], Rr.metal[2]); for (let x = 4; x < 252; x += 32) { R(x + 4, 14, 10, 18, '#e8f8ff'); R(x + 18, 42, 8, 14, '#e8f8ff'); }
});
P('sv_gh_post', 12, 96, (R) => { R(2, 6, 8, 90, Rr.metal[3]); R(2, 6, 3, 90, '#f4fcff'); R(0, 0, 12, 8, Rr.metal[2]); });
const ghFront = (w) => (R) => { R(0, 6, w, 22, '#cfe8f0'); for (let x = 0; x < w; x += 32) R(x, 4, 2, 24, Rr.metal[3]); R(w - 2, 4, 2, 24, Rr.metal[3]); R(0, 4, w, 3, Rr.metal[3]); R(2, 14, w - 4, 8, '#e8f8ff'); };
P('sv_gh_front_l', 96, 28, ghFront(96));
P('sv_gh_front_r', 64, 28, ghFront(64));
void all;
