// A tiny cutscene runner. A cutscene is a generator: it sets up camera shots (from -> to, with
// values that may be functions so the camera can follow actors), registers tweens that
// animate the actors, shows captions and title cards, and yields how many seconds to wait.
// The game keeps simulating while a cutscene plays; skipping fast-forwards to the end state.
const $ = (id) => document.getElementById(id);
const val = (v) => (typeof v === 'function' ? v() : v);
const ease = { linear: (k) => k, inOut: (k) => k * k * (3 - 2 * k), out: (k) => 1 - (1 - k) * (1 - k), in: (k) => k * k };

export class Cutscene {
  constructor() { this.active = false; this.cam = null; this.tweens = []; this.gen = null; this.wait = 0; this.onEnd = null; this.time = 0; this.result = { pos: [0, 2, 0], target: [0, 1, 1] }; }
  start(genFn, onEnd) {
    this.active = true; this.gen = genFn(this); this.wait = 0; this.onEnd = onEnd; this.tweens = []; this.cam = null; this.time = 0;
    document.body.classList.add('cutscene'); $('skip')?.removeAttribute('hidden');
  }
  // a and b: { pos, look } (each a vector or a function returning one)
  shot(a, b, dur, e = 'inOut') { this.cam = { a, b: b || a, t: 0, d: Math.max(0.01, dur), e }; }
  tween(dur, fn, e = 'linear') { this.tweens.push({ t: 0, d: Math.max(0.001, dur), fn, e }); }
  caption(who, text) { const el = $('subtitle'); if (!el) return; if (!text) { el.hidden = true; return; } el.hidden = false; el.innerHTML = ''; const w = document.createElement('b'); w.textContent = who; el.append(w, document.createTextNode(' ' + text)); }
  title(main, sub = '') { const el = $('titlecard'); if (!el) return; if (!main) { el.hidden = true; return; } el.hidden = false; el.innerHTML = ''; const h = document.createElement('h2'); h.textContent = main; const p = document.createElement('p'); p.textContent = sub; el.append(h, p); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  update(dt) {
    if (!this.active) return;
    this.time += dt;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.d); tw.fn(ease[tw.e](k), dt);
      if (k >= 1) this.tweens.splice(i, 1);
    }
    if (this.cam) { this.cam.t = Math.min(this.cam.d, this.cam.t + dt); this._solve(); }
    this.wait -= dt;
    while (this.wait <= 0 && this.gen) {
      const r = this.gen.next();
      if (r.done) { this._finish(); return; }
      this.wait = r.value ?? 0;
    }
  }
  _solve() {
    const c = this.cam, k = ease[c.e](c.t / c.d);
    const pa = val(c.a.pos), pb = val(c.b.pos), la = val(c.a.look), lb = val(c.b.look);
    this.result.pos = pa.map((v, i) => v + (pb[i] - v) * k); this.result.target = la.map((v, i) => v + (lb[i] - v) * k);
  }
  skip() {
    if (!this.active) return;
    for (let n = 0; n < 400 && this.gen; n++) { // run the script to its end without waiting
      for (const tw of this.tweens) tw.fn(1, 0); this.tweens = [];
      const r = this.gen.next(); if (r.done) break;
    }
    for (const tw of this.tweens) tw.fn(1, 0);
    this._finish();
  }
  _finish() {
    this.active = false; this.gen = null; this.cam = null; this.tweens = [];
    this.caption(); this.title();
    document.body.classList.remove('cutscene'); $('skip')?.setAttribute('hidden', '');
    const f = this.onEnd; this.onEnd = null; f?.();
  }
}
