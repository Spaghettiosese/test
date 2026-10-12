// Quest engine + story chapters (owned by the story area).
//
// Quest defs (register('quest', id, def)):
//   { name, desc, giver?, main?, chapter?, start?: Matcher, stages: [ string | { text, done?: Matcher, script?, hint? } ],
//     reward?: { money, items: {id:n}, friend: {npc:n}, flags: [] }, next?: questId }
//   Matcher = { on: 'eventName', ...payloadFields, count?, when?: Cond }    payload fields match by value, any-of array,
//             | { has: Cond }                                             or a predicate (value, payload, game) => bool
//   A stage whose matcher fires runs its `script` (a script id, steps array or (game) => steps) and then advances.
//   Stages without a matcher are advanced by scripts: { t:'advance', quest: id } (or { t:'quest', ... } steps).
//   `has` matchers are re-checked on itemGot, moneyChanged, dayStart, mapEnter, hour, flag changes and quest changes.
//   A quest with `start` begins by itself when its matcher fires (side quests); `next` chains the following quest.
//
// Chapters (register('chapter', id, def)): { n, name, quest, trigger: Cond, on?: ['dayStart','mapEnter','hour'],
//   open?: scriptId | steps | (game) => steps, summary, art }. Chapter n starts when chapter n-1 is done
//   (flag chapter_<n-1>_done, normally set by the chapter quest's reward flags) and its trigger passes on one of the
//   listed events. game.state.story.chapter is the latest chapter started.
//
// Services added to game: game.story = { play(steps), advance(questId), stageDef(questId), hint(), objective(),
//   startChapter(n), progress() }.
// New script steps (register('command')): goto, place, walk, leave, advance, card, mail, toast, clock, weather, wait2.
import { register, get, all } from '../core/registry.js';
import { check, addCondKind } from '../core/cond.js';
import { dateOf, weekdayOf, seasonOf } from '../core/time.js';

// ---------------------------------------------------------------- state
export function storyState(game) {
  const s = game.state.story || (game.state.story = { chapter: 0 });
  s.started ||= {}; s.doneDay ||= {}; s.qn ||= {}; s.visited ||= {}; s.memories ||= {}; s.clues ||= {}; s.links ||= {};
  s.journal ||= {}; s.solved ||= {}; s.nudges ||= 0;
  if (s.lastProgress === undefined) s.lastProgress = game.state.time.day;
  return s;
}

// Places that count as "town locations" for the Chapter 2 trigger.
export const TOWN_PLACES = ['cafe', 'mart', 'library', 'post_office', 'clock_shop', 'shotengai', 'park', 'harbour', 'beach', 'shrine', 'sunny_pines', 'school_grounds'];

// Condition kinds: since:N>=2 (days since chapter N was finished), places>=4 (town locations visited).
try {
  addCondKind('since', (g, a) => { const d = (g.state.story.doneDay || {})[a]; return d === undefined ? -999 : g.state.time.day - d; });
  addCondKind('places', (g) => TOWN_PLACES.filter((m) => (g.state.story.visited || {})[m]).length);
} catch { /* hot reload */ }

// ---------------------------------------------------------------- helpers
export const stageDef = (def, i) => { const s = def && def.stages && def.stages[i]; return s && typeof s === 'object' ? s : { text: s }; };
export const stageText = (s, game) => (typeof s.text === 'function' ? s.text(game) : s.text);

export function spotPos(mapId, name) {
  const d = get('map', mapId);
  if (!d || !name) return null;
  return (d.spots || {})[name] || (d.spawns || {})[name] || null;
}

function matches(m, ev, data, game) {
  if (!m || m.on !== ev) return false;
  for (const [k, v] of Object.entries(m)) {
    if (k === 'on' || k === 'count' || k === 'when') continue;
    const d = data ? data[k] : undefined;
    if (typeof v === 'function') { if (!v(d, data, game)) return false; }
    else if (Array.isArray(v)) { if (!v.includes(d)) return false; }
    else if (d !== v) return false;
  }
  return !m.when || check(m.when, game);
}

const stepsOf = (game, sc) => {
  if (!sc) return null;
  if (typeof sc === 'string') { const d = get('script', sc); if (!d) { console.warn('unknown script', sc); return null; } return typeof d.steps === 'function' ? d.steps(game, {}) : d.steps; }
  return typeof sc === 'function' ? sc(game) : sc;
};

// ---------------------------------------------------------------- the play queue
// Story scenes triggered by events wait until the player is free (world on top, not mid-warp, no other cutscene).
function makeQueue(game) {
  const q = [];
  const idle = () => { const w = game.world; return !!w && game.scenes.top === w && !w.busy && !game.passingOut; };
  const pump = () => {
    if (!q.length || !idle()) return;
    const job = q.shift();
    let steps;
    try { steps = typeof job.steps === 'function' ? job.steps(game) : job.steps; } catch (e) { console.error(e); steps = []; }
    game.run(steps || []).then(job.res, job.res);
  };
  const play = (steps, { front = false } = {}) => new Promise((res) => {
    if (!game.world) { // headless: run straight away
      game.run(typeof steps === 'function' ? steps(game) : steps).then(res);
      return;
    }
    const job = { steps, res };
    if (front) q.unshift(job); else q.push(job);
    setTimeout(pump, 0);
  });
  return { play, pump, get length() { return q.length; } };
}

// ---------------------------------------------------------------- engine
register('system', 'quests', {
  init(game) {
    const queue = makeQueue(game);
    const pending = new Set();
    let rechecking = false, recheckQueued = false;

    const S = () => storyState(game);
    const progress = () => { S().lastProgress = game.day; };

    function finishStage(id) {
      const def = get('quest', id), q = game.quest(id);
      if (!def || !q || q.done || pending.has(id)) return;
      const st = stageDef(def, q.stage), steps = stepsOf(game, st.script);
      if (!steps || !steps.length) return advance(id);
      pending.add(id);
      const at = q.stage;
      queue.play(steps).then(() => { pending.delete(id); const q2 = game.quest(id); if (q2 && !q2.done && q2.stage === at) advance(id); });
    }
    function advance(id) {
      const def = get('quest', id), q = game.quest(id);
      if (!q || q.done) return;
      delete S().qn[id];
      if (!def || q.stage + 1 >= (def.stages || []).length) game.completeQuest(id);
      else game.setStage(id, q.stage + 1);
      recheckSoon();
    }
    function startQuest(id) {
      if (game.quest(id)) return;
      game.startQuest(id);
      recheckSoon();
    }

    // Matchers: a bus event arrives.
    function onEvent(ev, data) {
      // scripted warps inside a cutscene must not satisfy "go to X" objectives
      if (ev === 'mapEnter' && game.scenes.has('cutscene')) { recheckSoon(); return; }
      for (const def of all('quest')) {
        const q = game.quest(def.id);
        if (!q) {
          if (def.start && def.start.on && matches(def.start, ev, data, game)) startQuest(def.id);
          continue;
        }
        if (q.done || pending.has(def.id)) continue;
        const m = stageDef(def, q.stage).done;
        if (!m || !m.on || !matches(m, ev, data, game)) continue;
        const n = (S().qn[def.id] || 0) + 1;
        if (n < (m.count || 1)) { S().qn[def.id] = n; if (m.count > 1) game.toast(`${def.name}: ${n}/${m.count}`, 'i_quest'); continue; }
        finishStage(def.id);
      }
      if (['dayStart', 'mapEnter', 'hour'].includes(ev)) checkChapters(ev);
      recheckSoon();
    }

    // `has` matchers, quest auto-starts and chapter triggers.
    function recheck() {
      if (rechecking) return;
      rechecking = true;
      try {
        for (const def of all('quest')) {
          const q = game.quest(def.id);
          if (!q) { if (def.start && def.start.has !== undefined && check(def.start.has, game)) startQuest(def.id); continue; }
          if (q.done || pending.has(def.id)) continue;
          const m = stageDef(def, q.stage).done;
          if (m && m.has !== undefined && check(m.has, game)) finishStage(def.id);
        }
      } finally { rechecking = false; }
    }
    function recheckSoon() {
      if (recheckQueued) return;
      recheckQueued = true;
      Promise.resolve().then(() => { recheckQueued = false; recheck(); });
    }

    // Chapters
    const chapters = () => all('chapter').sort((a, b) => a.n - b.n);
    const chapterDef = (n) => chapters().find((c) => c.n === n);
    function nextChapter() {
      const s = S();
      const started = Object.keys(s.started).map(Number);
      if (!started.length) return chapterDef(0);
      const cur = Math.max(...started);
      return game.flag(`chapter_${cur}_done`) ? chapterDef(cur + 1) : null;
    }
    function checkChapters(ev) {
      const c = nextChapter();
      if (!c) return;
      if (c.on && ev && !c.on.includes(ev)) return;
      if (!check(c.trigger, game)) return;
      startChapter(c.n);
    }
    function startChapter(n) {
      const c = chapterDef(n), s = S();
      if (!c || s.started[n]) return;
      s.started[n] = game.day; s.chapter = n; progress();
      if (c.onStart) c.onStart(game);
      game.bus.emit('chapterStart', { n });
      const open = stepsOf(game, c.open) || [];
      queue.play([...open, { t: 'call', fn: (g) => { if (c.quest) startQuest(c.quest); } }]);
    }

    // Reward flags, `next` chains and chapter bookkeeping when a quest completes (by the engine or a script).
    game.bus.on('questDone', ({ id }) => {
      const def = get('quest', id);
      if (!def) return;
      for (const f of (def.reward || {}).flags || []) game.setFlag(f);
      for (const c of chapters()) if (c.quest === id) { S().doneDay[c.n] = game.day; game.setFlag(`chapter_${c.n}_done`); game.bus.emit('chapterDone', { n: c.n }); }
      if (def.main) progress();
      if (def.next) startQuest(def.next);
      recheckSoon();
      setTimeout(() => checkChapters(null), 0);
    });
    game.bus.on('questStage', ({ id }) => { const d = get('quest', id); if (d && d.main) progress(); recheckSoon(); });
    game.bus.on('questStart', ({ id }) => { const d = get('quest', id); if (d && d.main) progress(); });

    // flag changes re-check `has` matchers
    const setFlag = game.setFlag.bind(game), inc = game.inc.bind(game);
    game.setFlag = (k, v) => { setFlag(k, v); recheckSoon(); };
    game.inc = (k, n) => { const r = inc(k, n); recheckSoon(); return r; };

    // subscribe to every event a matcher names, plus the re-check events
    const events = new Set(['itemGot', 'moneyChanged', 'dayStart', 'mapEnter', 'hour', 'heartUp', 'questStage', 'storyProp', 'talk', 'sleep', 'minigameDone', 'homeTask', 'gift']);
    for (const def of all('quest')) {
      if (def.start && def.start.on) events.add(def.start.on);
      for (const s of def.stages || []) if (s && s.done && s.done.on) events.add(s.done.on);
    }
    for (const ev of events) game.bus.on(ev, (data) => onEvent(ev, data));

    game.bus.on('mapEnter', ({ map }) => { S().visited[map] = (S().visited[map] || 0) + 1; });
    const begin = () => { storyState(game); repair(); recheckSoon(); setTimeout(() => checkChapters(null), 0); };
    // chapter quests that should be running (e.g. a save made during an opening scene)
    function repair() {
      const s = S();
      for (const n of Object.keys(s.started)) { const c = chapterDef(+n); if (c && c.quest && !game.quest(c.quest)) game.startQuest(c.quest); }
    }
    game.bus.on('gameStart', begin);
    game.bus.on('gameLoaded', begin);
    game.bus.on('newGame', () => storyState(game));

    // story hints
    const activeMain = () => all('quest').filter((q) => q.main && game.questActive(q.id)).sort((a, b) => (b.chapter ?? -1) - (a.chapter ?? -1))[0];
    function hint() {
      const q = activeMain() || all('quest').find((d) => game.questActive(d.id));
      if (!q) return null;
      const st = stageDef(q, game.quest(q.id).stage);
      const h = typeof st.hint === 'function' ? st.hint(game) : st.hint;
      return { quest: q, stage: st, text: h || stageText(st, game) };
    }

    game.story = {
      play: (steps, o) => queue.play(steps, o),
      advance, startQuest, startChapter, checkChapters, hint, activeMain,
      stageDef: (id) => { const q = game.quest(id); return q ? stageDef(get('quest', id), q.stage) : null; },
      progress, recheck: recheckSoon, state: S, queueLength: () => queue.length,
    };

    register('worldTick', 'story_queue', { update: () => queue.pump() });
  },
});

// ---------------------------------------------------------------- script commands
const W = (g) => g.world;
function npcActor(g, who) { const w = W(g); return w && w.npcs && w.npcs[who]; }
function freeTileNear(w, tx, ty) {
  const ok = (x, y) => w.grid && w.grid[y] && w.grid[y][x];
  if (ok(tx, ty)) return [tx, ty];
  for (let r = 1; r < 5; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ok(tx + dx, ty + dy)) return [tx + dx, ty + dy];
  return [tx, ty];
}
function resolveTile(g, s) {
  const w = W(g);
  if (!w || !w.map) return null;
  if (s.spot) { const p = spotPos(w.map.id, s.spot); if (p) return freeTileNear(w, p[0] + (s.dx || 0), p[1] + (s.dy || 0)); }
  if (s.to) return freeTileNear(w, s.to[0], s.to[1]);
  const p = w.player, tx = Math.floor(p.x / 16), ty = Math.floor((p.y - 1) / 16);
  return freeTileNear(w, tx + (s.dx ?? 1), ty + (s.dy ?? 0));
}
const withTimeout = (p, sec) => Promise.race([p, new Promise((r) => setTimeout(r, sec * 1000))]);

register('command', 'goto', { // { t:'goto', map, spot, dir } warp to a named spot (falls back to the default spawn)
  run(g, s) {
    if (!W(g) || !get('map', s.map)) return;
    const d = get('map', s.map), p = spotPos(s.map, s.spot) || (d.spawns || {}).default || [2, 2];
    return g.warp(s.map, p[0], p[1], s.dir || p[2] || 'down');
  },
});
register('command', 'place', { // { t:'place', who, spot? | to? | dx,dy (relative to Misa), dir } put an NPC into the scene
  run(g, s) {
    const a = npcActor(g, s.who), t = resolveTile(g, s);
    if (!a || !t) return;
    a.present = true; a.leaving = false; a.path = null; a.talkT = 0;
    a.place(t[0], t[1], s.dir || 'down');
    if (s.face !== false && W(g).player) a.faceTo(W(g).player.x, W(g).player.y);
  },
});
register('command', 'walk', { // { t:'walk', who, spot | to | dx,dy, wait? } walk an NPC (or 'misa') to a spot
  run(g, s) {
    const w = W(g), t = resolveTile(g, s);
    if (!w || !t) return;
    const a = s.who === 'misa' ? w.playerActor() : npcActor(g, s.who);
    if (!a) return;
    const p = s.who === 'misa' ? a.walkTo(t[0], t[1]) : a.walkTo(w.grid, t[0], t[1]);
    if (s.wait === false) return;
    return withTimeout(p, s.max || 7);
  },
});
register('command', 'leave', { // { t:'leave', who } an NPC walks to the nearest door and goes on with their day
  run(g, s) {
    const w = W(g), a = npcActor(g, s.who);
    if (!w || !a || !a.present) return;
    const ws = w.map.warps || [];
    if (!ws.length) { a.present = false; return; }
    const best = ws.slice().sort((p, q) => Math.hypot(p.x * 16 - a.x, p.y * 16 - a.y) - Math.hypot(q.x * 16 - a.x, q.y * 16 - a.y))[0];
    a.leaving = true; a.goTo(w.grid, best.x, best.y);
  },
});
register('command', 'advance', { run(g, s) { if (g.story) g.story.advance(s.quest); } }); // { t:'advance', quest }
register('command', 'card', { // { t:'card', n, title, sub } a chapter title card
  run(g, s) { return new Promise((res) => { if (!get('scene', 'story_card')) return res(); g.open('story_card', s, res); }); },
});
register('command', 'mail', { run(g, s) { g.mail(s.id, s.from, s.text, s.extra || {}); } }); // { t:'mail', id, from, text }
register('command', 'toast', { run(g, s) { g.toast(s.text, s.icon || 'i_star'); } });   // { t:'toast', text, icon }
register('command', 'clock', { // { t:'clock', at:'15:30' } move the clock forward to a time (never backwards)
  run(g, s) { const [h, m] = String(s.at).split(':').map(Number), to = h * 60 + (m || 0); if (to > g.minutes) g.advance(to - g.minutes); },
});
register('command', 'weather', { run(g, s) { g.state.weather = s.set; } }); // { t:'weather', set:'rain' }
register('command', 'chapter', { run(g, s) { if (g.story) g.story.startChapter(s.n); } });

// expose a few helpers for content modules
export { matches, stepsOf, dateOf, weekdayOf, seasonOf };
