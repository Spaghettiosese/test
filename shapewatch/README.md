# ShapeWatch

A 5v5 hero-shooter payload game built on the [ShapeForge Engine](https://github.com/Spaghettiosese/Engine) (vendored in `../engine`). It borrows the structure and presentation of a modern team hero shooter (role queue, hero select with a team lineup, escort objective, ultimates, forward spawns, a full HUD) and adds twists of its own. Every model, map, sound and icon is generated in code. There are no asset files.

```bash
npm start        # from the repo root, then open http://localhost:8080/shapewatch/
npm run test:shapewatch
```

It needs a server (ES modules don't load from `file://`) and a browser with WebGL2. A mouse and keyboard work best; touch controls switch on for touch screens.

## How a match works

Two teams of five (1 tank, 2 damage, 2 support) fight over a payload on **Frostgate**, a snowbound street with two chokepoints. **Attackers** escort the payload to the goal before the clock runs out. **Defenders** stand on it to stop it. The payload pushes faster with up to three attackers on it, stops when contested, and each checkpoint adds time and moves the attackers' spawn forward. When time expires with attackers still on the payload, overtime begins.

You pick a side, a hero and a skin on the hero select screen, with a team lineup, countdown and role rows. Press **H** while dead or in your spawn to change hero.

### Twists

- **Rift Surges.** Roughly once a minute the storm rewrites the rules for half a minute: *Low Gravity*, *Overclock* (cooldowns recharge twice as fast), *Glass Cannon* (+40% damage for everyone) or *Whiteout* (the payload surges in a snowstorm). Toggle them in the menu.
- **Echo Cores.** Every elimination drops a core for the killer's team. Grab it for 12% ultimate charge and a burst of health. Bots fight over them too.
- **Skins.** Palette swaps that update the 3D model live on the select screen.

## Controls

| Action | Keys |
| --- | --- |
| Move · jump | WASD · Space |
| Primary fire · secondary | Left mouse · right mouse |
| Ability 1 · ability 2 | Shift · E |
| Ultimate · reload | Q · R |
| Scoreboard · change hero · pause | Tab · H · Esc |

## The heroes

| Role | Hero | Kit |
| --- | --- | --- |
| Tank | **Bulwark** | Pulse cannon, hold-to-project barrier (700 HP), Shield Charge, Rally Cry, *Bastion Field* dome |
| Tank | **Mauler** | Scrap shotgun, Chain Hook pull, Leap Slam, Brace, *Meteor Crash* |
| Tank | **Orbit** | Gravity bolts, Mass Anchor pull, Hover Boost, Phase Ward, *Singularity* black hole |
| Damage | **Sabre** | Pulse rifle, Micro Rockets, Slide Dash, Stim Injector, *Overdrive* aim-lock |
| Damage | **Cinder** | Ember bolts that burn, Scorch Burst, Ember Step, Fire Wall, *Inferno* |
| Damage | **Vesper** | Rail rifle that charges while scoped, Grapple Line, Sonar Dart, *Rift Lance* (pierces walls) |
| Damage | **Flicker** | Twin pistols, Backstab, three-charge Blink, Rewind, *Time Bomb* |
| Support | **Halo** | Sidearm, Aegis healing beam, Guardian Leap, Sanctuary, *Resurgence* (revives the fallen) |
| Support | **Pylon** | Rivet pistol, Repair Dart, Heal Pylon, auto Sentry, *Overcharge Grid* |
| Support | **Zephyr** | Sonic shot, heal/speed aura toggle, Amp Pulse, Wall Dash, *Sound Barrier* |

All ten are original characters. Numbers live in `src/heroes.js`; behaviour lives in `src/kits.js`.

## The AI

Bots drive their unit through the same input struct the player uses (`unit.in`), so everything a player can do, a bot can do. `src/ai.js`:

- **Perception.** Field of view and line of sight, a reaction delay (0.5 s easy, 0.3 s normal, 0.17 s hard) before a newly seen enemy is engaged, and instant awareness of anyone who just shot them.
- **Targeting.** Scores by distance, how hurt the enemy is, role, and stickiness. Snipers prefer squishies, and sentries are low priority.
- **Aim.** Turn-rate limited, with a random-walk error that shrinks with skill, projectile leading, and occasional headshot aiming on precision weapons.
- **Objectives.** Attackers stand on the payload, with the tank in front, damage heroes spread around and supports behind. Defenders hold the next chokepoint and flood onto the payload when attackers contest it.
- **Navigation.** A* over a layered 1 m grid built from the level geometry, with stairs, roofs, drops and unit-size clearance. Bots detect getting stuck, repath, give up on unreachable health packs, and last-resort nudge themselves free.
- **Survival.** Retreat to health packs (or fall back) when hurt, supports tend the wounded, and bots grab Echo Cores when it is safe.
- **Kits.** Per-hero logic: barrier discipline, hook and leap timing, ultimate usage on clusters, sonar darts, rewinding out of trouble, deploying pylons and sentries, resurrecting groups, switching Zephyr's aura to match the situation.

## Layout

```
index.html, style.css   the page, HUD and every menu
src/main.js             boot, input (keyboard, mouse, touch), game flow, frame loop
src/sim.js              the match simulation (headless): units, projectiles, zones, payload, rounds
src/kits.js             what each hero's weapons and abilities do
src/ai.js               bot brains and navigation use
src/map.js              Frostgate geometry, nav grid, A*, level visuals
src/models.js           procedural hero, weapon and deployable models
src/view.js             scene sync, camera, viewmodel, particles, effects
src/ui.js               portraits (rendered by the engine), icons, HUD, hero select, gallery, scoreboard
src/audio.js            procedural Web Audio sound
tools/                  headless tests and probes (see below)
```

The simulation never touches the renderer, so the same code runs in Node:

```bash
npm run test:shapewatch            # kit checks for every hero + a short bot-vs-bot soak
node shapewatch/tools/balance.mjs 1 12   # win rates over 12 bot matches at difficulty 1
node shapewatch/tools/soak.mjs 24        # many matches: exceptions, stuck bots, per-hero stats
node shapewatch/tools/timeline.mjs 5 20  # print where every bot is every 20 s
node shapewatch/tools/shots.cjs prefix '[{"js":"__sw.startMatch()","wait":3000}]'   # headless screenshots
```
