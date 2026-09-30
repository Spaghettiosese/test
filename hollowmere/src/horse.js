// A horse to ride. Buy the grey mare at Fort Greywatch's stable (or from Orrin), whistle her over
// with F, mount with F or E. A trot covers ground, a gallop (Shift) eats her wind and is loud
// enough to wake a barracks. She cannot go indoors, and a hard blow can knock you from the saddle.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
const TAU = Math.PI * 2;
const R2D = 180 / Math.PI;
const rx = (n, v) => n.setEuler(v * R2D, 0, 0);
const angDiff = (a, b) => ((b - a + Math.PI * 3) % TAU) - Math.PI;
export const HORSE_PRICE = 180;

// a box-built horse: returns the node and the parts the gait animation moves
export function buildHorseModel(coat = '#7d7f88', mane = '#26262c', saddle = true) {
  const M = (n, c, r = 0.85) => new E.Material({ name: n, color: c, roughness: r });
  const m = { coat: M('Coat', coat), dark: M('Mane', mane), belly: M('Belly', '#a4a6ae'), hoof: M('Hoof', '#1c1a1a', 0.5), leather: M('Saddle', '#5a2a22', 0.6), strap: M('Strap', '#2a1a16'), eye: M('Eye', '#0a0a0a', 0.2) };
  const box = E.box({ width: 1, height: 1, depth: 1 });
  const n = new E.Node('Horse'); const part = (mat, pos, size, parent = n, rot = null) => { const x = new E.Mesh(box, mat, 'h'); x.scale.set(size); x.position.set(pos); x.castShadow = false; if (rot) x.setEuler((rot[0] || 0) * R2D, 0, (rot[2] || 0) * R2D); parent.add(x); return x; };
  part(m.coat, [0, 1.12, 0], [0.64, 0.66, 1.3]); part(m.coat, [0, 1.16, 0.58], [0.68, 0.76, 0.46]); part(m.coat, [0, 1.12, -0.6], [0.7, 0.74, 0.5]); part(m.belly, [0, 0.82, 0.05], [0.4, 0.14, 1.2]);
  const neck = new E.Node('neck'); neck.position.set([0, 1.3, 0.82]); n.add(neck);
  part(m.coat, [0, 0.36, 0.14], [0.26, 0.82, 0.3], neck, [0.5, 0, 0]);
  part(m.dark, [0, 0.46, -0.04], [0.06, 0.78, 0.22], neck, [0.5, 0, 0]);
  const head = new E.Node('head'); head.position.set([0, 0.72, 0.36]); neck.add(head);
  part(m.coat, [0, -0.04, 0.2], [0.22, 0.26, 0.54], head, [0.35, 0, 0]); part(m.belly, [0, -0.2, 0.42], [0.16, 0.14, 0.2], head, [0.35, 0, 0]);
  for (const s of [-1, 1]) { part(m.eye, [s * 0.11, 0.02, 0.12], [0.03, 0.04, 0.04], head); part(m.dark, [s * 0.07, 0.17, -0.04], [0.05, 0.14, 0.05], head); }
  if (saddle) { part(m.leather, [0, 1.46, -0.02], [0.52, 0.07, 0.56]); part(m.leather, [0, 1.52, -0.26], [0.46, 0.12, 0.08]); part(m.strap, [0, 1.12, 0.05], [0.72, 0.04, 0.14]); part(m.strap, [0, 1.38, 0.9], [0.05, 0.05, 0.3], neck, [0.5, 0, 0]); }
  const legs = [];
  for (const [lx, lz] of [[-0.23, 0.62], [0.23, 0.62], [-0.23, -0.62], [0.23, -0.62]]) {
    const up = new E.Node('leg'); up.position.set([lx, 0.86, lz]); n.add(up); part(m.coat, [0, -0.22, 0], [0.17, 0.46, 0.2], up);
    const lo = new E.Node('low'); lo.position.set([0, -0.44, 0]); up.add(lo); part(m.coat, [0, -0.2, 0], [0.11, 0.4, 0.13], lo); part(m.hoof, [0, -0.41, 0.01], [0.11, 0.08, 0.13], lo);
    legs.push({ up, lo });
  }
  const tail = new E.Node('tail'); tail.position.set([0, 1.32, -0.84]); n.add(tail); part(m.dark, [0, -0.3, -0.06], [0.1, 0.7, 0.12], tail);
  return { node: n, neck, head, legs, tail };
}
// one pose of the gait: gait 0 still, 0.5 walk, 1 trot, 2 gallop
export function poseHorse(h, t, gait, phase, graze) {
  const amp = gait >= 2 ? 0.95 : gait >= 1 ? 0.6 : gait >= 0.5 ? 0.38 : 0;
  h.legs.forEach((L, i) => { const ph = phase + [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5][i] * (gait >= 2 ? 0.45 : 1); rx(L.up, Math.sin(ph) * amp); rx(L.lo, Math.max(0, -Math.sin(ph + 0.6)) * amp * 1.1); });
  rx(h.neck, (gait >= 2 ? -0.18 : graze > 0 ? 1.1 : 0.05) + Math.sin(t * (gait ? 3 : 1.1)) * 0.04); rx(h.head, graze > 0 ? 0.6 : 0);
  h.tail.setEuler((0.3 + (gait >= 2 ? 0.5 : 0)) * R2D, 0, Math.sin(t * 2.3 + 1) * 0.3 * R2D);
}

export class Horse {
  constructor(g) {
    this.g = g; g.reg?.('horse', this);
    this.owned = false; this.mounted = false; this.name = 'Dapple'; this.state = 'wait'; this.fed = 0; this.t = 0; this.gait = 0; this.want = 1;
    this.stepD = 0; this.trampleCd = new Map(); this.path = null; this.pathT = 0; this.callT = 0; this.lost = 0; this.idleT = 3; this.graze = 0;
    const st = g.level.stable || { x: -7.6, z: -111.5, yaw: -90 };
    this.home = st; this.x = st.x; this.z = st.z; this.yaw = st.yaw * Math.PI / 180; this.y = g.nav.floorAt(this.x, this.z); this.lastOut = [this.x, this.z];
    this.model = buildHorseModel(); this.node = this.model.node; this.neck = this.model.neck; g.scene.add(this.node); this.place();
  }
  get bond() { return Math.min(1, (this.g.stats.ridden || 0) / 4500); }
  place() { const n = this.node; n.position.set([this.x, this.y, this.z]); E.quat.fromEuler(n.rotation, 0, this.yaw / (Math.PI / 180), 0); }

  // ---------------------------------------------------------------- player actions
  buy() {
    const g = this.g, inv = g.player.inv; if (this.owned) return true;
    const price = Math.ceil(HORSE_PRICE * (g.story.priceMul?.() ?? 1)); if (inv.gold < price) { g.sfx.deny?.(); return false; }
    inv.gold -= price; this.owned = true; this.state = 'wait'; g.sfx.coin?.(); g.sfx.neigh?.([this.x, 1, this.z]); g.progress.addXp(20, 'a horse');
    g.toast(`${this.name} is yours. F mounts her; F from afar whistles her over`); g.flashText('HORSE ACQUIRED'); return true;
  }
  near(eye, r = 3.4) { return hyp(this.x - eye[0], this.z - eye[2]) < r; }
  interact() {
    const g = this.g, P = g.player; if (P.dead || g.mode !== 'play') return;
    if (this.mounted) return this.dismount();
    if (!this.owned) { if (this.near(P.pos)) this.buy() || g.toast(`She costs ${HORSE_PRICE} gold`); return; }
    if (this.near(P.pos)) return this.mount();
    this.call();
  }
  mount() {
    const g = this.g, P = g.player;
    if (P.carried || g.tools.dragging || P.picking) { g.toast('Your hands are full'); return; }
    if (g.nav.indoorAt(P.pos[0], P.pos[2])) { g.toast('No riding indoors'); return; }
    if (P.atk || P.stagger > 0) return;
    this.mounted = true; this.state = 'ridden'; P.mount = this; P.setStance('stand'); this.lastOut = [P.pos[0], P.pos[2]]; this.yaw = P.yaw; this.stepD = 0;
    g.sfx.neigh?.([this.x, 1, this.z]); g.toast('F dismounts · Shift gallops · C walks'); g.stats.mounts = (g.stats.mounts || 0) + 1;
  }
  dismount(forced = false) {
    const g = this.g, P = g.player; if (!this.mounted) return;
    this.mounted = false; P.mount = null; this.state = 'wait'; this.gait = 0;
    // stand her beside you, on ground she can actually stand on
    const side = [Math.cos(P.yaw), -Math.sin(P.yaw)];
    let spot = [P.pos[0] + side[0] * 1.3, P.pos[2] + side[1] * 1.3];
    if (g.nav.isBlocked(spot[0], spot[1]) || g.nav.indoorAt(spot[0], spot[1])) spot = [this.lastOut[0], this.lastOut[1]];
    this.x = spot[0]; this.z = spot[1]; this.y = g.nav.floorAt(this.x, this.z); this.place();
    if (!forced) g.sfx.thud?.(0.3, P.pos);
  }
  throwRider() {
    const g = this.g, P = g.player; if (!this.mounted) return;
    this.dismount(true); P.hurt?.(8, null, { fall: true }); P.stagger = 0.9; g.flashText('UNHORSED'); g.sfx.neigh?.([this.x, 1, this.z]);
    this.state = 'flee'; this.fleeT = 4; this.x += Math.sin(this.yaw) * 1.5; this.z += Math.cos(this.yaw) * 1.5;
  }
  forceReset() { if (this.mounted) this.dismount(true); }
  call() {
    const g = this.g; if (!this.owned || this.mounted) return;
    this.state = 'come'; this.path = null; this.pathT = 0; this.lost = 0; this.callT = 0; g.sfx.whistle?.(); g.toast(`You whistle for ${this.name}`);
    g.noise(g.player.pos, 14, 'coin');
  }
  feed() {
    const g = this.g, P = g.player; if (!P.inv.remove('oats', 1)) return;
    this.fed = 240; g.sfx.drink?.(); g.toast(`${this.name} crunches the oats. She will gallop longer.`); g.progress.addXp(3, '');
  }
  hook(push, eye) {
    const g = this.g; if (this.mounted || !this.near(eye, 3.6)) return;
    if (!this.owned) push(this.x, this.y + 1.2, this.z, 3.6, `Buy the grey mare (${HORSE_PRICE} gold)`, () => this.buy() || g.toast(`She costs ${HORSE_PRICE} gold`), 'body', 0.4, this);
    else if (this.fed <= 0 && g.player.inv.has('oats')) push(this.x, this.y + 1.2, this.z, 3.6, `Feed ${this.name} oats`, () => this.feed(), 'body', 0.4, this);
    else push(this.x, this.y + 1.2, this.z, 3.6, `Mount ${this.name}`, () => this.mount(), 'body', 0.4, this);
  }

  // ---------------------------------------------------------------- riding
  // desired ground speed for the rider this frame
  speedFor(k, iz, dt) {
    const P = this.g.player, walk = k.has('c') || k.has('control');
    const gallop = k.has('shift') && iz > 0 && !walk && P.stamina > 6 && !P.exhausted && !P.atk;
    this.want = gallop ? 2 : walk ? 0.5 : 1;
    if (gallop) P.stamina = Math.max(0, P.stamina - (this.fed > 0 ? 1.4 : 4.4) * (1 - 0.35 * this.bond) * dt);
    return iz < 0 ? 2.4 : gallop ? 10.4 + 1.8 * this.bond : walk ? 2.8 : 6.2;
  }
  updateRide(dt) {
    const g = this.g, P = g.player, nav = g.nav;
    if (nav.indoorAt(P.pos[0], P.pos[2])) { this.x = this.lastOut[0]; this.z = this.lastOut[1]; g.toast('You dismount; the stable-bred mare will not go indoors'); this.dismount(true); this.x = this.lastOut[0]; this.z = this.lastOut[1]; this.y = nav.floorAt(this.x, this.z); this.place(); return; }
    this.lastOut = [P.pos[0], P.pos[2]];
    this.x = P.pos[0]; this.z = P.pos[2]; this.y = P.pos[1];
    const sp = P.speedNow, vx = P.cc.velocity[0], vz = P.cc.velocity[2];
    this.gait = sp > 8.3 ? 2 : sp > 4.4 ? 1 : sp > 0.6 ? 0.5 : 0;
    if (sp > 0.8 && (vx * Math.sin(P.yaw) + vz * Math.cos(P.yaw)) > 0) this.yaw += angDiff(this.yaw, Math.atan2(vx, vz)) * Math.min(1, dt * 4.5);
    else this.yaw += angDiff(this.yaw, P.yaw) * Math.min(1, dt * (sp > 0.6 ? 1.5 : 0.9));
    g.stats.ridden = (g.stats.ridden || 0) + sp * dt;
    // hooves
    if (P.cc.grounded && sp > 0.6) {
      this.stepD += sp * dt; const stride = this.gait >= 2 ? 2.6 : this.gait >= 1 ? 1.7 : 1.2;
      if (this.stepD > stride) {
        this.stepD = 0; const floor = nav.noise[Math.max(0, nav.at(P.pos[0], P.pos[2]))] ?? 0;
        const loud = (this.gait >= 2 ? 24 : this.gait >= 1 ? 11 : 5) * [0.8, 1.0, 1.15, 1.4][floor] * (g.weather?.noiseMul ?? 1);
        P.noiseNow = Math.max(P.noiseNow || 0, loud); g.noise(P.pos, loud, 'step'); g.sfx.hoof?.(P.pos, this.gait >= 2 ? 1.2 : 0.8);
        if (this.gait >= 2) g.smoke.emit([P.pos[0], 0.12, P.pos[2]], { count: 2, color: [0.5, 0.45, 0.38, 0.3], colorEnd: [0.5, 0.45, 0.38, 0], size: 0.14, grow: 2.5, spread: 0.3, up: 0.3, life: 0.9, jitter: 0.2 });
      }
    }
    // riding people down
    if (this.gait >= 2) for (const n of g.npcs) {
      if (n.dead || n.state === 'ko' || Math.abs(n.x - this.x) > 1.6 || Math.abs(n.z - this.z) > 1.6) continue;
      const dx = n.x - this.x, dz = n.z - this.z, d = hyp(dx, dz) || 1; if ((dx * vx + dz * vz) / (d * (sp || 1)) < 0.35 || d > 1.25) continue;
      if ((this.trampleCd.get(n.id) || 0) > g.time) continue; this.trampleCd.set(n.id, g.time + 1.2);
      g.hitNpc(n, 16 + 6 * this.bond, [dx / d, dz / d], { from: 'player', clip: 'Slash3', heavy: true, trample: true }); g.stats.trampled = (g.stats.trampled || 0) + 1; g.flashText('RIDDEN DOWN');
    }
  }
  // ---------------------------------------------------------------- on her own
  updateFree(dt) {
    const g = this.g, P = g.player, nav = g.nav; this.fed = Math.max(0, this.fed - dt);
    const d = hyp(this.x - P.pos[0], this.z - P.pos[2]);
    if (this.state === 'flee') { this.fleeT -= dt; const a = Math.atan2(this.x - P.pos[0], this.z - P.pos[2]); this.moveBy(Math.sin(a), Math.cos(a), 8, dt); if (this.fleeT <= 0) this.state = 'wait'; return; }
    if (this.state === 'come') {
      this.pathT -= dt; this.callT += dt;
      if (d < 3.6) { this.state = 'wait'; this.gait = 0; g.sfx.neigh?.([this.x, 1, this.z]); return; }
      if ((!this.path || this.pathT <= 0) && g.pathBudget > 0) {
        g.pathBudget--; this.pathT = 2.5; this.path = nav.findPath(this.x, this.z, P.pos[0], P.pos[2], { maxNodes: 26000 });
        if (!this.path) this.lost += 1;
      }
      if (this.lost >= 2 || d > 240) { // out of reach: she finds her own way round while you are not looking
        this.callT += dt; if (this.callT > 6) { const a = P.yaw + Math.PI + (Math.random() - 0.5), w = nav.nearestWalkable(P.pos[0] + Math.sin(a) * 34, P.pos[2] + Math.cos(a) * 34, 8); if (w) { this.x = w[0]; this.z = w[1]; this.y = nav.floorAt(this.x, this.z); this.path = null; this.lost = 0; } this.callT = 0; }
      }
      if (this.path?.length) {
        const w = this.path[0], dx = w[0] - this.x, dz = w[1] - this.z, dd = hyp(dx, dz);
        if (dd < 1.0) this.path.shift(); else this.moveBy(dx / dd, dz / dd, d > 18 ? 10.5 : 6, dt, true);
      } else this.gait = 0;
      return;
    }
    // standing about: grazing, a swish of the tail
    this.gait = 0; this.idleT -= dt; if (this.idleT <= 0) { this.idleT = 4 + Math.random() * 6; this.graze = 2.5 + Math.random() * 2; }
    this.graze = Math.max(0, this.graze - dt);
    if (this.owned && d < 9) this.yaw += angDiff(this.yaw, Math.atan2(P.pos[0] - this.x, P.pos[2] - this.z)) * Math.min(1, dt * 1.6);
  }
  moveBy(dx, dz, sp, dt, loud = false) {
    const nav = this.g.nav, nx = this.x + dx * sp * dt, nz = this.z + dz * sp * dt;
    if (!nav.isBlocked(nx, nz) && !nav.indoorAt(nx, nz)) { this.x = nx; this.z = nz; this.y = nav.floorAt(nx, nz); }
    this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 7); this.gait = sp > 8 ? 2 : sp > 4.4 ? 1 : 0.5;
    if (loud) { this.stepD += sp * dt; if (this.stepD > (sp > 8 ? 2.6 : 1.7)) { this.stepD = 0; this.g.sfx.hoof?.([this.x, this.y, this.z], 0.9); } }
  }
  update(dt) {
    const g = this.g, P = g.player; if (!P?.pos) return; this.t += dt; this.dt = dt;
    if (this.mounted) { this.fed = Math.max(0, this.fed - dt); this.updateRide(dt); } else this.updateFree(dt);
    if (!this.mounted && !this.owned && hyp(this.x - this.home.x, this.z - this.home.z) > 0.1) { this.x = this.home.x; this.z = this.home.z; }
    const far = hyp(this.x - P.pos[0], this.z - P.pos[2]) > 120;
    this.node.visible = !far; if (far) return;
    // animation: legs swing with the gait, the head nods, the tail swishes
    const gt = this.gait, rate = gt >= 2 ? 15 : gt >= 1 ? 10 : gt >= 0.5 ? 6 : 0;
    this.phase = (this.phase || 0) + dt * rate;
    poseHorse(this.model, this.t, gt, this.phase, this.graze);
    const bob = gt >= 2 ? Math.abs(Math.sin(this.phase * 0.5)) * 0.06 : gt >= 1 ? Math.sin(this.phase) * 0.02 : 0;
    this.node.position.set([this.x, this.y + bob, this.z]); E.quat.fromEuler(this.node.rotation, 0, this.yaw / (Math.PI / 180), 0);
  }
  marks() { return this.owned && !this.mounted ? [{ x: this.x, z: this.z, shape: 'horse', label: this.name }] : []; }
  save() { return { o: this.owned, x: this.x, z: this.z, yaw: this.yaw, fed: this.fed }; }
  load(d) {
    if (!d) return; this.owned = !!d.o; if (this.mounted) this.dismount(true);
    if (this.owned) { this.x = d.x; this.z = d.z; this.yaw = d.yaw; this.fed = d.fed || 0; this.y = this.g.nav.floorAt(this.x, this.z); this.state = 'wait'; this.place(); }
  }
}
