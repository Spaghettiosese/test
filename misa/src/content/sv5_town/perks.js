// Lasting perks and new interactions for the eight finished town projects (sv5): loop bus, garden harvests, recycling, library wing nook,
// skate park, seaside promenade, weather station and the night market shop. Each interaction is gated by the project's world object.
import { register, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { sellPrice } from '../economy/core.js';
import { S, once, N, say, call, clamp } from './state.js';
import { BUS_ARRIVE } from './projects.js';

const I = (id, name, cat, price, shape, c, desc, extra = {}) => register('item', id, { name, cat, price, buy: Math.round(price * 2.2 / 5) * 5, icon: itemIcon(shape, { c }), desc, ...extra });
I('snack_tp_candied_apple', 'Candied apple', 'food', 60, 'fruit', Rr.coral[2], 'A glossy red apple on a stick. The night market classic.', { tags: ['snack', 'sweet'], energy: 24, mood: 6 });
I('snack_tp_yakitori', 'Yakitori skewer', 'food', 75, 'bowl', Rr.wood[3], 'Charcoal chicken skewers with a sweet soy glaze.', { tags: ['snack'], energy: 30, mood: 4 });
I('gift_tp_paper_lantern', 'Night market lantern', 'gift', 70, 'star', Rr.butter[3], 'A little paper lantern that glows a warm gold.', { tags: ['gift'] });
I('gift_tp_glow_bracelet', 'Glow bracelet', 'gift', 50, 'toy', Rr.mint[3], 'It glows green for exactly one evening.', { tags: ['gift'] });
I('gift_tp_eco_bag', 'Eco bag', 'gift', 40, 'box', Rr.forest[3], 'A tote sewn from sorted scraps at the recycling centre.', { tags: ['gift'] });

// ---------------------------------------------------------------- Hoshimori Loop Bus
const STOPS = { town: 'Hoshimori Square', harbour: 'the harbour', park: 'Sakura Park', lane: 'Lantern Lane' };
export const LOOP_FARE = 20;
register('interaction', 'tp_loop_bus', { label: 'Hoshimori Loop bus', run: (g) => {
  const here = g.world && g.world.map ? g.world.map.id : null;
  if (g.minutes < 6 * 60 + 30 || g.minutes >= 22 * 60) return g.say(null, null, 'The loop bus has finished for tonight. First bus at 6:30 AM.');
  const go = (map) => [{ t: 'fade', to: 1, dur: 0.3 }, call((gg) => { if (!gg.spend(LOOP_FARE)) return null; gg.sfx('coin'); gg.advance(6); gg.stat('loopRides'); const [x, y] = BUS_ARRIVE[map]; return gg.warp(map, x, y, 'down'); }), { t: 'fade', to: 0, dur: 0.3 }];
  return g.run([{ t: 'choice', prompt: `Loop bus (${LOOP_FARE} coins)`, options: [...Object.entries(STOPS).filter(([m]) => m !== here).map(([m, n]) => ({ text: `To ${n}`, when: `money>=${LOOP_FARE}`, steps: go(m) })), { text: 'Not now', steps: [] }] }]);
} });

// ---------------------------------------------------------------- library wing
register('interaction', 'tp_wing_read', { label: 'Reading nook', run: (g) => {
  if (!once(g, 'tp_wing_day')) return g.say('misa', 'happy', 'I have read enough for one day. My eyes want a nap.');
  return g.run([{ t: 'fade', to: 1, dur: 0.4 }, call((gg) => { gg.advance(45); gg.addXP('study', 9); gg.addMood(6); gg.useEnergy(3); gg.stat('wingReads'); }), { t: 'fade', to: 0, dur: 0.4 }, say('misa', 'happy', 'The armchair swallowed me for an hour. I now know a great deal about lighthouses.')]);
} });

// ---------------------------------------------------------------- skate and play park
register('interaction', 'tp_skate_do', { label: 'Skate bowl', run: (g) => {
  const runs = (g.state.stats && g.state.stats.skateRuns) || 0, bonus = Math.min(0.4, runs * 0.02);
  if (g.energy < 6) return g.say('misa', 'sad', 'My legs are jelly. Maybe a snack first.');
  const trick = (name, p, mood) => [call((gg) => { const ok = gg.rngFor('skate' + gg.minutes + runs)() < clamp(p + bonus, 0.1, 0.95); gg.useEnergy(6); gg.advance(20); gg.stat('skateRuns'); if (once(gg, 'tp_skate_cap') || (gg.state.stats.skateRuns % 3 !== 0)) gg.addMood(ok ? mood : 2); gg.setFlag('tp_skate_ok', ok); }),
    { t: 'if', cond: 'flag:tp_skate_ok', then: [say('misa', 'happy', `${name} landed! The kids by the rail cheer.`)], else: [say('misa', 'surprised', `${name}... down! I am fine, I am fine. Nobody saw.`)] }];
  return g.run([{ t: 'choice', prompt: 'Skate bowl', options: [{ text: 'Ollie', steps: trick('Ollie', 0.6, 6) }, { text: 'Rail grind', steps: trick('Rail grind', 0.4, 8) }, { text: 'Kickflip', steps: trick('Kickflip', 0.25, 10) }, { text: 'Watch the kids', steps: [say('misa', 'happy', 'A tiny scooter kid just did a flip. Respect.')] }] }]);
} });

// ---------------------------------------------------------------- community garden
const HARVEST = { spring: ['crop_spinach', 'crop_cabbage'], summer: ['crop_tomato', 'crop_cucumber'], autumn: ['crop_pumpkin', 'crop_sweet_potato'], winter: ['crop_kale', 'crop_snow_pea'] };
register('interaction', 'tp_garden_tend', { label: 'Community garden', run: (g) => {
  if (!once(g, 'tp_garden_day')) return g.say('misa', 'happy', 'The beds are watered and the neighbours have already picked the ripe ones. Back tomorrow!');
  const [a, b] = HARVEST[g.season].filter((i) => get('item', i));
  return g.run([{ t: 'fade', to: 1, dur: 0.3 }, call((gg) => { gg.advance(40); gg.addXP('gardening', 8); if (a) gg.give(a, 2); if (b) gg.give(b, 1); S(gg).vol.pts += 1; gg.stat('gardenHarvests'); gg.addMood(4); }), { t: 'fade', to: 0, dur: 0.3 }, say('misa', 'happy', 'Weeding, watering and a fat harvest to share. The garden club waved me off with a bag.')]);
} });

// ---------------------------------------------------------------- recycling centre
const junk = (g) => all('item').filter((i) => (/^misc_/.test(i.id) || (i.tags || []).includes('junk')) && g.count(i.id) > 0 && !i.key);
register('interaction', 'tp_recycle_use', { label: 'Recycling centre', run: (g) => {
  const list = junk(g), n = list.reduce((a, i) => a + g.count(i.id), 0);
  return g.run([{ t: 'choice', prompt: `Recycling centre (${n} junk items in your bag)`, options: [
    { text: 'Sort and trade junk for coins', steps: [call((gg) => { const l = junk(gg); if (!l.length) return gg.say(null, null, 'Nothing to sort. The bins look disappointed.'); let coins = 0, c = 0; for (const i of l) { const k = gg.count(i.id); gg.take(i.id, k); coins += k * (sellPrice(gg, i.id) + 8); c += k; } gg.addMoney(coins); S(gg).vol.pts += Math.floor(c / 3); gg.stat('recycled', c); gg.say(null, null, `${c} items sorted. The clerk hands you ${coins} coins.`); })] },
    { text: 'Sew an eco bag (3 junk)', when: () => n >= 3, steps: [call((gg) => { let k = 3; for (const i of junk(gg)) { const t = Math.min(k, gg.count(i.id)); gg.take(i.id, t); k -= t; if (!k) break; } gg.give('gift_tp_eco_bag', 1); gg.addXP('crafting', 5); gg.stat('ecoBags'); })] },
    { text: 'Read the sorting guide', steps: [N('GREEN: food scraps. BLUE: glass and cans. YELLOW: paper. And one bin labelled MYSTERY, which is mostly socks.')] }, { text: 'Leave', steps: [] }] }]);
} });

// ---------------------------------------------------------------- seaside promenade
register('interaction', 'tp_prom_stroll', { label: 'Stroll the promenade', run: (g) => {
  if (!once(g, 'tp_prom_day')) return g.say('misa', 'happy', 'I already strolled today. The planters seem pleased with me.');
  const night = g.minutes >= 18 * 60;
  return g.run([{ t: 'fade', to: 1, dur: 0.4 }, call((gg) => { gg.advance(30); gg.addMood(night ? 14 : 9); gg.addEnergy(6); gg.stat('promStrolls'); }), { t: 'fade', to: 0, dur: 0.4 }, say('misa', 'happy', night ? 'Lamps, waves and a sky full of stars. This is what a promenade is for.' : 'Gulls, planters and the sound of ropes tapping masts. Lovely.')]);
} });

// ---------------------------------------------------------------- weather station
let forecastFn = null; import('../events/weather.js').then((m) => { forecastFn = m.forecast; }).catch(() => {});
export const outlook = (g, days = 14) => { try { return forecastFn ? forecastFn(g, days) : []; } catch (e) { return []; } };
register('interaction', 'tp_weather_read', { label: 'Weather station', run: (g) => {
  const l = outlook(g, 14), nm = (e) => String((e && (e.weather || e.w || e)) || '?');
  const txt = l.length ? l.slice(0, 7).map((e, i) => `${i === 0 ? 'Today' : `+${i}`}: ${nm(e)}`).join(', ') : `Tomorrow: ${g.state.tomorrowWeather || 'unknown'}`;
  return g.run([N('A brass dial, a rain gauge and a chalkboard written in a very neat hand.'), N(txt), say('misa', 'happy', 'It even predicts the wind. Pip would be jealous.')]);
} });
register('system', 'tp_weather_warn', { init(g) {
  g.bus.on('hour', () => {
    if (!g.state.flags.tp_weather_done || g.minutes < 20 * 60 || g.flag('tp_warned') === g.day) return;
    const w = g.state.tomorrowWeather; g.setFlag('tp_warned', g.day);
    if (w === 'storm' || w === 'snow') g.toast(`Weather station: ${w} expected tomorrow`, 'i_star');
  });
} });

// ---------------------------------------------------------------- night market
register('shop', 'tp_night', { name: 'Night Market', color: Rr.coral[2], buys: [], hours: ['17:00', '22:00'], days: [5, 6], when: 'flag:tp_night_done', greet: { default: ['Lanterns are lit, grills are hot. What will it be?', 'Everything tastes better under paper lanterns.'] },
  stock: ['snack_tp_candied_apple', 'snack_tp_yakitori', 'gift_tp_paper_lantern', 'gift_tp_glow_bracelet', 'snack_takoyaki', 'bev_lemonade'].filter((i) => get('item', i)) });
register('interaction', 'tp_night_shop', { label: 'Night market stall', run: (g) => new Promise((res) => g.open('shop', 'tp_night', res)) });

features('Town Growth', [
  'Loop bus perk: ride between the square, harbour, park and Lantern Lane for 20 coins from new stop signs',
  'Library wing perk: a reading nook that gives Study xp and a mood lift once a day',
  'Skate park perk: choose an ollie, rail grind or kickflip, improving with practice, with mood rewards',
  'Community garden perk: harvest seasonal vegetables every day and earn volunteer points',
  'Recycling centre perk: sort junk from your bag for coins and sew eco bags at the centre',
  'Seaside promenade perk: planters, benches and a calming stroll that restores mood and energy, best at night',
  'Weather station perk: read a week of forecasts at the tower and get an evening toast when storms or snow are coming',
  'Night market perk: weekend evenings bring lantern-lit stalls selling candied apples, yakitori, glow bracelets and paper lanterns',
]);

features('Town Growth', [
  "Sew an eco bag from three pieces of junk at the recycling centre",
  "Weather station storm warning: an evening toast when tomorrow brings a storm or snow",
]);
