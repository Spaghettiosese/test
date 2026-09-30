// The player's non-sword toys: thrown knives, coins that lure guards, fire flasks, poisoned
// blades, the sap, wraith sight, dragging bodies and picking pockets, plus crafting.
import * as E from '../../engine/index.js';
import { ITEMS } from './items.js';

const hyp = Math.hypot;
export const RECIPES = [
  { id: 'poison', name: 'Nightshade oil', makes: ['poison', 3], needs: [['nightbloom', 1], ['hexbane', 1]], desc: 'Three vials of blade poison.' },
  { id: 'firebomb', name: 'Fire flask', makes: ['firebomb', 2], needs: [['wine', 1], ['cloth', 1]], desc: 'Two flasks that burn everything close.' },
  { id: 'knife', name: 'Throwing knives', makes: ['knife', 4], needs: [['dagger', 1]], desc: 'Melt a fine dagger down into four throwing knives.' },
  { id: 'salve', name: 'Red Salve', makes: ['potion', 2], needs: [['bread', 2], ['hexbane', 1]], desc: 'Two salves from bread and bitter herbs.' },
  { id: 'ember', name: 'Ember Flask', makes: ['ember', 1], needs: [['hexbane', 1], ['ring', 1]], desc: 'Grind a silver ring into a flask of Ember.' },
  { id: 'pick', name: 'Lockpicks', makes: ['lockpick', 3], needs: [['dagger', 1]], desc: 'File a dagger into three picks.' },
  { id: 'hexbane', name: 'Hexbane draught', makes: ['hexbane', 1], needs: [['h_hex', 2]], desc: 'Boil two Hexwort into a bitter tonic.' },
  { id: 'emberf', name: 'Ember Flask (moss)', makes: ['ember', 1], needs: [['h_ember', 2]], desc: 'Steep two Ember moss.' },
  { id: 'd_haste', name: 'Draught of Haste (6)', makes: ['d_haste', 1], needs: [['h_bog', 1], ['hexbane', 1]], desc: 'Run 28% faster for 40 seconds.' },
  { id: 'd_iron', name: 'Draught of Ironhide (7)', makes: ['d_iron', 1], needs: [['h_bog', 2], ['scrap', 1]], desc: 'Take 40% less damage for 70 seconds.' },
  { id: 'd_night', name: 'Draught of Night Eye (8)', makes: ['d_night', 1], needs: [['nightbloom', 1], ['h_hex', 1]], desc: 'See in the dark for two minutes.' },
  { id: 'd_ghost', name: 'Draught of Ghostwalk (9)', makes: ['d_ghost', 1], needs: [['nightbloom', 1], ['h_ember', 1]], desc: 'Nearly silent and half as visible for 25 seconds.' },
  { id: 'smokeb', name: 'Smoke bombs', makes: ['smoke', 2], needs: [['h_ember', 1], ['cloth', 1]], desc: 'Two bombs that blind and hide (J).' },
  { id: 'oilf', name: 'Lamp oil', makes: ['oil', 3], needs: [['h_bog', 1]], desc: 'Render bogcap into lantern oil (L).' },
  { id: 'beart', name: 'Bear trap', makes: ['beartrap', 1], needs: [['scrap', 3]], desc: 'Set with H. Holds and hurts.' },
  { id: 'wiret', name: 'Tripwires', makes: ['wire', 2], needs: [['scrap', 1], ['cloth', 1]], desc: 'Set with H. Trips and stuns.' },
  { id: 'jerky', name: 'Venison jerky', makes: ['jerky', 3], needs: [['rawmeat', 2]], desc: 'Dry and salt two cuts of venison. It keeps.' },
  { id: 'stew', name: "Hunter's stew", makes: ['stew', 1], needs: [['cookedmeat', 1], ['bread', 1], ['h_bog', 1]], desc: 'Roast venison, bread and bogcap. +regen, +armour for a while.' },
  { id: 'hidewraps', name: 'Deerhide wraps', makes: ['hidewraps', 1], needs: [['hide', 2]], desc: 'Soft, silent boots cut from deer hide.' },
  { id: 'hidecloak', name: 'Hunter\'s cloak', makes: ['hidecloak', 1], needs: [['hide', 3], ['cloth', 1]], desc: 'A mottled cloak. Harder to spot, quieter to move in.' },
  { id: 'sap', name: 'Lead sap', makes: ['sap', 1], needs: [['sack', 0], ['gold', 15]], desc: 'A weighted cosh, for quiet work.', once: true },
];

export class Tools {
  constructor(g) {
    this.g = g; this.proj = []; this.stuck = []; this.fires = []; this.sap = false; this.poisonHits = 0; this.dragging = null; this.sightT = 0; this.cool = { knife: 0, coin: 0, bomb: 0 };
    this.geoKnife = E.box({ width: 0.03, height: 0.02, depth: 0.26 }); this.geoFlask = E.sphere({ radius: 0.08, widthSegments: 8, heightSegments: 6 }); this.geoCoin = E.cylinder({ radiusTop: 0.03, radiusBottom: 0.03, height: 0.01, radialSegments: 8 });
    this.mSteel = new E.Material({ name: 'Knife', color: '#b8c0c8', metallic: 1, roughness: 0.3 }); this.mGold = new E.Material({ name: 'Coin', color: '#e0b450', metallic: 1, roughness: 0.3, emissive: '#553300', emissiveStrength: 0.5 });
    this.mFlask = new E.Material({ name: 'Flask', color: '#7a3a1a', roughness: 0.3, emissive: '#ff6a20', emissiveStrength: 1.2 });
    this.light = null;
  }
  // ---------------------------------------------------------------- keys
  keys(input, dt) {
    const g = this.g, P = g.player, k = input.pressed;
    if (k.has('4')) this.skillSight();
    if (k.has('5')) this.applyPoison();
    if (k.has('g')) this.throwKnife();
    if (k.has('v')) this.throwCoin();
    if (k.has('x')) this.throwBomb();
    if (k.has('b')) this.toggleSap();
    if (k.has('u')) g.rep.remove();
    if (k.has('l')) g.lantern.toggle();
    if (k.has('h')) g.traps?.drop();
    if (k.has('j')) this.throwSmoke();
    for (const [key, id, ef] of [['6', 'd_haste', 'haste'], ['7', 'd_iron', 'iron'], ['8', 'd_night', 'night'], ['9', 'd_ghost', 'ghost']]) if (k.has(key)) this.drink(id, ef);
    this.dragUpdate(input.keys.has('z'), dt);
  }
  origin(sp, up = 0.0) {
    const P = this.g.player, e = P.eyePos, f = P.forward;
    return { p: [e[0] + f[0] * 0.5, e[1] - 0.12, e[2] + f[2] * 0.5], v: [f[0] * sp + P.cc.velocity[0] * 0.5, f[1] * sp + up, f[2] * sp + P.cc.velocity[2] * 0.5], dir: f };
  }
  add(kind, mesh, p, v, extra = {}) { this.g.scene.add(mesh); this.proj.push({ kind, mesh, p: [...p], v: [...v], life: 4, ...extra }); }
  throwKnife() {
    const g = this.g, P = g.player; if (this.cool.knife > 0 || P.dead || P.stagger > 0 || g.mode !== 'play') return;
    if (!P.inv.has('knife')) { g.toast('No throwing knives'); g.sfx.deny?.(); return; }
    P.inv.remove('knife', 1); this.cool.knife = 0.45;
    const o = this.origin(30, 1.0), m = new E.Mesh(this.geoKnife, this.mSteel, 'Knife'); m.castShadow = false;
    this.add('knife', m, o.p, o.v); P.playVm('Pinch', 0.03); g.sfx.swing?.(0.5);
  }
  throwCoin() {
    const g = this.g, P = g.player; if (this.cool.coin > 0 || P.dead || g.mode !== 'play') return;
    if (P.inv.gold < 1) { g.toast('No coin to throw'); return; }
    P.inv.gold -= 1; this.cool.coin = 0.4;
    const o = this.origin(13, 3.5), m = new E.Mesh(this.geoCoin, this.mGold, 'Coin'); m.castShadow = false;
    this.add('coin', m, o.p, o.v, { spin: 9 }); g.sfx.blip?.(1.5);
  }
  throwBomb() {
    const g = this.g, P = g.player; if (this.cool.bomb > 0 || P.dead || g.mode !== 'play') return;
    if (!P.inv.has('firebomb')) { g.toast('No fire flasks'); g.sfx.deny?.(); return; }
    P.inv.remove('firebomb', 1); this.cool.bomb = 1.2;
    const o = this.origin(15, 3.2), m = new E.Mesh(this.geoFlask, this.mFlask, 'Flask'); m.castShadow = false;
    this.add('bomb', m, o.p, o.v); P.playVm('Pinch', 0.03); g.sfx.swing?.(0.6);
  }
  toggleSap() {
    const g = this.g; if (!g.player.inv.has('sap')) { g.toast('You have no sap (craft one)'); return; }
    this.sap = !this.sap; g.ui.toast(this.sap ? 'Sap ready: blows knock out the unwary' : 'Blade ready'); g.sfx.blip?.(0.8);
  }
  throwSmoke() {
    const g = this.g, P = g.player; if (this.cool.bomb > 0 || P.dead || g.mode !== 'play') return;
    if (!P.inv.has('smoke')) { g.toast('No smoke bombs'); g.sfx.deny?.(); return; }
    P.inv.remove('smoke', 1); this.cool.bomb = 1.0;
    const o = this.origin(13, 3.0), m = new E.Mesh(this.geoFlask, this.mGold, 'Smoke'); m.castShadow = false;
    this.add('smoke', m, o.p, o.v); P.playVm('Pinch', 0.03); g.sfx.swing?.(0.5);
  }
  drink(id, ef) {
    const g = this.g, P = g.player; if (!P.inv.has(id)) { g.toast(`No ${ITEMS[id]?.name || id}`); g.sfx.deny?.(); return; }
    P.inv.remove(id, 1); g.status.add(ef); g.sfx.drink?.(); P.playVm('Pinch', 0.05);
  }
  applyPoison() {
    const g = this.g, P = g.player;
    if (this.poisonHits > 0) { g.toast('Your blade is already coated'); return; }
    if (!P.inv.has('poison')) { g.toast('No Nightshade oil'); g.sfx.deny?.(); return; }
    P.inv.remove('poison', 1); this.poisonHits = 5; g.toast('The blade is coated: 5 poisoned hits'); g.sfx.drink?.(); P.playVm('Pinch', 0.05);
  }
  skillSight() {
    const g = this.g, P = g.player; if (this.sightCool > 0) return; if (!P.spend(25)) return;
    this.sightT = 9 * (P.mod?.sight || 1); this.sightCool = 14; g.toast('Wraith Sight'); g.sfx.veil?.();
  }
  // ---------------------------------------------------------------- per-frame
  update(dt) {
    const g = this.g, P = g.player;
    for (const k in this.cool) this.cool[k] = Math.max(0, this.cool[k] - dt);
    this.sightT = Math.max(0, this.sightT - dt); this.sightCool = Math.max(0, (this.sightCool || 0) - dt);
    for (let i = this.proj.length - 1; i >= 0; i--) if (this.step(this.proj[i], dt)) { g.scene.remove(this.proj[i].mesh); this.proj.splice(i, 1); }
    for (let i = this.stuck.length - 1; i >= 0; i--) { const s = this.stuck[i]; s.t -= dt; if (s.t <= 0 || s.taken) { g.scene.remove(s.mesh); this.stuck.splice(i, 1); } }
    this.updateFires(dt);
  }
  step(pr, dt) {
    const g = this.g, P = g.player; pr.life -= dt; if (pr.life <= 0) return true;
    pr.v[1] -= (pr.kind === 'knife' ? 4 : 13) * dt;
    const st = [pr.v[0] * dt, pr.v[1] * dt, pr.v[2] * dt], len = hyp(...st) || 1e-6, dir = [st[0] / len, st[1] / len, st[2] / len];
    // people first
    for (const n of g.npcs) {
      if (n.dead || n.state === 'ko' || Math.abs(n.x - pr.p[0]) > 3 || Math.abs(n.z - pr.p[2]) > 3) continue;
      const cy = n.y + (n.lying ? 0.3 : 0), top = cy + (n.lying ? 0.4 : 1.85);
      // sample along the step
      for (let t = 0; t <= 1.001; t += 0.5) {
        const x = pr.p[0] + st[0] * t, y = pr.p[1] + st[1] * t, z = pr.p[2] + st[2] * t;
        if (hyp(x - n.x, z - n.z) < 0.42 && y > cy && y < top) { this.hitPerson(pr, n, y > cy + 1.45, dir); return true; }
      }
    }
    if (pr.kind === 'knife' && g.fauna?.hitPoint(pr.p, 22)) { g.sfx.thud?.(0.5, pr.p); return true; }
    if (pr.kind === 'knife') for (const tt of g.level.torches) { if (!tt.lit || tt.small || Math.abs(tt.x - pr.p[0]) > 0.6 || Math.abs(tt.z - pr.p[2]) > 0.6 || Math.abs(tt.y - pr.p[1]) > 0.6) continue; tt.lit = false; tt.wasLit = true; tt.light.intensity = 0; if (tt.flame) tt.flame.visible = false; if (tt.flames) for (const f of tt.flames) f.visible = false; g.emitBurst([tt.x, tt.y, tt.z], 'poof'); g.sfx.glass?.([tt.x, tt.y, tt.z]); g.noise([tt.x, tt.y, tt.z], 6, 'clang'); g.stealth.st.lightsOut++; g.stealth.leave('light', tt.x, tt.z, 14); g.flashText('LIGHT OUT'); }
    const h = g.world.raycast(pr.p, dir, len + 0.05, { ignore: P.cc.body, mask: 0xffff & ~(2 | 4 | 8) });
    if (h || pr.p[1] + st[1] < 0.03) {
      const d = h ? h.distance : 0, at = [pr.p[0] + dir[0] * d, Math.max(0.03, pr.p[1] + dir[1] * d), pr.p[2] + dir[2] * d];
      this.land(pr, at, h ? h.normal : [0, 1, 0], dir); return true;
    }
    pr.p[0] += st[0]; pr.p[1] += st[1]; pr.p[2] += st[2];
    pr.mesh.position.set(pr.p);
    if (pr.kind === 'knife') E.quat.fromEuler(pr.mesh.rotation, -Math.atan2(pr.v[1], hyp(pr.v[0], pr.v[2])) / (Math.PI / 180), Math.atan2(pr.v[0], pr.v[2]) / (Math.PI / 180), 0);
    else if (pr.spin) pr.mesh.rotation[0] += pr.spin * dt;
    if (pr.kind === 'bomb' && Math.random() < dt * 30) g.flames.emit(pr.p, { count: 1, color: [4, 1.6, 0.3, 1], colorEnd: [1, 0.2, 0, 0], size: 0.1, grow: 0.2, spread: 0.05, up: 0.3, life: 0.35, jitter: 0.05 });
    return false;
  }
  hitPerson(pr, n, head, dir) {
    const g = this.g, P = g.player;
    if (pr.kind === 'knife') {
      const unaware = (n.state === 'routine' || n.state === 'notice' || n.lying) && n.alert < 0.95 && !n.sees;
      const dmg = 22 * (P.mod?.knife || 1) * (head ? 2.6 : 1);
      const opts = { from: 'player', clip: 'knife', ranged: true, silentKill: unaware && head };
      const res = g.hitNpc(n, dmg, [dir[0], dir[2]], opts);
      if (res === 'killed') g.stats.knifeKills = (g.stats.knifeKills || 0) + 1;
      if (res === 'killed' && Math.random() < (P.mod?.knifeSave ?? 0.35)) { P.inv.add('knife', 1); }
      if (head && res !== 'blocked') g.flashText('HEADSHOT');
    } else if (pr.kind === 'coin') { g.noise(n.pos, 6, 'step'); g.sfx.coin?.(); n.hear([n.x, n.y, n.z], 8, 'coin', null); }
    else if (pr.kind === 'bomb') this.burst(pr.p);
    else if (pr.kind === 'smoke') g.status.smoke(pr.p);
  }
  land(pr, at, normal, dir) {
    const g = this.g;
    if (pr.kind === 'knife') {
      g.spark(at, normal, 6); g.sfx.clang?.(0.5); g.noise(at, 6, 'clang');
      const m = new E.Mesh(this.geoKnife, this.mSteel, 'Knife'); m.castShadow = false; m.position.set(at); E.quat.fromEuler(m.rotation, -Math.asin(Math.max(-1, Math.min(1, dir[1]))) / (Math.PI / 180), Math.atan2(dir[0], dir[2]) / (Math.PI / 180), 0);
      g.scene.add(m); this.stuck.push({ mesh: m, x: at[0], y: at[1], z: at[2], t: 60 });
    } else if (pr.kind === 'coin') {
      g.sfx.coin?.(); g.noise(at, 15, 'coin'); g.spark(at, [0, 1, 0], 3);
      for (const n of g.npcs) if (n.guard && !n.dead && hyp(n.x - at[0], n.z - at[2]) < 15) { n.alert = Math.max(n.alert, 0.45); n.noticed(at, 'coin'); if (n.state === 'notice') n.bark('Did you hear a coin?'); }
    } else if (pr.kind === 'bomb') this.burst(at);
    else if (pr.kind === 'smoke') g.status.smoke(at);
  }
  burst(at) {
    const g = this.g, P = g.player, s = P.mod?.fire || 1;
    g.sfx.crash?.(at); g.noise(at, 18, 'crash');
    this.fires.push({ x: at[0], y: at[1], z: at[2], t: 6.5 * s, r: 2.4 * s, wit: false });
    if (!this.light) { this.light = new E.Light('point', { color: '#ff7a2a', intensity: 14, range: 12, flicker: 0.7 }); g.scene.add(this.light); }
    this.light.position.set([at[0], at[1] + 0.8, at[2]]); this.light.intensity = 14;
    g.smoke.emit(at, { count: 30, color: [0.2, 0.18, 0.18, 0.6], colorEnd: [0.1, 0.1, 0.1, 0], size: 0.3, grow: 3, spread: 0.7, up: 1.2, life: 2, jitter: 0.5 });
    g.rep.crime('arson', at, { range: 26 });
  }
  updateFires(dt) {
    const g = this.g, P = g.player;
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]; f.t -= dt;
      const k = Math.min(1, f.t / 2);
      for (let j = 0; j < 3; j++) g.flames.emit([f.x + (Math.random() - 0.5) * f.r * 1.6, f.y + 0.05, f.z + (Math.random() - 0.5) * f.r * 1.6], { count: 1, color: [4, 1.8 + Math.random(), 0.4, 1], colorEnd: [1, 0.15, 0, 0], size: 0.28 * k + 0.05, grow: 0.4, spread: 0.1, up: 1.6, life: 0.6, jitter: 0.1 });
      if (Math.random() < dt * 8) g.smoke.emit([f.x, f.y + 0.8, f.z], { count: 1, color: [0.25, 0.22, 0.22, 0.4], colorEnd: [0.1, 0.1, 0.1, 0], size: 0.2, grow: 3, spread: 0.3, up: 1.2, life: 1.6, jitter: 0.3 });
      for (const n of g.npcs) if (!n.dead && hyp(n.x - f.x, n.z - f.z) < f.r) { if (n.burn <= 0 && n.state !== 'ko') n.bark(n.guard ? 'FIRE!' : 'I am burning!'); n.burn = Math.max(n.burn, 3.5); if (n.lying) n.leaveActivity?.(); }
      if (hyp(P.pos[0] - f.x, P.pos[2] - f.z) < f.r * 0.9 && P.invuln <= 0) { P.hp -= dt * 12; P.hurtT = 0.2; g.pix.hurt = 0.4; if (P.hp <= 0) { P.hp = 0; P.dead = true; g.playerDied(); } }
      if (f.t <= 0) this.fires.splice(i, 1);
    }
    if (this.light) { if (this.fires.length) { const f = this.fires[this.fires.length - 1]; this.light.position.set([f.x, f.y + 0.8, f.z]); this.light.intensity = 14 * Math.min(1, f.t / 1.5); } else this.light.intensity = 0; }
  }
  // ---------------------------------------------------------------- bodies
  dragUpdate(held, dt) {
    const g = this.g, P = g.player;
    if (!held || P.dead || g.mode !== 'play') { if (this.dragging) { this.dragging = null; } return; }
    if (!this.dragging) {
      let best = null, bd = 2.6;
      for (const n of g.npcs) if ((n.dead || n.state === 'ko') && n.frozen !== undefined) { const d = hyp(n.x - P.pos[0], n.z - P.pos[2]); if (d < bd) { bd = d; best = n; } }
      if (best) { this.dragging = best; g.ui.toast('Dragging ' + best.name.toLowerCase()); }
      else return;
    }
    const n = this.dragging, f = P.flat;
    const tx = P.pos[0] - f[0] * 1.35, tz = P.pos[2] - f[1] * 1.35;
    if (hyp(n.x - P.pos[0], n.z - P.pos[2]) > 3.6) { this.dragging = null; return; }
    if (n.dead && n.ragdoll) {
      n.frozen = false; n.deadT = Math.min(n.deadT, 2);
      for (const part of n.ragdoll.parts.values()) { const b = part.body; if (!b) continue; b.wake?.(); const dx = tx - b.position[0], dz = tz - b.position[2]; b.velocity = [dx * 6, b.velocity[1], dz * 6]; }
    } else if (n.state === 'ko') { n.x += (tx - n.x) * Math.min(1, dt * 6); n.z += (tz - n.z) * Math.min(1, dt * 6); n.lyingPos = [n.x, n.y + 0.12, n.z]; }
  }
  // ---------------------------------------------------------------- crafting
  canCraft(r) { const inv = this.g.player.inv; return r.needs.every(([id, n]) => n === 0 || inv.count(id) >= n) && !(r.once && inv.has(r.makes[0])); }
  craft(id) {
    const r = RECIPES.find((x) => x.id === id), g = this.g, inv = g.player.inv; if (!r || !this.canCraft(r)) { g.sfx.deny?.(); return false; }
    for (const [it, n] of r.needs) if (n) { if (it === 'gold') inv.gold -= n; else inv.remove(it, n); }
    const extra = (Math.random() < (g.player.mod?.alch || 0) ? 1 : 0) + (g.hideout?.atBench() && Math.random() < 0.4 ? 1 : 0); inv.add(r.makes[0], r.makes[1] + extra); g.stats.crafted = (g.stats.crafted || 0) + r.makes[1]; g.sfx.coin?.(); g.toast(`Crafted ${r.makes[1]} × ${ITEMS[r.makes[0]].name}`); g.progress.addXp(8, 'craft'); return true;
  }
  // ---------------------------------------------------------------- interactions
  hook(push, eye, f) {
    const g = this.g, P = g.player;
    for (const s of this.stuck) { if (Math.abs(s.x - eye[0]) > 3 || Math.abs(s.z - eye[2]) > 3) continue; push(s.x, s.y, s.z, 2.4, 'Retrieve knife', () => { s.taken = true; P.inv.add('knife', 1); g.sfx.coin?.(); }, 'prop', 0.8, s); }
    for (const n of g.npcs) {
      if (n.dead || Math.abs(n.x - eye[0]) > 2.4 || Math.abs(n.z - eye[2]) > 2.4) continue;
      if (n.pockets.length && !n.lying && (n.state === 'routine') && n.alert < 0.5 && !n.sees && n.role !== 'hollow' && n.role !== 'bandit') {
        const dx = P.pos[0] - n.x, dz = P.pos[2] - n.z, d = hyp(dx, dz), back = (dx * n.fwd[0] + dz * n.fwd[1]) / (d || 1);
        if (d < 1.9 && back < -0.1 && (P.crouch || P.speedNow < 1.2)) push(n.x, n.y + 1.2, n.z, 1.9, 'Pickpocket (hold E)', () => this.pickpocket(n), 'pick', 0.7, n);
      }
      if (n.state === 'ko' && n.pockets.length) push(n.x, n.y + 0.3, n.z, 2.2, `Rifle ${n.name.toLowerCase()}'s pockets`, () => this.rifle(n), 'body', 0.6, n);
    }
  }
  rifle(n) { const g = this.g; for (const [id, c] of n.pockets) { g.player.inv.add(id, c); g.toast(id === 'gold' ? `+${c} gold` : `Took ${ITEMS[id]?.name}`); } n.pockets = []; g.sfx.coin?.(); g.rep.crime('theft', n.pos, { victim: n, range: 14 }); }
  pickpocket(n) {
    const g = this.g, P = g.player, nim = P.mod?.nimble || 0;
    const need = Math.max(0.7, 1.7 - 0.25 * nim);
    P.startPicking(n, 1, () => {
      const take = n.pockets; n.pockets = []; let gold = 0;
      for (const [id, c] of take) { const cc = id === 'gold' ? Math.round(c * (1 + 0.3 * nim) * (P.mod?.gold || 1)) : c; P.inv.add(id, cc); if (id === 'gold') gold += cc; else g.toast(`Took ${ITEMS[id]?.name}`); }
      g.toast(gold ? `Lifted ${gold} gold` : 'Pockets emptied'); g.sfx.coin?.(); g.progress.addXp(6, 'pickpocket'); g.stats.pick = (g.stats.pick || 0) + 1;
    }, 'Picking a pocket', { free: true, need, watch: (dt) => {
      if (n.dead || n.state !== 'routine' || n.alert > 0.55) { this.caught(n); return false; }
      if (n.dist > 2.4) return false;
      // they turn round now and then
      n.pickRisk = (n.pickRisk || 0) + dt * (0.32 - 0.07 * nim) * (P.crouch ? 0.7 : 1) * (g.lightAt(n.x, 1, n.z) + 0.4);
      if (n.pickRisk > 1 || (n.pickRisk > 0.6 && Math.random() < dt * 0.6)) { this.caught(n); n.pickRisk = 0; return false; }
      return true;
    } });
  }
  caught(n) {
    const g = this.g; if (n.dead || n.state === 'ko') return;
    n.bark('Thief! My purse!', n.spec.voice); n.alert = 1; g.rep.crime('theft', n.pos, { victim: null, range: 16 }); if (n.guard) { n.lastSeen = [...g.player.pos]; n.spotted(); } else n.scare(g.player.pos, 10);
  }
}
