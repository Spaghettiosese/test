// Story sprites and items: the seven prisms, the brass button, the Keeper Journal, clue props and story key items.
import { register, registerMany } from '../../core/registry.js';
import { defineSprite as def } from '../../art.js';
import { itemIcon } from '../../gfx/icons.js';

const INK = '#2a1a22', GOLD = '#ffd76a', GOLD2 = '#e8a83a', WHITE = '#fffaf0', CREAM = '#f4e4c1';

// ---------- world props ----------
for (let f = 0; f < 2; f++) {
  def(`story_sparkle_${f}`, 15, 15, (R) => {
    const c = f ? WHITE : GOLD, r = f ? 6 : 4;
    R(7, 7 - r, 1, r * 2 + 1, c); R(7 - r, 7, r * 2 + 1, 1, c);
    R(6, 6, 3, 3, f ? GOLD : WHITE); R(7, 7, 1, 1, WHITE);
    if (!f) { R(4, 4, 1, 1, GOLD2); R(10, 10, 1, 1, GOLD2); R(10, 4, 1, 1, GOLD2); R(4, 10, 1, 1, GOLD2); }
  }, { hd: true });
}
def('story_box', 26, 22, (R) => {
  R(0, 4, 26, 18, '#c9935a'); R(0, 4, 26, 3, '#e0b27a'); R(20, 7, 6, 15, '#a8743f'); R(11, 0, 4, 22, '#e8d4a8');
  R(1, 1, 10, 4, '#d8a46a'); R(15, 1, 10, 4, '#d8a46a'); R(3, 12, 6, 4, WHITE); R(4, 13, 4, 1, '#8a6a5a'); R(4, 15, 3, 1, '#8a6a5a');
}, { hd: true, outline: 'selective' });
const neko = (R, ox, oy) => {
  R.e(ox + 11, oy + 19, 10, 8, WHITE); R.e(ox + 11, oy + 9, 8, 7, WHITE);
  R(ox + 4, oy + 1, 4, 5, WHITE); R(ox + 14, oy + 1, 4, 5, WHITE); R(ox + 5, oy + 3, 2, 2, '#f7a1b1'); R(ox + 15, oy + 3, 2, 2, '#f7a1b1');
  R(ox + 7, oy + 9, 2, 2, INK); R(ox + 13, oy + 9, 2, 2, INK); R(ox + 10, oy + 12, 2, 1, '#e0707a');
  R(ox + 18, oy + 2, 4, 9, WHITE); R(ox + 18, oy + 2, 4, 2, '#f0e6d8');
  R(ox + 5, oy + 15, 12, 2, '#e0707a'); R.e(ox + 11, oy + 18, 2, 2, GOLD); R.e(ox + 11, oy + 23, 5, 3, GOLD); R(ox + 8, oy + 23, 6, 1, GOLD2);
  R(ox + 3, oy + 26, 16, 2, '#d8ccc0');
};
def('story_neko', 23, 28, (R) => neko(R, 0, 0), { hd: true, outline: 'selective' });
def('story_neko_mochi', 25, 36, (R) => {
  neko(R, 1, 8);
  R.e(12, 7, 11, 5, '#e8964a'); R.e(12, 8, 9, 3, '#f4c890'); R(3, 4, 3, 3, '#e8964a'); R(7, 3, 3, 3, '#e8964a');
  for (let i = 0; i < 4; i++) R(6 + i * 4, 3, 1, 4, '#c06a2a'); R(5, 6, 2, 1, INK); R(19, 9, 5, 2, '#e8964a');
}, { hd: true, outline: 'selective' });
def('story_paper_star', 13, 13, (R) => {
  R.t([6, 0], [9, 5], [3, 5], CREAM); R.t([0, 5], [12, 5], [6, 9], CREAM); R.t([6, 7], [1, 12], [3, 6], '#e8d4a8'); R.t([6, 7], [11, 12], [9, 6], '#e8d4a8');
  R(6, 1, 1, 1, '#e0707a'); R(5, 5, 3, 2, WHITE);
}, { hd: true, outline: 'selective' });
def('story_poster', 22, 28, (R) => {
  R(0, 0, 22, 28, '#2a3a6a'); R(1, 1, 20, 26, '#3b4f8a');
  for (const [x, y] of [[4, 4], [15, 6], [9, 10], [17, 14], [5, 15], [12, 3]]) R(x, y, 1, 1, WHITE);
  R(4, 4, 6, 1, '#9cc8e8'); R(9, 10, 1, 5, '#9cc8e8');
  R.e(11, 20, 5, 3, GOLD); R(3, 24, 16, 2, WHITE); R(10, 0, 2, 2, '#e0707a');
}, { hd: true, outline: 'selective' });
def('story_bunting', 28, 12, (R) => {
  R(0, 1, 28, 1, '#7a5a4a');
  ['#e0707a', '#ffd76a', '#86cdb0', '#7fb2e0'].forEach((c, i) => R.t([1 + i * 7, 2], [6 + i * 7, 2], [3 + i * 7, 9], c));
}, { hd: true });

// ---------- items ----------
const PRISM = {
  vega: ['Vega', '#9cc8f0', 'The first prism, from Grandma\'s trunk. It glows the blue of a summer night.'],
  altair: ['Altair', '#f0e090', 'The second prism, once the jewel bearing of the clock tower chime.'],
  deneb: ['Deneb', '#c8f0e8', 'The third prism, set in Captain Jun\'s lucky lure for twenty years.'],
  sirius: ['Sirius', '#e0f0ff', 'The fourth prism, hidden in the eyepiece of the old school telescope.'],
  spica: ['Spica', '#d0b8f0', 'The fifth prism, kept behind the shrine\'s ema board.'],
  polaris: ['Polaris', '#fff2c0', 'The sixth prism, from the bottom of a sugar jar at Cafe Kumo.'],
  little: ['Little Lantern', '#ffc890', 'The seventh prism. It was inside the brass button all along.'],
};
export const PRISMS = Object.keys(PRISM);
for (const [k, [name, c, desc]] of Object.entries(PRISM)) {
  register('item', `story_prism_${k}`, { name: `${name} Prism`, desc, cat: 'key', key: true, price: 0, icon: itemIcon('gem', { c }), tags: ['story', 'prism'] });
}
registerMany('item', {
  story_brass_button: { name: 'Brass Button', desc: 'A dull brass button Mochi brought you. Engraved with a tiny star. It feels warm, somehow.', cat: 'key', key: true, price: 0, icon: itemIcon('coin', { c: '#c8a048' }) },
  story_keeper_journal: { name: 'Keeper Journal', desc: 'Grandma Hana\'s journal from her lighthouse years. Read it in the Diary app on your phone.', cat: 'key', key: true, price: 0, icon: itemIcon('book', { c: '#7a4a6a' }) },
  story_attic_key: { name: 'Attic Key', desc: 'A little iron key with a star-shaped bow. It was under the lucky cat statue.', cat: 'key', key: true, price: 0, icon: itemIcon('key', { c: '#a8a8b8' }) },
  story_paper_star: { name: 'Paper Star', desc: '"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch."', cat: 'key', key: true, price: 0, icon: itemIcon('star', { c: CREAM }) },
  story_moon_lure: { name: 'Borrowed Lure', desc: 'Captain Jun\'s silver night lure. Moon Bream only bite after dark, off the end of the pier.', cat: 'key', key: true, price: 0, icon: itemIcon('tool', { c: '#c8d0dc' }) },
  story_moon_bream: { name: 'Moon Bream', desc: 'A silver fish with a pale round spot like a full moon. Captain Jun will want to see this!', cat: 'key', key: true, price: 0, icon: itemIcon('fish', { c: '#d8dcf0' }) },
  story_sakura_petals: { name: 'Sakura Petals', desc: 'Fresh petals from the big cherry tree in Sakura Park. For Starlight Mochi.', cat: 'key', key: true, price: 0, icon: itemIcon('flower', { c: '#f7a1b1' }) },
  story_rice_flour: { name: 'Mochi Rice Flour', desc: 'A paper bag of glutinous rice flour from Sunny Mart. For Starlight Mochi.', cat: 'key', key: true, price: 0, icon: itemIcon('box', { c: '#f4f0e8' }) },
  story_sea_salt: { name: 'Pinch of Sea Salt', desc: 'Salt crystals scraped from the rocks on Shell Beach. For Starlight Mochi.', cat: 'key', key: true, price: 0, icon: itemIcon('rock', { c: '#e8f0f8' }) },
  story_starlight_mochi: { name: 'Starlight Mochi', desc: 'Grandma\'s recipe: pale pink mochi dusted with sea salt, with a star pressed on top.', cat: 'key', key: true, price: 0, icon: itemIcon('sweet', { c: '#f8c8d8' }) },
  story_music_box: { name: 'Lantern Music Box', desc: 'A tiny brass lighthouse. When wound, its lamp turns and it plays Grandma\'s song.', cat: 'key', key: true, price: 0, icon: itemIcon('toy', { c: '#c8a048' }) },
  story_music_key: { name: 'Music Box Key', desc: 'A winding key no bigger than a fingernail, found in the clock tower.', cat: 'key', key: true, price: 0, icon: itemIcon('key', { c: '#e8c060' }) },
  story_recipe_card: { name: 'Recipe Card', desc: 'A card from Mika\'s mum\'s lost recipe box, in neat looping handwriting.', cat: 'key', key: true, price: 0, icon: itemIcon('paper', { c: '#fff1d6' }) },
  story_band_poster: { name: 'Band Poster', desc: 'The poster from your Culture Festival gig, signed by the whole band.', cat: 'decor', price: 0, icon: itemIcon('paper', { c: '#e0707a' }) },
  story_stamp_album: { name: 'Stamp Album', desc: 'Pip\'s gift: an album of stamps from twenty years of Hoshimori mail.', cat: 'key', key: true, price: 0, icon: itemIcon('book', { c: '#5a8cc0' }) },
  story_postie_cap: { name: 'Honorary Postie Cap', desc: 'A blue cap with a red band. Pip says it makes you an official Hoshimori postie.', cat: 'key', key: true, price: 0, icon: itemIcon('hat', { c: '#5a8cc0' }) },
  story_rival_notes: { name: 'Rival\'s Notes', desc: 'Rina\'s colour-coded study notes. With these, exams feel a little easier.', cat: 'key', key: true, price: 0, icon: itemIcon('book', { c: '#f0d878' }) },
  story_keeper_badge: { name: 'Keeper\'s Badge', desc: 'A star-shaped pin. Proof that you are the new Keeper of the Star Lantern.', cat: 'key', key: true, price: 0, icon: itemIcon('star', { c: GOLD }) },
});
