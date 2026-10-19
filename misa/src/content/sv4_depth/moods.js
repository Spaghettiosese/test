// Daily moods, mood icons over heads, mood gift effects, schedule variants (hobby / tired / secret errand) and comfort items.
import { register, get } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { defineSprite } from '../../art.js';
import { sprite } from '../../artcache.js';
import { planFor } from '../../world/npc.js';
import { parseHM } from '../../core/time.js';
import { holidayOn } from '../social/util.js';
import { isBirthday } from '../../systems/social.js';
import { S, remember, lastMem, nameOf, inBag } from './state.js';
import { TRAD_DATE } from './tradedates.js';

export const MOODS = ['joyful', 'content', 'tired', 'blue', 'prickly'];
export const MOOD_WORD = { joyful: 'Joyful', content: 'Content', tired: 'Tired', blue: 'Blue', prickly: 'Prickly' };
export const WEATHER_LOVE = { kai: { rain: -0.4, storm: -0.3 }, hina: { rain: 0.5 }, theo: { rain: 0.3 }, tobias: { storm: -0.4 }, jun: { storm: 0.2, sunny: 0.3 }, ogawa: { sunny: 0.3 }, hana: { rain: -0.2, sunny: 0.3 }, kiko: { windy: 0.3 }, pip: { rain: -0.5, storm: -0.6 }, goro: { rain: 0.2 }, aoi: { sunny: 0.3 }, sora: { rain: 0.2 } };
const W_BASE = { sunny: 0.3, cloudy: 0, rain: -0.2, storm: -0.4, snow: 0.1, windy: -0.1 };

export function computeMood(g, id) {
  const f = g.friend(id);
  let sc = (g.rngFor('sv4dmood:' + id)() - 0.5) * 2.2;
  sc += (W_BASE[g.weather] || 0) + ((WEATHER_LOVE[id] || {})[g.weather] || 0);
  if (f.talkedDay) { const d = g.day - f.talkedDay; sc += d <= 1 ? 0.15 : d >= 6 ? -0.3 : 0; }
  const gm = lastMem(g, id, 'gift', 3);
  if (gm) sc += { love: 0.5, like: 0.25, neutral: 0, dislike: -0.4, hate: -0.7 }[gm.r] || 0;
  if (f.upset && g.day - f.upset <= 4) sc -= 0.6;
  if (lastMem(g, id, 'promise', 4, (m) => !m.ok)) sc -= 0.5;
  const luck = g.state.svlife && g.state.svlife.luck ? g.state.svlife.luck.base : 50;
  sc += ((luck - 50) / 100) * 0.4;
  if (sc >= 0.5) return 'joyful';
  if (sc >= -0.2) return 'content';
  if (sc >= -0.45) return 'tired';
  return (f.upset && g.day - f.upset <= 4) || gm && (gm.r === 'hate') ? 'prickly' : sc < -0.7 ? 'prickly' : 'blue';
}
export function moodOf(g, id) {
  const s = S(g), c = s.mood[id];
  if (c && c.day === g.day) return c.m;
  const m = variantOf(g, id) === 'tired' ? 'tired' : computeMood(g, id);
  s.mood[id] = { day: g.day, m };
  g.bus.emit('sv4dMood', { npc: id, mood: m });
  return m;
}
export function setMood(g, id, m) { S(g).mood[id] = { day: g.day, m }; }

// ---------- gifts ----------
const BASE = { love: 80, like: 45, neutral: 20, dislike: -20, hate: -40 };
const K_POS = { joyful: 0.2, content: 0, tired: -0.15, blue: -0.1, prickly: -0.25 };
const K_NEG = { joyful: -0.4, content: 0, tired: 0.15, blue: 0.2, prickly: 0.35 };
export const COMFORT_RE = /soup|tea|miso|cocoa|broth|porridge|congee|latte/;
export const comfortItems = (g) => inBag(g, COMFORT_RE).filter((k) => !/^(ing_|seed_|mat_)/.test(k));
export function moodGiftDelta(mood, reaction, birthday, item) {
  const base = BASE[reaction] * (birthday ? 3 : 1), k = (base >= 0 ? K_POS : K_NEG)[mood] || 0;
  let extra = Math.round(base * k);
  if (item && COMFORT_RE.test(item) && (mood === 'tired' || mood === 'blue') && base > 0) extra += 15;
  return extra;
}

// ---------- schedule variants ----------
// [hobby stops, tired stops, errand stops] as [map, spot] pairs
const VAR = {
  kai: [[['beach', 'shore'], ['harbour', 'pier_end']], [['town', 'bench_1']], [['library', 'table_2']]],
  suzu: [[['harbour', 'mural'], ['cafe', 'window_seat']], [['sunny_pines', 'garden_bench']], [['lighthouse', 'logbook']]],
  rina: [[['park', 'bandstand']], [['cafe', 'window_seat']], [['harbour', 'noodle_stand']]],
  theo: [[['beach', 'driftwood'], ['harbour', 'mural']], [['school_roof', 'bench']], [['cafe', 'karaoke']]],
  hina: [[['cave', 'pools'], ['beach', 'rocks']], [['school_grounds', 'garden']], [['library', 'museum']]],
  fujita: [[['school_roof', 'telescope']], [['cafe', 'table_4']], [['mart', 'arcade']]],
  ogawa: [[['beach', 'shore'], ['school_grounds', 'track']], [['school_grounds', 'bench']], [['library', 'stacks']]],
  hana: [[['park', 'bandstand']], [['sunny_pines', 'lounge']], [['clock_shop', 'bench']]],
  tobias: [[['park', 'pond_edge']], [['clock_shop', 'stool']], [['beach', 'driftwood']]],
  mika: [[['harbour', 'market_stall']], [['cafe', 'window_seat']], [['shrine', 'fortune_stand']]],
  sachiko: [[['town', 'market_1']], [['post_office', 'bench']], [['beach', 'shaved_ice']]],
  jun: [[['lighthouse', 'balcony']], [['harbour', 'boat']], [['park', 'chess_table']]],
  kiko: [[['mart', 'arcade']], [['shrine', 'steps']], [['cave', 'star_mark']]],
  pip: [[['beach', 'sandbar']], [['post_office', 'bench']], [['school_roof', 'corner']]],
  goro: [[['park', 'chess_table']], [['goro_house', 'chair']], [['school_grounds', 'greenhouse']]],
  aoi: [[['park', 'bridge'], ['school_grounds', 'track']], [['post_office', 'bench']], [['library', 'stacks']]],
  haru: [[['town', 'noticeboard'], ['harbour', 'market_stall']], [['cafe', 'table_3']], [['clock_shop', 'bench']]],
  sora: [[['beach', 'shore'], ['lighthouse', 'balcony']], [['sunny_pines', 'garden_bench']], [['shrine', 'lookout']]],
  momo: [[['town', 'market_2']], [['cafe', 'table_1']], [['harbour', 'market_stall']]],
};
const STUDENTISH = new Set(['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'ogawa', 'aoi', 'haru']);
export const VARIANTS = ['hobby', 'tired', 'errand'];
const ORIG = {};
const cache = new Map();
function baseHere(g, id) {
  const o = ORIG[id]; if (!o) return false;
  const plan = planFor({ schedule: o }, g);
  if (!plan) return false;
  let st = null; for (const s of plan.stops) if (parseHM(s.at) <= 12 * 60) st = s;
  return !!(st || plan.stops[plan.stops.length - 1]).map;
}
export function baseAvailable(g, id) { return baseHere(g, id); }
export function variantOf(g, id) {
  const key = `${g.state.seed}:${g.day}:${id}`;
  if (cache.has(key)) return cache.get(key);
  let v = null;
  const def = get('npc', id);
  if (def && VAR[id] && g.day >= 3 && !holidayOn(g.day) && !g.state.flags.holiday && !isBirthday(def, g) && !(TRAD_DATE[id] && check('date:' + TRAD_DATE[id], g)) && baseHere(g, id)) {
    const r = g.rngFor('sv4dvar:' + id)(), off = !check('school', g), wet = g.weather === 'rain' || g.weather === 'storm';
    if (STUDENTISH.has(id) && !off) v = null;
    else if (r < 0.1) v = 'hobby';
    else if (r < (wet ? 0.25 : 0.17)) v = 'tired';
    else if (r < (wet ? 0.31 : 0.23)) v = 'errand';
  }
  if (cache.size > 4000) cache.clear();
  cache.set(key, v);
  return v;
}
export function variantSpot(id, v) { const a = VAR[id] && VAR[id][VARIANTS.indexOf(v)]; return a ? a[0] : null; }
function stopsFor(list) {
  const a = list[0], b = list[1] || list[0];
  return [{ at: '08:30', map: a[0], spot: a[1] }, { at: '13:30', map: b[0], spot: b[1] }, { at: '18:30', map: null }];
}
for (const id of Object.keys(VAR)) {
  const d = get('npc', id);
  if (!d) continue;
  d.schedule = d.schedule || [];
  ORIG[id] = d.schedule.slice();
  VARIANTS.slice().reverse().forEach((v) => { d.schedule.unshift({ when: (g) => variantOf(g, id) === v, stops: stopsFor(VAR[id][VARIANTS.indexOf(v)]) }); });
}

// ---------- icons and overlay ----------
const ICON = {
  joyful: (R) => { R.e(5, 5, 4, 4, '#ffd76a'); R.e(5, 5, 3, 3, '#ffe9a0'); R(4, 4, 1, 1, '#7a4a20'); R(7, 4, 1, 1, '#7a4a20'); R(4, 7, 4, 1, '#c0502a'); R(0, 5, 1, 1, '#ffd76a'); R(10, 5, 1, 1, '#ffd76a'); R(5, 0, 1, 1, '#ffd76a'); },
  content: (R) => { R.e(5, 5, 4, 4, '#8ad09a'); R(4, 4, 1, 1, '#2a5a3a'); R(7, 4, 1, 1, '#2a5a3a'); R(4, 7, 4, 1, '#2a5a3a'); },
  tired: (R) => { R.e(5, 5, 4, 4, '#8aa8e0'); R(3, 4, 2, 1, '#2a3a6a'); R(7, 4, 2, 1, '#2a3a6a'); R(5, 7, 2, 1, '#2a3a6a'); R(9, 0, 3, 1, '#4a5aa0'); R(10, 1, 1, 1, '#4a5aa0'); R(9, 2, 3, 1, '#4a5aa0'); },
  blue: (R) => { R.e(5, 5, 4, 4, '#9aa8b8'); R(3, 4, 2, 1, '#3a4a5a'); R(7, 4, 2, 1, '#3a4a5a'); R(4, 7, 4, 1, '#3a4a5a'); R(3, 8, 1, 2, '#6ab0f0'); },
  prickly: (R) => { R.e(5, 5, 4, 4, '#e0705a'); R(3, 3, 3, 1, '#4a1a10'); R(6, 3, 3, 1, '#4a1a10'); R(4, 5, 1, 1, '#4a1a10'); R(7, 5, 1, 1, '#4a1a10'); R(4, 8, 4, 1, '#4a1a10'); },
};
for (const m of MOODS) defineSprite('sv4d_mi_' + m, 12, 12, (R) => ICON[m](R), { hd: true, outline: 'selective' });

register('worldLayer', 'sv4d_mood', {
  overlay(g, world, game) {
    try {
      const p = world.player;
      for (const n of world.presentNPCs()) {
        if (!n.def || n.def.hidden || !game.state.seen['met:' + n.id]) continue;
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d > 120) continue;
        const m = moodOf(game, n.id);
        if (m === 'content' && d > 56) continue;
        const img = sprite('sv4d_mi_' + m);
        if (img) g.drawImage(img, world.sx(n.x) - Math.round(img.width / 2) + 14, world.sy(n.y) - 58);
      }
    } catch (e) { /* cosmetic */ }
  },
});

register('system', 'sv4dMoods', {
  init(game) {
    game.bus.on('gift', ({ npc, item, reaction, birthday }) => {
      if (!BASE[reaction]) return;
      const m = moodOf(game, npc), extra = moodGiftDelta(m, reaction, birthday, item);
      if (extra) { game.addFriend(npc, extra); game.toast(`${nameOf(npc)} is ${m}: ${extra > 0 ? '+' : ''}${extra}`, extra > 0 ? 'heart' : 'i_sweat'); }
    });
  },
});
