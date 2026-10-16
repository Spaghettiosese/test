// Graduation: the ceremony on Spring 28 (game year 4, the final-term Starlight day), farewell letters from every friend, the
// three-year result card, the track + friendship Ending screen, then the credits and the start of Epilogue Life.
//   import('/src/content/sv3_years/graduation.js').then(m => m.runGraduation(__misa))      // play the whole thing now
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, drawTextC, wrapPx } from '../../ui/ui.js';
import { drawPortrait } from '../../ui/portraits.js';
import { overall, gradeLetter } from '../school/school.js';
import { Y, say, N, call, fade, bd, wait, choice, ask, runP, defEvent, st, stickers, gradeOf, yr, avg, soft, nm, first, cast, topFriends, actsEnding, actsDone, GRAD_DAY, KOHAI, isAlum } from './util.js';
import { LETTERS, enrolledKohai, SPEC } from './kohai.js';
import { TRACKS, tasksOf, trackDone } from './career.js';
import { ELECTIVES } from './years.js';

// ---------------------------------------------------------------- letters
const L = {
  kai: ['Misa! I wrote this in maths. Do not tell Mr. Sato. Thanks for being my neighbour, my lunch partner and my reason to try. If I trip over my diploma, pretend I did it on purpose. - Kai', 'Misa, nobody has ever cheered for my goals the way you did. I am going to keep scoring, just so you can shout from the stands. Call me every week or I will turn up. - Kai'],
  suzu: ['Misa, I have written eleven endings for our story and thrown away ten. The eleventh is: they stayed friends for the rest of their lives. It is a bad ending for a novel and a perfect one for us. - Suzu', 'Dear Misa, you read my first draft and said "keep going". I never told you I almost stopped. I did not. Look for my name on a spine in the library one day. - Suzu'],
  rina: ['Aoki. I would never say this out loud, so I wrote it: you were the best rival anyone could ask for. The binder says you beat me by two points once. The binder is wrong. It was three. - Rina', 'Misa. You made me better at everything and I resent it deeply and I am grateful. Write to me. Do not make me chase you for it. - Rina'],
  theo: ['...Misa. I drew the sea at night for you. It is on the back of this page. Come see the harbour mural when it is finished. You are in the corner. - Theo', 'Misa. Thanks for the quiet. You are the only person who ever let it be a good thing. - Theo'],
  hina: ['MISA!!! I named a beetle after you! He is brave and shiny and a little dramatic. Come visit him. Also I will visit you. With a net. - Hina', 'Best bug buddy, I counted: you helped me find eighty-one kinds of bug. I counted wrong, it was more. Do not forget the secret tree. - Hina'],
  fujita: ['Misa, the day you walked into my classroom with a cat hair on your sleeve I thought: this one will be fine. I was right. I am usually right. It is exhausting. Be proud, and be kind. - A. Fujita', 'Dear Misa, teachers are not supposed to have favourites. I have a list of seven, and you are on it. Study, rest, and write when you can. - Ms. Fujita'],
  ogawa: ['MISA! Great job! You were my best garden volunteer and the only student who ever laughed at my tomato jokes. Take this seed packet. Plant it anywhere and think of the school. - Mr. Ogawa', 'Misa! A graduate! I am NOT crying, it is hay fever. In a gym. In spring. Go be great! - Ogawa'],
  hana: ['My dear Misa, I counted my lanterns this year and could not find the end. You are the reason. Whatever you choose, come home on Sundays. The tea will be hot and the notebook will be open. - Grandma Hana', 'Sweet girl, I was never worried. Not once. Well, once, when you mixed up the pickles and the jam. Come to Sunny Pines. - Hana'],
  tobias: ['Misa. A clock is only a promise that tomorrow will come. You have been my best promise in years. The tower will keep your hour. - T. Wren', 'Dear Misa, I wound the bell for you this morning. It rang a little off key. The bell has feelings. So do I. - Tobias'],
  mika: ['Misa, the counter has a place for you whenever you want it. No interview. No tasting. Maybe a tasting. I like tasting. - Mika', 'Dear Misa, you carry plates like someone who loves the people holding them. That is the whole secret. Come back for coffee. - Mika'],
  sachiko: ['Sweetheart, I put a little bag in the register for you. Bento sets, a coupon book and a pat on the head. I wrote the pat. - Sachiko', 'Misa dear, I will keep your regular spot by the window and I will not let anyone else have the last melon bread. - Sachiko'],
  jun: ['Aoki! The harbour will miss its best landlubber. Here is a lure I tied myself. It catches nothing, but it looks great. Sail on! - Captain Jun', 'Misa, you were the only kid who read the tide chart for fun. Come down to the pier when you want to think. - Jun'],
  kiko: ['Misa, the shrine bell rang by itself this morning. I think it was a congratulation. May every path under your feet be gentle. - Kiko', 'Dear Misa, I drew you a fortune and it says "great blessing". I was supposed to leave it blank. I did not. - Kiko'],
  pip: ['Misa! I have never delivered a happier letter. Here is your first Alumni Post. I stamped it with the biggest stamp I own. Keep in touch! - Pip', 'Dear Misa, every address changes. I will find yours. It is literally my job. - Pip'],
  goro: ['Misa. You never once picked my flowers. That is the kind of person you are. A pot of tulips is on your doorstep. Plant them. - Goro', 'Girl. Good luck. Daifuku sends a bark. I send a nod. - Goro'],
  mum: ['My Misa, we watched your ceremony on the ship, all of us in the mess hall. The cook cried into the rice. I have been crying into the whole sea. We love you so much. - Mum', 'Sweetheart, we are so proud. Come home to the sea whenever you want. We will keep a bunk for you. - Mum'],
  dad: ['Misa! Dad here. I was going to write something wise and ended up drawing a fish. It is a proud fish. I am a proud dad. Love you. - Dad'],
  nori: ['Dear Misa, I drew the whole three years in a long panel. Sneak peek: you are a little hero at the end. Hope you do not mind. - Aunt Nori'],
  mochi: ['Mrrp. (Translation: you opened the tin, so I can come in. Welcome. I saved you a button. It is under the couch. It is a metaphor. It is also a button.) - Mochi'],
};
const pickLine = (id, g) => { const a = L[id] || KOH(id) || ['Congratulations, Misa!']; return a[a.length > 1 && g.hearts && g.hearts(id) >= 8 ? 1 : 0]; };
const KOH = (id) => (LETTERS[id] ? [LETTERS[id]] : null);
export function buildLetters(g) {
  const out = [];
  for (const d of cast()) { const h = g.hearts(d.id); if (h >= 2 && L[d.id]) out.push({ from: d.id, name: d.name, hearts: h, text: pickLine(d.id, g) }); }
  for (const id of enrolledKohai(g)) { const h = g.hearts(id); if (h >= 1) out.push({ from: id, name: nm(id), hearts: h, text: LETTERS[id] }); }
  for (const id of ['mum', 'dad', 'nori']) out.push({ from: id, name: nm(id), hearts: g.hearts(id), text: pickLine(id, g) });
  out.push({ from: 'mochi', name: 'Mochi', hearts: 10, text: L.mochi[0] });
  out.sort((a, b) => b.hearts - a.hearts);
  return out;
}

// ---------------------------------------------------------------- the result card: three years in numbers
export function buildCard(g) {
  const Z = Y(g), people = cast(), hs = people.map((d) => g.hearts(d.id));
  const mine = (g.state.sv_explore && g.state.sv_explore.mine && g.state.sv_explore.mine.best) || 0;
  const grade = overall(g);
  const school = [
    ['Overall grade', grade === null ? '-' : `${gradeLetter(grade)} (${grade})`], ['Classes attended', st(g, 'classesAttended')], ['Exams taken', st(g, 'examsTaken')], ['Top marks in class', st(g, 'classesTopGrade')],
    ['Attendance (on time / late / absent)', `${g.state.attendance.present || 0} / ${g.state.attendance.late || 0} / ${g.state.attendance.absent || 0}`], ['Honour roll terms', st(g, 'honourRoll')],
    ['Elective', Z.elective ? ELECTIVES[Z.elective] : 'none'], ['Class rep terms', Object.values(Z.rep).filter((r) => r.won).length], ['Club role', Object.values(Z.role).map((r) => r.title).join(', ') || 'member'],
    ['Mock exams', Object.values(Z.mocks).map((m) => m.grade).join(' ') || '-'],
  ];
  const friends = [
    ['Friends at 10 hearts', hs.filter((h) => h >= 10).length], ['Friends at 6+ hearts', hs.filter((h) => h >= 6).length], ['Total hearts', hs.reduce((a, b) => a + b, 0)],
    ['Kohai who look up to you', `${enrolledKohai(g).length} (${enrolledKohai(g).reduce((a, k) => a + g.hearts(k), 0)} hearts)`], ['Closest friend', (topFriends(g, 1)[0] ? nm(topFriends(g, 1)[0][0]) : '-')],
    ['Gifts given', st(g, 'gifts')], ['Hangouts', st(g, 'hangouts')], ['Farewell letters', Z.letters.length],
  ];
  const town = [
    ['Days in Hoshimori', g.day], ['Crops harvested', st(g, 'harvested')], ['Fish caught', st(g, 'fishCaught')], ['Dishes cooked', st(g, 'cooked')], ['Deepest mine floor', mine],
    ['Town requests done', st(g, 'requestsDone')], ['Festivals attended', st(g, 'festivalsAttended')], ['Coins earned', st(g, 'coinsEarned')], ['Year goals claimed', Object.keys(Z.goalsClaimed).length],
  ];
  return { school, friends, town, score: Math.round((soft(st(g, 'classesAttended'), 400) + soft(hs.reduce((a, b) => a + b, 0), 80) + soft(st(g, 'harvested') + st(g, 'fishCaught'), 400) + soft(st(g, 'requestsDone'), 60)) * 250) };
}

// ---------------------------------------------------------------- endings: track + friendships
export const ENDINGS = {
  scholar: { title: 'The Scholar of the Bay', bd: 'sunrise', text: ['The acceptance letter smells like new paper and distant cities. Misa packs one suitcase, one cat carrier and a tin of farewell letters.', 'At the station the whole town turns up: the harbour crew, the shrine keeper, a hundred hands waving. The train pulls out, and the bay shrinks to a blue thread, then a memory with a lantern in it.', 'Every holiday the train brings her home, and Hoshimori is exactly where she left it, only warmer.'] },
  second_chance: { title: 'The Long Way Round', bd: 'sunrise', text: ['The first round did not go the way Misa hoped. For a week she stays in her room with Mochi, and for another week she studies at the kitchen table with Fujita\'s notes.', 'She spends the year working at the cafe, tending the garden, and walking the night rounds with Hana, learning in every direction at once.', 'When the second round comes, she is not just ready. She is someone who has already started.'] },
  cafe: { title: 'The Apprentice of Cafe Kumo', bd: 'soc_sunset', text: ['Cafe Kumo opens at seven. By seven-oh-one, Misa has already burnt one piece of toast, saved it with butter, and sold it as a special.', 'Mika slides a cream apron across the counter. It has a name stitched on the pocket. It is not Mika\'s name.', 'There is a lot to learn: the temperature of milk, the weight of a good plate, the right amount of silence. The bay drifts by outside the window, and it all feels like home.'] },
  keeper: { title: 'The Keeper of the Light', bd: 'story_relight', text: ['On graduation night the Star Lantern is lit for the first time under Misa\'s hand alone. Hana stands beside her with a tin of tea and a very serious face she cannot hold.', 'The town looks different from the lighthouse balcony: the harbour lamps, the shrine lanterns, the clock tower glowing gold. Every one of them is a person Misa knows.', 'She does not need a ticket or a suitcase. She needs a match, a ladder and a promise to light the next lamp. Hoshimori Bay sleeps easy.'] },
  wanderer: { title: 'The Free Spirit', bd: 'story_bus', text: ['No folder, no apprenticeship, no path on the wall. Misa leaves school with a bag, a cat, and a long list of things she might like to try.', 'She spends a summer in the bay and an autumn up the coast, picking up odd jobs, new friends and a very impressive collection of ticket stubs.', 'Wherever she goes, someone always says: "You are from Hoshimori, right? The one with the cat?" And she says yes, with her whole chest.'] },
};
export const BONDS = {
  together: 'The whole class turned out to see her off: Kai, Suzu, Rina, Theo and Hina in a messy line, the kohai behind them waving paper stars. Nobody was left out.',
  close: 'A handful of close friends hold on to her hands a bit too long. They promise to write. They actually will.',
  quiet: 'There are a few people who wave goodbye quietly. Misa promises herself that she will say hello more next time.',
};
export function chooseEnding(g) {
  const Z = Y(g), t = Z.track;
  let base = 'wanderer';
  if (t === 'university') base = Z.entrance && Z.entrance.passed ? 'scholar' : 'second_chance';
  else if (t === 'cafe') base = trackDone(g) ? 'cafe' : 'wanderer';
  else if (t === 'keeper') base = trackDone(g) ? 'keeper' : 'wanderer';
  const strong = cast().filter((d) => g.hearts(d.id) >= 8).length, bond = strong >= 7 ? 'together' : strong >= 3 ? 'close' : 'quiet';
  const best = topFriends(g, 1)[0];
  return { id: `${base}_${bond}`, base, bond, best: best ? best[0] : null, title: ENDINGS[base].title, acts: actsEnding(g) };
}

// ---------------------------------------------------------------- scenes
const bgFor = (g, name, t) => { const d = get('backdrop', name); if (d) { g.save(); g.translate(40, 14); g.scale(0.75, 0.75); d.draw(g, window.__misa || {}, t); g.restore(); } };
class LettersScene {
  constructor(game, letters, onDone) { Object.assign(this, { name: 'sv3_letters', game, letters, onDone, t: 0, i: 0, shown: 0 }); }
  update(dt, input, game) {
    this.t += dt; const L0 = this.letters[this.i]; if (!L0) return this.finish();
    this.shown = Math.min(L0.text.length, this.shown + dt * 60);
    if (input.justDown || input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('e')) {
      if (this.shown < L0.text.length) this.shown = L0.text.length; else { this.i++; this.shown = 0; game.sfx('blip'); if (this.i >= this.letters.length) this.finish(); }
    }
    if (input.pressed.has('escape')) this.finish();
  }
  finish() { if (this.done) return; this.done = true; this.game.scenes.pop(this); this.onDone && this.onDone(); }
  draw(g) {
    const L0 = this.letters[this.i] || this.letters[this.letters.length - 1];
    rect(g, '#2b1d2e', 0, 0, 320, 224); rect(g, '#3d2a4a', 0, 0, 320, 30);
    for (let k = 0; k < 14; k++) rect(g, '#ffe9a0', (k * 53 + this.t * 8) % 320, 6 + (k * 17) % 20 + Math.sin(this.t + k) * 2, 2, 2);
    drawTextC(g, 'FAREWELL LETTERS', 160, 8, UI.gold, 1, null); drawTextC(g, `${Math.min(this.i + 1, this.letters.length)} / ${this.letters.length}`, 160, 18, UI.dim, 1, null);
    panel(g, 12, 38, 296, 172, 'paper');
    if (!drawPortrait(g, L0.from, 'happy', Math.floor(this.t * 2) % 2, 0, 20, 48)) { rect(g, '#b89ae0', 20, 48, 64, 64); }
    drawText(g, L0.name.toUpperCase(), 92, 50, UI.accent2, 1, null);
    drawText(g, L0.hearts >= 10 ? 'BEST OF FRIENDS' : L0.hearts >= 6 ? 'GOOD FRIEND' : L0.hearts >= 3 ? 'FRIEND' : 'ACQUAINTANCE', 92, 61, UI.dim, 1, null);
    wrapPx(L0.text.slice(0, Math.floor(this.shown)), 204).slice(0, 12).forEach((l, i) => drawText(g, l, 92, 76 + i * 11, UI.ink, 1, null));
    if (this.shown >= L0.text.length) drawText(g, 'ENTER', 270, 198, UI.dim, 1, null);
  }
}
register('scene', 'sv3_letters', { make: (game, l, d) => new LettersScene(game, l, d) });

class CardScene {
  constructor(game, card, onDone) { Object.assign(this, { name: 'sv3_result', game, card, onDone, t: 0, page: 0 }); }
  update(dt, input, game) {
    this.t += dt;
    if (this.t > 0.6 && (input.justDown || input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('e'))) { this.page++; this.t = 0.4; game.sfx('blip'); if (this.page > 2) { game.scenes.pop(this); this.onDone && this.onDone(); } }
  }
  draw(g) {
    rect(g, '#1f1428', 0, 0, 320, 224); rect(g, '#2d1c38', 0, 0, 320, 30);
    const P = [['SCHOOL YEARS', this.card.school], ['FRIENDS', this.card.friends], ['HOSHIMORI BAY', this.card.town]][Math.min(2, this.page)];
    drawTextC(g, 'THREE YEARS AT HOSHIMORI HIGH', 160, 6, UI.gold, 1, null); drawTextC(g, P[0], 160, 17, UI.text, 1, null);
    panel(g, 12, 36, 296, 170, 'dark');
    P[1].forEach(([k, v], i) => {
      const on = this.t > i * 0.08; if (!on) return;
      drawText(g, String(k).toUpperCase(), 22, 46 + i * 15, UI.text, 1, null); const s = String(v); drawText(g, s, 298 - s.length * 6, 46 + i * 15, UI.gold, 1, null);
    });
    drawText(g, `PAGE ${Math.min(this.page, 2) + 1}/3  -  MEMORY SCORE ${this.card.score}`, 22, 196, UI.dim, 1, null);
  }
}
register('scene', 'sv3_result', { make: (game, c, d) => new CardScene(game, c, d) });

class EndingScene {
  constructor(game, e, onDone) { Object.assign(this, { name: 'sv3_ending', game, e, onDone, t: 0, page: 0 }); }
  update(dt, input, game) {
    this.t += dt;
    if (this.t > 1 && (input.justDown || input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('e'))) { this.page++; this.t = 0.3; game.sfx('blip'); if (this.page >= this.e.pages.length) { game.scenes.pop(this); this.onDone && this.onDone(); } }
  }
  draw(g) {
    const e = this.e, bdp = get('backdrop', e.bd);
    rect(g, '#0a0612', 0, 0, 320, 224);
    if (bdp) { g.save(); g.translate(60, 8); g.scale(0.625, 0.625); bdp.draw(g, this.game, this.t + this.page * 10); g.restore(); }
    rect(g, 'rgba(10,6,18,0.72)', 0, 130, 320, 94);
    if (this.page === 0) { drawTextC(g, 'ENDING', 160, 138, UI.dim, 1, null); drawTextC(g, e.title.toUpperCase(), 160, 150, UI.gold, 2, null); }
    const pg = e.pages[Math.min(this.page, e.pages.length - 1)];
    wrapPx(pg, 290).slice(0, this.page === 0 ? 4 : 7).forEach((l, i) => drawText(g, l, 15, (this.page === 0 ? 172 : 140) + i * 11, UI.text, 1, null));
    drawText(g, `${this.page + 1}/${e.pages.length}`, 292, 212, UI.dim, 1, null);
  }
}
register('scene', 'sv3_ending', { make: (game, e, d) => new EndingScene(game, e, d) });

// ---------------------------------------------------------------- finalising (state) and the ceremony (script)
export function endingPages(g, e) {
  const E = ENDINGS[e.base], pages = [E.text[0], E.text[1], E.text[2], BONDS[e.bond]];
  if (e.best) pages.push(`${nm(e.best)} is the last one at the gate, waving until the road bends. Some friends are a whole chapter.`);
  if (e.acts) pages.push(`The bay\'s own story closes with it: ${String(e.acts).replace(/_/g, ' ')}.`);
  else if (g.flag('act3_done')) pages.push('And whatever shadows once walked the bay, the lantern keeps them away now.');
  pages.push(`Class of the Star Lantern. Ending: ${E.title}.`);
  return pages;
}
export function finalizeGraduation(g) {
  const Z = Y(g);
  if (Z.graduated) return Z.grad;
  const e = chooseEnding(g), card = buildCard(g);
  Z.letters = buildLetters(g);
  Z.graduated = true; Z.ending = e.id;
  Z.grad = { day: g.day, ending: e.id, base: e.base, title: e.title, track: Z.track, bond: e.bond, best: e.best, score: card.score, grade: overall(g), hearts: cast().reduce((a, d) => a + g.hearts(d.id), 0), acts: e.acts };
  Z.hof.unshift({ day: g.day, title: e.title, ending: e.id, score: card.score });
  g.give('sv3y_diploma', 1, true); g.give('sv3y_letter_box', 1, true); g.give('sv3y_alumni_badge', 1, true); g.give('sv3y_grad_bouquet', 1, true);
  g.setFlag('sv3y_graduated'); g.state.flags.noSchool = true; if (g.state.school) g.state.school.breakFlag = false;
  g.state.title = g.state.title || 'Alumna'; (g.state.titles ||= []).includes('Graduate of Hoshimori High') || g.state.titles.push('Graduate of Hoshimori High');
  g.stat('graduated'); g.achieve && get('achievement', 'sv3y_grad') && g.achieve('sv3y_grad');
  g.bus.emit('svGraduated', { ending: e.id, base: e.base });
  return Z.grad;
}
const gather = (g) => ['kai', 'suzu', 'rina', 'theo', 'hina'];
export async function runGraduation(g) {
  const Z = Y(g);
  const kids = enrolledKohai(g), strong = cast().filter((d) => g.hearts(d.id) >= 6).length;
  await runP(g, [fade(1, 1), bd('hanami'), fade(0, 1), N('Spring 28. The cherry trees are in full bloom and the gym is full of folding chairs, flowers and parents in good coats.'),
    say('fujita', 'neutral', 'Third-years, line up in name order. Aoki, Misa, you are between Abe and Endo. Do not wave at your cat.'),
    say('kai', 'surprised', 'Is that Mochi in the front row? Is that a tiny bow tie?'), say('misa', 'surprised', 'Mochi?! How did you...'), N('Mochi sits on Grandma Hana\'s lap, wearing a small bow tie, looking like she has been to a hundred of these.')]);
  await runP(g, [fade(1, 0.5), bd('story_party'), fade(0, 0.5), N('The principal reads the names, one by one. Applause rolls through the hall each time.'),
    say('fujita', 'happy', 'Aoki, Misa.'), N('Misa crosses the stage, takes her diploma with both hands, and bows exactly as deeply as she practised.'),
    ...(strong >= 4 ? [N('From the third row, a very loud chorus: "MISA!" Kai, Hina, and half the volleyball team have made a banner. It is spelled slightly wrong.')] : []),
    say('hana', 'happy', 'That is my granddaughter. Yes, that one. With the diploma. Yes, thank you, I am very proud.')]);
  if (kids.length) await runP(g, [fade(1, 0.5), bd('hanami'), fade(0, 0.5), N('The first- and second-years stand to sing the farewell song. The kohai are at the front, red-eyed and determined.'),
    say(kids[0], 'happy', 'Senpai! We will take good care of the club! We promise!'), say(kids[kids.length - 1], 'sad', 'Please do not forget us!'), say('misa', 'happy', 'Never. Not for a second.')]);
  await runP(g, [fade(1, 0.5), bd('soc_sunset'), fade(0, 0.5), N('After the ceremony, the school yard is a storm of photographs, tears and borrowed hankies.'),
    say('rina', 'neutral', 'Hmph. We did it. Do not say anything sappy. ...Well, a little.'), say('suzu', 'happy', 'I wrote the ending. It was just "and they all went out for noodles".'), say('theo', 'happy', '...I painted the ceremony. From the back. It looks like a lot of sunbeams.'), say('hina', 'happy', 'A ladybug is on your diploma! That is the best good luck there is!'), say('kai', 'happy', 'GROUP PHOTO! Everybody squeeze! Misa, you are in the middle, do not argue!')]);
  const sb = kids.length && g.hearts(kids[0]) >= 3;
  if (sb) { g.give('sv3y_second_button', 1, true); await runP(g, [say(kids[0], 'happy', 'S-senpai. This is the second button of my jacket. It is a tradition. It means... it means I will remember you.'), say('misa', 'happy', 'I will keep it somewhere safe. Thank you.')]); }
  await runP(g, [fade(1, 0.6), bd('story_sepia'), fade(0, 0.6), N('Misa stands at the school gate and looks back once. The building looks smaller than it did on the first day. The windows are full of people she knows.'),
    say('misa', 'happy', 'Thank you for everything. See you soon.'), N('Behind her, Mochi stretches, yawns, and trots to her side. The last bell rings. It is not for her. It never was. It is a goodbye to everyone who walks away.'), fade(1, 0.8)]);
  const grad = finalizeGraduation(g);
  g.state.time.minutes = Math.max(g.minutes, 12 * 60);
  // letters, card, ending, credits
  await new Promise((res) => { if (g.open('sv3_letters', Z.letters, res) === null) res(); });
  await new Promise((res) => { if (g.open('sv3_result', buildCard(g), res) === null) res(); });
  const e = chooseEnding(g);
  await new Promise((res) => { if (g.open('sv3_ending', { title: e.title, bd: ENDINGS[e.base].bd, pages: endingPages(g, e) }, res) === null) res(); });
  await new Promise((res) => { if (g.open('story_credits', res) === null) res(); });
  g.bus.emit('svGraduationDone', grad);
  await runP(g, [bd(null), fade(0, 1), N('The credits end, but the days do not. Misa wakes up the next morning in the same room, with the same cat, and an entire adult life ahead.'), call((gg) => gg.bus.emit('svEpilogueReady', {}))]);
  return grad;
}
defEvent({ key: (g) => (!Y(g).graduated && g.day >= GRAD_DAY && (g.day > GRAD_DAY || g.minutes >= 10 * 60) ? 'graduation' : null), run: (g) => runGraduation(g) });

register('system', 'sv3_grad', {
  init(g) {
    g.bus.on('dayStart', () => {
      if (g.day === GRAD_DAY - 1) g.mail('sv3y_grad_eve', 'Ms. Fujita', 'Misa, tomorrow is graduation. The ceremony starts at ten, in the gym. Wear your good shoes and bring a handkerchief. I will not be asking why.');
      if (g.day === GRAD_DAY) g.toast('Graduation Day! The ceremony starts at 10:00', 'i_star');
    });
  },
});

features('Years & Graduation', [
  'Graduation ceremony on Spring 28 of the final term: diploma, kohai farewell song, second button tradition, class photos and Mochi in a bow tie',
  'Farewell letters from every friend with 2 or more hearts (read with their portraits), the kohai, family and Mochi',
  'A three-page result card of the three years: grades and clubs, friendships, and farm/fishing/mine/town records',
  'Five endings chosen by your path and how it went (Scholar, Long Way Round, Cafe Apprentice, Keeper of the Light, Free Spirit)',
  'Each ending has a friendship epilogue (everyone together, a few close friends, or quiet goodbyes) and mentions your closest friend',
  'The ending reads the story-acts result when present, then rolls the credits',
]);
void all; void avg; void ask; void choice; void wait; void gather; void KOHAI; void SPEC; void tasksOf; void TRACKS; void isAlum; void gradeOf; void yr; void first; void actsDone; void stickers; void bgFor;
