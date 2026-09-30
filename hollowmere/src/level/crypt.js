// The catacombs under Ashgate: from the mausoleum in the graveyard, through the ossuary and the
// First Duke's shrine, to the undercroft beneath Ravenspire. Reached by stairs that carry the
// player between the two ends of the level.
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';

const rnd = E.rng(99);
const r = (a, b) => a + (b - a) * rnd();

export function buildCrypt(B) {
  // rooms: doorways are plain arches, cut by house() through the wall lines
  const arches = (list) => list.map(([side, at, w = 2]) => ({ side, at, w, kind: 'arch', h: 2.7 }));
  const mk = (id, x, z, w, d, ar, extra = {}) => {
    const b = B.house({ id, x, z, w, d, h: 3.8, wall: 'stoneOld', timber: false, zone: 2, roof: false, underground: true, floor: 'flagstone', ceilMat: 'stoneDark', noise: 1, t: 0.9, ...extra, doors: extra.doors || arches(ar), windows: [] });
    return b;
  };
  const A = mk('crypt_a', 72, 11, 12, 12, [['E', 6]]);
  const C1 = mk('crypt_c1', 83, 15, 15, 5, [['W', 2], ['E', 2]]);
  const Bh = mk('crypt_b', 97, 10, 17, 22, [['W', 7], ['N', 8]], { h: 4.6 });
  const C2 = mk('crypt_c2', 103, 31, 5, 15, [['S', 2], ['N', 2]]);
  const Cc = mk('crypt_c', 97, 45, 17, 15, [['S', 8]], { h: 4.6, doors: arches([['S', 8]]).concat([{ side: 'E', at: 7, w: 1.8, id: 'crypt_gate', locked: true, keyId: 'cryptkey', lockLevel: 2, h: 2.7 }]) });
  const U = mk('undercroft', 113, 44, 14, 17, [['W', 8, 1.8]], { h: 4.2 });
  // the doorway between the shrine and the undercroft shares a wall: cut it in the undercroft too
  B.nav.clear(113.05, 51.05, 113.95, 52.95);
  B.useChunk('crypt');
  // ---- A: arrival
  B.torch(73.3, 2.4, 14, { dir: [1, 0], chunk: 'crypt', range: 9, intensity: 8, name: 'crypt torch', color: '#ff9c58' });
  B.solid('stoneDark', 72.8, 0, 12.4, 74.2, 0.5, 15.2, { chunk: 'crypt' });
  for (let i = 0; i < 6; i++) B.prop('skull', 73.3 + (i % 3) * 0.2, 0.5 + Math.floor(i / 3) * 0.16, 12.8 + (i % 2) * 0.3);
  B.solid('stoneWall', 72.5, 0, 18, 74, 0.9, 21, { chunk: 'crypt', bevel: 0.05 });
  B.stairsUp = { x: 74.5, z: 17, r: 1.8, to: 'mausoleum' };
  B.vbox('stoneWall', 72.6, 0, 16.5, 74.4, 0.5, 17.5, { chunk: 'crypt' });
  B.poi('crypt_arrive', 76, 17, { yaw: 90, type: 'stand' });
  // ---- corridor with alcoves
  for (const x of [87, 93]) { B.torch(x, 2.4, 16.2, { dir: [0, 1], chunk: 'crypt', range: 9, intensity: 7, color: '#8fb0ff', name: 'blue torch' }); }
  for (let i = 0; i < 6; i++) B.prop('skull', 85 + i * 2, 0, 15.9 + (i % 2) * 0.05 + 0.5);
  B.searchSpot(90, 0.8, 19.2, { name: 'bone niche', loot: [['gold', 14]], id: 'niche1' });
  // ---- B: ossuary
  const K = B.kit('crypt');
  for (const [px, pz] of [[101, 14], [101, 26], [110, 14], [110, 26], [105.5, 20]]) B.pillar(px, pz, { h: 4.5, r: 0.55, mat: 'stoneOld', chunk: 'crypt' });
  const sarc = [[100, 19, 90], [110, 19, 90], [104, 27.5, 0], [108.5, 27.5, 0]];
  sarc.forEach(([sx, sz, dir], i) => {
    const wide = dir === 90; const hx = wide ? 1.4 : 0.7, hz = wide ? 0.7 : 1.4;
    B.solid('stoneDark', sx - hx, 0, sz - hz, sx + hx, 0.9, sz + hz, { chunk: 'crypt', bevel: 0.06 });
    B.vbox('stoneOld', sx - hx - 0.08, 0.9, sz - hz - 0.08, sx + hx + 0.08, 1.05, sz + hz + 0.08, { chunk: 'crypt', bevel: 0.03 });
    B.searchSpot(sx, 1.1, sz, { name: 'sarcophagus', loot: i === 2 ? [['cryptkey', 1], ['gold', 30]] : [['gold', 18 + i * 6]], id: 'sarc' + i, verb: 'Open the' });
  });
  for (let i = 0; i < 22; i++) K.add(B.pal.bone, E.sphere({ radius: 0.09, widthSegments: 6, heightSegments: 5 }), [99 + r(0, 12), 0.09, 12 + r(0, 3)]);
  B.hearth(105.5, 0, 12.6, { r: 0.4, range: 15, intensity: 12, chunk: 'crypt' });
  B.candle(103, 0.9, 27.5, { chunk: 'crypt', range: 6, intensity: 4 });
  B.torch(98.4, 2.5, 17, { dir: [1, 0], chunk: 'crypt', range: 10, intensity: 8, color: '#8fb0ff', name: 'blue torch' });
  B.torch(112.6, 2.5, 25, { dir: [-1, 0], chunk: 'crypt', range: 10, intensity: 8, color: '#8fb0ff', name: 'blue torch' });
  B.poi('ossuary_a', 104, 22, { type: 'stand' }); B.poi('ossuary_b', 108, 16, { type: 'stand' });
  B.route('ossuary_beat', [[100, 22], [110, 22], [110, 16], [100, 16]]);
  // ---- corridor 2
  B.torch(104.2, 2.4, 38, { dir: [1, 0], chunk: 'crypt', range: 8, intensity: 6, color: '#8fb0ff', name: 'blue torch' });
  // ---- C: the shrine of the First Duke
  const cx = 105.5, cz = 52;
  B.solid('stoneDark', cx - 1.2, 0, cz - 2.2, cx + 1.2, 1.0, cz + 2.2, { chunk: 'crypt', bevel: 0.08 });
  B.vbox('stoneOld', cx - 1.3, 1.0, cz - 2.3, cx + 1.3, 1.15, cz + 2.3, { chunk: 'crypt', bevel: 0.04 });
  K.add(B.pal.wax, E.torus({ radius: 3.6, tube: 0.05, radialSegments: 6, tubularSegments: 48 }), [cx, 0.04, cz], [90, 0, 0]);
  K.add(B.pal.wax, E.torus({ radius: 2.8, tube: 0.04, radialSegments: 6, tubularSegments: 40 }), [cx, 0.04, cz], [90, 0, 0]);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; B.candle(cx + Math.cos(a) * 3.2, 0.06, cz + Math.sin(a) * 3.2, { chunk: 'crypt', holder: false, range: 5, intensity: 3.6 }); }
  B.torch(98.4, 2.6, 52, { dir: [1, 0], chunk: 'crypt', range: 11, intensity: 9, color: '#a070ff', name: 'violet torch' });
  B.chest(99.4, 57.6, { dir: 0, loot: [['potion', 2], ['gem', 1]], locked: false, name: 'Offering chest', chunk: 'crypt', w: 1.0, d: 0.6 });
  B.interactables.push({ kind: 'note', x: cx, y: 1.2, z: cz - 2.6, r: 2.4, obj: { id: 'tomb' }, prompt: () => 'Read the inscription', use: (g) => g.readNote('tomb') });
  B.poi('shrine', cx, cz + 3.2, { type: 'stand' });
  // ---- U: the undercroft below Ravenspire
  for (let i = 0; i < 8; i++) B.prop('barrel', 115 + (i % 4) * 0.9, 0, 45.6 + Math.floor(i / 4) * 0.9, { yaw: r(0, 360) });
  for (let i = 0; i < 5; i++) B.prop('crate', 124 + (i % 2) * 0.7, Math.floor(i / 2) * 0.6, 46 + (i % 3) * 0.7, { yaw: r(0, 30) });
  B.table(119, 55, 2, 1, { chunk: 'crypt' }); B.candle(119, 0.85, 55, { chunk: 'crypt', range: 6 }); B.prop('bottle', 118.4, 0.85, 55); B.prop('jug', 119.8, 0.85, 55.1);
  B.torch(114.6, 2.6, 48, { dir: [1, 0], chunk: 'crypt', range: 10, intensity: 9 }); B.torch(125.4, 2.6, 56, { dir: [-1, 0], chunk: 'crypt', range: 10, intensity: 9 });
  B.searchSpot(122, 1.0, 59.4, { name: 'wine rack', loot: [['wine', 2], ['gold', 10]], id: 'wine_rack' });
  B.stairsUp2 = { x: 121, z: 59.3, r: 1.8, to: 'pantry' };
  B.vbox('stoneWall', 119.8, 0, 59.4, 122.2, 0.5, 60.3, { chunk: 'crypt' });
  B.poi('undercroft_arrive', 120.5, 57, { yaw: 180, type: 'stand' }); B.poi('undercroft_idle', 118, 51, { type: 'stand' });
  B.route('undercroft_beat', [[116, 48], [124, 48], [124, 54], [116, 54]]);
  return { A, C1, Bh, C2, Cc, U };
}
