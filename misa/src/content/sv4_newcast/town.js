// Town side of the new cast (sv4): enrolment of Aoi and Haru on Spring 5 with the classroom intro scene, their extra desks,
// Sora's seasonal stays, 2-heart welcome gifts, Haru's speed-reading perk, birthday parties (via sv3_hearts when it can host them)
// and the Bay Chatter gossip channel (three items per new character).
import { register, get, features } from '../../core/registry.js';
import { OVERRIDES } from '../social/util.js';
import * as groups from '../sv3_hearts/groups.js';
import { TV_CHANNELS } from '../ui/tv.js';
import { rect, drawText, drawTextC } from '../../ui/ui.js';
import { dateOf, seasonOf } from '../../core/time.js';
import { sc, ch, time, mood, queueMailSafe } from './util2.js';
import { S, NEW_IDS, soraHereOn } from './data.js';

// ------------------------------------------------------------------ the classroom: two extra desks behind Misa
const room = get('map', 'classroom');
if (room) {
  const desk = (x, y) => [{ spr: 'int_school_chair', x, y: y + 1, solid: false, flat: true, dx: 6 }, { spr: 'int_school_desk', x, y, dx: 2, shadow: 12 }];
  if (Array.isArray(room.objects)) room.objects.push(...desk(17, 8), ...desk(17, 5));
  room.spots.desk_aoi = [17, 9, 'up']; room.spots.desk_haru = [17, 6, 'up'];
}

// ------------------------------------------------------------------ enrolment and the intro scene
register('script', 'nc_intro', { steps: () => sc('fujita',
  { t: 'call', fn: (g) => { g.setFlag('nc_intro_done', true); S(g).intro = g.day; } },
  'happy|Settle down, everyone. We have two new students joining 2-B today. Be kind, be curious and please do not ask them about the weather.',
  'aoi/neutral|I am Aoi Shirakawa. I moved from the city. I like running, and... snacks. Please take care of me.',
  'haru/happy|Haru Minami. I edit the school newspaper, which has one issue and one reader. The reader is me. I am hoping to double the readership today.',
  'fujita/happy|Aoi, your seat is the empty desk behind Misa. Haru, the one by the window next to it. Misa, could you show them the lockers at lunch?',
  ch('How do you greet them?',
    ['Wave at Aoi, then Haru', 'aoi/happy|Hi. Thank you. I will remember that wave.', 'haru/happy|Wave received. Filed under: kind.', { t: 'friend', npc: 'aoi', n: 15 }, { t: 'friend', npc: 'haru', n: 15 }],
    ['Offer Aoi a snack and Haru a pen', 'aoi/surprised|A snack! On the first day! I think we will get along.', 'haru/happy|A pen. A good pen! That is a gift and a plot point.', { t: 'friend', npc: 'aoi', n: 25 }, { t: 'friend', npc: 'haru', n: 15 }],
    ['Whisper that the lockers are easy to find', 'haru/happy|Whispers are my favourite genre.', 'aoi/neutral|Thanks. Quietly appreciated.', { t: 'friend', npc: 'aoi', n: 10 }, { t: 'friend', npc: 'haru', n: 25 }]),
  '@Two new desks at the back of the room fill with new bags. The class feels a little bigger.', mood(6)) });
register('system', 'nc_cast', {
  init(game) {
    const enrol = () => {
      if (game.state.flags.nc_enrolled || game.day < 5) return;
      game.setFlag('nc_enrolled', true); game.setFlag('nc_track_open', true);
      if (game.day > 8) game.setFlag('nc_intro_done', true);
      else game.toast('Two transfer students join class 2-B!', 'i_star');
    };
    const intro = () => {
      const w = game.world;
      if (!w || !w.map || w.map.id !== 'classroom' || !game.state.flags.nc_enrolled || game.state.flags.nc_intro_done || !game.check('school') || game.minutes > 15 * 60) return;
      game.setFlag('nc_intro_done', true);
      setTimeout(() => game.run(get('script', 'nc_intro').steps(game)), 800);
    };
    game.bus.on('dayStart', enrol); game.bus.on('gameStart', enrol); game.bus.on('gameLoaded', enrol); game.bus.on('mapEnter', intro);
    // 2-heart welcome gifts (from each perks[2]) and Haru's speed-reading
    game.bus.on('heartUp', ({ npc, hearts }) => {
      if (!NEW_IDS.includes(npc) || hearts < 2 || game.state.flags[`nc_perk2_${npc}`]) return;
      game.setFlag(`nc_perk2_${npc}`, true);
      const p = get('npc', npc).perks[2]; queueMailSafe(game, { id: `nc_perk2_${npc}`, from: npc, text: p.text, item: p.item, coins: p.coins });
    });
    game.bus.on('dayStart', () => { if (game.state.flags.nc_haru_speedread) { game.addXP('study', 3); } });
    // Sora arrives on the 3rd and leaves on the 23rd of every season
    game.bus.on('dayStart', () => {
      const d = dateOf(game.day), se = seasonOf(game.day);
      if (d === 3 && game.day > 3) { S(game).sora.arrivals++; game.mail(`nc_sora_in_${game.day}`, 'Sora', `I'm back at Sunny Pines for the ${se} light. Find me at the harbour at dawn. Bring a coat and a good eye.`); }
      if (d === 23 && game.state.flags.nc_sora_seen) game.mail(`nc_sora_out_${game.day}`, 'Sora', `Packed up and gone, but the ${se} light is in my bag. A postcard from the road is on its way. See you next season.`);
    });
    game.bus.on('talk', (e) => { if (e.npc === 'sora') game.setFlag('nc_sora_seen', true); });
  },
});

// ------------------------------------------------------------------ birthday parties for the new four (borrowing the sv3 party scene)
const yr = (g) => Math.floor((g.day - 1) / 112);
const bdayHost = (g) => NEW_IDS.find((id) => { const b = get('npc', id).birthday; return b && b.season === seasonOf(g.day) && b.day === dateOf(g.day) && g.hearts(id) >= 4 && !g.state.flags[`nc_party_${id}_${yr(g)}`] && g.minutes >= 17 * 60 && g.minutes <= 21.5 * 60; });
OVERRIDES.push((game, id) => { const h = bdayHost(game); if (!h || h !== id || id === 'sora' && !soraHereOn(game.day)) return undefined; return { map: 'cafe', spot: 'table_2', key: 'ncparty' }; });
register('system', 'nc_party', {
  init(game) {
    const tryRun = () => {
      const w = game.world; if (!w || !w.map || w.map.id !== 'cafe' || w.busy || !groups.partySteps) return;
      const h = bdayHost(game); if (!h) return;
      game.setFlag(`nc_party_${h}_${yr(game)}`, true);
      game.run(groups.partySteps(game, h));
    };
    game.bus.on('mapEnter', () => setTimeout(tryRun, 1200)); game.bus.on('hour', tryRun);
    game.bus.on('dayStart', () => { const b = NEW_IDS.find((id) => { const d = get('npc', id).birthday; return d.season === seasonOf(game.day) && d.day === dateOf(game.day) && game.hearts(id) >= 4; }); if (b) game.toast(`${get('npc', b).name}'s birthday party tonight at Cafe Kumo!`, 'heart'); });
  },
});

// ------------------------------------------------------------------ gossip: three items per new character
export const GOSSIP = {
  aoi: ['They say the new girl runs the park bridge at seven every morning and has never once been late for class.', 'Sachiko swears the barbecue chips sell out the minute school lets out. Somebody has a favourite.', 'Pip says the new girl buys a postcard every Saturday and picks the stamp like a jeweller.'],
  haru: ['A tiny newspaper called the Herald appeared on the notice board. Nobody knows who writes it. Everybody knows who writes it.', 'The clock shop radio is playing a station nobody can find on the dial. A certain student is suspiciously happy about it.', 'Ms. Ito the librarian winked at a transfer student near shelf 3-B. Nobody knows what that means.'],
  sora: ['A photographer at Sunny Pines has been spotted on the harbour dock at five in the morning. With a sock on her tripod.', 'Hana says the lodger at the pines eats the crispy bits first and tells wonderful stories about other towns.', 'Kiko says the traveller with the old camera took her shoes off at the torii without being asked. Respect.'],
  momo: ['Cafe Kumo put out a sign for fresh scones the very day the new bakery opened. Coincidence, says Mika. Loudly.', 'The bakery smells so good that two commuters missed their bus this week. Nobody regrets it.', 'Momo and Mika were seen sharing an umbrella on Friday. Both deny it. The umbrella has not commented.'],
};
const ALL = NEW_IDS.flatMap((id) => GOSSIP[id].map((t) => ({ id, t })));
TV_CHANNELS.push({ id: 'nc_chatter', name: 'Bay Chatter', blurb: 'Gossip about the newcomers, a new item every day.', when: (g) => !!g.state.flags.nc_enrolled,
  draw(g, t, x, y, w, h) { rect(g, '#f4e6c8', x, y, w, h); rect(g, '#a8586a', x + 6, y + 6, w - 12, 14); drawTextC(g, 'BAY CHATTER', x + w / 2, y + 10, '#f4e6c8', 1, null); for (let i = 0; i < 6; i++) rect(g, '#c8b898', x + 8, y + 30 + i * 9, i % 2 ? 100 : 150, 3); drawText(g, '', x, y, '#000', 1, null); },
  watch(game) { const item = ALL[game.day % ALL.length]; S(game).gossip[item.id] = (S(game).gossip[item.id] || 0) + 1; game.addXP('charm', 2); return `Bay Chatter: ${item.t}`; } });

features('New Cast', [
  'Aoi Shirakawa and Haru Minami transfer into class 2-B on Spring 5 with an intro scene in the classroom where Misa greets them (they simply exist if the game is already later)',
  'Aoi and Haru get their own desks at the back of the classroom, right behind Misa, and sit there on school days',
  'Aoi Shirakawa: shy sprinter from the big city with a full social profile, schedule, 50 voiced lines, gifts, texts and a hangout style',
  'Haru Minami: pun-loving newspaper editor with a full social profile, schedule, 50 voiced lines, gifts, texts and a hangout style',
  'Sora Nakajima: a travelling photographer with a full social profile who stays at Sunny Pines from the 3rd to the 22nd of every season',
  'Momo Ishikawa: the baker with a full social profile, closed Wednesdays, who visits Cafe Kumo on Fridays to check on the competition',
  'Aoi has six heart scenes: the stopwatch at the track, the snack run and the clock, forty postcards, the sea (summer), the relay and the shrine at dusk',
  'Haru has six heart scenes: Issue Zero, the secret radio, the archive riddle, the Herald budget fight, the culture festival mascot (autumn) and the roof at dusk',
  'Sora has six heart scenes: the first lesson at the fountain, dawn on the beach, dinner stories at Sunny Pines, her grandmother\'s camera, a snow shoot (winter) and the Cafe Kumo exhibition',
  'Momo has six heart scenes: opening week rush, the cream bun against the scone, her grandmother\'s recipe tin, the storm night starter, the sakura anpan (spring) and the Misa-pan',
  'Every new heart scene has choices that set flags and change what the character says afterwards, and a thank-you note arrives by mail',
  'Welcome gifts at 2 hearts (a bag of chips, a pudding, a postcard, a box of cookies) arrive by mail with the phone number',
  'Four-heart gifts and six-heart parcels from each of the new four, and an eight-heart lasting perk each: a faster stride, Haru\'s speed-reading study boost, Sora\'s eye for composition and Momo\'s dough secrets',
  'Birthday parties at Cafe Kumo for Aoi (Autumn 9), Haru (Winter 3), Sora (Summer 12, in town) and Momo (Winter 9) at 4 hearts, using the party scene',
  'All four can be invited to hang out in the Contacts app (Sora only while she is in town); each has place lines and favourite spots',
  'Bay Chatter TV channel: a new piece of town gossip every day once the new students arrive',
  'Town gossip about Aoi: three items on dawn runs, barbecue chips and postcards',
  'Town gossip about Haru: three items on the Herald, the radio station nobody finds and a librarian\'s wink',
  'Town gossip about Sora: three items on the sock tripod, crispy bits at Sunny Pines and respectful shoes at the torii',
  'Town gossip about Momo: three items on the scone sign, missed buses and a shared umbrella',
  'Sora mails Misa when she is back for the season and again when she leaves',
]);
