// Grandma's house, now Misa's home.
import { register } from '../../core/registry.js';

register('map', 'home', {
  name: "Misa's House", indoor: true, music: 'home', bg: '#1a1226',
  legend: { '#': 'wall', k: 'kitchen', w: 'wood', b: 'bath', r: 'wood', s: 'sunroom', d: 'doorway', D: 'doorway' },
  rows: [
    '######################',
    '#kkkkkk#wwwwwww#bbbbb#',
    '#kkkkkk#wwwwwww#bbbbb#',
    '#kkkkkk#wwwwwww#bbbbb#',
    '#kkkkkkdwwwwwwwdbbbbb#',
    '#kkkkkk#wwwwwww#bbbbb#',
    '#kkkkkk#wwwwwww#bbbbb#',
    '###d#######d######d###',
    '#rrrrrrrr#sssssssssss#',
    '#rrrrrrrr#sssssssssss#',
    '#rrrrrrrrdsssssssssss#',
    '#rrrrrrrr#sssssssssss#',
    '#rrrrrrrr#sssssssssss#',
    '###############D######',
  ],
  objects: [
    // walls
    { spr: 'window', x: 3, y: 0, wall: true }, { spr: 'window', x: 11, y: 0, wall: true }, { spr: 'window', x: 18, y: 0, wall: true },
    { spr: 'door', x: 15, y: 13, wall: true },
    // kitchen
    { spr: 'fridge', x: 1, y: 1, interact: { label: 'Fridge', run: (g) => g.toast('A little empty. Groceries at the market!') } },
    { spr: 'sink', x: 2, y: 1, w: 2, use: 'task_dishes' },
    { spr: 'stove', x: 4, y: 1, w: 2, use: 'stove' },
    { spr: 'rug_small', x: 2, y: 3, w: 2, h: 2, flat: true },
    { spr: 'table', x: 2, y: 4, w: 2, h: 2 },
    { spr: 'chair', x: 1, y: 5, solid: false }, { spr: 'chair', x: 4, y: 5, solid: false },
    { spr: 'bowl_empty', x: 6, y: 5, solid: false, use: 'task_feed' },
    // living room
    { spr: 'bookshelf', x: 8, y: 1, use: 'bookshelf' },
    { spr: 'sofa', x: 10, y: 1, w: 3, h: 2, fp: [10, 1, 3, 1.75], use: 'sofa' },
    { spr: 'rug_big', x: 10, y: 4, w: 3, h: 2, flat: true },
    { spr: 'broomstand', x: 14, y: 1, use: 'task_sweep' },
    // bath / laundry
    { spr: 'washer', x: 16, y: 1, use: 'task_laundry' },
    { spr: 'tub', x: 18, y: 1, w: 2 },
    { spr: 'basket', x: 20, y: 3, use: 'task_laundry' },
    { spr: 'mat', x: 18, y: 3, flat: true },
    // bedroom
    { spr: 'bed', x: 1, y: 9, w: 2, h: 3, interact: { label: 'Sleep', run: (g) => g.sleepPrompt() } },
    { spr: 'desk', x: 4, y: 8, w: 2, use: 'desk' },
    { spr: 'rug_small', x: 4, y: 10, w: 2, h: 2, flat: true },
    { spr: 'cushion', x: 7, y: 11, flat: true },
    // sunroom / entry
    { spr: 'pot_ok', x: 11, y: 8, use: 'task_plants' }, { spr: 'pot_ok', x: 13, y: 8, use: 'task_plants' }, { spr: 'pot_ok', x: 19, y: 8, use: 'task_plants' },
    { spr: 'mat', x: 15, y: 12, flat: true },
    { spr: 'dust', x: 11, y: 5, flat: true, when: (g) => g.homeTaskPending('sweep') }, { spr: 'dust', x: 9, y: 3, flat: true, when: (g) => g.homeTaskPending('sweep') }, { spr: 'dust', x: 13, y: 4, flat: true, when: (g) => g.homeTaskPending('sweep') },
  ],
  warps: [{ x: 15, y: 13, to: 'yard:front_door' }],
  spawns: { default: [15, 12], bed: [3, 10], door: [15, 12, 'up'], cushion: [7, 11] },
});
