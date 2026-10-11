# Misa's Little House: art direction review and spec for the life-sim expansion

Reviewer: pixel-art director pass. Based on commit `172d00d` (the old `src/game.js` build), captured with Playwright at 960x672 before the engine restructure, plus a read of `src/art.js`, `artcache.js`, `moonkai.js`, `pet.js`, `minigames.js`, `cutscene.js`, `font.js`, `tools/misa-studio.mjs`, the new `src/gfx/color.js` and `src/gfx/chars.js`, and the Moonkai Pixel Studio (`README`, `palettes.js`, `app.js` shading, `examples/*.png`).

All evidence is in `scratchpad/agents/art/`:

| File | What it shows |
|---|---|
| `a01..a20*.png`, `b01..b08*.png` (plus `-native.png` 320x224 captures) | Title, dialogue, every room, walking, Pip, evening/night/rain/blackout, the storybook scenes, choices, all five minigames, petting, summary |
| `k1-kitchen-zoom.png`, `k2-pip-zoom.png`, `k3/k4` dialogue zooms, `k5-title-zoom.png` | Pixel-level crops at 5–6x |
| `z1-misa-sheet.png`, `z2-misa-portraits.png` | Misa's Studio sheets at 4x / 3.5x |
| `m1-fullmap.png`, `m2-allsprites.png` | The whole house at 2x, and an atlas of every `art.js` sprite |
| `pal-swatch.png` + `pal.js` | The proposed master palette, rendered |
| **`mock-grid.png`** + `mock.js` / `mockrun.mjs` | **Style-target mockup.** An outdoor town corner drawn 100% procedurally at Misa's pixel density, next to her real sheet, in four variants: summer day, summer night (lightmap), autumn golden-hour rain, winter snow. `mock.js` is a runnable reference for most of the techniques in Part 3. |

---

## 0. Top 15 (prioritised)

| # | P | Recommendation |
|---|---|---|
| 1 | P1 | **Use one pixel density everywhere: 1 art pixel = 1 canvas pixel** (Misa's density). Author world tiles at **32x32** and props at their true on-screen size. Stop using Scale2x/EPX and 2x/3x/5x nearest-neighbour scaling for world art and characters. |
| 2 | P1 | **Fix the scale.** Mochi sits **52 px tall vs Misa's 46** and Pip is **68 px** (1.5x Misa). Adopt the scale chart in section 2.1: human frame 48x64 anchored at the feet, Misa 46 px, adults 52–56 px, Mochi sitting ~24 px, doors 28x50 or taller. |
| 3 | P1 | **Add a master palette module** (`src/gfx/palette.js`) of hue-shifted 5-step ramps (section 2.4) with one ink colour, `#2a1a22`. Replace the **136 ad-hoc hex literals** with it (7 near-white creams alone). Every tile and prop reads its colours through `materials(season)` so seasons become a palette swap. |
| 4 | P1 | **Light, outline and shadow rules.** Light comes from the top-left. Characters get a 1 px ink outline. Props get a *selective* outline (dark, plum-shifted neighbour colour) with an ink bottom edge. Ground has no outline. Contact shadows are **pixel ellipses** in plum `rgba(42,26,64,.30)`; the current shadows are grey rectangles. |
| 5 | P1 | **Fix these visual bugs:** the HUD hearts and coin are drawn through the camera, so they scroll with the world; rain falls *inside* the house; three stray door tiles sit in the middle of rooms; in the 3x5 font **M ≈ H** (the title reads "HISA'S"); the title's drop shadow is nearly the same colour as the background. |
| 6 | P1 | **New type.** A proportional **5x7 font with lowercase** (10 px line) for dialogue and UI, a fixed 3x5 font for HUD numerals only, and a hand-drawn logo. Never scale the small font up 3–4x for titles. |
| 7 | P1 | **Redesign the dialogue box.** A 304x56 box at the bottom, the 64x64 portrait overlapping its top-left corner, a name tab in the NPC's signature colour, 3 lines, a bouncing ▼ and pauses on punctuation. The same component serves all 15+ NPCs. |
| 8 | P1 | **Lighting pipeline.** A **multiply lightmap** driven by time-of-day keyframes, plus **banded pixel light sources** (lamps, windows, lanterns) and an emissive repaint. This replaces the flat `source-over` tint, which turns night grey, and the anti-aliased arc rings in the blackout event. |
| 9 | P1 | **NPC pipeline.** Build parametric `paintCharacter(spec)` (in `tools/studio-cast.mjs`) with modular hair, outfit and accessory parts per direction. **Don't ship palette-swapped Misas:** every one has the same silhouette. **Fix Misa first**, because everyone copies her construction: bangs are rectangles, her eyes read as glasses at 1x, the side view has a tan patch on the jaw, and the back view doesn't mirror her pink streak. |
| 10 | P1 | **Outdoor ground generators.** Grass from world-space hash and value noise (macro patches plus tufts). **Dual-grid (corner) autotiling** for paths, water and sand: a per-pixel bilinear field plus noise, with lit and shadowed edge rules. Bake to chunk canvases. Proven in `mock.js`. |
| 11 | P2 | **Building and prop generators.** `facade(spec)` for walls, kawara roofs, windows that glow at night, doors, awnings, noren and signs; a tree generator (clustered blobs, season swaps); fences, lamp posts, vending machines and utility poles. Roofs and canopies live on an upper layer and dither to see-through when Misa is behind them. |
| 12 | P2 | **Seasons and weather.** Ramp swap plus grade per season. Rain with 2 layers of streaks, splashes, puddles and a wet tint; snow with flakes, a snow-cap pass on sprites and a frozen pond; fog; storm flashes; petals, leaves and fireflies. **Indoors, weather is seen only through windows.** |
| 13 | P2 | **UI kit and phone.** Procedural 9-slice panels (paper, night, phone), 3-state buttons, a 16x16 icon set, a HUD status card (date, season, weather, time dial) and a **MisaPhone** (128x184) with Map, Calendar, Friends, Bag, Tasks, Messages, Camera and Settings. |
| 14 | P2 | **Transitions.** Bayer-dither fades from 17 cached patterns (doors), a pixel iris on Misa (sleep and day end), letterbox bars for cutscenes, a blinds wipe for fast travel. No smooth alpha fades. |
| 15 | P2 | **Interiors and minigames to the same standard.** Walls with thickness and baseboards, plank floors with per-board variation, sun pools from windows, and the school sets. Rebuild the minigames at 1:1 inside a shared close-up card: Feed's 5x Mochi, Sweep's 1x floor, and the rectangle shirt and watering can are the weakest screens. |

P3 items are listed in section 4.

---

## 1. Critique of the current visuals

### 1.1 Pixel density and scale (the biggest problem)

The game mixes **six different pixel densities**, sometimes on one screen:

| Element | How it's drawn | 1 art px = |
|---|---|---|
| Misa in the world (`drawMisa(..., scale=1)`) | sheet at 1x | **1x1** canvas px, with a 1 px ink outline |
| Tiles, furniture, Mochi, Pip, hearts, zzz in the world | `sprite2` = **EPX Scale2x** | 2x2 with rounded corners ("mixels"); auto-outline becomes 2 px |
| Misa on the title screen and in storybook scenes | EPX 2x sheet | 2x2 smoothed |
| Mochi on the title / in storybook scenes | `scale(3,3)` nearest | **3x3** |
| Mochi in Feed | `scale(5,5)` | **5x5** blocks next to 2x icons and 1x text (`b05-feed.png`) |
| Sweep floor | `t_wood` at 1x | 16 px planks: half the world's plank size |
| Pet menu | live ellipses at 1x | 1x1: **the best-matching screen in the game** |
| Logo | 3x5 font at 4x and 3x | 4x4 / 3x3 |

Consequences:

- **Misa looks like she was pasted in from a different game.** She has twice the detail, half-width outlines and crisper edges than the room around her (`k1-kitchen-zoom.png`, `k2-pip-zoom.png`).
- **Relative scale is broken.** Mochi (26 px art → 52 px on screen) is **taller than Misa** (46 px; `a05`, `a06`, `a09`). Pip (34 px → 68 px) is **1.5x Misa** (`a12-pip-world.png`).
- **EPX artefacts.** You can see diamond notches at every checker-tile corner in the kitchen (`k1`), and doubled stair-steps on diagonals.

### 1.2 Outlines

There are four unrelated outline systems:

- Misa: 1 px uniform ink `#2a1a22`.
- `art.js` characters (Mochi, Pip, unused old portraits): auto selective outline at k=0.36, which becomes 2 px after EPX.
- Pet-menu Mochi: brown `#5a3020`.
- Furniture and tiles: **no outline at all**, so props melt into the floor. Examples: the bed against the planks, the bowl against the checker tile.

UI panels have no outer outline either, only cream lines at the top and bottom.

### 1.3 Palette

- `art.js` `P` is a pleasant cozy base, but **most materials have only 2–3 tones with no hue shift**. Wood is a straight value ramp (`#d3a574`/`#c39264`/`#a67548`), so it looks flat and slightly muddy.
- 136 unique hex values are spread across files; minigames and pet code invent their own (`#d8ecef`, `#c6e0e4`, `#e8c9a6`…).
- There are seven near-white creams: `#fff1d6 #fffaf0 #fff8e8 #fff6e6 #fff6a0 #fff0b0 #ffffff`.
- There are two inks (`#2a1a22` for art, `#2b1d2e` for UI) plus the brown cat ink.
- **New engine note:** `src/gfx/color.js` `shade()` applies a *constant* hue offset (−0.02 when lightening, +0.03 when darkening). That doesn't reproduce Moonkai's shading, which pulls highlights *toward* yellow (55°) and shadows *toward* violet (255°). With a constant offset, red highlights go magenta and green shadows go teal-cyan. Port Moonkai's `shadeColor` instead (section 3.1).

### 1.4 Light, shadow, time of day, weather

- **Night** is a `source-over` fill of `rgba(40,40,110,.42)`, which greys and desaturates everything (`a14-night.png`). No lamps, windows or glow, and the bright HUD sits over a muddy world.
- **Blackout** uses canvas `arc()` with anti-aliasing: five smooth, non-pixel rings (`a16-blackout.png`).
- **Rain draws over the whole screen in the house view**, so it rains on the sofa (`a15-rain-world.png`).
- **Shadows** are `fillRect(w*2, 5)` grey rectangles under the feet.
- Lighting direction is inconsistent: some props have a top band highlight (washer, fridge), others none (bed, rugs). There are no contact shadows or ambient occlusion where furniture meets the floor or the floor meets walls.

### 1.5 House environment (`m1-fullmap.png`)

- Walls are thin strips with no thickness or baseboard. The kitchen and living room are separated only by a floor-texture change.
- **Vestigial door tiles** `[7,4] [13,4] [9,10]` in `DOORS` draw brown threshold squares in the middle of rooms (kitchen right edge, living room right, bedroom).
- Perspective is mixed: the bed and rugs are pure top-down while the sofa, stove, sink and table are ¾ view. That's acceptable JRPG convention, but the shading has to sell it.
- Tile repetition is strong: every bath tile has the same white dot, and the sunroom's green grid is empty and monotonous.
- Windows are tiny, so no light enters the rooms. That's a missed cozy opportunity: sun pools on the floor are cheap and atmospheric.

### 1.6 Characters

**Misa sheet** (`z1`):

- **Front view:** charming and readable. But the 6-px-wide ink lash bar plus the outer flick plus the flat bang row above it read as **glasses** at 1x (`k1`).
- **Back view:** a flat helmet dome with no strand clumps or nape detail. The pink streak is drawn at the same x as the front view, so it isn't mirrored (`misa-studio.mjs`: `B(24, Y(8), 25, …, C.pink)` for both `down` and `up`).
- **Side view:** the Shading pass `B(15, Y(21), 22, Y(23), C.skin2)` paints a **tan bar across the back hair at jaw height**, which reads as a strap or beard. The face is a narrow strip with the eye on the very edge.
- **Walk cycle:** arms barely swing and the head bob is 1 px. Acceptable, but stiff next to the lively cat.

**Misa portraits** (`z2`):

- The face is a square block inside a hair helmet.
- The bangs are one horizontal band with rectangular teeth, not anime clumps.
- The hair highlight hugs the very top edge instead of forming the "angel ring" about ⅓ down the crown.
- The jaw has no taper.
- The upper lash line and brow stack read as glasses again.
- The hoodie is a navy blob with no collar shape.

Compare the Moonkai examples: triangular bang spikes, 3–4-tone irises (dark top to light bottom), two highlights, a broken highlight band and soft checker blush.

**Mochi** (`art.js`): the anatomy is fine but the scale and density are wrong (1.1). The pet-menu Mochi (`b06`) is the best character art in the game and should be the model for every Mochi.

**Pip:** a different construction from Misa (an `art.js` face built from ellipses, EPX in the world), and it reads as a giant.

### 1.7 UI, HUD, fonts, dialogue

- **Font:** 3x5, caps only, so dialogue is shouted in tiny capitals. M/H, N/n and W/M are near-identical: the title reads "HISA'S" and "MOCHI" reads "HOCHI" (`k5`).
- **HUD:** the hearts and coin go through `drawSpr`, which subtracts the camera, so they scroll with the world and land on the fridge and stove (`a05`, `k1`). The chore list runs into the clock once there are 5 chores. The bar is plain text with no icons.
- **Dialogue box** (`k3`): 76 px tall for typically 1–2 lines of text, so 40% of the box is empty. Every speaker gets the same coral name tag. The portrait backgrounds are flat squares, and Pip reuses Misa's mint.
- **Choice menu** (`a19`): a floating plum rectangle over the characters' faces with no frame or cursor.
- **Title** (`a01`, `k5`): the logo is the 3x5 font scaled up, with a cream shadow on cream. Cream rectangle clouds drift through the letters. Misa is at EPX 2x, Mochi at 3x.
- **Summary** (`b08`): competent, but it's a generic panel. A diary page would fit the game's personality.

### 1.8 Minigames and storybook scenes

- **Dishes** (`b01`): flat disc plate; grime is 5x5 squares; the stack and rack float outside the sink.
- **Sweep** (`b02`): 1x planks (wrong scale); the dustpan is a grey rectangle; dust is 3 px specks.
- **Laundry** (`b03`): the shirt is three rectangles and the prompt is the word "DOWN".
- **Plants** (`b04b`): a rectangle watering can, rectangle clouds, a tiny pot.
- **Feed** (`b05`): 5x chunky Mochi with a separately drawn rectangle tail overlay. The `^` marker is tiny.
- **Pet** (`b06`, `b07`): the best screen. Weak spot: Misa's arm is a navy box.
- **Storybook window scenes** (`a18`–`a20`): Misa *stands on the window sill* facing away from the cat and the moon, and the sleeping cat floats mid-window. Better staging: both on a window seat, seen from behind (use the `up` row), with silhouettes against the sky.

---

## 2. Art direction spec for the expanded game

### 2.1 Core rules: density, grid, scale, camera

**Rule 1 – one density.** 1 art pixel = 1 logical canvas pixel. No runtime upscaling of art, ever. The only scaling is the whole-canvas integer CSS scale. Scale2x/EPX is retired for game art; at most it's an export preview inside Moonkai.

**Rule 2 – grid.** Visual tile = **32x32 px**. Logic can keep `TILE=16` world units with `Z=2` if that's easier, but sprites are authored in screen pixels. Migration path: mark sprites `hd:true`; `sprite2()` returns `sprite()` unchanged for them, and legacy sprites keep EPX until they're redrawn. Canvas stays 320x224, which shows 10x7 tiles. Design town blocks for that window: streets 3–4 tiles wide, shop fronts 4–6 tiles wide, and the camera leads 24 px in the facing direction.

**Rule 3 – scale chart.** All heights include the outline.

| Thing | Size (px) |
|---|---|
| Human sheet frame (all NPCs) | **48x64**, feet anchor (24,62); Misa's 40x48 frames paste in at (4,14) |
| Child / Misa and classmates / adult / tall adult / elderly | 38–40 / 44–46 / 52–54 / 56–58 / 48 (stooped) |
| Head width (constant for chibi unity) | 22–24 |
| Mochi sit / walk / sleep | 22x24 / 30x20 / 28x14 (other cats ±2; dog 30x26; bird 8x8) |
| Door | 28x50 (always ≥ character height + 4) |
| Window | 28x26; one-storey wall 64–72; roof face 48–64 |
| Chair / table / bed / sofa | 20x28 / 48x40 / 40x64 / 72x44 |
| Fridge / bookshelf / locker / vending machine | 28x56 / 32x64 / 20x56 / 32x60 (taller than Misa) |
| School desk / blackboard / bench / lamp post | 28x30 / 96x48 / 48x26 / 10x56 |
| Tree small / large; bush | 56x72 / 80x104; 30x18 |
| Inventory icon / HUD icon / emote bubble | 16x16 / 9x9–12x12 / 14x14 |
| Dialogue portrait | 64x64 (busts 96x112 are P3) |

**Rule 4 – camera.** Lerp follow, then **snap the final camera to integers once per frame** (never fractional `drawImage`). When a map is smaller than the screen, centre it and fill the margin with `#1e1624`.

**Rule 5 – no canvas anti-aliasing.** No `arc()`, `ellipse()`, `lineTo` strokes, smoothing, `filter: blur`, or fractional scaling. Every circle is a row-span pixel disc (`R.e`). Alpha is allowed only for shadows, light and weather overlays.

### 2.2 Light and shading

- **Light from the top-left.** Top faces are lightest, left faces mid, right and bottom faces darker. Cast shadows offset 2–5 px to the right and down. Buildings cast a 5 px band down and to the right.
- **Minimum of 3 tones per material** (shadow, base, light), plus one highlight accent, plus the outline.
- **Hue shift:** shadows move toward violet (255°) and gain saturation; highlights move toward warm yellow (55°) and lose a little saturation. This is exactly Moonkai's `shadeColor`, so port it (section 3.1).
- No pillow shading.
- **Dither:** 2x2 checker or 4x4 Bayer, only across large areas such as ground patches, sky gradients and big walls, and for transitions. Never inside characters, except the checker blush on cheeks, as in the Moonkai examples.
- **Contact shadow:** a pixel ellipse under everything that stands, `rgba(42,26,64,0.30)`, width ≈ 0.8× the footprint, height 3–5. Add a 2 px AO band where floor meets wall and under furniture fronts.

### 2.3 Outlines

| Class | Rule |
|---|---|
| Characters and animals (Misa, NPCs, Mochi, pets) | 1 px **ink `#2a1a22`** on the whole silhouette (as Misa now). Interior lines (arm against body, hair clumps) use the material's darkest ramp step, never ink. Eyes and lashes use ink. |
| Props, furniture, interactables | **Selective outline:** each empty pixel touching the sprite gets the neighbour colour darkened and pushed to plum; the **bottom edge is ink** to ground the object. See `selectiveOutline` in `mock.js`. |
| Buildings | Selective outline on the silhouette; eaves get the darkest roof step plus a 3 px shadow on the wall. |
| Ground, decals (paths, rugs, puddles, shadows), FX, particles | No outline. |
| UI | 1 px ink outline plus a 1 px inner highlight on top and left, and an inner shade on bottom and right. |

### 2.4 Master palette (rendered in `pal-swatch.png`)

Ramps run dark to light. Index 2 is usually the base. The five-step ones are `[deep, shade, base, light, highlight]`. Use `src/gfx/palette.js`:

```js
export const RAMPS = {
  ink:        ['#1e1624','#2a1a22','#4a3348','#6b5068'],        // [UI deep, CHARACTER INK, soft line, disabled]
  paper:      ['#8a7868','#c9b8a2','#f4e4c1','#fff1d6','#fffaf0'],
  // skin
  skinLight:  ['#8f5552','#c4826f','#e3a98a','#f8d5b8','#fff0e2'], // Misa = [3] base, [2] shade
  skinTan:    ['#7d4d45','#b07760','#d6a07c','#f2c9a4','#fde6cf'],
  skinDeep:   ['#4f2c30','#76403f','#9c5f4a','#c68a62','#e0b088'],
  // hair
  hairBrown:  ['#3a2228','#5a3a2e','#8b5a44','#b98262','#e0b08a'], // Misa
  hairBlack:  ['#141220','#24203a','#38334f','#5a5478','#8a84aa'],
  hairBlonde: ['#7a4e2a','#c4943e','#e8c56a','#f8e7a0','#fffbe0'],
  hairPink:   ['#7a2650','#d6508c','#ff85b8','#ffc2dc','#fff0f6'],
  hairBlue:   ['#1e2f6a','#3a6fc4','#6fb3f2','#bfe3ff','#f0faff'],
  hairSilver: ['#4a4a66','#8f8fae','#c8c8dc','#f2f2fa','#ffffff'],
  hairRed:    ['#5c1a26','#8f1f2e','#d93b3b','#ff7a6b','#ffc0a8'],
  hairPurple: ['#2a1a5c','#5b3fa8','#9474e0','#c9b3ff','#f0e8ff'],
  hairGinger: ['#5a2a1a','#a24a2a','#d9763f','#f5a868','#ffd8b0'],
  hairGreen:  ['#1f3d34','#2f6b52','#4fa078','#8fd0a4','#d8f5e0'],
  // cloth / signature colours
  navy:  ['#1f2840','#2c4270','#3d5a8c','#5f80b4','#8aa8d8'],   // Misa's hoodie
  coral: ['#6a2a3a','#bd5460','#e0707a','#f29aa0','#ffd0cc'],
  mint:  ['#2d5a50','#5eaa92','#86cdb0','#b8e6d2','#e8fff4'],
  butter:['#8a5a1e','#e0a84a','#ffd76a','#ffeaa0','#fffbe0'],
  sky:   ['#2d4a7a','#5a8cc0','#7fb2e0','#bfe6f5','#effaff'],
  lilac: ['#3d2a6a','#7a5cb0','#b89ae0','#ddd0f5','#f8f2ff'],
  charcoal:['#141220','#262436','#3a3850','#5a5874','#8a88a4'],
  denim: ['#141a2c','#1f2840','#2a3552','#3f4c70','#6a7aa0'],
  forest:['#1f3d2e','#2f5f40','#4f8a58','#7fb87a','#c0e6a8'],
  ribbon:['#5c1220','#a22633','#e43b44','#ff7a80','#ffc4c4'],     // school uniform tie / bows
  // materials
  wood:     ['#4f3028','#7a4f3a','#a67548','#d3a574','#f0c890'],
  woodDark: ['#2e1c1e','#4a2e2a','#6a4436','#8f6248','#b88a62'],
  plaster:  ['#8a6a6a','#c5a58e','#d9bfa8','#f0dcc8','#fff4e8'],
  stone:    ['#3a3448','#575064','#7d7480','#aaa3a0','#d4cfc8','#f2efe8'],
  brick:    ['#4a2430','#7a3a3e','#a8524a','#cc7660','#e8a088'],
  roofRed:  ['#5a2430','#8f3a3a','#c45a46','#e8866a','#f8b898'],
  roofSlate:['#262c48','#36406a','#4c5c8c','#6f84b0','#a0b4d8'],
  roofTeal: ['#1a3a44','#2a5a62','#3f8080','#62a8a0','#a0d4c4'],
  metal:    ['#3a4250','#5a6678','#8a9aab','#b9c6d2','#e8f0f6'],
  vermilion:['#5a1a1e','#a02a28','#e0503a','#f4805a','#ffb090'], // torii, shrine
  chalkboard:['#1e3430','#2a4a40','#3f6a5a','#5e8a76','#e8f0e0'],
  // nature (season-swapped, see materials())
  grass:      ['#2f4f44','#4a7650','#6a9c56','#94c06a','#c4dc84','#f0f4b8'],
  grassSpring:['#2f5048','#4a7a58','#6aa45e','#9ccc74','#cce690','#f4f8c4'],
  grassAutumn:['#4a3a2e','#6e5a36','#988040','#c0a050','#e0c470','#f8e8a8'],
  grassWinter:['#4a5a6c','#6a8090','#90a8b0','#c0d4dc','#e8f0f6','#ffffff'],
  leaf:       ['#1f3a36','#2f5a44','#4a8050','#74a85a','#a8cc70'],
  leafAutumn: ['#5a2420','#a8402a','#e07a34','#f4b048','#ffe08a'],
  sakura:     ['#a8406a','#e07a9a','#f4a8c0','#ffd0e0','#fff0f6'],
  water:      ['#1f3a66','#2d5f8f','#3f8fb8','#6cc4dc','#a8e4f0','#e8fbff'],
  sand:       ['#8a6a4a','#c4a070','#e0c48e','#f2dcaa','#fff2d0'],
  dirt:       ['#5a3a2e','#8a5e44','#b08560','#d0a87c','#e8cca0'],
  snow:       ['#5a6a8c','#8a9cc0','#c0d0e8','#e8f0fa','#ffffff'],
};
export const EYES = {               // [ink-adjacent dark, iris dark, iris base, iris light/reflect]
  brown: ['#4a2414','#7a4020','#b0703c','#e0a868'], blue: ['#0f2a66','#1f5fbf','#4aa8f0','#9ed8ff'],
  green: ['#146b45','#2fb36b','#7ae8a8','#d8ffe8'], violet: ['#2a0a5c','#5a1fb3','#a066ff','#e6ccff'],
  amber: ['#8a4210','#e08a1e','#ffc94a','#fff1b8'], grey: ['#2e2a3d','#5a5478','#8f8fae','#d8d8e8'],
};
export const UI = { ink:'#2a1a22', deep:'#1e1624', night:'#2b1d2e', paper:'#fff1d6', paper2:'#f4e4c1',
  text:'#fff8e8', textDark:'#2a1a22', gold:'#ffd76a', coral:'#e0707a', mint:'#86cdb0', disabled:'#8a7868',
  shadow:'rgba(30,22,36,0.5)', worldShadow:'rgba(42,26,64,0.30)' };
```

**Sky gradients** (top → horizon, banded with a 4 px Bayer dither between bands):

| Time | Colours |
|---|---|
| Day | `#7fc8f0 #a8dcf5 #d4f0fa` |
| Dawn | `#6a5a9a #f4a08a #ffd8a8` |
| Sunset | `#4a3a7a #e0707a #ffb070` |
| Night | `#0e0c24 #1b1b3a #2e2a5a` (stars `#fffaf0`, twinkle `#8a7fb0`) |

**Time-of-day grade.** This is a multiply colour: white means no change. Lerp in RGB between the keyframes:

```js
export const DAY_GRADE = [ // [hour, multiply colour]
  [0, '#3e3c7a'], [4.5, '#3e3c7a'], [5.5, '#6a6aa8'], [6.3, '#e8b8c0'], [7.5, '#fff0e0'], [10, '#ffffff'],
  [16, '#ffffff'], [17.3, '#ffe2b8'], [18.5, '#e8a0a0'], [19.3, '#a090c8'], [20.5, '#4c4a8c'], [24, '#3e3c7a'] ];
// Interiors use mix('#ffffff', grade, 0.55): rooms dim less, and lamps carry the night.
```

**Season swap and grade:**

| Season | Grass / leaf ramps | Flowers | Grade (multiply) | Extras |
|---|---|---|---|---|
| Spring | grassSpring / leaf + **sakura** trees | sakura[2], lilac[3], paper[4] | `#fff6f8` | falling petals |
| Summer | grass / leaf | coral[2], butter[2], lilac[2] | none (+5% saturation) | fireflies, heat haze at the beach |
| Autumn | grassAutumn / **leafAutumn** | leafAutumn[2], butter[1], coral[1] | `#fff0dc` | leaf litter decals, falling leaves |
| Winter | grassWinter / bare branches | none (snow[4]) | `#eef4ff` | snow caps, frozen pond, breath puffs |

**Weather grade** (multiplied on top of the day grade):

| Weather | Grade | Extra |
|---|---|---|
| Rain | `#b4c0d4` | plus `globalCompositeOperation='saturation'` grey fill at 0.25 |
| Storm | `#8f9ab8` | flash frames |
| Snow | `#e4ecfa` | |
| Fog | none | dithered white drift layers |
| Overcast | `#d0d4dc` | |

### 2.5 Outdoor tilesets (procedural recipes)

Everything below is drawn in world-space pixel coordinates, so noise never repeats per tile. It is baked once per map, season and wetness into 256x256 chunk canvases. Only animated layers (water glints, foam, flowers, light) are drawn per frame or as N baked frames. Techniques referenced as (3.x) are in Part 3.

1. **Grass** (3.3)
   - Base is `grass[3]`. Macro patches use value noise at scale 28 px: `> .66 → grass[4]`, `< .32 → grass[2]`, with the threshold jittered by Bayer so patch edges dither.
   - Per 8x8 cell, a hash decides: 28% chance of a tuft (a 3x2 "v" in `[4]` with `[1]` at its feet); 5% chance of a flower (4-pixel cross plus a butter centre).
   - Variants:
     - **tall grass**: 2 px blades, sways ±1 px with the wind phase;
     - **meadow**: flower density 15%;
     - **lawn**: no macro patches, regular mow stripes every 16 px in `[3]`/`[4]`.
2. **Paths and plazas: dual-grid autotile** (3.4)
   - Mappers paint terrain on *corners*. Each pixel takes the bilinear blend of its tile's 4 corners, plus noise × 0.22; inside if > 0.5.
   - Edge rules:

     | Where | Pixels | Colour |
     |---|---|---|
     | Path, grass above | top 2 px of the path | `dirt[1]` (grass-lip shadow) |
     | Path, grass left/right | side edge pixels | `dirt[2]` |
     | Grass, path below | grass rim | `grass[1]` |
     | Grass, path above | grass lip | `grass[4]` |

   - Fill is `dirt[3]` with a Bayer-dithered `dirt[2]` mottling and 1.5% pebbles (`dirt[1]` pixel plus a `dirt[4]` pixel to its right).
   - **Paved** variants use the same mask, filled with a brick or stone course pattern instead:
     - sidewalk: 16x16 slabs, grout `stone[2]`, top-left bevel `stone[4]`;
     - plaza: herringbone 8x4;
     - shrine gravel: `stone[4]` with raked arcs in `stone[3]`.
3. **Water** (3.5)
   - Same dual-grid mask. Shallow is `water[3]`; deep is `water[2]` where field > 0.85.
   - A 2 px bank shadow `water[1]` sits under the top edge (the bank overhang), and the shore pixels outside the water get `sand[1]` or `grass[1]`.
   - Animation:
     - **foam** `water[5]` on edge pixels where `(x+y+frame)%5<3` (it crawls around the shore);
     - **glints** `water[4]`: 3–4 px dashes on rows `y%7==3` sliding with t;
     - 4 frames at 6 fps.
   - Ocean adds depth bands by distance from shore (`[4]→[3]→[2]→[1]`). The beach shoreline row offset is `round(3·sin(t·π + y·0.3))`, so wet sand (`sand[1]`) breathes with the waves.
   - Winter freezes the pond: `#c0d8ec`/`#d8e8f4` with white crack glints.
4. **Trees** (3.6)
   - Trunk 7 px wide in the woodDark ramp, lit on the left, with a root flare.
   - Canopy is 5–7 overlapping pixel discs, drawn in three passes, each offset up-left: `leaf[1]` shadow mass → `leaf[2]` mid (r−3) → `leaf[3]` lit clusters (r−8). Add 2x1 `leaf[4]` sparkle pixels on the lit side and `leaf[0]` holes on the shadow side.
   - Kinds: apple (fruit dots in autumn), sakura (spring ramp), maple (autumn vermilion), pine (stacked triangles in `forest`), palm (beach).
   - Winter: bare branch lines plus snow pixels on top of the branches.
   - Split each tree into a trunk (y-sorted) and a canopy (drawn above characters, with a dithered see-through window when Misa is behind it, 3.13).
5. **Buildings** (3.7: `facade(spec)`)
   - Front-facing ¾ view: roof plane seen from above (48–64 px) over a wall face (64–72 px).
   - **Kawara roof:**
     - vertical ridges every 6 px (`[3]` lit left, `[1]` and `[0]` right);
     - course lines every 10 px (`[0]`/`[1]` with a `[3]` lip);
     - ridge band `[4]`, eave `[0]` plus a 3 px shadow on the wall.
   - The first mock attempt (staggered seams) read as brick, so don't do that.
   - Other roof styles:
     - **slate**: diamond shingles, 4x3 offset;
     - **tin**: vertical seams every 4 px;
     - **flat** (school, shops): parapet plus AC units.
   - Walls:
     - **plaster**: corner posts lit/shaded and a wainscot rail;
     - **wood siding**: 4 px boards with `[1]` drop lines;
     - **brick**: 8x4 courses offset half a brick.
   - Windows 28x26:
     - frame `woodDark[2]`;
     - glass `sky[2]` with a `sky[3]` top band and two 2x2 reflection pixels on a diagonal;
     - curtains in the owner's signature ramp;
     - **at night the glass is `butter[3]` and emissive, and casts a light pool.**
   - Doors 28x50: panels, knob, step. Shop doors are glass with an "OPEN" sign.
   - Awnings: stripes of 3–6 px in two ramps, with a scalloped bottom edge (alternating 1 px).
   - **Noren:** 3–4 cloth panels with a white icon.
   - Chimney, flower boxes, potted plants, AC unit, satellite dish, laundry pole and cat on the roof (rare) are all decor slots.
6. **Fences**: posts every 16 px with a top cap `[4]` and 2 rails with a `[1]` underside. Variants: picket (pointed posts), bamboo (`forest` ramp with nodes every 6 px), stone wall (stone courses), hedge (bush generator, tiled).
7. **Signs**: post plus board `wood[3]` with an inner panel `wood[4]` and a 5x5 icon. Shop signs are a hanging board on a bracket with the text in the 3x5 font. A-frame café board is chalkboard ramp with chalk scribble lines. Street name plates are `sky[1]` with white text. Bus stop, vending machine (glows at night), post box, utility pole with catenary wires (3.8), traffic mirror, bike rack.
8. **Street**: asphalt `charcoal[2]` with `charcoal[1]` speckle, white lane dashes, zebra crossings 4 px stripes, curbs (1 px `stone[4]` top plus 1 px `stone[1]` face), manholes, puddle decals when wet.
9. **Places** (set dressing):
   - **Café:** terrace tables and umbrellas, string lights at night (light sources every 12 px on a sagging curve).
   - **Park:** fountain (water ring plus spray particles), flower beds, benches, playground, duck pond.
   - **Beach:** sand ramp, foam line, shells, umbrellas, pier planks over water with gaps showing water.
   - **Shrine:** stone steps, vermilion torii, stone lanterns lit at dusk, shimenawa rope, ema boards, gravel, sakura and maples.

### 2.6 Interiors

- **Walls**:
  - a top cap 8 px (`woodDark[1]` top-down thickness) plus a face 48–64 px with a 4 px baseboard and optional wainscot;
  - the front (bottom) wall of each room is cap only, a cutaway, so it never hides Misa;
  - doorways are cut into the wall with a threshold strip. Delete the stray door tiles.
- **Floors**:
  - **planks**: 32x8 boards, staggered seams, per-board ±1 ramp step from a hash, 1–2 grain dashes per board;
  - **kitchen tile**: 16x16 with `[1]` grout and top-left bevel;
  - **bath**: 8x8 mosaic, with random tiles a step lighter;
  - **tatami**: 64x32 mats with cloth-edge borders.
- **Light**:
  - daytime **sun pools**: a parallelogram projected from each window onto the floor, offset by the hour (morning leaning right, evening leaning left), `lighter` at warm white 18%, with drifting 1 px dust motes;
  - night: moonlight pools `#9ab0ff` at 15%;
  - lamps are light sources.
- **AO**: a 2 px darker band on the floor along walls and under furniture.
- **School sets**:
  - **Classroom:** desk grid, blackboard with chalk scribbles (random 1 px lines in `chalkboard[4]` at 60%), podium, a window wall with strong light pools (the key visual), bulletin board with coloured papers, clock.
  - **Hallway:** lockers (metal ramp tinted sky or mint), a long window row with light pools, glossy linoleum (1 px reflection streaks plus 15% flipped silhouettes of lockers), posters.
  - **Library:** tall shelves where book spines are generated by hash (widths 2–4 px, 8 muted ramps, occasional leaning book), reading tables with green banker lamps (light sources), ladder, carpet.
  - **Gym:** light maple floor (`wood[4]`/`[3]`) with court lines (white, coral, sky), hoops, wall pads, high windows with diagonal light shafts (`lighter` 8%), bleachers.

### 2.7 Characters: NPC sprite and portrait guide (matching Misa)

**World sprite** (frame 48x64, feet at (24,62), rows down / up / side; left is mirrored):

- **Construction copies Misa**, about 2.1 heads tall.
  - Head 22–24 px wide, hair volume extends 2–3 px past the face.
  - Eye row 6–10 px below the hair top of the face area.
  - Shoulders right under the chin.
- **Eye at sprite scale:** 4 wide x 5 tall.
  - Row 0 is an ink lash with a 1 px outer flick.
  - Rows 1–2 are `EYES[k][1]`, rows 3–4 are `EYES[k][2]`, with a 1 px ink pupil column.
  - 1 px white highlight at the top-left.
  - **No ink on the lower lid** (use `skin[2]`). Leave a **1 px skin gap between bangs and lash**. This is what stops the "glasses" read.
- Mouth 2–3 px `#b04a55`; blush 2x1 `coral[3]` checker on the cheeks.
- Ink silhouette outline; interior lines in the material's `[0]`/`[1]`.
- **Frames, same as Misa:** idle 4 (breathing: chest and arms 1 px), blink 1, walk 6. Each NPC also gets a **role pose** (2–4 frames: shopkeeper wiping, teacher pointing, gardener watering, fisher casting) and an **emote hop** (2 frames).
- **Distinctness, which matters most with 15+ NPCs:**
  - each NPC gets a unique *hair silhouette* (bun, twin tails, ponytail, short spiky, long straight, braid, bob, ahoge, buzz, curly) **plus** one *signature accessory* (glasses, cap, apron, headband, scarf, bow, hood, hairclip, earrings, beard);
  - **plus** a unique *(hair ramp, outfit ramp)* pair from section 2.4;
  - pass the **silhouette lineup test**: render all NPCs solid ink, side by side; each must be nameable.
- **Height classes** are the main differentiator besides the hair. Heads stay roughly constant and body length changes.

**Portrait** (64x64, faces the viewer, same template as Misa's):

- Geometry:
  - face oval centre (32,33), eye line y≈34, chin y≈48–50, neck 8 px, shoulders from y≈52 running off the bottom edge;
  - hair volume must leave ≥ 3 px of background on each side so silhouettes read in the frame.
- **Eyes, 11x12:**
  - a thick ink upper lid (2 px, with a flick at the outer corner);
  - an iris in 4 tones (dark top two rows `EYES[0..1]`, base, light bottom reflect `EYES[3]`) with a 3x4 ink pupil;
  - a 3x3 white highlight at the top-left plus a 2x2 one at the bottom-right;
  - lower lid only as 1 px `skin[1]` at the outer half.
- Brows: 1 px hair `[0]`, 2 px above the lid, ending inside the bangs.
- Nose: 1–2 px `skin[1]`. Mouth: 5–7 px.
- **Hair:**
  - **bangs are 3–5 pointed triangular clumps**, not a rectangle band;
  - side locks taper to points;
  - an **angel-ring** highlight about ⅓ down the crown, made of 2–3 broken arcs in `[4]`/`[3]`;
  - strand lines in `[1]`;
  - back hair `[1]`/`[0]`.
- Shading: one cel shade under the bangs and down the right side of the face (`skin[2]`), a neck shadow `skin[1]`, checker blush.
- Background: the NPC's signature `[4]` with a 2-tone Bayer vignette from `[3]`. The frame is the UI kit's portrait frame.
- **Expression set** (per NPC, a 4-column sheet: mouth closed/open × blink off/on):

  | Mood | Notes |
  |---|---|
  | neutral, happy, surprised | |
  | sad | brows tilted, eyes lowered 1 px |
  | annoyed / pout | |
  | embarrassed | blush lines plus a sweat drop |

  That's 6 moods × 4 = 24 frames (Misa adds sleepy).

**Fix Misa before cloning her construction:**

- Portrait: clump the bangs, separate the lash from the bangs, taper the jaw, move the ring highlight down, add a hoodie collar and drawstrings with a shadow.
- Sheet:
  - drop the side-view `skin2` jaw bar;
  - mirror the streak in the back view;
  - add 2–3 hair clump lines and a nape on the back view;
  - swing the arms ±2 px in the walk.

**Mochi**: redraw the world Mochi at 1:1 as a mini version of the pet-menu Mochi (ink outline, `cat` ramp `['#8a4a22','#b8702f','#d98d45','#f2b56b','#ffd9a0']` with cream `paper[3]` and eye `#6fcf7a`). Sizes are in 2.1. The Feed minigame reuses the pet-menu renderer at a smaller radius, not a 5x sprite.

### 2.8 UI kit

**Fonts**

| Font | Spec | Use |
|---|---|---|
| **Misa Sans** | Proportional, cap height 7, x-height 5, descender 2. Glyph widths 1–5 px plus 1 px spacing; line height 10 (11 in dialogue). Full ASCII plus ♥ ★ ♪ … ▼ ▲ ◆ and the key glyphs. | Dialogue, menus, phone |
| **Tiny 3x5** | Existing font, but **M and W 5 px wide** and N redrawn. | HUD numerals and labels only |
| **Display** | Hand-drawn logo letters at native resolution (12–16 px caps), 2-tone fill (coral `[2]` over `[3]`), a 1 px ink outline, and a 1 px `coral[0]` drop shadow 1 px down. | Logo and big headers, drawn once as sprites |

- Text shadow: 1 px `#1e1624` at 60% down-right. Dark text on paper has no shadow.
- Wrap by **pixel width**, not character count.

**Panels** (procedural 9-slice, 3.11):

- **Paper:** fill `paper[3]`, inner `paper[2]` band, ink outline with cut corners. Menus, shop, diary.
- **Night:** `#2b1d2e` at 94%, cream 1 px rim, ink outline. Dialogue, toasts.
- **Phone:** a charcoal bezel.
- All panels get a 1 px drop shadow.

**Buttons**: 16 px tall with 6 px side padding.
- Normal: paper.
- Hover: `butter[3]` fill and the text 1 px up.
- Pressed: `paper[2]`, 1 px down, no shadow.
- Disabled: `paper[1]` with `ink[3]` text.
- Focus: an animated 1 px dashed gold marching border, or a 7x7 paw cursor to the left.

**Icons**: 16x16 grid with 1 px ink outline, 3-tone fill, top-left light. Core set:
- status: heart (full, half, empty), star, coin/money, clock, sun, moon, cloud, rain, snow, wind, 4 season glyphs;
- phone apps: map, calendar, friends, bag, tasks, messages, camera, settings, music;
- items: tea, bread, fish, kibble, seeds, flowers, book, gift;
- emotes (14x14 bubble): `! ? ♥ … ♪ zzz` and an anger vein.

**HUD** (exploration):
- **Status card** at the top-left, 96x26 (paper panel):
  - line 1 shows the season icon and **"SPR 3 · MON"**;
  - line 2 shows a sun or moon dial icon (the hand rotates over 24 h in 8 steps), the time and a weather icon.
- **Top-right:** stars or money with icons, plus a small phone icon with a notification dot.
- Chores and quests move into the phone, with only the active task pinned under the status card in one line.
- **Interaction prompt:** a 9x9 keycap glyph (E) plus a Misa Sans label in a tiny night panel above the target object, not above Misa. It bobs 1 px at 2 Hz.
- **All HUD drawing happens in screen space,** with no camera subtraction (fixes the current bug).

**Dialogue box**:
- Night panel 304x56 at (8,160). The portrait frame (68x68, paper) overlaps the box's top-left at (12,132).
- The name tab sits on the box top edge in the NPC's signature `[2]`, with `[0]` outline and white text.
- Text area x=86..304, 3 lines.
- Typewriter at 40 cps with pauses (`, ` 120 ms; `.!?` 250 ms) and blip pitch per NPC.
- ▼ in gold bobbing at 2 Hz when the page is done.
- When Misa is in the lower half of the screen, the box moves to the top and the portrait to the box's bottom-left.
- **Choice menu:** a paper panel docked at the right above the box, with a hand cursor and the selected row in a `butter[3]` band.

**MisaPhone** (pressing Tab or the phone icon slides it up):
- Bezel 128x184 at the bottom-right (`charcoal[1]` with a `[2]` rim, rounded corners by cutting 2 pixels, a speaker slot, `[3]` side buttons). Screen 112x156.
- Slides up over 8 frames with integer ease-out positions (`[184,120,76,44,22,10,3,0]`). The world dims behind it with a 50% Bayer pattern of `#1e1624`; don't use alpha.
- **Status bar** (8 px): time, signal bars, battery, weather icon.
- **Home:** a 3x3 grid of 24x24 app icons (rounded squares, each in a ramp `[2]` with `[4]` glyph and a 1 px ink outline) with 3x5 labels under them. The wallpaper is a pixel photo of Mochi; the camera app can replace it.
- Apps:

  | App | Contents |
  |---|---|
  | **Map** | Town map at 1/8 scale (each tile is a 4x4 colour block from its material `[2]`), location pins, Misa's 7x7 head; tap to fast travel with the blinds wipe |
  | **Calendar** | Season page, 4x7 grid with event and birthday icons |
  | **Friends** | List rows of a 16x16 portrait crop, name, and a 10-heart meter of 5x5 hearts; tap to open a 64x64 portrait plus notes |
  | **Bag** | 4x4 grid of 16x16 slots |
  | **Tasks** | Chores and quests with checkboxes |
  | **Messages** | Chat bubbles: NPC on the left in their signature `[3]`, Misa on the right in `navy[3]` |
  | **Camera / Album** | Snapshots of the world canvas into 4:3 thumbnails |
  | **Settings** | |

- Transitions between apps: the screen content slides 112 px horizontally in 6 frames.

**Title and summary**:
- Title scene: a golden-hour exterior of Misa's house built with the town generators (the mockup composition is a good start), Misa and Mochi on the step, the hand-drawn logo, and buttons from the kit.
- Day summary: a **diary page** (paper panel with ruled lines in `sky[3]`, hand-lettered date, a stamp per finished chore, a Mochi doodle).

### 2.9 Lighting, weather, particles

**Lighting** (3.9):
1. Draw the world.
2. Build a lightmap: fill it with the time grade, multiply by the weather grade, then add banded pixel lights with `lighter`.
3. Multiply the lightmap onto the world.
4. Repaint emissives (lit glass, lantern cores, screens, firefly pixels) on top so they aren't darkened.

Light presets (colour, radius, bands):

| Light | Colour | Radius | Bands | Note |
|---|---|---|---|---|
| Lamp | `rgba(120,90,40,.55)` | 46 | 4 | |
| Window | `rgba(110,80,30,.5)` | 30 | 3 | plus a pool on the ground |
| Lantern / candle | `rgba(140,80,30,.6)` | 24 | 3 | flicker ±1 px radius at 8 fps |
| Shrine lantern | `rgba(150,70,30,.6)` | | | |
| Vending machine | `rgba(60,100,140,.5)` | 20 | | |
| Phone / TV screen | `rgba(60,110,150,.4)` | | | |
| Moon pool | `rgba(70,80,140,.35)` | | | |

Ellipses use a 0.75 vertical ratio for the ¾ view.

**Weather** (3.10):
- **Rain:**
  - 2 layers of streaks, far (3 px, 35%, slow) and near (5 px, 65%, fast), slanted 1:2;
  - 3-frame splash sprites on the ground (`^` then `ˆ` then a ring);
  - **puddles** as decal masks that darken the ground one ramp step, with expanding 1 px ripple rings and a 20% flipped-sprite reflection inside;
  - roofs get a wet sheen (an extra `[4]` line per course);
  - umbrellas on NPCs.
- **Storm:** rain plus lightning (a full-screen white at 60% for 2 frames, then 30% for 1 frame, then a 4-frame delay before the thunder SFX), plus grade `#8f9ab8`.
- **Snow:**
  - 3 layers of 1–2 px flakes with sine drift;
  - a snow-cap pass on sprites (3.10);
  - footprint decals behind Misa that fade over 20 s;
  - breath puffs (3 px cloud, 0.6 s) when idle.
- **Fog** (mornings, beach, shrine): 2 full-screen Bayer-dithered white layers at 15% and 25% coverage, scrolling at different speeds.
- **Wind:** grass tufts and canopy edges shift 1 px on gusts; petals or leaves fly.
- **Cloud shadows** (sunny days): large noise blobs at `rgba(42,26,64,.12)` sliding across the ground.
- **Heat haze** (beach, summer noon): offset each canvas row by `round(sin(y*0.2+t*4))` px in the bottom third (draw row strips).
- **Indoors:** weather appears only in window sprites (animated rain streaks, flakes, a grey sky frame) plus the grade and a sun-pool change. **Never draw rain over interiors.**

**Particles** (all 1:1, no outline, palette colours only):

| Particle | Spec |
|---|---|
| Footstep dust (running) | 3 frames, `dirt[4]` |
| Sparkles (pickup, clean, chore done) | 4-point star 1→3→5 px, butter[4]/white |
| Hearts | `coral[2]` with a `[4]` glint |
| Petals / leaves | 2x1 rotating by swapping two shapes |
| Fireflies | `#e8ff9a`, blink 1/4 duty, slow wander |
| Steam (tea, café, bath) | 2–3 px puffs rising and fading through Bayer patterns |
| Bubbles | Ring pixels, sky[4]/white |
| Music notes | Near a radio or the café |
| Emote bubbles | Paper 14x14 with an ink tail, pop-in 3 frames |

### 2.10 Screen transitions (3.12)

| Use | Transition | Duration |
|---|---|---|
| Door / room change | Bayer dither to `#1e1624` (17 patterns), swap map, dither back | 0.25 s each way |
| Sleep / day end | Pixel iris closing on Misa's head, hold black with the diary card, iris opens on the morning sun pool | 0.6 s each way |
| Fast travel (phone map) | Horizontal blinds: 8 px bars close top→bottom with a 1-frame stagger | 0.35 s |
| Cutscene start / end | 16 px letterbox bars slide in / out (integer steps) | 0.2 s |
| Minigame enter | Diamond wipe from the station's screen position, then the close-up card slides up 24 px | 0.3 s |
| Season change (morning 1) | Full-screen calendar page card: the old month page tears off as a 3-frame peel | 1.2 s |
| Fade to black (story) | Multiply by greys `#c0c0c0 → #808080 → #404040 → #000` in **4 quantised steps** | 0.4 s |

---

## 3. Implementable techniques (plain canvas 2D, procedural)

Working versions of 3.2–3.6, 3.8 (selective outline) and 3.9 are in `scratchpad/agents/art/mock.js` and render `mock-grid.png`.

### 3.1 Ramps, hue-shift and season materials

```js
// Port of Moonkai's shadeColor: shift hue TOWARD 55° (highlights) / 255° (shadows), not by a constant.
export function shadeHex(hex, dir, amt /* 0..30 (L%) */) {
  let [h, s, l] = rgbToHsl360(hexToRgb(hex));            // h in degrees, s/l in %
  l = clamp(l + dir * amt, 0, 100);
  const target = dir > 0 ? 55 : 255, d = ((target - h + 540) % 360) - 180;
  h += clamp(d, -amt * 1.2, amt * 1.2);
  s = clamp(s + (dir > 0 ? -amt * 0.25 : amt * 0.35), 0, 100);
  return rgbToHex(hslToRgb360(h, s, l));
}
export const rampFrom = (base) => [-2, -1, 0, 1, 2].map((i) => i ? shadeHex(base, Math.sign(i), Math.abs(i) * 11) : base);

export function materials(season) {          // the only place season touches colours
  const R = RAMPS;
  return { ...R,
    grass: { spring: R.grassSpring, summer: R.grass, autumn: R.grassAutumn, winter: R.grassWinter }[season],
    leaf:  season === 'autumn' ? R.leafAutumn : R.leaf,
    flower:{ spring: [R.sakura[2], R.lilac[3], R.paper[4]], summer: [R.coral[2], R.butter[2], R.lilac[2]],
             autumn: [R.leafAutumn[2], R.butter[1], R.coral[1]], winter: [R.snow[4]] }[season] };
}
// Tile/prop draw functions receive C = materials(season) and use C.grass[3] etc. Never a hex literal.
// On season change: clear the sprite and chunk caches and rebake.
```

### 3.2 Hash, value noise, Bayer

```js
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function vnoise(x, y, seed, scale) {            // smooth 0..1, world-pixel coordinates
  const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;   // 0..1 threshold
```

### 3.3 Grass (bake per chunk)

```js
for each pixel (x, y) of the chunk (world coords):
  if (terrain !== 'grass') continue;
  const n = vnoise(x, y, 1, 28), j = (bayer(x, y) - 0.5) * 0.1;
  let col = n > 0.66 + j ? G[4] : n < 0.32 + j ? G[2] : G[3];
  if (inPath(x, y + 1) || inWater(x, y + 1)) col = G[1];      // rim above a path
  else if (inPath(x, y - 1) || inWater(x, y - 1)) col = G[4]; // lit lip below a path
  put(x, y, col);
for each 8x8 cell (cx, cy):                                    // decorations by hash, never on path/water
  const h = hash(cx, cy, 7), x = cx + floor(hash(cx, cy, 8) * 6), y = cy + floor(hash(cx, cy, 9) * 6);
  if (h < 0.28) tuft(x, y);                       // [1] feet, [4] blades, [5] tip
  else if (h < 0.33) flower(x, y, C.flower[floor(hash(cx, cy, 10) * C.flower.length)]);
```

### 3.4 Dual-grid autotiling (paths, water, sand, snowbanks)

```js
// Maps store terrain per CORNER (vertex grid (W+1)x(H+1)). No 47-tile blob set to author: every
// combination falls out of the field. Rounded, organic edges, deterministic.
function field(mask, x, y, seed) {                    // x, y in world px
  const cx = x / T, cy = y / T, ix = Math.floor(cx), iy = Math.floor(cy), u = cx - ix, v = cy - iy;
  const a = mask(ix, iy), b = mask(ix + 1, iy), c = mask(ix, iy + 1), d = mask(ix + 1, iy + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v + (vnoise(x, y, seed, 6) - 0.5) * 0.22;
}
const inside = (mask, x, y) => field(mask, x, y, mask.seed) > 0.5;
// path fill + edge rules (top-left light, 3/4 view)
if (inside(path, x, y)) {
  let col = vnoise(x, y, 4, 9) > 0.62 && bayer(x, y) < 0.5 ? D[2] : D[3];
  if (!inside(path, x, y - 1) || !inside(path, x, y - 2)) col = D[1];   // grass lip shadow
  else if (!inside(path, x - 1, y) || !inside(path, x + 1, y)) col = D[2];
  if (hash(x, y, 3) > 0.985) { col = D[1]; put(x + 1, y, D[4]); }       // pebble
}
// Performance: bake once into 256x256 chunk canvases (or cache per tile keyed by the 4 corners + variant).
```

### 3.5 Water animation

```js
// Baked 4 frames per water chunk at 6 fps (or drawn live for small ponds).
if (inside(water, x, y)) {
  const f = field(water, x, y, 23), edge = !inside(water, x, y - 1) || !inside(water, x - 1, y) || !inside(water, x + 1, y) || !inside(water, x, y + 1);
  let col = f > 0.85 ? W[2] : W[3];
  if (!inside(water, x, y - 1) || !inside(water, x, y - 2)) col = W[1];          // bank shadow
  if (edge && inside(water, x, y - 1) && (x + y + frame) % 5 < 3) col = W[5];      // crawling foam
  const wv = (x + frame * 6 + Math.floor(Math.sin(y * 0.7) * 3)) % 23;             // sliding glints
  if (f > 0.8 && y % 7 === 3 && wv < 4) col = W[4];
}
// Alternative: palette cycling. Draw water as ramp INDICES into a Uint8Array once; each frame map
// idx -> RAMPS.water[(idx + phase) % n] for animated indices only (cheap, very "SNES").
// Reflections (P3): draw y-flipped character into an offscreen, mask to the water field, 35% alpha, 1-px row jitter.
```

### 3.6 Tree generator

```js
function tree(seed, kind, C) {                    // returns { trunk, canopy } canvases
  const L = kind === 'sakura' ? C.sakura : C.leaf;
  trunk: R(25,44,7,26,C.woodDark[2]); R(25,44,2,26,C.woodDark[3]); R(30,44,2,26,C.woodDark[1]); flare R(22,66,13,4,..);
  const blobs = [[28,28,20,18],[16,34,11,10],[40,34,11,10],[22,18,12,11],[36,18,12,11],[28,40,14,8]]
                .map(([x,y,rx,ry]) => [x + round((hash(seed,x)-.5)*4), y, rx, ry]);   // per-seed jitter
  for (b of blobs) disc(b.x, b.y, b.rx, b.ry, L[1]);              // shadow mass
  for (b of blobs) disc(b.x-2, b.y-3, b.rx-3, b.ry-3, L[2]);      // mid
  for (b of blobs.slice(0,5)) disc(b.x-4, b.y-6, max(2,b.rx-8), max(2,b.ry-8), L[3]);  // lit clusters
  26x: 2x1 L[4] glints on the upper-left half;  14x: 2x2 L[0] holes on the lower half;
  autumn apples / spring blossoms: 3x3 dots by hash;  winter: branch lines + snow pixels instead of blobs;
  selectiveOutline(canopy); selectiveOutline(trunk);
}
```

### 3.7 Facade generator

```js
facade({ w: 5 /*tiles*/, wall: 'plaster'|'woodSiding'|'brick', roof: 'roofRed'|'roofSlate'|'roofTeal'|'flat',
         roofH: 52, wallH: 70, door: { x: 2, style: 'wood'|'glass'|'noren' }, windows: [0.5, 3.5],
         awning: ['mint','paper'], sign: { text: 'CAFE', icon: 'cup', ramp: 'coral' },
         decor: ['flowerBox','chimney','vending','bikeRack','acUnit'], owner: 'hana' }, C, { night, season })
// -> { base: canvas (wall, y-sorted at the wall bottom), top: canvas (roof, drawn above actors),
//      solid: [x,y,w,h], doorTrigger: [x,y,w,h], lights: [{x,y,r,col,bands}], emissive: [[x,y,w,h,col]] }
// Order: wall fill + material pattern -> corner posts -> wainscot/skirting -> windows (glass, reflections,
// curtains in owner's ramp, sill, flower box) -> door -> awning/noren -> sign -> roof (pattern by type,
// ridge [4], eave [0] + 3px wall shadow) -> winter snow cap pass -> selectiveOutline(base/top)
// Kawara: for x step 6: col x [3], x+4 [1], x+5 [0]; for y step 10: [0] line, [1] under, [3] lip above.
```

### 3.8 Selective outline (props) and snow-cap pass

```js
function selectiveOutline(canvas, ink = '#2a1a22') {          // see mock.js for the full version
  for each transparent pixel p with opaque 4-neighbours N:
    if (opaque(above p) && !opaque(below p)) p = ink;          // bottom edge grounds the object
    else p = avg(N) * [0.42, 0.36, 0.42] + [14, 8, 26];        // darker + pushed to plum
}
function snowCap(canvas, C) {                                   // winter variant of any prop or roof
  for each opaque pixel (x,y) whose (x,y-1) is transparent: set C.snow[4]; if opaque(x,y+1) && bayer(x,y) < .5: set (x,y+1) C.snow[3];
}
```

### 3.9 Lightmap (multiply) with banded pixel lights

```js
const LM = canvas(VW, VH), l = LM.getContext('2d');
function light(frameGrade, weatherGrade, lights, emissive) {
  l.globalCompositeOperation = 'source-over'; l.fillStyle = frameGrade; l.fillRect(0, 0, VW, VH);
  if (weatherGrade) { l.globalCompositeOperation = 'multiply'; l.fillStyle = weatherGrade; l.fillRect(0, 0, VW, VH); }
  l.globalCompositeOperation = 'lighter';
  for (const L of lights) for (let k = 0; k < L.bands; k++) {           // discrete rings, no AA
    const rr = Math.round(L.r * (1 - k / L.bands)), ry = Math.round(rr * 0.75);
    l.fillStyle = L.col;
    for (let y = -ry; y <= ry; y++) { const w = Math.floor(rr * Math.sqrt(1 - (y * y) / (ry * ry))); l.fillRect(L.x - w, L.y + y, 2 * w + 1, 1); }
  }
  g.globalCompositeOperation = 'multiply'; g.drawImage(LM, 0, 0); g.globalCompositeOperation = 'source-over';
  for (const [x, y, w, h, c] of emissive) { g.fillStyle = c; g.fillRect(x, y, w, h); } // lit glass, lantern cores
}
// grade(hour) = lerpRGB between DAY_GRADE keyframes; interiors: mix('#ffffff', grade, 0.55).
// Iterate OUTPUT rows (as above). Scaling y inside the loop double-adds rows under 'lighter' and makes stripes.
```

### 3.10 Weather particles

```js
// Rain: fixed pool, positions are pure functions of (i, t) so no per-frame allocation.
for (let i = 0; i < 110; i++) { const far = i % 3 === 0, sp = far ? 160 : 260;
  const x = mod(hash(i,2,2) * (VW+40) - t * sp / 4, VW + 40), y = mod(hash(i,3,3) * VH + t * sp, VH);
  g.fillStyle = far ? 'rgba(200,220,240,.35)' : 'rgba(225,240,255,.65)';
  for (let k = 0; k < (far ? 3 : 5); k++) g.fillRect(x - (k >> 1), y + k, 1, 1); }
// splashes: 14 per frame at hashed positions (only on outdoor ground), 3-frame sprite.
// Snow: 3 layers, x += sin(t*1.3 + i)*6 drift, 1-2 px; Fog: two createPattern() Bayer-25%/15% white layers scrolled.
// Lightning: flashT -> white at [0.6,0.6,0.3] alpha for 3 frames, SFX after 4 frames.
```

### 3.11 9-slice panel (procedural, no image assets)

```js
const STYLE = { paper: { ink:'#2a1a22', fill:'#fff1d6', hi:'#fffaf0', lo:'#f4e4c1', shadow:'rgba(30,22,36,.5)' },
                night: { ink:'#1e1624', fill:'rgba(43,29,46,.94)', hi:'#fff1d6', lo:'#4a3348', shadow:'rgba(30,22,36,.5)' } };
function panel(g, x, y, w, h, s) {
  rect(g, x + 1, y + h, w - 1, 1, s.shadow); rect(g, x + w, y + 1, 1, h - 1, s.shadow);         // drop shadow
  rect(g, x + 1, y, w - 2, 1, s.ink); rect(g, x + 1, y + h - 1, w - 2, 1, s.ink);                // outline,
  rect(g, x, y + 1, 1, h - 2, s.ink); rect(g, x + w - 1, y + 1, 1, h - 2, s.ink);                // cut corners
  rect(g, x + 1, y + 1, w - 2, h - 2, s.fill);
  rect(g, x + 1, y + 1, w - 2, 1, s.hi); rect(g, x + 1, y + 1, 1, h - 2, s.hi);                  // bevel
  rect(g, x + 1, y + h - 2, w - 2, 1, s.lo); rect(g, x + w - 2, y + 1, 1, h - 2, s.lo);
}
```

### 3.12 Transitions

```js
// Dither fade: 17 cached 4x4 patterns. One fillRect per frame, no per-pixel loop.
const FADE = Array.from({ length: 17 }, (_, th) => { const c = canvas(4, 4), x = c.getContext('2d'); x.fillStyle = '#1e1624';
  BAYER4.forEach((v, i) => v < th && x.fillRect(i & 3, i >> 2, 1, 1)); return g.createPattern(c, 'repeat'); });
const ditherFade = (p) => { g.fillStyle = FADE[Math.round(clamp(p, 0, 1) * 16)]; g.fillRect(0, 0, VW, VH); };
// Iris: black overlay with a row-span pixel circle cut out (radius quantised to even px).
function iris(cx, cy, r) { o.fillStyle = '#1e1624'; o.fillRect(0, 0, VW, VH); o.globalCompositeOperation = 'destination-out';
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); o.fillRect(cx - w, cy + y, 2 * w + 1, 1); }
  o.globalCompositeOperation = 'source-over'; g.drawImage(O, 0, 0); }
// Blinds: for bar i (8 px tall): h = clamp((p * 1.4 - i * 0.03) * 8, 0, 8) |0 ; fillRect(0, i*8, VW, h)
```

### 3.13 Occlusion x-ray for roofs and canopies

```js
// When Misa's bounds intersect a 'top' layer (canopy/roof) drawn after actors:
tmp.drawImage(top, 0, 0); tmp.globalCompositeOperation = 'destination-out';
for each pixel in an ellipse (r=18) around Misa's head (local coords): if (bayer(x, y) < 0.5) tmp.fillRect(x, y, 1, 1);
// use a cached 36x36 dithered-ellipse stamp instead of the loop; then draw tmp.
```

### 3.14 Proportional font

```js
// glyph = [width, rows...] on a 9-row cell (7 cap + 2 descender); '#' = ink.
const MISA_SANS = { A: [5, '.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#', '.....', '.....'],
                    g: [4, '....', '....', '.###', '#..#', '#..#', '.###', '...#', '#..#', '.##.'], /* … */ };
// Bake every glyph once per colour into an atlas canvas; drawText = drawImage per glyph; x += w + 1.
// measure(s) = sum(w + 1) - 1; wrap(s, maxPx) by words using measure().
```

### 3.15 NPC painter (generalised `misa-studio.mjs` → `tools/studio-cast.mjs`)

```js
// One spec per NPC; parts are small functions per direction that call the Studio's own tools on its anime layers
// (Flats, Shading, Highlights, Line Art), so every NPC also gets a .pxs.json artists can repaint by hand.
{ id: 'hana', role: 'cafe', height: 'adult', skin: 'skinTan', eyes: 'amber',
  hair: { back: 'long', front: 'sideSwept', tie: 'bun', ramp: 'hairBlack' },
  top: { style: 'apron', ramps: ['paper', 'coral'] }, bottom: { style: 'skirt', ramp: 'denim' },
  accessory: 'glasses', signature: 'coral', voicePitch: 1.1 }
// paint(dir, frame): shadow -> hairBack -> legs/bottom -> torso/top -> far arm -> head skin -> face(eyes, mouth, blush)
//   -> hairFront -> near arm -> accessory -> clip shading/highlights to flats -> ink silhouette outline (Line Art)
// Anatomy constants shared with Misa (eye row, shoulder row, feet [24,62] in the 48x64 frame) so rigs line up.
// Outputs: assets/cast/<id>.png (11x3 frames), <id>_portraits.png (4 cols x moods), <id>.pxs.json, plus
// assets/cast/_lineup.png (all NPCs side by side, colour + solid-ink silhouette rows) for review.
```

The new `src/gfx/chars.js` falls back to a palette swap of Misa when an NPC sheet is missing. That's fine as a placeholder, but **never ship it**: every NPC would share Misa's exact silhouette and hair shape.

---

## 4. Priorities and order of work

**P1: foundation, before any town content**

1. **Density and scale.** `hd` sprite path with no EPX for world art; scale chart; redraw Mochi (1:1, about 24 px tall sitting) and Pip (on the NPC template).
2. **Palette.** `src/gfx/palette.js` (RAMPS, EYES, UI, DAY_GRADE, `materials(season)`); port Moonkai's target-hue `shadeColor` into `color.js`; replace hex literals; one ink.
3. **Light, outline and shadow rules.** Apply them to the existing house props: selective outline, pixel-ellipse plum shadows, AO bands.
4. **Bugs.**
   - HUD icons go through the camera.
   - Rain is drawn indoors.
   - Stray `DOORS` tiles `[7,4] [13,4] [9,10]`.
   - Rectangle shadows.
   - Title shadow contrast.
   - The 3x5 M/W/N glyphs.
5. **Fonts and dialogue box** (Misa Sans, pixel-width wrap, portrait overlap, NPC name tabs, punctuation pauses).
6. **Lightmap pipeline** with time-of-day keyframes, light presets and emissives. Remove the AA blackout arcs.
7. **NPC painter, portrait template and lineup test.** Fix Misa's portrait and sheet issues first.
8. **Ground generators:** grass, dual-grid paths and water, chunk baking (start from `mock.js`).

**P2: expansion content**

9. Facade, tree and street-furniture generators; roof and canopy layer with x-ray.
10. Seasons (ramp swap and grade) and weather (rain, storm, snow, fog, wind, cloud shadows) plus particles.
11. UI kit (9-slice, buttons, icon set), HUD status card, MisaPhone and its apps.
12. Transitions (dither, iris, letterbox, blinds, diamond, calendar card).
13. Interior upgrade (walls, floors, sun pools, AO) and school sets; café, shop, library and gym props.
14. Minigames rebuilt at 1:1 in a shared close-up card:
    - dishes: grime blobs with dithered edges and a hand holding the sponge;
    - sweep: world planks, dust bunnies, a dustpan in perspective;
    - laundry: shirt polygons with a 3-frame fold and arrow icons;
    - plants: a proper watering can and 4 growth stages;
    - feed: the pet-menu Mochi renderer;
    - pet: fix the box sleeve.
15. Storybook scenes restaged (window seat, from behind); title scene from the town generator; diary-page summary.

**P3: polish**

- Water reflections; palette-cycling water and waterfalls; heat haze; parallax skies for storybook scenes.
- 96x112 bust portraits for key story beats.
- A run cycle and chore poses for Misa; NPC role poses and emotes.
- A LUT colour grade (per-pixel palette remap) to replace multiply for the richest dusk and night.
- An optional 384x216 (16:9, 5x = 1080p) logical canvas, if the town feels cramped at 10x7 tiles. Decide **before** building the UI kit.

---

## 5. Notes on the mockup (`mock-grid.png`)

- It shows that Misa's Studio sheet sits naturally among procedural 32 px tiles drawn at 1:1. She reads as the focal point because of her ink outline against the selectively outlined props.
- It also validates the scale rules: the door (28x50) is taller than Misa, and the lamp post and trees tower over her.
- Mistakes made while building it, which the programmer should avoid:
  - Staggered roof seams read as **brick**; use vertical kawara ridges.
  - A first door at 26x38 was **shorter than Misa**.
  - Light ellipses scaled in y inside the loop produced **stripes** under `lighter`; iterate over output rows.
  - Noise-threshold snow on paths looks **camouflage-blotchy**; drive snow from the path field instead.
- `mock.js` is reference code written for clarity, not speed. The per-pixel field calls should be baked into chunk canvases, as described in 3.3–3.5.
