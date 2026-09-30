// Weather: clear, overcast, fog, rain, thunderstorms and ashfall. It changes how far you can see,
// how loud you are, how guards see, and puts out exposed torches in the wet.
const KINDS = {
  clear: { label: 'Clear', sun: 1, fog: 0, exp: 1, rain: 0, noise: 1, sight: 1 },
  overcast: { label: 'Overcast', sun: 0.55, fog: 0.003, exp: 0.95, rain: 0, noise: 1, sight: 0.95 },
  fog: { label: 'Fog', sun: 0.45, fog: 0.028, exp: 0.95, rain: 0, noise: 0.9, sight: 0.6 },
  rain: { label: 'Rain', sun: 0.4, fog: 0.007, exp: 0.92, rain: 1, noise: 0.72, sight: 0.8 },
  storm: { label: 'Thunderstorm', sun: 0.25, fog: 0.012, exp: 0.86, rain: 2, noise: 0.55, sight: 0.7 },
  ash: { label: 'Ashfall', sun: 0.6, fog: 0.008, exp: 0.97, rain: 0, noise: 0.95, sight: 0.85 },
};

export class Weather {
  constructor(g) {
    this.g = g; this.kind = 'clear'; this.target = 'clear'; this.k = 1; this.cur = { ...KINDS.clear }; this.next = 240 + Math.random() * 200; this.flash = 0; this.strike = 0; this.thunderQ = []; this.torchT = 0; this.label = 'Clear';
    this.noiseMul = 1; this.sightMul = 1;
  }
  set(kind) { if (!KINDS[kind] || kind === this.target) return; this.target = kind; this.k = 0; this.from = { ...this.cur }; this.g.ui.toast(KINDS[kind].label + ' rolls in'); }
  pick() {
    const night = this.g.clock.night, r = Math.random(), z = this.g.story?.zone;
    if (z === 'fen') return r < 0.5 ? 'fog' : r < 0.8 ? 'rain' : 'overcast';
    if (z === 'cinder') return r < 0.45 ? 'ash' : r < 0.7 ? 'overcast' : 'fog';
    if (night) return r < 0.28 ? 'clear' : r < 0.5 ? 'overcast' : r < 0.72 ? 'rain' : r < 0.86 ? 'storm' : 'fog';
    return r < 0.4 ? 'clear' : r < 0.65 ? 'overcast' : r < 0.82 ? 'rain' : r < 0.92 ? 'fog' : 'storm';
  }
  update(dt) {
    const g = this.g;
    this.next -= dt; if (this.next <= 0) { this.next = 260 + Math.random() * 380; this.set(this.pick()); }
    if (this.k < 1) {
      this.k = Math.min(1, this.k + dt / 22);
      const a = this.from || KINDS.clear, b = KINDS[this.target], e = this.k;
      for (const key of ['sun', 'fog', 'exp', 'rain', 'noise', 'sight']) this.cur[key] = a[key] + (b[key] - a[key]) * e;
      if (this.k >= 1) { this.kind = this.target; this.label = b.label; }
    }
    this.noiseMul = this.cur.noise; this.sightMul = this.cur.sight;
    const P = g.player, c = g.mode === 'play' || g.mode === 'talk' ? P.pos : g.camera.position, ind = g.indoorK;
    g.sfx.mood.rain = this.cur.rain > 0.05 ? Math.min(1, this.cur.rain) : 0;
    // rain: fast small streaks around the camera
    if (this.cur.rain > 0.05 && ind < 0.6) {
      const n = dt * (220 * this.cur.rain) * (1 - ind);
      for (let i = 0; i < n + Math.random(); i++) g.sparks.emit([c[0] + (Math.random() - 0.5) * 26, c[1] + 7 + Math.random() * 4, c[2] + (Math.random() - 0.5) * 26], { count: 1, color: [0.7, 0.8, 1.0, 0.55], colorEnd: [0.5, 0.6, 0.8, 0.0], size: 0.025, grow: 0, spread: 0, up: 0, life: 0.55, jitter: 0, vel: [0.6, -24, 0.3] });
    }
    if (this.kind === 'ash' || this.target === 'ash') { /* the town ash already drifts; thicken it */ if (g.indoorK < 0.6 && Math.random() < dt * 40) g.smoke.emit([c[0] + (Math.random() - 0.5) * 18, c[1] + 3 + Math.random() * 3, c[2] + (Math.random() - 0.5) * 18], { count: 1, color: [0.3, 0.28, 0.28, 0.6], colorEnd: [0.25, 0.22, 0.22, 0], size: 0.05, grow: 0.5, spread: 0.1, up: -0.6, life: 4, jitter: 0, vel: [0.6, -0.7, 0.3] }); }
    // fireflies in the wet woods, night only
    const z = g.story?.zone;
    if ((z === 'mire' || z === 'fen' || z === 'farms') && g.clock.night && ind < 0.5 && this.cur.rain < 0.5 && Math.random() < dt * 5) g.sparks.emit([c[0] + (Math.random() - 0.5) * 24, c[1] - 0.6 + Math.random() * 2.2, c[2] + (Math.random() - 0.5) * 24], { count: 1, color: [1.2, 2.2, 0.5, 0.9], colorEnd: [0.4, 1.0, 0.2, 0], size: 0.05, grow: 0, spread: 0.2, up: 0.1, life: 3, jitter: 0.6, vel: [0.1, 0.05, 0.1] });
    // lightning
    if (this.target === 'storm' && this.k >= 0.4) {
      this.strike -= dt;
      if (this.strike <= 0) { this.strike = 5 + Math.random() * 12; this.flash = 1; this.thunderQ.push(0.4 + Math.random() * 2.4); }
    }
    this.flash = Math.max(0, this.flash - dt * 2.8);
    for (let i = this.thunderQ.length - 1; i >= 0; i--) { this.thunderQ[i] -= dt; if (this.thunderQ[i] <= 0) { this.thunderQ.splice(i, 1); g.sfx.thunder?.(ind > 0.6 ? 2.5 : 1); if (Math.random() < 0.3) g.shake = Math.max(g.shake || 0, 0.02); } }
    // the wet puts out exposed torches
    if (this.cur.rain > 0.5) {
      this.torchT -= dt;
      if (this.torchT <= 0) {
        this.torchT = 3.5 / this.cur.rain;
        const cand = g.level.torches.filter((t) => t.lit && !t.small && t.kind !== 'chandelier' && g.nav.indoorAt(t.x, t.z) === 0 && Math.hypot(t.x - c[0], t.z - c[2]) < 90);
        if (cand.length && Math.random() < 0.5) { const t = cand[Math.floor(Math.random() * cand.length)]; t.lit = false; t.wasLit = true; t.light.intensity = 0; if (t.flame) t.flame.visible = false; if (t.flames) for (const f of t.flames) f.visible = false; g.emitBurst([t.x, t.y, t.z], 'poof'); }
      }
    }
  }
  apply(env) {
    const c = this.cur;
    env.sunIntensity *= c.sun; env.exposure *= c.exp; env.fogDensity += c.fog; env.godRays *= c.sun;
    if (c.fog > 0.01) env.fogHeight = Math.max(env.fogHeight, 0.4);
    if (this.flash > 0) { env.exposure *= 1 + this.flash * 1.8; env.ambient = Math.max(env.ambient, 0.9 * this.flash); }
  }
  save() { return { kind: this.target }; }
  load(d) { if (d?.kind && KINDS[d.kind]) { this.kind = this.target = d.kind; this.cur = { ...KINDS[d.kind] }; this.k = 1; this.label = KINDS[d.kind].label; } }
}
