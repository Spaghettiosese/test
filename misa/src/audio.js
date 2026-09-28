// Tiny WebAudio sfx + a sparse, sleepy pentatonic "music box". No asset files.
let ac = null, musicOn = true, musicTimer = 0;
const ok = () => {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return false;
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return true;
};
function tone(f, d = 0.1, type = 'square', vol = 0.05, slide = 0, delay = 0) {
  if (!ok()) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  blip: () => tone(660, 0.04, 'square', 0.025),
  select: () => { tone(520, 0.06, 'triangle', 0.06); tone(780, 0.08, 'triangle', 0.06, 0, 0.06); },
  scrub: () => tone(200 + Math.random() * 120, 0.05, 'sawtooth', 0.012),
  pop: () => tone(500 + Math.random() * 500, 0.06, 'sine', 0.04, 300),
  chime: () => [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.25, 'triangle', 0.05, 0, i * 0.09)),
  meow: () => { tone(620, 0.18, 'sine', 0.07, 280); tone(900, 0.2, 'sine', 0.05, -400, 0.16); },
  purr: () => tone(70, 0.4, 'sawtooth', 0.03),
  bell: () => { tone(880, 0.5, 'sine', 0.07); tone(660, 0.6, 'sine', 0.07, 0, 0.35); },
  wrong: () => tone(160, 0.18, 'square', 0.05, -40),
  pour: () => tone(300 + Math.random() * 60, 0.05, 'sine', 0.015),
  fold: () => tone(240, 0.07, 'triangle', 0.06, -60),
  star: () => [1200, 1600, 2000].forEach((f, i) => tone(f, 0.3, 'sine', 0.04, 0, i * 0.12)),
  thunder: () => tone(60, 0.9, 'sawtooth', 0.08, -20),
};
export const sfx = (n) => { try { SFX[n] && SFX[n](); } catch { /* audio is optional */ } };
export const toggleMusic = () => (musicOn = !musicOn);
const SCALE = [0, 2, 4, 7, 9, 12, 14];
export function musicTick(dt, calm = false) {
  musicTimer -= dt;
  if (!musicOn || musicTimer > 0 || !ac) return;
  musicTimer = calm ? 1.1 : 0.7 + Math.random() * 0.5;
  const n = SCALE[Math.floor(Math.random() * SCALE.length)];
  try { tone(261.6 * Math.pow(2, n / 12), 0.9, 'triangle', 0.028); } catch { /* ignore */ }
}
