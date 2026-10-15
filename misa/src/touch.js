// On-screen controls for phones and tablets: a floating joystick (arrow keys), A (E / talk / confirm),
// B (Esc / back / phone), and RUN (Shift, toggles). They feed the same `input` the keyboard does, so every
// scene works unchanged. Shown on coarse pointers, or the first time a touch happens.

const STYLE = `
#tc{position:fixed;inset:0;pointer-events:none;z-index:5;font:600 13px system-ui,sans-serif;color:#fff8ec;
  user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
#tc .zone{position:absolute;left:0;bottom:0;width:50%;height:46%;pointer-events:auto;touch-action:none}
#tc .base{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;
  background:rgba(40,26,58,.38);border:2px solid rgba(255,240,220,.35);display:none}
#tc .knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;
  background:rgba(255,226,236,.78);box-shadow:0 2px 0 rgba(0,0,0,.3)}
#tc .ghost{position:absolute;left:68px;bottom:68px;width:84px;height:84px;margin:0 0 -42px -42px;border-radius:50%;
  border:2px dashed rgba(255,240,220,.28)}
#tc .btn{position:absolute;pointer-events:auto;touch-action:none;border-radius:50%;display:flex;align-items:center;
  justify-content:center;background:rgba(40,26,58,.55);border:2px solid rgba(255,240,220,.5);
  box-shadow:0 3px 0 rgba(0,0,0,.35);transition:transform .05s}
#tc .btn.on{transform:translateY(2px) scale(.95);background:rgba(232,120,160,.75)}
#tc .a{width:72px;height:72px;right:22px;bottom:70px;font-size:22px}
#tc .b{width:56px;height:56px;right:104px;bottom:28px;font-size:18px}
#tc .run{width:50px;height:50px;right:30px;bottom:160px;font-size:11px}
#tc .run.lock{background:rgba(120,190,140,.75)}
#tc .menu{width:44px;height:44px;right:14px;top:12px;font-size:18px;border-radius:12px}
@media (orientation:portrait){#tc .menu{top:auto;right:auto;left:20px;bottom:calc(46% - 8px)}}
`;

export function isTouchDevice() {
  return (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0;
}

// `press(key)` and `release(key)` act like keydown/keyup. `onLayout` re-fits the canvas.
export function installTouchControls({ press, release, onLayout }) {
  let root = null;
  const show = () => {
    if (root) return;
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'tc';
    root.innerHTML = `<div class="zone"><div class="ghost"></div><div class="base"><div class="knob"></div></div></div>
      <div class="btn a">A</div><div class="btn b">B</div><div class="btn run">RUN</div><div class="btn menu">☰</div>`;
    document.body.appendChild(root);
    document.body.classList.add('touch');
    wireStick(root.querySelector('.zone'));
    wireButton(root.querySelector('.a'), 'e');
    wireButton(root.querySelector('.b'), 'escape');
    wireButton(root.querySelector('.menu'), 'escape');
    wireRun(root.querySelector('.run'));
    onLayout && onLayout();
  };

  // ---- joystick: appears where the thumb lands, 4/8-way into arrow keys, with menu auto-repeat ----
  function wireStick(zone) {
    const base = zone.querySelector('.base'), knob = zone.querySelector('.knob'), ghost = zone.querySelector('.ghost');
    let id = null, ox = 0, oy = 0, held = new Set(), repeat = null;
    const setDirs = (dirs) => {
      for (const k of held) if (!dirs.has(k)) release(k);
      const fresh = [...dirs].filter((k) => !held.has(k));
      for (const k of fresh) press(k);
      held = dirs;
      if (fresh.length) { // held direction repeats so menus can scroll
        clearInterval(repeat); clearTimeout(repeat);
        repeat = setTimeout(() => { repeat = setInterval(() => { for (const k of held) { release(k); press(k); } }, 140); }, 380);
      }
      if (!dirs.size) { clearTimeout(repeat); clearInterval(repeat); }
    };
    const move = (e) => {
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy), max = 44;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const dirs = new Set();
      if (d > 14) {
        const a = Math.atan2(dy, dx), oct = Math.round(a / (Math.PI / 4)); // -4..4
        const m = { 0: ['arrowright'], 1: ['arrowright', 'arrowdown'], 2: ['arrowdown'], 3: ['arrowleft', 'arrowdown'],
          4: ['arrowleft'], '-4': ['arrowleft'], '-3': ['arrowleft', 'arrowup'], '-2': ['arrowup'], '-1': ['arrowright', 'arrowup'] }[oct];
        m.forEach((k) => dirs.add(k));
      }
      setDirs(dirs);
    };
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      id = e.pointerId; try { zone.setPointerCapture(id); } catch { /* synthetic or lost pointer */ }
      const r = zone.getBoundingClientRect();
      ox = e.clientX; oy = e.clientY;
      base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px';
      base.style.display = 'block'; ghost.style.display = 'none';
      knob.style.transform = '';
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null; base.style.display = 'none'; ghost.style.display = 'block'; setDirs(new Set());
    };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  }

  function wireButton(el, key) {
    const down = (e) => { e.preventDefault(); el.classList.add('on'); press(key); try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ } if (navigator.vibrate) navigator.vibrate(8); };
    const up = () => { el.classList.remove('on'); release(key); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  // RUN: tap toggles a run lock (Shift held); while held it also fast-forwards dialogue (cutscene reads Shift).
  function wireRun(el) {
    let locked = false;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); locked = !locked; el.classList.toggle('lock', locked);
      if (locked) press('shift'); else release('shift');
    });
  }

  if (isTouchDevice()) show();
  else addEventListener('touchstart', show, { once: true, passive: true });
  return { get active() { return !!root; } };
}
