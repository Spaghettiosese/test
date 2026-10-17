// Overworld HUD: date/clock/weather, coins, energy, current objective, interaction prompt and toasts.
import { register, get, all } from '../core/registry.js';
import { clockText, WEEKDAYS, seasonOf, dateOf, weekdayOf } from '../core/time.js';
import { sprite } from '../artcache.js';
import { SPRITES } from '../art.js';
import { drawText, drawTextC, measure } from '../font.js';
import { UI, rect, panel, hearts } from './ui.js';

const WICON = { sunny: 'i_sun', cloudy: 'i_cloud', rain: 'i_rain', storm: 'i_storm', snow: 'i_snow', windy: 'i_wind' };
let BUFF_DEFS = null;
import('../content/economy/core.js').then((m) => { BUFF_DEFS = m.BUFFS; }).catch(() => {});
const SEASON_C = { spring: '#f7a1b1', summer: '#79c26a', autumn: '#e8964a', winter: '#9cc8e8' };
const icon = (g, name, x, y) => { if (SPRITES[name]) g.drawImage(sprite(name), x, y); };

const BUFF_ICON = { perk: 'i_energy', cozy: 'heart', calm: 'i_leaf', cool: 'i_snow', pampered: 'i_star' };
export function hudClock(game) {
  if (!game.settings.clock24) return clockText(game.state.time.minutes);
  const m = Math.floor(game.state.time.minutes), h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
// Active buffs from the economy slice: [{ id, left (minutes), color }]
export function activeBuffs(game) {
  const b = game.state.economy && game.state.economy.buffs, now = game.day * 1440 + game.minutes, out = [];
  if (b) for (const [id, until] of Object.entries(b)) if (until > now) out.push({ id, left: until - now });
  return out;
}
export const stageText = (o, game) => (typeof o === 'function' ? o(game) : o && typeof o === 'object' ? (typeof o.text === 'function' ? o.text(game) : o.text) : o);
export function currentObjective(game) {
  const qs = all('quest').filter((q) => game.questActive(q.id));
  qs.sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
  for (const q of qs) {
    const st = game.quest(q.id).stage, o = q.stages && q.stages[st];
    const text = stageText(o, game);
    if (text) return { quest: q, text };
  }
  return null;
}

register('hud', 'main', {
  draw(g, game) {
    const s = game.state, w = game.world;
    if (!w || game.hideHud) return;
    // date + clock
    const day = s.time.day, season = seasonOf(day);
    panel(g, 2, 2, 96, 23, 'dark');
    rect(g, SEASON_C[season], 5, 5, 3, 17);
    drawText(g, `${WEEKDAYS[weekdayOf(day)]} ${dateOf(day)}`, 11, 6, UI.gold);
    drawText(g, season.toUpperCase(), 44, 6, SEASON_C[season]);
    drawText(g, hudClock(game), 11, 15, UI.text);
    icon(g, WICON[s.weather] || 'i_sun', 82, 6);
    // coins + energy
    const coins = String(s.money);
    panel(g, 318 - 46, 2, 44, 31, 'dark');
    icon(g, 'i_coin', 318 - 42, 5);
    drawText(g, coins, 318 - 6 - measure(coins), 6, UI.text);
    const e = s.energy / s.maxEnergy;
    rect(g, UI.ink, 318 - 42, 16, 38, 6); rect(g, '#5a3a40', 318 - 41, 17, 36, 4);
    rect(g, e > 0.5 ? UI.good : e > 0.2 ? UI.gold : UI.bad, 318 - 41, 17, Math.round(36 * e), 4);
    if (e <= 0.2 && (UI.reduceMotion || Math.floor(game.clock * 2) % 2)) rect(g, UI.bad, 318 - 44, 16, 2, 6); // low-energy marker (shape cue)
    const mo = (s.mood ?? 50) / 100;
    rect(g, UI.ink, 283, 24, 32, 6); rect(g, '#5a3a40', 284, 25, 30, 4); rect(g, mo > 0.5 ? '#f29aa0' : mo > 0.25 ? UI.gold : '#9aa6c8', 284, 25, Math.round(30 * mo), 4);
    hearts(g, 275, 25, 1, 1);
    // buff icons under the money panel
    activeBuffs(game).slice(0, 5).forEach((b, i) => {
      const bx = 318 - 12 - i * 12, def = (typeof BUFF_DEFS === 'object' && BUFF_DEFS[b.id]) || {}, ic = BUFF_ICON[b.id] || 'i_star';
      rect(g, UI.ink, bx, 35, 11, 11); rect(g, def.color || UI.gold, bx + 1, 36, 9, 9); icon(g, ic, bx + 5 - Math.round((SPRITES[ic] ? SPRITES[ic].w : 0) / 2), 40 - Math.round((SPRITES[ic] ? SPRITES[ic].h : 0) / 2));
      if (b.left < 30 && (UI.reduceMotion || Math.floor(game.clock * 3) % 2)) rect(g, UI.bad, bx + 8, 33, 3, 3);
    });
    // objective tracker
    const obj = currentObjective(game);
    if (obj && game.settings.tracker !== false) {
      const t = obj.text.length > 44 ? obj.text.slice(0, 43) + '.' : obj.text, tw = measure(t) + 14;
      rect(g, '#2b1d2eb0', 2, 27, tw, 10); icon(g, 'i_quest', 3, 28); drawText(g, t, 12, 30, '#fff6c0', 1, null);
    }
    // interaction prompt
    if (game.scenes.top === w && !w.busy) {
      const t = w.target();
      if (t) {
        const txt = `E  ${t.label}`, tw = measure(txt) + 8;
        const ax = t.kind === 'npc' ? t.npc.x : t.kind === 'pet' ? t.a.x : w.player.x, ay = t.kind === 'npc' ? t.npc.y - 34 : w.player.y - 30;
        const x = Math.max(2, Math.min(318 - tw, w.sx(ax) - tw / 2)), y = Math.max(40, w.sy(ay) - 26);
        panel(g, x, y, tw, 12, 'dark'); drawText(g, txt, x + 4, y + 4, UI.gold);
      }
    }
    // low energy / late warnings
    if (s.time.minutes >= 24 * 60 && (UI.reduceMotion || Math.floor(game.clock * 2) % 2)) drawTextC(g, "IT'S LATE! GO TO BED", 160, 40, '#ffb0b0');
  },
});

// Toast queue: up to 4 stacked toasts that slide up from below, hold, then fade (newest at the bottom).
register('hud', 'toasts', {
  always: true,
  draw(g, game) {
    const topName = game.scenes.top && game.scenes.top.name, inWorld = !topName || topName === 'world'; // over menus they ride at the top
    if (topName === 'cutscene') return; // dialogue owns the screen; toasts wait it out
    game.toasts.forEach((t, i, arr) => {
      const iconW = t.icon && SPRITES[t.icon] ? SPRITES[t.icon].w + 3 : 0;
      const w = measure(t.text) + 12 + iconW, slide = UI.reduceMotion ? 0 : Math.max(0, Math.round((t.t - 2.9) * 40)), y = inWorld ? 196 - (arr.length - 1 - i) * 14 + slide : 24 + i * 14;
      g.globalAlpha = Math.max(0, Math.min(1, t.t * 2, (3.3 - t.t) * 6));
      panel(g, Math.round(160 - w / 2), y, w, 12, 'dark');
      if (iconW) g.drawImage(sprite(t.icon), Math.round(160 - w / 2) + 4, y + 6 - Math.round(SPRITES[t.icon].h / 2));
      drawText(g, t.text, Math.round(160 - w / 2) + 6 + iconW, y + 4, UI.text);
      g.globalAlpha = 1;
    });
  },
});
