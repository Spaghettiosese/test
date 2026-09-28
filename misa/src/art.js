// All pixel art lives here as pixel-rect drawing code, so it can be baked to
// canvases in the browser and exported to PNG (tools/build-art.mjs) for editing
// in Moonkai Pixel Studio or any other pixel editor.
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
const def = (name, w, h, draw, flip = false) => { SPRITES[name] = { w, h, draw, flip }; };

// ---------- Misa (16x24) ----------
function misa(R, dir, frame) {
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  // legs + shoes
  const lLift = step === 1 ? 1 : 0, rLift = step === -1 ? 1 : 0;
  if (dir === 'side') {
    R(6 + step, 19, 3, 3 - lLift, P.skin); R(6 + step, 22 - lLift, 4, 2, P.shoe);
    R(8 - step, 19, 3, 3 - rLift, P.skin2); R(8 - step, 22 - rLift, 4, 2, P.shoe);
  } else {
    R(5, 19, 2, 3 - lLift, P.skin); R(5, 22 - lLift, 3, 2, P.shoe);
    R(9, 19, 2, 3 - rLift, P.skin); R(8, 22 - rLift, 3, 2, P.shoe);
  }
  // dress
  if (dir === 'side') { R(5, 12, 6, 8, P.mint); R(5, 18, 6, 2, P.mint2); R(6, 13, 3, 6, P.cream); }
  else { R(4, 12, 8, 8, P.mint); R(4, 18, 8, 2, P.mint2); }
  if (dir === 'down') { R(6, 13, 4, 6, P.cream); R(7, 13, 2, 1, P.mint2); }
  if (dir === 'up') { R(7, 14, 2, 2, P.cream); R(6, 16, 1, 3, P.cream); R(9, 16, 1, 3, P.cream); }
  // arms
  if (dir === 'side') { R(7, 13, 2, 5, P.mint2); R(7, 17, 2, 2, P.skin); }
  else { R(2, 13, 2, 4, P.mint2); R(12, 13, 2, 4, P.mint2); R(2, 17, 2, 2, P.skin); R(12, 17, 2, 2, P.skin); }
  // head
  if (dir === 'side') {
    R(4, 4, 9, 8, P.hair); R(4, 7, 5, 5, P.skin); R(3, 8, 1, 3, P.skin); R(5, 9, 1, 2, P.ink);
    R(4, 10, 2, 1, P.blush); R(9, 2, 4, 4, P.hair2); R(11, 1, 3, 3, P.hair2); R(4, 4, 5, 3, P.hair2); R(10, 6, 4, 6, P.hair3);
  } else {
    R(3, 3, 10, 9, P.hair); R(2, 0, 4, 4, P.hair2); R(10, 0, 4, 4, P.hair2); R(3, 3, 10, 2, P.hair2);
    if (dir === 'down') {
      R(4, 6, 8, 5, P.skin); R(4, 5, 8, 2, P.hair); R(3, 6, 2, 6, P.hair); R(11, 6, 2, 6, P.hair);
      R(5, 8, 2, 2, P.ink); R(9, 8, 2, 2, P.ink); R(5, 8, 1, 1, P.white); R(9, 8, 1, 1, P.white);
      R(4, 10, 2, 1, P.blush); R(10, 10, 2, 1, P.blush); R(7, 10, 2, 1, P.red2);
    } else { R(4, 5, 8, 7, P.hair); R(6, 8, 4, 3, P.hair3); }
  }
}
for (const [d, n] of [['down', 'down'], ['up', 'up'], ['side', 'left']])
  for (let f = 0; f < 3; f++) def(`misa_${n}_${f}`, 16, 24, (R) => misa(R, d, f));
for (let f = 0; f < 3; f++) def(`misa_right_${f}`, 16, 24, (R) => misa(R, 'side', f), true);
// Misa standing on tiptoe / carrying nothing special is enough; sleepy pose for the bed
def('misa_sleep', 16, 12, (R) => {
  R(1, 3, 14, 8, P.cream); R(1, 5, 14, 6, P.red); R(1, 9, 14, 2, P.red2);
  R(1, 0, 8, 7, P.hair); R(3, 3, 5, 4, P.skin); R(4, 4, 2, 1, P.ink); R(0, 1, 3, 4, P.hair2);
});

// ---------- Mochi the cat (16x16), facing right; flipped at runtime ----------
function mochiSide(R, f) {
  R(0, 5 - (f ? 1 : 0), 3, 2, P.cat2); R(0, 7, 2, 4, P.cat2); R(1, 10, 3, 2, P.cat2); // tail
  R(3, 7, 9, 6, P.cat); R(3, 7, 9, 2, P.cat2); R(5, 7, 1, 3, P.cat2); R(8, 7, 1, 3, P.cat2);
  R(3, 12, 9, 1, P.cat3); R(10, 4, 5, 6, P.cat); R(10, 2, 2, 3, P.cat2); R(13, 2, 2, 3, P.cat2);
  R(11, 3, 1, 1, P.pink); R(14, 6, 1, 2, P.eye); R(15, 8, 1, 1, P.pink); R(11, 8, 4, 2, P.cat3);
  if (f === 0) { R(4, 13, 2, 3, P.cat); R(10, 13, 2, 3, P.cat); }
  else { R(3, 13, 2, 2, P.cat); R(6, 13, 2, 3, P.cat2); R(9, 13, 2, 3, P.cat2); R(12, 13, 2, 2, P.cat); }
}
def('mochi_walk_0', 16, 16, (R) => mochiSide(R, 0), false);
def('mochi_walk_1', 16, 16, (R) => mochiSide(R, 1), false);
def('mochi_sit', 16, 16, (R) => {
  R(4, 8, 8, 7, P.cat); R(5, 9, 6, 6, P.cat3); R(4, 8, 8, 2, P.cat2); R(3, 13, 3, 2, P.cat); R(10, 13, 3, 2, P.cat);
  R(12, 12, 3, 3, P.cat2); R(5, 3, 6, 6, P.cat); R(5, 1, 2, 3, P.cat2); R(9, 1, 2, 3, P.cat2);
  R(6, 5, 1, 2, P.eye); R(9, 5, 1, 2, P.eye); R(7, 7, 2, 1, P.pink); R(7, 3, 2, 1, P.cat2);
});
def('mochi_sleep', 16, 16, (R) => {
  R(1, 8, 14, 6, P.cat); R(1, 8, 14, 2, P.cat2); R(4, 8, 1, 3, P.cat2); R(8, 8, 1, 3, P.cat2);
  R(2, 10, 6, 4, P.cat); R(2, 9, 2, 2, P.cat2); R(9, 12, 6, 2, P.cat3);
  R(3, 11, 2, 1, P.ink); R(5, 12, 1, 1, P.pink); R(11, 5, 1, 1, P.white); R(12, 4, 2, 1, P.white); R(11, 3, 3, 1, P.white);
});
def('mochi_zoom', 16, 16, (R) => mochiSide(R, 1));
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

// ---------- Portraits (48x48) ----------
function misaPortrait(R, mood) {
  R(5, 3, 38, 40, P.hair3); R(5, 3, 38, 34, P.hair); R(2, 0, 12, 12, P.hair2); R(34, 0, 12, 12, P.hair2); R(4, 3, 10, 3, P.hair2);
  R(8, 8, 32, 8, P.hair2); R(8, 38, 32, 10, P.mint); R(20, 38, 8, 10, P.cream); R(14, 40, 4, 6, P.mint2); R(30, 40, 4, 6, P.mint2);
  R(11, 14, 26, 24, P.skin); R(10, 12, 28, 6, P.hair); R(12, 14, 8, 6, P.hair); R(28, 14, 8, 6, P.hair); R(8, 14, 4, 24, P.hair); R(36, 14, 4, 24, P.hair);
  R(20, 32, 8, 8, P.skin2); R(11, 36, 26, 3, P.skin);
  R(14, 30, 4, 3, P.blush); R(30, 30, 4, 3, P.blush);
  const eyes = { neutral: () => { R(16, 24, 4, 6, P.ink); R(28, 24, 4, 6, P.ink); R(16, 24, 2, 2, P.white); R(28, 24, 2, 2, P.white); R(21, 34, 6, 1, P.red2); },
    happy: () => { R(15, 27, 2, 2, P.ink); R(17, 25, 3, 2, P.ink); R(20, 27, 1, 2, P.ink); R(27, 27, 2, 2, P.ink); R(29, 25, 3, 2, P.ink); R(32, 27, 1, 2, P.ink); R(19, 33, 10, 1, P.red2); R(20, 34, 8, 2, P.red2); R(22, 35, 4, 1, P.pink); },
    surprised: () => { R(15, 22, 6, 8, P.white); R(27, 22, 6, 8, P.white); R(17, 24, 3, 5, P.ink); R(29, 24, 3, 5, P.ink); R(22, 33, 4, 4, P.red2); R(23, 34, 2, 2, P.ink); },
    sleepy: () => { R(15, 28, 6, 2, P.ink); R(27, 28, 6, 2, P.ink); R(22, 34, 4, 2, P.red2); R(39, 6, 5, 1, P.white); R(41, 7, 1, 1, P.white); R(39, 8, 5, 1, P.white); } };
  (eyes[mood] || eyes.neutral)();
}
for (const m of ['neutral', 'happy', 'surprised', 'sleepy']) def(`p_misa_${m}`, 48, 48, (R) => misaPortrait(R, m));
function mochiPortrait(R, mood) {
  R(6, 12, 36, 30, P.cat); R(6, 10, 4, 4, P.cat); R(6, 4, 8, 10, P.cat2); R(34, 4, 8, 10, P.cat2); R(8, 6, 4, 6, P.pink); R(36, 6, 4, 6, P.pink);
  R(18, 12, 3, 8, P.cat2); R(24, 12, 3, 10, P.cat2); R(30, 12, 3, 8, P.cat2); R(14, 32, 20, 10, P.cat3); R(6, 36, 36, 10, P.cat3);
  R(4, 30, 8, 1, P.white); R(36, 30, 8, 1, P.white); R(3, 33, 9, 1, P.white); R(36, 33, 9, 1, P.white);
  R(21, 30, 6, 4, P.pink); R(23, 33, 2, 3, P.pink); R(19, 35, 5, 1, P.cat2); R(25, 35, 5, 1, P.cat2);
  if (mood === 'happy') { R(11, 24, 3, 2, P.ink); R(13, 22, 4, 2, P.ink); R(17, 24, 1, 2, P.ink); R(30, 24, 3, 2, P.ink); R(32, 22, 4, 2, P.ink); R(36, 24, 1, 2, P.ink); }
  else if (mood === 'sleepy') { R(11, 26, 7, 2, P.ink); R(30, 26, 7, 2, P.ink); R(38, 8, 6, 1, P.white); R(40, 9, 1, 1, P.white); R(38, 10, 6, 1, P.white); }
  else { R(11, 21, 8, 9, P.eye); R(29, 21, 8, 9, P.eye); R(14, 22, 2, 7, P.ink); R(32, 22, 2, 7, P.ink); R(12, 22, 2, 2, P.white); R(30, 22, 2, 2, P.white); }
}
for (const m of ['neutral', 'happy', 'sleepy']) def(`p_mochi_${m}`, 48, 48, (R) => mochiPortrait(R, m));
function pipPortrait(R, mood) {
  R(8, 40, 32, 8, P.blue2); R(20, 38, 8, 4, P.cream); R(10, 14, 28, 26, P.skin); R(10, 26, 3, 6, P.skin2);
  R(7, 8, 34, 8, P.blue); R(7, 6, 30, 3, P.blue); R(10, 2, 26, 6, P.blue); R(30, 12, 14, 4, P.blue2); R(20, 4, 8, 6, P.yellow); R(22, 5, 4, 3, P.red);
  R(8, 16, 4, 12, '#7a4a30'); R(36, 16, 4, 12, '#7a4a30');
  R(16, 24, 4, 5, P.ink); R(28, 24, 4, 5, P.ink); R(16, 24, 2, 2, P.white); R(28, 24, 2, 2, P.white);
  R(13, 31, 4, 3, P.blush); R(31, 31, 4, 3, P.blush); R(19, 33, 10, 2, P.red2); R(20, 35, 8, 2, P.red2); R(22, 35, 4, 1, P.pink);
}
def('p_pip_neutral', 48, 48, (R) => pipPortrait(R));
def('p_pip_happy', 48, 48, (R) => pipPortrait(R));

// ---------- Item icons (16x16) for the feed minigame ----------
def('i_fish', 16, 16, (R) => { R(2, 5, 9, 6, P.blue); R(3, 4, 6, 1, P.blue2); R(3, 11, 6, 1, P.blue2); R(11, 4, 4, 3, P.blue2); R(11, 9, 4, 3, P.blue2); R(4, 7, 2, 2, P.white); R(4, 7, 1, 1, P.ink); R(7, 6, 1, 4, P.steel); });
def('i_chicken', 16, 16, (R) => { R(3, 3, 9, 8, P.cat2); R(4, 4, 7, 6, P.cat); R(11, 9, 2, 2, P.cream); R(13, 11, 2, 3, P.cream); R(12, 13, 4, 2, P.white); R(5, 5, 3, 1, P.yellow); });
def('i_kibble', 16, 16, (R) => { R(2, 8, 12, 6, P.brown); R(3, 5, 4, 4, P.cat2); R(8, 4, 4, 4, P.cat2); R(6, 8, 4, 3, P.cat); R(11, 9, 3, 3, P.cat2); R(3, 10, 2, 2, P.cat); });
def('i_paw', 16, 16, (R) => { R(5, 8, 6, 5, P.pink); R(2, 5, 3, 3, P.pink); R(6, 2, 3, 4, P.pink); R(10, 2, 3, 4, P.pink); R(13, 5, 3, 3, P.pink); });
def('i_star', 16, 16, (R) => { R(7, 1, 2, 14, P.yellow); R(1, 6, 14, 3, P.yellow); R(4, 3, 8, 9, P.yellow); R(6, 5, 4, 5, '#fff0b0'); });
def('i_coin', 8, 8, (R) => { R(1, 0, 6, 8, P.yellow); R(0, 1, 8, 6, P.yellow); R(2, 2, 2, 4, '#fff0b0'); R(5, 5, 2, 1, '#c9a13f'); });

// Pip the postie (world sprite)
def('pip', 16, 24, (R) => {
  R(4, 19, 3, 3, P.blue2); R(9, 19, 3, 3, P.blue2); R(4, 22, 4, 2, P.ink); R(8, 22, 4, 2, P.ink);
  R(3, 11, 10, 9, P.blue); R(3, 16, 10, 1, P.blue2); R(1, 12, 2, 6, P.blue); R(13, 12, 2, 6, P.blue); R(1, 17, 2, 2, P.skin); R(13, 17, 2, 2, P.skin);
  R(10, 13, 5, 6, P.brown); R(11, 14, 3, 1, P.yellow);
  R(4, 5, 8, 7, P.skin); R(3, 2, 10, 4, P.blue); R(3, 5, 12, 2, P.blue2); R(7, 2, 2, 2, P.yellow); R(6, 8, 1, 2, P.ink); R(9, 8, 1, 2, P.ink); R(7, 10, 2, 1, P.red2);
});

export function drawSprite(name, surface) {
  const d = SPRITES[name];
  if (!d) throw new Error(`unknown sprite ${name}`);
  d.draw((x, y, w, h, c) => surface.rect(x, y, w, h, c));
}
