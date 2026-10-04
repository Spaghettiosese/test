// Trophies: forty marks of a life in Hollowmere that outlive any one save. Most are checked once
// a second against what the game already counts; a few are awarded the moment they happen. A
// trophy is kept in the profile, so New Game+ and other slots see it too.
const S = (k, n) => (g) => (g.stats[k] || 0) >= n;
const F = (k) => (g) => !!g.campaign.facts[k];
export const TROPHIES = [
  // the story
  { id: 'ashgate', name: 'Into the Fold', desc: 'Get inside Ashgate.', test: (g) => g.story.objectives.find((o) => o.id === 'town')?.done },
  { id: 'frontdoor', name: 'By the Front Door', desc: 'Walk into Ashgate through the open gate.', test: F('frontDoor') },
  { id: 'letter', name: 'Wax and Raven', desc: 'Take the Duke\'s letter.', test: (g) => g.player.inv.has('letter') || g.campaign.index() >= 1 },
  { id: 'c1', name: 'The Duke\'s Seal', desc: 'Finish Chapter I.', test: (g) => g.campaign.index() >= 1 },
  { id: 'c2', name: 'The Gray Hand', desc: 'Finish Chapter II.', test: F('c2done') },
  { id: 'c3', name: 'The Hollow Night', desc: 'Finish Chapter III.', test: F('c3done') },
  { id: 'c4', name: 'The Choir Beneath', desc: 'Finish the story.', test: (g) => !!g.story.ended },
  { id: 'ghostc1', name: 'Ghost of Ravenspire', desc: 'Finish Chapter I without the alarm being raised before the letter.', test: F('ghostC1') },
  { id: 'mercyc1', name: 'Merciful Knife', desc: 'Finish Chapter I without killing anyone.', test: F('mercyC1') },
  { id: 'duke', name: 'A Word in the Dark', desc: 'Wake the Duke and leave him alive.', test: (g) => g.story.dukeState === 'surrender' || g.story.dukeState === 'fled' },
  { id: 'brannoch', name: 'Old Debts', desc: 'Save Brannoch\'s life.', test: F('brannochSaved') },
  { id: 'verses', name: 'Three Verses', desc: 'Learn all three verses of the binding.', test: (g) => g.campaign.verses.size >= 3 },
  { id: 'vanetalk', name: 'Professional Courtesy', desc: 'Talk Vane out of the fight.', test: F('vaneSpared') },
  { id: 'vanekill', name: 'Duelist', desc: 'Beat Vane with the sword.', test: F('vaneBeaten') },
  { id: 'siege', name: 'Hold the Line', desc: 'Hold Ashgate\'s gate through the Hollow Night.', test: F('siegeWon') },
  { id: 'pardon', name: 'Pardoned', desc: 'Earn Captain Harl\'s pardon.', test: F('pardoned') },
  { id: 'bone', name: 'Bone of the Binder', desc: 'Take the Binder\'s skull from the catacombs.', test: (g) => g.player.inv.has('binderskull') || !!g.campaign.facts.boneTaken },
  { id: 'bell', name: 'The Tongue of the Bell', desc: 'Take the clapper from Ravenspire\'s bell.', test: (g) => g.player.inv.has('clapper') || !!g.campaign.facts.bellTaken },
  { id: 'sable', name: 'The Mistress Falls', desc: 'Defeat Sable at the Choir Stones.', test: F('sableBeaten') },
  { id: 'sabletalk', name: 'Mother\'s Daughter', desc: 'Talk Sable down.', test: F('sableRedeemed') },
  { id: 'choir', name: 'Silence', desc: 'Bring down the Choir.', test: F('choirBeaten') },
  // the endings
  { id: 'e_saint', name: 'The Quiet Bell', desc: 'See the ending where the letter burns.', test: (g) => g.profile.d.endings.includes('saint') },
  { id: 'e_unseal', name: 'Key of the Choir', desc: 'See the ending where the seal breaks.', test: (g) => g.profile.d.endings.includes('unseal') },
  { id: 'e_gray', name: 'The Gray Hand\'s Knife', desc: 'See the ending where Sable gets her letter.', test: (g) => g.profile.d.endings.includes('gray') },
  { id: 'e_true', name: 'The Thirteenth Bell', desc: 'See the true ending.', test: (g) => g.profile.d.endings.includes('true') },
  // the craft
  { id: 'exec10', name: 'Executioner', desc: 'Perform ten executions.', test: S('executions', 10) },
  { id: 'parry25', name: 'Iron Wrist', desc: 'Parry twenty-five blows.', test: S('parries', 25) },
  { id: 'heavy', name: 'Guard Breaker', desc: 'Break a shield with a charged blow.', test: S('guardBreaks', 1) },
  { id: 'dodge', name: 'Step Aside', desc: 'Sidestep twenty blows.', test: S('dodges', 20) },
  { id: 'stabs25', name: 'Wraith', desc: 'Make twenty-five silent kills.', test: S('stabs', 25) },
  { id: 'ko15', name: 'Lights Out', desc: 'Knock out fifteen people.', test: S('ko', 15) },
  { id: 'talk10', name: 'Silver Tongue', desc: 'Win ten speech checks.', test: S('speechWins', 10) },
  { id: 'uniforms', name: 'Many Faces', desc: 'Wear a disguise five times.', test: S('disguises', 5) },
  { id: 'bolts', name: 'Bolt from the Dark', desc: 'Kill ten people with the crossbow.', test: S('boltKills', 10) },
  { id: 'douse', name: 'The Long Dark', desc: 'Put out twenty lights.', test: S('snuffed', 20) },
  { id: 'echoes', name: 'Every Echo', desc: 'Gather all thirteen Choir echoes.', test: (g) => (g.echoes?.found.size || 0) >= 13 },
  { id: 'bosses', name: 'Trophy Shelf', desc: 'Defeat five great foes.', test: S('bosses', 5) },
  { id: 'nohit', name: 'Untouchable', desc: 'Defeat a great foe without being hit.', test: F('noHitBoss') },
  { id: 'lvl12', name: 'Veteran of Hollowmere', desc: 'Reach level 12.', test: (g) => g.progress.level >= 12 },
  { id: 'ngplus', name: 'Once More', desc: 'Begin a New Game+.', test: (g) => g.campaign.ng > 0 },
];

export class Achievements {
  constructor(g) { this.g = g; this.q = []; this.t = 0; }
  // award now (also used by check); returns true the first time
  give(id) {
    const g = this.g, T = TROPHIES.find((x) => x.id === id); if (!T || !g.profile.unlock(id)) return false;
    this.q.push(T); return true;
  }
  check() {
    const g = this.g; if (!g.player || g.mode === 'menu' || g.mode === 'boot') return;
    for (const T of TROPHIES) { if (g.profile.has(T.id)) continue; let ok = false; try { ok = !!T.test(g); } catch { ok = false; } if (ok) this.give(T.id); }
  }
  // one at a time, so a burst of trophies reads as a queue
  update(dt) {
    this.t -= dt; if (this.t > 0 || !this.q.length) return;
    const T = this.q.shift(), g = this.g; this.t = 3.6;
    const d = document.createElement('div'); d.className = 'hud trophy px'; d.innerHTML = `<i></i><div><b>Trophy</b><span></span><small></small></div>`;
    d.querySelector('span').textContent = T.name; d.querySelector('small').textContent = T.desc; document.body.append(d); setTimeout(() => d.remove(), 4200);
    g.sfx.bellNote?.(3);
  }
  count() { return TROPHIES.filter((t) => this.g.profile.has(t.id)).length; }
}
