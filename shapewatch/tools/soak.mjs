// Many headless matches: exceptions, stuck bots, per-hero damage/elims/heals/ult use, win split.
import { Sim } from '../src/sim.js';
const N = +process.argv[2] || 20, diff = +process.argv[3] || 1, mode = process.argv[4] || 'escort', map = process.argv[5] || 'frostgate';
const picks = {}, S = {}; let stuck = 0, frames = 0, matches = 0, errs = 0, wins = [0, 0, 0], t0 = Date.now(), kills = 0, crits = 0, ultsT = 0, minutes = 0, swaps = 0;
for (let s = 1; s <= N; s++) {
  try {
    const sim = new Sim({ headless: true, autoPlayer: true, seed: s * 7919, difficulty: diff, mode, map });
    const last = new Map(); for (const u of sim.units) last.set(u.id, { p: [...u.pos], s: 0 });
    for (let i = 0; i < 60 * 900 && sim.state !== 'over'; i++) {
      sim.step(1 / 60); for (const e of sim.events) { if (e.type === 'kill') kills++; if (e.type === 'ult') ultsT++; if (e.type === 'swap' && sim.state === 'live') swaps++; }
      if (sim.state === 'live' && i % 60 === 0) for (const u of sim.units) if (!u.deploy && u.alive && !u.dummy) { const l = last.get(u.id); if (Math.hypot(u.pos[0] - l.p[0], u.pos[2] - l.p[2]) < 0.4 && !u.st.root && !u.s.bunker && !u.s.channel && !u.st.frozen) { l.s++; if (l.s === 8) stuck++; } else l.s = 0; l.p = [...u.pos]; frames++; }
    }
    wins[sim.winner ?? 2]++; matches++; minutes += sim.time / 60;
    for (const u of sim.units) if (!u.deploy) { picks[u.hero] = (picks[u.hero] || 0) + 1; const a = (S[u.hero] ||= { dmg: 0, el: 0, heal: 0, ult: 0, dth: 0, crit: 0, sh: 0, hit: 0 }); a.dmg += u.stats.dmg; a.el += u.stats.elims; a.heal += u.stats.heal; a.ult += u.stats.ults; a.dth += u.stats.deaths; a.crit += u.stats.crits; a.sh += u.stats.shots; a.hit += u.stats.hits; crits += u.stats.crits; }
  } catch (e) { errs++; console.log('ERR seed', s, e.stack.split('\n').slice(0, 5).join('\n')); }
}
console.log(mode, map, 'matches', matches, 'errors', errs, 'wins', wins, 'stuck-8s', stuck, 'of', frames, 'unit-s;', 'kills/match', (kills / matches).toFixed(0), 'min/match', (minutes / matches).toFixed(1), 'ults/match', (ultsT / matches).toFixed(1), 'ults/player/min', (ultsT / minutes / 10).toFixed(2), 'swaps/match', (swaps / matches).toFixed(1), 'ms', Date.now() - t0);
for (const h of Object.keys(picks).sort()) { const a = S[h], n = picks[h]; console.log(h.padEnd(11), 'n', String(n).padStart(3), 'dmg', String(Math.round(a.dmg / n)).padStart(5), 'elims', (a.el / n).toFixed(1).padStart(5), 'deaths', (a.dth / n).toFixed(1).padStart(5), 'heal', String(Math.round(a.heal / n)).padStart(5), 'ults', (a.ult / n).toFixed(2), 'crit', (a.crit / n).toFixed(0).padStart(3), 'acc', a.sh ? Math.round(100 * a.hit / a.sh) + '%' : '-'); }
