// WebAudio sfx + a tiny procedural music engine. No asset files.
// Tracks are registered as data (register('track', id, {...})) so content can add music; see content/music.js.
import { get } from './core/registry.js';

let ac = null, master = null, sfxGain = null, musGain = null, vol = { music: 0.6, sfx: 0.8 };
const ready = () => {
  if (!ac) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return false;
    ac = new AC(); master = ac.createGain(); master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.connect(master); musGain = ac.createGain(); musGain.connect(master);
    applyVol();
  }
  if (ac.state === 'suspended') ac.resume();
  return true;
};
const applyVol = () => { if (sfxGain) { sfxGain.gain.value = vol.sfx; musGain.gain.value = vol.music * 0.7; } };
export const unlock = () => { try { ready(); } catch { /* audio is optional */ } };
export function setVolumes(s) { vol = { music: s.music ?? 0.6, sfx: s.sfx ?? 0.8 }; applyVol(); }

function tone(f, d = 0.1, type = 'square', v = 0.05, slide = 0, delay = 0, bus = sfxGain) {
  if (!ac || !bus) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, f + slide), t + d);
  gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(v, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(gn).connect(bus); o.start(t); o.stop(t + d + 0.05);
}
function noise(d = 0.2, v = 0.05, hp = 800, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay, n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
  s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; gn.gain.value = v;
  s.connect(f).connect(gn).connect(sfxGain); s.start(t);
}
const SFX = {
  blip: () => tone(660, 0.04, 'square', 0.02),
  select: () => { tone(520, 0.06, 'triangle', 0.06); tone(780, 0.08, 'triangle', 0.06, 0, 0.06); },
  back: () => { tone(500, 0.06, 'triangle', 0.05); tone(360, 0.08, 'triangle', 0.05, 0, 0.05); },
  scrub: () => tone(200 + Math.random() * 120, 0.05, 'sawtooth', 0.012),
  pop: () => tone(500 + Math.random() * 500, 0.06, 'sine', 0.04, 300),
  chime: () => [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.25, 'triangle', 0.05, 0, i * 0.09)),
  meow: () => { tone(620, 0.18, 'sine', 0.07, 280); tone(900, 0.2, 'sine', 0.05, -400, 0.16); },
  purr: () => tone(70, 0.4, 'sawtooth', 0.03),
  bell: () => { tone(880, 0.5, 'sine', 0.07); tone(660, 0.6, 'sine', 0.07, 0, 0.35); },
  schoolbell: () => [988, 784, 880, 587, 587, 880, 988, 784].forEach((f, i) => tone(f, 0.35, 'sine', 0.05, 0, i * 0.32)),
  wrong: () => tone(160, 0.18, 'square', 0.05, -40),
  pour: () => tone(300 + Math.random() * 60, 0.05, 'sine', 0.015),
  fold: () => tone(240, 0.07, 'triangle', 0.06, -60),
  star: () => [1200, 1600, 2000].forEach((f, i) => tone(f, 0.3, 'sine', 0.04, 0, i * 0.12)),
  thunder: () => { tone(60, 0.9, 'sawtooth', 0.08, -20); noise(1.2, 0.06, 80); },
  door: () => { noise(0.08, 0.05, 300); tone(180, 0.1, 'triangle', 0.04, -40, 0.05); },
  step: () => noise(0.04, 0.02, 1200),
  coin: () => { tone(988, 0.08, 'square', 0.04); tone(1319, 0.2, 'square', 0.04, 0, 0.07); },
  buy: () => { tone(660, 0.08, 'triangle', 0.05); tone(990, 0.15, 'triangle', 0.05, 0, 0.08); },
  splash: () => noise(0.3, 0.07, 400),
  cast: () => tone(900, 0.25, 'sine', 0.03, -700),
  bite: () => { tone(1200, 0.05, 'square', 0.05); tone(1200, 0.05, 'square', 0.05, 0, 0.1); },
  reel: () => tone(300 + Math.random() * 200, 0.03, 'square', 0.015),
  dig: () => noise(0.12, 0.05, 200),
  water: () => noise(0.25, 0.03, 2000),
  eat: () => { noise(0.05, 0.04, 900); noise(0.05, 0.04, 900, 0.12); },
  page: () => noise(0.12, 0.03, 3000),
  levelup: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'square', 0.035, 0, i * 0.08)),
  heart: () => { tone(784, 0.12, 'sine', 0.06); tone(1047, 0.25, 'sine', 0.06, 0, 0.1); },
  camera: () => { noise(0.05, 0.06, 2500); tone(1600, 0.05, 'square', 0.03, 0, 0.05); },
  whistle: () => tone(1800, 0.4, 'sine', 0.05, 200),
  snore: () => tone(90, 0.6, 'sawtooth', 0.02, 30),
  phone: () => { tone(1400, 0.07, 'square', 0.03); tone(1760, 0.07, 'square', 0.03, 0, 0.09); },
};
export const sfx = (n) => { try { if (ready() && SFX[n]) SFX[n](); } catch { /* audio is optional */ } };
export const hasSfx = (n) => !!SFX[n];
export const addSfx = (n, fn) => { SFX[n] = () => fn({ tone, noise }); };

// ---------- music ----------
let cur = null, beat = 0, nextAt = 0, step = 0;
const NOTE = (n) => 261.63 * Math.pow(2, n / 12);
export function tick(dt, game) {
  if (!ac || vol.music <= 0) return;
  const want = pickTrack(game);
  if (want !== (cur && cur.id)) { cur = want ? get('track', want) : null; step = 0; nextAt = ac.currentTime + 0.1; }
  if (!cur) return;
  while (nextAt < ac.currentTime + 0.12) {
    const spb = 60 / cur.bpm / 2; // eighth notes
    const notes = cur.play(step, cur);
    for (const n of notes || []) tone(NOTE(n.n), (n.len || 1) * spb * 1.6, n.type || cur.type || 'triangle', (n.v || 1) * 0.03, 0, nextAt - ac.currentTime, musGain);
    step++; nextAt += spb;
  }
}
function pickTrack(game) {
  const top = game.scenes.top;
  if (top && top.music) return top.music;
  if (game.sceneName && get('backdrop', game.sceneName) && get('backdrop', game.sceneName).music) return get('backdrop', game.sceneName).music;
  const map = game.world && game.world.map && game.world.map.def;
  if (!map || !top) return 'title';
  if (game.minutes >= 22 * 60) return 'night';
  if (map.music) return typeof map.music === 'function' ? map.music(game) : map.music;
  return 'home';
}
