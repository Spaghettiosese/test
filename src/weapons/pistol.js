// Handguns, first person, two-handed: a polymer-framed compact, a stainless .45 with a threaded
// suppressor and wooden grips, and a boxy machine pistol with a folded wire stock. In all of them
// the magazine lives in the grip and a slide (or the machine pistol's bolt cover) cycles on every
// shot and stays back on the last round. Moving parts: slide, trigger, magazine, muzzle flash.
// Actions: Idle, Idle Empty, Fire, Fire Last, Reload, Reload Empty (ends with the slide release),
// Inspect (right side, a press check, the flip).
import { P, rbox, cyl, sph, profile, torus, ALONG_Z, SIDE, HANDS, offset, weaponDefinition, createWeapon } from './rig.js';
import { pistolActions } from './gen.js';

const BORE = 0.05;
const WPN = { bone: 'weapon' };
const SLD = { bone: 'slide' };
const MAG = { bone: 'mag' };
const array = (count, offsetZ) => [{ type: 'array', count, offsetX: 0, offsetY: 0, offsetZ, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }];

const MATERIALS = {
  slide: { color: '#2a2c30', roughness: 0.38, metallic: 0.85, pattern: 'metal', patternScale: 3, patternStrength: 0.4 },
  slideSS: { color: '#9ea1a6', roughness: 0.2, metallic: 1, pattern: 'metal', patternScale: 4, patternStrength: 0.35 },
  frame: { color: '#232427', roughness: 0.7, pattern: 'leather', patternScale: 280, patternColor: '#0c0c0d', patternStrength: 0.55 },
  frameTan: { color: '#7d6c4c', roughness: 0.66, pattern: 'leather', patternScale: 280, patternColor: '#54482f', patternStrength: 0.5 },
  steel: { color: '#8b8d91', roughness: 0.22, metallic: 1, pattern: 'metal', patternScale: 4 },
  black: { color: '#17181a', roughness: 0.5, metallic: 0.8 },
  wood: { color: '#6a3f22', roughness: 0.4, pattern: 'walnut', patternScale: 24, patternColor: '#35200f', sheen: 0.25 },
  rubber: { color: '#121212', roughness: 0.92, pattern: 'checker', patternScale: 230, patternColor: '#060606', patternStrength: 0.5 },
  groove: { color: '#070708', roughness: 0.85 },
  dark: { color: '#050505', roughness: 0.9 },
  brass: { color: '#c79a48', roughness: 0.28, metallic: 1 },
  white: { color: '#ece8dc', roughness: 0.5 },
  green: { color: '#79d13c', roughness: 0.4, emissive: '#5cc02a', emissiveStrength: 1.2 },
  lens: { color: '#14303d', roughness: 0.05, emissive: '#0c2a38', emissiveStrength: 0.35, opacity: 0.5, doubleSided: true },
  dot: { color: '#ff3b2a', roughness: 1, emissive: '#ff2a1a', emissiveStrength: 14 },
  flash: { color: '#ffcf7a', roughness: 1, emissive: '#ffb347', emissiveStrength: 30, opacity: 0.9, doubleSided: true },
};

function build(v) {
  const W0 = [-0.05, -0.1, 0.34];
  const W = (p) => offset(W0, p);
  const MAG_SEAT = [0, -0.05, -0.075];
  const MUZ = v.muzzle;
  const SIGHT = v.tallSights ? 0.098 : 0.082;
  const SLIDE_BACK = v.slideBack;
  const parts = [];
  const add = (...a) => parts.push(...a);

  if (v.kind === 'compact' || v.kind === 'duelist') {
    add(
      P('Slide', profile([[-0.076, 0.03], [0.1, 0.03], [0.1, 0.066], [0.093, 0.072], [-0.06, 0.072], [-0.076, 0.06]], 0.025, 0.005), 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Slide Top Flat', rbox(0.01, 0.002, 0.16, 0.0005), 'slide', SLD, { position: W([0, 0.0725, 0.01]) }),
      P('Rear Serrations', rbox(0.0262, 0.034, 0.0018, 0), 'groove', SLD, { position: W([0, 0.05, -0.066]), modifiers: array(6, 0.0048) }),
      P('Front Serrations', rbox(0.0262, 0.034, 0.0018, 0), 'groove', SLD, { position: W([0, 0.05, 0.062]), modifiers: array(4, 0.0048) }),
      P('Ejection Port', rbox(0.002, 0.02, 0.046, 0.001), 'dark', SLD, { position: W([-0.0132, 0.054, 0.008]) }),
      P('Rear Sight', rbox(0.016, 0.01, 0.012, 0.002), 'black', SLD, { position: W([0, 0.077, -0.068]) }),
      P('Rear Notch', rbox(0.004, 0.006, 0.002, 0), 'dark', SLD, { position: W([0, 0.079, -0.0625]), castShadow: false }),
      P('Front Sight', rbox(0.004, 0.011, 0.01, 0.001), 'black', SLD, { position: W([0, 0.0775, 0.092]) }),
      P('Front Dot', sph(0.0018, 8, 6), 'green', SLD, { position: W([0, 0.0835, 0.0925]), castShadow: false }),
      P('Barrel Crown', cyl(0.0078, 0.0078, 0.014, 18), 'steel', WPN, { position: W([0, BORE, MUZ - 0.006]), rotation: ALONG_Z }),
      P('Muzzle Bore', cyl(0.0048, 0.0048, 0.003, 12), 'dark', WPN, { position: W([0, BORE, MUZ + 0.0013]), rotation: ALONG_Z }),
      P('Frame', profile([[-0.074, 0.032], [-0.106, -0.114], [-0.046, -0.114], [-0.026, -0.012], [0.04, -0.012], [0.052, 0.004], [0.1, 0.004], [0.1, 0.032]], 0.025, 0.004), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Accessory Rail', rbox(0.02, 0.003, 0.04, 0.0006), 'frame', WPN, { position: W([0, 0.001, 0.07]) }),
      P('Rail Slots', rbox(0.0204, 0.0032, 0.004, 0), 'groove', WPN, { position: W([0, 0.001, 0.056]), modifiers: array(3, 0.012) }),
      P('Trigger Guard', torus(0.0165, 0.0034, { tubularSegments: 24 }), 'frame', WPN, { position: W([0, -0.02, 0.008]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
      P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.02], [-0.006, -0.03], [-0.01, -0.027], [-0.005, -0.017]], 0.008, 0.0015), 'black', { bone: 'trigger' }, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Trigger Blade', rbox(0.003, 0.016, 0.003, 0.0005), 'steel', { bone: 'trigger' }, { position: W([0, -0.016, -0.004]), castShadow: false }),
      P('Slide Stop', rbox(0.005, 0.008, 0.026, 0.002), 'black', WPN, { position: W([0.0145, 0.026, -0.012]) }),
      P('Mag Release', rbox(0.005, 0.01, 0.012, 0.002), 'black', WPN, { position: W([0.0145, -0.022, -0.04]) }),
      P('Takedown Lever', rbox(0.004, 0.006, 0.014, 0.001), 'black', WPN, { position: W([0.0145, 0.016, 0.026]) }),
      P('Grip Stipple', profile([[-0.07, 0.024], [-0.027, 0.024], [-0.027, -0.01], [-0.047, -0.11], [-0.104, -0.11]], 0.028, 0.006), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      ...[0, 1, 2].map((i) => P('Finger Groove ' + i, rbox(0.027, 0.006, 0.006, 0.002), 'groove', WPN, { position: W([0, -0.04 - i * 0.022, -0.04 - i * 0.0055]), rotation: [-14, 0, 0], castShadow: false })),
      P('Magazine', profile([[-0.074, 0.025], [-0.034, 0.025], [-0.052, -0.114], [-0.106, -0.114]], 0.02, 0.003), 'black', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Mag Base', rbox(0.029, 0.012, 0.062, 0.003), 'frame', MAG, { position: W([0, -0.12, -0.08]), rotation: [-8, 0, 0] }),
      ...[0, 1, 2, 3].map((i) => P('Mag Window ' + i, rbox(0.0204, 0.006, 0.006, 0), 'dark', MAG, { position: W([0.0, -0.01 - i * 0.025, -0.052 - i * 0.012]), castShadow: false })),
      P('Top Round', { type: 'capsule', radius: 0.0052, length: 0.016, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.026, -0.055]), rotation: ALONG_Z }),
    );
    if (v.kind === 'duelist') add(
      // a slide-mounted red dot, compensator slots, an extended magazine and a steel trigger shoe
      P('Dot Mount', rbox(0.022, 0.006, 0.04, 0.002), 'black', SLD, { position: W([0, 0.0745, -0.03]) }),
      P('Dot Housing', profile([[-0.05, 0.075], [-0.05, 0.1], [-0.01, 0.1], [-0.006, 0.075]], 0.024, 0.004), 'black', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Dot Lens', rbox(0.018, 0.022, 0.002, 0.0005), 'lens', SLD, { position: W([0, 0.0875, -0.0055]), rotation: [-8, 0, 0], castShadow: false }),
      P('Dot Emitter', sph(0.0012, 8, 6), 'dot', SLD, { position: W([0, 0.088, -0.0075]), castShadow: false }),
      ...[0, 1, 2].map((i) => P('Comp Slot ' + i, rbox(0.012, 0.002, 0.012, 0.0005), 'groove', SLD, { position: W([0, 0.0735, 0.066 + i * 0.016]), castShadow: false })),
      P('Mag Extension', rbox(0.026, 0.05, 0.062, 0.004), 'black', MAG, { position: W([0, -0.14, -0.084]), rotation: [-8, 0, 0] }),
    );
  } else if (v.kind === 'm45') {
    add(
      P('Slide', profile([[-0.084, 0.03], [0.108, 0.03], [0.108, 0.068], [0.1, 0.074], [-0.07, 0.074], [-0.084, 0.064]], 0.03, 0.004), 'slideSS', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Slide Flat', rbox(0.012, 0.002, 0.18, 0.0005), 'slideSS', SLD, { position: W([0, 0.0745, 0.012]) }),
      P('Rear Serrations', rbox(0.0312, 0.04, 0.002, 0), 'groove', SLD, { position: W([0, 0.052, -0.076]), modifiers: array(8, 0.0052) }),
      P('Ejection Port', rbox(0.002, 0.022, 0.05, 0.001), 'dark', SLD, { position: W([-0.0157, 0.056, 0.005]) }),
      P('Tall Rear Sight', rbox(0.02, 0.016, 0.014, 0.002), 'black', SLD, { position: W([0, 0.082, -0.076]) }),
      P('Rear Notch', rbox(0.005, 0.01, 0.002, 0), 'dark', SLD, { position: W([0, 0.087, -0.0695]), castShadow: false }),
      P('Tall Front Sight', rbox(0.005, 0.02, 0.012, 0.001), 'black', SLD, { position: W([0, 0.087, 0.098]) }),
      P('Front Dot', sph(0.0019, 8, 6), 'white', SLD, { position: W([0, 0.0985, 0.0985]), castShadow: false }),
      P('Hammer', rbox(0.007, 0.016, 0.016, 0.003), 'black', SLD, { position: W([0, 0.074, -0.092]), rotation: [24, 0, 0] }),
      P('Barrel Thread Collar', cyl(0.0105, 0.0105, 0.02, 18), 'steel', WPN, { position: W([0, BORE, 0.116]), rotation: ALONG_Z }),
      P('Suppressor', cyl(0.0185, 0.0185, MUZ - 0.125, 24), 'black', WPN, { position: W([0, BORE, (MUZ + 0.125) / 2]), rotation: ALONG_Z }),
      P('Suppressor Rings', cyl(0.0192, 0.0192, 0.004, 24), 'steel', WPN, { position: W([0, BORE, 0.15]), rotation: ALONG_Z, modifiers: array(5, 0.03).map((m) => ({ ...m, offsetZ: 0 })) }),
      ...[0.15, 0.18, 0.21].map((z, i) => P('Suppressor Band ' + i, cyl(0.0192, 0.0192, 0.004, 24), 'steel', WPN, { position: W([0, BORE, z]), rotation: ALONG_Z })),
      P('Suppressor Cap', cyl(0.0188, 0.0188, 0.006, 24), 'slide', WPN, { position: W([0, BORE, MUZ - 0.002]), rotation: ALONG_Z }),
      P('Muzzle Bore', cyl(0.0075, 0.0075, 0.003, 14), 'dark', WPN, { position: W([0, BORE, MUZ + 0.0015]), rotation: ALONG_Z }),
      P('Frame', profile([[-0.09, 0.032], [-0.122, -0.113], [-0.052, -0.113], [-0.03, -0.012], [0.045, -0.012], [0.062, 0.004], [0.112, 0.004], [0.112, 0.032]], 0.028, 0.004), 'slideSS', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Trigger Guard', torus(0.017, 0.0036, { tubularSegments: 24 }), 'slideSS', WPN, { position: W([0, -0.02, 0.006]), rotation: [0, 0, 90], scale: [1, 1, 1.5] }),
      P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.02], [-0.006, -0.03], [-0.01, -0.027], [-0.005, -0.017]], 0.008, 0.0015), 'black', { bone: 'trigger' }, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Slide Stop', rbox(0.006, 0.008, 0.024, 0.002), 'black', WPN, { position: W([0.0165, 0.024, -0.018]) }),
      P('Safety', rbox(0.007, 0.008, 0.026, 0.002), 'black', WPN, { position: W([0.0225, 0.017, -0.07]), rotation: [-15, 0, 0] }),
      P('Mag Release', rbox(0.006, 0.01, 0.01, 0.002), 'black', WPN, { position: W([0.0205, -0.026, -0.042]) }),
      P('Wood Grip L', profile([[-0.088, 0.026], [-0.032, 0.026], [-0.032, -0.008], [-0.052, -0.108], [-0.12, -0.108]], 0.006, 0.003), 'wood', WPN, { position: W([0.0205, 0, 0]), rotation: SIDE }),
      P('Wood Grip R', profile([[-0.088, 0.026], [-0.032, 0.026], [-0.032, -0.008], [-0.052, -0.108], [-0.12, -0.108]], 0.006, 0.003), 'wood', WPN, { position: W([-0.0205, 0, 0]), rotation: SIDE }),
      P('Grip Screw', cyl(0.0032, 0.0032, 0.048, 10), 'steel', WPN, { position: W([0, -0.03, -0.083]), rotation: [0, 0, 90] }),
      P('Magazine', profile([[-0.086, 0.025], [-0.038, 0.025], [-0.054, -0.112], [-0.117, -0.112]], 0.022, 0.003), 'black', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Mag Base', rbox(0.031, 0.012, 0.074, 0.003), 'slideSS', MAG, { position: W([0, -0.118, -0.088]), rotation: [-8, 0, 0] }),
      P('Top Round', { type: 'capsule', radius: 0.0062, length: 0.019, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.026, -0.062]), rotation: ALONG_Z }),
    );
  } else { // machine pistol
    add(
      P('Receiver', profile([[-0.095, 0.0], [0.13, 0.0], [0.13, 0.072], [-0.095, 0.072]], 0.04, 0.007), v.tan ? 'frameTan' : 'slide', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Bolt Cover', profile([[-0.09, 0.07], [0.12, 0.07], [0.12, 0.082], [0.1, 0.086], [-0.07, 0.086], [-0.09, 0.078]], 0.034, 0.004), v.tan ? 'frameTan' : 'slide', SLD, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Cover Ribs', rbox(0.0352, 0.003, 0.003, 0), 'groove', SLD, { position: W([0, 0.0865, -0.07]), modifiers: array(12, 0.0095) }),
      P('Cocking Knob', cyl(0.007, 0.007, 0.012, 14), 'steel', SLD, { position: W([0, 0.094, -0.01]) }),
      P('Ejection Port', rbox(0.002, 0.026, 0.07, 0.001), 'dark', WPN, { position: W([-0.0205, 0.04, 0.02]) }),
      P('Rear Sight', rbox(0.016, 0.012, 0.014, 0.002), 'black', SLD, { position: W([0, 0.092, -0.08]) }),
      P('Front Post', rbox(0.004, 0.02, 0.006, 0.001), 'black', WPN, { position: W([0, 0.082, 0.132]) }),
      P('Barrel Nut', cyl(0.019, 0.019, 0.03, 20), 'black', WPN, { position: W([0, BORE + 0.003, 0.145]), rotation: ALONG_Z }),
      P('Barrel Sleeve', cyl(0.0125, 0.0125, MUZ - 0.15, 18), 'steel', WPN, { position: W([0, BORE + 0.003, (MUZ + 0.15) / 2]), rotation: ALONG_Z }),
      P('Muzzle Bore', cyl(0.0052, 0.0052, 0.003, 12), 'dark', WPN, { position: W([0, BORE + 0.003, MUZ + 0.0015]), rotation: ALONG_Z }),
      P('Front Strap', profile([[0.0, -0.006], [0.12, -0.006], [0.12, -0.026], [0.0, -0.026]], 0.03, 0.005), 'black', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      ...[1, -1].map((sd) => P('Wire Stock Rod', cyl(0.0034, 0.0034, 0.1, 8), 'steel', WPN, { position: W([sd * 0.027, 0.012, -0.05]), rotation: ALONG_Z })),
      P('Wire Stock Bar', cyl(0.0034, 0.0034, 0.058, 8), 'steel', WPN, { position: W([0, 0.012, -0.1]), rotation: [0, 0, 90] }),
      P('Wire Stock Pad', rbox(0.03, 0.012, 0.006, 0.002), 'frame', WPN, { position: W([0, 0.012, -0.103]) }),
      P('Trigger Guard', torus(0.017, 0.0034, { tubularSegments: 24 }), 'black', WPN, { position: W([0, -0.02, 0.006]), rotation: [0, 0, 90], scale: [1, 1, 1.6] }),
      P('Trigger', profile([[-0.004, -0.004], [0.004, -0.004], [0.002, -0.02], [-0.006, -0.03], [-0.01, -0.027], [-0.005, -0.017]], 0.008, 0.0015), 'steel', { bone: 'trigger' }, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Safety Slot', rbox(0.002, 0.012, 0.03, 0.001), 'dark', WPN, { position: W([0.0205, 0.012, -0.05]), castShadow: false }),
      P('Pistol Grip', profile([[-0.04, 0.0], [-0.03, 0.0], [-0.03, -0.01], [-0.05, -0.118], [-0.118, -0.118], [-0.1, -0.01], [-0.095, 0.0]], 0.034, 0.007), 'frame', WPN, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Magazine', profile([[-0.086, 0.0], [-0.036, 0.0], [-0.052, -0.2], [-0.115, -0.2]], 0.024, 0.003), 'black', MAG, { position: W([0, 0, 0]), rotation: SIDE }),
      P('Mag Base', rbox(0.03, 0.01, 0.07, 0.003), 'frame', MAG, { position: W([0, -0.204, -0.084]) }),
      P('Mag Ribs', rbox(0.0244, 0.003, 0.05, 0), 'groove', MAG, { position: W([0, -0.05, -0.062]), modifiers: [{ type: 'array', count: 8, offsetX: 0, offsetY: -0.02, offsetZ: -0.003, rotX: 0, rotY: 0, rotZ: 0, scaleStep: 1 }] }),
      P('Top Round', { type: 'capsule', radius: 0.0052, length: 0.016, radialSegments: 10, capSegments: 3 }, 'brass', MAG, { position: W([0, 0.002, -0.05]), rotation: ALONG_Z }),
    );
  }
  add(
    P('Muzzle Flash', { type: 'extrude', shape: 'star', points: 7, inner: 0.35, radius: v.flashSize || 0.07, teeth: 12, toothDepth: 0.12, depth: 0.004, bevel: 0 }, 'flash', { bone: 'flash' }, { position: W([0, BORE + (v.kind === 'mp10' ? 0.003 : 0), MUZ + 0.01]), castShadow: false }),
    P('Flash Core', { type: 'cone', radius: 0.028, height: 0.12, radialSegments: 12, heightSegments: 2, capBottom: true, arc: 360 }, 'flash', { bone: 'flash' }, { position: W([0, BORE, MUZ + 0.066]), rotation: [90, 0, 0], castShadow: false }),
  );
  const points = { muzzle: [0, BORE, MUZ + 0.01], eject: [-0.02, 0.056, 0.0], sightRear: [0, SIGHT, -0.068], sightFront: [0, SIGHT, MUZ - 0.1 > 0.08 ? 0.098 : 0.09] };
  const actions = pistolActions({
    W0, magSeat: MAG_SEAT, slideBack: SLIDE_BACK, trigger: true,
    gripR: { attach: 'weapon', p: [-0.03, -0.055, -0.13], r: [-66, 0, 0] },
    supportL: { attach: 'weapon', p: [0.03, -0.066, -0.118], r: [-62, 0, 0] },
    lhMag: { p: [0.03, -0.2, -0.085], r: [-92, 0, 0] }, lhSlap: { attach: 'weapon', p: [0.05, -0.17, -0.085], r: [0, 0, -90] },
    pouch: { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] },
    magPose: { p: [-0.03, -0.07, 0.35], r: [-58, -6, 14] },
    rack: { attach: 'slide', p: [0.03, 0.006, -0.07], r: [-30, 0, -90] },
    kick: v.kick,
  });
  return {
    id: v.id, name: v.name, W0, BORE, rightShoulder: [0, 0, 0.02], poleR: [-1.4, -1.2, -0.1], poleL: [1.2, -1.2, -0.1],
    bones: [
      { name: 'slide', head: [0, 0.052, 0] },
      { name: 'trigger', head: [0, -0.004, -0.005] },
      { name: 'flash', head: [0, BORE, MUZ + 0.01], tail: [0, BORE, MUZ + 0.07] },
    ],
    props: { mag: MAG_SEAT }, propsDefault: { mag: { attach: 'weapon', p: MAG_SEAT, r: [0, 0, 0] } },
    slides: { slide: 'z' }, spins: { trigger: 'x' }, toggles: ['flash'], toggleDefault: { flash: 0 },
    materials: MATERIALS, parts, actions, points,
    firstPerson: { fov: 62, eyeHeight: 1.62, actions: { fire: 'Fire', reload: 'Reload', inspect: 'Inspect', idle: 'Idle' }, after: { Fire: 'Idle', Reload: 'Idle', Inspect: 'Idle' } },
  };
}

export const COMPACT = build({ id: 'compact9', name: 'P9 Compact', kind: 'compact', muzzle: 0.104, slideBack: -0.03, kick: { back: 0.02, up: 0.014, pitch: -7, yaw: 0.3, roll: -0.5 } });
export const M45 = build({ id: 'm45', name: 'M45 Tactical', kind: 'm45', muzzle: 0.27, slideBack: -0.036, tallSights: true, kick: { back: 0.024, up: 0.016, pitch: -8, yaw: 0.4, roll: -0.6 } });
export const MP10 = build({ id: 'mp10', name: 'MP10 Machine Pistol', kind: 'mp10', muzzle: 0.2, slideBack: -0.022, flashSize: 0.06, kick: { back: 0.016, up: 0.008, pitch: -3.6, yaw: 0.6, roll: -0.4 } });
export const DUELIST = build({ id: 'duelist', name: 'P9X Duelist', kind: 'duelist', muzzle: 0.112, slideBack: -0.03, kick: { back: 0.02, up: 0.014, pitch: -6.5, yaw: 0.3, roll: -0.5 } });
export const SKORP = build({ id: 'skorp', name: 'Vz-61 Scorpion', kind: 'skorp', tan: true, muzzle: 0.15, slideBack: -0.02, flashSize: 0.055, kick: { back: 0.014, up: 0.007, pitch: -3.0, yaw: 0.7, roll: -0.4 } });
export const createCompact = () => createWeapon(COMPACT);
export const createDuelist = () => createWeapon(DUELIST);
export const createSkorp = () => createWeapon(SKORP);
export const createM45 = () => createWeapon(M45);
export const createMP10 = () => createWeapon(MP10);
export const pistolDefinition = (g, o) => weaponDefinition(g, o);
