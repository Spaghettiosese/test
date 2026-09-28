// The house: tile grid, furniture (with chore stations) and collision.
export const TILE = 16, W = 20, H = 14;

const region = (x, y) => {
  if (y >= 1 && y <= 6) return x <= 7 ? 'k' : x <= 13 ? 'w' : 'b';
  if (y >= 8 && y <= 12) return x <= 9 ? 'w' : 's';
  return null;
};
const DOORS = [[3, 7], [10, 7], [16, 7], [7, 4], [13, 4], [9, 10]];

export function buildGrid() {
  const g = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) row.push(region(x, y) || '#');
    g.push(row);
  }
  for (const [x, y] of DOORS) g[y][x] = 'd';
  return g;
}
export const GRID = buildGrid();
export const isWall = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || GRID[ty][tx] === '#';

// footprint (x,y,w,h in tiles); sprite is bottom-left aligned to the footprint.
// interact: { kind:'chore', id } or { kind:'simple', id }
export const OBJECTS = [
  // kitchen
  { id: 'fridge', spr: 'fridge', x: 1, y: 1, w: 1, h: 1 },
  { id: 'sink', spr: 'sink', x: 2, y: 1, w: 2, h: 1, interact: { kind: 'chore', id: 'dishes', label: 'Wash dishes' } },
  { id: 'stove', spr: 'stove', x: 4, y: 1, w: 2, h: 1, interact: { kind: 'simple', id: 'tea', label: 'Make tea' } },
  { id: 'kmat', spr: 'rug_small', x: 3, y: 3, w: 2, h: 2, flat: true },
  { id: 'table', spr: 'table', x: 3, y: 4, w: 2, h: 2 },
  { id: 'chair1', spr: 'chair', x: 2, y: 5, w: 1, h: 1, solid: false },
  { id: 'chair2', spr: 'chair', x: 5, y: 5, w: 1, h: 1, solid: false },
  { id: 'bowl', spr: 'bowl_empty', x: 6, y: 5, w: 1, h: 1, solid: false, interact: { kind: 'chore', id: 'feed', label: 'Feed Mochi' } },
  // living room
  { id: 'shelf', spr: 'bookshelf', x: 8, y: 1, w: 1, h: 1, interact: { kind: 'simple', id: 'read', label: 'Read a book' } },
  { id: 'sofa', spr: 'sofa', x: 9, y: 1, w: 3, h: 2, interact: { kind: 'simple', id: 'rest', label: 'Sit down' }, fp: [9, 1, 3, 1.75] },
  { id: 'lrug', spr: 'rug_big', x: 9, y: 4, w: 3, h: 2, flat: true },
  { id: 'broom', spr: 'broomstand', x: 12, y: 1, w: 1, h: 1, interact: { kind: 'chore', id: 'sweep', label: 'Sweep the floor' } },
  // laundry / bath
  { id: 'washer', spr: 'washer', x: 14, y: 1, w: 1, h: 1, interact: { kind: 'chore', id: 'laundry', label: 'Fold laundry' } },
  { id: 'tub', spr: 'tub', x: 16, y: 1, w: 2, h: 1 },
  { id: 'basket', spr: 'basket', x: 18, y: 3, w: 1, h: 1, interact: { kind: 'chore', id: 'laundry', label: 'Fold laundry' } },
  { id: 'bathmat', spr: 'mat', x: 16, y: 3, w: 1, h: 1, flat: true },
  // bedroom
  { id: 'bed', spr: 'bed', x: 1, y: 9, w: 2, h: 3, interact: { kind: 'simple', id: 'sleep', label: 'Go to sleep' } },
  { id: 'desk', spr: 'desk', x: 5, y: 8, w: 2, h: 1, interact: { kind: 'simple', id: 'desk', label: 'Write in diary' } },
  { id: 'brug', spr: 'rug_small', x: 4, y: 10, w: 2, h: 2, flat: true },
  { id: 'cushion', spr: 'cushion', x: 7, y: 11, w: 1, h: 1, flat: true },
  // sunroom
  { id: 'pot1', spr: 'pot_wilt', x: 11, y: 8, w: 1, h: 1, interact: { kind: 'chore', id: 'plants', label: 'Water plants' } },
  { id: 'pot2', spr: 'pot_wilt', x: 13, y: 8, w: 1, h: 1, interact: { kind: 'chore', id: 'plants', label: 'Water plants' } },
  { id: 'pot3', spr: 'pot_wilt', x: 15, y: 8, w: 1, h: 1, interact: { kind: 'chore', id: 'plants', label: 'Water plants' } },
  { id: 'pot4', spr: 'pot_wilt', x: 17, y: 8, w: 1, h: 1, interact: { kind: 'chore', id: 'plants', label: 'Water plants' } },
  { id: 'door', spr: 'door', x: 14, y: 13, w: 1, h: 1, wallDecor: true },
];

// Unlockable decor from parcels; each has a home in the house.
export const DECOR = {
  poster: { spr: 'poster', x: 5, y: 7, w: 1, h: 1, wallDecor: true, name: 'a sky poster' },
  cactus: { spr: 'cactus', x: 6, y: 8, w: 1, h: 1, solid: false, dy: -12, name: 'a tiny cactus' },
  lamp: { spr: 'lamp', x: 18, y: 11, w: 1, h: 1, name: 'a floor lamp' },
  plushie: { spr: 'plushie', x: 2, y: 9, w: 1, h: 1, solid: false, dy: 2, name: 'a plushie' },
  bunting: { spr: 'bunting', x: 8, y: 0, w: 4, h: 1, wallDecor: true, dy: 2, name: 'party bunting' },
  window2: { spr: 'window', x: 14, y: 0, w: 1, h: 1, wallDecor: true, name: 'a new window' },
};
export const WINDOWS = [[3, 0], [10, 0], [16, 0]];

export const footprint = (o) => {
  if (o.fp) return o.fp.map((v) => v * TILE);
  return [o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE];
};

export function solidRects(decor = []) {
  const list = OBJECTS.filter((o) => o.solid !== false && !o.flat && !o.wallDecor);
  for (const d of decor) if (DECOR[d] && DECOR[d].solid !== false && !DECOR[d].wallDecor) list.push(DECOR[d]);
  return list.map(footprint);
}

const hit = (ax, ay, aw, ah, r) => ax < r[0] + r[2] && ax + aw > r[0] && ay < r[1] + r[3] && ay + ah > r[1];

// Is a box at (x,y,w,h) in pixels blocked by walls or furniture?
export function blocked(x, y, w, h, rects) {
  const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.01) / TILE);
  const y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isWall(tx, ty)) return true;
  return rects.some((r) => hit(x, y, w, h, r));
}

// Move a feet-box (centered at x, bottom at y) with axis-separated sliding.
export function moveBody(b, dx, dy, rects, w = 8, h = 5) {
  if (!blocked(b.x + dx - w / 2, b.y - h, w, h, rects)) b.x += dx;
  if (!blocked(b.x - w / 2, b.y + dy - h, w, h, rects)) b.y += dy;
}

export const distToRect = (px, py, r) => {
  const cx = Math.max(r[0], Math.min(px, r[0] + r[2])), cy = Math.max(r[1], Math.min(py, r[1] + r[3]));
  return Math.hypot(px - cx, py - cy);
};

export const interactables = () => OBJECTS.filter((o) => o.interact);
export const REACH = 13;
export function nearestInteract(px, py) {
  let best = null, bd = REACH;
  for (const o of interactables()) {
    const d = distToRect(px, py, footprint(o));
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

export const SPAWN = { x: 4.5 * TILE, y: 10 * TILE };
export const CAT_SPAWN = { x: 7.5 * TILE, y: 11.9 * TILE };
export const CUSHION = { x: 7.5 * TILE, y: 11.9 * TILE };
export const DOOR_STEP = { x: 14.5 * TILE, y: 12.4 * TILE };
export const SOFA_SPOT = { x: 10.5 * TILE, y: 3.7 * TILE };
export const DUST_SPOTS = [[9, 4], [11, 5], [10, 3], [12, 4], [8, 5], [9, 6], [11, 2]];

// Walkable-tile BFS (used by tests to prove every chore station can be reached).
export function reachableTiles(decor = []) {
  const rects = solidRects(decor);
  const free = (tx, ty) => !blocked(tx * TILE + 4, ty * TILE + 8, 8, 5, rects) && !isWall(tx, ty);
  const sx = Math.floor(SPAWN.x / TILE), sy = Math.floor((SPAWN.y - 1) / TILE);
  const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (!seen.has(k) && free(nx, ny)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}
