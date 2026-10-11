// Clock and calendar. One in-game minute passes every MINUTE_SECONDS of real time while the world runs.
export const MINUTE_SECONDS = 0.45;
export const DAY_START = 6 * 60, DAY_END = 26 * 60; // 6:00 AM .. 2:00 AM
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_DAYS = 28;
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// state.time = { day: 1.., minutes } ; day 1 = Monday, Spring 1, Year 1
export const seasonOf = (day) => SEASONS[Math.floor((day - 1) / SEASON_DAYS) % 4];
export const dateOf = (day) => ((day - 1) % SEASON_DAYS) + 1;
export const yearOf = (day) => Math.floor((day - 1) / (SEASON_DAYS * 4)) + 1;
export const weekdayOf = (day) => (day - 1) % 7; // 0 = Monday
export const isWeekend = (day) => weekdayOf(day) >= 5;
export const dayKey = (day) => `${seasonOf(day)}-${dateOf(day)}`;
export const parseHM = (s) => { if (typeof s === 'number') return s; const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };

export function clockText(m) {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
export const dateText = (day) => `${WEEKDAYS[weekdayOf(day)]} ${seasonOf(day)[0].toUpperCase()}${seasonOf(day).slice(1)} ${dateOf(day)}`;

// Part of day, used by dialogue, lighting and schedules.
export function partOfDay(m) {
  const h = (m / 60) % 24;
  if (h < 6 || h >= 22) return 'night';
  if (h < 11) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// Weather is rolled each morning from the season and a seeded rng.
export const WEATHER = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'windy'];
export function rollWeather(rng, day) {
  const s = seasonOf(day), r = rng();
  if (dateOf(day) === 1) return 'sunny';
  if (s === 'winter') return r < 0.35 ? 'snow' : r < 0.55 ? 'cloudy' : 'sunny';
  if (s === 'summer') return r < 0.12 ? 'storm' : r < 0.22 ? 'rain' : 'sunny';
  if (s === 'autumn') return r < 0.25 ? 'rain' : r < 0.4 ? 'windy' : r < 0.55 ? 'cloudy' : 'sunny';
  return r < 0.22 ? 'rain' : r < 0.35 ? 'cloudy' : 'sunny';
}
