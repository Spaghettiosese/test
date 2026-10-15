// Hobbies in the overworld: garden plots (worldLayer + targetProvider + daily growth), fishing from any water tile,
// visible bug critters that flee, daily beach finds and dig spots, cave rocks.
import { register, get, all, features } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { TILE, buildMap } from '../../world/map.js';
import { dateOf, seasonOf } from '../../core/time.js';
import { hash } from '../../gfx/noise.js';
import { HS, clamp, hour, inTimes, weatherOk, weighted, tileOf, isWater, facingTile, tileCentre, sparkle, hasTool, luck, inWorld } from './common.js';

// =================================================================== ART
const D = Rr.dirt;
for (const wet of [0, 1]) defineSprite(`hob_soil${wet ? '_wet' : ''}`, 32, 32, (R, { season }) => {
  const b = wet ? [D[0], D[1], D[2]] : [D[1], D[2], D[3]];
  R(1, 2, 30, 29, b[1]); R(2, 1, 28, 1, b[1]); R(2, 31, 28, 1, b[0]);
  for (let y = 5; y < 30; y += 6) { R(2, y, 28, 2, b[0]); R(2, y - 1, 28, 1, b[2]); }
  for (let i = 0; i < 9; i++) R(3 + Math.floor(hash(i, 3, wet + 7) * 26), 3 + Math.floor(hash(i, 5, 2) * 26), 1, 1, b[2]);
  if (season === 'winter') for (let i = 0; i < 16; i++) R(2 + Math.floor(hash(i, 9, 4) * 28), 3 + Math.floor(hash(i, 2, 8) * 26), 2, 1, Rr.snow[3]);
}, { hd: true, seasonal: true });
defineSprite('hob_dig', 14, 9, (R) => { R.e(7, 6, 6, 2, D[2]); R.e(6, 5, 4, 1, D[3]); R(3, 2, 1, 2, D[1]); R(5, 1, 1, 2, D[1]); R(9, 1, 1, 3, D[1]); R(11, 2, 1, 2, D[1]); R(4, 4, 1, 1, Rr.stone[4]); }, { hd: true, outline: 'selective' });
defineSprite('hob_weed', 16, 12, (R) => { R(7, 3, 2, 9, Rr.forest[2]); R(3, 5, 4, 2, Rr.forest[3]); R(9, 4, 4, 2, Rr.forest[3]); R(5, 8, 3, 2, Rr.forest[1]); }, { hd: true, outline: 'selective' });

// Crop art: one parametric drawer per plant kind, 5 growth stages (0 seed .. 4 ripe), plus wilted and dead looks.
function cropArt(R, W, H, kind, c, c2, stage, look) {
  const L = look === 'wilt' ? Rr.grassAutumn : look === 'dead' ? Rr.dirt : Rr.forest, cx = Math.floor(W / 2), by = H - 1;
  const leaf = (x, y, rx, ry, k = 2) => { R.e(x, y, rx, ry, L[k]); R.e(x - 1, y - 1, Math.max(1, rx - 2), Math.max(1, ry - 1), L[k + 1]); };
  R.e(cx, by - 1, 6, 1, D[1]);
  if (stage === 0) { R.e(cx, by - 2, 5, 2, D[2]); R.e(cx - 1, by - 3, 3, 1, D[3]); R(cx - 2, by - 3, 1, 1, Rr.wood[3]); R(cx + 2, by - 2, 1, 1, Rr.wood[3]); return; }
  if (look === 'dead') { R(cx, by - 10, 1, 9, D[2]); R(cx - 4, by - 8, 4, 1, D[2]); R(cx + 1, by - 6, 4, 1, D[1]); R(cx - 3, by - 4, 2, 1, D[3]); return; }
  if (stage === 1) { R(cx, by - 7, 1, 6, L[2]); leaf(cx - 3, by - 8, 3, 1); leaf(cx + 3, by - 7, 3, 1); return; }
  const droop = look === 'wilt' ? 2 : 0, big = stage >= 3;
  switch (kind) {
    case 'leafy': case 'head': {
      const r = stage === 2 ? 5 : 8;
      leaf(cx - r + 2, by - 4 + droop, r - 2, 3); leaf(cx + r - 2, by - 4 + droop, r - 2, 3); leaf(cx, by - 7 - (big ? 3 : 0) + droop, r - 1, big ? 5 : 3, 2);
      if (stage === 4 && kind === 'head') { R.e(cx, by - 11, 5, 4, c); R.e(cx - 1, by - 12, 3, 2, c2 === c ? L[3] : L[3]); for (let i = 0; i < 5; i++) R(cx - 4 + i * 2, by - 13 + (i % 2), 1, 1, L[4]); }
      else if (stage === 4) { R.e(cx, by - 9, 6, 5, c); R.e(cx - 2, by - 11, 3, 2, L[4]); R(cx, by - 13, 1, 8, L[1]); }
      break;
    }
    case 'root': {
      const h = stage === 2 ? 8 : 13;
      for (const [dx, k] of [[-3, 2], [0, 3], [3, 2]]) { R(cx + dx, by - h + droop + Math.abs(dx), 1, h - 2 - Math.abs(dx), L[1]); leaf(cx + dx * 2, by - h + droop + Math.abs(dx), 2, 4, k === 3 ? 2 : 1); }
      if (stage === 4) { R.e(cx, by - 2, 5, 3, c); R.e(cx - 2, by - 3, 2, 1, Rr.paper[4]); R(cx - 5, by - 1, 11, 1, D[1]); }
      break;
    }
    case 'bush': {
      leaf(cx, by - 6 + droop, big ? 9 : 6, big ? 5 : 4, 1); leaf(cx - 3, by - 8 + droop, big ? 5 : 3, 3, 2); leaf(cx + 4, by - 7 + droop, 4, 3, 2);
      if (stage === 4) for (const [x, y] of [[-6, -4], [5, -3], [-1, -9], [3, -8], [-4, -7], [7, -6]]) { R.e(cx + x, by + y, 1, 1, c); R(cx + x - 1, by + y - 1, 1, 1, Rr.paper[4]); }
      if (stage === 3) for (const [x, y] of [[-5, -8], [4, -9]]) R(cx + x, by + y, 2, 2, Rr.paper[4]);
      break;
    }
    case 'vine': {
      const h = stage === 2 ? 12 : 22;
      if (big) { R(cx + 5, by - h - 2, 2, h + 1, Rr.wood[2]); R(cx + 5, by - h - 2, 1, h + 1, Rr.wood[3]); }
      for (let y = 0; y < h; y += 4) leaf(cx - 2 + ((y / 4) % 2 ? 5 : -2), by - 3 - y + droop, 3, 2, (y / 4) % 2 ? 2 : 1);
      R(cx, by - h, 1, h, L[1]);
      if (stage === 4) for (const [x, y] of [[-4, -8], [3, -13], [-3, -17], [4, -6]]) { if (kind === 'vine' && c === Rr.forest[3]) { R(cx + x, by + y, 2, 5, c); R(cx + x, by + y, 1, 2, L[4]); } else { R.e(cx + x, by + y, 2, 2, c); R(cx + x - 1, by + y - 1, 1, 1, Rr.paper[4]); } }
      break;
    }
    case 'tall': {
      const h = stage === 2 ? 14 : stage === 3 ? 26 : 30;
      R(cx, by - h, 2, h, L[1]); R(cx, by - h, 1, h, L[2]);
      for (let y = 4; y < h - 4; y += 6) { leaf(cx - 4, by - y + droop, 4, 1, 2); leaf(cx + 5, by - y - 3 + droop, 4, 1, 1); }
      if (stage === 4 && c === Rr.butter[2] && c2 === Rr.wood[1]) { for (let a = 0; a < 10; a++) R.e(cx + Math.round(Math.cos(a * 0.63) * 6), by - h + Math.round(Math.sin(a * 0.63) * 5), 2, 2, c); R.e(cx, by - h, 4, 3, Rr.wood[1]); R(cx - 1, by - h - 1, 2, 1, Rr.wood[2]); }
      else if (stage === 4) { R(cx + 2, by - h + 6, 4, 9, c); R(cx + 2, by - h + 6, 1, 9, Rr.paper[4]); R(cx + 1, by - h + 5, 2, 4, L[3]); R(cx - 1, by - h - 3, 1, 4, Rr.wood[3]); }
      break;
    }
    case 'melon': {
      for (const [x, y, r] of [[-8, -3, 4], [7, -4, 4], [-2, -6, 5], [3, -2, 3]]) leaf(cx + x, by + y + droop, r, 3, 1);
      R(cx - 12, by - 2, 24, 1, L[1]);
      if (stage >= 3) { const r = stage === 4 ? 7 : 3; R.e(cx + 2, by - r + 1, r + 1, r, c); R.e(cx, by - r, Math.max(1, r - 3), Math.max(1, r - 3), Rr.paper[4] === c ? c : c2 === Rr.coral[2] ? Rr.forest[3] : Rr.butter[3]); for (let i = -r; i <= r; i += 3) R(cx + 2 + i, by - r * 2 + 2, 1, r * 2 - 2, c2 === Rr.coral[2] ? Rr.forest[1] : Rr.hairGinger[1]); }
      break;
    }
    default: { // flower
      const h = stage === 2 ? 9 : 15;
      R(cx, by - h, 1, h, L[1]); leaf(cx - 3, by - 5 + droop, 3, 1, 2); leaf(cx + 3, by - 8 + droop, 3, 1, 2);
      if (stage === 3) { R.e(cx, by - h - 1, 2, 3, c2 === Rr.butter[2] ? Rr.forest[3] : L[3]); R(cx, by - h - 3, 1, 2, c); }
      if (stage === 4) { for (const [x, y] of [[0, -4], [-4, -1], [4, -1], [-2, 3], [2, 3]]) R.e(cx + x, by - h - 2 + y, 2, 2, c); R.e(cx, by - h - 2, 1, 1, c2 === c ? Rr.butter[2] : c2); R(cx - 2, by - h - 6, 2, 1, Rr.paper[4]); }
    }
  }
}
const cropSize = (kind) => [28, kind === 'tall' ? 38 : kind === 'vine' ? 30 : 24];
for (const cr of all('crop')) {
  const k = cr.id.slice(5), [W, H] = cropSize(cr.kind);
  for (let s = 0; s < 5; s++) defineSprite(`hob_crop_${k}_${s}`, W, H, (R) => cropArt(R, W, H, cr.kind, cr.c, cr.c2, s, ''), { hd: true, outline: 'selective' });
  defineSprite(`hob_crop_${k}_wilt`, W, H, (R) => cropArt(R, W, H, cr.kind, cr.c, cr.c2, 3, 'wilt'), { hd: true, outline: 'selective' });
}
defineSprite('hob_crop_dead', 20, 16, (R) => cropArt(R, 20, 16, 'flower', 0, 0, 3, 'dead'), { hd: true, outline: 'selective' });
defineSprite('hob_crop_giant', 40, 30, (R) => { R.e(20, 18, 18, 11, Rr.hairGinger[2]); for (let x = 5; x < 36; x += 6) R(x, 9, 2, 19, Rr.hairGinger[1]); R.e(14, 13, 6, 3, Rr.hairGinger[3]); R(19, 2, 3, 7, Rr.forest[1]); R(21, 4, 6, 3, Rr.forest[2]); }, { hd: true, outline: 'selective' });

// Critter sprites (world, 1:1): 2 animation frames per bug, by movement kind.
function critter(R, kind, c, c2, f) {
  if (kind === 'fly') { R(4, 3, 1, 4, Rr.charcoal[1]); if (f) { R.e(2, 3, 2, 2, c); R.e(6, 3, 2, 2, c); R(1, 2, 1, 1, c2); R(7, 2, 1, 1, c2); } else { R(1, 1, 3, 4, c); R(5, 1, 3, 4, c); R(2, 2, 1, 2, c2); R(6, 2, 1, 2, c2); } }
  else if (kind === 'dart') { R(1, 3, 9, 1, c); R(8, 2, 2, 3, c2); R(4, 1 + f, 2, 1, Rr.paper[4]); R(4, 4 - f, 2, 1, Rr.paper[4]); R(6, 1 + f, 2, 1, Rr.sky[4]); R(6, 4 - f, 2, 1, Rr.sky[4]); }
  else if (kind === 'glow') { R(1, 1, 2, 2, f ? '#e8ff9a' : '#b0d060'); }
  else if (kind === 'hop') { R(1, 2 - f, 6, 2, c); R(1, 2 - f, 6, 1, c2); R(6, 1 - f, 2, 2, c2); R(2, 4 - f, 1, 1 + f, Rr.charcoal[1]); R(5, 4 - f, 1, 1 + f, Rr.charcoal[1]); }
  else if (kind === 'cling') { R.e(3, 4, 2, 3, c); R(3, 1, 1, 6, c2); R(1, 3 + f, 1, 1, Rr.charcoal[1]); R(5, 3 + f, 1, 1, Rr.charcoal[1]); }
  else { R.e(3, 2, 2 + f, 1, c); R(2, 2, 2, 1, c2); R(5 + f, 2, 1, 1, Rr.charcoal[1]); }
}
const CSIZE = { fly: [9, 7], dart: [11, 6], glow: [4, 4], hop: [9, 6], cling: [7, 8], crawl: [8, 4] };
for (const b of all('bug')) for (const f of [0, 1]) { const [w, h] = CSIZE[b.kind]; defineSprite(`hob_c_${b.id.slice(4)}_${f}`, w, h, (R) => critter(R, b.kind, b.c, b.c2, f), { hd: true, outline: b.kind === 'glow' ? false : 'ink' }); }

// =================================================================== GARDEN
export function plotRects(map) { const p = map && map.def.gardenPlots; if (!p) return []; return Array.isArray(p[0]) ? p : [p]; }
export const inPlot = (map, tx, ty) => plotRects(map).some(([x, y, w, h]) => tx >= x && ty >= y && tx < x + w && ty < y + h);
const plotsOf = (game, mapId) => (HS(game).plots[mapId] ||= {});
export const canMax = (game) => (game.has('tool_can_2') ? 40 : 20);
const stageOf = (p, cr) => (p.age >= cr.days ? 4 : p.age === 0 ? 0 : p.age < cr.days * 0.34 ? 1 : p.age < cr.days * 0.75 ? 2 : 3);
export const isRipe = (p) => { const cr = p && p.crop && get('crop', p.crop); return !!cr && !p.dead && p.age >= cr.days; };

function gardenAction(game, world) {
  const [tx, ty] = facingTile(world, 13);
  if (!inPlot(world.map, tx, ty)) return null;
  const P = plotsOf(game, world.map.id), key = `${tx},${ty}`, p = P[key], cr = p && p.crop && get('crop', p.crop), [x, y] = tileCentre(tx, ty);
  const at = (label, run, dist = 7) => ({ label, dist, x, y, run: (g) => run(g, P, key, tx, ty) });
  if (!p || !p.till) return at('Till soil', till);
  if (p.dead) return at('Clear withered plant', (g, P2, k) => { delete P2[k].crop; P2[k].dead = false; g.sfx('dig'); sparkle(world, x, y, 4, D[3]); });
  if (!cr) {
    const s = HS(game).seed, sd = s && get('item', s);
    if (sd && game.has(s) && sd.seasons.includes(game.season)) return at(`Plant ${sd.name.replace(' seeds', '').toLowerCase()}`, (g) => plant(g, P, key, s));
    return at('Plant seeds', (g) => pickSeed(g, P, key));
  }
  if (isRipe(p)) return at(`Harvest ${get('item', cr.item).name.toLowerCase()}`, harvest);
  if (p.wat !== game.day) return at(p.wilt ? 'Water (thirsty!)' : 'Water', water);
  return at(`${cr.name}: ${cr.days - p.age} day${cr.days - p.age === 1 ? '' : 's'} to go`, (g) => g.toast(`Watered today. ${cr.name} grows overnight.`, get('item', cr.item).icon), 12);
}
function till(game, P, key, tx, ty) {
  if (!hasTool(game, 'tool_hoe', 'tool_hoe_2')) return game.toast('You need a hoe to till the soil');
  if (!game.useEnergy(game.has('tool_hoe_2') ? 1 : 2)) return;
  P[key] = { till: game.day, age: 0, wat: 0, dry: 0 };
  game.sfx('dig'); game.addXP('gardening', 1); game.advance(5);
  const [x, y] = tileCentre(tx, ty); sparkle(game.world, x, y + 4, 5, D[3]);
}
function plant(game, P, key, seed) {
  const sd = get('item', seed);
  if (!game.take(seed, 1)) return;
  const p = P[key]; Object.assign(p, { crop: sd.crop, age: 0, wat: 0, dry: 0, wilt: false, dead: false, planted: game.day });
  for (const f of ['mat_premium_fertiliser', 'mat_fertiliser']) if (get('item', f) && game.take(f, 1)) { p.age = f === 'mat_fertiliser' ? 1 : 2; game.toast(`Fertiliser added: ${get('crop', sd.crop).name} grows faster`, get('item', f).icon); break; }
  game.sfx('pop'); game.addXP('gardening', 2); game.stat('planted'); game.bus.emit('planted', { crop: sd.crop });
  if (!game.has(seed)) HS(game).seed = null;
}
function pickSeed(game, P, key) {
  const seeds = Object.keys(game.state.inv).filter((id) => get('item', id) && get('item', id).cat === 'seed' && get('item', id).crop && get('crop', get('item', id).crop));
  if (!seeds.length) return game.say('misa', 'neutral', 'No seeds in my bag. Sunny Mart sells seed packets for this season.');
  const ok = seeds.filter((id) => get('item', id).seasons.includes(game.season));
  if (!ok.length) return game.say('misa', 'neutral', `None of my seeds grow in ${game.season}. They'd just wither.`);
  game.run([{ t: 'choice', prompt: 'Plant which seeds?', options: [...ok.slice(0, 5).map((id) => ({ text: `${get('item', id).name} (${game.count(id)})`, steps: [{ t: 'call', fn: (g) => { HS(g).seed = id; plant(g, P, key, id); } }] })), { text: 'Not now', steps: [] }] }]);
}
function water(game, P, key, tx, ty) {
  if (!hasTool(game, 'tool_can', 'tool_can_2')) return game.toast('You need a watering can');
  const st = HS(game);
  if (st.can <= 0) return game.toast('The can is empty. Refill it at water or the garden tap', 'i_rain');
  const keys = [key];
  if (game.has('tool_can_2')) { const p = game.world.player, side = p.dir === 'up' || p.dir === 'down' ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]]; for (const [dx, dy] of side) keys.push(`${tx + dx},${ty + dy}`); }
  let n = 0;
  for (const k of keys) { const p = P[k]; if (!p || !p.crop || p.dead || p.wat === game.day || st.can <= 0) continue; p.wat = game.day; if (p.wilt) { p.wilt = false; p.dry = 0; } st.can--; n++; const [a, b] = k.split(',').map(Number), [x, y] = tileCentre(a, b); for (let i = 0; i < 6; i++) game.world.particles.push({ c: i % 2 ? Rr.sky[3] : Rr.water[4], x: x + (Math.random() - 0.5) * 12, y: y - 6, vx: (Math.random() - 0.5) * 10, vy: 30 + Math.random() * 20, life: 0.4, s: 1 }); }
  if (!n) return;
  game.sfx('water'); game.useEnergy(1); game.addXP('gardening', n); game.stat('watered', n); game.advance(2);
}
function harvest(game, P, key, tx, ty) {
  const p = P[key], cr = get('crop', p.crop);
  let item = cr.item, n = 1 + (game.rng() < game.skillLevel('gardening') * 0.05 ? 1 : 0);
  if (p.giant) { item = cr.id === 'crop_pumpkin' ? 'crop_giant_pumpkin' : 'crop_giant_tomato'; n = 1; p.giant = false; }
  game.give(item, n); game.sfx('pop'); game.addXP('gardening', 3 + Math.ceil(cr.days / 2)); game.stat('harvested', n); game.collect('crop', cr.item);
  game.bus.emit('harvested', { crop: cr.id, item, n });
  const [x, y] = tileCentre(tx, ty); sparkle(game.world, x, y, 8);
  if (cr.regrow) p.age = cr.days - cr.regrow; else { delete p.crop; p.age = 0; }
}
function dailyGarden(game) {
  const day = game.day, season = game.season, wet = ['rain', 'storm', 'snow'].includes(game.weather);
  for (const [mapId, P] of Object.entries(HS(game).plots)) {
    const outdoor = !!(get('map', mapId) || {}).outdoor || mapId === 'yard' || mapId === 'school_grounds';
    for (const [k, p] of Object.entries(P)) {
      if (!p.crop) { if (!p.till || day - p.till > 6) delete P[k]; continue; }
      const cr = get('crop', p.crop);
      if (!cr) { delete P[k]; continue; }
      if (p.dead) continue;
      if (!cr.seasons.includes(season)) { p.dead = true; continue; }
      if (p.wat === day - 1 && p.age < cr.days) { p.age++; p.dry = 0; p.wilt = false; }
      else if (p.age < cr.days) { p.dry = (p.dry || 0) + 1; if (p.dry >= 2) p.wilt = true; }
      if (p.age >= cr.days && (cr.id === 'crop_pumpkin' || cr.id === 'crop_tomato') && game.rngFor('giant' + k)() < 0.04) p.giant = true;
      if (wet && outdoor) p.wat = day;
    }
  }
  if (dateOf(day) === 25) {
    const next = seasonOf(day + 4), doomed = Object.values(HS(game).plots).some((P) => Object.values(P).some((p) => p.crop && !p.dead && !get('crop', p.crop).seasons.includes(next)));
    if (doomed) game.toast(`Garden: some crops won't survive into ${next}. Harvest soon!`, 'i_leaf');
  }
  if (wet && Object.keys(HS(game).plots).length) game.toast('The rain watered the garden', 'i_rain');
}

register('worldLayer', 'hob_garden', {
  below(g, world, game) {
    const P = HS(game).plots[world.map.id]; if (!P) return;
    for (const [k, p] of Object.entries(P)) if (p.till) { const [tx, ty] = k.split(',').map(Number); world.drawSpr(p.wat === game.day ? 'hob_soil_wet' : 'hob_soil', tx * TILE, ty * TILE); }
  },
  sprites(world, game) {
    const P = HS(game).plots[world.map.id], out = []; if (!P) return out;
    for (const [k, p] of Object.entries(P)) {
      if (!p.crop) continue;
      const [tx, ty] = k.split(',').map(Number), cr = get('crop', p.crop); if (!cr) continue;
      const name = p.dead ? 'hob_crop_dead' : p.giant ? 'hob_crop_giant' : p.wilt ? `hob_crop_${cr.id.slice(5)}_wilt` : `hob_crop_${cr.id.slice(5)}_${stageOf(p, cr)}`;
      const ripe = isRipe(p) && !p.dead;
      out.push({ y: ty * TILE + 14, draw: (gg, w, gm) => { w.drawFeet(name, tx * TILE + 8, ty * TILE + 15); if (ripe && Math.floor(gm.clock * 2 + tx) % 5 === 0) { gg.fillStyle = '#fff6a0'; gg.fillRect(w.sx(tx * TILE + 12), w.sy(ty * TILE + 1), 2, 2); } } });
    }
    return out;
  },
});
register('targetProvider', 'hob_garden', { find: (world, game) => gardenAction(game, world) });

// Watering can: fills at the garden tap when you step into a garden map, and at any water's edge.
register('worldTick', 'hob_can', {
  update(dt, world, game) {
    if (!game.state.hobbies || !hasTool(game, 'tool_can', 'tool_can_2')) return;
    const st = HS(game), mx = canMax(game);
    if (st.can >= mx) return;
    const p = world.player, tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 4) / TILE);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (isWater(tileOf(world, tx + dx, ty + dy))) { st.can = mx; game.toast('Watering can filled', 'i_rain'); game.sfx('water'); return; }
  },
});
register('hud', 'hob_can', {
  draw(g, game) {
    const w = game.world; if (!w || game.hideHud || !plotRects(w.map).length || !hasTool(game, 'tool_can', 'tool_can_2')) return;
    const v = HS(game).can / canMax(game);
    g.fillStyle = '#2b1d2ed0'; g.fillRect(2, 200, 50, 12);
    g.fillStyle = Rr.sky[2]; g.fillRect(5, 203, 7, 6); g.fillRect(12, 204, 3, 1); g.fillStyle = Rr.sky[1]; g.fillRect(5, 207, 7, 2);
    g.fillStyle = '#2a1a22'; g.fillRect(17, 204, 32, 5); g.fillStyle = Rr.water[3]; g.fillRect(18, 205, Math.round(30 * v), 3);
  },
});

// =================================================================== FISHING
const ROD_TIER = (game) => (game.has('tool_rod_3') ? 3 : game.has('tool_rod_2') ? 2 : 1);
export function fishPool(game, mapId, ocean) {
  const h = hour(game), here = (f) => f.maps.includes(mapId);
  let list = all('fish').filter(here);
  if (!list.length) list = all('fish').filter((f) => f.maps.includes(ocean ? 'harbour' : 'park')); // any other pond or sea
  if (!list.length) list = all('fish').filter((f) => f.id === 'fish_crucian');
  return list.filter((f) => f.seasons.includes(game.season) && inTimes(f.times, h) && weatherOk(f.weather, game.weather));
}
export function rollFish(game, mapId, ocean, bait) {
  const pool = fishPool(game, mapId, ocean), L = luck(game) * (bait === 'mat_bait_premium' ? 1.8 : 1);
  return weighted(game.rng, pool.length ? pool : all('fish').slice(0, 1), (f) => (f.rarity <= 1 ? (bait === 'mat_bait_worms' ? 14 : 10) : f.rarity === 2 && bait === 'mat_bait_shrimp' ? 9 : 10 / Math.pow(f.rarity, 1.7) * (f.rarity >= 3 ? L : 1)));
}
function fishTarget(world, game) {
  for (const reach of [12, 24]) {
    const [tx, ty] = facingTile(world, reach), t = tileOf(world, tx, ty);
    if (isWater(t)) { const [x, y] = tileCentre(tx, ty); return { label: 'Fish', dist: 9, x, y, run: (g) => goFish(g, world.map.id, t.ground === 'ocean') }; }
  }
  return null;
}
export function goFish(game, mapId, ocean) {
  if (!hasTool(game, 'tool_rod', 'tool_rod_2', 'tool_rod_3')) return game.toast('You need a fishing rod (Bait and Tackle at the harbour)');
  if (game.season === 'winter' && !ocean && mapId === 'park' && !game.flag('hob_icefish_tip')) { game.setFlag('hob_icefish_tip'); game.toast('Ice fishing! A little hole in the frozen pond'); }
  if (!game.useEnergy(3)) return;
  const bait = ['mat_bait_premium', 'mat_bait_shrimp', 'mat_bait_worms'].find((b) => get('item', b) && game.has(b));
  if (bait) game.take(bait, 1);
  const fish = rollFish(game, mapId, ocean, bait), tier = ROD_TIER(game);
  return game.minigame('hob_fishing', { fish: fish.id, tier, calm: game.hasBuff && game.hasBuff('calm'), skill: game.skillLevel('fishing'), bait, ocean, night: hour(game) >= 19 || hour(game) < 5 }).then((r) => {
    game.advance(15);
    const d = r && r.data;
    if (!d || !d.caught) { if (!r.quit) game.addXP('fishing', 1); return; }
    landFish(game, fish, d.size);
  });
}
export function landFish(game, fish, size) {
  const st = HS(game), rec = (st.fish[fish.id] ||= { n: 0, best: 0 }), record = size > rec.best;
  rec.n++; if (record) rec.best = size;
  game.give(fish.item, 1, true);
  game.toast(`Caught a ${get('item', fish.item).name.toLowerCase()}! ${size} cm${record && rec.n > 1 ? ' - new record!' : ''}`, get('item', fish.item).icon);
  game.sfx(fish.rarity >= 4 ? 'levelup' : 'chime');
  game.addXP('fishing', 3 + fish.rarity * 3);
  game.collect('fish', fish.item); game.stat('fishCaught');
  if (fish.legend) game.stat('legendFish');
  if (size > (game.state.stats.biggestFish || 0)) game.state.stats.biggestFish = size;
  game.bus.emit('fishCaught', { item: fish.item, size, record });
}
register('targetProvider', 'hob_fishing', { find: (world, game) => (world.map.def.outdoor !== false ? fishTarget(world, game) : null) });

// =================================================================== BUGS (critters)
const bugEpoch = (game) => game.day * 12 + Math.floor(hour(game) / 2);
let crit = { map: null, epoch: -1, list: [] };
function habitatSpots(world) {
  const m = world.map, S = { grass: [], flower: [], tree: [], water: [], sand: [] };
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const t = m.tiles[ty][tx]; if (!t || t.solid) continue;
    const g = t.ground, [x, y] = tileCentre(tx, ty);
    if (g === 'grass' || g === 'lawn') S.grass.push([x, y]);
    if (g === 'meadow') { S.flower.push([x, y]); S.grass.push([x, y]); }
    if (g === 'sand') S.sand.push([x, y]);
    if ([[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => isWater(tileOf(world, tx + dx, ty + dy)))) S.water.push([x, y + 4]);
  }
  for (const o of m.objects) {
    if (!o.spr || (o.when && !world.game.check(o.when))) continue;
    if (/tree/.test(o.spr)) S.tree.push([(o.x + o.w / 2) * TILE, (o.y + o.h) * TILE - 2]);
    else if (/flower|bush|bed|azalea|hydrangea/.test(o.spr)) S.flower.push([(o.x + o.w / 2) * TILE, (o.y + o.h) * TILE + 6]);
  }
  return S;
}
function spawnCritters(world, game) {
  const map = world.map, epoch = bugEpoch(game);
  crit = { map: map.id, epoch, list: [] };
  if (!map.def.outdoor) return;
  const S = habitatSpots(world), rng = game.rngFor(`bugs:${map.id}:${epoch}`), h = hour(game), gone = HS(game).gone[`${map.id}:${epoch}`] || [];
  const date = dateOf(game.day), L = luck(game);
  const ok = (b) => b.seasons.includes(game.season) && inTimes(b.times, h) && weatherOk(b.weather, game.weather) && (b.id !== 'bug_firefly' || (date >= 8 && date <= 22)) && S[b.habitat].length;
  const pool = all('bug').filter(ok);
  const n = Math.min(pool.length ? 6 : 0, 2 + Math.floor(rng() * 3) + (L > 1 ? 1 : 0) + (map.id === 'park' ? 1 : 0));
  for (let i = 0; i < n; i++) {
    const b = weighted(rng, pool, (x) => 10 / Math.pow(x.rarity, 1.6) * (x.rarity >= 3 ? L : 1));
    const spots = S[b.habitat], [ax, ay] = spots[Math.floor(rng() * spots.length)], key = `${i}`;
    if (gone.includes(key)) continue;
    crit.list.push({ key, bug: b, ax: ax + (rng() - 0.5) * 8, ay, x: ax, y: ay, t: rng() * 9, flee: 0, vx: 0, vy: 0, seed: rng() * 100 });
  }
}
const markGone = (game, c) => { const k = `${crit.map}:${crit.epoch}`, st = HS(game).gone; (st[k] ||= []).push(c.key); for (const kk of Object.keys(st)) if (+kk.split(':')[1] < crit.epoch - 24) delete st[kk]; };
const lift = (c) => (c.bug.kind === 'fly' ? 10 + Math.sin(c.t * 2) * 3 : c.bug.kind === 'dart' ? 12 + Math.sin(c.t * 3) * 2 : c.bug.kind === 'glow' ? 8 + Math.sin(c.t) * 4 : c.bug.kind === 'cling' ? 14 : 0);
register('worldTick', 'hob_bugs', {
  update(dt, world, game) {
    if (!game.state.hobbies) return;
    if (crit.map !== world.map.id || crit.epoch !== bugEpoch(game)) spawnCritters(world, game);
    const p = world.player, wary = game.has('tool_net_2') ? 0.65 : 1;
    for (const c of crit.list) {
      c.t += dt;
      if (c.busy) continue;
      if (c.flee) { c.flee += dt; c.x += c.vx * dt; c.y += c.vy * dt; continue; }
      const k = c.bug.kind, s = c.seed;
      if (k === 'fly' || k === 'glow') { c.x = c.ax + Math.sin(c.t * 0.9 + s) * 14; c.y = c.ay + Math.cos(c.t * 0.7 + s) * 6; }
      else if (k === 'dart') { const ph = Math.floor(c.t / 1.6 + s); c.x += ((hash(ph, 1, 3) - 0.5) * 60 - (c.x - c.ax) * 1.2) * dt; c.y += ((hash(ph, 2, 3) - 0.5) * 30 - (c.y - c.ay) * 1.2) * dt; }
      else if (k === 'hop') { const ph = Math.floor(c.t / 1.3 + s); if (c.t % 1.3 < 0.25) c.x += (hash(ph, 4, 1) - 0.5) * 40 * dt; c.x += (c.ax - c.x) * dt * 0.3; }
      else if (k === 'crawl') { c.x = c.ax + Math.sin(c.t * 0.4 + s) * 6; }
      const d = Math.hypot(c.x - p.x, c.y - (p.y - 4));
      if ((p.moving && p.run && d < 56 * wary) || d < 8 * wary) {
        c.flee = 0.01; const a = Math.atan2(c.y - p.y, c.x - p.x);
        c.vx = Math.cos(a) * 90; c.vy = k === 'crawl' || k === 'hop' ? Math.sin(a) * 40 : -70;
        markGone(game, c);
        if (!game.flag('hob_sneak_tip')) { game.setFlag('hob_sneak_tip'); game.toast('Bugs flee from running feet. Walk slowly to sneak up!'); }
      }
    }
    crit.list = crit.list.filter((c) => !c.flee || c.flee < 1.6);
  },
});
register('worldLayer', 'hob_bugs', {
  sprites(world, game) {
    if (crit.map !== world.map.id) return [];
    return crit.list.map((c) => ({ y: c.y, draw: (g, w) => {
      const f = Math.floor(c.t * (c.bug.kind === 'fly' ? 8 : 4)) % 2, up = lift(c), name = `hob_c_${c.bug.id.slice(4)}_${c.bug.kind === 'glow' ? (Math.floor(c.t * 2) % 3 ? 1 : 0) : f}`;
      if (up > 3) { g.fillStyle = 'rgba(42,26,64,0.22)'; g.fillRect(w.sx(c.x) - 2, w.sy(c.y) - 1, 5, 1); }
      if (c.bug.kind === 'glow') { g.fillStyle = 'rgba(232,255,154,0.25)'; g.fillRect(w.sx(c.x) - 3, w.sy(c.y - up) - 4, 7, 5); }
      w.drawFeet(name, c.x, c.y - up, c.vx < 0 || (c.bug.kind === 'dart' && Math.sin(c.t + c.seed) < 0));
    } }));
  },
});
register('targetProvider', 'hob_bugs', {
  find(world, game) {
    if (crit.map !== world.map.id) return null;
    let best = null, bd = 26;
    for (const c of crit.list) { if (c.flee || c.busy) continue; const d = Math.hypot(c.x - world.player.x, c.y - (world.player.y - 4)); if (d < bd) { bd = d; best = c; } }
    if (!best) return null;
    const known = game.collected('bug', best.bug.item);
    return { label: `Catch ${known ? 'the ' + best.bug.name.toLowerCase() : 'the bug'}`, dist: Math.max(0, bd - 12), x: best.x, y: best.y - lift(best), run: (g) => catchBug(g, best) };
  },
});
function catchBug(game, c) {
  if (!hasTool(game, 'tool_net', 'tool_net_2')) return game.toast('You need a bug net (Bait and Tackle sells them)');
  if (!game.useEnergy(1)) return;
  c.busy = true;
  game.minigame('hob_net', { bug: c.bug.id, tier: game.has('tool_net_2') ? 2 : 1 }).then((r) => {
    c.busy = false; markGone(game, c); c.flee = 0.01; c.vy = -60; c.vx = 40;
    game.advance(5);
    if (!(r && r.data && r.data.caught)) return;
    const b = c.bug, item = get('item', b.item), first = !game.collected('bug', b.item);
    game.collect('bug', b.item); game.stat('bugsCaught'); (HS(game).bugs[b.id] ||= { n: 0, released: 0 }).n++;
    game.sfx('chime');
    const keep = () => { game.give(b.item, 1); game.bus.emit('bugCaught', { item: b.item, kept: true }); };
    const release = () => { HS(game).bugs[b.id].released++; game.stat('bugsReleased'); game.addMood(3); sparkle(game.world, game.world.player.x, game.world.player.y - 20, 8, '#e8ff9a'); game.bus.emit('bugCaught', { item: b.item, kept: false }); };
    game.run([{ t: 'say', who: 'misa', mood: 'happy', text: `${first ? 'A new one! ' : ''}I caught a ${item.name.toLowerCase()}! ${item.desc}` },
      { t: 'choice', prompt: 'Keep it?', options: [{ text: 'Keep it in a jar', steps: [{ t: 'call', fn: keep }] }, { text: 'Let it fly free', steps: [{ t: 'call', fn: release }, { t: 'say', who: 'misa', mood: 'happy', text: 'Off you go. Thanks for saying hi.' }] }] }]);
  });
}

// =================================================================== BEACHCOMBING, DIG SPOTS, CAVE ROCKS
const DIG_MAPS = ['park', 'shrine', 'beach', 'cave', 'school_grounds', 'lighthouse'];
function rollFinds(game) {
  const st = HS(game), day = game.day, list = [], storm = game.weather === 'storm' || game.state.hobbies.lastStorm === day - 1;
  for (const mapId of ['beach', 'cave', ...DIG_MAPS]) {
    if (!get('map', mapId)) continue;
    let m; try { m = buildMap(mapId); } catch { continue; }
    const rng = game.rngFor('finds:' + mapId), free = [];
    const plots = plotRects(m);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const t = m.tiles[y][x]; if (!t || t.solid || plots.some(([a, b, w, h]) => x >= a && y >= b && x < a + w && y < b + h)) continue;
      const nearW = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => { const n = m.tiles[y + dy] && m.tiles[y + dy][x + dx]; return isWater(n); });
      free.push({ x, y, sand: t.ground === 'sand', nearW, soft: ['grass', 'meadow', 'dirt', 'sand', 'lawn', 'gravel'].includes(t.ground) || !!t.floor });
    }
    const solidAt = new Set(); for (const o of m.objects) if (o.solid !== false && !o.flat) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) solidAt.add(`${xx},${yy}`);
    const open = free.filter((f) => !solidAt.has(`${f.x},${f.y}`));
    const take = (cands, n, kind) => { for (let i = 0; i < n && cands.length; i++) { const f = cands.splice(Math.floor(rng() * cands.length), 1)[0]; list.push({ map: mapId, x: f.x, y: f.y, kind }); } };
    if (mapId === 'beach') take(open.filter((f) => f.sand), 6 + (storm ? 4 : 0), 'shell');
    if (mapId === 'cave') take(open.filter((f) => f.nearW), 3, 'pool');
    if (DIG_MAPS.includes(mapId) && mapId !== 'beach' || mapId === 'beach') take(open.filter((f) => f.soft && !f.nearW), mapId === 'cave' ? 3 : 2, 'dig');
  }
  st.finds = { day, list };
}
const findsHere = (game, mapId) => { const st = HS(game); if (st.finds.day !== game.day) rollFinds(game); return st.finds.list.filter((f) => f.map === mapId && !f.taken); };
function rollCollectible(game, kind, where) {
  const L = luck(game), storm = game.weather === 'storm' || HS(game).lastStorm === game.day - 1;
  const pool = all('collectible').filter((c) => c.kind === kind && c.where.some((w) => where.includes(w)) && (!c.storm || storm || c.rarity < 5));
  return weighted(game.rng, pool, (c) => 10 / Math.pow(c.rarity, 1.5) * (c.rarity >= 3 ? L * (storm && c.storm ? 3 : 1) : 1));
}
function pickUp(game, f) {
  const c = rollCollectible(game, 'shell', f.kind === 'pool' ? ['cave'] : ['beach']);
  if (!c) return;
  f.taken = true;
  game.give(c.item, 1); game.collect('shell', c.item); game.stat('shellsFound'); game.sfx('pop'); game.bus.emit('shellFound', { item: c.item });
  sparkle(game.world, f.x * TILE + 8, f.y * TILE + 8, 6);
}
function dig(game, f) {
  if (!hasTool(game, 'tool_trowel', 'tool_hoe', 'tool_hoe_2')) return game.toast('You need a trowel to dig here');
  if (!game.useEnergy(3)) return;
  f.taken = true; game.advance(10); game.sfx('dig');
  const where = f.map === 'cave' ? ['dig', 'cave'] : ['dig'], c = game.rng() < 0.82 ? rollCollectible(game, 'mineral', where) : null;
  sparkle(game.world, f.x * TILE + 8, f.y * TILE + 10, 8, D[3]);
  if (!c) { game.toast('Just dirt and a very surprised worm'); if (get('item', 'mat_bait_worms')) game.give('mat_bait_worms', 1); return; }
  game.give(c.item, 1); game.collect('mineral', c.item); game.stat('mineralsFound'); game.bus.emit('mineralFound', { item: c.item });
  game.addXP('crafting', 1);
}
function tapRock(game, o) {
  const st = HS(game), k = `${game.world.map.id}:${o.x},${o.y}`;
  st.rocks[k] = game.day; game.sfx('dig');
  if (game.rng() < 0.55) { const c = rollCollectible(game, 'mineral', ['rock']); if (c) { game.give(c.item, 1); game.collect('mineral', c.item); game.stat('mineralsFound'); game.bus.emit('mineralFound', { item: c.item }); return; } }
  game.toast('A few pebbles rattle loose. Nothing shiny today');
}
register('worldLayer', 'hob_finds', {
  below(g, world, game) {
    if (!game.state.hobbies) return;
    for (const f of findsHere(game, world.map.id)) {
      const x = f.x * TILE + 8, y = f.y * TILE + 11, tw = Math.floor(game.clock * 3 + f.x * 3 + f.y) % 6;
      if (f.kind === 'dig') world.drawFeet('hob_dig', x, y + 2);
      else { g.fillStyle = Rr.paper[3]; g.fillRect(world.sx(x) - 3, world.sy(y) - 2, 5, 3); g.fillStyle = Rr.coral[3]; g.fillRect(world.sx(x) - 2, world.sy(y) - 3, 3, 1); g.fillStyle = Rr.sand[1]; g.fillRect(world.sx(x) - 3, world.sy(y) + 1, 6, 1); }
      if (tw < 2) { const sx = world.sx(x) + 4, sy = world.sy(y) - 8; g.fillStyle = '#fffaf0'; g.fillRect(sx - tw - 1, sy, tw * 2 + 3, 1); g.fillRect(sx, sy - tw - 1, 1, tw * 2 + 3); }
    }
  },
});
register('targetProvider', 'hob_finds', {
  find(world, game) {
    if (!game.state.hobbies) return null;
    let best = null, bd = 18;
    for (const f of findsHere(game, world.map.id)) { const d = Math.hypot(f.x * TILE + 8 - world.player.x, f.y * TILE + 10 - world.player.y); if (d < bd) { bd = d; best = f; } }
    if (best) return { label: best.kind === 'dig' ? 'Dig here' : 'Pick up', dist: bd - 6, x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => (best.kind === 'dig' ? dig(g, best) : pickUp(g, best)) };
    if (world.map.id === 'cave' || world.map.id === 'shrine') for (const o of world.map.objects) {
      if (!o.spr || !/rock|boulder|stone_big/.test(o.spr) || o.interact) continue;
      const d = Math.hypot((o.x + o.w / 2) * TILE - world.player.x, (o.y + o.h) * TILE - world.player.y);
      if (d < 22 && HS(game).rocks[`${world.map.id}:${o.x},${o.y}`] !== game.day) return { label: 'Tap the rock', dist: d - 4, run: (g) => tapRock(g, o) };
    }
    return null;
  },
});

export function worldSystem(game) {
  game.bus.on('dayStart', () => { dailyGarden(game); if (game.weather === 'storm') HS(game).lastStorm = game.day; rollFinds(game); });
  game.bus.on('mapEnter', ({ map }) => { if (plotRects(get('map', map) ? { def: get('map', map) } : null).length && hasTool(game, 'tool_can', 'tool_can_2') && HS(game).can < canMax(game)) { HS(game).can = canMax(game); game.toast('Filled the watering can at the garden tap', 'i_rain'); } });
  game.bus.on('newGame', () => { HS(game).can = 20; for (const id of ['seed_turnip', 'seed_strawberry']) game.give(id, id === 'seed_turnip' ? 6 : 2, true); });
  game.gardenInfo = (mapId = 'yard') => Object.values(HS(game).plots[mapId] || {}).filter((p) => p.crop);
}

features('Gardening', [
  'Garden plots in the yard: till with the hoe, plant seeds, water with the can and harvest, all by facing a plot and pressing E',
  '32 crops (8 per season, including 8 flowers), each drawn in 4 growth stages plus a planted-seed mound',
  'Regrowing crops (strawberries, tomatoes, cucumbers, corn, eggplant, peppers, edamame, snow peas, yuzu) keep producing',
  'Crops grow one day for every day they were watered; tilled soil looks darker while wet',
  'Thirsty crops wilt after 2 dry days instead of dying, and watering revives them',
  'Rain and snow water every outdoor plot for you',
  'Out-of-season crops wither at the season change, with a warning on day 25',
  'Seeds are chosen from the bag (Use: plant these next) or from a seed picker; only in-season seeds can be planted',
  'Watering can meter on the HUD; it refills at the garden tap and at any water\'s edge',
  'Copper watering can waters three plots in a row; steel hoe tills with less energy',
  'Fertiliser is worked in when planting and gives the crop a head start',
  'Ripe crops sparkle, and gardening skill gives a chance of a double harvest',
  'Giant crops: a ripe pumpkin or tomato can swell into a giant overnight',
  'Untended empty tilled soil grows back over after a few days',
  'Any map with garden plots works the same way (ready for the school garden)',
  'Gardening XP from tilling, planting, watering and harvesting',
  'A starter packet of turnip and strawberry seeds from Grandma on day one',
]);
features('Fishing', [
  'Fish from any pond, river or sea tile you face: 30 species with map, season, time of day and weather rules',
  'Four legendary fish: Sakura koi, Storm marlin, Moon bream and Ice lantern fish, each with special conditions',
  'Bait from the tackle shop is used automatically: worms for common fish, shrimp for mid-size, premium bait for rare ones',
  'Rod upgrades: fibreglass and carbon rods widen the catch bar',
  'Ice fishing through a hole in the frozen park pond in winter',
  'Every catch is measured in cm, with a personal best per species',
  'Fishing XP that grows with the rarity of the catch',
]);
features('Bugs, shells & collections', [
  '30 bugs that appear as living critters on grass, flowers, trees, water edges and sand by map, season, time and weather',
  'Bugs flutter, dart, hop and crawl in the world, and flee if Misa runs near them; walk slowly to sneak up',
  'Fireflies glow by the water only on summer nights in the middle of the season',
  'After a catch, keep the bug in a jar or let it fly free for a little cozy boost',
  'The silk bug net lets you get closer before bugs notice',
  'Beachcombing: shells and beach finds wash up on the beach sand every day, with extra treasures after storms',
  '20 shells and beach finds, including sea glass, a bottle with a note, a pearl and a nautilus',
  'Cave tide pools hold starfish, urchins, abalone and turban shells',
  'Dig spots appear daily in the park, the shrine forest, the beach and the cave; dig them up with the trowel',
  '12 minerals and fossils from dig spots and cave rocks, including amber, a trilobite and a meteorite',
  'Tap cave rocks once a day for a chance at a crystal',
]);
