// Household systems: monthly (14-day) allowance and bills from Mum and Dad (cozy: shortfalls are always covered, never game over),
// a family calendar, six family video-call storylines that continue the weekly call, souvenir parcels from the ship,
// the family photo wall, the Home Score (feeds the year-end evaluation through the existing home stats), and the Home Plans phone app.
import { register, get, all, features } from '../../core/registry.js';
import { seasonOf, dateOf, yearOf, weekdayOf, dateText } from '../../core/time.js';
import { UI, rect, panel, bar, List, Tabs } from '../../ui/ui.js';
import { drawText, drawTextC } from '../../font.js';
import { itemIcon } from '../../gfx/icons.js';
import { post } from '../events/messages.js';
import { SV, SOUVENIRS, nm, say, N, call } from './data.js';
import { PROJECTS, PROJECT_IDS, startProject, whyNot, costOf, isBuilt, active, builtCount } from './reno.js';
import { owned as ownedPets, moodOf } from './pets.js';
import { GADGETS, hasGadget } from './kitchen.js';

// ---------------------------------------------------------------- allowance and bills
const monthOf = (day) => Math.floor((day - 1) / 14);
const lightsOn = (g) => (g.state.homeDecor ? g.state.homeDecor.placed.filter((p) => /lamp|lantern|candle|neon|jukebox|bubble/.test(p.id) && !g.state.homeDecor.off[p.uid]).length : 0);
export function billsFor(g) {
  const rooms = builtCount(g), soaks = SV(g).bath.soaks - (SV(g).house.soaksThen || 0), pets = ownedPets(g).length;
  return [['Electricity', 60 + 7 * lightsOn(g) + 10 * rooms], ['Water', 45 + 8 * rooms + 6 * pets + (isBuilt(g, 'greenhouse') ? 20 : 0)], ['Gas', 35 + 6 * Math.max(0, soaks)]];
}
export const allowanceFor = (g) => 300 + 60 * (yearOf(g.day) - 1) + 20 * Math.min(5, Math.floor(g.skillLevel('homemaking') / 2));
export function settleMonth(g) {
  const H = SV(g).house, m = monthOf(g.day); if (H.lastMonth === m) return null; H.lastMonth = m;
  const allow = allowanceFor(g), parts = billsFor(g), total = parts.reduce((a, [, v]) => a + v, 0);
  g.addMoney(allow); const pay = Math.min(g.money, total), covered = total - pay; if (pay > 0) g.spend(pay);
  H.soaksThen = SV(g).bath.soaks; H.paid += pay; if (covered) H.billsLate++;
  const rec = { day: g.day, allow, parts, pay, covered }; (H.bills ||= []).push(rec); if (H.bills.length > 8) H.bills.shift();
  g.stat('billsPaid'); g.stat('allowances');
  g.mail(`sv4_bills_${m}`, covered ? 'Mum' : 'Mum and Dad', covered ? `Allowance ${allow} coins is on its way. The bills were ${total}, you could pay ${pay}, so we covered the rest. Do not worry about it, sweetheart. Turn off a lamp or two? Love, Mum` : `Allowance: ${allow} coins. Bills this month: ${parts.map(([n, v]) => `${n.toLowerCase()} ${v}`).join(', ')} (${total}). All paid. We are proud of you! Love, Mum and Dad`);
  g.toast(`Allowance +${allow}, bills -${pay}`, 'i_coin'); return rec;
}

// ---------------------------------------------------------------- souvenir parcels, photo wall
function parcels(g) {
  const H = SV(g).house, d = g.day; if (d < 8 || d % 21 !== 10) return;
  const n = H.parcels.n || 0, s = SOUVENIRS[n % SOUVENIRS.length], items = { [s[0]]: 1 };
  if (n === 0) items.furn_photo_family = 1;
  const where = ['the Arctic', 'a port in Chile', 'the Coral Sea', 'Hokkaido', 'the Azores', 'Tasmania'][n % 6];
  post(g, { id: `sv4_souv_${n}`, kind: 'parcel', from: 'Mum and Dad', text: `Greetings from ${where}! We found this and thought of you. The ship is rocking, the tea is cold and we miss you. Love, Mum and Dad`, items }); H.parcels.n = n + 1; g.stat('souvenirParcels');
}
const PHOTO_EVENTS = ['sleepoverHeld', 'dinnerParty', 'renoDone', 'petAdopted'];
export const photoCount = (g) => Object.keys(SV(g).house.photos).length;
function photoRewards(g) {
  const H = SV(g).house, n = photoCount(g);
  for (const [need, item] of [[3, 'furn_photo_garland'], [6, 'furn_photo_wall_big']]) if (n >= need && !H.parcels[item]) { H.parcels[item] = g.day; g.give(item, 1, true); g.toast(`${n} family photos: a new frame for the wall!`, 'i_star'); }
}

// ---------------------------------------------------------------- the Home Score
export function homeScore(g) {
  const dec = g.state.homeDecor ? g.state.homeDecor.placed : [], variety = new Set(dec.map((p) => p.id)).size;
  const pets = ownedPets(g), petAvg = pets.length ? pets.reduce((a, id) => a + (['blissful', 'happy'].includes(moodOf(g, id).id) ? 1 : moodOf(g, id).id === 'content' ? 0.6 : 0.2), 0) / pets.length : 0;
  const tasks = g.state.homeTasks && g.state.homeTasks.list ? g.state.homeTasks.list : [], done = tasks.length ? tasks.filter((t) => t.done).length / tasks.length : 0;
  const parts = [['Decor', Math.min(20, dec.length + Math.floor(variety / 2))], ['Rooms', Math.min(30, builtCount(g) * 5)], ['Pets', Math.round(petAvg * 15)], ['Chores', Math.round(done * 10)],
    ['Kitchen', Math.min(10, Object.keys(GADGETS).filter((k) => hasGadget(g, k)).length * 3 + Math.min(3, SV(g).kitchen.parties))], ['Fresh clothes', Object.values(SV(g).style.worn).some((n) => n >= 3) ? 0 : 5], ['Bills', SV(g).house.billsLate ? 2 : 5], ['Family', Math.min(5, photoCount(g))]];
  const score = Math.min(100, parts.reduce((a, [, v]) => a + v, 0));
  return { score, parts, rank: score >= 85 ? 'Dream home' : score >= 65 ? 'Lovely home' : score >= 40 ? 'Cosy home' : score >= 20 ? 'Getting there' : 'Just moved in' };
}

// ---------------------------------------------------------------- family video-call storylines (follow the weekly call)
const NORI = (t) => say('nori', 'happy', t), MUM = (t, m = 'happy') => say('mum', m, t), DAD = (t, m = 'happy') => say('dad', m, t), M = (t, m = 'happy') => say('misa', m, t);
const reward = (npc, n, extra) => call((g) => { g.addFriend(npc, n); g.addMood(8); g.stat('familyStories'); if (extra) extra(g); });
export const STORIES = [
  { id: 'nori_gallery', title: 'Aunt Nori\'s gallery', cast: 'nori', chapters: [
    { ready: (g) => g.day >= 10, steps: () => [NORI('Misa, guess what? A gallery in the city wants to show my drawings! Eight of them. EIGHT.'), M('Nori, that is amazing!', 'surprised'), NORI('I am terrified. I have never hung anything on a real wall. Can I send you the smallest one for luck?'), M('Yes! I will find the best wall in the house.'), reward('nori', 25, (g) => g.give('furn_photo_nori', 1, true))] },
    { ready: (g, s) => g.day - s.at >= 14, steps: () => [NORI('The opening was last night. Four red dots! That means four sold! I cried into a very small sandwich.'), { t: 'choice', prompt: 'Tell Nori...', options: [{ text: 'I am so proud of you', steps: [NORI('You are going to make me cry again. I am drawing you a thank-you picture right now.')] }, { text: 'Which ones sold?', steps: [NORI('The lighthouse, the harbour cat, and two of Mochi. Mochi is now a collector\'s item.')] }] }, reward('nori', 30)] },
  ] },
  { id: 'dad_kitchen', title: 'Dad\'s floating kitchen', cast: 'dad', chapters: [
    { ready: (g) => (g.state.stats.cooked || 0) >= 4, steps: () => [DAD('I have news. The ship\'s cook is retiring and the captain asked if I would run the galley for a whole season.'), M('Dad! Is that what you want?', 'surprised'), DAD('Forty hungry scientists and a stove that tilts. It is my dream, Misa. I just wanted to say it out loud to someone.'), reward('dad', 25)] },
    { ready: (g, s) => g.day - s.at >= 14, steps: () => [DAD('Forty portions of curry, one rolling sea, zero casualties. Your recipe notes saved me, by the way.'), { t: 'choice', prompt: 'Dad asks what dish to try next...', options: [{ text: 'Something with rice', steps: [DAD('Takikomi gohan! Rice and mushrooms. I will name it after you.')] }, { text: 'Something sweet', steps: [DAD('A dessert night! The scientists will weep.')] }] }, reward('dad', 30, (g) => g.give('souv_spice_tin', 1, true))] },
  ] },
  { id: 'mum_whale', title: 'The whale with your name', cast: 'mum', chapters: [
    { ready: (g) => g.day >= 20, steps: () => [MUM('We have been following a young humpback with a notch in her tail fin all month. The team asked me to name her.'), M('Ooh. Do you have a name?'), MUM('Not yet. I wanted to ask you first. Is it okay if she is called Misa?'), M('Mum...!', 'surprised'), reward('mum', 30)] },
    { ready: (g, s) => g.day - s.at >= 14, steps: () => [MUM('Little Misa the whale had a calf this week! A whole new tail fin to track. I thought you should be the first to know.'), M('Another me! A baby me! I am so happy I could burst.'), MUM('Look after yourself, my brave girl. I will send you something from the tide pool.'), reward('mum', 35, (g) => g.give('souv_whale_tooth', 1, true))] },
  ] },
  { id: 'ship_storm', title: 'The night of the storm', cast: 'mum', chapters: [
    { ready: (g) => g.day >= 25 && ['rain', 'storm'].includes(g.weather), steps: () => [MUM('Misa, the signal is bad. There is a big storm out here and the ship is tipping. We are fine. The captain says we are fine.'), DAD('Your mum is clutching a teacup with both hands. I am eating biscuits. Everyone copes differently.'), M('Please be careful. I will keep the lamp on in the window.', 'sad'), reward('mum', 25)] },
    { ready: (g, s) => g.day - s.at >= 7, steps: () => [DAD('We made it through. A rainbow, a broken radar and one very green scientist. All is well.'), MUM('Thank you for the lamp. I could feel it. Silly, I know.'), M('Not silly at all.'), reward('dad', 25)] },
  ] },
  { id: 'homecoming', title: 'The visit', cast: 'mum', chapters: [
    { ready: (g) => g.day >= 35, steps: (g) => [MUM('Big news: the ship docks in Hoshimori Bay for a week next year! We want to stay with you.'), M('Here? Really? Where will you sleep?', 'surprised'), DAD(isBuilt(g, 'guest') ? 'You have a guest room already? That is perfect. We will bring the good pillows.' : 'We could always camp in the sunroom. Or the garden. Or Mochi\'s tower.'), reward('mum', 25)] },
    { ready: (g, s) => g.day - s.at >= 21, steps: (g) => [MUM(isBuilt(g, 'guest') ? 'The guest room is booked, then. Fresh sheets, please, and a bowl of Mochi\'s favourite food.' : 'Dad has measured the sunroom twice. He will build a bunk if he has to.', 'happy'), { t: 'choice', prompt: 'Misa says...', options: [{ text: 'I will make dinner', steps: [DAD('A real homecoming dinner. I may cry into the soup.')] }, { text: 'I will decorate!', steps: [MUM('Your photo wall alone will make me weep.')] }] }, reward('mum', 35), reward('dad', 20)] },
  ] },
  { id: 'nori_move', title: 'Nori might move here', cast: 'nori', chapters: [
    { ready: (g) => yearOf(g.day) >= 2 || g.day >= 70, steps: () => [NORI('Misa, do not laugh. I have been looking at flats near the harbour. A little studio with a skylight.'), M('Nori! Near us?', 'surprised'), NORI('The city is loud and I miss the sea. Besides, my favourite niece lives there. Do not tell your mother.')] .concat([reward('nori', 25)]) },
    { ready: (g, s) => g.day - s.at >= 14, steps: () => [NORI('A studio came up. Skylight, creaky floors, view of the lighthouse. Should I take it?'), { t: 'choice', prompt: 'Tell Nori...', options: [{ text: 'Yes, come!', steps: [NORI('Then I will! I will teach you to draw cats that actually look like cats.'), call((g) => g.setFlag('sv4_nori_moving', true))] }, { text: 'Only if you are happy', steps: [NORI('That is the wisest thing anyone has said all week. I will think on it, with biscuits.')] }] }, reward('nori', 35)] },
  ] },
];
const calls = (g) => SV(g).house.calls;
function nextChapter(g) {
  const C = calls(g);
  for (const s of STORIES) { const p = C.seen[s.id] || { n: 0, at: -99 }, ch = s.chapters[p.n]; if (ch && g.day - C.last >= 2 && ch.ready(g, p)) return { s, ch, p }; }
  return null;
}
export function runChapter(g) {
  const nx = nextChapter(g); if (!nx) return false; const C = calls(g);
  C.seen[nx.s.id] = { n: nx.p.n + 1, at: g.day }; C.last = g.day; g.stat('familyChapters');
  g.run([{ t: 'fade', to: 1, dur: 0.4 }, ...(nx.s.cast === 'nori' ? [] : [{ t: 'scene', name: 'ship_cabin' }]), { t: 'fade', to: 0, dur: 0.4 }, N(`(${nx.s.title}, part ${nx.p.n + 1})`), ...nx.ch.steps(g), { t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.4 }]);
  return true;
}
register('worldTick', 'sv4_family_story', { update(dt, world, game) {
  const s = game.state.sv4_home; if (!s || !s.house.calls.pending) return;
  if (game.scenes.top !== world || world.busy) return; s.house.calls.wait = (s.house.calls.wait || 0) + dt; if (s.house.calls.wait < 2.5) return;
  s.house.calls.pending = false; s.house.calls.wait = 0; runChapter(game);
} });

register('system', 'sv4_household', { init(game) {
  game.bus.on('dayStart', () => {
    if ([1, 15].includes(dateOf(game.day))) settleMonth(game); parcels(game);
    const sc = homeScore(game); SV(game).house.score = sc.score; if (sc.score >= 70 && SV(game).house.perfectDay !== game.day) { SV(game).house.perfectDay = game.day; game.stat('perfectHomeDays'); }
    photoRewards(game);
  });
  for (const ev of PHOTO_EVENTS) game.bus.on(ev, () => { SV(game).house.photos[`${ev}_${game.day}`] = game.day; photoRewards(game); });
  game.bus.on('stat', ({ k }) => { if (k === 'familyCalls') { calls(game).pending = true; calls(game).wait = 0; } });
  game.sv4HomeScore = () => homeScore(game);
} });

// ---------------------------------------------------------------- calendar entries
export function calendar(g, from = g.day, n = 14) {
  const out = [], a = active(g);
  for (let d = from; d < from + n; d++) {
    const ev = [];
    if ([1, 15].includes(dateOf(d))) ev.push('Allowance and bills');
    if ([2, 6].includes(weekdayOf(d))) ev.push('Family video call');
    if (weekdayOf(d) >= 5) ev.push('Park pet show');
    if (d >= 8 && d % 21 === 10) ev.push('Parcel from the ship');
    if (a && d === a.start + a.days + (a.rainDays || 0)) ev.push(`${PROJECTS[a.id].name} due`);
    for (const n_ of all('npc')) if (n_.birthday && n_.birthday.season === seasonOf(d) && n_.birthday.day === dateOf(d) && !n_.hidden) ev.push(`${n_.name}'s birthday`);
    if (ev.length) out.push([d, ev]);
  }
  return out;
}

// ---------------------------------------------------------------- the Home Plans phone app
register('phoneApp', 'sv4_plans', {
  name: 'Home Plans', icon: itemIcon('furniture', { c: '#e8c050' }), order: 63, when: (g) => !!g.state.sv4_home,
  badge: (g) => (active(g) ? '' : 0),
  open(g, app) { app.state.tabs ||= new Tabs(['Plans', 'Calendar', 'Score', 'Bills']); app.state.list ||= new List(PROJECT_IDS, 8, 12); app.state.conf = null; },
  update(dt, input, g, app) {
    const st = app.state, { x, y, w } = app.area; st.tabs.update(input, x + 4, y + 2, w - 8);
    if (st.tabs.i !== 0) return;
    const pick = st.list.update(input, x + 8, y + 36, 150);
    if (pick) { if (st.conf === pick) { startProject(g, pick); st.conf = null; } else { st.conf = pick; const why = whyNot(g, pick); if (why) g.toast(why); else g.toast('Press Enter again to sign the plans'); } }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, i = st.tabs.i; st.tabs.draw(g, x + 4, y + 2, w - 8);
    panel(g, x + 4, y + 18, w - 8, 150, 'paper');
    if (i === 0) {
      st.list.draw(g, x + 8, y + 36, 150, (gg, id, rx, ry, sel) => { const a = active(game), s = isBuilt(game, id) ? 'BUILT' : a && a.id === id ? `DAY ${a.done}/${a.days}` : whyNot(game, id) ? '-' : 'READY'; drawText(gg, PROJECTS[id].name.toUpperCase().slice(0, 18), rx + 3, ry + 2, sel ? UI.ink : UI.ink2, 1, null); drawText(gg, s, rx + 112, ry + 2, s === 'BUILT' ? UI.good : s === 'READY' ? UI.accent2 : UI.dim, 1, null); });
      drawText(g, 'GORO AND MR. KINOKO BUILD. RAIN STOPS WORK.', x + 10, y + 22, UI.dim, 1, null);
      const id = st.list.current, p = PROJECTS[id]; if (!id) return;
      drawText(g, p.name.toUpperCase(), x + 166, y + 36, UI.ink, 1, null); drawText(g, `${costOf(game, id)} COINS, ${p.days} DAYS`, x + 166, y + 48, UI.accent2, 1, null);
      Object.entries(p.mats).forEach(([m, n], k) => drawText(g, `${nm(m).toUpperCase()} ${Math.min(n, game.count(m))}/${n}`, x + 166, y + 62 + k * 10, game.has(m, n) ? UI.good : UI.bad, 1, null));
      const why = whyNot(game, id); const words = p.desc.toUpperCase().match(/.{1,22}(\s|$)/g) || []; words.slice(0, 5).forEach((l, k) => drawText(g, l.trim(), x + 166, y + 88 + k * 9, UI.dim, 1, null));
      drawText(g, why ? why.toUpperCase().slice(0, 26) : st.conf === id ? 'ENTER AGAIN TO SIGN' : 'ENTER TO START', x + 166, y + 140, why ? UI.bad : UI.accent2, 1, null);
      const a = active(game); if (a) { bar(g, x + 10, y + 158, w - 28, 5, Math.min(1, a.done / a.days), UI.mint); }
    } else if (i === 1) {
      drawText(g, 'FAMILY CALENDAR: NEXT 14 DAYS', x + 10, y + 22, UI.ink, 1, null);
      calendar(game).slice(0, 12).forEach(([d, ev], k) => drawText(g, `${dateText(d).toUpperCase()}: ${ev.join(', ').toUpperCase().slice(0, 36)}`, x + 10, y + 36 + k * 11, d === game.day ? UI.accent2 : UI.ink, 1, null));
    } else if (i === 2) {
      const sc = homeScore(game); drawText(g, `HOME SCORE ${sc.score}/100: ${sc.rank.toUpperCase()}`, x + 10, y + 22, UI.ink, 1, null);
      sc.parts.forEach(([n, v], k) => { drawText(g, n.toUpperCase(), x + 10, y + 38 + k * 15, UI.ink, 1, null); bar(g, x + 100, y + 38 + k * 15, 170, 6, Math.min(1, v / ({ Decor: 20, Rooms: 30, Pets: 15, Chores: 10, Kitchen: 10, 'Fresh clothes': 5, Bills: 5, Family: 5 }[n])), UI.mint); });
      drawText(g, '70+ A DAY COUNTS TOWARDS THE YEAR-END HOME COMFORT', x + 10, y + 158, UI.dim, 1, null);
    } else {
      const H = SV(game).house; drawText(g, `ALLOWANCE ${allowanceFor(game)} EVERY 14 DAYS`, x + 10, y + 22, UI.ink, 1, null);
      billsFor(game).forEach(([n, v], k) => drawText(g, `${n.toUpperCase()} ~${v}`, x + 10, y + 36 + k * 10, UI.ink, 1, null));
      drawText(g, 'LAST BILLS', x + 10, y + 74, UI.accent2, 1, null);
      (H.bills || []).slice(-6).reverse().forEach((b, k) => drawText(g, `${dateText(b.day).toUpperCase()}: +${b.allow} -${b.pay}${b.covered ? ' (MUM COVERED ' + b.covered + ')' : ''}`, x + 10, y + 86 + k * 10, UI.ink, 1, null));
    }
  },
});

features('Home & Pets', [
  'Monthly (every 14 days) allowance from Mum and Dad that grows with each year and with homemaking skill',
  'Monthly electricity, water and gas bills that depend on lit lamps, built rooms, pets and soaks; any shortfall is covered by Mum, never game over',
  'Home Plans phone app: renovation list with costs, materials and progress, plus calendar, Home Score and bills tabs',
  'Family calendar tab: allowance days, family calls, parcel days, the weekend pet show, birthdays and the finish date of the current renovation',
  'Six family video-call storylines (Nori\'s gallery, Dad\'s galley, the whale named Misa, a storm at sea, the visit home, Nori moving to Hoshimori) told after the weekly call',
  'Souvenir parcels from the research ship every three weeks: eight keepsakes from far ports, the first with a family photo frame',
  'Family photo wall furniture set: framed family, ship, Nori, garland and a big collage that unlock as photos of parties, sleepovers and projects pile up',
  'Home Score out of 100 from decor, rooms, pets, chores, kitchen, clean clothes, bills and photos; days above 70 count as perfect home days for the year-end evaluation',
  'Renovations count as home upgrades in the year-end evaluation',
]);
void rect; void drawTextC;
