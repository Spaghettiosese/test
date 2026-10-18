// Creative Hobbies (sv4_hobbies): shared state, the five hobby skills with their professions, buffs, ribbons and helpers.
//
// Save data: game.state.sv4h = { photo, music, pot, write, flower, ribbons, seen }.
// Skills added: photography, music, pottery, writing, ikebana (professions at 5 and 10 through the sv_explore profession system).
// Events emitted: photoTaken { id, stars, map }, songPlayed { song, acc, busk }, potFired { item, score }, chapterWritten { n },
// bouquetMade { item, score }, sv4hRibbon { kind, rank }. Stats bumped: photosTaken, photos5, songsPlayed, buskTips, potsFired,
// storiesWritten, chaptersWritten, bouquetsMade, ribbons.
import { register, get, all } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { PROFS } from '../sv_explore/prof.js';
import { BUFFS, addBuff, hasBuff } from '../economy/core.js';
export { say, N, call, has, giveOr, stickers, idle, nameOf } from '../sv_life/state.js';

export const DEFAULT = () => ({
  photo: { day: -1, used: 0, extra: 0, album: [], seq: 1, frames: {}, stickers: {}, seen: {}, commission: null, comDay: -1, contests: {}, wall: [], taken: 0 },
  music: { inst: {}, songs: {}, albums: {}, band: { members: [], name: '', rehearsals: 0 }, busk: { day: -1, n: 0, total: 0 }, plays: 0, gigs: {}, radioDay: -1, radioMood: 0 },
  pot: { kiln: [], made: 0, best: {}, unlocked: {}, fair: {}, woven: 0, shelfDay: -1 },
  write: { stories: [], shelf: {}, novel: { done: [], tone: [] }, contests: {}, reviews: 0, day: -1, wrote: 0, lend: 0, club: -1 },
  flower: { made: 0, best: 0, shows: {}, day: -1, today: 0 },
  ribbons: [], seen: {},
});
register('stateSlice', 'sv4h', { default: DEFAULT });
export const S = (g) => (g.state.sv4h ||= DEFAULT());
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const stat = (g, k) => (g.state.stats && g.state.stats[k]) || 0;
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// ---------------------------------------------------------------- skills
const sk = (id, name, desc, shape, c, how) => register('skill', id, { name, desc, icon: itemIcon(shape, { c }), color: c, how });
sk('photography', 'Photography', 'Light, timing and good company make the picture.', 'paper', K.sky[3], 'Take photos, enter contests');
sk('music', 'Music', 'Recorder, guitar and keyboard, from practice room to town square.', 'star', K.coral[2], 'Practise songs, busk, play gigs');
sk('pottery', 'Pottery', 'Clay, glaze, a kiln, and a loom for good measure.', 'bowl', K.hairGinger ? K.hairGinger[2] : K.wood[2], 'Throw pots, weave, fire the kiln');
sk('writing', 'Writing', 'Short stories, reviews and one long novel.', 'book', K.lilac[2], 'Write stories and novel chapters');
sk('ikebana', 'Ikebana', 'Arranging flowers with a few careful lines.', 'flower', K.ribbon[2], 'Arrange bouquets, enter the flower show');
export const HOBBIES = ['photography', 'music', 'pottery', 'writing', 'ikebana'];

// Professions: [level-5 id, name, fx, [[level-10 id, name, fx], x2]] (effect keys as in sv_explore/prof.js)
const T = {
  photography: [['sv4h_photojournalist', 'Photojournalist', { sell: { tags: ['photo'], m: 1.25 } }, [['sv4h_gallerist', 'Gallerist', { sell: { tags: ['photo'], m: 1.5 } }], ['sv4h_curator', 'Curator', { xp: { skills: '*', m: 1.1 } }]]],
    ['sv4h_portraitist', 'Portraitist', { xp: { skills: ['photography'], m: 1.25 } }, [['sv4h_studio_pro', 'Studio Pro', { xp: { skills: ['photography'], m: 1.4 } }], ['sv4h_friend_all', 'Friend of Everyone', { mood: { ev: 'talk', n: 1 } }]]]],
  music: [['sv4h_busker', 'Street Musician', { coin: { ev: 'talk', n: 2 } }, [['sv4h_headliner', 'Headliner', { sell: { tags: ['album'], m: 1.5 } }], ['sv4h_troubadour', 'Troubadour', { coin: { ev: 'talk', n: 4 } }]]],
    ['sv4h_composer', 'Composer', { sell: { tags: ['album'], m: 1.25 } }, [['sv4h_maestro', 'Maestro', { xp: { skills: ['music'], m: 1.4 } }], ['sv4h_producer', 'Producer', { sell: { tags: ['album'], m: 1.4 } }]]]],
  pottery: [['sv4h_potter', 'Master Potter', { sell: { tags: ['pottery'], m: 1.25 } }, [['sv4h_kiln_keeper', 'Kiln Keeper', { sell: { tags: ['pottery'], m: 1.5 } }], ['sv4h_glaze_artist', 'Glaze Artist', { xp: { skills: ['pottery'], m: 1.4 } }]]],
    ['sv4h_weaver', 'Weaver', { sell: { tags: ['weaving'], m: 1.3 } }, [['sv4h_tapestry', 'Tapestry Maker', { sell: { tags: ['weaving'], m: 1.5 } }], ['sv4h_fair_star', 'Fair Star', { sell: { tags: ['pottery', 'weaving'], m: 1.2 } }]]]],
  writing: [['sv4h_storyteller', 'Storyteller', { xp: { skills: ['writing'], m: 1.25 } }, [['sv4h_bestseller', 'Bestseller', { sell: { tags: ['writing'], m: 1.6 } }], ['sv4h_novelist', 'Novelist', { xp: { skills: ['writing'], m: 1.4 } }]]],
    ['sv4h_critic', 'Critic', { sell: { tags: ['writing'], m: 1.3 } }, [['sv4h_editor', 'Editor', { xp: { skills: ['study'], m: 1.3 } }], ['sv4h_laureate', 'Laureate', { mood: { ev: 'talk', n: 1 } }]]]],
  ikebana: [['sv4h_florist', 'Florist', { sell: { tags: ['bouquet'], m: 1.25 } }, [['sv4h_grand_florist', 'Grand Florist', { sell: { tags: ['bouquet'], m: 1.5 } }], ['sv4h_show_judge', 'Show Judge', { xp: { skills: ['ikebana'], m: 1.4 } }]]],
    ['sv4h_arranger', 'Arranger', { xp: { skills: ['ikebana'], m: 1.25 } }, [['sv4h_iemoto', 'Iemoto', { xp: { skills: ['gardening'], m: 1.3 } }], ['sv4h_garden_muse', 'Garden Muse', { mood: { ev: 'homeTask', n: 2 } }]]]],
};
for (const [skill, pair] of Object.entries(T)) {
  for (const [id, name, fx, kids] of pair) {
    PROFS[id] = register('profession', id, { skill, level: 5, name, fx });
    for (const [kid, kname, kfx] of kids) PROFS[kid] = register('profession', kid, { skill, level: 10, name: kname, from: id, fx: kfx });
  }
}
// Hobby professions waiting for a choice (the sv_explore queue opens the picker when the overworld is free).
export function pendingHobbyProfs(g) {
  const out = [], pk = g.state.sv_explore && g.state.sv_explore.prof ? g.state.sv_explore.prof.picked : {};
  for (const skill of HOBBIES) {
    const lv = g.skillLevel(skill), p = pk[skill] || {};
    if (lv >= 5 && !p[5]) out.push({ skill, level: 5 }); else if (lv >= 10 && p[5] && !p[10]) out.push({ skill, level: 10 });
  }
  return out;
}
register('worldTick', 'sv4h_prof', {
  update(dt, world, g) {
    const Q = g.svq; if (!Q || !g.state.sv_explore) return;
    for (const p of pendingHobbyProfs(g)) if (!Q.q.some((e) => e.skill === p.skill && e.level === p.level)) Q.q.push({ t: 'pick', ...p });
  },
});

// ---------------------------------------------------------------- buffs
Object.assign(BUFFS, {
  sv4h_inspired: { name: 'Inspired', desc: '+15% hobby XP', mins: 180, color: '#c9b3ff' },
  sv4h_steady: { name: 'Steady hands', desc: 'Easier photos, pots and bouquets', mins: 180, color: '#86cdb0' },
  sv4h_bookish: { name: 'Bookish glow', desc: '+1 mood every hour', mins: 240, color: '#f29aa0' },
  sv4h_tune: { name: 'Humming', desc: '+25% busking tips', mins: 240, color: '#ffd76a' },
  sv4h_bloom: { name: 'Fresh bloom', desc: 'Flower shows go a little easier', mins: 240, color: '#ff9ec0' },
});
export const buffLevel = (g) => (hasBuff(g, 'sv4h_steady') ? 2 : 0);
export function gain(g, skill, n) {
  n = Math.max(1, Math.round(n * (hasBuff(g, 'sv4h_inspired') ? 1.15 : 1)));
  g.addXP(skill, n); return n;
}
export function addRibbon(g, kind, name, rank) {
  S(g).ribbons.push({ kind, name, rank, day: g.day });
  g.stat('ribbons'); g.sfx('star'); g.toast(`${['', 'Blue', 'Red', 'White'][rank] || 'Participation'} ribbon: ${name}`, 'i_star');
  g.bus.emit('sv4hRibbon', { kind, rank });
}
// A random rival scores for contests: n rivals around `lo..hi`.
export function rivals(g, tag, n = 3, lo = 0.35, hi = 0.8) { const r = g.rngFor(tag); return Array.from({ length: n }, () => lo + r() * (hi - lo)); }
export const rankOf = (score, riv) => 1 + riv.filter((x) => x > score).length;

// ---------------------------------------------------------------- items
export function item(id, name, cat, price, shape, c, desc, extra = {}) {
  const { c2, c3, ...rest } = extra;
  return register('item', id, { name, cat, price, desc, icon: itemIcon(shape, { c, c2, c3 }), ...rest });
}

// ---------------------------------------------------------------- map hooks (wrapped objects getter, like sv2_play)
export function hookObjects(mapId, fn) {
  const m = get('map', mapId); if (!m) return;
  const d = Object.getOwnPropertyDescriptor(m, 'objects');
  const base = d && d.get ? d.get : () => (d ? d.value : m.objects) || [];
  let lastIn = null, lastOut = null;
  Object.defineProperty(m, 'objects', { get: () => { const b = base(); if (b !== lastIn) { lastIn = b; lastOut = fn(b); } return lastOut; }, enumerable: true, configurable: true });
}
export const addObjects = (mapId, objs) => hookObjects(mapId, (b) => [...b, ...objs]);

// ---------------------------------------------------------------- runtime: pending actions, hourly effects
export const PENDING = { q: null };
export function later(g, fn, hint) { PENDING.q = fn; if (hint) g.toast(hint); }
register('worldTick', 'sv4h_pending', {
  update(dt, world, g) {
    if (!PENDING.q || world.busy || g.scenes.top !== world) return;
    const fn = PENDING.q; PENDING.q = null; fn(g);
  },
});
register('system', 'sv4h', {
  init(game) {
    game.bus.on('hour', () => { if (hasBuff(game, 'sv4h_bookish')) game.addMood(1); });
    game.bus.on('gameLoaded', () => { PENDING.q = null; });
    game.bus.on('newGame', () => { PENDING.q = null; });
  },
});
void addBuff; void all;
