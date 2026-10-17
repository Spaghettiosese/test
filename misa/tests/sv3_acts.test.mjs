// Story Acts II and III: chapter order, branching flags, scripts on every branch, the pacing safety net, a headless
// fast-forward through both acts, and the Act IV hooks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, R, get, FEATURES } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { CHAPTERS, S, LETTERS, supportScore, resultOf, supportParts } from '../src/content/sv3_acts/state.js';
import { fastMain, catchUp, skipChapter } from '../src/content/sv3_acts/system.js';
import { chapterList, percentOf, progressOf } from '../src/content/sv3_acts/ui.js';

const NS = Array.from({ length: 31 }, (_, i) => 10 + i);
const tick = () => new Promise((r) => setTimeout(r, 2));
const stepsOf = (g, sc) => (!sc ? [] : typeof sc === 'function' ? sc(g) : sc);

async function runAll(g, steps, choices = []) {
  g.minigame = () => Promise.resolve({ score: 1, stars: 3, bonus: 0 });
  g.open = (kind, a, b, c) => { if (kind === 'cutscene') { const s = new CutsceneScene(g, a, b); g.scenes.push(s); return s; } const done = [a, b, c].find((x) => typeof x === 'function'); if (done) setTimeout(() => done({ score: 1 }), 0); return null; };
  let done = false, picks = 0;
  const sc = new CutsceneScene(g, steps, () => { done = true; });
  g.scenes.stack = []; g.scenes.push(sc);
  const seen = [];
  for (let i = 0; i < 3000 && !done; i++) {
    const top = g.scenes.top;
    if (top && top.step && top.step.t === 'choice' && !top.waiting) { seen.push(top.options.length); top.sel = Math.min(choices[picks] || 0, top.options.length - 1); picks++; }
    g.scenes.update(0.05, inp({ pressed: new Set([' ']) }));
    await new Promise((r) => setTimeout(r, 0));
  }
  return { done, seen };
}
const fresh = () => { const g = createTestGame(); fastMain(g); return g; };

test('Act II and III register 31 chapters in order, each with a quest, an opening script and in-range days', () => {
  assert.deepEqual(Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b), NS);
  for (const n of NS) {
    const c = get('chapter', `sv3_ch${n}`), q = get('quest', `sv3_q${n}`);
    assert.ok(c && q && q.main && q.stages.length >= 1, `chapter ${n}`);
    assert.ok(get('script', `sv3_open${n}`), `open script ${n}`);
    assert.equal(c.quest, `sv3_q${n}`);
    assert.ok(c.teaser && c.summary, `texts ${n}`);
  }
  assert.ok(LETTERS.length === 18 && LETTERS.slice(1).every((l, k) => get('item', `sv3_letter_${k + 1}`)));
  for (const id of ['sv3_sigil', 'sv3_chain', 'sv3_roast', 'sv3_cue', 'sv3_heist']) assert.ok(get('minigame', id).bot, id);
  assert.ok(get('phoneApp', 'sv3_log') && get('shop', 'sv3_emporium'));
  for (const b of ['sv3_letter_desk', 'sv3_cave_stars', 'sv3_harbour_mural', 'sv3_midsummer', 'sv3_typhoon', 'sv3_hundred_lights', 'sv3_council', 'sv3_camp', 'sv3_heist', 'sv3_stage', 'sv3_hearing', 'sv3_envelopes']) assert.ok(get('backdrop', b), b);
  assert.ok(FEATURES.filter((f) => f.cat === 'Story Acts').length >= 55);
});

test('chapters start strictly in order from the finale, each only after the previous is done', async () => {
  const g = fresh();
  let day = 29;
  for (const n of NS) {
    if (n === 32) day = Math.max(day + 1, 188);
    day = Math.max(day + 1, CHAPTERS[n].day);
    g.state.time.day = day; g.state.time.minutes = 20 * 60; g.state.weather = n === 17 ? 'storm' : 'sunny';
    if (n === 40) g.setFlag('a3_eval_seen');
    if (n < 40) assert.equal(g.state.story.started[n + 1], undefined);
    g.story.checkChapters(null); await tick();
    assert.ok(g.state.story.started[n] !== undefined, `chapter ${n} should start on day ${day}`);
    g.story.checkChapters(null); await tick();
    assert.equal(g.state.story.started[n + 1], undefined, `chapter ${n + 1} must wait`);
    g.completeQuest(`sv3_q${n}`); await tick();
    assert.ok(g.flag(`chapter_${n}_done`), `chapter ${n} done flag`);
  }
  assert.ok(g.flag('act2_done') && g.flag('act3_done'));
});

test('chapter 11 waits for the next day and the later chapters respect their dates', async () => {
  const g = fresh();
  g.state.time.day = 29; g.state.time.minutes = 9 * 60; g.story.checkChapters(null); await tick();
  assert.ok(g.state.story.started[10] !== undefined);
  g.completeQuest('sv3_q10'); await tick();
  g.story.checkChapters(null); await tick();
  assert.equal(g.state.story.started[11], undefined, 'same day');
  g.state.time.day = 30; g.story.checkChapters(null); await tick();
  assert.ok(g.state.story.started[11] !== undefined);
  // Chapter 14 (midsummer night) needs summer 19 or later
  g.completeQuest('sv3_q11'); g.state.time.day = 31; g.story.checkChapters(null); await tick();
  g.completeQuest('sv3_q12'); g.state.time.day = 32; g.story.checkChapters(null); await tick();
  g.completeQuest('sv3_q13'); g.state.time.day = 33; g.story.checkChapters(null); await tick();
  assert.equal(g.state.story.started[14], undefined, 'too early for the bonfire');
  g.state.time.day = 47; g.story.checkChapters(null); await tick();
  assert.ok(g.state.story.started[14] !== undefined);
});

test('every stage script of every chapter finishes on every choice branch (and sticks to the pixel font)', async () => {
  const ok = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/, bad = [];
  const scan = (v, where) => { if (typeof v === 'string' && !ok.test(v)) bad.push(`${where}: ${v.slice(0, 40)}`); };
  const texts = (steps, where) => { for (const s of steps || []) { if (!s || typeof s !== 'object') continue; scan(s.text, where); (s.options || []).forEach((o) => { scan(o.text, where); texts(o.steps, where); }); texts(s.then, where); texts(s.else, where); } };
  const failures = [];
  for (const n of NS) {
    const q = get('quest', `sv3_q${n}`);
    for (const [i, st] of q.stages.entries()) {
      const typ = typeof st.text === 'function' ? st.text(createTestGame()) : st.text;
      scan(typ, `q${n} s${i} text`); scan(st.hint, `q${n} s${i} hint`);
      if (!st.script) continue;
      const queue = [[]]; let runs = 0;
      while (queue.length && runs < 10) {
        const choices = queue.shift(); runs++;
        const g = createTestGame(); fastMain(g);
        const steps = stepsOf(g, st.script); texts(steps, `q${n} s${i}`);
        const r = await runAll(g, steps, choices);
        if (!r.done) { failures.push(`q${n} stage ${i} (choices ${choices.join(',')}) did not finish`); break; }
        r.seen.forEach((cnt, depth) => { if (depth >= choices.length) for (let k = 1; k < cnt; k++) queue.push([...choices, ...r.seen.slice(choices.length, depth).map(() => 0), k]); });
      }
    }
    const c = get('chapter', `sv3_ch${n}`);
    scan(c.name, `ch${n} name`); scan(c.teaser, `ch${n} teaser`); scan(c.summary, `ch${n} summary`);
  }
  for (let k = 1; k < LETTERS.length; k++) { scan(LETTERS[k][0], `letter ${k}`); scan(LETTERS[k][1], `letter ${k}`); }
  assert.deepEqual(failures, [], failures.join('\n'));
  assert.deepEqual(bad.slice(0, 10), [], bad.join('\n'));
});

test('choice points set their flags and later chapters read them back', async () => {
  const run = async (n, i, choices) => { const g = fresh(); const q = get('quest', `sv3_q${n}`); const r = await runAll(g, stepsOf(g, q.stages[i].script), choices); assert.ok(r.done); return g; };
  assert.equal((await run(12, 2, [0])).flag('a2_cp1'), 'hana');
  assert.equal((await run(12, 2, [1])).flag('a2_cp1'), 'secret');
  assert.equal((await run(12, 2, [2])).flag('a2_cp1'), 'tobias');
  assert.equal((await run(17, 0, [0])).flag('a2_cp2'), 'hana');
  assert.equal((await run(17, 0, [1])).flag('a2_cp2'), 'jun');
  assert.equal((await run(17, 0, [2])).flag('a2_cp2'), 'home');
  assert.equal((await run(21, 1, [0])).flag('a2_cp3'), 'lanterns');
  assert.equal((await run(21, 1, [2])).flag('a2_cp3'), 'free');
  assert.equal((await run(22, 1, [0])).flag('a2_reveal'), 'open');
  assert.equal((await run(22, 1, [1])).flag('a2_reveal'), 'secret');
  const bell = await run(24, 2, [0]), boats = await run(24, 2, [1]);
  assert.equal(bell.flag('a2_finale'), 'bell'); assert.ok(bell.has('sv3_tide_bell'));
  assert.equal(boats.flag('a2_finale'), 'boats'); assert.ok(boats.has('sv3_boat_lantern'));
  assert.ok(bell.flag('a2_tl_lighthouse'));
  // dialogue differs by an earlier choice: Chapter 16's Mr. Wren hook
  const texts = async (flag) => { const g = fresh(); g.setFlag('a2_cp1', flag); g.state.quests.sv3_q16 = { stage: 1, done: false }; const h = get('talkHook', 'sv3_h16_1'); return JSON.stringify(h.steps(g, {})); };
  const [a, b, c] = [await texts('hana'), await texts('secret'), await texts('tobias')];
  assert.ok(a !== b && b !== c && a !== c);
});

test('the Act III role, tent and hearing choices work and the hearing result follows the support score', async () => {
  const run = async (n, i, choices, prep = () => {}) => { const g = fresh(); prep(g); const q = get('quest', `sv3_q${n}`); const r = await runAll(g, stepsOf(g, q.stages[i].script), choices); assert.ok(r.done); return g; };
  for (const [k, v] of [[0, 'lead'], [1, 'spirit'], [2, 'crew'], [3, 'music']]) assert.equal((await run(31, 0, [k])).flag('a3_role'), v);
  assert.equal((await run(29, 1, [1])).flag('a3_tent'), 'suzu');
  const poor = await run(37, 1, [0]);
  assert.equal(poor.flag('a3_result'), 'reprieve');
  const rich = await run(37, 1, [0], (g) => { g.setFlag('community_restored'); g.setFlag('act2_done'); g.state.money = 9000; const s = S(g); Object.assign(s.support, { sig: 5, recruits: 4, testimonies: 4, pledge: 1500 }); for (const id of ['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'ogawa', 'hana', 'tobias', 'mika', 'sachiko', 'jun', 'kiko', 'pip', 'goro']) g.state.friends[id] = { pts: 900 }; g.state.svlife = { evals: { 1: { total: 6000 } } }; });
  assert.ok(['saved', 'partial'].includes(rich.flag('a3_result')), rich.flag('a3_result'));
  assert.ok(supportScore(rich) > supportScore(poor));
  assert.equal(resultOf(80), 'saved'); assert.equal(resultOf(50), 'partial'); assert.equal(resultOf(10), 'reprieve');
  assert.equal(supportParts(rich).length, 8);
});

test('the signature, recruit and witness counters finish their stages', async () => {
  const g = fresh();
  g.state.time.day = 120; g.state.story.started[26] = 1; g.setFlag('chapter_26_done'); g.state.story.doneDay[26] = 119;
  g.story.checkChapters(null); await tick();
  g.state.quests.sv3_q27 = { stage: 1, done: false };
  for (const npc of ['mika', 'sachiko', 'jun', 'goro', 'kiko']) { const h = get('talkHook', `sv3_c27_${npc}`); assert.equal(h.when.length, 2); const sink = await runAll(g, h.steps(g, {})); assert.ok(sink.done); }
  await tick();
  assert.equal(S(g).support.sig, 5);
  assert.equal(g.quest('sv3_q27').stage, 2);
});

test('the pacing safety net skips late chapters with default flags and a note, in order', async () => {
  const g = fresh();
  g.state.time.day = 49; g.state.time.minutes = 8 * 60; // after chapter 10..13 deadlines
  assert.ok(catchUp(g) >= 4);
  for (const n of [10, 11, 12, 13]) assert.ok(g.flag(`chapter_${n}_done`), `ch${n}`);
  assert.equal(g.flag('a2_cp1'), 'secret'); assert.ok(g.flag('a2_tl_cave') && g.flag('a2_tl_harbour'));
  assert.ok(g.state.mail.some((m) => m.id === 'sv3_skip_12'));
  assert.ok(!g.flag('chapter_14_done'), 'chapter 14 deadline is day 56');
  assert.ok(skipChapter(g, 14) && g.flag('chapter_14_done'));
});

test('headless fast-forward through the whole year: Act II ends before Winter 28, Act III reaches the cliffhanger and hooks Act IV', async () => {
  const g = fresh();
  const events = [];
  g.bus.on('actsComplete', (e) => events.push(e)); g.bus.on('act2Complete', (e) => events.push(e));
  const bad = [];
  for (let day = 29; day <= 224; day++) {
    g.state.time.day = day; g.state.time.minutes = 8 * 60;
    g.bus.emit('dayStart', { day }); await tick();
    if (day === 112) { g.state.time.minutes = 16 * 60 + 40; g.bus.emit('hour', {}); }
    if (day === 112) assert.ok(g.flag('chapter_24_done'), 'Act II must end by Winter 28 before the evaluation');
    for (const n of NS) if (n < 40 && day > CHAPTERS[n].by && !g.flag(`chapter_${n}_done`) && g.flag(`chapter_${n - 1}_done`)) bad.push(`ch${n} day ${day}`);
  }
  assert.deepEqual(bad, []);
  assert.ok(g.flag('act2_done') && !g.flag('act3_done'));
  assert.ok(g.flag('chapter_39_done') && !g.flag('chapter_40_done'));
  assert.ok(g.flag('a3_result'), 'the hearing result is always decided');
  g.state.time.minutes = 22 * 60;
  g.bus.emit('svEvaluation', { year: 2, lanterns: 2, total: 3000 }); await new Promise((r) => setTimeout(r, 80));
  assert.ok(g.state.story.started[40] !== undefined, 'the cliffhanger starts after the Year 2 evaluation');
  // choose the study envelope
  const q = get('quest', 'sv3_q40'), r = await runAll(g, stepsOf(g, q.stages[0].script), [1]);
  assert.ok(r.done); assert.equal(S(g).actsEnding, 'study'); assert.equal(g.flag('acts_ending'), 'study');
  g.completeQuest('sv3_q40'); await tick();
  assert.ok(g.flag('act3_done'));
  const done = events.find((e) => e.ending);
  assert.ok(done && done.ending === 'study' && typeof done.support === 'number');
  assert.ok(events.some((e) => e.reveal !== undefined || e.ending !== undefined));
  assert.ok(g.sv3.status().act3);
});

test('the Story Log counts progress and the console jump helper works', async () => {
  const g = fresh();
  assert.equal(percentOf(g), 0); assert.equal(chapterList().length, 31);
  assert.ok(g.sv3.jump(25));
  await tick();
  assert.ok(g.flag('chapter_24_done') && g.flag('act2_done') && g.state.time.day >= 113);
  assert.equal(progressOf(g, 2).done, 15); assert.ok(percentOf(g) >= 48);
  g.story.checkChapters(null); await tick();
  assert.ok(g.state.story.started[25] !== undefined);
  assert.ok(get('phoneApp', 'sv3_log').items(g, { state: { tab: 0 } }).length >= 2);
  assert.ok(get('phoneApp', 'story_diary').items(g, { state: { tab: 0 } }).every((c) => c.n <= 9));
});
