// The people the later chapters bring into the world: the Gray Hand's cutthroats, the Choir's
// knights and cantors, the risen dead. Plain NPC definitions (see npc.js) with a fighting style
// from archetypes.js.
const HAND = { cloth: '#4a4850', cloth2: '#5e5c66', leather: '#2a2622', glove: '#1e1a18' };
export const handKnife = (id, x, z, o = {}) => ({
  id, name: o.name || 'Gray Hand knife', role: 'guard', hostile: true, arch: 'knife', faction: 'hand', pos: [x, z], yaw: o.yaw ?? 0,
  weapon: 'knife', block: 0.12, eyes: 1.05, detail: 0.45, loot: o.loot || [['knife', 2], ['gold', 6 + Math.floor(Math.random() * 10)]],
  schedule: o.schedule || [{ h0: 0, h1: 24, poi: o.poi || null, route: o.route, act: o.route ? 'patrol' : 'guard' }],
  spec: { outfit: 'rogue', mask: true, colors: { ...HAND, ...(o.colors || {}) }, hair: { style: 'short', color: o.hair || 'black' }, skin: o.skin || 'pale', weapon: 'knife', height: o.height || 1, voice: o.voice || 0.95 },
  ...o.def,
});
export const handSmuggler = (id, x, z, o = {}) => ({ ...handKnife(id, x, z, o), name: o.name || 'Gray Hand smuggler', arch: undefined, hp: 50, weapon: 'dagger', spec: { ...handKnife(id, x, z, o).spec, mask: false, weapon: 'dagger' } });
export const hollowKnight = (id, x, z, o = {}) => ({
  id, name: o.name || 'Hollow Knight', role: 'hollow', hostile: true, arch: 'knight', pos: [x, z], yaw: o.yaw ?? 0, weapon: 'dark', block: 0.3, eyes: 1.1, detail: 0.5,
  loot: o.loot || [['gold', 40], ['ember', 1]], schedule: [{ h0: 0, h1: 24, poi: null, act: 'stand' }],
  spec: { outfit: 'guard', skin: 'ashen', glowEyes: true, hair: { style: 'bald' }, colors: { tabard: '#1a1420', cloth: '#14121a', cloth2: '#0e0c12' }, weapon: 'dark', height: 1.16, build: 1.22, voice: 0.4 },
});
export const cantor = (id, x, z, o = {}) => ({
  id, name: o.name || 'Choir Cantor', role: 'hollow', hostile: true, arch: 'cantor', pos: [x, z], yaw: o.yaw ?? 0, weapon: null, eyes: 1.2, detail: 0.45,
  loot: o.loot || [['ember', 1], ['h_ember', 2]], schedule: [{ h0: 0, h1: 24, poi: null, act: 'stand' }],
  spec: { outfit: 'priest', hood: true, skin: 'ashen', glowEyes: true, hair: { style: 'bald' }, colors: { robe: '#2a1a3a', cloth: '#1e1428', cloth2: '#2a1a3a' }, weapon: null, height: 1.08, voice: 1.5 },
});
export const shieldGuard = (id, x, z, o = {}) => ({
  id, name: o.name || 'Watch shieldbearer', role: 'guard', arch: 'shield', faction: o.faction || 'watch', pos: [x, z], yaw: o.yaw ?? 0, weapon: 'sword',
  schedule: o.schedule || [{ h0: 0, h1: 24, poi: o.poi || null, act: 'guard' }],
  spec: { outfit: 'guard', skin: 'fair', hair: { style: 'short', color: 'brown' }, colors: { tabard: o.tabard || '#6c2226' }, weapon: 'sword' }, loot: [['gold', 5]],
});
export const watchman = (id, x, z, o = {}) => ({
  id, name: o.name || 'Watchman', role: 'guard', faction: 'watch', pos: [x, z], yaw: o.yaw ?? 0, weapon: o.weapon || 'sword',
  schedule: o.schedule || [{ h0: 0, h1: 24, poi: o.poi || null, act: 'guard' }],
  spec: { outfit: 'guard', skin: o.skin || 'fair', hair: { style: 'short', color: o.hair || 'brown' }, colors: { tabard: '#6c2226' }, weapon: o.weapon || 'sword' }, loot: [['gold', 4]],
});
