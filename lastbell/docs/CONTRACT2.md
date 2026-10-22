# LAST BELL — CONTRACT 2: Acts II & III (READ CONTRACT.md FIRST, then this; this overrides it where they conflict)

The demo expands from one day to **three days** (target: 6–10 hours of play). Day 1 (Tuesday) already exists in full.
New content must be **original, high-quality, funny/sad/political**, with distinct voices for all 24 skills, real branching,
checks with consequences, and NO filler. Never reuse Disco Elysium text/names.

## Structure
- `day` (1..3) is in cond scope: `day >= 2`. Days 2 and 3 begin at 07:00 in the **dormitory** (`dorm`). Curfew 21:00 each day.
- **Verdicts (Day 1 and 2):** an `{ending:"end_good_student"|"end_ledger"|"end_static"|"end_quiet"}` effect fired while `day < 3`
  is NOT an ending: the engine sets `flag.verdict_<name>` (`verdict_good_student`, `verdict_ledger`, `verdict_static`,
  `verdict_quiet`), plays dialogue `daybreak_<name>` (Day 1) or `daybreak_<name>_d2` (Day 2) and starts the next day.
  Reaching 21:00 plays `daybreak_curfew` (day 1) / `daybreak_curfew_d2` (day 2) then the next day. On Day 3 all endings are real.
  `end_arrested` (Watched 100) is always real. On Day 3, 21:00 unresolved = real `end_curfew`.
  A `daybreak_*` scene is a short night scene (100–400 words, 2–5 nodes) played in the DORM or wherever the verdict leaves you,
  which states the consequences, and ends with NO choices. Effects in them (set flags, change items, ideo, surv) are encouraged.
  Verdict state persists as flags; every returning NPC's Day 2/3 dialogue must react to the verdicts the player earned.
- **Night/Static hangover (engine):** the Bell wipes some of the night; engine gives −1 to one random skill for the morning
  unless `thought('th_ghost_of_yesterday')=='internalized'`. Surveillance −15, Body/Nerve +4 on waking.
- **Day variants:** engine uses dialogue id `<id>_d2` / `<id>_d3` when it exists for the current day (else the base `<id>`).
  Day-1 dialogues stay untouched; new day variants are written as NEW dialogue ids. Brand-new NPCs/objects use base id + variants.
- NPC schedules, hideIf and positions: see `data/world_ext.js` (authoritative). New locations: `dorm`, `library`, `street`,
  `relay`, `tower`. Courtyard gains exits to dorm/library, and to `street` from day 2. Library has a locked stair to the tower.
- Auto scenes: `enter_<loc>` first visit (new locs: dorm, library, street, relay, tower); `enter_day2`, `enter_day3` auto-play
  at the start of the day in the dorm (before free play). `jubilee_call` auto-plays on Day 3 at 19:30 (1170) and opens the finale.
- Locked exits: `tower_door` (tower_open not set), `relay_door` (relay_access not set).

## ACT II/III STORY BIBLE (consistent truth)
- The Bell originates at **District Relay No. 4** on Karsov Avenue, operated by the **Ministry of Quiet Hours** (a bureau of the
  Warden's Chancellery). Every night it broadcasts "Harmony" (nightly forgetting of 'inconvenient hours'); schools get
  extra "Pedagogic Harmony". On **Thursday 20:00 (Day 3)** the Warden's **Jubilee** will transmit **Grand Harmony** on a master tape:
  the whole district forgets the last 72 hours (Ostrov, the Undercurrent, the Ledger, you), so the "official record" can start clean.
- **Inspector Hale Voss** (State Inspectorate) arrives Day 2 to "close the Ostrov case". Charming, dry, tired, likes you. TRUTH: he is
  the Ministry's field officer ("Quiet Officer") who runs the Static in District 9, and he himself was once wiped (he lost a
  daughter's memory, or she lost his — keep it ambiguous and moving). His goal: get the Ledger, quietly dissolve the Undercurrent,
  offer you a place as a Quiet Officer trainee. He can be allied, outwitted, exposed, or turned (genuinely torn).
- **Rhea Vantage** (killer of Ostrov, true believer): Day 2–3 gives backstory (orphan of the Vanguard Homes), can be exposed,
  turned (`rhea_turned`), or allied. **Principal Marr**: managed by the Ministry too; reluctant, can be turned (`marr_turned`).
- **Vasha Kell**: her notebook reports on you to Voss; she wavers; can confess (`vasha_confession`), burn the reports
  (`vasha_report_burned`), or betray you at the finale. **Ilsabet**: builds the **counter-tone** (an anti-Static "Wake tone")
  from the Bell's carrier she decoded — needs `radio_tube`, `mic_cable`, a tape/cylinder, and Gregor's repair bench; ends as item
  `counter_tone`. **Fenwick**: the Anthem choir performs at the Jubilee; the Anthem's key can carry the counter-tone (`choir_wake_arrangement`).
  **Bronka**: bread-notes, coupons, boiler key; her son was a Vanguard cadet (Rhea's squad). **Anka**: Undercurrent cell
  (`cell_active` when you've handed her the Ledger); wants you to survive, not be a hero. **Osk**: if framed (`osk_scapegoat`) he is
  taken away (hideIf) and haunts your conscience (guilt thoughts); otherwise he becomes an ally with school keys (`osk_keys`).
- **Dormitory**: Matron Hallow Pritt (informer queen; ledger of who comes and goes: item `matron_ledger`), Dov Kessel
  (roommate, dealer: tram tokens, forged passes), Wren (first-year, courier kid, adorable and dangerous).
- **Library**: Ysolde Crane (keeper of the Forbidden Stacks, secretly Undercurrent archivist), Ambrose Quill (old historian
  exiled to the reading room, has the banned book *The Quiet Hours*: item `banned_book`), Corvin Hale (ambitious Vanguard hopeful,
  informer risk, funny pomposity). Stacks open = `library_stacks_open`; tower stair opens via `tower_open`.
- **Karsov Avenue**: Nadia Fell (tram conductor, black marketeer, ration queen: items `tram_token`, `forged_pass`,
  `black_market_ticket`; tram = exit route: `end_exodus`), Old Gregor (kiosk, radio repair bench: needed for counter-tone, `gregor_bench`),
  Inspector Voss (stands by the black car), the ration queue (ensemble scenes), loudspeaker poles, the relay gate (`relay_access`
  via forged_pass OR Tomas OR a hard slip check OR Voss's invitation `voss_invited`).
- **District Relay No. 4**: Engineer Tomas Wend (burned-out operator, sleeps in the vault, can be ally `tomas_ally` or arrested
  `tomas_arrested`), Captain Brune (guard; bribable, fightable, sneakable; `brune_down`). Set-piece infiltration (slip/composure/
  authority/deduction etc.), the **logbook** (`relay_log` item: proof), the **tape vault** (`master_tape` item = the Grand Harmony
  tape; `tape_found`; swapping it for the counter-tone = `tape_swapped`), the **aerial deck**.
- **Bell Tower** (Day 3): Hob the Bellringer (does not speak; communicates by ringing, gestures, and what the skills infer),
  the Great Bell (`w_bell`), speaker array, the view of the whole district. Finale stage.
- Side quests (dialogue-driven, checks, rewards): choir (Fenwick), radio/counter-tone (Ilsabet+Gregor), coupons (Bronka+Dov+Nadia),
  the Forbidden Stacks (Ysolde+Quill), the matron's inspection (stealth set-piece in the dorm), the ration queue riot (street),
  Wren's errands, Corvin's initiation essay, Osk's keys, Lemmy's redemption OR fall, Marr's letter.

## NEW IDS (fixed; systems agent writes their data; writers may use them)
Items: `relay_pass`, `relay_log`, `master_tape`, `counter_tone`, `inspector_card`, `black_market_ticket`, `forged_pass`,
`matron_ledger`, `banned_book`, `tram_token`, `wrench`, `osk_keys`, `choir_score`, `wren_note`, `cylinder_blank`,
`vasha_letter`, `fake_bell_schedule`, `gregor_tubes`, `thermos`, `quill_notes`.
Tasks: `task_voss` (The Inspector), `task_relay` (District Relay No. 4), `task_tape` (The Grand Harmony Tape), `task_counter`
(The Wake Tone), `task_stacks` (The Forbidden Stacks), `task_matron` (Inspection Day), `task_queue` (The Ration Queue),
`task_wren` (Wren's Errands), `task_corvin` (Corvin's Essay), `task_vasha` (Lieutenant Kell's Notebook), `task_marr` (The Principal's
Letter), `task_rhea2` (Rhea's Orphans), `task_jubilee` (The Jubilee), `task_exodus` (The Night Tram), `task_dov` (Dov's Business),
`task_osk2` (Osk's Keys), `task_hob` (The Bellringer), `task_choir2` (The Anthem Arrangement), `task_lemmy` (Lemmy's Choice).
Thoughts (new): `th_second_day`, `th_quiet_hours`, `th_inspector_charm`, `th_borrowed_memory`, `th_grand_harmony`, `th_wake_tone`,
`th_ration_riot`, `th_forbidden_page`, `th_matron_eyes`, `th_counting_footsteps`, `th_tram_wires`, `th_good_son`, `th_burned_paper`,
`th_hob_bell`, `th_weight_of_osk`, `th_loyal_rhea`, `th_double_agent`, `th_chosen_family`, `th_last_assembly`, `th_what_wakes`.
New flags (use these names exactly; invent your own with a `<npc>_` or `<scene>_` prefix): `verdict_good_student`, `verdict_ledger`,
`verdict_static`, `verdict_quiet`, `voss_met`, `voss_ally`, `voss_suspected`, `voss_exposed`, `voss_invited`, `voss_turned`, `relay_access`,
`relay_entered`, `relay_log_found`, `tape_found`, `tape_swapped`, `counter_tone_built`, `tomas_ally`, `tomas_arrested`, `nadia_ally`,
`matron_bribed`, `matron_informs`, `library_stacks_open`, `quill_book_read`, `tower_open`, `jubilee_prepared`, `finale_open`,
`rhea_turned`, `marr_turned`, `vasha_report_burned`, `vasha_confession`, `vasha_betrays`, `choir_performed`, `choir_wake_arrangement`,
`cell_active`, `osk_keys`, `brune_down`, `hob_trust`, `queue_riot`, `queue_calmed`, `wren_ally`, `corvin_ally`, `dov_ally`, `lemmy_redeemed`.
`flag.day2_*` / `flag.day3_*` for beat-specific state.

## ENDINGS (final list, 11; ids)
Existing 6: `end_good_student`, `end_ledger`, `end_static`, `end_quiet`, `end_arrested`, `end_curfew`.
New 5: `end_wake` (BEST: the counter-tone replaces Grand Harmony; the whole district wakes remembering), `end_wardens_eye` (you join
Voss as a Quiet Officer), `end_martyr` (you take the blame for everything to buy the others time), `end_silenced` (you destroy the relay: blackout,
costly and loud), `end_exodus` (you leave on the night tram with the Undercurrent kids). The finale writer (story-f) rewrites ALL 11
`ending_<id>` epilogues (multi-day aware, conditional on flags/verdicts/relationships; 250–450 words each, multi-node allowed, no choices,
ironic and moving), overriding the Day-1-only versions.

## Dialogue format additions
Same as CONTRACT.md plus: node field `voices:N` (max passive skill interjections that fire, default 2; use 3 for big scenes);
`cond` may use `day`. Effects added: `{day:"next"}` not for writers. Choice may use `dialogue:"x"`.
Write 40–120 words/node, skills in voice, sparse purposeful checks (ids globally unique: `<dialogue>_<what>`). Day-variant dialogues
must have complete hubs (reflecting verdict flags and quest state) that don't repeat Day-1 text.

## Who writes what (new files; engine merges all `GD.dialoguesC/D/E/F` over A and B)
- **story-c** → `data/dialogue_c.js` (`GD.dialoguesC`): `daybreak_good_student`, `daybreak_ledger`, `daybreak_static`, `daybreak_quiet`,
  `daybreak_curfew`, `enter_day2`, `enter_dorm`, `enter_library`, dorm+library NPCs (`matron`, `dov`, `wren`, `ysolde`, `quill`, `corvin`)
  and objects (`d_bunk`, `d_footlocker`, `d_window`, `d_hotplate`, `d_board`, `l_catalog`, `l_stacks`, `l_table`, `l_globe`), `tower_door`,
  plus Day-2 variants of set-A NPCs: `vasha_d2`, `bronka_d2`, `ilsabet_d2`, `fenwick_d2`, `lemmy_d2` including the choir, radio and
  coupon side quests, the matron's inspection set-piece, the Forbidden Stacks quest, Wren's errands, Corvin's essay, Dov's business.
- **story-d** → `data/dialogue_d.js` (`GD.dialoguesD`): `enter_street`, `enter_relay`, street+relay NPCs (`nadia`, `voss`, `gregor`, `tomas`,
  `brune`) with ALL their day content (Voss incl. `voss_d3`; others base + `_d3` only for ones who matter: write `nadia_d3`, `gregor_d3`,
  `tomas_d3`, `brune_d3`), objects (`s_posters`, `s_queue`, `s_kiosk`, `s_tram`, `s_relaygate`, `s_car`, `r_console`, `r_vault`, `r_logbook`,
  `r_generator`, `r_aerial`), `relay_door`, the infiltration set-piece, the ration queue riot, the tram/exodus offer, the Day-2 variants of
  set-B NPCs (`osk_d2`, `rhea_d2`, `marr_d2`, `anka_d2`), and the Day-2 night scenes `daybreak_good_student_d2`, `daybreak_ledger_d2`,
  `daybreak_static_d2`, `daybreak_quiet_d2`, `daybreak_curfew_d2`.
- **story-e** → `data/dialogue_e.js` (`GD.dialoguesE`): `enter_day3`, `enter_tower`, tower objects (`w_bell`, `w_ropes`, `w_array`, `w_view`),
  `hob`, `hob_d3`, and Day-3 variants of returning NPCs (`vasha_d3`, `bronka_d3`, `ilsabet_d3`, `fenwick_d3`, `lemmy_d3`, `osk_d3`, `rhea_d3`,
  `marr_d3`, `anka_d3`, `matron_d3`, `dov_d3`, `wren_d3`, `ysolde_d3`, `quill_d3`, `corvin_d3`) — every character's arc pays off on
  Day 3 depending on flags (a lot of branching; they each get 8–20 nodes, hubs with conditions).
- **story-f** → `data/dialogue_f.js` (`GD.dialoguesF`): `jubilee_call` (opens finale; sets `finale_open`), the finale scenes: a hub on the tower
  / courtyard with every route — counter-tone/tape swap, relay sabotage, broadcast the Ledger, deliver to Voss, take the blame, join Voss,
  flee on the tram — each a multi-node set-piece with checks and ally support (Vasha, Ilsabet, Anka, Tomas, Fenwick, Rhea, Osk, Wren, Nadia,
  Hob), a Voss confrontation, final choices, and all 11 `ending_<id>` epilogues overriding the old ones. Ids you may add:
  `finale_*`, `jubilee_*`. The finale must also work if the player is badly prepared (grim endings), and handle low/high Surveillance.
- **systems2** → `data/items_ext.js`, `tasks_ext.js`, `thoughts_ext.js`, `barks_ext.js` (use `GD.items = Object.assign(GD.items||{}, {...})` etc.),
  update `docs/DESIGN.md` (Acts II/III section), new ideology tier texts, new barks for the day structure & new locations.
- **art2** → extend `js/art.js` (via tools/artsrc + build-art.sh) for new locations/props/NPC looks/ending tableaux (see below).
- **lead** → engine, UI, validator, world data.

## Art additions (art2)
New floors: `carpet`, `asphalt`, `metal` (plus existing). Wall styles: `tiled`, `corrugated` (plus existing). Moods: `lamp` (warm
yellow lamp-lit), `neon` (dusk street, cold neon/orange sodium), `storm` (blue-grey, cold light). New prop types used in world_ext.js:
bunk, wardrobe, hotplate, catalog, globe, stall, tram_stop, kiosk, streetlamp, barrier, car, poster_wall, vault_door, console,
generator, antenna, bigbell, ropes, railing (plus all existing). New objects' hover outlines must work. New NPC looks use existing
schema. New ending tableaux: `end_wake`, `end_wardens_eye`, `end_martyr`, `end_silenced`, `end_exodus`. Also paint the **day-name card**:
`Art.drawDayCard(ctx,w,h,t,dayN)` (a painted transition card for "DAY 2 — WEDNESDAY" etc. with the school/district skyline at dawn).
