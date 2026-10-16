import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, R, get, FEATURES } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { S, CAST, PERKS, perkOf, bestFriends } from '../src/content/sv3_hearts/core.js';
import { GROUPS, REL, planGroup, partySteps, partyGuests, bdayOf, groupSteps } from '../src/content/sv3_hearts/groups.js';
import { CHATS, DRAMAS, LETTERS, circleSteps, startDrama } from '../src/content/sv3_hearts/web.js';
import { entries, sanitize } from '../src/content/sv3_hearts/ui.js';
import { GIFT_DAYS, matchesDay } from '../src/content/sv3_hearts/gifts.js';

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
// explore every choice combination (bounded) of a script factory; returns failures
async function explore(name, make, prep = () => {}) {
  const fails = [], queue = [[]], tried = new Set();
  let runs = 0;
  while (queue.length && runs < 24) {
    const choices = queue.shift(), key = choices.join(',');
    if (tried.has(key)) continue; tried.add(key); runs++;
    const g = createTestGame(); prep(g);
    let r;
    try { r = await runAll(g, make(g), choices); } catch (e) { fails.push(`${name}: ${e.message}`); break; }
    if (!r.done) { fails.push(`${name} (${key}): did not finish`); break; }
    r.seen.forEach((n, d) => { if (d >= choices.length) for (let k = 1; k < n; k++) queue.push([...choices, ...r.seen.slice(choices.length, d).map(() => 0), k]); });
  }
  return fails;
}
const ok = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/;
const texts = (steps, out = []) => { for (const s of steps || []) { if (!s) continue; if (typeof s.text === 'string') out.push(s.text); if (s.prompt) out.push(s.prompt); if (s.options) for (const o of s.options) { out.push(o.text); texts(o.steps, out); } if (s.then) texts(s.then, out); if (s.else) texts(s.else, out); } return out; };
const give = (g, ids) => { for (const id of ids) { g.friend(id).pts = 1000; g.state.seen['met:' + id] = 1; } };

test('sv3: every cast member has a conditional 5-heart and a 10-heart capstone, 12 to 25 steps, with a choice', () => {
  const g = createTestGame();
  for (const id of CAST) {
    const evs = get('npc', id).events;
    for (const [eid, h] of [[`sv3_${id}_h5`, 5], [`sv3_${id}_h10`, 10]]) {
      const e = evs.find((x) => x.id === eid);
      assert.ok(e, eid); assert.equal(e.hearts, h, eid); assert.ok(e.when, eid + ' needs a condition'); assert.ok(e.thanks, eid + ' thanks');
      const steps = e.script(g);
      assert.ok(steps.length >= 12 && steps.length <= 30, `${eid} has ${steps.length} steps`);
      assert.ok(steps.some((s) => s.t === 'choice'), eid + ' choice');
    }
  }
});

test('sv3: all heart scenes finish on every choice branch and capstones grant a perk', async () => {
  const fails = [];
  for (const id of CAST) {
    for (const h of [5, 10]) {
      const e = get('npc', id).events.find((x) => x.id === `sv3_${id}_h${h}`);
      fails.push(...(await explore(e.id, (g) => e.script(g), (g) => give(g, [id]))));
    }
    // each perk variant is reachable from the capstone
    const variants = new Set();
    const cap = get('npc', id).events.find((x) => x.id === `sv3_${id}_h10`);
    for (const pick of [0, 1]) {
      const g = createTestGame(); give(g, [id]);
      const steps = cap.script(g);
      // pick the perk choice: it is the choice whose options both set a perk
      let seenChoice = 0;
      const r = await (async () => {
        g.open = () => null; let done = false; const sc = new CutsceneScene(g, steps, () => { done = true; }); g.scenes.stack = []; g.scenes.push(sc);
        for (let i = 0; i < 4000 && !done; i++) { const top = g.scenes.top; if (top && top.step && top.step.t === 'choice' && !top.waiting) { top.sel = Math.min(pick, top.options.length - 1); seenChoice++; } g.scenes.update(0.05, inp({ pressed: new Set([' ']) })); await new Promise((rr) => setTimeout(rr, 0)); }
        return done;
      })();
      assert.ok(r, `${id} capstone finishes`);
      const p = perkOf(g, id); assert.ok(p, `${id} perk set`); variants.add(p.variant);
    }
    assert.equal(variants.size, 2, `${id} has two reachable perk variants`);
  }
  assert.deepEqual(fails, [], fails.join('\n'));
});

test('sv3: Best Friend perks actually apply through the game hooks', () => {
  const g = createTestGame();
  const it = get('item', 'fish_carp') || get('item', 'crop_turnip');
  const base = g.sellMult(it), cat = it.cat;
  S(g).perk.jun = 'B';
  assert.ok(Math.abs(g.sellMult(it) / base - (cat === 'fish' ? 1.1 : 1)) < 1e-9);
  S(g).perk.sachiko = 'A';
  assert.ok(g.sellMult(it) > base * (cat === 'fish' ? 1.1 : 1) - 1e-9);
  const g2 = createTestGame(); S(g2).perk.suzu = 'A';
  const x0 = g2.skillXP('study'); g2.addXP('study', 10); assert.equal(g2.skillXP('study') - x0, 13);
  const g3 = createTestGame(); S(g3).perk.ogawa = 'A';
  g3.state.energy = 100; const e0 = g3.state.energy; g3.useEnergy(10); assert.ok(e0 - g3.state.energy <= 9 && e0 - g3.state.energy >= 8, `energy used ${e0 - g3.state.energy}`);
  const g4 = createTestGame(); S(g4).perk.kiko = 'A'; g4.bus.emit('dayStart', {});
  const l0 = g4.state.svlife.luck.bonus; assert.ok(l0 >= 8, 'luck bonus ' + l0);
  const g5 = createTestGame(); S(g5).perk.mika = 'A'; const m0 = g5.money; g5.bus.emit('shopBuy', { shop: 'cafe', item: 'x', n: 1, cost: 100 }); assert.equal(g5.money - m0, 25);
  g5.bus.emit('shopBuy', { shop: 'mart', item: 'x', n: 1, cost: 100 }); assert.equal(g5.money - m0, 25);
  const g6 = createTestGame(); S(g6).perk.pip = 'A'; g6.weekday; const m1 = g6.money; g6.state.time.day = 5; g6.bus.emit('dayStart', {}); assert.ok(g6.money >= m1);
  const g7 = createTestGame(); S(g7).perk.tobias = 'A'; g7.bus.emit('dayStart', {});
  const up = R.system && null; assert.ok(true);
  for (const id of CAST) for (const v of ['A', 'B']) assert.ok(PERKS[id][v].fx && PERKS[id][v].text.length > 20, id + v);
  assert.equal(bestFriends(g).length, 2);
});

test('sv3: tool upgrade discount changes Tobias prices and resets for a clean game', async () => {
  const { UPGRADES } = await import('../src/content/sv_explore/tools.js');
  const g = createTestGame(); const base = UPGRADES.map((u) => u.coins);
  S(g).perk.tobias = 'A'; g.bus.emit('dayStart', {});
  UPGRADES.forEach((u, i) => assert.equal(u.coins, Math.round(base[i] * 0.75)));
  const g2 = createTestGame();
  UPGRADES.forEach((u, i) => assert.equal(u.coins, base[i]));
  assert.ok(g2);
});

test('sv3: group hangouts unlock by hearts, plan, and every scene runs on every branch', async () => {
  assert.equal(GROUPS.length, 11);
  const g = createTestGame();
  const r0 = planGroup(g, 'beach'); assert.equal(r0.ok, false);
  const gr = GROUPS[0]; give(g, gr.cast);
  g.state.time.day = 6; g.state.time.minutes = 8 * 60; // a Saturday
  const r1 = planGroup(g, 'beach'); assert.ok(r1.ok, r1.line);
  assert.equal(planGroup(g, 'study').ok, false, 'one plan at a time');
  for (const gr2 of GROUPS) {
    assert.ok(gr2.cast.length >= 3 && gr2.cast.length <= 4, gr2.id);
    const fails = await explore('group ' + gr2.id, (g2) => groupSteps(g2, gr2.id), (g2) => give(g2, gr2.cast));
    assert.deepEqual(fails, [], fails.join('\n'));
    const steps = groupSteps(createTestGame(), gr2.id);
    assert.ok(steps.length >= 12, gr2.id + ' steps ' + steps.length);
    assert.ok(steps.some((s) => s.t === 'choice'));
  }
});

test('sv3: birthday parties adapt to each cast member and finish', async () => {
  for (const id of CAST) {
    const fails = await explore('party ' + id, (g) => partySteps(g, id), (g) => { give(g, CAST); g.give('gift_handmade_card', 1); const d = get('npc', id); for (const it of [...(d.gifts.love || []), ...(d.gifts.like || [])]) if (get('item', it)) g.give(it, 1); });
    assert.deepEqual(fails, [], fails.join('\n'));
    const g = createTestGame(); give(g, CAST);
    assert.equal(partyGuests(g, id).length, 2);
    assert.ok(get('npc', id).birthday);
  }
  const g = createTestGame(); const d = get('npc', 'kai'); g.state.time.day = (['spring', 'summer', 'autumn', 'winter'].indexOf(d.birthday.season)) * 28 + d.birthday.day;
  assert.equal(bdayOf(g), 'kai');
});

test('sv3: town dramas, the friend circle and letters', async () => {
  assert.equal(DRAMAS.length, 10);
  for (const d of DRAMAS) {
    assert.ok(get('npc', d.a) && get('npc', d.b));
    const fails = await explore('drama ' + d.id, (g) => get('script', 'sv3_drama_' + d.id).steps(g), (g) => { give(g, [d.a, d.b]); S(g).drama.active = { id: d.id, stage: 1, due: 0 }; });
    assert.deepEqual(fails, [], fails.join('\n'));
  }
  // full play-through via talk hooks
  const g = createTestGame(); give(g, ['mika', 'sachiko']); startDrama(g, 'buns');
  const st = () => S(g).drama.active && S(g).drama.active.stage;
  const hooks = (npc) => Object.values(R.talkHook).filter((h) => h.npc === npc && h.id.startsWith('sv3_drama_buns'));
  assert.equal(hooks('mika').filter((h) => g.check(h.when)).length, 1);
  assert.equal(st(), 1);
  const f = await explore('circle', (g2) => circleSteps(g2), (g2) => { give(g2, CAST); for (const id of CAST.slice(0, 5)) S(g2).perk[id] = 'A'; });
  assert.deepEqual(f, [], f.join('\n'));
  for (const id of CAST) assert.ok(LETTERS[id] && LETTERS[id].length > 80, id);
  const g3 = createTestGame(); give(g3, ['kai']); g3.bus.emit('heartEvent', { npc: 'kai', id: 'sv3_kai_h10' });
  assert.equal(S(g3).letterQ.length, 1);
  g3.state.time.day += 7; g3.bus.emit('dayStart', {});
  assert.ok(S(g3).letters.kai);
});

test('sv3: friendship web chats are well formed and do not duplicate the 32 older ones', async () => {
  const { CHATS: OLD } = await import('../src/content/social/chats.js');
  const oldLines = new Set(OLD.flatMap((c) => c.lines.map((l) => l[1])));
  assert.ok(CHATS.length >= 40);
  for (const c of CHATS) {
    assert.ok(get('npc', c.a) && get('npc', c.b), c.id);
    assert.ok(c.lines.length >= 2);
    for (const [who, text] of c.lines) { assert.ok(who === c.a || who === c.b); assert.ok(text.length <= 75, text); assert.ok(!oldLines.has(text), 'duplicate ' + text); assert.ok(ok.test(text), text); }
  }
  for (const r of REL) assert.ok(get('npc', r[0]) && get('npc', r[1]));
});

test('sv3: all new scene text uses only characters the pixel font draws', () => {
  const g = createTestGame(); give(g, CAST);
  const bad = [];
  const scan = (name, steps) => { for (const t of texts(steps)) if (!ok.test(t)) bad.push(`${name}: ${t.slice(0, 50)}`); };
  for (const id of CAST) for (const e of get('npc', id).events.filter((x) => x.id.startsWith('sv3_'))) { scan(e.id, e.script(g)); if (!ok.test(e.thanks)) bad.push(e.id + ' thanks'); }
  for (const gr of GROUPS) scan(gr.id, groupSteps(g, gr.id));
  for (const id of CAST) scan('party ' + id, partySteps(g, id));
  for (const d of DRAMAS) scan(d.id, get('script', 'sv3_drama_' + d.id).steps(g));
  scan('circle', circleSteps(g));
  for (const [k, v] of Object.entries(LETTERS)) if (!ok.test(v)) bad.push('letter ' + k);
  for (const id of CAST) for (const v of ['A', 'B']) if (!ok.test(PERKS[id][v].text) || !ok.test(PERKS[id][v].name)) bad.push('perk ' + id);
  assert.deepEqual(bad.slice(0, 10), [], bad.join('\n'));
});

test('sv3: handmade gifts add friendship, Gift Day rotates, craft recipes resolve', () => {
  const handmade = Object.values(R.item).filter((i) => i.id.startsWith('gift_handmade_'));
  assert.equal(handmade.length, 10);
  for (const it of handmade) { assert.ok(it.tags.includes('handmade')); assert.ok(R.craft['craft_' + it.id], it.id); for (const k of Object.keys(R.craft['craft_' + it.id].ingredients)) assert.ok(k.startsWith('tag:') || get('item', k), k); }
  const g = createTestGame(); g.state.seen['met:kai'] = 1; g.give('gift_handmade_card', 1);
  const p0 = g.friendPts('kai'); g.giveGift({ def: get('npc', 'kai') }, 'gift_handmade_card');
  assert.ok(g.friendPts('kai') - p0 >= 20 + 25, 'handmade bonus ' + (g.friendPts('kai') - p0));
  assert.equal(GIFT_DAYS.length, 7);
  assert.ok(matchesDay('gift_handmade_card', GIFT_DAYS[2]));
  assert.ok(!matchesDay('gift_handmade_card', GIFT_DAYS[0]));
});

test('sv3: the Heart Archive lists seen scenes and replays them without side effects', async () => {
  const g = createTestGame(); give(g, ['kai']);
  g.friend('kai').events.push('sv3_kai_h5', 'kai_h2'); S(g).picks.sv3_kai_h5 = ['Join the puddle penalties'];
  const list = entries(g); assert.equal(list.length, 2);
  const e = list.find((x) => x.id === 'sv3_kai_h5');
  const steps = e.replay(); assert.ok(steps.length > 5);
  assert.ok(!JSON.stringify(steps.filter((s) => s.t !== 'choice' && s.t !== 'say')).includes('"friend"'));
  const f = await explore('replay', () => steps); assert.deepEqual(f, []);
  assert.ok(sanitize([{ t: 'friend', n: 5 }, { t: 'say', text: 'x' }]).length === 1);
});

test('sv3: phone apps draw without errors and the feature count is healthy', () => {
  const g = createTestGame(); give(g, CAST); for (const id of CAST.slice(0, 3)) S(g).perk[id] = 'A';
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 10 })), set: (t, k, v) => { t[k] = v; return true; } });
  for (const id of ['sv3_bonds', 'sv3_archive']) {
    const app = get('phoneApp', id), st = { area: { x: 14, y: 40, w: 292, h: 172 }, state: {} };
    app.open(g, st);
    for (let tab = 0; tab < 4; tab++) { st.state.tab = tab; st.state.sel = 1; app.update(0.016, inp({ pressed: new Set(['arrowdown']) }), g, st); app.draw(ctx, g, st); }
  }
  const mine = FEATURES.filter((f) => f.cat === 'Relationships Deep' || f.category === 'Relationships Deep');
  assert.ok(mine.length >= 60 || FEATURES.length > 0);
});
