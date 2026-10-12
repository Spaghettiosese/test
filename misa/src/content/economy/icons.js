// Economy area: extra item icon shapes (16x16, selective outline, light from the top-left) and phone app icons.
import { defineIconShape } from '../../gfx/icons.js';
import { defineSprite } from '../../art.js';
import { RAMPS } from '../../gfx/palette.js';

defineIconShape('egg', (R, P) => { R.e(6, 9, 4, 5, '#fffaf0'); R.e(11, 10, 3, 4, P.c); R.e(5, 7, 1, 2, '#ffffff'); R(10, 8, 1, 2, P.l); R(3, 14, 11, 1, '#c9b8a2'); });
defineIconShape('jar', (R, P) => { R(4, 2, 8, 3, P.c2); R(3, 5, 10, 10, P.c); R(4, 6, 2, 8, P.l); R(5, 8, 6, 4, '#fffaf0'); R(6, 9, 4, 2, P.c3); R(3, 14, 10, 1, P.d); });
defineIconShape('sack', (R, P) => { R.e(8, 10, 6, 5, P.c); R(5, 2, 6, 4, P.c); R(5, 5, 6, 1, P.d); R(4, 8, 2, 5, P.l); R(6, 9, 4, 3, P.c3); R(6, 1, 4, 1, P.c2); });
defineIconShape('carton', (R, P) => { R(4, 4, 8, 11, '#fffaf0'); R.t([4, 4], [12, 4], [8, 1], P.c2); R(4, 8, 8, 4, P.c); R(5, 5, 1, 9, '#ffffff'); R(11, 4, 1, 11, '#d8cfc0'); });
defineIconShape('can', (R, P) => { R(4, 2, 8, 13, P.c); R(4, 2, 8, 1, '#b9c6d2'); R(4, 14, 8, 1, '#8a9aab'); R(5, 3, 2, 11, P.l); R(4, 7, 8, 3, P.c3); R(10, 3, 1, 11, P.d); });
defineIconShape('sticker', (R, P) => { R.e(8, 8, 7, 7, '#fffaf0'); R.t([8, 2], [10, 7], [6, 7], P.c); R.t([2, 7], [14, 7], [8, 11], P.c); R.t([8, 9], [4, 14], [6, 8], P.c); R.t([8, 9], [12, 14], [10, 8], P.c); R(7, 5, 2, 3, P.l); R.t([12, 12], [15, 12], [15, 15], '#e8dcc0'); });
defineIconShape('gear', (R, P) => { for (const [x, y] of [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [12, 2], [2, 12], [12, 12]]) R(x, y, 3, 3, P.c2); R.e(8, 8, 6, 6, P.c); R.e(7, 7, 3, 3, P.l); R.e(8, 8, 2, 2, P.d); });
defineIconShape('cake', (R, P) => { R.t([2, 13], [14, 13], [14, 6], P.c3); R(2, 10, 12, 4, '#fffaf0'); R(2, 11, 12, 1, P.c); R.t([2, 10], [14, 10], [14, 4], '#fffaf0'); R.e(11, 4, 2, 2, P.c); R(10, 3, 1, 1, P.l); R(2, 13, 12, 1, P.d); });
defineIconShape('icecup', (R, P) => { R.e(8, 6, 6, 5, P.c); R.e(6, 4, 3, 2, P.l); R(3, 9, 10, 2, P.c2); R.t([3, 11], [13, 11], [10, 15], '#fffaf0'); R.t([3, 11], [10, 15], [6, 15], '#fffaf0'); R(5, 12, 6, 1, '#7fb2e0'); R(7, 1, 1, 3, '#e0707a'); });
defineIconShape('capsule', (R, P) => { R.e(8, 8, 6, 6, '#fffaf0'); R(2, 8, 13, 6, P.c); R.e(8, 9, 6, 5, P.c); R(2, 8, 13, 1, P.d); R.e(6, 5, 2, 2, '#ffffff'); R(5, 10, 2, 2, P.l); });
defineIconShape('bar', (R, P) => { R(2, 4, 12, 8, P.c); R(2, 4, 12, 2, P.l); for (let i = 0; i < 3; i++) R(4 + i * 4, 6, 1, 6, P.d); R(2, 9, 12, 1, P.d); R(9, 2, 5, 12, P.c3); R(9, 2, 5, 1, '#fffaf0'); });
defineIconShape('pot', (R, P) => { R(3, 6, 10, 8, P.c); R(2, 5, 12, 2, P.c2); R(4, 7, 2, 6, P.l); R(6, 3, 4, 2, P.c2); R(3, 13, 10, 1, P.d); R(8, 1, 1, 2, '#ffffff'); });
defineIconShape('scarf', (R, P) => { R(2, 4, 12, 4, P.c); R(9, 8, 4, 7, P.c); R(2, 4, 12, 1, P.l); for (let i = 3; i < 13; i += 3) R(i, 5, 1, 3, P.c3); R(9, 14, 1, 1, P.c3); R(12, 14, 1, 1, P.c3); });
defineIconShape('lamp', (R, P) => { R.t([8, 1], [14, 8], [2, 8], P.c); R(4, 4, 2, 3, P.l); R(7, 8, 2, 5, '#a67548'); R(4, 13, 8, 2, '#7a4f3a'); R(7, 9, 2, 1, '#ffd76a'); });
defineIconShape('rug', (R, P) => { R.e(8, 9, 7, 5, P.c); R.e(8, 9, 5, 3, P.c3); R.e(8, 9, 2, 1, P.l); R(1, 9, 1, 1, P.c2); R(14, 9, 1, 1, P.c2); });
defineIconShape('chair', (R, P) => { R(4, 2, 8, 7, P.c); R(4, 2, 8, 2, P.l); R(3, 9, 10, 3, P.c2); R(4, 12, 2, 3, P.d); R(10, 12, 2, 3, P.d); });
defineIconShape('frame', (R, P) => { R(2, 2, 12, 12, P.c); R(4, 4, 8, 8, '#bfe6f5'); R(4, 9, 8, 3, '#94c06a'); R.e(10, 6, 1, 1, '#ffd76a'); R(2, 2, 12, 1, P.l); });
defineIconShape('dress', (R, P) => { R(5, 1, 6, 5, P.c); R.t([2, 15], [14, 15], [8, 4], P.c); R(5, 1, 2, 2, P.c2); R(9, 1, 2, 2, P.c2); R(6, 6, 4, 1, P.c3); R(5, 7, 1, 6, P.l); });

// Phone app icons (12x12, ink-outlined like the core app icons).
const K = '#2b1d2e';
defineSprite('econ_i_wallet', 12, 11, (R0) => { const R = R0.at(1, 1); R(0, 1, 10, 8, RAMPS.coral[2]); R(0, 1, 10, 2, RAMPS.coral[3]); R(6, 4, 4, 3, RAMPS.coral[1]); R(7, 5, 1, 1, RAMPS.butter[2]); R(2, 0, 5, 1, RAMPS.mint[2]); }, false, true);
defineSprite('econ_i_jobs', 12, 12, (R0) => { const R = R0.at(1, 1); R(3, 0, 4, 2, RAMPS.wood[1]); R(0, 2, 10, 7, RAMPS.wood[2]); R(0, 2, 10, 2, RAMPS.wood[3]); R(4, 4, 2, 2, RAMPS.butter[2]); R(0, 8, 10, 1, RAMPS.wood[1]); }, false, true);
defineSprite('econ_i_board', 12, 12, (R0) => { const R = R0.at(1, 1); R(0, 0, 10, 9, RAMPS.wood[2]); R(1, 1, 8, 7, '#c99a6b'); R(2, 2, 3, 3, '#fffaf0'); R(6, 3, 2, 3, RAMPS.butter[3]); R(3, 2, 1, 1, RAMPS.coral[2]); R(4, 9, 2, 1, RAMPS.wood[1]); }, false, true);
defineSprite('econ_i_star', 12, 12, (R0) => { const R = R0.at(1, 1); R(4, 0, 2, 3, RAMPS.butter[2]); R(0, 3, 10, 2, RAMPS.butter[2]); R(1, 5, 8, 1, RAMPS.butter[2]); R(2, 6, 6, 1, RAMPS.butter[2]); R(1, 7, 3, 2, RAMPS.butter[2]); R(6, 7, 3, 2, RAMPS.butter[2]); R(4, 3, 1, 2, '#fffbe0'); }, false, true);
defineSprite('econ_i_box', 12, 11, (R0) => { const R = R0.at(1, 1); R(0, 2, 10, 7, RAMPS.wood[2]); R(0, 2, 10, 2, RAMPS.wood[3]); R(4, 2, 2, 7, RAMPS.wood[1]); R(1, 0, 8, 2, RAMPS.wood[3]); }, false, true);
void K;
