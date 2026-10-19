// Phone apps: Memory Book, Town Almanac (traditions + photo wall), Rumor Mill (rumors + reputation), Self (personality + journal).
import { register, get } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { UI, rect, drawText, drawTextC, wrap, bar, inside } from '../../ui/ui.js';
import { drawPortrait } from '../../ui/portraits.js';
import { dateText, yearOf, seasonOf, dateOf } from '../../core/time.js';
import { S, memories, nameOf, short, TRAITS, REPS, repScore, repTier, traitScore } from './state.js';
import { CAST_ALL, openPromises } from './depth.js';
import { moodOf, MOOD_WORD } from './moods.js';
import { TRADS } from './traditions.js';
import { TRAD_DATE } from './tradedates.js';
import { heardList, versionFor, spreadRumor, squashRumor, squashChance } from './rumors.js';
import { REP_TEXT } from './rep.js';
import { ARCS } from './kit.js';

const icon = (name, draw) => defineSprite(name, 11, 12, (R0) => draw(R0.at(1, 1)), false, true);
icon('sv4d_memory', (R) => { R(0, 1, 9, 9, '#c0805a'); R(1, 2, 7, 7, '#fff6e6'); R(4, 1, 1, 9, '#c0805a'); R(2, 4, 2, 1, '#8a6a5a'); R(5, 4, 2, 1, '#8a6a5a'); R(2, 6, 2, 1, '#8a6a5a'); });
icon('sv4d_almanac', (R) => { R(0, 1, 9, 9, '#fff6e6'); R(0, 1, 9, 3, '#e0707a'); R(2, 5, 2, 2, '#8a6a5a'); R(5, 5, 2, 2, '#8a6a5a'); R(2, 8, 2, 1, '#8a6a5a'); });
icon('sv4d_rumor', (R) => { R(0, 1, 9, 6, '#ffd76a'); R(1, 7, 2, 2, '#ffd76a'); R(2, 3, 5, 1, '#7a4a20'); R(2, 5, 3, 1, '#7a4a20'); });
icon('sv4d_self', (R) => { R.e(4, 3, 2, 2, '#f4d2b4'); R(1, 6, 7, 4, '#7fb2e0'); R(3, 1, 3, 1, '#4a3a5a'); });

const nav = (st, input, n, rows = 13) => {
  const k = input.pressed;
  if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(n - 1, st.sel + 1);
  if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
  if (st.sel < st.top) st.top = st.sel;
  if (st.sel >= st.top + rows) st.top = st.sel - rows + 1;
};
const side = (g, lines, x, y, step = 9) => lines.forEach((l, i) => drawText(g, String(l[0]).toUpperCase(), x, y + i * step, l[1] || UI.ink, 1, null));
const wl = (txt, n, col) => wrap(txt, n).map((l) => [l, col || UI.ink]);

// ---------------------------------------------------------------- Memory Book
export function memLine(m) {
  const n = (x) => String(x || '').toLowerCase();
  switch (m.k) {
    case 'gift': return `${dateText(m.day)}: you gave ${m.name} (${m.r})`;
    case 'fest': return `${dateText(m.day)}: at ${m.name} together`;
    case 'scene': return `${dateText(m.day)}: a heart moment`;
    case 'arc': return `${dateText(m.day)}: ${m.title}`;
    case 'choice': return `${dateText(m.day)}: you said "${m.text}"`;
    case 'promise': return `${dateText(m.day)}: promise ${m.ok ? 'kept' : 'broken'}`;
    case 'comfort': return `${dateText(m.day)}: you comforted them`;
    case 'tradition': return `${dateText(m.day)}: ${m.name}`;
    case 'rumor': return `${dateText(m.day)}: a rumor about them`;
    default: return n(m.k);
  }
}
export function memorySummary(g, id) {
  const gifts = memories(g, id, 'gift'), love = gifts.filter((m) => m.r === 'love').pop();
  return {
    total: (S(g).mem[id] || []).length, lastGift: gifts[gifts.length - 1] || null, favourite: love || null,
    scenes: memories(g, id, 'scene').length + memories(g, id, 'arc').length, fests: memories(g, id, 'fest').length,
    kept: memories(g, id, 'promise').filter((m) => m.ok).length, broken: memories(g, id, 'promise').filter((m) => !m.ok).length, comforts: memories(g, id, 'comfort').length,
  };
}
register('phoneApp', 'sv4d_memory', {
  name: 'Memory Book', icon: 'sv4d_memory', order: 40,
  open(game, app) { Object.assign(app.state, { sel: 0, top: 0, tab: 0 }); },
  update(dt, input, game, app) {
    const st = app.state, list = CAST_ALL.filter((id) => get('npc', id));
    if (input.pressed.has('c')) { st.tab = (st.tab + 1) % 2; st.sel = 0; st.top = 0; game.sfx('blip'); return; }
    nav(st, input, st.tab === 0 ? list.length : Math.max(1, S(game).promises.length));
    if (st.tab === 0 && input.justDown && input.mx < app.area.x + 110) { const i = Math.floor((input.my - app.area.y - 14) / 11) + st.top; if (i >= 0 && i < list.length) st.sel = i; }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = S(game), list = CAST_ALL.filter((id) => get('npc', id));
    rect(g, UI.accent, x, y, 292, 12);
    drawText(g, st.tab === 0 ? 'MEMORY BOOK: WHAT THEY REMEMBER' : `PROMISES: ${s.prom.kept} KEPT, ${s.prom.broken} BROKEN`, x + 4, y + 3, UI.text, 1, null);
    drawText(g, 'C: SWITCH', x + 246, y + 3, UI.dim, 1, null);
    if (st.tab === 1) {
      const ps = s.promises.slice().reverse();
      if (!ps.length) { drawText(g, 'NOBODY HAS ASKED YOU FOR A PROMISE YET.', x + 6, y + 24, UI.dim, 1, null); drawText(g, 'FRIENDS AT 3+ HEARTS SOMETIMES DO.', x + 6, y + 34, UI.dim, 1, null); return; }
      ps.slice(st.top, st.top + 13).forEach((p, r) => {
        const yy = y + 14 + r * 12, col = p.state === 'kept' ? UI.good : p.state === 'broken' ? UI.bad : UI.ink;
        if (st.top + r === st.sel) rect(g, UI.gold, x, yy - 1, 292, 11);
        drawText(g, `${p.state.toUpperCase().slice(0, 4)} ${p.text}`.slice(0, 54).toUpperCase(), x + 4, yy + 1, col, 1, null);
      });
      return;
    }
    list.slice(st.top, st.top + 13).forEach((id, r) => {
      const yy = y + 14 + r * 11, m = S(game).mem[id] || [];
      if (st.top + r === st.sel) rect(g, UI.gold, x, yy, 110, 10);
      rect(g, (get('npc', id) || {}).color || UI.accent, x + 2, yy + 2, 3, 6);
      drawText(g, short(id).slice(0, 9).toUpperCase(), x + 8, yy + 3, UI.ink, 1, null);
      drawText(g, String(m.length), x + 90, yy + 3, UI.dim, 1, null);
    });
    const id = list[Math.min(st.sel, list.length - 1)], sm = memorySummary(game, id), px = x + 116;
    rect(g, UI.paper2, px - 3, y + 13, 178, 158);
    drawPortrait(g, id, 'happy', 0, 0, px, y + 16);
    side(g, [[nameOf(id), UI.accent2], [`HEARTS ${game.hearts(id)}/10`, UI.ink2], [`MOOD: ${MOOD_WORD[moodOf(game, id)]}`, UI.ink2]], px + 68, y + 18);
    const lines = [
      [`FAVOURITE GIFT: ${sm.favourite ? sm.favourite.name : '?'}`.slice(0, 40)], [`LAST GIFT: ${sm.lastGift ? `${sm.lastGift.name} (${sm.lastGift.r})` : 'NONE'}`.slice(0, 40)],
      [`SCENES: ${sm.scenes}  FESTIVALS: ${sm.fests}`], [`PROMISES: ${sm.kept} KEPT, ${sm.broken} BROKEN`], [`COMFORTED: ${sm.comforts}`],
    ];
    side(g, lines, px, y + 84);
    const recent = (S(game).mem[id] || []).slice(-3).reverse();
    drawText(g, 'REMEMBERS:', px, y + 132, UI.accent2, 1, null);
    recent.forEach((m, i) => drawText(g, memLine(m).slice(0, 40).toUpperCase(), px, y + 141 + i * 9, UI.ink, 1, null));
    if (!recent.length) drawText(g, 'NOTHING YET. TALK, GIVE, SHARE DAYS.', px, y + 141, UI.dim, 1, null);
  },
});

// ---------------------------------------------------------------- Town Almanac
export const tradList = () => TRADS.filter((t) => get('npc', t.id));
register('phoneApp', 'sv4d_almanac', {
  name: 'Town Almanac', icon: 'sv4d_almanac', order: 41,
  open(game, app) { Object.assign(app.state, { sel: 0, top: 0, tab: 0 }); },
  update(dt, input, game, app) {
    const st = app.state;
    if (input.pressed.has('c')) { st.tab = (st.tab + 1) % 2; st.sel = 0; st.top = 0; game.sfx('blip'); return; }
    nav(st, input, st.tab === 0 ? tradList().length : Math.max(1, S(game).photos.length), st.tab === 0 ? 13 : 6);
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = S(game), y0 = yearOf(game.day);
    rect(g, UI.accent, x, y, 292, 12);
    drawText(g, st.tab === 0 ? 'TOWN ALMANAC: TRADITIONS' : `PHOTO WALL: ${s.photos.length} PHOTOS`, x + 4, y + 3, UI.text, 1, null);
    drawText(g, 'C: SWITCH', x + 246, y + 3, UI.dim, 1, null);
    if (st.tab === 0) {
      const list = tradList();
      list.slice(st.top, st.top + 13).forEach((t, r) => {
        const yy = y + 14 + r * 11, done = s.trad[t.id] === y0;
        if (st.top + r === st.sel) rect(g, UI.gold, x, yy, 130, 10);
        drawText(g, short(t.id).slice(0, 8).toUpperCase(), x + 3, yy + 3, UI.ink, 1, null);
        drawText(g, TRAD_DATE[t.id].replace('-', ' ').toUpperCase().slice(0, 9), x + 52, yy + 3, done ? UI.good : UI.dim, 1, null);
      });
      const t = list[Math.min(st.sel, list.length - 1)], px = x + 136, d = get('npc', t.id), b = d.birthday;
      rect(g, UI.paper2, px - 3, y + 13, 160, 158);
      side(g, [[t.name, UI.accent2], [`${nameOf(t.id)}`, UI.ink2], [`DATE: ${TRAD_DATE[t.id].replace('-', ' ')}`, UI.ink], [`PLACE: ${(get('map', t.map) || { name: t.map }).name}`.slice(0, 38), UI.ink],
        [b ? `BIRTHDAY: ${b.season} ${b.day}` : '', UI.dim], [`NEEDS 3 HEARTS`, game.hearts(t.id) >= 3 ? UI.good : UI.dim], [s.trad[t.id] === y0 ? 'DONE THIS YEAR' : 'WAITING', s.trad[t.id] === y0 ? UI.good : UI.dim]], px, y + 18);
      const years = s.photos.filter((p) => p.id === t.id).length;
      drawText(g, `PHOTOS ON THE WALL: ${years}`, px, y + 90, UI.ink2, 1, null);
      drawPortrait(g, t.id, 'happy', 0, 0, px + 40, y + 100);
      return;
    }
    if (!s.photos.length) { drawText(g, 'JOIN A TRADITION ON ITS DAY TO PIN', x + 6, y + 24, UI.dim, 1, null); drawText(g, 'THE FIRST PHOTO ON THE WALL.', x + 6, y + 34, UI.dim, 1, null); return; }
    const ph = s.photos.slice().reverse().slice(st.top, st.top + 6);
    ph.forEach((p, i) => {
      const cx = x + 4 + (i % 3) * 96, cy = y + 16 + Math.floor(i / 3) * 76, t = get('npc', p.id);
      rect(g, '#00000030', cx + 2, cy + 2, 90, 70); rect(g, '#fffaf0', cx, cy, 90, 70);
      rect(g, ((t && t.color) || '#9ac8e0') + '66', cx + 4, cy + 4, 82, 40);
      drawPortrait(g, p.id, 'happy', 0, 0, cx + 13, cy + 3);
      const tr = TRADS.find((q) => q.id === p.id);
      drawText(g, (tr ? tr.name : p.id).slice(0, 15).toUpperCase(), cx + 4, cy + 48, UI.ink, 1, null);
      drawText(g, `YEAR ${p.year}`, cx + 4, cy + 58, UI.dim, 1, null);
    });
  },
});

// ---------------------------------------------------------------- Rumor Mill
register('phoneApp', 'sv4d_rumor', {
  name: 'Rumor Mill', icon: 'sv4d_rumor', order: 42,
  open(game, app) { Object.assign(app.state, { sel: 0, top: 0, tab: 0, msg: '' }); },
  update(dt, input, game, app) {
    const st = app.state, list = heardList(game), k = input.pressed;
    if (k.has('c')) { st.tab = (st.tab + 1) % 2; st.msg = ''; game.sfx('blip'); return; }
    if (st.tab !== 0 || !list.length) return;
    nav(st, input, list.length);
    const r = list[Math.min(st.sel, list.length - 1)];
    if (k.has('enter') || k.has('e')) { const o = spreadRumor(game, r.def.id); st.msg = o.line; game.sfx(o.ok ? 'chime' : 'wrong'); }
    if (k.has('q')) { const o = squashRumor(game, r.def.id); st.msg = o.line; game.sfx(o.ok ? 'chime' : 'wrong'); }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = heardList(game);
    rect(g, UI.accent, x, y, 292, 12);
    drawText(g, st.tab === 0 ? `RUMOR MILL: ${list.length} HEARD` : 'REPUTATION', x + 4, y + 3, UI.text, 1, null);
    drawText(g, 'C: SWITCH', x + 246, y + 3, UI.dim, 1, null);
    if (st.tab === 1) {
      REPS.forEach((c, i) => {
        const yy = y + 18 + i * 28, sc = repScore(game, c), t = repTier(game, c);
        drawText(g, `${c.toUpperCase()}  TIER ${t}`, x + 6, yy, UI.accent2, 1, null);
        bar(g, x + 150, yy, 120, 6, Math.min(1, sc / 36), UI.mint);
        wrap(REP_TEXT[c], 60).slice(0, 2).forEach((l, j) => drawText(g, l.toUpperCase(), x + 6, yy + 9 + j * 8, UI.ink, 1, null));
      });
      return;
    }
    if (!list.length) { drawText(g, 'NO RUMORS YET. TALK TO GOSSIPS LIKE PIP,', x + 6, y + 24, UI.dim, 1, null); drawText(g, 'SACHIKO, HINA AND KAI.', x + 6, y + 34, UI.dim, 1, null); return; }
    list.slice(st.top, st.top + 13).forEach((r, i) => {
      const yy = y + 14 + i * 11, live = r.st.status === 'live';
      if (st.top + i === st.sel) rect(g, UI.gold, x, yy, 120, 10);
      drawText(g, r.def.title.slice(0, 17).toUpperCase(), x + 3, yy + 3, live ? UI.ink : UI.dim, 1, null);
    });
    const r = list[Math.min(st.sel, list.length - 1)], px = x + 126, holders = Object.keys(r.st.holders).length;
    rect(g, UI.paper2, px - 3, y + 13, 168, 158);
    const lines = [[r.def.title, UI.accent2], [`ABOUT ${short(r.def.subject)}  (${r.def.kind})`, UI.ink2], ['', UI.ink], ...wl(versionFor(r.def, r.h.hops), 38), ['', UI.ink],
      [`KNOWN BY ${holders} PEOPLE`, UI.ink2], [`STATUS: ${r.st.status}${r.st.by === 'spread' ? ' (YOU SPREAD IT)' : ''}`, r.st.status === 'live' ? UI.good : UI.dim]];
    side(g, lines.slice(0, 15), px, y + 16);
    if (st.msg) wrap(st.msg, 38).slice(0, 2).forEach((l, i) => drawText(g, l.toUpperCase(), px, y + 134 + i * 9, UI.accent2, 1, null));
    rect(g, UI.mint, px, y + 160, 162, 10);
    drawTextC(g, `ENTER: SPREAD   Q: SQUASH ${Math.round(squashChance(game) * 100)}%`, px + 81, y + 162, UI.ink, 1, null);
  },
});

// ---------------------------------------------------------------- Self
const TRAIT_INFO = {
  kind: ['Kind', 'Grows with gifts and comforting. Opens gentle options in character studies.'],
  curious: ['Curious', 'Grows with books and discoveries. Opens clever questions.'],
  brave: ['Brave', 'Grows with night outings and bold choices. Opens daring options.'],
  calm: ['Calm', 'Grows with fishing, sleep and steady choices. Opens soothing options and helps squash rumors.'],
};
register('phoneApp', 'sv4d_self', {
  name: 'Self', icon: 'sv4d_self', order: 43,
  open(game, app) { Object.assign(app.state, { sel: 0, top: 0, tab: 0 }); },
  update(dt, input, game, app) {
    const st = app.state;
    if (input.pressed.has('c')) { st.tab = (st.tab + 1) % 2; st.sel = 0; st.top = 0; game.sfx('blip'); return; }
    if (st.tab === 1) nav(st, input, Math.max(1, S(game).journal.length));
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = S(game);
    rect(g, UI.accent, x, y, 292, 12);
    drawText(g, st.tab === 0 ? 'SELF: PERSONALITY' : `JOURNAL: ${s.journal.length} ENTRIES`, x + 4, y + 3, UI.text, 1, null);
    drawText(g, 'C: SWITCH', x + 246, y + 3, UI.dim, 1, null);
    if (st.tab === 0) {
      TRAITS.forEach((t, i) => {
        const yy = y + 20 + i * 34, sc = traitScore(game, t);
        drawText(g, `${TRAIT_INFO[t][0]}  ${sc}`.toUpperCase(), x + 6, yy, UI.accent2, 1, null);
        bar(g, x + 120, yy, 150, 6, Math.min(1, sc / 10), UI.mint);
        wrap(TRAIT_INFO[t][1], 66).slice(0, 2).forEach((l, j) => drawText(g, l.toUpperCase(), x + 6, yy + 10 + j * 8, UI.ink, 1, null));
      });
      const done = Object.values(s.arc).reduce((a, b) => a + b, 0);
      drawText(g, `CHARACTER STUDIES: ${done}/${Object.keys(ARCS).length * 3}`, x + 6, y + 158, UI.ink2, 1, null);
      return;
    }
    if (!s.journal.length) { drawText(g, 'CHARACTER STUDIES ADD A PAGE EACH.', x + 6, y + 24, UI.dim, 1, null); return; }
    const list = s.journal.slice().reverse();
    list.slice(st.top, st.top + 13).forEach((j, i) => {
      const yy = y + 14 + i * 11;
      if (st.top + i === st.sel) rect(g, UI.gold, x, yy, 120, 10);
      drawText(g, `${short(j.npc).slice(0, 6)} ${j.part}`.toUpperCase(), x + 3, yy + 3, UI.ink, 1, null);
    });
    const j = list[Math.min(st.sel, list.length - 1)], px = x + 126;
    rect(g, UI.paper2, px - 3, y + 13, 168, 158);
    side(g, [[j.title.replace(/^[^:]*:\s*/, ''), UI.accent2], [dateText(j.day), UI.ink2], ['', UI.ink], ...wl(j.text || '', 38)].slice(0, 16), px, y + 16);
  },
});
