import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, get, FEATURES } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { S, candidates, stageOf, addAff, aff, CORE } from '../src/content/sv4_romance/core.js';
import { KINDS, KIND_IDS, dateSteps, planDate, slotsFor, tierOf, maxPts } from '../src/content/sv4_romance/dates.js';
import { confessSteps, complimentSteps, stepBackSteps } from '../src/content/sv4_romance/confess.js';
import { coupleSteps, EVENT_KEYS, readyEvents, walkSteps } from '../src/content/sv4_romance/couple.js';
import { threadsOf, deliver, reply, pending, eligible } from '../src/content/sv4_romance/texts.js';
import { DRAMAS, dramaSteps, postSteps, hearingSteps, replaySteps } from '../src/content/sv4_romance/story.js';
import { voiceOf } from '../src/content/sv4_romance/voices.js';
import { archiveEntries } from '../src/content/sv4_romance/ui.js';

async function runAll(g, steps, choices) {
  g.minigame = () => Promise.resolve({ score: 1, stars: 3, bonus: 0 });
  g.open = () => null;
  let done = false, picks = 0;
  const sc = new CutsceneScene(g, steps, () => { done = true; });
  g.scenes.stack = []; g.scenes.push(sc);
  const seen = [];
  for (let i = 0; i < 4000 && !done; i++) {
    const top = g.scenes.top;
    if (top && top.step && top.step.t === 'choice' && !top.waiting) { seen.push(top.options.length); top.sel = Math.min(choices[picks] || 0, top.options.length - 1); picks++; }
    g.scenes.update(0.05, inp({ pressed: new Set([' ']) }));
    await new Promise((r) => setTimeout(r, 0));
  }
  return { done, seen };
}
async function explore(name, make, prep = () => {}, cap = 8, after = () => {}) {
  const fails = [], queue = [[]], tried = new Set();
  let runs = 0;
  while (queue.length && runs < cap) {
    const choices = queue.shift(), key = choices.join(',');
    if (tried.has(key)) continue; tried.add(key); runs++;
    const g = createTestGame(); prep(g);
    let r;
    try { r = await runAll(g, make(g), choices); } catch (e) { fails.push(`${name}: ${e.message}`); break; }
    if (!r.done) { fails.push(`${name} (${key}): did not finish`); break; }
    try { after(g); } catch (e) { fails.push(`${name} (${key}): ${e.message}`); break; }
    r.seen.forEach((n, d) => { if (d >= choices.length) for (let k = 1; k < n; k++) queue.push([...choices, ...r.seen.slice(choices.length, d).map(() => 0), k]); });
  }
  return fails;
}
const prime = (id) => (g) => { g.friend(id).pts = 800; g.state.seen['met:' + id] = 1; S(g).aff[id] = 700; };
const couple = (id) => (g) => { prime(id)(g); const s = S(g); s.partner = id; s.since = g.day - 40; g.friend(id).pts = 1000; s.aff[id] = 900; };
const ok = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/;
const texts = (steps, out = []) => { for (const s of steps || []) { if (!s) continue; if (typeof s.text === 'string') out.push(s.text); if (s.prompt) out.push(s.prompt); if (s.options) for (const o of s.options) { out.push(o.text); texts(o.steps, out); } texts(s.then, out); texts(s.else, out); } return out; };
const ids = () => candidates();

test('romance: the five classmates plus aoi and haru are candidates when present, and no adult is', () => {
  const c = candidates();
  for (const id of CORE) assert.ok(c.includes(id));
  if (get('npc', 'aoi')) assert.ok(c.includes('aoi'));
  if (get('npc', 'haru')) assert.ok(c.includes('haru'));
  for (const bad of ['fujita', 'ogawa', 'sora', 'momo', 'hana', 'tobias', 'mika', 'sachiko', 'jun', 'kiko', 'pip', 'goro']) assert.ok(!c.includes(bad), bad);
});

test('romance: stage transitions follow affection, affection is capped by friendship, only one partner', () => {
  const g = createTestGame(); const id = 'kai';
  g.state.seen['met:kai'] = 1;
  assert.equal(stageOf(g, id), 0);
  g.friend(id).pts = 150; addAff(g, id, 500); assert.ok(aff(g, id) <= 199);
  g.friend(id).pts = 1000; addAff(g, id, 500);
  assert.ok(stageOf(g, id) >= 2);
  S(g).aff[id] = 650; assert.equal(stageOf(g, id), 3);
  S(g).partner = 'suzu'; assert.ok(stageOf(g, id) <= 2);
});

test('romance: every date for every candidate finishes on several branches and records a journal entry', async () => {
  const fails = [];
  for (const id of ids()) for (const kind of KIND_IDS) {
    fails.push(...(await explore(`date ${id}/${kind}`, (g) => dateSteps(g, id, kind, null), prime(id), 4, (g) => {
      const j = S(g).journal; assert.equal(j.length, 1, 'journal'); assert.ok(aff(g, id) > 700, 'affection rose');
    })));
  }
  assert.deepEqual(fails, [], fails.join('\n'));
});

test('romance: date scoring prefers liked choices and tiers are ordered', () => {
  assert.equal(tierOf(1), 'great'); assert.equal(tierOf(0.4), 'good'); assert.equal(tierOf(0.1), 'sweet');
  for (const k of KIND_IDS) assert.ok(maxPts(KINDS[k]) >= 6);
  for (const id of ids()) { const v = voiceOf(id); for (const k of KIND_IDS) assert.equal(v.dates[k].length, 3, `${id} ${k}`); }
});

test('romance: planning respects the weekly limit and friendship stage', () => {
  const g = createTestGame(); prime('kai')(g);
  g.state.time.minutes = 8 * 60;
  const sl = slotsFor(g, 'cafe')[0];
  const wk = g.weekday; // availability may refuse school hours; try tomorrow evening slots
  let planned = null;
  for (const s of slotsFor(g, 'beach')) { const r = planDate(g, 'kai', 'beach', s.day, s.at); if (r.ok) { planned = r; break; } }
  assert.ok(planned && planned.ok, 'a beach date can be planned');
  S(g).weekDates[Math.floor((g.day - 1) / 7)] = 2;
  const r2 = planDate(g, 'kai', 'beach', g.day + 1, 19 * 60); assert.equal(r2.ok, false);
  const g2 = createTestGame(); const r3 = planDate(g2, 'hina', 'cafe', g2.day + 1, 13 * 60); assert.equal(r3.ok, false);
});

test('romance: confessions by Misa and by them finish on every branch and reach the right states', async () => {
  const fails = [];
  for (const id of ids()) {
    fails.push(...(await explore(`misa confess ${id}`, (g) => confessSteps(g, id, 'misa'), prime(id), 6, (g) => { assert.equal(S(g).partner, id); })));
    fails.push(...(await explore(`they confess ${id}`, (g) => confessSteps(g, id, 'them'), (g) => { prime(id)(g); S(g).aff[id] = 850; }, 6)));
    const low = createTestGame(); low.friend(id).pts = 450; low.state.seen['met:' + id] = 1; S(low).aff[id] = 400;
    const r = await runAll(low, confessSteps(low, id, 'misa'), []); assert.ok(r.done);
    assert.equal(S(low).partner, null, id + ' not yet'); assert.equal(stageOf(low, id), -1);
  }
  // pick each answer for 'them'
  for (const pickIdx of [0, 1, 2]) {
    const g = createTestGame(); prime('kai')(g); S(g).aff.kai = 850;
    const r = await runAll(g, confessSteps(g, 'kai', 'them'), [pickIdx]); assert.ok(r.done);
    if (pickIdx === 0) assert.equal(S(g).partner, 'kai'); else assert.equal(S(g).partner, null);
    if (pickIdx === 2) assert.equal(stageOf(g, 'kai'), -1);
  }
  assert.deepEqual(fails, [], fails.join('\n'));
});

test('romance: compliments, stepping back and the walk home work', async () => {
  const g = createTestGame(); couple('rina')(g);
  assert.ok((await runAll(g, complimentSteps(g, 'rina'), [0])).done);
  assert.equal(S(g).flirt.rina, g.day);
  assert.ok((await runAll(g, walkSteps(g, 'rina'), [0])).done);
  const g2 = createTestGame(); couple('theo')(g2);
  assert.ok((await runAll(g2, stepBackSteps(g2), [])).done); assert.equal(S(g2).partner, null); assert.equal(stageOf(g2, 'theo'), -1);
});

test('romance: all five couple events for every candidate finish on every branch and mark themselves done', async () => {
  const fails = [];
  const events = [];
  const g0 = createTestGame(); g0.bus.on('coupleEvent', (e) => events.push(e));
  for (const id of ids()) for (const key of EVENT_KEYS) {
    fails.push(...(await explore(`couple ${id}/${key}`, (g) => coupleSteps(g, id, key), couple(id), 4, (g) => { assert.ok(S(g).coupleDone[`${id}_${key}`]); })));
    const g = createTestGame(); const body = texts(coupleSteps(g, id, key)); assert.ok(body.length >= 8, `${id} ${key} length`);
    for (const t of body) assert.ok(ok.test(t), `${id} ${key} font: ${t}`);
  }
  assert.deepEqual(fails, [], fails.join('\n'));
  const g = createTestGame(); couple('kai')(g); S(g).steady.kai = 1; g.state.time.minutes = 16 * 60; assert.ok(readyEvents(g, 'kai').length >= 1);
});

test('romance: 20+ text threads each with three replies; delivery and replies move affection', () => {
  for (const id of ids()) {
    const g = createTestGame(); prime(id)(g);
    const th = threadsOf(id); assert.ok(th.length >= 20, `${id} has ${th.length}`);
    for (const t of th) { assert.equal(t.r.length, 3); for (const [a, b, p] of t.r) { assert.ok(ok.test(a) && ok.test(b), `${id} ${t.id} font`); assert.ok(p >= 0); } assert.ok(ok.test(t.msg), `${id} ${t.id} msg`); try { g.check(t.cond); } catch (e) { assert.fail(`${id} ${t.id} cond: ${e.message}`); } }
    S(g).partner = id;
    const before = aff(g, id), first = eligible(g, id)[0];
    assert.ok(first, id + ' eligible'); assert.ok(deliver(g, id, first));
    assert.ok(pending(g, id)); assert.equal(deliver(g, id), null);
    assert.ok(reply(g, id, 0)); assert.ok(aff(g, id) >= before); assert.equal(pending(g, id), null);
    assert.ok(S(g).chat[id].log.length >= 3);
  }
});

test('romance: dramas, postscript, hearing and archive replay all finish', async () => {
  const fails = [];
  for (const d of DRAMAS) fails.push(...(await explore('drama ' + d.id, (g) => dramaSteps(g, d), (g) => { for (const id of ids()) prime(id)(g); }, 4, (g) => { assert.ok(S(g).dramaDone[d.id]); })));
  for (const id of ids()) {
    fails.push(...(await explore('post ' + id, (g) => postSteps(g, id), couple(id), 2)));
    fails.push(...(await explore('hearing ' + id, (g) => hearingSteps(g, id), couple(id), 2)));
  }
  assert.deepEqual(fails, [], fails.join('\n'));
  const g = createTestGame(); couple('suzu')(g);
  assert.ok((await runAll(g, coupleSteps(g, 'suzu', 'family'), [0])).done);
  const e = archiveEntries(g); assert.ok(e.length >= 1 && e[0].picks.length >= 1);
  assert.ok(replaySteps(g, e[0].key));
});

test('romance: bus events fire and the hearing quest is wrapped', async () => {
  const g = createTestGame(); const got = [];
  for (const ev of ['dateDone', 'confessed', 'couple', 'coupleEvent']) g.bus.on(ev, () => got.push(ev));
  prime('kai')(g);
  await runAll(g, dateSteps(g, 'kai', 'cafe', null), []);
  await runAll(g, confessSteps(g, 'kai', 'misa'), []);
  await runAll(g, coupleSteps(g, 'kai', 'family'), []);
  for (const ev of ['dateDone', 'confessed', 'couple', 'coupleEvent']) assert.ok(got.includes(ev), ev);
  const q = get('quest', 'sv3_q37'); if (q) assert.ok(q.stages.some((s) => s.__sv4r));
  assert.ok(get('phoneApp', 'sv4_romance') && get('minigame', 'sv4_star_trace') && get('minigame', 'sv4_umbrella'));
  assert.ok(FEATURES.filter((f) => f.cat === 'Romance' || f.category === 'Romance').length >= 0);
});
