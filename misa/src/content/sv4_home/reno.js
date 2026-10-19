// Renovations: seven funded projects (Goro and Mr. Kinoko are the contractors) that take days, with builders on site in the
// East Wing. Projects are started in the Home Plans phone app (household.js) or at the plans board in the sunroom.
// The wing hall and its rooms are maps defined in rooms.js. Completed projects set flag `reno_<id>`.
import { register, get, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { wrapMap } from '../sv2_orchard/orchard.js';
import { SV, nm, say, N, call, menu } from './data.js';
import './art.js';

export const PROJECTS = {
  sunroom: { name: 'Sunroom extension', coins: 2800, mats: { mat_wood: 12, mat_glass: 4 }, days: 3, door: 5, map: 'hw_sunroom', desc: 'A bright tea room with big windows and a sunny bench.' },
  study: { name: 'Second-floor study', coins: 3800, mats: { mat_wood: 16, mat_paper: 6 }, days: 4, door: 8, map: 'hw_study', desc: 'Stairs up to a quiet study with a big desk and a telescope.' },
  bathhouse: { name: 'Hot-spring bathhouse', coins: 5200, mats: { mat_wood: 14, mat_clay: 8 }, days: 5, door: 11, map: 'hw_bath', desc: 'A stone onsen tub. The evening soak is the best part of the day.' },
  workshop: { name: 'Indoor workshop', coins: 3200, mats: { mat_wood: 14, mat_wire: 4 }, days: 4, door: 14, map: 'hw_workshop', desc: 'A workbench, a sewing machine and a pegboard of tools.' },
  greenhouse: { name: 'Greenhouse annex', coins: 4200, mats: { mat_wood: 12, mat_glass: 10 }, days: 5, door: 17, map: 'hw_greenhouse', desc: 'Eight planters with sprinklers: crops grow here in every season.' },
  guest: { name: 'Guest room', coins: 3000, mats: { mat_wood: 10, mat_cloth: 6 }, days: 3, door: 20, map: 'hw_guest', needs: 'sunroom', desc: 'A cosy double bed for sleepovers, with a morning scene.' },
  balcony: { name: 'Balcony garden', coins: 2200, mats: { mat_wood: 10, mat_clay: 4 }, days: 3, map: 'hw_balcony', needs: 'study', desc: 'Six planters on a sunny balcony reached from the study.' },
};
export const PROJECT_IDS = Object.keys(PROJECTS);
export const builtCount = (g) => Object.keys(SV(g).reno.done).length;
export const isBuilt = (g, id) => !!SV(g).reno.done[id];
export const active = (g) => SV(g).reno.active;
export function costOf(g, id) {
  const p = PROJECTS[id]; let c = p.coins;
  if (id === 'bathhouse' && g.flag('upg_bath')) c -= 500;
  if (id === 'greenhouse' && g.flag('upg_greenhouse')) c -= 800;
  if (id === 'workshop' && g.skillLevel('crafting') >= 3) c -= 300;
  return Math.max(0, c);
}
export function whyNot(g, id) {
  const p = PROJECTS[id], s = SV(g).reno;
  if (s.done[id]) return 'Already built';
  if (s.active) return `${PROJECTS[s.active.id].name} is under way`;
  if (p.needs && !s.done[p.needs]) return `Build the ${PROJECTS[p.needs].name.toLowerCase()} first`;
  if (g.money < costOf(g, id)) return `Needs ${costOf(g, id)} coins`;
  for (const [m, n] of Object.entries(p.mats)) if (!g.has(m, n)) return `Needs ${n} ${nm(m).toLowerCase()}`;
  return null;
}
export function startProject(g, id) {
  const why = whyNot(g, id); if (why) { g.toast(why); return false; }
  const p = PROJECTS[id], s = SV(g).reno;
  g.spend(costOf(g, id)); for (const [m, n] of Object.entries(p.mats)) g.take(m, n);
  s.active = { id, start: g.day, days: p.days, done: 0 }; s.started = true; g.setFlag('hw_signed', true);
  g.sfx('chime'); g.stat('renoStarted'); g.bus.emit('renoStarted', { id });
  g.mail(`sv4_reno_start_${id}`, 'Goro', `Got your plans for the ${p.name.toLowerCase()}. Mr. Kinoko and I start in the morning. Rain stops work, nothing else does. Goro`);
  if (g.world) g.world.refreshRects();
  return true;
}
export function completeProject(g) {
  const s = SV(g).reno, a = s.active; if (!a) return false;
  const p = PROJECTS[a.id];
  s.done[a.id] = g.day; s.active = null; s.log.push({ id: a.id, day: g.day, took: g.day - a.start });
  g.setFlag(`reno_${a.id}`, true); g.stat('homeUpgrades'); g.stat('renoDone'); g.bus.emit('renoDone', { id: a.id });
  g.mail(`sv4_reno_done_${a.id}`, 'Goro', `All finished! Your ${p.name.toLowerCase()} is ready. Mind the paint. Mochi has already inspected it and approves. Goro`);
  g.toast(`${p.name} is finished!`, 'i_star'); g.sfx('levelup');
  g.give('mat_sv4_glaze', 1, true);
  if (g.world) g.world.refreshRects();
  return true;
}
// One day of work (called at dayStart). Storms and rain stop the builders.
export function workDay(g) {
  const a = SV(g).reno.active; if (!a) return null;
  if (g.weather === 'storm' || g.weather === 'rain') { a.rainDays = (a.rainDays || 0) + 1; return 'rain'; }
  a.done++;
  if (a.done >= a.days) { completeProject(g); return 'done'; }
  return 'work';
}
export const progressOf = (g) => { const a = active(g); return a ? Math.min(1, a.done / a.days) : 0; };
register('system', 'sv4_reno', { init(game) { game.bus.on('dayStart', () => workDay(game)); } });

// ---------------------------------------------------------------- the door from the sunroom into the wing
register('tile', 'hw_none', { floor: 'planks' });
register('interaction', 'sv4_plans_board', { label: 'Renovation plans', run: (g) => g.open('phone', 'sv4_plans') });
wrapMap('home', 'objects', (list) => [...list,
  { spr: 'int_hw_plans', x: 22, y: 11, dx: 3, shadow: 10, when: '!flag:hw_signed', use: 'sv4_plans_board' },
  { spr: 'int_hw_arch', x: 22, y: 11, solid: false, when: 'flag:hw_signed', dx: 0 },
]);
wrapMap('home', 'warps', (list) => [...list, { x: 22, y: 11, enter: 'right', to: 'home_wing:from_home', when: 'flag:hw_signed' }]);
const home = get('map', 'home'); if (home && home.spawns) home.spawns.from_wing = [21, 11, 'left'];

// ---------------------------------------------------------------- builders and dust (drawn in the wing while a project is active)
const BUILDERS = [[0, -1], [1, 1]];
register('worldLayer', 'sv4_builders', {
  sprites(world, game) {
    const out = [];
    if (world.map.id !== 'home_wing' || !game.state.sv4_home) return out;
    const a = active(game); if (!a) return out;
    const p = PROJECTS[a.id], dx = p.door ? p.door * TILE : 8 * TILE, f = Math.floor(game.clock * 2.4) % 2;
    BUILDERS.forEach(([k, side], i) => {
      const x = dx + 8 + side * 15, y = 4 * TILE + 12 + (i ? 6 : 0);
      out.push({ y, draw: () => { world.shadow(x, y, 7); world.drawFeet(`hw_builder_${k < 0 ? 0 : k}_${(f + i) % 2}`, x, y + 1); } });
    });
    return out;
  },
});
register('worldTick', 'sv4_dust', {
  update(dt, world, game) {
    if (world.map.id !== 'home_wing' || !game.state.sv4_home || !active(game)) return;
    world._dustT = (world._dustT || 0) - dt;
    if (world._dustT > 0) return;
    world._dustT = 0.25;
    const p = PROJECTS[active(game).id], x = (p.door || 8) * TILE + 8;
    world.particles.push({ c: '#e8dcc8', x: x + (Math.random() - 0.5) * 26, y: 3 * TILE + 10, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 8, life: 0.9, s: 2 });
    if (Math.random() < 0.3) game.sfx('blip');
  },
});
// progress sign + hint overlay used by the boarded doors in rooms.js
export function progressOverlay(game, world, o, x, y) {
  const a = active(game); if (!a || PROJECTS[a.id].door !== o.doorX) return;
  const g = world.g, bx = world.sx(x) + 2, by = world.sy(y) - 10, w = 28, v = progressOf(game);
  g.fillStyle = '#2b1d2e'; g.fillRect(bx - 1, by - 1, w + 2, 7); g.fillStyle = '#f3e2c7'; g.fillRect(bx, by, w, 5); g.fillStyle = '#86cdb0'; g.fillRect(bx, by, Math.round(w * v), 5);
}
export function siteText(g, id) {
  const a = active(g), p = PROJECTS[id];
  if (a && a.id === id) return `${p.name}: day ${a.done}/${a.days} of work${a.rainDays ? `, ${a.rainDays} rained off` : ''}.`;
  return `${p.name}: ${p.desc}`;
}
void say; void N; void call; void menu;

features('Home & Pets', [
  'Seven renovation projects (sunroom, study, bathhouse, workshop, greenhouse annex, guest room, balcony garden) funded with coins and materials',
  'Renovations take several days to build, and rainy days stop the builders; Goro writes when each room is ready',
  'Builders on site: Goro and a carpenter hammer away at the wing door with a progress bar and drifting dust',
  'An arched door in the sunroom leads to the East Wing hall that connects every new room',
  'Renovation discounts: the cypress tub, the farm greenhouse and a crafting skill of 3 each knock coins off a project',
  'Crates and sawhorses fill the wing hall while a project is being built',
]);
