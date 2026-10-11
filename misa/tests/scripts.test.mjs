// Every script-like piece of content runs to completion headlessly, exploring each choice branch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, R } from './helpers.mjs';
import { CutsceneScene } from '../src/ui/cutscene.js';

async function runAll(g, steps, choices) {
  g.minigame = () => Promise.resolve({ score: 1, stars: 3, bonus: 0 });
  g.open = (kind, a, b, c) => { if (kind === 'cutscene') { const s = new CutsceneScene(g, a, b); g.scenes.push(s); return s; } const done = [a, b, c].find((x) => typeof x === 'function'); if (done) setTimeout(() => done({ score: 1 }), 0); return null; };
  let done = false, picks = 0;
  const sc = new CutsceneScene(g, steps, () => { done = true; });
  g.scenes.stack = []; g.scenes.push(sc);
  const seen = [];
  for (let i = 0; i < 3000 && !done; i++) {
    const top = g.scenes.top;
    if (top && top.step && top.step.t === 'choice' && !top.waiting) {
      seen.push(top.options.length);
      top.sel = Math.min(choices[picks] || 0, top.options.length - 1); picks++;
    }
    g.scenes.update(0.05, inp({ pressed: new Set([' ']) }));
    await new Promise((r) => setTimeout(r, 0));
  }
  return { done, seen };
}

function sources(g) {
  const out = [];
  for (const s of Object.values(R.script || {})) out.push([`script ${s.id}`, () => (typeof s.steps === 'function' ? s.steps(g, {}) : s.steps)]);
  for (const h of Object.values(R.talkHook || {})) out.push([`talkHook ${h.id}`, () => h.steps(g, { def: R.npc[h.npc] })]);
  for (const n of Object.values(R.npc)) for (const e of n.events || []) out.push([`npc ${n.id} event ${e.id}`, () => e.script(g)]);
  for (const ev of Object.values(R.event || {})) if (ev.script) out.push([`event ${ev.id}`, () => ev.script(g)]);
  return out;
}

test('every script, talk hook, heart event and random event finishes on every choice branch', async () => {
  const g0 = createTestGame();
  const failures = [];
  for (const [name, make] of sources(g0)) {
    // explore up to 12 branch combinations
    const queue = [[]];
    let runs = 0;
    while (queue.length && runs < 12) {
      const choices = queue.shift(); runs++;
      const g = createTestGame();
      let r;
      try { r = await runAll(g, make.call(null) && make(), choices); } catch (e) { failures.push(`${name}: ${e.message}`); break; }
      if (!r.done) { failures.push(`${name} (choices ${choices.join(',')}): did not finish`); break; }
      r.seen.forEach((n, depth) => { if (depth >= choices.length) for (let k = 1; k < n; k++) queue.push([...choices, ...r.seen.slice(choices.length, depth).map(() => 0), k]); });
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});
