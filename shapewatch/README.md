# ShapeWatch

A hero shooter built on the [ShapeForge Engine](https://github.com/Spaghettiosese/Engine) (vendored in `../engine`). It follows the structure and presentation of a modern team hero shooter and adds systems of its own. Every model, map, voice line, sound and icon is generated in code; there are no asset files.

```bash
npm start        # from the repo root, then open http://localhost:8080/shapewatch/
npm run test:shapewatch
```

Needs a server (ES modules) and WebGL2. Mouse and keyboard work best; touch controls appear on touch screens.

## Content

- **26 heroes (25 original, plus a Sion homage)**, each with a unique model, portrait (own pose, lens, lighting and 3D backdrop), kit, crit profile and voice. Roles Tank / Damage / Support, split into 10 subclasses (Bruiser, Initiator, Stalwart · Flanker, Sharpshooter, Specialist, Recon · Medic, Tactician, Survivor) with their own icons and matchups.
- **6 modes**: Escort, Hybrid (capture then escort), Control (best of three), Team Deathmatch, Free For All, Training Range.
- **5 maps** with their own themes and weather: Frostgate, Sunscar Canyon (huge), Dustline Junction, Lumen Heights, The Foundry.
- **Bot AI**: a team commander (focus fire, push/hold/regroup, ult combos, reacts to your pings and callouts), cover, high ground, flanking, dodging, counter-picks, 5 skill levels including adaptive.

## Systems

- **Crits**: headshots always crit; every hero has a chance to crit on body hits. Gold numbers, hit markers and a Crit King medal.
- **Healing that works**: healers lock onto the most wounded ally (you included), with beams, orbs, auras, HUD heal numbers and a heal indicator. Everyone has passive regeneration (supports sooner).
- **Pings and comms**: `Z`/middle mouse pings what you aim at; hold `C` for the comm wheel. Allies call things out in their own voices with subtitles.
- **Voicelines**: speech synthesis, a distinct pitch/pace/voice per hero, announcer, ult shouts, kill/hurt/win/lose lines.
- **Kill cam and Play of the Game**: the recorder keeps ~17 s of data frames; die and watch the killer's view, win and see the best moment (plus a highlights reel).
- **Career**: XP and levels, per-hero stats, medals, daily challenges and match history (localStorage).
- **Bounty**: a four-elimination streak puts a visible bounty on you; claiming it pays 30% ultimate charge.
- Minimap, status chips, hero resource meters, echo cores, rift surges, skins, hero gallery with stats and voice preview.

## Layout

`src/sim.js`, `kits.js`, `modes.js`, `maps.js`, `ai.js`, `teamai.js` are the headless game; `view.js`, `fx.js`, `models.js`, `portraits.js`, `icons.js`, `ui.js`, `screens.js`, `replay.js`, `voice.js`, `audio.js`, `stats.js`, `main.js` present it. Tools: `test-maps/modes/kits.mjs`, `soak.mjs`, `probe.mjs`, and Playwright helpers `shots.cjs`, `sheet.cjs`, `matrix.cjs`, `endflow.cjs`.
