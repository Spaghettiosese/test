// School minigame registrations, the School phone app, the report card scene and the feature list.
import { register, registerMany, features } from '../../core/registry.js';
import { seasonOf, dateOf } from '../../core/time.js';
import { MathGame, mathBot } from '../../minigames/school/math.js';
import { KanjiGame, kanjiBot } from '../../minigames/school/japanese.js';
import { LabGame, labBot } from '../../minigames/school/science.js';
import { TimelineGame, timelineBot } from '../../minigames/school/history.js';
import { ScrambleGame, scrambleBot } from '../../minigames/school/english.js';
import { ArtGame, artBot, RhythmGame, rhythmBot, PEGame, peBot } from '../../minigames/school/arts.js';
import { QuizGame, quizBot, AstroGame, astroBot, SoccerGame, soccerBot, HaikuGame, haikuBot, GreenhouseGame, greenhouseBot, CookOffGame, cookBot } from '../../minigames/school/clubs.js';
import { TugGame, tugBot, BreadGame, breadBot, CafeGame, cafeBot, BoardGame, boardBot } from '../../minigames/school/events.js';
import { K, INK, rect, txt, txtC, txtR, card, wrapPx, inRect } from '../../minigames/school/common.js';
import { SUBJECTS, SUBJECT_IDS, TIMETABLE, CLUBS, DAYNAMES, examInfo, specialDay, classesFor, isBreak, T } from './data.js';
import { subjectGrade, gradeLetter, overall, schoolDay, clubRank, latestRanking } from './school.js';

const mk = (C) => (g, o) => new C(g, o || {});
registerMany('minigame', {
  class_math: { title: 'Maths: Number Bubbles', make: mk(MathGame), bot: mathBot, music: 'minigame' },
  class_japanese: { title: 'Japanese: Kanji Trace', make: mk(KanjiGame), bot: kanjiBot },
  class_science: { title: 'Science: Reaction Lab', make: mk(LabGame), bot: labBot },
  class_history: { title: 'History: Timeline', make: mk(TimelineGame), bot: timelineBot },
  class_english: { title: 'English: Word Scramble', make: mk(ScrambleGame), bot: scrambleBot },
  class_art: { title: 'Art: Pixel Copy', make: mk(ArtGame), bot: artBot },
  class_music: { title: 'Music: Recorder Rhythm', make: mk(RhythmGame), bot: rhythmBot },
  class_pe: { title: 'PE', make: mk(PEGame), bot: peBot },
  school_homework: { title: 'Homework', make: mk(QuizGame), bot: quizBot },
  school_board: { title: 'Class duty', make: mk(BoardGame), bot: boardBot },
  club_astro: { title: 'Astronomy Club', make: mk(AstroGame), bot: astroBot },
  club_art: { title: 'Art Club', make: (g, o) => new ArtGame(g, { ...(o || {}), free: true }), bot: artBot },
  club_music: { title: 'Music Club', make: (g, o) => new RhythmGame(g, { club: true, ...(o || {}) }), bot: rhythmBot },
  club_soccer: { title: 'Soccer Club', make: mk(SoccerGame), bot: soccerBot },
  club_nature: { title: 'Nature Club', make: mk(GreenhouseGame), bot: greenhouseBot },
  club_lit: { title: 'Literature Club', make: mk(HaikuGame), bot: haikuBot },
  club_cook: { title: 'Cooking Club', make: mk(CookOffGame), bot: cookBot },
  sports_tug: { title: 'Tug-of-war', make: mk(TugGame), bot: tugBot },
  sports_bread: { title: 'Bread-eating race', make: mk(BreadGame), bot: breadBot },
  festival_cafe: { title: 'Class cafe', make: mk(CafeGame), bot: cafeBot },
});

// ---------- report card ----------
const COMMENT = { S: 'Outstanding work all term.', A: 'Excellent effort, keep it up!', B: 'Solid and steady progress.', C: 'Good effort. Keep practising!', D: 'A tricky term. You will get there!', '-': 'No marks yet.' };
class ReportScene {
  constructor(game, rep, onDone) { Object.assign(this, { name: 'school_report', game, rep, onDone, t: 0, music: 'school' }); }
  update(dt, input) { this.t += dt; if (this.t > 0.8 && (input.pressed.has(' ') || input.pressed.has('enter') || input.pressed.has('e') || input.justDown)) { this.game.scenes.pop(this); this.onDone && this.onDone(); } }
  draw(g) {
    const r = this.rep;
    rect(g, K.navy[1], 0, 0, 320, 224); for (let y = 0; y < 224; y += 8) for (let x = (y / 8) % 2 ? 0 : 4; x < 320; x += 8) rect(g, K.navy[0], x, y, 1, 1);
    card(g, 22, 8, 276, 208, { fill: K.paper[4] });
    rect(g, K.ribbon[2], 23, 9, 274, 16); rect(g, K.ribbon[3], 23, 9, 274, 1);
    txtC(g, `Report card: ${r.term} term`, 160, 14, K.paper[4], K.ribbon[0]);
    txt(g, 'Misa Aoki, class 2-B', 34, 32, INK); txtR(g, 'Hoshimori High', 286, 32, K.ink[3]);
    rect(g, K.paper[2], 30, 42, 260, 1);
    SUBJECT_IDS.forEach((id, i) => {
      const v = r.grades[id], L = gradeLetter(v), y = 48 + i * 15;
      if (i % 2) rect(g, K.paper[3], 30, y - 3, 260, 15);
      txt(g, SUBJECTS[id].name, 36, y + 2, INK);
      txtR(g, v === null ? '-' : String(v), 132, y + 2, K.ink[3]);
      rect(g, INK, 140, y - 1, 13, 11); rect(g, L === 'S' ? K.butter[2] : L === 'A' ? K.mint[3] : L === 'B' ? K.sky[3] : K.paper[2], 141, y, 11, 9);
      txtC(g, L, 147, y + 2, INK); txt(g, COMMENT[L], 160, y + 2, K.ink[2]);
    });
    const y = 172;
    rect(g, K.paper[2], 30, y - 4, 260, 1);
    txt(g, `Average: ${r.avg === null ? '-' : r.avg} (${gradeLetter(r.avg)})`, 36, y, INK);
    txt(g, `Attendance: ${r.absent} absent, ${r.late} late`, 36, y + 10, INK);
    txt(g, r.rank ? `Class rank: ${r.rank} (Rina: ${r.rina})` : 'Class rank: no exams yet', 36, y + 20, INK);
    txtR(g, 'A. Fujita', 286, y + 20, K.ribbon[1]);
    if (this.t > 0.8) txtC(g, 'Press space', 160, 208, K.ink[3]);
  }
}
register('scene', 'school_report', { make: (game, rep, onDone) => new ReportScene(game, rep, onDone) });

// ---------- School phone app ----------
const TABS = ['Today', 'Week', 'Grades', 'Homework', 'Club'];
register('phoneApp', 'school', {
  name: 'School', icon: 'i_school', order: 25,
  badge: (g) => (g.state.school ? g.state.school.hw.filter((h) => !h.done).length : 0),
  open(g, app) { app.state.tab ??= 0; },
  update(dt, input, g, app) {
    const k = input.pressed, st = app.state;
    if (k.has('arrowright') || k.has('d')) st.tab = (st.tab + 1) % TABS.length;
    if (k.has('arrowleft') || k.has('a')) st.tab = (st.tab + TABS.length - 1) % TABS.length;
    if (input.justDown) TABS.forEach((_, i) => { if (inRect(input.mx, input.my, [app.area.x + i * 58, app.area.y, 56, 14])) st.tab = i; });
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, s = game.state.school;
    TABS.forEach((t, i) => { const on = i === st.tab; rect(g, INK, x + i * 58, y, 56, 14); rect(g, on ? K.butter[3] : K.paper[2], x + i * 58 + 1, y + 1, 54, on ? 13 : 12); txtC(g, t, x + i * 58 + 28, y + 3, INK); });
    const top = y + 20;
    if (st.tab === 0) {
      const td = s.today.day === game.day ? s.today : {}, ex = examInfo(game.day), sp = specialDay(game.day), cls = classesFor(game.day);
      if (sp === 'culture') { txt(g, 'Culture Festival today! Class cafe, stage and exhibitions.', x + 4, top, INK); }
      else if (!schoolDay(game)) txt(g, seasonOf(game.day) === 'summer' ? 'Summer break! No school until autumn.' : isBreak(game.day) ? 'School holiday today.' : 'No school today. Enjoy the weekend!', x + 4, top, INK);
      else {
        txt(g, sp === 'sports' ? 'Sports Day! Events on the field all day.' : ex ? `${ex.kind === 'midterm' ? 'Midterm' : 'Final'} exams, day ${ex.idx + 1}` : 'Today\'s classes', x + 4, top, K.ribbon[1]);
        const rows = [['8:30', 'Homeroom', td.status ? (td.status === 'late' ? 'late' : 'present') : '']];
        if (!sp && cls) { rows.push(['9:00', ex ? 'Exams' : SUBJECTS[cls[0]].name, td.am ? 'done' : '']); rows.push(['12:30', 'Lunch', td.lunch ? 'done' : '']); rows.push(['1:20', ex ? 'Review' : SUBJECTS[cls[1]].name, td.pm ? 'done' : '']); rows.push(['3:30', 'Dismissal', td.dismissed ? 'done' : '']); }
        if (s.club && CLUBS[s.club].days.includes(game.weekday)) rows.push(['3:30', CLUBS[s.club].name, td.club ? 'done' : '']);
        rows.forEach(([t, n, d], i) => { txt(g, t, x + 8, top + 14 + i * 11, K.ink[3]); txt(g, n, x + 50, top + 14 + i * 11, INK); if (d) txt(g, d, x + 170, top + 14 + i * 11, d === 'late' ? K.coral[1] : K.forest[1]); });
        txt(g, 'Sit at your desk in classroom 2-B to attend.', x + 4, top + 100, K.ink[3]);
      }
      const tk = Object.keys(s.prep).pop();
      if (tk) txt(g, `Exam prep this term: ${Math.min(20, s.prep[tk])}% (max 20)`, x + 4, top + 120, K.sky[1]);
      txt(g, `Attendance: ${game.state.attendance.present || 0} on time, ${game.state.attendance.late || 0} late, ${game.state.attendance.absent || 0} absent`, x + 4, top + 132, K.ink[3]);
    } else if (st.tab === 1) {
      txt(g, 'Weekly timetable', x + 4, top, K.ribbon[1]);
      TIMETABLE.forEach((p, i) => { const yy = top + 14 + i * 16, on = i === game.weekday; if (on) rect(g, K.butter[3], x, yy - 3, w, 14); txt(g, DAYNAMES[i], x + 8, yy, INK); rect(g, SUBJECTS[p[0]].color[2], x + 44, yy - 2, 4, 10); txt(g, `AM ${SUBJECTS[p[0]].name}`, x + 52, yy, INK); rect(g, SUBJECTS[p[1]].color[2], x + 150, yy - 2, 4, 10); txt(g, `PM ${SUBJECTS[p[1]].name}`, x + 158, yy, INK); });
      txt(g, 'Exams: days 10-11 and 24-25 (winter: 17-18)', x + 4, top + 100, K.ink[3]);
      txt(g, 'Sports Day: spring 19. Culture Festival: autumn 20-21', x + 4, top + 112, K.ink[3]);
      txt(g, 'Summer is a break. Winter break from winter 21.', x + 4, top + 124, K.ink[3]);
    } else if (st.tab === 2) {
      SUBJECT_IDS.forEach((id, i) => { const v = subjectGrade(game, id), L = gradeLetter(v), yy = top + i * 14; txt(g, SUBJECTS[id].name, x + 8, yy, INK); rect(g, K.paper[2], x + 80, yy, 120, 6); if (v !== null) rect(g, SUBJECTS[id].color[2], x + 80, yy, Math.round(1.2 * v), 6); txt(g, v === null ? '-' : `${v}  ${L}`, x + 210, yy, INK); });
      const o = overall(game), r = latestRanking(game);
      txt(g, `Overall: ${o === null ? '-' : o} (${gradeLetter(o)})`, x + 8, top + 118, K.ribbon[1]);
      txt(g, r ? `Last ranking: ${r.rank} of ${r.list.length}  (Rina ${r.rina})` : 'No rankings yet', x + 8, top + 130, INK);
      txt(g, 'Grades: classes 50%, homework 20%, exams 30%', x + 8, top + 142, K.ink[3]);
    } else if (st.tab === 3) {
      const hw = s.hw.slice().reverse().slice(0, 10);
      if (!hw.length) txt(g, 'No homework yet. Lucky!', x + 4, top, K.ink[3]);
      hw.forEach((h, i) => { const yy = top + i * 12, late = !h.done && game.day > h.due; rect(g, INK, x + 4, yy - 1, 8, 8); rect(g, h.done ? K.mint[3] : K.paper[4], x + 5, yy, 6, 6); txt(g, `${SUBJECTS[h.subject].name} worksheet`, x + 18, yy, INK); txt(g, h.done ? `done${h.late ? ' (late)' : ''} ${Math.round(h.score * 100)}` : late ? 'late: half credit' : 'due tomorrow', x + 150, yy, h.done ? K.forest[1] : late ? K.coral[1] : K.ink[3]); });
      txt(g, 'Do homework at your desk at home or in the library.', x + 4, top + 136, K.ink[3]);
    } else {
      if (!s.club) { txt(g, 'Not in a club yet. Sign up at the school notice board!', x + 4, top, INK); Object.entries(CLUBS).filter(([, c]) => !c.when || game.check(c.when)).forEach(([, c], i) => txt(g, `${c.name}: ${c.blurb}`.slice(0, 70), x + 4, top + 14 + i * 11, K.ink[3])); return; }
      const C = CLUBS[s.club], rank = clubRank(game, s.club);
      txt(g, C.name, x + 4, top, K.ribbon[1]); txt(g, `Rank ${rank} / 5   Points ${s.clubPts[s.club] || 0}`, x + 150, top, INK);
      wrapPx(C.blurb, 280).forEach((l, i) => txt(g, l, x + 4, top + 12 + i * 10, INK));
      txt(g, `Meets ${C.days.map((d) => DAYNAMES[d]).join(' and ')}, 3:30 to 5:30`, x + 4, top + 34, K.ink[3]);
      if (s.club === 'art' && s.paintings.length) {
        txt(g, 'Gallery', x + 4, top + 50, K.ribbon[1]);
        const PAL = [K.paper[4], K.ink[1], K.coral[2], K.butter[2], K.sky[2], K.forest[2], K.wood[2], K.lilac[2]];
        s.paintings.slice(0, 6).forEach((p, i) => { const rows = p.px.split('/'), ox = x + 4 + i * 46, oy = top + 62; rect(g, INK, ox - 1, oy - 1, rows.length * 3 + 2, rows.length * 3 + 2); rows.forEach((r, yy) => [...r].forEach((c, xx) => rect(g, PAL[+c], ox + xx * 3, oy + yy * 3, 3, 3))); });
      }
      if (s.club === 'literature' && s.poems.length) { txt(g, 'Club zine: my latest haiku', x + 4, top + 50, K.ribbon[1]); s.poems[0].lines.forEach((l, i) => txt(g, l, x + 12, top + 62 + i * 10, INK)); }
      if (s.club === 'astronomy') txt(g, `Constellations logged: ${Object.keys(game.state.collections.constellation || {}).length}`, x + 4, top + 50, INK);
    }
  },
});

features('School', [
  'School days at Hoshimori High: homeroom at 8:30, a morning class, lunch, an afternoon class and dismissal at 3:30',
  'Sit at your desk in classroom 2-B to attend; arriving before 8:30 counts as on time, later as late',
  'Gentle attendance: missing a day sends a kind message from Ms. Fujita instead of a penalty',
  'Leaving campus during school hours counts as skipping, and Mum sends a worried text',
  'Ms. Fujita\'s homeroom: daily announcements, terrible science puns and exam reminders',
  'First school day: Ms. Fujita introduces Misa to class 2-B and seats her next to Kai',
  'Weekly timetable of 8 subjects: Maths, Japanese, English, Science, History, Art, Music and PE',
  'School bells ring for homeroom, lunch, afternoon class and home time',
  'Morning PA announcements scroll along the bottom of the screen at school',
  'Every class is a close-up minigame whose score becomes that subject\'s grade',
  'Class minigames get harder as Misa\'s Study skill grows',
  'S, A, B, C or D grade after every class, plus Study XP',
  'Dozing off: when energy is very low, Misa\'s eyelids droop mid-class and you tap to stay awake',
  'Called on by the teacher: answer a question in front of the class for teacher friendship',
  'Passing notes with classmates in class, with a small chance of a funny scolding',
  'Pop quizzes: sometimes a teacher springs a quick three-question quiz',
  'Lunch break: the first time, choose who to eat with; after that pick a friend and a place each day',
  'Eating lunch with Kai, Suzu, Hina, Rina or Theo raises friendship and restores energy',
  'School kiosk with curry, melon and yakisoba bread in limited daily stock',
  'Kai sometimes races you to the last curry bread',
  'Free time at lunch to explore the school until the afternoon bell',
  'Shoe lockers: change into indoor shoes on arrival; notes and sweets sometimes appear inside',
  'Nurse\'s office: rest for an hour once a day to restore 30 energy',
  'Class duty on Wednesdays: wipe the chalkboard clean after school',
  'Exam rankings for class 2-B on the notice board, with Rina as your rival',
  'Rina reacts to the rankings, and beating her wins her grudging respect',
  'Report card at the end of each term: grades, teacher comments, attendance and class rank',
  'Mum and Dad text you about your report card',
  'Honour roll: a top-3 ranking pays 3000 coins and gives a framed certificate',
  'Perfect attendance for a term earns a gold sticker and a note from Ms. Fujita',
  'No school in summer, on the Spring 1 holiday or during winter break',
  'Rainy days move PE into the gym for badminton',
]);
features('Classes', [
  'Maths "Number Bubbles": pop pairs of rising bubbles that add up to the target',
  'Japanese "Kanji Trace": trace 17 kanji stroke by stroke inside a tolerance band',
  'Science "Reaction Lab": mix drops of red, yellow and blue to match a target colour',
  'History "Timeline": swap event cards into order across 6 themed timelines',
  'English "Word Scramble": unscramble vocabulary words by typing or clicking tiles, with hints',
  'Art "Pixel Copy": memorise an 8x8 picture and redraw it from memory',
  'Music "Recorder Rhythm": play falling notes in three lanes along to recorder songs',
  'PE sprint in spring: alternate keys to race Kai, Rina and Hina',
  'PE dodgeball in autumn: dodge balls and catch the golden ones',
  'PE jump rope in winter: time your jumps as the rope speeds up',
  'Every class minigame works with the mouse or the keyboard and opens with a how-to-play card',
]);
features('Grades and exams', [
  'Grades per subject from classes (50%), homework (20%) and exams (30%)',
  'Homework worksheets handed out after class on most days, done at the home desk as a 30-second quiz',
  'Late homework still counts for half credit',
  'Study for exams at your desk or in the library to raise your exam preparation bonus (up to 20%)',
  'The library is a better study spot: a little more Study XP',
  'Cram nights after midnight give extra prep but leave Misa groggy the next morning',
  'Flash card review at the desk for quick Study XP',
  'Midterms and finals on the calendar\'s exam days, as a series of exam versions of the class games',
  'School phone app: today\'s classes, the weekly timetable, grades, homework list and club',
  'Summer break study turns into summer diary pages',
]);
features('Clubs', [
  'Join one of 7 clubs at the notice board or a club room door; switch once a term',
  'Clubs meet after school two days a week, with their own activity and rewards',
  'Astronomy Club (after it is revived): connect the stars of constellations into a club logbook',
  'Art Club: paint freely on a 12x12 canvas; paintings fill a club gallery in the phone',
  'Music Club: rhythm practice with festival songs',
  'Soccer Club: penalty kicks against Kai with aim and power timing',
  'Nature Club: tend the greenhouse plants by watering, weeding and shooing bugs',
  'Literature Club: build 5-7-5 haiku from word tiles for the club zine',
  'Cooking Club: follow the recipe card, stir on time and get judged out of 10',
  'Club ranks 1 to 5 with a rank-up scene and a club pin at rank 3',
  'Club activities raise friendship with a club member and a matching skill',
]);
features('School events', [
  'Sports Day (spring 19): class relay, tug-of-war and a bread-eating race against other classes',
  '2-B wins a Sports Day medal by winning two of the three events',
  'Culture Festival (autumn 20-21): work a shift at the 2-B class cafe for the class fund',
  'Play the Culture Festival stage with Theo in a band rhythm set',
  'Visit the art club wall and Hina\'s bug exhibition at the Culture Festival',
]);
