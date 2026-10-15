import { npc, sc, ch, backdrop, time, giveOr, mood, xp, sfx } from '../util.js';

const call = [sfx('phone'), '@Misa\'s phone buzzes. Dad is video-calling from the ship\'s galley!', backdrop('soc_call_dad')];
const hang = [backdrop(null), '@The call ends. Somewhere at sea, Dad is probably still laughing at his own joke.'];

npc('dad', {
  name: 'Dad', role: 'Cook on the research ship Kujira', color: '#c8423a', hidden: true,
  bio: 'Ren Aoki: messy brown hair like Misa\'s, stubble, a white chef jacket and a red bandana. A pun machine, sentimental, sends recipes. Cries at report cards (happily).',
  look: { hair: '#5a3a2a', top: '#f4f4f0', bottom: '#3a3a4a', skin: '#ecc0a0', eyes: '#3a2a20', accent: '#c8423a' },
  birthday: { season: 'winter', day: 25 },
  hint: 'in the galley of the Kujira. Cook-along calls on Monday evenings, recipe texts on Fridays.',
  schedule: [],
  gifts: { love: ['gift_photo_mochi', 'gift_hot_sauce'], like: ['gift_postcard', 'gift_coffee_gift'], dislike: ['dish_mysterious_lump', 'crop_celery', 'dish_instant_noodles'], hate: [], likeTags: ['dish'] },
  lines: {
    default: ['happy|Misa! My favourite daughter! My only daughter! Still my favourite!', 'I made curry for forty scientists today. Thirty-nine loved it. One is allergic to joy.'],
    textReply: ['happy|(Text) Hi kiddo! Galley is rocking today. So is my soup. Literally.', '(Text) What do you call a fish with no eyes? A fsh. Love you!', 'happy|(Text) Mum says hi. I say hi louder. HI!'],
  },
  texts: {
    any: ['Friday recipe! Grandma\'s miso soup: dashi, miso, tofu, spring onion, and a tiny pinch of sugar. Shh. Secret.', 'Friday recipe! Tamagoyaki: eggs, a bit of sugar, soy sauce, patience. Roll it like a sleeping bag.', 'Friday recipe! Onigiri: wet hands, salt on your palms, squeeze like you\'re holding a baby bird.', 'Friday recipe! Curry: onions slow, slow, slower. Then everything else. Then sleep on it. It\'s better tomorrow.', 'Friday recipe! Hot cocoa the Aoki way: milk, cocoa, a pinch of salt, and one marshmallow for Mochi to stare at.'],
  },
  events: [
    { id: 'dad_h2', hearts: 2, map: 'home', when: 'day:mon&time>=19:00&time<21:00',
      script: () => sc('dad', ...call, 'happy|Cook-along time! Get to the kitchen! Tonight: Grandma\'s tamagoyaki!',
        '@Eggs, sugar, a dash of soy. Dad\'s phone is propped on a spice rack, swaying with the ship.',
        ch('The egg is setting. Now what?',
          ['Roll it gently with chopsticks', '@A neat golden roll.', 'happy|PERFECT! That\'s an Aoki egg! I\'m crying!', 25],
          ['Flip the whole thing', '@It lands half in the pan, half on the stove.', 'happy|That\'s an omelette now! Totally valid! Very abstract!', 20]),
        'happy|You\'re a natural. Egg-cellent work. ...I\'ve been waiting all day to say that.', ...hang, xp('cooking', 15)) },
    { id: 'dad_h4', hearts: 4, map: 'home', when: 'time>=18:00&time<22:00',
      script: () => sc('dad', ...call, 'Misa. I challenge you. To a PUN-OFF.', '>surprised|Oh no.', 'happy|Oh YES. Round one: I\'m reading a book about anti-gravity. It\'s impossible to put down.',
        ch('Your comeback?',
          ['I used to hate facial hair, but then it grew on me', 'surprised|...She\'s good. She\'s REALLY good.', 30],
          ['Dad, please', 'happy|Is that a forfeit? I accept your forfeit with grace and pride.', 15],
          ['What do you call a sleeping cat? A cat-nap', 'happy|Mochi-based humour! Respect.', 25]),
        'Mum says we\'re both banned from dinner conversation for a week. Worth it.', ...hang, mood(10)) },
    { id: 'dad_h6', hearts: 6, map: 'home', when: 'time>=18:00&time<22:00',
      script: () => sc('dad', ...call, 'happy|Okay, watch this! Today I\'m going to flip a pancake in rough seas! On camera!',
        '@The galley tilts. Dad tilts. The pancake goes up. The ship goes sideways. The pancake does not come down.',
        'surprised|...Where did it go?', '@A wet slap. Off-camera, Mum yells, "REN!"',
        ch('What do you say?',
          ['(Laugh until you cry)', 'happy|Yeah. Yeah, okay. That\'s fair. I\'m laughing too.', 35],
          ['Is Mum okay?', 'happy|She\'s fine. She\'s wearing a pancake as a hat. It\'s a good look.', 30]),
        ...hang, mood(15)) },
    { id: 'dad_h8', hearts: 8, map: 'home', when: 'time>=18:00&time<22:00',
      script: () => sc('dad', ...call, 'Kiddo. Pen and paper. I\'m about to tell you the most important thing I know.',
        'My secret Starlight Mochi. Grandma\'s recipe, plus one thing. Toasted black sesame and a drop of yuzu honey in the middle. Like a star inside.',
        'sad|I made it for Mum the night I proposed. I\'ve never written it down. Now it\'s yours.',
        ch('What do you say?',
          ['I\'ll make it for you when you\'re home', '*>heart', 'happy|...Okay, now I\'m actually crying. Thanks, kiddo.', 40],
          ['Can I put it on the cafe menu?', 'happy|Ha! Only if they call it the Ren Special. Kidding. Call it whatever you like.', 35]),
        { t: 'set', flag: 'soc_dad_recipe' }, ...hang, xp('cooking', 30)) },
  ],
});
