// The shooting range: a covered firing line, three lanes with distance boards, paper
// bullseyes, swinging steel, a bottle-and-can table, a crate stack, a moving target and
// steel gongs out to 200 m, all inside earth berms. Everything that can be shot is a
// physics body tagged with userData.kind so the game knows how to react.
import * as E from '../engine/index.js';

// 3x5 pixel digits and a few letters for the distance boards
const GLYPHS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'], M: ['10001', '11011', '10101', '10001', '10001'], ' ': ['000', '000', '000', '000', '000'],
};
function pixelText(kit, mat, text, center, height, rotY = 180) {
  const px = height / 5, q = E.quat.fromEuler(E.quat.create(), 0, rotY, 0);
  const widths = [...text].map((c) => (GLYPHS[c] || GLYPHS[' '])[0].length);
  const total = widths.reduce((a, w) => a + w, 0) * px + (text.length - 1) * px;
  let x = -total / 2;
  [...text].forEach((c, i) => {
    const g = GLYPHS[c] || GLYPHS[' '];
    g.forEach((row, r) => [...row].forEach((bit, col) => {
      if (bit !== '1') return;
      const local = [x + (col + 0.5) * px, height / 2 - (r + 0.5) * px, 0];
      const w = E.vec3.transformQuat([0, 0, 0], local, q);
      kit.box(mat, [center[0] + w[0], center[1] + w[1], center[2] + w[2]], [px, px, px * 0.6], [0, rotY, 0]);
    }));
    x += widths[i] * px + px;
  });
}

export function buildRange(scene, world) {
  const pal = E.archPalette();
  const M = {
    dirt: new E.Material({ name: 'Range dirt', color: '#9c8462', roughness: 0.95, pattern: 'dirt', patternScale: 1.6, patternColor: '#6d5a40' }),
    gravel: new E.Material({ name: 'Gravel', color: '#857d70', roughness: 0.95, pattern: 'dirt', patternScale: 5, patternColor: '#6f685f' }),
    berm: new E.Material({ name: 'Berm', color: '#8a7454', roughness: 1, pattern: 'dirt', patternScale: 0.8, patternColor: '#5d4b33' }),
    concrete: new E.Material({ name: 'Concrete', color: '#96918a', roughness: 0.9, pattern: 'stucco', patternScale: 2, patternColor: '#8d877c' }),
    cardboard: new E.Material({ name: 'Cardboard', color: '#b7935f', roughness: 0.95, pattern: 'fabric', patternScale: 40, patternStrength: 0.3 }),
    paper: new E.Material({ name: 'Paper', color: '#ece6d6', roughness: 0.95 }),
    ink: new E.Material({ name: 'Ink', color: '#1b1b1b', roughness: 0.9 }),
    red: new E.Material({ name: 'Bull', color: '#c0271c', roughness: 0.8 }),
    steel: new E.Material({ name: 'Target steel', color: '#d6d2c6', metallic: 0.5, roughness: 0.4 }),
    steelOrange: new E.Material({ name: 'Orange steel', color: '#e0662a', metallic: 0.3, roughness: 0.5 }),
    frame: new E.Material({ name: 'Frame', color: '#3c3f41', metallic: 0.8, roughness: 0.5, pattern: 'metal', patternScale: 2 }),
    sandbag: new E.Material({ name: 'Sandbag', color: '#a38d64', roughness: 0.95, pattern: 'fabric', patternScale: 120 }),
    sign: new E.Material({ name: 'Sign', color: '#f2efe6', roughness: 0.7 }),
    signText: new E.Material({ name: 'Sign text', color: '#1c1c1c', roughness: 0.7 }),
    flag: new E.Material({ name: 'Flag', color: '#d0251b', roughness: 0.9, doubleSided: true }),
    glass: new E.Material({ name: 'Bottle glass', color: '#2f6b3a', roughness: 0.06, metallic: 0.2 }),
    amber: new E.Material({ name: 'Amber glass', color: '#8a4a12', roughness: 0.06, metallic: 0.2 }),
    tin: new E.Material({ name: 'Tin', color: '#b8b8bc', metallic: 0.9, roughness: 0.3 }),
    label: new E.Material({ name: 'Label', color: '#1f5fa8', roughness: 0.5 }),
    crate: pal.darkWood, wood: pal.deck, post: pal.darkWood, tin2: pal.tin,
  };
  const staticBox = (center, size, kind = 'static', extra = {}) => {
    const b = world.add(new E.Body({ shape: new E.Box(size.map((s) => s / 2)), type: 'static', position: center, ...extra }));
    b.userData.kind = kind; return b;
  };
  const kit = new E.Kit(pal);

  // ---- ground: dirt everywhere, a gravel strip down the lanes
  world.add(new E.Body({ shape: new E.Plane(), friction: 0.8 })).userData.kind = 'ground';
  const ground = new E.Mesh(E.plane({ width: 700, depth: 700 }), M.dirt, 'Ground'); ground.castShadow = false; scene.add(ground);
  kit.box(M.gravel, [0, 0.005, 110], [26, 0.01, 220]);

  // ---- earth berms along both sides and behind the targets
  for (const s of [-1, 1]) {
    for (let z = 0; z < 230; z += 20) kit.box(M.berm, [s * 16, 1.2, z + 10], [6, 3.6, 20.4], [0, 0, s * 28], 0.4);
    staticBox([s * 16.5, 1.5, 115], [3, 3, 230], 'berm');
  }
  kit.box(M.berm, [0, 3, 232], [40, 8, 8], [-24, 0, 0], 0.5);
  staticBox([0, 3, 232], [40, 6, 6], 'berm');

  // ---- firing line: a slab, a roof on posts, three shooting counters
  kit.box(M.concrete, [0, 0.05, -2], [18, 0.1, 7]);
  staticBox([0, 0.05, -2], [18, 0.1, 7], 'concrete');
  for (const x of [-8.6, -2.9, 2.9, 8.6]) for (const z of [-5.2, 1.1]) { kit.box(M.post, [x, 1.55, z], [0.18, 3.1, 0.18]); staticBox([x, 1.55, z], [0.18, 3.1, 0.18], 'wood'); }
  kit.box(M.post, [0, 3.14, 1.1], [17.6, 0.16, 0.2]);
  kit.box(M.post, [0, 3.14, -5.2], [17.6, 0.16, 0.2]);
  kit.box(pal.tin, [0, 3.3, -2.05], [18.4, 0.05, 7.2], [-4, 0, 0]);
  for (const x of [-5.7, 0, 5.7]) {
    kit.box(M.wood, [x, 0.9, 0.55], [3.2, 0.07, 0.62], [0, 0, 0], 0.01);
    for (const dx of [-1.45, 1.45]) kit.box(M.post, [x + dx, 0.45, 0.55], [0.1, 0.8, 0.5]);
    staticBox([x, 0.47, 0.55], [3.2, 0.94, 0.62], 'wood');
  }
  // lane dividers (short posts with a rail) running a few metres downrange
  for (const x of [-8.6, -2.9, 2.9, 8.6]) { kit.box(M.post, [x, 0.55, 4], [0.1, 1.1, 0.1]); kit.box(M.post, [x, 1.05, 2.6], [0.06, 0.06, 3]); }
  // sandbags at the ends of the line
  for (const x of [-8.2, 8.2]) for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) kit.shape(M.sandbag, { type: 'superquadric', rx: 0.3, ry: 0.1, rz: 0.18, e1: 0.4, e2: 0.5, widthSegments: 14, heightSegments: 8, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180, taperTop: 1, taperBottom: 1 }, [], [x + (j - (2 - i) / 2) * 0.62, 0.2 + i * 0.19, -4.4], [0, 0, 0]);
  // range flag
  kit.cyl(M.frame, [9.6, 3, -4.6], 0.04, 6);
  kit.shape(M.flag, { type: 'plane', width: 1.1, depth: 0.7, subdivisions: 4 }, [{ type: 'wave', axis: 'y', along: 'x', amplitude: 0.06, frequency: 2, phase: 0 }], [10.18, 5.6, -4.6], [90, 0, 0]);

  // ---- distance boards
  const boards = [[10, -5.5], [25, -5.5], [50, 6], [100, -6], [150, 6], [200, -6]];
  for (const [d, x] of boards) {
    kit.box(M.post, [x, 0.7, d], [0.08, 1.4, 0.08]);
    kit.box(M.sign, [x, 1.55, d], [1.1, 0.55, 0.04]);
    pixelText(kit, M.signText, `${d}M`, [x, 1.55, d - 0.035], 0.3);
  }
  const node = kit.toNode('Range');
  scene.add(node);

  // ---- targets
  const targets = [];
  const dynamic = new E.Node('Targets'); scene.add(dynamic);
  const add = (n) => { dynamic.add(n); return n; };
  const disc = (r, mat, z) => { const m = new E.Mesh(E.cylinder({ radiusTop: r, radiusBottom: r, height: 0.001, radialSegments: 40, capTop: true, capBottom: false }), mat, 'Ring'); m.setEuler(-90, 0, 0); m.position.set([0, 0, z]); m.castShadow = false; return m; };

  // paper bullseyes on stands, facing the firing line (-Z)
  function bullseye(pos, size = 1) {
    const g = new E.Node('Bullseye'); g.position.set(pos);
    const board = new E.Mesh(E.box({ width: 0.9 * size, height: 0.9 * size, depth: 0.02 }), M.cardboard, 'Board'); g.add(board);
    const rings = [[0.42, M.paper], [0.34, M.ink], [0.3, M.paper], [0.22, M.ink], [0.18, M.paper], [0.1, M.ink], [0.06, M.red]];
    rings.forEach(([r, mat], i) => g.add(disc(r * size, mat, -0.013 - i * 0.006)));
    for (const s of [-1, 1]) { const leg = new E.Mesh(E.box({ width: 0.06, height: pos[1] + 0.2, depth: 0.06 }), M.post, 'Leg'); leg.position.set([s * 0.4 * size, -(pos[1] + 0.2) / 2 + 0.25, 0.04]); g.add(leg); }
    add(g);
    const b = staticBox(pos, [0.9 * size, 0.9 * size, 0.04], 'paper');
    b.userData.center = [...pos]; b.userData.size = size; b.userData.dist = Math.round(pos[2]);
    targets.push({ body: b, node: g });
  }
  bullseye([-1.6, 1.3, 10]);
  bullseye([1.4, 1.3, 25], 1.2);
  bullseye([0, 1.5, 50], 1.6);

  // steel plates on hinges, 15 m
  const plates = [];
  const fk = new E.Kit(pal);
  fk.box(M.frame, [6, 1.7, 15], [3.4, 0.08, 0.08]);
  for (const x of [4.3, 7.7]) { fk.box(M.frame, [x, 0.85, 15], [0.08, 1.7, 0.08]); staticBox([x, 0.85, 15], [0.08, 1.7, 0.08], 'steelframe'); }
  for (const [i, x] of [4.8, 5.5, 6.2, 6.9, 7.4].entries()) {
    const r = i % 2 ? 0.12 : 0.15;
    const mesh = add(new E.Mesh(i % 2 ? E.cylinder({ radiusTop: r, radiusBottom: r, height: 0.02, radialSegments: 24 }) : E.box({ width: r * 2, height: r * 2, depth: 0.02, bevel: 0.005 }), i % 2 ? M.steelOrange : M.steel, 'Plate'));
    if (i % 2) mesh.userData.round = true;
    const body = world.add(new E.Body({ shape: new E.Box([r, r, 0.012]), position: [x, 1.66 - 0.06 - r, 15], mass: 3, angularDamping: 0.4, allowSleep: false }));
    body.node = mesh; body.userData = { kind: 'plate', cool: 0, dist: 15 };
    if (i % 2) { body.nodeRot = [90, 0, 0]; }
    world.add(new E.HingeJoint(null, body, [x, 1.66, 15], [1, 0, 0]));
    fk.cyl(M.frame, [x, 1.63, 15], 0.008, 0.1);
    plates.push({ body, mesh });
  }
  // long-range gongs: 100 m, 150 m, 200 m
  const gong = (x, z, r) => {
    const top = 1.1 + r * 2 + 0.5;
    fk.box(M.frame, [x, top, z], [r * 2 + 0.8, 0.1, 0.1]);
    for (const s of [-1, 1]) { fk.box(M.frame, [x + s * (r + 0.4), top / 2, z], [0.1, top, 0.1]); staticBox([x + s * (r + 0.4), top / 2, z], [0.1, top, 0.1], 'steelframe'); }
    for (const s of [-1, 1]) fk.cyl(M.frame, [x + s * r * 0.5, top - 0.25, z], 0.01, 0.5);
    const mesh = add(new E.Mesh(E.cylinder({ radiusTop: r, radiusBottom: r, height: 0.025, radialSegments: 40 }), M.steelOrange, 'Gong'));
    const body = world.add(new E.Body({ shape: new E.Box([r, r, 0.015]), position: [x, top - 0.5 - r, z], mass: 20, angularDamping: 0.25, allowSleep: false }));
    body.node = mesh; body.nodeRot = [90, 0, 0]; body.userData = { kind: 'gong', cool: 0, dist: z };
    world.add(new E.HingeJoint(null, body, [x, top - 0.5, z], [1, 0, 0]));
    plates.push({ body, mesh });
  };
  gong(-4, 100, 0.35); gong(5, 150, 0.45); gong(0, 200, 0.6);
  // moving target: a steel silhouette running on a rail at 35 m
  fk.box(M.frame, [3.5, 0.3, 35.2], [12, 0.06, 0.06]);
  fk.box(pal.stone, [3.5, 0.15, 35.4], [12.4, 0.3, 0.3]);
  const mover = new E.Node('Mover'); add(mover);
  const sil = new E.Mesh(E.extrude({ outline: [[-0.25, 0], [0.25, 0], [0.25, 0.55], [0.12, 0.7], [0.1, 0.78], [0.12, 0.92], [0.0, 1.0], [-0.12, 0.92], [-0.1, 0.78], [-0.12, 0.7], [-0.25, 0.55]], depth: 0.02, bevel: 0.004 }), M.steel, 'Silhouette');
  sil.position.set([0, 0.35, 0]); mover.add(sil);
  const trolley = new E.Mesh(E.box({ width: 0.4, height: 0.12, depth: 0.12 }), M.frame, 'Trolley'); trolley.position.set([0, 0.33, 0]); mover.add(trolley);
  const moverBody = world.add(new E.Body({ shape: new E.Box([0.25, 0.5, 0.02]), type: 'kinematic', position: [0, 0.85, 35] }));
  moverBody.userData = { kind: 'mover', dist: 35, cool: 0 };
  const frameNode = fk.toNode('Steel frames'); scene.add(frameNode);

  // bottles and cans on a table at 12 m (lane 1), a crate stack at 20 m
  const tk = new E.Kit(pal);
  tk.box(M.wood, [-5.8, 0.8, 12], [3.2, 0.06, 0.8]);
  for (const dx of [-1.4, 1.4]) for (const dz of [-0.3, 0.3]) tk.box(M.post, [-5.8 + dx, 0.39, 12 + dz], [0.07, 0.78, 0.07]);
  staticBox([-5.8, 0.8, 12], [3.2, 0.06, 0.8], 'wood');
  scene.add(tk.toNode('Table'));
  const bottleGeo = E.lathe({ points: [[0, -0.11], [0.034, -0.11], [0.036, 0.02], [0.03, 0.05], [0.012, 0.08], [0.011, 0.11], [0, 0.11]], segments: 16, smooth: 1 });
  const canGeo = E.cylinder({ radiusTop: 0.033, radiusBottom: 0.033, height: 0.12, radialSegments: 16 });
  const crateGeo = E.box({ width: 0.6, height: 0.6, depth: 0.6, bevel: 0.02 });
  const loose = [];
  function spawnLoose() {
    for (const t of loose) { world.remove(t.body); dynamic.remove(t.node); }
    loose.length = 0;
    const put = (kind, geo, mat, pos, half, mass) => {
      const node = add(new E.Mesh(geo, mat, kind));
      const body = world.add(new E.Body({ shape: new E.Box(half), position: pos, mass, friction: 0.6 }));
      body.node = node; body.userData = { kind, start: [...pos], scored: false, dist: Math.round(pos[2]) };
      loose.push({ body, node });
    };
    for (let i = 0; i < 6; i++) put('bottle', bottleGeo, i % 3 === 1 ? M.amber : M.glass, [-7.1 + i * 0.5, 0.94, 11.9], [0.035, 0.11, 0.035], 0.4);
    for (let i = 0; i < 5; i++) put('can', canGeo, i % 2 ? M.tin : M.label, [-6.85 + i * 0.5, 0.895, 12.15], [0.033, 0.06, 0.033], 0.12);
    const cz = 20;
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) put('crate', crateGeo, M.crate, [-7.2 + i * 0.64 + row * 0.32, 0.3 + row * 0.61, cz], [0.3, 0.3, 0.3], 12);
  }
  spawnLoose();
  // resting plates: put them back where they hang
  function resetSteel() { for (const p of plates) { p.body.velocity = [0, 0, 0]; p.body.angularVelocity = [0, 0, 0]; } }

  let moverT = 0;
  function update(dt) {
    moverT += dt;
    const x = 3.5 + Math.sin(moverT * 0.55) * 5.2;
    moverBody.velocity = [(x - moverBody.position[0]) / Math.max(dt, 1e-4), 0, 0];
    moverBody.position = [x, 0.85, 35];
    mover.position.set([x, 0, 35]);
    // round plates and gongs are cylinders standing on edge: turn their meshes to face the line
    for (const p of plates) if (p.body.nodeRot) {
      const q = E.quat.fromEuler(E.quat.create(), ...p.body.nodeRot);
      E.quat.multiply(p.mesh.rotation, p.body.quaternion, q);
    }
    for (const p of plates) p.body.userData.cool -= dt;
    moverBody.userData.cool -= dt;
  }
  return { node, targets, plates, loose, spawnLoose, resetSteel, update, materials: M, moverBody };
}
