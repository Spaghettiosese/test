// Town lockdown: when the alarm climbs high inside Ashgate the gates are barred, the bells ring
// and everyone who is not a guard runs for home. Lifts when things calm down.
const TOWN = ['town', 'graveyard', 'court'];
export class Lockdown {
  constructor(g) { this.g = g; this.active = false; this.t = 0; this.since = 0; }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.7;
    const g = this.g, z = g.story?.zone;
    if (!this.active && g.alarmLevel >= 2 && TOWN.includes(z) && g.mode === 'play') this.start();
    else if (this.active && g.alarmLevel < 0.7 && g.time - this.since > 25) this.end();
    else if (this.active && g.time - this.since > 20) { // civilians keep their heads down
      for (const n of g.npcs) if (!n.guard && !n.dead && n.role === 'villager' && n.state === 'routine' && n.zoneTown !== false && Math.hypot(n.x - g.player.pos[0], n.z - g.player.pos[2]) < 60 && g.nav.indoorAt(n.x, n.z) === 0) n.scare(g.player.pos, 20);
    }
  }
  start() {
    const g = this.g; this.active = true; this.since = g.time;
    g.ui.flashBanner('LOCKDOWN', 2400); g.sfx.alarmBell?.(g.player.pos); g.sfx.hornShort?.(); g.gatesOpen = false; g.updateGates?.(false);
    for (const n of g.npcs) if (!n.guard && !n.dead && n.role === 'villager' && n.state === 'routine' && n.z > 12 && n.z < 95 && Math.abs(n.x) < 50) n.scare(g.player.pos, 40);
    for (const n of g.npcs) if (n.guard && !n.dead && n.faction === 'watch' && n.z > 5 && n.z < 95 && n.state === 'routine') { n.alert = 0.8; n.stim = [g.player.pos[0], g.player.pos[2]]; n.state = 'investigate'; n.investT = 40; n.stopMove(); }
    g.ui.toast('The gates are barred. Civilians are running for cover.');
  }
  end() { const g = this.g; this.active = false; g.ui.toast('The lockdown lifts'); }
}
