// History "Timeline": put five event cards in order, oldest first. Swap cards, then check.
import { act } from '../../input.js';
import { CardGame, K, INK, rect, txt, txtC, wrapPx, blit, btn, inRect, card, sfx, clamp, dither } from './common.js';

// Sets of events (year, text). Local Hoshimori history mixed with the wider world.
export const TIMELINES = [
  { name: 'Hoshimori Bay', ev: [[1612, 'Fishing village founded on the bay'], [1790, 'Hoshi Hill Shrine rebuilt after a fire'], [1885, 'The Star Lantern is first lit'], [1923, 'Railway line reaches the town'], [1964, 'Hoshimori High opens its doors']] },
  { name: 'Ways to write', ev: [[-3200, 'First writing on clay tablets'], [105, 'Paper made from plant fibres'], [868, 'Oldest dated printed book'], [1450, 'Printing press with metal type'], [1971, 'The first email is sent']] },
  { name: 'Stars and sky', ev: [[-2500, 'Stone circles track the sun'], [1609, 'Telescopes point at the moon'], [1781, 'The planet Uranus is found'], [1969, 'People walk on the moon'], [1990, 'A space telescope is launched']] },
  { name: 'Getting around', ev: [[-3500, 'The wheel is invented'], [1804, 'First steam railway engine'], [1885, 'First motor car'], [1903, 'First powered aeroplane flight'], [1964, 'The bullet train starts running']] },
  { name: 'The sea', ev: [[-1500, 'Sailors cross the open ocean'], [1492, 'Ships cross the Atlantic'], [1770, 'A ship maps the far south seas'], [1872, 'A ship studies the deep sea'], [1960, 'People reach the deepest sea floor']] },
  { name: 'Food and drink', ev: [[-7000, 'Rice farming begins in Asia'], [900, 'Tea drinking spreads'], [1824, 'Sushi sold from street stalls'], [1958, 'Instant noodles are invented'], [1971, 'Cup noodles go on sale']] },
];
const yearText = (y) => (y < 0 ? `${-y} BC` : `${y}`);

export class TimelineGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: opts.exam ? 'History exam' : 'Timeline', chip: 'History', color: K.butter, limit: opts.exam ? 80 : opts.quiz ? 30 : 55,
      how: ['Put the five event cards in order, oldest on the left.', 'Pick a card, then pick another to swap them. Press Check when ready.'],
      keys: 'Arrows: move   Space: pick / swap   Enter on Check',
    });
    this.rounds = opts.quiz ? 1 : opts.exam ? 3 : 2;
    const pool = TIMELINES.slice();
    this.sets = [];
    while (this.sets.length < this.rounds) this.sets.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    Object.assign(this, { round: 0, sel: 0, picked: -1, checks: 0, scores: [], wait: 0 });
    this.load();
  }
  load() {
    const ev = this.sets[this.round].ev.map(([year, text], i) => ({ year, text, rank: i, locked: false, wobble: 0 }));
    do ev.sort(() => this.rng() - 0.5); while (ev.every((e, i) => e.rank === i));
    this.cards = ev; this.checks = 0; this.picked = -1; this.sel = 0;
  }
  get slots() { return this.cards.map((_, i) => [12 + i * 61, 66, 56, 84]); }
  progress() { const ok = this.cards.filter((c, i) => c.rank === i).length / 5; return clamp((this.scores.reduce((a, b) => a + b, 0) + ok * 0.6) / this.rounds, 0.2, 1); }
  info() { return `Set ${Math.min(this.round + 1, this.rounds)}/${this.rounds}`; }
  choose(i) {
    if (i === 5) return this.check();
    if (this.cards[i].locked) { this.pop('That one is right!', this.slots[i][0] + 28, 60, K.mint[3]); return; }
    if (this.picked < 0) { this.picked = i; sfx('blip'); return; }
    if (this.picked === i) { this.picked = -1; return; }
    const a = this.cards[this.picked]; this.cards[this.picked] = this.cards[i]; this.cards[i] = a;
    this.picked = -1; sfx('page');
  }
  check() {
    this.checks++;
    let wrong = 0;
    this.cards.forEach((c, i) => { if (c.rank === i) { if (!c.locked) { c.locked = true; } } else { wrong++; c.wobble = 0.4; } });
    if (!wrong) {
      const sc = clamp(1.1 - this.checks * 0.12, 0.45, 1);
      this.scores.push(sc); sfx('chime'); this.flash = 0.3; this.wait = 1.6;
      this.pop(this.checks === 1 ? 'First try! Amazing!' : 'All in order!', 160, 44, K.butter[0]);
    } else { sfx('wrong'); this.pop(`${5 - wrong} of 5 in place. Keep going!`, 160, 44, K.coral[1]); }
  }
  play(dt, input) {
    for (const c of this.cards) if (c.wobble > 0) c.wobble -= dt;
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) { this.round++; if (this.round >= this.rounds) this.finish(this.scores.reduce((a, b) => a + b, 0) / this.rounds); else this.load(); }
      return;
    }
    const k = input.pressed;
    if (k.has('arrowright') || k.has('d')) { this.sel = (this.sel + 1) % 6; sfx('blip'); }
    if (k.has('arrowleft') || k.has('a')) { this.sel = (this.sel + 5) % 6; sfx('blip'); }
    if (k.has('arrowdown') || k.has('s')) this.sel = 5;
    if (k.has('arrowup') || k.has('w')) this.sel = Math.min(this.sel, 4);
    const hits = [...this.slots, [124, 166, 72, 18]];
    if (input.moved) { const i = hits.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) this.sel = i; }
    if (input.justDown) { const i = hits.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) { this.sel = i; this.choose(i); } return; }
    if (k.has('enter') && this.sel !== 5) { this.check(); return; }
    if (act(input)) this.choose(this.sel);
  }
  scene(g) {
    blit(g, 'school_hist_bg', 320, 224, (c) => {
      rect(c, K.plaster[3], 0, 0, 320, 224);
      dither(c, K.plaster[4], 0, 19, 320, 30);
      rect(c, K.woodDark[2], 0, 150, 320, 74); rect(c, K.woodDark[3], 0, 150, 320, 2);
      for (let x = 0; x < 320; x += 40) rect(c, K.woodDark[1], x, 152, 1, 72);
      // the timeline arrow
      rect(c, K.wood[1], 10, 158, 300, 3); for (let i = 0; i < 6; i++) rect(c, K.wood[1], 308 - i, 155 + i / 2, 1, 9 - i);
    });
    txtC(g, this.sets[Math.min(this.round, this.rounds - 1)].name, 160, 28, K.wood[0]);
    txt(g, 'Oldest', 12, 52, K.ink[3]); txt(g, 'Newest', 284, 52, K.ink[3]);
    this.slots.forEach((r, i) => {
      const c = this.cards[i], sel = this.sel === i, pk = this.picked === i;
      const wob = c.wobble > 0 ? Math.round(Math.sin(c.wobble * 50) * 2) : 0, lift = pk ? -6 : sel ? -2 : 0;
      const x = r[0] + wob, y = r[1] + lift;
      card(g, x, y, r[2], r[3], { fill: c.locked ? K.mint[4] : pk ? K.butter[3] : K.paper[3], band: c.locked ? K.mint[3] : K.paper[2] });
      if (sel) { rect(g, K.butter[1], x - 1, y + r[3] + 2, r[2] + 2, 2); }
      rect(g, c.locked ? K.mint[2] : K.butter[2], x + 1, y + 1, r[2] - 2, 9);
      txtC(g, c.locked ? yearText(c.year) : '?', x + r[2] / 2, y + 3, INK);
      wrapPx(c.text, r[2] - 6).slice(0, 6).forEach((l, j) => txtC(g, l, x + r[2] / 2, y + 16 + j * 9, INK));
      rect(g, K.wood[1], r[0] + r[2] / 2 - 1, 156, 3, 7);
    });
    btn(g, 124, 166, 72, 18, 'Check', { on: this.sel === 5, color: K.butter });
    txtC(g, this.checks ? `Checks: ${this.checks}` : 'Tip: years show once a card is right', 160, 192, K.paper[3]);
  }
}

export function timelineBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || Math.round(t * 60) % 6) return input;
  const i = m.cards.findIndex((c, j) => c.rank !== j);
  if (i < 0) { Object.assign(input, { mx: 160, my: 174, justDown: true, moved: true }); return input; }
  const j = m.picked < 0 ? i : m.cards.findIndex((c) => c.rank === m.picked);
  const r = m.slots[m.picked < 0 ? i : j];
  return Object.assign(input, { mx: r[0] + 20, my: r[1] + 30, justDown: true, moved: true });
}
