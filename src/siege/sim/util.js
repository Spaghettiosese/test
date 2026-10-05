// Small vector and shape helpers shared by the simulation. Plain arrays, no allocation tricks.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const wrapAngle = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };
export const angleDiff = (a, b) => wrapAngle(b - a);
export const approachAngle = (a, b, step) => { const d = wrapAngle(b - a); return Math.abs(d) <= step ? b : a + Math.sign(d) * step; };
// forward direction for yaw/pitch: yaw 0 looks along +z, +yaw turns toward +x; +pitch looks up
export const dirOf = (yaw, pitch) => { const cp = Math.cos(pitch); return [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp]; };
export const yawOf = (dx, dz) => Math.atan2(dx, dz);
export const pitchOf = (dx, dy, dz) => Math.atan2(dy, Math.hypot(dx, dz));

// seeded random so matches can be replayed (mulberry32)
export function rng(seed = 1) {
  let s = seed >>> 0;
  const f = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.int = (n) => Math.floor(f() * n);
  f.gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += f(); return (u - 2) / 0.58; };
  return f;
}

// ray vs sphere: entry distance or null
export function raySphere(o, d, c, r) {
  const ox = o[0] - c[0], oy = o[1] - c[1], oz = o[2] - c[2];
  const b = ox * d[0] + oy * d[1] + oz * d[2], cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t >= 0) return t;
  const t2 = -b + Math.sqrt(disc);
  return t2 >= 0 ? 0 : null; // inside
}
// ray vs vertical capsule (axis from (x, y0, z) to (x, y1, z), radius r): entry distance or null
export function rayVCapsule(o, d, x, z, y0, y1, r) {
  // infinite cylinder in xz
  const ox = o[0] - x, oz = o[2] - z;
  const a = d[0] * d[0] + d[2] * d[2];
  let best = null;
  if (a > 1e-9) {
    const b = ox * d[0] + oz * d[2], c = ox * ox + oz * oz - r * r, disc = b * b - a * c;
    if (disc >= 0) {
      const t = (-b - Math.sqrt(disc)) / a;
      if (t >= 0) { const y = o[1] + d[1] * t; if (y >= y0 && y <= y1) best = t; }
    }
  }
  for (const cy of [y0, y1]) { const t = raySphere(o, d, [x, cy, z], r); if (t !== null && (best === null || t < best)) best = t; }
  return best;
}
// closest distance from point p to segment a-b
export function distToSegment(p, a, b) {
  const ab = sub(b, a), ap = sub(p, a), l2 = dot(ab, ab) || 1e-9, t = clamp(dot(ap, ab) / l2, 0, 1);
  return len(sub(p, add(a, scl(ab, t))));
}
// min-heap keyed by float priority (used by A*)
export class Heap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  clear() { this.k.length = 0; this.v.length = 0; }
  push(key, val) {
    let i = this.k.length; this.k.push(key); this.v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (this.k[p] <= key) break; this.k[i] = this.k[p]; this.v[i] = this.v[p]; i = p; }
    this.k[i] = key; this.v[i] = val;
  }
  pop() {
    const n = this.k.length; if (!n) return -1;
    const top = this.v[0], lk = this.k.pop(), lv = this.v.pop();
    if (n > 1) {
      let i = 0; const m = n - 1;
      for (;;) { let c = 2 * i + 1; if (c >= m) break; if (c + 1 < m && this.k[c + 1] < this.k[c]) c++; if (this.k[c] >= lk) break; this.k[i] = this.k[c]; this.v[i] = this.v[c]; i = c; }
      this.k[i] = lk; this.v[i] = lv;
    }
    return top;
  }
}
