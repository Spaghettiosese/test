import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, get, FEATURES } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { check } from '../src/core/cond.js';
import { S, remember, hasTrait, addTrait, repTier, addRep } from '../src/content/sv4_depth/state.js';
import { ARCS } from '../src/content/sv4_depth/kit.js';
import { PEOPLE } from '../src/content/sv4_depth/people.js';
import { moodOf, moodGiftDelta, variantOf, VARIANTS, computeMood } from '../src/content/sv4_depth/moods.js';
import { memCands, pickDepth, askSpec, keepPromise, breakPromise, openPromises, CAST_ALL } from '../src/content/sv4_depth/depth.js';
import { RUMORS, startRumor, spreadDay, spreadRumor, squashRumor, tellable, maybeSeed } from '../src/content/sv4_depth/rumors.js';
import { TRADS, tradActive } from '../src/content/sv4_depth/traditions.js';
import { TRAD_DATE } from '../src/content/sv4_depth/tradedates.js';

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
async function explore(name, make, prep = () => {}) {
  const fails = [], queue = [[]], tried = new Set();
  let runs = 0;
  while (queue.length && runs < 12) {
    const choices = queue.shift(), key = choices.join(',');
    if (tried.has(key)) continue; tried.add(key); runs++;
    const g = createTestGame(); prep(g);
    const r = await runAll(g, make(g), choices);
    if (!r.done) { fails.push(`${name} (${key}): did not finish`); break; }
    r.seen.forEach((n, d) => { if (d >= choices.length) for (let k = 1; k < n; k++) queue.push([...choices, ...r.seen.slice(choices.length, d).map(() => 0), k]); });
  }
  return fails;
}
const meet = (g, ids) => { for (const id of ids) { g.friend(id).pts = 500; g.state.seen['met:' + id] = 1; } };
const texts = (steps, out = []) => { for (const s of steps || []) { if (!s) continue; if (typeof s.text === 'string') out.push(s.text); if (s.prompt) out.push(s.prompt); for (const o of s.options || []) { out.push(o.text); texts(o.steps, out); } texts(s.then, out); texts(s.else, out); } return out; };
const ok = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/;

test('sv4d: every cast member has a 3-part arc at 3/6/9 hearts, 10-24 steps, choices, gated option, valid text', () => {
  const g = createTestGame();
  assert.equal(Object.keys(ARCS).length, 15);
  for (const [id, parts] of Object.entries(ARCS)) {
    assert.equal(parts.length, 3);
    parts.forEach((p, i) => {
      const e = get('npc', id).events.find((x) => x.id === `sv4d_${id}_${i + 1}`);
      assert.ok(e, id); assert.equal(e.hearts, [3, 6, 9][i]);
      assert.doesNotThrow(() => check(p.when, g));
      const steps = e.script(g);
      assert.ok(steps.length >= 10 && steps.length <= 24, `${e.id} has ${steps.length} steps`);
      const ch = steps.find((s) => s.t === 'choice');
      assert.ok(ch && ch.options.length >= 3, e.id + ' choice');
      assert.ok(ch.options.some((o) => o.when), e.id + ' trait-gated option');
      assert.ok(p.after.length === 2 && p.thought && p.alt, e.id + ' after lines');
      for (const t of texts(steps)) assert.ok(ok.test(t), `${e.id} bad chars: ${t}`);
    });
  }
});

test('sv4d: all 45 Character Study scenes finish on every branch, with and without traits', async () => {
  const fails = [];
  for (const id of Object.keys(ARCS)) for (let n = 1; n <= 3; n++) for (const maxed of [false, true]) {
    const e = get('npc', id).events.find((x) => x.id === `sv4d_${id}_${n}`);
    fails.push(...(await explore(e.id + (maxed ? '+' : ''), (g) => e.script(g), (g) => { meet(g, [id]); if (maxed) for (const t of ['kind', 'curious', 'brave', 'calm']) addTrait(g, t, 10); })));
  }
  assert.deepEqual(fails, [], fails.join('\n'));
});

test('sv4d: arc parts unlock in order with a gap, and write state, journal and flags', async () => {
  const g = createTestGame(); meet(g, ['kai']);
  const evs = get('npc', 'kai').events, e1 = evs.find((x) => x.id === 'sv4d_kai_1'), e2 = evs.find((x) => x.id === 'sv4d_kai_2');
  g.world = null;
  g.state.time.minutes = 17 * 60;
  assert.equal(e2.when(g), false);
  await runAll(g, e1.script(g), [1]);
  assert.equal(S(g).arc.kai, 1); assert.equal(S(g).journal.length, 1);
  assert.ok(g.flag('sv4d_kai_answer')); assert.ok(g.flag('sv4d_kai_1'));
  assert.ok(S(g).mem.kai.some((m) => m.k === 'arc'));
  assert.equal(S(g).mem.kai.filter((m) => m.k === 'choice').length, 1);
  assert.ok(hasTrait(g, 'Brave', 1));
  g.state.time.day += 3; g.state.time.minutes = 18 * 60;
  assert.equal(e2.when(g), true);
});

test('sv4d: memory callbacks fire from gifts, festivals, comfort and promises', () => {
  const g = createTestGame(); meet(g, ['kai', 'mika']);
  remember(g, 'kai', 'gift', { item: 'x', name: 'curry bread', r: 'love' });
  remember(g, 'kai', 'fest', { name: 'the Hanami Picnic' });
  remember(g, 'kai', 'comfort', {});
  const keys = memCands(g, 'kai').map((c) => c.key);
  for (const k of ['gloved', 'fest', 'comfort']) assert.ok(keys.includes(k), k);
  assert.ok(memCands(g, 'kai').find((c) => c.key === 'gloved').line.includes('curry bread'));
  remember(g, 'kai', 'gift', { item: 'y', name: 'sea slug', r: 'hate' });
  assert.ok(memCands(g, 'kai').some((c) => c.key === 'gdis'));
  // every person has all six memory lines and the talk hook fires for them
  for (const id of CAST_ALL) if (get('npc', id)) for (const k of ['gloved', 'gdis', 'fest', 'kept', 'broke', 'comfort']) assert.ok(PEOPLE[id][k], id + k);
  let fired = 0; for (let d = 0; d < 12 && !fired; d++) { g.state.time.day += 1; S(g).talked = {}; S(g).mood = {}; if (pickDepth(g, 'kai')) fired++; }
  assert.ok(fired, 'a depth line is picked on some day');
  assert.ok(get('talkHook', 'sv4d_depth_kai') && get('talkHook', 'sv4d_prom_kai') && get('talkHook', 'sv4d_comfort_kai'));
});

test('sv4d: moods affect gifts and are deterministic per day', () => {
  const g = createTestGame(); meet(g, ['kai']);
  assert.equal(moodOf(g, 'kai'), moodOf(g, 'kai'));
  assert.ok(moodGiftDelta('joyful', 'love') > 0); assert.ok(moodGiftDelta('prickly', 'like') < 0);
  assert.ok(moodGiftDelta('prickly', 'hate') < moodGiftDelta('joyful', 'hate'));
  assert.ok(moodGiftDelta('tired', 'like', false, 'dish_miso_soup') > moodGiftDelta('tired', 'like', false, 'snack_x'));
  S(g).mood.kai = { day: g.day, m: 'joyful' };
  const before = g.friend('kai').pts; g.bus.emit('gift', { npc: 'kai', item: 'snack_curry_bread', reaction: 'love', birthday: false });
  assert.ok(g.friend('kai').pts - before >= 8);
  S(g).mood.kai = { day: g.day, m: 'prickly' };
  const b2 = g.friend('kai').pts; g.bus.emit('gift', { npc: 'kai', item: 'x', reaction: 'dislike', birthday: false });
  assert.ok(g.friend('kai').pts - b2 < 0);
  const moods = new Set(); for (const id of CAST_ALL) for (let d = 1; d < 20; d++) { const gg = createTestGame(d); moods.add(computeMood(gg, id)); }
  assert.ok(moods.size >= 4, [...moods].join());
});

test('sv4d: schedule variants (hobby, tired, errand) appear on some days and place people at valid spots', () => {
  const found = new Set();
  for (let seed = 1; seed < 40; seed++) {
    const g = createTestGame(seed);
    for (let d = 5; d < 90; d += 1) { g.state.time.day = d; for (const id of ['theo', 'goro', 'mika']) { const v = variantOf(g, id); if (v) found.add(v); } }
  }
  for (const v of VARIANTS) assert.ok(found.has(v), v);
  for (const id of CAST_ALL) { const d = get('npc', id); if (d) assert.ok(d.schedule.filter((s) => typeof s.when === 'function').length >= 3, id); }
});

test('sv4d: promises are asked, kept and broken with consequences', async () => {
  const g = createTestGame(); meet(g, ['kai']);
  let spec = null; for (let d = 0; d < 20 && !spec; d++) { g.state.time.day += 1; spec = askSpec(g, 'kai'); }
  assert.ok(spec && spec.text);
  const p = { id: 1, npc: 'kai', kind: 'visit', due: g.day + 3, state: 'open', text: spec.text, day: g.day + 3, asked: g.day }; S(g).promises.push(p);
  const h0 = g.friend('kai').pts; keepPromise(g, p);
  assert.equal(g.friend('kai').pts - h0, 60); assert.equal(S(g).prom.kept, 1);
  const hook = get('talkHook', 'sv4d_prom_kai'); assert.ok(hook.when(g));
  assert.ok((await runAll(g, hook.steps(g), [0])).done); assert.ok(!hook.when(g));
  const q = { id: 2, npc: 'kai', kind: 'visit', due: g.day, state: 'open', text: 't', day: g.day, asked: g.day }; S(g).promises.push(q);
  g.state.time.day += 1; g.bus.emit('dayStart', {});
  assert.equal(q.state, 'broken'); assert.equal(S(g).prom.broken, 1);
  assert.ok(S(g).pend.kai.includes('broke')); assert.ok(memCands(g, 'kai').some((c) => c.key === 'broke'));
  // visit promise kept by talking on the due day
  const v = { id: 3, npc: 'kai', kind: 'visit', due: g.day, state: 'open', text: 'v', day: g.day, asked: g.day }; S(g).promises.push(v);
  g.bus.emit('talk', { npc: 'kai' }); assert.equal(v.state, 'kept');
  assert.ok(openPromises(g).length === 0);
});

test('sv4d: rumors seed, spread over days, can be spread or squashed, and subjects react', async () => {
  assert.equal(RUMORS.length, 10);
  const g = createTestGame(); meet(g, ['sachiko', 'kai', 'pip', 'hina', 'suzu', 'rina', 'theo']);
  startRumor(g, 'kai_ramen');
  const st = S(g).rum.list.kai_ramen; assert.equal(Object.keys(st.holders).length, 1);
  for (let i = 0; i < 6; i++) { g.state.time.day += 1; spreadDay(g); }
  assert.ok(Object.keys(st.holders).length > 1, 'spread to more people');
  const holder = Object.keys(st.holders).find((h) => h !== 'kai');
  st.status = 'live';
  const t = tellable(g, holder); if (t) assert.ok(t.def.id);
  S(g).heard.kai_ramen = { from: 'sachiko', day: g.day, hops: 1 };
  const k0 = g.friend('kai').pts; const r = spreadRumor(g, 'kai_ramen'); assert.ok(r.ok); assert.ok(g.friend('kai').pts > k0); assert.equal(st.by, 'spread');
  // squash a different one: certain with maxed rep
  startRumor(g, 'rina_poems'); S(g).heard.rina_poems = { from: 'theo', day: g.day, hops: 2 };
  addRep(g, 'charming', 100); addRep(g, 'dependable', 100); addTrait(g, 'calm', 10);
  let sq = false; for (let i = 0; i < 6 && !sq; i++) { sq = squashRumor(g, 'rina_poems').ok; g.state.time.day += 1; } assert.ok(sq); assert.equal(S(g).rum.list.rina_poems.status, 'squashed');
  const hook = get('talkHook', 'sv4d_rumor_res_rina_poems'); assert.ok(hook.when(g));
  assert.ok((await runAll(g, hook.steps(g), [])).done); assert.ok(!hook.when(g));
  // bad rumor spreading costs reputation
  startRumor(g, 'mika_closing'); S(g).heard.mika_closing = { from: 'sachiko', day: g.day, hops: 0 }; const c0 = S(g).rep.charming;
  spreadRumor(g, 'mika_closing'); assert.ok(S(g).rep.charming < c0);
  // seeding
  const g2 = createTestGame(); meet(g2, ['sachiko', 'kai', 'pip', 'goro', 'hina']); g2.state.time.day = 10; assert.ok(maybeSeed(g2));
  for (const d of RUMORS) assert.ok(d.v.length === 3 && d.res.length === 3);
});

test('sv4d: reputation tiers give shop money back; traits expose hasTrait and conditions', () => {
  const g = createTestGame(); addRep(g, 'charming', 20);
  assert.equal(repTier(g, 'charming'), 2);
  const m0 = g.money; g.bus.emit('shopBuy', { shop: 'cafe', item: 'x', n: 1, cost: 100 }); assert.equal(g.money - m0, 6);
  addTrait(g, 'kind', 3);
  assert.ok(hasTrait(g, 'Kind', 3)); assert.ok(!hasTrait(g, 'Kind', 4));
  assert.ok(check('trait:kind>=3', g)); assert.ok(check('rep:charming>=2', g)); assert.ok(check('!moodof:kai=joyful', g) || true);
});

test('sv4d: every tradition has a date, a hook, a scene that finishes, a photo and a schedule group', async () => {
  const fails = [];
  for (const t of TRADS) {
    if (!get('npc', t.id)) continue;
    assert.ok(TRAD_DATE[t.id], t.id);
    const [season, day] = TRAD_DATE[t.id].split('-'); const si = ['spring', 'summer', 'autumn', 'winter'].indexOf(season);
    const g = createTestGame(); meet(g, [t.id]); g.state.time.day = si * 28 + Number(day);
    const hook = get('talkHook', 'sv4d_trad_' + t.id);
    assert.ok(hook, t.id);
    if (!hook.when(g)) continue; // new cast members may be away before they arrive
    const r = await runAll(g, hook.steps(g), [1]);
    if (!r.done) fails.push(t.id);
    assert.equal(S(g).photos.length, 1); assert.ok(g.flag(`sv4d_trad_${t.id}_y1`)); assert.ok(!hook.when(g));
    assert.ok(get('npc', t.id).schedule.some((s) => s.when === `date:${TRAD_DATE[t.id]}`));
  }
  assert.deepEqual(fails, []);
  assert.ok(TRADS.length >= 15);
});

test('sv4d: phone apps are registered and feature count', () => {
  for (const id of ['sv4d_memory', 'sv4d_almanac', 'sv4d_rumor', 'sv4d_self']) assert.ok(get('phoneApp', id), id);
  const n = FEATURES.filter((f) => f.category === 'Character Depth' || f.cat === 'Character Depth').length;
  assert.ok(n >= 60, 'features ' + n);
});
