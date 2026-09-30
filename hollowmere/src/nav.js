// A 1 m navigation grid over the whole level: what is blocked, what is indoors, how high the
// floor is, plus A* path finding with string-pulling, and grid line-of-sight tests.
export class NavGrid {
  constructor({ x0, z0, w, d }) {
    this.x0 = x0; this.z0 = z0; this.w = w; this.d = d;
    this.blocked = new Uint8Array(w * d);   // 1 = solid (walls, big furniture); 2 = passable only by the player (rubble, sewer grate)
    this.indoor = new Uint8Array(w * d);    // 0 outside, 1 inside a building, 2 underground
    this.height = new Float32Array(w * d);  // floor height (steps, dais)
    this.noise = new Uint8Array(w * d);     // how loud footsteps are: 0 grass/dirt, 1 cobble, 2 wood, 3 metal/gravel
    this.zone = new Uint8Array(w * d);      // restricted areas: 0 public, 1 private (guards care), 2 forbidden
  }
  idx(cx, cz) { return cz * this.w + cx; }
  inside(cx, cz) { return cx >= 0 && cz >= 0 && cx < this.w && cz < this.d; }
  cell(x, z) { return [Math.floor(x - this.x0), Math.floor(z - this.z0)]; }
  at(x, z) { const [cx, cz] = this.cell(x, z); return this.inside(cx, cz) ? this.idx(cx, cz) : -1; }
  center(cx, cz) { return [this.x0 + cx + 0.5, this.z0 + cz + 0.5]; }
  isBlocked(x, z, mode = 1) { const i = this.at(x, z); return i < 0 || this.blocked[i] >= 1 && (mode === 1 || this.blocked[i] === 1); }
  floorAt(x, z) { const i = this.at(x, z); return i < 0 ? 0 : this.height[i]; }
  indoorAt(x, z) { const i = this.at(x, z); return i < 0 ? 0 : this.indoor[i]; }
  // fill a rectangle of world coordinates [x0,x1) x [z0,z1)
  fill(arr, x0, z0, x1, z1, v) {
    const a = this.cell(x0 + 1e-4, z0 + 1e-4), b = this.cell(x1 - 1e-4, z1 - 1e-4);
    for (let cz = Math.max(0, a[1]); cz <= Math.min(this.d - 1, b[1]); cz++) for (let cx = Math.max(0, a[0]); cx <= Math.min(this.w - 1, b[0]); cx++) arr[this.idx(cx, cz)] = v;
  }
  block(x0, z0, x1, z1, v = 1) { this.fill(this.blocked, x0, z0, x1, z1, v); }
  clear(x0, z0, x1, z1) { this.fill(this.blocked, x0, z0, x1, z1, 0); }
  setIndoor(x0, z0, x1, z1, v = 1) { this.fill(this.indoor, x0, z0, x1, z1, v); }
  setHeight(x0, z0, x1, z1, h) { this.fill(this.height, x0, z0, x1, z1, h); }
  setNoise(x0, z0, x1, z1, v) { this.fill(this.noise, x0, z0, x1, z1, v); }
  setZone(x0, z0, x1, z1, v) { this.fill(this.zone, x0, z0, x1, z1, v); }

  walkable(cx, cz, mode = 1) { return this.inside(cx, cz) && !(this.blocked[this.idx(cx, cz)] >= 1 && (mode === 1 || this.blocked[this.idx(cx, cz)] === 1)); }
  nearestWalkable(x, z, maxR = 6, mode = 1) {
    const [cx, cz] = this.cell(x, z);
    if (this.walkable(cx, cz, mode)) return this.center(cx, cz);
    for (let r = 1; r <= maxR; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      if (this.walkable(cx + dx, cz + dz, mode)) return this.center(cx + dx, cz + dz);
    }
    return null;
  }
  // supercover-ish line test between two world points over blocked cells
  los(ax, az, bx, bz, mode = 1) {
    const dx = bx - ax, dz = bz - az, n = Math.ceil(Math.hypot(dx, dz) / 0.4);
    for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; if (this.isBlocked(ax + dx * t, az + dz * t, mode)) return false; }
    return true;
  }
  // wide line test (agent radius): checks three parallel lines
  clearLine(ax, az, bx, bz, r = 0.35, mode = 1) {
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * r, nz = dx / l * r;
    return this.los(ax, az, bx, bz, mode) && this.los(ax + nx, az + nz, bx + nx, bz + nz, mode) && this.los(ax - nx, az - nz, bx - nx, bz - nz, mode);
  }

  // A* over 8-connected cells. Returns [[x,z],...] (world), or null. mode 2 lets the path cross player-only cells.
  findPath(sx, sz, gx, gz, { mode = 1, maxNodes = 30000 } = {}) {
    const s = this.nearestWalkable(sx, sz, 4, mode), g = this.nearestWalkable(gx, gz, 8, mode);
    if (!s || !g) return null;
    const [scx, scz] = this.cell(s[0], s[1]), [gcx, gcz] = this.cell(g[0], g[1]);
    const W = this.w, N = this.w * this.d, start = scz * W + scx, goal = gcz * W + gcx;
    if (start === goal) return [g];
    if (!this._g) { this._g = new Float32Array(N); this._from = new Int32Array(N); this._stamp = new Uint32Array(N); this._closed = new Uint32Array(N); this._run = 0; }
    const G = this._g, from = this._from, stamp = this._stamp, closed = this._closed, run = ++this._run;
    const heap = [], push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const h = (i) => { const dx = Math.abs((i % W) - gcx), dz = Math.abs(((i / W) | 0) - gcz); return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz); };
    const near = (cx, cz) => { let c = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!this.walkable(cx + dx, cz + dz, mode)) c = 1.2; return c; };
    stamp[start] = run; G[start] = 0; from[start] = -1; push(start, h(start));
    let nodes = 0, found = false;
    while (heap.length && nodes++ < maxNodes) {
      const [, cur] = pop();
      if (closed[cur] === run) continue; closed[cur] = run;
      if (cur === goal) { found = true; break; }
      const cx = cur % W, cz = (cur / W) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (!this.walkable(nx, nz, mode)) continue;
        if (dx && dz && (!this.walkable(cx + dx, cz, mode) || !this.walkable(cx, cz + dz, mode))) continue; // no corner cutting
        const ni = nz * W + nx;
        if (closed[ni] === run) continue;
        const ng = G[cur] + (dx && dz ? Math.SQRT2 : 1) + near(nx, nz);
        if (stamp[ni] !== run || ng < G[ni]) { stamp[ni] = run; G[ni] = ng; from[ni] = cur; push(ni, ng + h(ni)); }
      }
    }
    if (!found) return null;
    const cells = []; for (let i = goal; i >= 0; i = from[i]) cells.push(i);
    cells.reverse();
    let pts = cells.map((i) => this.center(i % W, (i / W) | 0));
    // string pulling: skip waypoints while the straight line stays clear
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) {
      let b = pts.length - 1;
      while (b > a + 1 && !this.clearLine(pts[a][0], pts[a][1], pts[b][0], pts[b][1], 0.3, mode)) b--;
      out.push(pts[b]); a = b;
    }
    out.shift();
    out[out.length - 1] = [gx, gz].every((v) => Number.isFinite(v)) && this.walkable(...this.cell(gx, gz), mode) ? [gx, gz] : out[out.length - 1];
    return out;
  }
}
