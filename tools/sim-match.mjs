// Headless AI vs AI: node tools/sim-match.mjs [seed] [seconds] [level] [site]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const seed = +(process.argv[2] ?? 1), secs = +(process.argv[3] ?? 240), level = +(process.argv[4] ?? 2), site = process.argv[5] !== undefined ? +process.argv[5] : undefined;
const sim = new Sim(HARBOR, { seed, difficulty: level });
const cfg = setupRound(sim, { level, site });
const log = [];
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const T = () => fmt(sim.round.phase === 'prep' ? 45 - sim.round.elapsed : sim.round.elapsed + 0);
sim.on('death', (e) => log.push(`${T()} ${sim.round.phase} DEATH ${e.actor.team}:${e.actor.name}${e.killer ? ' by ' + e.killer.name : ''}${e.headshot ? ' (head)' : ''}${e.bleed ? ' (bled)' : ''}`));
sim.on('down', (e) => log.push(`${T()} down ${e.actor.name}`));
sim.on('planted', (e) => log.push(`${T()} PLANTED by ${e.actor.name}`));
sim.on('defused', (e) => log.push(`${T()} DEFUSED by ${e.actor.name}`));
sim.on('roundend', (e) => log.push(`${T()} ROUND END ${e.winner} (${e.reason})`));
sim.on('reinforce', (e) => log.push(`${T()} reinforce by ${e.actor.name}`));
sim.on('burn', () => log.push(`${T()} burn`)); sim.on('thermite', () => log.push(`${T()} thermite breach`));
sim.on('callout', (e) => { if (log.length < 400) log.push(`${T()} call ${e.actor.name}: ${e.enemy.name} @ ${e.room}`); });
console.log(`site: ${sim.round.site.name}  spawn: ${cfg.spawn.name}  level ${level}`);
console.log('ATK:', cfg.actors.atk.map((a) => `${a.name}(${a.gun.def.label})`).join(', '));
console.log('DEF:', cfg.actors.def.map((a) => `${a.name}(${a.gun.def.label})`).join(', '));
const t0 = performance.now(); let steps = 0;
for (let t = 0; t < secs && sim.round.phase !== 'end'; t += 1 / 30) { sim.update(1 / 30); steps++; }
if (sim.round.phase === 'end') for (let i = 0; i < 5; i++) sim.update(1 / 30);
console.log(log.join('\n'));
console.log(`result: ${JSON.stringify(sim.round.result)} after ${sim.time.toFixed(0)}s sim in ${(performance.now() - t0).toFixed(0)} ms (${(((performance.now() - t0) / steps)).toFixed(2)} ms/step)`);
for (const a of sim.actors) console.log(`${a.team} ${a.name.padEnd(8)} ${a.state.padEnd(6)} hp ${a.hp.toFixed(0).padStart(3)} k${a.stats.kills} d${a.stats.deaths} shots ${a.stats.shots} hits ${a.stats.hits} pos ${a.pos.map((v) => v.toFixed(1))} task ${a.ai && a.ai.task ? a.ai.task.type : '-'} mode ${a.ai ? a.ai.mode : ''}`);
