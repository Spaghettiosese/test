// The game clock. One game hour lasts `hourSeconds` real seconds; the demo starts at dusk.
export class Clock {
  constructor(start = 19.3, hourSeconds = 150) { this.hours = start; this.hourSeconds = hourSeconds; this.paused = false; this.day = 0; this.speed = 1; }
  update(dt) { if (this.paused) return; const h = this.hours + (dt * this.speed) / this.hourSeconds; if (h >= 24) this.day++; this.hours = h % 24; }
  get h() { return this.hours; }
  // is the current hour inside [a, b) (wrapping over midnight)?
  between(a, b) { const h = this.hours; return a <= b ? h >= a && h < b : h >= a || h < b; }
  get night() { return this.between(20.5, 5.5); }
  text() { const h = Math.floor(this.hours), m = Math.floor((this.hours - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
  // "the bell" names for HUD flavour
  phase() { const h = this.hours; return h < 5.5 ? 'Dead of night' : h < 8 ? 'Dawn' : h < 17 ? 'Day' : h < 20 ? 'Dusk' : h < 23 ? 'Night' : 'Witching hour'; }
}
