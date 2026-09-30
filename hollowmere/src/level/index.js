// Assembles the whole level: the road, Ashgate, Ravenspire keep and the catacombs beneath.
import * as E from '../../../engine/index.js';
import { NavGrid } from '../nav.js';
import { Builder } from './builder.js';
import './furniture.js';
import './houses.js';
import * as T from './town.js';
import * as K from './keep.js';
import { buildCrypt } from './crypt.js';

export const NAV = { x0: -64, z0: -72, w: 192, d: 240 };

export function buildLevel({ scene, world, only = null }) {
  const nav = new NavGrid(NAV);
  const B = new Builder({ scene, world, nav });
  T.addHelpers(B);
  T.buildOutskirts(B);
  T.buildTownWalls(B);
  T.buildTownGround(B);
  B.buildings = {};
  B.buildings.tavern = T.buildTavern(B);
  B.buildings.smithy = T.buildSmithy(B);
  Object.assign(B.buildings, T.buildHouses(B));
  B.buildings.chapel = T.buildChapel(B);
  T.buildPlaza(B);
  K.buildKeepWalls(B);
  K.buildCourtyard(B);
  B.buildings.keep = K.buildKeep(B);
  B.buildings.crypt = buildCrypt(B);
  B.finish();
  return B;
}
