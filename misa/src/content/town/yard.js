// Front yard and garden: Misa's house front, the garden plots, Grandma's shed and workbench, the clothesline,
// the mailbox, the big cherry tree and the gap in the hedge where a grey kitten slips through.
import { townMap, grid } from './lib.js';
import { building } from './facade.js';
import { P, tree, lamp, bench, row, snowman, leafpile, steamOverlay } from './interactions.js';

const g = grid(26, 18, '.');
g.fill(0, 0, 1, 16, '#').fill(25, 0, 1, 16, '#').set([[25, 9]], '.');           // hedges, with the gap Kuro uses
g.fill(13, 5, 1, 1, ':').fill(12, 6, 3, 12, ':');                               // path from the door to the gate
g.fill(3, 9, 6, 4, 'p');                                                         // garden plots (hobbies area plants here)
g.fill(1, 4, 6, 2, ':');                                                         // trodden earth in front of the shed
g.blob(20, 12, 3, 2, ',');                                                       // wildflowers under the cherry tree

const house = building('town_house_misa', 9, 0, { to: 'home:from_yard', spawn: 'from_home', missingText: 'The door is stuck. Try again in a moment.' });
house.obj.overlay = (game, world, o) => { if (game.season === 'winter' || game.minutes >= 18 * 60) steamOverlay(203, 2, 142)(game, world, o); };

townMap('yard', {
  name: 'Front Yard', music: 'home',
  rows: g.rows(),
  gardenPlots: [3, 9, 6, 4],
  objects: [
    house.obj,
    { spr: 'town_shed', x: 1, y: 1, w: 3, h: 3 },
    P('town_workbench', 4, 3, { w: 2, use: 'craft_bench', shadow: 20 }),
    P('town_barrel', 1, 7, { shadow: 7 }),
    P('town_flowerbed', 10, 5, { w: 2, use: 'town_flowers' }), P('town_flowerbed', 15, 5, { w: 2, use: 'town_flowers' }),
    P('town_pot_a', 12, 5, { solid: false }), P('town_pot_c', 14, 5, { solid: false }),
    { ...P('town_clothesline_0', 18, 6, { w: 4, solid: false }), sprFn: (game) => `town_clothesline_${Math.floor(game.clock * 1.4) % 2}` },
    bench(16, 9),
    tree('sakura', 20, 11, '', { shadow: 20 }),
    tree('pine', 23, 1, '_s'), tree('maple', 18, 2, '_s'), tree('oak', 2, 14, '_s'), tree('pine', 23, 14, '_s'),
    P('town_bush_azalea', 8, 5), P('town_bush', 17, 4), P('town_bush_flower', 1, 12), P('town_bush', 24, 5), P('town_bush', 24, 12),
    P('town_mailbox', 16, 15, { use: 'mailbox', shadow: 6 }),
    lamp(11, 15),
    ...row('town_fence_picket', 1, 10, 16), { spr: 'town_gatepost', x: 11, y: 16, dx: 9 }, { spr: 'town_gatepost', x: 15, y: 16, dx: 0 },
    ...row('town_fence_picket', 16, 24, 16),
    snowman(7, 14), leafpile(10, 13), leafpile(21, 8),
  ],
  warps: [
    ...house.warps,
    { x: 12, y: 17, w: 3, h: 1, to: 'lane:from_yard' },
  ],
  spawns: { default: [13, 7, 'down'], from_home: [13, 6, 'down'], front_door: [13, 6, 'down'], from_lane: [13, 16, 'up'] },
  spots: { gate: [13, 15], mailbox: [17, 15], garden: [5, 8], porch: [15, 6], cherry_tree: [20, 12], fence_gap: [24, 9] },
  decals: [{ k: 'stones', x: 13, y: 5, n: 1 }],
});
