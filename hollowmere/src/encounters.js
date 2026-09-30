// Roadside encounters: out in the wilds something is happening, and it is yours to join or
// walk past. A merchant being robbed, a lost pilgrim who needs an escort to Ashgate's chapel,
// a wounded watchman who needs a salve, a toll gang that would rather be paid than fight, and
// at night a pack of hollows clawing up out of the dirt.
import { NPC } from './npc.js';
import { villager, guardSpec } from './roster.js';
import { banditSpec } from './roster_wilds.js';
import { regionAt } from './level/wilds.js';

const hyp = Math.hypot;
const WILD = ['road', 'farms', 'mire', 'cinder', 'fen', 'bridge'];

export class Encounters {
  constructor(g) { this.g = g; g.reg?.('encounters', this); this.cool = 140; this.cur = null; this.total = 0; this.seq = 0; this.done = {}; }
  // ------------------------------------------------------------ helpers
  spot(dist, spread = 0.6) {
    const g = this.g, P = g.player, f = P.flat, nav = g.nav;
    for (let i = 0; i < 10; i++) {
      const a = (Math.random() - 0.5) * spread * 2, c = Math.cos(a), s = Math.sin(a), d = dist + Math.random() * 14;
      const x = P.pos[0] + (f[0] * c - f[1] * s) * d, z = P.pos[2] + (f[1] * c + f[0] * s) * d;
      const w = nav.nearestWalkable(x, z, 6); if (!w || nav.indoorAt(w[0], w[1])) continue;
      const rg = regionAt(w[0], w[1]); if (!rg || !WILD.includes(rg.id) || hyp(w[0] - 13, w[1] + 34) < 22 || g.caravan && hyp(w[0] - g.caravan.site0.x, w[1] - g.caravan.site0.z) < 25) continue;
      let blocked = 0; for (let dz = -3; dz <= 3; dz += 1.5) for (let dx = -3; dx <= 3; dx += 1.5) if (nav.isBlocked(w[0] + dx, w[1] + dz)) blocked++;
      if (blocked <= 4) return w;
    }
    return null;
  }
  poi(x, z, yaw = 0) { const name = 'enc_' + (++this.seq); this.g.level.pois[name] = { name, x, z, y: this.g.nav.floorAt(x, z), yaw, type: 'stand', approach: [x, z] }; return name; }
  make(o) {
    const g = this.g, poi = this.poi(o.pos[0], o.pos[1], o.yaw || 0);
    const n = new NPC(g, { id: o.id + '_' + (++this.seq), name: o.name, role: o.role || 'villager', hostile: !!o.hostile, pos: o.pos, yaw: o.yaw || 0, hp: o.hp || 40, dmg: o.dmg || 1, block: o.block ?? 0.2, eyes: 1, weapon: o.weapon, loot: o.loot || [], detail: 0.5, dialogue: o.dialogue, faction: o.faction, schedule: [{ h0: 0, h1: 24, poi, act: o.act || 'stand' }], spec: o.spec });
    g.npcs.push(n); this.total++; n.snapToSchedule(); n.enc = true; return n;
  }
  pick() {
    const g = this.g, night = g.clock.night, r = Math.random();
    if (night && r < 0.35) return 'hollows';
    return ['robbery', 'pilgrim', 'wounded', 'toll'][Math.floor(Math.random() * 4)];
  }
  // ------------------------------------------------------------ the frame
  // people are built one per frame so the road never hitches
  later(fns) { this.q = fns; this.qT = 0; }
  update(dt) {
    const g = this.g; if (g.mode !== 'play') return;
    if (this.q?.length) { this.qT -= dt; if (this.qT <= 0) { this.q.shift()(); this.qT = 0.12; if (!this.q.length) { this.q = null; if (this.cur) this.cur.ready = true; } } return; }
    if (this.cur) return this.tick(dt);
    this.cool -= dt; if (this.cool > 0) return;
    const P = g.player, z = g.story.zone;
    if (!WILD.includes(z) || P.dead || P.mount?.gait >= 2 || g.combatT > 0 || g.alarmLevel > 0.3 || this.total > 40 || g.nav.indoorAt(P.pos[0], P.pos[2])) { this.cool = 12; return; }
    this.cool = 100 + Math.random() * 120;
    this['start_' + this.pick()]?.();
  }
  end(ok) { const c = this.cur; if (!c) return; this.cur = null; this.cool = Math.max(this.cool, 80); if (ok) { this.done[c.type] = (this.done[c.type] || 0) + 1; this.g.stats.encounters = (this.g.stats.encounters || 0) + 1; } }
  tick(dt) {
    const g = this.g, c = this.cur, P = g.player.pos; if (c.ready === false) return; c.t += dt;
    const alive = (n) => n && !n.dead;
    const far = c.anchor ? hyp(P[0] - c.anchor[0], P[2] - c.anchor[1]) : 0;
    if (c.type === 'robbery') {
      const bs = c.bandits.filter(alive);
      if (!c.won && !alive(c.victim)) { g.toast('The merchant is dead.'); this.end(false); return; }
      if (!c.won && !bs.length) { c.won = true; c.victim.state = 'routine'; c.victim.slotKey = ''; c.victim.bark('Bless you, stranger! Take this.'); this.reward(c.victim, 70 + Math.floor(Math.random() * 60), ['wine', 'cloth', 'gem', 'potion'][Math.floor(Math.random() * 4)], 50); setTimeout(() => this.end(true), 4000); }
      if (!c.won && (bs.some((b) => b.state === 'chase' || b.state === 'attack')) && c.victim.state === 'handsup') { c.victim.state = 'cower'; c.victim.cowerT = 14; }
    } else if (c.type === 'pilgrim') {
      const p = c.pilgrim;
      if (!alive(p)) { g.toast('The pilgrim is dead.'); this.end(false); return; }
      if (c.escort) {
        if (p.state !== 'follow') { p.state = 'follow'; p.repathT = 0; }
        if (hyp(p.x - 0, p.z - 14) < 11) { // Ashgate's gate
          p.state = 'routine'; p.stopMove(); const name = this.poi(p.x, p.z, p.yaw); p.schedule = [{ h0: 0, h1: 24, poi: name, act: 'stand' }]; p.slotKey = ''; p.dialogue = 'pilgrimdone';
          p.bark('Ashgate! Bless you.'); this.reward(p, 90, 'nightbloom', 70); g.status.add('bless'); this.end(true); return;
        }
        if (c.t - c.escortAt > 720) { g.toast('The pilgrim gave up waiting and wandered off.'); p.state = 'routine'; this.end(false); return; }
        if (hyp(p.x - P[0], p.z - P[2]) > 55 && c.t - c.escortAt > 10) { g.toast('You lost the pilgrim on the road.'); p.state = 'routine'; p.slotKey = ''; this.end(false); return; }
      } else if (far > 150) this.end(false);
    } else if (c.type === 'wounded') {
      if (!alive(c.soldier)) { this.end(false); return; }
      if (!c.healed && c.soldier.state !== 'handsup') c.soldier.state = 'handsup';
      if (far > 150 || c.healed && c.t > c.healedAt + 6) this.end(!!c.healed);
    } else if (c.type === 'toll') {
      const bs = c.bandits.filter(alive);
      if (c.paid) { if (far > 40) this.end(true); return; }
      if (!bs.length) { this.end(true); return; }
      if (!c.hostile && bs.some((b) => b.hp < b.maxHp || b.state === 'chase' || b.state === 'attack')) this.turnHostile();
      if (far > 160) this.end(false);
    } else if (c.type === 'hollows') {
      if (!c.hol.some(alive) || far > 140) this.end(c.hol.every((n) => !alive(n)));
    }
    if (c.t > 900) this.end(false);
  }
  reward(n, gold, item, xp) { const g = this.g, inv = g.player.inv; inv.add('gold', gold); if (item) inv.add(item, 1); g.sfx.coin?.(); g.toast(`${gold} gold${item ? ' and a gift' : ''}`); g.progress.addXp(xp, 'good deed'); const b = g.rep.bounty; if (b.watch > 0) b.watch = Math.max(0, b.watch - 30); void n; }
  // ------------------------------------------------------------ the five encounters
  start_robbery() {
    const g = this.g, w = this.spot(58); if (!w) return;
    const c = this.cur = { type: 'robbery', t: 0, victim: null, bandits: [], anchor: [w[0], w[1]], ready: false };
    this.later([
      () => { const v = this.make({ id: 'enc_merchant', name: 'Robbed Merchant', pos: [w[0], w[1]], yaw: 90, hp: 30, dialogue: 'encmerchant', spec: villager({ cloth: '#5a4a6a', cloth2: '#c8b890', hair: 'grey', beard: 'short', cap: true }), loot: [['gold', 12]] }); v.state = 'handsup'; v.setAnim?.('Hands Up', 0.1); c.victim = v; setTimeout(() => { if (!v.dead) v.bark('Help! Somebody, please!'); }, 1500); },
      ...[0, 1].map((i) => () => { const a = i ? 2.2 : -0.9, x = w[0] + Math.sin(a) * 2.6, z = w[1] + Math.cos(a) * 2.6, q = g.nav.nearestWalkable(x, z, 2) || w; const b = this.make({ id: 'enc_thug', name: 'Highwayman', role: 'bandit', hostile: true, pos: [q[0], q[1]], yaw: (a + Math.PI) / (Math.PI / 180), hp: 55, dmg: 0.95, weapon: ['sword', 'mace'][i], spec: banditSpec({ hair: ['black', 'red'][i], weapon: ['sword', 'mace'][i], hood: true }), loot: [['gold', 10 + Math.floor(Math.random() * 15)]], act: 'guard' }); b.tactic = i ? 'flank' : 'engage'; c.bandits.push(b); }),
    ]);
    g.toast('Shouting, up the road. Someone is being robbed.'); g.sfx.hornShort?.();
  }
  start_pilgrim() {
    const g = this.g, w = this.spot(50, 0.9); if (!w) return;
    const c = this.cur = { type: 'pilgrim', t: 0, pilgrim: null, anchor: [w[0], w[1]], escort: false, escortAt: 0, ready: false };
    this.later([() => { c.pilgrim = this.make({ id: 'enc_pilgrim', name: 'Lost Pilgrim', pos: [w[0], w[1]], yaw: 0, hp: 28, dialogue: 'pilgrim', spec: villager({ cloth: '#5a5048', cloth2: '#8a8070', hair: 'white', beard: 'long', hood: true, height: 0.97 }), loot: [['gold', 4], ['bread', 1]] }); }]);
    g.toast('A traveller stands alone on the road, lost.');
  }
  acceptEscort() { const c = this.cur; if (!c || c.type !== 'pilgrim' || c.escort || !c.pilgrim) return; c.escort = true; c.escortAt = c.t; c.pilgrim.state = 'follow'; c.pilgrim.leaveActivity?.(); c.pilgrim.repathT = 0; this.g.toast("Escort the pilgrim to Ashgate's gate. Keep him alive."); this.g.ui.flashBanner('ESCORT', 1600, true); }
  start_wounded() {
    const g = this.g, w = this.spot(48, 0.9); if (!w) return;
    const c = this.cur = { type: 'wounded', t: 0, soldier: null, anchor: [w[0], w[1]], healed: false, ready: false };
    this.later([() => { const s = this.make({ id: 'enc_soldier', name: 'Wounded Watchman', role: 'guard', faction: 'watch', pos: [w[0], w[1]], yaw: 200, hp: 10, dialogue: 'soldier', spec: guardSpec({ hair: 'blond', beard: 'short' }), loot: [['gold', 18], ['knife', 1]] }); s.peaceful = true; s.state = 'handsup'; s.hp = 10; s.maxHp = 60; s.alert = 0; c.soldier = s; }]);
    g.toast('A watchman is slumped against a stump, bleeding.');
  }
  heal() { const c = this.cur, g = this.g, P = g.player; if (!c || c.type !== 'wounded' || c.healed || !c.soldier) return; if (!P.inv.remove('potion', 1)) { g.toast('You have no Red Salve to give'); g.sfx.deny?.(); return; } c.healed = true; c.healedAt = c.t; c.soldier.hp = c.soldier.maxHp; c.soldier.state = 'routine'; c.soldier.slotKey = ''; c.soldier.bark('You saved my life. I will not forget it.'); g.sfx.drink?.(); const b = g.rep.bounty; const cut = Math.min(b.watch, 90); b.watch -= cut; this.reward(c.soldier, 35, 'watchhelm', 55); if (cut) g.toast(`The watchman vouches for you: bounty -${Math.round(cut)}`); }
  start_toll() {
    const g = this.g, w = this.spot(54, 0.5); if (!w) return;
    const c = this.cur = { type: 'toll', t: 0, bandits: [], anchor: [w[0], w[1]], paid: false, hostile: false, ready: false };
    const mk = (i) => () => { const b = this.make({ id: 'enc_toll', name: i ? 'Toll Man' : 'Toll Captain', role: 'bandit', hostile: true, pos: [w[0] + (i ? 2.1 : 0), w[1] + (i ? 0.8 : 0)], yaw: 180, hp: i ? 55 : 80, dmg: 1, weapon: i ? 'mace' : 'captain', dialogue: i ? null : 'toll', spec: banditSpec({ hair: ['black', 'red', 'grey'][i + 1], weapon: i ? 'mace' : 'sword', beard: i ? null : 'long', hood: !!i }), loot: [['gold', 16 + i * 10]], act: 'guard' }); b.peaceful = true; c.bandits.push(b); };
    this.later([mk(0), mk(1)]);
    g.toast('A rope across the road, and men who want to talk about it.');
  }
  payToll() { const c = this.cur, g = this.g; if (!c || c.type !== 'toll') return false; if (g.player.inv.gold < 25) { g.toast('You cannot pay 25 gold'); g.sfx.deny?.(); return false; } g.player.inv.gold -= 25; c.paid = true; for (const b of c.bandits) { b.peaceful = true; b.dialogue = null; b.talkable = false; b.bark('Pleasure. Mind the road.'); } g.sfx.coin?.(); return true; }
  turnHostile() { const c = this.cur, g = this.g; if (!c || c.hostile || c.paid) return; c.hostile = true; for (const b of c.bandits) { if (b.dead) continue; b.peaceful = false; b.talkable = false; b.state = 'chase'; b.alert = 1; b.lastSeen = [...g.player.pos]; b.tactic = 'engage'; b.leaveActivity?.(); } g.ui.flashBanner('TOLL DENIED', 1200, true); }
  start_hollows() {
    const g = this.g, w = this.spot(24, 0.9); if (!w) return;
    const hol = []; g.ui.flashBanner('THE GROUND STIRS', 1800, true); g.sfx.hollowCry?.([w[0], 0, w[1]]);
    for (let i = 0; i < 3; i++) setTimeout(() => { const q = g.nav.nearestWalkable(w[0] + (i - 1) * 3, w[1] + (i % 2) * 3, 4); if (q) hol.push(g.story.spawnHollow(q[0], q[1], true, false, i === 1 && Math.random() < 0.5 ? 'brute' : null)); }, 500 + i * 700);
    this.cur = { type: 'hollows', t: 0, hol, anchor: [w[0], w[1]] };
  }
  save() { return { done: this.done }; }
  load(d) { if (d) this.done = d.done || {}; }
}
