// A match is a short series of rounds between "your side" and "their side". The sides swap
// every round, the first to the target wins, and the totals become XP and renown.
import { OPS_BY_ID } from '../data/operators.js';

const other = (s) => (s === 'atk' ? 'def' : 'atk');

export class Match {
  constructor(list, { toWin = 3, startSide = 'atk', cfg = {} } = {}) {
    this.list = list; this.toWin = toWin; this.startSide = startSide; this.cfg = cfg;
    this.roundNo = 1; this.score = { me: 0, foe: 0 }; this.results = [];
    this.totals = { kills: 0, deaths: 0, assists: 0, headshots: 0, shots: 0, hits: 0, plants: 0, defuses: 0, reinforced: 0, breached: 0, damage: 0, score: 0 };
    this.seconds = 0; this.last = null; this.ops = {};
  }
  get ranked() { return !!this.list.ranked; }
  mySide(n = this.roundNo) { return n % 2 === 1 ? this.startSide : other(this.startSide); }
  get side() { return this.mySide(); }
  // score of the team that is attacking / defending in the current round
  sideScores() {
    const me = this.side;
    return me === 'atk' ? { atk: this.score.me, def: this.score.foe } : { atk: this.score.foe, def: this.score.me };
  }
  get over() { return this.score.me >= this.toWin || this.score.foe >= this.toWin || this.roundNo > this.toWin * 2 - 1; }
  get won() { return this.score.me > this.score.foe; }
  get draw() { return this.score.me === this.score.foe; }

  // called when a round ends (the sim's round has a result)
  record(sim, meActor) {
    const res = sim.round.result || { winner: 'def', reason: 'time' }, mine = res.winner === this.side;
    if (mine) this.score.me++; else this.score.foe++;
    if (meActor) { for (const k of Object.keys(this.totals)) this.totals[k] += meActor.stats[k] || 0; this.ops[meActor.op.id] = (this.ops[meActor.op.id] || 0) + 1; }
    this.seconds += sim.round.elapsed || 0;
    this.last = { n: this.roundNo, side: this.side, winner: res.winner, reason: res.reason, mine };
    this.results.push(this.last);
    return this.last;
  }
  next() { this.roundNo++; }

  // XP / renown for the finished match
  rewards() {
    const t = this.totals, mult = this.list.xp ?? 1;
    const parts = [
      ['Match completed', 200], [this.won ? 'Victory' : 'Defeat', this.won ? 300 : 80], ['Rounds won', this.score.me * 60],
      ['Kills', t.kills * 40], ['Headshots', t.headshots * 20], ['Assists', t.assists * 20],
      ['Defuser planted', t.plants * 50], ['Defuser disabled', t.defuses * 60], ['Walls reinforced', t.reinforced * 8], ['Walls breached', Math.min(60, t.breached * 4)],
    ].filter((p) => p[1] > 0).map(([a, b]) => [a, Math.round(b * mult)]);
    const xp = parts.reduce((s, p) => s + p[1], 0), renown = Math.round(xp * 0.55);
    return { parts, xp, renown };
  }
  opId() { let best = null, n = -1; for (const [id, c] of Object.entries(this.ops)) if (c > n) { best = id; n = c; } return best || 'hammer'; }
}
void OPS_BY_ID;
