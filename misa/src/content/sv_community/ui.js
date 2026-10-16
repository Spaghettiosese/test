// Community Hall screens: the bundle board scene (`game.open('ch_bundles', roomId)`), the "Hall" phone app,
// the festival backdrop for the final ceremony, noticeboard notes and the jingle sound effects.
// Controls: tap/click a bundle or slot to select it, tap it again (or the Put in button, or A/E/Enter) to hand it over,
// B/Esc or the X button closes. Every target is at least 16 px.
import { register } from '../../core/registry.js';
import { addSfx } from '../../audio.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { spr, RAMPS as C } from '../town/lib.js';
import { UI, panel, rect, inside, iconC, drawText, drawTextC, drawTextR, measure, wrapPx } from '../../ui/ui.js';
import { KODAMA_TINTS, kodama } from './art.js';
import { ROOMS, ROOM_ORDER, BUNDLE, BUNDLES, bundlesOf, S, slotName, slotIcon, isFilled, filledCount, isDone, roomDone, have, canFill, deposit, depositAll, rewardText, roomProgress, totalProgress, fillable, missingItems, whereHint, murmurText, COINS } from './data.js';

// ---------------------------------------------------------------- sprite jingles
addSfx('hall_ding', ({ tone }) => { tone(988, 0.1, 'triangle', 0.05); tone(1319, 0.16, 'triangle', 0.05, 0, 0.07); });
addSfx('hall_jingle', ({ tone }) => [523, 659, 784, 988, 1319].forEach((f, i) => tone(f, 0.17, 'triangle', 0.05, 0, i * 0.08)));
addSfx('hall_fanfare', ({ tone }) => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.05, 0, i * 0.1)); [1047, 1319, 1568].forEach((f) => tone(f, 0.7, 'sine', 0.04, 0, 0.7)); });

spr('ch_i_hall', 16, 16, (R) => { // phone icon: a kodama face under a leaf
  R.t([8, 0], [2, 6], [14, 6], C.forest[3]); R(8, 1, 1, 5, C.forest[2]); R.e(8, 10, 6, 5, C.paper[4]); R(5, 9, 2, 3, C.ink[1]); R(10, 9, 2, 3, C.ink[1]); R(7, 13, 2, 1, C.coral[2]);
}, {});

const clip = (s, px) => { s = String(s); while (s.length > 1 && measure(s) > px) s = s.slice(0, -1); return s; };
const accent = (room) => ({ fish: C.sky, pantry: C.butter, craft: C.lilac, garden: C.mint, night: C.navy, vault: C.vermilion })[room] || C.coral;
function blit(g, name, x, y, scale = 1, alpha = 1) {
  const d = SPRITES[name]; if (!d) return;
  const img = sprite(name); g.globalAlpha = alpha; g.drawImage(img, Math.round(x), Math.round(y), Math.round(img.width * scale), Math.round(img.height * scale)); g.globalAlpha = 1;
}
function slotIconDraw(g, item, cx, cy, alpha = 1) {
  const name = slotIcon(item); if (!name) return;
  g.globalAlpha = alpha; iconC(g, name, cx, cy); g.globalAlpha = 1;
}
const confetti = (t, seed) => Array.from({ length: 36 }, (_, i) => { const a = (i * 2.399 + seed) % 6.283, sp = 40 + ((i * 53) % 70), x = 160 + Math.cos(a) * sp * t, y = 100 + Math.sin(a) * sp * t * 0.7 + 60 * t * t; return { x, y, c: [C.coral[2], C.butter[3], C.mint[2], C.sky[3], C.sakura[3]][i % 5], s: 2 + (i % 2) }; });

// ---------------------------------------------------------------- the bundle board scene
class BundleScene {
  constructor(game, room) {
    this.name = 'ch_bundles'; this.music = 'library'; Object.assign(this, { game, room, t: 0, bsel: 0, ssel: 0, msg: '', msgT: 0, queue: [], cele: null, hall: false, rooms: [] });
    this.list = bundlesOf(room);
    const first = this.list.findIndex((b) => !isDone(game, b.id)); this.bsel = Math.max(0, first);
    game.bus.emit('hallOpened', { room });
  }
  get bundle() { return this.list[this.bsel]; }
  say(text) { this.msg = text; this.msgT = 2.4; }
  pick(i) { this.bsel = Math.max(0, Math.min(this.list.length - 1, i)); this.ssel = 0; }
  put(all = false) {
    const g = this.game, b = this.bundle;
    if (isDone(g, b.id)) return this.say('This bundle is complete. The sprites are delighted.');
    const r = all ? depositAll(g, b.id) : deposit(g, b.id, this.ssel);
    if (!r.ok) return this.say(all ? 'Nothing here that you are carrying.' : r.why || 'Cannot do that');
    g.sfx('hall_ding'); this.say(all ? `Handed over ${r.count} thing${r.count > 1 ? 's' : ''}!` : 'Thank you! The sprites cheer softly.');
    if (r.bundle) {
      this.queue.push({ kind: 'bundle', title: 'BUNDLE COMPLETE!', sub: b.name, extra: `Reward: ${rewardText(b)}` });
      if (r.room) this.rooms.push(this.room);
      if (r.room) this.queue.push({ kind: 'room', title: 'ROOM RESTORED!', sub: ROOMS[this.room].name, extra: ROOMS[this.room].perk });
      if (r.hall) { this.queue.push({ kind: 'hall', title: 'THE HALL IS RESTORED!', sub: 'Hoshimori Community Hall', extra: 'Every sprite is dancing.' }); this.hall = true; }
      this.next();
    }
  }
  next() {
    const c = this.queue.shift();
    this.cele = c ? { ...c, t: 0 } : null;
    if (c) this.game.sfx(c.kind === 'hall' ? 'hall_fanfare' : 'hall_jingle');
  }
  close() {
    this.game.sfx('back'); this.game.scenes.pop(this);
    const steps = [];
    for (const r of this.rooms) if (this.game.hallRoomScene) steps.push(...this.game.hallRoomScene(r));
    if (this.hall && this.game.hallCeremony) steps.push(...this.game.hallCeremony());
    if (steps.length) this.game.run(steps);
  }
  update(dt, input, game) {
    this.t += dt; this.msgT -= dt;
    const k = input.pressed, click = input.justDown;
    if (this.cele) {
      this.cele.t += dt;
      if (this.cele.t > 0.8 && (click || k.has('e') || k.has('enter') || k.has(' ') || k.has('escape'))) this.next();
      else if (this.cele.t > 7) this.next();
      return;
    }
    if (k.has('escape') || k.has('backspace') || (click && inside(input.mx, input.my, 294, 1, 24, 14))) return this.close();
    if (k.has('arrowdown') || k.has('s')) this.pick(this.bsel + 1);
    if (k.has('arrowup') || k.has('w')) this.pick(this.bsel - 1);
    const b = this.bundle;
    if (k.has('arrowright') || k.has('d')) this.ssel = (this.ssel + 1) % b.slots.length;
    if (k.has('arrowleft') || k.has('a')) this.ssel = (this.ssel + b.slots.length - 1) % b.slots.length;
    if (k.has('f')) this.put(true);
    if (k.has('e') || k.has('enter') || k.has(' ')) this.put(false);
    if (click) {
      const mx = input.mx, my = input.my;
      this.list.forEach((_, i) => { if (inside(mx, my, 6, 22 + i * 22, 118, 20)) { if (this.bsel === i) return; this.pick(i); game.sfx('blip'); } });
      b.slots.forEach((_, i) => { const r = slotRect(i); if (inside(mx, my, r.x, r.y, r.w, r.h)) { if (this.ssel === i) this.put(false); else { this.ssel = i; game.sfx('blip'); } } });
      if (inside(mx, my, 138, 118, 80, 16)) this.put(false);
      if (inside(mx, my, 224, 118, 84, 16)) this.put(true);
    }
  }
  draw(g, game) {
    const room = this.room, def = ROOMS[room], A = accent(room), b = this.bundle;
    rect(g, C.ink[1], 0, 0, 320, 224);
    for (let y = 16; y < 224; y += 8) for (let x = ((y / 8) % 2) * 8; x < 320; x += 16) rect(g, '#2a1d30', x, y, 8, 8);
    rect(g, A[2], 0, 0, 320, 16); rect(g, A[3], 0, 0, 320, 2); rect(g, A[1], 0, 15, 320, 1);
    drawText(g, def.name.toUpperCase(), 8, 4, C.ink[0], 1, null);
    const rp = roomProgress(game, room); drawTextR(g, `${rp.done}/${rp.total}`, 286, 4, C.ink[0], 1, null);
    rect(g, C.ink[1], 296, 2, 20, 12); rect(g, C.coral[2], 297, 3, 18, 10); drawTextC(g, 'X', 306, 5, UI.text, 1, null);
    // bundle list
    this.list.forEach((bn, i) => {
      const y = 22 + i * 22, on = i === this.bsel, done = isDone(game, bn.id);
      rect(g, on ? UI.gold : C.ink[3], 6, y, 118, 20); rect(g, done ? C.forest[1] : C.paper[3], 7, y + 1, 116, 18);
      slotIconDraw(g, bn.slots[0][0], 18, y + 10, done ? 0.55 : 1);
      drawText(g, clip(bn.name.replace('Vault Bundle: ', '').replace(' Bundle', ''), 78), 30, y + 3, done ? C.paper[3] : C.ink[1], 1, null);
      drawText(g, done ? 'DONE' : `${filledCount(game, bn)}/${bn.need}`, 30, y + 12, done ? C.butter[3] : C.ink[3], 1, null);
      if (done) { rect(g, C.mint[2], 108, y + 6, 8, 8); rect(g, C.forest[1], 110, y + 10, 2, 2); rect(g, C.forest[1], 112, y + 8, 2, 2); }
    });
    // perk
    panel(g, 6, 22 + this.list.length * 22 + 2, 118, 54, 'butter');
    drawText(g, roomDone(game, room) ? 'ROOM BONUS ACTIVE' : 'WHEN RESTORED', 11, 22 + this.list.length * 22 + 7, C.butter[0], 1, null);
    wrapPx(def.perk, 104).slice(0, 4).forEach((l, i) => drawText(g, l, 11, 22 + this.list.length * 22 + 17 + i * 8, C.ink[1], 1, null));
    // bundle panel
    panel(g, 130, 22, 184, 134, 'paper');
    drawText(g, b.name.toUpperCase(), 138, 28, C.coral[1], 1, null);
    wrapPx(b.blurb, 168).slice(0, 2).forEach((l, i) => drawText(g, l, 138, 38 + i * 8, C.ink[3], 1, null));
    drawText(g, isDone(game, b.id) ? 'COMPLETE!' : `ADD ANY ${b.need} OF ${b.slots.length}`, 138, 54, isDone(game, b.id) ? C.forest[2] : C.ink[1], 1, null);
    b.slots.forEach((s, i) => {
      const r = slotRect(i), fi = isFilled(game, b.id, i), ok = canFill(game, b, i), on = i === this.ssel;
      rect(g, on ? UI.gold : C.ink[2], r.x, r.y, r.w, r.h); rect(g, fi ? C.mint[3] : ok ? C.butter[4] : C.paper[2], r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      slotIconDraw(g, s[0], r.x + r.w / 2, r.y + r.h / 2 - 2, fi || ok ? 1 : 0.35);
      if (s[1] > 1) drawText(g, s[0] === COINS ? (s[1] >= 1000 ? `${s[1] / 1000}K` : s[1]) : `x${s[1]}`, r.x + 2, r.y + r.h - 8, C.ink[1], 1, null);
      if (fi) { rect(g, C.forest[2], r.x + r.w - 9, r.y + 2, 7, 7); rect(g, C.paper[4], r.x + r.w - 7, r.y + 5, 2, 2); }
    });
    // selected slot details and buttons
    const s = b.slots[this.ssel], fiS = isFilled(game, b.id, this.ssel);
    drawText(g, clip(slotName(s[0]) + (s[1] > 1 && s[0] !== COINS ? ` x${s[1]}` : s[0] === COINS ? ` ${s[1]}` : ''), 168), 138, 98, C.ink[1], 1, null);
    drawText(g, fiS ? 'HANDED OVER' : `YOU HAVE ${have(game, s[0])}`, 138, 107, fiS ? C.forest[2] : have(game, s[0]) >= s[1] ? C.forest[2] : C.ribbon[1], 1, null);
    const onS = canFill(game, b, this.ssel), onA = b.slots.some((_, i) => canFill(game, b, i));
    for (const [x, w, txt, en] of [[138, 80, 'PUT IN', onS], [224, 84, 'PUT IN ALL', onA]]) { rect(g, C.ink[1], x, 118, w, 16); rect(g, en ? C.mint[2] : C.paper[1], x + 1, 119, w - 2, 14); drawTextC(g, txt, x + w / 2, 123, en ? C.ink[0] : C.paper[0], 1, null); }
    drawText(g, 'REWARD', 138, 140, C.coral[1], 1, null); drawText(g, clip(rewardText(b), 110), 180, 140, C.ink[1], 1, null);
    drawText(g, `WHERE: ${clip(whereHint(s[0]).toUpperCase(), 130)}`, 138, 148, C.ink[3], 1, null);
    // little hall sprites cheering from the corner
    const fr = Math.floor(this.t * 2) % 2; blit(g, kodama('leaf', fr), 142, 168, 2); blit(g, kodama('rose', 1 - fr), 196, 172, 2); blit(g, kodama('sun', fr), 250, 168, 2);
    if (this.msgT > 0 && this.msg) { panel(g, 20, 190, 280, 20, 'dark'); drawTextC(g, this.msg, 160, 197, UI.text, 1, null); }
    drawTextC(g, 'TAP A SLOT TO PICK, TAP AGAIN TO GIVE   A/E: GIVE  F: ALL  B: CLOSE', 160, 214, '#b9a6c4', 1, null);
    if (this.cele) this.drawCele(g);
  }
  drawCele(g) {
    const c = this.cele, t = c.t, big = c.kind !== 'bundle';
    rect(g, 'rgba(20,10,30,0.78)', 0, 0, 320, 224);
    for (const p of confetti(Math.min(t, 3), c.kind.length)) rect(g, p.c, p.x, p.y, p.s, p.s);
    const n = big ? 5 : 3;
    for (let i = 0; i < n; i++) { const x = 160 + (i - (n - 1) / 2) * 52 - 22, hop = Math.abs(Math.sin(t * 5 + i)) * 10; blit(g, kodama(Object.keys(KODAMA_TINTS)[i % 4], Math.floor(t * 4 + i) % 2), x, 120 - hop, 2); }
    panel(g, 30, 52, 260, 54, 'butter');
    drawTextC(g, c.title, 160, 60, C.coral[1], 2, null);
    drawTextC(g, clip(c.sub, 240), 160, 80, C.ink[0], 1, null);
    wrapPx(c.extra, 240).slice(0, 2).forEach((l, i) => drawTextC(g, l, 160, 90 + i * 8, C.ink[2], 1, null));
    if (t > 0.8) drawTextC(g, 'TAP OR PRESS A', 160, 200, '#fff6a0', 1);
  }
}
function slotRect(i) { return { x: 138 + i * 28, y: 66, w: 26, h: 28 }; }
register('scene', 'ch_bundles', { make: (game, room) => new BundleScene(game, room) });

// ---------------------------------------------------------------- the Hall phone app
register('phoneApp', 'hall', {
  name: 'Hall', icon: 'ch_i_hall', order: 47,
  when: (game) => game.flag('hall_intro'),
  badge: (game) => Math.min(9, fillable(game)),
  open(game, app) { app.state.room = app.state.room || 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('arrowdown') || k.has('s')) st.room = (st.room + 1) % ROOM_ORDER.length;
    if (k.has('arrowup') || k.has('w')) st.room = (st.room + ROOM_ORDER.length - 1) % ROOM_ORDER.length;
    if (input.justDown) ROOM_ORDER.forEach((_, i) => { if (inside(input.mx, input.my, x + 2, y + 20 + i * 22, 112, 20)) st.room = i; });
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, tp = totalProgress(game);
    drawText(g, `COMMUNITY HALL  ${tp.done}/${tp.total} BUNDLES`, x + 4, y + 4, C.coral[1], 1, null);
    rect(g, C.paper[1], x + 4, y + 13, w - 8, 3); rect(g, C.mint[2], x + 4, y + 13, Math.round((w - 8) * tp.done / tp.total), 3);
    ROOM_ORDER.forEach((r, i) => {
      const yy = y + 20 + i * 22, on = i === st.room, rp = roomProgress(game, r), A = accent(r);
      rect(g, on ? UI.gold : C.ink[3], x + 2, yy, 112, 20); rect(g, roomDone(game, r) ? C.mint[3] : C.paper[3], x + 3, yy + 1, 110, 18);
      rect(g, A[2], x + 3, yy + 1, 4, 18);
      drawText(g, clip(ROOMS[r].name, 90), x + 11, yy + 3, C.ink[1], 1, null);
      rect(g, C.paper[1], x + 11, yy + 13, 60, 3); rect(g, A[2], x + 11, yy + 13, Math.round(60 * rp.done / rp.total), 3);
      drawText(g, roomDone(game, r) ? 'OK' : `${rp.done}/${rp.total}`, x + 98, yy + 11, C.ink[2], 1, null);
    });
    const r = ROOM_ORDER[st.room], def = ROOMS[r], bx = x + 120;
    drawText(g, def.name.toUpperCase(), bx, y + 22, C.ink[0], 1, null);
    wrapPx(roomDone(game, r) ? `Restored! ${def.perk}.` : `Reward: ${def.perk}.`, w - 126).slice(0, 3).forEach((l, i) => drawText(g, l, bx, y + 32 + i * 8, roomDone(game, r) ? C.forest[2] : C.ink[3], 1, null));
    bundlesOf(r).forEach((b, i) => {
      const yy = y + 60 + i * 11, d = isDone(game, b.id);
      rect(g, d ? C.mint[2] : C.paper[1], bx, yy, 6, 6);
      drawText(g, clip(b.name.replace('Vault Bundle: ', '').replace(' Bundle', ''), 110), bx + 9, yy, d ? C.forest[2] : C.ink[1], 1, null);
      drawText(g, d ? 'DONE' : `${filledCount(game, b)}/${b.need}`, bx + w - 150, yy, d ? C.forest[2] : C.ink[3], 1, null);
    });
    const m = S(game).murmur;
    panel(g, x + 2, y + 154, w - 4, 16, 'butter');
    drawText(g, clip(m && !isDone(game, m.bid) ? `SPRITES WHISPER: ${m.n > 1 ? m.n : 'A'} ${slotName(m.item).toUpperCase()} FOR ${BUNDLE[m.bid].name.toUpperCase().replace(' BUNDLE', '')}` : 'THE SPRITES HUM A HAPPY SONG.', w - 14), x + 6, y + 159, C.ink[1], 1, null);
  },
});

// ---------------------------------------------------------------- noticeboard notes
register('boardNote', 'ch_note_closed', {
  title: 'The old hall', color: 'butter', when: '!flag:community_restored',
  text: 'The Community Hall on the south road has been shut for years. Folks say the walls whisper at night. Each room wants bundles of fish, food, crafts, crops and stars. Bring what it asks for.',
});
// The text is refreshed every morning by the story module (the sprites murmur a different wish each day).
register('boardNote', 'ch_note_hint', {
  title: 'Hall bundle hint', color: 'mint', when: 'flag:hall_intro&!flag:community_restored',
  text: 'The sprites murmur a different wish every morning.',
});
register('boardNote', 'ch_note_open', {
  title: 'Hall open to all', color: 'sakura', when: 'flag:community_restored',
  text: 'The Community Hall is restored! The sprites ask that you wipe your feet, say hello to the heart tree, and stay for tea.',
});

// ---------------------------------------------------------------- festival backdrop for the ceremony
register('backdrop', 'ch_festival', {
  draw(g, game, t) {
    for (let y = 0; y < 224; y += 4) rect(g, y < 100 ? (y % 8 ? C.navy[0] : C.navy[1]) : C.navy[2], 0, y, 320, 4);
    for (let k = 0; k < 40; k++) rect(g, ((Math.sin(t * 2 + k) + 1) / 2) > 0.6 ? '#ffffff' : C.sky[3], (k * 83 + 17) % 318, (k * 47 + 5) % 90, 1, 1);
    rect(g, C.forest[0], 0, 150, 320, 74); rect(g, C.forest[1], 0, 154, 320, 70); rect(g, C.leaf[2], 0, 160, 320, 64);
    // the hall, lit
    rect(g, C.plaster[3], 100, 100, 120, 60); rect(g, C.roofTeal[2], 92, 84, 136, 18); rect(g, C.roofTeal[3], 92, 84, 136, 3); rect(g, C.butter[3], 150, 118, 20, 42);
    for (const wx of [108, 124, 182, 198]) { rect(g, C.butter[3], wx, 112, 12, 18); rect(g, C.butter[4], wx, 112, 12, 4); }
    // strings of lanterns
    for (let i = 0; i < 16; i++) { const lx = 8 + i * 20, ly = 40 + Math.round(Math.sin(i * 0.7) * 4 + (i % 2) * 6); rect(g, C.woodDark[2], lx, ly - 4, 1, 4); rect(g, [C.vermilion[2], C.butter[3], C.sakura[2], C.mint[2]][i % 4], lx - 3, ly, 7, 9); rect(g, C.butter[4], lx - 1, ly + 3, 3, 3); }
    // fireworks, deterministic by time
    for (let f = 0; f < 3; f++) {
      const ph = ((t * 0.5 + f * 0.37) % 1), cx = 60 + f * 100, cy = 52 + (f % 2) * 14;
      if (ph > 0.15 && ph < 0.85) for (let a = 0; a < 16; a++) { const ang = a * Math.PI / 8, r = (ph - 0.15) * 70; rect(g, [C.coral[3], C.butter[4], C.sky[4]][f], cx + Math.cos(ang) * r, cy + Math.sin(ang) * r + (ph - 0.15) * 20, 2, 2); }
    }
    // dancing hall sprites and petals
    const tints = Object.keys(KODAMA_TINTS);
    for (let i = 0; i < 9; i++) blit(g, kodama(tints[i % 4], Math.floor(t * 3 + i) % 2), 14 + i * 34, 176 - Math.abs(Math.sin(t * 4 + i)) * 12, 1.5);
    for (let k = 0; k < 24; k++) rect(g, C.sakura[3], (k * 37 + t * 20) % 320, (k * 29 + t * 30) % 224, 2, 2);
  },
});
