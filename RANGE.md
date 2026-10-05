# ShapeForge Range

A tiny first-person sandbox built on the [ShapeForge Engine](https://github.com/Spaghettiosese/Engine): a covered firing line, three lanes and targets out to 200 m, and ten guns modelled, rigged and animated entirely inside the engine. It plays with a mouse and keyboard or on a phone or tablet with touch controls.

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
| Switch weapon | 1–0 · mouse wheel · Q |
| Reset targets | T |
| Hide help | H |

### Touch (phones and tablets)

The touch controls turn on when the device has a touch screen (or on the first touch). Landscape works best, and the game asks for fullscreen when you start.

| Action | Touch |
| --- | --- |
| Move · run | Left stick (push it to the rim to run) |
| Look | Drag anywhere on the screen, or drag while holding Fire |
| Fire | Either Fire button (one for each thumb) |
| Aim down sights | Aim (toggles) |
| Reload · inspect · jump | Reload · Look · Jump |
| Switch weapon | Swap, or tap a slot in the top bar |
| Reset targets | Reset |

If the browser refuses pointer lock (some embedded frames do), drag with the mouse to look.

## The guns

Every gun is a ShapeForge character: parametric shapes (extruded side profiles, lathes, gear extrusions for ribbed and fluted parts, tubes, superquadrics, Array modifiers) bound to a skeleton, plus a pair of gloved first-person arms with two-joint fingers. Animations are authored as a few key poses per channel and baked into ordinary engine clips by `performAction` in `src/weapons/rig.js`, which extends the engine's M1 Garand choreography: hand targets can be attached to the weapon, to a moving part (the bolt knob, the pump, the charging handle, the scope turret) or to the other hand, props such as magazines and shells pass between hands and the gun in world space without popping, and both arms are solved with two-bone IK at every frame.

| Gun | Model | Clips |
| --- | --- | --- |
| **M4A1** (`m4a1.js`) | Flat-top upper with a holographic sight co-witnessed with the A2 front sight, ribbed handguard, birdcage flash hider, forward assist, six-position stock, A2 grip, curved 30-round PMAG | Idle, Fire (one round of 750 rpm auto; the bolt carrier cycles in the ejection port), Reload (strip the mag, fetch a new one, seat it, palm slap, rack the charging handle), Inspect (both sides, then a press check) |
| **.338 Sniper** (`sniper.js`) | Olive thumbhole stock with adjustable cheek piece, fluted heavy barrel, ported muzzle brake, 5-25x56 scope with knurled turrets, folded bipod, 5-round box magazine | Idle, Fire (recoil, then the bolt lifts, runs back, ejects, closes), Reload (mag change, then chamber a round), Inspect (right side, then two clicks on the elevation turret) |
| **12 Gauge Pump** (`shotgun.js`) | Blued receiver, vent-rib barrel with brass and ivory beads, ribbed walnut pump with action bars, checkered walnut stock with white-line pad, side saddle with four shells | Idle, Fire (shot, then rack), Pump, Reload Start, Insert Shell (loops once per shell, thumbing each into the loading port), Reload End, Inspect (side saddle, press check, ejection port) |
| **.44 Magnum revolver** (`revolver.js`) | S&W Model 29 style: blued frame, 6.5" ribbed barrel with a red-insert front ramp, adjustable rear sight, fluted six-shot cylinder on a swing-out crane, ejector rod and star, walnut target grips, speedloader | Idle, Fire (a double-action pull: the trigger raises the hammer and turns the cylinder, then it falls; the shot leaves 65 ms after the click), Reload (open the crane, muzzle up, slap the ejector so all six empties fall out as physics brass, speedloader in, twist, close), Inspect (both sides, open, spin the cylinder, flick it shut) |
| **Double Barrel 12 ga** (`double.js`) | Side-by-side boxlock: case-hardened action with a top lever and tang safety, two triggers, twin barrels with a matted rib and brass bead, a splinter forend, and a walnut pistol-grip stock. The barrels, the forend and the chambered shells swing down together on the hinge pin | Idle, Fire, Reload (the top lever swings, the barrels drop, a flick throws both hulls out as physics brass, two fresh shells are pushed home along the bore, then it snaps shut), Inspect |
| **M1 Garand** (`garand.js`) | Full-length walnut stock with a steel butt plate, parkerized receiver, aperture rear sight with windage and elevation knobs, walnut handguards, lower band, gas cylinder with the protected front sight, operating rod and handle, eight-round en-bloc clip | Idle, Fire (the op rod cycles and throws the case), Reload (haul the op rod back, the empty clip flies out with its ping, thumb a fresh clip in, the bolt slams home), Inspect |
| **MP7** (`mp7.js`) | Compact polymer PDW: full-length top rail with flip-up sights and a tritium front dot, slotted flash hider, folding vertical foregrip, retractable stock, T charging handle, and the 40-round magazine inside the pistol grip | Idle, Fire (one round of ~950 rpm auto), Reload (strip the mag down out of the grip, push a new one up, palm it home, rack the T handle), Inspect |
| **Desert Eagle .50 AE** (`deagle.js`) | Massive slide with a ribbed top, rear serrations and dot sights, a triangular barrel housing with its own rail, chunky steel frame, checkered rubber grip, seven-round magazine | Idle, Idle Empty (slide locked back), Fire (a heavy kick: the slide cycles and the muzzle climbs), Fire Last (the slide stays back), Reload (mag change, palm slap), Reload Empty (the same, then the slide is released), **Inspect** (right side, a slide press check, then the pistol is spun twice on the trigger finger and caught) |
| **AK-47** (`ak47.js`) | Stamped receiver under a dust cover, gas tube and wooden handguards, slant muzzle brake, tangent rear sight, wood stock, bakelite-red pistol grip, curved 30-round banana magazine, right-side charging handle | Idle, Fire (one round of ~600 rpm auto), Reload (mag out, fresh mag in, rack the handle), Inspect |
| **MP5** (`smg.js`) | Stamped receiver with its side rib, cocking tube with a hooded front sight, rotary drum rear sight, slim handguard, three-lug barrel, polymer grip, retractable two-rod stock, curved 30-round 9mm magazine | Idle, Fire (one round of ~800 rpm auto), Reload (charging handle back and locked up, mag change, then the "HK slap" sends the bolt home), Inspect (both sides, press check) |

### V5 props

Every gun is also a ShapeForge Engine V5 mechanism **Prop**, built the way the engine's own armory builds its guns (`src/weapons/prop.js`, `makeWeaponProp(id)` in `src/weapons/index.js`):

- the parts become Kit meshes on nodes, one node per moving part (the double barrel's barrels swing on their hinge node, the Garand's operating rod and the MP7's charging handle slide);
- the moving parts are V5 `Rig` parts (hinges and slides with springs), and every action is a `MechClip` with the same events (`shot`, `magIn`, `ping`...);
- each Prop has `grip`, `support` and `sockets` (muzzle, ejection port, sights), so `Character.equip(prop)` can hold it, and tracks its ammunition like `makeGun()`: `fire()`, `reload()`, `ammo()`.

The guns lying on the shooting counters are these Props: walk up to one and it works its reload. The first-person viewmodels keep their baked arm choreography, since V5 props carry no arms. `npm test` checks every Prop fires until empty, reloads to full and ends with its parts home.

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
src/weapons/          rig.js (arms, shape helpers, choreography baker), m4a1.js, sniper.js, shotgun.js, revolver.js, smg.js, double.js, garand.js, mp7.js, deagle.js
assets/               every gun as a ShapeForge character JSON for Studio (File > Open) — regenerate with node tools/export-studio.mjs
engine/               ShapeForge Engine V5 (vendored, unmodified)
tools/                weapon tests, preview page, headless screenshot helpers
```
