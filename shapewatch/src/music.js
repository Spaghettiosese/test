// Adaptive procedural soundtrack. A small Web Audio sequencer with a lookahead scheduler plays
// pads, bass, arpeggios, a lead motif and drums. The game sets a mood ('menu', 'select', 'match',
// 'overtime', 'victory', 'defeat', 'potg') and, during a match, an intensity from 0 to 1 that fades
// layers in and out. Each map theme picks its own key, tempo and timbre.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// chord roots (semitones above the key's tonic) and qualities for a heroic minor progression
const PROGS = {
  heroic: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], // i VI III VII
  tense: [[0, 'm'], [1, 'M'], [0, 'm'], [7, 'm']],
  calm: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']],
  triumph: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']],
  somber: [[0, 'm'], [8, 'M'], [5, 'm'], [7, 'm']],
  phrygian: [[0, 'M'], [1, 'M'], [0, 'M'], [10, 'm']], // desert: phrygian dominant colour
  dorian: [[0, 'm'], [5, 'M'], [0, 'm'], [10, 'M']], // snow: i IV i VII
  synth: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'm']], // city
};
const CHORD = { m: [0, 3, 7, 12], M: [0, 4, 7, 12] };
// every theme has its own feel, not just its own key: progression, groove and bass style differ
export const STYLES = {
  snow: { key: 57, bpm: 108, arp: 'triangle', lead: 'triangle', pad: 'sawtooth', bright: 2600, swing: 0.16, prog: 'dorian', groove: 'waltz', bassMode: 'root' },
  desert: { key: 50, bpm: 100, arp: 'square', lead: 'sawtooth', pad: 'triangle', bright: 1900, swing: 0.08, prog: 'phrygian', groove: 'tribal', bassMode: 'fifths' },
  city: { key: 54, bpm: 118, arp: 'sawtooth', lead: 'square', pad: 'sawtooth', bright: 3400, swing: 0, prog: 'synth', groove: 'four', bassMode: 'octaves' },
  industrial: { key: 52, bpm: 124, arp: 'square', lead: 'sawtooth', pad: 'sawtooth', bright: 1500, swing: 0, prog: 'tense', groove: 'half', bassMode: 'root' },
  menu: { key: 57, bpm: 92, arp: 'triangle', lead: 'triangle', pad: 'sawtooth', bright: 2200, swing: 0, prog: 'calm', groove: 'four', bassMode: 'root' },
};
const GROOVES = {
  four: { kick: [[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0]], snare: [[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]] },
  half: { kick: [[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]], snare: [[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]] },
  waltz: { kick: [[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0]], snare: [[0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1]] },
  tribal: { kick: [[1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0]], snare: [[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0]] },
};
// 16-step patterns per layer (1 = hit). Several variants so loops do not feel static
const KICK = [[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0]];
const SNARE = [[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]];
const HAT = [[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1]];
const ARP = [[0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3], [0, 2, 1, 3, 0, 2, 1, 3, 3, 2, 1, 0, 3, 2, 1, 0], [0, 0, 2, 0, 1, 0, 3, 0, 0, 0, 2, 0, 3, 2, 1, 0]];
const LEAD = [[7, -1, -1, 5, 3, -1, 2, -1, 0, -1, -1, -1, 2, -1, 3, -1], [12, -1, 10, -1, 7, -1, -1, -1, 8, -1, 7, -1, 5, -1, 3, -1], [0, -1, 3, -1, 7, -1, 10, -1, 12, -1, -1, -1, 10, -1, 7, -1]];

export class Music {
  constructor(sfx) { this.sfx = sfx; this.ctx = null; this.volume = 0.5; this.mood = 'menu'; this.style = STYLES.menu; this.intensity = 0; this.target = 0; this.step = 0; this.bar = 0; this.next = 0; this.timer = null; this.enabled = true; }
  ensure() {
    if (this.ctx || !this.sfx.ctx) return !!this.ctx;
    const c = this.ctx = this.sfx.ctx; this.out = c.createGain(); this.out.gain.value = this.volume * 0.55; this.duckG = c.createGain(); this.duckG.gain.value = 1;
    // an echo timed to three sixteenth notes; kick and bass stay dry so the low end does not smear
    const dl = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(); this.delay = dl; dl.delayTime.value = 0.27; fb.gain.value = 0.3; lp.type = 'lowpass'; lp.frequency.value = 2400;
    this.wet = c.createGain(); this.wet.gain.value = 0.28; this.wet.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.out);
    // music runs through the game's mix bus (compressor, low-health muffle) when there is one
    this.out.connect(this.duckG); this.duckG.connect(this.sfx.musicIn || c.destination);
    // per-layer busses so intensity can fade them smoothly
    this.bus = {}; for (const k of ['pad', 'bass', 'arp', 'lead', 'kick', 'snare', 'hat']) { const g = c.createGain(); g.gain.value = 0; g.connect(this.out); if (k === 'pad' || k === 'arp' || k === 'lead' || k === 'snare') g.connect(this.wet); this.bus[k] = g; }
    this.timer = setInterval(() => this.pump(), 25); this.next = c.currentTime + 0.1;
    return true;
  }
  setVolume(v) { this.volume = v; if (this.out) this.out.gain.setTargetAtTime(this.enabled ? v * 0.55 : 0, this.ctx.currentTime, 0.2); }
  setEnabled(on) { this.enabled = on; this.setVolume(this.volume); }
  // mood: what kind of moment it is. theme: the map theme (snow, desert, city, industrial)
  setMood(mood, theme) {
    if (!this.ensure()) { this.mood = mood; return; }
    const changed = mood !== this.mood; this.mood = mood; if (theme) this.style = STYLES[theme] || STYLES.menu; else if (mood === 'menu') this.style = STYLES.menu;
    if (changed && (mood === 'victory' || mood === 'defeat')) this.stinger(mood === 'victory');
    if (changed) { this.bar = 0; this.step = 0; }
    if (this.delay) this.delay.delayTime.setTargetAtTime(Math.min(0.9, 3 * 60 / this.style.bpm / 4), this.ctx.currentTime, 0.1);
  }
  // duck the music under voice lines and ultimates
  duck(amount = 0.4, secs = 2) { if (!this.duckG) return; const t = this.ctx.currentTime; this.duckG.gain.cancelScheduledValues(t); this.duckG.gain.setTargetAtTime(amount, t, 0.08); this.duckG.gain.setTargetAtTime(1, t + secs, 0.5); }
  // short musical cues for big moments
  cue(kind) {
    if (!this.ensure()) return; const c = this.ctx, t = c.currentTime + 0.03, key = this.style.key;
    const seqs = { firstBlood: [[0, 0.12], [7, 0.12], [12, 0.3]], checkpoint: [[0, 0.15], [4, 0.15], [7, 0.15], [12, 0.45]], capture: [[7, 0.12], [12, 0.12], [16, 0.4]], wipe: [[0, 0.1], [3, 0.1], [7, 0.1], [12, 0.1], [15, 0.5]], lost: [[12, 0.2], [8, 0.2], [7, 0.5]] };
    let at = t; for (const [n, d] of seqs[kind] || []) { this.osc('sawtooth', NOTE(key + 12 + n), at, d + 0.2, 0.08, 'lead', { attack: 0.01, release: 0.18, filter: 3200 }); this.osc('triangle', NOTE(key + n), at, d + 0.25, 0.1, 'bass', { attack: 0.01, release: 0.2 }); at += d; }
    for (const k of ['lead', 'bass']) this.bus[k].gain.setTargetAtTime(Math.max(0.5, this.bus[k].gain.value), t, 0.02);
  }
  setIntensity(v) { this.target = Math.max(0, Math.min(1, v)); }
  levels() {
    const i = this.intensity, m = this.mood;
    if (m === 'menu') return { pad: 0.5, bass: 0.35, arp: 0.25, lead: 0.18, kick: 0, snare: 0, hat: 0.08 };
    if (m === 'select') return { pad: 0.5, bass: 0.45, arp: 0.35, lead: 0.15, kick: 0.45, snare: 0, hat: 0.22 };
    if (m === 'potg') return { pad: 0.55, bass: 0.5, arp: 0.4, lead: 0.35, kick: 0.6, snare: 0.45, hat: 0.3 };
    if (m === 'victory') return { pad: 0.6, bass: 0.45, arp: 0.35, lead: 0.4, kick: 0.35, snare: 0.2, hat: 0.2 };
    if (m === 'defeat') return { pad: 0.55, bass: 0.35, arp: 0.12, lead: 0.2, kick: 0, snare: 0, hat: 0 };
    if (m === 'overtime') return { pad: 0.45, bass: 0.6, arp: 0.5, lead: 0.3, kick: 0.75, snare: 0.6, hat: 0.4 };
    // in a match: near silence while nothing is happening (footsteps matter), layers arrive with the fight
    return { pad: 0.08 + i * 0.25, bass: Math.max(0, i - 0.15) * 0.55, arp: Math.max(0, i - 0.4) * 0.6, lead: Math.max(0, i - 0.72) * 1.0, kick: Math.max(0, i - 0.3) * 0.85, snare: Math.max(0, i - 0.5) * 0.9, hat: Math.max(0, i - 0.35) * 0.45 };
  }
  pump() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    this.intensity += (this.target - this.intensity) * 0.02;
    const lv = this.levels(); for (const k in this.bus) this.bus[k].gain.setTargetAtTime(lv[k], c.currentTime, 0.6);
    const st = this.style, bpm = st.bpm * (this.mood === 'overtime' ? 1.12 : this.mood === 'defeat' ? 0.8 : 1), dur = 60 / bpm / 4;
    while (this.next < c.currentTime + 0.15) { this.tick(this.next, dur); const sw = this.step % 2 ? -st.swing : st.swing; this.next += dur * (1 + sw); this.step = (this.step + 1) % 16; if (this.step === 0) this.bar++; }
  }
  prog() { return PROGS[this.mood === 'overtime' ? 'tense' : this.mood === 'victory' ? 'triumph' : this.mood === 'defeat' ? 'somber' : this.mood === 'menu' ? 'calm' : this.style.prog || 'heroic']; }
  tick(t, dur) {
    const st = this.style, prog = this.prog(), [root, q] = prog[Math.floor(this.bar / 2) % prog.length], chord = CHORD[q], key = st.key, s = this.step, v = this.bar % 4;
    const base = key + root - 12;
    if (s === 0 && this.bar % 2 === 0) for (const iv of chord.slice(0, 3)) this.pad(t, NOTE(base + 12 + iv), dur * 32, st);
    if (st.bassMode === 'octaves') { if (s % 2 === 0) this.bass(t, NOTE(base - 12 + (s % 4 === 2 ? 12 : 0)), dur * 1.6); }
    else if (s % 4 === 0 || (s === 14 && v % 2)) this.bass(t, NOTE(base - 12 + (st.bassMode === 'fifths' && s % 8 === 4 ? 7 : s === 8 && v === 3 ? 7 : 0)), dur * (s === 14 ? 2 : 3.5));
    const ap = ARP[(this.bar >> 1) % ARP.length]; this.pluck(t, NOTE(base + 24 + chord[ap[s]]), dur * 1.6, st.arp, st.bright, 'arp');
    // the lead lands on chord tones on the strong steps, so it never clashes with the harmony
    let ld = LEAD[(this.bar >> 2) % LEAD.length][s];
    if (ld >= 0 && this.bar % 4 >= 2) { if (s % 4 === 0) { const rel = ((ld - root) % 12 + 12) % 12, tones = [...chord, 12 + chord[1]]; const best = tones.reduce((a, b) => (Math.abs(b - rel) < Math.abs(a - rel) ? b : a)); ld = root + best + (ld >= 12 ? 12 : 0) - (root + best > 14 ? 12 : 0); } this.pluck(t, NOTE(key + 12 + ld), dur * 3.2, st.lead, st.bright * 1.2, 'lead'); }
    const G = GROOVES[st.groove] || GROOVES.four;
    if (G.kick[v % 2][s]) this.kick(t); if (G.snare[(v >> 1) % 2][s]) this.snare(t); if (HAT[v % 2][s]) this.hat(t, s % 4 === 2 ? 0.7 : 0.4);
  }
  osc(type, f, t, d, gain, bus, { attack = 0.01, release = 0.12, filter = 0, detune = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.setValueAtTime(gain, Math.max(t + attack, t + d - release)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let node = o; if (filter) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filter; lp.Q.value = 0.8; o.connect(lp); node = lp; }
    node.connect(g); g.connect(this.bus[bus]); o.start(t); o.stop(t + d + 0.05);
  }
  pad(t, f, d, st) { for (const det of [-9, 7]) this.osc(st.pad, f, t, d, 0.05, 'pad', { attack: 0.8, release: 1.4, filter: 1100, detune: det }); }
  bass(t, f, d) { this.osc('triangle', f, t, d, 0.22, 'bass', { attack: 0.01, release: 0.1, filter: 600 }); this.osc('sine', f / 2, t, d, 0.16, 'bass', { attack: 0.01, release: 0.1 }); }
  pluck(t, f, d, type, bright, bus) { this.osc(type, f, t, d, bus === 'lead' ? 0.09 : 0.06, bus, { attack: 0.005, release: d * 0.8, filter: bright }); }
  kick(t) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(this.bus.kick); o.start(t); o.stop(t + 0.32); }
  noise(t, d, gain, type, freq, bus) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.sfx.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(this.bus[bus]); s.start(t, Math.random() * 1.5, d + 0.02); }
  snare(t) { this.noise(t, 0.18, 0.5, 'bandpass', 1800, 'snare'); this.osc('triangle', 190, t, 0.1, 0.18, 'snare', { attack: 0.002, release: 0.08 }); }
  hat(t, a) { this.noise(t, 0.05, 0.25 * a, 'highpass', 7000, 'hat'); }
  stinger(win) {
    const c = this.ctx, t = c.currentTime + 0.05, key = this.style.key, seq = win ? [0, 4, 7, 12, 16, 19, 24] : [12, 10, 7, 3, 0];
    seq.forEach((n, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = win ? 'sawtooth' : 'triangle'; o.frequency.value = NOTE(key + n); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; g.gain.setValueAtTime(0.0001, t + i * 0.11); g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.11 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + (i === seq.length - 1 ? 2.2 : 0.5)); o.connect(lp); lp.connect(g); g.connect(this.out); g.connect(this.wet); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 2.4); });
  }
}
