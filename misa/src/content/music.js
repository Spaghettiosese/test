// Procedural music tracks: play(step) returns notes for each eighth-note step ({ n: semitones from middle C, len, v, type }).
import { registerMany, features } from '../core/registry.js';

const pent = [0, 2, 4, 7, 9, 12, 14, 16];
const arp = (chords, beats = 8) => (step) => {
  const c = chords[Math.floor(step / beats) % chords.length], i = step % beats;
  const out = [];
  if (i === 0) out.push({ n: c[0] - 12, len: 6, v: 1.2, type: 'sine' });
  if (i % 2 === 0) out.push({ n: c[(i / 2) % c.length], len: 2, v: 0.8 });
  return out;
};
const melody = (chords, seed, beats = 8, rest = 0.45) => {
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const base = arp(chords, beats);
  return (step) => {
    const out = base(step);
    if (step % 2 === 0) { const x = rnd(); if (x > rest) out.push({ n: 12 + pent[Math.floor(rnd() * pent.length)], len: 2 + Math.floor(rnd() * 2), v: 0.9, type: 'square' }); }
    return out;
  };
};
const C = [0, 4, 7], Am = [-3, 0, 4], F = [-7, -3, 0], G = [-5, -1, 2], Dm = [2, 5, 9], Em = [4, 7, 11];
registerMany('track', {
  title: { bpm: 84, play: melody([C, Am, F, G], 7) },
  home: { bpm: 76, play: melody([F, C, Dm, G], 11, 8, 0.55) },
  town: { bpm: 104, play: melody([C, G, Am, F], 23) },
  school: { bpm: 112, play: melody([G, C, Em, F], 31, 8, 0.4) },
  cafe: { bpm: 92, play: melody([Dm, G, C, Am], 41, 8, 0.5) },
  beach: { bpm: 88, play: melody([C, F, C, G], 53, 8, 0.6) },
  night: { bpm: 60, play: arp([Am, F, C, G], 8) },
  minigame: { bpm: 126, play: melody([C, Am, Dm, G], 67, 4, 0.35) },
  festival: { bpm: 120, play: melody([C, F, G, C], 79, 4, 0.3) },
  shrine: { bpm: 66, play: melody([Am, Em, F, C], 89, 8, 0.7) },
  rain: { bpm: 70, play: arp([Am, Dm, F, Em], 8) },
});
features('Audio', [
  'Procedural soundtrack: a different tune for home, town, school, cafe, beach, shrine, night, festivals, minigames and the title',
  'Music changes automatically with the map and the time of night',
  'Separate music and sound volume settings',
  'Over 30 synthesized sound effects (doors, coins, splash, bite, reel, school bell, camera, page turn, level up...)',
]);
