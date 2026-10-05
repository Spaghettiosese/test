// Many headless AI-vs-AI rounds, summarised: node tools/sim-batch.mjs [rounds=12] [level=2] [maxSeconds=260]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const N = +(process.argv[2] ?? 12), level = +(process.argv[3] ?? 2), maxT = +(process.argv[4] ?? 260);
const tally = { atk: 0, def: 0, none: 0 }, reasons = {}; let dur = 0, plants = 0, kills = { atk: 0, def: 0 }, bleeds = 0, downs = 0, revives = 0, stalls = 0, crashes = 0;
const t0 = performance.now();
for (let s = 1; s <= N; s++) {
  const sim = new Sim(HARBOR, { seed: s * 7919, difficulty: level });
  try {
    setupRound(sim, { level });
    let planted = false; const still = new Map();
    sim.on('planted', () => { planted = true; });
    sim.on('death', (e) => { if (e.bleed) bleeds++; if (e.killer && e.killer.team !== e.actor.team) kills[e.killer.team]++; });
    sim.on('down', () => { downs++; }); sim.on('revive', () => { revives++; });
    for (let t = 0; t < maxT + 45 && sim.round.phase !== 'end'; t += 1 / 30) {
      sim.update(1 / 30);
      if (sim.round.phase === 'action' && Math.floor(sim.time * 30) % 30 === 0) for (const a of sim.actors) {
        if (!a.alive || a.busy) { still.delete(a.id); continue; } const m = still.get(a.id); const p = a.pos;
        if (m && Math.hypot(p[0] - m.p[0], p[2] - m.p[2]) < 0.3 && a.ai && a.ai.mode === 'task' && a.ai.task && a.ai.task.type === 'goto') { if (sim.time - m.t > 15 && !m.flag) { m.flag = true; stalls++; console.log(`  stall seed ${s}: ${a.team} ${a.name} at ${p.map((v) => v.toFixed(1))} task ${JSON.stringify(a.ai.task.pos)}`); } } else still.set(a.id, { p: [...p], t: sim.time });
      }
    }
    const r = sim.round.result; if (r) { tally[r.winner]++; reasons[r.reason] = (reasons[r.reason] || 0) + 1; } else tally.none++;
    dur += sim.round.elapsed; if (planted) plants++;
  } catch (e) { crashes++; console.log('CRASH seed', s, e.stack.split('\n').slice(0, 4).join(' | ')); }
}
console.log(`level ${level}: atk ${tally.atk} def ${tally.def} none ${tally.none} | reasons ${JSON.stringify(reasons)} | plants ${plants}/${N} | avg round ${(dur / N).toFixed(0)}s | kills atk ${kills.atk} def ${kills.def} | downs ${downs} revives ${revives} bleeds ${bleeds} | stalls ${stalls} crashes ${crashes} | ${((performance.now() - t0) / 1000).toFixed(1)}s`);
if (crashes || stalls > 2 || tally.none > N * 0.1) process.exitCode = 1;
