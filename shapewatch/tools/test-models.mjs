import { HEROES } from '../src/heroes.js';
import { buildHero, buildPylon, buildSentry } from '../src/models.js';
for (const h of HEROES) { const m = buildHero(h.id, 'frosted'); let n = 0; m.traverse(() => { n++; }); console.log(h.id, 'nodes', n); }
buildPylon({ primary: '#fff' }); buildSentry({ primary: '#fff', accent: '#f00' });
console.log('ok');
