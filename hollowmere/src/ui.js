// The HUD and every panel: vitals, skills, objective, clock and light gem, detection eye,
// prompts, toasts, barks, dialogue, notes, journal, death and end screens.
import { drawPortrait } from './portraits.js';
import { ITEMS } from './items.js';
import { installPanels } from './panels.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class UI {
  constructor(game) {
    this.g = game; this.dlg = null; this.sheetOpen = false; this.invOpen = false; this.objective = null;
    this.el = {}; for (const id of ['vitals', 'hpBar', 'stBar', 'emBar', 'skills', 'sk1', 'sk2', 'sk3', 'objective', 'objText', 'objSub', 'topRight', 'clock', 'gem', 'goldText', 'detect', 'detectFill', 'prompt', 'lock', 'lockFill', 'lockText', 'toasts', 'barks', 'areaName', 'banners', 'subtitle', 'titlecard', 'tcH', 'tcP', 'dialog', 'portrait', 'dName', 'dText', 'dChoices', 'sheet', 'sheetH', 'sheetP', 'inv', 'death', 'end', 'endCard', 'cross', 'compass', 'compassCv', 'compassDist']) this.el[id] = $(id);
    this.lastKey = '';
  }
  showHud(on) { for (const id of ['vitals', 'skills', 'objective', 'topRight', 'compass']) this.el[id].hidden = !on; const sb = document.getElementById('statusbar'); if (sb) sb.hidden = !on; const mm = document.getElementById('minimap'); if (mm) mm.hidden = !on; }
  hitMarker() { const c = this.el.cross; c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }
  // a strip of compass with a diamond over the direction of the current objective
  drawCompass() {
    const g = this.g, P = g.player, cv = this.el.compassCv, x = cv.getContext('2d'); if (!x) return;
    const W = cv.width, H = cv.height; x.clearRect(0, 0, W, H); x.imageSmoothingEnabled = false;
    const yaw = P.yaw, pxPerRad = W / 3.2;
    const at = (a) => { let d = a - yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return W / 2 - d * pxPerRad; };   // + angles turn left in our basis
    x.fillStyle = '#a89cb8'; x.font = '10px monospace'; x.textAlign = 'center';
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, px = at(a); if (px < 4 || px > W - 4) continue; x.fillRect(Math.round(px), i % 4 ? 14 : 11, 1, i % 4 ? 3 : 6); if (i % 4 === 0) { x.fillStyle = i === 0 ? '#ff9a48' : '#e6dcc8'; x.fillText(['N', 'E', 'S', 'W'][i / 4], Math.round(px), 9); x.fillStyle = '#a89cb8'; } }
    const t = g.story.objectiveTarget?.();
    if (t) { const dx = t[0] - P.pos[0], dz = t[1] - P.pos[2], a = Math.atan2(dx, dz), px = Math.max(8, Math.min(W - 8, at(a))); x.fillStyle = '#e0b450'; x.beginPath(); x.moveTo(px, 3); x.lineTo(px + 5, 9); x.lineTo(px, 15); x.lineTo(px - 5, 9); x.fill(); x.fillStyle = '#000'; x.fillRect(px - 1, 8, 2, 2); this.el.compassDist.textContent = Math.round(Math.hypot(dx, dz)) + ' m'; } else this.el.compassDist.textContent = '';
  }
  // ------------------------------------------------------------ transient text
  toast(t) { const d = document.createElement('div'); d.className = 'toast px'; d.textContent = t; this.el.toasts.append(d); setTimeout(() => d.remove(), 3400); while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove(); }
  bark(name, text, npc) {
    const d = document.createElement('div'); d.className = 'bark px' + (npc?.guard ? ' guard' : ''); d.innerHTML = `<b>${esc(name)}</b>${esc(text)}`;
    this.el.barks.append(d); setTimeout(() => d.remove(), 3600); while (this.el.barks.children.length > 3) this.el.barks.firstChild.remove();
  }
  flashBanner(text, ms = 2600, small = false) { const d = document.createElement('div'); d.className = 'hud banner' + (small ? ' small' : ''); d.textContent = text; d.style.animationDuration = ms + 'ms'; this.el.banners.append(d); setTimeout(() => d.remove(), ms); }
  area(name) { const a = this.el.areaName; a.hidden = false; a.textContent = name; a.style.animation = 'none'; void a.offsetWidth; a.style.animation = ''; this.g.areaName = name; clearTimeout(this._at); this._at = setTimeout(() => (a.hidden = true), 3400); }
  setPrompt(text, kind) {
    const p = this.el.prompt, cr = this.el.cross;
    if (!text) { p.hidden = true; cr.classList.remove('use'); return; }
    if (this._prompt !== text) { this._prompt = text; p.innerHTML = `<span class="kbd">${kind === 'backstab' ? 'LMB' : 'E'}</span>${esc(text)}`; }
    p.hidden = false; cr.classList.add('use');
  }
  setObjective(title, text, sub = '') { this.objective = { title, text, sub }; this.el.objText.textContent = text; this.el.objSub.textContent = sub; const h = this.el.objective.querySelector('h4'); h.textContent = title; this.el.objective.style.animation = 'none'; void this.el.objective.offsetWidth; }
  showDeath() { this.el.death.hidden = false; }
  hideDeath() { this.el.death.hidden = true; }
  letterbox(on) { document.body.classList.toggle('cut', on); }
  subtitle(name, text) { const s = this.el.subtitle; if (!text) { s.hidden = true; return; } s.hidden = false; s.innerHTML = `${name ? `<b>${esc(name)}</b>` : ''}<span>${esc(text)}</span>`; }
  titleCard(h, p) { const t = this.el.titlecard; if (!h) { t.hidden = true; return; } t.hidden = false; this.el.tcH.textContent = h; this.el.tcP.textContent = p || ''; }

  // ------------------------------------------------------------ dialogue
  // lines: [{ who?, text, mood?, choices?: [{ text, next }] }]; onDone called when closed
  dialogue({ npc, lines, onDone, name = null, spec = null }) {
    this.dlg = { npc, lines, i: 0, onDone, name, spec: spec || npc?.spec, typed: 0, t: 0, full: false };
    this.g.mode = this.g.mode === 'play' ? 'talk' : this.g.mode;
    this.el.dialog.hidden = false; this.showLine();
    if (document.pointerLockElement) document.exitPointerLock?.();
  }
  showLine() {
    const D = this.dlg, L = D.lines[D.i]; if (!L) return this.closeDialogue();
    D.line = L; D.typed = 0; D.full = false; D.t = 0;
    const who = L.who || D.name || D.npc?.name || '';
    this.el.dName.textContent = who; drawPortrait(this.el.portrait, L.spec || D.spec || { outfit: 'peasant' }, L.mood || 'calm');
    this.el.dText.textContent = ''; this.el.dChoices.innerHTML = '';
    if (L.onShow) L.onShow(this.g);
  }
  advanceDialogue() {
    const D = this.dlg; if (!D) return;
    if (!D.full) { D.typed = D.line.text.length; D.full = true; this.el.dText.textContent = D.line.text; this.showChoices(); return; }
    if (D.line.choices) return;
    if (D.line.end) return this.closeDialogue();
    D.i = D.line.goto !== undefined ? D.line.goto : D.i + 1;
    this.showLine();
  }
  showChoices() {
    const D = this.dlg, L = D.line; if (!L.choices) return;
    this.el.dChoices.innerHTML = '';
    L.choices.forEach((c, k) => { const b = document.createElement('button'); b.textContent = `${k + 1}. ${c.text}`; b.onclick = (e) => { e.stopPropagation(); this.choose(k); }; this.el.dChoices.append(b); });
  }
  choose(k) {
    const D = this.dlg, c = D.line.choices?.[k]; if (!c) return;
    if (c.action) c.action(this.g);
    if (c.next === 'end' || c.next === undefined) return this.closeDialogue();
    D.i = c.next; this.showLine();
  }
  closeDialogue() {
    const D = this.dlg; this.dlg = null; this.el.dialog.hidden = true;
    if (this.g.mode === 'talk') this.g.mode = 'play';
    D?.onDone?.(); this.g.canvasLock?.();
  }
  // ------------------------------------------------------------ notes, journal
  note(title, text, onClose) { this.sheetOpen = true; this._noteClose = onClose; this.el.sheetH.textContent = title; this.el.sheetP.textContent = text; this.el.sheet.hidden = false; this.g.mode = this.g.mode === 'play' ? 'read' : this.g.mode; document.exitPointerLock?.(); }
  closeNote() { if (!this.sheetOpen) return; this.sheetOpen = false; this.el.sheet.hidden = true; if (this.g.mode === 'read') this.g.mode = 'play'; this._noteClose?.(); this._noteClose = null; this.g.canvasLock?.(); }
  toggleJournal() {
    if (this.invOpen) { this.invOpen = false; this.el.inv.hidden = true; if (this.g.mode === 'journal') this.g.mode = 'play'; this.g.canvasLock?.(); return; }
    if (this.g.mode !== 'play') return;
    this.invOpen = true; this.g.mode = 'journal'; document.exitPointerLock?.();
    const P = this.g.player, inv = P.inv, S = this.g.story;
    const items = inv.list().filter((i) => i.kind !== 'key' || true);
    const keys = items.filter((i) => i.kind === 'key'), other = items.filter((i) => i.kind !== 'key');
    const li = (i) => `<li><span>${esc(i.name || i.id)}${i.n > 1 ? ' ×' + i.n : ''}</span><span>${esc(i.desc || (i.value ? i.value + ' gp' : ''))}</span></li>`;
    const st = this.g.stats;
    this.el.inv.innerHTML = `<h2>JOURNAL</h2>
      <div><h4>Objectives</h4><ul>${S.objectives.map((o) => `<li class="${o.done ? 'done' : ''}"><span>${esc(o.text)}</span><span>${o.done ? 'done' : ''}</span></li>`).join('')}</ul>
      <h4>Notes found</h4><ul>${[...S.notesFound].map((id) => `<li><span>${esc(S.notes[id].title)}</span></li>`).join('') || '<li><span>None yet</span></li>'}</ul></div>
      <div><h4>Purse</h4><ul><li><span>Gold</span><span>${inv.gold}</span></li><li><span>Loot value</span><span>${inv.lootValue}</span></li></ul>
      <h4>Carried</h4><ul>${other.map(li).join('') || '<li><span>Nothing</span></li>'}</ul>
      <h4>Keys</h4><ul>${keys.map(li).join('') || '<li><span>None</span></li>'}</ul>
      <h4>Deeds</h4><ul><li><span>Guards slain</span><span>${st.guardKills}</span></li><li><span>Silent kills</span><span>${st.stabs}</span></li><li><span>Torches snuffed</span><span>${st.snuffed}</span></li></ul></div>`;
    this.el.inv.hidden = false;
  }
  floater(text, pos, color = '#ffe9a8') {
    const g = this.g, cam = g.camera, f = g.player.forward, e = cam.position;
    const dx = pos[0] - e[0], dy = pos[1] - e[1], dz = pos[2] - e[2]; if (dx * f[0] + dy * f[1] + dz * f[2] < 0.3) return;
    const p = cam.project(pos), d = document.createElement('div'); d.className = 'floater'; d.textContent = text; d.style.color = color;
    d.style.left = ((p[0] * 0.5 + 0.5) * innerWidth) + 'px'; d.style.top = ((0.5 - p[1] * 0.5) * innerHeight) + 'px'; document.body.append(d); setTimeout(() => d.remove(), 900);
  }
  drawTarget() {
    const g = this.g, P = g.player, el = document.getElementById('tbar'); if (!el) return;
    let best = null, bd = 1e9; const f = P.forward, e = P.eyePos;
    if (g.mode === 'play') for (const n of g.npcs) { if (n.dead || n.dist > 16 || n.hp >= n.maxHp - 0.5 || !n.visible) continue; const dx = n.x - e[0], dz = n.z - e[2], d = Math.hypot(dx, dz), c = (dx * f[0] + dz * f[2]) / (d || 1); if (c > 0.96 && d < bd) { bd = d; best = n; } }
    if (!best) { el.hidden = true; return; }
    el.hidden = false; el.firstElementChild.textContent = best.name; el.lastElementChild.firstElementChild.style.width = Math.max(0, best.hp / best.maxHp * 100) + '%';
  }
  drawStatus() {
    this.drawTarget();
    const g = this.g, P = g.player, sb = document.getElementById('statusbar'); if (!sb) return;
    const pills = [], T = g.tools, R = g.rep, pr = g.progress;
    const b = Math.max(R.total('watch'), R.total('keep')); if (b > 0) pills.push([`${b >= 60 ? 'WANTED' : 'Suspect'} · ${Math.ceil(b)}g`, 'bad']);
    if (R.total('bandits') > 0) pills.push(['Bandit grudge', 'bad']);
    if (R.disguise) pills.push(['Disguised: ' + R.disguise.label + ' (U)', 'good']);
    if (T.poisonHits > 0) pills.push(['Poisoned blade ×' + T.poisonHits, 'good']);
    if (T.sap) pills.push(['Sap drawn (B)', 'warm']);
    if (T.sightT > 0) pills.push(['Wraith Sight ' + Math.ceil(T.sightT) + 's', 'good']);
    if (T.dragging) pills.push(['Dragging body', 'warm']);
    const inv = P.inv, q = [['G', 'knife', 'Knives'], ['V', 'gold', 'Coin'], ['X', 'firebomb', 'Flasks'], ['5', 'poison', 'Oil']].map(([k, id, n]) => [k, n, inv.count(id)]).filter((x) => x[2] > 0).map((x) => `${x[0]}·${x[1]} ${x[2]}`).join('  ');
    if (q) pills.push([q, '']);
    if (g.weather && g.weather.label && g.weather.kind !== 'clear') pills.push([g.weather.label, '']);
    { const nz = P.noiseNow || 0; pills.push([`Noise ${nz < 2 ? '▮▯▯ quiet' : nz < 8 ? '▮▮▯ normal' : '▮▮▮ loud'}`, nz < 2 ? 'good' : nz < 8 ? '' : 'bad']); }
    if (g.lantern?.on) pills.push(['Lantern lit (L)', 'warm']); if (P.exhausted) pills.push(['Exhausted', 'bad']);
    for (const [id, t] of g.status.fx) pills.push([`${id} ${Math.ceil(t)}s`, 'good']);
    const xpw = Math.round(pr.xp / pr.need() * 100), key = pills.map((p) => p.join('|')).join('~') + '#' + pr.level + '/' + xpw + '/' + pr.points;
    if (key !== this._sbKey) { this._sbKey = key; sb.innerHTML = pills.map(([t, c]) => `<div class="pill ${c}">${esc(t)}</div>`).join('') + `<div class="pill">Lv ${pr.level}${pr.points ? ' · ' + pr.points + ' perk pt (P)' : ''}</div><div class="xp"><i style="width:${xpw}%"></i></div>`; }
  }
  // ------------------------------------------------------------ end screen
  showEnd(html) { this.el.endCard.innerHTML = html; this.el.end.hidden = false; document.exitPointerLock?.(); }

  // ------------------------------------------------------------ per frame
  update(dt) {
    const g = this.g, P = g.player; if (!P) return;
    if (this.dlg) { const D = this.dlg; D.t += dt; if (!D.full) { const n = Math.min(D.line.text.length, Math.floor(D.t * 55)); if (n !== D.typed) { D.typed = n; this.el.dText.textContent = D.line.text.slice(0, n); if (n % 3 === 0) g.sfx.blip?.(D.npc?.spec?.voice || D.line.pitch || 1); } if (n >= D.line.text.length) { D.full = true; this.showChoices(); } } }
    if (g.mode === 'cutscene' || g.mode === 'menu' || g.mode === 'boot') return;
    const E = this.el;
    E.hpBar.firstElementChild.style.width = (P.hp / P.maxHp * 100) + '%'; E.hpBar.lastElementChild.textContent = Math.ceil(P.hp);
    E.stBar.firstElementChild.style.width = P.stamina + '%';
    E.emBar.firstElementChild.style.width = (P.ember / P.maxEmber * 100) + '%'; E.emBar.lastElementChild.textContent = Math.floor(P.ember);
    const cd = (id, cool, max, cost) => { const s = E[id]; s.querySelector('.cd').style.height = (cool > 0 ? cool / max * 100 : 0) + '%'; s.classList.toggle('off', P.ember < cost); };
    cd('sk1', P.cool.veil, 12, 30); cd('sk2', P.cool.dash, 2.5, 22); cd('sk3', P.cool.slam, 9, 40);
    E.sk1.style.outline = P.veilT > 0 ? '2px solid #a56cff' : '';
    const key = `${g.clock.text()}|${P.inv.gold}`;
    if (key !== this.lastKey) { this.lastKey = key; E.clock.innerHTML = `${g.clock.text()}<small>${g.clock.phase()}</small>`; E.goldText.textContent = `${P.inv.gold} gold`; }
    E.gem.style.width = Math.round(Math.min(1, P.lightLevel) * 100) + '%';
    // detection eye
    const a = g.maxAlert(), chasing = g.npcs.some((n) => n.guard && !n.dead && (n.state === 'chase' || n.state === 'attack') && n.dist < 50);
    E.detect.classList.toggle('on', a > 0.05 || chasing); E.detect.classList.toggle('alert', chasing);
    E.detectFill.style.width = (chasing ? 100 : Math.min(100, a * 140)) + '%';
    // lockpicking
    const pk = P.picking; E.lock.hidden = !pk; if (pk) { E.lockFill.style.width = (pk.t / pk.need * 100) + '%'; E.lockText.textContent = pk.label; }
    // objective sidebar refresh
    const O = g.story.currentObjective(); if (O && (!this.objective || this.objective.text !== O.text)) this.setObjective('Objective', O.text, O.sub || '');
    E.cross.style.display = (g.mode === 'play') ? '' : 'none';
    this.drawStatus();
    this.drawCompass();
  }
}
installPanels(UI);
