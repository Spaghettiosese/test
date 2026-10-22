// M4A1 with a suppressor: the same rifle and animations, the birdcage swapped for a long
// can that carries the muzzle forward, a smaller flash, and quieter shots in the game.
import { P, cyl, ALONG_Z, offset, weaponDefinition, createWeapon } from './rig.js';
import { M4A1 } from './m4a1.js';

const { W0, BORE } = M4A1;
const W = (p) => offset(W0, p);
const MATERIALS = { ...M4A1.materials, can: { color: '#1a1b1d', roughness: 0.5, metallic: 0.8, pattern: 'metal', patternScale: 2 } };
const shiftFlash = (p) => p.bind.bone === 'flash' ? { ...p, position: [p.position[0], p.position[1], p.position[2] + 0.13] } : p;
const PARTS = [
  ...M4A1.parts.filter((p) => !p.name.startsWith('Flash Hider')).map(shiftFlash),
  P('Suppressor Mount', cyl(0.0115, 0.0115, 0.02, 18), 'can', { bone: 'weapon' }, { position: W([0, BORE, 0.42]), rotation: ALONG_Z }),
  P('Suppressor', cyl(0.0185, 0.0185, 0.17, 24), 'can', { bone: 'weapon' }, { position: W([0, BORE, 0.505]), rotation: ALONG_Z }),
  P('Suppressor Band', cyl(0.0192, 0.0192, 0.012, 24), 'steel', { bone: 'weapon' }, { position: W([0, BORE, 0.44]), rotation: ALONG_Z }),
  P('Suppressor Bore', cyl(0.006, 0.006, 0.003, 14), 'rubber', { bone: 'weapon' }, { position: W([0, BORE, 0.5905]), rotation: ALONG_Z }),
].map((p) => (p.material === 'steel' && !MATERIALS.steel ? { ...p, material: 'nickel' } : p));
export const M4A1S = { ...M4A1, id: 'm4a1s', name: 'M4A1 Suppressed', materials: MATERIALS, parts: PARTS, points: { ...M4A1.points, muzzle: [0, BORE, 0.59] } };
export const m4a1sDefinition = (o) => weaponDefinition(M4A1S, o);
export const createM4A1S = () => createWeapon(M4A1S);
