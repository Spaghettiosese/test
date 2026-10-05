// Navigation over the world's 1 m cells. Because walls, doors and windows are panels on cell
// edges, A* asks the World whether each step is open *right now*, so breached walls, shot-out
// windows and opened doors change the routes instantly with no rebuild. Staircases and
// destroyed hatches join the storeys.
import { STOREY } from '../world/grid.js';
import { Heap } from './util.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export class Nav {
  constructor(world) {
    const w = this.w = world, def = w.map.def;
    this.W = w.W; this.D = w.D; this.F = w.floors + 1; this.N = this.W * this.D * this.F;
    this.blocked = new Uint8Array(this.N); // 1 = a prop fills the cell
    this.partial = new Uint8Array(this.N); // 1 = a prop takes part of the cell
    this.g = new Float32Array(this.N); this.from = new Int32Array(this.N); this.stamp = new Int32Array(this.N); this.closed = new Int32Array(this.N);
    this.gen = 0; this.heap = new Heap();
    this.links = new Map(); // node -> [{ to, cost, kind, pts }]
    this.holes = new Set(); // node keys of hatch cells (walkable while the hatch is gone)
    for (const [fl, x, z] of def.hatches) this.holes.add(this.node(def.bx + x, def.bz + z, fl - 1));
    for (const [x, z] of def.skylights) this.holes.add(this.node(def.bx + x, def.bz + z, w.floors));
    this.buildBlocked();
    this.buildStairs(def);
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
  buildStairs(def) {
    const w = this.w, bx = def.bx, bz = def.bz;
    const add = (a, b, cost, kind, pts) => { if (!this.links.has(a)) this.links.set(a, []); this.links.get(a).push({ to: b, cost, kind, pts }); };
    for (const st of def.stairs) {
      const rise = st.rise ?? STOREY, y0 = st.f * STOREY, top = st.ext ? w.floors : st.f + 1;
      for (let a = 0; a < st.w; a++) {
        const x = bx + st.x + a, z0 = bz + st.z;
        const lo = this.node(x, z0 - 1, st.f), hi = this.node(x, z0 + st.run + (st.ext ? 2 : 0), top);
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

  // neighbours of a node: callback(neighbour, cost, kind, extra)
  each(n, cb, avoidDoors = false) {
    const [x, z, f] = this.parts(n), w = this.w;
    if (this.isHole(x, z, f)) { cb(this.node(x, z, f - 1), 4, 'drop'); return; }
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!this.walkable(nx, nz, f)) continue;
      const e = w.edge(x, z, nx, nz, f);
      if (!e) continue;
      if (e === 2 && avoidDoors) continue;
      cb(this.node(nx, nz, f), e === 1 ? 1 : e === 2 ? 2.2 : 5, e === 1 ? 'walk' : e === 2 ? 'door' : 'vault');
    }
    for (const [dx, dz] of DIAG) {
      const nx = x + dx, nz = z + dz;
      if (!this.walkable(nx, nz, f) || !this.walkable(x + dx, z, f) || !this.walkable(x, z + dz, f)) continue;
      if (w.edge(x, z, x + dx, z, f) !== 1 || w.edge(x, z, x, z + dz, f) !== 1 || w.edge(x + dx, z, nx, nz, f) !== 1 || w.edge(x, z + dz, nx, nz, f) !== 1) continue;
      cb(this.node(nx, nz, f), 1.42, 'walk');
    }
    const ls = this.links.get(n);
    if (ls) for (const l of ls) cb(l.to, l.cost, l.kind, l);
  }

  // A*: returns an array of steps [{ x, z, f, kind, pts? }] from `a` to `b` (node ids), or null.
  // cost(nodeId) adds danger to a cell; maxNodes bounds the search.
  find(a, b, { cost = null, maxNodes = 9000, avoidDoors = false, goalTol = 0 } = {}) {
    if (a === b) return [];
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
      out.push({ x, z, f, node: n, kind: li && li.from === this.from[n] ? li.kind : 'walk', pts: li && li.link ? li.link.pts : null, prev: this.from[n] });
    }
    out.reverse();
    return out;
  }

  // nearest walkable node to a world position (spiral search)
  snap(x, y, z) {
    const f = this.floorOf(y), cx = Math.floor(x), cz = Math.floor(z);
    for (let r = 0; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      if (this.walkable(cx + dx, cz + dz, f)) return this.node(cx + dx, cz + dz, f);
    }
    return this.node(Math.max(0, Math.min(this.W - 1, cx)), Math.max(0, Math.min(this.D - 1, cz)), f);
  }
  centre(n) { const [x, z, f] = this.parts(n); return [x + 0.5, f * STOREY, z + 0.5]; }

  // is the straight walk from a to b (world xz, standing at storey f) free of walls, props and closed doors?
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
    return true;
  }
  // string-pull a path: drop waypoints that can be skipped on a straight, door-free line at one storey
  smooth(startX, startZ, startF, steps) {
    const out = [];
    let i = 0, cx = startX, cz = startZ;
    while (i < steps.length) {
      const s = steps[i];
      if (s.kind !== 'walk') { out.push(s); cx = s.x + 0.5; cz = s.z + 0.5; i++; continue; }
      let j = i;
      while (j + 1 < steps.length && steps[j + 1].kind === 'walk' && steps[j + 1].f === s.f && this.canWalk(cx, cz, steps[j + 1].x + 0.5, steps[j + 1].z + 0.5, s.f)) j++;
      out.push(steps[j]); cx = steps[j].x + 0.5; cz = steps[j].z + 0.5; i = j + 1;
    }
    return out;
  }
}
