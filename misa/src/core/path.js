// A* on a tile grid (4-neighbour) with a binary heap. passable(tx, ty) -> bool. The goal tile may be solid
// (walking up to a counter). Returns [[tx,ty], ...] excluding the start, or null.
export function findPath(passable, sx, sy, gx, gy, maxNodes = 6000) {
  if (sx === gx && sy === gy) return [];
  const K = (x, y) => (x + 1) * 8192 + (y + 1);
  const g = new Map([[K(sx, sy), 0]]), from = new Map(), closed = new Set();
  const heap = [[Math.abs(gx - sx) + Math.abs(gy - sy), sx, sy]];
  const push = (n) => { heap.push(n); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let n = 0;
  while (heap.length && n++ < maxNodes) {
    const [, x, y] = pop(), k = K(x, y);
    if (closed.has(k)) continue;
    if (x === gx && y === gy) {
      const out = []; let c = k;
      while (from.has(c)) { out.push([Math.floor(c / 8192) - 1, (c % 8192) - 1]); c = from.get(c); }
      return out.reverse();
    }
    closed.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = K(nx, ny);
      if (closed.has(nk) || !((nx === gx && ny === gy) || passable(nx, ny))) continue;
      const ng = g.get(k) + 1;
      if (ng < (g.get(nk) ?? Infinity)) { from.set(nk, k); g.set(nk, ng); push([ng + Math.abs(gx - nx) + Math.abs(gy - ny), nx, ny]); }
    }
  }
  return null;
}
