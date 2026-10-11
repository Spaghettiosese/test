// Procedural Web Audio: gunfire from filtered noise, ability whooshes, UI blips, a wind bed.
// Nothing is loaded. 3D sounds are panned and attenuated against the player's position.
export class Sfx {
  constructor() { this.ctx = null; this.volume = 0.6; this.listener = { pos: [0, 0, 0], yaw: 0 }; this.muted = false; }
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume;
      // a low-pass on the whole mix muffles the world when the player is nearly dead
      this.lp = this.ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; this.master.connect(this.lp);
      // the mix bus: a gentle compressor glues everything, a limiter stops stacked shots from clipping
      const c = this.ctx, comp = c.createDynamicsCompressor(), lim = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15; comp.knee.value = 6;
      lim.threshold.value = -1; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08; lim.knee.value = 0;
      this.lp.connect(comp); comp.connect(lim); lim.connect(c.destination);
      this.musicIn = c.createGain(); this.musicIn.connect(this.lp);
      const len = this.ctx.sampleRate * 2; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startWind();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = this.muted ? 0 : v; }
  startWind() {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.05; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
  }
  _out(pos, base = 1, ref = 14) {
    // returns { gain, pan } for a world position relative to the listener
    if (!pos) return { gain: base, pan: 0 };
    const L = this.listener, dx = pos[0] - L.pos[0], dz = pos[2] - L.pos[2], dy = (pos[1] || 0) - L.pos[1];
    const d = Math.hypot(dx, dy, dz), gain = base * Math.min(1, ref / Math.max(ref * 0.6, d)) ** 1.4 * (d > 90 ? 0 : 1);
    const right = [-Math.cos(L.yaw), Math.sin(L.yaw)], pan = d < 0.5 ? 0 : Math.max(-1, Math.min(1, (dx * right[0] + dz * right[1]) / d));
    // distance takes the top end off: far gunfire sounds far
    return { gain, pan, lp: 18000 * Math.exp(-d / 35) };
  }
  _noise(t0, { dur = 0.3, gain = 1, type = 'lowpass', freq = 1200, q = 0.7, attack = 0.002, decay = 0.2, pan = 0, freqEnd = null, o = null }) {
    if (o && o.gain < 0.01) return;
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(), cap = o?.lp && type !== 'highpass' ? o.lp : 1e5; f.type = type; f.frequency.setValueAtTime(Math.min(freq, cap), t0); if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, Math.min(freqEnd, cap)), t0 + dur); f.Q.value = q;
    const g = c.createGain(), og = o ? o.gain : 1; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * og), t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    src.connect(f); f.connect(g);
    if (p) { p.pan.value = o ? o.pan : pan; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    src.start(t0, Math.random() * 0.8, dur + 0.05);
  }
  _tone(t0, { freq = 800, dur = 1, gain = 0.3, type = 'sine', decay = 0.8, freqEnd = null, attack = 0.004, o = null }) {
    if (o && o.gain < 0.01) return;
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain(), og = o ? o.gain : 1;
    osc.type = type; osc.frequency.setValueAtTime(freq, t0); if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * og), t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    const p = c.createStereoPanner ? c.createStereoPanner() : null; osc.connect(g);
    if (p) { p.pan.value = o ? o.pan : 0; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    osc.start(t0); osc.stop(t0 + decay + 0.05);
  }
  shot(kind, pos, own = false) {
    if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, own ? 1 : 0.8);
    const N = (p) => this._noise(t, { ...p, o }), T = (p) => this._tone(t, { ...p, o });
    switch (kind) {
      case 'pulse': N({ dur: 0.12, gain: 0.45, freq: 2600, freqEnd: 700, decay: 0.09 }); T({ freq: 260, freqEnd: 90, dur: 0.09, gain: 0.3, decay: 0.09, type: 'square' }); break;
      case 'rifle': N({ dur: 0.2, gain: 0.7, freq: 3400, freqEnd: 650, decay: 0.13 }); N({ dur: 0.3, gain: 0.35, freq: 300, decay: 0.2 }); T({ freq: 150, freqEnd: 55, dur: 0.1, gain: 0.4, decay: 0.1 }); break;
      case 'shotgun': N({ dur: 0.4, gain: 1, freq: 3000, freqEnd: 350, decay: 0.3 }); N({ dur: 0.6, gain: 0.7, freq: 240, decay: 0.5 }); T({ freq: 110, freqEnd: 38, dur: 0.22, gain: 0.7, decay: 0.25 }); break;
      case 'pistol': N({ dur: 0.1, gain: 0.45, freq: 4200, freqEnd: 900, decay: 0.07 }); T({ freq: 520, freqEnd: 180, dur: 0.07, gain: 0.2, decay: 0.07 }); break;
      case 'rail': N({ dur: 0.35, gain: 0.8, freq: 5200, freqEnd: 500, decay: 0.22 }); T({ freq: 1400, freqEnd: 120, dur: 0.3, gain: 0.5, decay: 0.32, type: 'sawtooth' }); T({ freq: 90, freqEnd: 40, dur: 0.3, gain: 0.7, decay: 0.3 }); break;
      case 'lance': N({ dur: 0.9, gain: 1, freq: 6000, freqEnd: 300, decay: 0.7 }); T({ freq: 2000, freqEnd: 60, dur: 0.8, gain: 0.7, decay: 0.8, type: 'sawtooth' }); T({ freq: 70, freqEnd: 30, dur: 0.8, gain: 0.9, decay: 0.8 }); break;
      case 'fire': N({ dur: 0.3, gain: 0.55, type: 'bandpass', freq: 900, freqEnd: 300, decay: 0.25, q: 0.8 }); T({ freq: 200, freqEnd: 80, dur: 0.2, gain: 0.3, decay: 0.2 }); break;
      case 'orbit': T({ freq: 700, freqEnd: 120, dur: 0.25, gain: 0.35, decay: 0.28, type: 'triangle' }); N({ dur: 0.2, gain: 0.25, freq: 800, decay: 0.2, type: 'bandpass' }); break;
      case 'rocket': N({ dur: 0.45, gain: 0.5, type: 'bandpass', freq: 1500, freqEnd: 300, decay: 0.4 }); T({ freq: 400, freqEnd: 150, dur: 0.3, gain: 0.25, decay: 0.3, type: 'sawtooth' }); break;
      case 'burst': N({ dur: 0.35, gain: 0.8, freq: 1800, freqEnd: 200, decay: 0.3 }); T({ freq: 140, freqEnd: 40, dur: 0.3, gain: 0.6, decay: 0.3 }); break;
      case 'punch': N({ dur: 0.18, gain: 0.9, freq: 500, freqEnd: 120, decay: 0.16 }); T({ freq: 90, freqEnd: 35, dur: 0.16, gain: 0.8, decay: 0.18 }); break;
      case 'minigun': N({ dur: 0.07, gain: 0.5, freq: 3000, freqEnd: 900, decay: 0.05 }); T({ freq: 190, freqEnd: 100, dur: 0.05, gain: 0.35, decay: 0.05, type: 'square' }); break;
      case 'cannon': N({ dur: 0.35, gain: 0.9, freq: 1600, freqEnd: 200, decay: 0.3 }); T({ freq: 120, freqEnd: 35, dur: 0.3, gain: 0.8, decay: 0.32 }); break;
      case 'smg': N({ dur: 0.08, gain: 0.32, freq: 5200, freqEnd: 1400, decay: 0.05 }); T({ freq: 380, freqEnd: 160, dur: 0.05, gain: 0.14, decay: 0.05 }); break;
      case 'rifle2': N({ dur: 0.4, gain: 0.85, freq: 3800, freqEnd: 500, decay: 0.28 }); N({ dur: 0.5, gain: 0.4, freq: 260, decay: 0.4 }); T({ freq: 120, freqEnd: 45, dur: 0.2, gain: 0.55, decay: 0.2 }); break;
      case 'beam': N({ dur: 0.06, gain: 0.16, type: 'bandpass', freq: 2400, freqEnd: 2000, decay: 0.05, q: 2 }); T({ freq: 520, freqEnd: 500, dur: 0.05, gain: 0.06, decay: 0.06, type: 'sine' }); break;
      case 'sentry': N({ dur: 0.08, gain: 0.3, freq: 3500, freqEnd: 900, decay: 0.06 }); break;
      default: N({ dur: 0.15, gain: 0.5, freq: 3000, freqEnd: 800, decay: 0.1 });
    }
  }
  boom(pos, big = false) {
    if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, big ? 1.2 : 0.8, 24);
    this._noise(t, { dur: big ? 1.1 : 0.5, gain: big ? 1 : 0.7, freq: big ? 700 : 1400, freqEnd: 90, decay: big ? 0.9 : 0.4, o });
    this._tone(t, { freq: big ? 80 : 120, freqEnd: 28, dur: big ? 0.7 : 0.35, gain: big ? 0.9 : 0.6, decay: big ? 0.8 : 0.4, o });
  }
  whoosh(pos, f0 = 300, f1 = 1500) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, 0.7, 18); this._noise(t, { dur: 0.35, gain: 0.45, type: 'bandpass', freq: f0, freqEnd: f1, decay: 0.32, q: 1.2, attack: 0.06, o }); }
  crit() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 2600, dur: 0.05, gain: 0.3, decay: 0.12, type: 'square' }); this._tone(t + 0.04, { freq: 3300, dur: 0.08, gain: 0.25, decay: 0.2, type: 'triangle' }); this._noise(t, { dur: 0.1, gain: 0.25, type: 'highpass', freq: 5000, decay: 0.1 }); }
  // hit confirm: louder for bigger hits, metallic on armor, glassy on shields, soft for damage over time
  hit(head, crit = false, amt = 20, layer = 'hp', dot = false) {
    if (!this.ctx) return; const t = this.ctx.currentTime, g = Math.min(1.4, Math.max(0.45, Math.sqrt(amt / 25)));
    if (dot) { this._tone(t, { freq: 760, dur: 0.04, gain: 0.07, decay: 0.06, type: 'sine' }); return; }
    if (crit) this.crit();
    if (layer === 'armor') { this._tone(t, { freq: 2100, dur: 0.05, gain: 0.16 * g, decay: 0.12, type: 'square' }); this._noise(t, { dur: 0.05, gain: 0.18 * g, type: 'bandpass', freq: 4200, q: 6, decay: 0.06 }); }
    else if (layer === 'shield') { this._tone(t, { freq: 2600, freqEnd: 3400, dur: 0.06, gain: 0.14 * g, decay: 0.1, type: 'sine' }); }
    this._tone(t, { freq: head ? 1700 : 1150, dur: 0.06, gain: (head ? 0.34 : 0.25) * g, decay: 0.09, type: 'triangle' }); if (head) this._tone(t, { freq: 2300, dur: 0.06, gain: 0.18, decay: 0.1, type: 'sine' });
  }
  tink() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 3200, dur: 0.04, gain: 0.12, decay: 0.08, type: 'sine' }); this._noise(t, { dur: 0.03, gain: 0.1, type: 'highpass', freq: 6000, decay: 0.03 }); }
  // the elimination confirm: a low thunk, plus a sharp crack on a headshot kill
  killConfirm(head) { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 110, freqEnd: 45, dur: 0.16, gain: 0.7, decay: 0.2 }); this._noise(t, { dur: 0.1, gain: 0.35, freq: 900, freqEnd: 200, decay: 0.1 }); if (head) { this._noise(t + 0.01, { dur: 0.06, gain: 0.55, type: 'highpass', freq: 3500, decay: 0.07 }); this._tone(t + 0.01, { freq: 3000, freqEnd: 1800, dur: 0.08, gain: 0.25, decay: 0.12, type: 'square' }); } }
  chime() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 1180, dur: 0.06, gain: 0.08, decay: 0.16, type: 'sine' }); this._tone(t + 0.05, { freq: 1570, dur: 0.08, gain: 0.07, decay: 0.22, type: 'sine' }); }
  buzz() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 160, dur: 0.12, gain: 0.18, decay: 0.14, type: 'square' }); this._tone(t, { freq: 168, dur: 0.12, gain: 0.12, decay: 0.14, type: 'sawtooth' }); }
  heartbeat() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 62, freqEnd: 40, dur: 0.12, gain: 0.55, decay: 0.14 }); this._tone(t + 0.22, { freq: 55, freqEnd: 36, dur: 0.12, gain: 0.4, decay: 0.14 }); }
  slide(pos) { if (!this.ctx) return; const o = this._out(pos, 0.6, 10); this._noise(this.ctx.currentTime, { dur: 0.5, gain: 0.3, type: 'bandpass', freq: 700, freqEnd: 300, decay: 0.45, q: 0.8, attack: 0.02, o }); }
  mantle(pos) { if (!this.ctx) return; const o = this._out(pos, 0.6, 10); this._noise(this.ctx.currentTime, { dur: 0.15, gain: 0.35, freq: 500, freqEnd: 180, decay: 0.15, o }); }
  setLowHp(f) { if (!this.lp) return; const target = f > 0 ? 20000 - 18800 * f : 20000; this.lp.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.15); }
  kill() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 620, dur: 0.12, gain: 0.35, decay: 0.16, type: 'square' }); this._tone(t + 0.07, { freq: 930, dur: 0.18, gain: 0.35, decay: 0.28, type: 'square' }); this._noise(t, { dur: 0.2, gain: 0.3, freq: 800, decay: 0.2 }); }
  hurt() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 140, freqEnd: 70, dur: 0.15, gain: 0.35, decay: 0.18, type: 'sawtooth' }); }
  ping() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 1320, dur: 0.08, gain: 0.2, decay: 0.14, type: 'sine' }); this._tone(t + 0.07, { freq: 1760, dur: 0.12, gain: 0.2, decay: 0.3, type: 'sine' }); }
  capture() { if (!this.ctx) return; const t = this.ctx.currentTime; [392, 523, 659, 784].forEach((f, i) => this._tone(t + i * 0.07, { freq: f, dur: 0.18, gain: 0.28, decay: 0.4, type: 'triangle' })); }
  stinger(kind = 'potg') { if (!this.ctx) return; const t = this.ctx.currentTime; const seq = { potg: [392, 523, 659, 784, 1046], killcam: [220, 196], round: [523, 659, 784] }[kind] || [440]; seq.forEach((f, i) => this._tone(t + i * 0.1, { freq: f, dur: 0.3, gain: 0.3, decay: 0.5, type: kind === 'killcam' ? 'sawtooth' : 'triangle' })); }
  heal(pos) { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 880, dur: 0.1, gain: 0.07, decay: 0.2, type: 'sine' }); }
  reload() { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, { dur: 0.05, gain: 0.4, freq: 2400, decay: 0.05 }); this._noise(t + 0.45, { dur: 0.05, gain: 0.5, freq: 1800, decay: 0.06 }); }
  empty() { if (!this.ctx) return; this._noise(this.ctx.currentTime, { dur: 0.04, gain: 0.3, freq: 3000, decay: 0.04 }); }
  step(pos, enemy = false) { if (!this.ctx) return; const o = this._out(pos, enemy ? 0.55 : 0.3, enemy ? 11 : 8); this._noise(this.ctx.currentTime, { dur: 0.08, gain: 0.3, freq: 420, freqEnd: 200, decay: 0.08, o }); }
  jump(pos) { if (!this.ctx) return; const o = this._out(pos, 0.5, 10); this._noise(this.ctx.currentTime, { dur: 0.12, gain: 0.25, freq: 600, decay: 0.12, o }); }
  land(pos) { if (!this.ctx) return; const o = this._out(pos, 0.7, 12); this._noise(this.ctx.currentTime, { dur: 0.15, gain: 0.5, freq: 300, freqEnd: 90, decay: 0.15, o }); }
  pack(pos) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, 0.8, 16); this._tone(t, { freq: 660, dur: 0.1, gain: 0.25, decay: 0.15, o }); this._tone(t + 0.08, { freq: 990, dur: 0.14, gain: 0.25, decay: 0.3, o }); }
  core(pos) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, 0.9, 16); this._tone(t, { freq: 440, freqEnd: 1320, dur: 0.25, gain: 0.3, decay: 0.4, type: 'triangle', o }); }
  ultReady() { if (!this.ctx) return; const t = this.ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => this._tone(t + i * 0.09, { freq: f, dur: 0.2, gain: 0.3, decay: 0.35, type: 'triangle' })); }
  ult(pos, own) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, own ? 1 : 0.9, 40); this._tone(t, { freq: 90, freqEnd: 600, dur: 0.6, gain: 0.7, decay: 0.9, type: 'sawtooth', o }); this._noise(t, { dur: 0.9, gain: 0.5, type: 'bandpass', freq: 300, freqEnd: 3000, decay: 0.8, attack: 0.2, o }); }
  blink(pos) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this._out(pos, 0.8, 18); this._tone(t, { freq: 1800, freqEnd: 400, dur: 0.14, gain: 0.3, decay: 0.15, type: 'sine', o }); this._noise(t, { dur: 0.12, gain: 0.3, type: 'highpass', freq: 3000, decay: 0.12, o }); }
  ui(kind = 'click') { if (!this.ctx) return; const t = this.ctx.currentTime; if (kind === 'hover') this._tone(t, { freq: 1400, dur: 0.03, gain: 0.07, decay: 0.05, type: 'sine' }); else if (kind === 'select') { this._tone(t, { freq: 700, dur: 0.08, gain: 0.25, decay: 0.12, type: 'triangle' }); this._tone(t + 0.06, { freq: 1050, dur: 0.1, gain: 0.25, decay: 0.2, type: 'triangle' }); } else if (kind === 'ready') { [392, 523, 659].forEach((f, i) => this._tone(t + i * 0.08, { freq: f, dur: 0.15, gain: 0.3, decay: 0.3, type: 'square' })); } else this._tone(t, { freq: 900, dur: 0.05, gain: 0.2, decay: 0.08, type: 'triangle' }); }
  announce(kind) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    const seq = { start: [440, 440, 660], win: [523, 659, 784, 1046], lose: [392, 311, 233], checkpoint: [523, 784], overtime: [660, 660, 660], surge: [330, 495, 330, 660], round: [523, 659, 784], capture: [392, 523, 659], victory: [523, 659, 784, 1046], defeat: [392, 311, 233] }[kind] || [600];
    seq.forEach((f, i) => this._tone(t + i * 0.13, { freq: f, dur: 0.2, gain: 0.3, decay: 0.3, type: 'sawtooth' }));
  }
  tick(n) { if (!this.ctx) return; this._tone(this.ctx.currentTime, { freq: n <= 3 ? 880 : 660, dur: 0.06, gain: 0.2, decay: 0.1, type: 'square' }); }
}
