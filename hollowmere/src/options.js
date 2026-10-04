// Options: field of view, pixel resolution, look of the grade, comfort and HUD switches.
// Saved with the other settings and applied at once.
const DEFAULTS = { fov: 74, res: 270, bob: 1, invertY: false, bright: 1, dither: 0.5, sat: 0.9, minimap: true, threat: true, status: true, numbers: true, fps: false, shake: 1, autosave: true, autoAnswer: true, dodge: true };
const SPEC = [
  ['Field of view', 'fov', 'range', 60, 100, 1, (v) => v + '°'], ['Pixel height', 'res', 'select', [[180, 'Chunky (180)'], [270, 'Normal (270)'], [360, 'Fine (360)'], [480, 'Crisp (480)']]],
  ['Brightness', 'bright', 'range', 0.8, 1.4, 0.02, (v) => Math.round(v * 100) + '%'], ['Dither strength', 'dither', 'range', 0, 1, 0.05, (v) => Math.round(v * 100) + '%'], ['Colour saturation', 'sat', 'range', 0.5, 1.3, 0.05, (v) => Math.round(v * 100) + '%'],
  ['Head bob', 'bob', 'range', 0, 1.5, 0.1, (v) => Math.round(v * 100) + '%'], ['Screen shake', 'shake', 'range', 0, 1.5, 0.1, (v) => Math.round(v * 100) + '%'], ['Invert look (Y)', 'invertY', 'check'],
  ['Minimap', 'minimap', 'check'], ['Threat ring and ? marks', 'threat', 'check'], ['Status pills', 'status', 'check'], ['Damage numbers', 'numbers', 'check'], ['Autosave', 'autosave', 'check'], ['Answer guards automatically', 'autoAnswer', 'check'], ['Double-tap to sidestep', 'dodge', 'check'], ['Show frame rate', 'fps', 'check'],
];
export class Options {
  constructor(g) { this.g = g; this.v = { ...DEFAULTS, ...(g.saves.settings().opts || {}) }; this.fpsT = 0; this.frames = 0; }
  apply() {
    const g = this.g, v = this.v;
    g.baseFov = v.fov * Math.PI / 180; g.pixelHeight = v.res; g.resize?.();
    g.pix.dither = v.dither; g.pix.sat = v.sat;
    document.body.classList.toggle('no-minimap', !v.minimap); document.body.classList.toggle('no-status', !v.status);
    let f = document.getElementById('fpsBox'); if (!f) { f = document.createElement('div'); f.id = 'fpsBox'; f.className = 'hud'; f.style.cssText = 'left:50%;top:2px;transform:translateX(-50%);font:12px monospace;color:#9fe;z-index:9;pointer-events:none'; document.body.append(f); } f.hidden = !v.fps;
  }
  set(k, val) { this.v[k] = val; this.apply(); this.g.saves.saveSettings({ opts: this.v }); }
  tick(dt) { this.frames++; this.fpsT += dt; if (this.fpsT >= 0.5) { if (this.v.fps) { const f = document.getElementById('fpsBox'); if (f) f.textContent = Math.round(this.frames / this.fpsT) + ' fps'; } this.fpsT = 0; this.frames = 0; } }
  build(el) {
    el.innerHTML = '';
    for (const [label, key, kind, a, b, c, fmt] of SPEC) {
      const row = document.createElement('label'); row.className = 'optrow'; const sp = document.createElement('span'); sp.textContent = label; row.append(sp);
      if (kind === 'range') { const i = document.createElement('input'); i.type = 'range'; i.min = a; i.max = b; i.step = c; i.value = this.v[key]; const o = document.createElement('output'); o.textContent = fmt(this.v[key]); i.oninput = () => { o.textContent = fmt(+i.value); this.set(key, +i.value); }; row.append(i, o); }
      else if (kind === 'check') { const i = document.createElement('input'); i.type = 'checkbox'; i.checked = !!this.v[key]; i.onchange = () => this.set(key, i.checked); row.append(i); }
      else { const s = document.createElement('select'); for (const [val, name] of a) { const o = document.createElement('option'); o.value = val; o.textContent = name; if (+val === this.v[key]) o.selected = true; s.append(o); } s.onchange = () => this.set(key, +s.value); row.append(s); }
      el.append(row);
    }
  }
}
