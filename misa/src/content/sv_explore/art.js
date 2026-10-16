// Exploring slice art: mine rocks and ore veins, ladders, elevator, dust sprites, forage nodes, pan spots, the cave door,
// the Skills phone icon. All hd props drawn through the clipped spr() helper (outline margin is automatic).
import { defineSprite } from '../../art.js';
import { spr } from '../town/lib.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';
import { FORAGE } from './data.js';

const S = Rr.stone;

// ---------------------------------------------------------------- rocks (30x26)
function boulder(R, hi) {
  R.e(15, 19, 13, 6, S[1]); R.e(15, 16, 13, 9, S[2]); R.e(13, 12, 9, 6, S[3]); R(8, 9, 7, 2, S[4]); R(7, 11, 3, 2, S[4]);
  R.e(21, 19, 6, 4, S[1]); R(19, 22, 8, 2, S[0]);
  if (hi) R(10, 8, 4, 1, hi);
}
const flecks = (R, pts, c, c2) => { for (const [x, y] of pts) { R(x, y, 2, 2, c); if (c2) R(x, y, 1, 1, c2); } };
const ROCKS = {
  stone: (R) => { boulder(R, S[4]); R(12, 15, 5, 1, S[1]); R(20, 13, 1, 4, S[1]); },
  coal: (R) => { boulder(R); flecks(R, [[9, 13], [15, 11], [20, 15], [12, 19], [18, 20]], Rr.charcoal[0], Rr.charcoal[2]); },
  copper: (R) => { boulder(R); flecks(R, [[9, 14], [14, 10], [20, 14], [12, 19], [18, 19], [24, 17]], Rr.hairGinger[2], Rr.hairGinger[3]); R(19, 11, 2, 1, Rr.mint[2]); },
  iron: (R) => { boulder(R); flecks(R, [[10, 13], [15, 11], [21, 15], [13, 19], [19, 20]], Rr.metal[1], Rr.metal[4]); R(18, 12, 3, 1, Rr.coral[1]); },
  silver: (R) => { boulder(R); flecks(R, [[9, 14], [14, 10], [20, 13], [12, 19], [18, 19], [23, 17]], Rr.paper[4], Rr.sky[3]); R(16, 14, 1, 1, '#ffffff'); },
  stargold: (R) => { boulder(R); flecks(R, [[9, 14], [14, 10], [20, 13], [12, 19], [18, 19]], Rr.butter[3], '#fff6c0'); R(16, 9, 1, 3, Rr.butter[3]); R(15, 10, 3, 1, Rr.butter[3]); R(22, 16, 1, 3, '#fff6c0'); R(21, 17, 3, 1, '#fff6c0'); },
  geode: (R) => { boulder(R); R.e(15, 15, 5, 4, Rr.lilac[1]); R.e(15, 15, 4, 3, Rr.lilac[3]); R.e(15, 15, 2, 2, Rr.paper[4]); R(11, 14, 1, 1, Rr.paper[4]); },
  gem: (R) => { boulder(R); R.t([15, 9], [20, 15], [10, 15], Rr.sky[3]); R.t([15, 9], [20, 15], [15, 20], Rr.sky[2]); R(14, 11, 1, 3, '#ffffff'); R.t([22, 17], [25, 21], [19, 21], Rr.ribbon[2]); },
  crystal: (R) => { boulder(R); for (const [x, h, c] of [[10, 9, Rr.lilac[3]], [15, 13, Rr.paper[4]], [20, 10, Rr.lilac[2]]]) { R.t([x, 17 - h], [x + 4, 18], [x - 2, 18], c); R(x - 1, 15 - h + 3, 1, h - 6, '#ffffff'); } },
};
for (const [k, fn] of Object.entries(ROCKS)) spr('sv_rock_' + k, 30, 26, (R) => fn(R));

// ---------------------------------------------------------------- mine props
spr('sv_ladder_down', 30, 26, (R) => {
  R.e(15, 14, 13, 8, Rr.charcoal[0]); R.e(15, 13, 11, 6, '#0d0a14'); R.e(15, 12, 8, 3, '#1a1426');
  R(10, 4, 3, 17, Rr.wood[2]); R(18, 4, 3, 17, Rr.wood[2]); R(10, 4, 1, 17, Rr.wood[3]);
  for (let y = 7; y < 20; y += 4) R(10, y, 11, 2, Rr.wood[3]);
}, { outline: false });
spr('sv_ladder_up', 30, 34, (R) => {
  R(9, 2, 3, 30, Rr.wood[2]); R(18, 2, 3, 30, Rr.wood[2]); R(9, 2, 1, 30, Rr.wood[3]);
  for (let y = 5; y < 30; y += 5) R(9, y, 12, 2, Rr.wood[3]);
  R.e(15, 3, 11, 3, '#fff6c0'); R.e(15, 3, 7, 2, '#ffffff');
});
spr('sv_elevator', 26, 36, (R) => {
  R(2, 2, 22, 32, Rr.metal[1]); R(3, 3, 20, 30, Rr.metal[2]); R(3, 3, 20, 2, Rr.metal[4]); R(5, 8, 16, 24, Rr.charcoal[1]); R(12, 8, 2, 24, Rr.metal[2]);
  R(6, 9, 6, 22, Rr.metal[3]); R(14, 9, 6, 22, Rr.metal[3]); R(10, 4, 6, 3, Rr.butter[3]); R(22, 18, 2, 3, Rr.coral[2]);
});
spr('sv_mine_sign', 22, 30, (R) => {
  R(10, 12, 3, 17, Rr.wood[1]); R(2, 3, 18, 11, Rr.wood[3]); R(2, 3, 18, 2, Rr.wood[4]); R(2, 13, 18, 1, Rr.wood[1]);
  R(5, 7, 12, 1, Rr.woodDark[1]); R(5, 10, 8, 1, Rr.woodDark[1]);
});
spr('sv_mine_door', 30, 38, (R) => {
  R(1, 6, 28, 32, Rr.woodDark[2]); R.e(15, 8, 14, 7, Rr.woodDark[2]); R(5, 12, 20, 26, '#0d0a14'); R.e(15, 12, 10, 6, '#0d0a14');
  R(1, 10, 4, 28, Rr.wood[2]); R(25, 10, 4, 28, Rr.wood[2]); R(1, 10, 1, 28, Rr.wood[3]); R(5, 3, 20, 3, Rr.wood[3]);
  R(12, 20, 6, 8, '#1a1426'); R(14, 26, 2, 12, Rr.wood[1]); R(13, 0, 4, 3, Rr.butter[3]);
});
for (let f = 0; f < 2; f++) {
  spr('sv_dust_' + f, 18, 16, (R) => {
    const b = f ? 1 : 0;
    R.e(9, 8 - b, 7, 6 - b, '#8c8496'); R.e(9, 7 - b, 6, 5, '#b9b2c4'); R.e(7, 5 - b, 3, 2, '#d9d4e2');
    for (const [x, y] of [[2, 4], [15, 5], [3, 11], [15, 11], [9, 14], [9, 1]]) R(x, y - b, 2, 2, '#8c8496');
    R(6, 7 - b, 2, 3, '#2a1a22'); R(11, 7 - b, 2, 3, '#2a1a22'); R(6, 7 - b, 1, 1, '#ffffff'); R(11, 7 - b, 1, 1, '#ffffff'); R(8, 11 - b, 3, 1, Rr.coral[2]);
  }, { outline: 'ink' });
}
// ---------------------------------------------------------------- pan spot and truffle mound (ground decals, 1px empty border)
defineSprite('sv_pan_spot', 28, 14, (R) => {
  R.e(14, 7, 12, 5, Rr.water[3]); R.e(14, 7, 9, 3, Rr.water[2]); R.e(14, 7, 5, 2, Rr.water[1]);
  R(8, 4, 3, 1, '#ffffff'); R(17, 9, 3, 1, '#ffffff'); R(20, 5, 1, 1, Rr.butter[3]); R(7, 8, 1, 1, Rr.butter[3]);
}, { hd: true });
spr('sv_truffle_mound', 22, 14, (R) => { R.e(11, 10, 9, 4, Rr.dirt[2]); R.e(11, 8, 6, 3, Rr.dirt[3]); R(8, 5, 2, 2, Rr.dirt[3]); R(14, 4, 2, 2, Rr.dirt[3]); R(10, 2, 1, 2, Rr.butter[3]); R(9, 3, 3, 1, Rr.butter[3]); });

// ---------------------------------------------------------------- forage nodes (22x20)
const L = Rr.forest;
const FG = {
  leafy: (R, c, c2) => { R(10, 8, 2, 11, L[2]); R.e(7, 9, 3, 7, c); R.e(15, 10, 3, 7, c); R.e(11, 6, 3, 6, c2); R(7, 6, 1, 6, L[4]); },
  flower: (R, c, c2) => { R(10, 9, 2, 10, L[2]); R.e(6, 15, 3, 1, L[3]); R.e(16, 14, 3, 1, L[3]); for (const [x, y] of [[0, -4], [-4, 0], [4, 0], [0, 4], [-3, -3], [3, -3]]) R.e(11 + x, 6 + y, 2, 2, c); R.e(11, 6, 2, 2, c2); },
  berry: (R, c, c2) => { R.e(11, 13, 8, 5, c2); R.e(8, 11, 4, 3, L[3]); for (const [x, y] of [[6, 11], [11, 9], [15, 12], [9, 15], [14, 16]]) { R.e(x, y, 2, 2, c); R(x - 1, y - 1, 1, 1, '#ffffff'); } },
  mushroom: (R, c, c2) => { R(9, 11, 5, 8, Rr.paper[4]); R(9, 11, 1, 8, Rr.paper[3]); R.e(11, 10, 9, 5, c); R.e(9, 8, 4, 2, c2); R(14, 10, 2, 2, Rr.paper[4]); R(7, 12, 2, 1, Rr.paper[4]); },
  seed: (R, c, c2) => { R.e(11, 13, 7, 5, c); R.e(9, 11, 3, 2, c2); for (let a = 0; a < 8; a++) R(11 + Math.round(Math.cos(a * 0.8) * 8), 13 + Math.round(Math.sin(a * 0.8) * 5), 1, 1, Rr.woodDark[1]); R(8, 6, 3, 3, L[3]); R(9, 9, 2, 2, L[2]); },
  shell: (R, c, c2) => { R.e(11, 13, 8, 5, c); R.t([4, 18], [18, 18], [11, 7], c); for (let i = 0; i < 5; i++) R(6 + i * 3, 10 + (i % 2), 1, 7 - (i % 2), c2); R(8, 9, 6, 1, Rr.paper[4]); },
  root: (R, c, c2) => { R(8, 8, 2, 10, L[2]); R(12, 7, 2, 11, L[3]); R.e(9, 8, 3, 4, L[3]); R.e(14, 7, 3, 4, L[2]); R.e(11, 17, 7, 3, c); R.e(9, 16, 3, 1, c2); R(5, 19, 13, 1, Rr.dirt[1]); },
};
for (const [k, , , , shape, c, c2] of FORAGE) spr('sv_fg_' + k, 22, 20, (R) => (FG[shape] || FG.leafy)(R, c, c2));
spr('sv_fg_hoshi_truffle', 22, 20, (R) => { R.e(11, 15, 9, 4, Rr.dirt[2]); R.e(11, 13, 6, 3, Rr.dirt[3]); R.e(11, 12, 4, 3, Rr.charcoal[3]); R(9, 11, 2, 1, Rr.charcoal[4]); R(12, 4, 1, 4, Rr.butter[3]); R(11, 5, 3, 1, Rr.butter[3]); });

// ---------------------------------------------------------------- phone icon (12x11, same style as the economy icons)
defineSprite('sv_i_skills', 12, 11, (R0) => {
  const R = R0.at(1, 1);
  R(0, 8, 10, 1, '#2b1d2e'); R(1, 5, 2, 3, Rr.mint[2]); R(4, 3, 2, 5, Rr.butter[2]); R(7, 0, 2, 8, Rr.coral[2]); R(7, 0, 2, 1, Rr.paper[4]);
}, false, true);

void hash;
