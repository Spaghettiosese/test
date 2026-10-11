// The bot roster: forty named regulars with heroes they main, a skill offset and a temperament.
// The same names come back match after match, so rivals, favourite teammates and a nemesis can form.
// Career keeps the lifetime record against each of them (stats.js); the sim only assigns them.
import { HEROES } from './heroes.js';
import { rng } from './util.js';

const NAMES = ['Aria', 'Bram', 'Cade', 'Dara', 'Eli', 'Fynn', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kai', 'Lena', 'Mika', 'Nox', 'Ora', 'Pike', 'Quin', 'Rhea', 'Soren', 'Tess',
  'Uma', 'Vex', 'Wren', 'Zed', 'Alder', 'Bex', 'Cato', 'Dune', 'Esme', 'Flint', 'Greer', 'Hale', 'Indy', 'Jett', 'Kestrel', 'Lux', 'Moss', 'Nell', 'Orrin', 'Pax'];
const TEMPERS = ['calm', 'hothead', 'joker', 'stoic'];

// built once from a fixed seed: everyone's mains are stable between sessions
export const ROSTER = (() => {
  const r = rng(4242), out = [], byRole = (role) => HEROES.filter((h) => h.role === role).map((h) => h.id);
  NAMES.forEach((name, i) => {
    const role = ['tank', 'damage', 'damage', 'support', 'support'][i % 5], pool = byRole(role), flex = byRole(['tank', 'damage', 'support'][Math.floor(r() * 3)]);
    const mains = [pool[Math.floor(r() * pool.length)], pool[Math.floor(r() * pool.length)], flex[Math.floor(r() * flex.length)]];
    out.push({ name, role, mains: [...new Set(mains)], skill: Math.round((r() * 0.6 - 0.3) * 100) / 100, temper: TEMPERS[Math.floor(r() * TEMPERS.length)] });
  });
  return out;
})();
export const persona = (name) => ROSTER.find((p) => p.name === name) || null;
