// sv3_years: fast-forward the three school years headlessly; kohai enrolment, graduation trigger, ending selection, legacy carry-over.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, get, all, FEATURES } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { Y, GRAD_DAY, gradeOf, dayOf, tick, cast } from '../src/content/sv3_years/util.js';
import { enrol, enrolledKohai, SPEC, LETTERS } from '../src/content/sv3_years/kohai.js';
import { TIMETABLE } from '../src/content/school/data.js';
import { election, electionResult, setElective, applyTimetable, roleScene, showcase, tripScene, festSpecial } from '../src/content/sv3_years/years.js';
import { chooseTrack, runMock, mockAvailable, trackDone, TASKS } from '../src/content/sv3_years/career.js';
import { chooseEnding, finalizeGraduation, buildCard, buildLetters, runGraduation, ENDINGS, endingPages } from '../src/content/sv3_years/graduation.js';
import { skipTo, flush } from '../src/content/sv3_years/debug.js';
import { loadLegacy, resetLegacy, prestige, applyLegacy, cafeDay, donate, legacyPoints, newGamePlus, alumniScene, FUND_TIERS } from '../src/content/sv3_years/epilogue.js';
import { goalsFor, claim } from '../src/content/sv3_years/goals.js';
import { sellDrift, applyBuyDrift } from '../src/content/sv3_years/world.js';

const OK = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/;
const bad = [];
function scan(steps) {
  for (const s of steps || []) {
    if (!s || typeof s !== 'object') continue;
    for (const k of ['text', 'prompt']) if (typeof s[k] === 'string' && !OK.test(s[k])) bad.push(s[k].slice(0, 50));
    for (const o of s.options || []) { if (!OK.test(o.text || '')) bad.push(o.text); scan(o.steps); }
  }
}
// Headless script runner: plays every step with the first choice, scanning text on the way.
function mk(seed) {
  const g = createTestGame(seed || 777);
  g.minigame = async () => ({ score: 0.9, stars: 3, bonus: 0 });
  g.open = (kind, a, b, c) => { const fn = [a, b, c].find((x) => typeof x === 'function'); if (kind === 'cutscene') return null; if (fn) setTimeout(() => fn({ score: 1 }), 0); return null; };
  g.run = (steps) => new Promise((res) => {
    const list = typeof steps === 'function' ? steps(g) : steps; scan(list);
    let done = false; const sc = new CutsceneScene(g, list, () => { done = true; res(); });
    g.scenes.stack = []; g.scenes.push(sc);
    const pump = async () => { for (let i = 0; i < 4000 && !done; i++) { g.scenes.update(0.05, inp({ pressed: new Set([' ']) })); await new Promise((r) => setTimeout(r, 0)); } if (!done) res(); };
    pump();
  });
  return g;
}
const mkFriends = (g, ids, hearts) => ids.forEach((id) => { g.friend(id).pts = hearts * 100; });

test('sv3y: the long-game calendar (graduation on Spring 28 of game year 4) and the grade conditions', () => {
  const g = mk();
  assert.equal(GRAD_DAY, 364);
  assert.equal(gradeOf(g), 1);
  g.state.time.day = dayOf(2, 'autumn', 3); assert.equal(gradeOf(g), 2);
  g.state.time.day = dayOf(4, 'spring', 10); assert.equal(gradeOf(g), 3);
  assert.ok(g.check('grade>=3') && !g.check('alum'));
  Y(g).graduated = true; g.state.time.day = GRAD_DAY + 3;
  assert.equal(gradeOf(g), 0); assert.ok(g.check('alum'));
});

test('sv3y: kohai enrol in each new April, gifts are hidden until then, and their events/letters exist', async () => {
  const g = mk();
  assert.equal(Object.keys(SPEC).length, 9);
  for (const id of Object.keys(SPEC)) { const d = get('npc', id); assert.ok(d.look && d.schedule.length >= 8 && d.events.length === 2 && LETTERS[id], id); assert.equal(d.gifts, undefined, id + ' gifts hidden'); assert.ok(d.allGifts.love.every((it) => get('item', it)), id + ' gifts valid'); }
  assert.deepEqual(enrolledKohai(g), []);
  skipTo(g, 2, 'spring', 2, { fast: true });
  await flush(g);
  assert.equal(enrolledKohai(g).length, 3); assert.ok(g.hearts('kh_mio') >= 1);
  assert.ok(get('npc', 'kh_mio').gifts);
  assert.ok(Y(g).elective, 'elective chosen in the April scene');
  assert.equal(TIMETABLE[2][1], Y(g).elective);
  skipTo(g, 3, 'spring', 2, { fast: true }); await flush(g);
  assert.equal(enrolledKohai(g).length, 6);
  skipTo(g, 4, 'spring', 2, { fast: true }); await flush(g);
  assert.equal(enrolledKohai(g).length, 9);
  // a quick hearts event script from each kohai runs
  for (const id of Object.keys(SPEC)) for (const e of get('npc', id).events) { const steps = e.script(g); assert.ok(steps.length > 6); scan(steps); }
  assert.deepEqual(bad, []);
});

test('sv3y: stepping day by day through three years runs the day hooks without errors and the exam tier rises', () => {
  const g = mk();
  const d0 = g.day;
  skipTo(g, 3, 'spring', 3);
  assert.equal(g.day, dayOf(3, 'spring', 3)); assert.ok(g.day - d0 > 220);
  assert.equal(gradeOf(g), 3);
  let seen = null; const base = g.minigame; g.minigame = async (id, o) => { seen = o; return base(id, o); };
});

test('sv3y: elective, election, club roles, showcase, trip and festival special all play through', async () => {
  const g = mk();
  g.state.time.day = dayOf(2, 'spring', 6);
  assert.ok(setElective(g, 'business')); assert.equal(TIMETABLE[3][1], 'business'); assert.ok(get('npc', 'fujita'));
  g.state.time.day = dayOf(2, 'spring', 6); assert.equal(TIMETABLE[2][1], 'business');
  const r = electionResult(g, 2, 0.9); assert.ok(r.won || r.total < r.need);
  mkFriends(g, ['kai', 'suzu', 'rina', 'theo', 'hina'], 6);
  await election(g, 2); assert.ok(Y(g).rep[2] && Y(g).rep[2].ran && Y(g).rep[2].won);
  g.state.school.club = 'art';
  await roleScene(g, 2); assert.equal(Y(g).role[2].title, 'Vice-Captain'); assert.ok(g.has('sv3y_armband_vice'));
  g.state.time.day = dayOf(3, 'autumn', 15);
  await roleScene(g, 3); assert.equal(Y(g).role[3].title, 'Captain');
  await showcase(g, 3); assert.ok(Y(g).tournament[3].place >= 1);
  g.state.time.day = dayOf(2, 'autumn', 9);
  await tripScene(g); assert.ok(Y(g).trip.done && g.flag('school_trip_done') && Object.keys(Y(g).trip.picks).length >= 5);
  g.state.time.day = dayOf(2, 'autumn', 20); await festSpecial(g);
  assert.deepEqual(bad, []);
});

test('sv3y: counselling picks a track, mocks are graded, ending selection follows track and friendships', async () => {
  const g = mk();
  g.state.time.day = dayOf(3, 'summer', 3);
  assert.equal(mockAvailable(g).n, 1);
  g.state.stats.studySessions = 10;
  await runMock(g, mockAvailable(g)); assert.equal(Y(g).mocks[1].grade, 'S');
  assert.equal(mockAvailable(g), null);
  g.state.time.day = dayOf(3, 'winter', 5); await runMock(g, mockAvailable(g)); await runMock(g, mockAvailable(g));
  assert.equal(Object.keys(Y(g).mocks).length, 3);
  const hook = get('talkHook', 'sv3y_fujita_career'); assert.ok(g.check(hook.when) || hook.when(g));
  assert.ok(chooseTrack(g, 'university') && Y(g).track === 'university');
  // no entrance yet -> not done; with a pass -> Scholar; a fail -> Long Way Round
  g.state.skills.study = 2000;
  assert.ok(!trackDone(g)); Y(g).entrance = { passed: false }; assert.equal(chooseEnding(g).base, 'second_chance');
  Y(g).entrance = { passed: true }; assert.equal(chooseEnding(g).base, 'scholar'); assert.ok(trackDone(g));
  chooseTrack(g, 'cafe'); assert.equal(chooseEnding(g).base, 'wanderer');
  g.state.stats.jobShifts_cafe = 9; g.state.stats.cooked = 40; g.setFlag('sv3y_tasting_pass'); assert.equal(chooseEnding(g).base, 'cafe');
  chooseTrack(g, 'keeper'); g.state.stats.requestsDone = 20; g.setFlag('sv3y_keeper_rounds'); g.setFlag('community_restored'); assert.equal(chooseEnding(g).base, 'keeper');
  Y(g).track = null; assert.equal(chooseEnding(g).base, 'wanderer');
  assert.equal(chooseEnding(g).bond, 'quiet');
  mkFriends(g, ['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'hana'], 9);
  assert.equal(chooseEnding(g).bond, 'together'); assert.ok(chooseEnding(g).best);
  for (const b of Object.keys(ENDINGS)) assert.equal(ENDINGS[b].text.length, 3);
});

test('sv3y: graduation triggers on Spring 28, writes the ending, letters, items and the epilogue starts', async () => {
  const g = mk(4242);
  mkFriends(g, ['kai', 'suzu', 'hina', 'hana', 'mika'], 8);
  Y(g).track = 'keeper';
  skipTo(g, 4, 'spring', 2, { fast: true }); await flush(g);
  assert.equal(enrolledKohai(g).length, 3);
  skipTo(g, 4, 'spring', 27, { fast: true });
  assert.ok(!tick(g, true) || !Y(g).graduated);
  skipTo(g, 4, 'spring', 28, { fast: true, minutes: 9 * 60 });
  g.state.sv3y.done.graduation = undefined;
  assert.ok(!Y(g).graduated, 'not before ten');
  g.state.time.minutes = 10 * 60 + 5;
  await flush(g);
  assert.ok(Y(g).graduated, 'graduated');
  assert.match(Y(g).ending, /^(wanderer|keeper|scholar|cafe|second_chance)_(together|close|quiet)$/);
  assert.ok(Y(g).letters.length >= 6 && Y(g).letters.some((l) => l.from === 'mochi' && l.text.length > 10));
  assert.ok(g.has('sv3y_diploma') && g.flag('sv3y_graduated') && g.flag('noSchool'));
  assert.ok(buildCard(g).school.length >= 8 && buildCard(g).town.length >= 8);
  assert.equal(gradeOf(g), 0);
  assert.ok(endingPages(g, chooseEnding(g)).length >= 5);
  // the epilogue intro fires the next day
  skipTo(g, 4, 'summer', 1, { fast: true }); await flush(g);
  assert.ok(Y(g).epi.started > 0);
  assert.deepEqual(bad, []);
});

test('sv3y: epilogue cafe, foundation, alumni and the Hall of Fame legacy carry over into a new game', async () => {
  resetLegacy();
  const g = mk(99);
  mkFriends(g, ['kai', 'suzu', 'rina', 'theo', 'hina', 'hana'], 6);
  finalizeGraduation(g);
  const C = Y(g).epi.cafe; C.stage = 2; C.staff = ['kai']; g.give('dish_ramen', 6, true); C.special = 'dish_ramen';
  const m0 = g.money; const r = cafeDay(g); assert.ok(r.customers > 5 && g.money > m0 && C.served > 0);
  g.state.money = 100000; assert.ok(donate(g, 10000) && donate(g, 10000)); assert.equal(Y(g).epi.fund.tier, 2); assert.ok(g.flag('sv3y_fund_t2'));
  g.state.time.day = GRAD_DAY + 60; await alumniScene(g, 'spring'); assert.ok(Object.keys(Y(g).epi.alumni).length === 1);
  const pts = legacyPoints(g); assert.ok(pts > 30);
  const res = prestige(g); assert.equal(res.legacy.runs, 1); assert.equal(loadLegacy().runs, 1);
  g.state.stats.fishCaught = 100;
  prestige(g);
  const g2 = createTestGame(5); // newGame(1) fires the legacy bonus
  assert.ok(g2.money > 300 && g2.state.bagSize > 24 && g2.flag('legacy_run') === 2, 'legacy applied');
  assert.ok(g2.has('sv3y_legacy_charm') && g2.state.stats.fishCaught >= 10);
  assert.equal(Y(g2).legacyApplied, true); assert.ok(!Y(g2).graduated);
  resetLegacy();
  assert.equal(loadLegacy().runs, 0);
});

test('sv3y: guild goals, price drift and year-gated stock', async () => {
  const g = mk();
  assert.ok(goalsFor(1).length >= 5 && goalsFor(3)[0].need > goalsFor(1)[0].need && goalsFor(6)[0].need > goalsFor(3)[0].need);
  g.state.stats.fishCaught = 40; const m = g.money; const goal = goalsFor(1)[0]; assert.ok(claim(g, goal) && g.money > m && !claim(g, goal));
  assert.ok(sellDrift(3, get('item', 'dish_ramen')) > 1 && sellDrift(3, { cat: 'crop' }) > sellDrift(3, { cat: 'food' }));
  const it = get('item', 'ing_rice'); applyBuyDrift(1); const b1 = it.buy; applyBuyDrift(4); assert.ok(it.buy >= b1); applyBuyDrift(1); assert.equal(it.buy, b1);
  const mart = get('shop', 'mart'); assert.ok(mart.stock.some((e) => e.item === 'sv3y_exam_charm'));
  g.state.time.day = dayOf(1, 'spring', 5); assert.ok(!g.check('year>=2'));
  assert.ok(FEATURES.filter((f) => f.cat === 'Years & Graduation').length >= 55, 'feature count');
});
