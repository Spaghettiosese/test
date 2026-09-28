// V5 props: every gun builds as an engine Prop (Kit meshes on rig nodes, MechClips), fires
// until it's empty, reloads to full, and its moving parts end every clip back home.
import { WEAPONS, makeWeaponProp } from '../src/weapons/index.js';
let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const run = (prop, dt = 1 / 60) => { for (let i = 0; i < 2000 && prop.rig.playing; i++) prop.update(dt); };
for (const w of WEAPONS) {
  const prop = makeWeaponProp(w.id), n = w.gun.name;
  let meshes = 0; prop.traverse((x) => { if (x.geometry) meshes++; });
  check(prop.isProp && meshes > 0 && prop.clips.size === Object.keys(w.gun.actions).length, `${n}: V5 Prop with ${meshes} meshes, ${prop.rig.parts.size} rig parts, ${prop.clips.size} clips`);
  check(!!prop.grip?.socket && !!prop.support && !!prop.sockets.muzzle, `${n}: grip, support and muzzle socket`);
  const events = []; prop.onEvent = (e) => events.push(e.name);
  let shots = 0;
  for (let i = 0; i < w.capacity + 1; i++) { const p = prop.fire(); run(prop); if (await p) shots++; }
  check(shots === w.capacity && prop.ammo() === 0 && events.includes('shot'), `${n}: ${shots} shots from ${w.capacity} rounds, then empty`);
  const r = prop.reload(); for (let i = 0; i < 40 && prop.ammo() < w.capacity; i++) { run(prop); await Promise.resolve(); await new Promise((res) => setTimeout(res, 0)); }
  run(prop); await r;
  check(prop.ammo() === w.capacity, `${n}: reloaded to ${prop.ammo()}`);
  const home = [...prop.rig.parts.values()].every((p) => Math.abs(p.value) < 1e-3);
  check(home, `${n}: moving parts home after the reload`);
  const flash = prop.traverse ? (() => { let v = null; prop.traverse((x) => { if (x.name === 'Flash') v = x.visible; }); return v; })() : null;
  check(flash === false, `${n}: muzzle flash hidden at rest`);
}
process.exit(fail ? 1 : 0);
