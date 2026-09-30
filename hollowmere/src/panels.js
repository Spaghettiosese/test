// The journal book: Journal, Perks, Craft, Map and Lore tabs. Replaces the first demo's plain
// inventory list. Tab opens it, M and P jump to the map and perks, numbers switch tabs.
import { PERKS } from './progress.js';
import { RECIPES } from './tools.js';
import { ITEMS } from './items.js';
import { QUESTS } from './quests.js';
import { LORE } from './lore.js';
import { GEAR, SLOTS } from './gear.js';
import { CODEX, DEEDS } from './codex.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const TABS = [['journal', 'Journal'], ['perks', 'Perks'], ['craft', 'Craft'], ['map', 'Map'], ['lore', 'Lore'], ['gear', 'Gear'], ['deeds', 'Deeds'], ['stealth', 'Stealth']];

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
    else if (act === 'equip') { g.gear.equip(arg); this.renderBook(); }
    else if (act === 'unequip') { g.gear.unequip(arg); this.renderBook(); }
    else if (act === 'use') { g.useItem(arg); this.renderBook(); }
    else if (act === 'lore') { this.loreOpen = arg; this.renderBook(); }
  };
  P.renderBook = function renderBook() {
    const g = this.g, P = g.player, inv = P.inv, S = g.story, pr = g.progress, tab = this.tab;
    const head = `<div class="tabs">${TABS.map(([id, n], i) => `<button data-act="tab:${id}" class="${id === tab ? 'on' : ''}"><kbd>${i + 1}</kbd>${n}</button>`).join('')}<span class="pts">Lv ${pr.level} · ${pr.xp}/${pr.need()} xp${pr.points ? ` · <b>${pr.points} perk point${pr.points > 1 ? 's' : ''}</b>` : ''}</span></div>`;
    let body = '';
    if (tab === 'journal') {
      const items = inv.list(), keys = items.filter((i) => i.kind === 'key'), other = items.filter((i) => i.kind !== 'key');
      const li = (i) => `<li><span>${esc(i.name || i.id)}${i.n > 1 ? ' ×' + i.n : ''}</span><span>${i.heal || i.ember || i.id === 'poison' || i.id === 'firebomb' || i.id === 'book' ? `<button data-act="use:${i.id}" class="mini">use</button>` : esc(i.desc || (i.value ? i.value + ' gp' : ''))}</span></li>`;
      const main = S.objectives.filter((o) => !o.side), side = S.objectives.filter((o) => o.side);
      const st = g.stats, R = g.rep;
      body = `<div class="cols"><div><h4>The Job</h4><ul>${main.map((o) => `<li class="${o.done ? 'done' : ''}"><span>${esc(o.text)}</span><span>${o.done ? 'done' : ''}</span></li>`).join('')}</ul>
        <h4>Side tasks</h4><ul>${side.map((o) => `<li class="${o.done ? 'done' : ''}"><span>${esc(o.text)}</span><span>${o.done ? 'done' : ''}</span></li>`).join('') || '<li><span>None yet. Talk to people.</span></li>'}</ul>
        <h4>Standing</h4><ul><li><span>Town Watch bounty</span><span>${Math.ceil(R.total('watch'))} g</span></li><li><span>Keep bounty</span><span>${Math.ceil(R.total('keep'))} g</span></li><li><span>Bandit grudge</span><span>${Math.ceil(R.total('bandits'))}</span></li><li><span>Waystones attuned</span><span>${g.quests.lit.size}/4</span></li></ul></div>
        <div><h4>Purse</h4><ul><li><span>Gold</span><span>${inv.gold}</span></li><li><span>Loot value</span><span>${inv.lootValue}</span></li></ul>
        <h4>Carried</h4><ul>${other.map(li).join('') || '<li><span>Nothing</span></li>'}</ul><h4>Keys</h4><ul>${keys.map(li).join('') || '<li><span>None</span></li>'}</ul>
        <h4>Deeds</h4><ul><li><span>Guards slain</span><span>${st.guardKills}</span></li><li><span>Silent kills</span><span>${st.stabs}</span></li><li><span>Torches snuffed</span><span>${st.snuffed}</span></li><li><span>Lore found</span><span>${[...S.notesFound].filter((x) => x.startsWith('l_')).length}/${LORE.length}</span></li><li><span>Fish caught</span><span>${st.fish || 0}</span></li><li><span>Ore mined</span><span>${st.mined || 0}</span></li><li><span>Blade level</span><span>${g.smith.level}/5</span></li><li><span>Arrests · escapes</span><span>${st.arrests || 0} · ${st.escapes || 0}</span></li></ul></div></div>`;
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
    if (tab === 'gear') {
      const eq = g.gear.eq, m = P.mod, mods = [['Armor', Math.round((m.armor + g.status.sum('armor')) * 100) + '%'], ['Noise', Math.round(m.quiet * g.status.mul('quiet') * 100) + '%'], ['Visibility', Math.round(m.vis * 100) + '%'], ['Damage', Math.round(m.dmg * 100) + '%'], ['Max Ember', P.maxEmber], ['Max Health', P.maxHp]];
      const owned = Object.keys(GEAR).filter((id) => inv.has(id));
      body = `<div class="cols"><div><h4>Worn</h4><ul>${SLOTS.map(([s, n]) => `<li><span>${n}: ${eq[s] ? esc(GEAR[eq[s]].name) : '<i>empty</i>'}</span><span>${eq[s] ? `<button class="mini" data-act="unequip:${s}">remove</button>` : ''}</span></li>`).join('')}</ul>
        <h4>Effect</h4><ul>${mods.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul></div>
        <div><h4>In your pack</h4><ul>${owned.map((id) => `<li><span>${esc(GEAR[id].name)}<br><small style="color:var(--dim)">${esc(GEAR[id].desc)}</small></span><span><button class="mini" data-act="equip:${id}">wear</button></span></li>`).join('') || '<li><span>No gear. Loot bandits, chests and the shops.</span></li>'}</ul>
        <h4>Active effects</h4><ul>${[...g.status.fx].map(([id, t]) => `<li><span>${esc(g.status.constructor.name && (id))}</span><span>${Math.ceil(t)}s</span></li>`).join('') || '<li><span>None</span></li>'}</ul></div></div>`;
    } else if (tab === 'stealth') {
      const S = g.stealth, v = P.visibility, st = S.st, bars = (f) => { const w = Math.round(Math.min(1.6, f) / 1.6 * 100); return `<span style="display:inline-block;width:${w}px;height:8px;background:${f > 1.02 ? 'var(--blood)' : f < 0.98 ? 'var(--violet)' : 'var(--dim)'};border:1px solid #000"></span>`; };
      body = `<div class="cols"><div><h4>How visible you are: ${S.label(v)} (${Math.round(Math.min(1, v) * 100)}%)</h4><ul>${S.parts.map(([a, f]) => `<li><span>${esc(a)}</span><span>${bars(f)} ×${f.toFixed(2)}</span></li>`).join('')}</ul>
        <h4>How loud you are</h4><ul><li><span>Last footstep radius</span><span>${(P.noiseNow || 0).toFixed(1)} m</span></li><li><span>Crowd and weather mask</span><span>×${S.noiseMask(P.pos, 'step').toFixed(2)}</span></li><li><span>Surface</span><span>${['grass / dirt', 'cobbles', 'wood', 'gravel / metal / bog'][g.nav.noise[Math.max(0, g.nav.at(P.pos[0], P.pos[2]))] || 0]}</span></li></ul>
        <h4>Record</h4><ul><li><span>Times spotted</span><span>${st.spotted}</span></li><li><span>Zones cleared unseen</span><span>${st.unseenZones}</span></li><li><span>Silent chokes</span><span>${st.chokes}</span></li><li><span>Lights shot out</span><span>${st.lightsOut}</span></li><li><span>Evidence found by guards</span><span>${st.evidence}</span></li><li><span>Unseen time this run</span><span>${Math.round(st.unseenSecs / 60)} min</span></li></ul></div>
        <div><h4>Rules of the dark</h4><ul class="rules"><li><span>Guards see best straight ahead and worst at the edge of their cone.</span></li><li><span>Light is the biggest factor: snuff torches, shoot lamps with a knife (G), stay off lit cobbles.</span></li><li><span>Crouch (C) is 45% harder to see; hold C to go prone (55% smaller still and nearly silent). Crouch and hold Shift to creep.</span></li><li><span>Ferns, reeds, hay, barrels, crops and trees give cover. It counts double when crouched.</span></li><li><span>Crowds mask footsteps. Rain masks them more. Bare stone and bog make them worse.</span></li><li><span>Opened chests and forced locks are evidence. A guard who finds it goes looking.</span></li><li><span>Behind an unaware target, hold E to choke them out silently.</span></li><li><span>A ? above a guard is suspicion. A ! is a hunt. The ring round the crosshair shows where they are.</span></li><li><span>Cross an area without being seen for 25 seconds and you earn Unseen XP.</span></li></ul></div></div>`;
    } else if (tab === 'deeds') {
      body = `<div class="cols"><div><h4>Deeds (${g.codex.done.size}/${DEEDS.length})</h4><ul>${DEEDS.map((d) => `<li class="${g.codex.done.has(d.id) ? 'done' : ''}"><span>${esc(d.name)}<br><small style="color:var(--dim)">${esc(d.desc)}</small></span><span>${g.codex.done.has(d.id) ? 'done' : ''}</span></li>`).join('')}</ul></div>
        <div><h4>Bestiary (${g.codex.seen.size}/${CODEX.length})</h4><ul>${CODEX.map((c) => g.codex.seen.has(c.id) ? `<li><span><b>${esc(c.name)}</b><br><small style="color:var(--dim)">${esc(c.text)}</small></span></li>` : `<li><span style="color:var(--dim)">???</span></li>`).join('')}</ul></div></div>`;
    }
    this.el.inv.innerHTML = head + `<div class="bookbody">${body}</div><div class="hint">Tab / Esc to close · 1-8 tabs · M map · P perks</div>`;
    this.el.inv.hidden = false;
  };
  const upd = P.update;
  P.update = function update(dt) { upd.call(this, dt); if (this.invOpen && this.tab === 'map' && this.g.wmap) { const c = document.getElementById('bookMap'); if (c) this.g.wmap.drawFull(c); } const mm = document.getElementById('minimap'); if (mm && this.g.wmap && this.g.mode !== 'cutscene') { this._mmT = (this._mmT || 0) - dt; if (this._mmT <= 0) { this._mmT = 0.12; this.g.wmap.drawMini(mm); } } this.g.wmap?.drawSight(document.getElementById('sightCv')); };
}
