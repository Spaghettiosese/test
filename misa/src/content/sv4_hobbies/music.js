// Music: recorder (from school), guitar (from Theo), keyboard (music room); eight practice songs on a rhythm minigame, busking in
// the town square, a band with Theo / Suzu / Kai, the school-festival gig, albums to record and a player that plays your songs.
// Try it: __misa.warp('school_halls', 12, 3, 'up') (keyboard), __misa.warp('town', 26, 20, 'up') (busking mat).
import { register, get, features } from '../../core/registry.js';
import { yearOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawText, drawTextC } from '../../font.js';
import { rect, panel, C } from '../economy/gfx.js';
import { S, clamp, item, gain, addRibbon, later, say, N, call, giveOr, idle, nameOf, addObjects, stat, buffLevel } from './state.js';
import { SONGS, songById, trackOf } from '../../minigames/sv4_hobbies/songs.js';
import '../../minigames/sv4_hobbies/rhythm.js';
import { hasBuff } from '../economy/core.js';

export const INST = { recorder: { name: 'Recorder', mult: 1 }, guitar: { name: 'Guitar', mult: 1.15 }, keyboard: { name: 'Keyboard', mult: 1.3 } };
item('sv4h_recorder', 'Recorder', 'tool', 40, 'tool', K.paper[4], 'The school recorder, a bit chewed at the mouthpiece. Use it to practise a song anywhere.', { tags: ['tool', 'instrument'], useLabel: 'Play', use: (g) => { later(g, (gg) => practice(gg, 'recorder'), 'Close the bag to start playing.'); return true; } });
item('sv4h_guitar', 'Acoustic guitar', 'tool', 160, 'tool', K.wood[3], 'A well-loved guitar Theo passed on. Use it to practise a song anywhere.', { c2: K.sand[3], tags: ['tool', 'instrument'], useLabel: 'Play', use: (g) => { later(g, (gg) => practice(gg, 'guitar'), 'Close the bag to start playing.'); return true; } });
export const ALBUMS = [
  { id: 'bay', name: 'Bay Breeze', songs: ['twinkle', 'sakura', 'tide'], min: 0.55, fee: 120, price: 160, c: K.sky[3] },
  { id: 'lantern', name: 'Lantern Nights', songs: ['lantern', 'harbour', 'moonlit'], min: 0.6, fee: 200, price: 260, c: K.butter[3] },
  { id: 'fever', name: 'Festival Fever', songs: ['matsuri', 'finale', 'harbour'], min: 0.65, fee: 280, price: 340, c: K.coral[2] },
  { id: 'best', name: 'Best of Misa', songs: SONGS.map((s) => s.id), min: 0.7, fee: 500, price: 650, c: K.lilac[3] },
];
for (const a of ALBUMS) item('sv4h_cd_' + a.id, `CD: ${a.name}`, 'gift', a.price, 'paper', a.c, `Your own album, "${a.name}". Use it to play it; the stationery stall pays well for CDs.`, { c2: K.paper[4], tags: ['music', 'album'], useLabel: 'Play', use: (g) => { g.open('sv4h_player'); return true; } });
for (const s of SONGS) register('track', 'sv4h_trk_' + s.id, trackOf(s));

// ---------------------------------------------------------------- songs and playing
export const best = (g, id) => (S(g).music.songs[id] || {}).best || 0;
export const unlocked = (g, i) => i === 0 || best(g, SONGS[i - 1].id) >= 0.55 || g.skillLevel('music') >= i;
export const instruments = (g, atKeyboard) => Object.keys(INST).filter((k) => (k === 'keyboard' ? atKeyboard && S(g).music.inst.keyboard : S(g).music.inst[k] || (k === 'recorder' && g.has('sv4h_recorder')) || (k === 'guitar' && g.has('sv4h_guitar'))));
export const bandMult = (g) => 1 + 0.06 * S(g).music.band.members.length;
export function recordSong(g, id, res, extra = {}) {
  const m = S(g).music, rec = (m.songs[id] ||= { best: 0, plays: 0, combo: 0 }), idx = SONGS.findIndex((s) => s.id === id), acc = res.acc;
  const first = rec.best < 0.55 && acc >= 0.55;
  rec.plays++; rec.best = Math.max(rec.best, Math.round(acc * 100) / 100); rec.combo = Math.max(rec.combo, res.combo || 0); m.plays++;
  const xp = gain(g, 'music', 8 + acc * 18 + idx * 2 + (extra.busk ? 6 : 0) + (first ? 10 : 0));
  g.stat('songsPlayed'); g.addMood(3 + Math.round(acc * 3)); g.advance(extra.busk ? 30 : 25);
  g.bus.emit('songPlayed', { song: id, acc, busk: !!extra.busk });
  if (first && idx < SONGS.length - 1) g.toast(`Unlocked: ${SONGS[idx + 1].name}`, 'i_music');
  return { xp, first };
}
async function perform(g, id, inst, { busk = false, crowd = 0, band = false } = {}) {
  const mult = INST[inst].mult * (band ? bandMult(g) : 1) * (hasBuff(g, 'sv4h_steady') ? 1.1 : 1) * (1 + g.skillLevel('music') * 0.02);
  const r = await g.minigame('sv4h_rhythm', { song: id, mult, crowd, noResult: true });
  if (!r || r.quit || !r.data) return null;
  const rs = recordSong(g, id, r.data, { busk });
  return { ...r.data, ...rs };
}
const grade = (a) => (a >= 0.9 ? 'Flawless!' : a >= 0.75 ? 'Lovely!' : a >= 0.55 ? 'Pretty good!' : 'Keep practising!');
export function songChoice(g, inst, then) {
  return [{ t: 'choice', prompt: `Which song? (${INST[inst].name})`, options: [...SONGS.map((s, i) => ({ text: `${s.name}${best(g, s.id) ? '  ' + Math.round(best(g, s.id) * 100) + '%' : ''}${unlocked(g, i) ? '' : '  (locked)'}`, steps: [call((gg) => (unlocked(gg, i) ? then(gg, s.id) : gg.run([N('Play the song before it to a 55% score, or reach a higher Music level, to unlock this one.')])))] })), { text: 'Never mind', steps: [] }] }];
}
export function practice(g, inst, atKeyboard = false) {
  if (!idle(g)) return;
  const have = instruments(g, atKeyboard);
  const go = (gg, id) => perform(gg, id, inst).then((r) => r && gg.run([N(`${grade(r.acc)} ${r.perfect} perfect, ${r.good} good, ${r.miss} missed. +${r.xp} Music XP.`)]));
  if (!have.includes(inst)) return g.toast('You need that instrument.');
  return g.run(songChoice(g, inst, go));
}

// ---------------------------------------------------------------- busking
const reactions = [[0.9, 'The crowd goes wild and someone whistles!'], [0.7, 'People stop to listen and clap along.'], [0.5, 'A few passers-by nod and smile.'], [0, 'A kid covers their ears. Practise more!']];
export function buskCrowd(g, near) {
  const h = g.minutes / 60, peak = (h >= 11 && h < 14) || (h >= 16 && h < 19) ? 3 : h >= 9 && h < 21 ? 1 : -2;
  const wx = g.weather === 'rain' ? -3 : g.weather === 'storm' ? -9 : 0;
  return clamp(Math.round(2 + near * 1.5 + peak + (g.isWeekend ? 2 : 0) + wx + g.skillLevel('music') * 0.4), 0, 12);
}
export function tips(g, crowd, acc) { return Math.round(crowd * (2 + acc * 8) * (hasBuff(g, 'sv4h_tune') ? 1.25 : 1)); }
export function collectTips(g, crowd, acc) {
  const b = S(g).music.busk, t = tips(g, crowd, acc);
  b.n++; b.total += t; g.addMoney(t, true); g.stat('buskTips', t); g.stat('buskSessions');
  return t;
}
register('interaction', 'sv4h_busk', {
  label: 'Busking spot',
  run(g) {
    const b = S(g).music.busk; if (b.day !== g.day) { b.day = g.day; b.n = 0; }
    const have = instruments(g, false);
    if (!have.length) return g.run([N('A flat purple mat where buskers set up. You need an instrument: the school recorder, or a guitar.')]);
    if (g.minutes >= 21 * 60) return g.run([N('The square is quiet this late.')]);
    if (g.weather === 'storm') return g.run([N('Nobody is out in this storm.')]);
    if (b.n >= 3) return g.run([N('Your fingers are tired. Three sets a day is plenty.')]);
    const near = require_near(g);
    return g.run([{ t: 'choice', prompt: `Busk with: (set ${b.n + 1} of 3)`, options: [...have.map((inst) => ({ text: INST[inst].name, steps: [call((gg) => gg.run(songChoice(gg, inst, async (g3, id) => {
      const crowd = buskCrowd(g3, near), r = await perform(g3, id, inst, { busk: true, crowd });
      if (!r) return;
      const t = collectTips(g3, crowd, r.acc), line = reactions.find(([a]) => r.acc >= a)[1];
      for (const id2 of nearIds(g3)) g3.addFriend(id2, 1);
      await g3.run([N(`${line} ${crowd} listeners left ${t} coins in the hat. +${r.xp} Music XP.`)]);
    })))] })), { text: 'Not now', steps: [] }] }]);
  },
});
const nearIds = (g) => { const w = g.world; if (!w || !w.presentNPCs) return []; return w.presentNPCs().filter((n) => !n.def.hidden && !['daifuku', 'kuro'].includes(n.id) && Math.hypot(n.x - w.player.x, n.y - w.player.y) < 150).map((n) => n.id).slice(0, 3); };
const require_near = (g) => nearIds(g).length;

// ---------------------------------------------------------------- band
const CAND = [['theo', 3, 'guitar', 'Theo', 'Okay. I could bring the guitar. Do not make me sing.'], ['suzu', 2, 'vocals', 'Suzu', 'I write lyrics anyway. I will sing, quietly, at first.'], ['kai', 2, 'drums', 'Kai', 'Drums? I have been tapping rhythms on desks for years. Count me in!']];
const BAND_NAMES = ['Moonlight Mochi', 'The Paper Stars', 'Hoshimori Breeze'];
export const members = (g) => S(g).music.band.members;
export function bandSteps(g) {
  const b = S(g).music.band, opts = [];
  for (const [id, need, role, nm, line] of CAND) {
    if (!get('npc', id) || b.members.includes(id)) continue;
    if (g.hearts(id) < need) { opts.push({ text: `${nm} (needs ${need} hearts)`, steps: [N(`${nm} is friendly, but you two should get to know each other better first.`)] }); continue; }
    opts.push({ text: `Ask ${nm} to join`, steps: [say('misa', 'happy', `Want to start a band with me? You would be on ${role}.`), say(id, 'happy', line), call((gg) => { S(gg).music.band.members.push(id); gg.addFriend(id, 8); gg.toast(`${nm} joined the band!`, 'i_music'); }), call((gg) => (S(gg).music.band.members.length >= 2 && !S(gg).music.band.name ? gg.run([{ t: 'choice', prompt: 'Name the band', options: BAND_NAMES.map((n) => ({ text: n, steps: [call((g4) => { S(g4).music.band.name = n; g4.setFlag('sv4h_band'); g4.toast(`The band is now "${n}"!`, 'i_star'); })] })) }]) : null))] });
  }
  if (b.members.length) opts.push({ text: 'Rehearse together', steps: [call((gg) => rehearse(gg))] });
  opts.push({ text: 'Back', steps: [] });
  return [N(b.members.length ? `${b.name || 'Your band'}: Misa${b.members.map((m) => ', ' + nameOf(m)).join('')}. Rehearsed ${b.rehearsals} times.` : 'You have no band yet. Ask friends who love music.'), { t: 'choice', prompt: 'Band', options: opts }];
}
function rehearse(g) {
  const m = S(g).music;
  if (m.band.last === g.day) return g.run([N('You already rehearsed today. Ears need rest too.')]);
  return g.run(songChoice(g, 'keyboard', async (gg, id) => {
    const r = await perform(gg, id, 'keyboard', { band: true, crowd: 0 }); if (!r) return;
    m.band.last = gg.day; m.band.rehearsals++; for (const mem of m.band.members) gg.addFriend(mem, 3);
    await gg.run([N(`${grade(r.acc)} The band gets tighter. (+3 friendship with each member)`)]);
  }));
}

// ---------------------------------------------------------------- the music room keyboard
function recordAlbum(g, a) {
  if (!SONGS.length) return;
  const miss = a.songs.filter((s) => best(g, s) < a.min);
  if (miss.length) return g.run([N(`To record "${a.name}" you need ${Math.round(a.min * 100)}% or better on: ${miss.map((s) => songById(s).name).join(', ')}.`)]);
  if (S(g).music.albums[a.id]) return g.run([N('You already recorded that one.')]);
  if (!g.spend(a.fee)) return g.run([N(`Studio time costs ${a.fee} coins.`)]);
  S(g).music.albums[a.id] = g.day; g.give('sv4h_cd_' + a.id, 1); gain(g, 'music', 40); g.advance(90); g.stat('albumsMade'); g.sfx('chime');
  return g.run([N(`You recorded "${a.name}"! The CD is in your bag, and it plays on the music player.`)]);
}
register('interaction', 'sv4h_keyboard', {
  label: 'Music room keyboard',
  run(g) {
    const m = S(g).music;
    const first = [];
    if (!m.inst.keyboard) { m.inst.keyboard = true; first.push(N('The music room keyboard is free for students to use. Misa knows a few chords already.')); }
    if (!m.inst.recorder && !g.has('sv4h_recorder')) first.push(call((gg) => { m.inst.recorder = true; giveOr(gg, 'sv4h_recorder', 30); }), N('The music teacher also lends you a school recorder to keep.'));
    return g.run([...first, { t: 'choice', prompt: 'Music room', options: [
      { text: 'Practise a song', steps: [call((gg) => practice(gg, 'keyboard', true))] },
      { text: 'Band', steps: [call((gg) => gg.run(bandSteps(gg)))] },
      { text: 'Record an album', steps: [{ t: 'choice', prompt: 'Which album?', options: [...ALBUMS.map((a) => ({ text: `${a.name}${m.albums[a.id] ? ' (done)' : '  ' + a.fee + 'c'}`, steps: [call((gg) => recordAlbum(gg, a))] })), { text: 'Back', steps: [] }] }] },
      { text: 'Play my songs', steps: [call((gg) => { gg.open('sv4h_player'); })] },
      { text: 'Leave', steps: [] }] }]);
  },
});

// Theo gives you a guitar once you are friends.
register('talkHook', 'sv4h_theo_guitar', {
  npc: 'theo', when: 'friend:theo>=3&!flag:sv4h_guitar', priority: 4,
  steps: () => [say('theo', 'neutral', 'Hey. I heard you humming at the pier. Have you ever tried guitar?'), say('misa', 'surprised', 'Me? Not really.'), say('theo', 'happy', 'I have a spare one in my bag. It is old, but it sings. Take it.'), call((g) => { g.setFlag('sv4h_guitar'); S(g).music.inst.guitar = true; giveOr(g, 'sv4h_guitar', 160); }), say('misa', 'happy', 'Thank you, Theo! I will practise every day.')],
});

// ---------------------------------------------------------------- school festival gig (Culture Festival)
export function gigSteps(g) {
  const m = S(g).music, key = yearOf(g.day);
  if (m.gigs[key] != null) return [N('You already played this year\'s gig. What a night!')];
  const have = instruments(g, true).filter((i) => i !== 'keyboard' || true);
  if (!have.length) return [N('You need an instrument to play on stage.')];
  const inst = have[have.length - 1];
  return [N(members(g).length ? `${S(g).music.band.name || 'The band'} walks on stage.` : 'Misa walks on stage alone with her instrument.'), ...songChoice(g, inst, async (gg, id) => {
    const r = await perform(gg, id, inst, { crowd: 12, band: true }); if (!r) return;
    m.gigs[key] = Math.round(r.acc * 100) / 100;
    const rank = r.acc >= 0.9 ? 1 : r.acc >= 0.75 ? 2 : r.acc >= 0.55 ? 3 : 4, coins = [0, 400, 250, 120, 40][rank];
    gg.addMoney(coins, true); gain(gg, 'music', 30); gg.stat('gigs'); for (const mem of members(gg)) gg.addFriend(mem, 6);
    if (rank <= 3) addRibbon(gg, 'music', 'School festival gig', rank);
    await gg.run([N(`${grade(r.acc)} The audience cheers! You earn ${coins} coins.`)]);
  })];
}
{
  const f = get('festival', 'culture');
  if (f) (f.activities ||= []).push({ id: 'sv4h_gig', map: 'school_grounds', spot: 'field_center', dx: 0, dy: 3, label: 'Play the festival gig', daily: true, run: (g) => g.run(gigSteps(g)) });
}

// ---------------------------------------------------------------- the music player scene
class Player {
  constructor(game) {
    Object.assign(this, { name: 'sv4h_player', opaque: true, game, t: 0, listen: 0, acc: 0, sel: 0 });
    this.list = SONGS.filter((s) => best(game, s.id) > 0);
    this.sync();
  }
  sync() { this.music = this.list.length ? 'sv4h_trk_' + this.list[this.sel].id : null; }
  update(dt, input, game) {
    this.t += dt; const k = input.pressed, n = this.list.length;
    if (k.has('escape') || k.has('q')) { if (this.listen >= 1) game.stat('musicMinutes', this.listen); game.scenes.pop(this); return; }
    if (n && (k.has('arrowright') || k.has('d'))) { this.sel = (this.sel + 1) % n; this.sync(); game.sfx('blip'); }
    if (n && (k.has('arrowleft') || k.has('a'))) { this.sel = (this.sel + n - 1) % n; this.sync(); game.sfx('blip'); }
    if (n) {
      this.acc += dt;
      if (this.acc >= 4) {
        this.acc = 0; this.listen += 10; const m = S(game).music;
        if (m.radioDay !== game.day) { m.radioDay = game.day; m.radioMood = 0; }
        if (m.radioMood < 4) { m.radioMood++; game.addMood(1); }
        game.advance(10); if (game.minutes >= 25 * 60) { game.toast('It is very late. Time for bed!'); game.scenes.pop(this); }
      }
    }
  }
  draw(g) {
    rect(g, '#2b1d36', 0, 0, 320, 224); panel(g, 30, 30, 260, 150, 'butter');
    drawTextC(g, 'MISA\'S MUSIC PLAYER', 160, 38, C.ink, 1, null);
    if (!this.list.length) { drawTextC(g, 'Play a song first and it shows up here.', 160, 90, C.ink, 1, null); return; }
    const s = this.list[this.sel];
    drawTextC(g, s.name, 160, 70, C.coral, 2, null); drawTextC(g, `Best ${Math.round(best(this.game, s.id) * 100)}%   ${s.bpm} bpm`, 160, 92, C.ink, 1, null);
    for (let i = 0; i < 20; i++) rect(g, i % 2 ? K.coral[2] : K.butter[3], 62 + i * 9, 140 - Math.round((Math.sin(this.t * 7 + i) + 1) * 10), 6, 4 + Math.round((Math.sin(this.t * 7 + i) + 1) * 10));
    drawTextC(g, `Track ${this.sel + 1} of ${this.list.length}   Listened: ${this.listen} min`, 160, 156, C.ink, 1, null);
    drawTextC(g, 'Left/Right: track   Esc: leave', 160, 168, C.ink, 1, null);
  }
}
register('scene', 'sv4h_player', { make: (game) => new Player(game) });

addObjects('school_halls', [{ spr: 'sv4h_keyboard', x: 12, y: 2, use: 'sv4h_keyboard', shadow: 14 }]);
addObjects('town', [{ spr: 'sv4h_busk', x: 26, y: 19, w: 1, solid: false, flat: true, use: 'sv4h_busk' }]);

features('Creative Hobbies', [
  'Music skill (levels 1 to 10): a recorder from the school music room, a guitar from Theo at 3 hearts and the music room keyboard',
  'Rhythm practice minigame: four lanes of falling notes, perfect and good timing windows, combos and a score',
  'Eight songs of rising difficulty, from Twinkle on the Bay to Star Finale; score 55% to unlock the next',
  'Each instrument widens the timing window: recorder, guitar, keyboard',
  'Busk on the mat in the town square: the crowd grows at lunch and after school, on weekends, and shrinks in the rain',
  'Busking tips depend on your accuracy and crowd size, with three sets a day and nearby neighbours warming to you',
  'Form a band with Theo, Suzu and Kai once you are friends, name it, and rehearse for friendship and a better timing window',
  'Play a solo or band gig on the Culture Festival grounds for coins, a ribbon and friendship with your band',
  'Record up to four albums (Bay Breeze, Lantern Nights, Festival Fever, Best of Misa) from songs you have mastered',
  'Album CDs are collectible items the stationery stall buys, and they play in the music player scene',
  'Music player scene plays your practised songs as tracks, passing time and lifting your mood a little',
]);
