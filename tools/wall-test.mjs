// Finds bots that stand still looking at a wall (or pressing into one) for too long:
// node tools/wall-test.mjs [rounds=24] [seconds=200]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const N = +(process.argv[2] ?? 24), maxT = +(process.argv[3] ?? 200);
const found = new Map(); let total = 0, botSeconds = 0;
for (let s = +(process.env.FROM ?? 1); s <= N; s++) {
  const level = s % 5, site = s % HARBOR.sites.length, spawn = HARBOR.spawns[s % HARBOR.spawns.length].id;
  const sim = new Sim(HARBOR, { seed: s * 6151, difficulty: level });
  setupRound(sim, { level, site, spawn });
  const track = new Map();
  for (let t = 0; t < maxT + 45 && sim.round.phase !== 'end'; t += 1 / 30) {
    sim.update(1 / 30);
    if (Math.floor(sim.time * 30) % 15 !== 0) continue;
    for (const a of sim.actors) {
      if (!a.alive || !a.ai || a.mode !== 'normal') continue;
      botSeconds += 0.5;
      let tr = track.get(a.id); if (!tr) track.set(a.id, tr = { p: [...a.pos], t: sim.time, flagged: -99 });
      if (Math.hypot(a.pos[0] - tr.p[0], a.pos[2] - tr.p[2]) > 0.35 || Math.abs(a.pos[1] - tr.p[1]) > 0.5) { tr.p = [...a.pos]; tr.t = sim.time; tr.push = 0; continue; }
      if (a.busy || a.ai.inCombat || a.ai.mode === 'combat' || a.ai.mode === 'react') { tr.t = sim.time; continue; } // a firefight is not standing about
      const o = a.eye(), l = a.look(), h = sim.world.cast(o[0], o[1], o[2], l[0], 0, l[2], 1.4, 0);
      const wall = h && h.panel && h.panel.kind !== 'glass' ? h.panel.kind : h && h.prop ? 'prop:' + h.prop.kind : null;
      if (tr.stillSince !== tr.t) { tr.stillSince = tr.t; tr.seen = 0; tr.wallN = 0; tr.push = 0; }
      tr.seen++; if (wall) tr.wallN++;
      const m = a.ai.mover, live = m.goal && !m.arrived && !m.failed;
      tr.push = live ? tr.push + 1 : 0;
      const still = sim.time - tr.t;
      if (still < 4.5 || sim.time - tr.flagged < 10) continue;
      const pushing = live && tr.push >= 8; // walking into something for four seconds, not just about to set off
      const staring = wall && tr.wallN >= tr.seen * 0.6; // looking at a wall within a metre and a half for most of the time it has stood there
      if (!staring && !pushing) continue;
      tr.flagged = sim.time; total++;
      const task = a.ai.task ? a.ai.task.type : 'none', key = `${Math.floor(a.pos[0])},${Math.floor(a.pos[2])},f${Math.round(a.pos[1] / 3)} ${task}/${a.ai.mode}${pushing ? ' pushing' : ''}${staring ? ' at ' + wall : ''}`;
      const e = found.get(key) || { n: 0, who: new Set(), seeds: new Set(), t: [] }; e.n++; e.who.add(a.name); e.seeds.add(s); e.t.push(Math.round(sim.time)); found.set(key, e);
      if (process.env.VERBOSE) console.log(`  seed ${s} ${a.team} ${a.name} t=${sim.time.toFixed(0)} still ${still.toFixed(0)}s pos ${a.pos.map((v) => v.toFixed(1))} task ${task} mode ${a.ai.mode} hunt ${a.ai.hunt && a.ai.hunt.kind + ':' + a.ai.hunt.phase} goal ${m.goal && m.goal.map((v) => +v.toFixed(1))} failed ${m.failed} wall ${wall}`);
    }
  }
}
console.log(`${N} rounds, ${total} bots stood still against something for 4.5 s+ (${(total / (botSeconds / 3600)).toFixed(1)} per bot-hour)`);
for (const [k, e] of [...found.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 25)) console.log(`  x${e.n} ${k}  e.g. ${[...e.who].slice(0, 3)} seeds ${[...e.seeds].slice(0, 3)} at ${e.t.slice(0, 4)}s`);
if (total > N * 1.5) process.exitCode = 1;
