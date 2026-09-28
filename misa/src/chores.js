// Chore definitions, daily lists and rewards.
export const CHORES = {
  dishes: { name: 'Wash the dishes', short: 'Dishes', tiny: 'Dishes', mood: 8 },
  feed: { name: 'Feed Mochi', short: 'Feed Mochi', tiny: 'Feed', mood: 6 },
  sweep: { name: 'Sweep the living room', short: 'Sweep', tiny: 'Sweep', mood: 8 },
  laundry: { name: 'Fold the laundry', short: 'Laundry', tiny: 'Laundry', mood: 8 },
  plants: { name: 'Water the plants', short: 'Plants', tiny: 'Plants', mood: 8 },
};

export function dailyChores(rng, day = 1) {
  const pool = ['sweep', 'laundry', 'plants'].sort(() => rng() - 0.5);
  const n = Math.min(3, 1 + Math.ceil(day / 2));
  return ['dishes', 'feed', ...pool.slice(0, n)].map((id) => ({ id, done: false }));
}

export const starsFor = (score) => (score >= 0.85 ? 3 : score >= 0.6 ? 2 : 1);
export const isAllDone = (chores) => chores.length > 0 && chores.every((c) => c.done);
export const clockText = (m) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`;
};
