// Part-time shift minigame for the four new shops (sv5): flower arranging, shelving books, pricing vintage finds and bike repairs.
// Each round shows a customer request and three choices; press 1/2/3 (or Left/Right + Space, or tap). Faster answers earn a streak bonus.
import { register } from '../../core/registry.js';
import { mulberry32 } from '../../rng.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
// [request, right answer, wrong1, wrong2]
export const KINDS = {
  flower: { title: 'Petal and Pot shift', head: 'ARRANGE THE BOUQUET', col: K.coral, q: [
    ['A cheerful gift for a friend', 'Sunflowers', 'Black roses', 'Dried reeds'], ['Something calm for a sick neighbour', 'Lavender', 'Hot peppers', 'Thistles'], ['A romantic surprise', 'Red tulips', 'Cactus', 'Dandelions'],
    ['Congrats on the new job', 'Yellow daisies', 'Wilted lilies', 'Pine cones'], ['A thank-you for the teacher', 'Cosmos', 'Weeds', 'Rubber plants'], ['A wedding table', 'White roses', 'Ferns only', 'Grass clippings'],
    ['For a bright windowsill', 'Potted marigolds', 'Dry moss', 'A stick'], ['Sympathy, soft and quiet', 'White chrysanthemums', 'Neon balloons', 'Hot pink fern'], ['A spring welcome', 'Cherry blossom', 'Holly', 'Autumn leaves']] },
  book: { title: 'Nook Books shift', head: 'SHELVE THE BOOKS', col: K.sky, q: [
    ['Mystery novel: where?', 'Crime shelf', 'Cookery shelf', 'Kids corner'], ['A picture book of ducks', 'Kids corner', 'Crime shelf', 'Maps shelf'], ['Atlas of the Pacific', 'Maps shelf', 'Poetry shelf', 'Romance shelf'],
    ['A book of haiku', 'Poetry shelf', 'Science shelf', 'Crime shelf'], ['Bread baking for beginners', 'Cookery shelf', 'Maps shelf', 'Poetry shelf'], ['Stars and planets', 'Science shelf', 'Romance shelf', 'Kids corner'],
    ['A love story in Kyoto', 'Romance shelf', 'Science shelf', 'Cookery shelf'], ['Manga volume 12', 'Manga wall', 'Maps shelf', 'Poetry shelf'], ['A knitting guide', 'Crafts shelf', 'Crime shelf', 'Science shelf']] },
  thrift: { title: 'Second Spring shift', head: 'PRICE THE FINDS', col: K.butter, q: [
    ['A chipped teacup with a pretty glaze', '40 coins', '4000 coins', '1 coin'], ['A working 1980s radio', '300 coins', '3 coins', '30000 coins'], ['A wool coat, barely worn', '250 coins', '5 coins', '2500 coins'],
    ['A jar of loose buttons', '30 coins', '3000 coins', '0 coins'], ['A signed record', '500 coins', '5 coins', '50000 coins'], ['A cracked old vase', '20 coins', '2000 coins', '2 coins'],
    ['A leather satchel', '180 coins', '9 coins', '9000 coins'], ['A music box that still plays', '350 coins', '7 coins', '7000 coins'], ['A paperback bundle', '60 coins', '6000 coins', '1 coin']] },
  bike: { title: 'Spoke and Sprocket shift', head: 'FIX THE BIKE', col: K.vermilion, q: [
    ['The tyre is flat', 'Patch kit', 'Paint', 'Bell'], ['The chain keeps slipping', 'Chain oil', 'Pump', 'Reflector'], ['The brakes squeal', 'Brake pads', 'Basket', 'Kickstand'],
    ['The seat is too low', 'Seat clamp', 'Tyre lever', 'Lamp'], ['It rattles over bumps', 'Tighten the bolts', 'Add a bell', 'Wash it'], ['No light at night', 'Dynamo lamp', 'Patch kit', 'Mudguard'],
    ['A bent wheel wobbles', 'Truing stand', 'New basket', 'Paint'], ['The pedal is loose', 'Pedal wrench', 'Chain oil', 'Pump'], ['A rusty chain', 'Degreaser', 'New seat', 'Bell']] },
};
export class ShiftGame {
  constructor(game, o = {}) {
    this.kind = KINDS[o.kind] || KINDS.flower; const rng = mulberry32(((game && game.day) || 1) * 53 + (o.seed || 0)), n = (o.rank || 1) >= 3 ? 9 : (o.rank || 1) >= 2 ? 7 : 6;
    const pool = this.kind.q.slice().sort(() => rng() - 0.5).slice(0, n);
    this.rounds = pool.map(([req, ok, a, b]) => { const opts = [ok, a, b].sort(() => rng() - 0.5); return { req, opts, ans: opts.indexOf(ok) }; });
    this.limit = (o.tired ? 4.5 : 6) + 1; Object.assign(this, { ri: 0, t: 0, right: 0, streak: 0, best: 0, sel: 0, pause: 0, flash: '', done: false, score: 0, fin: 0 });
  }
  answer(i) {
    const r = this.rounds[this.ri]; if (this.pause > 0 || !r) return;
    if (i === r.ans) { this.right++; this.streak++; this.best = Math.max(this.best, this.streak); this.flash = this.streak > 2 ? `Great! x${this.streak}` : 'Correct!'; } else { this.streak = 0; this.flash = i < 0 ? 'Too slow!' : `Oops, it was ${r.opts[r.ans]}`; }
    this.pause = 0.9;
  }
  update(dt, input) {
    if (this.done) return;
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) { this.ri++; this.t = 0; if (this.ri >= this.rounds.length) { this.done = true; this.score = Math.min(1, (this.right + this.best * 0.1) / this.rounds.length); this.result = { text: `${this.right}/${this.rounds.length} right` }; } } return; }
    this.t += dt; const k = input.pressed;
    for (let i = 0; i < 3; i++) if (k.has(String(i + 1))) this.answer(i);
    if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + 2) % 3; if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % 3;
    if (k.has(' ') || k.has('enter') || k.has('e')) this.answer(this.sel);
    if (input.justDown && input.my > 110) { const i = Math.floor((input.mx - 10) / 104); if (i >= 0 && i < 3) this.answer(i); }
    if (this.t > this.limit) this.answer(-1);
  }
  finish() { if (!this.done) { this.done = true; this.score = this.right / this.rounds.length * 0.8; } }
  draw(g) {
    const r = this.rounds[Math.min(this.ri, this.rounds.length - 1)], c = this.kind.col;
    rect(g, c[1], 0, 0, 320, 224); rect(g, c[3], 0, 30, 320, 150); rect(g, K.paper[4], 20, 44, 280, 50); rect(g, K.ink[2], 20, 44, 280, 1);
    drawText(g, this.kind.head, 8, 8, K.paper[4], 1, null); drawText(g, `${Math.min(this.ri + 1, this.rounds.length)}/${this.rounds.length}`, 280, 8, K.paper[4], 1, null);
    drawTextC(g, r.req.toUpperCase(), 160, 64, K.ink[1], 1, null);
    rect(g, K.ink[2], 20, 100, 280, 4); rect(g, this.t / this.limit > 0.7 ? K.coral[2] : K.mint[2], 21, 101, 278 * Math.max(0, 1 - this.t / this.limit), 2);
    r.opts.forEach((o, i) => { const x = 10 + i * 104; rect(g, i === this.sel ? K.butter[3] : K.paper[3], x, 120, 98, 44); rect(g, K.ink[2], x, 120, 98, 1); drawTextC(g, `${i + 1}`, x + 49, 126, K.ink[3], 1, null); drawTextC(g, o.toUpperCase().slice(0, 16), x + 49, 142, K.ink[1], 1, null); });
    drawTextC(g, this.flash, 160, 190, K.paper[4], 1, null);
  }
}
const bot = (m, t, inp) => { const r = m.rounds[m.ri]; if (r && m.pause <= 0 && m.t > 0.3) inp.pressed = new Set([String(r.ans + 1)]); return inp; };
for (const kind of Object.keys(KINDS)) register('minigame', `job_sv5_${kind}`, { title: KINDS[kind].title, resultTitle: 'SHIFT DONE!', make: (g, o) => new ShiftGame(g, { ...o, kind }), bot });
