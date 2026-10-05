// Operator-specific behaviour: how a bot uses the hammer, thermite, pellets, torch, sensor, shield
// and stim pistol. Breaching tasks run as small state machines so the squad opens walls on purpose.
import { CAST, STOREY } from '../world/grid.js';
import { STAND, CROUCH } from '../sim/actor.js';
import { dist2, dist3, norm, sub, yawOf, pitchOf, wrapAngle } from '../sim/util.js';

// returns true when it took over the frame (a task it owns)
export function runGadgetAI(b, dt, ctx) {
  const t = b.task, a = b.a;
  if (ctx === 'task' && t) {
    if (t.type === 'breach') { runBreach(b, dt, t); return true; }
    if (t.type === 'intel') { runIntel(b, dt, t); return true; }
  }
  passive(b, dt, ctx);
  void a;
  return false;
}

function face(b, p, dt, rate = 9) {
  const a = b.a, e = a.eye();
  b.want.yaw = yawOf(p[0] - a.pos[0], p[2] - a.pos[2]); b.want.pitch = pitchOf(p[0] - e[0], p[1] - e[1], p[2] - e[2]);
  b.turnTo(dt, rate);
  return Math.abs(wrapAngle(b.want.yaw - a.yaw)) < 0.06;
}
function goExact(b, pos, speed = 'walk', tol = 0.35) {
  if (dist2(b.a.pos, pos) <= tol && Math.abs(b.a.pos[1] - pos[1]) < 1.2) { b.mover.stop(); return true; }
  if (!b.mover.goal || dist3(b.mover.goal, pos) > 0.6 || (b.mover.failed && b.stateT > 0.6)) { b.mover.goTo(pos, { speed, tol, exact: true }); b.stateT = 0; }
  b.applyWish(b.mover.wish, speed); b.faceMove(0.016);
  return false;
}

// ------------------------------------------------------------------------------------------ breaching
function runBreach(b, dt, t) {
  const a = b.a, sim = b.sim, w = sim.world, c = a.ctl, e = t.edge, panel = e.panels[1] || e.panels[0];
  t.s = t.s || 'go'; t.age = (t.age || 0) + dt;
  const done = () => { b.dir.taskDone(a, 'breached'); };
  const gone = () => !panel || panel.dead || !w.get(panel.ax, panel.ix, panel.iy, panel.iz);
  if (t.age > 70) { b.dir.taskFailed(a, 'too slow'); return; }
  if (gone() && t.s !== 'wait') { done(); return; }
  const toward = [e.outside[0] - e.normal[0] * 0.0, e.outside[1], e.outside[2]];
  switch (t.method) {
    case 'hammer': {
      if (t.s === 'go') { if (!goExact(b, e.outside, 'run', 0.3)) return; t.s = 'swing'; t.n = 0; t.cd = 0; }
      const ok = face(b, e.centre, dt); c.stance = STAND;
      t.cd -= dt;
      if (ok && t.cd <= 0 && !a.busy) { sim.devices.melee(a, { hammer: true }); t.cd = 0.95; t.n++; if (t.n > 7 || sim.world.unitReinforced(t.unit.unit)) { b.dir.taskFailed(a, 'hammer cannot break this'); } }
      return;
    }
    case 'thermite': case 'cluster': {
      if (t.s === 'go') { if (!goExact(b, e.outside, 'run', 0.35)) return; t.s = 'place'; }
      if (t.s === 'place') {
        if (!face(b, e.centre, dt)) return;
        const p = [e.centre[0] - e.normal[0] * 0.04, e.centre[1], e.centre[2] - e.normal[2] * 0.04], n = [-e.normal[0], 0, -e.normal[2]];
        const r = sim.devices.placeAt(a, t.method, p, n, panel, null);
        if (!r.ok) { b.dir.taskFailed(a, r.msg); return; }
        t.dev = r.device; t.s = 'retreat'; t.retreat = [e.outside[0] - e.normal[0] * 3.2, e.outside[1], e.outside[2] - e.normal[2] * 3.2];
        const snap = sim.nav.centre(sim.nav.snap(t.retreat[0], t.retreat[1], t.retreat[2])); t.retreat = snap; t.wait = 0;
      }
      if (t.s === 'retreat') {
        if (!goExact(b, t.retreat, 'run', 0.6) && t.age < 40) { if (t.age > 25) t.s = 'fire'; return; }
        t.s = 'fire'; t.wait = 0.9;
      }
      if (t.s === 'fire') {
        face(b, e.centre, dt, 6); c.stance = CROUCH; t.wait -= dt;
        if (t.wait <= 0) { sim.devices.detonateOwned(a); t.s = 'wait'; t.wait = t.method === 'thermite' ? 5.5 : 1.2; }
      }
      if (t.s === 'wait') {
        face(b, e.centre, dt, 6); t.wait -= dt;
        if (gone() || t.wait <= 0) { if (gone()) done(); else b.dir.taskFailed(a, 'charge failed'); }
      }
      return;
    }
    case 'xpellet': case 'launcher': {
      const stand = [e.outside[0] - e.normal[0] * (t.method === 'launcher' ? 2.5 : 0.8), e.outside[1], e.outside[2] - e.normal[2] * (t.method === 'launcher' ? 2.5 : 0.8)];
      const snap = sim.nav.centre(sim.nav.snap(stand[0], stand[1], stand[2]));
      if (t.s === 'go') { if (!goExact(b, snap, 'run', 0.4)) return; t.s = 'fire'; t.wait = 0; t.shots = 0; }
      if (t.s === 'fire') {
        const ok = face(b, e.centre, dt, 10); t.wait -= dt;
        if (ok && t.wait <= 0) { const g = a.gadget(a.op.ability); if (!g || g.count <= 0) { b.dir.taskFailed(a, 'no ammo'); return; } sim.devices.use(a, a.op.ability); t.shots++; t.wait = 3.0; t.s = 'burn'; }
      }
      if (t.s === 'burn') {
        face(b, e.centre, dt, 6); t.wait -= dt;
        if (gone()) { t.s = 'wait'; }
        else if (t.wait <= 0) { if (t.shots >= 3) b.dir.taskFailed(a, 'out of pellets'); else t.s = 'fire'; }
      }
      if (t.s === 'wait') done();
      return;
    }
    case 'torch': {
      if (t.s === 'go') { if (!goExact(b, e.outside, 'run', 0.3)) return; t.s = 'burn'; }
      face(b, e.centre, dt); c.stance = CROUCH;
      if (!a.busy && !gone()) {
        a.busy = { kind: 'torch', t: 0, dur: 5.5, freeze: true, cancelIf: (x) => !x.alive || x.status.stun > 0, onDone: () => { if (panel && !panel.dead) { panel.reinforced = false; sim.world.breakPanel(panel, { actor: a }); sim.noise(e.centre, 12, 'burn', a); sim.emit('burn', { pos: e.centre }); } } };
      }
      c.use = true;
      return;
    }
    default: b.dir.taskFailed(a, 'unknown breach');
  }
}

// ------------------------------------------------------------------------------------------ intel
function runIntel(b, dt, t) {
  const a = b.a, sim = b.sim, site = sim.round.site;
  t.age = (t.age || 0) + dt; t.pulse = (t.pulse || 0) - dt;
  if (!t.pos) {
    // a spot outside the building within 14 m of the site, up against the wall
    const u = t.unit && t.unit.mid; t.pos = u ? u.outside : site.center;
  }
  if (!goExact(b, sim.nav.centre(sim.nav.snap(t.pos[0], t.pos[1], t.pos[2])), 'run', 0.4)) return;
  face(b, site.center, dt, 5); a.ctl.stance = CROUCH;
  if (t.pulse <= 0) { t.pulse = 1.6; pulse(b); }
  if (t.age > 14 || !(a.op.ability === 'scanner' || a.op.ability === 'sonar')) b.dir.taskDone(a, 'scanned');
  if (a.op.ability === 'sonar' && t.age > 4) { sonarThrow(b, t); b.dir.taskDone(a, 'sonar'); }
}
function pulse(b) {
  const a = b.a, sim = b.sim;
  if (a.op.ability !== 'scanner') return;
  let n = 0;
  for (const e of sim.actors) {
    if (e.team === a.team || !e.alive) continue;
    if (dist3(a.pos, e.pos) < 18) { e.applyStatus('tag', 2.2); n++; b.dir.callout(a, e, e.chestPos()); }
  }
  sim.emit('scan', { actor: a, found: n });
}
function sonarThrow(b, t) {
  const a = b.a, sim = b.sim, site = sim.round.site;
  const eye = a.eye(), d = norm(sub([site.center[0], eye[1] + 2.5, site.center[2]], eye));
  sim.devices.use(a, 'sonar', { dir: d, speed: 13 });
  void t;
}

// ------------------------------------------------------------------------------------------ passive gadgets
function passive(b, dt, ctx) {
  const a = b.a, sim = b.sim, ab = a.op.ability;
  b.gadgetT -= dt; if (b.gadgetT > 0) return; b.gadgetT = 0.4;
  if (a.shield && (ab === 'shield' || ab === 'flashshield')) {
    const near = b.sense.freshest(6);
    const want = ctx === 'combat' || (near && dist3(near.pos, a.pos) < 25) || (sim.round.inAction() && b.dir && b.dir.state === 'push');
    a.shield.up = !!want && a.alive && !(a.busy);
    if (a.shield.up && a.guns[0] && a.cur === 0 && a.guns.length > 1) a.switchGun(1);
    return;
  }
  if (ab === 'stimpistol' && ctx !== 'combat') {
    const g = a.gadget('stimpistol'); if (!g || g.count <= 0) return;
    for (const m of sim.actors) {
      if (m === a || m.team !== a.team || !(m.alive || m.downed)) continue;
      if (m.downed || m.hp < m.maxHp * 0.6) {
        const eye = a.eye(), t = m.chestPos(), d = dist3(eye, t);
        if (d < 12 && sim.world.visible(eye, t, CAST.GLASS)) {
          b.want.yaw = yawOf(t[0] - a.pos[0], t[2] - a.pos[2]); b.want.pitch = pitchOf(t[0] - eye[0], t[1] - eye[1], t[2] - eye[2]);
          if (Math.abs(wrapAngle(b.want.yaw - a.yaw)) < 0.12) { a.yaw = b.want.yaw; a.pitch = b.want.pitch; sim.devices.use(a, 'stimpistol'); }
          else b.turnTo(0.4, 12);
          return;
        }
      }
    }
  }
  void STOREY;
}
