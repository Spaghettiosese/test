// Hoshimori High: the school day, attendance, classes, lunch, grades, homework, exams, rankings, report cards,
// clubs, school events and the small school-life extras. Everything hangs off the `school` state slice.
// Bus events emitted: classAttended {subject, score, stars, part}, examTaken {subject, score, kind}, homeworkDone {subject, score, late},
//   clubActivity {club, score}, clubRankUp {club, rank}, schoolArrived {status}, examRanked {rank, rina}, reportCard {term, avg, rank},
//   sportsDay {won}, cultureFestival {activity}, schoolSkipped {}
import { register, registerMany, get } from '../../core/registry.js';
import { seasonOf, dateOf, weekdayOf, clockText } from '../../core/time.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS } from '../../gfx/palette.js';
import { makeQuestion } from '../../minigames/school/clubs.js';
import { letterFor } from '../../minigames/school/common.js';
import { SUBJECTS, SUBJECT_IDS, EXAM_DAYS, SCHOOL_MAPS, T, termOf, termKey, isBreak, examInfo, isLastDay, specialDay, classesFor, CLUBS, CLUB_RANKS, LUNCH, BREAD, HOMEROOM, NOTES, LOCKER_NOTES } from './data.js';

// ---------- state ----------
register('stateSlice', 'school', {
  default: () => ({
    today: { day: 0 }, scores: {}, hw: [], club: null, clubTerm: '', clubPts: {}, clubDay: 0, prep: {}, ranks: {}, reports: {},
    lunchFirst: false, kioskDay: 0, kioskSold: {}, nurseDay: 0, paintings: [], poems: [], absences: {}, lates: {}, sports: {}, culture: {},
    introDone: false, dutyDay: 0, breakFlag: false, groggy: 0,
  }),
});
const S = (g) => g.state.school;
const isSchoolMap = (g) => SCHOOL_MAPS.includes(g.world && g.world.map ? g.world.map.id : g.state.map);
export const schoolDay = (g) => g.check('school') && !isBreak(g.day);
function today(g) {
  const s = S(g);
  if (s.today.day !== g.day) s.today = { day: g.day, status: null, am: false, pm: false, lunch: false, skipped: false, dismissed: false, club: false, bell: {} };
  return s.today;
}
const advTo = (g, m) => { if (g.minutes < m) g.advance(m - g.minutes); };
const subjScores = (g, id) => (S(g).scores[id] ||= { cls: [], hw: [], ex: [] });
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export function subjectGrade(g, id) {
  const sc = subjScores(g, id), parts = [[avg(sc.cls), 0.5], [avg(sc.hw), 0.2], [avg(sc.ex), 0.3]].filter(([v]) => v !== null);
  if (!parts.length) return null;
  const w = parts.reduce((a, [, k]) => a + k, 0);
  return Math.round((parts.reduce((a, [v, k]) => a + v * k, 0) / w) * 100);
}
export const gradeLetter = (n) => (n === null ? '-' : letterFor(n / 100));
export function overall(g) { const v = SUBJECT_IDS.map((id) => subjectGrade(g, id)).filter((x) => x !== null); return v.length ? Math.round(avg(v)) : null; }
function mirrorGrades(g) { for (const id of SUBJECT_IDS) { const v = subjectGrade(g, id); if (v !== null) g.state.grades[id] = v; } }

// ---------- dialogue helpers ----------
const ask = (g, prompt, options, lead) => new Promise((res) => {
  let v = -1;
  g.run([...(lead || []), { t: 'choice', prompt, options: options.map((text, i) => ({ text, steps: [{ t: 'call', fn: () => { v = i; } }] })) }]).then(() => res(v));
});
const sayT = (who, text, mood = 'neutral') => ({ t: 'say', who, mood, text });
const teacherSay = (subj, text) => (SUBJECTS[subj].npc ? sayT(SUBJECTS[subj].npc, text) : sayT(null, `${SUBJECTS[subj].teacher}: "${text}"`));
const line = (pool, g) => { const l = pool[Math.floor(g.rng() * pool.length)]; const [m, t] = l.includes('|') ? l.split('|') : ['neutral', l]; return { mood: m, text: t.replace('{weather}', g.weather) }; };

// ---------- one class period ----------
async function runClass(g, subj, part, extra = {}) {
  const def = SUBJECTS[subj], s = S(g);
  const r = await g.minigame(def.game, { drowsy: g.energy < 20, ...extra });
  const score = r.quit ? 0.4 : r.score;
  subjScores(g, subj).cls.push(Math.round(score * 100) / 100);
  const stars = r.quit ? 1 : r.stars;
  g.addXP('study', 6 + stars * 3 + (g.flag('favSubject') === subj ? 2 : 0));
  g.useEnergy(Math.min(g.energy, 6));
  g.stat('classesAttended');
  if (stars >= 3) g.stat('classesTopGrade');
  if (def.npc) g.addFriend(def.npc, 4 + stars * 2);
  g.bus.emit('classAttended', { subject: subj, score, stars, part });
  mirrorGrades(g);
  // called on by the teacher, or a note from a classmate
  const roll = g.rng();
  if (roll < 0.3 && !extra.quiz) {
    const q = makeQuestion(subj, g.rng, 0.3);
    const prompt = q.kanji ? `What does the kanji for "${q.kanji.read}" mean?` : q.q;
    const pick = await ask(g, prompt.length > 46 ? 'Your answer?' : prompt, q.opts, [teacherSay(subj, `Misa, would you answer this one? ${prompt}`)]);
    if (q.opts[pick] === q.ans) { g.addXP('study', 4); if (def.npc) g.addFriend(def.npc, 10); g.stat('questionsAnswered'); await g.run([teacherSay(subj, 'Exactly right. Well done!')]); }
    else await g.run([teacherSay(subj, `Close! It's "${q.ans}". Good try, though.`)]);
  } else if (roll < 0.45 && !extra.quiz) {
    const [who, text] = NOTES[Math.floor(g.rng() * NOTES.length)];
    const caught = g.rng() < 0.2;
    await g.run([sayT(null, text), ...(caught ? [teacherSay(subj, 'Is that note more interesting than my lesson? Don\'t answer that.'), sayT('misa', 'Sorry...', 'surprised')] : [{ t: 'emote', who: 'misa', icon: 'i_music' }])]);
    g.addFriend(who, 5); g.stat('notesPassed');
  }
  if (g.rng() < 0.12 && !extra.quiz && !examInfo(g.day)) {
    await g.run([teacherSay(subj, 'Pop quiz! Just three quick questions. Don\'t panic!')]);
    const q = await g.minigame('school_homework', { subject: subj, subjectName: def.name, count: 3, limit: 20, title: `${def.name} pop quiz` });
    subjScores(g, subj).cls.push(q.quit ? 0.4 : q.score); g.addXP('study', 4); g.stat('popQuizzes');
  }
  return score;
}

// ---------- the school day ----------
async function homeroom(g) {
  const s = S(g), steps = [{ t: 'sfx', name: 'schoolbell' }];
  if (!s.introDone) {
    s.introDone = true; g.setFlag('school_intro');
    steps.push(sayT('fujita', 'Good morning, 2-B! We have a new classmate today. Come on up, don\'t be shy.', 'happy'),
      sayT('misa', 'Um, hi! I\'m Misa Aoki. I just moved here with my cat, Mochi. Nice to meet you all!', 'happy'),
      sayT('fujita', 'Welcome to Hoshimori High, Misa. Your desk is by the window, next to Kai.', 'happy'),
      { t: 'face', who: 'kai', to: 'misa' }, sayT('kai', 'Hey, neighbour! If you need anything, ask me. Except maths. Never ask me maths.', 'happy'),
      sayT('fujita', 'We\'ll start with a class activity so you can find your feet. Every class is a little game here, and your scores make your grades.', 'neutral'));
    g.addFriend('kai', 10); g.addFriend('fujita', 10);
  } else {
    const l = line(HOMEROOM, g); steps.push(sayT('fujita', l.text, l.mood));
    const ex = examInfo(g.day + 1);
    if (ex) steps.push(sayT('fujita', `Tomorrow is the ${ex.kind}. Get some sleep tonight, everyone!`, 'neutral'));
    const pending = s.hw.filter((h) => !h.done && h.due <= g.day).length;
    if (pending) steps.push(sayT('misa', 'Oh no, I didn\'t finish my homework... I\'ll do it tonight. Late is better than never!', 'sad'));
    else if (s.hw.some((h) => h.done && h.doneDay === g.day - 1)) steps.push(sayT('fujita', 'Homework all in. Thank you, Misa!', 'happy'));
  }
  await g.run(steps);
}

async function morning(g) {
  const td = today(g), cls = classesFor(g.day), ex = examInfo(g.day);
  if (ex) return examSeries(g, ex);
  const subj = cls[0], def = SUBJECTS[subj];
  await g.run([sayT(null, `Period 1: ${def.name} with ${def.teacher}. Today: ${def.topic}.`)]);
  await runClass(g, subj, 'am', !S(g).firstClass ? { diff: 0 } : {});
  S(g).firstClass = true;
  td.am = true; advTo(g, T.amEnd);
  return lunch(g);
}

async function lunch(g) {
  const td = today(g), s = S(g);
  td.lunch = true;
  g.sfx('schoolbell');
  const opts = LUNCH.map((l) => `Eat with ${get('npc', l.npc) ? get('npc', l.npc).name.split(' ')[0] : l.npc} (${l.where})`);
  opts.push('Buy bread at the kiosk', s.lunchFirst ? 'Wander around the school' : 'Eat alone at my desk');
  const first = !s.lunchFirst;
  const pick = await ask(g, first ? 'Who do I eat lunch with?' : 'Lunch break!', opts, first ? [sayT(null, 'The lunch bell rings. Chairs scrape, bentos open and the classroom gets loud.'), sayT('misa', 'First lunch at a new school. Who should I sit with?', 'neutral')] : [sayT(null, 'Lunch break until 1:20. Where to?')]);
  s.lunchFirst = true;
  if (pick >= 0 && pick < LUNCH.length) {
    const L = LUNCH[pick], l = line(L.lines, g);
    await g.run([sayT(null, `You eat lunch with ${get('npc', L.npc) ? get('npc', L.npc).name.split(' ')[0] : L.npc} in ${L.where}.`), sayT(L.npc, l.text, l.mood), { t: 'emote', who: L.npc, icon: 'heart' }]);
    g.addFriend(L.npc, first ? 30 : 20); g.addEnergy(12); g.addMood(5); g.advance(30);
    g.stat('lunchesShared'); if (first) g.setFlag('lunch_first_' + L.npc);
    g.bus.emit('lunchWith', { npc: L.npc });
  } else if (pick === LUNCH.length) await kiosk(g);
  else if (first || pick < 0) { g.addEnergy(8); g.advance(20); await g.run([sayT('misa', 'A quiet lunch by the window. The sea looks sparkly from up here.', 'happy')]); }
  g.toast('Free time until 1:20. Be back at your desk for class!', 'i_school');
}

async function kiosk(g) {
  const s = S(g);
  if (s.kioskDay !== g.day) { s.kioskDay = g.day; s.kioskSold = {}; }
  const stock = { school_curry_bread: 1, school_melon_bread: 3, school_yakisoba_bread: 2 };
  const pick = await ask(g, 'The kiosk lady smiles.', [...BREAD.map((b) => `${b.name} (${b.price}c, ${stock[b.id] - (s.kioskSold[b.id] || 0)} left)`), 'Just looking']);
  const b = BREAD[pick];
  if (!b) return;
  if ((s.kioskSold[b.id] || 0) >= stock[b.id]) return g.run([sayT(null, 'Sold out! Try again tomorrow.')]);
  if (b.id === 'school_curry_bread' && g.rng() < 0.4) { s.kioskSold[b.id] = 1; return g.run([sayT('kai', 'LAST CURRY BREAD IS MINE! ...Oh. Hi, Misa. Want to split it? No? Okay, bye!', 'happy'), sayT('misa', 'So fast...', 'surprised')]); }
  if (!g.spend(b.price)) return;
  s.kioskSold[b.id] = (s.kioskSold[b.id] || 0) + 1; g.give(b.id, 1); g.stat('kioskBuys'); g.sfx('buy');
}

async function afternoon(g) {
  const td = today(g), cls = classesFor(g.day), subj = cls[1], def = SUBJECTS[subj];
  if (g.minutes < T.pm) advTo(g, T.pm);
  g.sfx('schoolbell');
  await g.run([sayT(null, `Period 2: ${def.name} with ${def.teacher}. Today: ${def.topic}.`)]);
  await runClass(g, subj, 'pm');
  td.pm = true;
  return dismissal(g);
}

async function dismissal(g) {
  const td = today(g), s = S(g);
  advTo(g, T.pmEnd);
  td.dismissed = true;
  const steps = [];
  const wd = weekdayOf(g.day), cls = classesFor(g.day);
  // homework on Mon/Tue/Thu (and sometimes Wed)
  if (cls && (wd === 0 || wd === 1 || wd === 3 || (wd === 2 && g.rng() < 0.5)) && !examInfo(g.day) && !s.hw.some((h) => h.given === g.day)) {
    const subj = cls[g.rng() < 0.5 ? 0 : 1];
    s.hw.push({ id: `${g.day}_${subj}`, subject: subj, given: g.day, due: g.day + 1, done: false });
    steps.push(teacherSay(subj, `Homework tonight: one ${SUBJECTS[subj].name} worksheet. Due tomorrow!`));
    g.toast(`Homework: ${SUBJECTS[subj].name} worksheet (do it at your desk)`, 'i_quest');
  }
  steps.push(sayT('fujita', 'That\'s all for today. Stand, bow... and see you tomorrow!', 'happy'), { t: 'sfx', name: 'schoolbell' });
  await g.run(steps);
  advTo(g, T.out);
  // class duty on Wednesdays
  if (wd === 2 && s.dutyDay !== g.day) {
    s.dutyDay = g.day;
    const r = await g.minigame('school_board', {});
    if (!r.quit) { g.addFriend('fujita', 8); g.addXP('homemaking', 4); g.stat('classDuty'); g.advance(15); await g.run([sayT('fujita', 'A spotless board! Thank you for your class duty, Misa.', 'happy')]); }
  }
  if (isLastDay(g.day)) await reportCard(g);
  if (s.club && clubToday(g)) await g.run([sayT(null, `It's a ${CLUBS[s.club].name} day! Head to the club room, or sit back down at your desk to join in.`)]);
}

// ---------- exams ----------
async function examSeries(g, ex) {
  const s = S(g), list = EXAM_DAYS[ex.idx], tk = termKey(g.day), key = `${tk}_${ex.kind}`;
  const prep = Math.min(20, s.prep[tk] || 0) / 100, notes = g.flag('rivals_notes') ? 0.1 : 0;
  await g.run([sayT('fujita', `${ex.kind === 'midterm' ? 'Midterm' : 'Final'} exams, day ${ex.idx + 1}! ${list.length} papers today: ${list.map((x) => SUBJECTS[x].name).join(', ')}. Deep breaths. You've got this.`, 'neutral'),
    sayT('misa', prep >= 0.1 ? 'I studied hard for this. Okay. I can do it!' : 'I hope I remember everything...', prep >= 0.1 ? 'happy' : 'neutral')]);
  for (const subj of list) {
    const r = await g.minigame(SUBJECTS[subj].game, { exam: true, drowsy: g.energy < 15 });
    const score = Math.min(1, (r.quit ? 0.35 : r.score) * (1 + notes) + prep);
    subjScores(g, subj).ex.push(Math.round(score * 100) / 100);
    (s.ranks[key] ||= { scores: {} }).scores[subj] = score;
    g.addXP('study', 10 + Math.round(score * 10)); g.stat('examsTaken'); g.useEnergy(Math.min(g.energy, 5));
    g.bus.emit('examTaken', { subject: subj, score, kind: ex.kind });
  }
  mirrorGrades(g);
  if (ex.idx === 1) computeRanking(g, key);
  today(g).am = true; today(g).pm = true;
  advTo(g, T.amEnd);
  await g.run([sayT(null, ex.idx === 1 ? 'Pens down! The exams are over. Results go up on the notice board tomorrow.' : 'Pens down! One more exam day tomorrow.'), { t: 'sfx', name: 'schoolbell' }]);
  await lunch(g);
  advTo(g, T.pmEnd);
  return dismissal(g);
}
const CLASSMATES = ['Rina Hoshino', 'Suzu Mori', 'Kai Tanabe', 'Theo Park', 'Hina Kobayashi', 'Aiko Saito', 'Ren Kato', 'Mei Inoue', 'Sora Ito', 'Yuki Abe', 'Haru Shimizu', 'Nana Ono', 'Daiki Goto', 'Emi Fujii', 'Kenta Endo', 'Riko Mori', 'Taro Ueno', 'Saki Ikeda', 'Jun Ota', 'Mio Hara', 'Kaito Sano', 'Hana Noda', 'Shun Arai', 'Yui Kudo', 'Toma Baba', 'Ami Seki', 'Rio Imai', 'Koji Oda', 'Nao Hirano'];
const BASE = { 'Rina Hoshino': 0.9, 'Suzu Mori': 0.82, 'Kai Tanabe': 0.55, 'Theo Park': 0.7, 'Hina Kobayashi': 0.62 };
function computeRanking(g, key) {
  const s = S(g), rec = s.ranks[key], rng = g.rngFor('rank' + key);
  const mine = avg(Object.values(rec.scores));
  const rows = CLASSMATES.map((n) => ({ name: n, score: Math.min(0.99, (BASE[n] || 0.5 + rng() * 0.3) + (rng() - 0.5) * 0.12) }));
  rows.push({ name: 'Misa Aoki', score: mine, me: true });
  rows.sort((a, b) => b.score - a.score);
  rec.list = rows.map((r) => ({ name: r.name, score: Math.round(r.score * 100), me: !!r.me }));
  rec.rank = rows.findIndex((r) => r.me) + 1; rec.rina = rows.findIndex((r) => r.name === 'Rina Hoshino') + 1; rec.day = g.day + 1; rec.avg = Math.round(mine * 100);
  s.lastRank = key;
  g.bus.emit('examRanked', { rank: rec.rank, rina: rec.rina, key });
}
export const latestRanking = (g) => { const s = S(g); return s.lastRank ? s.ranks[s.lastRank] : null; };

async function showRanking(g) {
  const r = latestRanking(g);
  if (!r) return g.run([sayT('misa', 'No exam rankings posted yet. The first ones go up after the midterms.')]);
  const steps = [sayT(null, `Exam rankings, class 2-B. Top: ${r.list.slice(0, 3).map((x, i) => `${i + 1}. ${x.name}`).join('  ')}.`),
    sayT('misa', `I came ${r.rank}${['st', 'nd', 'rd'][r.rank - 1] || 'th'} out of ${r.list.length} with an average of ${r.avg}. Rina came ${r.rina}${['st', 'nd', 'rd'][r.rina - 1] || 'th'}.`, r.rank <= 5 ? 'happy' : 'neutral')];
  const s = S(g);
  if (!s.seenRank || s.seenRank !== g.state.school.lastRank) {
    s.seenRank = s.lastRank; g.stat('rankingsSeen');
    if (r.rank < r.rina) { steps.push(sayT('rina', 'You beat me?! ...Fine. Enjoy it while it lasts. Next time I won\'t lose, rival.', 'surprised')); g.addFriend('rina', 25); g.stat('beatRina'); }
    else steps.push(sayT('rina', 'Top of the class, as expected. You did... reasonably well. For a new girl.', 'neutral'));
    if (!g.flag('rina_rival')) g.setFlag('rina_rival');
  }
  return g.run(steps);
}

// ---------- report card ----------
async function reportCard(g) {
  const s = S(g), tk = termKey(g.day);
  if (s.reports[tk]) return;
  const final = latestRanking(g);
  const term = termOf(g.day), abs = s.absences[tk] || 0, late = s.lates[tk] || 0;
  const rep = { term, grades: Object.fromEntries(SUBJECT_IDS.map((id) => [id, subjectGrade(g, id)])), avg: overall(g), rank: final ? final.rank : null, rina: final ? final.rina : null, absent: abs, late, day: g.day };
  s.reports[tk] = rep;
  g.stat('reportCards');
  await new Promise((res) => g.open('school_report', rep, res));
  const L = gradeLetter(rep.avg);
  g.mail(`report_${tk}`, 'Mum', L === 'S' || L === 'A' ? 'We saw your report card! Dad did a little dance in the galley. We are so proud of you!' : 'Your report card came through! Grades go up and down, but you are doing great in a brand new school. Love you!');
  g.mail(`report_dad_${tk}`, 'Dad', 'I\'m cooking a celebration curry for the whole crew in your honour. Keep feeding Mochi for me!');
  if (rep.rank && rep.rank <= 3) { g.addMoney(3000); g.give('school_certificate', 1); g.stat('honourRoll'); g.toast('Honour roll! A framed certificate and 3000 coins', 'i_trophy'); }
  if (!abs && !late) { g.give('school_gold_sticker', 1); g.mail(`attend_${tk}`, 'Ms. Fujita', 'Perfect attendance this term! Not one late morning. Here is a gold sticker for your notebook. - A. Fujita'); g.stat('perfectAttendance'); }
  g.bus.emit('reportCard', { term: tk, avg: rep.avg, rank: rep.rank });
}

// ---------- homework, study, cram ----------
const pendingHW = (g) => S(g).hw.filter((h) => !h.done);
async function doHomework(g, h, place) {
  const def = SUBJECTS[h.subject];
  if (!g.useEnergy(5)) return;
  const r = await g.minigame('school_homework', { subject: h.subject, subjectName: def.name });
  if (r.quit) return;
  const late = g.day > h.due || (g.day === h.due && g.minutes > T.bell);
  const score = late ? r.score * 0.5 : r.score;
  Object.assign(h, { done: true, doneDay: g.day, score, late });
  subjScores(g, h.subject).hw.push(Math.round(score * 100) / 100);
  g.addXP('study', Math.round((5 + r.stars * 2) * (place === 'library' ? 1.1 : 1)));
  g.advance(30); g.stat('homeworkDone'); mirrorGrades(g);
  g.bus.emit('homeworkDone', { subject: h.subject, score, late });
  g.toast(late ? 'Homework done (late, half credit)' : 'Homework done!', 'i_check');
}
async function study(g, place = 'desk') {
  const s = S(g), tk = termKey(g.day), hw = pendingHW(g);
  const cram = g.minutes >= 24 * 60;
  const opts = [hw.length ? `Do homework (${hw.length} to do)` : 'No homework right now', cram ? 'Cram for exams (bonus, but sleepy tomorrow)' : 'Study for exams (1 hour)', 'Read over my notes', 'Maybe later'];
  const pick = await ask(g, place === 'library' ? 'The library is nice and quiet.' : 'My study desk.', opts);
  if (pick === 0 && hw.length) {
    const which = hw.length > 1 ? await ask(g, 'Which worksheet?', hw.map((h) => `${SUBJECTS[h.subject].name}${g.day > h.due ? ' (late)' : ''}`)) : 0;
    if (which >= 0) await doHomework(g, hw[which], place);
  } else if (pick === 1) {
    if (!termOf(g.day)) return g.run([sayT('misa', 'It\'s summer break! Let\'s do a summer diary page instead.', 'happy'), { t: 'call', fn: () => { g.addXP('study', 3); g.stat('summerDiary'); g.addMood(4); } }]);
    if (!g.useEnergy(cram ? 6 : 10)) return;
    const gain = place === 'library' ? 6 : 5;
    s.prep[tk] = Math.min(20, (s.prep[tk] || 0) + (cram ? gain + 2 : gain));
    g.addXP('study', Math.round((cram ? 14 : 10) * (place === 'library' ? 1.1 : 1)));
    g.advance(60); g.stat('studySessions');
    if (cram) { s.groggy = g.day + 1; g.stat('cramNights'); }
    g.toast(`Exam prep: +${s.prep[tk]}% ready${cram ? ' (you will be groggy...)' : ''}`, 'i_book');
    g.bus.emit('studied', { place, prep: s.prep[tk] });
  } else if (pick === 2) {
    const r = await g.minigame('school_homework', { subject: SUBJECT_IDS[Math.floor(g.rng() * SUBJECT_IDS.length)], subjectName: 'Flash card', count: 3, limit: 20, title: 'Flash cards' });
    if (!r.quit) { g.addXP('study', 2 + r.stars); g.advance(15); g.stat('flashCards'); }
  }
}

// ---------- clubs ----------
const clubOK = (g, id) => !CLUBS[id].when || g.check(CLUBS[id].when);
const clubToday = (g) => { const c = S(g).club; return c && CLUBS[c].days.includes(g.weekday) && schoolDay(g) && !examInfo(g.day); };
export const clubRank = (g, id) => { const p = S(g).clubPts[id] || 0; let r = 1; CLUB_RANKS.forEach((v, i) => { if (p >= v) r = i + 1; }); return r; };
async function joinClub(g, preset) {
  const s = S(g), tk = termKey(g.day) || 'summer';
  const ids = preset ? [preset] : Object.keys(CLUBS).filter((id) => clubOK(g, id));
  if (s.club && s.clubTerm === tk && s.switched === tk) return g.run([sayT('misa', `I already switched clubs this term. I'll stay in the ${CLUBS[s.club].name} for now.`)]);
  const pick = await ask(g, s.club ? `Currently: ${CLUBS[s.club].name}` : 'Join a club? (meetings 3:30-5:30)', [...ids.map((id) => `${CLUBS[id].name} (${CLUBS[id].days.map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d]).join('/')})`), 'Not now'], preset ? [sayT(null, CLUBS[preset].blurb)] : []);
  const id = ids[pick];
  if (!id || id === s.club) return;
  if (s.club) s.switched = tk;
  s.club = id; s.clubTerm = tk; g.stat('clubsJoined');
  g.sfx('chime'); g.toast(`Joined the ${CLUBS[id].name}!`, 'i_star');
  const m = CLUBS[id].member;
  await g.run([sayT(m, id === 'astronomy' ? 'Welcome aboard, star-gazer. We meet Wednesdays and Fridays after school.' : 'Welcome to the club! Come by after school on meeting days.', 'happy')]);
  g.addFriend(m, 15);
  g.bus.emit('clubJoined', { club: id });
}
async function clubActivity(g) {
  const s = S(g), id = s.club, C = CLUBS[id], td = today(g);
  if (td.club) return g.run([sayT('misa', 'Club is done for today. See you next meeting!', 'happy')]);
  if (g.minutes < T.out) return g.run([sayT(null, 'Club starts after school, at 3:30.')]);
  if (g.minutes > 18 * 60) return g.run([sayT(null, 'Everyone has gone home. Club meets again next time.')]);
  if (!g.useEnergy(8)) return;
  const r = await g.minigame(C.game, { club: true });
  if (r.quit) return;
  td.club = true;
  const before = clubRank(g, id);
  s.clubPts[id] = (s.clubPts[id] || 0) + r.stars;
  g.addXP(C.skill, 6 + r.stars * 3); g.addFriend(C.member, 10 + r.stars * 3); g.addMood(5);
  const data = r.data || {};
  if (data.painting) s.paintings.unshift({ px: data.painting, theme: data.theme, day: g.day }), s.paintings.length = Math.min(s.paintings.length, 12);
  if (data.poem) s.poems.unshift({ lines: data.poem, day: g.day }), s.poems.length = Math.min(s.poems.length, 12);
  if (id === 'astronomy') for (const c of ['big_dipper', 'orion', 'cassiopeia']) g.collect('constellation', c);
  if (id === 'nature' && r.stars >= 3 && g.rng() < 0.5) { g.toast('Mr. Ogawa shares some rare seeds!', 'i_leaf'); g.addFriend('ogawa', 10); }
  g.advance(Math.max(0, Math.min(120, T.clubEnd - g.minutes)));
  g.stat('clubActivities');
  g.bus.emit('clubActivity', { club: id, score: r.score });
  const after = clubRank(g, id);
  if (after > before) {
    g.sfx('levelup');
    await g.run([sayT(C.member, `You've really grown in the club. That's club rank ${after}!`, 'happy')]);
    if (after === 3) g.give('school_club_pin', 1);
    g.bus.emit('clubRankUp', { club: id, rank: after });
  }
}

// ---------- events ----------
async function sportsDay(g) {
  const s = S(g), sp = (s.sports[g.day] ||= { done: {}, wins: 0 });
  const acts = [['relay', 'Class relay', 'class_pe', { mode: 'sprint', relay: true }], ['tug', 'Tug-of-war', 'sports_tug', {}], ['bread', 'Bread-eating race', 'sports_bread', {}]];
  if (!today(g).status) arrive(g, 'present');
  const left = acts.filter((a) => !sp.done[a[0]]);
  if (!left.length) return g.run([sayT('ogawa', `What a day! 2-B won ${sp.wins} of 3 events. I'm not crying, you're crying!`, 'happy')]);
  const pick = await ask(g, 'Sports Day! Which event next?', [...left.map((a) => a[1]), 'Cheer from the side'], sp.started ? [] : [sayT('ogawa', 'WELCOME TO SPORTS DAY! Class against class! Give it everything, and drink water!', 'happy')]);
  sp.started = true;
  const a = left[pick];
  if (!a) { g.addMood(3); return; }
  const r = await g.minigame(a[2], a[3]);
  if (r.quit) return;
  sp.done[a[0]] = true;
  const won = a[0] === 'relay' ? (r.data && r.data.place === 1) : r.score >= 0.7;
  if (won) sp.wins++;
  g.addFriend('ogawa', 8); g.addFriend('kai', 6); g.stat('sportsEvents'); g.advance(60);
  if (Object.keys(sp.done).length === 3) { g.stat(sp.wins >= 2 ? 'sportsDayWins' : 'sportsDays'); g.bus.emit('sportsDay', { won: sp.wins >= 2 }); await g.run([sayT('ogawa', sp.wins >= 2 ? 'Class 2-B are the champions! Here, a medal for everyone!' : 'Every class gave their all. That is the real win!', 'happy')]); if (sp.wins >= 2) g.give('school_medal', 1); }
}
async function cultureFestival(g) {
  const s = S(g), cf = (s.culture[g.day] ||= {});
  const opts = ['Work a shift at the 2-B cafe', 'Play on the festival stage', 'Visit the art and bug exhibitions', 'Just enjoy the festival'];
  const pick = await ask(g, 'Culture Festival! Bunting everywhere.', opts, cf.started ? [] : [sayT(null, 'The school is full of stalls, posters and visitors from town. Class 2-B is running a cafe!')]);
  cf.started = true;
  if (pick === 0) {
    if (cf.cafe) return g.run([sayT('rina', 'Your shift is over! Go enjoy the festival. That\'s an order from the class rep.', 'happy')]);
    const r = await g.minigame('festival_cafe', {}); if (r.quit) return;
    cf.cafe = true; g.addMoney(100 + r.stars * 60); g.addFriend('rina', 10); g.advance(90); g.stat('festivalShifts');
    g.bus.emit('cultureFestival', { activity: 'cafe' });
  } else if (pick === 1) {
    if (cf.stage) return g.run([sayT('theo', '...We already played. People clapped. I\'m still shaking a little.', 'happy')]);
    const r = await g.minigame('club_music', { song: 'band', club: true }); if (r.quit) return;
    cf.stage = true; g.addFriend('theo', 15); g.addMood(10); g.advance(60); g.stat('stageShows');
    await g.run([sayT('theo', r.stars >= 2 ? 'That... was amazing. Did you hear them cheer?' : 'We did it. On a real stage. Wow.', 'happy')]);
    g.bus.emit('cultureFestival', { activity: 'stage' });
  } else if (pick === 2) {
    await g.run([sayT('hina', 'Welcome to my bug exhibition! Captain the beetle is the star of the show. He knows.', 'happy'), sayT('theo', 'The art club wall is over here. ...That one\'s mine. The sea at night.', 'neutral'),
      ...(S(g).paintings.length ? [sayT('misa', 'And there\'s my painting from the art club! It\'s hanging right in the middle!', 'happy')] : [])]);
    g.addFriend('hina', 8); g.addFriend('theo', 8); g.addMood(6); g.advance(45); g.bus.emit('cultureFestival', { activity: 'exhibits' });
  } else { g.addMood(4); g.advance(30); }
}

// ---------- arrival, the desk and the seat ----------
function arrive(g, status) {
  const td = today(g), s = S(g), tk = termKey(g.day);
  if (td.status) return;
  td.status = status;
  g.state.attendance[status] = (g.state.attendance[status] || 0) + 1;
  if (status === 'late') { s.lates[tk] = (s.lates[tk] || 0) + 1; g.stat('lateDays'); } else g.stat('schoolDaysPresent');
  g.bus.emit('schoolArrived', { status });
}
async function seat(g) {
  const td = today(g), sp = specialDay(g.day), m = g.minutes;
  if (sp === 'sports' && schoolDay(g)) return sportsDay(g);
  if (sp === 'culture') return cultureFestival(g);
  if (!schoolDay(g)) return g.run([sayT('misa', seasonOf(g.day) === 'summer' ? 'My desk, waiting for autumn. Summer break, here I come!' : isBreak(g.day) ? 'No classes today. It\'s the holidays!' : 'No school today. My desk looks lonely without me.', 'happy')]);
  if (td.skipped) return g.run([sayT('misa', 'I already left school today... I\'ll come back tomorrow, on time.', 'sad')]);
  if (!td.status) {
    if (m >= T.amEnd + 60) return g.run([sayT('misa', 'It\'s so late in the day... I\'ll just come in properly tomorrow.', 'sad')]);
    if (m < T.bell) {
      arrive(g, 'present');
      if (S(g).groggy === g.day) { g.addEnergy(-15); await g.run([sayT('misa', 'Yaaawn... I stayed up way too late cramming.', 'sleepy')]); }
      const w = await ask(g, `Made it on time! It's ${clockText(m)}.`, ['Wait for homeroom', 'Look around first']);
      if (w !== 0) return g.toast('Sit at your desk when you are ready for homeroom', 'i_school');
      advTo(g, T.bell);
    } else {
      arrive(g, 'late');
      await g.run([sayT('fujita', 'Ah, Misa. Slip in quietly, it\'s alright. Try to catch the bell tomorrow, okay?', 'neutral'), sayT('misa', 'Sorry, Ms. Fujita!', 'surprised')]);
      g.addFriend('fujita', -2);
      if (m >= T.amEnd) { today(g).am = true; return lunchOrAfternoon(g); }
      return morning(g);
    }
    await homeroom(g);
    return morning(g);
  }
  if (!td.am) { if (m < T.bell) { const w = await ask(g, 'Wait for homeroom?', ['Yes', 'Not yet']); if (w !== 0) return; advTo(g, T.bell); await homeroom(g); } return morning(g); }
  if (!td.pm) return lunchOrAfternoon(g);
  if (S(g).club && clubToday(g) && !td.club) { const w = await ask(g, `Go to ${CLUBS[S(g).club].name}?`, ['Yes', 'Not today']); if (w === 0) return clubActivity(g); return; }
  return g.run([sayT('misa', 'Classes are over for today. Time to head out!', 'happy')]);
}
async function lunchOrAfternoon(g) {
  const td = today(g);
  if (!td.lunch) return lunch(g);
  if (g.minutes < T.pm) { const w = await ask(g, `Lunch ends at 1:20. It's ${clockText(g.minutes)}.`, ['Wait for afternoon class', 'Keep wandering']); if (w !== 0) return; }
  return afternoon(g);
}

async function notice(g) {
  const sp = specialDay(g.day);
  const opts = ['Club list and sign-up', 'Exam rankings', 'This week\'s timetable', 'Leave'];
  if (sp === 'sports') opts.unshift('Sports Day events'); if (sp === 'culture') opts.unshift('Culture Festival programme');
  const pick = await ask(g, 'The school notice board', opts);
  const o = opts[pick];
  if (o === 'Sports Day events') return sportsDay(g);
  if (o === 'Culture Festival programme') return cultureFestival(g);
  if (o === 'Club list and sign-up') return joinClub(g);
  if (o === 'Exam rankings') return showRanking(g);
  if (o === 'This week\'s timetable') return g.open('phone', 'school');
}
function nearestSpot(g, names) {
  const w = g.world; if (!w || !w.map) return null;
  const spots = w.map.def.spots || {}, p = w.player;
  let best = null, bd = 1e9;
  for (const n of names) { const v = spots[n]; if (!v) continue; const d = Math.hypot(v[0] * 16 + 8 - p.x, v[1] * 16 + 8 - p.y); if (d < bd) { bd = d; best = n; } }
  return best;
}
async function clubRoom(g) {
  const room = nearestSpot(g, Object.values(CLUBS).map((c) => c.room)) || 'art_room';
  const id = Object.keys(CLUBS).find((k) => CLUBS[k].room === room) || 'art';
  const C = CLUBS[id], s = S(g);
  if (!clubOK(g, id)) return g.run([sayT('misa', 'An old sign: "Astronomy Club". The door is locked and dusty. I wonder why it closed...', 'neutral')]);
  if (s.club === id) {
    if (clubToday(g)) return clubActivity(g);
    return g.run([sayT(null, `${C.name}: rank ${clubRank(g, id)}. Meetings on ${C.days.map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d]).join(' and ')}, 3:30 to 5:30.`)]);
  }
  return joinClub(g, id);
}

// ---------- registrations ----------
registerMany('interaction', {
  class_seat: { label: (g) => { const td = today(g); return !schoolDay(g) && !specialDay(g.day) ? 'My desk' : !td.status ? 'Sit down for class' : !td.pm ? 'Back to my desk' : 'My desk'; }, run: (g) => { seat(g); } },
  school_notice: { label: 'Notice board', run: (g) => { notice(g); } },
  club_room: { label: 'Club room', run: (g) => { clubRoom(g); } },
});

const near = (world, g, map, spot, r = 22) => {
  if (!world.map || world.map.id !== map) return null;
  const v = (world.map.def.spots || {})[spot]; if (!v) return null;
  const x = v[0] * 16 + 8, y = v[1] * 16 + 8, d = Math.hypot(world.player.x - x, world.player.y - 3 - y);
  return d < r ? { x, y, dist: Math.max(0, d - 8) } : null;
};
register('targetProvider', 'school_nurse', {
  find(world, g) {
    const n = near(world, g, 'school_halls', 'nurse'); if (!n) return null;
    return { ...n, label: 'Rest in the nurse\'s office', run: (game) => {
      const s = S(game);
      if (s.nurseDay === game.day) return game.say('misa', 'neutral', 'I already had a rest here today. The nurse says to drink water.');
      s.nurseDay = game.day; game.addEnergy(30); game.advance(60); game.stat('nurseNaps');
      game.run([{ t: 'fade', to: 1, dur: 0.5 }, sayT(null, 'You lie down on the crisp white bed. The curtain sways. Zzz...'), { t: 'fade', to: 0, dur: 0.5 }, sayT('misa', 'Much better! Thank you, nurse!', 'happy')]);
    } };
  },
});
register('targetProvider', 'school_study_spots', {
  find(world, g) {
    const n = near(world, g, 'library', 'desk') || near(world, g, 'library', 'table_1') || near(world, g, 'library', 'table_2') || near(world, g, 'school_halls', 'library_corner');
    return n ? { ...n, dist: n.dist + 6, label: 'Study here', run: (game) => { study(game, 'library'); } } : null;
  },
});
register('targetProvider', 'school_events_field', {
  find(world, g) {
    if (specialDay(g.day) !== 'sports' || !schoolDay(g)) return null;
    const n = near(world, g, 'school_grounds', 'field_center', 30);
    return n ? { ...n, label: 'Sports Day events', run: (game) => { sportsDay(game); } } : null;
  },
});

// Morning PA ticker on school maps
import { drawText, measure } from '../../font.js';
import { ANNOUNCE } from './data.js';
register('hud', 'school_pa', {
  draw(gx, g) {
    if (!schoolDay(g) || !isSchoolMap(g) || g.minutes < 7 * 60 + 50 || g.minutes >= T.bell + 10) return;
    const msg = ANNOUNCE.map((a, i) => ANNOUNCE[(i + g.day) % ANNOUNCE.length]).slice(0, 3).join('   *   ');
    const w = measure(msg), x = 320 - ((g.clock * 30) % (w + 320));
    gx.fillStyle = 'rgba(43,29,46,0.85)'; gx.fillRect(0, 214, 320, 10); gx.fillStyle = RAMPS.butter[2]; gx.fillRect(0, 214, 320, 1);
    drawText(gx, 'PA', 3, 217, RAMPS.butter[2], 1, null); gx.save(); gx.beginPath(); gx.rect(16, 214, 304, 10); gx.clip(); drawText(gx, msg, Math.round(x), 217, '#fff8e8', 1, null); gx.restore();
  },
});

// Bells, skipping, absences, shoe lockers, breaks
const BELLS = [[T.bell, 'Homeroom is starting!'], [T.amEnd, 'Lunch bell!'], [T.pm, 'Afternoon classes are starting!'], [T.out, 'School\'s out!']];
register('worldTick', 'school_bells', {
  update(dt, world, g) {
    if (!schoolDay(g) || !isSchoolMap(g)) return;
    const td = today(g);
    for (const [m, text] of BELLS) if (g.minutes >= m && g.minutes < m + 3 && !td.bell[m]) { td.bell[m] = 1; g.sfx('schoolbell'); g.toast(text, 'i_school'); }
  },
});
register('system', 'school', {
  init(g) {
    g.studyAtDesk = () => study(g, 'desk');
    g.school = { subjectGrade: (id) => subjectGrade(g, id), overall: () => overall(g), schoolDay: () => schoolDay(g), joinClub: (id) => joinClub(g, id), seat: () => seat(g), study: (p) => study(g, p), ranking: () => latestRanking(g) };
    const breaks = () => {
      const s = S(g);
      if (isBreak(g.day) && !g.state.flags.noSchool) { g.state.flags.noSchool = true; s.breakFlag = true; }
      else if (!isBreak(g.day) && s.breakFlag) { delete g.state.flags.noSchool; s.breakFlag = false; }
    };
    g.bus.on('gameStart', breaks); g.bus.on('gameLoaded', breaks);
    g.bus.on('dayStart', () => {
      breaks();
      if (schoolDay(g)) {
        const ex = examInfo(g.day), sp = specialDay(g.day);
        g.toast(ex ? `${ex.kind === 'midterm' ? 'Midterm' : 'Final'} exams today! Homeroom at 8:30` : sp === 'sports' ? 'Sports Day today at school!' : 'School today! Homeroom starts at 8:30', 'i_school');
        if (S(g).groggy === g.day) g.addEnergy(-10);
      }
      if (specialDay(g.day) === 'culture') g.toast('The Culture Festival is on at school!', 'i_star');
    });
    g.bus.on('dayEnd', ({ day }) => {
      const s = S(g), td = s.today;
      const wasSchool = g.check('school') && !isBreak(day);
      if (wasSchool && !(td.day === day && td.status)) {
        const tk = termKey(day); s.absences[tk] = (s.absences[tk] || 0) + 1; g.state.attendance.absent = (g.state.attendance.absent || 0) + 1; g.stat('absentDays');
        g.mail(`absent_${day}`, 'Ms. Fujita', 'We missed you in class today, Misa. I hope you are feeling alright. Rest well, and we will see you tomorrow!');
      }
    });
    g.bus.on('mapEnter', ({ map }) => {
      const td = today(g);
      if (map === 'school_halls' && schoolDay(g) && g.minutes < 10 * 60 && !td.shoes) {
        td.shoes = true; g.toast('Changed into indoor shoes', 'i_school'); g.stat('shoeChanges');
        if (g.rng() < 0.15) setTimeout(() => { g.run([sayT(null, LOCKER_NOTES[Math.floor(g.rng() * LOCKER_NOTES.length)])]); g.stat('lockerNotes'); }, 900);
      }
      if (td.status && !td.pm && !td.skipped && !SCHOOL_MAPS.includes(map) && g.minutes >= T.bell && g.minutes < T.pmEnd && schoolDay(g)) {
        td.skipped = true; g.stat('skippedClass'); g.bus.emit('schoolSkipped', {});
        g.mail(`skip_${g.day}`, 'Mum', 'Ms. Fujita called the ship to say you left school early today. Is everything okay, sweetie? Call me if you need to talk.');
      }
    });
  },
});

// ---------- items ----------
const icon = (shape, c) => itemIcon(shape, { c });
registerMany('item', {
  school_curry_bread: { name: 'Curry Bread', desc: 'The kiosk\'s most fought-over bread. Still warm.', cat: 'food', price: 70, energy: 25, mood: 4, icon: icon('bread', RAMPS.wood[2]), tags: ['bread', 'spicy'] },
  school_melon_bread: { name: 'Melon Bread', desc: 'Crunchy sugar top, soft inside. No melon at all.', cat: 'food', price: 55, energy: 18, mood: 5, icon: icon('bread', RAMPS.butter[2]), tags: ['bread', 'sweet'] },
  school_yakisoba_bread: { name: 'Yakisoba Bread', desc: 'Noodles in a bun. Genius.', cat: 'food', price: 75, energy: 28, mood: 3, icon: icon('bread', RAMPS.hairGinger[2]), tags: ['bread'] },
  school_certificate: { name: 'Honour Roll Certificate', desc: 'Framed proof that you made the top three. Grandma will want a copy.', cat: 'decor', price: 0, icon: icon('paper', RAMPS.butter[2]), tags: ['decor'] },
  school_gold_sticker: { name: 'Gold Sticker', desc: 'For perfect attendance, from Ms. Fujita. Shiny!', cat: 'misc', price: 0, icon: icon('star', RAMPS.butter[2]) },
  school_club_pin: { name: 'Club Pin', desc: 'A little enamel pin for reaching club rank 3.', cat: 'clothes', price: 0, icon: icon('star', RAMPS.sky[2]) },
  school_medal: { name: 'Sports Day Medal', desc: 'Class 2-B, champions! It hangs on a red ribbon.', cat: 'decor', price: 0, icon: icon('coin', RAMPS.ribbon[2]) },
});

export { study, seat, joinClub, clubToday, pendingHW, showRanking };
