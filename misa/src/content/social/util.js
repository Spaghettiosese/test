// Social area helpers: a compact script syntax for heart events, NPC registration with the social
// extras (hangout override, perks, texts...), and small cutscene commands that move actors relative to Misa.
//
// Script shorthand used by every NPC file:  sc(defaultSpeaker, ...items) -> steps
//   'happy|Text'          the default speaker says Text (mood prefix optional)
//   '>happy|Text'         Misa says Text
//   '@Text'               narrator (no portrait)
//   'hana/sad|Text'       another speaker
//   '*heart' '*!' '*?' '*music' '*sweat' '*zzz' '*anger' '*chat'   emote over the default speaker ('*>heart' over Misa)
//   25 / -10              friendship with the default speaker
//   { t: ... }            any engine step; choice option steps and if/else branches are converted recursively
//   ch(prompt, [text, ...items], ...)  a choice;  arrive() / leave() / face()  actor helpers (see commands below)
import { register, get } from '../../core/registry.js';
import { scheduleEntry } from '../../world/npc.js';
import { TILE } from '../../world/map.js';
import { seasonOf, dateOf, weekdayOf, isWeekend } from '../../core/time.js';

const EMO = { heart: 'heart', '!': 'i_exclaim', '?': 'i_question', music: 'i_music', sweat: 'i_sweat', zzz: 'i_zzz', anger: 'i_anger', chat: 'i_chat' };
const MOODS = ['neutral', 'happy', 'surprised', 'sad', 'sleepy', 'angry'];

function lineStep(who, s) {
  if (s.startsWith('@')) return { t: 'say', who: null, mood: null, text: s.slice(1) };
  if (s.startsWith('*')) {
    const misa = s[1] === '>', key = s.slice(misa ? 2 : 1);
    return { t: 'emote', who: misa ? 'misa' : who, icon: EMO[key] || key };
  }
  let speaker = who, text = s;
  if (text.startsWith('>')) { speaker = 'misa'; text = text.slice(1); }
  const other = text.match(/^([a-z]+)\/([a-z]+)\|/);
  if (other) { speaker = other[1]; text = text.slice(other[0].length); return { t: 'say', who: speaker, mood: MOODS.includes(other[2]) ? other[2] : 'neutral', text }; }
  const m = text.match(/^([a-z]+)\|/);
  let mood = 'neutral';
  if (m && MOODS.includes(m[1])) { mood = m[1]; text = text.slice(m[0].length); }
  if (speaker === 'misa' && mood === 'angry') mood = 'surprised';
  return { t: 'say', who: speaker, mood, text };
}

export function sc(who, ...items) {
  const out = [];
  for (const it of items.flat()) {
    if (it === null || it === undefined || it === false) continue;
    if (typeof it === 'string') out.push(lineStep(who, it));
    else if (typeof it === 'number') out.push({ t: 'friend', npc: who, n: it });
    else if (it.t === 'choice') out.push({ ...it, options: it.options.map((o) => ({ ...o, steps: sc(who, ...(o.steps || [])) })) });
    else if (it.t === 'if') out.push({ ...it, then: sc(who, ...(it.then || [])), else: sc(who, ...(it.else || [])) });
    else out.push(it);
  }
  return out;
}
// ch('Prompt', ['Option text', ...items], ...)   an option may start with { when } as its second element
export function ch(prompt, ...opts) {
  return { t: 'choice', prompt, options: opts.map(([text, ...rest]) => {
    let when;
    if (rest[0] && typeof rest[0] === 'object' && 'when' in rest[0] && !rest[0].t) when = rest.shift().when;
    return { text, when, steps: rest };
  }) };
}
export const iff = (cond, then, els = []) => ({ t: 'if', cond, then: [].concat(then), else: [].concat(els) });
export const arrive = (who) => ({ t: 'soc_arrive', who });
export const leave = (who) => ({ t: 'soc_leave', who });
export const face = (who) => ({ t: 'soc_face', who });
export const flag = (k, v = true) => ({ t: 'flag', k, v });
export const backdrop = (name) => ({ t: 'scene', name });
export const fade = (to = 1, dur = 0.6) => ({ t: 'fade', to, dur });
export const wait = (dur = 0.6) => ({ t: 'wait', dur });
export const time = (add) => ({ t: 'time', add });
export const mood = (n) => ({ t: 'mood', n });
export const xp = (skill, n) => ({ t: 'xp', skill, n });
export const sfx = (name) => ({ t: 'sfx', name });
// Give an item if another area has registered it, otherwise coins (so scenes never hand out nothing).
export const giveOr = (item, coins = 0, n = 1) => ({ t: 'call', fn: (g) => giveItemOr(g, item, coins, n) });
export function giveItemOr(g, item, coins = 0, n = 1) {
  if (item && get('item', item)) { g.give(item, n); return true; }
  if (coins) g.addMoney(coins);
  return false;
}
// The standard opening and closing of a heart event: the friend walks up to Misa and they face each other.
export const open = (who) => [arrive(who), face(who)];

// ---------- calendar helpers ----------
export const isSchoolDay = (day) => !isWeekend(day) && seasonOf(day) !== 'summer' && !(seasonOf(day) === 'winter' && dateOf(day) > 20) && !(seasonOf(day) === 'spring' && dateOf(day) === 1);
export { seasonOf, dateOf, weekdayOf, isWeekend };
export const HM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export function clock12(m) { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }

// Holidays the cast react to (dates from DESIGN.md 5.3.22).
export const HOLIDAYS = {
  'spring-5': 'koinobori', 'spring-7': 'hanami', 'spring-19': 'sportsday', 'spring-28': 'starlight',
  'summer-7': 'tanabata', 'summer-14': 'derby', 'summer-20': 'matsuri',
  'autumn-13': 'harvest', 'autumn-15': 'moon', 'autumn-20': 'culture', 'autumn-21': 'culture', 'autumn-28': 'ghost',
  'winter-6': 'wintermarket', 'winter-14': 'chocolate', 'winter-22': 'yuzu', 'winter-24': 'starryeve', 'winter-28': 'newyear',
};
export const HOLIDAY_NAMES = {
  koinobori: 'Koinobori Day', hanami: 'the Hanami Picnic', sportsday: 'Sports Day', starlight: 'the Starlight Festival',
  tanabata: 'Tanabata', derby: 'the Fishing Derby', matsuri: 'the Summer Matsuri', harvest: 'the Harvest Market',
  moon: 'Moon Viewing', culture: 'the Culture Festival', ghost: 'Lantern Ghost Night', wintermarket: 'the Winter Market',
  chocolate: 'Friendship Chocolate Day', yuzu: 'the Solstice', starryeve: 'Starry Eve', newyear: 'New Year\'s Eve',
};
export const holidayOn = (day) => HOLIDAYS[`${seasonOf(day)}-${dateOf(day)}`] || null;

// Place names for hints and invitations.
export const MAP_NAMES = {
  home: 'Misa\'s house', yard: 'the front yard', lane: 'Lantern Lane', town: 'the town square', park: 'Sakura Park', shotengai: 'the shotengai',
  school_grounds: 'the school grounds', harbour: 'the harbour', beach: 'Shell Beach', cave: 'the tidepool cave', shrine: 'Hoshi Hill Shrine',
  lighthouse: 'the Star Lantern', sunny_pines: 'Sunny Pines', cafe: 'Cafe Kumo', mart: 'Sunny Mart', library: 'the library', post_office: 'the post office',
  clock_shop: 'Wren\'s Clocks', clock_tower: 'the clock tower', school_halls: 'the school halls', classroom: 'classroom 2-B', school_roof: 'the school roof',
  gym: 'the gym', goro_house: 'Goro\'s house',
};
export const placeName = (map) => MAP_NAMES[map] || (get('map', map) && get('map', map).name) || map;

// ---------- availability for hangouts: (day, minutes) -> null if free, else a reason line ----------
export const FREE = {
  student: (day, m) => (isSchoolDay(day) && m < 16 * 60 ? 'school' : m > 19 * 60 + 30 ? 'late' : null),
  teacher: (day, m) => (isSchoolDay(day) && m < 18 * 60 ? 'work' : m > 20 * 60 ? 'late' : null),
};

// ---------- registration ----------
// Every cast member goes through npc(): it keeps the engine's npc fields and adds the social extras:
//   color (name tag colour), hint (schedule hint for Contacts), free(day, minutes) for hangouts, places (hangout places),
//   hang: { <place>: 'line', fav: place, order: 'drink line' }, texts: [...], outfit: [...], holiday: {...},
//   followups: [{ flag, line }], perks: { 4: { item, coins, note }, 6: [items], 8: {...} }, upset, apology
export const SOCIAL_NPCS = [];
export function npc(id, def) {
  SOCIAL_NPCS.push(id);
  const d = register('npc', id, { ...def, override: (game) => overrideFor(game, id) });
  return d;
}
// Hangouts and parties move an NPC for a while; other systems add providers here.
export const OVERRIDES = [];
function overrideFor(game, id) {
  for (const f of OVERRIDES) { const o = f(game, id); if (o) return o; }
  return undefined;
}
export const npcDef = (id) => get('npc', id);
export const whereNow = (game, id) => { const d = get('npc', id); const e = d && scheduleEntry(d, game); return e ? e.stop : null; };

// ---------- small state helpers ----------
export const soc = (game) => game.state.social;
export const fr = (game, id) => game.friend(id);
export const met = (game, id) => !!game.state.seen['met:' + id];

// ---------- cutscene commands (no-ops when there is no world, e.g. in tests) ----------
const PAD = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2]];
function freeTileNear(world, tx, ty) {
  const ok = (x, y) => world.grid[y] && world.grid[y][x];
  for (const [dx, dy] of PAD) if (ok(tx + dx, ty + dy)) return [tx + dx, ty + dy];
  return [tx, ty];
}
function walkWithTimeout(npc, world, tx, ty, secs = 5) {
  return new Promise((res) => {
    let done = false;
    const fin = () => { if (done) return; done = true; res(); };
    npc.walkTo(world.grid, tx, ty).then(fin);
    setTimeout(() => { if (!done) { npc.place(tx, ty, npc.dir); npc.onArrive = null; fin(); } }, secs * 1000);
  });
}
register('command', 'soc_arrive', {
  run(game, step) {
    const w = game.world, npc = w && w.npcs && w.npcs[step.who];
    if (!w || !npc || !w.map) return;
    const p = w.player, ptx = Math.floor(p.x / TILE), pty = Math.floor((p.y - 1) / TILE);
    if (!npc.present) {
      const warps = w.map.warps.slice().sort((a, b) => Math.hypot(a.x - ptx, a.y - pty) - Math.hypot(b.x - ptx, b.y - pty));
      const start = warps[0] ? freeTileNear(w, warps[0].x, warps[0].y) : freeTileNear(w, ptx + 3, pty);
      npc.place(start[0], start[1], 'down');
      npc.present = true; npc.leaving = false; npc.socVisit = true;
    }
    if (Math.hypot(npc.tx - ptx, npc.ty - pty) <= 1.5) return;
    const [tx, ty] = freeTileNear(w, ptx, pty);
    return walkWithTimeout(npc, w, tx, ty);
  },
});
register('command', 'soc_face', {
  run(game, step) {
    const w = game.world, npc = w && w.npcs && w.npcs[step.who];
    if (!npc) return;
    npc.faceTo(w.player.x, w.player.y);
    const dx = npc.x - w.player.x, dy = npc.y - w.player.y;
    w.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  },
});
// After a scene, a friend who isn't scheduled here heads for the nearest door.
register('command', 'soc_leave', {
  run(game, step) {
    const w = game.world, npc = w && w.npcs && w.npcs[step.who];
    if (!w || !npc || !npc.present) return;
    const e = scheduleEntry(npc.def, game);
    npc.socVisit = false;
    if (e && e.stop && e.stop.map === w.map.id) { npc.entryKey = null; return; } // walk back to their spot
    const door = w.map.warps.slice().sort((a, b) => Math.hypot(a.x - npc.tx, a.y - npc.ty) - Math.hypot(b.x - npc.tx, b.y - npc.ty))[0];
    if (door) { npc.leaving = true; npc.goTo(w.grid, door.x, door.y); } else npc.present = false;
  },
});
// Move an actor a few tiles relative to where they stand (e.g. a friend runs off, pacing).
register('command', 'soc_step', {
  run(game, step) {
    const w = game.world, a = w && (step.who === 'misa' ? null : w.npcs[step.who]);
    if (!a) return;
    const tx = a.tx + (step.dx || 0), ty = a.ty + (step.dy || 0);
    if (!(w.grid[ty] && w.grid[ty][tx])) return;
    return walkWithTimeout(a, w, tx, ty, 3);
  },
});
export const stepBy = (who, dx, dy) => ({ t: 'soc_step', who, dx, dy });
// Remember a heart-event choice with today's day number (friends bring it up on a later day).
export const mark = (k) => ({ t: 'call', fn: (g) => g.setFlag(k, g.day) });
