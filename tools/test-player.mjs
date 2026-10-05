// The human's controls, driven without a screen: doors can be opened AND closed with F, defenders can
// hold F to barricade, and a door will not shut on the player. node tools/test-player.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
import { Player, DEFAULT_KEYS } from '../src/siege/game/player.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };
function rig(team) {
  const sim = new Sim(HARBOR, { seed: 11, difficulty: 1 });
  setupRound(sim, { level: 1, site: 0, player: { team, op: team === 'atk' ? 'hammer' : 'anvil', primary: team === 'atk' ? 'm4a1' : 'mpk', secondary: 'compact', gadget2: team === 'atk' ? 'stun' : 'barbwire' } });
  const me = sim.actors.find((a) => a.isPlayer);
  const game = { sim, settings: { keys: DEFAULT_KEYS, sens: 1, adsSens: 1 }, audio: null, vm: { use() {}, inspect() {}, world: 1 }, cam: { fov: 1 } };
  return { sim, me, pl: new Player(game, me) };
}
// stand 1.6 m in front of a door, looking at it
function faceDoor(sim, me, d) {
  const n = d.ax === 'x' ? [1, 0] : [0, 1], c = [d.ax === 'x' ? d.ix : d.ix + 0.5, d.ax === 'x' ? d.iz + 0.5 : d.iz];
  me.pos[0] = c[0] + n[0] * 1.6; me.pos[2] = c[1] + n[1] * 1.6; me.pos[1] = d.f * 3; me.vel = [0, 0, 0];
  me.yaw = Math.atan2(-n[0], -n[1]); me.pitch = 0.02;
}
const step = (sim, pl, t, n = 1) => { for (let i = 0; i < n; i++) { sim.update(1 / 30); pl.update(1 / 30); } void t; };
for (const team of ['atk', 'def']) {
  const { sim, me, pl } = rig(team);
  while (sim.round.phase === 'prep') { sim.update(1 / 30); }
  const door = sim.world.doors.find((d) => !d.dead && !d.ext && d.barricade <= 0 && d.f === 0);
  faceDoor(sim, me, door); door.open = door.target = 1; step(sim, pl, 0, 3);
  ok(pl.prompt && pl.prompt.text === 'Close door', `${team}: looking at an open door offers "Close door" (prompt: ${pl.prompt && pl.prompt.text})`);
  pl.keyDown('f'); step(sim, pl, 0, 2); pl.keyUp('f'); step(sim, pl, 0, 3);
  ok(door.target === 0, `${team}: a tap on F closes the open door`);
  step(sim, pl, 0, 40);
  ok(door.open < 0.1, `${team}: the door swings shut (open ${door.open.toFixed(2)})`);
  faceDoor(sim, me, door); step(sim, pl, 0, 3);
  ok(pl.prompt && pl.prompt.text === 'Open door', `${team}: looking at the shut door offers "Open door"`);
  pl.keyDown('f'); step(sim, pl, 0, 2); pl.keyUp('f'); step(sim, pl, 0, 3);
  ok(door.target === 1, `${team}: a tap opens it again`);
  if (team === 'def') {
    sim.round.phase = 'prep'; step(sim, pl, 0, 40); faceDoor(sim, me, door); step(sim, pl, 0, 3);
    pl.keyDown('f'); step(sim, pl, 0, 24); // hold for 0.8 s
    ok(me.busy && me.busy.kind === 'barricade', 'def: holding F on the door starts a barricade');
    step(sim, pl, 0, 60); pl.keyUp('f'); step(sim, pl, 0, 4);
    ok(door.barricade > 0, 'def: the door ends up barricaded');
  }
}
{ // never shut a door on your own head
  const { sim, me, pl } = rig('atk');
  while (sim.round.phase === 'prep') sim.update(1 / 30);
  const door = sim.world.doors.find((d) => !d.dead && !d.ext && d.barricade <= 0 && d.f === 0);
  door.open = door.target = 1; const c = [door.ax === 'x' ? door.ix : door.ix + 0.5, door.ax === 'x' ? door.iz + 0.5 : door.iz];
  me.pos[0] = c[0] + 0.05; me.pos[2] = c[1] + 0.05; me.pos[1] = door.f * 3;
  pl.toggleDoor(door, [c[0], 1, c[1]]); ok(door.target === 1, 'a door will not close while you stand in it');
}
process.exit(fail ? 1 : 0);
