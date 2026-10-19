// Activities with the new cast (sv4): the Herald article minigame `sv4_press` (pick headline, photo and angle from clues), the
// relay-start minigame `sv4_track` and the Track Team club (added to school CLUBS), plus one daily offer per character
// (talkHooks at low priority: the first chat of each day can start an activity).
import { register, get, features } from '../../core/registry.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { act } from '../../input.js';
import { rect, disc } from '../../minigames/hobbies/games.js';
import { CLUBS } from '../school/data.js';
import { sc, ch, time, mood } from './util2.js';
import { S, pick } from './data.js';
import { REGULAR, bakeWithMomo } from './bakery.js';

// ------------------------------------------------------------------ the Herald: write an article
const STORIES = [
  { clues: ['The lost umbrella was found on the library roof.', 'A crow was seen carrying a red ribbon.', 'The librarian says the crow visits every rainy day.'], head: ['Crow Steals Umbrella: Mystery Solved', 'Library Closes for Rain', 'Ribbon Prices Soar'], ha: 0, photo: ['A crow on the library roof', 'An empty shelf', 'A red umbrella in a puddle'], pa: 0, angle: ['Funny and warm', 'Angry and loud', 'Dry and technical'], aa: 0 },
  { clues: ['The fountain has run blue since Monday.', 'Hina was seen near the pond with a bucket.', 'The dye is harmless, the label says.'], head: ['Fountain Turns Blue: Nature Club Denies Everything', 'Town Water Unsafe', 'Fountain Closed For Good'], ha: 0, photo: ['The blue fountain at noon', 'A bucket by the pond', 'A sleeping cat'], pa: 0, angle: ['Playful mystery', 'Panic', 'Silence'], aa: 0 },
  { clues: ['Track team sets a new school record.', 'The new runner trains at dawn on the park bridge.', 'She says the secret is breakfast chips.'], head: ['Dawn Runner Smashes Record', 'Chips Banned at School', 'Bridge Needs Repairs'], ha: 0, photo: ['A runner mid-stride', 'A bag of chips', 'The park bridge at night'], pa: 0, angle: ['Proud and short', 'Gossipy', 'Sarcastic'], aa: 0 },
  { clues: ['The new bakery sold out of melon pan by nine.', 'Cafe Kumo put out a sign for fresh scones.', 'Both owners deny a rivalry, loudly.'], head: ['Bun Versus Scone: The Shotengai Showdown', 'Bakery Closes Early', 'Flour Shortage Hits Town'], ha: 0, photo: ['Two shop signs side by side', 'An empty tray', 'A sack of flour'], pa: 0, angle: ['Friendly rivalry', 'Scandal', 'Recipe leak'], aa: 0 },
  { clues: ['An old radio in the clock shop picks up one station.', 'A voice reads weather for a town nobody knows.', 'Tobias says the radio was never connected.'], head: ['The Radio That Listens Back', 'Clock Shop Loses Power', 'Weather Forecast Wrong Again'], ha: 0, photo: ['The glowing radio dial', 'A stopped clock', 'A grey sky'], pa: 0, angle: ['Spooky but cosy', 'Cheerful ad', 'Angry letter'], aa: 0 },
  { clues: ['A travelling photographer is staying at Sunny Pines.', 'She asked for a photo of the harbour at dawn.', 'Locals say the fog this week is the best in years.'], head: ['Fog Chasers: A Photographer Visits the Bay', 'Harbour Closed By Fog', 'Tourist Complains'], ha: 0, photo: ['The harbour dock in fog', 'A parked bicycle', 'A close-up of a boot'], pa: 0, angle: ['Warm profile', 'Complaint', 'Listicle'], aa: 0 },
];
const PW = ['HEADLINE', 'PHOTO', 'ANGLE'];
class PressGame {
  constructor(rng) {
    this.rng = rng; this.title = 'The Herald'; this.story = STORIES[Math.floor(rng() * STORIES.length)];
    // shuffle each option list; keep track of where the right answer went
    this.opts = []; this.ans = [];
    for (const [k, a] of [['head', 'ha'], ['photo', 'pa'], ['angle', 'aa']]) {
      const list = this.story[k].map((t, i) => ({ t, ok: i === this.story[a] })), r = Math.floor(rng() * 3);
      const rot = list.map((_, i) => list[(i + r) % 3]); this.opts.push(rot); this.ans.push(rot.findIndex((o) => o.ok));
    }
    this.step = 0; this.sel = 0; this.picks = []; this.done = false; this.score = 0; this.t = 0; this.flash = 0;
  }
  choose(i) { this.sel = i; }
  confirm() {
    this.picks.push(this.sel); this.flash = 0.2; this.step++; this.sel = 0;
    if (this.step >= 3) { const n = this.picks.filter((p, i) => p === this.ans[i]).length; this.score = n / 3; this.done = true; this.result = { text: `${n} of 3 choices were spot on.` }; }
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const k = input.pressed;
    if (k.has('arrowright') || k.has('d') || k.has('arrowdown')) this.sel = (this.sel + 1) % 3;
    if (k.has('arrowleft') || k.has('a') || k.has('arrowup')) this.sel = (this.sel + 2) % 3;
    for (const n of ['1', '2', '3']) if (k.has(n)) this.sel = +n - 1;
    if (input.justDown) for (let i = 0; i < 3; i++) if (input.mx >= 12 && input.mx < 308 && input.my >= 112 + i * 30 && input.my < 138 + i * 30) { this.sel = i; this.confirm(); return; }
    if (act(input)) this.confirm();
  }
  draw(g) {
    rect(g, Rr.paper[3], 0, 0, 320, 224); rect(g, '#2b1d2e', 0, 0, 320, 18); drawText(g, `THE HOSHIMORI HERALD: ${PW[Math.min(this.step, 2)]}`, 8, 7, Rr.butter[3], 1, null);
    this.story.clues.forEach((c, i) => { rect(g, i % 2 ? Rr.butter[3] : Rr.sakura[3], 10, 24 + i * 22, 300, 19); rect(g, Rr.ink[3], 10, 42 + i * 22, 300, 1); drawText(g, c.toUpperCase().slice(0, 48), 14, 30 + i * 22, Rr.ink[1], 1, null); });
    if (!this.done) {
      drawText(g, `PICK THE BEST ${PW[this.step]}`, 12, 98, Rr.coral[1], 1, null);
      this.opts[this.step].forEach((o, i) => { const on = i === this.sel; rect(g, on ? Rr.butter[2] : Rr.paper[2], 12, 112 + i * 30, 296, 26); rect(g, Rr.ink[2], 12, 112 + i * 30, 296, 1); drawText(g, `${i + 1}  ${o.t.toUpperCase().slice(0, 44)}`, 18, 122 + i * 30, Rr.ink[1], 1, null); });
      drawTextC(g, 'ARROWS + SPACE, KEYS 1-3, OR CLICK', 160, 212, Rr.ink[2], 1, null);
    }
    if (this.flash > 0) rect(g, '#ffffff40', 0, 0, 320, 224);
  }
}
register('minigame', 'sv4_press', {
  title: 'Write for the Herald', resultTitle: 'GO TO PRESS!', make: (g) => new PressGame(g.rng),
  bot(m, t, inp) { if (m.done) return inp; if (m.sel !== m.ans[m.step]) inp.pressed = new Set(['arrowright']); else if (Math.floor(t * 60) % 3 === 0) inp.pressed = new Set([' ']); return inp; },
});

// ------------------------------------------------------------------ the relay start (Track Team club game)
class TrackGame {
  constructor(rng, o = {}) {
    this.rng = rng; this.title = 'Track'; this.t = 0; this.n = o.casual ? 6 : 8; this.at = Array.from({ length: this.n }, (_, i) => 1.6 + i * 0.85 + rng() * 0.2);
    this.res = this.at.map(() => null); this.presses = []; this.jump = 0; this.done = false; this.score = 0; this.msg = ''; this.msgT = 0;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.jump = Math.max(0, this.jump - dt); this.msgT = Math.max(0, this.msgT - dt);
    if (act(input)) { this.presses.push(this.t); this.jump = 0.35; }
    this.at.forEach((a, i) => {
      if (this.res[i] === null && this.t > a + 0.2) { const ok = this.presses.some((p) => Math.abs(p - (a - 0.05)) < 0.18); this.res[i] = ok ? 1 : 0; this.msg = ok ? 'CLEAN!' : 'CLIPPED IT'; this.msgT = 0.6; }
    });
    if (this.res.every((r) => r !== null) && this.msgT <= 0) { this.score = this.res.reduce((a, b) => a + b, 0) / this.n; this.done = true; this.result = { text: `${this.res.filter(Boolean).length} of ${this.n} hurdles cleared.` }; }
  }
  draw(g) {
    rect(g, Rr.sky[3], 0, 0, 320, 224); rect(g, Rr.coral[1], 0, 140, 320, 84); for (let i = 0; i < 6; i++) rect(g, '#ffffff90', 0, 150 + i * 14, 320, 1);
    drawText(g, 'RELAY START: SPACE TO JUMP', 8, 6, Rr.ink[1], 1, null);
    const jy = this.jump > 0 ? Math.sin((1 - this.jump / 0.35) * Math.PI) * 26 : 0;
    rect(g, Rr.sky[1], 56, 118 - jy, 12, 20); disc(g, '#f4d2b4', 62, 112 - jy, 5); rect(g, Rr.ink[2], 56, 108 - jy, 12, 3);
    this.at.forEach((a, i) => { const x = 62 + (a - this.t) * 140; if (x < -10 || x > 330) return; rect(g, this.res[i] === 0 ? Rr.ink[3] : Rr.paper[4], x, 124, 3, 14); rect(g, Rr.coral[2], x - 4, 124, 11, 2); });
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 70, Rr.butter[3], 2, '#2b1d2e');
    void measure;
  }
}
register('minigame', 'sv4_track', {
  title: 'Relay start', resultTitle: 'FINISH LINE!', make: (g, o) => new TrackGame(g.rng, o || {}),
  bot(m, t, inp) { if (m.at.some((a, i) => m.res[i] === null && Math.abs(m.t - (a - 0.05)) < 0.015)) inp.pressed = new Set([' ']); return inp; },
});
if (!CLUBS.track) CLUBS.track = { name: 'Track Team', days: [1, 3], game: 'sv4_track', member: 'aoi', skill: 'charm', room: 'track', when: 'flag:nc_enrolled', blurb: 'Sprints, hurdles and relay starts with Aoi.' };

// ------------------------------------------------------------------ daily offers
const offerFlag = (id) => `nc_offer_${id}`;
const offerDone = (g, id) => g.setFlag(offerFlag(id), g.day);
const fresh = (g, id) => g.state.flags[offerFlag(id)] !== g.day;
const call = (fn) => ({ t: 'call', fn });
const POSTCARD_MSGS = ['The sea here is real. I touched it. It was cold.', 'There is a girl who saves me a seat at lunch.', 'I am fine, truly. Please send chips.'];
const RIDDLES = [
  ['What has keys but opens no locks?', ['A piano', 'A map', 'A clock'], 0], ['What gets wetter the more it dries?', ['A sponge', 'A towel', 'A fish'], 1],
  ['What has a face and two hands but no arms?', ['A clock', 'A scarecrow', 'A coin'], 0], ['What can you catch but never throw?', ['A bus', 'A cold', 'A ball'], 1],
  ['What runs but never walks and has a bed but never sleeps?', ['A river', 'A train', 'A cat'], 0], ['The more you take, the more you leave behind. What am I?', ['Footsteps', 'Photos', 'Breaths'], 0],
];
const TIPS = ['Light does the work: stand with the sun at your shoulder for a clear shot.', 'Put the subject off centre, on a thirds point. Centre is for passport photos.', 'Hold your breath at the shutter. Then breathe out slowly.', 'Shoot twice: once for the pretty one, once for the true one.', 'Sunrise and golden hour are free gifts. Lamps want the dark.', 'Look behind you. Half the best shots are over your shoulder.'];
const TOWNS = ['Kumori, where it rains every afternoon at three and the umbrellas are bread-coloured.', 'Yoru-no-Minato, a night port with two hundred lantern boats.', 'Himawari-eki, one platform, one bench and a stationmaster who waves at shadows.', 'Hanabi-dani, a valley that holds one firework festival a year and talks about it for eleven months.', 'Tsuki-yu, a hot spring town where the monkeys have a better bath than you.', 'Ame-no-Hashi, a bridge town that is wetter than the river under it.'];

function hook(id, when, steps) { register('talkHook', `nc_offer_${id}`, { npc: id, priority: 20, when: (g) => fresh(g, id) && when(g), steps }); }
hook('aoi', (g) => g.hearts('aoi') >= 3 && g.energy >= 12, () => sc('aoi', call((g) => offerDone(g, 'aoi')), 'happy|Hey. Do you want to do something? I have a few ideas.',
  ch('What do you do with Aoi?',
    ['Go for a run together', call(async (g) => { const r = await g.minigame('sv4_track', { casual: true }); if (r && r.quit) return; g.useEnergy(8); g.advance(40); g.addXP('charm', 3); g.addFriend('aoi', 5 + ((r && r.stars) || 1) * 2); g.stat('runsWithAoi'); S(g).track.n++; }), 'happy|That felt good. Same time tomorrow?'],
    ['Cooking lesson (rice balls)', { when: 'friend:aoi>=4' }, call(async (g) => { const r = await g.minigame('sv4_bake', { recipe: 'snack_onigiri_salmon', name: 'Rice ball', steps: ['chop', 'stir'] }); if (r && r.quit) return; g.useEnergy(6); g.advance(45); g.addXP('cooking', 5); g.addFriend('aoi', 6); const n = (r && r.stars) || 1; g.give('dish_onigiri', n); if (n >= 2) g.setFlag('nc_aoi_rice_taught', true); g.stat('aoiCookingLessons'); }), 'happy|It was only a little crunchy this time. Progress!'],
    ['Write postcards', call((g) => g.run(sc('aoi', ch('What should the card say?', ...POSTCARD_MSGS.map((m) => [m, call((gg) => { S(gg).postcards++; gg.addFriend('aoi', 6); gg.state.social.queue.push({ day: gg.day + 3, id: `nc_yuki_${gg.day}`, from: 'aoi', text: `A reply for Aoi from her friend Yuki arrived, and Aoi passed it on: '${pick(gg.rngFor('yuki'), ['Tell Misa thank you for looking after you.', 'We are coming to see the sea in summer!', 'Your handwriting got worse. Come visit.'])}'`, coins: 20 }); }), 'happy|Posted. Pip will stamp it straight, I hope.'])))))],
    ['Maybe later', 'neutral|Okay. No pressure.'])));
hook('haru', (g) => g.hearts('haru') >= 2, () => sc('haru', call((g) => offerDone(g, 'haru')), 'happy|Stop right there. I have two things and one of them is a scoop.',
  ch('What do you do with Haru?',
    ['Write an article for the Herald', call(async (g) => { const r = await g.minigame('sv4_press'); if (r && r.quit) return; const p = S(g).press; p.n++; p.best = Math.max(p.best, Math.round(((r && r.score) || 0) * 3)); g.advance(40); g.addXP('study', 4); g.addFriend('haru', 4 + Math.round(((r && r.score) || 0) * 6)); g.stat('articlesWritten'); if (p.n % 3 === 0) { p.issues.push(g.day); g.addMoney(60); g.toast('Herald issue printed: readers chipped in 60 coins', 'i_mail'); } }), 'happy|That one goes on the front page. Maybe the back. Definitely a page.'],
    ['Solve a riddle', call((g) => { const [q, opts, a] = pick(g.rngFor('riddle'), RIDDLES); return g.run(sc('haru', `happy|${q}`, ch('Your answer?', ...opts.map((o, i) => [o, ...(i === a ? [call((gg) => { S(gg).riddles++; gg.addMoney(30); gg.addFriend('haru', 8); }), 'surprised|Correct! I accept payment in puns. Here are thirty coins instead.'] : [call((gg) => gg.addFriend('haru', 2)), 'happy|Not quite! But a good guess. Honorable mention.'])])))); })],
    ['Maybe later', 'neutral|Deadline waits for no one. Except me.'])));
hook('sora', (g) => g.state.sv4nc && g.check('ncsora') && g.hearts('sora') >= 1, () => sc('sora', call((g) => offerDone(g, 'sora')), 'happy|Got a minute? I am in a teaching mood.',
  ch('What do you ask Sora?',
    ['A photography tip', call((g) => { S(g).lessons++; g.addXP('crafting', 4); g.addFriend('sora', 4); return g.run(sc('sora', `happy|${pick(g.rngFor('tip'), TIPS)}`)); })],
    ['A story about another town', call((g) => { g.addMood(5); g.addFriend('sora', 3); return g.run(sc('sora', `happy|${pick(g.rngFor('town'), TOWNS)}`, 'Ask me again tomorrow. I have fifty-three of these.')); })],
    ['Maybe later', 'neutral|Light waits for nobody. Neither do I.'])));
hook('momo', (g) => g.hearts('momo') >= 2 && !!g.state.flags.nc_bakery_open && g.check('map:shotengai'), () => sc('momo', call((g) => offerDone(g, 'momo')), 'happy|Sweetie! Hands out. I have a sample tray and a free apron.',
  ch("What do you do at Momo's?",
    ['Take a free sample', call((g) => { const id = pick(g.rngFor('sample'), REGULAR); g.give(id, 1); g.addFriend('momo', g.hearts('momo') >= 4 ? 3 : 1); return g.run(sc('momo', `happy|One ${get('item', id).name}, still warm. Do not tell the accountant.`)); })],
    ['Bake a batch together', call((g) => bakeWithMomo(g))],
    ['Maybe later', 'neutral|The bread will wait. It always does. Slightly staler.'])));

void time; void mood;
features('New Cast', [
  'Newspaper club with Haru: once a day he offers to let Misa write an article for the Hoshimori Herald',
  'Write an article minigame: read three clues, then pick the best headline, photo and angle (one point for each right choice)',
  'Every third article prints a Herald issue and the readers chip in 60 coins',
  "Haru's riddle of the day: a six-riddle pool with coins and friendship for the right answer",
  'The Track Team joins the school clubs list (Tuesday and Thursday) once Aoi has arrived, with Aoi as the club lead',
  "Relay start minigame: jump the hurdles on the beat; used by the club and by Aoi's casual runs",
  'Run with Aoi: once a day at 3 hearts she offers a short sprint session that builds charm and friendship',
  "Cooking lesson with Aoi at 4 hearts: rice balls with the bake minigame, and a good result teaches her to cook (her later dialogue changes)",
  'Postcards with Aoi: pick a message to send her old friends, and a reply from Yuki arrives three days later with a few coins',
  "Sora's photography tips: six lessons that give crafting experience and friendship",
  "Sora's stories of other towns: six tales told once a day to anyone she is at ease with",
  'Momo hands out a free sample tray once a day and offers to bake with Misa at the shotengai',
]);
