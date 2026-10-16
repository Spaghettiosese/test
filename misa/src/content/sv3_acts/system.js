// Story Acts runtime: pacing catch-up (no chapter can be missed for good), the typhoon weather, act-completion hooks for
// Act IV (actsComplete + act2_done/act3_done + state.sv3_acts.actsEnding), the Year 2 evaluation trigger, achievements,
// and console helpers:  __misa.sv3.jump(n)  (jump to chapter n, 10..40)  /  __misa.sv3.status()
import { register, get, all, features } from '../../core/registry.js';
import { seasonOf, dateOf } from '../../core/time.js';
import { storyState } from '../../systems/quests.js';
import { CHAPTERS, S, supportScore, supportParts, resultOf, ACT2, ACT3 } from './state.js';

const nums = () => Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
const quiet = (g, qid) => { g.state.quests[qid] = { ...(g.state.quests[qid] || {}), stage: 99, done: true, doneDay: g.day }; };

// Mark the original spring story (prologue .. finale) as done, e.g. when jumping straight into Act II.
export function fastMain(g) {
  const s = storyState(g);
  for (const c of all('chapter')) {
    if (c.n > 9 || !c.quest || c.id.startsWith('sv3_')) continue;
    s.started[c.n] ??= g.day; s.doneDay[c.n] = s.doneDay[c.n] ?? g.day; g.setFlag(`chapter_${c.n}_done`); quiet(g, c.quest);
  }
  for (const f of ['lantern_lit', 'postgame', 'keeper_title', 'journal_found']) g.setFlag(f);
  s.chapter = Math.max(s.chapter || 0, 9);
}

// Complete chapter n without playing it (deadline passed or console jump). Applies the chapter's default flags.
export function skipChapter(g, n, why = 'late') {
  const c = CHAPTERS[n];
  if (!c || g.flag(`chapter_${n}_done`)) return false;
  const s = storyState(g);
  s.started[n] ??= g.day; s.chapter = Math.max(s.chapter || 0, n);
  if (c.skip) c.skip(g);
  S(g).skipped[n] = g.day;
  const ch = get('chapter', `sv3_ch${n}`);
  if (why === 'late' && ch) g.mail(`sv3_skip_${n}`, 'Misa', `Notes on "${ch.name}": ${ch.summary}`);
  g.completeQuest(c.qid);
  return true;
}
const busy = (g) => !!(g.scenes && g.scenes.has && g.scenes.has('cutscene'));
export function catchUp(g) {
  if (busy(g)) return 0;
  let k = 0;
  for (const n of nums()) {
    const c = CHAPTERS[n];
    if (g.flag(`chapter_${n}_done`)) continue;
    if (c.by === undefined || !g.flag(`chapter_${n - 1}_done`)) break;
    const late = g.day > c.by || (g.day === c.by && c.byMin && g.minutes >= c.byMin);
    if (!late) break;
    if (skipChapter(g, n)) k++;
  }
  return k;
}

register('system', 'sv3_acts', {
  init(game) {
    game.bus.on('dayStart', () => catchUp(game));
    game.bus.on('hour', () => catchUp(game));
    // the typhoon: Chapter 17 needs a real storm once the clock tower is mended
    game.bus.on('sleep', () => {
      const t = game.day + 1, s = storyState(game);
      if (game.flag('chapter_16_done') && s.started[17] === undefined && seasonOf(t) === 'autumn' && dateOf(t) >= 10 && t <= 76) game.state.tomorrowWeather = 'storm';
    });
    game.bus.on('svEvaluation', ({ year }) => { if (year >= 2) { game.setFlag('a3_eval_seen'); setTimeout(() => game.story && game.story.checkChapters(null), 50); } });
    game.bus.on('chapterDone', ({ n }) => {
      if (n === ACT2[1]) { game.setFlag('act2_done'); S(game).act2Ending ||= game.flag('a2_finale') || null; }
      if (n === ACT3[1]) {
        game.setFlag('act3_done'); const s = S(game); s.actsEnding ||= 'stay';
        game.bus.emit('actsComplete', { ending: s.actsEnding, act2: s.act2Ending, act3: s.act3Result, support: supportScore(game) });
      }
    });
    game.bus.on('gameLoaded', () => { S(game); });
    // Tide Lantern steps toast progress
    game.bus.on('sv3Letter', ({ k }) => { game.stat && game.stat('tidekeeperLetters'); });

    const jump = (n, o = {}) => {
      const g = game;
      if (n >= 10 && !g.flag('chapter_9_done')) fastMain(g);
      for (const m of nums()) if (m < n) skipChapter(g, m, 'jump');
      const c = CHAPTERS[n]; if (!c) return false;
      if (o.hall !== false && n >= 25) g.setFlag('community_restored');
      g.state.time.day = Math.max(g.day, c.day || g.day); g.state.time.minutes = n === 24 || n === 34 || n === 39 || n === 40 ? 20 * 60 : 9 * 60;
      if (n === 17) g.state.weather = 'storm';
      g.bus.emit('dayStart', { day: g.day });
      setTimeout(() => g.story.checkChapters(null), 0);
      return true;
    };
    game.sv3 = { jump, skipChapter: (n) => skipChapter(game, n, 'jump'), catchUp: () => catchUp(game), support: () => ({ score: supportScore(game), parts: supportParts(game), result: resultOf(supportScore(game)) }),
      status: () => ({ act2: game.flag('act2_done'), act3: game.flag('act3_done'), ending: S(game).actsEnding, chapters: nums().filter((n) => game.flag(`chapter_${n}_done`)).length }) };
  },
});

for (const [id, name, desc, cond] of [
  ['sv3_act2', 'The Tidekeeper\'s Keeper', 'Finish Act II and wake all five Tide Lanterns.', 'flag:act2_done'],
  ['sv3_act3', 'A Second Spring and Beyond', 'Finish Act III: the Second Year.', 'flag:act3_done'],
  ['sv3_hall_saved', 'Lantern With a Roof', 'Win the public hearing and save the Community Hall and the school.', 'flag:a3_result=saved'],
  ['sv3_letters', 'Dear Keeper', 'Read all fifteen Tidekeeper letters of Act II.', (g) => Object.keys(S(g).letters).filter((k) => +k <= 15).length >= 15],
]) register('achievement', id, { name, desc, icon: 'i_star', cond });

features('Story Acts', [
  'Pacing safety net: every chapter has a latest day, and a missed chapter is summarised in a note from Misa so the story always reaches the Winter 28 finale and the Year 2 cliffhanger',
  'Typhoon day: once the clock tower is mended an autumn storm is forced so the typhoon chapter can happen',
  'Act IV hook: act2_done and act3_done flags, an actsComplete bus event and the actsEnding (stay, travel or study) stored in state.sv3_acts',
  'Four Story Acts achievements: finishing Act II, finishing Act III, saving the Hall and reading all fifteen Tidekeeper letters',
  'Console helper __misa.sv3.jump(n) jumps to any Act II or Act III chapter (10 to 40) for testing',
]);
