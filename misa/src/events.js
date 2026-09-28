// Random events. Each has a condition, weight and a cutscene script.
// Steps: say | wait | fade | scene | sfx | call | choice (see cutscene.js)
import { DECOR } from './world.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });

export const EVENTS = [
  { id: 'parcel', weight: 3, cond: (s) => s.minutes >= 8 * 60 && s.minutes < 19 * 60 },
  { id: 'rain', weight: 2, cond: (s) => !s.raining && s.minutes < 17 * 60 },
  { id: 'catGift', weight: 3, cond: () => true },
  { id: 'catKnock', weight: 2, cond: (s) => s.chores.some((c) => c.id === 'dishes' && c.done) },
  { id: 'zoomies', weight: 2, cond: (s) => s.minutes >= 9 * 60 },
  { id: 'blackout', weight: 1, cond: (s) => s.minutes >= 17 * 60 && s.minutes < 21 * 60 },
  { id: 'star', weight: 5, cond: (s) => s.minutes >= 20 * 60 && s.minutes < 22 * 60 },
];

export function pickEvent(rng, s) {
  const ok = EVENTS.filter((e) => !s.eventsToday.includes(e.id) && e.cond(s));
  const total = ok.reduce((a, e) => a + e.weight, 0);
  if (!total) return null;
  let r = rng() * total;
  for (const e of ok) if ((r -= e.weight) < 0) return e.id;
  return ok[ok.length - 1].id;
}

export const INTRO = [
  { t: 'fade', to: 1, dur: 0 },
  say(null, null, 'Misa\'s little house sits at the end of a quiet lane, where the mornings smell like toast.'),
  { t: 'fade', to: 0, dur: 1.2 },
  say('MISA', 'sleepy', 'Mmm... five more minutes...'),
  say('MOCHI', 'neutral', 'Mrrrow.'),
  say('MISA', 'surprised', 'Okay, okay! Mochi, you already ate the alarm clock\'s job.'),
  say('MISA', 'happy', 'A cozy house does not tidy itself. Let\'s get to it. Walk with WASD, press E near things.'),
];

export function scriptFor(id, g) {
  const s = g.state;
  switch (id) {
    case 'parcel': {
      const free = Object.keys(DECOR).filter((d) => !s.decor.includes(d));
      const item = free.length ? free[Math.floor(g.rng() * free.length)] : null;
      return [
        { t: 'sfx', name: 'bell' },
        say('MISA', 'surprised', 'Ding-dong! Was that the door?'),
        { t: 'call', fn: () => g.showPip(true) },
        say('PIP', 'happy', 'Special delivery for Miss Misa! Rain, snow or sleepy cat, the post must go through.'),
        say('MISA', 'happy', 'Pip! You are a lifesaver. I did not order anything, though...'),
        say('PIP', 'neutral', item ? 'The tag says it is from your Aunt Nori. She says "for a cozier home".' : 'Only a note today: "Keep being cozy. - Aunt Nori".'),
        { t: 'call', fn: () => { if (item) g.giveDecor(item); g.addMood(8); } },
        item ? say('MISA', 'happy', `Aww! ${DECOR[item].name}! I know exactly where it goes.`) : say('MISA', 'happy', 'Aww, that is the nicest note ever.'),
        { t: 'call', fn: () => g.showPip(false) },
        say('PIP', 'happy', 'Bye now! Say hi to Mochi!'),
      ];
    }
    case 'rain':
      return [
        { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'rain' }, { t: 'sfx', name: 'thunder' }, { t: 'fade', to: 0, dur: 0.6 },
        say('MISA', 'surprised', 'Oh! Look at that rain roll in!'),
        say('MOCHI', 'sleepy', 'Prrr...'),
        say('MISA', 'happy', 'Perfect napping weather. And the plants get a free drink today.'),
        { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'call', fn: () => g.startRain() }, { t: 'fade', to: 0, dur: 0.6 },
      ];
    case 'catGift':
      return [
        { t: 'call', fn: () => g.catComes() },
        { t: 'sfx', name: 'meow' },
        say('MOCHI', 'happy', 'Mrrp! Mrrp!'),
        say('MISA', 'surprised', 'Mochi, what have you got there? Is that... a button?'),
        say('MISA', 'happy', 'It is the shiniest button in the world. Thank you! I will keep it forever.'),
        { t: 'call', fn: () => { g.addMood(6); g.addStars(1); g.toast('Mochi gave you a gift! +1 star'); } },
      ];
    case 'catKnock':
      return [
        { t: 'call', fn: () => g.catComes() },
        say('MISA', 'neutral', 'Mochi... why are you looking at that plate like that?'),
        { t: 'sfx', name: 'wrong' },
        say('MOCHI', 'happy', '*crash*'),
        say('MISA', 'surprised', 'MOCHI!'),
        say('MISA', 'neutral', 'Fine. That is one more plate for the sink. At least you look proud of yourself.'),
        { t: 'call', fn: () => g.addChore('dishes') },
      ];
    case 'zoomies':
      return [
        say('MOCHI', 'happy', 'Mrrrrow!!'),
        say('MISA', 'surprised', 'The zoomies! Everyone stay calm!'),
        { t: 'call', fn: () => g.startZoomies() },
        { t: 'call', fn: () => g.addMood(6) },
      ];
    case 'blackout':
      return [
        { t: 'sfx', name: 'thunder' }, { t: 'fade', to: 1, dur: 0.15 }, { t: 'call', fn: () => g.startBlackout() }, { t: 'fade', to: 0, dur: 0.6 },
        say('MISA', 'surprised', 'Whoa! The power went out!'),
        say('MOCHI', 'neutral', 'Mrow.'),
        say('MISA', 'happy', 'It is okay. I have my little lantern. Everything looks so cozy in the dark.'),
      ];
    case 'star':
      return [
        { t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: 'night' }, { t: 'fade', to: 0, dur: 0.8 },
        say('MISA', 'happy', 'Look, Mochi! The sky is so clear tonight.'),
        { t: 'wait', dur: 0.8 }, { t: 'call', fn: () => g.scene && g.scene.shoot && g.scene.shoot() }, { t: 'sfx', name: 'star' },
        say('MISA', 'surprised', 'A shooting star! Quick, make a wish!'),
        {
          t: 'choice', options: [
            { text: 'A quiet day tomorrow', steps: [say('MISA', 'happy', 'I wished for a slow, sunny morning.'), { t: 'call', fn: () => g.addMood(10) }] },
            { text: 'Mochi to be happy', steps: [say('MISA', 'happy', 'I wished for Mochi to always have warm laps.'), say('MOCHI', 'happy', 'Prrrr...'), { t: 'call', fn: () => { g.addMood(6); g.addStars(2); } }] },
            { text: 'Aunt Nori to visit', steps: [say('MISA', 'happy', 'I wished Aunt Nori would come by soon.'), { t: 'call', fn: () => { s.flags.nori = true; g.addMood(6); } }] },
          ],
        },
        { t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.6 },
      ];
    default: return [];
  }
}
