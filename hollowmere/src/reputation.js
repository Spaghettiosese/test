// Crime, witnesses, bounties and disguises. A crime only counts if somebody saw it; a witness
// runs to the nearest guard to report it, and if the witness is silenced first, nothing happens.
// A stolen uniform lets you walk past guards of that faction until they look too closely.
const hyp = Math.hypot;
const SEV = { murder: 120, assault: 40, theft: 35, trespass: 15, lockpick: 25, arson: 90 };

export class Reputation {
  constructor(g) { this.g = g; this.bounty = { watch: 0, keep: 0, bandits: 0 }; this.disguise = null; this.lastCrime = 0; this.decayT = 0; }
  total(f) { return this.bounty[f] || 0; }
  wanted(f) { return this.total(f) >= 60; }
  // called when the player does something bad at `pos`. returns the witnesses.
  crime(kind, pos, { faction = 'watch', victim = null, range = 24, ownerOnly = false } = {}) {
    const g = this.g, P = g.player, sev = SEV[kind] || 20, wit = [];
    const head = [P.pos[0], P.pos[1] + 1.4, P.pos[2]];
    for (const n of g.npcs) {
      if (n.dead || n === victim || n.role === 'hollow' || n.role === 'bandit' || n.lying || n.state === 'ko' || n.state === 'flee' || n.state === 'report') continue;
      const d = hyp(n.x - pos[0], n.z - pos[2]); if (d > range) continue;
      const f = n.fwd, c = ((pos[0] - n.x) * f[0] + (pos[2] - n.z) * f[1]) / (d || 1);
      if (c < -0.1 && d > 3) continue;
      if (!g.canSee(n.eye, head, n.body)) continue;
      if (this.disguise && kind !== 'murder' && kind !== 'assault' && d > 6) continue; // a guard in uniform stealing: nobody looks twice
      wit.push(n);
    }
    if (wit.length) { g.look.testify(wit, faction); g.social.incident(wit.some((n) => n.guard) ? 0.35 : 0.15); }
    for (const n of wit) {
      if (n.guard) {
        this.add(faction, sev, `${n.name} saw you`);
        if (kind === 'murder' || kind === 'assault') { n.lastSeen = [...P.pos]; if (n.state !== 'chase' && n.state !== 'attack') { n.alert = 1; n.spotted(); } }
        else n.noticed(P.pos, 'sight');
        if (this.disguise && (kind === 'murder' || kind === 'assault')) this.blow();
      } else {
        n.witness = { kind, sev, faction }; n.state = 'report'; n.reportT = 25; n.path = null; n.goal = null; n.repathT = 0;
        if (!n.talkable && Math.random() < 0.6) n.bark(['Murderer!', 'I saw that!', 'Guards!'][Math.floor(Math.random() * 3)], n.spec.voice);
      }
    }
    if (wit.length) this.g.ui.toast(wit.some((n) => n.guard) ? 'You were seen' : 'A witness is running for the guards');
    return wit;
  }
  add(faction, amount, why = '') {
    const b = this.bounty; b[faction] = Math.min(600, (b[faction] || 0) + amount); this.lastCrime = this.g.time;
    this.g.ui.toast(`Bounty +${amount}${why ? ' (' + why + ')' : ''}`);
    if (b[faction] >= 60 && !this._warned) { this._warned = true; this.g.ui.flashBanner('YOU ARE WANTED', 1800, true); setTimeout(() => (this._warned = false), 25000); }
  }
  reported(witness, guard) {
    const w = witness.witness; if (!w) return;
    witness.witness = null; this.g.look.delivered(witness, guard);
    if (w.kind === 'brandish') { // a frightened villager: the guard comes to have a word, nothing more
      guard.bark('A man with a drawn blade? I will have a word.'); this.g.social.startChallenge(guard, { id: 'weapon', reason: 'Drawn weapon', w: 0.6, kind: 'challenge' }); return;
    }
    this.add(w.faction, w.sev, 'reported');
    guard.bark('A crime, you say? Where?'); guard.lastSeen = [...this.g.player.pos]; guard.stim = [this.g.player.pos[0], this.g.player.pos[2]]; guard.stimKind = 'report';
    guard.alert = Math.max(guard.alert, 0.8); this.g.alarm(this.g.player.pos, 'combat', guard);
  }
  pay(faction) {
    const P = this.g.player, owe = Math.ceil(this.total(faction) * 1.0);
    if (owe <= 0) return 'none';
    if (P.inv.gold < owe) return 'short';
    P.inv.gold -= owe; this.bounty[faction] = 0; this.g.look.forget(faction); this.g.sfx.coin?.(); this.g.ui.toast(`Paid ${owe} gold. Your name is clear.`);
    return 'paid';
  }
  payDialogue(npc) {
    if (!npc.guard || npc.role === 'bandit' || npc.role === 'hollow' || npc.faction === 'hunters') return null;
    const f = npc.faction === 'keep' ? 'keep' : 'watch', owe = Math.ceil(this.total(f)); if (owe <= 0) return null;
    const m = this.g.look.match(npc, npc.dist || 3); if (m < 0.35) return null;       // a guard who has not been told what to look for is only a guard
    const known = m > 0.9 ? 'You. I know your face.' : 'You fit the description of a thief the Watch is after.';
    return [{ text: `${known} There is a price on it: ${owe} gold. Settle it, and I will forget I saw you.`, choices: [
      { text: `Pay ${owe} gold.`, next: 1, action: (G) => { const r = G.rep.pay(f); G.rep._last = r; } },
      { text: 'Not today.', next: 'end' }] },
      { text: 'Smart. Now move along.', end: true, onShow: (G) => { if (G.rep._last === 'short') { G.ui.toast('You cannot afford it'); } } }];
  }
  // ---- disguises: a uniform is a claim about who you are, and it holds only where that claim is believable
  wear(faction, label, kind = faction, item = null) { this.disguise = { faction, label, kind, item }; this.g.ui.flashBanner('DISGUISED: ' + label.toUpperCase(), 1600, true); this.g.sfx.veil?.(); }
  remove() { if (!this.disguise) return; this.disguise = null; this.g.ui.toast('You put the uniform away'); }
  blow(by = null) {
    const d = this.disguise; if (!d) return; this.disguise = null; this.g.ui.flashBanner('COVER BLOWN', 1600, true); this.g.social?.incident(0.5);
    if (by) { const D = this.g.look.snapshot(by, by.dist || 3); D.f = by.faction === 'town' ? 'watch' : by.faction; D.uniform = d.kind || d.faction; D.cloak = 'uniform'; D.hood = false; this.g.look.add(D); }
  }
  // how much a guard believes the uniform: 1 = not at all, 0 = completely
  disguiseGain(n, dist) {
    const d = this.disguise, P = this.g.player; if (!d || n.role === 'bandit' || n.role === 'hollow' || n.faction === 'hunters') return 1;
    const kind = d.kind || d.faction, servant = kind === 'servant', acc = this.g.social.access(P.pos[0], P.pos[2]), actor = P.mod?.actor ?? 1;
    const ok = servant || d.faction === n.faction || (d.faction === 'keep' && n.faction === 'watch');
    if (!ok) return 1;
    if (P.atk || P.sprint || P.crouch && dist < 5 || P.carried) { if (P.atk) this.blow(n); return 1; }
    if (acc >= 3 || (servant && P.drawn)) return 1;
    if (dist < 3.6) { n.suspect = (n.suspect || 0) + 0.04 * (servant ? 0.7 : acc >= 2 && d.faction === 'watch' ? 1.6 : 0.6) / actor; if (n.suspect >= 1) { n.suspect = 0; n.bark(servant ? 'You are no servant of this house!' : 'Wait. You are no guard of mine!'); this.blow(n); return 1; } if (n.suspect > 0.5 && !n._sus) { n._sus = true; n.bark('Hm. Do I know you?'); } }
    else n.suspect = Math.max(0, (n.suspect || 0) - 0.02);
    return servant ? (n.role === 'captain' ? 0.5 : acc >= 2 ? 0.3 : 0.15) : acc >= 2 && d.faction === 'watch' ? 0.35 : 0.08;
  }
  update(dt) {
    this.decayT -= dt; if (this.decayT > 0) return; this.decayT = 1;
    const g = this.g, seen = g.npcs.some((n) => n.guard && !n.dead && (n.state === 'chase' || n.state === 'attack')) || g.time - this.lastCrime < 30;
    if (seen) return;
    for (const f in this.bounty) if (this.bounty[f] > 0) this.bounty[f] = Math.max(0, this.bounty[f] - 1.2);
  }
  save() { return { bounty: this.bounty, disguise: this.disguise }; }
  load(d) { if (d) { Object.assign(this.bounty, d.bounty || {}); this.disguise = d.disguise || null; } }
}
