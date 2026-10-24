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
  // dialogue column docks on the right on desktop-sized screens (must match the CSS breakpoint)
  const dockMQ = window.matchMedia ? matchMedia('(min-width: 900px) and (min-height: 521px)') : { matches: true };
  const dockedRight = () => dockMQ.matches;
  let dockW = 0, dockWAt = 0;
  const dockWidth = () => { const t = performance.now(); if (t - dockWAt > 500) { dockWAt = t; const d = $('#dialogue'); dockW = (d && d.offsetWidth) || Math.min(620, Math.max(380, W * 0.35)); } return dockW; };

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
      const docked = dlgOpen && dockedRight();
      const focusY = dlgOpen && !docked ? H * 0.28 : H / 2;
      const focusX = docked ? (W - dockWidth()) / 2 : W / 2;
      let tx = p.sx + (W / 2 - focusX) / zoom, ty = p.sy - 30 + (H / 2 - focusY) / zoom;
      const halfW = W / 2 / zoom, halfH = H / 2 / zoom;
      const visW = (docked ? W - dockWidth() : W) / zoom, shiftX = (W / 2 - focusX) / zoom;   // visible scene width beside the dialogue dock
      if (ws.w < visW) tx = ws.w / 2 + shiftX; else tx = Math.max(halfW, Math.min(ws.w - visW + halfW, tx));
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
    if (G.D) { const n = parseInt(e.key, 10); if (n >= 1 && n <= 9) pickChoice(n - 1); if ((e.key === ' ' || e.key === 'Enter') && !rollTimer) { if (G.D.roll) G.continueRoll(); else if (G.D.choices.length === 1) pickChoice(0); } return; }
    const k = e.key.toLowerCase();
    if (k === 'i') togglePanel('inventory'); else if (k === 'j') togglePanel('journal'); else if (k === 't') togglePanel('thoughts'); else if (k === 'c') togglePanel('character'); else if (k === 'escape') togglePanel('menu');
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Tab') highlightAll = false; });

  const hl = $('#hl-btn'); hl.onclick = () => { highlightAll = !highlightAll; hl.classList.toggle('on', highlightAll); };
  $('#rot-ok').onclick = () => $('#rotate').classList.add('hidden');
  document.addEventListener('dblclick', (e) => e.preventDefault());

  // ---------- toasts ----------
  const toastQ = []; let toastBusy = false;
  const TOAST_LABEL = { good: 'Body &amp; mind', bad: 'Body &amp; mind', xp: 'Experience', item: 'Item', thought: 'Thought cabinet', task: 'Journal', warn: 'Warning', bell: 'The bell' };
  function showToast(t) {
    const box = $('#toasts'), d = document.createElement('div'); d.className = 'toast ' + (t.kind || '');
    const lbl = TOAST_LABEL[t.kind]; d.innerHTML = (lbl ? '<span class="tk">' + lbl + '</span>' : '') + esc(t.text); box.appendChild(d);
    setTimeout(() => d.remove(), 5200);
    const tk = { good: 'good', xp: 'xp', bad: 'bad', warn: 'warn', item: 'pickup', thought: 'thought', task: 'paper', info: 'toast' }[t.kind]; if (tk) snd(tk);
  }
  function pumpToasts() { if (toastBusy) return; toastBusy = true; const go = () => { const t = toastQ.shift(); if (!t) { toastBusy = false; return; } showToast(t); setTimeout(go, 900); }; go(); }
  G.on('toast', (t) => { toastQ.push(t); pumpToasts(); });
  G.on('sfx', (n) => snd(n));
  G.on('step', () => window.Sound && Sound.step((G.loc() || {}).floor));
  document.addEventListener('pointerdown', () => { if (window.Sound) { Sound.init(); } }, { once: false });
  if (window.Sound) Sound.scene('title');

  // ---------- HUD ----------
  function refreshHud() {
    const S = G.S; if (!S) return;
    setPips($('#m-hp'), S.hp); setPips($('#m-morale'), S.morale); $('#m-surv').style.width = S.surv + '%';
    $('#surv-n').textContent = Math.round(S.surv); $('#topright').classList.toggle('hot', S.surv >= 66); $('#hud-name').textContent = S.name || '';
    $('#clock').textContent = fmtTime(S.time); const dn = (GD.meta.days[S.day || 1] || {}); $('#dayname').textContent = 'DAY ' + (S.day || 1) + ' · ' + (dn.name || '').toUpperCase(); if (window.Sound) Sound.tension(S.surv, S.hp, S.morale);
    const rem = GD.meta.curfew - S.time; $('#curfew').textContent = rem > 0 ? 'Curfew in ' + Math.floor(rem / 60) + 'h ' + String(rem % 60).padStart(2, '0') + 'm' : 'CURFEW';
    $('#locname').textContent = G.loc().name;
    $('#pt-dot').classList.toggle('hidden', S.points <= 0);
    // task tracker
    const act = Object.entries(S.tasks).filter(([id, t]) => t.state === 'active' && GD.tasks[id]).sort((a, b) => (GD.tasks[a[0]].category === 'main' ? 0 : 1) - (GD.tasks[b[0]].category === 'main' ? 0 : 1)).slice(0, 3);
    $('#tasktrack').innerHTML = act.length ? '<b>TASKS</b>' + act.map(([id]) => '<span class="tt">' + esc(GD.tasks[id].title) + '</span>').join('') : '';
    if (!drawnPortrait || drawnPortrait !== S.morale + ':' + S.hp) { drawnPortrait = S.morale + ':' + S.hp; A.drawPortrait($('#portrait'), S.look, { mood: S.morale <= 3 ? 'sad' : S.hp <= 3 ? 'shock' : 'neutral' }); }
    if (!$('#panel').classList.contains('hidden')) renderPanel();
  }
  let drawnPortrait = null;
  function setPips(el, v) {
    const n = Math.max(0, Math.min(10, Math.round(v)));
    if (el.childElementCount !== 10) el.innerHTML = '<i></i>'.repeat(10);
    [...el.children].forEach((p, i) => p.classList.toggle('on', i < n));
    el.classList.toggle('low', n <= 3); el.setAttribute('aria-valuenow', n); el.title = n + ' / 10';
  }

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
    if (b.kind === 'choice') return '<div class="chosen"><span class="who">' + esc(((G.S && G.S.name) || 'You').toUpperCase()) + '</span><span class="dash">—</span>' + md(b.text) + '</div>';
    if (b.kind === 'roll') return rollHtml(b.roll, b.resolved);
    const sp = b.speaker, isSkill = sp.kind === 'skill';
    const cls = 'line' + (b.voice || isSkill ? ' voice' : '') + (b.passive ? ' passive' : '') + (sp.kind === 'narrator' ? ' narr' : '') + (sp.kind === 'you' ? ' you' : '');
    const who = sp.name ? '<span class="who" style="color:' + sp.color + '">' + esc(sp.name) + (isSkill ? '<small>' + (b.passive ? '[passive · ' + sp.level + ']' : '[' + sp.level + ']') + '</small>' : '') + '</span><span class="dash">—</span>' : '';
    return '<div class="' + cls + '"' + (isSkill ? ' style="--c:' + sp.color + '"' : '') + '>' + who + '<span class="txt">' + md(b.text) + '</span></div>';
  }
  const dieHtml = (v) => '<span class="die" data-v="' + v + '">' + '<i></i>'.repeat(9) + '</span>';
  const chkHtml = (c, noName) => '<span class="chk ' + (c.white ? 'white' : 'red') + '" style="--c:' + c.color + '" title="' + (c.white ? 'White check — can be retried after the skill improves' : 'Red check — one chance only') + '">' + (noName ? (c.white ? 'White · ' : 'Red · ') : '<span class="sk">' + esc(c.skillName) + '</span>') + esc(c.word) + ' ' + c.diff + (c.chance != null ? ' <span class="pc">' + c.chance + '%</span>' : '') + '</span>';
  function rollHtml(r, resolved) {
    const res = r.crit ? 'Critical success' : r.fumble ? 'Critical failure' : r.success ? 'Success' : 'Failure';
    const rnd = () => 1 + Math.floor(Math.random() * 6);
    return '<div class="roll ' + (resolved ? (r.success ? 'ok' : 'no') : 'rolling') + '" data-roll style="--c:' + r.color + '">'
      + '<div class="dice">' + dieHtml(resolved ? r.d1 : rnd()) + dieHtml(resolved ? r.d2 : rnd()) + '</div>'
      + '<div class="rhead"><span class="sk">' + esc(r.skillName) + '</span>' + chkHtml(r, true) + '</div>'
      + '<div class="rmath">' + (resolved ? r.d1 + ' + ' + r.d2 : '? + ?') + ' + skill ' + r.level + ' = <b>' + (resolved ? r.total : '…') + '</b> <span style="color:var(--dim)">vs ' + r.diff + '</span></div>'
      + '<div class="res">' + (resolved ? res : '') + '</div></div>';
  }
  let staggerN = 0, tumbleTimer = null;
  function renderDialogue(D) {
    const log = $('#dlg-log'); staggerN = 0;
    // newly added blocks
    for (let i = renderedCount; i < D.history.length; i++) {
      const b = D.history[i]; const wrap = document.createElement('div');
      if (b.kind === 'roll' && !b.resolved) {
        wrap.innerHTML = rollHtml(b.roll, false); log.appendChild(wrap);
        snd('dice');
        $('#dlg-choices').innerHTML = '';
        clearInterval(tumbleTimer);
        tumbleTimer = setInterval(() => wrap.querySelectorAll('.die').forEach((d) => (d.dataset.v = 1 + Math.floor(Math.random() * 6))), 90);
        rollTimer = setTimeout(() => { rollTimer = null; clearInterval(tumbleTimer); b.resolved = true; wrap.innerHTML = rollHtml(b.roll, true); snd(b.roll.crit ? 'crit' : b.roll.fumble ? 'fumble' : b.roll.success ? 'good' : 'bad'); showRollContinue(); log.scrollTop = log.scrollHeight; }, 1100);
      } else {
        wrap.innerHTML = lineHtml(b); log.appendChild(wrap);
        if (b.voice) { wrap.style.opacity = 0; const dly = 500 + (staggerN++) * 900; setTimeout(() => { wrap.style.transition = 'opacity .5s'; wrap.style.opacity = 1; snd('whisper'); log.scrollTop = log.scrollHeight; }, dly); }
        else if (b.kind === 'line') snd('line');
      }
    }
    renderedCount = D.history.length;
    if (!D.roll) renderChoices(D);
    log.scrollTop = log.scrollHeight;
  }
  function showRollContinue() {
    const box = $('#dlg-choices'); box.innerHTML = '';
    const b = document.createElement('button'); b.className = 'choice cont'; b.innerHTML = '<span class="n">▸</span><span class="ct">Continue.</span>'; b.onclick = () => { G.continueRoll(); }; box.appendChild(b);
    if (!isTouch) b.focus({ preventScroll: true });
  }
  function renderChoices(D) {
    const box = $('#dlg-choices'); box.innerHTML = '';
    D.choices.forEach((c, idx) => {
      const b = document.createElement('button'); b.className = 'choice' + (c.locked ? ' locked' : '') + (c.cont ? ' cont' : '') + (c.check ? ' check' : '');
      const tag = c.check ? chkHtml(c.check) : '';
      b.innerHTML = '<span class="n">' + (idx + 1) + '.</span><span class="ct">' + tag + md(c.text) + (c.locked ? ' <small>(' + esc(c.locked) + ')</small>' : '') + '</span>';
      if (c.locked) b.setAttribute('aria-disabled', 'true'); else b.onclick = () => pickChoice(idx);
      box.appendChild(b);
    });
  }
  function pickChoice(idx) { if (rollTimer) return; snd('click'); G.choose(idx); }

  // ---------- settings ----------
  let textSize = 0; try { textSize = parseInt(localStorage.getItem('lastbell_text') || '0', 10) || 0; } catch (e) {}
  function applyTextSize() { document.body.classList.toggle('bigtext', textSize === 1); document.body.classList.toggle('xbigtext', textSize === 2); }
  applyTextSize();

  // ---------- panels ----------
  let panelKind = null, selItem = null, selSkill = null;
  function togglePanel(k) { if (panelKind === k && !$('#panel').classList.contains('hidden')) closePanel(); else { panelKind = k; $('#panel').classList.remove('hidden'); renderPanel(); snd('open'); } }
  function closePanel() { $('#panel').classList.add('hidden'); panelKind = null; }
  $('#panel-close').onclick = closePanel;
  $('#panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
  document.querySelectorAll('#menubar button').forEach((b) => (b.onclick = () => { if (G.D) return; window.Sound && Sound.init(); togglePanel(b.dataset.panel); }));
  const LOCK_SVG = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.2"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9"/><path d="M12 14.4v2.4"/></svg>';
  function renderPanel() {
    const body = $('#panel-body'), S = G.S;
    $('#panel').dataset.kind = panelKind || '';
    if (panelKind === 'character') {
      const xpp = (GD.rules && GD.rules.xpPerPoint) || 6, cap = (GD.rules && GD.rules.skillCap) || 10;
      const arch = S.archetype === 'custom' ? 'Self-made student' : ((GD.archetypes || {})[S.archetype] || {}).name || '';
      let h = '<header class="phead"><div><div class="kicker">Student file</div><h2 class="ptitle">' + esc(S.name) + '</h2><div class="psub">' + esc(arch) + '</div></div><div class="stats">'
        + '<div class="stat' + (S.points > 0 ? ' hot' : '') + '"><b>' + S.points + '</b><span>Skill points</span></div>'
        + '<div class="stat"><b>' + S.xp + '/' + xpp + '</b><span>XP</span></div>'
        + '<div class="stat"><b>' + S.stats.passed + '</b><span>Passed</span></div>'
        + '<div class="stat"><b>' + S.stats.failed + '</b><span>Failed</span></div></div></header><div class="attrgrid">';
      for (const aid of Object.keys(GD.attributes)) {
        const at = GD.attributes[aid];
        h += '<section class="attrcol" style="--c:' + at.color + '" title="' + esc(at.blurb || '') + '"><h3><span>' + esc(at.name) + '</span><span class="av">' + S.attrs[aid] + '</span></h3>';
        for (const sid of Object.keys(GD.skills).filter((s) => GD.skills[s].attribute === aid)) {
          const sk = GD.skills[sid], lv = G.skill(sid), base = G.skillBase(sid) + (S.learned[sid] || 0);
          let pips = ''; for (let i = 0; i < cap; i++) pips += '<i class="' + (i < Math.min(lv, base) ? 'on' : i < lv ? 'bonus' : i < base ? 'pen' : '') + '"></i>';
          h += '<div class="skillrow' + (selSkill === sid ? ' sel' : '') + '" data-skill="' + sid + '" tabindex="0" style="--c:' + sk.color + '" title="' + esc(sk.blurb || '') + '">'
            + '<span class="mono">' + esc(sk.icon || sk.name.slice(0, 2)) + '</span>'
            + '<span class="sk-main"><span class="nm">' + esc(sk.name) + '</span><span class="lvpips">' + pips + '</span></span>'
            + '<span class="lv">' + lv + (lv !== base ? '<sup style="color:' + (lv > base ? 'var(--green)' : '#ec7458') + '">' + (lv > base ? '+' : '') + (lv - base) + '</sup>' : '') + '</span>'
            + '<button data-up="' + sid + '" aria-label="Raise ' + esc(sk.name) + '" title="Spend a skill point" ' + (S.points <= 0 || base >= cap ? 'disabled' : '') + '>+</button></div>';
        }
        h += '</section>';
      }
      h += '</div><div id="skilldesc">Hover or tap a skill to hear it clear its throat.</div><div class="ideo">Ideology ' + ['vanguard', 'undercurrent', 'quiet'].map((k) => { const d = (GD.ideologies || {})[k] || { name: k, color: '#aaa' }; return '<span style="color:' + d.color + '">' + esc(d.name) + '<b>' + S.ideo[k] + '</b></span>'; }).join('') + '</div>';
      body.innerHTML = h;
      const show = (sid) => {
        const sk = GD.skills[sid], mods = G.skillMods(sid), lv = G.skill(sid), box = $('#skilldesc');
        selSkill = sid; body.querySelectorAll('.skillrow').forEach((r) => r.classList.toggle('sel', r.dataset.skill === sid));
        box.style.setProperty('--c', sk.color);
        box.innerHTML = '<div class="sd-h"><span class="sd-n">' + esc(sk.name.toUpperCase()) + '</span><span class="sd-l">Level ' + lv + (GD.levelName ? ' — ' + esc(GD.levelName(lv)) : '') + '</span></div>' + esc(sk.blurb || '') + '<div class="sd-v">' + esc(sk.voice || '') + '</div>' + (mods.length ? '<div class="sd-m">' + mods.map((m) => '<span>' + esc(m.label) + ' ' + (m.n > 0 ? '+' : '') + m.n + '</span>').join('') + '</div>' : '');
      };
      body.querySelectorAll('.skillrow').forEach((r) => { r.onmouseenter = () => show(r.dataset.skill); r.onfocus = () => show(r.dataset.skill); r.onclick = () => show(r.dataset.skill); });
      body.querySelectorAll('[data-up]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); G.spendPoint(b.dataset.up); }));
      if (selSkill && GD.skills[selSkill]) show(selSkill);
    } else if (panelKind === 'inventory') {
      const ids = Object.keys(S.items);
      let h = '<header class="phead"><div><div class="kicker">Pockets &amp; satchel</div><h2 class="ptitle">Inventory</h2><div class="psub">' + ids.length + ' item' + (ids.length === 1 ? '' : 's') + '. Apparel can be worn; consumables can be used.</div></div></header><div class="inv-wrap"><div class="grid-items">';
      if (!ids.length) h += '<div class="psub none">Your pockets contain lint and mild dread.</div>';
      const TY = { apparel: 'Apparel', key: 'Key', consumable: 'Consumable', document: 'Document', tool: 'Tool' };
      ids.forEach((id) => { const it = GD.items[id] || { name: id }; h += '<div class="item' + (selItem === id ? ' sel' : '') + (S.equipped[id] ? ' eq' : '') + '" data-id="' + id + '" tabindex="0" role="button" aria-pressed="' + (selItem === id) + '">' + (S.equipped[id] ? '<span class="worn">Worn</span>' : '') + '<canvas width="128" height="128"></canvas><span>' + esc(it.name) + '</span><span class="ty">' + esc(TY[it.type] || it.type || (it.usable ? 'Usable' : 'Item')) + '</span></div>'; });
      h += '</div><div class="idesc" id="idesc">' + (selItem && S.items[selItem] ? itemDesc(selItem) : '<span class="empty">Select an item to turn it over in your hands.</span>') + '</div></div>';
      body.innerHTML = h;
      body.querySelectorAll('.item').forEach((el) => { const c = el.querySelector('canvas').getContext('2d'); A.drawItemIcon(c, 0, 0, 128, el.dataset.id); el.onclick = () => { selItem = el.dataset.id; renderPanel(); }; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } }; });
      const ic = body.querySelector('.id-ic'); if (ic) A.drawItemIcon(ic.getContext('2d'), 0, 0, 144, selItem);
      const u = body.querySelector('[data-use]'); if (u) u.onclick = () => { G.useItem(u.dataset.use); };
    } else if (panelKind === 'journal') {
      let h = '<header class="phead"><div><div class="kicker">Exercise book · property of ' + esc(S.name) + '</div><h2 class="ptitle">Journal</h2><div class="psub">Tasks and what you know.</div></div></header>';
      const order = { active: 0, done: 1, failed: 2 };
      const list = Object.entries(S.tasks).filter(([id, t]) => t.state !== 'none' && GD.tasks[id]).sort((a, b) => order[a[1].state] - order[b[1].state] || (GD.tasks[a[0]].category === 'main' ? -1 : 1));
      const taskHtml = ([id, t]) => { const d = GD.tasks[id], txt = (G.taskText && G.taskText(id)) || d.summary || d.description || ''; return '<div class="task ' + t.state + '"><h4><span class="box"></span><span class="tt">' + esc(d.title) + '</span>' + (d.category ? '<span class="cat ' + esc(d.category) + '">' + esc(d.category) + '</span>' : '') + '</h4><p>' + esc(txt) + '</p>' + (t.notes.length ? '<ul>' + t.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') + '</div>'; };
      const open = list.filter(([, t]) => t.state === 'active'), closed = list.filter(([, t]) => t.state !== 'active');
      h += '<div class="notebook"><div class="page"><h3>Open tasks</h3>' + (open.length ? open.map(taskHtml).join('') : '<p class="none">Nothing yet.</p>') + '</div><div class="page"><h3>Closed</h3>' + (closed.length ? closed.map(taskHtml).join('') : '<p class="none">Nothing finished. Nothing failed. Yet.</p>') + '</div></div>';
      body.innerHTML = h;
    } else if (panelKind === 'thoughts') {
      const slots = S.thoughtSlots, res = Object.entries(S.thoughts).filter(([, t]) => t.state === 'researching');
      const maxSlots = Math.max(slots, (GD.thoughtSlots && GD.thoughtSlots.max) || slots);
      let h = '<header class="phead"><div><div class="kicker">Thought cabinet</div><h2 class="ptitle">Notebook of Unsanctioned Thoughts</h2><div class="psub">Thoughts take time to internalize. They change you — usually both ways. Time only passes when you act.</div></div><div class="stats"><div class="stat"><b>' + G.usedSlots() + '/' + slots + '</b><span>Slots in use</span></div></div></header><div class="cabinet" style="--n:' + maxSlots + '">';
      for (let i = 0; i < maxSlots; i++) {
        const r = res[i];
        if (i >= slots) h += '<div class="slot locked">' + LOCK_SVG + '<span class="sl-n">Locked drawer</span></div>';
        else if (r) { const d = GD.thoughts[r[0]], pct = Math.round((1 - r[1].remaining / r[1].total) * 100); h += '<div class="slot full"><span class="sl-n">Drawer ' + (i + 1) + ' · thinking</span><b>' + esc(d.name) + '</b><span class="pct">' + pct + '% · ' + Math.ceil(r[1].remaining) + ' min left</span><div class="prog"><i style="width:' + pct + '%"></i></div><button class="pbtn ghost" data-forget="' + r[0] + '">Forget</button></div>'; }
        else h += '<div class="slot empty"><span class="glyph">+</span><span>Empty drawer</span></div>';
      }
      h += '</div>';
      G.slotUnlocks().forEach((u) => { const free = G.evalCond(u.cond); h += '<div class="unlock"><span>' + esc(u.label) + '</span><button class="pbtn" data-slot="' + (free ? 'free' : 'pay') + '" ' + (!free && S.points < u.xp ? 'disabled' : '') + '>' + (free ? 'Unlock drawer' : 'Pay ' + u.xp + ' skill points') + '</button></div>'; });
      const known = Object.entries(S.thoughts).filter(([, t]) => t.state === 'known'), done = Object.entries(S.thoughts).filter(([, t]) => t.state === 'internalized');
      h += '<div class="sect">Unresolved</div>' + (known.length ? '<div class="tgrid">' : '<div class="psub none">No thoughts waiting.</div>');
      known.forEach(([id]) => { const d = GD.thoughts[id]; h += '<div class="tcard"><h4>' + esc(d.name) + '</h4><p>' + esc(d.problem || d.discover || '') + '</p><p class="mods">' + esc(modText(d)) + '</p><button class="pbtn" data-think="' + id + '" ' + (G.usedSlots() >= slots ? 'disabled' : '') + '>Think about it (' + (d.minutes || d.research || 90) + ' min)</button></div>'; });
      if (known.length) h += '</div>';
      h += '<div class="sect">Internalized</div>' + (done.length ? '<div class="tgrid">' : '<div class="psub none">None yet.</div>');
      done.forEach(([id]) => { const d = GD.thoughts[id]; h += '<div class="tcard done"><h4>' + esc(d.name) + '</h4><p>' + esc(d.solution || '') + '</p><p class="mods">' + esc(modText(d)) + '</p></div>'; });
      if (done.length) h += '</div>';
      body.innerHTML = h;
      body.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => G.unlockSlot(G.slotUnlocks()[0], b.dataset.slot === 'pay')));
      body.querySelectorAll('[data-think]').forEach((b) => (b.onclick = () => G.startThought(b.dataset.think)));
      body.querySelectorAll('[data-forget]').forEach((b) => (b.onclick = () => G.forgetThought(b.dataset.forget)));
    } else if (panelKind === 'menu') {
      body.innerHTML = '<header class="phead"><div><div class="kicker">Paused</div><h2 class="ptitle">Menu</h2></div></header><div class="menu-btns"><button class="pbtn prime" id="mn-res">Resume</button><button class="pbtn" id="mn-save">Save now</button>' + ((S.loc === 'dorm' && S.time >= 1020 && (S.day || 1) < 3) ? '<button class="pbtn" id="mn-sleep">Go to sleep (end the day)</button>' : '') + '<button class="pbtn ghost" id="mn-snd">Sound <span>' + (Sound.muted ? 'Off' : 'On') + '</span></button>' + ['music:Music', 'sfx:Effects', 'amb:Ambience'].map((x) => { const [k, n] = x.split(':'); return '<label><span>' + n + '</span><input type="range" min="0" max="1" step="0.05" value="' + Sound.vol[k] + '" data-vol="' + k + '" aria-label="' + n + ' volume"></label>'; }).join('') + '<button class="pbtn" id="mn-res2" style="display:none"></button><button class="pbtn ghost" id="mn-text">Text size <span>' + ['Normal', 'Large', 'Extra large'][textSize] + '</span></button><button class="pbtn ghost" id="mn-grain">Film grain <span>' + ((A.quality && A.quality.grain === false) ? 'Off' : 'On') + '</span></button><button class="pbtn ghost" id="mn-help">How to play</button><button class="pbtn ghost" id="mn-title">Quit to title</button></div><p class="psub" style="margin-top:18px;font-style:italic">The game autosaves after every conversation and every move between rooms.</p>';
      $('#mn-res').onclick = closePanel; if ($('#mn-sleep')) $('#mn-sleep').onclick = () => { closePanel(); G.queueEnding('end_curfew'); }; $('#mn-save').onclick = () => { G.save(); closePanel(); G.emit('toast', { text: 'Saved.', kind: 'info' }); };
      $('#mn-snd').onclick = () => { Sound.toggle(); renderPanel(); }; document.querySelectorAll('[data-vol]').forEach((r) => (r.oninput = () => { Sound.set(r.dataset.vol, parseFloat(r.value)); })); $('#mn-text').onclick = () => { textSize = (textSize + 1) % 3; try { localStorage.setItem('lastbell_text', String(textSize)); } catch (e) {} applyTextSize(); renderPanel(); }; $('#mn-grain').onclick = () => { if (A.quality) A.quality.grain = A.quality.grain === false; renderPanel(); }; $('#mn-help').onclick = showHelp; $('#mn-title').onclick = () => { G.save(); location.reload(); };
    }
  }
  function modText(d) { const m = d.mods || {}; return Object.entries(m).map(([k, v]) => (GD.skills[k] ? GD.skills[k].name : k) + ' ' + (v > 0 ? '+' : '') + v).join(' · '); }
  function itemDesc(id) {
    const it = GD.items[id], S = G.S; const mods = it.mods ? Object.entries(it.mods).map(([k, v]) => GD.skills[k].name + ' ' + (v > 0 ? '+' : '') + v).join(' · ') : '';
    let h = '<canvas class="id-ic" width="144" height="144"></canvas><h4>' + esc(it.name) + '</h4><div class="id-t">' + esc(it.type || 'item') + (S.equipped[id] ? ' · worn' : '') + '</div>' + esc(it.desc || '') + (mods ? '<div class="id-m">' + esc(mods) + '</div>' : '');
    if (it.type === 'apparel') h += '<br><button data-use="' + id + '">' + (S.equipped[id] ? 'Take off' : 'Wear') + '</button>';
    else if (it.usable) h += '<br><button data-use="' + id + '">Use</button>';
    return h;
  }
  function showHelp() {
    $('#panel').classList.remove('hidden'); panelKind = 'help'; $('#panel').dataset.kind = 'help';
    $('#panel-body').innerHTML = '<header class="phead"><div><div class="kicker">Orientation</div><h2 class="ptitle">How to Play</h2></div></header><div class="help"><p><b>Explore.</b> Click the floor to walk. Click people and objects (they glow green when hovered; hold <kbd>Tab</kbd> to show them all). Doors take you between rooms.</p><p><b>Talk.</b> Pick lines with the mouse or number keys. Your 24 skills are voices in your head; they chime in with passive observations when they are strong enough.</p><p><b>Checks.</b> Skill checks roll 2d6 + skill against a difficulty. <b>White</b> checks can be retried once the skill improves. <b>Red</b> checks happen once, ever.</p><p><b>Grow.</b> Successes earn XP; every few XP is a skill point (Character, <kbd>C</kbd>). Thoughts (<kbd>T</kbd>) cost time and reshape your skills.</p><p><b>Watch the clock.</b> Time passes when you walk, talk and think. The exam is at 17:00. Curfew is 21:00 — when the Bell rings, the Static takes you.</p><p><b>Watch yourself.</b> Defiance, shortcuts and snooping raise <b>Watched</b>. At 100 you are arrested. Body or Nerve at zero and you black out for hours.</p><p>Keys: <kbd>I</kbd> inventory · <kbd>J</kbd> journal · <kbd>T</kbd> thoughts · <kbd>C</kbd> character · <kbd>Esc</kbd> menu · <kbd>1-9</kbd> dialogue choices.</p></div>';
  }
  $('#btn-how').onclick = () => { $('#title').classList.add('hidden'); showHelp(); const c = $('#panel-close'); c.onclick = () => { closePanel(); if (!started) $('#title').classList.remove('hidden'); c.onclick = closePanel; }; };

  // ---------- title / creation ----------
  function refreshTitle() {
    $('#btn-continue').disabled = !G.hasSave();
    const seen = G.endingsSeen(), names = { end_good_student: 'The Good Student', end_ledger: 'The Ledger', end_static: 'Static', end_quiet: 'The Quiet Way', end_arrested: 'Arrested', end_curfew: 'Curfew' };
    $('#endings-seen').textContent = 'Endings found: ' + seen.length + ' / ' + Object.keys(GD.endingInfo || {}).length + (seen.length ? ' — ' + seen.map((e) => (GD.endingInfo[e] || {}).name || e).join(', ') : '');
    $('#btn-sound').textContent = 'Sound: ' + (Sound.muted ? 'Off' : 'On');
  }
  refreshTitle();
  $('#btn-sound').onclick = () => { Sound.init(); Sound.toggle(); refreshTitle(); };
  $('#btn-continue').onclick = () => { Sound.init(); if (G.load()) beginPlay(); };
  $('#btn-new').onclick = () => { Sound.init(); showCreate(); };
  function maybeTutorial(isNew) {
    let seen = false; try { seen = !!localStorage.getItem('lastbell_tut'); } catch (e) {}
    if (!isNew || seen) return;
    $('#tutorial').classList.remove('hidden');
    $('#tut-ok').onclick = () => { $('#tutorial').classList.add('hidden'); try { localStorage.setItem('lastbell_tut', '1'); } catch (e) {} };
  }
  function beginPlay(isNew) { started = true; document.body.classList.add('playing'); $('#title').classList.add('hidden'); $('#create').classList.add('hidden'); $('#hud').classList.remove('hidden'); $('#hint').style.display = 'block'; setTimeout(() => ($('#hint').style.display = 'none'), 9000); refreshHud(); rendererLoc = null; cam.x = cam.y = 0; snapCamera(); maybeTutorial(isNew); applyTextSize(); }
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
      let h = '<div class="kicker">Admission form · School No. 9</div><h2 class="ptitle">Who are you, exactly?</h2><div class="psub">Seventeen. Third-year student, School No. 9. Your file says "reliable." Your head says "ringing."</div>';
      h += '<div class="cr-top"><div class="cr-portrait"><canvas id="cp" width="128" height="128"></canvas></div><div class="cr-fields"><div class="crow"><label class="lbl" for="cn">Name</label><input type="text" id="cn" value="' + esc(name) + '" maxlength="22" autocomplete="off"></div>';
      h += '<div class="crow"><span class="lbl">Skin</span>' + skins.map((c) => '<button class="swatch' + (look.skin === c ? ' on' : '') + '" data-skin="' + c + '" style="background:' + c + '" aria-label="Skin tone ' + c + '" aria-pressed="' + (look.skin === c) + '"></button>').join('') + '</div>';
      h += '<div class="crow"><span class="lbl">Hair</span>' + hairs.map((c) => '<button class="swatch' + (look.hair === c ? ' on' : '') + '" data-hair="' + c + '" style="background:' + c + '" aria-label="Hair colour ' + c + '" aria-pressed="' + (look.hair === c) + '"></button>').join('') + '</div>';
      h += '<div class="crow"><span class="lbl">Look</span><button class="tog" id="cstyle">Style: ' + look.hairStyle + '</button><button class="tog" id="cglass">Glasses: ' + (look.glasses ? 'yes' : 'no') + '</button></div></div></div>';
      const atTags = (o) => Object.entries(o || {}).map(([k, v]) => '<span style="--c:' + ((GD.attributes[k] || {}).color || '#aaa') + '">' + k.slice(0, 3).toUpperCase() + ' ' + v + '</span>').join('');
      h += '<div class="sect">Archetype</div><div class="arch-grid">' + archs.map((x) => '<div class="arch' + (sel === x.id ? ' sel' : '') + '" data-a="' + x.id + '" tabindex="0" role="button" aria-pressed="' + (sel === x.id) + '"><h4>' + esc(x.name) + '</h4><p>' + esc(x.description || x.desc || '') + '</p><div class="at">' + atTags(x.attributes || x.attrs) + '</div></div>').join('') + '<div class="arch' + (sel === 'custom' ? ' sel' : '') + '" data-a="custom" tabindex="0" role="button" aria-pressed="' + (sel === 'custom') + '"><h4>Self-made</h4><p>Distribute 12 points across four attributes (1–5 each) yourself.</p></div></div>';
      if (sel === 'custom') h += '<div class="attr-edit">' + Object.keys(GD.attributes).map((k) => '<div style="--c:' + GD.attributes[k].color + '"><b>' + esc(GD.attributes[k].name) + '</b><button data-d="-' + k + '" aria-label="Lower ' + esc(GD.attributes[k].name) + '">−</button><span class="v">' + attrs[k] + '</span><button data-d="+' + k + '" aria-label="Raise ' + esc(GD.attributes[k].name) + '">+</button></div>').join('') + '<span class="pts" style="color:' + (pts === 12 ? 'var(--green)' : '#ec7458') + '">' + pts + ' / 12</span></div>';
      h += '<div class="cr-go"><button class="cbtn" id="cgo" ' + (sel === 'custom' && pts !== 12 ? 'disabled' : '') + '>Wake up ▸</button><button class="cbtn ghost" id="cback">Back</button></div>';
      $('#create-inner').innerHTML = h;
      A.drawPortrait($('#cp'), look, {});
      $('#cn').oninput = (e) => (name = e.target.value);
      document.querySelectorAll('[data-skin]').forEach((b) => (b.onclick = () => { look.skin = b.dataset.skin; render(); }));
      document.querySelectorAll('[data-hair]').forEach((b) => (b.onclick = () => { look.hair = b.dataset.hair; render(); }));
      $('#cstyle').onclick = () => { look.hairStyle = styles[(styles.indexOf(look.hairStyle) + 1) % styles.length]; render(); };
      $('#cglass').onclick = () => { look.glasses = !look.glasses; render(); };
      document.querySelectorAll('[data-a]').forEach((b) => (b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } }));
      document.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { sel = b.dataset.a; const ar = archs.find((x) => x.id === sel); if (ar) attrs = Object.assign({}, ar.attributes || ar.attrs); render(); }));
      document.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { const k = b.dataset.d.slice(1), d = b.dataset.d[0] === '+' ? 1 : -1; if (attrs[k] + d >= 1 && attrs[k] + d <= 5) attrs[k] += d; render(); }));
      $('#cback').onclick = () => { box.classList.add('hidden'); $('#title').classList.remove('hidden'); };
      $('#cgo').onclick = () => {
        const ar = archs.find((x) => x.id === sel); box.classList.add('hidden');
        G.newGame({ name: (name || GD.meta.defaultName).trim(), look, attrs, archetype: sel, learned: ar && ar.signature ? Object.assign({}, ar.signature) : ar && ar.learned ? Object.assign({}, ar.learned) : {} });
        beginPlay(true);
      };
    }
    render();
  }

  // ---------- days & nights ----------
  G.on('night', () => { document.body.classList.add('nightscene'); });
  G.on('dialogueEnd', (D) => { if (D.daybreak) document.body.classList.remove('nightscene'); });
  G.on('daybreak', (d) => {
    const el = $('#daycard'); el.classList.remove('hidden'); $('#dc-title').textContent = 'DAY ' + d.day + ' — ' + d.name.toUpperCase();
    $('#dc-sub').textContent = d.hangover ? 'Static hangover: ' + d.hangover + ' −1 until tomorrow' : 'You remember more than you should.';
    document.body.classList.remove('nightscene'); window.Sound && Sound.scene('title');
    const cv = $('#dc-canvas'), t0 = performance.now(); cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    const dc = cv.getContext('2d'); const loop = (now) => { if (el.classList.contains('hidden')) return; dc.setTransform(dpr, 0, 0, dpr, 0, 0); (A.drawDayCard || ((c, w, h) => { c.fillStyle = '#10140f'; c.fillRect(0, 0, w, h); }))(dc, W, H, now - t0, d.day); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    $('#dc-go').onclick = () => { el.classList.add('hidden'); G.S && window.Sound && Sound.mood(G.loc().mood); G.beginDay(); };
  });

  // ---------- endings ----------
  const ENDNAMES = new Proxy({}, { get: (_, k) => ((GD.endingInfo || {})[k] || {}).name ? GD.endingInfo[k].name.toUpperCase() : undefined });
  G.on('ending', (id) => { $('#ending').classList.remove('hidden'); $('#hud').classList.add('hidden'); $('#ending-summary').classList.add('hidden'); window.Sound && (Sound.play('bell'), Sound.ending(id)); });
  G.on('endingDone', (id) => showSummary(id));
  G.on('dialogueEnd', (D) => { if (D.isEnding) setTimeout(() => showSummary(G.S.ending), 300); });
  function showSummary(id) {
    const S = G.S, el = $('#ending-summary'); document.body.classList.remove('endmode');
    const seen = G.endingsSeen(), total = Object.keys(GD.endingInfo || {}).length;
    el.innerHTML = '<div class="kicker">' + esc(S.name) + ' · ' + fmtTime(S.time) + '</div><h2>' + (ENDNAMES[id] || 'THE END') + '</h2><div class="stats">'
      + '<div class="stat"><b>' + S.stats.passed + '</b><span>Checks passed</span></div><div class="stat"><b>' + S.stats.failed + '</b><span>Checks failed</span></div>'
      + '<div class="stat"><b>' + Object.values(S.thoughts).filter((t) => t.state === 'internalized').length + '</b><span>Thoughts</span></div><div class="stat' + (S.surv >= 66 ? ' hot' : '') + '"><b>' + S.surv + '%</b><span>Watched</span></div></div>'
      + '<p style="color:var(--dim)">Endings found: ' + seen.length + ' of ' + total + '. There is more than one way to get through a Tuesday.</p><div class="eg">' + Object.entries(GD.endingInfo || {}).map(([k, v]) => seen.includes(k) ? '<b><i>✔</i>' + esc(v.name) + '</b>' : '<span><i>?</i>' + esc(v.hint) + '</span>').join('') + '</div><button class="cbtn" id="again">Return to title</button>';
    el.classList.remove('hidden'); $('#again').onclick = () => location.reload();
  }

  // ambient inner-voice barks
  setInterval(() => {
    if (!started || !G.S || G.D || G.S.ending || !$('#panel').classList.contains('hidden')) return;
    const S = G.S; let pickB = null;
    const sit = GD.situationBarks || {};
    const pool = S.hp <= 3 ? sit.lowHp : S.morale <= 3 ? sit.lowMorale : S.surv >= 66 ? sit.highSurv : GD.meta.curfew - S.time < 90 ? sit.curfewSoon : Math.random() < 0.3 ? sit.idle : null;
    const lb = (GD.locBarks || {})[S.loc], db = (GD.dayBarks || {})[S.day || 1], r = Math.random();
    if (pool && pool.length) { const b = pool[Math.floor(Math.random() * pool.length)]; pickB = { skill: b.skill, text: b.text }; }
    else if (lb && lb.length && r < 0.35) { const b = lb[Math.floor(Math.random() * lb.length)]; pickB = { skill: b.skill, text: b.text }; }
    else if (db && db.length && r < 0.6) { const b = db[Math.floor(Math.random() * db.length)]; pickB = { skill: b.skill, text: b.text }; }
    else { const ids = Object.keys(GD.barks || {}).filter((k) => G.skill(k) >= 3 && GD.skills[k]); if (!ids.length) return; const k = ids[Math.floor(Math.random() * ids.length)], arr = GD.barks[k]; pickB = { skill: k, text: arr[Math.floor(Math.random() * arr.length)] }; }
    if (!pickB || !GD.skills[pickB.skill]) return;
    const box = $('#toasts'), d = document.createElement('div'); d.className = 'toast bark'; d.style.setProperty('--c', GD.skills[pickB.skill].color); d.innerHTML = '<span class="tk">' + esc(GD.skills[pickB.skill].name.toUpperCase()) + '</span>' + esc(G.sub(pickB.text)); box.appendChild(d); setTimeout(() => d.remove(), 5200);
  }, 38000);

  // debug hook
  if (location.search.includes('debug')) { window.G = G; }
})();
