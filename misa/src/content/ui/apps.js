// Phone apps owned by the ui area: Map, Calendar, Messages, Stats. All have 16 px+ tap targets.
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, drawTextC, wrap, bar, icon, hearts, scrollbar } from '../../ui/ui.js';
import { SEASONS, SEASON_DAYS, WEEKDAYS, seasonOf, dateOf, weekdayOf, dateText, yearOf } from '../../core/time.js';
import { tap, hit, clamp } from './kit.js';

// ------------------------------------------------------------------ Map
const NODES = {
  shrine: ['Shrine', 100, 2, 'Hoshi Hill Shrine'], school_grounds: ['School', 40, 26, 'School grounds'], town: ['Town', 100, 40, 'Hoshimori Town'], shotengai: ['Shops', 146, 40, 'Shotengai shopping street'],
  goro_house: ['Goro', 0, 64, "Goro's house"], lane: ['Lane', 40, 64, 'Lantern lane'], park: ['Park', 100, 64, 'Hoshimori Park'], harbour: ['Harbour', 146, 64, 'Harbour'],
  yard: ['Yard', 40, 88, 'Front yard'], sunny_pines: ['Pines', 100, 88, 'Sunny Pines home'], beach: ['Beach', 146, 88, 'Beach'],
  home: ['Home', 40, 112, "Grandma's house"], cave: ['Cave', 100, 112, 'Tide pool cave'], lighthouse: ['Light', 146, 112, 'Lighthouse'],
};
const EDGES = [['shrine', 'town'], ['school_grounds', 'town'], ['town', 'shotengai'], ['town', 'park'], ['town', 'harbour'], ['town', 'lane'], ['lane', 'goro_house'], ['lane', 'park'], ['lane', 'yard'], ['yard', 'home'], ['park', 'sunny_pines'], ['harbour', 'beach'], ['beach', 'cave'], ['beach', 'lighthouse'], ['school_grounds', 'lane']];
const MAP_SHOPS = { town: ['cafe', 'mart', 'post'], shotengai: ['salon', 'clinic', 'woodworks', 'stall'], harbour: ['bait', 'fishmarket', 'market', 'ramen', 'noodles'], beach: ['shavedice'], yard: [] };
const NW = 38, NH = 18, MX = 4, MY = 6;
const centre = (id) => [MX + NODES[id][1] + NW / 2, MY + NODES[id][2] + NH / 2];
const hline = (g, c, x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i += 2) g.fillRect(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), 2, 2); };
register('phoneApp', 'map', {
  name: 'Map', icon: 'i_map', order: 36,
  open(game, app) { app.state.sel = game.state.map in NODES ? game.state.map : 'town'; },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed;
    for (const [id, n] of Object.entries(NODES)) if (hit(input, x + MX + n[1], y + MY + n[2], NW, NH)) { st.sel = id; game.sfx('blip'); }
    const dirs = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
    for (const key of k) if (dirs[key]) {
      const [dx, dy] = dirs[key], c = NODES[st.sel]; let best = null, bd = 1e9;
      for (const [id, n] of Object.entries(NODES)) { if (id === st.sel) continue; const ox = n[1] - c[1], oy = n[2] - c[2]; if (ox * dx + oy * dy <= 0) continue; const d = Math.hypot(ox, oy) + Math.abs(dx ? oy : ox) * 1.5; if (d < bd) { bd = d; best = id; } }
      if (best) st.sel = best;
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, here = game.state.map;
    rect(g, '#cfe8d0', x, y, 188, 172);
    g.fillStyle = '#b89a6a'; for (const [a, b] of EDGES) { const [x0, y0] = centre(a), [x1, y1] = centre(b); hline(g, null, x + x0, y + y0, x + x1, y + y1); }
    for (const [id, n] of Object.entries(NODES)) {
      const on = id === st.sel, nx = x + MX + n[1], ny = y + MY + n[2];
      rect(g, UI.ink, nx, ny, NW, NH); rect(g, on ? UI.gold : id === here ? UI.accent : UI.paper, nx + 1, ny + 1, NW - 2, NH - 2);
      drawTextC(g, n[0], nx + NW / 2, ny + 5, id === here && !on ? UI.text : UI.ink, 1, null);
      if (id === here && Math.floor(game.clock * 2) % 2 + (UI.reduceMotion ? 1 : 0) > 0) rect(g, UI.bad, nx + NW - 5, ny - 3, 6, 6);
    }
    drawText(g, 'Red dot: you are here', x + 4, y + 158, UI.dim, 1, null);
    const n = NODES[st.sel];
    panel(g, x + 192, y, 100, 172, 'paper');
    wrap(n[3], 20).forEach((l, i) => drawText(g, l, x + 197, y + 5 + i * 9, UI.accent2, 1, null));
    drawText(g, st.sel === here ? 'You are here' : get('map', st.sel) ? 'Tap places to look' : '', x + 197, y + 25, UI.dim, 1, null);
    let yy = y + 38;
    for (const sid of MAP_SHOPS[st.sel] || []) {
      const s = get('shop', sid); if (!s) continue;
      const open = game.shopOpen ? game.shopOpen(sid) : true;
      drawText(g, s.name, x + 197, yy, UI.ink, 1, null);
      drawText(g, open ? 'Open now' : 'Closed', x + 197, yy + 9, open ? UI.good : UI.bad, 1, null);
      const hrs = (game.shopHours ? game.shopHours(sid) : '').replace(/^Open /, '');
      if (hrs) wrap(hrs, 20).slice(0, 2).forEach((l, i) => drawText(g, l, x + 197, yy + 18 + i * 8, UI.dim, 1, null));
      yy += 34; if (yy > y + 150) break;
    }
    if (!(MAP_SHOPS[st.sel] || []).length) drawText(g, 'No shops here.', x + 197, yy, UI.dim, 1, null);
  },
});

// ------------------------------------------------------------------ Calendar
const absDay = (season, date, year) => (year - 1) * SEASON_DAYS * 4 + SEASONS.indexOf(season) * SEASON_DAYS + date;
function dayEvents(game, day) {
  const out = [], s = seasonOf(day), d = dateOf(day);
  if (game.festivalsOn) for (const f of game.festivalsOn(day)) out.push({ k: 'fest', text: f.name, icon: f.icon || 'i_star' });
  for (const n of all('npc')) if (n.birthday && n.birthday.season === s && n.birthday.day === d && !n.hidden) out.push({ k: 'bday', text: `${n.name}'s birthday`, icon: 'heart' });
  if (game.jobBookings) for (const b of game.jobBookings()) if (b.day === day) out.push({ k: 'job', text: `Job: ${(get('job', b.job) || { name: b.job }).name || b.job}`, icon: 'i_coin' });
  return out;
}
register('phoneApp', 'calendar', {
  name: 'Calendar', icon: 'i_cal', order: 35,
  open(game, app) { app.state.sel = game.day; },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed, base = st.sel - dateOf(st.sel) + 1;
    const move = (d) => { st.sel = Math.max(1, st.sel + d); game.sfx('blip'); };
    if (k.has('arrowleft') || k.has('a')) move(-1);
    if (k.has('arrowright') || k.has('d')) move(1);
    if (k.has('arrowup') || k.has('w')) move(-7);
    if (k.has('arrowdown') || k.has('s')) move(7);
    if (k.has(',') || hit(input, x, y, 50, 18)) move(-SEASON_DAYS);
    if (k.has('.') || hit(input, x + 242, y, 50, 18)) move(SEASON_DAYS);
    if (hit(input, x + 100, y, 92, 18)) { st.sel = game.day; }
    for (let i = 0; i < SEASON_DAYS; i++) if (hit(input, x + 6 + (i % 7) * 40, y + 38 + Math.floor(i / 7) * 22, 39, 21)) st.sel = base + i;
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, base = st.sel - dateOf(st.sel) + 1, s = seasonOf(st.sel);
    tap(g, game, x, y, 50, 18, '< Prev'); tap(g, game, x + 242, y, 50, 18, 'Next >'); tap(g, game, x + 100, y, 92, 18, 'Today');
    drawTextC(g, `${s.toUpperCase()} - YEAR ${yearOf(st.sel)}`, x + 146, y + 21, UI.accent2, 1, null);
    WEEKDAYS.forEach((w, i) => drawTextC(g, w, x + 26 + i * 40, y + 30, i > 4 ? UI.bad : UI.dim, 1, null));
    for (let i = 0; i < SEASON_DAYS; i++) {
      const d = base + i, cx = x + 6 + (i % 7) * 40, cy = y + 38 + Math.floor(i / 7) * 22, ev = dayEvents(game, d);
      rect(g, d === st.sel ? UI.ink : UI.line, cx, cy, 39, 21); rect(g, d === game.day ? UI.accent : d === st.sel ? UI.gold : d < game.day ? UI.paper2 : UI.paperHi, cx + 1, cy + 1, 37, 19);
      drawText(g, String(i + 1), cx + 3, cy + 3, d === game.day ? UI.text : UI.ink, 1, null);
      ev.slice(0, 3).forEach((e, j) => rect(g, e.k === 'fest' ? UI.sky : e.k === 'bday' ? UI.bad : UI.good, cx + 4 + j * 9, cy + 13, 6, 5));
    }
    const ev = dayEvents(game, st.sel);
    drawText(g, `${dateText(st.sel)}${st.sel === game.day ? ' (today)' : ''}`, x + 6, y + 128, UI.ink, 1, null);
    if (!ev.length) drawText(g, 'Nothing planned.', x + 6, y + 140, UI.dim, 1, null);
    ev.slice(0, 3).forEach((e, i) => { icon(g, e.icon, x + 6, y + 139 + i * 11); drawText(g, e.text, x + 22, y + 140 + i * 11, UI.ink, 1, null); });
    drawText(g, 'Blue: festival  Red: birthday  Green: job', x + 6, y + 164, UI.dim, 1, null);
  },
});

// ------------------------------------------------------------------ Messages
const MH = 18, MV = 8;
const unread = (game) => game.state.mail.filter((m) => !m.read).length;
register('phoneApp', 'messages', {
  name: 'Messages', icon: 'i_mail', order: 24,
  badge: (game) => unread(game) || 0,
  open(game, app) { app.state.sel = 0; app.state.top = 0; },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, list = game.state.mail, k = input.pressed, n = list.length;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(n - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.wheel) st.top = clamp(st.top + Math.sign(input.wheel), 0, Math.max(0, n - MV));
    for (let r = 0; r < MV; r++) if (r + st.top < n && hit(input, x, y + 20 + r * MH, 128, MH - 1)) { st.sel = r + st.top; game.sfx('blip'); }
    st.sel = clamp(st.sel, 0, Math.max(0, n - 1));
    if (st.sel < st.top) st.top = st.sel; if (st.sel >= st.top + MV) st.top = st.sel - MV + 1;
    const m = list[st.sel]; if (m) m.read = true;
    if (m && (k.has('delete') || k.has('x') || hit(input, x + 214, y + 152, 78, 18))) { list.splice(st.sel, 1); game.sfx('back'); }
    if (hit(input, x, y, 128, 18)) { list.forEach((q) => { q.read = true; }); game.sfx('select'); }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = game.state.mail;
    tap(g, game, x, y, 128, 18, unread(game) ? `Mark all read (${unread(game)})` : 'All caught up');
    if (!list.length) { drawText(g, 'No messages yet.', x + 6, y + 28, UI.dim, 1, null); return; }
    for (let r = 0; r < MV; r++) {
      const m = list[r + st.top]; if (!m) break;
      const yy = y + 20 + r * MH;
      rect(g, r + st.top === st.sel ? UI.gold : UI.paperHi, x, yy, 124, MH - 1);
      if (!m.read) rect(g, UI.accent, x + 2, yy + 2, 4, 4);
      drawText(g, String(m.from).slice(0, 18), x + 9, yy + 2, UI.ink, 1, null);
      drawText(g, String(m.text).slice(0, 22), x + 9, yy + 10, UI.dim, 1, null);
    }
    scrollbar(g, x + 125, y + 20, MV * MH, st.top, MV, list.length);
    const m = list[st.sel]; if (!m) return;
    panel(g, x + 132, y, 160, 172, 'paper');
    drawText(g, `From: ${m.from}`, x + 138, y + 5, UI.accent2, 1, null);
    drawText(g, m.day ? dateText(m.day) : '', x + 138, y + 14, UI.dim, 1, null);
    wrap(String(m.text), 30).slice(0, 14).forEach((l, i) => drawText(g, l, x + 138, y + 26 + i * 9, UI.ink, 1, null));
    tap(g, game, x + 214, y + 152, 78, 18, 'Delete');
  },
});

// ------------------------------------------------------------------ Stats
const TABS = ['Misa', 'Skills', 'Counters'];
const pretty = (k) => k.replace(/([A-Z])/g, ' $1').replace(/[_:]/g, ' ').replace(/^./, (c) => c.toUpperCase());
register('phoneApp', 'stats', {
  name: 'Stats', icon: 'i_energy', order: 85,
  open(game, app) { app.state.tab = app.state.tab || 0; app.state.top = 0; },
  counters(game) { return Object.entries(game.state.stats).filter(([, v]) => typeof v === 'number' && v > 0).sort((a, b) => a[0].localeCompare(b[0])); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed, n = this.counters(game).length;
    TABS.forEach((t, i) => { if (hit(input, x + i * 97, y, 96, 18)) { st.tab = i; st.top = 0; } });
    if (k.has('c')) { st.tab = (st.tab + 1) % 3; st.top = 0; }
    if (k.has('arrowdown') || k.has('s')) st.top = clamp(st.top + 1, 0, Math.max(0, n - 12));
    if (k.has('arrowup') || k.has('w')) st.top = clamp(st.top - 1, 0, Math.max(0, n - 12));
    if (input.wheel) st.top = clamp(st.top + Math.sign(input.wheel), 0, Math.max(0, n - 12));
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = game.state;
    TABS.forEach((t, i) => tap(g, game, x + i * 97, y, 96, 18, t, { focused: st.tab === i, style: st.tab === i ? 'mint' : 'paper' }));
    const T = (t, xx, yy, c = UI.ink) => drawText(g, t, xx, yy, c, 1, null);
    if (st.tab === 0) {
      T(`Day ${game.day}  -  ${dateText(game.day)}`, x + 6, y + 26, UI.accent2);
      T(`Time played: ${Math.floor(s.playMs / 3600000)}h ${Math.round(s.playMs / 60000) % 60}m`, x + 6, y + 38);
      T(`Coins: ${s.money}`, x + 6, y + 50);
      T('Energy', x + 6, y + 66); bar(g, x + 60, y + 66, 120, 6, s.energy / s.maxEnergy, UI.good);
      T(`${Math.round(s.energy)}/${s.maxEnergy}`, x + 190, y + 66);
      T('Mood', x + 6, y + 80); bar(g, x + 60, y + 80, 120, 6, s.mood / 100, UI.accent);
      T(`${Math.round(s.mood)}/100`, x + 190, y + 80);
      const fr = all('npc').filter((n) => !n.hidden && game.hearts(n.id) > 0);
      T(`Friends: ${fr.length}   Hearts: ${fr.reduce((a, n) => a + game.hearts(n.id), 0)}`, x + 6, y + 96);
      const best = fr.sort((a, b) => game.hearts(b.id) - game.hearts(a.id))[0];
      if (best) { T(`Best friend: ${best.name}`, x + 6, y + 108); hearts(g, x + 130, y + 110, game.hearts(best.id)); }
      T(`Quests done: ${all('quest').filter((q) => game.questDone(q.id)).length}/${all('quest').length}`, x + 6, y + 122);
      T(`Bag: ${Object.values(s.inv).reduce((a, b) => a + b, 0)} items`, x + 6, y + 134);
    } else if (st.tab === 1) {
      all('skill').forEach((sk, i) => {
        const yy = y + 24 + i * 20, lv = game.skillLevel(sk.id);
        if (sk.icon) icon(g, sk.icon, x + 6, yy);
        T(sk.name, x + 24, yy + 2); bar(g, x + 100, yy + 2, 140, 6, lv / 10, UI.sky); T(`Lv ${lv}`, x + 248, yy + 2, UI.accent2);
      });
    } else {
      const list = this.counters(game);
      if (!list.length) T('Nothing counted yet. Go live your life!', x + 6, y + 26, UI.dim);
      list.slice(st.top, st.top + 12).forEach(([k, v], i) => { T(pretty(k).slice(0, 36), x + 6, y + 24 + i * 12); drawText(g, String(v), x + 286 - String(v).length * 5, y + 24 + i * 12, UI.accent2, 1, null); });
      scrollbar(g, x + 289, y + 24, 144, st.top, 12, list.length);
    }
  },
});

features('Phone apps', [
  'Map app: a tappable map of Hoshimori Bay with a "you are here" marker and keyboard navigation between places',
  'Map app lists each area\'s shops with open/closed status and opening hours (game.shopOpen / shopHours)',
  'Calendar app: season month view with today highlighted, previous/next season and a Today button',
  'Calendar marks festivals, friends\' birthdays and booked job shifts, and lists the selected day\'s events',
  'Messages app reads game.mail: unread dots, badge count on the phone strip, mark all read and delete',
  'Stats app with three tabs: energy and mood bars with friend summary, skill levels, and every lifetime counter',
]);
