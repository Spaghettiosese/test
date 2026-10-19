// Population growth (sv5): six families move into new houses on the south lawn of the square on set dates (a moving van, boxes and a
// welcome scene), each with a villager NPC, a schedule, ~19 lines and a two-event arc; plus the Town Census app (population, happiness
// score, mood by district) and two Southside neighbourhood events (block party, garage sale). Flags: tp_in_<npc>, tp_van_<npc>.
import { register, get, all, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { FACADES, building } from '../town/facade.js';
import { S, mapPatch, prop, tile, mailSafe, idle, clamp, sc, ch, open, npc, N, say, call } from './state.js';
import { PROJECTS, projDone, doneCount } from './projects.js';
import { SHOPS } from './shops.js';
import { listApp } from './ui.js';
import './art.js';

const L = (...a) => a;
export const FAMILIES = [
  { id: 'ayame', n: 1, pos: [1, 27], day: 68, date: 'Autumn 12', family: 'Tsukino', size: 3, who: { name: 'Ayame', role: 'Illustrator, new in town', color: '#c870a8', birthday: { season: 'spring', day: 9 }, look: { hair: '#5a3a4a', top: '#c870a8', bottom: '#4a4a6a', skin: '#f4d2b4', eyes: '#4a2a3a', accent: '#f4c870' }, bio: 'Ayame Tsukino, 34, draws picture books at her kitchen table with her daughter Mio asleep on the sofa. They moved to the bay for the quiet.' },
    sched: [['town', 'bench_2', '10:30'], ['park', 'sakura_tree', '14:00']], love: ['gift_sketchbook', 'mat_ink', 'bev_green_tea'], like: ['book_picture_book', 'gift_pressed_flower', 'snack_cheesecake'], dislike: ['snack_candy'],
    lines: { default: L('happy|Sorry, I have ink on my nose, do I? Everyone is too polite to say.', 'Mio says the sea sounds like a big cat purring. I put it in the book.', 'The light here is wonderful. I keep stopping to look at it.', 'I draw at night, when the house breathes.', 'Do you know a good place for tea and quiet? I have deadlines.'),
      morning: L('Drop-off at the school gate, then a long walk to wake my pencils.'), rain: L('happy|Rain is my favourite colour to paint. It is not a colour. I paint it anyway.'), weekend: L('Weekend picnic with Mio. Sandwiches and sketching.'), spring: L('Pink petals all over my paper. I let them stay.'), summer: L('Too hot to draw. I draw ice cream instead.'), autumn: L('Autumn moved us here, so autumn gets a dedication in book two.'), winter: L('Snow sketches. My fingers freeze but the page looks warm.'),
      h2: L('happy|You are in my book now. A small girl with a tea tin. I hope that is all right.'), h4: L('happy|Mio asked if you would come to her party. I told her you probably have a busy life. She said, ask anyway.'), firstMeet: L('happy|Hello! Ayame Tsukino, sleepy, ink-stained, new. Nice to meet you.'), birthday: L('happy|You remembered my birthday! I will draw you a card.'), gift_love: L('happy|My very favourite thing! Thank you, truly.'), gift_like: L('happy|How lovely. Thank you.'), gift_neutral: L('Thank you. That was kind.'), gift_dislike: L('sad|Oh. Thank you. I will... keep it somewhere.'), gift_hate: L('sad|I am so sorry. I cannot.') },
    ev: [{ at: 2, t: ['@Ayame is sitting on a pile of unopened boxes, sketching the street.', "happy|Misa! Sit. I need a model who does not wriggle. No wait, I need a model who wriggles. Perfect."], q: ['What do you do?', ['Pose like a hero', "happy|Yes! Chin up. The bay in your hair.", 25], ['Sit and watch', "happy|A calm one. That helps.", 20], ['Help unpack', "happy|Boxes! My arch enemies. Thank you.", 20]], end: 'She tears out the page and hands it to you. A tiny Misa with an enormous smile.' },
      { at: 4, t: ["happy|Mio has her first day at school tomorrow. She is brave. I am a mess.", "She wants you to see her drawing. She calls it The Bay Cat."], q: ['What do you tell Mio?', ['Your picture is lovely', "happy|She will glow for a week.", 25], ['Do you want a school guide?', "happy|A guide! Oh, you would?", 25], ['The bay cat is my favourite too', "happy|You said the magic words. Mio will adopt you.", 20]], end: 'Mio presses a crayon drawing into your hand: a purple cat holding a tea tin.' }] },
  { id: 'daisuke', n: 2, pos: [6, 27], day: 100, date: 'Winter 16', family: 'Okabe', size: 2, who: { name: 'Daisuke', role: 'Retired ferry engineer', color: '#4a8aa8', birthday: { season: 'autumn', day: 2 }, look: { hair: '#d8d8e0', top: '#4a6a88', bottom: '#3a3a4a', skin: '#d6a07c', eyes: '#3a3a3a', accent: '#e0a84a' }, bio: 'Daisuke Okabe, 67, kept the ferries running for forty years and now fixes other people\'s radios. He lives with his grandson Ryo, who is learning to whistle.' },
    sched: [['harbour', 'bench', '09:30'], ['harbour', 'dock', '13:00']], love: ['gift_compass', 'bev_can_coffee', 'snack_onigiri_salmon'], like: ['bev_green_tea', 'gift_watch_chain', 'tool_rod'], dislike: ['snack_candy'],
    lines: { default: L('Engines have moods. So do ferries. So do grandsons.', 'happy|Forty years of salt. My knees can predict rain better than the weather lady.', 'Ryo is learning to whistle. We are all learning to be patient.', 'I fix radios now. Small engines, small problems.', 'A good bench near the water. That is all a man needs.'),
      morning: L('Morning coffee on the dock. The ferry still passes. It waves at me.'), rain: L('Rain. My knees were right again.'), weekend: L('Weekend: Ryo and I fish off the pier. We catch conversation, mostly.'), spring: L('Spring tide smells like new rope.'), summer: L('Summer ferry crowds. I am glad I am not on it.'), autumn: L('Autumn fog horns. I hum along.'), winter: L('Cold salt. A thermos. A bench. Winter, perfect.'),
      h2: L('happy|You do not rush a radio. Good. Nor a conversation.'), h4: L('happy|Ryo says you are the girl who knows where the fish are. High praise from a seven-year-old.'), firstMeet: L('happy|Daisuke Okabe. Retired. Cheerfully. And you?'), birthday: L('happy|At my age birthdays are for naps. But yours is a good surprise.'), gift_love: L('happy|A fine gift! This goes on the dashboard of my memory.'), gift_like: L('happy|Kind of you. Thank you.'), gift_neutral: L('Thank you. That is thoughtful.'), gift_dislike: L('sad|Hm. That is not for me, but I am grateful.'), gift_hate: L('sad|Ah, no. Not that. Sorry.') },
    ev: [{ at: 2, t: ['@Daisuke has a toolbox open on the dock and a tiny radio crackling in pieces.', "happy|Misa, hold the screwdriver. No, the little one. The one that looks like a toothpick."], q: ['What do you say?', ['Is it dead?', "happy|Not dead. Just sulking. Watch.", 20], ['I trust you', "happy|Good. That is half of fixing anything.", 25], ['Can I try?', "happy|Gently, gently. Aha, you have the hands.", 25]], end: 'The radio crackles, then a faint harbour jingle plays. Daisuke laughs for a long time.' },
      { at: 4, t: ["sad|Ryo's parents work far away. I am all he has here. Sometimes I wonder if I am enough.", "happy|Then he drew me a picture: me and the ferry. He wrote, My Captain."], q: ['What do you say?', ['You are enough', "happy|Thank you. I needed to hear it from someone who is not seven.", 30], ['Ryo is lucky', "happy|I am the lucky one. Do not tell him I said so.", 25], ['Teach us both something', "happy|A knot. Then another. Then a whole afternoon.", 25]], end: 'He ties a perfect sailor\'s knot and hands you the rope. "Keep it. For luck."' }] },
  { id: 'hanae', n: 3, pos: [11, 27], day: 130, date: 'Year 2 Spring 18', family: 'Shimizu', size: 4, who: { name: 'Hanae', role: 'Nurse and mother of twins', color: '#e08a6a', birthday: { season: 'winter', day: 12 }, look: { hair: '#6a3a2a', top: '#f0a090', bottom: '#4a5a7a', skin: '#f4cfb0', eyes: '#4a2a2a', accent: '#a0d0c8' }, bio: 'Hanae Shimizu, 41, works nights at Dr. Mori\'s clinic and spends her days chasing twin toddlers named Yu and Mu, who are exactly the same size and have completely opposite opinions.' },
    sched: [['park', 'playground', '10:00'], ['town', 'fountain', '15:00']], love: ['bev_green_tea', 'snack_strawberry_shortcake', 'gift_candle'], like: ['gift_plush_cat', 'toy_yarn_ball', 'ing_honey'], dislike: ['snack_candy'],
    lines: { default: L('happy|Yu! Mu! Not the fountain! The other fountain! There is no other fountain!', 'Night shift, morning twins, afternoon naps. I run on tea and love.', 'Two of everything, except sleep.', 'I will say the five-second rule is a suggestion, not a law.', 'happy|Welcome to the loudest house on the lawn. Come back soon.'),
      morning: L('Morning is the quiet storm. Right before breakfast.'), rain: L('Rainy days mean puddle detours. Wellies are my best investment.'), weekend: L('Weekend park day. The slide is their cathedral.'), spring: L('Spring brought us here. The twins brought us a cold.'), summer: L('Summer tantrums are hotter than winter ones.'), autumn: L('Leaf piles. Twins love them. I love them from a distance.'), winter: L('Mittens everywhere, and one is always missing.'),
      h2: L('happy|You\'re good with the twins. Don\'t tell them, they\'ll expect it every day.'), h4: L('happy|I almost fell asleep standing at the clinic. You made me sit. Thank you.'), firstMeet: L('happy|Hanae Shimizu! And these two are Yu and Mu. Say hello. Say it! Never mind.'), birthday: L('happy|A birthday present for the mum? How lovely.'), gift_love: L('happy|You know me too well. Thank you.'), gift_like: L('happy|How nice. The twins will want it. I will pretend not to hear.'), gift_neutral: L('Thank you, that is kind.'), gift_dislike: L('sad|Oh. I may hide that from the twins.'), gift_hate: L('sad|I am sorry. I cannot, truly.') },
    ev: [{ at: 2, t: ['@Yu has a bucket on his head. Mu is chasing a pigeon. Hanae is standing perfectly still, breathing.', "sad|Misa, give me one moment. Count to ten with me."], q: ['What do you do?', ['Count with her', "happy|One... two... thank you. Okay, I am back.", 25], ['Chase the pigeon', "happy|You are a hero. Mu will remember this for years.", 25], ['Offer to hold the bucket kid', "happy|Yu loves new people. You are doomed.", 20]], end: 'She hands you a rice ball wrapped in a napkin with twin handprints on it.' },
      { at: 4, t: ["happy|Do you want to hear a secret? I almost did not take the house. It felt too big for me.", "Then I saw the twins running in the garden and I thought, oh. It is just big enough."], q: ['What do you say?', ['It suits you', "happy|Thank you, truly.", 25], ['Can I babysit sometime?', "happy|You\'d have to survive a nap time. I\'d pay in snacks.", 30], ['The twins are lucky', "happy|They are noisy and lucky. And so am I.", 20]], end: 'Mu runs up and hands you a pebble. "Gift," she announces, then runs off.' }] },
  { id: 'kiyo', n: 4, pos: [27, 27], day: 149, date: 'Year 2 Summer 9', family: 'Aizawa', size: 2, who: { name: 'Kiyo', role: 'Student teacher and ramen fan', color: '#68b078', birthday: { season: 'summer', day: 24 }, look: { hair: '#3a2a2a', top: '#68b078', bottom: '#4a4a5a', skin: '#f2c9a4', eyes: '#2a2a2a', accent: '#f4d06a' }, bio: 'Kiyo Aizawa, 24, is doing a teaching practicum at Hoshimori High, rents the little house with a rescued cat named Chalk, and has eaten at every ramen cart on the coast.' },
    sched: [['school_grounds', 'bench', '09:00'], ['town', 'ramen_cart', '18:30']], love: ['gift_hot_sauce', 'dish_ramen', 'bev_can_coffee'], like: ['snack_onigiri_salmon', 'gift_sketchbook', 'bev_green_tea'], dislike: ['snack_candy'],
    lines: { default: L('happy|I am a teacher. Sort of. Mostly I am a person standing near a blackboard.', 'Chalk the cat is doing a sit-in on my lesson plans.', 'The best ramen in the bay is at the cart. Do not argue. I have data.', 'happy|Teaching is just explaining something until someone says oh.', 'Is it weird that I am nervous around kids who are nearly my age?'),
      morning: L('Coffee, lesson plan, cat. In that order.'), rain: L('Rain makes the students sleepy and the teachers hungry.'), weekend: L('Weekend ramen crawl. Come with me. I have a map.'), spring: L('New term, new nerves.'), summer: L('Summer break: the cat and I do nothing, loudly.'), autumn: L('Autumn exams. Please be kind to the invigilator.'), winter: L('Winter ramen is a spiritual practice.'),
      h2: L('happy|You explained that better than I did. Teach me your ways.'), h4: L('happy|Honestly? You are why I decided to stay a teacher.'), firstMeet: L('happy|Hi! Kiyo Aizawa. Practicum teacher. Please do not tell my students I once cried at an anime.'), birthday: L('happy|You remembered?! I am deeply touched and slightly hungry.'), gift_love: L('happy|This is my favourite food group!'), gift_like: L('happy|Great, thanks! Chalk says thanks too.'), gift_neutral: L('Thanks! That is nice.'), gift_dislike: L('sad|Ah. Hm. Thank you?'), gift_hate: L('sad|No, no, no. Please.') },
    ev: [{ at: 2, t: ['@Kiyo is hunched over a stack of worksheets, a cold bowl of ramen at his elbow, Chalk asleep on the pile.', "sad|Misa, be honest: is this worksheet confusing?"], q: ['What is your verdict?', ['It is a bit confusing', "happy|Thank you. Honesty is the whole point.", 25], ['It is great', "happy|Aw. You are just being nice. Thank you anyway.", 15], ['Let me rewrite it', "happy|Yes! Co-teacher Misa. I like it.", 25]], end: 'Chalk stretches and steps on the pen. Somehow that is the best correction of the day.' },
      { at: 4, t: ["happy|I have my first real lesson tomorrow. Class 2-B. Do you know the vibe?", "sad|What if they just stare?"], q: ['What do you say?', ['Start with a joke', "happy|A joke. Of course. Something about ramen. They will love it.", 25], ['Ask them a question', "happy|A question! Teaching is just asking nicely.", 25], ['They will like you', "happy|Thank you. Say it again. A few more times.", 20]], end: 'He writes a big word on the board: HELLO. Then adds a drawing of a cat.' }] },
  { id: 'masaru', n: 5, pos: [32, 27], day: 188, date: 'Year 2 Autumn 20', family: 'Takeda', size: 3, who: { name: 'Masaru', role: 'Young fisherman and new father', color: '#4878c8', birthday: { season: 'spring', day: 12 }, look: { hair: '#2a2a3a', top: '#4878c8', bottom: '#3a4a3a', skin: '#d6a07c', eyes: '#2a2a2a', accent: '#f4e070' }, bio: 'Masaru Takeda, 29, joined the harbour boats this autumn with his wife Emi and baby Sora. He is up before the sun, sleeps in the afternoon and is slightly terrified of his own happiness.' },
    sched: [['harbour', 'dock', '06:00'], ['harbour', 'market_stall', '11:30'], ['town', 'bench_1', '16:00']], love: ['fish_sardine', 'bev_can_coffee', 'snack_onigiri_salmon'], like: ['mat_bait_premium', 'bev_green_tea', 'ing_honey'], dislike: ['snack_candy'],
    lines: { default: L('happy|Four a.m. starts are easier when someone small hums on your shoulder.', 'The sea does not care about my schedule. I have learned to respect that.', 'happy|Baby Sora laughed today. I forgot my catch just listening.', 'Fish, family, sleep. In that order. I am working on the sleep.', 'Do you know where I can buy a rocking chair? Not for fishing. Well, a bit for fishing.'),
      morning: L('Back from the boat, hands salty, heart full.'), rain: L('Rough water today. I stay in port and tell the baby tall tales.'), weekend: L('Weekend: the baby stroller and the pier. Both are slightly wobbly.'), spring: L('Spring catch is bright and silver.'), summer: L('Summer nights on the boat. The stars are free.'), autumn: L('Autumn moves us in. Autumn fish, I hope, will move in too.'), winter: L('Winter nets are cold and stubborn.'),
      h2: L('happy|You know the tides better than most deckhands.'), h4: L('happy|Emi says you must come to Sora\'s first festival. I said, obviously.'), firstMeet: L('happy|Masaru Takeda, new in the harbour. Pleased to meet you.'), birthday: L('happy|My birthday? The baby will be thrilled. She does not know yet.'), gift_love: L('happy|That is perfect. Emi will laugh.'), gift_like: L('happy|Thanks! Appreciate it.'), gift_neutral: L('Thanks, that is thoughtful.'), gift_dislike: L('sad|Uh. Thanks, I think.'), gift_hate: L('sad|Please, not that.') },
    ev: [{ at: 2, t: ['@Masaru is mending a net on the dock, humming a lullaby off-key. A small hat pokes out of a sling on his chest.', "happy|Misa! Meet Sora. She is asleep. Be quiet. Be very, very quiet."], q: ['How do you greet her?', ['Wave silently', "happy|You are a natural. She almost smiled.", 25], ['Whisper a hello', "happy|Perfect whisper. Sora is a fan.", 25], ['Offer to hold her', "happy|Careful! Head first! Oh, you know how.", 20]], end: 'Sora opens one sleepy eye, looks right at you and goes back to sleep. That counts as a blessing.' },
      { at: 4, t: ["sad|I'm scared, Misa. I'm scared I can't be what they need.", "happy|And then I come home and Sora grabs my finger. It turns out you don't need to be everything."], q: ['What do you say?', ['You are already enough', "happy|Thank you. I\'ll try to believe it.", 30], ['Ask for help', "happy|Yes. Asking is good. Emi told me the same.", 25], ['Take a nap', "happy|A nap! Brilliant. Wake me when the baby is eighteen.", 15]], end: 'He pats his sling. "We are doing fine. Aren\'t we, little captain?"' }] },
  { id: 'nanase', n: 6, pos: [37, 27], day: 230, date: 'Year 3 Spring 6', family: 'Kisaragi', size: 2, who: { name: 'Nanase', role: 'Violin teacher', color: '#9a68c8', birthday: { season: 'autumn', day: 25 }, look: { hair: '#c8c8d8', top: '#9a68c8', bottom: '#3a3050', skin: '#f2d2b8', eyes: '#3a2a4a', accent: '#f4e0a0' }, bio: 'Nanase Kisaragi, 52, teaches violin to anyone willing to practise and lives with an elderly cat named Maestro. She walks to the bandstand at dusk to play for the pigeons.' },
    sched: [['park', 'bandstand', '16:00'], ['town', 'stage', '10:30']], love: ['gift_violin_rosin', 'gift_vinyl_record', 'bev_green_tea'], like: ['gift_music_box', 'gift_tea_tin', 'ing_honey'], dislike: ['snack_candy'],
    lines: { default: L('happy|Every instrument is a conversation. Violins are just talkative.', 'Practice is not suffering. Practice is a promise to your future self.', 'Maestro, my cat, only likes minor keys.', 'happy|I play for the pigeons at dusk. They are a polite audience.', 'Shall I teach you a scale? It will take seven minutes and change your life.'),
      morning: L('Morning scales. The neighbours have not complained. They hum along.'), rain: L('Rain is the best metronome.'), weekend: L('Weekend lessons: three students and one very loud cat.'), spring: L('Spring concerto in the park. Bring tea.'), summer: L('Violins hate humidity. I forgive them.'), autumn: L('Autumn is for Bach and warm shawls.'), winter: L('Winter recitals at the library. Come early, the chairs vanish.'),
      h2: L('happy|You listen properly. Most people listen to their phones during music.'), h4: L('happy|I wrote a short piece for you. It is called Tea Tin in A Major.'), firstMeet: L('happy|Nanase Kisaragi. Violin. Cat. Pleased to meet you.'), birthday: L('happy|A birthday? Then I shall play something just for you.'), gift_love: L('happy|You have exquisite taste in gifts. I am moved.'), gift_like: L('happy|How kind. Thank you.'), gift_neutral: L('Thank you, that is considerate.'), gift_dislike: L('sad|Hm. I will smile and put it away.'), gift_hate: L('sad|Oh, dear. No.') },
    ev: [{ at: 2, t: ['@Nanase stands on the bandstand at dusk, bow raised, a handful of pigeons for an audience.', "happy|Stay. Stay and listen. Please sit on the bench like a proper critic."], q: ['How do you react?', ['Close your eyes and listen', "happy|The best kind of critic. Thank you.", 25], ['Clap loudly', "happy|The pigeons just left. But I am flattered.", 15], ['Hum along', "happy|Yes! A duet! Wonderful.", 25]], end: 'She finishes with a long note that floats across the park like a lantern.' },
      { at: 4, t: ["happy|I have not performed for an audience in five years. My hands forgot how to be afraid.", "Tomorrow is the library recital. Will you turn pages for me?"], q: ['Do you say yes?', ['Of course', "happy|Wonderful. Only turn when I nod.", 30], ['I will be in the front row', "happy|Front row. I will play to you.", 25], ['I will bring tea', "happy|Tea! The ultimate stagehand.", 20]], end: 'She presses a dog-eared page of sheet music into your hand. "Keep it. For luck."' }] },
];
const mk = (id) => `tp_house_${id}`;
for (const f of FAMILIES) {
  const w = f.who, k = `tp_in_${f.id}`, fac = FACADES[`tp_house_${f.n}`], d = fac.doors[0], tx = f.pos[0] + Math.floor((d.x + d.w / 2) / 32), ty = f.pos[1] + fac.hT;
  const home = { at: '08:00', map: 'town', spot: mk(f.n), dir: 'up' };
  npc(f.id, {
    name: w.name, role: w.role, color: w.color, bio: w.bio, look: w.look, birthday: w.birthday,
    hint: `moves into house ${f.n} on the south lawn of the square on ${f.date} (the ${f.family} family).`,
    schedule: [{ when: `!flag:${k}`, stops: [{ at: '00:00', map: null }] }, { when: 'weather:rain|storm|snow', stops: [{ at: '09:00', map: 'town', spot: mk(f.n), dir: 'up' }, { at: '17:00', map: null }] },
      { stops: [home, ...f.sched.map(([map, spot, at]) => ({ at, map, spot })), { at: '17:30', map: 'town', spot: mk(f.n), dir: 'up' }, { at: '20:00', map: null }].sort((a, b) => a.at.localeCompare(b.at)) }],
    gifts: { love: f.love, like: f.like, dislike: f.dislike, hate: ['misc_spoiled_food'] }, lines: w.lines || f.lines,
    events: f.ev.map((e) => ({ id: `${f.id}_h${e.at}`, hearts: e.at, map: 'town', when: `flag:${k}&time>=10:00&time<18:00`, script: () => sc(f.id, ...open(f.id), ...e.t, ch(e.q[0], ...e.q.slice(1)), e.end) })),
  });
  const b = building(`tp_house_${f.n}`, f.pos[0], f.pos[1], { litUntil: 22 * 60 });
  b.obj.when = `flag:${k}`;
  const emptyHouse = { spr: `tp_house_${f.n}`, x: f.pos[0], y: f.pos[1], w: 4, h: fac.hT, shadow: 0, when: `!flag:${k}`, sprFn: () => `tp_house_${f.n}`, interact: { label: 'Empty house', run: (g) => g.say(null, null, `A FOR RENT sign hangs in the window. It says: The ${f.family} family arrives on ${f.date}.`) } };
  mapPatch('town', {
    objects: [b.obj, emptyHouse, tile(tx, ty - 1, { use: 'tp_knock', when: `flag:${k}`, fam: f.id }), prop('tp_van', f.pos[0], ty, { w: 3, h: 2, shadow: 24, when: `flag:tp_van_${f.id}` }), prop('tp_boxes', f.pos[0] + 3, ty, { w: 1, h: 1, solid: false, shadow: 10, when: `flag:tp_van_${f.id}` })],
    edit: (o) => ((o.spr === 'town_tree_oak_s' && o.x === 3 && o.y === 29 && f.id === 'ayame') || (o.spr === 'town_tree_maple_s' && o.x === 32 && o.y === 29 && f.id === 'masaru') ? { ...o, when: `!flag:${k}` } : o),
    spots: { [mk(f.n)]: [tx, ty] },
  });
}
register('interaction', 'tp_knock', { label: 'Knock on the door', run: (g, o) => {
  const f = FAMILIES.find((q) => q.id === (o && o.fam)) || FAMILIES[0];
  return g.run([{ t: 'say', who: null, text: `The ${f.family} family home. ${f.size > 2 ? 'Laughter' : 'A radio'} drifts from inside.` }, ...(g.hearts(f.id) >= 2 ? [say(f.id, 'happy', 'Come in some other day! We are in the middle of something wonderful. Tea later?')] : [])]);
} });

// ---------------------------------------------------------------- arrival day: the moving van
export const arrivedCount = (g) => FAMILIES.filter((f) => g.state.flags[`tp_in_${f.id}`]).length;
function arrive(g, f) {
  g.setFlag(`tp_in_${f.id}`, true); g.setFlag(`tp_van_${f.id}`, true); S(g).arrived[f.id] = g.day; g.stat('familiesArrived');
  g.mail(`tp_arr_${f.id}`, 'Town Council', `The ${f.family} family moves into house ${f.n} today. A friendly hello would be welcome. - Mayor Hoshino`);
  g.bus.emit('tpArrival', { id: f.id, family: f.family });
}
register('system', 'tp_people', {
  init(g) {
    const check = () => {
      for (const f of FAMILIES) {
        if (g.flag(`tp_van_${f.id}`) && S(g).arrived[f.id] !== g.day) g.setFlag(`tp_van_${f.id}`, false);
        if (!g.state.flags[`tp_in_${f.id}`] && g.day >= f.day) arrive(g, f);
      }
      g.setFlag('tp_party_today', ((g.day - 1) % 28) + 1 === 13 && arrivedCount(g) >= 2);
      g.setFlag('tp_garage_today', ((g.day - 1) % 28) + 1 === 6 && arrivedCount(g) >= 3);
      census(g);
    };
    g.bus.on('dayStart', check); g.bus.on('gameStart', check); g.bus.on('gameLoaded', check);
    const scene = () => {
      if (!idle(g) || g.world.map.id !== 'town' || g.minutes < 9 * 60 || g.minutes > 18 * 60) return;
      const f = FAMILIES.find((q) => g.flag(`tp_van_${q.id}`) && !S(g).seenVan[q.id]); if (!f) return;
      S(g).seenVan[f.id] = g.day;
      g.run([N(`A moving van is parked outside house ${f.n}. Movers shuffle boxes through the door while the ${f.family} family directs traffic.`),
        say(f.id, 'happy', f.id === 'hanae' ? 'Careful with the crib! Yu, put the lamp down!' : 'Left a bit. No, my left. Oh, hello there!'),
        { t: 'choice', prompt: `Welcome the ${f.family} family?`, options: [
          { text: 'Help carry boxes', steps: [call((gg) => { gg.useEnergy(6); gg.addFriend(f.id, 12); gg.addMood(5); gg.stat('boxesCarried'); }), say(f.id, 'happy', 'Oh, you are a lifesaver. Mind the one marked FRAGILE. And the one marked DO NOT ASK.')] },
          { text: 'Give a welcome snack', when: 'item:snack_onigiri_salmon', steps: [{ t: 'take', item: 'snack_onigiri_salmon', n: 1 }, call((gg) => gg.addFriend(f.id, 18)), say(f.id, 'happy', 'A rice ball! You are officially my first friend in the bay.')] },
          { text: 'Just say hello', steps: [call((gg) => gg.addFriend(f.id, 6)), say(f.id, 'happy', 'Hello! We are going to like it here. I can tell.')] }] },
      ]);
    };
    g.bus.on('mapEnter', scene); g.bus.on('hour', scene);
  },
});

// ---------------------------------------------------------------- census
export function population(g) { let base = 1180; try { base = require_pop(g); } catch (e) { /* default */ } return base + FAMILIES.filter((f) => g.state.flags[`tp_in_${f.id}`]).reduce((a, f) => a + f.size, 0); }
let popFn = null; import('../sv_life/town_changes.js').then((m) => { popFn = m.popOf; }).catch(() => {});
const require_pop = (g) => (popFn ? popFn(g) : 1180 + 40 * Math.floor((g.day - 1) / 112));
export function happiness(g) {
  const shops = SHOPS.filter((s) => g.state.flags[`tp_shop_${s.id}_open`]).length, hs = all('npc').filter((n) => !n.hidden && n.gifts && g.hearts(n.id) >= 4).length;
  return clamp(Math.round(48 + 3 * doneCount(g) + 2 * shops + 2 * arrivedCount(g) + Math.min(10, hs) + Math.min(6, Math.floor(S(g).vol.pts / 20))), 0, 100);
}
export const DISTRICTS = [['Hoshimori Square', 'town', (g) => 3 * projDone(g, 'library') + 2 * projDone(g, 'night') + 2 * SHOPS.filter((s) => g.state.flags[`tp_shop_${s.id}_open`]).length],
  ['The Shotengai', 'shotengai', (g) => 2 * (g.state.flags.nc_bakery_open ? 1 : 0) + 3 * projDone(g, 'bus')], ['Harbour', 'harbour', (g) => 4 * projDone(g, 'promenade') + 3 * projDone(g, 'weather') + (S(g).auction.sessions ? 2 : 0)],
  ['Lantern Lane', 'lane', (g) => 4 * projDone(g, 'recycle') + 2 * projDone(g, 'bus')], ['Sakura Park', 'park', (g) => 4 * projDone(g, 'skate') + 4 * projDone(g, 'garden')], ['Southside Lawn', 'town', (g) => 3 * arrivedCount(g)]];
export function districtMood(g, i) { const [, , mod] = DISTRICTS[i], r = g.rngFor('tp_dist' + i)(); return clamp(Math.round(happiness(g) - 6 + mod(g) + (r - 0.5) * 10 - (g.weather === 'rain' || g.weather === 'storm' ? 3 : 0)), 0, 100); }
export const moodWord = (v) => (v >= 75 ? 'Cheerful' : v >= 60 ? 'Content' : v >= 45 ? 'Quiet' : 'Gloomy');
function census(g) { S(g).census.happy = happiness(g); }
listApp('tp_census', { name: 'Town Census', icon: itemIcon('paper', { c: Rr.mint[2] }), order: 34, pages: [
  { name: 'Town', build(g) { const s = happiness(g); return { lines: [{ t: 'Hoshimori Bay census', c: Rr.coral[1] }, `Population: ${population(g)}`, `New families: ${arrivedCount(g)}/6`, `Shops opened: ${SHOPS.filter((q) => g.state.flags[`tp_shop_${q.id}_open`]).length}/4`, `Town projects: ${doneCount(g)}/8`, `Happiness score: ${s}/100 (${moodWord(s)})`],
    bars: [{ label: 'Happiness', v: s, max: 100, c: Rr.butter[2] }], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
  { name: 'Districts', build(g) { return { lines: [{ t: 'Mood by district', c: Rr.coral[1] }, ...DISTRICTS.map((d, i) => { const v = districtMood(g, i); return `${d[0]}: ${v} ${moodWord(v)}`; })], bars: DISTRICTS.slice(0, 3).map((d, i) => ({ label: d[0].slice(0, 12), v: districtMood(g, i), max: 100 })), acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
  { name: 'Families', build(g, st) { const f = FAMILIES[st.sel] || FAMILIES[0], here = !!g.state.flags[`tp_in_${f.id}`];
    return { list: FAMILIES.map((q) => ({ t: `${g.state.flags[`tp_in_${q.id}`] ? '' : '? '}${q.family}`, c: g.state.flags[`tp_in_${q.id}`] ? undefined : Rr.ink[3] })), lines: [{ t: `${f.family} family`, c: Rr.coral[1] }, here ? `${f.who.name}, ${f.who.role}` : `Arrives ${f.date}`, here ? `House ${f.n}, ${f.size} people. Hearts: ${g.hearts(f.id)}` : 'House is being repainted.'], acts: [{ label: 'Close', run: () => g.scenes.top.close && g.scenes.top.close() }] }; } },
] });

// ---------------------------------------------------------------- Southside events
mapPatch('town', { objects: [prop('tp_tea_table', 17, 28, { w: 1, when: 'flag:tp_party_today', use: 'tp_block_party', shadow: 16 }), prop('tp_swap_box', 23, 28, { when: 'flag:tp_garage_today', use: 'tp_garage', shadow: 12 })] });
register('interaction', 'tp_block_party', { label: 'Southside block party', run: (g) => {
  const n = arrivedCount(g);
  if (g.flag('tp_party_done') === g.day) return g.say(null, null, 'The party is still going strong. Someone has started a conga line.');
  g.setFlag('tp_party_done', g.day);
  return g.run([N(`Lanterns, folding tables and a very long banner: SOUTHSIDE BLOCK PARTY. ${n} families bring dishes to share.`), call((gg) => { gg.addMood(14); gg.useEnergy(-10); gg.advance(60); S(gg).vol.pts += 2; for (const f of FAMILIES) if (gg.state.flags[`tp_in_${f.id}`]) gg.addFriend(f.id, 4); gg.stat('blockParties'); }), say('misa', 'happy', 'Everyone brought something. Everyone ate too much. That is the point.')]);
} });
register('shop', 'tp_garage', { name: 'Southside garage sale', color: Rr.butter[2], buys: [], hours: ['9:00', '17:00'], greet: { default: ['Everything must go! Except the cat.'] },
  stock: ['mat_cloth', 'mat_string', 'mat_beads', 'mat_wood', 'book_picture_book', 'mat_paper'].filter((i) => get('item', i)).map((item) => ({ item, price: 30 })) });
register('interaction', 'tp_garage', { label: 'Garage sale', run: (g) => new Promise((res) => g.open('shop', 'tp_garage', res)) });

features('Town Growth', [
  'Six families move into new houses on the south lawn of the square across three years (Autumn 12 to Year 3 Spring 6), each home an empty FOR RENT house until the day',
  'Moving van day: a van and boxes park outside the new house, with a welcome scene where Misa can carry boxes, bring a snack or say hello',
  'Six new villagers (Ayame, Daisuke, Hanae, Kiyo, Masaru, Nanase) with schedules around the square, park and harbour, and about nineteen lines each',
  'Each villager has a two-event arc at 2 and 4 hearts, with choices that change friendship',
  'Town Census phone app: population, new families, shops and projects, and a happiness score out of 100',
  'Census mood by district (Square, Shotengai, Harbour, Lantern Lane, Sakura Park, Southside) shaped by projects, shops, weather and residents',
  'Southside block party on the 13th when it falls on a weekend, with lanterns, shared food and a mood lift',
  'Southside garage sale on the 6th of each season with cheap craft supplies and picture books',
  'Knock on a family door for a word, or read the FOR RENT sign to learn when the next neighbours arrive',
]);
