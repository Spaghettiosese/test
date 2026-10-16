// Seasonal weather flavour (DESIGN 5.3.2): the early-summer rainy season, a typhoon day each year, heat waves,
// cherry blossom season, the first snow, festival days kept dry, a season-change card, and game.forecast(days).
// Flags: flag:typhoon + flag:noSchool (typhoon day), flag:heatwave, flag:sakura_season, flag:rainy_season, flag:first_snow.
import { register, get, features } from '../../core/registry.js';
import { seasonOf, dateOf, yearOf, rollWeather, SEASON_DAYS } from '../../core/time.js';
import { addCondKind } from '../../core/cond.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { drawText, drawTextC, wrap } from '../../font.js';
import { UI, rect, panel } from '../../ui/ui.js';
import { snowTexts } from './messages.js';

const YEAR = SEASON_DAYS * 4;
const abs = (y, season, d) => (y - 1) * YEAR + ['spring', 'summer', 'autumn', 'winter'].indexOf(season) * SEASON_DAYS + d;
const wfx = (game) => (game.state.weatherFx ||= { firstSnow: 0, snowYear: 0, card: 0, pending: [], flagsSet: {} });
const outdoorFest = (game, day) => (game.festivalsOn ? game.festivalsOn(day) : []).some((f) => !f.minor && (f.maps || []).some((m) => get('map', m) && get('map', m).outdoor));

export function typhoonDay(game, y) {
  const c = [...[23, 24, 25, 26].map((d) => abs(y, 'summer', d)), ...[2, 3, 4, 5, 8, 9].map((d) => abs(y, 'autumn', d))].filter((d) => !outdoorFest(game, d));
  const r = game.rngFor('typhoon', abs(y, 'spring', 1));
  return c[Math.floor(r() * c.length)];
}
const baseWeather = (game, day) => rollWeather(game.rngFor('weather', day), day);
export function firstSnowGuarantee(game, y) {
  for (let d = 1; d <= 7; d++) if (baseWeather(game, abs(y, 'winter', d)) === 'snow') return 0;
  return abs(y, 'winter', 8);
}
// The weather for `day` after seasonal rules, given the engine's roll `w`.
export function adjustWeather(game, day, w) {
  const s = seasonOf(day), d = dateOf(day), y = yearOf(day);
  if (day === typhoonDay(game, y)) return 'storm';
  if (s === 'summer' && d >= 2 && d <= 12) { const r = game.rngFor('tsuyu', day)(); w = r < 0.5 ? 'rain' : r < 0.7 ? 'cloudy' : w === 'storm' ? 'rain' : w; }
  if (s === 'winter' && day === firstSnowGuarantee(game, y)) w = 'snow';
  if (s === 'summer' && d >= 21 && w === 'storm') w = 'sunny';
  if (outdoorFest(game, day) && (w === 'rain' || w === 'storm')) w = 'cloudy';
  return w;
}
export const isHeatwave = (game, day, w) => seasonOf(day) === 'summer' && dateOf(day) >= 18 && w === 'sunny' && game.rngFor('heat', day)() < 0.5;

export function forecast(game, days = 7) {
  const out = [];
  for (let d = game.day; d < game.day + days; d++) {
    const w = d === game.day ? game.state.weather : d === game.day + 1 ? game.state.tomorrowWeather : adjustWeather(game, d, baseWeather(game, d));
    const fests = game.festivalsOn ? game.festivalsOn(d) : [];
    const notes = [];
    if (d === typhoonDay(game, yearOf(d))) notes.push('Typhoon warning');
    if (isHeatwave(game, d, w)) notes.push('Heat wave');
    if (seasonOf(d) === 'summer' && dateOf(d) >= 2 && dateOf(d) <= 12) notes.push('Rainy season');
    if (seasonOf(d) === 'spring' && dateOf(d) <= 14) notes.push('Cherry blossoms');
    out.push({ day: d, weather: w, festivals: fests.map((f) => f.name), note: notes[0] || '' });
  }
  return out;
}
addCondKind('heatwave', (g) => !!g.flag('heatwave'));

const SET = ['typhoon', 'noSchool', 'heatwave', 'sakura_season', 'rainy_season', 'first_snow'];
function applyDay(game, fresh) {
  const st = wfx(game), s = game.season, d = dateOf(game.day), y = yearOf(game.day);
  game.state.weather = adjustWeather(game, game.day, game.state.weather);
  game.state.tomorrowWeather = adjustWeather(game, game.day + 1, game.state.tomorrowWeather || baseWeather(game, game.day + 1));
  for (const k of SET) if (st.flagsSet[k] && st.flagsSet[k] !== game.day) { delete game.state.flags[k]; delete st.flagsSet[k]; }
  const set = (k) => { game.setFlag(k); st.flagsSet[k] = game.day; };
  if (game.day === typhoonDay(game, y)) { set('typhoon'); set('noSchool'); }
  if (isHeatwave(game, game.day, game.state.weather)) set('heatwave');
  if (s === 'spring' && d <= 14) set('sakura_season');
  if (s === 'summer' && d >= 2 && d <= 12) set('rainy_season');
  if (s === 'winter' && game.state.weather === 'snow' && st.snowYear !== y) { st.snowYear = y; st.firstSnow = game.day; set('first_snow'); st.pending.push('first_snow'); snowTexts(game); game.stat('firstSnows'); }
  if (!fresh) return;
  if (d === 1 && game.day > 1 && st.card !== game.day) { st.card = game.day; st.pending.push('season'); }
  if (game.flag('typhoon')) st.pending.push('typhoon');
  if (game.flag('heatwave')) game.toast('Heat wave today! Stay cool and drink something cold', 'i_sun');
  if (s === 'spring' && d === 2 && game.day > 1) game.toast('Cherry blossom season! The petals fall until Spring 14', 'i_leaf');
  if (s === 'summer' && d === 2) game.toast('The rainy season has begun. Keep an umbrella handy!', 'i_rain');
}

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const N = (text) => ({ t: 'say', who: null, mood: null, text });
const scene = (name) => [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name }, { t: 'fade', to: 0, dur: 0.6 }];
const end = [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }];
const SEASON_LINE = { spring: 'Spring is here. Pink petals, new notebooks, new beginnings.', summer: 'Summer! No school, long days, and the sea is warm enough to swim.', autumn: 'Autumn. The hills turn red and gold, and everything smells like roasted sweet potatoes.', winter: 'Winter. Frost on the windows, and cocoa every night.' };
export const SCENES = {
  season: (g) => [...scene('season_card'), N(`${g.season[0].toUpperCase()}${g.season.slice(1)}, year ${yearOf(g.day)}.`), say('misa', 'happy', SEASON_LINE[g.season]), ...end],
  first_snow: () => [...scene('first_snow'), say('misa', 'surprised', 'Mochi, wake up! It\'s snowing! The first snow of the winter!'), { t: 'say', who: 'mochi', mood: 'surprised', text: 'Mrrow?!' }, say('misa', 'happy', 'Everything is white... the lane, the garden, Goro\'s pumpkins. It\'s like a new town.'), { t: 'mood', n: 12 }, ...end],
  typhoon: () => [...scene('typhoon'), N('A typhoon is passing over Hoshimori Bay. School is cancelled and the shops are shuttered.'), say('misa', 'neutral', 'Listen to that wind... The whole house is creaking.'), say('misa', 'happy', 'Okay. Blanket fort, cocoa, and Mochi. Indoor things feel twice as cozy today.'), { t: 'mood', n: 6 }, ...end],
};
for (const [id, fn] of Object.entries(SCENES)) register('script', `ev_weather_${id}`, { steps: fn });

register('stateSlice', 'weatherFx', { default: () => ({ firstSnow: 0, snowYear: 0, card: 0, pending: [], flagsSet: {} }) });
register('worldTick', 'weather_fx', {
  update(dt, world, game) {
    const st = wfx(game);
    if (st.pending.length && game.scenes.top === world && !world.busy && !world.fade) { const id = st.pending.shift(); if (SCENES[id]) game.run(SCENES[id](game)); }
  },
});
// Sakura season: petal drifts gather on outdoor paths.
register('worldLayer', 'sakura_drifts', {
  below(g, world, game) {
    if (!game.flag('sakura_season') || !world.map.def.outdoor) return;
    const m = world.map, x0 = Math.floor(world.cam.x / 32), y0 = Math.floor(world.cam.y / 32);
    for (let ty = y0; ty < y0 + 9 && ty < m.h; ty++) for (let tx = x0; tx < x0 + 12 && tx < m.w; tx++) {
      const t = m.tiles[ty] && m.tiles[ty][tx];
      if (!t || t.solid || t.ground === 'water' || t.ground === 'ocean') continue;
      const h = ((tx * 73856093) ^ (ty * 19349663) ^ (game.day * 83492791)) >>> 0;
      if (h % 7) continue;
      const sx = world.sx(tx * 16), sy = world.sy(ty * 16);
      for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#f4a8c0' : '#ffd0e0'; g.fillRect(sx + 6 + ((h >> k) % 20), sy + 10 + ((h >> (k + 3)) % 14), 2, 1); }
    }
  },
});

const WICON = { sunny: 'i_sun', cloudy: 'i_cloud', rain: 'i_rain', storm: 'i_storm', snow: 'i_snow', windy: 'i_wind' };
const WNAME = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', storm: 'Storm', snow: 'Snow', windy: 'Windy' };
register('phoneApp', 'forecast', {
  name: 'Weather', icon: 'i_sun', order: 45,
  update() {},
  draw(g, game, app) {
    const { x, y } = app.area, list = forecast(game, 7), DN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    drawText(g, '7-DAY FORECAST FOR HOSHIMORI BAY', x + 4, y + 2, UI.accent2, 1, null);
    list.forEach((f, i) => {
      const cx = x + 2 + i * 41, cy = y + 12, today = i === 0;
      panel(g, cx, cy, 39, 92, today ? 'dark' : 'paper');
      drawTextC(g, today ? 'TODAY' : DN[(f.day - 1) % 7], cx + 20, cy + 5, today ? UI.gold : UI.ink, 1, null);
      drawTextC(g, `${seasonOf(f.day).slice(0, 3)} ${dateOf(f.day)}`, cx + 20, cy + 14, today ? UI.text : UI.dim, 1, null);
      const ic = WICON[f.weather]; if (ic && SPRITES[ic]) { const s = SPRITES[ic]; g.drawImage(sprite(ic), cx + 20 - Math.round(s.w / 2), cy + 30 - Math.round(s.h / 2)); }
      drawTextC(g, WNAME[f.weather] || f.weather, cx + 20, cy + 44, today ? UI.text : UI.ink, 1, null);
      wrap(f.festivals[0] || '', 9).slice(0, 3).forEach((l, k) => drawTextC(g, l, cx + 20, cy + 56 + k * 8, UI.accent, 1, null));
      if (f.note) wrap(f.note, 9).slice(0, 2).forEach((l, k) => drawTextC(g, l, cx + 20, cy + 78 + k * 7, f.note.startsWith('Typhoon') ? UI.bad : UI.good, 1, null));
    });
    const t = list[0], lines = [];
    if (game.flag('typhoon')) lines.push('Typhoon day: school is cancelled. Stay in and get cozy!');
    if (game.flag('heatwave')) lines.push('Heat wave: being outside tires you out faster.');
    if (game.flag('rainy_season')) lines.push('Rainy season: showers most days until Summer 12.');
    if (game.flag('sakura_season')) lines.push('Cherry blossom season: petals fall until Spring 14.');
    if (!lines.length) lines.push(t.weather === 'sunny' ? 'A lovely day to be outside.' : t.weather === 'rain' ? 'Rain waters the garden for you today.' : 'Have a cozy day!');
    lines.slice(0, 3).forEach((l, i) => drawText(g, l, x + 4, y + 112 + i * 9, UI.ink, 1, null));
    drawText(g, 'Forecasts past tomorrow may change.', x + 4, y + 160, UI.dim, 1, null);
  },
});

register('system', 'weather_fx', {
  init(game) {
    game.forecast = (days = 7) => forecast(game, days);
    game.bus.on('dayStart', () => applyDay(game, true));
    game.bus.on('gameStart', () => applyDay(game, false));
    game.bus.on('gameLoaded', () => applyDay(game, false));
    // heat waves tire you out outdoors; typhoon days make home tasks twice as cozy
    game.bus.on('hour', () => { const m = game.world && game.world.map; if (game.flag('heatwave') && m && m.def.outdoor && game.minutes < 18 * 60) { game.addEnergy(-2); if (game.flag('heatwave_warned') !== game.day) { game.setFlag('heatwave_warned', game.day); game.toast('Phew, it\'s hot! Outdoor time costs extra energy', 'i_sweat'); } } });
    game.bus.on('homeTask', () => { if (game.flag('typhoon')) { game.addMood(6); game.stat('typhoonCozy'); } });
  },
});

features('Calendar and weather', [
  'Early-summer rainy season: showers most days from Summer 2 to 12',
  'A typhoon day once a year in late summer or early autumn: storm, school cancelled, home tasks twice as cozy',
  'Heat waves in late summer: being outdoors costs extra energy',
  'Cherry blossom season (Spring 1-14): petal drifts gather along the paths outdoors',
  'First snow of the winter: a wake-up scene at the window and friends text you snow photos',
  'Festival days are kept dry: outdoor festivals are never rained out',
  'Season-change postcard card on the first morning of each season',
  'Weather app: a 7-day forecast with festivals, typhoon warnings, heat waves and seasonal notes',
]);
