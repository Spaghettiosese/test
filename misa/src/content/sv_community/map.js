// The Hoshimori Community Hall interior (24x16) and its door in the town square.
// Layout: three rooms across the top (Fish Tank, Pantry, Craft Room), a lobby band with the heart tree, and three
// across the bottom (Garden Room, the Vault with the front door, Night Sky Room). Everything starts dusty; each
// restored room (flag hall_room_<id>) swaps in clean floors, lit lanterns, working furnishings and hall sprites.
import { register, get } from '../../core/registry.js';
import { kodama } from './art.js';
import { ROOMS, ROOM_ORDER, S, bundlesOf } from './data.js';

register('tile', 'ch_floor_fish', { floor: 'bath' });
register('tile', 'ch_floor_vault', { floor: 'stone' });

const G = (w, h, ch = '#') => Array.from({ length: h }, () => Array(w).fill(ch));
const fill = (g, x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch; };
const g = G(24, 16);
fill(g, 1, 2, 7, 5, 'f'); fill(g, 9, 2, 6, 5, 'p'); fill(g, 16, 2, 7, 5, 'c');
fill(g, 1, 7, 22, 3, 'l');
fill(g, 1, 10, 7, 5, 'g'); fill(g, 9, 10, 6, 5, 'v'); fill(g, 16, 10, 7, 5, 'n');
g[15][12] = 'd';

const say = (line, who = null) => (gm) => gm.say(who, who ? 'happy' : 'neutral', line);
const look = (label, line) => ({ label, run: say(line, 'misa') });
const flagOn = (f) => `flag:${f}`, flagOff = (f) => `!flag:${f}`;
const roomFlag = (r) => ROOMS[r].flag;
const board = (room, x, y) => ({ spr: `ch_board_${room}`, x, y, w: 2, h: 1, shadow: 0, interact: { label: `${ROOMS[room].name} bundles`, run: (gm) => gm.open('ch_bundles', room) } });
const dust = (name, room, x, y, w, h) => ({ spr: name, x, y, w, h, flat: true, solid: false, when: flagOff(roomFlag(room)) });
const lantern = (room, x, y) => ({ spr: 'ch_lantern_off', x, y, sprFn: (gm) => (gm.flag(roomFlag(room)) ? 'ch_lantern_on' : 'ch_lantern_off'), dx: 6, light: { kind: 'lantern', when: flagOn(roomFlag(room)) }, shadow: 6 });
const sheet = (room, x, y) => ({ spr: 'ch_sheet', x, y, when: flagOff(roomFlag(room)), interact: look('Dust sheet', 'A dust sheet over something chair-shaped. Achoo!') });

// Hall sprites: [x, y, tint, condition]. Two per restored room, one per room's first bundle in the lobby, and a party once restored.
const SP = [];
const add = (x, y, tint, when, guide) => SP.push({ x, y, tint, when, guide });
add(3, 5, 'mint', flagOn('hall_room_fish')); add(6, 4, 'leaf', flagOn('hall_room_fish'));
add(10, 4, 'sun', flagOn('hall_room_pantry')); add(13, 5, 'rose', flagOn('hall_room_pantry'));
add(19, 5, 'leaf', flagOn('hall_room_craft')); add(21, 4, 'mint', flagOn('hall_room_craft'));
add(3, 13, 'sun', flagOn('hall_room_garden')); add(6, 11, 'rose', flagOn('hall_room_garden'));
add(18, 13, 'mint', flagOn('hall_room_night')); add(21, 12, 'leaf', flagOn('hall_room_night'));
add(10, 13, 'rose', flagOn('hall_room_vault')); add(14, 12, 'sun', flagOn('hall_room_vault'));
ROOM_ORDER.forEach((r, i) => add(2 + i * 4, 9, ['leaf', 'mint', 'sun', 'rose'][i % 4], flagOn('hall_b_' + bundlesOf(r)[0].id)));
add(5, 8, 'sun', 'flag:community_restored'); add(8, 9, 'rose', 'flag:community_restored'); add(15, 8, 'leaf', 'flag:community_restored'); add(18, 9, 'mint', 'flag:community_restored'); add(21, 8, 'sun', 'flag:community_restored');
add(10, 12, 'leaf', null, true); // Elder Moss, the guide, who is always about
const spriteObj = (s, i) => ({
  spr: kodama(s.tint, 0), x: s.x, y: s.y, shadow: 7, dx: 5, when: s.when || undefined,
  sprFn: (gm) => kodama(s.tint, Math.floor(gm.clock * 2 + i) % 2),
  interact: s.guide ? { label: 'Talk to Elder Moss', run: (gm) => gm.run(get('script', 'ch_elder').steps(gm)) } : { label: 'Hall sprite', run: (gm) => gm.run(get('script', 'ch_sprite_chat').steps(gm)) },
});

register('map', 'community_hall', {
  name: 'Community Hall', indoor: true, interiors: true, music: 'library', bg: '#1e1624', dark: true,
  legend: { '#': 'int_wall_library', f: 'ch_floor_fish', p: 'int_fl_kitchen_butter', c: 'int_fl_planks', l: 'int_fl_walnut', g: 'int_fl_carpet_mint', v: 'ch_floor_vault', n: 'int_fl_carpet_navy', d: 'int_fl_door' },
  rows: g.map((r) => r.join('')),
  objects: [
    // dust and cobwebs over every unrestored room, and over the lobby until three rooms are done
    dust('ch_dust_7x5', 'fish', 1, 2, 7, 5), dust('ch_dust_6x5', 'pantry', 9, 2, 6, 5), dust('ch_dust_7x5', 'craft', 16, 2, 7, 5),
    dust('ch_dust_7x5', 'garden', 1, 10, 7, 5), dust('ch_dust_6x5', 'vault', 9, 10, 6, 5), dust('ch_dust_7x5', 'night', 16, 10, 7, 5),
    { spr: 'ch_dust_lobby', x: 1, y: 7, w: 22, h: 3, flat: true, solid: false, when: '!flag:hall_rooms3' },
    // Fish Tank
    board('fish', 2, 2), { spr: 'ch_tank_dry', x: 5, y: 2, w: 3, h: 1, sprFn: (gm) => (gm.flag('hall_room_fish') ? 'ch_tank_full' : 'ch_tank_dry'), shadow: 0, interact: look('Tank', 'The great tank. Empty, it echoes. Full, it must glow like the sea.') },
    lantern('fish', 7, 6), sheet('fish', 1, 5),
    // Pantry
    board('pantry', 11, 2), { spr: 'ch_shelf_empty', x: 9, y: 2, w: 2, h: 1, sprFn: (gm) => (gm.flag('hall_room_pantry') ? 'ch_shelf_full' : 'ch_shelf_empty'), interact: look('Shelves', 'Rows of jars. The full ones smell of honey and pickles.') },
    { spr: 'ch_shelf_empty', x: 13, y: 2, w: 2, h: 1, sprFn: (gm) => (gm.flag('hall_room_pantry') ? 'ch_shelf_full' : 'ch_shelf_empty'), interact: look('Shelves', 'Someone has labelled every jar in tiny leaf handwriting.') },
    { spr: 'ch_stove', x: 9, y: 4, w: 2, h: 1, when: flagOn('hall_room_pantry'), interact: look('Hall stove', 'The old range hums. The sprites made tea on it all by themselves.'), light: { kind: 'lamp', when: flagOn('hall_room_pantry') } },
    { spr: 'ch_mill', x: 12, y: 4, w: 2, h: 1, when: flagOn('upg_hall_mill'), use: 'ch_mill', shadow: 18 },
    lantern('pantry', 14, 6), sheet('pantry', 9, 6),
    // Craft Room
    board('craft', 18, 2), { spr: 'ch_craft_table', x: 16, y: 2, w: 2, h: 1, when: flagOn('hall_room_craft'), interact: look('Craft table', 'Scraps of paper, beads and half a paper crane. Busy hands were here.') },
    { spr: 'ch_loom_covered', x: 21, y: 2, w: 2, h: 1, sprFn: (gm) => (gm.flag('upg_hall_loom') ? 'ch_loom' : 'ch_loom_covered'), use: 'ch_loom', shadow: 0 },
    { spr: 'ch_craft_table', x: 19, y: 4, w: 2, h: 1, when: flagOn('hall_room_craft'), interact: look('Craft table', 'A tray of neatly sorted buttons. Very neat. Very small hands.') },
    lantern('craft', 16, 6), sheet('craft', 22, 6),
    // Garden Room
    board('garden', 3, 10), { spr: 'ch_trellis', x: 6, y: 10, w: 2, h: 1, shadow: 0, interact: look('Trellis', 'A trellis for climbing vines. Right now it climbs nothing.') },
    { spr: 'ch_pond', x: 1, y: 12, w: 3, h: 2, when: flagOn('hall_room_garden'), interact: look('Garden pond', 'A small pond with lily pads. A goldfish winks at you.'), shadow: 0 },
    { spr: 'ch_planter_dead', x: 5, y: 12, sprFn: (gm) => (gm.flag('hall_room_garden') ? 'ch_planter' : 'ch_planter_dead'), interact: look('Planter', 'A planter bed. It remembers being lovely.'), shadow: 8 },
    { spr: 'ch_planter_dead', x: 6, y: 14, sprFn: (gm) => (gm.flag('hall_room_garden') ? 'ch_planter' : 'ch_planter_dead'), interact: look('Planter', 'Blossoms if you are kind, sticks if you are not.'), shadow: 8 },
    { spr: 'ch_planter_dead', x: 1, y: 10, sprFn: (gm) => (gm.flag('hall_room_garden') ? 'ch_planter' : 'ch_planter_dead'), interact: look('Planter', 'Goro would have opinions about this soil.'), shadow: 8 },
    lantern('garden', 7, 14), sheet('garden', 1, 14),
    // Vault (also the entrance room)
    { spr: 'ch_vault_shut', x: 13, y: 10, w: 2, h: 1, sprFn: (gm) => (gm.flag('hall_room_vault') ? 'ch_vault_open' : 'ch_vault_shut'), shadow: 0, interact: { label: 'Hall vault', run: (gm) => gm.open('ch_bundles', 'vault') } },
    { spr: 'ch_gate_off', x: 9, y: 10, w: 2, h: 1, sprFn: (gm) => (gm.flag('upg_hall_path') ? 'ch_gate_on' : 'ch_gate_off'), use: 'ch_gate', shadow: 0, light: { kind: 'shrine', when: flagOn('upg_hall_path') } },
    lantern('vault', 9, 14), { ...lantern('vault', 14, 14), light: undefined },
    // Night Sky Room
    board('night', 18, 10), { spr: 'ch_star_rug', x: 17, y: 12, w: 4, h: 2, flat: true, solid: false, when: flagOn('hall_room_night') },
    { spr: 'ch_telescope', x: 21, y: 10, shadow: 6, interact: { label: 'Look through', run: (gm) => gm.say('misa', 'happy', gm.flag('hall_room_night') ? 'The dome ceiling is full of tiny silver stars. The lens swings to the real ones outside.' : 'The telescope is still wrapped in cobwebs. Maybe the sprites will clean it.') } },
    { spr: 'ch_globe_stand', x: 16, y: 10, shadow: 8, interact: look('Star globe', 'A star globe. When the room is restored it spins by itself.') },
    lantern('night', 16, 14), sheet('night', 22, 14),
    // Lobby
    { spr: 'ch_heart_tree_dead', x: 11, y: 8, w: 2, h: 1, sprFn: (gm) => (gm.flag('community_restored') ? 'ch_heart_tree' : 'ch_heart_tree_dead'), use: 'ch_heart_tree', shadow: 0, light: { kind: 'shrine', when: 'flag:community_restored' } },
    { spr: 'ch_crates', x: 2, y: 8, w: 2, h: 1, when: '!flag:hall_rooms3', interact: look('Old crates', 'Crates of mouldy bunting. They will be useful when the party comes.') },
    { spr: 'ch_bunting', x: 3, y: 7, w: 6, h: 1, flat: true, solid: false, when: 'flag:community_restored', dy: -8 },
    { spr: 'ch_bunting', x: 15, y: 7, w: 6, h: 1, flat: true, solid: false, when: 'flag:community_restored', dy: -8 },
    ...SP.map(spriteObj),
  ],
  warps: [{ x: 12, y: 15, to: 'town:from_community_hall', enter: 'down' }],
  spawns: { default: [12, 14, 'up'], from_town: [12, 14, 'up'] },
  spots: { heart_tree: [12, 9], entrance: [12, 14], fish_board: [3, 3, 'up'], pantry_board: [12, 3, 'up'], craft_board: [19, 3, 'up'], garden_board: [4, 11, 'up'], night_board: [19, 11, 'up'], vault: [13, 11, 'up'] },
  onEnter(game) {
    const st = S(game);
    if (!game.flag('hall_intro')) { game.setFlag('hall_intro', true); game.run(get('script', 'ch_intro').steps(game)); return; }
    if (st.murmur && st.murmur.day === game.day && !st.murmurShown) { st.murmurShown = game.day; game.toast('The sprites murmur something...', 'i_chat'); }
  },
});

// ---------------------------------------------------------------- the door in the town square (no edit to src/content/town)
// The town map exposes `objects`/`warps` as getters; wrap them to add the hall (a small south-east lot below the hedge).
const town = get('map', 'town');
if (town) {
  const HALL = { spr: 'ch_hall_closed', x: 34, y: 28, w: 6, h: 2, shadow: 0, sprFn: (gm) => (gm.flag('hall_any_room') ? 'ch_hall_open' : 'ch_hall_closed'), interact: undefined, light: undefined };
  const wrap = (key, extra) => {
    const d = Object.getOwnPropertyDescriptor(town, key);
    Object.defineProperty(town, key, { enumerable: true, configurable: true, get: () => [...d.get.call(town), ...extra] });
  };
  wrap('objects', [HALL]);
  wrap('warps', [{ x: 36, y: 30, to: 'community_hall:from_town', enter: 'up' }]);
  town.spawns.from_community_hall = [36, 31, 'down'];
}
