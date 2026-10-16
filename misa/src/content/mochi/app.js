// The Mochi phone app: mood, bond hearts, four daily needs, taste journal, pose album, Kuro's meter and the stray album.
import { register, features, get } from '../../core/registry.js';
import { sprite } from '../../artcache.js';
import { drawText, drawTextC } from '../../font.js';
import { UI, rect, panel, bar } from '../../ui/ui.js';
import { ms, hearts, mood, NEEDS, NEED_NAMES, FOODS } from './state.js';
import { favourite } from './games.js';
import { POSES } from '../../systems/mochi.js';

const TABS = ['Care', 'Journal', 'Album'];
const STRAY_NAMES = { hanako: 'Hanako', sumi: 'Sumi', yuki: 'Yuki', nezumi: 'Nezumi', tux: 'Tux' };
register('phoneApp', 'mochi', {
  name: 'Mochi', icon: 'i_paw', order: 38,
  badge: (g) => (mood(g).id === 'food' || mood(g).id === 'love' ? '!' : 0),
  open(g, app) { app.state.tab = app.state.tab || 0; },
  update(dt, input, g, app) {
    const k = input.pressed, st = app.state;
    if (k.has('arrowright') || k.has('d')) st.tab = (st.tab + 1) % 3;
    if (k.has('arrowleft') || k.has('a')) st.tab = (st.tab + 2) % 3;
    if (input.justDown) { const { x, y } = app.area; for (let i = 0; i < 3; i++) if (input.mx >= x + 4 + i * 50 && input.mx < x + 52 + i * 50 && input.my >= y + 2 && input.my < y + 14) st.tab = i; }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, s = ms(game), m = mood(game), t = game.clock;
    TABS.forEach((n, i) => { const on = i === st.tab; rect(g, on ? UI.accent : UI.paper2, x + 4 + i * 50, y + 2, 48, 12); drawTextC(g, n, x + 28 + i * 50, y + 5, on ? UI.text : UI.ink, 1, null); });
    drawText(g, 'LEFT/RIGHT: TABS', x + w - 70, y + 5, UI.dim, 1, null);
    if (st.tab === 0) {
      panel(g, x + 4, y + 18, 110, 150, 'paper');
      g.drawImage(sprite(m.id === 'scared' ? 'mc_loaf_scared' : `mc_sit_${Math.floor(t * 2.2) % 4}`), x + 40, y + 26, 44 * 1, 48 * 1);
      g.drawImage(sprite(m.id === 'scared' ? 'mc_loaf_scared' : m.id === 'blissful' || m.id === 'happy' ? 'mc_sit_happy' : `mc_sit_${Math.floor(t * 2.2) % 4}`), x + 50, y + 30);
      drawTextC(g, 'Mochi', x + 59, y + 62, UI.ink, 1, null);
      drawTextC(g, m.text, x + 59, y + 74, UI.accent2, 1, null);
      drawText(g, 'BOND', x + 12, y + 90, UI.ink, 1, null);
      for (let i = 0; i < 10; i++) { g.globalAlpha = i < hearts(game) ? 1 : 0.25; g.drawImage(sprite('heart'), x + 12 + (i % 5) * 10, y + 100 + Math.floor(i / 5) * 9); }
      g.globalAlpha = 1;
      bar(g, x + 12, y + 122, 94, 4, (s.bond % 100) / 100, UI.accent);
      drawText(g, `${s.bondEvents.length}/5 EVENTS`, x + 12, y + 132, UI.dim, 1, null);
      drawText(g, s.walking ? 'ON A WALK' : s.bondEvents.includes('mochi_bond4') ? 'HARNESS READY' : 'NO HARNESS YET', x + 12, y + 144, UI.dim, 1, null);
      panel(g, x + 120, y + 18, 168, 150, 'paper');
      NEEDS.forEach((n, i) => { const v = s.needs[n]; drawText(g, NEED_NAMES[n].toUpperCase(), x + 128, y + 26 + i * 22, UI.ink, 1, null); bar(g, x + 128, y + 35 + i * 22, 150, 6, v / 100, v < 30 ? UI.bad : v < 60 ? UI.gold : UI.good); });
      drawText(g, `FAVOURITE: ${s.favouriteFound ? FOODS.find((f) => f.id === favourite(game)).name.toUpperCase() : 'NOT FOUND YET'}`, x + 128, y + 118, UI.ink, 1, null);
      drawText(g, `GIFTS ${s.gifts || 0}   CHECKUPS ${s.checkups || 0}`, x + 128, y + 130, UI.dim, 1, null);
      const k = s.kuro; if (k.stage !== 'none') { drawText(g, k.stage === 'visiting' ? `KURO TRUST ${k.accept}% (${k.fed}/7 EVENINGS)` : `KURO: ${k.stage.toUpperCase()}`, x + 128, y + 148, UI.accent2, 1, null); }
    } else if (st.tab === 1) {
      panel(g, x + 4, y + 18, w - 8, 150, 'paper');
      drawText(g, 'TASTE JOURNAL', x + 12, y + 24, UI.ink, 1, null);
      FOODS.forEach((f, i) => {
        const cy = y + 36 + Math.floor(i / 2) * 30, cx = x + 12 + (i % 2) * 140, v = s.taste[f.id];
        rect(g, UI.paper2, cx, cy, 132, 26); g.drawImage(sprite(f.icon), cx + 2, cy + 5);
        drawText(g, f.name.toUpperCase(), cx + 22, cy + 5, UI.ink, 1, null);
        if (v === undefined) drawText(g, 'NOT TRIED', cx + 22, cy + 15, UI.dim, 1, null);
        else for (let j = 0; j <= v; j++) g.drawImage(sprite('heart'), cx + 22 + j * 9, cy + 14);
        if (v === 0) drawText(g, 'NO THANKS', cx + 22, cy + 15, UI.bad, 1, null);
        if (s.favouriteFound && f.id === favourite(game)) g.drawImage(sprite('i_star'), cx + 112, cy + 4);
      });
    } else {
      panel(g, x + 4, y + 18, w - 8, 150, 'paper');
      const got = Object.keys(s.poses).length;
      drawText(g, `POSE ALBUM ${got}/${Object.keys(POSES).length}`, x + 12, y + 24, UI.ink, 1, null);
      Object.entries(POSES).forEach(([id, n], i) => { const cx = x + 12 + (i % 4) * 70, cy = y + 36 + Math.floor(i / 4) * 12; drawText(g, s.poses[id] ? n.toUpperCase().slice(0, 16) : '???', cx, cy, s.poses[id] ? UI.ink : UI.dim, 1, null); });
      drawText(g, 'CAT ALBUM', x + 12, y + 104, UI.ink, 1, null);
      Object.entries(STRAY_NAMES).forEach(([id, n], i) => { const st2 = s.strays[id]; drawText(g, st2 ? `${n.toUpperCase()} ${'*'.repeat(Math.min(3, st2.fed))}` : '???', x + 12 + (i % 3) * 90, y + 116 + Math.floor(i / 3) * 12, st2 ? UI.ink : UI.dim, 1, null); });
      void get;
    }
  },
});
features('Mochi', [
  'Mochi phone app with her portrait, mood, 10 bond hearts, four need meters and her favourite food once found',
  'The app\'s taste journal lists all eight cat foods with how much she liked each',
  'The app\'s album tracks Mochi\'s photographed poses and the stray cats you have met',
]);
