// Every interior map (docs/WORLD.md): Misa's house and attic, the town shops, the library, the post office,
// Wren's Clocks and its tower, the school halls, classroom, roof and gym, and Goro's house.
// Shared interactions owned by other areas are attached through `shared()`: the object uses the registered id when
// it exists and falls back to a small flavour line until that area lands, so no map ever fails to load.
import { register, registerMany, get, features } from '../../core/registry.js';
import { RAMPS as C } from '../../gfx/palette.js';
import './rooms.js';
import './art_fixtures.js';

// ---------- helpers ----------
const G = (w, h, ch = '#') => Array.from({ length: h }, () => Array(w).fill(ch));
const fill = (g, x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch; };
const rows = (g) => g.map((r) => r.join(''));
// Markers resolved lazily by defMap(): { sh: [id, label, line] } and { ex: [map, spawn, fallback] }.
export const shared = (id, label, line) => ({ sh: [id, label, line] });
const exit = (map, spawn, fallback = 'home:door') => ({ ex: [map, spawn, fallback] });
export function defMap(id, def) {
  for (const o of def.objects || []) if (o.sh) {
    const [sid, label, line] = o.sh; delete o.sh;
    o.interact = { label, run: (g) => g.say('misa', 'neutral', line) };
    Object.defineProperty(o, 'use', { enumerable: true, configurable: true, get: () => (get('interaction', sid) ? sid : undefined) });
  }
  for (const w of def.warps || []) if (w.ex) {
    const [map, spawn, fb] = w.ex; delete w.ex;
    Object.defineProperty(w, 'to', { enumerable: true, get: () => { const d = get('map', map); return d && d.spawns && d.spawns[spawn] ? `${map}:${spawn}` : d && d.spawns && d.spawns.default ? `${map}:default` : fb; } });
  }
  return register('map', id, def);
}
const say = (line, mood = 'neutral') => (g) => g.say('misa', mood, line);
const flavor = (label, lines, mood = 'happy') => ({ label, run: (g) => g.say('misa', mood, lines[Math.floor(g.rng() * lines.length) % lines.length]) });

// live wall clocks and gears, drawn every frame by the room layer (def.liveDecor)
export function drawClock(g, x, y, r, minutes, ox, oy, ramp = C.woodDark) {
  const F = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a - ox, b - oy, w, h); };
  for (let j = -r - 1; j <= r + 1; j++) { const w = Math.floor(Math.sqrt((r + 1) * (r + 1) - j * j)); F(x - w, y + j, w * 2 + 1, 1, ramp[1]); }
  for (let j = -r + 1; j <= r - 1; j++) { const w = Math.floor(Math.sqrt((r - 1) * (r - 1) - j * j)); F(x - w, y + j, w * 2 + 1, 1, C.paper[4]); }
  for (let k = 0; k < 12; k += 3) F(x + Math.round(Math.sin(k * Math.PI / 6) * (r - 3)), y - Math.round(Math.cos(k * Math.PI / 6) * (r - 3)), 1, 1, C.ink[2]);
  const hand = (a, len, c) => { for (let i = 0; i <= len; i++) F(x + Math.round(Math.sin(a) * i), y - Math.round(Math.cos(a) * i), 1, 1, c); };
  const mm = minutes % 60, hh = (minutes / 60) % 12;
  hand((hh / 12) * Math.PI * 2, Math.max(2, r - 5), C.ink[1]); hand((mm / 60) * Math.PI * 2, r - 3, C.ink[2]); F(x, y, 1, 1, C.coral[1]);
}
export function drawGear(g, x, y, r, teeth, angle, ox, oy, rp = C.butter) {
  const F = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a - ox), Math.round(b - oy), w, h); };
  for (let k = 0; k < teeth; k++) { const a = angle + (k * Math.PI * 2) / teeth; F(x + Math.cos(a) * (r - 1) - 2, y + Math.sin(a) * (r - 1) - 2, 5, 5, rp[1]); F(x + Math.cos(a) * (r - 1) - 1, y + Math.sin(a) * (r - 1) - 1, 3, 3, rp[2]); }
  for (let j = -r + 2; j <= r - 2; j++) { const w = Math.floor(Math.sqrt((r - 2) * (r - 2) - j * j)); F(x - w, y + j, w * 2 + 1, 1, j < -r / 3 ? rp[3] : rp[2]); }
  for (let j = -r + 6; j <= r - 6; j++) { const w = Math.floor(Math.sqrt(Math.max(0, (r - 6) * (r - 6) - j * j))); F(x - w, y + j, w * 2 + 1, 1, rp[1]); }
  for (let s = 0; s < 4; s++) { const a = angle + s * Math.PI / 2; for (let i = 3; i < r - 5; i++) F(x + Math.cos(a) * i - 1, y + Math.sin(a) * i - 1, 3, 3, rp[2]); }
  for (let j = -3; j <= 3; j++) { const w = Math.floor(Math.sqrt(9 - j * j)); F(x - w, y + j, w * 2 + 1, 1, rp[0]); } F(x - 1, y - 2, 2, 1, rp[3]);
}

// ---------- flavour interactions (owned here) ----------
const HEADLINES = ['"Hoshimori Bay wins prettiest harbour, 1978." The photo has a very proud seagull in it.', '"Record sardine catch! Captain Ishida grins." He looks exactly the same, just with more hair.', '"Cafe Kumo opens on the square." Mika\'s mum is holding a giant teapot.', '"Clock tower bell recast after 50 years." Tobias is in the corner of the photo, much younger.', '"Sakura Park pond freezes; whole town goes skating."', '"School astronomy club spots a comet!" Everyone in the photo is pointing a different way.'];
registerMany('interaction', {
  int_archive: { label: 'Newspaper archive', run: (g) => { g.sfx('page'); g.stat('archiveReads'); g.run([{ t: 'say', who: null, text: 'Misa winds through a reel of old Hoshimori Herald pages...' }, { t: 'say', who: 'misa', mood: 'happy', text: HEADLINES[Math.floor(g.rng() * HEADLINES.length) % HEADLINES.length] }]); } },
  int_bath: { label: 'Take a bath', run: (g) => {
    const st = g.state.homeDecor;
    if (st.bathDay === g.day) return g.say('misa', 'happy', 'Already had a lovely soak today. Any longer and I\'ll turn into a prune.');
    st.bathDay = g.day; const hinoki = g.flag('upg_bath');
    g.advance(30); g.addEnergy(hinoki ? 20 : 10); g.addMood(hinoki ? 10 : 5); g.sfx('splash'); g.stat('baths');
    g.run([{ t: 'fade', to: 1, dur: 0.4 }, { t: 'wait', dur: 0.4 }, { t: 'fade', to: 0, dur: 0.4 }, { t: 'say', who: 'misa', mood: 'sleepy', text: hinoki ? 'The cypress tub smells like a forest after rain. Bliss.' : 'Ahh. A warm bath fixes almost everything.' }]);
  } },
  int_nook: { label: 'Read in the nook', run: (g) => { g.advance(40); g.addMood(6); g.addEnergy(4); if (get('skill', 'study')) g.addXP('study', 3); g.sfx('page'); g.say('misa', 'happy', 'Cushions, a window and a good book. I could stay here all day.'); } },
  int_piano: { label: 'Play the piano', run: (g) => { const notes = [523, 587, 659, 784, 880]; g.sfx('chime'); g.addMood(3); g.stat('pianoPlays'); g.say('misa', 'happy', ['Plink, plonk... that was almost a song!', 'I remember the first line of Grandma\'s lullaby.', 'Twinkle, twinkle... wait, which key was next?'][Math.floor(g.rng() * 3)]); void notes; } },
  int_gears: { label: 'Watch the gears', run: say('Every gear pushes the next one along. Like a little town of cogs.', 'happy') },
  int_bell: { label: 'Look at the bell', run: (g) => { g.sfx('bell'); g.say('misa', 'surprised', 'It hums when I breathe near it. It\'s enormous!'); } },
  int_view: { label: 'Look out', run: (g) => g.say('misa', 'happy', g.minutes > 19 * 60 ? 'The whole bay is lit up like a jar of fireflies.' : 'I can see the harbour, the school and even our roof from here!') },
});

// ======================= HOME =======================
{
  const g = G(24, 16);
  fill(g, 1, 2, 7, 5, 'k'); fill(g, 9, 2, 7, 5, 'l'); fill(g, 17, 2, 6, 5, 'b');
  g[4][8] = 'd'; g[4][16] = 'd'; fill(g, 12, 7, 1, 2, 'd'); fill(g, 19, 7, 1, 2, 'd');
  fill(g, 1, 9, 8, 6, 'r'); fill(g, 10, 9, 13, 6, 's'); g[11][9] = 'd'; g[15][15] = 'd';
  const task = (id, x, y, w = 1) => ({ x, y, w, h: 1, use: id, solid: false });
  defMap('home', {
    name: "Misa's House", indoor: true, interiors: true, music: 'home', bg: '#1a1226',
    legend: { '#': 'int_wall', k: 'int_fl_kitchen', l: 'int_fl_planks', b: 'int_fl_bath', r: 'int_fl_birch', s: 'int_fl_planks', d: 'int_fl_door' },
    rows: rows(g),
    rooms: [
      { id: 'kitchen', name: 'Kitchen', x: 1, y: 2, w: 7, h: 5, char: 'k', paper: 'kitchen_tile', floor: 'kitchen' },
      { id: 'living', name: 'Living room', x: 9, y: 2, w: 7, h: 5, char: 'l', paper: 'plaster', floor: 'planks' },
      { id: 'bath', name: 'Bath and laundry', x: 17, y: 2, w: 6, h: 5, char: 'b', paper: 'bath_tile', floor: 'bath' },
      { id: 'bedroom', name: 'Bedroom', x: 1, y: 9, w: 8, h: 6, char: 'r', paper: 'rose', floor: 'planks_pale' },
      { id: 'sunroom', name: 'Sunroom', x: 10, y: 9, w: 13, h: 6, char: 's', paper: 'plaster', floor: 'planks' },
    ],
    windows: [{ x: 3, y: 1, w: 2, curtain: 'mint' }, { x: 13, y: 1, w: 2, curtain: 'coral' }, { x: 21, y: 1, kind: 'round' }, { x: 0, y: 10, h: 2, side: 'left' }, { x: 23, y: 10, h: 3, side: 'right' }, { x: 0, y: 3, h: 2, side: 'left' }],
    objects: [
      // kitchen
      { spr: 'int_fridge', x: 1, y: 2, dx: 2, shadow: 12, interact: { label: 'Fridge', run: (gm) => gm.say('misa', 'neutral', Object.keys(gm.state.inv).some((k) => (get('item', k) || {}).cat === 'food') ? 'Grandma\'s fridge hums like it\'s telling a story.' : 'A little empty. Groceries at Sunny Mart!') } },
      { spr: 'int_counter', x: 2, y: 2 }, { spr: 'int_sink', x: 3, y: 2, w: 2 }, task('task_dishes', 3, 2, 2),
      { spr: 'int_dishes', x: 3, y: 2, w: 2, solid: false, dx: 9, dy: -13.5, depth: 1, when: (gm) => gm.homeTaskPending && gm.homeTaskPending('dishes') },
      { spr: 'int_stove', x: 5, y: 2, use: 'stove' }, { spr: 'int_counter', x: 6, y: 2 },
      { spr: 'int_plant_tall', x: 7, y: 2, dx: 1, shadow: 9 },
      { spr: 'int_chair', x: 2, y: 3, solid: false }, { spr: 'int_chair', x: 3, y: 3, solid: false },
      { spr: 'int_table', x: 2, y: 4, w: 2, shadow: 20 },
      { spr: 'int_chair_back', x: 2, y: 5, solid: false, depth: 2 }, { spr: 'int_chair_back', x: 3, y: 5, solid: false, depth: 2 },
      { spr: 'int_counter_long', x: 5, y: 5, w: 3, when: 'flag:upg_kitchen', interact: { label: 'Big counter', run: (gm) => gm.openCooking ? gm.openCooking() : gm.say('misa', 'happy', 'So much room to roll out dough!') } },
      { spr: 'int_bowl', x: 1, y: 6, solid: false, dx: 6, sprFn: (gm) => (gm.state.mochi.fedDay === gm.day ? 'int_bowl_full' : 'int_bowl') }, task('task_feed', 1, 6),
      // living room
      { spr: 'int_bookshelf', x: 9, y: 2, use: 'bookshelf', shadow: 14 },
      { spr: 'int_tv', x: 11, y: 2, w: 2, dx: 2, ...shared('tv', 'Watch TV', 'Just the weather channel and a cooking show. Cozy.') },
      { spr: 'int_radio', x: 14, y: 2, dx: 2, ...shared('radio', 'Radio', 'Grandma\'s old radio. It only gets one station, and it plays enka.') },
      { spr: 'int_lamp', x: 15, y: 2, dx: 8, light: { kind: 'lamp', y: -20 } },
      { spr: 'int_rug_long', x: 10, y: 4, w: 3, flat: true, dx: 0 },
      { spr: 'int_sofa_back', x: 11, y: 5, w: 3, dx: -6, fp: [10.75, 5, 2.25, 1], use: 'sofa', shadow: 30 },
      // bath and laundry
      { spr: 'int_washer', x: 17, y: 2, use: 'task_laundry' },
      { spr: 'int_basket', x: 18, y: 2, dx: 4, sprFn: (gm) => (gm.homeTaskPending && gm.homeTaskPending('laundry') ? 'int_basket_full' : 'int_basket') },
      { spr: 'int_vanity', x: 19, y: 2 },
      { spr: 'int_tub', x: 20, y: 2, w: 2, sprFn: (gm) => (gm.flag('upg_bath') ? 'int_tub_hinoki' : 'int_tub'), use: 'int_bath' },
      { spr: 'int_towels', x: 22, y: 2, dx: 4 }, { spr: 'int_bathmat', x: 20, y: 4, w: 2, flat: true, dx: 12 },
      // bedroom
      { spr: 'int_bed', x: 1, y: 9, w: 2, h: 2, fp: [1, 9, 1.25, 2], interact: { label: 'Sleep', run: (gm) => gm.sleepPrompt() } },
      { spr: 'int_desk', x: 4, y: 9, w: 2, dx: 2, use: 'desk' },
      { spr: 'int_wardrobe', x: 6, y: 9, ...shared('wardrobe', 'Wardrobe', 'Hoodies, hoodies and one very fancy dress for emergencies.') },
      { spr: 'int_mirror', x: 7, y: 9, dx: 3, ...shared('mirror', 'Mirror', 'Bed hair. Classic. Still cute though.') },
      { spr: 'int_box', x: 8, y: 9, use: 'decor_box' },
      { spr: 'int_rug_round', x: 4, y: 12, w: 2, flat: true },
      { spr: 'int_cushion', x: 7, y: 12, solid: false, dx: 2 },
      { spr: 'int_lamp', x: 3, y: 9, dx: 8, light: { kind: 'lamp', y: -20 } },
      // sunroom and entry
      { spr: 'int_pot_ok', x: 11, y: 9, dx: 6, solid: false, sprFn: (gm) => (gm.homeTaskPending && gm.homeTaskPending('plants') ? 'int_pot_wilt' : 'int_pot_ok') }, task('task_plants', 11, 9),
      { spr: 'int_pot_ok', x: 14, y: 9, dx: 6, solid: false, sprFn: (gm) => (gm.homeTaskPending && gm.homeTaskPending('plants') ? 'int_pot_wilt' : 'int_pot_ok') }, task('task_plants', 14, 9),
      { spr: 'int_pot_ok', x: 22, y: 12, dx: 6, solid: false, sprFn: (gm) => (gm.homeTaskPending && gm.homeTaskPending('plants') ? 'int_pot_wilt' : 'int_pot_ok') }, task('task_plants', 22, 12),
      { spr: 'int_ladder', x: 17, y: 9, solid: false, when: 'flag:attic_open' },
      { spr: 'int_nook', x: 19, y: 9, w: 2, when: 'flag:upg_nook', use: 'int_nook' },
      { spr: 'int_cat_tree', x: 22, y: 9, ...shared('cat_tree', 'Cat tower', 'Mochi\'s castle. She rules from the top shelf.') },
      { spr: 'int_pet_bed', x: 10, y: 13, solid: false, ...shared('pet_bed', 'Mochi\'s bed', 'Still warm. Somebody was napping here.') },
      { spr: 'int_toys', x: 11, y: 13, solid: false, dx: 3, ...shared('mochi_toys', 'Cat toys', 'A feather wand, a jingly ball and one very chewed mouse.') },
      { spr: 'int_maneki', x: 21, y: 14, dx: 7, interact: { label: 'Lucky cat', run: say('Grandma\'s maneki-neko. Its paw is waving hello... or goodbye?') } },
      { spr: 'int_genkan', x: 14, y: 14, w: 2, flat: true },
      { spr: 'int_shoes', x: 17, y: 14 }, { spr: 'int_umbrella_stand', x: 13, y: 14, dx: 8 },
      { spr: 'int_kotatsu_fixed', x: 16, y: 11, w: 2, dx: 4, when: (gm) => gm.season === 'winter', interact: { label: 'Warm up in the kotatsu', run: (gm) => { gm.advance(30); gm.addMood(10); gm.addEnergy(6); gm.say('misa', 'sleepy', 'Toasty legs, sleepy head. Winter isn\'t so bad.'); } } },
    ],
    warps: [{ x: 15, y: 15, enter: 'down', ...exit('yard', 'from_home', 'yard:front_door') }, { x: 17, y: 9, enter: 'up', to: 'attic:from_home', when: 'flag:attic_open' }],
    spawns: { default: [15, 13], bed: [3, 10], door: [15, 14, 'up'], from_yard: [15, 14, 'up'], cushion: [7, 12], from_attic: [17, 10, 'down'] },
    spots: { kitchen: [5, 3, 'up'], sofa: [10, 6, 'right'], desk: [5, 10, 'up'], tv: [12, 4, 'up'], door_inside: [15, 13, 'down'], bath: [21, 4, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 7 * 32 + 16, 26, 7, gm.minutes, ox, oy); },
  });
}

// ======================= ATTIC =======================
{
  const g = G(14, 9);
  fill(g, 1, 2, 12, 6, 'a'); g[8][7] = 'h';
  defMap('attic', {
    name: 'Attic', indoor: true, interiors: true, music: 'home', bg: '#1a1226', dark: true,
    legend: { '#': 'int_wall_attic', a: 'int_fl_walnut', h: 'int_fl_walnut' },
    rows: rows(g),
    rooms: [{ id: 'attic', name: 'Attic', x: 1, y: 2, w: 12, h: 6, char: 'a', paper: 'attic', floor: 'wood_dark' }],
    windows: [{ x: 10, y: 1, kind: 'round' }],
    objects: [
      { spr: 'int_trunk', x: 2, y: 2, w: 2, fp: [2, 2, 1.5, 1], ...shared('keeper_trunk', 'Old trunk', 'Grandma\'s trunk. It smells like cedar and old paper.') },
      { spr: 'int_board', x: 5, y: 1, w: 2, flat: true, dy: -3, ...shared('mystery_board', 'Mystery board', 'An old corkboard. Pins, string and a lot of empty space for clues.') },
      { spr: 'int_boxes', x: 1, y: 5, dx: 0 }, { spr: 'int_dressform', x: 12, y: 2, dx: 5, interact: { label: 'Dress form', run: say('Grandma used to sew all of Mum\'s clothes on this.') } },
      { spr: 'int_lamp', x: 8, y: 2, dx: 8, light: { kind: 'lamp', y: -20 } },
      { spr: 'int_skylight', x: 8, y: 1, w: 2, flat: true, dy: -10, when: 'flag:upg_skylight', ...shared('telescope', 'Skylight', 'Stars right above the attic. Grandma would love this.') },
      { spr: 'int_scope', x: 9, y: 3, dx: 2, when: 'flag:upg_skylight', solid: false },
      { spr: 'int_attic_bed', x: 10, y: 5, w: 2, when: 'flag:upg_attic_bed', interact: { label: 'Sleep', run: (gm) => gm.sleepPrompt() } },
      { spr: 'int_stairs_down', x: 7, y: 8, flat: true },
    ],
    warps: [{ x: 7, y: 8, enter: 'down', to: 'home:from_attic' }],
    spawns: { default: [7, 6], from_home: [7, 7, 'up'] },
    spots: { trunk: [3, 3, 'up'], board: [6, 2, 'up'], window: [10, 2, 'up'] },
  });
}

// ======================= CAFE KUMO =======================
{
  const g = G(18, 12);
  fill(g, 1, 2, 16, 9, '.'); fill(g, 1, 2, 8, 2, 't'); g[11][9] = 'd';
  const table = (x, y) => [{ spr: 'int_cafe_chair', x, y: y - 1, solid: false }, { spr: 'int_cafe_table', x, y, dx: -2, shadow: 14 }];
  defMap('cafe', {
    name: 'Cafe Kumo', indoor: true, interiors: true, music: 'cafe', bg: '#1e1624',
    legend: { '#': 'int_wall_cafe', '.': 'int_fl_planks', t: 'int_fl_kitchen_coral', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 11, y: 1, w: 2, curtain: 'coral' }, { x: 14, y: 1, w: 2, curtain: 'coral' }, { x: 17, y: 3, h: 6, side: 'right' }],
    objects: [
      { spr: 'int_fridge', x: 1, y: 2, dx: 2 }, { spr: 'int_sink', x: 2, y: 2, w: 2 }, { spr: 'int_stove', x: 4, y: 2 },
      { spr: 'int_counter', x: 5, y: 2, ...shared('job_cafe', 'Help in the kitchen', 'Mika\'s kitchen. Everything is labelled in tidy handwriting.') },
      { spr: 'int_menu_board', x: 6, y: 1, w: 2, flat: true, dy: -6, dx: 6, interact: { label: 'Menu', run: say('Today: honey toast, strawberry milk, and a mystery cake of the day.') } },
      { spr: 'int_pastry_case', x: 1, y: 4, w: 2 },
      { spr: 'int_cafe_counter', x: 3, y: 4, w: 2, ...shared('shop_cafe', 'Order', 'The smell of fresh coffee and warm bread. I\'ll come back with coins!') },
      { spr: 'int_espresso', x: 5, y: 4 }, { spr: 'int_counter', x: 6, y: 4 }, { spr: 'int_counter', x: 7, y: 4 },
      { spr: 'int_sugar_jar', x: 7, y: 4, solid: false, dx: 9, dy: -18, depth: 1, interact: { label: 'Sugar jar', run: say('A big old sugar jar. Mika says it was her mother\'s.') } },
      ...table(10, 4), ...table(14, 4), ...table(10, 7), ...table(14, 7),
      { spr: 'int_bench', x: 15, y: 9, w: 2, dx: -2, interact: { label: 'Window seat', run: (gm) => { gm.advance(15); gm.addMood(3); gm.say('misa', 'happy', 'People-watching from the window seat. Best seat in the house.'); } } },
      { spr: 'int_speaker', x: 1, y: 8, dx: 4 }, { spr: 'int_mic', x: 3, y: 8, solid: false, interact: flavor('Karaoke mic', ['Testing, testing... one, two, meow.', 'Karaoke night is Friday. I should practise in the shower first.']) },
      { spr: 'int_rug_round', x: 1, y: 9, w: 2, flat: true, dx: 8 },
      { spr: 'int_plant_tall', x: 16, y: 2, dx: 1 }, { spr: 'int_pot_ok', x: 9, y: 2, dx: 6 },
    ],
    lights: [{ x: 10, y: 3, kind: 'lamp' }, { x: 14, y: 3, kind: 'lamp' }, { x: 10, y: 6, kind: 'lamp' }, { x: 14, y: 6, kind: 'lamp' }, { x: 4, y: 3, kind: 'lamp' }],
    warps: [{ x: 9, y: 11, enter: 'down', ...exit('town', 'from_cafe') }],
    spawns: { default: [9, 9, 'up'], from_town: [9, 10, 'up'] },
    spots: { counter: [4, 3, 'down'], kitchen: [2, 3, 'up'], table_1: [11, 4, 'left'], table_2: [15, 4, 'left'], table_3: [11, 7, 'left'], table_4: [15, 7, 'left'], window_seat: [15, 8, 'down'], karaoke: [2, 9, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 9 * 32 + 16, 24, 8, gm.minutes, ox, oy); },
  });
}

// ======================= SUNNY MART =======================
{
  const g = G(18, 12);
  fill(g, 1, 2, 16, 9, '.'); g[11][9] = 'd';
  defMap('mart', {
    name: 'Sunny Mart', indoor: true, interiors: true, music: 'shop', bg: '#1e1624',
    legend: { '#': 'int_wall_mart', '.': 'int_fl_lino_butter', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 8, y: 1, w: 2 }, { x: 0, y: 7, h: 2, side: 'left' }],
    objects: [
      { spr: 'int_shelf_snacks', x: 1, y: 2, w: 2 }, { spr: 'int_shelf_drinks', x: 3, y: 2, w: 2, light: { kind: 'vending', y: -16 } },
      { spr: 'int_clothes_rack', x: 6, y: 2, w: 2, dx: 8 },
      { spr: 'int_shelf_home', x: 11, y: 2, w: 2 }, { spr: 'int_shelf_seeds', x: 13, y: 2, w: 2 },
      { spr: 'int_parcels', x: 16, y: 2, dx: -1, ...shared('job_mart', 'Stock shelves', 'Boxes of instant noodles, stacked taller than me.') },
      { spr: 'int_shelf_produce', x: 3, y: 6, w: 2 }, { spr: 'int_shelf_snacks', x: 6, y: 6, w: 2 }, { spr: 'int_shelf_home', x: 11, y: 6, w: 2 },
      { spr: 'int_register', x: 12, y: 9, w: 2, ...shared('shop_mart', 'Shop', 'Sunny Mart: groceries, seeds and the world\'s cutest erasers.') },
      { spr: 'int_gacha', x: 1, y: 9, dx: 3, interact: flavor('Gacha machine', ['Capsule toys! One day I\'ll get the golden cat.', 'The little sign says: new seasonal capsules every month.']) },
      { spr: 'int_arcade', x: 16, y: 8, dx: -1, light: { kind: 'screen', y: -24 }, interact: flavor('Arcade cabinet', ['STAR PILOT. High score: KAI, 98,000. Of course.', 'Insert coin to continue... maybe after homework.']) },
      { spr: 'int_plant_tall', x: 8, y: 9, dx: 1 },
    ],
    warps: [{ x: 9, y: 11, enter: 'down', ...exit('town', 'from_mart') }],
    spawns: { default: [9, 9, 'up'], from_town: [9, 10, 'up'] },
    spots: { register: [13, 8, 'down'], aisle_1: [5, 7, 'left'], aisle_2: [10, 7, 'right'], gacha: [2, 10, 'left'], arcade: [15, 9, 'right'] },
  });
}

// ======================= LIBRARY =======================
{
  const g = G(22, 14);
  fill(g, 1, 2, 20, 11, '.'); g[13][11] = 'd'; fill(g, 15, 8, 6, 5, 'm');
  defMap('library', {
    name: 'Hoshimori Library', indoor: true, interiors: true, music: 'library', bg: '#1e1624',
    legend: { '#': 'int_wall_library', '.': 'int_fl_carpet_green', m: 'int_fl_walnut', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 7, y: 1, w: 2, kind: 'tall' }, { x: 11, y: 1, w: 2, kind: 'tall' }, { x: 21, y: 9, h: 3, side: 'right' }],
    objects: [
      { spr: 'int_stack', x: 1, y: 2, w: 2 }, { spr: 'int_stack_ladder', x: 3, y: 2, w: 2 }, { spr: 'int_stack', x: 5, y: 2, w: 2 }, { spr: 'int_stack', x: 9, y: 2, w: 2 },
      { spr: 'int_stack', x: 1, y: 6, w: 2 }, { spr: 'int_stack_ladder', x: 4, y: 6, w: 2 }, { spr: 'int_stack', x: 1, y: 10, w: 2 }, { spr: 'int_stack', x: 4, y: 10, w: 2 },
      { spr: 'int_chair', x: 8, y: 5, solid: false }, { spr: 'int_chair', x: 9, y: 5, solid: false }, { spr: 'int_reading_table', x: 8, y: 6, w: 2, light: { kind: 'lamp', y: -6 } }, { spr: 'int_chair_back', x: 8, y: 7, solid: false, depth: 2 },
      { spr: 'int_chair', x: 8, y: 9, solid: false }, { spr: 'int_chair', x: 9, y: 9, solid: false }, { spr: 'int_reading_table', x: 8, y: 10, w: 2, light: { kind: 'lamp', y: -6 } }, { spr: 'int_chair_back', x: 9, y: 11, solid: false, depth: 2 },
      { spr: 'int_lib_desk', x: 13, y: 4, w: 3, dx: 8, ...shared('job_library', 'Library desk', 'A stamp, a stack of returns and a bell that says "ring for help".') },
      { spr: 'int_newspapers', x: 17, y: 2, dx: 2 }, { spr: 'int_archive', x: 18, y: 2, w: 2, dx: 6, use: 'int_archive' },
      { spr: 'int_display', x: 15, y: 9, w: 2, dx: 6, ...shared('museum', 'Museum corner', 'Display cases waiting for fossils, shells and treasures from around town.') },
      { spr: 'int_display', x: 18, y: 9, w: 2, dx: 6 }, { spr: 'int_display', x: 15, y: 12, w: 2, dx: 6 },
      { spr: 'int_sign', x: 17, y: 7, w: 2, flat: true, dx: 6, interact: { label: 'Sign', run: say('"Museum corner: donations welcome. Please do not lick the fossils."', 'happy') } },
      { spr: 'int_plant_tall', x: 20, y: 6, dx: 1 },
    ],
    warps: [{ x: 11, y: 13, enter: 'down', ...exit('town', 'from_library') }],
    spawns: { default: [11, 11, 'up'], from_town: [11, 12, 'up'] },
    spots: { desk: [14, 3, 'down'], table_1: [10, 6, 'left'], table_2: [10, 10, 'left'], archive: [19, 3, 'up'], stacks: [3, 8, 'up'], museum: [17, 10, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 16 * 32, 22, 9, gm.minutes, ox, oy); },
  });
}

// ======================= POST OFFICE =======================
{
  const g = G(14, 10);
  fill(g, 1, 2, 12, 7, '.'); g[9][7] = 'd';
  defMap('post_office', {
    name: 'Post Office', indoor: true, interiors: true, music: 'shop', bg: '#1e1624',
    legend: { '#': 'int_wall_post', '.': 'int_fl_lino_sky', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 9, y: 1, w: 2, curtain: 'sky' }],
    objects: [
      { spr: 'int_pigeonholes', x: 1, y: 2, w: 2 },
      { spr: 'int_post_counter', x: 4, y: 4, w: 3, dx: 8, ...shared('shop_post', 'Post counter', 'Stamps, envelopes and a jar of lollipops for good letter-writers.') },
      { spr: 'int_parcels', x: 6, y: 2, dx: -1 }, { spr: 'int_postbox', x: 12, y: 2, dx: 5, interact: { label: 'Postbox', run: say('A shiny red postbox. Pip polishes it every morning.', 'happy') } },
      { spr: 'int_bench', x: 9, y: 7, w: 2, dx: 8, ...shared('bench', 'Sit', 'A comfy bench for waiting in line.') },
      { spr: 'int_notice', x: 3, y: 1, w: 2, flat: true, dy: -4, interact: { label: 'Notices', run: say('"Lost: one glove, left hand. Found: one glove, right hand." Hmm.', 'happy') } },
      { spr: 'int_pot_ok', x: 12, y: 7, dx: 6 },
    ],
    warps: [{ x: 7, y: 9, enter: 'down', ...exit('town', 'from_post_office') }],
    spawns: { default: [7, 7, 'up'], from_town: [7, 8, 'up'] },
    spots: { counter: [5, 3, 'down'], sorting: [2, 3, 'up'], bench: [11, 7, 'left'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 12 * 32 + 16, 24, 8, gm.minutes, ox, oy); },
  });
}

// ======================= WREN'S CLOCKS =======================
{
  const g = G(16, 10);
  fill(g, 1, 2, 14, 7, '.'); g[9][8] = 'd';
  const CLOCKS = [[2, 18, 9], [3, 40, 6], [5, 22, 7], [8, 16, 8], [9, 40, 5], [10, 24, 6], [12, 18, 9]];
  defMap('clock_shop', {
    name: "Wren's Clocks", indoor: true, interiors: true, music: 'clock', bg: '#1e1624',
    legend: { '#': 'int_wall_clock', '.': 'int_fl_walnut', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 6, y: 1, w: 2, curtain: 'butter' }],
    objects: [
      { spr: 'int_grandfather', x: 1, y: 2, dx: 4, interact: { label: 'Grandfather clock', run: (gm) => { gm.sfx('bell'); gm.say('misa', 'happy', 'Tick... tock... It sounds like a slow heartbeat.'); } } },
      { spr: 'int_workbench', x: 3, y: 4, w: 2, light: { kind: 'lamp', y: -10 }, ...shared('job_clock', 'Repair bench', 'Tiny screwdrivers, tweezers and a loupe. Everything is so small!') },
      { spr: 'int_stool', x: 4, y: 5, solid: false, dx: 7 },
      { spr: 'int_counter', x: 8, y: 4 }, { spr: 'int_counter', x: 9, y: 4 }, { spr: 'int_counter', x: 10, y: 4 },
      { spr: 'int_cuckoo', x: 11, y: 1, flat: true, dy: -6, dx: 4, interact: { label: 'Cuckoo clock', run: (gm) => { gm.sfx('chime'); gm.say('misa', 'surprised', 'Cuckoo! The little bird nearly bonked my nose.'); } } },
      { spr: 'int_bench', x: 6, y: 7, w: 2, dx: 8, ...shared('bench', 'Sit', 'The ticking all around is oddly calming.') },
      { spr: 'int_stairs_up', x: 14, y: 2, solid: false },
      { spr: 'int_plant_tall', x: 13, y: 7, dx: 1 },
    ],
    warps: [{ x: 8, y: 9, enter: 'down', ...exit('town', 'from_clock_shop') }, { x: 14, y: 2, enter: 'up', to: 'clock_tower:from_clock_shop' }],
    spawns: { default: [8, 7, 'up'], from_town: [8, 8, 'up'], from_clock_tower: [14, 3, 'down'] },
    spots: { bench: [8, 7, 'left'], counter: [9, 3, 'down'], stool: [4, 5, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { CLOCKS.forEach(([tx, y, r], i) => drawClock(gr, tx * 32 + 16, y, r, gm.minutes + i * 37 * (i % 2), ox, oy, i % 2 ? C.wood : C.woodDark)); },
  });
}

// ======================= CLOCK TOWER =======================
{
  const g = G(10, 16);
  fill(g, 1, 2, 8, 13, '.'); g[15][5] = 'd';
  defMap('clock_tower', {
    name: 'Clock Tower', indoor: true, interiors: true, music: 'clock', bg: '#140e1a', dark: true,
    legend: { '#': 'int_wall_stone', '.': 'int_fl_stone', d: 'int_fl_stone' },
    rows: rows(g),
    windows: [{ x: 7, y: 1, kind: 'round' }, { x: 0, y: 6, h: 3, side: 'left' }, { x: 9, y: 10, h: 2, side: 'right' }],
    objects: [
      { spr: 'int_bell', x: 3, y: 2, w: 2, dx: -2, use: 'int_bell' },
      { spr: 'int_gear_frame', x: 1, y: 7, w: 2, h: 1, use: 'int_gears' },
      { spr: 'int_gear_frame', x: 6, y: 9, w: 2, h: 1, use: 'int_gears' },
      { x: 7, y: 2, solid: false, interact: { label: 'Look out', run: (gm) => get('interaction', 'int_view').run(gm) } },
      { spr: 'int_stairs_down', x: 5, y: 14, flat: true },
    ],
    lights: [{ x: 4, y: 5, kind: 'lantern' }, { x: 5, y: 11, kind: 'lantern' }],
    warps: [{ x: 5, y: 15, enter: 'down', to: 'clock_shop:from_clock_tower' }],
    spawns: { default: [5, 13, 'up'], from_clock_shop: [5, 14, 'up'] },
    spots: { gears: [3, 9, 'up'], bell: [4, 4, 'up'], view: [7, 2, 'up'] },
    liveDecor(gr, world, gm, ox, oy) {
      const a = gm.clock * 0.6;
      drawGear(gr, 64, 7 * 32 - 2, 26, 12, a, ox, oy); drawGear(gr, 98, 7 * 32 + 22, 14, 8, -a * 1.85 + 0.2, ox, oy, C.metal);
      drawGear(gr, 6 * 32 + 32, 9 * 32 - 2, 24, 11, -a * 1.1, ox, oy); drawGear(gr, 6 * 32 + 6, 9 * 32 + 20, 12, 7, a * 2.2, ox, oy, C.metal);
      drawClock(gr, 2 * 32, 24, 12, gm.minutes, ox, oy, C.butter);
    },
  });
}

// ======================= SCHOOL HALLS =======================
{
  const g = G(44, 16);
  fill(g, 1, 2, 42, 5, 'L'); g[4][0] = 'L';
  fill(g, 1, 9, 9, 6, 's'); fill(g, 11, 9, 7, 6, 'n'); fill(g, 19, 9, 11, 6, 'b'); fill(g, 31, 9, 12, 6, 'a');
  for (const x of [5, 14, 24, 36]) fill(g, x, 7, 1, 2, 'L');
  defMap('school_halls', {
    name: 'Hoshimori High', indoor: true, interiors: true, music: 'school', bg: '#1e1624',
    legend: { '#': 'int_wall_school', L: 'int_fl_lino', s: 'int_fl_carpet_navy', n: 'int_fl_lino_sky', b: 'int_fl_lino_butter', a: 'int_fl_birch' },
    rows: rows(g),
    rooms: [{ id: 'staff', x: 1, y: 9, w: 9, h: 6 }, { id: 'nurse', x: 11, y: 9, w: 7, h: 6 }, { id: 'lab', x: 19, y: 9, w: 11, h: 6 }, { id: 'art', x: 31, y: 9, w: 12, h: 6 }],
    windows: [{ x: 3, y: 1, w: 2 }, { x: 7, y: 1, w: 2 }, { x: 20, y: 1, w: 2 }, { x: 31, y: 1, w: 2 }, { x: 39, y: 1, w: 2 }, { x: 0, y: 10, h: 3, side: 'left' }, { x: 43, y: 10, h: 3, side: 'right' }],
    objects: [
      { spr: 'int_shoe_locker', x: 1, y: 2, w: 2 }, { spr: 'int_shoe_locker', x: 1, y: 6, w: 2, interact: { label: 'Shoe locker', run: say('Outdoor shoes off, indoor slippers on. Rules are rules!', 'happy') } },
      { spr: 'int_club_door', x: 11, y: 1, flat: true, dx: 2, ...shared('club_room', 'Music room', 'The music room. Someone inside is practising scales, badly and bravely.') },
      { spr: 'int_club_door', x: 15, y: 1, flat: true, dx: 2, ...shared('club_room', 'Astronomy room', 'An old sign on the door: "Astronomy Club". It looks dusty.') },
      { spr: 'int_door', x: 24, y: 1, flat: true, dx: 2 },
      { spr: 'int_sign', x: 23, y: 1, flat: true, dx: 6, dy: -42, interact: { label: 'Class 2-B', run: say('Class 2-B. My classroom!', 'happy') } },
      { spr: 'int_notice', x: 27, y: 1, w: 2, flat: true, dy: -4, ...shared('school_notice', 'Notice board', 'Club flyers, a lost pencil case and the lunch menu. Curry on Friday!') },
      { spr: 'int_stack', x: 33, y: 2, w: 2 }, { spr: 'int_bench', x: 35, y: 2, w: 2, dx: 8, ...shared('bench', 'Sit', 'A bench by the library corner. Perfect for reading between classes.') },
      { spr: 'int_stairs_up', x: 29, y: 2, solid: false },
      ...[37, 38, 39, 40, 41, 42].map((x) => ({ spr: 'int_locker', x, y: 2, dx: 6 })),
      { spr: 'int_plant_tall', x: 18, y: 2, dx: 1 },
      // staff room
      { spr: 'int_teacher_desk', x: 2, y: 10, w: 2 }, { spr: 'int_teacher_desk', x: 6, y: 10, w: 2 }, { spr: 'int_teacher_desk', x: 2, y: 13, w: 2 },
      { spr: 'int_bookshelf', x: 1, y: 9 }, { spr: 'int_counter', x: 8, y: 9 }, 
      // nurse
      { spr: 'int_nurse_bed', x: 11, y: 9, h: 2, fp: [11, 9, 1.25, 2], interact: { label: 'Nurse\'s bed', run: (gm) => { gm.advance(30); gm.addEnergy(10); gm.say('misa', 'sleepy', 'A quick rest on the nurse\'s bed. The sheets smell like sunshine.'); } } },
      { spr: 'int_curtain', x: 13, y: 9, solid: false, dx: 4 }, { spr: 'int_nurse_bed', x: 15, y: 9, h: 2, fp: [15, 9, 1.25, 2] }, { spr: 'int_vanity', x: 17, y: 9 },
      // science lab
      { spr: 'int_lab_bench', x: 20, y: 10, w: 2 }, { spr: 'int_lab_bench', x: 25, y: 10, w: 2 }, { spr: 'int_lab_bench', x: 20, y: 13, w: 2 }, { spr: 'int_lab_bench', x: 25, y: 13, w: 2 },
      { spr: 'int_skeleton', x: 29, y: 9, dx: 4, interact: flavor('Skeleton', ['Hello, Mr. Bones. You look a bit thin.', 'Someone put a ribbon on the skeleton. Probably Kai.']) },
      { spr: 'int_bookshelf', x: 19, y: 9 },
      // art room
      { spr: 'int_easel', x: 32, y: 10, interact: { label: 'Easel', run: say('Theo\'s painting of the harbour. The colours are so warm.', 'happy') } }, { spr: 'int_easel', x: 35, y: 10 }, { spr: 'int_easel', x: 38, y: 10 },
      { spr: 'int_table', x: 33, y: 13, w: 2 }, { spr: 'int_sign', x: 31, y: 8, flat: true, dx: 6, dy: -16, ...shared('club_room', 'Art club', 'The art room smells like paint and pencil shavings.') },
      { spr: 'int_piano', x: 40, y: 9, w: 2, use: 'int_piano' },
    ],
    warps: [{ x: 0, y: 4, ...exit('school_grounds', 'from_school_halls') }, { x: 24, y: 2, enter: 'up', to: 'classroom:from_school_halls' }, { x: 29, y: 2, enter: 'up', to: 'school_roof:from_school_halls' }],
    spawns: { default: [3, 4, 'right'], from_school_grounds: [1, 4, 'right'], from_classroom: [24, 3, 'down'], from_school_roof: [29, 3, 'down'] },
    spots: { lockers: [2, 4, 'up'], staff_room: [4, 11, 'up'], nurse: [16, 11, 'left'], art_room: [34, 11, 'up'], music_room: [11, 2, 'up'], astro_room: [15, 2, 'up'], science_lab: [23, 11, 'up'], notice_board: [28, 2, 'up'], library_corner: [34, 3, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 25 * 32 + 16, 20, 8, gm.minutes, ox, oy); drawClock(gr, 5 * 32 + 16, 8 * 32 + 22, 7, gm.minutes, ox, oy); },
  });
}

// ======================= CLASSROOM 2-B =======================
{
  const g = G(20, 14);
  fill(g, 1, 2, 18, 11, '.'); g[13][17] = 'd';
  const cols = [3, 6, 9, 12, 15], deskRows = [5, 8, 11], desks = [];
  for (const y of deskRows) for (const x of cols) {
    desks.push({ spr: 'int_school_chair', x, y: y + 1, solid: false, flat: true, dx: 6 });
    const d = { spr: 'int_school_desk', x, y, dx: 2, shadow: 12 };
    if (x === 15 && y === 8) Object.assign(d, shared('class_seat', 'My desk', 'My desk, by the window. Someone carved a tiny star in the corner.'));
    desks.push(d);
  }
  defMap('classroom', {
    name: 'Classroom 2-B', indoor: true, interiors: true, music: 'school', bg: '#1e1624',
    legend: { '#': 'int_wall_school', '.': 'int_fl_planks', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 19, y: 3, h: 9, side: 'right' }, { x: 16, y: 1, w: 2 }],
    objects: [
      { spr: 'int_chalkboard', x: 4, y: 1, w: 3, flat: true, dy: -3, interact: flavor('Chalkboard', ['"Today: the phases of the moon." Ms. Fujita drew a very round moon.', 'Somebody wrote "2-B is the best!" in the corner.']) },
      { spr: 'int_teacher_desk', x: 8, y: 2, w: 2 }, { spr: 'int_podium', x: 5, y: 3 },
      { spr: 'int_notice', x: 12, y: 1, w: 2, flat: true, dy: -4, interact: { label: 'Bulletin board', run: say('Class duty roster, a field trip notice and a drawing of a cat. Cute!', 'happy') } },
      { spr: 'int_shoe_locker', x: 1, y: 2, w: 2 }, { spr: 'int_pot_ok', x: 18, y: 2, dx: 6, interact: { label: 'Class plant', run: say('The class plant. Its name tag says "Mr. Leafy".', 'happy') } },
      ...desks,
    ],
    warps: [{ x: 17, y: 13, enter: 'down', to: 'school_halls:from_classroom' }],
    spawns: { default: [17, 11, 'up'], from_school_halls: [17, 12, 'up'] },
    spots: { teacher: [7, 3, 'down'], desk_misa: [15, 9, 'up'], desk_kai: [12, 9, 'up'], desk_suzu: [12, 6, 'up'], desk_rina: [3, 6, 'up'], desk_theo: [15, 12, 'up'], desk_hina: [9, 9, 'up'], window: [18, 7, 'right'], back: [18, 11, 'up'] },
    liveDecor(gr, world, gm, ox, oy) { drawClock(gr, 10 * 32 + 16, 20, 8, gm.minutes, ox, oy); },
  });
}

// ======================= SCHOOL ROOF =======================
{
  const g = G(22, 14, 'x');
  fill(g, 1, 1, 20, 12, '.');
  const rail = [];
  for (let x = 0; x < 22; x++) { rail.push({ spr: 'int_railing', x, y: 0, solid: false, dy: 4 }); rail.push({ spr: 'int_railing', x, y: 13, solid: false, flat: false, depth: 9 }); }
  for (let y = 1; y < 13; y++) { rail.push({ spr: 'int_railing_side', x: 0, y, solid: false, dx: 6 }); rail.push({ spr: 'int_railing_side', x: 21, y, solid: false, dx: 2 }); }
  defMap('school_roof', {
    name: 'School Roof', outdoor: true, music: 'school', bg: '#1e1624',
    legend: { x: 'int_roof_edge', '.': 'int_fl_roof' },
    rows: rows(g),
    objects: [
      ...rail,
      { spr: 'int_stairhouse', x: 1, y: 2, w: 2, fp: [1, 1, 2, 1.6], shadow: 28 },
      { spr: 'int_water_tank', x: 17, y: 2, w: 2, shadow: 26 },
      { spr: 'int_bench', x: 8, y: 5, w: 2, dx: 8, ...shared('bench', 'Sit', 'The wind up here feels like the whole sky is breathing.') },
      { spr: 'int_scope', x: 12, y: 4, dx: 2, ...shared('telescope', 'Old telescope', 'An old telescope with a cracked eyepiece cover.') },
      { spr: 'int_bonsai', x: 5, y: 10, dx: 1 }, { spr: 'int_bonsai', x: 15, y: 10, dx: 1 },
    ],
    warps: [{ x: 2, y: 3, enter: 'up', to: 'school_halls:from_school_roof' }],
    spawns: { default: [3, 5], from_school_halls: [2, 4, 'down'] },
    spots: { bench: [9, 6, 'up'], railing: [10, 12, 'down'], telescope: [12, 5, 'up'], corner: [19, 11, 'down'] },
  });
  register('tile', 'int_roof_edge', { ground: 'gravel', solid: true });
}

// ======================= GYM =======================
{
  const g = G(28, 18);
  fill(g, 1, 2, 26, 15, '.'); g[17][3] = 'd';
  defMap('gym', {
    name: 'Gym', indoor: true, interiors: true, music: 'school', bg: '#1e1624',
    legend: { '#': 'int_wall_gym', '.': 'int_fl_gym', d: 'int_fl_gym' },
    rows: rows(g),
    windows: [{ x: 2, y: 1, w: 2, kind: 'high' }, { x: 6, y: 1, w: 2, kind: 'high' }, { x: 20, y: 1, w: 2, kind: 'high' }, { x: 24, y: 1, w: 2, kind: 'high' }],
    decals(F) { // court lines (white, coral, sky)
      const x0 = 3 * 32, y0 = 5 * 32, w = 22 * 32, h = 10 * 32, wt = '#fffaf0';
      F(x0, y0, w, 2, wt); F(x0, y0 + h - 2, w, 2, wt); F(x0, y0, 2, h, wt); F(x0 + w - 2, y0, 2, h, wt); F(x0 + w / 2 - 1, y0, 2, h, wt);
      const cx = x0 + w / 2, cy = y0 + h / 2;
      for (let a = 0; a < 200; a++) { const t = (a / 200) * Math.PI * 2; F(Math.round(cx + Math.cos(t) * 40), Math.round(cy + Math.sin(t) * 30), 2, 2, C.coral[2]); }
      for (const [kx, dir] of [[x0, 1], [x0 + w, -1]]) { const kw = 96, kh = 96; F(dir > 0 ? kx : kx - kw, cy - kh / 2, kw, 2, C.sky[1]); F(dir > 0 ? kx : kx - kw, cy + kh / 2, kw, 2, C.sky[1]); F(kx + dir * kw - (dir > 0 ? 0 : 2), cy - kh / 2, 2, kh, C.sky[1]); }
      F(x0 + 40, y0 + 8, 12, 2, C.coral[2]);
    },
    objects: [
      { spr: 'int_gym_stage', x: 10, y: 2, w: 8, interact: { label: 'Stage', run: say('The school stage. Ceremonies, plays and the culture festival happen here.', 'happy') } },
      { spr: 'int_hoop', x: 3, y: 3, dx: -2, fp: [3.25, 3.25, 0.5, 0.75] }, { spr: 'int_hoop', x: 24, y: 3, dx: -2, fp: [24.25, 3.25, 0.5, 0.75] },
      { spr: 'int_bleachers', x: 1, y: 12, w: 3, h: 2, fp: [1, 12, 3, 2] },
      { spr: 'int_ball_cart', x: 25, y: 13, interact: flavor('Ball cart', ['Basketballs, volleyballs and one deflated soccer ball.', 'Mr. Ogawa labelled every ball with a smiley face.']) }, { spr: 'int_mats', x: 24, y: 16, w: 2 },
    ],
    warps: [{ x: 3, y: 17, enter: 'down', ...exit('school_grounds', 'from_gym') }],
    spawns: { default: [3, 15, 'up'], from_school_grounds: [3, 16, 'up'] },
    spots: { court: [14, 10, 'down'], stage: [14, 4, 'up'], bleachers: [4, 13, 'left'], storage: [24, 14, 'down'] },
  });
}

// ======================= GORO'S HOUSE =======================
{
  const g = G(16, 12);
  fill(g, 1, 2, 14, 9, 'T'); fill(g, 11, 2, 4, 3, 'w'); fill(g, 6, 9, 5, 2, 'w'); g[11][8] = 'd';
  defMap('goro_house', {
    name: "Goro's House", indoor: true, interiors: true, music: 'home', bg: '#1a1226',
    legend: { '#': 'int_wall_goro', T: 'int_fl_tatami', w: 'int_fl_walnut', d: 'int_fl_door' },
    rows: rows(g),
    windows: [{ x: 7, y: 1, w: 2, curtain: 'forest' }, { x: 0, y: 5, h: 3, side: 'left' }],
    objects: [
      { spr: 'int_tokonoma', x: 1, y: 2, w: 2, interact: { label: 'Alcove', run: say('A scroll that says "patience" and a single flower. Very Goro.', 'happy') } },
      { spr: 'int_bonsai', x: 4, y: 2, dx: 1, interact: { label: 'Bonsai', run: say('This little pine is older than Grandma. Goro talks to it every morning.', 'happy') } },
      { spr: 'int_bonsai', x: 9, y: 2, dx: 1 },
      { spr: 'int_counter', x: 11, y: 2 }, { spr: 'int_stove', x: 12, y: 2 }, { spr: 'int_sink', x: 13, y: 2, w: 2 },
      { spr: 'int_chabudai', x: 5, y: 5, w: 2, dx: 2 }, { spr: 'int_cushion', x: 5, y: 4, solid: false, dx: 2 }, { spr: 'int_cushion', x: 6, y: 6, solid: false, dx: 2, depth: 2 },
      { spr: 'int_rocker', x: 10, y: 5, interact: { label: 'Rocking chair', run: say('Goro\'s rocking chair. It creaks a happy little tune.', 'happy') } },
      { spr: 'int_dog_bed', x: 2, y: 9, solid: false, interact: { label: 'Dog bed', run: say('Daifuku\'s bed. It\'s covered in tiny shiba hairs.', 'happy') } },
      { spr: 'int_tools', x: 14, y: 8, dx: 1 }, { spr: 'int_lamp', x: 1, y: 6, dx: 8, light: { kind: 'lamp', y: -20 } },
      { spr: 'int_plant_tall', x: 14, y: 5, dx: 1 },
    ],
    warps: [{ x: 8, y: 11, enter: 'down', ...exit('lane', 'from_goro_house') }],
    spawns: { default: [8, 9, 'up'], from_lane: [8, 10, 'up'] },
    spots: { chair: [11, 5, 'left'], kitchen: [12, 3, 'up'], door: [8, 9, 'down'] },
  });
}

features('Home', [
  'Grandma\'s house rebuilt at 1:1 pixel density: kitchen, living room, bath and laundry, bedroom and a sunny entry hall',
  'Tall interior walls with baseboards, door frames and shaded thresholds in every building',
  'Windows show the real sky for the hour, with drifting clouds, stars at night, rain streaks, snowflakes and a seasonal tree outside',
  'Sun pools fall across the floor from every window, leaning with the hour and full of drifting dust motes',
  'Moonlight pools on clear nights indoors',
  'Wall clocks in homes, shops and school show the actual time of day',
  'A pull-down ladder to the attic appears once the attic is unlocked',
  'Take a warm bath once a day for energy and cozy',
  'A kotatsu appears in the entry hall in winter: sit in it to warm up',
  'The cat tower, Mochi\'s bed and toy basket have a home in the sunny entry hall',
  'Each room of the house has its own look: tiled kitchen, sky-blue bath, rose bedroom, plank living room and sunroom',
  'The attic: Grandma\'s old trunk, the mystery corkboard, stacked boxes, a dress form and a round window',
  'Indoors, rain and snow appear only through the windows, never inside',
  'Lamps, banker lamps, cafe pendant lights, the drinks fridge and the arcade cabinet glow after dark',
  'The clock tower is dim and lantern-lit, with a wall clock that keeps the town\'s time',
  'Sit at Cafe Kumo\'s window seat to people-watch for a little cozy',
]);
features('Town', [
  'Cafe Kumo interior: pastry case, espresso machine, four tables, a window seat and a karaoke corner',
  'Sunny Mart interior: grocery aisles, a drinks fridge, seed rack, clothing rack, gacha machine and arcade cabinet',
  'Hoshimori Library: tall stacks with hand-made book spines, reading tables with green banker lamps and a librarian desk',
  'Library newspaper archive: wind through reels of old Hoshimori Herald headlines',
  'Library museum corner with glass display cases',
  'Post office interior: counter, pigeonhole sorting wall, parcels, postbox and a waiting bench',
  'Wren\'s Clocks: a shop full of ticking clocks (each on its own time), a grandfather clock, a cuckoo clock and a repair bench',
  'The clock tower interior: huge brass gears turning in real time, the great bell and a round window over the bay',
  'Goro\'s house: tatami room with a tokonoma alcove, bonsai, rocking chair, tea table and Daifuku\'s bed',
  'Little flavour interactions everywhere: menus, notices, a gacha machine, an arcade high score, a cuckoo that nearly bonks Misa',
]);
features('School', [
  'School halls: entrance shoe lockers, a long window corridor, lockers, a library corner and stairs to the roof',
  'Staff room, nurse\'s office (rest on the bed for energy), science lab with a skeleton and an art room with easels and a piano',
  'Classroom 2-B: a 15-desk grid, chalkboard with chalk scribbles, podium, bulletin board and a window wall that floods the desks with light',
  'Misa\'s desk is by the window, next to Kai\'s',
  'School roof with railings, a water tank, a bench and an old telescope',
  'Gym with a painted court, two hoops, a curtained stage, bleachers, ball cart and mats under high windows with long light shafts',
  'Play the art room piano',
]);
