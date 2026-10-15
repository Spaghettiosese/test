/* LAST BELL — UI: render loop, input, HUD, dialogue, panels, title, creation, endings. */
(function () {
  'use strict';
  const GD = window.GD, G = window.Game, $ = (s) => document.querySelector(s), Art = window.Art;
  const canvas = $('#scene'), ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, cam = { x: 0, y: 0 }, zoom = 1, hover = null, mouse = { x: 0, y: 0 }, highlightAll = false, pulseUntil = 0;
  const isTouch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  let started = false, last = performance.now(), renderer = null, rendererLoc = null, rollTimer = null;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  const fmtTime = (m) => { m = Math.min(m, 1439); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); };
  const snd = (n) => window.Sound && window.Sound.play(n);

  // ---------- fallback renderer if Art is missing ----------
  const Fallback = {
    project(l, x, y) { return { sx: (x - y) * 32 + l.h * 32 + 64, sy: (x + y) * 16 + 120 }; },
    unproject(l, sx, sy) { const a = (sx - l.h * 32 - 64) / 32, b = (sy - 120) / 16; return { x: (a + b) / 2, y: (b - a) / 2 }; },
    worldSize(l) { return { w: (l.w + l.h) * 32 + 128, h: (l.w + l.h) * 16 + 240 }; },
    getRenderer(l) {
      return { draw(c, v, dyn) {
        c.fillStyle = '#1b2220'; c.fillRect(0, 0, v.w, v.h);
        const tr = (x, y) => { const p = Fallback.project(l, x, y); return [(p.sx - v.camX) * v.zoom + v.w / 2, (p.sy - v.camY) * v.zoom + v.h / 2]; };
        for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) { const [a, b] = tr(x, y); c.fillStyle = (x + y) % 2 ? '#3a4a42' : '#2d3b35'; c.beginPath(); c.moveTo(a, b - 16 * v.zoom); c.lineTo(a + 32 * v.zoom, b); c.lineTo(a, b + 16 * v.zoom); c.lineTo(a - 32 * v.zoom, b); c.fill(); }
        const ents = [...dyn.npcs.map((n) => ({ n, c: '#c9892f' })), { n: dyn.player, c: '#e8d9a8' }].sort((a, b) => a.n.x + a.n.y - b.n.x - b.n.y);
        ents.forEach(({ n, c: col }) => { const [a, b] = tr(n.x, n.y); c.fillStyle = col; c.fillRect(a - 8, b - 40 * v.zoom, 16, 40 * v.zoom); if (n.highlight || dyn.hoverId === n.id) { c.strokeStyle = '#6fe39a'; c.lineWidth = 2; c.strokeRect(a - 9, b - 41 * v.zoom, 18, 42 * v.zoom); } });
        (dyn.objects || []).forEach((o) => { const [a, b] = tr(o.x, o.y); c.strokeStyle = o.highlight || dyn.hoverId === o.id ? '#6fe39a' : '#556'; c.strokeRect(a - 12, b - 24, 24, 24); });
      } };
    },
    drawPortrait(cv, look) { const c = cv.getContext('2d'); c.fillStyle = '#334'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = look.skin || '#d9a98a'; c.fillRect(40, 30, 48, 60); c.fillStyle = look.hair || '#222'; c.fillRect(38, 24, 52, 18); },
    drawTitle(c, w, h) { c.fillStyle = '#10140f'; c.fillRect(0, 0, w, h); },
    drawEnding(c, w, h) { c.fillStyle = '#0a0c0a'; c.fillRect(0, 0, w, h); },
    drawItemIcon(c, x, y, s) { c.fillStyle = '#8a7a4a'; c.fillRect(x + s * .2, y + s * .2, s * .6, s * .6); }
  };
  const A = Art || Fallback;
  ['project', 'unproject', 'worldSize', 'getRenderer', 'drawPortrait', 'drawTitle', 'drawEnding', 'drawItemIcon'].forEach((k) => { if (!A[k]) A[k] = Fallback[k]; });

  // ---------- resize ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    [canvas, $('#title-canvas'), $('#ending-canvas')].forEach((c) => { c.width = Math.floor(W * dpr); c.height = Math.floor(H * dpr); });
    zoom = Math.max(0.55, Math.min(1.6, H / 760));
    document.body.classList.toggle('portrait', W < 640 && H > W);
  }
  window.addEventListener('resize', resize); resize();

  // ---------- main loop ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const S = G.S;
    const tctx = $('#title-canvas').getContext('2d');
    if (!$('#title').classList.contains('hidden')) { tctx.setTransform(dpr, 0, 0, dpr, 0, 0); A.drawTitle(tctx, W, H, now); }
    if (!$('#ending').classList.contains('hidden') && G.S && G.S.ending) { const ec = $('#ending-canvas').getContext('2d'); ec.setTransform(dpr, 0, 0, dpr, 0, 0); A.drawEnding(ec, W, H, now, G.S.ending); }
    if (S && started && !S.ending) {
      G.update(dt);
      const l = G.loc();
      if (rendererLoc !== l.id) { renderer = A.getRenderer(l); rendererLoc = l.id; }
      const p = A.project(l, S.px, S.py), ws = A.worldSize(l);
      if (document.body.classList.contains('portrait')) zoom = Math.max(0.35, Math.min(1, W / ws.w * 1.02));
      const dlgOpen = !!G.D;
      const focusY = dlgOpen ? H * 0.28 : H / 2;
      let tx = p.sx, ty = p.sy - 30 + (H / 2 - focusY) / zoom;
      const halfW = W / 2 / zoom, halfH = H / 2 / zoom;
      if (ws.w * 1 < halfW * 2) tx = ws.w / 2; else tx = Math.max(halfW, Math.min(ws.w - halfW, tx));
      if (ws.h * 1 < halfH * 2) ty = ws.h / 2 + (H / 2 - focusY) / zoom * 0; else ty = Math.max(halfH - 60, Math.min(ws.h - halfH + 80, ty));
      cam.x += (tx - cam.x) * Math.min(1, dt * 5); cam.y += (ty - cam.y) * Math.min(1, dt * 5);
      if (Math.abs(cam.x - tx) > 600) { cam.x = tx; cam.y = ty; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hs = G.hotspots(), all = highlightAll || now < pulseUntil;
      const npcs = G.npcsHere().map((n) => {
        const isF = n.follower && S.fpos;
        return { id: n.id, x: n.x, y: n.y, facing: n.facing, look: n.look, pose: n.look.pose, walking: !!(isF && S.fpos.walking), highlight: all || hover === n.id, name: n.name };
      });
      const dyn = { t: now, time: S.time, hoverId: hover, highlightAll: all,
        player: { id: 'player', x: S.px, y: S.py, facing: S.facing, walking: !!S.walking, look: S.look },
        npcs, objects: hs.filter((h) => h.kind === 'object').map((o) => ({ id: o.id, x: o.x, y: o.y, highlight: all || hover === o.id })) };
      try { renderer.draw(ctx, { camX: cam.x, camY: cam.y, zoom, w: W, h: H }, dyn); } catch (e) { console.error(e); ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); }
    } else if (!started) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- input ----------
  const toScreen = (l, x, y, dy) => { const p = A.project(l, x, y); return { x: (p.sx - cam.x) * zoom + W / 2, y: (p.sy - cam.y) * zoom + H / 2 + (dy || 0) }; };
  function pickHotspot(mx, my) {
    const l = G.loc(); let best = null, bd = 1e9;
    for (const h of G.hotspots()) {
      const s = toScreen(l, h.x, h.y, h.kind === 'npc' ? -34 * zoom : h.kind === 'object' ? -14 * zoom : -8 * zoom);
      const d = Math.hypot(mx - s.x, my - s.y), r = (h.kind === 'npc' ? 44 : h.kind === 'exit' ? 40 : 46) * zoom;
      if (d < r && d < bd) { bd = d; best = h; }
    }
    return best;
  }
  function showTip(h, x, y) {
    hover = h.id; const t = $('#tooltip');
    t.innerHTML = esc(h.label) + (h.sub ? '<small>' + esc(h.sub) + '</small>' : '') + '<small>' + (h.kind === 'exit' ? 'tap again to go' : 'tap again to interact') + '</small>';
    t.style.left = Math.max(6, Math.min(W - 250, x - 60)) + 'px'; t.style.top = Math.max(6, y - 90) + 'px'; t.classList.remove('hidden');
  }
  canvas.addEventListener('mousemove', (e) => {
    if (isTouch) return;
    mouse = { x: e.clientX, y: e.clientY };
    if (!G.S || G.D || G.S.ending || !started) { hover = null; $('#tooltip').classList.add('hidden'); return; }
    const h = pickHotspot(e.clientX, e.clientY); if (h && hover !== h.id) snd('hover'); hover = h ? h.id : null;
    canvas.style.cursor = h ? 'pointer' : 'default';
    const t = $('#tooltip');
    if (h) { t.innerHTML = esc(h.label) + (h.sub ? '<small>' + esc(h.sub) + '</small>' : '') + (h.kind === 'exit' ? '<small>click to go</small>' : ''); t.style.left = Math.min(W - 270, e.clientX + 16) + 'px'; t.style.top = (e.clientY + 14) + 'px'; t.classList.remove('hidden'); }
    else t.classList.add('hidden');
  });
  canvas.addEventListener('click', (e) => {
    window.Sound && Sound.init();
    if (!G.S || G.D || G.S.ending || !started) return;
    const h = pickHotspot(e.clientX, e.clientY);
    if (h && isTouch && hover !== h.id) { showTip(h, e.clientX, e.clientY); return; }   // first tap previews, second tap acts
    if (h) { G.interact(h); return; }
    if (isTouch) { hover = null; $('#tooltip').classList.add('hidden'); }
    const l = G.loc(), wx = (e.clientX - W / 2) / zoom + cam.x, wy = (e.clientY - H / 2) / zoom + cam.y;
    const t = A.unproject(l, wx, wy); G.moveTo(Math.round(t.x), Math.round(t.y));
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Tab') { e.preventDefault(); highlightAll = true; }
    if (!started) return;
    if (G.D) { const n = parseInt(e.key, 10); if (n >= 1 && n <= 9) pickChoice(n - 1); if ((e.key === ' ' || e.key === 'Enter') && G.D.roll && !rollTimer) { G.continueRoll(); } return; }
    const k = e.key.toLowerCase();
    if (k === 'i') togglePanel('inventory'); else if (k === 'j') togglePanel('journal'); else if (k === 't') togglePanel('thoughts'); else if (k === 'c') togglePanel('character'); else if (k === 'escape') togglePanel('menu');
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Tab') highlightAll = false; });

  const hl = $('#hl-btn'); hl.onclick = () => { highlightAll = !highlightAll; hl.classList.toggle('on', highlightAll); };
  $('#rot-ok').onclick = () => $('#rotate').classList.add('hidden');
  document.addEventListener('dblclick', (e) => e.preventDefault());

  // ---------- toasts ----------
  G.on('toast', (t) => {
    const box = $('#toasts'), d = document.createElement('div'); d.className = 'toast ' + (t.kind || ''); d.textContent = t.text; box.appendChild(d);
    setTimeout(() => d.remove(), 5200);
    const tk = { good: 'good', xp: 'xp', bad: 'bad', warn: 'warn', item: 'pickup', thought: 'thought', task: 'paper', info: 'toast' }[t.kind]; if (tk) snd(tk);
  });
  G.on('sfx', (n) => snd(n));
  G.on('step', () => window.Sound && Sound.step((G.loc() || {}).floor));
  document.addEventListener('pointerdown', () => { if (window.Sound) { Sound.init(); } }, { once: false });
  if (window.Sound) Sound.scene('title');

  // ---------- HUD ----------
  function refreshHud() {
    const S = G.S; if (!S) return;
    $('#m-hp').style.width = S.hp * 10 + '%'; $('#m-morale').style.width = S.morale * 10 + '%'; $('#m-surv').style.width = S.surv + '%';
    $('#clock').textContent = fmtTime(S.time); if (window.Sound) Sound.tension(S.surv, S.hp, S.morale);
    const rem = GD.meta.curfew - S.time; $('#curfew').textContent = rem > 0 ? 'Curfew in ' + Math.floor(rem / 60) + 'h ' + String(rem % 60).padStart(2, '0') + 'm' : 'CURFEW';
    $('#locname').textContent = G.loc().name;
    $('#pt-dot').classList.toggle('hidden', S.points <= 0);
    // task tracker
    const act = Object.entries(S.tasks).filter(([id, t]) => t.state === 'active' && GD.tasks[id]).sort((a, b) => (GD.tasks[a[0]].category === 'main' ? 0 : 1) - (GD.tasks[b[0]].category === 'main' ? 0 : 1)).slice(0, 3);
    $('#tasktrack').innerHTML = act.length ? '<b>TASKS</b>' + act.map(([id]) => '• ' + esc(GD.tasks[id].title)).join('<br>') : '';
    if (!drawnPortrait || drawnPortrait !== S.morale + ':' + S.hp) { drawnPortrait = S.morale + ':' + S.hp; A.drawPortrait($('#portrait'), S.look, { mood: S.morale <= 3 ? 'sad' : S.hp <= 3 ? 'shock' : 'neutral' }); }
    if (!$('#panel').classList.contains('hidden')) renderPanel();
  }
  let drawnPortrait = null;
  G.on('state', refreshHud); G.on('time', refreshHud);
  G.on('location', (id) => { refreshHud(); const l = GD.locations[id]; window.Sound && Sound.mood(l.mood); pulseUntil = performance.now() + 3500; const t = $('#locname'); t.style.opacity = 0; setTimeout(() => (t.style.opacity = 1), 50); });
  G.on('transition', () => snd('door'));

  // ---------- dialogue ----------
  let renderedCount = 0, lastDid = null;
  G.on('dialogueStart', (D) => {
    $('#dialogue').classList.remove('hidden'); $('#dlg-log').innerHTML = ''; $('#dlg-title').textContent = D.title; renderedCount = 0; lastDid = D;
    document.body.classList.toggle('endmode', !!D.isEnding); document.body.classList.add('indlg');
    $('#hint').style.display = 'none'; $('#tooltip').classList.add('hidden'); window.Sound && Sound.duck(true);
  });
  G.on('dialogueEnd', () => { window.Sound && Sound.duck(false); document.body.classList.remove('indlg'); $('#dialogue').classList.add('hidden'); refreshHud(); });
  G.on('dialogue', renderDialogue);
  function lineHtml(b) {
    if (b.kind === 'choice') return '<div class="chosen">' + md(b.text) + '</div>';
    if (b.kind === 'roll') return rollHtml(b.roll, b.resolved);
    const sp = b.speaker, cls = 'line' + (b.voice || sp.kind === 'skill' ? ' voice' : '') + (sp.kind === 'narrator' ? ' narr' : '');
    const who = sp.name ? '<span class="who" style="color:' + sp.color + '">' + esc(sp.name) + (sp.kind === 'skill' ? ' <small>' + (b.passive ? 'passive ' : '') + sp.level + '</small>' : '') + '</span>' : '';
    return '<div class="' + cls + '" style="color:' + (sp.kind === 'skill' ? sp.color : '') + '">' + who + '<span style="color:var(--paper)">' + md(b.text) + '</span></div>';
  }
  function rollHtml(r, resolved) {
    const res = r.crit ? 'CRITICAL SUCCESS' : r.fumble ? 'CRITICAL FAILURE' : r.success ? 'SUCCESS' : 'FAILURE';
    return '<div class="roll ' + (resolved ? (r.success ? 'ok' : 'no') : 'rolling') + '" data-roll><span style="color:' + r.color + ';font-weight:bold;letter-spacing:.1em">' + esc(r.skillName.toUpperCase()) + '</span>'
      + '<span class="die">' + (resolved ? r.d1 : '?') + '</span><span class="die">' + (resolved ? r.d2 : '?') + '</span>'
      + '<span>+ ' + r.level + ' = <b>' + (resolved ? r.total : '…') + '</b> vs ' + r.diff + ' (' + r.word + ')</span><span class="res">' + (resolved ? res : '') + '</span></div>';
  }
  function renderDialogue(D) {
    const log = $('#dlg-log');
    // newly added blocks
    for (let i = renderedCount; i < D.history.length; i++) {
      const b = D.history[i]; const wrap = document.createElement('div');
      if (b.kind === 'roll' && !b.resolved) {
        wrap.innerHTML = rollHtml(b.roll, false); log.appendChild(wrap);
        snd('dice');
        $('#dlg-choices').innerHTML = '';
        rollTimer = setTimeout(() => { rollTimer = null; b.resolved = true; wrap.innerHTML = rollHtml(b.roll, true); snd(b.roll.crit ? 'crit' : b.roll.fumble ? 'fumble' : b.roll.success ? 'good' : 'bad'); showRollContinue(); log.scrollTop = log.scrollHeight; }, 1100);
      } else { wrap.innerHTML = lineHtml(b); log.appendChild(wrap); if (b.kind === 'line') snd(b.voice ? 'whisper' : 'line'); }
    }
    renderedCount = D.history.length;
    if (!D.roll) renderChoices(D);
    log.scrollTop = log.scrollHeight;
  }
  function showRollContinue() {
    const box = $('#dlg-choices'); box.innerHTML = '';
    const b = document.createElement('button'); b.className = 'choice cont'; b.innerHTML = '<span class="n">▸</span>Continue.'; b.onclick = () => { G.continueRoll(); }; box.appendChild(b);
  }
  function renderChoices(D) {
    const box = $('#dlg-choices'); box.innerHTML = '';
    D.choices.forEach((c, idx) => {
      const b = document.createElement('button'); b.className = 'choice' + (c.locked ? ' locked' : '') + (c.cont ? ' cont' : '');
      let tag = '';
      if (c.check) tag = '<span class="tag" style="color:' + c.check.color + '">[' + esc(c.check.skillName) + ' — ' + c.check.word + (c.check.white ? '' : ' · RED') + ' ' + c.check.chance + '%]</span>';
      b.innerHTML = '<span class="n">' + (idx + 1) + '.</span>' + tag + md(c.text) + (c.locked ? ' <small>(' + esc(c.locked) + ')</small>' : '');
      if (!c.locked) b.onclick = () => pickChoice(idx);
      box.appendChild(b);
    });
  }
  function pickChoice(idx) { if (rollTimer) return; snd('click'); G.choose(idx); }

  // ---------- panels ----------
  let panelKind = null, selItem = null, selSkill = null;
  function togglePanel(k) { if (panelKind === k && !$('#panel').classList.contains('hidden')) closePanel(); else { panelKind = k; $('#panel').classList.remove('hidden'); renderPanel(); snd('open'); } }
  function closePanel() { $('#panel').classList.add('hidden'); panelKind = null; }
  $('#panel-close').onclick = closePanel;
  $('#panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
  document.querySelectorAll('#menubar button').forEach((b) => (b.onclick = () => { if (G.D) return; window.Sound && Sound.init(); togglePanel(b.dataset.panel); }));
  function renderPanel() {
    const body = $('#panel-body'), S = G.S;
    if (panelKind === 'character') {
      let h = '<h2 class="ptitle">' + esc(S.name) + '</h2><div class="psub">' + esc(S.archetype === 'custom' ? 'Self-made student' : ((GD.archetypes || {})[S.archetype] || {}).name || '') + ' · Skill points to spend: <b style="color:var(--orange)">' + S.points + '</b> · XP ' + S.xp + '/' + ((GD.rules && GD.rules.xpPerPoint) || 6) + ' · Passed ' + S.stats.passed + ' / failed ' + S.stats.failed + ' checks</div><div class="attrgrid">';
      for (const aid of Object.keys(GD.attributes)) {
        const at = GD.attributes[aid]; h += '<div class="attrcol"><h3 style="color:' + at.color + ';border-color:' + at.color + '">' + esc(at.name) + ' ' + S.attrs[aid] + '</h3>';
        for (const sid of Object.keys(GD.skills).filter((s) => GD.skills[s].attribute === aid)) {
          const sk = GD.skills[sid], lv = G.skill(sid), base = G.skillBase(sid) + (S.learned[sid] || 0);
          h += '<div class="skillrow" data-skill="' + sid + '"><span class="lv" style="color:' + sk.color + '">' + lv + (lv !== base ? '<sup style="font-size:9px;color:' + (lv > base ? '#8fe08a' : '#e0705a') + '">' + (lv > base ? '+' : '') + (lv - base) + '</sup>' : '') + '</span><span class="nm">' + esc(sk.name) + '</span><button data-up="' + sid + '" ' + (S.points <= 0 || base >= ((GD.rules && GD.rules.skillCap) || 10) ? 'disabled' : '') + '>+</button></div>';
        }
        h += '</div>';
      }
      h += '</div><div id="skilldesc">Hover a skill to hear it clear its throat.</div><div class="psub" style="margin-top:14px">Ideology — ' + ['vanguard', 'undercurrent', 'quiet'].map((k) => { const d = (GD.ideologies || {})[k] || { name: k, color: '#aaa' }; return '<span style="color:' + d.color + '">' + esc(d.name) + ' ' + S.ideo[k] + '</span>'; }).join(' · ') + '</div>';
      body.innerHTML = h;
      const show = (sid) => {
        const sk = GD.skills[sid], mods = G.skillMods(sid), lv = G.skill(sid), tiers = sk.levelNames || (GD.skills.levelNames) || [];
        $('#skilldesc').innerHTML = '<b style="color:' + sk.color + ';letter-spacing:.15em">' + esc(sk.name.toUpperCase()) + '</b> — level ' + lv + '<br>' + esc(sk.blurb || '') + '<br><i style="color:var(--dim)">' + esc(sk.voice || '') + '</i>' + (mods.length ? '<br><small>' + mods.map((m) => esc(m.label) + ' ' + (m.n > 0 ? '+' : '') + m.n).join(' · ') + '</small>' : '');
      };
      body.querySelectorAll('.skillrow').forEach((r) => (r.onmouseenter = () => show(r.dataset.skill)));
      body.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => G.spendPoint(b.dataset.up)));
    } else if (panelKind === 'inventory') {
      const ids = Object.keys(S.items);
      let h = '<h2 class="ptitle">Inventory</h2><div class="psub">' + ids.length + ' items. Apparel can be worn; consumables can be used.</div><div class="grid-items">';
      if (!ids.length) h += '<div class="psub">Your pockets contain lint and mild dread.</div>';
      ids.forEach((id) => { h += '<div class="item' + (selItem === id ? ' sel' : '') + (S.equipped[id] ? ' eq' : '') + '" data-id="' + id + '"><canvas width="56" height="56"></canvas>' + esc((GD.items[id] || { name: id }).name) + '</div>'; });
      h += '</div><div class="idesc" id="idesc">' + (selItem && S.items[selItem] ? itemDesc(selItem) : 'Select an item.') + '</div>';
      body.innerHTML = h;
      body.querySelectorAll('.item').forEach((el) => { const c = el.querySelector('canvas').getContext('2d'); A.drawItemIcon(c, 0, 0, 56, el.dataset.id); el.onclick = () => { selItem = el.dataset.id; renderPanel(); }; });
      const u = body.querySelector('[data-use]'); if (u) u.onclick = () => { G.useItem(u.dataset.use); };
    } else if (panelKind === 'journal') {
      let h = '<h2 class="ptitle">Journal</h2><div class="psub">Tasks and what you know.</div>';
      const order = { active: 0, done: 1, failed: 2 };
      const list = Object.entries(S.tasks).filter(([id, t]) => t.state !== 'none' && GD.tasks[id]).sort((a, b) => order[a[1].state] - order[b[1].state] || (GD.tasks[a[0]].category === 'main' ? -1 : 1));
      if (!list.length) h += '<div class="psub">Nothing yet.</div>';
      list.forEach(([id, t]) => { const d = GD.tasks[id]; h += '<div class="task ' + t.state + '"><h4>' + (t.state === 'done' ? '✔ ' : t.state === 'failed' ? '✘ ' : '') + esc(d.title) + ' <small style="color:var(--dim)">' + (d.category || '') + '</small></h4><p>' + esc(d.summary || d.description || '') + '</p><ul>' + t.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul></div>'; });
      body.innerHTML = h;
    } else if (panelKind === 'thoughts') {
      const slots = S.thoughtSlots, res = Object.entries(S.thoughts).filter(([, t]) => t.state === 'researching');
      let h = '<h2 class="ptitle">Notebook of Unsanctioned Thoughts</h2><div class="psub">Thoughts take time to internalize. They change you — usually both ways. Time only passes when you act.</div><div class="slots">';
      for (let i = 0; i < slots; i++) { const r = res[i]; if (r) { const d = GD.thoughts[r[0]], pct = Math.round((1 - r[1].remaining / r[1].total) * 100); h += '<div class="slot full"><b>' + esc(d.name) + '</b><br>' + esc(d.problem || '') + '<div class="prog"><i style="width:' + pct + '%"></i></div><button class="pbtn" data-forget="' + r[0] + '" style="padding:2px 8px;font-size:11px">forget</button></div>'; } else h += '<div class="slot">Empty slot</div>'; }
      h += '</div>';
      G.slotUnlocks().forEach((u, i) => { const free = G.evalCond(u.cond); h += '<div class="psub">' + esc(u.label) + ' <button class="pbtn" data-slot="' + (free ? 'free' : 'pay') + '" ' + (!free && S.points < u.xp ? 'disabled' : '') + '>' + (free ? 'Unlock slot' : 'Pay ' + u.xp + ' skill points') + '</button></div>'; });
      const known = Object.entries(S.thoughts).filter(([, t]) => t.state === 'known'), done = Object.entries(S.thoughts).filter(([, t]) => t.state === 'internalized');
      h += '<h3 style="letter-spacing:.15em;color:var(--dim)">UNRESOLVED</h3>' + (known.length ? '' : '<div class="psub">No thoughts waiting.</div>');
      known.forEach(([id]) => { const d = GD.thoughts[id]; h += '<div class="thought"><h4>' + esc(d.name) + '</h4><p>' + esc(d.problem || d.discover || '') + '</p><p class="mods">' + esc(modText(d)) + '</p><button class="pbtn" data-think="' + id + '" ' + (G.usedSlots() >= slots ? 'disabled' : '') + '>Think about it (' + (d.minutes || d.research || 90) + ' min)</button></div>'; });
      h += '<h3 style="letter-spacing:.15em;color:var(--dim)">INTERNALIZED</h3>' + (done.length ? '' : '<div class="psub">None yet.</div>');
      done.forEach(([id]) => { const d = GD.thoughts[id]; h += '<div class="thought"><h4>' + esc(d.name) + '</h4><p>' + esc(d.solution || '') + '</p><p class="mods">' + esc(modText(d)) + '</p></div>'; });
      body.innerHTML = h;
      body.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => G.unlockSlot(G.slotUnlocks()[0], b.dataset.slot === 'pay')));
      body.querySelectorAll('[data-think]').forEach((b) => (b.onclick = () => G.startThought(b.dataset.think)));
      body.querySelectorAll('[data-forget]').forEach((b) => (b.onclick = () => G.forgetThought(b.dataset.forget)));
    } else if (panelKind === 'menu') {
      body.innerHTML = '<h2 class="ptitle">Menu</h2><div class="menu-btns"><button class="pbtn" id="mn-res">Resume</button><button class="pbtn" id="mn-save">Save now</button><button class="pbtn" id="mn-snd">Sound: ' + (Sound.muted ? 'Off' : 'On') + '</button>' + ['music:Music', 'sfx:Effects', 'amb:Ambience'].map((x) => { const [k, n] = x.split(':'); return '<label style="font-size:13px;color:var(--dim);display:flex;gap:10px;align-items:center">' + n + '<input type="range" min="0" max="1" step="0.05" value="' + Sound.vol[k] + '" data-vol="' + k + '" style="flex:1"></label>'; }).join('') + '<button class="pbtn" id="mn-res2" style="display:none"></button><button class="pbtn" id="mn-help">How to play</button><button class="pbtn" id="mn-title">Quit to title</button></div><p class="psub" style="margin-top:20px">The game autosaves after every conversation and every move between rooms.</p>';
      $('#mn-res').onclick = closePanel; $('#mn-save').onclick = () => { G.save(); closePanel(); G.emit('toast', { text: 'Saved.', kind: 'info' }); };
      $('#mn-snd').onclick = () => { Sound.toggle(); renderPanel(); }; document.querySelectorAll('[data-vol]').forEach((r) => (r.oninput = () => { Sound.set(r.dataset.vol, parseFloat(r.value)); })); $('#mn-help').onclick = showHelp; $('#mn-title').onclick = () => { G.save(); location.reload(); };
    }
  }
  function modText(d) { const m = d.mods || {}; return Object.entries(m).map(([k, v]) => (GD.skills[k] ? GD.skills[k].name : k) + ' ' + (v > 0 ? '+' : '') + v).join(' · '); }
  function itemDesc(id) {
    const it = GD.items[id], S = G.S; const mods = it.mods ? Object.entries(it.mods).map(([k, v]) => GD.skills[k].name + ' ' + (v > 0 ? '+' : '') + v).join(' · ') : '';
    let h = '<b>' + esc(it.name) + '</b><br>' + esc(it.desc || '') + (mods ? '<br><small style="color:#8fcf8a">' + esc(mods) + '</small>' : '');
    if (it.type === 'apparel') h += '<br><button data-use="' + id + '">' + (S.equipped[id] ? 'Take off' : 'Wear') + '</button>';
    else if (it.usable) h += '<br><button data-use="' + id + '">Use</button>';
    return h;
  }
  function showHelp() {
    $('#panel').classList.remove('hidden'); panelKind = 'help';
    $('#panel-body').innerHTML = '<h2 class="ptitle">How to Play</h2><div style="line-height:1.7;max-width:760px"><p><b>Explore.</b> Click the floor to walk. Click people and objects (they glow green when hovered; hold <kbd>Tab</kbd> to show them all). Doors take you between rooms.</p><p><b>Talk.</b> Pick lines with the mouse or number keys. Your 24 skills are voices in your head; they chime in with passive observations when they are strong enough.</p><p><b>Checks.</b> Skill checks roll 2d6 + skill against a difficulty. <b>White</b> checks can be retried once the skill improves. <b>Red</b> checks happen once, ever.</p><p><b>Grow.</b> Successes earn XP; every few XP is a skill point (Character, <kbd>C</kbd>). Thoughts (<kbd>T</kbd>) cost time and reshape your skills.</p><p><b>Watch the clock.</b> Time passes when you walk, talk and think. The exam is at 17:00. Curfew is 21:00 — when the Bell rings, the Static takes you.</p><p><b>Watch yourself.</b> Defiance, shortcuts and snooping raise <b>Watched</b>. At 100 you are arrested. Body or Nerve at zero and you black out for hours.</p><p>Keys: <kbd>I</kbd> inventory · <kbd>J</kbd> journal · <kbd>T</kbd> thoughts · <kbd>C</kbd> character · <kbd>Esc</kbd> menu · <kbd>1-9</kbd> dialogue choices.</p></div>';
  }
  $('#btn-how').onclick = () => { $('#title').classList.add('hidden'); showHelp(); const c = $('#panel-close'); c.onclick = () => { closePanel(); if (!started) $('#title').classList.remove('hidden'); c.onclick = closePanel; }; };

  // ---------- title / creation ----------
  function refreshTitle() {
    $('#btn-continue').disabled = !G.hasSave();
    const seen = G.endingsSeen(), names = { end_good_student: 'The Good Student', end_ledger: 'The Ledger', end_static: 'Static', end_quiet: 'The Quiet Way', end_arrested: 'Arrested', end_curfew: 'Curfew' };
    $('#endings-seen').textContent = 'Endings found: ' + seen.length + ' / 6' + (seen.length ? ' — ' + seen.map((e) => names[e]).join(', ') : '');
    $('#btn-sound').textContent = 'Sound: ' + (Sound.muted ? 'Off' : 'On');
  }
  refreshTitle();
  $('#btn-sound').onclick = () => { Sound.init(); Sound.toggle(); refreshTitle(); };
  $('#btn-continue').onclick = () => { Sound.init(); if (G.load()) beginPlay(); };
  $('#btn-new').onclick = () => { Sound.init(); showCreate(); };
  function beginPlay() { started = true; document.body.classList.add('playing'); $('#title').classList.add('hidden'); $('#create').classList.add('hidden'); $('#hud').classList.remove('hidden'); $('#hint').style.display = 'block'; setTimeout(() => ($('#hint').style.display = 'none'), 9000); refreshHud(); rendererLoc = null; cam.x = cam.y = 0; snapCamera(); }
  function snapCamera() { const l = G.loc(), p = A.project(l, G.S.px, G.S.py); cam.x = p.sx; cam.y = p.sy - 30; }
  function showCreate() {
    $('#title').classList.add('hidden'); const box = $('#create'); box.classList.remove('hidden');
    const archs = Object.values(GD.archetypes || {}); let sel = archs[0] ? archs[0].id : 'custom', name = GD.meta.defaultName;
    let attrs = Object.assign({ intellect: 3, psyche: 3, physique: 3, motorics: 3 }, archs[0] ? archs[0].attributes || archs[0].attrs : {});
    let look = Object.assign({}, GD.playerLook);
    const skins = ['#f0cdb0', '#d9a98a', '#b88a6a', '#8d5d43', '#5e3b2a'], hairs = ['#2a1d18', '#a2723a', '#d8d2c8', '#1a1a1a', '#7a2f22'], styles = ['short', 'long', 'bun', 'curly', 'buzz', 'braid', 'bob', 'slick', 'bald', 'cap'];
    function render() {
      const a = archs.find((x) => x.id === sel);
      const pts = Object.values(attrs).reduce((s, v) => s + v, 0);
      let h = '<h2 class="ptitle">Who are you, exactly?</h2><div class="psub">Seventeen. Third-year student, School No. 9. Your file says "reliable." Your head says "ringing."</div>';
      h += '<div class="crow"><canvas id="cp" width="128" height="128" style="width:110px;height:110px;border-radius:50%;border:3px solid #8a7a4a;image-rendering:pixelated"></canvas><div><div>Name <input type="text" id="cn" value="' + esc(name) + '" maxlength="22"></div>';
      h += '<div style="margin-top:8px;font-size:13px">Skin ' + skins.map((c) => '<button class="cbtn" data-skin="' + c + '" style="background:' + c + ';width:22px;height:22px;padding:0;border:' + (look.skin === c ? '3px solid #6fe39a' : '1px solid #000') + '"></button>').join(' ') + ' &nbsp;Hair ' + hairs.map((c) => '<button class="cbtn" data-hair="' + c + '" style="background:' + c + ';width:22px;height:22px;padding:0;border:' + (look.hair === c ? '3px solid #6fe39a' : '1px solid #888') + '"></button>').join(' ') + ' &nbsp;<button class="cbtn" id="cstyle" style="padding:2px 8px;font-size:12px">Style: ' + look.hairStyle + '</button> <button class="cbtn" id="cglass" style="padding:2px 8px;font-size:12px">Glasses: ' + (look.glasses ? 'yes' : 'no') + '</button></div></div></div>';
      h += '<div class="arch-grid">' + archs.map((x) => '<div class="arch' + (sel === x.id ? ' sel' : '') + '" data-a="' + x.id + '"><h4>' + esc(x.name) + '</h4><p>' + esc(x.description || x.desc || '') + '</p><div class="at">' + Object.entries(x.attributes || x.attrs || {}).map(([k, v]) => k.slice(0, 3).toUpperCase() + ' ' + v).join(' · ') + '</div></div>').join('') + '<div class="arch' + (sel === 'custom' ? ' sel' : '') + '" data-a="custom"><h4>Self-made</h4><p>Distribute 12 points across four attributes (1–5 each) yourself.</p></div></div>';
      if (sel === 'custom') h += '<div class="crow">' + Object.keys(GD.attributes).map((k) => '<div style="min-width:200px"><b style="color:' + GD.attributes[k].color + '">' + esc(GD.attributes[k].name) + '</b> <button class="cbtn" data-d="-' + k + '" style="padding:0 10px">−</button> ' + attrs[k] + ' <button class="cbtn" data-d="+' + k + '" style="padding:0 10px">+</button></div>').join('') + '<span style="color:' + (pts === 12 ? '#8fe08a' : '#e0705a') + '">Points: ' + pts + ' / 12</span></div>';
      h += '<div class="crow"><button class="cbtn" id="cgo" ' + (sel === 'custom' && pts !== 12 ? 'disabled' : '') + '>Wake up ▸</button><button class="cbtn" id="cback">Back</button></div>';
      $('#create-inner').innerHTML = h;
      A.drawPortrait($('#cp'), look, {});
      $('#cn').oninput = (e) => (name = e.target.value);
      document.querySelectorAll('[data-skin]').forEach((b) => (b.onclick = () => { look.skin = b.dataset.skin; render(); }));
      document.querySelectorAll('[data-hair]').forEach((b) => (b.onclick = () => { look.hair = b.dataset.hair; render(); }));
      $('#cstyle').onclick = () => { look.hairStyle = styles[(styles.indexOf(look.hairStyle) + 1) % styles.length]; render(); };
      $('#cglass').onclick = () => { look.glasses = !look.glasses; render(); };
      document.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { sel = b.dataset.a; const ar = archs.find((x) => x.id === sel); if (ar) attrs = Object.assign({}, ar.attributes || ar.attrs); render(); }));
      document.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { const k = b.dataset.d.slice(1), d = b.dataset.d[0] === '+' ? 1 : -1; if (attrs[k] + d >= 1 && attrs[k] + d <= 5) attrs[k] += d; render(); }));
      $('#cback').onclick = () => { box.classList.add('hidden'); $('#title').classList.remove('hidden'); };
      $('#cgo').onclick = () => {
        const ar = archs.find((x) => x.id === sel); box.classList.add('hidden');
        G.newGame({ name: (name || GD.meta.defaultName).trim(), look, attrs, archetype: sel, learned: ar && ar.signature ? Object.assign({}, ar.signature) : ar && ar.learned ? Object.assign({}, ar.learned) : {} });
        beginPlay();
      };
    }
    render();
  }

  // ---------- endings ----------
  const ENDNAMES = { end_good_student: 'THE GOOD STUDENT', end_ledger: 'THE LEDGER', end_static: 'STATIC', end_quiet: 'THE QUIET WAY', end_arrested: 'ARRESTED', end_curfew: 'CURFEW' };
  G.on('ending', (id) => { $('#ending').classList.remove('hidden'); $('#hud').classList.add('hidden'); $('#ending-summary').classList.add('hidden'); window.Sound && (Sound.play('bell'), Sound.ending(id)); });
  G.on('endingDone', (id) => showSummary(id));
  G.on('dialogueEnd', (D) => { if (D.isEnding) setTimeout(() => showSummary(G.S.ending), 300); });
  function showSummary(id) {
    const S = G.S, el = $('#ending-summary'); document.body.classList.remove('endmode');
    el.innerHTML = '<h2>' + (ENDNAMES[id] || 'THE END') + '</h2><p>' + esc(S.name) + ' · ' + fmtTime(S.time) + ' · checks passed ' + S.stats.passed + ' / failed ' + S.stats.failed + ' · thoughts internalized ' + Object.values(S.thoughts).filter((t) => t.state === 'internalized').length + ' · Watched ' + S.surv + '%</p><p style="color:var(--dim)">Endings found: ' + G.endingsSeen().length + ' of 6. There is more than one way to get through a Tuesday.</p><button class="cbtn" id="again">Return to title</button>';
    el.classList.remove('hidden'); $('#again').onclick = () => location.reload();
  }

  // ambient inner-voice barks
  setInterval(() => {
    if (!started || !G.S || G.D || G.S.ending || !$('#panel').classList.contains('hidden')) return;
    const S = G.S; let pickB = null;
    const sit = GD.situationBarks || {};
    const pool = S.hp <= 3 ? sit.lowHp : S.morale <= 3 ? sit.lowMorale : S.surv >= 66 ? sit.highSurv : GD.meta.curfew - S.time < 90 ? sit.curfewSoon : Math.random() < 0.3 ? sit.idle : null;
    if (pool && pool.length) { const b = pool[Math.floor(Math.random() * pool.length)]; pickB = { skill: b.skill, text: b.text }; }
    else { const ids = Object.keys(GD.barks || {}).filter((k) => G.skill(k) >= 3 && GD.skills[k]); if (!ids.length) return; const k = ids[Math.floor(Math.random() * ids.length)], arr = GD.barks[k]; pickB = { skill: k, text: arr[Math.floor(Math.random() * arr.length)] }; }
    if (!pickB || !GD.skills[pickB.skill]) return;
    const box = $('#toasts'), d = document.createElement('div'); d.className = 'toast'; d.style.borderColor = GD.skills[pickB.skill].color; d.innerHTML = '<b style="color:' + GD.skills[pickB.skill].color + ';font-size:11px;letter-spacing:.15em">' + esc(GD.skills[pickB.skill].name.toUpperCase()) + '</b><br><i>' + esc(G.sub(pickB.text)) + '</i>'; box.appendChild(d); setTimeout(() => d.remove(), 5200);
  }, 38000);

  // debug hook
  if (location.search.includes('debug')) { window.G = G; }
})();
