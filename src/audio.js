// Procedural sound effects with Web Audio: gunshots from filtered noise, mechanical clicks,
// ringing steel, breaking glass. Nothing is loaded; everything is synthesised on the fly.
export class Sfx {
  constructor() { this.ctx = null; this.volume = 0.55; }
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.5; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  _noise(t0, { dur = 0.3, gain = 1, type = 'lowpass', freq = 1200, q = 0.7, attack = 0.002, decay = 0.2, pan = 0, freqEnd = null }) {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur); f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    src.connect(f); f.connect(g);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    src.start(t0, Math.random() * 0.5, dur + 0.05);
  }
  _tone(t0, { freq = 800, dur = 1, gain = 0.3, type = 'sine', decay = 0.8, freqEnd = null }) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + decay + 0.05);
  }
  shot(kind) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    if (kind === 'm4a1') {
      this._noise(t, { dur: 0.25, gain: 0.9, freq: 3500, freqEnd: 600, decay: 0.16 });
      this._noise(t, { dur: 0.4, gain: 0.5, freq: 300, decay: 0.3 });
      this._tone(t, { freq: 140, freqEnd: 50, dur: 0.12, gain: 0.5, decay: 0.12 });
    } else if (kind === 'smg') {
      this._noise(t, { dur: 0.2, gain: 0.7, freq: 2800, freqEnd: 700, decay: 0.12 });
      this._noise(t, { dur: 0.3, gain: 0.35, freq: 260, decay: 0.2 });
      this._tone(t, { freq: 160, freqEnd: 60, dur: 0.1, gain: 0.4, decay: 0.1 });
    } else if (kind === 'ak47') {
      this._noise(t, { dur: 0.28, gain: 0.95, freq: 3200, freqEnd: 550, decay: 0.18 });
      this._noise(t, { dur: 0.45, gain: 0.6, freq: 260, decay: 0.32 });
      this._tone(t, { freq: 125, freqEnd: 45, dur: 0.14, gain: 0.55, decay: 0.14 });
    } else if (kind === 'deagle') {
      this._noise(t, { dur: 0.35, gain: 1, freq: 4600, freqEnd: 500, decay: 0.22 });
      this._noise(t, { dur: 0.9, gain: 0.75, freq: 230, freqEnd: 60, decay: 0.7 });
      this._tone(t, { freq: 105, freqEnd: 34, dur: 0.28, gain: 0.8, decay: 0.3 });
      this._noise(t + 0.18, { dur: 0.7, gain: 0.1, freq: 700, freqEnd: 200, decay: 0.6, attack: 0.04 });
    } else if (kind === 'mp7') {
      this._noise(t, { dur: 0.18, gain: 0.65, freq: 3600, freqEnd: 900, decay: 0.1 });
      this._noise(t, { dur: 0.25, gain: 0.3, freq: 320, decay: 0.16 });
      this._tone(t, { freq: 190, freqEnd: 70, dur: 0.08, gain: 0.35, decay: 0.08 });
    } else if (kind === 'garand') {
      this._noise(t, { dur: 0.3, gain: 1, freq: 4200, freqEnd: 450, decay: 0.2 });
      this._noise(t, { dur: 1.2, gain: 0.65, freq: 210, freqEnd: 60, decay: 1 });
      this._tone(t, { freq: 95, freqEnd: 32, dur: 0.35, gain: 0.75, decay: 0.4 });
      this._noise(t + 0.22, { dur: 1, gain: 0.1, freq: 650, freqEnd: 200, decay: 0.9, attack: 0.05 });
    } else if (kind === 'revolver') {
      this._noise(t, { dur: 0.35, gain: 1, freq: 4200, freqEnd: 450, decay: 0.24 });
      this._noise(t, { dur: 1.1, gain: 0.8, freq: 200, freqEnd: 55, decay: 0.9 });
      this._tone(t, { freq: 100, freqEnd: 32, dur: 0.3, gain: 0.8, decay: 0.35 });
      this._noise(t + 0.2, { dur: 0.8, gain: 0.1, freq: 700, freqEnd: 200, decay: 0.7, attack: 0.04 }); // echo
    } else if (kind === 'sniper') {
      this._noise(t, { dur: 0.3, gain: 1, freq: 5000, freqEnd: 500, decay: 0.2 });
      this._noise(t, { dur: 1.6, gain: 0.7, freq: 220, freqEnd: 60, decay: 1.4 });
      this._tone(t, { freq: 90, freqEnd: 30, dur: 0.4, gain: 0.8, decay: 0.45 });
      this._noise(t + 0.25, { dur: 1.2, gain: 0.12, freq: 600, freqEnd: 200, decay: 1.1, attack: 0.05 }); // echo off the berm
    } else {
      this._noise(t, { dur: 0.4, gain: 1, freq: 2500, freqEnd: 300, decay: 0.3 });
      this._noise(t, { dur: 0.9, gain: 0.8, freq: 180, freqEnd: 60, decay: 0.7 });
      this._tone(t, { freq: 110, freqEnd: 35, dur: 0.25, gain: 0.8, decay: 0.3 });
    }
  }
  click(pitch = 1, gain = 0.25) { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, { dur: 0.05, gain, type: 'bandpass', freq: 2600 * pitch, q: 3, decay: 0.04 }); this._tone(t, { freq: 1800 * pitch, dur: 0.03, gain: gain * 0.4, type: 'square', decay: 0.02 }); }
  clack(pitch = 1) { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, { dur: 0.1, gain: 0.45, type: 'bandpass', freq: 1400 * pitch, q: 2, decay: 0.07 }); this._noise(t + 0.03, { dur: 0.08, gain: 0.3, type: 'bandpass', freq: 900 * pitch, q: 2, decay: 0.06 }); }
  ding(size = 1, dist = 15) {
    if (!this.ctx) return; const t = this.ctx.currentTime + Math.min(0.7, dist / 343), g = 0.45 * Math.max(0.25, 1 - dist / 300);
    const f = 1150 / size;
    for (const [m, a] of [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.9, 0.12]]) this._tone(t, { freq: f * m, dur: 1.5, gain: g * a, decay: 1.2 + size * 0.6 });
  }
  glass() { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, { dur: 0.4, gain: 0.5, type: 'highpass', freq: 3000, decay: 0.3 }); for (let i = 0; i < 5; i++) this._tone(t + i * 0.02, { freq: 2500 + Math.random() * 3000, dur: 0.2, gain: 0.05, decay: 0.2 }); }
  // the M1 Garand's en-bloc clip leaving the receiver
  ping() { if (!this.ctx) return; const t = this.ctx.currentTime; for (const [f, g] of [[2650, 0.14], [3980, 0.07], [6120, 0.035]]) this._tone(t, { freq: f, dur: 0.6, gain: g, decay: 0.55 }); }
  tink() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 3200 + Math.random() * 800, dur: 0.15, gain: 0.05, decay: 0.12 }); }
  thud() { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, { dur: 0.2, gain: 0.35, freq: 400, decay: 0.15 }); }
  empty() { this.click(1.4, 0.3); }
}
