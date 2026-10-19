// Four new storefronts that open over the years on the town square (wrapped `objects` getter + economy shop): Petal and Pot (flower shop,
// Y1 Summer 14), Nook Books (bookstore annex, Y1 Winter 8), Second Spring (thrift, Y2 Spring 10) and Spoke and Sprocket (bike repair,
// Y2 Autumn 6). Each has an owner NPC (two heart events), four unique items, a shop and a part-time job shift. Flag: tp_shop_<id>_open.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { facade as _f, FACADES, building } from '../town/facade.js';
import { signpost } from '../town/interactions.js';
import { shopOpen, hoursText } from '../economy/core.js';
import { JOBS, startShift } from '../economy/jobs.js';
import { S, mapPatch, prop, tile, mailSafe, sc, ch, open, npc, N } from './state.js';
import '../../minigames/sv5_town/shift.js';
import './art.js';

const I = (id, name, cat, price, shape, c, desc, extra = {}) => register('item', id, { name, cat, price, buy: Math.round(price * 2.2 / 5) * 5, icon: itemIcon(shape, { c }), desc, ...extra });
// ---------------------------------------------------------------- unique items (16)
I('gift_tp_posy', 'Spring posy', 'gift', 90, 'flower', Rr.coral[3], 'A hand-tied posy of whatever is blooming this week.', { tags: ['flower', 'gift'] });
I('gift_tp_grand_bouquet', 'Grand bouquet', 'gift', 220, 'flower', Rr.ribbon[2], 'Roses, ribbon and a card. Fuyuka ties it with a double knot.', { tags: ['flower', 'gift'] });
I('gift_tp_terrarium', 'Glass terrarium', 'gift', 260, 'plant', Rr.mint[3], 'A tiny moss world in a jar. It needs one spray of water a week. Or none.', { tags: ['flower', 'gift'] });
I('bev_tp_rose_tea', 'Rose petal tea', 'misc', 70, 'cup', Rr.sakura[3], 'A pink tea that smells like a garden party.', { tags: ['tea', 'drink'], energy: 18, mood: 6 });
I('book_tp_haiku_zine', 'Haiku zine', 'book', 110, 'book', Rr.sky[2], 'Seventeen syllables at a time. A small stack of local poems.', { tags: ['book'], use: (g) => { g.addXP('study', 6); g.addMood(4); g.toast('A quiet read. +Study'); return true; } });
I('book_tp_bay_history', 'Bay History: Volume 2', 'book', 140, 'book', Rr.wood[3], 'Lighthouses, ferries and one famous goat.', { tags: ['book'], use: (g) => { g.addXP('study', 8); g.toast('You learn about the famous goat. +Study'); return true; } });
I('gift_tp_bookmark_set', 'Pressed bookmark set', 'gift', 80, 'stamp', Rr.lilac[3], 'Three bookmarks made with pressed flowers.', { tags: ['book', 'gift'] });
I('gift_tp_reading_lamp', 'Little reading lamp', 'gift', 240, 'tool', Rr.butter[3], 'A warm clip-on lamp for late chapters.', { tags: ['gift'] });
I('gift_tp_tea_set', 'Mismatched tea set', 'gift', 160, 'cup', Rr.lilac[2], 'Four cups, none alike. Oharu insists that is the point.', { tags: ['vintage', 'tea', 'gift'] });
I('gift_tp_vintage_scarf', 'Vintage scarf', 'gift', 190, 'shirt', Rr.coral[2], 'A silk scarf with a faint smell of cedar and old summers.', { tags: ['vintage', 'gift'] });
I('gift_tp_music_tin', 'Tin music box', 'gift', 210, 'box', Rr.butter[2], 'It plays a tune nobody can name but everybody hums.', { tags: ['vintage', 'gift'] });
I('gift_tp_pocket_watch', 'Pocket watch', 'gift', 420, 'key', Rr.metal[3], 'Runs four minutes slow, exactly. Tobias approves.', { tags: ['vintage', 'gift'] });
I('misc_tp_patch_kit', 'Patch kit', 'misc', 60, 'tool', Rr.sky[3], 'Glue, rubber patches and a tiny file.', { tags: ['bike'] });
I('misc_tp_chain_oil', 'Chain oil', 'misc', 50, 'bottle', Rr.butter[3], 'Smells like a workshop. Keeps a bike purring.', { tags: ['bike'] });
I('gift_tp_basket_charm', 'Basket charm', 'gift', 100, 'star', Rr.vermilion[2], 'A little enamel charm that clips onto a bike basket.', { tags: ['bike', 'gift'] });
I('gift_tp_bell_bright', 'Bright bell', 'gift', 130, 'star', Rr.mint[3], 'A bell with a sound like a tiny wind chime.', { tags: ['bike', 'gift'] });

// ---------------------------------------------------------------- the data
const L = (...a) => a;
const SHOPS = [
  { id: 'flower', owner: 'fuyuka', name: 'Petal and Pot', open: 42, pos: [41, 13], closed: [1], hours: ['9:00', '18:00'], color: Rr.coral[2], facade: 'tp_shop_flower', date: 'Summer 14',
    stock: ['gift_tp_posy', 'gift_tp_grand_bouquet', 'gift_tp_terrarium', 'bev_tp_rose_tea', 'gift_pressed_flower'], job: { wage: 240, xp: { gardening: 8, charm: 4 }, role: 'Florist helper' },
    who: { name: 'Fuyuka', full: 'Fuyuka Mizuno', age: 38, role: 'Owner of Petal and Pot', color: '#e87a90', birthday: { season: 'summer', day: 21 }, look: { hair: '#4a3a52', top: '#6aa88a', bottom: '#f8f0e0', skin: '#f4d2b4', eyes: '#4a3a2a', accent: '#f0a0b0' },
      bio: 'Fuyuka Mizuno, 38, quit a loud city job to open a tiny flower shop. She speaks softly, names every plant and believes a bunch of flowers can fix about half of everything.',
      love: ['gift_pressed_flower', 'crop_tulip', 'crop_cosmos'], like: ['crop_sunflower', 'bev_green_tea', 'gift_tea_tin', 'ing_honey'], dislike: ['snack_candy'], hate: ['misc_spoiled_food'],
      lines: { default: L('happy|Welcome to Petal and Pot. Mind the fern, she is shy.', 'This one is a peony. She blooms for six days a year and spends the rest sulking.', 'I talk to the plants. They talk back. Mostly about water.', 'happy|Flowers are the only gift that is supposed to die. That is what makes them honest.', 'Pick a colour and I will find you a flower to match your mood.', 'Every bouquet has a secret message, if you know the language. I will teach you.', 'happy|The scent in here is a mix of wet soil and optimism.'),
        morning: L('Morning delivery! Crates of tulips and one very sleepy courier.', 'The early light is the best for arranging.'), afternoon: L('A quiet afternoon. The ferns are napping.', 'Customers come in waves, like tides with umbrellas.'), evening: L('Time to cover the buckets. Goodnight, blossoms.', 'The shop is sweetest at closing, when the scent settles.'),
        rain: L('happy|Rain! The pots are cheering. I can hear them.', 'Wet days are quiet. Perfect for ribbon cutting.'), weekend: L('Weekend weddings and apology bouquets. Mostly apology bouquets.'),
        spring: L('Spring is a florist stampede. I love it. I am exhausted.'), summer: L('Sunflowers by the dozen. They look at you like you owe them rent.'), autumn: L('Cosmos and chrysanthemums. The shop smells like warm tea.'), winter: L('Winter is camellias, holly and secrets in greenhouse jars.'),
        h2: L('happy|You have a good eye. Your posy was nearly perfect. Nearly. Do it again.'), h4: L('happy|You are the only one who asks what the flowers feel. Thank you for that.'), firstMeet: L("happy|Oh, a new face! I am Fuyuka. Please sniff something. Anything. It's therapy."),
        birthday: L('happy|You remembered my birthday! I will press this card between two pages forever.'), gift_love: L('happy|A flower! You found the one thing that makes me cry in a good way.'), gift_like: L('happy|How lovely. I will find it a vase.'), gift_neutral: L('Thank you. I will find a place for it, probably next to a fern.'), gift_dislike: L('sad|Hm. I will put it in the back, far from the lilies.'), gift_hate: L('sad|Oh. Oh, no. That is a smell I cannot be around.') },
      ev: [{ at: 2, t: [`happy|Misa! Hold this pot. No, like a baby bird. Gently.`, `@Fuyuka shows you how to tie a ribbon with one hand while singing to a fern.`], q: ['Which flower says "thank you"?', ['Cosmos', "happy|Yes! Quiet, steady gratitude. You listen.", 20], ['Red roses', "happy|Ha. Romance, not gratitude. Cute, though.", 10], ['A cactus', "surprised|A cactus means I endure. Honest, at least.", 12]], end: "She hands you a posy tied with a double knot. A real one, with thanks." },
        { at: 4, t: [`sad|I opened this shop in a hurry. I was running away from a very loud office.`, `The flowers were the first things that did not ask for anything.`], q: ['What do you say?', ['You made something kind here', "happy|That is a better review than any five stars.", 25], ['Do you miss the city?', "happy|Only the noodles. The noodles, yes.", 15], ['Run away to flowers anytime', "happy|Together, then. We will open a greenhouse.", 20]], end: 'She presses a small dried flower into your palm. "For luck," she says.' }] } },
  { id: 'books', owner: 'genji', name: 'Nook Books', open: 92, pos: [41, 19], closed: [0], hours: ['10:00', '19:00'], color: Rr.sky[2], facade: 'tp_shop_books', date: 'Winter 8',
    stock: ['book_tp_haiku_zine', 'book_tp_bay_history', 'gift_tp_bookmark_set', 'gift_tp_reading_lamp', 'book_poetry', 'book_picture_book', 'book_mystery'], job: { wage: 230, xp: { study: 10, charm: 3 }, role: 'Bookshop assistant' },
    who: { name: 'Genji', full: 'Genji Kurata', age: 61, role: 'Owner of Nook Books', color: '#4a78b8', birthday: { season: 'winter', day: 3 }, look: { hair: '#c8c8d4', top: '#4a6a88', bottom: '#3a3a4a', skin: '#e8c6a2', eyes: '#3a3a4a', accent: '#d8b868' },
      bio: 'Genji Kurata, 61, sold books from a cart for twenty years before the annex opened. He is dry, kind and has read exactly what you are holding.',
      love: ['book_poetry', 'gift_tea_tin', 'bev_green_tea'], like: ['book_mystery', 'gift_postcard', 'gift_bookmark', 'ing_honey'], dislike: ['snack_candy'], hate: ['misc_spoiled_food'],
      lines: { default: L('That one? Read it twice. It gets better. Or I do.', 'neutral|Silence is a service. Please enjoy it responsibly.', 'happy|Every book here has been loved by at least one person. I count that as a warranty.', 'I do not recommend books. I recommend moods. What is yours?', 'Do not dog-ear. I will forgive you the first time.', 'A bookshop is a hospital for wandering minds. Ask the cat.', 'happy|The annex has the quiet shelves. The cart outside has the silly ones.'),
        morning: L('Ink and tea. The best breakfast.', 'Early customers buy the right books. Late ones buy the sleepy ones.'), afternoon: L('The sun slants on the poetry shelf at three. I time my tea to it.', 'A slow afternoon. A bookseller dreams of slow afternoons.'), evening: L('Closing time. The books lean on each other when I turn off the lamps.', 'Take one home. Return it never. I will pretend.'),
        rain: L('happy|Rain sells mystery novels. It is a natural law.', 'Dripping umbrellas, steaming glasses. A perfect shop.'), weekend: L('Weekends bring families. The kids corner becomes a small riot.'),
        spring: L('New season, new covers. The pastel ones sell themselves.'), summer: L('Beach reads and cold barley tea. Shelve the heavy ones for winter.'), autumn: L('Autumn is when everyone discovers they like reading again.'), winter: L('Winter is my season. A heater, a cat and nobody asking for refunds.'),
        h2: L('happy|You shelve books like someone who respects them. That is rare.'), h4: L('happy|I have kept a book back for you. It is not for sale. It is for you.'), firstMeet: L('neutral|Welcome. Please touch everything gently and buy something eventually.'),
        birthday: L('happy|A birthday present? For an old bookseller? ...I will put it on the poetry shelf and pretend it is stock.'), gift_love: L('happy|Poetry! I am quite overcome. Do not tell the cat.'), gift_like: L('happy|Thank you. I will read it by the window.'), gift_neutral: L('Thank you. It will find a shelf.'), gift_dislike: L('sad|I will accept this. I will not read it.'), gift_hate: L('sad|Please. Not near the books.') },
      ev: [{ at: 2, t: [`neutral|Misa. Stand there. Do not move. I need a witness.`, `@Genji sets a heavy book on the counter and opens it to a page with a pressed maple leaf.`], q: ['What do you say about the leaf?', ['It marks a happy day', "happy|Exactly. Everyone leaves something in a book.", 20], ['Whose is it?', "happy|Mine. Forty years ago. Do not ask. ...Fine. Her name was Hatsue.", 25], ['Put it back carefully', "happy|Good hands. You may borrow this one.", 15]], end: 'He slides the book across the counter. "Back in a week. Or two."' },
        { at: 4, t: [`neutral|I am thinking of a reading corner. A real one. With cushions.`, `The cart is fine, but people need somewhere to sit and be slow.`], q: ['Would you like help?', ['I will carry cushions', "happy|A cushion bearer! Hired. Unpaid. Rewarded in tea.", 25], ['Add a lamp', "happy|A lamp! Yes. Warm light, never blue.", 20], ['Add a cat bed', "happy|The cat will take credit. As he always does.", 15]], end: 'He writes a note on a card: "Reading corner: Misa approved." You are quite sure it is a real thing now.' }] } },
  { id: 'thrift', owner: 'oharu', name: 'Second Spring', open: 122, pos: [0, 14], closed: [2], hours: ['10:00', '17:30'], color: Rr.butter[2], facade: 'tp_shop_thrift', date: 'Year 2 Spring 10',
    stock: ['gift_tp_tea_set', 'gift_tp_vintage_scarf', 'gift_tp_music_tin', 'gift_tp_pocket_watch'], buysAll: true, job: { wage: 235, xp: { charm: 8, crafting: 4 }, role: 'Thrift shop helper' },
    who: { name: 'Oharu', full: 'Oharu Matsuda', age: 72, role: 'Owner of Second Spring', color: '#b88a3a', birthday: { season: 'autumn', day: 17 }, look: { hair: '#e8e0e8', top: '#a86a8a', bottom: '#5a4a5a', skin: '#e8c6a2', eyes: '#4a3a3a', accent: '#f0d070' },
      bio: 'Oharu Matsuda, 72, believes every object has a second life waiting. Her shop is a cheerful maze of tea sets, scarves and stories she can recite from memory.',
      love: ['gift_tea_tin', 'gift_pressed_flower', 'snack_cheesecake'], like: ['gift_postcard', 'ing_honey', 'bev_green_tea', 'gift_music_box'], dislike: ['snack_candy'], hate: ['misc_spoiled_food'],
      lines: { default: L('happy|This teacup belonged to a sea captain. Or a bus driver. Same dignity.', 'Everything here has been loved once. That is the only warranty I offer.', 'happy|Try on the hat. It remembers nice heads.', 'I price by feeling. Do not tell the tax office.', 'A second spring is not a joke, dear. It is a plan.', 'happy|The best finds are never what you came for.', 'That scarf has been to Venice. Or my sister\'s cupboard. Both are exotic.'),
        morning: L('I open the boxes at nine. It is like Christmas for old things.', 'Morning light shows the dust. I call it patina.'), afternoon: L('Afternoon tea and a good rummage. Join me.', 'A customer asked if the clock works. It does. It disagrees with the other clocks.'), evening: L('Closing. The hats go to bed. Please bow to them.', 'I wind the music tin before leaving. Goodnight, little tune.'),
        rain: L('happy|Rain is perfect for browsing. And for losing umbrellas, which I then sell.', 'Wet wool smells like honest weather.'), weekend: L('Weekend rummage! The pocket watches have opinions.'),
        spring: L('Spring clearance of other people\'s attics.'), summer: L('Linen and sunhats. Everything smells of lemons.'), autumn: L('Coats for the cold and cups for the tea. My season.'), winter: L('Wool, tea and a heater that sounds like a cat.'),
        h2: L('happy|You have the eye. You looked at the right cup first. Everyone does, eventually.'), h4: L('happy|Take this. It was my husband\'s. He would have liked you.'), firstMeet: L('happy|Hello, dear! Do not mind the dust. It is vintage.'),
        birthday: L('happy|Seventy-three! I will wear the good scarf. Thank you, dear.'), gift_love: L('happy|You remembered my favourite. Oh, you are a gem.'), gift_like: L('happy|How kind. It goes right here, next to the radio.'), gift_neutral: L('Thank you, dear. I will find it a home.'), gift_dislike: L('sad|Hm. Perhaps a lower shelf.'), gift_hate: L('sad|Oh dear. Oh dear, no.') },
      ev: [{ at: 2, t: [`happy|Misa, sit. This box came in this morning and I want a witness.`, `@Oharu opens an old trunk. Inside are letters tied with blue thread.`], q: ['What do you do?', ['Read one aloud', "happy|A gentle voice. They were love letters. Of course they were.", 25], ['Return them to the family', "happy|That is the better answer. I will find the address.", 25], ['Keep them safe here', "happy|The shop is a good keeper of things.", 15]], end: 'She smiles. "That is why I love this job: nothing really gets lost."' },
        { at: 4, t: [`happy|I am thinking of a swap day. Bring what you do not need, take what you do.`, `Money makes things precious in the wrong way. Swapping keeps it honest.`], q: ['Want me to help?', ['I will make the sign', "happy|A sign! Yes. In your hand. Bubble letters, please.", 25], ['I will bring friends', "happy|Friends are better than stock.", 20], ['I will bring a mystery box', "happy|A mystery box! Now I am excited.", 20]], end: 'She hangs your sign in the window. It is slightly crooked and perfect.' }] } },
  { id: 'bikes', owner: 'tatsu', name: 'Spoke and Sprocket', open: 174, pos: [0, 22], closed: [6], hours: ['9:00', '17:30'], color: Rr.vermilion[2], facade: 'tp_shop_bikes', date: 'Year 2 Autumn 6',
    stock: ['misc_tp_patch_kit', 'misc_tp_chain_oil', 'gift_tp_basket_charm', 'gift_tp_bell_bright', 'gift_bike_bell'], job: { wage: 255, xp: { crafting: 10 }, role: 'Bike mechanic helper' },
    who: { name: 'Tatsu', full: 'Tatsu Nakagawa', age: 45, role: 'Owner of Spoke and Sprocket', color: '#d8602a', birthday: { season: 'spring', day: 25 }, look: { hair: '#2a2a32', top: '#d8602a', bottom: '#3a4a5a', skin: '#d6a07c', eyes: '#2a2a2a', accent: '#f4d06a' },
      bio: 'Tatsu Nakagawa, 45, was a bicycle courier for twelve years before settling down to fix the bay\'s wheels. He hums while he works and laughs at his own jokes first.',
      love: ['gift_bike_bell', 'bev_can_coffee', 'snack_onigiri_salmon'], like: ['bev_green_tea', 'gift_hot_sauce', 'ing_honey'], dislike: ['snack_candy'], hate: ['misc_spoiled_food'],
      lines: { default: L('happy|A bike is a promise to go somewhere. I just keep the promise oiled.', 'Squeak? That is not a sound, that is a cry for help.', 'Ha! Good one. Wait, I did not say anything yet. Ha!', 'happy|Left pedal loose? Always the left. Nobody knows why.', 'You ride, I fix. Nobody falls over. That is the deal.', 'There are three sounds a bike should make: tick, whir and happy.', 'I once delivered a wedding cake across town in eleven minutes. It was a very small cake.'),
        morning: L('Morning! Coffee, grease and a clean bell. In that order.', 'The first customer of the day always has a flat. It is a law.'), afternoon: L('Quiet hour. I true a wheel and hum something off-key.', 'Afternoon rides are the best. Warm tarmac, long shadows.'), evening: L('Closing. The bikes line up like horses in a stable.', 'Hang up your helmet. You have earned a rest, and so has the chain.'),
        rain: L('happy|Rain makes me busier and happier. Mud is just a customer with a story.', 'Wet roads mean squealing brakes. Come see me.'), weekend: L('Weekends are all tyre pumps and families learning to wobble.'),
        spring: L('Spring tune-ups! Everyone remembers their bike at once.'), summer: L('Summer rides, summer flats. Bring water.'), autumn: L('Leaves hide potholes. Watch out for the ones that look like gold.'), winter: L('Winter is for rebuilding. I rebuild one bike a week and name it.'),
        h2: L('happy|You listen to a chain like a doctor. That is a gift.'), h4: L('happy|Picked this up for you. A bell that sounds like a laugh.'), firstMeet: L('happy|Hey! Tatsu. Nice to meet you. You ride? Even badly? Great, I fix those too.'),
        birthday: L('happy|A birthday gift! You are going to make me cry on the new tyres.'), gift_love: L('happy|Wow, that is perfect! You are my favourite customer, and I mean that.'), gift_like: L('happy|Nice! That will go right on the workbench.'), gift_neutral: L('Thanks! I will find a spot. There is always a spot.'), gift_dislike: L('sad|Hmm. I will put it somewhere out of the way.'), gift_hate: L('sad|Please, take it. Away from the bikes.') },
      ev: [{ at: 2, t: [`happy|Misa! Perfect timing. Hold this wheel. Do not let it spin. It will spin.`, `@Tatsu centres a wobbling wheel with a flick of a spoke key.`], q: ['What do you ask him?', ['How do you true a wheel?', "happy|Slowly, with love and a little bad language.", 25], ['Can I try?', "happy|Spoke key in hand. Left a quarter turn. Feel that? That is a wheel getting happy.", 25], ['Why bikes?', "happy|Because they are honest. You push, they go.", 20]], end: 'He tosses you a small spoke key. "Keep it. Everyone should own one."' },
        { at: 4, t: [`happy|I am planning a ride. Sunrise to the lighthouse, kids on little bikes, parents behind with snacks.`, `Call it the Bay Roll. Will you ride?`], q: ['Do you join?', ['Absolutely', "happy|I will mark your tyres with a ribbon so nobody loses you.", 30], ['I will bring snacks', "happy|Food on wheels! Yes!", 25], ['I will wave from the finish line', "happy|The most important job. Cheering is under-rated.", 20]], end: 'He pins a small paper flag to your bag. "Bay Roll. Be there."' }] } },
];
// ---------------------------------------------------------------- build every shop
const mk = (id) => `tp_shop_${id}`;
for (const sh of SHOPS) {
  const w = sh.who, flagk = `tp_shop_${sh.id}_open`;
  const closedStops = [{ at: '00:00', map: null }];
  const stand = [{ at: sh.hours[0].replace(/^(\d):/, '0$1:'), map: 'town', spot: mk(sh.id), dir: 'up' }, { at: sh.hours[1].replace(/^(\d):/, '0$1:'), map: null }];
  npc(sh.owner, {
    name: w.name, role: w.role, color: w.color, bio: w.bio, look: w.look, birthday: w.birthday,
    hint: `${sh.name} opens on ${sh.date}. Open ${sh.hours[0]} to ${sh.hours[1]}, closed one weekday a week.`,
    schedule: [{ when: `!flag:${flagk}`, stops: closedStops }, { when: `day:${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][sh.closed[0]]}`, stops: [{ at: '10:00', map: 'town', spot: 'bench_1' }, { at: '15:00', map: null }] }, { stops: stand }],
    gifts: { love: w.love, like: w.like, dislike: w.dislike, hate: w.hate }, lines: w.lines,
    events: w.ev.map((e) => ({ id: `${sh.owner}_h${e.at}`, hearts: e.at, map: 'town', when: `flag:${flagk}&time>=10:00&time<17:00`,
      script: () => sc(sh.owner, ...open(sh.owner), ...e.t, ch(e.q[0], ...e.q.slice(1)), e.end) })),
  });
  const f = FACADES[sh.facade], d = f.doors[0], tx = sh.pos[0] + Math.floor((d.x + d.w / 2) / 32), ty = sh.pos[1] + f.hT;
  register('shop', mk(sh.id), { name: sh.name, owner: sh.owner, hours: sh.hours, closed: sh.closed, when: `flag:${flagk}`, color: sh.color, buys: sh.buysAll ? ['all'] : [],
    greet: { default: w.lines.default.slice(0, 3), morning: w.lines.morning, rain: w.lines.rain, evening: w.lines.evening }, stock: sh.stock.filter((i) => get('item', i)) });
  JOBS[`tp_${sh.id}`] = { name: sh.name, role: sh.job.role, boss: sh.owner, bossName: w.name, minigame: `job_sv5_${sh.id === 'books' ? 'book' : sh.id === 'bikes' ? 'bike' : sh.id}`, wage: sh.job.wage, energy: 18, xp: sh.job.xp,
    after: ['15:30', '17:30'], free: [sh.hours[0], sh.hours[1].replace(/^(\d+):(\d+)$/, (m, h, mm) => `${h - 1}:${mm}`)], closed: sh.closed, unlock: (g) => !!g.state.flags[flagk], unlockText: `After ${sh.name} opens on ${sh.date}` };
  register('interaction', mk(sh.id), {
    label: (g) => (shopOpen(g, get('shop', mk(sh.id))) ? sh.name : `${sh.name} (closed)`),
    run: (g) => {
      const shop = get('shop', mk(sh.id));
      if (!shopOpen(g, shop)) return g.run([{ t: 'say', who: null, text: `${sh.name} is closed right now. Hours: ${hoursText(shop)}.` }]);
      return g.run([{ t: 'choice', prompt: sh.name, options: [{ text: 'Browse the shop', steps: [{ t: 'call', fn: () => new Promise((res) => g.open('shop', mk(sh.id), res)) }] },
        { text: 'Work a shift', steps: [{ t: 'call', fn: () => startShift(g, `tp_${sh.id}`) }] }, { text: `Chat with ${w.name}`, steps: [{ t: 'call', fn: () => g.talk && g.talk(sh.owner) }] }, { text: 'Leave', steps: [] }] }]);
    },
  });
  const b = building(sh.facade, sh.pos[0], sh.pos[1], { litUntil: 19 * 60, shop: true, obj: { when: `flag:${flagk}` } });
  mapPatch('town', {
    objects: [b.obj, tile(tx, ty - 1, { use: mk(sh.id), when: `flag:${flagk}` }), { ...signpost(tx, ty, `Paper covers the window. A sign says: ${sh.name.toUpperCase()}, opening ${sh.date}. Fresh paint, fresh start!`), when: `!flag:${flagk}` }],
    edit: (o) => (['town_tree_oak@2,15', 'town_tree_oak@43,15', 'town_tree_sakura_s@43,22', 'town_tree_pine_s@1,24'].includes(`${o.spr}@${o.x},${o.y}`) && Math.abs(o.x - sh.pos[0] - 2) < 3 ? { ...o, when: `!flag:${flagk}` } : o),
    spots: { [mk(sh.id)]: [tx, ty] },
  });
}
register('system', 'tp_shops', {
  init(g) {
    const check = () => {
      for (const sh of SHOPS) {
        const k = `tp_shop_${sh.id}_open`; if (g.state.flags[k] || g.day < sh.open) continue;
        g.setFlag(k, true); S(g).shopOpen[sh.id] = g.day;
        mailSafe(g, { id: k, from: sh.owner, text: `${sh.name} is open on the square! Come by for a hello and a small welcome gift. - ${sh.who.full}`, item: sh.stock[0], coins: 0 });
        g.toast(`${sh.name} opens on the town square!`, 'heart'); g.bus.emit('tpShopOpen', { id: sh.id, name: sh.name });
      }
    };
    for (const e of ['dayStart', 'gameStart', 'gameLoaded']) g.bus.on(e, check);
  },
});
export { SHOPS };
void N; void prop; void _f;

features('Town Growth', [
  'Petal and Pot flower shop opens on the town square on Summer 14: a new shopfront, a florist owner, four unique flower gifts and a florist shift',
  'Nook Books bookstore annex opens on Winter 8 with zines, local history, pressed bookmarks, a reading lamp and a shelving shift',
  'Second Spring thrift shop opens in Year 2 (Spring 10) with vintage finds, and buys nearly anything Misa brings; thrift pricing shift',
  'Spoke and Sprocket bike repair shop opens in Year 2 (Autumn 6) with patch kits, chain oil and bike charms; a bike repair shift',
  'Four new shop owners (Fuyuka, Genji, Oharu, Tatsu) with schedules, long line sets for every season, weather and time of day, and favourite gifts',
  'Each shop owner has two heart events: a hands-on scene at 2 hearts and a personal story at 4 hearts with choices',
  'Four new part-time job shifts in the Jobs app, each with its own pick-the-right-answer minigame (bouquets, shelving, pricing, repairs)',
  'Notice signs cover the shopfronts until opening day, and trees that stood on the lots vanish when the shops open',
]);
