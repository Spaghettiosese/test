// Ember Mage: the character builds, every clip bakes and plays with its events, the feet
// stay above the floor while walking, and fire spreads through the glade on its own.
import * as E from '../engine/index.js';
import { createMage, mageDefinition } from '../src/mage/mage.js';
import { buildGlade } from '../src/mage/world.js';
let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log((ok ? 'ok   ' : 'FAIL ') + msg); };

const def = mageDefinition();
const mage = createMage();
const sk = mage.skeleton;
for (const n of ['hips', 'spine', 'chest', 'neck', 'head', 'shoulder.L', 'shoulder.R', 'upperArm.R', 'foreArm.L', 'hand.R', 'thigh.L', 'shin.R', 'foot.L', 'toe.R', 'index1.L', 'pinky2.R', 'thumb2.R']) check(sk.boneIndex(n) >= 0, `bone ${n}`);
check(mage.parts.length > 30 && mage.triangleCount > 5000, `${mage.parts.length} parts, ${mage.triangleCount} triangles`);
const names = def.clips.map((c) => c.name);
for (const n of ['Idle', 'Walk', 'Run', 'Fireball', 'Flamethrower', 'Slam', 'Jump']) check(names.includes(n), `clip ${n}`);
check(mage.mixer.clips.get('Fireball').events.some((e) => e.name === 'fireball') && mage.mixer.clips.get('Slam').events.some((e) => e.name === 'slam'), 'cast clips carry their events');
check(mage.mixer.clips.get('Run').rootMotion[2] > mage.mixer.clips.get('Walk').rootMotion[2], 'run is faster than walk');

// the feet never sink through the floor and the hips stay at a plausible height in any locomotion clip
for (const n of ['Idle', 'Walk', 'Run']) {
  mage.mixer.setWeights({ [n]: 1 }, 0);
  let minFoot = 9, minHips = 9, maxHips = 0;
  for (let i = 0; i < 90; i++) {
    mage.update(1 / 60);
    for (const b of ['foot.L', 'foot.R', 'toe.L', 'toe.R']) minFoot = Math.min(minFoot, sk.worldHead(sk.boneIndex(b))[1]);
    const h = sk.worldHead(sk.boneIndex('hips'))[1]; minHips = Math.min(minHips, h); maxHips = Math.max(maxHips, h);
  }
  check(minFoot > -0.03 && minHips > 0.75 && maxHips < 1.05, `${n}: feet >= ${minFoot.toFixed(3)} m, hips ${minHips.toFixed(2)}-${maxHips.toFixed(2)} m`);
}
// one-shot casts fire their events once
const events = [];
mage.mixer.on((e) => events.push(e.name));
const cast = mage.mixer.addLayer('cast', { mask: E.boneMask(sk, ['spine']) });
cast.playOnce('Fireball');
for (let i = 0; i < 90; i++) mage.update(1 / 60);
check(events.filter((e) => e === 'fireball').length === 1, 'the fireball event fires once per cast');

// fire spreads: light one hay bale and the neighbours catch, char and burn out
const scene = new E.Scene(), world = new E.PhysicsWorld({ iterations: 4 });
const fire = new E.FireSystem(scene, { wind: [0.5, 0, 0.1] });
const glade = buildGlade(scene, world, fire);
const bales = glade.burnables.filter((b) => b.userData.name === 'Hay bale');
check(bales.length === 9 && glade.props.length > 15 && glade.dummies.length === 6, `glade: ${bales.length} hay bales, ${glade.props.length} props, ${glade.dummies.length} dummies, ${fire.burnables.length} burnables`);
fire.ignite(bales[0], 1);
let peak = 0, burnt = 0; fire.onBurntOut = () => burnt++;
for (let t = 0; t < 90; t += 1 / 30) { world.step(1 / 30); scene.updateWorld?.(); fire.update(1 / 30); peak = Math.max(peak, fire.burning.filter((b) => !b.permanent).length); }
check(peak >= 4, `a single hay bale sets ${peak} things alight at the peak`);
check(burnt >= 1 && bales[0].charred > 0.3, `${burnt} burnt out, the first bale charred to ${bales[0].charred.toFixed(2)}`);
// a fireball-sized burst lights props but not the far side of the map
const far = glade.dummies[5], near = glade.props[0];
check(fire.igniteAt(near.body.position, 1.5) >= 1 && far.state === 'fresh', 'igniteAt only lights what is near the blast');
process.exit(fail ? 1 : 0);
