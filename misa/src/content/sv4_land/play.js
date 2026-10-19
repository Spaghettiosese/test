// Mountain & Meadow interactions: trail book desk, bear bells, shelters, soaking and bath etiquette, ryokan stays, ropeway and
// region express bus, prospecting, meditation, ranch/mill/orchard/lake/cabin services.
import { register, get, features } from '../../core/registry.js';
import { addBuff } from '../economy/core.js';
import { SV4, badge, stamp, addStamina, mtWeather, say, clamp, nm, BADGES, STAMPS, badgesGot, stampsGot } from './data.js';
import { WHEAT, ORCHARD_ROWS, cabinOpen } from './maps_meadow.js';

const IA = (id, label, run) => register('interaction', id, { label, run });
const ask = (g, prompt, options) => g.run([{ t: 'choice', prompt, options: options.map(([text, fn, when]) => ({ text, when, steps: fn ? [{ t: 'call', fn }] : [] })) }]);
const fade = (g, fn, wait = 0.3) => g.run([{ t: 'fade', to: 1, dur: 0.4 }, { t: 'call', fn }, { t: 'wait', dur: wait }, { t: 'fade', to: 0, dur: 0.4 }]);
const mapId = (g) => (g.world && g.world.map ? g.world.map.id : '');
const hr = (g) => g.minutes / 60;
const daily = (S, key, day) => { if (S[key].day !== day) { S[key].day = day; S[key].taken = {}; } return S[key]; };
const ftxt = (n) => `${n} coins`;

// ------------------------------------------------------------------ trail book, bells, shelters, maps
IA('tk_register', 'Trail Book desk', async (g) => {
  const S = SV4(g);
  if (!g.has('key_tk_trail_book')) {
    await g.run([{ t: 'say', who: 'shun', mood: 'happy', text: 'New hiker? Sign the register and take a Trail Book. Collect twelve badges and the association will remember you.' }, { t: 'give', item: 'key_tk_trail_book', n: 1 }]);
    badge(g, 'first_steps'); return;
  }
  const got = badgesGot(g);
  await say(g, `Trail Book: ${got}/12 badges. Stamina ${Math.round(S.stamina)}%. Mountain weather today: ${mtWeather(g)}. Missing: ${BADGES.filter((b) => !S.badges[b[0]]).slice(0, 3).map((b) => b[1]).join(', ') || 'nothing, you did it!'}.`, 'shun');
});
IA('tk_bell', 'Ring the bear bell', (g) => { const S = SV4(g); S.bellsRung++; g.sfx('bell'); g.toast('Clang! Any bears nearby are now very politely elsewhere.'); badge(g, 'bear_bell'); g.addMood(1); });
IA('tk_trailmap', 'Trail map', (g) => {
  const w = mtWeather(g);
  return say(g, `Trail map: Switchback trail (forest), Falls trail (west), Summit trail (north), Village path (east to Yukemuri). Today the mountain is ${w}. ${w === 'thunder' ? 'THUNDER WARNING: stay near a shelter or the hut!' : w === 'fog' ? 'Fog on the upper trail: tiring but safe.' : w === 'snow' ? 'Snow: trails cost more stamina; sled runs on the summit.' : 'Clear and lovely.'}`);
});
IA('tk_forage_hint', 'Mossy clearing', (g) => say(g, 'A mossy clearing. Mushrooms and ferns grow here. Look for sparkles on the ground.', 'misa'));
IA('tk_shelter_rest', 'Rest in the shelter', (g) => fade(g, () => { const S = SV4(g); g.advance(30); addStamina(g, 25); g.addEnergy(3); g.addMood(1); S.expo = 0; if (mtWeather(g) === 'thunder') badge(g, 'storm_wise'); }).then(() => say(g, mtWeather(g) === 'thunder' ? 'Thunder rolls over the ridge, but the little roof holds. Safe and dry.' : 'A quiet sit in the shelter. Legs feel lighter already.', 'misa')));
IA('tk_hut_rest', 'Warm up by the hearth', (g) => ask(g, 'The hut keeper has the kettle on.', [
  ['Rest an hour', () => fade(g, () => { g.advance(60); addStamina(g, 35); g.addEnergy(6); g.addMood(3); SV4(g).expo = 0; })],
  ['Wait out the weather (3 hours)', () => fade(g, () => { g.advance(180); addStamina(g, 100); g.addEnergy(10); g.addMood(2); badge(g, 'storm_wise'); })],
  ['Order a hot meal', () => g.run([{ t: 'shop', id: 'sv4_hut' }])], ['Leave', null]]));
IA('tk_bunk', 'Hut bunk', (g) => ask(g, 'Lie down for a nap?', [['Nap for two hours', () => fade(g, () => { g.advance(120); g.addEnergy(22); addStamina(g, 100); g.addMood(4); if (['storm', 'rain'].includes(g.weather)) badge(g, 'storm_wise'); }).then(() => say(g, 'Rain drums on the tin roof. Best nap of the year.', 'misa'))], ['Not now', null]]));
IA('tk_logbook', 'Hut logbook', (g) => {
  const S = SV4(g), first = S.bookClaims.day !== g.day;
  if (first) { S.bookClaims.day = g.day; S.bookClaims.n = (S.bookClaims.n || 0) + 1; g.addMood(3); }
  return say(g, `You sign the logbook: "Misa, Hoshimori, ${g.season}. Cocoa was great." Entries from you: ${S.bookClaims.n || 0}. Someone wrote underneath: "Bring spare socks."`);
});

// ------------------------------------------------------------------ buses and the ropeway
const STOPS = { tsukimi_trailhead: ['Tsukimi Trailhead', 26, 15], yukemuri_village: ['Yukemuri Village', 8, 23], meadow_road: ['Meadow Road', 14, 13], meadow_market: ['Meadow Market', 17, 21], meadow_lake: ['Meadow Lake', 18, 26] };
export const FARE = 120, RW_FARE = 150;
async function travel(g, id, x, y, mins, via) {
  await g.run([{ t: 'fade', to: 1, dur: 0.5 }, { t: 'call', fn: () => { g.advance(mins); g.stat(via); } }]);
  await g.warp(id, x, y, 'down');
  await g.run([{ t: 'fade', to: 0, dur: 0.5 }]);
}
function express(g) {
  if (g.minutes < 6.5 * 60 || g.minutes >= 21 * 60) return say(g, 'The Region express has finished for the day. First bus at 6:30 AM.');
  const here = mapId(g);
  return ask(g, `Region express (${FARE} coins)`, [...Object.entries(STOPS).filter(([id]) => id !== here).map(([id, [name, x, y]]) => [`To ${name}`, async () => { if (!g.spend(FARE)) return g.toast('Not enough coins'); g.sfx('coin'); await travel(g, id, x, y, 35, 'regionBuses'); }, `money>=${FARE}`]), ['Not now', null]]);
}
IA('sv4_bus', 'Region express bus', express);
const RW = { tsukimi_trailhead: ['the trailhead', 30, 10], yukemuri_village: ['Yukemuri village', 25, 16], tsukimi_summit: ['the summit', 18, 15] };
IA('tk_ropeway', 'Tsukimi ropeway', (g) => {
  const here = mapId(g);
  if (g.minutes < 8 * 60 || g.minutes >= 18 * 60) return say(g, 'The ropeway runs 8 AM to 6 PM.');
  if (mtWeather(g) === 'thunder') return say(g, 'Ropeway suspended for lightning. Please wait inside.');
  return ask(g, `Ropeway (${RW_FARE} coins)`, [...Object.entries(RW).filter(([id]) => id !== here).map(([id, [name, x, y]]) => [`Ride to ${name}`, async () => { if (!g.spend(RW_FARE)) return g.toast('Not enough coins'); g.sfx('coin'); await g.run([{ t: 'say', who: null, text: 'The little cabin sways up over the treetops. Far below, steam drifts out of Yukemuri like a sleeping dragon.' }]); await travel(g, id, x, y, 15, 'ropewayRides'); }, `money>=${RW_FARE}`]), ['Not now', null]]);
});
// the old town bus stop now offers the region express too
{
  const old = get('interaction', 'bus_stop');
  if (old && !old.__sv4) {
    const base = old.run; old.__sv4 = true;
    old.run = (g, o) => (STOPS[mapId(g)] ? express(g) : ask(g, 'Which bus?', [['Town bus', () => base(g, o)], ['Region express: Mountain & Meadow', () => express(g)], ['Not now', null]]));
  }
}

// ------------------------------------------------------------------ soaking
const BATHS = {
  public_in: { name: 'the indoor bath', energy: 22, mood: 6, public: true, stamp: 'public_in' }, public_out: { name: 'the open-air bath', energy: 26, mood: 8, public: true, outdoor: true, stamp: 'public_out' },
  footbath: { name: 'the footbath', energy: 9, mood: 4, minutes: 20, stamp: 'footbath', feet: true }, cave: { name: 'the hidden cave spring', energy: 24, mood: 7, stamp: 'cave' },
  ryokan: { name: 'the private room tub', energy: 26, mood: 8, stamp: 'ryokan' }, hut: { name: 'the barrel bath', energy: 20, mood: 6, stamp: 'hut' }, cabin: { name: 'the cabin hot tub', energy: 24, mood: 8, outdoor: true },
};
const VIEW = { spring: 'Cherry petals drift onto the water.', summer: 'Cicadas chirr and the first stars come out above the steam.', autumn: 'Red maple leaves float across the surface like little boats.', winter: 'Snowflakes melt the moment they touch the hot water. Perfect.' };
export async function soak(g, id) {
  const S = SV4(g), b = BATHS[id];
  if (S.soak.day !== g.day) S.soak = { day: g.day, n: 0, per: {} };
  if (b.public && S.pass !== g.day && !(S.stay.paid === g.day)) return say(g, 'Bath pass first, please! The attendant at the counter sells day passes.', 'tetsu');
  if (g.minutes < 6 * 60 || (b.public && g.minutes >= 22 * 60)) return say(g, 'The bath is closed right now. Open 8 AM to 10 PM.');
  if (S.soak.n >= 4) return say(g, 'Four soaks is plenty for one day. Misa is light-headed and pink. Time for fruit milk and a rest!', 'misa');
  if (b.public && S.washed !== g.day) { S.washed = g.day; await say(g, 'Wash first! Misa hurries to a stool, scrubs, rinses, then slides into the bath like she meant to all along.', null); }
  const p = S.soak.per[id] || 0, night = g.minutes >= 19 * 60 || g.minutes < 5 * 60;
  let e = p === 0 ? b.energy : p === 1 ? Math.round(b.energy / 2) : 3;
  let m = p === 0 ? b.mood : 2;
  if (b.public && S.etiq === g.day) { e += 4; m += 2; }
  if (b.outdoor && (g.season === 'winter' || night)) { e += 5; m += 3; }
  if (g.hasBuff && g.hasBuff('pampered')) e += 3;
  await g.run([{ t: 'fade', to: 1, dur: 0.5 }, { t: 'call', fn: () => { g.advance(b.minutes || 45); g.addEnergy(e); g.addMood(m); addStamina(g, b.feet ? 20 : 45); S.soak.n++; S.soak.per[id] = p + 1; g.stat('soaks'); g.sfx('splash'); } }, { t: 'wait', dur: 0.5 }, { t: 'fade', to: 0, dur: 0.5 }]);
  await say(g, `Ahh. Soaking in ${b.name}. ${b.outdoor ? VIEW[g.season] : 'Warm water, soft steam, nowhere to be.'} (+${e} energy)`, 'misa');
  if (b.stamp) stamp(g, b.stamp);
  g.bus.emit('sv4Soak', { bath: id });
}
IA('yk_soak_in', 'Soak in the indoor bath', (g) => soak(g, 'public_in'));
IA('yk_soak_out', 'Soak in the open-air bath', (g) => soak(g, 'public_out'));
IA('yk_footbath', 'Soak your feet', (g) => soak(g, 'footbath'));
IA('yk_soak_cave', 'Soak in the cave spring', (g) => soak(g, 'cave'));
IA('yk_soak_ryokan', 'Soak in the room tub', (g) => soak(g, 'ryokan'));
IA('yk_soak_hut', 'Soak in the barrel bath', (g) => soak(g, 'hut'));
IA('yk_soak_cabin', 'Soak in the hot tub', (g) => soak(g, 'cabin'));
IA('yk_wash', 'Washing stool', (g) => { const S = SV4(g); if (S.washed === g.day) return say(g, 'Already squeaky clean.', 'misa'); S.washed = g.day; g.advance(10); g.addMood(2); g.sfx('splash'); return say(g, 'Scrub, scrub, rinse. A little wooden bucket, a lot of bubbles. Ready for the bath.', 'misa'); });
IA('yk_poster', 'Bath etiquette poster', async (g) => {
  const S = SV4(g);
  if (S.etiq === g.day) return say(g, 'You already passed the etiquette quiz today. The poster seems proud of you.', 'misa');
  await say(g, 'Tetsu: Want to test your bath manners, Misa? Answer right and the baths feel even better today.', 'tetsu');
  const r = await g.minigame('yk_etiquette', {});
  if (r.quit) return;
  if (r.score >= 0.6) { S.etiq = g.day; g.addFriend('tetsu', 12); g.addMood(3); await say(g, 'Spotless manners! The baths will feel extra nice today.', 'tetsu'); } else await say(g, 'Close! Wash first, towel on your head, quiet voices. Try again tomorrow.', 'tetsu');
});
IA('yk_bath_counter', 'Bath counter', (g) => {
  const S = SV4(g), fee = g.hearts('tetsu') >= 4 ? 150 : 300;
  if (S.pass === g.day || S.stay.paid === g.day) return say(g, 'Your pass is good until closing. Enjoy the water!', 'tetsu');
  return ask(g, `Day pass: ${ftxt(fee)}`, [['Buy a day pass', () => { if (!g.spend(fee)) return g.toast('Not enough coins'); S.pass = g.day; g.sfx('coin'); if (!g.has('key_yk_rally_card')) g.give('key_yk_rally_card', 1, true); return say(g, 'Here is your pass and a Stamp Rally card. Six baths in the region, six stamps. Towels are in the lockers.', 'tetsu'); }, `money>=${fee}`], ['Ask about the Stamp Rally', () => say(g, `Six baths, six stamps: two here, the footbath plaza, the hidden cave spring, a ryokan room tub and the hut's barrel bath. You have ${stampsGot(g)}/6.`, 'tetsu')], ['Not now', null]]);
});
IA('yk_milk', 'Fruit milk', (g) => ask(g, 'Bath fruit milk, 70 coins', [['Buy one', () => { if (!g.spend(70)) return g.toast('Not enough coins'); g.give('drink_yk_fruit_milk', 1); g.sfx('coin'); }, 'money>=70'], ['Not now', null]]));
IA('yk_vent', 'Steaming vent', (g) => {
  const egg = ['ing_egg', 'art_egg'].find((i) => get('item', i) && g.has(i));
  return ask(g, 'Hot steam hisses from the grate.', [['Steam an egg', () => { g.take(egg, 1); g.advance(20); g.give('dish_yk_onsen_egg', 1); g.sfx('pop'); return say(g, 'Twenty minutes later: a perfect onsen egg, silky as pudding.', 'misa'); }, egg ? undefined : 'flag:never_sv4'], ['Just watch', () => say(g, 'The ground smells of sulfur and warm stone. The whole village sits on a sleeping fire.', 'misa')], ['Leave', null]]);
});
IA('yk_sled', 'Village sled', async (g) => {
  if (g.season !== 'winter') return say(g, 'The village sleds are stored away until winter. The slope is just a nice grassy hill now.', 'misa');
  return runDownhill(g, 'sled');
});
IA('tk_ski_start', 'Ski start gate', (g) => runDownhill(g, 'ski'));
async function runDownhill(g, mode) {
  if (!g.useEnergy(6)) return g.toast('Too tired for a run');
  const r = await g.minigame('tk_downhill', { mode });
  if (r.quit) return;
  const S = SV4(g); S.ski.best = Math.max(S.ski.best, Math.round(r.score * 100)); g.advance(30); g.addMood(8); g.addMoney(Math.round(40 + r.score * 160), true);
  badge(g, 'snow_glide'); g.stat('downhillRuns'); g.bus.emit('sv4Downhill', { mode, score: r.score });
  await say(g, `${mode === 'ski' ? 'Skiing' : 'Sledding'} score ${Math.round(r.score * 100)}! The snow monkeys on the ridge applaud. Personal best ${S.ski.best}.`, 'misa');
}
IA('yk_cat_house', 'Cat caretaker\'s house', (g) => {
  const S = SV4(g);
  return ask(g, 'The onsen cats nap on the porch.', [['Give a cat snack', () => { if (!g.take('dish_yk_cat_snack', 1)) return say(g, 'No cat snacks. The egg stand sells them.', 'misa'); S.cats.fedN++; S.cats.hearts = Math.min(10, S.cats.hearts + (S.cats.fed === g.day ? 0 : 1)); S.cats.fed = g.day; g.addMood(4); g.addFriend('mayu', 4); g.sfx('pop'); return say(g, `Six cats appear from nowhere. Colony friendship: ${S.cats.hearts}/10.`, 'misa'); }], ['Count the cats', () => say(g, 'One ginger, one black, one cream... and a fourth who is mostly steam. Six in all.', 'misa')], ['Leave', null]]);
});
IA('sv4_region_board', 'Village noticeboard', (g) => say(g, `Yukemuri Notice: Stamp Rally ${stampsGot(g)}/6. Public bath 8 AM to 10 PM. Ropeway 8 AM to 6 PM. Winter: sled runs by the north hill, lantern festival on Winter 8.`));

// ------------------------------------------------------------------ ryokan stay
const TARGET = { ryokan: { map: 'ryokan_room', x: 3, y: 4 }, cabin: { map: 'meadow_cabin', x: 12, y: 3 } };
export async function sleepAt(g, kind) {
  const S = SV4(g), t = TARGET[kind];
  if (kind === 'ryokan' && S.stay.paid !== g.day) return say(g, 'This futon is for booked guests.');
  if (kind === 'cabin' && !cabinOpen(g)) return say(g, 'The cabin is not rented.');
  let ok = false; await ask(g, 'Go to sleep? You will wake up fresh.', [['Sleep until morning', () => { ok = true; }], ['Not yet', null]]);
  if (!ok) return;
  const w = g.world; let orig = null;
  if (w && w.load) { orig = w.load; w.load = function (m, ...a) { w.load = orig; return orig.call(w, t.map, t.x * 16 + 8, t.y * 16 + 14, 'down'); }; }
  try { await g.sleep(); } finally { if (w && orig && w.load !== orig) w.load = orig; }
  g.state.energy = g.state.maxEnergy; g.addMood(18); S.stay.night++; g.stat('cozyNights');
  if (kind === 'ryokan') { g.give('dish_yk_onsen_egg', 1, true); g.toast('Breakfast on a tray: an onsen egg, rice and miso'); } else { g.give('dish_ml_cheese_toast', 1, true); g.toast('You wake to the smell of lake breeze and toast'); }
}
register('system', 'sv4_sleep', { init(game) { game.sv4Sleep = (k) => sleepAt(game, k); } });
IA('yk_desk', 'Ryokan reception', (g) => {
  const S = SV4(g), booked = S.stay.paid === g.day;
  return ask(g, 'Okami Chiyo: Welcome to Kitsune-no-Yu.', [
    ['Book a room tonight (1200)', () => { if (g.minutes >= 22 * 60) return say(g, 'We close the books at 10 PM, dear.', 'chiyo'); if (!g.spend(1200)) return g.toast('Not enough coins'); S.stay.paid = g.day; g.sfx('coin'); g.stat('ryokanBookings'); return say(g, 'A room for one, with dinner and breakfast. Check in from 3 PM, the door at the end of the lobby. The baths are yours too.', 'chiyo'); }, !booked ? 'money>=1200' : 'flag:never_sv4'],
    ['Check my booking', () => say(g, 'Room Plum Blossom is ready from 3 PM. Dinner is served in your room at 6.', 'chiyo'), booked ? undefined : 'flag:never_sv4'],
    ['Day-guest tea (100)', () => { if (!g.spend(100)) return g.toast('Not enough coins'); g.addEnergy(8); g.addMood(4); g.advance(30); return say(g, 'Matcha and a sweet bean sweet in the lobby. The room is warm and the clock ticks softly.', 'chiyo'); }, 'money>=100'],
    ['Browse the souvenir counter', () => g.run([{ t: 'shop', id: 'sv4_souv' }])], ['Leave', null]]);
});
IA('yk_tea', 'Lobby tea', (g) => { g.addMood(2); g.addEnergy(2); g.advance(10); return say(g, 'Free barley tea in a tin kettle. Please help yourself, a note says.', 'misa'); });
IA('yk_room_tea', 'Room table', (g) => {
  const S = SV4(g);
  if (g.minutes >= 18 * 60 && S.stay.dinner !== g.day) return fade(g, () => { S.stay.dinner = g.day; g.advance(60); g.addEnergy(40); g.addMood(8); }, 0.8).then(() => say(g, 'Kaiseki dinner: tiny dishes, one more beautiful than the last. Chiyo kneels, pours tea, and says nothing, which is exactly right.', null));
  return say(g, S.stay.dinner === g.day ? 'The dinner trays are gone. The tea is still warm.' : 'A tea set and a plate of sweets. Dinner arrives at 6 PM.', 'misa');
});
IA('yk_window', 'Room window', (g) => say(g, { spring: 'Cherry trees below the window, and a wisp of bath steam through the petals.', summer: 'Fireflies over the stream behind the inn.', autumn: 'The mountain is a patchwork of red and gold.', winter: 'Snow settles on the roofs of Yukemuri. Everything is quiet.' }[g.season], 'misa'));
IA('sv4_hint', 'Look', (g) => say(g, 'Nothing here.'));

// ------------------------------------------------------------------ prospecting, meditation, shrine, summit
IA('tk_prospect', 'Prospect the rocks', (g, o) => {
  const S = SV4(g), P = daily(S, 'prospect', g.day), key = `${mapId(g)}:${o.x},${o.y}`;
  if (P.taken[key]) return say(g, 'Already picked clean today. The rock sulks.', 'misa');
  if (!g.useEnergy(3)) return g.toast('Too tired');
  P.taken[key] = 1; g.advance(15); g.sfx('dig');
  const pick = g.has('tool_pickaxe') || g.has('tool_pickaxe_2') || g.has('tool_pickaxe_3'), r = g.rng() - (pick ? 0.08 : 0);
  const id = r < 0.05 ? 'min_tk_moonglass' : r < 0.2 ? 'min_tk_onsen_crystal' : r < 0.45 ? 'min_tk_obsidian' : 'min_tk_sulfur';
  g.give(id, 1); g.collect('mineral', id); g.addXP('mining', 4); g.stat('prospected'); g.toast(`Found ${nm(id)}!`, get('item', id).icon);
  if (id === 'min_tk_moonglass') g.toast('A rare find!');
});
IA('tk_meditate', 'Meditate by the falls', (g) => {
  const S = SV4(g);
  if (S.medit_day === g.day) return say(g, 'You have already sat with the falls today. The stillness is still there.', 'misa');
  return fade(g, () => { S.medit_day = g.day; S.medit++; g.advance(30); addStamina(g, 40); g.addEnergy(6); g.addMood(8); badge(g, 'still_mind'); }, 1).then(() => say(g, 'Water falls. Breath falls. For half an hour, thoughts fall too.', null));
});
IA('tk_cave_boulder', 'Mossy boulder', (g) => {
  const S = SV4(g);
  if (S.stamina < 15) return say(g, 'Too tired to push. Rest a little first.', 'misa');
  addStamina(g, -15); S.cave = true; g.setFlag('sv4_cave'); badge(g, 'cave'); g.sfx('thud'); if (g.world) g.world.refreshRects();
  return say(g, 'The boulder rolls aside with a grumble, and warm air breathes out of a cave. A spring glows blue inside.', 'misa');
});
IA('tk_shrine', 'Summit shrine', (g) => {
  if (g.flag('sv4_shrine_day') === g.day) return say(g, 'The little shrine is quiet. You already prayed today.', 'misa');
  g.setFlag('sv4_shrine_day', g.day); addBuff(g, 'calm', 240); g.addMood(6); g.sfx('bell');
  return say(g, 'Two claps, one bow. The wind pauses to listen. A calm feeling settles over you for the afternoon.', 'misa');
});
IA('tk_cairn', 'Stone cairn', (g) => say(g, 'A cairn of pebbles, one from every hiker. You add a little white one. Thank you, mountain.', 'misa'));
IA('tk_telescope', 'Telescope', (g) => {
  const night = g.minutes >= 19 * 60 || g.minutes < 5 * 60;
  if (g.flag('sv4_scope') !== g.day) { g.setFlag('sv4_scope', g.day); g.addMood(night ? 8 : 4); }
  return say(g, night ? (g.weather === 'clear' || g.weather === 'sunny' ? 'The sky is crowded with stars, thick as spilled sugar. The lens finds the Tsukimi moon, huge and pocked.' : 'Cloud, mostly. A single star winks through a gap.') : 'Far below: Hoshimori Bay, the white lighthouse, tiny boats, the square with its fountain. Home looks like a toy.', 'misa');
});
IA('tk_horizon', 'Watch the sea of clouds', async (g) => {
  const S = SV4(g);
  if (mtWeather(g) === 'thunder') return say(g, 'Lightning flickers in the cloud. Not today!');
  if (g.minutes < 4.5 * 60 || g.minutes >= 8.5 * 60) return say(g, 'The sea of clouds appears at dawn, between 4:30 and 8:30 AM. Come early with a thermos.', 'misa');
  if (S.cloudDay === g.day) return say(g, 'You already photographed the clouds this morning.', 'misa');
  const r = await g.minigame('tk_horizon', { fog: mtWeather(g) === 'fog' });
  if (r.quit) return;
  S.cloudDay = g.day; S.clouds++; g.addMood(10); g.addEnergy(5);
  if (r.score >= 0.6) { badge(g, 'cloud_sea'); if (r.score >= 0.85) g.give('min_tk_onsen_crystal', 1, true); }
  await say(g, r.score >= 0.6 ? 'A golden sun rising over a white sea, with the Brocken ring around your shadow. You will never forget this.' : 'The shot is a bit blurry, but the sunrise itself was perfect.', 'misa');
});

// ------------------------------------------------------------------ ranch, mill, orchard, lake, cabin
const MILL = [['ing_ml_wheat', 'ing_flour', 2], ['ing_ml_buckwheat', 'ing_ml_soba_flour', 2], ['ing_rice', 'art_rice_flour', 1], ['crop_corn', 'art_cornmeal', 1], ['crop_sweet_potato', 'art_sweet_flour', 1]].filter(([a, b]) => get('item', a) && get('item', b));
IA('ml_mill', 'Windmill mill', (g) => {
  const opts = MILL.filter(([a]) => g.has(a)).map(([a, b, k]) => [`Grind ${nm(a)} into ${nm(b)}`, () => { const n = Math.min(10, g.count(a)); g.take(a, n); g.give(b, n * k); g.advance(15 + n * 3); g.addXP('cooking', n); g.sfx('dig'); SV4(g).flour += n; g.stat('flourGround', n); return say(g, `The great sails creak and the stones rumble. ${n * k} ${nm(b)} pours into the sack.`, 'misa'); }]);
  return ask(g, opts.length ? 'The windmill is turning. What shall it grind?' : 'The windmill is turning, but you have no grain. Harvest wheat in the field or buy buckwheat from the miller.', [...opts, ['Leave', null]]);
});
IA('ml_barn', 'Milking shed', (g) => say(g, `Daigo's milking shed smells of hay and warm milk. Milked today: ${Object.values(SV4(g).ranch.milked).filter((d) => d === g.day).length} of 5 cows. Walk up to a cow in the pasture to milk her.`, 'misa'));
IA('ml_board', 'Meadow notice board', (g) => say(g, 'Meadow Hills: ranch (cows, sheep, horses), the windmill (flour), the orchard (u-pick by season), the lake (rowing, fishing, cabin) and the weekend market with the autumn barn dance.'));
IA('ml_market_board', 'Market board', (g) => say(g, `Market days: Saturday and Sunday, 9 AM to 4 PM, plus festival days. The traveling vet visits on weekends. Today is ${g.isWeekend ? 'a market day!' : 'a quiet day: stalls are shut.'}`));
IA('ml_orchard_gate', 'Orchard basket gate', (g) => {
  const S = SV4(g);
  if (S.orchard.pass === g.day) return say(g, 'Your basket pass is good all day. Pick whatever is ripe!', 'misa');
  return ask(g, 'U-pick basket pass: 120 coins', [['Buy a pass', () => { if (!g.spend(120)) return g.toast('Not enough coins'); S.orchard.pass = g.day; g.sfx('coin'); return say(g, 'Basket in hand! Look for ripe trees in this season\'s row.', 'misa'); }, 'money>=120'], ['Not now', null]]);
});
IA('ml_row_sign', 'Orchard row sign', (g, o) => {
  const row = ORCHARD_ROWS.find((r) => r[1] === o.y) || ORCHARD_ROWS[0];
  return say(g, `${row[0] === 'apple' ? 'Apple and persimmon' : row[0][0].toUpperCase() + row[0].slice(1)} row. Ripe in ${row[2]}${row[2] === g.season ? ': ripe now!' : '.'}`);
});
IA('ml_boathouse', 'Boat house', (g) => ask(g, 'Boatman Ginjiro: Fine day for it.', [['Rent a rowing boat (150)', () => rowing(g), 'money>=150'], ['Buy a lake lantern (150)', () => { if (!g.spend(150)) return g.toast('Not enough coins'); g.give('gift_ml_lantern', 1); g.sfx('coin'); }, 'money>=150'], ['Fishing tips', () => say(g, 'Catfish bite at night, bass on bright days, and the moon koi only under a clear night sky. Be patient.', 'ginjiro')], ['Leave', null]]));
IA('ml_row', 'Dock: row a boat', (g) => rowing(g));
async function rowing(g) {
  if (g.minutes < 7 * 60 || g.minutes >= 18 * 60) return say(g, 'Boats go out between 7 AM and 6 PM.', 'ginjiro');
  if (!g.spend(150)) return g.toast('Not enough coins');
  g.sfx('coin'); const S = SV4(g);
  const r = await g.minigame('ml_rowing', { calm: !['storm', 'rain'].includes(g.weather) });
  g.advance(60); g.useEnergy(8); g.addMood(10); S.rows.best = Math.max(S.rows.best, Math.round(r.score * 100)); g.stat('rowTrips');
  const pay = Math.round(40 + r.score * 180); g.addMoney(pay, true);
  if (r.score >= 0.7 && get('item', 'forage_ml_lotus')) { g.give('forage_ml_lotus', 1, true); g.collect('forage', 'forage_ml_lotus'); }
  await say(g, `Rowing score ${Math.round(r.score * 100)}. Ginjiro refunds ${pay} coins in tips and lotus bounty. Personal best ${S.rows.best}.`, 'ginjiro');
}
IA('ml_cabin_desk', 'Cabin rental board', (g) => {
  const S = SV4(g);
  if (cabinOpen(g)) return say(g, `The cabin is yours until Sunday night. The key hangs on the porch hook. (${S.cabin - g.day} more day${S.cabin - g.day === 1 ? '' : 's'}.)`);
  if (g.weekday < 4) return say(g, 'Weekend getaways only: rent from Friday to Sunday. Cabin 1500 coins, includes firewood and hot tub.');
  return ask(g, 'Rent the lakeside cabin for the weekend? 1500 coins', [['Rent it', () => { if (!g.spend(1500)) return g.toast('Not enough coins'); S.cabin = g.day + (6 - g.weekday); g.sfx('coin'); g.stat('cabinRentals'); return say(g, 'Keys in hand! A bed, a fireplace and a hot tub on the porch. Sleep there to wake up fully refreshed.', 'misa'); }, 'money>=1500'], ['Not now', null]]);
});
IA('ml_cabin_fire', 'Cabin fireplace', (g) => fade(g, () => { g.advance(30); g.addEnergy(5); g.addMood(4); }).then(() => say(g, 'Logs crackle. Outside the lake is dark and silver. You could sit here forever.', 'misa')));

// ------------------------------------------------------------------ shop interactions
const SHOPS = { sv4_shop_tea: 'sv4_tea', sv4_shop_souv: 'sv4_souv', sv4_shop_egg: 'sv4_egg', sv4_shop_ranch: 'sv4_ranch', sv4_shop_mill: 'sv4_mill', sv4_shop_fruit: 'sv4_fruit', sv4_shop_dairy: 'sv4_dairy', sv4_shop_bakery: 'sv4_bakery', sv4_shop_craft: 'sv4_craft', sv4_shop_produce: 'sv4_produce' };
for (const [ia, shop] of Object.entries(SHOPS)) IA(ia, 'Browse the shop', (g) => { const s = get('shop', shop); if (s && g.shopOpen && !g.shopOpen(shop)) return say(g, `Closed right now. ${g.shopHours ? g.shopHours(shop) : ''}`); return g.run([{ t: 'shop', id: shop }]); });

// ------------------------------------------------------------------ wheat harvest (field behind the windmill)
register('targetProvider', 'sv4_wheat', {
  find(world, game) {
    if (world.map.id !== 'meadow_windmill' || !game.state.sv4_land) return null;
    const p = world.player, tx = Math.floor(p.x / 16), ty = Math.floor((p.y - 1) / 16);
    if (tx < WHEAT.x0 - 1 || tx > WHEAT.x1 + 1 || ty < WHEAT.y0 - 1 || ty > WHEAT.y1 + 1) return null;
    return { label: 'Harvest wheat', dist: 4, x: p.x, y: p.y, run: (g) => harvestWheat(g) };
  },
});
function harvestWheat(g) {
  const S = SV4(g), W = daily(S, 'wheat', g.day);
  if (!['summer', 'autumn'].includes(g.season)) return say(g, g.season === 'spring' ? 'The wheat is still green and short. Come back in summer.' : 'Frosty stubble. The field is resting.', 'misa');
  if ((W.n || 0) >= 8) return say(g, 'That is enough sheaves for one day. Fumi needs some left to ripen.', 'misa');
  if (!g.useEnergy(2)) return g.toast('Too tired');
  W.n = (W.n || 0) + 1; g.give('ing_ml_wheat', 1); if (g.rng() < 0.25) g.give('ing_ml_buckwheat', 1, true); g.advance(10); g.sfx('pop'); g.addXP('gardening', 2); g.stat('wheatCut');
}
// ------------------------------------------------------------------ u-pick fruit
import { orchardTrees } from './maps_meadow.js';
const treeKey = (t) => `${t.x},${t.y}`;
const FRUITOF = { cherry: ['spring', 'ing_cherry'], peach: ['summer', 'ing_peach'], apple: ['autumn', 'ing_apple'], persimmon: ['autumn', 'ing_persimmon'], orange: ['winter', 'ing_ml_mikan'] };
register('targetProvider', 'sv4_orchard', {
  find(world, game) {
    if (world.map.id !== 'meadow_orchard' || !game.state.sv4_land) return null;
    const S = SV4(game), O = daily(S, 'orchard', game.day);
    let best = null, bd = 22;
    for (const t of orchardTrees()) { const d = Math.hypot(t.x * 16 + 8 - world.player.x, t.y * 16 + 14 - world.player.y); if (d < bd) { bd = d; best = t; } }
    if (!best) return null;
    const [season, item] = FRUITOF[best.kind];
    return { label: season === game.season && !O.taken[treeKey(best)] ? `Pick ${best.kind}` : `${best.kind} tree`, dist: bd - 6, x: best.x * 16 + 8, y: best.y * 16 + 8, run: (g) => {
      if (season !== g.season) return say(g, `The ${best.kind} tree is resting. Ripe in ${season}.`, 'misa');
      if (S.orchard.pass !== g.day) return say(g, 'Buy a basket pass at the gate board first (120 coins).', 'misa');
      if (O.taken[treeKey(best)]) return say(g, 'This tree is bare for today.', 'misa');
      if (!get('item', item) || !g.useEnergy(1)) return g.toast('Too tired');
      O.taken[treeKey(best)] = 1; const n = 1 + (g.rng() < 0.5 ? 1 : 0) + (g.rng() < 0.15 ? 1 : 0);
      g.give(item, n); g.advance(5); g.sfx('pop'); g.stat('fruitPicked', n); g.addXP('gardening', 2); g.collect('forage', item); g.toast(`Picked ${n} ${nm(item).toLowerCase()}`, get('item', item).icon);
    } };
  },
});
void clamp; void BADGES; void STAMPS;

features('Mountain & Meadow', [
  'Trail Book desk at the Tsukimi Trailhead: sign in for a Trail Book, see your badges, stamina and the mountain weather',
  'Bear bells on the trail to ring, trail maps with a daily mountain weather advisory, and roofed shelters for resting and sitting out storms',
  'Hiking stamina bar on the mountain trails: it drains faster in fog and snow, a walking stick helps, and shelters, tea, soaks and the hut restore it, but running out only means a rest, never a game over',
  'Mountain weather (fog banks, thunder with lightning flashes, snow) with a gentle rescue by the guide Shun, who carries you to the hut if you linger in a storm',
  'Region express bus from the town bus stop to Tsukimi Trailhead, Yukemuri, Meadow Road, the Market and the Lake, and a ropeway linking the trailhead, village and summit',
  'Hot-spring soaking: wash first, pay the day pass at the bath counter, soak for energy, mood and stamina, with a view that changes with the season',
  'Bath etiquette quiz minigame at the poster (with a bot): pass it for a bonus to every public soak that day',
  'Six-bath Stamp Rally (indoor bath, open-air bath, footbath plaza, hidden cave spring, ryokan tub, hut barrel bath) with a Stamp Rally card and a golden towel, coins and Star Stickers for a full card',
  'Book a room at the ryokan, enjoy a kaiseki dinner in the tatami room, and sleep on the futon to wake refreshed with breakfast',
  'Steam an egg in the village vents to make an onsen egg, soak your feet at the footbath plaza and visit the cat caretaker\'s house',
  'Hidden cave behind the Tsukimi Falls: push the boulder aside (stamina) to find a glowing hot spring and crystal rocks',
  'Meditate on the flat rock beside the waterfall for stamina, energy and mood',
  'Prospect the cave, falls and summit rocks for sulfur, obsidian, onsen crystal and rare moon glass',
  'Summit shrine blessing, a telescope for the bay by day and the stars by night, and a stone cairn',
  'Sea of Clouds dawn minigame: frame the sunrise glory over the cloud sea with a viewfinder (with a bot)',
  'Winter ski and sled runs: a downhill gliding minigame (with a bot) from the summit gate and the village hill, with coin prizes',
  'Mountain hut with a hearth, stew, bunk naps, a logbook and a barrel bath, safe in any storm',
  'Windmill: grind wheat, buckwheat, rice, corn and sweet potatoes into flour, and harvest wheat in the field in summer and autumn',
  'U-pick orchard rows by season: cherries in spring, peaches in summer, apples and persimmons in autumn, mikan in winter, with a daily basket pass',
  'Rowing minigame on Meadow Lake (with a bot), boat rental, lake lanterns and tips from the boatman',
  'Rent the lakeside cabin for a weekend getaway: a fireplace, a hot tub and a bed that restores full energy',
]);
