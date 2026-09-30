// The first-person arms and sword. A Character that owns only sleeves, gloves and hands, on the
// same skeleton as everybody else; the sword is a prop in its right hand. The game places it in
// front of the camera every frame (shrunk towards the eye, so it never pokes through walls
// while looking exactly the same), and drives it with baked key-pose clips.
import * as E from '../../engine/index.js';
import { personDefinition } from './people/outfits.js';
import { BASE_SKELETON } from './people/skeleton.js';
import { makeSword, HAND_SOCKET } from './people/weapons.js';

const EYE = 1.68;               // eye height in the arms' model space
const KEEP = /^(Sleeve|Palm|Thumb|Index|Middle|Ring|Pinky)/;
const R = (target, handRot, pole = [-0.7, -0.6, -0.2]) => ({ target, pole, handRot });
const L = (target, handRot, pole = [0.7, -0.6, -0.2]) => ({ target, pole, handRot });
const REST = {
  bones: { hips: [0, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], 'shoulder*': [0, 0, 0], 'upperArm*': [3, 0, 6], 'foreArm*': [-14, 0, 0], 'hand*': [-6, 0, 0] },
  hips: [0, 0.965, 0], legs: { L: null, R: null }, hands: { L: 'relaxed', R: 'gunGrip' },
};
const IDLE_R = R([-0.27, 1.38, 0.5], [-66, 30, 26]);
const IDLE_L = L([0.3, 1.3, 0.3], [-50, 0, -20]);

function bake() {
  const sk = new E.Skeleton(E.expandSkeleton(BASE_SKELETON));
  const K = (name, frames, o) => E.keyPoseClip(sk, name, frames, o);
  const idle = { ...REST, arms: { R: IDLE_R, L: IDLE_L } };
  const out = [];
  out.push(K('Idle', [{ t: 0, ...idle }, { t: 1.6, arms: { R: R([-0.27, 1.39, 0.51], [-65, 30, 26]), L: IDLE_L }, bones: { chest: [3, 0, 0] } }, { t: 3.2, ...idle }], { loop: true }));
  out.push(K('Slash1', [
    { t: 0, ...idle },
    { t: 0.14, arms: { R: R([-0.42, 1.52, 0.34], [-104, -34, 24]), L: L([0.3, 1.2, 0.2], [-40, 0, -20]) }, bones: { chest: [0, -18, 0], spine: [2, -8, 0] } },
    { t: 0.26, arms: { R: R([0.28, 1.4, 0.66], [-78, 58, -34]) }, bones: { chest: [3, 22, 0], spine: [2, 8, 0] } },
    { t: 0.4, arms: { R: R([0.36, 1.38, 0.6], [-70, 64, -34]) }, bones: { chest: [3, 26, 0] } },
    { t: 0.66, ...idle },
  ], { events: [{ t: 0.24, name: 'hit' }] }));
  out.push(K('Slash2', [
    { t: 0, ...idle },
    { t: 0.14, arms: { R: R([0.3, 1.48, 0.5], [-90, 60, -30]), L: L([0.3, 1.2, 0.2], [-40, 0, -20]) }, bones: { chest: [2, 20, 0], spine: [2, 8, 0] } },
    { t: 0.26, arms: { R: R([-0.46, 1.36, 0.64], [-74, -52, 28]) }, bones: { chest: [3, -24, 0], spine: [2, -10, 0] } },
    { t: 0.4, arms: { R: R([-0.5, 1.34, 0.6], [-70, -58, 28]) }, bones: { chest: [3, -28, 0] } },
    { t: 0.66, ...idle },
  ], { events: [{ t: 0.24, name: 'hit' }] }));
  out.push(K('Slash3', [
    { t: 0, ...idle },
    { t: 0.22, arms: { R: R([-0.16, 1.98, 0.3], [-172, 4, 0]), L: L([0.06, 1.9, 0.34], [-160, 0, 0]) }, hands: { L: 'gunGrip', R: 'gunGrip' }, bones: { chest: [-14, 0, 0], spine: [-6, 0, 0], head: [-6, 0, 0] } },
    { t: 0.36, arms: { R: R([-0.14, 1.32, 0.74], [-42, 0, 0]), L: L([0.02, 1.28, 0.66], [-42, 0, 0]) }, bones: { chest: [20, 0, 0], spine: [8, 0, 0], head: [6, 0, 0] } },
    { t: 0.55, arms: { R: R([-0.14, 1.28, 0.74], [-38, 0, 0]), L: L([0.02, 1.24, 0.66], [-38, 0, 0]) } },
    { t: 0.9, ...idle, hands: { L: 'relaxed', R: 'gunGrip' } },
  ], { events: [{ t: 0.34, name: 'hit' }] }));
  out.push(K('Thrust', [
    { t: 0, ...idle },
    { t: 0.16, arms: { R: R([-0.24, 1.4, 0.24], [-88, 8, 4]), L: L([0.3, 1.2, 0.2], [-40, 0, -20]) }, bones: { chest: [0, -14, 0], spine: [2, -6, 0] } },
    { t: 0.28, arms: { R: R([-0.14, 1.5, 0.95], [-92, 2, 0]) }, bones: { chest: [8, 10, 0], spine: [5, 5, 0] } },
    { t: 0.45, arms: { R: R([-0.14, 1.5, 0.92], [-92, 2, 0]) } },
    { t: 0.75, ...idle },
  ], { events: [{ t: 0.27, name: 'hit' }] }));
  out.push(K('Block', [
    { t: 0, ...idle },
    { t: 0.12, arms: { R: R([-0.06, 1.62, 0.5], [-112, 30, 34]), L: L([0.22, 1.5, 0.42], [-90, 0, -30]) }, hands: { L: 'flat', R: 'gunGrip' }, bones: { chest: [4, -8, 0], head: [4, 0, 0] } },
    { t: 0.3, arms: { R: R([-0.06, 1.62, 0.5], [-112, 30, 34]) } },
  ]));
  out.push(K('BlockHit', [
    { t: 0, arms: { R: R([-0.06, 1.62, 0.5], [-112, 30, 34]), L: L([0.22, 1.5, 0.42], [-90, 0, -30]) }, hands: { L: 'flat', R: 'gunGrip' }, bones: { chest: [4, -8, 0], head: [4, 0, 0] }, hips: [0, 0.965, 0] },
    { t: 0.06, arms: { R: R([-0.02, 1.58, 0.4], [-118, 34, 40]) }, bones: { chest: [-4, -10, 0] } },
    { t: 0.2, arms: { R: R([-0.06, 1.62, 0.5], [-112, 30, 34]) } },
  ]));
  out.push(K('Stagger', [{ t: 0, ...idle }, { t: 0.1, arms: { R: R([-0.3, 1.2, 0.3], [-50, 10, 10]), L: L([0.4, 1.3, 0.2], [-30, 0, -40]) }, bones: { chest: [-8, 4, 3] } }, { t: 0.5, ...idle }]));
  out.push(K('Dash', [{ t: 0, ...idle }, { t: 0.1, arms: { R: R([-0.3, 1.3, 0.1], [-40, 10, 10]), L: L([0.36, 1.2, 0.05], [-40, 0, -20]) }, bones: { chest: [14, 0, 0], spine: [8, 0, 0] } }, { t: 0.4, ...idle }]));
  out.push(K('Slam', [
    { t: 0, ...idle },
    { t: 0.3, arms: { R: R([-0.16, 2.0, 0.24], [-176, 0, 0]), L: L([0.1, 1.95, 0.28], [-165, 0, 0]) }, hands: { L: 'gunGrip', R: 'gunGrip' }, bones: { chest: [-18, 0, 0], head: [-8, 0, 0] } },
    { t: 0.5, arms: { R: R([-0.1, 1.05, 0.7], [-20, 0, 0]), L: L([0.05, 1.05, 0.66], [-20, 0, 0]) }, bones: { chest: [30, 0, 0], spine: [14, 0, 0], head: [10, 0, 0] } },
    { t: 0.9, arms: { R: R([-0.1, 1.05, 0.7], [-20, 0, 0]), L: L([0.05, 1.05, 0.66], [-20, 0, 0]) } },
    { t: 1.3, ...idle, hands: { L: 'relaxed', R: 'gunGrip' } },
  ], { events: [{ t: 0.48, name: 'slam' }] }));
  out.push(K('Veil', [{ t: 0, ...idle }, { t: 0.25, arms: { R: IDLE_R, L: L([0.14, 1.6, 0.5], [-88, 0, -20]) }, hands: { L: 'spread' }, bones: { chest: [-2, 6, 0] } }, { t: 0.7, arms: { R: IDLE_R, L: L([0.1, 1.55, 0.5], [-88, 0, -10]) } }, { t: 1.0, ...idle }], { events: [{ t: 0.3, name: 'cast' }] }));
  out.push(K('Reach', [{ t: 0, ...idle }, { t: 0.18, arms: { R: IDLE_R, L: L([0.06, 1.5, 0.66], [-82, 0, -8]) }, hands: { L: 'flat' } }, { t: 0.5, arms: { R: IDLE_R, L: L([0.06, 1.5, 0.66], [-82, 0, -8]) } }, { t: 0.7, ...idle }], { events: [{ t: 0.2, name: 'touch' }] }));
  out.push(K('Pinch', [{ t: 0, ...idle }, { t: 0.2, arms: { R: IDLE_R, L: L([0.05, 1.5, 0.62], [-85, 0, 0]) }, hands: { L: 'point' } }, { t: 0.4, arms: { R: IDLE_R, L: L([0.05, 1.5, 0.62], [-85, 0, 0]) }, hands: { L: 'fist' } }, { t: 0.7, ...idle }], { events: [{ t: 0.4, name: 'pinch' }] }));
  out.push(K('Draw', [{ t: 0, ...idle, arms: { R: R([-0.3, 0.95, 0.2], [-30, 0, 0]), L: L([0.3, 1.0, 0.1], [-30, 0, 0]) } }, { t: 0.5, ...idle }]));
  out.push(K('Carry', [{ t: 0, ...idle, arms: { R: IDLE_R, L: L([0.02, 1.32, 0.56], [-70, 0, -10]) }, hands: { L: 'claw' } }, { t: 1, bones: { chest: [3, 0, 0] } }, { t: 2, bones: { chest: [2, 0, 0] } }], { loop: true }));
  return out;
}

export function createViewmodel() {
  const def = personDefinition({ outfit: 'rogue', skin: 'pale', poly: 0.8, colors: { leather: '#3a2a20', glove: '#2c2018', cloth2: '#20182a' } });
  def.parts = def.parts.filter((p) => KEEP.test(p.name));
  def.skeleton = BASE_SKELETON;
  def.clips = bake();
  const ch = new E.Character(def, { detail: 1 });
  ch.springs = false;
  for (const p of ch.parts) for (const m of p.meshes) { m.castShadow = false; }
  const sword = makeSword('nightfang');
  const sr = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('swrot')) || '';
  const rot = sr ? sr.split(',').map(Number) : SWORD_ROT;
  ch.attach(sword, 'hand.R', { position: HAND_SOCKET.position, rotation: rot });
  sword.traverse((n) => { if (n.geometry) n.castShadow = false; });
  ch.sword = sword;
  // the game sets `local` (camera * shrink); no parent
  ch.updateWorld = function (pw) { if (pw) E.mat4.multiply(this.world, pw, this.local); else this.world.set(this.local); for (const c of this.children) c.updateWorld(this.world); };
  // the arms are always a little self-lit so they read against the dark
  const glow = (m, k) => { m.emissive = m.color; m.emissiveStrength = k; };
  for (const m of ch.materials.values()) glow(m, 0.22);
  sword.traverse((n) => { if (n.material && n.material.name !== 'Rune') glow(n.material, 0.14); });
  ch.play('Idle', { fade: 0 });
  return ch;
}
const SWORD_ROT = [72, 0, -32];
export const VM = { EYE, SCALE: 0.62 };
