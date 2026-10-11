// Content registries. Content modules only ADD entries here (registerX calls in their own files),
// so many contributors can work in parallel without editing shared files.
//
//   import { register } from '../core/registry.js';
//   register('item', 'apple', { name: 'Apple', ... });
//
// Kinds are open-ended, but these are the ones the engine reads (see docs in each system):
export const KINDS = [
  'item', 'npc', 'map', 'tile', 'minigame', 'quest', 'event', 'recipe', 'achievement', 'shop',
  'fish', 'crop', 'collectible', 'class', 'job', 'festival', 'decor', 'outfit', 'book', 'script',
  'interaction', 'mail', 'skill', 'chapter', 'spot', 'tip',
];
export const R = Object.fromEntries(KINDS.map((k) => [k, {}]));
export const FEATURES = []; // { id, text, cat }

export function register(kind, id, def) {
  if (!R[kind]) R[kind] = {};
  if (R[kind][id]) throw new Error(`duplicate ${kind} "${id}"`);
  R[kind][id] = Object.assign({ id }, def);
  return R[kind][id];
}
export const registerMany = (kind, table) => { for (const [id, def] of Object.entries(table)) register(kind, id, def); };
export const get = (kind, id) => (R[kind] ? R[kind][id] : undefined);
export const all = (kind) => Object.values(R[kind] || {});

// Every player-visible feature is declared next to the code that implements it. FEATURES.md and the
// feature-count test are generated from this list, so nothing is counted that isn't wired up.
export function feature(cat, text, id = `${cat}:${FEATURES.length}`) {
  FEATURES.push({ id, cat, text });
}
export const features = (cat, list) => list.forEach((t) => feature(cat, t));
