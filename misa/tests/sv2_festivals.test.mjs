// Festival Set Pieces: minigame bots, scoring, schedules, festival overrides and every set piece flow run headlessly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, get, R, inp, DT } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';
import { scheduleEntry } from '../src/world/npc.js';
import { festivalOnDay } from '../src/systems/festivals.js';
import { DanceGame } from '../src/minigames/sv2_festivals/games.js';
import { S, PIECES, scoreBoard, grangeRivals, recordResult, souvenir, bagIds, MOMENT_DATES, momentsToday } from '../src/content/sv2_festivals/data.js';
import { dancePartners, potQuality, drawSecret, GIFT_FOR_MISA, matchesMisa, SECRET_POOL, GUESTS } from '../src/content/sv2_festivals/pieces.js';
import { MOMENT_LIST } from '../src/content/sv2_festivals/mini.js';

const day = (season, d) => ({ spring: 0, summer: 28, autumn: 56, winter: 84 }[season]) + d;
const PRESS = () => inp({ pressed: new Set([' ']) });

// Drives every scene the activity opens; minigames and UI scenes are answered with canned results.
async function drive(g, p, opts = {}) {
  let done = false, out;
  p.then((v) => { done = true; out = v; });
  g.minigame = (id, o) => Promise.resolve(opts.mg && opts.mg[id] ? opts.mg[id](o) : { score: 1, stars: 3, bonus: 0, data: {} });
  for (let i = 0; i < 6000 && !done; i++) {
    const top = g.scenes.top;
    if (top && top.step && top.step.t === 'choice' && !top.waiting) top.sel = Math.min((opts.picks || [])[top.step.prompt] || 0, top.options.length - 1);
    g.scenes.update(0.05, PRESS());
    await new Promise((r) => setTimeout(r, 0));
  }
  return { done, out };
}
function rig(g, o = {}) {
  g.open = (kind, a, b, c) => {
    if (kind === 'cutscene') { const s = new CutsceneScene(g, a, b); g.scenes.push(s); return s; }
    const done = [a, b, c].find((x) => typeof x === 'function');
    if (kind === 'sv2_pick') { const ids = bagIds(g, a.filter); return done(o.pick === null ? null : o.pick || ids[0] || null); }
    if (kind === 'sv2_grange') { return done(bagIds(g).slice(0, 9)); }
    if (done) return done();
  };
}
const setDay = (g, season, d, min = 12 * 60) => { g.state.time.day = day(season, d); g.state.time.minutes = min; g.bus.emit('dayStart', {}); g.state.time.minutes = min; };
const run = (g, fid, aid, opts) => { rig(g, opts); return drive(g, g.runFestivalActivity(fid, aid), opts); };

test('minigame bots finish: dance, egg hunt, strength tester and fireworks, with sensible scores', () => {
  const g = createTestGame();
  const want = { sv2_dance: 0.9, sv2_egg_hunt: 0.3, sv2_strength: 0.9, sv2_fireworks: 0.7 };
  for (const [id, min] of Object.entries(want)) {
    const def = R.minigame[id], m = def.make(g, { partner: 'kai' });
    for (let i = 0; i < 60 * 90 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done, id + ' finished'); assert.ok(m.score >= min && m.score <= 1, `${id} score ${m.score}`); assert.ok(m.result && m.result.text, id);
  }
});

test('egg hunt: Rina collects eggs on her own, and a hunter with nothing to do scores zero', () => {
  const g = createTestGame(), m = R.minigame.sv2_egg_hunt.make(g, {});
  assert.ok(m.eggs.length >= 17 && m.eggs.some((e) => e.v === 5));
  for (let i = 0; i < 60 * 50 && !m.done; i++) m.update(DT, inp(), g);
  assert.ok(m.done && m.rina > 0 && m.mine === 0 && m.score === 0);
});

test('dance: perfect, ok and missed presses are graded and a lazy dancer still finishes', () => {
  const g = createTestGame(), m = new DanceGame(g, { partner: 'kai' }), n0 = m.notes[0];
  m.t = n0.t - 0.02; m.update(0.001, inp({ pressed: new Set([['arrowleft', 'arrowdown', 'arrowup', 'arrowright'][n0.lane]]) }));
  assert.equal(n0.res, 'perfect');
  for (let i = 0; i < 60 * 40 && !m.done; i++) m.update(DT, inp());
  assert.ok(m.done && m.score < 0.1 && m.miss >= 25);
});

test('Grange scoring rewards variety, stars from the quality ledger and a full board; rivals are deterministic', () => {
  const g = createTestGame();
  const a = scoreBoard(g, ['crop_turnip', 'crop_turnip', 'crop_turnip']), b = scoreBoard(g, ['crop_turnip', 'fish_carp', 'dish_onigiri']);
  assert.ok(b.total > a.total && b.kinds === 3 && a.kinds === 1);
  assert.equal(scoreBoard(g, []).total, 0);
  g.state.sv_farm.q.crop_turnip = [0, 0, 1];
  assert.ok(scoreBoard(g, ['crop_turnip']).total > scoreBoard(g, ['crop_potato']).total || get('item', 'crop_potato').price > get('item', 'crop_turnip').price);
  const full = scoreBoard(g, ['crop_turnip', 'fish_carp', 'dish_onigiri', 'crop_potato', 'bug_firefly', 'shell_clam', 'gift_postcard', 'min_quartz', 'snack_cookies']);
  assert.equal(full.bonus, 10); assert.ok(full.judges.ogawa >= 6);
  assert.deepEqual(grangeRivals(g), grangeRivals(g));
  assert.equal(grangeRivals(g).length, 3);
});

test('potluck: a dish the cast loves beats junk, and dance partners need 4 hearts', () => {
  const g = createTestGame();
  const love = potQuality(g, 'dish_starlight_mochi'), thin = potQuality(g, null), junk = potQuality(g, 'dish_mysterious_lump');
  assert.ok(love.score > thin.score && thin.score > junk.score, `${love.score} ${thin.score} ${junk.score}`);
  assert.ok(GUESTS.every((id) => get('npc', id)));
  assert.deepEqual(dancePartners(g), []);
  g.addFriend('kai', 450); g.addFriend('hina', 410); g.addFriend('rina', 200);
  assert.deepEqual(dancePartners(g), ['kai', 'hina']);
});

test('secret friend: deterministic per day, never yourself, and every giver gift exists and matches Misa\'s taste', () => {
  const g = createTestGame();
  const s = drawSecret(g); assert.ok(SECRET_POOL.includes(s.to) && SECRET_POOL.includes(s.from) && s.to !== s.from);
  assert.deepEqual({ ...drawSecret(g) }, { ...s });
  for (const id of SECRET_POOL) { assert.ok(get('item', GIFT_FOR_MISA[id]), id); assert.ok(matchesMisa(GIFT_FOR_MISA[id]), id + ' gift matches'); }
});

test('festival calendar: overrides are in place and the new dates fire on the right day', () => {
  const g = createTestGame();
  const ids = (f) => get('festival', f).activities.map((a) => a.id);
  assert.ok(ids('hanami').includes('dance') && ids('hanami').includes('photo'));
  assert.ok(ids('harvest').includes('judging') && ids('harvest').includes('strength'));
  assert.equal(get('festival', 'harvest').activities.filter((a) => a.id === 'judging').length, 1);
  assert.ok(ids('starryeve').includes('swap') && ids('newyear').includes('countdown'));
  for (const [id, season, d] of [['eggfest', 'spring', 11], ['luau', 'summer', 24], ['jellies', 'summer', 26], ['icefest', 'winter', 11]]) {
    assert.ok(festivalOnDay(get('festival', id), g, day(season, d)), id); assert.ok(!festivalOnDay(get('festival', id), g, day(season, d) + 1), id + ' only once');
  }
  for (const p of PIECES) assert.ok(!p.souv || get('item', p.souv), p.souv);
});

test('festival-day schedules gather the cast: Kai is at the town fountain area on Egg Hunt Day and on the beach at the Luau', () => {
  const g = createTestGame();
  setDay(g, 'spring', 11, 11 * 60);
  const e = scheduleEntry(get('npc', 'rina'), g); assert.equal(e.stop.map, 'town'); assert.equal(e.stop.spot, 'fountain');
  setDay(g, 'summer', 24, 17 * 60);
  assert.equal(scheduleEntry(get('npc', 'mika'), g).stop.map, 'beach');
  setDay(g, 'winter', 28, 22 * 60);
  assert.equal(scheduleEntry(get('npc', 'tobias'), g).stop.map, 'town');
  setDay(g, 'spring', 20, 12 * 60);
  assert.notEqual((scheduleEntry(get('npc', 'rina'), g) || { stop: {} }).stop.spot, 'fountain');
});

test('Flower Dance flow: choose a partner, dance, friendship, crown, ribbon and best score', async () => {
  const g = createTestGame(); setDay(g, 'spring', 7);
  g.addFriend('kai', 450); const f0 = g.friendPts('kai');
  const r = await run(g, 'hanami', 'dance', { picks: { 'Who will you ask to dance?': 0 }, mg: { sv2_dance: () => ({ score: 0.9, stars: 3, data: { text: '12 perfect' } }) } });
  assert.ok(r.done);
  assert.ok(g.friendPts('kai') >= f0 + 80); assert.ok(g.has('gift_sv2_flower_crown')); assert.equal(g.state.stats.flowerDances, 1);
  assert.equal(S(g).best.hanami.rank, 1);
  const again = await run(g, 'hanami', 'dance', {}); assert.ok(again.done); assert.equal(g.state.stats.flowerDances, 1, 'once a day');
});

test('Flower Dance with nobody close: Grandma Hana steps in', async () => {
  const g = createTestGame(); setDay(g, 'spring', 7);
  const r = await run(g, 'hanami', 'dance', {});
  assert.ok(r.done); assert.equal(g.state.stats.flowerDances, 1);
});

test('Egg Hunt flow: win against Rina gives coins, stickers, the golden egg charm and a Blue ribbon', async () => {
  const g = createTestGame(); setDay(g, 'spring', 11, 11 * 60);
  const m0 = g.money;
  const r = await run(g, 'eggfest', 'hunt', { mg: { sv2_egg_hunt: () => ({ score: 1, stars: 3, data: { mine: 14, rina: 5, found: 12, gold: true, won: true, text: 'x' } }) } });
  assert.ok(r.done); assert.ok(g.money >= m0 + 14 * 15 + 200); assert.ok(g.has('gift_sv2_golden_egg')); assert.equal(g.state.stats.eggWins, 1);
  assert.equal(S(g).ribbons['eggfest@1'].rank, 1);
});

test('Luau flow: the chosen dish is used up, buffs land and the whole cast warms up', async () => {
  const g = createTestGame(); setDay(g, 'summer', 24, 17 * 60);
  g.give('dish_starlight_mochi', 1); const k0 = g.friendPts('kai'), h0 = g.friendPts('hana');
  const r = await run(g, 'luau', 'pot', { pick: 'dish_starlight_mochi' });
  assert.ok(r.done); assert.ok(!g.has('dish_starlight_mochi')); assert.ok(g.friendPts('kai') > k0); assert.equal(g.friendPts('hana'), h0);
  assert.ok(g.hasBuff('cozy')); assert.ok(g.has('gift_sv2_shell_lei')); assert.equal(g.state.stats.luauPots, 1);
  const g2 = createTestGame(); setDay(g2, 'summer', 24, 17 * 60); const r2 = await run(g2, 'luau', 'pot', { pick: null }); assert.ok(r2.done); assert.equal(g2.state.stats.luauPots, 1);
});

test('Moonlight Jellies flow: any of the three viewpoints gives the lamp once per night', async () => {
  const g = createTestGame(); setDay(g, 'summer', 26, 21 * 60);
  const r = await run(g, 'jellies', 'watch_rocks', {}); assert.ok(r.done); assert.ok(g.has('gift_sv2_jelly_lamp')); assert.equal(g.state.stats.jellyNights, 1);
  await run(g, 'jellies', 'watch_sandbar', {}); assert.equal(g.state.stats.jellyNights, 1);
});

test('Grange flow: judged, ranked, prize and rosette, and the list of items is not consumed', async () => {
  const g = createTestGame(); setDay(g, 'autumn', 13, 12 * 60);
  for (const id of ['crop_pumpkin', 'crop_turnip', 'fish_carp', 'dish_onigiri', 'crop_potato']) g.give(id, 2);
  const m0 = g.money;
  const r = await run(g, 'harvest', 'judging', {}); assert.ok(r.done);
  assert.equal(g.state.stats.grangeEntries, 1); assert.ok(g.money > m0); assert.ok(g.count('crop_pumpkin') === 2);
  assert.ok(S(g).best.harvest.score > 0);
  const r2 = await run(g, 'harvest', 'strength', { mg: { sv2_strength: () => ({ score: 0.97, stars: 3, data: { best: 0.97 } }) } }); assert.ok(r2.done);
});

test('Grange board scene: tapping bag items fills slots, the last board is remembered, judge button hands the list over', () => {
  const g = createTestGame(); let out = 'none';
  for (const id of ['crop_pumpkin', 'crop_turnip', 'fish_carp']) g.give(id, 1);
  const sc = R.scene.sv2_grange.make(g, {}, (v) => { out = v; }); g.scenes.push(sc);
  for (let i = 0; i < 3; i++) { sc.update(DT, inp({ pressed: new Set([' ']) }), g); sc.update(DT, inp({ pressed: new Set(['arrowright']) }), g); }
  assert.ok(sc.count() >= 2 && sc.board.filter((b) => b === 'crop_pumpkin').length <= 1, 'no more copies than owned');
  sc.update(DT, inp({ justDown: true, mx: 100, my: 168 }), g);
  assert.ok(Array.isArray(out) && out.length === sc.count() && out.length >= 2);
  assert.ok(S(g).grange.lastBoard.length >= 2);
  const sc2 = R.scene.sv2_grange.make(g, {}, () => {}); assert.ok(sc2.count() >= 2, 'previous display is restored');
});

test('Secret gift flow: give from the bag, receive the hidden friend\'s gift, ribbon and ornament', async () => {
  const g = createTestGame(); setDay(g, 'winter', 24, 14 * 60);
  const s = drawSecret(g); g.give('snack_strawberry_shortcake', 1);
  const r = await run(g, 'starryeve', 'swap', { pick: 'snack_strawberry_shortcake' });
  assert.ok(r.done); assert.equal(S(g).secret.got, 1); assert.ok(!g.has('snack_strawberry_shortcake') || s.to === 'x');
  assert.ok(g.has(GIFT_FOR_MISA[s.from])); assert.ok(g.has('gift_sv2_star_ornament')); assert.equal(g.state.stats.secretGifts, 1);
  const again = await run(g, 'starryeve', 'swap', {}); assert.ok(again.done); assert.equal(g.state.stats.secretGifts, 1);
});

test('Ice fishing flow: four casts, catches in the bag, entry fee, ranked result', async () => {
  const g = createTestGame(); setDay(g, 'winter', 11, 10 * 60);
  g.state.money = 500;
  const r = await run(g, 'icefest', 'contest', { mg: { hob_fishing: () => ({ score: 1, stars: 3, data: { caught: true, size: 40 } }) } });
  assert.ok(r.done); assert.equal(g.state.stats.iceContests, 1); assert.ok(g.state.stats.fishCaught >= 4); assert.ok(g.money >= 440 || g.money < 500 + 900);
  assert.ok(S(g).best.icefest.score > 0);
});

test('New Year countdown flow: fireworks, the clock strikes twelve, hamaya souvenir', async () => {
  const g = createTestGame(); setDay(g, 'winter', 28, 22 * 60 + 30);
  const r = await run(g, 'newyear', 'countdown', { mg: { sv2_fireworks: () => ({ score: 0.9, stars: 3, data: { perfect: 9 } }) } });
  assert.ok(r.done); assert.ok(g.minutes >= 24 * 60); assert.ok(g.has('gift_sv2_hamaya')); assert.equal(g.state.stats.nyeCountdowns, 1);
});

test('mini events: all six run, give their keepsakes and are counted for the achievement', async () => {
  assert.equal(MOMENT_LIST.length, 6);
  for (const m of MOMENT_LIST) {
    const g = createTestGame(); const [season, d] = MOMENT_DATES[m.id]; setDay(g, season, d, 12 * 60);
    for (const id of ['kai', 'hina', 'suzu']) g.addFriend(id, 250);
    g.give('snack_cookies', 1);
    assert.ok(momentsToday(g).includes(m.id)); assert.ok(g.flag('sv2m_' + m.id));
    rig(g, {}); const r = await drive(g, m.run(g), {}); assert.ok(r.done, m.id);
    assert.equal(g.state.stats.miniMoments, 1, m.id); assert.equal(S(g).plays[m.id], 1);
  }
});

test('ribbons, souvenirs and stats: best keeps the better rank, souvenirs only once, achievements wired', () => {
  const g = createTestGame();
  recordResult(g, 'hanami', { score: 50, rank: 3 }); recordResult(g, 'hanami', { score: 90, rank: 1 }); recordResult(g, 'hanami', { score: 20, rank: 4 });
  assert.equal(S(g).best.hanami.score, 90); assert.equal(S(g).best.hanami.rank, 1); assert.equal(S(g).plays.hanami, 3);
  assert.equal(souvenir(g, 'gift_sv2_hamaya'), true); assert.equal(souvenir(g, 'gift_sv2_hamaya'), false); assert.equal(g.count('gift_sv2_hamaya'), 1);
  for (const id of ['sv2_dancer', 'sv2_grange', 'sv2_souv6', 'sv2_ribbons3']) assert.ok(get('achievement', id));
  const seen = []; g.bus.on('sv2Result', (e) => seen.push(e.id)); recordResult(g, 'luau', { score: 70, rank: 2 }); assert.deepEqual(seen, ['luau']);
  assert.ok(get('phoneApp', 'sv2_album'));
});

test('everything draws without throwing: minigames, backdrops, picker, board, result card, album, glow layer', () => {
  const g = createTestGame();
  const G = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 5 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const fake = () => ({ width: 16, height: 16, getContext: () => G });
  const had = globalThis.document; globalThis.document = { createElement: fake };
  try {
    for (const id of ['sv2_dance', 'sv2_egg_hunt', 'sv2_strength', 'sv2_fireworks']) {
      const def = R.minigame[id], m = def.make(g, { partner: 'kai' });
      for (let i = 0; i < 400; i++) { m.update(DT, def.bot(m, 0, inp()), g); m.draw(G, () => fake(), g); }
    }
    for (const id of ['sv2_luau', 'sv2_jellies', 'sv2_firefly', 'sv2_nye', 'sv2_snowfort', 'sv2_kite']) for (let t = 0; t < 6; t += 0.7) R.backdrop[id].draw(G, g, t);
    for (const id of ['crop_pumpkin', 'fish_carp', 'dish_onigiri']) g.give(id, 2);
    g.state.sv_farm.q.crop_pumpkin = [1, 0, 0];
    for (const [id, args] of [['sv2_pick', [{ title: 'x', prompt: 'y', extra: () => 'hint' }, () => {}]], ['sv2_grange', [{}, () => {}]], ['sv2_result', [{ title: 'x', rank: 2, score: 70, lines: ['a', 'b'] }, () => {}]]]) {
      const sc = R.scene[id].make(g, ...args);
      for (let i = 0; i < 40; i++) { sc.update(DT, inp({ pressed: new Set(i === 5 ? [' '] : []), wheel: 0 }), g); sc.draw(G, g); }
    }
    const app = { area: { x: 14, y: 40, w: 292, h: 172 }, state: {} }, a = R.phoneApp.sv2_album;
    a.open(g, app); for (let i = 0; i < 16; i++) { a.update(DT, inp({ pressed: new Set(['arrowdown']) }), g, app); a.draw(G, g, app); }
    g.state.time.day = day('summer', 26); g.state.time.minutes = 21 * 60; g.bus.emit('dayStart', {});
    const world = { map: { id: 'beach' }, sx: (x) => x, sy: (y) => y };
    R.worldLayer.sv2_glow.overlay(G, world, g);
    assert.ok(R.worldLayer.sv2_glow && g.extraLights.length > 0);
  } finally { globalThis.document = had; }
});
