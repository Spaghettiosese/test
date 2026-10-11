# Misa's Little House: The Star Lantern — life-sim design brainstorm

Lead design pass for turning *Misa's Little House* (a one-house cozy chore sim, 320x224 canvas, vanilla JS) into a full cozy **life sim with a story**: Misa leaves the house, goes to school, works, makes friends, explores a seaside town, and over one school term solves a gentle mystery. Chores stay, but they are now one small part of her life.

**What's in this document**

1. Canon decisions (numbers every other section relies on)
2. Story outline: premise, main arc (prologue + 8 chapters + finale), 5 side arcs, post-game epilogues
3. Cast: Misa, Mochi, and 20 NPCs (look, personality, schedule, gifts, birthday, heart events)
4. Locations: 18 maps
5. The feature list: 795 numbered features in 36 categories, tagged `[P1]` / `[P2]` / `[P3]`, plus the top 30
6. Scope plan: which engines and data tables make ~600 of these shippable by a small team

---

## 1. Canon decisions

These are fixed so that designers, artists and programmers all use the same numbers.

| Topic | Decision |
| --- | --- |
| Setting | **Hoshimori Bay**, a small seaside town: a hill with a shrine, a harbour, a beach with a headland lighthouse (the **Star Lantern**), one high school, a shopping street. |
| Player | **Misa Aoki**, 15, second-year student in class **2-B** at Hoshimori High. Brown bob, navy hoodie at home. |
| Home | Grandma Hana's little house at the end of **Lantern Lane** (the existing house map, plus a yard and an attic). |
| Calendar | 4 seasons x 28 days (already in `core/time.js`). Day 1 is Monday, Spring 1, so every season starts on a **Monday** and a date is always the same weekday: 1/8/15/22 are Mondays, 6/13/20/27 Saturdays, 7/14/21/28 Sundays. |
| School | Mon-Fri, 8:30-15:30 (the existing `school` condition). Spring 1 is the term-opening holiday (moving day), so the Spring term runs Spring 2-28. **All of Summer is summer break** (as `cond.js` already rules). Autumn term: Autumn 1-28. Winter term: Winter 1-20, then winter break. |
| Exams | Midterms on days 10-11 (Wed-Thu) and finals on days 24-25 (Wed-Thu) of Spring and Autumn. Winter has finals only, on Winter 17-18. |
| Clock | 6:00 AM to 2:00 AM, one in-game minute every 0.45 s (`MINUTE_SECONDS`), so a full day is about 9 real minutes. Time only passes in the world, not in menus, dialogue or minigames (already true). |
| Currencies | **Coins** (`state.money`, shown with ¥ prices in this doc) from wages, sales and home-task pay, spent in shops. **Star Stickers** bring back the old game's stars as a stackable *item* earned from home tasks, requests and achievements and spent in Aunt Nori's Star Catalogue, so they need no second currency system. |
| Meters | **Energy** (`energy`/`maxEnergy`, max grows to 150) and **Cozy** (the existing `mood`, 0-100). |
| Friendship | 0-10 hearts per NPC, 100 points per heart. Heart events at 2/4/6/8 hearts, or 2/5/8 for NPCs with 3 events. Friendship only, no romance (cozy, all ages). |
| Skills | The existing Homemaking skill plus 6 new ones (Study, Cooking, Gardening, Fishing, Crafting, Charm), each level 1-10 (`register('skill')`). |
| Content sizes | 18 main maps, 20 NPCs, ~400 items, 60 recipes, 32 crops, 30 fish, 30 bugs, 20 shells/beach finds, 12 fossils/minerals, 24 constellations, 150 furniture, 60 clothes, 60 achievements. |
| Camera | The world draws at 2x with a following camera (existing). The proposed per-map zoom keeps 2x for cozy interiors and uses 1x on big outdoor maps so the town reads well at 320x224. |
| Tone | No fail states. Missed things wait for you or come back. Gentle mystery, no villains. |

---

## 2. Story outline

### Premise

Misa Aoki moves to Hoshimori Bay to live in Grandma Hana's little house while her parents spend a year at sea on a research ship. Mum is the ship's marine biologist and Dad is its cook. Grandma Hana, 82, has moved into **Sunny Pines**, the retirement home on the hill, and asked Misa to "keep the house warm and the cat fed". The cat is **Mochi**.

Above the bay stands the **Star Lantern**, a lighthouse with a prism lens that once threw a star-shaped beam across the water on the last night of spring, the **Starlight Festival**. It has been dark for twenty years. On Misa's first night, Mochi drops a dull brass button at her feet.

**The mystery.** Why did the lantern go dark? Who pins a folded paper star with a riddle to the town noticeboard every spring? Where are the seven pieces of the Star Lens?

**The truth, revealed slowly.** Twenty years ago, during a storm, the lens cracked into seven prisms while Hana and her co-keeper **Tobias Wren**, the clockmaker, argued about whether to light it in bad weather. Each blamed themselves, and then each other. Heartbroken, Hana gave six prisms to people she trusted, "to keep until someone wants to light it again", and wrote a riddle for each in her Keeper Journal. She sewed the seventh into a brass button on her keeper's coat, and that is the button Mochi finds. Tobias was too proud to apologise, so every spring since he has folded a paper star and pinned it to the noticeboard, hoping someone would take up the search. There is no villain: just two old friends, a cracked lens, and a town that forgot how bright it used to be.

**Theme.** Small kindnesses add up to light. You can't undo the past, but you can relight it together.

### Main arc: "The Star Lantern" (the Spring term, prologue + 8 chapters + finale)

Each chapter has a **trigger** (checked when Misa wakes up or enters a map), a short set of beats, and **unlocks**. The lens prisms are named after stars: Vega, Altair, Deneb, Sirius, Spica, Polaris, and the seventh, which Hana called the *Little Lantern*.

| # | Chapter | Trigger | Beats | Unlocks |
| --- | --- | --- | --- | --- |
| 0 | **Boxes and Buttons** | New game (Spring 1, Monday: the term-opening holiday) | Misa arrives by bus with Mochi in a carrier. Pip helps with the boxes. Unpacking teaches decorate mode, then the existing chores teach movement and minigames. In the evening Mochi brings the brass button (the existing cat-gift scene), and Misa has her first video call with Mum and Dad. | House, yard, Lantern Lane; phone (Messages, Calls, Calendar) |
| 1 | **New Girl in 2-B** | Spring 2, 8:00 (automatic) | The walk to school teaches the map. Ms. Fujita introduces Misa, who sits next to Kai, and a class minigame tutorial follows. At lunch she picks who to eat with. After school, Kai and Hina walk her through the square and point at the dark lighthouse: "They say it'll shine again when the stars come home." | School maps, Town Square, Sunny Mart, Café Kumo, Map app |
| 2 | **The Paper Star** | Spring 4 or later, after 15:30, entering the square having visited 4+ town locations | A folded paper star on the noticeboard reads: *"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch."* At Sunny Pines, Grandma hums a tune and says "under the cat, dear". At the library, Suzu helps scroll the newspaper archive: *"Starlight Festival cancelled; Lantern lens damaged in storm."* | Sunny Pines, Library, story quest log, Suzu's phone number |
| 3 | **Grandma's Attic** | Chapter 2 done, plus the first rainy weekend day (rain is forced on Saturday Spring 13 if none has fallen) | Rain keeps Misa home. Mochi naps on the maneki-neko statue (the "cat"), and petting her off it reveals the attic key. In the attic: Hana's trunk, the **Keeper Journal** (7 riddles, 12 pages), the first prism (**Vega**) and the **Mystery Board**. | Attic, Mystery Board, Keeper Journal |
| 4 | **Tick, Tock, Tobias** | Chapter 3 done, plus Tobias at 1+ heart or Spring 12 | Riddle 2 points to "the heart that never stops": the clock tower. Tobias refuses to talk, but the chime is jammed, so Misa fixes it with a gear puzzle while he "supervises". **Altair** was the chime's jewel bearing. On the Mystery Board, Misa matches the paper star's handwriting to Tobias's repair tags. | Clock tower interior, repair-bench job, deduction mechanic |
| 5 | **Low Tide** | Chapter 4 done, plus Sunday Spring 14 (the lowest tide of spring; otherwise any later weekend day) | Misa and Hina explore the tidepool cave and find Hana's carved star mark. Captain Jun admits **Deneb** is set in his lucky lure, and he will trade it for a **Moon Bream** (night fishing on the pier, with a lure he lends her). | Tidepool cave, boat dock |
| 6 | **Stars After School** | Chapter 5 done, plus Spring 16 or later, a weekday after school | Riddle 4: "where the young ones look up". The Astronomy Club was disbanded years ago. Ms. Fujita, once one of Hana's junior stargazers, will advise it if it has 4 members: Misa recruits 3 of Kai, Suzu, Rina, Theo and Hina (each at 2+ hearts). The old telescope's eyepiece holds **Sirius**. The first club night on the roof is a constellation minigame. | Astronomy Club, rooftop at night, Star Map app |
| 7 | **What the Shrine Remembers** | Chapter 6 done, plus 3 visits to Grandma in total | (a) Kiko's late grandmother kept **Spica** behind the shrine's ema board; arranging 6 wooden plaques into the right order of a poem releases it. (b) Grandma can't remember the last keeper, so Misa cooks **Starlight Mochi** from the journal's recipe. Grandma remembers "Mika's mother's sugar jar", and the jar at Café Kumo holds **Polaris**. A sepia flashback shows young Hana and Tobias lighting the lantern in 1985. | Starlight Mochi recipe, shrine back path |
| 8 | **The Storm** | Spring 23 (a Tuesday, the day before finals), or the first weekday at least 2 days after Chapter 7 | A storm knocks out the town's power. Misa lights her lantern (the existing blackout mechanic), and the brass button glows in the light: it is the seventh prism, the **Little Lantern**. She runs to the lighthouse and finds Tobias at the door, soaked, holding the old keys. He confesses the quarrel, and Misa chooses how to respond: comfort him, scold him gently, or stay quiet. She video-calls Grandma, who says, "Toby, bring the festival back." | Star Lantern map, festival announcement |
| F | **The Starlight Festival** | Spring 28, the last night of spring (a Sunday); if Chapter 8 is later, the first Sunday at least 2 days after it | By day, stalls and minigames fill the square and friends wear spring happi. At dusk Rina wheels Grandma up to the lighthouse. In the lamp room, Misa rotates the 7 prisms until the beams form a star. The lantern relights and its beam sweeps the bay. Paper lantern boats float out, and Hana and Tobias make up. During the meteor shower Misa makes one of 4 wishes, each with a post-game bonus. Mum and Dad watch on video from the ship. Credits roll over the player's own photos. | Keeper title, lighthouse duties, post-game seasons |

**Pacing and no-fail rules.** No chapter has a deadline. If a trigger is missed, the festival simply waits until the story is ready. Every 3 days without progress, a gentle nudge arrives: a dream, a text from Suzu, or Mochi sitting by the next clue. Chapters 2-7 never need more than about 3 hearts with anyone, so a player who barely socialises can still finish.

**Post-game epilogues** (2-3 scenes each):

- *Summer, "Keeper's Logbook"*: Misa keeps the lantern lit each night and reads Hana's old log entries.
- *Autumn, "The Other Lantern"*: Tobias reveals a tiny twin lantern, a music box, that he made for Hana.
- *Winter, "Homecoming"*: Mum and Dad come home for New Year, and the family watches the first sunrise at the beach.

### Side arcs

| Arc | Trigger | Summary | Reward |
| --- | --- | --- | --- |
| **A. Café Kumo's Missing Menu** | Mika at 4 hearts (her heart event 2) | Mika's mum's recipe box was lost. Misa finds **12 recipe cards** hidden around town, each tied to a clue in Mika's dialogue (one is in a library book, one is in Goro's shed). The arc ends with the café's **30th anniversary party**. | 12 café recipes, the "Misa Latte" on the menu, café rank 5 |
| **B. Pip's Forgotten Satchel** | Pip at 4 hearts | A satchel of **10 letters undelivered for 20 years** turns up in the post office loft. Each letter has only a nickname or an old address, so Misa asks around town to find who it belongs to. One is from Tobias to Hana, and delivering it gives a bonus scene in the finale. | Stamp album, honorary postie cap |
| **C. The Little Grey Visitor** | Any rainy evening in Spring 20 or later | **Kuro**, a stray grey kitten, appears under the yard fence. Feeding him 7 evenings in a row raises a Mochi-Kuro acceptance meter (hiss → watch → sniff → share cushion). Then Misa chooses to adopt him or rehome him with Goro. | A second pet, or Goro's gratitude plus visits |
| **D. Rival Notes** | Spring midterm results (Spring 12) | Rina declares Misa her rival. The exam duels turn into a study group, then a sleepover where Rina admits she wanted a friend all along. It ends at the term-final rankings. | Study perk "Rival's Notes" (+10% exam score) |
| **E. Theo's Garage Band** | Theo at 4 hearts (Summer or later) | Misa recruits Kai on drums, Hina on bass, and herself on keys; the band picks a silly name; they practise the rhythm game 5 times and play the Autumn **Culture Festival**. | Band poster decor, 3 songs, "Rock Star" title |

---

## 3. Cast

Sprite notes: NPC sheets use Misa's format (40x48 frames, 11 per row, rows down/up/side) and are painted with `tools/studio-cast.mjs` into `assets/cast/<id>.png`. Until a sheet exists, the engine palette-swaps Misa using the `look` colours below (hair, top, bottom, accent). Portraits are 64x64 in the same anime style, with rows neutral/happy/surprised/sad plus blink and mouth frames. Animals (Mochi, Daifuku, Kuro) use art.js sprites.

Schedule shorthand: **Wkdy** = school days, **Wknd** = Saturday and Sunday, **Rain** = the override on rainy days. Times are approximate windows; between them the NPC walks the route. During summer and winter breaks, students use their Wknd schedule every day.

### The player and her cat (not counted in the 20)

**Misa Aoki** (player). 15, class 2-B. Brown bob (existing palette `#8b5a44`), navy hoodie `#3d5a8c` at home. Uniform: navy blazer, white shirt, red ribbon, grey pleated skirt; white short-sleeve blouse in summer; cream duffel coat in winter. Kind, a little clumsy, notices small things. Birthday: **Summer 3**.

**Mochi**, Misa's cat. Orange tabby with a cream belly and green eyes, 4 years old, female. Curious, proud, a gift-giver and a plate-knocker. She spends the day at home, picking the warmest spot; after her 4-heart bond she can come out on a harness.
- Loved: Salmon Flakes, Feather Wand play, Warm Laundry. Liked: Tuna, Catnip Mouse, Cardboard Box. Disliked: Bath, Broom (she hisses at the sweeping chore), Citrus Peel.
- Adoption day: **Autumn 9**.
- Bond events: **(2)** sleeps on Misa's bed for the first time; **(4)** stuck up the yard's cherry tree, rescued by ladder; **(6)** follows Misa to school and sits in the classroom window, and Ms. Fujita lets her stay for homeroom; **(8)** leads Misa to Sunny Pines by herself, a reunion with Hana; **(10)** "gift of the year": a shooting-star pebble.

### Classmates (class 2-B)

#### 1. Kai Tanabe: desk neighbour, soccer club ace
- **Look:** spiky black hair `#1e1e2a` (highlight `#3a3a52`), tanned skin, red track jacket `#c8423a` over his uniform, white sneakers with green laces.
- **Personality:** loud, warm, always hungry, bad at maths. Says "Let's gooo!" Secretly scared of letting his team down.
- **Schedule:** Wkdy 7:40 jogs down Lantern Lane → 8:20 classroom → lunch on the rooftop → 15:30-17:30 school field (soccer) → 18:00-20:00 square (ramen cart, Sunny Mart snack aisle). Wknd 9-12 Sakura Park practice, 13-17 harbour pier fishing with Hina, 18-20 Sunny Mart arcade cabinet. Rain: gym.
- **Gifts:** Loved: Curry Bread, Spicy Ramen, Rare Soccer Card. Liked: Sports Drink, Onigiri, any fish. Disliked: Maths Workbook, Bitter Melon, Sea Slug.
- **Birthday:** Summer 11.
- **Heart events:** **(2)** begs Misa to tutor him before a maths quiz (a shared Number Bubbles round at lunch); **(4)** penalty-kick practice at dusk, where he admits his fear; **(6)** his little brother Sota gets lost at the Summer Matsuri and they search the stalls together; **(8)** rooftop sunset after the big match, where he gives Misa his lucky wristband.

#### 2. Suzu Mori: library committee, aspiring writer, Misa's detective partner
- **Look:** long dark-green braid `#2f4a3a` (highlight `#4f6e56`), round brass glasses, beige cardigan `#d8c4a0` over her uniform, always holding a notebook.
- **Personality:** shy, observant, dry wit once comfortable. Reads mysteries and keeps her stories a secret.
- **Schedule:** Wkdy 8:15 classroom (early) → lunch in the school library → 15:30-18:00 town library counter → 18:00-19:30 Café Kumo window seat. Wknd 10-16 library, 16-18 shrine steps reading. Rain: library all day.
- **Gifts:** Loved: Mystery Novel, Jasmine Tea, Pressed Flower Bookmark. Liked: any book, Melon Bread, Fountain Pen Ink. Disliked: any bug, Energy Drink, Raw Squid.
- **Birthday:** Autumn 21 (day 2 of the Culture Festival).
- **Heart events:** **(2)** catches Misa reading her abandoned manuscript, and the player's reaction is remembered; **(4)** a storm locks them in the library, ghost stories by lantern; **(6)** her story wins a contest but she freezes before reading it at the Culture Festival, so Misa helps her rehearse (a breathing minigame); **(8)** gives Misa a handmade picture book, "The Girl and the Lantern Cat", which becomes decor.

#### 3. Rina Hoshino: class representative, top student, rival
- **Look:** pale-gold twin tails `#f0d878` (shadow `#c8a848`) with pink ribbons `#e87aa0`, an immaculate blazer, white knee socks, a violin case.
- **Personality:** proud, perfectionist, competitive, secretly lonely. Her parents are doctors who are rarely home.
- **Schedule:** Wkdy 8:00 classroom (first in, writes the date on the board) → lunch in the student council room → 15:30-17:00 music room (violin) → 17:00-19:00 library study table. Wknd 10-12 Sunny Pines (secretly reads to the residents), 14-17 Café Kumo studying. Rain: same, but takes the bus.
- **Gifts:** Loved: Strawberry Shortcake, Violin Rosin, Gold Star Stationery. Liked: Black Tea, any flower, Macarons. Disliked: Mysterious Lump (failed dish), Cheap Candy, Seaweed.
- **Birthday:** Winter 5.
- **Heart events:** **(2)** challenges Misa to a quiz duel; win or lose, she sniffs "Not bad."; **(4)** Misa finds her reading to Grandma Hana at Sunny Pines, and she begs her not to tell; **(6)** her parents miss her violin recital, so Misa and friends fill the front row; **(8)** a study sleepover at her house, where she admits she wanted a friend, not a rival.

#### 4. Theo Park: quiet artist and guitarist
- **Look:** messy teal-dyed hair `#3a9a9a` (highlight `#6ac8c4`), an oversized mustard hoodie `#d8a838` with paint splotches, headphones around his neck, black jeans.
- **Personality:** soft-spoken, deadpan, secretly funny, anxious about performing. Moved here from Busan a year ago.
- **Schedule:** Wkdy 8:28 classroom (always nearly late) → lunch in the art room → 15:30-17:30 art room (Mon/Wed/Fri) or music room (Tue/Thu) → 18:00-20:00 park bench playing guitar (clear days). Wknd 11-15 Shell Beach sketching, 16-19 Café Kumo. Rain: Sunny Mart arcade cabinet.
- **Gifts:** Loved: Blue Sea Glass, Vinyl Record, Matcha Latte. Liked: Sketchbook, any shell, any flower. Disliked: Natto, Sports Drink, Boiled Egg.
- **Birthday:** Winter 19.
- **Heart events:** **(2)** shows Misa the mural he is secretly painting on the harbour wall; **(4)** asks her to help start a band (starts side arc E); **(6)** stage fright before the Culture Festival, with a breathing and rhythm calm-down minigame; **(8)** paints a portrait of Misa and Mochi that hangs in her house.

#### 5. Hina Kobayashi: nature club, bug and fish fanatic
- **Look:** short orange-red hair `#e07a3a` under a green cap `#5a9a4a`, freckles, denim overalls `#4a6aa0` over a yellow shirt, a butterfly net.
- **Personality:** hyper, enthusiastic, knows every bug's name, always getting into trouble.
- **Schedule:** Wkdy 8:25 classroom → lunch in the school garden → 15:30-18:00 Sakura Park bug hunting (spring/summer) or the harbour pier fishing (autumn/winter) → 18-19 Sunny Mart. Wknd 6-9 park ("early bugs!"), 10-14 beach tidepools, 15-18 pier. Rain: library bug books.
- **Gifts:** Loved: Rainbow Stag Beetle, Honey Toast, Firefly Jar. Liked: any bug, any fish, Lemonade. Disliked: Bug Spray, Perfume, Lettuce.
- **Birthday:** Summer 22.
- **Heart events:** **(2)** a dawn bug hunt where she reveals her "secret tree" for rare beetles; **(4)** she accidentally frees the science class frogs, and they must catch them all before Ms. Fujita notices; **(6)** firefly night at the park stream; **(8)** her bug exhibition at the Culture Festival, where she credits Misa on the sign.

### Teachers

#### 6. Ms. Akane Fujita: homeroom and science teacher, Astronomy Club adviser
- **Look:** red bob `#b8483a`, black-frame glasses, a white lab coat over a green turtleneck `#4a7a5a`, a coffee mug she is never without.
- **Personality:** brisk, caffeinated, warm underneath, tells terrible science puns. Was one of Hana's junior stargazers 20+ years ago.
- **Schedule:** Wkdy 7:50 staff room → 8:30-15:30 classroom 2-B and science lab → 15:30-17:30 Astronomy Club room (after Chapter 6) → 18-19 Café Kumo (coffee number 3) → 20-22 Hoshi Hill lookout on clear nights. Wknd 10-12 library, 20-22 hill on clear nights. Rain: stays at school marking.
- **Gifts:** Loved: Black Coffee, Meteorite Fragment, Star Chart. Liked: any bento, any mineral, Dark Chocolate. Disliked: Decaf Coffee, Horoscope Magazine, Umeboshi.
- **Birthday:** Autumn 4.
- **Heart events:** **(2)** Misa helps clean the lab late, and Fujita reveals she knew Hana; **(4)** night observation of Saturn's rings through the school telescope (focus minigame); **(6)** she panics before parents' evening and Misa helps her prepare; **(8)** gives Misa her childhood planisphere and nominates her club president.

#### 7. Mr. Daichi Ogawa: PE teacher and school-garden caretaker
- **Look:** tall and broad, dark-grey buzz cut `#4a4a50`, a navy tracksuit `#2a3a6a` with white stripes, a whistle, a straw hat when gardening.
- **Personality:** booming voice, gentle giant, loves tomatoes, cries at sports films.
- **Schedule:** Wkdy 7:30 jogs the school field → 8:30-15:30 gym or field → 15:30-17:00 school garden → 17:30-19:00 jogs in the park. Wknd 7-9 jogs Lantern Lane (waves at Misa's house), 10-13 square farmers' market (Saturday) or Sunny Mart seed aisle. Rain: gym.
- **Gifts:** Loved: Giant Tomato, Salmon Onigiri, Sports Towel. Liked: any vegetable, Green Tea, Sports Drink. Disliked: Potato Chips, Candy, Wilted Flower.
- **Birthday:** Summer 26.
- **Heart events:** **(2)** they save tomato seedlings from a late frost (cover-the-plants minigame); **(4)** a training montage for the Sports Day relay; **(6)** his prize tomato vanishes, and the culprit is Daifuku; **(8)** a garden harvest party with the class, where he gives Misa his champion straw hat.

### Town

#### 8. Grandma Hana Aoki: Misa's grandmother, the last Lantern Keeper
- **Look:** silver bun `#d8d8e0` with a star kanzashi pin, a plum cardigan `#7a4a6a` over a mustard dress `#c8a040`, knitting needles.
- **Personality:** playful, mischievous, sings old songs, forgets names but never recipes. Her memory is foggy and her humour is sharp.
- **Schedule (Sunny Pines, visiting hours 9-18):** 7-9 garden tai chi, 9-12 lounge knitting, 12-14 dining room, 14-17 garden bench (sunny) or lounge (rain), 17-19 dining room, asleep at 20:00.
- **Gifts:** Loved: Starlight Mochi, Rainbow Wool, Pressed Sakura. Liked: Green Tea, any flower, Rice Crackers. Disliked: Spicy Ramen, Loud Whistle, Frozen Pizza.
- **Birthday:** Spring 15.
- **Heart events:** **(2)** teaches Misa to knit a scarf for Mochi (loop-timing minigame); **(4)** a photo album afternoon with flashback panels of young Hana; **(6)** a "jailbreak" beach picnic with comic staff chase; **(8)** teaches Misa the Keeper's Song on the shrine bells.

#### 9. Tobias Wren: clockmaker, former co-keeper, the secret paper-star writer
- **Look:** grey mutton-chops `#a8a8a8`, round spectacles with a loupe, a bottle-green waistcoat `#3a5a3a` over a white shirt, a brass pocket watch, a cane.
- **Personality:** gruff, precise to the second, deeply sentimental, hides behind sarcasm.
- **Schedule:** 6:00 sharp harbour walk → 8:00-18:00 Wren's Clocks (closed Sunday) → 12:00 sharp lunch at Café Kumo (onigiri and tea) → 18:15 winds the square clock tower → 19-21 home above the shop. Sunday 9-12 stands at the Sunny Pines gate without going in (until the finale; then he visits Hana), 14-16 park chess table. Rain: no harbour walk.
- **Gifts:** Loved: Brass Gear, Earl Grey Tea, Silver Watch Chain. Liked: any mineral, Marmalade Toast, Clock Parts. Disliked: Plastic Toy, Loud Whistle, Instant Noodles.
- **Birthday:** Winter 13.
- **Heart events:** **(2)** Misa delivers a repaired clock with him; he grumbles about "kids these days" and tips her ¥500; **(4)** teaches her to repair a music box (gear minigame), and it plays Hana's song; **(6)** a rainy afternoon flashback of building the lens with Hana in 1985 (sepia); **(8)** takes her up the clock tower to wind it together, a panoramic view of town, and gives her his old pocket watch.

#### 10. Mika Kumo: owner of Café Kumo, Misa's first boss
- **Look:** fluffy cloud-white hair in a loose bun `#f4f0f0` (shadow `#c8c0d0`), a lavender apron `#a890c8` over a cream blouse, a star hairpin.
- **Personality:** dreamy, flustered, generous, talks to her espresso machine ("Kumo-chan"), hopeless at accounts.
- **Schedule:** 7-8 café prep, 8-20 café counter, 20:30 harbour stroll. Wednesday (café closed): 10-12 Sunny Mart, 13-16 beach shelling, 17-19 Sunny Pines (visits her mum).
- **Gifts:** Loved: Fresh Strawberries, Vanilla Bean, Starlight Mochi. Liked: Milk, any fruit, any flower. Disliked: Instant Coffee, Fish Bones, Hot Sauce.
- **Birthday:** Spring 23.
- **Heart events:** **(2)** the espresso machine breaks mid-rush, so Misa fetches Tobias while covering orders; **(4)** the missing recipe box (starts side arc A); **(6)** a magazine interview where Misa helps with the plating minigame; **(8)** names a drink after Misa, the "Misa Latte".

#### 11. Sachiko Ueda: Sunny Mart owner
- **Look:** curly lilac-grey hair `#b8a0c8`, round red cheeks, a yellow apron `#f0c040` with a sunflower badge, a green cardigan.
- **Personality:** motherly, a gossip, the coupon queen; knows everyone's business and spreads good news about Misa.
- **Schedule:** 7-21 Sunny Mart counter, 13-14 lunch at Café Kumo, Saturday 9-12 at her farmers' market stall in the square (her nephew minds the shop).
- **Gifts:** Loved: Homemade Jam, Sunflower, Lucky Cat Figurine. Liked: any flower, any fruit, Cookies. Disliked: Spoiled Food, Raw Fish, Weeds.
- **Birthday:** Summer 15.
- **Heart events:** **(2)** a crow steals a melon bun, chase it around the square; **(4)** the till breaks, so Misa helps with a stock-take sorting minigame; **(6)** she asks Misa to teach her video calls so she can see her son in Tokyo; **(8)** gives Misa a lifetime "family discount" (5% off).

#### 12. Captain Jun Ishida: retired fisherman, runs Bait & Tackle
- **Look:** big white beard, navy beanie `#2a3a5a`, yellow raincoat `#e8c838`, rubber boots, a whistle on a cord.
- **Personality:** bluff, superstitious, a teller of tall tales (some true), loves his old boat *Sayori*.
- **Schedule:** 5-9 pier fishing → 9-17 Bait & Tackle → 17-19 harbour bench feeding gulls → 19-21 harbour noodle stand. Rain: shop all day. Storm: closed, watching the sea from the window.
- **Gifts:** Loved: Moon Bream, Grilled Mackerel, Lucky Lure. Liked: any fish, Hot Tea, Rice Crackers. Disliked: Canned Tuna, Umbrella ("A sailor never!"), Chocolate.
- **Birthday:** Autumn 17.
- **Heart events:** **(2)** teaches Misa to cast (fishing tutorial); **(4)** takes her out on the *Sayori* at dawn, which unlocks boat fishing; **(6)** his tall tale about a singing fish turns out true on a fog night; **(8)** gives her the *Sayori*'s old brass bell for her house.

#### 13. Kiko Amane: shrine keeper (miko) at Hoshi Hill Shrine
- **Look:** long straight black hair `#1a1a24` tied low with a white ribbon, a white haori and red hakama `#c83a3a`, a bamboo broom.
- **Personality:** serene and cryptic on duty; off duty, obsessed with retro games and convenience-store pudding.
- **Schedule:** 6-8 sweeps the shrine steps → 8-17 shrine office (amulets, fortunes) → 17-18 Sunny Mart (snacks) → 19-21 lights the shrine lanterns. Wednesday 19-21 arcade cabinet instead. Festivals: runs the shrine stall.
- **Gifts:** Loved: Limited Pudding, Retro Game Cartridge, Sakura Mochi. Liked: Green Tea, any sweet, Plum Blossom. Disliked: Crushed Can, Garlic, Fake Charm.
- **Birthday:** Winter 2.
- **Heart events:** **(2)** fold 100 fortune slips together (origami speed minigame); **(4)** Misa discovers Kiko's secret retro-game streams and they play co-op one night; **(6)** braiding the giant shimenawa rope before New Year; **(8)** she lets Misa ring the shrine bell at midnight and shares a "real" fortune.

#### 14. Pip Nakamura: the postie (already in the game)
- **Look (existing palette):** messy dark-brown hair `#4a3436`, green eyes, blue postal uniform `#5a8cc0`, red mailbag, a red bicycle.
- **Personality:** chipper, fast-talking, delivers rain or shine, secretly terrible with directions.
- **Schedule:** 8-9 post office (square) → 9-12 route: Lantern Lane, harbour, school → 12-13 park bench lunch → 13-17 route: shrine, beach → 17-19 post office → 19-21 Sunny Mart arcade. Sunday off: beach volleyball 13-17. Rain: same route, yellow cape.
- **Gifts:** Loved: Karaage Bento, Rare Stamp, Bike Bell. Liked: Sports Drink, any sandwich, Postcard. Disliked: Soggy Newspaper, Sea Slug, Stone.
- **Birthday:** Spring 10.
- **Heart events:** **(2)** Pip twists an ankle, so Misa finishes the route (delivery minigame); **(4)** the forgotten satchel (starts side arc B); **(6)** a downhill bike race against Kai; **(8)** gives Misa an honorary postie cap and a stamp album.

#### 15. Goro Hayashi: next-door neighbour, retired gardener
- **Look:** bald with white side tufts, bushy eyebrows, a brown work jacket `#7a5a3a`, green garden boots, a straw hat.
- **Personality:** grumbly, competitive about vegetables, "back in my day", soft-hearted. Lives alone with his shiba Daifuku since his wife passed.
- **Schedule:** 6:30-8 walks Daifuku (Lantern Lane → park) → 8-12 his garden (visible over the fence) → 14-16 Sunny Mart, then bench → 16-18 garden → 18:30 evening walk. Rain: sits on his porch.
- **Gifts:** Loved: Giant Pumpkin, Umeboshi, Premium Fertiliser. Liked: any vegetable, Green Tea, Onigiri. Disliked: Weeds, Canned Corn, Frog.
- **Birthday:** Autumn 27.
- **Heart events:** **(2)** declares a vegetable rivalry, a showdown at the Harvest Market; **(4)** Daifuku runs off, so they search the town; **(6)** shows Misa his late wife's flower bed and asks for help replanting it; **(8)** shares his compost secret and his famous pumpkin seeds.

### Family by phone

#### 16. Mum (Kaori Aoki): marine biologist on the research ship *Kujira*
- **Look (video-call portrait):** short black hair with a clip `#2a2a3a`, sun-pink cheeks, an orange expedition jacket `#e07a3a`, binoculars.
- **Personality:** adventurous, sends whale photos, worries but trusts Misa. Grew up in Hoshimori.
- **Schedule:** video calls Wed and Sun 19:00-21:00; a "good morning" text daily; postcards by Pip every 2 weeks.
- **Gifts (posted via Pip):** Loved: Handwritten Letter, Pressed Sakura, Homemade Cookies. Liked: Printed Photo, any shell, Tea. Disliked: any fish ("I see enough at work!"), Plastic Straw, any bug.
- **Birthday:** Autumn 1.
- **Heart events:** **(2)** first proper call, where Misa walks the phone camera around the house (the room you face is shown); **(4)** sends a recording of whale song, which becomes a music track; **(6)** sends her diary page from the last Starlight Festival: Dad proposed under the star beam (a Mystery Board clue); **(8)** surprise homecoming visit on the New Year's Eve shrine night.

#### 17. Dad (Ren Aoki): the ship's cook
- **Look:** messy brown hair `#5a3a2a` like Misa's, stubble, a white chef jacket, a red bandana `#c8423a`.
- **Personality:** a pun machine, sentimental, sends recipes; cries at Misa's report cards (happily).
- **Schedule:** shares Mum's calls; cook-along video Monday 19:00; recipe texts on Fridays.
- **Gifts (posted):** Loved: any 3-star dish, Hot Sauce, Photo of Mochi. Liked: any dish, Coffee Beans, Postcard. Disliked: Mysterious Lump, Celery, Instant Noodles.
- **Birthday:** Winter 25.
- **Heart events:** **(2)** first cook-along (guided recipe); **(4)** a pun-off battle (choose the best pun response); **(6)** a disastrous ship cooking video where a wave hits mid-flip; **(8)** sends his secret Starlight Mochi variant, the best-buff dish in the game.

#### 18. Aunt Nori Kanda: Mum's younger sister, illustrator in the city (already in the game)
- **Look:** long purple-dyed hair `#7a4ac8`, big round glasses, an oversized pink sweater `#e8a8b8`, a beret.
- **Personality:** whimsical, chaotic, spoils Misa, runs the Star Catalogue, sends parcels "for a cozier home".
- **Schedule:** phone and parcels; in-person visits on Hanami (Spring 7), the Summer Matsuri (Summer 20) and Starry Eve (Winter 24), staying overnight on the sofa.
- **Gifts:** Loved: Fancy Ink, any sea glass, Mochi Paw Print (crafted). Liked: Cute Stationery, Tea, any sweet. Disliked: any bug, Spinach, Mud Clump.
- **Birthday:** Summer 1.
- **Heart events:** **(2)** a parcel guessing game over the phone; **(4)** visits and redecorates a room overnight (chaotic reveal); **(6)** a sketching walk around town, and her sketches become collectible postcards; **(8)** reveals she drew the last Starlight Festival poster and gives the framed original.

### Pets around town

#### 19. Daifuku: Goro's shiba inu
- **Look:** cream-and-tan shiba `#e8c890` / `#f8ece0`, a red collar, a curly tail.
- **Personality:** dramatic, food-motivated, Mochi's sworn frenemy.
- **Schedule:** walks with Goro at 6:30 and 18:30; otherwise Goro's yard (naps 13-15). On windy days he escapes to the park.
- **Treats:** Loved: Sweet Potato, Dog Bone Treat, Tennis Ball. Liked: Cucumber Slice, Jerky, belly rubs (an action). Disliked: Bath, Lemon, Cat Toy.
- **Birthday:** Summer 18.
- **Heart events:** **(2)** fetch at the park (throw-timing minigame); **(5)** a Mochi-Daifuku standoff on the fence ends in a truce; **(8)** digs up a buried geode and "gives" it to Misa.

#### 20. Kuro: stray grey kitten (side arc C)
- **Look:** small charcoal-grey kitten `#5a5a64` with white socks, one bent ear, yellow eyes.
- **Personality:** skittish, then clingy; copies everything Mochi does.
- **Schedule (before adoption):** mornings under the shrine steps, afternoons in the harbour fish crates, evenings at Misa's yard fence. After adoption: home, or Goro's porch.
- **Treats:** Loved: Tuna Flakes, Feather Wand, Warm Box. Liked: Kitten Formula, Shrimp, Yarn Ball. Disliked: rain, Loud Bell, Bath.
- **Found day:** Spring 20.
- **Heart events:** **(2)** follows Misa home through the rain; **(5)** Mochi grooms him for the first time; **(8)** adoption day photo with the whole neighbourhood.

**Minor recurring characters (no gifts or hearts):** Sota (Kai's little brother, 7), 4 Sunny Pines residents (Mr. Shogi, Mrs. Knit, Old Sailor Ken, Poet Yae), the hair stylist Rei, Dr. Mori at the clinic and vet, the travelling merchant Bashō (Fridays), and 12 generic townsfolk.

---

## 4. Locations (18 main maps)

Maps are built from 16 px tiles. "Screens" means 20x14-tile screens: the camera scrolls on bigger maps, and the zoom is set per map.

| # | Map | Size | What's there | What you do |
| --- | --- | --- | --- | --- |
| 1 | **Misa's House** (interior + attic) | 20x14 + attic 12x8 | Existing kitchen, living room, bath/laundry, bedroom, sunroom; attic from Chapter 3 | Chores (existing minigames), cooking, homework desk, sleep/save, wardrobe, decorate, Mochi time, TV, Mystery Board, stargazing skylight |
| 2 | **Front Yard & Garden** | 1.5 screens | 12-24 soil plots, flower bed, shed (crafting bench, tools), clothesline, mailbox, cherry tree, bike stand, Mochi's sun spot | Gardening, crafting, laundry drying, mail and parcels, Kuro's fence |
| 3 | **Lantern Lane** | 2 screens wide | Goro's house and garden, bus stop, vending machine, cherry trees, a neighbourhood cat's wall | Commute, chat with Goro and Daifuku, bus, foraging, ambient life |
| 4 | **Town Square** | 2x2 screens | Fountain, request noticeboard, clock tower, post office, festival stage, bus stop, Saturday farmers' market, ramen cart at night | Requests, festivals, market stall, post, people-watching, hub to every map |
| 5 | **Sunny Mart** | 1 screen interior | Groceries, seeds, tools, clothing rack, home goods shelf, gacha machine, arcade cabinet | Shopping, selling crops, cashier job, arcade, gacha |
| 6 | **Hoshimori Shotengai** (covered shopping street) | 2 screens wide | Salon Snip (hair), Dr. Mori's clinic and vet, Kinoko Woodworks (house upgrades), Bashō's Friday stall | Hairstyles, Mochi's checkups, house upgrades, rare items |
| 7 | **Café Kumo** | 1 screen interior | Counter, 6 tables, window seat, karaoke corner (Friday) | Café job, buff drinks, hangouts, recipe arc, karaoke |
| 8 | **Wren's Clocks & Clock Tower** | 1 screen + tower 10x16 | Workbench, ticking walls; the tower's gear room and bell deck | Repair job, tool upgrades, Chapter 4, panoramic view |
| 9 | **Hoshimori High: Classroom 2-B** | 1 screen | Desks, chalkboard, class plant, windows over the field | Classes (minigames), homeroom, seating chats, duty |
| 10 | **Hoshimori High: Halls, Club Rooms & Rooftop** | 3 screens | Shoe lockers, staff room, nurse, science lab, art room, music room, Astronomy Club room, rooftop | Clubs, lunch spots, exams board, nurse naps, rooftop stargazing |
| 11 | **Hoshimori High: Field, Gym & Garden** | 2x2 screens | Track and pitch, gym, greenhouse, school garden | PE, Sports Day, soccer club, nature club, garden plot |
| 12 | **Hoshimori Library** (+ museum corner) | 1.5 screens | Stacks, study tables, newspaper archive, donation display cases | Reading, studying, research (Chapter 2), shelving job, museum donations |
| 13 | **Sakura Park** | 2x2 screens | Pond with koi and ducks, stream, cherry trees, playground, chess table, picnic lawn, bandstand | Bugs, pond fishing, picnics, Hanami, skating on the frozen pond, radio exercise |
| 14 | **Harbour & Fish Market** | 3 screens wide | Pier, Bait & Tackle, fish market stalls, boat dock with the *Sayori*, Theo's mural wall, noodle stand | Sea fishing, crab pots, fish market job, boat trips, selling fish |
| 15 | **Shell Beach & Tidepool Cave** | 3 screens wide + cave 1 screen | Sand, tidepools (low tide), sandbar, driftwood, bonfire pit, shaved-ice stand (summer), the cave | Beachcombing, tidepools, swimming, sandcastles, kites, clean-up day, first sunrise |
| 16 | **Hoshi Hill Shrine & Forest Path** | 2x3 screens (vertical) | Stone steps, torii, offering box, ema board, fortune stand, bell, forest path, lookout bench | Fortunes, wishes, foraging, forest bugs, stargazing, New Year, Kiko |
| 17 | **Sunny Pines** (retirement home) | 1.5 screens | Lounge, dining room, garden with benches, Grandma's room | Visit Grandma, volunteer, shogi with residents, story beats |
| 18 | **The Star Lantern** (lighthouse) | 3 floors x 1 screen | Keeper's door, spiral stairs, lamp room with the lens ring, balcony | Story finale, nightly Keeper duty, logbook, view of the bay |

Extra small one-off maps (not counted): 6 NPC home interiors (5+ hearts), 3 school trip maps (aquarium, museum, onsen), the open sea (boat fishing), and a dream starfield.

---

## 5. Feature list (795 features)

**795 distinct player-visible features** in 36 categories: **154 `[P1]`** (core to the life-sim pivot), **458 `[P2]`** (depth) and **183 `[P3]`** (polish and extras). Each line is meant to take a programmer an hour or two on top of the engines in section 6; content-heavy lines (a map, a festival, an NPC's heart events) are one registry entry plus art or writing. Numbers are sequential through the whole list. ★ marks the top 30.

**Already in the restructured build, so not counted here:** talking with time/weather/season/heart line pools, daily talk friendship, first meetings, the 10-heart meter, gift reactions with one-a-day/two-a-week limits, triple birthday gifts, gift logging in the Friends app, the heart-event engine, emote bubbles, talk hooks; the 6 AM-2 AM clock that pauses outside the world, sleep with confirmation, the end-of-day summary, late-night and 2 AM pass-out penalties, the energy bar, eating from the bag, tomorrow's forecast at bedtime, autosave on sleep; Mochi wandering, following, napping, greeting, zoomies, the petting menu and her affection meter; the daily home tasks with allowance pay, visible mess, the 5 chore minigames, sofa rest and the Homemaking skill; the procedural per-location soundtrack, 30+ sfx and music/sfx volume; 3 save slots with load and delete on the title screen; the phone host with Bag, Journal, Friends, Settings and Save; the HUD clock, date, weather, coins, energy, objective tracker and interaction prompt; text speed, mouse walk, screen shake and voice-blip settings. Features below extend these and never re-list them.

### 5.1 Top 30 (the vertical slice that makes it a life sim)

- **#1** (Core loop & time) Free-roam daily loop: wake up, go to school or spend free time (town, work, hobbies), come home, sleep; chores become 2-3 optional daily tasks
- **#47** (Main story: The Star Lantern) Chapter 1 "New Girl in 2-B" (Spring 2, 8:00): first school day, meet the classmates and Ms. Fujita, then Kai and Hina tell the legend of the dark lighthouse on the walk home
- **#48** (Main story: The Star Lantern) Chapter 2 "The Paper Star" (Spring 4+, entering the square after 15:30 with 4 locations visited): find the paper-star riddle on the noticeboard
- **#65** (Main story: The Star Lantern) Finale "The Starlight Festival" (Spring 28, or the first Sunday 2+ days after Chapter 8 if later): festival day, the lantern relit, Hana and Tobias reconcile, credits
- **#91** (Side arcs & quests) Town request board in the square: 3 rotating requests a day with coin and friendship rewards
- **#108** (School life & classes) School day structure: homeroom 8:30, 3 morning classes, lunch 12:00-13:00, 2 afternoon classes, homeroom 15:20, then clubs
- **#109** (School life & classes) Class minigames (60-90 s each): sit at your desk to attend, and the score feeds that subject's grade
- **#144** (Grades, homework, exams & clubs) Grades: each subject scores 0-100 from class minigames (50%), homework (20%) and exams (30%); report card at term end
- **#154** (Grades, homework, exams & clubs) Clubs: join one of 7 (Astronomy, Art, Music/Band, Soccer, Nature, Literature, Cooking), meeting 15:30-17:30; switch once a term
- **#173** (Part-time jobs) Job system: one job at a time (two from Year 2), 2-hour shifts after school or at weekends, pay per shift plus tips by score
- **#174** (Part-time jobs) Café Kumo shift: serve 3-5 orders by matching order icons (drink, cake, size) and delivering them before the customer's patience runs out
- **#199** (Money, shops & economy) Shop UI: buy and sell lists with icon, price, owned count and a one-line description, plus +/- for buying in bulk
- **#201** (Money, shops & economy) Selling: crops to Sunny Mart, fish to Jun, fruit to the café, crafts at the market, each at listed prices
- **#240** (Cooking & food) Cooking: 60 recipes (breakfast, bento, mains, desserts, drinks) learned from TV, Dad, friends and recipe cards
- **#265** (Gardening) Yard garden: 12 soil plots (expandable to 24, then a greenhouse); till, plant, water, harvest
- **#290** (Fishing) Fishing minigame: power-bar cast, wait for the bobber to dip, then hold to keep the fish icon inside a moving catch bar
- **#349** (Home & decorating) Decorate mode: grid placement with a ghost preview, rotate (R), move and store, in every room and the yard
- **#379** (Mochi the cat) Harness walks: after bond event 4, Mochi can come out and walk at Misa's heels; NPCs react to her
- **#419** (NPCs, schedules & friendship) The 20-person cast registered as npc entries (look, schedule, gifts, birthday, lines, events) exactly as in the Cast section
- **#420** (NPCs, schedules & friendship) Cast art: 20 NPC sprite sheets (40x48, 11 frames x 3 rows) and portrait sheets painted with tools/studio-cast.mjs
- **#422** (NPCs, schedules & friendship) Hangouts: from 3 hearts, invite a friend to a place and time (café, park, arcade, beach); the scene depends on the place
- **#468** (Dialogue & cutscenes) Dialogue content: 60+ lines per NPC across the existing pools (time of day, weather, season, hearts, location)
- **#485** (Phone & apps) Messages app ("Chirp"): one thread per friend; NPCs text on schedule and after events; reply with 2-3 canned options
- **#487** (Phone & apps) Calendar app: month grid with festivals, learned birthdays, exams, shifts and plans
- **#488** (Phone & apps) Map app: town map with locations, opening hours, friends' last-known spots and your position
- **#512** (Events & festivals) Festival engine: on festival days a map swaps to its festival layout (stalls, bunting), NPCs follow festival schedules, and festival minigames open
- **#539** (Town, maps & travel) Town Square map (2x2 screens): fountain, request board, clock tower, post office, stage, bus stop
- **#543** (Town, maps & travel) Hoshimori High: classroom 2-B map
- **#638** (Graphics & visual polish) New 16x16 tile sets for the 16 new maps (town, school, beach, shrine, harbour), drawn as art.js pixel data or Moonkai PNG overrides
- **#692** (UI/UX & HUD) Hotbar on the HUD (6 slots, 1-6 keys or mouse wheel) for tools and snacks

### 5.2 Category summary

| # | Category | Numbers | Total | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Core loop & time | 1-17 | 17 | 3 | 11 | 3 |
| 2 | Calendar, seasons & weather | 18-45 | 28 | 4 | 18 | 6 |
| 3 | Main story: The Star Lantern | 46-81 | 36 | 24 | 11 | 1 |
| 4 | Side arcs & quests | 82-107 | 26 | 6 | 15 | 5 |
| 5 | School life & classes | 108-143 | 36 | 12 | 19 | 5 |
| 6 | Grades, homework, exams & clubs | 144-172 | 29 | 10 | 14 | 5 |
| 7 | Part-time jobs | 173-197 | 25 | 4 | 15 | 6 |
| 8 | Money, shops & economy | 198-222 | 25 | 4 | 17 | 4 |
| 9 | Inventory & items | 223-239 | 17 | 2 | 12 | 3 |
| 10 | Cooking & food | 240-264 | 25 | 4 | 15 | 6 |
| 11 | Gardening | 265-289 | 25 | 4 | 16 | 5 |
| 12 | Fishing | 290-309 | 20 | 3 | 12 | 5 |
| 13 | Bugs, shells & collections | 310-330 | 21 | 4 | 11 | 6 |
| 14 | Crafting | 331-348 | 18 | 3 | 10 | 5 |
| 15 | Home & decorating | 349-377 | 29 | 4 | 17 | 8 |
| 16 | Mochi the cat | 378-406 | 29 | 3 | 19 | 7 |
| 17 | Other animals & pets | 407-418 | 12 | 0 | 6 | 6 |
| 18 | NPCs, schedules & friendship | 419-446 | 28 | 4 | 18 | 6 |
| 19 | Friendship heart events | 447-467 | 21 | 8 | 11 | 2 |
| 20 | Dialogue & cutscenes | 468-484 | 17 | 1 | 12 | 4 |
| 21 | Phone & apps | 485-511 | 27 | 5 | 18 | 4 |
| 22 | Events & festivals | 512-538 | 27 | 13 | 12 | 2 |
| 23 | Town, maps & travel | 539-573 | 35 | 15 | 16 | 4 |
| 24 | Minigames & hobbies | 574-594 | 21 | 1 | 14 | 6 |
| 25 | Fashion & appearance | 595-609 | 15 | 2 | 8 | 5 |
| 26 | Skills & wellbeing | 610-623 | 14 | 1 | 9 | 4 |
| 27 | Achievements & stats | 624-637 | 14 | 0 | 8 | 6 |
| 28 | Graphics & visual polish | 638-667 | 30 | 4 | 19 | 7 |
| 29 | Animation | 668-677 | 10 | 0 | 7 | 3 |
| 30 | Audio & music | 678-691 | 14 | 0 | 7 | 7 |
| 31 | UI/UX & HUD | 692-716 | 25 | 2 | 17 | 6 |
| 32 | Save system | 717-726 | 10 | 1 | 8 | 1 |
| 33 | Accessibility & settings | 727-748 | 22 | 3 | 16 | 3 |
| 34 | Quality of life | 749-767 | 19 | 0 | 15 | 4 |
| 35 | Secrets & easter eggs | 768-787 | 20 | 0 | 0 | 20 |
| 36 | Post-game & replay | 788-795 | 8 | 0 | 5 | 3 |
| | **Total** | 1-795 | **795** | **154** | **458** | **183** |

### 5.3 The full list

#### 5.3.1 Core loop & time (17)

1. `[P1]` ★ Free-roam daily loop: wake up, go to school or spend free time (town, work, hobbies), come home, sleep; chores become 2-3 optional daily tasks
2. `[P2]` Energy cost table for every activity (job shift 15-25, class 5, cast 2, till 2), walking and running free; below 15 energy Misa walks slower and yawns
3. `[P2]` Cozy (mood) effects: 80+ gives +10% friendship gain, below 20 adds sighs and a soft grey vignette
4. `[P1]` Late for school: reaching 2-B after 8:30 gives a late slip; 3 lates in a term trigger a kind talk with Ms. Fujita (no penalty beyond -2 grade points)
5. `[P1]` Morning checklist on waking: breakfast, feed Mochi, pack school bag (homework and club items) as 3 tickable icons
6. `[P2]` Bedside alarm clock: set the wake time from 6:00 to 8:00 in 30-minute steps; snoozing gives +5 energy and costs 15 minutes
7. `[P2]` Sunday Big Clean: a 5-task home list on Sundays with a Star Sticker bonus
8. `[P2]` Gentle neglect: undone chores pile up visibly (dust, dish stacks, wilting) and drain 2 cozy a day, capped at -10; never a fail state
9. `[P3]` End-of-day summary additions: skill XP gained, grades changed, and one random "Mochi moment" line
10. `[P2]` Wait or skip time: sit on any bench or the sofa and choose "wait until..." (next hour, after school, evening, night)
11. `[P2]` Three meals a day: breakfast, lunch and dinner each give an energy boost; skipping lunch gives Hungry (-10% class minigame score)
12. `[P2]` Weekend plans: on Friday evening 1-2 friends may text an invite (place and time); turning up plays a hangout scene with bonus hearts
13. `[P2]` Seasonal goals card on day 1 of each season: 3 suggested goals (e.g. catch 5 spring fish, reach 3 hearts with Suzu) with Star Sticker rewards
14. `[P2]` Sick days: two exhausted days in a row can give Misa a cold; she stays in bed, Mochi curls up on her, and friends text get-well wishes
15. `[P2]` Daily luck from the morning TV forecast (5 faces) nudges rare-find odds by ±10%
16. `[P3]` Mum's curfew text if Misa is still out after 23:00 (flavour only, no penalty)
17. `[P3]` First-week onboarding: new systems unlock over days 1-7, with at most one tutorial pop-up per day

#### 5.3.2 Calendar, seasons & weather (28)

18. `[P2]` Season banner with the year counter on day 1 of each season
19. `[P1]` Seasonal tile sets for every outdoor map: cherry blossom, lush green, red-gold leaves, snow (palette swap plus overlay sprites)
20. `[P1]` School calendar: Spring 1 opening-day holiday, Spring and Autumn terms, all of Summer as summer break, Winter term to Winter 20 (break 21-28)
21. `[P2]` Tomorrow's forecast also on the morning TV and in a Weather app (90% accurate)
22. `[P2]` Rainy days: NPCs carry umbrellas, outdoor NPCs move to their indoor rain spots, puddles appear on paths
23. `[P2]` Umbrella item: carrying one in the rain avoids Soaked (-10 energy and a cozy drain)
24. `[P1]` Rain waters every outdoor crop automatically (the existing house-plant rain rule, extended to the yard)
25. `[P2]` Storms: lightning flashes (photosensitive-safe option), thunder, shops close at 17:00, 30% chance of a town blackout
26. `[P2]` Snow builds up on tiles over 3 snowy days; footprints stay visible for an in-game hour
27. `[P2]` Windy days: leaves and petals blow across the screen, Misa's hat can blow off (chase it), kites go on sale
28. `[P2]` Fog as a new weather type (spring and autumn mornings): smaller visibility radius at the harbour and beach and 2 fog-only fish
29. `[P3]` Rainbows when rain clears in the afternoon (20% chance); photographing one counts for a photo challenge
30. `[P2]` Summer heatwave days: outdoor energy costs +25%, shaved-ice stands open, NPCs fan themselves
31. `[P2]` 8-day moon phase cycle shown on the calendar; the full moon changes night fish and bug spawns
32. `[P2]` Tides: high and low tide twice a day at the beach; low tide reveals tidepools and the sandbar
33. `[P1]` Wall calendar and Calendar app: festivals, learned birthdays, exams, holidays, shifts and plans
34. `[P2]` Seasonal daylight: sunset moves from 17:00 in Winter to 19:30 in Summer
35. `[P2]` Cherry petals fall Spring 1-14 and gather in corners; sweeping them is a seasonal chore
36. `[P2]` Autumn leaf piles: walk through to scatter them; one pile per day hides a rare item
37. `[P2]` Winter freezes the park pond: ice-skating minigame and ice-hole fishing
38. `[P3]` Cicada sounds on summer afternoons and crickets on autumn nights
39. `[P2]` Seasonal uniforms auto-switch (summer short sleeves, winter coat), with an override toggle
40. `[P3]` Frosted windows on winter mornings in the house; draw on the condensation with the mouse
41. `[P2]` Season-change cutscene: a 4-panel postcard montage of the town turning over
42. `[P3]` Typhoon day (once per summer): everything closes, and indoor cozy activities give double cozy
43. `[P2]` Night sky quality (clear, hazy, cloudy) sets stargazing results
44. `[P3]` First snow of the year: every NPC comments on it and friends text snow photos
45. `[P3]` Pollen days in Spring: Misa and Kai sneeze occasionally; masks sell at Sunny Mart

#### 5.3.3 Main story: The Star Lantern (36)

46. `[P1]` Prologue "Boxes and Buttons" (Spring 1): arrive by bus, unpacking tutorial, chore tutorial, Mochi brings the brass button, first video call home
47. `[P1]` ★ Chapter 1 "New Girl in 2-B" (Spring 2, 8:00): first school day, meet the classmates and Ms. Fujita, then Kai and Hina tell the legend of the dark lighthouse on the walk home
48. `[P1]` ★ Chapter 2 "The Paper Star" (Spring 4+, entering the square after 15:30 with 4 locations visited): find the paper-star riddle on the noticeboard
49. `[P1]` Chapter 2: first visit to Grandma Hana at Sunny Pines; she hums the Keeper's Song and says "under the cat, dear"
50. `[P1]` Chapter 2: newspaper archive research with Suzu (a microfiche scroll-and-spot minigame finds the "Lantern goes dark" headline)
51. `[P1]` Chapter 3 "Grandma's Attic" (Chapter 2 done plus the first rainy weekend day; rain forced on Spring 13): pet Mochi off the maneki-neko to find the attic key
52. `[P1]` Keeper Journal key item: 12 readable pages with Hana's sketches; pages unlock as the story moves on
53. `[P1]` Prism 1 (Vega) found in Hana's trunk; the Mystery Board unlocks in the attic
54. `[P1]` Chapter 4 "Tick, Tock, Tobias" (Chapter 3 plus 1 heart with Tobias, or Spring 12): fix the jammed clock tower chime (gear puzzle) to earn prism 2 (Altair)
55. `[P1]` Chapter 4 deduction: match the paper star's handwriting to one of 4 samples on the Mystery Board (Tobias's repair tag)
56. `[P1]` Chapter 5 "Low Tide" (Chapter 4 plus Spring 14, a Sunday, or any later weekend day): explore the tidepool cave with Hina and find Hana's carved star
57. `[P1]` Chapter 5: catch the Moon Bream at night with Jun's borrowed lure and trade it for prism 3 (Deneb)
58. `[P1]` Chapter 6 "Stars After School" (Chapter 5 plus a weekday from Spring 16): recruit 3 classmates at 2+ hearts to revive the Astronomy Club
59. `[P1]` Chapter 6: prism 4 (Sirius) in the old telescope eyepiece, then the first club night on the roof (constellation minigame)
60. `[P1]` Chapter 7 "What the Shrine Remembers" (Chapter 6 plus 3 Grandma visits): the ema plaque-ordering puzzle with Kiko releases prism 5 (Spica)
61. `[P1]` Chapter 7: cook Starlight Mochi for Grandma; her memory returns and Mika's mother's sugar jar gives prism 6 (Polaris)
62. `[P1]` Chapter 7 sepia flashback: young Hana and Tobias lighting the lantern in 1985, drawn with a palette-swapped town
63. `[P1]` Chapter 8 "The Storm" (Spring 23 or later): town blackout, the button glows in lantern light (prism 7), Tobias confesses at the lighthouse door
64. `[P1]` Chapter 8 response choice (comfort, scold gently, stay quiet), remembered in 2 finale lines
65. `[P1]` ★ Finale "The Starlight Festival" (Spring 28, or the first Sunday 2+ days after Chapter 8 if later): festival day, the lantern relit, Hana and Tobias reconcile, credits
66. `[P1]` Finale lens puzzle: rotate 7 prisms on a ring until the projected beams line up into a star
67. `[P1]` Finale meteor-shower wish: pick 1 of 4 wishes, each giving a post-game bonus (e.g. Mochi wish: a free treat every morning)
68. `[P1]` Finale video call with Mum and Dad on the lighthouse balcony, then credits over the player's own photos
69. `[P1]` No-fail pacing: chapters never expire; after 3 days without progress a nudge arrives (a dream, a text from Suzu, or Mochi sitting by the clue)
70. `[P2]` Mystery Board UI: a corkboard of pinned clues, photos and notes; red strings draw themselves as links are found
71. `[P2]` 6 collectible paper-star riddles hidden around town, each hinting at a prism
72. `[P2]` Story journal in the phone: each chapter summarised in Misa's voice with doodles
73. `[P2]` Chapter title cards (number, name, a pixel vignette) when a chapter starts
74. `[P2]` Optional "Where next?" hint line in the quest log for the current chapter
75. `[P2]` Story-gated map unlocks: attic (Ch3), clock tower (Ch4), tidepool cave (Ch5), club room (Ch6), lighthouse (finale)
76. `[P2]` 3 dream sequences (Ch2, Ch5, Ch8) in a starfield palette where Misa follows a glowing cat
77. `[P2]` The town reacts to the story: club posters after Ch6, festival bunting after Ch8, the lantern beam over town after the finale
78. `[P2]` "Previously..." recap card on load when the player returns after 3+ real days
79. `[P2]` Post-game epilogue arcs: Summer "Keeper's Logbook", Autumn "The Other Lantern", Winter "Homecoming" (2-3 scenes each)
80. `[P3]` Hana's song leitmotif recurring in the music box, the shrine bells and the finale
81. `[P2]` Cutscene theatre in the diary: rewatch any story scene you've seen

#### 5.3.4 Side arcs & quests (26)

82. `[P1]` Side arc A "Café Kumo's Missing Menu": find 12 recipe cards around town, ending in the café's 30th anniversary party
83. `[P2]` Recipe card clues: each card's spot is hinted in Mika's dialogue (inside a library book, Goro's shed, under the shrine bell...)
84. `[P1]` Side arc B "Pip's Forgotten Satchel": deliver 10 letters undelivered for 20 years to their now-grown recipients
85. `[P2]` Letter puzzles: each letter has only a nickname or an old address, and asking NPCs narrows down who it belongs to; Tobias's letter to Hana adds a finale scene
86. `[P1]` Side arc C "The Little Grey Visitor": feed stray kitten Kuro 7 evenings, raise Mochi's acceptance, then adopt him or rehome him with Goro
87. `[P2]` Mochi-Kuro acceptance meter shown as 4 stages: hiss, watch, sniff, share the cushion
88. `[P1]` Side arc D "Rival Notes": Rina's exam rivalry becomes a study group and a sleepover, ending at the term-final rankings
89. `[P1]` Side arc E "Theo's Garage Band": recruit Kai, Hina and Misa, practise 5 times, play the Culture Festival
90. `[P3]` Band name picker (6 silly names) printed on the festival poster
91. `[P1]` ★ Town request board in the square: 3 rotating requests a day with coin and friendship rewards
92. `[P2]` 6 request templates: deliver X, find a lost item, catch fish Y, grow crop Z, photograph W, help at a shop for 1 hour
93. `[P2]` Lost-and-found: an NPC mentions a lost item, which appears as a sparkle on a random map
94. `[P2]` Family errands: Mum asks for photos of specific places; Dad asks for a local ingredient to be posted to the ship
95. `[P2]` Goro's weekend help: weeding and harvest jobs on Saturday mornings
96. `[P2]` Sunny Pines volunteering: a weekly task list (read to a resident, water the garden, play shogi)
97. `[P2]` Kiko's Seven Fox Stones: find 7 small fox statues hidden around town for a shrine blessing (+luck for a season)
98. `[P2]` Hina's Bug Census: log 20 bug species for the nature club report
99. `[P2]` Captain Jun's Tall Tales: check 5 of his stories (each a small investigation at a location)
100. `[P2]` Ms. Fujita's Lost Meteorite: night scavenger hunt on Hoshi Hill with a borrowed metal detector
101. `[P3]` Pip's Stamp Rally: stamp stations in 8 locations; a full card earns a postie cap
102. `[P3]` The Clocktower Ghost: night ticking turns out to be a pigeon nest with a broken watch inside
103. `[P2]` Mum's childhood treasure map leads to a time capsule buried in Sakura Park (Summer)
104. `[P3]` Lantern Boats: fold 20 paper boats for the festival; the reward is a lantern-boat decor
105. `[P2]` Quest log: active and completed tabs with giver portrait, location pin and rewards
106. `[P2]` Quest-complete jingle and a reward slide-in panel
107. `[P3]` Optional timers only on "urgent" requests (clock icon), never on story quests

#### 5.3.5 School life & classes (36)

108. `[P1]` ★ School day structure: homeroom 8:30, 3 morning classes, lunch 12:00-13:00, 2 afternoon classes, homeroom 15:20, then clubs
109. `[P1]` ★ Class minigames (60-90 s each): sit at your desk to attend, and the score feeds that subject's grade
110. `[P1]` Maths "Number Bubbles": click pairs of rising bubbles that add up to the target number
111. `[P1]` Japanese "Kanji Trace": follow stroke-order arrows with the mouse or keys inside a tolerance band
112. `[P1]` English "Word Scramble": rearrange letter tiles into this week's vocabulary words
113. `[P1]` Science "Reaction Lab": pour reagents in order to hit a target colour (reuses the plant-pour mechanic)
114. `[P1]` History "Timeline": drag 5 event cards into the right order
115. `[P1]` Art "Pixel Copy": redraw an 8x8 picture on a grid from memory after a 5-second look
116. `[P1]` Music "Recorder Rhythm": 3-lane rhythm notes played with keys
117. `[P1]` PE rotates by season: sprint (Spring tap rhythm), swimming (Summer stroke timing), dodgeball (Autumn dodging), jump rope (Winter timing)
118. `[P1]` Home Ec "Stitch Path": guide a needle along a dotted pattern without straying
119. `[P2]` Geography "Map Pins": drop pins on named countries on a simple world map (Mum's ship route gives bonus questions)
120. `[P2]` Class result grade (S/A/B/C/D) after each class minigame, plus Study XP
121. `[P2]` Dozing off: below 20 energy, a "stay awake" prompt appears mid-class as Misa's eyelids droop
122. `[P2]` Called on by the teacher: a random question with 3 answers; correct gives teacher friendship
123. `[P2]` Passing notes: classmates pass secret notes in class; 20% chance of getting caught (a funny scolding)
124. `[P1]` Lunch break: choose where to eat (classroom, rooftop, garden, library) and with whom, for friendship
125. `[P2]` Bento system: pack a bento from cooked dishes the night before; better bentos give a bigger afternoon buff and friends comment
126. `[P2]` School kiosk: curry bread, melon bread and yakisoba bread in limited stock; Kai races you for the last curry bread
127. `[P2]` Class duty once a week: wipe the board, water the class plant, close the windows (a short chore set)
128. `[P2]` Seating chart: desk neighbours change each term and chat during homeroom
129. `[P2]` Shoe lockers: swap to indoor shoes at the entrance; notes and small gifts sometimes appear inside
130. `[P2]` Lost property box in the staff room, used by small quests
131. `[P2]` Morning PA announcements (events, weather, club news) as scrolling text
132. `[P2]` 4 minor teachers (maths, Japanese, English, history) with sprites and 1-line portraits
133. `[P2]` School nurse's office: rest for an hour to restore 30 energy, once a day
134. `[P3]` Class goldfish to feed; neglect gives its tank a sad face
135. `[P2]` Student council requests via Rina: small school jobs for school reputation points
136. `[P3]` School reputation (0-100) unlocks club budget and nicer club room items
137. `[P2]` One school trip per term (Spring aquarium, Autumn museum, Winter onsen) on its own map with scenes
138. `[P2]` Rainy-day indoor PE: badminton in the gym (rally timing)
139. `[P3]` Chalkboard doodles that change daily; Misa can add her own during homeroom
140. `[P2]` After-school classroom cleaning with 2 friends (the sweep minigame with NPC helpers)
141. `[P3]` Hallway crowds that change between periods, plus the school bell chime
142. `[P2]` Skipping class: leaving campus during school hours counts as an absence and the teacher calls Mum (no fail)
143. `[P3]` School evacuation drill (once in Autumn): a short line-up-and-march minigame

#### 5.3.6 Grades, homework, exams & clubs (29)

144. `[P1]` ★ Grades: each subject scores 0-100 from class minigames (50%), homework (20%) and exams (30%); report card at term end
145. `[P1]` Homework: 1-2 worksheets per weekday done at the bedroom desk as a 30-second quiz; late homework earns half credit
146. `[P1]` Midterms (days 10-11) and finals (days 24-25) in Spring and Autumn, finals on Winter 17-18: 3 subjects a day, each a 2-minute version of the class minigame
147. `[P1]` Study sessions at the desk or library raise the exam "prepared" bonus (up to +20%)
148. `[P2]` Study group: invite 1-3 friends to the library; each boosts the subject they're best at
149. `[P2]` Exam rankings posted in the hallway (top 20 names), showing where you and Rina placed
150. `[P2]` Report card screen: grade per subject, teacher comments, attendance; Mum and Dad react by text
151. `[P2]` Flash cards: review while waiting at bus stops or on benches for small Study XP
152. `[P2]` Cram night: studying past midnight gives bonus XP but leaves Misa Groggy the next day
153. `[P3]` Pop quizzes: 20% chance in any class, a short 3-question version
154. `[P1]` ★ Clubs: join one of 7 (Astronomy, Art, Music/Band, Soccer, Nature, Literature, Cooking), meeting 15:30-17:30; switch once a term
155. `[P1]` Astronomy Club: stargazing logs, constellation tracing, telescope upgrades, the star map collection (from Chapter 6)
156. `[P1]` Art Club: a 32x32 pixel painting editor with a 16-colour palette; finished paintings can hang at home
157. `[P1]` Music Club: rhythm practice, 8 learnable songs, performances at festivals
158. `[P1]` Soccer Club: penalty-kick and dribble minigames, and 3 weekend matches a term against other schools
159. `[P1]` Nature Club: tend the school greenhouse, log plants and bugs, unlock rare seeds
160. `[P2]` Literature Club: write haiku from word tiles (5-7-5 syllable check); the club zine prints your best
161. `[P2]` Cooking Club: a weekly theme cook-off judged by club members
162. `[P2]` Club rank 1-5 with rank-up scenes and a club pin accessory
163. `[P2]` One inter-school competition per club per term (art contest, star-photo contest, soccer cup...)
164. `[P2]` Club room decor bought with club points (posters, beanbags, a kettle), shown in the room
165. `[P3]` Club recruitment fair in Spring week 1, with flyers in the hallway that change weekly
166. `[P2]` Honour roll: a top-3 ranking pays ¥3000 and gives a framed certificate decor
167. `[P2]` Tutoring: friends with low grades ask for help (a shared minigame) for friendship
168. `[P3]` Perfect attendance in a term gives a gold sticker and a note from Ms. Fujita
169. `[P2]` Study spots: the library desk gives +10% Study XP, the café gives cozy but -5%
170. `[P2]` Favourite subject picked at new game gives +10% XP in it
171. `[P3]` Summer homework diary: 7 picture-diary entries over the break (pick a picture and a sentence)
172. `[P3]` Year 2: Misa moves up to class 3-B with new seats, Chemistry, and a second club slot

#### 5.3.7 Part-time jobs (25)

173. `[P1]` ★ Job system: one job at a time (two from Year 2), 2-hour shifts after school or at weekends, pay per shift plus tips by score
174. `[P1]` ★ Café Kumo shift: serve 3-5 orders by matching order icons (drink, cake, size) and delivering them before the customer's patience runs out
175. `[P2]` Café latte-art bonus: drag to draw a heart, leaf or cat in the foam, scored by shape match
176. `[P1]` Sunny Mart cashier: click barcodes to scan, bag fragile items on top, give change with coin buttons
177. `[P1]` Pip's paper round: a Saturday-morning bike route throwing newspapers into mailboxes with timing
178. `[P2]` Tobias's repair bench: place gears so every tooth meshes (20 handmade layouts)
179. `[P2]` Fish market sorting: sort fish into the right crates on a conveyor before they drop
180. `[P2]` Shrine helper: sweep the steps, sell amulets, fold fortunes; extra busy at New Year
181. `[P2]` Library shelving: sort returned books onto shelves by colour-coded call numbers
182. `[P2]` Dog walking for Goro: walk Daifuku on a leash route and tug at prompts so he doesn't chase cats
183. `[P2]` Babysitting Sota (Kai's brother): pick from 3 activities to keep him happy before he gets bored
184. `[P3]` Flyers in the square: hand passers-by the flyer that matches their interest icon
185. `[P2]` Job rank 1-5 per job: each rank pays +20% and makes orders harder
186. `[P2]` Job unlocks: café any time, mart from Spring 8, repairs after Chapter 4, fish market at Fishing 3
187. `[P2]` Shifts booked in the phone's Jobs app; missing a booked shift costs friendship with the boss
188. `[P3]` A tip jar on Misa's desk that visibly fills up
189. `[P2]` Uniforms per job (café apron, mart vest, shrine haori) worn automatically during shifts
190. `[P2]` Festival rush: shifts on festival days have double the customers and double the pay
191. `[P3]` "Employee of the month" photo in the shop after 4 perfect shifts
192. `[P3]` 6 café regulars with favourite orders; remembering them earns bonus tips
193. `[P2]` Shifts cost 15-25 energy, and tired shifts lower the maximum score
194. `[P2]` Payday at the end of each shift, with a coin-counting animation
195. `[P3]` Summer job: the beach shaved-ice stand (summer break only), matching syrup flavours
196. `[P3]` Winter job: Starry Eve cake deliveries around town on Winter 24
197. `[P2]` Post-game Keeper duty: light the lantern each night for ¥200

#### 5.3.8 Money, shops & economy (25)

198. `[P2]` Star Stickers: a stackable item earned from home tasks, requests and achievements, spent in the Star Catalogue (coins stay the main money)
199. `[P1]` ★ Shop UI: buy and sell lists with icon, price, owned count and a one-line description, plus +/- for buying in bulk
200. `[P1]` Sunny Mart stock: groceries, seasonal seeds, basic tools, snacks, stationery, umbrellas, gift wrap
201. `[P1]` ★ Selling: crops to Sunny Mart, fish to Jun, fruit to the café, crafts at the market, each at listed prices
202. `[P2]` Shop hours and closed days on door signs and in the Map app
203. `[P2]` Weekly sale: one category 20% off each week, announced on the noticeboard
204. `[P2]` Saturday farmers' market: rent a stall for ¥300 and sell your own produce, setting prices against shopper reactions
205. `[P2]` Fish prices swing ±20% with season and how many you've sold that week
206. `[P2]` Star Catalogue (Aunt Nori's): 40 special decor and outfit items for Star Stickers, with a new page each season
207. `[P2]` Online shop app: order catalogue items and Pip delivers them next morning in a parcel scene
208. `[P2]` Bank app: balance, a savings jar paying 1% a week, transaction history
209. `[P2]` Savings goals (bike, telescope, greenhouse) with a progress bar on the phone
210. `[P1]` Bike (¥8000): doubles outdoor speed and opens the downhill shortcut
211. `[P2]` Bait & Tackle (Jun): rods, bait, lures, tackle box upgrades
212. `[P2]` Café Kumo menu: drinks and cakes with buffs (latte +energy, cake +cozy)
213. `[P2]` Shrine amulets with weekly effects (luck, study, health) for ¥500
214. `[P2]` 3 vending machines around town: ¥120 drinks with a 1-in-50 bonus can
215. `[P2]` Gacha capsule machine at Sunny Mart: ¥200 for 1 of 24 mini figurines you can display
216. `[P2]` Clothing rack at Sunny Mart with seasonal outfits and accessories
217. `[P2]` Home goods shelf at Sunny Mart: 30 basic furniture pieces, restocked each season
218. `[P2]` Gift wrapping at Sunny Mart (¥50): wrapped gifts give +20% friendship
219. `[P3]` Friday travelling merchant Bashō in the Shotengai: 5 rare items at high prices
220. `[P3]` A lucky coin (¥10-100) under one vending machine each day
221. `[P3]` Café loyalty card: 10 stamps earn a free cake
222. `[P3]` Receipts with a tiny doodle from Sachiko on each purchase

#### 5.3.9 Inventory & items (17)

223. `[P1]` Hotbar of 6 slots for tools and items, picked with 1-6 or the mouse wheel
224. `[P2]` More Bag tabs (tools, bugs, shells, decor, clothes) next to the existing 8, and items stack to 99
225. `[P1]` Item tooltip: name, icon, description, sell price, quality stars, known gift reactions
226. `[P2]` Storage chest at home (48 slots) and a fridge for ingredients
227. `[P2]` Item quality: 1-3 stars on crops, fish and dishes, changing price and gift value
228. `[P2]` Sort button (by category, name or value) and auto-stacking
229. `[P2]` Drag and drop between backpack, hotbar and chests; shift-click to move quickly
230. `[P2]` Spoilage: cooked food and fish keep 3 days outside the fridge, 14 days inside
231. `[P2]` Tools (watering can, hoe, rod, bug net, trowel, camera, flashlight), each upgradable to 3 tiers
232. `[P2]` Tool upgrades at Wren's Clocks, ready the next day
233. `[P2]` "New" badge on items until you hover over them
234. `[P3]` Bin at home deletes items; the recycle box turns every 5 junk items into 1 material
235. `[P2]` Bag upgrades at Sunny Mart: 36 slots for ¥2000, 48 slots for ¥5000
236. `[P3]` Favourite (lock) items so they can't be sold or binned by accident
237. `[P2]` Home mailbox for parcels, letters and orders; its flag goes up when mail is waiting
238. `[P2]` Cooking and crafting menus read straight from the fridge and chests (no carrying needed)
239. `[P3]` Each item remembers where and when you first found it (shown in the encyclopedia)

#### 5.3.10 Cooking & food (25)

240. `[P1]` ★ Cooking: 60 recipes (breakfast, bento, mains, desserts, drinks) learned from TV, Dad, friends and recipe cards
241. `[P1]` Cooking minigame: each recipe uses 3 steps chosen from chop (rhythm taps), stir (circle the mouse) and fry (release at the right colour), each scored
242. `[P1]` Recipe book: known and missing ingredients, buff, sell price, who loves it
243. `[P1]` Food buffs: dishes restore energy and cozy, and some add timed buffs (Miso Soup: +10% Study XP for 3 hours)
244. `[P2]` Cooking skill unlocks ingredient substitution and better-quality results
245. `[P2]` Failed dishes become a "Mysterious Lump": edible and giftable (everyone dislikes it, and Mochi sniffs it suspiciously)
246. `[P2]` Dish quality (1-3 stars) from the minigame score plus ingredient quality
247. `[P2]` Saturday-morning TV cooking show teaches a new recipe each week
248. `[P2]` Dad's Monday cook-alongs: a guided recipe with pun commentary
249. `[P2]` Bento builder: put 3 dishes into a bento layout; a pretty bento adds a bonus
250. `[P2]` Tea time at home: brew green, jasmine, barley or matcha tea (the existing tea action, expanded) for cozy
251. `[P2]` Story dish Starlight Mochi: glutinous rice, yuzu and sugar, cooked on a moonlit evening
252. `[P2]` 4 seasonal dishes per season that need that season's crops
253. `[P2]` Dinner guests: invite a friend over and serve their loved dish for a big heart boost
254. `[P2]` Kitchen upgrades (oven, rice cooker, mixer), each unlocking a recipe group
255. `[P3]` Eating scene: Misa sits at the table with the dish sprite while Mochi begs
256. `[P3]` Snacks from the hotbar (rice crackers, onigiri) eaten on the go
257. `[P2]` 10 hidden recipes discovered by cooking unknown 2-3 ingredient combinations
258. `[P3]` Photographing a 3-star dish posts it to the in-game social feed for likes
259. `[P2]` The café recipes from side arc A become cookable at home
260. `[P3]` Plating step for 3-star dishes: place the garnish on the plate
261. `[P2]` Picnic basket: pack up to 4 dishes for park picnics with friends
262. `[P3]` Big dishes make 2 servings, and the second goes in the fridge
263. `[P3]` Midnight snack: eating after 23:00 gives cozy but -5 energy the next day
264. `[P2]` Slow processes: dry herbs on the windowsill (1 day) and pickle or ferment in jars (3 days)

#### 5.3.11 Gardening (25)

265. `[P1]` ★ Yard garden: 12 soil plots (expandable to 24, then a greenhouse); till, plant, water, harvest
266. `[P1]` 32 crops (8 per season), each with 4 growth-stage sprites, days to grow and regrow rules
267. `[P1]` Watering outdoors is one press with a fill meter on the can; the indoor pots keep the existing pour minigame
268. `[P1]` Thirsty crops wilt after 2 dry days instead of dying; water revives them at -1 quality
269. `[P2]` 3 fertilisers: basic (+quality), speed (-1 day), retaining (stays watered in sun)
270. `[P2]` Crops end at the season change (except multi-season ones), with a warning on day 25
271. `[P2]` Giant crops: a 3x3 block of the same ripe crop has a 1% chance each night to merge into one giant crop
272. `[P2]` Flower bed: 8 flowers for gifts and vases; flowers attract butterflies
273. `[P2]` The 4 indoor sunroom pots grow herbs all year
274. `[P2]` Compost bin turns scraps and weeds into fertiliser in 3 days
275. `[P2]` Weeds sprout on untended plots; pull them by interacting
276. `[P2]` Crows can steal 1 crop from an unprotected garden; a crafted scarecrow stops them
277. `[P2]` Sprinklers (craftable, 3 tiers) water nearby plots every morning
278. `[P2]` Greenhouse (¥15000 plus materials): grow any crop in any season
279. `[P2]` 4 fruit trees (peach, persimmon, yuzu, apple) that mature in 14 days and fruit in their season
280. `[P2]` Gardening skill perks: double-harvest chance, faster tilling, the seed maker
281. `[P2]` Seed maker: turn 1 crop into 1-3 seeds
282. `[P3]` Plot signs showing each plot's crop icon
283. `[P3]` Bee box: honey every 4 days when flowers are nearby
284. `[P2]` Goro's daily tip over the fence, plus a seed packet once a week
285. `[P2]` School garden plot shared with the Nature Club (crops earn club points)
286. `[P3]` Gold-quality harvests sparkle
287. `[P2]` Harvest Market entry: submit your best crop for judging
288. `[P3]` Mushroom log in the shady yard corner gives mushrooms weekly
289. `[P3]` Rain barrel by the shed: free watering-can refills after rain

#### 5.3.12 Fishing (20)

290. `[P1]` ★ Fishing minigame: power-bar cast, wait for the bobber to dip, then hold to keep the fish icon inside a moving catch bar
291. `[P1]` 30 fish species, each with location (pond, stream, pier, beach, open sea), season, time and weather rules
292. `[P1]` Fish length (cm) recorded, with personal bests in the encyclopedia
293. `[P2]` 4 legendary fish, one per season (Moon Bream, Sakura Koi, Storm Marlin, Ice Lantern Fish), each with special conditions
294. `[P2]` Bait and lures: worms, shrimp, squid strip; lures favour certain species and speed up bites
295. `[P2]` Rod upgrades: bamboo, fibreglass, carbon (each widens the catch bar)
296. `[P2]` Junk catches (soggy newspaper, can, boot) and a rare treasure chest
297. `[P2]` Crab pots on the pier: set one, check it the next day for crabs or shrimp
298. `[P2]` Boat fishing on the *Sayori* with Jun at weekends (after his 4-heart event), on the open-sea map
299. `[P2]` Ice fishing on the frozen park pond in winter
300. `[P2]` Summer Fishing Derby: the biggest fish in 10 minutes wins
301. `[P2]` Fish shadows in the water show the size class
302. `[P3]` Gulls swoop to steal a fish left lying on the pier
303. `[P2]` Mochi waits at the door when Misa brings fish home; a fresh fish is a big affection boost
304. `[P2]` Night fishing with the flashlight for night-only species
305. `[P3]` Home aquarium decor showing up to 3 caught fish swimming
306. `[P2]` Fishing skill perks: bite indicator, perfect-catch bonus, double hook
307. `[P3]` Hina's weekly fishing challenge: "catch X before Sunday"
308. `[P3]` Fillet fish at the kitchen counter for cooking ingredients (a quick click sequence)
309. `[P3]` Per-location fish tally in the fishing journal

#### 5.3.13 Bugs, shells & collections (21)

310. `[P1]` Bug net: 30 bug species (butterflies, beetles, cicadas, fireflies, dragonflies...), each with season, time and location rules
311. `[P1]` Bug catching: walk slowly to sneak up and swing the net on time; bugs flee if Misa runs
312. `[P1]` Beachcombing: 20 shells and sea-glass finds spawn on the beach each day, with extra after storms
313. `[P2]` 8 tidepool creatures (starfish, hermit crab, anemone...) found only at low tide; observe them or catch them by hand
314. `[P2]` 12 fossils and minerals dug up from sparkle spots with the trowel (park, hill, beach)
315. `[P1]` Encyclopedia app with fish, bugs, shells, fossils and plants; unfound entries show as silhouettes
316. `[P2]` Museum corner in the library: donate finds and the display cases fill up on the map
317. `[P2]` Donation rewards at 25/50/75/100% of each category (decor, Star Stickers, a title)
318. `[P2]` Bug terrarium decor showing up to 4 caught bugs, animated
319. `[P2]` 20 wild forageables (mushrooms, berries, herbs, chestnuts) in the shrine forest and park, by season
320. `[P2]` Stamp album: rare stamps from letters and parcels
321. `[P2]` Pressed flowers: leave a flower in a book overnight, collected in an album
322. `[P2]` Star map collection: 24 constellations logged by stargazing
323. `[P3]` 6 bird feathers found near trees and the pier
324. `[P3]` Gacha figurine shelf for the 24 capsule figures
325. `[P3]` 20 postcards from Mum's ports of call and Aunt Nori's trips
326. `[P3]` Metal detector (reward from Fujita's quest): follow the beeps on the beach and hill to dig up coins and relics
327. `[P2]` Fireflies only on Summer 10-20 evenings by the park stream; releasing a jar of them plays a short scene
328. `[P3]` Rare golden variants of 5 bugs and fish (1% chance) with a shimmer
329. `[P2]` Completing a set in the encyclopedia unlocks a title and a decor item
330. `[P3]` Releasing a bug gives a little cozy and a fly-away animation

#### 5.3.14 Crafting (18)

331. `[P1]` Crafting bench in the shed: 40 recipes (tools, decor, gifts, garden gear) made from gathered materials
332. `[P1]` Materials: wood scraps, cloth, yarn, paper, shells, sea glass, stone, clay, metal bits, wire (found or bought)
333. `[P1]` Craft screen: recipe list with material counts, a craft button and a short hammering animation
334. `[P2]` Sewing machine: make clothes and accessories from cloth plus a pattern (stitch minigame sets quality)
335. `[P2]` Knitting (taught by Grandma): scarves, hats and a Mochi sweater, using a loop-timing minigame
336. `[P2]` Origami: fold paper stars, cranes and boats by following fold arrows (used in the story and as gifts)
337. `[P2]` Pottery wheel in the art room: shape pots and mugs by holding left or right; fired overnight in the kiln
338. `[P2]` Blueprints learned from NPCs, books and the attic
339. `[P2]` Upcycling: junk catches (boots, cans) become planters and decor
340. `[P2]` Friendship bracelets in 3 chosen thread colours, loved by several classmates
341. `[P3]` Candle making: wax, scent and colour make cozy-boosting decor
342. `[P3]` Postcard crafting: draw or stamp a postcard and mail it to Mum or Nori for friendship
343. `[P2]` Batch craft x5 with one confirmation
344. `[P2]` Crafting skill perks: 10% chance to save materials, a quality bonus
345. `[P3]` 8 paints for recolouring furniture
346. `[P3]` Paper lanterns for the Starlight Festival (paper + candle + a chosen design)
347. `[P2]` Break down unwanted furniture into half its materials
348. `[P3]` Workbench tier 2 unlocks furniture recipes

#### 5.3.15 Home & decorating (29)

349. `[P1]` ★ Decorate mode: grid placement with a ghost preview, rotate (R), move and store, in every room and the yard
350. `[P1]` Furniture catalogue: 150 pieces in 10 themes (cozy wood, ocean, retro, starry, forest, café...)
351. `[P1]` Today's decor (poster, cactus, lamp, plushie, bunting, window) becomes movable catalogue items
352. `[P1]` Wallpapers and floors: 24 wallpapers and 16 floors, set per room
353. `[P2]` Room cozy score from variety, matching themes, lights and plants, feeding the cozy meter
354. `[P2]` Theme set bonus: 5 pieces of one theme in a room give a sparkle and a bonus
355. `[P2]` House upgrades from Kinoko Woodworks: attic bedroom, bigger kitchen, porch, bath upgrade
356. `[P2]` Lamps cast real light circles at night and can be switched on and off
357. `[P2]` Interactive furniture: TV (channels), radio (music), piano (play notes), games console (minigame), bookshelf (read)
358. `[P2]` Wall items: your art-club paintings, photos, certificates, clocks
359. `[P2]` Bed types change sleep bonuses (futon +0, fancy bed +5 energy, hammock +cozy)
360. `[P2]` Window views change with season, time and weather (a small parallax scene)
361. `[P2]` Yard decor: benches, stone lanterns, bird bath, fences, paths, mailbox styles
362. `[P2]` Invited friends visit, comment on the decor and sit on the furniture
363. `[P2]` Monthly "Home Magazine" letter from Aunt Nori grading the house, with a prize decor
364. `[P3]` Photo frames show the player's own photos as 16x16 thumbnails
365. `[P3]` Rugs layer under furniture
366. `[P2]` Seasonal decor: kotatsu (winter), fan (summer), wind chime, koinobori, Starry Eve star tree
367. `[P2]` Kotatsu: sitting in it gives big cozy in winter, and Mochi always ends up inside
368. `[P3]` House exterior: 6 paint colours and 3 roof styles
369. `[P2]` Attic bedroom conversion with a skylight for stargazing from home
370. `[P3]` Decor plants that need watering (they join the plant task if neglected)
371. `[P3]` Music box decor (from Tobias) plays Hana's song when clicked
372. `[P2]` Decor box: stored items go to an unlimited storage box
373. `[P3]` Undo in decorate mode (last 10 moves)
374. `[P2]` Mochi uses new furniture: scratching posts, cat towers, boxes and beds, and picks favourites
375. `[P3]` Per-room light mood (warm or cool)
376. `[P2]` 8 of Hana's heirlooms from the attic, restorable at the crafting bench
377. `[P3]` Fridge magnets collected from places visited

#### 5.3.16 Mochi the cat (29)

378. `[P1]` Mochi's affection shown as 10 hearts, with bond events at 2/4/6/8/10 (see the heart events below)
379. `[P1]` ★ Harness walks: after bond event 4, Mochi can come out and walk at Misa's heels; NPCs react to her
380. `[P1]` Mochi's needs (food, play, attention) as 3 icons in a Mochi page in the phone
381. `[P2]` 3 random personality quirks per save (loves boxes, hates rain, steals socks...) that change her behaviour
382. `[P2]` Toys: feather wand (wiggle the mouse), laser pointer (she chases the dot), yarn ball
383. `[P2]` Teach 6 tricks (sit, high-five, spin, roll over, beg, jump) with a repeat-the-timing minigame
384. `[P2]` 20 possible Mochi gifts (buttons, feathers, leaves, a lost earring, a story clue)
385. `[P2]` 10 mischief events: knocks over a plant, sits on the homework (pet her off), shreds paper, climbs the curtains...
386. `[P2]` Mochi picks the warmest nap spot (sunbeam, kotatsu, laptop, laundry basket) by time and weather
387. `[P2]` Brushing minigame; she sheds more in Spring
388. `[P2]` Yearly checkup at Dr. Mori's clinic, plus a bath-day minigame (she hates it)
389. `[P2]` 8 cat foods, each with her own preference (her daily favourite stays)
390. `[P2]` Churu treats boost affection; too many make her "chubby" for 3 days
391. `[P2]` 12 Mochi accessories (bow, bandana, tiny hat, sweater) shown on her sprite
392. `[P2]` Mochi pose album: 20 poses to photograph
393. `[P2]` Dream bubbles while she naps (fish, Misa, birds)
394. `[P2]` Weather reactions: watches rain from the window, chatters at birds, hides from thunder (comfort her)
395. `[P2]` Mochi's adoption-day party on Autumn 9, with cake and friends visiting
396. `[P2]` Sleeps on Misa's bed at night after bond event 2 (seen in the morning wake-up)
397. `[P2]` Waits on the windowsill when Misa leaves for school, and is at the door when she gets back
398. `[P2]` Breakfast alarm: Mochi meows at 6:30 if she hasn't been fed (an alternative to the alarm clock)
399. `[P3]` 3 AM zoomies if Misa is still up
400. `[P3]` Meow subtitles: trill, chirp and meow types with mood icons
401. `[P2]` Story beats: she leads Misa to clues (the button, the attic key) in "follow Mochi" scenes
402. `[P3]` Cat tower climbing and a window perch for bird-watching
403. `[P3]` Steals a dish left on the table (it vanishes, and she looks guilty)
404. `[P3]` Hairball moments: a tiny cleanup task
405. `[P3]` Meets 3 named neighbourhood cats on harness walks
406. `[P3]` Scratches furniture slightly unless she has a scratching post

#### 5.3.17 Other animals & pets (12)

407. `[P2]` Daifuku the shiba: on Goro's walks and in his yard; pet him, or play fetch at the park
408. `[P2]` Kuro the kitten (side arc C): a second pet with simpler needs and kitten antics
409. `[P2]` 5 named stray cats with their own spots and schedules (harbour, shrine, café roof); feeding them fills a cat album
410. `[P2]` Birds (sparrows, crows, gulls, pigeons) that flutter away when Misa runs near
411. `[P2]` Park koi and ducks: feed them bread for cozy
412. `[P3]` A fox at the shrine forest, seen only at dusk; 5 sightings unlock a secret
413. `[P3]` A tanuki raids the yard bin on autumn nights
414. `[P3]` A harbour seal on the rocks in winter
415. `[P2]` The science-class frogs (Hina's heart event) and the class goldfish
416. `[P3]` Butterflies follow Misa when she wears a floral outfit
417. `[P3]` Gulls snatch snacks eaten on the beach
418. `[P3]` 4 townsfolk walk dogs of different breeds; petting them gives cozy

#### 5.3.18 NPCs, schedules & friendship (28)

419. `[P1]` ★ The 20-person cast registered as npc entries (look, schedule, gifts, birthday, lines, events) exactly as in the Cast section
420. `[P1]` ★ Cast art: 20 NPC sprite sheets (40x48, 11 frames x 3 rows) and portrait sheets painted with tools/studio-cast.mjs
421. `[P1]` Full schedules for all 20: weekday, weekend, rain and festival entries, using the existing schedule format
422. `[P1]` ★ Hangouts: from 3 hearts, invite a friend to a place and time (café, park, arcade, beach); the scene depends on the place
423. `[P2]` Friendship decay: -2 points a day after 7 days without talking, never dropping below a heart already reached
424. `[P2]` Best friend at 10 hearts: a nickname, a daily text, a shared-photo scene
425. `[P2]` Daily NPC mood (happy, tired, grumpy) shifts their lines and gift reactions by ±10%
426. `[P2]` NPC pairs chat on schedule (Kai and Hina on the pier), with overhearable bubbles
427. `[P2]` New line-pool keys: outfit_<id>, festival, chapter<N>, after_<quest> (added to the existing pool picker)
428. `[P2]` 12 ambient townsfolk with simple loops (jogger, commuter, parent with a pram, delivery van)
429. `[P2]` New schedule animations: read, sweep, phone, eat, fish, sketch, play guitar
430. `[P2]` Town reputation (0-100) from requests and festivals; Sachiko's gossip spreads Misa's good deeds
431. `[P2]` Townsfolk greet Misa by name once her reputation reaches 30
432. `[P2]` Group hangouts with 3 friends (picnic, karaoke, beach day) once each is at 4+ hearts
433. `[P2]` Misa's birthday (Summer 3): a surprise party from friends at 4+ hearts
434. `[P2]` Thank-you letters: NPCs mail notes after big favours, sometimes with a small gift
435. `[P2]` Friends text Misa (photos, questions, memes) according to their hearts
436. `[P2]` Friendship milestones: phone number at 2 hearts, home visits at 5
437. `[P2]` Shopkeeper discounts: 5% at 5 hearts, 10% at 10
438. `[P3]` NPCs bring up Misa's earlier choices in later lines (e.g. how she reacted to Suzu's manuscript)
439. `[P2]` Friends app additions: learned birthdays, schedule hints, a heart-event checklist
440. `[P3]` Birthday reminder text the day before
441. `[P3]` Gift-back: friends at 6+ hearts sometimes give Misa something
442. `[P2]` 4 Sunny Pines residents with small story beats (a shogi grandpa, a knitter, an old sailor, a poet)
443. `[P3]` Gift hint bubble when holding a gift near an NPC (after 4 hearts)
444. `[P2]` Giving the same disliked gift twice upsets an NPC; an apology dialogue repairs it
445. `[P3]` After hours, shops show "Closed" and a light in the keeper's upstairs window
446. `[P3]` NPCs turn their heads toward Misa when she passes within 2 tiles

#### 5.3.19 Friendship heart events (21)

447. `[P1]` Kai: maths rescue, dusk penalty practice, lost brother at the matsuri, rooftop wristband (4 events)
448. `[P1]` Suzu: the manuscript, library storm lock-in, festival reading rehearsal, the picture book (4 events)
449. `[P1]` Rina: quiz duel, the Sunny Pines secret, the empty recital seats, the study sleepover (4 events)
450. `[P1]` Theo: harbour mural, band recruitment, stage-fright calm-down, the portrait (4 events)
451. `[P1]` Hina: secret beetle tree, the escaped frogs, firefly night, the bug exhibition (4 events)
452. `[P1]` Grandma Hana: knitting lesson, photo album flashbacks, beach "jailbreak", the Keeper's Song on the bells (4 events)
453. `[P1]` Tobias: clock delivery, music box repair, the 1985 flashback, winding the clock tower (4 events)
454. `[P2]` Ms. Fujita: lab clean-up confession, Saturn through the telescope, parents' evening panic, the planisphere (4 events)
455. `[P2]` Mr. Ogawa: frost rescue, relay training montage, the missing tomato, harvest party (4 events)
456. `[P2]` Mika: espresso emergency, the recipe box, the magazine interview, the Misa Latte (4 events)
457. `[P2]` Sachiko: melon-bun crow chase, stock-take, the video-call lesson, the family discount (4 events)
458. `[P2]` Captain Jun: casting lesson, dawn boat trip, the singing fish, the Sayori's bell (4 events)
459. `[P2]` Kiko: 100 fortunes, the retro-game stream, the shimenawa rope, the midnight bell (4 events)
460. `[P2]` Pip: the twisted ankle route, the satchel, the downhill race, the postie cap (4 events)
461. `[P2]` Goro: vegetable rivalry, runaway Daifuku, his wife's flower bed, the pumpkin seeds (4 events)
462. `[P2]` Mum: house tour call, whale song, the festival diary page, the homecoming (4 events)
463. `[P2]` Dad: first cook-along, the pun-off, the wave disaster video, the secret recipe (4 events)
464. `[P2]` Aunt Nori: parcel guessing game, overnight redecoration, the sketching walk, the original poster (4 events)
465. `[P3]` Daifuku: fetch, the fence truce with Mochi, the buried geode (3 events)
466. `[P3]` Kuro: following Misa home, Mochi's first grooming, adoption-day photo (3 events)
467. `[P1]` Mochi bond events: first night on the bed, cherry-tree rescue, classroom window visit, the way to Sunny Pines, the shooting-star pebble (5 events)

#### 5.3.20 Dialogue & cutscenes (17)

468. `[P1]` ★ Dialogue content: 60+ lines per NPC across the existing pools (time of day, weather, season, hearts, location)
469. `[P2]` Per-NPC voice blips with their own pitch and timbre
470. `[P2]` Inline text effects: wavy, shaky, coloured words and pause markers
471. `[P2]` Name tags in each NPC's colour
472. `[P2]` New cutscene steps: camera pan, zoom, shake and focus on an actor
473. `[P2]` Dialogue backlog: scroll back through the last 50 lines (L)
474. `[P2]` Hold Shift to fast-forward lines you've seen; optional auto-advance
475. `[P2]` Text variables: {name}, {cat}, {item:x}, {npc:x}
476. `[P3]` Rename Mochi at new game (default "Mochi")
477. `[P2]` Flashback (sepia) and dream (starfield) filters as cutscene steps
478. `[P2]` Non-blocking bubbles: overheard chats and map-entry greetings (Sachiko: "Morning, dear!") without stopping play
479. `[P3]` Misa's inner thoughts in a cloud-tailed bubble
480. `[P2]` Group scenes: 3+ speakers, with portraits on the left and right
481. `[P2]` Letterbox bars in cutscenes, and hold Esc for 1 second to skip
482. `[P2]` CG step: a full-screen 320x224 illustration with a caption for key moments
483. `[P3]` Angry and sleepy portrait rows for all NPCs (6 moods)
484. `[P3]` All text in string tables keyed by id, ready for translation

#### 5.3.21 Phone & apps (27)

485. `[P1]` ★ Messages app ("Chirp"): one thread per friend; NPCs text on schedule and after events; reply with 2-3 canned options
486. `[P1]` Calls: video-call Mum and Dad (Wed and Sun 19:00-21:00) and friends at 2+ hearts, with animated portraits
487. `[P1]` ★ Calendar app: month grid with festivals, learned birthdays, exams, shifts and plans
488. `[P1]` ★ Map app: town map with locations, opening hours, friends' last-known spots and your position
489. `[P1]` Camera app: a viewfinder over the game screen; photos go to the Photos app
490. `[P2]` Photos app: up to 100 photos; favourite them, set one as wallpaper, frame one at home
491. `[P2]` Weather app: today and tomorrow, tide times, moon phase, night-sky quality
492. `[P2]` Recipes app: known recipes and missing ingredients
493. `[P2]` Encyclopedia app (fish, bugs, shells, fossils, plants, stars)
494. `[P2]` Bank app: balance, history, savings goals
495. `[P2]` Shop app: order catalogue items for next-day delivery
496. `[P2]` Jobs app: book shifts, pay history, job rank
497. `[P2]` Music app: play any unlocked track as background music
498. `[P2]` Mochi Cam: a live view of what Mochi is doing at home while Misa is out
499. `[P2]` "Bayside" social feed: NPC posts (photo and caption) about real game events; liking a post gives a tiny friendship boost
500. `[P2]` Notes app: type your own reminders
501. `[P2]` Bus app: timetable and a countdown to the next bus
502. `[P2]` Alarm app: set the morning alarm from anywhere
503. `[P2]` Flashlight app: a light cone at night (drains the battery)
504. `[P3]` Phone battery drained by the camera, flashlight and music; charges overnight at home
505. `[P3]` 12 phone wallpapers and cases to collect
506. `[P2]` Star Map app (after Chapter 6): constellation browser and a night-sky planner
507. `[P2]` Achievements app: badges and progress
508. `[P3]` "Neko Jump": an endless-jumper game on the phone, with a high score to beat against Kiko
509. `[P2]` Notification banners slide down for texts and quest updates, with a buzz sound
510. `[P3]` Diary app: an auto-written daily entry plus a one-tap mood pick
511. `[P2]` Mystery Board app: a read-only phone copy of the attic corkboard

#### 5.3.22 Events & festivals (27)

512. `[P1]` ★ Festival engine: on festival days a map swaps to its festival layout (stalls, bunting), NPCs follow festival schedules, and festival minigames open
513. `[P1]` Hanami Picnic (Spring 7): picnic with friends at Sakura Park, Aunt Nori visits, blossom photo contest
514. `[P1]` Sports Day (Spring 19): relay, tug-of-war and bread-eating race minigames, class against class
515. `[P1]` Starlight Festival (Spring 28): the story finale, then held every year
516. `[P1]` Tanabata Wish Night (Summer 7): write a wish on a paper strip and hang it on the bamboo; NPC wishes are readable
517. `[P1]` Beach Clean-up Day (Summer 9): collect as much trash as you can in 3 minutes
518. `[P2]` Summer Fishing Derby (Summer 14) on the pier
519. `[P1]` Summer Matsuri and Fireworks (Summer 20): yukata, goldfish scooping, ring toss, takoyaki, fireworks show
520. `[P1]` Harvest Market (Autumn 13): crop judging, a pie contest, and the giant pumpkin weigh-in against Goro
521. `[P1]` Moon Viewing (Autumn 15): make dango and watch the moon with Grandma
522. `[P1]` Culture Festival (Autumn 20-21): class café or haunted house, band performance, art and bug exhibitions
523. `[P2]` Lantern Ghost Night (Autumn 28): costumes, trick-or-treat along Lantern Lane, ghost stories at the shrine
524. `[P2]` First Snow (random early-Winter day): snowman building and a snowball-fight minigame
525. `[P1]` Winter Market (Winter 6): craft stalls, hot cocoa, ice sculptures
526. `[P2]` Friendship Chocolate Day (Winter 14): make chocolates for friends (a cooking set)
527. `[P2]` Solstice Yuzu Bath (Winter 22): a yuzu bath at home for a big cozy boost
528. `[P1]` Starry Eve (Winter 24): gift swap with friends, Aunt Nori visits, a star tree in the square
529. `[P1]` New Year's Eve (Winter 28): shrine bell at midnight, first fortune, and first sunrise at the beach on Spring 1
530. `[P3]` Koinobori Day (Spring 5): carp streamers across Lantern Lane and kashiwa mochi at Sunny Mart
531. `[P2]` Festival stall minigames: goldfish scooping, ring toss, cork-gun shooting gallery, yo-yo balloon fishing
532. `[P2]` Festival food stalls: takoyaki, yakisoba, cotton candy, candy apples (buffs and gifts)
533. `[P2]` Festival outfits: yukata (summer), happi (spring and culture festival), kimono (New Year)
534. `[P2]` Festival photo booth: a framed photo with stickers, kept as decor
535. `[P2]` Random town events: street musician, lost tourist, film crew, power cut in the square
536. `[P2]` The existing home events (parcel, rain, cat mischief, blackout, shooting star) get seasonal variants
537. `[P3]` Meteor showers (Summer 12, Winter 15) with several wishes
538. `[P2]` Festival countdown banner on the HUD 3 days before each festival

#### 5.3.23 Town, maps & travel (35)

539. `[P1]` ★ Town Square map (2x2 screens): fountain, request board, clock tower, post office, stage, bus stop
540. `[P1]` Lantern Lane map: Goro's house and garden, bus stop, vending machine, cherry trees
541. `[P1]` Sunny Mart interior: shelves, counter, clothing rack, gacha machine, arcade cabinet
542. `[P1]` Café Kumo interior: counter, 6 tables, window seat, karaoke corner
543. `[P1]` ★ Hoshimori High: classroom 2-B map
544. `[P1]` Hoshimori High: halls, club rooms, staff room, nurse and rooftop map
545. `[P1]` Hoshimori High: field, gym, greenhouse and garden map
546. `[P1]` Hoshimori Library map with study tables, archive and museum cases
547. `[P1]` Sakura Park map: pond, stream, playground, chess table, picnic lawn, bandstand
548. `[P1]` Harbour and fish market map: pier, Bait & Tackle, stalls, boat dock, mural wall
549. `[P1]` Shell Beach map with tidepools and sandbar, plus the tidepool cave
550. `[P1]` Hoshi Hill Shrine and forest path map (vertical scroll), with the lookout bench
551. `[P1]` Sunny Pines map: lounge, dining room, garden, Grandma's room
552. `[P2]` Wren's Clocks map and the clock tower interior
553. `[P2]` Hoshimori Shotengai map: salon, clinic and vet, Kinoko Woodworks, Friday merchant stall
554. `[P1]` The Star Lantern lighthouse: 3 floors (door, spiral stairs, lamp room and balcony)
555. `[P1]` The attic, added to the house map (from Chapter 3)
556. `[P2]` Bus between 3 stops (Lane, Square, Beach) for ¥100, with a short ride scene
557. `[P2]` Bike riding (once bought): faster outdoors, a bell button, no riding indoors
558. `[P2]` Shortcuts opened by the story and upgrades: shrine back path, beach stairs, school back gate
559. `[P2]` Signposts at junctions show where each exit leads
560. `[P2]` Locked shop doors say "Closed until 9:00" (or the right time)
561. `[P2]` 6 NPC home interiors, visitable at 5+ hearts
562. `[P2]` 8 hidden scenic spots (cliff bench, under the pier, rooftop...) give a cozy bonus the first time each season
563. `[P2]` Daily sparkle spots on outdoor maps for foraging and digging
564. `[P2]` Benches to sit and wait, and coins tossed into the fountain for luck
565. `[P2]` Night town: streetlights on, lit shop windows, night-only NPC spots
566. `[P3]` Ramen cart in the square (Fri and Sat 19:00-23:00): a late bowl for a big energy boost
567. `[P2]` Hoshi Hill lookout: a panoramic town view with parallax layers
568. `[P3]` Things to poke: kick the ball in the park, ring the shrine bell, ring parked bike bells
569. `[P2]` Post-game fast travel: the Keeper's map jumps to any unlocked place once a day
570. `[P3]` Day trip by train to the city to visit Aunt Nori (one-off map in Winter)
571. `[P2]` Places-discovered log (18 maps plus 8 secret spots)
572. `[P2]` Per-map camera zoom: 2x for interiors (today's look), 1x for big outdoor maps
573. `[P3]` Playground swings: a timing minigame for cozy

#### 5.3.24 Minigames & hobbies (21)

574. `[P1]` Stargazing: on clear nights at the hill or the roof, connect the stars of a constellation in order; logged to the Star Map
575. `[P2]` Photo challenges (a sunset, Mochi yawning, a rainbow, all your friends together) scored by whether the subject is in frame
576. `[P2]` Arcade cabinet at Sunny Mart: 3 retro games (Neko Jump, Star Catcher, Fish Frenzy) with high-score tables against NPCs
577. `[P2]` Friday karaoke at Café Kumo: a lyric-timing rhythm game with friends
578. `[P2]` Home piano: free play on a 2-octave keyboard mapped to QWERTY, plus 8 learnable songs
579. `[P2]` Reading: 30 books to buy or borrow; finishing one over 3 sessions gives skill XP or a recipe
580. `[P2]` Sketchbook at the desk: a 32x32 pixel drawing saved as decor
581. `[P2]` Mini shogi with Sunny Pines residents: a 5x5 board game against AI at 3 difficulties
582. `[P2]` Flower-card pairs game played with friends at hangouts
583. `[P2]` Kite flying at the beach on windy days: keep the kite steady
584. `[P2]` Sandcastle building: stack sand blocks on a small grid, judged by height and decoration
585. `[P2]` Snowman building in winter: roll and stack snowballs, decorate with items
586. `[P2]` Stone skipping at the beach and pond: angle plus timing, counted skips
587. `[P2]` Downhill bike race against Pip (after Pip's 6-heart event)
588. `[P2]` Ice skating on the frozen pond: steer and spin on prompts
589. `[P3]` Daily 5x5 picross puzzle in the puzzle magazine from Sunny Mart
590. `[P3]` Sliding jigsaw puzzle (4x4) that hangs at home when finished
591. `[P3]` Daily fortune slip at the shrine (¥100), which sets the day's luck
592. `[P3]` Cheer-dance practice with Kai for Sports Day (rhythm)
593. `[P3]` Swimming at the beach in summer: dive for shells
594. `[P3]` Radio exercises at the park at 6:30 (rhythm) for +10 max energy that day

#### 5.3.25 Fashion & appearance (15)

595. `[P1]` Outfit slots (top, bottom, shoes, hat, accessory) layered over Misa's sprite as recoloured clothing layers
596. `[P1]` School uniform worn automatically on school days (blazer in spring and autumn, coat in winter)
597. `[P2]` Wardrobe at home: change clothes and save 4 outfit presets
598. `[P2]` 60 clothing items from shops, crafting, gifts, festivals and the Star Catalogue
599. `[P2]` Salon Snip in the Shotengai: 6 hairstyles (the brown bob is the default) and 6 hair colours
600. `[P2]` NPCs notice new and themed outfits (Hina loves the bug-print tee)
601. `[P2]` Outfit perks: rain boots prevent Soaked, a sun hat protects in a heatwave, a scarf prevents Cold
602. `[P2]` Yukata, happi and kimono festival outfits with their own walk (sandals clack)
603. `[P3]` Pyjamas automatically at home after 21:00
604. `[P3]` Accessories (glasses, hair clips, ribbon, scarf, bag charms) visible in the dialogue portrait
605. `[P2]` Dialogue portrait uses the current top colour and hat
606. `[P2]` Dye station: recolour clothes with 8 dyes
607. `[P3]` Bathroom mirror: preview outfits on a mirrored sprite
608. `[P3]` Matching bandanas for Misa and Mochi give a small cozy bonus
609. `[P3]` Wearing a winter coat in summer gives Hot (sweat-drop animation)

#### 5.3.26 Skills & wellbeing (14)

610. `[P1]` 6 new skills (Study, Cooking, Gardening, Fishing, Crafting, Charm) at levels 1-10 next to the existing Homemaking skill
611. `[P2]` Perk choice at levels 5 and 10 (pick 1 of 2)
612. `[P2]` Charm rises with conversations and gifts and boosts friendship gain by up to +20%
613. `[P2]` Status effects with icons: Hungry, Soaked, Sleepy, Groggy, Inspired, Hot, Cold, Sick, each with a clear effect
614. `[P2]` Inspired: after a beautiful moment (a sunset, a festival) art and music XP double for 2 hours
615. `[P2]` Low cozy brings a gentle self-care suggestion ("Maybe a cup of tea?") with 3 options
616. `[P2]` Bath at home: +cozy, and it clears Soaked and Cold
617. `[P2]` Max energy grows +5 for every 10 nights of good sleep (cap 150)
618. `[P3]` Cozy graph for the season in the diary
619. `[P3]` School-trip onsen gives a week-long Refreshed buff
620. `[P2]` Skill books give XP when read
621. `[P3]` Meditation at the shrine (a breathing minigame) restores energy
622. `[P2]` Skills page in the phone with every level and perk
623. `[P3]` A Sunday with no work gives +10 cozy on Monday

#### 5.3.27 Achievements & stats (14)

624. `[P2]` 60 achievements with an icon, a condition (written in the condition format) and a reward (Star Stickers or a title)
625. `[P2]` Titles shown on the save slot and the phone profile ("Cat Whisperer", "Night Owl", "Lantern Keeper")
626. `[P2]` 9 story achievements, one per chapter plus the finale
627. `[P2]` Friendship achievements: first friend, 5 friends at 4 hearts, a best friend, met all 20
628. `[P2]` Collection achievements at 25/50/100% for fish, bugs, shells, fossils and recipes
629. `[P3]` Silly achievements: "Mochi broke 50 plates", "Late 10 times", "Fell asleep in class"
630. `[P2]` Achievement toast with its badge sprite
631. `[P2]` Completion percentage on the save slot and in the phone
632. `[P3]` Sticker book: arrange Star Stickers freely on collage pages
633. `[P2]` Stats page: steps walked, fish caught, dishes washed, times Mochi was petted, days played
634. `[P3]` Hidden achievements shown as ??? until earned
635. `[P3]` Seasonal achievements for doing every festival activity in a season
636. `[P3]` Perfect week: no lates, all homework, all home tasks
637. `[P3]` Lifetime earnings milestone: ¥100,000

#### 5.3.28 Graphics & visual polish (30)

638. `[P1]` ★ New 16x16 tile sets for the 16 new maps (town, school, beach, shrine, harbour), drawn as art.js pixel data or Moonkai PNG overrides
639. `[P1]` Misa animation additions: run, sit, carry, cast and reel, net swing, hoe, water, phone, wave, eat (painted on Moonkai like her current sheet)
640. `[P1]` Night light sources: lamps, windows, streetlights and lanterns drawn as additive glows over the existing day/night tint
641. `[P1]` Seasonal palettes: outdoor tiles recoloured per season with palette maps
642. `[P2]` Weather particles: rain streaks and splashes, drifting snow, cherry petals, autumn leaves, fireflies
643. `[P2]` Animated water tiles for the sea, pond and fountain, with a looping shoreline foam
644. `[P2]` Character reflections in the pond and puddles (flipped, tinted sprite)
645. `[P2]` Soft ellipse shadows under every character and object
646. `[P2]` Parallax backgrounds at the beach (sea, clouds) and the Hoshi Hill lookout (skyline layers)
647. `[P2]` Cloud shadows drifting over outdoor maps on partly cloudy days
648. `[P2]` Wind sway (2-frame swaps) on grass, trees, laundry, shop banners
649. `[P2]` Screen transitions: a cat-shaped iris wipe, fade and slide
650. `[P2]` 16x16 icons for ~400 items from a shared icon palette
651. `[P2]` Night sky: twinkling star field, moon phases, glowing constellations, shooting stars
652. `[P2]` The lantern beam: a rotating light cone over the bay maps at night after the finale
653. `[P2]` Sunbeams through windows that move with the time of day, with dust motes in the house and library
654. `[P2]` Steam from tea, ramen and the onsen; chimney smoke in winter
655. `[P2]` Footprints in sand and snow that fade over time
656. `[P2]` Ripples when stepping in puddles and casting a line
657. `[P2]` Fireworks particles for the Summer Matsuri
658. `[P3]` Glow on lanterns, stars and fireflies (blurred offscreen canvas)
659. `[P2]` 12 full-screen CG panels for key story moments, 320x224, painted in Moonkai
660. `[P3]` Animated title screen: the town at dusk with the lantern dark (lit after the finale) and Mochi on the roof
661. `[P2]` Map dressing: flowers, signs, crates, bikes, vending machines with idle animations
662. `[P3]` Shop details: a steaming coffee machine, and wall clocks whose hands show the real game time
663. `[P2]` Tall objects (trees, lamps, roofs) fade out when Misa walks behind them
664. `[P3]` Option to turn Scale2x smoothing off for crisp pixels
665. `[P3]` Heat shimmer over summer heatwave afternoons
666. `[P3]` Rain streaks on window sprites in indoor maps while it rains
667. `[P3]` Frosty vignette on snowy days and a warm vignette by the kotatsu

#### 5.3.29 Animation (10)

668. `[P2]` Shared animation states for every character: idle, walk, run, sit, carry, talk, emote, tool use
669. `[P2]` Idle fidgets: after 10 seconds Misa stretches, checks her phone or crouches to pet Mochi
670. `[P2]` World sprites bob and mouth-flap while talking
671. `[P2]` Doors open and close, and a shop bell jingles
672. `[P2]` Item pickup: the item hops into Misa's hands and the bag icon pulses
673. `[P2]` Tool-use impact frames (hoe dust, water arcs, net swoosh)
674. `[P3]` Hair and skirt sway frames when running
675. `[P3]` Squash and stretch when Mochi jumps
676. `[P2]` Crops bounce when they grow a stage in the morning
677. `[P3]` Curtains move on windy days when the windows are open

#### 5.3.30 Audio & music (14)

678. `[P2]` 9 new tracks for the existing procedural music system: harbour, library, Sunny Pines, mystery, sad, Starlight finale, credits, summer break, winter
679. `[P2]` Ambient loops: waves, gulls, wind, rain, cicadas, crickets, café chatter, classroom murmur
680. `[P2]` Positional sound: fountains and street musicians get quieter with distance
681. `[P2]` Synth instrument patches (recorder, piano, guitar, drums) for the music minigames
682. `[P2]` Music sounds muffled indoors on rainy days, with rain on the roof
683. `[P2]` Music dips while dialogue is on screen
684. `[P2]` Ambience volume slider next to the existing music and sound sliders
685. `[P3]` Mochi's purr gets louder the better the petting
686. `[P3]` A door chime for each shop
687. `[P3]` The clock tower bell rings every hour in town
688. `[P3]` Festival taiko drums and fireworks booms
689. `[P3]` Footsteps per surface (wood, stone, sand, grass, snow)
690. `[P3]` The festival track gains percussion as Misa nears the stage
691. `[P3]` Thunder delay by distance and gusting wind sounds

#### 5.3.31 UI/UX & HUD (25)

692. `[P1]` ★ Hotbar on the HUD (6 slots, 1-6 keys or mouse wheel) for tools and snacks
693. `[P1]` Cozy (mood) bar next to the existing energy bar
694. `[P2]` 9-slice pixel panels for every window, with a theme per season
695. `[P2]` Bigger bitmap font: a 7x9 size next to the current one, with hearts, stars and ¥
696. `[P2]` Hover tooltips on items, HUD icons and map markers
697. `[P2]` Mini-map toggle (top right) showing the current map and its exits
698. `[P2]` Cursor sprites that match the target (hand, talk bubble, gift, door)
699. `[P2]` Gamepad support through the Gamepad API
700. `[P2]` Gift confirmation: "Give X?" with a portrait preview
701. `[P2]` Shop previews: clothes on a paper doll, furniture in a placement preview
702. `[P2]` Location name banner the first time Misa enters a map each day
703. `[P2]` HUD hides in cutscenes and photo mode
704. `[P2]` Confirmation before selling valuable items or skipping a booked shift
705. `[P3]` Loading tips (Mochi facts)
706. `[P3]` Seasonal panel accents (petals in spring, snow caps in winter)
707. `[P2]` Hover a calendar day for its events
708. `[P2]` A "+♥" float over an NPC's head when friendship goes up
709. `[P3]` 12-hour or 24-hour clock
710. `[P2]` Shortcuts: I bag, Tab phone, J journal, C calendar, Q map
711. `[P2]` Help screen (F1) with controls and an icon legend
712. `[P3]` Photo mode: hide the HUD, pan the camera, add stickers and frames, save a PNG
713. `[P3]` Day-start banner with the weather and the day's events
714. `[P2]` Interactables pulse with an outline when Misa is close (toggleable)
715. `[P3]` Panels slide in over 120 ms
716. `[P2]` New game setup: favourite subject, Mochi's name, hoodie colour (3 choices), Relaxed or Standard mode

#### 5.3.32 Save system (10)

717. `[P1]` Import the old single-house save (misa-cozy-home-v1: day, stars, decor) into a new slot as a welcome-back parcel
718. `[P2]` Slot cards show day, season, coins, playtime and a Misa thumbnail in her current outfit
719. `[P2]` Suspend save when quitting mid-day, restored once
720. `[P2]` Compact save JSON (short keys, packed arrays) to stay well under localStorage limits
721. `[P2]` Export or import a save as a .json file
722. `[P2]` The last 3 autosaves kept per slot as backups
723. `[P2]` A checksum detects corrupt saves and falls back to the latest backup, with a notice
724. `[P3]` Copyable save code for moving between devices without any cloud
725. `[P2]` New Game+ after Year 1: keep collections, decor and skills, replay the story
726. `[P2]` Save-version migrations for every content update (new fields filled from defaults, renamed ids mapped)

#### 5.3.33 Accessibility & settings (22)

727. `[P1]` Key remapping for every action
728. `[P1]` Relaxed clock: 50%, 75%, 100% or 150% speed, or time paused indoors
729. `[P1]` Minigame assist: wider windows, slower timers, or auto-complete at a minimum score, set per minigame type
730. `[P2]` Reduced motion: no parallax, no zooms, no wobbly text (screen shake already has its own toggle)
731. `[P2]` Photosensitivity: lightning and fireworks flashes become soft fades
732. `[P2]` Colour-blind support: every colour cue also has a shape, plus 3 colour-blind UI filters
733. `[P2]` High-contrast outlines for interactables and characters
734. `[P2]` Large-text dialogue (2x font in the dialogue box, scrolling)
735. `[P2]` A clearer alternative pixel font with wider letter spacing
736. `[P2]` Sound captions for important effects ("[doorbell]", "[Mochi meows]")
737. `[P2]` Mouse-only and keyboard-only paths through every minigame
738. `[P2]` Hold or toggle for run and for minigame holds
739. `[P2]` Window scale 2x-6x and a fullscreen toggle
740. `[P2]` Pause anywhere, including in cutscenes
741. `[P2]` Separate difficulty for rhythm games and for timer games
742. `[P2]` No-energy mode (activities cost nothing)
743. `[P2]` Friendship decay on/off
744. `[P2]` Arachnophobia mode: spiders are replaced with ladybirds
745. `[P2]` Text-message frequency: all, important only, none
746. `[P3]` Cursor size 1x or 2x
747. `[P3]` Replay tutorials from Settings
748. `[P3]` Optional menu narration with speechSynthesis

#### 5.3.34 Quality of life (19)

749. `[P2]` Quick-stack: one button puts every matching item into the nearest chest
750. `[P2]` Context tool: facing soil selects the hoe or watering can automatically
751. `[P2]` Waypoints: pick a place in the Map app and an arrow guides Misa there
752. `[P2]` Optional "talked today" tick over NPC heads
753. `[P2]` "Gifted this week" marker in profiles and over heads while holding a gift
754. `[P2]` Cake icon over an NPC on their birthday
755. `[P2]` "Buy missing ingredients" button in the Recipes app while at Sunny Mart
756. `[P2]` Catches go straight into the encyclopedia with a "new!" badge
757. `[P2]` Shipping box at home: items left in it are bought by Sachiko next morning at the normal price
758. `[P2]` Minigames remember your last difficulty and input mode
759. `[P2]` Repeat scenes (job intros, shop greetings) can be skipped
760. `[P2]` Bag filter: "loved by someone I know"
761. `[P2]` Hold the watering button to water a whole row
762. `[P3]` Doors open by walking into them
763. `[P2]` Reminder to collect upgraded tools
764. `[P3]` Pin a recipe to put its ingredients on the tracker
765. `[P3]` Repeated pickup toasts merge ("+3 Shells")
766. `[P2]` Relaxed mode: at 1:30 AM a "Head home?" prompt warps Misa to bed
767. `[P3]` The Map app lists which shop sells what

#### 5.3.35 Secrets & easter eggs (20)

768. `[P3]` A secret code on the title screen gives Mochi sunglasses for that save
769. `[P3]` Pet Mochi 1000 times and she brings the Golden Button
770. `[P3]` A hidden 25th constellation, "The Cat", visible only on Mochi's adoption day
771. `[P3]` Feed the shrine fox 5 times at dusk and it leaves a fox mask
772. `[P3]` A ghost crab under the pier tells riddles, only in fog
773. `[P3]` A library book from Hana's journal opens a hidden reading nook
774. `[P3]` The clock tower strikes 13 at midnight on any Friday the 13th
775. `[P3]` Pressing the beach vending-machine buttons in the order of Hana's song gives a Mystery Drink
776. `[P3]` Hear all 20 of Ms. Fujita's puns for a title
777. `[P3]` Winning Dad's pun-off unlocks a terrible-pun T-shirt
778. `[P3]` Sit on all 25 benches in town for the "Bench Connoisseur" cushion
779. `[P3]` Talk to Mochi in the attic at 3 AM and she "says" one line
780. `[P3]` A tiny Mochi pixel hidden in each of the 18 maps; finding them all earns a plush
781. `[P3]` An old cassette in the attic replays the original Misa's Little House intro
782. `[P3]` Snow settles on Misa's hair after a long time outside on snowy days
783. `[P3]` Typing MOCHI in the Notes app plays a purr
784. `[P3]` Pip delivers a parcel addressed to Mochi: an empty box, which she sits in
785. `[P3]` A post-game door in the lighthouse basement leads to a credits room with the dev team as NPCs
786. `[P3]` A double rainbow and a shooting star at the same time (1 day in 500)
787. `[P3]` Rarely, Rina is caught watching cat videos at the café

#### 5.3.36 Post-game & replay (8)

788. `[P2]` Play continues after the finale into Year 2 and beyond, with a new timetable and festivals every year
789. `[P2]` Lantern Keeper role: light the lantern nightly, keep the logbook, wear the keeper's uniform
790. `[P2]` Harder Year 2 exams and club captaincy
791. `[P2]` Mum and Dad come home on Winter 28 of Year 1 and visit on holidays afterwards
792. `[P2]` Town upgrades from request milestones (new benches, a gazebo, a repaired pier)
793. `[P3]` Museum completion ceremony at the library
794. `[P3]` A Year 3 graduation epilogue montage, then endless play
795. `[P3]` Harder post-game versions of the jobs and minigames, with gold medals

---

## 6. Scope plan: shipping ~600 features with a small team

**The short version.** 154 P1 + 458 P2 = **612 features**, which is the ~600 build. The 183 P3s are stretch goals, cut first. This is only realistic if almost every feature is a **data entry read by an engine that already exists or is built once**. The restructured codebase is already shaped this way: `register(kind, id, def)` registries, the condition DSL in `core/cond.js`, the cutscene step runner, the schedule-driven NPCs, the phone app host, and the `feature(cat, text)` list behind FEATURES.md and the count test. The rule for the whole build:

> **One feature = one registry entry (or a handful) + one `feature(cat, text)` line next to it.** If a feature needs new engine code, that code must unlock at least 5 other features, or the feature goes to P3.

### 6.1 Engines to build once, and what falls out of them

| Engine (registry kinds) | Status | Build once | Features that fall out (approx.) |
| --- | --- | --- | --- |
| **Minigame kits** (`minigame` + a new `kit` field) | 6 bespoke minigames exist (dishes, sweep, laundry, plants, feed, pet) | 8 parameterised kits, listed below; each minigame becomes `register('minigame', id, { kit, params })` returning `score 0..1` as today | ~75: every class, job, festival stall, hobby, cooking step and exam |
| **Items** (`item`) | Bag app with 8 tabs, eat/use/give | Fields: `cat, price, sell, energy, buff, quality, spoils, giftTags, icon`; tools as items with `tier` | Bag, shops, gifts, spoilage, quality, tools, Star Stickers: ~45, plus feeding every other system |
| **Shops** (`shop`) | `{t:'shop'}` cutscene step exists | One buy/sell scene: `{ npc, map, hours, closed, stock:[{ item, when: cond }], buys:[cat] }` | 8 shops, weekly sales, market stall, catalogue, discounts: ~25 |
| **Spawn rules** (`fish`, `collectible`, `crop`, `spot`) | Not yet | One evaluator: `{ where: map/zone, when: cond, weight, rarity }`, using `season:`, `time>=`, `weather:` and new `tide:`/`moon:` atoms | 30 fish, 30 bugs, 20 shells, 12 fossils, 20 forageables, sparkle spots: ~55 |
| **Recipes** (`recipe`) | Not yet | One table for cooking *and* crafting: `{ station: kitchen\|bench\|sewing\|pottery\|knit, in:{...}, out, steps:[kitIds], learn: cond }` | 60 dishes, 40 crafts, the stations: ~45 |
| **Garden** (`crop`, `state.garden`) | Plot state exists | Daily tick (grow, water, wilt, giant, season death) driven by crop data | 32 crops, fruit trees, greenhouse, sprinklers: ~25 |
| **Story and quests** (`chapter`, `quest`, `script`, `talkHook`, `mail`) | Runner, talk hooks, quest stages and the objective tracker exist | Chapter = `{ trigger: cond, script, unlocks }`; request templates make quests from tables | Main story, side arcs, requests, errands, letters: ~65 |
| **NPCs and friendship** (`npc`) | Schedules, line pools, gifts, birthdays, heart events exist | New line keys (`outfit_`, `festival`, `chapterN`), decay, hangouts, texting | 20 cast entries, 83 heart events in 21 lines, hangouts, texting: ~55 |
| **Festivals** (`festival`, `event`) | Weather events exist (old `events.js`) | `{ date, maps:{ id: overlayObjects }, schedules:{ npc: [...] }, minigames, script }`, plus a festival flag the conditions can read | 16 festivals, stalls, random town events: ~30 |
| **Maps** (`map`, `tile`, `spot`) | ASCII-row maps, warps, spawns, 2x camera | Per-map `zoom`, `night` lights, `ambience`, season tile swaps | 16 new maps plus the attic, travel, secret spots: ~35 |
| **Phone apps** (`phoneApp`) | Host plus Bag, Journal, Friends, Settings, Save | A list/grid/detail widget kit so each app is 50-150 lines | ~22 new apps |
| **Decor and outfits** (`decor`, `outfit`) | Decor state exists | One placement mode for every room; one paper-doll layer renderer | 150 furniture, 60 clothes, decorate mode, wardrobe: ~45 |
| **Achievements** (`achievement`) | Stats counters exist | `{ when: cond, reward }` checked on bus `hour`/`dayStart` events | 60 achievements, titles, completion %: ~14 |
| **Buffs and status** (new `buff` kind) | Energy and mood only | `{ icon, dur, mult:{ xp.study: 1.1, energyCost: 1.25 } }`, read by the energy and XP functions | Food buffs, Soaked, Inspired, amulets, outfit perks: ~15 |
| **Skills** (`skill`) | Homemaking exists | XP curve plus a `perks` table read by the systems | 6 skills, perks: ~10 |

**The 8 minigame kits** (every new minigame should be one of these with different data):

| Kit | Core mechanic | Used by |
| --- | --- | --- |
| Timing bar / hold-in-zone | Keep a marker in a moving band (generalises the plant-pour and laundry timers) | Fishing, kite, ice skating, swings, stone skipping, stay awake, fry step, science pour |
| Rhythm lanes | 1-4 lanes of notes hit on time | Music class, band, karaoke, chop step, sprint, jump rope, swimming, radio exercises, cheer dance, piano songs, shrine bells |
| Order and serve | A customer queue with icon orders and patience timers | Café shift, cashier, shaved ice, fish sorting, flyers, festival food stalls, cake deliveries |
| Drag to order or sort | Drop cards or items into the right slots or sequence | History timeline, library shelving, ema plaques, stock-take, bento builder |
| Trace path | Follow a path within a tolerance band | Kanji, stitching, sewing, constellations, latte art, origami folds, knitting loops |
| Grid paint | Fill cells on a small grid against a target, or freely | Art class copy, Art Club painting, sketchbook, sandcastle, picross |
| Quiz and word | Pick answers, add numbers, arrange letters | Number Bubbles, word scramble, homework, exams, pop quizzes, called-on questions, haiku, quiz duel, pun-off |
| Catch and dodge | Move an avatar to collect or avoid falling things | Dodgeball, goldfish scooping, beach clean-up, snowball fight, bread race, arcade games, Neko Jump |

Bespoke on purpose, because they are story beats: the gear-mesh puzzle (clock tower and repair job), the lens prism ring, mini shogi, the flower-card pairs game and the sliding jigsaw. Kits make difficulty, assist modes and remembered settings work in one place, which is why the accessibility "minigame assist" item is cheap.

### 6.2 Small engine additions that unlock many lines

- **New condition atoms** in `core/cond.js`: `tide:low|high`, `moon:full`, `festival:<id>|any`, `part:morning|afternoon|evening|night`, `outfit:<id>`, `buff:<id>`, `rep>=N` (town reputation), `club:<id>`, `job:<id>`, `grade:<subject> >= N`, `photo:<id>`. Every spawn rule, shop stock line, achievement, chapter trigger and dialogue key can use them with no new code.
- **New cutscene steps**: `camera` (pan, zoom, shake, focus), `filter` (sepia, dream), `cg` (full-screen panel), `bubble` (non-blocking speech), `mail`, `photo`, `achievement`, `unlock` (map or app). Text tokens for wavy, shaky and coloured words go in the `say` text, so script writers never touch code.
- **Schedule extensions**: `festival` and `weather:` filters on entries (`seasons`, `weather` and `days` already exist), new `anim` values, and a break-time rule (students use weekend entries during holidays).
- **Bus events** already drive the day (`dayStart`, `hour`, `mapEnter`). Achievements, mail delivery, texts, crop growth, decay and story triggers should all subscribe to them rather than poll.

### 6.3 Content volume and who makes it

| Content | Amount | Notes |
| --- | --- | --- |
| Item entries | ~400 | One spreadsheet-like JS table per category; icons drawn from a shared 16-colour icon palette |
| NPC lines | 20 x 60+ = ~1,300 | Line pools (`morning`, `rain`, `h4`, `at_cafe`...) let a writer fill blanks without engine work |
| Scripts | ~150 | 9 chapters, 5 side arcs, 83 heart events, 16 festivals, phone calls |
| Maps | 16 new + the attic + ~10 small | ASCII rows plus object lists, the same format as `maps/home.js` |
| Character art | 20 sheets + 20 portrait sheets | `tools/studio-cast.mjs`; until a sheet lands, the palette-swap fallback lets NPCs ship with placeholder art |
| Tiles | ~250 tiles x 4 seasons | Paint once, then palette-map per season (4x the tiles for one piece of work) |

### 6.4 Guard rails (tests that keep 600 features honest)

1. **Feature-count test**, which already exists: every numbered line here becomes a `feature(cat, text)` next to its code. Keep this document's category names so FEATURES.md lines up with it.
2. **Content validator**: every `item`, `map`, `npc` and `quest` id referenced from gifts, schedules, shop stock, recipes, spawns and conditions must exist. Condition strings must compile at load (`cond.js` already throws on bad atoms).
3. **Schedule reachability**: for each NPC, each day type and each hour, the target tile must be walkable and reachable through warps (`core/path.js`).
4. **Calendar lint**: no festival on an exam day, at most one birthday per date per season, and no shop closed on its own festival.
5. **Save round-trip**: a new game, 3 simulated days, then save, load and compare, run against every `SAVE_VERSION` migration.

### 6.5 Build order (vertical slices of about 120 features each)

| Slice | Theme | Contents | ≈ Features |
| --- | --- | --- | --- |
| **M1** | *Leave the house* | Per-map zoom; Lantern Lane, Square, Sunny Mart, Café maps; 6 NPCs with lines; shop UI and selling; hotbar; Messages, Calendar and Map apps; request board; prologue and Chapter 1; first tile sets | 120 |
| **M2** | *School life* | 3 school maps; the quiz, trace, rhythm, sort and grid kits; 10 classes; homework, exams and grades; clubs; lunch; the 5 classmates and 2 teachers; Chapters 2-3 | 130 |
| **M3** | *Town economy and hobbies* | Jobs (order-and-serve kit); garden; fishing and spawn rules; bugs and shells; cooking and crafting recipes; harbour, beach and park maps; encyclopedia | 150 |
| **M4** | *Story and seasons* | Chapters 4-8 and the finale; festival engine and 16 festivals; side arcs; remaining NPCs and heart events; shrine, Sunny Pines and lighthouse maps; weather and season visuals | 130 |
| **M5** | *Polish and access* | Graphics polish, audio, accessibility, QoL, achievements, save extras, decorating depth | 80 |

**Cut order if time runs short:** Secrets → Other animals → P3 polish in Graphics and Audio → P3 minigames → the second half of the post-game. Never cut a P1, and never cut the accessibility P1s: key remapping, relaxed clock, minigame assist.
