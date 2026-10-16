// STAR RUNNER: Mochi vs. the dust bunnies. A top-down arena shooter (Prairie King style, cozy art).
// Arrows/WASD or drag the pointer to move; Mochi auto-fires at the nearest bunny; E drops a Mochi bomb.
// Six stages (bosses on 3 and 6), power-ups (spread, rapid, shield, speed, heart, bomb), three lives.
import { register } from '../../core/registry.js';
import { drawTextC, drawText } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { mulberry32 } from '../../rng.js';
import { Arcade, W, H, rect, disc, clamp, hash, steer, ePressed, botIn, dirKeys, hudBar } from './kit.js';

const AX0 = 14, AY0 = 28, AX1 = 306, AY1 = 208, STAGES = 6, STAGE_LEN = 12;
export const SR_CFG = { lives: 3, goal: 6000, perTicket: 90, winBonus: 25, bg1: '#1b1430', bg2: '#ffd76a', help: 'ARROWS MOVE   E BOMB   DRAG TO STEER', botCap: 100 };
const PU = { spread: ['S', K.sky[3]], rapid: ['R', K.coral[3]], shield: ['O', K.mint[3]], speed: ['>', K.butter[3]], heart: ['H', K.ribbon[2]], bomb: ['B', K.lilac[3]] };

export class StarRunner extends Arcade {
  constructor(game, opts) { super(game, opts, SR_CFG); this.rng = mulberry32((Math.random() * 1e9) | 0); }
  start() {
    Object.assign(this, { p: { x: 160, y: 120, inv: 1, shield: 0, spread: 0, rapid: 0, speed: 0, fire: 0, dir: { x: 0, y: -1 } }, bombs: 1, stage: 0, enemies: [], shots: [], eshots: [], pups: [], fx: [], boss: null, flash: 0, combo: 0, comboT: 0, kills: 0 });
    this.nextStage();
  }
  nextStage() {
    this.stage++; this.stageT = 0; this.spawnAcc = 0; this.banner = 2;
    this.isBoss = this.stage === 3 || this.stage === STAGES;
    if (this.isBoss) { const hp = 34 + this.stage * 8; this.boss = { x: 160, y: 56, hp, max: hp, t: 0, dx: 1, r: 18 }; }
    this.intermission = 0;
  }
  rand() { return this.rng(); }
  spawn(kind) {
    const side = Math.floor(this.rand() * 4), s = this.stage, r = this.rand();
    const x = side === 0 ? AX0 : side === 1 ? AX1 : AX0 + r * (AX1 - AX0), y = side === 2 ? AY0 : side === 3 ? AY1 : AY0 + r * (AY1 - AY0);
    const k = kind || (s >= 4 && this.rand() < 0.2 ? 'zig' : s >= 2 && this.rand() < 0.3 ? 'fluff' : 'bunny');
    const T = { bunny: { hp: 1, sp: 26 + s * 4, r: 5, pts: 10 }, fluff: { hp: 3, sp: 17 + s * 3, r: 8, pts: 30 }, zig: { hp: 2, sp: 36 + s * 3, r: 6, pts: 25 } }[k];
    this.enemies.push({ k, x, y, hp: T.hp, sp: T.sp, r: T.r, pts: T.pts, ph: this.rand() * 6.28, t: 0 });
  }
  hurt() {
    const p = this.p;
    if (p.inv > 0) return;
    if (p.shield > 0) { p.shield = 0; p.inv = 1; sfx('pop'); return; }
    this.lives--; p.inv = 2.2; sfx('wrong'); this.flash = 0.25; this.combo = 0;
    this.enemies = this.enemies.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) > 46); this.eshots = [];
    p.spread = p.rapid = p.speed = 0;
    if (this.lives <= 0) this.end(false, 'The dust bunnies won this round.');
  }
  addPoints(n) { this.combo = Math.min(8, this.combo + 1); this.comboT = 2; this.points += Math.round(n * (1 + (this.combo - 1) * 0.1)); }
  killEnemy(e) {
    this.kills++; this.addPoints(e.pts); sfx('pop');
    for (let i = 0; i < 4; i++) this.fx.push({ x: e.x, y: e.y, vx: (this.rand() - 0.5) * 70, vy: (this.rand() - 0.5) * 70, life: 0.4, c: K.paper[3] });
    if (this.rand() < 0.11) { const ks = Object.keys(PU); this.pups.push({ k: ks[Math.floor(this.rand() * ks.length)], x: e.x, y: e.y, life: 9 }); }
  }
  bomb() {
    if (this.bombs <= 0) return;
    this.bombs--; this.flash = 0.5; sfx('star');
    for (const e of this.enemies) this.killEnemy(e);
    this.enemies = []; this.eshots = [];
    if (this.boss) this.boss.hp -= 12;
  }
  tick(dt, input) {
    const p = this.p, s = steer(input, p.x, p.y, 4), spd = 82 * (p.speed > 0 ? 1.35 : 1);
    p.x = clamp(p.x + s.x * spd * dt, AX0 + 6, AX1 - 6); p.y = clamp(p.y + s.y * spd * dt, AY0 + 8, AY1 - 6);
    if (s.x || s.y) p.dir = { x: s.x, y: s.y };
    for (const k of ['inv', 'shield', 'spread', 'rapid', 'speed']) if (p[k] > 0 && k !== 'shield') p[k] = Math.max(0, p[k] - dt);
    this.flash = Math.max(0, this.flash - dt); this.banner = Math.max(0, this.banner - dt);
    if (this.comboT > 0 && (this.comboT -= dt) <= 0) this.combo = 0;
    if (ePressed(input)) this.bomb();
    // auto-fire at the nearest target
    p.fire -= dt;
    if (p.fire <= 0) {
      let tgt = null, bd = 1e9;
      for (const e of this.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tgt = e; } }
      if (this.boss) { const d = Math.hypot(this.boss.x - p.x, this.boss.y - p.y); if (d < bd) { bd = d; tgt = this.boss; } }
      if (tgt && bd < 190) {
        const a = Math.atan2(tgt.y - p.y, tgt.x - p.x), sp = 170, fan = p.spread > 0 ? [-0.26, 0, 0.26] : [0];
        for (const o of fan) this.shots.push({ x: p.x, y: p.y - 3, vx: Math.cos(a + o) * sp, vy: Math.sin(a + o) * sp, life: 1.2 });
        p.fire = 0.3 / (p.rapid > 0 ? 1.9 : 1); sfx('blip');
      } else p.fire = 0.05;
    }
    for (const b of this.shots) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
    this.shots = this.shots.filter((b) => b.life > 0 && b.x > AX0 && b.x < AX1 && b.y > AY0 && b.y < AY1);
    // spawns
    this.stageT += dt;
    const spawning = !this.isBoss && this.stageT < STAGE_LEN;
    if (spawning || (this.boss && this.stageT > 2)) {
      this.spawnAcc += dt * (this.boss ? 0.55 : 0.9 + this.stage * 0.4);
      while (this.spawnAcc >= 1) { this.spawnAcc--; this.spawn(); }
    }
    // enemies
    for (const e of this.enemies) {
      e.t += dt; let dx = p.x - e.x, dy = p.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      let vx = dx, vy = dy;
      if (e.k === 'zig') { vx += -dy * Math.sin(e.t * 4 + e.ph) * 1.1; vy += dx * Math.sin(e.t * 4 + e.ph) * 1.1; }
      e.x += vx * e.sp * dt; e.y += vy * e.sp * dt;
      if (d < e.r + 5) this.hurt();
    }
    for (const b of this.shots) {
      for (const e of this.enemies) if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 2) { e.hp--; b.life = 0; e.flash = 0.08; if (e.hp <= 0) this.killEnemy(e); break; }
      const B = this.boss; if (B && b.life > 0 && Math.hypot(B.x - b.x, B.y - b.y) < B.r + 2) { B.hp--; b.life = 0; sfx('pop'); this.points += 3; }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    // boss
    const B = this.boss;
    if (B) {
      B.t += dt; B.x += B.dx * (28 + this.stage * 3) * dt; if (B.x > AX1 - 30 || B.x < AX0 + 30) B.dx *= -1; B.y = 56 + Math.sin(B.t * 1.3) * 10;
      if (B.t > 1 && Math.floor(B.t / 1.8) !== Math.floor((B.t - dt) / 1.8)) {
        const n = 8 + (this.stage > 3 ? 4 : 0), off = B.t;
        for (let i = 0; i < n; i++) { const a = off + (i / n) * 6.283; this.eshots.push({ x: B.x, y: B.y, vx: Math.cos(a) * 52, vy: Math.sin(a) * 52, life: 6 }); }
        sfx('whistle');
      }
      if (Math.hypot(B.x - p.x, B.y - p.y) < B.r + 5) this.hurt();
      if (B.hp <= 0) {
        this.points += 400 * (this.stage / 3); this.flash = 0.6; sfx('levelup'); this.boss = null; this.enemies = []; this.eshots = [];
        for (let i = 0; i < 14; i++) this.fx.push({ x: B.x, y: B.y, vx: (this.rand() - 0.5) * 120, vy: (this.rand() - 0.5) * 120, life: 0.8, c: K.butter[3] });
        this.pups.push({ k: 'heart', x: B.x, y: B.y + 10, life: 12 });
      }
    }
    for (const b of this.eshots) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (Math.hypot(b.x - p.x, b.y - p.y) < 6) { b.life = 0; this.hurt(); } }
    this.eshots = this.eshots.filter((b) => b.life > 0 && b.x > AX0 - 8 && b.x < AX1 + 8 && b.y > AY0 - 8 && b.y < AY1 + 8);
    // power-ups
    for (const u of this.pups) {
      u.life -= dt;
      if (Math.hypot(u.x - p.x, u.y - p.y) < 11) {
        u.life = 0; sfx('coin'); this.points += 20;
        if (u.k === 'heart') this.lives = Math.min(5, this.lives + 1); else if (u.k === 'bomb') this.bombs = Math.min(4, this.bombs + 1);
        else if (u.k === 'shield') p.shield = 1; else p[u.k] = 10;
      }
    }
    this.pups = this.pups.filter((u) => u.life > 0);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; }
    this.fx = this.fx.filter((f) => f.life > 0);
    // stage clear
    const cleared = this.isBoss ? !this.boss : this.stageT > STAGE_LEN && this.enemies.length <= 1;
    if (cleared || (!this.isBoss && this.stageT > STAGE_LEN + 7)) {
      this.intermission += dt;
      if (this.intermission > 1.2) {
        this.points += 100 * this.stage; this.enemies = [];
        if (this.stage >= STAGES) { this.points += this.lives * 250; this.end(true, 'The dust bunnies are tidied up!'); } else this.nextStage();
      }
    }
  }
  drawMochi(g, x, y, inv) {
    if (inv > 0 && Math.floor(this.clock * 14) % 2) return;
    x = Math.round(x); y = Math.round(y);
    rect(g, 'rgba(0,0,0,.28)', x - 5, y + 5, 10, 2);
    disc(g, '#3a2a30', x, y, 6); disc(g, '#fff6e6', x, y, 5);
    rect(g, '#3a2a30', x - 6, y - 8, 4, 4); rect(g, '#3a2a30', x + 2, y - 8, 4, 4); rect(g, '#f7b4c0', x - 5, y - 7, 2, 2); rect(g, '#f7b4c0', x + 3, y - 7, 2, 2);
    rect(g, '#e8943a', x - 4, y - 4, 3, 3); rect(g, '#3a2a30', x - 3, y - 1, 1, 2); rect(g, '#3a2a30', x + 2, y - 1, 1, 2); rect(g, '#f7a0a8', x - 1, y + 1, 2, 1);
    if (this.p.shield > 0) { g.strokeStyle = K.mint[3]; g.beginPath(); g.arc(x, y, 10, 0, 6.3); g.stroke(); }
  }
  drawBunny(g, e) {
    const x = Math.round(e.x), y = Math.round(e.y), r = e.r, c = e.flash > 0 ? '#ffffff' : e.k === 'fluff' ? K.lilac[2] : e.k === 'zig' ? K.sky[2] : K.paper[1];
    if (e.flash > 0) e.flash -= 0.016;
    rect(g, 'rgba(0,0,0,.25)', x - r, y + r - 1, r * 2, 2);
    disc(g, '#3a2a30', x, y, r + 1); disc(g, c, x, y, r);
    if (e.k !== 'fluff') { rect(g, '#3a2a30', x - r + 1, y - r - 4, 2, 5); rect(g, '#3a2a30', x + r - 3, y - r - 4, 2, 5); }
    rect(g, '#3a2a30', x - 2, y - 1, 1, 2); rect(g, '#3a2a30', x + 2, y - 1, 1, 2);
    if (e.k === 'fluff') for (let i = 0; i < 6; i++) rect(g, K.lilac[3], x - r + i * 3, y - r - 1 + (i % 2) * 2, 2, 2);
  }
  draw(g, sprite) {
    void sprite;
    if (this.phase === 'attract') {
      return this.attract(g, 'STAR RUNNER', 'MOCHI VS. THE DUST BUNNIES', (gg, t) => { this.p = this.p || { inv: 0, shield: 0 }; this.drawMochi(gg, 160 + Math.sin(t) * 30, 78, 0); this.drawBunny(gg, { k: 'bunny', x: 110, y: 90 + Math.sin(t * 2) * 4, r: 5 }); this.drawBunny(gg, { k: 'fluff', x: 220, y: 96, r: 8 }); });
    }
    rect(g, '#2a1f40', 0, 20, W, H - 20); rect(g, '#33264e', AX0, AY0, AX1 - AX0, AY1 - AY0);
    for (let y = 0; y < 11; y++) for (let x = 0; x < 18; x++) if ((x + y) % 2) rect(g, '#382a56', AX0 + x * 16, AY0 + y * 16, 16, 16);
    for (let i = 0; i < 6; i++) { rect(g, K.coral[2], 18 + i * 56, 24, 3, 4); rect(g, K.butter[3], 19 + i * 56, 25, 1, 2); }
    rect(g, K.lilac[1], AX0 - 2, AY0 - 2, AX1 - AX0 + 4, 2); rect(g, K.lilac[1], AX0 - 2, AY1, AX1 - AX0 + 4, 2); rect(g, K.lilac[1], AX0 - 2, AY0, 2, AY1 - AY0); rect(g, K.lilac[1], AX1, AY0, 2, AY1 - AY0);
    for (const u of this.pups) { const [ch, c] = PU[u.k]; if (u.life < 3 && Math.floor(u.life * 6) % 2) continue; disc(g, '#3a2a30', Math.round(u.x), Math.round(u.y), 6); disc(g, c, Math.round(u.x), Math.round(u.y), 5); drawTextC(g, ch, Math.round(u.x), Math.round(u.y) - 3, '#3a2a30', 1, null); }
    for (const e of this.enemies) this.drawBunny(g, e);
    const B = this.boss;
    if (B) {
      const x = Math.round(B.x), y = Math.round(B.y);
      disc(g, '#3a2a30', x, y, B.r + 2); disc(g, this.stage > 3 ? K.coral[1] : K.lilac[2], x, y, B.r); disc(g, this.stage > 3 ? K.coral[2] : K.lilac[3], x - 3, y - 4, B.r - 7);
      rect(g, '#3a2a30', x - 9, y - 3, 4, 5); rect(g, '#3a2a30', x + 5, y - 3, 4, 5); rect(g, '#fff6e6', x - 8, y - 2, 2, 2); rect(g, '#fff6e6', x + 6, y - 2, 2, 2);
      rect(g, '#3a2a30', x - 6, y + 6, 12, 2);
      for (let i = 0; i < 5; i++) rect(g, K.paper[3], x - 14 + i * 7, y - B.r - 3 + (i % 2) * 2, 4, 5);
      rect(g, '#1a1228', 90, 24, 140, 5); rect(g, K.coral[2], 91, 25, Math.round(138 * clamp(B.hp / B.max, 0, 1)), 3);
    }
    for (const b of this.eshots) { disc(g, '#3a2a30', Math.round(b.x), Math.round(b.y), 3); disc(g, K.coral[3], Math.round(b.x), Math.round(b.y), 2); }
    for (const b of this.shots) { rect(g, K.butter[3], Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3); rect(g, '#ffffff', Math.round(b.x), Math.round(b.y), 1, 1); }
    this.drawMochi(g, this.p.x, this.p.y, this.p.inv);
    for (const f of this.fx) rect(g, f.c, Math.round(f.x), Math.round(f.y), 2, 2);
    if (this.flash > 0) rect(g, `rgba(255,246,200,${Math.min(0.5, this.flash)})`, 0, 20, W, H - 20);
    hudBar(g, `STAGE ${this.stage}`, this.points, this.lives, `BOMB ${this.bombs}${this.combo > 1 ? '  X' + this.combo : ''}`, 5);
    const pw = [this.p.spread > 0 && 'SPREAD', this.p.rapid > 0 && 'RAPID', this.p.speed > 0 && 'SPEED', this.p.shield > 0 && 'SHIELD'].filter(Boolean).join(' ');
    if (pw) drawText(g, pw, 8, 212, K.mint[3], 1, null);
    if (this.banner > 0 && this.phase === 'play') drawTextC(g, this.isBoss ? 'BOSS: DUST DRAGON!' : `STAGE ${this.stage}`, 160, 100, K.butter[3], 2, null);
    this.overlay(g);
  }
}
register('minigame', 'sv2_star_runner', {
  title: 'Star Runner', resultTitle: 'ARCADE', music: 'minigame',
  make: (game, o) => new StarRunner(game, o),
  bot(m, t, inp) {
    m.autoplay = true;
    if (m.phase !== 'play') { inp.pressed = new Set(['e']); return inp; }
    const p = m.p; let vx = 0, vy = 0, close = 0;
    for (const e of m.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 60) { vx += (dx / d) * (60 - d); vy += (dy / d) * (60 - d); close++; } }
    for (const b of m.eshots) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 40) { vx += (dx / d) * (40 - d); vy += (dy / d) * (40 - d); } }
    const cx = 160 - p.x, cy = 130 - p.y; vx += cx * 0.05 + Math.sin(t * 0.9) * 8; vy += cy * 0.05 + Math.cos(t * 0.7) * 8;
    inp.keys = new Set(dirKeys(vx, vy, 4));
    inp.pressed = new Set(close >= 5 && Math.sin(t * 7) > 0.9 ? ['e'] : []);
    return inp;
  },
});
void hash; void botIn;
