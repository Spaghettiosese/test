// The armoury: every first-person weapon rig in the game.
import { M4A1, createM4A1 } from './m4a1.js';
import { SNIPER, createSniper } from './sniper.js';
import { SHOTGUN, createShotgun } from './shotgun.js';
import { REVOLVER, createRevolver } from './revolver.js';
import { SMG, createSMG } from './smg.js';
import { DOUBLE, createDouble } from './double.js';
import { GARAND, createGarand } from './garand.js';
import { MP7, createMP7 } from './mp7.js';

export const WEAPONS = [
  { id: 'm4a1', gun: M4A1, create: createM4A1 },
  { id: 'sniper', gun: SNIPER, create: createSniper },
  { id: 'shotgun', gun: SHOTGUN, create: createShotgun },
  { id: 'revolver', gun: REVOLVER, create: createRevolver },
  { id: 'smg', gun: SMG, create: createSMG },
  { id: 'double', gun: DOUBLE, create: createDouble },
  { id: 'garand', gun: GARAND, create: createGarand },
  { id: 'mp7', gun: MP7, create: createMP7 },
];
