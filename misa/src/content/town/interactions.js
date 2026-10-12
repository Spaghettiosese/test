// Town interactions: benches (sit and let time pass), the bus between stops (fare, blinds wipe, ride card),
// the fountain (a coin toss for the day's luck), plus small things to poke: swings, snowmen, bike bells,
// signposts and shop windows. Placement helpers for the maps live at the bottom.
import { register, registerMany, get, features } from '../../core/registry.js';
import { RAMPS, hash, prop, sprH } from './lib.js';
import { LIGHT } from './props_street.js';
import { drawText, measure } from '../../font.js';

const day = (g) => g.day;

// ---------------- benches ----------------
const THOUGHTS = {
  town: ['The fountain sparkles. People hurry past with shopping bags.', 'Somewhere a radio is playing. The square hums along.'],
  park: ['Ducks paddle in slow circles. Nobody here is in a hurry.', 'The leaves whisper. I could stay here all day.'],
  lane: ['A cat watches me from the wall. We have an understanding.', 'Goro\'s wind chime tinkles down the lane.'],
  yard: ['Home. The garden smells like warm earth.', 'Mochi is probably napping in the window right now.'],
  school_grounds: ['Someone on the field shouts "Nice shot!"', 'The school bell sounds far away from out here.'],
  shotengai: ['Shop bells jingle. The smell of sweet bean buns drifts by.', 'The lanterns sway a little overhead.'],
};
const SEASONAL = { spring: 'Petals keep landing in my hair.', summer: 'The cicadas are so loud today.', autumn: 'Crunchy leaves everywhere. Perfect.', winter: 'My breath makes little clouds. Brrr, but cozy.' };
function benchThought(g) {
  const map = g.world && g.world.map ? g.world.map.id : 'town', pool = [...(THOUGHTS[map] || THOUGHTS.town), SEASONAL[g.season]];
  if (g.weather === 'rain') pool.push('The rain patters all around. It\'s peaceful, in a soggy way.');
  if (g.minutes >= 19 * 60) pool.push('The streetlights hum on, one by one. The stars are coming out.');
  return pool[Math.floor(g.rngFor('bench' + g.minutes)() * pool.length)];
}
function sit(minutes) {
  return [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'call', fn: (g) => {
    const s = g.state, k = 'town_benchRest';
    if (s.flags[k + 'Day'] !== day(g)) { s.flags[k + 'Day'] = day(g); s.flags[k] = 0; }
    const gain = Math.max(0, Math.min(Math.round(minutes / 5), 24 - s.flags[k]));
    s.flags[k] += gain;
    g.advance(minutes); g.addEnergy(gain); g.addMood(minutes >= 60 ? 4 : 2); g.stat('benchSits');
  } }, { t: 'wait', dur: 0.3 }, { t: 'fade', to: 0, dur: 0.4 }, { t: 'call', fn: (g) => g.say('misa', 'happy', benchThought(g)) }];
}
register('interaction', 'bench', {
  label: 'Sit on the bench',
  run: (g) => g.run([{ t: 'choice', prompt: 'Sit for a while?', options: [
    { text: 'Rest a little (30 min)', steps: sit(30) },
    { text: 'Wait an hour', when: 'time<24:00', steps: sit(60) },
    { text: 'Wait until evening', when: 'time<16:30', steps: [{ t: 'call', fn: (g2) => g2.run(sit(17 * 60 - g2.minutes)) }] },
    { text: 'Not now', steps: [] },
  ] }]),
});

// ---------------- the bus ----------------
export const BUS_FARE = 50;
const STOPS = [{ map: 'lane', name: 'Lantern Lane' }, { map: 'town', name: 'Hoshimori Square' }, { map: 'beach', name: 'Shell Beach' }, { map: 'harbour', name: 'the harbour' }];
const busPos = (id) => { const d = get('map', id), v = d && ((d.spots && d.spots.bus_stop) || (d.spawns && d.spawns.bus_stop)); return v || null; };
const ride = { p: 0, to: 0, card: null, t0: 0 };
function blinds(g, to) { // horizontal blinds: 8 px bars closing top to bottom with a stagger (ART.md 2.10)
  return new Promise((res) => { ride.to = to; ride.done = res; setTimeout(() => { if (ride.done === res) { ride.p = to; ride.done = null; res(); } }, 1500); });
}
function drawRide(g2, world, game) {
  const dt = 1 / 60;
  if (ride.p !== ride.to) { ride.p += Math.sign(ride.to - ride.p) * dt / 0.35; if ((ride.to === 1 && ride.p >= 1) || (ride.to === 0 && ride.p <= 0)) { ride.p = ride.to; if (ride.done) { const f = ride.done; ride.done = null; f(); } } }
  if (ride.p <= 0) return;
  g2.fillStyle = '#1e1624';
  for (let i = 0; i < 28; i++) { const h = Math.max(0, Math.min(8, Math.floor((ride.p * 1.4 - i * 0.015) * 8))); if (h) g2.fillRect(0, i * 8, 320, h); }
  if (ride.p >= 1 && ride.card) { // ride card: the little bus rolls past the bay
    const t = game.clock - ride.t0, x = Math.round(((t * 90) % 420) - 60), S = RAMPS;
    g2.fillStyle = S.navy[1]; g2.fillRect(0, 120, 320, 2);
    for (let i = 0; i < 12; i++) { g2.fillStyle = S.navy[2]; const hx = (i * 37 + 11) % 320, hh = 8 + (i * 13) % 18; g2.fillRect(hx, 120 - hh, 18, hh); g2.fillStyle = S.butter[3]; g2.fillRect(hx + 4, 120 - hh + 4, 3, 3); }
    g2.fillStyle = S.mint[2]; g2.fillRect(x, 100, 52, 18); g2.fillStyle = S.mint[3]; g2.fillRect(x, 100, 52, 3);
    g2.fillStyle = S.sky[3]; for (let k = 0; k < 4; k++) g2.fillRect(x + 4 + k * 11, 104, 8, 6);
    g2.fillStyle = S.butter[2]; g2.fillRect(x + 48, 112, 4, 3);
    g2.fillStyle = S.charcoal[1]; for (const wx of [x + 10, x + 40]) { g2.fillRect(wx - 4, 116, 9, 6); }
    const txt = `Next stop: ${ride.card}`;
    drawText(g2, txt, Math.round(160 - measure(txt) / 2), 140, S.paper[3]);
  }
}
register('worldLayer', 'town_ride', { overlay: drawRide });
function takeBus(g, stop) {
  const pos = busPos(stop.map);
  return [{ t: 'call', fn: (g2) => { if (!g2.spend(BUS_FARE)) return null; g2.sfx('coin'); ride.card = stop.name; ride.t0 = g2.clock; return blinds(g2, 1); } },
    { t: 'call', fn: (g2) => { if (ride.p < 1) return null; return new Promise((res) => setTimeout(res, 1300)); } },
    { t: 'call', fn: (g2) => {
      if (ride.p < 1) return null;
      g2.advance(15); g2.stat('busRides');
      if (g2.world && g2.world.load) g2.world.load(stop.map, pos[0] * 16 + 8, pos[1] * 16 + 14, 'down'); else return g2.warp(stop.map, pos[0], pos[1], 'down');
      return null;
    } },
    { t: 'call', fn: (g2) => { ride.card = null; return ride.p > 0 ? blinds(g2, 0) : null; } }];
}
register('interaction', 'bus_stop', {
  label: 'Bus stop',
  run: (g) => {
    const here = g.world && g.world.map ? g.world.map.id : null;
    if (g.minutes < 6 * 60 + 30 || g.minutes >= 22 * 60) return g.say(null, null, 'The timetable says the last bus has gone. First bus at 6:30 AM.');
    const stops = STOPS.filter((s) => s.map !== here && busPos(s.map));
    g.run([{ t: 'choice', prompt: `Take the bus? (${BUS_FARE} coins)`, options: [
      ...stops.map((s) => ({ text: `To ${s.name}`, when: `money>=${BUS_FARE}`, steps: takeBus(g, s) })),
      { text: 'Read the timetable', steps: [{ t: 'say', who: null, text: `Buses every 20 minutes, 6:30 AM to 10:00 PM. Stops: ${stops.concat(STOPS.filter((s) => s.map === here)).map((s) => s.name).join(', ')}.` }] },
      { text: 'Not now', steps: [] },
    ] }]);
  },
});

// ---------------- the fountain ----------------
const FORTUNES = ['Something sweet is coming your way.', 'A friend is thinking of you today.', 'Small kindnesses will come back to you twice.', 'Look up tonight. The stars have news.', 'Today is a good day to try something new.', 'Your garden will be glad you visited.'];
register('interaction', 'fountain', {
  label: (g) => (g.flag('town_fountainDay') === g.day ? 'Fountain' : 'Toss a coin'),
  run: (g, o) => {
    if (g.flag('town_fountainDay') === g.day) return g.say('misa', 'happy', 'I already made my wish today. The coin is still winking at me from the bottom.');
    g.run([{ t: 'choice', prompt: 'Toss a coin into the fountain? (5 coins)', options: [
      { text: 'Make a wish', when: 'money>=5', steps: [{ t: 'call', fn: (g2) => {
        g2.spend(5); g2.setFlag('town_fountainDay', g2.day); g2.setFlag('lucky_today', true); g2.addMood(3); g2.stat('fountainCoins'); g2.sfx('splash');
        const w = g2.world; if (w && o) for (let i = 0; i < 10; i++) w.particles.push({ c: i % 2 ? RAMPS.water[4] : RAMPS.water[5], x: o.x * 16 + o.w * 8 + (hash(i, 1, 2) - 0.5) * 12, y: o.y * 16 + 10, vx: (hash(i, 2, 3) - 0.5) * 30, vy: -20 - hash(i, 3, 4) * 20, life: 0.6, s: 1 });
      } }, { t: 'say', who: 'misa', mood: 'happy', text: 'Plink! I made a wish.' }, { t: 'call', fn: (g2) => g2.say(null, null, `A little luck sticks to you today. ${FORTUNES[Math.floor(g2.rngFor('fountain')() * FORTUNES.length)]}`) }] },
      { text: 'Just look', steps: [{ t: 'say', who: null, text: 'Coins glitter on the bottom. Some of them are very old.' }] },
    ] }]);
  },
  overlay: (game, world, o) => { // spray droplets and rings, animated
    if (game.season === 'winter') return;
    const g = world.g, cx = world.sx(o.x * 16 + o.w * 8), top = world.sy((o.y + o.h) * 16) - 64, t = game.clock;
    for (let i = 0; i < 14; i++) {
      const ph = (t * 1.2 + i / 14) % 1, side = i % 2 ? 1 : -1, dx = side * (3 + (i % 5)) * ph * 2.4, dy = -10 * Math.sin(ph * Math.PI) + ph * 14;
      g.fillStyle = i % 3 ? RAMPS.water[4] : RAMPS.water[5]; g.fillRect(Math.round(cx + dx), Math.round(top + 6 + dy), 1, 2);
    }
    const r = Math.floor((t * 8) % 14) + 6;
    g.fillStyle = RAMPS.water[4]; g.fillRect(cx - r, top + 44, 3, 1); g.fillRect(cx + r - 2, top + 45, 3, 1);
  },
});

// ---------------- small things to poke ----------------
const once = (g, key) => { if (g.flag(key) === g.day) return false; g.setFlag(key, g.day); return true; };
registerMany('interaction', {
  town_swing: { label: 'Swing', run: (g) => g.run([{ t: 'fade', to: 1, dur: 0.3 }, { t: 'call', fn: (g2) => { g2.advance(10); if (once(g2, 'town_swingDay')) g2.addMood(6); g2.stat('swings'); } }, { t: 'fade', to: 0, dur: 0.3 }, { t: 'say', who: 'misa', mood: 'happy', text: 'Wheee! Higher, higher... I can almost touch the clouds.' }]) },
  town_snowman: { label: 'Pat the snowman', run: (g) => { if (once(g, 'town_snowmanDay')) g.addMood(3); g.say('misa', 'happy', 'Someone gave him a scarf. He looks very proud of it.'); } },
  town_bikebell: { label: 'Ring a bike bell', run: (g) => { g.sfx('bell'); g.toast('Ring ring!'); } },
  town_slide: { label: 'Go down the slide', run: (g) => { g.sfx('pop'); if (once(g, 'town_slideDay')) g.addMood(3); g.say('misa', 'happy', 'Whoosh! Still fun at fifteen.'); } },
  town_flowers: { label: 'Smell the flowers', run: (g) => { if (once(g, 'town_flowerDay')) g.addMood(2); g.say('misa', 'happy', { spring: 'Sweet and fresh. Spring smells like this.', summer: 'Warm and honey-sweet. A bee bumbles past.', autumn: 'Just a few late blooms, hanging on.', winter: 'Asleep under the snow until spring.' }[g.season]); } },
  town_chess: { label: 'Chess table', run: (g) => g.say(null, null, 'A game was left halfway. White is two moves from winning.') },
  town_pond: { label: 'Look at the pond', run: (g) => g.say('misa', 'happy', g.season === 'winter' ? 'The pond is frozen solid. The koi are sleeping under the ice.' : 'Orange koi glide under the surface. One blows a bubble at me.') },
});

// ---------------- placement helpers for the maps ----------------
const PLAQUE = (lines) => ({ label: 'Read the sign', run: (g) => g.say(null, null, lines) });
export const P = prop;
export const tree = (kind, x, y, v = '', o = {}) => prop(`town_tree_${kind}${v}`, x, y, { shadow: v === '_s' ? 11 : 16, tree: kind, ...o });
export const lamp = (x, y, o = {}) => prop('town_lamp', x, y, { light: LIGHT.lamp, shadow: 5, ...o });
export const streetlight = (x, y, o = {}) => ({ ...prop('town_streetlight', x, y, { shadow: 4, ...o }), dx: 0, light: LIGHT.street });
export const bench = (x, y, o = {}) => prop('town_bench', x, y, { w: 2, use: 'bench', shadow: 18, ...o });
export const row = (spr, x0, x1, y, o = {}) => { const out = []; for (let x = x0; x <= x1; x++) out.push({ spr, x, y, ...o }); return out; };
export const signpost = (x, y, text) => prop('town_signpost', x, y, { interact: PLAQUE(text), shadow: 6 });
export const plaque = PLAQUE;
export const snowman = (x, y) => prop('town_snowman', x, y, { when: 'season:winter', use: 'town_snowman', shadow: 10 });
export const leafpile = (x, y) => prop('town_leafpile', x, y, { when: 'season:autumn', flat: true, solid: false });
// An invisible interaction spot (shop counters seen through a shop front, etc.).
export const spot = (x, y, o) => ({ x, y, w: 1, h: 1, solid: false, ...o });
export const clockOverlay = (cx, cy, H) => (game, world, o) => { // the tower clock shows the game time
  const g = world.g, x0 = world.sx(o.x * 16), y0 = world.sy((o.y + o.h) * 16) - H, ox = x0 + cx, oy = y0 + cy;
  const m = game.minutes % 720, ha = (m / 720) * Math.PI * 2, ma = ((game.minutes % 60) / 60) * Math.PI * 2;
  g.fillStyle = RAMPS.ink[1];
  for (let i = 0; i <= 6; i++) g.fillRect(Math.round(ox + Math.sin(ha) * i), Math.round(oy - Math.cos(ha) * i), 2, 2);
  for (let i = 0; i <= 10; i++) g.fillRect(Math.round(ox + Math.sin(ma) * i), Math.round(oy - Math.cos(ma) * i), 1, 1);
  g.fillStyle = RAMPS.coral[1]; g.fillRect(ox, oy, 1, 1);
};
export const steamOverlay = (dx, dy, H) => (game, world, o) => { // rising steam puffs (ramen cart, chimneys)
  const g = world.g, x0 = world.sx(o.x * 16) + dx, y0 = world.sy((o.y + o.h) * 16) - H + dy;
  for (let i = 0; i < 5; i++) { const ph = (game.clock * 0.5 + i / 5) % 1, x = Math.round(x0 + Math.sin(ph * 6 + i) * 3), y = Math.round(y0 - ph * 22); g.fillStyle = ph < 0.5 ? '#fffaf0aa' : '#fffaf055'; g.fillRect(x, y, ph < 0.3 ? 2 : 3, 2); }
};
export const flagOverlay = (game, world, o) => { // a flag waving on the school flagpole
  const g = world.g, x = world.sx(o.x * 16) + 16, y = world.sy((o.y + o.h) * 16) - 118, f = Math.floor(game.clock * 3) % 2;
  for (let i = 0; i < 18; i++) { const wy = Math.round(Math.sin(i / 3 + f * 1.5) * 1.5); g.fillStyle = RAMPS.paper[4]; g.fillRect(x + i, y + wy, 1, 12); }
  g.fillStyle = RAMPS.ribbon[2]; for (let j = -3; j <= 3; j++) { const w = Math.floor(Math.sqrt(9 - j * j)); g.fillRect(x + 9 - w, y + 6 + j + Math.round(Math.sin(3 + f * 1.5) * 1.5), w * 2 + 1, 1); }
};
export const lightsOn = (x, y) => ({ kind: 'lantern', x, y });
void sprH;

features('Town and travel', [
  'Benches all over town: sit to rest 30 minutes, an hour or until evening, recovering a little energy and mood',
  'Bench daydreams: Misa\'s thoughts change with the place, season, weather and time of day',
  `Town bus between Lantern Lane and Hoshimori Square for ${BUS_FARE} coins, running 6:30 AM to 10:00 PM`,
  'Bus ride with a blinds wipe and a ride card showing the little bus rolling past the bay',
  'Bus stop timetable you can read, listing every stop',
  'Toss a coin into the square\'s fountain once a day for a lucky day and a little fortune',
  'Animated fountain spray and ripples (frozen over in winter)',
  'Playground swings and slide give a small daily cozy boost',
  'Ring the bells of parked bikes, pat snowmen, smell flower beds and peek into the koi pond',
]);
