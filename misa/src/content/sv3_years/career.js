// Year 3 career: the mock-exam series, path counselling with Ms. Fujita and the three ending tracks, each with a three-step
// questline and its own requirements:
//   university - three mock exams, study skill 5, then the entrance exam in the final spring term
//   cafe       - Cafe Kumo apprenticeship under Mika: shifts, cooking, and a tasting
//   keeper     - Hoshimori Keeper / Local Hero: town requests, night rounds with Hana, community
import { register, features } from '../../core/registry.js';
import { SUBJECTS } from '../school/data.js';
import { Y, say, N, call, choice, ask, runP, defEvent, st, stickers, gradeOf, yr, avg, giveOr, nm, first } from './util.js';

export const TRACKS = {
  university: { name: 'University', mentor: 'fujita', blurb: 'Three mock exams, study skill 5, and the entrance exam in the final term.' },
  cafe: { name: 'Cafe Kumo Apprenticeship', mentor: 'mika', blurb: 'Work shifts at the cafe, cook for Mika, and pass her tasting.' },
  keeper: { name: 'Hoshimori Keeper', mentor: 'hana', blurb: 'Help the town, walk the night rounds with Hana, and bring the community together.' },
};
const BASE_KEYS = ['cooked', 'requestsDone', 'festivalsAttended', 'jobShifts_cafe', 'jobShifts', 'studySessions'];
const snap = (g) => Object.fromEntries(BASE_KEYS.map((k) => [k, st(g, k)]));
const since = (g, k) => st(g, k) - (Y(g).trackBase[k] || 0);

export const TASKS = {
  university: [
    { id: 'u_mocks', text: 'Take all three mock exams', done: (g) => Object.keys(Y(g).mocks).length >= 3 },
    { id: 'u_study', text: 'Reach study skill 5', done: (g) => g.skillLevel('study') >= 5 },
    { id: 'u_exam', text: 'Pass the entrance exam (Year 4 spring)', done: (g) => !!(Y(g).entrance && Y(g).entrance.passed) },
  ],
  cafe: [
    { id: 'c_shifts', text: 'Work 4 shifts at Cafe Kumo', done: (g) => since(g, 'jobShifts_cafe') >= 4 },
    { id: 'c_cook', text: 'Cook 20 dishes', done: (g) => since(g, 'cooked') >= 20 },
    { id: 'c_taste', text: 'Pass Mika\'s tasting', done: (g) => !!g.flag('sv3y_tasting_pass') },
  ],
  keeper: [
    { id: 'k_req', text: 'Finish 10 town requests', done: (g) => since(g, 'requestsDone') >= 10 },
    { id: 'k_rounds', text: 'Walk the night rounds with Hana', done: (g) => !!g.flag('sv3y_keeper_rounds') },
    { id: 'k_town', text: 'Restore the hall or join 4 festivals', done: (g) => !!g.flag('community_restored') || since(g, 'festivalsAttended') >= 4 },
  ],
};
export const tasksOf = (g) => TASKS[Y(g).track] || [];
export const trackDone = (g) => tasksOf(g).length > 0 && tasksOf(g).every((t) => t.done(g));
export function trackInfo(g) {
  const Z = Y(g), mocks = Object.keys(Z.mocks).length;
  if (!Z.track) return { title: 'NO PATH CHOSEN YET', lines: [{ text: gradeOf(g) >= 3 ? 'Talk to Ms. Fujita about your path' : 'Path counselling starts in Year 3', done: false }, { text: `Mock exams taken: ${mocks}/3`, done: mocks >= 3 }] };
  return { title: TRACKS[Z.track].name.toUpperCase(), lines: tasksOf(g).map((t, i) => ({ text: `${i + 1}. ${t.text}`, done: t.done(g) })) };
}
export function chooseTrack(g, id) {
  const Z = Y(g);
  if (!TRACKS[id]) return false;
  const changed = Z.track && Z.track !== id;
  Z.track = id; Z.trackAt = g.day; Z.counselled++; Z.trackBase = snap(g); if (changed) Z.trackScenes = {};
  g.setFlag('sv3y_track_' + id); g.stat('pathsChosen'); g.bus.emit('svTrack', { id });
  return true;
}

// ---------------------------------------------------------------- mock exams
export const MOCKS = [
  { n: 1, name: 'Summer mock', from: ['summer', 1], subjects: ['math', 'japanese', 'english'] },
  { n: 2, name: 'Autumn mock', from: ['autumn', 3], subjects: ['science', 'history', 'english'] },
  { n: 3, name: 'Winter mock', from: ['winter', 3], subjects: ['math', 'science', 'japanese'] },
];
const SEASON_I = { spring: 0, summer: 1, autumn: 2, winter: 3 };
export function mockAvailable(g) {
  if (yr(g) !== 3) return null;
  const d = g.day - (yr(g) - 1) * 112;
  return MOCKS.find((m) => !Y(g).mocks[m.n] && d >= SEASON_I[m.from[0]] * 28 + m.from[1]) || null;
}
export const mockGrade = (a) => (a >= 0.9 ? 'S' : a >= 0.75 ? 'A' : a >= 0.6 ? 'B' : a >= 0.4 ? 'C' : 'D');
export async function runMock(g, m) {
  if (!g.useEnergy(12)) return false;
  await runP(g, [say('fujita', 'neutral', `${m.name}. Three papers, same format as the real thing. Deep breaths.`)]);
  const scores = [];
  for (const subj of m.subjects) {
    const r = await g.minigame(SUBJECTS[subj].game, { exam: true, diff: Math.min(1, g.skillLevel('study') / 8 + 0.3 + 0.05 * m.n) });
    scores.push(r.quit ? 0.35 : r.score);
  }
  const a = avg(scores);
  Y(g).mocks[m.n] = { avg: Math.round(a * 100), grade: mockGrade(a), day: g.day };
  g.advance(150); g.addXP('study', 14 + Math.round(a * 12)); g.stat('mocksTaken'); g.bus.emit('svMock', { n: m.n, avg: a });
  await runP(g, [say('fujita', a >= 0.75 ? 'happy' : 'neutral', `Grade ${mockGrade(a)} (${Math.round(a * 100)}). ${a >= 0.75 ? 'That is a university-level performance.' : a >= 0.6 ? 'Solid. A little more polish and you are there.' : 'Not your best, but now you know exactly what to review.'}`)]);
  return true;
}

// ---------------------------------------------------------------- Ms. Fujita: counselling and mock exams
const counsellingSteps = (g) => {
  const Z = Y(g), changing = !!Z.track;
  const pick = (id, line) => [call((gg) => chooseTrack(gg, id)), say(TRACKS[id].mentor, 'happy', line), say('fujita', 'happy', `Then ${TRACKS[id].name} it is. ${TRACKS[id].blurb} I will keep an eye on you.`)];
  return [
    say('fujita', 'neutral', changing ? 'Thinking of changing your path? That is allowed. Sit down.' : 'Misa, sit. It is time for our path talk. Everyone gets one, and you are not allowed to say "I do not know" more than twice.'),
    N('Three folders lie on the desk. University. Cafe Kumo. Hoshimori Keeper.'),
    choice('Which path calls to you?',
      ['University: the books, the exams, the big city', ...pick('university', 'Study hard and the world opens wider. Come to my room if you need notes. I mean it.')],
      ['Cafe Kumo apprenticeship with Mika', ...pick('cafe', 'Show up on time, taste everything, and never serve burnt toast. That is my whole secret.')],
      ['Hoshimori Keeper: stay and look after the bay', ...pick('keeper', 'The lantern needs a keeper. I have been waiting for you to say that for a year.')],
      ['I need more time', say('fujita', 'neutral', 'Of course. Come back whenever you are ready. But before spring, okay?')]),
  ];
};
register('talkHook', 'sv3y_fujita_career', {
  npc: 'fujita', priority: 45,
  when: (g) => (yr(g) >= 3 && gradeOf(g) >= 1 && !Y(g).track) || !!mockAvailable(g),
  steps: (g) => {
    const out = [];
    const m = mockAvailable(g);
    if (m) out.push(choice(`${m.name} is available. Sit it now? (about 2.5 hours)`, ['Yes, I am ready', call((gg) => runMock(gg, m))], ['Not yet', say('fujita', 'neutral', 'Come back when you are ready.')]));
    if (yr(g) >= 3 && gradeOf(g) >= 1 && !Y(g).track) out.push(...counsellingSteps(g));
    return out.length ? out : [say('fujita', 'neutral', 'Study hard, and keep your options open.')];
  },
});

// ---------------------------------------------------------------- the entrance exam (university track, final spring term)
async function entranceExam(g) {
  await runP(g, [N('The university entrance exam. A quiet hall in the next town, rows of desks, the smell of pencils and nerves.'), say('fujita', 'neutral', 'You are ready. I mean it. Five papers, one pencil, one breath at a time.')]);
  const scores = [];
  for (const subj of ['math', 'japanese', 'english', 'science', 'history']) {
    const r = await g.minigame(SUBJECTS[subj].game, { exam: true, diff: Math.min(1, g.skillLevel('study') / 8 + 0.4) });
    scores.push(r.quit ? 0.3 : r.score);
  }
  const mocks = Object.values(Y(g).mocks).map((m) => m.avg / 100), a = avg(scores), bonus = mocks.length ? avg(mocks) * 0.06 : 0, prep = Math.min(0.12, st(g, 'studySessions') * 0.004);
  const total = a + bonus + prep, passed = total >= 0.56;
  Y(g).entrance = { avg: Math.round(a * 100), total: Math.round(total * 100), passed, day: g.day };
  g.stat('entranceExams'); g.bus.emit('svEntrance', { passed });
  g.advance(240);
  await runP(g, passed
    ? [say('fujita', 'happy', `Score ${Math.round(total * 100)}. You passed. You PASSED, Misa!`), say('misa', 'happy', 'I... I did it?'), say('kai', 'happy', 'MISA GOT IN! Everybody look at her!')]
    : [say('fujita', 'neutral', `Score ${Math.round(total * 100)}. A few points short this round.`), say('misa', 'sad', '...Oh.'), say('fujita', 'happy', 'There is a second round in the summer, and a year in a cafe teaches you more than most universities. This is not the end of the story.')]);
}
defEvent({ key: (g) => (yr(g) === 4 && Y(g).track === 'university' && g.season === 'spring' && g.day % 112 >= 8 && g.day % 112 <= 24 && g.check('school') && g.minutes >= 9 * 60 && g.minutes < 15 * 60 ? 'entrance' : null), run: entranceExam });

// ---------------------------------------------------------------- mentors: task scenes
const mentorTalks = [
  ['mika', 'cafe', (g) => TASKS.cafe[0].done(g) && TASKS.cafe[1].done(g) && !g.flag('sv3y_tasting_pass'), 'c_taste'],
];
register('talkHook', 'sv3y_mika_tasting', {
  npc: 'mika', priority: 44, when: (g) => Y(g).track === 'cafe' && TASKS.cafe[0].done(g) && TASKS.cafe[1].done(g) && !g.flag('sv3y_tasting_pass'),
  steps: () => [say('mika', 'happy', 'You have done the shifts and the cooking. Ready for the tasting? I have a flavour card. Match it, and the counter is yours.'),
    choice('Take the tasting?', ['Yes!', call(async (g) => { const r = await g.minigame('sv3_tasting', { tier: 2 }); const ok = !r.quit && r.score >= 0.55; if (ok) { g.setFlag('sv3y_tasting_pass'); g.addFriend('mika', 40); stickers(g, 1); } await runP(g, [say('mika', ok ? 'happy' : 'neutral', ok ? 'You have the palate. You really do. Welcome to the apprenticeship, proper.' : 'Close. Practise a bit and come back. Taste everything, even the bad stuff.')]); })], ['Not yet', say('mika', 'neutral', 'Take your time. The recipe does not run away.')])],
});
register('talkHook', 'sv3y_mika_progress', {
  npc: 'mika', priority: 40, when: (g) => Y(g).track === 'cafe' && !g.flag('sv3y_tasting_pass') && !(TASKS.cafe[0].done(g) && TASKS.cafe[1].done(g)),
  steps: (g) => [say('mika', 'neutral', `Apprenticeship progress: ${Math.min(4, since(g, 'jobShifts_cafe'))}/4 shifts, ${Math.min(20, since(g, 'cooked'))}/20 dishes cooked. Come back when you have both, and I will test your palate.`)],
});
register('talkHook', 'sv3y_hana_rounds', {
  npc: 'hana', priority: 44, when: (g) => Y(g).track === 'keeper' && !g.flag('sv3y_keeper_rounds') && since(g, 'requestsDone') >= 5,
  steps: () => [say('hana', 'happy', 'Five good deeds, hm? Then it is time you learned the night rounds, dear. Tobias is bringing the lantern.'), say('tobias', 'neutral', 'The route is old. Harbour, beach, lighthouse, shrine. We check each light, and each person who forgot theirs.'),
    N('Night. Three lanterns bob through the empty streets of Hoshimori, past the sleeping harbour, over the cold sand, up to the Star Lantern.'),
    say('hana', 'happy', 'That is the whole secret. You light a lamp, and then you light the next one. A town is a lot of lamps.'), say('misa', 'happy', 'I think I can do that. For a long, long time.'),
    call((g) => { g.setFlag('sv3y_keeper_rounds'); g.addFriend('hana', 40); g.addFriend('tobias', 25); g.addMood(12); })],
});
register('talkHook', 'sv3y_hana_progress', {
  npc: 'hana', priority: 39, when: (g) => Y(g).track === 'keeper' && !g.flag('sv3y_keeper_rounds') && since(g, 'requestsDone') < 5,
  steps: (g) => [say('hana', 'neutral', `A Keeper is known by small kindnesses, dear. ${Math.min(5, since(g, 'requestsDone'))}/5 so far. Bring me five and I will show you the night rounds.`)],
});
register('talkHook', 'sv3y_fujita_uni', {
  npc: 'fujita', priority: 38, when: (g) => Y(g).track === 'university' && !trackDone(g) && !mockAvailable(g),
  steps: (g) => [say('fujita', 'neutral', `Your path: mocks ${Object.keys(Y(g).mocks).length}/3, study skill ${g.skillLevel('study')}/5. ${yr(g) >= 4 ? 'The entrance exam is this month.' : 'The entrance exam is in the spring of your last term.'}`)],
});

register('talkHook', 'sv3y_fujita_change', {
  npc: 'fujita', priority: 37, when: (g) => !!Y(g).track && Y(g).counselled < 2 && g.day < 308 && g.flag('sv3y_change_offer') !== Math.floor(g.day / 7),
  steps: () => [call((g) => g.setFlag('sv3y_change_offer', Math.floor(g.day / 7))), choice('Ms. Fujita looks up from her papers.', ['I want to change my path', ...counsellingSteps({ state: { sv3y: { track: 'x' } } })], ['Just checking in', say('fujita', 'neutral', 'Good. Keep going.')])],
});

features('Years & Graduation', [
  'Year 3 mock-exam series (summer, autumn, winter) built on the school exam minigames, each graded S to D by Ms. Fujita',
  'Path counselling with Ms. Fujita in Year 3: University, Cafe Kumo Apprenticeship or Hoshimori Keeper, changeable once',
  'University track: three mock exams, study skill 5, then a five-paper entrance exam in the final spring term',
  'Cafe Kumo apprenticeship track: work shifts, cook dishes and pass Mika\'s flavour-card tasting minigame',
  'Hoshimori Keeper track: help the town, then walk the night rounds with Grandma Hana and Tobias',
  'Each path has its own three-step questline tracked in the Years app',
]);
void nm; void first; void ask; void giveOr; void mentorTalks;
