// Many headless matches: catch exceptions, per-hero ability usage, stuck bots, A* cost.
import { Sim } from '../src/sim.js';
const N = +process.argv[2] || 20, diff = +process.argv[3] || 1;
const ults = {}, picks = {}, dmg = {}, elims = {}, abil = {}; let stuck = 0, frames = 0, matches = 0, errs = 0, t0 = Date.now(), wins = [0, 0];
for (let s = 1; s <= N; s++) {
  try {
    const sim = new Sim({ headless: true, autoPlayer: true, seed: s * 7919, difficulty: diff });
    const last = new Map();
    for (const u of sim.units) { picks[u.hero] = (picks[u.hero] || 0) + 1; last.set(u.id, { p: [...u.pos], t: 0, s: 0 }); }
    for (let i = 0; i < 60 * 900 && sim.state !== 'over'; i++) {
      sim.step(1 / 60);
      for (const e of sim.events) { if (e.type === 'ult') ults[e.unit.hero] = (ults[e.unit.hero] || 0) + 1; if (e.type === 'blink' || e.type === 'dash') { const k = e.unit?.hero || 'x'; abil[k] = (abil[k] || 0) + 1; } }
      if (sim.state === 'live' && i % 60 === 0) for (const u of sim.units) if (!u.deploy && u.alive) { const l = last.get(u.id); if (Math.hypot(u.pos[0] - l.p[0], u.pos[2] - l.p[2]) < 0.4) { l.s++; if (l.s === 8) stuck++; } else l.s = 0; l.p = [...u.pos]; frames++; }
    }
    wins[sim.winner]++; matches++;
    for (const u of sim.units) if (!u.deploy) { dmg[u.hero] = (dmg[u.hero] || 0) + u.stats.dmg; elims[u.hero] = (elims[u.hero] || 0) + u.stats.elims; }
  } catch (e) { errs++; console.log('ERR seed', s, e.stack.split('\n').slice(0, 4).join('\n')); }
}
console.log('matches', matches, 'errors', errs, 'wins', wins, 'stuck-8s events', stuck, 'of', frames, 'unit-seconds', 'ms', Date.now() - t0);
for (const h of Object.keys(picks)) console.log(h.padEnd(8), 'picks', picks[h], 'ults', ults[h] || 0, 'dmg/pick', Math.round((dmg[h] || 0) / picks[h]), 'elims/pick', ((elims[h] || 0) / picks[h]).toFixed(2));
