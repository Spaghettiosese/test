// The world of a match: a 1 m voxel grid whose WALLS, FLOORS and WINDOWS are 1 x 1 m panels
// sitting on the faces between voxels. Everything the game needs hangs off that one structure:
//   - exact hitscan (3D DDA that checks the face it crosses), bullet penetration and decals
//   - destruction (a panel has hit points; hammers, charges and gunfire remove panels)
//   - reinforcement (a unit of panels turns to steel and only hard breaches open it)
//   - movement collision for cylinders (players, AI) against panels and prop boxes
//   - navigation queries (is the edge between two cells open?) so AI paths follow every hole
// Axes: +X east, +Z north, +Y up. A storey is 3 voxels tall; floors sit at y = 0, 3, 6...
export const STOREY = 3;
export const WALL_T = 0.2;
export const SLAB_T = 0.2;
const HT = WALL_T / 2;

// wall materials: hp per 1 m panel, how much of a bullet's energy they swallow, whether
// they can be reinforced, and what they sound/look like
export const MATS = {
  plaster: { label: 'Drywall', hp: 90, absorb: 0.55, soft: true, color: '#cfc9bc', pattern: 'stucco', patternScale: 1.4, patternColor: '#a69f90', roughness: 0.95 },
  wood: { label: 'Wood', hp: 120, absorb: 0.7, soft: true, color: '#9a7a52', pattern: 'planks', patternScale: 5, patternColor: '#4a3220', roughness: 0.85 },
  brick: { label: 'Brick', hp: 400, absorb: 3, soft: false, color: '#a35a40', pattern: 'brick', patternScale: 9, patternColor: '#d2c4aa', roughness: 0.88 },
  concrete: { label: 'Concrete', hp: Infinity, absorb: 99, soft: false, color: '#8e8b85', pattern: 'stucco', patternScale: 2.4, patternColor: '#6b6860', roughness: 0.92 },
  metal: { label: 'Sheet metal', hp: 250, absorb: 1.6, soft: false, color: '#78808a', pattern: 'metal', patternScale: 2, patternColor: '#454a50', metallic: 0.7, roughness: 0.5 },
  glass: { label: 'Glass', hp: 8, absorb: 0, soft: true, color: '#8fb4c8', roughness: 0.05 },
  floor: { label: 'Floor', hp: Infinity, absorb: 99, soft: false, color: '#6e6a63', pattern: 'stucco', patternScale: 2, patternColor: '#55524c', roughness: 0.9 },
  hatchwood: { label: 'Trapdoor', hp: 110, absorb: 0.8, soft: true, color: '#7a5a3a', pattern: 'planks', patternScale: 6, patternColor: '#35261a', roughness: 0.85 },
  roof: { label: 'Roof', hp: Infinity, absorb: 99, soft: false, color: '#858a90', pattern: 'corrugated', patternScale: 6, patternColor: '#5d6268', metallic: 0.4, roughness: 0.55 },
  steel: { label: 'Reinforced steel', hp: 1200, absorb: 99, soft: false, color: '#5f6b73', pattern: 'metal', patternScale: 3, patternColor: '#2c3338', metallic: 0.85, roughness: 0.4 },
};

let PANEL_ID = 1;
export class Panel {
  constructor(o) {
    this.id = PANEL_ID++;
    this.kind = 'wall'; this.mat = 'plaster'; this.dest = true; this.nr = false; // nr: cannot be reinforced
    this.reinforced = false; this.unit = 0; this.door = null; this.barricade = null;
    this.dead = false; this.ax = 'x'; this.ix = 0; this.iy = 0; this.iz = 0; this.hatch = false;
    this.shock = false; // electrified by a shock wire
    Object.assign(this, o);
    this.max = this.hp = o.hp ?? MATS[this.mat].hp;
  }
  // does this panel stop movement / bullets / sight right now?
  get solid() {
    if (this.dead) return false;
    if (this.door) return this.door.blocking;
    return true;
  }
  get isGlass() { return this.kind === 'glass'; }
  get soft() { return !this.reinforced && MATS[this.mat].soft; }
}

export class Door {
  constructor(o) {
    this.id = PANEL_ID++;
    Object.assign(this, { open: 0, target: 0, dead: false, barricade: 0, panels: [], ax: 'x', ix: 0, iz: 0, f: 0, node: null, locked: false, hp: 160, kind: 'door', width: 1 }, o);
  }
  get blocking() { return !this.dead && (this.open < 0.55 || this.barricade > 0); }
  get passable() { return !this.blocking; }
  setOpen(v) { if (this.barricade > 0 || this.dead) return false; this.target = v ? 1 : 0; return true; }
  toggle() { return this.setOpen(this.target < 0.5); }
}

// reusable hit record returned by cast(); copy what you need before the next call
const HIT = { t: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, panel: null, prop: null };
export const CAST = { GLASS: 1, PROPS: 2, SOFT_LOW: 4, DOORS: 8 }; // flags: ignore glass, ignore props, ...

export class World {
  constructor(W, D, floors) {
    this.W = W; this.D = D; this.floors = floors; this.H = floors * STOREY + 1; // voxel layers (+1 so the roof slab has a cell above it)
    const H = this.H;
    this.fx = new Array((W + 1) * D * H).fill(null);
    this.fz = new Array(W * (D + 1) * H).fill(null);
    this.fy = new Array(W * D * (H + 1)).fill(null);
    this.props = []; this.propCols = Array.from({ length: W * D }, () => []);
    this.doors = []; this.units = new Map(); this.unitSeq = 1;
    this.listeners = { break: [], damage: [], door: [], prop: [], propbreak: [], propdamage: [] };
    this.stamp = 0;
    this.rooms = []; // per floor: Uint8Array of room indices
    this.roomNames = [];
    this.smoke = []; // { x,y,z,r,t } volumes that block sight
  }
  on(type, fn) { this.listeners[type].push(fn); return () => { const l = this.listeners[type]; l.splice(l.indexOf(fn), 1); }; }
  emit(type, e) { for (const f of this.listeners[type]) f(e); }

  // ---------------------------------------------------------------- face access
  ixX(ix, iy, iz) { return (iy * this.D + iz) * (this.W + 1) + ix; }
  ixZ(ix, iy, iz) { return (iy * (this.D + 1) + iz) * this.W + ix; }
  ixY(ix, iy, iz) { return (iy * this.D + iz) * this.W + ix; }
  inX(ix, iy, iz) { return ix >= 0 && ix <= this.W && iy >= 0 && iy < this.H && iz >= 0 && iz < this.D; }
  inZ(ix, iy, iz) { return ix >= 0 && ix < this.W && iy >= 0 && iy < this.H && iz >= 0 && iz <= this.D; }
  inY(ix, iy, iz) { return ix >= 0 && ix < this.W && iy >= 0 && iy <= this.H && iz >= 0 && iz < this.D; }
  getX(ix, iy, iz) { return this.inX(ix, iy, iz) ? this.fx[this.ixX(ix, iy, iz)] : null; }
  getZ(ix, iy, iz) { return this.inZ(ix, iy, iz) ? this.fz[this.ixZ(ix, iy, iz)] : null; }
  getY(ix, iy, iz) { return this.inY(ix, iy, iz) ? this.fy[this.ixY(ix, iy, iz)] : null; }
  // the panel on the face of an axis at lattice coords (ax = 'x' | 'z' | 'y')
  get(ax, ix, iy, iz) { return ax === 'x' ? this.getX(ix, iy, iz) : ax === 'z' ? this.getZ(ix, iy, iz) : this.getY(ix, iy, iz); }
  put(ax, ix, iy, iz, p) {
    p.ax = ax; p.ix = ix; p.iy = iy; p.iz = iz;
    if (ax === 'x') this.fx[this.ixX(ix, iy, iz)] = p; else if (ax === 'z') this.fz[this.ixZ(ix, iy, iz)] = p; else this.fy[this.ixY(ix, iy, iz)] = p;
    return p;
  }
  remove(p) {
    if (p.ax === 'x') this.fx[this.ixX(p.ix, p.iy, p.iz)] = null; else if (p.ax === 'z') this.fz[this.ixZ(p.ix, p.iy, p.iz)] = null; else this.fy[this.ixY(p.ix, p.iy, p.iz)] = null;
  }
  // solid panel on the face, or null (dead panels are removed, open doors are not solid)
  solidX(ix, iy, iz) { const p = this.getX(ix, iy, iz); return p && p.solid ? p : null; }
  solidZ(ix, iy, iz) { const p = this.getZ(ix, iy, iz); return p && p.solid ? p : null; }
  solidY(ix, iy, iz) { const p = this.getY(ix, iy, iz); return p && p.solid ? p : null; }
  // world-space box of a panel (thin slab on its face)
  panelBox(p, out = { min: [0, 0, 0], max: [0, 0, 0] }) {
    const { ix, iy, iz } = p;
    if (p.ax === 'x') { out.min = [ix - HT, iy, iz - HT]; out.max = [ix + HT, iy + 1, iz + 1 + HT]; }
    else if (p.ax === 'z') { out.min = [ix - HT, iy, iz - HT]; out.max = [ix + 1 + HT, iy + 1, iz + HT]; }
    else { out.min = [ix, iy - SLAB_T, iz]; out.max = [ix + 1, iy, iz + 1]; }
    return out;
  }
  panelCenter(p) {
    if (p.ax === 'x') return [p.ix, p.iy + 0.5, p.iz + 0.5];
    if (p.ax === 'z') return [p.ix + 0.5, p.iy + 0.5, p.iz];
    return [p.ix + 0.5, p.iy, p.iz + 0.5];
  }

  // ---------------------------------------------------------------- props (boxes: furniture, cars, cover)
  addProp(o) {
    const pr = { solid: true, cover: 'full', kind: 'prop', hp: Infinity, vis: true, step: false, ...o };
    pr.id = PANEL_ID++;
    this.props.push(pr);
    const x0 = Math.max(0, Math.floor(pr.min[0])), x1 = Math.min(this.W - 1, Math.floor(pr.max[0] - 1e-6));
    const z0 = Math.max(0, Math.floor(pr.min[2])), z1 = Math.min(this.D - 1, Math.floor(pr.max[2] - 1e-6));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.propCols[z * this.W + x].push(pr);
    this.emit('prop', { prop: pr, added: true });
    return pr;
  }
  removeProp(pr) {
    const i = this.props.indexOf(pr); if (i >= 0) this.props.splice(i, 1);
    for (const col of this.propCols) { const j = col.indexOf(pr); if (j >= 0) col.splice(j, 1); }
    this.emit('prop', { prop: pr, added: false });
  }

  // Furniture and fixtures take damage too: a prop with finite hit points breaks (all the boxes of one
  // piece together) and stops blocking movement, sight and bullets.
  damageProp(pr, amount, src = {}) {
    if (!pr || pr.dead || !(pr.hp < Infinity) || amount <= 0) return false;
    pr.hp -= amount; this.emit('propdamage', { prop: pr, amount, src });
    if (pr.hp <= 0) { this.breakProp(pr, src); return true; }
    return false;
  }
  breakProp(pr, src = {}) {
    if (pr.dead) return;
    const group = pr.pid ? this.props.filter((q) => q.pid === pr.pid) : [pr];
    for (const q of group) { q.dead = true; this.removeProp(q); }
    this.emit('propbreak', { prop: pr, group, src });
  }

  // ---------------------------------------------------------------- rooms
  roomAt(x, y, z) {
    const f = Math.max(0, Math.min(this.floors - 1, Math.floor((y + 0.2) / STOREY)));
    const ix = Math.floor(x), iz = Math.floor(z);
    if (ix < 0 || iz < 0 || ix >= this.W || iz >= this.D || !this.rooms[f]) return -1;
    return this.rooms[f][iz * this.W + ix] - 1;
  }
  roomName(x, y, z) {
    const r = this.roomAt(x, y, z);
    const f = Math.floor((y + 0.2) / STOREY);
    return r >= 0 ? `${f + 1}F ${this.roomNames[r]}` : (f > 1 ? 'Roof' : 'Outside');
  }

  // ---------------------------------------------------------------- hitscan
  // 3D DDA through the voxel lattice. The ray is stopped by the first solid panel on the
  // face it crosses, or by a prop box. flags: CAST.GLASS skips glass, CAST.PROPS skips props.
  cast(ox, oy, oz, dx, dy, dz, maxT = 100, flags = 0, skip = null) {
    const W = this.W, D = this.D, H = this.H;
    let ix = Math.floor(ox), iy = Math.floor(oy), iz = Math.floor(oz);
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tx = dx !== 0 ? ((dx > 0 ? ix + 1 : ix) - ox) / dx : Infinity;
    let ty = dy !== 0 ? ((dy > 0 ? iy + 1 : iy) - oy) / dy : Infinity;
    let tz = dz !== 0 ? ((dz > 0 ? iz + 1 : iz) - oz) / dz : Infinity;
    const stamp = ++this.stamp, noProps = (flags & CAST.PROPS) !== 0, noGlass = (flags & CAST.GLASS) !== 0;
    let best = null; // nearest prop hit found so far { t, prop }
    for (let guard = 0; guard < 500; guard++) {
      const tn = Math.min(tx, ty, tz);
      if (!noProps && ix >= 0 && iz >= 0 && ix < W && iz < D) {
        const col = this.propCols[iz * W + ix];
        for (let i = 0; i < col.length; i++) {
          const pr = col[i];
          if (pr.stamp === stamp || pr === skip || !pr.solid || pr.dead) continue;
          pr.stamp = stamp;
          const t = rayBox(ox, oy, oz, dx, dy, dz, pr.min, pr.max);
          if (t !== null && t <= maxT && (!best || t < best.t)) best = { t, prop: pr };
        }
      }
      if (best && best.t <= tn) return this._propHit(best, ox, oy, oz, dx, dy, dz);
      if (tn > maxT) return null;
      let p, axis;
      if (tx <= ty && tx <= tz) { axis = 0; p = this.getX(dx > 0 ? ix + 1 : ix, iy, iz); ix += sx; tx += tdx; }
      else if (ty <= tz) { axis = 1; p = this.getY(ix, dy > 0 ? iy + 1 : iy, iz); iy += sy; ty += tdy; }
      else { axis = 2; p = this.getZ(ix, iy, dz > 0 ? iz + 1 : iz); iz += sz; tz += tdz; }
      if (p && p.solid && p !== skip && !(noGlass && p.kind === 'glass')) {
        const t = axis === 0 ? tx - tdx : axis === 1 ? ty - tdy : tz - tdz;
        HIT.t = t; HIT.x = ox + dx * t; HIT.y = oy + dy * t; HIT.z = oz + dz * t; HIT.panel = p; HIT.prop = null;
        HIT.nx = axis === 0 ? -sx : 0; HIT.ny = axis === 1 ? -sy : 0; HIT.nz = axis === 2 ? -sz : 0;
        // report the surface the ray meets (the near side of the slab), not the panel's centre plane
        if (axis === 0) HIT.x -= sx * HT; else if (axis === 2) HIT.z -= sz * HT; else if (sy > 0) HIT.y -= SLAB_T;
        return HIT;
      }
      if (ix < -2 || iz < -2 || ix > W + 1 || iz > D + 1 || iy < -2 || iy > H + 2) return best ? this._propHit(best, ox, oy, oz, dx, dy, dz) : null;
    }
    return null;
  }
  _propHit(bp, ox, oy, oz, dx, dy, dz) {
    const t = bp.t, pr = bp.prop;
    HIT.t = t; HIT.x = ox + dx * t; HIT.y = oy + dy * t; HIT.z = oz + dz * t; HIT.panel = null; HIT.prop = pr;
    const e = 2e-3;
    HIT.nx = HIT.ny = HIT.nz = 0;
    if (Math.abs(HIT.x - pr.min[0]) < e) HIT.nx = -1; else if (Math.abs(HIT.x - pr.max[0]) < e) HIT.nx = 1;
    else if (Math.abs(HIT.y - pr.max[1]) < e) HIT.ny = 1; else if (Math.abs(HIT.y - pr.min[1]) < e) HIT.ny = -1;
    else if (Math.abs(HIT.z - pr.min[2]) < e) HIT.nz = -1; else HIT.nz = 1;
    return HIT;
  }
  // is there a clear line between two points? (sight: glass and open doors are see-through, smoke is not)
  visible(a, b, flags = CAST.GLASS) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], d = Math.hypot(dx, dy, dz);
    if (d < 1e-4) return true;
    const h = this.cast(a[0], a[1], a[2], dx / d, dy / d, dz / d, d - 0.02, flags);
    if (h) return false;
    if (this.smoke.length) return !this.smokeBlocks(a, b);
    return true;
  }
  smokeBlocks(a, b) {
    for (const s of this.smoke) {
      if (s.t <= 0) continue;
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz || 1;
      let u = ((s.x - a[0]) * dx + (s.y - a[1]) * dy + (s.z - a[2]) * dz) / l2; u = Math.max(0, Math.min(1, u));
      const px = a[0] + dx * u - s.x, py = a[1] + dy * u - s.y, pz = a[2] + dz * u - s.z;
      if (px * px + py * py + pz * pz < s.r * s.r * s.density) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- damage and destruction
  damage(p, amount, src = {}) {
    if (!p || p.dead || !p.dest) return false;
    const d = p.door;
    if (d && d.dead) return false;
    if (d && d.barricade > 0) { // boards take the hit first
      d.barricadeHp -= amount;
      this.emit('damage', { panel: p, amount, src, barricade: true });
      if (d.barricadeHp <= 0) { d.barricade = 0; this.emit('door', { door: d, unbarricaded: true }); }
      return false;
    }
    p.hp -= amount;
    this.emit('damage', { panel: p, amount, src });
    if (p.hp <= 0) { this.breakPanel(p, src); return true; }
    return false;
  }
  breakPanel(p, src = {}) {
    if (p.dead) return;
    if (p.door) { this.breakDoor(p.door, src); return; }
    p.dead = true; this.remove(p);
    this.emit('break', { panel: p, src });
    // a wall unit that loses a panel loses its reinforcement bookkeeping for that panel only
    return p;
  }
  breakDoor(d, src = {}) {
    if (d.dead) return;
    d.dead = true; d.open = 1; d.target = 1;
    for (const p of d.panels) { p.dead = true; this.remove(p); }
    this.emit('break', { door: d, panel: d.panels[0], src });
    this.emit('door', { door: d, broken: true });
  }
  // The panels of a walk-through hole around a struck wall panel: `width` panels along the
  // wall (the hit panel and its neighbour on the side nearer `point`), rows from the floor up.
  holeFor(p, point, width = 2, rows = 2) {
    const out = [];
    if (!p || p.ax === 'y') { if (p) out.push(p); return out; }
    const base = Math.floor(p.iy / STOREY) * STOREY;
    const lateral = p.ax === 'x' ? point[2] : point[0], idx = p.ax === 'x' ? p.iz : p.ix;
    const side = lateral - (idx + 0.5) >= 0 ? 1 : -1;
    const offs = [0, side, -side].slice(0, width);
    for (const o of offs) for (let r = 0; r < rows; r++) {
      const q = p.ax === 'x' ? this.getX(p.ix, base + r, idx + o) : this.getZ(idx + o, base + r, p.iz);
      if (q && !q.dead) out.push(q);
    }
    return out;
  }
  // blast: every soft panel within radius loses hp falling off with distance
  blast(x, y, z, radius, power, { hard = false, src = {} } = {}) {
    const broke = [];
    const x0 = Math.floor(x - radius), x1 = Math.floor(x + radius) + 1, y0 = Math.floor(y - radius), y1 = Math.floor(y + radius) + 1, z0 = Math.floor(z - radius), z1 = Math.floor(z + radius) + 1;
    for (let iy = Math.max(0, y0); iy <= Math.min(this.H - 1, y1); iy++) for (let iz = Math.max(0, z0); iz <= Math.min(this.D, z1); iz++) for (let ix = Math.max(0, x0); ix <= Math.min(this.W, x1); ix++) {
      for (const p of [this.getX(ix, iy, iz), this.getZ(ix, iy, iz), iy % STOREY === 0 ? this.getY(ix, iy, iz) : null]) {
        if (!p || p.dead || !p.dest) continue;
        const c = this.panelCenter(p), d = Math.hypot(c[0] - x, c[1] - y, c[2] - z);
        if (d > radius) continue;
        if (p.reinforced && !hard) continue;
        // line of sight from the blast to the panel's centre: another solid panel in front shields it
        const dd = d || 1e-3;
        const h = d > 0.8 ? this.cast(x, y, z, (c[0] - x) / dd, (c[1] - y) / dd, (c[2] - z) / dd, d - 0.35, CAST.GLASS | CAST.PROPS) : null;
        if (h && h.panel !== p && h.panel.solid) continue;
        if (this.damage(p, power * (1 - d / radius) * (p.reinforced ? 0.4 : 1), src)) broke.push(p);
      }
    }
    return broke;
  }

  // ---------------------------------------------------------------- reinforcement units
  // A unit is a run of wall panels along one edge line; reinforcing turns the whole unit to steel.
  reinforceUnit(unit) {
    const ps = this.units.get(unit); if (!ps) return 0;
    let n = 0;
    for (const p of ps) { if (!p.dead && !p.reinforced && !p.nr) { p.reinforced = true; p.hp = p.max = MATS.steel.hp; n++; } }
    this.emit('damage', { panel: ps[0], reinforce: true, unit });
    return n;
  }
  unitReinforced(unit) { const ps = this.units.get(unit); return !!ps && ps.some((p) => p.reinforced); }

  // ---------------------------------------------------------------- movement collision
  // push a cylinder (feet position pos, radius r, height h) out of panels and prop boxes
  pushOut(pos, r, h, stepH = 0.36, opts = {}) {
    const y0 = pos[1] + stepH, y1 = pos[1] + h;
    let hit = false;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      const x = pos[0], z = pos[2];
      const ix0 = Math.floor(x - r - HT), ix1 = Math.floor(x + r + HT), iz0 = Math.floor(z - r - HT), iz1 = Math.floor(z + r + HT);
      const iyA = Math.floor(y0), iyB = Math.floor(y1 - 1e-4);
      for (let iy = iyA; iy <= iyB; iy++) {
        for (let iz = iz0; iz <= iz1 + 1; iz++) for (let ix = ix0; ix <= ix1 + 1; ix++) {
          const px = this.solidX(ix, iy, iz);
          if (px && !(opts.ignoreDoors && px.door) && circleBox(pos, r, ix - HT, ix + HT, iz - HT, iz + 1 + HT)) { moved = true; hit = true; }
          const pz = this.solidZ(ix, iy, iz);
          if (pz && !(opts.ignoreDoors && pz.door) && circleBox(pos, r, ix - HT, ix + 1 + HT, iz - HT, iz + HT)) { moved = true; hit = true; }
        }
      }
      // props
      const cx0 = Math.max(0, ix0), cx1 = Math.min(this.W - 1, ix1), cz0 = Math.max(0, iz0), cz1 = Math.min(this.D - 1, iz1);
      for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) {
        for (const pr of this.propCols[cz * this.W + cx]) {
          if (!pr.solid || pr.dead || pr.walk) continue;
          if (pr.max[1] <= pos[1] + stepH + 1e-3 || pr.min[1] >= y1) continue;
          if (circleBox(pos, r, pr.min[0], pr.max[0], pr.min[2], pr.max[2])) { moved = true; hit = true; }
        }
      }
      if (!moved) break;
    }
    return hit;
  }
  // highest surface under the cylinder that the feet can stand on (<= feet + stepH); -Infinity if none
  groundY(x, z, r, feetY, stepH = 0.36) {
    let best = -Infinity;
    const s = r * 0.7, pts = [[x, z], [x + s, z], [x - s, z], [x, z + s], [x, z - s]];
    const limit = feetY + stepH;
    for (const [px, pz] of pts) {
      const ix = Math.floor(px), iz = Math.floor(pz);
      if (ix < 0 || iz < 0 || ix >= this.W || iz >= this.D) continue;
      for (let lvl = 0; lvl <= this.floors * STOREY; lvl += STOREY) {
        if (lvl > limit) break;
        const p = this.fy[this.ixY(ix, lvl, iz)];
        if (p && !p.dead && lvl > best) best = lvl;
      }
      for (const pr of this.propCols[iz * this.W + ix]) {
        if (!pr.solid || pr.dead) continue;
        if (px < pr.min[0] - 0.02 || px > pr.max[0] + 0.02 || pz < pr.min[2] - 0.02 || pz > pr.max[2] + 0.02) continue;
        const top = pr.max[1];
        if (top <= limit + 1e-4 && top > best && !pr.noStand) best = top;
      }
    }
    return best;
  }
  // lowest slab underside above the head (or Infinity)
  ceilingY(x, z, headY) {
    const ix = Math.floor(x), iz = Math.floor(z);
    if (ix < 0 || iz < 0 || ix >= this.W || iz >= this.D) return Infinity;
    let best = Infinity;
    for (let lvl = 0; lvl <= this.floors * STOREY; lvl += STOREY) {
      const p = this.fy[this.ixY(ix, lvl, iz)], under = lvl - SLAB_T;
      if (p && !p.dead && under >= headY - 0.01 && under < best) best = under;
    }
    return best;
  }

  // ---------------------------------------------------------------- navigation helpers
  floorBase(f) { return f * STOREY; }
  // is there walkable floor under cell (ix, iz) at storey f?
  hasFloor(ix, iz, f) {
    if (ix < 0 || iz < 0 || ix >= this.W || iz >= this.D) return false;
    const p = this.fy[this.ixY(ix, f * STOREY, iz)];
    return !!(p && !p.dead);
  }
  // walkable step between neighbouring cells on one storey:
  //   0 blocked, 1 open, 2 through a closed door, 3 vault over a window sill
  edge(ix, iz, nx, nz, f) {
    const y = f * STOREY;
    let lo, mid, top;
    if (nx !== ix) { const face = Math.max(ix, nx); lo = this.getX(face, y, iz); mid = this.getX(face, y + 1, iz); top = this.getX(face, y + 2, iz); }
    else { const face = Math.max(iz, nz); lo = this.getZ(ix, y, face); mid = this.getZ(ix, y + 1, face); top = this.getZ(ix, y + 2, face); }
    const sl = lo && lo.solid, sm = mid && mid.solid;
    if (!sl && !sm) return 1;
    const d = (lo && lo.door) || (mid && mid.door);
    if (d && sl === sm) return d.barricade > 0 ? 0 : 2;
    // window: solid sill below, nothing in the mid row (glass broken, no boards), and a lintel above
    if (sl && !sm && !(lo.door) && top) return 3;
    return 0;
  }
}

// ray vs axis-aligned box: entry distance, or null (misses, behind, or origin inside)
export function rayBox(ox, oy, oz, dx, dy, dz, min, max) {
  let tmin = -Infinity, tmax = Infinity;
  const o = [ox, oy, oz], d = [dx, dy, dz];
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-12) { if (o[k] < min[k] || o[k] > max[k]) return null; continue; }
    let t1 = (min[k] - o[k]) / d[k], t2 = (max[k] - o[k]) / d[k];
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return tmax < 0 || tmin < 0 ? null : tmin;
}

// push a circle (pos[0], pos[2]) out of a rectangle; returns true if it moved
function circleBox(pos, r, x0, x1, z0, z1) {
  const cx = Math.max(x0, Math.min(pos[0], x1)), cz = Math.max(z0, Math.min(pos[2], z1));
  let dx = pos[0] - cx, dz = pos[2] - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return false;
  if (d2 < 1e-10) { // centre inside: leave through the nearest side
    const l = pos[0] - x0, rr = x1 - pos[0], b = pos[2] - z0, t = z1 - pos[2], m = Math.min(l, rr, b, t);
    if (m === l) pos[0] = x0 - r; else if (m === rr) pos[0] = x1 + r; else if (m === b) pos[2] = z0 - r; else pos[2] = z1 + r;
    return true;
  }
  const d = Math.sqrt(d2), push = (r - d) / d;
  pos[0] += dx * push; pos[2] += dz * push;
  return true;
}
