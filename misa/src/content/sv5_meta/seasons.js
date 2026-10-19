// Seasonal activities: 56 small walk-up moments (14 per season) from data.js, a Seasonal Diary phone app with a stamp per activity,
// four season badges (outfit + decor + title), and the Four Seasons ceremonies (yearly, and the grand one for all 56 stamps).
import { register, registerMany, features, get } from '../../core/registry.js';
import { parseHM, seasonOf, yearOf } from '../../core/time.js';
import { spotPos } from '../../systems/festivals.js';
import { itemIcon } from '../../gfx/icons.js';
import { CATALOG } from '../interiors/catalog.js';
import { UI, rect, panel, drawText, wrap } from '../../ui/ui.js';
import './art.js';
import { ACTS, ACT, BYSEASON } from './data.js';
import { S, say, N, call, has, giveOr, stickers, title } from './state.js';
import { scrollList, keyNav, listRows, chips, RH } from './ui.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'], CAP = (s) => s[0].toUpperCase() + s.slice(1);
// ---------------------------------------------------------------- outfits and decor rewards
const OUTFITS = [
  ['sv5_spring', 'Hanami picnic dress', { top: '#f7c6d4', bottom: '#fff3f0' }, 'Pale pink with petal prints. Earned with the Spring badge.'],
  ['sv5_summer', 'Seaside sundress', { top: '#4fb0d8', bottom: '#f4e6a8' }, 'Sky blue and sand yellow. Earned with the Summer badge.'],
  ['sv5_autumn', 'Maple scout coat', { top: '#c8662a', bottom: '#5a3a2a' }, 'Russet and cosy. Earned with the Autumn badge.'],
  ['sv5_winter', 'Snow-day parka', { top: '#e8f0fa', bottom: '#4a5a8a' }, 'Puffy white. Earned with the Winter badge.'],
  ['sv5_four', 'Four Seasons kimono', { top: '#e07a9a', bottom: '#3f7aa0', hair: '#f0c060' }, 'Spring, summer, autumn and winter on one sleeve.'],
];
for (const [id, name, look, desc] of OUTFITS) register('outfit', id, { name, look, desc });
export function unlockOutfit(g, id) { if (!g.state.outfits.includes(id)) { g.state.outfits.push(id); g.toast(`New outfit: ${get('outfit', id).name}`, 'i_star'); } }

const DECOR = [
  ['furn_sv5_kite_wall', 'Kite on the wall', 'spring', 'wall', 1, 'shape:frame', '#f7a1b1', 'A paper kite with a ribbon tail.'],
  ['furn_sv5_petal_rug', 'Petal rug', 'spring', 'rug', 2, 'rug', '#fbd0da', 'A soft rug scattered with sakura petals.'],
  ['furn_sv5_melon_stool', 'Watermelon stool', 'summer', 'floor', 1, 'furniture', '#e0506a', 'A stool shaped like a juicy slice.'],
  ['furn_sv5_chime_wall', 'Glass wind chime', 'summer', 'wall', 1, 'frame', '#8fb8e0', 'Tinkles even when there is no wind.'],
  ['furn_sv5_leaf_garland', 'Maple leaf garland', 'autumn', 'wall', 2, 'frame', '#d8742a', 'Red and gold leaves on a string.'],
  ['furn_sv5_pumpkin_lantern', 'Pumpkin lantern', 'autumn', 'floor', 1, 'furniture', '#e8802a', 'A carved pumpkin with a warm glow.'],
  ['furn_sv5_snowman_mini', 'Little snowman', 'winter', 'floor', 1, 'toy', '#fafcff', 'A tiny snowman that never melts.'],
  ['furn_sv5_mochi_stand', 'Kagami mochi stand', 'winter', 'floor', 1, 'furniture', '#fffaf0', 'A stacked mochi offering for the new year.'],
];
const ditems = {};
for (const [id, name, season, kind, w, shape, c, desc] of DECOR) {
  CATALOG[id] = { w, h: 1, kind, comfort: 4, act: null, name, theme: 'season', price: 300, season, desc, shape: shape.replace('shape:', ''), c, id, spr: id, light: id.includes('pumpkin') };
  ditems[id] = { name, desc: `${desc} (Seasonal)`, cat: 'decor', price: 300, tags: ['furniture', 'theme_season', 'season_' + season].concat(kind === 'wall' ? ['wall'] : [], kind === 'rug' ? ['rug'] : []), icon: itemIcon(shape.replace('shape:', ''), { c }), useLabel: 'Put in decor box',
    use(game) { const st = game.state.homeDecor; st.box[id] = (st.box[id] || 0) + 1; game.toast(`${name} went into the decor box`, 'i_star'); return false; } };
}
registerMany('item', ditems);
const decorFor = (season, n) => DECOR.filter((d) => d[2] === season)[n][0];

register('backdrop', 'sv5_seasons', { music: 'festival', draw(g, game, t) {
  const cols = [['#f8d8e0', '#f7a1b1'], ['#9ad8f0', '#79c26a'], ['#f0c898', '#e8964a'], ['#c8d8e8', '#ffffff']];
  cols.forEach(([a, b], i) => { const x = i * 80; rect(g, a, x, 0, 80, 150); rect(g, b, x, 150, 80, 74); for (let k = 0; k < 7; k++) rect(g, b, x + (k * 29 + t * (8 + i * 3)) % 78, (k * 41 + t * 20) % 148, 3, 2); });
  rect(g, '#2b1d2e', 0, 100, 320, 2); rect(g, '#fff6c0', 150, 90, 20, 20);
} });

// ---------------------------------------------------------------- availability, running, rewards
const todayN = (g, a) => { const p = S(g).plays[a.id]; return p && p.day === g.day ? p.n : 0; };
export function avail(g, a) {
  if (g.season !== a.s) return { ok: false, why: `${CAP(a.s)} only` };
  if (g.minutes < parseHM(a.h[0]) || g.minutes >= parseHM(a.h[1])) return { ok: false, why: `Come back ${a.h[0] > '12:00' ? 'later' : 'at ' + a.h[0]}` };
  if (a.wx && !a.wx.includes(g.weather)) return { ok: false, why: `Needs ${a.wx.slice(0, 2).join(' or ')} weather` };
  if (todayN(g, a) >= a.lim) return { ok: false, why: 'Done for today' };
  return { ok: true };
}
const lerp = (r, st) => Math.round(r[0] + (r[1] - r[0]) * [0.4, 0.75, 1][st - 1]);
export function giveReward(g, a, stars) {
  const r = a.rw, out = [];
  if (r.c && r.c[1]) { const n = lerp(r.c, stars); g.addMoney(n); out.push(`${n} coins`); }
  if (r.i && (stars >= 2 || !(r.c && r.c[1]))) { const nm = giveOr(g, r.i, 30); out.push(nm); if (r.n > 1 && has(r.i)) g.give(r.i, r.n - 1, true); }
  if (r.b && g.addBuff) g.addBuff(r.b);
  if (r.m) g.addMood(Math.round(r.m * (0.6 + stars * 0.2)));
  if (r.e) g.addEnergy(r.e);
  if (r.f && stars >= 2 && get('npc', r.f[0])) g.addFriend(r.f[0], r.f[1] + (stars === 3 ? 3 : 0));
  if (r.x) g.addXP(r.x[0], r.x[1] + stars);
  return out;
}
export function finishActivity(g, a, stars) {
  const s = S(g), y = yearOf(g.day);
  const p = s.plays[a.id] = s.plays[a.id] && s.plays[a.id].day === g.day ? s.plays[a.id] : { day: g.day, n: 0 }; p.n++;
  const first = !s.stamps[a.id];
  if (first) { s.stamps[a.id] = { day: g.day, y, stars }; g.toast(`New stamp: ${a.name}`, 'i_star'); g.stat('sv5Stamps'); }
  else s.stamps[a.id].stars = Math.max(s.stamps[a.id].stars, stars);
  if (stars === 3 && !s.gold[a.id]) { s.gold[a.id] = 1; g.stat('sv5Gold'); }
  ((s.yearly[y] ||= {})[a.s] ||= {})[a.id] = 1;
  if (s.rec.dayActs.day !== g.day) s.rec.dayActs = { day: g.day, n: 0 }; s.rec.dayActs.n++; s.rec.bestDayActs = Math.max(s.rec.bestDayActs, s.rec.dayActs.n);
  g.stat('sv5Acts'); g.stat('sv5_' + a.s);
  const out = giveReward(g, a, stars);
  g.bus.emit('sv5Activity', { id: a.id, stars, season: a.s });
  checkProgress(g);
  return out;
}
export const stampCount = (g, season) => ACTS.filter((a) => (!season || a.s === season) && S(g).stamps[a.id]).length;
export function checkProgress(g) {
  const s = S(g);
  for (const se of SEASONS) {
    const n = stampCount(g, se);
    if (n >= 7 && !s.decorGot[se + 1]) { s.decorGot[se + 1] = 1; giveOr(g, decorFor(se, 0), 300); g.toast(`${CAP(se)} diary: 7 stamps!`, 'i_star'); }
    if (n >= 14 && !s.badges[se]) {
      s.badges[se] = g.day; unlockOutfit(g, 'sv5_' + se); giveOr(g, decorFor(se, 1), 300); stickers(g, 3, `${CAP(se)} badge`);
      title(g, { spring: 'Spring Wanderer', summer: 'Summer Rover', autumn: 'Autumn Scout', winter: 'Winter Dreamer' }[se]); g.stat('sv5Badges');
      g.bus.emit('sv5Badge', { season: se });
    }
  }
  if (SEASONS.every((se) => s.badges[se]) && !s.grand) { s.grand = g.day; ceremony(g, 'grand'); }
}
export function yearCount(g, y, se) { return Object.keys(((S(g).yearly[y] || {})[se]) || {}).length; }
export function yearlyCheck(g) {
  const y = yearOf(g.day - 1), s = S(g); if (g.day < 2 || y < 1 || s.ceremony[y]) return false;
  if (!SEASONS.every((se) => yearCount(g, y, se) >= 5)) return false;
  s.ceremony[y] = g.day; ceremony(g, 'year', y); return true;
}
export function ceremony(g, kind, y = 1) {
  g.stat('sv5Ceremonies'); g.bus.emit('sv5Ceremony', { kind });
  const grand = kind === 'grand';
  g.run([{ t: 'scene', name: 'sv5_seasons' }, N(grand ? 'All fifty-six stamps. Spring petals, summer waves, autumn leaves and winter snow, all in one little book.' : `Year ${y} is over, and you spent a bit of time in every season.`),
    say('misa', 'happy', grand ? 'I did it. Every season, every little moment!' : 'Four seasons, one wonderful year.'),
    call((gg) => { stickers(gg, grand ? 10 : 3, 'Four Seasons Complete'); gg.addMoney(grand ? 1500 : 400); if (grand) { unlockOutfit(gg, 'sv5_four'); title(gg, 'Four Seasons Keeper'); } gg.addMood(20); }),
    { t: 'scene', name: null }]);
}

export async function runActivity(g, a) {
  const av = avail(g, a);
  if (!av.ok) return g.run([N(av.why + '.')]);
  let stars = 1, q = 0.6;
  if (a.mini) {
    const r = await g.minigame(a.id, {});
    if (!r || r.quit) return null;
    stars = r.stars || 1; q = r.score || 0;
    if (a.id === 'sv5s_snowman') {
      let acc = 0;
      for (const [prompt, opts] of [['Add a head piece', ['A bucket hat', 'A knitted scarf']], ['Add a face', ['A carrot nose', 'Button eyes']]]) {
        await g.run([{ t: 'choice', prompt, options: opts.map((o) => ({ text: o, steps: [call(() => { acc++; }), N(`${o} goes on. The snowman looks very pleased.`)] })) }]);
      }
      q += acc * 0.04; if (q >= 0.85) stars = 3;
    }
  } else {
    let pq = 0.6;
    await g.run([N(a.sc.intro), { t: 'choice', prompt: a.sc.q, options: a.sc.picks.map(([l, res, qq]) => ({ text: l, steps: [call(() => { pq = qq; }), N(res)] })) }, N(a.sc.end)]);
    q = pq + (a.bx.includes(g.weather) ? 0.1 : 0) + ((g.rng ? g.rng() : 0.5) - 0.5) * 0.2; stars = q >= 0.85 ? 3 : q >= 0.6 ? 2 : 1;
  }
  g.advance(a.kotatsu ? 90 : a.mini ? 20 : 15);
  const out = finishActivity(g, a, stars);
  await g.run([N(`${'*'.repeat(stars)} ${out.length ? 'You got: ' + out.join(', ') + '.' : 'A lovely moment.'}`)]);
  return { stars, out };
}

register('targetProvider', 'sv5_acts', {
  find(world, game) {
    const p = world.player; let best = null;
    for (const a of BYSEASON[game.season] || []) {
      if (a.map !== world.map.id) continue;
      const q = spotPos(a.map, a.spot, a.d[0], a.d[1]); if (!q) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < 22 && (!best || d < best.dist)) { const av = avail(game, a); best = { label: av.ok ? a.lab : `${a.name}: ${av.why}`, dist: d, x: q.x, y: q.y - 8, run: (g) => runActivity(g, a) }; }
    }
    return best;
  },
});
register('worldLayer', 'sv5_spot_marks', {
  below(g, world, game) {
    for (const a of BYSEASON[game.season] || []) {
      if (a.map !== world.map.id || !avail(game, a).ok) continue;
      const q = spotPos(a.map, a.spot, a.d[0], a.d[1]); if (!q) continue;
      const x = world.sx(q.x), y = world.sy(q.y) - 2, f = Math.floor(game.clock * 2) % 2;
      g.globalAlpha = 0.55; g.fillStyle = '#fff6c0'; g.fillRect(x - 5, y - f, 10, 1); g.fillRect(x - 3, y - 1 - f, 6, 1); g.globalAlpha = 1;
    }
  },
});
register('system', 'sv5_seasons', { init(game) {
  game.bus.on('dayStart', () => yearlyCheck(game));
  game.bus.on('gameLoaded', () => checkProgress(game));
} });

// ---------------------------------------------------------------- Seasonal Diary app
const SCOL = { spring: '#f7a1b1', summer: '#79c26a', autumn: '#e8964a', winter: '#9cc8e8' };
register('phoneApp', 'sv5_diary', {
  name: 'Seasonal Diary', icon: 'i_cal', order: 64,
  badge: (g) => ACTS.filter((a) => a.s === g.season && avail(g, a).ok).length,
  open(game, app) { Object.assign(app.state, { tab: Math.max(0, SEASONS.indexOf(game.season)), sel: 0, top: 0 }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed, list = BYSEASON[SEASONS[st.tab]];
    if (k.has('c')) st.tab = (st.tab + 1) % 4;
    const zone = { x, y: y + 18, w: 150, h: 9 * RH }, t = scrollList(input, st, list.length, zone); if (t >= 0) st.sel = t;
    keyNav(input, st, list.length, 9);
    if (input.justDown) for (let i = 0; i < 4; i++) if (input.mx >= x + i * 73 && input.mx < x + i * 73 + 71 && input.my >= y && input.my < y + 14) { st.tab = i; st.sel = 0; st.top = 0; }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, se = SEASONS[st.tab], list = BYSEASON[se], s = S(game);
    chips(g, null, x, y, 292, SEASONS.map((n) => `${n} ${stampCount(game, n)}/14`), st.tab);
    listRows(g, st, { x, y: y + 18, w: 150, h: 9 * RH }, list.length, (i) => { const a = list[i], sm = s.stamps[a.id]; return { text: a.name, dot: sm ? (s.gold[a.id] ? '#ffd76a' : SCOL[se]) : '#c8c0b0', right: sm ? '*'.repeat(sm.stars) : '', dim: !sm }; });
    const a = list[Math.min(st.sel, list.length - 1)], sm = s.stamps[a.id], px = x + 164;
    panel(g, px, y + 18, w - 164, 144, 'paper');
    drawText(g, a.name.toUpperCase().slice(0, 22), px + 5, y + 24, UI.accent2, 1, null);
    wrap(sm ? a.hint : `Hint: ${a.hint}`, 28).slice(0, 4).forEach((l, i) => drawText(g, l.toUpperCase(), px + 5, y + 36 + i * 9, UI.ink, 1, null));
    drawText(g, a.mini ? 'MINIGAME' : 'LITTLE SCENE', px + 5, y + 76, UI.dim, 1, null);
    drawText(g, sm ? `STAMPED DAY ${sm.day}` : 'NOT STAMPED YET', px + 5, y + 86, sm ? UI.good : UI.dim, 1, null);
    drawText(g, avail(game, a).ok ? 'AVAILABLE NOW' : avail(game, a).why.toUpperCase().slice(0, 28), px + 5, y + 96, avail(game, a).ok ? UI.good : UI.bad, 1, null);
    drawText(g, `PLAYS TODAY ${todayN(game, a)}/${a.lim}`, px + 5, y + 106, UI.ink2, 1, null);
    const n = stampCount(game, se);
    drawText(g, s.badges[se] ? `${se.toUpperCase()} BADGE EARNED` : `BADGE AT 14 STAMPS (${n})`, px + 5, y + 122, s.badges[se] ? UI.good : UI.dim, 1, null);
    drawText(g, `ALL SEASONS ${stampCount(game)}/56`, px + 5, y + 134, UI.accent2, 1, null);
    drawText(g, 'C: NEXT SEASON   TAP A TAB', x, y + 164, UI.dim, 1, null);
  },
});

features('Seasons & Meta', ACTS.map((a) => `${CAP(a.s)} activity ${a.name}: ${a.mini ? 'a ' + a.mini.mech + ' minigame' : 'a little scene'} (${a.hint.toLowerCase()})`));
features('Seasons & Meta', [
  'Seasonal activities show a walk-up prompt at their spot with a gentle sparkle when ready, and explain why when it is the wrong time or weather',
  'Every activity has a daily play limit, hours and weather ties, and pays coins, an item, a buff, a little friendship or mood, scaled by stars',
  'Seasonal Diary phone app: a stamp for each of the 56 activities with hints, star ratings, gold stamps for 3 stars and per-season progress',
  'Seven stamps in a season unlock a seasonal decor piece; fourteen earn the season badge, a seasonal outfit, a second decor piece, a title and Star Stickers',
  'Eight seasonal furniture pieces (kite, petal rug, melon stool, wind chime, leaf garland, pumpkin lantern, snowman, kagami mochi) work in the decorate mode',
  'Five seasonal outfits (picnic dress, sundress, maple coat, snow parka and the Four Seasons kimono) join the wardrobe',
  'Four Seasons Complete ceremony each year-end if you enjoyed at least five activities in every season, and a grand ceremony for all 56 stamps',
]);
