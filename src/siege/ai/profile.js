// Difficulty and personality. A profile sets how fast a bot reacts, how well it aims, how
// much it hears and which tactical behaviours it is allowed to use.
export const DIFFICULTY = [
  { name: 'Recruit', reaction: 0.95, aimSpeed: 2.4, aimNoise: 0.055, hearing: 0.55, vision: 0.6, tactics: 0, grenades: 0.2, accuracy: 0.6, headshot: 0.03, peek: 0.2 },
  { name: 'Regular', reaction: 0.6, aimSpeed: 3.6, aimNoise: 0.034, hearing: 0.75, vision: 0.85, tactics: 1, grenades: 0.5, accuracy: 0.8, headshot: 0.08, peek: 0.5 },
  { name: 'Veteran', reaction: 0.4, aimSpeed: 5.2, aimNoise: 0.022, hearing: 1.0, vision: 1.1, tactics: 2, grenades: 0.8, accuracy: 1.0, headshot: 0.16, peek: 0.8 },
  { name: 'Elite', reaction: 0.27, aimSpeed: 7.4, aimNoise: 0.013, hearing: 1.2, vision: 1.35, tactics: 3, grenades: 1.0, accuracy: 1.15, headshot: 0.26, peek: 1.0 },
  { name: 'Realistic', reaction: 0.2, aimSpeed: 9.5, aimNoise: 0.008, hearing: 1.4, vision: 1.6, tactics: 3, grenades: 1.0, accuracy: 1.3, headshot: 0.36, peek: 1.0 },
];
// personality nudges one bot away from the profile so a squad does not move as one
export function personality(rand) {
  return { bold: 0.25 + rand() * 0.75, patience: 0.3 + rand() * 0.7, jitter: 0.8 + rand() * 0.4, lefty: rand() < 0.5 ? -1 : 1, nerve: 0.4 + rand() * 0.6 };
}
export function profileFor(level, rand) {
  const base = DIFFICULTY[Math.max(0, Math.min(DIFFICULTY.length - 1, level))];
  const p = personality(rand);
  return { ...base, p, reaction: base.reaction * p.jitter, aimSpeed: base.aimSpeed * (2 - p.jitter) };
}
