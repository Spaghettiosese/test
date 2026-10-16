// School years 1-3 (+ the final spring term): the April rotation (class shuffle, homeroom beat, entrance ceremony for three new
// kohai), Year 2 electives, rising exam difficulty, class representative elections, club vice-captain / captain with duties and a
// showcase, the Year 2 school trip, a Culture Festival that grows each year, year-end class photos and "last time" scenes.
// Hooks into the school pack without editing it: wraps game.minigame (difficulty), game.run (class label 2-B -> N-B), mutates the
// exported TIMETABLE / SUBJECTS for electives, and listens to school bus events.
import { register, get, features } from '../../core/registry.js';
import { seasonOf, dateOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { SUBJECTS, SUBJECT_IDS, TIMETABLE, CLUBS, SCHOOL_MAPS } from '../school/data.js';
import { spotPos } from '../../systems/festivals.js';
import { Y, say, N, call, fade, bd, wait, choice, ask, runP, defEvent, tick, gradeOf, gradeName, idle, st, stickers, giveOr, inSeasonWin, yr, avg, nm, first, FRIENDS, KOHAI_GROUPS } from './util.js';
import { enrol, enrolledKohai, bindGame, SPEC } from './kohai.js';

// ---------------------------------------------------------------- electives (mutating the school pack's exported tables)
SUBJECTS.business = { name: 'Business', game: 'class_math', teacher: 'Mr. Kurosawa', color: K.butter, topic: 'ledgers, margins and shop maths' };
const ORIG_TT = TIMETABLE.map((r) => [...r]), ORIG_IDS = [...SUBJECT_IDS];
export const ELECTIVES = { art: 'Art', music: 'Music', science: 'Science', business: 'Business' };
export function applyTimetable(g) {
  TIMETABLE.forEach((r, i) => { r[0] = ORIG_TT[i][0]; r[1] = ORIG_TT[i][1]; });
  const e = Y(g).elective;
  if (e && gradeOf(g) >= 2) { TIMETABLE[2][1] = e; TIMETABLE[3][1] = e; }
  SUBJECT_IDS.length = 0; SUBJECT_IDS.push(...ORIG_IDS);
  if (e === 'business' && gradeOf(g) >= 2) SUBJECT_IDS.push('business');
}
export function setElective(g, id) { if (!ELECTIVES[id]) return false; Y(g).elective = id; applyTimetable(g); g.stat('electivesChosen'); g.bus.emit('svElective', { id }); return true; }

// ---------------------------------------------------------------- difficulty tiers
export const TIERS = ['', 'Tier 1: Basics', 'Tier 2: Standard', 'Tier 3: Entrance prep'];
export function tierDiff(g, opts) {
  const lv = g.skillLevel ? g.skillLevel('study') : 0, grade = Math.max(1, gradeOf(g) || 3);
  return Math.max(0, Math.min(1, lv / 8 + (opts.exam ? 0.15 : 0) + 0.08 * (grade - 1)));
}

// ---------------------------------------------------------------- the class label rewrite (2-B -> 1-B / 3-B)
function fixSteps(steps, label) {
  if (!Array.isArray(steps)) return steps;
  return steps.map((s) => {
    if (!s || typeof s !== 'object') return s;
    let out = s;
    for (const k of ['text', 'prompt']) if (typeof s[k] === 'string' && s[k].includes('2-B')) out = { ...out, [k]: s[k].replace(/\b2-B\b/g, label) };
    if (Array.isArray(s.options)) out = { ...out, options: s.options.map((o) => (o && o.steps ? { ...o, steps: fixSteps(o.steps, label) } : o)) };
    return out;
  });
}

// ---------------------------------------------------------------- small helpers
const S = (g) => g.state.school;
const club = (g) => (S(g) && S(g).club) || null;
const clubName = (g) => (club(g) ? CLUBS[club(g)].name : 'club');
const lead = (g) => (club(g) ? CLUBS[club(g)].member : 'fujita');
const schoolDay = (g) => g.check('school');
export const nearSpot = (world, map, spot, r = 26) => {
  if (!world || !world.map || world.map.id !== map) return null;
  const p = spotPos(map, spot); if (!p) return null;
  const d = Math.hypot(world.player.x - p.x, world.player.y - 4 - p.y);
  return d < r ? { x: p.x, y: p.y, d } : null;
};
export const isRep = (g, y = yr(g)) => !!Y(g).rep[y] && Y(g).rep[y].won;

// ---------------------------------------------------------------- APRIL: class rotation, homeroom beat, entrance ceremony
const ROTATION = {
  2: { bd: 'hanami', head: 'April again. Pink petals line the school gate, and Misa walks through it as a second-year.',
    lines: [['fujita', 'happy', 'Class 2-B, take two! I drew the seating chart from a bucket. Do not blame me for the bucket.'], ['kai', 'happy', 'Same class again! The universe loves me. Or the bucket does.'], ['rina', 'neutral', '...You again. Good. I mean, fine. Whatever.'], ['suzu', 'happy', 'Theo is in 2-A this year. He promised to visit. Mostly to avoid his own class.']],
    beat: 'This is the year of choices. An elective, a club role, a class vote. A school trip too, if the weather is kind.' },
  3: { bd: 'hanami', head: 'The last April. The petals feel heavier now, and the gate looks smaller.',
    lines: [['fujita', 'neutral', 'Class 3-B. Your final year. It will go by faster than any of you believe.'], ['kai', 'surprised', 'Wait, final? As in last? As in no more curry bread fights?'], ['rina', 'neutral', 'Entrance exams. A path. Choices that matter. I have a binder for it. Do not touch the binder.'], ['hina', 'happy', 'I am going to catalogue every bug in this school before we leave. It is a bucket list. With bugs.']],
    beat: 'This year the question is no longer what you are good at. It is what you want to do next. Ms. Fujita will talk to each of you about it.' },
  4: { bd: 'hanami', head: 'Spring again, but this is the last term. The graduation ceremony is on Spring 28, and the whole school is quietly counting down.',
    lines: [['fujita', 'neutral', 'Four weeks, then. Four weeks and you will not be my students anymore. I will deny every tear.'], ['kai', 'sad', 'Do not say it like that. I just cleaned out my locker and found a sock from first year.'], ['suzu', 'neutral', 'I am writing a story about the whole class. The ending is blank. I will fill it in at the ceremony.']],
    beat: 'The entrance results come in this month, the last Sports Day is on the nineteenth, and on the twenty-eighth you walk out of the gate for good.' },
};
async function aprilScene(g, y) {
  const R = ROTATION[y]; if (!R) return;
  g.setFlag('sv3y_april_' + y);
  await runP(g, [fade(1, 0.8), bd(R.bd), fade(0, 0.8), N(R.head), ...R.lines.map(([w, m, t]) => say(w, m, t)), say('fujita', 'neutral', R.beat)]);
  if (y === 2) {
    const i = await ask(g, 'Which elective do you take?', ['Art (more painting, more Theo)', 'Music (the Wednesday choir)', 'Science (with Ms. Fujita)', 'Business (ledgers and margins)'], [say('fujita', 'neutral', 'Electives take over your Wednesday and Thursday afternoons. Choose with your heart. Or your future wallet.')]);
    const id = ['art', 'music', 'science', 'business'][i];
    setElective(g, id);
    await runP(g, [say('misa', 'happy', `${ELECTIVES[id]} it is!`), say('fujita', 'happy', 'Excellent choice. I will tell the teacher.')]);
  }
  if (y === 3) await runP(g, [say('fujita', 'neutral', 'Your elective carries over, but it is harder now. Exams use a tougher tier, so make friends with your study desk.'), call((gg) => gg.toast('Exam tier: Entrance prep', 'i_book'))]);
  // the entrance ceremony
  const ids = KOHAI_GROUPS[y] || [];
  if (ids.length) {
    await runP(g, [fade(1, 0.6), wait(0.5), fade(0, 0.6), N(y === 4 ? 'The entrance ceremony. Three new first-years file into the gym, one last time for Misa.' : 'The entrance ceremony. Three new first-years file into the gym, stiff in their brand new uniforms.'),
      ...ids.flatMap((id) => [say(id, id === 'kh_sota' || id === 'kh_emi' ? 'happy' : 'neutral', SPEC[id].l.fm[0].replace(/^[a-z]+\|/, ''))]),
      say('fujita', 'happy', 'Be kind to them, Misa. They will be watching how you walk through these halls.')]);
    enrol(g, y);
    await runP(g, [call((gg) => gg.toast(`${ids.map((i) => first(i)).join(', ')} enrolled`, 'heart')), say('misa', 'happy', 'Welcome to Hoshimori High, everyone. Come find me any time.')]);
  }
  if (!club(g)) await runP(g, [say('fujita', 'neutral', 'Have you joined a club yet? The notice board in the school halls has the sign-up list. Clubs are where kohai meet their senpai.')]);
  g.bus.emit('svYearStart', { year: y });
}
defEvent({ key: (g) => (yr(g) >= 2 && yr(g) <= 4 && seasonOf(g.day) === 'spring' && dateOf(g.day) <= 14 ? 'april' + yr(g) : null), run: (g, k) => aprilScene(g, +k.slice(5)) });

// ---------------------------------------------------------------- class representative elections (years 2 and 3)
export function electionResult(g, y, score) {
  const mates = ['kai', 'suzu', 'rina', 'theo', 'hina'], hearts = avg(mates.map((m) => g.hearts(m))), need = y === 2 ? 0.6 : 0.68;
  const total = score * 0.62 + (hearts / 10) * 0.38;
  return { total, need, won: total >= need };
}
async function election(g, y) {
  const lines = y === 2
    ? 'Time for the class vote. This year the candidates are Rina Hoshino, and... Misa Aoki, if she accepts.'
    : 'The last class rep election. The candidates: Rina Hoshino, Misa Aoki. As for who wins, the class will tell us.';
  await runP(g, [say('fujita', 'happy', lines)]);
  const i = await ask(g, 'Do you run?', ['Run for class rep', 'Nominate Rina instead']);
  if (i === 1) { Y(g).rep[y] = { won: false, ran: false }; g.addFriend('rina', 25); return runP(g, [say('rina', 'surprised', '...You are giving me the vote? Hmph. I will make sure you do not regret it.'), say('misa', 'happy', 'You would be great at it, Rina.')]); }
  await runP(g, [say('misa', 'neutral', 'Okay. Deep breath. I will write something from the heart.')]);
  const r = await g.minigame('sv3_speech', { tier: y });
  const res = electionResult(g, y, r.quit ? 0.4 : r.score);
  Y(g).rep[y] = { won: res.won, ran: true, score: Math.round((r.quit ? 0.4 : r.score) * 100) };
  g.bus.emit('svElection', { year: y, won: res.won }); g.stat('electionsRun');
  if (res.won) { g.stat('electionsWon'); g.addFriend('rina', 10); g.addXP('charm', 20); stickers(g, 1);
    return runP(g, [say('fujita', 'happy', `Misa Aoki is the new class representative with ${54 - y} votes!`), say('rina', 'neutral', 'Congratulations. ...I voted for you. Do not tell anybody.'), say('kai', 'happy', 'MISA! MISA! MISA!'), call((gg) => gg.toast('Class rep: +30 coins every Monday', 'i_star'))]); }
  g.addFriend('rina', 20); g.addXP('charm', 8);
  return runP(g, [say('fujita', 'happy', 'Rina Hoshino takes it, with Misa close behind! Wonderful speeches from both.'), say('rina', 'happy', 'That was close. You made me work for it. I will try to be worthy of those votes.'), say('misa', 'happy', 'Congratulations, Rina!')]);
}
defEvent({ key: (g) => ((yr(g) === 2 || yr(g) === 3) && seasonOf(g.day) === 'spring' && dateOf(g.day) >= 4 && dateOf(g.day) <= 14 && schoolDay(g) && g.minutes >= 8 * 60 + 30 && g.minutes < 15 * 60 && club(g) !== undefined && Y(g).done['april' + yr(g)] ? 'elect' + yr(g) : null), where: 'map:classroom', run: (g, k) => election(g, +k.slice(5)) });

// ---------------------------------------------------------------- club vice-captain (year 2) and captain (year 3)
const ROLE = { 2: ['Vice-Captain', 'sv3y_armband_vice'], 3: ['Captain', 'sv3y_armband_captain'] };
async function roleScene(g, y) {
  const [title, item] = ROLE[y], c = club(g), m = lead(g), cn = clubName(g);
  Y(g).role[y] = { club: c, title, day: g.day };
  g.stat('clubRoles');
  await runP(g, y === 2
    ? [say(m, 'happy', `The third-years have retired from the ${cn}. I am the new captain, and I want you as my vice-captain, Misa.`), say('misa', 'surprised', 'Me? But I am still learning!'), say(m, 'happy', 'Exactly. That is what a vice is for. Learn out loud.')]
    : [say(m, 'neutral', `Misa. The ${cn} is yours. I am stepping back as captain. The younger members want you.`), say('misa', 'surprised', 'Captain?! Of the whole club?'), say(m, 'happy', 'They look at you the way you looked at us. No pressure.')]);
  g.give(item, 1, true); g.toast(`${title} of the ${cn}`, 'i_star'); g.bus.emit('svClubRole', { role: title, year: y });
  const kids = enrolledKohai(g).slice(0, 3);
  if (kids.length) await runP(g, [say(kids[0], 'happy', `Senpai! You are our ${title.toLowerCase()}! We will do our best!`)]);
  await runP(g, [N(`The ${title} armband goes on. Duties: run practice at the notice board in the school halls, and prepare the ${y === 2 ? 'Club Exhibition' : 'Captain\'s Tournament'} in autumn.`)]);
}
defEvent({ key: (g) => ((yr(g) === 2 || yr(g) === 3) && club(g) && seasonOf(g.day) === 'spring' && dateOf(g.day) >= 3 && dateOf(g.day) <= 24 && Y(g).done['april' + yr(g)] && schoolDay(g) && g.minutes >= 15 * 60 + 20 ? 'role' + yr(g) : null), where: 'map:school_halls|school_grounds|classroom|gym', run: (g, k) => roleScene(g, +k.slice(4)) });

async function runPractice(g) {
  const c = club(g), y = Math.max(2, yr(g)), R = Y(g).role;
  if (!c || !R[Math.min(3, y)]) return runP(g, [N('You need a club role first. Vice-captain in Year 2, captain in Year 3.')]);
  if (R.dutyDay === g.day) return runP(g, [say('misa', 'happy', 'Practice is done for today. Everyone is exhausted and happy.')]);
  if (g.minutes < 15 * 60 + 30 || g.minutes > 18 * 60) return runP(g, [N('Practice runs after school, between 3:30 and 6:00.')]);
  if (!g.useEnergy(8)) return;
  const r = await g.minigame(CLUBS[c].game, { club: true, lead: true, tier: y });
  if (r.quit) return;
  R.dutyDay = g.day; g.advance(90); g.addXP('charm', 6 + r.stars * 2); g.addXP(CLUBS[c].skill, 5); g.stat('clubLeadDuty');
  const S0 = S(g); S0.clubPts[c] = (S0.clubPts[c] || 0) + 1;
  for (const k of enrolledKohai(g)) g.addFriend(k, 4 + r.stars);
  await runP(g, [say(enrolledKohai(g)[0] || lead(g), 'happy', 'That was a great practice, senpai! I learned so much!')]);
}
async function kohaiCheck(g) {
  const ids = enrolledKohai(g);
  if (!ids.length) return runP(g, [N('No kohai have enrolled yet. They arrive in April.')]);
  await runP(g, [N(ids.map((id) => `${first(id)} ${'<3'.repeat(Math.max(1, g.hearts(id)))}`).join('   ').slice(0, 120))]);
  const id = ids[Math.floor(g.rng() * ids.length)];
  await runP(g, [say(id, 'happy', SPEC[id].l.d[0].replace(/^[a-z]+\|/, ''))]);
}
async function leaderBoard(g) {
  const R = Y(g).role, y = Math.min(3, Math.max(1, yr(g)));
  const i = await ask(g, R[y] ? `${R[y].title}'s board` : 'Club leadership board', ['Lead today\'s practice', 'Check on the kohai', 'Showcase plans', 'Leave'], [N(R[y] ? `${R[y].title} of the ${clubName(g)}. Duties and the showcase are tracked here.` : 'The leadership board lists club duties. Vice-captains start in Year 2.')]);
  if (i === 0) return runPractice(g);
  if (i === 1) return kohaiCheck(g);
  if (i === 2) return runP(g, [N(y === 2 ? 'Club Exhibition: Autumn 14 to 20, in the school grounds after class. Vice-captains set up the display.' : y === 3 ? 'Captain\'s Tournament: Autumn 14 to 20. Two rounds, with the whole club behind you.' : 'Club showcases begin in Year 2.')]);
}
register('targetProvider', 'sv3y_leader_board', {
  find(world, g) {
    const n = Y(g).role[Math.min(3, yr(g))] ? nearSpot(world, 'school_halls', 'notice_board', 34) : null;
    return n ? { x: n.x, y: n.y, dist: n.d + 4, label: `${Y(g).role[Math.min(3, yr(g))].title}'s duty board`, run: (game) => { leaderBoard(game); } } : null;
  },
});

// ---------------------------------------------------------------- club showcase / tournament (autumn 14-20)
async function showcase(g, y) {
  const c = club(g), C = CLUBS[c], cap = y === 3, cn = C.name, m = C.member;
  await runP(g, [fade(1, 0.6), bd('lanterns_water'), fade(0, 0.6), N(cap ? `The Captain's Tournament. ${cn} members from three schools gather on the field, and the whole club looks at Misa.` : `The Club Exhibition. Misa and the ${cn} set up banners, tables and a very nervous ribbon.`), say(m, 'happy', cap ? 'You are the captain. Say a few words, and then show them how it is done.' : 'Vice-captain duty number one: do not panic.')]);
  let score = 0, rounds = cap ? 2 : 1;
  if (cap) { const s = await g.minigame('sv3_speech', { tier: 3 }); score += s.quit ? 0.4 : s.score; rounds++; }
  for (let i = 0; i < (cap ? 2 : 1); i++) { const r = await g.minigame(C.game, { club: true, tier: y, showcase: true }); score += r.quit ? 0.4 : r.score; }
  const sc = score / rounds, place = sc >= 0.8 ? 1 : sc >= 0.6 ? 2 : 3;
  Y(g).tournament[y] = { score: Math.round(sc * 100), place, club: c };
  g.stat(cap ? 'tournaments' : 'exhibitions'); if (place === 1) g.stat('showcaseWins');
  g.addMoney(200 * (4 - place) * y); stickers(g, place === 1 ? 2 : 1); g.addXP(C.skill, 12); g.addMood(12);
  for (const k of enrolledKohai(g)) g.addFriend(k, 8);
  const kid = enrolledKohai(g)[0];
  await runP(g, [fade(1, 0.5), fade(0, 0.5), say(m, 'happy', place === 1 ? 'FIRST PLACE! Look at this trophy! Nobody told me it would be this heavy!' : place === 2 ? 'Second! The silver is shiny and nobody is crying. Almost nobody.' : 'Third! It still counts. Plus, we get to eat the leftover rice balls!'),
    kid ? say(kid, 'happy', 'Senpai! You were so cool out there! I want to be just like you!') : N('The crowd claps for a long time.'), call((gg) => gg.toast(`${cap ? 'Tournament' : 'Exhibition'}: place ${place}`, 'i_trophy'))]);
  if (place === 1) g.give('school_medal', 1, true);
}
defEvent({ key: (g) => ((yr(g) === 2 || yr(g) === 3) && club(g) && inSeasonWin(g, 'autumn', 14, 20) && Y(g).role[yr(g)] && schoolDay(g) && g.minutes >= 15 * 60 + 30 ? 'show' + yr(g) : null), where: 'map:school_grounds|gym', run: (g, k) => showcase(g, +k.slice(4)) });

// ---------------------------------------------------------------- the school trip (year 2 autumn, multi-scene)
const TRIP = [
  ['story_bus', 'Dawn at the school gate. Two buses idle in a line, and Class 2-B climbs aboard with bags, snacks and an unreasonable amount of energy.', 'seat'],
  ['coast_bayview', 'The bus climbs out of the bay, the sea falling away behind the windows in long silver stripes.', 'songs'],
  ['sunrise', 'The old capital. Temple roofs, lantern streets, school groups in matching jackets everywhere you look.', 'temple'],
  ['leaves', 'Maple lanes in full red. Fujita herds the class along the path while Kai tries to catch a falling leaf with his mouth.', 'free'],
  ['lanterns_water', 'Evening at the inn. Tatami floors, steaming tea and a pillow fight Fujita pretends not to hear.', 'night'],
  ['sky_lanterns', 'The last night of the trip. Paper lanterns are released one by one over the quiet river.', 'wish'],
];
async function tripScene(g) {
  Y(g).trip.picks = {};
  const td = S(g).today; if (!td || td.day !== g.day) S(g).today = { day: g.day, status: 'present', am: true, pm: true, lunch: true, skipped: false, dismissed: true, club: true, bell: {} }; else Object.assign(td, { status: td.status || 'present', am: true, pm: true, lunch: true, dismissed: true });
  g.state.attendance.present = (g.state.attendance.present || 0) + 1;
  await runP(g, [N('Today is the second-year school trip! Fujita pinned a note to the board: "Meet at the gate at 6:30. Bring your sense of adventure."'), fade(1, 0.8)]);
  for (const [b, head, kind] of TRIP) {
    await runP(g, [bd(b), fade(0, 0.7), N(head)]);
    if (kind === 'seat') {
      const i = await ask(g, 'Who do you sit with on the bus?', ['Kai (and his enormous snack bag)', 'Suzu (and her notebook)', 'Hina (and her bug jar)', 'Rina (who saved you a seat)']);
      const who = ['kai', 'suzu', 'hina', 'rina'][i]; Y(g).trip.picks.seat = who; g.addFriend(who, 30);
      await runP(g, [say(who, 'happy', ['Want a rice cracker? Do not tell Fujita I have forty.', 'I brought two books. One for me, one for you. Do not argue.', 'Shh, do not wake the beetle. His name is Sir Travels-a-lot.', 'I saved it. Do not read into it. It is a seat.'][i])]);
    } else if (kind === 'songs') {
      const i = await ask(g, 'The bus is getting quiet. What do you do?', ['Start a sing-along', 'Look out of the window', 'Nap on the shoulder next to you']);
      Y(g).trip.picks.bus = i; g.addMood(6);
      await runP(g, [N(['Everyone joins in on the second verse. Even Rina hums.', 'The sea slides past the window. You think about how far Hoshimori has already felt from here.', 'You wake up with a petal in your hair. Nobody will tell you where it came from.'][i])]);
    } else if (kind === 'temple') {
      const i = await ask(g, 'At the old temple gate:', ['Ring the pilgrim bell', 'Buy an omamori charm', 'Draw a fortune slip']);
      Y(g).trip.picks.temple = i;
      if (i === 0) { g.addXP('charm', 8); await runP(g, [N('The bell hums low and long. A monk smiles and nods.')]); }
      else if (i === 1) { g.give('sv3y_exam_charm', 1); await runP(g, [N('A tiny red charm for exams. It is warm from the sun.')]); }
      else { g.addMood(8); await runP(g, [N('Your fortune slip says: "A long journey ends in a warm kitchen." You tuck it in your notebook.')]); }
    } else if (kind === 'free') {
      const i = await ask(g, 'Group free time! Where to?', ['Souvenir street with Kai and Hina', 'A quiet tea house with Suzu and Theo', 'Climb the long stairs with Rina']);
      const crew = [['kai', 'hina'], ['suzu', 'theo'], ['rina']][i]; Y(g).trip.picks.free = i; crew.forEach((c) => g.addFriend(c, 25));
      if (i === 0) { g.give('sv3y_trip_omiyage', 2); await runP(g, [say('kai', 'happy', 'These are for my mum. And for me. And for the road. Mostly for me.'), say('hina', 'happy', 'There is a shop that sells beetle-shaped cookies! BEETLE COOKIES.')]); }
      else if (i === 1) { g.addXP('study', 15); await runP(g, [say('suzu', 'happy', 'This is the exact tea house from my favourite novel. I am going to write a sequel in it.'), say('theo', 'neutral', '...I am sketching the garden. Come back in an hour. It will be better.')]); }
      else { g.give('sv3y_trip_charm', 1); await runP(g, [say('rina', 'happy', 'A hundred and eight steps. Each one is a worry you leave behind. I have a lot of worries. Hold my bag.')]); }
    } else if (kind === 'night') {
      const i = await ask(g, 'After lights-out:', ['Pillow fight!', 'Whisper about the future', 'Sneak out to the balcony to see the stars']);
      Y(g).trip.picks.night = i;
      if (i === 0) { g.addMood(10); g.addFriend('kai', 12); await runP(g, [N('Feathers everywhere. Fujita opens the door, looks at the carnage, and says "Good night" very slowly.')]); }
      else if (i === 1) { g.addFriend('suzu', 12); g.addFriend('hina', 12); await runP(g, [say('suzu', 'neutral', 'What if we do not stay friends?'), say('hina', 'sad', 'We will. We have to. I have your bug photos.'), say('misa', 'happy', 'We will. I promise.')]); }
      else { g.addFriend('theo', 15); await runP(g, [say('theo', 'happy', 'You came out too? ...Look. That one is Vega. My dad told me.'), N('Two silhouettes on a balcony, under a sky with too many stars to count.')]); }
    } else if (kind === 'wish') {
      const i = await ask(g, 'You write a wish on your lantern:', ['"I want to protect this town."', '"I want to do something I love."', '"I want all of us to stay friends."']);
      Y(g).trip.picks.wish = i; g.setFlag('sv3y_wish_' + ['keeper', 'dream', 'friends'][i]);
      await runP(g, [say('fujita', 'happy', 'Each lantern carries something real. I hope the river carries yours far.'), say('misa', 'happy', 'Thank you for bringing us, Ms. Fujita.')]);
    }
    await runP(g, [fade(1, 0.5)]);
  }
  Y(g).trip.done = true; g.stat('schoolTrips'); g.setFlag('school_trip_done');
  g.addMood(15); stickers(g, 2);
  g.give('sv3y_trip_omiyage', 1, true);
  g.bus.emit('svTrip', {});
  g.state.time.minutes = Math.max(g.minutes, 19 * 60);
  await runP(g, [bd(null), fade(0, 0.8), N('The bus rolls back into Hoshimori under the evening lamps. Everyone is asleep except Fujita, who is smiling at the window.'), say('misa', 'happy', 'Best trip ever. See you tomorrow, everyone!')]);
}
defEvent({ key: (g) => (yr(g) === 2 && seasonOf(g.day) === 'autumn' && dateOf(g.day) >= 8 && dateOf(g.day) <= 20 && schoolDay(g) && g.minutes >= 7 * 60 && g.minutes < 10 * 60 && !g.flag('school_trip_done') ? 'trip2' : null), run: tripScene });

// ---------------------------------------------------------------- Culture Festival scale grows with each year
export const FEST = { 1: { stalls: 6, mult: 1, name: 'Little Festival' }, 2: { stalls: 12, mult: 1.6, name: 'Grand Festival' }, 3: { stalls: 20, mult: 2.4, name: 'Final Festival' } };
const festYear = (g) => Math.max(1, Math.min(3, yr(g)));
register('targetProvider', 'sv3y_festival_scale', {
  find(world, g) {
    if (!(seasonOf(g.day) === 'autumn' && [20, 21].includes(dateOf(g.day)))) return null;
    const n = nearSpot(world, 'school_grounds', 'gate', 36) || nearSpot(world, 'school_grounds', 'bench', 30);
    if (!n || festYear(g) < 2) return n && festYear(g) === 1 ? { x: n.x, y: n.y, dist: n.d + 5, label: 'Festival map', run: (game) => festMap(game) } : null;
    return { x: n.x, y: n.y, dist: n.d + 5, label: `${FEST[festYear(g)].name} special`, run: (game) => { festSpecial(game); } };
  },
});
function festMap(g) { return runP(g, [N(`${FEST[1].name}: ${FEST[1].stalls} stalls. It grows every year!`)]); }
async function festSpecial(g) {
  const y = festYear(g), F = FEST[y], day = dateOf(g.day), Zf = Y(g).festival, key = `${y}_${day}`;
  Zf[key] ||= {};
  const opts = [y === 2 ? 'Run the class haunted house' : 'Main stage: the final act', 'Judge the stalls with the council', 'Wander the stalls', 'Leave'];
  const i = await ask(g, `${F.name}: ${F.stalls} stalls and guests from three towns.`, opts, [N(`Banners, paper lanterns and ${F.stalls} stalls line the grounds. This is ${y === 2 ? 'twice' : 'three times'} the size of last year's festival.`)]);
  if (i === 0) {
    if (Zf[key].main) return runP(g, [say('misa', 'happy', 'Our act is done. Everyone is still buzzing.')]);
    const r = await g.minigame(y === 2 ? 'festival_cafe' : 'club_music', y === 2 ? {} : { song: 'band', club: true }); if (r.quit) return;
    Zf[key].main = true; const pay = Math.round((120 + r.stars * 80) * F.mult);
    g.addMoney(pay); g.addMood(10); g.advance(90); g.stat('festivalSpecials'); g.addFriend('kai', 8); g.addFriend('rina', 8);
    if (y === 3) { g.setFlag('last_festival_stage'); stickers(g, 1); }
    await runP(g, [say('rina', 'happy', y === 2 ? 'The haunted house has a queue around the corner! Kai screamed louder than the visitors.' : 'That was the best act the school ever put on. I am not crying. It is the stage smoke.'), N(`The takings are ${pay} coins, split with the class fund.`)]);
  } else if (i === 1) {
    if (Zf[key].judge) return runP(g, [say('ogawa', 'happy', 'You already did your rounds! Eat something, you earned it.')]);
    Zf[key].judge = true; g.addXP('charm', 10 + y * 4); g.addMoney(Math.round(100 * F.mult)); g.advance(45); g.stat('festivalJudged');
    await runP(g, [say('ogawa', 'happy', 'Ten points for the takoyaki, minus two for the tentacle that escaped. Next stall!'), N('You taste fourteen stalls and award one hand-painted ribbon to Mio\'s class for "most heart".')]);
  } else if (i === 2) { g.addMood(5); g.advance(30); await runP(g, [N(`You wander past ${F.stalls} stalls. The air smells of grilled corn, sugar, and brand-new memories.`)]); }
}

// ---------------------------------------------------------------- year-end class photo, "last time" scenes
async function classPhoto(g, y) {
  g.give('sv3y_class_photo', 1, true);
  await runP(g, [fade(1, 0.6), bd('soc_sunset'), fade(0, 0.6), N(`Winter. The last day of Year ${y}. Ms. Fujita sets up the camera on the classroom desk and runs back into the frame.`),
    say('fujita', 'happy', y === 3 ? 'One more for the album, my last class of Year 3. Look at the lens, please, not at your phones.' : 'Everyone in! Tall ones in the back! Kai, you are the tall one, stop crouching!'), say('kai', 'happy', 'My knees are doing a strike.'), say('rina', 'neutral', 'Smile properly, you will see this at thirty.'), N('Click. The class photo is taped inside Misa\'s desk lid.'), call((gg) => { gg.toast('Year-end class photo', 'i_star'); gg.stat('classPhotos'); })]);
}
defEvent({ key: (g) => (gradeOf(g) >= 1 && seasonOf(g.day) === 'winter' && dateOf(g.day) >= 17 && dateOf(g.day) <= 26 && yr(g) <= 3 ? 'photo' + yr(g) : null), where: 'map:classroom|school_halls|school_grounds', run: (g, k) => classPhoto(g, +k.slice(5)) });
defEvent({ key: (g) => (yr(g) === 3 && inSeasonWin(g, 'autumn', 20, 21) ? 'lastfest' : null), where: 'map:school_grounds|school_halls|gym',
  run: (g) => runP(g, [N('The last Culture Festival. Misa looks at the banners and knows she will remember this exact smell of grilled corn for the rest of her life.'), say('kai', 'sad', 'Do you think they will do it without us next year?'), say('misa', 'happy', 'They will. And somehow it will still be ours.'), call((gg) => { gg.addMood(10); gg.stat('lastTimes'); })]) });
defEvent({ key: (g) => (yr(g) === 4 && seasonOf(g.day) === 'spring' && dateOf(g.day) === 19 ? 'lastsports' : null), where: 'map:school_grounds|gym',
  run: (g) => runP(g, [say('ogawa', 'happy', 'LAST SPORTS DAY FOR THE THIRD-YEARS! I will not cry! I will sweat with emotion!'), say('kai', 'happy', 'We are winning this one. I can feel it in my shin.'), call((gg) => { gg.addMood(10); gg.stat('lastTimes'); })]) });

// ---------------------------------------------------------------- weekly class rep stipend, kohai greetings, club events
register('system', 'sv3_years', {
  init(g) {
    bindGame(g);
    const run0 = g.run.bind(g);
    g.run = (steps) => run0(typeof steps === 'function' ? (gg) => fixSteps(steps(gg), `${gradeOf(g) || 3}-B`) : fixSteps(steps, `${gradeOf(g) || 3}-B`));
    const mg = g.minigame.bind(g);
    g.minigame = (id, opts = {}) => {
      const o = { ...opts };
      if (typeof o.diff !== 'number' && (/^class_/.test(id) || id === 'school_homework') && !o.sv3skip) o.diff = tierDiff(g, o);
      return mg(id, o);
    };
    const refresh = () => applyTimetable(g);
    g.bus.on('gameStart', refresh); g.bus.on('gameLoaded', refresh); g.bus.on('newGame', refresh); g.bus.on('loaded', refresh);
    g.bus.on('dayStart', () => {
      refresh();
      if (isRep(g) && g.weekday === 0 && schoolDay(g)) { g.addMoney(30, true); g.addXP('charm', 2); g.toast('Class rep allowance: +30', 'i_coin'); }
      if (g.weekday === 0 && schoolDay(g) && gradeOf(g) >= 1 && seasonOf(g.day) !== 'summer') g.setFlag('sv3y_monday', g.day);
    });
    g.bus.on('clubActivity', () => { for (const k of enrolledKohai(g)) g.addFriend(k, 3); if (enrolledKohai(g).length) g.stat('kohaiMentored'); });
    g.bus.on('mapEnter', ({ map }) => {
      if (map !== 'school_grounds' || !schoolDay(g) || g.minutes > 9 * 60 || g.flag('sv3y_greet') === g.day) return;
      const ids = enrolledKohai(g); if (!ids.length) return;
      g.setFlag('sv3y_greet', g.day);
      const id = ids[(g.day + ids.length) % ids.length]; g.addFriend(id, 3); g.toast(`${first(id)}: "Good morning, senpai!"`, 'heart'); g.stat('kohaiGreetings');
    });
  },
});
register('worldTick', 'sv3_years_tick', { update: (dt, world, g) => { world.sv3t = (world.sv3t || 0) + dt; if (world.sv3t > 2.5) { world.sv3t = 0; tick(g); } } });
register('system', 'sv3_years_hooks', { init(g) { g.bus.on('hour', () => tick(g)); g.bus.on('mapEnter', () => setTimeout(() => tick(g), 1500)); } });

export { fixSteps, election, aprilScene, roleScene, showcase, tripScene, festSpecial, classPhoto, runPractice, leaderBoard };

features('Years & Graduation', [
  'Three school years: Year 1, Year 2 and Year 3, each starting with a new April on the first day of Spring',
  'The class rotates every April: a new homeroom story beat, a reshuffled seating chart and the class label becomes 1-B, 2-B, 3-B',
  'Second-year electives: choose Art, Music, Science or Business, which takes over the Wednesday and Thursday afternoon periods',
  'Business is a brand new school subject with its own grades',
  'Exam and class difficulty rises with each school year (Basics, Standard, Entrance prep)',
  'Class representative elections in Years 2 and 3 with a speech minigame, a rival campaign from Rina and a weekly allowance for the winner',
  'Club vice-captain in Year 2 and club captain in Year 3, with an armband, a leadership board in the school halls and practice duties',
  'Year 2 Club Exhibition and Year 3 Captain\'s Tournament every autumn, with ranked results and trophies',
  'Year 2 school trip: a multi-scene journey with a bus, temple, free time, an inn night and a lantern wish, each with choices',
  'The Culture Festival grows each year (6, 12, then 20 stalls) with a grand Year 2 haunted house and a Year 3 final stage',
  'Year-end class photo scene each winter, kept in Misa\'s bag',
  'Last Culture Festival and last Sports Day scenes for the third-years',
  'Kohai greet Misa at the school gate in the morning and cheer her on after club practice',
]);
void get; void FRIENDS; void nm; void st; void giveOr; void idle; void gradeName; void choice;
