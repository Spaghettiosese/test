// Civic life (sv5): the weekly Hoshimori Times (generated from real game events, shown on a rack by the noticeboard and as a phone app),
// the suggestion box (ideas get approved and built), volunteer days with a community points leaderboard, and the Mayor's Award at the
// year-end evaluation (hook on the svEvaluation bus event, harmless when sv_life is absent).
import { register, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { dateOf, seasonOf, yearOf } from '../../core/time.js';
import { giveStickers } from '../economy/core.js';
import { addBuff } from '../economy/core.js';
import { S, mapPatch, prop, tile, mailSafe, pick, once, N, say, call } from './state.js';
import { listApp } from './ui.js';
import { COUNCIL_PAGES, trustOf, doneCount, PROJ } from './projects.js';
import { FAMILIES } from './people.js';
import { SHOPS } from './shops.js';
import './art.js';

// ---------------------------------------------------------------- the Hoshimori Times
const PRI = { project: 9, hall: 8, shop: 7, arrive: 6, fest: 5, eval: 5, ach: 4, idea: 3, heart: 2, misc: 1 };
export const logEvent = (g, kind, text) => { const ev = S(g).news.events; ev.push({ day: g.day, kind, text }); if (ev.length > 40) ev.shift(); };
let rumors = null; import('../sv4_depth/rumors.js').then((m) => { rumors = m; }).catch(() => {});
export function rumorLine(g) { try { if (!rumors) return null; const a = rumors.activeRumors(g); if (!a.length) return null; const d = rumors.rumorDef(a[0][0]); return d ? `Rumour mill: ${d.title}` : null; } catch (e) { return null; } }
const FILLER = { spring: 'Cherry blossoms are right on schedule, says the park committee.', summer: 'Beach goers are reminded to bring a hat and a bin bag.', autumn: 'Leaf piles in the park are open for jumping. Inspectors approve.', winter: 'Lanterns and hot tea recommended for evening strolls.' };
export function makeIssue(g) {
  const s = S(g), since = g.day - 7, ev = s.news.events.filter((e) => e.day > since).sort((a, b) => (PRI[b.kind] || 0) - (PRI[a.kind] || 0));
  const head = ev[0] ? ev[0].text : `Quiet week on the bay, but the tea is still hot`;
  const items = ev.slice(1, 5).map((e) => e.text);
  const w = g.state.tomorrowWeather; items.push(`Weather: ${w ? `${w} expected tomorrow` : 'mild this week'}`);
  const r = rumorLine(g); if (r) items.push(r);
  items.push(FILLER[seasonOf(g.day)]);
  return { no: s.news.issues.length + 1, day: g.day, head, items: items.slice(0, 6), pop: doneCount(g) };
}
export function publish(g) { const s = S(g).news; if (s.last === g.day) return null; s.last = g.day; const i = makeIssue(g); s.issues.unshift(i); if (s.issues.length > 12) s.issues.length = 12; g.bus.emit('tpIssue', { no: i.no }); return i; }
register('system', 'tp_news', { init(g) {
  const B = g.bus;
  B.on('dayStart', () => { if (g.weekday === 0) publish(g); updateDay(g); });
  B.on('achievement', (e) => { const a = get('achievement', e.id); logEvent(g, 'ach', `${a ? a.name : e.id} achievement earned by a local girl`); });
  B.on('tpProjectStart', (e) => logEvent(g, 'project', `Work begins on the ${PROJ[e.id].name}`));
  B.on('tpProjectDone', (e) => logEvent(g, 'project', `${e.name} is finished`));
  B.on('tpArrival', (e) => logEvent(g, 'arrive', `The ${e.family} family has moved to the south lawn`));
  B.on('tpShopOpen', (e) => logEvent(g, 'shop', `${e.name} opens on the town square`));
  B.on('festivalStart', (e) => { const f = get('festival', e.id); logEvent(g, 'fest', `${f && f.name ? f.name : 'A festival'} fills the bay`); });
  B.on('svEvaluation', (e) => logEvent(g, 'eval', `Year ${e.year} evaluation held with ${e.lanterns} lanterns lit`));
  B.on('hallRestored', () => logEvent(g, 'hall', 'The Community Hall is fully restored'));
  B.on('heartUp', (e) => { if (e.hearts >= 6) { const n = get('npc', e.npc); logEvent(g, 'heart', `${n ? n.name : e.npc} and a local girl are firm friends`); } });
  B.on('tpIdea', (e) => logEvent(g, 'idea', `Council approves suggestion: ${IDEAS.find((i) => i.id === e.id).name}`));
} });
mapPatch('town', { objects: [prop('tp_paper_rack', 10, 14, { use: 'tp_paper', shadow: 12 })] });
register('interaction', 'tp_paper', { label: 'Hoshimori Times', run: (g) => { if (!S(g).news.issues.length) publish(g); return g.open('phone', 'tp_times'); } });
const NEW = (g) => S(g).news.issues.length && S(g).seen.issue !== S(g).news.issues[0].no;
listApp('tp_times', { name: 'Hoshimori Times', icon: itemIcon('paper', { c: Rr.paper[4] }), order: 23, badge: (g) => (NEW(g) ? '!' : 0), open: null, pages: [
  { name: 'Front page', build(g) { const s = S(g).news; if (!s.issues.length) publish(g); const i = s.issues[0]; if (i) S(g).seen.issue = i.no; return i ? { lines: [{ t: `No. ${i.no}  ${i.head.toUpperCase()}`, c: Rr.coral[1] }, '', ...i.items.map((t) => `- ${t}`)], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] } : { lines: ['No issues yet.'], acts: [] }; } },
  { name: 'Archive', build(g, st) { const l = S(g).news.issues, i = l[st.sel] || l[0]; return { list: l.map((q) => ({ t: `No. ${q.no} day ${q.day}` })), lines: i ? [{ t: i.head, c: Rr.coral[1] }, ...i.items.map((t) => `- ${t}`)] : ['Nothing yet.'], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
] });

// ---------------------------------------------------------------- the suggestion box
export const IDEAS = [
  { id: 'benches', name: 'More harbour benches', desc: 'Two new benches near the harbour wall.' }, { id: 'flowers', name: 'Flower planters on the square', desc: 'Planters beside the fountain.' },
  { id: 'umbrella', name: 'A free umbrella stand', desc: 'Borrow an umbrella on rainy days.' }, { id: 'lanterns', name: 'Harbour lantern strings', desc: 'Paper lanterns along the quay.' },
  { id: 'tea', name: 'A free tea table', desc: 'A warm cup every weekday morning.' }, { id: 'swap', name: 'A book swap box', desc: 'Take a book, leave a smile.' },
];
export const ideaState = (g, id) => S(g).sugg.list.find((q) => q.id === id);
export function submitIdea(g, id) {
  const s = S(g).sugg; if (ideaState(g, id) || s.list.some((q) => q.state !== 'built')) return false;
  s.list.push({ id, day: g.day, state: 'sent' }); g.toast('Idea dropped in the suggestion box', 'heart'); g.stat('ideasSent'); return true;
}
function updateDay(g) {
  for (const q of S(g).sugg.list) {
    if (q.state === 'sent' && g.day - q.day >= 3) { q.state = 'approved'; q.day2 = g.day; g.mail(`tp_idea_ok_${q.id}`, 'Mayor Hoshino', `Your idea "${IDEAS.find((i) => i.id === q.id).name}" was read aloud at the council and approved! Builders start soon. - Mayor Hoshino`); }
    else if (q.state === 'approved' && g.day - q.day2 >= 3) { q.state = 'built'; g.setFlag(`tp_idea_${q.id}`, true); g.bus.emit('tpIdea', { id: q.id }); g.mail(`tp_idea_done_${q.id}`, 'Town Council', `Your suggestion is real now: ${IDEAS.find((i) => i.id === q.id).name}. Go and have a look!`); }
  }
}
COUNCIL_PAGES.push({ name: 'Ideas', build(g, st) {
  const id = IDEAS[st.sel] || IDEAS[0], q = ideaState(g, id.id), busy = S(g).sugg.list.some((x) => x.state !== 'built');
  return { list: IDEAS.map((i) => { const x = ideaState(g, i.id); return { t: `${x ? (x.state === 'built' ? '* ' : '~ ') : ''}${i.name}` }; }), lines: [{ t: id.name, c: Rr.coral[1] }, id.desc, '', q ? (q.state === 'sent' ? 'Sent. The council reads it in a few days.' : q.state === 'approved' ? 'Approved! Builders are on the way.' : 'Built and open!') : busy ? 'Wait for your last idea to be built first.' : 'Not suggested yet.'],
    acts: [{ label: 'Suggest', off: !!q || busy, run: () => submitIdea(g, id.id) }] };
} });
const bench2 = (x, y) => prop('tp_bench_prom', x, y, { w: 2, use: 'bench', shadow: 14, when: 'flag:tp_idea_benches' });
mapPatch('harbour', { objects: [bench2(2, 7), bench2(10, 7), { spr: 'tp_lantern_string', x: 12, y: 6, w: 2, h: 1, solid: false, depth: 400, dy: -30, when: 'flag:tp_idea_lanterns', light: { kind: 'lantern', x: 16, y: -10 } }, { spr: 'tp_lantern_string', x: 36, y: 8, w: 2, h: 1, solid: false, depth: 400, dy: -30, when: 'flag:tp_idea_lanterns', light: { kind: 'lantern', x: 16, y: -10 } }] });
mapPatch('town', { objects: [prop('tp_prom_planter', 20, 22, { when: 'flag:tp_idea_flowers', shadow: 12 }), prop('tp_prom_planter', 24, 22, { when: 'flag:tp_idea_flowers', shadow: 12 }), prop('tp_umbrella_stand', 10, 16, { use: 'tp_umbrella', when: 'flag:tp_idea_umbrella', shadow: 10 }),
  prop('tp_tea_table', 8, 16, { use: 'tp_free_tea', when: 'flag:tp_idea_tea', shadow: 14 }), prop('tp_swap_box', 38, 16, { use: 'tp_swap', when: 'flag:tp_idea_swap', shadow: 10 }), prop('tp_sugg_box', 15, 14, { use: 'tp_suggest', shadow: 6 })] });
register('interaction', 'tp_suggest', { label: 'Suggestion box', run: (g) => g.run([N('A wooden box with a slot and a tiny sign: IDEAS WELCOME. Mayor Hoshino reads every slip.'), call((gg) => gg.open('phone', 'tp_council'))]) });
register('interaction', 'tp_umbrella', { label: 'Umbrella stand', run: (g) => { if (!['rain', 'storm', 'snow'].includes(g.weather)) return g.say('misa', 'happy', 'A stand of loaned umbrellas. I will borrow one when it rains.'); if (!once(g, 'tp_umb_day')) return g.say('misa', 'happy', 'I already have my umbrella today.'); try { addBuff(g, 'calm', 180); } catch (e) { /* optional */ } g.addMood(6); return g.say('misa', 'happy', 'A sky-blue umbrella with a council sticker. Now the rain is a friend.'); } });
register('interaction', 'tp_free_tea', { label: 'Free tea table', run: (g) => { if (g.isWeekend || g.minutes > 11 * 60) return g.say('misa', 'happy', 'The urn is empty. Tea is served on weekday mornings until eleven.'); if (!once(g, 'tp_tea_day')) return g.say('misa', 'happy', 'One cup per person. I took mine.'); if (get('item', 'bev_green_tea')) g.give('bev_green_tea', 1); g.addMood(5); return g.say('misa', 'happy', 'A warm cup of green tea, courtesy of the council. Aah.'); } });
register('interaction', 'tp_swap', { label: 'Book swap box', run: (g) => { if (!once(g, 'tp_swap_day')) return g.say('misa', 'happy', 'I swapped already today. Plenty to read.'); const b = pick(g.rngFor('tp_swap'), ['book_picture_book', 'book_mystery', 'book_poetry', 'book_manga'].filter((i) => get('item', i))); if (b) g.give(b, 1); S(g).vol.pts += 1; g.addMood(4); return g.say('misa', 'happy', 'I left a note and took a book. A fair trade.'); } });

// ---------------------------------------------------------------- volunteer days
export const VOL_DAYS = { 14: { id: 'beach', name: 'Beach clean-up', game: 'fest_cleanup' }, 27: { id: 'garden', name: 'Garden weeding', game: 'plants' } };
export const volToday = (g) => VOL_DAYS[dateOf(g.day)] || null;
const RIVALS = ['kai', 'rina', 'mika', 'haru', 'aoi', 'momo'];
export function npcPoints(g, id) { let p = 0; for (let d = 1; d <= g.day; d++) if (VOL_DAYS[dateOf(d)]) p += 2 + Math.floor(g.rngFor('tp_vol' + id, d)() * 7); return p; }
export function leaderboard(g) {
  const rows = RIVALS.filter((i) => get('npc', i)).map((i) => ({ id: i, name: get('npc', i).name, pts: npcPoints(g, i) }));
  rows.push({ id: 'misa', name: 'Misa', pts: S(g).vol.pts }); return rows.sort((a, b) => b.pts - a.pts);
}
mapPatch('town', { objects: [prop('tp_vol_sign', 15, 18, { use: 'tp_volunteer', shadow: 8, when: 'flag:tp_vol_today' })] });
register('system', 'tp_vol', { init(g) { const f = () => g.setFlag('tp_vol_today', !!volToday(g)); for (const e of ['dayStart', 'gameStart', 'gameLoaded']) g.bus.on(e, f); } });
register('interaction', 'tp_volunteer', { label: 'Volunteer day', run: async (g) => {
  const v = volToday(g), s = S(g).vol;
  if (!v) return g.say(null, null, 'The sign is blank today.');
  if (g.minutes < 8 * 60 || g.minutes > 16 * 60) return g.say('mayor', 'happy', 'Volunteers meet between eight and four. Come back then!');
  if (s.days[g.day]) return g.say('mayor', 'happy', 'You did your bit today. Go and enjoy the sunshine!');
  if (g.energy < 12) return g.say('mayor', 'happy', 'You look tired. Eat something first.');
  await g.run([say('mayor', 'happy', `Today is ${v.name} day. Gloves, bags and cheerful faces. Every point goes on the community board.`)]);
  const r = await g.minigame(v.game, {}); if (r && r.quit) return;
  const pts = 4 + 3 * ((r && r.stars) || 1); s.pts += pts; s.days[g.day] = pts; s.trips++; g.useEnergy(12); g.advance(150); g.addMood(10); g.addFriend('mayor', 4); g.stat('volunteerDays'); g.bus.emit('tpVolunteer', { pts });
  if (v.id === 'beach' && get('item', 'shell_cowrie')) g.give('shell_cowrie', 1);
  return g.run([say('mayor', 'happy', `${pts} community points for ${v.name}! You are on the board at ${leaderboard(g).findIndex((x) => x.id === 'misa') + 1}.`)]);
} });
COUNCIL_PAGES.push({ name: 'Volunteer', build(g) {
  const l = leaderboard(g), v = volToday(g), rank = l.findIndex((x) => x.id === 'misa') + 1;
  return { lines: [{ t: 'Community points', c: Rr.coral[1] }, v ? `Today: ${v.name} at the town sign, 8 AM to 4 PM!` : 'Volunteer days: beach clean-up on the 14th and garden weeding on the 27th of every season.', '', ...l.slice(0, 6).map((r, i) => `${i + 1}. ${r.name}: ${r.pts}`), '', `You are ${rank}${['st', 'nd', 'rd'][rank - 1] || 'th'} with ${S(g).vol.pts} points`], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] };
} });

// ---------------------------------------------------------------- the Mayor's Award
export function awardLevel(g) {
  const pts = trustOf(g) + doneCount(g) * 2 + Math.floor(S(g).vol.pts / 10) + FAMILIES.filter((f) => g.state.flags[`tp_in_${f.id}`]).length + SHOPS.filter((s) => g.state.flags[`tp_shop_${s.id}_open`]).length;
  return pts >= 26 ? 3 : pts >= 16 ? 2 : pts >= 8 ? 1 : 0;
}
export function grantAward(g, year = yearOf(g.day)) {
  const a = S(g).award; if (a[year]) return a[year];
  const lv = awardLevel(g); a[year] = lv; if (!lv) return 0;
  const name = ['', 'Bronze', 'Silver', 'Gold'][lv], coins = [0, 200, 400, 800][lv];
  g.addMoney(coins, true); giveStickers(g, lv + 1, "Mayor's Award"); g.addMood(10); g.stat('mayorAwards');
  g.mail(`tp_award_${year}`, 'Mayor Hoshino', `The ${name} Mayor's Award for Year ${year} goes to Misa, for helping the bay grow. There is a ${coins} coin prize, and a plaque for your wall. - Mayor Hoshino`);
  g.bus.emit('tpAward', { year, level: lv }); return lv;
}
register('system', 'tp_award', { init(g) { g.bus.on('svEvaluation', (e) => { const lv = grantAward(g, e.year); logEvent(g, 'eval', lv ? `Misa receives the ${['', 'Bronze', 'Silver', 'Gold'][lv]} Mayor's Award` : 'The Mayor thanks all volunteers'); }); } });

features('Town Growth', [
  'Hoshimori Times: a weekly front page written from real events (projects, festivals, achievements, new shops, families, evaluations) and rumours when they exist',
  'The newspaper rack by the noticeboard and a Hoshimori Times phone app with a new-issue badge and an archive of past issues',
  'Suggestion box beside the noticeboard: propose one of six town ideas; the council reads it, approves it by mail, then builds it in the real map',
  'Approved idea: two new benches by the harbour wall, ready to sit on',
  'Approved idea: flower planters beside the fountain on the square',
  'Approved idea: a free umbrella stand on the square that gives a calm buff on rainy days',
  'Approved idea: paper lantern strings that glow along the harbour quay at night',
  'Approved idea: a free tea table on the square serving a cup of green tea on weekday mornings',
  'Approved idea: a book swap box on the square that hands out a book a day',
  'Volunteer days also drop a cowrie shell on the beach clean-up and grant garden points for tending the beds',
  'Volunteer days: beach clean-up on the 14th and garden weeding on the 27th of each season, with a minigame and community points',
  'Community points leaderboard in the Town Council app comparing Misa with friends around town',
  "Mayor's Award at the year-end evaluation: Bronze, Silver or Gold by Misa's contribution, with coins, stickers and a mailed plaque",
]);
