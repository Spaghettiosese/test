// Fire sounds, synthesised on the fly on top of the range's Web Audio helper.
import { Sfx } from '../audio.js';

export class FireSfx extends Sfx {
  whoosh(size = 1) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this._noise(t, { dur: 0.6, gain: 0.5 * size, freq: 500, freqEnd: 2600, q: 1.2, type: 'bandpass', attack: 0.08, decay: 0.45 });
    this._tone(t, { freq: 180, freqEnd: 70, dur: 0.4, gain: 0.25 * size, decay: 0.4, type: 'triangle' });
  }
  boom(size = 1) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this._noise(t, { dur: 0.5, gain: 1 * size, freq: 2200, freqEnd: 250, decay: 0.35 });
    this._noise(t, { dur: 1.4, gain: 0.8 * size, freq: 200, freqEnd: 50, decay: 1.2 });
    this._tone(t, { freq: 95, freqEnd: 28, dur: 0.5, gain: 0.85 * size, decay: 0.55 });
    this._noise(t + 0.12, { dur: 1.2, gain: 0.25, freq: 900, freqEnd: 180, decay: 1, attack: 0.08 });
  }
  breath() { // one puff of the flame stream, called repeatedly while it burns
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this._noise(t, { dur: 0.22, gain: 0.35, freq: 700, freqEnd: 1800, q: 0.9, type: 'bandpass', attack: 0.03, decay: 0.2 });
  }
  crackle(gain = 0.2) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) this._noise(t + Math.random() * 0.25, { dur: 0.03, gain: gain * (0.4 + Math.random() * 0.6), type: 'highpass', freq: 2500 + Math.random() * 3000, decay: 0.025 });
  }
  thump() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 90, freqEnd: 40, dur: 0.15, gain: 0.3, decay: 0.15 }); }
}
