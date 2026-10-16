// Phone apps: Bonds (perks, friendship web, group outings, gift day) and Heart Archive (every scene seen, choices made,
// polaroid-style entries with a portrait, replay any scene). Also adds a Bond line to the Contacts app.
import { register, get, all, features } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { UI, rect, inside, drawText, drawTextC, wrap } from '../../ui/ui.js';
import { drawPortrait } from '../../ui/portraits.js';
import { dateText } from '../../core/time.js';
import { SOCIAL_NPCS, met } from '../social/util.js';
import { S, nameOf, CAST, PERKS, perkOf, bestFriends } from './core.js';
import { REL, GROUPS, groupOf, canGroup, missingFor, planGroup, plans, relOf } from './groups.js';
import { DRAMAS, webStars } from './web.js';
import { GIFT_DAYS, giftDay } from './gifts.js';

defineSprite('sv3_bonds', 11, 12, (R0) => {
  const R = R0.at(1, 1);
  R(1, 1, 3, 2, '#e0707a'); R(5, 1, 3, 2, '#e0707a'); R(0, 2, 9, 3, '#e0707a'); R(1, 5, 7, 2, '#e0707a'); R(3, 7, 3, 2, '#e0707a'); R(4, 9, 1, 1, '#e0707a'); R(2, 2, 2, 1, '#f9c0c4');
}, false, true);
defineSprite('sv3_archive', 11, 12, (R0) => {
  const R = R0.at(1, 1);
  R(0, 1, 9, 9, '#fff6e6'); R(1, 2, 7, 5, '#7fb2e0'); R(2, 5, 5, 2, '#9ac8a0'); R.e(5, 3, 1, 1, '#ffd76a'); R(1, 8, 5, 1, '#8a6a5a');
}, false, true);

const TITLES = {
  sv3_kai_h5: 'Puddle Practice', sv3_kai_h10: 'Best Friend: Captain Misa', sv3_suzu_h5: 'The Detective Agency', sv3_suzu_h10: 'The Secret Shelf', sv3_rina_h5: 'The Duet',
  sv3_rina_h10: 'The Ranking Board', sv3_theo_h5: 'Leaf Songs', sv3_theo_h10: 'The Town at Dusk', sv3_hina_h5: 'Snail Parade', sv3_hina_h10: 'The Hidden Lab',
  sv3_fujita_h5: 'The Comet Logbook', sv3_fujita_h10: 'Akane', sv3_ogawa_h5: 'Yaki-imo Afternoon', sv3_ogawa_h10: 'A Walk Round the Track',
  sv3_hana_h5: 'Snow Lanterns', sv3_hana_h10: 'Where You Are Kept', sv3_tobias_h5: 'Blackout Repair', sv3_tobias_h10: 'The Brass Key',
  sv3_mika_h5: 'Strawberry Test Batch', sv3_mika_h10: 'The First Cup', sv3_sachiko_h5: 'Summer Sale Day', sv3_sachiko_h10: 'The Back Room',
  sv3_jun_h5: 'Squid Run', sv3_jun_h10: 'Dawn on the Sayori', sv3_kiko_h5: 'The Pudding Offering', sv3_kiko_h10: 'The Keeper\'s Bond',
  sv3_pip_h5: 'The Windy Route', sv3_pip_h10: 'First Class Ceremony', sv3_goro_h5: 'Seedling Day', sv3_goro_h10: 'The Rose Corner',
};
export const entryTitle = (npc, e) => TITLES[e.id] || `${(get('npc', npc) || {}).name || npc}: ${e.hearts}-heart scene`;
const REMOVE = new Set(['friend', 'give', 'take', 'money', 'xp', 'energy', 'call', 'flag', 'set', 'quest', 'time', 'warp', 'soc_arrive', 'soc_leave', 'soc_face', 'soc_step', 'minigame', 'shop']);
export function sanitize(steps) {
  const out = [];
  for (const s of steps || []) {
    if (!s || REMOVE.has(s.t)) continue;
    if (s.t === 'choice') out.push({ ...s, options: s.options.map((o) => ({ ...o, steps: sanitize(o.steps) })) });
    else if (s.t === 'if') out.push({ ...s, then: sanitize(s.then), else: sanitize(s.else) });
    else out.push(s);
  }
  return out;
}
// every scene Misa has seen: { kind, id, npc, title, day, hearts, picks, replay(game) }
export function entries(g) {
  const out = [], s = S(g);
  for (const d of all('npc')) {
    if (d.hidden && !['mum', 'dad', 'nori'].includes(d.id)) continue;
    const seen = (g.state.friends[d.id] || {}).events || [];
    for (const e of d.events || []) if (seen.includes(e.id)) out.push({ kind: 'heart', id: e.id, npc: d.id, title: entryTitle(d.id, e), day: s.seen[e.id] || 0, hearts: e.hearts, picks: s.picks[e.id] || [], replay: () => sanitize(e.script(g)) });
  }
  for (const gr of GROUPS) if (s.group.done[gr.id]) out.push({ kind: 'group', id: gr.id, npc: gr.cast[0], title: gr.name, day: 0, hearts: gr.hearts, picks: s.picks['sv3g_' + gr.id] || [], replay: () => sanitize(gr.script(g)) });
  for (const d of DRAMAS) if (s.drama.done[d.id]) out.push({ kind: 'drama', id: d.id, npc: d.a, title: d.title, day: s.seen['sv3d_' + d.id] || 0, hearts: 3, picks: s.picks['sv3d_' + d.id] || [], replay: () => sanitize(get('script', 'sv3_drama_' + d.id).steps(g)) });
  for (const k of Object.keys(s.group.done)) if (k.startsWith('bday_')) { const id = k.slice(5).replace(/_y\d+$/, ''); if (get('npc', id)) out.push({ kind: 'party', id: k, npc: id, title: `${nameOf(id)}'s birthday party`, day: s.group.done[k], hearts: 4, picks: s.picks['sv3g_party_' + id] || [], replay: () => sanitize(get('script', 'sv3_party_' + id).steps(g)) }); }
  return out.sort((a, b) => (a.day || 1e9) - (b.day || 1e9) || a.hearts - b.hearts);
}
const flagPicks = (g, id) => Object.keys(g.state.flags).filter((k) => k.startsWith('soc_' + id + '_') || k.startsWith('soc3_' + id + '_')).map((k) => k.replace(/^soc3?_/, '').replace(/_/g, ' '));

// ---------------------------------------------------------------- Heart Archive
register('phoneApp', 'sv3_archive', {
  name: 'Heart Archive', icon: 'sv3_archive', order: 38,
  open(game, app) { app.state.sel = 0; app.state.top = 0; app.state.t = 0; },
  update(dt, input, game, app) {
    const st = app.state, list = entries(game), k = input.pressed;
    st.t += dt;
    if (!list.length) return;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown && input.mx < app.area.x + 130) { const i = Math.floor((input.my - app.area.y - 14) / 11) + st.top; if (i >= 0 && i < list.length) st.sel = i; }
    if (st.sel < st.top) st.top = st.sel;
    if (st.sel >= st.top + 13) st.top = st.sel - 12;
    if (k.has('enter') || k.has(' ') || k.has('e') || k.has('r')) {
      const e = list[st.sel];
      if (e) { try { game.run(e.replay()); } catch (err) { game.toast('That scene cannot be replayed right now'); } }
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = entries(game);
    rect(g, UI.accent, x, y, 292, 12); drawText(g, `HEART ARCHIVE: ${list.length} SCENES`, x + 4, y + 3, UI.text, 1, null);
    if (!list.length) { drawText(g, 'Heart events, outings and town dramas you', x + 6, y + 24, UI.dim, 1, null); drawText(g, 'finish are saved here as polaroids.', x + 6, y + 34, UI.dim, 1, null); return; }
    for (let r = 0; r < 13; r++) {
      const i = st.top + r, e = list[i];
      if (!e) break;
      const yy = y + 14 + r * 11;
      if (i === st.sel) rect(g, UI.gold, x, yy, 130, 10);
      rect(g, (get('npc', e.npc) || {}).color || UI.accent, x + 2, yy + 2, 3, 6);
      drawText(g, e.title.slice(0, 24).toUpperCase(), x + 8, yy + 3, UI.ink, 1, null);
    }
    const e = list[Math.min(st.sel, list.length - 1)], px = x + 136, py = y + 16;
    rect(g, '#00000030', px + 3, py + 3, 150, 150);
    rect(g, '#fffaf0', px, py, 150, 150);
    rect(g, '#e8d9b8', px + 8, py + 8, 134, 80);
    const col = (get('npc', e.npc) || {}).color || '#9ac8e0';
    rect(g, col + '55', px + 10, py + 10, 130, 76);
    const mood = ['happy', 'happy', 'surprised', 'neutral'][Math.floor(st.t / 2) % 4];
    drawPortrait(g, e.npc, mood, Math.floor(st.t * 3) % 2, 0, px + 43, py + 14);
    if (e.kind === 'group' || e.kind === 'party') { const second = e.kind === 'group' ? groupOf(e.id).cast[1] : null; if (second) drawPortrait(g, second, 'happy', 0, 0, px + 12, py + 28); }
    rect(g, '#e0707a99', px + 55, py - 3, 40, 8);
    drawText(g, e.title.slice(0, 28).toUpperCase(), px + 8, py + 94, UI.ink, 1, null);
    drawText(g, e.day ? dateText(e.day).toUpperCase() : e.kind.toUpperCase(), px + 8, py + 104, UI.dim, 1, null);
    const picks = e.picks.length ? e.picks : e.kind === 'heart' ? flagPicks(game, e.npc).slice(0, 2) : [];
    let yy = py + 114;
    if (picks.length) { drawText(g, 'YOU CHOSE:', px + 8, yy, UI.accent2, 1, null); yy += 9; for (const p of picks.slice(0, 2)) for (const l of wrap(p, 32).slice(0, 1)) { drawText(g, l.toUpperCase(), px + 8, yy, UI.ink, 1, null); yy += 9; } }
    else drawText(g, e.kind === 'heart' ? 'A QUIET MEMORY.' : 'A GOOD DAY.', px + 8, yy, UI.dim, 1, null);
    rect(g, UI.mint, px, py + 156, 150, 10); drawTextC(g, 'ENTER: REPLAY THIS SCENE', px + 75, py + 158, UI.ink, 1, null);
  },
});

// ---------------------------------------------------------------- Bonds
const TABS = ['PERKS', 'WEB', 'OUTINGS', 'GIFTS'];
register('phoneApp', 'sv3_bonds', {
  name: 'Bonds', icon: 'sv3_bonds', order: 36,
  open(game, app) { Object.assign(app.state, { tab: 0, sel: 0, top: 0, msg: '' }); },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('c') || k.has('tab') || (input.justDown && inside(input.mx, input.my, x, y, 292, 12))) { st.tab = (st.tab + 1) % TABS.length; st.sel = 0; st.top = 0; st.msg = ''; game.sfx('blip'); return; }
    const n = [CAST.length, REL.length, GROUPS.length, 0][st.tab];
    if (n) {
      if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(n - 1, st.sel + 1);
      if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
      if (input.justDown && input.mx < x + 120) { const i = Math.floor((input.my - y - 14) / 10) + st.top; if (i >= 0 && i < n) st.sel = i; }
      if (st.sel < st.top) st.top = st.sel;
      if (st.sel >= st.top + 14) st.top = st.sel - 13;
    }
    if (st.tab === 2 && (k.has('enter') || k.has(' ') || k.has('e'))) { const r = planGroup(game, GROUPS[st.sel].id); st.msg = r.line; game.sfx(r.ok ? 'chime' : 'wrong'); }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = S(game);
    rect(g, UI.accent, x, y, 292, 12);
    TABS.forEach((t, i) => drawText(g, t, x + 6 + i * 52, y + 3, i === st.tab ? UI.text : UI.dim, 1, null));
    drawText(g, 'C: NEXT', x + 250, y + 3, UI.dim, 1, null);
    const row = (i, label, extra, col) => { const yy = y + 14 + (i - st.top) * 10; if (yy > y + 150) return; if (i === st.sel) rect(g, UI.gold, x, yy, 122, 10); drawText(g, label, x + 3, yy + 2, col || UI.ink, 1, null); if (extra) drawText(g, extra, x + 100, yy + 2, UI.accent2, 1, null); };
    const px = x + 128, side = (lines, yy = y + 16) => lines.forEach((l, i) => drawText(g, l[0].toUpperCase(), px, yy + i * 9, l[1] || UI.ink, 1, null));
    rect(g, UI.paper2, px - 3, y + 13, 168, 158);
    if (st.tab === 0) {
      CAST.slice(st.top, st.top + 14).forEach((id, r) => { const p = perkOf(game, id); row(st.top + r, nameOf(id).split(' ')[0].slice(0, 9).toUpperCase(), p ? 'BOND' : String(game.hearts(id)), p ? UI.good : UI.ink); });
      const id = CAST[st.sel], p = perkOf(game, id), h = game.hearts(id);
      const lines = [[nameOf(id), UI.accent2], [`HEARTS: ${h}/10`, UI.ink2], ['', UI.ink]];
      if (p) { lines.push([`BOND: ${p.name}`, UI.good], ['', UI.ink]); wrap(p.text, 38).slice(0, 7).forEach((l) => lines.push([l, UI.ink])); }
      else if (h >= 10) lines.push(['BEST FRIEND SCENE WAITING', UI.good], ['Visit them to see it.', UI.dim]);
      else lines.push(['At 10 hearts, a Best Friend', UI.dim], ['scene gives a lasting perk.', UI.dim], [`Two choices: ${PERKS[id].A.name} or ${PERKS[id].B.name}.`.slice(0, 40), UI.dim]);
      side(lines);
      drawText(g, `BEST FRIENDS: ${bestFriends(game).length}/15   CIRCLE AT 5`, px, y + 160, s.circle ? UI.good : UI.dim, 1, null);
    } else if (st.tab === 1) {
      REL.slice(st.top, st.top + 14).forEach((r, i) => { const k = st.top + i, stars = webStars(game, `${r[0]}-${r[1]}`); row(k, `${r[0]}+${r[1]}`.slice(0, 15).toUpperCase(), '*'.repeat(stars) || '-'); });
      const r = REL[st.sel], known = webStars(game, `${r[0]}-${r[1]}`) + webStars(game, `${r[1]}-${r[0]}`) >= 2 || game.hearts(r[0]) >= 6 && game.hearts(r[1]) >= 6;
      const lines = [[`${nameOf(r[0]).split(' ')[0]} + ${nameOf(r[1]).split(' ')[0]}`, UI.accent2], [r[2], UI.ink2], ['', UI.ink]];
      if (known) wrap(r[3], 38).slice(0, 8).forEach((l) => lines.push([l, UI.ink])); else lines.push(['Overhear their chats around', UI.dim], ['town, or get close to both,', UI.dim], ['to learn their story.', UI.dim]);
      side(lines);
    } else if (st.tab === 2) {
      GROUPS.forEach((gr, i) => row(i, gr.name.slice(0, 17).toUpperCase(), canGroup(game, gr) ? 'OK' : '', canGroup(game, gr) ? UI.ink : UI.dim));
      const gr = GROUPS[st.sel], done = s.group.done[gr.id];
      const lines = [[gr.name, UI.accent2], [`NEEDS ${gr.hearts} HEARTS EACH`, UI.ink2], ['', UI.ink]];
      wrap(gr.blurb, 38).slice(0, 2).forEach((l) => lines.push([l, UI.ink]));
      lines.push(['', UI.ink]);
      for (const id of gr.cast) lines.push([`${nameOf(id)}: ${game.hearts(id)}`, game.hearts(id) >= gr.hearts ? UI.good : UI.dim]);
      if (done) lines.push([`DONE ${done} TIME${done > 1 ? 'S' : ''}`, UI.good]);
      const p = plans(game).find((q) => !q.done && q.day >= game.day);
      if (p) lines.push([`PLANNED: ${groupOf(p.id).name}`.slice(0, 40), UI.good]);
      side(lines);
      if (st.msg) wrap(st.msg, 38).slice(0, 2).forEach((l, i) => drawText(g, l.toUpperCase(), px, y + 140 + i * 9, UI.accent2, 1, null));
      rect(g, UI.mint, px, y + 160, 160, 10); drawTextC(g, 'ENTER: PLAN THIS OUTING', px + 80, y + 162, UI.ink, 1, null);
    } else {
      const gd = giftDay(game);
      side([[`TODAY: ${gd[0]}`, UI.accent2], ['Give a matching gift for', UI.ink], ['bonus friendship.', UI.ink], ['', UI.ink]]);
      GIFT_DAYS.forEach((d, i) => drawText(g, `${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i]}: ${d[0]}`.toUpperCase(), x + 4, y + 18 + i * 10, game.weekday === i ? UI.good : UI.ink, 1, null));
      drawText(g, `HANDMADE GIFTS GIVEN: ${s.gift.handmade || 0}`, x + 4, y + 96, UI.ink2, 1, null);
      drawText(g, 'Craft handmade gifts at the workbench:', x + 4, y + 108, UI.dim, 1, null);
      drawText(g, 'cards, bouquets, scarves, cookies...', x + 4, y + 118, UI.dim, 1, null);
      drawText(g, s.circle ? `CIRCLE: ${s.circleName || 'FOUNDED'}`.toUpperCase() : 'FRIEND CIRCLE: NEEDS 5 BEST FRIENDS', x + 4, y + 134, s.circle ? UI.good : UI.dim, 1, null);
      drawText(g, `FUTURE LETTERS: ${Object.keys(s.letters).length}/15`, x + 4, y + 146, UI.ink2, 1, null);
    }
  },
});

// ---------------------------------------------------------------- Contacts: show each friend's bond
(function wrapContacts() {
  const c = get('phoneApp', 'contacts');
  if (!c || c.__sv3) return;
  const draw = c.draw;
  c.draw = function (g, game, app) {
    draw.call(this, g, game, app);
    try {
      const list = ['mum', 'dad', 'nori'].filter((id) => get('npc', id)).concat(SOCIAL_NPCS.filter((id) => { const d = get('npc', id); return d && !d.hidden && met(game, id); }));
      const id = list[app.state.sel];
      if (!id || !CAST.includes(id)) return;
      const p = perkOf(game, id), px = app.area.x + 114;
      if (p) drawText(g, `BOND: ${p.name}`.toUpperCase(), px, app.area.y + 148, UI.good, 1, null);
      else if (game.hearts(id) >= 10) drawText(g, 'BEST FRIEND SCENE WAITING', px, app.area.y + 148, UI.good, 1, null);
    } catch (e) { /* cosmetic only */ }
  };
  c.__sv3 = true;
})();

register('system', 'sv3Archive', {
  init(game) {
    game.bus.on('heartEvent', ({ id }) => { S(game).seen[id] = game.day; });
    game.sv3 = Object.assign(game.sv3 || {}, { entries: () => entries(game), perks: () => CAST.map((id) => perkOf(game, id)).filter(Boolean) });
  },
});

features('Relationships Deep', [
  'Bonds phone app: the Perks tab lists all 15 cast members with hearts and the Best Friend perk you chose',
  'Bonds phone app: the Web tab reveals each friendship between townspeople (rivalries, mentors, old friends) as you learn their stories',
  'Bonds phone app: the Outings tab shows who is close enough for each group hangout and plans it with one key',
  'Bonds phone app: the Gifts tab shows today\'s Gift Day, handmade gifts given, the Friend Circle and the letters from the future',
  'Heart Archive phone app: polaroid-style entries with a portrait for every heart event, outing, drama and party you have seen',
  'Heart Archive: each polaroid recalls the choices you made, and Enter replays the scene without changing anything',
  'Contacts app shows each Best Friend\'s bond and tells you when their Best Friend scene is waiting',
]);
