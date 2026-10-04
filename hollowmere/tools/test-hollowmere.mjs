// Consistency checks for Hollowmere that need no browser: the level builds, everyone's
// schedule points at real places, the important routes are actually walkable, every clip
// the game asks for exists, and every conversation is defined.
import * as E from '../../engine/index.js';
import { buildLevel } from '../src/level/index.js';
import { buildRoster } from '../src/roster.js';
import { DIALOGUE } from '../src/dialogue.js';
import { clipDefs } from '../src/people/index.js';

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log('  FAIL ' + msg); } };
const section = (s) => console.log(s);

section('level');
const scene = new E.Scene(), world = new E.PhysicsWorld();
const t0 = performance.now();
const L = buildLevel({ scene, world });
console.log(`  built in ${(performance.now() - t0).toFixed(0)} ms: ${world.bodies.length} bodies, ${L.lights.length} lights, ${L.doors.length} doors, ${L.containers.length} containers, ${Object.keys(L.pois).length} pois, ${Object.keys(L.routes).length} routes`);
ok(world.bodies.every((b) => b.position.every(Number.isFinite)), 'every body has a finite position');
ok(L.doors.length > 30 && L.containers.length > 25 && L.torches.length > 60, 'the level has doors, containers and torches');

section('roster');
const roster = buildRoster();
const clips = new Set(clipDefs().map((c) => c.name));
for (const d of roster) {
  ok(DIALOGUE[d.dialogue] || !d.dialogue, `${d.id}: dialogue "${d.dialogue}" exists`);
  for (const s of d.schedule) {
    if (s.poi) ok(L.pois[s.poi], `${d.id}: poi "${s.poi}" exists`);
    if (s.route) ok(L.routes[s.route], `${d.id}: route "${s.route}" exists`);
    if (s.wander) ok(Object.keys(L.pois).some((k) => k.startsWith(s.wander)), `${d.id}: wander prefix "${s.wander}" matches a poi`);
  }
  // 24 hours covered
  const covers = (h) => d.schedule.some((s) => (s.h0 <= s.h1 ? h >= s.h0 && h < s.h1 : h >= s.h0 || h < s.h1));
  ok([0, 3, 6, 9, 12, 15, 18, 21].every(covers), `${d.id}: schedule covers the whole day`);
}
console.log(`  ${roster.length} people checked`);

section('clips');
for (const n of ['Idle', 'Walk', 'Run', 'Guard Idle', 'Slash A', 'Slash B', 'Overhead', 'Thrust', 'Block', 'Stagger', 'Flinch', 'Hands Up', 'Cower', 'Sit', 'Sit Eat', 'Sleep', 'Pray', 'Hammer', 'Sweep', 'Drink', 'Talk', 'Arms Crossed', 'Stand Guard', 'Look Around', 'Warm Hands', 'Sword Rest'])
  ok(clips.has(n), `clip "${n}" exists`);

section('navigation');
const nav = L.nav;
const path = (a, b, mode = 1) => nav.findPath(a[0], a[1], b[0], b[1], { mode, maxNodes: 60000 });
const reach = (a, b, msg, mode = 1) => { const p = path(a, b, mode); ok(p && p.length, `${msg}: ${a} -> ${b}`); return p; };
reach([9, -35], [0, 16], 'road to the town through the open gate');
reach([0, 16], [0, 99], 'town to the keep courtyard');
reach([0, 99], [0, 114], 'courtyard to the great hall (through the keep door)');
reach([0, 114], [-2, 136], 'great hall to the antechamber');
reach([-2, 136], [13, 139], 'antechamber to the bedchamber');
reach([13, 139], [13, 149], 'bedchamber to the yard behind the keep (balcony door)');
reach([-40, 64.5], [-42.3, 83.5], 'graveyard gate to the mausoleum');
reach([76, 17], [104, 22], 'crypt entrance to the ossuary');
reach([104, 22], [105.5, 55], 'ossuary to the shrine');
reach([105.5, 55], [120, 52], 'shrine to the undercroft');
for (const [n, p] of [['Tolliver farmhouse', [29, -142]], ['the barn', [55, -150]], ['Greywater bridge north end', [0, -218]], ['the far side of the bridge', [0, -245]], ['the hunter\'s lodge', [-131, -71]], ['the bandit camp', [-172, 10]], ['the witch hut', [-203, 84]], ['the ruined tower', [-116, 60]], ['the sunken shrine', [-190, -226]], ['Cinderwick', [150, 58]], ['the plague ward gate', [195, 97]], ['the gallows', [198, 150]], ['Fort Greywatch yard', [20, -104]], ['the gaol cell', [30.5, -113.5]], ['Pellmouth inn', [143, -167]], ['the pier end', [181, -155]], ['the mine entrance hall', [-235, 122]], ['the mine cavern', [-237.5, 148.4]], ['the Choir Stones', [80, -196]], ['the stable', [-7.6, -111.5]], ['the stablemaster', [-3.4, -109]], ['the cabin lease sign', [-22.3, -52.6]], ['inside the hunter cabin', [-27, -51]], ['the cabin stash', [-30, -49.5]]]) reach([9, -35], p, 'the wilds: road to ' + n);
const breach = path([-30, 6], [-30, 16], 2); ok(breach && breach.length, 'the breach is passable for the player (mode 2)');
const breachNpc = path([-30, 6], [-30, 16], 1); ok(breachNpc && breachNpc.length && breach.length <= breachNpc.length, 'NPCs walk round to the gate while the player can scramble over the breach');
const sewer = path([22, 6], [22, 16], 1); ok(sewer && sewer.length, 'the sewer outfall is walkable');
// every door must lead somewhere: the ground on both sides is free and connected
let sealed = 0;
for (const d of L.doors) {
  if (d.gate) continue;
  const off = 1.5, a = d.axis === 'x' ? [d.x, d.z - off] : [d.x - off, d.z], b = d.axis === 'x' ? [d.x, d.z + off] : [d.x + off, d.z];
  const wa = nav.nearestWalkable(a[0], a[1], 1), wb = nav.nearestWalkable(b[0], b[1], 1);
  if (!wa || !wb || !nav.findPath(wa[0], wa[1], wb[0], wb[1], { maxNodes: 60000 })) { sealed++; console.log(`  door "${d.name}" at ${d.x.toFixed(1)},${d.z.toFixed(1)} (${d.id || '-'}) is blocked on one side`); }
}
ok(sealed === 0, `no door is sealed shut by furniture (${sealed})`);
let bad = 0;
for (const [name, p] of Object.entries(L.pois)) {
  const w = nav.nearestWalkable(p.approach[0], p.approach[1], 4);
  if (p.type !== 'sentry' && (!w || Math.hypot(w[0] - p.approach[0], w[1] - p.approach[1]) > 3.2)) { bad++; console.log(`  note: poi ${name} has no free cell within 3.2 m of ${p.approach.map((v) => v.toFixed(1))}`); }
}
ok(bad === 0, `every poi has a free cell beside it (${bad} do not)`);
// each scheduled person can reach their bed and their work from the middle of the town
let unreachable = 0;
for (const d of roster) for (const s of d.schedule) if (s.poi && L.pois[s.poi] && d.id !== 'brannoch' && L.pois[s.poi].x < 60) {
  const a = nav.nearestWalkable(L.pois[s.poi].approach[0], L.pois[s.poi].approach[1], 4) || L.pois[s.poi].approach, from = a[1] > 92 ? [0, 99] : [0, 16];
  const p = path(from, a); if (!p) { unreachable++; console.log(`  no path to ${s.poi} (${d.id})`); }
}
ok(unreachable === 0, 'everyone can reach their places');

// ---------------------------------------------------------------------------- the social model
section('social');
const { Social, TALK } = await import('../src/social.js');
const { Look } = await import('../src/look.js');
const { Speech } = await import('../src/speech.js');
const so = new Social({ nav: L.nav, level: L, reg() {}, markers: [] });
const acc = (x, z) => so.access(x, z);
ok(acc(0, 40) === 0, 'the main street is open ground');
ok(acc(15, 41) === 1, 'a baker\'s shop is a private home');
ok(acc(0, 100) === 2, 'the keep courtyard is restricted');
ok(acc(0, 120) === 2, 'the great hall is the household: restricted, not forbidden');
ok(acc(0, 140) === 3, 'the Duke\'s apartments are forbidden');
ok(acc(-28, 104) === 3, 'the keep barracks are forbidden');
ok(acc(20, -104) === 2, 'the fort yard is restricted');
ok(acc(28, -114) === 3, 'the gaol is forbidden');
ok(acc(0, -60) === 0 && acc(-8, -111) === 0, 'the road and the stable are open ground');
ok(so.inTown(0, 40) && !so.inTown(0, 120) && !so.inTown(0, -60), 'the town streets are between the wall and the keep');
// every reason a guard can give has the lines the challenge dialogue needs
for (const [id, T] of Object.entries(TALK)) ok(T.open?.length >= 2 && T.again && T.persuade && T.deceive && T.okP && T.okD && T.deadline > 0 && T.fee > 0 && T.ack, `challenge "${id}" has every line`);
// what a witness remembers decides who can be recognised
const gear = { eq: {} }, rep = { disguise: null, total: () => 100, bounty: { watch: 100, keep: 0, bandits: 0 } };
const player = { drawn: true, pos: [0, 0, 0], mod: {} };
const fakeG = { time: 100, gear, rep, player, lightAt: () => 1, level: L, social: { crowdK: 0 }, reg() {}, weather: { cur: { rain: 0 } }, toast() {}, pix: {}, sfx: {}, stats: {} };
const look = new Look(fakeG);
look.hood = true;
const guardA = { id: 'ga', x: 0, z: 0, guard: true, faction: 'watch', role: 'guard', dist: 4 }, guardB = { id: 'gb', x: 0, z: 90, guard: true, faction: 'keep', role: 'guard', dist: 4 }, villager = { id: 'v1', x: 3, z: 3, guard: false, faction: 'town', role: 'villager', dist: 4 };
const D = look.snapshot(guardA, 4); D.f = 'watch'; look.add(D);
ok(!D.face, 'a hooded thief shows no face to a witness');
ok(look.known(guardA, D), 'the witness knows what he saw');
ok(!look.known(guardB, D), 'a guard at the other end of town has not heard yet');
fakeG.time = 100 + 90 / 5 + 1; ok(look.known(guardB, D), 'the word reaches him at a walking pace (watch and keep share news)');
ok(!look.known(villager, D), 'a villager who saw nothing knows nothing');
const same = look.match(guardA, 4); ok(same > 0.7, `the same hood, cloak and drawn sword is a strong match (${same.toFixed(2)})`);
look.hood = false; const hoodDown = look.match(guardA, 4); ok(hoodDown < same && hoodDown > 0.3, `lowering the hood weakens it (${hoodDown.toFixed(2)})`);
gear.eq.body = 'nightcloak'; const newCloak = look.match(guardA, 4); ok(newCloak < hoodDown, `and a different cloak weakens it more (${newCloak.toFixed(2)})`);
rep.disguise = { faction: 'watch', kind: 'watch', label: 'Watch uniform' }; const unif = look.match(guardA, 4); ok(unif < 0.3, `a Watch uniform defeats a description of a hooded man (${unif.toFixed(2)})`);
rep.disguise = null; gear.eq = {}; look.hood = true;
look.descs[0].face = true; look.hood = false; ok(look.match(guardA, 8) > 0.95, 'a face that was seen, shown again in view, is as good as certain'); look.hood = true;
fakeG.time = 1000; ok(look.match(guardA, 4) < 0.1, 'old descriptions are forgotten');
// the odds are bounded and respond to what you are carrying
const sp = new Speech({ player: { drawn: false, hp: 100, maxHp: 100, mod: { speech: 0.24 } }, rep: { disguise: null }, look: { bloody: 0, match: () => 0 }, social: { attOf: () => 0, vig: 0 }, difficulty: 1 });
const c1 = sp.chance('persuade', { chFails: 0, role: 'guard', faction: 'watch', dist: 3 });
ok(c1 > 0.6 && c1 <= 0.95, `three ranks of Silver Tongue make persuading likely (${c1.toFixed(2)})`);
ok(sp.chance('persuade', { chFails: 4, role: 'captain', faction: 'keep', dist: 3 }) >= 0.05, 'the odds never drop below five per cent');

section('campaign');
{
  const { CHAPTERS, VERSES } = await import('../src/campaign.js');
  const { TROPHIES } = await import('../src/achievements.js');
  const { ECHOES } = await import('../src/echoes.js');
  const { ENDINGS } = await import('../src/endings.js');
  const { QUESTS } = await import('../src/quests.js');
  const { ITEMS } = await import('../src/items.js');
  const { GEAR } = await import('../src/gear.js');
  ok(CHAPTERS.length === 4 && Object.keys(VERSES).length === 3, 'four chapters and three verses');
  ok(TROPHIES.length === 40 && new Set(TROPHIES.map((t) => t.id)).size === 40, 'forty trophies with distinct ids');
  ok(Object.keys(ENDINGS).length === 4, 'four endings');
  ok(ECHOES.length === 13, 'thirteen Choir echoes');
  for (const e of ECHOES) { const q = L.nav.nearestWalkable(e.at[0], e.at[1], 4); ok(q && Math.hypot(q[0] - e.at[0], q[1] - e.at[1]) < 4, `echo ${e.id} at ${e.where} can be reached`); }
  const ids = new Set(roster.map((d) => d.id));
  for (const q of QUESTS) ok(ids.has(q.giver), `quest ${q.id}: giver "${q.giver}" exists`);
  for (const who of ['ansel', 'sable', 'duke', 'marl', 'harl', 'brannoch', 'brask', 'hermit']) ok(ids.has(who), `story character "${who}" is in the roster`);
  for (const id of ['letter', 'uni_hand', 'vanekey', 'rookkey', 'binderskull', 'clapper', 'salve_gh', 'crossbow', 'bolt', 'bolt_water', 'bolt_fire', 'bolt_sleep']) ok(ITEMS[id], `item "${id}" exists`);
  for (const id of ['handring', 'waxward', 'vanecoat', 'knightplate', 'echocharm']) ok(GEAR[id], `gear "${id}" exists`);
  // the deep places: every way in lands somewhere walkable, and their rooms join up
  const P = L.places, walk = (x, z) => !L.nav.isBlocked(x, z);
  for (const k of ['rookIn', 'belfryIn', 'deepIn']) ok(walk(P[k].pos[0], P[k].pos[2]), `${k} lands on walkable ground`);
  for (const k of ['rookUp', 'rookBoat', 'belfryOut', 'deepOut', 'vaneAt', 'choirIn']) ok(P[k] && L.nav.nearestWalkable(P[k][0], P[k][1], 3), `${k} is next to walkable ground`);
  const path = (a, b) => L.nav.findPath(a[0], a[1], b[0], b[1]);
  ok(path([-218.5, 301], [-180, 314]), 'the Rookery cellar reaches the dock');
  ok(path([-218.5, 301], [-176, 300]), 'the Rookery cellar reaches Vane\'s hall');
  ok(path([-36, 293.5], [20, 347]), 'the Deep\'s throat reaches the Choir');
  ok(path([0, 3], [0, -50]), 'the south gate opens onto the road for the siege');
}

console.log(failed ? `\n${failed} checks failed` : '\nall Hollowmere checks passed');
process.exit(failed ? 1 : 0);
