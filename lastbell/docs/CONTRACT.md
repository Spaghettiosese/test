# LAST BELL — shared contract (all agents read this first)

**LAST BELL** is an original isometric, painterly, dialogue-and-skill-check RPG in the *genre* of Disco Elysium.
Do NOT reuse any text, names, characters or lore from Disco Elysium. Mechanics/genre conventions are fine; every
line of writing, name, and asset must be original. Tone: dry political satire, melancholy, absurd bureaucratic humour,
real feeling underneath, internal "voices" with distinct personalities that argue with the player.

## Setting (fiction)
- Country: **the Greater Union of Karsovia** ("the Union"), a vast state dictatorship. Ruler: **the Warden** (never seen
  in person; his face is on every wall; slogans: "THE WARDEN HEARS", "ONE BELL, ONE UNION").
- City: **Tarnov-on-the-Grey**, District 9. Setting: **School No. 9 — "Warden Aurel Memorial Gymnasium"** (grey concrete,
  brick, green-painted corridors, hand-lettered propaganda, cheap checkered floors, mildew, loudspeakers on poles).
- **The Bell**: the nightly "Harmony Broadcast" played through school/district loudspeakers (a pealing tone + choral
  anthem). TRUTH: it carries a suppression pattern that blurs memory of the preceding hours; citizens call the
  resulting fog "Static". Everyone is mildly Static. Nobody says why.
- Protagonist: a **17-year-old student** (name chosen by player, default "Sel Voran"; narration addresses them as "you";
  engine substitutes `{name}`). Wakes up on the stage of the shuttered Old Theatre, uniform torn, head ringing, with NO memory
  of last night. Mandatory "Orthodoxy Exam" at 17:00 in the Principal's office; **curfew bell at 21:00**.
- Case: **Youth Commissar Ostrov Dane** is found hanged from the basketball hoop in the gym, the Warden's portrait beneath
  him torn open. Official line (needed by evening): "suicide of an unstable man". You're assigned to "assist" by
  **Lieutenant Vasha Kell** (gym teacher, ex-army, tired, kind-ish, shadows you; secretly files reports on you).

## THE TRUTH (writers: honour this, reveal it in layers, allow unreliable voices & red herrings)
1. Ostrov discovered the Bell is a memory-suppressor ("the Static") and compiled **the Ledger** (nightly broadcast logs +
   suppression schedule from the district relay). He chose YOU (a nobody, Static-resistant because you have a persistent
   tinnitus/"ringing" from childhood) as courier to the Undercurrent (student/teacher underground in the boiler room).
2. Ostrov was killed in the gym by **Rhea Vantage**, Youth Vanguard enforcer, on orders relayed by **Principal Odalys Marr**
   from the District Warden's office; staged as suicide. Rhea tore the portrait because behind it is a **microphone**: the
   portraits listen.  (Ostrov also tore it first, to prove it; his fingerprints/chalk are on it.)
3. You carried the Ledger last night, were caught in the Assembly Bell broadcast, and Static wiped you. Before it did,
   YOU hid the Ledger in a dead drop and left cryptic **Notes from Yesterday-You** in your own handwriting (3 notes).
   The dead drop: inside the **hollow plinth of the Warden statue in the Courtyard**; needs `chalk_stub` mark clue + `boiler_key`? (no — needs the three notes).
4. Vasha Kell was also Static-wiped and is conflicted; her notebook (report on you) can be read late.
5. Janitor **Osk** saw you (not the killing) leaving the gym at 02:10 — he is the easy scapegoat.
6. Cook **Bronka** feeds the Undercurrent with bread-note messages. **Ilsabet Orrin** (wheelchair, pirate radio kid) can
   decode the Bell's carrier tone and prove the Static. **Choirmaster Fenwick Alder** rehearses the Anthem on the Ration
   Hall stage; the stage microphone is wired to the school PA (the endgame broadcast).
7. Boiler room contact: **"Mother Anka"** (Anka Brodsky, retired chemistry teacher, Undercurrent cell leader).

## ENDINGS (ids)
- `end_good_student` — frame Osk, take the Vanguard badge. (Surveillance low, ideology vanguard)
- `end_ledger` — hand the Ledger to Mother Anka. Quiet revolution seed.
- `end_static` — broadcast the Ledger from the Ration Hall stage over the school PA. Loud, costly, hopeful.
- `end_quiet` — go home, drink the ration-tea, choose to forget. (leave via the school gate exit after 17:00)
- `end_arrested` — Surveillance reaches 100.
- `end_curfew` — time hits 21:00 unresolved: the Bell rings, Static takes you again, you wake on the stage again.

## World coordinates / locations
See `data/world.js` (authoritative for locations, props, npcs, hotspots, exits). Location ids:
`theatre`, `gym`, `canteen`, `courtyard`, `office`, `boiler`.
NPC ids: `vasha`, `bronka`, `ilsabet`, `fenwick`, `osk`, `marr`, `rhea`, `lemmy`, `anka`, `ostrov` (the corpse),
`portrait` (the torn portrait object-voice), `statue`, `loudspeaker`, `stage_mic`.

## Engine data format (plain scripts, NO modules, so index.html works from file://)
Every data file is an IIFE: `(function(){ const GD = (window.GD = window.GD || {}); GD.thing = {...}; })();`
Files must also load under node via `vm` (no DOM use at load time). Strings use "double quotes" or backticks.
`{name}` in any text is replaced by the player's name.

### Skills (24, ids fixed)
INTELLECT: `dialectics` (cold logic), `rote` (memorised facts/slogans), `deduction` (physical-clue reasoning), `rhetoric`
 (arguing/persuading), `doublethink` (the state's own voice in your head: fluent in what you're supposed to believe), `archive`
 (the pedantic librarian-brain: dates, names, forms, regulations).
PSYCHE: `empathy`, `volition` (hold yourself together), `authority` (bearing/commanding), `instinct` (hunches, danger),
 `charm`, `solidarity` (the warm collective murmur of the many; speaks as "we").
PHYSIQUE: `stamina`, `grit` (pain/fear tolerance), `brawn`, `appetite` (cravings: tea, tobacco, sweet rolls, sugar, scraps),
 `adrenaline` (impulse, rage, rush), `the_grey` (the city/concrete/weather itself speaks to you).
MOTORICS: `aim` (hand-eye/throwing/precision), `reflex`, `composure` (poker face, posture), `slip` (stealth/lockpicking-lite),
 `sleight` (pockets, hands, forgery), `senses` (notice details, smell/sound).
Attribute ids: `intellect`, `psyche`, `physique`, `motorics`. Skill level = attribute + learned + modifiers (typical 1–8, cap 10).

### Checks
Roll 2d6 + skill level (+ situational modifiers) vs difficulty. 2d6=2 auto-fail, =12 auto-success.
Difficulty words → numbers: trivial 6, easy 8, medium 10, challenging 12, formidable 14, legendary 16.
- **Red check**: one attempt only, ever (`id` unique). **White check**: may be retried only after the relevant skill goes up
  (engine handles via `white:true`).
- **Passive check**: an `interjections` entry whose `skill` level >= `min` fires automatically (no roll).

### Dialogue file format (`GD.dialogues[dialogueId]`) — written by story agents
```js
GD.dialogues.vasha = {
  title: "Lieutenant Kell",                 // header text
  start: "hub",                             // node id, or {cond:"...", node:"x"} array of alternatives (first true wins)
  nodes: {
    hub: {
      speaker: "vasha",                     // npc id | "narrator" | "you" | a skill id (inner voice) | "portrait" etc
      text: "...",                          // may contain {name}; keep single paragraphs; \n\n allowed
      onEnter: [ /* effects, run once on showing */ ],
      interjections: [                      // skill voices that chime in, shown before choices
        { skill:"empathy", min:4, text:"...", effects:[...], once:true /* optional */, cond:"..." /* optional */ }
      ],
      choices: [
        { text:"...", goto:"nodeId", cond:"flag.met_vasha && !flag.x", effects:[...], once:true },
        { text:"[Deduction — Challenging] ...", check:{ skill:"deduction", diff:12, id:"vasha_boots", white:true,
            pass:"nodeP", fail:"nodeF", passEffects:[...], failEffects:[...] } },
        { text:"Leave.", end:true }         // end:true closes dialogue (or goto:null)
      ]
    }
  }
}
```
Rules: every `goto/pass/fail/start` must reference an existing node. A node with no `choices` auto-shows a single
"Continue" that ends the dialogue. Check `id`s must be globally unique across all files (`<dialogue>_<what>`). Choice text for
checks is prefixed in the UI automatically, so DON'T write "[Skill — Diff]" yourself; just write the line. (Engine renders
the skill/difficulty/%.) Speaker for inner-voice lines should be the skill id so the UI colours them.
Node speaker can also be an npc id used by multiple nodes. Use `speaker:"narrator"` for scene description.
Use `\n\n` for paragraph breaks. Target 40–120 words per node; voices should be funny/sharp/strange.

### Conditions (`cond` strings) are JS expressions with these in scope
`flag` (object of booleans/numbers/strings; unset = undefined), `has('item_id')`, `skill('skill_id')` (effective level),
`attr('attribute_id')`, `ideo.vanguard`, `ideo.undercurrent`, `ideo.quiet` (numbers), `surv` (0–100), `hp`, `morale` (0–100... see below),
`time` (minutes since midnight; 7:30 = 450; 17:00 = 1020; 21:00 = 1260), `task('task_id')` ('none'|'active'|'done'|'failed'),
`thought('th_id')` ('none'|'researching'|'internalized'), `visited('loc_id')`, `talked('dialogue_id')` (count).

### Effects (array items, objects)
`{set:"flag_name", val:true}` · `{add:"flag_name", n:1}` (numeric flag) · `{give:"item_id"}` · `{take:"item_id"}` ·
`{xp:n}` (skill-point pool) · `{surv:n}` (±Surveillance) · `{hp:n}` (±Health/Body) · `{morale:n}` (±Morale/Nerve) ·
`{time:minutes}` · `{thought:"th_id"}` (discover; player may then internalize it) · `{task:"task_id", state:"active"|"done"|"failed"}` ·
`{note:"task_id", text:"journal line"}` · `{ideo:"vanguard"|"undercurrent"|"quiet", n:1}` · `{skillUp:"skill_id", n:1}` (rare reward) ·
`{goto:"loc_id", x:.., y:..}` (move player) · `{ending:"end_id"}` · `{toast:"short pop-up text"}` · `{sfx:"bell|paper|door|static|hit|chime"}`.
Health ("Body") and Morale ("Nerve") are 0–10 meters. Surveillance 0–100: 100 = arrest ending. Typical rewards: xp 1–3 per good
beat, surv +3..+15 for risky acts (+25 for open defiance), −3..−8 for grovelling/compliance.

### Items (ids fixed; the systems agent defines their data in `data/items.js`)
`boiler_key`, `chalk_stub`, `torn_page`, `ration_coupon`, `cigarettes`, `ledger`, `rhea_pin`, `note_yesterday_1`,
`note_yesterday_2`, `note_yesterday_3`, `radio_tube`, `bread_note`, `vanguard_armband`, `pocket_mirror`, `warden_badge`,
`sweet_roll`, `ration_tea`, `exam_booklet`, `vasha_notebook`, `staged_rope`, `mic_cable`, `school_cap`, `bent_spoon`.
Items may carry skill modifiers (`mods:{skill:+1}`) and may be `usable` (heal, etc.).

### Tasks (ids fixed; the systems agent defines titles/descriptions in `data/tasks.js`)
`task_case` (Who hanged the Commissar?), `task_yesterday` (What did I do last night?), `task_ledger` (Find the Ledger),
`task_rhea` (The Enforcer), `task_exam` (The Orthodoxy Exam, 17:00), `task_choir` (Fenwick's Anthem), `task_radio` (Ilsabet's
Static), `task_coupons` (Bronka's missing coupons), `task_osk` (The Janitor's Alibi), `task_anka` (Mother Anka), `task_broadcast` (Ring the Bell).

### Thoughts (Thought Cabinet; ids fixed; systems agent writes data/thoughts.js)
`th_quiet_hands`, `th_good_citizen`, `th_unsanctioned`, `th_ghost_of_yesterday`, `th_bell_tolls`, `th_portrait_eyes`,
`th_ration_math`, `th_marching_feet`, `th_chalk_dust`, `th_wheel_and_chair`, `th_hungry_ghost`, `th_informer_in_me`,
`th_perfect_attendance`, `th_big_sister_state`, `th_anthem_earworm`, `th_collective_pulse`, `th_paper_heart`, `th_closed_window`.

### Plot flags (use exactly these names; add your own with a `<npc>_` prefix)
`met_vasha`, `body_examined`, `portrait_examined`, `clue_boots`, `clue_chalk`, `clue_rope` (rope was staged), `clue_mic`
(microphone behind portrait), `read_note_1`, `read_note_2`, `read_note_3`, `knows_static` (learned the Bell is a suppressor),
`knows_rhea` (suspect Rhea), `rhea_confronted`, `rhea_exposed`, `osk_seen_you`, `osk_scapegoat` (you framed him),
`ilsabet_decoded`, `bronka_trust`, `marr_audience`, `boiler_unlocked`, `found_ledger`, `ledger_with_anka`, `exam_done`,
`exam_passed`, `broadcast_ready` (mic cable + decoded tone), `fenwick_choir_ready`, `vasha_ally`, `vasha_report_read`.

## Art interface (js/art.js, written by the art agent; `window.Art`)
- `Art.TW=64, Art.TH=32` iso tile (2:1). `Art.project(loc,x,y)` → {sx,sy} (world px, tile centre, before camera).
  `Art.unproject(loc,sx,sy)` → {x,y} fractional tile coords. `Art.worldSize(loc)` → {w,h} px of the baked scene.
- `Art.getRenderer(loc)` → object `{ draw(ctx, view, dyn) }` where `view = {camX,camY,zoom,w,h}` (canvas px) and
  `dyn = { t:ms, hoverId:string|null, player:{x,y,facing:'n|e|s|w'|…, walking:bool, look}, npcs:[{id,x,y,facing,look,pose,highlight}],
  props visible filtered by engine (`loc.props` already filtered), objects:[{id,x,y,highlight}] }`.
  It paints the whole scene: baked painterly background (cache offscreen!), depth-sorted props/sprites, lighting, hover
  outlines. Hovered/highlighted interactables get a **thin bright green outline** (like Disco Elysium's selection) and
  a soft white ring on the player's feet.
- `Art.drawPortrait(canvas, look, opts)` → procedural **pixel-art** portrait (internal 64×64 upscaled nearest-neighbour,
  limited palette, dithering) with painted circular badge border. `opts:{mood:'neutral|angry|sad|smile|shock', tint, bg}`.
  (The user mentioned a "Moonkai pixel engine" for portraits; it is not available in this sandbox, so Art ships its own
  procedural pixel portrait generator with the same `drawPortrait` entry point — a swap-in seam for Moonkai output.)
- `Art.drawTitle(ctx,w,h,t)` painted title backdrop; `Art.drawEnding(ctx,w,h,t,endingId)` painted ending tableaux.
- Look schema (NPCs and player): `{skin:'#hex', hair:'#hex', hairStyle:'short|long|bun|bald|curly|cap|bob|buzz|braid|slick',
  outfit:'uniform|coat|apron|overalls|suit|tracksuit|cardigan|labcoat|shirtsleeves', outfitColor:'#hex', accent:'#hex',
  build:'slim|avg|heavy', glasses:false, age:'teen|adult|old', pose:'stand|sit|slump|lie|hang|lean|wheelchair',
  extra:'none|mic|clipboard|broom|ladle|cigarette|armband|book|rope|megaphone'}`.
- Prop types (vocabulary art must implement): counter, table, bench, stool, plant, pillar, stage, stairs, door, window,
  lockers, hoop, desk, chair, bookshelf, boiler, pipes, statue, banner, crate, rug, lamp, chalkboard, loudspeaker, portrait,
  sack, barrel, ladder, mat, vault, mic, pennant, radiator, fence, tree, bell, sofa, curtain, cart, tray, notice.
  Each prop: `{t, x, y, w, h, v (variant 0-3), side:'l|r' for wall-mounted, walk:false, label, color}`.
- Look: **Disco-Elysium-like painted isometric**: heavy impasto brush texture, desaturated greens/teals/ochres with hot
  orange rim-light, dappled light patches on floors, grain, vignette, soft edge-blur, hand-drawn dark outlines, visible
  brushstroke noise. NOT pixel art (except portraits).

## Code conventions
No build step. Vanilla JS (ES2020), no external libs, no network. Everything works from `file://` and a static server.
Files: `index.html`, `css/style.css`, `js/engine.js` (core/state/dialogue runner), `js/ui.js`, `js/art.js`, `js/audio.js`,
`data/*.js`. Validate with `node lastbell/tools/validate.js`.

---
## ADDENDUM (authoritative; overrides anything above that conflicts)

### Dialogue ids
- Every NPC id in `data/world.js > GD.npcs` has a dialogue of the same id (`vasha`, `bronka`, …, `ostrov`).
- Every object id in `GD.locations[*].objects` has a dialogue of the same id (`t_mirror`, `g_portrait`, `statue`, …).
- Extra dialogues: `intro` (auto-plays at game start in the theatre — the waking-up scene with skill voices bickering),
  `enter_<loc>` (auto-plays on FIRST visit to each location if defined: `enter_canteen`, `enter_gym`, `enter_courtyard`,
  `enter_office`, `enter_boiler`), `boiler_door` (exit locked), `gate` (school gate exit), `accuse` (the accusation
  scene, launched from `ostrov` or `vasha`), `exam` (17:00 Orthodoxy Exam in the office), `ending_end_good_student`,
  `ending_end_ledger`, `ending_end_static`, `ending_end_quiet`, `ending_end_arrested`, `ending_end_curfew`
  (epilogue narration shown over the painted tableau when `{ending:"end_x"}` fires; they must end with no choices).
- Cross-dialogue jump: a choice may use `dialogue:"other_id"` (optionally `node:"x"`) instead of `goto`; an effect `{dialogue:"id"}` too.
- Dialogues can also use `speaker` ids for companions: `vasha` can interject mid-scene with `speaker:"vasha"`.
- Time: each dialogue visit already costs ~2 minutes automatically; use `{time:n}` for extra (e.g. searching = 10–20).
- A node's `text` may be an array of strings → engine picks one at random (for barks).

### Who writes what
- **story-a** → `data/dialogue_a.js` (`GD.dialoguesA = {...}`): `intro`, `enter_canteen`, `enter_gym`, `vasha`, `t_mirror`, `t_trunk`, `t_horn`,
  `t_poster`, `ostrov`, `g_portrait`, `g_mat`, `g_rope`, `g_lockers`, `g_bench`, `bronka`, `ilsabet`, `fenwick`, `lemmy`, `c_menu`, `c_tray`,
  `stage_mic` (the endgame broadcast scene, ending `end_static`), `c_notices`, `c_speaker`.
- **story-b** → `data/dialogue_b.js` (`GD.dialoguesB = {...}`): `enter_courtyard`, `enter_office`, `enter_boiler`, `osk`, `rhea`, `statue` (dead drop/ledger),
  `loudspeaker`, `y_bench`, `y_bell`, `gate`, `marr`, `o_desk`, `o_cabinet`, `o_window`, `anka` (ledger hand-off, `end_ledger`), `b_boiler`, `b_table`,
  `boiler_door`, `exam`, `accuse` (can end with `end_good_student`), all six `ending_*` epilogues.
- **systems** → `data/skills.js`, `data/thoughts.js`, `data/items.js`, `data/tasks.js`, `data/barks.js`, `docs/DESIGN.md`.
- **art** → `js/art.js`.
- **lead (main agent)** → `index.html`, `css/`, `js/engine.js`, `js/ui.js`, `js/audio.js`, `tools/validate.js`, README.
The engine merges `GD.dialoguesA`, `GD.dialoguesB` into `GD.dialogues`.

### Item/clue placement (so the three writers stay consistent)
note_yesterday_1 in `t_trunk`; note_yesterday_2 in `g_bench`; note_yesterday_3 in `y_bench`. `staged_rope` from `g_rope`; `torn_page` from
`g_portrait`; `chalk_stub` from `ostrov` (pocket); `rhea_pin` from `g_mat`; `pocket_mirror`,`school_cap` from `t_mirror`; `bent_spoon`
from `c_tray`; `cigarettes`,`vasha_notebook` from `vasha`; `bread_note`,`sweet_roll`,`ration_tea`,`boiler_key` from `bronka`;
`ration_coupon`,`vanguard_armband` from `lemmy`; `radio_tube` from `b_boiler`; `mic_cable` from `b_table`; `warden_badge`,`exam_booklet`
from `marr`; `ledger` from `statue` once the three notes are read (or a very hard check); Mother Anka takes the ledger (`ledger_with_anka`).
`boiler_unlocked` is set by `bronka` (after the coupon task / trust) or by a hard `slip` check on `boiler_door`.
`broadcast_ready` needs `has('mic_cable')`, `flag.ilsabet_decoded`, `has('ledger')`; `stage_mic` checks it.

### Hover/lighting data
`dyn` also contains `time` (minutes since midnight) so the art can tint the light (morning cold-gold → afternoon ochre → dusk teal/orange).
