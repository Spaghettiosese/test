// Entry point for the 'sv4_islands' slice: the Seto Islands archipelago (ferry, sea, Tsubame, Lantern Isle, Coral Atoll).
import './data.js';
import './art.js';
import './lib.js';
import '../../minigames/sv4_islands/games.js';
import './sea.js';
import './travel.js';
import './acts.js';
import './maps_tsubame.js';
import './maps_lantern_coral.js';
import './npcs.js';
import { wrapMap } from './lib.js';
import { bottleObj } from './acts.js';

// The mainland beach also gets the daily bottle
wrapMap('beach', { objects: [bottleObj('beach', 14, 10)] });
