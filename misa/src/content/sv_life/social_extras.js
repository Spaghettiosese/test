// Mail and social extras: Stardew-style letters from townspeople at friendship milestones (3, 5, 7 and 10 hearts) with small gifts,
// recipe cards and Star Stickers (arriving the next morning; the built-in 4/6/8 heart perks and thank-you notes stay as they are),
// plus the Bay Gazette TV segment: weather and one piece of town gossip per day.
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, drawText, drawTextC, wrap } from '../../ui/ui.js';
import { SPRITES } from '../../art.js';
import { sprite } from '../../artcache.js';
import { dateText } from '../../core/time.js';
import { TV_CHANNELS } from '../ui/tv.js';
import { S, pick, has, nameOf, giveOr, stickers, people } from './state.js';

// npc: [h3 line, recipe card id, h7 gift item, h10 line]
const FOLK = {
  mika: ['The cafe has been busier since you started dropping by. I think you are the lucky charm.', 'dish_kumo_omurice', 'gift_tea_tin', 'You are family to Cafe Kumo now. Your cup is always on the shelf.'],
  jun: ['The sea is calmer when you are on the pier. Coincidence? Probably. Still.', 'dish_squid_skewer', 'gift_lucky_lure', 'You are the best deckhand I never hired. Thanks for the company, kid.'],
  kiko: ['The wind chimes rang your name this morning. I did not hang a chime with your name on it.', 'drink_petal_tea', 'gift_wind_chime', 'You belong to the shrine path as much as the shrine belongs to you.'],
  goro: ['Daifuku keeps staring at your gate. I think he wants to say hello.', 'dish_baked_sweet_potato', 'mat_fertiliser', 'This garden is as much yours as mine. Do not tell the tomatoes.'],
  sachiko: ['Everyone at the mart asks about you. I tell them you are an investment.', 'dish_pumpkin_pudding', 'gift_jam', 'If the mart ever closes, I will blame you for making me too happy to retire.'],
  suzu: ['I wrote a character who is a little like you. She is brave and snacks a lot.', 'dish_sweet_potato_cake', 'gift_sketchbook', 'You are in every chapter of my best story. Thank you for being real.'],
  hina: ['I saw a bug today that reminded me of you. Very quiet, extremely clever.', 'dish_garden_salad', 'gift_pressed_flower', 'The garden grows better when you are near. That is science. Probably.'],
  hana: ['Dear, I found your name in my notebook. Under "very important". Next to "buy soap".', 'dish_sakura_mochi', 'gift_pressed_flower', 'I might forget a lot of things, but the shape of you in my heart stays put.'],
  kai: ['Coach said I played better when you cheered. So... keep cheering, I guess.', 'dish_grilled_corn', 'gift_sports_towel', 'You are my best friend. Okay, that was embarrassing. Do not tell the team.'],
  theo: ['I drew your cat from memory. It looks like a loaf of bread. I hope that is fine.', 'drink_matcha_latte', 'gift_star_sketch', 'You gave my colours a reason. Thank you.'],
  rina: ['I will deny writing this. But thank you for the competition. It keeps me sharp.', 'dish_apple_pie', 'gift_gold_stationery', 'Fine. You are a friend. Do not make it weird. Also: it is great.'],
  pip: ['Your mailbox is my favourite stop. It always has a little snack ledge. Never change it.', 'dish_edamame', 'gift_postcard', 'Seen from my bike, this town is bright because you are in it.'],
  tobias: ['A person who listens to a clock is a person worth knowing. I wanted you to know that.', 'dish_dorayaki', 'mat_spring', 'Time well spent: the hours I have spent with you.'],
  ogawa: ['The greenhouse tomatoes ask about you. I translate for them.', 'dish_corn_soup', 'gift_sports_towel', 'I am prouder of you than of any trophy. And I have many trophies.'],
  fujita: ['If you ever need a star chart or a sensible adult, I am available for both.', 'drink_yuzu_tea', 'gift_star_chart', 'The universe is huge, and I am very glad you are in my little corner of it.'],
};
export function mailFor(g, npc, hearts) {
  const d = FOLK[npc]; if (!d || !get('npc', npc)) return null;
  const n = nameOf(npc), id = `svl_h${hearts}_${npc}`, s = S(g);
  if (s.sent[id]) return null; s.sent[id] = 1;
  const m = { day: g.day + 1, id, from: npc };
  if (hearts === 3) Object.assign(m, { text: `${d[0]} Here is a small thing for you. - ${n}`, coins: 50 });
  if (hearts === 5) Object.assign(m, { text: `I wrote my favourite recipe on a card for you. Cook it for someone you like. - ${n}`, recipe: d[1] });
  if (hearts === 7) Object.assign(m, { text: `A little something I found that made me think of you. - ${n}`, item: d[2], coins: 120 });
  if (hearts === 10) Object.assign(m, { text: `${d[3]} - ${n}`, stickers: 2, item: d[2], coins: 200 });
  if (!m.text) return null;
  s.mailQ.push(m); return m;
}
function deliver(g) {
  const s = S(g), now = s.mailQ.filter((m) => m.day <= g.day); s.mailQ = s.mailQ.filter((m) => m.day > g.day);
  for (const m of now) {
    g.mail(m.id, nameOf(m.from), m.text);
    if (m.recipe && g.learnRecipe) g.learnRecipe(m.recipe, nameOf(m.from));
    if (m.item || m.coins) giveOr(g, m.item, m.coins || 0);
    else if (m.coins) g.addMoney(m.coins);
    if (m.stickers) stickers(g, m.stickers, nameOf(m.from));
    g.toast(`${nameOf(m.from)} sent you a gift!`, 'i_mail'); g.stat('svMilestoneMail');
  }
}
register('system', 'svl_social', {
  init(game) {
    game.bus.on('heartUp', (e) => { if (e && [3, 5, 7, 10].includes(e.hearts)) mailFor(game, e.npc, e.hearts); });
    game.bus.on('dayStart', () => deliver(game));
  },
});

// ---------------------------------------------------------------- Bay Gazette
const PLACES = ['the harbour', 'the park pond', 'Cafe Kumo', 'the clock shop', 'the school roof', 'the shrine steps', 'Sunny Mart', 'the library', 'the beach', 'the Shotengai'];
const GOSSIP = [
  '{a} was seen carrying three umbrellas near {p}. It was not raining. Nobody asked.',
  '{a} and {b} argued about the best onigiri filling at {p}. The score is tied.',
  'A mysterious cat has been sleeping on the best bench at {p}. Witnesses say it looks smug.',
  '{a} says the tide is higher this week. {b} says {a} says that every week.',
  'Someone left a perfectly good cake outside {p}. {a} has denied everything.',
  '{a} has taken up knitting. {b} has asked for a scarf. The scarf is now 4 metres long.',
  'The wind chimes at {p} rang all by themselves. {a} blames the wind. The wind is not available for comment.',
  '{a} lost a bet to {b} and must wear a silly hat all week. It is a very silly hat.',
  'A new rumour says there are secret notes hidden around town. {a} refuses to confirm or deny.',
  '{a} was spotted practising a speech to {p}. {p} did not respond.',
  'Local legend: if you wish at the fountain before noon, {a} gets very jealous. Reason unknown.',
  '{b} was heard humming a mysterious song near {p}. {a} says it was a jingle for pickles.',
  'Business is booming at {p}. Experts credit the weather, the snacks and a very polite customer.',
  '{a} found a coin under a vending machine and announced it as "the find of the century".',
  'The town sign has a new tilt. {a} says it is "more confident now".',
];
export function gossip(g) {
  const r = g.rngFor('svgossip'), ppl = people().map((n) => n.name), a = pick(r, ppl) || 'Someone', b = pick(r, ppl.filter((x) => x !== a)) || 'Somebody';
  return pick(r, GOSSIP).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{p\}/g, pick(r, PLACES));
}
const WORD = { sunny: 'sunny skies', cloudy: 'cloudy', rain: 'rain', storm: 'thunderstorms', snow: 'snow', windy: 'strong winds' };
const WIC = { sunny: 'i_sun', cloudy: 'i_cloud', rain: 'i_rain', storm: 'i_storm', snow: 'i_snow', windy: 'i_wind' };
TV_CHANNELS.push({ id: 'svl_gazette', name: 'Bay Gazette', blurb: 'Weather and one piece of town gossip, daily.', when: () => true,
  draw(g, t, x, y, w, h, game) {
    rect(g, '#efe3c6', x, y, w, h); rect(g, '#3a2a30', x + 6, y + 6, w - 12, 14); drawTextC(g, 'THE BAY GAZETTE', x + w / 2, y + 10, '#efe3c6', 1, null);
    drawText(g, dateText(game.day).toUpperCase(), x + 8, y + 24, '#6a5a4a', 1, null);
    const ic = WIC[game.weather] && SPRITES[WIC[game.weather]] ? WIC[game.weather] : 'i_sun'; g.drawImage(sprite(ic), x + w - 28, y + 24 + Math.round(Math.sin(t * 3)));
    for (let i = 0; i < 7; i++) rect(g, '#b8a888', x + 8, y + 40 + i * 9, i % 3 === 2 ? 90 : 150, 3);
    rect(g, '#cdbf9c', x + 8, y + h - 36, 70, 28); rect(g, '#a89868', x + 12, y + h - 32, 62, 20);
  },
  watch(game) {
    game.addXP('charm', 2); game.stat('gazettes');
    return `Bay Gazette: today is ${WORD[game.weather] || 'mixed'}, tomorrow brings ${WORD[game.state.tomorrowWeather] || 'a surprise'}. Gossip: ${gossip(game)}`;
  } });

features('Town Life', [
  'Townspeople mail Misa at 3 hearts with a small thank-you gift of coins',
  'At 5 hearts a friend mails a handwritten recipe card that teaches Misa a new dish',
  'At 7 hearts a friend mails a personal gift item chosen for them',
  'At 10 hearts a heartfelt letter arrives with Star Stickers, a gift and coins',
  'Milestone letters from fifteen townspeople each have their own voice',
  'Bay Gazette TV segment: today\'s weather, tomorrow\'s weather and one piece of town gossip, new every day',
  'Fifteen different gossip lines built from real townspeople and town places',
]);
