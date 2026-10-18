// Hoshimori Station and the train to Kitaminato.
// Map 'station' (40x19): tracks and the platform on top, a ticket-gate line, the concourse below (kiosk, timetable, waiting nook).
// Entered from the town square through a door wrapped onto 'town' (east side, tile 45,19). Trains leave Hoshimori at :00 every hour
// 06:00-22:00 plus the last train at 22:30, and Kitaminato at :30 06:30-21:30 plus the last train at 22:30. The ride takes 20 minutes.
// The platform train is clock driven: it slides in ~10 minutes before departure, waits with its doors open, and pulls out.
// Missing the last train: capsule hotel, taxi or Mum's pick-up (always a free way home). Fares: single 180, Train Pass card 120, Day Pass free.
import { register, registerMany, get, features } from '../../core/registry.js';
import { clockText } from '../../core/time.js';
import { grid, hash } from '../town/lib.js';
import { P, bench, lamp, signpost, plaque, row } from '../town/interactions.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sky, stars, moon, rect, disc, hills } from '../events/backdrops.js';
import { cmap, wrapMap, S, say, N, call, has, warpStep, stamp, inCity, CITY_MAPS } from './core.js';
import './art.js';

export const FARE = 180, PASS_FARE = 120, PASS_PRICE = 600, DAY_PRICE = 400, HOTEL_PRICE = 700, TAXI_PRICE = 1200, RIDE_MIN = 20;
const HM = (h, m = 0) => h * 60 + m;
export const DEP = { hoshi: [...Array.from({ length: 17 }, (_, i) => HM(6 + i)), HM(22, 30)], kita: Array.from({ length: 17 }, (_, i) => HM(6 + i, 30)) };
export const nextDep = (dir, m) => { const d = DEP[dir].find((x) => x >= m); return d === undefined ? null : d; };
export const hasPass = (g) => g.has('key_city_train_pass');
export const dayPass = (g) => S(g).pass.day === g.day;
export const fareNow = (g) => (dayPass(g) ? 0 : hasPass(g) ? PASS_FARE : FARE);
export const fareText = (g) => (dayPass(g) ? 'covered by your Day Pass' : `${fareNow(g)} coins${hasPass(g) ? ' with your Train Pass' : ''}`);
export const timetableText = (g, dir, n = 3) => {
  const out = []; let m = g.minutes;
  for (let i = 0; i < n; i++) { const d = nextDep(dir, m); if (d === null) break; out.push(clockText(d)); m = d + 1; }
  return out.length ? out.join(', ') : 'none until 6:00 AM';
};

// ---------------------------------------------------------------- the station map
const g = grid(40, 19, '=');
g.fill(0, 0, 40, 2, 'W').fill(0, 2, 40, 4, 'K').fill(0, 6, 40, 4, '+').fill(0, 10, 40, 1, 'W').fill(0, 18, 40, 1, 'W');
g.fill(19, 10, 2, 1, '=').fill(1, 11, 9, 6, 'c');
const edge = row('kc_platform_edge', 0, 39, 6, { flat: true, solid: false, dy: -8 });
const rails = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38].map((x) => ({ spr: 'kc_rails', x, y: 4, w: 2, flat: true, solid: false, dy: 4 }));
cmap('station', {
  name: 'Hoshimori Station', legend: { '.': 'grass', '=': 'paved', '+': 'plaza', W: 'wall_brick', K: 'kc_track', c: 'int_fl_carpet_sky' },
  rows: g.rows(), music: 'town',
  objects: [
    ...rails, ...edge,
    { x: 6, y: 5, w: 26, h: 1, solid: true, use: 'kc_train_door' },
    { ...P('kc_st_gate', 19, 10, { use: 'kc_gate', shadow: 8 }), dy: 6 }, { ...P('kc_st_gate', 20, 10, { use: 'kc_gate', shadow: 8 }), dy: 6 },
    P('kc_st_pillar', 8, 8, { shadow: 6 }), P('kc_st_pillar', 16, 8, { shadow: 6 }), P('kc_st_pillar', 24, 8, { shadow: 6 }), P('kc_st_pillar', 32, 8, { shadow: 6 }),
    P('kc_st_board', 28, 7, { w: 2, h: 2, use: 'kc_timetable', shadow: 18 }), bench(4, 8, { use: 'kc_wait' }), bench(12, 8, { use: 'kc_wait' }), bench(20, 8, { use: 'kc_wait' }),
    lamp(2, 7), lamp(36, 7),
    P('kc_st_board', 14, 11, { w: 2, h: 2, use: 'kc_timetable', shadow: 18 }), P('kc_st_kiosk', 28, 11, { w: 2, h: 2, use: 'kc_kiosk', shadow: 24 }),
    bench(2, 12, { use: 'kc_wait' }), bench(5, 12, { use: 'kc_wait' }), P('town_vending', 8, 12, { use: 'vending', shadow: 12 }), P('town_planter', 1, 16), P('town_planter', 9, 16),
    P('town_planter', 22, 12), P('town_planter', 33, 12), P('town_bins', 36, 12),
    signpost(24, 11, 'Platform 1: trains to Kitaminato, every hour from 6:00 AM. Last train 10:30 PM. Tickets at the gate.'),
    P('kc_map_board', 36, 15, { w: 2, h: 2, interact: plaque('Route map: Hoshimori, then fields, the long bridge and Kitaminato Station. 20 minutes.'), shadow: 20 }),
    lamp(14, 16), lamp(26, 16),
  ],
  warps: [{ x: 0, y: 14, w: 1, h: 3, to: 'town:from_station' }],
  spawns: { default: [3, 14, 'right'], from_town: [1, 15, 'right'], from_train: [18, 7, 'down'] },
  spots: { gate: [19, 11], platform: [19, 7], kiosk: [29, 13], waiting: [4, 14], timetable: [15, 13] },
});

// the door in the town square (east side of the plaza, tile 45,19); the town files are not edited
wrapMap('town', {
  objects: [{ ...P('kc_st_arch', 43, 17, { w: 2, h: 2, shadow: 26, interact: { label: 'Hoshimori Station', run: (gm) => gm.say('misa', 'happy', `Hoshimori Station. Trains to Kitaminato leave on the hour. Next: ${timetableText(gm, 'hoshi', 1)}.`) } }) }],
  warps: [{ x: 45, y: 19, w: 1, h: 3, to: 'station:from_town' }],
  spawns: { from_station: [44, 20, 'left'] },
});

// ---------------------------------------------------------------- train animation (clock driven)
const ARRIVE = 10, DOORS = 6, LEAVE = 8;
export function trainState(game, mins = game.minutes) {
  const dir = 'hoshi', d = DEP[dir].find((x) => mins >= x - ARRIVE && mins < x + LEAVE);
  if (d === undefined) return null;
  const dt = mins - d;
  if (dt < -DOORS) return { x: -0.5 + (1.5 * (dt + ARRIVE)) / (ARRIVE - DOORS), open: false, dep: d, stopped: false };
  if (dt <= 0) return { x: 1, open: dt > -DOORS + 1 && dt < -0.5, dep: d, stopped: true };
  return { x: 1 + (dt / LEAVE) * (dt / LEAVE) * 2, open: false, dep: d, stopped: false };
}
export const trainHere = (game) => { const t = trainState(game); return !!(t && t.stopped); };
const tick = { m: -1, c: 0, force: null };
register('worldLayer', 'kc_train', {
  sprites(world, game) {
    if (world.map.id !== 'station') return [];
    if (tick.m !== game.minutes) { tick.m = game.minutes; tick.c = game.clock; }
    const frac = Math.min(1, (game.clock - tick.c) / 0.45);
    let t = trainState(game, game.minutes + frac);
    if (tick.force && game.clock - tick.force < 3.2) { const p = Math.max(0, game.clock - tick.force - 0.4); t = { x: 1 + (p / 2.4) * (p / 2.4) * 2.4, open: p <= 0, stopped: true }; }
    if (!t || t.x > 2.8 || t.x < -0.6) return [];
    const cx = (t.x * 20) * 16, by = 5.6 * 16;
    return [{ y: by, draw: () => { world.shadow(cx, by, 120); world.drawFeet(t.open ? 'kc_train_b' : 'kc_train_a', cx, by); } }];
  },
});
export const departAnim = (game) => { tick.force = game.clock; };

// ---------------------------------------------------------------- interactions
registerMany('interaction', {
  kc_timetable: { label: 'Timetable', run: (gm) => gm.run([N(`Hoshimori to Kitaminato: every hour on the hour, 6:00 AM to 10:00 PM, and a last train at 10:30 PM. Next: ${timetableText(gm, 'hoshi')}.`), N('Kitaminato to Hoshimori: every hour at half past, 6:30 AM to 9:30 PM, and a last train at 10:30 PM. The ride takes 20 minutes.'), N(`Fares: single ${FARE} coins. Train Pass card ${PASS_FARE} coins per trip (card costs ${PASS_PRICE}). City Day Pass ${DAY_PRICE}: all trips today plus the city subway.`)]) },
  kc_gate: {
    label: (gm) => (gm.world && gm.world.player && gm.world.player.y < 10 * 16 + 4 ? 'Exit gate' : 'Ticket gate'),
    run: (gm) => {
      const onPlatform = gm.world && gm.world.player && gm.world.player.y < 10 * 16 + 4;
      if (onPlatform) return gm.run([N('The gate swings open for you. Back to the concourse.'), warpStep('station', 'default')]);
      const valid = S(gm).ride.ticketDay === gm.day || dayPass(gm);
      const through = [{ t: 'sfx', name: 'chime' }, N('Beep! The gate lets you through.'), { t: 'warp', map: 'station', x: 19, y: 9, dir: 'down' }];
      if (valid) return gm.run([N('Your ticket is still valid today.'), ...through]);
      if (!nextDep('hoshi', gm.minutes)) return gm.run([N('The last train has gone. The gates are shut for the night.'), call((g2) => lastTrainMissed(g2))]);
      gm.run([{ t: 'choice', prompt: `Ticket gate. Next train ${timetableText(gm, 'hoshi', 1)}.`, options: [
        { text: `Single to Kitaminato (${fareNow(gm)})`, when: `money>=${fareNow(gm)}`, steps: [call((g2) => { g2.spend(fareNow(g2)); S(g2).ride.ticketDay = g2.day; g2.sfx('coin'); }), ...through] },
        { text: `City Day Pass (${DAY_PRICE})`, when: `money>=${DAY_PRICE}&!flag:kc_nodaypass`, steps: [call((g2) => buyDayPass(g2)), ...through] },
        { text: `Train Pass card (${PASS_PRICE})`, when: `money>=${PASS_PRICE}&!item:key_city_train_pass`, steps: [call((g2) => buyPass(g2)), say('misa', 'happy', 'A shiny IC card with a tiny paper train on it. Every trip is cheaper now!')] },
        { text: 'Not now', steps: [] }] }]);
    },
  },
  kc_train_door: {
    label: (gm) => (trainHere(gm) ? 'Board the train' : 'Wait for the train'),
    run: (gm) => {
      if (!(S(gm).ride.ticketDay === gm.day || dayPass(gm))) return gm.say('misa', 'neutral', 'I need a ticket first. The gate is behind me.');
      const d = nextDep('hoshi', gm.minutes);
      if (d === null) return lastTrainMissed(gm);
      if (trainHere(gm)) return gm.run([{ t: 'choice', prompt: 'The doors are open. Board the train to Kitaminato?', options: [{ text: 'Board', steps: [call((g2) => rideScript(g2, 'kita'))] }, { text: 'Not yet', steps: [] }] }]);
      gm.run([{ t: 'choice', prompt: `The next train is at ${clockText(d)}. Wait for it?`, options: [
        { text: 'Wait on the platform', steps: [{ t: 'fade', to: 1, dur: 0.4 }, call((g2) => { g2.advance(Math.max(0, d - 5 - g2.minutes)); }), { t: 'fade', to: 0, dur: 0.4 }, N('A bell rings. The train slides in with a soft hiss.')] },
        { text: 'Not now', steps: [] }] }]);
    },
  },
  kc_wait: { label: 'Rest and wait', run: (gm) => {
    const d = nextDep('hoshi', gm.minutes);
    gm.run([{ t: 'choice', prompt: d === null ? 'The last train has gone.' : `Rest on the bench until a train? Next: ${clockText(d)}.`, options: [
      { text: 'Rest 30 minutes', steps: [{ t: 'fade', to: 1, dur: 0.3 }, call((g2) => { g2.advance(30); g2.addEnergy(5); g2.addMood(2); }), { t: 'fade', to: 0, dur: 0.3 }, say('misa', 'happy', 'The timetable ticks over. Station benches are secretly very comfy.')] },
      { text: 'Until the next train', when: d === null ? 'flag:never' : '', steps: [{ t: 'fade', to: 1, dur: 0.4 }, call((g2) => { const dd = nextDep('hoshi', g2.minutes); if (dd) g2.advance(Math.max(0, dd - 5 - g2.minutes)); g2.addEnergy(4); }), { t: 'fade', to: 0, dur: 0.4 }] },
      { text: 'Never mind', steps: [] }] }]);
  } },
  kc_city_gate: {
    label: 'Station gate: trains home',
    run: (gm) => {
      const d = nextDep('kita', gm.minutes);
      if (d === null) return gm.run([N('The last train to Hoshimori has left. The platform is dark.'), call((g2) => lastTrainMissed(g2))]);
      gm.run([{ t: 'choice', prompt: `Trains home leave at :30. Next: ${clockText(d)} (${fareText(gm)}).`, options: [
        { text: 'Take the next train home', when: dayPass(gm) ? '' : `money>=${fareNow(gm)}`, steps: [call((g2) => { if (!dayPass(g2)) { g2.spend(fareNow(g2)); g2.sfx('coin'); } return waitAndRide(g2, d); })] },
        { text: `Buy Train Pass card (${PASS_PRICE})`, when: `money>=${PASS_PRICE}&!item:key_city_train_pass`, steps: [call((g2) => buyPass(g2))] },
        { text: 'Read the timetable', steps: [N(`Trains home: ${timetableText(gm, 'kita', 4)}. Last train 10:30 PM.`)] },
        { text: 'Not now', steps: [] }] }]);
    },
  },
});
export function buyPass(g2) { if (!g2.spend(PASS_PRICE)) return; g2.give('key_city_train_pass', 1); g2.setFlag('kc_pass'); g2.sfx('buy'); }
export function buyDayPass(g2) { if (!g2.spend(DAY_PRICE)) return; S(g2).pass.day = g2.day; S(g2).ride.ticketDay = g2.day; g2.sfx('buy'); g2.toast('City Day Pass: all trips and the subway today', 'i_star'); stamp(g2, 'daypass'); g2.setFlag('kc_daypass_today', g2.day); }
export function waitAndRide(g2, d) {
  return g2.run([{ t: 'fade', to: 1, dur: 0.4 }, call((gg) => { gg.advance(Math.max(0, d - gg.minutes)); }), { t: 'fade', to: 0, dur: 0.4 }, N('The train pulls in. Doors open with a chime.'), call((gg) => rideScript(gg, 'hoshi'))]);
}

// ---------------------------------------------------------------- the ride
// dir 'kita' = Hoshimori -> Kitaminato, 'hoshi' = back. A 20 minute cutscene over the window backdrop.
const VIGNETTES = [
  [N('Across the aisle, a grandpa is sharing mandarins with a sleepy toddler. One lands in your lap.'), call((gm) => { gm.addMood(3); })],
  [N('A busker boards at the bridge, plays two songs on a small accordion, bows and gets off at the next stop. Everybody claps.'), call((gm) => { gm.addMood(2); })],
  [N('A schoolgirl asleep on her friend\'s shoulder. The friend does not move even once. Respect.'), call((gm) => { gm.addMood(2); })],
  [N('The conductor taps the window: "Look left!" A heron lifts off the river, white against the green.'), call((gm) => { gm.addMood(3); })],
  [N('Someone left a paperback on the seat. You read the first page. It is a very good first page.'), call((gm) => { gm.addXP && gm.addXP('study', 2); })],
];
const SCENERY = {
  spring: 'Cherry trees blur past in pink and white.', summer: 'Rice fields glitter green, and the sea flashes between the hills.',
  autumn: 'Maples burn red along the track, and persimmons hang like lanterns.', winter: 'Snow lies thick on the fields. The train hums through a white world.',
};
export function rideScript(gm, dir) {
  const to = dir === 'kita' ? 'kita_station_plaza' : 'station', toSpawn = dir === 'kita' ? 'from_train' : 'from_train';
  const night = gm.minutes >= 19 * 60 || gm.minutes < 5 * 60, r = gm.rngFor('kcride' + gm.minutes);
  const vig = VIGNETTES[Math.floor(r() * VIGNETTES.length)];
  S(gm).ride.dir = dir; S(gm).ride.start = gm.minutes;
  const first = dir === 'kita' ? 'The platform slides away. Hoshimori Bay shrinks behind the glass.' : 'The city lights thin out. Soon it will be harbour air again.';
  const steps = [
    { t: 'sfx', name: 'bell' }, call((g2) => { if (g2.world && g2.world.map && g2.world.map.id === 'station') departAnim(g2); }), { t: 'wait', dur: dir === 'kita' ? 2.4 : 0.2 },
    { t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: 'kc_window' }, { t: 'fade', to: 0, dur: 0.6 },
    N(first), N(night ? 'Windows glow like scattered coins in the dark.' : SCENERY[gm.season]), { t: 'time', add: 7 },
    ...vig, { t: 'time', add: 7 },
    N(dir === 'kita' ? 'Towers rise ahead. A bridge, a river, and then the long curve into Kitaminato.' : 'The sea appears, then the lighthouse. Almost home.'), { t: 'time', add: 6 },
    { t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: null },
    call((g2) => { g2.stat('kcRides'); S(g2).rides++; g2.addMood(3); stamp(g2, 'ride'); g2.bus.emit('kcRide', { dir, minutes: RIDE_MIN }); }),
    warpStep(to, toSpawn), { t: 'fade', to: 0, dur: 0.5 },
    say('misa', 'happy', dir === 'kita' ? 'Kitaminato! So many people, so many signs!' : 'Home sweet Hoshimori. The air smells like the sea.'),
  ];
  return gm.run(steps);
}

// the window backdrop: sky by time of day, scenery by season, the landscape by how far along the ride is
register('backdrop', 'kc_window', {
  draw(gc, game, t) {
    const h = game.minutes / 60, s = game.season, ride = game.state.kita ? game.state.kita.ride : { dir: 'kita', start: game.minutes };
    const prog = Math.max(0, Math.min(1, (game.minutes - ride.start) / 20)), toCity = ride.dir === 'kita';
    const night = h >= 19.5 || h < 5.5, dawn = h >= 5.5 && h < 7.5, dusk = h >= 17 && h < 19.5;
    const cols = night ? ['#0e1030', '#171233', '#241a4a', '#32265c'] : dawn ? ['#8a7fc0', '#e8a0a8', '#f8c8a0', '#ffe4b8'] : dusk ? ['#3a2e6a', '#a85a8a', '#f08a6a', '#ffc080'] : ['#5f9cd8', '#7fb2e0', '#a8d4f0', '#d0ecfa'];
    sky(gc, cols, 0, 150);
    if (night) { stars(gc, t, 60, 110, 5); moon(gc, 250, 40, 12); } else if (dusk || dawn) disc(gc, dusk ? 80 : 240, 124, 16, '#fff0b0'); else disc(gc, 250, 36, 12, '#fffbe0');
    const ground = { spring: ['#9ccc74', '#6aa45e', '#4a7a58'], summer: ['#74b85a', '#4f9a50', '#2f6f40'], autumn: ['#c8a050', '#a87a3a', '#7a5a2e'], winter: ['#e8f0f6', '#c0d4dc', '#90a8b0'] }[s];
    const dim = night ? 0.45 : dusk || dawn ? 0.8 : 1;
    hills(gc, 120, ground[2], 14, 0.012, t * 0.05); hills(gc, 132, ground[1], 10, 0.02, 2 + t * 0.12);
    // distant landmarks by progress: the bay at the Hoshimori end, a skyline at the Kitaminato end
    const near = toCity ? prog : 1 - prog;
    if (near < 0.35) { rect(gc, '#7fb2e0', 0, 108, 320, 14); for (let i = 0; i < 6; i++) rect(gc, '#bfe6f5', (i * 61 + t * 8) % 320, 112 + (i % 3) * 3, 14, 1); }
    if (near > 0.6) for (let i = 0; i < 14; i++) { const bh = 20 + hash(i, 4, 1) * 50 * (near - 0.4), bx = i * 24 - ((t * 10) % 24); rect(gc, night ? '#241a4a' : '#6f84b0', bx, 124 - bh, 18, bh); if (night) for (let k = 0; k < 4; k++) rect(gc, '#ffd76a', bx + 3 + (k % 2) * 7, 124 - bh + 4 + Math.floor(k / 2) * 8, 3, 3); }
    // mid-ground: trees or poles streaming past
    rect(gc, ground[0], 0, 138, 320, 36);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 47 - t * 70) % 440 + 440) % 440 - 60, tc = s === 'autumn' ? '#c45a2e' : s === 'spring' ? '#f4a8c0' : s === 'winter' ? '#e8f0f6' : '#3f8a4a';
      rect(gc, '#4a2e2a', x + 6, 124, 3, 20); disc(gc, x + 7, 120, 11, tc); if (s !== 'winter') disc(gc, x + 4, 116, 5, s === 'autumn' ? '#e8862a' : s === 'spring' ? '#ffd0e0' : '#5faa5a');
    }
    for (let i = 0; i < 6; i++) { const x = ((i * 71 - t * 220) % 460 + 460) % 460 - 70; rect(gc, '#3a3850', x, 100, 3, 74); rect(gc, '#3a3850', x - 8, 104, 19, 2); }
    rect(gc, '#2a2a36', 0, 168, 320, 6); rect(gc, '#5a5874', 0, 172, 320, 2);
    if (night) { gc.globalAlpha = 0.42; rect(gc, '#0e1030', 0, 0, 320, 174); gc.globalAlpha = 1; } else if (dim < 1) { gc.globalAlpha = 0.18; rect(gc, '#6a2a5a', 0, 0, 320, 174); gc.globalAlpha = 1; }
    if (game.weather === 'rain' || game.weather === 'storm') { gc.fillStyle = '#d8e8f8'; for (let i = 0; i < 40; i++) gc.fillRect(((i * 53 + t * 260) % 340) - 10, ((i * 29 + t * 520) % 180), 1, 7); }
    if (game.weather === 'snow' || s === 'winter') { gc.fillStyle = '#fff'; for (let i = 0; i < 40; i++) gc.fillRect(((i * 37 + Math.sin(t + i) * 9) % 320 + 320) % 320, (i * 23 + t * 40) % 176, 2, 2); }
    // the carriage: window frame, seats and swaying straps
    const F = '#2e2638', F2 = '#4a3348';
    rect(gc, F, 0, 0, 320, 20); rect(gc, F2, 0, 18, 320, 2); rect(gc, F, 0, 174, 320, 50); rect(gc, F2, 0, 174, 320, 2); rect(gc, F, 0, 0, 22, 224); rect(gc, F, 298, 0, 22, 224); rect(gc, F, 158, 18, 4, 158);
    for (const sx of [34, 190]) { rect(gc, '#7a3a3e', sx, 186, 96, 38); rect(gc, '#a8524a', sx, 186, 96, 5); rect(gc, '#5a2430', sx + 40, 191, 2, 33); }
    for (let i = 0; i < 4; i++) { const sw = Math.sin(t * 2 + i) * 3, sx = 60 + i * 66; rect(gc, '#b9c6d2', sx + sw, 20, 1, 22); rect(gc, '#e8c838', sx + sw - 4, 42, 9, 3); rect(gc, '#e8c838', sx + sw - 4, 45, 2, 3); rect(gc, '#e8c838', sx + sw + 3, 45, 2, 3); }
  },
});

// ---------------------------------------------------------------- last train, taxi, Mum, capsule hotel
export function lastTrainMissed(gm) {
  const late = gm.minutes >= HM(22, 30);
  return gm.run([N(late ? 'The last train has gone. The station is closing and the city is still buzzing.' : 'No more trains tonight.'),
    { t: 'choice', prompt: 'How do you get home?', options: [
      { text: `Capsule hotel (${HOTEL_PRICE})`, when: `money>=${HOTEL_PRICE}`, steps: [call((g2) => hotelSleep(g2))] },
      { text: `Taxi home (${TAXI_PRICE})`, when: `money>=${TAXI_PRICE}`, steps: [call((g2) => taxiHome(g2))] },
      { text: 'Call Mum to pick me up (free)', steps: [call((g2) => mumPickup(g2))] },
      { text: 'Stay out a bit longer', steps: [] }] }]);
}
export function taxiHome(gm) {
  return gm.run([call((g2) => { g2.spend(TAXI_PRICE); g2.sfx('coin'); }), { t: 'fade', to: 1, dur: 0.6 }, call((g2) => { g2.advance(45); g2.addMood(1); g2.stat('kcTaxi'); }), warpStep('yard', 'default'), { t: 'fade', to: 0, dur: 0.6 }, say('misa', 'happy', 'The driver hummed along to the radio all the way. Home at last!')]);
}
export function mumPickup(gm) {
  return gm.run([{ t: 'fade', to: 1, dur: 0.6 }, call((g2) => { g2.advance(60); g2.addMood(-6); g2.stat('kcPickups'); }), warpStep('yard', 'default'), { t: 'fade', to: 0, dur: 0.6 }, say('mum', 'neutral', 'Next time, check the timetable, sweetheart. ...But I am glad you are safe. Hot chocolate?'), say('misa', 'sad', 'Sorry, Mum.')]);
}
export function hotelSleep(gm) {
  const w = gm.world;
  if (w && w.load) { const orig = w.load; w.load = function patched(id, x, y, dir) { delete w.load; const sp = get('map', 'kita_capsule_hotel').spawns.pod; return id === 'home' ? orig.call(w, 'kita_capsule_hotel', sp[0] * 16 + 8, sp[1] * 16 + 14, 'down') : orig.call(w, id, x, y, dir); }; }
  gm.spend(HOTEL_PRICE); gm.sfx('coin'); S(gm).hotel++; gm.stat('kcHotelNights'); gm.setFlag('kc_hotel_wake', true);
  return gm.sleep();
}
register('system', 'kc_trains', {
  init(game) {
    game.bus.on('hour', ({ h }) => {
      if (h < 23 || h > 26 || !inCity(game) || here0(game) === 'kita_capsule_hotel') return;
      if (game.flag('kc_late_day') === game.day) return;
      if (!game.world || game.scenes.top !== game.world || game.world.busy) return;
      game.setFlag('kc_late_day', game.day);
      lastTrainMissed(game);
    });
    game.bus.on('mapEnter', ({ map }) => {
      if (map === 'kita_capsule_hotel' && game.flag('kc_hotel_wake')) {
        game.setFlag('kc_hotel_wake', false); game.setFlag('kc_hotel_morning', game.day); stamp(game, 'map_kita_capsule_hotel');
        setTimeout(() => game.run([say('misa', 'sleepy', 'Mmm... a tiny cosy pod. I slept like a koala.'), N('The first trains to Hoshimori leave at half past six.')]), 400);
      }
    });
  },
});
const here0 = (g2) => (g2.world && g2.world.map ? g2.world.map.id : g2.state.map);

features('Kitaminato Rail', [
  'Hoshimori Station beside the town square: ticket gate, platform, timetable boards, a kiosk, a waiting nook and a lit concourse',
  'A real train slides into the platform ten minutes before departure, opens its doors, waits, then pulls out',
  'Timetable: Hoshimori to Kitaminato every hour 6:00 AM to 10:00 PM plus the last train at 10:30 PM; back at half past each hour',
  'Ride cutscene of about 20 game minutes over a window view that changes with the season, weather and time of day',
  'Random train-ride vignettes: a busker, a sleepy schoolgirl, a heron by the river and more',
  'Fares in coins: single 180, Train Pass IC card 120 per trip, City Day Pass 400 for every trip and the subway that day',
  'Missed the last train? Stay at the capsule hotel, take a taxi, or call Mum for a free pick-up',
  'Wait for the next train from the platform or any bench, with the clock skipping ahead to the arrival',
  'Station kiosk selling bento, drinks, snacks and Kitaminato souvenirs',
]);
void CITY_MAPS; void has; void K;
