// Full-screen backdrops for heart events: a video-call frame for family calls, a sepia flashback,
// a starry night sky and a harbour sunset. Used with the script step { t: 'scene', name }.
import { register, features } from '../../core/registry.js';
import { drawPortrait } from '../../ui/portraits.js';
import { drawTextC } from '../../font.js';

const stars = (g, t, n, c) => { for (let k = 0; k < n; k++) { const tw = (Math.sin(t * 2 + k) + 1) / 2; g.fillStyle = tw > 0.7 ? '#fffaf0' : c; g.fillRect((k * 83 + 17) % 318, (k * 47 + 5) % 130, 1, 1); } };

function call(who, bg) {
  return { draw(g, game, t) {
    g.fillStyle = '#171233'; g.fillRect(0, 0, 320, 224); stars(g, t, 40, '#5a4f80');
    g.fillStyle = '#2b1d2e'; g.fillRect(96, 6, 128, 134); g.fillStyle = bg; g.fillRect(100, 18, 120, 116);
    g.fillStyle = '#e0707a'; g.fillRect(100, 10, 120, 6);
    drawTextC(g, 'VIDEO CALL', 160, 11, '#fff6e6', 1, null);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#ffffff22' : '#00000018'; g.fillRect(100, 18 + i * 20, 120, 10); }
    g.save(); g.translate(128, 40); g.scale(1, 1); drawPortrait(g, who, 'happy', Math.floor(t * 3) % 2, t % 4 < 0.15 ? 1 : 0, 0, 0); g.restore();
    g.fillStyle = '#e0605a'; g.fillRect(154, 128, 12, 4);
  } };
}
register('backdrop', 'soc_call_mum', call('mum', '#9cc8e8'));
register('backdrop', 'soc_call_dad', call('dad', '#f0d8a8'));
register('backdrop', 'soc_call_nori', call('nori', '#e8c8e0'));
register('backdrop', 'soc_sepia', { draw(g, game, t) {
  g.fillStyle = '#5a4630'; g.fillRect(0, 0, 320, 224);
  g.fillStyle = '#8a7050'; g.fillRect(0, 70, 320, 74);
  g.fillStyle = '#c8b088'; g.fillRect(222, 40, 14, 104); g.fillRect(216, 30, 26, 12); // a lighthouse
  g.fillStyle = '#f0e0b0'; g.globalAlpha = 0.4 + Math.sin(t * 2) * 0.2; g.fillRect(150, 34, 70, 4); g.globalAlpha = 1;
  for (let k = 0; k < 30; k++) { g.fillStyle = '#3a2c1c55'; g.fillRect((k * 61 + t * 30) % 320, (k * 37) % 224, 1, 3); }
  g.strokeStyle = '#2a1e12'; g.lineWidth = 6; g.strokeRect(3, 3, 314, 218);
} });
register('backdrop', 'soc_stars', { draw(g, game, t) {
  g.fillStyle = '#141032'; g.fillRect(0, 0, 320, 224); stars(g, t, 120, '#6a5fa0');
  g.fillStyle = '#c8a050'; g.beginPath(); g.arc(250, 40, 9, 0, 7); g.fill(); g.fillStyle = '#e8c878'; g.fillRect(236, 39, 28, 2);
  g.fillStyle = '#0a0820'; g.fillRect(0, 128, 320, 96);
} });
register('backdrop', 'soc_sunset', { draw(g, game, t) {
  const sky = ['#f7a1b1', '#f0b080', '#e8c878', '#d88a6a'];
  sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 34, 320, 34); });
  g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(160, 128, 22, 0, 7); g.fill();
  g.fillStyle = '#4a5a8a'; g.fillRect(0, 128, 320, 96);
  for (let k = 0; k < 14; k++) { g.fillStyle = '#ffe8a088'; g.fillRect(130 + ((k * 13) % 60), 134 + k * 4, 20 - k, 1); }
} });

features('Cutscenes', [
  'Video-call frames for phone calls with Mum, Dad and Aunt Nori',
  'Sepia flashback, starry sky and harbour sunset backdrops in heart events',
]);
