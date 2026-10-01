// Talking your way through. Every spoken option is a check against the listener: your Silver
// Tongue perks, what you are wearing and carrying, how they feel about you, who is watching
// and how nervous the town is. The odds are printed on the choice; the dice are rolled when you
// pick it. A critical failure is not just a refusal: it ends the conversation badly.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const LABEL = { persuade: 'Persuade', deceive: 'Deceive', intimidate: 'Intimidate', bribe: 'Bribe', papers: 'Papers' };

export class Speech {
  constructor(g) { this.g = g; this.last = null; }
  // 0.05 .. 0.95
  chance(kind, n, extra = 0) {
    const g = this.g, P = g.player, m = P.mod || {}, social = g.social;
    let c = { persuade: 0.5, deceive: 0.4, intimidate: 0.32, bribe: 0.8, papers: 0.78 }[kind] ?? 0.5;
    if (kind === 'persuade' || kind === 'deceive') c += m.speech || 0;
    if (kind === 'intimidate') c += (m.presence || 0) + (P.drawn ? 0.2 : -0.16) + (P.hp < P.maxHp * 0.4 ? -0.1 : 0);
    if (kind === 'papers') c += 0.06 * (m.forge || 0);
    c += (social?.attOf(n) || 0) / 250;
    const talk = kind === 'persuade' || kind === 'deceive';
    if (talk) {
      if (g.rep.disguise) c += 0.08;
      if (P.drawn) c -= 0.15;
      if (g.look.bloody > 0) c -= 0.1;
    }
    const rec = g.look.match(n, n.dist ?? 5);
    if (rec > 0.45) c -= (kind === 'bribe' ? 0.08 : 0.22) * rec;
    if (n.role === 'captain') c -= 0.14; else if (n.faction === 'keep') c -= 0.05;
    c -= (n.chFails || 0) * 0.12;
    c -= (social?.vig || 0) * 0.04;
    c += [0.08, 0, -0.08][g.difficulty ?? 1];
    return clamp(c + extra, 0.05, 0.95);
  }
  roll(kind, n, extra = 0) { const p = this.chance(kind, n, extra), r = Math.random(); return { ok: r < p, crit: r >= p && r > 0.93, p }; }
  // a choice for a conversation: it shows its odds, rolls when picked and goes to the line `ok` or `fail` makes
  choice(kind, n, text, { extra = 0, ok, fail, when, gold = 0, skip = false } = {}) {
    return {
      tag: kind, when,
      text: () => `[${LABEL[kind]}${gold ? ` ${gold}g` : ''} · ${Math.round(this.chance(kind, n, extra) * 20) * 5}%] ${text}`,
      next: () => { const r = this.roll(kind, n, extra); this.last = { kind, ...r }; return r.ok ? ok(r) : fail(r); },
    };
  }
}
