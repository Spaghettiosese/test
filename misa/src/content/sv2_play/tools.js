// Pocket tools: a clip-on lantern (battery, dark-map light), a pocket watch and a compass HUD.
// Lantern: use the item (or the Play phone app). On dark maps (Hoshi Mine, the cave, attic, clock tower, shrine at night) the screen
// gets a soft vignette until it is switched on; the lantern then paints a warm banded glow around Misa. It drains 1% every 8 game
// minutes, auto-switches off when flat, and Pocket batteries (+60%) or a night's sleep recharge it.
// Watch: shows the exact time, steps and the daylight left; with the compass it also shows a needle toward your bounty or home.
import { register, get, all, features } from '../../core/registry.js';
import { spotPos } from '../../systems/festivals.js';
import { darkness } from '../../gfx/lighting.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawText } from '../../font.js';
import { S } from './state.js';

const DARK_MAPS = new Set(['hoshi_mine', 'cave', 'attic', 'clock_tower', 'community_hall']);
export const isDarkPlace = (world, game) => { const d = world.map.def; return !!(d.dark || DARK_MAPS.has(world.map.id) || (world.map.id === 'shrine' && darkness(game.minutes) > 0.6)); };
export const hooks = { target: null }; // set by the bounty module: () => { map, spot, label } | null

const rr = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
register('worldTick', 'sv2_light', {
  update(dt, world, game) {
    const l = S(game).light; if (!l.on) return;
    l.battery = Math.max(0, l.battery - (dt / 0.45) * 0.125);
    if (l.battery <= 0) { l.on = false; game.toast('The lantern battery ran out.'); game.sfx('wrong'); }
  },
});
register('worldLayer', 'sv2_light', {
  overlay(g, world, game) {
    const l = S(game).light, dark = isDarkPlace(world, game), px = world.sx(world.player.x), py = world.sy(world.player.y) - 18;
    if (l.on) {
      g.globalCompositeOperation = 'lighter';
      const R0 = dark ? 62 : 40, flick = Math.floor(game.clock * 6) % 3 - 1;
      for (let k = 0; k < 6; k++) { const r = Math.round((R0 + flick) * (1 - k / 6)), ry = Math.round(r * 0.75); g.fillStyle = dark ? 'rgba(64,44,18,0.16)' : 'rgba(40,28,10,0.07)'; for (let y = -ry; y <= ry; y++) { const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1)))); g.fillRect(px - w, py + y, w * 2 + 1, 1); } }
      g.globalCompositeOperation = 'source-over';
      rr(g, K.butter[4], px - 1, py - 12, 3, 3);
    } else if (dark) {
      const gr = g.createRadialGradient(px, py, 26, px, py, 170); gr.addColorStop(0, 'rgba(8,4,24,0)'); gr.addColorStop(1, 'rgba(8,4,24,0.5)');
      g.fillStyle = gr; g.fillRect(0, 0, 320, 224);
      if (game.has('sv2_lantern') && Math.floor(game.clock * 2) % 4 === 0) drawText(g, 'Lantern off', 4, 214, K.butter[3], 1, null);
    }
  },
});

// ---------------------------------------------------------------- compass: which way to the target?
let GRAPH = null;
function graph() {
  if (GRAPH) return GRAPH;
  GRAPH = {};
  for (const m of all('map')) {
    const ws = (get('map', m.id) || m).warps || [];
    GRAPH[m.id] = ws.map((w) => ({ to: String(w.to).split(':')[0], w }));
  }
  return GRAPH;
}
export function nextHop(from, to) {
  if (from === to) return null;
  const gr = graph(), prev = { [from]: null }, q = [from];
  while (q.length) {
    const c = q.shift();
    for (const e of gr[c] || []) if (!(e.to in prev)) { prev[e.to] = { c, w: e.w }; if (e.to === to) { let cur = e.to, hop = prev[cur]; while (hop.c !== from) { cur = hop.c; hop = prev[cur]; } return hop.w; } q.push(e.to); }
  }
  return null;
}
export function hopsBetween(from, to) {
  const gr = graph(), dist = { [from]: 0 }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) return dist[c]; for (const e of gr[c] || []) if (!(e.to in dist)) { dist[e.to] = dist[c] + 1; q.push(e.to); } }
  return 99;
}
export function compassTarget(world, game) {
  const t = (hooks.target && hooks.target(game)) || { map: 'yard', spot: 'gate', label: 'HOME' };
  const here = world.map.id; let pos = null;
  if (here === t.map) pos = spotPos(t.map, t.spot);
  else { const w = nextHop(here, t.map); if (w) pos = { x: (w.x + (w.w || 1) / 2) * 16, y: (w.y + (w.h || 1) / 2) * 16 }; }
  return pos ? { pos, label: t.label } : null;
}

register('hud', 'sv2_watch', {
  draw(g, game) {
    const w = game.world, s = S(game); if (!w || game.hideHud || !s.watch || (game.scenes.top !== w)) return;
    const mins = game.minutes, hh = Math.floor(mins / 60) % 24, mm = Math.floor(mins % 60), sec = Math.floor((game.clock * 60 / 0.45) % 60);
    const dayLeft = Math.max(0, 18 * 60 + 30 - mins), txt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    rr(g, '#2b1d2e', 2, 40, 70, 20); rr(g, K.metal[3], 3, 41, 68, 18); rr(g, '#14101c', 4, 42, 66, 16);
    drawText(g, txt, 8, 44, K.butter[4], 1, null);
    drawText(g, mins < 18 * 60 + 30 ? `${Math.floor(dayLeft / 60)}H ${dayLeft % 60}M OF LIGHT` : 'LAMP TIME', 6, 52, K.paper[2], 1, null);
    if (s.watch >= 2) {
      const cx = 22, cy = 82, r = 15;
      rr(g, '#2b1d2e', cx - r - 1, cy - r - 1, r * 2 + 2, r * 2 + 2); rr(g, '#14101c', cx - r, cy - r, r * 2, r * 2); rr(g, K.sky[3], cx - r, cy - r, r * 2, 1); rr(g, K.sky[3], cx - r, cy + r - 1, r * 2, 1);
      drawText(g, 'N', cx - 2, cy - r + 2, K.coral[3], 1, null);
      const tgt = compassTarget(w, game);
      if (tgt) {
        const a = Math.atan2(tgt.pos.y - w.player.y, tgt.pos.x - w.player.x);
        for (let i = 2; i < 12; i++) rr(g, i > 8 ? K.coral[3] : K.paper[4], cx + Math.cos(a) * i, cy + 2 + Math.sin(a) * i, 2, 2);
        drawText(g, tgt.label.slice(0, 12), 38, 78, K.butter[3], 1, null);
        drawText(g, `${Math.round(Math.hypot(tgt.pos.x - w.player.x, tgt.pos.y - w.player.y) / 16)} TILES`, 38, 87, K.paper[2], 1, null);
      }
    }
  },
});

features('Arcade & Travel', [
  'Pocket lantern: use the item to switch it on; a warm banded glow follows Misa in dark places',
  'Dark places (Hoshi Mine, the cave, attic, clock tower and the shrine at night) get a soft vignette until the lantern is on',
  'The lantern has a battery that drains slowly, switches off when flat, and recharges with Pocket batteries or a night of sleep',
  'Pocket watch HUD toggle shows the exact time with seconds and how much daylight is left',
  'Little compass adds a needle that points toward your bounty destination, or home, even through map exits',
]);
