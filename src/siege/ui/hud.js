// The match HUD, laid out like the reference screenshot: team slots and scores across the top,
// the timer and round label, the radial dial and room name at the bottom, ammunition and
// gadgets bottom right, plus prompts, kill feed, callouts, world markers and screen effects.
import * as E from '../../../engine/index.js';
import { icon, gadgetIcon, opIcon, weaponIcon } from './icons.js';
import { GADGETS } from '../data/gadgets.js';
import { WEAPON_CLASSES } from '../data/weapons.js';
import { clamp } from '../sim/util.js';

const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ordinal = (n) => n;

export class Hud {
  constructor(app) {
    this.app = app; this.el = document.createElement('div'); this.el.className = 'hud'; this.el.hidden = true;
    this.el.innerHTML = `
      <div class="markers" id="hMarkers"></div>
      <div class="top" id="hTop"></div>
      <div class="roundlbl" id="hRound"></div>
      <div class="obj" id="hObj"></div>
      <div class="xhair dot" id="hX"><b></b><i></i><i></i><i></i><i></i></div>
      <div class="hitmark" id="hHit"><i></i><i></i><i></i><i></i></div>
      <div class="feed" id="hFeed"></div>
      <div class="callouts" id="hCall"></div>
      <div class="hpbar" id="hHp"></div>
      <div class="bl" id="hBl"></div>
      <div class="dial" id="hDial"></div>
      <div class="br" id="hBr"></div>
      <div class="prompt" id="hPrompt" hidden></div>
      <div class="msg" id="hMsg" hidden></div>
      <div class="banner-big" id="hBanner"></div>
      <div class="tut" id="hTut" hidden></div>
      <div class="cdbig" id="hCd" hidden></div>
      <div class="scopeov" id="hScope" hidden><svg viewBox="-100 -56 200 112" preserveAspectRatio="xMidYMid slice"><defs><mask id="lensm"><rect x="-300" y="-300" width="600" height="600" fill="#fff"/><circle r="52" fill="#000"/></mask></defs><rect x="-300" y="-300" width="600" height="600" fill="#050605" mask="url(#lensm)"/><g stroke="#000" stroke-width=".3"><line x1="-52" y1="0" x2="-3" y2="0"/><line x1="3" y1="0" x2="52" y2="0"/><line x1="0" y1="-52" x2="0" y2="-3"/><line x1="0" y1="3" x2="0" y2="52"/></g><circle r=".5" fill="#d63a2a"/></svg><div style="position:absolute;left:50%;top:calc(50% + 70px);transform:translateX(-50%);font:700 14px var(--mono);color:#e04a3a" id="hRange"></div></div>
      <div class="droneov" id="hDrone" hidden><div class="lbl" id="hDroneLbl"></div></div>
      <div class="vign" id="hVign"></div><div class="flash" id="hFlash"></div><div class="gasov" id="hGas"></div>
      <div class="sb" id="hSb" hidden></div>
      <div class="fps" id="hFps" hidden></div>`;
    document.body.appendChild(this.el);
    this.q = (id) => this.el.querySelector('#' + id);
    this.markers = []; this.lastTop = ''; this.feedMax = 6; this.banner = null; this.hitT = 0; this.callT = 0;
    this.fps = 0; this.fpsT = 0; this.frames = 0; this.dial = null; this.tut = null; this.vig = 0;
  }
  show(v) { this.el.hidden = !v; }
  applyZoom() { this.zoom = (this.app.uiScale || 1) * (this.app.store.settings.hudScale || 1); this.el.style.zoom = this.zoom; }
  // ---------------------------------------------------------------- one-time per-round wiring
  bind(game) {
    this.game = game; const sim = game.sim, me = game.playerActor; this.me = me; this.sim = sim;
    for (const id of ['hFeed', 'hCall', 'hBanner', 'hBr', 'hBl', 'hHp', 'hDial']) this.q(id).innerHTML = '';
    this.lastTop = ''; this.lastBr = ''; this.lastBl = ''; this.lastHp = ''; this.dialKey = '';
    const feed = (html, cls = '') => { const f = this.q('hFeed'), d = document.createElement('div'); d.className = cls; d.innerHTML = html; f.prepend(d); setTimeout(() => d.remove(), 6200); while (f.children.length > this.feedMax) f.lastChild.remove(); };
    const nm = (a) => `<span style="color:${a.team === 'atk' ? '#7cc7ff' : '#ff9086'}">${a.name}</span>`;
    sim.on('death', (e) => {
      const k = e.killer, how = e.bleed ? 'bled out' : e.explosion ? 'blown up' : '';
      feed(k && k !== e.actor ? `${nm(k)} ${icon(e.headshot ? 'skull' : 'swords')} ${nm(e.actor)}` : `${nm(e.actor)} ${icon('skull')} ${how || 'died'}`, (k && k.isPlayer ? 'me ' : '') + (e.actor.team === 'atk' ? 'a' : 'd'));
      if (k && k.isPlayer && k !== e.actor && k.team !== e.actor.team) this.showKill(e);
    });
    sim.on('down', (e) => {
      const k = e.src;
      feed(k && k !== e.actor ? `${nm(k)} ${icon('swords')} ${nm(e.actor)} <i style="opacity:.7;font-style:normal">downed</i>` : `${nm(e.actor)} ${icon('lock')} downed`, (k && k.isPlayer ? 'me ' : '') + (e.actor.team === 'atk' ? 'a' : 'd'));
      if (k && k.isPlayer && k !== e.actor && k.team !== e.actor.team) this.showKill({ headshot: e.region === 'head' });
    });
    sim.on('dronespot', (e) => { if (me && me.team === 'atk') feed(`${icon('camera')} Drone: ${e.enemy.name} in ${e.room || 'the building'}`, 'a'); });
    for (const note of sim.notes || []) setTimeout(() => feed(`${icon('ping')} ${note}`, ''), 3500);
    sim.on('revive', (e) => feed(`${nm(e.by || e.actor)} revived ${nm(e.actor)}`, e.actor.team === 'atk' ? 'a' : 'd'));
    sim.on('callout', (e) => { if (e.team !== (me ? me.team : 'atk')) return; if (e.actor === me) return; const d = document.createElement('div'); d.className = e.team === 'atk' ? '' : 'd'; d.textContent = `${e.actor.name}: ${e.enemy.name} spotted — ${e.room}`; this.q('hCall').prepend(d); setTimeout(() => d.remove(), 5200); if (this.app.store.settings.voice && Math.random() < 0.5) game.audio && game.audio.say(`Contact. ${e.room.replace(/^\d F /, '')}`, 0.9 + Math.random() * 0.3); });
    sim.on('planted', (e) => this.bannerShow('DEFUSER PLANTED', `${e.actor.name} planted the defuser`, 2.6));
    sim.on('defusestart', (e) => { if (me && e.actor.team !== me.team) this.say('Defuser being disabled!'); else if (me && e.actor.team === me.team) this.say('Disabling the defuser'); });
    sim.on('plantstart', (e) => { if (me && e.actor.team !== me.team) this.say('Attackers are planting the defuser!'); });
    sim.on('phase', () => { this.bannerShow(me && me.team === 'atk' ? 'ATTACK' : 'DEFEND', me && me.team === 'atk' ? 'Breach the building and plant the defuser' : 'Hold the site', 2.4); game.audio && game.audio.ui('roundstart'); });
    sim.on('reinforce', (e) => { if (e.actor === me) this.say(`Wall reinforced (${sim.round.reinforcements} left)`); });
    sim.on('ping', (e) => this.pings.push({ pos: e.pos, t: 6, by: e.actor, enemy: e.enemy }));
    sim.on('sonar', () => {}); this.pings = [];
    this.mk = []; this.q('hMarkers').innerHTML = '';
    this.msgT = 0;
    const s = this.app.store.settings; this.q('hX').className = 'xhair ' + (s.crosshair || 'dot'); this.q('hX').style.setProperty('--xc', s.crosshairColor || '#fff');
    this.el.style.setProperty('--hud', s.hudScale || 1); this.applyZoom();
    this.q('hFps').hidden = !s.showFps;
    this.dialRingProgress = 1;
  }
  say(t, s = 2.4) { const m = this.q('hMsg'); m.textContent = t; m.hidden = false; this.msgT = s; }
  bannerShow(a, b = '', t = 2.4) { const el = this.q('hBanner'); el.innerHTML = `<div class="a">${a}</div><div class="b">${b}</div>`; this.banner = t; }
  showKill(e) { const h = this.q('hHit'); h.className = 'hitmark ' + (e.headshot ? 'head' : 'kill'); h.style.transition = 'none'; h.style.opacity = 1; requestAnimationFrame(() => { h.style.transition = 'opacity .5s'; h.style.opacity = 0; }); }
  hitMark(head) { const h = this.q('hHit'); h.className = 'hitmark ' + (head ? 'head' : ''); h.style.transition = 'none'; h.style.opacity = 1; requestAnimationFrame(() => { h.style.transition = 'opacity .3s'; h.style.opacity = 0; }); }

  // ---------------------------------------------------------------- per frame
  update(dt, match) {
    const game = this.game, sim = this.sim, me = this.me, p = game.player; if (!sim) return;
    this.frames++; this.fpsT += dt; if (this.fpsT > 0.5) { this.q('hFps').textContent = Math.round(this.frames / this.fpsT) + ' fps'; this.frames = 0; this.fpsT = 0; }
    const r = sim.round;
    this.updateTop(match); this.updateDial(); this.updateWeapons(); this.updateCrosshair();
    this.updateStatus(dt);
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.q('hMsg').hidden = true; }
    if (p && p.msgT > 0) { this.say(p.msg, p.msgT); p.msgT = 0; }
    if (this.banner !== null) { this.banner -= dt; if (this.banner <= 0) { this.banner = null; this.q('hBanner').innerHTML = ''; } }
    const pr = this.q('hPrompt');
    if (p && p.prompt && (me.alive || me.downed) && p.view === 'player') { pr.hidden = false; const q = p.prompt; pr.innerHTML = `<div class="tx">${q.key ? `<span class="btnglyph">${q.key}</span>` : ''}${q.text}</div>${q.sub ? `<div class="sub">${q.sub}</div>` : ''}${q.progress !== undefined ? `<div class="prog"><b style="width:${clamp(q.progress, 0, 1) * 100}%"></b></div>` : ''}`; } else pr.hidden = true;
    // overlays
    const scope = game.scopeOn && p && p.view === 'player'; this.q('hScope').hidden = !scope; if (scope) { const h = sim.world.cast(...me.eye(), ...me.look(), 400, 0); this.q('hRange').textContent = h ? `${h.t.toFixed(0)} m` : '– – –'; }
    const dr = p && (p.view === 'drone' || p.view === 'cam'); this.q('hDrone').hidden = !dr; if (dr) this.q('hDroneLbl').textContent = (p.view === 'drone' ? 'DRONE FEED' : 'CAMERA FEED') + (game.droneJam ? ' — SIGNAL JAMMED' : '') + '  [WASD] drive  [Space] hop  [F] exit';
    this.q('hFlash').style.opacity = me && me.alive ? clamp(me.status.blind / 1.3, 0, 0.98) : 0;
    this.q('hGas').style.opacity = me && me.status.gas > 0 ? 0.8 : 0;
    this.vig = Math.max(0, (game.hurtFlash || 0) - dt * 1.6); game.hurtFlash = this.vig;
    const low = me && me.alive ? clamp(1 - me.hp / me.maxHp, 0, 1) : 0;
    this.q('hVign').style.opacity = clamp(this.vig * 0.9 + (low > 0.6 ? (low - 0.6) * 1.2 : 0) + (me && me.downed ? 0.6 : 0), 0, 1);
    this.updateMarkers(dt);
    const sb = this.q('hSb'); const want = p && p.keys.has(p.K.scoreboard); sb.hidden = !want; if (want) sb.innerHTML = this.scoreboardHtml();
    // objective text and bomb progress
    const o = this.q('hObj'); o.innerHTML = this.objective(r);
    if (this.tut) this.updateTut();
  }
  objective(r) {
    const me = this.me, b = r.bomb;
    if (b.state === 'planting') return `Planting ${icon('bomb')}<div class="bar"><b style="width:${b.progress * 100}%"></b></div>`;
    if (b.state === 'defusing') return `Defuser being disabled<div class="bar"><b style="width:${b.progress * 100}%;background:#6fd08a"></b></div>`;
    if (b.state === 'planted') return `${icon('bomb')} Defuser active`;
    if (r.o.mode === 'secure' && r.inAction()) return `Secure area · ${Math.ceil(r.o.secureHold - r.secure.hold)}s`;
    if (r.inPrep() && me) return me.team === 'atk' ? 'Preparation · launch your drone (X)' : `Preparation · reinforce walls (${r.reinforcements} left)`;
    return '';
  }
  updateTop(match) {
    const sim = this.sim, r = sim.round, me = this.me;
    const slots = (team) => sim.team(team).map((a) => {
      const known = !me || a.team === me.team || !a.alive || a.status.tag > 0 || sim.round.bomb.state !== 'idle' || a.stats.kills > 0 || true;
      const cls = (a.dead ? 'dead ' : a.downed ? 'down ' : '') + (a === me ? 'me ' : '') + (!me || a.team === me.team || a.dead ? 'has' : '');
      return `<div class="slot ${cls}">${!me || a.team === me.team || a.dead ? opIcon(a.op) : '?'}</div>`;
    }).join('');
    const sc = match ? match.sideScores(sim) : { atk: 0, def: 0 };
    const time = r.phase === 'prep' ? fmt(r.t) : r.phase === 'end' ? '0:00' : fmt(r.t);
    const fuse = r.fuse;
    const html = `<div class="slots atk">${slots('atk')}</div><div class="scorebox">${icon('swords')} ${sc.atk}</div><div class="timerbox ${fuse !== null ? 'red' : ''}">${fuse !== null ? icon('bomb') + ' ' + fmt(fuse) : time}</div><div class="scorebox">${sc.def} ${icon('castle')}</div><div class="slots def">${slots('def')}</div>`;
    if (html !== this.lastTop) { this.q('hTop').innerHTML = html; this.lastTop = html; }
    const lbl = r.phase === 'prep' ? 'PREPARATION PHASE' : '';
    this.q('hRound').innerHTML = `ROUND ${match ? match.roundNo : 1}${lbl ? ' · ' + lbl : ''}`;
  }
  updateDial() {
    const sim = this.sim, r = sim.round, me = this.me, g = this.game; if (!me) return;
    const a = me; const room = sim.world.roomName(a.pos[0], a.pos[1], a.pos[2]);
    let l1 = '';
    if (r.phase === 'prep') l1 = `${Math.ceil(r.t)} seconds left.`;
    else if (r.bomb.state === 'planted' || r.bomb.state === 'defusing') l1 = me.team === 'atk' ? 'Protect the defuser.' : 'Disable the defuser.';
    else if (r.phase === 'action') l1 = me.team === 'atk' ? 'Plant the defuser.' : 'Hold the site.';
    else l1 = 'Round over.';
    // bearing to the objective relative to where we look
    const tgt = r.bomb.pos || r.site.center, yaw = g.camYawRender ?? me.yaw;
    const bearing = Math.atan2(tgt[0] - a.pos[0], tgt[2] - a.pos[2]) - yaw;
    const prog = r.phase === 'prep' ? r.t / r.o.prep : r.phase === 'action' ? r.t / r.o.action : 0;
    const key = l1 + room + Math.round(bearing * 20) + Math.round(prog * 60);
    if (key === this.dialKey) return; this.dialKey = key;
    const arc = (a0, a1, rr) => { const x0 = 100 + Math.cos(a0) * rr, y0 = 100 + Math.sin(a0) * rr, x1 = 100 + Math.cos(a1) * rr, y1 = 100 + Math.sin(a1) * rr; return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
    const top0 = Math.PI, filled = top0 + Math.PI * clamp(prog, 0, 1);
    const ax = (ang, rr) => [100 + Math.sin(ang) * rr, 100 - Math.cos(ang) * rr];
    const [px, py] = ax(bearing, 76), [qx, qy] = ax(bearing + 0.16, 66), [sx, sy] = ax(bearing - 0.16, 66);
    this.q('hDial').innerHTML = `<div class="t1">${l1}</div><div class="t2">${room}</div><svg viewBox="0 0 200 110"><path d="${arc(0, Math.PI, 80)}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="18"/><path d="${arc(Math.PI, 2 * Math.PI, 80)}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="14"/><path d="${arc(top0, Math.max(top0 + 0.01, filled), 80)}" fill="none" stroke="#bfe3ff" stroke-width="14"/><path d="M${px.toFixed(1)} ${py.toFixed(1)}L${qx.toFixed(1)} ${qy.toFixed(1)}L${sx.toFixed(1)} ${sy.toFixed(1)}z" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="100" cy="100" r="3" fill="#fff"/></svg>`;
  }
  updateWeapons() {
    const me = this.me, p = this.game.player;
    if (!me) { const t = this.game.followActor, html = `<div class="k" style="font-size:22px">OBSERVING ${t ? t.name + ' · ' + t.op.name : ''}</div><div class="k hint" style="font-size:16px">Space / arrows: next player · 1 2 3: speed · Esc: leave</div>`; if (html !== this.lastBl) { this.q('hBl').innerHTML = html; this.lastBl = html; } return; }
    const rows = me.guns.map((g, i) => {
      const sel = me.gsel < 0 && me.cur === i;
      return `<div class="wslot ${i ? 's' : ''} ${sel ? 'sel' : ''}">${weaponIcon(g.def.cls)}<span class="am">${g.mag}<small>${g.reserve}</small></span></div>`;
    }).join('');
    const gad = me.gadgets.map((g, i) => `<div class="g ${me.gsel === i ? 'sel' : ''} ${g.count <= 0 && GADGETS[g.id].count > 0 ? 'zero' : ''}">${gadgetIcon(g.id)}${GADGETS[g.id].count > 0 ? g.count : ''}<span class="btnglyph" style="min-width:18px;height:18px;font-size:10px">${i + 3}</span></div>`).join('');
    const fm = me.gun ? `<div class="fm">${me.gun.def.label} · ${me.gun.def.auto ? 'AUTO' : 'SEMI'}</div>` : '';
    const html = `<div class="gadrow">${gad}</div>${rows}${fm}`;
    if (html !== this.lastBr) { this.q('hBr').innerHTML = html; this.lastBr = html; }
    const bl = `<div class="k">${icon('camera')}<span class="btnglyph">${p ? p.K.drone.toUpperCase() : 'X'}</span></div><div class="k">${icon('ping')}<span class="btnglyph">${p ? p.K.ping.toUpperCase() : 'T'}</span></div>`;
    if (bl !== this.lastBl) { this.q('hBl').innerHTML = bl; this.lastBl = bl; }
    // health and teammates
    const mates = this.sim.team(me.team).filter((a) => a !== me).map((a) => `<div class="nm">${opIcon(a.op)} ${a.name} <span style="color:${a.dead ? '#888' : a.downed ? '#f90' : '#9f9'}">${a.dead ? '✕' : a.downed ? 'DOWN' : Math.round(a.hp)}</span></div>`).join('');
    const hp = `<div class="nm">${opIcon(me.op)} ${me.name} · ${Math.max(0, Math.round(me.hp))}</div><div class="row"><b style="width:${clamp(me.hp / (me.maxHp + 30), 0, 1) * 100}%;background:${me.hp < 35 ? '#e8503a' : '#4ad07a'}"></b></div><div class="plates">${'<i></i>'.repeat(me.armorPlates)}</div><div style="margin-top:10px;opacity:.85">${mates}</div>`;
    if (hp !== this.lastHp) { this.q('hHp').innerHTML = hp; this.lastHp = hp; }
  }
  updateCrosshair() {
    const me = this.me, g = this.game, x = this.q('hX'); if (!me) return;
    const hide = !me.alive || g.scopeOn || (g.player && g.player.view !== 'player') || me.ads > 0.6 && me.gun && me.gun.def.cls !== 'SG';
    x.style.display = hide ? 'none' : 'block';
    const gun = me.gun; if (!gun) return;
    const cone = gun.def.spread + (gun.def.ads - gun.def.spread) * me.ads + Math.hypot(me.vel[0], me.vel[2]) * 0.0045 + me.bloom;
    const px = Math.max(5, (cone / Math.tan(g.cam.fov / 2)) * (window.innerHeight / 2)) / (this.zoom || 1);
    x.style.setProperty('--g', px.toFixed(1) + 'px');
  }
  updateStatus(dt) { void dt; }
  scoreboardHtml() {
    const sim = this.sim, me = this.me, m = this.app.match;
    const cell = (v, d) => (m && d ? `${v}<small>${d ? ' (' + d + ')' : ''}</small>` : `${v}`);
    const tbl = (team) => {
      const rows = sim.team(team).map((a) => {
        const tot = m && a.slot ? m.slot(a.slot, a) : { ...a.stats };
        return { a, tot, live: a.stats };
      }).sort((x, y) => y.tot.score - x.tot.score);
      const sq = m && rows[0] && rows[0].a.slot ? (rows[0].a.slot.startsWith('me') ? 'Your squad' : 'Opposing squad') : (team === 'atk' ? 'Attackers' : 'Defenders');
      return `<h3 class="${team}">${sq} · ${team === 'atk' ? 'Attack' : 'Defense'}<span>${sim.team(team).filter((a) => a.alive).length} alive</span></h3><table class="table"><tr><th>Operator</th><th>Name</th><th>Score</th><th>K</th><th>A</th><th>D</th><th>Revives</th><th>Status</th></tr>${rows.map(({ a, tot, live }) => `<tr class="${a === me ? 'me' : ''}"><td>${opIcon(a.op)} ${a.op.name}</td><td>${a.isPlayer ? this.app.store.settings.playerName : a.name}</td><td>${tot.score}</td><td>${cell(tot.kills, live.kills)}</td><td>${tot.assists}</td><td>${cell(tot.deaths, live.deaths)}</td><td>${tot.revives || 0}</td><td>${a.dead ? 'KIA' : a.downed ? 'Down' : 'Alive'}</td></tr>`).join('')}</table>`;
    };
    const head = m ? `<div class="hint" style="text-align:center;margin-bottom:4px">Round ${m.roundNo} · match score ${m.score.me} – ${m.score.foe} · totals include this round, (brackets) = this round</div>` : '';
    return `<div class="box">${head}${tbl('atk')}${tbl('def')}</div>`;
  }
  updateMarkers(dt) {
    const g = this.game, sim = this.sim, me = this.me, cam = g.cam, host = this.q('hMarkers'); if (!me) return;
    const items = [];
    const vp = cam.viewProj; void vp;
    for (const a of sim.actors) {
      if (a === me || !a.alive) continue;
      if (a.team === me.team) items.push({ pos: [a.pos[0], a.pos[1] + 2.05, a.pos[2]], cls: 'mate', text: a.name });
      else if (a.status.tag > 0) items.push({ pos: [a.pos[0], a.pos[1] + 2.05, a.pos[2]], cls: 'enemy', text: a.name });
    }
    const r = sim.round, tgt = r.bomb.pos || (me.team === 'atk' && r.phase !== 'prep' ? null : null);
    if (r.bomb.pos && r.bomb.state !== 'defused') items.push({ pos: [r.bomb.pos[0], r.bomb.pos[1] + 1.1, r.bomb.pos[2]], cls: 'site', text: '◉ DEFUSER' });
    else if (me.team === 'atk' && r.phase === 'action') { items.push({ pos: [r.site.a[0], r.site.a[1] + 1.3, r.site.a[2]], cls: 'site', text: 'A' }, { pos: [r.site.b[0], r.site.b[1] + 1.3, r.site.b[2]], cls: 'site', text: 'B' }); }
    void tgt;
    for (const pg of this.pings) { pg.t -= dt; items.push({ pos: [pg.pos[0], pg.pos[1] + 0.6, pg.pos[2]], cls: 'ping', text: pg.enemy ? 'ENEMY' : 'PING' }); }
    this.pings = this.pings.filter((x) => x.t > 0);
    while (this.mk.length < items.length) { const d = document.createElement('div'); d.className = 'mk'; host.appendChild(d); this.mk.push(d); }
    const Z = this.zoom || 1, W = window.innerWidth / Z, H = window.innerHeight / Z;
    this.mk.forEach((d, i) => {
      const it = items[i]; if (!it) { d.style.display = 'none'; return; }
      const v = cam.project(it.pos);
      // behind the camera or off screen: hide
      const dx = it.pos[0] - cam.position[0], dy = it.pos[1] - cam.position[1], dz = it.pos[2] - cam.position[2];
      const fwd = [cam.target[0] - cam.position[0], cam.target[1] - cam.position[1], cam.target[2] - cam.position[2]];
      if (dx * fwd[0] + dy * fwd[1] + dz * fwd[2] < 0 || Math.abs(v[0]) > 1.05 || Math.abs(v[1]) > 1.05) { d.style.display = 'none'; return; }
      d.style.display = 'block'; d.className = 'mk ' + it.cls; d.style.left = ((v[0] * 0.5 + 0.5) * W) + 'px'; d.style.top = ((-v[1] * 0.5 + 0.5) * H) + 'px';
      const dist = Math.hypot(dx, dy, dz); const html = `${it.text} ${dist > 4 ? Math.round(dist) + 'm' : ''}<i class="tri"></i>`;
      if (d._h !== html) { d.innerHTML = html; d._h = html; }
    });
  }
  // ---------------------------------------------------------------- tutorial overlay
  setTutorial(t) { this.tut = t; const el = this.q('hTut'); el.hidden = !t; if (t) this.updateTut(true); }
  updateTut(force) { const t = this.tut; if (!t) return; const s = t.steps[t.i]; const el = this.q('hTut'); const html = `<h4>${t.title} · ${t.i + 1}/${t.steps.length}</h4><p>${s ? s.text : 'Complete!'}</p>`; if (force || el._h !== html) { el.innerHTML = html; el._h = html; } }
}
void ordinal; void E; void WEAPON_CLASSES;
