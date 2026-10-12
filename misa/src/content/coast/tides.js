// Tides of Hoshimori Bay. Two tides a day on a 12 h 25 min cycle that slips about 50 minutes later each day,
// with spring tides (big swings) twice a season around days 14 and 28 and gentle neap tides in between, so low
// tide only uncovers the sandbar and the cave mouth on some days and at some times.
//
// Conditions:  'tide:low' | 'tide:mid' | 'tide:high' (several with |)   'lucky' (shrine luck today, see shrine.js)
// API:  tideAt(game, day?, minutes?) -> 'low'|'mid'|'high',  tideLevel(day, minutes) -> -1..1,
//       lowTideWindows(day) -> [[startMin, endMin], ...] within 6:00..26:00
import { register, features } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { clockText } from '../../core/time.js';

const PERIOD = 745;                          // minutes between low tides
const LOWEST = 13 * 1440 + 13 * 60;      // the lowest tide of spring: 13:00 on Spring 14
const LOW = -0.42, HIGH = 0.42;

// Strength of the swing: 1 on spring-tide days (14, 28), about 0.3 on neap days (7, 21).
export const tideRange = (day) => 0.65 + 0.35 * Math.cos((2 * Math.PI * (((day - 1) % 28) + 1 - 14)) / 14);
export function tideLevel(day, minutes) {
  const t = (day - 1) * 1440 + minutes;
  return -tideRange(day) * Math.cos((2 * Math.PI * (t - LOWEST)) / PERIOD);
}
export function tideAt(game, day = game.day, minutes = game.minutes) {
  const v = tideLevel(day, minutes);
  return v < LOW ? 'low' : v > HIGH ? 'high' : 'mid';
}
export function lowTideWindows(day) {
  const out = [];
  let start = null;
  for (let m = 6 * 60; m <= 26 * 60; m += 5) {
    const low = tideLevel(day, m) < LOW;
    if (low && start === null) start = m;
    if (!low && start !== null) { out.push([start, m]); start = null; }
  }
  if (start !== null) out.push([start, 26 * 60]);
  return out;
}
export const tideWord = { low: 'Low tide', mid: 'The tide is turning', high: 'High tide' };

addCondKind('tide', (game, arg) => String(arg || '').split('|').includes(tideAt(game)));

// Save data for the whole coast area.
register('stateSlice', 'coast', {
  default: () => ({
    daily: {},           // key -> day number (once-a-day actions)
    castle: null,        // { day, minutes, stage } the sandcastle on the beach
    fortune: null,       // { day, tier } today's fortune
    wishes: [],          // [{ week, text }] ema plaques
    wishWeek: -1,
    tied: 0,             // fortunes tied to the rope today
    tiedDay: 0,
    pools: {},           // tidepool critters seen
    rides: 0,            // boat rides taken
    luckyDay: 0,
    speedDay: 0,
  }),
});

// The tide table reads like a little almanac board on the harbour.
export function tideTableText(game) {
  const w = lowTideWindows(game.day).map(([a, b]) => `${clockText(a)} to ${clockText(b)}`);
  const now = tideWord[tideAt(game)];
  if (!w.length) return [`${now} right now.`, 'Neap tides today: the sea stays up all day. No sandbar.'];
  return [`${now} right now.`, `Low tide today: ${w.join(', ')}.`, 'At low tide the sandbar and the sea cave open up.'];
}

features('Coast & tides', [
  'Real tides: two a day, slipping later each day, with big spring tides around days 14 and 28 and calm neap tides between',
  'Tide table board on the harbour lists today\'s low tide times',
]);
