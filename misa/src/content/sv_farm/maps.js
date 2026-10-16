// The back yard (map 'backyard', ~28x18): coop, barn, pen, trough, collect bin, the ranch catalogue board, space for machines
// and a greenhouse site. Reached through the gap in the front yard's east hedge. Hooks into the town's `yard` map:
// one warp (25,9) -> backyard and the spawn `from_backyard`, added from here without editing town files.
import { get, register } from '../../core/registry.js';
import { townMap, grid } from '../town/lib.js';
import { P, tree, lamp, row } from '../town/interactions.js';
import './art.js';
import { SV } from './data.js';

export const PEN = { x0: 2, x1: 17, y0: 5, y1: 10 };
export const DOORS = { coop: [4, 4], barn: [10, 4] };
export const GH = { plots: [20, 9, 6, 3] };
let GAME = null;
export const bindGame = (g) => { GAME = g; };
export const ghOpen = () => !!GAME && !!GAME.flag('upg_greenhouse');

const g = grid(28, 18, '.');
g.fill(0, 0, 28, 1, '#').fill(0, 17, 28, 1, '#').fill(27, 0, 1, 18, '#').fill(0, 0, 1, 9, '#').fill(0, 10, 1, 8, '#');
g.fill(1, 9, 5, 1, ':').fill(3, 4, 3, 1, ':').fill(9, 4, 4, 1, ':').fill(7, 4, 1, 1, ':');
g.fill(19, 8, 8, 5, ':').fill(20, 9, 6, 3, 'p').blob(14, 14, 3, 1, ',').blob(5, 14, 2, 1, ',');
const frow = (a, b, y) => row('town_fence_picket', a, b, y);

const m = townMap('backyard', {
  name: 'Back Yard', music: 'home',
  rows: g.rows(),
  objects: [
    P('sv_coop', 3, 2, { w: 3, h: 2, use: 'sv_coop', shadow: 36 }),
    P('sv_barn', 9, 1, { w: 4, h: 3, use: 'sv_barn', shadow: 48 }),
    { ...P('sv_trough_0', 7, 8, { w: 2, use: 'sv_trough', shadow: 20 }), sprFn: (game) => `sv_trough_${game.state.sv_farm && game.state.sv_farm.hay > 0 ? 1 : 0}` },
    { ...P('sv_bin_0', 7, 3, { use: 'sv_bin', shadow: 9 }), sprFn: (game) => `sv_bin_${game.state.sv_farm && Object.keys(game.state.sv_farm.bin).length ? 1 : 0}` },
    P('sv_haystack', 14, 2, { shadow: 14 }), P('sv_board', 1, 7, { use: 'sv_ranch', shadow: 10 }),
    P('sv_board', 21, 9, { use: 'sv_gh_sign', shadow: 10, when: '!flag:upg_greenhouse' }),
    ...frow(1, 8, 11), ...frow(11, 17, 11),
    { spr: 'sv_gh_back', x: 19, y: 7, w: 8, h: 1, when: 'flag:upg_greenhouse', dx: -2 },
    { spr: 'sv_gh_post', x: 19, y: 8, w: 1, h: 3, when: 'flag:upg_greenhouse', dx: 10 },
    { spr: 'sv_gh_post', x: 26, y: 8, w: 1, h: 3, when: 'flag:upg_greenhouse', dx: 10 },
    { spr: 'sv_gh_front_l', x: 19, y: 12, w: 3, h: 1, when: 'flag:upg_greenhouse' },
    { spr: 'sv_gh_front_r', x: 25, y: 12, w: 2, h: 1, when: 'flag:upg_greenhouse' },
    tree('oak', 24, 15, '_s'), tree('pine', 25, 2, '_s'), tree('maple', 17, 2, '_s'),
    P('town_bush', 1, 13), P('town_bush_flower', 18, 14), P('town_bush', 12, 15),
    lamp(1, 4), lamp(18, 12),
  ],
  warps: [{ x: 0, y: 9, to: 'yard:from_backyard' }],
  spawns: { default: [2, 9, 'right'], from_yard: [1, 9, 'right'] },
  spots: { pen: [8, 6], coop_door: [4, 4], barn_door: [10, 4], bin: [7, 4], greenhouse: [22, 13], board: [2, 8] },
});
// garden plots exist only once the greenhouse is unlocked
Object.defineProperty(m, 'gardenPlots', { get: () => (ghOpen() ? GH.plots : []), enumerable: true, configurable: true });

// ---- hook into the front yard
const yard = get('map', 'yard');
if (yard) {
  const wd = Object.getOwnPropertyDescriptor(yard, 'warps');
  const base = wd && wd.get ? wd.get : () => yard.warps || [];
  Object.defineProperty(yard, 'warps', { get: () => [...base(), { x: 25, y: 9, to: 'backyard:from_yard' }], enumerable: true, configurable: true });
  yard.spawns.from_backyard = [24, 9, 'left'];
}
void register; void SV;
