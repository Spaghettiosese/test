// Tiny drawing targets so the same pixel-art code runs in the browser (canvas)
// and in Node (RGBA buffer -> PNG export, tests).
export function parseColor(c) {
  const h = c.replace('#', '');
  const n = parseInt(h, 16);
  if (h.length === 8) return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export class CanvasSurface {
  constructor(ctx) { this.ctx = ctx; }
  rect(x, y, w, h, c) { this.ctx.fillStyle = c; this.ctx.fillRect(x, y, w, h); }
}

export class BufferSurface {
  constructor(w, h) { this.w = w; this.h = h; this.data = new Uint8ClampedArray(w * h * 4); }
  rect(x, y, w, h, c) {
    const [r, g, b, a] = parseColor(c);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
        const o = (j * this.w + i) * 4;
        if (a === 255) { this.data[o] = r; this.data[o + 1] = g; this.data[o + 2] = b; this.data[o + 3] = 255; }
        else {
          const k = a / 255, da = this.data[o + 3] / 255, oa = k + da * (1 - k);
          for (let q = 0; q < 3; q++) this.data[o + q] = ([r, g, b][q] * k + this.data[o + q] * da * (1 - k)) / (oa || 1);
          this.data[o + 3] = oa * 255;
        }
      }
  }
  opaquePixels() { let n = 0; for (let i = 3; i < this.data.length; i += 4) if (this.data[i]) n++; return n; }
}

export class MirrorSurface {
  constructor(base, width) { this.base = base; this.width = width; }
  rect(x, y, w, h, c) { this.base.rect(this.width - x - w, y, w, h, c); }
}
