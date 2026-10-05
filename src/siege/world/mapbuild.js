// Compiles a map definition (data/harbor.js) into a World full of panels, doors, props and
// objective sites. Nothing here touches WebGL: it is pure data, so it also runs in Node tests.
import { World, Panel, Door, MATS, STOREY } from './grid.js';
import { placeProp } from './props.js';

export function buildMap(def) {
  const { W, D, bx, bz, floors, bw, bd } = def;
  const w = new World(W, D, floors);
  const out = { world: w, def, doors: [], windows: [], statics: [], lights: [], sites: [], spawns: [], anchors: [], roomCells: [], entrances: [], rails: [] };
  const letterAt = (f, x, z) => (x < 0 || z < 0 || x >= bw || z >= bd ? null : def.plan[f][bd - 1 - z][x]);
  const room = (f, L) => def.rooms[f][L];

  // ---- room index grids (for HUD names and AI zones)
  for (let f = 0; f < floors; f++) {
    w.rooms[f] = new Uint8Array(W * D); out.roomCells[f] = {};
    const idx = {};
    for (const L of Object.keys(def.rooms[f])) { idx[L] = w.roomNames.length + 1; w.roomNames.push(def.rooms[f][L][0]); out.roomCells[f][L] = []; }
    for (let z = 0; z < bd; z++) for (let x = 0; x < bw; x++) {
      const L = letterAt(f, x, z); w.rooms[f][(bz + z) * W + bx + x] = idx[L]; out.roomCells[f][L].push([bx + x, bz + z]);
    }
  }

  // ---- walls where two room letters meet (or room meets outdoors)
  function wallSpec(f, A, B) {
    const pa = A && room(f, A)[1], pb = B && room(f, B)[1];
    if (!A || !B) {
      const p = pa || pb;
      return { mat: 'brick', sa: A ? `paint:${p === 'brick' ? 'brick' : p}` : 'paint:brickExt', sb: B ? `paint:${p === 'brick' ? 'brick' : p}` : 'paint:brickExt' };
    }
    if (pa === 'brick' || pb === 'brick') return { mat: 'brick', sa: 'paint:brick', sb: 'paint:brick' };
    return { mat: pa === 'tan' || pb === 'tan' ? 'wood' : 'plaster', sa: `paint:${pa}`, sb: `paint:${pb}` };
  }
  for (let f = 0; f < floors; f++) {
    const base = f * STOREY;
    for (let z = 0; z < bd; z++) for (let x = -1; x < bw; x++) { // faces between (x,z) and (x+1,z)
      const A = letterAt(f, x, z), B = letterAt(f, x + 1, z);
      if (A === B) continue;
      const s = wallSpec(f, A, B);
      for (let r = 0; r < 3; r++) w.put('x', bx + x + 1, base + r, bz + z, new Panel({ kind: 'wall', ...s, pair: `${f}${A}|${B}`, f, ext: !A || !B }));
    }
    for (let z = -1; z < bd; z++) for (let x = 0; x < bw; x++) { // faces between (x,z) and (x,z+1)
      const A = letterAt(f, x, z), B = letterAt(f, x, z + 1);
      if (A === B) continue;
      const s = wallSpec(f, A, B);
      for (let r = 0; r < 3; r++) w.put('z', bx + x, base + r, bz + z + 1, new Panel({ kind: 'wall', ...s, pair: `${f}${A}|${B}`, f, ext: !A || !B }));
    }
  }

  // ---- floors, roof, ground
  const holes = new Set(), key = (x, z) => x + ',' + z;
  const stairHoleCells = [];
  for (const st of def.stairs) if (st.hole) for (let a = 0; a < st.w; a++) for (let b = 0; b < st.run; b++) { const x = st.x + a, z = st.z + b; holes.add(`${st.f + 1}:${key(x, z)}`); stairHoleCells.push([st.f + 1, x, z]); }
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const rx = x - bx, rz = z - bz, inside = rx >= 0 && rz >= 0 && rx < bw && rz < bd;
    const L = inside ? letterAt(0, rx, rz) : null;
    w.put('y', x, 0, z, new Panel({ kind: 'floor', mat: 'floor', dest: false, ground: !inside, finish: L ? 'floor:' + room(0, L)[2] : 'floor:ground', hp: Infinity }));
  }
  for (let f = 1; f < floors; f++) for (let z = 0; z < bd; z++) for (let x = 0; x < bw; x++) {
    if (holes.has(`${f}:${key(x, z)}`)) continue;
    const L = letterAt(f, x, z);
    w.put('y', bx + x, f * STOREY, bz + z, new Panel({ kind: 'floor', mat: 'floor', dest: false, finish: 'floor:' + room(f, L)[2], hp: Infinity }));
  }
  const roofY = floors * STOREY;
  for (let z = 0; z < bd; z++) for (let x = 0; x < bw; x++) w.put('y', bx + x, roofY, bz + z, new Panel({ kind: 'floor', mat: 'roof', dest: false, roof: true, finish: 'roof', hp: Infinity }));
  // parapet round the roof (a gap where the outside stairs arrive)
  const gap = (side, i) => side === 'E' && i >= 12 && i <= 13;
  for (let i = 0; i < bd; i++) for (const side of ['E', 'W']) {
    if (gap(side, i)) continue;
    w.put('x', bx + (side === 'E' ? bw : 0), roofY, bz + i, new Panel({ kind: 'wall', mat: 'concrete', sa: 'wall:concrete', sb: 'wall:concrete', dest: false, nr: true, hp: Infinity, ext: true }));
  }
  for (let i = 0; i < bw; i++) for (const side of ['N', 'S']) w.put('z', bx + i, roofY, bz + (side === 'N' ? bd : 0), new Panel({ kind: 'wall', mat: 'concrete', sa: 'wall:concrete', sb: 'wall:concrete', dest: false, nr: true, hp: Infinity, ext: true }));
  // landing platform at the top of the outside stairs
  for (const st of def.stairs) if (st.ext) for (let a = 0; a < st.w; a++) for (let b = 0; b < 2; b++) w.put('y', bx + st.x + a, roofY, bz + st.z + st.run + b, new Panel({ kind: 'floor', mat: 'roof', dest: false, roof: true, finish: 'floor:metal', hp: Infinity }));
  // compound wall round the yard
  const perim = () => new Panel({ kind: 'wall', mat: 'concrete', sa: 'paint:cream', sb: 'paint:cream', dest: false, nr: true, hp: Infinity, ext: true, perimeter: true });
  for (let r = 0; r < 3; r++) {
    for (let z = 0; z < D; z++) { w.put('x', 0, r, z, perim()); w.put('x', W, r, z, perim()); }
    for (let x = 0; x < W; x++) { w.put('z', x, r, 0, perim()); w.put('z', x, r, D, perim()); }
  }

  // ---- openings: doors, arches, windows, shutters
  const faceOf = (x, z, side) => side === 'E' ? ['x', bx + x + 1, bz + z] : side === 'W' ? ['x', bx + x, bz + z] : side === 'N' ? ['z', bx + x, bz + z + 1] : ['z', bx + x, bz + z];
  for (const [fl, x, z, side, kind, n = 1] of def.openings) {
    const f = fl - 1, base = f * STOREY;
    for (let k = 0; k < n; k++) {
      const cx = x + (side === 'N' || side === 'S' ? k : 0), cz = z + (side === 'E' || side === 'W' ? k : 0);
      const [ax, ix, iz] = faceOf(cx, cz, side);
      const ps = [0, 1, 2].map((r) => w.get(ax, ix, base + r, iz));
      if (ps.some((p) => !p)) { console.warn('opening without a wall:', fl, x, z, side, kind); continue; }
      const proto = ps[0], ext = proto.ext;
      if (kind === 'door') {
        const d = new Door({ ax, ix, iz, f, kind: 'door', ext, lat: ax === 'x' ? iz : ix, line: ax === 'x' ? ix : iz });
        const mk = (r) => new Panel({ kind: 'door', mat: 'wood', hp: 70, door: d, sa: proto.sa, sb: proto.sb, pair: proto.pair, f, ext });
        const a = w.put(ax, ix, base, iz, mk(0)), b = w.put(ax, ix, base + 1, iz, mk(1));
        d.panels = [a, b]; out.doors.push(d); w.doors.push(d);
        if (ext) out.entrances.push({ type: 'door', door: d, f, x: ix, z: iz, ax });
      } else if (kind === 'open') { w.remove(ps[0]); w.remove(ps[1]); }
      else if (kind === 'arch') { for (const p of ps) w.remove(p); }
      else if (kind === 'win') {
        w.remove(ps[1]);
        const g = w.put(ax, ix, base + 1, iz, new Panel({ kind: 'glass', mat: 'glass', hp: 8, sa: proto.sa, sb: proto.sb, pair: proto.pair, f, ext, nr: true }));
        out.windows.push(g);
        if (ext) out.entrances.push({ type: 'window', panel: g, f, x: ix, z: iz, ax });
      } else if (kind === 'shut') {
        for (const p of ps) { p.mat = 'metal'; p.sa = p.sb = 'wall:metal'; p.hp = p.max = MATS.metal.hp; p.shutter = true; }
        out.entrances.push({ type: 'shutter', panel: ps[0], f, x: ix, z: iz, ax });
      }
    }
  }
  // hatches between storeys and skylights in the roof
  for (const [fl, x, z] of def.hatches) { const p = w.getY(bx + x, (fl - 1) * STOREY, bz + z); if (p) Object.assign(p, { hatch: true, mat: 'hatchwood', dest: true, hp: MATS.hatchwood.hp, max: MATS.hatchwood.hp, finish: 'hatchwood' }); else console.warn('hatch without floor', fl, x, z); }
  for (const [x, z] of def.skylights) { const p = w.getY(bx + x, roofY, bz + z); if (p) Object.assign(p, { hatch: true, mat: 'hatchwood', dest: true, hp: MATS.hatchwood.hp, max: MATS.hatchwood.hp, finish: 'skylight', roof: false }); }

  // ---- reinforceable wall units: runs of up to 4 full-height wall panels between the same two rooms
  for (const ax of ['x', 'z']) {
    const lines = ax === 'x' ? W + 1 : D + 1, lat = ax === 'x' ? D : W;
    for (let f = 0; f < floors; f++) for (let line = 0; line < lines; line++) {
      let run = [], pair = null;
      const flush = () => {
        if (run.length) {
          const id = w.unitSeq++, ps = [];
          for (const l of run) for (let r = 0; r < 3; r++) ps.push(ax === 'x' ? w.getX(line, f * STOREY + r, l) : w.getZ(l, f * STOREY + r, line));
          ps.forEach((p) => { p.unit = id; }); w.units.set(id, ps);
        }
        run = []; pair = null;
      };
      for (let l = 0; l < lat; l++) {
        const ps = [0, 1, 2].map((r) => (ax === 'x' ? w.getX(line, f * STOREY + r, l) : w.getZ(l, f * STOREY + r, line)));
        const ok = ps.every((p) => p && p.kind === 'wall' && !p.nr && p.dest);
        if (!ok || (pair && ps[0].pair !== pair) || run.length >= 4) flush();
        if (ok) { run.push(l); pair = ps[0].pair; }
      }
      flush();
    }
  }

  // ---- stairs
  for (const st of def.stairs) {
    const rise = st.rise ?? STOREY, steps = st.run * 3, sh = rise / steps, y0 = st.f * STOREY;
    for (let i = 0; i < steps; i++) {
      const z0 = bz + st.z + i / 3, x0 = bx + st.x, top = y0 + sh * (i + 1);
      const c = { min: [x0, y0, z0], max: [x0 + st.w, top, z0 + 1 / 3 + 0.001] };
      w.addProp({ ...c, kind: 'step', absorb: 3, cover: 'low', stair: true });
      out.statics.push({ t: 'box', c: [x0 + st.w / 2, (y0 + top) / 2, z0 + 1 / 6], s: [st.w, top - y0, 1 / 3], m: 'stairs', stair: true });
    }
    // railings
    const rail = (x0, z0, x1, z1, y) => {
      const o = { min: [Math.min(x0, x1) - 0.04, y, Math.min(z0, z1) - 0.04], max: [Math.max(x0, x1) + 0.04, y + 1.0, Math.max(z0, z1) + 0.04] };
      w.addProp({ ...o, kind: 'rail', noStand: true, absorb: 0.2, cover: 'low' });
      out.statics.push({ t: 'box', c: [(o.min[0] + o.max[0]) / 2, y + 0.9, (o.min[2] + o.max[2]) / 2], s: [o.max[0] - o.min[0], 0.06, o.max[2] - o.min[2]], m: 'rail' }, { t: 'box', c: [(o.min[0] + o.max[0]) / 2, y + 0.45, (o.min[2] + o.max[2]) / 2], s: [(o.max[0] - o.min[0]) * 0.4 + 0.02, 0.9, (o.max[2] - o.min[2]) * 0.4 + 0.02], m: 'metalDark', thin: true });
    };
    if (st.hole) {
      const yf = (st.f + 1) * STOREY, west = st.x < bw / 2, x0 = bx + st.x, z0 = bz + st.z;
      rail(west ? x0 : x0 + st.w, z0, west ? x0 : x0 + st.w, z0 + st.run, yf);
      rail(x0, z0, x0 + st.w, z0, yf);
    } else if (st.ext) {
      const x0 = bx + st.x, z0 = bz + st.z;
      rail(x0 + st.w, z0, x0 + st.w, z0 + st.run + 2, 0); // outer side follows the stairs and the landing (rises with them: approximated by a flat guard at the top)
      for (let i = 0; i < st.run * 3; i++) { /* guard rail posts follow the steps */ }
      rail(x0 + st.w, z0 + st.run, x0 + st.w, z0 + st.run + 2, roofY);
      rail(x0, z0 + st.run + 2, x0 + st.w, z0 + st.run + 2, roofY);
    }
  }

  // ---- props
  const put = (list) => {
    for (const [kind, f, x, z, rot = 0, opts = {}] of list) {
      const pl = placeProp(kind, bx + x, f * STOREY, bz + z, rot, opts);
      for (const v of pl.visuals) out.statics.push(v);
      for (const c of pl.colliders) w.addProp({ ...c, kind: c.kind });
      if (pl.light) out.lights.push({ pos: pl.light, color: '#ffe2a8', intensity: 5, range: 11, outdoor: true });
    }
  };
  put(def.props); put(def.yard);

  // ---- ceiling lights per room
  const rb = {};
  for (let f = 0; f < floors; f++) for (let z = 0; z < bd; z++) for (let x = 0; x < bw; x++) {
    const L = letterAt(f, x, z), k = f + L, e = rb[k] || (rb[k] = { f, L, x0: x, x1: x, z0: z, z1: z, n: 0 });
    e.x0 = Math.min(e.x0, x); e.x1 = Math.max(e.x1, x); e.z0 = Math.min(e.z0, z); e.z1 = Math.max(e.z1, z); e.n++;
  }
  for (const e of Object.values(rb)) {
    const cnt = Math.max(1, Math.round(e.n / 34)), wx = e.x1 - e.x0 + 1, wz = e.z1 - e.z0 + 1, alongX = wx >= wz, color = room(e.f, e.L)[3];
    for (let i = 0; i < cnt; i++) {
      const t = (i + 0.5) / cnt, px = bx + (alongX ? e.x0 + wx * t : e.x0 + wx / 2), pz = bz + (alongX ? e.z0 + wz / 2 : e.z0 + wz * t), py = e.f * STOREY;
      out.lights.push({ pos: [px, py + 2.45, pz], color, intensity: 7, range: 9, f: e.f, room: e.L });
      out.statics.push({ t: 'box', c: [px, py + 2.77, pz], s: alongX ? [1.1, 0.05, 0.4] : [0.4, 0.05, 1.1], m: 'lamp' });
    }
  }

  // ---- objective sites, spawns, rappel anchors
  for (const s of def.sites) {
    const y = s.f * STOREY;
    out.sites.push({ id: s.id, name: s.name, f: s.f, hint: s.hint, rooms: s.rooms, a: [bx + s.a[0], y, bz + s.a[1]], b: [bx + s.b[0], y, bz + s.b[1]], center: [bx + s.area[0], y, bz + s.area[1]] });
  }
  out.spawns = def.spawns.map((s) => ({ ...s, cx: (s.x0 + s.x1) / 2, cz: (s.z0 + s.z1) / 2 }));
  for (const [x, z, side] of def.anchors) {
    const o = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] }[side];
    out.anchors.push({ pos: [bx + x + 0.5, roofY, bz + z + 0.5], out: o, side, x: bx + x, z: bz + z });
  }
  out.roofY = roofY;
  out.bounds = { x0: 0.4, z0: 0.4, x1: W - 0.4, z1: D - 0.4 };
  w.map = out;
  return out;
}
