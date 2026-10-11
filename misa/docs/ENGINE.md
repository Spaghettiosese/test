# Misa's Little Life: engine guide for contributors

Read this before writing content. The design bible is `docs/DESIGN.md` (story, cast, maps, the 795-feature list), the
art spec is `docs/ART.md` (palette, density, outlines, lighting, generators; working reference code in
`docs/art-ref/mock.js`), and the world contract (map ids, connections, spots, ownership) is `docs/WORLD.md`.

## Running

```bash
cd misa
python3 -m http.server 8080        # then open http://localhost:8080/index.html (a server is usually already running)
npm test                           # node --test tests/*.test.mjs  (validator, engine, scripts, minigames, art)
FEATURE_TARGET=560 npm test        # also enforces the feature count
```

Headless browser checks (Chromium is preinstalled):
```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
```
Debug hooks: `window.__misa` is the `Game`. Useful: `__misa.warp('town', 10, 8, 'down')`, `__misa.state.time.minutes = 20*60`,
`__misa.state.weather = 'rain'`, `__misa.give('apple', 3)`, `__misa.world.player`, `__misa.world.npcs.kai`,
`__misa.run([{ t:'say', who:'kai', mood:'happy', text:'Hi' }])`. Title: press Enter twice for a new game in slot 1.
Write throwaway scripts and screenshots in your own scratch folder, never in the repo.

## Golden rules for parallel work

1. **Only edit files you own** (see `docs/WORLD.md` → Ownership). Everything else is read-only for you. Several
   people are editing this tree at the same time; editing someone else's file can silently destroy their work.
2. **Never edit engine files** (`src/core/*`, `src/world/*`, `src/gfx/{palette,ground,lighting,weather,noise,chars,color}.js`,
   `src/art.js`, `src/artcache.js`, `src/main.js`, `src/content/index.js`). Use the extension points below. If you truly
   need an engine change, implement it inside your own files (e.g. a new `register('command', ...)`) or describe it in
   your final report.
3. Register everything through `src/core/registry.js`: `register(kind, id, def)`. Ids are global per kind; prefix
   anything generic with your area if collisions are likely (e.g. sprite `cafe_counter`, not `counter`).
4. Your area's entry file is `src/content/<area>/index.js`. Import all your modules from it. It's already imported by
   `src/content/index.js`.
5. **Declare features honestly**: `features('Category', ['one line per player-visible feature', ...])` from the module
   that implements them. Only list things that actually work in the build. The total must reach 560+ across the team;
   your brief gives your area's target. Duplicated text fails the tests.
6. `npm test` must stay green for your area. Run `node --test tests/content.test.mjs` often: the validator reports every
   broken reference (unknown sprite/item/map/spot/npc, unreachable spawns or interactables, bad conditions).
   References to things owned by other areas that don't exist yet will show up as errors; list them in your report
   rather than creating the other area's content yourself.
7. All player-visible text must use the pixel font's characters: letters, digits, space and `.,!?'":-+/%*()><#=[]_&$@;|~^`.
   No curly quotes, em dashes, accents or emoji. (The font is upper-case today; a mixed-case font is coming, so write
   normal sentence case.)

## Registry kinds (what the engine reads)

| kind | def fields |
|---|---|
| `map` | see Maps below |
| `tile` | `{ ground }` terrain, `{ floor, tint? }` interior floor, `{ wall }`, legacy `{ spr }`; `solid` |
| `item` | `name, desc, cat ('food','gift','crop','fish','bug','shell','mineral','material','seed','book','decor','clothes','tool','key','misc'), price (sell value), icon (sprite name, use itemIcon()), energy?, mood?, tags?: [...], key?: true (no bag slot), use?(game) -> return true to keep the item` |
| `npc` | `name, role, bio, look, birthday, schedule, gifts, lines, events` (see NPCs), `hidden` (phone-only family) |
| `minigame` | `{ title, make(game, opts) -> instance, result?: false, canQuit?, music?, bot?(inst, t, input) -> input }` instance: `update(dt, input, game)`, `draw(g, sprite, game)`, `done`, `score` 0..1, `bonus?`, `result?: { text }`, `finish?()` |
| `quest` | `name, desc, giver?, main?, chapter?, stages: [string | { text, done?: Matcher, script? }], reward?: { money, items: {id:n}, friend: {npc:n}, flags: [] }, next?` |
| `script` | `{ steps: [...] | (game, ctx) -> [...] }` reusable dialogue/cutscenes; run with `game.run(get('script',id).steps)` or step `{ t:'run', script }` |
| `talkHook` | `{ npc, when?: Cond, priority?, steps(game, npcEntity) -> [...] }` overrides normal chatter (quests, story) |
| `interaction` | `{ label: string | (game) => string, run(game, obj), when?: Cond, sprFn?(game, obj) -> sprite, overlay?(game, world, obj, x, y) }` referenced by map objects with `use: 'id'` |
| `shop`, `recipe`, `fish`, `crop`, `achievement`, `festival`, `skill`, `outfit` | owned by their areas; document your schema at the top of your module |
| `phoneApp` | `{ name, icon, order, when?(game), badge?(game), open?(game, app), update(dt, input, game, app), draw(g, game, app) }`; `app.area = {x,y,w,h}` |
| `scene` | `{ make(game, ...args) -> scene }`; open with `game.open(id, ...args)` |
| `system` | `{ init(game) }`: subscribe to bus events, add services to `game` |
| `stateSlice` | `{ default: () => ({...}) }` your save data at `game.state[id]` (deep-defaulted on load) |
| `hud` | `{ draw(g, game), always? }` drawn over the world (or always) |
| `track` | music `{ bpm, play(step) -> [{ n, len, v, type }] }` |
| `backdrop` | full-screen cutscene backdrops `{ draw(g, game, t), music? }`, used by step `{ t:'scene', name }` |
| `command` | new script steps `{ run(game, step, scene) -> Promise? }` |
| `worldLayer` | `{ below?, sprites?, above?, overlay?, solids? }` dynamic world drawing/collision (crops, bugs, puddles) |
| `worldTick` | `{ update(dt, world, game) }` |
| `targetProvider` | `{ find(world, game) -> { label, dist, run(game), x?, y? } | null }` interact with non-objects (water to fish, soil plots) |

## The `game` services (src/core/game.js)

State: `game.state` (save data), `game.day`, `game.minutes`, `game.season`, `game.weekday` (0=Mon), `game.weather`,
`game.isWeekend`, `game.part` ('morning'...), `game.rng()` (daily stream), `game.rngFor(tag, day?)`.
Time: `game.advance(min)`, `game.nextDay()`. Flags: `flag(k)`, `setFlag(k, v)`, `inc(k, n)`, `stat(k, n)`.
Items: `give(id, n, quiet)`, `take(id, n)`, `has(id, n)`, `count(id)`, `useItem(id)`, bag limit `state.bagSize`.
Money: `money`, `addMoney(n)`, `spend(n) -> bool`. Body: `addEnergy(n)`, `useEnergy(n) -> bool`, `addMood(n)`.
Skills: `addXP(skill, n)`, `skillLevel(skill)` (0-10). Friends: `addFriend(npc, pts)`, `hearts(npc)`, `friend(npc)`.
Quests: `startQuest`, `setStage`, `completeQuest`, `questActive`, `questDone`, `quest(id)`.
Misc: `achieve(id)`, `collect(kind, id)`, `collected(kind, id)`, `mail(id, from, text)`, `toast(text, icon)`, `sfx(name)`,
`check(cond)`. Flow (all return Promises): `run(steps)`, `say(who, mood, text)`, `minigame(id, opts) -> result
{ score, stars, bonus, quit? }`, `warp(map, tx, ty, dir)`, `open(sceneId, ...args)`. `game.sleep()`, `game.sleepPrompt()`,
`game.talk(npc)`, `game.giveGift(npc, item)`. Bus: `game.bus.on(event, fn)`; events: `newGame, gameStart, gameLoaded,
dayStart, dayEnd, hour, mapEnter, talk, meet, gift, heartUp, heartEvent, itemGot, itemUsed, moneyChanged,
minigameDone, questStart, questStage, questDone, achievement, collectNew, skillUp, sleep, passOut, interact, homeTask, stat`.
Emit your own (past tense) for others to hook, e.g. `fishCaught`, `cooked`, `shopBuy`, `classAttended`, `jobShift`.

## Conditions (src/core/cond.js)

Strings, arrays (AND) or `{ any: [...] }`, `{ not: ... }`; functions work but the validator can't see inside them.
Atoms: `flag:x`, `!flag:x`, `var:x>=3`, `stat:k>=10`, `skill:cooking>=3`, `item:tea>=2`, `item:tea`, `money>=100`,
`energy>=10`, `friend:kai>=4`, `met:kai`, `quest:id=active|done|none`, `quest:id>=2` (stage), `time>=17:00`,
`day:sat|sun`, `weekday`, `weekend`, `school`, `date:spring-12`, `season:winter`, `weather:rain|storm`, `map:cafe`,
`chapter>=2`, `year>=2`, `dayn>=5`. Join with `&`: `'school&time<15:30'`. Add kinds with `addCondKind(kind, reader)`.

## Scripts (dialogue and cutscenes, src/ui/cutscene.js)

```js
[{ t:'say', who:'kai', mood:'happy', text:'Morning!' },   // who: npc id, 'misa', 'mochi', or null (narrator); moods neutral/happy/surprised/sad (misa: sleepy too)
 { t:'choice', prompt:'Reply?', options:[{ text:'Sure', when:'money>=50', steps:[...] }, { text:'Later', steps:[] }] },
 { t:'if', cond:'friend:kai>=4', then:[...], else:[...] },
 { t:'give', item, n }, { t:'take', item, n }, { t:'money', n }, { t:'friend', npc, n }, { t:'mood', n }, { t:'xp', skill, n }, { t:'energy', n },
 { t:'set', flag:'x' }, { t:'set', var:'count', n:1 }, { t:'flag', k, v }, { t:'quest', start:'id' } / { t:'quest', id, stage:2 } / { t:'quest', complete:'id' },
 { t:'move', who:'kai', to:[tx,ty] }, { t:'face', who:'kai', to:'misa' }, { t:'emote', who:'misa', icon:'heart' },
 { t:'warp', map, x, y, dir }, { t:'time', add:60 }, { t:'minigame', id, opts, done(game, result) }, { t:'shop', id },
 { t:'fade', to:1, dur:0.5 }, { t:'wait', dur:1 }, { t:'scene', name:'nightSky' }, { t:'sfx', name:'chime' },
 { t:'run', script:'id' }, { t:'call', fn(game) -> Promise? }]
```
Emote icons are sprite names (`heart`, `i_exclaim`, `i_question`, `i_music`, `i_sweat`, `i_zzz`, `i_anger`, `i_chat`).
Sound effects: see `src/audio.js` (`addSfx(name, ({tone, noise}) => ...)` to add).

## Maps (src/world/map.js)

```js
register('map', 'cafe', {
  name: 'Cafe Kumo', indoor: true, music: 'cafe', bg: '#1e1624',   // outdoor: true for outside maps (weather, sky light)
  legend: { '#': 'wall', '.': 'wood', 't': 'kitchen' },             // chars -> registered tile ids (content/tiles.js has the base set)
  rows: [ '##########', '#........#', ... ],                       // 1 char per tile; all rows the same width; max 72x56
  objects: [{ spr: 'cafe_counter', x: 2, y: 3, w: 4, h: 1, use: 'cafe_order', light: { kind: 'lamp' }, shadow: 20 }],
  warps: [{ x: 5, y: 9, to: 'town:from_cafe' }],                     // step on the tile; enter: 'up' = only when walking up
  spawns: { default: [5, 8], from_town: [5, 8, 'up'] },            // arrival points: [tx, ty, facing?]
  spots: { counter: [3, 2], table_1: [6, 5] },                     // named places for NPC schedules and scripts
  lights: [{ x: 4, y: 2, kind: 'lamp' }],                          // free-standing lights
  onEnter(game) {},
});
```
- Tiles are 16 world px. The world is drawn at **2x**, so on screen one tile is 32 px.
- Objects: `spr, x, y, w, h` (footprint in tiles; the sprite's bottom-left sits on the footprint's bottom-left),
  `solid` (default true), `flat` (drawn under actors), `wall` (baked into the static layer), `dx/dy` (world px nudge),
  `fp: [x,y,w,h]` collision override in tiles, `use: 'interactionId'`, `interact: { label, run }`, `when: Cond`
  (conditional prop), `sprFn(game)`, `overlay(...)`, `light: { kind, x?, y?, when? }` (kinds: lamp, window, lantern,
  candle, shrine, vending, screen), `shadow: halfWidthPx` (contact shadow).
- **Warps target named spawns**: `to: 'mapId:spawnName'`. Convention: a map you can enter from `X` defines spawn
  `from_X`; its warp back targets `X:from_<thisMap>`. The validator checks every warp, spawn and spot is reachable.
- Ground tiles are painted procedurally (`src/gfx/ground.js`): terrain `grass meadow lawn dirt sand water ocean
  paved plaza gravel asphalt snow` blend organically; floors `planks wood_dark kitchen bath tatami linoleum gym carpet
  stone` (+`tint: <ramp>`); walls `plaster wood school brick stone hedge` (a wall gets a face when the tile below is
  walkable). Register new tile ids in your own module if you need tints/variants.

## Art (docs/ART.md is the spec)

- **One density: 1 art pixel = 1 screen pixel.** New sprites are `hd: true` and authored at screen size (a tile is
  32x32, a door 28x50, a table 48x40; see the scale chart in ART.md). Legacy 16 px sprites still work (upscaled) but
  don't add new ones.
- `defineSprite(name, w, h, (R, ctx) => {...}, { hd: true, outline: 'selective' | 'ink', seasonal?: true, flip? })`
  from `src/art.js`. `R(x,y,w,h,color)`, `R.e(cx,cy,rx,ry,color)` pixel ellipse, `R.t([x,y],[x,y],[x,y],color)`
  triangle, `R.at(dx,dy)` offset. With an outline the engine adds the 1 px margin itself (draw within 0..w-1).
  Seasonal sprites get `ctx.season` and `ctx.M = materials(season)` (season-swapped ramps).
- Colours come from `src/gfx/palette.js` (`RAMPS`, `materials(season)`, `INK`, `SHADOW`). Light from the top-left,
  shadows hue-shift to plum. Props: `outline: 'selective'`; characters and animals: `'ink'`; ground/decals: none.
- Item icons: `itemIcon(shape, { c, c2, c3 })` from `src/gfx/icons.js` returns a sprite name (35 shapes:
  fish bug shell gem root leafy fruit berry flower mushroom seed bowl plate cup bottle bread sweet onigiri book letter
  paper star key tool shirt hat toy furniture plant rock coin ticket stamp feather box). `defineIconShape` adds more.
- Characters: sheets are 11 columns x 3 rows (down/up/side facing right): idle 0-3, blink 4, walk 5-10. Misa's is
  40x48 per frame; cast sheets are 48x64 (`assets/cast/<id>.png`) and portraits 64x64 (`assets/cast/<id>_portraits.png`,
  rows neutral/happy/surprised/sad, columns mouth closed/open x blink off/on). Missing sheets fall back to a palette swap
  of Misa using `npc.look = { hair, top, bottom, skin, eyes, accent, shoe }`.

## NPCs (src/world/npc.js, src/systems/social.js)

```js
register('npc', 'kai', {
  name: 'Kai', role: 'Classmate, soccer club', bio: '...', birthday: { season: 'spring', day: 18 },
  look: { hair: '#2a2a3a', top: '#3d5a8c', bottom: '#4a4a5a', skin: '#f2c9a4', eyes: '#4a2414' },
  schedule: [   // first group whose `when` passes is today's plan; within it the latest stop with at <= now
    { when: 'weather:rain|storm', stops: [{ at: '07:00', map: 'kai_home', spot: 'bed' }] },
    { when: 'school', stops: [{ at: '08:10', map: 'classroom', spot: 'desk_kai', dir: 'up' }, { at: '15:40', map: 'school_grounds', spot: 'goal' }, { at: '18:30', map: null }] },
    { stops: [{ at: '09:00', map: 'park', spot: 'lawn' }, { at: '17:00', map: null }] },   // map: null = away/home (unseen)
  ],
  gifts: { love: ['...'], like: [...], dislike: [...], hate: [...], likeTags: ['sweet'] },
  lines: { default: ['...'], morning: [...], rain: [...], spring: [...], weekend: [...], h2: [...], h6: [...],
           at_park: [...], firstMeet: ['happy|Hey! You must be the new girl.'], birthday: [...], gift_love: [...] },
  events: [{ id: 'kai_h2', hearts: 2, map: 'school_grounds', when: 'time>=15:30', script: (game) => [...] }],
});
```
Lines may start with `mood|` (e.g. `'happy|...'`). `{season}`, `{weekday}`, `{day}` are substituted.

## Testing

Tests are generic: `tests/content.test.mjs` (validator + feature uniqueness + font characters),
`tests/scripts.test.mjs` (every script/talkHook/heart event runs to completion on every choice branch),
`tests/minigames.test.mjs` (every minigame builds and survives play; give yours a `bot` so it's played to the end),
`tests/engine.test.mjs`, `tests/art.test.mjs` (sprites render; outlined art leaves room for its outline).
You may add `tests/<area>.test.mjs` with 1-3 focused tests for your area's logic. Keep it lean.
