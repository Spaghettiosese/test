// What the player can do with the world: what is being looked at, doors and locks, chests,
// bodies, loose objects, torches to snuff, stairs, notes and talk.
import * as E from '../../engine/index.js';
import { ITEMS } from './items.js';

const hyp = Math.hypot;
const P = {};
const TAKE = { mug: 'mug', candlestick: 'candlestick', book: 'book', bread: 'bread', cheese: 'cheese' };
const PROP_NAME = { mug: 'pewter mug', candlestick: 'candlestick', book: 'old book', bread: 'loaf of bread', cheese: 'wheel of cheese', jug: 'clay jug', bottle: 'bottle', skull: 'skull', stool: 'stool', bucket: 'bucket', crateS: 'small crate', sack: 'sack', pot: 'clay pot' };

P.setupTeleports = function setupTeleports() {
  const L = this.level, S = L.stairsDown, U = L.stairsUp, U2 = L.stairsUp2, C = L.stairsFromCellar;
  const add = (o, prompt, dest) => L.interactables.push({ kind: 'stairs', x: o.x, y: 1, z: o.z, r: o.r, prompt: () => prompt, use: () => this.teleport(dest) });
  add(S, 'Descend into the crypt', { pos: [76, 0.1, 17], yaw: Math.PI / 2, area: 'The Catacombs' });
  add(U, 'Climb to the graveyard', { pos: [-42.3, 0.1, 84.3], yaw: Math.PI, area: 'The Graveyard' });
  add(U2, 'Climb the cellar stairs', { pos: [-14.5, 0.1, 128.6], yaw: 0, area: 'Ravenspire: Pantry' });
  add(C, 'Descend into the undercroft', { pos: [120.5, 0.1, 56.2], yaw: Math.PI, area: 'Ravenspire: Undercroft' });
};
P.teleport = function teleport(dest) { if (this.tele) return; this.tele = { t: 0, dest, done: false }; this.sfx.door?.(true); };
P.updateTeleport = function updateTeleport(dt) {
  const T = this.tele; if (!T) return;
  T.t += dt; this.pix.fade = Math.min(1, T.t / 0.35);
  if (T.t > 0.4 && !T.done) { T.done = true; const P = this.player; P.cc.position = [...T.dest.pos]; P.cc.velocity = [0, 0, 0]; P.yaw = T.dest.yaw; P.pitch = 0; this.ui.area(T.dest.area); this.noise(T.dest.pos, 3, 'step'); }
  if (T.t > 0.5) this.pix.fade = Math.max(0, 1 - (T.t - 0.5) / 0.4);
  if (T.t > 0.9) { this.pix.fade = 0; this.tele = null; }
};

// ------------------------------------------------------------ finding the target
P.updateInteraction = function updateInteraction(dt) {
  this.updateTeleport(dt);
  const pl = this.player, eye = pl.eyePos, f = pl.forward;
  const c = [];
  const push = (x, y, z, r, prompt, use, kind, cosMin = 0.72, obj = null) => c.push({ x, y, z, r, prompt, use, kind, cosMin, obj });
  for (const it of this.level.interactables) {
    if (Math.abs(it.x - eye[0]) > it.r + 1 || Math.abs(it.z - eye[2]) > it.r + 1) continue;
    const pr = it.prompt(); if (!pr) continue;
    push(it.x, it.y, it.z, it.r, pr, () => it.use(this), it.kind, it.kind === 'stairs' ? 0.3 : 0.7, it.obj);
  }
  for (const d of this.level.doors) {
    if (Math.abs(d.x - eye[0]) > 3.4 || Math.abs(d.z - eye[2]) > 3.4) continue;
    if (d.gate && !d.locked && this.gatesOpen && this.level.gates?.includes(d)) continue;
    push(d.x, d.y + 1.1, d.z, 2.7, this.doorPrompt(d), () => this.useDoor(d), 'door', 0.55, d);
  }
  for (const n of this.npcs) {
    if (Math.abs(n.x - eye[0]) > 3.8 || Math.abs(n.z - eye[2]) > 3.8) continue;
    if (n.dead) { if (n.loot.length && n.frozen !== undefined) push(n.x, n.y + 0.4, n.z, 2.4, `Search ${n.name.toLowerCase()}`, () => this.lootBody(n), 'body', 0.6, n); continue; }
    if (n.talkable && (n.state === 'routine' || n.state === 'handsup') && !n.lying && n.alert < 0.6) push(n.x, n.y + 1.4, n.z, 3.4, `Talk to ${n.name}`, () => this.story.talk(n), 'talk', 0.8, n);
    else if (n.guard || n.state !== 'flee') {
      // backstab hint for unaware people
      const dx = n.x - eye[0], dz = n.z - eye[2], d = hyp(dx, dz);
      if (d < 2.4 && !n.lying && n.state === 'routine' && n.alert < 0.6 && (dx * n.fwd[0] + dz * n.fwd[1]) / (d || 1) > 0.4) push(n.x, n.y + 1.4, n.z, 2.4, '', () => {}, 'backstab', 0.85, n);
    }
    if (n.lying && n.talkable === false) { /* sleeper: attack only */ }
  }
  for (const b of this.dynBodies) {
    if (!b.userData.pick || b === pl.carried || b.userData.broken) continue;
    if (Math.abs(b.position[0] - eye[0]) > 2.6 || Math.abs(b.position[2] - eye[2]) > 2.6) continue;
    const nm = PROP_NAME[b.userData.prop] || 'object', take = TAKE[b.userData.prop];
    push(b.position[0], b.position[1], b.position[2], 2.4, take ? `Take the ${nm}` : `Pick up the ${nm}`, () => (take ? this.takeProp(b, take) : pl.grab(b)), 'prop', 0.82, b);
  }
  this.tools.hook(push, eye, f);
  let best = null, bs = 1e9;
  for (const t of c) {
    const dx = t.x - eye[0], dy = t.y - eye[1], dz = t.z - eye[2], d = Math.hypot(dx, dy, dz);
    if (d > t.r) continue;
    const cos = (dx * f[0] + dy * f[1] + dz * f[2]) / (d || 1);
    if (cos < t.cosMin && d > 0.9) continue;
    const s = d * (2.4 - cos) * (t.kind === 'talk' ? 0.55 : t.kind === 'body' ? 0.8 : 1) + (t.kind === 'prop' ? 0.8 : 0);
    if (s < bs) { bs = s; best = t; }
  }
  if (best && best.kind !== 'stairs' && best.kind !== 'talk' && best.kind !== 'body' && best.kind !== 'backstab' && best.kind !== 'door') {
    if (!this.canSee(eye, [best.x, best.y, best.z], null)) best = null;
  }
  this.target = best && best.kind !== 'backstab' ? best : null;
  this.backstabTarget = best && best.kind === 'backstab' ? best.obj : null;
  if (pl.picking) this.ui.setPrompt(null); else this.ui.setPrompt(this.target ? this.target.prompt : this.backstabTarget ? 'Attack: backstab' : null, this.target?.kind);
  if (pl.usePress && this.target && !pl.picking && !this.story.busy) { this.target.use(); pl.usePress = false; if (this.target.kind === 'door' || this.target.kind === 'talk') pl.playVm('Reach', 0.06); }
};

// ------------------------------------------------------------ doors & locks
P.doorGroup = function doorGroup(d) { return d.id ? this.level.doors.filter((x) => x.id === d.id) : [d]; };
P.doorPrompt = function doorPrompt(d) {
  if (d.locked) {
    if (d.keyId && this.player.inv.has(d.keyId)) return `Unlock the ${d.name} (${ITEMS[d.keyId].name})`;
    if (d.gate || d.lockLevel > 3) return `The ${d.name} is barred`;
    if (d.keyId === 'gatekey') return 'The gate is barred';
    return `Pick the lock of the ${d.name}` + (this.player.inv.has('lockpick') ? ' (hold E)' : ' (no lockpick)');
  }
  return d.isOpen() ? `Close the ${d.name}` : `Open the ${d.name}`;
};
P.useDoor = function useDoor(d) {
  const pl = this.player, group = this.doorGroup(d);
  if (d.locked) {
    if (d.keyId && pl.inv.has(d.keyId)) { for (const x of group) x.locked = false; this.toast(`Unlocked with the ${ITEMS[d.keyId].name}`); this.sfx.lockClick?.(); this.stats.unlocked = (this.stats.unlocked || 0) + 1; return; }
    if (d.gate || d.lockLevel > 3) { this.toast('It will not budge'); this.sfx.deny?.(); return; }
    if (d.keyId === 'gatekey' && !d.pickable) { this.toast('It is barred from the other side'); this.sfx.deny?.(); return; }
    pl.startPicking(d, d.lockLevel || 1, () => { for (const x of group) x.locked = false; this.toast('Click. The lock gives'); this.stats.unlocked = (this.stats.unlocked || 0) + 1; });
    return;
  }
  const open = d.isOpen();
  for (const x of group) { if (open) x.close(); else x.open(pl.pos[0], pl.pos[2]); }
  this.sfx.door?.(!open, [d.x, 1, d.z]); this.noise([d.x, 0, d.z], open ? 5 : 4, 'step');
};

// ------------------------------------------------------------ chests & loot
P.openContainer = function openContainer(c) {
  const pl = this.player;
  if (c.locked) {
    if (c.keyId && pl.inv.has(c.keyId)) { c.locked = false; this.toast(`Unlocked with the ${ITEMS[c.keyId].name}`); this.sfx.lockClick?.(); }
    else { pl.startPicking(c, c.lockLevel || 1, () => { c.locked = false; this.openContainer(c); }); return; }
  }
  if (!c.opened) { c.opened = true; this.progress.addXp(4, 'looted'); this.rep.crime('theft', [c.x, c.y, c.z], { range: 14 }); this.stats.opened++; this.sfx.chest?.([c.x, c.y, c.z]); this.noise([c.x, 0, c.z], 4, 'step'); pl.playVm('Reach', 0.06); }
  this.giveLoot(c.loot, c.name); c.loot = [];
  this.story.onContainer?.(c);
};
P.giveLoot = function giveLoot(list, from = '') {
  if (!list.length) { this.toast('Nothing but dust'); return; }
  const parts = [];
  for (const [id, n] of list) {
    this.player.inv.add(id, n);
    const it = ITEMS[id] || { name: id };
    parts.push(id === 'gold' ? `${n} gold` : n > 1 ? `${it.name} ×${n}` : it.name);
    if (id === 'gold') this.sfx.coin?.(); this.story.onItem?.(id, n);
    if (it.kind === 'key' || it.kind === 'quest') this.ui.flashBanner(`Found: ${it.name}`, 2000);
  }
  this.stats.looted++;
  this.toast('Took ' + parts.join(', '));
};
P.lootBody = function lootBody(n) { if (!n.loot.length) return; this.giveLoot(n.loot, n.name); n.loot = []; this.story.onBodyLooted?.(n); };
P.takeProp = function takeProp(b, itemId) {
  this.player.inv.add(itemId, 1); this.toast('Took the ' + ITEMS[itemId].name); this.sfx.coin?.();
  const i = this.dynBodies.indexOf(b); if (i >= 0) this.dynBodies.splice(i, 1);
  this.world.remove(b); if (b.node) b.node.parent?.remove(b.node);
  this.story.onItem?.(itemId, 1);
};
P.useItem = function useItem(id) {
  const pl = this.player; if (!pl.inv.has(id)) { this.toast(`No ${ITEMS[id].name}`); return; }
  const it = ITEMS[id];
  if (id === 'potion') { if (pl.hp >= pl.maxHp - 1) { this.toast('You are not hurt'); return; } pl.inv.remove(id, 1); pl.hp = Math.min(pl.maxHp, pl.hp + it.heal); this.sfx.drink?.(); this.toast('Red Salve: +50 health'); }
  else if (id === 'ember') { if (pl.ember >= pl.maxEmber - 1) return; pl.inv.remove(id, 1); pl.ember = Math.min(pl.maxEmber, pl.ember + it.ember); this.sfx.drink?.(); this.toast('Ember Flask: +60 Ember'); }
  else if (it.heal) { pl.inv.remove(id, 1); pl.hp = Math.min(pl.maxHp, pl.hp + it.heal); this.toast(`Ate the ${it.name}`); }
};

// ------------------------------------------------------------ light
P.snuff = function snuff(t) {
  if (!t.lit) return;
  t.lit = false; t.wasLit = true; t.light.intensity = 0; if (t.flame) t.flame.visible = false; if (t.flames) for (const f of t.flames) f.visible = false;
  this.sfx.snuff?.(); this.emitBurst([t.x, t.y, t.z], 'poof'); this.player.playVm('Pinch', 0.05);
  this.player.ember = Math.min(this.player.maxEmber, this.player.ember + (t.small ? 3 : 9)); this.stats.snuffed++;
  this.toast(t.small ? 'Pinched out' : 'Torch snuffed  +Ember'); this.story.onSnuff?.(t);
};
P.relight = function relight(t, by) {
  if (t.lit) return; t.lit = true; t.light.intensity = t.base; if (t.flame) t.flame.visible = true; if (t.flames) for (const f of t.flames) f.visible = true;
  this.sfx.thud?.(0.2, [t.x, t.y, t.z]);
};
P.readNote = function readNote(id) { this.story.readNote(id); };
P.toast = function toast(t) { this.ui.toast(t); };
P.flashText = function flashText(t) { this.ui.flashBanner(t, 900, true); };
P.bark = function bark(npc, text, pitch = 1) {
  if (npc.dist > 22 && npc.state !== 'chase') return;
  this.ui.bark(npc.name, text, npc);
  for (let i = 0; i < Math.min(5, Math.ceil(text.length / 4)); i++) setTimeout(() => this.sfx.blip?.((npc.spec.voice || 1) * pitch, npc.pos), i * 70);
};
P.wakeSleeper = function wakeSleeper() {};

export function installInteractionMethods(G) { Object.assign(G.prototype, P); }
