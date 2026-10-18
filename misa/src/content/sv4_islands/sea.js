// The open sea (seto_sea, 72x56) and everything about sailing on it: boat tiers and speed, currents, floating drift items, fish shoals,
// the practice buoy course, weather overlay, and the harbour wrap that adds the ferry sign, the boat berth and the pier-end launch.
// Cozy rules: no fuel, no danger; storms only keep the boat tied up; rowboats rented from the berth return themselves at midnight.
import { register, get, features } from '../../core/registry.js';
import { TILE, moveBody, tileSolid } from '../../world/map.js';
import { itemIcon } from '../../gfx/icons.js';
import { hash } from '../../gfx/noise.js';
import { grid, isle, deckObjects, wrapMap, prop } from './lib.js';
import { S4, ISLANDS, stamp, ferryRunning } from './data.js';

export const TIER_MULT = [1, 1, 1.7, 2.4];
export const TIER_NAME = ['No boat', 'Rented rowboat', 'Sayori Jr. sailboat', 'Sayori Jr. with motor'];
export const boatTier = (g) => { const b = S4(g).boat; return b.own || (b.rentDay === g.day ? 1 : 0); };
export const hasBoat = (g) => boatTier(g) > 0;
export const canRent = (g) => g.flag('seto_licence') || g.check('quest:sv4_licence>=2');
export const BUOYS = [[22, 33], [36, 25], [30, 42]];
export const SHOALS = [[12, 30], [44, 20], [26, 14], [60, 24], [14, 44], [38, 8]];
// currents: tile rectangles pushing the boat (px per second); gentle, a hint of flavour
export const CURRENTS = [
  { x0: 4, y0: 24, x1: 44, y1: 28, dx: 12, dy: 0, name: 'The east stream' },
  { x0: 28, y0: 36, x1: 36, y1: 44, dx: -5, dy: 8, name: 'Whirl' },
  { x0: 46, y0: 18, x1: 66, y1: 24, dx: -9, dy: 0, name: 'The west stream' },
  { x0: 8, y0: 34, x1: 18, y1: 48, dx: 0, dy: -9, name: 'The north stream' },
];
const DRIFT = [['mat_sea_glass', 40], ['mat_driftwood_branch', 30], ['mat_glass_float', 14], ['crop_seaweed', 24], ['min_sunken_coin', 5], ['mat_pearl', 3], ['gift_old_compass', 1.5], ['fish_flyingfish', 6]];

// ---------------------------------------------------------------- map
const G = grid(72, 56, '~');
G.rect(0, 50, 72, 6, 'L');
G.blob(16, 16, 9, 6, 'L').blob(56, 14, 8, 6, 'L').blob(52, 38, 12, 8, 'L').blob(52, 38, 6, 3, '~').rect(50, 29, 3, 9, '~');
G.blob(34, 17, 3, 2, 'L').blob(8, 40, 3, 2, 'L').blob(66, 8, 3, 2, 'L').blob(22, 46, 2, 1, 'L').blob(30, 5, 3, 1, 'L').blob(66, 30, 2, 2, 'L');
G.rect(1, 1, 1, 1, '~');
const WARP = {
  tsubame: { x: 26, y: 15, w: 1, h: 3, to: 'tsubame_pier:from_seto_sea' },
  lantern: { x: 47, y: 13, w: 1, h: 3, to: 'lantern_isle_shore:from_seto_sea' },
  coral: { x: 58, y: 37, w: 1, h: 3, to: 'coral_beach:from_seto_sea' },
  harbour: { x: 35, y: 49, w: 3, h: 1, to: 'harbour:from_seto_sea' },
};
for (const w of Object.values(WARP)) for (let j = 0; j < (w.h || 1); j++) for (let i = 0; i < (w.w || 1); i++) G.set(w.x + i, w.y + j, '~');
const dock = (x, y, w, h) => { const o = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.push({ spr: 'coast_pier_m', x: x + i, y: y + j, wall: true, solid: false }); return o; };
const islets = [[34, 15], [8, 38], [66, 6], [30, 4], [66, 28]];
isle('seto_sea', {
  name: 'Seto Sea', music: 'beach', bg: '#2c4f78', sea: true,
  legend: { '~': 'sv4_sea', L: 'sv4_land' },
  rows: G.rows(),
  objects: [
    ...dock(24, 15, 2, 3), ...dock(48, 13, 2, 3), ...dock(57, 37, 2, 3), ...dock(35, 49, 3, 1),
    { spr: 'sv4_dock_sign', x: 25, y: 14, w: 1, h: 1, solid: false, interact: { label: 'Tsubame Island dock', run: (g) => g.say(null, null, 'Tsubame Island: a fishing village on stilts. Sail east of the pier to dock.') } },
    { spr: 'sv4_dock_sign', x: 48, y: 12, w: 1, h: 1, solid: false, interact: { label: 'Lantern Isle dock', run: (g) => g.say(null, null, 'Lantern Isle: ruins, caves and a second lighthouse. A faded sign says "Mind the moss."') } },
    { spr: 'sv4_dock_sign', x: 59, y: 36, w: 1, h: 1, solid: false, interact: { label: 'Coral Atoll dock', run: (g) => g.say(null, null, 'Coral Atoll: sail through the north channel into the lagoon, then dock on the east shore.') } },
    { spr: 'sv4_dock_sign', x: 38, y: 48, w: 1, h: 1, solid: false, interact: { label: 'Hoshimori Harbour dock', run: (g) => g.say(null, null, 'Home! The harbour lights are just over the wall.') } },
    ...islets.map(([x, y]) => prop('sv4_palm', x - 1, y - 1, { solid: false })),
    ...BUOYS.map(([x, y], i) => ({ spr: 'sv4_buoy_flag', x, y, solid: false, interact: { label: 'Practice buoy', run: (g) => g.say(null, null, S4(g).boat.buoys[i] ? 'You already rounded this buoy.' : 'Sail close to the buoy to round it.') } })),
  ],
  warps: Object.values(WARP).map((w) => ({ ...w })),
  spawns: { default: [36, 46, 'up'], from_harbour: [36, 47, 'up'], from_tsubame_pier: [28, 16, 'right'], from_lantern_isle_shore: [46, 14, 'left'], from_coral_beach: [57, 38, 'left'] },
  spots: { harbour_dock: [36, 47], tsubame_dock: [28, 16], lantern_dock: [46, 14], coral_dock: [57, 38], stream: [20, 26], whirl: [32, 40], open: [36, 30] },
  onEnter(game) {
    if (!game.flag('seto_sea_intro')) { game.setFlag('seto_sea_intro', true); game.run([{ t: 'say', who: null, mood: null, text: 'The open sea! Steer with the arrow keys or the joystick, just like walking. Streams push you along, floating things can be grabbed, and you can cast a line right from the boat.' }]); }
  },
});

// ---------------------------------------------------------------- drift items, per day
let cache = { day: -1, seed: -1, list: [] };
export function driftToday(g) {
  const seed = g.state.seed || 1;
  if (cache.day === g.day && cache.seed === seed) return cache.list;
  const map = get('map', 'seto_sea'), rng = g.rngFor('seto_drift'), out = [], rows = map.rows;
  const total = DRIFT.reduce((a, d) => a + d[1], 0);
  for (let k = 0; k < 10 && out.length < 10; k++) {
    let x = 0, y = 0, ok = false;
    for (let tries = 0; tries < 40 && !ok; tries++) {
      x = 4 + Math.floor(rng() * 64); y = 4 + Math.floor(rng() * 42);
      ok = rows[y][x] === '~' && [[-2, 0], [2, 0], [0, -2], [0, 2]].every(([dx, dy]) => rows[y + dy] && rows[y + dy][x + dx] === '~');
    }
    if (!ok) continue;
    let r = rng() * total, item = DRIFT[0][0];
    for (const [id, w] of DRIFT) { if ((r -= w) < 0) { item = id; break; } }
    out.push({ id: k, x, y, item });
  }
  cache = { day: g.day, seed, list: out };
  return out;
}
export const driftLeft = (g) => driftToday(g).filter((d) => !S4(g).drift.taken[d.id] || S4(g).drift.day !== g.day);
export function grabDrift(g, d) {
  const s = S4(g).drift; if (s.day !== g.day) { s.day = g.day; s.taken = {}; }
  if (s.taken[d.id]) return false;
  s.taken[d.id] = 1; g.give(d.item, 1, true);
  const it = get('item', d.item); g.toast(`Fished out ${it.name.toLowerCase()}`, it.icon); g.sfx('splash'); g.stat('driftFound');
  if (d.item === 'min_sunken_coin' || d.item === 'mat_pearl') g.collect('mineral', d.item);
  return true;
}
export const driftAvail = (g) => { const s = S4(g).drift; return driftToday(g).filter((d) => !(s.day === g.day && s.taken[d.id])); };

// ---------------------------------------------------------------- sailing: speed boost by tier, currents, buoys, distance
const trail = { x: null, y: null };
export function currentAt(tx, ty) { return CURRENTS.find((c) => tx >= c.x0 && tx <= c.x1 && ty >= c.y0 && ty <= c.y1) || null; }
export function sailStep(world, game, dt) {
  const p = world.player, m = world.map; if (!p || !m) return 0;
  const tier = Math.max(1, boatTier(game));
  if (trail.x === null || Math.hypot(p.x - trail.x, p.y - trail.y) > 12) { trail.x = p.x; trail.y = p.y; return 0; }
  const rects = world.rects || [];
  const dx = p.x - trail.x, dy = p.y - trail.y, k = TIER_MULT[tier] - 1;
  if ((dx || dy) && k > 0) moveBody(m, p, dx * k, dy * k, rects);
  const c = currentAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
  if (c && !p.path) moveBody(m, p, c.dx * dt, c.dy * dt, rects);
  const d = Math.hypot(p.x - trail.x, p.y - trail.y);
  trail.x = p.x; trail.y = p.y;
  const st = S4(game); st.boat.sailed += d / TILE;
  if (st.boat.sailed > 150 && !game.flag('seto_sailed_150')) { game.setFlag('seto_sailed_150'); game.toast('You have sailed 150 tiles!', 'i_star'); }
  game.state.stats.tilesSailed = Math.floor(st.boat.sailed);
  BUOYS.forEach(([bx, by], i) => {
    if (!st.boat.buoys[i] && Math.hypot(p.x - (bx * TILE + 8), p.y - (by * TILE + 8)) < 26) {
      st.boat.buoys[i] = 1; game.sfx('chime'); game.toast(`Buoy ${Object.keys(st.boat.buoys).length} of 3 rounded`, 'i_star');
      if (Object.keys(st.boat.buoys).length >= 3) { game.setFlag('seto_buoys_done'); game.toast('Practice course complete!', 'i_trophy'); }
    }
  });
  return d;
}
register('worldTick', 'sv4_sail', { update(dt, world, game) { if (world.map.id === 'seto_sea') sailStep(world, game, dt); else trail.x = null; } });

register('worldLayer', 'sv4_sea', {
  below(g, world, game) {
    if (world.map.id !== 'seto_sea') return;
    const t = game.clock, cx = Math.round(world.cam.x), cy = Math.round(world.cam.y);
    const windy = game.weather === 'windy' || game.weather === 'storm';
    // current streaks
    for (const c of CURRENTS) {
      const x0 = c.x0 * 32 - cx, y0 = c.y0 * 32 - cy, w = (c.x1 - c.x0 + 1) * 32, h = (c.y1 - c.y0 + 1) * 32;
      if (x0 > 320 * 2 || y0 > 224 * 2 || x0 + w < 0 || y0 + h < 0) continue;
      g.fillStyle = 'rgba(232,251,255,0.28)';
      for (let i = 0; i < Math.floor(w * h / 5200); i++) {
        const sx = x0 + ((hash(i, c.x0, 3) * w + t * c.dx * 5) % w + w) % w, sy = y0 + ((hash(i, c.y0, 5) * h + t * c.dy * 5) % h + h) % h;
        g.fillRect(Math.round(sx), Math.round(sy), c.dx ? 7 : 1, c.dy ? 7 : 1);
      }
    }
    // whitecaps
    const n = windy ? 90 : 30;
    g.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < n; i++) {
      const wx = ((hash(i, 1, 7) * 72 * 32 + t * 6) % (72 * 32)), wy = hash(i, 2, 7) * 56 * 32, sx = Math.round(wx - cx), sy = Math.round(wy - cy);
      if (sx < -8 || sx > 640 || sy < -8 || sy > 460) continue;
      if (Math.sin(t * 2 + i) > 0.2) g.fillRect(sx, sy, 6, 1);
    }
  },
  sprites(world, game) {
    if (world.map.id !== 'seto_sea') return [];
    const out = [], p = world.player, tier = Math.max(1, boatTier(game));
    const bob = Math.round(Math.sin(game.clock * 3) * 1);
    out.push({ y: p.y - 0.5, draw: (g, w) => { w.drawFeet('sv4_boat_hull', p.x, p.y + 6 + bob); if (tier >= 2) w.drawFeet('sv4_sail', p.x + 14, p.y - 2 + bob); } });
    out.push({ y: p.y + 0.5, draw: (g, w) => { w.drawFeet('sv4_boat_rim', p.x, p.y + 6 + bob); } });
    if (p.moving) out.push({ y: p.y - 1, draw: (g, w) => { g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 1; i < 4; i++) g.fillRect(w.sx(p.x - 14 * i * (p.dir === 'left' ? -1 : 1)), w.sy(p.y + 7 + (i % 2)), 3, 1); } });
    for (const d of driftAvail(game)) out.push({ y: d.y * TILE + 8, draw: (g, w) => { const wob = Math.sin(game.clock * 2 + d.id) * 1.5; const it = get('item', d.item); w.drawFeet('sv4_drift', d.x * TILE + 8, d.y * TILE + 12 + wob); if (Math.floor(game.clock * 2 + d.id) % 4 === 0) { g.fillStyle = '#fff6a0'; g.fillRect(w.sx(d.x * TILE + 12), w.sy(d.y * TILE + 2), 2, 2); } void it; } });
    for (const [x, y] of SHOALS) out.push({ y: y * TILE, draw: (g, w) => { const r = 3 + Math.sin(game.clock * 3 + x) * 1.5; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(w.sx(x * TILE + 8), w.sy(y * TILE + 8), r * 3, r * 1.4, 0, 0, 6.3); g.stroke(); if (Math.floor(game.clock * 4 + x) % 3 === 0) { g.fillStyle = '#c0e6ff'; g.fillRect(w.sx(x * TILE + 4 + (x % 5)), w.sy(y * TILE + 6), 3, 1); } } });
    return out;
  },
  overlay(g, world, game) {
    if (world.map.id !== 'seto_sea') return;
    const gloom = game.weather === 'rain' ? 0.18 : game.weather === 'cloudy' ? 0.08 : 0;
    if (gloom) { g.fillStyle = `rgba(200,215,230,${gloom})`; g.fillRect(0, 0, 640, 460); }
    const tier = boatTier(game) || 1;
    g.fillStyle = 'rgba(30,22,36,0.7)'; g.fillRect(8, 8, 150, 22);
    const c = currentAt(Math.floor(world.player.x / TILE), Math.floor(world.player.y / TILE));
    g.fillStyle = '#fff1d6'; g.font = '10px monospace';
    g.fillText(`${TIER_NAME[tier]}  x${TIER_MULT[tier]}`, 14, 22);
    if (c) { g.fillStyle = '#bfe6f5'; g.fillText(c.name, 14, 36); }
  },
});
// grab drift items and cast into shoals from the boat
register('targetProvider', 'sv4_sea', {
  find(world, game) {
    if (world.map.id !== 'seto_sea') return null;
    const p = world.player;
    for (const d of driftAvail(game)) {
      const dist = Math.hypot(p.x - (d.x * TILE + 8), p.y - (d.y * TILE + 8));
      if (dist < 24) return { label: `Grab the ${get('item', d.item).name.toLowerCase()}`, dist: dist / 3, x: d.x * TILE + 8, y: d.y * TILE + 8, run: (gm) => grabDrift(gm, d) };
    }
    for (const [x, y] of SHOALS) {
      const dist = Math.hypot(p.x - (x * TILE + 8), p.y - (y * TILE + 8));
      if (dist < 30) return { label: 'Cast into the fish shoal', dist: dist / 3, x: x * TILE + 8, y: y * TILE + 8, run: (gm) => shoal(gm) };
    }
    return null;
  },
});
async function shoal(g) {
  const { goFish } = await import('../hobbies/world.js');
  const before = g.state.stats.fishCaught || 0;
  await goFish(g, 'seto_sea', true);
  if ((g.state.stats.fishCaught || 0) > before) { g.addXP('fishing', 6); g.toast('The shoal rewards you with extra fishing practice', 'i_star'); }
}

// ---------------------------------------------------------------- harbour: ferry sign, boat berth, pier-end launch
register('interaction', 'sv4_berth', { label: 'Boat berth', run: (g) => import('./travel.js').then((m) => m.berth(g)) });
register('interaction', 'sv4_ferry', { label: 'Ferry timetable', run: (g) => import('./travel.js').then((m) => m.ferryMenu(g, 'harbour')) });
const launchWarp = (to, spawnBack) => ({ x: 37, y: 11, w: 1, h: 2, to, locked: (g) => !hasBoat(g) || g.weather === 'storm',
  lockedText: (g) => (g.weather === 'storm' ? 'Too stormy to take a boat out today.' : 'The pier ends here. You need a boat: see the berth sign.') });
void launchWarp;
const hbr = () => wrapMap('harbour', {
  objects: [
    prop('sv4_ferry_sign', 33, 11, { use: 'sv4_ferry', shadow: 8 }),
    prop('sv4_berth_sign', 35, 11, { use: 'sv4_berth', shadow: 8 }),
  ],
  warps: [{ x: 37, y: 11, w: 1, h: 2, to: 'seto_sea:from_harbour', locked: (g) => !hasBoat(g) || g.weather === 'storm', lockedText: (g) => (g.weather === 'storm' ? 'Too stormy to take a boat out today.' : 'The pier ends here. Rent or buy a boat at the berth sign.') }],
  spawns: { from_seto_sea: [36, 12, 'left'] },
  spots: { ferry_sign: [33, 12, 'up'], berth: [35, 12, 'up'] },
});
hbr();
void ISLANDS; void stamp; void ferryRunning; void itemIcon; void tileSolid;

features('Seto Islands', [
  'Seto Sea: an open 72x56 sea map you sail with the arrow keys or the touch joystick, exactly like walking',
  'Boat tiers set your speed: a rented rowboat, the Sayori Jr. sailboat (1.7x) and a motor upgrade (2.4x), with no fuel and no danger',
  'Ocean streams push the boat along (the east stream, the whirl, the west stream, the north stream) with drifting foam streaks',
  'Floating drift items bob on the sea each day (sea glass, floats, driftwood, seaweed, sunken coins, pearls, an old compass) and can be grabbed from the boat',
  'Fish shoals ring the water in six places: cast a line from the boat for bonus fishing practice',
  'Round three practice buoys to finish the boat licence course',
  'Whitecaps freshen up in windy weather, rain greys the sea, and the boat bobs under Misa with a sail once you own a sailboat',
]);
