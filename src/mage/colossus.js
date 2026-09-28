// The Ice Colossus: the Ice Mage's final form. A seven-metre hulking body of glossy ice,
// modelled from ShapeForge shapes on a hierarchy of pivot nodes (pelvis, torso, head, two
// arms with elbows, two legs with knees) and posed procedurally each frame: walking gait,
// arm raises for smashes and throws, a roar and a stagger.
import * as E from '../../engine/index.js';

export const COLOSSUS_MATERIALS = {
  ice: new E.Material({ name: 'Colossus ice', color: '#8fd0ee', roughness: 0.12, metallic: 0.15, emissive: '#2a7fb8', emissiveStrength: 0.9 }),
  deep: new E.Material({ name: 'Colossus deep ice', color: '#4a86b0', roughness: 0.2, metallic: 0.2, emissive: '#1a4f80', emissiveStrength: 0.7 }),
  crystal: new E.Material({ name: 'Colossus crystal', color: '#d6f4ff', roughness: 0.06, emissive: '#7fd6ff', emissiveStrength: 2.4 }),
  core: new E.Material({ name: 'Colossus core', color: '#bfefff', roughness: 0.4, emissive: '#5ad0ff', emissiveStrength: 9 }),
};
const C = COLOSSUS_MATERIALS;
const sq = (rx, ry, rz, e1 = 0.6, e2 = 0.7) => E.superquadric({ rx, ry, rz, e1, e2, widthSegments: 18, heightSegments: 12 });
const cone = (r, h, seg = 6) => E.cone({ radius: r, height: h, radialSegments: seg, heightSegments: 1 });
const mesh = (geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], name = 'Ice') => { const m = new E.Mesh(geo, mat, name); m.position.set(pos); m.setEuler(...rot); return m; };
const node = (name, pos) => { const n = new E.Node(name); n.position.set(pos); return n; };

export function createColossus() {
  const root = new E.Node('Ice Colossus');
  const pelvis = node('Pelvis', [0, 2.6, 0]); root.add(pelvis);
  pelvis.add(mesh(sq(0.95, 0.55, 0.7), C.deep, [0, 0, 0], [0, 0, 0], 'Pelvis'));
  const torso = node('Torso', [0, 0.4, 0]); pelvis.add(torso);
  torso.add(mesh(sq(1.05, 0.8, 0.8), C.ice, [0, 0.4, 0], [0, 0, 0], 'Belly'));
  torso.add(mesh(sq(1.75, 1.4, 1.1), C.ice, [0, 1.9, 0], [0, 0, 0], 'Chest'));
  torso.add(mesh(E.sphere({ radius: 0.42, widthSegments: 14, heightSegments: 10 }), C.core, [0, 1.85, 0.85], [0, 0, 0], 'Core'));
  for (let i = 0; i < 6; i++) torso.add(mesh(cone(0.3 - i * 0.02, 1.4 + (i % 3) * 0.4), C.crystal, [(i - 2.5) * 0.55, 2.2 + (i % 2) * 0.4, -0.95], [-125 + (i % 2) * 15, (i - 2.5) * 6, 0], 'Back spike'));
  for (const s of [-1, 1]) {
    torso.add(mesh(sq(0.95, 0.7, 0.95), C.deep, [s * 2.05, 3.0, 0], [0, 0, s * 12], 'Shoulder'));
    for (let i = 0; i < 3; i++) torso.add(mesh(cone(0.22, 1.0 + i * 0.3), C.crystal, [s * (1.85 + i * 0.28), 3.55 + i * 0.1, (i - 1) * 0.3], [0, 0, s * -(20 + i * 12)], 'Pauldron spike'));
  }
  const head = node('Head', [0, 3.6, 0.1]); torso.add(head);
  head.add(mesh(sq(0.85, 0.85, 0.85), C.ice, [0, 0.2, 0], [0, 0, 0], 'Skull'));
  head.add(mesh(sq(0.6, 0.35, 0.6), C.deep, [0, -0.5, 0.35], [0, 0, 0], 'Jaw'));
  for (const s of [-1, 1]) {
    head.add(mesh(E.sphere({ radius: 0.15, widthSegments: 10, heightSegments: 8 }), C.core, [s * 0.36, 0.3, 0.72], [0, 0, 0], 'Eye'));
    head.add(mesh(cone(0.2, 1.5, 6), C.crystal, [s * 0.6, 1.0, 0], [0, 0, s * -28], 'Horn'));
  }
  head.add(mesh(cone(0.22, 0.9, 5), C.crystal, [0, 1.15, 0.15], [-10, 0, 0], 'Crown'));
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = node('Shoulder pivot', [s * 2.05, 2.9, 0]); torso.add(shoulder);
    shoulder.add(mesh(sq(0.55, 0.95, 0.55), C.ice, [0, -0.95, 0], [0, 0, 0], 'Upper arm'));
    const elbow = node('Elbow', [0, -1.9, 0]); shoulder.add(elbow);
    elbow.add(mesh(sq(0.6, 0.95, 0.6), C.deep, [0, -0.85, 0], [0, 0, 0], 'Forearm'));
    elbow.add(mesh(sq(0.85, 0.75, 0.85), C.ice, [0, -1.95, 0], [0, 0, 0], 'Fist'));
    for (let i = 0; i < 4; i++) elbow.add(mesh(cone(0.14, 0.55), C.crystal, [(i - 1.5) * 0.3, -2.4, 0.35], [-100, 0, 0], 'Knuckle'));
    elbow.add(mesh(cone(0.2, 0.8), C.crystal, [s * 0.5, -0.4, 0], [0, 0, s * -80], 'Elbow spike'));
    arms.push({ shoulder, elbow, s });
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = node('Hip pivot', [s * 0.85, -0.1, 0]); pelvis.add(hip);
    hip.add(mesh(sq(0.65, 1.2, 0.65), C.ice, [0, -1.15, 0], [0, 0, 0], 'Thigh'));
    const knee = node('Knee', [0, -2.3, 0]); hip.add(knee);
    knee.add(mesh(sq(0.6, 1.0, 0.6), C.deep, [0, -0.95, 0], [0, 0, 0], 'Shin'));
    knee.add(mesh(sq(0.8, 0.3, 1.0), C.ice, [0, -1.85, 0.3], [0, 0, 0], 'Foot'));
    knee.add(mesh(cone(0.18, 0.7), C.crystal, [0, 0.1, 0.55], [80, 0, 0], 'Knee spike'));
    legs.push({ hip, knee, s });
  }
  const all = []; root.traverse((n) => { if (n.material) all.push(n); });
  // state: everything is a number the boss animates; pose() applies it
  const st = { walk: 0, amp: 0, armR: [0, 0], armL: [0, 0], elbowR: 0, elbowL: 0, lean: 0, headPitch: 0, crouch: 0, sway: 0, roll: 0 };
  function pose(t) {
    const bob = Math.sin(st.walk * 2) * 0.12 * st.amp, breathe = Math.sin(t * 1.6) * 0.04;
    pelvis.position.set([Math.sin(st.walk) * 0.12 * st.amp, 2.6 - st.crouch + Math.abs(bob) + breathe, 0]);
    pelvis.setEuler(0, Math.sin(st.walk) * 6 * st.amp, Math.sin(st.walk) * 3 * st.amp + st.roll);
    torso.setEuler(st.lean, -Math.sin(st.walk) * 8 * st.amp, 0);
    head.setEuler(st.headPitch - st.lean * 0.6, Math.sin(t * 0.7) * 5, 0);
    for (const a of arms) {
      const own = a.s > 0 ? st.armL : st.armR, elb = a.s > 0 ? st.elbowL : st.elbowR;
      const swing = Math.sin(st.walk + (a.s > 0 ? 0 : Math.PI)) * 28 * st.amp;
      a.shoulder.setEuler(own[0] + swing, 0, a.s * (own[1] + 6));
      a.elbow.setEuler(-(elb + 12 + Math.max(0, swing) * 0.5), 0, 0);
    }
    for (const l of legs) {
      const ph = Math.sin(st.walk + (l.s > 0 ? Math.PI : 0)), up = Math.max(0, Math.cos(st.walk + (l.s > 0 ? Math.PI : 0)));
      l.hip.setEuler(ph * 32 * st.amp - st.crouch * 18, 0, l.s * 3);
      l.knee.setEuler(up * 45 * st.amp + st.crouch * 36, 0, 0);
    }
  }
  return { root, pelvis, torso, head, arms, legs, st, pose, meshes: all, materials: C, height: 7.2 };
}
