// Replays a stuck-test round and describes one bot at a moment: node tools/replay.mjs <seed> <NAME> <seconds>
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const [seed, name, T] = [+process.argv[2], process.argv[3], +process.argv[4]];
const level = seed % 5, site = seed % 4, spawn = HARBOR.spawns[seed % 3].id;
const sim = new Sim(HARBOR, { seed: seed * 104729, difficulty: level });
setupRound(sim, { level, site, spawn });
const d = sim.actors.find((a) => a.name === name);
let lastPos = null, still = 0;
for (let t = 0; t < T; t += 1 / 30) { sim.update(1 / 30); }
const m = d.ai.mover, w = sim.world, o = d.pos;
console.log(name, d.state, 'phase', sim.round.phase, 'pos', o.map((v) => +v.toFixed(2)), 'goal', m.goal && m.goal.map((v) => +v.toFixed(1)), 'arrived', m.arrived, 'failed', m.failed, 'stuckN', m.stuckN);
console.log('task', JSON.stringify(d.ai.task, (k, v) => (k === 'unit' || k === 'dev' || k === 'edge' || k === 'panel' ? undefined : v)).slice(0, 300), 'mode', d.ai.mode, 'busy', d.busy && d.busy.kind);
console.log('steps', JSON.stringify(m.steps.map((s) => [s.x, s.z, s.f, s.kind[0]])), 'i', m.i, 'wish', m.wish && m.wish.map((v) => +v.toFixed(2)), 'ctl', d.ctl.fwd.toFixed(2), d.ctl.strafe.toFixed(2), 'vel', d.vel.map((v) => +v.toFixed(2)).join(','));
for (const dir of [[-1, 0], [1, 0], [0, 1], [0, -1]]) { const h = w.cast(o[0], o[1] + 0.45, o[2], dir[0], 0, dir[1], 1.0, 0); if (h) console.log('  cast', dir, +h.t.toFixed(2), h.prop ? 'prop ' + h.prop.kind : 'panel ' + h.panel.kind + (h.panel.door ? ' door open=' + h.panel.door.open.toFixed(1) + ' bar=' + h.panel.door.barricade : '')); }
console.log('  doors', w.doors.filter((q) => Math.hypot((q.ax === 'x' ? q.ix : q.ix + 0.5) - o[0], (q.ax === 'x' ? q.iz + 0.5 : q.iz) - o[2]) < 3).map((q) => [q.ix, q.iz, q.ax, 'open', +q.open.toFixed(1), 'bar', q.barricade]));
console.log('  props', JSON.stringify(w.props.filter((p) => p.max[0] > o[0] - 1.5 && p.min[0] < o[0] + 1.5 && p.max[2] > o[2] - 1.5 && p.min[2] < o[2] + 1.5 && p.max[1] > o[1] && p.min[1] < o[1] + 2).map((p) => [p.kind, p.min.map((v) => +v.toFixed(2)), p.max.map((v) => +v.toFixed(2))])));
console.log('  friends near', sim.actors.filter((x) => x !== d && Math.hypot(x.pos[0] - o[0], x.pos[2] - o[2]) < 2).map((x) => [x.name, x.team, x.state]));
