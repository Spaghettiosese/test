// Ten residents of the Mountain & Meadow regions with schedules on the new maps, lines, gifts and (for five) a three-event arc.
import { register, features } from '../../core/registry.js';
import { sc, ch, open, fade, time, mood, xp, giveOr, wait } from '../social/util.js';
import { SV4 } from './data.js';

const WK = 'day:sat|sun', bad = 'weather:rain|storm|snow';
const N = (id, d) => register('npc', id, { color: '#7a8f5a', ...d });
const arc = (id, stage) => ({ t: 'call', fn: (g) => { SV4(g).arcs[id] = stage; } });

N('chiyo_yk', {
  name: 'Okami Chiyo', role: 'Ryokan okami, Kitsune-no-Yu', color: '#c45a46',
  bio: 'Chiyo Ishikawa runs the Kitsune-no-Yu ryokan, as her mother and grandmother did. Silver bun, indigo kimono, a voice like warm tea. Never rushes, never misses a thing.',
  look: { hair: '#c8c8d8', top: '#2f3f7a', bottom: '#2f3f7a', skin: '#f2c9a4', eyes: '#3a2a22', accent: '#e8a0b0' }, birthday: { season: 'winter', day: 3 },
  hint: 'at the ryokan reception desk all day; steps out to sweep the entrance around noon',
  schedule: [{ stops: [{ at: '07:00', map: 'ryokan_lobby', spot: 'desk', dir: 'up' }, { at: '12:00', map: 'yukemuri_village', spot: 'ryokan_door' }, { at: '13:00', map: 'ryokan_lobby', spot: 'desk', dir: 'up' }, { at: '21:30', map: null }] }],
  gifts: { love: ['bev_green_tea', 'gift_wind_chime', 'gift_yk_snow_globe'], like: ['dish_yk_manju', 'gift_candle', 'gift_yk_charm'], dislike: ['snack_potato_chips'], hate: [], likeTags: ['sweet'] },
  lines: {
    default: ['Welcome to Kitsune-no-Yu. Shoes off, shoulders down, worries on the shelf.', 'A ryokan is a promise: whoever sleeps here wakes up lighter.', 'Tea first, always. Everything else can wait ten minutes.', 'Mind the third step. It creaks. My grandmother liked that. It tells her who is coming.', 'The mountain gives us the water. We only open the door.', 'You hold your cup like someone who listens. Good.'],
    morning: ['Mornings are for sweeping and for the first pot of tea.'], afternoon: ['Check-in is at three. I like to have the flowers fresh by then.'], evening: ['Dinner trays go out at six. The kitchen sounds like rain on a tin roof.'],
    rain: ['Rain on the roof tiles. Guests love it, the laundry does not.'], snow: ['Snow! The garden lanterns will wear little white hats tonight.'],
    spring: ['Spring brings the hikers. Muddy boots and happy faces.'], summer: ['Summer evenings, we open all the sliding doors. The whole house breathes.'], autumn: ['Koyo season. Every room is booked and every guest says "ahh" at the window.'], winter: ['Snow and hot water. The reason Yukemuri exists, truly.'],
    weekend: ['Weekends are full. I smile and carry trays and secretly count the stars.'],
    h2: ['You help without being asked. My grandmother would have loved you.'], h4: ['Call me Chiyo, please. Okami is for guests.'], h6: ['There is always a room for you here, Misa. Even when the sign says full.'],
    firstMeet: ['happy|Ah, a new face. I am Chiyo, the okami. Welcome to Yukemuri.'], birthday: ['happy|A birthday! Today you are the guest of honour.'],
    gift_love: ['happy|Oh... how did you know? Thank you, truly.'], gift_like: ['happy|How thoughtful. I will put it somewhere I can see it.'], gift_neutral: ['Thank you, dear.'], gift_dislike: ['neutral|Hm. Kind of you, but not quite for me.'], gift_hate: ['neutral|Ah. Let us not speak of this.'],
  },
  events: [
    { id: 'chiyo_h2', hearts: 2, map: 'ryokan_lobby', when: 'time>=10:00&time<17:00', script: () => sc('chiyo_yk', ...open('chiyo_yk'), 'happy|Misa, sit. Watch my hands. Tea is not a drink, it is a conversation.',
      '@She warms the cup, rolls the whisk, and sets a green bowl in front of you without a word.', ch('How do you hold the bowl?', ['Both hands, turn it twice', 'happy|Perfect. Where did you learn that?', 25], ['One hand, like a mug', 'happy|Ha! Honest, at least. Both hands next time.', 15]),
      '>It tastes like... a quiet forest.', 'happy|Exactly. Come back whenever you need one.', giveOr('bev_green_tea', 60), time(30), mood(10), arc('chiyo_yk', 1)) },
    { id: 'chiyo_h4', hearts: 4, map: 'ryokan_lobby', when: 'time>=10:00&time<17:00', script: () => sc('chiyo_yk', ...open('chiyo_yk'), 'There is a room on the top floor that has never had a guest. Room Moon. My mother kept it empty for someone.',
      '>Who?', 'My father, who left to climb the mountain and walked into a storm. He came home, in the end. But she kept the room.', ch('What do you say?', ['Keep it empty. It means something', 'happy|Yes. That is what I believe too.', 30], ['Maybe a guest could use it', 'happy|Perhaps one day. Perhaps you.', 25]),
      '@She presses a small amulet into your palm.', giveOr('gift_yk_charm', 150), mood(12), arc('chiyo_yk', 2)) },
    { id: 'chiyo_h6', hearts: 6, map: 'yukemuri_village', when: 'time>=17:00&time<21:00', script: () => sc('chiyo_yk', ...open('chiyo_yk'), '@Chiyo steps out into the evening street with a bundle over her arm. Steam drifts past the lanterns.',
      'happy|A yukata for you. Indigo, with white stars. Hold still.', '*>heart', '@Ten minutes later, Misa and Chiyo stand under the lamps, matching, grinning, quietly proud.', 'happy|Now you are a proper Yukemuri girl. Walk slowly, and let the town look at you.',
      giveOr('gift_yk_snow_globe', 300), 40, mood(18), arc('chiyo_yk', 3), { t: 'set', flag: 'sv4_chiyo_done' }) },
  ],
});
N('tetsuya_yk', {
  name: 'Tetsuya', role: 'Bath attendant, Yukemuri Yu', color: '#3f8fb8',
  bio: 'Tetsu Mori guards the public bath with a towel on his shoulder and a stern face over a soft heart. Believes in manners, in cold fruit milk and in the sacred rule of washing first.',
  look: { hair: '#2a2a3a', top: '#fffaf0', bottom: '#2f4f8a', skin: '#e0b090', eyes: '#2a2018', accent: '#2f4f8a' }, birthday: { season: 'summer', day: 15 },
  hint: 'at the public bath counter from eight; takes a break at the village bath door in the early afternoon',
  schedule: [{ stops: [{ at: '08:00', map: 'onsen_bath', spot: 'counter', dir: 'down' }, { at: '13:00', map: 'yukemuri_village', spot: 'bath_door' }, { at: '14:00', map: 'onsen_bath', spot: 'counter', dir: 'down' }, { at: '22:00', map: null }] }],
  gifts: { love: ['drink_yk_fruit_milk', 'gift_yk_towel'], like: ['dish_yk_onsen_egg', 'snack_pudding', 'gift_yk_sulfur_soap'], dislike: ['gift_hair_clip'], hate: [], likeTags: ['bath'] },
  lines: {
    default: ['Wash first. I will not say it twice. Well, I will say it every day.', 'Hot water is honest. It shows you exactly how tired you were.', 'Towel on the head, not in the bath. It is a small rule with a big heart.', 'Fruit milk after the bath, hand on hip. Tradition.', 'Quiet voices, please. The water is thinking.', 'Forty years behind this counter and I still get a thrill when the doors open.'],
    morning: ['The bath is cleanest at eight. Come early if you like it silent.'], evening: ['Evening crowd. Sixty towels, one attendant.'], rain: ['Rainy days, the outdoor bath is the best seat in the village.'], snow: ['Snow on your head, hot water on your shoulders. Pure luck.'],
    spring: ['Petals in the outdoor bath. I do not sweep them. Why would I?'], summer: ['Summer soaking is for the brave. Cold water after, please.'], autumn: ['Red leaves in the bath. I count them. I am up to nine hundred.'], winter: ['Winter is the season of this bath.'], weekend: ['Weekend rush. Please wash first, even when I am busy.'],
    h2: ['Your manners are better than most grown-ups. Good.'], h4: ['For you, half price. Do not tell the accountant. I am the accountant.'], h6: ['This bath has a secret: it is sweetest when you are not in a hurry.'],
    firstMeet: ['neutral|New face. Pass at the counter, wash first, towel on your head. Welcome.'], birthday: ['happy|You remembered? Hm. I will have an extra fruit milk.'],
    gift_love: ['happy|This is the good stuff. Thank you.'], gift_like: ['happy|Hm. Very kind.'], gift_neutral: ['Thank you.'], gift_dislike: ['Ah. No thank you.'], gift_hate: ['No.'],
  },
  events: [],
});
N('shun_tk', {
  name: 'Shun', role: 'Mountain guide, Tsukimi', color: '#5a8f58',
  bio: 'Shun Kaneda has guided hikers up Mount Tsukimi for twenty years and pulled thirty of them out of storms. Orange jacket, sun-creased grin, a rope on his shoulder and a flask of ginger tea.',
  look: { hair: '#4a3a30', top: '#e8803a', bottom: '#3a4a3a', skin: '#d6a07c', eyes: '#2a2018', accent: '#e8803a' }, birthday: { season: 'autumn', day: 4 },
  hint: 'at the trailhead desk in the morning, on the forest trail by day, at the hut in storms, sledding in winter',
  schedule: [
    { when: 'weather:storm', stops: [{ at: '07:00', map: 'mountain_hut', spot: 'bunk' }, { at: '20:00', map: null }] },
    { when: 'season:winter', stops: [{ at: '07:00', map: 'tsukimi_trailhead', spot: 'register' }, { at: '12:00', map: 'yukemuri_village', spot: 'sled_start' }, { at: '17:00', map: 'tsukimi_trailhead', spot: 'bench' }, { at: '19:00', map: null }] },
    { stops: [{ at: '06:30', map: 'tsukimi_trailhead', spot: 'register' }, { at: '10:00', map: 'tsukimi_forest', spot: 'bridge' }, { at: '14:00', map: 'tsukimi_forest', spot: 'deer_glade' }, { at: '17:00', map: 'tsukimi_trailhead', spot: 'bench' }, { at: '19:00', map: null }] },
  ],
  gifts: { love: ['gift_tk_bear_bell', 'dish_tk_mountain_stew', 'bev_green_tea'], like: ['dish_tk_oyaki', 'drink_tk_hot_amazake', 'forage_tk_maitake'], dislike: ['gift_candle'], hate: [], likeTags: ['hiking', 'forage'] },
  lines: {
    default: ['Mountains do not care about your plans. Bring a bell, bring a snack, bring patience.', 'Slow is smooth. Smooth is far.', 'The trick to a switchback is to forget the top and just enjoy the bend.', 'If you hear thunder, stop thinking about the view and start thinking about a roof.', 'I have never met a bad hiker. Only unprepared ones.', 'Look back sometimes. The trail looks different on the way down.'],
    morning: ['First light on the ridge. Nothing beats it, and I have seen it six thousand times.'], afternoon: ['Afternoon fog rolls in fast. Always check the sky behind you.'], evening: ['Back before dark. That is the whole job.'],
    rain: ['Rain on the trail makes roots slippery. Short steps, soft knees.'], snow: ['Snow day. Skis out, sleds out, and the monkeys come to watch.'], storm: ['Storm. Stay under a roof. Please.'],
    spring: ['Spring ferns on the forest floor. Look for the little fists.'], summer: ['Summer alpine roses on the summit. Do not pick them. Admire them.'], autumn: ['Koyo on the mountain is a free gift. Take your time with it.'], winter: ['Frost thistle on the high rocks. Sparkly and stubborn, like me.'], weekend: ['Weekends bring crowds to the bridge. I stand there and pretend to be calm.'],
    h2: ['You listen on the trail. That already puts you ahead of half my clients.'], h4: ['I trust you on the high path now.'], h6: ['I saved you a place for the dawn. Do not tell the tourists.'],
    firstMeet: ['happy|Hey! New to the mountain? I am Shun. Sign the register and take a Trail Book.'], birthday: ['happy|You know my birthday? Then you also know I would like a stew.'],
    gift_love: ['happy|Now THAT is a gift for a guide. Thank you!'], gift_like: ['happy|Great, thanks!'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm. Not for the trail, but thanks.'], gift_hate: ['No thanks.'],
  },
  events: [
    { id: 'shun_h2', hearts: 2, map: 'tsukimi_trailhead', when: 'time>=6:00&time<11:00&!weather:storm', script: () => sc('shun_tk', ...open('shun_tk'), 'Rule one: bell on your pack. Rule two: tell someone where you are going. Rule three: turn around when the mountain says so.',
      ch('Why the bell?', ['To keep bears away', 'happy|Right. They do not like surprises, either.', 20], ['To sound like a cat', 'happy|Ha! Also true.', 15]), '@He clips a brass bell to your bag. It chimes like tiny laughter.', giveOr('gift_tk_bear_bell', 100), xp('foraging', 10), mood(8), arc('shun_tk', 1)) },
    { id: 'shun_h4', hearts: 4, map: 'tsukimi_forest', when: 'time>=9:00&time<16:00&!weather:storm', script: () => sc('shun_tk', ...open('shun_tk'), 'This is the rope bridge. Built in 1962 and rebuilt every spring. Walk the center, and do not look down.',
      '@The bridge sways. Water roars below. Shun grins like a teenager.', ch('Your move?', ['Look down anyway', 'happy|Ha! Everyone does. Pretty, right?', 25], ['Look at the far end', 'happy|Right answer. That is the whole mountain secret.', 30]),
      'happy|You walk like someone who is not afraid of high places. Or who hides it well.', xp('foraging', 15), mood(10), arc('shun_tk', 2)) },
    { id: 'shun_h6', hearts: 6, map: 'tsukimi_summit', when: 'time>=4:30&time<8:30&!weather:storm', script: () => sc('shun_tk', ...open('shun_tk'), '@Dawn. A white sea of cloud fills the valley below, lit gold at the edges. Not one other soul on the summit.',
      'Twenty years, and I still stop here every time. See that ring around your shadow? The glory. It only shows when the sun is low and the cloud is thick.', '>It is like the mountain is wearing a halo.', 'happy|The mountain says thank you for coming up.',
      giveOr('tool_tk_poncho', 200), 40, mood(18), arc('shun_tk', 3), { t: 'set', flag: 'sv4_shun_done' }) },
  ],
});
N('osuzu_tk', {
  name: 'Granny Osuzu', role: 'Keeper of Tsukimi Hut', color: '#8f6a4a',
  bio: 'Osuzu Takeda has kept the Tsukimi hut for forty winters, carrying firewood on a back-basket the size of a door. She knits, hums, and feeds every hiker twice what they ordered.',
  look: { hair: '#e8e8f0', top: '#8f4a4a', bottom: '#4a4a5a', skin: '#e0b090', eyes: '#3a2a22', accent: '#e8c070' }, birthday: { season: 'spring', day: 14 },
  hint: 'by the stove in the hut all day, every day',
  schedule: [{ stops: [{ at: '05:30', map: 'mountain_hut', spot: 'stove', dir: 'up' }, { at: '20:00', map: null }] }],
  gifts: { love: ['dish_tk_oyaki', 'gift_wind_chime'], like: ['bev_green_tea', 'forage_tk_shimeji', 'snack_pudding'], dislike: [], hate: [], likeTags: ['food'] },
  lines: {
    default: ['Eat first. Talk after. The stew has been going since dawn.', 'The stove burns the same wood the mountain gave me. We are even.', 'You are thinner than last week. Sit. Sit!', 'A hut is a hug with a roof.', 'Forty years, and every storm I hear footsteps and say: please let it be someone who stopped in time.', 'Shoes by the door. Wet socks by the fire. Kindness by the table.'],
    morning: ['Tea is hot. Up the trail with you, but take a rice ball.'], afternoon: ['Fog is coming. Stay for another bowl.'], evening: ['Lamp on, door open. Anyone on the mountain can see it.'], rain: ['Rain on tin sounds like applause. Stay until it finishes.'], snow: ['Snow! Hot bean soup today. Do not argue.'], storm: ['Thunder. Everyone inside, everyone fed. That is the rule.'],
    spring: ['Bracken and butterbur: I pickle them every spring.'], summer: ['Summer hikers drink my barley tea by the jugful.'], autumn: ['Maitake season. The forest practically hands them to you.'], winter: ['Winter hut. Ten people on four bunks, and nobody minds.'], weekend: ['Weekends: loud, happy, muddy. My favourite.'],
    h2: ['You write nice things in the logbook. I read them all.'], h4: ['You may stoke the stove. Few get that honour.'], h6: ['This hut is a little bit yours now.'],
    firstMeet: ['happy|Come in, come in. Osuzu. Hut keeper. Hungry?'], birthday: ['happy|Oh my, you remembered. I will make dumplings.'],
    gift_love: ['happy|Oh! For me? You spoil an old woman.'], gift_like: ['happy|That is lovely, dear.'], gift_neutral: ['Thank you, dear.'], gift_dislike: ['Hm. Thank you anyway.'], gift_hate: ['Oh dear.'],
  },
  events: [],
});
N('daigo_ml', {
  name: 'Daigo', role: 'Rancher, Meadow Ranch', color: '#a67548',
  bio: 'Daigo Mizuno has run Meadow Ranch since his father passed it down. Broad hat, bigger laugh, a voice that calms cattle and nervous teenagers alike. Names every animal after a person he has loved.',
  look: { hair: '#5a4030', top: '#4a6a9a', bottom: '#6a5a40', skin: '#d6a07c', eyes: '#2a2018', accent: '#e8c070' }, birthday: { season: 'summer', day: 22 },
  hint: 'in the barn at dawn, the cow pasture mid-morning, the store at lunch, the horse paddock afternoons; sells milk at the market on weekends',
  schedule: [
    { when: WK, stops: [{ at: '06:00', map: 'meadow_ranch', spot: 'barn' }, { at: '09:30', map: 'meadow_market', spot: 'stall_dairy', dir: 'up' }, { at: '16:00', map: 'meadow_ranch', spot: 'yard' }, { at: '19:30', map: null }] },
    { stops: [{ at: '06:00', map: 'meadow_ranch', spot: 'barn' }, { at: '09:00', map: 'meadow_ranch', spot: 'cow_pasture' }, { at: '12:00', map: 'meadow_ranch', spot: 'store' }, { at: '15:00', map: 'meadow_ranch', spot: 'horse_paddock' }, { at: '18:00', map: 'meadow_ranch', spot: 'yard' }, { at: '20:00', map: null }] },
  ],
  gifts: { love: ['dish_ml_cheese_toast', 'gift_ml_straw_hat'], like: ['drink_ml_fresh_milk', 'snack_onigiri_salmon', 'ing_carrot'], dislike: ['gift_hair_clip'], hate: [], likeTags: ['farm', 'dairy'] },
  lines: {
    default: ['Cows know when you are in a hurry. So slow down, and they will too.', "Good grass, good milk. That's the whole secret.", 'Every animal here is named after someone I love. Yes, even the grumpy one.', 'Morning light on the pasture. Nothing beats it, and I get it for free.', 'A ranch is a long conversation with weather.', "Don't let the sheep tell you they haven't eaten. They always say that."],
    morning: ['Milking time. Cows first, coffee second.'], afternoon: ['Afternoon sun, afternoon naps. For the horses, anyway.'], evening: ['Trough full, gate shut, lamp lit. Day done.'], rain: ['Rain. Cows do not care, I do. Mud in my boots.'], snow: ['Snow on the pasture. Sheep look like clouds that came down for a visit.'],
    spring: ['Spring lambs. Try not to cry. I always do.'], summer: ['Summer grass. The cows are in heaven.'], autumn: ['Autumn barn dance! I sell milk, then I dance very badly.'], winter: ['Winter hay. Lots of it. Every day.'], weekend: ['Market day! Milk, cheese, and the occasional joke.'],
    h2: ['You milk like someone who respects the cow. Good.'], h4: ['Kaze trusts you. That is not easy to earn.'], h6: ['You make this old ranch feel young.'],
    firstMeet: ['happy|Well hello! Daigo. Welcome to the ranch. Wipe your boots, say hi to the cows.'], birthday: ['happy|My birthday? You are a sharp one. Thanks.'],
    gift_love: ['happy|Now we are talking! Thank you.'], gift_like: ['happy|Nice. Thanks!'], gift_neutral: ['Thanks.'], gift_dislike: ['Ha, thanks. I think.'], gift_hate: ['Hm, no.'],
  },
  events: [
    { id: 'daigo_h2', hearts: 2, map: 'meadow_ranch', when: 'time>=6:00&time<11:00', script: () => sc('daigo_ml', ...open('daigo_ml'), 'Come here. Sit on the stool. Warm your hands first. Cows hate cold fingers.',
      '@Hana the cow turns her head, unbothered. Warm milk drums into the pail.', ch('How is it?', ['Warm and kind of magic', 'happy|That is it exactly.', 25], ['Slippery', 'happy|Ha! Slippery is half of it.', 20]), giveOr('drink_ml_fresh_milk', 60), xp('homemaking', 12), mood(8), arc('daigo_ml', 1)) },
    { id: 'daigo_h4', hearts: 4, map: 'meadow_ranch', when: 'time>=13:00&time<17:00&!weather:storm', script: () => sc('daigo_ml', ...open('daigo_ml'), 'Kaze needs a rider who likes the wind. Hop up.', '@Hooves drum across the meadow. The valley flows past in green and gold.',
      ch('How do you ride?', ['Lean low and laugh', 'happy|That is the right way. He likes laughing.', 30], ['Hold on tight and squeak', 'happy|Ha! He likes that too.', 25]), 'happy|You ride like the wind likes you.', xp('homemaking', 12), mood(14), arc('daigo_ml', 2)) },
    { id: 'daigo_h6', hearts: 6, map: 'meadow_ranch', when: 'time>=17:00&time<21:00', script: () => sc('daigo_ml', ...open('daigo_ml'), '@Dusk. A lamp swings in the barn. A new lamb wobbles to its feet beside Dolly.',
      'First one of the spring. Third generation, my great-grandmother\'s line. Would you like to name her?', ch('Name her...', ['Clover', 'happy|Clover. Perfect.', 30], ['Mochi', 'happy|Ha! A fine name. She will love it.', 30]), 'happy|There is always a place for you on this ranch.', giveOr('gift_ml_horseshoe', 200), mood(18), arc('daigo_ml', 3), { t: 'set', flag: 'sv4_daigo_done' }) },
  ],
});
N('fumi_ml', {
  name: 'Fumi', role: 'Miller, the Windmill', color: '#e8c070',
  bio: 'Fumi Sakamoto turns wheat and buckwheat to flour with sails older than her grandmother. Flour in her hair, a pencil behind her ear and an absolute opinion on soba.',
  look: { hair: '#8a6a4a', top: '#f4e8c8', bottom: '#6a5a40', skin: '#f2c9a4', eyes: '#3a2a22', accent: '#e8c070' }, birthday: { season: 'autumn', day: 9 },
  hint: 'at the mill door in the morning, the wheat field at lunch in summer and autumn, the flour stall in the afternoon',
  schedule: [{ stops: [{ at: '08:00', map: 'meadow_windmill', spot: 'mill_door' }, { at: '11:00', map: 'meadow_windmill', spot: 'field' }, { at: '14:00', map: 'meadow_windmill', spot: 'shop' }, { at: '18:00', map: null }] }],
  gifts: { love: ['dish_ml_soba', 'gift_wind_chime'], like: ['dish_ml_cheese_toast', 'ing_honey', 'snack_melon_bread'], dislike: [], hate: [], likeTags: ['flour', 'sweet'] },
  lines: {
    default: ['Flour should smell like a field, not a shop.', 'The sails turn on the breeze, the stones turn on the sails, and I just try to keep up.', 'Wheat for bread, buckwheat for soba. Everyone has a side.', 'This mill ground the first rice flour in Hoshimori, the way my grandmother told it.', 'Nothing smells better than the first sack of the day. Except the second.', 'Do not touch the gears. Well, touch them gently.'],
    morning: ['Wind is up. The sails are singing. Good grinding day.'], afternoon: ['Afternoon quiet. Perfect for baking.'], evening: ['Stones off, sails locked. We rest.'], rain: ['No wind in the rain, so we bake today instead.'], snow: ['Snow on the sails. Pretty, useless. We sit.'],
    spring: ['Spring wheat is short and green. Soba flowers come later.'], summer: ['Summer is cutting time. Come help if you like sunburn.'], autumn: ['Autumn: harvest and soba. My busiest and happiest.'], winter: ['Winter, I dream about summer wheat.'], weekend: ['Weekend: the market takes my flour. Weekdays: the mill takes my time.'],
    h2: ['You hold wheat like you mean it.'], h4: ['I trust you with the good stones.'], h6: ['The mill is quieter with you around. In a good way.'],
    firstMeet: ['happy|Hello! Fumi, miller. Mind the flour, it gets everywhere.'], birthday: ['happy|You know my birthday? Dangerous.'],
    gift_love: ['happy|Soba! Oh, you are perfect.'], gift_like: ['happy|That is lovely, thanks.'], gift_neutral: ['Thank you.'], gift_dislike: ['Hm, thank you.'], gift_hate: ['Oh.'],
  },
  events: [],
});
N('kiyo_ml', {
  name: 'Kiyo', role: 'Orchardist, Meadow Orchard', color: '#e8866a',
  bio: 'Kiyo Aoyama grafts trees the way other people write letters: carefully, with hope. Four rows, four seasons, and a standing offer of free fruit to anyone who stops for a chat.',
  look: { hair: '#2a2a3a', top: '#e8866a', bottom: '#4a5a3a', skin: '#f2c9a4', eyes: '#2a2018', accent: '#f0c870' }, birthday: { season: 'spring', day: 22 },
  hint: 'at the fruit stand in the morning, walking the rows at lunch; sells fruit at the market on weekends',
  schedule: [
    { when: WK, stops: [{ at: '08:00', map: 'meadow_orchard', spot: 'stand' }, { at: '10:00', map: 'meadow_market', spot: 'stall_fruit', dir: 'up' }, { at: '16:00', map: null }] },
    { stops: [{ at: '08:00', map: 'meadow_orchard', spot: 'stand' }, { at: '12:00', map: 'meadow_orchard', spot: 'aisle' }, { at: '15:00', map: 'meadow_orchard', spot: 'stand' }, { at: '17:30', map: null }] },
  ],
  gifts: { love: ['dish_ml_cherry_pie', 'ing_honey'], like: ['bev_green_tea', 'snack_pudding', 'gift_ml_honey'], dislike: [], hate: [], likeTags: ['fruit', 'sweet'] },
  lines: {
    default: ['A tree knows how it feels about you by the second year.', 'Taste first, pick second, tell me third.', 'My grandfather planted this row. I take the fruit and say thank you.', 'The best peach is the one you pick yourself, warm from the sun.', 'Bees, rain and luck. That is an orchard.', 'Wait. Close your eyes. Smell that? That is spring starting.'],
    morning: ['Dew on the cherries. This is my favourite hour.'], afternoon: ['Afternoon shade under the persimmons is the best seat in the valley.'], evening: ['Lamps on the stand. The last picker is always the happiest.'], rain: ['Rain makes the fruit sweet and the ladder slippery.'], snow: ['Mikan in the snow. Orange on white. Postcard weather.'],
    spring: ['Cherry blossom week. I do not pick. I just sit.'], summer: ['Peaches! Sticky fingers, no regrets.'], autumn: ['Apples and persimmons: the sweetest rows of the year.'], winter: ['Winter mikan. Peel one by the stove.'], weekend: ['Weekend market! I bring the sweetest of the sweet.'],
    h2: ['You pick gently. Trees notice.'], h4: ['I saved a branch for you.'], h6: ['Come for the fruit. Stay for the quiet.'],
    firstMeet: ['happy|Hello! Kiyo. Welcome to the orchard. Basket pass is at the gate.'], birthday: ['happy|A spring birthday! Ha, I was born between two blossoms.'],
    gift_love: ['happy|Pie! You are a wonder.'], gift_like: ['happy|Lovely, thanks!'], gift_neutral: ['Thank you.'], gift_dislike: ['Hm, thanks.'], gift_hate: ['Oh.'],
  },
  events: [],
});
N('ginjiro_ml', {
  name: 'Ginjiro', role: 'Boatman, Meadow Lake', color: '#3f8fb8',
  bio: 'Ginjiro Hoshino rents boats at Meadow Lake and hums while he coils ropes. Once a harbour pilot, he moved inland for the quiet and now talks to fish, who rarely answer.',
  look: { hair: '#c8c8d8', top: '#3f6a9a', bottom: '#4a4a5a', skin: '#c68a62', eyes: '#2a2018', accent: '#e8c838' }, birthday: { season: 'winter', day: 18 },
  hint: 'at the dock in the morning, the boat house door at noon, the lakeside bench in the afternoon',
  schedule: [{ stops: [{ at: '07:30', map: 'meadow_lake', spot: 'dock' }, { at: '12:00', map: 'meadow_lake', spot: 'boathouse_door' }, { at: '15:00', map: 'meadow_lake', spot: 'bench' }, { at: '17:30', map: null }] }],
  gifts: { love: ['fish_ml_sweetfish', 'dish_tk_grilled_ayu'], like: ['bev_green_tea', 'gift_ml_lantern', 'dish_tamagoyaki'], dislike: [], hate: [], likeTags: ['fish'] },
  lines: {
    default: ['The lake gives and the lake takes. Mostly it gives me quiet.', 'Left oar, right oar, breathe. That is all the rowing there is.', 'A calm morning. You can hear a fish think.', 'Tie a knot like you are saying goodbye to a friend you will see tomorrow.', 'Thirty years at sea, ten on the lake. The lake is better company.', 'Do not rock the boat. Or do, once, just to know.'],
    morning: ['Mist on the water. The fish are asleep and so is the world.'], afternoon: ['Afternoon wind makes small waves. Row across them, not into them.'], evening: ['Evening lantern time. The whole lake glows.'], rain: ['Rain on the lake: ten thousand tiny drums.'], snow: ['Snow on the water. Silent, white, perfect. No boats today.'],
    spring: ['Reeds greening up. The ducks are returning.'], summer: ['Summer: golden carp. They are lazy and magnificent.'], autumn: ['Autumn mirror. The whole mountain is in the lake.'], winter: ['Winter is for sleeping fish and sleeping boatmen.'], weekend: ['Weekends: little kids in life jackets. My favourite customers.'],
    h2: ['You have steady hands. Good for oars.'], h4: ['The lake knows you now. I can tell.'], h6: ['I have never told anyone about the moon koi. Now I have.'],
    firstMeet: ['happy|Ahoy! Ginjiro. Boats are one fifty. Life jackets are free.'], birthday: ['happy|A winter birthday. Mine is mid-ice. Thanks, kid.'],
    gift_love: ['happy|Sweetfish! My favourite. Thank you, kid.'], gift_like: ['happy|Kind of you.'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm.'], gift_hate: ['No.'],
  },
  events: [
    { id: 'ginjiro_h2', hearts: 2, map: 'meadow_lake', when: 'time>=7:00&time<12:00&!weather:storm', script: () => sc('ginjiro_ml', ...open('ginjiro_ml'), 'Step in, middle of the boat, low knees. Good.', '@The oars dip. The dock slides back. Mist peels off the water in long white threads.',
      ch('First stroke...', ['Slow and even', 'happy|There. That is a rower.', 25], ['As hard as I can', 'happy|Ha! We are going in circles! But fast circles.', 15]), 'The secret is that the lake rows you back.', xp('fishing', 12), mood(10), arc('ginjiro_ml', 1)) },
    { id: 'ginjiro_h4', hearts: 4, map: 'meadow_lake', when: 'time>=17:00&time<21:00', script: () => sc('ginjiro_ml', ...open('ginjiro_ml'), 'Every year we light them at dusk. A paper lantern each. For someone who is not here.', '@One by one, small lights drift out across the dark water.',
      ch('Who is yours for?', ['Grandma Hana', 'happy|Then she is watching. Look, it floats straight.', 30], ['Everyone', 'happy|A big lantern, then. Hold it carefully.', 30]), giveOr('gift_ml_lantern', 150, 3), mood(15), arc('ginjiro_ml', 2)) },
    { id: 'ginjiro_h6', hearts: 6, map: 'meadow_lake', when: 'time>=19:00&time<23:00&!weather:rain', script: () => sc('ginjiro_ml', ...open('ginjiro_ml'), 'Shh. Stay low. Watch the water at the reeds.', '@A pale shape rises under the stars: a koi as white as milk, ringed in moon-silver light.',
      '>It is real...', 'happy|The moon koi. Seen it three times in ten years. Tonight is for you.', '@It circles once, bows, and is gone.', giveOr('gift_ml_lantern', 150), 40, mood(18), arc('ginjiro_ml', 3), { t: 'set', flag: 'sv4_ginjiro_done' }) },
  ],
});
N('nagi_ml', {
  name: 'Dr. Nagi', role: 'Traveling vet', color: '#86cdb0',
  bio: 'Dr. Nagi Hayashi drives a battered green van from ranch to ranch with a medicine bag and a kettle. Calm voice, steady hands and a habit of saying hello to every animal before every human.',
  look: { hair: '#4a5a6a', top: '#fffaf0', bottom: '#5f80b4', skin: '#f2c9a4', eyes: '#2a2018', accent: '#86cdb0' }, birthday: { season: 'summer', day: 5 },
  hint: 'at the market vet table on weekends; at the ranch yard and the Meadow Road bus stop on weekdays',
  schedule: [
    { when: WK, stops: [{ at: '09:00', map: 'meadow_market', spot: 'vet' }, { at: '16:00', map: null }] },
    { stops: [{ at: '09:00', map: 'meadow_ranch', spot: 'yard' }, { at: '13:00', map: 'meadow_road', spot: 'bus_stop' }, { at: '15:00', map: null }] },
  ],
  gifts: { love: ['bev_green_tea', 'snack_pudding'], like: ['ing_honey', 'dish_ml_cheese_toast'], dislike: [], hate: [], likeTags: ['dairy'] },
  lines: {
    default: ['Animals tell you everything if you stay quiet long enough.', 'A healthy cow is a calm cow. A calm cow is a bored cow. Best patients.', 'The van runs on tea and stubbornness.', 'Name the animals. People take care of things they have names for.', 'Every farm has one animal that runs the place. Find it and be kind to it.', 'Have you been brushing your animals? They like it more than they say.'],
    morning: ['I start with the cows and end with the sheep. Never reverse it.'], afternoon: ['Afternoon rounds. Windows down, tea thermos up.'], evening: ['Back to the van. I have a long road tonight.'], rain: ['Rain means mud and mud means hoof checks.'], snow: ['Snow, chains on the tires, patient animals indoors.'],
    spring: ['Lambing season. I sleep four hours and love every minute.'], summer: ['Summer: flies, heat, hydration. My lecture season.'], autumn: ['Autumn vaccinations. Everyone hates them and everyone gets a treat.'], winter: ['Winter hay, winter coughs, winter jokes.'], weekend: ['Market day: I check strays and give out advice for free.'],
    h2: ['You have a way with animals.'], h4: ['I will teach you to read a cow\'s ears.'], h6: ['Anytime you want to help on rounds, I have a spare coat.'],
    firstMeet: ['happy|Hello! Dr. Nagi, traveling vet. Hands off the van horn.'], birthday: ['happy|You remembered. Fine, you can have a lollipop.'],
    gift_love: ['happy|Thank you! This is perfect.'], gift_like: ['happy|Kind of you.'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm.'], gift_hate: ['No.'],
  },
  events: [],
});
N('mayu_yk', {
  name: 'Mayu', role: 'Onsen cat caretaker', color: '#f0a050',
  bio: 'Mayu Takahashi looks after the cats of Yukemuri: six regulars and a rumour of a seventh. Hot-spring cats get warm bellies, but also sulfur noses, and Mayu keeps wipes in every pocket.',
  look: { hair: '#d9763f', top: '#a8d0e0', bottom: '#4a5a6a', skin: '#f2c9a4', eyes: '#3a2a22', accent: '#f0a050' }, birthday: { season: 'spring', day: 9 },
  hint: 'at the cat house in the morning, the footbath plaza at midday, the footbath benches late afternoon',
  schedule: [
    { when: bad, stops: [{ at: '07:00', map: 'yukemuri_village', spot: 'cat_house' }, { at: '18:00', map: null }] },
    { stops: [{ at: '07:00', map: 'yukemuri_village', spot: 'cat_house' }, { at: '10:00', map: 'yukemuri_village', spot: 'plaza' }, { at: '13:00', map: 'yukemuri_village', spot: 'cat_house' }, { at: '17:00', map: 'yukemuri_village', spot: 'footbath' }, { at: '19:00', map: null }] },
  ],
  gifts: { love: ['dish_yk_cat_snack', 'fish_ml_wakasagi'], like: ['dish_yk_onsen_egg', 'snack_pudding', 'gift_yk_kokeshi'], dislike: [], hate: [], likeTags: ['cute'] },
  lines: {
    default: ['Mikan is the boss. Sumi is the shadow. Shiro is the philosopher. Tora is...', 'Cats came for the warmth. They stayed because nobody asked them to leave.', 'Never pick up a cat who is asleep on a vent. That is a lease.', 'Shh. The one on the bench is dreaming. See her paws?', 'Some people count sheep. I count cats. I always lose track at four.', 'A warm stone is the best present a cat can get. Second best is fish.'],
    morning: ['Breakfast roll call! Nine cats, I swear. Never more than six at once.'], afternoon: ['Afternoon naps. The plaza is a sleeping bag.'], evening: ['Evening round. Everyone accounted for?'], rain: ['Rain: they all squeeze into the cat house like a sock drawer.'], snow: ['Snow cats! Footprints like tiny flowers.'],
    spring: ['Spring kittens, I am told. I have not seen any yet. Suspiciously.'], summer: ['Summer cats are hot-spring cats, lazily steamed.'], autumn: ['Autumn leaves are the best toys, in a cat\'s opinion.'], winter: ['Winter cats sit on the vents. A wall of purring.'], weekend: ['Weekends bring a hundred hands. The cats choose three.'],
    h2: ['They like you. The black one touched your shoe. That is a medal.'], h4: ['Would you call me Mayu? Only the cats call me Boss.'], h6: ['This village was always kind. The cats made it so.'],
    firstMeet: ['happy|Oh! Hello. Mayu. Mind the cat on your foot. She has claimed you.'], birthday: ['happy|My birthday! A snack for each cat in my honour. Thank you.'],
    gift_love: ['happy|You are an angel. They will love you forever.'], gift_like: ['happy|Aww, thank you.'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm, thanks.'], gift_hate: ['Oh.'],
  },
  events: [
    { id: 'mayu_h2', hearts: 2, map: 'yukemuri_village', when: 'time>=7:00&time<17:00', script: () => sc('mayu_yk', ...open('mayu_yk'), 'You are good with them. Would you like to meet everyone properly?',
      '@Six cats parade out of the cat house in a line: ginger, black, cream, striped, brown, and one very suspicious grey.', ch('Which one do you greet first?', ['The ginger one', 'happy|Mikan! The boss. She approves.', 25], ['The suspicious grey', 'happy|Ha! That is Tora. She never greets anyone. Look, she rubbed your leg!', 30]),
      giveOr('dish_yk_cat_snack', 50, 3), mood(10), arc('mayu_yk', 1)) },
    { id: 'mayu_h4', hearts: 4, map: 'yukemuri_village', when: 'time>=10:00&time<19:00', script: () => sc('mayu_yk', ...open('mayu_yk'), 'Misa, a favour. Kinako has a thorn in her paw and will not let me near it.', '@A small cream cat sits very still, glaring.',
      ch('How do you help?', ['Talk softly and offer a snack', 'happy|She trusts you! Hold her... steady... there. Got it.', 30], ['Distract her with a feather', 'happy|Clever! She never saw it coming.', 25]), '*heart', 'happy|You have the touch.', giveOr('gift_yk_kokeshi', 200), mood(12), arc('mayu_yk', 2)) },
    { id: 'mayu_h6', hearts: 6, map: 'yukemuri_village', when: 'time>=16:00&time<20:00', script: () => sc('mayu_yk', ...open('mayu_yk'), 'Every year the village throws the cats a thank-you night. Fish soup, lanterns, nothing fancy.', '@Dusk. Lanterns light the plaza. Six cats sit in a row like tiny judges while the village ladles fish soup.',
      'happy|Look at them. Warm, fed, loved. That is the whole point.', '>I think this is the best village in the world.', 'happy|Then you will stay for the winter lanterns too. Promise?', giveOr('dish_yk_cat_snack', 50, 5), 40, mood(18), arc('mayu_yk', 3), { t: 'set', flag: 'sv4_mayu_done' }) },
  ],
});
void fade; void wait;
features('Mountain & Meadow', [
  'Ten new residents with schedules across the region: ryokan okami Chiyo, bath attendant Tetsu, mountain guide Shun, hut keeper Osuzu, rancher Daigo, miller Fumi, orchardist Kiyo, lake boatman Ginjiro, traveling vet Dr. Nagi and cat caretaker Mayu',
  'Each resident has chatter for the time of day, weather, season and weekends, birthday lines and gift reactions',
  'Three-event heart arcs for Chiyo (tea, Room Moon, yukata night), Shun (bear bell, rope bridge, dawn glory), Daigo (milking, a ride, the new lamb), Ginjiro (rowing, lantern night, the moon koi) and Mayu (meeting the cats, a thorn in a paw, thank-you night)',
]);
