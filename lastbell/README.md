# LAST BELL — A Day at School No. 9

An original isometric dialogue-and-skill-check RPG in the genre of Disco Elysium. You are a 17-year-old student in the
Greater Union of Karsovia. You wake on a stage with no memory, a Youth Commissar hangs in the gym, and the curfew bell rings at 21:00.

**Play:** open `index.html` (works from `file://`, no build, no dependencies). Mobile supported (landscape best).

- 24 skills that talk back, 2d6 checks (red = once, white = retry on level-up), Thought Cabinet, inventory, journal
- Three days (Tuesday to the Thursday Jubilee), 11 locations, 22 characters, ~1,940 dialogue nodes (~290k words incl. choices), 11 endings
- Day verdicts carry over: what you do on Day 1 and 2 reshapes the next morning; nights bring a Static hangover
- Original generative music, ambience and sound effects
- Spin: Surveillance meter, Yesterday-You notes, the Bell/Static memory loop, the Orthodoxy Exam, the PA broadcast finale

## Layout
`data/` world, skills, items, tasks, thoughts, barks, rules, dialogue_a/b · `js/engine.js` core · `js/ui.js` UI · `js/art.js` painterly
renderer (built from `tools/artsrc/` by `tools/build-art.sh`) · `js/audio.js` WebAudio music/sfx · `docs/DESIGN.md`, `docs/CONTRACT.md`

## Tools
`node tools/validate.js` data check · `node tools/test-game.js` reachability + random playthroughs · `node tools/coverage.js`
· `node tools/bundle.js out.html [--fragment]` single-file bundle. Add `?debug` to the URL to expose `window.G`.
