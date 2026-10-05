// Visuals for doors, gadgets in the world, grenades in flight and drones. Everything is built
// from a handful of boxes and cylinders; the simulation's `state` decides what lights up.
import * as E from '../../../engine/index.js';
import { STOREY } from '../world/grid.js';

const M = {};
const mat = (name, o) => (M[name] ||= new E.Material({ name, ...o }));
const MATS = {
  orange: () => mat('devOrange', { color: '#c4631c', roughness: 0.5, metallic: 0.3 }),
  grey: () => mat('devGrey', { color: '#7b8087', roughness: 0.45, metallic: 0.6 }),
  dark: () => mat('devDark', { color: '#17191c', roughness: 0.5, metallic: 0.3 }),
  olive: () => mat('devOlive', { color: '#4f5638', roughness: 0.6 }),
  green: () => mat('devGreen', { color: '#2f6a36', roughness: 0.5 }),
  yellow: () => mat('devYellow', { color: '#d6b020', roughness: 0.5 }),
  red: () => mat('devRed', { color: '#a82a22', roughness: 0.5 }),
  ledR: () => mat('ledRed', { color: '#300', emissive: '#ff2a1a', emissiveStrength: 5 }),
  ledG: () => mat('ledGreen2', { color: '#031', emissive: '#3dff6a', emissiveStrength: 5 }),
  ledB: () => mat('ledBlue', { color: '#013', emissive: '#4aa8ff', emissiveStrength: 5 }),
  ledA: () => mat('ledAmber', { color: '#310', emissive: '#ffb030', emissiveStrength: 5 }),
  laser: () => mat('laser', { color: '#400', emissive: '#ff2020', emissiveStrength: 8, opacity: 0.7 }),
  wire: () => mat('wireY', { color: '#443', emissive: '#80d0ff', emissiveStrength: 3 }),
  steel: () => mat('devSteel', { color: '#9aa2aa', roughness: 0.3, metallic: 0.95 }),
  door: () => mat('doorLeaf', { color: '#5c3b24', roughness: 0.7, pattern: 'planks', patternScale: 9, patternColor: '#2a190c' }),
  plank: () => mat('plank', { color: '#8a6a40', pattern: 'planks', patternScale: 6, patternColor: '#31220f', roughness: 0.85 }),
  armor: () => mat('armorPanel', { color: '#59626b', metallic: 0.8, roughness: 0.35, pattern: 'metal', patternScale: 3 }),
  shieldGl: () => mat('dShieldGlass', { color: '#4a6a7c', roughness: 0.05, metallic: 0.4, opacity: 0.55, doubleSided: true }),
};
const box = (w, h, d, m, p = [0, 0, 0], r = null) => { const x = new E.Mesh(E.box({ width: w, height: h, depth: d, bevel: Math.min(w, h, d) * 0.12 }), m, 'part'); x.position.set(p); if (r) x.setEuler(...r); x.castShadow = false; return x; };
const cyl = (r, h, m, p = [0, 0, 0], r2 = r, seg = 12) => { const x = new E.Mesh(E.cylinder({ radiusTop: r, radiusBottom: r2, height: h, radialSegments: seg }), m, 'part'); x.position.set(p); x.castShadow = false; return x; };

function buildDevice(d, w) {
  const n = new E.Node('dev:' + d.kind), add = (...xs) => { for (const x of xs) n.add(x); return n; };
  switch (d.kind) {
    case 'thermite': add(cyl(0.05, 0.14, MATS.orange(), [0, 0, 0], 0.05), cyl(0.056, 0.02, MATS.dark(), [0, 0.08, 0]), box(0.04, 0.02, 0.01, MATS.ledR(), [0, 0.0, 0.05])); n.userData.axis = 'z'; break;
    case 'breach': case 'cluster': add(box(0.2, 0.13, 0.06, d.kind === 'breach' ? MATS.red() : MATS.olive()), box(0.04, 0.04, 0.02, MATS.ledA(), [0.05, 0.03, 0.04]), box(0.08, 0.02, 0.02, MATS.dark(), [-0.04, -0.03, 0.04])); break;
    case 'claymore': add(box(0.22, 0.12, 0.05, MATS.olive()), box(0.18, 0.02, 0.01, MATS.dark(), [0, 0, 0.03]), box(0.03, 0.03, 0.04, MATS.ledR(), [0, 0.07, 0])); break;
    case 'edd': { add(box(0.1, 0.1, 0.06, MATS.dark()), box(0.03, 0.03, 0.02, MATS.ledR(), [0, 0, 0.04])); break; }
    case 'mat': add(box(0.8, 0.03, 0.55, MATS.dark(), [0, 0.015, 0])); for (let i = 0; i < 18; i++) add(cyl(0.012, 0.07, MATS.steel(), [(i % 6 - 2.5) * 0.12, 0.06, (Math.floor(i / 6) - 1) * 0.16], 0.002, 5)); break;
    case 'barbwire': add(cyl(0.012, 1.1, MATS.steel(), [0, 0.2, 0]), cyl(0.2, 0.8, MATS.steel(), [0, 0.2, 0], 0.2, 8)); n.children[1].setEuler(0, 0, 90); n.children[1].material = MATS.dark(); for (let i = -3; i <= 3; i++) add(box(0.01, 0.12, 0.01, MATS.steel(), [i * 0.15, 0.22, 0.04], [0, 0, i * 20])); break;
    case 'jammer': add(box(0.26, 0.12, 0.26, MATS.dark(), [0, 0.06, 0]), cyl(0.01, 0.4, MATS.steel(), [0.08, 0.3, 0.08]), box(0.05, 0.03, 0.02, MATS.ledB(), [0, 0.1, 0.14])); break;
    case 'cams': add(cyl(0.07, 0.1, MATS.dark(), [0, 0, 0.04]), box(0.04, 0.04, 0.02, MATS.ledR(), [0, 0.05, 0.1])); n.children[0].setEuler(90, 0, 0); break;
    case 'dshield': add(box(1.2, 1.05, 0.08, MATS.armor(), [0, 0.52, 0]), box(0.5, 0.09, 0.09, MATS.shieldGl(), [0, 0.86, 0]), box(0.08, 0.5, 0.35, MATS.dark(), [0.45, 0.25, -0.2]), box(0.08, 0.5, 0.35, MATS.dark(), [-0.45, 0.25, -0.2])); break;
    case 'turret': add(box(0.4, 0.06, 0.4, MATS.dark(), [0, 0.03, 0]), cyl(0.02, 0.7, MATS.steel(), [0, 0.38, 0])); { const head = new E.Node('head'); head.position.set([0, 0.78, 0]); head.add(box(0.2, 0.16, 0.3, MATS.dark()), box(0.04, 0.04, 0.4, MATS.steel(), [0, 0, 0.3]), box(0.04, 0.04, 0.02, MATS.ledR(), [0, 0.1, 0.12])); n.add(head); n.userData.head = head; } break;
    case 'shockwire': { // a zig-zag along the wall panels of the unit
      const ps = w.units.get(d.data.unit) || [];
      for (const p of ps) { if (p.dead || p.iy % STOREY !== 1) continue; const c = w.panelCenter(p); const a = p.ax === 'x'; for (let i = 0; i < 6; i++) { const wire = box(a ? 0.02 : 0.2, 0.02, a ? 0.2 : 0.02, MATS.wire(), [0, 0, 0]); wire.userData.world = [c[0] + (a ? d.n[0] * 0.14 : (i - 2.5) * 0.17), c[1] + (i % 2 ? 0.25 : -0.25), c[2] + (a ? (i - 2.5) * 0.17 : d.n[2] * 0.14)]; n.userData.wires = n.userData.wires || []; n.userData.wires.push(wire); } }
      n.userData.absolute = true; break; }
    case 'mines': add(cyl(0.14, 0.04, MATS.green(), [0, 0.02, 0]), box(0.04, 0.02, 0.04, MATS.ledG(), [0, 0.05, 0])); break;
    case 'healstation': add(box(0.4, 0.5, 0.4, MATS.green(), [0, 0.25, 0]), box(0.05, 0.22, 0.02, mat('crossW', { color: '#fff', emissive: '#bfffd0', emissiveStrength: 2 }), [0, 0.3, 0.21]), box(0.22, 0.05, 0.02, mat('crossW2', { color: '#fff', emissive: '#bfffd0', emissiveStrength: 2 }), [0, 0.3, 0.215])); break;
    case 'alarm': add(box(0.12, 0.06, 0.12, MATS.dark(), [0, 0.03, 0]), box(0.03, 0.02, 0.03, MATS.ledA(), [0, 0.07, 0])); break;
    case 'armorpack': add(box(0.3, 0.12, 0.22, MATS.olive(), [0, 0.06, 0]), box(0.1, 0.05, 0.05, MATS.yellow(), [0, 0.14, 0])); break;
    case 'shockdrone': add(box(0.22, 0.08, 0.28, MATS.dark(), [0, 0.07, 0]), cyl(0.05, 0.04, MATS.dark(), [0.12, 0.04, 0.08]), cyl(0.05, 0.04, MATS.dark(), [-0.12, 0.04, 0.08]), cyl(0.05, 0.04, MATS.dark(), [0.12, 0.04, -0.08]), cyl(0.05, 0.04, MATS.dark(), [-0.12, 0.04, -0.08]), box(0.05, 0.02, 0.02, MATS.ledB(), [0, 0.1, 0.14])); break;
    default: add(box(0.12, 0.12, 0.12, MATS.grey()));
  }
  return n;
}
function buildProj(p) {
  const n = new E.Node('proj');
  const body = {
    frag: () => [cyl(0.035, 0.1, MATS.green(), [0, 0, 0], 0.035, 10), cyl(0.012, 0.03, MATS.steel(), [0, 0.06, 0])],
    stun: () => [cyl(0.03, 0.12, MATS.dark(), [0, 0, 0], 0.03, 10), cyl(0.032, 0.03, MATS.yellow(), [0, 0.01, 0], 0.032, 10)],
    smoke: () => [cyl(0.032, 0.13, mat('smokeG', { color: '#8a8d90', roughness: 0.5, metallic: 0.3 }), [0, 0, 0], 0.032, 10)],
    impact: () => [cyl(0.034, 0.1, MATS.orange(), [0, 0, 0], 0.034, 10)],
    sonar: () => [cyl(0.034, 0.11, mat('sonarB', { color: '#2a5a9a', metallic: 0.3, roughness: 0.5 }), [0, 0, 0], 0.034, 10), box(0.03, 0.02, 0.02, MATS.ledB(), [0, 0.04, 0.03])],
    nitro: () => [box(0.12, 0.05, 0.08, MATS.yellow()), box(0.03, 0.02, 0.02, MATS.ledR(), [0.04, 0.03, 0])],
    launcher: () => [cyl(0.03, 0.07, MATS.orange(), [0, 0, 0], 0.03, 8)],
    xpellet: () => [cyl(0.014, 0.03, MATS.steel(), [0, 0, 0], 0.014, 6)],
  }[p.kind] || (() => [box(0.08, 0.08, 0.08, MATS.grey())]);
  for (const m of body()) n.add(m);
  return n;
}

export class DeviceViews {
  constructor(game) {
    this.game = game; this.doors = new Map(); this.devs = new Map(); this.projs = new Map(); this.drones = new Map();
    const w = game.sim.world, scene = game.scene, sim = game.sim;
    this.root = new E.Node('Devices'); scene.add(this.root);
    for (const d of w.doors) this.addDoor(d);
    sim.on('place', (e) => this.addDevice(e.device));
    sim.on('devicekill', (e) => this.removeDevice(e.device));
    sim.on('barricade', (e) => { if (e.door) this.syncBarricade(e.door); });
    sim.on('door', (e) => { if (e.unbarricaded) this.syncBarricade(e.door); });
  }
  addDoor(d) {
    const pivot = new E.Node('Door'), swing = ((d.ix * 7 + d.iz * 13) & 1) ? 1 : -1, hingeEnd = ((d.ix + d.iz) & 1) ? 1 : 0;
    const w = this.game.sim.world, x = d.ax === 'x';
    const lat0 = x ? d.iz : d.ix;
    const leaf = new E.Node('Leaf');
    const body = new E.Mesh(E.box({ width: x ? 0.045 : 0.9, height: 2.0, depth: x ? 0.9 : 0.045, bevel: 0.01 }), MATS.door(), 'door'); body.position.set([x ? 0 : 0.47 * (hingeEnd ? -1 : 1), 1.0, x ? 0.47 * (hingeEnd ? -1 : 1) : 0]);
    const handle = box(x ? 0.1 : 0.04, 0.04, x ? 0.04 : 0.1, MATS.steel(), [x ? 0 : (hingeEnd ? -0.8 : 0.8), 1.0, x ? (hingeEnd ? -0.8 : 0.8) : 0]);
    leaf.add(body, handle);
    pivot.add(leaf);
    // hinge at one end of the 1 m opening
    pivot.position.set(x ? [d.ix, d.f * STOREY, lat0 + (hingeEnd ? 1 - 0.04 : 0.04)] : [lat0 + (hingeEnd ? 1 - 0.04 : 0.04), d.f * STOREY, d.iz]);
    const plank = new E.Node('Boards'); plank.visible = false;
    for (let i = 0; i < 4; i++) plank.add(box(x ? 0.06 : 0.95, 0.12, x ? 0.95 : 0.06, MATS.plank(), [x ? 0.04 : (hingeEnd ? -0.5 : 0.5), 0.35 + i * 0.4, x ? (hingeEnd ? -0.5 : 0.5) : 0.04], [0, 0, i % 2 ? 3 : -3]));
    pivot.add(plank);
    pivot.userData = { d, swing, hingeEnd, leaf, plank, x };
    this.root.add(pivot); this.doors.set(d.id, pivot);
  }
  syncBarricade(d) {
    const p = this.doors.get(d.id); if (!p) return;
    p.userData.plank.visible = d.barricade > 0;
    for (const c of p.userData.plank.children) c.material = d.armored ? MATS.armor() : MATS.plank();
  }
  // dark splits across a door leaf, one more each time it gets worse
  gash(p, stage) {
    const { leaf, x, hingeEnd } = p.userData, sgn = hingeEnd ? -1 : 1, rnd = (a) => (Math.random() - 0.5) * a;
    for (let i = 0; i < stage; i++) {
      const along = 0.47 * sgn + rnd(0.5), y = 0.55 + rnd(1.0) + i * 0.3, ang = rnd(80);
      const gm = mat('gash', { color: '#1d1209', roughness: 1 }), g = x ? box(0.054, 0.03, 0.34, gm, [0, y, along], [ang, 0, 0]) : box(0.34, 0.03, 0.054, gm, [along, y, 0], [0, 0, ang]);
      leaf.add(g);
    }
  }
  addDevice(d) {
    const w = this.game.sim.world, n = buildDevice(d, w);
    n.userData.dev = d; this.root.add(n); this.devs.set(d.id, n);
    if (n.userData.wires) for (const x of n.userData.wires) { x.position.set(x.userData.world); n.add(x); }
    this.orient(n, d);
  }
  orient(n, d) {
    if (n.userData.absolute) { n.position.set([0, 0, 0]); return; }
    n.position.set(d.pos);
    // align the device's +Z with the surface normal
    const q = E.quat.rotationTo(E.quat.create(), [0, 0, 1], d.n);
    if (Math.abs(d.n[1]) > 0.7) { E.quat.fromEuler(n.rotation, d.n[1] > 0 ? 0 : 180, (d.data.yaw || 0) * 180 / Math.PI, 0); } else n.rotation.set(q);
  }
  removeDevice(d) { const n = this.devs.get(d.id); if (n) { this.root.remove(n); this.devs.delete(d.id); } }
  update(dt) {
    const sim = this.game.sim, dv = sim.devices;
    for (const [id, p] of this.doors) {
      const { d, swing, leaf } = p.userData;
      const a = d.dead ? 0 : d.open * 96 * swing;
      leaf.setEuler(0, a, 0);
      // a door that has taken a beating shows it: gashes through the leaf, and boards that fall away
      const p0 = d.panels[0];
      if (p0 && !d.dead && p0.max) {
        const stage = Math.min(3, Math.floor((1 - Math.max(0, p0.hp) / p0.max) * 4));
        if (stage > (p.userData.dmg || 0)) { p.userData.dmg = stage; this.gash(p, stage); }
      }
      if (d.barricade > 0 && p.userData.plank.visible) {
        const left = Math.max(1, Math.ceil(4 * Math.max(0, d.barricadeHp) / (d.barricadeMax || d.barricadeHp || 1)));
        p.userData.plank.children.forEach((c, i) => { c.visible = i < left; });
      }
      p.visible = !d.dead || d.barricade > 0;
      if (d.dead && p.userData.broken !== true) { p.userData.broken = true; p.visible = false; }
    }
    for (const [id, n] of this.devs) {
      const d = n.userData.dev; if (d.dead) continue;
      if (d.kind === 'turret' && n.userData.head) n.userData.head.setEuler(0, d.data.aim * 180 / Math.PI, 0);
      if (d.kind === 'thermite' && d.data.burning) { n.children[0].material = mat('thermHot', { color: '#fff', emissive: '#ffb050', emissiveStrength: 12 }); }
      if (d.kind === 'edd') { // laser across the doorway while armed
        if (!n.userData.laser) { const l = box(d.data.ax === 'x' ? 1.0 : 0.012, 0.012, d.data.ax === 'x' ? 0.012 : 1.0, MATS.laser(), [0, 0, 0]); l.userData.abs = true; n.userData.laser = l; this.root.add(l); }
        n.userData.laser.position.set([d.pos[0], d.pos[1], d.pos[2]]);
      }
      n.visible = !(d.team !== sim.player?.team && d.age < 0 && false);
    }
    // grenades in flight
    const seen = new Set();
    for (const p of dv.proj) {
      seen.add(p.id); let n = this.projs.get(p.id);
      if (!n) { n = buildProj(p); this.root.add(n); this.projs.set(p.id, n); }
      n.position.set(p.pos); if (!p.stuck) E.quat.fromEuler(n.rotation, p.t * 300, p.t * 220, 0); else n.rotation.set(E.quat.rotationTo(E.quat.create(), [0, 1, 0], p.n || [0, 1, 0]));
    }
    for (const [id, n] of this.projs) if (!seen.has(id)) { this.root.remove(n); this.projs.delete(id); }
    for (const [id, n] of this.devs) { const d = n.userData.dev; if (d.dead) { this.root.remove(n); this.devs.delete(id); if (n.userData.laser) this.root.remove(n.userData.laser); } }
    // drones
    const ds = new Set();
    for (const dr of dv.drones) {
      ds.add(dr.id); let n = this.drones.get(dr.id);
      if (!n) { n = new E.Node('drone'); n.add(box(0.26, 0.1, 0.3, MATS.dark(), [0, 0.1, 0]), cyl(0.07, 0.05, MATS.dark(), [0.15, 0.06, 0.1]), cyl(0.07, 0.05, MATS.dark(), [-0.15, 0.06, 0.1]), cyl(0.07, 0.05, MATS.dark(), [0.15, 0.06, -0.1]), cyl(0.07, 0.05, MATS.dark(), [-0.15, 0.06, -0.1]), box(0.06, 0.04, 0.04, dr.team === 'atk' ? MATS.ledB() : MATS.ledR(), [0, 0.17, 0.12])); this.root.add(n); this.drones.set(dr.id, n); }
      n.position.set(dr.pos); n.setEuler(0, dr.yaw * 180 / Math.PI, 0);
    }
    for (const [id, n] of this.drones) if (!ds.has(id)) { this.root.remove(n); this.drones.delete(id); }
  }
  clear() { this.game.scene.remove(this.root); }
}
