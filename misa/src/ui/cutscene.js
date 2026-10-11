// Script runner for dialogue and cutscenes. A script is an array of steps:
//   { t:'say', who:'hana', mood:'happy', text }            { t:'choice', prompt?, options:[{ text, steps, when?(g) }] }
//   { t:'fade', to:1, dur:0.5 }  { t:'wait', dur }          { t:'scene', name }  (backdrop registered as 'backdrop')
//   { t:'sfx', name }  { t:'call', fn(g) }  (fn may return a Promise; the script waits for it)
//   { t:'give', item, n } { t:'take', item, n } { t:'money', n } { t:'friend', npc, n } { t:'flag', k, v } { t:'mood', n }
//   { t:'quest', start|stage|complete: id, stage }          { t:'if', cond(g), then:[...], else:[...] }
//   { t:'move', who, to:[tx,ty], wait:true }  { t:'face', who, dir | to:'misa' }  { t:'emote', who, icon, dur }
//   { t:'warp', map, x, y, dir }  { t:'minigame', id, opts, done(g, result) }  { t:'xp', skill, n }  { t:'energy', n }
//   { t:'set', flag, v } / { t:'set', var, n }   { t:'time', add: minutes }   { t:'run', script: 'scriptId' }   { t:'shop', id }
// Conditions (if.cond, option.when) use the data format in core/cond.js, e.g. 'friend:hana>=4', or a function.
// New step types: register('command', name, { run(game, step, scene) -> optional Promise }).
import { get, register } from '../core/registry.js';
import { check } from '../core/cond.js';
import { drawText, drawTextC, wrap, CHAR_W } from '../font.js';
import { act } from '../input.js';
import { drawPortrait, displayName } from './portraits.js';
import { UI, rect } from './ui.js';

export class CutsceneScene {
  constructor(game, steps, onDone) {
    Object.assign(this, { name: 'cutscene', opaque: false, pausesTime: true, game, steps: (steps || []).slice(), onDone, idx: -1, fade: 0, fadeTo: 0, fadeRate: 0, scene: null, shown: 0, wait: 0, sel: 0, done: false, tick: 0, waiting: false });
  }
  enter() { this.next(); }
  get step() { return this.steps[this.idx]; }
  finish() {
    if (this.done) return;
    this.done = true; this.game.sceneName = null;
    this.game.scenes.pop(this);
    this.onDone && this.onDone();
  }
  next() {
    const g = this.game;
    this.idx++;
    while (this.idx < this.steps.length) {
      const s = this.step, actor = (w) => g.world && g.world.actor(w);
      switch (s.t) {
        case 'call': { const r = s.fn(g); if (r && r.then) { this.waiting = true; r.then(() => { this.waiting = false; this.next(); }); return; } break; }
        case 'sfx': g.sfx(s.name); break;
        case 'scene': this.scene = s.name; g.sceneName = s.name; break;
        case 'give': g.give(s.item, s.n || 1); break;
        case 'take': g.take(s.item, s.n || 1); break;
        case 'money': g.addMoney(s.n); break;
        case 'friend': g.addFriend(s.npc, s.n); break;
        case 'flag': g.setFlag(s.k, s.v === undefined ? true : s.v); break;
        case 'mood': g.addMood(s.n); break;
        case 'xp': g.addXP(s.skill, s.n); break;
        case 'energy': g.addEnergy(s.n); break;
        case 'quest': if (s.start) g.startQuest(s.start); if (s.stage !== undefined && s.id) g.setStage(s.id, s.stage); if (s.complete) g.completeQuest(s.complete); break;
        case 'if': this.steps.splice(this.idx + 1, 0, ...((check(s.cond, g) ? s.then : s.else) || [])); break;
        case 'set': if (s.flag) g.setFlag(s.flag, s.v === undefined ? true : s.v); if (s.var) g.inc(s.var, s.n || 1); break;
        case 'time': g.advance(s.add || 0); break;
        case 'run': { const sc = get('script', s.script); if (!sc) { console.warn('unknown script', s.script); break; } this.steps.splice(this.idx + 1, 0, ...(typeof sc.steps === 'function' ? sc.steps(g) : sc.steps)); break; }
        case 'shop': this.waiting = true; new Promise((res) => g.open('shop', s.id, res)).then(() => { this.waiting = false; this.next(); }); return;
        case 'face': { const a = actor(s.who); if (a) { if (s.to) { const b = actor(s.to); if (b) a.faceTo(b.x, b.y); } else a.dir = s.dir; } break; }
        case 'emote': { const a = actor(s.who); if (a && a.say) a.say(s.icon, s.dur || 1.6); break; }
        case 'move': {
          const a = actor(s.who);
          if (a && g.world) {
            const p = a === g.world.npcs[s.who] ? a.walkTo(g.world.grid, s.to[0], s.to[1]) : a.walkTo(s.to[0], s.to[1]);
            if (s.wait !== false) { this.waiting = true; p.then(() => { this.waiting = false; this.next(); }); return; }
          }
          break;
        }
        case 'warp': this.waiting = true; g.warp(s.map, s.x, s.y, s.dir).then(() => { this.waiting = false; this.next(); }); return;
        case 'minigame': this.waiting = true; g.minigame(s.id, s.opts || {}).then((r) => { if (s.done) s.done(g, r); this.waiting = false; this.next(); }); return;
        case 'fade': this.fadeTo = s.to; this.fadeRate = s.dur > 0 ? 1 / s.dur : 999; this.wait = s.dur || 0; return;
        case 'wait': this.wait = s.dur; return;
        case 'say': this.shown = 0; return;
        case 'choice': this.options = s.options.filter((o) => check(o.when, g)); this.sel = 0; if (!this.options.length) { this.idx++; continue; } return;
        default: {
          const cmd = get('command', s.t);
          if (!cmd) { console.warn('unknown script step', s.t); break; }
          const r = cmd.run(g, s, this);
          if (r && r.then) { this.waiting = true; r.then(() => { this.waiting = false; this.next(); }); return; }
        }
      }
      this.idx++;
    }
    if (this.fade > 0 && this.fadeTo !== 0) { this.fadeTo = 0; this.fadeRate = 3; this.closing = true; return; }
    this.finish();
  }
  update(dt, input) {
    this.tick += dt;
    if (this.fade !== this.fadeTo) {
      const d = this.fadeRate * dt;
      this.fade = this.fade < this.fadeTo ? Math.min(this.fadeTo, this.fade + d) : Math.max(this.fadeTo, this.fade - d);
    }
    if (this.closing) { if (this.fade === 0) this.finish(); return; }
    if (this.waiting) return;
    const s = this.step;
    if (!s) return;
    if (s.t === 'say') {
      const total = s.text.length, before = Math.floor(this.shown);
      const speed = 42 * (this.game.settings.textSpeed || 1) * (input.keys.has('shift') ? 4 : 1);
      this.shown = Math.min(total, this.shown + dt * speed);
      if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) this.game.sfx('blip');
      if (act(input)) { if (this.shown < total) this.shown = total; else this.next(); }
    } else if (s.t === 'wait' || s.t === 'fade') {
      this.wait -= dt;
      if (this.wait <= 0 && this.fade === this.fadeTo) this.next();
    } else if (s.t === 'choice') {
      const n = this.options.length;
      if (input.pressed.has('arrowdown') || input.pressed.has('s')) { this.sel = (this.sel + 1) % n; this.game.sfx('blip'); }
      if (input.pressed.has('arrowup') || input.pressed.has('w')) { this.sel = (this.sel + n - 1) % n; this.game.sfx('blip'); }
      const top = this.choiceTop();
      if (input.moved || input.justDown) { const i = Math.floor((input.my - top) / 13); if (i >= 0 && i < n && input.mx > 50 && input.mx < 270) this.sel = i; }
      if (act(input)) { this.game.sfx('select'); this.steps.splice(this.idx + 1, 0, ...(this.options[this.sel].steps || [])); this.next(); }
    }
  }
  choiceTop() { return Math.round(112 - (this.options.length * 13) / 2); }
  draw(g) {
    const game = this.game;
    if (this.scene) { const b = get('backdrop', this.scene); if (b) b.draw(g, game, this.tick); }
    if (this.fade > 0) { g.fillStyle = `rgba(10,6,18,${this.fade})`; g.fillRect(0, 0, 320, 224); }
    const s = this.step;
    if (!s || this.closing || this.waiting) return;
    if (s.t === 'say') this.drawSay(g, s);
    else if (s.t === 'choice') {
      const top = this.choiceTop(), n = this.options.length;
      const prev = this.steps.slice(0, this.idx).reverse().find((x) => x.t === 'say');
      if (prev && !s.prompt) this.drawSay(g, prev, true);
      rect(g, UI.ink, 49, top - 14, 222, n * 13 + 18); rect(g, UI.paper, 50, top - 13, 220, n * 13 + 16);
      drawTextC(g, s.prompt || 'Choose', 160, top - 9, UI.accent2, 1, null);
      this.options.forEach((o, i) => {
        if (i === this.sel) rect(g, UI.gold, 52, top + i * 13, 216, 12);
        drawTextC(g, o.text, 160, top + 3 + i * 13, UI.ink, 1, null);
      });
    }
  }
  drawSay(g, s, still = false) {
    const game = this.game, w = game.world;
    const top = w && !this.scene && w.player && w.sy(w.player.y) > 132;
    const y = top ? 4 : 144;
    rect(g, UI.ink, 4, y, 312, 76); rect(g, '#2b1d2ef2', 5, y + 1, 310, 74); rect(g, UI.paper, 6, y + 2, 308, 1);
    let tx = 12;
    if (s.who && s.mood !== null) {
      const talking = !still && this.shown < s.text.length, m = talking && Math.floor(this.tick * 8) % 2 ? 1 : 0, bl = this.tick % 3.3 < 0.13 ? 1 : 0;
      rect(g, UI.paper, 8, y + 4, 68, 68); rect(g, '#b6dcc9', 10, y + 6, 64, 64);
      drawPortrait(g, s.who, s.mood || 'neutral', m, bl, 10, y + 6 + (talking ? Math.round(Math.sin(this.tick * 16) * 0.6) : 0));
      tx = 84;
    }
    const name = displayName(s.who);
    if (name) { const nw = name.length * CHAR_W + 8; rect(g, UI.ink, tx - 3, y - 6, nw + 2, 11); rect(g, UI.accent, tx - 2, y - 5, nw, 9); drawText(g, name, tx + 2, y - 3, UI.text, 1, null); }
    const shown = still ? s.text.length : Math.floor(this.shown);
    let left = shown;
    const maxC = Math.floor((308 - tx) / CHAR_W);
    wrap(s.text, maxC).slice(0, 7).forEach((ln, i) => { drawText(g, ln.slice(0, Math.max(0, left)), tx, y + 10 + i * 9, UI.text); left -= ln.length + 1; });
    if (!still && this.shown >= s.text.length && Math.floor(this.tick * 2) % 2) drawText(g, '>', 304, y + 64, UI.gold);
  }
}

register('scene', 'cutscene', { make: (game, steps, onDone) => new CutsceneScene(game, steps, onDone) });
