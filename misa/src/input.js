export const blankInput = () => ({ mx: 0, my: 0, moved: false, down: false, justDown: false, keys: new Set(), pressed: new Set() });
export const axis = (i) => {
  const k = i.keys;
  return {
    x: (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0),
    y: (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0),
  };
};
export const act = (i) => i.pressed.has(' ') || i.pressed.has('e') || i.pressed.has('enter') || i.justDown;
export const actHeld = (i) => i.keys.has(' ') || i.keys.has('e') || i.down;

// A pointer that can be driven by the mouse or the keyboard (arrows/WASD).
export class Cursor {
  constructor(x, y, speed = 120, bounds = [0, 0, 320, 224]) {
    Object.assign(this, { x, y, speed, vx: 0, vy: 0, bounds });
  }
  update(dt, i) {
    const px = this.x, py = this.y, a = axis(i);
    if (a.x || a.y) {
      const n = Math.hypot(a.x, a.y);
      this.x += (a.x / n) * this.speed * dt; this.y += (a.y / n) * this.speed * dt;
    } else if (i.moved || i.down) { this.x = i.mx; this.y = i.my; }
    const [x0, y0, x1, y1] = this.bounds;
    this.x = Math.max(x0, Math.min(x1, this.x)); this.y = Math.max(y0, Math.min(y1, this.y));
    this.vx = dt > 0 ? (this.x - px) / dt : 0; this.vy = dt > 0 ? (this.y - py) / dt : 0;
    return this;
  }
  get speedNow() { return Math.hypot(this.vx, this.vy); }
}
