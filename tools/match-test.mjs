// A whole match without the screen: squads keep their names, the scoreboard adds up across rounds and
// the bots carry what they learned into the next round.   node tools/match-test.mjs [rounds=3]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
import { Match } from '../src/siege/game/match.js';
const R = +(process.argv[2] ?? 3);
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const m = new Match({ id: 'test', name: 'Test', mode: 'bomb' }, { toWin: R, startSide: 'atk' });
const names0 = [...m.squads.me, ...m.squads.foe];
let killsSeen = 0, notes = [];
for (let n = 1; n <= R; n++) {
  const side = m.side, sim = new Sim(HARBOR, { seed: 1000 + n * 77, difficulty: 2 });
  const cfg = { level: 2, site: n % 4, spawn: HARBOR.spawns[n % 3].id, player: { team: side, op: side === 'atk' ? 'spark' : 'sentry', primary: side === 'atk' ? 'ak74' : 'mp5', secondary: 'magnum', gadget2: 'stun' }, ...m.simCfg() };
  setupRound(sim, cfg);
  const me = sim.actors.find((a) => a.isPlayer);
  // the human stands still; the rest play
  let feed = 0; sim.on('death', () => feed++); sim.on('down', () => feed++);
  for (let t = 0; t < 230 && sim.round.phase !== 'end'; t += 1 / 30) sim.update(1 / 30);
  m.record(sim, me); killsSeen += sim.actors.reduce((s, a) => s + a.stats.kills, 0); notes.push(...(sim.notes || []));
  const allNames = sim.actors.filter((a) => !a.isPlayer).map((a) => a.name);
  ok(allNames.every((x) => names0.includes(x)), `round ${n}: bots kept their match callsigns (${allNames.join(', ')})`);
  ok(sim.actors.every((a) => a.slot), `round ${n}: every actor has a scoreboard slot`);
  m.next();
}
ok(m.board.size === 10, `scoreboard has ${m.board.size} rows after ${R} rounds`);
const tot = [...m.board.values()].reduce((s, b) => s + b.kills, 0);
ok(tot === killsSeen, `scoreboard kills ${tot} match the kills made in play ${killsSeen}`);
ok([...m.board.values()].every((b) => b.rounds === R), 'every row played every round');
ok(m.memory.rounds === R, `bots remember ${m.memory.rounds} rounds (${m.memory.deaths.atk.size + m.memory.deaths.def.size} death spots, ${m.memory.breaches.size} breach spots, ${m.memory.defSeen.size} defender spots)`);
console.log('notes shown to the player:', notes.length ? notes.join(' | ') : '(none)');
if (bad) process.exitCode = 1;
