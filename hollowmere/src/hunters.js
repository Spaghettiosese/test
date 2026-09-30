// Bounty hunters: leave a big price on your head and let it stand, and paid killers start
// tracking you along the roads.
import { NPC } from './npc.js';
import { guardSpec } from './roster.js';

export class Hunters {
  constructor(g) { this.g = g; this.t = 10; this.cool = 0; this.seq = 0; }
  update(dt) {
    this.cool -= dt; this.t -= dt; if (this.t > 0 || this.cool > 0) return; this.t = 3;
    const g = this.g, z = g.story.zone; if (g.mode !== 'play' || ['town', 'graveyard', 'court', 'hall', 'ante', 'study', 'chamber', 'crypt', 'undercroft', 'backyard'].includes(z)) return;
    const b = Math.max(g.rep.total('watch'), g.rep.total('keep')); if (b < 150) return;
    this.cool = 260; this.spawn();
  }
  spawn() {
    const g = this.g, P = g.player, f = P.flat, out = [];
    g.ui.flashBanner('BOUNTY HUNTERS', 1800, true); g.sfx.hornShort?.();
    for (let i = 0; i < 2; i++) {
      const a = (i ? 0.6 : -0.6), x = P.pos[0] - f[0] * 34 * Math.cos(a) - f[1] * 34 * Math.sin(a), z = P.pos[2] - f[1] * 34 * Math.cos(a) + f[0] * 34 * Math.sin(a);
      const q = g.nav.nearestWalkable(x, z, 10); if (!q) continue;
      const spec = guardSpec({ tabard: '#1a1a22', hair: 'black', weapon: i ? 'crossbow' : 'captain', build: 1.08, beard: 'short' });
      const n = new NPC(g, { id: 'hunter_' + (++this.seq), name: 'Bounty Hunter', role: 'guard', faction: 'hunters', hostile: true, pos: q, yaw: 0, hp: 95, dmg: 1.25, block: 0.35, eyes: 1.3, weapon: spec.weapon, loot: [['gold', 60 + Math.floor(Math.random() * 60)], Math.random() < 0.5 ? ['chainvest', 1] : ['ironcap', 1]], detail: 0.4, schedule: [{ h0: 0, h1: 24, wander: 'ws_', act: 'wander' }], spec });
      g.npcs.push(n); n.state = 'chase'; n.alert = 1; n.lastSeen = [...P.pos]; n.tactic = i ? 'archer' : 'engage'; n.bark('The bounty is mine.'); out.push(n);
    }
  }
}
