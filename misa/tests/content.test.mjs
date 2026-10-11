import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, R } from './helpers.mjs';
import { validateAll } from '../src/core/validate.js';

test('all content references resolve (maps, warps, spawns, reachability, npcs, items, shops, quests, conditions)', () => {
  const errs = validateAll();
  assert.deepEqual(errs, [], errs.join('\n'));
});

test('feature list: every feature is unique and the game ships at least the target count', () => {
  const target = Number(process.env.FEATURE_TARGET || 0);
  assert.ok(FEATURES.length >= target, `only ${FEATURES.length} features, target ${target}`);
  assert.equal(new Set(FEATURES.map((f) => f.text)).size, FEATURES.length);
});

test('every string a player can read uses characters the pixel font can draw', async () => {
  const { CHAR_W } = await import('../src/font.js');
  assert.ok(CHAR_W > 0);
  const ok = /^[A-Za-z0-9 .,!?'":\-+/%*()><#=[\]_&$@;|~^]*$/;
  const bad = [];
  const scan = (v, where) => {
    if (typeof v === 'string') { if (!ok.test(v)) bad.push(`${where}: "${v.slice(0, 40)}"`); }
    else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`));
  };
  for (const kind of ['item', 'npc', 'quest', 'achievement', 'shop', 'recipe', 'fish', 'crop', 'map']) {
    for (const d of Object.values(R[kind] || {})) {
      for (const k of ['name', 'desc', 'bio', 'role']) scan(d[k], `${kind}.${d.id}.${k}`);
      if (d.lines) for (const [k, v] of Object.entries(d.lines)) scan(v, `${kind}.${d.id}.lines.${k}`);
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], bad.join('\n'));
});
