# Misa's Little House

A small, cozy top-down pixel sim. You are **Misa**, and you share a little house with your cat **Mochi**. Walk around, spot what needs doing, and step up to a chore for a close-up minigame. Random events and cutscenes keep each day a little different.

```bash
npm start      # serves this folder on http://localhost:8080 (any static server works)
npm test       # 10 fast logic tests, no browser needed
npm run art    # exports every sprite to assets/sprites/*.png
```

## Playing

| Action | Keys / mouse |
| --- | --- |
| Walk / run | WASD or arrows / Shift (or hold the mouse button to walk toward it) |
| Interact, pet Mochi, advance dialogue | E or Space (or click) |
| Pause a chore | Esc |
| Music on/off | M |

Each morning you get a chore list (shown in the top bar). Finish it, then sleep in the bed (or wait until 8 PM). Progress, stars and decor are saved in your browser. Press **N** on the title screen for a new game.

### Chores (close-up minigames, mouse or keyboard)

- **Dishes**: hold the mouse button (or Space) and scrub the grime off each plate. Rinse it and it floats up onto the rack.
- **Sweep**: push the dust into the dustpan. Shiny things hide in the dust and give bonus stars.
- **Laundry**: fold each shirt by pressing the glowing arrow, or clicking the glowing fold, before the timer runs out.
- **Plants**: hold to pour, then let go in the green band. Overpour and it gets soggy.
- **Feed Mochi**: Mochi has a favourite food each day. Her tail wags and hearts appear when you hover over it.

### Twists and extras

- Mochi follows you, sits, wanders, naps on her cushion at night and gets the zoomies. Pet her, or cuddle on the sofa for extra cozy points.
- Tea, books, the sofa and the diary let you take a breather (time passes, cozy goes up).
- **Random events**: a parcel from Aunt Nori (unlocks decor for the house), rain (waters the plants for you), Mochi's gifts and mischief (she knocks a plate off the counter, so more dishes), zoomies, a power cut (lantern light), and shooting stars in the evening with a wish to make.
- The house changes: dust, dirty dishes, wilted plants and a full laundry basket vanish as you finish chores, and day/night and weather tint the whole house.

## Art and Moonkai Pixel Studio

I don't have access to Moonkai Pixel Studio from the coding environment, so all sprites (Misa, Mochi, Pip the postie, tiles, furniture, icons and the 48x48 portraits) are pixel data in `src/art.js`. That keeps it reproducible and easy to test. To bring Moonkai into the loop:

1. `npm run art` writes each sprite as a PNG to `assets/sprites/` (Misa is `misa_<dir>_<frame>.png`, portraits are `p_<who>_<mood>.png`).
2. Open a PNG in Moonkai, repaint or animate it, and keep the same canvas size.
3. Save it under the same name in `assets/override/`, then run `npm run art` to refresh `assets/override/manifest.json`.
4. Reload. The game uses your PNG in place of the built-in art (mirrored automatically where it needs to face the other way).

## Layout

```
index.html            canvas host (320x224 logical pixels, integer-scaled)
src/art.js            all pixel art as data + palette
src/artcache.js       bakes sprites, applies PNG overrides
src/world.js          house tiles, furniture, chore stations, collision
src/cat.js            Mochi's behaviour
src/chores.js         chore list + rewards
src/minigames.js      dishes, sweep, laundry, plants, feed
src/events.js         random events and their cutscene scripts
src/cutscene.js       dialogue, portraits, fades, choices
src/game.js           main loop, rendering, HUD, save
tools/                PNG exporter and tests
```

## Ideas for later

Touch controls, a Moonkai-painted sprite set with proper animation frames, more rooms (garden, attic), seasons, a shop for decor, and more visitors.
