// The armoury: every first-person weapon rig in the game, grouped the way the tables lay them
// out. `cat` picks the table: pistols, SMGs and the sawed-off go on the shooting benches, the
// long guns on the armory tables behind the firing line.
import { M4A1, createM4A1 } from './m4a1.js';
import { SNIPER, createSniper } from './sniper.js';
import { SHOTGUN, createShotgun } from './shotgun.js';
import { REVOLVER, createRevolver } from './revolver.js';
import { SMG, createSMG } from './smg.js';
import { DOUBLE, createDouble } from './double.js';
import { GARAND, createGarand } from './garand.js';
import { MP7, createMP7 } from './mp7.js';
import { DEAGLE, createDeagle } from './deagle.js';
import { AK47, createAK47 } from './ak47.js';
import { GLOCK, createGlock } from './glock.js';
import { UMP, createUMP } from './ump.js';
import { AWP, createAWP } from './awp.js';
import { SCAR, createSCAR } from './scar.js';
import { WINCHESTER, createWinchester } from './winchester.js';
import { M4A1S, createM4A1S } from './m4a1s.js';
import { M1911, BERETTA, P226, USP, FIVESEVEN, PYTHON } from './handguns.js';
import { UZI, MAC10, MP5SD, MP40 } from './smgs.js';
import { HK416, M16A2, G36, AK74, AKS74U, RPK, FAL, M14, THOMPSON, M82 } from './rifles.js';
import { MOSSBERG, SPAS12, SAWEDOFF, AA12, MARLIN } from './shotguns.js';
import { createWeapon } from './rig.js';
import { weaponProp } from './prop.js';

const make = (gun) => () => createWeapon(gun);
const entry = (cat, capacity, gun, create = make(gun)) => ({ id: gun.id, cat, capacity, gun, create });

export const WEAPONS = [
  // ---- handguns
  entry('pistol', 17, GLOCK, createGlock),
  entry('pistol', 7, DEAGLE, createDeagle),
  entry('pistol', 7, M1911),
  entry('pistol', 15, BERETTA),
  entry('pistol', 15, P226),
  entry('pistol', 12, USP),
  entry('pistol', 20, FIVESEVEN),
  entry('pistol', 6, REVOLVER, createRevolver),
  entry('pistol', 6, PYTHON),
  // ---- SMGs and the sawed-off
  entry('smg', 30, SMG, createSMG),
  entry('smg', 30, MP5SD),
  entry('smg', 40, MP7, createMP7),
  entry('smg', 25, UMP, createUMP),
  entry('smg', 32, UZI),
  entry('smg', 30, MAC10),
  entry('smg', 32, MP40),
  entry('smg', 2, SAWEDOFF),
  // ---- assault rifles
  entry('rifle', 30, M4A1, createM4A1),
  entry('rifle', 30, M4A1S, createM4A1S),
  entry('rifle', 30, HK416),
  entry('rifle', 30, M16A2),
  entry('rifle', 30, G36),
  entry('rifle', 30, AK47, createAK47),
  entry('rifle', 30, AK74),
  entry('rifle', 30, AKS74U),
  entry('rifle', 20, SCAR, createSCAR),
  // ---- battle rifles, the Thompson and the RPK
  entry('battle', 20, FAL),
  entry('battle', 20, M14),
  entry('battle', 8, GARAND, createGarand),
  entry('battle', 30, THOMPSON),
  entry('battle', 40, RPK),
  // ---- shotguns
  entry('shotgun', 6, SHOTGUN, createShotgun),
  entry('shotgun', 7, MOSSBERG),
  entry('shotgun', 8, SPAS12),
  entry('shotgun', 2, DOUBLE, createDouble),
  entry('shotgun', 8, AA12),
  // ---- lever actions and the long-range guns
  entry('precision', 6, WINCHESTER, createWinchester),
  entry('precision', 6, MARLIN),
  entry('precision', 5, SNIPER, createSniper),
  entry('precision', 5, AWP, createAWP),
  entry('precision', 10, M82),
];
export const BENCH = new Set(['pistol', 'smg']);

// Each gun as a V5 mechanism Prop (rig parts, MechClips, grip and sockets), like the engine's makeGun().
export const makeWeaponProp = (id, o = {}) => { const w = WEAPONS.find((x) => x.id === id); return weaponProp(w.gun, { capacity: w.capacity, ...o }); };
