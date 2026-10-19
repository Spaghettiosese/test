// Romance in the long story (sv4_romance): a love-ending postscript at graduation, a supportive face at the Act III Hall hearing,
// a year-end evaluation bonus, and eight optional, kind "friends cheering, nobody jealous" dramas (Rina's rival feelings,
// Suzu's writer-crush story and more). Console: __misa.sv4r.drama('rina_rival1')   __misa.sv4r.postscript()
import { register, get } from '../../core/registry.js';
import { sc, ch, fade, backdrop, mood, time } from '../social/util.js';
import { S, API, A, call, noteSeen, rec, firstName, nameOf, candidates, crush, aff, isCand } from './core.js';
import { voiceOf } from './voices.js';
import { confessSteps } from './confess.js';
import { coupleSteps } from './couple.js';
import { dateSteps } from './dates.js';
import { Y, defEvent, runP, giveOr } from '../sv3_years/util.js';

// ---------- graduation postscript ----------
export function postSteps(g, id) {
  const v = voiceOf(id), z = Y(g);
  return sc(id, fade(1, 0.8), backdrop('hanami'), fade(0, 0.8),
    '@Later that day, when the photographs are done and the school yard has gone quiet, someone is waiting for you under the cherry trees.',
    ...v.post,
    z.grad && z.grad.title ? `@Your path: ${z.grad.title}. Whatever it is, you walk it with someone's hand in yours.` : null,
    call((gg) => { S(gg).postDone[id] = gg.day; noteSeen(gg, `post_${id}`, `${firstName(id)}: after the ceremony`, id); gg.stat('lovePostscripts'); gg.bus.emit('lovePostscript', { npc: id }); gg.toast('A love-ending postscript', 'heart'); }),
    mood(20), backdrop(null), fade(1, 0.6), fade(0, 0.6));
}
defEvent({ key: (g) => { const s = S(g), id = s.partner; return id && Y(g).graduated && !s.postDone[id] ? `sv4r_post_${id}` : null; }, run: (g) => runP(g, postSteps(g, S(g).partner)) });

// ---------- Act III hearing: a familiar face in the third row ----------
const HEAR = {
  kai: ['happy|MISA! LET US GOOO! ...Sorry. Sorry, Madam Chair. Carry on.', '@Kai sits down, red as a tomato, flashing two thumbs up from the third row.'],
  suzu: ['@In the third row Suzu is clutching her notebook, mouthing a single line: you already know the ending.', 'happy|(She nods, tiny but sure.)'],
  rina: ['@Rina sits ramrod straight in the front row, her binder open to your tab. When you look up she gives one precise nod. It says: I would rank you first.'],
  theo: ['@Theo stands at the back, headphones round his neck for once not playing anything. He lifts one hand a few inches. It is the loudest cheer he has.'],
  hina: ['happy|(Hina holds up a jar. A paper firefly glows inside. She whispers, loud enough for the whole row: you are the brightest!)'],
};
export function hearingSteps(g, id) {
  const lines = HEAR[id] || [`@${firstName(id)} sits near the front and gives you a small, steady smile.`];
  return sc(id, '@In the middle of the hush, you find a familiar face in the crowd.', ...lines, call((gg) => { gg.setFlag('sv4r_hearing_support', true); gg.addMood(10); noteSeen(gg, `hearing_${id}`, `${firstName(id)} at the hearing`, id); addAffSafe(gg, id); }));
}
const addAffSafe = (g, id) => { g.addFriend(id, 15); };
function wrapHearing() {
  const q = get('quest', 'sv3_q37');
  const st = q && q.stages && q.stages.find((s) => s.script && /public hearing/i.test(s.text || ''));
  if (!st || st.__sv4r) return;
  const orig = st.script; st.__sv4r = true;
  st.script = (g, ...a) => {
    const base = typeof orig === 'function' ? orig(g, ...a) : (orig || []), id = g.state.sv4r && g.state.sv4r.partner;
    if (!id || !get('npc', id)) return base;
    const i = base.findIndex((x) => x && x.t === 'choice');
    return i < 0 ? [...base, ...hearingSteps(g, id)] : [...base.slice(0, i), ...hearingSteps(g, id), ...base.slice(i)];
  };
}
wrapHearing();

// ---------- the dramas ----------
const seen = (g, k) => !!S(g).dramaDone[k];
const dating = (g, not) => { const p = S(g).partner; return !!p && p !== not; };
export const DRAMAS = [
  { id: 'rina_rival1', title: 'The Rival and the Date', who: 'rina', when: (g) => g.hearts('rina') >= 4 && dating(g, 'rina'),
    steps: () => sc('rina', 'Aoki. A word. I have noticed your lunches are more... cheerful. And your scores have drifted a fraction. Two points.', 'surprised|I want it known I am not jealous. I am a rival. Rivals notice.', 'sad|I mean, I would like it if you were happy and still beat me at maths. Is that too much to ask?',
      ch('How do you answer?', ['Promise to beat her in the next test', 'happy|Hmph! Now there is the Aoki I know. I will prepare a counter-strategy.', A('rina', 6), rec('drama_rina_rival1', 'A promise')], ['Say she is the best rival ever', 'happy|Obviously. And you are mine. Both things can be true.', A('rina', 6), rec('drama_rina_rival1', 'Best rival')], ['Invite her to study together', 'Hmph. A joint revision session. With snacks? ...Fine. Accepted.', A('rina', 8), rec('drama_rina_rival1', 'Study together')]),
      'happy|And Aoki? Whoever it is, they are lucky. Do not tell them I said so.') },
  { id: 'rina_rival2', title: 'A Duet for Two Rivals', who: 'rina', when: (g) => seen(g, 'rina_rival1') && g.hearts('rina') >= 6,
    steps: () => sc('rina', '@In the music corridor, Rina is tuning her violin with unusual care. She does not look up.', 'I am going to play something. It is not for a ranking. It is for a friend. I will not say which friend.', '@The music is slow and bright and a little bit wobbly at the end, like a person who has decided to be brave.',
      ch('When she finishes...', ['Applaud with both hands', 'happy|Hmph. Stop. Do not stop. That is... acceptable.', A('rina', 6), rec('drama_rina_rival2', 'Applause')], ['Tell her she plays like she means it', 'surprised|...I do. I do mean it. Thank you.', A('rina', 8), rec('drama_rina_rival2', 'She means it')], ['Ask for an encore', 'happy|Encore? I have only two other pieces. Fine. One.', A('rina', 6), rec('drama_rina_rival2', 'Encore')]),
      'I have decided that my rival being happy is not a threat. It is... a better standard to beat.') },
  { id: 'suzu_story1', title: 'A Story About Someone Else', who: 'suzu', when: (g) => g.hearts('suzu') >= 4,
    steps: () => sc('suzu', '@Suzu is in the library armchair writing frantically, a pencil in her hair and another in her mouth.', 'Misa! Good. I need a second opinion. I am writing a love story. A girl who likes someone from a distance, and never says so.', 'It is fiction. Wholly fiction. Do not look at me like that.',
      ch('Suzu asks: what should she do?', ['Tell the girl to be brave', 'happy|Brave. Hm. I wrote her as brave yesterday and she hid in a wardrobe.', A('suzu', 6), rec('drama_suzu_story1', 'Be brave')], ['Let the girl write a letter', 'A letter! Yes! Letters can wait. Letters can be rewritten. Perfect.', A('suzu', 8), rec('drama_suzu_story1', 'A letter')], ['Say the story is already lovely', 'happy|Thank you. That is the nicest thing a first reader can say.', A('suzu', 6), rec('drama_suzu_story1', 'Already lovely')]),
      'happy|I think the girl will be fine. Writers always know in the end.') },
  { id: 'suzu_story2', title: 'Chapter Seven', who: 'suzu', when: (g) => seen(g, 'suzu_story1') && g.hearts('suzu') >= 6,
    steps: () => sc('suzu', '@Suzu hands you a stapled bundle of pages and sits very still, hands folded.', 'It is chapter seven. The girl says it. Out loud. The boy is... a quiet person with paint on his sleeves, and a loud one who eats three lunches, and someone else I made up. I am not saying who is who.', '@You read it carefully. In the story, nobody is jealous. Nobody is left out. Everyone ends up at one long table, sharing noodles.',
      ch('What do you tell her?', ['The table scene made me smile', 'happy|That was the part I was proudest of. I wrote it twice.', A('suzu', 6), rec('drama_suzu_story2', 'The table scene')], ['Everyone is kind in your stories', 'Yes. Is that unrealistic? I think it is optimistic. A genre.', A('suzu', 8), rec('drama_suzu_story2', 'Everyone is kind')], ['I want a copy', 'happy|A copy. A real copy. Bound. I will do it tonight.', A('suzu', 6), rec('drama_suzu_story2', 'A copy')]),
      'I have decided that being the author of the table is better than being a person at the head of it.') },
  { id: 'kai_theo', title: 'Two Boys and a Banner', who: 'kai', when: (g) => g.hearts('kai') >= 4 && g.hearts('theo') >= 4 && !!S(g).partner,
    steps: () => sc('kai', '@Kai and Theo are in the corridor with a roll of paper between them, arguing in whispers.', 'surprised|Misa! Perfect timing! Theo says a banner for the festival should be tasteful. I say it should say LET US GOOO in red.', 'Tasteful. Red. Both. I proposed a gradient.',
      ch('Your verdict?', ['Red, but with Theo\'s lettering', 'happy|Compromise! Theo, you do the letters. I do the exclamation marks!', A('kai', 4), rec('drama_kai_theo', 'Both')], ['Tasteful, with one red word', 'Theo wins. Fine. I get one red word. LET US GOOO. Done.', A('kai', 3), rec('drama_kai_theo', 'Tasteful')], ['Make it a gradient', 'happy|A gradient! Theo, you are a genius. Kai, you are a gradient.', A('kai', 4), rec('drama_kai_theo', 'Gradient')]),
      'happy|We are going to cheer louder than anyone. For you, and for whoever you want to cheer for. Friends do that.') },
  { id: 'hina_match', title: 'Bug Courtship', who: 'hina', when: (g) => g.hearts('hina') >= 4 && !!S(g).partner,
    steps: () => sc('hina', 'happy|Misa! Misa! Did you know male fireflies flash a pattern to say hello to a particular female?! It is called courtship! I made a chart!', '@She unrolls a long paper covered in tiny arrows and doodled fireflies.', 'happy|I am not saying anything about anything! I am saying fireflies are brave! Be like a firefly! Whatever you decide!',
      ch('You study the chart.', ['Ask which pattern is the bravest', 'happy|The long slow blink! It says I am here, and I am not leaving!', A('hina', 6), rec('drama_hina_match', 'The long slow blink')], ['Say you will flash right back', 'happy|YES! Team firefly!', A('hina', 6), rec('drama_hina_match', 'Flash back')], ['Copy the chart for your room', 'Take it! Take two! I made nine!', A('hina', 5), rec('drama_hina_match', 'Copy the chart')]),
      'happy|Whoever you light up for, I am cheering! Loudest! After Kai!') },
  { id: 'dance_rivals', title: 'Two Dance Partners', who: 'kai', when: (g) => !S(g).partner && crush(g, 'kai') >= 3 && crush(g, 'hina') >= 3 && get('npc', 'hina'),
    steps: () => sc('kai', '@Kai and Hina are standing together at the bandstand, each holding a paper straw. One is longer than the other.', 'surprised|Misa! We both want to ask you to dance at the festival! We did not know! We decided to draw straws! Fair is fair!', 'hina/happy|And whoever does not get the first dance gets the second! And a snack! It is a good plan!',
      ch('How do you respond?', ['Say you would love to dance with both', 'happy|Both! Okay! I am happy! Hina is happy! We are all dancing!', A('kai', 6), rec('drama_dance_rivals', 'Dance with both')], ['Say you cannot choose, but you are touched', 'hina/happy|That is okay! A not-choice is a choice to be touched! We are touched too!', A('kai', 4), rec('drama_dance_rivals', 'Touched')], ['Offer to dance the first with Kai, the second with Hina', 'happy|Perfect! Same as the straws! The straws were just for fun!', A('kai', 6), rec('drama_dance_rivals', 'One each')]),
      'happy|Whatever happens, nobody is mad. Dances are for dancing!') },
  { id: 'friends_after', title: 'Still Friends', who: 'kai', when: (g) => Object.keys(S(g).friends).length > 0 && !S(g).partner,
    steps: (g) => { const id = Object.keys(S(g).friends)[0] || 'kai', nm = nameOf(id); return sc(id, `@You run into ${nm.split(' ')[0]} after school. There is a small, careful moment, and then a smile.`, 'happy|Hey. I wanted to say I am not weird about it. Not even a little. You are my friend and that is a good thing to be.', ch('What do you say?', ['Say you are glad too', 'happy|Good. Then I will keep sitting next to you at lunch. As a friend. Deal?', A(id, 4), rec('drama_friends_after', 'Glad too')], ['Say thank you for being kind', 'happy|It is easy to be kind to you.', A(id, 4), rec('drama_friends_after', 'Thank you')], ['Ask them to the next festival, as friends', 'happy|Yes! As friends! Yes!', A(id, 4), rec('drama_friends_after', 'Next festival')]), '@The air is clear and bright again. Some endings are really just a change of seats.'); } },
];
export const dramaSteps = (g, d) => [...sc(d.who, ...d.steps(g)), call((gg) => { S(gg).dramaDone[d.id] = gg.day; noteSeen(gg, `drama_${d.id}`, d.title, d.who); gg.stat('romDramas'); })];
function installDramaHooks() {
  for (const d of DRAMAS) {
    const nid = d.id === 'friends_after' ? 'kai' : d.who;
    if (!get('npc', nid)) continue;
    register('talkHook', 'sv4r_drama_' + d.id, { npc: nid, priority: 50, when: (g) => !S(g).dramaDone[d.id] && d.when(g) && g.check('time>=12:00'), steps: (g) => dramaSteps(g, d) });
  }
}
installDramaHooks();

// ---------- year-end evaluation: a loving bonus ----------
register('system', 'sv4Story', {
  init(game) {
    game.bus.on('svEvaluation', () => {
      const id = S(game).partner;
      if (!id) return;
      const n = S(game).steady[id] ? 3 : 2;
      if (get('item', 'star_sticker')) { game.give('star_sticker', n, true); game.stat('starStickers', n); }
      game.addMoney(120, true); game.stat('romEval');
      game.mail(`sv4r_eval_${game.day}`, nameOf(id), `Congratulations on the evaluation, Misa. I was proud to watch you do it. I put a little something in with this note. - ${firstName(id)}`);
    });
  },
});

// ---------- replay (for the archive) ----------
export function replaySteps(g, key) {
  const m = key.match(/^(conf|couple|date|drama|post|hearing)_(.+)$/);
  if (!m) return null;
  const [, kind, rest] = m;
  if (kind === 'conf') { const [id, who] = rest.split('_'); return confessSteps(g, id, who); }
  if (kind === 'couple') { const [id, ev] = rest.split('_'); return coupleSteps(g, id, ev); }
  if (kind === 'date') { const [id, k] = rest.split('_'); return dateSteps(g, id, k, null); }
  if (kind === 'drama') { const d = DRAMAS.find((x) => x.id === rest); return d ? sc(d.who, ...d.steps(g)) : null; }
  if (kind === 'post') return postSteps(g, rest);
  if (kind === 'hearing') return hearingSteps(g, rest);
  return null;
}
API.drama = (g, id) => { const d = DRAMAS.find((x) => x.id === id); return d && g.run(dramaSteps(g, d)); };
API.postscript = (g, id) => g.run(postSteps(g, id || S(g).partner || 'kai'));
