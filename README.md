# ShapeForge Range

A tiny first-person sandbox built on the [ShapeForge Engine](https://github.com/Spaghettiosese/Engine): a covered firing line, three lanes and targets out to 200 m, and three guns modelled, rigged and animated entirely inside the engine.

```bash
npm start      # serves the folder on http://localhost:8080 (any static server works)
npm test       # bakes every weapon clip and checks the gun states
```

Open `index.html` through a server (ES modules don't load from `file://`) and click **Step up to the line**.

## Controls

| Action | Keys |
| --- | --- |
| Move · sprint · jump | WASD · Shift · Space |
| Fire · aim down sights | Left mouse · right mouse (E toggles) |
| Reload · inspect | R · F (or I) |
| Switch weapon | 1 2 3 · mouse wheel · Q |
| Reset targets | T |
| Hide help | H |

If the browser refuses pointer lock (some embedded frames do), drag with the mouse to look.

## The guns

Every gun is a ShapeForge character: parametric shapes (extruded side profiles, lathes, gear extrusions for ribbed and fluted parts, tubes, superquadrics, Array modifiers) bound to a skeleton, plus a pair of gloved first-person arms with two-joint fingers. Animations are authored as a few key poses per channel and baked into ordinary engine clips by `performAction` in `src/weapons/rig.js`, which extends the engine's M1 Garand choreography: hand targets can be attached to the weapon, to a moving part (the bolt knob, the pump, the charging handle, the scope turret) or to the other hand, props such as magazines and shells pass between hands and the gun in world space without popping, and both arms are solved with two-bone IK at every frame.

| Gun | Model | Clips |
| --- | --- | --- |
| **M4A1** (`m4a1.js`) | Flat-top upper with a holographic sight co-witnessed with the A2 front sight, ribbed handguard, birdcage flash hider, forward assist, six-position stock, A2 grip, curved 30-round PMAG | Idle, Fire (one round of 750 rpm auto; the bolt carrier cycles in the ejection port), Reload (strip the mag, fetch a new one, seat it, palm slap, rack the charging handle), Inspect (both sides, then a press check) |
| **.338 Sniper** (`sniper.js`) | Olive thumbhole stock with adjustable cheek piece, fluted heavy barrel, ported muzzle brake, 5-25x56 scope with knurled turrets, folded bipod, 5-round box magazine | Idle, Fire (recoil, then the bolt lifts, runs back, ejects, closes), Reload (mag change, then chamber a round), Inspect (right side, then two clicks on the elevation turret) |
| **12 Gauge Pump** (`shotgun.js`) | Blued receiver, vent-rib barrel with brass and ivory beads, ribbed walnut pump with action bars, checkered walnut stock with white-line pad, side saddle with four shells | Idle, Fire (shot, then rack), Pump, Reload Start, Insert Shell (loops once per shell, thumbing each into the loading port), Reload End, Inspect (side saddle, press check, ejection port) |

`tools/preview.html` renders any clip at any time from the eye or from outside; `tools/shots.cjs` and `tools/game-shots.cjs` take headless screenshots of it and of the game.

## The range

`src/range.js` builds the scene: a concrete slab under a tin roof with three shooting counters (each with a display copy of a gun), distance boards, earth berms, paper bullseyes at 10, 25 and 50 m scored by ring, five hinged steel plates at 15 m, bottles and cans at 12 m that shatter or fly, a crate stack at 20 m, a steel runner on a rail at 35 m and hanging gongs at 100, 150 and 200 m.

`src/game.js` runs the player (a physics character controller), the weapon state machines, aim down sights (the rig is turned and moved each frame so the sight line runs down the eye's axis, even mid-recoil), a scope overlay with a rangefinder, hitscan shots with spread and pellets, physics brass and shotgun hulls, bullet-hole decals, tracers, muzzle light and procedural Web Audio sound (`src/audio.js`).

## Layout

```
index.html            the game page and HUD
src/game.js           player, weapons, shooting, HUD
src/range.js          the range and its targets
src/audio.js          synthesised sound effects
src/weapons/          rig.js (arms, shape helpers, choreography baker), m4a1.js, sniper.js, shotgun.js
engine/               ShapeForge Engine V4 (vendored, unmodified)
tools/                weapon tests, preview page, headless screenshot helpers
```
