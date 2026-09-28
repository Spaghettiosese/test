// The armoury: every first-person weapon rig in the game.
import { M4A1, createM4A1 } from './m4a1.js';
import { SNIPER, createSniper } from './sniper.js';
import { SHOTGUN, createShotgun } from './shotgun.js';
import { REVOLVER, createRevolver } from './revolver.js';
import { SMG, createSMG } from './smg.js';
import { DOUBLE, createDouble } from './double.js';
import { GARAND, createGarand } from './garand.js';
import { MP7, createMP7 } from './mp7.js';
import { DEAGLE, createDeagle } from './deagle.js';
import { weaponProp } from './prop.js';

export const WEAPONS = [
  { id: 'm4a1', capacity: 30, gun: M4A1, create: createM4A1 },
  { id: 'sniper', capacity: 5, gun: SNIPER, create: createSniper },
  { id: 'shotgun', capacity: 6, gun: SHOTGUN, create: createShotgun },
  { id: 'revolver', capacity: 6, gun: REVOLVER, create: createRevolver },
  { id: 'smg', capacity: 30, gun: SMG, create: createSMG },
  { id: 'double', capacity: 2, gun: DOUBLE, create: createDouble },
  { id: 'garand', capacity: 8, gun: GARAND, create: createGarand },
  { id: 'mp7', capacity: 40, gun: MP7, create: createMP7 },
  { id: 'deagle', capacity: 7, gun: DEAGLE, create: createDeagle },
];

// Each gun as a V5 mechanism Prop (rig parts, MechClips, grip and sockets), like the engine's makeGun().
export const makeWeaponProp = (id, o = {}) => { const w = WEAPONS.find((x) => x.id === id); return weaponProp(w.gun, { capacity: w.capacity, ...o }); };
