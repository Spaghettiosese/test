// The journal book: Journal, Perks, Craft, Map and Lore tabs. Replaces the first demo's plain
// inventory list. Tab opens it, M and P jump to the map and perks, numbers switch tabs.
import { PERKS } from './progress.js';
import { RECIPES } from './tools.js';
import { ITEMS } from './items.js';
import { QUESTS } from './quests.js';
import { LORE } from './lore.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const TABS = [['journal', 'Journal'], ['perks', 'Perks'], ['craft', 'Craft'], ['map', 'Map'], ['lore', 'Lore']];

export function installPanels(UI) {
  const P = UI.prototype;
  P.toggleJournal = function toggleJournal(tab = 'journal') {
    if (this.invOpen) {
      if (this.tab !== tab && tab !== 'journal') { this.tab = tab; this.renderBook(); return; }
      this.invOpen = false; document.body.classList.remove('book'); this.el.inv.hidden = true; if (this.g.mode === 'journal') this.g.mode = 'play'; this.g.canvasLock?.(); return;
    }
    if (this.g.mode !== 'play') return;
    this.invOpen = true; this.tab = tab; this.g.mode = 'journal'; document.exitPointerLock?.();
    if (!this._bookBound) { this._bookBound = true; this.el.inv.addEventListener('click', (e) => this.bookClick(e)); }
    this.renderBook();
  };
  P.setTab = function setTab(i) { if (!this.invOpen) return; const t = TABS[i]; if (t) { this.tab = t[0]; this.renderBook(); } };
  P.bookClick = function bookClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return; const g = this.g, [act, arg] = b.dataset.act.split(':');
    if (act === 'tab') { this.tab = arg; this.renderBook(); }
    else if (act === 'perk') { g.progress.buy(arg); this.renderBook(); }
    else if (act === 'craft') { g.tools.craft(arg); this.renderBook(); }
    else if (act === 'use') { g.useItem(arg); this.renderBook(); }
    else if (act === 'lore') { this.loreOpen = arg; this.renderBook(); }
  };
  P.renderBook = function renderBook() {
    const g = this.g, P = g.player, inv = P.inv, S = g.story, pr = g.progress, tab = this.tab;
    const head = `<div class="tabs">${TABS.map(([id, n], i) => `<button data-act="tab:${id}" class="${id === tab ? 'on' : ''}"><kbd>${i + 1}</kbd>${n}</button>`).join('')}<span class="pts">Lv ${pr.level} · ${pr.xp}/${pr.need()} xp${pr.points ? ` · <b>${pr.points} perk point${pr.points > 1 ? 's' : ''}</b>` : ''}</span></div>`;
    let body = '';
    if (tab === 'journal') {
      const items = inv.list(), keys = items.filter((i) => i.kind === 'key'), other = items.filter((i) => i.kind !== 'key');
      const li = (i) => `<li><span>${esc(i.name || i.id)}${i.n > 1 ? ' ×' + i.n : ''}</span><span>${i.heal || i.ember || i.id === 'poison' || i.id === 'firebomb' ? `<button data-act="use:${i.id}" class="mini">use</button>` : esc(i.desc || (i.value ? i.value + ' gp' : ''))}</span></li>`;
      const main = S.objectives.filter((o) => !o.side), side = S.objectives.filter((o) => o.side);
      const st = g.stats, R = g.rep;
      body = `<div class="cols"><div><h4>The Job</h4><ul>${main.map((o) => `<li class="${o.done ? 'done' : ''}"><span>${esc(o.text)}</span><span>${o.done ? 'done' : ''}</span></li>`).join('')}</ul>
        <h4>Side tasks</h4><ul>${side.map((o) => `<li class="${o.done ? 'done' : ''}"><span>${esc(o.text)}</span><span>${o.done ? 'done' : ''}</span></li>`).join('') || '<li><span>None yet. Talk to people.</span></li>'}</ul>
        <h4>Standing</h4><ul><li><span>Town Watch bounty</span><span>${Math.ceil(R.total('watch'))} g</span></li><li><span>Keep bounty</span><span>${Math.ceil(R.total('keep'))} g</span></li><li><span>Bandit grudge</span><span>${Math.ceil(R.total('bandits'))}</span></li><li><span>Waystones attuned</span><span>${g.quests.lit.size}/4</span></li></ul></div>
        <div><h4>Purse</h4><ul><li><span>Gold</span><span>${inv.gold}</span></li><li><span>Loot value</span><span>${inv.lootValue}</span></li></ul>
        <h4>Carried</h4><ul>${other.map(li).join('') || '<li><span>Nothing</span></li>'}</ul><h4>Keys</h4><ul>${keys.map(li).join('') || '<li><span>None</span></li>'}</ul>
        <h4>Deeds</h4><ul><li><span>Guards slain</span><span>${st.guardKills}</span></li><li><span>Silent kills</span><span>${st.stabs}</span></li><li><span>Torches snuffed</span><span>${st.snuffed}</span></li><li><span>Lore found</span><span>${[...S.notesFound].filter((x) => x.startsWith('l_')).length}/${LORE.length}</span></li></ul></div></div>`;
    } else if (tab === 'perks') {
      const trees = [...new Set(PERKS.map((p) => p.tree))];
      body = `<p class="sub">You have <b>${pr.points}</b> perk point${pr.points === 1 ? '' : 's'}. Levels come from kills (silent ones pay more), quests, discoveries, lore and crafting.</p><div class="cols3">${trees.map((t) => `<div><h4>${t}</h4>${PERKS.filter((p) => p.tree === t).map((p) => `<div class="perk"><div><b>${p.name}</b> <span class="pips">${'●'.repeat(pr.rank(p.id))}${'○'.repeat(p.max - pr.rank(p.id))}</span></div><small>${p.desc}</small><button data-act="perk:${p.id}" ${pr.points < 1 || pr.rank(p.id) >= p.max ? 'disabled' : ''} class="mini">${pr.rank(p.id) >= p.max ? 'max' : 'learn'}</button></div>`).join('')}</div>`).join('')}</div>`;
    } else if (tab === 'craft') {
      body = `<p class="sub">Craft from what you carry. Sap and poison are new ways to end a night quietly.</p><div class="recipes">${RECIPES.map((r) => { const can = g.tools.canCraft(r); return `<div class="perk"><div><b>${r.name}</b> → ${r.makes[1]}× ${esc(ITEMS[r.makes[0]].name)}</div><small>${r.desc}<br>Needs: ${r.needs.filter((n) => n[1]).map(([id, n]) => `${n}× ${id === 'gold' ? 'gold' : esc(ITEMS[id]?.name || id)} (${id === 'gold' ? inv.gold : inv.count(id)})`).join(', ')}</small><button data-act="craft:${r.id}" ${can ? '' : 'disabled'} class="mini">craft</button></div>`; }).join('')}</div>`;
    } else if (tab === 'map') {
      body = `<canvas id="bookMap" width="720" height="470"></canvas><div class="sub">◆ gold: current goal · ◆ violet: waystones · the arrow is you. North is up.</div>`;
    } else if (tab === 'lore') {
      const found = LORE.filter((l) => S.notesFound.has(l.id)), open = LORE.find((l) => l.id === this.loreOpen && S.notesFound.has(l.id));
      body = `<div class="cols"><div><h4>Writings found (${found.length}/${LORE.length})</h4><ul>${found.map((l) => `<li><button class="link" data-act="lore:${l.id}">${esc(l.title)}</button></li>`).join('') || '<li><span>Nothing yet. Read what you find.</span></li>'}</ul></div><div>${open ? `<h4>${esc(open.title)}</h4><p class="lore">${esc(open.text)}</p>` : '<p class="sub">Choose a writing to read again.</p>'}</div></div>`;
    }
    document.body.classList.add('book');
    this.el.inv.innerHTML = head + `<div class="bookbody">${body}</div><div class="hint">Tab / Esc to close · 1-5 tabs · M map · P perks</div>`;
    this.el.inv.hidden = false;
  };
  const upd = P.update;
  P.update = function update(dt) { upd.call(this, dt); if (this.invOpen && this.tab === 'map' && this.g.wmap) { const c = document.getElementById('bookMap'); if (c) this.g.wmap.drawFull(c); } const mm = document.getElementById('minimap'); if (mm && this.g.wmap && this.g.mode !== 'cutscene') { this._mmT = (this._mmT || 0) - dt; if (this._mmT <= 0) { this._mmT = 0.12; this.g.wmap.drawMini(mm); } } this.g.wmap?.drawSight(document.getElementById('sightCv')); };
}
