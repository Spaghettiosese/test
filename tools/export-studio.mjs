// Writes each gun as a ShapeForge character JSON (skeleton, parts, materials, baked clips)
// to assets/, ready for ShapeForge Studio (File > Open) or the Animation Viewer.
import { writeFileSync, mkdirSync } from 'node:fs';
import { WEAPONS } from '../src/weapons/index.js';
mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
for (const w of WEAPONS) {
  const json = w.create().toJSON();
  writeFileSync(new URL(`../assets/${w.id}.json`, import.meta.url), JSON.stringify(json));
  console.log(`assets/${w.id}.json`, json.parts.length, 'parts,', json.clips.length, 'clips');
}
