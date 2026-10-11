# ShapeWatch

A hero shooter built on the [ShapeForge Engine](https://github.com/Spaghettiosese/Engine) (vendored in `../engine`). It follows the structure and presentation of a modern team hero shooter and adds systems of its own. Every model, map, voice line, sound, music cue and icon is generated in code; there are no asset files.

```bash
npm start        # from the repo root, then open http://localhost:8080/shapewatch/
npm run test:shapewatch
```

Needs a server (ES modules) and WebGL2. Mouse and keyboard work best; touch controls appear on touch screens.

## Content

- **26 heroes (25 original, plus a Sion homage)**, each with a unique model, portrait, kit and voice. Roles Tank / Damage / Support, split into 10 subclasses (Bruiser, Initiator, Stalwart · Flanker, Sharpshooter, Specialist, Recon · Medic, Tactician, Survivor), each with a passive and a matchup table.
- **7 modes**: Escort and Hybrid (defender forward spawns, capture tick locks, overtime), Control (a different point every round, 99% rule), Team Deathmatch, Free For All, Elimination (no respawns, first to three) and the Training Range.
- **Arcade rules** on any mode: Mystery Heroes, Total Mayhem, Rift Surges. Quick Play picks a random mode, map and side.
- **5 maps** with their own palette, weather, dressing and a landmark: Frostgate, Sunscar Canyon, Dustline Junction, Lumen Heights, The Foundry.

## Combat

- **Feel**: buffered clicks and abilities, per-weapon view recoil, hit flash and flinch, kill confirm sound and marker, directional deaths, damage numbers by layer (health, armor, shield, damage over time).
- **Movement**: crouch (`X`), slide out of a sprint (damage heroes), mantle onto ledges (hold jump), coyote time, quick melee (`V`).
- **Crits are earned**: headshots, and ×1.25 on targets that are stunned, rooted, asleep, slowed or knocked around.
- **Perks**: heroes level up during a match; pick a minor perk at level 2 and a major perk at level 3 (`1` / `2`).
- Knockbacks carry, hooks and pulls drag, damage roles cut healing on hit, overflow healing repairs armor, ultimates come back about every 1.5–2 minutes.

## Bots

- Named regulars with heroes they main and their own skill, who come back match after match: rivals, a **nemesis**, endorsements.
- A team commander: focus fire that follows your pings, push / hold / regroup, cart sitters and contesters, urgency when the clock is short, ult combos, staged respawns.
- Human-like aim (flicks that settle, drifting error, per-burst headshots), limited field of view, flanking that avoids sight lines, five skill levels including adaptive (applied to your opponents only).

## Progression and presentation

- **Career**: account level, daily challenges, first win of the day and win streak bonuses, medals, match history.
- **Hero mastery**: 20 levels per hero; skins unlock along the way.
- **After a match**: Play of the Game and highlights, a coach that compares the match with your averages and explains your deaths, endorsements.
- **Comms**: a director that keeps chatter readable (named callouts, acknowledgements of your orders, banter, rival taunts), pings and a comm wheel, subtitles.
- **Audio**: procedural SFX through a compressor and limiter, distance muffling, low-health heartbeat; an adaptive soundtrack with its own groove per map that stays quiet until a fight starts.
- **Accessibility**: screen shake and flash sliders, HUD scale, enemy colour choice, subtitles, chatter levels.

## Layout

`src/sim.js`, `kits.js`, `modes.js`, `maps.js`, `ai.js`, `teamai.js`, `perks.js`, `roster.js` are the headless game; `view.js`, `fx.js`, `models.js`, `portraits.js`, `icons.js`, `ui.js`, `screens.js`, `replay.js`, `voice.js`, `comms.js`, `audio.js`, `music.js`, `stats.js`, `main.js` present it. Tools: `test-maps/modes/kits.mjs`, `soak.mjs`, `probe.mjs`, and Playwright helpers `shots.cjs`, `sheet.cjs`, `matrix.cjs`, `endflow.cjs`.
