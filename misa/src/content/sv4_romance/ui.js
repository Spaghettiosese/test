// Phone app "Romance": PROFILE (portrait, stage, crush hearts, likes revealed as you grow close, compliment / plan a date /
// confess / step back), CHAT (timed messages, pick one of three replies), DATES (weekly limit, journal) and ARCHIVE (every
// romance scene you have seen, replayable). Also adds a "Heart & Crush" strip to the Contacts app.
import { register, get, features } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { sprite } from '../../artcache.js';
import { UI, rect, inside, drawText, drawTextC, wrap, icon } from '../../ui/ui.js';
import { drawPortrait } from '../../ui/portraits.js';
import { dateText } from '../../core/time.js';
import { sanitize } from '../sv3_hearts/ui.js';
import { sc, SOCIAL_NPCS, met, clock12 } from '../social/util.js';
import { S, STAGES, stageName, stageOf, crush, aff, firstName, nameOf, visibleCands, datesThisWeek, MAX_WEEK_DATES, sinceDays } from './core.js';
import { voiceOf } from './voices.js';
import { KINDS, KIND_IDS, slotsFor, planDate, canDate, needNote, activePlan } from './dates.js';
import { canConfess, confessSteps, complimentSteps, canCompliment, stepBackSteps, theyReady } from './confess.js';
import { chatCands, chatOf, pending, reply, threadsOf, unreadCount } from './texts.js';
import { readyEvents, EVENTS } from './couple.js';
import { replaySteps } from './story.js';

defineSprite('sv4_romance', 11, 12, (R0) => {
  const R = R0.at(1, 1);
  R(1, 1, 3, 2, '#f08aa8'); R(5, 1, 3, 2, '#f08aa8'); R(0, 2, 9, 3, '#f08aa8'); R(1, 5, 7, 2, '#f08aa8'); R(2, 7, 5, 1, '#f08aa8'); R(3, 8, 3, 1, '#f08aa8'); R(4, 9, 1, 1, '#f08aa8'); R(2, 2, 2, 1, '#fde0e8'); R(6, 3, 2, 2, '#c8506e');
}, false, true);

const TABS = ['PROFILE', 'CHAT', 'DATES', 'ARCHIVE'];
const itemName = (id) => (get('item', id) ? get('item', id).name : id.replace(/^[a-z]+_/, '').replace(/_/g, ' '));
const TAG = { active: 'sports', food: 'food', games: 'games', quiet: 'quiet time', cozy: 'cozy places', nature: 'nature', art: 'art', study: 'studying', luck: 'luck games', sea: 'the sea', music: 'music', books: 'books', sweet: 'sweets', bold: 'big gestures', calm: 'calm', funny: 'jokes', bugs: 'bugs' };
export const archiveEntries = (g) => Object.entries(S(g).seen).filter(([, e]) => e.npc).map(([key, e]) => ({ key, ...e })).sort((a, b) => a.day - b.day);
const hint = (g, id) => {
  const st = stageOf(g, id), s = S(g);
  if (s.partner === id) { const r = readyEvents(g, id); return r.length ? `Talk to ${firstName(id)}: ${EVENTS[r[0]].title}` : 'Keep dating, texting and sharing days'; }
  if (st === -1) return 'Just friends. Grow closer again to reopen it';
  if (s.partner) return 'You are with someone else';
  if (st === 0) return 'Gifts, chats and time raise affection';
  if (st === 1) return 'Go on a date or send a compliment';
  if (st === 2) return 'Confess (K) once you are ready';
  return theyReady(g, id) ? 'They have something to say tonight' : 'They may confess soon. Or you can';
};

register('phoneApp', 'sv4_romance', {
  name: 'Romance', icon: 'sv4_romance', order: 37,
  badge: (g) => unreadCount(g) + (activePlan(g) && activePlan(g).day === g.day ? 1 : 0),
  open(game, app) { Object.assign(app.state, { tab: 0, sel: 0, top: 0, mode: 'main', opt: 0, capture: false, csel: 0, msg: '' }); },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area, ok = k.has('enter') || k.has(' ') || k.has('e'), back = k.has('backspace') || k.has('escape') || k.has('x');
    const up = k.has('arrowup') || k.has('w'), down = k.has('arrowdown') || k.has('s');
    st.t = (st.t || 0) + dt;
    if (st.mode !== 'main') return modal(game, app, input, ok, back, up, down);
    if (k.has('c') || (input.justDown && inside(input.mx, input.my, x, y, 292, 12))) { st.tab = (st.tab + 1) % TABS.length; st.sel = 0; st.top = 0; game.sfx('blip'); return; }
    const ids = st.tab === 0 ? visibleCands(game) : st.tab === 1 ? chatCands(game) : st.tab === 3 ? archiveEntries(game) : [];
    const n = ids.length;
    if (st.tab === 2) return;
    if (!n) return;
    st.sel = Math.min(st.sel, n - 1);
    const id = st.tab === 3 ? null : ids[st.sel];
    const th = st.tab === 1 ? pending(game, id) : null;
    if (st.tab === 1 && th) {
      if (up) st.csel = (st.csel + 2) % 3; if (down) st.csel = (st.csel + 1) % 3;
      if (k.has('arrowleft') || k.has('a')) { st.sel = Math.max(0, st.sel - 1); st.csel = 0; } if (k.has('arrowright') || k.has('d')) { st.sel = Math.min(n - 1, st.sel + 1); st.csel = 0; }
      let pick = ok;
      if (input.justDown) { const i = Math.floor((input.my - (y + 112)) / 18); if (input.mx > x + 90 && i >= 0 && i < 3) { st.csel = i; pick = true; } }
      if (pick) { reply(game, id, st.csel); game.sfx('blip'); st.csel = 0; }
    } else {
      if (down) st.sel = Math.min(n - 1, st.sel + 1);
      if (up) st.sel = Math.max(0, st.sel - 1);
    }
    if (input.justDown && input.mx < x + 88) { const i = Math.floor((input.my - y - 14) / 11) + st.top; if (i >= 0 && i < n) st.sel = i; }
    if (st.sel < st.top) st.top = st.sel;
    if (st.sel >= st.top + 13) st.top = st.sel - 12;
    if (st.tab === 3 && ok) { const e = ids[st.sel], steps = e && replaySteps(game, e.key); if (steps) { try { game.run(sanitize(steps)); } catch (err) { game.toast('That scene cannot be replayed right now'); } } }
    if (st.tab === 0 && id) {
      const f = k.has('f'), d = k.has('d'), kk = k.has('k'), b = k.has('b');
      const btn = (i) => input.justDown && inside(input.mx, input.my, x + 90 + i * 51, y + 156, 49, 12);
      if (f || btn(0)) { if (!canCompliment(game, id)) game.toast(game.hearts(id) < 2 ? 'Get to know them a little first' : 'You complimented them today already'); else game.run(complimentSteps(game, id)); }
      if (d || btn(1)) { const why = canDate(game, id); if (why === 'limit') game.toast('Two dates a week is plenty. Next week!'); else if (why === 'early') game.toast('A little more crush first. Try gifts and chats'); else if (why === 'friends') game.toast('You are just friends. Try a hangout from Contacts'); else if (why) game.toast('Not right now'); else { st.mode = 'kind'; st.opt = 0; st.capture = true; st.id = id; } }
      if (kk || btn(2)) { const why = canConfess(game, id); if (why === 'early') game.toast('Not yet. Spend more time together first'); else if (why === 'friends') game.toast('You decided to stay friends for now'); else if (why === 'dating') game.toast('You are already together'); else if (why) game.toast('You are with someone else'); else { st.mode = 'confirm'; st.opt = 0; st.capture = true; st.id = id; } }
      if (b || btn(3)) { if (S(game).partner === id) { st.mode = 'step'; st.opt = 0; st.capture = true; st.id = id; } else game.toast('Only for a couple'); }
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, t = st.t || 0;
    rect(g, UI.accent, x, y, 292, 12);
    TABS.forEach((n, i) => drawText(g, n, x + 6 + i * 60, y + 3, i === st.tab ? UI.text : UI.dim, 1, null));
    drawText(g, 'C: TAB', x + 258, y + 3, UI.dim, 1, null);
    const cands = visibleCands(game);
    if (st.tab === 2) return drawDates(g, game, x, y);
    const ids = st.tab === 0 ? cands : st.tab === 1 ? chatCands(game) : archiveEntries(game);
    if (!ids.length) { drawText(g, st.tab === 3 ? 'Romance scenes you finish are kept here.' : 'Meet your classmates to fill this page.', x + 6, y + 26, UI.dim, 1, null); return; }
    const sel = Math.min(st.sel, ids.length - 1);
    for (let r = 0; r < 13; r++) {
      const i = st.top + r, it = ids[i];
      if (!it) break;
      const yy = y + 14 + r * 11, id = st.tab === 3 ? it.npc : it;
      if (i === sel) rect(g, UI.gold, x, yy, 88, 10);
      rect(g, (get('npc', id) || {}).color || UI.accent, x + 2, yy + 2, 3, 6);
      drawText(g, (st.tab === 3 ? it.title : firstName(id)).slice(0, 13).toUpperCase(), x + 8, yy + 3, UI.ink, 1, null);
      if (st.tab === 1 && chatOf(game, id).pend) g.drawImage(sprite('heart'), x + 76, yy);
    }
    const px = x + 92;
    rect(g, UI.paper2, px - 2, y + 14, 202, 158);
    if (st.mode !== 'main') return drawModal(g, game, st, px, y);
    if (st.tab === 3) return drawArchive(g, game, ids[sel], px, y, t);
    const id = ids[sel], d = get('npc', id);
    if (st.tab === 1) return drawChat(g, game, st, id, px, y);
    rect(g, d.color || UI.accent, px, y + 16, 198, 10);
    drawText(g, d.name, px + 3, y + 18, UI.text, 1, null);
    drawPortrait(g, id, ['happy', 'neutral', 'happy', 'surprised'][Math.floor(t / 2.5) % 4], Math.floor(t * 3) % 2, 0, px + 132, y + 30);
    let yy = y + 30;
    const line = (s, c = UI.ink) => { drawText(g, s, px, yy, c, 1, null); yy += 8; };
    line(stageName(game, id).toUpperCase(), UI.accent2);
    const c = crush(game, id);
    for (let k = 0; k < 10; k++) { g.globalAlpha = k < c ? 1 : 0.2; g.drawImage(sprite('heart'), px + k * 9, yy - 1); }
    g.globalAlpha = 1; yy += 11;
    const v = voiceOf(id), f = game.friend(id);
    if (c >= 2) wrap('Likes: ' + v.likes.map((tg) => TAG[tg] || tg).join(', '), 20).slice(0, 2).forEach((l) => line(l)); else line('Likes: ??? (crush 2)', UI.dim);
    const love = (d.gifts && d.gifts.love) || [];
    if (c >= 4 && love[0]) line('Loves: ' + itemName(love[0]).slice(0, 16)); else line('Loves: ??? (crush 4)', UI.dim);
    if (c >= 6) wrap('Not so much: ' + v.dislikes.map((tg) => TAG[tg] || tg).join(', '), 20).slice(0, 1).forEach((l) => line(l)); else line('Dislikes: ??? (crush 6)', UI.dim);
    const dn = S(game).datesWith[id] || 0, last = [...S(game).journal].reverse().find((j) => j.npc === id);
    line(`Dates: ${dn}${last ? '  last: ' + KINDS[last.kind].name.slice(0, 12) : ''}`);
    if (S(game).partner === id) line(`Together: ${sinceDays(game)} days`, UI.good);
    yy += 2; wrap('Next: ' + hint(game, id), 31).slice(0, 3).forEach((l) => line(l, UI.dim));
    const lbl = ['F:PRAISE', 'D:DATE', 'K:TELL', 'B:BACK'];
    const on = [canCompliment(game, id), !canDate(game, id), !canConfess(game, id), S(game).partner === id];
    lbl.forEach((s, i) => { rect(g, on[i] ? UI.mint : '#c8b8b0', px + i * 51, y + 156, 49, 12); drawTextC(g, s, px + 24 + i * 51, y + 159, UI.ink, 1, null); });
  },
});

function modal(game, app, input, ok, back, up, down) {
  const st = app.state, { x, y } = app.area, id = st.id;
  const opts = st.mode === 'kind' ? KIND_IDS : st.mode === 'slot' ? st.slots : ['Yes', 'No'];
  if (back) { st.mode = 'main'; st.capture = false; return; }
  if (up) st.opt = (st.opt + opts.length - 1) % opts.length;
  if (down) st.opt = (st.opt + 1) % opts.length;
  let pick = ok;
  if (input.justDown) { const i = Math.floor((input.my - y - 30) / 11); if (input.mx > x + 90 && i >= 0 && i < opts.length) { st.opt = i; pick = true; } }
  if (!pick) return;
  if (st.mode === 'kind') {
    const kind = opts[st.opt], sl = slotsFor(game, kind);
    if (!sl.length) { game.toast(needNote(kind) ? `That date needs: ${needNote(kind)}` : 'No free time for that today or tomorrow'); return; }
    st.kind = kind; st.slots = [...(game.minutes < 21 * 60 ? [{ day: game.day, at: game.minutes, now: true }] : []), ...sl]; st.mode = 'slot'; st.opt = 0;
  } else if (st.mode === 'slot') {
    const s = opts[st.opt], res = planDate(game, id, st.kind, s.day, s.at);
    st.mode = 'main'; st.capture = false;
    game.run(sc(id, '>happy|(Text) Would you like to go on a date? ' + KINDS[st.kind].name + '?', res.line));
  } else if (st.mode === 'confirm') {
    st.mode = 'main'; st.capture = false;
    if (st.opt === 0) game.run(confessSteps(game, id, 'misa'));
  } else if (st.mode === 'step') {
    st.mode = 'main'; st.capture = false;
    if (st.opt === 0) game.run(stepBackSteps(game));
  }
}

function drawModal(g, game, st, px, y) {
  const id = st.id;
  if (st.mode === 'kind' || st.mode === 'slot') {
    drawText(g, st.mode === 'kind' ? `What kind of date with ${firstName(id)}?` : `When? (${KINDS[st.kind].name})`, px, y + 18, UI.accent2, 1, null);
    const lines = st.mode === 'kind' ? KIND_IDS.map((k) => KINDS[k].name + (slotsFor(game, k).length ? '' : ` (${needNote(k) || 'busy'})`)) : st.slots.map((s) => s.now ? 'Right now' : `${s.day === game.day ? 'Today' : 'Tomorrow'} ${clock12(s.at)}`);
    lines.forEach((tx, i) => { if (i === st.opt) rect(g, UI.gold, px, y + 29 + i * 11, 198, 10); drawText(g, tx, px + 3, y + 31 + i * 11, UI.ink, 1, null); });
    drawText(g, 'ENTER: CHOOSE   X: BACK', px, y + 160, UI.dim, 1, null);
    return;
  }
  const q = st.mode === 'confirm' ? `Tell ${firstName(id)} how you feel?` : `Go back to being friends with ${firstName(id)}?`;
  wrap(q, 30).forEach((l, i) => drawText(g, l, px + 4, y + 22 + i * 9, UI.ink, 1, null));
  ['Yes', 'No'].forEach((tx, i) => { if (i === st.opt) rect(g, UI.gold, px, y + 52 + i * 11, 100, 10); drawText(g, tx, px + 4, y + 54 + i * 11, UI.ink, 1, null); });
  wrap(st.mode === 'confirm' ? 'Whatever happens, it will be kind. You can stay friends.' : 'It will be gentle, and you stay friends.', 32).forEach((l, i) => drawText(g, l, px + 4, y + 86 + i * 9, UI.dim, 1, null));
}
function drawChat(g, game, st, id, px, y) {
  const c = chatOf(game, id), th = pending(game, id);
  rect(g, (get('npc', id) || {}).color || UI.accent, px, y + 16, 198, 10);
  drawText(g, nameOf(id), px + 3, y + 18, UI.text, 1, null);
  const lim = th ? y + 96 : y + 168;
  let yy = lim;
  for (let i = c.log.length - 1; i >= 0 && yy > y + 30; i--) {
    const e = c.log[i], ls = wrap(e.text, 27), h = ls.length * 8 + 6;
    yy -= h + 3;
    if (yy < y + 28) break;
    const w = Math.min(160, Math.max(...ls.map((l) => l.length)) * 6 + 12), bx = e.me ? px + 196 - w : px + 2;
    rect(g, e.me ? UI.mint : '#fffaf0', bx, yy, w, h);
    ls.forEach((l, j) => drawText(g, l, bx + 5, yy + 3 + j * 8, UI.ink, 1, null));
    if (e.ico) icon(g, e.ico, e.me ? bx - 10 : bx + w + 1, yy + 1);
  }
  if (!c.log.length) drawText(g, 'No messages yet. They text now and then!', px + 4, y + 34, UI.dim, 1, null);
  if (th) {
    drawText(g, 'REPLY:   UP/DOWN + ENTER', px + 2, y + 100, UI.accent2, 1, null);
    th.r.forEach((r, i) => { if (i === st.csel) rect(g, UI.gold, px, y + 112 + i * 18, 198, 17); wrap(r[0], 31).slice(0, 2).forEach((l, j) => drawText(g, l, px + 3, y + 114 + i * 18 + j * 8, UI.ink, 1, null)); });
  }
}
function drawDates(g, game, x, y) {
  const s = S(game), px = x + 4;
  drawText(g, `THIS WEEK: ${datesThisWeek(game)}/${MAX_WEEK_DATES} DATES`, px, y + 16, UI.accent2, 1, null);
  const p = activePlan(game);
  drawText(g, p ? `Planned: ${KINDS[p.kind].name.slice(0, 20)} with ${firstName(p.npc)}, ${p.day === game.day ? 'today' : 'tomorrow'} ${clock12(p.at)}` : 'No date planned. Plan one from PROFILE (D).', px, y + 26, p ? UI.good : UI.dim, 1, null);
  drawText(g, 'DATE JOURNAL', px, y + 40, UI.ink2 || UI.ink, 1, null);
  const jr = [...s.journal].reverse().slice(0, 12);
  if (!jr.length) drawText(g, 'Your dates will be written down here.', px, y + 52, UI.dim, 1, null);
  jr.forEach((j, i) => {
    const yy = y + 52 + i * 10;
    drawText(g, `${dateText(j.day).toUpperCase().slice(0, 12)}  ${firstName(j.npc).toUpperCase()}  ${KINDS[j.kind].name.slice(0, 20).toUpperCase()}`, px, yy, UI.ink, 1, null);
    const n = j.tier === 'great' ? 3 : j.tier === 'good' ? 2 : 1;
    for (let k = 0; k < n; k++) g.drawImage(sprite('heart'), x + 262 + k * 9, yy - 1);
  });
}
function drawArchive(g, game, e, px, y, t) {
  const col = (get('npc', e.npc) || {}).color || '#9ac8e0';
  rect(g, '#fffaf0', px + 4, y + 18, 190, 134);
  rect(g, col + '55', px + 8, y + 22, 182, 70);
  drawPortrait(g, e.npc, ['happy', 'happy', 'surprised', 'neutral'][Math.floor(t / 2) % 4], Math.floor(t * 3) % 2, 0, px + 66, y + 25);
  drawText(g, e.title.slice(0, 30).toUpperCase(), px + 8, y + 97, UI.ink, 1, null);
  drawText(g, dateText(e.day).toUpperCase(), px + 8, y + 107, UI.dim, 1, null);
  let yy = y + 118;
  if (e.picks.length) { drawText(g, 'YOU CHOSE:', px + 8, yy, UI.accent2, 1, null); yy += 9; e.picks.slice(0, 2).forEach((p) => { drawText(g, p.toUpperCase().slice(0, 30), px + 8, yy, UI.ink, 1, null); yy += 9; }); }
  else drawText(g, 'A QUIET MEMORY.', px + 8, yy, UI.dim, 1, null);
  rect(g, UI.mint, px + 4, y + 156, 190, 12); drawTextC(g, 'ENTER: REPLAY THIS SCENE', px + 99, y + 159, UI.ink, 1, null);
}

// ---------- Contacts: a Heart & Crush strip ----------
const contacts = get('phoneApp', 'contacts');
if (contacts && !contacts.__sv4r) {
  const orig = contacts.draw; contacts.__sv4r = true;
  contacts.draw = function (g, game, app) {
    orig.call(this, g, game, app);
    try {
      const fam = ['mum', 'dad', 'nori'].filter((i) => get('npc', i)), friends = SOCIAL_NPCS.filter((i) => { const d = get('npc', i); return d && !d.hidden && met(game, i); });
      const id = [...fam, ...friends][app.state.sel];
      if (!id || !visibleCands(game).includes(id) || app.state.mode !== 'list') return;
      const { x, y } = app.area, px = x + 114;
      rect(g, UI.paper2, px, y + 147, 176, 10);
      drawText(g, 'HEART & CRUSH', px + 2, y + 149, UI.accent2, 1, null);
      const c = crush(game, id);
      for (let k = 0; k < 10; k++) { g.globalAlpha = k < c ? 1 : 0.2; g.drawImage(sprite('heart'), px + 80 + k * 9, y + 147); }
      g.globalAlpha = 1;
    } catch (e) { /* contacts layout changed */ }
  };
}

features('Romance', [
  'Phone app "Romance" with a profile for each classmate you could fall for: portrait, relationship stage, ten crush hearts, and likes, loves and dislikes that are revealed as the crush grows',
  'A separate affection track beside friendship hearts, raised by gifts, talking, shared growth, heart events, dates, compliments, texts and festival dances',
  'The Starry Eve secret gift and the Flower Dance partner choice both raise affection for the person involved',
  'Affection is capped by friendship, so a crush always grows out of a friendship first',
  'Heart & Crush strip in the Contacts app showing the crush level of the selected classmate',
  'Only one relationship at a time, and a fully playable single path: nothing in the game requires romance',
  'Compliments: a once-a-day flirt-lite choice with a different, in-character reply for each person',
]);
