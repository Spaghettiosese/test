// Settings phone app + the system that applies accessibility options (text style, colour-blind palette, reduced motion).
// Settings are global (game.settings, saved by game.saveSettings). Keys: music, sfx, textSpeed, runToggle, mouseWalk,
// tracker, autosave, screenShake, clock24, bigText (wide letter spacing), highContrast, colorblind, reduceMotion.
import { register, features } from '../../core/registry.js';
import { setTextStyle } from '../../font.js';
import { UI, setUIOptions, rect, panel, drawText, drawTextC, scrollbar, slider, toggle } from '../../ui/ui.js';
import { seasonOf } from '../../core/time.js';
import { hit, clamp } from './kit.js';

const DEFAULTS = { music: 0.6, sfx: 0.8, textSpeed: 1, runToggle: false, mouseWalk: true, tracker: true, autosave: true, screenShake: true, clock24: false, bigText: false, highContrast: false, colorblind: false, reduceMotion: false };
const SPEEDS = [0.5, 1, 2, 4], SPEED_NAMES = ['Slow', 'Normal', 'Fast', 'Instant'];
const ROWS = [
  ['head', 'Sound'],
  ['music', 'Music volume', 'vol'], ['sfx', 'Sound effects volume', 'vol'],
  ['head', 'Play'],
  ['textSpeed', 'Text speed', 'speed'], ['runToggle', 'Always run (Shift walks)', 'bool'], ['mouseWalk', 'Hold mouse or finger to walk', 'bool'],
  ['tracker', 'Quest tracker on screen', 'bool'], ['autosave', 'Autosave when sleeping', 'bool'], ['screenShake', 'Screen shake', 'bool'], ['clock24', '24-hour clock', 'bool'],
  ['head', 'Accessibility'],
  ['bigText', 'Larger text (wide spacing)', 'bool'], ['highContrast', 'High contrast text outline', 'bool'],
  ['colorblind', 'Colour-blind palette (blue/orange)', 'bool'], ['reduceMotion', 'Reduce motion (no blinking)', 'bool'],
  ['head', 'Reset'], ['reset', 'Restore default settings', 'action'],
];
const val = (s, k) => s[k] ?? DEFAULTS[k];

export function applyPrefs(game) {
  const s = game.settings;
  setTextStyle({ highContrast: !!s.highContrast, wide: !!s.bigText });
  setUIOptions({ colorblind: !!s.colorblind, reduceMotion: !!s.reduceMotion, season: game.state && game.state.time ? seasonOf(game.state.time.day) : 'spring' });
  if (game.audio && game.audio.setVolumes) game.audio.setVolumes(s);
}

register('system', 'ui_prefs', {
  init(game) {
    applyPrefs(game);
    for (const e of ['gameStart', 'gameLoaded', 'dayStart', 'newGame']) game.bus.on(e, () => applyPrefs(game));
  },
});

const RH = 16, VIS = 9;
register('phoneApp', 'settings', {
  name: 'Settings', icon: 'i_gear', order: 90,
  open(game, app) { app.state.sel = 1; app.state.top = 0; },
  change(game, app, i, dir) {
    const [key, , kind] = ROWS[i], s = game.settings;
    if (kind === 'vol') s[key] = Math.round(clamp(val(s, key) + dir * 0.1, 0, 1) * 10) / 10;
    else if (kind === 'speed') s[key] = SPEEDS[(SPEEDS.indexOf(val(s, key)) + (dir > 0 ? 1 : 3)) % 4];
    else if (kind === 'bool') s[key] = !val(s, key);
    else if (kind === 'action') { Object.assign(s, DEFAULTS); game.toast('Settings restored'); }
    game.saveSettings(); applyPrefs(game); game.sfx('blip');
  },
  move(st, d) {
    let i = st.sel;
    do { i = (i + d + ROWS.length) % ROWS.length; } while (ROWS[i][0] === 'head');
    st.sel = i;
    const pos = ROWS.slice(0, i).length; // row index in scroll space
    if (pos < st.top) st.top = pos;
    if (pos >= st.top + VIS) st.top = pos - VIS + 1;
    if (i < 2) st.top = 0;
  },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('arrowdown') || k.has('s')) this.move(st, 1);
    if (k.has('arrowup') || k.has('w')) this.move(st, -1);
    if (k.has('arrowleft') || k.has('a')) this.change(game, app, st.sel, -1);
    if (k.has('arrowright') || k.has('d') || k.has('enter') || k.has(' ') || k.has('e')) this.change(game, app, st.sel, 1);
    if (input.wheel) st.top = clamp(st.top + Math.sign(input.wheel), 0, ROWS.length - VIS);
    if (hit(input, x + 278, y, 14, 20)) st.top = clamp(st.top - 3, 0, ROWS.length - VIS);
    if (hit(input, x + 278, y + 144, 14, 20)) st.top = clamp(st.top + 3, 0, ROWS.length - VIS);
    for (let r = 0; r < VIS; r++) {
      const i = st.top + r;
      if (i >= ROWS.length || ROWS[i][0] === 'head') continue;
      const yy = y + 2 + r * RH, kind = ROWS[i][2];
      if (hit(input, x, yy, 276, RH - 1)) {
        st.sel = i;
        if (kind === 'vol' || kind === 'speed') this.change(game, app, i, input.mx < x + 196 ? -1 : 1);
        else this.change(game, app, i, 1);
      }
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = game.settings;
    for (let r = 0; r < VIS; r++) {
      const i = st.top + r, row = ROWS[i];
      if (!row) break;
      const yy = y + 2 + r * RH;
      if (row[0] === 'head') { rect(g, UI.accent, x, yy + 2, 276, 11); drawText(g, row[1].toUpperCase(), x + 4, yy + 4, UI.text, 1, null); continue; }
      if (i === st.sel) rect(g, UI.gold, x, yy, 276, RH - 1);
      drawText(g, row[1], x + 5, yy + 4, UI.ink, 1, null);
      const [key, , kind] = row;
      if (kind === 'vol') {
        drawText(g, '<', x + 192, yy + 4, UI.accent2, 1, null); slider(g, x + 202, yy + 3, 56, val(s, key)); drawText(g, '>', x + 264, yy + 4, UI.accent2, 1, null);
      } else if (kind === 'speed') {
        drawText(g, '<', x + 192, yy + 4, UI.accent2, 1, null); drawTextC(g, SPEED_NAMES[SPEEDS.indexOf(val(s, key))], x + 232, yy + 4, UI.accent2, 1, null); drawText(g, '>', x + 264, yy + 4, UI.accent2, 1, null);
      } else if (kind === 'bool') toggle(g, x + 246, yy + 3, !!val(s, key));
      else { rect(g, UI.ink, x + 200, yy + 1, 66, 13); rect(g, UI.mint, x + 201, yy + 2, 64, 11); drawTextC(g, 'Reset', x + 233, yy + 4, UI.ink, 1, null); }
    }
    panel(g, x + 278, y, 14, 20, 'paper', { accent: false }); drawTextC(g, '^', x + 285, y + 6, UI.ink, 1, null);
    panel(g, x + 278, y + 144, 14, 20, 'paper', { accent: false }); drawTextC(g, 'v', x + 285, y + 150, UI.ink, 1, null);
    scrollbar(g, x + 282, y + 24, 116, st.top, VIS, ROWS.length);
    drawText(g, 'Up/Down: pick   Left/Right or tap: change', x + 5, y + 164, UI.dim, 1, null);
  },
});

features('Settings', [
  'Settings app on the phone (also reachable from the title screen) with sections for sound, play and accessibility',
  'Music and sound-effect volume sliders, adjustable by keys or by tapping either side of the slider',
  'Text speed setting: slow, normal, fast or instant dialogue',
  'Always-run toggle (Shift then walks) and a hold-mouse-or-finger-to-walk toggle',
  '24-hour clock option that changes the HUD clock',
  'Larger text option: wide letter spacing across every menu and dialogue box',
  'High contrast option: all text gets a dark outline',
  'Colour-blind palette option: good/bad cues switch from green/red to blue/orange (ticks and crosses keep their shapes)',
  'Reduce motion option: stops blinking prompts, bobbing and marching borders',
  'Restore default settings button; settings are saved globally between sessions',
  'Settings list scrolls with keys, wheel or on-screen up and down buttons, and every row is a 16 px tap target',
]);
