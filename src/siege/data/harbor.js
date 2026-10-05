// HARBOR GARAGE: a two-storey vehicle depot and office block inside a fenced yard.
// The building is authored as a plan of room letters (one character = one 1 m cell, top row = north)
// plus lists of openings, hatches, stairs, props and objective sites. Walls appear automatically
// wherever two different letters touch. Coordinates in this file are relative to the building's
// south-west corner; compile (world/mapbuild.js) shifts them by (bx, bz).
//
// Sides of a cell: N = +z edge, S = -z edge, E = +x edge, W = -x edge.
export const HARBOR = {
  id: 'harbor', name: 'HARBOR GARAGE', subtitle: 'Vehicle depot, Coastline district',
  W: 56, D: 46, bx: 14, bz: 14, floors: 2, bw: 28, bd: 18,
  plan: [
    [ // 1F, north at the top
      'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC',
      'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC',
      'PPPPPPPPPjjjRRRRRRRfffYYYYYY', 'PPPPPPPPPjjjRRRRRRRfffYYYYYY', 'PPPPPPPPPjjjRRRRRRRfffYYYYYY',
      'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK',
      'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK',
    ],
    [ // 2F
      'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC',
      'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC', 'WWWWWWWWWkkkOOOOAAAgggCCCCCC',
      'PPPPPPPPPjjjRRRRRRRfffYYYYYY', 'PPPPPPPPPjjjRRRRRRRfffYYYYYY', 'PPPPPPPPPjjjRRRRRRRfffYYYYYY',
      'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK',
      'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK', 'GGGGGGGGGhhhLLLLLLLeeeKKKKKK',
    ],
  ],
  // name, interior wall paint, floor finish, light colour
  rooms: [
    { G: ['Garage', 'brick', 'concrete', '#ffe9c4'], P: ['Parts Store', 'grey', 'concrete', '#f4e8d0'], W: ['Workshop', 'tan', 'concrete', '#fff1d6'],
      h: ['South Corridor', 'cream', 'tile', '#fff3da'], j: ['West Junction', 'cream', 'tile', '#fff3da'], k: ['West Stairwell', 'cream', 'tile', '#fff3da'],
      L: ['Lobby', 'blue', 'tile', '#fff6e4'], R: ['Reception', 'cream', 'wood', '#ffeccc'], O: ['Office', 'green', 'carpet', '#fff0d2'], A: ['Archive', 'grey', 'concrete', '#eef0ff'],
      e: ['East Corridor', 'cream', 'tile', '#fff3da'], f: ['East Junction', 'cream', 'tile', '#fff3da'], g: ['East Stairwell', 'cream', 'tile', '#fff3da'],
      K: ['Locker Room', 'blue', 'tile', '#f2f6ff'], Y: ['Pantry', 'tan', 'tile', '#fff1d6'], C: ['Canteen', 'cream', 'wood', '#ffe8c0'] },
    { G: ['Garage Lounge', 'blue', 'carpet', '#ffe2b0'], P: ['Armory', 'grey', 'concrete', '#f0f0f0'], W: ['Gym', 'tan', 'rubber', '#fff1d6'],
      h: ['South Landing', 'cream', 'tile', '#fff3da'], j: ['West Junction', 'cream', 'tile', '#fff3da'], k: ['West Landing', 'cream', 'tile', '#fff3da'],
      L: ['Conference', 'cream', 'carpet', '#fff6e4'], R: ['Copy Room', 'tan', 'carpet', '#ffeccc'], O: ['Manager Office', 'green', 'wood', '#ffe9c8'], A: ['Server Room', 'grey', 'metal', '#dfe8ff'],
      e: ['East Corridor', 'cream', 'tile', '#fff3da'], f: ['East Junction', 'cream', 'tile', '#fff3da'], g: ['East Landing', 'cream', 'tile', '#fff3da'],
      K: ['Showers', 'blue', 'tile', '#f2f6ff'], Y: ['Vending Hall', 'tan', 'tile', '#fff1d6'], C: ['Staff Bar', 'cream', 'wood', '#ffd9a8'] },
  ],
  // [floor, x, z, side, kind, count]   kinds: door | open | arch | win | shut
  openings: [
    // ---- ground floor, entrances
    [1, 14, 0, 'S', 'door', 2], [1, 3, 0, 'S', 'shut', 3], [1, 0, 13, 'W', 'door'], [1, 27, 3, 'E', 'door'], [1, 24, 17, 'N', 'door'],
    // ---- ground floor, interior
    [1, 8, 3, 'E', 'door'], [1, 4, 6, 'N', 'door'], [1, 8, 8, 'E', 'door'], [1, 3, 9, 'N', 'door'], [1, 7, 9, 'N', 'open'], [1, 8, 13, 'E', 'door'],
    [1, 9, 6, 'N', 'arch', 3], [1, 9, 9, 'N', 'arch', 3], [1, 11, 4, 'E', 'door'], [1, 11, 8, 'E', 'door'], [1, 11, 15, 'E', 'door'],
    [1, 14, 6, 'N', 'arch', 3], [1, 13, 9, 'N', 'door'], [1, 17, 9, 'N', 'door'], [1, 15, 14, 'E', 'door'],
    [1, 18, 3, 'E', 'door'], [1, 18, 8, 'E', 'door'], [1, 18, 14, 'E', 'door'], [1, 19, 6, 'N', 'arch', 3], [1, 19, 9, 'N', 'arch', 3],
    [1, 21, 3, 'E', 'door'], [1, 21, 8, 'E', 'door'], [1, 21, 13, 'E', 'door'], [1, 24, 6, 'N', 'door'], [1, 25, 9, 'N', 'open', 2],
    // ---- ground floor windows
    [1, 0, 2, 'W', 'win'], [1, 0, 4, 'W', 'win'], [1, 7, 0, 'S', 'win'], [1, 12, 0, 'S', 'win'], [1, 18, 0, 'S', 'win'], [1, 0, 8, 'W', 'win'],
    [1, 13, 17, 'N', 'win'], [1, 14, 17, 'N', 'win'], [1, 17, 17, 'N', 'win'], [1, 2, 17, 'N', 'win'], [1, 5, 17, 'N', 'win'], [1, 0, 11, 'W', 'win'], [1, 0, 15, 'W', 'win'],
    [1, 27, 12, 'E', 'win'], [1, 27, 15, 'E', 'win'], [1, 22, 17, 'N', 'win'], [1, 26, 17, 'N', 'win'], [1, 27, 5, 'E', 'win'], [1, 27, 8, 'E', 'win'], [1, 24, 0, 'S', 'win'], [1, 26, 0, 'S', 'win'],
    // ---- upper floor, interior
    [2, 8, 2, 'E', 'door'], [2, 6, 6, 'N', 'door'], [2, 8, 8, 'E', 'door'], [2, 2, 9, 'N', 'door'], [2, 8, 14, 'E', 'door'],
    [2, 9, 6, 'N', 'arch', 3], [2, 9, 9, 'N', 'arch', 3], [2, 11, 3, 'E', 'door'], [2, 11, 7, 'E', 'open'], [2, 11, 16, 'E', 'door'],
    [2, 16, 6, 'N', 'door'], [2, 13, 9, 'N', 'door'], [2, 17, 9, 'N', 'door'], [2, 15, 12, 'E', 'door'], [2, 15, 16, 'E', 'door'],
    [2, 18, 2, 'E', 'door'], [2, 18, 8, 'E', 'door'], [2, 18, 13, 'E', 'door'], [2, 19, 6, 'N', 'arch', 3], [2, 19, 9, 'N', 'arch', 3],
    [2, 21, 4, 'E', 'door'], [2, 21, 8, 'E', 'open'], [2, 21, 15, 'E', 'door'], [2, 23, 6, 'N', 'door'], [2, 26, 9, 'N', 'door'],
    // ---- upper floor windows
    [2, 0, 1, 'W', 'win'], [2, 0, 3, 'W', 'win'], [2, 0, 5, 'W', 'win'], [2, 2, 0, 'S', 'win'], [2, 6, 0, 'S', 'win'], [2, 12, 0, 'S', 'win'], [2, 15, 0, 'S', 'win'], [2, 18, 0, 'S', 'win'],
    [2, 0, 12, 'W', 'win'], [2, 0, 15, 'W', 'win'], [2, 2, 17, 'N', 'win'], [2, 6, 17, 'N', 'win'], [2, 13, 17, 'N', 'win'], [2, 14, 17, 'N', 'win'], [2, 17, 17, 'N', 'win'],
    [2, 23, 17, 'N', 'win'], [2, 26, 17, 'N', 'win'], [2, 27, 12, 'E', 'win'], [2, 27, 15, 'E', 'win'], [2, 27, 2, 'E', 'win'], [2, 27, 5, 'E', 'win'], [2, 27, 8, 'E', 'win'], [2, 24, 0, 'S', 'win'], [2, 26, 0, 'S', 'win'],
  ],
  // floor panels that can be destroyed (and reinforced): hatches between storeys
  hatches: [[2, 3, 8], [2, 4, 8], [2, 13, 13], [2, 14, 13], [2, 17, 13], [2, 4, 3], [2, 5, 3], [2, 24, 13], [2, 25, 13], [2, 24, 3]],
  // roof skylight hatches [x, z]
  skylights: [[13, 3], [14, 3], [13, 14], [17, 14], [3, 14]],
  // staircases: x, z of the first (lowest) cell, width across, run in cells, direction of climb, from floor, rise
  stairs: [
    { x: 10, z: 10, w: 2, run: 5, dir: 'N', f: 0, hole: true },
    { x: 19, z: 10, w: 2, run: 5, dir: 'N', f: 0, hole: true },
    { x: 28, z: 2, w: 2, run: 10, dir: 'N', f: 0, hole: false, rise: 6, ext: true },
  ],
  // objective sites: building-relative bomb spots [x, z] on floor f (0-based)
  sites: [
    { id: 'office', name: 'OFFICE / ARCHIVE', f: 0, a: [13.5, 14], b: [17.5, 13], area: [13.5, 14.5], rooms: ['O', 'A'], hint: 'North-centre. Two rooms divided by a soft wall.' },
    { id: 'workshop', name: 'WORKSHOP / PARTS STORE', f: 0, a: [4, 14], b: [4, 8.5], area: [4, 13], rooms: ['W', 'P'], hint: 'West wing. Hatches above the Parts Store.' },
    { id: 'lounge', name: 'GARAGE LOUNGE / ARMORY', f: 1, a: [4, 3], b: [4, 8.5], area: [4, 4], rooms: ['G', 'P'], hint: 'Upper west. Lockers, couches and a hatch above the Garage.' },
    { id: 'manager', name: 'MANAGER OFFICE / SERVER ROOM', f: 1, a: [13.5, 14], b: [17.5, 13], area: [13.5, 14.5], rooms: ['O', 'A'], hint: 'Upper north-centre. Two roof skylights.' },
  ],
  // where each attacking team can start (absolute world cells)
  spawns: [
    { id: 'south', name: 'SOUTH LOT', x0: 22, z0: 3, x1: 34, z1: 9, face: 0 },
    { id: 'east', name: 'EAST YARD', x0: 47, z0: 16, x1: 53, z1: 30, face: -Math.PI / 2 },
    { id: 'west', name: 'WEST YARD', x0: 3, z0: 16, x1: 9, z1: 30, face: Math.PI / 2 },
  ],
  // rappel anchors on the roof edge: [x, z, outward side]
  anchors: [[3, 0, 'S'], [7, 0, 'S'], [13, 0, 'S'], [17, 0, 'S'], [24, 0, 'S'], [0, 4, 'W'], [0, 13, 'W'], [3, 17, 'N'], [14, 17, 'N'], [23, 17, 'N'], [27, 4, 'E'], [27, 13, 'E']],
  // furniture: [kind, floor, x, z, rotation(0|90|180|270), options]
  props: [
    // ---- 1F Garage
    ['car', 0, 2.2, 3.4, 90, { color: '#8e1d1d' }], ['car', 0, 6.4, 3.2, 270, { color: '#223d6a' }], ['bench', 0, 0.9, 5.4, 0, { w: 2.2 }], ['crate', 0, 8.2, 0.7, 0], ['crate', 0, 7.2, 0.7, 0, { stack: 2 }],
    ['tires', 0, 0.8, 0.8, 0], ['shelf', 0, 4.5, 6.45, 180, { w: 2.4 }], ['barrel', 0, 8.3, 5.8, 0], ['barrel', 0, 7.6, 6.0, 0],
    // ---- 1F Parts store
    ['shelf', 0, 1.5, 7.55, 0, { w: 2.4 }], ['shelf', 0, 4.5, 7.55, 0, { w: 2.4 }], ['shelf', 0, 7.5, 9.45, 180, { w: 2.0 }], ['crate', 0, 0.7, 9.3, 0], ['crate', 0, 2.8, 9.4, 0],
    // ---- 1F Workshop
    ['bench', 0, 3.0, 16.4, 180, { w: 3 }], ['bench', 0, 0.8, 14, 90, { w: 2.4 }], ['crate', 0, 7.4, 16.2, 0, { stack: 2 }], ['crate', 0, 8.2, 14.2, 0], ['barrel', 0, 6.6, 10.7, 0], ['toolbox', 0, 5.2, 12.4, 0],
    ['pallet', 0, 4.6, 11.4, 0], ['shelf', 0, 7.5, 10.45, 0, { w: 2 }],
    // ---- 1F Lobby / Reception
    ['counter', 0, 13.4, 8.1, 0, { w: 2.4 }], ['couch', 0, 12.9, 1.0, 180, {}], ['couch', 0, 17.2, 1.0, 180, {}], ['table', 0, 15.0, 2.6, 0, { w: 1.2, d: 1.2 }], ['plant', 0, 12.5, 6.3], ['plant', 0, 18.4, 6.3], ['vending', 0, 18.4, 3.4, 90],
    // ---- 1F Office / Archive
    ['desk', 0, 13.6, 15.6, 180, { w: 2 }], ['desk', 0, 13.6, 12.3, 0, { w: 2 }], ['chair', 0, 13.6, 14.6, 0], ['shelf', 0, 12.55, 16.5, 90, { w: 2.0 }], ['plant', 0, 15.5, 10.6],
    ['archive', 0, 16.7, 16.6, 90], ['archive', 0, 16.7, 13.4, 90], ['archive', 0, 18.3, 16.5, 270], ['archive', 0, 18.3, 12.4, 270], ['crate', 0, 17.6, 10.8, 0],
    // ---- 1F Locker room / Pantry / Canteen
    ['lockers', 0, 22.4, 1.0, 90, { n: 5 }], ['lockers', 0, 27.6, 3.0, 270, { n: 5 }], ['bench', 0, 24.8, 3.1, 0, { w: 2.2 }], ['bench', 0, 24.8, 4.6, 0, { w: 2.2 }],
    ['fridge', 0, 22.5, 8.5, 90], ['counter', 0, 26.2, 9.4, 180, { w: 3 }], ['table', 0, 24.8, 8.0, 0, { w: 1.4, d: 0.8 }],
    ['table', 0, 24.2, 12.5, 0, { w: 1.8, d: 1.0 }], ['table', 0, 24.2, 15.2, 0, { w: 1.8, d: 1.0 }], ['table', 0, 26.4, 12.5, 0, { w: 1.4, d: 1.0 }], ['vending', 0, 27.6, 16.2, 270], ['plant', 0, 22.5, 16.5],
    // ---- 1F stairwells / halls
    ['crate', 0, 9.6, 16.5, 0], ['bench', 0, 20.5, 2.0, 90, { w: 1.6 }],
    // ---- 2F Garage Lounge (the room from the reference shot)
    ['lockers', 1, 0.45, 2.0, 90, { n: 6 }], ['couch', 1, 4.0, 5.9, 180, { color: '#1f4a58' }], ['couch', 1, 1.0, 5.6, 90, { color: '#1f4a58' }], ['pooltable', 1, 5.2, 2.6, 0],
    ['shelf', 1, 8.4, 1.0, 270, { w: 2.0 }], ['tv', 1, 4.0, 6.9, 180], ['table', 1, 2.4, 4.8, 0, { w: 1.0, d: 1.0 }], ['plant', 1, 8.2, 5.8],
    // ---- 2F Armory
    ['shelf', 1, 1.5, 7.55, 0, { w: 2.4, guns: true }], ['shelf', 1, 4.5, 9.45, 180, { w: 2.4, guns: true }], ['crate', 1, 7.6, 7.7, 0, { stack: 2 }], ['crate', 1, 0.8, 9.2, 0], ['table', 1, 5.8, 8.2, 0, { w: 1.4, d: 0.9 }],
    // ---- 2F Gym
    ['bench', 1, 3.0, 12.0, 0, { w: 2.0 }], ['bench', 1, 6.0, 15.0, 90, { w: 2.0 }], ['rack', 1, 1.2, 16.4, 180, { w: 2.4 }], ['treadmill', 1, 7.7, 11.4, 270], ['treadmill', 1, 7.7, 13.0, 270], ['mat', 1, 3.6, 15.0, 0],
    // ---- 2F Conference / Copy / Manager / Server
    ['table', 1, 15.0, 3.0, 0, { w: 4, d: 1.4 }], ['chair', 1, 13.5, 4.2, 180], ['chair', 1, 16.5, 4.2, 180], ['chair', 1, 13.5, 1.8, 0], ['chair', 1, 16.5, 1.8, 0], ['plant', 1, 12.5, 6.3], ['tv', 1, 15.0, 0.1, 0],
    ['copier', 1, 13.4, 7.6, 0], ['copier', 1, 17.2, 9.4, 180], ['shelf', 1, 15.5, 9.45, 180, { w: 2 }],
    ['desk', 1, 13.6, 15.8, 180, { w: 2.2 }], ['couch', 1, 12.9, 11.2, 90, { color: '#35302a' }], ['plant', 1, 15.4, 16.5], ['shelf', 1, 14.9, 11.5, 270, { w: 2 }],
    ['server', 1, 16.6, 16.4, 90, { n: 4 }], ['server', 1, 18.4, 14.6, 270, { n: 4 }], ['server', 1, 17.0, 11.0, 0, { n: 2 }],
    // ---- 2F East wing
    ['stalls', 1, 22.5, 1.0, 90, { n: 3 }], ['bench', 1, 25.0, 3.8, 0, { w: 2 }], ['vending', 1, 27.6, 8.0, 270], ['vending', 1, 22.4, 8.5, 90],
    ['bar', 1, 25.0, 16.0, 0, { w: 4 }], ['table', 1, 23.4, 12.4, 0, { w: 1.2, d: 1.2 }], ['table', 1, 26.0, 12.4, 0, { w: 1.2, d: 1.2 }], ['couch', 1, 27.1, 14.0, 270, { color: '#6a2a2a' }],
    // ---- landings
    ['plant', 1, 9.4, 16.5], ['plant', 1, 20.6, 16.5],
  ],
  // yard (building-relative, may be negative): cover and scenery
  yard: [
    ['car', 0, -6, 5, 0, { color: '#3d3d3d' }], ['car', 0, -9, 5, 0, { color: '#c9c3a8' }], ['container', 0, -8, 12, 90, { color: '#3b6a8a' }], ['container', 0, -8, 19, 90, { color: '#8a5a2c' }],
    ['barrier', 0, 4, -5, 0, { w: 3 }], ['barrier', 0, 12, -4, 0, { w: 3 }], ['barrier', 0, 20, -5, 0, { w: 3 }], ['dumpster', 0, 32, 2, 90], ['dumpster', 0, 32, 7, 90],
    ['container', 0, 33, 12, 90, { color: '#7c2b2b' }], ['container', 0, 33, 19, 90, { color: '#3b6a8a' }], ['crate', 0, 31, 24, 0, { stack: 2 }], ['crate', 0, 3, 22, 0, { stack: 2 }],
    ['car', 0, 6, 24, 90, { color: '#a4161a' }], ['car', 0, 22, 24, 90, { color: '#1c3c5c' }], ['barrier', 0, 14, 23, 0, { w: 3 }], ['barrier', 0, 26, 24, 0, { w: 3 }],
    ['shack', 0, 30, -4, 0], ['pole', 0, 0, -2], ['pole', 0, 28, -2], ['pole', 0, 28, 20], ['pole', 0, -2, 20], ['tree', 0, -10, 1], ['tree', 0, 37, 21], ['tree', 0, -10, 25], ['tree', 0, 14, -9],
    ['crate', 0, 10, 20, 0], ['crate', 0, 11, 20, 0], ['tires', 0, 24, 20, 0], ['barrel', 0, 2, 19, 0], ['barrel', 0, 3, 20, 0],
  ],
};
