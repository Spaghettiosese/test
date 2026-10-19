// Pet show minigame (Sakura Park, weekends): three rounds in front of the judges. Each round shows a row of arrows in the
// rhythm of the music; press the matching arrow (or WASD) as the marker reaches each one. Your pet's bond and tricks
// decide how much the judges love the performance. score 0..1. Has a bot for the test suite.
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { sfx } from '../../audio.js';
import { rect } from '../../minigames/pet.js';

const KEYS = ['arrowleft', 'arrowup', 'arrowdown', 'arrowright'], ALT = { a: 'arrowleft', w: 'arrowup', s: 'arrowdown', d: 'arrowright' }, GLYPH = ['<', '^', 'v', '>'];
const SPR = { azuki: 'sv4_pet_azuki_sit_', kinako: 'sv4_pet_rabbit_sit_', genta: 'sv4_pet_genta_stretch', piyo: 'sv4_pet_piyo_sit_0' };
class PetShow {
  constructor(game, o = {}) {
    const p = game.state.sv4_home && game.state.sv4_home.pets[o.pet];
    Object.assign(this, { game, id: o.pet || 'azuki', t: 0, round: 0, idx: 0, hits: 0, total: 0, done: false, score: 0, phase: 'intro', pt: 0, flash: 0, msg: 'Press the arrows as the marker hits them!', factor: p ? Math.min(1, (p.bond / 1000) * 0.6 + (Object.values(p.tricks || {}).reduce((a, b) => a + b, 0) / 27) * 0.4 + 0.15) : 0.3 });
    this.seq = []; this.title = 'Pet show';
  }
  start() { const n = 3 + this.round; this.seq = Array.from({ length: n }, () => Math.floor(this.game.rng() * 4)); this.idx = 0; this.pt = 0; this.phase = 'play'; }
  update(dt, input) {
    if (this.done) return; this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.phase === 'intro') { if (this.t > 1.2) this.start(); return; }
    if (this.phase === 'between') { this.pt += dt; if (this.pt > 1) { this.round++; if (this.round >= 3) this.finish(); else this.start(); } return; }
    this.pt += dt; const slot = 0.9, cur = this.seq[this.idx];
    const pressed = [...input.pressed].map((k) => ALT[k] || k).find((k) => KEYS.includes(k));
    if (pressed !== undefined) {
      this.total++; if (KEYS.indexOf(pressed) === cur) { this.hits++; this.flash = 0.25; sfx('chime'); } else sfx('wrong');
      this.idx++; this.pt = 0;
    } else if (this.pt > slot + 0.5) { this.total++; this.idx++; this.pt = 0; sfx('blip'); }
    if (this.idx >= this.seq.length) { this.phase = 'between'; this.pt = 0; }
  }
  finish() { this.done = true; const acc = this.total ? this.hits / this.total : 0; this.score = Math.max(0.2, Math.min(1, acc * 0.6 + this.factor * 0.4)); this.result = { text: this.score >= 0.75 ? 'The judges are on their feet!' : 'A sweet performance. The crowd goes aww.' }; }
  draw(g, sprite) {
    rect(g, '#f6d9c4', 0, 0, 320, 224); rect(g, '#e8745a', 0, 0, 320, 30); for (let i = 0; i < 10; i++) rect(g, i % 2 ? '#ffd76a' : '#fffaf0', i * 32, 30, 32, 6);
    rect(g, '#b87a58', 0, 150, 320, 74); rect(g, '#8a5a3a', 0, 150, 320, 3);
    const nm = SPR[this.id], spr = nm.endsWith('_') ? nm + (Math.floor(this.t * 3) % 2 ? 1 : 0).toString().replace('1', '1') : nm;
    const name = nm.endsWith('_') ? (this.id === 'azuki' ? nm + Math.floor(this.t * 3) % 4 : nm + (Math.floor(this.t * 1.5) % 2)) : spr;
    g.drawImage(sprite(name), 140, 112 - (this.flash > 0 ? 6 : 0), 40 * 1.5 | 0, 52 * 1.5 | 0);
    drawTextC(g, `PET SHOW  ROUND ${Math.min(3, this.round + 1)}/3`, 160, 8, '#fffaf0', 1, null);
    if (this.phase === 'play') this.seq.forEach((k, i) => { const x = 160 - this.seq.length * 14 + i * 28, on = i === this.idx; rect(g, on ? '#ffd76a' : i < this.idx ? '#86cdb0' : '#fffaf0', x, 46, 24, 24); drawTextC(g, GLYPH[k], x + 12, 55, '#2a1a22', 1, null); if (on) rect(g, '#e43b44', x, 72, Math.round(24 * Math.min(1, this.pt / 0.9)), 3); });
    drawTextC(g, this.msg.toUpperCase(), 160, 200, '#2a1a22', 1, null);
    drawText(g, `HITS ${this.hits}/${this.total}`, 8, 208, '#2a1a22', 1, null);
  }
}
register('minigame', 'sv4_petshow', {
  title: 'Pet show', resultTitle: 'Pet show results', make: (g, o) => new PetShow(g, o), music: 'home',
  bot: (m, t, inp) => { if (m.phase === 'play' && m.pt > 0.2 && m.pt < 0.3) inp.pressed = new Set([KEYS[m.seq[m.idx]]]); return inp; },
});
