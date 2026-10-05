// Navigation over the world's 1 m cells. Because walls, doors and windows are panels on cell
// edges, A* asks the World whether each step is open *right now*, so breached walls, shot-out
// windows and opened doors change the routes instantly with no rebuild. Staircases and
// destroyed hatches join the storeys.
import { STOREY } from '../world/grid.js';
import { Heap } from './util.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const NONE = [];
const OFFS = [0, -0.1, 0.1, -0.2, 0.2, -0.3, 0.3];

export class Nav {
  constructor(world) {
    const w = this.w = world, def = w.map.def;
    this.W = w.W; this.D = w.D; this.F = w.floors + 1; this.N = this.W * this.D * this.F;
    this.blocked = new Uint8Array(this.N); // 1 = a prop fills the cell
    this.partial = new Uint8Array(this.N); // 1 = a prop takes part of the cell
    this.g = new Float32Array(this.N); this.from = new Int32Array(this.N); this.stamp = new Int32Array(this.N); this.closed = new Int32Array(this.N);
    this.gen = 0; this.heap = new Heap();
    this.sx = new Float32Array(this.N); this.sz = new Float32Array(this.N); this.clr = new Float32Array(this.N); this.sst = new Uint8Array(this.N); // standing points (see computeStand)
    this.travel = new Map(); // cached prop slides between neighbouring nodes
    this.links = new Map(); // node -> [{ to, cost, kind, pts }]
    this.holes = new Set(); // node keys of hatch cells (walkable while the hatch is gone)
    for (const [fl, x, z] of def.hatches) this.holes.add(this.node(def.bx + x, def.bz + z, fl - 1));
    for (const [x, z] of def.skylights) this.holes.add(this.node(def.bx + x, def.bz + z, w.floors));
    this.buildBlocked();
    this.buildStairs(def);
    // props that appear or vanish during a round (deployable shields, wire) change where bodies fit
    w.on('prop', (e) => { if (e.prop.solid && !e.prop.walk) this.invalidate(); });
    // furniture that breaks leaves its cells free again
    w.on('propbreak', () => { this.blocked.fill(0); this.partial.fill(0); this.buildBlocked(); this.invalidate(); });
  }
  node(x, z, f) { return (f * this.D + z) * this.W + x; }
  parts(n) { const x = n % this.W, r = (n - x) / this.W, z = r % this.D, f = (r - z) / this.D; return [x, z, f]; }
  floorOf(y) { return Math.max(0, Math.min(this.F - 1, Math.floor((y + 0.6) / STOREY))); }
  nodeAt(x, y, z) { return this.node(Math.max(0, Math.min(this.W - 1, Math.floor(x))), Math.max(0, Math.min(this.D - 1, Math.floor(z))), this.floorOf(y)); }

  buildBlocked() {
    const w = this.w;
    for (const pr of w.props) {
      if (!pr.solid || pr.walk) continue;
      for (let f = 0; f < this.F; f++) {
        const base = f * STOREY, y0 = base + 0.35, y1 = base + 1.7;
        if (pr.max[1] <= y0 || pr.min[1] >= y1) continue;
        const stair = pr.stair;
        for (let z = Math.floor(pr.min[2]); z <= Math.floor(pr.max[2] - 1e-6); z++) for (let x = Math.floor(pr.min[0]); x <= Math.floor(pr.max[0] - 1e-6); x++) {
          if (x < 0 || z < 0 || x >= this.W || z >= this.D) continue;
          const ox = Math.min(x + 1, pr.max[0]) - Math.max(x, pr.min[0]), oz = Math.min(z + 1, pr.max[2]) - Math.max(z, pr.min[2]);
          const area = Math.max(0, ox) * Math.max(0, oz), n = this.node(x, z, f);
          if (pr.kind === 'rail') { if (area > 0) this.partial[n] = 1; continue; }
          if (area >= 0.45 || stair) this.blocked[n] = 1; else if (area > 0.08) this.partial[n] = 1;
        }
      }
    }
  }
  invalidate() { this.cellProps = null; this.sst.fill(0); this.travel.clear(); }
  // ---------------------------------------------------------------- body clearance
  // Solid props that can touch a body standing in a cell (indexed per storey and cell, built on first use).
  propsNear(x, z, f) {
    if (!this.cellProps) {
      this.cellProps = new Map();
      for (const pr of this.w.props) {
        if (!pr.solid || pr.walk || pr.kind === 'rail' || pr.stair) continue;
        for (let fl = 0; fl < this.F; fl++) {
          const base = fl * STOREY; if (pr.max[1] <= base + 0.35 || pr.min[1] >= base + 1.7) continue;
          for (let zz = Math.floor(pr.min[2] - 0.6); zz <= Math.floor(pr.max[2] + 0.6); zz++) for (let xx = Math.floor(pr.min[0] - 0.6); xx <= Math.floor(pr.max[0] + 0.6); xx++) {
            const k = this.node(xx, zz, fl); let l = this.cellProps.get(k); if (!l) this.cellProps.set(k, l = []); l.push(pr);
          }
        }
      }
    }
    return this.cellProps.get(this.node(x, z, f)) || NONE;
  }
  // Where in a cell a body of radius ~0.3 can best stand: the spot with the most room round it, which
  // may be off-centre when a prop sits in the cell. Cells with no such spot are dead pockets.
  computeStand(n) {
    const [x, z, f] = this.parts(n), props = this.propsNear(x, z, f), w = this.w;
    const open = (dx, dz) => w.edge(x, z, x + dx, z + dz, f) === 1;
    const lim = [open(-1, 0) ? 0.35 : 0.2, open(1, 0) ? 0.35 : 0.2, open(0, -1) ? 0.35 : 0.2, open(0, 1) ? 0.35 : 0.2]; // -x +x -z +z
    let best = null, bs = -1e9, bc = 0;
    for (const ox of OFFS) for (const oz of OFFS) {
      if (ox < -lim[0] || ox > lim[1] || oz < -lim[2] || oz > lim[3]) continue;
      const px = x + 0.5 + ox, pz = z + 0.5 + oz; let pc = 1;
      for (const p of props) { const dx = Math.max(p.min[0] - px, 0, px - p.max[0]), dz = Math.max(p.min[2] - pz, 0, pz - p.max[2]), d = Math.hypot(dx, dz); if (d < pc) pc = d; }
      if (pc < 0.3) continue;
      const sc = Math.min(pc, 0.7) - 0.3 * Math.hypot(ox, oz);
      if (sc > bs) { bs = sc; best = [px, pz]; bc = pc; }
    }
    if (best) { this.sx[n] = best[0]; this.sz[n] = best[1]; this.clr[n] = bc; this.sst[n] = 1; } else { this.sx[n] = x + 0.5; this.sz[n] = z + 0.5; this.clr[n] = 0; this.sst[n] = 2; }
  }
  // can a body stand in this node at all?
  fits(n) { if (this.sst[n] === 0) this.computeStand(n); return this.sst[n] === 1; }
  standXZ(n) { if (this.sst[n] === 0) this.computeStand(n); return [this.sx[n], this.sz[n]]; }
  isClear(x, z, f) { return this.fits(this.node(x, z, f)); }
  // is the slide between the standing points of two neighbouring nodes free of props?
  travelOK(n1, n2, r = 0.27) {
    const key = n1 * this.N + n2, c = this.travel.get(key); if (c !== undefined) return c;
    if (this.sst[n1] === 0) this.computeStand(n1); if (this.sst[n2] === 0) this.computeStand(n2);
    const [x1, z1, f] = this.parts(n1), [x2, z2] = this.parts(n2);
    const ax = this.sx[n1], az = this.sz[n1], bx = this.sx[n2], bz = this.sz[n2], dist = Math.hypot(bx - ax, bz - az), steps = Math.max(1, Math.ceil(dist / 0.15));
    const l1 = this.propsNear(x1, z1, f), l2 = this.propsNear(x2, z2, f); let ok = true;
    if (l1.length || l2.length) {
      outer: for (let i = 0; i <= steps; i++) {
        const t = i / steps, px = ax + (bx - ax) * t, pz = az + (bz - az) * t;
        for (const list of [l1, l2]) for (const p of list) { const dx = Math.max(p.min[0] - px, 0, px - p.max[0]), dz = Math.max(p.min[2] - pz, 0, pz - p.max[2]); if (dx * dx + dz * dz < r * r) { ok = false; break outer; } }
      }
    }
    this.travel.set(key, ok); return ok;
  }
  // nearest walkable cell where a body fits, as a node id (falls back to snap)
  snapClear(x, y, z, maxR = 5) { return this.snap(x, y, z, maxR); }
  // a world position a body can stand on, as near as possible to (x, y, z)
  clearPos(p) { return this.centre(this.snap(p[0], p[1], p[2])); }
  buildStairs(def) {
    const w = this.w, bx = def.bx, bz = def.bz;
    const add = (a, b, cost, kind, pts) => { if (!this.links.has(a)) this.links.set(a, []); this.links.get(a).push({ to: b, cost, kind, pts }); };
    this.stairZones = [];
    for (const st of def.stairs) {
      const rise = st.rise ?? STOREY, y0 = st.f * STOREY, top = st.ext ? w.floors : st.f + 1;
      const zone = { x0: bx + st.x, x1: bx + st.x + st.w, z0: bz + st.z, z1: bz + st.z + st.run + (st.ext ? 2 : 0), y0, y1: y0 + rise, run: st.run, cols: [] };
      this.stairZones.push(zone);
      for (let a = 0; a < st.w; a++) {
        const x = bx + st.x + a, z0 = bz + st.z;
        const lo = this.node(x, z0 - 1, st.f), hi = this.node(x, z0 + st.run + (st.ext ? 2 : 0), top);
        zone.cols.push({ x, lo, hi });
        const up = [], down = [];
        for (let i = 0; i < st.run * 2; i++) up.push([x + 0.5, y0 + (rise * (i + 1)) / (st.run * 2), z0 + (i + 1) * 0.5]);
        for (let i = st.run * 2 - 1; i >= 0; i--) down.push([x + 0.5, y0 + (rise * i) / (st.run * 2), z0 + i * 0.5]);
        add(lo, hi, st.run * 1.4 + 2, 'stair', up);
        add(hi, lo, st.run * 1.4 + 2, 'stair', down);
      }
    }
  }
  floorOpen(x, z, f) { return this.w.hasFloor(x, z, f * STOREY === 0 ? 0 : f); }
  hasFloor(x, z, f) { return this.w.hasFloor(x, z, f); }
  // can an actor stand in this cell? (hole cells count: you may step in and drop)
  walkable(x, z, f) {
    if (x < 0 || z < 0 || x >= this.W || z >= this.D) return false;
    const n = this.node(x, z, f);
    if (this.blocked[n]) return false;
    if (this.w.hasFloor(x, z, f)) return true;
    return this.holes.has(n) && f > 0;
  }
  isHole(x, z, f) { return !this.w.hasFloor(x, z, f) && this.holes.has(this.node(x, z, f)); }

  // the barricade (on a door or a window) between two neighbouring cells, if any
  barrierAt(ix, iz, nx, nz, f) {
    const w = this.w, y = f * STOREY; let lo, mid;
    if (nx !== ix) { const face = Math.max(ix, nx); lo = w.getX(face, y, iz); mid = w.getX(face, y + 1, iz); } else { const face = Math.max(iz, nz); lo = w.getZ(ix, y, face); mid = w.getZ(ix, y + 1, face); }
    const d = (lo && lo.door) || (mid && mid.door);
    if (d && d.barricade > 0) return { door: d, panel: lo || mid, centre: [ix === nx ? ix + 0.5 : Math.max(ix, nx), y + 1, ix === nx ? Math.max(iz, nz) : iz + 0.5] };
    const b = mid && mid.kind === 'barricade' ? mid : lo && lo.kind === 'barricade' ? lo : null;
    if (b) return { panel: b, centre: [ix === nx ? ix + 0.5 : Math.max(ix, nx), y + 1, ix === nx ? Math.max(iz, nz) : iz + 0.5] };
    return null;
  }

  // neighbours of a node: callback(neighbour, cost, kind, extra)
  each(n, cb, avoidDoors = false) {
    const [x, z, f] = this.parts(n), w = this.w;
    if (this.isHole(x, z, f)) { cb(this.node(x, z, f - 1), 4, 'drop'); return; }
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!this.walkable(nx, nz, f)) continue;
      const m = this.node(nx, nz, f);
      if (!this.fits(m)) continue; // a dead pocket between props: no body fits
      const e = w.edge(x, z, nx, nz, f);
      if (!e) {
        // a barricaded door or window: only squads that can break it plan through it, at a price
        if (this.allowBarrier) {
          const bar = this.barrierAt(x, z, nx, nz, f);
          if (bar) {
            // planks are a few kicks; an armour panel is only worth the walk for a hammer
            const armored = !!((bar.panel && bar.panel.armor) || (bar.door && bar.door.armored));
            if (armored && this.allowBarrier < 2) continue;
            cb(m, armored ? 26 : 12, 'barrier', { barrier: bar });
          }
        }
        continue;
      }
      if (e === 2 && avoidDoors) continue;
      if (!this.travelOK(n, m)) continue;
      cb(m, (e === 1 ? 1 : e === 2 ? 2.2 : 5) + (this.clr[m] < 0.46 ? 0.45 : 0), e === 1 ? 'walk' : e === 2 ? 'door' : 'vault');
    }
    for (const [dx, dz] of DIAG) {
      const nx = x + dx, nz = z + dz;
      if (!this.walkable(nx, nz, f) || !this.walkable(x + dx, z, f) || !this.walkable(x, z + dz, f)) continue;
      const m = this.node(nx, nz, f);
      if (!this.fits(m)) continue;
      if (w.edge(x, z, x + dx, z, f) !== 1 || w.edge(x, z, x, z + dz, f) !== 1 || w.edge(x + dx, z, nx, nz, f) !== 1 || w.edge(x, z + dz, nx, nz, f) !== 1) continue;
      if (!this.travelOK(n, m) || !this.fits(this.node(x + dx, z, f)) || !this.fits(this.node(x, z + dz, f))) continue;
      cb(m, 1.42, 'walk');
    }
    const ls = this.links.get(n);
    if (ls) for (const l of ls) cb(l.to, l.cost, l.kind, l);
  }

  // A*: returns an array of steps [{ x, z, f, kind, pts? }] from `a` to `b` (node ids), or null.
  // cost(nodeId) adds danger to a cell; maxNodes bounds the search.
  find(a, b, { cost = null, maxNodes = 9000, avoidDoors = false, goalTol = 0, breakBarriers = false } = {}) {
    if (a === b) return [];
    this.allowBarrier = breakBarriers;
    const gen = ++this.gen, H = this.heap; H.clear();
    const [bx, bz, bf] = this.parts(b);
    const hfn = (n) => { const [x, z, f] = this.parts(n); const dx = Math.abs(x - bx), dz = Math.abs(z - bz); return (dx + dz + (1.42 - 2) * Math.min(dx, dz)) + Math.abs(f - bf) * 7; };
    this.g[a] = 0; this.from[a] = -1; this.stamp[a] = gen; H.push(hfn(a), a);
    let found = -1, expanded = 0;
    this.kindTo = this.kindTo || new Map();
    const linkInfo = new Map();
    while (H.size) {
      const n = H.pop();
      if (this.closed[n] === gen) continue;
      this.closed[n] = gen;
      const [nx, nz, nf] = this.parts(n);
      if (n === b || (goalTol && nf === bf && Math.hypot(nx - bx, nz - bz) <= goalTol)) { found = n; break; }
      if (++expanded > maxNodes) break;
      this.each(n, (m, c, kind, link) => {
        if (this.closed[m] === gen) return;
        const extra = cost ? cost(m) : 0;
        if (extra >= 1e6) return;
        const g = this.g[n] + c + extra + (this.partial[m] ? 0.6 : 0);
        if (this.stamp[m] !== gen || g < this.g[m]) {
          this.g[m] = g; this.from[m] = n; this.stamp[m] = gen;
          if (kind !== 'walk') linkInfo.set(m, { kind, link, from: n }); else linkInfo.delete(m);
          H.push(g + hfn(m), m);
        }
      }, avoidDoors);
    }
    if (found < 0) return null;
    const out = [];
    for (let n = found; n !== a; n = this.from[n]) {
      const [x, z, f] = this.parts(n), li = linkInfo.get(n);
      out.push({ x, z, f, node: n, kind: li && li.from === this.from[n] ? li.kind : 'walk', pts: li && li.link ? li.link.pts : null, barrier: li && li.link ? li.link.barrier : null, prev: this.from[n] });
    }
    out.reverse();
    return out;
  }

  // nearest walkable node where a body fits, to a world position (spiral search)
  // standing on a staircase (not at its foot or head): which one, which column, and how far up it is (0..1)
  stairAt(x, y, z) {
    for (const zn of this.stairZones || []) {
      if (x < zn.x0 || x > zn.x1 || z < zn.z0 || z > zn.z1 || y < zn.y0 - 0.2 || y > zn.y1 + 0.2) continue;
      const col = zn.cols[Math.min(zn.cols.length - 1, Math.max(0, Math.floor(x - zn.x0)))];
      return { zone: zn, col, t: Math.max(0, Math.min(1, (z - zn.z0) / (zn.z1 - zn.z0))) };
    }
    return null;
  }
  snap(x, y, z, maxR = 6) {
    const sa = this.stairAt(x, y, z);
    if (sa && y > sa.zone.y0 + 0.05) return sa.t < 0.5 ? sa.col.lo : sa.col.hi;
    const f = this.floorOf(y), cx = Math.floor(x), cz = Math.floor(z); let best = -1, bd = 1e9;
    for (let r = 0; r < maxR; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const nx = cx + dx, nz = cz + dz;
        if (!this.walkable(nx, nz, f)) continue;
        const n = this.node(nx, nz, f); if (!this.fits(n)) continue;
        const d = Math.hypot(this.sx[n] - x, this.sz[n] - z); if (d < bd) { bd = d; best = n; }
      }
      if (best >= 0 && bd <= r + 0.4) return best;
    }
    if (best >= 0) return best;
    for (let r = 0; r < maxR; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      if (this.walkable(cx + dx, cz + dz, f)) return this.node(cx + dx, cz + dz, f);
    }
    return this.node(Math.max(0, Math.min(this.W - 1, cx)), Math.max(0, Math.min(this.D - 1, cz)), f);
  }
  // the standing point of a node, as a world position
  centre(n) { const [, , f] = this.parts(n); const [sx, sz] = this.standXZ(n); return [sx, f * STOREY, sz]; }

  // is the straight walk from a to b (world xz, standing at storey f) free of walls, props and closed doors?
  // distance to the nearest door on this storey (the door's centre line), and that door
  doorDist(x, z, f, ignoreDead = true) {
    let best = 1e9, bd = null;
    for (const d of this.w.doors) {
      if ((ignoreDead && d.dead) || d.f !== f) continue;
      const dx = (d.ax === 'x' ? d.ix : d.ix + 0.5) - x, dz = (d.ax === 'x' ? d.iz + 0.5 : d.iz) - z, h = Math.hypot(dx, dz);
      if (h < best) { best = h; bd = d; }
    }
    return { d: best, door: bd };
  }
  canWalk(ax, az, bx, bz, f, r = 0.28) {
    const w = this.w, y = f * STOREY, dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz);
    if (d < 1e-3) return true;
    const ux = dx / d, uz = dz / d, px = -uz * r, pz = ux * r;
    for (const o of [0, 1, -1]) for (const h of [0.45, 1.3]) {
      const hit = w.cast(ax + px * o, y + h, az + pz * o, ux, 0, uz, d + 0.02, 0);
      if (hit) return false;
    }
    // the floor must continue under the whole line
    const steps = Math.ceil(d / 0.5);
    for (let i = 1; i <= steps; i++) { const t = i / steps; if (!this.walkable(Math.floor(ax + dx * t), Math.floor(az + dz * t), f) || this.isHole(Math.floor(ax + dx * t), Math.floor(az + dz * t), f)) return false; }
    // slide the real body along the line: the rays above only sample three thin lines, which lets a
    // diagonal slip past a doorframe that a body of that width cannot
    const ps = Math.max(1, Math.ceil(d / 0.18)), q = [0, y, 0];
    for (let i = 0; i <= ps; i++) {
      const t = i / ps; q[0] = ax + dx * t; q[1] = y; q[2] = az + dz * t;
      if (w.pushOut(q, Math.max(r, 0.29), 1.8, 0.4, { ignoreDoors: false })) return false;
    }
    return true;
  }
  // string-pull a path: drop waypoints that can be skipped on a straight, door-free line at one storey
  smooth(startX, startZ, startF, steps) {
    const out = [];
    let i = 0, cx = startX, cz = startZ;
    while (i < steps.length) {
      const s = steps[i];
      if (s.kind !== 'walk') { out.push(s); [cx, cz] = this.standXZ(s.node); i++; continue; }
      let j = i;
      while (j + 1 < steps.length && steps[j + 1].kind === 'walk' && steps[j + 1].f === s.f && this.canWalk(cx, cz, ...this.standXZ(steps[j + 1].node), s.f)) j++;
      out.push(steps[j]); [cx, cz] = this.standXZ(steps[j].node); i = j + 1;
    }
    return out;
  }
}
