// Japanese "Kanji Trace": follow each stroke in order, from the numbered dot along the arrow, staying in the band.
import { Cursor, actHeld } from '../../input.js';
import { CardGame, K, INK, rect, disc, line, txt, txtC, deskTop, card, sfx, clamp } from './common.js';

// Strokes in a 100x100 box, in stroke order.
export const KANJI = [
  { id: 'ichi', mean: 'one', read: 'ichi', s: [[[15, 50], [85, 50]]] },
  { id: 'ni', mean: 'two', read: 'ni', s: [[[25, 32], [75, 32]], [[12, 70], [88, 70]]] },
  { id: 'san', mean: 'three', read: 'san', s: [[[22, 22], [78, 22]], [[28, 50], [72, 50]], [[12, 80], [88, 80]]] },
  { id: 'juu', mean: 'ten', read: 'juu', s: [[[12, 45], [88, 45]], [[50, 10], [50, 92]]] },
  { id: 'hito', mean: 'person', read: 'hito', s: [[[50, 12], [48, 45], [18, 88]], [[50, 45], [84, 88]]] },
  { id: 'oo', mean: 'big', read: 'oo', s: [[[12, 38], [88, 38]], [[50, 10], [48, 45], [16, 90]], [[52, 48], [86, 90]]] },
  { id: 'yama', mean: 'mountain', read: 'yama', s: [[[50, 10], [50, 80]], [[18, 35], [18, 82], [82, 82]], [[82, 35], [82, 82]]] },
  { id: 'kawa', mean: 'river', read: 'kawa', s: [[[22, 15], [22, 55], [14, 88]], [[50, 22], [50, 78]], [[80, 12], [80, 92]]] },
  { id: 'kuchi', mean: 'mouth', read: 'kuchi', s: [[[20, 20], [20, 82]], [[20, 20], [80, 20], [80, 82]], [[20, 82], [80, 82]]] },
  { id: 'hi', mean: 'sun, day', read: 'hi', s: [[[22, 12], [22, 90]], [[22, 12], [78, 12], [78, 90]], [[22, 50], [78, 50]], [[22, 90], [78, 90]]] },
  { id: 'ki', mean: 'tree', read: 'ki', s: [[[12, 35], [88, 35]], [[50, 8], [50, 94]], [[48, 38], [14, 80]], [[52, 38], [86, 80]]] },
  { id: 'ue', mean: 'up, above', read: 'ue', s: [[[45, 12], [45, 85]], [[45, 48], [78, 48]], [[12, 85], [88, 85]]] },
  { id: 'shita', mean: 'down, below', read: 'shita', s: [[[12, 18], [88, 18]], [[48, 18], [48, 92]], [[52, 45], [72, 62]]] },
  { id: 'chii', mean: 'small', read: 'chii', s: [[[50, 10], [50, 85], [40, 92]], [[28, 40], [14, 72]], [[70, 40], [88, 72]]] },
  { id: 'naka', mean: 'middle', read: 'naka', s: [[[22, 28], [22, 68]], [[22, 28], [78, 28], [78, 68]], [[22, 68], [78, 68]], [[50, 8], [50, 94]]] },
  { id: 'tsuki', mean: 'moon', read: 'tsuki', s: [[[28, 10], [28, 70], [14, 92]], [[28, 10], [76, 10], [76, 88], [66, 84]], [[28, 38], [76, 38]], [[28, 62], [76, 62]]] },
  { id: 'hi_fire', mean: 'fire', read: 'hi', s: [[[24, 34], [32, 52]], [[78, 30], [68, 50]], [[50, 10], [48, 50], [16, 90]], [[52, 52], [86, 90]]] },
];
const BX = 94, BY = 34, SC = 1.5; // the practice square on screen (150x150)
const P = (pt) => [BX + pt[0] * SC, BY + pt[1] * SC];

function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function pointAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= l || i === pts.length - 1) { const k = clamp(s / (l || 1), 0, 1); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
    s -= l;
  }
  return pts[pts.length - 1];
}

export class KanjiGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: opts.exam ? 'Japanese exam' : 'Kanji Trace', chip: 'Japanese', color: K.coral, limit: opts.exam ? 70 : opts.quiz ? 25 : 50,
      how: ['Trace each stroke in order: start at the numbered dot and follow the arrow.', 'Hold the mouse button and drag, or hold space and steer with the arrows.'],
      keys: 'Hold click or space to draw',
    });
    const n = opts.quiz ? 1 : opts.exam ? 4 : 2 + (this.diff > 0.5 ? 1 : 0);
    const pool = KANJI.filter((k) => this.diff > 0.4 || k.s.length <= 3).slice();
    this.list = [];
    while (this.list.length < n && pool.length) this.list.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    this.tol = 15 - this.diff * 5;
    this.cur = new Cursor(160, 120, 80, [BX - 10, BY - 10, BX + 160, BY + 160]);
    Object.assign(this, { ki: 0, si: 0, prog: 0, errSum: 0, errN: 0, trail: [], doneStrokes: [], charScores: [], wait: 0 });
    this.loadStroke();
  }
  get kanji() { return this.list[this.ki]; }
  loadStroke() { this.pts = this.kanji.s[this.si].map(P); this.len = polyLen(this.pts); this.prog = 0; this.started = false; this.trail = []; }
  progress() { const done = this.charScores.reduce((a, b) => a + b, 0) + (this.si / this.kanji.s.length) * 0.6; return clamp(done / this.list.length, 0.25, 1); }
  info() { return `${Math.min(this.ki + 1, this.list.length)}/${this.list.length}`; }
  play(dt, input) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) this.nextChar(); return; }
    const held = actHeld(input);
    this.cur.update(dt, input);
    if (!held) return;
    const c = [this.cur.x, this.cur.y];
    if (!this.started) {
      if (Math.hypot(c[0] - this.pts[0][0], c[1] - this.pts[0][1]) < this.tol + 4) { this.started = true; sfx('page'); }
      return;
    }
    // project the cursor onto the stroke a little ahead of the current progress
    let best = -1, bd = 1e9;
    for (let s = this.prog; s <= Math.min(this.len, this.prog + 28); s += 1.5) { const p = pointAt(this.pts, s), d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; best = s; } }
    if (bd < this.tol) {
      if (best > this.prog) { this.prog = best; this.trail.push(c); if (this.trail.length > 400) this.trail.shift(); }
      this.errSum += bd / this.tol; this.errN++;
    } else { this.errSum += 1; this.errN++; if (Math.floor(this.t * 10) % 4 === 0) this.pop('Back on the line!', c[0], c[1] - 14, K.coral[3]); }
    if (this.prog >= this.len - 3) {
      this.doneStrokes.push(this.pts); sfx('fold');
      this.si++;
      if (this.si >= this.kanji.s.length) {
        const acc = this.errN ? 1 - this.errSum / this.errN : 1;
        const sc = clamp(0.45 + acc * 0.6, 0.3, 1);
        this.charScores.push(sc); sfx('chime'); this.flash = 0.3;
        this.pop(sc > 0.85 ? 'Beautiful!' : sc > 0.65 ? 'Neat!' : 'Done!', 170, 26 + 150, K.butter[3]);
        this.wait = 0.9; this.errSum = 0; this.errN = 0;
      } else this.loadStroke();
    }
  }
  nextChar() {
    this.ki++; this.si = 0; this.doneStrokes = [];
    if (this.ki >= this.list.length) { const avg = this.charScores.reduce((a, b) => a + b, 0) / this.list.length; this.finish(avg - Math.max(0, this.playT - this.limit * 0.75) / this.limit * 0.2); return; }
    this.loadStroke();
  }
  timeUp() { this.finish(this.progress()); }
  scene(g) {
    deskTop(g);
    // practice sheet
    card(g, 76, 24, 186, 186, { fill: K.paper[4], band: K.paper[2] });
    const R = K.coral;
    rect(g, R[3], BX - 4, BY - 4, 158, 158); rect(g, K.paper[4], BX - 3, BY - 3, 156, 156);
    for (let i = 0; i < 150; i += 6) { rect(g, R[4], BX + 75, BY + i, 1, 3); rect(g, R[4], BX + i, BY + 75, 3, 1); }
    // ghost of the whole character (low difficulty only)
    if (this.diff < 0.7 && this.ki < this.list.length) for (const st of this.kanji.s) { const pts = st.map(P); for (let i = 1; i < pts.length; i++) line(g, K.paper[2], pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 7); }
    // finished strokes in brush ink
    for (const pts of this.doneStrokes) for (let i = 1; i < pts.length; i++) { line(g, K.navy[0], pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 5); }
    if (this.wait <= 0 && this.ki < this.list.length) {
      const pts = this.pts;
      for (let i = 1; i < pts.length; i++) line(g, K.sky[3], pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 9);
      // ink so far
      if (this.prog > 0) { let prev = pts[0]; for (let s = 2; s <= this.prog; s += 2) { const p = pointAt(pts, s); line(g, K.navy[1], prev[0], prev[1], p[0], p[1], 5); prev = p; } }
      // arrow head at the end and a moving guide
      const end = pts[pts.length - 1], pre = pointAt(pts, this.len - 8);
      const ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
      for (let k = 0; k < 6; k++) { const a1 = ang + 2.5, a2 = ang - 2.5; line(g, R[1], end[0], end[1], end[0] + Math.cos(a1) * 7, end[1] + Math.sin(a1) * 7, 2); line(g, R[1], end[0], end[1], end[0] + Math.cos(a2) * 7, end[1] + Math.sin(a2) * 7, 2); }
      if (!this.started) { const gp = pointAt(pts, ((this.t * 50) % (this.len + 20))); disc(g, R[3], gp[0], gp[1], 2); }
      disc(g, INK, pts[0][0], pts[0][1], 6); disc(g, R[2], pts[0][0], pts[0][1], 5);
      txtC(g, String(this.si + 1), pts[0][0] + 1, pts[0][1] - 2, K.paper[4]);
    }
    // side notes
    card(g, 8, 30, 62, 92);
    txtC(g, 'Kanji', 39, 36, R[1]);
    const kj = this.kanji || this.list[this.list.length - 1];
    txtC(g, 'Means', 39, 50, K.ink[3]);
    kj.mean.split(', ').forEach((m, i) => txtC(g, m, 39, 59 + i * 8, INK));
    txtC(g, 'Reading', 39, 78, K.ink[3]); txtC(g, kj.read, 39, 87, INK);
    txtC(g, `Strokes ${kj.s.length}`, 39, 104, K.ink[3]);
    card(g, 270, 30, 44, 60);
    txtC(g, 'Done', 292, 36, R[1]);
    this.charScores.forEach((s, i) => { const x = 278 + (i % 2) * 15, y = 48 + Math.floor(i / 2) * 15; rect(g, R[1], x, y, 12, 12); rect(g, s > 0.85 ? K.butter[2] : R[3], x + 1, y + 1, 10, 10); });
    // brush cursor
    const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
    line(g, K.woodDark[1], x + 3, y - 3, x + 14, y - 14, 3); rect(g, INK, x - 1, y - 1, 4, 4); rect(g, K.navy[0], x, y, 2, 2);
  }
}

export function kanjiBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || !m.pts) return input;
  const tgt = m.started ? pointAt(m.pts, Math.min(m.len, m.prog + 8)) : m.pts[0];
  return Object.assign(input, { mx: tgt[0], my: tgt[1], moved: true, down: true });
}
