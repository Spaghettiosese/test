// Dates (sv4_romance): ten date kinds on existing places and minigames. Plan one from the Romance phone app (place, time),
// your date walks to the spot and waits; talk to them to start. Each kind has two choice rounds (the date "minigame": do
// they like it?), sometimes a real minigame, and a scene in the candidate's own voice. Weekly limit: 2 dates.
// Console: __misa.sv4r.date('kai','beach')  (plays the date now)   __misa.sv4r.plan('kai','beach')   (plans one for the next free slot)
import { register, get } from '../../core/registry.js';
import { sc, ch, OVERRIDES, clock12, mood, time, iff, holidayOn, placeName } from '../social/util.js';
import { availability, SLOTS } from '../social/hangouts.js';
import { S, API, A, call, pick, noteSeen, addAff, stageOf, aff, firstName, nameOf, isCand, weekOf, MAX_WEEK_DATES, datesThisWeek } from './core.js';
import { voiceOf } from './voices.js';

const T = (h, m = 0) => h * 60 + m;
const raining = (g) => ['rain', 'storm'].includes(g.state.weather);
// round option: [text, tag, flavour narration]
export const KINDS = {
  cafe: { name: 'Cafe study date', map: 'cafe', spot: 'table_3', slots: [T(10), T(13), T(16), T(17, 30)], intro: '@Cafe Kumo hums with kettle steam and quiet music. You claim the corner table and spread out your books.',
    rounds: [['You both open your books. How do you start?', [['Quiz each other with flash cards', 'study', 'You trade questions until the page is full of ticks.'], ['Share a slice of cake first', 'sweet', 'One slice, two forks. The books wait.'], ['Doodle in the margins', 'art', 'A tiny cat appears beside the vocabulary list.']]],
      ['The cafe gets busy.', [['Move to the quiet window seat', 'quiet', 'The window seat is empty. Rain ticks against the glass, or maybe it is just the clock.'], ['Turn the vocab list into a game', 'games', 'Points, penalties, a very serious scoreboard on a napkin.'], ['Order the seasonal drink to share', 'cozy', 'Two straws. The drink is pink and far too big.']]]] },
  library: { name: 'Library date', map: 'library', spot: 'table_2', slots: [T(10), T(13), T(16)], intro: '@The library smells of paper and floor polish. Afternoon light lies in long stripes across the tables.',
    rounds: [['Where do you wander first?', [['The mystery stacks', 'books', 'Spines in rows, each one a closed door.'], ['The museum corner', 'art', 'Old maps and a glass case of shells.'], ['The reading nook with cushions', 'cozy', 'Two cushions, one blanket, a very big window.']]],
      ['You both reach for the same book.', [['Read it aloud, quietly', 'quiet', 'Your voice drops to a whisper and theirs follows.'], ['Race to finish a chapter', 'games', 'Pages flip faster and faster. A librarian clears her throat.'], ['Sketch what the cover should look like', 'art', 'Two terrible drawings, both treasured.']]]] },
  arcade: { name: 'Arcade date', map: 'mart', spot: 'arcade', slots: [T(13), T(16), T(17, 30), T(19)], mini: 'sv2_mochi_kart', intro: '@The corner cabinet at Sunny Mart blinks pink and blue. A small pile of coins sits ready.',
    rounds: [['Which cabinet first?', [['Mochi Kart, head to head', 'games', 'Two seats, one steering wheel, zero chill.'], ['The claw machine', 'luck', 'The claw hovers, wobbles, and drops a plush at the last second.'], ['The rhythm cabinet', 'music', 'Arrows scroll up the screen. You somehow stay in time together.']]]] },
  beach: { name: 'Sunset beach walk', map: 'beach', spot: 'shore', slots: [T(17, 30), T(19)], intro: '@Shell Beach glows amber. The tide is out and the wet sand holds the whole sky like a mirror.',
    rounds: [['The sky turns orange.', [['Skip stones along the waterline', 'active', 'Plink, plink, plink. A personal best of five.'], ['Hunt for sea glass and shells', 'sea', 'A blue shard, a spiral shell, a tiny crab lid.'], ['Sit together and watch', 'calm', 'The sun slips lower. Neither of you speaks.']]],
      ['The tide pulls out.', [['Write your names in the sand', 'funny', 'The first wave arrives early and rearranges them into nonsense.'], ['Wade through the tide pools', 'nature', 'A hermit crab, a starfish, a very surprised anemone.'], ['Hum a song together', 'music', 'Off-key, then not, then gently in tune.']]]] },
  roof: { name: 'Stargazing on the roof', map: 'school_roof', spot: 'telescope', slots: [T(19)], mini: 'sv4_star_trace', intro: '@The school roof is dark and still. The telescope waits under a canvas cover, and the town lights below look like a second sky.',
    rounds: [['The telescope is warm from the day.', [['Find constellations by the book', 'study', 'You trace the Lantern and the Ladle with your fingers.'], ['Make up your own constellations', 'art', 'The Sleepy Cat. The Dropped Onigiri. The Big Mochi.'], ['Lie back and listen to the night', 'quiet', 'Crickets, a far-off bell, and your own breathing.']]]] },
  stalls: { name: 'Festival stall crawl', map: 'town', spot: 'market_1', slots: [T(10), T(13), T(16), T(17, 30)], intro: '@Paper lanterns sway over the stalls. Every corner smells of grilled corn, sweet bean and sugar.',
    rounds: [['Which stall first?', [['Takoyaki, extra sauce', 'food', 'Eight little octopus balls and a steamy cloud.'], ['The goldfish scoop game', 'games', 'The paper survives two seconds. Then none.'], ['Candied apples to share', 'sweet', 'A red shell of sugar that cracks like glass.']]],
      ['The crowd squeezes close.', [['Hold the bag high and laugh', 'funny', 'You carry the snacks like a trophy through the crowd.'], ['Duck into a quiet side lane', 'calm', 'The noise drops to a murmur. Lanterns bob overhead.'], ['Follow the music to the stage', 'music', 'A drum, a flute, and hands clapping on every offbeat.']]]] },
  bike: { name: 'Bike ride', map: 'park', spot: 'lawn', slots: [T(10), T(13), T(16), T(17, 30)], bike: true, intro: '@The path through Sakura Park is smooth and sun-dappled. Bells ring, tyres hum, and the whole afternoon is wide open.',
    rounds: [['Which way do you ride?', [['The coast road', 'sea', 'Salt wind, gulls, and the harbour sliding past on your left.'], ['The park loop', 'nature', 'Trees, ducks, a bench with a sleeping cat.'], ['The steep hill, for the view', 'active', 'You puff up the hill. The whole bay opens below you.']]],
      ['You stop to catch your breath.', [['Share onigiri on the grass', 'food', 'Salmon in the middle, seaweed on the outside, crumbs everywhere.'], ['Race to the next lamp post', 'games', 'Neck and neck, wheel to wheel, both laughing too hard to pedal.'], ['Coast slowly and talk', 'calm', 'No hurry. The wheels tick like a clock that does not count.']]]] },
  fishing: { name: 'Fishing at the pier', map: 'harbour', spot: 'pier_end', slots: [T(10), T(13), T(16), T(17, 30)], intro: '@The harbour is quiet. Gulls sit in a row on the rail, and the water ripples gently around the posts.',
    rounds: [['What do you use for bait?', [['Whatever Captain Jun recommends', 'sea', 'A small tin of something that moves. Do not ask.'], ['A fancy lure you make together', 'art', 'Feathers, thread, and a bead that looks suspiciously like a star.'], ['Bread crusts. Because tradition.', 'funny', 'The gulls take a very strong interest.']]],
      ['The line goes slack.', [['Wait patiently', 'calm', 'The float bobs, and bobs, and does absolutely nothing. It is lovely.'], ['Trade stories while you wait', 'funny', 'You swap embarrassing facts. The float is forgotten.'], ['Cast again and again', 'active', 'Splash, reel, splash, reel. Your arms ache pleasantly.']]]] },
  harbour: { name: 'Harbour aquarium visit', map: 'harbour', spot: 'dock', slots: [T(10), T(13), T(16)], intro: '@Behind the fish market, a row of glass tanks glows blue. Rays, jellies and one grumpy grouper drift past in the dim light.',
    rounds: [['The glass tanks glow.', [['Name every fish you pass', 'funny', 'Gerald. Gerald the Second. Sir Wobbles.'], ['Read the little labels', 'study', 'Habitat, diet, depth. The grouper is apparently shy.'], ['Press close to the glass and watch', 'nature', 'A jellyfish blooms and folds, blooms and folds.']]],
      ['A big ray glides by.', [['Sketch it in your notebook', 'art', 'Three wings and a long tail. It looks like a kite.'], ['Whisper so it stays', 'quiet', 'The ray hovers near the glass, as if it is listening.'], ['Count its spots', 'games', 'Twenty-two. Or twenty-three. You argue happily.']]]] },
  rain: { name: 'Rainy day umbrella walk', map: 'town', spot: 'fountain', slots: [T(10), T(13), T(16), T(17, 30), T(19)], mini: 'sv4_umbrella', intro: '@Rain drums the town square. Puddles shiver round the fountain, and one big umbrella suddenly feels like a very small room.',
    rounds: [['One umbrella, two people.', [['Walk close and keep step', 'calm', 'Left, right, left. Your elbows touch every other step.'], ['Splash through the puddles', 'active', 'Your socks regret everything. Your grin does not.'], ['Sing a tune under the rain', 'music', 'The umbrella is your stage, the rain is your drum.']]],
      ['The cafe awning ahead.', [['Duck under and share hot cocoa', 'cozy', 'Two mugs, steam on your faces, drops dripping off the edge of the awning.'], ['Race there', 'games', 'You arrive soaked, breathless and pleased with yourselves.'], ['Stand still and listen to the rain', 'quiet', 'Rain on cloth, rain on stone, rain on the whole world.']]]] },
};
export const KIND_IDS = Object.keys(KINDS);
const okDay = { festival: null };
export function okAt(g, kind, day, at) {
  if (kind === 'stalls') return !!holidayOn(day);
  if (kind === 'rain') return day === g.day && raining(g);
  return true;
}
const needText = { stalls: 'festival days only', rain: 'rainy days only', roof: 'evenings only', beach: 'evenings only' };
export const needNote = (kind) => needText[kind] || '';

// ---------- planning ----------
export function slotsFor(g, kind) {
  const K = KINDS[kind], out = [];
  for (const d of [0, 1]) for (const at of K.slots) {
    const day = g.day + d;
    if (day === g.day && at < g.minutes + 60) continue;
    if (okAt(g, kind, day, at)) out.push({ day, at });
  }
  return out.slice(0, 7);
}
export function canDate(g, id) {
  if (!isCand(id)) return 'nobody';
  const s = S(g), st = stageOf(g, id);
  if (st === -1) return 'friends';
  if (s.partner && s.partner !== id) return 'taken';
  if (st < 1 && s.partner !== id) return 'early';
  if (datesThisWeek(g) + (s.plan && !s.plan.done ? 1 : 0) >= MAX_WEEK_DATES) return 'limit';
  return null;
}
const ACCEPT = {
  kai: 'happy|A date! A real one! PLACE, WHEN. I will be early. Probably. Okay, definitely.', suzu: 'Oh. A date. Yes. PLACE, WHEN. I will bring a book. In case I am nervous. I will be nervous.',
  rina: 'Hmph. A date. Fine. PLACE, WHEN. I will clear my schedule. It is already clear. I cleared it just now.', theo: 'happy|Yeah. Okay. PLACE, WHEN. I will be there. I will not forget. I wrote it on my hand.',
  hina: 'happy|YES! PLACE, WHEN! I will wear my best overalls! The clean ones! There are clean ones!',
};
export function planDate(g, id, kind, day, at) {
  const why = canDate(g, id);
  if (why) return { ok: false, line: why === 'limit' ? 'happy|I would love to, but let us give the week a little breathing room. Next week?' : why === 'friends' ? 'happy|I would rather keep things as friends for now. A hangout, maybe?' : 'neutral|Maybe another time.' };
  const bad = availability(g, id, day, at);
  if (bad) return { ok: false, line: bad };
  S(g).plan = { npc: id, kind, day, at, done: false };
  const when = `${day === g.day ? 'today' : 'tomorrow'} at ${clock12(at)}`;
  return { ok: true, line: (ACCEPT[id] || 'happy|I would love to. PLACE, WHEN. See you there!').replace('PLACE', KINDS[kind].name).replace('WHEN', when) };
}
export const activePlan = (g) => { const p = S(g).plan; return p && !p.done && p.day >= g.day ? p : null; };
const inWindow = (g, p) => p.day === g.day && g.minutes >= p.at - 30 && g.minutes <= p.at + 150;

OVERRIDES.push((g, id) => {
  const p = activePlan(g);
  if (!p || p.npc !== id || !inWindow(g, p)) return undefined;
  const K = KINDS[p.kind];
  return { map: K.map, spot: K.spot, key: 'date' };
});

// ---------- the date scene ----------
const ptsFor = (v, tag) => (v.likes.includes(tag) ? 3 : v.dislikes.includes(tag) ? 0 : 1);
export const maxPts = (K) => 3 * K.rounds.length + (K.mini ? 3 : 0) + (K.bike ? 1 : 0);
export const tierOf = (ratio) => (ratio >= 0.65 ? 'great' : ratio >= 0.33 ? 'good' : 'sweet');
const GAIN = { great: 45, good: 28, sweet: 14 }, FRIEND = { great: 25, good: 15, sweet: 8 };
const addPts = (n) => call((g) => { S(g).cur.pts += n; });

export function dateSteps(g, id, kind, plan) {
  const K = KINDS[kind], v = voiceOf(id), L = v.dates[kind] || v.dates.cafe, nm = firstName(id);
  const roundStep = (r, ri) => ch(r[0], ...r[1].map(([text, tag, flavour], oi) => {
    const p = ptsFor(v, tag);
    return [text, `@${flavour}`, pick(v.react[p], ri + oi), addPts(p)];
  }));
  const steps = sc(id,
    { t: 'soc_arrive', who: id }, { t: 'soc_face', who: id },
    call((gg) => { const s = gg.state.sv4r; s.cur = { pts: 0, kind, npc: id, mini: 0 }; if (plan) { const p = s.plan; if (p && p.npc === id) p.done = true; } }),
    '*heart', K.intro, L[0],
    ...K.rounds.map(roundStep),
    K.mini ? { t: 'minigame', id: K.mini, opts: {}, done: (gg, r) => { const sc0 = r && !r.quit ? (r.score || 0) : 0.4; gg.state.sv4r.cur.pts += Math.round(sc0 * 3); gg.state.sv4r.cur.mini = sc0; } } : null,
    K.bike ? call((gg) => { const b = gg.state.sv2 && gg.state.sv2.bike; if (b && b.owned) { gg.state.sv4r.cur.pts += 1; gg.toast('Riding your own bike makes it easier', 'i_star'); } }) : null,
    iff((gg) => tierOf(gg.state.sv4r.cur.pts / maxPts(K)) === 'great', sc(id, L[1], ...v.bye.great),
      iff((gg) => tierOf(gg.state.sv4r.cur.pts / maxPts(K)) === 'good', sc(id, L[2], ...v.bye.good), sc(id, L[2], ...v.bye.low))),
    call((gg) => finishDate(gg, id, kind)),
    mood(6), time(90), { t: 'soc_leave', who: id });
  return steps;
}
export function finishDate(g, id, kind) {
  const s = S(g), K = KINDS[kind], ratio = Math.min(1, s.cur.pts / maxPts(K)), tier = tierOf(ratio);
  addAff(g, id, GAIN[tier]); g.addFriend(id, FRIEND[tier]); g.addMood(8);
  s.journal.push({ day: g.day, npc: id, kind, score: Math.round(ratio * 100), tier });
  if (s.journal.length > 80) s.journal.shift();
  s.datesWith[id] = (s.datesWith[id] || 0) + 1; s.weekDates[weekOf(g)] = (s.weekDates[weekOf(g)] || 0) + 1;
  g.stat('dates'); g.stat('hangouts');
  if (tier === 'great') g.stat('greatDates');
  noteSeen(g, `date_${id}_${kind}`, `${K.name} with ${firstName(id)}`, id);
  g.bus.emit('dateDone', { npc: id, kind, score: Math.round(ratio * 100), tier });
  g.toast(`Date: ${tier === 'great' ? 'wonderful' : tier === 'good' ? 'lovely' : 'sweet'}! (${Math.round(ratio * 100)}%)`, 'heart');
}

// ---------- hooks, reminders ----------
export function installDateHooks() {
  for (const id of ['kai', 'suzu', 'rina', 'theo', 'hina', 'aoi', 'haru']) {
    if (!get('npc', id)) continue;
    register('talkHook', 'sv4r_date_' + id, {
      npc: id, priority: 46,
      when: (g) => { const p = activePlan(g); return !!p && p.npc === id && inWindow(g, p) && !!g.world && !!g.world.map && g.world.map.id === KINDS[p.kind].map; },
      steps: (g) => { const p = activePlan(g); return p && p.npc === id ? dateSteps(g, id, p.kind, p) : sc(id, 'happy|Hi Misa! Shall we plan something together? Use the Romance app on your phone.'); },
    });
  }
}
register('system', 'sv4Dates', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = S(game), p = s.plan;
      if (p && !p.done && p.day < game.day) {
        game.mail(`sv4r_missed_${p.npc}_${p.day}`, nameOf(p.npc), 'No worries about yesterday, Misa. Things happen. Let us pick another day.');
        s.plan = null;
      }
      if (p && !p.done && p.day === game.day) game.toast(`Date today: ${firstName(p.npc)}, ${KINDS[p.kind].name}, ${clock12(p.at)}`, 'heart');
    });
    game.bus.on('hour', ({ h }) => { const p = activePlan(game); if (p && p.day === game.day && Math.floor(p.at / 60) === h + 1) game.toast(`Soon: date with ${firstName(p.npc)} (${clock12(p.at)})`, 'heart'); });
  },
});
API.date = (g, id, kind) => g.run(dateSteps(g, id, kind || 'cafe', null));
API.plan = (g, id, kind) => { const k = kind || 'cafe'; const sl = slotsFor(g, k)[0]; return sl ? planDate(g, id, k, sl.day, sl.at) : { ok: false }; };
export { SLOTS, clock12, placeName };
