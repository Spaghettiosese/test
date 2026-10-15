// School event minigames: Sports Day tug-of-war and bread-eating race, the Culture Festival class cafe,
// and the weekly class-duty board wipe.
import { Cursor, act, actHeld } from '../../input.js';
import { CardGame, K, INK, rect, disc, ell, line, txt, txtC, blit, btn, inRect, card, meter, sfx, clamp, dither } from './common.js';

const kid = (g, x, y, top, hair, dir = 1, lean = 0) => {
  ell(g, 'rgba(42,26,64,0.3)', x, y + 1, 8, 2);
  rect(g, INK, x - 6 + lean, y - 24, 12, 24); rect(g, top, x - 5 + lean, y - 23, 10, 11); rect(g, K.paper[4], x - 5 + lean, y - 12, 10, 4); rect(g, K.navy[1], x - 5 + lean, y - 8, 10, 7);
  disc(g, INK, x + lean * 1.5, y - 30, 7); disc(g, hair, x + lean * 1.5, y - 31, 6); rect(g, K.skinLight[3], x - 4 + lean * 1.5 + dir, y - 29, 8, 5);
};
const field = (c) => { rect(c, K.sky[3], 0, 0, 320, 80); rect(c, K.grassSpring[2], 0, 80, 320, 144); for (let y = 80; y < 224; y += 16) rect(c, K.grassSpring[3], 0, y, 320, 8);
  for (let x = 0; x < 320; x += 16) { line(c, K.paper[4], x, 30, x + 16, 36, 1); rect(c, [K.coral[2], K.butter[2], K.sky[2], K.mint[2]][(x / 16) % 4], x + 6, 33, 5, 6); } };

// ======================= TUG OF WAR =======================
export class TugGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Tug-of-war', chip: 'Sports day', color: K.ribbon, limit: 0,
      how: ['Class 2-B against 2-A! Press space (or click) each time the drum beats.', 'Pulling on the beat moves the flag your way. Mashing tires the team out.'],
      keys: 'Space or click on the drum beat',
    });
    Object.assign(this, { pos: 0, beat: 0.55 - this.diff * 0.1, bt: 0, flash: 0, onBeat: 0, offBeat: 0, round: 0, wins: 0, wait: 0 });
  }
  progress() { return clamp(0.5 + this.pos * 0.5, 0.2, 1); }
  info() { return `Rounds ${this.wins}/${this.round}`; }
  play(dt, input) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.pos = 0; if (this.round >= 3) this.finish(clamp(0.3 + this.wins * 0.25, 0.3, 1), this.wins >= 2 ? '2-B wins the tug-of-war!' : '2-A wins this time. What a pull!'); } return; }
    this.bt += dt;
    const phase = (this.bt % this.beat) / this.beat;
    if (this.bt % this.beat < dt) sfx('step');
    this.pos -= dt * (0.09 + this.diff * 0.05);
    if (act(input)) {
      const near = Math.min(phase, 1 - phase);
      if (near < 0.18) { this.pos += 0.07; this.onBeat++; } else { this.pos -= 0.02; this.offBeat++; }
    }
    if (Math.abs(this.pos) >= 1) { this.round++; if (this.pos > 0) { this.wins++; sfx('chime'); this.pop('2-B takes the round!', 160, 60, K.butter[3]); } else { sfx('wrong'); this.pop('2-A takes the round!', 160, 60, K.coral[3]); } this.wait = 1.4; this.pos = clamp(this.pos, -1, 1); }
  }
  scene(g) {
    blit(g, 'school_tug_bg', 320, 224, field);
    const off = Math.round(this.pos * 60), ph = (this.bt % this.beat) / this.beat;
    line(g, K.wood[2], 20, 150, 300, 150, 3);
    rect(g, K.ribbon[2], 158 + off, 140, 4, 22);
    rect(g, K.paper[4], 160, 166, 1, 8); rect(g, K.ribbon[1], 100, 166, 1, 8); rect(g, K.ribbon[1], 220, 166, 1, 8);
    for (let i = 0; i < 4; i++) kid(g, 200 + i * 26 + off, 168, K.navy[2], [K.hairBrown[2], K.hairBlack[2], K.hairGinger[2], K.hairGreen[2]][i], -1, 2);
    for (let i = 0; i < 4; i++) kid(g, 120 - i * 26 + off, 168, K.ribbon[2], [K.hairBlack[1], K.hairBlonde[2], K.hairBrown[1], K.hairBlack[2]][i], 1, -2);
    // drum
    const hit = Math.min(ph, 1 - ph) < 0.18, r = hit ? 14 : 12;
    ell(g, INK, 160, 92, r + 1, 9); ell(g, K.coral[1], 160, 92, r, 8); ell(g, K.paper[4], 160, 89, r - 2, 5);
    txtC(g, '2-B', 270, 186, K.navy[0]); txtC(g, '2-A', 50, 186, K.ribbon[0]);
  }
}
export function tugBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  const ph = (m.bt % m.beat) / m.beat;
  if (ph < 0.05 && !m._hit) { input.pressed.add(' '); m._hit = true; } if (ph > 0.5) m._hit = false;
  return input;
}

// ======================= BREAD-EATING RACE =======================
export class BreadGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Bread-eating race', chip: 'Sports day', color: K.butter, limit: 25,
      how: ['Melon breads dangle on strings! Jump (space or click) to bite one when it swings right above Misa.', 'Grab three breads before your rivals do.'],
      keys: 'Space or click: jump and bite',
    });
    Object.assign(this, { got: 0, jumpT: 0, sw: 0, rivals: [0, 0], wait: 0 });
  }
  progress() { return clamp(this.got / 3, 0.2, 1); }
  info() { return `Bread ${this.got}/3`; }
  timeUp() { this.finish(this.progress(), `You got ${this.got} melon bread${this.got === 1 ? '' : 's'}!`); }
  play(dt, input) {
    this.sw += dt * (2 + this.diff * 1.2);
    this.rivals = this.rivals.map((r, i) => r + dt * (0.09 + i * 0.03));
    if (this.jumpT > 0) {
      this.jumpT -= dt;
      if (this.jumpT < 0.2 && !this.bitten) {
        this.bitten = true;
        if (Math.abs(Math.sin(this.sw) * 40) < 9) { this.got++; sfx('eat'); this.flash = 0.2; this.pop('Nom! Got one!', 160, 60, K.butter[3]); if (this.got >= 3) { const place = 1 + this.rivals.filter((r) => r >= 3).length; this.finish(clamp(1.1 - place * 0.12, 0.5, 1), `Three breads! You placed ${['first', 'second', 'third'][place - 1]}!`); } }
        else { sfx('blip'); this.pop('Missed it!', 160, 60, K.coral[3]); }
      }
    } else if (act(input)) { this.jumpT = 0.5; this.bitten = false; sfx('step'); }
  }
  scene(g) {
    blit(g, 'school_bread_bg', 320, 224, field);
    rect(g, K.wood[1], 20, 40, 280, 4);
    const bx = 160 + Math.round(Math.sin(this.sw) * 40);
    line(g, K.paper[2], 160, 44, bx, 92, 1);
    if (this.got < 3) { ell(g, INK, bx, 98, 10, 8); ell(g, K.butter[2], bx, 98, 9, 7); for (let i = -6; i < 7; i += 4) rect(g, K.butter[1], bx + i, 93, 1, 10); rect(g, K.butter[4], bx - 5, 93, 3, 2); }
    [[90, this.rivals[0], K.ribbon[2]], [230, this.rivals[1], K.sky[2]]].forEach(([x, r, c]) => { kid(g, x, 190, c, K.hairBlack[2]); txtC(g, `${Math.min(3, Math.floor(r))}/3`, x, 150, INK); });
    const jy = this.jumpT > 0 ? -Math.round(Math.sin((0.5 - this.jumpT) / 0.5 * Math.PI) * 60) : 0;
    kid(g, 160, 190 + jy, K.navy[2], K.hairBrown[2]);
    for (let i = 0; i < 3; i++) { ell(g, INK, 20 + i * 18, 206, 7, 6); ell(g, i < this.got ? K.butter[2] : K.paper[1], 20 + i * 18, 206, 6, 5); }
  }
}
export function breadBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.jumpT <= 0 && Math.abs(Math.sin(m.sw + 0.3 * (2 + m.diff * 1.2)) * 40) < 6) input.pressed.add(' ');
  return input;
}

// ======================= CULTURE FESTIVAL: CLASS CAFE =======================
const MENU = [{ id: 'tea', name: 'Tea', c: K.forest }, { id: 'juice', name: 'Juice', c: K.hairGinger }, { id: 'cake', name: 'Cake', c: K.sakura }, { id: 'parfait', name: 'Parfait', c: K.lilac }];
export class CafeGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: '2-B maid cafe', chip: 'Festival', color: K.sakura, limit: 45,
      how: ['Guests order from the menu. Click the item (or press 1-4) to serve the guest at the front.', 'Serve quickly and correctly for tips for the class fund!'],
      keys: '1-4 or click: serve the first guest',
    });
    Object.assign(this, { q: [], spawnT: 0.2, served: 0, tips: 0, wrong: 0, left: 0 });
  }
  progress() { return clamp(this.served / 10 - this.wrong * 0.03, 0.3, 1); }
  info() { return `Served ${this.served}`; }
  timeUp() { this.result = null; this.finish(this.progress(), `Served ${this.served} guests and raised ${this.tips * 10} coins for the class!`); this.bonus = this.served >= 12 ? 1 : 0; }
  serve(i) {
    const c = this.q[0]; if (!c) return;
    if (c.want === i) { this.q.shift(); this.served++; this.tips += c.p > 0.5 ? 2 : 1; sfx('coin'); this.pop(c.p > 0.5 ? 'Thank you! +tip' : 'Thanks!', 80, 70, K.butter[3]); }
    else { this.wrong++; sfx('wrong'); this.pop(`They wanted ${MENU[c.want].name}`, 80, 70, K.coral[3]); }
  }
  play(dt, input) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.q.length < 5) { this.q.push({ want: Math.floor(this.rng() * 4), p: 1, look: Math.floor(this.rng() * 4) }); this.spawnT = 2.6 - this.diff * 0.8; }
    for (const c of this.q) c.p -= dt / (12 - this.diff * 3);
    const gone = this.q.filter((c) => c.p <= 0).length; if (gone) { this.left += gone; this.q = this.q.filter((c) => c.p > 0); }
    for (let i = 0; i < 4; i++) if (input.pressed.has(String(i + 1))) this.serve(i);
    if (input.justDown) for (let i = 0; i < 4; i++) if (inRect(input.mx, input.my, [24 + i * 72, 168, 64, 36])) this.serve(i);
  }
  scene(g) {
    blit(g, 'school_cafe_bg', 320, 224, (c) => {
      rect(c, K.plaster[3], 0, 0, 320, 160); for (let x = 0; x < 320; x += 20) line(c, K.sakura[2], x, 24, x + 20, 30, 1);
      for (let x = 6; x < 320; x += 20) { rect(c, K.sakura[3], x, 27, 6, 8); }
      rect(c, K.wood[2], 0, 120, 320, 40); rect(c, K.wood[3], 0, 120, 320, 3); rect(c, K.wood[1], 0, 157, 320, 3);
      rect(c, K.paper[3], 0, 160, 320, 64);
    });
    const hair = [K.hairBlack[2], K.hairBlonde[2], K.hairGinger[2], K.hairBlue[2]], tops = [K.sky[2], K.mint[2], K.butter[2], K.coral[2]];
    this.q.forEach((c, i) => {
      const x = 60 + i * 56; kid(g, x, 120, tops[c.look], hair[c.look]);
      card(g, x - 18, 50, 36, 26, { shadow: false }); const m = MENU[c.want]; ell(g, m.c[2], x, 60, 7, 5); txtC(g, m.name, x, 66, INK);
      meter(g, x - 14, 80, 28, 2, c.p, c.p > 0.4 ? K.mint[2] : K.coral[2]);
      if (i === 0) txtC(g, 'Next!', x, 40, K.coral[1]);
    });
    MENU.forEach((m, i) => { const x = 24 + i * 72; rect(g, INK, x, 168, 64, 36); rect(g, K.paper[4], x + 1, 169, 62, 34); ell(g, INK, x + 32, 182, 10, 7); ell(g, m.c[2], x + 32, 182, 9, 6); ell(g, m.c[3], x + 29, 180, 3, 2); txtC(g, `${i + 1} ${m.name}`, x + 32, 194, INK); });
    txt(g, `Class fund +${this.tips * 10}`, 220, 136, K.paper[4], K.ink[0]);
  }
}
export function cafeBot(m, t, input) { if (m.phase === 'intro') { input.pressed.add(' '); return input; } if (m.q[0] && Math.round(t * 60) % 20 === 0) input.pressed.add(String(m.q[0].want + 1)); return input; }

// ======================= CLASS DUTY: WIPE THE BOARD =======================
export class BoardGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: 'Class duty: the board', chip: 'Duty', color: K.mint, limit: 0,
      how: ['It\'s your turn on class duty! Wipe the chalk off the board.', 'Hold the mouse (or space with the arrows) and scrub.'],
      keys: 'Hold click or space and move to wipe',
    });
    this.cur = new Cursor(160, 110, 140, [24, 30, 296, 170]);
    this.cells = [];
    for (let y = 40; y < 160; y += 6) for (let x = 30; x < 290; x += 6) this.cells.push({ x, y, d: 0 });
    const marks = 8;
    for (let i = 0; i < marks; i++) { const cx = 50 + this.rng() * 220, cy = 50 + this.rng() * 100, r = 14 + this.rng() * 20; for (const c of this.cells) if (Math.abs(c.x - cx) < r * 1.6 && Math.abs(c.y - cy) < r * 0.5 + 4 && this.rng() < 0.85) c.d = 1; }
    this.total = this.cells.filter((c) => c.d).length || 1;
    this.dust = [];
  }
  get clean() { return 1 - this.cells.reduce((a, c) => a + c.d, 0) / this.total; }
  progress() { return this.clean; }
  info() { return `${Math.round(this.clean * 100)}%`; }
  play(dt, input) {
    this.cur.update(dt, input);
    this.dust = this.dust.filter((d) => (d.y += 30 * dt, d.life -= dt) > 0);
    if (actHeld(input) && this.cur.speedNow > 10) {
      for (const c of this.cells) if (c.d > 0 && Math.abs(c.x - this.cur.x) < 16 && Math.abs(c.y - this.cur.y) < 9) c.d = Math.max(0, c.d - dt * 4);
      if (this.rng() < 0.4) this.dust.push({ x: this.cur.x + (this.rng() - 0.5) * 20, y: this.cur.y + 8, life: 0.8 });
      if (this.rng() < 0.1) sfx('scrub');
    }
    if (this.clean >= 0.96) this.finish(clamp(1.1 - this.playT / 40, 0.5, 1), 'Spotless! Ms. Fujita will be pleased.');
  }
  scene(g) {
    blit(g, 'school_board_bg', 320, 224, (c) => { rect(c, K.plaster[3], 0, 0, 320, 224); rect(c, K.wood[2], 0, 190, 320, 34); });
    const C = K.chalkboard;
    rect(g, K.wood[1], 18, 26, 284, 150); rect(g, C[1], 24, 32, 272, 138);
    for (const c of this.cells) if (c.d > 0.05) { g.globalAlpha = c.d * 0.85; rect(g, C[4], c.x, c.y + ((c.x / 6) % 3), 5, 2); g.globalAlpha = 1; }
    rect(g, K.wood[2], 20, 170, 280, 6);
    for (const d of this.dust) { g.globalAlpha = d.life; rect(g, C[4], d.x, d.y, 1, 1); g.globalAlpha = 1; }
    const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
    rect(g, INK, x - 14, y - 7, 28, 14); rect(g, K.navy[2], x - 13, y - 6, 26, 6); rect(g, K.paper[3], x - 13, y, 26, 6);
  }
}
export function boardBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  const c = m.cells.find((x) => x.d > 0); if (!c) return input;
  return Object.assign(input, { mx: c.x + Math.sin(t * 30) * 10, my: c.y, moved: true, down: true });
}
