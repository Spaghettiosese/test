// The East Wing: a hall (map `home_wing`) and seven rooms built by the renovations in reno.js. Each room has its own walls,
// floors and windows (registered here, drawn by the interiors room renderer), is decorate-able like the rest of the house,
// and has a feature: tea time, study desk, hot-spring evening soak, workshop, planters (balcony and greenhouse), guest bed.
import { register, registerMany, get, all, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { defMap } from '../interiors/maps.js';
import { DECOR_MAPS, decorLights } from '../interiors/decorate.js';
import { wrapMap, bubble } from '../sv2_orchard/orchard.js';
import { SV, nm, say, N, call, menu, pick } from './data.js';
import { PROJECTS, PROJECT_IDS, isBuilt, active, progressOverlay, siteText } from './reno.js';
import { stayOverSteps } from './guest.js';

registerMany('tile', {
  hw_wall_hall: { wall: 'plaster', solid: true, paper: 'stripes_butter' }, hw_wall_sun: { wall: 'plaster', solid: true, paper: 'gingham' },
  hw_wall_study: { wall: 'wood', solid: true, paper: 'wood_dark' }, hw_wall_bath: { wall: 'plaster', solid: true, paper: 'bath_tile' },
  hw_wall_shop: { wall: 'wood', solid: true, paper: 'wood_panel' }, hw_wall_glass: { wall: 'plaster', solid: true, paper: 'leaves' },
  hw_wall_guest: { wall: 'plaster', solid: true, paper: 'stripes_lilac' }, hw_wall_balc: { wall: 'wood', solid: true, paper: 'wood_panel' },
  hw_fl_hall: { floor: 'planks', tint: 'butter' }, hw_fl_sun: { floor: 'planks', tint: 'sand' }, hw_fl_study: { floor: 'carpet', tint: 'navy' },
  hw_fl_bath: { floor: 'stone', tint: 'sky' }, hw_fl_shop: { floor: 'wood_dark' }, hw_fl_glass: { floor: 'stone', tint: 'forest' },
  hw_fl_guest: { floor: 'carpet', tint: 'lilac' }, hw_fl_balc: { floor: 'planks', tint: 'coral' },
});
const FLOOR_KEY = { hw_fl_sun: 'planks_pale', hw_fl_study: 'carpet_lilac', hw_fl_bath: 'bath', hw_fl_shop: 'wood_dark', hw_fl_glass: 'stone', hw_fl_guest: 'carpet_lilac', hw_fl_balc: 'planks', hw_fl_hall: 'planks' };
const PAPER_KEY = { hw_wall_hall: 'stripes_butter', hw_wall_sun: 'gingham', hw_wall_study: 'wood_dark', hw_wall_bath: 'bath_tile', hw_wall_shop: 'wood_panel', hw_wall_glass: 'leaves', hw_wall_guest: 'stripes_lilac', hw_wall_balc: 'wood_panel' };

const boards = (id, x, y = 2) => ({ spr: 'int_hw_boards', x, y, doorX: x, shadow: 0, when: (g) => !isBuilt(g, id), interact: { label: (g) => `Boarded up: ${PROJECTS[id].name}`, run: (g) => g.say(null, null, siteText(g, id)) }, overlay: progressOverlay });
const door = (id, x, y = 2) => ({ spr: `int_hw_door_${id}`, x, y, solid: false, when: (g) => isBuilt(g, id) });
const warpIn = (id, x, y = 2, to = null) => ({ x, y, enter: 'up', to: to || `${PROJECTS[id].map}:from_wing`, when: `flag:reno_${id}` });
const lamp = (x, y, dx = 8) => ({ spr: 'int_lamp', x, y, dx, light: { kind: 'lamp', y: -20 } });

// Build a room: 2 wall rows on top, floor, 1 bottom wall row with an exit door tile.
function room(id, name, w, h, { wall, floor, exit = Math.floor(w / 2), objects = [], warps = [], spawns = {}, spots = {}, windows = [], outdoor = false, back = 'home_wing', dark = false, lights = [], onEnter }) {
  const rows = Array.from({ length: h }, (_, y) => (y < 2 ? '#'.repeat(w) : y === h - 1 ? '#'.repeat(exit) + 'd' + '#'.repeat(w - exit - 1) : '#' + 'f'.repeat(w - 2) + '#'));
  const def = {
    name, indoor: !outdoor, outdoor, interiors: true, music: 'home', bg: '#1a1226', dark,
    legend: { '#': wall, f: floor, d: 'int_fl_door' }, rows,
    rooms: [{ id, name, x: 1, y: 2, w: w - 2, h: h - 3, char: 'f', paper: PAPER_KEY[wall] || 'plaster', floor: FLOOR_KEY[floor] || 'planks' }],
    windows, objects, lights,
    warps: [{ x: exit, y: h - 1, enter: 'down', to: `${back}:from_${id}` }, ...warps],
    spawns: { default: [exit, h - 2, 'up'], from_wing: [exit, h - 2, 'up'], ...spawns },
    spots: { door: [exit, h - 2], ...spots }, onEnter,
  };
  defMap(id === 'wing' ? 'home_wing' : PROJECTS[id].map, def);
  return def;
}
const first = (g, flag, steps) => { if (!g.flag(flag)) { g.setFlag(flag, true); g.run(steps); } };

// ---------------------------------------------------------------- the hall
const hallDoors = ['sunroom', 'study', 'bathhouse', 'workshop', 'greenhouse', 'guest'];
room('wing', 'East Wing', 24, 9, {
  wall: 'hw_wall_hall', floor: 'hw_fl_hall', exit: 2, back: 'home',
  windows: [{ x: 2, y: 1, w: 2, curtain: 'butter' }, { x: 20, y: 1, w: 2, curtain: 'mint' }],
  objects: [
    ...hallDoors.flatMap((id) => [boards(id, PROJECTS[id].door), door(id, PROJECTS[id].door)]),
    { spr: 'int_hw_plans', x: 3, y: 2, dx: 0, shadow: 10, use: 'sv4_plans_board' },
    { spr: 'int_plant_tall', x: 1, y: 2, dx: 1, shadow: 9 }, { spr: 'int_plant_tall', x: 22, y: 2, dx: 1, shadow: 9 },
    { spr: 'int_rug_long', x: 10, y: 5, w: 3, flat: true }, { spr: 'int_hw_bench', x: 15, y: 5, w: 2, shadow: 18, interact: { label: 'Sit', run: (g) => { g.advance(10); g.addMood(2); g.say('misa', 'happy', 'A hallway bench. Every house should have one, even if it is only for putting shoes on.'); } } },
    { spr: 'hw_crate_stack', x: 20, y: 6, shadow: 12, when: (g) => !!active(g) }, { spr: 'hw_sawhorse', x: 7, y: 6, shadow: 12, when: (g) => !!active(g) },
    lamp(5, 2, 20), lamp(12, 2, 20), lamp(18, 2, 20),
  ],
  warps: hallDoors.map((id) => warpIn(id, PROJECTS[id].door)),
  spawns: { default: [2, 7, 'up'], from_home: [2, 7, 'up'], ...Object.fromEntries(hallDoors.map((id) => [`from_${id}`, [PROJECTS[id].door, 3, 'down']])), from_study_stairs: [8, 3, 'down'] },
  spots: { plans: [3, 3], bench: [15, 6] },
});
// the hall's room spawns are named from_<room id>, and the rooms warp back to `home_wing:from_<id>`; map ids differ from project ids
const hall = get('map', 'home_wing');
for (const id of PROJECT_IDS) if (!hall.spawns[`from_${id}`]) hall.spawns[`from_${id}`] = hall.spawns[`from_${id === 'balcony' ? 'study' : id}`];
hall.warps[0].to = 'home:from_wing';

// ---------------------------------------------------------------- sunroom extension: tea time and a sunny bench
const TEA = ['Sencha, with Grandma\'s old teapot. The windows make everything gold.', 'Rain on glass, hot tea in my hands. I could do this forever.', 'The sun pools on the table like honey.'];
room('sunroom', 'Sunroom Extension', 16, 9, {
  wall: 'hw_wall_sun', floor: 'hw_fl_sun', windows: [{ x: 2, y: 1, w: 3, kind: 'wide', curtain: 'butter' }, { x: 11, y: 1, w: 3, kind: 'wide', curtain: 'mint' }],
  objects: [
    { spr: 'int_hw_teatable', x: 6, y: 4, w: 2, shadow: 24, interact: { label: 'Tea time', run: (g) => {
      const s = SV(g).bath; if (s.teaDay === g.day) return g.say('misa', 'happy', 'Already had my tea break today. Okay, one more biscuit.');
      s.teaDay = g.day; g.advance(30); g.addMood(8); g.addEnergy(6); g.stat('teaTimes'); if (g.has('drink_green_tea')) { g.take('drink_green_tea', 1); g.addMood(4); }
      const near = g.mochi && g.mochi.map === 'hw_sunroom'; if (near) g.mochiBond && g.mochiBond(8, 'sunroom');
      g.say('misa', 'happy', pick(TEA, g.rng()));
    } } },
    { spr: 'int_cushion', x: 5, y: 5, solid: false, dx: 4 }, { spr: 'int_cushion', x: 8, y: 5, solid: false, dx: 2 },
    { spr: 'int_hw_bench', x: 6, y: 2, w: 2, shadow: 18, interact: { label: 'Sun nap', run: (g) => { if (g.minutes >= 19 * 60) return g.say('misa', 'sleepy', 'No sun left to nap in. Maybe tomorrow.'); g.advance(45); g.addEnergy(14); g.addMood(4); g.say('misa', 'sleepy', 'Warm bench, warm sun, zero responsibilities...'); } } },
    { spr: 'int_plant_tall', x: 1, y: 2, dx: 1, shadow: 9 }, { spr: 'int_plant_tall', x: 14, y: 2, dx: 1, shadow: 9 },
    { spr: 'int_rug_long', x: 5, y: 4, w: 3, flat: true, dx: 0 }, lamp(10, 2, 8),
  ],
  onEnter: (g) => first(g, 'sv4_seen_sunroom', [say('misa', 'happy', 'It is so bright in here! The tea table is the best spot in the whole house.')]),
});

// ---------------------------------------------------------------- study: big desk, globe, telescope, door to the balcony
room('study', 'Second-Floor Study', 16, 10, {
  wall: 'hw_wall_study', floor: 'hw_fl_study', windows: [{ x: 6, y: 1, w: 2, kind: 'tall', curtain: 'coral' }],
  objects: [
    { spr: 'int_hw_desk_big', x: 5, y: 2, w: 2, shadow: 26, interact: { label: 'Study at the big desk', run: (g) => {
      const s = SV(g).bath; if (g.energy < 8) return g.say('misa', 'sleepy', 'Too tired to read. The words are swimming.');
      g.advance(60); g.addEnergy(-6); g.addMood(2); g.addXP('study', s.studyDay === g.day ? 3 : 7); s.studyDay = g.day; g.stat('studySessions'); g.sfx('page');
      g.say('misa', 'happy', 'A proper desk, a proper lamp. Homework is almost fun. Almost.');
    } } },
    { spr: 'int_bookshelf', x: 1, y: 2, shadow: 14, use: 'bookshelf' }, { spr: 'int_bookshelf', x: 2, y: 2, shadow: 14, use: 'bookshelf' },
    { spr: 'int_hw_globe', x: 8, y: 2, dx: 6, shadow: 8, interact: { label: 'Spin the globe', run: (g) => { g.sfx('blip'); g.addMood(1); g.say('misa', 'happy', 'My finger stops on a tiny blue spot. That is where the ship is, probably.'); } } },
    { spr: 'int_hw_scope', x: 14, y: 2, dx: 3, shadow: 9, use: 'telescope' },
    door('balcony', 11), boards('balcony', 11),
    { spr: 'int_hw_rug_study', x: 5, y: 5, w: 2, flat: true }, { spr: 'int_cushion', x: 8, y: 5, solid: false, dx: 4 }, lamp(4, 2, 8),
  ],
  warps: [{ x: 11, y: 2, enter: 'up', to: 'hw_balcony:from_study', when: 'flag:reno_balcony' }],
  spawns: { from_balcony: [11, 3, 'down'] },
});

// ---------------------------------------------------------------- balcony garden (outdoor, six planters) and greenhouse annex (eight, sprinklers)
const GROW = {
  hw_balcony: { key: 'balcony', n: 6, auto: false, season: true, spots: [[1, 3], [3, 3], [9, 3], [11, 3], [3, 5], [9, 5]] },
  hw_greenhouse: { key: 'greenhouse', n: 8, auto: true, season: false, spots: [[2, 3], [4, 3], [6, 3], [9, 3], [11, 3], [13, 3], [3, 6], [12, 6]] },
};
export const cropOfSeed = (id) => all('crop').find((c) => c.seed === id);
export const plotState = (g, map, i) => { const G = GROW[map], p = SV(g).plant[G.key][i]; if (!p) return 'e'; if (p.grown >= p.days) return 'r'; return p.grown >= p.days / 2 ? 'g' : 's'; };
export function plant(g, map, i, seedId) {
  const G = GROW[map], P = SV(g).plant[G.key], c = cropOfSeed(seedId);
  if (!c || P[i] || !g.has(seedId)) return false;
  g.take(seedId, 1); P[i] = { seed: seedId, item: c.item, days: c.days, grown: 0, wet: !!G.auto, crop: c.item, flower: !!c.flower };
  g.stat('indoorPlanted'); g.sfx('dig'); return true;
}
export function harvest(g, map, i) {
  const G = GROW[map], P = SV(g).plant[G.key], p = P[i]; if (!p || p.grown < p.days) return false;
  const c = all('crop').find((x) => x.item === p.item), n = 1 + (G.auto && g.rng() < 0.35 ? 1 : 0);
  g.give(p.item, n); g.addXP('gardening', 5); g.stat('indoorHarvested'); g.stat('harvested');
  if (c && c.regrow) p.grown = Math.max(0, p.days - c.regrow); else P[i] = null;
  g.sfx('pop'); return n;
}
export function growTick(g, rain) {
  for (const [map, G] of Object.entries(GROW)) for (const p of SV(g).plant[G.key]) {
    if (!p || p.grown >= p.days) continue;
    const c = all('crop').find((x) => x.item === p.item), inSeason = !G.season || !c || !c.seasons || c.seasons.includes(g.season);
    if (inSeason && (p.wet || G.auto || (rain && map === 'hw_balcony'))) p.grown++;
    p.wet = !!G.auto;
  }
}
function plotUse(g, map, i) {
  const G = GROW[map], p = SV(g).plant[G.key][i];
  if (!p) {
    const seeds = Object.keys(g.state.inv).filter((id) => cropOfSeed(id) && g.has(id)).slice(0, 6);
    if (!seeds.length) return g.say('misa', 'neutral', G.auto ? 'Empty planter. Seeds from Sunny Mart or the market will do.' : 'An empty planter. Flowers and herbs love a sunny balcony: bring some seeds.');
    return menu(g, 'Plant which seeds?', seeds.map((id) => [`${nm(id)} x${g.count(id)}`, (gg) => { if (plant(gg, map, i, id)) gg.toast(`${nm(id)} planted. ${G.auto ? 'The sprinklers will do the rest.' : 'Water it each day.'}`, get('item', id).icon); }]));
  }
  if (p.grown >= p.days) { const n = harvest(g, map, i); return g.toast(`Harvested ${n} ${nm(p.item).toLowerCase()}`, get('item', p.item).icon); }
  const c = all('crop').find((x) => x.item === p.item);
  if (!G.auto && !p.wet) { p.wet = true; g.sfx('splash'); g.addXP('gardening', 1); return g.toast(c && c.seasons && !c.seasons.includes(g.season) ? `Watered, but it is out of season: it rests until ${c.seasons[0]}.` : 'Watered. See you tomorrow.', 'i_leaf'); }
  g.toast(`${nm(p.item)}: ${p.days - p.grown} days to go`, get('item', p.item).icon);
}
const plotObjs = (map) => GROW[map].spots.map(([x, y], i) => ({
  spr: 'int_hw_planter_e', x, y, shadow: 12, sprFn: (g) => `int_hw_planter_${plotState(g, map, i)}`,
  interact: { label: (g) => { const p = SV(g).plant[GROW[map].key][i]; return !p ? 'Empty planter' : p.grown >= p.days ? `Harvest ${nm(p.item).toLowerCase()}` : GROW[map].auto || p.wet ? nm(p.item) : `Water ${nm(p.item).toLowerCase()}`; }, run: (g) => plotUse(g, map, i) },
  overlay: (g, w, o, x, y) => { const p = SV(g).plant[GROW[map].key][i]; if (p && p.grown >= p.days) bubble(w, x + 15, y - 2, get('item', p.item).icon, 0); },
}));
room('balcony', 'Balcony Garden', 14, 8, {
  wall: 'hw_wall_balc', floor: 'hw_fl_balc', outdoor: true, exit: 6, windows: [],
  objects: [...plotObjs('hw_balcony'), { spr: 'int_hw_bench', x: 6, y: 5, w: 2, shadow: 18, interact: { label: 'Watch the bay', run: (g) => { g.advance(20); g.addMood(5); g.say('misa', 'happy', g.minutes > 19 * 60 ? 'Lights twinkle along the harbour. I can see Captain Jun\'s boat from here.' : 'I can see the whole bay from up here. The ferries look like toys.'); } } }, { spr: 'int_hw_wcan', x: 5, y: 3, solid: false, dx: 2 }, lamp(1, 2, 8), lamp(12, 2, 8)],
  warps: [], spawns: { from_study: [6, 3, 'down'], from_wing: [6, 3, 'down'], default: [6, 3, 'down'] }, spots: { door: [6, 3] },
});
{ // the balcony's way back is the house door at its top, not a bottom exit
  const b = get('map', 'hw_balcony');
  b.rows = b.rows.map((r, y) => (y === 7 ? '#'.repeat(14) : r));
  b.warps = [{ x: 6, y: 2, enter: 'up', to: 'hw_study:from_balcony' }];
  b.objects.push({ spr: 'int_hw_door_balcony', x: 6, y: 2, solid: false });
}
room('greenhouse', 'Greenhouse Annex', 16, 10, {
  wall: 'hw_wall_glass', floor: 'hw_fl_glass', windows: [{ x: 3, y: 1, w: 3, kind: 'wide' }, { x: 10, y: 1, w: 3, kind: 'wide' }],
  objects: [...plotObjs('hw_greenhouse'), { spr: 'int_hw_wcan', x: 8, y: 5, solid: false, dx: 2 }, { spr: 'int_plant_tall', x: 1, y: 2, dx: 1, shadow: 9 }, { spr: 'int_plant_tall', x: 14, y: 2, dx: 1, shadow: 9 }, lamp(8, 2, 8)],
  onEnter: (g) => first(g, 'sv4_seen_gh', [say('misa', 'happy', 'Warm, damp and green. Sprinklers on a timer... every season is growing season in here!')]),
});

// ---------------------------------------------------------------- bathhouse: the evening hot-spring soak
export function soak(g) {
  const b = SV(g).bath; if (b.day === g.day) return g.say('misa', 'happy', 'Already soaked today. Any longer and I will dissolve.');
  const eve = g.minutes >= 18 * 60, clear = !['rain', 'storm', 'snow'].includes(g.weather), winter = g.season === 'winter';
  b.day = g.day; b.soaks++; g.stat('onsenSoaks'); g.advance(eve ? 45 : 25); g.sfx('splash');
  const steps = [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'wait', dur: 0.5 }, { t: 'fade', to: 0, dur: 0.4 }];
  if (!eve) { g.addEnergy(12); g.addMood(6); return g.run([...steps, say('misa', 'sleepy', 'A daytime dip. Nice, but they say the hot spring is best after dark.')]); }
  g.addEnergy(25); g.addMood(14 + (clear ? 4 : 0) + (winter && clear ? 4 : 0));
  if (g.addBuff) g.addBuff('cozy', 180);
  const line = !clear ? 'Rain patters on the bamboo screen while steam curls up around me. Cosy times ten.' : winter ? 'Snow-cold air, boiling-hot water, stars overhead. This is what winter was invented for.' : g.season === 'summer' ? 'Fireflies drift over the screen. I can hear the sea. I am a puddle.' : 'The moon floats in the water next to me. I try not to move so it will stay.';
  const out = [...steps, say('misa', 'sleepy', line)];
  if (b.soaks % 7 === 0) out.push(call((gg) => { gg.give('mat_sv4_glaze', 1); gg.toast('Seven soaks! A tile glaze keepsake', 'i_star'); }));
  return g.run(out);
}
room('bathhouse', 'Bathhouse', 18, 10, {
  wall: 'hw_wall_bath', floor: 'hw_fl_bath', windows: [{ x: 3, y: 1, w: 2, kind: 'high' }, { x: 13, y: 1, w: 2, kind: 'high' }],
  objects: [
    { spr: 'int_hw_onsen', x: 2, y: 3, w: 3, h: 2, shadow: 0, interact: { label: (g) => (g.minutes >= 18 * 60 ? 'Moonlit soak' : 'Dip in the hot spring'), run: soak } },
    { spr: 'int_hw_screen', x: 6, y: 2, w: 2, shadow: 0 }, { spr: 'int_hw_stone_lantern', x: 8, y: 3, shadow: 8, light: { kind: 'lantern', y: -18 } },
    { spr: 'int_hw_stool', x: 11, y: 4, solid: false, dx: 8 }, { spr: 'int_hw_bucket', x: 12, y: 4, solid: false, dx: 6 }, { spr: 'int_hw_stool', x: 14, y: 4, solid: false, dx: 8 },
    { spr: 'int_towels', x: 15, y: 2, dx: 4, interact: { label: 'Fluffy towels', run: (g) => g.say('misa', 'happy', 'Warm towels. Whoever invented the towel warmer deserves a medal.') } },
    { spr: 'int_bathmat', x: 8, y: 6, w: 2, flat: true, dx: 12 }, lamp(10, 2, 8),
  ],
  onEnter: (g) => first(g, 'sv4_seen_onsen', [say('misa', 'surprised', 'A real hot spring tub, right in my house! Evenings are going to be wonderful.')]),
});
register('worldTick', 'sv4_steam', { update(dt, world, game) {
  if (world.map.id !== 'hw_bath') return;
  world._steam = (world._steam || 0) - dt; if (world._steam > 0) return; world._steam = 0.3;
  world.particles.push({ c: '#f4f8ff', x: 2 * TILE + 8 + Math.random() * 36, y: 4 * TILE + 4, vx: (Math.random() - 0.5) * 5, vy: -9 - Math.random() * 7, life: 1.3, s: 3 });
} });

// ---------------------------------------------------------------- workshop: bench (the crafting menu), sewing machine, tools
room('workshop', 'Workshop', 16, 9, {
  wall: 'hw_wall_shop', floor: 'hw_fl_shop', windows: [{ x: 12, y: 1, w: 2, kind: 'square' }],
  objects: [
    { spr: 'int_hw_workbench', x: 2, y: 2, w: 2, dx: 2, shadow: 26, use: 'craft_bench' },
    { spr: 'int_hw_sewing', x: 6, y: 2, shadow: 14, use: 'sv4_sew' }, { spr: 'int_hw_pegboard', x: 8, y: 1, w: 2, solid: false, dy: 4 },
    { spr: 'int_hw_paintshelf', x: 11, y: 2, dx: 0, shadow: 12, interact: { label: 'Paint and dye shelf', run: (g) => g.say('misa', 'happy', 'Tins of paint, pots of dye. Dyes dye hair, tops and trousers: use one from your bag.') } },
    { spr: 'hw_crate_stack', x: 1, y: 5, shadow: 12 }, { spr: 'hw_sawhorse', x: 12, y: 5, shadow: 12 }, { spr: 'int_hw_tatami_mat', x: 5, y: 4, w: 2, flat: true, dx: 0 }, lamp(5, 2, 8),
  ],
  onEnter: (g) => first(g, 'sv4_seen_workshop', [say('misa', 'happy', 'My own workshop. It smells like sawdust and possibilities.')]),
});

// ---------------------------------------------------------------- guest room
room('guest', 'Guest Room', 14, 9, {
  wall: 'hw_wall_guest', floor: 'hw_fl_guest', windows: [{ x: 9, y: 1, w: 2, curtain: 'lilac' }],
  objects: [
    { spr: 'int_hw_guestbed', x: 3, y: 2, w: 2, h: 2, fp: [3, 2, 1.7, 2], shadow: 0, interact: { label: 'Guest bed: invite a friend to stay', run: (g) => g.run(stayOverSteps(g)) } },
    { spr: 'int_hw_nightstand', x: 5, y: 2, dx: 2, shadow: 9, light: { kind: 'lamp', y: -20 } }, { spr: 'int_desk', x: 8, y: 2, w: 2, dx: 2, shadow: 18 },
    { spr: 'int_wardrobe', x: 11, y: 2, shadow: 12 }, { spr: 'int_hw_guestrug', x: 3, y: 4, w: 3, flat: true, dx: 0 }, { spr: 'int_cushion', x: 8, y: 5, solid: false, dx: 4 },
  ],
});

// ---------------------------------------------------------------- hook the new rooms into decorate mode and the daily tick
for (const m of ['home_wing', ...PROJECT_IDS.map((id) => PROJECTS[id].map)]) {
  if (!DECOR_MAPS.includes(m)) DECOR_MAPS.push(m);
  wrapMap(m, 'lights', (list) => list.concat(decorLights(m)));
}
register('system', 'sv4_growth', { init(game) { game.bus.on('dayStart', () => growTick(game, game.weather === 'rain' || game.weather === 'storm')); } });
void N;

features('Home & Pets', [
  'Sunroom extension: a tea table for a daily tea time (with Mochi nearby she bonds a little) and a sunny bench for naps',
  'Second-floor study: a big desk for study sessions, a globe, a telescope and bookshelves, with stairs from the wing hall',
  'Balcony garden: six planters that need daily watering and only grow crops that are in season; harvest flowers and herbs on the balcony',
  'Greenhouse annex: eight planters with sprinklers that grow any crop in any season with a chance of a bonus harvest',
  'Hot-spring bathhouse: soak in the stone onsen once a day; evenings, rain and winter nights make it a bigger energy and mood boost with a cosy buff',
  'Workshop: an indoor crafting bench, a sewing machine, a tool pegboard and a dye shelf',
  'Guest room with a double bed: invite a friend to stay over and wake up to a morning scene',
  'Every new room has its own walls, floors, windows and lamps, and can be decorated with the decor box like the rest of the house',
  'The wing hall shows boarded doors with a progress bar for the room being built, and framed doors for finished rooms',
]);
