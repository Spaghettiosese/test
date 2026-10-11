// Sleeping, passing out, the end-of-day summary, eating and energy.
import { register, get, features } from '../core/registry.js';
import { clockText, dateText, seasonOf, dateOf } from '../core/time.js';
import { drawText, drawTextC, measure } from '../font.js';
import { sprite } from '../artcache.js';
import { UI, rect, panel } from '../ui/ui.js';

const WTXT = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', storm: 'Thunderstorms', snow: 'Snow', windy: 'Windy' };

class SummaryScene {
  constructor(game, info, onDone) { Object.assign(this, { name: 'summary', game, info, onDone, t: 0, music: 'night' }); }
  update(dt, input) { this.t += dt; if (this.t > 0.8 && (input.pressed.has(' ') || input.pressed.has('enter') || input.pressed.has('e') || input.justDown)) { this.game.scenes.pop(this); this.onDone(); } }
  draw(g) {
    const i = this.info;
    rect(g, '#171233', 0, 0, 320, 224);
    for (let k = 0; k < 50; k++) { rect(g, (Math.floor(this.t * 2 + k) % 6) ? '#fffaf0' : '#8a7fb0', (k * 83) % 316, (k * 41) % 200, 1, 1); }
    panel(g, 40, 22, 240, 176, 'paper');
    drawTextC(g, `END OF ${i.date.toUpperCase()}`, 160, 32, UI.accent2, 2, null);
    const rows = [
      ['Coins earned', `${i.earned >= 0 ? '+' : ''}${i.earned}`], ['Coins now', `${this.game.money}`],
      ['People you talked to', `${i.talks}`], ['Friendship gained', `+${i.friend}`],
      ['Items found', `${i.items}`], ['Energy tomorrow', `${i.energy}%`],
    ];
    rows.forEach(([a, b], k) => { drawText(g, a, 60, 56 + k * 12, UI.ink, 1, null); drawText(g, b, 260 - measure(b), 56 + k * 12, UI.accent2, 1, null); });
    drawTextC(g, `TOMORROW: ${i.tomorrow} - ${WTXT[i.weather] || i.weather}`, 160, 136, UI.ink, 1, null);
    if (i.note) drawTextC(g, i.note, 160, 150, UI.good, 1, null);
    if (this.t > 0.8) drawTextC(g, 'PRESS SPACE TO SLEEP', 160, 180, UI.dim, 1, null);
  }
}
register('scene', 'summary', { make: (game, info, onDone) => new SummaryScene(game, info, onDone) });

function snapshot(game) {
  const s = game.state;
  return { money: s.money, talks: s.stats.talks || 0, friend: Object.values(s.friends).reduce((a, f) => a + f.pts, 0), items: s.stats.itemsFound || 0 };
}

export function sleep(game, { passedOut = false } = {}) {
  const s = game.state, start = game.dayStartSnap || snapshot(game), now = snapshot(game);
  const late = s.time.minutes >= 24 * 60;
  const energy = passedOut ? 50 : late ? 75 : 100;
  game.bus.emit('sleep', { passedOut });
  const info = {
    date: dateText(game.day), earned: now.money - start.money, talks: now.talks - start.talks, friend: now.friend - start.friend, items: now.items - start.items,
    energy, tomorrow: dateText(game.day + 1), weather: s.tomorrowWeather,
    note: passedOut ? 'Misa fell asleep somewhere... Mochi found her.' : game.flag('perfectDay') ? 'A perfect day!' : '',
  };
  const steps = passedOut
    ? [{ t: 'say', who: 'misa', mood: 'sleepy', text: 'So... sleepy... can\'t... keep my eyes open...' }, { t: 'fade', to: 1, dur: 0.8 }]
    : [{ t: 'fade', to: 1, dur: 0.8 }];
  return game.run(steps.concat([{ t: 'call', fn: () => new Promise((res) => game.open('summary', info, res)) }, { t: 'call', fn: () => {
    game.nextDay(passedOut ? 9 * 60 : 6 * 60 + 30);
    s.energy = Math.round(s.maxEnergy * energy / 100);
    game.passingOut = false;
    if (game.world) game.world.load('home', ...(get('map', 'home').spawns.bed || [4, 10]).map((v, i) => v * 16 + (i ? 14 : 8)), 'down');
    game.dayStartSnap = snapshot(game);
    if (game.settings.autosave !== false) game.save();
  } }, { t: 'fade', to: 0, dur: 0.8 }]));
}

register('system', 'day', {
  init(game) {
    game.sleep = (opts) => sleep(game, opts);
    game.sleepPrompt = () => game.run([{ t: 'say', who: null, mood: null, text: game.minutes < 18 * 60 ? 'It\'s still early. Go to sleep anyway?' : 'Go to sleep for the night?' },
      { t: 'choice', prompt: 'Sleep?', options: [{ text: 'Sleep until morning', steps: [{ t: 'call', fn: () => { setTimeout(() => sleep(game), 0); } }] }, { text: 'Not yet', steps: [] }] }]);
    game.bus.on('passOut', () => sleep(game, { passedOut: true }));
    game.bus.on('gameStart', () => { game.dayStartSnap = snapshot(game); });
    game.bus.on('gameLoaded', () => { game.dayStartSnap = snapshot(game); });
    game.bus.on('itemGot', (e) => game.stat('itemsFound', e.n));
    game.useItem = (id) => {
      const it = get('item', id);
      if (!it || !game.has(id)) return;
      if (it.use) { const keep = it.use(game); if (keep !== true && it.consumable !== false) game.take(id, 1); game.bus.emit('itemUsed', { item: id }); return; }
      if (it.energy) {
        if (game.state.energy >= game.state.maxEnergy) { game.toast('Not hungry right now'); return; }
        game.take(id, 1); game.addEnergy(it.energy); game.addMood(it.mood || 2); game.sfx('eat'); game.toast(`Ate ${it.name}: +${it.energy} energy`, it.icon);
        game.stat('eaten'); game.bus.emit('itemUsed', { item: id, ate: true });
      }
    };
  },
});

features('Daily life', [
  'Day/time clock from 6 AM to 2 AM; time only passes while walking around',
  'Sleep in bed to end the day, with a confirmation',
  'End-of-day summary: coins earned, people talked to, friendship gained, items found, tomorrow\'s forecast',
  'Go to bed after midnight and you wake with less energy',
  'Stay up until 2 AM and Misa passes out; Mochi finds her and she wakes late and tired',
  'Energy bar: activities cost energy, food restores it',
  'Eat food from the bag to restore energy and mood',
  'Weather forecast for tomorrow shown before sleeping',
  'Autosave every time you sleep (can be turned off)',
]);
