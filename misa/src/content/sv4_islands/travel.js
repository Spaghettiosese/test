// Ferries, the sailing cutscene, the boat berth (licence quest, rent, buy, motor), last-ferry safety and island lodging.
import { register, get, features } from '../../core/registry.js';
import { sprite } from '../../artcache.js';
import { drawChar } from '../../gfx/chars.js';
import { S4, ISLANDS, DEPART, RETURN, LAST_FERRY, hm, nextTime, fareFor, ferryRunning, typhoonSeason, stamp, islandOfMap } from './data.js';
import { boatTier, canRent, hasBoat, TIER_NAME } from './sea.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const call = (fn) => ({ t: 'call', fn });
const cap = () => (get('npc', 'nagisa') ? 'nagisa' : null);

// ---------------------------------------------------------------- backdrop
let sight = null;
export function rollSighting(g, tag = 'ferry') {
  const r = g.rngFor(tag + g.minutes)();
  const s = g.season;
  if (r < 0.12) return s === 'winter' || s === 'spring' ? 'whale' : 'dolphins';
  if (r < 0.3) return s === 'summer' ? 'flying' : s === 'autumn' ? 'jelly' : 'dolphins';
  return null;
}
register('backdrop', 'sv4_sail', {
  draw(g, game, t) {
    const h = game.minutes / 60, night = h >= 19.5 || h < 5, dusk = !night && (h >= 17 || h < 7), rain = game.weather === 'rain' || game.weather === 'storm';
    const top = night ? '#141830' : rain ? '#7f8ea0' : dusk ? '#e0907a' : '#8fd0f0', bot = night ? '#243058' : rain ? '#a0acb8' : dusk ? '#f8d0a0' : '#d8f2ff';
    for (let y = 0; y < 110; y++) { g.fillStyle = y < 55 ? top : bot; g.fillRect(0, y, 320, 1); }
    if (night) { g.fillStyle = '#fff1d6'; for (let i = 0; i < 40; i++) g.fillRect((i * 53) % 320, (i * 29) % 90, 1, 1); g.fillRect(250, 20, 6, 6); }
    else if (!rain) { g.fillStyle = dusk ? '#ffb070' : '#fffbe0'; g.fillRect(240, dusk ? 80 : 20, 12, 12); }
    const w = night ? ['#1a2a4a', '#16223e'] : rain ? ['#6f8aa0', '#587890'] : ['#5fb0d8', '#3d8ab8'];
    g.fillStyle = w[0]; g.fillRect(0, 110, 320, 40); g.fillStyle = w[1]; g.fillRect(0, 150, 320, 74);
    for (let i = 0; i < 60; i++) { g.fillStyle = night ? '#4a5a8a' : '#d8f2ff'; g.fillRect(((i * 47 + t * (20 + i % 5 * 6)) % 340) - 10, 112 + (i * 31) % 110, 4, 1); }
    // far islands
    g.fillStyle = night ? '#10162a' : '#6a8ab0'; for (let i = 0; i < 3; i++) { const x = Math.round(300 - ((t * 6 + i * 130) % 420)); g.fillRect(x, 104, 70, 6); g.fillRect(x + 12, 98, 40, 6); }
    if (game.season === 'autumn' && !rain) { g.fillStyle = '#d9763f'; for (let i = 0; i < 5; i++) g.fillRect((i * 70 + t * 20) % 320, 60 + i * 9, 2, 2); }
    if (game.season === 'winter') { g.fillStyle = '#fff'; for (let i = 0; i < 24; i++) g.fillRect((i * 41 + t * 10) % 320, (i * 23 + t * 30) % 220, 1, 1); }
    const k = (t * 30) % 420 - 50;
    if (sight === 'dolphins') for (let i = 0; i < 3; i++) { g.fillStyle = '#3a5a80'; const x = Math.round(300 - k + i * 22), y = 140 + Math.round(Math.sin(t * 4 + i) * 7); g.fillRect(x, y, 14, 4); g.fillRect(x + 4, y - 3, 3, 3); }
    if (sight === 'whale') { g.fillStyle = '#2a3e5c'; const x = Math.round(330 - k * 0.6); g.fillRect(x, 132, 50, 8); g.fillStyle = '#fff'; g.fillRect(x + 10, 118 + Math.round(Math.sin(t * 5) * 2), 2, 12); }
    if (sight === 'flying') for (let i = 0; i < 5; i++) { g.fillStyle = '#c8e8ff'; const x = Math.round(320 - ((t * 60 + i * 50) % 380)), y = 128 - Math.round(Math.sin(((t * 60 + i * 50) % 380) / 40) * 10) - i * 3; g.fillRect(x, y, 5, 2); g.fillRect(x + 1, y - 2, 3, 1); }
    if (sight === 'jelly') for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(232,200,255,0.7)'; g.fillRect(40 + i * 48, 170 + Math.round(Math.sin(t * 2 + i) * 6), 8, 5); }
    const bob = Math.round(Math.sin(t * 2.2) * 2);
    const img = sprite('sv4_boat_big'); if (img) g.drawImage(img, 90, 128 + bob);
    drawChar(g, 'misa', null, 'right', 'idle', t, 140, 160 + bob);
    if (get('npc', 'nagisa')) drawChar(g, 'nagisa', get('npc', 'nagisa').look, 'right', 'idle', t + 1, 112, 160 + bob);
  },
});

// ---------------------------------------------------------------- ferry
export function ferryLines(g, key, from) {
  const I = ISLANDS[key], c = cap(), rng = g.rngFor('ferrytalk' + g.minutes);
  const talk = ['Nagisa: Watch the horizon, not the water. Your stomach will thank you.', 'Nagisa: Tsubame swallows follow this ferry every spring. Good luck, they say.', 'Nagisa: The sea is flat as tea today.', 'Nagisa: Lanterns on the water at night. You will see.'];
  return [say(c, 'happy', 'All aboard! Next stop: ' + (from === 'harbour' ? I.name : 'Hoshimori Harbour') + '.'), { t: 'wait', dur: 1.4 },
    say(null, null, g.weather === 'rain' ? 'Rain taps the deck. The islands blur grey and gentle.' : g.minutes >= 19 * 60 ? 'Stars come out over the water.' : 'Gulls wheel behind the ferry.'),
    sight === 'dolphins' ? say(c, 'surprised', 'Dolphins off the bow!') : sight === 'whale' ? say(c, 'surprised', 'A whale! Look, look!') : sight === 'flying' ? say(c, 'happy', 'Flying fish! They love summer.') : sight === 'jelly' ? say(c, 'happy', 'Autumn moon jellies. Pretty, aren\'t they?') : say(c, 'neutral', talk[Math.floor(rng() * talk.length)].replace('Nagisa: ', ''))];
}
export async function sail(g, key, from) {
  const I = ISLANDS[key];
  sight = rollSighting(g);
  const dest = from === 'harbour' ? { map: I.map, sp: I.spawn } : { map: 'harbour', sp: 'from_seto' };
  const dm = get('map', dest.map), v = dm.spawns[dest.sp];
  await g.run([{ t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: 'sv4_sail' }, { t: 'fade', to: 0, dur: 0.4 }, ...ferryLines(g, key, from),
    call(() => { if (sight) g.collect('sightings', sight); }),
    { t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: null }, { t: 'time', add: I.mins },
    call(() => { const s = S4(g); s.ferryRides++; g.stat('ferryRides'); if (from === 'harbour') { s.visited[key] = g.day; g.setFlag('seto_visited'); stamp(g, { tsubame: 'ts_arrive', lantern: 'li_arrive', coral: 'co_arrive' }[key]); } g.addMood(6); g.bus.emit('ferryRide', { to: from === 'harbour' ? key : 'harbour' }); }),
    { t: 'warp', map: dest.map, x: v[0], y: v[1], dir: v[2] || 'down' }, { t: 'fade', to: 0, dur: 0.4 }]);
}
export function ferryStatus(g, from) {
  if (!ferryRunning(g)) return typhoonSeason(g) ? 'Typhoon season: the ferries are cancelled in this weather. Stay cozy and try tomorrow.' : 'Ferries cancelled: the sea is too rough today.';
  const list = from === 'harbour' ? DEPART : RETURN;
  const nx = nextTime(list, g.minutes);
  if (nx === null || (from !== 'harbour' && g.minutes > LAST_FERRY)) return from === 'harbour' ? 'The last ferry has left. The first sails at 07:00 tomorrow.' : 'The last ferry has left. Stay the night: it is safe and cozy.';
  return `Next ferry: ${hm(nx)}. Timetable: ${list.map(hm).join(' ')}.`;
}
export async function ferryMenu(g, from) {
  const here = from === 'harbour' ? null : islandOfMap(from);
  await g.run([say(null, null, ferryStatus(g, from))]);
  if (!ferryRunning(g)) return;
  const list = from === 'harbour' ? DEPART : RETURN, nx = nextTime(list, g.minutes);
  if (nx === null || (from !== 'harbour' && g.minutes > LAST_FERRY)) { if (from !== 'harbour') g.setFlag('seto_stranded'); return; }
  const keys = from === 'harbour' ? Object.keys(ISLANDS) : [here];
  const opts = keys.map((k) => {
    const fare = from === 'harbour' ? fareFor(g, k) : Math.min(fareFor(g, k), 60);
    return { text: `${from === 'harbour' ? ISLANDS[k].name : 'Hoshimori Harbour'} (${fare} coins${nx > g.minutes ? ', wait until ' + hm(nx) : ''})`, when: `money>=${fare}`, steps: [call(async () => {
      if (!g.spend(fare)) return; g.sfx('coin'); if (nx > g.minutes) g.advance(nx - g.minutes); await sail(g, k, from);
    })] };
  });
  opts.push({ text: 'Not now', steps: [] });
  return g.run([{ t: 'choice', prompt: 'Board the ferry?', options: opts }]);
}
register('interaction', 'sv4_ferry_back', { label: 'Ferry timetable', run: (g) => ferryMenu(g, g.world ? g.world.map.id : 'tsubame_pier') });

// ---------------------------------------------------------------- berth: licence, rent, buy, motor
export function berth(g) {
  const b = S4(g).boat, steps = [];
  if (!canRent(g) && !b.own) return g.run([say(null, null, 'Boat berth. A sign: "Licence required. Ask Captain Jun at the bait shop." Jun can set you up with the Boat Licence course.')]);
  const opts = [];
  if (!b.own) opts.push({ text: b.rentDay === g.day ? 'Rowboat rented today (return at midnight)' : 'Rent a rowboat for the day (60 coins)', when: b.rentDay === g.day ? undefined : 'money>=60', steps: [call(() => { if (b.rentDay === g.day) return; if (g.spend(60)) { b.rentDay = g.day; g.toast('Rowboat rented until midnight', 'i_star'); } })] });
  if (!b.own && g.flag('seto_licence')) opts.push({ text: 'Buy the Sayori Jr. sailboat (3200 coins)', when: 'money>=3200', steps: [call(() => { if (g.spend(3200)) { b.own = 2; g.setFlag('seto_boat_own'); g.toast('You own a boat!', 'i_trophy'); g.sfx('levelup'); } })] });
  if (b.own === 2) opts.push({ text: 'Fit a motor (4800 coins, speed x2.4)', when: 'money>=4800', steps: [call(() => { if (g.spend(4800)) { b.own = 3; g.toast('Motor fitted!', 'i_star'); } })] });
  opts.push({ text: 'Not now', steps: [] });
  steps.push(say(null, null, `Boat berth. Your boat: ${TIER_NAME[boatTier(g)]}. Walk to the end of the pier to launch.`), { t: 'choice', prompt: 'Berth', options: opts });
  return g.run(steps);
}

// ---------------------------------------------------------------- licence quest (Captain Jun, 3 steps)
register('quest', 'sv4_licence', {
  name: 'Boat Licence', giver: 'jun', desc: 'Captain Jun will sign off your boat licence if you can read the sea, ride the ferry and round three buoys.',
  stages: [
    { text: 'Study the sea chart with Captain Jun at the harbour', hint: 'Talk to Captain Jun' },
    { text: 'Ride a ferry to any island and see how it is done', hint: 'The ferry sign is on the harbour pier', done: { on: 'ferryRide' } },
    { text: 'Sail a rented rowboat around the three practice buoys', hint: 'Rent at the berth, then launch from the pier end', done: { has: 'flag:seto_buoys_done' } },
    { text: 'Report back to Captain Jun', hint: 'Captain Jun, harbour' },
  ],
  reward: { money: 200, flags: ['seto_licence'], friend: { jun: 40 } },
});
register('talkHook', 'sv4_jun_licence', {
  npc: 'jun', priority: 41, when: { any: [['quest:sv4_licence=none', 'friend:jun>=2'], 'quest:sv4_licence=active'] },
  steps: (g) => {
    const st = g.quest ? g.quest('sv4_licence') : null;
    if (g.check('quest:sv4_licence=none')) return [say('jun', 'happy', 'Little keeper! The islands are out there waiting, and the ferry is only a tourist ride. Want a proper Boat Licence? Three steps. I will teach you.'),
      { t: 'choice', prompt: 'Start the licence course?', options: [{ text: 'Yes please!', steps: [{ t: 'quest', start: 'sv4_licence' }, say('jun', 'happy', 'Sit. Chart quiz first.'), ...quiz()] }, { text: 'Later', steps: [] }] }];
    if (g.check(['quest:sv4_licence=active', '!quest:sv4_licence>=1'])) return [...quiz()];
    if (g.check('quest:sv4_licence>=3')) return [say('jun', 'happy', 'Three buoys, no scratches! By the power of an old fisherman, you are licensed. Rent a rowboat any time, or buy the Sayori Jr. when you can afford her.'), { t: 'quest', complete: 'sv4_licence' }];
    void st;
    return [say('jun', 'neutral', g.check(['quest:sv4_licence=active', '!quest:sv4_licence>=2']) ? 'Ride the ferry once, so you know how the big boats behave. Then come round the buoys in a rowboat.' : 'Rent a rowboat at the berth. Three buoys: south-west, centre and south of the middle stream. Look for yellow flags.')];
  },
});
const quiz = () => [
  { t: 'choice', prompt: 'A red buoy on your left means...', options: [{ text: 'Keep it to the left', steps: [say('jun', 'happy', 'Ha! Wrong, but you said it with confidence. Red goes on the right coming home. Remember: red, right, return.')] }, { text: 'Keep it to the right', steps: [say('jun', 'happy', 'Right! Red, right, return.')] }] },
  { t: 'choice', prompt: 'Dark clouds and the wind gets up. You...', options: [{ text: 'Head for harbour', steps: [say('jun', 'happy', 'The sea will be here tomorrow. So will you.')] }, { text: 'Keep fishing', steps: [say('jun', 'sad', 'Brave and foolish. Go home next time.')] }] },
  { t: 'choice', prompt: 'Never whistle on a boat because...', options: [{ text: 'It calls the wind', steps: [say('jun', 'happy', 'She always answers!')] }, { text: 'It scares the fish', steps: [say('jun', 'happy', 'That too.')] }] },
  say('jun', 'happy', 'Chart passed. Next, ride the ferry.'), { t: 'quest', id: 'sv4_licence', stage: 1 },
];

// ---------------------------------------------------------------- lodging: last-ferry safety
export async function stayNight(g, map, spawn, label, cost = 60) {
  const stranded = g.flag('seto_stranded') || g.minutes >= LAST_FERRY;
  const fee = stranded ? 0 : cost;
  return g.run([say(null, null, stranded ? `The last ferry has gone, so ${label} is free tonight.` : `${label}: ${cost} coins for the night.`), { t: 'choice', prompt: 'Stay the night?', options: [
    { text: 'Sleep', when: fee ? `money>=${fee}` : undefined, steps: [call(async () => {
      if (fee && !g.spend(fee)) return;
      S4(g).stranded++; g.setFlag('seto_stranded', false);
      await g.sleep();
      const v = get('map', map).spawns[spawn]; await g.warp(map, v[0], v[1], v[2] || 'down');
      g.toast('Woke on the island. First ferry at 07:30.', 'i_sun');
    })] }, { text: 'Not yet', steps: [] }] }]);
}
register('system', 'sv4_travel', {
  init(game) {
    game.bus.on('hour', () => {
      const m = game.world && game.world.map && game.world.map.id, isl = m && islandOfMap(m);
      if (isl && game.minutes >= 21 * 60 && game.minutes < 22 * 60 && !game.flag('seto_late_warned_' + game.day)) { game.setFlag('seto_late_warned_' + game.day); game.toast('The last ferry left long ago. A bed is waiting on the island.', 'i_moon'); }
    });
    game.bus.on('dayStart', () => { const b = S4(game).boat; if (b.rentDay && b.rentDay !== game.day) b.rentDay = 0; });
  },
});

features('Seto Islands', [
  'A ferry timetable at the harbour pier: departures every two hours from 07:00 to 17:00 to Tsubame Island, Lantern Isle and Coral Atoll, return ferries on the half hour',
  'A short sailing cutscene with a sea backdrop that changes with the weather and time of day, passing islands and seasonal touches',
  'Dolphins, whales, summer flying fish and autumn moon jellies sometimes join the ferry (logged as sightings)',
  'Ferry fares per island, halved once you are friends with Captain Nagisa',
  'The last ferry leaves at 17:30; afterwards the island lodgings (inn, bungalow, tower cot) are free for the night and you wake on the island',
  'Ferries stop on storm days, and in typhoon season (late summer to early autumn) also when it is windy',
  'Captain Jun\'s three-step Boat Licence quest: a sea chart quiz, a ferry ride, then rounding three buoys in a rented rowboat',
  'Rent a rowboat for the day at the harbour berth, buy the Sayori Jr. sailboat once licensed, and fit a motor',
  'Walk to the end of the harbour pier to launch your boat onto the Seto Sea',
]);
void hasBoat;
