// All the animation clips people share. Locomotion comes from the engine's gait synthesizer;
// everything else is authored as a few key poses with arm/leg IK (choreo.keyPoseClip) and
// baked to ordinary clips, so any outfit on the shared skeleton can play them.
// Model space: +Z forward, +Y up, the character's right hand is at -X. Hand targets are the
// wrist position; handRot is the wrist's world Euler (deg). With a sword in hand, the blade
// points along the hand's local +Z, so handRot [-90,0,0] holds it straight up.
import * as E from '../../../engine/index.js';
import { BASE_SKELETON } from './skeleton.js';

const STAND = {
  bones: { hips: [0, 0, 0], spine: [2, 0, 0], chest: [1, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], 'shoulder*': [0, 0, 0], 'upperArm*': [3, 0, 6], 'foreArm*': [-14, 0, 0], 'hand*': [-6, 0, 0] },
  hips: [0, 0.965, 0], legs: { L: 'plant', R: 'plant' }, arms: { L: null, R: null }, hands: { L: 'relaxed', R: 'relaxed' },
};
const R = (target, handRot, pole = [-0.7, -0.6, -0.2]) => ({ target, pole, handRot });
const Lh = (target, handRot, pole = [0.7, -0.6, -0.2]) => ({ target, pole, handRot });
const GRIP = 'gunGrip';

export function bakeClips() {
  const sk = new E.Skeleton(E.expandSkeleton(BASE_SKELETON));
  const K = (name, frames, o) => E.keyPoseClip(sk, name, frames, o);
  const out = [];
  out.push(E.synthesizeIdle(sk, { name: 'Idle' }));
  out.push(E.synthesizeLocomotion(sk, { name: 'Walk', duration: 1.06, speed: 1.15, stance: 0.6, hipHeight: 0.94, bob: 0.018, center: -0.015 }));
  out.push(E.synthesizeLocomotion(sk, {
    name: 'Run', duration: 0.68, speed: 2.9, stance: 0.36, samples: 20, hipHeight: 0.93, bob: 0.035, bobPhase: 0.18,
    sway: 0.012, lean: 11, pelvisYaw: 9, pelvisRoll: 3, spineCounter: 1.1, stepWidth: 0.09, center: -0.1,
    heelStrike: -6, toeOff: 48, flatStart: 0.2, heelOff: 0.35, swingPitchMid: 30,
    kick: [0, 0.34, -0.16], drive: [0, 0.3, 0.22], armSwing: 38, armBias: -8, armAbduct: 10, elbow: 78, elbowSwing: 22,
    headPitch: 4, handFlex: -15, spineLean: 3, chestLean: 2, hands: 'fist', fingerSwing: 0.04,
  }));
  // a low, wary stalk for guards on patrol and for anyone sneaking (arms held in, hips low)
  out.push(E.synthesizeLocomotion(sk, { name: 'Stalk', duration: 1.3, speed: 0.95, stance: 0.66, hipHeight: 0.86, bob: 0.012, center: -0.02, lean: 6, armSwing: 6, elbow: 30, armBias: 6, spineLean: 5, chestLean: 3, headPitch: -2 }));

  // ---- sword stance & strikes (right hand holds the sword; the left hand is free)
  const guardPose = { arms: { R: R([-0.22, 1.16, 0.42], [-68, 8, 0]), L: Lh([0.2, 1.05, 0.1], [0, 0, 10]) }, hands: { R: GRIP, L: 'relaxed' }, bones: { chest: [2, -14, 0], spine: [3, -6, 0], head: [0, 8, 0] } };
  out.push(K('Guard Idle', [{ t: 0, ...STAND, ...guardPose }, { t: 1.2, arms: { R: R([-0.22, 1.18, 0.43], [-70, 8, 0]) }, bones: { chest: [3, -14, 0] } }, { t: 2.4, ...guardPose }], { loop: true }));
  const windR = R([-0.42, 1.42, 0.1], [-110, -30, 20]);
  out.push(K('Slash A', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.2, arms: { R: windR }, bones: { chest: [0, -34, 0], spine: [0, -14, 0], head: [0, 20, 0] }, legs: { L: { target: [0.11, 0.1, 0.14], pitch: 0 }, R: { target: [-0.13, 0.1, -0.16], pitch: 0 } } },
    { t: 0.36, arms: { R: R([0.12, 1.22, 0.55], [-70, 60, -40]) }, bones: { chest: [4, 30, 0], spine: [2, 14, 0], head: [0, -18, 0] } },
    { t: 0.56, arms: { R: R([0.2, 1.2, 0.5], [-60, 70, -40]) }, bones: { chest: [4, 34, 0] } },
    { t: 0.9, ...STAND, ...guardPose },
  ], { events: [{ t: 0.32, name: 'hit' }] }));
  out.push(K('Slash B', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.2, arms: { R: R([0.08, 1.2, 0.5], [-70, 65, -40]) }, bones: { chest: [3, 30, 0], spine: [2, 12, 0], head: [0, -18, 0] } },
    { t: 0.36, arms: { R: R([-0.4, 1.22, 0.55], [-72, -50, 30]) }, bones: { chest: [3, -34, 0], spine: [2, -14, 0], head: [0, 18, 0] } },
    { t: 0.56, arms: { R: R([-0.44, 1.2, 0.5], [-68, -55, 30]) }, bones: { chest: [3, -36, 0] } },
    { t: 0.9, ...STAND, ...guardPose },
  ], { events: [{ t: 0.32, name: 'hit' }] }));
  out.push(K('Overhead', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.28, arms: { R: R([-0.2, 1.72, 0.06], [-170, 0, 0]), L: Lh([0.12, 1.6, 0.1], [-150, 0, 0]) }, hands: { L: GRIP }, bones: { chest: [-14, -6, 0], spine: [-8, 0, 0], head: [-8, 0, 0] } },
    { t: 0.46, arms: { R: R([-0.16, 1.15, 0.62], [-50, 0, 0]), L: Lh([0.05, 1.12, 0.55], [-50, 0, 0]) }, bones: { chest: [22, 0, 0], spine: [10, 0, 0], head: [8, 0, 0] } },
    { t: 0.7, arms: { R: R([-0.16, 1.1, 0.62], [-40, 0, 0]) } },
    { t: 1.1, ...STAND, ...guardPose },
  ], { events: [{ t: 0.44, name: 'hit' }] }));
  out.push(K('Thrust', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.22, arms: { R: R([-0.26, 1.2, 0.2], [-88, 5, 0]) }, bones: { chest: [0, -20, 0], spine: [2, -8, 0] }, legs: { L: { target: [0.11, 0.1, 0.16], pitch: 0 }, R: { target: [-0.13, 0.1, -0.2], pitch: 0 } } },
    { t: 0.36, arms: { R: R([-0.16, 1.3, 0.72], [-90, 0, 0]) }, bones: { chest: [8, 10, 0], spine: [6, 6, 0] } },
    { t: 0.6, arms: { R: R([-0.16, 1.3, 0.7], [-90, 0, 0]) } },
    { t: 0.95, ...STAND, ...guardPose },
  ], { events: [{ t: 0.34, name: 'hit' }] }));
  out.push(K('Block', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.14, arms: { R: R([-0.05, 1.5, 0.36], [-98, 22, 20]), L: Lh([0.12, 1.38, 0.3], [-90, 0, 0]) }, bones: { chest: [4, -10, 0], head: [6, 0, 0] } },
    { t: 0.6, arms: { R: R([-0.05, 1.5, 0.36], [-98, 22, 20]) } },
  ], { loop: false }));
  out.push(K('Stagger', [
    { t: 0, ...STAND, ...guardPose },
    { t: 0.1, arms: { R: R([-0.3, 1.0, 0.2], [-30, -20, 0]), L: Lh([0.4, 1.2, 0.1], [0, 0, 60]) }, bones: { chest: [-16, 6, 4], spine: [-10, 0, 0], head: [-14, 0, 0] }, hips: [0, 0.94, -0.06] },
    { t: 0.7, ...STAND, ...guardPose },
  ]));
  out.push(E.flinchClip ? E.flinchClip(sk) : K('Flinch', [{ t: 0, ...STAND }, { t: 0.12, bones: { chest: [-12, 0, 0] } }, { t: 0.4, ...STAND }]));

  // ---- surrender & fear
  const up = { arms: { R: R([-0.3, 1.9, 0.14], [-160, 0, 25], [-1, -0.3, -0.2]), L: Lh([0.3, 1.9, 0.14], [-160, 0, -25], [1, -0.3, -0.2]) }, hands: { L: 'spread', R: 'spread' } };
  out.push(K('Hands Up', [
    { t: 0, ...STAND },
    { t: 0.35, ...up, bones: { chest: [-4, 0, 0], head: [-6, 0, 0], neck: [-4, 0, 0] } },
    { t: 1.0, arms: { R: R([-0.31, 1.94, 0.15], [-160, 0, 25], [-1, -0.3, -0.2]), L: Lh([0.31, 1.94, 0.15], [-160, 0, -25], [1, -0.3, -0.2]) } },
    { t: 1.8, ...up },
  ], { loop: true }));
  const cower = { hips: [0, 0.68, -0.06], legs: { L: { target: [0.13, 0.1, 0.1], pole: [0, 0, 1] }, R: { target: [-0.13, 0.1, 0.1], pole: [0, 0, 1] } }, bones: { spine: [30, 0, 0], chest: [20, 0, 0], head: [10, 0, 0], neck: [10, 0, 0] }, arms: { R: R([-0.12, 1.42, 0.2], [-120, 0, 30]), L: Lh([0.12, 1.42, 0.2], [-120, 0, -30]) } };
  out.push(K('Cower', [{ t: 0, ...STAND, ...cower }, { t: 0.7, bones: { spine: [32, 0, 0], chest: [22, 2, 0] } }, { t: 1.4, ...cower }], { loop: true }));

  // ---- sitting, sleeping, praying, working
  const seat = { hips: [0, 0.6, -0.14], legs: { L: { target: [0.12, 0.09, 0.4], pole: [0, 0.2, 1], pitch: 0 }, R: { target: [-0.12, 0.09, 0.4], pole: [0, 0.2, 1], pitch: 0 } }, bones: { hips: [-4, 0, 0], spine: [4, 0, 0], 'upperArm*': [10, 0, 8], 'foreArm*': [-50, 0, 0] } };
  out.push(K('Sit', [{ t: 0, ...STAND, ...seat, arms: { L: Lh([0.2, 0.86, 0.34], [-60, 0, 0]), R: R([-0.2, 0.86, 0.34], [-60, 0, 0]) } }, { t: 2.2, bones: { ...seat.bones, spine: [6, 0, 0], head: [3, 0, 0] } }, { t: 4.4, bones: seat.bones }], { loop: true }));
  out.push(K('Sit Eat', [
    { t: 0, ...STAND, ...seat, arms: { L: Lh([0.2, 0.9, 0.36], [-60, 0, 0]), R: R([-0.2, 0.9, 0.36], [-60, 0, 0]) } },
    { t: 0.9, arms: { R: R([-0.05, 1.5, 0.22], [-110, 0, 0]) }, bones: { ...seat.bones, head: [10, 0, 0] } },
    { t: 1.5, arms: { R: R([-0.05, 1.5, 0.22], [-110, 0, 0]) } },
    { t: 2.4, arms: { R: R([-0.2, 0.9, 0.36], [-60, 0, 0]) }, bones: seat.bones },
    { t: 3.6, bones: seat.bones },
  ], { loop: true }));
  out.push(K('Sleep', [{ t: 0, ...STAND, arms: { L: Lh([0.12, 1.2, 0.18], [-40, 0, 0]), R: R([-0.12, 1.2, 0.18], [-40, 0, 0]) }, bones: { chest: [0, 0, 0], head: [0, 12, 0] } }, { t: 2.5, bones: { chest: [3, 0, 0], head: [2, 12, 0] } }, { t: 5, bones: { chest: [0, 0, 0], head: [0, 12, 0] } }], { loop: true }));
  const kneel = { hips: [0, 0.6, 0.02], legs: { L: { target: [0.11, 0.06, -0.3], pole: [0, 0, 1], pitch: 60 }, R: { target: [-0.11, 0.06, -0.3], pole: [0, 0, 1], pitch: 60 } }, bones: { spine: [8, 0, 0], head: [22, 0, 0], neck: [8, 0, 0] }, arms: { R: R([-0.05, 1.3, 0.32], [-70, 0, 20]), L: Lh([0.05, 1.3, 0.32], [-70, 0, -20]) }, hands: { L: 'flat', R: 'flat' } };
  out.push(K('Pray', [{ t: 0, ...STAND, ...kneel }, { t: 2, bones: { spine: [12, 0, 0], head: [28, 0, 0], neck: [10, 0, 0] } }, { t: 4, ...kneel }], { loop: true }));
  out.push(K('Hammer', [
    { t: 0, ...STAND, arms: { R: R([-0.22, 1.36, 0.28], [-100, 0, 0]), L: Lh([0.2, 1.05, 0.34], [-60, 0, -20]) }, hands: { R: GRIP }, bones: { chest: [-4, -6, 0] } },
    { t: 0.4, arms: { R: R([-0.24, 1.78, 0.02], [-160, 0, 0]) }, bones: { chest: [-14, -6, 0], head: [-6, 0, 0] } },
    { t: 0.55, arms: { R: R([-0.16, 1.0, 0.5], [-40, 0, 0]) }, bones: { chest: [16, 0, 0], head: [10, 0, 0] } },
    { t: 0.7, arms: { R: R([-0.16, 1.02, 0.5], [-40, 0, 0]) } },
    { t: 1.5, arms: { R: R([-0.22, 1.36, 0.28], [-100, 0, 0]) }, bones: { chest: [-4, -6, 0] } },
  ], { loop: true, events: [{ t: 0.55, name: 'clang' }] }));
  const sweepA = { arms: { R: R([-0.2, 1.0, 0.42], [-30, 0, 0]), L: Lh([0.12, 1.2, 0.34], [-40, 0, 0]) }, hands: { L: GRIP, R: GRIP }, bones: { chest: [12, -10, 0], spine: [8, 0, 0], head: [16, 0, 0] } };
  out.push(K('Sweep', [{ t: 0, ...STAND, ...sweepA }, { t: 0.7, arms: { R: R([-0.3, 1.0, 0.5], [-30, 0, 0]), L: Lh([0.04, 1.2, 0.42], [-40, 0, 0]) }, bones: { chest: [14, 8, 0] } }, { t: 1.4, ...sweepA }], { loop: true }));
  out.push(K('Drink', [
    { t: 0, ...STAND, arms: { R: R([-0.22, 1.05, 0.3], [-60, 0, 0]) }, hands: { R: GRIP } },
    { t: 0.8, arms: { R: R([-0.07, 1.55, 0.2], [-120, 0, 10]) }, bones: { head: [-14, 0, 0], neck: [-6, 0, 0] } },
    { t: 1.6, arms: { R: R([-0.07, 1.55, 0.2], [-120, 0, 10]) } },
    { t: 2.4, arms: { R: R([-0.22, 1.05, 0.3], [-60, 0, 0]) }, bones: { head: [0, 0, 0] } },
    { t: 3.4, arms: { R: R([-0.22, 1.05, 0.3], [-60, 0, 0]) } },
  ], { loop: true }));

  // ---- talk / gesture / stances
  out.push(K('Talk', [
    { t: 0, ...STAND, arms: { R: R([-0.26, 1.2, 0.32], [-70, 0, 0]) }, bones: { head: [0, 8, 0] } },
    { t: 0.6, arms: { R: R([-0.3, 1.32, 0.4], [-80, 0, 12]), L: Lh([0.2, 1.1, 0.3], [-50, 0, 0]) }, bones: { head: [-4, -6, 0], chest: [1, 4, 0] } },
    { t: 1.3, arms: { R: R([-0.22, 1.12, 0.3], [-60, 0, 0]), L: Lh([0.26, 1.28, 0.36], [-70, 0, -10]) }, bones: { head: [3, 6, 0] } },
    { t: 2.1, arms: { R: R([-0.26, 1.2, 0.32], [-70, 0, 0]), L: null }, bones: { head: [0, 8, 0] } },
  ], { loop: true }));
  out.push(K('Point', [{ t: 0, ...STAND }, { t: 0.4, arms: { R: R([-0.2, 1.42, 0.55], [-90, 0, 0]) }, hands: { R: 'point' }, bones: { chest: [0, -8, 0] } }, { t: 1.6, arms: { R: R([-0.2, 1.42, 0.55], [-90, 0, 0]) } }, { t: 2.0, ...STAND }]));
  out.push(K('Arms Crossed', [{ t: 0, ...STAND, arms: { R: R([0.08, 1.2, 0.22], [-70, 0, -30], [0, -1, 0]), L: Lh([-0.08, 1.24, 0.24], [-70, 0, 30], [0, -1, 0]) }, hands: { L: 'fist', R: 'fist' }, bones: { chest: [2, 0, 0] } }, { t: 2, bones: { chest: [4, 0, 0], head: [2, 0, 0] } }, { t: 4, bones: { chest: [2, 0, 0] } }], { loop: true }));
  out.push(K('Stand Guard', [{ t: 0, ...STAND, arms: { R: R([-0.24, 1.15, 0.3], [-96, 0, 0]), L: Lh([0.2, 1.3, 0.28], [-96, 0, 0]) }, hands: { R: GRIP, L: GRIP } }, { t: 2.5, bones: { chest: [2, 0, 0] } }, { t: 5, bones: { chest: [1, 0, 0] } }], { loop: true }));
  out.push(K('Sword Rest', [{ t: 0, ...STAND, arms: { R: R([-0.23, 1.06, 0.26], [-95, 6, 4]) }, hands: { R: GRIP } }, { t: 1.5, arms: { R: R([-0.23, 1.07, 0.26], [-95, 6, 4]) } }, { t: 3, arms: { R: R([-0.23, 1.06, 0.26], [-95, 6, 4]) } }], { loop: true }));
  out.push(K('Hold Item', [{ t: 0, ...STAND, arms: { R: R([-0.22, 1.05, 0.3], [-70, 0, 0]) }, hands: { R: GRIP } }, { t: 2, arms: { R: R([-0.22, 1.06, 0.3], [-70, 0, 0]) } }], { loop: true }));
  out.push(K('Torch Hold', [{ t: 0, ...STAND, arms: { L: Lh([0.24, 1.22, 0.36], [-75, 0, 0]) }, hands: { L: GRIP } }, { t: 2, arms: { L: Lh([0.24, 1.24, 0.37], [-77, 0, 0]) } }, { t: 4, arms: { L: Lh([0.24, 1.22, 0.36], [-75, 0, 0]) } }], { loop: true }));
  out.push(K('Look Around', [{ t: 0, ...STAND }, { t: 0.8, bones: { head: [0, 50, 0], neck: [0, 20, 0], chest: [0, 14, 0] } }, { t: 1.6, bones: { head: [-4, 50, 0], neck: [0, 20, 0], chest: [0, 14, 0] } }, { t: 2.6, bones: { head: [0, -50, 0], neck: [0, -20, 0], chest: [0, -14, 0] } }, { t: 3.4, bones: { head: [0, -50, 0], neck: [0, -20, 0], chest: [0, -14, 0] } }, { t: 4.2, ...STAND }]));
  out.push(K('Warm Hands', [{ t: 0, ...STAND, arms: { R: R([-0.14, 1.1, 0.4], [-60, 0, 20]), L: Lh([0.14, 1.1, 0.4], [-60, 0, -20]) }, hands: { L: 'flat', R: 'flat' }, bones: { spine: [6, 0, 0], head: [8, 0, 0] } }, { t: 1.5, arms: { R: R([-0.12, 1.14, 0.42], [-60, 0, 20]) } }, { t: 3, arms: { R: R([-0.14, 1.1, 0.4], [-60, 0, 20]) } }], { loop: true }));
  out.push(K('Give', [{ t: 0, ...STAND }, { t: 0.4, arms: { R: R([-0.16, 1.22, 0.5], [-70, 0, 0]) }, hands: { R: 'flat' } }, { t: 1.4, arms: { R: R([-0.16, 1.22, 0.5], [-70, 0, 0]) } }, { t: 1.9, ...STAND }]));
  out.push(K('Lunge Death', [{ t: 0, ...STAND }, { t: 0.4, bones: { chest: [30, 0, 0], spine: [20, 0, 0], head: [20, 0, 0] } }, { t: 0.8, hips: [0, 0.5, 0.1], bones: { chest: [50, 0, 0], head: [30, 0, 0] } }]));
  return out;
}
