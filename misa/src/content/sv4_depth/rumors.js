// Rumor Mill: ten gossip storylines that spread from person to person over days. Misa can spread or squash them.
// State: sv4d.rum = { list:{id:{day,holders:{npc:{day,hops}},status:'live'|'settled'|'squashed',by,told}}, next, seq }, sv4d.heard = { id:{from,day,hops} }
import { register, get } from '../../core/registry.js';
import { sc, ch } from '../social/util.js';
import { REL } from '../sv3_hearts/groups.js';
import { S, remember, nameOf, addRep, repTier, traitScore, talkBook, pickOf } from './state.js';
import { PEOPLE } from './people.js';

// v: versions by hops (0-1, 2-3, 4+). res: what the subject says once it settles / was squashed / was spread by Misa.
export const RUMORS = [
  { id: 'kai_ramen', subject: 'kai', source: 'sachiko', kind: 'funny', title: 'Twelve Bowls',
    v: [`Kai ate twelve bowls of ramen at the cart yesterday.`, `Kai ate the whole ramen cart. The cart man is fine, apparently.`, `Kai is banned from every ramen cart in the bay for life.`],
    res: [`happy|Okay, it was SEVEN bowls. But the legend is better! I'm not correcting anyone!`, `happy|You told them it was six? It was seven. But thanks. My honour is intact. Barely.`, `happy|Everyone's asking for my autograph at the ramen cart! I signed a napkin! A napkin!`] },
  { id: 'rina_poems', subject: 'rina', source: 'theo', kind: 'bad', title: 'The Secret Poems',
    v: [`Someone saw Rina writing poems in the music room.`, `Rina writes love poems about a boy in 2-B. Nobody knows who.`, `Rina wrote a poem about every single person in school. Mean ones.`],
    res: [`neutral|I write short verse. As a discipline. If anyone has a view, they may submit it in writing.`, `neutral|You put out the fire before it reached the planner. ...I owe you a favour. A small, well-defined one.`, `angry|Somebody has been spreading my verses. Aoki. Was it you? ...No. Of course not. Never mind.`] },
  { id: 'theo_mural', subject: 'theo', source: 'jun', kind: 'good', title: 'The Midnight Mural',
    v: [`Someone painted a new patch of the harbour mural overnight.`, `Theo painted the whole harbour mural by moonlight. Fully.`, `Theo is a famous painter in disguise and the mural is worth a fortune.`],
    res: [`neutral|It was one corner. And the moon was bright. Don't make it a legend. ...Fine, a small one.`, `neutral|Thanks for settling it down. A mural is a mural. Not a mystery.`, `happy|Two people asked me to paint their shutters. I said yes to one. You started this. Thanks.`] },
  { id: 'hina_gerald', subject: 'hina', source: 'kai', kind: 'funny', title: 'Gerald Escapes',
    v: [`One of Hina's school goldfish is missing from the tank.`, `All six Geralds escaped through a drain and formed a fish republic.`, `Hina has been banned from the pond after a goldfish uprising.`],
    res: [`happy|Gerald the Second was behind the filter. He was hiding. He is a drama fish.`, `happy|Thanks for telling them they were all fine. They are. They are TOO fine. They're rude.`, `happy|Everyone is bringing me goldfish snacks now! Please keep rumour-ing! The fish are thriving!`] },
  { id: 'tobias_bell', subject: 'tobias', source: 'pip', kind: 'bad', title: 'The Silent Bell',
    v: [`Mr. Wren is going to stop the clock tower bell for good.`, `The clock tower is being sold and the bell will be melted down.`, `Tobias is leaving town and taking the bell with him.`],
    res: [`neutral|The bell is being serviced. For a day. Hmph. Not sold. Not melted. Not even moved.`, `happy|You told them it's only a repair. Good. A town that panics about bells has too much time.`, `angry|WHO started this? A bell is not a rumour. I will ring it at them.`] },
  { id: 'fujita_comet', subject: 'fujita', source: 'ogawa', kind: 'good', title: 'A Comet With Her Name',
    v: [`Ms. Fujita might have spotted a new comet.`, `A comet is going to be named after Ms. Fujita.`, `Ms. Fujita has discovered a comet and will be on the news.`],
    res: [`neutral|It's a faint smudge. I need a second observation. Please don't tell the papers. They'll misspell it.`, `neutral|Thank you for holding the expectations down. Science thanks you. So does my heart rate.`, `happy|I didn't discover a comet. But I discovered that thirteen students want to stargaze. That's better.`] },
  { id: 'goro_pumpkin', subject: 'goro', source: 'sachiko', kind: 'funny', title: 'The Missing Pumpkin',
    v: [`Mr. Hayashi's prize pumpkin has gone missing.`, `Someone stole Goro's pumpkin, and Daifuku was seen at the scene.`, `Goro has put a bounty on the pumpkin thief.`],
    res: [`angry|Daifuku BURIED it. In the compost. Like a treasure. I'll have words. With a biscuit.`, `neutral|Thank you for telling them it was only the dog. A man has his pride and a pumpkin has its dignity.`, `neutral|Half the lane came to look for it. We found it. Daifuku wagged. Everyone ate pumpkin cake. Hmph. Fine.`] },
  { id: 'jun_treasure', subject: 'jun', source: 'goro', kind: 'funny', title: 'The Treasure Map',
    v: [`Captain Jun keeps an old treasure map in his tackle box.`, `Captain Jun found a pirate chest in the cave and hid it.`, `Captain Jun is a retired pirate and the Sayori is full of gold.`],
    res: [`happy|It's a map of the best fishing spots. X marks the bream. Arr. No treasure. Ha! Kids came asking all week.`, `happy|Ye set them right, kid. Though I enjoyed being a pirate for a day.`, `happy|The harbour kids brought spades! Spades! Dug up half the sand! Best week ever!`] },
  { id: 'kiko_ghost', subject: 'kiko', source: 'hina', kind: 'funny', title: 'The Shrine Ghost',
    v: [`Kiko talks to somebody in the empty shrine at night.`, `There is a friendly ghost at Hoshi Hill who plays video games with Kiko.`, `Kiko has a ghost best friend who beats her at Star Knight III.`],
    res: [`neutral|I talk to the wind. And to the cabinet. Neither answers. But the wind has better timing.`, `neutral|Thank you for explaining the wind. I'd rather keep the ghost for atmosphere, but fair.`, `happy|Visitors keep asking for my ghost. I told them he's shy. He beat me twice. Great for business.`] },
  { id: 'mika_closing', subject: 'mika', source: 'sachiko', kind: 'bad', title: 'Kumo Is Closing',
    v: [`Someone says Cafe Kumo might close this winter.`, `Cafe Kumo is closing next month and becoming a car park.`, `Mika has sold the cafe and is moving abroad.`],
    res: [`neutral|I'm repainting! The scaffolding made people nervous. Cafe Kumo isn't going anywhere. Neither am I.`, `happy|You told them the truth! People came by with flowers! Flowers! For a repaint!`, `angry|Everyone's asking for last cups! I'm selling them second ones! But I'm a little cross!`] },
];
const BY = Object.fromEntries(RUMORS.map((r) => [r.id, r]));
export const rumorDef = (id) => BY[id];
export const GOSSIPERS = ['pip', 'sachiko', 'hina', 'kai', 'haru'];

const pairs = REL ? REL.map((r) => [r[0], r[1]]) : [];
export function neighbors(id) {
  const out = new Set();
  for (const [a, b] of pairs) { if (a === id) out.add(b); if (b === id) out.add(a); }
  if (id !== 'pip') out.add('pip'); if (id !== 'sachiko') out.add('sachiko');
  return [...out].filter((x) => get('npc', x));
}
const rum = (g) => S(g).rum;
export const versionFor = (def, hops) => def.v[hops <= 1 ? 0 : hops <= 3 ? 1 : 2];
export function startRumor(g, id) {
  const def = BY[id], r = rum(g);
  if (!def || r.list[id]) return null;
  r.list[id] = { day: g.day, holders: { [def.source]: { day: g.day, hops: 0 } }, status: 'live', by: null, told: false, tried: 0 };
  return r.list[id];
}
export const activeRumors = (g) => Object.entries(rum(g).list).filter(([, st]) => st.status === 'live');
export function spreadDay(g) {
  for (const [id, st] of activeRumors(g)) {
    const def = BY[id];
    for (const [h, hs] of Object.entries({ ...st.holders })) {
      if (hs.day >= g.day) continue;
      for (const n of neighbors(h)) {
        if (st.holders[n]) continue;
        const p = 0.35 + (GOSSIPERS.includes(h) ? 0.2 : 0) + (st.by === 'spread' ? 0.2 : 0);
        if (g.rngFor(`sv4drum:${id}:${h}:${n}`)() < p) st.holders[n] = { day: g.day, hops: hs.hops + 1 };
      }
    }
    const sub = st.holders[def.subject];
    if ((sub && g.day - sub.day >= 1) || g.day - st.day >= 14) st.status = 'settled';
  }
}
export function maybeSeed(g) {
  const r = rum(g);
  if (g.day < 6 || g.day < r.next || activeRumors(g).length >= 2) return null;
  for (let i = 0; i < RUMORS.length; i++) {
    const def = RUMORS[(r.seq + i) % RUMORS.length];
    if (r.list[def.id]) continue;
    if (!g.state.seen['met:' + def.source] || !g.state.seen['met:' + def.subject] || !get('npc', def.source)) continue;
    r.seq = (r.seq + i + 1) % RUMORS.length; r.next = g.day + 5 + Math.floor(g.rngFor('sv4drumnext')() * 4);
    startRumor(g, def.id);
    return def.id;
  }
  return null;
}
// a rumor this person can tell Misa today (they learned it before today and she has not heard it yet)
export function tellable(g, id) {
  for (const [rid, st] of activeRumors(g)) {
    const def = BY[rid], h = st.holders[id];
    if (h && h.day < g.day && def.subject !== id && !S(g).heard[rid]) return { def, st, hops: h.hops };
  }
  return null;
}
export function tellSteps(g, id, t) {
  const P = PEOPLE[id] || {}, line = (P.gossip || `neutral|Misa, did you hear?`).replace(/^(\w+)\|/, '');
  return sc(id, { t: 'call', fn: (gg) => { talkBook(gg, id); S(gg).heard[t.def.id] = { from: id, day: gg.day, hops: t.hops }; gg.stat('sv4dRumorsHeard'); } },
    line, `neutral|${versionFor(t.def, t.hops)}`, `@You file it away. Check the Rumor Mill app to spread it or put it to bed.`);
}
export const heardList = (g) => Object.entries(S(g).heard).map(([id, h]) => ({ def: BY[id], h, st: rum(g).list[id] })).filter((x) => x.def && x.st);

// ---------- actions ----------
const KIND_SUBJECT = { good: 25, funny: 8, bad: -40 };
export function spreadRumor(g, id) {
  const st = rum(g).list[id], def = BY[id];
  if (!st || !S(g).heard[id]) return { ok: false, line: 'You have not heard that one yet.' };
  if (st.status !== 'live') return { ok: false, line: 'That story is already over.' };
  if (st.by === 'spread') return { ok: false, line: 'You already spread that one.' };
  st.by = 'spread';
  const hops = (S(g).heard[id].hops || 0) + 1;
  let n = 0;
  for (const t of [...GOSSIPERS, ...Object.keys(g.state.friends)]) {
    if (n >= 2) break;
    if (!st.holders[t] && t !== def.subject && get('npc', t) && !get('npc', t).hidden) { st.holders[t] = { day: g.day, hops }; n++; }
  }
  g.addFriend(def.subject, KIND_SUBJECT[def.kind]);
  if (def.kind === 'good') { addRep(g, 'charming', 1); addRep(g, 'helpful', 0.5); }
  if (def.kind === 'funny') addRep(g, 'quirky', 1.5);
  if (def.kind === 'bad') { addRep(g, 'charming', -2); addRep(g, 'dependable', -1); remember(g, def.subject, 'rumor', { id, bad: true }); }
  g.stat('sv4dRumorsSpread');
  return { ok: true, line: def.kind === 'bad' ? 'You spread it. It was not kind.' : 'You passed it along. People smile.' };
}
export function squashChance(g) { return Math.min(0.95, 0.35 + 0.12 * repTier(g, 'charming') + 0.12 * repTier(g, 'dependable') + 0.03 * Math.min(6, traitScore(g, 'calm'))); }
export function squashRumor(g, id) {
  const st = rum(g).list[id], def = BY[id];
  if (!st || !S(g).heard[id]) return { ok: false, line: 'You have not heard that one yet.' };
  if (st.status !== 'live') return { ok: false, line: 'That story is already over.' };
  if (st.tried === g.day) return { ok: false, line: 'You already tried today.' };
  st.tried = g.day;
  if (g.rngFor(`sv4dsq:${id}:${g.day}`)() < squashChance(g)) {
    st.status = 'squashed'; st.holders = { [def.subject]: st.holders[def.subject] || { day: g.day, hops: 0 } };
    g.addFriend(def.subject, 25); addRep(g, 'dependable', 1.5); addRep(g, 'helpful', 1);
    g.stat('sv4dRumorsSquashed');
    return { ok: true, line: 'You set the record straight. The rumor fades.' };
  }
  addRep(g, 'dependable', 0.3);
  return { ok: false, line: 'Too late: the word is already around. You tried.' };
}
export function outcomeOf(st) { return st.status === 'squashed' ? 2 - 1 : st.by === 'spread' ? 2 : 0; } // index in res: 0 settled, 1 squashed, 2 spread

// resolution: the subject reacts once the story is over
for (const def of RUMORS) {
  register('talkHook', 'sv4d_rumor_res_' + def.id, {
    npc: def.subject, priority: 5,
    when: (g) => { const st = S(g).rum.list[def.id]; return !!st && st.status !== 'live' && !st.told && !!g.state.seen['met:' + def.subject]; },
    steps: (g) => {
      const st = S(g).rum.list[def.id];
      if (!st) return sc(def.subject, `neutral|...`);
      return sc(def.subject, { t: 'call', fn: (gg) => { st.told = true; talkBook(gg, def.subject); remember(gg, def.subject, 'rumor', { id: def.id, out: outcomeOf(st) }); } },
        `neutral|Misa, about that "${def.title}" business...`, def.res[outcomeOf(st)], `@The ${def.title} story is closed.`);
    },
  });
}
register('system', 'sv4dRumors', {
  init(game) { game.bus.on('dayStart', () => { spreadDay(game); maybeSeed(game); }); },
});
