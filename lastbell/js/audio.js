/* LAST BELL — tiny procedural audio: drone, wind, bell, paper, dice, static. */
(function (root) {
  let ac = null, master, droneNodes = [], muted = false, wind;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    // drone: detuned low saws through lowpass
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g = ac.createGain(); g.gain.value = 0.07;
    [55, 55.4, 82.6, 110.3].forEach((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); droneNodes.push(o); });
    lp.connect(g); g.connect(master);
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = ac.createGain(); lg.gain.value = 90; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    // wind: filtered noise
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ac.createBufferSource(); n.buffer = buf; n.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6; wind = ac.createGain(); wind.gain.value = 0.05;
    n.connect(bp); bp.connect(wind); wind.connect(master); n.start();
    const l2 = ac.createOscillator(); l2.frequency.value = 0.11; const lg2 = ac.createGain(); lg2.gain.value = 250; l2.connect(lg2); lg2.connect(bp.frequency); l2.start();
  }
  function tone(f, dur, type, vol, when, slide) {
    if (!ac) return; const t = ac.currentTime + (when || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, freq) {
    if (!ac) return; const b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq || 1500;
    s.buffer = b; g.gain.value = vol || 0.15; s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  const sfx = {
    bell() { [220, 330.5, 441, 662].forEach((f, i) => tone(f, 3.5, 'sine', 0.16 / (i + 1), 0)); },
    paper() { noise(0.18, 0.12, 2500); },
    door() { tone(90, 0.25, 'square', 0.1, 0, 50); noise(0.15, 0.08, 400); },
    static() { noise(1.2, 0.2, 800); },
    hit() { tone(70, 0.3, 'sawtooth', 0.25, 0, 30); noise(0.1, 0.2, 300); },
    chime() { tone(660, 0.9, 'triangle', 0.1); tone(990, 1.1, 'sine', 0.06, 0.08); },
    click() { tone(520, 0.05, 'square', 0.04); },
    dice() { for (let i = 0; i < 6; i++) noise(0.04, 0.12, 1800 + Math.random() * 1500), 0; for (let i = 1; i < 6; i++) setTimeout(() => noise(0.04, 0.1, 2000), i * 70); },
    good() { tone(523, 0.25, 'triangle', 0.14); tone(784, 0.5, 'triangle', 0.14, 0.12); },
    bad() { tone(196, 0.5, 'sawtooth', 0.1, 0, 120); tone(147, 0.6, 'sawtooth', 0.1, 0.1, 90); }
  };
  root.Sound = {
    init, play(n) { if (ac && sfx[n]) sfx[n](); },
    toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; return muted; },
    get muted() { return muted; },
    mood(m) { if (!ac) return; wind.gain.linearRampToValueAtTime(m === 'ember' ? 0.01 : m === 'dusk' ? 0.1 : 0.05, ac.currentTime + 2); }
  };
})(window);
