// Economy area: the 7 skills (shared ids, see docs/WORLD.md). The engine reads { name, desc, icon }.
// Schema: register('skill', id, { name, desc, icon, color, how }) - `how` is a one-line hint for skill pages.
import { register, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS } from '../../gfx/palette.js';

const SKILLS = {
  homemaking: { name: 'Homemaking', desc: 'Keeping Grandma\'s house cozy: dishes, sweeping, laundry and plants.', icon: itemIcon('tool', { c: RAMPS.butter[2] }), color: RAMPS.butter[2], how: 'Do home tasks' },
  study: { name: 'Study', desc: 'Classes, homework, library shifts and reading.', icon: itemIcon('book', { c: RAMPS.sky[1] }), color: RAMPS.sky[2], how: 'Attend class, read, shelve books' },
  cooking: { name: 'Cooking', desc: 'Chopping, stirring and frying your way to tasty dishes.', icon: itemIcon('bowl', { c: RAMPS.coral[2] }), color: RAMPS.coral[2], how: 'Cook at the stove, cafe shifts' },
  gardening: { name: 'Gardening', desc: 'Seeds, soil, sunshine and a lot of watering.', icon: itemIcon('leafy', { c: RAMPS.forest[3] }), color: RAMPS.forest[3], how: 'Plant, water and harvest' },
  fishing: { name: 'Fishing', desc: 'Patience at the pier, the pond and the open sea.', icon: itemIcon('fish', { c: RAMPS.water[3] }), color: RAMPS.water[3], how: 'Fish, fish market shifts' },
  crafting: { name: 'Crafting', desc: 'Making things by hand, from gears to knitted scarves.', icon: itemIcon('box', { c: RAMPS.wood[2] }), color: RAMPS.wood[3], how: 'Craft, repair clocks' },
  charm: { name: 'Charm', desc: 'Kind words, good gifts and a friendly smile behind the counter.', icon: itemIcon('star', { c: RAMPS.hairPink[2] }), color: RAMPS.hairPink[2], how: 'Talk, give gifts, serve customers' },
};
for (const [id, def] of Object.entries(SKILLS)) register('skill', id, def);

features('Skills & wellbeing', [
  'Seven skills (Homemaking, Study, Cooking, Gardening, Fishing, Crafting, Charm), each levelling from 1 to 10 with its own icon',
]);
