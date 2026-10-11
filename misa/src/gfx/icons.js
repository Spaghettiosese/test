// Parametric item icons (16x16 art + selective outline, hd). Items say icon: itemIcon('fish', { c: '#7fb2e0' }).
// Shapes are drawn from palette ramps picked by colour, so hundreds of items stay consistent without hand-drawing each.
//   itemIcon(shape, opts) -> sprite name (registered once per unique shape+opts)
// opts: c (main hex), c2 (secondary hex), c3 (accent hex)
import { defineSprite, SPRITES } from '../art.js';
import { shade } from './color.js';

const SHAPES = {};
export const shapes = () => Object.keys(SHAPES);
export function defineIconShape(name, draw) { SHAPES[name] = draw; }

export function itemIcon(shape, opts = {}) {
  const key = `ic_${shape}_${(opts.c || '').slice(1)}${(opts.c2 || '').slice(1)}${(opts.c3 || '').slice(1)}`;
  if (SPRITES[key]) return key;
  const draw = SHAPES[shape] || SHAPES.box;
  const c = opts.c || '#e0a84a', c2 = opts.c2 || shade(c, -1, 0.18), c3 = opts.c3 || shade(c, 1, 0.16);
  const P = { c, c2, c3, d: shade(c, -1, 0.3), l: shade(c, 1, 0.3), w: '#fffaf0', k: '#2a1a22' };
  defineSprite(key, 16, 16, (R) => draw(R, P), { hd: true, outline: 'selective' });
  return key;
}

// ---- base shapes (more can be added with defineIconShape) ----
defineIconShape('box', (R, P) => { R(2, 4, 12, 10, P.c); R(2, 4, 12, 2, P.l); R(12, 6, 2, 8, P.c2); R(7, 4, 2, 10, P.d); });
defineIconShape('fish', (R, P) => { R.e(7, 8, 6, 3, P.c); R.e(6, 7, 4, 1, P.l); R.t([12, 8], [15, 4], [15, 12], P.c2); R(3, 10, 8, 1, P.c2); R(4, 7, 1, 1, P.k); R(8, 6, 1, 4, P.d); });
defineIconShape('bug', (R, P) => { R.e(8, 9, 4, 5, P.c); R(8, 5, 1, 9, P.d); R.e(8, 4, 2, 2, P.k); R(5, 2, 1, 2, P.k); R(10, 2, 1, 2, P.k); R(3, 8, 2, 1, P.k); R(11, 8, 2, 1, P.k); R(6, 7, 1, 1, P.l); });
defineIconShape('shell', (R, P) => { R.e(8, 9, 6, 5, P.c); R.t([4, 13], [12, 13], [8, 15], P.c2); for (let i = 0; i < 5; i++) R(4 + i * 2, 6, 1, 7, P.d); R(5, 6, 6, 1, P.l); });
defineIconShape('gem', (R, P) => { R.t([8, 1], [14, 7], [2, 7], P.l); R.t([2, 7], [14, 7], [8, 15], P.c); R(7, 3, 2, 3, P.w); R.t([8, 7], [14, 7], [8, 15], P.c2); });
defineIconShape('root', (R, P) => { R.t([4, 6], [12, 6], [8, 15], P.c); R(5, 7, 3, 1, P.l); R(6, 1, 2, 5, P.c3 || '#4f9558'); R(8, 2, 2, 4, '#62ad66'); R(9, 9, 2, 1, P.d); });
defineIconShape('leafy', (R, P) => { R.e(8, 9, 6, 5, P.c); R.e(6, 7, 3, 3, P.l); R(8, 5, 1, 9, P.d); R(4, 13, 8, 2, P.c2); });
defineIconShape('fruit', (R, P) => { R.e(8, 9, 6, 6, P.c); R.e(6, 7, 2, 2, P.l); R(8, 1, 1, 3, '#7a4f3a'); R(9, 2, 3, 2, '#62ad66'); R(10, 12, 2, 2, P.c2); });
defineIconShape('berry', (R, P) => { for (const [x, y] of [[5, 7], [10, 7], [7, 11], [4, 12], [11, 12]]) { R.e(x, y, 2, 2, P.c); R(x - 1, y - 1, 1, 1, P.l); } R(7, 2, 2, 3, '#4f9558'); });
defineIconShape('flower', (R, P) => { R(7, 9, 2, 6, '#4f9558'); R(4, 11, 3, 2, '#62ad66'); for (const [x, y] of [[8, 3], [5, 6], [11, 6], [6, 9], [10, 9]]) R.e(x, y, 2, 2, P.c); R.e(8, 6, 2, 2, P.c3 === P.c ? '#ffd76a' : '#ffd76a'); });
defineIconShape('mushroom', (R, P) => { R(6, 8, 4, 7, '#f4e4c1'); R.e(8, 7, 7, 4, P.c); R(3, 8, 10, 1, P.c2); R(5, 4, 2, 2, P.w); R(10, 5, 2, 1, P.w); });
defineIconShape('seed', (R, P) => { R(3, 2, 10, 12, '#f4e4c1'); R(3, 2, 10, 3, P.c); R.e(8, 9, 3, 3, P.c); R(7, 8, 1, 1, P.l); R(3, 13, 10, 1, '#c9b8a2'); });
defineIconShape('bowl', (R, P) => { R.e(8, 8, 7, 3, P.c); R.e(8, 7, 5, 2, P.l); R(2, 9, 12, 3, '#f4e4c1'); R(4, 12, 8, 2, '#c9b8a2'); R(5, 6, 2, 1, P.c3); });
defineIconShape('plate', (R, P) => { R.e(8, 10, 7, 3, '#fffaf0'); R.e(8, 10, 5, 2, '#e8dcc0'); R.e(8, 8, 4, 3, P.c); R(6, 6, 2, 1, P.l); });
defineIconShape('cup', (R, P) => { R(4, 5, 8, 9, '#fffaf0'); R(4, 5, 8, 3, P.c); R(12, 7, 2, 4, '#fffaf0'); R(5, 13, 6, 1, '#c9b8a2'); R(6, 2, 1, 2, '#ffffff'); R(9, 1, 1, 3, '#ffffff'); });
defineIconShape('bottle', (R, P) => { R(6, 1, 4, 3, P.c2); R(5, 4, 6, 11, P.c); R(6, 6, 1, 7, P.l); R(5, 9, 6, 3, '#fffaf0'); });
defineIconShape('bread', (R, P) => { R.e(8, 9, 7, 5, P.c); R.e(8, 8, 5, 3, P.l); R(5, 7, 1, 3, P.d); R(8, 6, 1, 3, P.d); R(11, 7, 1, 3, P.d); });
defineIconShape('sweet', (R, P) => { R.e(8, 9, 5, 5, P.c); R.e(7, 8, 2, 2, P.l); R(2, 8, 2, 2, P.c2); R(12, 8, 2, 2, P.c2); R(1, 7, 1, 4, P.c2); R(14, 7, 1, 4, P.c2); });
defineIconShape('onigiri', (R, P) => { R.t([8, 2], [14, 13], [2, 13], '#fffaf0'); R(5, 9, 6, 5, P.c === '#e0a84a' ? '#2a3a2e' : P.c); R(7, 6, 2, 2, '#e8dcc0'); });
defineIconShape('book', (R, P) => { R(3, 2, 10, 12, P.c); R(3, 2, 2, 12, P.d); R(6, 4, 6, 1, P.l); R(6, 6, 5, 1, P.l); R(4, 13, 9, 1, '#fffaf0'); });
defineIconShape('letter', (R, P) => { R(2, 4, 12, 9, '#fffaf0'); R.t([2, 4], [14, 4], [8, 9], '#e8dcc0'); R(7, 8, 2, 2, P.c); });
defineIconShape('paper', (R, P) => { R(3, 2, 10, 12, '#fffaf0'); R(5, 5, 6, 1, P.c); R(5, 7, 5, 1, '#c9b8a2'); R(5, 9, 6, 1, '#c9b8a2'); R(10, 2, 3, 3, '#e8dcc0'); });
defineIconShape('star', (R, P) => { R.t([8, 1], [10, 6], [6, 6], P.c); R.t([1, 6], [15, 6], [8, 11], P.c); R.t([8, 9], [3, 15], [5, 8], P.c); R.t([8, 9], [13, 15], [11, 8], P.c); R(7, 5, 2, 3, P.l); });
defineIconShape('key', (R, P) => { R.e(5, 5, 3, 3, P.c); R(4, 4, 2, 2, '#2a1a22'); R(7, 7, 7, 2, P.c); R(11, 9, 2, 3, P.c); R(13, 9, 1, 2, P.c); });
defineIconShape('tool', (R, P) => { R(7, 6, 2, 9, '#a67548'); R(3, 2, 10, 4, P.c); R(3, 2, 10, 1, P.l); });
defineIconShape('shirt', (R, P) => { R(4, 4, 8, 10, P.c); R(1, 4, 4, 4, P.c); R(11, 4, 4, 4, P.c); R(6, 4, 4, 2, P.c2); R(4, 13, 8, 1, P.d); R(5, 6, 1, 6, P.l); });
defineIconShape('hat', (R, P) => { R.e(8, 9, 5, 4, P.c); R(1, 11, 14, 2, P.c2); R(4, 8, 8, 1, P.c3); });
defineIconShape('toy', (R, P) => { R.e(8, 9, 5, 5, P.c); R(3, 4, 3, 3, P.c); R(10, 4, 3, 3, P.c); R(6, 8, 1, 1, '#2a1a22'); R(9, 8, 1, 1, '#2a1a22'); R(7, 11, 2, 1, P.c2); });
defineIconShape('furniture', (R, P) => { R(2, 5, 12, 7, P.c); R(2, 5, 12, 2, P.l); R(3, 12, 2, 3, P.d); R(11, 12, 2, 3, P.d); });
defineIconShape('plant', (R, P) => { R(5, 10, 6, 5, P.c2 === P.c ? '#bd5460' : '#bd5460'); R(4, 9, 8, 2, '#e0707a'); R.e(8, 6, 5, 4, P.c); R(7, 3, 2, 6, '#4f9558'); });
defineIconShape('rock', (R, P) => { R.e(8, 10, 6, 4, P.c); R.e(7, 9, 3, 2, P.l); R(9, 11, 3, 1, P.d); });
defineIconShape('coin', (R, P) => { R.e(8, 8, 6, 6, '#ffd76a'); R.e(8, 8, 4, 4, '#e8a83a'); R(7, 5, 2, 6, '#fff3c0'); });
defineIconShape('ticket', (R, P) => { R(1, 4, 14, 8, P.c); R(1, 7, 1, 2, '#fffaf0'); R(14, 7, 1, 2, '#fffaf0'); R(5, 4, 1, 8, P.l); R(8, 6, 4, 1, '#fffaf0'); R(8, 9, 3, 1, '#fffaf0'); });
defineIconShape('stamp', (R, P) => { R(2, 2, 12, 12, '#fffaf0'); R(4, 4, 8, 8, P.c); R(6, 6, 4, 3, P.l); for (let i = 2; i < 14; i += 2) { R(i, 1, 1, 1, '#fffaf0'); R(i, 14, 1, 1, '#fffaf0'); } });
defineIconShape('feather', (R, P) => { R.t([12, 2], [4, 12], [8, 13], P.c); R(4, 12, 1, 3, '#a67548'); R(9, 5, 1, 6, P.l); });
