// Walks a bot between many random cell pairs with the real mover and physics, and reports the
// places where it gets stuck: node tools/walk-test.mjs [pairs=150] [seed=1]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { Mover } from '../src/siege/ai/move.js';
import { STAND } from '../src/siege/sim/actor.js';
const N = +(process.argv[2] ?? 150);
let seed = +(process.argv[3] ?? 1); const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const sim = new Sim(HARBOR, { seed: 5, difficulty: 2 }); const nav = sim.nav, w = sim.world;
const a = sim.addActor({ team: 'atk', op: 'hammer', primary: 'm4a1', secondary: 'compact', gadget2: 'stun', pos: [20, 0, 6], yaw: 0 });
const brain = { a, sim, prof: { p: { lefty: 1 } }, costFn: () => null };
const mv = new Mover(brain); brain.mover = mv;
const cells = [];
for (let f = 0; f < 2; f++) for (let z = 0; z < nav.D; z++) for (let x = 0; x < nav.W; x++) if (nav.walkable(x, z, f) && !nav.blocked[nav.node(x, z, f)]) cells.push([x, z, f]);
const bad = new Map(); let ok = 0, fail = 0, unreachable = 0;
const teleport = (c) => { a.pos = [c[0] + 0.5, c[2] * 3, c[1] + 0.5]; a.vel = [0, 0, 0]; a.state = 'alive'; a.hp = 100; };
for (let k = 0; k < N; k++) {
  const A = cells[Math.floor(rnd() * cells.length)], B = cells[Math.floor(rnd() * cells.length)];
  teleport(A); mv.stop();
  const goal = [B[0] + 0.5, B[2] * 3, B[1] + 0.5];
  if (!mv.goTo(goal, { speed: "run", tol: 0.8 })) { unreachable++; if (process.env.NOPATH) console.log("nopath", A.join(","), "->", B.join(",")); continue; }
  let t = 0, last = [...a.pos], lastMove = 0;
  for (; t < 60 && !mv.arrived && !mv.failed; t += 1 / 30) {
    sim.pathBudget = 4; mv.update(1 / 30);
    const wsh = mv.wish; const c = a.ctl; c.fwd = c.strafe = 0; c.sprint = false; c.stance = STAND;
    if (wsh) { const f = a.fwd, r = a.right; c.fwd = wsh[0] * f[0] + wsh[1] * f[2]; c.strafe = wsh[0] * r[0] + wsh[1] * r[2]; c.sprint = mv.speed === 'run'; }
    if (mv.faceYaw !== null) { let d = mv.faceYaw - a.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); a.yaw += Math.max(-9 / 30, Math.min(9 / 30, d)); }
    a.update(1 / 30); sim.updateDoors(1 / 30);
  }
  if (!mv.arrived && process.env.DEBUG && fail < +process.env.DEBUG) {
    const o = a.pos; console.log("   steps", JSON.stringify(mv.steps.map((s) => [s.x, s.z, s.f, s.kind[0]])), "i", mv.i); console.log(`FAIL ${A} -> ${B} at ${o.map((v) => +v.toFixed(2))} failed=${mv.failed} stuckN=${mv.stuckN} step=${JSON.stringify(mv.steps[mv.i] && [mv.steps[mv.i].x, mv.steps[mv.i].z, mv.steps[mv.i].kind])} wish=${JSON.stringify(mv.wish)}`);
    for (const dir of [[-1, 0], [0, 1], [0, -1], [1, 0]]) { const h = w.cast(o[0], o[1] + 0.45, o[2], dir[0], 0, dir[1], 1.2, 0); console.log('   cast', dir, h && { t: +h.t.toFixed(2), prop: h.prop && h.prop.kind, panel: h.panel && (h.panel.door ? 'door open=' + h.panel.door.open : h.panel.kind) }); }
    console.log('   props', JSON.stringify(w.props.filter((p) => p.max[0] > o[0] - 2 && p.min[0] < o[0] + 2 && p.max[2] > o[2] - 2 && p.min[2] < o[2] + 2 && p.max[1] > o[1] && p.min[1] < o[1] + 2).map((p) => [p.kind, p.min.map((v) => +v.toFixed(2)), p.max.map((v) => +v.toFixed(2))])));
  }
  if (mv.arrived) ok++; else { fail++; const key = `${Math.floor(a.pos[0])},${Math.floor(a.pos[2])},f${Math.round(a.pos[1] / 3)}`; const e = bad.get(key) || { n: 0, from: A, to: B, pos: a.pos.map((v) => +v.toFixed(2)) }; e.n++; bad.set(key, e); }
}
console.log(`walks ${N}: arrived ${ok}, failed ${fail}, no path ${unreachable}`);
for (const [k, e] of [...bad.entries()].sort((x, y) => y[1].n - x[1].n).slice(0, 14)) console.log(`  stuck near ${k} x${e.n}: from ${e.from} to ${e.to} pos ${e.pos}`);
void w;
if (fail > Math.max(2, N * 0.02)) process.exitCode = 1;
