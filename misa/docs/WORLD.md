# World contract: maps, connections, spots, ids, ownership

Everyone builds against this file. If you own a map you **must** provide every spawn and spot listed for it (the
validator fails otherwise), and you may add more. If you don't own a map, only use the names listed here.

## Geography of Hoshimori Bay

```
                 [shrine]  (Hoshi Hill, north-east; long vertical map)
                    |
 [school_grounds]---+
        |           |
 [lane]-----------[town]------[shotengai]
  |  |  \            |
[yard] [goro_house]  [harbour]-------[beach]---[lighthouse]
  |      \           |                  |
[home]   [park]------+(park joins town   [cave]
  |        |          at its east edge)
[attic]  [sunny_pines]
```
Town buildings entered from `town`: `cafe`, `mart`, `library`, `post_office`, `clock_shop` (-> `clock_tower`).
School buildings entered from `school_grounds`: `school_halls` (-> `classroom`, `school_roof`), `gym`.

## Maps, owners, sizes, required spawns and spots

Spawn rule: if map A has a warp into map B, B has a spawn `from_A` and A's warp targets `B:from_A`; B's warp back
targets `A:from_B`. Every map also has `default`. Sizes are suggestions (tiles of 16 world px = 32 screen px; the screen
shows 10x7 tiles). Spots are walkable tiles NPCs stand on (face the thing named).

| map | owner | size | connects to | required spots |
|---|---|---|---|---|
| `home` | interiors | ~22x14 | yard, attic (ladder, after `flag:attic_open`) | `bed`, `door`, `cushion`, `kitchen`, `sofa`, `desk`, `tv`, `door_inside` |
| `attic` | interiors | ~12x8 | home | `trunk`, `board`, `window` |
| `yard` | town | ~26x18 | home, lane | `gate`, `mailbox`, `garden`, `porch`, `cherry_tree`, `fence_gap` |
| `lane` | town | ~44x14 | yard, town, park, goro_house | `bus_stop`, `vending`, `goro_garden`, `wall`, `crossroad` |
| `town` | town | ~40x30 | lane, park, school_grounds, shotengai, harbour, shrine, cafe, mart, library, post_office, clock_shop | `fountain`, `noticeboard`, `bench_1`, `bench_2`, `clocktower`, `stage`, `market_1`, `market_2`, `bus_stop`, `ramen_cart`, `cafe_terrace` |
| `park` | town | ~40x28 | lane, town, sunny_pines | `pond_edge`, `bench`, `chess_table`, `playground`, `lawn`, `bandstand`, `sakura_tree`, `bridge` |
| `shotengai` | town | ~44x14 | town | `salon`, `clinic`, `woodworks`, `stall`, `arcade`, `lantern_row` |
| `school_grounds` | town | ~40x28 | town, school_halls, gym | `gate`, `field_center`, `goal`, `greenhouse`, `garden`, `bench`, `bike_rack`, `track` |
| `harbour` | coast | ~48x22 | town, beach | `pier_end`, `bait_shop`, `market_stall`, `dock`, `mural`, `noodle_stand`, `boat` |
| `beach` | coast | ~52x24 | harbour, cave, lighthouse | `shore`, `towel`, `bonfire`, `sandbar`, `rocks`, `shaved_ice`, `driftwood` |
| `cave` | coast | ~24x16 | beach | `pools`, `star_mark`, `entrance` |
| `shrine` | coast | ~28x40 | town | `offering_box`, `ema_board`, `fortune_stand`, `steps`, `lookout`, `forest_path`, `torii` |
| `lighthouse` | coast | ~16x30 | beach | `door`, `stairs`, `lamp_room`, `balcony`, `logbook` |
| `sunny_pines` | coast | ~26x16 | park | `hana_chair`, `lounge`, `garden_bench`, `dining`, `desk` |
| `cafe` | interiors | ~18x12 | town | `counter`, `kitchen`, `table_1`, `table_2`, `table_3`, `table_4`, `window_seat`, `karaoke` |
| `mart` | interiors | ~18x12 | town | `register`, `aisle_1`, `aisle_2`, `gacha`, `arcade` |
| `library` | interiors | ~22x14 | town | `desk`, `table_1`, `table_2`, `archive`, `stacks`, `museum` |
| `post_office` | interiors | ~14x10 | town | `counter`, `sorting`, `bench` |
| `clock_shop` | interiors | ~16x10 | town, clock_tower | `bench`, `counter`, `stool` |
| `clock_tower` | interiors | ~10x16 | clock_shop | `gears`, `bell`, `view` |
| `school_halls` | interiors | ~44x16 | school_grounds, classroom, school_roof | `lockers`, `staff_room`, `nurse`, `art_room`, `music_room`, `astro_room`, `science_lab`, `notice_board`, `library_corner` |
| `classroom` | interiors | ~20x14 | school_halls | `teacher`, `desk_misa`, `desk_kai`, `desk_suzu`, `desk_rina`, `desk_theo`, `desk_hina`, `window`, `back` |
| `school_roof` | interiors | ~22x14 | school_halls | `bench`, `railing`, `telescope`, `corner` |
| `gym` | interiors | ~28x18 | school_grounds | `court`, `stage`, `bleachers`, `storage` |
| `goro_house` | interiors | ~16x12 | lane | `chair`, `kitchen`, `door` |

Seats: if an NPC should sit, make the spot a walkable tile next to the chair and set `dir` toward it.

## Characters (ids are fixed)

| id | name | role | map presence |
|---|---|---|---|
| `kai` | Kai Tanabe | classmate, soccer ace | school, field, town |
| `suzu` | Suzu Mori | classmate, library committee, writer | school, library, cafe |
| `rina` | Rina Hoshino | class rep, rival | school, library, shotengai |
| `theo` | Theo Park | quiet artist, guitarist | school roof, harbour mural, park |
| `hina` | Hina Kobayashi | nature club | school garden, park pond, beach |
| `fujita` | Ms. Akane Fujita | homeroom + science, Astronomy Club adviser | classroom, staff room, roof |
| `ogawa` | Mr. Daichi Ogawa | PE teacher, school garden | field, gym, greenhouse |
| `hana` | Grandma Hana Aoki | Misa's grandmother | sunny_pines |
| `tobias` | Tobias Wren | clockmaker | clock_shop, clock_tower, town |
| `mika` | Mika Kumo | Cafe Kumo owner | cafe |
| `sachiko` | Sachiko Ueda | Sunny Mart owner | mart, town market |
| `jun` | Captain Jun Ishida | Bait & Tackle | harbour |
| `kiko` | Kiko Amane | shrine keeper | shrine |
| `pip` | Pip Nakamura | postie | post_office, town, lane (rounds) |
| `goro` | Goro Hayashi | neighbour, retired gardener | lane, goro_house, park |
| `mum` | Kaori Aoki | Mum (phone only, `hidden: true`) | none |
| `dad` | Ren Aoki | Dad (phone only, `hidden: true`) | none |
| `nori` | Aunt Nori | illustrator (phone only, `hidden: true`) | none |
| `daifuku` | Daifuku | Goro's shiba (animal actor, mochi area) | lane, park |
| `kuro` | Kuro | stray kitten (animal actor, mochi area) | yard |

Looks, personalities, schedules, gifts, birthdays and heart events are in `docs/DESIGN.md` section 3.

## Shared ids other areas can rely on

- Skills: `homemaking`, `study`, `cooking`, `gardening`, `fishing`, `crafting`, `charm` (registered by `economy`).
- Items: each area creates its own (fish by hobbies, dishes by hobbies/cooking, school items by school, shop goods by
  economy...). Star Stickers are item `star_sticker` (economy). Use these prefixes so ids never collide:
  `fish_`, `bug_`, `shell_`, `min_` (minerals/fossils), `crop_`, `seed_`, `dish_`, `drink_`, `ing_` (ingredients),
  `mat_` (materials), `furn_` (furniture/decor), `cloth_` (clothes), `book_`, `gift_`, `key_`, `tool_`, `school_`,
  `toy_`, `story_`. NPC gift lists may name items from other areas; mismatches are reconciled at integration.
- Interaction ids already provided by the home system: `task_dishes`, `task_sweep`, `task_laundry`, `task_plants`,
  `task_feed`, `sofa`, `bookshelf`, `desk`, `stove`; bed uses `interact: { run: (g) => g.sleepPrompt() }`.
- Sprite names: prefix with your area's map or system (`cafe_`, `town_`, `beach_`, `school_`, `furn_`, `ic_`...).

## Ownership (who may edit what)

| area | owns |
|---|---|
| `town` | `src/content/town/**` |
| `coast` | `src/content/coast/**` |
| `interiors` | `src/content/interiors/**` |
| `cast_art` | `tools/studio-cast.mjs`, `tools/misa-studio.mjs`, `assets/cast/**`, `assets/moonkai/**`, `src/content/cast_art/**` |
| `social` | `src/content/social/**` |
| `school` | `src/content/school/**`, `src/minigames/school/**` |
| `economy` | `src/content/economy/**`, `src/minigames/jobs/**`, `src/ui/shop.js` |
| `hobbies` | `src/content/hobbies/**`, `src/minigames/hobbies/**` |
| `story` | `src/content/story/**`, `src/systems/quests.js`, `src/systems/festivals.js` |
| `ui` | `src/ui/**` (except `src/ui/shop.js`), `src/font.js`, `src/content/ui/**` |
| `mochi` | `src/content/mochi/**`, `src/systems/mochi.js`, `src/minigames/pet.js` |
| lead (integration) | everything else: `src/core/**`, `src/world/**`, `src/gfx/**`, `src/art.js`, `src/artcache.js`, `src/main.js`, `src/audio.js`, `src/content/index.js`, `src/content/{tiles,icons,music,home_life}.js`, `src/systems/{social,day}.js`, `src/minigames/chores.js`, `tests/*` (shared), `docs/*`, `index.html`, `package.json` |

Each area registers its own feature lines with `features(...)`. Area test files `tests/<area>.test.mjs` are owned by
that area.
