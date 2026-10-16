// Entry point for the 'sv_explore' slice: foraging, Hoshi Mine, professions, tool upgrades and panning.
import { register } from '../../core/registry.js';
import './data.js';
import './art.js';
import { profSystem } from './prof.js';
import './forage.js';
import './pan.js';
import { mineSystem } from './mine.js';
import { toolsSystem } from './tools.js';
import '../../minigames/sv_explore/dust.js';

register('system', 'sv_explore', { init(game) { profSystem(game); mineSystem(game); toolsSystem(game); } });
