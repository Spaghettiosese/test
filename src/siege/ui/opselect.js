// The operator-select screen shown before every round: LOCATIONS / OPERATORS / LOADOUT / READY
// tabs under a countdown, the squad's slots filling as the bots lock in, and the chosen
// operator posed in the studio on the right.
import { OPS_BY_ID, attackers, defenders } from '../data/operators.js';
import { WEAPONS } from '../data/weapons.js';
import { HARBOR } from '../data/harbor.js';
import { icon, opIcon, weaponIcon, gadgetIcon } from './icons.js';
import { OS_TABS, siteMapSvg, opGridHtml, loadoutHtml, opInfoHtml } from './screens.js';
import { GADGETS } from '../data/gadgets.js';

const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export class OpSelect {
  constructor(app) {
    this.app = app; this.el = document.createElement('div'); this.el.className = 'scr os'; this.el.hidden = true;
    this.el.innerHTML = `<div class="stripes"></div><div class="loc" id="osLoc"></div>
      <div class="ostimer"><div class="slots atk" id="osA"></div><div class="timerbox" id="osT">0:40</div><div class="slots def" id="osD"></div></div>
      <div class="ostabs" id="osTabs"></div><div id="osBody"></div><div class="osfoot" id="osFoot"></div><div class="osready" id="osReady"></div>`;
    app.layer.appendChild(this.el);
    this.q = (id) => this.el.querySelector('#' + id);
    this.el.addEventListener('click', (e) => this.click(e));
    this.active = false;
  }
  // opts: { side, round, toWin, mode, seconds, site, spawn }
  open(opts, done) {
    const app = this.app, st = app.store;
    this.done = done; this.opts = opts; this.active = true; this.el.hidden = false;
    const side = opts.side, pool = (side === 'atk' ? attackers : defenders);
    const fav = st.profile.fav[side], owned = pool.filter((o) => st.owns('operator', o.id));
    const first = (OPS_BY_ID[fav] && st.owns('operator', fav) && OPS_BY_ID[fav].side === side) ? fav : (owned[0] || pool[0]).id;
    this.os = { side, tab: 'operators', chosen: first, loadout: null, taken: new Set(), mates: [], tleft: opts.seconds, site: opts.site ?? Math.floor(Math.random() * HARBOR.sites.length), spawn: opts.spawn || HARBOR.spawns[Math.floor(Math.random() * HARBOR.spawns.length)].id, ready: false, team: false, readyT: 0 };
    this.os.loadout = this.defaultLoadout(first);
    // the squad: four bots lock in operators over the countdown
    const total = opts.seconds, n = 4;
    this.plan = Array.from({ length: n }, (_, i) => 1.5 + (total - 7) * ((i + Math.random() * 0.8) / n));
    this.os.taken.add(first);
    this.pose(); this.draw(); this.app.menu.setMode('studio'); this.app.audio.ui('confirm');
    app.menuMode = 'studio';
  }
  close() { this.active = false; this.el.hidden = true; }
  defaultLoadout(opId) {
    const op = OPS_BY_ID[opId], st = this.app.store, saved = st.profile.opLoadouts[opId];
    const ok = (arr, id) => id && arr.includes(id);
    const own = (arr) => arr.find((w) => st.owns('weapon', w)) || arr[0];
    return {
      primary: saved && ok(op.primary, saved.primary) && st.owns('weapon', saved.primary) ? saved.primary : own(op.primary),
      secondary: saved && ok(op.secondary, saved.secondary) && st.owns('weapon', saved.secondary) ? saved.secondary : own(op.secondary),
      gadget2: saved && ok(op.gadgets, saved.gadget2) ? saved.gadget2 : op.gadgets[0],
    };
  }
  pose() {
    const os = this.os, op = OPS_BY_ID[os.chosen], st = this.app.store, w = WEAPONS[os.loadout.primary];
    this.app.menu.setOperator(op, st.look(op.look), { gun: w.rig, twoHanded: w.cls !== 'HG' });
    this.app.menu.yaw = -12; this.app.menu.targetYaw = -12;
  }
  // ---------------------------------------------------------------- rendering
  draw() {
    const os = this.os, o = this.opts, side = os.side;
    this.q('osLoc').innerHTML = `${HARBOR.name} ${o.mode === 'secure' ? 'Secure Area' : 'Bomb'}<small>${side === 'atk' ? 'Attackers' : 'Defenders'} · Round ${o.round} · First to ${o.toWin}</small>`;
    this.q('osTabs').innerHTML = `<span class="btnglyph">LB</span>${OS_TABS.map(([id, t]) => `<button data-ostab="${id}" class="${os.tab === id ? 'on' : ''}">${t}</button>`).join('')}<span class="btnglyph">RB</span>`;
    this.drawSlots();
    let body = '';
    if (os.tab === 'locations') body = this.locations();
    else if (os.tab === 'operators') body = opGridHtml(this.app, os) + opInfoHtml(OPS_BY_ID[os.chosen]);
    else if (os.tab === 'loadout') body = loadoutHtml(this.app, os);
    else body = this.readyTab();
    if (os.team && os.tab !== 'ready') body += this.teamPanel();
    this.q('osBody').innerHTML = body;
    const op = OPS_BY_ID[os.chosen], lo = os.loadout, pw = WEAPONS[lo.primary], sw = WEAPONS[lo.secondary];
    this.q('osFoot').innerHTML = os.tab === 'loadout' ? '' : `<span class="btnglyph round">Y</span> SHOW TEAM LOADOUT &amp; DETAILS<div style="display:flex;gap:18px;margin-left:30px;align-items:center;font-size:20px;text-transform:none"><span>${weaponIcon(pw.cls)} ${pw.label}</span><span>${weaponIcon(sw.cls)} ${sw.label}</span><span>${gadgetIcon(op.ability)} ${GADGETS[op.ability].name}</span><span>${gadgetIcon(lo.gadget2)} ${GADGETS[lo.gadget2].name}</span></div>`;
    this.q('osFoot').onclick = () => { os.team = !os.team; this.draw(); };
    this.q('osReady').innerHTML = os.ready ? `<span class="hint">Waiting for the squad…</span>` : `<button class="btn red" data-act="ready">Ready</button>`;
  }
  drawSlots() {
    const os = this.os, mine = os.side;
    const slot = (id, me) => `<div class="slot ${id ? 'has' : ''} ${me ? 'me' : ''}">${id ? opIcon(OPS_BY_ID[id]) : '?'}</div>`;
    const my = [slot(os.chosen, true), ...Array.from({ length: 4 }, (_, i) => slot(os.mates[i], false))].join('');
    const foe = Array.from({ length: 5 }, () => slot(null, false)).join('');
    this.q('osA').innerHTML = mine === 'atk' ? my : foe; this.q('osD').innerHTML = mine === 'def' ? my : foe;
  }
  locations() {
    const os = this.os, side = os.side;
    if (side === 'def') {
      const list = HARBOR.sites.map((s, i) => `<button class="listrow ${os.site === i ? 'sel' : ''}" data-ossite="${i}"><b style="min-width:0;font-size:24px">${s.name}</b><span>${s.f + 1}F</span></button>`).join('');
      const s = HARBOR.sites[os.site];
      return `<div class="sitelist"><div class="hint" style="margin-bottom:8px">Pick the objective you will defend. Attackers do not know which one it is.</div>${list}</div><div class="sitemap">${siteMapSvg(null, { f: s.f, rooms: s.rooms })}<div class="hint" style="margin-top:6px">${s.hint}</div></div>`;
    }
    const list = HARBOR.spawns.map((s) => `<button class="listrow ${os.spawn === s.id ? 'sel' : ''}" data-osspawn="${s.id}"><b style="min-width:0;font-size:24px">${s.name}</b><span>${Math.round(s.x1 - s.x0)} × ${Math.round(s.z1 - s.z0)} m</span></button>`).join('');
    return `<div class="sitelist"><div class="hint" style="margin-bottom:8px">Pick where your squad starts. The defenders have chosen an objective; your drone will find them.</div>${list}</div><div class="sitemap">${siteMapSvg(null, null)}<div class="hint" style="margin-top:6px">Bomb sites sit on both floors. Defenders can reinforce walls and barricade windows during preparation.</div></div>`;
  }
  teamRows() {
    const os = this.os, lo = os.loadout, ids = [os.chosen, ...os.mates];
    return Array.from({ length: 5 }, (_, i) => {
      const id = ids[i], op = id && OPS_BY_ID[id];
      const label = i === 0 ? `${this.app.store.settings.playerName} <span>You · ${WEAPONS[lo.primary].label} / ${WEAPONS[lo.secondary].label}</span>` : op ? `${['Bot Ghost', 'Bot Maverick', 'Bot Nomad', 'Bot Viper'][i - 1]} <span>${op.role}</span>` : `<span>Choosing…</span>`;
      return `<div class="teamrow"><div class="optile">${op ? opIcon(op) : '?'}</div><div>${op ? op.name : '—'}</div><div>${label}</div></div>`;
    }).join('');
  }
  readyTab() { return `<div class="teamlist">${this.teamRows()}</div><div class="oshero">${this.os.ready ? 'You are ready' : 'Check your squad, then press Ready'}<br>Round starts when the countdown ends</div>`; }
  teamPanel() { return `<div class="teamlist" style="top:150px;left:70px;z-index:3;background:rgba(5,8,12,.9);padding:10px">${this.teamRows()}</div>`; }

  // ---------------------------------------------------------------- input
  click(e) {
    const os = this.os; if (!os || os.ready) return;
    const t = e.target.closest('[data-ostab],[data-os-op],[data-os-w],[data-os-g],[data-ossite],[data-osspawn],[data-act]'); if (!t) return;
    const au = this.app.audio, st = this.app.store;
    if (t.dataset.ostab) { os.tab = t.dataset.ostab; au.ui('click'); this.draw(); }
    else if (t.dataset.osOp) {
      const id = t.dataset.osOp, op = OPS_BY_ID[id];
      if (op.side !== os.side) return;
      if (!st.owns('operator', id)) { this.app.toast('Locked: unlock this operator in the Shop or by levelling up'); au.ui('error'); return; }
      if (os.taken.has(id) && os.chosen !== id) { this.app.toast(`${op.name} is already taken`); au.ui('error'); return; }
      os.taken.delete(os.chosen); os.chosen = id; os.taken.add(id); os.loadout = this.defaultLoadout(id); au.ui('click'); this.pose(); this.draw();
    } else if (t.dataset.osW) {
      const [slot, id] = t.dataset.osW.split(':'); os.loadout[slot] = id; au.ui('click'); if (slot === 'primary') this.pose(); this.draw();
    } else if (t.dataset.osG) { os.loadout.gadget2 = t.dataset.osG; au.ui('click'); this.draw(); }
    else if (t.dataset.ossite !== undefined) { os.site = +t.dataset.ossite; au.ui('click'); this.draw(); }
    else if (t.dataset.osspawn) { os.spawn = t.dataset.osspawn; au.ui('click'); this.draw(); }
    else if (t.dataset.act === 'ready') this.ready();
  }
  key(k) {
    if (!this.active || !this.os || this.os.ready) return;
    const tabs = OS_TABS.map((x) => x[0]), i = tabs.indexOf(this.os.tab);
    if (k === 'q' || k === 'arrowleft') { this.os.tab = tabs[(i + tabs.length - 1) % tabs.length]; this.draw(); }
    else if (k === 'e' || k === 'arrowright') { this.os.tab = tabs[(i + 1) % tabs.length]; this.draw(); }
    else if (k === 'enter') this.ready();
    else if (k === 'y') { this.os.team = !this.os.team; this.draw(); }
  }
  ready() {
    const os = this.os; if (os.ready) return;
    os.ready = true; os.readyT = 0; this.app.audio.ui('confirm'); this.draw();
    // remember the choices
    const st = this.app.store; st.profile.fav[os.side] = os.chosen; st.profile.opLoadouts[os.chosen] = { ...os.loadout }; st.save();
  }
  update(dt) {
    if (!this.active || !this.os) return;
    const os = this.os;
    os.tleft -= dt;
    const t = this.q('osT'), txt = fmt(os.tleft); if (t.textContent !== txt) t.textContent = txt;
    // bots lock in
    const elapsed = this.opts.seconds - os.tleft;
    while (os.mates.length < 4 && elapsed >= this.plan[os.mates.length]) {
      const pool = (os.side === 'atk' ? attackers : defenders).filter((o) => !os.taken.has(o.id) && (this.app.botOwns(o.id)));
      const pick = pool[Math.floor(Math.random() * pool.length)] || (os.side === 'atk' ? attackers : defenders).find((o) => !os.taken.has(o.id));
      os.mates.push(pick.id); os.taken.add(pick.id); this.drawSlots(); if (os.tab === 'ready' || os.team) this.draw(); else if (os.tab === 'operators') this.q('osBody').querySelectorAll('.optile').forEach((b) => b.classList.toggle('taken', os.taken.has(b.dataset.osOp) && os.chosen !== b.dataset.osOp));
      this.app.audio.ui('hover');
    }
    if (os.ready) { os.readyT += dt; if (os.readyT > 0.9) this.finish(); }
    else if (os.tleft <= 0) this.ready();
  }
  finish() {
    const os = this.os, o = this.opts; this.close();
    // any unfilled squad slots are filled by the sim
    this.done({ side: os.side, op: os.chosen, loadout: { ...os.loadout }, site: os.site, spawn: os.spawn, mates: [...os.mates], round: o.round });
  }
}
void icon;
