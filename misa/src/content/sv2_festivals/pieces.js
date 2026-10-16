// The eight festival set pieces. Existing festivals are extended in place (their registered defs are edited at load):
//   hanami    +activity 'dance' (Flower Dance)
//   harvest   'judging' REPLACED by the Grange display board, +activity 'strength' (strength tester)
//   starryeve 'swap' REPLACED by the secret gift exchange, +setup wrapper that draws the secret friend
//   newyear   +activity 'countdown' (clock tower plaza fireworks)
// New festivals: eggfest (spring 11), luau (summer 24), jellies (summer 26), icefest (winter 11).
// Townspeople gather via a leading schedule group per festival (when: flag:festival_<id>).
import { register, get, features } from '../../core/registry.js';
import { reaction } from '../../systems/social.js';
import { rollFish, landFish } from '../hobbies/world.js';
import { S, say, N, call, nameOf, has, scene, endScene, souvenir, stickers, doneToday, markDone, recordResult, rankOfScore, scoreBoard, grangeRivals, RIBBONS } from './data.js';
import { pickItem, openGrange, resultCard } from './scenes.js';

const T = (spot, spr, dx = 0, dy = 0, extra = {}) => ({ spot, spr, dx, dy, ...extra });
const rnd = (g, a) => a[Math.floor(g.rng() * a.length) % a.length];
const line = (s) => { const m = String(s).match(/^(neutral|happy|surprised|sad)\|/); return m ? [m[1], s.slice(m[0].length)] : ['happy', s]; };
const sayLine = (who, s) => { const [mood, text] = line(s); return say(who, mood, text); };
const exists = (id) => !!get('npc', id);
const fest = (id) => get('festival', id);
const setActs = (fid, remove, add) => { const f = fest(fid); if (!f) return; f.activities = (f.activities || []).filter((a) => !remove.includes(a.id)).concat(add); };

// =================================================================== 1. HANAMI FLOWER DANCE
const DANCERS = ['kai', 'suzu', 'rina', 'theo', 'hina', 'mika', 'goro', 'hana', 'kiko', 'jun', 'tobias', 'pip', 'sachiko', 'ogawa', 'fujita'];
export const dancePartners = (g) => DANCERS.filter((id) => exists(id) && g.hearts(id) >= 4).sort((a, b) => g.hearts(b) - g.hearts(a)).slice(0, 5);
export const danceTier = (s) => (s >= 0.75 ? 'great' : s >= 0.4 ? 'ok' : 'rough');
const DANCE_LINES = {
  kai: { ask: 'surprised|Me? I only know the soccer victory shuffle... okay, okay, let me lead!', great: ['happy|Whoa! Where did that come from? You are way better than my footwork on the pitch!', 'happy|Next year I am practising for a whole week. Maybe two days.'], ok: ['happy|That was fun! I only stepped on you twice. Maybe three times.', 'happy|We make a decent team. Like a midfield, but with petals.'], rough: ['surprised|Ha! We tangled up like a pair of kites. Great fun, though!', 'happy|Nobody was watching. Probably.'] },
  suzu: { ask: 'surprised|Oh. Oh! I will try not to count the steps out loud.', great: ['happy|That felt like a scene from one of my stories. The part where the music swells.', 'happy|I might write it down tonight. Don\'t worry, you come off very well.'], ok: ['happy|My heart was pounding, and not just from the tempo.', 'happy|A few missteps. It will make a charming footnote.'], rough: ['surprised|I think I lost the plot entirely. In a good way.', 'happy|That is going in the chapter called "Chaos Under the Blossoms".'] },
  rina: { ask: 'surprised|You want to dance with me? ...Fine. But I am leading, and I do not lose.', great: ['happy|Hmph. Flawless. I did not expect to be matched, and I am not sure how I feel about it.', 'happy|Same time next year. I intend to beat that score.'], ok: ['happy|Not bad. A few timing issues, but nothing a rehearsal cannot fix.', 'happy|Thank you for asking me. Really.'], rough: ['surprised|That was a disaster. Let us never speak of it. ...Again next year?', 'happy|At least the petals were gorgeous.'] },
  theo: { ask: 'surprised|...Me? I do not really dance. But I will follow if you point.', great: ['happy|I think I just understood rhythm for the first time. Don\'t tell anyone.', 'happy|I would like to sketch that. The way you moved. Is that weird?'], ok: ['happy|I stepped wrong, but I liked it. It was nice.', 'happy|The petals looked like falling paint.'], rough: ['surprised|I am so sorry about your toes. I will pay for the ice.', 'happy|But, um, thank you for asking me anyway.'] },
  hina: { ask: 'surprised|A dance?! Yes yes yes! Wait, is there a beetle on your shoulder? ...No. Okay!', great: ['happy|That was like being a butterfly! A big, graceful one!', 'happy|Look, a petal landed on your head. You are officially a flower.'], ok: ['happy|We flapped around like two happy sparrows!', 'happy|I would do it again right now!'], rough: ['surprised|Oops! I got distracted by a bee. A cute one.', 'happy|That was the funniest dance ever. Thank you!'] },
};
const dancePair = (id, tier) => { const L = DANCE_LINES[id]; if (L) return L[tier]; const n = nameOf(id); return tier === 'great' ? [`happy|What a wonderful dance, Misa! You made an old ${n} feel light on their feet.`, 'happy|The blossoms agree with you. Thank you.'] : tier === 'ok' ? [`happy|That was lovely, Misa. A few wobbly steps, but a lot of heart.`, 'happy|Let us do it again next spring.'] : ['surprised|Goodness, we really tangled there! I haven\'t laughed so much in ages.', 'happy|Thank you for asking me, Misa.']; };

async function flowerDance(g) {
  if (doneToday(g, 'hanami:dance')) return g.say('misa', 'happy', 'Three songs under the blossoms is plenty for one day. My feet agree!');
  const cands = dancePartners(g);
  let partner = null;
  await g.run([N('The band on the bandstand strikes up a slow spring waltz. Pairs drift onto the grass under the sakura.'),
    ...(cands.length ? [{ t: 'choice', prompt: 'Who will you ask to dance?', options: [...cands.map((id) => ({ text: `${nameOf(id)} (${g.hearts(id)} hearts)`, steps: [call(() => { partner = id; })] })), { text: 'Maybe later', steps: [] }] }]
      : exists('hana') ? [say('hana', 'happy', 'No partner, dear? Then I volunteer. I have been waiting for this waltz for forty years.'), call(() => { partner = 'hana'; })] : [])]);
  if (!partner) return;
  await g.run([say('misa', 'happy', `Would you like to dance, ${nameOf(partner)}?`), sayLine(partner, (DANCE_LINES[partner] || {}).ask || 'surprised|Me? I would be delighted!')]);
  const r = await g.minigame('sv2_dance', { partner });
  if (r.quit) return g.say('misa', 'neutral', 'Maybe the next song.');
  markDone(g, 'hanami:dance');
  const tier = danceTier(r.score), pts = { great: 80, ok: 45, rough: 22 }[tier];
  await g.run([...scene('hanami'), ...dancePair(partner, tier).map((s) => sayLine(partner, s)),
    say('misa', 'happy', tier === 'great' ? 'We nailed it!' : tier === 'ok' ? 'That was fun!' : 'Whoops. Totally worth it.'), ...endScene]);
  g.addFriend(partner, pts); g.addMood(tier === 'great' ? 12 : 7); g.stat('flowerDances');
  const rank = rankOfScore(r.score * 100), got = souvenir(g, 'gift_sv2_flower_crown');
  recordResult(g, 'hanami', { score: r.score * 100, rank });
  await resultCard(g, { title: 'Flower Dance', sub: `Danced with ${nameOf(partner)}`, score: Math.round(r.score * 100), rank, lines: [r.data.text, `${nameOf(partner)} friendship +${pts}`, got ? 'Souvenir: Flower crown' : ''].filter(Boolean) });
}
setActs('hanami', [], [{ id: 'dance', map: 'park', spot: 'bandstand', dx: -2, dy: 2, label: 'Flower Dance', when: 'time>=11:00&time<20:00', run: flowerDance }]);

// =================================================================== 2. EGG HUNT DAY (spring 11)
async function eggHunt(g) {
  if (doneToday(g, 'eggfest:hunt')) return g.say('rina', 'happy', 'One hunt per customer! The eggs need time to regrow. ...They do not regrow. Come back next year.');
  await g.run([say('rina', 'happy', 'Misa! Egg Hunt rules: forty-five seconds, one basket, no pushing. I have a map of every bush in town.'),
    say('misa', 'surprised', 'You made a map?'), say('rina', 'happy', 'Of course. And I am going to win. Ready?')]);
  const r = await g.minigame('sv2_egg_hunt', {});
  if (r.quit) return g.say('misa', 'neutral', 'Rina is already gloating. I will get her next time.');
  markDone(g, 'eggfest:hunt');
  const d = r.data, win = d.mine > d.rina, rank = win && d.mine >= 12 ? 1 : win ? 2 : d.mine >= d.rina - 3 ? 3 : 4;
  const coins = d.mine * 15 + (rank === 1 ? 200 : 0);
  await g.run([...(rank === 1 ? [say('rina', 'surprised', `${d.mine} to ${d.rina}?! That is... I am... a very good loser. I am practising.`), say('misa', 'happy', 'You were close! Want the golden one? Kidding.')]
    : rank === 2 ? [say('rina', 'surprised', `${d.mine} to ${d.rina}. You win. By a hair. A very small, very annoying hair.`)]
    : [say('rina', 'happy', `${d.rina} to ${d.mine}! Victory is mine! Do not worry, the basket was not your colour.`), say('misa', 'happy', 'Next year.')]), { t: 'money', n: coins }]);
  if (win) { g.stat('eggWins'); g.addFriend('rina', 12); } else g.addFriend('rina', 25);
  g.stat('eggsFound', d.found);
  if (rank === 1) stickers(g, 2, 'Egg Hunt champion');
  if (has('gift_sv2_painted_egg')) g.give('gift_sv2_painted_egg', Math.max(1, Math.floor(d.found / 5)), true);
  const gotSouv = d.gold ? souvenir(g, 'gift_sv2_golden_egg') : false;
  recordResult(g, 'eggfest', { score: Math.min(100, d.mine * 8), rank });
  await resultCard(g, { title: 'Egg Hunt', sub: `You ${d.mine}  -  Rina ${d.rina}`, score: Math.min(100, d.mine * 8), rank, lines: [`${d.found} eggs found`, `Prize money: ${coins} coins`, d.gold ? (gotSouv ? 'Souvenir: Golden egg charm' : 'You found the golden egg again!') : 'The golden egg got away...'] });
}

// =================================================================== 3. TIDE LUAU / SOUP POTLUCK (summer 24)
export const GUESTS = ['mika', 'kai', 'suzu', 'rina', 'theo', 'hina', 'jun', 'kiko', 'goro', 'tobias', 'sachiko', 'pip'];
const GUEST_DISH = { mika: 'dish_cream_stew', kai: 'dish_karaage', suzu: 'dish_pickles', rina: 'dish_garden_salad', theo: 'dish_onigiri', hina: 'dish_edamame', jun: 'dish_grilled_mackerel', kiko: 'dish_dango', goro: 'dish_nikujaga', tobias: 'dish_miso_soup', sachiko: 'dish_tempura', pip: 'dish_pancakes' };
const RVAL = { love: 3, like: 2, neutral: 1, dislike: 0, hate: -1 };
export function potQuality(g, dishId) {
  const it = (dishId && get('item', dishId)) || null;
  const rx = GUESTS.filter(exists).map((id) => ({ id, r: dishId ? reaction(get('npc', id), dishId) : 'neutral' }));
  const ratio = rx.reduce((a, x) => a + RVAL[x.r], 0) / (3 * rx.length);
  const tier = it ? Math.min(30, Math.round((it.price || 0) / 20)) : 0, kind = it && (it.tags || []).some((t) => ['warm', 'meal', 'dish'].includes(t)) ? 10 : it ? 4 : 0;
  const score = Math.max(0, Math.min(100, Math.round(20 + tier + kind + ratio * 45)));
  return { score, rx, tier: score >= 70 ? 'feast' : score >= 48 ? 'good' : 'thin' };
}
const LUAU_REACT = {
  love: (n, d) => `happy|${d}?! That is my favourite! Please save me a second bowl!`,
  like: (n, d) => `happy|Mmm, ${d} in the pot is a lovely surprise. Thank you, Misa.`,
  neutral: () => 'happy|Warm and tasty. Anything shared on the beach is good food.',
  dislike: () => 'surprised|It is... bold! The sea air is helping. I will have a very small bowl.',
  hate: () => 'sad|Um. I will pass on this one. But I love the bonfire!',
};
async function luauPot(g) {
  if (doneToday(g, 'luau:pot')) return g.say('mika', 'happy', 'The pot is simmering happily. Come back with a spoon at sunset!');
  await g.run([say('mika', 'happy', 'Welcome to the Tide Luau! Everyone adds one dish to the big communal pot. What did you bring?')]);
  const dishId = await pickItem(g, { title: 'Add to the pot', prompt: 'Pick one dish or snack for the communal pot.', filter: (id, it) => it.cat === 'food' && !id.startsWith('ing_'), confirmLabel: 'ADD TO POT', cancelLabel: 'JUST HELP STIR' });
  const q = potQuality(g, dishId), dn = dishId ? get('item', dishId).name : null;
  if (dishId) g.take(dishId, 1);
  markDone(g, 'luau:pot');
  const rx = q.rx.slice().sort((a, b) => RVAL[b.r] - RVAL[a.r]), show = [rx[0], rx[1], rx[rx.length - 2], rx[rx.length - 1]].filter((x, i, a) => x && a.findIndex((y) => y.id === x.id) === i).slice(0, 4);
  const guestLines = show.flatMap((x) => dn ? [sayLine(x.id, LUAU_REACT[x.r](nameOf(x.id), dn))] : [sayLine(x.id, 'happy|Misa stirred it for an hour! Best arm workout of the summer.')]);
  const outro = q.tier === 'feast' ? [say('mika', 'surprised', 'Oh my. That aroma. Everyone, bowls up! This is the best potluck pot Hoshimori has ever had!')] : q.tier === 'good' ? [say('mika', 'happy', 'A fine pot! Warm, balanced, and just a little bit lucky.')] : [say('mika', 'happy', 'It is a little thin, but nobody leaves this luau hungry. More noodles!')];
  await g.run([...scene('sv2_luau'), N(dn ? `Misa lifts ${dn.toLowerCase()} over the pot. The whole beach leans in.` : 'Misa stirs the pot with the biggest ladle on the beach.'),
    ...Object.entries(GUEST_DISH).filter(([id]) => exists(id)).slice(0, 4).map(([id, d]) => N(`${nameOf(id)} adds ${get('item', d).name.toLowerCase()}.`)),
    N('The pot bubbles. Steam curls up past the paper lanterns. Everyone gathers around with a bowl.'), ...guestLines, ...outro, ...endScene]);
  const base = { feast: 18, good: 11, thin: 6 }[q.tier];
  for (const x of q.rx) g.addFriend(x.id, base + (x.r === 'love' ? 14 : x.r === 'like' ? 6 : 0));
  const mins = { feast: 240, good: 180, thin: 90 }[q.tier]; g.addBuff('cozy', mins); if (q.tier !== 'thin') g.addBuff('swift', mins); if (q.tier === 'feast') { g.addBuff('lucky', mins); g.addBuff('focus', mins); }
  g.setFlag('sv2_luau_' + q.tier); g.addMood(q.tier === 'feast' ? 15 : 9); g.stat('luauPots');
  const rank = rankOfScore(q.score, 70, 48, 25), gotS = souvenir(g, 'gift_sv2_shell_lei');
  recordResult(g, 'luau', { score: q.score, rank });
  await resultCard(g, { title: 'Tide Luau Pot', sub: dn ? `Your dish: ${dn}` : 'You stirred the pot', score: q.score, rank, lines: [q.tier === 'feast' ? 'A FEAST! Everyone is buffed' : q.tier === 'good' ? 'A good pot. Cozy buff for all' : 'A thin pot, but happy', `${q.rx.filter((x) => x.r === 'love').length} loved it, ${q.rx.filter((x) => x.r === 'like').length} liked it`, gotS ? 'Souvenir: Shell lei' : 'Town friendship up'] });
}

// =================================================================== 4. MOONLIGHT JELLIES (summer 26)
const JELLY_VIEW = {
  sandbar: { who: 'kiko', first: 'Kiko sits on the sandbar, hands in her lap.', talk: ['kiko', 'happy', 'The old tales say they carry lanterns for the sea spirits. I like that. I also like pudding.'] },
  rocks: { who: 'theo', first: 'Theo sketches on the rocks, charcoal smudging his fingers.', talk: ['theo', 'happy', 'I can\'t draw this. The light moves. ...I will keep trying, though.'] },
  driftwood: { who: 'hina', first: 'Hina has a notebook open on the driftwood and has already given six jellies names.', talk: ['hina', 'happy', 'That blue one is Bubbles Junior. The pink one is Sir Wobble. Do you want to name one?'] },
};
async function jellyWatch(g, view) {
  if (doneToday(g, 'jellies:watch')) return g.say('misa', 'happy', 'I have seen enough magic for one night. If I stay longer I might never go home.');
  const v = JELLY_VIEW[view];
  markDone(g, 'jellies:watch');
  await g.run([...scene('sv2_jellies'), N('The tide pulls back. One glow, then another, then a slow procession of lights drifts along the shore.'), N(v.first),
    { t: 'sfx', name: 'chime' }, say('misa', 'surprised', 'They are really glowing. Like tiny moons.'), say(...v.talk), { t: 'wait', dur: 0.6 },
    N('The procession turns together and drifts out past the sandbar, a ribbon of blue and pink light on the black water.'),
    { t: 'choice', prompt: 'Misa...', options: [
      { text: 'Make a wish', steps: [say('misa', 'happy', 'I wish for more nights like this one.'), { t: 'mood', n: 8 }] },
      { text: 'Sit quietly', steps: [N('You listen to the waves until your thoughts go still.'), { t: 'energy', n: 12 }] },
      { text: 'Wave goodbye', steps: [say('misa', 'happy', 'Goodnight, jellies! Thank you for the show!'), { t: 'xp', skill: 'charm', n: 6 }] }] },
    ...endScene]);
  g.addFriend(v.who, 25); g.addMood(10); g.stat('jellyNights');
  const gotS = souvenir(g, 'gift_sv2_jelly_lamp');
  recordResult(g, 'jellies', { score: 100, rank: 1 });
  await resultCard(g, { title: 'Moonlight Jellies', sub: 'A quiet night on the shore', lines: [`${nameOf(v.who)} watched with you (+25)`, gotS ? 'Gift: Jelly lamp' : 'The sea remembers you', 'Mood and energy restored'], rank: 1, score: 100 });
}

// =================================================================== 5. AUTUMN HARVEST FAIR: GRANGE DISPLAY
const JUDGE_LINES = {
  goro: { hi: ['happy|Hmph! A proper harvest. I could weep. Do not tell Daifuku.', 'surprised|Such crisp roots! Such colour! Did you cheat? ...You did not cheat.'], mid: ['happy|Decent. Needs more dirt on it. Real vegetables have dirt.'], lo: ['neutral|Where are the vegetables, girl? This is a shelf, not a field.'] },
  mika: { hi: ['happy|It looks like a magazine spread! I want to eat the entire board!', 'surprised|The colours! The plating! Can I hire your board for the cafe?'], mid: ['happy|Lovely, but it needs one more thing to nibble on.'], lo: ['neutral|I admire the confidence. Perhaps a snack or two next time?'] },
  ogawa: { hi: ['happy|Variety! Balance! Strength! This board does squats!', 'happy|A well-rounded display. Mind, body and pantry in harmony!'], mid: ['happy|A solid effort. Stretch it out a little next year.'], lo: ['neutral|Hm. Empty slots are like missed warm-ups. Fill them!'] },
};
const jline = (id, score) => sayLine(id, JUDGE_LINES[id][score >= 8 ? 'hi' : score >= 5 ? 'mid' : 'lo'][0]);
async function grangeDisplay(g) {
  if (doneToday(g, 'harvest:grange')) return g.say('ogawa', 'happy', 'The judging is done for today! Come and admire the ribbons at sunset.');
  await g.run([say('ogawa', 'happy', 'Welcome to the Grange! Arrange up to nine items on the board. Variety, quality and the harvest theme all count.'), say('goro', 'neutral', 'And do not bring flowers. Flowers are not food.')]);
  const ids = await openGrange(g);
  if (!ids) return;
  markDone(g, 'harvest:grange');
  const sc = scoreBoard(g, ids), rivals = grangeRivals(g), rank = 1 + rivals.filter((r) => r[2] > sc.total).length;
  const J = sc.judges, sum = J.goro + J.mika + J.ogawa;
  const rivalText = rivals.map((r) => `${r[1]} ${r[2]}`).join(', ');
  await g.run([N(`Misa steps back. The board has ${sc.n} item${sc.n > 1 ? 's' : ''}, ${sc.kinds} kinds, ${sc.stars} stars.`), { t: 'sfx', name: 'bell' },
    N('The judges walk the line, scribbling on cards...'), jline('goro', J.goro), N(`Goro holds up a card: ${J.goro}!`), jline('mika', J.mika), N(`Mika's card: ${J.mika}!`), jline('ogawa', J.ogawa), N(`Mr. Ogawa's card: ${J.ogawa}!`),
    N(`Judges total ${sum}/30. Variety ${sc.variety}, quality ${sc.quality}, theme ${sc.theme}, full board ${sc.bonus}. Board score: ${sc.total}!`),
    N(`The other entries: ${rivalText}.`)]);
  const coins = [0, 600, 300, 150, 60][rank];
  await g.run(rank === 1 ? [say('ogawa', 'surprised', 'And the Blue Ribbon goes to... Misa!'), say('goro', 'surprised', 'Beaten. By a schoolgirl. Daifuku, do not look at me.'), { t: 'money', n: coins }]
    : rank === 2 ? [say('ogawa', 'happy', 'A Red Ribbon for Misa! One step from the top!'), say('goro', 'happy', 'Hmph. Not bad. Not as good as mine. But not bad.'), { t: 'money', n: coins }]
    : [say('ogawa', 'happy', rank === 3 ? 'A White Ribbon! Solid work!' : 'A Green Participation Ribbon! Everyone is a winner at the Grange!'), { t: 'money', n: coins }]);
  const nCrop = ids.filter((id) => (get('item', id) || {}).cat === 'crop').length;
  g.stat('grangeEntries'); g.stat('cropsJudged', nCrop);
  if (rank === 1) { g.stat('grangeWins'); g.stat('harvestWins'); stickers(g, 3, 'Grange champion'); } else if (rank === 2) stickers(g, 1, 'Grange runner-up');
  const gotS = rank <= 2 ? souvenir(g, 'gift_sv2_grange_rosette') : false;
  g.addFriend('goro', rank === 1 ? 20 : 12); g.addFriend('mika', 8); g.addFriend('ogawa', 8);
  recordResult(g, 'harvest', { score: sc.total, rank });
  await resultCard(g, { title: 'Grange Display', sub: `Judges ${sum}/30  -  ${rivalText}`, score: sc.total, rank, lines: [`Prize: ${coins} coins${rank <= 2 ? ' + Star Stickers' : ''}`, gotS ? 'Souvenir: Grange rosette' : 'Your display stays on the board all day', `Best slots: ${sc.kinds} kinds, ${sc.stars} stars`] });
}
setActs('harvest', ['judging'], [{ id: 'judging', map: 'town', spot: 'stage', dy: 3, label: 'Grange display board', run: grangeDisplay }]);
setActs('harvest', ['strength'], [{ id: 'strength', map: 'town', spot: 'market_2', dy: 2, label: 'Strength tester', minigame: 'sv2_strength', cost: 30, daily: true,
  prize: (g, r) => { const b = (r.data || {}).best || 0; g.stat('strengthTests'); if (b >= 0.93) { g.stat('strengthDings'); g.give('toy_fest_plush', 1); stickers(g, 1, 'Ding!'); return g.say('ogawa', 'surprised', 'DING! The bell rang! You lifted that hammer like a champion. Here, a plush!'); } if (b >= 0.7) { g.give('dish_fest_candy_apple', 1); return g.say('ogawa', 'happy', 'Strong swing! A candy apple for your efforts.'); } return g.say('ogawa', 'happy', 'Plenty of spirit! Eat your vegetables and try again.'); } }]);

// =================================================================== 6. STARRY EVE SECRET GIFT
export const SECRET_POOL = ['kai', 'suzu', 'rina', 'theo', 'hina', 'mika', 'goro', 'kiko', 'jun', 'tobias', 'sachiko', 'pip', 'ogawa', 'fujita', 'hana'];
export const MISA_LIKES = ['sweet', 'cute', 'stars', 'handmade', 'flower'];
export const GIFT_FOR_MISA = { kai: 'snack_melon_bread', suzu: 'book_star_atlas', rina: 'snack_macarons', theo: 'gift_star_sketch', hina: 'gift_pressed_flower', mika: 'snack_strawberry_shortcake', goro: 'crop_cosmos', kiko: 'snack_limited_pudding', jun: 'gift_shell_necklace', tobias: 'gift_star_chart', sachiko: 'snack_sakura_mochi', pip: 'gift_cute_stationery', ogawa: 'gift_friendship_bracelet', fujita: 'gift_star_jar', hana: 'gift_knit_scarf' };
export const matchesMisa = (id) => ((get('item', id) || {}).tags || []).some((t) => MISA_LIKES.includes(t));
export function drawSecret(g) {
  const s = S(g).secret;
  if (s.day === g.day) return s;
  const r = g.rngFor('sv2secret' + g.day), pool = SECRET_POOL.filter(exists);
  const to = pool[Math.floor(r() * pool.length)], friends = pool.filter((id) => id !== to && g.hearts(id) >= 2), pool2 = friends.length ? friends : pool.filter((id) => id !== to);
  Object.assign(s, { day: g.day, to, from: pool2[Math.floor(r() * pool2.length)], gave: 0, got: 0 });
  return s;
}
const GIVE_PTS = { love: 90, like: 55, neutral: 25, dislike: -15, hate: -30 };
const GIVE_LINE = { love: 'happy|Oh! This is... exactly what I wanted! How did you know?!', like: 'happy|It\'s lovely, Misa! Thank you so much.', neutral: 'happy|Thank you! It\'s the thought that counts.', dislike: 'neutral|Oh. It is... a gift. Thank you for thinking of me.', hate: 'sad|...Is this a joke? Sorry. Thank you, I suppose.' };
async function secretGift(g) {
  const s = drawSecret(g);
  if (s.gave) return g.say('misa', 'happy', 'My secret gift is already given and received. Time to enjoy the star tree!');
  const to = s.to, def = get('npc', to), f = g.friend(to);
  await g.run([N('A big paper star hangs from the tree. Slips of paper flutter inside a lantern.'), say('misa', 'happy', `I drew a slip. It says... ${def.name}. That is my secret friend. Shhh!`)]);
  const id = await pickItem(g, { title: `A gift for ${nameOf(to)}`, prompt: `Choose a gift for your secret friend, ${def.name}. Keep it secret!`, extra: (i) => ((f.knownGifts || []).includes(i) ? 'THEY LIKE THIS' : ''), confirmLabel: 'WRAP IT' });
  if (!id) return g.say('misa', 'neutral', 'I need a little more time to decide.');
  s.gave = 1; g.take(id, 1);
  const r = reaction(def, id);
  g.addFriend(to, GIVE_PTS[r]); if (r === 'love' || r === 'like') (f.knownGifts ||= []).includes(id) || f.knownGifts.push(id);
  const from = s.from, gift = GIFT_FOR_MISA[from], match = matchesMisa(gift);
  await g.run([...scene('star_tree'), N(`Misa leaves the gift beside ${nameOf(to)}'s mug of cocoa and slips away.`), sayLine(to, GIVE_LINE[r]), { t: 'emote', who: to, icon: r === 'love' || r === 'like' ? 'heart' : 'i_question' },
    { t: 'wait', dur: 0.4 }, N('Meanwhile, a small parcel appears in Misa\'s hands. A tag says: "From your secret friend. Merry Starry Eve."'), say('misa', 'surprised', 'For me? Who is it from?!'), { t: 'wait', dur: 0.4 },
    say(from, 'happy', `Surprise! It was me, ${nameOf(from)}. I hope you like it.`)]);
  if (has(gift)) g.give(gift, 1);
  s.got = 1;
  await g.run([say('misa', 'happy', match ? `${get('item', gift).name}! It's exactly my taste! How did you know?` : `${get('item', gift).name}! Thank you, ${nameOf(from)}!`), { t: 'emote', who: 'misa', icon: 'heart' }, ...endScene]);
  g.addFriend(from, 30 + (match ? 25 : 0) + (r === 'love' ? 15 : 0)); g.addMood(14); g.stat('giftSwaps'); g.stat('secretGifts');
  const rank = r === 'love' ? 1 : r === 'like' ? 2 : r === 'neutral' ? 3 : 4, score = { love: 100, like: 75, neutral: 50, dislike: 25, hate: 10 }[r];
  const gotS = souvenir(g, 'gift_sv2_star_ornament');
  recordResult(g, 'starryeve', { score, rank });
  await resultCard(g, { title: 'Secret Gift', sub: `You gave ${get('item', id).name} to ${nameOf(to)}`, score, rank, lines: [`${nameOf(to)} reaction: ${r.toUpperCase()}`, `Secret friend: ${nameOf(from)} gave you ${get('item', gift).name}`, gotS ? 'Souvenir: Star ornament' : match ? 'It matches your taste!' : 'A thoughtful surprise'] });
}
setActs('starryeve', ['swap'], [{ id: 'swap', map: 'town', spot: 'fountain', dy: 3, label: 'Secret gift exchange', run: secretGift }]);
{
  const f = fest('starryeve'), prev = f.setup;
  f.setup = (g) => { if (prev) prev(g); const s = drawSecret(g); g.toast(`Starry Eve: your secret friend is ${nameOf(s.to)}!`, 'i_star'); };
  f.lines = { ...(f.lines || {}), kai: 'happy|I drew a name and I am not telling you whose. Okay, it is a friend. A good one.', rina: 'happy|The exchange is the best tradition. I wrapped mine four times.' };
}

// =================================================================== 7. ICE FISHING DAY (winter 11)
async function iceContest(g) {
  if (doneToday(g, 'icefest:contest')) return g.say('jun', 'happy', 'Done for the day, champ! Even the fish need a rest.');
  if (!g.spend(50)) return g.say('jun', 'neutral', 'The entry fee is 50 coins. Hot stew is on the house, but the contest is not!');
  g.sfx('coin');
  await g.run([say('jun', 'happy', 'Welcome to Ice Fishing Day! Four casts through the hole. Biggest total wins. I will lend you a rod!'), say('kai', 'happy', 'I brought a thermos and a lucky hat. Let the games begin.')]);
  let total = 0, caught = 0, quit = false;
  for (let i = 0; i < 4 && !quit; i++) {
    const fish = rollFish(g, 'harbour', true, null), tier = g.has('tool_rod_3') ? 3 : g.has('tool_rod_2') ? 2 : 1;
    const r = await g.minigame('hob_fishing', { fish: fish.id, tier, calm: g.hasBuff && g.hasBuff('calm'), skill: g.skillLevel('fishing'), ocean: true, night: false });
    g.advance(15);
    if (r.quit) { quit = true; break; }
    const d = r.data;
    if (d && d.caught) { caught++; total += d.size + fish.rarity * 8; landFish(g, fish, d.size); g.toast(`Cast ${i + 1}/4: ${total} points`, 'i_fishicon'); }
    else g.toast(`Cast ${i + 1}/4: it got away`, 'i_fishicon');
  }
  markDone(g, 'icefest:contest');
  const rr = g.rngFor('sv2ice' + g.day), rivals = [['jun', 'Jun', 85 + Math.round(rr() * 50)], ['kai', 'Kai', 45 + Math.round(rr() * 50)], ['theo', 'Theo', 30 + Math.round(rr() * 70)], ['hina', 'Hina', 40 + Math.round(rr() * 60)]];
  const rank = Math.min(4, 1 + rivals.filter((x) => x[2] > total).length), score = Math.min(100, Math.round(total * 0.75));
  const coins = [0, 800, 400, 150, 50][rank], rivalText = rivals.map((x) => `${x[1]} ${x[2]}`).join(', ');
  await g.run([N(`The horn blows. Misa's total: ${total} points from ${caught} fish. Others: ${rivalText}.`),
    ...(rank === 1 ? [say('jun', 'surprised', 'A landlubber topping my own score?! Ha! Champion of the ice!')] : rank <= 3 ? [say('jun', 'happy', 'A fine showing! You will take my seat yet.')] : [say('jun', 'happy', 'Even a dry net leaves a good story. Have some stew.')]), { t: 'money', n: coins }]);
  if (rank === 1) stickers(g, 3, 'Ice fishing champion'); else if (rank === 2) stickers(g, 1, 'Ice fishing runner-up');
  g.addFriend('jun', rank <= 2 ? 25 : 12); g.stat('iceContests');
  const gotS = rank <= 2 ? souvenir(g, 'gift_sv2_ice_trophy') : false;
  recordResult(g, 'icefest', { score, rank });
  await resultCard(g, { title: 'Ice Fishing Day', sub: rivalText, score, rank, lines: [`${caught} fish, ${total} points`, `Prize: ${coins} coins`, gotS ? 'Souvenir: Ice fishing trophy' : 'The fish are in your bag!'] });
}

// =================================================================== 8. NEW YEAR'S EVE COUNTDOWN
async function nyeCountdown(g) {
  if (doneToday(g, 'newyear:countdown')) return g.say('misa', 'happy', 'Happy new year! ...Again. It never gets old.');
  const here = ['kai', 'suzu', 'rina', 'theo', 'hina', 'tobias'].filter((id) => exists(id) && g.minutes < 25 * 60);
  await g.run([...scene('sv2_nye'), N('The whole square is packed under the clock tower. Paper lanterns, steaming amazake, and the great clock face glowing like a moon.'),
    say('tobias', 'happy', 'The clock is correct to the second. I checked three times. Be quiet, everyone! It is nearly time.'), say('kai', 'happy', 'Ten seconds! Everyone ready? Get your fireworks hands warmed up!')]);
  if (g.minutes < 23 * 60 + 50) g.advance(23 * 60 + 50 - g.minutes);
  const r = await g.minigame('sv2_fireworks', {});
  if (g.minutes < 24 * 60) g.advance(24 * 60 + 3 - g.minutes);
  markDone(g, 'newyear:countdown');
  const perfect = (r.data || {}).perfect || 0, score = Math.round(r.score * 100), rank = rankOfScore(score, 85, 60, 30);
  await g.run([{ t: 'sfx', name: 'sv2_dong' }, N('BONG. The clock strikes twelve. The square erupts in cheers.'), say('suzu', 'happy', 'Happy New Year, Misa! It feels like the start of a long, good chapter.'), say('kai', 'happy', 'Happy New Year! Next year: I score a goal in the final. Write that down.'),
    say('misa', 'happy', 'Happy New Year, everyone! Let this one be a good one.'), { t: 'emote', who: 'misa', icon: 'heart' }, ...endScene]);
  for (const id of here) g.addFriend(id, 22);
  g.addMood(16); g.stat('nyeCountdowns');
  const gotS = souvenir(g, 'gift_sv2_hamaya');
  recordResult(g, 'newyear', { score, rank });
  await resultCard(g, { title: 'Midnight Countdown', sub: 'Clock tower plaza', score, rank, lines: [`${perfect} perfect bursts`, `${here.length} friends cheered with you (+22)`, gotS ? 'Souvenir: Hamaya arrow' : 'A very good new year'] });
}
setActs('newyear', [], [{ id: 'countdown', map: 'town', spot: 'clocktower', dy: 3, label: 'Midnight countdown', when: 'time>=22:00&time<25:30', run: nyeCountdown }]);
{
  const f = fest('newyear');
  f.decor = { ...(f.decor || {}), town: [T('clocktower', 'ev_chochin_white', -2, 3, { light: 'lantern' }), T('clocktower', 'ev_chochin_white', 2, 3, { light: 'lantern' }), T('fountain', 'ev_lanterns', 0, -3, { light: 'lantern' }), T('stage', 'ev_bunting_winter', 0, 2)] };
}

// =================================================================== new festival definitions
const NEW = {
  eggfest: {
    name: 'Egg Hunt Day', icon: 'i_star', date: 'spring-11', maps: ['town'], hours: ['10:00', '18:00'], holiday: true,
    desc: 'Painted eggs hide all over the town square. Hunt them before Rina does.',
    decor: { town: [T('fountain', 'ev_chochin_pink', -3, 0, { light: 'lantern' }), T('fountain', 'ev_chochin_pink', 3, 0, { light: 'lantern' }), T('market_1', 'ev_picnic_mat', 1, 1, { flat: true }), T('stage', 'ev_bunting', 0, 2), T('noticeboard', 'ev_lanterns_pink', 0, 1, { light: 'lantern' })] },
    activities: [{ id: 'hunt', map: 'town', spot: 'fountain', dy: 2, label: 'Join the Egg Hunt', when: 'time>=10:00', run: eggHunt }],
    lines: { rina: 'happy|I have mapped every bush in the square. Do not tell Misa. ...Oh, hi Misa!', kai: 'happy|I found two eggs already. Then Rina found them first. Then it was a dispute.', hina: 'happy|The eggs are painted so the beetles do not eat them. ...Do beetles eat eggs?', mika: 'happy|Egg sandwiches all day at the cafe terrace! I am not above a pun.' },
    closeAt: '17:00', closeMap: 'town',
    script: () => [say('rina', 'happy', 'Misa! The final tally is in. You gave me a good fight.'), say('misa', 'happy', 'It was a blast! Same time next year?'), say('rina', 'surprised', 'I have started a spreadsheet already.'), { t: 'friend', npc: 'rina', n: 15 }, { t: 'mood', n: 8 }],
  },
  luau: {
    name: 'Tide Luau', icon: 'i_sun', date: 'summer-24', maps: ['beach'], hours: ['16:00', '23:00'], shop: true,
    desc: 'A beach potluck at sunset. Everyone brings a dish for the great communal soup pot.',
    decor: { beach: [T('bonfire', 'ev_lanterns', 0, -3, { light: 'lantern' }), T('towel', 'ev_chochin', 1, 0, { light: 'lantern' }), T('driftwood', 'ev_chochin_pink', -1, 0, { light: 'lantern' }), T('shore', 'ev_picnic_mat', 2, 0, { flat: true }), T('rocks', 'ev_chochin', 0, 0, { light: 'lantern' })] },
    activities: [{ id: 'pot', map: 'beach', spot: 'bonfire', dy: 1, label: 'Add to the communal pot', when: 'time>=16:00', run: luauPot }],
    lines: { mika: 'happy|The big pot is mine for tonight! Bring any dish, even a snack. A potluck is about the people.', kai: 'happy|I brought two portions of karaage for the pot and one for me. Do not tell the pot.', jun: 'happy|The tide brings in the best fire wood. And the best excuses to stay late.', hina: 'happy|The moon jellies come in two days. Put it on your calendar!' },
    closeAt: '21:00', closeMap: 'beach',
    script: () => [...scene('sv2_luau'), say('mika', 'happy', 'The pot is scraped clean. Three cheers for the cooks!'), say('kai', 'happy', 'Cheers! And cheers to second helpings!'), say('jun', 'happy', 'To the tide, to the stars, and to a beach full of friends.'), { t: 'sfx', name: 'chime' }, { t: 'mood', n: 12 }, ...endScene],
  },
  jellies: {
    name: 'Moonlight Jellies', icon: 'i_star', date: 'summer-26', maps: ['beach'], hours: ['19:30', '24:00'], weather: 'clear',
    desc: 'After dark, glowing moon jellies drift along Shell Beach in a slow procession.',
    activities: ['sandbar', 'rocks', 'driftwood'].map((v) => ({ id: 'watch_' + v, map: 'beach', spot: v, dy: v === 'sandbar' ? 0 : 1, label: v === 'sandbar' ? 'Watch the jellies from the sandbar' : v === 'rocks' ? 'Watch the jellies from the rocks' : 'Watch the jellies from the driftwood', when: 'time>=20:00', run: (g) => jellyWatch(g, v) })),
    lines: { hina: 'happy|They only glow when the sea is calm and the moon is thin! Find a quiet spot after eight!', kiko: 'happy|The shrine lanterns look dim tonight. The sea has taken the show.', theo: 'happy|Quiet night. Bring a coat.' },
  },
  icefest: {
    name: 'Ice Fishing Day', icon: 'i_fishicon', date: 'winter-11', maps: ['harbour'], hours: ['08:00', '18:00'], holiday: true, weather: 'clear',
    desc: 'The harbour freezes over its fishing hole. Four casts, biggest haul wins. Captain Jun lends the rods.',
    decor: { harbour: [T('pier_end', 'ev_derby_flag', 0, -1), T('dock', 'ev_derby_flag', 0, -1), T('bait_shop', 'ev_bunting_winter', 0, 2), T('bench', 'ev_snowman', 1, 1)] },
    activities: [{ id: 'contest', map: 'harbour', spot: 'pier_end', dy: -2, label: 'Enter the ice fishing contest (50c)', when: 'time<16:00', run: iceContest }],
    lines: { jun: 'happy|Fifty coins gets you a rod, four casts and a stew. Best deal on the bay!', kai: 'happy|I am not nervous. My hands are just cold. Very cold.', theo: 'happy|I came for the quiet. And the stew.', hina: 'happy|The ice makes the fish shy! Bring patience and a thermos.' },
    closeAt: '17:00', closeMap: 'harbour',
    script: () => [say('jun', 'happy', 'That is a wrap, you hearty crew! The ice sings, the stew is hot, and the fish are only half as clever as they think.'), say('misa', 'happy', 'Best day of the winter, Captain.'), { t: 'friend', npc: 'jun', n: 15 }, { t: 'mood', n: 10 }],
  },
};
for (const [id, def] of Object.entries(NEW)) if (!get('festival', id)) register('festival', id, def);

// =================================================================== festival-day schedule overrides
// Each plan: flag -> { npc: [[time, map, spot, dir], ...] }. A leading schedule group replaces the usual day.
const PLANS = {
  festival_hanami: { kai: [['11:30', 'park', 'lawn', 'left']], suzu: [['11:00', 'park', 'sakura_tree', 'up']], rina: [['12:00', 'park', 'bandstand', 'down']], theo: [['12:30', 'park', 'bridge', 'right']], hina: [['11:00', 'park', 'pond_edge', 'left']], goro: [['12:00', 'park', 'bench', 'right']], mika: [['11:30', 'park', 'playground', 'down']] },
  festival_eggfest: { rina: [['10:00', 'town', 'fountain', 'down']], kai: [['10:00', 'town', 'market_2', 'down']], hina: [['10:30', 'town', 'bench_1', 'up']], suzu: [['10:30', 'town', 'bench_2', 'down']], mika: [['10:00', 'town', 'cafe_terrace', 'down']], pip: [['10:00', 'town', 'noticeboard', 'down']], goro: [['11:00', 'town', 'clocktower', 'down']] },
  festival_luau: { mika: [['16:00', 'beach', 'bonfire', 'right']], kai: [['16:00', 'beach', 'shore', 'down']], suzu: [['16:30', 'beach', 'towel', 'right']], rina: [['16:30', 'beach', 'driftwood', 'down']], theo: [['17:00', 'beach', 'rocks', 'down']], hina: [['16:30', 'beach', 'sandbar', 'down']], jun: [['16:00', 'beach', 'shaved_ice', 'down']], kiko: [['17:00', 'beach', 'bonfire', 'left']], goro: [['17:00', 'beach', 'driftwood', 'right']] },
  festival_jellies: { hina: [['19:30', 'beach', 'driftwood', 'right']], theo: [['19:30', 'beach', 'rocks', 'down']], kiko: [['19:30', 'beach', 'sandbar', 'down']] },
  festival_harvest: { goro: [['09:00', 'town', 'stage', 'down']], ogawa: [['09:00', 'town', 'stage', 'down']], mika: [['10:00', 'town', 'market_1', 'down']], sachiko: [['09:00', 'town', 'market_2', 'down']], kai: [['12:00', 'town', 'bench_1', 'up']], suzu: [['12:00', 'town', 'fountain', 'down']], rina: [['11:00', 'town', 'noticeboard', 'down']], hina: [['12:00', 'town', 'bench_2', 'up']] },
  festival_starryeve: { kai: [['12:00', 'town', 'bench_1', 'up']], suzu: [['12:00', 'town', 'bench_2', 'up']], rina: [['12:00', 'town', 'fountain', 'down']], theo: [['13:00', 'town', 'noticeboard', 'down']], hina: [['13:00', 'town', 'market_1', 'down']], mika: [['12:00', 'town', 'cafe_terrace', 'down']], goro: [['14:00', 'town', 'clocktower', 'down']], sachiko: [['12:00', 'town', 'market_2', 'down']], kiko: [['15:00', 'town', 'bus_stop', 'down']], tobias: [['14:00', 'town', 'clocktower', 'down']], pip: [['12:00', 'town', 'ramen_cart', 'down']] },
  festival_icefest: { jun: [['08:00', 'harbour', 'bait_shop', 'down']], kai: [['09:00', 'harbour', 'dock', 'down']], theo: [['09:00', 'harbour', 'mural', 'down']], hina: [['09:00', 'harbour', 'pier_end', 'down']], rina: [['10:00', 'harbour', 'bench', 'down']], sachiko: [['09:00', 'harbour', 'market_stall', 'down']] },
  festival_newyear: { kai: [['21:00', 'town', 'fountain', 'up']], suzu: [['21:00', 'town', 'bench_1', 'up']], rina: [['21:00', 'town', 'bench_2', 'up']], theo: [['21:30', 'town', 'clocktower', 'up']], hina: [['21:00', 'town', 'market_1', 'up']], tobias: [['21:00', 'town', 'clocktower', 'down']], mika: [['21:00', 'town', 'cafe_terrace', 'down']], pip: [['21:00', 'town', 'noticeboard', 'down']] },
};
export function addSchedulePlans(plans) {
  for (const [flag, who] of Object.entries(plans)) for (const [id, stops] of Object.entries(who)) {
    const def = get('npc', id);
    if (!def || (def.schedule || []).some((grp) => grp.__sv2 === flag)) continue;
    def.schedule = [{ __sv2: flag, when: 'flag:' + flag, stops: [{ at: '06:00', map: null }, ...stops.map(([at, map, spot, dir]) => ({ at, map, spot, dir })), { at: flag === 'festival_newyear' ? '25:30' : '22:30', map: null }] }, ...(def.schedule || [])];
  }
}
addSchedulePlans(PLANS);

// ---------------------------------------------------------------- result stats also feed the old counters
export const PIECE_RUNNERS = { flowerDance, eggHunt, luauPot, jellyWatch, grangeDisplay, secretGift, iceContest, nyeCountdown };
export const DESCR = RIBBONS;
