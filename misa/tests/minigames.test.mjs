// Bots play the minigames. Each registered minigame may provide bot(inst, t) -> input overrides; minigames
// without a bot only need to construct and draw-free update without throwing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, R } from './helpers.mjs';
import { mulberry32 } from '../src/rng.js';
import { DishGame, SweepGame, LaundryGame, PlantGame, FeedGame } from '../src/minigames/chores.js';
import { PetGame } from '../src/minigames/pet.js';

test('every registered minigame builds and survives 5 seconds of play (bots finish when provided)', () => {
  const g = createTestGame();
  const fails = [];
  for (const def of Object.values(R.minigame)) {
    try {
      const m = def.make(g, {});
      for (let i = 0; i < 300 && !m.done; i++) m.update(DT, def.bot ? def.bot(m, i * DT, inp()) : inp(), g);
      if (def.bot) { for (let i = 0; i < 60 * 120 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g); if (!m.done) fails.push(`${def.id}: bot did not finish`); }
      if (m.done && !(m.score >= 0 && m.score <= 1)) fails.push(`${def.id}: score ${m.score} out of range`);
    } catch (e) { fails.push(`${def.id}: ${e.message}`); }
  }
  assert.deepEqual(fails, [], fails.join('\n'));
});

test('dishes: scrubbing cleans, rinsing raises plates, game ends', () => {
  const g = new DishGame(mulberry32(5), { plates: 2 });
  let guard = 0;
  while (!g.done && guard++ < 20000) {
    if (g.phase === 'scrub') { const t = guard * 0.9; g.update(DT, inp({ down: true, moved: true, mx: 160 + Math.sin(t) * 55, my: 116 + Math.cos(t * 0.37) * 50 })); }
    else g.update(DT, inp({ pressed: new Set([' ']) }));
  }
  assert.ok(g.done && g.rack === 2 && g.score > 0.3);
});

test('sweep, laundry, plants, feed and pet keep their design intent', () => {
  const s = new SweepGame(mulberry32(2), { dust: 12, coins: 1 });
  s.dust.forEach((d, i) => { d.x = 200 + (i % 4) * 6; d.y = 160 + Math.floor(i / 4) * 6; });
  for (let i = 0; i < 400 && !s.done; i++) s.update(DT, inp({ moved: true, mx: 170 + i * 0.5, my: 172 }));
  assert.ok(s.collected > 0.9);
  const l = new LaundryGame(mulberry32(4), { items: 2 }), key = { left: 'arrowleft', right: 'arrowright', down: 'arrowdown' };
  while (!l.done) l.update(DT, inp({ pressed: new Set([key[l.target]]) }));
  assert.equal(l.score, 1);
  const o = new PlantGame(mulberry32(6), { pots: 1 });
  for (let i = 0; i < 400; i++) o.update(DT, inp({ keys: new Set([' ']) }));
  for (let i = 0; i < 200; i++) o.update(DT, inp());
  assert.ok(o.done && o.score === 0.5);
  const f = new FeedGame(mulberry32(8));
  f.sel = (f.fav + 1) % 3; f.update(DT, inp({ pressed: new Set([' ']) }));
  for (let i = 0; i < 90; i++) f.update(DT, inp());
  f.sel = f.fav; f.update(DT, inp({ pressed: new Set([' ']) }));
  for (let i = 0; i < 200; i++) f.update(DT, inp());
  assert.ok(f.done && f.wrong === 1 && f.score < 1);
  const p = new PetGame(mulberry32(9));
  for (let i = 0; i < 240; i++) p.update(DT, inp({ down: true, moved: true, mx: 160 + Math.sin(i * 0.12) * 25, my: 100 }));
  assert.ok(p.affection > 0.3);
});
