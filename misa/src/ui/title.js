// Title screen: continue / new game / load, with three save slots.
import { register, get } from '../core/registry.js';
import { SLOTS, slotInfo, deleteSlot } from '../core/save.js';
import { drawChar } from '../gfx/chars.js';
import { sprite } from '../artcache.js';
import { drawText, drawTextC } from '../font.js';
import { UI, rect, panel, button } from './ui.js';
import { WorldScene } from '../world/world.js';

export function startWorld(game, fresh) {
  const w = new WorldScene(game);
  game.scenes.replaceAll(w);
  const s = game.state;
  w.load(s.map, s.pos.x, s.pos.y, s.pos.dir);
  w.fade = 1; w.fadeTo = 0;
  game.bus.emit(fresh ? 'gameStart' : 'gameLoaded', {});
  return w;
}

class TitleScene {
  constructor(game) { Object.assign(this, { name: 'title', game, mode: 'main', sel: 0, t: 0, music: 'title', confirmDel: null }); }
  update(dt, input) {
    this.t += dt;
    const game = this.game, k = input.pressed;
    const items = this.items();
    if (k.has('arrowdown') || k.has('s')) { this.sel = (this.sel + 1) % items.length; game.sfx('blip'); }
    if (k.has('arrowup') || k.has('w')) { this.sel = (this.sel + items.length - 1) % items.length; game.sfx('blip'); }
    if (k.has('escape') && this.mode !== 'main') { this.mode = 'main'; this.sel = 0; game.sfx('back'); }
    this.input = input;
  }
  items() {
    if (this.mode === 'main') {
      const any = [1, 2, 3].some((s) => slotInfo(s));
      return [...(any ? [{ t: 'Continue', f: () => this.continueLatest() }] : []), { t: 'New game', f: () => { this.mode = 'new'; this.sel = 0; } }, ...(any ? [{ t: 'Load game', f: () => { this.mode = 'load'; this.sel = 0; } }] : []), { t: 'Settings', f: () => this.game.open('phone', 'settings', { fromTitle: true }) }];
    }
    return Array.from({ length: SLOTS }, (_, i) => {
      const info = slotInfo(i + 1);
      const label = info ? `Slot ${i + 1}  Day ${info.day}  ${info.money}c  ${Math.round(info.playMs / 60000)}m` : `Slot ${i + 1}  (empty)`;
      return { t: label, info, f: () => this.pickSlot(i + 1, info) };
    }).concat([{ t: 'Back', f: () => { this.mode = 'main'; this.sel = 0; } }]);
  }
  continueLatest() {
    let best = null;
    for (let s = 1; s <= SLOTS; s++) { const i = slotInfo(s); if (i && (!best || i.playMs > best.playMs)) best = i; }
    if (best && this.game.load(best.slot)) startWorld(this.game, false);
  }
  pickSlot(slot, info) {
    const game = this.game;
    if (this.mode === 'load') { if (info && game.load(slot)) startWorld(game, false); return; }
    if (info && this.confirmDel !== slot) { this.confirmDel = slot; game.toast('Slot in use: pick it again to overwrite'); return; }
    deleteSlot(slot); game.newGame(slot); startWorld(game, true); game.save();
  }
  draw(g) {
    const game = this.game, t = this.t, input = this.input || game.input;
    // sky, hills and the town at dusk
    const grd = ['#f7d9b5', '#f5c7a0', '#f0b494', '#e8a08e'];
    grd.forEach((c, i) => rect(g, c, 0, i * 28, 320, 28));
    for (let i = 0; i < 8; i++) rect(g, '#fff6e6', ((i * 53 + t * 5) % 360) - 30, 14 + (i % 3) * 16, 24, 5);
    rect(g, '#fff3c4', 246, 22, 22, 22); rect(g, '#ffe9a0', 248, 24, 18, 18);
    rect(g, '#d69a8a', 0, 100, 320, 124); rect(g, '#c4877e', 0, 112, 320, 112);
    for (let i = 0; i < 9; i++) { const x = i * 38 - 6, h = 20 + ((i * 37) % 22); rect(g, '#9a6878', x, 112 - h, 30, h); rect(g, '#7a5068', x - 2, 110 - h, 34, 4); rect(g, (i + Math.floor(t)) % 3 ? '#ffe9a0' : '#c4877e', x + 8, 118 - h, 5, 5); }
    rect(g, '#a67548', 0, 176, 320, 48); rect(g, '#c39264', 0, 176, 320, 3);
    drawChar(g, 'misa', null, 'down', 'idle', t, 72, 216, 2);
    g.drawImage(sprite(`mochi_sit_${Math.floor(t * 2.2) % 4}`), 104, 188, 52, 52);
    drawTextC(g, "MISA'S", 160, 14, '#7a4f3a', 3, '#fff6e6');
    drawTextC(g, 'LITTLE LIFE', 160, 34, '#e0707a', 3, '#fff6e6');
    drawTextC(g, 'A COZY TOWN LIFE SIM', 160, 58, '#7a4f3a', 1, null);
    const items = this.items(), wbox = this.mode === 'main' ? 110 : 168, x0 = 300 - wbox, y0 = 84;
    panel(g, x0 - 6, y0 - 6, wbox + 12, items.length * 15 + 12, 'paper');
    items.forEach((it, i) => { if (button(g, input, x0, y0 + i * 15, wbox, 13, it.t, { focused: i === this.sel })) { game.sfx('select'); it.f(); } });
    drawTextC(g, 'ARROWS + ENTER  -  OR CLICK', 160, 214, '#fff6e6', 1, '#2b1d2e88');
  }
}
register('scene', 'title', { make: (game) => new TitleScene(game) });
