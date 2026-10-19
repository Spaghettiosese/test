// Town Council and the eight town projects. Misa's trust with the council (hall restored, coins donated, friendships, evaluation lanterns,
// volunteering) unlocks projects; each is funded by donations, builds for days (two visible construction stages), and is opened with a
// ribbon-cutting. Perks live in perks.js. Save: S(g).proj[id] = { funded, state: 'idle'|'building'|'done', start, done, cut }.
import { register, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { yearOf } from '../../core/time.js';
import { giveStickers } from '../economy/core.js';
import { S, mapPatch, prop, mailSafe, idle, N, say, call, sc, ch, clamp } from './state.js';
import { PROJECT_SIZE } from './art.js';
import { listApp } from './ui.js';
import { borrow } from './finance.js';

export const PROJECTS = [
  { id: 'bus', name: 'Hoshimori Loop Bus', cost: 1200, days: 3, trust: 2, desc: 'A small loop bus linking the square, the harbour, the park and Lantern Lane for just 20 coins.', perk: 'Cheap loop bus rides between four stops', speech: 'Four little stops, one friendly bus, and nobody has to carry shopping home ever again!' },
  { id: 'garden', name: 'Community Garden', cost: 1500, days: 4, trust: 3, desc: 'Raised beds at Sakura Park that everybody tends and everybody harvests.', perk: 'Harvest fresh vegetables from the garden every day', speech: 'Plant a seed together and you grow a neighbourhood. That is a very old saying. I just made it up.' },
  { id: 'recycle', name: 'Recycling Centre', cost: 2000, days: 4, trust: 4, desc: 'Sorting bins on Lantern Lane. Junk turns into coins and eco bags.', perk: 'Trade junk for coins and craft eco bags', speech: 'Nothing is rubbish until we decide it is. Today, we decide otherwise!' },
  { id: 'library', name: 'Library Reading Wing', cost: 2500, days: 5, trust: 5, desc: 'A hushed new wing of the library with armchairs, a rug and a lot of shelves.', perk: 'A reading nook that trains Study every day', speech: 'A town that reads together stays curious together. Please keep your voices down. I will go first.' },
  { id: 'skate', name: 'Skate and Play Park', cost: 3500, days: 5, trust: 6, desc: 'A concrete bowl, a rail and painted lanes for skaters, scooters and the young at heart.', perk: 'Skate tricks that lift mood and train stamina', speech: 'I am told the kids call this a bowl. I call it the best use of concrete in the history of the bay.' },
  { id: 'promenade', name: 'Seaside Promenade', cost: 4000, days: 6, trust: 7, need: 'flag:community_restored', needText: 'the Community Hall restored', desc: 'Planters, benches and lamps along the harbour boardwalk.', perk: 'A calming daily stroll and a prettier harbour at night', speech: 'The sea has been here forever. Today we finally gave it a proper sidewalk to look at us from.' },
  { id: 'weather', name: 'Weather Station', cost: 3000, days: 5, trust: 8, after: 'recycle', desc: 'A tower on the harbour sand that reads the wind, rain and tide.', perk: 'Evening storm warnings and a two-week outlook', speech: 'Now the sky has a spokesperson. Please do not argue with it. It is very scientific.' },
  { id: 'night', name: 'Night Market Square', cost: 5000, days: 6, trust: 9, need: 'year>=2', needText: 'Year 2', desc: 'Lantern-lit stalls in the square on weekend evenings.', perk: 'A weekend evening market with unique treats', speech: 'When the sun goes down, the square lights up. That is not a metaphor. We installed bulbs.' },
];
export const PROJ = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
const PS = (g, id) => (S(g).proj[id] ||= { funded: 0, state: 'idle', start: 0, done: 0, cut: 0 });
export const projState = (g, id) => PS(g, id).state;
export const projDone = (g, id) => PS(g, id).state === 'done';
export const doneCount = (g) => PROJECTS.filter((p) => projDone(g, p.id)).length;

// ---------------------------------------------------------------- trust
export function latestLanterns(g) {
  const ev = g.state.svlife && g.state.svlife.evals; if (!ev) return 0;
  return Math.max(0, ...Object.values(ev).map((e) => e.lanterns || 0));
}
export const friendCount = (g) => all('npc').filter((n) => !n.hidden && n.gifts && g.hearts(n.id) >= 2).length;
export function trustParts(g) {
  const s = S(g);
  return [['Community Hall restored', g.flag('community_restored') ? 3 : 0], ['Coins donated (1 per 1500)', Math.floor(s.donated / 1500)], ['Friends at 2 hearts (1 per 3)', Math.floor(friendCount(g) / 3)],
    ['Evaluation lanterns', latestLanterns(g)], ['Volunteer points (1 per 12)', Math.floor(s.vol.pts / 12)]];
}
export const trustOf = (g) => trustParts(g).reduce((a, [, v]) => a + v, 0);
export function requirements(g, p) {
  const out = [{ t: `Trust ${p.trust} (you have ${trustOf(g)})`, ok: trustOf(g) >= p.trust }];
  if (p.need) out.push({ t: p.needText, ok: g.check(p.need) });
  if (p.after) out.push({ t: `${PROJ[p.after].name} finished`, ok: projDone(g, p.after) });
  return out;
}
export const unlocked = (g, p) => requirements(g, p).every((r) => r.ok);

// ---------------------------------------------------------------- funding and construction
export function fund(g, id, amount) {
  const p = PROJ[id], st = PS(g, id);
  if (st.state !== 'idle') return 0;
  if (!unlocked(g, p)) { g.toast('The council needs more trust first'); return 0; }
  const n = Math.max(0, Math.min(amount, p.cost - st.funded, g.money));
  if (!n) return 0;
  g.moneyNote && g.moneyNote(`Donation: ${p.name}`); g.addMoney(-n, true);
  st.funded += n; S(g).donated += n; g.stat('townDonated', n); g.sfx('coin');
  if (st.funded >= p.cost) startBuild(g, id);
  return n;
}
export function startBuild(g, id) {
  const st = PS(g, id), p = PROJ[id];
  st.state = 'building'; st.start = g.day; g.setFlag(`tp_${id}_site`, true);
  g.toast(`Construction begins: ${p.name}`, 'heart'); g.bus.emit('tpProjectStart', { id });
}
export const daysLeft = (g, id) => { const st = PS(g, id), p = PROJ[id]; return st.state === 'building' ? Math.max(0, st.start + p.days - g.day) : 0; };
export function tickProjects(g) {
  for (const p of PROJECTS) {
    const st = PS(g, p.id);
    if (st.state === 'building' && g.day >= st.start + p.days) {
      st.state = 'done'; st.done = g.day; g.setFlag(`tp_${p.id}_done`, true); g.stat('townProjects');
      mailSafe(g, { id: `tp_done_${p.id}`, from: 'mayor', text: `${p.name} is finished! Come to the ribbon-cutting. I have brought scissors. Large ones. - Mayor Hoshino` });
      g.bus.emit('tpProjectDone', { id: p.id, name: p.name });
    }
    if (st.state === 'idle' && st.funded > 0 && unlocked(g, p) && st.funded >= p.cost) startBuild(g, p.id);
    if (st.state === 'idle' && !st.told && unlocked(g, p)) { st.told = 1; if (g.day > 3) g.mail(`tp_open_${p.id}`, 'Town Council', `New project open for funding: ${p.name} (${p.cost} coins). Ask Mayor Hoshino or open the Town Council app.`); }
  }
}
register('system', 'tp_projects', { init(g) { g.bus.on('dayStart', () => tickProjects(g)); g.bus.on('gameLoaded', () => tickProjects(g)); } });

// ---------------------------------------------------------------- ribbon-cutting
export function ceremonySteps(g, id) {
  const p = PROJ[id];
  return [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'wait', dur: 0.3 }, { t: 'fade', to: 0, dur: 0.4 },
    N(`A crowd has gathered. A red ribbon stretches across the new ${p.name}.`),
    say('mayor', 'happy', p.speech), say('mayor', 'happy', 'Misa, you made this happen. Would you do the honours? The scissors are very sharp, so snip with confidence.'),
    { t: 'choice', prompt: 'Cut the ribbon?', options: [{ text: 'Snip!', steps: [{ t: 'sfx', name: 'chime' }, N('Snip! Confetti, cheering and one very loud whistle from somewhere in the back.')] },
      { text: 'Let the Mayor do it with me', steps: [{ t: 'sfx', name: 'chime' }, say('mayor', 'surprised', 'Together? How lovely. On three! One, two... oh, you already did it.')] }] },
    call((gg) => { PS(gg, id).cut = gg.day; gg.setFlag(`tp_${id}_cut`, true); gg.addMoney(100 + 50 * doneCount(gg)); giveStickers(gg, 1, 'ribbon cutting'); gg.addMood(12); gg.addFriend('mayor', 8); gg.stat('ribbonCuts'); gg.bus.emit('tpRibbon', { id }); }),
    say('mayor', 'happy', `The ${p.name} is officially open. Perk unlocked: ${p.perk}.`)];
}
const PLACE_MAP = { bus: 'town', garden: 'park', recycle: 'lane', library: 'library', skate: 'park', promenade: 'harbour', weather: 'harbour', night: 'town' };
export function tryCeremony(g) {
  if (!idle(g) || g.minutes < 8 * 60 || g.minutes > 19 * 60 || g.state.sv5t.cerBusy) return;
  const here = g.world.map.id;
  for (const p of PROJECTS) if (projDone(g, p.id) && !PS(g, p.id).cut && PLACE_MAP[p.id] === here) {
    S(g).cerBusy = 1; g.run(ceremonySteps(g, p.id)).finally(() => { S(g).cerBusy = 0; }); return;
  }
}
register('system', 'tp_ceremony', { init(g) { for (const e of ['mapEnter', 'hour']) g.bus.on(e, () => tryCeremony(g)); } });

// ---------------------------------------------------------------- the world: sites and finished projects
const PLACE = {
  bus: [['town', 40, 12], ['harbour', 7, 5], ['park', 23, 8], ['lane', 30, 9]],
  library: [['library', 16, 3]], skate: [['park', 16, 23]], garden: [['park', 32, 2]], recycle: [['lane', 37, 11]], weather: [['harbour', 44, 5]], promenade: [['harbour', 21, 8]], night: [['town', 29, 19]],
};
const when = (id, extra = '') => `flag:tp_${id}_done${extra}`;
const siteObj = (id, x, y) => {
  const [w, h] = PROJECT_SIZE[id];
  return { spr: `tp_site1_${id}`, x, y, w, h, shadow: 0, when: `flag:tp_${id}_site&!flag:tp_${id}_done`,
    sprFn: (g) => { const p = PROJ[id], st = PS(g, id); return `tp_site${(g.day - st.start) * 2 >= p.days ? 2 : 1}_${id}`; },
    interact: { label: 'Construction site', run: (g) => g.say(null, null, `${PROJ[id].name}: ${daysLeft(g, id)} more day${daysLeft(g, id) === 1 ? '' : 's'} of work. The sign says: THANK YOU, MISA!`) } };
};
const doneObjs = {
  bus: (x, y) => prop('tp_bus_sign', x, y, { when: when('bus'), use: 'tp_loop_bus', shadow: 6 }),
  library: (x, y) => prop('tp_wing', x, y, { w: 5, h: 3, when: when('library'), use: 'tp_wing_read', shadow: 0 }),
  skate: (x, y) => prop('tp_skate', x, y, { w: 4, h: 3, when: when('skate'), use: 'tp_skate_do', shadow: 0 }),
  garden: (x, y) => prop('tp_garden', x, y, { w: 4, h: 3, when: when('garden'), use: 'tp_garden_tend', shadow: 0 }),
  recycle: (x, y) => prop('tp_recycle', x, y, { w: 3, h: 2, when: when('recycle'), use: 'tp_recycle_use', shadow: 0 }),
  weather: (x, y) => prop('tp_weather', x, y, { w: 2, h: 2, when: when('weather'), use: 'tp_weather_read', shadow: 10 }),
};
export const BUS_ARRIVE = { town: [40, 13], harbour: [7, 6], park: [23, 9], lane: [30, 8] };
for (const [id, list] of Object.entries(PLACE)) for (const [map, x, y] of list) {
  const objs = [siteObj(id, x, y)];
  if (doneObjs[id]) objs.push(doneObjs[id](x, y));
  if (id === 'promenade') {
    for (const px of [2, 6, 14, 20, 30, 40, 43]) objs.push(prop('tp_prom_planter', px, 9, { when: when(id), shadow: 12 }));
    objs.push(prop('tp_prom_sign', 30, 8, { when: when(id), use: 'tp_prom_stroll', shadow: 6 }), prop('tp_bench_prom', 8, 8, { w: 2, when: when(id), use: 'bench', shadow: 14 }), prop('tp_bench_prom', 26, 8, { w: 2, when: when(id), use: 'bench', shadow: 14 }));
  }
  if (id === 'night') {
    ['a', 'b', 'c'].forEach((k, i) => objs.push(prop(`tp_nm_stall_${k}`, 29 + i * 4, 20, { w: 2, when: [when(id), 'weekend', 'time>=17:00'], use: 'tp_night_shop', shadow: 22 })));
    objs.push({ spr: 'tp_nm_lights', x: 29, y: 19, w: 10, h: 1, solid: false, depth: 400, dy: -26, when: [when(id), 'time>=17:00'] });
  }
  mapPatch(map, { objects: objs });
}

// ---------------------------------------------------------------- the council podium, Town Council app and Mayor Hoshino
mapPatch('town', { objects: [prop('tp_podium', 17, 14, { w: 2, use: 'tp_council', shadow: 20 })] });
register('interaction', 'tp_council', { label: 'Town Council board', run: (g) => g.open('phone', 'tp_council') });
export const COUNCIL_PAGES = [];
COUNCIL_PAGES.push({ name: 'Projects', build(g, st) {
  const p = PROJECTS[st.sel] || PROJECTS[0], ps = PS(g, p.id), ok = ps.state === 'idle' && unlocked(g, p);
  const lines = [{ t: p.name, c: Rr.coral[1] }, p.desc, `Cost ${p.cost}c, builds in ${p.days} days.`, `Perk: ${p.perk}`, ''];
  if (ps.state === 'idle') { lines.push(`Funded ${ps.funded}/${p.cost}c`); for (const r of requirements(g, p)) lines.push({ t: `${r.ok ? '[x]' : '[ ]'} ${r.t}`, c: r.ok ? Rr.forest[1] : Rr.ink[3] }); }
  else if (ps.state === 'building') lines.push({ t: `Under construction: ${daysLeft(g, p.id)} days left`, c: Rr.butter[0] });
  else lines.push({ t: ps.cut ? 'Open! Enjoy the perk.' : 'Finished! Visit it for the ribbon cutting.', c: Rr.forest[1] });
  return { list: PROJECTS.map((q) => ({ t: `${PS(g, q.id).state === 'done' ? '* ' : PS(g, q.id).state === 'building' ? '~ ' : unlocked(g, q) ? '+ ' : '- '}${q.name}`, c: PS(g, q.id).state === 'done' ? Rr.forest[1] : unlocked(g, q) ? undefined : Rr.ink[3] })), lines,
    acts: [{ label: 'Give 100', off: !ok || g.money < 100, run: () => fund(g, p.id, 100) }, { label: 'Give 500', off: !ok || g.money < 500, run: () => fund(g, p.id, 500) },
      { label: 'Fund rest', off: !ok || !g.money, run: () => fund(g, p.id, p.cost - ps.funded) }, { label: 'Loan 500', off: !ok, run: () => { const n = borrow(g, 500, 1000 + 500 * Math.min(6, trustOf(g))); if (!n) g.toast('The council loan limit is reached'); else g.toast('Council loan: +500 coins, repay any time'); } }] };
} });
COUNCIL_PAGES.push({ name: 'Trust', build(g) {
  const parts = trustParts(g);
  return { lines: [{ t: `Council trust: ${trustOf(g)}`, c: Rr.coral[1] }, 'Trust opens new projects. Earn it by being a good neighbour:', ...parts.map(([a, b]) => `+${b}  ${a}`), '', `Projects finished: ${doneCount(g)}/8`, `Coins donated: ${S(g).donated}c`],
    bars: [{ label: 'Trust', v: trustOf(g), max: 9 }, { label: 'Projects', v: doneCount(g), max: 8, c: Rr.butter[2] }], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] };
} });
listApp('tp_council', { name: 'Town Council', icon: itemIcon('star', { c: Rr.coral[2] }), order: 33, pages: COUNCIL_PAGES });

import { npc } from '../social/util.js';
npc('mayor', {
  name: 'Mayor Hoshino', role: 'Mayor of Hoshimori Bay', color: '#c8503c',
  bio: 'Mayor Hoshino has run Hoshimori Bay for nineteen years on tea, optimism and a clipboard. She knows every bench by name and believes a town is just a big, slow group project.',
  look: { hair: '#8a8a9c', top: '#c8503c', bottom: '#3a3a4a', skin: '#f2c9a4', eyes: '#4a3a2a', accent: '#f4d06a', shoe: '#5a4a4a' },
  birthday: { season: 'spring', day: 3 },
  hint: 'does the rounds in the square on weekdays and chairs the Town Council at the podium by the noticeboard.',
  schedule: [
    { when: 'weather:rain|storm|snow', stops: [{ at: '09:00', map: 'cafe', spot: 'table_3' }, { at: '15:00', map: null }] },
    { when: 'weekday', stops: [{ at: '08:30', map: 'town', spot: 'clocktower' }, { at: '11:30', map: 'town', spot: 'noticeboard' }, { at: '14:00', map: 'town', spot: 'fountain' }, { at: '17:00', map: 'town', spot: 'bench_1' }, { at: '19:00', map: null }] },
    { stops: [{ at: '10:00', map: 'town', spot: 'stage' }, { at: '14:00', map: 'town', spot: 'bench_2' }, { at: '18:00', map: null }] },
  ],
  gifts: { love: ['gift_tea_tin', 'gift_pressed_flower', 'bev_green_tea'], like: ['gift_postcard', 'snack_cheesecake', 'gift_candle', 'ing_honey'], dislike: ['snack_candy', 'misc_spoiled_food'], hate: ['dish_mysterious_lump'], likeTags: ['tea'] },
  lines: {
    default: ['happy|Misa! Just the citizen I wanted. Well, any citizen. But you especially.', 'A town is a big slow group project. I am the one who sends the reminder emails.', "happy|If you ever have an idea, drop it in the suggestion box. I read every slip. Even the ones about crows.", 'Nineteen years as mayor and I still get excited when a bench is installed.', "happy|The council app on your phone shows what the town could build next. Come, pick a project!", 'Every ribbon I cut is a promise somebody kept.'],
    morning: ['Good morning! Tea first, then democracy.', "happy|I like the square before the shops open. It feels like the town is stretching."],
    afternoon: ['Afternoon rounds. I count benches. It is oddly relaxing.', 'Somebody asked me for a statue. I asked, of whom? They said, of me. I said, no.'],
    evening: ['Evening already? The lamps look lovely. I voted for those lamps.', 'Last round of the day. Then my slippers and the radio.'],
    rain: ['sad|Rain, and I forgot my umbrella. A mayor with wet shoes is a humble mayor.'],
    weekend: ['Weekends are for the stage, the stalls and standing around looking approachable.'],
    spring: ['Spring! Everything is a candidate for a ribbon.'], summer: ['Summer budgets are sticky. Like popsicles.'], autumn: ['Autumn is when I finally read the minutes. Both of them.'], winter: ['Winter meetings are warm. Mostly because of the heater, a little because of the gossip.'],
    h2: ['happy|You have good instincts for this town, Misa. Come to my office hours. By which I mean: find me anywhere.'], h4: ["happy|Nobody told me the best part of the job would be watching someone else start to care. That was you."],
    firstMeet: ["happy|Ah, the girl from Sunny Pines! I am Mayor Hoshino. Welcome to the bay. Do you like benches? Everyone says I talk about benches too much."],
    birthday: ['happy|My birthday? You remembered! The council gave me a pen. You, a friend. That is better.'],
    gift_love: ['happy|Oh, tea! The real kind! You have saved a very long meeting.'], gift_like: ['happy|How thoughtful. I will put it on my desk where it can inspire me.'], gift_neutral: ['Thank you! Gifts are lovely. The ethics board says I should say that.'], gift_dislike: ['sad|Hm. I will accept this politely and then eat my feelings.'], gift_hate: ['surprised|That... is certainly something. Please, take it away before the press arrives.'],
    greet: ['Misa!', 'Good day, citizen!'],
  },
  events: [
    { id: 'mayor_h2', hearts: 2, map: 'town', when: 'time>=10:00&time<17:00', script: () => sc('mayor', "happy|Misa, walk with me. I do a tour of town problems every Tuesday. It is mostly pointing.", "@She leads you past the noticeboard, the fountain and a very wobbly bench.", "This bench wobbles. This one squeaks. This one has a name: Gerald.",
      ch('What do you suggest?', ['Put it in the suggestion box', "happy|Of course! That is exactly the system. You are a natural.", 20], ['Fix the wobbly one first', "happy|Practical! I like practical. I will send a carpenter.", 25], ['Name them all', "surprised|Name them all? ...Oh, that might actually work. Gerald would be thrilled.", 15]),
      "happy|Thank you for walking with me. Few people do. Most people run when they see the clipboard.") },
    { id: 'mayor_h4', hearts: 4, map: 'town', when: 'time>=10:00&time<18:00', script: () => sc('mayor', "sad|Misa... can I admit something? I almost retired this year.", "I thought the town had stopped needing me. Then you donated to a bus line and I realised it was the town asking for a better me.",
      ch('How do you answer?', ["The town still needs you", "happy|That is the kindest thing anyone has said to a tired old mayor. I will stay another term. Or two.", 30], ["Then let us build things together", "happy|Together. Yes. I will draft a plan. In pencil. With heart.", 30], ["Maybe rest a little", "happy|Wise girl. I will take a long weekend. The town will survive. I will leave Gerald in charge.", 20]),
      { t: 'flag', k: 'tp_mayor_stays', v: true }, "happy|Here. A key to the council cupboard. Do not tell anyone. There are only biscuits in there.") },
  ],
});
register('talkHook', 'tp_mayor_intro', { npc: 'mayor', priority: 30, when: '!flag:tp_council_intro', steps: () => sc('mayor', { t: 'flag', k: 'tp_council_intro', v: true },
  "happy|Misa! I have been hoping to meet you. Grandma Hana says you are good with a bucket and a plan.", "This town can grow, but it needs neighbours who care. The Town Council app lists projects: a bus line, a garden, a library wing and more.",
  "Donate coins, earn the town's trust by helping out, and builders will start work. Then comes the ribbon. I love the ribbon.", "happy|Open the podium by the noticeboard or the app on your phone anytime. Welcome to the council, honorary member Misa.") });
register('talkHook', 'tp_mayor_ready', { npc: 'mayor', priority: 28, when: (g) => PROJECTS.some((q) => projDone(g, q.id) && !PS(g, q.id).cut),
  steps: (g) => { const p = PROJECTS.find((q) => projDone(g, q.id) && !PS(g, q.id).cut); return sc('mayor', `happy|The ${p.name} is finished and waiting for you! Go and cut the ribbon, any day between 8 and 7.`); } });

features('Town Growth', [
  'Town Council app and a podium by the noticeboard: browse eight town projects, see costs, requirements and perks',
  'Council trust score built from the restored Community Hall, coins donated, friendships, evaluation lanterns and volunteering',
  'Fund projects with coins in chunks or all at once, or take a gentle interest-free council loan',
  'Projects build for days with two visible construction stages in the real maps (fence, then scaffolding), then reveal the finished build',
  'A ribbon-cutting ceremony with the Mayor for every finished project, with a coin gift, a Star Sticker and a mood lift',
  'Mayor Hoshino: a new resident of the square with a weekday patrol, lines for every season and weather, gifts and two heart events',
  'Council mail announces each project the moment Misa has enough trust to fund it',
]);
