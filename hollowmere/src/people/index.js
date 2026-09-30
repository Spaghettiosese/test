// createPerson(spec): a Character wearing one of the outfits, sharing the baked clip set,
// with an 'upper' animation layer (spine and up) for attacks and gestures and an 'arm' layer
// for the left arm alone (holding a torch). Weapons attach to the right hand.
import * as E from '../../../engine/index.js';
import { personDefinition } from './outfits.js';
import { bakeClips } from './clips.js';
import { HAND_SOCKET, makeSword, makeSpear, makeMace, makeTorch, makeMug, makeBroom, makeHammer } from './weapons.js';
export * from './weapons.js';
export { OUTFIT_NAMES, SKIN, HAIR } from './outfits.js';

let CLIPS = null;
export const clipDefs = () => (CLIPS ||= bakeClips());

const MAKERS = { sword: () => makeSword('arming'), dark: () => makeSword('dark'), captain: () => makeSword('captain'), nightfang: () => makeSword('nightfang'), dagger: () => makeSword('dagger'), spear: makeSpear, mace: makeMace, torch: makeTorch, mug: makeMug, broom: makeBroom, hammer: makeHammer };

export function createPerson(spec, { detail = 0.5 } = {}) {
  const def = personDefinition(spec);
  def.clips = clipDefs();
  const ch = new E.Character(def, { detail });
  const h = spec.height || 1, w = spec.build || 1;
  ch.scale.set([w * h, h, w * h]);
  ch.spec = spec;
  ch.upper = ch.mixer.addLayer('upper', { mask: E.boneMask(ch.skeleton, ['spine']) });
  ch.armL = ch.mixer.addLayer('armL', { mask: E.boneMask(ch.skeleton, ['shoulder.L']) });
  ch.holding = {};
  if (spec.weapon) ch.hold('R', spec.weapon);
  if (spec.offhand) ch.hold('L', spec.offhand);
  ch.play('Idle', { fade: 0 });
  return ch;
}

// Put a prop in a hand ('R' or 'L'). name: a key of MAKERS, or a Node.
E.Character.prototype.hold = function hold(side, what) {
  if (this.holding[side]) { this.detach(this.holding[side]); this.holding[side] = null; }
  if (!what) return null;
  const node = typeof what === 'string' ? MAKERS[what]() : what;
  const sock = side === 'R' ? HAND_SOCKET : { position: [-HAND_SOCKET.position[0], HAND_SOCKET.position[1], HAND_SOCKET.position[2]], rotation: [90, 0, 0] };
  this.attach(node, 'hand.' + side, sock);
  this.holding[side] = node;
  return node;
};
