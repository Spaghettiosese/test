// Entry point for the 'sv2_wild' slice: Hoshi Woods, the Moon Witch's cottage, the Adventurers' Guild, Starfall Depths and the Field Guide.
import { register } from '../../core/registry.js';
import './data.js';
import './art.js';
import './woods.js';
import './witch.js';
import { guildSystem } from './guild.js';
import { starfallSystem } from './starfall.js';
import './fieldguide.js';
import { claimField } from './fieldguide.js';

register('system', 'sv2_wild', {
  init(game) {
    guildSystem(game); starfallSystem(game);
    game.bus.on('dayStart', () => { if (game.state.sv2_wild) claimField(game); });
  },
});
