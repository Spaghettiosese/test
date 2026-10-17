// Time-skip safety / QA tools. Debug only: attached to the game object (window.__misa.years), never shown in normal UI.
//   __misa.years.skipTo(year, season, day, { fast })  advance day by day through game.nextDay(), so every dayEnd / dayStart hook runs
//                                                      (fast: true jumps straight to the day, running the hooks once)
//   __misa.years.jump('year2'|'year3'|'final'|'trip'|'mock'|'grad'|'epilogue')
//   __misa.years.flush()      run due events now (headless only: waits for each scripted scene)
//   __misa.years.grad()       play the graduation set-piece right now        __misa.years.newGamePlus()  prestige
//   __misa.years.state()      a compact summary of the long game
import { register } from '../../core/registry.js';
import { SEASONS } from '../../core/time.js';
import { Y, dayOf, tick, isBusy, yr, gradeOf, GRAD_DAY } from './util.js';
import { enrolledKohai } from './kohai.js';
import { runGraduation, finalizeGraduation } from './graduation.js';
import { newGamePlus } from './epilogue.js';
import { applyTimetable } from './years.js';

export function skipTo(g, year, season, date, opts = {}) {
  const target = dayOf(year, season, date);
  if (!SEASONS.includes(season) || target <= g.day) return g.day;
  if (opts.fast) { g.state.time.day = target - 1; g.nextDay(); }
  else while (g.day < target) g.nextDay();
  g.state.time.minutes = opts.minutes ?? 8 * 60;
  Y(g).skips++;
  g.bus.emit('svSkip', { day: g.day });
  applyTimetable(g);
  return g.day;
}
export async function flush(g, max = 12) {
  for (let i = 0; i < max; i++) {
    if (!tick(g, true)) break;
    for (let k = 0; k < 400 && isBusy(g); k++) await new Promise((r) => setTimeout(r, 0));
  }
}
export const JUMPS = {
  year2: (g) => skipTo(g, 2, 'spring', 2, { fast: true }),
  year3: (g) => skipTo(g, 3, 'spring', 2, { fast: true }),
  final: (g) => skipTo(g, 4, 'spring', 2, { fast: true }),
  trip: (g) => skipTo(g, 2, 'autumn', 8, { fast: true, minutes: 7 * 60 + 30 }),
  mock: (g) => skipTo(g, 3, 'summer', 2, { fast: true }),
  grad: (g) => skipTo(g, 4, 'spring', 28, { fast: true, minutes: 10 * 60 + 5 }),
  epilogue: (g) => { skipTo(g, 4, 'spring', 28, { fast: true }); finalizeGraduation(g); return skipTo(g, 4, 'summer', 2, { fast: true }); },
};
register('system', 'sv3_debug', {
  init(g) {
    g.years = {
      skipTo: (y, s, d, o) => skipTo(g, y, s, d, o), flush: () => flush(g), jump: (name) => (JUMPS[name] ? JUMPS[name](g) : Object.keys(JUMPS)),
      grad: () => runGraduation(g), newGamePlus: () => newGamePlus(g, true), finalize: () => finalizeGraduation(g),
      state: () => ({ day: g.day, gameYear: yr(g), grade: gradeOf(g), gradDay: GRAD_DAY, kohai: enrolledKohai(g), ...JSON.parse(JSON.stringify({ track: Y(g).track, elective: Y(g).elective, graduated: Y(g).graduated, ending: Y(g).ending })) }),
    };
  },
});
