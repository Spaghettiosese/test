// The Frozen Sanctum: the Ice Mage's boss arena. A glossy circular ice floor inside a wall of
// jagged cliffs, eight destructible ice pillars, low ice barricades for cover, three braziers
// to refill ember at, and snowy mountains beyond. Pillars and barricades are Destructibles.
import * as E from '../../engine/index.js';

export const ARENA_RADIUS = 26;
const rnd = E.rng(5);

export function buildArena(scene, world, fire) {
  const M = {
    floor: new E.Material({ name: 'Ice floor', color: '#9cc8e0', roughness: 0.07, metallic: 0.1, pattern: 'stucco', patternScale: 1.4, patternColor: '#6fa2c4', patternStrength: 0.5 }),
    inner: new E.Material({ name: 'Ice rune', color: '#c9ecfa', roughness: 0.05, metallic: 0.1 }),
    snow: new E.Material({ name: 'Snow', color: '#dfe9f2', roughness: 0.95, pattern: 'dirt', patternScale: 1.2, patternColor: '#b4c6d8', patternStrength: 0.5 }),
    cliff: new E.Material({ name: 'Cliff ice', color: '#7fb1cf', roughness: 0.25, metallic: 0.1, pattern: 'stucco', patternScale: 2, patternColor: '#4a7fa2' }),
    pillar: new E.Material({ name: 'Ice pillar', color: '#a8dcf2', roughness: 0.1, metallic: 0.15, emissive: '#3a8fc0', emissiveStrength: 0.7 }),
    crystal: new E.Material({ name: 'Crystal', color: '#d6f4ff', roughness: 0.06, emissive: '#7fd6ff', emissiveStrength: 2.4 }),
    mountain: new E.Material({ name: 'Mountain', color: '#eaf2f8', roughness: 0.9, pattern: 'stucco', patternScale: 3, patternColor: '#9db4c8' }),
    iron: new E.Material({ name: 'Iron', color: '#2c2d30', roughness: 0.5, metallic: 0.85 }),
  };
  const root = new E.Node('Frozen Sanctum'); scene.add(root);
  const destructibles = [];
  world.add(new E.Body({ shape: new E.Plane(), friction: 0.5 })).userData.kind = 'ground';
  const snow = new E.Mesh(E.plane({ width: 500, depth: 500 }), M.snow, 'Snow field'); snow.position.set([0, -0.02, 0]); snow.castShadow = false; root.add(snow);
  const floor = new E.Mesh(E.cylinder({ radiusTop: ARENA_RADIUS, radiusBottom: ARENA_RADIUS, height: 0.06, radialSegments: 64 }), M.floor, 'Ice floor'); floor.position.set([0, 0.03, 0]); floor.castShadow = false; root.add(floor);
  for (const [r, w] of [[19, 0.5], [11, 0.4], [4, 0.35]]) { const ring = new E.Mesh(E.torus({ radius: r, tube: w, radialSegments: 6, tubularSegments: 72, tubeScaleY: 0.12 }), M.inner, 'Rune ring'); ring.position.set([0, 0.07, 0]); ring.castShadow = false; root.add(ring); }

  const kit = new E.Kit(E.archPalette());
  // the cliff wall ring: static boxes with crystal spikes on top
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = ARENA_RADIUS + 1.6, w = (2 * Math.PI * r) / N + 0.8, h = 6 + rnd() * 5;
    const x = Math.sin(a) * r, z = Math.cos(a) * r, rot = (a * 180) / Math.PI;
    kit.box(M.cliff, [x, h / 2, z], [w, h, 3.2], [0, rot, 0], 0.3);
    world.add(new E.Body({ shape: new E.Box([w / 2, h / 2, 1.6]), type: 'static', position: [x, h / 2, z], rotation: E.quat.fromEuler(E.quat.create(), 0, rot, 0) })).userData.kind = 'wall';
    for (let k = 0; k < 3; k++) kit.shape(M.crystal, { type: 'cone', radius: 0.4 + rnd() * 0.3, height: 2 + rnd() * 3, radialSegments: 5, heightSegments: 1, capBottom: true, arc: 360 }, [], [x + (rnd() - 0.5) * w * 0.7, h + 0.8, z], [rnd() * 14 - 7, rnd() * 360, rnd() * 14 - 7]);
  }
  // distant mountains
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.3, r = 95 + rnd() * 45, h = 35 + rnd() * 40;
    kit.shape(M.mountain, { type: 'cone', radius: 24 + rnd() * 16, height: h, radialSegments: 7, heightSegments: 1, capBottom: true, arc: 360 }, [], [Math.sin(a) * r, h / 2, Math.cos(a) * r], [0, rnd() * 360, 0]);
  }
  root.add(kit.toNode('Cliffs'));

  const destr = (name, pos, size, hp, grid, build, rotY = 0) => {
    const k = new E.Kit(E.archPalette()); build(k);
    const n = k.toNode(name); n.position.set(pos); n.setEuler(0, rotY, 0); root.add(n);
    const body = world.add(new E.Body({ shape: new E.Box(size.map((v) => v / 2)), type: 'static', position: pos, rotation: E.quat.fromEuler(E.quat.create(), 0, rotY, 0) })); body.userData.kind = 'static';
    destructibles.push({ node: n, body, hp, size, grid, material: M.pillar, center: [...pos], name });
  };
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, r = 15, x = Math.sin(a) * r, z = Math.cos(a) * r;
    destr('Ice pillar', [x, 3.2, z], [1.8, 6.4, 1.8], 95, [2, 4, 2], (k) => {
      k.box(M.pillar, [0, 0, 0], [1.8, 6.4, 1.8], [0, 0, 0], 0.25);
      k.shape(M.crystal, { type: 'cone', radius: 0.8, height: 1.4, radialSegments: 6, heightSegments: 1, capBottom: true, arc: 360 }, [], [0, 3.9, 0], [0, 0, 0]);
      k.light([0, 3.4, 0], { color: '#7fd6ff', intensity: 2, range: 8, flicker: 0.1 });
    });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, r = 8, x = Math.sin(a) * r, z = Math.cos(a) * r, rot = (a * 180) / Math.PI;
    destr('Ice barricade', [x, 0.75, z], [3.6, 1.5, 0.8], 60, [4, 2, 1], (k) => k.box(M.pillar, [0, 0, 0], [3.6, 1.5, 0.8], [0, 0, 0], 0.15), rot);
  }
  // braziers: refill ember here
  const braziers = [];
  for (const a of [0.5, 2.6, 4.7]) {
    const x = Math.sin(a) * 22, z = Math.cos(a) * 22;
    const k = new E.Kit(E.archPalette());
    k.cyl(M.iron, [0, 0.6, 0], 0.09, 1.2, [0, 0, 0], 10, 0.14); k.cyl(M.iron, [0, 1.25, 0], 0.5, 0.3, [0, 0, 0], 20, 0.32);
    k.light([0, 1.9, 0], { color: '#ff9a3a', intensity: 4, range: 10, flicker: 0.5 });
    const n = k.toNode('Brazier'); n.position.set([x, 0, z]); root.add(n);
    world.add(new E.Body({ shape: new E.Box([0.4, 0.7, 0.4]), type: 'static', position: [x, 0.7, z] })).userData.kind = 'static';
    const b = fire.addSource([x, 1.4, z], { radius: 0.5, strength: 1 }); b.userData = { name: 'Brazier' };
    braziers.push([x, z]);
  }
  return { root, destructibles, braziers, radius: ARENA_RADIUS, materials: M, playerStart: [0, 0.15, -19], bossStart: [0, 0, 8] };
}
