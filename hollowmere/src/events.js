// World events that make the nights different from each other: bandit ambushes on the road,
// the tolling that raises hollows at midnight, dawn calm, and rest at any bed.
import { NPC } from './npc.js';
import { banditSpec } from './roster_wilds.js';

const hyp = Math.hypot;
export class Events {
  constructor(g) { this.g = g; this.t = 2; this.ambushNight = -1; this.riseNight = -1; this.seq = 0; }
  update(dt) {
    this.updateFade(dt);
    this.t -= dt; if (this.t > 0) return; this.t = 1.5;
    const g = this.g; if (g.mode !== 'play') return;
    const P = g.player.pos, h = g.clock.hours, day = g.clock.day, zone = g.story.zone;
    // an ambush on the wild roads at night
    const wild = ['road', 'farms'].includes(zone) && P[2] < -20;
    if (g.clock.night && this.ambushNight !== day && (wild || zone === 'mire')) {
      if (Math.random() < 0.18 && !g.rep.disguise) this.ambush();
    }
    // midnight: the bell tolls thirteen and the ground gives up some of its sleepers
    if (h >= 0 && h < 0.5 && this.riseNight !== day && (zone === 'town' || zone === 'graveyard' || zone === 'cinder' || zone === 'stones' || zone === 'mine')) {
      this.riseNight = day; g.ui.flashBanner('THE BELL TOLLS THIRTEEN', 2600, true); g.sfx.bell?.(4);
      const near = zone === 'cinder' || zone === 'stones' || zone === 'mine' ? [[P[0] + 12, P[2] + 6], [P[0] - 10, P[2] + 10]] : [[-44, 74], [-36, 70], [-40, 78]];
      near.forEach(([x, z], i) => setTimeout(() => { const q = g.nav.nearestWalkable(x, z, 6); if (q) g.story.spawnHollow(q[0], q[1], true, false, i === 1 && Math.random() < 0.5 ? 'brute' : null); }, 1800 + i * 900));
    }
  }
  ambush() {
    const g = this.g, P = g.player, day = g.clock.day; this.ambushNight = day;
    const f = P.flat, out = [];
    g.ui.flashBanner('AMBUSH', 1400, true); g.sfx.hornShort?.();
    for (let i = 0; i < 3; i++) {
      const a = (i - 1) * 0.7, x = P.pos[0] + f[0] * 14 * Math.cos(a) - f[1] * 14 * Math.sin(a) * (i - 1), z = P.pos[2] + f[1] * 14 * Math.cos(a) + f[0] * 14 * Math.sin(a) * (i - 1);
      const q = g.nav.nearestWalkable(x, z, 6); if (!q) continue;
      const id = 'ambush_' + (++this.seq);
      const n = new NPC(g, { id, name: 'Highwayman', role: 'bandit', hostile: true, pos: q, yaw: 180, hp: 55, dmg: 0.95, block: 0.22, weapon: ['sword', 'mace', 'spear'][i], loot: [['gold', 8 + Math.floor(Math.random() * 14)]], detail: 0.4, schedule: [{ h0: 0, h1: 24, wander: 'ws_', act: 'wander' }], spec: banditSpec({ hair: ['black', 'brown', 'red'][i], weapon: ['sword', 'mace', 'spear'][i], hood: true }) });
      g.npcs.push(n); n.state = 'chase'; n.alert = 1; n.lastSeen = [...P.pos]; n.tactic = i === 0 ? 'engage' : i === 1 ? 'flank' : 'circle'; n.bark('Your purse or your life!'); out.push(n);
    }
    g.combatT = 8;
  }
  // ---------------------------------------------------------------- resting
  sleepMenu(bed) {
    const g = this.g, owner = g.npcs.find((n) => n.poi === bed && !n.dead);
    if (g.npcs.some((n) => n.guard && !n.dead && (n.state === 'chase' || n.state === 'attack') && n.dist < 40)) { g.ui.toast('You cannot rest while hunted'); return; }
    const lines = [{ text: 'A bed. You could lose a few hours. The world will not wait, but it will not notice.', choices: [
      { text: 'Rest until dawn (06:30)', next: 'end', action: (G) => G.events.rest(6.5) },
      { text: 'Rest until dusk (19:00)', next: 'end', action: (G) => G.events.rest(19) },
      { text: 'Wait an hour', next: 'end', action: (G) => G.events.rest((G.clock.hours + 1) % 24) },
      { text: 'Not now.', next: 'end' }] }];
    g.ui.dialogue({ lines, name: 'Bed', spec: { outfit: 'peasant' } }); void owner;
  }
  rest(toHour) {
    const g = this.g, P = g.player; g.pix.fade = 1;
    g.clock.hours = toHour; if (toHour < 8) g.clock.day++;
    P.hp = Math.min(P.maxHp, P.hp + (P.maxHp - P.hp) * 0.7 + 10); P.ember = P.maxEmber; P.stamina = 100;
    for (const n of g.npcs) if (!n.dead && n.state !== 'ko' && !n.dormant && n.role !== 'hollow') { if (n.state === 'chase' || n.state === 'attack' || n.state === 'search') { n.state = 'routine'; n.alert = 0; } n.slotKey = ''; n.snapToSchedule?.(); }
    g.alarmLevel = 0; g.combatT = 0; g.weather.next = Math.min(g.weather.next, 30);
    g.hideout?.onRest(); g.stats.rests = (g.stats.rests || 0) + 1; g.ui.toast('You rest. Time passes.'); g.saves?.save('rest');
    this.fade = 1.2;
  }
  updateFade(dt) { if (this.fade > 0) { this.fade -= dt * 1.4; this.g.pix.fade = Math.max(0, this.fade); } }
}
