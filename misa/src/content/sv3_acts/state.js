// Story Acts II and III (sv3_acts): shared state, the Tidekeeper letters, the Act III support score and the hooks
// the Act IV worker reads.
//
// Save data: state.sv3_acts = { letters:{k:day}, choices:{}, skipped:{n:day}, support:{...}, act2Ending, act3Result,
//   actsEnding ('stay'|'travel'|'study'|null), role, tent }
// Flags (game.flag): act2_done, act3_done, a2_cp1/a2_cp2/a2_cp3 (choice points), a2_reveal ('open'|'secret'),
//   a2_finale ('bell'|'boats'), a3_result ('saved'|'partial'|'reprieve'), a3_role, chapter_10_done .. chapter_40_done.
// Bus events: actsComplete { ending, act2, act3 }, act2Complete, act3Hearing { result }, sv3Letter { k }.
import { register } from '../../core/registry.js';

export const DEFAULT = () => ({
  letters: {}, choices: {}, skipped: {}, support: { sig: 0, recruits: 0, testimonies: 0, pledge: 0, council: 0, statement: 0, heist: 0 },
  act2Ending: null, act3Result: null, actsEnding: null, role: null, tent: null,
});
register('stateSlice', 'sv3_acts', { default: DEFAULT });
export function S(g) {
  const s = (g.state.sv3_acts ||= DEFAULT()), d = DEFAULT();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  for (const k of Object.keys(d.support)) if (s.support[k] === undefined) s.support[k] = 0;
  return s;
}

// Chapter table filled in by kit.js: n -> { n, act, name, qid, by, byMin, skip }
export const CHAPTERS = {};
export const ACT2 = [10, 24], ACT3 = [25, 40];
export const actOf = (n) => (n <= ACT2[1] ? 2 : 3);

// The Tidekeeper's letters. Letter k belongs to chapter 9 + k. Signed with a little wave.
export const LETTERS = [
  null,
  ['The unstamped letter', 'Dear new Keeper. The lamp is lit and I am glad. But a lamp is only half a light. The sea keeps a second kind: five small lanterns that once told the tide where to turn. Somebody has to wake them. The first page of the answer is where the Keeper writes her days.'],
  ['Pages travel', 'Dear Keeper. Ink travels further than people. One page sits with a man who keeps all the hours, one with a girl who keeps all the stories, and one where the town keeps its yesterday.'],
  ['The room under the bay', 'Dear Keeper. Under the beach is a room the sea visits twice a day. Press your hand to the carved star and ask it politely. It likes manners. Bring someone who is not afraid of crabs.'],
  ['What paint remembers', 'Dear Keeper. Colour remembers what paint forgets. Come to the harbour wall after dark, when the lamps are low, and bring someone who sees like an artist.'],
  ['Midsummer question', 'Dear Keeper. Midsummer is the one night the lantern boats are allowed to speak. Set one adrift from the bonfire. Ask it a question. Ask it kindly.'],
  ['Wood and wishes', 'Dear Keeper. Wishes are only letters addressed to nobody in particular. Kiko keeps a board of them. One has my handwriting, and it is not a wish.'],
  ['The slipped gears', 'Dear Keeper. A bell without a tide is just a loud teapot. The gears that carry the sea to the tower have slipped. Mr. Wren will pretend he does not mind.'],
  ['Weather', 'Dear Keeper. The sea sends warning before it sends weather. Tonight it is angry and the lanterns will sulk. Do not be a hero. Be a neighbour.'],
  ['What the tide lost', 'Dear Keeper. After storms one finds what the tide mislaid. Look for the bottle that is not rubbish. And look kindly at whoever helps you look.'],
  ['Moon with the shade off', 'Dear Keeper. Tonight the moon is a lamp with its shade off. Sit with the one who sits by the window. Say nothing clever. Listen to the song they hum.'],
  ['The shy lantern', 'Dear Keeper. Where the shrine roof gives way to old trees, something of mine sleeps. It is shy of strangers, not of you. Bring a little light and a lot of quiet.'],
  ['Blank page', 'Dear Keeper. Snow makes everything a blank page. The artist knows. Let him paint what cannot be said out loud, and do not read it until the paint is dry.'],
  ['A cup of tea', 'Dear Keeper. You have been patient and kind. I would like to tell you who I am, but a letter is the wrong place. Come to the room with the best tea and the oldest chair.'],
  ['Falling stars', 'Dear Keeper. The winter sky drops its stars in the middle of the month. Bring a teacher who counts, a friend who dreams, and a blanket. The fourth lantern is not made of fire.'],
  ['A hundred lights', 'Dear Keeper. On the last nights of the year a hundred small lights may cross the water, if the town asks. Choose how they sound: one bell, or a hundred small boats. Both are true.'],
  ['The second year', 'Dear Keeper. Towns forget to be towns when a clever stranger offers them a tidy future. Remind them. A hall is a lantern with a roof. A school is a lantern with a bell. You know what to do.'],
  ['The fifth lantern', 'Dear Keeper. The fifth lantern is not on the coast. It is wherever you decide to go next. Open the envelope that frightens you least. Then the one that frightens you most.'],
];
export const letterText = (k) => LETTERS[k] || ['', ''];

// ---------------------------------------------------------------- Act III: how much the town backs Misa
export const SUPPORT_PARTS = [
  ['Community Hall restored', 20], ['Friendships', 15], ['Year 1 evaluation', 15], ['Savings and pledge', 15],
  ['Petition signatures', 10], ['Open Campus', 10], ['Witnesses', 10], ['Act II goodwill', 5],
];
export function supportParts(g) {
  const s = S(g), sp = s.support;
  const ids = ['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'ogawa', 'hana', 'tobias', 'mika', 'sachiko', 'jun', 'kiko', 'pip', 'goro'];
  const hearts = ids.reduce((a, id) => a + (g.hearts ? Math.min(10, g.hearts(id) || 0) : 0), 0) / ids.length / 10;
  const ev = ((g.state.svlife && g.state.svlife.evals) || {})[1];
  const evl = ev ? Math.min(1, ev.total / 6000) : Math.min(1, (g.state.stats && g.state.stats.coinsEarned ? 0.3 : 0));
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return [
    g.flag('community_restored') ? 20 : 0,
    Math.round(15 * clamp(hearts * 1.6)),
    Math.round(15 * clamp(evl)),
    Math.round(5 * clamp(g.money / 5000) + 10 * clamp(sp.pledge / 1500)),
    Math.round(10 * clamp(sp.sig / 5)),
    Math.round(10 * clamp(sp.recruits / 4)),
    Math.round(10 * clamp(sp.testimonies / 4)) + Math.min(3, sp.statement) - 0,
    g.flag('act2_done') ? (s.act2Ending ? 5 : 3) : 0,
  ];
}
export const supportScore = (g) => Math.min(100, supportParts(g).reduce((a, b) => a + b, 0) + (S(g).support.council || 0) + (S(g).support.heist || 0));
export const resultOf = (score) => (score >= 70 ? 'saved' : score >= 45 ? 'partial' : 'reprieve');
