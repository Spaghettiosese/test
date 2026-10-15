// Story backdrops (full-screen cutscene paintings), chapter title cards, the credits roll and the "Previously..." card.
import { register, get, features } from '../../core/registry.js';
import { drawText, drawTextC, measure, wrapPx } from '../../font.js';
import { drawChar } from '../../gfx/chars.js';
import { drawPortrait } from '../../ui/portraits.js';
import { UI, rect, panel } from '../../ui/ui.js';

// ---------------------------------------------------------------- painting kit
const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const hash = (i, k = 1) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
function sky(g, cols, h = 224) { const b = h / cols.length; cols.forEach((c, i) => R(g, c, 0, Math.floor(i * b), 320, Math.ceil(b) + 1)); }
function stars(g, t, n = 70, maxY = 140, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, seed) * 320), y = Math.floor(hash(i, seed + 7) * maxY), tw = (Math.floor(t * 2 + i) % 7) === 0;
    R(g, tw ? '#8a7fb0' : i % 5 ? '#fffaf0' : '#ffe9a0', x, y, i % 11 === 0 ? 2 : 1, i % 11 === 0 ? 2 : 1);
  }
}
function sea(g, y, t, c1 = '#2a3a6a', c2 = '#3b4f8a', glint = '#9cc8e8') {
  R(g, c1, 0, y, 320, 224 - y);
  for (let r = 0; r < (224 - y) / 6; r++) for (let i = 0; i < 9; i++) { const x = ((i * 41 + r * 23 + t * (8 + r * 3)) % 360) - 20; R(g, r % 2 ? c2 : glint, x, y + 3 + r * 6, 10 + (i % 3) * 6, 1); }
}
function headland(g, x, y, c = '#2a2240', lit = false, t = 0, beam = 0) {
  g.fillStyle = c; g.beginPath(); g.moveTo(x - 70, 224); g.lineTo(x - 50, y + 26); g.lineTo(x - 10, y + 18); g.lineTo(x + 40, y + 24); g.lineTo(x + 90, 224); g.fill();
  R(g, '#e8e0f0', x - 4, y - 22, 9, 40); R(g, '#c84a4a', x - 4, y - 12, 9, 5); R(g, '#c84a4a', x - 4, y + 2, 9, 5);
  R(g, '#3b2a40', x - 6, y - 30, 13, 8); R(g, '#2b1d2e', x - 7, y - 33, 15, 3); R(g, '#2b1d2e', x - 2, y - 37, 5, 4);
  R(g, lit ? '#fff4c0' : '#4a4060', x - 4, y - 29, 9, 6);
  if (lit) {
    g.save(); g.globalAlpha = 0.35 + 0.1 * Math.sin(t * 3);
    const a = beam, L = 260;
    g.fillStyle = '#fff4c0'; g.beginPath(); g.moveTo(x, y - 26); g.lineTo(x + Math.cos(a - 0.08) * L, y - 26 + Math.sin(a - 0.08) * L * 0.35); g.lineTo(x + Math.cos(a + 0.08) * L, y - 26 + Math.sin(a + 0.08) * L * 0.35); g.fill();
    g.restore();
  }
}
function starShape(g, cx, cy, r, c, rot = -Math.PI / 2) {
  g.fillStyle = c; g.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = rot + (i * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.fill();
}
function town(g, y, c = '#3b2a50', win = '#ffd76a', t = 0, lit = 1) {
  for (let i = 0; i < 12; i++) {
    const x = i * 28 - 6, h = 14 + ((i * 37) % 20);
    R(g, c, x, y - h, 26, h + 30); R(g, c, x - 2, y - h - 3, 30, 3);
    for (let k = 0; k < 3; k++) if (hash(i, k + 3) < lit) R(g, win, x + 4 + k * 7, y - h + 5, 3, 3);
  }
}
const look = (id) => (get('npc', id) || {}).look || null;
const person = (g, id, x, y, dir = 'down', t = 0, anim = 'idle') => drawChar(g, id, id === 'misa' ? null : look(id), dir, anim, t, x, y);
function lantern(g, x, y, t, i = 0) { const f = Math.sin(t * 4 + i) > 0.6 ? '#ffe9a0' : '#ffd08a'; R(g, '#2b1d2e', x, y - 1, 6, 1); R(g, '#e0707a', x - 1, y, 8, 8); R(g, f, x + 1, y + 1, 4, 6); }
function sepia(g) { g.save(); g.globalCompositeOperation = 'color'; R(g, '#a0784a', 0, 0, 320, 224); g.restore(); g.save(); g.globalAlpha = 0.18; R(g, '#f0d8a8', 0, 0, 320, 224); g.restore(); for (let i = 0; i < 40; i++) R(g, '#00000022', 0, i * 6, 320, 1); }
function vignette(g) { for (let i = 0; i < 6; i++) { g.globalAlpha = 0.12; R(g, '#0a0612', 0, 0, 320, 4 + i * 3); R(g, '#0a0612', 0, 220 - i * 3, 320, 4 + i * 3); } g.globalAlpha = 1; }

// ---------------------------------------------------------------- backdrops
const BD = {
  story_bus: { music: 'title', draw(g, game, t) {
    sky(g, ['#9cc8e8', '#b6dcef', '#d8ecf0', '#f4f0e0']);
    sea(g, 96, t, '#5a8cc0', '#7fb2e0', '#d8ecf8'); headland(g, 262, 92, '#5a7a5a');
    R(g, '#7aa060', 0, 118, 320, 30); R(g, '#8a8a90', 0, 148, 320, 40); R(g, '#e8e0c0', 0, 166, 320, 2); R(g, '#6a8a50', 0, 188, 320, 36);
    for (let i = 0; i < 6; i++) { const x = i * 60 + 10; R(g, '#f7a1b1', x, 104, 18, 14); R(g, '#7a4f3a', x + 8, 116, 3, 10); }
    R(g, '#5a5a6a', 40, 128, 3, 26); R(g, '#3d5a8c', 32, 124, 18, 8); drawText(g, 'Lantern Lane', 26, 112, '#2b1d2e', 1, null);
    const bx = Math.max(110, 330 - t * 70);
    R(g, '#2b1d2e', bx - 1, 129, 122, 34); R(g, '#86cdb0', bx, 130, 120, 28); R(g, '#fff6e6', bx, 140, 120, 2);
    for (let k = 0; k < 5; k++) R(g, '#cfe8f0', bx + 8 + k * 22, 133, 16, 6);
    R(g, '#2b1d2e', bx + 16, 156, 14, 8); R(g, '#2b1d2e', bx + 90, 156, 14, 8);
    if (bx <= 110) person(g, 'misa', 92, 186, 'right', t);
    if (bx <= 110) { R(g, '#2b1d2e', 104, 172, 20, 14); R(g, '#c9935a', 105, 173, 18, 12); R(g, '#e8964a', 109, 175, 8, 4); }
  } },
  story_bay_dark: { music: 'night', draw(g, game, t) {
    sky(g, ['#3a2a5a', '#5a3a6a', '#8a4a6a', '#c86a6a', '#e8a07a']); stars(g, t, 25, 60);
    sea(g, 120, t, '#3a3a6a', '#4a4a7a', '#e8a07a'); headland(g, 250, 116, '#2a2040');
    town(g, 200, '#2b1d3e', '#ffd76a', t, 0.4); R(g, '#2b1d3e', 0, 200, 320, 24);
  } },
  story_dream: { music: 'night', draw(g, game, t) {
    sky(g, ['#0e0a24', '#16123a', '#1e1848', '#241c50']); stars(g, t, 120, 224, 5);
    for (let i = 0; i < 14; i++) { const x = (i * 37 + t * 20) % 340 - 10, y = 150 + Math.sin(t + i) * 6; R(g, '#3a2a70', x, y, 2, 2); }
    const cx = 160 + Math.sin(t * 0.8) * 70, cy = 150 + Math.cos(t * 0.6) * 8;
    g.save(); g.globalAlpha = 0.3; g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(cx, cy, 22 + Math.sin(t * 3) * 3, 0, Math.PI * 2); g.fill(); g.restore();
    R(g, '#fff4c0', cx - 8, cy - 4, 16, 8); R(g, '#fff4c0', cx - 10, cy - 10, 7, 7); R(g, '#fff4c0', cx - 11, cy - 13, 2, 3); R(g, '#fff4c0', cx - 6, cy - 13, 2, 3); R(g, '#fff4c0', cx + 8, cy - 8, 2, 6);
    for (let i = 1; i < 8; i++) R(g, '#ffe9a0', cx - i * 9 * Math.sign(Math.cos(t * 0.8)), cy + 6 + (i % 2), 2, 2);
    starShape(g, 160, 50, 10 + Math.sin(t * 2), '#fff4c0');
  } },
  story_sepia: { music: 'night', draw(g, game, t) {
    sky(g, ['#1a1a3a', '#2a2a4a', '#3a3a5a']); stars(g, t, 50, 110, 3);
    sea(g, 130, t, '#2a3050', '#3a4060', '#c8c0a0'); headland(g, 200, 128, '#2a2a30', true, t, 0.15 + Math.sin(t * 0.5) * 0.2);
    person(g, 'hana', 120, 208, 'right', t); person(g, 'tobias', 150, 208, 'left', t + 1);
    R(g, '#d8d8e0', 112, 160, 0, 0);
    drawTextC(g, 'Spring, 1985', 160, 12, '#f0d8a8', 1, null);
    sepia(g); vignette(g);
  } },
  story_storm: { music: 'night', draw(g, game, t) {
    sky(g, ['#14142a', '#1e1e36', '#282842', '#30304a']);
    for (let i = 0; i < 8; i++) R(g, '#3a3a52', ((i * 61 - t * 30) % 380) - 40, 20 + (i % 3) * 18, 70, 12);
    sea(g, 128, t * 2.5, '#1a2440', '#2a3a5a', '#8a9ab8'); headland(g, 220, 124, '#1a1628', game.flag('little_lantern_found'), t, Math.sin(t) * 0.5);
    for (let i = 0; i < 120; i++) { const x = (hash(i, 2) * 360 - t * 90) % 360, y = (hash(i, 3) * 224 + t * 300) % 224; R(g, '#c8d8f0', (x + 360) % 360 - 20, y, 1, 4); }
    const ph = t % 5; if (ph < 0.1 || (ph > 0.2 && ph < 0.25)) { g.globalAlpha = 0.5; R(g, '#ffffff', 0, 0, 320, 224); g.globalAlpha = 1; }
  } },
  story_relight: { music: 'title', draw(g, game, t) {
    sky(g, ['#0e0a2a', '#1a1440', '#2a1e50', '#3a2a5a']); stars(g, t, 90, 120, 9);
    sea(g, 132, t, '#1a2450', '#2a3a6a', '#fff4c0');
    for (let i = 0; i < 18; i++) lantern(g, (i * 23 + t * 6) % 340 - 10, 150 + (i % 4) * 16 + Math.sin(t * 2 + i) * 1.5, t, i);
    headland(g, 70, 120, '#1a1430', true, t, t * 0.6);
    const s = Math.min(1, t / 3); starShape(g, 210, 64, 26 * s, '#fff4c088', t * 0.2); starShape(g, 210, 64, 14 * s, '#fffaf0', t * 0.2);
  } },
  story_meteor: { music: 'night', draw(g, game, t) {
    sky(g, ['#080620', '#0e0a2a', '#16123a', '#1e1848']); stars(g, t, 140, 150, 11);
    for (let i = 0; i < 6; i++) { const p = (t * 0.6 + i * 0.37) % 1.6; if (p > 1) continue; const x = 40 + hash(i, 4) * 260 - p * 80, y = 10 + hash(i, 5) * 60 + p * 50; for (let k = 0; k < 12; k++) { g.globalAlpha = 1 - k / 12; R(g, '#fff4c0', x + k * 3, y - k * 2, 2, 1); } g.globalAlpha = 1; }
    sea(g, 160, t, '#10183a', '#1a2450', '#8a9ab8'); headland(g, 270, 156, '#0e0a20', true, t, Math.PI * 0.9 + Math.sin(t * 0.4) * 0.3);
    R(g, '#2a2040', 0, 196, 320, 28); person(g, 'misa', 150, 210, 'up', t);
  } },
  story_call: { draw(g, game, t) {
    R(g, '#1a1226', 0, 0, 320, 224); R(g, '#e0707a', 38, 4, 244, 140); R(g, '#2b1d2e', 40, 6, 240, 136);
    R(g, '#9cc8e8', 44, 10, 232, 80); R(g, '#5a8cc0', 44, 60, 232, 30); R(g, '#c8b090', 44, 90, 232, 48); R(g, '#e8d8b0', 44, 90, 232, 3);
    for (let i = 0; i < 5; i++) R(g, '#d8ecf8', ((i * 53 + t * 10) % 232) + 44, 66 + (i % 3) * 7, 14, 1);
    drawPortrait(g, 'mum', 'happy', Math.floor(t * 6) % 2, 0, 84, 74); drawPortrait(g, 'dad', 'happy', Math.floor(t * 5 + 1) % 2, 0, 172, 74);
    R(g, '#e0707a', 250, 14, 22, 9); drawText(g, 'LIVE', 252, 15, '#fff8e8', 1, null);
    drawTextC(g, 'Research ship Kujira', 160, 128, '#fff8e8', 1, '#2b1d2e');
  } },
  story_archive: { draw(g, game, t) {
    R(g, '#2b2420', 0, 0, 320, 224); R(g, '#e8dcc0', 30, 14, 260, 128); R(g, '#d8c8a8', 30, 14, 260, 3);
    drawTextC(g, 'THE HOSHIMORI GAZETTE', 160, 22, '#3a2a30', 1, null); R(g, '#3a2a30', 40, 34, 240, 1);
    drawTextC(g, 'Starlight Festival cancelled', 160, 42, '#3a2a30', 1, null); drawTextC(g, 'Lantern lens damaged in storm', 160, 54, '#7a3a3a', 1, null);
    for (let i = 0; i < 7; i++) R(g, '#a89880', 44, 70 + i * 8, i % 3 === 2 ? 110 : 232, 2);
    R(g, '#8a8070', 200, 70, 76, 56); headland(g, 238, 112, '#5a5048');
  } },
  story_festival: { music: 'town', draw(g, game, t) {
    sky(g, ['#3a2a5a', '#6a3a6a', '#c86a6a', '#f0a07a']); stars(g, t, 15, 50);
    town(g, 130, '#4a3050', '#ffd76a', t, 0.8); R(g, '#c8a878', 0, 130, 320, 94); R(g, '#b89868', 0, 130, 320, 3);
    for (let i = 0; i < 16; i++) lantern(g, i * 21 + 4, 30 + Math.sin(i * 0.9) * 6, t, i);
    for (let i = 0; i < 4; i++) { const x = 20 + i * 78; R(g, '#2b1d2e', x - 1, 96, 58, 36); R(g, ['#e0707a', '#86cdb0', '#ffd76a', '#7fb2e0'][i], x, 96, 56, 8); R(g, '#e8d4a8', x, 104, 56, 26); }
    ['kai', 'hina', 'suzu', 'theo', 'rina'].forEach((id, i) => person(g, id, 60 + i * 50, 200 + (i % 2) * 6, 'down', t + i));
    person(g, 'misa', 160, 220, 'up', t);
  } },
  story_sunrise: { music: 'beach', draw(g, game, t) {
    const k = Math.min(1, t / 6);
    sky(g, ['#3a3a6a', '#7a5a8a', '#e88a7a', '#f8c88a', '#fff0c0']);
    g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(160, 128 - k * 26, 22, 0, Math.PI * 2); g.fill();
    sea(g, 128, t, '#5a5a8a', '#7a7aa8', '#fff4c0'); R(g, '#e8d0a8', 0, 182, 320, 42);
    person(g, 'misa', 150, 210, 'up', t); person(g, 'mum', 126, 210, 'up', t + 1); person(g, 'dad', 174, 210, 'up', t + 2);
    if (game.flag('lantern_lit')) headland(g, 285, 126, '#3a3050', true, t, Math.PI * 0.95);
  } },
  story_ship: { music: 'beach', draw(g, game, t) {
    sky(g, ['#c8dcf0', '#dcecf8', '#eef4fa']); sea(g, 110, t, '#5a8cc0', '#7fb2e0', '#e8f4fa');
    const x = Math.max(110, 330 - t * 40);
    R(g, '#2b1d2e', x - 1, 76, 102, 42); R(g, '#f4f0e8', x, 84, 100, 18); R(g, '#c84a4a', x, 102, 100, 14); R(g, '#e8964a', x + 30, 66, 40, 18); R(g, '#3a3a4a', x + 46, 54, 8, 12);
    drawText(g, 'KUJIRA', x + 8, 88, '#2a3a6a', 1, null);
    R(g, '#8a7060', 0, 150, 320, 74); R(g, '#a08070', 0, 150, 320, 3); person(g, 'misa', 160, 206, 'up', t);
  } },
  story_sleepover: { music: 'night', draw(g, game, t) {
    R(g, '#3a2a4a', 0, 0, 320, 224); R(g, '#1a1640', 200, 20, 80, 60); stars(g, t, 10, 0); for (let i = 0; i < 8; i++) R(g, '#fffaf0', 204 + hash(i) * 72, 24 + hash(i, 3) * 52, 1, 1);
    R(g, '#5a4a6a', 0, 150, 320, 74); R(g, '#f7a1b1', 30, 150, 120, 30); R(g, '#9cc8e8', 170, 150, 120, 30);
    R(g, '#ffd08a', 150, 120, 20, 30); g.globalAlpha = 0.2; R(g, '#ffd08a', 110, 90, 100, 100); g.globalAlpha = 1;
    person(g, 'rina', 100, 176, 'right', t); person(g, 'misa', 220, 176, 'left', t);
  } },
  story_concert: { music: 'school', draw(g, game, t) {
    R(g, '#1a1226', 0, 0, 320, 224); R(g, '#5a3a2a', 0, 140, 320, 30); R(g, '#7a4a3a', 0, 140, 320, 3);
    for (let i = 0; i < 4; i++) { g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3 + i); g.fillStyle = ['#e0707a', '#ffd76a', '#86cdb0', '#7fb2e0'][i]; g.beginPath(); g.moveTo(40 + i * 80, 0); g.lineTo(20 + i * 80, 140); g.lineTo(80 + i * 80, 140); g.fill(); }
    g.globalAlpha = 1;
    ['theo', 'kai', 'hina', 'misa'].forEach((id, i) => person(g, id, 70 + i * 60, 142, 'down', t * (1.5 + i * 0.2), 'walk'));
    for (let i = 0; i < 30; i++) R(g, '#2b1d3e', (i * 11) % 320, 180 + (i % 3) * 12 + Math.abs(Math.sin(t * 6 + i)) * 3, 8, 30);
  } },
  story_party: { music: 'cafe', draw(g, game, t) {
    R(g, '#f0e0d0', 0, 0, 320, 224); R(g, '#c8a07a', 0, 150, 320, 74); for (let i = 0; i < 12; i++) lantern(g, i * 27 + 6, 14 + Math.sin(i) * 4, t, i);
    R(g, '#2b1d2e', 99, 40, 122, 30); R(g, '#fff6e6', 100, 41, 120, 28); drawTextC(g, 'Cafe Kumo: 30 years', 160, 51, '#bd5460', 1, null);
    R(g, '#e8d4a8', 120, 120, 80, 30); R(g, '#f7a1b1', 140, 106, 40, 14); R(g, '#fff6e6', 140, 104, 40, 3);
    ['mika', 'misa', 'sachiko', 'goro', 'pip'].forEach((id, i) => person(g, id, 50 + i * 55, 196, 'down', t + i));
  } },
  story_card_bg: { draw(g) { R(g, '#120c22', 0, 0, 320, 224); } },
};
for (const [id, d] of Object.entries(BD)) register('backdrop', id, d);

// ---------------------------------------------------------------- chapter title card
const ROMAN = ['Prologue', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6', 'Chapter 7', 'Chapter 8', 'Finale'];
class CardScene {
  constructor(game, info, onDone) { Object.assign(this, { name: 'story_card', game, info, onDone, t: 0, music: 'night' }); game.sfx('star'); }
  update(dt, input) {
    this.t += dt;
    if ((this.t > 1.2 && (input.pressed.size || input.justDown)) || this.t > 4.2) { this.game.scenes.pop(this); this.onDone && this.onDone(); }
  }
  draw(g) {
    const { n, title, sub } = this.info, t = this.t, a = Math.min(1, t * 1.5);
    R(g, '#120c22', 0, 0, 320, 224); stars(g, t, 80, 224, (n || 0) + 3);
    g.globalAlpha = a;
    headland(g, 250, 150, '#1e1636', (n || 0) >= 9, t, t * 0.5); sea(g, 176, t, '#141a36', '#1e2a4a', '#5a6a9a');
    const label = typeof n === 'number' ? ROMAN[n] || `Chapter ${n}` : n || '';
    drawTextC(g, label.toUpperCase(), 160, 62, '#ffd76a', 1, null);
    R(g, '#ffd76a', 160 - 40 * a, 74, 80 * a, 1);
    drawTextC(g, title || '', 160, 84, '#fff8e8', 2, '#2b1d2e');
    if (sub) drawTextC(g, sub, 160, 110, '#b9a6c4', 1, null);
    starShape(g, 160, 40, 6 + Math.sin(t * 3), '#fff4c0', t);
    g.globalAlpha = 1;
  }
}
register('scene', 'story_card', { make: (game, info, onDone) => new CardScene(game, info, onDone) });

// ---------------------------------------------------------------- credits
const CREDITS = [
  ['Misa\'s Little Life', 'The Star Lantern'], ['Misa Aoki', 'the new Keeper'], ['Mochi', 'finder of buttons'],
  ['Grandma Hana', 'the last Keeper'], ['Tobias Wren', 'clockmaker, co-keeper'], ['Suzu, Kai, Rina, Theo, Hina', 'class 2-B'],
  ['Ms. Fujita and Mr. Ogawa', 'Hoshimori High'], ['Mika, Sachiko, Jun, Kiko, Pip, Goro', 'the good people of the bay'],
  ['Mum, Dad and Aunt Nori', 'watching from afar'], ['And you', 'for keeping the light'],
];
const VIGNETTES = ['story_bus', 'story_bay_dark', 'story_archive', 'story_sepia', 'story_storm', 'story_festival', 'story_relight', 'story_meteor'];
class CreditsScene {
  constructor(game, onDone) { Object.assign(this, { name: 'story_credits', game, onDone, t: 0, music: 'title' }); }
  update(dt, input) { this.t += dt; if ((this.t > 3 && (input.pressed.has('escape') || input.pressed.has('enter'))) || this.t > CREDITS.length * 4 + 3) { this.game.scenes.pop(this); this.onDone && this.onDone(); } }
  draw(g) {
    const t = this.t, i = Math.min(CREDITS.length - 1, Math.floor(t / 4)), k = (t % 4) / 4;
    R(g, '#0a0612', 0, 0, 320, 224);
    const seen = this.game.state.story.memories || {};
    const pool = VIGNETTES.filter((v, j) => j < 2 || Object.keys(seen).length > j);
    const bd = get('backdrop', pool[i % pool.length]);
    g.save(); g.translate(60, 20); g.scale(0.625, 0.625); if (bd) bd.draw(g, this.game, t); g.restore();
    R(g, '#fff6e6', 56, 16, 208, 4); R(g, '#fff6e6', 56, 16, 4, 148); R(g, '#fff6e6', 260, 16, 4, 148); R(g, '#fff6e6', 56, 160, 208, 18);
    g.globalAlpha = Math.min(1, k * 4, (1 - k) * 4);
    drawTextC(g, CREDITS[i][0], 160, 186, '#ffd76a', 1, null); drawTextC(g, CREDITS[i][1], 160, 200, '#b9a6c4', 1, null);
    g.globalAlpha = 1;
  }
}
register('scene', 'story_credits', { make: (game, onDone) => new CreditsScene(game, onDone) });
register('command', 'credits', { run: (g) => new Promise((res) => g.open('story_credits', res)) });

// ---------------------------------------------------------------- "Previously..." recap card
class RecapScene {
  constructor(game, info, onDone) { Object.assign(this, { name: 'story_recap', game, info, onDone, t: 0, music: 'home' }); }
  update(dt, input) { this.t += dt; if (this.t > 0.8 && (input.pressed.size || input.justDown)) { this.game.scenes.pop(this); this.onDone && this.onDone(); } }
  draw(g) {
    R(g, '#120c22', 0, 0, 320, 224); stars(g, this.t, 60, 224, 21);
    panel(g, 36, 30, 248, 164, 'paper');
    drawTextC(g, 'Previously...', 160, 40, UI.accent2, 2, null);
    drawTextC(g, this.info.title, 160, 66, UI.ink, 1, null);
    wrapPx(this.info.text, 224).slice(0, 7).forEach((l, i) => drawText(g, l, 48, 82 + i * 11, UI.ink, 1, null));
    if (this.info.next) { drawText(g, 'Next:', 48, 164, UI.accent2, 1, null); drawText(g, this.info.next.slice(0, 44), 48 + measure('Next: '), 164, UI.ink, 1, null); }
    if (this.t > 0.8) drawTextC(g, 'Press any key', 160, 182, UI.dim, 1, null);
  }
}
register('scene', 'story_recap', { make: (game, info, onDone) => new RecapScene(game, info, onDone) });

features('Story', [
  'Chapter title cards: a starry vignette with the chapter number and name each time a chapter begins',
  'Painted story backdrops: the bus arrival, the dark bay at dusk, the newspaper archive, a storm over the lighthouse, the relit lantern over the bay, a meteor shower and a sunrise',
  'Sepia flashback of young Hana and Tobias lighting the Star Lantern in 1985',
  'Dream sequences in a starfield where Misa follows a glowing cat',
  'Video calls with Mum and Dad aboard the research ship Kujira',
  'Credits roll framed like photos over the story scenes you have seen',
  '"Previously..." recap card when you load a save after three or more real days away',
]);
