// Kitaminato places and things to do: city subway and bus, ferris wheel (sunset set piece), cat colony, temple, open campus, aquarium
// feeding show, cinema (six films with a quiz), museum (rotating exhibits tied to your collections), game centre, capsule hotel.
import { register, registerMany, get, all, features } from '../../core/registry.js';
import { clockText } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sky, stars, moon, rect, disc, sea, skyline } from '../events/backdrops.js';
import { hash } from '../town/lib.js';
import { S, say, N, call, has, here, giveOr, warpStep, stamp, nameOf } from './core.js';
import { dayPass, hasPass, hotelSleep, HOTEL_PRICE } from './trains.js';

const pay = (g, n) => { if (n > 0 && !g.spend(n)) return false; if (n > 0) g.sfx('coin'); return true; };
const fadeOut = { t: 'fade', to: 1, dur: 0.5 }, fadeIn = { t: 'fade', to: 0, dur: 0.5 };
const romance = (g, who) => { try { if (who && get('system', 'sv4_romance') && g.state.sv4r && g.state.sv4r.aff) g.state.sv4r.aff[who] = Math.min(1000, (g.state.sv4r.aff[who] || 0) + 30); g.bus.emit('kcFerris', { who }); } catch { /* optional */ } };
const FRIENDS = ['kai', 'suzu', 'rina', 'theo', 'hina'];
const companion = (g, then) => ({ t: 'choice', prompt: 'Who comes with you?', options: [{ text: 'Just me', steps: then(null) }, ...FRIENDS.map((f) => ({ text: nameOf(f).split(' ')[0], when: `friend:${f}>=3`, steps: then(f) }))] });

// ---------------------------------------------------------------- city subway and bus
const DIST = [['kita_station_plaza', 'Station Plaza'], ['kita_arcade', 'Hikari Arcade'], ['kita_harbourwalk', 'Harbour Walk'], ['kita_oldtown', 'Old Town'], ['kita_uni', 'University']];
const fareOf = (g, mode) => (dayPass(g) || (mode === 'subway' && hasPass(g)) ? 0 : mode === 'subway' ? 40 : 30);
const goDistrict = (mode, map, name) => [call((g) => pay(g, fareOf(g, mode))), fadeOut, call((g) => { g.advance(mode === 'subway' ? 6 : 14); g.stat('kcTransit'); if (mode === 'subway') stamp(g, 'subway'); }),
  ...(mode === 'bus' ? [N('The little city bus rattles past shops, a school and a canal. Everyone on board is very polite.')] : []), warpStep(map, 'from_subway'), fadeIn, N(`${name}.`)];
register('interaction', 'kc_subway', {
  label: 'City subway and bus',
  run: (g) => {
    const me = here(g);
    if (g.minutes < 5 * 60 + 30 || g.minutes >= 24 * 60) return g.say(null, null, 'The subway has stopped for the night. Buses and trains start again at 5:30 AM.');
    g.run([{ t: 'choice', prompt: 'City transit: subway 40, bus 30 (free with a Day Pass)', options: [
      ...DIST.filter((d) => d[0] !== me).map(([map, name]) => ({ text: name, steps: [{ t: 'choice', prompt: `To ${name}?`, options: [
        { text: `Subway (${fareOf(g, 'subway')}, 6 min)`, when: `money>=${fareOf(g, 'subway')}`, steps: goDistrict('subway', map, name) },
        { text: `City bus (${fareOf(g, 'bus')}, 14 min)`, when: `money>=${fareOf(g, 'bus')}`, steps: goDistrict('bus', map, name) }, { text: 'Cancel', steps: [] }] }] })),
      { text: 'Cancel', steps: [] }] }]);
  },
});

// ---------------------------------------------------------------- backdrops: ferris wheel sunset, fireworks, floating lanterns
const water = (gc, t, y0, cols) => sea(gc, y0, cols, t);
register('backdrop', 'kc_ferris_view', {
  draw(gc, game, t) {
    sky(gc, ['#3a2e6a', '#a85a8a', '#f08a6a', '#ffc080', '#ffe0a0'], 0, 140); disc(gc, 230, 118 + Math.min(18, t * 1.5), 22, '#fff0b0');
    water(gc, t, 140, K.sky);
    skyline(gc, 140, '#3a2e5a', 4); for (let i = 0; i < 30; i++) rect(gc, (i % 3) ? '#ffd76a' : '#ff9a6a', (i * 37) % 320, 118 + (i * 11) % 18, 2, 2);
    const a = t * 0.2; gc.save(); rect(gc, '#262436', 0, 190, 320, 34);
    for (let i = 0; i < 8; i++) { const q = a + i * Math.PI / 4, x = 160 + Math.cos(q) * 70, y = 210 + Math.sin(q) * 60 - 30; rect(gc, [K.coral, K.sky, K.butter, K.mint][i % 4][2], x - 7, y, 14, 10); }
    gc.restore(); rect(gc, '#262436', 0, 0, 320, 0);
  },
});
function burst(gc, cx, cy, p, col) { for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = p * 34; gc.fillStyle = col; gc.globalAlpha = Math.max(0, 1 - p); gc.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r + p * p * 14), 2, 2); } gc.globalAlpha = 1; }
register('backdrop', 'kc_fireworks', {
  draw(gc, game, t) {
    sky(gc, ['#0e1030', '#171233', '#241a4a', '#32265c'], 0, 150); stars(gc, t, 50, 90, 7);
    water(gc, t, 150, K.navy); skyline(gc, 150, '#1a1a38', 6);
    for (let k = 0; k < 5; k++) { const ph = ((t * 0.7 + k * 0.37) % 1.6) / 1.6, cx = 40 + hash(k, Math.floor(t * 0.7 / 1.6 + k), 1) * 240, cy = 30 + hash(k, 2, Math.floor(t * 0.7 / 1.6 + k)) * 60; if (ph < 0.9) burst(gc, cx, cy, ph / 0.9, ['#ffd76a', '#ff7a80', '#86cdb0', '#b89ae0', '#7fb2e0'][k]); }
    gc.globalAlpha = 0.3; rect(gc, '#ffd76a', 0, 150, 320, 3); gc.globalAlpha = 1;
  },
});
register('backdrop', 'kc_lanterns', {
  draw(gc, game, t) {
    sky(gc, ['#14102c', '#241a4a', '#3a2a5a', '#5a3a6a'], 0, 140); stars(gc, t, 40, 80, 3); water(gc, t, 140, K.navy);
    for (let i = 0; i < 26; i++) { const x = (hash(i, 5, 1) * 320), y = 200 - ((t * (6 + (i % 5) * 2) + hash(i, 5, 2) * 200) % 190); rect(gc, '#e0503a', x - 4, y, 8, 9); rect(gc, '#ffd76a', x - 3, y + 1, 6, 6); gc.globalAlpha = 0.25; rect(gc, '#ffd76a', x - 6, y - 2, 12, 13); gc.globalAlpha = 1; }
    skyline(gc, 150, '#1a1a38', 3);
  },
});

// ---------------------------------------------------------------- ferris wheel
register('interaction', 'kc_ferris', {
  label: 'Ferris wheel',
  run: (g) => {
    if (g.minutes < 10 * 60 || g.minutes >= 21 * 60 + 30) return g.say(null, null, 'The wheel is closed. It opens at 10 AM and shuts at 9:30 PM. Its lights glow until then.');
    const sunset = g.minutes >= 16 * 60 + 30 && g.minutes < 19 * 60 + 30;
    g.run([{ t: 'choice', prompt: `Ride the ferris wheel? 200 coins${sunset ? ' (sunset ride!)' : ''}`, options: [
      { text: 'Ride', when: 'money>=200', steps: [companion(g, (who) => [call((gm) => pay(gm, 200)), ...ferrisScene(g, who, sunset)])] }, { text: 'Not now', steps: [] }] }]);
  },
});
function ferrisScene(g, who, sunset) {
  const w = who ? nameOf(who).split(' ')[0] : null;
  return [fadeOut, { t: 'scene', name: sunset ? 'kc_ferris_view' : 'kc_ferris_view' }, fadeIn, { t: 'sfx', name: 'chime' },
    N(w ? `The cabin creaks upward. ${w} presses a hand to the glass.` : 'The cabin creaks upward. The plaza shrinks into toys.'),
    ...(sunset ? [N('At the top, the sun melts into the bay. The whole sky is peach, pink and gold, and the city starts to glow below.'), say('misa', 'happy', 'It is like being inside a lantern.')] : [N('From the top you can see the harbour, the arcade roof, and the thin silver line of the railway running home.')]),
    ...(w ? [say(who, 'happy', sunset ? 'I will remember this view. Thank you for bringing me.' : 'This is the best view in Kitaminato. I think.'), { t: 'friend', npc: who, n: sunset ? 40 : 20 }] : []),
    call((gm) => { gm.advance(16); gm.addMood(sunset ? 12 : 6); gm.stat('kcFerris'); stamp(gm, 'ferris'); if (who && sunset) romance(gm, who); }),
    fadeOut, { t: 'scene', name: null }, fadeIn, say('misa', 'happy', 'My legs are wobbly, but my heart is full.')];
}

// ---------------------------------------------------------------- Old Town: cat colony and temple
register('interaction', 'kc_cat', {
  label: 'Pet the cat',
  run: (g, o) => {
    const q = S(g), key = `${o.x},${o.y}`, seen = (q.catDay ||= {});
    if (seen[key] === g.day) return g.say('misa', 'happy', 'This cat has had enough fuss for today. It blinks slowly at me, which is the highest compliment.');
    const treats = g.has('city_pet_treats');
    g.run([{ t: 'choice', prompt: 'A neighbourhood cat watches you.', options: [
      { text: 'Pet gently', steps: [call((gm) => { seen[key] = gm.day; gm.addMood(3); gm.sfx('meow'); q.cats = Object.values(seen).filter((d) => d === gm.day).length; q.catTotal = (q.catTotal || 0) + 1; if (q.catTotal >= 3) stamp(gm, 'cats'); }), say('misa', 'happy', 'Purrrr. The whole alley hums.')] },
      { text: 'Share fish treats', when: treats ? '' : 'flag:never', steps: [call((gm) => { gm.take('city_pet_treats', 1); seen[key] = gm.day; gm.addMood(7); gm.sfx('meow'); q.catTotal = (q.catTotal || 0) + 1; stamp(gm, 'cats'); }), say('misa', 'happy', 'The cat tucks into the treat, then climbs into my lap like it owns me. Which it does.')] },
      { text: 'Leave', steps: [] }] }]);
  },
});
register('interaction', 'kc_temple', {
  label: 'Pray at the temple',
  run: (g) => {
    if (g.flag('kc_prayDay') === g.day) return g.say('misa', 'happy', 'The incense still curls around me. I already made my wish today.');
    g.run([{ t: 'choice', prompt: 'Offer a 5 coin prayer?', options: [{ text: 'Offer a prayer', when: 'money>=5', steps: [call((gm) => { pay(gm, 5); gm.setFlag('kc_prayDay', gm.day); gm.setFlag('lucky_today', true); gm.addMood(5); gm.sfx('bell'); stamp(gm, 'temple'); }),
      N('Clap, clap, bow. The temple bell hums low and long.'), say('misa', 'happy', ['Please let my friends be well.', 'Please let the next train be on time.', 'Please let my cat catch a friend. Not a bird. A friend.'][g.day % 3])] }, { text: 'Just look', steps: [N('Moss on the roof, old stone steps, and a smell of cedar. Time moves slower here.')] }] }]);
  },
});

// ---------------------------------------------------------------- University open campus
register('interaction', 'kc_openday', {
  label: 'Open campus: Main Hall',
  run: (g) => {
    const st = S(g), Y = g.state.sv3y || {}, track = Y.track, today = st.openDay[g.day];
    if (g.isWeekend && false) return null;
    if (g.minutes < 9 * 60 || g.minutes >= 17 * 60) return g.say(null, null, 'The Main Hall is open for visitors 9 AM to 5 PM.');
    g.run([{ t: 'choice', prompt: 'Kitaminato University: open campus visit', options: [
      { text: 'Join the campus tour (free)', when: today ? 'flag:never' : '', steps: [fadeOut, call((gm) => { gm.advance(75); st.openDay[gm.day] = true; st.visits = (st.visits || 0) + 1; gm.addXP && gm.addXP('study', 8); gm.addMood(4); gm.stat('kcOpenDays'); stamp(gm, 'openday'); }), fadeIn,
        N('The tour winds past lecture halls, a rooftop observatory and a cafeteria that serves forty kinds of curry.'), say('ibuki', 'happy', track === 'university' ? 'You are on the university track? Then listen: the entrance exam loves clear thinking, not fast scribbling.' : track ? 'Whatever your path, the campus is a good place to wander. Many people change their minds here.' : 'No pressure. Just see what it feels like to be a student.'),
        call((gm) => { if ((st.visits || 0) >= 3 && has('cloth_city_blazer') && !gm.flag('kc_blazer')) { gm.setFlag('kc_blazer'); gm.give('cloth_city_blazer', 1); } })] },
      { text: 'Ask about the entrance exam', steps: [say('ibuki', 'neutral', track === 'university' ? 'Study in blocks of forty minutes and sleep properly. You will do fine. I did the same, and I only cried twice.' : 'The exam is five papers in spring. A lot of work, but a lot of time to prepare.')] },
      { text: 'Leave', steps: [] }] }]);
  },
});
register('interaction', 'kc_lecture', {
  label: 'Sit in on a lecture',
  run: (g) => {
    if (g.minutes < 10 * 60 || g.minutes >= 16 * 60) return g.say(null, null, 'Lectures run 10 AM to 4 PM. The hall is quiet now.');
    if (g.flag('kc_lectureDay') === g.day) return g.say('misa', 'happy', 'I already sat in on a lecture today. My brain is full.');
    if (g.energy < 12) return g.say('misa', 'sleepy', 'I am too tired to follow a lecture right now.');
    g.run([fadeOut, call((gm) => { gm.advance(100); gm.useEnergy(12); gm.setFlag('kc_lectureDay', gm.day); gm.addXP && gm.addXP('study', 14); gm.stat('kcLectures'); }), fadeIn, N('The professor draws a tree on the board. "Everything grows from a good question." You write that down twice.'), say('misa', 'happy', 'I understood maybe sixty percent. That is a lot!')]);
  },
});

// ---------------------------------------------------------------- aquarium
register('interaction', 'kc_aq_ticket', {
  label: 'Aquarium tickets',
  run: (g) => {
    const q = S(g);
    if (g.minutes < 9 * 60 || g.minutes >= 18 * 60) return g.say('umi', 'neutral', 'We are open 9 AM to 6 PM. Come back then.');
    if (q.aqDay === g.day) return g.say(null, null, 'You already have a ticket for today. The tunnel is open.');
    g.run([{ t: 'choice', prompt: 'Aquarium entry: 300 coins', options: [{ text: 'Buy a ticket', when: 'money>=300', steps: [call((gm) => { pay(gm, 300); q.aqDay = gm.day; gm.sfx('buy'); }), N('The gate to the tunnel swings open. Blue light spills over the floor.')] }, { text: 'Not now', steps: [] }] }]);
  },
});
register('interaction', 'kc_feed_show', {
  label: 'Feeding show',
  run: (g) => {
    const q = S(g);
    if (q.aqDay !== g.day) return g.say(null, null, 'The show area is for ticket holders.');
    if (q.showDay === g.day) return g.say('umi', 'happy', 'Thank you for the help today! The fish are stuffed. We will do another one tomorrow.');
    g.run([say('umi', 'happy', 'Want to help with the feeding show? Drop pellets for the little fish. Do not let the big ones steal!'), { t: 'choice', prompt: 'Join the show?', options: [{ text: 'Yes!', steps: [{ t: 'minigame', id: 'kc_feed', opts: {}, done: (gm, r) => finishShow(gm, r) }] }, { text: 'Watch only', steps: [N('The crowd gasps as a ray glides right past the glass.')] }] }]);
  },
});
function finishShow(g, r) {
  if (r.quit) return;
  const q = S(g); q.showDay = g.day; g.advance(40); g.stat('kcShows'); stamp(g, 'show');
  const coins = 80 + (r.stars || 1) * 70; g.addMoney(coins, true); g.addFriend('umi', 10 + (r.stars || 1) * 8);
  if (r.stars >= 3 && has('gift_city_aquarium_plush') && !g.flag('kc_plush')) { g.setFlag('kc_plush'); g.give('gift_city_aquarium_plush', 1); }
  g.run([say('umi', 'happy', r.stars >= 3 ? 'Perfect show! The kids screamed! Take this, you earned it.' : r.stars === 2 ? 'Very good! The fish are happy.' : 'Not bad! Practice makes pellets.'), N(`The aquarium pays you ${coins} coins as a helper.`)]);
}

// ---------------------------------------------------------------- cinema: six films, one screen of summary, one quiz question
export const FILMS = [
  { id: 'harbour_lights', title: 'Harbour Lights', genre: 'Romance', sum: 'A lighthouse keeper writes letters to a sailor she has never met. On the last night of the storm, a lantern in the window brings him home.', q: 'What did the keeper hang in the window?', a: ['A lantern', 'A flag', 'A bell'], ok: 0 },
  { id: 'cat_detective', title: 'The Cat Detective', genre: 'Comedy', sum: 'A stray cat solves three tiny crimes: the stolen sardine, the vanished sock and the mystery of the 3 AM meow. The butler did not do it. The butler is a hamster.', q: 'Who is the butler?', a: ['A hamster', 'A cat', 'A crow'], ok: 0 },
  { id: 'star_voyage', title: 'Star Voyage 9', genre: 'Sci-fi', sum: 'A ship full of teenagers crosses the galaxy to return one singing star to its sky. Along the way they learn that the engine only runs on teamwork and snacks.', q: 'What powers the engine?', a: ['Teamwork and snacks', 'Gold', 'A giant battery'], ok: 0 },
  { id: 'summer_kites', title: 'Summer of Kites', genre: 'Family', sum: 'Two cousins build a giant kite out of old umbrellas and fly it above the village on the hottest day of the year. It carries their wish to the clouds.', q: 'What is the kite made from?', a: ['Old umbrellas', 'Paper bags', 'Bedsheets'], ok: 0 },
  { id: 'night_train', title: 'The Last Night Train', genre: 'Thriller', sum: 'A commuter dozes off and wakes on a train with no stops. Each car shows a different night in her life. At the final door she meets herself, and tells her to get off at the next station.', q: 'Where does she meet herself?', a: ['At the final door', 'On the roof', 'In the dining car'], ok: 0 },
  { id: 'mochi_dreams', title: 'Mochi Dreams', genre: 'Cosy', sum: 'A sleepy white cat dreams of a town made of rice cake, where clouds are whipped cream and rain is green tea. When she wakes, a girl is feeding her breakfast.', q: 'What is the rain made of in her dream?', a: ['Green tea', 'Milk', 'Honey'], ok: 0 },
];
const watch = (g, f, who) => {
  const q = S(g), quiz = { t: 'choice', prompt: `Quiz: ${f.q}`, options: f.a.map((txt, i) => ({ text: txt, steps: [call((gm) => { if (i === f.ok) { gm.addMoney(150, true); gm.toast('Correct! +150 coins and a perfect-quiz stamp', 'i_star'); stamp(gm, 'quiz'); q.quizBest = Math.max(q.quizBest, 1); } else gm.toast('Not quite. The usher grins.', null); })] })) };
  return [fadeOut, { t: 'sfx', name: 'page' }, call((gm) => { gm.advance(125); gm.addMood(8); q.films[f.id] = gm.day; gm.stat('kcFilms'); stamp(gm, 'film'); if (who) { gm.addFriend(who, 40); romance(gm, who); } }), fadeIn,
    N(`${f.title} (${f.genre}): ${f.sum}`), ...(who ? [say(who, 'happy', 'That was really good. Thanks for inviting me.')] : []), say('mio', 'happy', 'Quick quiz for the sharp-eyed viewers!'), quiz];
};
register('interaction', 'kc_cinema_desk', {
  label: 'Buy a cinema ticket',
  run: (g) => {
    const golden = g.has('gift_city_golden_ticket'), price = golden ? 0 : 700;
    g.run([{ t: 'choice', prompt: `Star Cinema: ${golden ? 'golden ticket (free)' : '700 coins'}. Pick a film`, options: [...FILMS.map((f) => ({ text: `${f.title} (${f.genre})`, steps: [companion(g, (who) => [call((gm) => { if (golden) gm.take('gift_city_golden_ticket', 1); else pay(gm, price); }), ...watch(g, f, who)])], when: price ? `money>=${price}` : '' })), { text: 'Maybe later', steps: [] }] }]);
  },
});
FILMS.forEach((f, i) => register('interaction', 'kc_poster_' + i, { label: `Poster: ${f.title}`, run: (g) => g.run([N(`${f.title} (${f.genre}). ${f.sum.split('.')[0]}.`), N(S(g).films[f.id] ? 'You have seen this one. A stamp for your memory.' : 'Not seen yet.')]) }));
register('interaction', 'kc_seat', { label: 'Sit', run: (g) => g.say('misa', 'happy', 'The velvet seats are impossibly comfy. The screen is dark, but I can almost smell the popcorn.') });

// ---------------------------------------------------------------- museum: rotating exhibits tied to your collections
const EXH = [
  { name: 'Deep Time Minerals', kind: 'mineral', text: 'Crystals and ores, each with a handwritten tag.' }, { name: 'Treasures of the Tide', kind: 'shell', text: 'Shells polished by a hundred years of waves.' },
  { name: 'Wings and Legs', kind: 'bug', text: 'Pinned beetles, butterflies and one very proud stag beetle.' }, { name: 'Fish of the Bay', kind: 'fish', text: 'A wall of bay fish, from silver sardine to grumpy flounder.' },
];
const kinds = (g, kind) => Object.keys((g.state.collections && g.state.collections[kind]) || {}).length;
EXH.forEach((e, i) => register('interaction', 'kc_exhibit_' + i, {
  label: (g) => `Exhibit: ${e.name}${Math.floor((g.day - 1) / 7) % 4 === i ? ' (featured)' : ''}`,
  run: (g) => {
    const week = Math.floor((g.day - 1) / 7), featured = week % 4 === i, n = kinds(g, e.kind), q = S(g);
    const steps = [N(`${e.name}. ${e.text}`), N(n ? `Your own collection records ${n} kinds in this category.` : 'Your own collection has nothing here yet. Time to go exploring!')];
    if (featured && q.exhibits[i] !== week) steps.push(call((gm) => { q.exhibits[i] = week; const coins = Math.min(400, 60 + n * 18); gm.addMoney(coins, true); gm.addXP && gm.addXP('study', 6); gm.stat('kcExhibits'); stamp(gm, 'exhibit'); gm.toast(`Featured exhibit: +${coins} coins (curator thanks)`, 'i_star'); }), say('misa', 'happy', 'The curator\'s note says collectors get a small thank-you. A stamp and some coins!'));
    g.run(steps);
  },
}));
register('interaction', 'kc_museum_desk', { label: 'Museum desk', run: (g) => { const w = Math.floor((g.day - 1) / 7) % 4; g.run([N(`This week's featured exhibit: ${EXH[w].name}. Bring a collection and the curator rewards you.`), N('Rotation: Minerals, Shells, Bugs, Fish. A new feature every Monday.')]); } });

// ---------------------------------------------------------------- game centre
register('interaction', 'kc_claw_play', {
  label: 'Claw machine (100 coins)',
  run: (g) => g.run([{ t: 'choice', prompt: 'Try the claw machine? 100 coins, 5 tries', options: [{ text: 'Play', when: 'money>=100', steps: [call((gm) => pay(gm, 100)), { t: 'minigame', id: 'kc_claw', opts: {}, done: (gm, r) => clawPrize(gm, r) }] }, { text: 'Not now', steps: [] }] }]),
});
function clawPrize(g, r) {
  if (r.quit) return;
  const figs = all('item').filter((i) => i.id.startsWith('toy_fig_') && i.id !== 'toy_fig_gold_mochi').map((i) => i.id), won = Math.round((r.score || 0) * 3);
  g.stat('kcClaws'); g.advance(20);
  if (!won) return g.say('misa', 'sad', 'So close! The claw slipped right at the top.');
  for (let i = 0; i < won; i++) { const id = figs.length ? figs[Math.floor(g.rng() * figs.length)] : 'city_stamp_charm'; g.give(id, 1, true); if (get('item', id) && id.startsWith('toy_fig_')) g.collect('figurine', id); }
  stamp(g, 'claw'); g.run([N(`Clunk! ${won} prize${won > 1 ? 's' : ''} drop into the chute.`), say('misa', 'happy', 'Take that, claw!')]);
}
register('interaction', 'kc_puri', { label: 'Photo sticker booth (300)', run: (g) => g.run([{ t: 'choice', prompt: 'Sticker photos, 300 coins?', options: [{ text: 'Strike a pose', when: 'money>=300', steps: [call((gm) => { pay(gm, 300); gm.advance(15); gm.addMood(10); gm.stat('kcPuri'); gm.sfx('camera'); }), N('Flash! Sparkles, cat ears and tiny hearts appear around your face. The sticker sheet slides out, still warm.'), say('misa', 'happy', 'I look ridiculous and I love it.')] }, { text: 'Not now', steps: [] }] }]) });
register('interaction', 'kc_cab', { label: 'Arcade cabinet', run: (g) => g.say('misa', 'happy', 'Neko Jump, Sakana Run, Bubble Panic. All of them cost one coin and all of them steal an afternoon.') });
register('interaction', 'kc_gc_counter', { label: 'Prize counter', run: (g) => g.say('ryo', 'happy', 'Prize counter! Claw winners get a figurine. The golden Mochi one is only from the capsule machine in Hoshimori.') });

// ---------------------------------------------------------------- capsule hotel
register('interaction', 'kc_hotel_desk', {
  label: 'Capsule hotel desk',
  run: (g) => g.run([say('kuma', 'neutral', 'Welcome to Tsuki. How can I help?'), { t: 'choice', prompt: 'Capsule Hotel Tsuki', options: [
    { text: 'Nap in a capsule (200, 2 hours)', when: 'money>=200', steps: [call((gm) => { pay(gm, 200); }), fadeOut, call((gm) => { gm.advance(120); gm.addEnergy(35); gm.addMood(4); }), fadeIn, say('misa', 'sleepy', 'A dark, tiny, perfect nap. I feel brand new.')] },
    { text: `Stay the night (${HOTEL_PRICE})`, when: `money>=${HOTEL_PRICE}`, steps: [call((gm) => hotelSleep(gm))] },
    { text: 'Ask about trains', steps: [say('kuma', 'neutral', 'Last train to Hoshimori leaves at half past ten. First one is half past six. A pod is always cheaper than a taxi.')] }, { text: 'No thanks', steps: [] }] }]),
});
register('interaction', 'kc_hotel_bath', { label: 'Hotel bath', run: (g) => { if (g.flag('kc_bathDay') === g.day) return g.say('misa', 'happy', 'One bath a day is a good rule. Two is a luxury.'); g.setFlag('kc_bathDay', g.day); g.advance(30); g.addEnergy(12); g.addMood(8); g.sfx('splash'); g.say('misa', 'sleepy', 'Warm water, soft light, a view of the city skyline on the wall. Heaven.'); } });

features('Kitaminato Places', [
  'City subway and bus connecting the five districts, free with a Day Pass, with a 40-coin subway and a slower 30-coin bus',
  'Ferris wheel at the harbour: day rides, plus a sunset ride set piece you can share with a friend',
  'Optional romance hook on the sunset ferris wheel when the romance pack is installed',
  'Hidden alley cat colony in Old Town: pet the cats, share fish treats and earn the cat stamp',
  'Temple prayer in Old Town with a daily lucky day flag and incense-scented dialogue',
  'University open campus: free tours tied to your career track, a sit-in lecture for study XP and a campus blazer after three visits',
  'Aquarium with a walkable tunnel of animated tanks, a ticket desk and a daily feeding show helper minigame',
  'Star Cinema: six films, each with a one-screen summary, a quiz for coins and a golden-ticket path',
  'Invite a friend to the cinema or ferris wheel for a friendship and date bonus',
  'City Museum with four rotating exhibits tied to your mineral, shell, bug and fish collections and a weekly featured bonus',
  'Game centre with claw machines that pay out collectible figurines, a sticker photo booth and arcade cabinets',
  'Capsule hotel for naps, baths, overnight stays and a wake-up in your pod',
]);
void registerMany; void clockText; void K;
