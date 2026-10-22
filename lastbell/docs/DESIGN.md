# LAST BELL — Design Document

## Pitch
You are a 17-year-old student who wakes on the stage of a shuttered theatre in School No. 9, Tarnov-on-the-Grey, with a ringing head and no memory of last night. The Youth Commissar is hanging from the gym hoop. The Orthodoxy Exam is at 17:00. The curfew Bell rings at 21:00. You have one day, twenty-four voices in your head, and a lieutenant who files reports on you.

A single-day, isometric, painterly dialogue RPG in a drab dictatorship. Dry satire on top, real feeling underneath, and a nightly broadcast that quietly deletes your memory.

## Pillars
1. **Voices, not stats.** Each skill is a character that interrupts, bickers, flatters and lies.
2. **Thought is a resource.** Ideas cost time to think and change who you are, for better and worse.
3. **The clock is the antagonist.** 07:30 to 21:00, every conversation costs minutes.
4. **Everyone is a little complicit.** There are no clean hands, including yours.
5. **Painted, tactile, grey.** Impasto brushwork, rim-light, a single day of weather.

## How it mirrors the genre formula
- **Skills as voices.** 24 skills in 4 attributes (Intellect, Psyche, Physique, Motorics). Passive checks interject unprompted; active checks are rolled.
- **Thought Cabinet.** 18 thoughts, 3 slots at start, 5 max. Each takes 30 to 240 game minutes to internalize and gives a boon plus a drawback.
- **Checks.** 2d6 + skill level vs a difficulty word. Red checks once only; white checks retry after the skill rises.
- **Day-time pressure.** Dialogue costs minutes; searching costs more; thoughts cost the most.
- **Painterly isometric look.** Hand-painted rooms, hot orange rim-light, dusk teal.
- **Failure is content.** Failed checks branch the story, not end it.

## Our own spin

### (a) Surveillance and the informer mechanic
Surveillance (0 to 100) rises when you act suspiciously: open defiance +25, risky acts +3 to +15, grovelling lowers it by 3 to 8. At 100 you are arrested (`end_arrested`). Two voices can **report you**: `doublethink` (the State's own fluency, it files things in your own head's name) and `solidarity` (the warm "we" overhears itself). When either rises above 5, they may interject with a **report line** that carries a Surveillance penalty, usually after you commit a "dangerous" act in front of an audience. The Thought `th_informer_in_me` lets you learn to lie to your own head. Tiers: Unnoticed, On a list, Watched, Flagged, Wanted, Arrested.

### (b) Yesterday-You
Three notes in your own handwriting (`note_yesterday_1..3`) lie in the theatre trunk, the gym bench and the courtyard bench. Read in order, they point to the hollow plinth of the Warden's Father statue, where the Ledger is hidden. Memory mystery: you are solving a case against yourself. `th_ghost_of_yesterday` internalizes the previous you as a lodger.

### (c) The Bell/Static loop
At 21:00 the Bell rings and Static takes you. If nothing is resolved, `end_curfew`: you wake on the stage again. The loop is a soft ending, not a game over, and a short fragment of a flag (`knows_static`, notes read) can echo through on the next wake in a future New Game+.

### (d) The Orthodoxy Exam
Mandatory at 17:00, in the Principal's office. Forty pages of questions you must answer correctly before they are asked. A skill gauntlet in which `rote`, `doublethink`, `archive`, `rhetoric` and `composure` argue. Passing yields `exam_passed`; failing raises Surveillance; skipping it is its own scene. Unlocks the 4th thought slot.

### (e) The Notebook of Unsanctioned Thoughts
A quiet progression layer. Every unsanctioned thought (`th_unsanctioned`, `th_chalk_dust`, `th_paper_heart`) writes a line into a secret notebook the player can read, shown in the UI as a single hand-lettered page. The notebook is the player's journal of heresies, and a dangerous object: carrying it with high Surveillance risks searches.

### (f) The broadcast endgame
Requires `has('mic_cable')`, `flag.ilsabet_decoded`, `has('ledger')`. At the Ration Hall stage microphone (wired to the school PA), the player reads the truth over every loudspeaker in District 9. `end_static`: loud, costly, hopeful.

### (g) Ration coupons as currency
The Union pays in coupons stamped with a weekday. Bronka accepts them, Lemmy skims them, the Vanguard hoards them, and Fenwick pretends he has none. Coupons buy soup, favours, silence and the occasional alibi. They also appear as a Surveillance trigger: too many raises suspicion.

### (h) Vasha, the companion who files reports
Lt. Vasha Kell shadows you, interjects mid-scene and is kind-ish. She keeps a notebook (`vasha_notebook`) logging everything you do. You can read it late (`vasha_report_read`), turn her into an ally (`vasha_ally`) or learn she was Static-wiped too. Her loyalty is the game's moral hinge.

## The day at a glance
| Time | Beat |
|---|---|
| 07:30 | Wake in the Old Theatre |
| 08:00 to 12:00 | Gym, Ration Hall, first clues, thoughts |
| 12:00 to 16:00 | Courtyard, Rhea, Osk, boiler room |
| 17:00 | Orthodoxy Exam |
| 18:00 to 20:30 | Accusation, ledger, broadcast, gate |
| 21:00 | The Bell |

## Check balance
Chance of success on 2d6 + level vs difficulty (natural 2 fails, natural 12 passes):

| Level | Trivial 6 | Easy 8 | Medium 10 | Challenging 12 | Formidable 14 | Legendary 16 |
|---|---|---|---|---|---|---|
| 2 | 92% | 72% | 42% | 17% | 3% | 3% |
| 3 | 97% | 83% | 58% | 28% | 8% | 3% |
| 4 | 97% | 92% | 72% | 42% | 17% | 3% |
| 5 | 97% | 97% | 83% | 58% | 28% | 8% |
| 6 | 97% | 97% | 92% | 72% | 42% | 17% |
| 7 | 97% | 97% | 97% | 83% | 58% | 28% |
| 8 | 97% | 97% | 97% | 92% | 72% | 42% |
| 9 | 97% | 97% | 97% | 97% | 83% | 58% |
| 10 | 97% | 97% | 97% | 97% | 92% | 72% |

Design target: an average starting skill (3 to 5) should pass Easy/Medium most of the time and have a one-in-four to one-in-three chance at Challenging. Formidable and Legendary are for specialists, thoughts, apparel and luck. Signature skills start at attribute + 2.

Skill level = attribute (1 to 5) + learned + item/thought mods; cap 10. Learning cost: 2, 3, 5, 6, 8, 9, 11, 12, 14, 15 xp per step.

## Character creation
Five archetypes with 12 attribute points (1 to 5 each) and a signature skill at +2: **The Model Pupil** (Archive), **The Back-Row Cynic** (Dialectics, default), **The Team Captain** (Authority), **The Pickpocket Prodigy** (Sleight), **The Quiet Poet** (Empathy). Or build a **Custom Student** with 12 points and no signature.

## Ending matrix
| Ending | Trigger | Surv | Ideology lean | Tone |
|---|---|---|---|---|
| `end_good_student` | Frame Osk, take the Vanguard badge | low | Vanguard | Comfortable, damning |
| `end_ledger` | Give the Ledger to Mother Anka | medium | Undercurrent | Patient, quiet revolution |
| `end_static` | Broadcast from the stage mic | any (<100) | Undercurrent | Loud, costly, hopeful |
| `end_quiet` | Leave via gate after 17:00, drink the tea | low | Quiet | Warm, hollow |
| `end_arrested` | Surveillance hits 100 | 100 | any | Abrupt |
| `end_curfew` | 21:00 unresolved | any | any | Loop, wake again |

## Demo scope (content summary)
- 6 locations, 10 NPCs plus object-voices (portrait, statue, loudspeaker, stage mic).
- 24 skills, 4 attributes, 5 archetypes plus custom; about 216 ambient barks plus situational pools.
- 23 items (8 clues, 3 consumables, 5 apparel and trinkets, keys and junk).
- 11 tasks (6 main, 5 side).
- 18 thoughts with trade-offs, 5 slots max.
- 3 ideologies with 4 tiers each.
- 6 endings, each with a painted tableau.
- One day, 07:30 to 21:00.

## Post-demo roadmap (ranked by value / cost)
1. **Day 2 and Day 3 expansion.** Highest value; carry-over of flags, notebook, thoughts. Medium to high cost.
2. **Accessibility options.** Text size, dyslexia-friendly font, colour-blind skill icons (the 1-2 letter marks already exist), reduced flash, skip-time toggle. High value, low cost.
3. **Localization hooks.** All text already in `GD.*` data with `{name}` tokens; add a string table and locale switch. High value, low to medium cost.
4. **Dorm-room hub.** A safe room with a bed, a diary, a mirror, thought rest. High value, medium cost.
5. **Save slots and New Game+ echoes.** Retain a piece of the previous loop. High value, low cost.
6. **Pirate radio minigame.** Tune Ilsabet's receiver to decode the Bell. Medium value, medium cost.
7. **Black-market trading.** Coupons, cigarettes, bread-notes. Medium value, medium cost.
8. **Student council politics.** A vote that shifts Vanguard power. Medium value, high cost.
9. **Weather system.** Rain, fog, heat; affects `the_grey` and light. Medium value, low cost.
10. **Companion depth.** Vasha side arcs, Ilsabet as second follower. Medium value, medium cost.
11. **Voice acting and ambient audio pass.** Synthesised voices per skill. Medium value, high cost.
12. **Skill-specific minigames.** A tiny dice-and-dialogue puzzle per attribute. Low to medium value, high cost.
13. **Mod/data pack support.** The data-driven design already allows it. Low value, low cost.
14. **Achievements and diary exports.** Share your journal as an image. Low value, low cost.

## Technical notes
All content is plain-script data in `data/*.js` attaching to `window.GD`, loadable under node via `vm`. The rules (dice, costs, tiers) live in `GD.rules`, so UI and docs share one source of truth. New content needs only new ids.

---

# Acts II & III (the three-day expansion)

## Structure
The game is now **three days**: Tuesday (the original day, 07:30 to 21:00), Wednesday and Thursday (both 07:00 to 21:00, beginning in the dormitory). The Bell still rings at 21:00 each night, but on Days 1 and 2 it is a **night**, not an ending. On Day 3, 21:00 unresolved is the real `end_curfew`.

| Day | Theme | New places | Main threads |
|---|---|---|---|
| 1 Tuesday | Who killed the Commissar? | theatre, gym, canteen, courtyard, office, boiler | the case, the notes, the Ledger, the exam |
| 2 Wednesday | The Inspector arrives | dorm, library, Karsov Avenue, Relay No. 4 | Voss, the Relay, the tape, the counter-tone, the stacks, the queue |
| 3 Thursday | The Jubilee | the Bell Tower | preparation, allies paying off, finale at 19:30, Grand Harmony at 20:00 |

## Verdict system (Days 1 and 2)
Firing an ending effect while `day < 3` is a **verdict**: the engine sets `verdict_good_student | verdict_ledger | verdict_static | verdict_quiet`, plays `daybreak_<name>` (Day 1) or `daybreak_<name>_d2` (Day 2), and starts the next day. Verdicts persist as flags and every returning NPC reacts to them. Playing Day 1 "wrong" is not a lost run; it is a different Wednesday. `end_arrested` is always real. Reaching 21:00 plays `daybreak_curfew` / `daybreak_curfew_d2`.

## Night and the Static hangover
The Bell wipes part of the night. On waking the engine applies: Surveillance -15, Body and Nerve +4, and **-1 to one random skill for the morning** (the hangover), unless `th_ghost_of_yesterday` is internalized. The Thought Cabinet gets a 6th slot on Day 3 (free, or 8 points).

## The eleven endings
Existing six: `end_good_student`, `end_ledger`, `end_static`, `end_quiet`, `end_arrested`, `end_curfew`. New five. All are real only on Day 3 except `end_arrested`.

| Ending | Reached by (flags and choices) |
|---|---|
| `end_wake` (best) | `counter_tone_built` (Ilsabet + Gregor + tube/cable/cylinder) and the tone replaces Grand Harmony: `tape_swapped` at the Relay, or `choir_wake_arrangement` + `choir_performed`, or played from the tower. More allies (Tomas, Hob, Fenwick, Vasha) make the check easier. |
| `end_static` | Broadcast the Ledger (and `relay_log` if held) from the Ration Hall mic or tower array. Loud and costly. |
| `end_ledger` | Ledger handed to Anka (`cell_active`) and the finale refused. Quiet revolution. |
| `end_good_student` | Osk framed (`osk_scapegoat`) and the badge taken, with Voss's case closed in the school's favour. |
| `end_wardens_eye` | Accept Voss's offer (`voss_invited`, `voss_ally`) at the finale, give him the Ledger and tape. |
| `end_martyr` | Take the blame for everything at the Jubilee, so Anka, Wren and the rest are overlooked. Strong when `cell_active`, `wren_ally`, `chosen family` thoughts are in play. |
| `end_silenced` | Sabotage the Relay (`tomas_ally` or `brune_down` helps, generator and aerial deck) or ring the Great Bell with no tone: blackout, no Harmony. |
| `end_exodus` | Tram token and `nadia_ally`; leave with the Undercurrent kids on the night tram. |
| `end_quiet` | Go home and drink the tea (school gate Days 1 to 2; the tram stop with no ticket on Day 3). |
| `end_arrested` | Surveillance 100 at any time. |
| `end_curfew` | Day 3 reaches 21:00 with nothing resolved. |

## Quest map
Main: `task_case`, `task_yesterday`, `task_ledger`, `task_exam` (Day 1) then `task_voss`, `task_relay`, `task_tape`, `task_counter`, `task_vasha`, `task_rhea2`, `task_jubilee`, `task_hob`.
Side: `task_stacks`, `task_matron`, `task_queue`, `task_wren`, `task_corvin`, `task_marr`, `task_exodus`, `task_dov`, `task_osk2`, `task_choir2`, `task_lemmy`, plus the Day-1 side tasks (choir, radio, coupons, Osk, Anka).
Dependencies: counter-tone needs radio_tube (boiler), mic_cable (boiler table), a cylinder blank (Dov, Gregor or the Relay), Gregor's bench (Day 2 street) and Ilsabet's decoding. Tower needs the key (Library, Ysolde or Quill, or Osk's keys). Relay access: forged pass (Dov/Nadia), Tomas, a hard slip check or Voss's invitation. `data/rules_ext.js` closes most tasks automatically from flags, with toasts.

## Pacing, honestly
- Day 1: about 2 to 3 hours for a thorough player (it was designed as a 1.5 to 2 hour day).
- Day 2: about 2.5 to 3.5 hours (nine locations to cross, three set-pieces: dorm inspection, queue, Relay).
- Day 3: about 1.5 to 2.5 hours, including a 45 to 60 minute finale.
- A full completionist run is realistically **6 to 8 hours**; a focused first run is nearer 4.5 to 6. A fast replay for a different ending is about 1.5 to 2 hours if you know the route. The 10-hour end of the target is only reachable if you read everything and fail some white checks. We would rather be honest than pad it.

## Balance note: XP economy
`xpPerPoint` is 6 (one skill point per 6 xp). A typical beat is 1 to 3 xp, a hard check pass 2 to 3, a task completion 2 to 5 (see `rules_ext.js`).
Rough budget per day for a thorough player: **about 15 to 20 skill points on Day 1 (original content), and 12 to 18 each on Days 2 and 3**, i.e. roughly 70 to 120 xp a day (the Day-1 figure is an estimate from the existing `xp` effects, which sum to about 440 xp if every beat were taken; no player sees them all). Spending rises: the cost per skill step is 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, so ~15 points buys about 3 steps in a specialist skill. Over three days a thorough player banks roughly 40 to 55 points: enough to push four or five skills up 3 to 4 levels each, on top of thought mods. Treat these figures as estimates until playtested. The two sources that can inflate this are repeated white-check retries (which require skill-ups, so self-limiting) and thought rewards (+2 to +4 xp each, 20 new thoughts). Thought slots (3, 4, 5, 6) are the real limiter. If playtests show runaway skills, cut `{xp}` on task completions in `rules_ext.js` first.
The night hangover (-1 random skill) is a deliberately small tax: it shifts a few Medium checks to Challenging for the morning and gives the Ghost thought a reason to exist.
