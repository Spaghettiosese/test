// The title and pause menus: continue, a new game in one of three slots (or New Game+), loading
// and saving slots, chapter select, trophies, options, controls and credits. Everything that
// needs a fresh world (loading mid-game, quitting to the title) goes through a page reload with
// a note in sessionStorage saying what to do once the world is built.
import { CHAPTERS } from './campaign.js';
import { TROPHIES } from './achievements.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DIFF = ['Merciful', 'Grim', 'Hollow'];
const hm = (s) => { const m = Math.round((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`; };
const when = (t) => { if (!t) return ''; const d = new Date(t); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); };
const chName = (id) => { const c = CHAPTERS.find((x) => x.id === id); return c ? `Chapter ${c.n} · ${c.title}` : 'Chapter I'; };

export class Menu {
  constructor(g, hooks) {
    this.g = g; this.hooks = hooks; this.el = $('menu'); this.main = $('menuMain'); this.panelEl = $('menuPanel'); this.blurb = this.el.querySelector('.blurb');
    this.sel = { slot: null, diff: g.difficulty ?? 1, ng: false, chapter: null }; this.confirm = null;
  }
  // ------------------------------------------------------------ the button column
  button(label, fn, cls = '') { const b = document.createElement('button'); b.className = cls; b.innerHTML = label; b.onclick = (e) => { e.stopPropagation(); this.g.sfx.unlock(); this.g.sfx.pick?.(); fn(); }; return b; }
  showTitle() {
    const g = this.g; this.el.querySelector('.card').classList.remove('inpanel'); this.mode = 'title'; this.el.hidden = false; this.panelEl.hidden = true; this.main.hidden = false; this.main.innerHTML = '';
    this.blurb.textContent = 'Ravenspire keep stands above the walled town of Ashgate. In its Duke\'s bedchamber lies a letter sealed in black wax. The Gray Hand wants it. You are the Gray Hand\'s knife.';
    const inf = g.saves.info();
    if (inf) this.main.append(this.button(`Continue<small>${esc(chName(inf.chapter))} · Lv ${inf.level} · slot ${inf.slot}</small>`, () => this.hooks.load(inf.slot), 'go'));
    this.main.append(this.button('New Game', () => this.panel('new'), inf ? '' : 'go'));
    if (g.saves.has()) this.main.append(this.button('Load Game', () => this.panel('load')));
    this.main.append(this.button('Chapters', () => this.panel('chapters')), this.button(`Trophies<small>${g.achievements.count()} / ${TROPHIES.length}</small>`, () => this.panel('trophies')),
      this.button('Options', () => this.panel('options')), this.button('Controls', () => this.panel('keys')), this.button('Credits', () => this.panel('credits')));
  }
  showPause() {
    const g = this.g; this.el.querySelector('.card').classList.remove('inpanel'); this.mode = 'pause'; this.el.hidden = false; this.panelEl.hidden = true; this.main.hidden = false; this.main.innerHTML = '';
    const ch = g.campaign.def(); this.blurb.textContent = `Chapter ${ch.n} · ${ch.title}. The night waits. Ravenspire waits longer.`;
    this.main.append(this.button('Resume', () => this.hooks.resume(), 'go'), this.button('Save Game', () => this.panel('save')), this.button('Load Game', () => this.panel('load')),
      this.button('Journal', () => { this.hooks.resume(); setTimeout(() => g.ui.toggleJournal(), 30); }), this.button(`Trophies<small>${g.achievements.count()} / ${TROPHIES.length}</small>`, () => this.panel('trophies')),
      this.button('Options', () => this.panel('options')), this.button('Controls', () => this.panel('keys')),
      this.button('Quit to Title', () => { if (this.confirm !== 'quit') { this.confirm = 'quit'; this.g.ui.toast('Unsaved progress since the last save will be lost. Click again to quit.'); return; } this.hooks.quit(); }));
  }
  back() { this.confirm = null; this.el.querySelector('.card').classList.remove('inpanel'); if (this.mode === 'pause') this.showPause(); else this.showTitle(); }
  // ------------------------------------------------------------ panels
  panel(name) {
    const g = this.g, P = this.panelEl; this.main.hidden = true; P.hidden = false; this.el.querySelector('.card').classList.add('inpanel'); P.innerHTML = ''; this.confirm = null; this.cur = name;
    const h = (t) => { const e = document.createElement('h3'); e.textContent = t; P.append(e); };
    const back = () => { const b = this.button('Back', () => this.back(), 'back'); P.append(b); };
    if (name === 'new') {
      h(this.sel.chapter ? `Begin at ${chName(this.sel.chapter)}` : 'New Game');
      const d = document.createElement('div'); d.className = 'seg';
      DIFF.forEach((n, i) => d.append(this.button(n, () => { this.sel.diff = i; this.panel('new'); }, this.sel.diff === i ? 'on' : '')));
      P.append(this.note(['Merciful: guards hit softer and notice slower. Grim: the intended game. Hollow: everything hurts and everyone is awake.'][0]), d);
      this.slotPicker(P, 'Choose a slot');
      if (g.profile.d.carry && !this.sel.chapter) { const b = this.button(`${this.sel.ng ? '☑' : '☐'} New Game+ <small>carry your level, perks, gear and blade; everything hits harder</small>`, () => { this.sel.ng = !this.sel.ng; this.panel('new'); }, 'wide'); P.append(b); }
      P.append(this.button(this.sel.chapter ? 'Begin the chapter' : 'Begin the job', () => this.begin(), 'go'));
      back(); return;
    }
    if (name === 'load' || name === 'save') {
      h(name === 'load' ? 'Load Game' : 'Save Game');
      for (const { slot, info } of g.saves.list()) {
        const row = document.createElement('div'); row.className = 'slot' + (info ? '' : ' empty');
        row.innerHTML = `<div><b>Slot ${slot}</b>${info ? `<span>${esc(chName(info.chapter))}${info.ng ? ' · NG+' + (info.ng > 1 ? info.ng : '') : ''}</span><small>Level ${info.level} · ${esc(info.area || '')} · Day ${(info.day || 0) + 1}, ${String(Math.floor(info.hours)).padStart(2, '0')}:00 · played ${hm(info.play)} · ${when(info.t)}</small>` : '<span>Empty</span>'}</div>`;
        const btns = document.createElement('div'); btns.className = 'slotbtns';
        if (name === 'load' && info) btns.append(this.button('Load', () => this.hooks.load(slot)), this.button('Delete', () => { if (this.confirm !== 'del' + slot) { this.confirm = 'del' + slot; this.g.ui.toast(`Click Delete again to erase slot ${slot}`); return; } g.saves.remove(slot); this.panel('load'); }));
        if (name === 'save') btns.append(this.button(info ? 'Overwrite' : 'Save here', () => { if (info && this.confirm !== 'ow' + slot && slot !== g.saves.slot) { this.confirm = 'ow' + slot; this.g.ui.toast(`Click again to overwrite slot ${slot}`); return; } g.saves.save('manual', slot); this.panel('save'); }));
        row.append(btns); P.append(row);
      }
      back(); return;
    }
    if (name === 'chapters') {
      h('Chapters');
      for (const c of CHAPTERS) {
        const open = g.profile.chapterOpen(c.id), row = document.createElement('div'); row.className = 'slot' + (open ? '' : ' empty');
        row.innerHTML = `<div><b>Chapter ${c.n}</b><span>${open ? esc(c.title) : '???'}</span><small>${open ? esc(c.blurb) : 'Reach this chapter in the story to unlock it.'}</small></div>`;
        const btns = document.createElement('div'); btns.className = 'slotbtns';
        if (open && this.mode === 'title') btns.append(this.button('Play', () => { this.sel.chapter = c.id; this.sel.ng = false; this.panel('new'); }));
        row.append(btns); P.append(row);
      }
      if (this.mode === 'pause') P.append(this.note('Return to the title to start a chapter.'));
      back(); return;
    }
    if (name === 'trophies') {
      h(`Trophies · ${g.achievements.count()} / ${TROPHIES.length}`);
      const grid = document.createElement('div'); grid.className = 'trophies';
      for (const T of TROPHIES) { const has = g.profile.has(T.id), d = document.createElement('div'); d.className = 'tro' + (has ? ' on' : ''); d.innerHTML = `<b>${esc(T.name)}</b><small>${esc(T.desc)}</small>`; grid.append(d); }
      P.append(grid); back(); return;
    }
    if (name === 'options') {
      h('Options'); const base = $('optsBase'); base.hidden = false; P.append(base); const op = document.createElement('div'); op.className = 'opts'; g.opts.build(op); P.append(op); back(); return;
    }
    if (name === 'keys') { h('Controls'); const k = $('keyList').cloneNode(true); k.hidden = false; k.removeAttribute('id'); P.append(k); back(); return; }
    if (name === 'credits') {
      h('Credits');
      P.append(this.note('HOLLOWMERE: THE THIRTEENTH BELL\n\nA dark-fantasy stealth game in four chapters, built on the ShapeForge Engine V5.\n\nEvery model, animation, texture, portrait, sound and note of music is made in code while the game loads: there are no image or audio files.\n\nType: Pixelify Sans, Silkscreen and VT323, from Google Fonts.\n\nThank you for playing. Mind the bell.', true));
      back(); return;
    }
  }
  note(t, pre = false) { const p = document.createElement('p'); p.className = 'mnote' + (pre ? ' pre' : ''); p.textContent = t; return p; }
  slotPicker(P, title) {
    const g = this.g; if (this.sel.slot === null || !g.saves.list().some((s) => s.slot === this.sel.slot)) this.sel.slot = g.saves.firstEmpty() ?? g.saves.latest() ?? 1;
    const sub = document.createElement('h4'); sub.textContent = title; P.append(sub);
    for (const { slot, info } of g.saves.list()) {
      const row = this.button(`<b>Slot ${slot}</b> ${info ? `<span>${esc(chName(info.chapter))} · Lv ${info.level} · played ${hm(info.play)}</span><small>this slot will be overwritten</small>` : '<span>Empty</span>'}`, () => { this.sel.slot = slot; this.panel(this.cur); }, 'slotpick' + (this.sel.slot === slot ? ' on' : ''));
      P.append(row);
    }
  }
  begin() {
    const g = this.g; g.difficulty = this.sel.diff; g.saves.saveSettings({ diff: g.difficulty }); g.saves.slot = this.sel.slot || 1;
    this.el.hidden = true; const ch = this.sel.chapter; this.sel.chapter = null;
    this.hooks.newGame({ chapter: ch, ng: this.sel.ng });
  }
}
