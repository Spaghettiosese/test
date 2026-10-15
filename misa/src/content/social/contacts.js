// Contacts phone app: everyone Misa has met (plus family), with hearts, learned birthdays, schedule hints,
// where they probably are right now, known favourite gifts, heart-event progress, the last text,
// and actions: send a text (once a day) and invite to a hangout (3+ hearts).
import { register, get, features } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { sprite } from '../../artcache.js';
import { drawText, drawTextC, wrap } from '../../font.js';
import { UI, rect, inside } from '../../ui/ui.js';
import { SOCIAL_NPCS, met, placeName, whereNow, clock12, sc, isSchoolDay } from './util.js';
import { npcMood, MOOD_TEXT, smallTalk } from './talk.js';
import { PLACES, SLOTS, invite, planFor, placesFor, HANGOUT_HEARTS } from './hangouts.js';

defineSprite('soc_contacts', 11, 12, (R0) => {
  const R = R0.at(1, 1);
  R(0, 0, 9, 10, '#f3e2c7'); R(0, 0, 2, 10, '#e0707a'); R.e(5, 3, 2, 2, '#a67548'); R(3, 6, 5, 3, '#7fb2e0'); R(4, 6, 3, 1, '#fff6e6');
}, false, true);

const FAMILY = ['mum', 'dad', 'nori'];
function people(game) {
  const fam = FAMILY.filter((id) => get('npc', id));
  const friends = SOCIAL_NPCS.filter((id) => { const d = get('npc', id); return d && !d.hidden && met(game, id); });
  return [...fam, ...friends];
}
const canText = (game, id) => FAMILY.includes(id) || game.hearts(id) >= 2;
const itemName = (id) => (get('item', id) ? get('item', id).name : id.replace(/^[a-z]+_/, '').replace(/_/g, ' '));

function slotsFrom(game) {
  const out = [];
  for (const dd of [0, 1]) for (const m of SLOTS) if (dd === 1 || m >= game.minutes + 60) out.push({ day: game.day + dd, at: m });
  return out.slice(0, 7);
}

function textSteps(game, id) {
  const d = get('npc', id), f = game.friend(id), r = game.rngFor('textreply:' + id);
  const replies = (d.lines && d.lines.textReply) || ['happy|Hi Misa! Thanks for the message. Talk soon!'];
  const opener = ['>happy|(Text) Hey! How\'s your day going?', '>happy|(Text) Thinking of you. Anything fun today?', '>happy|(Text) Guess what Mochi did this morning.'][Math.floor(r() * 3)];
  return sc(id, opener, '@...', replies[Math.floor(r() * replies.length)], { t: 'call', fn: (g) => {
    f.textDay = g.day; g.stat('textsSent');
    if (FAMILY.includes(id)) g.addFriend(id, 10); else smallTalk(g, id, 6);
  } });
}

function eventInfo(d, game) {
  const evs = d.events || [], seen = game.friend(d.id).events || [];
  return evs.map((e) => ({ h: e.hearts, done: seen.includes(e.id) }));
}

register('phoneApp', 'contacts', {
  name: 'Contacts', icon: 'soc_contacts', order: 31,
  badge: (game) => game.state.social.plans.filter((p) => !p.done && p.day === game.day).length || 0,
  open(game, app) { const st = app.state; st.sel ??= 0; st.top ??= 0; st.mode = 'list'; st.msg = null; st.capture = false; },
  update(dt, input, game, app) {
    const st = app.state, list = people(game), k = input.pressed, { x, y } = app.area;
    const id = list[st.sel], d = id && get('npc', id);
    const up = k.has('arrowup') || k.has('w'), down = k.has('arrowdown') || k.has('s'), ok = k.has('enter') || k.has(' ') || k.has('e');
    const back = k.has('backspace') || k.has('escape') || k.has('x');
    if (st.mode === 'place' || st.mode === 'time') {
      const opts = st.mode === 'place' ? placesFor(d) : slotsFrom(game);
      if (down) st.opt = (st.opt + 1) % opts.length;
      if (up) st.opt = (st.opt + opts.length - 1) % opts.length;
      let pick = ok;
      if (input.justDown) { const i = Math.floor((input.my - y - 30) / 11); if (input.mx > x + 116 && i >= 0 && i < opts.length) { st.opt = i; pick = true; } }
      if (back) { st.mode = 'list'; st.capture = false; return; }
      if (pick) {
        if (st.mode === 'place') { st.place = opts[st.opt]; st.mode = 'time'; st.opt = 0; return; }
        const s = opts[st.opt], res = invite(game, id, st.place, s.day, s.at);
        st.mode = 'list'; st.capture = false;
        game.run(sc(id, '>happy|(Text) Want to hang out?', res.line));
      }
      return;
    }
    if (!list.length) return;
    if (down) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (up) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown && input.mx < x + 108) { const i = Math.floor((input.my - y) / 11) + st.top; if (i >= 0 && i < list.length) st.sel = i; }
    if (st.sel < st.top) st.top = st.sel;
    if (st.sel >= st.top + 15) st.top = st.sel - 14;
    const f = game.friend(id);
    const canInv = d && !d.hidden && game.hearts(id) >= HANGOUT_HEARTS;
    const clickInv = input.justDown && inside(input.mx, input.my, x + 114, y + 158, 84, 12), clickTxt = input.justDown && inside(input.mx, input.my, x + 204, y + 158, 84, 12);
    if ((k.has('i') || clickInv) && canInv) { st.mode = 'place'; st.opt = 0; st.capture = true; return; }
    if ((k.has('t') || clickTxt) && canText(game, id)) {
      if (f.textDay === game.day) { game.toast(`You already texted ${d.name} today`); return; }
      game.run(textSteps(game, id));
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = people(game);
    if (!list.length) { drawText(g, 'Meet people around town to fill your contacts!', x + 4, y + 10, UI.dim, 1, null); return; }
    for (let r = 0; r < 15; r++) {
      const i = st.top + r, id = list[i];
      if (!id) break;
      const d = get('npc', id), yy = y + r * 11;
      if (i === st.sel) rect(g, UI.gold, x, yy, 108, 10);
      rect(g, d.color || UI.accent, x + 2, yy + 2, 4, 6);
      drawText(g, d.name.length > 16 ? d.name.slice(0, 16) : d.name, x + 9, yy + 3, UI.ink, 1, null);
      if (!d.hidden) drawText(g, String(game.hearts(id)), x + 100, yy + 3, UI.accent2, 1, null);
      if (game.state.social.plans.some((p) => p.npc === id && !p.done)) g.drawImage(sprite('i_cal'), x + 88, yy);
    }
    const id = list[st.sel], d = get('npc', id);
    if (!d) return;
    const px = x + 114, f = game.friend(id);
    rect(g, UI.paper2, px - 2, y, 180, 172);
    rect(g, d.color || UI.accent, px, y + 2, 176, 10);
    drawText(g, d.name, px + 3, y + 4, UI.text, 1, null);
    drawText(g, (d.role || '').slice(0, 44), px, y + 15, UI.dim, 1, null);
    if (st.mode === 'place' || st.mode === 'time') {
      drawText(g, st.mode === 'place' ? `Where should you meet ${d.name.split(' ')[0]}?` : `When? (${PLACES[st.place].name})`, px, y + 22, UI.accent2, 1, null);
      const opts = st.mode === 'place' ? placesFor(d).map((p) => PLACES[p].name) : slotsFrom(game).map((s) => `${s.day === game.day ? 'Today' : 'Tomorrow'} ${clock12(s.at)}`);
      opts.forEach((t, i) => { if (i === st.opt) rect(g, UI.gold, px, y + 30 + i * 11, 176, 10); drawText(g, t, px + 4, y + 32 + i * 11, UI.ink, 1, null); });
      drawText(g, 'ENTER: CHOOSE   X: BACK', px, y + 162, UI.dim, 1, null);
      return;
    }
    let yy = y + 24;
    const line = (t, c = UI.ink) => { drawText(g, t, px, yy, c, 1, null); yy += 8; };
    if (!d.hidden) {
      const h = game.hearts(id);
      for (let k = 0; k < 10; k++) { g.globalAlpha = k < h ? 1 : 0.2; g.drawImage(sprite('heart'), px + k * 9, yy - 1); }
      g.globalAlpha = 1; yy += 10;
    }
    if (d.birthday && (d.hidden || game.hearts(id) >= 1)) line(`Birthday: ${d.birthday.season} ${d.birthday.day}`);
    else if (d.birthday) line('Birthday: ??? (get to know them)', UI.dim);
    if (d.hint) wrap('Usually: ' + d.hint, 43).slice(0, 4).forEach((l) => line(l, UI.ink2));
    if (!d.hidden) {
      const now = whereNow(game, id);
      line(now ? `Right now: probably ${placeName(now.map)}` : 'Right now: home or out of town', UI.accent2);
      if (f.talkedDay === game.day) line(`Today they seem ${MOOD_TEXT[npcMood(game, id)]}.`, UI.dim);
      const known = (f.knownGifts || []).map(itemName);
      const love = (d.gifts && d.gifts.love) || [];
      if (game.hearts(id) >= 4 && love[0] && !(f.knownGifts || []).includes(love[0])) known.push(itemName(love[0]) + '?');
      wrap('Likes: ' + (known.length ? known.join(', ') : '??? (give gifts to learn)'), 43).slice(0, 2).forEach((l) => line(l));
      const ev = eventInfo(d, game);
      if (ev.length) line('Heart events: ' + ev.map((e) => (e.done ? '*' : e.h)).join(' '), UI.ink2);
      const p = planFor(game, id);
      if (p) line(`Plan: ${PLACES[p.place].name}, ${p.day === game.day ? 'today' : 'tomorrow'} ${clock12(p.at)}`, UI.good);
    }
    const last = game.state.social.lastText[id];
    if (last) wrap('Last text: ' + last, 43).slice(0, 3).forEach((l) => line(l, UI.dim));
    const canInv = !d.hidden && game.hearts(id) >= HANGOUT_HEARTS;
    rect(g, canInv ? UI.mint : '#c8b8b0', px, y + 158, 84, 12); drawTextC(g, canInv ? 'I: INVITE' : `INVITE AT ${HANGOUT_HEARTS} HEARTS`, px + 42, y + 161, UI.ink, 1, null);
    const tx = canText(game, id), sent = f.textDay === game.day;
    rect(g, tx && !sent ? UI.mint : '#c8b8b0', px + 90, y + 158, 84, 12); drawTextC(g, !tx ? 'NO NUMBER YET' : sent ? 'TEXTED TODAY' : 'T: SEND TEXT', px + 132, y + 161, UI.ink, 1, null);
  },
});

features('Phone', [
  'Contacts app: everyone you have met plus family, with hearts and each person\'s colour',
  'Contacts: schedule hints and where a friend probably is right now',
  'Contacts: birthdays are learned once you get to know someone',
  'Contacts: known favourite gifts, and a hint at their most loved gift from 4 hearts',
  'Contacts: heart-event checklist showing which scenes you have seen',
  'Contacts: send a friend or family member a text once a day and read their reply',
  'Contacts: the last message each person sent you',
  'Contacts: a calendar mark shows who you have plans with, and the app badge counts today\'s hangouts',
  'Contacts: invite right from the app by picking a place, then a time today or tomorrow',
]);
