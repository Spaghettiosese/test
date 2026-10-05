// The human player: keyboard and mouse become the actor's control inputs, the camera follows the
// actor's eye (or a drone, a camera, or a teammate when spectating), and context prompts handle
// doors, reinforcing, barricades, the defuser, reviving, vaulting and rappelling.
import * as E from '../../../engine/index.js';
import { CAST, STOREY } from '../world/grid.js';
import { GADGETS } from '../data/gadgets.js';
import { dirOf, clamp, dist2, dist3, wrapAngle } from '../sim/util.js';
import { STAND, CROUCH, PRONE } from '../sim/actor.js';

export const DEFAULT_KEYS = {
  forward: 'w', back: 's', left: 'a', right: 'd', sprint: 'shift', crouch: 'c', prone: 'z', leanL: 'q', leanR: 'e', jump: ' ', reload: 'r', use: 'f', melee: 'v',
  gadget: 'g', drone: 'x', ping: 't', scoreboard: 'tab', inspect: 'i', primary: '1', secondary: '2', gadget1: '3', gadget2: '4', detonate: 'b', next: 'n', map: 'm', help: 'h',
};

export class Player {
  constructor(game, actor) {
    this.game = game; this.a = actor; this.sim = game.sim; this.settings = game.settings;
    this.keys = new Set(); this.mouse = { l: false, r: false }; this.edge = new Set();
    this.recoil = 0; this.recoilDebt = 0; this.dYaw = 0; this.dPitch = 0; this.crouchTog = false; this.proneTog = false; this.aimTog = false;
    this.view = 'player'; // player | drone | cam | spectate | rappel
    this.prompt = null; this.fHeld = 0; this.fAction = null; this.camIndex = 0; this.specIndex = 0;
    this.camYaw = 0; this.camPitch = 0; this.pingT = 0; this.gadgetHeld = false; this.lastHit = 0; this.hitT = 0; this.msg = null; this.msgT = 0;
    this.shake = 0; this.rappel = null; this.scanT = 0; this.dead = false;
  }
  get K() { return this.settings.keys; }
  say(text, t = 2.2) { this.msg = text; this.msgT = t; }

  // ---------------------------------------------------------------- input events (wired by the game)
  keyDown(k) {
    if (this.keys.has(k)) return;
    this.keys.add(k); this.edge.add(k);
  }
  keyUp(k) { this.keys.delete(k); }
  held(name) { return this.keys.has(this.K[name]); }
  pressed(name) { return this.edge.has(this.K[name]); }
  mouseMove(dx, dy) {
    if (this.view === 'drone' || this.view === 'cam') { this.camYaw -= dx * 0.0022 * this.settings.sens; this.camPitch = clamp(this.camPitch - dy * 0.0022 * this.settings.sens, -1.3, 1.3); return; }
    if (!this.a.alive && this.view !== 'spectate') return;
    if (this.view === 'spectate') return;
    const fov = this.game.cam.fov / (this.game.vm.world * E.DEG), s = 0.0022 * Math.pow(fov, 0.9) * this.settings.sens * (this.a.ads > 0.5 ? this.settings.adsSens : 1);
    this.a.yaw -= dx * s; this.a.pitch = clamp(this.a.pitch - dy * s * (this.settings.invertY ? -1 : 1), -1.5, 1.5);
    this.dYaw += dx * 0.0004; this.dPitch += dy * 0.0004;
  }
  mouseButton(b, down) {
    if (b === 0) this.mouse.l = down; if (b === 2) { this.mouse.r = down; if (down && this.settings.aimToggle) this.aimTog = !this.aimTog; }
    if (down) this.edge.add('mouse' + b);
  }
  wheel(dir) {
    const a = this.a; if (!a.alive || this.view !== 'player') return;
    const n = a.guns.length + a.gadgets.length; if (!n) return;
    let i = a.gsel >= 0 ? a.guns.length + a.gsel : a.cur;
    i = (i + (dir > 0 ? 1 : n - 1)) % n; this.selectIndex(i);
  }
  selectIndex(i) {
    const a = this.a;
    if (i < a.guns.length) { a.gsel = -1; a.switchGun(i); } else { a.gsel = i - a.guns.length; if (a.shield) a.shield.up = false; }
    this.syncShield();
  }
  syncShield() { const a = this.a; if (a.shield) a.shield.up = a.selected() && (a.selected().id === 'shield' || a.selected().id === 'flashshield'); }

  // ---------------------------------------------------------------- frame
  update(dt) {
    const a = this.a, c = a.ctl, K = this.K;
    this.msgT = Math.max(0, this.msgT - dt); this.hitT = Math.max(0, this.hitT - dt);
    if (!a.alive && !a.downed) { this.deadView(dt); this.edge.clear(); return; }
    if (this.view === 'drone') { this.droneInput(dt); this.edge.clear(); return; }
    if (this.view === 'cam') { this.camInput(dt); this.edge.clear(); return; }
    if (a.mode === 'rappel') { this.rappelInput(dt); this.edge.clear(); return; }
    // ---- movement
    c.fwd = (this.held('forward') ? 1 : 0) - (this.held('back') ? 1 : 0);
    c.strafe = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    c.sprint = this.held('sprint');
    if (this.pressed('crouch')) { this.crouchTog = !this.crouchTog; this.proneTog = false; }
    if (this.pressed('prone')) { this.proneTog = !this.proneTog; this.crouchTog = false; }
    if (this.keys.has('control')) this.crouchTog = true;
    if (c.sprint && c.fwd > 0) { this.crouchTog = false; this.proneTog = false; }
    c.stance = this.proneTog ? PRONE : this.crouchTog ? CROUCH : STAND;
    c.lean = (this.held('leanR') ? 1 : 0) - (this.held('leanL') ? 1 : 0);
    c.aim = this.mouse.r || this.aimTog; if (!this.settings.aimToggle) this.aimTog = false;
    if (this.pressed('jump')) this.tryVaultOrJump();
    // ---- weapon and gadget selection
    if (this.pressed('primary')) this.selectIndex(0);
    if (this.pressed('secondary')) this.selectIndex(1);
    if (this.pressed('gadget1')) this.selectGadget(0);
    if (this.pressed('gadget2')) this.selectGadget(1);
    if (this.pressed('next')) this.wheel(1);
    if (this.pressed('reload')) { c.reload = true; }
    if (this.pressed('inspect')) this.game.vm.inspect();
    if (this.pressed('melee') && !a.busy) { this.sim.devices.melee(a); this.game.vm.use('Use'); }
    if (this.pressed('drone')) this.enterAuxView();
    if (this.pressed('ping')) this.ping();
    // ---- shooting / gadgets
    const sel = a.selected();
    if (sel) {
      c.fire = false;
      this.gadgetInput(sel, dt);
    } else {
      c.fire = this.mouse.l && !a.busy;
    }
    if (this.pressed('detonate') || (this.pressed('gadget') && !sel)) { if (this.sim.devices.detonateOwned(a)) this.say('Detonated'); }
    if (this.pressed('gadget') && sel) this.useSelected(sel);
    // ---- recoil recovery
    const rec = this.recoil * Math.min(1, dt * 12);
    a.pitch = clamp(a.pitch + rec, -1.5, 1.5); this.recoil -= rec; this.recoilDebt += rec * 0.7;
    if (!c.fire || !(a.gun && a.gun.def.auto)) { const back = this.recoilDebt * Math.min(1, dt * 5); a.pitch -= back; this.recoilDebt -= back; }
    // ---- contextual interaction
    this.interact(dt);
    this.edge.clear();
  }
  selectGadget(i) {
    const a = this.a; if (i >= a.gadgets.length) return;
    a.gsel = a.gsel === i ? -1 : i; this.syncShield();
  }
  gadgetInput(sel, dt) {
    const a = this.a, def = GADGETS[sel.id], c = a.ctl;
    const fam = def.family;
    if (sel.id === 'scanner') {
      if (this.mouse.l) { this.scanT -= dt; if (this.scanT <= 0) { this.scanT = 1.6; this.scan(); this.game.vm.use('Use'); } }
      return;
    }
    if (fam === 'item') { if (this.edge.has('mouse0')) this.useSelected(sel); return; }
    if (sel.id === 'torch') { // hold against a reinforced wall
      if (this.mouse.l && !a.busy) this.startTorch();
      c.use = this.mouse.l; return;
    }
    if (this.edge.has('mouse0')) this.useSelected(sel);
  }
  useSelected(sel) {
    const a = this.a, sim = this.sim, def = GADGETS[sel.id];
    if (a.busy) return;
    if (sel.id === 'shield' || sel.id === 'flashshield') { if (a.shield && sel.id === 'flashshield' && a.shield.up && a.shield.cd <= 0) { this.flashStrobe(); } else if (a.shield) { sim.devices.melee(a, { hammer: false }); this.game.vm.use('Use'); } return; }
    if (sel.id === 'armorpack') { const r = sim.devices.placeAt(a, 'armorpack', a.pos, [0, 1, 0], null, null); if (r.ok) { this.game.vm.use('Use'); this.say('Armor pack dropped'); } return; }
    const r = sim.devices.use(a, sel.id);
    if (r.ok) { this.game.vm.use('Use'); if (def.family === 'device') this.game.audio && this.game.audio.place(a.pos); }
    else if (r.msg) { this.say(r.msg); this.game.audio && this.game.audio.ui('error'); }
    if (sel.count <= 0 && def.count > 0) { a.gsel = -1; }
  }
  flashStrobe() { const a = this.a; a.shield.cd = 12; this.sim.devices.flash([a.pos[0] + a.fwd[0] * 1.2, a.pos[1] + 1.4, a.pos[2] + a.fwd[2] * 1.2], a, 9, false); this.sim.emit('flashbang', { pos: [a.pos[0] + a.fwd[0], a.pos[1] + 1.4, a.pos[2] + a.fwd[2]] }); }
  scan() {
    const a = this.a; let n = 0;
    for (const e of this.sim.actors) { if (e.team === a.team || !e.alive) continue; if (dist3(a.pos, e.pos) < 18) { e.applyStatus('tag', 2.4); n++; } }
    this.say(n ? `${n} heartbeat${n > 1 ? 's' : ''} detected` : 'No heartbeats nearby'); this.game.audio && this.game.audio.beep(null, true);
  }
  startTorch() {
    const a = this.a, o = a.eye(), d = a.look(), h = this.sim.world.cast(o[0], o[1], o[2], d[0], d[1], d[2], 1.6, CAST.GLASS);
    if (!h || !h.panel || !h.panel.reinforced) return;
    const pn = h.panel;
    a.busy = { kind: 'torch', t: 0, dur: 5.5, freeze: true, cancelIf: (x) => !x.ctl.use || !x.alive, onDone: () => { pn.reinforced = false; this.sim.world.breakPanel(pn, { actor: a }); this.sim.noise([h.x, h.y, h.z], 12, 'burn', a); this.sim.emit('burn', { pos: [h.x, h.y, h.z] }); } };
  }

  // ---------------------------------------------------------------- vaulting, jumping
  tryVaultOrJump() {
    const a = this.a, w = this.sim.world;
    const f = a.fwd, ix = Math.floor(a.pos[0]), iz = Math.floor(a.pos[2]), fl = Math.floor((a.pos[1] + 0.5) / STOREY);
    // the cell in front (axis-aligned) and whether the edge there is a window sill
    const dx = Math.abs(f[0]) > Math.abs(f[2]) ? Math.sign(f[0]) : 0, dz = dx ? 0 : Math.sign(f[2]);
    if ((dx || dz) && w.edge(ix, iz, ix + dx, iz + dz, fl) === 3) {
      const to = [ix + dx + 0.5 + dx * 0.25, fl * STOREY, iz + dz + 0.5 + dz * 0.25];
      a.yaw = Math.atan2(dx, dz); a.startVault(to); return;
    }
    a.ctl.jump = true;
  }

  // ---------------------------------------------------------------- the world in front of the player
  probe(reach = 2.6) {
    const a = this.a, o = a.eye(), d = a.look();
    const h = this.sim.world.cast(o[0], o[1], o[2], d[0], d[1], d[2], reach, 0);
    return h ? { panel: h.panel, prop: h.prop, pt: [h.x, h.y, h.z], t: h.t, n: [h.nx, h.ny, h.nz] } : null;
  }
  interact(dt) {
    const a = this.a, sim = this.sim, r = sim.round, w = sim.world;
    this.prompt = null;
    if (a.busy) {
      const b = a.busy, label = { plant: 'Planting defuser', defuse: 'Disabling defuser', reinforce: 'Reinforcing', barricade: 'Barricading', revive: 'Reviving', torch: 'Burning' }[b.kind] || 'Working';
      this.prompt = { text: label, hold: true, progress: b.t / b.dur, key: 'F' }; a.ctl.use = this.held('use') || b.kind === 'torch'; return;
    }
    a.ctl.use = false;
    const use = this.held('use'), tap = this.pressed('use');
    const hit = this.probe(2.8);
    const near = (p, d = 1.5) => dist2(a.pos, p) < d && Math.abs(a.pos[1] - p[1]) < 1.6;
    // bomb site actions
    if (a.team === 'atk' && r.o.mode === 'bomb' && r.inAction() && r.bomb.state === 'idle') {
      const s = r.nearSpot(a);
      if (s >= 0) { this.prompt = { text: 'Hold to plant the defuser', key: 'F', hold: true }; if (use) { a.ctl.use = true; r.startPlant(a); } return; }
    }
    if (a.team === 'def' && (r.bomb.state === 'planted' || r.bomb.state === 'defusing') && near(r.bomb.pos, 1.6)) { this.prompt = { text: 'Hold to disable the defuser', key: 'F', hold: true }; if (use) { a.ctl.use = true; r.startDefuse(a); } return; }
    // revive a teammate
    for (const t of sim.actors) {
      if (t.team === a.team && t.downed && dist3(a.pos, t.pos) < 1.8) {
        this.prompt = { text: `Hold to revive ${t.name}`, key: 'F', hold: true };
        if (use) { a.ctl.use = true; a.busy = { kind: 'revive', t: 0, dur: 3.4, freeze: true, cancelIf: (x) => !x.ctl.use || !x.alive || !t.downed, onDone: () => t.revive(a) }; }
        return;
      }
    }
    // rappel anchors on the roof
    if (a.team === 'atk' && a.pos[1] > sim.map.roofY - 0.5) {
      const an = sim.map.anchors.find((q) => dist2(a.pos, q.pos) < 1.4);
      if (an) { this.prompt = { text: 'Hold to rappel', key: 'F', hold: true }; if (use) { this.fHeld += dt; if (this.fHeld > 0.6) this.startRappel(an); } else this.fHeld = 0; return; }
    }
    this.fHeld = 0;
    if (!hit || !hit.panel) {
      if (hit && hit.prop && hit.prop.dev) { /* looking at a device */ }
      return;
    }
    const p = hit.panel;
    // doors
    if (p.door) {
      const d = p.door;
      if (d.barricade > 0) { this.prompt = { text: d.armored ? 'Armor panel' : 'Barricaded', key: '' }; return; }
      if (a.team === 'def' && (use && this.fHeldTime(dt) > 0.45)) { const rr = r.barricadeAct(a, p); if (rr.ok) { a.ctl.use = true; return; } }
      this.prompt = { text: d.open > 0.5 ? 'Close door' : 'Open door', key: 'F', sub: a.team === 'def' ? 'Hold to barricade' : '' };
      if (tap) { if (d.setOpen(d.target < 0.5)) { this.game.audio && this.game.audio.door(hit.pt, d.target > 0.5); sim.noise(hit.pt, 8, 'door', a); } }
      return;
    }
    if (p.kind === 'glass') {
      this.prompt = a.team === 'def' ? { text: 'Hold to barricade', key: 'F', hold: true } : { text: 'Window', key: '' };
      if (a.team === 'def' && use) { const rr = r.barricadeAct(a, p); if (rr.ok) a.ctl.use = true; }
      return;
    }
    if (p.kind === 'wall' && p.unit && a.team === 'def' && r.inPrep()) {
      const un = w.unitReinforced(p.unit);
      this.prompt = un ? { text: 'Reinforced', key: '' } : p.nr ? { text: "Can't reinforce here", key: '' } : { text: `Hold to reinforce (${r.reinforcements} left)`, key: 'F', hold: true };
      if (!un && !p.nr && use) { const rr = r.reinforce(a, p); if (rr.ok) a.ctl.use = true; else this.say(rr.msg); }
      return;
    }
    if (p.hatch && a.team === 'def' && r.inPrep() && !p.reinforced) {
      this.prompt = { text: 'Hold to reinforce hatch', key: 'F', hold: true };
      if (use) { const rr = r.reinforce(a, p); if (rr.ok) a.ctl.use = true; }
    }
  }
  fHeldTime(dt) { this.fHeld += dt; return this.fHeld; }

  // ---------------------------------------------------------------- rappelling
  startRappel(an) {
    const a = this.a, o = an.out;
    a.mode = 'rappel'; this.rappel = { an, y: this.sim.map.roofY, swing: 0, sv: 0 };
    a.pos = [an.pos[0] + o[0] * 0.9, this.sim.map.roofY, an.pos[2] + o[1] * 0.9]; a.stance = STAND; a.vel = [0, 0, 0];
    this.say('Rappelling: W/S to move, Space to kick off, F to release', 3);
  }
  rappelInput(dt) {
    const a = this.a, R = this.rappel, an = R.an, o = an.out, c = a.ctl;
    const move = (this.held('forward') ? -1 : 0) + (this.held('back') ? 1 : 0); // forward = down? W lowers you
    R.y = clamp(R.y - (this.held('forward') ? 1 : 0) * 2.6 * dt + (this.held('back') ? 1 : 0) * 2.6 * dt, 0, this.sim.map.roofY + 0.2);
    R.sv += (0 - R.sv) * dt * 2; if (this.pressed('jump')) { R.sv = 1; }
    R.swing += (R.sv * 1.6 - R.swing) * Math.min(1, dt * 6); R.sv = Math.max(0, R.sv - dt * 2.2);
    a.pos = [an.pos[0] + o[0] * (0.9 + R.swing), R.y, an.pos[2] + o[1] * (0.9 + R.swing)];
    const w = this.sim.world;
    // step into an open window at this height
    const inward = [-o[0], -o[1]];
    const cx = Math.floor(a.pos[0] + inward[0] * 0.75), cz = Math.floor(a.pos[2] + inward[1] * 0.75), fl = Math.floor((a.pos[1] + 0.2) / STOREY);
    const fromX = Math.floor(a.pos[0]), fromZ = Math.floor(a.pos[2]);
    if (this.pressed('jump') && fl >= 0 && fl < this.sim.world.floors && (cx !== fromX || cz !== fromZ)) {
      const e = w.edge(fromX, fromZ, cx, cz, fl);
      const yIn = a.pos[1] - fl * STOREY;
      if (e === 3 && yIn > 0.6 && yIn < 2.2) { a.mode = 'normal'; this.rappel = null; a.startVault([cx + 0.5, fl * STOREY, cz + 0.5]); return; }
    }
    c.fire = this.mouse.l; c.aim = this.mouse.r; c.fwd = c.strafe = 0;
    if (this.pressed('use') || (R.y <= 0.05)) { a.mode = 'normal'; this.rappel = null; a.pos[1] = Math.max(0, a.pos[1]); a.pos[0] += o[0] * 0.3; a.pos[2] += o[1] * 0.3; a.vel = [0, 0, 0]; }
    if (this.pressed('primary')) this.selectIndex(0); if (this.pressed('secondary')) this.selectIndex(1);
    c.reload = this.pressed('reload');
  }

  // ---------------------------------------------------------------- drones, cameras, spectating
  enterAuxView() {
    const a = this.a, sim = this.sim;
    if (this.view !== 'player') { this.exitAux(); return; }
    if (a.team === 'atk') {
      let dr = a.drone;
      if (!dr || dr.dead) { if (sim.round.inPrep() && !a.droneUsed) { dr = sim.devices.spawnDrone(a, [a.pos[0] + a.fwd[0], a.pos[1], a.pos[2] + a.fwd[2]], a.yaw); a.droneUsed = true; } else { this.say(a.droneUsed ? 'Your drone is gone' : 'Drones are launched during preparation'); return; } }
      this.view = 'drone'; this.camYaw = dr.yaw; this.camPitch = 0; a.mode = 'drone';
    } else {
      const cams = sim.devices.of('def', 'cams');
      if (!cams.length) { this.say('No cameras placed'); return; }
      this.view = 'cam'; this.camIndex = 0; this.camYaw = Math.atan2(cams[0].n[0], cams[0].n[2]); this.camPitch = 0; a.mode = 'drone';
    }
  }
  exitAux() { this.view = 'player'; this.a.mode = 'normal'; this.a.ctl.stance = this.a.stance; }
  droneInput(dt) {
    const a = this.a, dr = a.drone;
    if (!dr || dr.dead) { this.exitAux(); this.say('Drone destroyed'); return; }
    if (this.pressed('drone') || this.pressed('use')) { dr.ctl.fwd = dr.ctl.strafe = 0; this.exitAux(); return; }
    dr.ctl.fwd = (this.held('forward') ? 1 : 0) - (this.held('back') ? 1 : 0); dr.ctl.strafe = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    dr.yaw = this.camYaw; dr.pitch = this.camPitch; dr.ctl.turn = 0; dr.ctl.pitch = 0;
    if (this.pressed('jump') || this.held('jump')) dr.ctl.jump = true; // the drone hops kerbs and benches
    if (this.pressed('ping') || this.edge.has('mouse0')) this.ping(dr);
  }
  camInput(dt) {
    const sim = this.sim, cams = sim.devices.of('def', 'cams');
    if (!cams.length) { this.exitAux(); return; }
    if (this.pressed('drone') || this.pressed('use')) { this.exitAux(); return; }
    if (this.pressed('jump') || this.edge.has('mouse0') || this.pressed('next')) this.camIndex = (this.camIndex + 1) % cams.length;
    const cam = cams[this.camIndex % cams.length], base = Math.atan2(cam.n[0], cam.n[2]);
    this.camYaw = base + clamp(wrapAngle(this.camYaw - base), -1.1, 1.1); this.camPitch = clamp(this.camPitch, -0.7, 0.5);
  }
  deadView(dt) {
    const sim = this.sim; this.view = this.view === 'player' ? 'spectate' : this.view;
    this.a.mode = 'normal';
    const mates = sim.actors.filter((x) => x.team === this.a.team && x.alive && x !== this.a);
    const pool = mates.length ? mates : sim.actors.filter((x) => x.alive);
    if (!pool.length) return;
    if (this.pressed('jump') || this.edge.has('mouse0')) this.specIndex = (this.specIndex + 1) % pool.length;
    if (this.edge.has('mouse2')) this.specIndex = (this.specIndex + pool.length - 1) % pool.length;
    this.specTarget = pool[this.specIndex % pool.length];
  }
  ping(from = null) {
    const a = this.a, o = from ? [from.pos[0], from.pos[1] + 0.3, from.pos[2]] : a.eye(), d = from ? dirOf(from.yaw, from.pitch) : a.look();
    const h = this.sim.world.cast(o[0], o[1], o[2], d[0], d[1], d[2], 90, CAST.GLASS);
    let best = null, bt = h ? h.t : 90;
    for (const e of this.sim.actors) { if (e.team === a.team || !e.alive) continue; const r = e.hitTest(o, d, bt); if (r && r.t < bt) { best = e; bt = r.t; } }
    const pos = best ? best.chestPos() : h ? [h.x, h.y, h.z] : null; if (!pos) return;
    if (best) { best.applyStatus('tag', 6); this.say(`Marked ${best.name}`); }
    this.sim.emit('ping', { actor: a, pos, enemy: best });
  }

  // ---------------------------------------------------------------- called by the game after the sim steps
  onShot(e) {
    if (e.actor !== this.a) return;
    const k = e.kick * (0.8 + Math.random() * 0.4) * E.DEG; this.recoil += k * (this.a.ads > 0.5 ? 0.8 : 1);
    this.a.yaw += (Math.random() - 0.5) * e.kick * 0.35 * E.DEG;
  }
}
void GADGETS;
