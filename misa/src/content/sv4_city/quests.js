// Kitaminato quests and systems: the Tourist Info desk, the five-mission Day Pass quest chain, the street-photo scavenger hunt, Lantern Night and
// Summer Fireworks festivals, weather-aware crowds, the 'Kita' phone app (and a node on the Map app), special orders and the graduation hook.
import { register, get, features } from '../../core/registry.js';
import { clockText } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { UI, rect, panel, drawText, drawTextC, wrap, inside } from '../../ui/ui.js';
import { TEMPLATES } from '../sv_life/orders.js';
import { S, STAMPS, say, N, call, has, here, giveOr, stamp, stampCount, wrapMap, inCity, CITY_MAPS } from './core.js';
import { DEP, nextDep, timetableText, FARE, PASS_FARE } from './trains.js';

const sticker = (g, n, why) => { if (g.giveStickers) g.giveStickers(n, why); };
const fadeOut = { t: 'fade', to: 1, dur: 0.5 }, fadeIn = { t: 'fade', to: 0, dur: 0.5 };

// ---------------------------------------------------------------- the Day Pass quest chain (5 missions)
register('quest', 'kc_city_quest', {
  name: 'Kitaminato Day Missions', desc: 'Five small missions around the big city, posted at the Tourist Info desk.',
  stages: ['Find the red balloon the lost child is crying about (look in the trees on Harbour Walk).', 'Take the balloon back to the child on Station Plaza.', 'Pick up the parcel at the west end of Hikari Arcade and deliver it to the east end.',
    'Join the flash mob on Station Plaza (find the organizer by the fountain).', 'Help the takoyaki vendor on Harbour Walk.', 'After 5:30 PM, light a lantern at the Harbour Walk for the night festival.'],
});
const Q = (g) => S(g).q;
const step = (g, n) => { const q = Q(g); q.step = n; if (n === 1) g.startQuest('kc_city_quest'); else if (n >= 7) { q.done = true; g.setFlag('kc_quest_done'); g.completeQuest('kc_city_quest'); } else g.setStage('kc_city_quest', n - 1); };
const at = (n) => (g) => Q(g).step === n;
const obj = (x, y, label, run, when, spr) => ({ x, y, w: 1, h: 1, solid: false, ...(spr ? { spr } : {}), when, interact: { label, run } });

wrapMap('kita_station_plaza', { objects: [
  { spr: 'kc_kid', x: 46, y: 20, solid: true, shadow: 6, when: (g) => Q(g).step === 1 || Q(g).step === 2, interact: { label: 'Talk to the child', run: (g) => {
    if (Q(g).step === 1) return g.run([say('misa', 'neutral', 'Are you okay? Where is your mum?'), N('"My balloon flew away! It was red and it had a face! It went toward the harbour!" The child sniffs and points south.')]);
    if (!Q(g).balloon) return g.say(null, null, 'The child keeps looking south. "Please find my balloon..."');
    g.run([N('The child gasps and hugs the balloon with both arms.'), say('misa', 'happy', 'There you go. Stay close to your mum, okay?'), N('A woman rushes up, out of breath. "There you are! Thank you so much!"'), call((gm) => { gm.addMoney(150, true); gm.give('gift_city_balloon', 1); gm.addMood(8); step(gm, 3); gm.toast('Mission 1 complete', 'i_star'); })]);
  } } },
  { spr: 'kc_ped_1_0', x: 29, y: 21, solid: false, shadow: 5, when: at(4), interact: { label: 'Flash mob organizer', run: (g) => g.run([say(null, 'happy', 'The organizer waves a megaphone: "We need one more dancer! Just follow the arrows!"'), { t: 'minigame', id: 'kc_flash', opts: {}, done: (gm, r) => {
    if (r.quit) return; gm.advance(30); gm.stat('kcFlash'); stamp(gm, 'flash');
    gm.addMoney(100 + (r.stars || 1) * 60, true); gm.addMood(10); step(gm, 5); gm.run([N('The crowd cheers and the plaza fills with phone cameras. Somebody throws a flower.'), say('misa', 'happy', 'My heart is pounding. That was amazing!')]);
  } }]) } },
] });
wrapMap('kita_harbourwalk', { objects: [
  { spr: 'kc_balloon', x: 33, y: 9, solid: false, shadow: 0, when: (g) => Q(g).step === 1 && !Q(g).balloon, interact: { label: 'Reach for the balloon', run: (g) => g.run([N('A red balloon with a face is tangled in the sakura branch.'), { t: 'choice', prompt: 'How do you get it?', options: [{ text: 'Jump and grab', steps: [call((gm) => { Q(gm).balloon = true; gm.useEnergy(4); }), say('misa', 'happy', 'Got it! The string is a bit chewed, but it is fine.')] }, { text: 'Use a bench to stand on', steps: [call((gm) => { Q(gm).balloon = true; }), say('misa', 'happy', 'Careful... almost... got it!')] }] }]) } },
  { spr: 'kc_ped_2_0', x: 51, y: 10, solid: false, shadow: 5, when: at(5), interact: { label: 'Help the vendor', run: (g) => g.run([say(null, 'sad', 'The vendor mops his forehead: "A tour group just arrived and I am out of everything! Could you stock the shelves while I cook?"'), { t: 'minigame', id: 'kc_spree', opts: { mode: 'vendor' }, done: (gm, r) => {
    if (r.quit) return; gm.advance(35); gm.addMoney(200 + (r.stars || 1) * 50, true); gm.give('city_takoyaki', 1); step(gm, 6); gm.addMood(6); gm.toast('Mission 4 complete', 'i_star'); gm.run([say(null, 'happy', 'You saved my evening! Here, take a hot one. Come back after dark: the lantern festival starts tonight.')]);
  } }]) } },
  { spr: 'kc_tea_lantern', x: 24, y: 9, shadow: 5, when: at(6), interact: { label: 'Light the festival lantern', run: (g) => {
    if (g.minutes < 17 * 60 + 30) return g.say('misa', 'neutral', 'The lantern keeper says: "Come back after 5:30 PM, when the sky gets dark."');
    g.run([fadeOut, { t: 'scene', name: 'kc_lanterns' }, fadeIn, N('Paper lanterns drift up from the pier, one by one, until the whole bay is a field of floating stars.'), say('misa', 'happy', 'I wish... for a day like this to happen again.'), { t: 'wait', dur: 1 },
      { t: 'scene', name: 'kc_fireworks' }, N('A single firework blooms over the water, then another. Applause rolls along the boardwalk.'),
      call((gm) => { gm.advance(45); gm.addMoney(800, true); sticker(gm, 3, 'Day Missions'); if (has('cloth_city_lantern') && !gm.has('cloth_city_lantern') && !gm.flag('kc_lantern_got')) { gm.setFlag('kc_lantern_got'); gm.give('cloth_city_lantern', 1); } gm.addMood(14); step(gm, 7); stamp(gm, 'quest'); stamp(gm, 'lantern'); }),
      fadeOut, { t: 'scene', name: null }, fadeIn, N('Mission 5 complete. You finished all five Kitaminato Day Missions!')]);
  } } },
] });
wrapMap('kita_arcade', { objects: [
  obj(4, 7, 'Pick up the parcel', (g) => g.run([N('A brown parcel tied with string. The label says: "Hotel Tsuki, east end of the arcade. Please hurry."'), call((gm) => { Q(gm).parcel = gm.minutes; gm.toast('Parcel picked up', null); })]), (g) => Q(g).step === 3 && !Q(g).parcel, 'kc_parcel'),
  obj(66, 11, 'Deliver the parcel', (g) => {
    const fast = g.minutes - Q(g).parcel <= 35;
    g.run([say('kc_kuma', 'happy', 'At last! My towels!'), N(fast ? 'You made it in record time. Kuma tips well.' : 'A little late, but the towels are safe.'), call((gm) => { gm.addMoney(fast ? 300 : 160, true); gm.advance(10); Q(gm).parcel = 0; step(gm, 4); gm.toast('Mission 2 complete', 'i_star'); })]);
  }, (g) => Q(g).step === 3 && !!Q(g).parcel),
] });

// ---------------------------------------------------------------- the street-photo scavenger hunt (8 shots)
const SHOTS = [['kita_station_plaza', 37, 15, 'The station clock tower', 'The old station clock above the commuters, perfectly framed.'], ['kita_station_plaza', 29, 19, 'The fountain at its highest', 'Spray catches the sun like glass beads.'],
  ['kita_arcade', 35, 9, 'The lantern roof', 'A hundred paper lanterns in a perspective tunnel.'], ['kita_arcade', 22, 7, 'The pet shop window', 'A kitten sleeps in a teacup. The shot of the day.'],
  ['kita_harbourwalk', 29, 18, 'The pier at the water', 'The pier leads to a hazy line of sea.'], ['kita_harbourwalk', 44, 7, 'The ferris wheel from below', 'Spokes of light against the clouds.'],
  ['kita_oldtown', 29, 7, 'The torii gate', 'Vermilion pillars and a lantern at each foot.'], ['kita_uni', 15, 24, 'The lawn squirrel', 'A squirrel stands on a bench like a tiny professor.']];
const photoObjs = (map) => SHOTS.filter((s) => s[0] === map).map(([, x, y, label, text]) => obj(x, y, `Take a photo: ${label}`, (g) => {
  const p = S(g).photo, key = `${map}:${x},${y}`; p.found[key] = g.day; g.sfx('camera'); g.stat('kcPhotos'); g.advance(5);
  const n = Object.keys(p.found).length;
  g.run([N(`Click! ${text} (${n}/${SHOTS.length})`), call((gm) => { if (n >= SHOTS.length && !p.done) { p.done = true; gm.addMoney(500, true); sticker(gm, 2, 'photo hunt'); if (has('gift_city_toy_camera') && !gm.has('gift_city_toy_camera')) gm.give('gift_city_toy_camera', 1); stamp(gm, 'photo'); gm.toast('Photo hunt complete!', 'i_star'); } })]);
}, (g) => S(g).photo.on && !S(g).photo.done && !S(g).photo.found[`${map}:${x},${y}`]));
for (const m of ['kita_station_plaza', 'kita_arcade', 'kita_harbourwalk', 'kita_oldtown', 'kita_uni']) wrapMap(m, { objects: photoObjs(m) });

// ---------------------------------------------------------------- Tourist Info
register('interaction', 'kc_info', {
  label: 'Tourist Info',
  run: (g) => {
    const q = Q(g), p = S(g).photo;
    const questOpt = q.done ? { text: 'Day Missions (all done!)', steps: [say('misa', 'happy', 'All five missions complete. The desk lady gives me a thumbs up.')] }
      : q.step === 0 ? { text: 'Day Missions: start', steps: [N('Five small missions: a lost balloon, a parcel, a flash mob, a hungry vendor and a night festival. A Day Pass is handy for the travel.'), call((gm) => { step(gm, 1); }), N('Mission 1: a child is crying on Station Plaza, by the benches.')] }
      : { text: 'Day Missions: where am I?', steps: [call((gm) => gm.toast(`Mission ${Math.min(5, Q(gm).step + (Q(gm).step >= 3 ? -1 : 0))}: ${get('quest', 'kc_city_quest').stages[Math.min(5, Q(gm).step - 1)]}`.slice(0, 120), null)), N(get('quest', 'kc_city_quest').stages[Math.min(5, q.step - 1)])] };
    g.run([say(null, 'happy', 'Welcome to Kitaminato! How can I help?'), { t: 'choice', prompt: 'Tourist Info', options: [questOpt,
      { text: p.done ? 'Photo hunt (done)' : p.on ? 'Photo hunt: hint' : 'Photo hunt: start', steps: p.done ? [N('You found all eight shots. Well done!')] : p.on ? [call((gm) => gm.toast(`${Object.keys(p.found).length}/8 photos found. Look for glowing spots around the five districts.`, null))] : [N('Eight famous city shots to find: clock, fountain, lanterns, pet shop, pier, ferris wheel, torii and a campus squirrel.'), call((gm) => { p.on = true; })] },
      { text: `Stamp book (${stampCount(g)}/40)`, steps: [call((gm) => { if (!gm.has('key_city_stamp_book')) gm.give('key_city_stamp_book', 1); }), N(`Your stamp book has ${stampCount(g)} of 40 stamps. Open the Kita app on your phone to see them all.`)] },
      { text: 'Event tips', steps: [N('Lantern Night is on Autumn 24 at the Harbour Walk and Old Town. Summer Fireworks are on Summer 22 at the Harbour Walk.')] }, { text: 'Thanks', steps: [] }] }]);
  },
});

// ---------------------------------------------------------------- festivals
const T = (spot, spr, dx = 0, dy = 0, extra = {}) => ({ spot, spr, dx, dy, ...extra });
register('festival', 'kc_lantern_night', {
  name: 'Kitaminato Lantern Night', icon: 'i_star', date: 'autumn-24', maps: ['kita_harbourwalk', 'kita_oldtown'], hours: ['17:00', '22:00'], shop: true,
  desc: 'Paper lanterns line the Old Town street and float from the harbour pier. A big city festival, one train ride away.',
  decor: { kita_harbourwalk: [T('lantern_spot', 'ev_lanterns', 0, -2, { light: 'lantern' }), T('promenade', 'ev_lanterns', 0, -2, { light: 'lantern' }), T('pier_end', 'ev_chochin', -1, 0, { light: 'lantern' }), T('pier_end', 'ev_chochin', 1, 0, { light: 'lantern' })],
    kita_oldtown: [T('lantern_row', 'ev_lanterns', -3, -2, { light: 'lantern' }), T('lantern_row', 'ev_lanterns', 3, -2, { light: 'lantern' }), T('temple', 'ev_chochin', -1, 0, { light: 'lantern' }), T('temple', 'ev_chochin', 1, 0, { light: 'lantern' })] },
  activities: [{ id: 'float', map: 'kita_harbourwalk', spot: 'pier_end', dy: 1, label: 'Float a lantern (50 coins)', cost: 50, daily: true, run: (g) => { g.addMood(10); g.stat('kcLanterns'); S(g).lantern++; return g.run([N('You write a wish on the paper and set the lantern on the water. It drifts away, glowing.'), say('misa', 'happy', 'Please keep everyone I love safe and happy.')]); } }],
  closeAt: '20:30', closeMap: 'kita_harbourwalk',
  script: () => [fadeOut, { t: 'scene', name: 'kc_lanterns' }, fadeIn, N('The Lantern Night procession ends at the pier. Hundreds of lanterns rise together.'), say('misa', 'happy', 'It is like the stars came down to see us.'), call((g) => { g.addMood(15); stamp(g, 'lantern'); }), fadeOut, { t: 'scene', name: null }, fadeIn],
});
register('festival', 'kc_summer_fireworks', {
  name: 'Kitaminato Summer Fireworks', icon: 'i_star', date: 'summer-22', maps: ['kita_harbourwalk'], hours: ['17:30', '22:30'], shop: true,
  desc: 'The biggest fireworks show on the bay. Stalls line the harbour walk and the ferris wheel stays lit all night.',
  decor: { kita_harbourwalk: [T('promenade', 'ev_chochin', -2, 0, { light: 'lantern' }), T('promenade', 'ev_chochin', 2, 0, { light: 'lantern' }), T('fireworks', 'ev_bunting', 0, -3), T('bench', 'ev_chochin_pink', 0, 0, { light: 'lantern' })] },
  activities: [{ id: 'yakisoba', map: 'kita_harbourwalk', spot: 'takoyaki', dy: 1, label: 'Festival takoyaki', cost: 140, run: (g) => { if (has('city_takoyaki')) g.give('city_takoyaki', 1); } }],
  closeAt: '20:30', closeMap: 'kita_harbourwalk',
  script: () => [fadeOut, { t: 'scene', name: 'kc_fireworks' }, fadeIn, N('Boom. The first rocket opens like a chrysanthemum over the bay. The crowd goes quiet, then roars.'), say('misa', 'happy', 'Whoa... I can feel it in my chest!'), { t: 'wait', dur: 2 }, N('The finale: a hundred sparks, all at once, and the sea doubles them.'), call((g) => { g.addMood(15); stamp(g, 'fireworks'); g.stat('kcFireworks'); }), fadeOut, { t: 'scene', name: null }, fadeIn, say('misa', 'happy', 'Last train is at ten thirty. I still have time for one more takoyaki.')],
});

// ---------------------------------------------------------------- weather-aware crowds (pedestrians along each map's lanes)
register('worldLayer', 'kc_crowd', {
  sprites(world, game) {
    const m = world.map, def = get('map', m.id), cr = def && def.crowd;
    if (!cr) return [];
    let f = 1;
    if (game.weather === 'rain') f = cr.rainy ?? 0.35; else if (game.weather === 'storm') f = (cr.rainy ?? 0.35) * 0.4; else if (game.weather === 'snow') f = 0.5; else if (game.weather === 'sunny') f = cr.sunny ?? 1.1;
    if (game.isWeekend) f *= 1.3; if (game.minutes >= 21 * 60 || game.minutes < 8 * 60) f *= 0.5; if (game.flag('festival_today')) f *= 1.8;
    const n = Math.round(cr.base * f), out = [], t = game.clock;
    for (let i = 0; i < n; i++) {
      const [ly, x0, x1] = cr.lanes[i % cr.lanes.length], span = (x1 - x0) * 16, sp = 12 + ((i * 7) % 11), dir = i % 2 ? 1 : -1;
      const p = (((t * sp * dir + i * 331) % span) + span) % span, px = x0 * 16 + p, py = ly * 16 + 14 + (i % 3) * 3, fr = Math.floor(t * 4 + i) % 2;
      out.push({ y: py, draw: () => { world.shadow(px, py, 6); world.drawFeet(`kc_ped_${i % 6}_${fr}`, px, py, dir < 0); } });
    }
    return out;
  },
});

// ---------------------------------------------------------------- the Kita phone app + a node on the Map app
const TABS = ['MAP', 'TRAINS', 'SHOPS', 'STAMPS'];
const DIR = [['kita_station_plaza', 'Station Plaza', 'Fountain, info desk, subway and the station gate.'], ['kita_arcade', 'Hikari Arcade', 'Twelve shops under lanterns, bookshop, game centre, ramen street.'], ['kita_harbourwalk', 'Harbour Walk', 'Aquarium, ferris wheel, ferry pier and street food.'], ['kita_oldtown', 'Old Town', 'Temple, teahouses and (they say) a cat alley.'], ['kita_uni', 'University', 'Campus lawns, lecture hall and the city museum.']];
const SHOPDIR = [['kc_stationery', 'Fude Stationery'], ['kc_electronics', 'Denki Corner'], ['kc_import', 'Maison Import'], ['kc_vintage', 'Daigo Old Things'], ['kc_pet', 'Paws and Whiskers'], ['kc_boutique', 'Boutique Mirai'], ['kc_sweets', 'Puff and Pop'], ['kc_bakery', 'Boulangerie Kita'], ['kc_tea', 'Hanaori Tea House'], ['kc_book', 'Bunta Books'], ['kc_popcorn', 'Cinema Snack Bar'], ['kc_ramen_0', 'Gen\'s Ramen']];
register('phoneApp', 'kc_city', {
  name: 'Kita', icon: 'i_map', order: 37, when: (g) => !!g.flag('kc_visited'),
  open(game, app) { app.state.tab ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, { x, y, w } = app.area, k = input.pressed;
    if (k.has('arrowright') || k.has('d')) st.tab = (st.tab + 1) % TABS.length;
    if (k.has('arrowleft') || k.has('a')) st.tab = (st.tab + TABS.length - 1) % TABS.length;
    if (input.justDown) TABS.forEach((t, i) => { if (inside(input.mx, input.my, x + 2 + i * Math.floor((w - 4) / 4), y + 2, Math.floor((w - 4) / 4) - 1, 13)) st.tab = i; });
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, tw = Math.floor((w - 4) / 4);
    panel(g, x, y, w, h, 'paper');
    TABS.forEach((t, i) => { rect(g, i === st.tab ? K.butter[3] : K.paper[2], x + 2 + i * tw, y + 2, tw - 1, 13); drawText(g, t, x + 6 + i * tw, y + 6, UI.ink, 1, null); });
    let yy = y + 22; const line = (txt, c = UI.ink) => { drawText(g, txt, x + 8, yy, c, 1, null); yy += 10; };
    if (st.tab === 0) { for (const [m, n, d] of DIR) { const on = here(game) === m; line(`${on ? '> ' : ''}${n}`, on ? UI.accent2 : UI.ink); wrap(d, 44).slice(0, 2).forEach((l) => line('  ' + l, UI.dim)); } }
    if (st.tab === 1) { line(`Hoshimori to Kita: ${timetableText(game, 'hoshi', 4)}`); line(`Kita to Hoshimori: ${timetableText(game, 'kita', 4)}`); line('Last trains: 10:30 PM both ways.', UI.dim); line(`Single ${FARE}, Train Pass ${PASS_FARE}, Day Pass 400.`); line(`Rides taken: ${S(game).rides}`, UI.dim); line(inCity(game) ? 'You are in Kitaminato.' : 'You are in Hoshimori Bay.', UI.dim); }
    if (st.tab === 2) { for (const [id, n] of SHOPDIR) { const open = game.shopOpen ? game.shopOpen(id) : true; line(`${n}: ${open ? 'open' : 'closed'}`, open ? UI.good : UI.dim); } }
    if (st.tab === 3) {
      line(`Stamps ${stampCount(game)}/${STAMPS.length}`, UI.accent2);
      STAMPS.forEach((s, i) => { const gx = x + 8 + (i % 10) * 27, gy = yy + Math.floor(i / 10) * 20, got = !!S(game).stamps[s.id]; rect(g, got ? K.coral[2] : K.paper[2], gx, gy, 24, 17); if (got) { rect(g, K.butter[3], gx + 8, gy + 4, 8, 8); } drawText(g, String(i + 1), gx + 2, gy + 3, got ? UI.ink : UI.dim, 1, null); });
    }
  },
});
{
  const mapApp = get('phoneApp', 'map');
  if (mapApp) {
    const upd = mapApp.update, drw = mapApp.draw, NX = 146, NY = 16, NW = 38, NH = 18;
    mapApp.update = function (dt, input, game, app) {
      const st = app.state, before = st.sel; upd.call(this, dt, input, game, app);
      if (st.sel !== before) st.kcSel = false;
      if (input.justDown && inside(input.mx, input.my, app.area.x + 4 + NX, app.area.y + 6 + NY, NW, NH)) { st.kcSel = true; game.sfx('blip'); }
    };
    mapApp.draw = function (g, game, app) {
      const st = app.state, { x, y } = app.area, real = st.sel; if (st.kcSel) st.sel = 'town';
      drw.call(this, g, game, app); st.sel = real;
      g.fillStyle = '#b89a6a'; for (let i = 0; i < 12; i++) g.fillRect(Math.round(x + 4 + 119 + (NX + 19 - 119) * i / 12), Math.round(y + 6 + 49 + (NY + 9 - 49) * i / 12), 2, 2);
      rect(g, UI.ink, x + 4 + NX, y + 6 + NY, NW, NH); rect(g, st.kcSel ? UI.gold : inCity(game) ? UI.accent : UI.paper, x + 5 + NX, y + 7 + NY, NW - 2, NH - 2); drawTextC(g, 'Kita', x + 4 + NX + NW / 2, y + 6 + NY + 5, UI.ink, 1, null);
      if (inCity(game) && Math.floor(game.clock * 2) % 2) rect(g, UI.bad, x + 4 + NX + NW - 5, y + 6 + NY - 3, 6, 6);
      if (st.kcSel) { panel(g, x + 192, y, 100, 172, 'paper'); drawText(g, 'Kitaminato', x + 197, y + 5, UI.accent2, 1, null); wrap(`By train from Hoshimori Station: ${timetableText(game, 'hoshi', 2)}. 20 minutes. Stamps ${stampCount(game)}/40.`, 20).forEach((l, i) => drawText(g, l, x + 197, y + 20 + i * 9, UI.ink, 1, null)); }
    };
  }
}

// ---------------------------------------------------------------- orders board, graduation hook, achievement, system
TEMPLATES.push(
  { id: 'kc_cookies', who: 'kc_sora', title: 'A souvenir from the city', text: 'Bring me a tin of Kitaminato cookies from the station kiosk. I will play your favourite song in return.', mk: () => ({ t: 'have', items: { gift_city_station_cookies: 1 } }), days: 8, reward: { coins: 420, friend: 40, stickers: 1 } },
  { id: 'kc_rides', who: 'kc_bunta', title: 'Ride the rails', text: 'I want to hear about the train ride. Take it twice this week and tell me what you saw from the window.', mk: () => ({ t: 'stat', k: 'kcRides', n: 2, label: 'train rides' }), days: 7, reward: { coins: 360, friend: 35 } },
  { id: 'kc_stamps', who: 'kc_umi', title: 'Stamp collector', text: 'Collect five new Kitaminato stamps. I will stamp one more at the aquarium myself.', mk: () => ({ t: 'stat', k: 'kcStamps', n: 5, label: 'city stamps' }), days: 9, reward: { coins: 480, stickers: 2, friend: 40 } },
);
register('achievement', 'kc_city_stamps', { name: 'City Collector', desc: 'Fill every one of the 40 Kitaminato stamps.', cond: 'flag:kc_all_stamps', icon: 'i_star' });
register('achievement', 'kc_city_missions', { name: 'Day Tripper', desc: 'Finish all five Kitaminato Day Missions.', cond: 'flag:kc_quest_done', icon: 'i_star' });
register('system', 'kc_quests', {
  init(game) {
    game.bus.on('svGraduated', () => {
      try { const Y = game.state.sv3y || {}, visits = S(game).visits || 0; if (Y.track === 'university' || visits) game.mail('kc_ibuki_grad', 'Ibuki Tsukino', 'Congratulations on your graduation, Misa! The lawn at Kitaminato University has a spot with your name on it. Come by any time. - Ibuki'); } catch { /* optional */ }
    });
  },
});

features('Kitaminato Quests', [
  'Day Pass quest chain of five missions: lost balloon, arcade parcel, flash mob, helping a vendor and the night lantern festival',
  'Flash mob rhythm minigame on Station Plaza where you follow the arrow cues with the crowd',
  'Parcel delivery across Hikari Arcade with a tip for beating the 35 minute clock',
  'Street-photo scavenger hunt: eight famous shots across five districts, with a toy camera reward',
  'Tourist Info desk on Station Plaza: missions, photo hunt, stamp book and event tips',
  '40-stamp collection tracking every place and activity in Kitaminato, with a bonus charm at 10 and a golden ticket at 40',
  'Kitaminato Lantern Night festival on Autumn 24 with floating lanterns at the pier and a lit Old Town',
  'Kitaminato Summer Fireworks on Summer 22: stalls, a lit ferris wheel and a full fireworks backdrop finale',
  'Weather-aware crowds: the plaza and harbour empty in rain while the covered arcade fills up; weekends and festivals are busier',
  'Kita phone app with a city map, train times, a shop directory with open or closed status and the stamp book',
  'Map app shows a Kita node linked to Hoshimori with the next train times',
  'Special orders from city friends appear on the Hoshimori request board',
  'Graduation hook: a letter from Ibuki arrives if you toured the university or took the university track',
]);
void clockText; void DEP; void nextDep; void giveOr; void CITY_MAPS; void drawTextC;
