// Arrest and the gaol at Fort Greywatch. Die while wanted and the watch takes you alive: fined,
// stripped of anything illegal, and locked in a cell. Serve the sentence, pay the sergeant,
// or pick the lock and run.
const ILLEGAL = ['knife', 'poison', 'firebomb', 'smoke', 'beartrap', 'wire', 'sap'];
export class Jail {
  constructor(g) { this.g = g; this.active = false; this.t = 0; this.sentence = 150; this.escapes = 0; this.stashed = []; }
  shouldArrest() { const R = this.g.rep; return R.total('watch') >= 60 || R.total('keep') >= 60; }
  door() { return this.g.level.doors.filter((d) => d.id === 'gaol_door'); }
  arrest() {
    const g = this.g, P = g.player, cell = g.level.pois.gaol_cell; if (!cell) return false;
    this.stashed = []; for (const id of ILLEGAL) { const n = P.inv.count(id); if (n > 0) { this.stashed.push([id, n]); P.inv.remove(id, n); } }
    const picks = P.inv.count('lockpick'); if (picks > 1) { this.stashed.push(['lockpick', picks - 1]); P.inv.remove('lockpick', picks - 1); }
    const fine = Math.min(P.inv.gold, Math.ceil(Math.max(g.rep.total('watch'), g.rep.total('keep')) * 0.5)); P.inv.gold -= fine;
    const box = g.level.containers.find((c) => c.id === 'fort_confiscated'); if (box) { box.loot = [...this.stashed]; box.opened = false; }
    for (const d of this.door()) d.locked = true;
    P.cc.position = [cell.x, 0.1, cell.z]; P.cc.velocity = [0, 0, 0]; P.yaw = 0; P.hp = P.maxHp * 0.6; P.dead = false; P.invuln = 2;
    this.active = true; this.t = this.sentence; g.alarmLevel = 0; g.combatT = 0;
    for (const n of g.npcs) if (n.guard && !n.dead && n.state !== 'ko') { n.state = 'routine'; n.alert = 0; n.slotKey = ''; n.stopMove(); n.atk = null; }
    g.ui.flashBanner('ARRESTED', 2200); g.ui.toast(`Fined ${fine} gold. Illegal goods taken (they are in the barracks chest).`);
    g.ui.toast('Serve your sentence, pay Sergeant Brask, or pick the lock.'); g.stats.arrests = (g.stats.arrests || 0) + 1;
    return true;
  }
  release(how) {
    const g = this.g; if (!this.active) return;
    this.active = false; for (const d of this.door()) { d.locked = false; d.open?.(d.x, d.z - 2); }
    g.rep.bounty.watch = 0; g.rep.bounty.keep = 0;
    g.ui.toast(how === 'paid' ? 'The sergeant unlocks the cell. Your name is clear.' : 'Sentence served. The door is unlocked. Do not come back.'); g.sfx.door?.(true);
  }
  pay() { const g = this.g, owe = 40 + Math.ceil(this.t * 0.5), P = g.player; if (P.inv.gold < owe) { g.toast(`Bribe needs ${owe} gold`); g.sfx.deny?.(); return false; } P.inv.gold -= owe; g.sfx.coin?.(); this.release('paid'); return true; }
  update(dt) {
    if (!this.active) return; const g = this.g, P = g.player, cell = g.level.pois.gaol_cell; if (!cell) return;
    this.t -= dt; if (this.t <= 0) { this.release('served'); return; }
    if (Math.hypot(P.pos[0] - cell.x, P.pos[2] - cell.z) > 10 && this.door().every((d) => !d.locked || d.isOpen?.())) {
      this.active = false; this.escapes++; g.stats.escapes = (g.stats.escapes || 0) + 1; g.rep.add('watch', 50, 'escaped'); g.alarm(P.pos, 'spotted', null); g.ui.flashBanner('ESCAPED', 1600, true);
    }
  }
  save() { return { a: this.active, t: this.t, s: this.stashed }; }
  load(d) { if (d) { this.active = !!d.a; this.t = d.t || 0; this.stashed = d.s || []; } }
}
