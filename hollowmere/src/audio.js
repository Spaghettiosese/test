// Synthesised sound: every effect, the ambience and the dark-ambient score are built from noise
// and oscillators at runtime, so the game ships no audio files. Sounds can be placed in the
// world: they get quieter and pan with distance and direction from the listener.
export class Audio {
  constructor() { this.ctx = null; this.volume = 0.6; this.mood = { tension: 0, area: 'town', night: 1, indoor: 0 }; this.listener = { pos: [0, 0, 0], yaw: 0 }; this.muted = false; this._voices = 0; }
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.volume; this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.gain.value = 0.5; this.musicBus.connect(this.master);
      const len = c.sampleRate * 2; this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startAmbience(); this.startMusic();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setListener(pos, yaw) { this.listener.pos = pos; this.listener.yaw = yaw; }
  // gain & pan for a sound at world position p
  spatial(p, range = 30) {
    if (!p) return { g: 1, pan: 0 };
    const L = this.listener, dx = p[0] - L.pos[0], dz = p[2] - L.pos[2], d = Math.hypot(dx, dz, (p[1] ?? 0) - L.pos[1] * 0.5);
    const g = Math.max(0, 1 - d / range) ** 1.6;
    const right = dx * Math.cos(L.yaw) - dz * Math.sin(L.yaw); // + when the source is on the listener's left in our basis
    return { g, pan: Math.max(-1, Math.min(1, -right / (d + 2) * 1.6)) };
  }
  _out(gainNode, pan) {
    const c = this.ctx;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; gainNode.connect(p); p.connect(this.sfxBus); } else gainNode.connect(this.sfxBus);
  }
  _noise(t0, { dur = 0.3, gain = 1, type = 'lowpass', freq = 1200, q = 0.7, attack = 0.003, decay = 0.2, pan = 0, freqEnd = null, rate = 1 }) {
    const c = this.ctx; if (gain < 0.002) return;
    const src = c.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = rate * (0.85 + Math.random() * 0.3);
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur); f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    src.connect(f); f.connect(g); this._out(g, pan); src.start(t0, Math.random() * 0.8, dur + 0.1);
  }
  _tone(t0, { freq = 800, dur = 1, gain = 0.3, type = 'sine', decay = 0.8, freqEnd = null, pan = 0, attack = 0.004 }) {
    const c = this.ctx; if (gain < 0.002) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g); this._out(g, pan); o.start(t0); o.stop(t0 + decay + 0.05);
  }
  get t() { return this.ctx.currentTime; }
  // ------------------------------------------------------------ effects (all take an optional world position)
  _s(p, range) { return this.spatial(p, range); }
  swing(v = 1, p) { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 0.3, gain: 0.32 * v, type: 'bandpass', freq: 700, freqEnd: 2600, q: 0.8, attack: 0.05, decay: 0.16 }); }
  clang(v = 1, p) { if (!this.ctx) return; const { g, pan } = this._s(p, 45); const t = this.t;
    this._noise(t, { dur: 0.1, gain: 0.5 * v * g, type: 'highpass', freq: 2500, decay: 0.07, pan });
    for (const [f, a] of [[1900, 1], [3100, 0.6], [4700, 0.35]]) this._tone(t, { freq: f * (0.95 + Math.random() * 0.1), dur: 0.6, gain: 0.09 * a * v * g, decay: 0.5, pan }); }
  thud(v = 1, p) { if (!this.ctx) return; const { g, pan } = this._s(p, 30); const t = this.t; this._noise(t, { dur: 0.2, gain: 0.5 * v * g, freq: 260, decay: 0.16, pan }); this._tone(t, { freq: 90, freqEnd: 45, dur: 0.15, gain: 0.35 * v * g, decay: 0.14, pan }); }
  step(floor = 1, v = 1, p) {
    if (!this.ctx) return; const { g, pan } = this._s(p, 22); const t = this.t;
    const f = [[500, 0.35], [1400, 0.5], [800, 0.55], [2600, 0.5]][floor] || [900, 0.4];
    this._noise(t, { dur: 0.09, gain: f[1] * 0.35 * v * g, type: 'bandpass', freq: f[0], q: 1.2, decay: 0.07, pan });
    if (floor === 2) this._tone(t, { freq: 110, freqEnd: 70, dur: 0.06, gain: 0.08 * v * g, decay: 0.07, pan });
  }
  hurt() { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 0.3, gain: 0.5, freq: 300, freqEnd: 80, decay: 0.25 }); this._tone(t, { freq: 180, freqEnd: 70, dur: 0.25, gain: 0.3, type: 'sawtooth', decay: 0.25 }); }
  grunt(v = 1, p, pitch = 1) { if (!this.ctx) return; const { g, pan } = this._s(p, 32); const t = this.t; this._tone(t, { freq: 150 * pitch, freqEnd: 90 * pitch, dur: 0.2, gain: 0.22 * v * g, type: 'sawtooth', decay: 0.2, pan }); this._noise(t, { dur: 0.2, gain: 0.2 * v * g, type: 'bandpass', freq: 500, q: 1, decay: 0.16, pan }); }
  die(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 35); const t = this.t; this._tone(t, { freq: 220, freqEnd: 60, dur: 0.6, gain: 0.3 * g, type: 'sawtooth', decay: 0.6, pan }); this._noise(t, { dur: 0.4, gain: 0.3 * g, freq: 500, freqEnd: 100, decay: 0.35, pan }); }
  deny() { if (!this.ctx) return; const t = this.t; this._tone(t, { freq: 180, freqEnd: 120, dur: 0.15, gain: 0.15, type: 'square', decay: 0.14 }); }
  veil() { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 1.2, gain: 0.3, type: 'bandpass', freq: 300, freqEnd: 2200, q: 2, attack: 0.5, decay: 0.9 }); this._tone(t, { freq: 90, freqEnd: 240, dur: 1, gain: 0.15, type: 'triangle', decay: 1, attack: 0.3 }); }
  dash() { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 0.35, gain: 0.5, type: 'bandpass', freq: 400, freqEnd: 3000, q: 1, attack: 0.02, decay: 0.28 }); }
  slam(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 60); const t = this.t; this._tone(t, { freq: 90, freqEnd: 28, dur: 0.6, gain: 0.7 * g, decay: 0.7, pan }); this._noise(t, { dur: 0.7, gain: 0.7 * g, freq: 500, freqEnd: 60, decay: 0.6, pan }); }
  pick() { if (!this.ctx) return; const t = this.t; this._tone(t, { freq: 2600 + Math.random() * 700, dur: 0.04, gain: 0.05, type: 'square', decay: 0.03 }); this._noise(t, { dur: 0.05, gain: 0.15, type: 'bandpass', freq: 3200, q: 4, decay: 0.03 }); }
  lockClick(p) { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 0.1, gain: 0.5, type: 'bandpass', freq: 1200, q: 2, decay: 0.07 }); this._tone(t + 0.05, { freq: 600, dur: 0.1, gain: 0.1, type: 'square', decay: 0.08 }); }
  door(open = true, p) { if (!this.ctx) return; const { g, pan } = this._s(p, 30); const t = this.t; this._tone(t, { freq: open ? 110 : 140, freqEnd: open ? 190 : 90, dur: 0.6, gain: 0.08 * g, type: 'sawtooth', decay: 0.55, attack: 0.05, pan }); this._noise(t, { dur: 0.5, gain: 0.25 * g, type: 'bandpass', freq: 380, q: 5, decay: 0.45, attack: 0.05, pan }); if (!open) this._noise(t + 0.4, { dur: 0.1, gain: 0.4 * g, freq: 300, decay: 0.08, pan }); }
  chest(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 25); const t = this.t; this._noise(t, { dur: 0.5, gain: 0.3 * g, type: 'bandpass', freq: 500, q: 4, decay: 0.5, attack: 0.08, pan }); this._noise(t + 0.4, { dur: 0.1, gain: 0.3 * g, freq: 700, decay: 0.08, pan }); }
  coin() { if (!this.ctx) return; const t = this.t; for (let i = 0; i < 3; i++) this._tone(t + i * 0.05, { freq: 2600 + i * 500 + Math.random() * 300, dur: 0.3, gain: 0.07, decay: 0.25 }); }
  drink() { if (!this.ctx) return; const t = this.t; for (let i = 0; i < 4; i++) this._noise(t + i * 0.16, { dur: 0.1, gain: 0.25, type: 'bandpass', freq: 500, q: 4, decay: 0.1 }); }
  snuff(p) { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 0.5, gain: 0.3, type: 'highpass', freq: 1800, freqEnd: 600, decay: 0.4 }); }
  glass(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 40); const t = this.t; this._noise(t, { dur: 0.4, gain: 0.5 * g, type: 'highpass', freq: 3000, decay: 0.3, pan }); for (let i = 0; i < 6; i++) this._tone(t + i * 0.02, { freq: 2500 + Math.random() * 3000, dur: 0.2, gain: 0.05 * g, decay: 0.2, pan }); }
  crash(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 40); const t = this.t; this._noise(t, { dur: 0.4, gain: 0.6 * g, freq: 700, freqEnd: 150, decay: 0.3, pan }); this._noise(t + 0.06, { dur: 0.2, gain: 0.3 * g, type: 'bandpass', freq: 1500, decay: 0.15, pan }); }
  slash(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 30); const t = this.t; this._noise(t, { dur: 0.16, gain: 0.5 * g, type: 'bandpass', freq: 900, freqEnd: 300, q: 1, decay: 0.12, pan }); }
  swordDraw(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 25); this._noise(this.t, { dur: 0.35, gain: 0.3 * g, type: 'bandpass', freq: 2500, freqEnd: 5000, q: 6, decay: 0.3, pan }); }
  // one syllable of a speaker's gabble (pitch differs per person)
  blip(pitch = 1, p) { if (!this.ctx) return; const { g, pan } = this._s(p, 18); const t = this.t; this._tone(t, { freq: (150 + Math.random() * 50) * pitch, dur: 0.06, gain: 0.05 * g, type: 'square', decay: 0.06, pan }); }
  // ------------------------------------------------------------ bells & alarms
  bell(n = 1, p) {
    if (!this.ctx) return;
    for (let i = 0; i < n; i++) { const t = this.t + i * 2.6; for (const [m, a, d] of [[1, 1, 3.2], [2.02, 0.6, 2.4], [2.76, 0.4, 1.8], [4.2, 0.22, 1.2], [5.4, 0.14, 0.8]]) this._tone(t, { freq: 196 * m, dur: d, gain: 0.5 * a, decay: d, attack: 0.006 }); this._noise(t, { dur: 0.2, gain: 0.4, freq: 900, decay: 0.15 }); }
  }
  alarmBell(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 120); for (let i = 0; i < 6; i++) { const t = this.t + i * 0.32; for (const [m, a] of [[1, 1], [2.4, 0.5], [3.9, 0.3]]) this._tone(t, { freq: 620 * m, dur: 0.6, gain: 0.32 * a * Math.max(0.3, g), decay: 0.55, pan }); } }
  hornShort() { if (!this.ctx) return; const t = this.t; this._tone(t, { freq: 110, dur: 1.2, gain: 0.25, type: 'sawtooth', decay: 1.2, attack: 0.15 }); this._tone(t, { freq: 165, dur: 1.2, gain: 0.15, type: 'sawtooth', decay: 1.2, attack: 0.2 }); }
  crow(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 80); const t = this.t; for (let i = 0; i < 2; i++) this._tone(t + i * 0.22, { freq: 520, freqEnd: 300, dur: 0.16, gain: 0.08 * g, type: 'sawtooth', decay: 0.16, pan }); }
  wolf() { if (!this.ctx) return; const t = this.t; this._tone(t, { freq: 250, freqEnd: 420, dur: 2.4, gain: 0.05, type: 'sine', decay: 2.4, attack: 0.5 }); this._tone(t + 1.2, { freq: 420, freqEnd: 240, dur: 2, gain: 0.05, decay: 2, attack: 0.2 }); }
  whisper() { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 2.2, gain: 0.12, type: 'bandpass', freq: 2400, freqEnd: 1600, q: 8, attack: 0.8, decay: 1.4 }); }
  boom(v = 1) { if (!this.ctx) return; const t = this.t; this._tone(t, { freq: 60, freqEnd: 24, dur: 1.4, gain: 0.8 * v, decay: 1.4 }); this._noise(t, { dur: 1.2, gain: 0.5 * v, freq: 300, freqEnd: 40, decay: 1.1 }); }
  hollowCry(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 60); const t = this.t; this._tone(t, { freq: 380, freqEnd: 120, dur: 1, gain: 0.16 * g, type: 'sawtooth', decay: 1, pan }); this._tone(t, { freq: 391, freqEnd: 130, dur: 1, gain: 0.12 * g, type: 'sawtooth', decay: 1, pan }); this._noise(t, { dur: 0.9, gain: 0.2 * g, type: 'bandpass', freq: 900, q: 4, decay: 0.8, pan }); }
  // ------------------------------------------------------------ ambience & music
  startAmbience() {
    const c = this.ctx;
    // wind: filtered noise with a slow swell
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.6;
    this.windGain = c.createGain(); this.windGain.gain.value = 0.0;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 220; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    src.connect(f); f.connect(this.windGain); this.windGain.connect(this.master); src.start();
    // fire hum for interiors
    const s2 = c.createBufferSource(); s2.buffer = this.noise; s2.loop = true; s2.playbackRate.value = 0.5;
    const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 260;
    this.hearthGain = c.createGain(); this.hearthGain.gain.value = 0; s2.connect(f2); f2.connect(this.hearthGain); this.hearthGain.connect(this.master); s2.start();
    // rain (hiss) and running water (low rumble)
    const s3 = c.createBufferSource(); s3.buffer = this.noise; s3.loop = true; s3.playbackRate.value = 1.3;
    const f3 = c.createBiquadFilter(); f3.type = 'highpass'; f3.frequency.value = 1800;
    this.rainGain = c.createGain(); this.rainGain.gain.value = 0; s3.connect(f3); f3.connect(this.rainGain); this.rainGain.connect(this.master); s3.start();
    const s4 = c.createBufferSource(); s4.buffer = this.noise; s4.loop = true; s4.playbackRate.value = 0.7;
    const f4 = c.createBiquadFilter(); f4.type = 'bandpass'; f4.frequency.value = 520; f4.Q.value = 0.4;
    this.waterGain = c.createGain(); this.waterGain.gain.value = 0; s4.connect(f4); f4.connect(this.waterGain); this.waterGain.connect(this.master); s4.start();
    this._ambT = 0;
  }
  lute() { if (!this.ctx) return; const t = this.t, seq = [[0, 262], [0.28, 330], [0.56, 392], [0.84, 349], [1.2, 294], [1.5, 330], [1.8, 262], [2.3, 196]]; for (const [o, f] of seq) { this._tone(t + o, { freq: f, dur: 0.6, gain: 0.09, type: 'triangle', decay: 0.55, attack: 0.01 }); this._tone(t + o, { freq: f * 2, dur: 0.3, gain: 0.03, type: 'sine', decay: 0.25 }); } }
  owl(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 90); const t = this.t; for (const [o, f] of [[0, 380], [0.42, 330], [0.8, 330]]) this._tone(t + o, { freq: f, freqEnd: f * 0.92, dur: 0.32, gain: 0.05 * g, type: 'sine', decay: 0.3, attack: 0.05, pan }); }
  frog(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 60); const t = this.t; for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) this._tone(t + i * 0.11, { freq: 170 + Math.random() * 40, freqEnd: 120, dur: 0.09, gain: 0.05 * g, type: 'square', decay: 0.08, pan }); }
  rooster(p) { if (!this.ctx) return; const { g, pan } = this._s(p, 120); const t = this.t; [[0, 520, 720], [0.35, 640, 820], [0.7, 700, 500], [1.1, 560, 300]].forEach(([o, a, b]) => this._tone(t + o, { freq: a, freqEnd: b, dur: 0.4, gain: 0.05 * g, type: 'sawtooth', decay: 0.38, pan })); }
  thunder(d = 1) { if (!this.ctx) return; const t = this.t; this._noise(t, { dur: 2.6, gain: 0.6 / d, freq: 180, freqEnd: 60, decay: 2.4, attack: 0.08 }); this._tone(t, { freq: 48, freqEnd: 26, dur: 2.2, gain: 0.5 / d, decay: 2, attack: 0.1 }); }
  startMusic() {
    const c = this.ctx;
    this.padGain = c.createGain(); this.padGain.gain.value = 0.0; this.padFilter = c.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 500; this.padFilter.Q.value = 3;
    this.padFilter.connect(this.padGain); this.padGain.connect(this.musicBus);
    const notes = [55, 82.4, 110, 130.8];
    this.voices = notes.map((n, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = n; o.detune.value = (i - 1.5) * 7; const g = c.createGain(); g.gain.value = 0.14; o.connect(g); g.connect(this.padFilter); o.start(); return o; });
    this._chords = [[55, 82.4, 110, 130.8], [43.65, 65.4, 87.3, 110], [49, 73.4, 98, 123.5], [41.2, 61.7, 82.4, 103.8]];
    this._chord = 0; this._musT = 0; this._pulseT = 0;
  }
  update(dt) {
    if (!this.ctx) return;
    const c = this.ctx, m = this.mood, now = c.currentTime;
    // score: slow chord changes, brighter and pulsing when guards are hunting you
    this._musT -= dt;
    if (this._musT <= 0) { this._musT = 14; this._chord = (this._chord + 1) % 4; const ch = this._chords[this._chord]; this.voices.forEach((o, i) => o.frequency.setTargetAtTime(ch[i], now, 3)); if (m.area === 'crypt' || Math.random() < 0.3) this.bellNote(); }
    const base = m.area === 'crypt' ? 0.2 : m.area === 'keep' ? 0.17 : 0.13;
    this.padGain.gain.setTargetAtTime(base + m.tension * 0.18, now, 1.5);
    this.padFilter.frequency.setTargetAtTime(380 + m.tension * 900 + (m.indoor ? 0 : 120), now, 1.2);
    this.windGain.gain.setTargetAtTime((m.indoor ? 0.02 : 0.09) * (m.area === 'crypt' ? 0.2 : 1), now, 1.5);
    this.hearthGain.gain.setTargetAtTime(m.indoor ? 0.16 : 0.0, now, 1.0);
    this.rainGain.gain.setTargetAtTime((m.rain || 0) * (m.indoor ? 0.03 : 0.11), now, 1.2);
    this.waterGain.gain.setTargetAtTime(m.area === 'bridge' ? 0.09 : m.area === 'fen' ? 0.035 : 0, now, 1.5);
    if (m.tension > 0.5) { this._pulseT -= dt; if (this._pulseT <= 0) { this._pulseT = 0.66; this._tone(now, { freq: 60, freqEnd: 34, dur: 0.25, gain: 0.35 * m.tension, decay: 0.25 }); } }
    // random ambient one-shots
    this._ambT -= dt; if (this._ambT <= 0) { this._ambT = 8 + Math.random() * 14; if (!m.indoor && m.area === 'fen' && m.night) { this.frog([this.listener.pos[0] + (Math.random() - 0.5) * 30, 0, this.listener.pos[2] + (Math.random() - 0.5) * 30]); this._ambT = 2 + Math.random() * 4; } else if (!m.indoor && m.area === 'mire' && m.night && Math.random() < 0.6) this.owl([this.listener.pos[0] + 25, 6, this.listener.pos[2] + 20]); else if (!m.indoor && m.area === 'farms' && !m.night && Math.random() < 0.5) this.rooster([this.listener.pos[0] - 30, 1, this.listener.pos[2] + 20]); else if (!m.indoor && m.area === 'cinder' && Math.random() < 0.5) this.whisper?.([this.listener.pos[0] + 6, 1.5, this.listener.pos[2] + 6]); else if (!m.indoor && m.area !== 'crypt') { const r = Math.random(); if (r < 0.45) this.crow([this.listener.pos[0] + 20, 8, this.listener.pos[2] + 25]); else if (r < 0.6 && m.night) this.wolf(); } else if (m.area === 'crypt' && Math.random() < 0.5) this.whisper(); }
  }
  bellNote() { if (!this.ctx) return; const t = this.t, f = [220, 261.6, 329.6, 392][Math.floor(Math.random() * 4)] * (Math.random() < 0.5 ? 1 : 2); for (const [m, a] of [[1, 1], [2.01, 0.4], [3, 0.2]]) this._tone(t, { freq: f * m, dur: 5, gain: 0.06 * a, decay: 4.5, attack: 0.01 }); }
}
