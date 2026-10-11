// Content validator: cross-checks every reference between registered content. Returns a list of error strings.
// Runs in the Node tests and on dev boot in the browser (errors show in the console).
import { R, FEATURES } from './registry.js';
import { condRefs, compileCond } from './cond.js';
import { SPRITES } from '../art.js';
import { buildMap, passGrid, footprint, TILE, tileSolid, warpTarget } from '../world/map.js';

const has = (kind, id) => !!(R[kind] && R[kind][id]);

export function checkCond(c, where, errs) {
  if (!c || typeof c === 'function') return;
  try { compileCond(c); } catch (e) { errs.push(`${where}: ${e.message}`); return; }
  for (const [kind, id] of condRefs(c)) {
    const ids = String(id).split('|');
    const need = { item: 'item', friend: 'npc', hearts: 'npc', met: 'npc', quest: 'quest', stage: 'quest', map: 'map', skill: 'skill' }[kind];
    if (need) for (const x of ids) if (!has(need, x)) errs.push(`${where}: condition refers to unknown ${need} "${x}"`);
  }
}

// Flood fill of walkable tiles from a start tile.
function reach(grid, sx, sy) {
  const h = grid.length, w = grid[0].length, seen = new Uint8Array(w * h), q = [[sx, sy]];
  if (!grid[sy] || !grid[sy][sx]) return seen;
  seen[sy * w + sx] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny * w + nx] || !grid[ny][nx]) continue;
      seen[ny * w + nx] = 1; q.push([nx, ny]);
    }
  }
  return seen;
}
const nearReach = (seen, w, h, rect) => {
  const [px, py, pw, ph] = rect, x0 = Math.floor(px / TILE) - 1, y0 = Math.floor(py / TILE) - 1, x1 = Math.ceil((px + pw) / TILE), y1 = Math.ceil((py + ph) / TILE);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < w && y < h && seen[y * w + x]) return true;
  return false;
};

export function validateMaps(errs, game) {
  const fakeGame = game || { check: () => true };
  for (const def of Object.values(R.map)) {
    const id = def.id;
    let m;
    try { m = buildMap(id); } catch (e) { errs.push(`map ${id}: ${e.message}`); continue; }
    const widths = new Set(def.rows.map((r) => r.length));
    if (widths.size > 1) errs.push(`map ${id}: rows have different widths (${[...widths].join(', ')})`);
    if (m.w > 72 || m.h > 56) errs.push(`map ${id}: ${m.w}x${m.h} is too big (max 72x56 tiles)`);
    for (const o of m.objects) {
      const sprs = [o.spr].filter(Boolean);
      for (const s of sprs) if (!SPRITES[s]) errs.push(`map ${id}: object uses unknown sprite "${s}"`);
      if (o.x < 0 || o.y < 0 || o.x + o.w > m.w || o.y + o.h > m.h) errs.push(`map ${id}: object ${o.spr} at ${o.x},${o.y} is out of bounds`);
      checkCond(o.when, `map ${id} object ${o.spr}.when`, errs);
    }
    const spawns = def.spawns || {};
    if (!spawns.default) errs.push(`map ${id}: needs spawns.default`);
    for (const w of m.warps) {
      try { const t = warpTarget(w); if (!R.map[t.map]) errs.push(`map ${id}: warp to unknown map "${t.map}"`); }
      catch (e) { errs.push(`map ${id}: ${e.message}`); }
      checkCond(w.when, `map ${id} warp.when`, errs); checkCond(w.locked, `map ${id} warp.locked`, errs);
    }
    // reachability from the default spawn (all conditional props treated as present)
    let grid;
    try { grid = passGrid(m, null, m.objects); } catch (e) { errs.push(`map ${id}: ${e.message}`); continue; }
    if (!spawns.default) continue;
    const [sx, sy] = spawns.default;
    if (tileSolid(m, sx, sy) || !grid[sy][sx]) { errs.push(`map ${id}: default spawn ${sx},${sy} is blocked`); continue; }
    const seen = reach(grid, sx, sy);
    for (const [name, v] of Object.entries(spawns)) {
      if (!Array.isArray(v)) continue;
      if (!(grid[v[1]] && grid[v[1]][v[0]]) && name !== 'cushion') errs.push(`map ${id}: spawn "${name}" ${v[0]},${v[1]} is blocked`);
      else if (!seen[v[1] * m.w + v[0]] && name !== 'cushion') errs.push(`map ${id}: spawn "${name}" can't be reached from the default spawn`);
    }
    for (const [name, v] of Object.entries(def.spots || {})) if (!nearReach(seen, m.w, m.h, [v[0] * TILE, v[1] * TILE, TILE, TILE])) errs.push(`map ${id}: spot "${name}" can't be reached`);
    for (const w of m.warps) if (!nearReach(seen, m.w, m.h, [w.x * TILE, w.y * TILE, (w.w || 1) * TILE, (w.h || 1) * TILE])) errs.push(`map ${id}: warp at ${w.x},${w.y} can't be reached`);
    for (const o of m.objects) if (o.interact && !nearReach(seen, m.w, m.h, footprint(o))) errs.push(`map ${id}: interactive object ${o.spr} at ${o.x},${o.y} can't be reached`);
  }
  // every map reachable from home through warps
  if (R.map.home) {
    const seenMaps = new Set(['home']), q = ['home'];
    while (q.length) { const id = q.pop(); for (const w of R.map[id].warps || []) { let t; try { t = warpTarget(w).map; } catch { continue; } if (R.map[t] && !seenMaps.has(t)) { seenMaps.add(t); q.push(t); } } }
    for (const id of Object.keys(R.map)) if (!seenMaps.has(id) && !R.map[id].noWarp) errs.push(`map ${id}: can't be reached from home through warps`);
  }
}

export function validateContent(errs) {
  for (const it of Object.values(R.item)) {
    if (!it.name) errs.push(`item ${it.id}: missing name`);
    if (it.icon && !SPRITES[it.icon]) errs.push(`item ${it.id}: unknown icon sprite "${it.icon}"`);
  }
  for (const n of Object.values(R.npc)) {
    for (const k of ['love', 'like', 'dislike', 'hate']) for (const it of (n.gifts || {})[k] || []) if (!has('item', it)) errs.push(`npc ${n.id}: gift ${k} "${it}" is not an item`);
    for (const [gi, grp] of (n.schedule || []).entries()) {
      checkCond(grp.when, `npc ${n.id} schedule[${gi}].when`, errs);
      for (const st of grp.stops || []) {
        if (!st.map) continue;
        const m = R.map[st.map];
        if (!m) { errs.push(`npc ${n.id}: schedule stop on unknown map "${st.map}"`); continue; }
        if (!st.pos && !((m.spots || {})[st.spot] || (m.spawns || {})[st.spot])) errs.push(`npc ${n.id}: unknown spot "${st.spot}" on map ${st.map}`);
      }
    }
    for (const e of n.events || []) { checkCond(e.when, `npc ${n.id} event ${e.id}`, errs); if (e.map && !has('map', e.map)) errs.push(`npc ${n.id} event ${e.id}: unknown map ${e.map}`); }
    if (n.birthday && !['spring', 'summer', 'autumn', 'winter'].includes(n.birthday.season)) errs.push(`npc ${n.id}: bad birthday season`);
  }
  for (const s of Object.values(R.shop || {})) for (const e of s.stock || []) { const iid = typeof e === 'string' ? e : e.item; if (!has('item', iid)) errs.push(`shop ${s.id}: stocks unknown item "${iid}"`); checkCond(e.when, `shop ${s.id} stock ${iid}`, errs); }
  for (const r of Object.values(R.recipe || {})) {
    for (const i of Object.keys(r.ingredients || {})) if (!has('item', i) && !String(i).startsWith('tag:')) errs.push(`recipe ${r.id}: unknown ingredient "${i}"`);
    if (r.out && !has('item', r.out)) errs.push(`recipe ${r.id}: unknown output "${r.out}"`);
  }
  for (const q of Object.values(R.quest || {})) {
    if (q.giver && !has('npc', q.giver)) errs.push(`quest ${q.id}: unknown giver "${q.giver}"`);
    if (q.next && !has('quest', q.next)) errs.push(`quest ${q.id}: unknown next quest "${q.next}"`);
    for (const it of Object.keys((q.reward || {}).items || {})) if (!has('item', it)) errs.push(`quest ${q.id}: reward item "${it}" unknown`);
  }
  for (const h of Object.values(R.talkHook || {})) { if (!has('npc', h.npc)) errs.push(`talkHook ${h.id}: unknown npc "${h.npc}"`); checkCond(h.when, `talkHook ${h.id}`, errs); }
  for (const a of Object.values(R.achievement || {})) { checkCond(a.cond, `achievement ${a.id}`, errs); if (a.icon && !SPRITES[a.icon]) errs.push(`achievement ${a.id}: unknown icon`); }
  for (const app of Object.values(R.phoneApp || {})) if (app.icon && !SPRITES[app.icon]) errs.push(`phoneApp ${app.id}: unknown icon "${app.icon}"`);
  for (const f of Object.values(R.fish || {})) { if (!has('item', f.item || f.id)) errs.push(`fish ${f.id}: no matching item`); for (const m of f.maps || []) if (!has('map', m)) errs.push(`fish ${f.id}: unknown map ${m}`); }
  for (const c of Object.values(R.crop || {})) { for (const k of ['seed', 'item']) if (c[k] && !has('item', c[k])) errs.push(`crop ${c.id}: unknown ${k} "${c[k]}"`); }
  const seenText = new Set();
  for (const f of FEATURES) { if (seenText.has(f.text)) errs.push(`feature listed twice: "${f.text}"`); seenText.add(f.text); }
}

export function validateAll(game) {
  const errs = [];
  validateMaps(errs, game);
  validateContent(errs);
  return errs;
}
