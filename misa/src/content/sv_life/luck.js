// Daily luck (0..100, shown in Calendar, Stats and the Fortune app), a morning TV horoscope, the shrine fortune and Kiko's luck reading.
// Inputs: a seeded daily roll, weather, flag lucky_today (town fountain), coast luckyDay (shrine fortune), the horoscope and Kiko's reading.
// Effects: lucky days give bonus fish and harvests, extra warmth when you give gifts and now and then a windfall of coins.
import { register, get, features } from '../../core/registry.js';
import { spotPos } from '../../systems/festivals.js';
import { UI, rect, panel, drawText, drawTextC, wrap } from '../../ui/ui.js';
import { TV_CHANNELS } from '../ui/tv.js';
import { S, say, N, call, pick, luckValue, luckTier, luckBase, addLuck, LUCK_TIERS, nameOf } from './state.js';

const TCOL = ['#7a6a90', '#9aa6c8', '#b8c8a0', '#ffd76a', '#ff9ac0'];
const tierIdx = (v) => LUCK_TIERS.findIndex(([m]) => v < m);
const SIGNS = ['Moon Cat', 'Paper Crane', 'Tide Fox', 'Lantern', 'Sakura', 'Firefly', 'Daruma', 'Teapot', 'Kite', 'Snow Owl', 'Mochi', 'Star Whale'];
export const signOf = () => SIGNS[3]; // Misa's birthday is Summer 3: the Lantern
const COLORS = ['coral', 'sky blue', 'mint', 'butter yellow', 'lilac', 'plain white', 'forest green', 'rose'];
const PLACES = [['park', 'the park'], ['harbour', 'the harbour'], ['beach', 'the beach'], ['shrine', 'the shrine'], ['town', 'the town square'], ['school_grounds', 'the school grounds'], ['library', 'the library']];
const HORO = [
  ['Today the stars are sulking. Move slowly, hold your umbrella tight and do not trust vending machines.', 'The Lantern should stay home with tea. The universe has Opinions today.', 'Mercury is in a mood. Keep your plans small and your snacks large.'],
  ['A bumpy day, but a soft one. Small wins are hiding in unlikely pockets.', 'The Lantern may fumble a bit. Laugh about it and the stars will relent.', 'Not your sparkliest day. Ask a friend for company.'],
  ['A calm, ordinary sky. What you plant today will grow just as expected, and that is its own kind of magic.', 'The Lantern glows steadily. Nothing grand, nothing awful. Perfect for chores and cake.', 'Balanced stars. Do what you love and the day will reward you gently.'],
  ['Good fortune drifts in on the wind! Fish may bite, friends may smile a little wider.', 'The Lantern shines! Try something you have been putting off.', 'A bright sky. Share a snack, and the favour comes back doubled.'],
  ['A golden day! The stars line up like sleeping ducks. Fish, farm, flirt with fate!', 'The Lantern blazes. Everything you touch today wants to go well for you.', 'Rare alignment! Luck is practically falling from the roof. Hold out your hands.'],
];
const LUCK_TIP = ['Be careful and gentle today.', 'Take it easy, small tasks first.', 'A fair day, as usual.', 'Fish, farm and give gifts today!', 'Everything is going your way!'];

export function horoscope(g) {
  const r = g.rngFor('svhoro'), v = luckValue(g), ti = tierIdx(v), pl = pick(r, PLACES.filter((p) => p[0] !== 'x'));
  return { tier: ti, text: pick(r, HORO[ti]), color: pick(r, COLORS), number: 1 + Math.floor(r() * 9), place: pl };
}
export function readHoroscope(g) {
  const s = S(g).luck; luckBase(g);
  if (s.read) return false; s.read = 1; addLuck(g, 5); g.stat('horoscopes'); return true;
}
// Lucky place: first visit each day while the sign says so gives a little extra luck.
function roll(g, tag, p) { const s = S(g).luck; s.rolls = (s.rolls || 0) + 1; return g.rngFor(tag + s.rolls)() < p; }

register('system', 'svl_luck', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = S(game), v = luckValue(game); (s.luckHist ||= []).push(v); if (s.luckHist.length > 14) s.luckHist.shift();
      if (v >= 82) game.toast('You feel extra lucky today!', 'i_star'); else if (v < 15) game.toast('Today feels a bit unlucky. Be gentle with yourself.', 'i_cloud');
    });
    game.bus.on('fishCaught', (e) => { const v = luckValue(game); if (e && e.item && v >= 70 && roll(game, 'svlfish', 0.12 + (v - 70) / 160)) { game.give(e.item, 1); game.stat('luckyBites'); game.toast('Lucky bite! A second fish jumps in the bucket.', 'i_star'); } });
    game.bus.on('harvested', (e) => { const v = luckValue(game); if (e && e.item && v >= 65 && roll(game, 'svlharv', 0.15)) { game.give(e.item, 1); game.stat('luckyHarvests'); game.toast('Lucky harvest! One extra crop.', 'i_star'); } });
    game.bus.on('gift', (e) => { const v = luckValue(game); if (e && e.npc && v >= 62 && e.reaction !== 'hate' && e.reaction !== 'dislike') { game.addFriend(e.npc, v >= 82 ? 10 : 5); game.stat('luckyGifts'); } });
    const windfall = () => { const v = luckValue(game); if (v >= 70 && roll(game, 'svlwind', 0.22)) { const n = 20 + Math.floor(v / 4); game.addMoney(n); game.stat('luckyFinds'); game.toast(`Lucky find! ${n} coins on the ground.`, 'coin'); } };
    for (const ev of ['bugCaught', 'shellFound', 'mineralFound']) game.bus.on(ev, windfall);
    game.bus.on('fortuneDrawn', (e) => { const t = (e && e.tier) || ''; addLuck(game, t === 'great' ? 22 : t === 'good' ? 12 : t === 'future' ? 6 : 3); game.toast(`Luck today: ${luckTier(luckValue(game))}`, 'i_star'); });
    game.bus.on('mapEnter', () => {
      const w = game.world; if (!w) return; const h = horoscope(game), s = S(game).luck;
      if (s.read && s.placeDay !== game.day && w.map.id === h.place[0]) { s.placeDay = game.day; addLuck(game, 8); game.toast(`Lucky place from your horoscope! Luck +8`, 'i_star'); }
    });
  },
});

// ---------------------------------------------------------------- shrine: Kiko's luck reading
register('targetProvider', 'svl_kiko_reading', {
  find(world, game) {
    if (world.map.id !== 'shrine') return null;
    const p = spotPos('shrine', 'office'); if (!p) return null; const d = Math.hypot(p.x - world.player.x, p.y - world.player.y);
    if (d > 28) return null;
    return { label: 'Ask Kiko for a luck reading', dist: d + 3, x: p.x, y: p.y - 20, run: (g) => kikoReading(g) };
  },
});
function kikoReading(g) {
  const s = S(g).luck; luckBase(g);
  if (s.kiko === g.day) return g.run([say('kiko', 'neutral', 'The leaves have not changed their minds since this morning. Come back tomorrow.')]);
  const h = horoscope(g), ti = tierIdx(luckValue(g));
  return g.run([N('Kiko tosses three coins and studies how they land. A bell chimes somewhere above the roof.'),
    say('kiko', ti >= 3 ? 'happy' : 'neutral', ti >= 3 ? 'Good. The coins are smiling. Your day is bright, Misa.' : ti === 2 ? 'Calm water. Neither the sea nor the sky has a complaint.' : 'The coins look nervous. Walk softly, and a cup of tea will help.'),
    say('kiko', 'neutral', `${LUCK_TIP[ti]} Your lucky colour is ${h.color}. Your lucky number is ${h.number}.`),
    call((gg) => { s.kiko = gg.day; addLuck(gg, 3); gg.stat('luckReadings'); readHoroscope(gg); gg.addMood(2); })]);
}

// ---------------------------------------------------------------- TV: morning horoscope
TV_CHANNELS.push({ id: 'svl_horoscope', name: 'Starry Morning', blurb: 'Your horoscope with Madame Pom. Mornings only.', when: (g) => g.minutes >= 5.9 * 60 && g.minutes < 12 * 60,
  draw(g, t, x, y, w, h, game) {
    rect(g, '#2a2050', x, y, w, h); for (let i = 0; i < 22; i++) { const tw = Math.floor(t * 3 + i) % 4; if (tw) rect(g, '#fff6c0', x + (i * 37) % w, y + (i * 23) % (h - 30), 1 + (i % 2), 1 + (i % 2)); }
    const v = luckValue(game), ti = tierIdx(v), cx = x + w / 2;
    drawTextC(g, 'HOROSCOPE', cx, y + 8, '#ffd76a', 1, null); drawTextC(g, `THE ${signOf().toUpperCase()}`, cx, y + 20, '#ffffff', 1, null);
    for (let i = 0; i < 5; i++) { rect(g, i <= ti ? TCOL[i] : '#4a3f70', x + 40 + i * 26, y + 44 + (i <= ti ? Math.round(Math.sin(t * 4 + i)) : 0), 20, 20); }
    drawTextC(g, 'TODAY: ' + luckTier(v).toUpperCase(), cx, y + 76, TCOL[ti], 1, null);
  },
  watch(game) {
    const h = horoscope(game), first = readHoroscope(game); game.addMood(1);
    return `Madame Pom says: ${h.text} Lucky colour: ${h.color}. Lucky number: ${h.number}. ${first ? '(Luck +5)' : ''}`;
  } });

// ---------------------------------------------------------------- phone app + Calendar/Stats chips
const bar = (g, x, y, w, v) => { rect(g, UI.ink, x, y, w, 9); const seg = w / 5; for (let i = 0; i < 5; i++) rect(g, TCOL[i], x + 1 + i * seg, y + 1, seg - 1, 7); const mx = x + Math.round((w - 2) * v / 100); rect(g, UI.ink, mx - 1, y - 3, 3, 15); rect(g, '#ffffff', mx, y - 2, 1, 13); };
register('phoneApp', 'sv_luck', {
  name: 'Fortune', icon: 'i_star', order: 36,
  draw(g, game, app) {
    const { x, y, w, h } = app.area, v = luckValue(game), ti = tierIdx(v), s = S(game), hr = horoscope(game);
    panel(g, x, y, w, 60, 'paper');
    drawText(g, 'TODAY\'S LUCK', x + 8, y + 7, UI.dim, 1, null); drawText(g, luckTier(v).toUpperCase(), x + 8, y + 18, TCOL[ti] === '#ffd76a' ? UI.accent2 : UI.accent2, 2, null);
    drawText(g, `${v}/100`, x + w - 50, y + 10, UI.ink, 1, null);
    bar(g, x + 8, y + 40, w - 16, v);
    panel(g, x, y + 64, 170, h - 64, 'paper');
    drawText(g, `HOROSCOPE: THE ${signOf().toUpperCase()}`, x + 6, y + 70, UI.accent2, 1, null);
    if (s.luck.read) { wrap(hr.text, 40).slice(0, 5).forEach((l, i) => drawText(g, l, x + 6, y + 80 + i * 8, UI.ink, 1, null)); drawText(g, `COLOUR: ${hr.color.toUpperCase()}   NO. ${hr.number}`, x + 6, y + 126, UI.dim, 1, null); drawText(g, `LUCKY PLACE: ${hr.place[1].toUpperCase()}`, x + 6, y + 135, UI.good, 1, null); }
    else wrap('Watch Starry Morning on the TV before noon, or ask Kiko at the shrine, to read today\'s horoscope.', 40).forEach((l, i) => drawText(g, l, x + 6, y + 82 + i * 8, UI.dim, 1, null));
    panel(g, x + 174, y + 64, w - 174, h - 64, 'paper');
    drawText(g, 'LUCK DOES', x + 180, y + 70, UI.accent2, 1, null);
    ['BAD: NOTHING BAD, JUST QUIET', 'OKAY: AS USUAL', 'GOOD 62+: GIFTS WARMER', 'LUCKY 70+: BONUS FISH', 'LUCKY 70+: COIN FINDS'].forEach((l, i) => wrap(l, 24).forEach((ll, j) => drawText(g, ll, x + 180, y + 80 + i * 17 + j * 8, i < 2 ? UI.dim : UI.ink, 1, null)));
    const hist = s.luckHist || []; hist.slice(-7).forEach((hv, i) => { const bh = Math.round(hv / 100 * 20); rect(g, TCOL[LUCK_TIERS.findIndex(([m]) => hv < m)], x + 180 + i * 14, y + h - 6 - bh, 10, bh); });
  },
});
const chip = (g, game, a) => { const v = luckValue(game), t = `LUCK: ${luckTier(v).toUpperCase()}`; rect(g, '#2b1d2ecc', a.x + a.w - t.length * 5 - 14, a.y + a.h - 11, t.length * 5 + 12, 10); rect(g, TCOL[tierIdx(v)], a.x + a.w - t.length * 5 - 12, a.y + a.h - 9, 5, 6); drawText(g, t, a.x + a.w - t.length * 5 - 5, a.y + a.h - 9, '#fff6c0', 1, null); };
for (const id of ['calendar', 'stats']) {
  const app = get('phoneApp', id);
  if (app && !app._svl) { const orig = app.draw; app._svl = 1; app.draw = function (g, game, a) { orig.call(this, g, game, a); try { chip(g, game, a.area); } catch (e) { /* ignore */ } }; }
}

features('Town Life', [
  'Daily luck from 0 to 100 rolled each morning, nudged by the weather, the town fountain wish and the shrine',
  'Luck is shown as a chip on the Calendar and Stats phone apps and in the Fortune app, with a 7 day history',
  'Madame Pom\'s Starry Morning horoscope on the TV (mornings): a lucky colour, number and place for Misa\'s sign, the Lantern',
  'Visiting the horoscope\'s lucky place on the day gives a small extra luck bonus',
  'Drawing a fortune at the shrine raises the day\'s luck by how good the slip was',
  'Kiko will read your luck once a day at the shrine office and add a little luck',
  'On lucky days (70+) a fish or crop may come with a bonus copy and bugs, shells and minerals may come with a few coins',
  'On good days (62+) gifts land warmer and give extra friendship points',
  'A toast tells you when the day is extra lucky or unlucky',
]);
