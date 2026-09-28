// V5 Props: every gun as a ShapeForge Engine V5 mechanism prop, built the way the engine's
// own armory builds its guns (src/content/armory.js in the engine repo). The gun's parts
// become Kit meshes on nodes, its moving bones become Rig parts (slides, hinges), its
// actions become MechClips with the same events, and it carries grip, support and socket
// information so Character.equip() can hold it. Like makeGun() it tracks its ammunition:
// fire() and reload() play the clips and return whether a round went off.
//
// The first-person viewmodels keep their baked arm choreography (rig.js); the Prop is the
// same gun without arms, for the world: counters, pickups, other characters' hands.
import { Kit, Material, Node, Prop, MechClip } from '../../engine/index.js';
import { inFrame, offset } from './rig.js';

const EASE = { snap: 'snap', hold: 'step', in: 'in', out: 'out', linear: 'linear' };
// V5 armory parts are named in its style (barrels, bolt, hammer...); keep ours, they read the same
const clipTracks = (keys) => keys.map((k) => [k.t, k.v, EASE[k.ease] || 'inOut']);

export function weaponProp(gun, { capacity = 1, detail = 1 } = {}) {
  const prop = new Prop(gun.name, { kind: 'gun', params: { kind: gun.id } });
  prop.gunKind = gun.id;
  const mats = {};
  for (const [name, def] of Object.entries(gun.materials)) mats[name] = new Material({ name, ...def });
  prop.materials = mats;

  // one node per bone, nested as the skeleton is (weapon space, heads relative to the parent)
  const heads = { weapon: [0, 0, 0] }, parents = {};
  for (const b of gun.bones) { heads[b.name] = b.head; parents[b.name] = b.parent || 'weapon'; }
  for (const [name, seat] of Object.entries(gun.props || {})) { heads[name] = seat; parents[name] = 'weapon'; }
  const nodes = { weapon: prop }, kits = {};
  const nodeFor = (name) => {
    if (nodes[name]) return nodes[name];
    const parent = nodeFor(parents[name]);
    const n = new Node(name[0].toUpperCase() + name.slice(1));
    const ph = heads[parents[name]];
    n.position.set(heads[name].map((v, i) => v - ph[i]));
    parent.add(n);
    return (nodes[name] = n);
  };
  const W0 = gun.W0;
  for (const part of gun.parts) {
    const bone = part.bind.bone || 'weapon';
    if (!(bone in heads)) continue; // arms and anything not on the gun
    nodeFor(bone);
    const h = heads[bone];
    const kit = (kits[bone] ||= new Kit({}));
    const shape = detail !== 1 && part.shape.radialSegments ? { ...part.shape, radialSegments: Math.max(6, Math.round(part.shape.radialSegments * detail)) } : part.shape;
    // part positions are in rig space (W0 + weapon space)
    const p = part.position.map((v, i) => v - W0[i] - h[i]);
    kit.shape(mats[part.material], shape, part.modifiers, p, part.rotation, part.scale);
  }
  for (const [bone, kit] of Object.entries(kits)) nodes[bone].add(kit.toNode(nodes[bone].name + ' mesh'));

  // moving parts: slides and spins become Rig parts, toggled bones and loose props show and hide
  const R = prop.rig, actions = Object.values(gun.actions);
  const range = (track, bone) => {
    const vs = actions.flatMap((a) => (a[track]?.[bone] || []).map((k) => k.v)).concat(0);
    return [Math.min(...vs), Math.max(...vs)];
  };
  const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  for (const [bone, ax] of Object.entries(gun.slides || {})) { const [min, max] = range('slides', bone); R.add(bone, nodeFor(bone), { type: 'slide', axis: AX[ax], min, max, stiffness: 600 }); }
  for (const [bone, ax] of Object.entries(gun.spins || {})) { const [min, max] = range('spins', bone); R.add(bone, nodeFor(bone), { axis: AX[ax], min, max, stiffness: 400 }); }
  const show = (bone, on) => { if (nodes[bone]) nodes[bone].visible = on; };
  for (const bone of gun.toggles || []) show(bone, (gun.toggleDefault?.[bone] ?? 1) >= 0.5);
  for (const [bone, d] of Object.entries(gun.propsDefault || {})) show(bone, d.attach !== 'world'); // HIDDEN props are parked in the world

  // clips: the moving-part tracks of every action, plus its events; toggles become show/hide events
  for (const [name, a] of Object.entries(gun.actions)) {
    const tracks = {}, events = [...(a.events || [])];
    for (const bone of Object.keys(gun.slides || {})) if (a.slides?.[bone]) tracks[bone] = clipTracks(a.slides[bone]);
    for (const bone of Object.keys(gun.spins || {})) if (a.spins?.[bone]) tracks[bone] = clipTracks(a.spins[bone]);
    for (const [bone, keys] of Object.entries(a.toggles || {})) {
      let prev = null;
      for (const k of keys) { const on = k.v >= 0.5; if (on !== prev) events.push({ t: k.t, name: on ? 'show' : 'hide', data: bone }); prev = on; }
    }
    // loose props (magazines, clips, shells) hide while the hands have them away from the gun
    for (const [bone, keys] of Object.entries(a.props || {})) {
      let prev = null;
      for (const k of keys) { const on = k.attach !== 'world'; if (on !== prev) events.push({ t: k.t, name: on ? 'show' : 'hide', data: bone }); prev = on; }
    }
    prop.addClip(new MechClip(name, a.duration, tracks, events));
  }
  // a part that looks the same every `period` degrees (a six-shot cylinder) is wrapped after each clip
  const play = prop.play.bind(prop);
  prop.play = async (name, o) => {
    const c = await play(name, o);
    for (const [bone, period] of Object.entries(gun.spinPeriod || {})) { const part = R.get(bone); if (part) part.snap(((part.value % period) + period) % period); }
    return c;
  };
  prop.handlers.show = (bone) => show(bone, true);
  prop.handlers.hide = (bone) => show(bone, false);

  // holding: the right hand's grip (the prop's transform in the hand bone's frame), the
  // support hand's point, and sockets for the muzzle, ejection port and sights
  const idle = gun.actions.Idle, gripKey = idle.handR[0], supKey = idle.handL[0];
  const inHand = inFrame(gripKey, { p: [0, 0, 0], r: [0, 0, 0] });
  const supportAt = supKey.attach === 'weapon' ? supKey.p : offset(heads[supKey.attach] || [0, 0, 0], supKey.p);
  prop.grip = { pose: 'gunGrip', socket: { position: inHand.p, rotation: inHand.r } };
  prop.support = { position: supportAt, pose: { curl: [0.45, 0.55, 0.6, 0.65, 0.7], spread: 0.1 } };
  prop.sockets = { muzzle: gun.points.muzzle, ejection: gun.points.eject, sightRear: gun.points.sightRear, sightFront: gun.points.sightFront };
  prop.twoHanded = true;

  // ammunition, armory style
  const cap = capacity;
  const st = prop.state = { capacity: cap, rounds: cap };
  const reloadClip = gun.firstPerson.actions.reload;
  prop.play2 = (name) => prop.play(name);
  prop.ammo = () => st.rounds;
  prop.fire = async () => {
    if (prop.rig.playing) return false;
    const live = st.rounds > 0;
    if (live) { st.rounds--; await prop.play('Fire'); } else prop.onEvent?.({ name: 'dryfire' });
    return live;
  };
  prop.reload = async () => {
    if (prop.rig.playing || st.rounds >= cap) return false;
    if (reloadClip === 'Reload') await prop.play('Reload');
    else { await prop.play(reloadClip); while (st.rounds < cap) { await prop.play('Insert Shell'); } await prop.play('Reload End'); return true; }
    st.rounds = cap;
    return true;
  };
  prop.handlers.shellIn = () => { st.rounds = Math.min(cap, st.rounds + 1); };
  prop.handlers.magIn = () => { st.rounds = cap; };
  return prop;
}
