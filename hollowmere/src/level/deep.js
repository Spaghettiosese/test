// Places beyond the valley's edge: the mountains that ring Hollowmere, and, north of them where no
// road goes, the rooms reached only by stairs and trapdoors (the way the catacombs are): the Gray
// Hand's Rookery under the Drowned Lantern, the belfry of Ravenspire, and the Choir's Deep beneath
// the Choir Stones. Each exports where you arrive and where you leave from (B.places).
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';

const rnd = E.rng(4242);
const r = (a, b) => a + (b - a) * rnd();
const D2R = Math.PI / 180;
export const BAND_Z = 280;   // everything north of this is underground / indoors, reached by teleport
export const inBand = (z) => z > BAND_Z;

function mats(B) {
  const M = (name, o) => new E.Material({ name, ...o });
  Object.assign(B.pal, {
    mountain: M('Mountain rock', { color: '#24222b', roughness: 1, pattern: 'dirt', patternScale: 0.35, patternColor: '#121118' }),
    mountain2: M('Mountain rock 2', { color: '#2e2b33', roughness: 1, pattern: 'dirt', patternScale: 0.25, patternColor: '#17151c' }),
    snow: M('Snow', { color: '#8e8c9c', roughness: 0.9, pattern: 'dirt', patternScale: 0.6, patternColor: '#6e6c7c' }),
    caveRock: M('Cave rock', { color: '#2b2630', roughness: 1, pattern: 'dirt', patternScale: 2, patternColor: '#120f15' }),
    flesh: M('Choir flesh', { color: '#4a2a3a', roughness: 0.55, emissive: '#3a0a2a', emissiveStrength: 0.6, pattern: 'skin', patternScale: 3, patternColor: '#24101c' }),
    choirGlow: M('Choir glow', { color: '#c8a0ff', emissive: '#9a5cff', emissiveStrength: 5, roughness: 0.3 }),
    bronze: M('Bell bronze', { color: '#8a6a32', metallic: 1, roughness: 0.32, pattern: 'metal', patternScale: 3, patternColor: '#3a2a10' }),
    handCloth: M('Gray Hand cloth', { color: '#56545c', roughness: 0.95, pattern: 'fabric', patternScale: 30 }),
  });
}

// ---------------------------------------------------------------------------- the mountains
// two ranks of jagged peaks just outside the treeline, so the valley ends in mountains, not in void
function mountains(B) {
  const M = B.pal; B.useChunk('mountains'); const k = B.kit('mountains');
  const peak = (x, z, rad, h) => {
    const yaw = r(0, 360), tilt = r(-4, 4);
    k.add(rnd() < 0.5 ? M.mountain : M.mountain2, E.cone({ radius: rad, height: h, radialSegments: 5 + Math.floor(r(0, 3)), heightSegments: 2, capBottom: false }), [x, h / 2 - 2, z], [tilt, yaw, tilt * 0.5], [1, 1, r(0.8, 1.2)]);
    if (h > 46) k.add(M.snow, E.cone({ radius: rad * 0.26, height: h * 0.26, radialSegments: 5, heightSegments: 1, capBottom: false }), [x, h - 2 - h * 0.13 + 0.4, z], [tilt, yaw, tilt * 0.5], [1, 1, r(0.8, 1.2)]);
  };
  const edge = (a0, a1, fixed, axis, out) => {
    for (let a = a0; a <= a1; a += r(11, 17)) {
      for (const rank of [0, 1]) {
        const d = rank ? r(30, 46) : r(12, 24), rad = rank ? r(20, 30) : r(13, 20), h = rank ? r(48, 82) : r(26, 46);
        if (axis === 'x' && out > 0 && fixed + d + rad > BAND_Z - 10) continue;   // the north range must stay clear of the underground band
        const c = fixed + out * d; if (axis === 'x') peak(a, c, rad, h); else peak(c, a, rad, h);
      }
    }
  };
  edge(-290, 290, 199, 'x', 1); edge(-290, 290, -272, 'x', -1); edge(-272, 199, 256, 'z', 1); edge(-272, 199, -256, 'z', -1);
  // the world stops here
  B.collider(-262, 0, 198.5, 262, 30, 200, 'stone'); B.collider(-262, 0, -274, 262, 30, -272.5, 'stone');
  B.collider(255.5, 0, -274, 257, 30, 200, 'stone'); B.collider(-257, 0, -274, -255.5, 30, 200, 'stone');
  B.nav.block(-256, 197.5, 256, 199, 1);
}

// ---------------------------------------------------------------------------- shared dressing
const arches = (list) => list.map(([side, at, w = 2, h = 2.7]) => ({ side, at, w, kind: 'arch', h }));
function room(B, id, x, z, w, d, ar, extra = {}) {
  return B.house({ id, x, z, w, d, h: 3.8, wall: 'stoneDark', timber: false, zone: 2, roof: false, underground: true, floor: 'flagstone', ceilMat: 'stoneOld', noise: 1, t: 0.9, windows: [], ...extra, doors: extra.doors || arches(ar) });
}
// boulders along the walls and teeth from the ceiling: makes a box read as a cave
function caveDress(B, x0, z0, x1, z1, h, chunk, n = 14) {
  const k = B.kit(chunk), M = B.pal;
  for (let i = 0; i < n; i++) {
    const side = i % 4, t = r(0.1, 0.9), s = r(0.6, 1.4);
    const x = side === 0 ? x0 + 1.3 : side === 1 ? x1 - 1.3 : x0 + (x1 - x0) * t, z = side === 2 ? z0 + 1.3 : side === 3 ? z1 - 1.3 : z0 + (z1 - z0) * t;
    k.add(M.caveRock, E.sphere({ radius: s, widthSegments: 6, heightSegments: 4 }), [x, s * 0.35, z], [r(0, 30), r(0, 360), 0], [1, r(0.6, 1.1), r(0.8, 1.3)]);
  }
  for (let i = 0; i < n; i++) { const L = r(0.5, 1.6); k.add(M.caveRock, E.cone({ radius: r(0.15, 0.4), height: L, radialSegments: 5, heightSegments: 1 }), [r(x0 + 1.5, x1 - 1.5), h - L / 2, r(z0 + 1.5, z1 - 1.5)], [180, r(0, 360), 0]); }
}

// ---------------------------------------------------------------------------- the Rookery
// the Gray Hand's house under the Drowned Lantern: a smugglers' cellar, a counting room, a bunk hall,
// an underground dock with a boat out to the lake, Vane's hall, and Sable's study
function rookery(B) {
  const M = B.pal, P = (B.places ||= {});
  const R1 = room(B, 'rook_cellar', -224, 296, 12, 10, [['E', 5]], { wall: 'stoneOld' });
  room(B, 'rook_c1', -213, 299, 9, 4, [['W', 2], ['E', 2]]);
  const R2 = room(B, 'rook_count', -205, 294, 14, 14, [['W', 7], ['N', 7], ['E', 7]], { floor: 'floorWood', noise: 2 });
  const R3 = room(B, 'rook_bunks', -207, 307, 18, 11, [['S', 9], ['E', 5]], { floor: 'floorWood', noise: 2 });
  const R4 = room(B, 'rook_dock', -190, 308, 20, 16, [['W', 4]], { h: 5 });
  room(B, 'rook_c2', -192, 299, 8, 4, [['W', 2], ['E', 2]]);
  const R5 = room(B, 'rook_hall', -185, 292, 16, 16, [['W', 9]], { h: 5, doors: [...arches([['W', 9]]), { side: 'E', at: 9, w: 1.6, id: 'rook_study_door', locked: true, keyId: 'vanekey', lockLevel: 4, name: 'study door', h: 2.6 }] });
  const R6 = room(B, 'rook_study', -170, 296, 12, 10, [['W', 5]], { floor: 'floorWood', noise: 2 });
  void R6;
  B.useChunk('rookery'); const K = B.kit('rookery');
  // R1: the cellar, where the trapdoor comes down
  P.rookIn = { pos: [-218.5, 0.1, 301], yaw: Math.PI / 2, area: 'The Rookery' };
  P.rookUp = [-222.6, 298.2];
  B.stairs({ x: -222.6, z: 297.4, dir: 'S', w: 1.4, steps: 3, rise: 0.25, run: 0.45, mat: 'plank', chunk: 'rookery' });
  for (let i = 0; i < 9; i++) B.prop(i % 3 ? 'barrel' : 'crate', -223 + (i % 3) * 0.9, 0, 303.4 + Math.floor(i / 3) * 0.9, { yaw: r(0, 40) });
  B.searchSpot(-214, 0.9, 304.4, { name: 'smuggled salt', loot: [['gold', 18], ['wine', 1]], id: 'rook_salt' });
  B.searchSpot(-214, 0.9, 297.4, { name: 'bundle of gray cloaks', loot: [['uni_hand', 1]], id: 'rook_cloaks', verb: 'Search the' });
  B.torch(-212.9, 2.4, 299.2, { dir: [-1, 0], chunk: 'rookery', range: 8, intensity: 7 });
  B.poi('rook_cellar_a', -207.5, 301.6, { yaw: 90, type: 'stand' });   // the cellar's watchman keeps his eyes on the corridor ahead, not behind
  // R2: the counting room
  B.table(-201, 300, 3.2, 1.2, { chunk: 'rookery' }); B.table(-195, 304, 2.2, 1.0, { chunk: 'rookery' });
  B.chair(-201, 301.2, 180, { name: 'rook_seat_a', chunk: 'rookery' }); B.chair(-195, 305.1, 180, { name: 'rook_seat_b', chunk: 'rookery' });
  B.candle(-201.6, 0.85, 300, { chunk: 'rookery' }); B.candle(-195, 0.85, 304, { chunk: 'rookery' });
  B.shelf(-204.2, 297, { dir: 90, w: 2.4, chunk: 'rookery', loot: [['book', 1]], name: 'account books' });
  B.chest(-192.3, 296.2, { dir: 270, name: 'Gray Hand coffer', loot: [['gold', 120], ['gem', 1]], locked: true, lockLevel: 3, id: 'rook_coffer', chunk: 'rookery', w: 1.0, d: 0.6, gold: true });
  B.interactables.push({ kind: 'note', x: -200.2, y: 0.95, z: 300, r: 2.2, obj: { id: 'rook_accounts' }, prompt: () => 'Read the accounts', use: (g) => g.readNote('rook_accounts') });
  B.torch(-204.1, 2.4, 304, { dir: [1, 0], chunk: 'rookery', range: 9, intensity: 8 }); B.torch(-191.9, 2.4, 297, { dir: [-1, 0], chunk: 'rookery', range: 9, intensity: 8 });
  B.poi('rook_count_a', -199, 298, { yaw: 0, type: 'stand' }); B.route('rook_count_beat', [[-202, 296.5], [-193.5, 296.5], [-193.5, 306], [-202, 306]]);
  // R3: the bunk hall
  for (let i = 0; i < 6; i++) B.bed(-205.6 + (i % 3) * 3.0, 316.6 - Math.floor(i / 3) * 0.0, { dir: 180, id: 'bed_rook_' + i, chunk: 'rookery', w: 0.95 });
  B.table(-195, 312.6, 2.4, 1.2, { chunk: 'rookery' }); B.candle(-195, 0.85, 312.6, { chunk: 'rookery' });
  for (const [x, z, yaw] of [[-196.3, 312.6, 90], [-193.7, 312.6, 270]]) B.chair(x, z, yaw, { name: 'rook_dice_' + Math.round(x), chunk: 'rookery' });
  B.torch(-206.1, 2.4, 312, { dir: [1, 0], chunk: 'rookery', range: 9, intensity: 6 });
  B.chest(-190.5, 316.8, { dir: 270, name: 'Footlocker', loot: [['knife', 4], ['smoke', 1], ['poison', 1]], locked: true, lockLevel: 2, chunk: 'rookery', w: 0.9, d: 0.55 });
  B.poi('rook_dice', -195, 311.2, { yaw: 0, type: 'stand' });
  // R4: the dock: black water along the north wall, a boat that knows the way out
  const water = new E.Material({ name: 'Dock water', color: '#0e1a22', roughness: 0.04, metallic: 0.5 });
  K.box(water, [-180, 0.02, 321], [18, 0.04, 5]); B.nav.block(-189, 318.6, -171, 323.5, 1); B.collider(-189, -1, 318.6, -171, 0.4, 323.5, 'stone');
  for (let x = -188; x <= -172; x += 4) B.pillar(x, 318.2, { r: 0.18, h: 1.1, mat: 'timber', chunk: 'rookery' });
  K.box(M.plank, [-180, 0.22, 317.4], [18, 0.08, 1.8]);
  K.box(M.plank, [-176, 0.25, 321], [4.6, 0.3, 1.6]); K.box(M.timber, [-176, 0.55, 320.2], [4.4, 0.3, 0.1]); K.box(M.timber, [-176, 0.55, 321.8], [4.4, 0.3, 0.1]);
  P.rookBoat = [-176, 319.4];
  for (let i = 0; i < 6; i++) B.prop('crate', -188 + i * 1.1, 0, 309.6, { yaw: r(0, 20) });
  B.searchSpot(-172.6, 0.9, 310.4, { name: 'contraband', loot: [['gold', 30], ['d_ghost', 1]], id: 'rook_contraband' });
  B.torch(-189.1, 2.6, 313, { dir: [1, 0], chunk: 'rookery', range: 11, intensity: 8 }); B.torch(-170.9, 2.6, 313, { dir: [-1, 0], chunk: 'rookery', range: 11, intensity: 8 });
  caveDress(B, -190, 308, -170, 318, 5, 'rookery', 8);
  B.poi('rook_dock_a', -182, 316.4, { yaw: 0, type: 'stand' }); B.route('rook_dock_beat', [[-187, 313], [-173, 313], [-173, 316], [-187, 316]]);
  // R5: Vane's hall
  for (const [px, pz] of [[-180, 297], [-174, 297], [-180, 303], [-174, 303]]) B.pillar(px, pz, { r: 0.45, h: 5, mat: 'stoneOld', chunk: 'rookery' });
  for (const [x, z] of [[-183.3, 294], [-170.7, 294], [-183.3, 306], [-170.7, 306]]) B.hearth(x, 0, z, { r: 0.3, range: 9, intensity: 8, chunk: 'rookery', fuel: false });
  for (let i = 0; i < 3; i++) K.box(M.timber, [-177 + i * 1.6, 0.9, 306.4], [0.08, 1.8, 0.08]);
  B.banner(-177, 3.0, 307.4, { dir: 180, w: 1.6, h: 2.6, mat: 'blackCloth', emblem: true });
  P.vaneAt = [-177, 300]; B.poi('rook_vane', -177, 300, { yaw: 270, type: 'stand' });
  // R6: Sable's study
  B.table(-164, 301, 2.4, 1.2, { chunk: 'rookery', cloth: 'crimson' }); B.chair(-164, 302.2, 180, { name: 'rook_sable_seat', chunk: 'rookery' });
  B.candle(-164.8, 0.85, 301, { chunk: 'rookery' }); B.candle(-163.2, 0.85, 301.2, { chunk: 'rookery' });
  B.shelf(-159.2, 300, { dir: 270, w: 3, chunk: 'rookery', loot: [['book', 2]], name: 'Sable\'s books' });
  B.chest(-160.4, 304.6, { dir: 180, name: 'Sable\'s strongbox', loot: [['gold', 180], ['gem', 2], ['handring', 1]], locked: true, lockLevel: 3, id: 'rook_sable_chest', chunk: 'rookery', w: 1.0, d: 0.6, gold: true });
  B.interactables.push({ kind: 'note', x: -164, y: 0.95, z: 300.6, r: 2.4, obj: { id: 'sable_ledger' }, prompt: () => 'Read Sable\'s ledger', use: (g) => g.campaign.parts.c2.readLedger() });
  B.rug(-164, 300.6, 4, 3, 'rug'); B.torch(-169.1, 2.4, 304, { dir: [1, 0], chunk: 'rookery', range: 8, intensity: 6 });
  void R1; void R2; void R3; void R4; void R5;
}

// ---------------------------------------------------------------------------- the belfry
// the bell of Ravenspire hangs in the keep's north-east tower: two flights of stairs up to a gallery
function belfry(B) {
  const M = B.pal, P = (B.places ||= {}), X = -142, Z = 294, W = 12, D = 12, H = 13;
  B.house({ id: 'belfry', x: X, z: Z, w: W, d: D, h: H, wall: 'stoneWall', timber: false, zone: 2, roof: false, underground: true, floor: 'flagstone', ceilMat: 'timber', noise: 1, t: 0.9, windows: [], doors: [] });
  B.useChunk('belfry'); const K = B.kit('belfry');
  B.stairs({ x: -141, z: 296, dir: 'E', w: 1.8, steps: 13, rise: 0.3, run: 0.55, mat: 'plank', chunk: 'belfry' });
  B.solid('stoneWall', -133.85, 0, 295.05, -130.95, 3.9, 297.05, { chunk: 'belfry' }); B.nav.setHeight(-133.85, 295.05, -130.95, 297.05, 3.9); B.nav.clear(-133.85, 295.05, -130.95, 297.05);
  B.stairs({ x: -132, z: 297.05, dir: 'N', w: 1.8, steps: 9, rise: 0.3, run: 0.55, y: 3.9, mat: 'plank', chunk: 'belfry' });
  B.solid('stoneWall', -141.05, 0, 302.0, -130.95, 6.6, 305.05, { chunk: 'belfry' });
  K.box(M.timber, [-136, 6.75, 301.9], [10, 0.12, 0.12]);   // gallery lip
  for (let x = -140.5; x <= -131.5; x += 1.5) K.box(M.timber, [x, 7.2, 302.05], [0.07, 0.9, 0.07]);
  K.box(M.timber, [-136, 7.62, 302.05], [10, 0.07, 0.07]);
  // the bell, its beam and its rope
  K.box(M.timber, [-136, 11.6, 299.5], [11.6, 0.35, 0.35]);
  K.add(M.bronze, E.lathe({ points: [[0, 0], [0.62, 0], [0.78, -0.06], [0.74, -0.2], [0.5, -0.5], [0.42, -1.3], [0.32, -1.6], [0, -1.62]], segments: 18, arc: 360, smooth: 1 }), [-136, 9.9, 299.5], [180, 0, 0]);
  K.cyl(M.iron, [-136, 11.1, 299.5], 0.08, 0.9, [0, 0, 0], 6);
  K.cyl(M.rope, [-136, 4.2, 299.5], 0.03, 7.5, [0, 0, 0], 5);
  P.bellAt = [-136, 8.4, 299.5];
  B.torch(-141.1, 2.5, 300, { dir: [1, 0], chunk: 'belfry', range: 9, intensity: 7 }); B.torch(-130.9, 8.6, 300, { dir: [-1, 0], chunk: 'belfry', range: 10, intensity: 7 });
  B.torch(-136, 8.6, 304.9, { dir: [0, -1], chunk: 'belfry', range: 10, intensity: 7 });
  for (let i = 0; i < 4; i++) B.prop(i % 2 ? 'barrel' : 'crate', -140 + i * 0.9, 0, 300.8, { yaw: r(0, 30) });
  P.belfryIn = { pos: [-139.6, 0.1, 299.2], yaw: Math.PI / 2, area: 'The Belfry of Ravenspire' };
  P.belfryOut = [-140.6, 299.2];
  B.poi('belfry_floor', -137, 299, { yaw: 0, type: 'stand' }); B.poi('belfry_floor_b', -134, 300.4, { yaw: 270, type: 'stand' });
}

// ---------------------------------------------------------------------------- the Choir's Deep
// the throat that opens under the Choir Stones, the hall where the dead sing, and the Choir itself
function deep(B) {
  const M = B.pal, P = (B.places ||= {});
  const cave = { wall: 'stoneDark', floor: 'flagstone' };
  room(B, 'deep_throat', -40, 290, 8, 44, [['N', 4, 2.6, 3.4]], { ...cave, h: 6 });
  room(B, 'deep_hall', -48, 333, 40, 26, [['S', 12, 2.6, 3.4], ['E', 13, 2.6, 3.4]], { ...cave, h: 8 });
  room(B, 'deep_c3', -9, 343, 14, 6, [['W', 3, 2.6, 3.4], ['E', 3, 2.6, 3.4]], { ...cave, h: 5 });
  room(B, 'deep_choir', 4, 322, 50, 50, [['W', 24, 2.6, 3.4]], { ...cave, h: 18, ceilMat: 'stoneDark' });
  B.useChunk('deep'); const K = B.kit('deep');
  caveDress(B, -40, 290, -32, 334, 6, 'deep', 22); caveDress(B, -48, 333, -8, 359, 8, 'deep', 30);
  P.deepIn = { pos: [-36, 0.1, 293.5], yaw: 0, area: 'The Choir\'s Deep' };
  P.deepOut = [-36, 291.4];
  // the throat: bones and violet light, descending in the mind if not in the floor
  for (let i = 0; i < 40; i++) K.add(M.bone, E.sphere({ radius: r(0.06, 0.12), widthSegments: 5, heightSegments: 4 }), [r(-39, -33), 0.08, r(296, 332)]);
  for (const z of [300, 312, 324]) { const l = new E.Light('point', { color: '#8f5cff', intensity: 6, range: 10, flicker: 0.3 }); l.position.set([-36 + (z % 7 ? 2.2 : -2.2), 2.2, z]); B.decor.add(l); B.lights.push(l); }
  B.torch(-39.1, 2.4, 296, { dir: [1, 0], chunk: 'deep', range: 8, intensity: 5, color: '#a070ff', name: 'violet torch' });
  // the hall of voices: pillars like throats, bone heaps
  for (const [px, pz] of [[-40, 340], [-28, 340], [-16, 340], [-40, 352], [-28, 352], [-16, 352]]) { B.pillar(px, pz, { r: 0.8, h: 8, mat: 'stoneDark', chunk: 'deep' }); K.add(M.choirGlow, E.torus({ radius: 0.85, tube: 0.06, radialSegments: 5, tubularSegments: 16 }), [px, 2.2, pz], [0, 0, 0]); }
  for (let i = 0; i < 9; i++) { const x = r(-45, -11), z = r(336, 356); K.add(M.bone, E.cone({ radius: r(0.6, 1.2), height: r(0.4, 0.9), radialSegments: 7, heightSegments: 1 }), [x, 0.3, z]); }
  for (const [x, z] of [[-34, 346], [-22, 346]]) { const l = new E.Light('point', { color: '#9a5cff', intensity: 9, range: 14, flicker: 0.35 }); l.position.set([x, 4, z]); B.decor.add(l); B.lights.push(l); }
  B.searchSpot(-46, 0.6, 357, { name: 'pilgrim\'s bones', loot: [['potion', 2], ['ember', 1], ['gold', 40]], id: 'deep_pilgrim' });
  B.poi('deep_hall_a', -28, 346, { yaw: 180, type: 'stand' }); B.poi('deep_hall_b', -12, 350, { yaw: 270, type: 'stand' });
  // the choir: a round arena around the pit
  const cx = 29, cz = 347, R = 21.5; P.choir = { x: cx, z: cz, R, pit: 5.5 };
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2, x = cx + Math.cos(a) * (R + 1.2), z = cz + Math.sin(a) * (R + 1.2);
    if (Math.abs(a - Math.PI) < 0.09) continue;   // the way in, from the west
    K.box(M.caveRock, [x, 7, z], [2.6, 14, 2.6], [r(-3, 3), -a / D2R, r(-3, 3)]); B.collider(x - 1.2, 0, z - 1.2, x + 1.2, 14, z + 1.2, 'stone');
  }
  for (let gx = 5; gx < 54; gx++) for (let gz = 323; gz < 372; gz++) { const d = Math.hypot(gx + 0.5 - cx, gz + 0.5 - cz); if (d > R + 0.4 && !(gx < 12 && Math.abs(gz + 0.5 - cz) < 1.6)) B.nav.block(gx, gz, gx + 1, gz + 1, 1); }
  for (let x = 5; x < 9; x++) for (const z of [cz - 1.5, cz + 1.5]) B.collider(x, 0, z - 0.25, x + 1, 6, z + 0.25, 'stone');
  K.add(M.blackCloth, E.cylinder({ radiusTop: P.choir.pit, radiusBottom: P.choir.pit, height: 0.05, radialSegments: 28, heightSegments: 1, capTop: true, capBottom: false, arc: 360 }), [cx, 0.03, cz]);
  K.add(M.caveRock, E.torus({ radius: P.choir.pit + 0.4, tube: 0.45, radialSegments: 6, tubularSegments: 32 }), [cx, 0.12, cz], [0, 0, 0]);
  for (let gx = Math.floor(cx - 6); gx < cx + 6; gx++) for (let gz = Math.floor(cz - 6); gz < cz + 6; gz++) if (Math.hypot(gx + 0.5 - cx, gz + 0.5 - cz) < P.choir.pit - 0.2) B.nav.block(gx, gz, gx + 1, gz + 1, 1);
  B.collider(cx - 4, -2, cz - 4, cx + 4, 0.9, cz + 4, 'stone');   // the pit's lip keeps you out of it
  for (let i = 0; i < 18; i++) { const a = r(0, 6.283), d = r(8, R - 2); K.add(M.caveRock, E.cone({ radius: r(0.3, 0.7), height: r(1.5, 4), radialSegments: 5, heightSegments: 1 }), [cx + Math.cos(a) * d, 18 - 1.4, cz + Math.sin(a) * d], [180, r(0, 360), 0]); }
  const glow = new E.Light('point', { color: '#9a5cff', intensity: 18, range: 30, flicker: 0.25 }); glow.position.set([cx, 3.5, cz]); B.decor.add(glow); B.lights.push(glow); P.choirLight = glow;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.3; B.torch(cx + Math.cos(a) * (R - 0.6), 3, cz + Math.sin(a) * (R - 0.6), { dir: [-Math.cos(a), -Math.sin(a)], chunk: 'deep', range: 10, intensity: 6, color: '#a070ff', name: 'violet torch' }); }
  P.choirIn = [cx - R + 2, cz];
}

export function buildDeepLevels(B) {
  mats(B);
  mountains(B);
  rookery(B);
  belfry(B);
  deep(B);
}
