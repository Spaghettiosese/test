// Festival engine (events area). A festival is a dated calendar entry that decorates maps, opens activities and
// minigames, sets flags other areas can read, and ends with a closing scene.
//
//   register('festival', id, {
//     name, desc, icon?,                       // shown in the calendar, countdown banner and forecast
//     date: 'summer-7' | ['summer-20', ...] | (game, day) => bool,   // day = absolute day number being asked about
//     maps: ['town', 'park'],                  // where it happens (attendance, music, closing scene)
//     hours: ['10:00', '22:00'],               // festival hours (decorations show all day, activities only in hours)
//     holiday?: true,                          // sets flag:holiday (no school) for the day
//     shop?: true,                             // sets flag:festival_shop and flag:festival_shop_<id> (economy stocks stalls)
//     school?: true,                           // content owned by the school area; we only list it and set flags
//     minor?: true,                            // a calendar note (rainy season, first snow...) with no banner countdown
//     decor?: { mapId: [{ spr, spot, dx?, dy?, flat?, light?: kind, when?: Cond }] },  // dx/dy in tiles from the spot
//     activities?: [{ id, map, spot, dx?, dy?, label, minigame?, opts?, cost?, run?(game, act), prize?(game, result), when?: Cond, daily?: true }],
//     lines?: { npcId: 'mood|Festival line' },   // talk hooks while the festival runs (first chat of the day)
//     setup?(game),                            // runs once on the morning of the festival
//     script?(game) -> steps, closeAt: '20:00', closeMap?: 'town',   // the closing scene, once, on closeMap after closeAt
//     music?: 'festival',                      // music on the festival maps during festival hours
//     weather?: 'clear' | null,                // 'clear' (default for outdoor festivals): rain/storm is softened to cloudy
//   })
//
// Flags while a festival runs: flag:festival_today, flag:festival_<id>, flag:festival_shop(_<id>), flag:holiday.
// Services: game.festivalsOn(day) -> [def], game.festivalToday() -> def|null, game.upcomingFestivals(days) ->
//   [{ day, def }], game.festivalAttended(id) -> bool. Bus events: festivalStart {id}, festivalAttend {id},
//   festivalClose {id}, festivalActivity {id, activity, result}.
import { register, get, all, features } from '../core/registry.js';
import { seasonOf, dateOf, yearOf, parseHM } from '../core/time.js';
import { check } from '../core/cond.js';
import { TILE } from '../world/map.js';
import { SPRITES } from '../art.js';
import { drawText, measure } from '../font.js';
import { sprite } from '../artcache.js';
import { panel } from '../ui/ui.js';

export const dayKey = (day) => `${seasonOf(day)}-${dateOf(day)}`;

// Does festival `f` happen on absolute day `day`?
export function festivalOnDay(f, game, day) {
  const d = f.date;
  if (!d) return false;
  if (typeof d === 'function') { try { return !!d(game, day); } catch { return false; } }
  const key = dayKey(day);
  return Array.isArray(d) ? d.includes(key) : d === key;
}
export function festivalsOn(game, day = game.day) { return all('festival').filter((f) => festivalOnDay(f, game, day)); }

const fstate = (game) => (game.state.festivals ||= { attended: {}, closed: {}, acts: {}, setupDay: 0, holidayDay: 0, wins: {} });
const yearKey = (game, id) => `${id}@${yearOf(game.day)}`;

// World position (px) of a decoration/activity anchored to a map spot. Returns null when the map or spot is missing.
export function spotPos(mapId, spot, dx = 0, dy = 0) {
  const m = get('map', mapId);
  const p = m && ((m.spots || {})[spot] || (m.spawns || {})[spot]);
  if (!p) return null;
  return { x: (p[0] + dx) * TILE + 8, y: (p[1] + dy) * TILE + 15 };
}

const inHours = (f, game) => { const [a, b] = f.hours || ['09:00', '23:00']; return game.minutes >= parseHM(a) && game.minutes < parseHM(b); };

// Clear yesterday's flags and raise today's.
function applyDay(game) {
  const st = fstate(game), flags = game.state.flags;
  for (const k of Object.keys(flags)) if (k.startsWith('festival_')) delete flags[k];
  if (st.holidayDay && st.holidayDay !== game.day && flags.holiday) { delete flags.holiday; st.holidayDay = 0; }
  const today = festivalsOn(game);
  for (const f of today) {
    flags.festival_today = true; flags['festival_' + f.id] = true;
    if (f.shop) { flags.festival_shop = true; flags['festival_shop_' + f.id] = true; }
    if (f.holiday) { flags.holiday = true; st.holidayDay = game.day; }
  }
  if (st.setupDay !== game.day) {
    st.setupDay = game.day;
    for (const f of today) { if (f.setup) try { f.setup(game); } catch (e) { console.error('festival setup', f.id, e); } game.bus.emit('festivalStart', { id: f.id }); }
    if (today.length && !today.every((f) => f.minor)) game.toast(`Today: ${today.filter((f) => !f.minor).map((f) => f.name).join(' & ')}!`, 'i_cal');
  }
}

function markAttended(game, f) {
  const st = fstate(game), k = yearKey(game, f.id);
  if (st.attended[k]) return;
  st.attended[k] = game.day;
  game.stat('festivalsAttended');
  game.collect('festival', f.id);
  game.bus.emit('festivalAttend', { id: f.id });
  game.addMood(4);
}

export async function runActivity(game, f, a) {
  const st = fstate(game), key = `${f.id}:${a.id}`;
  if (a.daily && st.acts[key] === game.day) return game.say('misa', 'happy', a.doneText || 'I already did that today. Let\'s see what else is going on!');
  if (a.cost && !game.spend(a.cost)) return;
  if (a.cost) game.sfx('coin');
  markAttended(game, f);
  let result = null;
  if (a.minigame) result = await game.minigame(a.minigame, a.opts || {});
  if (a.run) await a.run(game, a, result);
  if (result && result.quit) return;
  st.acts[key] = game.day;
  game.stat('festivalActivities');
  if (a.prize) await a.prize(game, result || {});
  game.bus.emit('festivalActivity', { id: f.id, activity: a.id, result });
}

// Closing scene: once per festival per year, when Misa is on the closing map after closeAt.
function checkClose(game, world) {
  if (game.scenes.top !== world || world.busy || game.dialogBusy) return;
  const st = fstate(game);
  for (const f of festivalsOn(game)) {
    if (!f.script || !f.closeAt) continue;
    const k = yearKey(game, f.id) + ':' + game.day;
    if (st.closed[k]) continue;
    const closeMap = f.closeMap || (f.maps || [])[0];
    if (world.map.id !== closeMap || game.minutes < parseHM(f.closeAt) || game.minutes > parseHM(f.closeBy || '25:30')) continue;
    st.closed[k] = true;
    markAttended(game, f);
    game.run(f.script(game)).then(() => { game.stat('festivalFinales'); game.bus.emit('festivalClose', { id: f.id }); });
    return;
  }
}

// Extra lights for festival lanterns: the lighting engine only reads map objects, so we chain world.visibleLights.
function patchLights(world, game) {
  if (world._festLights) return;
  world._festLights = true;
  const orig = world.visibleLights.bind(world);
  world.visibleLights = () => {
    const out = orig();
    for (const f of festivalsOn(game)) for (const d of ((f.decor || {})[world.map.id] || [])) {
      if (!d.light || (d.when && !check(d.when, game))) continue;
      const p = spotPos(world.map.id, d.spot, d.dx, d.dy);
      if (p) out.push({ kind: d.light, x: p.x + (d.lx || 0), y: p.y - (d.ly ?? 24) });
    }
    for (const fn of game.extraLights || []) out.push(...(fn(world, game) || []));
    return out;
  };
}

register('stateSlice', 'festivals', { default: () => ({ attended: {}, closed: {}, acts: {}, setupDay: 0, holidayDay: 0, wins: {} }) });

register('worldLayer', 'festival_decor', {
  below(g, world, game) {
    for (const f of festivalsOn(game)) for (const d of ((f.decor || {})[world.map.id] || [])) {
      if (!d.flat || (d.when && !check(d.when, game)) || !SPRITES[d.spr]) continue;
      const p = spotPos(world.map.id, d.spot, d.dx, d.dy);
      if (p) world.drawFeet(d.spr, p.x, p.y);
    }
  },
  sprites(world, game) {
    const out = [];
    for (const f of festivalsOn(game)) for (const d of ((f.decor || {})[world.map.id] || [])) {
      if (d.flat || (d.when && !check(d.when, game)) || !SPRITES[d.spr]) continue;
      const p = spotPos(world.map.id, d.spot, d.dx, d.dy), spr = d.anim ? d.anim[Math.floor(game.clock * 3) % d.anim.length] : d.spr;
      if (p) out.push({ y: p.y + (d.depth || 0), draw: () => { world.shadow(p.x, p.y, d.shadow || 10); world.drawFeet(spr, p.x, p.y, d.flip); } });
    }
    return out;
  },
});

register('worldTick', 'festivals', {
  update(dt, world, game) {
    patchLights(world, game);
    const today = festivalsOn(game);
    const here = today.find((f) => (f.maps || []).includes(world.map.id) && inHours(f, game) && !f.minor);
    world.music = here && !world.map.def.indoor ? (here.music || 'festival') : undefined;
    if (here && !here.school) markAttended(game, here);
    world._festT = (world._festT || 0) - dt;
    if (world._festT <= 0) { world._festT = 0.5; checkClose(game, world); }
  },
});

register('targetProvider', 'festival_activity', {
  find(world, game) {
    const p = world.player;
    let best = null;
    for (const f of festivalsOn(game)) {
      if (!inHours(f, game)) continue;
      for (const a of f.activities || []) {
        if (a.map !== world.map.id || (a.when && !check(a.when, game))) continue;
        const q = spotPos(a.map, a.spot, a.dx, a.dy);
        if (!q) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < 20 && (!best || d < best.dist)) {
          const label = typeof a.label === 'function' ? a.label(game) : a.label;
          best = { label: a.cost ? `${label} (${a.cost}c)` : label, dist: d, x: q.x, y: q.y - 8, run: (g) => runActivity(g, f, a) };
        }
      }
    }
    return best;
  },
});

// Countdown banner: 3 days before a festival (and on the day), shown for a few seconds after each map change.
register('hud', 'festival_banner', {
  draw(g, game) {
    const w = game.world;
    if (!w || game.hideHud || !game.festivalBannerT || game.festivalBannerT < game.clock) return;
    const up = game.upcomingFestivals(4).find((u) => !u.def.minor);
    if (!up) return;
    const n = up.day - game.day, text = n === 0 ? `Today: ${up.def.name}!` : n === 1 ? `${up.def.name} is tomorrow!` : `${up.def.name} in ${n} days`;
    const tw = measure(text) + 20, x = Math.round(160 - tw / 2), a = Math.min(1, (game.festivalBannerT - game.clock) * 2);
    g.globalAlpha = a;
    panel(g, x, 3, tw, 13, 'dark');
    if (SPRITES[up.def.icon || 'i_cal']) g.drawImage(sprite(up.def.icon || 'i_cal'), x + 3, 4);
    drawText(g, text, x + 15, 7, n === 0 ? '#ffd76a' : '#fff8e8');
    g.globalAlpha = 1;
  },
});

const hookedNpcs = new Set();
// Festival talk hooks are registered once the NPC registry is complete (system init), only for NPCs that exist.
function registerTalkHooks() {
  for (const f of all('festival')) for (const [npc, line] of Object.entries(f.lines || {})) {
    const id = `fest_${f.id}_${npc}`;
    if (get('talkHook', id) || !get('npc', npc)) continue;
    hookedNpcs.add(npc);
    register('talkHook', id, {
      npc, priority: 1,
      when: (game) => !!game.flag('festival_' + f.id) && game.friend(npc).festTalk !== game.day,
      steps(game) {
        const m = String(line).match(/^(neutral|happy|surprised|sad)\|/), mood = m ? m[1] : 'happy', text = m ? line.slice(m[0].length) : line;
        return [{ t: 'call', fn: (g) => { const fr = g.friend(npc); fr.festTalk = g.day; if (fr.talkedDay !== g.day) { fr.talkedDay = g.day; g.addFriend(npc, 15); g.stat('talks'); } if (!g.state.seen['met:' + npc]) { g.state.seen['met:' + npc] = g.day; g.bus.emit('meet', { npc }); } } },
          { t: 'say', who: npc, mood, text }];
      },
    });
  }
}

register('system', 'festivals', {
  init(game) {
    registerTalkHooks();
    game.festivalsOn = (day = game.day) => festivalsOn(game, day);
    game.festivalToday = () => festivalsOn(game).find((f) => !f.minor) || festivalsOn(game)[0] || null;
    game.upcomingFestivals = (days = 28, from = game.day) => {
      const out = [];
      for (let d = from; d < from + days; d++) for (const f of festivalsOn(game, d)) out.push({ day: d, def: f });
      return out;
    };
    game.festivalAttended = (id) => !!fstate(game).attended[yearKey(game, id)];
    game.runFestivalActivity = (fid, aid) => { const f = get('festival', fid); const a = f && (f.activities || []).find((x) => x.id === aid); return a ? runActivity(game, f, a) : Promise.resolve(); };
    const bump = () => { game.festivalBannerT = game.clock + 6; };
    game.bus.on('dayStart', () => { applyDay(game); bump(); });
    game.bus.on('gameStart', () => { applyDay(game); bump(); });
    game.bus.on('gameLoaded', () => { applyDay(game); bump(); });
    game.bus.on('loaded', () => applyDay(game));
    game.bus.on('mapEnter', bump);
  },
});

features('Festivals', [
  'Festival engine: on festival days the town is decorated, festival music plays, stalls open activities and minigames',
  'Festival countdown banner on the HUD from 3 days before each festival',
  'Festival closing scenes: stay until evening for a special finale scene at each festival',
  'Festival lanterns and stalls glow at night with their own lights',
  'Residents have special lines for each festival the first time you chat that day',
  'Festival attendance is recorded every year (counts toward achievements)',
]);
