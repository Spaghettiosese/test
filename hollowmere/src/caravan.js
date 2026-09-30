// Vesna's caravan: a travelling merchant that camps somewhere different every few days. She
// sells things nobody else does (treasure maps, a shovel, fine gear), her guards mean it, and
// the wagon is worth robbing if you can get to it unseen. Her camp rotates while the player is
// elsewhere; ask around, or follow the smoke.
import * as E from '../../engine/index.js';
import { buildHorseModel, poseHorse } from './horse.js';
import { GEAR } from './gear.js';
import { ITEMS } from './items.js';

const hyp = Math.hypot;
const D2R = Math.PI / 180;
// candidate camps: open ground beside the roads of the duchy
const CANDIDATES = [
  [9, -70, 'the Old Road, north of the camp'], [58, -150, 'the lane to Tolliver Farm'], [-26, -150, 'the Blackfen turning'], [112, -128, 'the road to Pellmouth'],
  [120, 14, 'the Cinderwick road'], [-70, -92, 'the west trail'], [-60, 60, 'the walls of Ashgate, west side'], [10, -196, 'the approach to Greywater Bridge'],
];
const GEAR_POOL = ['nightcloak', 'chainvest', 'softboots', 'mendring', 'signet', 'raven', 'sainttear', 'huntershood', 'embering', 'wolftooth', 'hidecloak'];

export class Caravan {
  constructor(g) {
    this.g = g; g.reg?.('caravan', this);
    const nav = g.nav, L = g.level;
    this.sites = [];
    for (const [x, z, name] of CANDIDATES) {
      const w = nav.nearestWalkable(x, z, 12); if (!w || nav.indoorAt(w[0], w[1])) continue;
      let blocked = 0; for (let dz = -6; dz <= 6; dz += 2) for (let dx = -6; dx <= 6; dx += 2) if (nav.isBlocked(w[0] + dx, w[1] + dz)) blocked++;
      if (blocked <= 5) this.sites.push({ x: w[0], z: w[1], name, yaw: ((this.sites.length * 90) + 90) % 360 });
    }
    if (!this.sites.length) { const s = L.caravanSeed || [9, -70]; this.sites.push({ x: s[0], z: s[1], name: 'the Old Road', yaw: 90 }); }
    this.site = 0; this.movedDay = -1; this.known = false; this.looted = false; this.stockDay = -1; this.stock = []; this.sold = new Set(); this.t = 0; this.phase = 0;
    this.build();
    this.moveTo(this.pickFor(0), true);
  }
  // ------------------------------------------------------------ the wagon, its horses, fire, bedrolls
  build() {
    const g = this.g, pal = g.level.pal, k = new E.Kit(pal);
    k.box(pal.plank, [0, 0.95, 0], [1.9, 0.15, 3.6]);
    for (const s of [-1, 1]) k.box(pal.plank, [s * 0.93, 1.35, 0], [0.1, 0.7, 3.6]);
    k.box(pal.plank, [0, 1.35, 1.75], [1.9, 0.7, 0.1]); k.box(pal.plank, [0, 1.35, -1.75], [1.9, 0.7, 0.1]);
    for (const [wx, wz] of [[-1.05, -1.1], [1.05, -1.1], [-1.05, 1.1], [1.05, 1.1]]) k.cyl(pal.timber, [wx, 0.55, wz], 0.55, 0.12, [0, 0, 90], 12);
    k.box(pal.canvasDirty, [0, 2.45, 0], [1.3, 0.06, 3.3]); for (const s of [-1, 1]) k.box(pal.canvasDirty, [s * 0.78, 2.12, 0], [0.9, 0.06, 3.3], [0, 0, s * -36]);
    for (const z of [-1.5, 0, 1.5]) for (const s of [-1, 1]) k.box(pal.timber, [s * 0.9, 1.9, z], [0.06, 1.0, 0.06]);
    k.box(pal.plank, [0.3, 1.4, -0.5], [0.6, 0.5, 0.6]); k.box(pal.pottery, [-0.4, 1.3, 0.3], [0.4, 0.4, 0.4]); k.box(pal.linen, [-0.3, 1.25, -1.0], [0.6, 0.35, 0.5]);
    k.box(pal.timber, [0, 0.72, 2.7], [0.12, 0.12, 2.2]);
    this.wagon = k.toNode('Caravan wagon'); this.wagon.traverse?.((n) => { if (n.castShadow !== undefined) n.castShadow = true; });
    g.scene.add(this.wagon);
    this.horses = [buildHorseModel('#7a4a2a', '#2a1a10', false), buildHorseModel('#4a3a32', '#16100c', false)];
    for (const h of this.horses) g.scene.add(h.node);
    const M = (c) => new E.Material({ name: 'Roll', color: c, roughness: 1 });
    this.rolls = [M('#6a5a48'), M('#5a4a3a')].map((m, i) => { const r = new E.Mesh(E.box({ width: 0.8, height: 0.09, depth: 2.0 }), m, 'bedroll'); r.castShadow = false; g.scene.add(r); return r; });
    const light = new E.Light('point', { color: '#ffa25e', intensity: 9, range: 14, flicker: 0.6 }); g.scene.add(light);
    this.fire = { x: 0, y: 0, z: 0, r: 0.45, light, base: 9, lit: true, phase: 0, kind: 'camp', indoor: 0 };
    g.level.fires.push(this.fire); g.level.lights.push(light);
    this.lantern = new E.Light('point', { color: '#ffc488', intensity: 5, range: 8, flicker: 0.3 }); g.scene.add(this.lantern);
    const logs = new E.Node('Camp logs'); const lm = new E.Material({ name: 'Logs', color: '#2c2420', roughness: 1 });
    for (let i = 0; i < 4; i++) { const l = new E.Mesh(E.cylinder({ radiusTop: 0.06, radiusBottom: 0.06, height: 0.8, radialSegments: 6 }), lm, 'log'); l.castShadow = false; l.position.set([0, 0.14, 0]); l.setEuler(90, i * 45, 0); logs.add(l); }
    const stones = new E.Mesh(E.cylinder({ radiusTop: 0.52, radiusBottom: 0.6, height: 0.16, radialSegments: 9 }), new E.Material({ name: 'Ring', color: '#3a3640', roughness: 1 }), 'ring'); stones.position.set([0, 0.05, 0]); stones.castShadow = false; logs.add(stones);
    this.logs = logs; g.scene.add(logs);
    this.body = null;
  }
  // world position of a spot given in the wagon's own frame (x to its right, z along its length)
  at(dx, dz, s = this.site0) {
    const a = s.yaw * D2R, c = Math.cos(a), sn = Math.sin(a);
    return [s.x + dx * c + dz * sn, s.z - dx * sn + dz * c];
  }
  pickFor(day) { const n = this.sites.length, stride = [3, 5, 2, 1].find((k) => n % k !== 0) || 1; return this.sites[(Math.floor(Math.floor(day) / 2) * stride) % n]; }
  moveTo(s, instant = false) {
    const g = this.g, nav = g.nav, pois = g.level.pois; this.site0 = s; this.site = this.sites.indexOf(s);
    if (this.body) { g.world.remove(this.body); this.body = null; }
    if (this.blockRect) nav.clear(...this.blockRect);
    const wp = this.at(0, 0), a = s.yaw * D2R;
    this.wagon.position.set([wp[0], nav.floorAt(wp[0], wp[1]), wp[1]]); E.quat.fromEuler(this.wagon.rotation, 0, s.yaw, 0);
    const horizontal = Math.round(s.yaw / 90) % 2 === 1, half = horizontal ? [1.9, 0.9, 1.0] : [1.0, 0.9, 1.9];
    this.body = new E.Body({ shape: new E.Box(half), type: 'static', position: [wp[0], 0.9, wp[1]], friction: 0.7 }); this.body.userData.kind = 'wood'; g.world.add(this.body);
    this.blockRect = [wp[0] - half[0], wp[1] - half[2], wp[0] + half[0], wp[1] + half[2]]; nav.block(...this.blockRect, 1);
    this.horses.forEach((h, i) => { const p = this.at(i ? 0.55 : -0.55, 4.5); h.node.position.set([p[0], nav.floorAt(p[0], p[1]), p[1]]); E.quat.fromEuler(h.node.rotation, 0, s.yaw + (i ? 6 : -6), 0); h.ph = i * 1.7; });
    const fp = this.at(4.8, -0.6); this.fire.x = fp[0]; this.fire.z = fp[1]; this.fire.y = nav.floorAt(fp[0], fp[1]); this.fire.light.position.set([fp[0], this.fire.y + 0.7, fp[1]]); this.logs.position.set([fp[0], this.fire.y, fp[1]]);
    const lp = this.at(0.95, 1.9); this.lantern.position.set([lp[0], 2.2, lp[1]]);
    const toward = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) / D2R;
    const set = (name, dx, dz, face, type = 'stand') => { const p = this.at(dx, dz), o = pois[name]; if (!o) return; o.x = p[0]; o.z = p[1]; o.y = nav.floorAt(p[0], p[1]); o.yaw = face ? toward(p, face) : o.yaw; o.type = type; const r = type === 'stand' ? 0 : 0.9; o.approach = [p[0] + Math.sin(o.yaw * D2R) * r, p[1] + Math.cos(o.yaw * D2R) * r]; delete o.walk; };
    set('caravan_m', 3.3, 0.5, this.at(0, 0)); set('caravan_g1', 3.6, 3.6, fp); set('caravan_g2', -3.4, -2.8, this.at(0, 0));
    const bm = this.at(2.6, -3.4), bg = this.at(-2.6, 1.4);
    set('caravan_bed_m', 2.6, -3.4, null, 'sleep'); set('caravan_bed_g', -2.6, 1.4, null, 'sleep'); pois.caravan_bed_m.yaw = s.yaw; pois.caravan_bed_g.yaw = s.yaw; pois.caravan_bed_m.approach = [bm[0], bm[1]]; pois.caravan_bed_g.approach = [bg[0], bg[1]];
    [bm, bg].forEach((p, i) => { const r = this.rolls[i]; r.position.set([p[0], nav.floorAt(p[0], p[1]) + 0.05, p[1]]); E.quat.fromEuler(r.rotation, 0, s.yaw, 0); });
    this.looted = false; this.restock();
    if (!instant) for (const n of g.npcs) if (n.id === 'vesna' || n.id === 'cg1' || n.id === 'cg2') { if (n.dead) continue; n.leaveActivity(); n.lying = false; n.asleep = false; n.slotKey = ''; n.state = 'routine'; n.stopMove(); n.snapToSchedule(); }
  }
  // ------------------------------------------------------------ stock, rotating with the day
  restock() {
    const day = Math.floor(this.g.clock.day || 0); this.stockDay = day; this.sold.clear();
    const rnd = E.rng(9000 + day * 31 + this.site * 7), pick = (arr, n) => { const a = [...arr], o = []; while (o.length < n && a.length) o.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return o; };
    const st = [];
    st.push({ id: 'map', label: 'Tattered treasure map', price: 95, map: true });
    st.push({ id: 'shovel', label: 'Shovel', price: 24 });
    for (const id of pick(GEAR_POOL, 2)) st.push({ id, label: GEAR[id].name, price: Math.round(GEAR[id].value * 1.25) });
    const cons = pick([['potion', 'Red Salve', 26], ['smoke', 'Smoke bomb', 28, 2], ['firebomb', 'Fire flask', 32, 2], ['poison', 'Nightshade oil', 26, 2], ['d_ghost', 'Draught of Ghostwalk', 54], ['d_haste', 'Draught of Haste', 48], ['knife', 'Throwing knives ×4', 22, 4], ['oats', 'Oats ×3', 12, 3]], 2);
    for (const [id, label, price, n = 1] of cons) st.push({ id, label, price, n });
    this.stock = st;
  }
  buy(i) {
    const g = this.g, inv = g.player.inv, s = this.stock[i]; if (!s) return;
    if (this.sold.has(i)) { g.toast('Sold out'); g.sfx.deny?.(); return; }
    const price = Math.ceil(s.price * (g.story.priceMul?.() ?? 1)); if (inv.gold < price) { g.toast('Not enough gold'); g.sfx.deny?.(); return; }
    if (s.map) { if (!g.treasure?.giveMap()) { g.toast('Vesna has no more maps to sell you'); return; } }
    else if (GEAR[s.id] && inv.has(s.id)) { g.toast('You already carry one'); return; }
    else inv.add(s.id, s.n || 1);
    inv.gold -= price; if (GEAR[s.id] || s.map) this.sold.add(i); g.sfx.coin?.(); g.toast(`Bought ${s.label} for ${price}`); g.stats.caravanBuys = (g.stats.caravanBuys || 0) + 1;
  }
  rumor() { return this.known ? `Vesna's caravan is camped by ${this.site0.name} today.` : 'A travelling caravan is said to camp along the roads, selling maps and fine things.'; }
  // ------------------------------------------------------------ robbing the wagon
  hook(push, eye) {
    const g = this.g, w = this.at(0, 0), f = this.fire;
    if (hyp(f.x - eye[0], f.z - eye[2]) < 3.4 && g.time - (this.warmAt ?? -99) > 90) push(f.x, 0.6, f.z, 3.4, 'Warm yourself at the campfire', () => { this.warmAt = g.time; const P = g.player; P.hp = Math.min(P.maxHp, P.hp + 25); P.ember = Math.min(P.maxEmber, P.ember + 15); g.toast('The caravan fire warms you'); g.sfx.drink?.(); }, 'fire', 0.5, f);
    if (this.looted || hyp(w[0] - eye[0], w[1] - eye[2]) > 4.4) return;
    push(w[0], 1.5, w[1], 4.4, 'Rifle the wagon (hold E)', () => this.rifle(), 'prop', 0.6, this);
  }
  rifle() {
    const g = this.g, P = g.player, w = this.at(0, 0);
    P.startPicking(this, 1, () => {
      this.looted = true; const gold = 60 + Math.floor(Math.random() * 90); P.inv.add('gold', gold); const pool = ['gem', 'ring', 'cloth', 'wine', 'nightbloom', 'book', 'potion', 'locket'];
      const got = [pool[Math.floor(Math.random() * pool.length)], pool[Math.floor(Math.random() * pool.length)]]; for (const id of got) P.inv.add(id, 1);
      g.toast(`Took ${gold} gold, ${ITEMS[got[0]].name}, ${ITEMS[got[1]].name}`); g.sfx.coin?.(); g.stats.wagonsRobbed = (g.stats.wagonsRobbed || 0) + 1;
      g.rep.crime('theft', [w[0], 0, w[1]], { range: 18 });
    }, 'Rifling the wagon', { free: true, need: 3.6, watch: (dt) => {
      for (const n of g.npcs) if (!n.dead && (n.id === 'vesna' || n.id === 'cg1' || n.id === 'cg2') && n.state !== 'ko' && !n.lying && n.dist < 14 && n.alert > 0.5) return false;
      return P.speedNow < 0.6;
    } });
  }
  // ------------------------------------------------------------ frame
  update(dt) {
    const g = this.g, P = g.player; if (!P?.pos) return; this.t += dt;
    const hours = g.clock.hours, day = Math.floor(g.clock.day || 0);
    // at dawn the caravan packs up and moves, if nobody is there to watch it happen
    if (hours >= 4.5 && hours < 6.8 && this.movedDay !== day) {
      const next = this.pickFor(day), d0 = hyp(this.site0.x - P.pos[0], this.site0.z - P.pos[2]), d1 = hyp(next.x - P.pos[0], next.z - P.pos[2]);
      if (next === this.site0) this.movedDay = day; else if (d0 > 70 && d1 > 70) { this.movedDay = day; this.moveTo(next); }
    } else if (hours >= 6.8 && this.movedDay !== day) this.movedDay = day;
    if (this.stockDay !== day && hours >= 6) this.restock();
    const d = hyp(this.site0.x - P.pos[0], this.site0.z - P.pos[2]);
    if (!this.known && d < 45 && !g.clock.night) { this.known = true; g.flashText("VESNA'S CARAVAN"); g.toast('A travelling caravan. It moves on every couple of days; ask around.'); g.progress.addXp(15, 'found the caravan'); }
    if (d < 100) {
      this.phase += dt; this.horses.forEach((h, i) => { poseHorse(h, this.t + i, 0, 0, Math.sin(this.t * 0.25 + i * 2) > 0.2 ? 1 : 0); });
      this.lantern.intensity = g.clock.night || g.weather.cur.rain > 0.5 ? 5 : 0;
    }
  }
  marks() { return this.known ? [{ x: this.site0.x, z: this.site0.z, shape: 'wagon', label: "Vesna's caravan" }] : []; }
  save() { return { known: this.known, site: this.site, movedDay: this.movedDay, sold: [...this.sold], looted: this.looted }; }
  load(d) { if (!d) return; this.known = !!d.known; this.movedDay = d.movedDay ?? -1; const s = this.sites[d.site]; if (s && s !== this.site0) this.moveTo(s, false); this.sold = new Set(d.sold || []); this.looted = !!d.looted; }
}
