// The first-person arms and sword. A Character that owns only sleeves, gloves and hands, on the
// same skeleton as everybody else; the sword is a prop in its right hand. The game places it in
// front of the camera every frame (shrunk towards the eye, so it never pokes through walls
// while looking exactly the same), and drives it with baked key-pose clips.
import * as E from '../../engine/index.js';
import { personDefinition } from './people/outfits.js';
import { BASE_SKELETON } from './people/skeleton.js';
import { makeSword, makeCrossbow, HAND_SOCKET } from './people/weapons.js';
void HAND_SOCKET;

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
  // ---- the heavy blow: wind it up over the shoulder, hold, then bring it down across the body
  const WIND = { arms: { R: R([-0.46, 1.66, 0.2], [-128, -40, 30]), L: L([0.14, 1.46, 0.42], [-78, 0, -12]) }, hands: { L: 'flat', R: 'gunGrip' }, bones: { chest: [0, -26, 0], spine: [2, -12, 0], head: [0, 6, 0] } };
  out.push(K('HeavyWind', [{ t: 0, ...idle }, { t: 0.22, ...WIND }, { t: 0.5, ...WIND, arms: { R: R([-0.47, 1.68, 0.19], [-130, -41, 31]), L: L([0.14, 1.46, 0.42], [-78, 0, -12]) } }, { t: 0.8, ...WIND }], { loop: false }));
  out.push(K('Heavy', [
    { t: 0, ...WIND },
    { t: 0.1, arms: { R: R([-0.06, 1.52, 0.78], [-86, 24, -6]), L: L([0.3, 1.2, 0.3], [-40, 0, -20]) }, hands: { L: 'relaxed', R: 'gunGrip' }, bones: { chest: [6, 8, 0], spine: [3, 4, 0], head: [2, 0, 0] } },
    { t: 0.2, arms: { R: R([0.4, 1.1, 0.56], [-48, 68, -42]) }, bones: { chest: [12, 32, 0], spine: [6, 12, 0] } },
    { t: 0.42, arms: { R: R([0.42, 1.08, 0.52], [-46, 70, -42]) }, bones: { chest: [12, 34, 0] } },
    { t: 0.78, ...idle },
  ], { events: [{ t: 0.13, name: 'hit' }] }));
  // ---- the execution: both hands on the hilt, straight down into the one who is on his knees
  out.push(K('Execute', [
    { t: 0, ...idle },
    { t: 0.16, arms: { R: R([-0.12, 1.86, 0.34], [-170, 0, 0]), L: L([0.02, 1.82, 0.38], [-165, 0, 0]) }, hands: { L: 'gunGrip', R: 'gunGrip' }, bones: { chest: [-12, 0, 0], spine: [-4, 0, 0], head: [-6, 0, 0] } },
    { t: 0.3, arms: { R: R([-0.1, 1.12, 0.84], [-28, 0, 0]), L: L([0.0, 1.1, 0.8], [-28, 0, 0]) }, bones: { chest: [26, 0, 0], spine: [12, 0, 0], head: [10, 0, 0] } },
    { t: 0.72, arms: { R: R([-0.1, 1.1, 0.82], [-26, 0, 0]), L: L([0.0, 1.08, 0.78], [-26, 0, 0]) } },
    { t: 1.0, ...idle, hands: { L: 'relaxed', R: 'gunGrip' } },
  ], { events: [{ t: 0.3, name: 'exec' }] }));
  // ---- a quick step aside: the arms swing out for balance
  out.push(K('Dodge', [{ t: 0, ...idle }, { t: 0.08, arms: { R: R([-0.34, 1.3, 0.3], [-60, 20, 20]), L: L([0.42, 1.24, 0.24], [-40, 0, -40]) }, bones: { chest: [6, 0, 8], spine: [3, 0, 4] } }, { t: 0.36, ...idle }]));
  // ---- the sword at rest in its sheath: arms hang easy, nothing in the hand
  const HOLD_R = R([-0.26, 1.02, 0.2], [-24, 10, 8]), HOLD_L = L([0.26, 1.02, 0.2], [-24, -10, -8]);
  const hold = { ...REST, arms: { R: HOLD_R, L: HOLD_L }, hands: { L: 'relaxed', R: 'relaxed' } };
  out.push(K('Hold', [{ t: 0, ...hold }, { t: 1.8, arms: { R: R([-0.26, 1.03, 0.21], [-24, 10, 8]), L: HOLD_L }, bones: { chest: [3, 0, 0] } }, { t: 3.6, ...hold }], { loop: true }));
  out.push(K('Unsheathe', [
    { t: 0, ...hold },
    { t: 0.14, arms: { R: R([-0.32, 0.96, 0.12], [-40, 10, 4]), L: HOLD_L }, hands: { R: 'gunGrip', L: 'relaxed' }, bones: { chest: [2, -6, 0] } },
    { t: 0.34, arms: { R: R([-0.42, 1.45, 0.36], [-96, 20, 26]), L: IDLE_L }, hands: { R: 'gunGrip', L: 'relaxed' }, bones: { chest: [0, -10, 0] } },
    { t: 0.5, ...idle },
  ], { events: [{ t: 0.13, name: 'unsheathe' }] }));
  out.push(K('Sheathe', [
    { t: 0, ...idle },
    { t: 0.2, arms: { R: R([-0.22, 1.2, 0.3], [-70, 20, 15]), L: IDLE_L }, bones: { chest: [2, -4, 0] } },
    { t: 0.34, arms: { R: R([-0.32, 0.96, 0.12], [-40, 10, 4]), L: HOLD_L }, hands: { R: 'gunGrip', L: 'relaxed' } },
    { t: 0.52, ...hold },
  ], { events: [{ t: 0.33, name: 'sheathe' }] }));
  // the same one-shots as above, but with the right hand empty and at the hip
  out.push(K('StaggerS', [{ t: 0, ...hold }, { t: 0.1, arms: { R: R([-0.3, 1.0, 0.25], [-30, 10, 10]), L: L([0.4, 1.25, 0.2], [-30, 0, -40]) }, bones: { chest: [-8, 4, 3] } }, { t: 0.5, ...hold }]));
  out.push(K('DashS', [{ t: 0, ...hold }, { t: 0.1, arms: { R: R([-0.3, 1.1, 0.1], [-40, 10, 10]), L: L([0.36, 1.2, 0.05], [-40, 0, -20]) }, bones: { chest: [14, 0, 0], spine: [8, 0, 0] } }, { t: 0.4, ...hold }]));
  out.push(K('VeilS', [{ t: 0, ...hold }, { t: 0.25, arms: { R: HOLD_R, L: L([0.14, 1.6, 0.5], [-88, 0, -20]) }, hands: { L: 'spread' }, bones: { chest: [-2, 6, 0] } }, { t: 0.7, arms: { R: HOLD_R, L: L([0.1, 1.55, 0.5], [-88, 0, -10]) } }, { t: 1.0, ...hold }], { events: [{ t: 0.3, name: 'cast' }] }));
  out.push(K('ReachS', [{ t: 0, ...hold }, { t: 0.18, arms: { R: HOLD_R, L: L([0.06, 1.5, 0.66], [-82, 0, -8]) }, hands: { L: 'flat' } }, { t: 0.5, arms: { R: HOLD_R, L: L([0.06, 1.5, 0.66], [-82, 0, -8]) } }, { t: 0.7, ...hold }], { events: [{ t: 0.2, name: 'touch' }] }));
  out.push(K('PinchS', [{ t: 0, ...hold }, { t: 0.2, arms: { R: HOLD_R, L: L([0.05, 1.5, 0.62], [-85, 0, 0]) }, hands: { L: 'point' } }, { t: 0.4, arms: { R: HOLD_R, L: L([0.05, 1.5, 0.62], [-85, 0, 0]) }, hands: { L: 'fist' } }, { t: 0.7, ...hold }], { events: [{ t: 0.4, name: 'pinch' }] }));
  out.push(K('CarryS', [{ t: 0, ...hold, arms: { R: HOLD_R, L: L([0.02, 1.32, 0.56], [-70, 0, -10]) }, hands: { L: 'claw', R: 'relaxed' } }, { t: 1, bones: { chest: [3, 0, 0] } }, { t: 2, bones: { chest: [2, 0, 0] } }], { loop: true }));
  out.push(K('DodgeS', [{ t: 0, ...hold }, { t: 0.08, arms: { R: R([-0.34, 1.12, 0.3], [-40, 20, 20]), L: L([0.42, 1.2, 0.24], [-40, 0, -40]) }, bones: { chest: [6, 0, 8], spine: [3, 0, 4] } }, { t: 0.36, ...hold }]));
  // ---- the crossbow, held like a hunter holds it: right hand on the grip, left under the prod
  // (the crossbow itself is fixed in front of the eye, see createViewmodel; these clips only place the hands on it)
  const XB = (x, ry, rz, ly, lz) => ({ ...REST, arms: { R: R([x, ry, rz], [-80, 0, 10]), L: L([x + 0.02, ly, lz], [-70, 0, -14]) }, hands: { R: 'gunGrip', L: 'claw' } });
  const xIdle = XB(-0.13, 1.4, 0.34, 1.39, 0.62), xAim = XB(-0.01, 1.53, 0.32, 1.52, 0.6);
  out.push(K('XbowIdle', [{ t: 0, ...xIdle }, { t: 1.6, ...XB(-0.13, 1.405, 0.345, 1.395, 0.625) }, { t: 3.2, ...xIdle }], { loop: true }));
  out.push(K('XbowAim', [{ t: 0, ...xAim }, { t: 1.2, ...XB(-0.01, 1.532, 0.322, 1.522, 0.602) }, { t: 2.4, ...xAim }], { loop: true }));
  out.push(K('XbowFire', [{ t: 0, ...xAim }, { t: 0.05, ...XB(-0.01, 1.55, 0.27, 1.54, 0.55) }, { t: 0.3, ...xAim }]));
  out.push(K('XbowReload', [{ t: 0, ...xIdle }, { t: 0.3, ...XB(-0.13, 1.28, 0.36, 1.39, 0.62) }, { t: 0.6, ...XB(-0.13, 1.36, 0.6, 1.39, 0.62) }, { t: 1.0, ...xIdle }]));
  out.push(K('XbowRaise', [{ t: 0, ...hold }, { t: 0.3, ...xIdle }]));
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
  sword.visible = false; ch.play('Hold', { fade: 0 });
  // the crossbow rides in the same hand when it is raised
  // the crossbow is not in a hand: it sits in front of the eye, stock along the line of sight, and
  // the crossbow module nudges it for recoil, aiming and reloading
  const xb = makeCrossbow(); xb.position.set(XBOW_AT.idle); E.quat.fromEuler(xb.rotation, ...XBOW_ROT); ch.add(xb);
  xb.traverse((n) => { if (n.geometry) n.castShadow = false; if (n.material) glow(n.material, 0.14); }); xb.visible = false; ch.xbow = xb; ch.xbowAt = XBOW_AT;
  return ch;
}
const SWORD_ROT = [72, 0, -32];
const XBOW_ROT = [90, 0, 0];
const XBOW_AT = { idle: [-0.13, 1.44, 0.3], aim: [-0.0, 1.575, 0.28] };
export const VM = { EYE, SCALE: 0.62 };
