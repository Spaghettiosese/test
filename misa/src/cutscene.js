// Dialogue + cutscene runner with portraits, typewriter text, fades, scenes and choices.
import { drawText, drawTextC, wrap, CHAR_W } from './font.js';
import { act, blankInput } from './input.js';
import { sfx } from './audio.js';
import { drawPortrait } from './moonkai.js';

const CPS = 42;
export class Cutscene {
  constructor(steps, game, onDone) {
    Object.assign(this, { steps: steps.slice(), game, onDone, idx: -1, fade: 0, fadeTo: 0, fadeRate: 0, scene: null, shown: 0, wait: 0, sel: 0, done: false, tick: 0 });
    this.next();
  }
  get step() { return this.steps[this.idx]; }
  next() {
    this.idx++;
    while (this.idx < this.steps.length) {
      const s = this.step;
      if (s.t === 'call') { s.fn(this.game); this.idx++; continue; }
      if (s.t === 'sfx') { sfx(s.name); this.idx++; continue; }
      if (s.t === 'scene') { this.scene = s.name; this.game.sceneName = s.name; this.idx++; continue; }
      if (s.t === 'fade') {
        this.fadeTo = s.to; this.fadeRate = s.dur > 0 ? 1 / s.dur : 999; this.wait = s.dur; break;
      }
      if (s.t === 'wait') { this.wait = s.dur; break; }
      if (s.t === 'say') { this.shown = 0; this.lines = wrap(s.text, 46); break; }
      if (s.t === 'choice') { this.sel = 0; break; }
      this.idx++;
    }
    if (this.idx >= this.steps.length) { this.done = true; this.onDone && this.onDone(); }
  }
  update(dt, input) {
    if (this.done) return;
    this.tick += dt;
    // fade animation always runs
    if (this.fade !== this.fadeTo) {
      const d = this.fadeRate * dt;
      this.fade = this.fade < this.fadeTo ? Math.min(this.fadeTo, this.fade + d) : Math.max(this.fadeTo, this.fade - d);
    }
    const s = this.step;
    if (s.t === 'say') {
      const total = s.text.length;
      const before = Math.floor(this.shown);
      this.shown = Math.min(total, this.shown + dt * CPS);
      if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) sfx('blip');
      if (act(input)) { if (this.shown < total) this.shown = total; else this.next(); }
    } else if (s.t === 'wait' || s.t === 'fade') {
      this.wait -= dt;
      if (this.wait <= 0 && this.fade === this.fadeTo) this.next();
    } else if (s.t === 'choice') {
      const n = s.options.length;
      if (input.pressed.has('arrowdown') || input.pressed.has('s')) { this.sel = (this.sel + 1) % n; sfx('blip'); }
      if (input.pressed.has('arrowup') || input.pressed.has('w')) { this.sel = (this.sel + n - 1) % n; sfx('blip'); }
      if (input.moved) { const i = Math.floor((input.my - 100) / 16); if (i >= 0 && i < n) this.sel = i; }
      if (act(input)) {
        sfx('select');
        this.steps.splice(this.idx + 1, 0, ...s.options[this.sel].steps);
        this.next();
      }
    }
  }
  draw(g, sprite, top = false) {
    const s = this.step;
    if (!s) return;
    if (s.t === 'say') {
      const y = top ? 18 : 142;
      g.fillStyle = '#2b1d2ee6'; g.fillRect(6, y, 308, 76);
      g.fillStyle = '#fff1d6'; g.fillRect(6, y, 308, 1); g.fillRect(6, y + 75, 308, 1); g.fillRect(6, y, 1, 76); g.fillRect(313, y, 1, 76);
      let tx = 14;
      if (s.who && s.mood !== null) {
        const talking = this.shown < s.text.length, m = talking && Math.floor(this.tick * 8) % 2 ? 1 : 0, bl = this.tick % 3.3 < 0.13 ? 1 : 0;
        const bob = talking ? Math.round(Math.sin(this.tick * 16)) : 0;
        g.fillStyle = '#fff1d6'; g.fillRect(9, y + 3, 70, 70);
        g.fillStyle = s.who === 'MOCHI' ? '#f7d9a8' : '#b6dcc9'; g.fillRect(11, y + 5, 66, 66);
        if (s.who !== 'MISA' || !drawPortrait(g, s.mood, m, bl, 12, y + 6 + bob)) { try { g.drawImage(sprite(`p_${s.who.toLowerCase()}_${s.mood}_${m}${bl}`), 12, y + 6 + bob); } catch { /* narrator or missing portrait */ } }
        g.fillStyle = '#2b1d2e'; g.fillRect(11, y + 5, 66, 1); g.fillRect(11, y + 70, 66, 1);
        tx = 88;
      }
      if (s.who) {
        g.fillStyle = '#e0707a'; g.fillRect(tx - 2, y - 6, s.who.length * CHAR_W + 8, 11);
        drawText(g, s.who, tx + 2, y - 3, '#fffaf0');
      }
      const chars = Math.floor(this.shown);
      let left = chars;
      const maxC = Math.floor((306 - tx) / CHAR_W);
      wrap(s.text, maxC).forEach((ln, i) => {
        const part = ln.slice(0, Math.max(0, left)); left -= ln.length + 1;
        drawText(g, part, tx, y + 12 + i * 9, '#fff8e8');
      });
      if (this.shown >= s.text.length && Math.floor(this.tick * 2) % 2) drawText(g, '>', 300, y + 64, '#ffd76a');
    } else if (s.t === 'choice') {
      g.fillStyle = '#2b1d2ee6'; g.fillRect(60, 84, 200, 20 + s.options.length * 16);
      drawTextC(g, 'Make a wish', 160, 90, '#ffd76a');
      s.options.forEach((o, i) => {
        if (i === this.sel) { g.fillStyle = '#e0707a'; g.fillRect(64, 100 + i * 16, 192, 13); }
        drawTextC(g, o.text, 160, 103 + i * 16, '#fffaf0');
      });
    }
  }
}
