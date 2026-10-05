// First-person views for gadgets: the same gloved arms as the guns, holding a grenade, a charge,
// the breaching hammer, a shield, a tablet, a torch or a dart gun. Built with the weapon rig's
// choreography baker so the hands, wrists and fingers are solved with the same two-bone IK.
import { Character } from '../../../engine/character.js';
import { P, rbox, cyl, sph, HANDS, k, weaponDefinition } from '../../weapons/rig.js';

const W0 = [-0.07, -0.17, 0.3];
const READY = { p: [...W0], r: [0, 0, 0] };
const at = (dp, dr = [0, 0, 0]) => ({ p: [W0[0] + dp[0], W0[1] + dp[1], W0[2] + dp[2]], r: dr });
const GRIP_R = { attach: 'weapon', p: [-0.01, -0.04, -0.02], r: [-66, 0, 2] };
const REST_L = { attach: 'world', p: [0.17, -0.42, 0.18], r: [-25, 10, -25] };
const WPN = { bone: 'weapon' }, OBJ = { bone: 'obj' };

const MATS = {
  olive: { color: '#4f5638', roughness: 0.6 }, dark: { color: '#1b1d20', roughness: 0.5, metallic: 0.3 }, grey: { color: '#80868c', roughness: 0.4, metallic: 0.7 },
  orange: { color: '#c4631c', roughness: 0.5 }, red: { color: '#a82a22', roughness: 0.5 }, yellow: { color: '#d6b020', roughness: 0.5 }, blue: { color: '#2a5a9a', roughness: 0.5 },
  wood: { color: '#7a5a38', roughness: 0.8, pattern: 'wood', patternScale: 5, patternColor: '#3a2a18' }, steel: { color: '#9aa2aa', roughness: 0.3, metallic: 0.95 },
  led: { color: '#310', emissive: '#ff3a20', emissiveStrength: 6 }, ledB: { color: '#013', emissive: '#4aa8ff', emissiveStrength: 5 }, ledG: { color: '#031', emissive: '#4aff7a', emissiveStrength: 5 },
  screen: { color: '#06121a', emissive: '#4ac8ff', emissiveStrength: 2.5, roughness: 0.15 }, flame: { color: '#fff', emissive: '#ffb040', emissiveStrength: 14, opacity: 0.85, doubleSided: true },
  shield: { color: '#2b3037', roughness: 0.45, metallic: 0.6 }, glass: { color: '#6a8a9c', roughness: 0.05, metallic: 0.3, opacity: 0.5, doubleSided: true }, green: { color: '#2f6a36', roughness: 0.5 },
};
const FIN = { grip: { pose: HANDS.pistolGrip }, relaxed: { pose: HANDS.relaxed }, flat: { pose: HANDS.flat }, wrap: { pose: HANDS.wrap }, pinch: { pose: HANDS.pinch } };
const fr = (t, f) => k(t, FIN[f]);

// a standard Idle that holds the object in the right hand with the left hand hanging
const idle = (extra = {}) => ({ duration: 3, fps: 30, weapon: [k(0, READY), k(1.5, at([0.002, 0.004, 0], [0.6, 0.8, 0])), k(3, READY)], handR: [k(0, GRIP_R)], handL: [k(0, REST_L)], fingersR: [fr(0, 'grip')], fingersL: [fr(0, 'relaxed')], events: [], ...extra });

function def(name, parts, bones, actions, o = {}) {
  return {
    id: name, name, W0, BORE: 0, bones, props: {}, propsDefault: {}, slides: {}, toggles: o.toggles || [], toggleDefault: o.toggleDefault || {},
    materials: MATS, parts, actions, points: { muzzle: [0, 0, 0.1], eject: [0, 0, 0], sightRear: [0, 0.1, 0], sightFront: [0, 0.1, 0.3] },
    firstPerson: { fov: 62, eyeHeight: 1.62, actions: { idle: 'Idle' }, after: {} }, ...(o.extra || {}),
  };
}
const objBone = [{ name: 'obj', head: [0, 0, 0] }];

function grenadeGun(color, band) {
  const parts = [P('Body', cyl(0.036, 0.036, 0.12, 14), color, OBJ, { position: [W0[0], W0[1], W0[2]] }), P('Band', cyl(0.038, 0.038, 0.03, 14), band, OBJ, { position: [W0[0], W0[1] + 0.012, W0[2]] }), P('Spoon', rbox(0.012, 0.075, 0.02, 0.004), 'steel', OBJ, { position: [W0[0] + 0.04, W0[1] + 0.01, W0[2]] }), P('Pin', cyl(0.004, 0.004, 0.03, 6), 'steel', OBJ, { position: [W0[0], W0[1] + 0.07, W0[2]] })];
  const use = { duration: 0.95, fps: 30, weapon: [k(0, READY), k(0.22, at([0.03, 0.07, -0.14], [-25, 0, 0]), 'out'), k(0.42, at([0, 0.06, 0.15], [35, 0, 0]), 'snap'), k(0.95, READY, 'in')],
    handR: [k(0, GRIP_R), k(0.46, GRIP_R)], handL: [k(0, REST_L), k(0.25, { attach: 'world', p: [0.12, -0.3, 0.25], r: [-30, 0, -10] }), k(0.9, REST_L)], fingersR: [fr(0, 'grip'), fr(0.44, 'grip'), fr(0.5, 'flat'), fr(0.8, 'grip')], fingersL: [fr(0, 'relaxed')],
    toggles: { obj: [k(0, { v: 1 }), k(0.44, { v: 1 }), k(0.45, { v: 0 }, 'hold'), k(0.82, { v: 0 }), k(0.83, { v: 1 }, 'hold')] }, events: [{ t: 0.44, name: 'release' }] };
  return def('Grenade', parts, objBone, { Idle: idle(), Use: use }, { toggles: ['obj'], toggleDefault: { obj: 1 } });
}
function deviceGun(color, led) {
  const parts = [P('Case', rbox(0.17, 0.07, 0.11, 0.012), color, OBJ, { position: [W0[0], W0[1], W0[2]] }), P('Led', rbox(0.03, 0.02, 0.01, 0.004), led, OBJ, { position: [W0[0] + 0.05, W0[1] + 0.02, W0[2] + 0.056] }), P('Pad', rbox(0.1, 0.03, 0.02, 0.006), 'dark', OBJ, { position: [W0[0] - 0.02, W0[1] - 0.03, W0[2] + 0.06] })];
  const use = { duration: 0.8, fps: 30, weapon: [k(0, READY), k(0.2, at([0.0, 0.05, 0.08], [-10, 0, 0]), 'out'), k(0.32, at([0.0, 0.05, 0.22], [-5, 0, 0]), 'snap'), k(0.8, READY, 'in')],
    handR: [k(0, GRIP_R)], handL: [k(0, REST_L)], fingersR: [fr(0, 'grip')], fingersL: [fr(0, 'relaxed')],
    toggles: { obj: [k(0, { v: 1 }), k(0.34, { v: 1 }), k(0.35, { v: 0 }, 'hold'), k(0.62, { v: 0 }), k(0.63, { v: 1 }, 'hold')] }, events: [{ t: 0.34, name: 'place' }] };
  return def('Device', parts, objBone, { Idle: idle(), Use: use }, { toggles: ['obj'], toggleDefault: { obj: 1 } });
}
function hammerGun() {
  const parts = [P('Haft', cyl(0.022, 0.024, 0.78, 12), 'wood', WPN, { position: [W0[0], W0[1] + 0.08, W0[2]] }), P('Head', rbox(0.2, 0.09, 0.09, 0.012), 'steel', WPN, { position: [W0[0], W0[1] + 0.47, W0[2]] }), P('Face', rbox(0.04, 0.095, 0.095, 0.006), 'dark', WPN, { position: [W0[0] + 0.12, W0[1] + 0.47, W0[2]] }), P('Face2', rbox(0.04, 0.095, 0.095, 0.006), 'dark', WPN, { position: [W0[0] - 0.12, W0[1] + 0.47, W0[2]] }), P('Grip', cyl(0.027, 0.027, 0.22, 12), 'dark', WPN, { position: [W0[0], W0[1] - 0.2, W0[2]] })];
  const GR = { attach: 'weapon', p: [0.005, -0.1, 0], r: [-30, 90, 0] }, GL = { attach: 'weapon', p: [0.0, 0.09, 0.0], r: [-30, -90, 0] };
  const hold = at([0.04, 0, -0.04], [-12, 0, 8]);
  const use = { duration: 0.9, fps: 30, weapon: [k(0, hold), k(0.25, at([0.05, 0.1, -0.22], [-95, 0, 6]), 'out'), k(0.45, at([-0.02, -0.05, 0.12], [40, 0, -4]), 'snap'), k(0.9, hold, 'in')], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [{ t: 0.45, name: 'hit' }] };
  return def('Hammer', parts, [], { Idle: { duration: 3, fps: 30, weapon: [k(0, hold), k(1.5, at([0.042, 0.004, -0.04], [-11, 0, 8])), k(3, hold)], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [] }, Use: use });
}
function shieldGun(flash) {
  const parts = [P('Slab', rbox(0.62, 0.85, 0.045, 0.014), 'shield', WPN, { position: [W0[0] + 0.12, W0[1] + 0.08, W0[2] + 0.1] }), P('Window', rbox(0.34, 0.08, 0.05, 0.01), 'glass', WPN, { position: [W0[0] + 0.12, W0[1] + 0.36, W0[2] + 0.11] }), P('Handle', rbox(0.2, 0.025, 0.03, 0.008), 'dark', WPN, { position: [W0[0] + 0.12, W0[1] + 0.05, W0[2] + 0.07] })];
  if (flash) parts.push(P('Strobe', rbox(0.1, 0.03, 0.03, 0.006), 'ledB', WPN, { position: [W0[0] + 0.12, W0[1] + 0.31, W0[2] + 0.13] }));
  const GR = { attach: 'weapon', p: [0.09, 0.05, 0.05], r: [-80, 0, 0] }, GL = { attach: 'weapon', p: [0.16, 0.05, 0.05], r: [-80, 0, 0] };
  return def('Shield', parts, [], { Idle: { duration: 3, fps: 30, weapon: [k(0, at([0.04, 0, 0])), k(1.5, at([0.042, 0.004, 0])), k(3, at([0.04, 0, 0]))], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [] }, Use: { duration: 0.5, fps: 30, weapon: [k(0, at([0.04, 0, 0])), k(0.15, at([0.04, 0, 0.18]), 'snap'), k(0.5, at([0.04, 0, 0]), 'in')], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [{ t: 0.15, name: 'bash' }] } });
}
function tabletGun() {
  const parts = [P('Tablet', rbox(0.2, 0.012, 0.14, 0.006), 'dark', WPN, { position: [W0[0], W0[1], W0[2]] }), P('Screen', rbox(0.185, 0.006, 0.125, 0.004), 'screen', WPN, { position: [W0[0], W0[1] + 0.008, W0[2]] })];
  const GR = { attach: 'weapon', p: [0.1, 0, 0.0], r: [-90, 0, 0] }, GL = { attach: 'weapon', p: [-0.1, 0, 0.0], r: [-90, 0, 0] };
  const hold = at([0.04, 0.07, 0.08], [-72, 0, 0]);
  return def('Tablet', parts, [], { Idle: { duration: 3, fps: 30, weapon: [k(0, hold), k(1.5, at([0.04, 0.074, 0.08], [-71, 0, 0])), k(3, hold)], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [] }, Use: { duration: 0.6, fps: 30, weapon: [k(0, hold), k(0.2, at([0.04, 0.09, 0.14], [-78, 0, 0])), k(0.6, hold)], handR: [k(0, GR)], handL: [k(0, GL)], fingersR: [fr(0, 'wrap')], fingersL: [fr(0, 'wrap')], events: [] } });
}
function toolGun(color, flame) {
  const parts = [P('Body', rbox(0.06, 0.07, 0.26, 0.012), color, WPN, { position: [W0[0], W0[1] + 0.03, W0[2] + 0.1] }), P('Grip', rbox(0.04, 0.12, 0.05, 0.01), 'dark', WPN, { position: [W0[0], W0[1] - 0.04, W0[2]], rotation: [12, 0, 0] }), P('Nozzle', cyl(0.018, 0.012, 0.1, 10), 'steel', WPN, { position: [W0[0], W0[1] + 0.035, W0[2] + 0.27], rotation: [90, 0, 0] })];
  if (flame) parts.push(P('Flame', cyl(0.012, 0.0, 0.16, 8), 'flame', { bone: 'flame' }, { position: [W0[0], W0[1] + 0.035, W0[2] + 0.38], rotation: [90, 0, 0], castShadow: false }));
  const bones = flame ? [{ name: 'flame', head: [0, 0.035, 0.3] }] : [];
  const GR2 = { attach: 'weapon', p: [-0.01, -0.07, -0.02], r: [-66, 0, 2] }, GL2 = { attach: 'weapon', p: [0.05, 0.0, 0.15], r: [0, -4, -70] };
  const use = { duration: 0.35, fps: 30, weapon: [k(0, READY), k(0.05, at([0.002, 0.008, -0.03], [-5, 0, 0]), 'snap'), k(0.35, READY)], handR: [k(0, GR2)], handL: [k(0, GL2)], fingersR: [fr(0, 'grip')], fingersL: [fr(0, 'wrap')], events: [{ t: 0.05, name: 'use' }] };
  const idl = { duration: 3, fps: 30, weapon: [k(0, READY), k(1.5, at([0.002, 0.004, 0], [0.6, 0.8, 0])), k(3, READY)], handR: [k(0, GR2)], handL: [k(0, GL2)], fingersR: [fr(0, 'grip')], fingersL: [fr(0, 'wrap')], events: [] };
  return def('Tool', parts, bones, { Idle: idl, Use: use }, flame ? { toggles: ['flame'], toggleDefault: { flame: 1 } } : {});
}

// gadget id -> view
export const GADGET_VM = {
  hammer: () => hammerGun(), shield: () => shieldGun(false), flashshield: () => shieldGun(true), scanner: () => tabletGun(),
  thermite: () => deviceGun('orange', 'led'), cluster: () => deviceGun('olive', 'led'), breach: () => deviceGun('red', 'led'), claymore: () => deviceGun('olive', 'led'), edd: () => deviceGun('dark', 'led'),
  mat: () => deviceGun('dark', 'ledG'), barbwire: () => deviceGun('steel', 'ledG'), jammer: () => deviceGun('dark', 'ledB'), cams: () => deviceGun('dark', 'led'), dshield: () => deviceGun('grey', 'ledG'), turret: () => deviceGun('dark', 'led'),
  shockwire: () => deviceGun('yellow', 'ledB'), mines: () => deviceGun('green', 'ledG'), healstation: () => deviceGun('green', 'ledG'), alarm: () => deviceGun('dark', 'led'), armorpanel: () => deviceGun('grey', 'ledG'), armorpack: () => deviceGun('olive', 'ledG'), shockdrone: () => deviceGun('dark', 'ledB'),
  frag: () => grenadeGun('olive', 'dark'), stun: () => grenadeGun('dark', 'yellow'), bangs: () => grenadeGun('dark', 'yellow'), smoke: () => grenadeGun('grey', 'dark'), cinders: () => grenadeGun('grey', 'dark'), impact: () => grenadeGun('orange', 'dark'), sonar: () => grenadeGun('blue', 'dark'), nitro: () => deviceGun('yellow', 'led'),
  emp: () => grenadeGun('dark', 'blue'), decoy: () => deviceGun('dark', 'ledB'), supply: () => deviceGun('olive', 'ledG'), gl: () => toolGun('dark', false), firemine: () => deviceGun('red', 'led'), flashmine: () => deviceGun('yellow', 'ledB'), sensor: () => deviceGun('green', 'ledG'), fogger: () => deviceGun('grey', 'ledB'),
    torch: () => toolGun('orange', true), launcher: () => toolGun('olive', false), xpellet: () => toolGun('dark', false), stimpistol: () => toolGun('green', false),
};
export function createGadgetRig(id) {
  const f = GADGET_VM[id]; if (!f) return null;
  const gun = f();
  return { rig: new Character(weaponDefinition(gun)), gun };
}
void sph;
