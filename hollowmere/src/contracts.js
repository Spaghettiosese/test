// Job boards: three new contracts every day, generated from templates and tracked as quests.
import { QUESTS } from './quests.js';

const BOARDS = [{ id: 'gate', name: 'Ashgate notice board', at: [8.6, 1.0, 17.6] }, { id: 'toll', name: 'Toll house board', at: [6.4, 1.0, -218.4] }, { id: 'farm', name: 'Farm gatepost', at: [26.6, 1.0, -132.5] }];
export class Contracts {
  constructor(g) { this.g = g; this.day = -1; this.today = []; this.doneToday = new Set(); }
  gen() {
    const g = this.g, day = g.clock.day; if (day === this.day) return; this.day = day; this.today = [];
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const bandits = g.npcs.filter((n) => n.role === 'bandit' && !n.dead && n.id !== 'cael');
    const T = [
      () => { const b = rnd(bandits); if (!b) return null; return { title: `Bounty: ${b.name}`, text: `Wanted dead: ${b.name}, a bandit of the Mirewood. Bring proof of the deed by ending them.`, steps: [{ type: 'kill', ids: [b.id], text: `Kill ${b.name} (Mirewood)` }], reward: { gold: 55 + Math.floor(Math.random() * 40) }, xp: 70 }; },
      () => { const n = 3 + Math.floor(Math.random() * 3); return { title: 'Cull the hollows', text: `Hollows are stirring. Put down ${n} of them.`, steps: [{ type: 'kill', role: 'hollow', n, text: `Put down ${n} hollows` }], reward: { gold: 30 + n * 14 }, xp: 60 + n * 8 }; },
      () => { const n = 3 + Math.floor(Math.random() * 3); return { title: 'Herbs wanted', text: `The apothecary wants ${n} Hexwort from the Mirewood.`, steps: [{ type: 'have', item: 'h_hex', n, text: `Gather ${n} Hexwort and return here` }], reward: { gold: 22 + n * 8 }, take: [['h_hex', n]], xp: 40 }; },
      () => { const n = 2 + Math.floor(Math.random() * 3); return { title: 'Clear the road', text: `Highwaymen and bandits are choking the trade. Kill ${n} of them.`, steps: [{ type: 'kill', role: 'bandit', n, text: `Kill ${n} bandits` }], reward: { gold: 25 + n * 16 }, xp: 60 }; },
      () => { const n = 2 + Math.floor(Math.random() * 2); return { title: 'Ember for the smith', text: `Brandt needs ${n} Ember moss from the ash of Cinderwick.`, steps: [{ type: 'have', item: 'h_ember', n, text: `Gather ${n} Ember moss` }], reward: { gold: 30 + n * 12 }, take: [['h_ember', n]], xp: 50 }; },
    ];
    const pick = T.slice().sort(() => Math.random() - 0.5);
    let i = 0; for (const f of pick) { const c = f(); if (!c) continue; c.id = `c_${day}_${i++}`; c.giver = '_board'; c.offer = [c.text]; c.done = ['Contract complete. The coin is yours.']; QUESTS.push(c); this.today.push(c); if (this.today.length >= 3) break; }
  }
  open(board) {
    this.gen(); const g = this.g, Q = g.quests;
    const lines = [{ text: `${board.name}. Pinned jobs for hard people.`, choices: [] }];
    for (const c of this.today) {
      const st = Q.status(c.id);
      if (st === 'ready') lines[0].choices.push({ text: `Claim: ${c.title} (${c.reward.gold} gold)`, next: 'end', action: (G) => G.quests.turnIn(c.id) });
      else if (st === 'new') lines[0].choices.push({ text: `${c.title}: ${c.text} [${c.reward.gold} gold]`, next: 'end', action: (G) => G.quests.accept(c.id) });
      else if (st === 'active') lines[0].choices.push({ text: `${c.title}: in progress`, next: 'end' });
    }
    lines[0].choices.push({ text: 'Walk away.', next: 'end' });
    g.ui.dialogue({ lines, name: board.name, spec: { outfit: 'peasant' } });
  }
  hook(push, eye) { for (const b of BOARDS) { if (Math.abs(b.at[0] - eye[0]) > 3 || Math.abs(b.at[2] - eye[2]) > 3) continue; push(b.at[0], b.at[1], b.at[2], 2.6, 'Read the job board', () => this.open(b), 'prop', 0.75, b); } }
}
