/* LAST BELL — procedural audio: generative music per scene, ambience beds, footsteps and UI/check sfx.
   Everything is synthesised with WebAudio; nothing is downloaded. Starts after the first user gesture. */
(function (root) {
  'use strict';
  let ac = null, master, comp, musicBus, sfxBus, ambBus, revIn, noiseBuf;
  const st = { muted: false, music: 0.7, sfx: 0.8, amb: 0.7 };
  try { Object.assign(st, JSON.parse(localStorage.getItem('lastbell_audio') || '{}')); } catch (e) {}
  const saveSt = () => { try { localStorage.setItem('lastbell_audio', JSON.stringify(st)); } catch (e) {} };
  const rnd = (a, b) => a + Math.random() * (b - a), pickOf = (a) => a[Math.floor(Math.random() * a.length)];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SC = { minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10], major: [0, 2, 4, 5, 7, 9, 11], phryg: [0, 1, 3, 5, 7, 8, 10] };
  const deg = (scale, d) => SC[scale][((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

  // ---- scenes: root MIDI, scale, chord roots (scale degrees), tempo, beats per bar, layer levels, ambience bed
  const SCENES = {
    title:     { root: 50, scale: 'minor', prog: [0, 5, 3, 4], bpm: 64, beats: 3, L: { pad: .9, bass: .8, pluck: .6, acc: .8, mel: .9, brush: .5 }, amb: 'wind' },
    theatre:   { root: 47, scale: 'minor', prog: [0, 3, 5, 4], bpm: 50, beats: 4, L: { pad: .5, bass: .0, pluck: .8, acc: 0, mel: .35, brush: 0 }, amb: 'theatre' },
    canteen:   { root: 53, scale: 'dorian', prog: [0, 3, 0, 4], bpm: 84, beats: 3, L: { pad: .25, bass: 1, pluck: .5, acc: 1, mel: .8, brush: 1 }, amb: 'canteen' },
    gym:       { root: 45, scale: 'phryg', prog: [0, 1, 0, 5], bpm: 46, beats: 4, L: { pad: .8, bass: .5, pluck: .15, acc: 0, mel: .12, brush: 0, bell: .6 }, amb: 'gym' },
    courtyard: { root: 50, scale: 'minor', prog: [0, 6, 5, 6], bpm: 56, beats: 4, L: { pad: .8, bass: .5, pluck: .45, acc: .3, mel: .45, brush: 0 }, amb: 'wind' },
    office:    { root: 48, scale: 'harm', prog: [0, 0, 3, 4], bpm: 60, beats: 4, L: { pad: .35, bass: .3, pluck: .5, acc: 0, mel: .22, brush: 0 }, amb: 'office' },
    boiler:    { root: 43, scale: 'dorian', prog: [0, 3, 6, 3], bpm: 58, beats: 4, L: { pad: .75, bass: .9, pluck: .55, acc: .3, mel: .5, brush: .3 }, amb: 'boiler' },
    end_static:        { root: 50, scale: 'major', prog: [0, 4, 5, 3], bpm: 72, beats: 4, L: { pad: 1, bass: .8, pluck: .7, acc: 1, mel: 1, brush: .4, choir: 1 }, amb: null },
    end_ledger:        { root: 48, scale: 'dorian', prog: [0, 3, 0, 6], bpm: 60, beats: 4, L: { pad: .8, bass: .7, pluck: .8, acc: .6, mel: .8, brush: .2 }, amb: 'boiler' },
    end_good_student:  { root: 50, scale: 'harm', prog: [0, 0, 4, 0], bpm: 88, beats: 4, L: { pad: .5, bass: .8, pluck: .2, acc: .2, mel: .5, brush: 1 }, amb: 'office' },
    end_quiet:         { root: 45, scale: 'minor', prog: [0, 5, 3, 0], bpm: 48, beats: 4, L: { pad: .35, bass: 0, pluck: 1, acc: 0, mel: .55, brush: 0 }, amb: 'wind' },
    end_arrested:      { root: 41, scale: 'phryg', prog: [0, 1, 0, 1], bpm: 52, beats: 4, L: { pad: 1, bass: .9, pluck: 0, acc: 0, mel: .1, brush: 0, bell: .3 }, amb: 'gym', tense: 0.9 },
    end_curfew:        { root: 47, scale: 'phryg', prog: [0, 0, 1, 0], bpm: 44, beats: 4, L: { pad: .8, bass: .6, pluck: 0, acc: 0, mel: 0, brush: 0, bell: 1 }, amb: 'wind', tense: 0.6 }
  };

  // ---- setup
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.3;
    master = ac.createGain(); master.gain.value = st.muted ? 0 : 0.85; master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); sfxBus = ac.createGain(); ambBus = ac.createGain();
    musicBus.gain.value = st.music * 0.7; sfxBus.gain.value = st.sfx; ambBus.gain.value = st.amb * 0.8;
    [musicBus, sfxBus, ambBus].forEach((b) => b.connect(master));
    // noise + reverb
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const len = Math.floor(ac.sampleRate * 2.6), imp = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = ac.createConvolver(); conv.buffer = imp; revIn = ac.createGain(); revIn.gain.value = 0.55;
    const revOut = ac.createGain(); revOut.gain.value = 0.7; revIn.connect(conv); conv.connect(revOut); revOut.connect(master);
    // tension layer (hidden until needed)
    tens = { g: ac.createGain(), o: [] }; tens.g.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    [55, 77.8, 116.5].forEach((f, i) => { const o = ac.createOscillator(); o.type = i ? 'sawtooth' : 'sine'; o.frequency.value = f; o.detune.value = rnd(-8, 8); o.connect(lp); o.start(); tens.o.push(o); });
    lp.connect(tens.g); tens.g.connect(musicBus);
    nextTime = ac.currentTime + 0.2;
    setInterval(tick, 90);
    if (want) scene(want);
  }
  let tens = null, cur = null, want = null, nextTime = 0, beat = 0, ambNodes = [], ambTimer = 0, melIdx = 4, lastNotes = [], tension = 0, lowHp = false, hbTime = 0, duck = false, tensBase = 0;

  function dest(send) { return send ? revIn : null; }
  function env(g, t, a, d, peak, end) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, dur, out, vol, a) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; env(g, t, a || 0.01, dur, vol);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + (a || 0.01) + dur + 0.1); return o;
  }
  function wet(node, amt) { const s = ac.createGain(); s.gain.value = amt; node.connect(s); s.connect(revIn); }

  // ---- instruments
  function iPad(t, midis, dur, vol) {
    midis.forEach((m) => {
      [-7, 6].forEach((dt, k) => {
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
        o.type = k ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(m); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = 700;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.07, t + dur * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.25);
        o.connect(f); f.connect(g); g.connect(musicBus); wet(g, 0.5); o.start(t); o.stop(t + dur * 1.3);
      });
    });
  }
  function iPluck(t, m, vol, out) {
    const g = ac.createGain(); out = out || musicBus;
    [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([mul, ty, v]) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = ty; o.frequency.value = mtof(m) * mul; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.2); });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.16, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    g.connect(out); wet(g, 0.7);
  }
  function iAcc(t, m, dur, vol) {
    const g = ac.createGain(), bp = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
    bp.type = 'bandpass'; bp.frequency.value = Math.min(1600, mtof(m) * 2.5); bp.Q.value = 0.9; lfo.frequency.value = 5.2; lg.gain.value = 7;
    lfo.connect(lg);
    [-5, 5].forEach((dt) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; lg.connect(o.detune); o.connect(bp); o.start(t); o.stop(t + dur + 0.4); });
    lfo.start(t); lfo.stop(t + dur + 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.06, t + 0.09); g.gain.setValueAtTime(vol * 0.055, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    bp.connect(g); g.connect(musicBus); wet(g, 0.35);
  }
  function iBass(t, m, dur, vol) { osc('sine', mtof(m), t, dur, musicBus, vol * 0.3, 0.02); osc('triangle', mtof(m), t, dur * 0.6, musicBus, vol * 0.1, 0.02); }
  function iBrush(t, vol) {
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 3500;
    g.gain.setValueAtTime(vol * 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); s.connect(f); f.connect(g); g.connect(musicBus); s.start(t, rnd(0, 2), 0.15);
  }
  function iBell(t, m, vol) {
    [[1, 1], [2.01, .5], [2.76, .35], [4.17, .2], [5.4, .12]].forEach(([r, v]) => osc('sine', mtof(m) * r, t, 3.2 / r + 0.4, musicBus, vol * 0.07 * v, 0.005));
    const w = ac.createGain(); w.gain.value = 0;
  }
  function iChoir(t, m, dur, vol) {
    [[700, 1], [1100, .6], [2400, .25]].forEach(([fq, v]) => {
      const g = ac.createGain(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 4;
      [-9, 0, 9].forEach((dt) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(bp); o.start(t); o.stop(t + dur * 1.3); });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.03 * v, t + dur * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.2); bp.connect(g); g.connect(musicBus); wet(g, 0.6);
    });
  }

  // ---- music scheduler
  function tick() {
    if (!ac || ac.state !== 'running') return;
    const now = ac.currentTime;
    if (nextTime < now - 1) nextTime = now + 0.1;
    while (cur && nextTime < now + 0.35) { playBeat(nextTime); nextTime += 60 / cur.bpm; beat++; }
    if (lowHp && now > hbTime) { heart(now + 0.02); hbTime = now + 1.05; }
    if (now > ambTimer) { ambEvent(); ambTimer = now + rnd(2.5, 7); }
  }
  function chordMidis(c, bar) {
    const d = c.prog[bar % c.prog.length], r = c.root;
    return { root: r + deg(c.scale, d), notes: [r + deg(c.scale, d), r + deg(c.scale, d + 2), r + deg(c.scale, d + 4)], d };
  }
  function playBeat(t) {
    const c = cur, L = c.L, bar = Math.floor(beat / c.beats), b = beat % c.beats, ch = chordMidis(c, bar), beatLen = 60 / c.bpm;
    if (b === 0) {
      if (L.pad) iPad(t, [ch.notes[0] + 12, ch.notes[1] + 12, ch.notes[2] + 12], beatLen * c.beats, L.pad);
      if (L.bass) iBass(t, ch.root - 12, beatLen * 1.6, L.bass);
      if (L.bell && Math.random() < 0.5) iBell(t + 0.05, ch.root + 24 + (Math.random() < .3 ? 6 : 0), L.bell);
      if (L.choir) iChoir(t, ch.root + 12, beatLen * c.beats, L.choir);
      if (L.acc > 0.5 && c.beats === 3) iAcc(t, ch.notes[1] + 12, beatLen * 0.9, L.acc * 0.7);
    } else {
      if (L.bass && c.beats === 3) iBass(t, ch.notes[b === 1 ? 2 : 1] - 12, beatLen * 0.5, L.bass * 0.6);   // oom-pah-pah
      if (L.acc > 0.5 && c.beats === 3) iAcc(t, ch.notes[b] + 12, beatLen * 0.55, L.acc * 0.9);
      if (L.brush && (b % 2 === 1 || c.beats === 3)) iBrush(t, L.brush);
    }
    if (c.beats === 4 && L.bass && b === 2) iBass(t, ch.notes[2] - 12, beatLen * 1.2, L.bass * 0.5);
    if (L.pluck && (b === 0 ? Math.random() < 0.6 : Math.random() < 0.18 * L.pluck)) iPluck(t + rnd(0, 0.03), ch.notes[Math.floor(rnd(0, 3))] + (Math.random() < 0.5 ? 12 : 24), L.pluck);
    if (L.mel && Math.random() < 0.30 * L.mel + (b === 0 ? 0.1 : 0)) {
      const step = pickOf([-2, -1, -1, 0, 1, 1, 2, 3]); melIdx = Math.max(0, Math.min(11, melIdx + step));
      const m = c.root + 12 + deg(c.scale, melIdx), dur = beatLen * pickOf([1, 1, 1.5, 2]);
      if (L.acc > 0.4) iAcc(t, m, dur, L.mel * 0.8); else iPluck(t, m + 12, L.mel * 0.9);
      if (Math.random() < 0.15) iPluck(t + beatLen * 0.5, m + 7, L.mel * 0.4);
    }
  }
  function heart(t) { [0, 0.28].forEach((d, i) => { osc('sine', 52, t + d, 0.16, sfxBus, i ? 0.35 : 0.5, 0.005); }); }

  // ---- ambience beds
  function noiseLoop(type, freq, q, gain, lfoHz, lfoDepth) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; g.gain.linearRampToValueAtTime(gain, ac.currentTime + 2.5); s.connect(f); f.connect(g); g.connect(ambBus); s.start(0, rnd(0, 2));
    const n = [s, g];
    if (lfoHz) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(f.frequency); l.start(); n.push(l); }
    return n;
  }
  function humLoop(freq, gain) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0; g.gain.linearRampToValueAtTime(gain, ac.currentTime + 2.5); o.connect(g); g.connect(ambBus); o.start(); return [o, g]; }
  function ambStart(kind) {
    ambStop();
    const A = ambNodes;
    if (kind === 'wind') { A.push(...noiseLoop('bandpass', 420, 0.5, 0.11, 0.08, 220)); A.push(...noiseLoop('highpass', 3500, 0.3, 0.008)); }
    else if (kind === 'theatre') { A.push(...noiseLoop('highpass', 4200, 0.3, 0.01)); A.push(...noiseLoop('lowpass', 160, 0.7, 0.07, 0.05, 40)); }
    else if (kind === 'canteen') { A.push(...noiseLoop('bandpass', 550, 0.45, 0.07, 0.31, 160)); A.push(...noiseLoop('bandpass', 1300, 0.6, 0.02, 0.17, 400)); A.push(...humLoop(120, 0.012)); }
    else if (kind === 'gym') { A.push(...humLoop(100, 0.028)); A.push(...humLoop(150.4, 0.012)); A.push(...noiseLoop('lowpass', 300, 0.6, 0.05, 0.06, 80)); }
    else if (kind === 'office') { A.push(...humLoop(50, 0.03)); A.push(...noiseLoop('highpass', 5000, 0.4, 0.006)); }
    else if (kind === 'boiler') { A.push(...noiseLoop('lowpass', 130, 0.8, 0.22, 0.09, 40)); A.push(...humLoop(48, 0.05)); A.push(...humLoop(96.5, 0.02)); }
    ambKind = kind;
  }
  let ambKind = null;
  function ambStop() { const old = ambNodes; ambNodes = []; old.forEach((n) => { try { if (n.gain) n.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2); if (n.stop) n.stop(ac.currentTime + 1.4); } catch (e) {} }); }
  function ambEvent() {
    if (!ambKind) return; const t = ac.currentTime + 0.05;
    if (ambKind === 'canteen') { if (Math.random() < 0.6) { const f = pickOf([2400, 3100, 1900]); osc('sine', f, t, 0.12, ambBus, 0.05, 0.002); osc('sine', f * 1.5, t, 0.08, ambBus, 0.03, 0.002); } else sfxNoise(t, 0.25, 0.04, 'bandpass', 700); }
    else if (ambKind === 'boiler') { const o = osc('sine', 190, t, 0.35, ambBus, 0.12, 0.003); o.frequency.exponentialRampToValueAtTime(110, t + 0.3); }
    else if (ambKind === 'gym') { const o = osc('sine', 900, t, 0.25, ambBus, 0.05, 0.002); o.frequency.exponentialRampToValueAtTime(500, t + 0.2); }
    else if (ambKind === 'theatre') { const o = osc('sawtooth', 130, t, 0.6, ambBus, 0.03, 0.2); o.frequency.exponentialRampToValueAtTime(85, t + 0.8); }
    else if (ambKind === 'wind') { if (Math.random() < 0.4) sfxNoise(t, 0.4, 0.04, 'bandpass', 3000); }
    else if (ambKind === 'office') { sfxNoise(t, 0.04, 0.18, 'highpass', 2500); }
  }

  // ---- sfx primitives
  function sfxNoise(t, dur, vol, type, freq, out) {
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = noiseBuf; f.type = type || 'highpass'; f.frequency.value = freq || 1500; f.Q.value = 0.8;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(out || sfxBus); s.start(t, rnd(0, 2), dur + 0.05);
  }
  function note(f, dur, type, vol, when, slide) { const t = ac.currentTime + (when || 0), o = osc(type || 'sine', f, t, dur, sfxBus, vol || 0.2, 0.008); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur); return o; }
  const SFX = {
    click() { note(520, 0.05, 'square', 0.05); sfxNoise(ac.currentTime, 0.03, 0.05, 'highpass', 4000); },
    hover() { note(900, 0.03, 'sine', 0.025); },
    open() { sfxNoise(ac.currentTime, 0.2, 0.1, 'bandpass', 1800); note(300, 0.12, 'sine', 0.05, 0.02, 240); },
    paper() { sfxNoise(ac.currentTime, 0.2, 0.13, 'highpass', 2500); sfxNoise(ac.currentTime + 0.07, 0.15, 0.08, 'highpass', 3500); },
    line() { sfxNoise(ac.currentTime, 0.04, 0.035, 'highpass', 5000); },
    whisper() { const t = ac.currentTime; sfxNoise(t, 0.5, 0.05, 'bandpass', rnd(1400, 2600)); note(rnd(180, 260), 0.45, 'sine', 0.02, 0, 150); },
    door() { note(90, 0.28, 'square', 0.12, 0, 50); sfxNoise(ac.currentTime, 0.2, 0.1, 'lowpass', 500); note(300, 0.1, 'triangle', 0.06, 0.18, 200); },
    pickup() { note(740, 0.2, 'triangle', 0.1); note(988, 0.35, 'triangle', 0.09, 0.07); note(1480, 0.4, 'sine', 0.04, 0.13); },
    chime() { note(660, 1, 'triangle', 0.1); note(990, 1.2, 'sine', 0.06, 0.1); note(1320, 1.2, 'sine', 0.035, 0.2); },
    xp() { [0, .06, .12, .18].forEach((d, i) => note(880 * Math.pow(1.26, i), 0.25, 'sine', 0.05, d)); },
    dice() { const t = ac.currentTime; for (let i = 0; i < 9; i++) { sfxNoise(t + i * 0.085 + rnd(0, .02), 0.05, 0.14 * (1 - i / 11), 'bandpass', rnd(1200, 3200)); note(rnd(300, 520), 0.04, 'triangle', 0.05 * (1 - i / 11), i * 0.085); } },
    good() { note(523, 0.3, 'triangle', 0.13); note(659, 0.3, 'triangle', 0.12, 0.1); note(784, 0.7, 'triangle', 0.13, 0.2); iPlayChord([67, 71, 74]); },
    bad() { note(220, 0.5, 'sawtooth', 0.09, 0, 150); note(165, 0.8, 'sawtooth', 0.09, 0.14, 110); sfxNoise(ac.currentTime, 0.2, 0.08, 'lowpass', 300); },
    crit() { [0, .08, .16, .24].forEach((d, i) => note(523 * Math.pow(1.25, i), 0.9, 'triangle', 0.09, d)); sfxNoise(ac.currentTime, 0.5, 0.05, 'highpass', 6000); },
    fumble() { note(110, 1, 'sawtooth', 0.14, 0, 55); note(116.5, 1, 'sawtooth', 0.1, 0); sfxNoise(ac.currentTime, 0.3, 0.14, 'lowpass', 220); },
    static() { sfxNoise(ac.currentTime, 1.3, 0.16, 'highpass', 900); sfxNoise(ac.currentTime, 0.9, 0.1, 'bandpass', 2200); },
    hit() { note(80, 0.3, 'sawtooth', 0.22, 0, 35); sfxNoise(ac.currentTime, 0.12, 0.18, 'lowpass', 400); },
    bell() { [0, 1, 2, 3].forEach((k) => { const t = ac.currentTime + k * 0.0; [[1, 1], [2.01, .5], [2.76, .3], [4.2, .15]].forEach(([r, v]) => osc('sine', 196 * r, t, 3.6 / r + 0.6, sfxBus, 0.13 * v, 0.004)); }); const w = ac.createGain(); },
    toast() { note(700, 0.12, 'sine', 0.035); },
    warn() { note(300, 0.3, 'square', 0.05, 0, 250); note(250, 0.4, 'square', 0.05, 0.18, 200); },
    thought() { note(440, 1.4, 'sine', 0.07); note(554, 1.4, 'sine', 0.06, 0.12); note(659, 1.6, 'sine', 0.05, 0.24); sfxNoise(ac.currentTime, 0.9, 0.025, 'bandpass', 5000); },
    gate() { note(60, 0.6, 'sawtooth', 0.14, 0, 40); sfxNoise(ac.currentTime, 0.5, 0.1, 'lowpass', 300); },
    typewriter() { sfxNoise(ac.currentTime, 0.02, 0.07, 'highpass', 3000); }
  };
  function iPlayChord(ms) { if (!ac) return; const t = ac.currentTime + 0.1; ms.forEach((m) => osc('triangle', mtof(m + 12), t, 1.4, sfxBus, 0.035, 0.02)); }
  const STEP = { wood: [900, 1.0], checker: [1700, 0.8], tile: [2200, 0.7], cobble: [1300, 0.9], concrete: [1000, 0.9] };
  let stepToggle = 0;
  function step(floor) {
    if (!ac) return; const [f, v] = STEP[floor] || STEP.wood, t = ac.currentTime;
    stepToggle ^= 1; sfxNoise(t, 0.06, 0.1 * v * (stepToggle ? 1 : 0.8), 'bandpass', f * (stepToggle ? 1 : 0.85));
    note(stepToggle ? 85 : 75, 0.07, 'sine', 0.07 * v);
  }

  // ---- public API
  function scene(id) {
    want = id; if (!ac) return; const c = SCENES[id] || SCENES.title;
    if (cur === c) return;
    cur = c; melIdx = 4; beat = 0; nextTime = Math.max(nextTime, ac.currentTime + 0.3);
    if (c.amb !== ambKind) ambStart(c.amb);
    tensBase = c.tense || 0; applyTension();
  }
  function applyTension() { if (!ac) return; const v = Math.max(tension, tensBase); tens.g.gain.linearRampToValueAtTime(Math.pow(v, 1.4) * 0.07, ac.currentTime + 1.5); }
  const api = {
    init, scene, step,
    play(n) { if (ac && SFX[n]) { try { SFX[n](); } catch (e) {} } },
    ending(id) { scene(id); },
    tension(surv, hp, morale) { tension = Math.max(0, Math.min(1, (surv - 25) / 75)); lowHp = hp <= 3 || morale <= 2; applyTension(); },
    duck(on) { if (!ac || duck === on) return; duck = on; musicBus.gain.linearRampToValueAtTime(st.music * (on ? 0.38 : 0.7), ac.currentTime + 0.6); },
    mood(m) { const map = { umber: 'theatre', warm: 'canteen', cold: 'gym', dusk: 'courtyard', sick: 'office', ember: 'boiler' }; scene(map[m] || 'title'); },
    toggle() { st.muted = !st.muted; if (master) master.gain.value = st.muted ? 0 : 0.85; saveSt(); return st.muted; },
    set(kind, v) {
      st[kind] = v; saveSt(); if (!ac) return;
      if (kind === 'music') musicBus.gain.value = v * (duck ? 0.38 : 0.7); if (kind === 'sfx') sfxBus.gain.value = v; if (kind === 'amb') ambBus.gain.value = v * 0.8;
    },
    get vol() { return st; },
    get muted() { return st.muted; }
  };
  root.Sound = api;
})(window);
