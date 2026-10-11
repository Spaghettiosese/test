// Runs any registered minigame and shows a result card.
// register('minigame', id, { title, make(game, opts) -> { update(dt,input), draw(g, sprite), done, score (0..1), bonus?, finish?() },
//                            result?: false (skip the result card), music? })
import { register, get } from '../core/registry.js';
import { sprite } from '../artcache.js';
import { drawTextC } from '../font.js';
import { UI, panel } from './ui.js';

export const starsFor = (score) => (score >= 0.85 ? 3 : score >= 0.6 ? 2 : 1);

class MinigameScene {
  constructor(game, id, opts, onDone) {
    const def = get('minigame', id);
    if (!def) throw new Error(`unknown minigame ${id}`);
    Object.assign(this, { name: 'minigame', game, id, def, opts, onDone, inst: def.make(game, opts), phase: 'play', t: 0, music: def.music || 'minigame' });
  }
  update(dt, input) {
    const k = input.pressed;
    if (this.phase === 'play') {
      this.inst.update(dt, input, this.game);
      if (k.has('escape') && this.def.canQuit !== false) { if (this.inst.finish) this.inst.finish(); else return this.close({ quit: true, score: 0 }); }
      if (this.inst.done) {
        const r = { score: this.inst.score || 0, stars: starsFor(this.inst.score || 0), bonus: this.inst.bonus || 0, data: this.inst.result };
        if (this.def.result === false || this.opts.noResult) return this.close(r);
        this.phase = 'result'; this.r = r; this.t = 0; this.game.sfx('chime');
      }
    } else {
      this.t += dt;
      if (this.t > 0.6 && (k.has(' ') || k.has('enter') || k.has('e') || input.justDown)) this.close(this.r);
    }
  }
  close(r) { this.game.scenes.pop(this); this.game.bus.emit('minigameDone', { id: this.id, result: r }); this.onDone && this.onDone(r); }
  draw(g) {
    this.inst.draw(g, sprite, this.game);
    if (this.phase !== 'result') return;
    const r = this.r, n = Math.min(5, r.stars + (r.bonus || 0));
    panel(g, 70, 64, 180, 82, 'dark');
    drawTextC(g, this.def.resultTitle || 'ALL DONE!', 160, 72, UI.gold, 2);
    for (let i = 0; i < n; i++) g.drawImage(sprite('i_star'), 160 - n * 9 + i * 18, 92 + Math.round(Math.sin(this.t * 8 + i) * 2));
    if (r.data && r.data.text) drawTextC(g, r.data.text, 160, 114, UI.text);
    if (this.t > 0.6) drawTextC(g, 'PRESS SPACE / CLICK', 160, 130, '#fff6a0');
  }
}
register('scene', 'minigame', { make: (game, id, opts, onDone) => new MinigameScene(game, id, opts, onDone) });
