// English "Word Scramble": rearrange letter tiles into this week's vocabulary word. Type, or click the tiles.
import { act } from '../../input.js';
import { CardGame, K, INK, rect, txt, txtC, wrapPx, blit, btn, inRect, card, notebook, sfx, clamp } from './common.js';

export const WORDS = [
  ['cat', 'Mochi is one. She says meow.'], ['moon', 'It shines at night and changes shape.'], ['star', 'It twinkles in the night sky.'],
  ['rain', 'Water falling from the clouds.'], ['book', 'You read it. Suzu loves them.'], ['fish', 'It swims in the sea.'],
  ['bread', 'Bake it, toast it, eat it at lunch.'], ['shell', 'You find it on the beach.'], ['clock', 'It tells you the time.'],
  ['beach', 'Sand and waves by the sea.'], ['friend', 'Someone you like to spend time with.'], ['garden', 'Where flowers and vegetables grow.'],
  ['school', 'Where you go on weekdays to learn.'], ['window', 'Glass in a wall to look through.'], ['letter', 'Mail you write to someone.'],
  ['summer', 'The hottest season.'], ['winter', 'The coldest season.'], ['island', 'Land with water all around.'],
  ['lantern', 'A lamp you can carry.'], ['harbour', 'Where boats rest safely.'], ['teacher', 'Ms. Fujita is one.'],
  ['blossom', 'A flower on a tree in spring.'], ['weather', 'Sunny, rainy, windy or snowy.'], ['kitchen', 'The room where you cook.'],
  ['festival', 'A big happy celebration.'], ['telescope', 'It helps you see far away stars.'], ['lighthouse', 'A tower that guides ships at night.'],
];

export class ScrambleGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: opts.exam ? 'English exam' : 'Word Scramble', chip: 'English', color: K.lilac, limit: opts.exam ? 70 : opts.quiz ? 25 : 50,
      how: ['Unscramble the letters to make this week\'s vocabulary word.', 'Type the letters, or click the tiles in order. Backspace takes one back.'],
      keys: 'Type or click letters   Backspace: undo   ?: hint',
    });
    this.need = opts.quiz ? 2 : opts.exam ? 6 : 4 + (this.diff > 0.5 ? 1 : 0);
    const maxL = Math.round(5 + this.diff * 5), pool = WORDS.filter(([w]) => w.length <= maxL && w.length >= (this.diff > 0.6 ? 5 : 3));
    this.list = [];
    while (this.list.length < this.need && pool.length) this.list.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    Object.assign(this, { wi: 0, solved: 0, hints: 0, misses: 0, wait: 0, sel: 0 });
    this.load();
  }
  load() {
    const w = this.list[this.wi][0];
    let letters;
    do letters = [...w].sort(() => this.rng() - 0.5); while (letters.join('') === w && w.length > 1);
    this.tiles = letters.map((ch, i) => ({ ch, used: false, i }));
    this.answer = []; this.sel = 0;
  }
  get word() { return this.list[this.wi][0]; }
  tileRect(i) { const n = this.tiles.length, tw = 24, gap = 4, x0 = Math.round(160 - (n * (tw + gap) - gap) / 2); return [x0 + i * (tw + gap), 150, tw, 26]; }
  progress() { return clamp((this.solved + this.answer.length / Math.max(1, this.word.length) * 0.5) / this.need, 0.2, 1); }
  info() { return `Word ${Math.min(this.wi + 1, this.need)}/${this.need}`; }
  place(t) {
    if (!t || t.used) return;
    t.used = true; this.answer.push(t); sfx('blip');
    if (this.answer.length === this.word.length) {
      const guess = this.answer.map((x) => x.ch).join('');
      if (guess === this.word) { this.solved++; sfx('chime'); this.flash = 0.25; this.pop(this.hintUsed ? 'Got it!' : 'Perfect!', 160, 70, K.butter[0]); this.wait = 0.9; }
      else { this.misses++; sfx('wrong'); this.shake = 0.25; this.pop('Not a word yet. Try again!', 160, 70, K.coral[1]); this.clear(); }
    }
  }
  undo() { const t = this.answer.pop(); if (t) { t.used = false; sfx('back'); } }
  clear() { for (const t of this.answer) t.used = false; this.answer = []; }
  hint() {
    // place the next correct letter
    this.clear();
    this.hints++; this.hintUsed = true;
    const want = this.word.slice(0, Math.min(this.word.length - 1, this.hints));
    for (const ch of want) this.place(this.tiles.find((t) => !t.used && t.ch === ch));
    sfx('page');
  }
  play(dt, input) {
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wi++; this.hints = 0; this.hintUsed = false;
        if (this.wi >= this.list.length) this.finish(clamp(this.solved / this.need - this.misses * 0.04 - this.hintsTotal * 0.05, 0.25, 1));
        else this.load();
      }
      return;
    }
    const k = input.pressed;
    for (const key of k) {
      if (key.length === 1 && key >= 'a' && key <= 'z') { this.place(this.tiles.find((t) => !t.used && t.ch === key)); }
    }
    if (k.has('backspace')) this.undo();
    if (k.has('?') || k.has('/')) { this.hintsTotal = (this.hintsTotal || 0) + 1; this.hint(); }
    if (k.has('arrowright')) this.sel = (this.sel + 1) % this.tiles.length;
    if (k.has('arrowleft')) this.sel = (this.sel + this.tiles.length - 1) % this.tiles.length;
    if (k.has(' ') || k.has('enter')) this.place(this.tiles[this.sel]);
    if (input.justDown) {
      const i = this.tiles.findIndex((_, j) => inRect(input.mx, input.my, this.tileRect(j)));
      if (i >= 0) this.place(this.tiles[i]);
      else if (inRect(input.mx, input.my, [96, 186, 60, 15])) this.undo();
      else if (inRect(input.mx, input.my, [164, 186, 60, 15])) { this.hintsTotal = (this.hintsTotal || 0) + 1; this.hint(); }
      else if (this.answer.length && input.my > 90 && input.my < 130) this.undo();
    }
  }
  scene(g) {
    blit(g, 'school_eng_bg', 320, 224, (c) => {
      rect(c, K.lilac[4], 0, 0, 320, 224);
      for (let y = 19; y < 224; y += 16) for (let x = 0; x < 320; x += 16) rect(c, K.lilac[3], x + ((y / 16) % 2) * 8, y, 2, 2);
    });
    notebook(g, 20, 26, 280, 110);
    // clue with a little picture frame
    txt(g, 'Clue:', 40, 34, K.lilac[1]);
    const [w, clue] = this.list[Math.min(this.wi, this.list.length - 1)];
    wrapPx(clue, 220).forEach((l, i) => txt(g, l, 70, 34 + i * 10, INK));
    txt(g, `${w.length} letters`, 40, 56, K.ink[3]);
    // answer slots
    const n = w.length, sw = 18, x0 = Math.round(160 - (n * (sw + 3) - 3) / 2);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (sw + 3), a = this.answer[i];
      rect(g, K.lilac[1], x, 100, sw, 2);
      if (a) { rect(g, INK, x, 80, sw, 19); rect(g, this.wait > 0 ? K.mint[3] : K.lilac[3], x + 1, 81, sw - 2, 17); rect(g, '#ffffff', x + 1, 81, sw - 2, 1); txtC(g, a.ch, x + sw / 2 + 1, 87, INK); }
    }
    // tiles
    this.tiles.forEach((t, i) => {
      const [x, y, tw, th] = this.tileRect(i), on = this.sel === i && !t.used;
      if (t.used) { rect(g, K.lilac[3], x, y + 2, tw, th - 2); return; }
      rect(g, INK, x + 1, y, tw - 2, th); rect(g, INK, x, y + 1, tw, th - 2);
      rect(g, on ? K.butter[3] : K.paper[3], x + 1, y + 1, tw - 2, th - 2);
      rect(g, K.paper[4], x + 1, y + 1, tw - 2, 1); rect(g, on ? K.butter[1] : K.paper[1], x + 1, y + th - 3, tw - 2, 2);
      txtC(g, t.ch, x + tw / 2 + 1, y + 9, INK);
    });
    btn(g, 96, 186, 60, 15, 'Undo', { color: K.lilac });
    btn(g, 164, 186, 60, 15, 'Hint', { color: K.butter });
    // solved stamps
    for (let i = 0; i < this.need; i++) { const x = 268 + (i % 3) * 10, y = 112 + Math.floor(i / 3) * 10; rect(g, INK, x, y, 8, 8); rect(g, i < this.solved ? K.butter[2] : K.paper[2], x + 1, y + 1, 6, 6); }
  }
}

export function scrambleBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || Math.round(t * 60) % 5) return input;
  const next = m.word[m.answer.length];
  if (next) input.pressed.add(next);
  return input;
}
