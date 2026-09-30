// Ravenspire: the curtain wall and gatehouse, the courtyard with its barracks, stables and training
// yard, and the keep itself (great hall, kitchen, armory, the Duke's study and bedchamber).
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';

const rnd = E.rng(4242);
const r = (a, b) => a + (b - a) * rnd();

function brazier(B, x, z, chunk = 'court') {
  const k = B.kit(chunk);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; k.cyl(B.pal.iron, [x + Math.cos(a) * 0.22, 0.5, z + Math.sin(a) * 0.22], 0.025, 1.0, [Math.sin(a) * 10, 0, -Math.cos(a) * 10], 4); }
  k.add(B.pal.iron, E.cylinder({ radiusTop: 0.42, radiusBottom: 0.26, height: 0.28, radialSegments: 10, heightSegments: 1, capTop: false }), [x, 1.05, z]);
  const f = B.hearth(x, 1.05, z, { r: 0.28, stone: false, range: 15, intensity: 17, chunk, fuel: false });
  B.collider(x - 0.3, 0, z - 0.3, x + 0.3, 1.1, z + 0.3, 'iron'); B.nav.block(x - 0.35, z - 0.35, x + 0.35, z + 0.35, 1);
  return f;
}
function portcullis(B, x, z, w, h, chunk) {
  const node = new E.Node('Portcullis'), k = new E.Kit(B.pal);
  for (let i = 0; i <= Math.round(w / 0.4); i++) k.box(B.pal.iron, [-w / 2 + i * 0.4, h / 2, 0], [0.08, h, 0.08]);
  for (let j = 0; j < 9; j++) k.box(B.pal.iron, [0, 0.25 + j * (h - 0.4) / 8, 0], [w, 0.09, 0.09]);
  for (let i = 0; i <= Math.round(w / 0.4); i++) k.cone && 0;
  node.add(k.toNode('Portcullis')); node.position.set([x, 0, z]); B.decor.add(node);
  const part = new E.Part(node, { type: 'slide', axis: [0, 1, 0], min: 0, max: h + 0.4, stiffness: 20, damping: 9 });
  const body = new E.Body({ shape: new E.Box([w / 2, h / 2, 0.15]), type: 'static', position: [x, h / 2, z] }); body.userData.kind = 'iron'; B.world.add(body);
  const p = { part, body, x, z, w, h, closed: true, node };
  p.set = (up) => { part.set(up ? h + 0.4 : 0); p.closed = !up; };
  B.portcullis = p;
  return p;
}

export function buildKeepWalls(B) {
  const T = 2, H = 6.6, ch = 'keepwall';
  const seg = (a, b, c, axis = 'x', extra = {}) => B.wall({ axis, a, b, c, h: H, t: T, mat: 'stoneWall', chunk: ch, cap: 'stoneWall', navT: T, ...extra });
  seg(-48, -8, 93, 'x', { capOff: 0.8 }); seg(8, 48, 93, 'x', { capOff: -0.8 });
  seg(93, 153, -36, 'z', { capOff: -0.8 }); seg(93, 153, 36, 'z', { capOff: 0.8 }); seg(-36, 36, 153, 'x', { capOff: 0.8 });
  for (const [x, z] of [[-36, 93], [36, 93], [-36, 153], [36, 153]]) B.roundTower({ x, z, r: 4.2, h: 13, mat: 'stoneWall', roof: 'roofSlate', chunk: ch, crenel: false, cone: true });
  // gatehouse towers & lintel
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -8 : 3, x1 = sx < 0 ? -3 : 8;
    B.solid('stoneWall', x0, 0, 90.5, x1, 13, 97.5, { chunk: ch });
    B.gableRoof({ x0: x0 - 0.3, z0: 90.2, x1: x1 + 0.3, z1: 97.8, y: 13, rise: 3.6, mat: 'roofSlate', chunk: ch, ridge: 'z' });
    B.torch(sx * 3.3, 3.6, 90.3, { dir: [0, -1], chunk: ch, range: 14, intensity: 13, name: 'keep gate torch' });
    B.torch(sx * 3.3, 3.6, 97.7, { dir: [0, 1], chunk: ch, range: 14, intensity: 13, name: 'keep gate torch' });
  }
  B.solid('stoneWall', -3, 6, 90.5, 3, 13, 97.5, { chunk: ch, nav: false });
  B.crenels('x', -7.8, 7.8, 90.6, 13, 0.6, 'stoneWall');
  B.ground('cobble', -3, 90, 3, 98, 0.0, 0.05, { chunk: 'street', noise: 1 });
  portcullis(B, 0, 94, 6, 5.6, ch);
  B.poi('keepgate_l', -2.2, 89.2, { yaw: 0, type: 'stand' }); B.poi('keepgate_r', 2.2, 89.2, { yaw: 0, type: 'stand' });
  B.poi('keepgate_in_l', -2.2, 99, { yaw: 180, type: 'stand' }); B.poi('keepgate_in_r', 2.2, 99, { yaw: 180, type: 'stand' });
  // the top of the curtain wall is a walkway (y = 6.6)
  B.route('rampart_north', [[-30, 153], [30, 153]], false);
  B.route('rampart_west', [[-36, 100], [-36, 146]], false);
  B.route('rampart_east', [[36, 146], [36, 100]], false);
  // stairs up to the walk (inside the west wall & east wall near the gate)
  B.stairs({ x: -34.3, z: 96, dir: 'N', w: 1.4, steps: 22, rise: 0.3, run: 0.4, mat: 'stoneWall', chunk: ch });
  B.stairs({ x: 34.3, z: 96, dir: 'N', w: 1.4, steps: 22, rise: 0.3, run: 0.4, mat: 'stoneWall', chunk: ch });
}

export function buildCourtyard(B) {
  B.useChunk('court');
  B.ground('cobble', -35, 94, 35, 152, 0.0, 0.05, { chunk: 'court', noise: 1 });
  B.nav.setZone(-35, 94, 35, 152, 1);
  // the barracks
  let b = B.house({ id: 'barracks', x: -35, z: 97, w: 13, d: 15, h: 4.6, wall: 'stoneDark', timber: false, zone: 2, door: { side: 'E', at: 7, w: 1.8, id: 'barracks_door' }, windows: [{ side: 'S', at: 4 }, { side: 'S', at: 10 }, { side: 'N', at: 6 }, { side: 'W', at: 7 }], roofMat: 'roofSlate', noise: 2 });
  for (let i = 0; i < 8; i++) B.bed(-33.4 + (i % 4) * 2.7, i < 4 ? 99.4 : 108.6, { dir: i < 4 ? 0 : 180, id: 'bed_bar_' + i, chunk: b.chunk });
  B.table(-28.5, 104, 3.2, 1.2, { chunk: b.chunk }); for (const [cx, cz, d] of [[-29.5, 105.1, 180], [-27.5, 105.1, 180], [-29.5, 102.9, 0], [-27.5, 102.9, 0]]) B.chair(cx, cz, d, { name: 'bar_seat_' + Math.abs(Math.round(cx * 2)) + '_' + (d ? 1 : 0), chunk: b.chunk });
  B.candle(-28.5, 0.85, 104, { chunk: b.chunk }); B.prop('mug', -29, 0.85, 104.2); B.prop('mug', -28, 0.85, 103.8); B.prop('bread', -28.6, 0.85, 104.4);
  B.chest(-34.3, 104, { dir: 90, loot: [['sword', 1], ['potion', 2], ['gold', 26]], locked: false, name: 'Armour chest', id: 'barracks_chest', chunk: b.chunk, w: 1.1, d: 0.6 });
  B.chest(-34.3, 106.6, { dir: 90, loot: [['chamberkey', 1], ['gold', 40]], locked: true, lockLevel: 2, name: "Sergeant's lockbox", id: 'barracks_box', chunk: b.chunk, w: 0.9, d: 0.55 });
  B.torch(-23.9, 2.6, 100, { dir: [-1, 0], chunk: b.chunk, range: 9, intensity: 8 }); B.torch(-34.1, 2.6, 104, { dir: [1, 0], chunk: b.chunk, range: 9, intensity: 6 });
  B.poi('bar_door', -24.4, 104, { yaw: 90, type: 'stand' });
  // stables
  b = B.house({ id: 'keep_stables', x: 24, z: 97, w: 11, d: 12, h: 4.2, wall: 'plank', timber: false, zone: 1, door: { side: 'W', at: 6, w: 2.4, kind: 'arch', h: 3 }, windows: [{ side: 'N', at: 5, w: 0.8 }], roofMat: 'roofThatch', floor: 'dirt', noise: 0 });
  for (let i = 0; i < 5; i++) B.prop('hay', 27 + i * 1.5, 0, 108, { yaw: r(-10, 10) }); B.prop('bucket', 26, 0, 99); B.torch(25.1, 2.4, 103, { dir: [1, 0], chunk: b.chunk, range: 8, intensity: 7 });
  // training yard on the east side: dummies to knock about
  for (let i = 0; i < 5; i++) B.prop('dummy', 14 + i * 3.6, 0, 130 + (i % 2) * 2.2, { yaw: r(0, 360) });
  B.solid('plank', 12, 0, 141, 30, 0.9, 141.6, { chunk: 'court', kind: 'wood' }); // low rail
  B.chest(30.5, 121, { dir: 270, loot: [['sword', 1], ['gold', 10]], name: 'Practice weapons', chunk: 'court', w: 1.4, d: 0.5, mat: 'timber', metal: false });
  // well, cart, woodpile, braziers
  B.well(-20, 122);
  B.solid('plank', 24, 0.5, 118, 27.4, 1.0, 119.6, { chunk: 'court', kind: 'wood' });
  for (let i = 0; i < 6; i++) B.prop('barrel', 22 + (i % 3) * 0.9, 0, 148 + Math.floor(i / 3) * 0.9, { yaw: r(0, 360) });
  for (let i = 0; i < 5; i++) B.prop('crate', -28 + (i % 3) * 0.7, Math.floor(i / 3) * 0.6, 148 + (i % 2) * 0.4, { yaw: r(0, 30) });
  for (const [x, z] of [[-8, 100], [8, 100], [-8, 118], [8, 118], [-24, 132], [24, 122], [-26, 118], [26, 106], [0, 108]]) brazier(B, x, z);
  // watch beat routes
  B.route('court_beat_a', [[-12, 100], [12, 100], [12, 108], [-12, 108]]);
  B.route('court_beat_b', [[-30, 116], [-30, 144], [-14, 144], [-14, 116]]);
  B.route('court_beat_c', [[0, 96], [0, 110], [-4, 110], [4, 110]]);
  B.route('court_beat_d', [[22, 112], [30, 112], [30, 136], [22, 136]]);
  B.poi('spar_a', 26, 124, { yaw: 270, type: 'stand' }); B.poi('spar_b', 24, 124, { yaw: 90, type: 'stand' });
  B.poi('train_dummy', 17, 128, { yaw: 0, type: 'stand' });
  for (const [x, z, n] of [[-14, 105, 'court_idle_a'], [16, 116, 'court_idle_b'], [-6, 112, 'court_idle_c'], [0, 126, 'court_idle_d']]) B.poi(n, x, z, { type: 'stand' });
  // stairs toward the wall walk are already built; a sentry stands at each wall corner
  B.poi('sentry_nw', -30, 153, { type: 'sentry', y: 6.6 }); B.poi('sentry_ne', 30, 153, { type: 'sentry', y: 6.6 });
}

// ---------------------------------------------------------------- the keep proper
export function buildKeep(B) {
  const b = B.house({ id: 'keep', x: -20, z: 112, w: 40, d: 35, h: 8.4, wall: 'stoneWall', timber: false, zone: 2, t: 0.9, rise: 4.8, ridge: 'x', roofMat: 'roofSlate', noise: 1, floor: 'flagstone', ceilMat: 'stoneDark',
    door: { side: 'S', at: 20, w: 3.4, id: 'keep_door', gate: true, locked: true, keyId: 'keepkey', h: 3.8 },
    doors: [{ side: 'W', at: 7, w: 1.6, id: 'servant_door', locked: true, keyId: 'servantkey', lockLevel: 1, h: 2.5 }, { side: 'N', at: 33, w: 1.4, id: 'balcony_door', h: 2.6, locked: true, lockLevel: 1 }],
    windows: [-14, -8, 8, 14].map((at) => ({ side: 'S', at: 20 + at, w: 1.0, sill: 1.6, top: 5.2 })).concat([-14, -8, 8, 14, 0].map((at) => ({ side: 'N', at: 20 + at, w: 1.0, sill: 1.6, top: 5.2 }))).concat([{ side: 'W', at: 22, w: 1, sill: 1.6, top: 5.2 }, { side: 'W', at: 30, w: 1, sill: 1.6, top: 5.2 }, { side: 'E', at: 5, w: 1, sill: 1.6, top: 5.2 }, { side: 'E', at: 14, w: 1, sill: 1.6, top: 5.2 }, { side: 'E', at: 22, w: 1, sill: 1.6, top: 5.2 }, { side: 'E', at: 30, w: 1, sill: 1.6, top: 5.2 }]) });
  const c = b.chunk;
  const IW = 0.5, WH = 8.4;
  // ---- partitions
  const part = (o) => B.wall({ h: WH, t: 0.5, mat: 'stoneDark', chunk: c, ...o });
  // west and east wings split from the hall (z 113..133)
  part({ axis: 'z', a: 113, b: 133, c: -11.5, openings: [{ at: 6, w: 1.7, top: 2.6, kind: 'door' }, { at: 15, w: 1.7, top: 2.6, kind: 'door' }] });
  part({ axis: 'z', a: 113, b: 133, c: 11.5, openings: [{ at: 5, w: 1.7, top: 2.6, kind: 'door' }, { at: 15, w: 1.7, top: 2.6, kind: 'door' }] });
  B.door({ axis: 'z', x: -11.5, z: 119, w: 1.7, h: 2.6, hinge: 'a', id: 'kitchen_door', chunk: c }); B.door({ axis: 'z', x: -11.5, z: 128, w: 1.7, h: 2.6, hinge: 'a', id: 'pantry_door', chunk: c });
  B.door({ axis: 'z', x: 11.5, z: 118, w: 1.7, h: 2.6, hinge: 'b', id: 'armory_door', chunk: c }); B.door({ axis: 'z', x: 11.5, z: 128, w: 1.7, h: 2.6, hinge: 'b', id: 'guardroom_door', chunk: c });
  // west wing internal wall between kitchen and pantry (z=125)
  part({ axis: 'x', a: -19, b: -12, c: 124.5, h: WH, t: 0.4 }); part({ axis: 'x', a: 12, b: 19, c: 123.5 });
  // north partition: the hall's north wall, with the antechamber door
  part({ axis: 'x', a: -19, b: 19, c: 133.5, openings: [{ at: 17, w: 2.6, top: 3.2, kind: 'door' }] });
  B.door({ axis: 'x', x: -2, z: 133.5, w: 2.6, h: 3.2, hinge: 'a', id: 'antechamber_door', chunk: c });
  // north block: study | antechamber | bedchamber
  part({ axis: 'z', a: 134, b: 145, c: -7.5, openings: [{ at: 5.5, w: 1.6, top: 2.6, kind: 'door' }] });
  B.door({ axis: 'z', x: -7.5, z: 139.5, w: 1.6, h: 2.6, hinge: 'a', id: 'study_door', chunk: c, locked: true, lockLevel: 1, keyId: 'studykey' });
  part({ axis: 'z', a: 134, b: 145, c: 4.5, openings: [{ at: 5.5, w: 2.2, top: 3, kind: 'door' }] });
  B.door({ axis: 'z', x: 4.5, z: 139.5, w: 2.2, h: 3, hinge: 'a', id: 'bedchamber_door', chunk: c, locked: true, lockLevel: 2, keyId: 'chamberkey', mat: 'door' });
  // ---- lighting for the shell & ground floor markers
  B.nav.setZone(-19, 134, 19, 145, 2);
  B.rug(0, 122, 4, 18, 'rug', 0.012);
  // ---- GREAT HALL
  B.table(-5.5, 121, 1.4, 14, { chunk: c, cloth: 'linen' }); B.table(5.5, 121, 1.4, 14, { chunk: c, cloth: 'linen' });
  for (let i = 0; i < 6; i++) { const z = 115.5 + i * 2.5; B.bench(-7.1, z, 0.45, 2.0, { chunk: c }); B.bench(-3.9, z, 0.45, 2.0, { chunk: c }); B.bench(3.9, z, 0.45, 2.0, { chunk: c }); B.bench(7.1, z, 0.45, 2.0, { chunk: c }); }
  for (let i = 0; i < 8; i++) { const z = 116 + i * 1.8; B.poi('hall_seat_' + i, i % 2 ? -7.1 : 7.1, z, { yaw: i % 2 ? 90 : 270, type: 'sit', y: 0.45, approach: [i % 2 ? -8.3 : 8.3, z] }); }
  for (let i = 0; i < 3; i++) { B.candle(-5.5, 0.85, 116 + i * 5, { chunk: c, range: 5, intensity: 3.6 }); B.candle(5.5, 0.85, 116 + i * 5, { chunk: c, range: 5, intensity: 3.6 }); }
  for (let i = 0; i < 4; i++) { B.prop('mug', -5.5 + r(-0.3, 0.3), 0.85, 116 + i * 3.4); B.prop('mug', 5.5 + r(-0.3, 0.3), 0.85, 117 + i * 3.4); }
  B.prop('bread', -5.5, 0.85, 120); B.prop('cheese', 5.5, 0.85, 124); B.prop('bottle', 5.4, 0.85, 127); B.prop('jug', -5.4, 0.85, 126); B.prop('skull', -5.5, 0.85, 129.5);
  B.chandelier(-5.5, 6.2, 120, { r: 1.2, candles: 10, chunk: c }); B.chandelier(5.5, 6.2, 128, { r: 1.2, candles: 10, chunk: c }); B.chandelier(0, 6.6, 116, { r: 1.4, candles: 12, chunk: c });
  for (const z of [116, 122, 128]) for (const sx of [-1, 1]) B.pillar(sx * 9.4, z, { h: 8.3, r: 0.5, chunk: c });
  B.fireplace(7.5, 132.8, { dir: 180, w: 4.6, h: 3.2, chunk: c });
  for (const [x, z] of [[-9, 115], [9, 115], [-9, 131], [9, 131]]) B.torch(x < 0 ? x - 0.6 : x + 0.6, 3.3, z, { dir: [x < 0 ? 1 : -1, 0], chunk: c, range: 11, intensity: 11 });
  for (const x of [-8, -3, 3, 8]) B.banner(x, 3.2, 112.85, { dir: 0, w: 1.4, h: 3.6, mat: x < 0 ? 'crimson' : 'blackCloth', emblem: true });
  B.banner(-2, 3.2, 133.2, { dir: 180, w: 1.6, h: 4, mat: 'crimson' });
  // the dais
  B.solid('stoneOld', -11, 0, 129.5, -4.6, 0.5, 133, { chunk: c, nav: false }); B.nav.setHeight(-11, 129.5, -4.6, 133, 0.5);
  B.solid('stoneOld', -10.5, 0.5, 130, -5.1, 0.8, 132.6, { chunk: c, nav: false, collide: false });
  B.solid('timber', -8.6, 0.5, 131.5, -7.4, 2.4, 132.7, { chunk: c, kind: 'wood', nav: true });
  B.poi('throne', -8, 130.6, { yaw: 180, type: 'stand', y: 0.5 });
  B.poi('hall_door_in', 0, 114, { yaw: 0, type: 'stand' });
  B.route('hall_beat', [[-1, 115], [0, 130], [1, 118], [-1, 128], [9.5, 121], [-9.5, 121]]);
  B.chest(-18, 114, { dir: 90, loot: [['gold', 34], ['wine', 1]], name: 'Sideboard', chunk: c, w: 1.4, d: 0.6, mat: 'timber' });
  // ---- KITCHEN (west wing, south)
  B.hearth(-17.6, 0, 116, { r: 0.7, range: 14, intensity: 16, chunk: c });
  B.solid('stoneDark', -19, 0, 114, -15.4, 1.2, 118, { chunk: c, nav: true });
  B.table(-15, 121, 2.6, 1.2, { chunk: c }); B.prop('bread', -15.8, 0.85, 121); B.prop('cheese', -14.5, 0.85, 121.3); B.prop('pot', -15, 0.85, 120.7); B.prop('bottle', -14, 0.85, 121);
  B.table(-15, 114.8, 2.6, 0.9, { chunk: c }); B.prop('jug', -15, 0.85, 114.8);
  for (let i = 0; i < 4; i++) B.prop('barrel', -18.4 + (i % 2) * 0.8, 0, 122.2 + Math.floor(i / 2) * 0.9, { yaw: r(0, 360) });
  B.poi('cook_stove', -15.5, 116.6, { yaw: 270, type: 'stand' }); B.poi('cook_table', -15, 122.3, { yaw: 0, type: 'stand' });
  B.searchSpot(-16, 1.2, 114.4, { name: 'larder', loot: [['bread', 2], ['cheese', 1], ['gold', 8]], id: 'kitchen_larder' });
  B.chest(-18.4, 119.6, { dir: 90, loot: [['servantkey', 1], ['gold', 6]], name: "Cook's chest", id: 'cook_chest', chunk: c, w: 0.9, d: 0.55 });
  // ---- PANTRY & CELLAR STAIRS
  B.shelf(-18.6, 127.5, { dir: 90, w: 3, h: 2.4, chunk: c, loot: [['potion', 1], ['gold', 12]], name: 'pantry shelf' }); B.shelf(-15, 132.6, { dir: 180, w: 3, h: 2.4, chunk: c, books: false });
  for (let i = 0; i < 5; i++) B.prop('sack', -16 + i * 0.6, 0, 125.6 + (i % 2) * 0.6, { yaw: r(0, 90) });
  B.torch(-18.6, 2.6, 129, { dir: [1, 0], chunk: c, range: 8, intensity: 8 });
  B.solid('timber', -15.6, 0, 130, -13.4, 0.12, 132, { chunk: c, nav: false, collide: false });
  B.stairsFromCellar = { x: -14.5, z: 131, r: 1.7 };
  B.vbox('iron', -15.5, 0.02, 130.2, -13.5, 0.06, 131.8, { chunk: c });
  // ---- ARMORY (east wing, south)
  B.chest(18.4, 116, { dir: 270, loot: [['sword', 1], ['dagger', 1], ['gold', 20]], name: 'Weapon rack', id: 'armory_rack', chunk: c, w: 1.6, d: 0.5, mat: 'timber', metal: false });
  B.chest(18.4, 120.5, { dir: 270, loot: [['potion', 2], ['gold', 44]], locked: true, lockLevel: 2, name: 'Armory strongbox', id: 'armory_box', chunk: c, w: 1.1, d: 0.6 });
  B.table(15, 114.6, 2.4, 1.0, { chunk: c }); for (let i = 0; i < 4; i++) B.prop('crateS', 13.4 + i * 0.6, 0.85, 114.6);
  B.torch(18.6, 2.6, 118, { dir: [-1, 0], chunk: c, range: 8, intensity: 8 });
  for (let i = 0; i < 6; i++) B.vbox('steel' in B.pal ? 'steel' : 'iron', 12.7, 0.9, 122 + 0.2 * i, 12.9, 1.2, 122.15 + 0.2 * i, { chunk: c });
  // ---- GUARD ROOM (east wing, north)
  B.table(15.6, 128.6, 2.2, 1.0, { chunk: c }); B.chair(14.6, 129.7, 180, { name: 'gr_seat_0', chunk: c }); B.chair(16.6, 129.7, 180, { name: 'gr_seat_1', chunk: c }); B.chair(15.6, 127.5, 0, { name: 'gr_seat_2', chunk: c });
  B.candle(15.6, 0.85, 128.6, { chunk: c }); B.prop('mug', 15.1, 0.85, 128.8); B.prop('mug', 16.2, 0.85, 128.4);
  B.bed(17.8, 131.2, { dir: 90, id: 'bed_grd_0', chunk: c }); B.torch(12.7, 2.6, 130.2, { dir: [1, 0], chunk: c, range: 8, intensity: 8 });
  B.chest(18.4, 124.8, { dir: 270, loot: [['keepkey', 1], ['studykey', 1], ['gold', 30]], locked: true, lockLevel: 2, name: 'Guard lockbox', id: 'guard_box', chunk: c, w: 0.9, d: 0.55 });
  B.poi('gr_watch', 14, 131, { yaw: 180, type: 'stand' });
  // ---- ANTECHAMBER (guarded)
  B.rug(-2, 139.5, 6, 6, 'rugBlue', 0.012);
  B.torch(-3.9, 2.7, 135, { dir: [1, 0], chunk: c, range: 11, intensity: 10 }); B.torch(3.9, 2.7, 135, { dir: [-1, 0], chunk: c, range: 11, intensity: 10 });
  B.torch(-3.9, 2.7, 144, { dir: [1, 0], chunk: c, range: 11, intensity: 10 }); B.torch(3.9, 2.7, 144, { dir: [-1, 0], chunk: c, range: 11, intensity: 10 });
  B.table(-2, 143.4, 2.4, 0.9, { chunk: c }); B.candle(-2, 0.85, 143.4, { chunk: c, range: 6 }); B.prop('candlestick', -1.2, 0.85, 143.6); B.prop('skull', -2.8, 0.85, 143.5);
  B.chair(-2, 142.4, 0, { name: 'ante_seat', chunk: c });
  B.poi('ante_l', -5.6, 137.5, { yaw: 90, type: 'stand' }); B.poi('ante_r', 2.6, 137.5, { yaw: 270, type: 'stand' }); B.poi('ante_center', -2, 136.5, { yaw: 0, type: 'stand' });
  B.route('ante_beat', [[-5.5, 136], [2.6, 136], [2.6, 143], [-5.5, 143]]);
  // ---- STUDY
  B.rug(-13, 139.5, 8, 6, 'rug', 0.012);
  B.solid('timber', -18, 0, 138.2, -15.6, 0.95, 141, { chunk: c, kind: 'wood' });   // the desk
  B.chair(-14.9, 139.6, 90, { name: 'study_seat', chunk: c });
  B.candle(-17.2, 0.95, 139.2, { chunk: c, range: 7, intensity: 5 }); B.prop('book', -17, 0.95, 140.1); B.prop('candlestick', -16.4, 0.95, 138.6);
  B.searchSpot(-16.8, 0.95, 140.2, { name: 'desk drawer', loot: [['letterfake', 1], ['gold', 30], ['dukekey', 1]], locked: true, lockLevel: 1, id: 'study_desk' });
  for (const z of [136, 142]) B.shelf(-18.6, z, { dir: 90, w: 4, h: 3.2, shelves: 6, chunk: c });
  B.shelf(-13, 144.6, { dir: 180, w: 4, h: 3.2, shelves: 6, chunk: c }); B.shelf(-10, 144.6, { dir: 180, w: 2.4, h: 3.2, shelves: 6, chunk: c, loot: [['book', 1]], name: 'bookshelf' });
  B.fireplace(-8.3, 136.5, { dir: 90, w: 2.6, h: 2.4, chunk: c, lit: true });
  B.torch(-13, 3.0, 133.9, { dir: [0, 1], chunk: c, range: 9, intensity: 8 });
  B.poi('duke_desk', -14.9, 139.6, { yaw: 270, type: 'sit', y: 0.45, approach: [-13.9, 139.6] });
  // ---- BEDCHAMBER
  const bx = 4.5, by = 0;
  B.rug(11, 140, 10, 7, 'rug', 0.012);
  B.bed(15.4, 142.3, { dir: 0, id: 'bed_duke', canopy: true, fancy: true, w: 1.9, l: 2.4, chunk: c });
  B.chest(15.4, 139.4, { dir: 0, w: 1.3, d: 0.65, loot: [['letter', 1], ['gold', 120], ['ring', 1]], locked: true, lockLevel: 3, keyId: 'dukekey', name: "Duke's strongbox", id: 'duke_chest', chunk: c, metal: true, gold: true });
  B.fireplace(10.2, 144.6, { dir: 180, w: 3.6, h: 2.8, chunk: c });
  B.shelf(6.4, 137, { dir: 90, w: 3, h: 2.6, chunk: c }); B.shelf(6.4, 141.5, { dir: 90, w: 3, h: 2.6, chunk: c, loot: [['gold', 40], ['potion', 1]], name: 'wardrobe' });
  B.table(7.6, 143.6, 1.6, 0.8, { chunk: c }); B.candle(7.6, 0.85, 143.6, { chunk: c, range: 6, intensity: 5 }); B.prop('mug', 7.2, 0.85, 143.7); B.prop('bottle', 8, 0.85, 143.5);
  B.chair(11.6, 138.4, 180, { name: 'chamber_chair', chunk: c });
  B.torch(4.9, 2.9, 136, { dir: [1, 0], chunk: c, range: 12, intensity: 11 });
  B.candle(17.9, 0.7, 142.3, { chunk: c, range: 6, intensity: 4.5 });
  B.banner(18.4, 3.0, 138, { dir: 270, w: 1.4, h: 3.2, mat: 'crimson' });
  B.poi('duke_bed_stand', 13.4, 139.6, { yaw: 180, type: 'stand' });
  // the balcony door leads to the back yard behind the keep
  B.ground('cobble', -20, 147, 20, 152, 0.0, 0.04, { chunk: 'court', noise: 1 });
  B.torch(15.5, 3.0, 146.3, { dir: [0, 1], chunk: c, range: 12, intensity: 11, name: 'balcony torch' });
  b.parts = { hall: [-11.5, 113, 11.5, 133.5], kitchen: [-19, 113, -11.5, 124.5], pantry: [-19, 124.5, -11.5, 133.5], armory: [11.5, 113, 19, 123.5], guardroom: [11.5, 123.5, 19, 133.5], study: [-19, 134, -7.5, 145], antechamber: [-7.5, 134, 4.5, 145], bedchamber: [4.5, 134, 19, 145] };
  return b;
}
