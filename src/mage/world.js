// Ember Glade: a small dusk meadow with a stone plaza and a brazier, a timber hut, a fenced
// hay yard, crates and barrels that are real physics bodies, trees, straw dummies and a
// pond. Everything wooden is a V5 FireSystem burnable: it heats its neighbours, catches,
// chars, collapses to embers and smoke, so a single fireball can start a chain reaction.
import * as E from '../../engine/index.js';

const rnd = E.rng(11);

export function buildGlade(scene, world, fire) {
  const pal = E.archPalette();
  const M = {
    grass: new E.Material({ name: 'Grass', color: '#4a5e2f', roughness: 0.98, pattern: 'dirt', patternScale: 1.2, patternColor: '#2f3f1d', patternStrength: 0.8 }),
    dirt: new E.Material({ name: 'Path', color: '#8a7050', roughness: 0.95, pattern: 'dirt', patternScale: 2.4, patternColor: '#5d4a33' }),
    flag: new E.Material({ name: 'Flagstone', color: '#8d877d', roughness: 0.88, pattern: 'stucco', patternScale: 5, patternColor: '#5c574f' }),
    stone: new E.Material({ name: 'Rock', color: '#7d7a72', roughness: 0.95, pattern: 'stucco', patternScale: 2, patternColor: '#4f4c46' }),
    plank: pal.deck, dark: pal.darkWood, siding: pal.siding, shingles: pal.shingles,
    trunk: new E.Material({ name: 'Bark', color: '#4d3826', roughness: 0.95, pattern: 'wood', patternScale: 6, patternColor: '#2a1c11' }),
    leaf: new E.Material({ name: 'Leaves', color: '#2f5a2a', roughness: 0.9, pattern: 'fabric', patternScale: 30, patternColor: '#1c3a18', patternStrength: 0.6 }),
    hay: new E.Material({ name: 'Hay', color: '#c9a94e', roughness: 0.98, pattern: 'hair', patternScale: 10, patternColor: '#8a6d24' }),
    barrel: new E.Material({ name: 'Barrel', color: '#7a5330', roughness: 0.8, pattern: 'planks', patternScale: 10, patternColor: '#2b1a0c' }),
    iron: new E.Material({ name: 'Iron', color: '#2c2d30', roughness: 0.5, metallic: 0.85, pattern: 'metal', patternScale: 2 }),
    cloth: new E.Material({ name: 'Cloth', color: '#8a7a5a', roughness: 0.95, pattern: 'fabric', patternScale: 90 }),
    water: new E.Material({ name: 'Pond', color: '#1f4a55', roughness: 0.04, metallic: 0.25 }),
    coal: new E.Material({ name: 'Coals', color: '#ff6a1a', roughness: 0.6, emissive: '#ff4a08', emissiveStrength: 4 }),
  };
  const staticBox = (c, size, kind = 'static') => { const b = world.add(new E.Body({ shape: new E.Box(size.map((s) => s / 2)), type: 'static', position: c })); b.userData.kind = kind; return b; };
  const root = new E.Node('Glade'); scene.add(root);
  const burnables = [], destructibles = [];

  // ---- ground: meadow, a dirt path and a flagstone plaza
  world.add(new E.Body({ shape: new E.Plane(), friction: 0.8 })).userData.kind = 'ground';
  const ground = new E.Mesh(E.plane({ width: 300, depth: 300 }), M.grass, 'Meadow'); ground.castShadow = false; root.add(ground);
  const path = new E.Mesh(E.plane({ width: 3.2, depth: 46 }), M.dirt, 'Path'); path.position.set([0, 0.006, -20]); path.castShadow = false; root.add(path);
  const plaza = new E.Mesh(E.cylinder({ radiusTop: 7.2, radiusBottom: 7.4, height: 0.14, radialSegments: 48 }), M.flag, 'Plaza'); plaza.position.set([0, 0.07, 0]); root.add(plaza);
  staticBox([0, 0.07, 0], [12.5, 0.14, 12.5]);

  const kit = new E.Kit(pal);
  // each stone is its own node and body so a blast can shatter it into rigid-body chunks
  const stoneAt = (pos, size, rotY, hp, grid, build) => {
    const k = new E.Kit(pal); build(k);
    const n = k.toNode('Stone'); n.position.set(pos); n.setEuler(0, rotY, 0); root.add(n);
    const body = world.add(new E.Body({ shape: new E.Box(size.map((v) => v / 2)), type: 'static', position: pos, rotation: E.quat.fromEuler(E.quat.create(), 0, rotY, 0) })); body.userData.kind = 'static';
    destructibles.push({ node: n, body, hp, size, grid, material: M.stone, center: [...pos], name: 'Stone' });
  };
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, r = 8.6, x = Math.sin(a) * r, z = Math.cos(a) * r, h = 1.1 + rnd() * 1.1, w = 0.7 + rnd() * 0.3;
    stoneAt([x, h / 2, z], [w, h, 0.6], (a * 180) / Math.PI, 70, [2, 3, 2], (k) => k.box(M.stone, [0, 0, 0], [w, h, 0.6], [0, 0, 0], 0.1));
  }
  // scattered boulders
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, r = 16 + rnd() * 20, s2 = 0.5 + rnd() * 0.9;
    stoneAt([Math.sin(a) * r, s2 * 0.4, Math.cos(a) * r], [s2 * 1.4, s2 * 0.9, s2 * 1.2], rnd() * 360, 45, [2, 2, 2],
      (k) => k.shape(M.stone, { type: 'superquadric', rx: s2 * 0.7, ry: s2 * 0.45, rz: s2 * 0.6, e1: 0.7, e2: 0.8, widthSegments: 14, heightSegments: 9, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, [], [0, 0, 0], [0, 0, 0]));
  }
  // pond
  const pond = new E.Mesh(E.cylinder({ radiusTop: 4.2, radiusBottom: 4.2, height: 0.02, radialSegments: 40 }), M.water, 'Pond'); pond.position.set([-19, 0.02, 12]); pond.castShadow = false; root.add(pond);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; kit.shape(M.stone, { type: 'superquadric', rx: 0.4, ry: 0.22, rz: 0.35, e1: 0.7, e2: 0.8, widthSegments: 10, heightSegments: 7, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, [], [-19 + Math.sin(a) * 4.5, 0.12, 12 + Math.cos(a) * 4.5], [0, rnd() * 360, 0]); }
  root.add(kit.toNode('Stones'));
  world.add(new E.Body({ shape: new E.Box([4.2, 0.05, 4.2]), type: 'static', position: [-19, -0.03, 12] })).userData.kind = 'water';

  // ---- burnable helper: a node built from a small kit, registered with the fire system
  const flammable = (name, build, pos, o = {}) => {
    const k = new E.Kit(pal); build(k);
    // the burnable's node sits at its heart (`at` above the ground), so flames rise from there
    const at = o.at || [0, 0, 0];
    const n = new E.Node(name), inner = k.toNode(name);
    n.position.set([pos[0] + at[0], pos[1] + at[1], pos[2] + at[2]]); inner.position.set([-at[0], -at[1], -at[2]]);
    if (o.rotY) n.setEuler(0, o.rotY, 0);
    n.add(inner); root.add(n);
    const b = fire.add(n, { radius: o.radius ?? 0.6, fuel: o.fuel ?? 20, ignition: o.ignition ?? 1, flammability: o.flammability ?? 1, height: o.height });
    b.userData = { name, collapse: !!o.collapse, node: n };
    burnables.push(b); return b;
  };

  // ---- the hut
  const hutPos = [15, 0, -9];
  flammable('Hut', (k) => {
    k.box(M.siding, [0, 1.3, 0], [5.2, 2.6, 4.2]);
    k.box(M.dark, [0, 0.08, 0], [5.5, 0.16, 4.5]);
    k.shape(M.shingles, { type: 'cylinder', radiusTop: 0.01, radiusBottom: 3.55, height: 1.7, radialSegments: 4, heightSegments: 1, capTop: true, capBottom: true, arc: 360 }, [], [0, 3.4, 0], [0, 45, 0], [1.05, 1, 0.85]);
    k.box(M.dark, [0, 1.0, 2.13], [1.0, 2.0, 0.08]); // door
    k.box(M.dark, [1.6, 1.5, 2.12], [0.9, 0.8, 0.06]); k.box(pal.glass, [1.6, 1.5, 2.16], [0.7, 0.6, 0.02]);
    k.box(M.stone, [-2.0, 3.6, -1.0], [0.5, 2.6, 0.5]); // chimney
    k.light([0, 1.5, 2.6], { color: '#ffb35a', intensity: 3, range: 6, flicker: 0.3 });
  }, hutPos, { radius: 2.3, fuel: 70, height: 3, ignition: 1.4, collapse: false, at: [0, 1.2, 0] });
  const hutBody = staticBox([hutPos[0], 1.3, hutPos[2]], [5.2, 2.6, 4.2], 'wood');
  const hutB = burnables.find((b) => b.userData.name === 'Hut');
  destructibles.push({ node: hutB.userData.node, body: hutBody, hp: 330, size: [5.2, 2.6, 4.2], grid: [5, 3, 4], material: M.siding, center: [hutPos[0], 1.3, hutPos[2]], name: 'Hut', onBreak: () => { fire.remove(hutB); burnables.splice(burnables.indexOf(hutB), 1); } });

  // ---- fenced hay yard
  const yard = [-14, 0, -12];
  for (let i = 0; i <= 8; i++) for (const [ox, oz, rot] of [[i * 1.6 - 6.4, -5, 0], [i * 1.6 - 6.4, 5, 0]]) flammable('Fence', (k) => { k.box(M.dark, [0, 0.55, 0], [0.12, 1.1, 0.12]); k.box(M.plank, [0.8, 0.85, 0], [1.6, 0.1, 0.06]); k.box(M.plank, [0.8, 0.5, 0], [1.6, 0.1, 0.06]); }, [yard[0] + ox, 0, yard[2] + oz], { radius: 0.5, fuel: 14, flammability: 1.1 });
  for (let i = 0; i < 6; i++) for (const ox of [-6.4, 6.4]) flammable('Fence', (k) => { k.box(M.dark, [0, 0.55, 0], [0.12, 1.1, 0.12]); k.box(M.plank, [0, 0.85, 0.8], [0.06, 0.1, 1.6]); k.box(M.plank, [0, 0.5, 0.8], [0.06, 0.1, 1.6]); }, [yard[0] + ox, 0, yard[2] - 4.2 + i * 1.6], { radius: 0.5, fuel: 14 });
  const hayBale = (k) => { k.box(M.hay, [0, 0.3, 0], [1.1, 0.6, 0.6], [0, 0, 0], 0.08); k.box(M.dark, [-0.2, 0.3, 0], [0.03, 0.62, 0.62]); k.box(M.dark, [0.2, 0.3, 0], [0.03, 0.62, 0.62]); };
  const hayBodies = [];
  for (let i = 0; i < 9; i++) {
    const p = [yard[0] - 3.2 + (i % 3) * 1.25 + rnd() * 0.2, 0.3 + (i >= 6 ? 0.6 : 0), yard[2] - 2 + Math.floor((i % 6) / 3) * 0.75 + (i >= 6 ? 0.4 : 0)];
    const b = flammable('Hay bale', hayBale, [p[0], p[1] - 0.3, p[2]], { radius: 0.7, fuel: 18, flammability: 1.5, ignition: 0.7, at: [0, 0.3, 0], collapse: true });
    hayBodies.push(b);
  }
  staticBox([yard[0] - 2, 0.6, yard[2] - 1.6], [4.6, 1.2, 2.3], 'wood');

  // ---- trees
  const tree = (k, h) => {
    k.cyl(M.trunk, [0, h / 2, 0], 0.22, h, [0, 0, 0], 10, 0.32);
    for (const [y, r, dx, dz] of [[h + 0.5, 1.7, 0, 0], [h + 1.4, 1.3, 0.2, 0], [h - 0.4, 1.5, -0.4, 0.4]]) k.shape(M.leaf, { type: 'superquadric', rx: r, ry: r * 0.8, rz: r, e1: 0.8, e2: 0.9, widthSegments: 14, heightSegments: 10, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, [], [dx, y, dz], [0, rnd() * 360, 0]);
  };
  const treeSpots = [[-24, -3], [-27, -18], [24, 6], [28, -20], [-10, 24], [8, 27], [22, 22], [-30, 4], [2, -32], [-12, -30], [32, -4], [-4, 33], [30, 14]];
  for (const [x, z] of treeSpots) {
    const h = 3 + rnd() * 1.6;
    flammable('Tree', (k) => tree(k, h), [x, 0, z], { radius: 1.5, fuel: 40, height: h + 1, ignition: 1.3, flammability: 0.7, at: [0, h * 0.6, 0] });
    staticBox([x, 1.5, z], [0.6, 3, 0.6], 'wood');
  }

  // ---- physics props: crates and barrels you can knock about and burn
  const props = [];
  const crateGeo = E.box({ width: 0.7, height: 0.7, depth: 0.7, bevel: 0.03 });
  const barrelGeo = E.lathe({ points: [[0, -0.45], [0.3, -0.45], [0.37, -0.15], [0.39, 0], [0.37, 0.15], [0.3, 0.45], [0, 0.45]], segments: 20, smooth: 1 });
  const bandGeo = E.cylinder({ radiusTop: 0.395, radiusBottom: 0.395, height: 0.05, radialSegments: 20, capTop: false, capBottom: false });
  const spawnProp = (kind, pos, rotY = 0) => {
    const n = new E.Node(kind);
    if (kind === 'Crate') { n.add(new E.Mesh(crateGeo, M.dark, 'Crate')); const b = world.add(new E.Body({ shape: new E.Box([0.35, 0.35, 0.35]), position: pos, mass: 14, friction: 0.6, rotation: E.quat.fromEuler(E.quat.create(), 0, rotY, 0) })); b.node = n; b.userData.kind = 'crate'; props.push({ body: b, node: n, kind, start: [...pos], rot: rotY }); }
    else {
      n.add(new E.Mesh(barrelGeo, M.barrel, 'Barrel'));
      for (const y of [-0.3, 0.3]) { const band = new E.Mesh(bandGeo, M.iron, 'Band'); band.position.set([0, y, 0]); n.add(band); }
      const b = world.add(new E.Body({ shape: new E.Box([0.36, 0.45, 0.36]), position: pos, mass: 22, friction: 0.5, rotation: E.quat.fromEuler(E.quat.create(), 0, rotY, 0) })); b.node = n; b.userData.kind = 'barrel'; props.push({ body: b, node: n, kind, start: [...pos], rot: rotY });
    }
    n.position.set(pos); n.setEuler(0, rotY, 0); root.add(n);
    const f = fire.add(n, { radius: 0.55, fuel: kind === 'Crate' ? 14 : 20, flammability: 1.2, ignition: 0.9 });
    f.userData = { name: kind, prop: props[props.length - 1], explosive: kind === 'Barrel' };
    return f;
  };
  const buildProps = () => {
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++) spawnProp('Crate', [7 + i * 0.75 + r * 0.38, 0.36 + r * 0.72, -13 + (i % 2) * 0.05], i * 4);
    for (let i = 0; i < 5; i++) spawnProp('Barrel', [-6 + i * 0.85, 0.46, 15 + (i % 2) * 0.4], i * 17);
    for (let i = 0; i < 3; i++) spawnProp('Crate', [3 + i * 0.8, 0.36, 12], i * 9);
    spawnProp('Barrel', [3.6, 1.1, 12.2]);
  };
  buildProps();

  // ---- straw dummies to torch
  const dummies = [];
  const dummyBuild = (k) => {
    k.box(M.dark, [0, 0.9, 0], [0.09, 1.8, 0.09]); k.box(M.dark, [0, 1.35, 0], [1.3, 0.09, 0.09]);
    k.shape(M.hay, { type: 'superquadric', rx: 0.28, ry: 0.4, rz: 0.2, e1: 0.8, e2: 0.8, widthSegments: 12, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, [], [0, 1.1, 0], [0, 0, 0]);
    k.shape(M.cloth, { type: 'sphere', radius: 0.19, widthSegments: 14, heightSegments: 10, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 }, [], [0, 1.72, 0], [0, 0, 0]);
    k.box(M.dark, [0, 1.98, 0], [0.5, 0.03, 0.5]); k.box(M.dark, [0, 2.12, 0], [0.28, 0.25, 0.28]);
  };
  for (const [x, z, rot] of [[-5, -9, 20], [0, -14, 0], [5, -9, -20], [-9, 6, 90], [10, 9, -130], [24, -1, 200]]) dummies.push(flammable('Straw dummy', dummyBuild, [x, 0, z], { rotY: rot, radius: 0.6, fuel: 12, flammability: 1.6, ignition: 0.6, height: 2, at: [0, 1.1, 0], collapse: true }));

  // ---- the brazier at the plaza's heart: permanent fire, and the place the mage refills mana
  const braz = new E.Kit(pal);
  braz.cyl(M.iron, [0, 0.55, 0], 0.09, 1.1, [0, 0, 0], 10, 0.14);
  braz.cyl(M.iron, [0, 1.15, 0], 0.5, 0.3, [0, 0, 0], 20, 0.32);
  braz.cyl(M.coal, [0, 1.3, 0], 0.4, 0.05, [0, 0, 0], 16);
  for (let i = 0; i < 3; i++) braz.box(M.iron, [Math.sin(i * 2.1) * 0.3, 0.16, Math.cos(i * 2.1) * 0.3], [0.08, 0.32, 0.08], [Math.cos(i * 2.1) * 14, 0, Math.sin(i * 2.1) * -14]);
  braz.light([0, 1.9, 0], { color: '#ff9a3a', intensity: 4, range: 9, flicker: 0.5 });
  root.add(braz.toNode('Brazier')); staticBox([0, 0.7, 0], [0.9, 1.4, 0.9], 'iron');
  const brazier = fire.addSource([0, 1.3, 0], { radius: 0.5, strength: 1 });
  brazier.userData = { name: 'Brazier' };
  // torches on stakes around the yard entrance
  const torches = [[12, -3], [12, 3], [-9, -6.5], [-9, 6.5]].map(([x, z]) => {
    const t = new E.Kit(pal); t.box(M.dark, [0, 0.9, 0], [0.07, 1.8, 0.07]); t.cyl(M.iron, [0, 1.85, 0], 0.06, 0.16, [0, 0, 0], 8, 0.09);
    const n = t.toNode('Torch'); n.position.set([x, 0, z]); root.add(n);
    return fire.addSource([x, 1.95, z], { radius: 0.16, strength: 0.9 });
  });

  return { root, props, burnables, destructibles, dummies, brazier, torches, hut: burnables.find((b) => b.userData.name === 'Hut'), buildProps, spawnProp, materials: M, hutPos };
}
