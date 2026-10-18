// Flower arranging (ikebana): place three stems, shin (tall), soe (middle) and hikae (low). Pick a flower, then press E when the
// moving cut-line reaches the ideal height marked on the vase. Colour variety, in-season flowers and rare blooms add to the score.
// opts: { stems: [{ id, name, c (colour), season, rare, n }], level }
import { register } from '../../core/registry.js';
import { act } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { rect, disc, clamp, W, H } from '../sv2_play/kit.js';

export const SLOTS = [{ n: 'Shin', ideal: 0.95, x: 150 }, { n: 'Soe', ideal: 0.7, x: 182 }, { n: 'Hikae', ideal: 0.45, x: 120 }];
export const DEFAULT_STEMS = [{ id: 'f_a', name: 'Pansy', c: '#a98be0', season: 'spring', n: 3 }, { id: 'f_b', name: 'Cosmos', c: '#f08aa6', season: 'autumn', n: 3 }, { id: 'f_c', name: 'Sunflower', c: '#f6c844', season: 'summer', n: 3 }, { id: 'f_d', name: 'Camellia', c: '#e6584f', season: 'winter', n: 3 }];
export class IkebanaGame {
  constructor(game, o = {}) {
    this.o = o; this.season = o.season || 'spring'; this.lv = o.level || 0;
    this.stems = (o.stems && o.stems.length ? o.stems : DEFAULT_STEMS).map((s) => ({ ...s }));
    Object.assign(this, { slot: 0, sel: 0, phase: 'pick', m: 0, mt: 0, placed: [], done: false, score: 0, t: 0 });
  }
  height() { const p = (this.mt * (1.15 + 0.1 * Math.max(0, 3 - this.lv * 0.3))) % 2; return p < 1 ? p : 2 - p; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; const k = input.pressed, n = this.stems.length;
    if (this.phase === 'pick') {
      if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % n;
      if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + n - 1) % n;
      if (input.justDown) { const i = Math.floor((input.mx - 20) / 46); if (i >= 0 && i < n && input.my > 150) { this.sel = i; return this.take(); } }
      if (act(input) && !input.justDown) this.take();
    } else {
      this.mt += dt; this.m = this.height();
      if (act(input)) this.cut();
    }
  }
  take() { const s = this.stems[this.sel]; if (!s || s.n <= 0) return; this.phase = 'cut'; this.mt = 0; sfx('select'); }
  cut() {
    const s = this.stems[this.sel], sl = SLOTS[this.slot], acc = clamp(1 - Math.abs(this.m - sl.ideal) / 0.45, 0, 1);
    s.n--; this.placed.push({ stem: s, h: this.m, acc, slot: this.slot }); sfx(acc > 0.7 ? 'chime' : 'blip');
    this.slot++; this.phase = 'pick';
    if (this.slot >= 3) this.finish();
  }
  finish() {
    if (this.done) return;
    while (this.placed.length < 3) this.placed.push({ stem: this.stems[0], h: 0.5, acc: 0.3, slot: this.placed.length });
    const cols = new Set(this.placed.map((p) => p.stem.c)).size, harmony = cols >= 3 ? 1 : cols === 2 ? 0.75 : 0.5;
    const season = this.placed.filter((p) => !p.stem.season || p.stem.season === this.season).length / 3, rare = this.placed.filter((p) => p.stem.rare).length / 3;
    const hacc = this.placed.reduce((a, p) => a + p.acc, 0) / 3;
    this.score = clamp(0.5 * hacc + 0.22 * harmony + 0.2 * season + 0.08 * rare, 0, 1); this.done = true;
    this.result = { text: this.score > 0.8 ? 'Balanced and beautiful!' : this.score > 0.5 ? 'A pretty arrangement.' : 'A little wild, but charming.', used: this.placed.map((p) => p.stem.id), acc: this.score, harmony, season };
    sfx('chime');
  }
  draw(g) {
    rect(g, '#d8c8b0', 0, 0, W, H); rect(g, K.wood[2], 0, 150, W, 74);
    rect(g, K.sky[2], 120, 120, 80, 30); rect(g, K.sky[3], 124, 112, 72, 10); rect(g, K.sky[1], 120, 144, 80, 6);
    for (const p of this.placed) { const sl = SLOTS[p.slot], top = 112 - p.h * 90; rect(g, K.forest[2], sl.x + 4, top, 2, 112 - top); disc(g, p.stem.c, sl.x + 5, top, 8); disc(g, K.butter[3], sl.x + 5, top, 3); }
    if (this.phase === 'cut' && !this.done) {
      const sl = SLOTS[this.slot], top = 112 - this.m * 90, s = this.stems[this.sel];
      rect(g, K.forest[2], sl.x + 4, top, 2, 112 - top); disc(g, s.c, sl.x + 5, top, 8);
      rect(g, K.paper[4], 100, 112 - sl.ideal * 90, 100, 1); drawText(g, 'IDEAL', 206, 109 - sl.ideal * 90, K.butter[3], 1, null);
      rect(g, K.coral[3], 100, top, 100, 1);
    }
    rect(g, '#1a1228', 0, 0, W, 18); drawText(g, `IKEBANA: ${(SLOTS[Math.min(2, this.slot)].n).toUpperCase()}`, 6, 6, K.butter[3], 1, null);
    this.stems.forEach((s, i) => { const x = 20 + i * 46, on = i === this.sel && this.phase === 'pick'; rect(g, on ? K.butter[3] : K.ink[1], x - 2, 158, 42, 34); rect(g, K.paper[4], x, 160, 38, 30); disc(g, s.c, x + 19, 172, 7); drawText(g, s.name.slice(0, 7).toUpperCase(), x + 2, 181, K.ink[1], 1, null); drawText(g, `x${s.n}`, x + 28, 162, K.ink[2], 1, null); });
    drawTextC(g, this.phase === 'pick' ? 'Left/Right: choose a flower, E: take it' : 'Press E when the red line meets the ideal height', 160, 202, K.ink[1], 1, null);
    drawTextC(g, `Season: ${this.season}`, 160, 212, K.ink[2], 1, null);
  }
}
register('minigame', 'sv4h_ikebana', {
  title: 'Flower arranging', resultTitle: 'LOVELY ARRANGEMENT',
  make: (game, o) => new IkebanaGame(game, o),
  bot(m, t, inp) {
    if (m.phase === 'pick') {
      const want = m.stems.findIndex((s, i) => s.n > 0 && !m.placed.some((p) => p.stem === s) && (!s.season || s.season === m.season)), alt = m.stems.findIndex((s) => s.n > 0 && !m.placed.some((p) => p.stem === s));
      const target = want >= 0 ? want : alt >= 0 ? alt : m.stems.findIndex((s) => s.n > 0);
      inp.pressed = new Set(target < 0 || m.sel === target ? ['e'] : ['arrowright']);
    } else if (Math.abs(m.m - SLOTS[m.slot].ideal) < 0.05) inp.pressed = new Set(['e']);
    return inp;
  },
});
