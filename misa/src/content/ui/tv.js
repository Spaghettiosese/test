// Living-room TV and radio (interactions 'tv' and 'radio', placed by the interiors area).
// TV: pick a channel and watch a 30 minute show; each show is once a day, max 4 shows a day, with small rewards
//   (mood, energy, skill xp, coins from the quiz show, a new recipe from the cooking show via game.learnRecipe).
// Radio: tune to a station (plays that music while the radio is open), time passes and mood rises while listening.
// Save data: state.ui = { tvDay, tvSeen: {channelId: 1}, tvCount, radio: stationId, radioDay, radioMood }
import { register, get, all, features } from '../../core/registry.js';
import { SPRITES } from '../../art.js';
import { sprite } from '../../artcache.js';
import { UI, rect, panel, drawText, drawTextC, wrap, iconC } from '../../ui/ui.js';
import { dateText, WEEKDAYS } from '../../core/time.js';
import { tap, hit, clamp, line } from './kit.js';

register('stateSlice', 'ui', { default: () => ({ tvDay: 0, tvSeen: {}, tvCount: 0, radio: 'enka', radioDay: 0, radioMood: 0, photos: 0 }) });
const US = (game) => game.state.ui;
const tvToday = (game) => { const u = US(game); if (u.tvDay !== game.day) { u.tvDay = game.day; u.tvSeen = {}; u.tvCount = 0; } return u; };
const hour = (game) => game.minutes / 60;
const WNAME = { sunny: 'sunny skies', cloudy: 'clouds', rain: 'rain, so take an umbrella', storm: 'thunderstorms, stay cosy', snow: 'snow', windy: 'strong winds' };
const WICON = { sunny: 'i_sun', cloudy: 'i_cloud', rain: 'i_rain', storm: 'i_storm', snow: 'i_snow', windy: 'i_wind' };

// ------------------------------------------------------------------ quiz show
const QUIZ = [
  ['Which room in the house has the old radio?', ['Living room', 'Attic', 'Bathroom'], 0],
  ['How many seasons are in a year?', ['Three', 'Four', 'Six'], 1],
  ['What is the lighthouse for?', ['Guiding boats', 'Baking bread', 'Storing rain'], 0],
  ['Which of these is a Japanese rice ball?', ['Onigiri', 'Tempura', 'Gyoza'], 0],
  ['Fireflies glow in which season?', ['Winter', 'Summer', 'Spring'], 1],
  ['What do you call a cat that brings good luck?', ['Maneki-neko', 'Tanuki', 'Daruma'], 0],
  ['Which flower is famous in spring in Japan?', ['Sakura', 'Sunflower', 'Poinsettia'], 0],
  ['How many days are in one season here?', ['28', '30', '14'], 0],
  ['What do you wear to a summer festival?', ['A yukata', 'A snowsuit', 'A raincoat'], 0],
  ['Which tool do you use to catch fish?', ['A rod', 'A broom', 'A whisk'], 0],
  ['What is mochi made from?', ['Rice', 'Potatoes', 'Corn'], 0],
  ['Which planet is known as the red planet?', ['Mars', 'Venus', 'Saturn'], 0],
];
function quizSteps(game) {
  const rng = game.rngFor('tvquiz'), pool = QUIZ.slice();
  const qs = []; while (qs.length < 3) qs.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  let right = 0;
  const steps = [{ t: 'say', who: null, text: 'Quiz Time with Professor Pom! Three questions, ten coins for each right answer.' }];
  qs.forEach(([q, opts, ok], qi) => steps.push({ t: 'choice', prompt: `Q${qi + 1}: ${q}`, options: opts.map((o, i) => ({ text: o, steps: [{ t: 'call', fn: () => { if (i === ok) right++; } }, { t: 'say', who: null, text: i === ok ? 'Correct! Ding ding!' : `Oh no! The answer was ${opts[ok]}.` }] })) }));
  steps.push({ t: 'call', fn: (g) => { g.addMoney(right * 10); g.stat('quizRight', right); if (right === 3) g.achieve && g.achieve('quiz_whiz'); } });
  steps.push({ t: 'say', who: null, text: 'Thanks for playing along at home!' });
  return { steps, right: () => right };
}

// ------------------------------------------------------------------ channels
// draw(g, t, x, y, w, h, game) paints the screen. watch(game) -> result line (and applies rewards).
const sky = (g, x, y, w, h, a, b) => { for (let i = 0; i < h; i += 2) rect(g, i < h / 2 ? a : b, x, y + i, w, 2); };
const bob = (t, k = 6) => (UI.reduceMotion ? 0 : Math.round(Math.sin(t * 4) * k / 6));
const CH = [
  { id: 'weather', name: 'Weather Lady', blurb: "Tomorrow's forecast and a smile.", when: () => true,
    draw(g, t, x, y, w, h, game) { sky(g, x, y, w, h, '#9cd0f0', '#cfe8f4'); const wx = game.state.tomorrowWeather || 'sunny', ic = SPRITES[WICON[wx]] ? WICON[wx] : 'i_sun'; g.drawImage(sprite(ic), x + w / 2 - 8, y + 20 + bob(t)); drawTextC(g, 'TOMORROW', x + w / 2, y + 8, '#3a2a30', 1, null); drawTextC(g, (wx || '').toUpperCase(), x + w / 2, y + 48, '#3a2a30', 1, null); rect(g, '#f6c0cc', x + 8, y + h - 30, 22, 30); rect(g, '#f8d5b8', x + 12, y + h - 40, 14, 12); },
    watch(game) { const wx = game.state.tomorrowWeather || 'sunny'; game.addMood(1); return `The weather lady says: tomorrow brings ${WNAME[wx] || 'a bit of everything'}. (Mood +1)`; } },
  { id: 'stretch', name: 'Morning Stretch', blurb: 'Gentle exercises. Mornings only.', when: (g) => hour(g) >= 5.9 && hour(g) < 11,
    draw(g, t, x, y, w, h) { rect(g, '#bfe6c8', x, y, w, h); rect(g, '#e8c07a', x, y + h - 14, w, 14); const a = UI.reduceMotion ? 0 : Math.sin(t * 5) * 8, cx = x + w / 2; rect(g, '#f8d5b8', cx - 5, y + 28, 10, 10); rect(g, '#e87a9a', cx - 4, y + 38, 8, 22); rect(g, '#e87a9a', cx - 18, y + 36 - a, 14, 3); rect(g, '#e87a9a', cx + 4, y + 36 + a, 14, 3); rect(g, '#4f6aa8', cx - 4, y + 60, 3, 18); rect(g, '#4f6aa8', cx + 1, y + 60, 3, 18); },
    watch(game) { game.addEnergy(6); game.addMood(1); return 'You stretch along with the show. (Energy +6, mood +1)'; } },
  { id: 'cooking', name: 'Kitchen Magic', blurb: 'A cooking show. You might pick up a recipe.', when: () => true,
    draw(g, t, x, y, w, h) { rect(g, '#f6e0c0', x, y, w, h); rect(g, '#b78a5a', x, y + h - 30, w, 30); const cx = x + w / 2; rect(g, '#5a5a66', cx - 16, y + h - 48, 32, 18); rect(g, '#7a7a88', cx - 18, y + h - 52, 36, 4); for (let i = 0; i < 3; i++) { const o = UI.reduceMotion ? 0 : (t * 14 + i * 9) % 26; rect(g, '#ffffffaa', cx - 10 + i * 9, y + h - 58 - o, 4, 4); } rect(g, '#ffffff', x + 14, y + 18, 20, 8); rect(g, '#ffffff', x + 12, y + 26, 24, 4); rect(g, '#f8d5b8', x + 16, y + 30, 16, 14); },
    watch(game) {
      const lv = game.skillLevel('cooking'), pool = all('recipe').filter((r) => (r.from === 'hidden') || (typeof r.skill === 'number' && r.skill <= lv + 1));
      const rng = game.rngFor('tvcook'); pool.sort(() => rng() - 0.5);
      for (const r of pool) if (game.learnRecipe && game.learnRecipe(r.id, 'TV')) return `The chef shows how to make ${r.name}. You scribble it down!`;
      game.addXP('cooking', 8); return 'You know every dish the chef makes, but you pick up a few tricks. (Cooking xp +8)';
    } },
  { id: 'nature', name: 'Nature Hour', blurb: 'Birds, fish and quiet music.', when: () => true,
    draw(g, t, x, y, w, h) { sky(g, x, y, w, h, '#8fd0e8', '#bfe6f4'); rect(g, '#5aa070', x, y + h - 26, w, 26); rect(g, '#3f7a58', x + 10, y + h - 36, 14, 14); const bx = x + ((t * 18) % (w + 20)) - 10; rect(g, '#3a2a30', bx, y + 20 + bob(t, 12), 6, 2); rect(g, '#3a2a30', bx + 6, y + 18 + bob(t, 12), 4, 2); rect(g, '#3a2a30', bx - 4, y + 18 + bob(t, 12), 4, 2); },
    watch(game) { game.addMood(3); game.addXP('fishing', 4); return 'A heron wades through a misty river. So calming. (Mood +3, fishing xp +4)'; } },
  { id: 'news', name: 'Bay News', blurb: 'Festivals, shop hours and gossip.', when: () => true,
    draw(g, t, x, y, w, h, game) { rect(g, '#2a3a5a', x, y, w, h); rect(g, '#e8f0ff', x + 10, y + 10, w - 20, 8); drawText(g, 'HOSHIMORI BAY NEWS', x + 14, y + 11, '#2a3a5a', 1, null); rect(g, '#d93b3b', x, y + h - 14, w, 14); const msg = '  ' + (game.upcomingFestivals ? game.upcomingFestivals(14).slice(0, 2).map((u) => `${dateText(u.day)}: ${u.def.name}`).join('   ') : 'Welcome to the bay!'), off = UI.reduceMotion ? 0 : Math.round(t * 30) % 300; drawText(g, msg + msg, x + 4 - off + 120, y + h - 11, '#ffffff', 1, null); },
    watch(game) { const up = game.upcomingFestivals ? game.upcomingFestivals(28).filter((u) => !u.def.minor).slice(0, 2) : []; game.addXP('charm', 3); return up.length ? `Next up in town: ${up.map((u) => `${u.def.name} (${dateText(u.day)})`).join(', ')}. (Charm xp +3)` : 'A quiet news day by the bay. (Charm xp +3)'; } },
  { id: 'quiz', name: 'Quiz Time', blurb: 'Answer three questions, win coins.', when: () => true, scripted: true,
    draw(g, t, x, y, w, h) { rect(g, '#6a3fa8', x, y, w, h); for (let i = 0; i < 8; i++) rect(g, (i + Math.floor(UI.reduceMotion ? 0 : t * 6)) % 2 ? '#ffd76a' : '#e87a9a', x + 6 + i * 22, y + 6, 10, 10); drawTextC(g, '?', x + w / 2, y + 30, '#ffffff', 3, null); drawTextC(g, 'QUIZ TIME', x + w / 2, y + 62, '#ffd76a', 1, null); },
    watch: null },
  { id: 'cartoon', name: 'Mochi Cat Adventures', blurb: 'A silly cartoon about a lucky cat.', when: (g) => g.isWeekend || hour(g) >= 15,
    draw(g, t, x, y, w, h) { rect(g, '#ffe3a8', x, y, w, h); const j = UI.reduceMotion ? 0 : Math.abs(Math.sin(t * 4)) * 14, cx = x + w / 2; rect(g, '#fff6e6', cx - 12, y + h - 40 - j, 24, 20); rect(g, '#fff6e6', cx - 12, y + h - 48 - j, 6, 8); rect(g, '#fff6e6', cx + 6, y + h - 48 - j, 6, 8); rect(g, '#3a2a30', cx - 6, y + h - 34 - j, 2, 3); rect(g, '#3a2a30', cx + 4, y + h - 34 - j, 2, 3); rect(g, '#e87a9a', x, y + h - 14, w, 14); },
    watch(game) { game.addMood(4); return 'Mochi Cat chases a runaway dumpling. You giggle for the whole episode. (Mood +4)'; } },
  { id: 'crafts', name: 'Handmade Hour', blurb: 'Crafting tips and tidy-home hacks.', when: (g) => hour(g) >= 9 && hour(g) < 20,
    draw(g, t, x, y, w, h) { rect(g, '#f2e6f6', x, y, w, h); rect(g, '#b78a5a', x + 20, y + h - 40, w - 40, 6); for (let i = 0; i < 5; i++) rect(g, ['#e87a9a', '#7fb2e0', '#ffd76a', '#86cdb0', '#c9b3ff'][i], x + 28 + i * 24, y + h - 56 + (UI.reduceMotion ? 0 : (i % 2) * bob(t)), 14, 16); },
    watch(game) { const k = game.rng() < 0.5 ? 'crafting' : 'homemaking'; game.addXP(k, 6); game.addMood(1); return `Today's tip: ${k === 'crafting' ? 'sand the edges before you paint' : 'wipe the shelf, then the books'}. (${k === 'crafting' ? 'Crafting' : 'Homemaking'} xp +6)`; } },
  { id: 'drama', name: 'Harbour Lights', blurb: 'A tearful evening drama.', when: (g) => hour(g) >= 17,
    draw(g, t, x, y, w, h) { sky(g, x, y, w, h, '#f0a07a', '#7a5a8a'); rect(g, '#2a2038', x, y + h - 20, w, 20); rect(g, '#f8d5b8', x + 40, y + 36, 12, 12); rect(g, '#3a2a30', x + 40, y + 32, 12, 5); rect(g, '#f8d5b8', x + w - 54, y + 38, 12, 12); rect(g, '#d93b3b', x + w - 54, y + 34, 12, 5); rect(g, '#e8e8f0', x + 36, y + 48, 20, 28); rect(g, '#4f6aa8', x + w - 58, y + 50, 20, 26); },
    watch(game) { game.addMood(3); game.addXP('charm', 3); return 'The lighthouse keeper finally says the three words. You sniffle happily. (Mood +3, charm xp +3)'; } },
  { id: 'stars', name: 'Sky Report', blurb: 'What to look for in tonight\'s sky. After 8 PM.', when: (g) => hour(g) >= 20 || hour(g) < 5.9,
    draw(g, t, x, y, w, h) { rect(g, '#14183a', x, y, w, h); for (let i = 0; i < 26; i++) { const tw = UI.reduceMotion ? 1 : (Math.floor(t * 3 + i) % 3); if (tw) rect(g, '#fff6c0', x + (i * 37) % w, y + (i * 23) % (h - 10), 1 + (i % 2), 1 + (i % 2)); } rect(g, '#fff6c0', x + w - 40, y + 14, 12, 12); rect(g, '#14183a', x + w - 36, y + 12, 10, 10); },
    watch(game) { game.addMood(3); game.stat('skyReports'); return 'The host points out the summer triangle and a very patient owl. (Mood +3)'; } },
  { id: 'movie', name: 'Late Night Movie', blurb: 'A cosy old film. After 10 PM; costs sleep.', when: (g) => hour(g) >= 22 || hour(g) < 5.9,
    draw(g, t, x, y, w, h) { rect(g, '#000000', x, y, w, h); rect(g, '#3a2a30', x + 6, y + 12, w - 12, h - 24); rect(g, '#f0d8a0', x + w / 2 - 10, y + h / 2 - 8, 20, 16); drawTextC(g, 'THE END?', x + w / 2, y + h - 22, '#f0d8a0', 1, null); },
    watch(game) { game.addMood(5); game.addEnergy(-6); return 'You stay up for the whole film. Worth it. (Mood +5, energy -6)'; } },
];
export const TV_CHANNELS = CH;

// ------------------------------------------------------------------ TV scene
class TvScene {
  constructor(game) { Object.assign(this, { name: 'tv', opaque: true, game, t: 0, i: 0, phase: 'pick', p: 0, msg: '', music: null }); this.tune(0); }
  list() { return CH.filter((c) => c.when(this.game)); }
  tune(d) { const l = this.list(); this.i = (this.i + d + l.length) % l.length; this.noise = 0.35; this.game.sfx('blip'); }
  get ch() { const l = this.list(); return l[Math.min(this.i, l.length - 1)]; }
  close() { this.game.scenes.pop(this); }
  update(dt, input, game) {
    this.t += dt; this.noise = Math.max(0, this.noise - dt);
    const k = input.pressed, u = tvToday(game);
    if (this.phase === 'pick') {
      if (k.has('escape') || k.has('q') || hit(input, 280, 4, 36, 18)) return this.close();
      if (k.has('arrowleft') || k.has('a') || hit(input, 6, 92, 24, 24)) this.tune(-1);
      if (k.has('arrowright') || k.has('d') || hit(input, 290, 92, 24, 24)) this.tune(1);
      const go = k.has('enter') || k.has(' ') || k.has('e') || hit(input, 108, 188, 104, 20);
      if (go) {
        if (u.tvSeen[this.ch.id]) return game.toast('You already watched that today');
        if (u.tvCount >= 4) return game.toast('Your eyes are tired. No more TV today!');
        this.phase = 'watch'; this.p = 0; game.sfx('select');
      }
    } else if (this.phase === 'watch') {
      this.p += dt / 2.6;
      if (input.justDown || k.has('enter') || k.has(' ')) this.p = Math.max(this.p, 1);
      if (this.p >= 1) this.finish(game, u);
    } else if (this.phase === 'result') {
      if (input.justDown || k.has('enter') || k.has(' ') || k.has('e') || k.has('escape')) this.phase = 'pick';
    }
  }
  finish(game, u) {
    const ch = this.ch; u.tvSeen[ch.id] = 1; u.tvCount++; game.stat('tvShows');
    this.phase = 'busy';
    if (ch.scripted) {
      const q = quizSteps(game);
      game.run(q.steps).then(() => { game.advance(30); this.msg = `You got ${q.right()} of 3 right. (+${q.right() * 10} coins)`; this.phase = 'result'; });
    } else { this.msg = ch.watch(game); game.advance(30); this.phase = 'result'; game.sfx('chime'); }
  }
  draw(g, game) {
    const ch = this.ch, u = tvToday(game);
    rect(g, '#2b1d2e', 0, 0, 320, 224); rect(g, '#4a3348', 0, 168, 320, 56);
    panel(g, 40, 14, 240, 160, 'dark', { shadow: true }); rect(g, '#1e1624', 48, 22, 224, 144);
    const sx = 52, sy = 26, sw = 216, sh = 128;
    ch.draw(g, this.t, sx, sy, sw, sh, game);
    if (this.noise > 0 || this.phase === 'busy') for (let i = 0; i < 160; i++) rect(g, ['#ffffff', '#888', '#222'][(i * 7 + Math.floor(this.t * 60)) % 3], sx + (i * 53) % sw, sy + (i * 29) % sh, 3, 2);
    rect(g, '#ffffff22', sx, sy, sw, 10);
    drawText(g, ch.name, 52, 156, UI.gold, 1, '#00000088');
    if (this.phase === 'pick') {
      tap(g, game, 6, 92, 24, 24, '<'); tap(g, game, 290, 92, 24, 24, '>');
      tap(g, game, 280, 4, 36, 18, 'Exit');
      const done = u.tvSeen[ch.id], left = 4 - u.tvCount;
      tap(g, game, 108, 188, 104, 20, done ? 'Watched today' : 'Watch (30 min)', { disabled: !!done || left <= 0 });
      drawTextC(g, ch.blurb, 160, 176, UI.text, 1, null);
      drawTextC(g, `Shows left today: ${Math.max(0, left)}   -   Channel ${this.i + 1}/${this.list().length}`, 160, 212, '#b9a6c4', 1, null);
      drawText(g, `${WEEKDAYS[game.weekday]} ${Math.floor(hour(game))}:00`.replace(/:00$/, ''), 6, 6, '#b9a6c4', 1, null);
    } else if (this.phase === 'watch') {
      rect(g, UI.ink, 52, 168, 216, 8); rect(g, UI.accent, 53, 169, Math.round(214 * Math.min(1, this.p)), 6);
    } else if (this.phase === 'result') {
      panel(g, 20, 146, 280, 66, 'dark');
      wrap(this.msg, 52).slice(0, 4).forEach((l, i) => drawText(g, l, 28, 154 + i * 10, UI.text, 1, null));
      drawText(g, 'Tap or press Enter', 28, 200, UI.gold, 1, null);
    }
  }
}
register('scene', 'ui_tv', { make: (game) => new TvScene(game) });
register('interaction', 'tv', {
  label: 'Watch TV',
  run(game) {
    if (game.minutes >= 25 * 60) return game.say('misa', 'sleepy', 'It is way too late for TV. Bed time!');
    return new Promise((res) => { game.open('ui_tv'); const s = game.scenes.top; const orig = s.close.bind(s); s.close = () => { orig(); res(); }; });
  },
});

// ------------------------------------------------------------------ radio
const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return n >>> 0; };
const scaleTrack = (bpm, scale, seed, type, bassLen = 8, density = 0.5) => ({ bpm, type, play(step) {
  const out = [], h = hash(step * 7919 + seed);
  if (step % 2 === 0 && (h % 100) / 100 < density + 0.3) out.push({ n: scale[h % scale.length] + (h % 5 === 0 ? 12 : 0), len: 2 + (h % 3), v: 1 });
  if (step % bassLen === 0) out.push({ n: scale[(step / bassLen | 0) % 3] - 12, len: bassLen, v: 0.8, type: 'sine' });
  return out;
} });
register('track', 'radio_enka', scaleTrack(70, [0, 1, 5, 7, 8], 3, 'triangle', 8, 0.35));
register('track', 'radio_lullaby', scaleTrack(54, [0, 4, 7, 9, 12], 11, 'sine', 8, 0.2));
register('track', 'radio_chill', scaleTrack(82, [0, 3, 5, 7, 10], 29, 'triangle', 4, 0.5));
const STATIONS = [
  { id: 'enka', name: 'Enka FM 76.1', track: 'radio_enka', desc: "Grandma's favourite. Slow, wobbly and heartfelt." },
  { id: 'chill', name: 'Chill Tide 88.8', track: 'radio_chill', desc: 'Lazy beats for homework and housework.' },
  { id: 'home', name: 'Home Sweet Home', track: 'home', desc: 'The soft tune of this very house.' },
  { id: 'town', name: 'Town Pop 91.5', track: 'town', desc: 'Bouncy hits from the shopping street.' },
  { id: 'cafe', name: 'Cafe Jazz', track: 'cafe', desc: 'Smoky trumpet and coffee cups.' },
  { id: 'beach', name: 'Seaside Radio', track: 'beach', desc: 'Waves, ukulele and sunshine.' },
  { id: 'rain', name: 'Rainy Day FM', track: 'rain', desc: 'For raindrops on the window.' },
  { id: 'shrine', name: 'Hill Shrine Bells', track: 'shrine', desc: 'Calm temple tunes.' },
  { id: 'festival', name: 'Matsuri Beat', track: 'festival', desc: 'Drums and flutes all year round.' },
  { id: 'night', name: 'Moonlight Hour', track: 'night', desc: 'Quiet arpeggios for late nights.' },
  { id: 'lullaby', name: 'Sleepy Lullabies', track: 'radio_lullaby', desc: 'Falling asleep is encouraged.' },
  { id: 'off', name: 'Radio off', track: null, desc: 'Silence is golden.' },
];
function djLine(game, n) {
  const wx = game.state.tomorrowWeather, up = game.upcomingFestivals ? game.upcomingFestivals(14).find((u) => !u.def.minor) : null;
  const pool = [`DJ Pom: Tomorrow expect ${WNAME[wx] || 'a bit of everything'}.`, up ? `DJ Pom: Don't forget ${up.def.name} on ${dateText(up.day)}!` : 'DJ Pom: Stay hydrated, bay!', 'DJ Pom: Today is a great day to feed your pets.', 'DJ Pom: Request line is open. Nobody has called since 1998.', 'DJ Pom: A lucky listener finds a coin under the sofa today.', 'DJ Pom: Remember to say hello to your neighbours.'];
  return pool[n % pool.length];
}
class RadioScene {
  constructor(game) { Object.assign(this, { name: 'radio', opaque: true, game, t: 0, listen: 0, acc: 0, dj: 0 }); const u = US(game); this.i = Math.max(0, STATIONS.findIndex((s) => s.id === u.radio)); this.sync(); }
  sync() { const s = STATIONS[this.i]; this.music = s.track; US(this.game).radio = s.id; }
  go(d) { this.i = (this.i + d + STATIONS.length) % STATIONS.length; this.sync(); this.game.sfx('blip'); }
  close() { const g = this.game; if (this.listen >= 1) g.stat('radioMinutes', this.listen); g.scenes.pop(this); }
  update(dt, input, game) {
    this.t += dt; const k = input.pressed, u = US(game), s = STATIONS[this.i];
    if (k.has('escape') || k.has('q') || hit(input, 280, 4, 36, 18)) return this.close();
    if (k.has('arrowleft') || k.has('a') || hit(input, 20, 72, 36, 36)) this.go(-1);
    if (k.has('arrowright') || k.has('d') || hit(input, 264, 72, 36, 36)) this.go(1);
    if (k.has('arrowup') || k.has('w') || hit(input, 100, 150, 24, 18)) { game.settings.music = clamp((game.settings.music ?? 0.6) + 0.1, 0, 1); game.saveSettings(); game.audio && game.audio.setVolumes(game.settings); }
    if (k.has('arrowdown') || k.has('s') || hit(input, 196, 150, 24, 18)) { game.settings.music = clamp((game.settings.music ?? 0.6) - 0.1, 0, 1); game.saveSettings(); game.audio && game.audio.setVolumes(game.settings); }
    if (input.justDown && input.my >= 200 && input.my < 222) { const j = Math.floor((input.mx - 8) / 25); if (j >= 0 && j < STATIONS.length && j !== this.i) { this.i = j; this.sync(); game.sfx('blip'); } }
    if (s.track) {
      this.acc += dt;
      if (this.acc >= 4) { // every 4 real seconds: 10 game minutes pass
        this.acc = 0; this.listen += 10; this.dj++;
        if (u.radioDay !== game.day) { u.radioDay = game.day; u.radioMood = 0; }
        if (u.radioMood < 5) { u.radioMood++; game.addMood(1); }
        game.advance(10);
        if (game.minutes >= 25 * 60) { game.toast('It is very late. Time for bed!'); this.close(); }
      }
    }
  }
  draw(g, game) {
    const s = STATIONS[this.i];
    rect(g, '#3b2a40', 0, 0, 320, 224); rect(g, '#4a3348', 0, 196, 320, 28);
    panel(g, 14, 20, 292, 150, 'butter');
    rect(g, '#7a5a3a', 24, 30, 272, 50); rect(g, '#2b1d2e', 28, 34, 264, 42);
    drawTextC(g, s.name, 160, 40, s.track ? UI.gold : '#888', 1, null);
    wrap(s.desc, 60).slice(0, 2).forEach((l, i) => drawTextC(g, l, 160, 54 + i * 9, UI.text, 1, null));
    tap(g, game, 20, 72 + 20, 36, 36, '<'); tap(g, game, 264, 92, 36, 36, '>');
    for (let i = 0; i < 24; i++) { const hgt = s.track ? 4 + (UI.reduceMotion ? 6 : Math.round((Math.sin(this.t * 6 + i) + 1) * 8 * (0.5 + (hash(i + Math.floor(this.t * 4)) % 50) / 100))) : 2; rect(g, i % 2 ? UI.accent : UI.gold, 74 + i * 7, 128 - hgt, 5, hgt); }
    tap(g, game, 100, 150, 24, 18, '+'); tap(g, game, 196, 150, 24, 18, '-');
    drawTextC(g, `Volume ${Math.round((game.settings.music ?? 0.6) * 10)}`, 160, 155, UI.ink, 1, null);
    tap(g, game, 280, 4, 36, 18, 'Exit');
    if (s.track) { drawTextC(g, djLine(game, this.dj), 160, 184 - 6, '#fff6c0', 1, null); }
    STATIONS.forEach((st, j) => { const on = j === this.i; rect(g, UI.ink, 8 + j * 25, 202, 24, 18); rect(g, on ? UI.gold : UI.paper2, 9 + j * 25, 203, 22, 16); drawTextC(g, String(j + 1), 20 + j * 25, 208, UI.ink, 1, null); });
    drawText(g, 'Left/Right: station   Up/Down: volume   Esc: leave', 8, 4, '#b9a6c4', 1, null);
    line(g, `Listened: ${this.listen} min`, 30, 140, UI.ink);
  }
}
register('scene', 'ui_radio', { make: (game) => new RadioScene(game) });
register('interaction', 'radio', {
  label: 'Radio',
  run(game) {
    if (game.minutes >= 25 * 60) return game.say('misa', 'sleepy', 'Shh. It is the middle of the night.');
    return new Promise((res) => { game.open('ui_radio'); const s = game.scenes.top; const orig = s.close.bind(s); s.close = () => { orig(); res(); }; });
  },
});

features('Living room', [
  'Interactive TV: pick from up to 11 channels that change with the time of day and weekend, 30 minutes per show',
  'TV weather lady shows tomorrow\'s forecast; Bay News lists the next festivals with a scrolling ticker',
  'Kitchen Magic cooking show can teach Misa a new recipe (via learnRecipe), or gives cooking xp when none are left',
  'Quiz Time TV game show: three questions from a daily rotation, ten coins per right answer',
  'TV shows give small rewards: mood, energy (Morning Stretch), and xp in fishing, crafting, homemaking and charm',
  'Late Night Movie and Sky Report only air at night; the movie costs energy; at most 4 shows a day, each once a day',
  'Radio with 12 stations (three new procedural tunes plus the town themes); the chosen station plays while the radio is open',
  'Listening to the radio passes game time, raises mood (up to +5 a day) and a DJ reads the forecast and upcoming festivals',
  'Radio volume buttons and tap-to-tune station strip, remembering the last station in the save file',
]);
