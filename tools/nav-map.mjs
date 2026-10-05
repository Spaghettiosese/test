// node tools/nav-map.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
const sim = new Sim(HARBOR, { seed: 5 }); const nav = sim.nav;
const start = nav.snap(28, 0, 6);
const seen = new Set([start]), q = [start];
while (q.length) { const n = q.pop(); nav.each(n, (m) => { if (!seen.has(m)) { seen.add(m); q.push(m); } }, false); }
let total = 0, lost = 0;
for (let f = 0; f <= 1; f++) {
  console.log(`--- storey ${f + 1}  (. open  p partial  # blocked  X unreachable)`);
  for (let z = nav.D - 1; z >= 0; z--) {
    if (z < 10 || z > 36) continue;
    let row = String(z).padStart(2) + ' ';
    for (let x = 10; x < 46; x++) {
      const n = nav.node(x, z, f);
      if (!nav.walkable(x, z, f)) row += '#'; else { total++; if (!seen.has(n)) { lost++; row += 'X'; } else row += nav.partial[n] ? 'p' : '.'; }
    }
    console.log(row);
  }
}
console.log(`walkable ${total}, unreachable ${lost}`); if (lost > 12) process.exitCode = 1;
