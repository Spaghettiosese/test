// Seto Islands residents (12). Five main characters have three heart events each: Captain Nagisa (ferry), Tetsu (fisher-grandpa),
// Ms. Hibiki (island schoolteacher), Lani (resort manager) and Shiori (dive instructor and marine biologist).
import { register, get } from '../../core/registry.js';
import { sc, ch, open, leave, backdrop, fade, time, mood, xp, giveOr } from '../social/util.js';
import { have } from './data.js';

const L = (o) => o;
const mk = (id, def) => register('npc', id, { events: [], ...def });
const sched = (...groups) => groups;
const gifts = (love, like, dislike = [], hate = [], likeTags = []) => ({ love: have(love), like: have(like), dislike: have(dislike), hate: have(hate), likeTags });

// ---------------------------------------------------------------- Tsubame
mk('nagisa', {
  name: 'Captain Nagisa', role: 'Seto ferry captain', color: '#3f8fb8', birthday: { season: 'summer', day: 9 },
  bio: 'Nagisa Umino has steered the Seto ferry for twenty years without missing a single timetable except for one whale. Calm, dry-humoured and always smells of rope and tea.',
  look: { hair: '#2a3a5a', top: '#fffaf0', bottom: '#2a3a5a', skin: '#d6a07c', eyes: '#2a2a3a', accent: '#e8c838', shoe: '#2a2a3a' },
  hint: 'the ferry deck at the Tsubame pier by day, the diner at lunch, the inn at night. Storm days she sits at the inn and mutters at the weather.',
  schedule: sched(
    { when: 'weather:storm', stops: [{ at: '07:00', map: 'tsubame_inn', spot: 'table' }, { at: '21:00', map: null }] },
    { stops: [{ at: '06:30', map: 'tsubame_pier', spot: 'ferry' }, { at: '12:00', map: 'tsubame_diner', spot: 'table_1' }, { at: '13:00', map: 'tsubame_pier', spot: 'ferry' }, { at: '18:00', map: 'tsubame_inn', spot: 'table' }, { at: '21:00', map: null }] }),
  gifts: gifts(['dish_ts_fish_soup', 'drink_green_tea'], ['gift_tsubame_charm', 'dish_ts_bream_salt', 'gift_old_compass'], ['gift_beach_ball'], [], ['fish']),
  lines: {
    default: ['The timetable is a promise. I keep promises. Mostly.', 'Mind the gap between the boat and the pier. Everybody falls in once.', 'happy|You get your sea legs fast, Misa.', 'Six crossings a day. The sea never repeats itself, though.'],
    morning: ['First crossing is the quiet one. Just me, the gulls and the kettle.'], evening: ['Last boat is gone. Now the tea gets to be tea.'],
    rain: ['Rain makes the sea sound like applause. I always bow.'], storm: ['No ferries today. Do not look at me like that. I like the storm; I do not sail in it.'],
    spring: ['Whales, in spring. Keep your eyes on the east side.'], summer: ['Flying fish all summer. They race the bow. They always lose, which is manners.'], autumn: ['Moon jellies in autumn. Like drifting lamps.'], winter: ['Cold decks and hot tea. Winter is honest.'],
    h2: ['You could crew for me, you know. Deckhand pay is fair.'], h5: ['I have steered past one lighthouse for twenty years. I never told anyone how much I miss lighting it.'], h8: ['Half fare for friends, always. Do not argue with the captain.'],
    firstMeet: ['happy|Welcome aboard. I am Nagisa. If you feel sick, look at the horizon. If you still feel sick, look at me; I will tell you a boring story.'],
    gift_love: ['surprised|Oh. Oh, that is lovely. Thank you.'], gift_like: ['happy|Thank you. Very kind.'], gift_neutral: ['Hm. Thank you.'], gift_dislike: ['I will put it... somewhere.'], gift_hate: ['...'],
    birthday: ['happy|Another year older, another thousand crossings. Thanks for remembering.'], festival: ['happy|Lanterns on the water tonight. It is why I love this job.'],
  },
  events: [
    { id: 'nagisa_h2', hearts: 2, map: 'tsubame_pier', when: 'time>=7:00&time<17:00', script: () => sc('nagisa', ...open('nagisa'), 'Misa! Come aboard a moment. I will show you the wheelhouse.', '@A tiny cabin smelling of tea and warm brass. A brass wheel, a barometer and a photograph of a whale.',
      'happy|That is Gon. He follows us every spring. We have a deal: he does not capsize us, we do not run him over.', ch('What do you do?', ['Hold the wheel', '@The wheel is heavier than it looks. The whole ferry seems to breathe through your hands.', 'happy|Gentle! You are a natural.', 25], ['Ask about Gon', 'He sings. Low, like a cello under the hull. Nobody believes me.', 'happy|You believe me. I can tell.', 25]), time(30), xp('charm', 10), leave('nagisa')) },
    { id: 'nagisa_h5', hearts: 5, map: 'tsubame_pier', when: 'time>=17:00&time<20:00&!weather:storm', script: () => sc('nagisa', ...open('nagisa'), 'Sit with me a minute. The last ferry is in, the pier is quiet.', fade(1, 0.5), backdrop('soc_sunset'), fade(0, 0.5),
      '@The sky turns the colour of peaches. Gulls drift home.', 'My father piloted this ferry before me. He said the best crossing is the one nobody remembers, because nothing went wrong.', 'happy|I want to give people a boring, perfect crossing. Every day. That is the whole dream.',
      ch('Reply', ['It is a lovely dream', 'happy|Thank you, Misa.', 30], ['I remember every crossing', 'happy|...Then I am not doing the job right. But I will take it.', 30]), backdrop(null), time(60), mood(12), leave('nagisa')) },
    { id: 'nagisa_h8', hearts: 8, map: 'tsubame_pier', when: 'time>=7:00&time<12:00&!weather:storm', script: () => sc('nagisa', ...open('nagisa'), 'Hold out your hand.', '@She presses a small brass key into your palm.', 'The spare key to the wheelhouse. It does not start the engine. It just means you are always welcome aboard.',
      'happy|And your fare is half, forever. Do not tell the others.', giveOr('gift_tsubame_charm', 150), { t: 'set', flag: 'seto_nagisa_key' }, mood(15), leave('nagisa')) },
  ],
});
mk('tetsu', {
  name: 'Tetsu', role: 'Retired fisher, fishery elder', color: '#5a8cc0', birthday: { season: 'winter', day: 8 },
  bio: 'Old Tetsu has fished the Seto Sea for fifty-six years. He talks little, laughs rarely and tells one story about a whale that gets longer every time.',
  look: { hair: '#e8e8f0', top: '#3d5a8c', bottom: '#4a4a5a', skin: '#c68a62', eyes: '#2a2a3a', accent: '#e8c838', shoe: '#3a3a3a' },
  hint: 'dawn on the pier, the auction by mid morning, the nets at noon, the diner at dusk.',
  schedule: sched(
    { when: 'weather:rain|storm', stops: [{ at: '07:00', map: 'tsubame_fishery', spot: 'buyers' }, { at: '17:00', map: 'tsubame_diner', spot: 'table_2' }, { at: '20:00', map: null }] },
    { stops: [{ at: '05:00', map: 'tsubame_pier', spot: 'fishing' }, { at: '09:00', map: 'tsubame_fishery', spot: 'auction' }, { at: '14:00', map: 'tsubame_village', spot: 'net_rack' }, { at: '17:00', map: 'tsubame_diner', spot: 'table_2' }, { at: '20:00', map: 'tsubame_inn', spot: 'table' }, { at: '22:00', map: null }] }),
  gifts: gifts(['fish_bluefin', 'dish_ts_tuna_don'], ['dish_ts_nabe', 'fish_amberjack', 'drink_green_tea'], ['gift_beach_ball'], [], ['fish']),
  lines: {
    default: ['Hm.', 'The sea is saying something. I have not figured out what in fifty years.', 'happy|Good hands for netting, you have.', 'Fish do not lie. People do. That is why I like fish.'],
    morning: ['Dawn. Best bite of the day. Quiet now.'], rain: ['Rain on the water. Fish think it is a party.'], storm: ['Sit tight. The sea is cleaning house.'],
    h2: ['You listen. Most do not.'], h5: ['The auction is a game of nerve. Wait. Wait. Then do not wait.'], h8: ['Come fish with me when you can. I will pretend I do not mind the company.'],
    firstMeet: ['Hm. You are the girl from the big island. Tetsu. Do not scare the fish.'],
    gift_love: ['surprised|...You remembered. Thank you.'], gift_like: ['Hm. Good.'], gift_neutral: ['Hm.'], gift_dislike: ['Hmph.'], gift_hate: ['No.'], birthday: ['Hm. Another one. Thank you.'],
  },
  events: [
    { id: 'tetsu_h2', hearts: 2, map: 'tsubame_pier', when: 'time>=5:00&time<9:00', script: () => sc('tetsu', ...open('tetsu'), 'Sniff.', '>Sniff?', 'The tide is turning. You can smell it. Salt gets sweeter on the turn.', ch('Try it', ['Sniff the air', '@It smells of salt, seaweed and, faintly, sugar.', 'happy|There. Now you know.', 25], ['Ask about the whale', 'Hm. It was this big. No, bigger.', 15]), time(30), xp('fishing', 20), leave('tetsu')) },
    { id: 'tetsu_h5', hearts: 5, map: 'tsubame_fishery', when: 'time>=9:00&time<14:00', script: () => sc('tetsu', ...open('tetsu'), 'Auction secret. Come here.', 'Every buyer has a number in their head. The old buyer is always ten percent under. You wait for the price to touch ninety-five and you press. Not before. Not after.', 'happy|Fifty-six years to learn that. You got it in five minutes. Annoying.', 30, xp('charm', 10), leave('tetsu')) },
    { id: 'tetsu_h8', hearts: 8, map: 'tsubame_village', when: 'time>=17:00&time<20:00', script: () => sc('tetsu', ...open('tetsu'), 'This net was my wife\'s. She knotted it the winter before she left us.', '@He runs a rough thumb along a line of tiny, perfect knots.', 'I have never used it. I mend it. That is not the same.', ch('Say something', ['Use it once', 'Hm. ...Hm. Maybe at the lantern festival.', 30], ['Teach me her knot', 'happy|Over, under, pull, and a little twist that is only hers.', 30]), giveOr('mat_pearl', 300), mood(12), leave('tetsu')) },
  ],
});
mk('hibiki', {
  name: 'Ms. Hibiki', role: 'Island schoolteacher', color: '#e0707a', birthday: { season: 'spring', day: 14 },
  bio: 'Hibiki Aizawa teaches six children in a one-room school on Tsubame Island. She is endlessly patient, secretly competitive about the school sports day, and never without chalk dust on her sleeve.',
  look: { hair: '#5a3a2e', top: '#e0707a', bottom: '#fffaf0', skin: '#f2c9a4', eyes: '#4a2414', accent: '#ffd76a', shoe: '#d98a8a' },
  hint: 'the schoolroom on weekdays, the bench and the shrine after class, the diner at weekends.',
  schedule: sched(
    { when: 'weather:storm', stops: [{ at: '07:00', map: 'tsubame_inn', spot: 'table' }, { at: '20:00', map: null }] },
    { when: 'weekday', stops: [{ at: '08:00', map: 'tsubame_school', spot: 'teacher' }, { at: '15:00', map: 'tsubame_village', spot: 'bench' }, { at: '17:00', map: 'tsubame_shrine', spot: 'bench' }, { at: '19:00', map: null }] },
    { stops: [{ at: '10:00', map: 'tsubame_shrine', spot: 'lookout' }, { at: '14:00', map: 'tsubame_pier', spot: 'bench' }, { at: '18:00', map: 'tsubame_diner', spot: 'table_1' }, { at: '20:00', map: null }] }),
  gifts: gifts(['book_fish_atlas', 'gift_star_jar', 'furn_flower_vase'], ['gift_shell_wind_chime', 'drink_green_tea', 'crop_star_jasmine'], ['dish_mysterious_lump'], [], ['flower', 'sweet']),
  lines: {
    default: ['Six children means six opinions per minute.', 'happy|The best classroom has a window and a very long recess.', 'If you ever have a free morning, I can always use a guest teacher.', 'Chalk dust is the glitter of education.'],
    morning: ['Morning! Roll call. If it is not the cat, someone is missing.'], rain: ['Rainy-day lessons are the best. We count raindrops.'], storm: ['Everyone is home today. I marked them all present in spirit.'],
    weekend: ['Weekends I try not to think about long division. I fail.'], h2: ['Thank you for what you did with the kids. Mei still draws you with a wave in your hair.'],
    firstMeet: ['happy|You must be the visitor from the mainland! I am Hibiki. Do you like children? Squid? Chalk?'],
    gift_love: ['surprised|For me? Oh my goodness!'], gift_like: ['happy|How thoughtful!'], gift_neutral: ['Thank you!'], gift_dislike: ['Oh. Um. Thank you...'], gift_hate: ['...Is it moving?'], birthday: ['happy|The kids made me a card. It has a squid wearing a crown.'],
  },
  events: [
    { id: 'hibiki_h2', hearts: 2, map: 'tsubame_school', when: 'weekday&time>=8:00&time<15:00', script: () => sc('hibiki', ...open('hibiki'), 'Come in, come in! Meet the class.', '@Six faces turn at once. Six very different expressions.', 'happy|This is Misa. She is visiting from the big island. Be kind.', '@The class answers in six overlapping voices: "HELLO MISA!"', ch('Say hello', ['Wave', '@Six hands wave back, one holding a very surprised crab drawing.', 'happy|They like you. That is rare.', 25], ['Ask what they are learning', 'The tides today! Ask anyone. Anyone. Okay, ask Nana.', 20]), time(30), xp('charm', 10), leave('hibiki')) },
    { id: 'hibiki_h5', hearts: 5, map: 'tsubame_shrine', when: 'time>=15:00&time<19:00', script: () => sc('hibiki', ...open('hibiki'), 'I come here after school. The swallows are better listeners than my budget committee.', 'happy|When I came to Tsubame I thought it was a stop. Two years in, I wouldn\'t leave for a palace.', ch('Ask', ['Why stay?', 'Because six kids know all of the island\'s names for the wind. Because someone should listen.', 30], ['Do you miss the city?', 'Sometimes. Mostly the bookshops. I order them by ferry now.', 25]), time(45), mood(8), leave('hibiki')) },
    { id: 'hibiki_h8', hearts: 8, map: 'tsubame_pier', when: 'time>=17:00&time<20:00', script: () => sc('hibiki', ...open('hibiki'), 'The kids made something for you. They will deny it.', '@A small box of paper cranes, one for every child, each with a tiny note: "Come back soon. Bring the squid."', 'happy|They have not stopped asking when you are back.', giveOr('gift_star_jar', 200), mood(15), 30, leave('hibiki')) },
  ],
});
mk('umi', {
  name: 'Umi', role: 'Diner cook', color: '#e0503a', birthday: { season: 'autumn', day: 3 },
  bio: 'Umi runs the Umi Diner with one pot, two knives and a conviction that soup can solve anything.', look: { hair: '#24203a', top: '#fffaf0', bottom: '#2a3552', skin: '#f2c9a4', eyes: '#2a2a3a', accent: '#e0503a', shoe: '#2a2a3a' },
  schedule: sched({ stops: [{ at: '09:00', map: 'tsubame_diner', spot: 'kitchen' }, { at: '21:00', map: null }] }),
  gifts: gifts(['fish_sea_bream', 'fish_bluefin'], ['crop_seaweed', 'mat_sea_salt_flake'], [], [], ['fish']),
  lines: { default: ['Eight dishes. If you want a ninth, bring me a ninth fish.', 'happy|Soup first. Questions after.', 'The secret is patience. And salt. Mostly salt.'], rain: ['Soup weather. Sit.'], firstMeet: ['happy|New face! Sit anywhere. Everything is good. I decided.'], gift_love: ['happy|Now we are talking!'], gift_like: ['Thanks!'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm.'], gift_hate: ['Out.'], birthday: ['happy|I made myself a cake. It is soup-flavoured.'] },
});
mk('ume', {
  name: 'Granny Ume', role: 'Shell crafter and innkeeper', color: '#86cdb0', birthday: { season: 'spring', day: 22 },
  bio: 'Ume keeps the inn, strings shell chimes and knows every secret on the island. She does not repeat them. Out loud.', look: { hair: '#f2f2fa', top: '#86cdb0', bottom: '#fffaf0', skin: '#d6a07c', eyes: '#4a2414', accent: '#ffd76a', shoe: '#a67548' },
  schedule: sched({ when: 'weather:storm', stops: [{ at: '07:00', map: 'tsubame_inn', spot: 'desk' }, { at: '21:00', map: null }] }, { stops: [{ at: '08:00', map: 'tsubame_village', spot: 'shell_shop' }, { at: '12:00', map: 'tsubame_inn', spot: 'desk' }, { at: '17:00', map: 'tsubame_village', spot: 'bench' }, { at: '19:00', map: null }] }),
  gifts: gifts(['gift_sea_glass_bracelet', 'mat_pearl'], ['mat_sea_glass', 'drink_green_tea', 'fish_squid'], [], [], ['beach', 'handmade']),
  lines: { default: ['Shells remember the sea. Listen.', 'happy|You have good ears, dear. Come by for tea.', 'The inn always has a bed. Nobody sleeps on a pier in my village.'], storm: ['Storm tea, storm stories. Sit by me.'], firstMeet: ['happy|Oh, a visitor! Do you need a bed, a chime or a hug?'], gift_love: ['happy|Oh, my dear!'], gift_like: ['happy|Lovely.'], gift_neutral: ['Thank you.'], gift_dislike: ['Hm, thank you.'], gift_hate: ['Oh dear.'], birthday: ['happy|At my age, I just call it Tuesday. But thank you.'] },
});
mk('kenta', {
  name: 'Kenta', role: 'Island kid', color: '#ffd76a', birthday: { season: 'summer', day: 3 },
  bio: 'Ten years old, fastest runner on Tsubame, owner of the island\'s only skateboard (it has no wheels).', look: { hair: '#24203a', top: '#ffd76a', bottom: '#3d5a8c', skin: '#d6a07c', eyes: '#2a2a3a', accent: '#e0503a', shoe: '#fffaf0' },
  schedule: sched({ when: 'weekday', stops: [{ at: '15:30', map: 'tsubame_village', spot: 'play' }, { at: '17:30', map: 'tsubame_pier', spot: 'crates' }, { at: '19:00', map: null }] }, { stops: [{ at: '10:00', map: 'tsubame_pier', spot: 'fishing' }, { at: '15:00', map: 'tsubame_village', spot: 'play' }, { at: '19:00', map: null }] }),
  gifts: gifts(['dish_coral_shaved_ice', 'gift_beach_ball'], ['fish_squid', 'dish_ts_dried_squid'], [], [], ['sweet']),
  lines: { default: ['I counted sixty-one cats. Sixty-two with the one on the shrine!', 'happy|Race you to the pier!', 'I am going to be a captain. Or a cat.'], firstMeet: ['happy|You\'re from the mainland? Do you have a hundred stairs there?'], gift_love: ['happy|WOW!'], gift_like: ['happy|Thanks!'], gift_neutral: ['Oh, thanks.'], gift_dislike: ['Eww.'], gift_hate: ['EWWW.'], birthday: ['happy|Do I get cake? I get cake!'] },
});
// ---------------------------------------------------------------- Lantern Isle
mk('orin', {
  name: 'Keeper Orin', role: 'Lantern Tower keeper', color: '#b89ae0', birthday: { season: 'autumn', day: 11 },
  bio: 'Orin has kept the Lantern Isle tower for thirty years and has never seen a ship need it. She keeps the lamp anyway. Somebody should.', look: { hair: '#8f8fae', top: '#7a5cb0', bottom: '#3a3850', skin: '#e3a98a', eyes: '#2a2a3a', accent: '#ffd76a', shoe: '#3a3a3a' },
  schedule: sched({ stops: [{ at: '06:00', map: 'lantern_tower', spot: 'lamp_room' }, { at: '12:00', map: 'lantern_isle_shore', spot: 'picnic' }, { at: '17:00', map: 'lantern_tower', spot: 'table' }, { at: '22:00', map: null }] }),
  gifts: gifts(['dish_ts_fish_soup', 'gift_astrolabe'], ['drink_green_tea', 'fish_lantern_eel', 'furn_lighthouse_model'], [], [], ['stars']),
  lines: { default: ['The lamp has two jobs: guide ships, and keep me company.', 'happy|There are two lighthouses in this bay. I like that. A pair is a conversation.', 'When the mainland Star Lantern blinks, so do I. Politely.', 'Mind the third stair. It is shy.'], storm: ['A good night for the lamp. The sea needs a night light.'], night: ['The best view in the archipelago, and I keep it all to myself. Until you.'], firstMeet: ['happy|A visitor! Welcome to the Lantern Tower. Please do not touch the lens. It is sulking.'], gift_love: ['happy|Oh!'], gift_like: ['happy|How kind.'], gift_neutral: ['Thank you.'], gift_dislike: ['Hmm.'], gift_hate: ['Hm.'], birthday: ['happy|I light an extra lamp on my birthday. Do not tell the ships.'] },
});
mk('fumi', {
  name: 'Fumi', role: 'Walled garden caretaker', color: '#7fb87a', birthday: { season: 'spring', day: 5 },
  bio: 'Fumi weeds the old walled garden one pod at a time and speaks to the plants in a gentle, bossy voice.', look: { hair: '#4a3436', top: '#7fb87a', bottom: '#7a4f3a', skin: '#f2c9a4', eyes: '#4a2414', accent: '#e0707a', shoe: '#5a3a2e' },
  schedule: sched({ stops: [{ at: '08:00', map: 'lantern_garden', spot: 'plots' }, { at: '12:00', map: 'lantern_garden', spot: 'tea' }, { at: '16:00', map: 'lantern_ruins', spot: 'ruins_view' }, { at: '18:00', map: null }] }),
  gifts: gifts(['crop_moonbloom', 'crop_star_jasmine'], ['mat_fertiliser', 'drink_green_tea'], [], [], ['flower']),
  lines: { default: ['The seeds here were planted by a keeper long ago. I only remind them.', 'happy|Water in the morning. Gossip in the afternoon.', 'Rare seeds are shy. They like a gentle hand and a quiet voice.'], firstMeet: ['happy|Shh. Do not wake the moonbloom. ...Hello.'], gift_love: ['happy|They will love this!'], gift_like: ['happy|Lovely.'], gift_neutral: ['Thanks.'], gift_dislike: ['Hm.'], gift_hate: ['No.'], birthday: ['happy|The garden bloomed early for me.'] },
});
// ---------------------------------------------------------------- Coral Atoll
mk('lani', {
  name: 'Lani', role: 'Resort manager', color: '#f29aa0', birthday: { season: 'summer', day: 2 },
  bio: 'Lani Kahale manages the Atoll Resort, beach-volleys like a pro and believes any problem is solved by sunscreen and a smoothie.', look: { hair: '#5a2a1a', top: '#f29aa0', bottom: '#fffaf0', skin: '#c68a62', eyes: '#2a2a3a', accent: '#ffd76a', shoe: '#fffaf0' },
  hint: 'the bungalow front desk in the morning, the volleyball court at lunch, the store after, the bonfire at sunset.',
  schedule: sched({ stops: [{ at: '08:00', map: 'coral_hut_resort', spot: 'desk' }, { at: '11:00', map: 'coral_beach', spot: 'volley' }, { at: '15:00', map: 'coral_beach', spot: 'store' }, { at: '19:00', map: 'coral_beach', spot: 'bonfire' }, { at: '22:00', map: null }] }),
  gifts: gifts(['drink_tropic_smoothie', 'dish_coral_shaved_ice'], ['gift_beach_ball', 'drink_coconut_juice', 'fish_mahi'], ['dish_mysterious_lump'], [], ['sweet', 'beach']),
  lines: { default: ['No bad days. Only unfinished smoothies.', 'happy|Volleyball is just friendship with a net.', 'The best bungalow is the one at the end of the pier. Sunrise over the lagoon. Trust me.', 'Rule one at the atoll: take your shoes off.'], morning: ['The lagoon is perfectly still. Come see before the tourists wake.'], evening: ['Sunset bonfire soon. Bring a friend. Or a corn.'], rain: ['Rain? Perfect. The reef loves a shower.'], firstMeet: ['happy|Welcome to Coral Atoll! I am Lani. Sunscreen, smoothie or serve? Pick one.'], gift_love: ['happy|Best gift ever! Mahalo!'], gift_like: ['happy|Aww, thank you!'], gift_neutral: ['Thanks!'], gift_dislike: ['Oh. Um. Thanks.'], gift_hate: ['...Sure.'], birthday: ['happy|Birthday on the atoll means free smoothies for everyone. I might regret that.'] },
  events: [
    { id: 'lani_h2', hearts: 2, map: 'coral_beach', when: 'time>=8:00&time<17:00', script: () => sc('lani', ...open('lani'), 'You! Misa! You are on my team.', '@A volleyball bounces off your forehead. You are, evidently, on her team.', 'happy|Warm-up! Hit it to me. Gently. Or not gently. Surprise me.', ch('How do you play?', ['Aim for her', '@The ball arcs through the air, perfectly timed.', 'happy|That is the spirit!', 25], ['Aim for the sea', '@The ball bobs away on the tide. Lani laughs until she cries.', 'happy|Fine, you are on the other team.', 20]), time(30), xp('charm', 10), leave('lani')) },
    { id: 'lani_h5', hearts: 5, map: 'coral_beach', when: 'time>=17:30&time<21:00', script: () => sc('lani', ...open('lani'), 'Stay for the bonfire?', fade(1, 0.5), backdrop('soc_sunset'), fade(0, 0.5), '@The sun sinks and the beach goes honey-gold.', 'happy|I came here for six months. Seven years ago. The sea does that.', ch('Reply', ['Do you ever go home?', 'This is home. The other place is just where I was born.', 30], ['Teach me to sing the bonfire song', 'happy|Okay but you have to promise to be bad at it with confidence.', 30]), backdrop(null), time(75), mood(15), leave('lani')) },
    { id: 'lani_h8', hearts: 8, map: 'coral_hut_resort', when: 'time>=9:00&time<20:00', script: () => sc('lani', ...open('lani'), 'There is a bungalow nobody books. The one with the hole in the roof. I want you to have it.', '@She hands you a key tied to a shell.', 'happy|Free whenever you visit. It has the best sunrise. And a very noisy gecko named Brian.', giveOr('furn_island_hammock', 300), { t: 'set', flag: 'seto_lani_key' }, mood(15), leave('lani')) },
  ],
});
mk('shiori', {
  name: 'Shiori', role: 'Dive instructor and marine biologist', color: '#7fb2e0', birthday: { season: 'winter', day: 19 },
  bio: 'Shiori Nakagawa counts fish for a living, teaches snorkelling for fun and talks to the manta ray like an old friend. She is writing the first Reef Guide for the Seto Islands.', look: { hair: '#1e2f6a', top: '#7fb2e0', bottom: '#2a3552', skin: '#f2c9a4', eyes: '#2a2a3a', accent: '#86cdb0', shoe: '#2a3552' },
  hint: 'the lagoon jetty in the morning, the reef board at noon, the shore in the afternoon and the night market for dinner.',
  schedule: sched({ when: 'weather:storm', stops: [{ at: '08:00', map: 'coral_hut_resort', spot: 'porch' }, { at: '20:00', map: null }] }, { stops: [{ at: '08:00', map: 'coral_lagoon', spot: 'jetty' }, { at: '12:00', map: 'coral_lagoon', spot: 'guide' }, { at: '16:00', map: 'coral_beach', spot: 'shore' }, { at: '19:00', map: 'coral_market', spot: 'food' }, { at: '22:00', map: null }] }),
  gifts: gifts(['fish_manta', 'furn_coral_aquarium', 'book_fish_atlas'], ['fish_parrotfish', 'tool_snorkel', 'mat_sea_glass'], ['fish_sunfish'], [], ['nature']),
  lines: { default: ['Twenty-four species in this lagoon. I want all twenty-four in the Guide. No pressure.', 'happy|Breathing slowly is the whole secret. In for four, out for six.', 'The reef is one animal made of a million tiny ones. Be gentle.', 'If you see the manta, do not chase. Wait. She comes.'], morning: ['Early light is best for photos. Everything glitters.'], rain: ['Rain means plankton. Plankton means manta. I am delighted.'], firstMeet: ['happy|Hi! Shiori. I count fish. Want to count some with me?'], gift_love: ['surprised|For the lab? Oh, I could cry.'], gift_like: ['happy|Thank you!'], gift_neutral: ['Thanks!'], gift_dislike: ['Oh. That is... a fish. Hmm.'], gift_hate: ['Not the sunfish. Please.'], birthday: ['happy|I will celebrate by holding my breath for forty seconds. Very festive.'] },
  events: [
    { id: 'shiori_h2', hearts: 2, map: 'coral_lagoon', when: 'time>=8:00&time<17:00', script: () => sc('shiori', ...open('shiori'), 'Breathing lesson! In for four, out for six. Again.', 'happy|The snorkel is just a straw for your face. Do not panic about the straw.', ch('Practice', ['Breathe slowly', '@Your heartbeat settles. The lagoon feels like a lullaby.', 'happy|Perfect! Like you were born there.', 25], ['Hold your breath', 'Careful! That is the fast way to a headache. Slow wins.', 15]), time(30), xp('charm', 8), leave('shiori')) },
    { id: 'shiori_h5', hearts: 5, map: 'coral_lagoon', when: 'time>=19:00&time<22:00', script: () => sc('shiori', ...open('shiori'), 'Come see. Turn off your torch.', '@You switch off the light. The lagoon blooms with green sparks: a hundred tiny glowing fish.', 'happy|Flashlight fish. They make their own light. They think we are the strange ones.', ch('Reply', ['It is beautiful', 'happy|That is why I stay.', 30], ['Are they scared of us?', 'Only of being forgotten. Same as everyone.', 30]), time(45), mood(12), leave('shiori')) },
    { id: 'shiori_h8', hearts: 8, map: 'coral_beach', when: 'time>=15:00&time<19:00', script: () => sc('shiori', ...open('shiori'), 'I finished the Guide. Your photos are in it, with your name.', '@She hands you a printed booklet: "Reef Guide of the Seto Islands. Photographs by Shiori and M. Aoki."', 'happy|You helped me see the reef the way a visitor does. That is a gift.', giveOr('mat_pearl', 400), mood(15), 30, leave('shiori')) },
  ],
});
mk('kaito', {
  name: 'Kaito', role: 'Beach bar owner', color: '#ffd76a', birthday: { season: 'summer', day: 25 },
  bio: 'Kaito mixes tropical smoothies, rarely wears shoes and plays the ukulele with total confidence.', look: { hair: '#2a2a3a', top: '#ffd76a', bottom: '#5eaa92', skin: '#c68a62', eyes: '#2a2a3a', accent: '#e0503a', shoe: '#a67548' },
  schedule: sched({ stops: [{ at: '10:00', map: 'coral_beach', spot: 'bar' }, { at: '17:30', map: 'coral_beach', spot: 'bonfire' }, { at: '21:00', map: null }] }),
  gifts: gifts(['fish_mahi', 'drink_tropic_smoothie'], ['drink_coconut_juice', 'dish_grilled_corn_bar'], [], [], ['sweet']),
  lines: { default: ['Welcome to the only bar where the floor is the beach.', 'happy|Playing a song. It has three chords and a lot of feeling.', 'Ask me for a smoothie with a secret. It is mango.'], firstMeet: ['happy|Hey! First drink is on the sea. Second is on you.'], gift_love: ['happy|Whoa. Thanks!'], gift_like: ['happy|Cheers!'], gift_neutral: ['Thanks!'], gift_dislike: ['Eh.'], gift_hate: ['Nope.'], birthday: ['happy|Free smoothies for the birthday boy. That is me.'] },
});
mk('luna', {
  name: 'Luna', role: 'Night market vendor', color: '#ddd0f5', birthday: { season: 'autumn', day: 26 },
  bio: 'Luna sells lanterns, trinkets and fortunes after dark, and swears the best deals happen by moonlight.', look: { hair: '#5b3fa8', top: '#ddd0f5', bottom: '#3a3850', skin: '#f8d5b8', eyes: '#4a2414', accent: '#ffd76a', shoe: '#3a3850' },
  schedule: sched({ stops: [{ at: '17:00', map: 'coral_market', spot: 'shop' }, { at: '23:30', map: null }] }),
  gifts: gifts(['mat_glass_float', 'gift_pearl_pin'], ['gift_shell_wind_chime', 'drink_tropic_smoothie'], [], [], ['beach']),
  lines: { default: ['Lantern light makes everything look lucky. It is not a lie; it is lighting.', 'happy|Fortune stall, fifty coins. Always good news. I only deal in good news.', 'The market opens when the first star shows. And not a second before.'], firstMeet: ['happy|Ooh, a new face under my lanterns. Browse, browse.'], gift_love: ['happy|You spoil me!'], gift_like: ['happy|Lovely!'], gift_neutral: ['Thanks.'], gift_dislike: ['Hmm.'], gift_hate: ['No.'], birthday: ['happy|Moonlit birthday. Perfect.'] },
});
void L; void get;
