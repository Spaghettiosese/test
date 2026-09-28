# Misa's Little House

A small, cozy top-down pixel sim. You are **Misa**, and you share a little house with your cat **Mochi**. Walk around, spot what needs doing, and step up to a chore for a close-up minigame. Random events and cutscenes keep each day a little different.

```bash
npm start      # serves this folder on http://localhost:8080 (any static server works)
npm test       # 12 fast logic tests, no browser needed
npm run art    # exports every sprite to assets/sprites/*.png
```

## Playing

| Action | Keys / mouse |
| --- | --- |
| Walk / run | WASD or arrows / Shift (or hold the mouse button to walk toward it) |
| Interact, advance dialogue | E or Space (or click) |
| Pet Mochi (opens the petting menu) | E when she is the closest thing, or P |
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

- Mochi follows you, sits, wanders, naps on her cushion at night and gets the zoomies. Petting her opens a close-up menu: stroke slowly with the mouse (or WASD plus Space), favour her head and chin, and don't go too fast or she gets annoyed. Her eyes follow your hand. You can also cuddle on the sofa for extra cozy points.
- Tea, books, the sofa and the diary let you take a breather (time passes, cozy goes up).
- **Random events**: a parcel from Aunt Nori (unlocks decor for the house), rain (waters the plants for you), Mochi's gifts and mischief (she knocks a plate off the counter, so more dishes), zoomies, a power cut (lantern light), and shooting stars in the evening with a wish to make.
- The house changes: dust, dirty dishes, wilted plants and a full laundry basket vanish as you finish chores, and day/night and weather tint the whole house.

## Art and Moonkai Pixel Studio

- **Misa** is painted by hand on the Studio canvas, not with the Character builder. `tools/misa-studio.mjs` opens the Studio in headless Chromium and draws her through the Studio's own pencil, line, rect and ellipse tools on its anime layers (Flats, Shading, Highlights, Line Art), one drawing per frame:
  - `assets/moonkai/misa_sheet.png`: 40x48 frames, 11 per row. Rows are front, back and side; columns are idle breathing (4), a blink (1) and a 6-frame walk. Left is the side view mirrored, and Shift plays the walk faster.
  - `assets/moonkai/misa_portraits.png`: 64x64 anime portraits that face the viewer, in 4 moods, each with mouth open/closed and blink frames (used for talking and blinking in dialogue).
  - `assets/moonkai/misa.pxs.json` and `misa_portrait.pxs.json`: the Studio projects. Open them with the Studio's Open button to repaint her by hand, then export the sprite sheet from there and overwrite the PNGs.
  - Run `MOONKAI_DIR=/path/to/moonkai node tools/misa-studio.mjs` to repaint everything from the script (the PNGs are committed, so you only need this if you change the script).
- **Everything else** (Mochi's walk, sit, blink and sleep frames, Pip, the 64 px animated portraits, tiles and furniture) is pixel data in `src/art.js`, drawn with an automatic selective outline. World sprites are smoothed with Scale2x when the camera zooms the house to 2x.
- `npm run art` exports the `src/art.js` sprites as PNGs to `assets/sprites/`. To replace one, paint it in Moonkai at the same size, save it in `assets/override/` under the same name and run `npm run art` again to refresh `assets/override/manifest.json`.

## Layout

```
index.html            canvas host (320x224 logical pixels, integer-scaled)
src/art.js            pixel art as data + palette, with auto-outline
src/moonkai.js        loads and draws Misa's Studio-painted sheets and portraits
src/pet.js            the close-up petting menu
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

Touch controls, a run animation and more chore poses for Misa, more rooms (garden, attic), seasons, a shop for decor, and more visitors.
