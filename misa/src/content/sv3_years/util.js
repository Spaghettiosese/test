// Years & Graduation (sv3_years): shared state, calendar maths, script helpers and the "due event" ticker.
//
// The long game: three school years (game years 1-3), then a final spring term in game year 4 that ends with the graduation
// ceremony on SPRING 28 of game year 4 (= the 28th day of the final April-start term; day 364). After the ending the game goes on
// as Epilogue Life. NOTE: a school year runs Spring 1 .. Winter 28 of the same game year, so "Year 3" is Misa's last full year and
// the ceremony closes it in the following spring (the same day as the Starlight Festival).
//
// Save data: state.sv3y (see DEFAULT). Legacy (New Game+) lives OUTSIDE the save: localStorage key 'misa-life:legacy'.
// Condition kinds added: grade>=2 (0 = alumni), alum, track:<id>, sv3club:<clubId>, sv3cday (today is a meeting day of Misa's club),
//   sv3enrolled:<kohaiId>.
// Bus events emitted: svYearStart {year}, svElective {id}, svElection {year, won}, svClubRole {role}, svTrip {}, svTrack {id},
//   svMock {n, avg}, svEntrance {passed}, svGraduated {ending}, svEpilogue {}, svAlumni {season}, svLegacy {runs}
// Hooks for the story-acts pack: reads flags act2_done, act3_done and state.sv3_acts?.actsEnding (all optional).
import { register, get, all } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { yearOf, seasonOf, dateOf, SEASONS, SEASON_DAYS } from '../../core/time.js';

export const DEFAULT = () => ({
  done: {}, elective: null, rep: {}, role: {}, trip: { done: false, picks: {} }, enrolled: {},
  track: null, trackAt: 0, trackBase: {}, trackScenes: {}, counselled: 0, mocks: {}, entrance: null,
  grad: null, graduated: false, ending: null, letters: [], goalsClaimed: {}, tournament: {}, festival: {},
  epi: { started: 0, cafe: { stage: 0, special: null, staff: [], days: 0, profit: 0, served: 0, rating: 10 }, clock: { owned: false, days: 0, orders: 0 }, fund: { total: 0, tier: 0 }, alumni: {}, goalsDone: {} },
  hof: [], legacyApplied: false, skips: 0,
});
register('stateSlice', 'sv3y', { default: DEFAULT });
export const Y = (g) => (g.state.sv3y ||= DEFAULT());

// ---------------------------------------------------------------- calendar
export const YEAR_DAYS = SEASON_DAYS * 4;
export const dayOf = (year, season, date) => (year - 1) * YEAR_DAYS + SEASONS.indexOf(season) * SEASON_DAYS + date;
export const GRAD_DAY = dayOf(4, 'spring', 28);
export const yr = (g) => yearOf(g.day);
// 0 = alumnus, 1..3 = school year (the final spring term in game year 4 still counts as year 3)
export const gradeOf = (g) => (Y(g).graduated || g.day > GRAD_DAY ? 0 : Math.min(3, yearOf(g.day)));
export const isAlum = (g) => gradeOf(g) === 0 && (Y(g).graduated || g.day > GRAD_DAY);
export const GRADE_NAMES = ['Alumna', 'First Year', 'Second Year', 'Third Year'];
export const gradeName = (g) => GRADE_NAMES[gradeOf(g)];
export const inSeasonWin = (g, season, a, b) => seasonOf(g.day) === season && dateOf(g.day) >= a && dateOf(g.day) <= b;
export const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

addCondKind('grade', (g) => gradeOf(g));
addCondKind('alum', (g) => isAlum(g));
addCondKind('track', (g, a) => Y(g).track === a);
addCondKind('sv3club', (g, a) => !!g.state.school && g.state.school.club === a);
addCondKind('sv3enrolled', (g, a) => !!Y(g).enrolled[a]);

// ---------------------------------------------------------------- script helpers
export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const call = (fn) => ({ t: 'call', fn });
export const fade = (to = 1, dur = 0.6) => ({ t: 'fade', to, dur });
export const bd = (name) => ({ t: 'scene', name });
export const wait = (dur = 0.8) => ({ t: 'wait', dur });
export const choice = (prompt, ...opts) => ({ t: 'choice', prompt, options: opts.map(([text, ...steps]) => ({ text, steps: steps.flat() })) });
export const pickOf = (r, a) => a[Math.floor(r() * a.length)];
export const nm = (id) => (get('npc', id) || { name: id }).name;
export const first = (id) => nm(id).split(' ')[0];
export const has = (id) => !!get('item', id);
export const giveOr = (g, id, coins = 50) => { if (id && has(id)) { g.give(id, 1); return get('item', id).name; } g.addMoney(coins); return `${coins} coins`; };
export const stickers = (g, n) => { if (n > 0 && has('star_sticker')) { g.give('star_sticker', n, true); g.stat('starStickers', n); } };
export const idle = (g) => !!(g.world && g.scenes.top === g.world && !g.world.busy);
export const st = (g, k) => (g.state.stats && g.state.stats[k]) || 0;
export const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const soft = (v, cap) => Math.max(0, Math.min(1, (v || 0) / cap));
export const pct = (v) => `${Math.round(v * 100)}%`;
// Ask a question in a script and resolve with the chosen index (0 when scripts are stubbed in tests).
export function ask(g, prompt, labels, lead = []) {
  return new Promise((res) => {
    let v = 0;
    const p = g.run([...lead, { t: 'choice', prompt, options: labels.map((text, i) => ({ text, steps: [{ t: 'call', fn: () => { v = i; } }] })) }]);
    (p && p.then ? p : Promise.resolve()).then(() => res(v), () => res(0));
  });
}
export const runP = (g, steps) => { const p = g.run(steps); return p && p.then ? p : Promise.resolve(); };
export const mailOnce = (g, id, from, text) => g.mail(id, from, text);

// ---------------------------------------------------------------- the ticker: events that fire when Misa is free in the world
// defEvent({ key(g) -> unique string | null, where?: Cond, run(g, key) -> Promise })
export const EVENTS = [];
export const defEvent = (e) => { EVENTS.push(e); return e; };
const BUSY = new WeakSet();
export function tick(g, force = false) {
  if (BUSY.has(g) || (!force && !idle(g))) return false;
  const Z = Y(g);
  for (const e of EVENTS) {
    let k; try { k = e.key(g); } catch { k = null; }
    if (!k || Z.done[k]) continue;
    if (e.where && !g.check(e.where)) continue;
    Z.done[k] = g.day; BUSY.add(g);
    const fin = () => BUSY.delete(g);
    let p; try { p = e.run(g, k); } catch (err) { console.warn('sv3y event', k, err); fin(); return false; }
    p && p.then ? p.then(fin, (err) => { console.warn('sv3y event', k, err); fin(); }) : fin();
    return true;
  }
  return false;
}
export const isBusy = (g) => BUSY.has(g);

// ---------------------------------------------------------------- the cast helpers
export const FRIENDS = ['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'ogawa', 'hana', 'tobias', 'mika', 'sachiko', 'jun', 'kiko', 'pip', 'goro'];
export const KOHAI_GROUPS = { 2: ['kh_mio', 'kh_sota', 'kh_nanami'], 3: ['kh_yui', 'kh_ren', 'kh_chiyo'], 4: ['kh_emi', 'kh_tomo', 'kh_lena'] };
export const KOHAI = Object.values(KOHAI_GROUPS).flat();
export const cast = () => all('npc').filter((n) => !n.hidden && n.gifts && !['daifuku', 'kuro'].includes(n.id));
export const topFriends = (g, n = 5) => cast().map((d) => [d.id, g.hearts(d.id)]).sort((a, b) => b[1] - a[1]).slice(0, n);
export const actsEnding = (g) => (g.state.sv3_acts && g.state.sv3_acts.actsEnding) || null;
export const actsDone = (g) => (g.flag('act2_done') ? 1 : 0) + (g.flag('act3_done') ? 1 : 0);
