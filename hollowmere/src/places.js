// The ways in and out of the deep places (see level/deep.js): the trapdoor behind the bar of the
// Drowned Lantern, the boat in the Rookery's dock, the door at the foot of Ravenspire's bell tower,
// and the Mouth that opens at the Choir Stones. Each asks the campaign whether it is open yet.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;

export function installPlaces(g) {
  const L = g.level, P = L.places, C = () => g.campaign, F = () => g.campaign.facts;
  const go = (pos, yaw, area) => g.teleport({ pos, yaw, area });
  const walk = (x, z) => { const q = g.nav.nearestWalkable(x, z, 4) || [x, z]; return [q[0], 0.1, q[1]]; };
  const add = (o) => L.interactables.push({ kind: 'stairs', r: 2.2, obj: o, ...o });
  // the Rookery
  const trap = [138.6, -170.4];
  { const k = g.level.pal; const kit = new E.Kit(k); kit.box(k.plank, [trap[0], 0.035, trap[1]], [1.2, 0.05, 1.2]); kit.box(k.iron, [trap[0], 0.07, trap[1] + 0.4], [0.5, 0.03, 0.06]); g.scene.add(kit.toNode('Trapdoor')); }
  add({ x: trap[0], y: 0.4, z: trap[1], r: 1.8, prompt: () => (F().rookOpen ? 'Climb down through the trapdoor' : C().index() >= 1 ? 'The trapdoor is bolted from below' : 'A trapdoor, bolted from below'), use: () => { if (!F().rookOpen && g.player.inv.has('rookkey') && C().index() >= 1) { F().rookOpen = true; g.toast('Marl\'s key turns the bolt'); } if (!F().rookOpen) { g.toast(C().has('c2_rookery') ? 'Bolted. Marl must have a way in: ask him, or find another door.' : 'It will not budge.'); g.sfx.deny?.(); return; } go(P.rookIn.pos, P.rookIn.yaw, P.rookIn.area); } });
  add({ x: P.rookUp[0], y: 0.8, z: P.rookUp[1], prompt: () => 'Climb up into the Drowned Lantern', use: () => go(walk(139.2, -168.4), -Math.PI / 2, 'Pellmouth: The Drowned Lantern') });
  add({ x: P.rookBoat[0], y: 0.6, z: P.rookBoat[1], r: 2.6, prompt: () => 'Take the boat out to the lake', use: () => { F().rookOpen = true; go(walk(151, -160), Math.PI / 2, 'Pellmouth'); } });
  // the belfry, at the foot of the keep's north-east tower
  const tower = [32.3, 149.3];
  { const k = g.level.pal; const kit = new E.Kit(k); kit.box(k.plank, [33.0, 1.15, 150.0], [1.3, 2.3, 0.16], [0, 45, 0]); kit.box(k.iron, [33.0, 1.15, 150.0], [1.36, 0.08, 0.2], [0, 45, 0]); kit.box(k.iron, [33.0, 2.0, 150.0], [1.36, 0.08, 0.2], [0, 45, 0]); g.scene.add(kit.toNode('Bell tower door')); }
  add({ x: tower[0], y: 1.0, z: tower[1], r: 2.2, prompt: () => (F().belfryOpen || C().index() >= 2 ? 'Climb the bell tower' : 'The bell tower door is locked'), use: () => { if (!(F().belfryOpen || C().index() >= 2)) { g.toast('Locked fast. The bell is not your business. Yet.'); g.sfx.deny?.(); return; } go(P.belfryIn.pos, P.belfryIn.yaw, P.belfryIn.area); } });
  add({ x: P.belfryOut[0], y: 0.8, z: P.belfryOut[1], prompt: () => 'Go back down into the courtyard', use: () => go(walk(31.2, 147.6), Math.PI, 'Ravenspire Courtyard') });
  // the Mouth beneath the Choir Stones
  add({ x: 80, y: 0.6, z: -196.6, r: 2.6, prompt: () => (F().mouthOpen ? 'Descend into the Mouth' : null), use: () => go(P.deepIn.pos, P.deepIn.yaw, P.deepIn.area) });
  add({ x: P.deepOut[0], y: 0.8, z: P.deepOut[1], prompt: () => 'Climb back up to the Choir Stones', use: () => go(walk(80, -190), Math.PI, 'The Choir Stones') });
  // the teleport cutaways read nicer with the door sound, the dark and a beat of silence
  g.placeAt = (key) => { const p = P[key]; if (p) go(p.pos, p.yaw, p.area); };
  void hyp;
}
