// All pixel art lives here as pixel-rect drawing code, so it can be baked to
// canvases in the browser and exported to PNG (tools/build-art.mjs) for editing
// in Moonkai Pixel Studio or any other pixel editor.
import { BufferSurface, MirrorSurface } from './surface.js';

export const P = {
  ink: '#2b1d2e', white: '#fffaf0', cream: '#fff1d6', paper: '#f4e4c1',
  skin: '#f6cfae', skin2: '#dda985', blush: '#f29aa0',
  hair: '#5a3a86', hair2: '#7f5cae', hair3: '#3f2762',
  mint: '#86cdb0', mint2: '#5eaa92', shoe: '#8a5a44',
  cat: '#f2b56b', cat2: '#d98d45', cat3: '#fff1d6', eye: '#5fb56a', pink: '#f7a1b1',
  wood: '#d3a574', wood2: '#c39264', wood3: '#a67548', dark: '#7a4f3a',
  tileA: '#f4ead6', tileB: '#dccdb0', bathA: '#c6e7ea', bathB: '#a3cdd4',
  sunA: '#b4d896', sunB: '#9cc57c', wallTop: '#8d6470', wall: '#f0dcc8', wall2: '#d9bfa8',
  red: '#e0707a', red2: '#bd5460', blue: '#7fb2e0', blue2: '#5a8cc0', steel: '#b9c6d2', steel2: '#8a9aab',
  yellow: '#ffd76a', green: '#79b86a', green2: '#4f9558', leaf: '#5fa86a', brown: '#8a5a3a',
  sky: '#bfe6f5',
};

export const SPRITES = {};
const def = (name, w, h, draw, flip = false, outline = false) => { SPRITES[name] = { w, h, draw, flip, outline }; };

// R(x,y,w,h,color) plus R.e (ellipse: cx,cy,rx,ry,color) and R.t (triangle: [x,y]x3, color).
export function makeR(surface, ox = 0, oy = 0) {
  const R = (x, y, w, h, c) => surface.rect(x + ox, y + oy, w, h, c);
  R.e = (cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))) + 0.5);
      surface.rect(cx - w + ox, cy + y + oy, w * 2 + 1, 1, c);
    }
  };
  R.t = (a, b, cc, c) => {
    const pts = [a, b, cc], ys = pts.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < 3; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3];
        if (y1 === y2) { if (y1 === y) { lo = Math.min(lo, x1, x2); hi = Math.max(hi, x1, x2); } continue; }
        if ((y - y1) * (y - y2) <= 0) { const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1); lo = Math.min(lo, x); hi = Math.max(hi, x); }
      }
      if (lo <= hi) surface.rect(Math.round(lo) + ox, y + oy, Math.round(hi) - Math.round(lo) + 1, 1, c);
    }
  };
  R.at = (dx, dy) => makeR(surface, ox + dx, oy + dy);
  return R;
}

// ---------- Misa (22x34, chibi anime proportions, auto-outlined) ----------
// Look: brown bob with a pink streak, big glossy eyes, navy hoodie, dark pants, white sneakers.
const MC = { hair: '#8b5a44', hairH: '#b98262', hairD: '#5a3a2e', pink: '#f0a0b8', skin: '#f8d5b8', skin2: '#e3a98a', navy: '#3d5a8c', navy2: '#2c4270', navyL: '#5f80b4', pants: '#2a3552', pants2: '#1f2840', shoe: '#f4f4f8', sole: '#8a90a8', ink: '#2a1a22', iris: '#b0703c', blush: '#f5a0a8', mouth: '#b04a55', cream: '#fff1d6' };
// Misa's world/cutscene animation comes from Moonkai Pixel Studio's Character builder (see src/moonkai.js).

// ---------- Mochi the cat (auto-outlined, facing right; flipped at runtime) ----------
const CC = { o: '#f2b56b', o2: '#d98d45', o3: '#b8702f', cream: '#fff1d6', pink: '#f7a1b1', eye: '#6fcf7a', ink: '#2a1a22' };
function mochiWalk(R0, p) {
  const R = R0.at(1, 1), tw = [0, -1, 0, 1][p];
  R(2 + tw, 7, 3, 3, CC.o2); R(1 + tw, 9, 3, 4, CC.o2); R(2, 12, 4, 3, CC.o2); R(2 + tw, 6, 3, 2, CC.cream);
  const a = [2, 0, -2, 0][p], b = -a;
  R(16 + a, 17, 3, 5, CC.o3); R(7 + b, 17, 3, 5, CC.o3);
  R.e(11, 14, 8, 5, CC.o); R.e(11, 18, 6, 2, CC.cream); R(6, 10, 2, 3, CC.o2); R(10, 9, 2, 3, CC.o2); R(14, 10, 2, 3, CC.o2);
  R(15 - a, 17, 3, 5, CC.o); R(15 - a, 21, 3, 1, CC.cream); R(6 - b, 17, 3, 5, CC.o); R(6 - b, 21, 3, 1, CC.cream);
  R.e(19, 10, 5, 5, CC.o); R.t([15, 8], [17, 2], [20, 7], CC.o); R.t([20, 7], [23, 2], [24, 9], CC.o); R(17, 4, 1, 3, CC.pink); R(23, 4, 1, 3, CC.pink);
  R.e(22, 13, 3, 2, CC.cream); R(24, 11, 1, 1, CC.pink); R(21, 8, 2, 3, CC.eye); R(22, 8, 1, 1, '#ffffff'); R(18, 6, 1, 2, CC.o2);
}
for (let f = 0; f < 4; f++) def(`mochi_walk_${f}`, 27, 25, (R) => mochiWalk(R, f), false, true);
function mochiSit(R0, tail, blink) {
  const R = R0.at(1, 1);
  const tx = [0, 1, 2, 1][tail];
  R(16, 15, 4 + tx, 3, CC.o2); R(18 + tx, 11, 3, 6, CC.o2); R(19 + tx, 9, 3, 3, CC.cream);
  R.e(11, 17, 6, 6, CC.o); R.e(11, 20, 4, 3, CC.cream); R(7, 21, 3, 2, CC.cream); R(12, 21, 3, 2, CC.cream);
  R(6, 15, 1, 3, CC.o2); R(16, 15, 1, 3, CC.o2);
  R.e(11, 9, 7, 6, CC.o); R.t([5, 7], [6, 0], [10, 4], CC.o); R.t([12, 4], [16, 0], [17, 7], CC.o);
  R.t([7, 5], [7, 2], [9, 4], CC.pink); R.t([13, 4], [15, 2], [15, 5], CC.pink);
  R(10, 3, 1, 3, CC.o2); R(12, 3, 1, 3, CC.o2);
  if (blink) { R(7, 10, 3, 1, CC.ink); R(13, 10, 3, 1, CC.ink); }
  else { R(7, 8, 3, 4, CC.eye); R(13, 8, 3, 4, CC.eye); R(8, 8, 1, 4, CC.ink); R(14, 8, 1, 4, CC.ink); R(7, 8, 1, 1, '#ffffff'); R(13, 8, 1, 1, '#ffffff'); }
  R.e(11, 13, 3, 2, CC.cream); R(11, 11, 1, 1, CC.pink);
}
for (let t = 0; t < 4; t++) def(`mochi_sit_${t}`, 26, 26, (R) => mochiSit(R, t, false), false, true);
def('mochi_sit_b', 26, 26, (R) => mochiSit(R, 0, true), false, true);
function mochiSleep(R0, br) {
  const R = R0.at(1, 1);
  R.e(13, 11 - br, 11, 5 + br, CC.o); R(17, 6 - br, 1, 3, CC.o2); R(12, 5 - br, 1, 3, CC.o2); R(8, 6 - br, 1, 3, CC.o2);
  R(16, 12, 9, 3, CC.o2); R(22, 12, 3, 3, CC.cream);
  R.e(6, 11, 4, 4, CC.o); R.t([3, 9], [3, 5], [6, 8], CC.o); R.t([6, 8], [9, 5], [9, 9], CC.o); R(4, 6, 1, 2, CC.pink);
  R(3, 11, 3, 1, CC.ink); R(5, 13, 1, 1, CC.pink); R(3, 13, 3, 1, CC.cream);
}
for (let b = 0; b < 2; b++) def(`mochi_sleep_${b}`, 28, 18, (R) => mochiSleep(R, b), false, true);
def('heart', 7, 6, (R) => { R(1, 0, 2, 1, P.red); R(4, 0, 2, 1, P.red); R(0, 1, 7, 2, P.red); R(1, 3, 5, 1, P.red); R(2, 4, 3, 1, P.red); R(3, 5, 1, 1, P.red); R(1, 1, 1, 1, P.white); });
def('zzz', 8, 8, (R) => { R(0, 0, 4, 1, P.white); R(2, 1, 1, 1, P.white); R(1, 2, 1, 1, P.white); R(0, 3, 4, 1, P.white); });

def('heart', 7, 6, (R) => { R(1, 0, 2, 1, P.red); R(4, 0, 2, 1, P.red); R(0, 1, 7, 2, P.red); R(1, 3, 5, 1, P.red); R(2, 4, 3, 1, P.red); R(3, 5, 1, 1, P.red); R(1, 1, 1, 1, P.white); });
def('zzz', 8, 8, (R) => { R(0, 0, 4, 1, P.white); R(2, 1, 1, 1, P.white); R(1, 2, 1, 1, P.white); R(0, 3, 4, 1, P.white); });

// ---------- Tiles (16x16) ----------
def('t_wood', 16, 16, (R) => {
  R(0, 0, 16, 16, P.wood); R(0, 7, 16, 1, P.wood3); R(0, 15, 16, 1, P.wood3);
  R(5, 0, 1, 7, P.wood3); R(11, 8, 1, 7, P.wood3); R(2, 3, 3, 1, P.wood2); R(8, 11, 4, 1, P.wood2); R(9, 2, 3, 1, P.wood2);
});
def('t_kitchen', 16, 16, (R) => { R(0, 0, 16, 16, P.tileA); R(0, 0, 8, 8, P.tileB); R(8, 8, 8, 8, P.tileB); });
def('t_bath', 16, 16, (R) => { R(0, 0, 16, 16, P.bathA); R(0, 0, 16, 1, P.bathB); R(0, 0, 1, 16, P.bathB); R(8, 0, 1, 16, P.bathB); R(0, 8, 16, 1, P.bathB); R(3, 3, 2, 1, P.white); });
def('t_sun', 16, 16, (R) => { R(0, 0, 16, 16, P.sunA); R(0, 0, 16, 1, P.sunB); R(0, 0, 1, 16, P.sunB); R(4, 5, 1, 2, P.sunB); R(11, 10, 1, 2, P.sunB); R(12, 4, 2, 1, P.sunB); });
def('t_wall_top', 16, 16, (R) => { R(0, 0, 16, 16, P.wallTop); R(0, 0, 16, 2, '#a07c86'); });
def('t_wall_face', 16, 16, (R) => {
  R(0, 0, 16, 16, P.wallTop); R(0, 4, 16, 12, P.wall); R(0, 4, 16, 1, '#a07c86');
  R(0, 12, 16, 4, P.wall2); R(0, 12, 16, 1, '#c5a58e'); R(3, 7, 1, 2, '#f8ebdd'); R(11, 6, 1, 2, '#f8ebdd');
});
def('t_door_floor', 16, 16, (R) => { R(0, 0, 16, 16, P.wood2); R(0, 0, 16, 2, P.wood3); R(0, 14, 16, 2, P.wood3); });

// ---------- Furniture ----------
def('window', 16, 16, (R) => {
  R(1, 3, 14, 11, P.wood3); R(2, 4, 12, 9, P.sky); R(7, 4, 2, 9, P.wood3); R(2, 8, 12, 1, P.wood3);
  R(3, 5, 3, 1, P.white); R(10, 10, 2, 1, P.white); R(0, 13, 16, 2, P.cream);
});
def('door', 16, 16, (R) => { R(1, 0, 14, 16, P.dark); R(3, 2, 10, 14, P.wood3); R(4, 3, 8, 6, P.wood2); R(4, 10, 8, 5, P.wood2); R(11, 9, 2, 2, P.yellow); });
def('fridge', 16, 32, (R) => {
  R(1, 1, 14, 31, P.steel); R(1, 1, 14, 1, P.white); R(1, 13, 14, 1, P.steel2); R(12, 5, 1, 5, P.steel2); R(12, 17, 1, 7, P.steel2);
  R(3, 3, 3, 1, P.white); R(4, 16, 2, 2, P.pink); R(0, 30, 16, 2, '#00000022');
});
def('sink', 32, 24, (R) => {
  R(0, 6, 32, 18, P.wood2); R(0, 6, 32, 4, P.tileA); R(0, 10, 32, 1, P.wood3); R(15, 12, 1, 12, P.wood3);
  R(6, 2, 20, 6, P.steel); R(8, 4, 16, 3, P.steel2); R(14, 0, 4, 3, P.steel2); R(16, 0, 6, 1, P.steel2);
  R(4, 15, 2, 2, P.yellow); R(26, 15, 2, 2, P.yellow);
});
def('dishpile', 24, 10, (R) => {
  R(2, 5, 9, 3, P.white); R(2, 7, 9, 1, P.blue); R(11, 3, 8, 4, P.cream); R(12, 2, 6, 1, P.white); R(5, 3, 5, 2, P.cream);
  R(8, 4, 2, 1, P.brown); R(14, 4, 2, 1, P.brown); R(4, 6, 2, 1, P.brown); R(19, 5, 3, 3, P.red2); R(19, 4, 3, 1, P.steel);
});
def('stove', 32, 24, (R) => {
  R(0, 4, 32, 20, P.steel); R(0, 4, 32, 5, P.steel2); R(3, 5, 9, 3, P.ink); R(18, 5, 9, 3, P.ink);
  R(3, 12, 26, 9, P.ink); R(5, 14, 22, 5, '#4a3a4e'); R(10, 10, 1, 2, P.red); R(20, 10, 1, 2, P.red);
  R(19, 0, 8, 5, P.red); R(18, 2, 1, 2, P.red2); R(27, 2, 2, 1, P.red2); R(22, 0, 2, 1, P.steel);
});
def('table', 32, 32, (R) => {
  R(2, 10, 28, 16, P.wood3); R(2, 8, 28, 14, P.wood); R(4, 6, 24, 4, P.wood2); R(3, 12, 26, 1, P.wood2);
  R(4, 22, 3, 8, P.wood3); R(25, 22, 3, 8, P.wood3); R(8, 8, 16, 8, P.cream); R(10, 9, 12, 6, P.red);
  R(13, 4, 6, 5, P.wood3); R(14, 3, 2, 3, P.red2); R(17, 4, 2, 2, P.yellow);
});
def('chair', 16, 16, (R) => { R(3, 5, 10, 3, P.wood3); R(3, 8, 10, 6, P.wood); R(3, 14, 2, 2, P.wood3); R(11, 14, 2, 2, P.wood3); R(4, 9, 8, 3, P.red); });
def('bowl_empty', 16, 8, (R) => { R(2, 3, 12, 5, P.blue2); R(3, 3, 10, 2, P.blue); R(4, 4, 8, 2, P.steel); R(6, 6, 4, 1, P.pink); });
def('bowl_full', 16, 8, (R) => { R(2, 3, 12, 5, P.blue2); R(3, 1, 10, 3, P.brown); R(5, 0, 6, 2, P.cat2); R(4, 2, 2, 1, P.cat); R(9, 2, 2, 1, P.cat); });
def('bookshelf', 16, 32, (R) => {
  R(1, 0, 14, 32, P.wood3); R(2, 2, 12, 8, P.dark); R(2, 12, 12, 8, P.dark); R(2, 22, 12, 8, P.dark);
  const cols = [P.red, P.blue, P.yellow, P.green, P.pink, P.mint];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) R(3 + i * 2, 3 + r * 10 + (i % 2), 2, 7 - (i % 2), cols[(i + r * 2) % 6]);
});
def('sofa', 48, 28, (R) => {
  R(0, 4, 48, 22, P.red2); R(3, 0, 42, 12, P.red); R(0, 12, 8, 14, P.red); R(40, 12, 8, 14, P.red);
  R(8, 12, 32, 10, '#e9838c'); R(23, 12, 1, 10, P.red2); R(5, 26, 3, 2, P.dark); R(40, 26, 3, 2, P.dark); R(6, 3, 8, 3, '#ef959c');
  R(32, 13, 7, 6, P.yellow); R(33, 14, 5, 4, '#ffe79a');
});
def('rug_big', 48, 32, (R) => {
  R(0, 0, 48, 32, P.blue2); R(2, 2, 44, 28, P.cream); R(4, 4, 40, 24, P.blue);
  for (let i = 0; i < 6; i++) R(8 + i * 6, 8, 3, 16, i % 2 ? P.cream : P.pink);
});
def('rug_small', 32, 24, (R) => { R(0, 0, 32, 24, P.red2); R(2, 2, 28, 20, P.cream); R(4, 4, 24, 16, P.pink); R(12, 8, 8, 8, P.cream); });
def('broomstand', 16, 24, (R) => {
  R(2, 0, 12, 24, P.wood3); R(3, 1, 10, 22, P.dark); R(5, 4, 2, 15, P.yellow); R(4, 16, 4, 6, P.brown); R(10, 8, 3, 12, P.steel); R(10, 6, 5, 3, P.steel2);
});
def('dust', 16, 8, (R) => { R(2, 3, 4, 2, '#b9a58d'); R(8, 2, 3, 2, '#c9b8a2'); R(11, 5, 3, 2, '#b9a58d'); R(5, 5, 2, 1, '#a39078'); });
def('washer', 16, 24, (R) => {
  R(1, 2, 14, 22, P.white); R(1, 2, 14, 4, P.steel); R(3, 3, 2, 2, P.red); R(7, 3, 2, 2, P.blue); R(4, 9, 8, 8, P.steel2);
  R(5, 10, 6, 6, P.blue); R(6, 11, 3, 2, P.white); R(0, 22, 16, 2, '#00000022');
});
def('basket', 16, 16, (R) => { R(1, 6, 14, 10, P.wood); R(1, 6, 14, 2, P.wood3); R(3, 10, 10, 1, P.wood3); R(1, 13, 14, 1, P.wood3); });
def('basket_full', 16, 16, (R) => { R(1, 6, 14, 10, P.wood); R(1, 6, 14, 2, P.wood3); R(3, 11, 10, 1, P.wood3); R(2, 1, 6, 6, P.blue); R(7, 0, 7, 6, P.pink); R(5, 3, 5, 4, P.yellow); R(12, 3, 3, 2, P.mint); });
def('tub', 32, 24, (R) => {
  R(0, 4, 32, 20, P.white); R(2, 6, 28, 14, P.blue); R(2, 6, 28, 3, P.bathA); R(0, 22, 32, 2, P.steel); R(4, 22, 3, 2, P.yellow); R(25, 22, 3, 2, P.yellow); R(26, 0, 4, 5, P.steel2);
  R(6, 10, 5, 3, P.white); R(9, 8, 3, 3, P.white);
});
def('bed', 32, 48, (R) => {
  R(0, 0, 32, 48, P.wood3); R(2, 2, 28, 44, P.cream); R(2, 2, 28, 12, P.white); R(5, 4, 9, 6, P.pink); R(18, 4, 9, 6, P.pink);
  R(2, 16, 28, 30, P.blue); R(2, 16, 28, 4, P.blue2); R(4, 24, 24, 2, P.blue2); R(4, 34, 24, 2, P.blue2); R(2, 44, 28, 4, P.wood3);
});
def('cushion', 16, 12, (R) => { R(1, 2, 14, 10, P.red2); R(2, 1, 12, 10, P.red); R(4, 3, 8, 6, P.pink); });
def('desk', 32, 24, (R) => {
  R(0, 6, 32, 6, P.wood); R(0, 12, 32, 12, P.wood3); R(2, 14, 12, 9, P.dark); R(18, 14, 12, 9, P.dark); R(0, 6, 32, 1, P.wood2);
  R(3, 0, 8, 7, P.steel); R(4, 1, 6, 4, P.sky); R(22, 2, 4, 5, P.yellow); R(23, 0, 2, 3, P.white); R(14, 3, 6, 4, P.cream);
});
def('pot_ok', 16, 20, (R) => {
  R(4, 12, 8, 8, P.red2); R(3, 11, 10, 3, P.red); R(7, 3, 2, 9, P.green2);
  R(3, 4, 5, 4, P.leaf); R(8, 2, 5, 4, P.leaf); R(4, 8, 4, 3, P.green); R(7, 0, 2, 3, P.pink); R(6, 1, 4, 1, P.pink); R(7, 1, 2, 1, P.yellow);
});
def('pot_wilt', 16, 20, (R) => {
  R(4, 12, 8, 8, P.red2); R(3, 11, 10, 3, P.red); R(7, 7, 2, 5, '#8a8a4a'); R(4, 7, 4, 2, '#a3a04f'); R(8, 6, 5, 2, '#a3a04f'); R(2, 9, 3, 2, '#8a8a4a'); R(11, 8, 3, 2, '#8a8a4a');
});
def('lamp', 16, 28, (R) => { R(3, 0, 10, 8, P.yellow); R(4, 1, 8, 6, '#fff0b0'); R(7, 8, 2, 16, P.dark); R(4, 24, 8, 3, P.dark); });
def('cactus', 16, 16, (R) => { R(5, 11, 6, 5, P.red2); R(6, 2, 4, 10, P.green); R(3, 5, 3, 2, P.green); R(3, 5, 2, 4, P.green); R(10, 6, 3, 2, P.green); R(11, 4, 2, 4, P.green); R(7, 1, 2, 1, P.pink); });
def('poster', 16, 16, (R) => { R(2, 1, 12, 14, P.cream); R(3, 2, 10, 12, P.sky); R(4, 9, 8, 5, P.green); R(9, 3, 3, 3, P.yellow); R(5, 5, 2, 3, P.white); });
def('plushie', 16, 16, (R) => { R(4, 4, 8, 9, P.pink); R(3, 2, 3, 3, P.pink); R(10, 2, 3, 3, P.pink); R(6, 7, 1, 2, P.ink); R(9, 7, 1, 2, P.ink); R(7, 10, 2, 1, P.red2); R(6, 13, 4, 2, P.pink); });
def('bunting', 64, 12, (R) => {
  R(0, 1, 64, 1, P.dark);
  [P.red, P.yellow, P.blue, P.mint].forEach((c, i) => { for (let k = 0; k < 2; k++) { const x = 3 + (i * 2 + k) * 8; R(x, 2, 6, 2, c); R(x + 1, 4, 4, 2, c); R(x + 2, 6, 2, 2, c); } });
});
def('mat', 16, 8, (R) => { R(0, 0, 16, 8, P.dark); R(1, 1, 14, 6, P.brown); R(4, 3, 8, 2, P.yellow); });

// ---------- Portraits (64x64, anime style, auto-outlined; blink + talking frames) ----------
const PAL = {
  misa: { hair: MC.hair, hairH: MC.hairH, hairD: MC.hairD, skin: MC.skin, skin2: MC.skin2, iris: '#b0703c', iris2: '#6a3a24', top: MC.navy, top2: MC.navy2, topL: MC.navyL },
  pip: { hair: '#4a3436', hairH: '#6a4e50', hairD: '#2f2024', skin: '#f2c9a4', skin2: '#d6a07c', iris: '#5a7a4a', iris2: '#34502c', top: '#5a8cc0', top2: '#3f6a98', topL: '#7fb2e0' },
};
function facePortrait(R, who, mood, mouth, blink) {
  const c = PAL[who];
  // hair back + shoulders
  R.e(32, 30, 26, 27, c.hairD); R(6, 32, 9, 22, c.hairD); R(49, 32, 9, 22, c.hairD); R.e(10, 53, 4, 3, c.hairD); R.e(53, 53, 4, 3, c.hairD);
  R.e(32, 66, 29, 16, c.top); R.e(32, 62, 22, 8, c.topL); R(40, 58, 20, 10, c.top2); R.e(32, 57, 7, 3, c.skin2);
  R(28, 60, 1, 5, '#fff1d6'); R(36, 60, 1, 5, '#fff1d6');
  R(28, 46, 8, 9, c.skin2);
  // face
  R.e(32, 33, 18, 16, c.skin); R.e(32, 43, 13, 9, c.skin); R.e(32, 50, 7, 3, c.skin);
  R.e(15, 38, 3, 4, c.skin); R.e(49, 38, 3, 4, c.skin);
  // eyes
  const eye = (cx, side) => {
    const rx = mood === 'surprised' ? 6 : 5, ry = mood === 'surprised' ? 7 : 6;
    if (blink || mood === 'happy') {
      if (mood === 'happy') { R(cx - 4, 40, 3, 1, MC.ink); R(cx - 2, 38, 5, 2, MC.ink); R(cx + 2, 40, 3, 1, MC.ink); }
      else { R(cx - 5, 39, 11, 2, MC.ink); R(cx - 5 + (side < 0 ? -1 : 6), 38, 1, 2, MC.ink); }
      return;
    }
    R.e(cx, 38, rx, ry, MC.ink); R.e(cx, 39, rx - 1, ry - 1, c.iris); R.e(cx, 40, rx - 2, ry - 2, c.iris2); R.e(cx, 39, mood === 'surprised' ? 1 : 2, mood === 'surprised' ? 2 : 3, MC.ink);
    R(cx - 3, 35, 3, 3, '#ffffff'); R(cx + 2, 41, 2, 2, '#ffffffcc');
    R(cx - rx - 1, 32, rx * 2 + 3, 2, MC.ink); R(side < 0 ? cx - rx - 3 : cx + rx + 1, 33, 3, 2, MC.ink);
    if (mood === 'sleepy') { R(cx - rx - 1, 33, rx * 2 + 3, 5, c.skin); R(cx - rx - 1, 38, rx * 2 + 3, 2, MC.ink); R(cx - rx - 1, 36, rx * 2 + 3, 2, c.skin2); }
  };
  eye(23, -1); eye(41, 1);
  R(17, mood === 'surprised' ? 26 : 29, 9, 1, c.hairD); R(38, mood === 'surprised' ? 26 : 29, 9, 1, c.hairD);
  R(31, 45, 2, 1, '#d99a80'); R.e(19, 46, 3, 2, '#f5a0a8'); R.e(45, 46, 3, 2, '#f5a0a8');
  // mouth
  const open = mouth === 1;
  if (mood === 'happy') { if (open) { R.e(32, 50, 4, 3, '#7a2a35'); R(30, 51, 5, 2, '#f08a94'); R(29, 48, 7, 1, MC.mouth); } else { R(28, 48, 1, 1, MC.mouth); R(29, 49, 6, 1, MC.mouth); R(35, 48, 1, 1, MC.mouth); } }
  else if (mood === 'surprised') R.e(32, 50, open ? 3 : 2, open ? 4 : 3, '#7a2a35');
  else if (open) R.e(32, 50, 2, 2, '#7a2a35');
  else R(29, 50, 6, 1, MC.mouth);
  // bangs
  R.e(32, 20, 24, 15, c.hair); R(8, 24, 4, 20, c.hair); R(52, 24, 4, 20, c.hair);
  R.t([10, 24], [34, 16], [21, 32], c.hair); R.t([30, 18], [55, 26], [46, 32], c.hair); R.t([25, 22], [37, 22], [31, 30], c.hair);
  R.e(28, 12, 15, 3, c.hairH); R(38, 14, 10, 1, c.hairH); R(12, 24, 2, 8, c.hairH);
  if (who === 'misa') R.t([37, 20], [43, 22], [40, 30], MC.pink);
  if (who === 'pip') { R.e(32, 15, 24, 11, '#5a8cc0'); R(8, 22, 48, 4, '#3f6a98'); R(40, 16, 22, 8, '#5a8cc0'); R.e(32, 15, 8, 5, '#ffd76a'); R.e(32, 15, 5, 3, '#e0707a'); R.e(20, 46, 1, 1, '#c9805e'); R.e(43, 47, 1, 1, '#c9805e'); }
}
for (const who of ['misa', 'pip']) for (const mood of who === 'misa' ? ['neutral', 'happy', 'surprised', 'sleepy'] : ['neutral', 'happy'])
  for (const m of [0, 1]) for (const b of [0, 1]) def(`p_${who}_${mood}_${m}${b}`, 64, 64, (R) => facePortrait(R, who, mood, m, !!b), false, true);

function mochiPortrait(R, mood, mouth, blink) {
  R.e(32, 60, 22, 14, CC.o); R.e(32, 62, 12, 10, CC.cream);
  R.t([8, 30], [12, 3], [30, 16], CC.o); R.t([34, 16], [52, 3], [56, 30], CC.o); R.t([13, 22], [14, 9], [25, 17], CC.pink); R.t([39, 17], [50, 9], [51, 22], CC.pink);
  R.e(32, 36, 25, 20, CC.o); R.e(9, 42, 4, 5, CC.o); R.e(55, 42, 4, 5, CC.o);
  R(31, 17, 3, 9, CC.o2); R(24, 18, 3, 6, CC.o2); R(38, 18, 3, 6, CC.o2); R(9, 36, 5, 2, CC.o2); R(50, 36, 5, 2, CC.o2);
  R.e(32, 47, 11, 7, CC.cream); R.e(24, 46, 5, 5, CC.cream); R.e(40, 46, 5, 5, CC.cream);
  for (const [cx, s] of [[21, -1], [43, 1]]) {
    if (blink || mood === 'happy') { R(cx - 5, mood === 'happy' ? 37 : 39, 3, 1, CC.ink); R(cx - 3, mood === 'happy' ? 35 : 39, 6, 2, CC.ink); R(cx + 3, mood === 'happy' ? 37 : 39, 3, 1, CC.ink); }
    else { R.e(cx, 38, 6, 7, CC.ink); R.e(cx, 38, 5, 6, CC.eye); R.e(cx, 39, 2, 5, CC.ink); R(cx - 3, 34, 3, 3, '#ffffff'); R(cx + 1, 41, 2, 2, '#ffffffcc'); if (mood === 'sleepy') { R(cx - 6, 31, 13, 7, CC.o); R(cx - 6, 38, 13, 2, CC.ink); } }
  }
  R.t([29, 43], [35, 43], [32, 47], CC.pink); R(32, 47, 1, 2, CC.ink);
  if (mood === 'happy' || mouth) { R.e(32, 52, 3, mouth ? 3 : 1, '#7a2a35'); if (mouth) R(31, 53, 3, 1, '#f08a94'); } else { R(28, 49, 4, 1, CC.ink); R(33, 49, 4, 1, CC.ink); R(31, 48, 1, 1, CC.ink); }
  for (const s of [-1, 1]) for (const dy of [-2, 1, 4]) R(s < 0 ? 4 : 46, 46 + dy, 12, 1, '#fff1d6');
  R.e(32, 18, 8, 2, CC.o3);
}
for (const mood of ['neutral', 'happy', 'sleepy']) for (const m of [0, 1]) for (const b of [0, 1]) def(`p_mochi_${mood}_${m}${b}`, 64, 64, (R) => mochiPortrait(R, mood, m, !!b), false, true);

// ---------- Item icons (16x16) for the feed minigame ----------
def('i_fish', 16, 16, (R) => { R(2, 5, 9, 6, P.blue); R(3, 4, 6, 1, P.blue2); R(3, 11, 6, 1, P.blue2); R(11, 4, 4, 3, P.blue2); R(11, 9, 4, 3, P.blue2); R(4, 7, 2, 2, P.white); R(4, 7, 1, 1, P.ink); R(7, 6, 1, 4, P.steel); });
def('i_chicken', 16, 16, (R) => { R(3, 3, 9, 8, P.cat2); R(4, 4, 7, 6, P.cat); R(11, 9, 2, 2, P.cream); R(13, 11, 2, 3, P.cream); R(12, 13, 4, 2, P.white); R(5, 5, 3, 1, P.yellow); });
def('i_kibble', 16, 16, (R) => { R(2, 8, 12, 6, P.brown); R(3, 5, 4, 4, P.cat2); R(8, 4, 4, 4, P.cat2); R(6, 8, 4, 3, P.cat); R(11, 9, 3, 3, P.cat2); R(3, 10, 2, 2, P.cat); });
def('i_paw', 16, 16, (R) => { R(5, 8, 6, 5, P.pink); R(2, 5, 3, 3, P.pink); R(6, 2, 3, 4, P.pink); R(10, 2, 3, 4, P.pink); R(13, 5, 3, 3, P.pink); });
def('i_star', 16, 16, (R) => { R(7, 1, 2, 14, P.yellow); R(1, 6, 14, 3, P.yellow); R(4, 3, 8, 9, P.yellow); R(6, 5, 4, 5, '#fff0b0'); });
def('i_coin', 8, 8, (R) => { R(1, 0, 6, 8, P.yellow); R(0, 1, 8, 6, P.yellow); R(2, 2, 2, 4, '#fff0b0'); R(5, 5, 2, 1, '#c9a13f'); });

// Pip the postie (world sprite)
def('pip', 22, 34, (R0) => {
  const R = R0.at(1, 1), P2 = { navy: '#5a8cc0', navy2: '#3f6a98', navyL: '#7fb2e0' };
  R(6, 25, 3, 4, '#2f4a70'); R(11, 25, 3, 4, '#2f4a70'); R(5, 29, 4, 3, MC.pants2); R(11, 29, 4, 3, MC.pants2);
  R(5, 16, 10, 10, P2.navy); R(12, 16, 3, 10, P2.navy2); R(4, 15, 12, 3, P2.navyL); R(2, 17, 3, 8, P2.navy); R(15, 17, 3, 8, P2.navy2); R(2, 25, 3, 2, '#f2c9a4'); R(15, 25, 3, 2, '#d6a07c');
  R(12, 19, 6, 6, '#8a5a3a'); R(13, 20, 4, 1, '#ffd76a');
  R.e(10, 9, 8, 7, '#2f2024'); R.e(10, 11, 6, 5, '#f2c9a4'); R(5, 13, 10, 3, '#f2c9a4');
  R.e(10, 5, 9, 4, '#5a8cc0'); R(3, 6, 16, 3, '#3f6a98'); R(8, 3, 4, 2, '#ffd76a');
  R(5, 10, 3, 3, MC.ink); R(12, 10, 3, 3, MC.ink); R(5, 10, 1, 1, '#ffffff'); R(12, 10, 1, 1, '#ffffff'); R(9, 15, 2, 1, MC.mouth); R(3, 13, 2, 1, MC.blush); R(15, 13, 2, 1, MC.blush);
}, false, true);

export function drawSprite(name, surface) {
  const d = SPRITES[name];
  if (!d) throw new Error(`unknown sprite ${name}`);
  d.draw(makeR(surface));
}

// Selective outline: every empty pixel touching the sprite gets a dark shade of its neighbour's colour.
function outlineBuffer(b, k = 0.36) {
  const { w, h, data } = b, out = new Uint8ClampedArray(data);
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 40;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (solid(x, y)) continue;
    let r = 0, g = 0, bl = 0, n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(x + dx, y + dy)) {
      const o = ((y + dy) * w + x + dx) * 4; r += data[o]; g += data[o + 1]; bl += data[o + 2]; n++;
    }
    if (!n) continue;
    const o = (y * w + x) * 4;
    out[o] = (r / n) * k + 30 * (1 - k) * 0.5; out[o + 1] = (g / n) * k + 18 * (1 - k) * 0.5; out[o + 2] = (bl / n) * k + 40 * (1 - k) * 0.6; out[o + 3] = 255;
  }
  data.set(out);
}

// Render a sprite to an RGBA buffer (mirrored / outlined as its definition asks).
export function renderSprite(name, flip = false) {
  const d = SPRITES[name];
  const buf = new BufferSurface(d.w, d.h);
  drawSprite(name, flip !== d.flip ? new MirrorSurface(buf, d.w) : buf);
  if (d.outline) outlineBuffer(buf);
  return buf;
}
