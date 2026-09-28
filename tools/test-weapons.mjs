// Weapon rigs: every clip bakes to finite transforms, and the actions leave each gun in the
// state the game expects (magazine seated, bolt and pump home, shells hidden, flash only on the shot).
import { WEAPONS } from '../src/weapons/index.js';
import { sampleClip } from '../engine/animation.js';
import { vec3, mat4 } from '../engine/math.js';
let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
for (const w of WEAPONS) {
  const ch = w.create(), sk = ch.skeleton, idx = (n) => sk.boneIndex(n), g = w.gun;
  const at = (name, t) => { const c = ch.mixer.clips.get(name); sampleClip(c, sk, t, ch.mixer.pose); sk.copyPose(ch.mixer.pose); sk.update(); };
  const wm = () => sk.world.subarray(idx('weapon') * 16, idx('weapon') * 16 + 16);
  const propOffset = (bone) => vec3.dist(sk.worldHead(idx(bone)), vec3.transformMat4([0, 0, 0], g.props[bone], wm()));
  const hidden = (bone) => sk.worldHead(idx(bone))[1] < -10;
  for (const clip of ch.mixer.clips.values()) {
    let finite = true;
    for (let k = 0; k <= 40; k++) { at(clip.name, (k / 40) * clip.duration); if (![...sk.world].every(Number.isFinite)) finite = false; }
    check(finite, `${g.name}: ${clip.name.padEnd(13)} ${clip.duration.toFixed(2)} s, ${clip.tracks.length} tracks, finite`);
  }
  at('Fire', 0.01); check(!hidden('flash'), `${g.name}: muzzle flash on the shot`);
  at('Fire', ch.mixer.clips.get('Fire').duration); check(hidden('flash'), `${g.name}: muzzle flash gone after the shot`);
  for (const n of ['Idle', 'Inspect']) { at(n, ch.mixer.clips.get(n).duration); for (const s of Object.keys(g.slides || {})) check(Math.abs(sk.pos[idx(s) * 3 + 2]) < 1e-3, `${g.name}: ${s} home after ${n}`); }
  if (g.props.mag) {
    at('Reload', 0); check(propOffset('mag') < 0.002, `${g.name}: magazine seated before the reload`);
    const dur = ch.mixer.clips.get('Reload').duration;
    let left = false; for (let t = 0; t < dur; t += 0.05) { at('Reload', t); if (propOffset('mag') > 0.3) left = true; }
    check(left, `${g.name}: the old magazine leaves the rifle`);
    at('Reload', dur); check(propOffset('mag') < 0.002, `${g.name}: magazine seated after the reload`);
  }
  if (g.props.shell) {
    at('Idle', 0); check(hidden('shell'), `${g.name}: no loose shell at idle`);
    at('Insert Shell', 0.3); check(propOffset('shell') < 0.06, `${g.name}: shell at the loading port`);
    at('Insert Shell', 0.45); check(hidden('shell'), `${g.name}: shell gone into the tube`);
  }
}
process.exit(fail ? 1 : 0);
