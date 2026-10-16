// Starfall Depths: the endless cozy descent below mine floor 30 (entered from any Hoshi Mine elevator once floor 30 is reached).
// Floors are generated with the mine's own generator (genFloor) re-weighted for star ore and iridescent geodes; rules stay cozy:
// no combat, dust sprites are shooed with the broom minigame, running out of energy only sends you back to the entrance.
// An hourly "star rain" scatters star fragments over the floor for the first 40 minutes of each hour.
import { register, get, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { mulberry32 } from '../../rng.js';
import { hash } from '../../gfx/noise.js';
import { drawText } from '../../font.js';
import { genFloor, W, H, pickTier, swingCost, hitsNeeded, rollDrops, giveDrops, faintEffects, goFloor, HARD, MIN_TIER, XPV } from '../sv_explore/mine.js';
import { fx } from '../sv_explore/util.js';
import { hasProf } from '../sv_explore/prof.js';
import { inWorld, facingTile } from '../hobbies/common.js';
import { W2, clamp } from './data.js';
import './art.js';

let GAME = null;
const FL = new Map();
const D = () => W2(GAME).depths;
const curDepth = () => (GAME && GAME.state.sv2_wild ? D().floor : 1);
HARD.star = 3; HARD.irid = 3; MIN_TIER.star = 2; MIN_TIER.irid = 2; XPV.star = 14; XPV.irid = 16;
const LABEL = { stone: 'Break the rock', coal: 'Mine the coal', iron: 'Mine the iron vein', silver: 'Mine the silver vein', stargold: 'Mine the star-gold vein', geode: 'Crack the geode node', gem: 'Mine the gem node', crystal: 'Mine the crystal cluster', star: 'Mine the Starfall ore', irid: 'Crack the iridescent geode node' };
export const weights = (d) => [['stone', 28], ['coal', 2], ['iron', 8], ['silver', 12], ['stargold', 14], ['geode', 8], ['gem', 8 + Math.min(6, Math.floor(d / 8))], ['crystal', 6], ['star', 8 + Math.min(12, Math.floor(d / 5))], ['irid', 3 + Math.min(10, Math.floor(d / 6))]];

// ---------------------------------------------------------------- generation
export function genDepth(d, rng) {
  const fd = genFloor(29, rng);
  fd.floor = d;
  const wts = weights(d), tot = wts.reduce((a, [, w]) => a + w, 0);
  for (const r of fd.rocks) {
    if (r.ladder) continue;
    let x = rng() * tot, kind = 'stone';
    for (const [k, w] of wts) if ((x -= w) < 0) { kind = k; break; }
    r.kind = kind;
  }
  const dn = Math.min(6, 2 + Math.floor(d / 10));
  if (fd.dust.length < dn) {
    const taken = new Set([...fd.rocks.map((r) => `${r.x},${r.y}`), `${fd.up[0]},${fd.up[1]}`]), spots = [];
    fd.rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '.' && !taken.has(`${x},${y}`) && Math.hypot(x - fd.up[0], y - fd.up[1]) >= 7) spots.push([x, y]); }));
    while (fd.dust.length < dn && spots.length) { const [x, y] = spots.splice(Math.floor(rng() * spots.length), 1)[0]; fd.dust.push({ id: fd.dust.length, x: x * TILE + 8, y: y * TILE + 8 }); }
  }
  if (d % 10 === 0 && !fd.props.some((p) => p.kind === 'elevator')) fd.props.push({ kind: 'elevator', x: fd.up[0] + 2, y: fd.up[1], solid: true });
  return fd;
}
export function depthData(d) {
  const day = GAME ? GAME.day : 1, key = `${GAME ? GAME.state.seed : 1}:${day}:${d}`;
  if (GAME && GAME.state.sv2_wild) { const st = D(); if (st.day !== day) { st.day = day; st.broken = {}; st.ladders = {}; st.gone = {}; } }
  let fd = FL.get(key);
  if (!fd) {
    fd = genDepth(d, GAME ? GAME.rngFor('sw_fall' + d, day) : mulberry32(d * 977 + 29));
    fd.dmg = {}; fd.shake = {};
    fd.dustRt = fd.dust.map((q) => ({ ...q, tx: q.x, ty: q.y, cd: 0, t: q.id * 1.7 }));
    if (FL.size > 14) FL.clear();
    FL.set(key, fd);
  }
  return fd;
}
const rkey = (d, r) => `${d}:${r.x},${r.y}`;
export const rockBroken = (d, r) => !!D().broken[rkey(d, r)];
const ladderOpen = (d) => !!D().ladders[d];

const wallCache = new Map();
function wallObjects(rows) {
  if (wallCache.has(rows)) return wallCache.get(rows);
  const out = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '#') return;
    const below = rows[y + 1] && rows[y + 1][x], v = Math.floor(hash(x, y, 3) * 3);
    out.push({ spr: below && below !== '#' ? `coast_cave_face_${v}` : `coast_cave_top_${v}`, x, y, wall: true, solid: false });
  }));
  if (wallCache.size > 12) wallCache.clear();
  wallCache.set(rows, out);
  return out;
}
const START = depthData(1);
const mapDef = register('map', 'starfall_depths', {
  name: 'Starfall Depths', noWarp: true, indoor: true, dark: true, music: 'night', bg: '#0e0c1c',
  legend: { '#': 'coast_cavewall', '.': 'dirt' },
  rows: START.rows, objects: [], warps: [], spawns: { default: [START.spawn[0], START.spawn[1], 'down'], from_hoshi_mine: [START.spawn[0], START.spawn[1], 'down'] }, spots: { entrance: START.spawn },
  onEnter(game) { if (game.state.sv2_wild && !game.flag('sw_fall_intro')) { game.setFlag('sw_fall_intro'); game.toast('Starfall Depths: there is no bottom. Stars drift down here, and each hour brings a star rain.'); } },
});
const lazy = (name, fn) => Object.defineProperty(mapDef, name, { enumerable: true, configurable: true, get: fn });
lazy('rows', () => depthData(curDepth()).rows);
lazy('objects', () => wallObjects(depthData(curDepth()).rows));
lazy('spawns', () => { const fd = depthData(curDepth()); return { default: [fd.spawn[0], fd.spawn[1], 'down'], from_hoshi_mine: [fd.spawn[0], fd.spawn[1], 'down'] }; });
lazy('spots', () => ({ entrance: depthData(curDepth()).spawn }));

// ---------------------------------------------------------------- mining
export function depthDrops(game, d, kind) {
  if (kind === 'star') {
    const out = { ore_starfall: 1 + (game.rng() < 0.4 ? 1 : 0) + (hasProf(game, 'prospector') ? 1 : 0) };
    if (game.rng() < 0.25) out.ore_star_gold = 1;
    return out;
  }
  if (kind === 'irid') return { ore_iridescent_geode: 1 + (hasProf(game, 'excavator') ? 1 : 0) };
  const drops = rollDrops(game, 30, kind);
  if (d >= 20 && (kind === 'gem' || kind === 'crystal') && game.rng() < 0.15) drops.min_star_shard = (drops.min_star_shard || 0) + 1;
  return drops;
}
export function faintDepth(game) {
  if (GAME !== game) return Promise.resolve();
  let loss = 0;
  return game.run([
    { t: 'say', who: null, text: 'Your arms turn to jelly and the starlight blurs to a single warm smear... everything goes quiet.' },
    { t: 'call', fn: async (g) => { loss = faintEffects(g); D().floor = 0; await g.warp('hoshi_mine', 7, 7, 'up'); } },
    { t: 'say', who: 'misa', mood: 'sleepy', text: `Ugh... the elevator brought me up by itself, I think. I lost ${loss} coins, but I'm fine. The stars will still be there tomorrow.` },
  ]);
}
export function depthSwing(game, rock) {
  const d = D().floor, tier = pickTier(game);
  if (!tier) { game.toast('You need a pickaxe. Kinoko Woodworks sells them.'); return 'blocked'; }
  if ((MIN_TIER[rock.kind] || 1) > tier) { game.toast(rock.kind === 'stargold' ? 'Too hard for this pickaxe. Ask Tobias for the star upgrade.' : 'Too hard for this pickaxe. Ask Tobias for a copper upgrade.'); return 'blocked'; }
  const cost = swingCost(game, tier);
  if (game.energy < cost) { if (game.energy < 2) faintDepth(game); else game.toast('Too tired to swing. Eat something or head back up.'); return 'tired'; }
  game.useEnergy(cost); game.advance(1); game.sfx('dig'); D().runs++;
  const fd = depthData(d), k = rkey(d, rock);
  fd.dmg[k] = (fd.dmg[k] || 0) + 1; fd.shake[k] = 0.25;
  if (game.world) fx(game, rock.x * TILE + 8, rock.y * TILE + 10, 4, '#b9b2c4');
  if (fd.dmg[k] < hitsNeeded(rock.kind, tier)) { if (game.energy <= 0) faintDepth(game); return 'hit'; }
  D().broken[k] = true; game.sfx('pop'); game.stat('rocksBroken');
  if (rock.ladder) { D().ladders[d] = true; game.toast('A ladder down!', 'i_star'); game.sfx('star'); }
  giveDrops(game, depthDrops(game, d, rock.kind), rock.kind);
  game.addXP('mining', XPV[rock.kind] || 5);
  if (game.world) { fx(game, rock.x * TILE + 8, rock.y * TILE + 8, 8, '#d9d4e2'); game.world.refreshRects(); }
  if (game.energy <= 0) faintDepth(game);
  return 'broke';
}

// ---------------------------------------------------------------- descent, records, rewards
export const MILESTONE = (d) => ({ coins: 500 + d * 45, frag: 2 + Math.floor(d / 20), stickers: d % 20 === 0 ? 1 + Math.floor(d / 40) : 0 });
export async function goDepth(game, d, from = 'up') {
  const st = D(), prev = st.floor;
  st.floor = d;
  if (d > st.best) { st.best = d; game.state.stats.starfallDepth = d; }
  if (d >= 10) st.elev = Math.max(st.elev, d - (d % 10));
  game.bus.emit('starfallFloor', { depth: d, best: st.best });
  const fd = depthData(d);
  let pos = fd.spawn;
  if (from === 'down') { st.ladders[d] = true; if (fd.down) st.broken[rkey(d, { x: fd.down[0], y: fd.down[1] })] = true; pos = fd.down || fd.spawn; }
  if (d % 10 === 0 && !st.rewards[d]) GAME.sv2Fall.reward = d;
  void prev;
  await game.warp('starfall_depths', pos[0], pos[1], 'down');
}
export function enterStarfall(game) {
  const mine = game.state.sv_explore && game.state.sv_explore.mine;
  if (!mine || mine.best < 30) { game.toast('Reach the bottom of Hoshi Mine (floor 30) first.'); return Promise.resolve(); }
  return goDepth(game, 1, 'up');
}
export function applyMilestone(game, d) {
  const st = D(), m = MILESTONE(d);
  if (st.rewards[d]) return null;
  st.rewards[d] = game.day;
  game.addMoney(m.coins, true); game.give('mat_star_fragment', m.frag, true);
  if (m.stickers && game.giveStickers) game.giveStickers(m.stickers, `Starfall depth ${d}`);
  return m;
}
function elevatorMenu(game) {
  const st = D(), opts = [{ text: 'Back to the mine', steps: [{ t: 'call', fn: (g) => { st.floor = 0; return goFloor(g, 30, 'up'); } }] }];
  for (let f = 10; f <= st.elev; f += 10) opts.push({ text: `Depth ${f}`, steps: [{ t: 'call', fn: (g) => goDepth(g, f, 'up') }] });
  opts.push({ text: 'Stay here', steps: [] });
  if (st.elev < 10) return game.say(null, 'neutral', 'The elevator lamp lights up once you have reached depth 10.');
  return game.run([{ t: 'sfx', name: 'bell' }, { t: 'choice', prompt: 'Elevator: which depth?', options: opts }]);
}
function startDust(game, q) {
  const sys = GAME.sv2Fall; if (sys.busy) return;
  sys.busy = true; q.cd = 30;
  const d = D().floor;
  game.toast('A dust sprite pounces!', 'i_exclaim');
  game.minigame('sv_dust_shoo', { size: 1 + Math.floor(d / 10), tier: pickTier(game) || 1 }).then((r) => {
    sys.busy = false;
    if (r && r.data && r.data.shooed) {
      D().gone[`${d}:${q.id}`] = true; D().dust++;
      game.give('mat_stardust', 1 + (game.rng() < 0.5 ? 1 : 0)); game.addXP('mining', 5); game.stat('dustShooed'); game.addMood(2);
      game.bus.emit('dustShooed', { floor: 30 + d });
    } else {
      game.addEnergy(-4); q.cd = 25; q.tx = q.x + (game.rng() - 0.5) * 120; q.ty = q.y + (game.rng() - 0.5) * 80;
      game.toast('The dust sprite tickled you silly. -4 energy', 'i_sweat');
      if (game.energy <= 0) faintDepth(game);
    }
  });
}

// ---------------------------------------------------------------- star rain
const absHour = (g) => g.day * 24 + Math.floor(g.minutes / 60);
export function rainActive(game) { const h = Math.floor(game.minutes / 60); return game.minutes % 60 < 40 && hash(game.day, h, 77) < 0.75; }
let rainKey = '', rainNodes = [];
export function rainNodesNow(game) {
  if (!game.state.sv2_wild || !rainActive(game)) return [];
  const d = D().floor, key = `${absHour(game)}:${d}:${game.state.seed}`;
  if (key !== rainKey) {
    rainKey = key; rainNodes = [];
    const fd = depthData(d), rng = mulberry32(Math.floor(hash(absHour(game), d, 5) * 1e9)), taken = new Set(fd.rocks.map((r) => `${r.x},${r.y}`)), cells = [];
    fd.rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '.' && !taken.has(`${x},${y}`)) cells.push([x, y]); }));
    for (let i = 0; i < 6 && cells.length; i++) { const [x, y] = cells.splice(Math.floor(rng() * cells.length), 1)[0]; rainNodes.push({ i, x, y, id: `${key}:${i}` }); }
  }
  return rainNodes.filter((n) => !D().rain.got[n.id]);
}
export function pickStar(game, n) {
  D().rain.got[n.id] = 1;
  const keys = Object.keys(D().rain.got); if (keys.length > 80) for (const k of keys.slice(0, 40)) delete D().rain.got[k];
  game.give('mat_star_fragment', 1); game.stat('starFragments'); game.sfx('star'); game.addXP('mining', 2); game.addMood(1);
  if (game.rng() < 0.08) { game.give('min_star_shard', 1); game.collect('mineral', 'min_star_shard'); game.bus.emit('mineralFound', { item: 'min_star_shard' }); game.toast('A whole star shard!', get('item', 'min_star_shard').icon); }
  if (game.world) fx(game, n.x * TILE + 8, n.y * TILE + 8, 8, '#fff6a0');
}

// ---------------------------------------------------------------- layers
register('worldLayer', 'sw_fall', {
  solids(world, game) {
    if (world.map.id !== 'starfall_depths' || !GAME) return [];
    const d = D().floor, fd = depthData(d), out = [];
    for (const r of fd.rocks) if (!rockBroken(d, r)) out.push([r.x * TILE, r.y * TILE, TILE, TILE]);
    for (const p of fd.props) if (p.solid) out.push([p.x * TILE, p.y * TILE, TILE, TILE]);
    void game; return out;
  },
  below(g, world, game) {
    if (!GAME || world.map.id !== 'starfall_depths') return;
    const d = D().floor, fd = depthData(d);
    for (const p of fd.props) if (p.kind === 'ladder_up') world.drawSpr('sv_ladder_up', p.x * TILE + 0.5, p.y * TILE - 1);
    if (fd.down && ladderOpen(d)) world.drawSpr('sv_ladder_down', fd.down[0] * TILE + 0.5, fd.down[1] * TILE + 3);
    const t = game.clock || 0;
    for (const n of rainNodesNow(game)) world.drawFeet('sw_star_node', n.x * TILE + 8, n.y * TILE + 12 + Math.round(Math.sin(t * 3 + n.i)));
  },
  sprites(world, game) {
    if (!GAME || world.map.id !== 'starfall_depths') return [];
    const out = [], d = D().floor, fd = depthData(d);
    for (const r of fd.rocks) {
      if (rockBroken(d, r)) continue;
      out.push({ y: (r.y + 1) * TILE, draw: (g, w) => { const sh = fd.shake[rkey(d, r)] || 0; w.drawFeet((r.kind === 'star' || r.kind === 'irid' ? 'sw_rock_' : 'sv_rock_') + r.kind, r.x * TILE + 8 + (sh > 0 ? Math.round(Math.sin(sh * 90)) * 0.5 : 0), (r.y + 1) * TILE - 1); } });
    }
    for (const p of fd.props) if (p.kind === 'elevator') out.push({ y: (p.y + 1) * TILE, draw: (g, w) => w.drawFeet('sv_elevator', p.x * TILE + 8, (p.y + 1) * TILE - 1) });
    for (const q of fd.dustRt) {
      if (D().gone[`${d}:${q.id}`]) continue;
      out.push({ y: q.y, draw: (g, w) => { w.shadow(q.x, q.y + 5, 5); w.drawFeet('sv_dust_' + (Math.floor(q.t * 3) % 2), q.x, q.y + 4 + Math.round(Math.sin(q.t * 3))); } });
    }
    return out;
  },
  overlay(g, world, game) {
    if (!GAME || world.map.id !== 'starfall_depths') return;
    const t = game.clock || 0;
    g.save(); g.fillStyle = '#c9b8ff';
    for (let i = 0; i < 18; i++) { const x = (hash(i, 4, 8) * 330 + t * (3 + (i % 4))) % 320, y = (hash(i, 9, 2) * 230 + t * 10 * (1 + (i % 3) * 0.4)) % 224; g.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + i); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    if (rainActive(game)) { g.fillStyle = '#fff3b0'; for (let i = 0; i < 14; i++) { const x = (hash(i, 6, 1) * 400 + t * 40) % 360 - 20, y = ((hash(i, 2, 6) * 300 + t * 90) % 260) - 20; g.globalAlpha = 0.6; for (let k = 0; k < 6; k++) g.fillRect(Math.round(x - k), Math.round(y - k * 1.6), 1, 1); } }
    g.restore();
  },
});
register('worldTick', 'sw_fall', {
  update(dt, world, game) {
    if (!GAME || world.map.id !== 'starfall_depths') return;
    const st = D(), d = st.floor, fd = depthData(d), p = world.player;
    for (const k of Object.keys(fd.shake)) { fd.shake[k] -= dt; if (fd.shake[k] <= 0) delete fd.shake[k]; }
    for (const q of fd.dustRt) {
      if (st.gone[`${d}:${q.id}`]) continue;
      q.t += dt; q.cd = Math.max(0, q.cd - dt);
      if (Math.hypot(q.tx - q.x, q.ty - q.y) < 3 || hash(Math.floor(q.t), q.id, 5) > 0.97) { q.tx = clamp(q.x + (hash(Math.floor(q.t * 2), q.id, 6) - 0.5) * 110, 24, W * TILE - 24); q.ty = clamp(q.y + (hash(Math.floor(q.t * 2), q.id, 7) - 0.5) * 80, 24, H * TILE - 24); }
      const a = Math.atan2(q.ty - q.y, q.tx - q.x), nx = q.x + Math.cos(a) * 14 * dt, ny = q.y + Math.sin(a) * 14 * dt;
      if (fd.rows[Math.floor(ny / TILE)] && fd.rows[Math.floor(ny / TILE)][Math.floor(nx / TILE)] === '.') { q.x = nx; q.y = ny; } else { q.tx = q.x; q.ty = q.y; }
      if (q.cd <= 0 && inWorld(game) && !world.busy && Math.hypot(q.x - p.x, q.y - (p.y - 4)) < 11) startDust(game, q);
    }
    if (GAME.sv2Fall.reward != null && inWorld(game) && !world.busy) {
      const rd = GAME.sv2Fall.reward; GAME.sv2Fall.reward = null;
      const m = applyMilestone(game, rd);
      if (m) game.run([{ t: 'sfx', name: 'star' }, { t: 'say', who: null, text: `Depth ${rd}! A little cairn of glowing stones holds a gift: ${m.coins} coins, ${m.frag} star fragments${m.stickers ? ` and ${m.stickers} Star Sticker${m.stickers > 1 ? 's' : ''}` : ''}.` }]);
    }
  },
});
register('targetProvider', 'sw_fall', {
  find(world, game) {
    if (!GAME || !game.state.sv2_wild) return null;
    // the Hoshi Mine elevator gains a Starfall choice once floor 30 has been reached
    if (world.map.id === 'hoshi_mine') {
      const mine = game.state.sv_explore && game.state.sv_explore.mine;
      const orig = get('targetProvider', 'sv_mine'), t = orig && mine && mine.best >= 30 ? orig.find(world, game) : null;
      if (t && t.label === 'Use the elevator') return { ...t, run: (g) => g.run([{ t: 'sfx', name: 'bell' }, { t: 'choice', prompt: 'Elevator', options: [{ text: 'Mine floors', steps: [{ t: 'call', fn: () => t.run(g) }] }, { text: 'Starfall Depths', steps: [{ t: 'call', fn: (gm) => enterStarfall(gm) }] }, { text: 'Stay here', steps: [] }] }]) };
      return null;
    }
    if (world.map.id !== 'starfall_depths') return null;
    const st = D(), d = st.floor, fd = depthData(d), p = world.player, fxp = p.x, fyp = p.y - 3, [ftx, fty] = facingTile(world, 13);
    let best = null, bs = 99;
    const consider = (cx, cy, label, run, bias = 0) => { const dd = Math.hypot(cx - fxp, cy - fyp), s = dd - bias; if (dd < 24 && s < bs) { bs = s; best = { label, dist: Math.max(0, dd - 10), x: cx, y: cy, run }; } };
    for (const r of fd.rocks) {
      if (rockBroken(d, r)) continue;
      const tier = pickTier(game), gated = (MIN_TIER[r.kind] || 1) > tier && tier > 0;
      consider(r.x * TILE + 8, r.y * TILE + 8, gated ? `${LABEL[r.kind]} (needs a better pickaxe)` : LABEL[r.kind], (g) => depthSwing(g, r), r.x === ftx && r.y === fty ? 9 : 0);
    }
    for (const q of fd.props) {
      const cx = q.x * TILE + 8, cy = q.y * TILE + 8;
      if (q.kind === 'ladder_up') consider(cx, cy, d === 1 ? 'Climb up to the mine' : `Climb up to depth ${d - 1}`, (g) => (d === 1 ? (st.floor = 0, goFloor(g, 30, 'up')) : goDepth(g, d - 1, 'down')), 4);
      else if (q.kind === 'elevator') consider(cx, cy, 'Use the elevator', (g) => elevatorMenu(g));
    }
    if (fd.down && ladderOpen(d)) consider(fd.down[0] * TILE + 8, fd.down[1] * TILE + 8, `Climb down to depth ${d + 1}`, (g) => goDepth(g, d + 1, 'up'), 4);
    for (const q of fd.dustRt) if (!st.gone[`${d}:${q.id}`]) consider(q.x, q.y, 'Shoo the dust sprite', (g) => startDust(g, q), 2);
    for (const n of rainNodesNow(game)) consider(n.x * TILE + 8, n.y * TILE + 8, 'Catch the falling star', (g) => pickStar(g, n), 3);
    return best;
  },
});
register('hud', 'sw_fall', {
  draw(g, game) {
    if (!GAME || !game.world || game.hideHud || !game.world.map || game.world.map.id !== 'starfall_depths') return;
    const st = D(), t = `DEPTH ${st.floor}   BEST ${st.best}${rainActive(game) ? '   STAR RAIN!' : ''}`;
    g.fillStyle = '#2b1d2ed0'; g.fillRect(4, 206, t.length * 4 + 8, 12); drawText(g, t, 8, 210, rainActive(game) ? '#fff6a0' : '#d9c8ff', 1, null);
  },
});

export function starfallSystem(game) {
  GAME = game; FL.clear(); rainKey = '';
  game.sv2Fall = { reward: null, busy: false };
  game.bus.on('dayStart', () => { if (!game.state.sv2_wild) return; const st = D(); st.floor = 0; st.day = game.day; st.broken = {}; st.ladders = {}; st.gone = {}; FL.clear(); rainKey = ''; });
  game.bus.on('gameLoaded', () => { GAME = game; game.sv2Fall.busy = false; FL.clear(); rainKey = ''; });
  game.bus.on('newGame', () => { game.sv2Fall.busy = false; FL.clear(); rainKey = ''; });
  game.bus.on('hour', () => {
    if (!game.world || !game.world.map || game.world.map.id !== 'starfall_depths' || !game.state.sv2_wild) return;
    if (rainActive(game)) { game.toast('Star rain! Stars are falling on this floor.', 'i_star'); game.bus.emit('starRain', { depth: D().floor }); game.stat('starRains'); }
  });
}

features('Wild Places', [
  'Starfall Depths: an endless cozy descent below mine floor 30, entered through a new Starfall choice on any Hoshi Mine elevator once you have reached the bottom',
  'Every Starfall floor is generated fresh each day from the mine\'s own cavern generator, with a ladder rock hiding the way down and no bottom in sight',
  'Starfall rocks include Starfall ore (violet, rings like a bell), iridescent geode nodes, star-gold, silver and gem nodes, with richer loot the deeper you go',
  'Dust sprites in the depths grow in number and speed with depth and are shooed with the same broom minigame (never any combat)',
  'Fainting or running out of energy in the depths only sends you back to the mine entrance with a small coin loss',
  'Depth records: your best Starfall depth is a counter, shown on the depth HUD, the guild trophy case and the leaderboard against the guild veterans',
  'Star rain: during the first 40 minutes of most hours, shooting stars fall on the floor you are on; catch the glowing stars for star fragments (and sometimes a star shard)',
  'Every 10 depths there is an elevator, and it remembers the tens you have reached so you can ride back down to them',
  'Every 10 depths also holds a first-time cairn reward of coins, star fragments and Star Stickers',
  'A depth HUD tag shows your depth, your Starfall record and a STAR RAIN alert',
]);
