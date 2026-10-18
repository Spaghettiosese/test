// Story cards: three rounds (opening, twist, ending). Each round offers four plot cards of different genres; pick one.
// Stories that keep to one genre and use strong cards score highest. Left/right + E, or click a card.
// opts: { level (writing level, richer cards), seed }
import { register } from '../../core/registry.js';
import { act } from '../../input.js';
import { drawText, drawTextC, wrapPx } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { rect, clamp, hash, W, H } from '../sv2_play/kit.js';

export const GENRES = {
  adventure: { name: 'Adventure', c: K.coral[2], title: ['The Long Road to', 'Beyond the', 'Chasing'], noun: ['the Lighthouse', 'Hoshi Hill', 'the Lost Sea'] },
  mystery: { name: 'Mystery', c: K.lilac[2], title: ['The Case of', 'Secret of the', 'Who Took'], noun: ['the Paper Star', 'Room 4B', 'the Clock Tower'] },
  romance: { name: 'Romance', c: K.ribbon[2], title: ['Letters to', 'A Summer with', 'Under One'], noun: ['Umbrella', 'a Stranger', 'the Moon'] },
  fantasy: { name: 'Fantasy', c: K.sky[2], title: ['The Dragon of', 'Kingdom of', 'Moon Spells for'], noun: ['Cloud Bay', 'Paper Lanterns', 'the Last Star'] },
  daily: { name: 'Slice of Life', c: K.mint[2], title: ['An Ordinary', 'Tea and', 'Little Things:'], noun: ['Tuesday', 'Rain', 'Hoshimori Days'] },
  comedy: { name: 'Comedy', c: K.butter[3], title: ['The Great', 'Oops! The', 'Please Do Not Feed'], noun: ['Cat Caper', 'Soup Incident', 'the Mochi'] },
};
export const GENRE_IDS = Object.keys(GENRES);
export const BEATS = ['Opening', 'Twist', 'Ending'];
// CARDS[genre][beat] = three phrases (weak to strong)
export const CARDS = {
  adventure: [['a girl finds an old map', 'a ship leaves the harbour at dawn', 'a hidden door opens in the cliffs'], ['the bridge washes away', 'a rival also wants the treasure', 'the map was drawn by her own grandmother'], ['they reach the sea cave at sunset', 'the treasure was the friends all along', 'she sails home with the tide']],
  mystery: [['a cat leaves muddy prints on the desk', 'a library book is missing', 'the clock tower strikes thirteen'], ['the culprit was in the photo all along', 'a second key turns up', 'the missing page is a map'], ['the clue was in the last line', 'everyone gets a cup of tea and the truth', 'the detective smiles at the moon']],
  romance: [['two umbrellas touch in the rain', 'a note falls out of a locker', 'someone hums on the roof at night'], ['a misunderstanding over a gift', 'the festival lanterns go out', 'a letter is delivered to the wrong house'], ['they share a quiet walk home', 'the right letter is read aloud', 'the lanterns glow again for two']],
  fantasy: [['a paper lantern starts to talk', 'the moon drops a silver key', 'a small dragon naps on the pier'], ['the sea turns into sky', 'the dragon is afraid of thunder', 'the spell needs a true name'], ['the dragon guards the town gently', 'the stars rearrange to say thanks', 'she writes the name and the world hums']],
  daily: [['the morning smells of toast', 'a rainy bus ride to school', 'the neighbour waves from the garden'], ['the tea goes cold in good company', 'a stray cat adopts the porch', 'a small kindness gets passed along'], ['the day ends with a warm bath', 'she writes it all down by lamplight', 'tomorrow looks nice too']],
  comedy: [['a mochi escapes the kitchen', 'the class pet is on the loose', 'someone sits on the whoopee cushion'], ['the soup is somehow purple', 'the principal wears a cat mask', 'everything is blamed on a goldfish'], ['the goldfish gets a medal', 'everyone laughs until the bell rings', 'the mochi is found and politely eaten']],
};
export function storyText(picks) {
  const [a, b, c] = picks.map((p) => CARDS[p.genre][p.beat][p.tier]);
  return `${a[0].toUpperCase() + a.slice(1)}. Then ${b}. At last, ${c}.`;
}
export function storyTitle(picks, seed = 0) {
  const cnt = {}; picks.forEach((p) => { cnt[p.genre] = (cnt[p.genre] || 0) + 1; });
  const g = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0], G = GENRES[g];
  return `${G.title[seed % G.title.length]} ${G.noun[(seed >> 2) % G.noun.length]}`;
}
export function scorePicks(picks) {
  const u = new Set(picks.map((p) => p.genre)).size, cons = u === 1 ? 1 : u === 2 ? 0.7 : 0.4;
  const vibe = picks.reduce((a, p) => a + (p.tier + 1), 0) / (picks.length * 3);
  return clamp(0.55 * cons + 0.45 * vibe, 0, 1);
}
export class PlotGame {
  constructor(game, o = {}) {
    this.o = o; this.lv = o.level || 0; this.seed = o.seed || 0;
    Object.assign(this, { round: 0, sel: 0, picks: [], done: false, score: 0, t: 0, writeT: 0, phase: 'pick' });
    this.deal();
  }
  deal() {
    const ids = GENRE_IDS.slice().sort((a, b) => hash(this.seed + this.round * 7, a.length * 3 + a.charCodeAt(1)) - hash(this.seed + this.round * 7, b.length * 3 + b.charCodeAt(1)));
    const n = this.lv >= 5 ? 5 : 4;
    this.hand = ids.slice(0, n).map((genre, i) => ({ genre, beat: this.round, tier: Math.min(2, Math.floor(hash(this.seed + this.round, i + 3) * (2 + this.lv / 4))) }));
    this.sel = 0;
  }
  pick(i) {
    const c = this.hand[i]; if (!c) return;
    this.picks.push(c); sfx('select'); this.round++;
    if (this.round >= 3) { this.phase = 'write'; this.writeT = 0; } else this.deal();
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    if (this.phase === 'write') { this.writeT += dt; if (this.writeT > 1.6) this.finish(); return; }
    const k = input.pressed, n = this.hand.length;
    if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % n;
    if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + n - 1) % n;
    if (input.justDown) { const i = Math.floor((input.mx - 8) / 62); if (i >= 0 && i < n && input.my > 50 && input.my < 170) { this.sel = i; return this.pick(i); } }
    if (act(input) && !input.justDown) this.pick(this.sel);
  }
  finish() {
    if (this.done) return;
    while (this.picks.length < 3) { this.round = this.picks.length; this.deal(); this.picks.push(this.hand[0]); }
    this.done = true; this.score = scorePicks(this.picks);
    this.result = { text: this.score > 0.8 ? 'A story with real heart!' : this.score > 0.55 ? 'A cosy little tale.' : 'A story that wanders a bit.', picks: this.picks, title: storyTitle(this.picks, this.seed), acc: this.score };
    sfx('chime');
  }
  draw(g) {
    rect(g, '#2b2236', 0, 0, W, H); rect(g, K.wood[1], 0, 190, W, 34);
    rect(g, '#1a1228', 0, 0, W, 18); drawText(g, `STORY CARDS: ${BEATS[Math.min(2, this.round)].toUpperCase()}`, 6, 6, K.butter[3], 1, null);
    if (this.phase === 'write') {
      rect(g, K.paper[4], 70, 40, 180, 130); for (let i = 0; i < Math.min(9, Math.floor(this.writeT * 6)); i++) rect(g, K.ink[3], 82, 54 + i * 12, 100 + (hash(i, 4) * 60) | 0, 3);
      drawTextC(g, 'Writing...', 160, 180, K.paper[4], 1, null); return;
    }
    this.hand.forEach((c, i) => {
      const x = 8 + i * 62 + (this.hand.length === 5 ? 0 : 20), on = i === this.sel, G = GENRES[c.genre], y = on ? 46 : 54;
      rect(g, K.ink[1], x - 1, y - 1, 60, 124); rect(g, K.paper[4], x, y, 58, 122); rect(g, G.c, x, y, 58, 14);
      drawText(g, G.name.toUpperCase().slice(0, 11), x + 3, y + 4, K.ink[1], 1, null);
      wrapPx(CARDS[c.genre][c.beat][c.tier], 52).forEach((ln, j) => drawText(g, ln, x + 3, y + 20 + j * 9, K.ink[2], 1, null));
      for (let s = 0; s <= c.tier; s++) rect(g, K.butter[3], x + 4 + s * 8, y + 108, 6, 6);
    });
    this.picks.forEach((p, i) => drawText(g, `${BEATS[i]}: ${GENRES[p.genre].name}`, 8 + i * 100, 196, K.paper[4], 1, null));
    drawTextC(g, 'Left/Right to choose, E to pick. Stars = card strength.', 160, 212, K.paper[2], 1, null);
  }
}
register('minigame', 'sv4h_plot', {
  title: 'Story cards', resultTitle: 'THE END',
  make: (game, o) => new PlotGame(game, o),
  bot(m, t, inp) {
    if (m.phase !== 'pick') return inp;
    const g1 = m.picks[0] && m.picks[0].genre; let bi = 0, bs = -1;
    m.hand.forEach((c, i) => { const s = c.tier + (g1 && c.genre === g1 ? 2 : 0) + 0.1 * (m.hand.length - i); if (s > bs) { bs = s; bi = i; } });
    inp.pressed = new Set(m.sel === bi ? ['e'] : ['arrowright']);
    return inp;
  },
});
