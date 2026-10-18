// Rhythm practice: notes fall down four lanes; press the lane key (arrows or A S W D, or click the lane) as a note meets the line.
// opts: { song: id, mult (timing window multiplier from the instrument), crowd (busking audience size 0..12) }
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { rect, disc, clamp, hash, W, H } from '../sv2_play/kit.js';
import { songById, chartOf, songLength } from './songs.js';

export const LANE_KEYS = [['arrowleft', 'a'], ['arrowdown', 's'], ['arrowup', 'w'], ['arrowright', 'd']];
const LX = 88, LW = 36, LINE = 176, COLS = [K.coral[2], K.butter[3], K.mint[3], K.sky[3]];
export class RhythmGame {
  constructor(game, o = {}) {
    this.o = o; this.song = songById(o.song); this.mult = o.mult || 1; this.crowd = o.crowd || 0;
    this.notes = chartOf(this.song).map((n) => ({ ...n, state: 0 })); // 0 waiting, 1 perfect, 2 good, 3 miss
    this.end = songLength(this.song) + 1.2;
    Object.assign(this, { t: -1.8, done: false, score: 0, perfect: 0, good: 0, miss: 0, combo: 0, best: 0, flash: [0, 0, 0, 0], say: '', sayT: 0, speed: 96 + this.song.bpm * 0.5 });
  }
  press(lane) {
    this.flash[lane] = 0.15;
    let hit = null;
    for (const n of this.notes) if (n.state === 0 && n.lane === lane && Math.abs(n.t - this.t) < 0.16 * this.mult && (!hit || n.t < hit.t)) hit = n;
    if (!hit) return;
    const d = Math.abs(hit.t - this.t);
    if (d < 0.075 * this.mult) { hit.state = 1; this.perfect++; this.say = 'PERFECT'; } else { hit.state = 2; this.good++; this.say = 'GOOD'; }
    this.sayT = 0.4; this.combo++; this.best = Math.max(this.best, this.combo); sfx('blip');
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    for (let l = 0; l < 4; l++) if (LANE_KEYS[l].some((k) => input.pressed.has(k))) this.press(l);
    if (input.justDown && input.mx >= LX && input.mx < LX + LW * 4) this.press(clamp(Math.floor((input.mx - LX) / LW), 0, 3));
    for (const n of this.notes) if (n.state === 0 && this.t > n.t + 0.16 * this.mult) { n.state = 3; this.miss++; this.combo = 0; this.say = 'MISS'; this.sayT = 0.4; }
    this.sayT -= dt; this.flash = this.flash.map((f) => Math.max(0, f - dt));
    if (this.t > this.end) this.finish();
  }
  finish() {
    if (this.done) return;
    for (const n of this.notes) if (n.state === 0) { n.state = 3; this.miss++; }
    const N = this.notes.length || 1;
    this.score = clamp((this.perfect + this.good * 0.6) / N, 0, 1); this.done = true;
    this.result = { text: `${this.perfect} perfect, ${this.good} good, ${this.miss} missed`, acc: this.score, perfect: this.perfect, good: this.good, miss: this.miss, combo: this.best, song: this.song.id };
    sfx(this.score > 0.6 ? 'chime' : 'wrong');
  }
  draw(g) {
    rect(g, '#1a1228', 0, 0, W, H); rect(g, '#251a3a', LX - 4, 20, LW * 4 + 8, 168);
    for (let l = 0; l < 4; l++) { rect(g, this.flash[l] > 0 ? 'rgba(255,246,160,.35)' : 'rgba(255,255,255,.06)', LX + l * LW, 20, LW - 2, 168); rect(g, COLS[l], LX + l * LW, LINE, LW - 2, 3); }
    for (const n of this.notes) {
      if (n.state === 1 || n.state === 2) continue;
      const y = LINE - (n.t - this.t) * this.speed; if (y < 18 || y > 200) continue;
      rect(g, n.state === 3 ? K.charcoal[2] : COLS[n.lane], LX + n.lane * LW + 3, y - 4, LW - 8, 8); rect(g, 'rgba(255,255,255,.4)', LX + n.lane * LW + 3, y - 4, LW - 8, 2);
    }
    rect(g, '#1a1228', 0, 0, W, 18); drawText(g, this.song.name.toUpperCase(), 6, 6, K.butter[3], 1, null);
    drawText(g, `COMBO ${this.combo}`, 236, 6, K.mint[3], 1, null);
    if (this.sayT > 0) drawTextC(g, this.say, 160, 120, this.say === 'MISS' ? K.coral[3] : K.paper[4], 2, null);
    if (this.t < 0) drawTextC(g, `READY ${Math.ceil(-this.t)}`, 160, 90, K.paper[4], 2, null);
    for (let i = 0; i < this.crowd; i++) { const x = 8 + (i % 6) * 12 + (i < 6 ? 0 : 6), y = 150 + (i < 6 ? 0 : 14) + Math.round(Math.sin(this.t * 6 + i) * (this.combo > 8 ? 3 : 1)); disc(g, hash(i, 5) > 0.5 ? K.sand[3] : K.hairGinger ? K.hairGinger[2] : K.wood[2], x, y, 4); rect(g, K.lilac[2], x - 3, y + 4, 7, 9); if (this.combo > 10 && i % 3 === 0) rect(g, K.coral[3], x - 1, y - 9, 3, 3); }
    drawText(g, 'Arrows / A S W D, or click a lane', 6, 214, K.paper[2], 1, null);
  }
}
register('minigame', 'sv4h_rhythm', {
  title: 'Rhythm practice', resultTitle: 'ENCORE!',
  make: (game, o) => new RhythmGame(game, o),
  bot(m, t, inp) {
    for (const n of m.notes) if (n.state === 0 && Math.abs(n.t - m.t) < 0.03) { inp.pressed = new Set([LANE_KEYS[n.lane][0]]); break; }
    return inp;
  },
});
