// Writing: a writing desk in the library, plot-card short stories (minigame), the library contest, Suzu's novel club, a long
// 'My Novel' project of eight chapters that unlock as Misa lives her life, NPC reviews, and your books on the library shelf.
// Try it: __misa.give('sv4h_notebook'); __misa.warp('library', 4, 5, 'up')
import { register, get, all, features } from '../../core/registry.js';
import { seasonOf, dateOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { S, clamp, item, gain, addRibbon, rivals, rankOf, say, N, call, stickers, idle, nameOf, addObjects, stat, pick } from './state.js';
import { addBuff } from '../economy/core.js';
import { seasonKey } from './photo.js';
import { GENRES, GENRE_IDS, storyText, storyTitle } from '../../minigames/sv4_hobbies/plot.js';
import '../../minigames/sv4_hobbies/plot.js';

// ---------------------------------------------------------------- items
item('sv4h_notebook', 'Writing notebook', 'misc', 8, 'book', K.sky[3], 'A clean notebook for one short story.', { c2: K.paper[4], tags: ['writing'] });
const READ = { adventure: ['perk', 'Your own adventure story gives you a spring in your step.'], mystery: ['calm', 'You solve your own mystery again, calmly this time.'], romance: ['cozy', 'The romance makes your heart warm.'], fantasy: ['sv4h_inspired', 'Dragons and lanterns leave you full of ideas.'], daily: ['sv4h_bookish', 'The quiet little tale makes the afternoon glow.'], comedy: ['sv4h_tune', 'You giggle at your own jokes and hum a bit.'] };
function read(id, text, ...buffs) { return (g) => { const w = S(g).write; w.read ||= {}; if (w.read[id] === g.day) { g.toast('You already enjoyed that book today.'); return true; } w.read[id] = g.day; for (const b of buffs) addBuff(g, b); g.addMood(5); g.advance(30); g.toast(text, 'i_star'); g.stat('booksReread'); return true; }; }
for (const [gn, G] of Object.entries(GENRES)) item('book_sv4h_' + gn, `Misa's ${G.name} story`, 'book', 90, 'book', G.c, `A short ${G.name.toLowerCase()} story written by Misa and printed by the library. Reading it gives a small boost.`, { c2: K.paper[4], tags: ['book', 'writing', 'mine', gn], useLabel: 'Read', use: read('book_sv4h_' + gn, READ[gn][1], READ[gn][0]) });
item('book_sv4h_my_novel', 'My Novel', 'book', 420, 'book', K.ribbon[2], 'Eight chapters about a year in Hoshimori Bay. Reading it gives a long cosy glow.', { c2: K.butter[3], tags: ['book', 'writing', 'mine', 'novel'], useLabel: 'Read', use: read('book_sv4h_my_novel', 'You read your whole novel again. It is good!', 'cozy', 'sv4h_inspired', 'sv4h_bookish') });

// ---------------------------------------------------------------- reviews from the cast
const REV = {
  suzu: ['The structure is tidy and the ending lands.', 'I liked the voice. Tighten the middle?', 'There are good ideas. Keep writing, seriously.'],
  rina: ['Not bad. I would have chosen a stronger title, though.', 'Fine for a first draft. I will grade it a B.', 'I read it twice and told nobody.'],
  kai: ['I do not read much but this one got me!', 'Is there a part two? Add a soccer scene.', 'Nice. Wait, who is the girl in chapter two?'],
  theo: ['The mood is very you. I could draw this.', 'I liked the quiet bits best.', 'Can I borrow a line for a sketch?'],
  hana: ['Oh my dear, I cried on the bus!', 'Lovely handwriting in your head, sweetheart.', 'You get your storytelling from me.'],
  mika: ['A customer left it on a table and it was the best read of my week.', 'I will put a copy by the cafe till.', 'The story pairs well with a latte.'],
};
export function review(g, entry, tag) {
  const ids = Object.keys(REV).filter((id) => get('npc', id)); if (!ids.length) return null;
  const id = ids[Math.floor(g.rngFor('sv4hrev' + tag)() * ids.length)], q = entry.score >= 0.75 ? 0 : entry.score >= 0.5 ? 1 : 2, w = S(g).write;
  w.reviews++; g.addFriend(id, q === 0 ? 3 : 1);
  g.mail(`sv4h_rev_${tag}`, nameOf(id), `About "${entry.title}": ${REV[id][q]}`);
  return id;
}

// ---------------------------------------------------------------- short stories
const wr = (g) => S(g).write;
const dayLeft = (g) => { const w = wr(g); if (w.day !== g.day) { w.day = g.day; w.wrote = 0; } return 2 - w.wrote; };
export function addStory(g, res, seed) {
  const w = wr(g), genre = Object.entries(res.picks.reduce((m, p) => ((m[p.genre] = (m[p.genre] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0][0];
  const e = { id: w.stories.length + 1, day: g.day, title: res.title, genre, score: Math.round(res.acc * 100) / 100, text: storyText(res.picks), sent: false };
  w.stories.push(e); w.wrote++;
  const cur = w.shelf[genre]; if (!cur || e.score >= cur.score) w.shelf[genre] = { title: e.title, score: e.score, day: g.day };
  g.give('book_sv4h_' + genre, 1, true); gain(g, 'writing', 12 + e.score * 22); g.addMood(4); g.advance(60); g.addEnergy(-5);
  g.stat('storiesWritten'); review(g, e, 's' + e.id);
  return e;
}
async function writeStory(g) {
  if (dayLeft(g) <= 0) return g.run([N('Two stories a day is plenty. Let the ideas rest.')]);
  if (!g.has('sv4h_notebook')) return g.run([N('You need a notebook. The stationery stall in the shotengai sells them.')]);
  g.take('sv4h_notebook', 1);
  const seed = g.day * 31 + wr(g).stories.length * 7 + 3;
  const r = await g.minigame('sv4h_plot', { level: g.skillLevel('writing') + (g.hasBuff && g.hasBuff('sv4h_steady') ? 2 : 0), seed, noResult: true });
  if (!r || r.quit || !r.data) { g.give('sv4h_notebook', 1, true); return; }
  const e = addStory(g, r.data, seed);
  await g.run([N(`"${e.title}" (${GENRES[e.genre].name}, ${Math.round(e.score * 100)}%)`), N(e.text), N(`A copy joined your bag and the library shelf. Mail may bring reviews.`)]);
}

// ---------------------------------------------------------------- My Novel
const best = (g) => { const f = all('npc').filter((n) => !n.hidden && g.hearts(n.id) > 0).sort((a, b) => g.hearts(b.id) - g.hearts(a.id))[0]; return f ? f.name : 'someone kind'; };
const hearty = (g) => all('npc').filter((n) => !n.hidden && g.hearts(n.id) >= 3).length;
const fest = (g) => { try { return g.check('festivalsYear>=1'); } catch { return false; } };
export const CHAPTERS = [
  { t: 'Boxes and Buttons', hint: 'Live in Hoshimori Bay for a day.', ok: (g) => g.day >= 2, text: (g) => `On day ${g.day} the boxes were still stacked by the door, and every button in Grandma's little house clicked for the very first time.` },
  { t: 'The New Girl', hint: 'Chat with 6 people.', ok: (g) => stat(g, 'talks') >= 6, text: (g) => `Misa had talked to ${stat(g, 'talks')} people already, and ${best(g)} had remembered her name.` },
  { t: 'Dirt Under My Nails', hint: 'Plant, water or forage 6 times.', ok: (g) => stat(g, 'planted') + stat(g, 'watered') + stat(g, 'foraged') >= 6, text: (g) => `Her hands smelled of soil. She had planted ${stat(g, 'planted')} seeds and picked ${stat(g, 'foraged')} wild things, and she was proud of every one.` },
  { t: 'Salt and Stars', hint: 'Find 3 shells, fish or gems.', ok: (g) => stat(g, 'shellsFound') + stat(g, 'fishCaught') + stat(g, 'mineralsFound') >= 3, text: (g) => `The bay gave her ${stat(g, 'shellsFound') + stat(g, 'fishCaught') + stat(g, 'mineralsFound')} small gifts: shells, fish and shining stones. The tide kept the rest.` },
  { t: 'A Gift Well Given', hint: 'Give 3 gifts.', ok: (g) => stat(g, 'gifts') >= 3, text: (g) => `She had given ${stat(g, 'gifts')} gifts by now, and learned that the best ones are small and a little bit personal.` },
  { t: 'Lanterns', hint: 'Attend a festival.', ok: fest, text: () => 'The lanterns swayed over the square. For one night the whole bay felt like one big family.' },
  { t: 'The Quiet Rain', hint: 'Reach day 14.', ok: (g) => g.day >= 14, text: (g) => `It rained on day ${g.day}, softly, and Misa wrote by the window while ${best(g)} sent a message that made her smile.` },
  { t: 'Seven Hearts', hint: 'Reach 3 hearts with 3 people.', ok: (g) => hearty(g) >= 3, text: (g) => `${hearty(g)} friends had a place in her heart now. She understood what the paper star had been trying to say.` },
];
export const novelDone = (g) => wr(g).novel.done.length;
export const chapterReady = (g) => { const done = wr(g).novel.done; const i = CHAPTERS.findIndex((_, k) => !done.includes(k)); return i >= 0 && CHAPTERS[i].ok(g) ? i : -1; };
export function writeChapter(g, i, tone) {
  const w = wr(g), c = CHAPTERS[i];
  w.novel.done.push(i); w.novel.tone[i] = tone; (w.novel.text ||= [])[i] = c.text(g);
  gain(g, 'writing', 25 + i * 3); g.addMood(5); g.advance(90); g.addEnergy(-6); g.stat('chaptersWritten');
  g.bus.emit('chapterWritten', { n: i + 1, tone });
  const e = { title: c.t, score: 0.55 + 0.05 * i + (tone === 'hopeful' ? 0.1 : 0.05) };
  if ((i + 1) % 2 === 0) review(g, e, 'c' + i);
  if (w.novel.done.length === CHAPTERS.length) {
    g.setFlag('sv4h_novel_done'); g.give('book_sv4h_my_novel', 1, true); stickers(g, 5, 'Finished my novel'); g.addMoney(300, true); gain(g, 'writing', 80);
    g.mail('sv4h_novel', 'Suzu', 'You finished the whole thing?! I read it in one night. This is a real novel, Misa. I am so proud of you.');
    addRibbon(g, 'writing', 'My Novel complete', 1);
  }
  return c;
}
function novelSteps(g) {
  const w = wr(g), done = w.novel.done;
  const list = CHAPTERS.map((c, i) => `${done.includes(i) ? '[x]' : '[ ]'} ${i + 1}. ${c.t}`).join('  ');
  const i = chapterReady(g);
  const next = CHAPTERS.findIndex((_, k) => !done.includes(k));
  const out = [N(`MY NOVEL  ${done.length}/8   ${list}`)];
  if (done.length >= 8) return [...out, N('The novel is finished. A copy sits on the library shelf.')];
  if (i < 0) return [...out, N(`Chapter ${next + 1} is not ready: ${CHAPTERS[next].hint} Live a little, then write about it.`)];
  return [...out, N(`Chapter ${i + 1}, "${CHAPTERS[i].t}", is ready. ${CHAPTERS[i].text(g)}`), { t: 'choice', prompt: 'What tone?', options: ['hopeful', 'funny', 'wistful'].map((t) => ({ text: t[0].toUpperCase() + t.slice(1), steps: [call((gg) => { const c = writeChapter(gg, i, t); return gg.run([N(`You write chapter ${i + 1}: "${c.t}" in a ${t} voice. (${novelDone(gg)}/8)`)]); })] })) }];
}

// ---------------------------------------------------------------- contest, club, shelf
export const contestOpen = (g) => dateOf(g.day) >= 8 && dateOf(g.day) <= 14;
function contestSteps(g) {
  const w = wr(g), key = 'story-' + seasonKey(g), list = w.stories.filter((e) => !e.sent).sort((a, b) => b.score - a.score).slice(0, 6);
  if (!contestOpen(g)) return [N('The library writing contest takes entries from the 8th to the 14th of each season.')];
  if (w.contests[key]) return [N('You already entered this season\'s contest.')];
  if (!list.length) return [N('You have no unsent stories. Write one first!')];
  return [{ t: 'choice', prompt: 'Submit which story?', options: [...list.map((e) => ({ text: `${e.title.slice(0, 24)} ${Math.round(e.score * 100)}%`, steps: [call(async (gg) => {
    const riv = rivals(gg, 'sv4hwc' + key, 3, 0.4, 0.8), rank = rankOf(e.score, riv); e.sent = true; w.contests[key] = rank;
    const prize = [0, 300, 150, 70, 20][rank]; gg.addMoney(prize, true); gain(gg, 'writing', [0, 40, 28, 18, 8][rank]);
    if (rank <= 3) addRibbon(gg, 'writing', 'Library writing contest', rank);
    if (rank === 1) { stickers(gg, 2, 'Writing contest'); if (get('npc', 'suzu')) gg.addFriend('suzu', 5); }
    await gg.run([N(rank === 1 ? `"${e.title}" wins the contest! ${prize} coins and a blue ribbon.` : rank <= 3 ? `Place ${rank}: ${prize} coins and a ribbon.` : `Not placed this time, but ${prize} coins for entering.`)]);
  })] })), { text: 'Not now', steps: [] }] }];
}
function clubSteps(g) {
  const w = wr(g), week = Math.floor((g.day - 1) / 7);
  if (!get('npc', 'suzu')) return [N('The novel club room is empty today.')];
  if (g.hearts('suzu') < 1) return [N('Suzu glances up from her notebook. "Come back when we know each other a bit better," she says kindly.')];
  if (w.club === week) return [say('suzu', 'happy', 'We already met this week. Go live some more, then write it down!')];
  return [say('suzu', 'happy', 'Welcome to the novel club! Today we are talking about endings.'), say('suzu', 'neutral', pick(() => g.rng(), ['A good ending is a promise kept.', 'Start with a feeling, not a plot.', 'Write the scene you are afraid of first.', 'If a chapter is dull, let someone arrive unexpectedly.'])), call((gg) => { w.club = week; gg.addFriend('suzu', 3); gain(gg, 'writing', 12); gg.advance(40); gg.stat('novelClubs'); })];
}
register('interaction', 'sv4h_desk', {
  label: 'Writing desk',
  run(g) {
    const w = wr(g);
    return g.run([{ t: 'choice', prompt: `Writing desk  (${w.stories.length} stories, novel ${novelDone(g)}/8)`, options: [
      { text: 'Write a short story', steps: [call((gg) => writeStory(gg))] },
      { text: 'My Novel', steps: [call((gg) => gg.run(novelSteps(gg)))] },
      { text: 'Submit to the contest', steps: [call((gg) => gg.run(contestSteps(gg)))] },
      ...(get('npc', 'suzu') ? [{ text: 'Novel club with Suzu', steps: [call((gg) => gg.run(clubSteps(gg)))] }] : []),
      { text: 'Leave', steps: [] }] }]);
  },
});
register('interaction', 'sv4h_shelf', {
  label: 'Local authors shelf',
  run(g) {
    const w = wr(g), shelf = Object.entries(w.shelf), novel = w.novel.done.length >= 8;
    const lines = shelf.map(([gn, s]) => `${s.title} (${GENRES[gn].name}, ${Math.round(s.score * 100)}%)`).concat(novel ? ['My Novel (complete)'] : []);
    return g.run([N(lines.length ? `LOCAL AUTHORS: Misa. ${lines.join('; ')}.` : 'LOCAL AUTHORS: a card says "Space reserved for stories from Hoshimori". Write one!'), ...(w.lend > 0 ? [call((gg) => { const n = w.lend; w.lend = 0; gg.addMoney(n, true); gg.toast(`+${n} coins in library lending fees`, 'coin'); })] : [])]);
  },
});
register('system', 'sv4h_write', {
  init(game) {
    game.bus.on('dayStart', () => {
      const w = S(game).write, n = Object.keys(w.shelf).length + (w.novel.done.length >= 8 ? 2 : 0);
      for (let i = 0; i < n; i++) if (game.rng() < 0.4) w.lend += 3;
    });
  },
});
addObjects('library', [
  { spr: 'sv4h_desk', x: 3, y: 4, use: 'sv4h_desk', shadow: 14 },
  { spr: 'sv4h_shelf', x: 7, y: 2, use: 'sv4h_shelf', shadow: 16 },
]);
features('Creative Hobbies', [
  'Writing skill (levels 1 to 10): a writing desk in the library, with notebooks from the stationery stall',
  'Story cards minigame: choose an opening, a twist and an ending from six genres; sticking to one genre with strong cards scores best',
  'Every short story gets a generated title and a written summary, and a printed copy as a readable book_sv4h_* item',
  'Reading your own books gives a small buff by genre (energy, focus, cosy glow, inspiration, a bookish glow or humming)',
  'Neighbours review your stories by phone message and your friendships improve',
  'Seasonal library writing contest (8th to 14th) against three rivals, with ribbons, coins and Star Stickers',
  'Local authors shelf in the library lists your best story per genre and pays small lending fees',
  'Suzu\'s novel club: a weekly writing session that boosts Writing and your friendship with Suzu',
  'My Novel: an eight-chapter project whose chapters unlock as Misa lives (chatting, farming, gifts, festivals, friendships)',
  'Chapters mention your real progress in the text, and you pick a hopeful, funny or wistful tone',
  'Finishing the novel earns a copy of the book, coins, Star Stickers, a ribbon and a letter from Suzu',
]);
void GENRE_IDS; void storyTitle; void seasonOf; void K; void clamp; void idle;
