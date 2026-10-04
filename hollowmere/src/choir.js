// The Choir: what sleeps under the Choir Stones. A mound of grey flesh in a pit, thirteen faces on
// long necks singing, three great throats around the pit, and a heart of violet light inside.
// Phase one: the throats sing rings along the floor (jump or step through them) and notes that
// follow you; cut the throats down. Phase two: the heart rises, breathes a Silence that you hide
// from behind a fallen throat or dodge through, and comes down to the rim to look at you; strike it
// then. When it is nearly done it speaks, and you decide how this ends.
import * as E from '../../engine/index.js';

const hyp = Math.hypot, TAU = Math.PI * 2;
const DIFF = [0.75, 1, 1.25];

export class ChoirBoss {
  constructor(g, place) {
    this.g = g; this.P = place; this.phase = 0; this.t = 0; this.rings = []; this.faces = []; this.throats = []; this.cool = { ring: 4, note: 3, call: 12, silence: 9, expose: 6 };
    this.heart = { hp: 700, max: 700, y: 1.2, pos: [place.x, place.z], exposed: 0, charge: 0 }; this.hits = 0; this.spoke = false;
    this.build(); this.root.visible = false;
  }
  // ------------------------------------------------------------ the body
  build() {
    const g = this.g, M = g.level.pal, P = this.P, root = new E.Node('The Choir'); this.root = root;
    const flesh = M.flesh, glow = M.choirGlow;
    const mk = (fn) => { const k = new E.Kit(M); fn(k); return k.toNode('part'); };
    this.mound = mk((k) => { k.add(flesh, E.sphere({ radius: 4.7, widthSegments: 14, heightSegments: 9 }), [0, 0, 0], [0, 0, 0], [1, 0.55, 1]); for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; k.add(flesh, E.sphere({ radius: 1.4, widthSegments: 8, heightSegments: 6 }), [Math.cos(a) * 3.4, 0.6, Math.sin(a) * 3.4], [0, 0, 0], [1, 0.7, 1]); } });
    this.mound.position.set([P.x, -3.2, P.z]); root.add(this.mound);
    // thirteen faces on necks
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * TAU + 0.12, node = new E.Node('Face');
      const neck = mk((k) => k.cyl(flesh, [0, 1.2, 0], 0.2, 2.4, [0, 0, 0], 6)); node.add(neck);
      const head = new E.Node('Head'); head.position.set([0, 2.5, 0]); node.add(head);
      head.add(mk((k) => { k.add(M.bone, E.sphere({ radius: 0.5, widthSegments: 10, heightSegments: 8 }), [0, 0, 0], [0, 0, 0], [0.9, 1.1, 0.95]); for (const s of [-1, 1]) k.add(M.blackCloth, E.sphere({ radius: 0.11, widthSegments: 6, heightSegments: 4 }), [0.17 * s, 0.12, 0.42]); }));
      const mouth = mk((k) => k.add(glow, E.sphere({ radius: 0.16, widthSegments: 8, heightSegments: 6 }), [0, 0, 0])); mouth.position.set([0, -0.2, 0.43]); head.add(mouth);
      node.position.set([P.x + Math.cos(a) * 3.0, 0, P.z + Math.sin(a) * 3.0]); root.add(node);
      this.faces.push({ node, head, mouth, a, ph: Math.random() * 6, base: 0.6 + (i % 3) * 0.45 });
    }
    // three throats, standing like pillars around the pit (none in the way of the west door)
    for (const deg of [90, 210, 330]) {
      const a = deg * Math.PI / 180, x = P.x + Math.cos(a) * 10.5, z = P.z + Math.sin(a) * 10.5;
      const node = mk((k) => { k.cyl(flesh, [0, 2.75, 0], 0.85, 5.5, [0, 0, 0], 9, 1.15); k.add(flesh, E.sphere({ radius: 1.15, widthSegments: 8, heightSegments: 6 }), [0, 0.2, 0], [0, 0, 0], [1, 0.4, 1]); });
      node.position.set([x, 0, z]); root.add(node);
      const head = mk((k) => { k.add(M.bone, E.sphere({ radius: 0.78, widthSegments: 10, heightSegments: 8 }), [0, 0, 0], [0, 0, 0], [0.9, 1.1, 0.95]); for (const s of [-1, 1]) k.add(M.blackCloth, E.sphere({ radius: 0.16, widthSegments: 6, heightSegments: 4 }), [0.27 * s, 0.2, 0.66]); });
      head.position.set([x, 6.2, z]); root.add(head);
      const mouth = mk((k) => k.add(glow, E.sphere({ radius: 0.26, widthSegments: 8, heightSegments: 6 }), [0, 0, 0])); head.add(mouth); mouth.position.set([0, -0.32, 0.68]);
      const light = new E.Light('point', { color: '#a070ff', intensity: 0, range: 9, flicker: 0.3 }); light.position.set([x, 5.5, z]); g.scene.add(light); g.level.lights.push(light);
      const body = new E.Body({ shape: new E.Box([0.9, 2.8, 0.9]), type: 'static', position: [x, 2.8, z] }); body.userData.kind = 'stone'; g.world.add(body);
      g.nav.block(x - 1.1, z - 1.1, x + 1.1, z + 1.1, 1);
      this.throats.push({ node, head, mouth, light, body, x, z, a, hp: 160 * DIFF[g.difficulty ?? 1], max: 160 * DIFF[g.difficulty ?? 1], dead: false, flinch: 0, cd: 2 + this.throats.length * 1.4 });
    }
    // the heart
    this.heartNode = mk((k) => { k.add(glow, E.sphere({ radius: 0.95, widthSegments: 14, heightSegments: 10 }), [0, 0, 0]); });
    this.ringA = mk((k) => k.add(M.wax, E.torus({ radius: 1.45, tube: 0.07, radialSegments: 6, tubularSegments: 32 }), [0, 0, 0])); this.ringB = mk((k) => k.add(M.wax, E.torus({ radius: 1.75, tube: 0.06, radialSegments: 6, tubularSegments: 32 }), [0, 0, 0]));
    this.heartNode.position.set([P.x, -2, P.z]); this.ringA.position.set([P.x, -2, P.z]); this.ringB.position.set([P.x, -2, P.z]); root.add(this.heartNode); root.add(this.ringA); root.add(this.ringB);
    this.heartLight = new E.Light('point', { color: '#c080ff', intensity: 0, range: 16, flicker: 0.2 }); g.scene.add(this.heartLight); g.level.lights.push(this.heartLight);
    g.scene.add(root);
  }
  // ------------------------------------------------------------ waking
  wake() {
    if (this.phase) return; const g = this.g; this.phase = 1; this.root.visible = true; this.rise = 0;
    for (const T of this.throats) { this.heart.max = this.heart.max; T.light.intensity = 7; }
    this.heart.max = this.heart.hp = 700 * DIFF[g.difficulty ?? 1] * (g.ngHp || 1);
    g.ui.flashBanner('THE CHOIR', 3200); g.sfx.bell?.(4); g.sfx.hollowCry?.([this.P.x, 2, this.P.z]); g.shake = 1; g.combatT = 30;
    g.toast('Cut down the three throats. Jump or step aside as the rings pass.');
    this.hitTaken = false;
  }
  reset() {   // the player fell: what is dead stays dead, the rest heals
    if (!this.phase || this.done) return;
    for (const T of this.throats) if (!T.dead) T.hp = T.max;
    if (this.phase === 2) this.heart.hp = Math.max(this.heart.hp, this.heart.max * 0.7);
    this.rings = []; this.heart.charge = 0; this.heart.exposed = 0; this.cool = { ring: 5, note: 4, call: 14, silence: 10, expose: 7 };
  }
  // ------------------------------------------------------------ the sword against it
  slash(eye, f, reach, dmg) {
    if (!this.phase || this.done || this.talking) return false;
    let hit = false; const g = this.g;
    for (const T of this.throats) {
      if (T.dead) continue; const dx = T.x - eye[0], dz = T.z - eye[2], d = hyp(dx, dz);
      if (d > reach + 1.0 || (dx * f[0] + dz * f[2]) / (d || 1) < 0.35) continue;
      T.hp -= dmg; T.flinch = 0.3; hit = true; g.spark([T.x - dx / d * 0.9, eye[1], T.z - dz / d * 0.9], [-dx / d, 0, -dz / d], 12); g.sfx.slash?.([T.x, 2, T.z]); g.ui.hitMarker();
      g.ui.floater?.(Math.round(dmg), [T.x, 3.5, T.z], '#d8b8ff');
      if (T.hp <= 0) this.killThroat(T);
    }
    if (this.phase === 2 && this.heart.exposed > 0) {
      const [hx, hz] = this.heart.pos, dx = hx - eye[0], dz = hz - eye[2], d = hyp(dx, dz), dy = this.heart.y - eye[1];
      if (d < reach + 1.3 && Math.abs(dy) < 2.2 && (dx * f[0] + dz * f[2]) / (d || 1) > 0.3) {
        this.heart.hp -= dmg; hit = true; this.hits++; g.spark([hx, this.heart.y, hz], [0, 1, 0], 18); g.sfx.clang?.(1.4); g.ui.hitMarker(); g.hitStop = Math.max(g.hitStop || 0, 0.05);
        g.ui.floater?.(Math.round(dmg), [hx, this.heart.y + 1.2, hz], '#ff9aff');
        if (this.heart.hp <= this.heart.max * 0.15) this.speak();
      }
    }
    return hit;
  }
  killThroat(T) {
    const g = this.g; T.dead = true; T.light.intensity = 0; g.sfx.hollowCry?.([T.x, 4, T.z]); g.sfx.boom?.(0.8); g.shake = 0.7;
    T.node.scale.set([1, 0.28, 1]); T.head.position.set([T.x, 1.9, T.z]); T.mouth.scale.set([0.2, 0.2, 0.2]);
    g.world.remove(T.body); T.body = new E.Body({ shape: new E.Box([0.95, 0.8, 0.95]), type: 'static', position: [T.x, 0.8, T.z] }); T.body.userData.kind = 'stone'; g.world.add(T.body);
    for (let i = 0; i < 30; i++) g.emitBurst?.([T.x + (Math.random() - 0.5) * 2, 1 + Math.random() * 3, T.z + (Math.random() - 0.5) * 2], 'dust');
    const n = this.throats.filter((x) => x.dead).length; g.ui.flashBanner(`A THROAT FALLS (${n}/3)`, 2200, true);
    if (n >= 3) this.phaseTwo();
  }
  phaseTwo() {
    const g = this.g; this.phase = 2; this.cool.silence = 6; this.cool.expose = 3; this.heart.charge = 0;
    g.ui.flashBanner('THE HEART RISES', 3000); g.sfx.bell?.(3); g.shake = 1;
    g.toast('When the heart draws breath, hide behind a fallen throat or step through the Silence. Strike it when it comes down to the rim.');
  }
  // ------------------------------------------------------------ the end of the fight
  speak() {
    if (this.talking) return; this.talking = true; const g = this.g;
    this.rings = []; this.heart.exposed = 99; this.heart.charge = 0; g.boss.orbs.forEach((o) => (o.life = 0));
    for (const n of g.npcs) if (n.role === 'hollow' && !n.dead && n.dist < 40 && !n.def.boss) { n.die([0, 0], { byNpc: true }); }
    g.ui.flashBanner('THE CHOIR SPEAKS', 3000); g.sfx.whisper?.(); g.slowmo = 1.2;
    g.after(1.4, () => this.onSpeak?.());
  }
  // ------------------------------------------------------------ frame
  update(dt) {
    if (!this.phase) return; const g = this.g, P = g.player, T0 = this.P; this.t += dt;
    const diff = DIFF[g.difficulty ?? 1], ward = g.gear?.eq?.charm === 'echocharm' ? 0.55 : g.gear?.eq?.charm === 'waxward' ? 0.65 : 1;
    // rising out of the pit
    if (this.rise < 1) { this.rise = Math.min(1, this.rise + dt * 0.35); this.mound.position[1] = -3.2 + 3.55 * this.rise; for (const F of this.faces) F.node.position[1] = -2.6 + 2.6 * this.rise; }
    // the faces sway and sing
    for (const F of this.faces) {
      const s = Math.sin(this.t * F.base + F.ph), sing = this.talking ? 0.2 : Math.abs(Math.sin(this.t * 2.6 + F.ph));
      E.quat.fromEuler(F.node.rotation, s * 9, (-F.a * 180 / Math.PI) + 90 + Math.sin(this.t * 0.7 + F.ph) * 12, Math.cos(this.t * F.base) * 7);
      F.mouth.scale.set([1, 0.4 + 1.3 * sing, 1]);
    }
    for (const T of this.throats) { if (T.dead) continue; T.flinch = Math.max(0, T.flinch - dt); const s = 0.4 + 1.2 * Math.abs(Math.sin(this.t * 3 + T.a)); T.mouth.scale.set([1, s, 1]); E.quat.fromEuler(T.head.rotation, Math.sin(this.t * 2) * 6 + T.flinch * 40, 90 - Math.atan2(P.pos[2] - T.z, P.pos[0] - T.x) * 180 / Math.PI, 0); T.light.intensity = 6 + 3 * Math.sin(this.t * 6 + T.a); }
    // the heart
    const H = this.heart;
    if (this.phase === 1) { H.y = -1.5; }
    else {
      if (H.exposed > 0) { H.exposed -= dt; const a = Math.atan2(P.pos[2] - T0.z, P.pos[0] - T0.x); const tx = T0.x + Math.cos(a) * 6.2, tz = T0.z + Math.sin(a) * 6.2; H.pos[0] += (tx - H.pos[0]) * Math.min(1, dt * 2); H.pos[1] += (tz - H.pos[1]) * Math.min(1, dt * 2); H.y += (1.6 - H.y) * Math.min(1, dt * 2.4); }
      else { H.pos[0] += (T0.x - H.pos[0]) * Math.min(1, dt * 1.5); H.pos[1] += (T0.z - H.pos[1]) * Math.min(1, dt * 1.5); H.y += (4.6 + Math.sin(this.t * 1.3) * 0.4 - H.y) * Math.min(1, dt * 1.6); }
    }
    this.heartNode.position.set([H.pos[0], H.y, H.pos[1]]); this.ringA.position.set([H.pos[0], H.y, H.pos[1]]); this.ringB.position.set([H.pos[0], H.y, H.pos[1]]);
    const pulse = 1 + 0.12 * Math.sin(this.t * 5) + H.charge * 0.5; this.heartNode.scale.set([pulse, pulse, pulse]);
    E.quat.fromEuler(this.ringA.rotation, this.t * 50, this.t * 30, 0); E.quat.fromEuler(this.ringB.rotation, -this.t * 40, 0, this.t * 35);
    this.heartLight.position.set([H.pos[0], H.y, H.pos[1]]); this.heartLight.intensity = this.phase === 2 ? 10 + 30 * H.charge : 0;
    if (this.talking || this.done) return;
    for (const k in this.cool) this.cool[k] -= dt;
    // rings along the floor
    if (this.cool.ring <= 0) { this.cool.ring = this.phase === 1 ? 6.2 / Math.min(1.3, diff) : 8.5; this.rings.push({ r: 5.6, sp: 7.5 + (this.phase === 2 ? 1 : 0), hit: false }); g.sfx.boom?.(0.4); g.sfx.whisper?.(); }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const R = this.rings[i]; R.r += R.sp * dt;
      const n = Math.max(10, Math.floor(R.r * 2.2)); for (let k = 0; k < 4; k++) { const a = Math.random() * TAU; g.flames.emit([T0.x + Math.cos(a) * R.r, 0.15, T0.z + Math.sin(a) * R.r], { count: 1, color: [3.4, 1.4, 5.0, 0.9], colorEnd: [0.8, 0.2, 1.2, 0], size: 0.16, grow: 0.4, spread: 0.08, up: 0.6, life: 0.5, jitter: 0.04 }); }
      void n;
      const d = hyp(P.pos[0] - T0.x, P.pos[2] - T0.z), air = P.pos[1] > g.nav.floorAt(P.pos[0], P.pos[2]) + 0.35;
      if (!R.hit && Math.abs(d - R.r) < 0.6 && !air && !P.dead) { R.hit = true; const r = P.incoming(26 * diff * ward, [T0.x, T0.z], { from: null, unblockable: true }); if (r === 'hit') { P.stagger = Math.max(P.stagger, 0.5); this.hitTaken = true; g.flashText('THE CHORUS'); } }
      if (R.r > T0.R) this.rings.splice(i, 1);
    }
    // notes: the throats in phase one, the faces after
    if (this.cool.note <= 0) {
      this.cool.note = this.phase === 1 ? 2.4 : 5.5;
      const singers = this.phase === 1 ? this.throats.filter((T) => !T.dead) : [this.faces[Math.floor(Math.random() * 13)]];
      const src = singers[Math.floor(Math.random() * singers.length)];
      if (src) { const p = src.x !== undefined ? [src.x, 6.0, src.z] : [src.node.position[0], 2.4, src.node.position[2]]; g.boss.orbsFrom({ x: p[0], y: p[1] - 1.5, z: p[2], spec: { height: 1 }, arch: { caster: true } }, this.phase === 1 ? 1 : 2, { dmg: 11 * diff * ward, speed: 6 }); }
    }
    // the dead answer
    if (this.cool.call <= 0) {
      this.cool.call = 20; const near = g.npcs.filter((n) => n.role === 'hollow' && !n.dead && n.dist < 40).length;
      if (near < 5) for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, q = g.nav.nearestWalkable(T0.x + Math.cos(a) * 16, T0.z + Math.sin(a) * 16, 3); if (q) g.story.spawnHollow(q[0], q[1], true, false, Math.random() < 0.25 ? 'brute' : 'plain'); }
    }
    if (this.phase === 2) {
      // the Silence: a breath drawn in, then let out; hide behind a stump or be inside a dodge when it breaks
      if (H.charge > 0) {
        H.charge += dt / 2.6;
        if (Math.random() < dt * 30) g.sparks.emit([H.pos[0], H.y, H.pos[1]], { count: 1, color: [4, 2, 6, 1], colorEnd: [1, 0.3, 2, 0], size: 0.06, grow: 0.3, spread: 2.5, up: 0, life: 0.5, jitter: 0.1 });
        if (H.charge >= 1) {
          H.charge = 0; this.cool.expose = 1.2; g.sfx.boom?.(1); g.shake = 1.2; g.pix.hurt = Math.max(g.pix.hurt, 0.5);
          const pa = Math.atan2(P.pos[2] - T0.z, P.pos[0] - T0.x), pd = hyp(P.pos[0] - T0.x, P.pos[2] - T0.z);
          const covered = this.throats.some((T) => T.dead && Math.abs(((pa - T.a + Math.PI * 3) % TAU) - Math.PI) < 0.16 && pd > 11.2);
          if (covered) g.flashText('SHELTERED');
          else if (!P.dead) { const r = P.incoming(48 * diff * ward, [H.pos[0], H.pos[1]], { from: null, unblockable: true }); if (r === 'hit') { this.hitTaken = true; P.stagger = Math.max(P.stagger, 0.9); g.flashText('SILENCE'); } else g.flashText('THROUGH THE SILENCE'); }
        }
      } else if (this.cool.silence <= 0 && H.exposed <= 0) { this.cool.silence = 13; H.charge = 0.01; g.sfx.whisper?.(); g.toast('The heart draws breath...'); }
      if (this.cool.expose <= 0 && H.charge <= 0 && H.exposed <= 0) { this.cool.expose = 9; H.exposed = 5; g.sfx.hollowCry?.([H.pos[0], 2, H.pos[1]]); }
    }
  }
}
