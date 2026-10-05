// Game audio: the range's synthesised gun sounds, made positional (distance, pan and a muffle
// when walls are in the way), plus footsteps, doors, breaking walls, explosions, the defuser's
// beeps, UI sounds, a tinnitus ring after flashbangs, and optional spoken callouts.
import { Sfx } from '../../audio.js';

const RIG_KIND = { m4a1: 'm4a1', ak47: 'ak47', smg: 'smg', mp7: 'mp7', deagle: 'deagle', revolver: 'revolver', garand: 'garand', sniper: 'sniper', aug: 'm4a1', famas: 'm4a1', compact9: 'pistol', m45: 'suppressed', mp10: 'smg', lmg: 'lmg', p90: 'mp7', d12: 'shotgun', dmr: 'garand', lever: 'lever', shotgun: 'shotgun', double: 'shotgun' };

export class GameAudio extends Sfx {
  constructor() {
    super(); this.listener = { pos: [0, 0, 0], yaw: 0 }; this.world = null; this.speech = true; this.enabled = true; this.music = null; this.sfxVolume = 0.6;
    this.tinnitus = null; this.heart = 0;
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  // run a synth routine with its output positioned at `pos`
  at(pos, fn, o = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, l = this.listener, dx = pos[0] - l.pos[0], dy = pos[1] - l.pos[1], dz = pos[2] - l.pos[2];
    const d = Math.hypot(dx, dy, dz), ref = o.ref ?? 6;
    let gain = (ref / (ref + d)) * (o.gain ?? 1);
    // sound that has to get through a wall is dull and quiet
    let cutoff = 18000;
    if (this.world && d > 1.5) {
      const w = this.world; let o2 = [l.pos[0], l.pos[1] + 1.6, l.pos[2]], dir = [dx / d, (dy - 1.6) / Math.max(d, 0.01), dz / d], left = d, n = 0;
      for (let i = 0; i < 3; i++) { const h = w.cast(o2[0], o2[1], o2[2], dir[0], dir[1], dir[2], left, 1 | 2); if (!h) break; n++; left -= h.t + 0.2; o2 = [h.x + dir[0] * 0.25, h.y + dir[1] * 0.25, h.z + dir[2] * 0.25]; if (left <= 0) break; }
      if (n) { gain *= Math.pow(0.55, n); cutoff = 1400 / n; }
    }
    // pan relative to where the listener faces (yaw 0 = +z, listener's right = -x)
    const rx = -Math.cos(l.yaw) * dx + Math.sin(l.yaw) * dz;
    const pan = Math.max(-1, Math.min(1, (rx / Math.max(d, 0.5)) * 0.9));
    const g = c.createGain(); g.gain.value = Math.min(1.4, gain);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    g.connect(f); if (p) { p.pan.value = pan; f.connect(p); p.connect(this.master); } else f.connect(this.master);
    const saved = this.master; this.master = g;
    try { fn(); } finally { this.master = saved; }
  }
  shotAt(def, pos) { this.at(pos, () => this.shot(RIG_KIND[def.rig] || 'shotgun'), { ref: def.cls === 'SR' ? 22 : 12 }); }
  tink(pos) { this.at(pos || this.listener.pos, () => super.tink(), { ref: 3, gain: 0.7 }); }
  shatter(pos, kind) {
    this.at(pos, () => {
      if (kind === 'glass') this.glass();
      else { const t = this.ctx.currentTime; this._noise(t, { dur: 0.5, gain: 0.8, freq: kind === 'brick' ? 600 : 1100, freqEnd: 200, decay: 0.35 }); this._noise(t + 0.04, { dur: 0.3, gain: 0.5, type: 'bandpass', freq: 800, q: 1.5, decay: 0.2 }); this._tone(t, { freq: 90, freqEnd: 40, dur: 0.2, gain: 0.5, decay: 0.2 }); }
    }, { ref: 9 });
  }
  explosion(pos, r = 5) { this.at(pos, () => { const t = this.ctx.currentTime; this._noise(t, { dur: 1.2, gain: 1.2, freq: 900, freqEnd: 60, decay: 1.0 }); this._noise(t, { dur: 0.3, gain: 1, freq: 3000, freqEnd: 400, decay: 0.2 }); this._tone(t, { freq: 70, freqEnd: 25, dur: 0.6, gain: 1.1, decay: 0.7 }); this._noise(t + 0.25, { dur: 1.2, gain: 0.2, freq: 500, freqEnd: 150, decay: 1, attack: 0.05 }); }, { ref: 18 + r * 2 }); }
  bang(pos) { this.at(pos, () => { const t = this.ctx.currentTime; this._noise(t, { dur: 0.25, gain: 1.2, type: 'highpass', freq: 1500, decay: 0.2 }); this._tone(t, { freq: 140, freqEnd: 60, dur: 0.3, gain: 0.9, decay: 0.3 }); }, { ref: 20 }); }
  whoosh(pos) { this.at(pos, () => { const t = this.ctx.currentTime; this._noise(t, { dur: 0.3, gain: 0.35, type: 'bandpass', freq: 600, freqEnd: 1800, q: 1, decay: 0.25, attack: 0.08 }); }, { ref: 5 }); }
  thud(pos) { this.at(pos, () => { const t = this.ctx.currentTime; this._noise(t, { dur: 0.25, gain: 0.8, freq: 500, decay: 0.2 }); this._tone(t, { freq: 100, freqEnd: 45, dur: 0.15, gain: 0.6, decay: 0.15 }); }, { ref: 8 }); }
  step(pos, kind = 'tile', loud = 1) { this.at(pos, () => { const t = this.ctx.currentTime; const f = kind === 'carpet' ? 400 : kind === 'wood' ? 900 : 1500; this._noise(t, { dur: 0.1, gain: 0.25 * loud, type: 'lowpass', freq: f, freqEnd: f * 0.4, decay: 0.07 }); this._tone(t, { freq: 90, freqEnd: 50, dur: 0.06, gain: 0.12 * loud, decay: 0.06 }); }, { ref: 3 }); }
  door(pos, open = true) { this.at(pos, () => { const t = this.ctx.currentTime; this._tone(t, { freq: open ? 180 : 260, freqEnd: open ? 260 : 150, dur: 0.35, gain: 0.08, type: 'sawtooth', decay: 0.35 }); this._noise(t + (open ? 0 : 0.28), { dur: 0.1, gain: 0.4, freq: 500, decay: 0.08 }); }, { ref: 6 }); }
  beep(pos, hi = false) { this.at(pos || this.listener.pos, () => { const t = this.ctx.currentTime; this._tone(t, { freq: hi ? 1900 : 1400, dur: 0.12, gain: 0.25, type: 'square', decay: 0.1 }); }, { ref: 12 }); }
  place(pos) { this.at(pos, () => { this.clack(0.9); this.click(1.4, 0.3); }, { ref: 5 }); }
  // ---- non-positional
  ui(kind = 'click') {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    if (kind === 'click') this._tone(t, { freq: 1200, freqEnd: 900, dur: 0.05, gain: 0.12, type: 'square', decay: 0.05 });
    else if (kind === 'hover') this._tone(t, { freq: 900, dur: 0.03, gain: 0.05, type: 'triangle', decay: 0.04 });
    else if (kind === 'confirm') { this._tone(t, { freq: 700, dur: 0.08, gain: 0.15, type: 'triangle', decay: 0.1 }); this._tone(t + 0.08, { freq: 1050, dur: 0.12, gain: 0.15, type: 'triangle', decay: 0.14 }); }
    else if (kind === 'back') this._tone(t, { freq: 600, freqEnd: 350, dur: 0.1, gain: 0.12, type: 'triangle', decay: 0.12 });
    else if (kind === 'error') this._tone(t, { freq: 200, dur: 0.15, gain: 0.15, type: 'sawtooth', decay: 0.16 });
    else if (kind === 'levelup') { [523, 659, 784, 1047].forEach((f, i) => this._tone(t + i * 0.09, { freq: f, dur: 0.2, gain: 0.14, type: 'triangle', decay: 0.25 })); }
    else if (kind === 'hit') this._tone(t, { freq: 1800, dur: 0.04, gain: 0.18, type: 'square', decay: 0.04 });
    else if (kind === 'headshot') { this._tone(t, { freq: 2400, dur: 0.06, gain: 0.2, type: 'square', decay: 0.07 }); this._tone(t + 0.04, { freq: 1600, dur: 0.1, gain: 0.15, type: 'square', decay: 0.1 }); }
    else if (kind === 'kill') { this._tone(t, { freq: 900, dur: 0.1, gain: 0.2, type: 'triangle', decay: 0.12 }); this._tone(t + 0.07, { freq: 1350, dur: 0.18, gain: 0.2, type: 'triangle', decay: 0.2 }); }
    else if (kind === 'roundstart') { this._tone(t, { freq: 440, dur: 0.15, gain: 0.2, type: 'sawtooth', decay: 0.18 }); this._tone(t + 0.2, { freq: 880, dur: 0.35, gain: 0.2, type: 'sawtooth', decay: 0.4 }); }
    else if (kind === 'win') [523, 659, 784].forEach((f, i) => this._tone(t + i * 0.12, { freq: f, dur: 0.3, gain: 0.18, type: 'triangle', decay: 0.4 }));
    else if (kind === 'lose') [392, 330, 262].forEach((f, i) => this._tone(t + i * 0.16, { freq: f, dur: 0.35, gain: 0.18, type: 'triangle', decay: 0.45 }));
  }
  ring(sec) { // tinnitus after a bang
    if (!this.ctx || this.tinnitus) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 5200; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + sec);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + sec + 0.1); this.tinnitus = o; o.onended = () => { this.tinnitus = null; };
  }
  heartbeat() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, { freq: 62, freqEnd: 40, dur: 0.12, gain: 0.5, decay: 0.15 }); this._tone(t + 0.16, { freq: 55, freqEnd: 38, dur: 0.1, gain: 0.35, decay: 0.12 }); }
  say(text, pitch = 1) {
    if (!this.speech || !('speechSynthesis' in window)) return;
    try { const u = new SpeechSynthesisUtterance(text); u.rate = 1.15; u.pitch = pitch; u.volume = 0.5; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { /* no voices here */ }
  }
  // generative ambience / menu music: a slow minor pad with a pulse
  startMusic(kind = 'menu') {
    if (!this.ctx || this.music === kind) return; this.stopMusic();
    const mv = (this.musicVol ?? 0.5) * 2; if (mv <= 0) return; this.music = kind;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime((kind === 'menu' ? 0.07 : 0.035) * mv, c.currentTime + 3); g.connect(this.master);
    const oscs = [];
    const chord = kind === 'menu' ? [110, 164.8, 196, 261.6] : [55, 82.4, 110];
    for (const f of chord) { for (const det of [-4, 4]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'menu' ? 700 : 400; o.connect(lp); lp.connect(g); o.start(); oscs.push(o); } }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(lfo);
    this.musicNodes = { g, oscs };
  }
  stopMusic() { if (!this.musicNodes || !this.ctx) { this.music = null; return; } const { g, oscs } = this.musicNodes; g.gain.cancelScheduledValues(this.ctx.currentTime); g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4); setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch { /* done */ } }), 1500); this.musicNodes = null; this.music = null; }
}
