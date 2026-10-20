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
