// Lean test suite: pure logic only (no browser). Run with `npm test`.
import assert from 'node:assert/strict';
import { SPRITES, drawSprite } from '../src/art.js';
import { BufferSurface } from '../src/surface.js';
import { encodePNG } from './png.mjs';
import { mulberry32 } from '../src/rng.js';
import { blankInput } from '../src/input.js';
import * as world from '../src/world.js';
import { dailyChores, starsFor } from '../src/chores.js';
import { pickEvent, EVENTS, scriptFor } from '../src/events.js';
import { Cutscene } from '../src/cutscene.js';
import { DishGame, SweepGame, LaundryGame, PlantGame, FeedGame } from '../src/minigames.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok -', name); };
const DT = 1 / 60;
const inp = (o = {}) => Object.assign(blankInput(), o);

test('every sprite draws inside its bounds and portraits are 48x48', () => {
  for (const [name, d] of Object.entries(SPRITES)) {
    const s = new BufferSurface(d.w, d.h); drawSprite(name, s);
    assert.ok(s.opaquePixels() > 0, `${name} is empty`);
    if (name.startsWith('p_')) assert.deepEqual([d.w, d.h], [48, 48]);
  }
  const s = new BufferSurface(16, 16); drawSprite('t_wood', s);
  assert.equal(encodePNG(16, 16, s.data).subarray(1, 4).toString(), 'PNG');
});

test('every chore station is reachable from the bedroom', () => {
  const reach = world.reachableTiles(Object.keys(world.DECOR));
  for (const o of world.interactables()) {
    const f = world.footprint(o);
    const ok = [...reach].some((k) => { const [x, y] = k.split(',').map(Number); return world.distToRect(x * 16 + 8, y * 16 + 8, f) <= 16; });
    assert.ok(ok, `${o.id} unreachable (even with all decor placed)`);
  }
});

test('daily chores always include dishes + feeding, and grow with the day', () => {
  const a = dailyChores(mulberry32(1), 1), b = dailyChores(mulberry32(1), 5);
  assert.ok(a.some((c) => c.id === 'dishes') && a.some((c) => c.id === 'feed'));
  assert.ok(b.length > a.length && new Set(b.map((c) => c.id)).size === b.length);
  assert.equal(starsFor(0.9), 3);
});

test('events respect conditions and never repeat within a day', () => {
  const s = { minutes: 9 * 60, raining: false, chores: [{ id: 'dishes', done: false }], eventsToday: [] };
  const seen = new Set();
  for (let i = 0; i < 40; i++) { const id = pickEvent(mulberry32(i), s); assert.notEqual(id, 'star'); assert.notEqual(id, 'catKnock'); seen.add(id); }
  s.minutes = 21 * 60; s.eventsToday = EVENTS.map((e) => e.id).filter((id) => id !== 'star');
  assert.equal(pickEvent(mulberry32(1), s), 'star');
  s.eventsToday.push('star'); assert.equal(pickEvent(mulberry32(1), s), null);
});

test('cutscenes advance through say/fade/choice and finish', () => {
  const state = { decor: [], flags: {}, chores: [] };
  let done = false, called = 0;
  const cs = new Cutscene([{ t: 'say', who: 'MISA', mood: 'happy', text: 'Hi' }, { t: 'call', fn: () => called++ },
    { t: 'choice', options: [{ text: 'a', steps: [{ t: 'call', fn: () => called++ }] }] }, { t: 'fade', to: 1, dur: 0.1 }], { state }, () => (done = true));
  const press = (k) => cs.update(DT, inp({ pressed: new Set([k]) }));
  press(' '); press(' ');   // finish typing, then advance
  press(' ');               // choose option
  for (let i = 0; i < 20 && !done; i++) cs.update(DT, inp());
  assert.ok(done && called === 2);
  // every scripted event is well-formed and finishes when driven with Space
  const api = { state: { decor: [], flags: {}, chores: [], minutes: 600, eventsToday: [] }, rng: mulberry32(3), toast() {}, addMood() {}, addStars() {}, giveDecor() {}, addChore() {}, showPip() {}, startRain() {}, catComes() {}, startZoomies() {}, startBlackout() {}, scene: {} };
  for (const e of EVENTS) {
    let fin = false; const c = new Cutscene(scriptFor(e.id, api), api, () => (fin = true));
    for (let i = 0; i < 4000 && !fin; i++) c.update(0.05, inp({ pressed: new Set([' ']) }));
    assert.ok(fin, `event ${e.id} never finished`);
  }
});

test('dishes: scrubbing cleans, rinsing raises plates, game ends', () => {
  const g = new DishGame(mulberry32(5), { plates: 2 });
  let guard = 0;
  while (!g.done && guard++ < 20000) {
    if (g.phase === 'scrub') { const t = guard * 0.9; g.update(DT, inp({ down: true, moved: true, mx: 160 + Math.sin(t) * 55, my: 116 + Math.cos(t * 0.37) * 50 })); }
    else g.update(DT, inp({ pressed: new Set([' ']) }));
  }
  assert.ok(g.done && g.rack === 2 && g.score > 0.3, `dishes stuck (phase ${g.phase}, clean ${g.clean.toFixed(2)})`);
});

test('sweep: pushing dust across the floor collects it in the pan', () => {
  const g = new SweepGame(mulberry32(2), { dust: 12, coins: 1 });
  g.dust.forEach((d, i) => { d.x = 200 + (i % 4) * 6; d.y = 160 + Math.floor(i / 4) * 6; });
  for (let i = 0; i < 400 && !g.done; i++) g.update(DT, inp({ moved: true, mx: 170 + i * 0.5, my: 172 }));
  assert.ok(g.collected > 0.9, `only ${g.collected} collected`);
});

test('laundry: right presses score full, missing everything scores the floor', () => {
  const g = new LaundryGame(mulberry32(4), { items: 2 });
  const key = { left: 'arrowleft', right: 'arrowright', down: 'arrowdown' };
  while (!g.done) g.update(DT, inp({ pressed: new Set([key[g.target]]) }));
  assert.equal(g.score, 1);
  const m = new LaundryGame(mulberry32(4), { items: 2 });
  for (let i = 0; i < 2000 && !m.done; i++) m.update(0.1, inp());
  assert.ok(m.done && m.score <= 0.34 + 1e-9);
});

test('plants: releasing inside the green band is perfect, overpouring is not', () => {
  const g = new PlantGame(mulberry32(6), { pots: 2 });
  const hold = () => g.update(DT, inp({ keys: new Set([' ']) }));
  for (let pot = 0; pot < 2; pot++) {
    while (g.level < (g.band[0] + g.band[1]) / 2) hold();
    g.update(DT, inp());
    for (let i = 0; i < 120; i++) g.update(DT, inp());
  }
  assert.ok(g.done && g.score === 1);
  const o = new PlantGame(mulberry32(6), { pots: 1 });
  for (let i = 0; i < 400; i++) o.update(DT, inp({ keys: new Set([' ']) }));
  for (let i = 0; i < 200; i++) o.update(DT, inp());
  assert.ok(o.done && o.score === 0.5);
});

test('feed: wrong food costs stars, favourite food finishes', () => {
  const g = new FeedGame(mulberry32(8));
  g.sel = (g.fav + 1) % 3; g.update(DT, inp({ pressed: new Set([' ']) }));
  for (let i = 0; i < 90; i++) g.update(DT, inp());
  g.sel = g.fav; g.update(DT, inp({ pressed: new Set([' ']) }));
  for (let i = 0; i < 200; i++) g.update(DT, inp());
  assert.ok(g.done && g.wrong === 1 && g.score < 1);
});

console.log(`\n${n} tests passed`);
