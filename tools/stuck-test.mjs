// Plays many AI rounds across sites, spawns and difficulties and reports every bot that pushes at
// something without getting anywhere: node tools/stuck-test.mjs [rounds=30] [maxSeconds=200]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const N = +(process.argv[2] ?? 30), maxT = +(process.argv[3] ?? 200);
const found = new Map(); let totalStuck = 0, rounds = 0;
for (let s = 1; s <= N; s++) {
  const level = s % 5, site = s % 4, spawn = HARBOR.spawns[s % 3].id;
  const sim = new Sim(HARBOR, { seed: s * 104729, difficulty: level });
  setupRound(sim, { level, site, spawn });
  const track = new Map();
  for (let t = 0; t < maxT + 45 && sim.round.phase !== 'end'; t += 1 / 30) {
    sim.update(1 / 30);
    if (Math.floor(sim.time * 30) % 30 !== 0) continue;
    for (const a of sim.actors) {
      if (!a.alive || !a.ai || a.busy || a.mode !== 'normal') continue;
      let tr = track.get(a.id); if (!tr) track.set(a.id, tr = { hist: [], flagged: 0 });
      const wants = Math.hypot(a.ctl.fwd, a.ctl.strafe) > 0.3 && !a.ai.inCombat;
      tr.hist.push({ p: [a.pos[0], a.pos[2]], wants, t: sim.time }); if (tr.hist.length > 6) tr.hist.shift();
      if (tr.hist.length === 6) {
        const first = tr.hist[0], moved = Math.hypot(a.pos[0] - first.p[0], a.pos[2] - first.p[1]), pushing = tr.hist.filter((h) => h.wants).length;
        if (moved < 0.5 && pushing >= 5 && sim.time - tr.flagged > 12) {
          tr.flagged = sim.time; totalStuck++; if (process.env.VERBOSE) console.log(`  seed ${s} ${a.name} t=${sim.time.toFixed(0)} pos ${a.pos.map((v) => v.toFixed(1))} task ${a.ai.task && a.ai.task.type} ${a.ai.task && a.ai.task.stand ? 'stand ' + a.ai.task.stand.map((v) => v.toFixed(1)) : a.ai.task && a.ai.task.pos ? 'pos ' + a.ai.task.pos.map((v) => v.toFixed(1)) : ''}`);
          const key = `${Math.floor(a.pos[0])},${Math.floor(a.pos[2])},f${Math.round(a.pos[1] / 3)}`;
          const door = sim.world.doors.filter((d) => !d.dead && Math.hypot((d.ax === 'x' ? d.ix : d.ix + 0.5) - a.pos[0], (d.ax === 'x' ? d.iz + 0.5 : d.iz) - a.pos[2]) < 2.2 && Math.abs(d.y0 !== undefined ? d.y0 - a.pos[1] : 0) < 2).map((d) => `door open=${d.open.toFixed(1)} tgt=${d.target} bar=${d.barricade}`)[0];
          const e = found.get(key) || { n: 0, who: [], task: new Set(), seeds: new Set(), doors: new Set() }; if (door) e.doors.add(door); e.n++; e.who.push(a.name); e.task.add(a.ai.task ? a.ai.task.type : 'none'); e.seeds.add(s); found.set(key, e);
        }
      }
    }
  }
  rounds++;
}
console.log(`${rounds} rounds, ${totalStuck} stuck episodes at ${found.size} places`);
for (const [k, e] of [...found.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 25)) console.log(`  ${k} x${e.n} tasks ${[...e.task]} seeds ${[...e.seeds].slice(0, 4)} ${e.who.slice(0, 3)} ${[...e.doors].join(' | ')}`);
if (totalStuck > rounds * 0.3) process.exitCode = 1;
