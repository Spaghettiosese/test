// Story Acts II and III art: items (letters, keepsakes), world dressing sprites and 12 full-screen cutscene backdrops.
import { register, registerMany, get } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { drawChar } from '../../gfx/chars.js';
import { drawText, drawTextC } from '../../font.js';
import { spr, RAMPS as K, signText, signW } from '../town/lib.js';
import { LETTERS } from './state.js';

// ---------------------------------------------------------------- items
const key = (name, desc, shape, c) => ({ name, desc, cat: 'key', key: true, price: 0, icon: itemIcon(shape, { c }), tags: ['story', 'sv3'] });
for (let k = 1; k < LETTERS.length; k++) register('item', `sv3_letter_${k}`, key(`Tidekeeper Letter ${k}`, `"${LETTERS[k][0]}". A letter sealed with a tiny wave and signed T.K.`, 'letter', '#cfe8f0'));
registerMany('item', {
  sv3_item_tidechart: key('Tide Chart', 'A hand-drawn chart of the bay with five small lanterns marked on it, and tide times in a looping hand.', 'paper', '#e8dcc0'),
  sv3_fox_lantern: key('Fox Lantern', 'Grandma Hana\'s battered hand lantern from her night rounds, with a tiny wave scratched on the base.', 'toy', '#e8a860'),
  sv3_wax_key: key('Wax Key', 'Theo took a wax impression of the office lock and drew the key from it. It is mostly pencil.', 'key', '#e8c060'),
  sv3_crab_bucket: key('Bucket of Crabs', 'Hina\'s emergency distraction. They are very polite crabs. Mostly.', 'box', '#7fb2e0'),
  sv3_earpiece: key('Spare Earpiece', 'Kai\'s radio. It crackles when he laughs, which is often.', 'tool', '#9aa0b8'),
  sv3_petition: key('Petition Sheet', 'A long sheet headed "Keep the Hall, Keep the School" with room for many names.', 'paper', '#fff1d6'),
  sv3_play_script: key('Play Script', 'Suzu\'s script for "The Keeper\'s Daughter", with your lines highlighted in pink.', 'book', '#e0707a'),
  sv3_blueprint: key('Seaglass Blueprint', 'Plans for the Hoshimori Marina Resort. The Community Hall is a small grey rectangle labelled REMOVE.', 'paper', '#9cc8e8'),
  sv3_camp_lantern: key('Camp Lantern', 'A little battery lantern from the school camping trip, scratched with everyone\'s initials.', 'toy', '#ffd08a'),
  sv3_envelope_sea: key('Envelope with a Ship Stamp', 'From Mum and Dad: a berth on the Kujira for one year, if you want it.', 'letter', '#9cc8e8'),
  sv3_envelope_school: key('Envelope with a School Crest', 'A recommendation for the Kaibara Marine Science scholarship, signed by Ms. Fujita.', 'letter', '#f0d878'),
  sv3_envelope_town: key('Envelope with a Lantern Seal', 'From the town council: the keys to the Hall, and a very small salary, if you want to stay.', 'letter', '#f4a860'),
  sv3_tide_bell: { name: 'Tide Bell Charm', desc: 'A palm-sized brass bell from the clock tower. It rings once when the tide turns, even indoors.', cat: 'decor', price: 0, icon: itemIcon('toy', { c: '#d8b050' }), tags: ['story', 'sv3'] },
  sv3_boat_lantern: { name: 'Little Lantern Boat', desc: 'One of a hundred paper boats. Yours kept its candle all the way across the bay.', cat: 'decor', price: 0, icon: itemIcon('toy', { c: '#f4a0a0' }), tags: ['story', 'sv3'] },
  sv3_hall_pennant: { name: 'Hall Pennant', desc: 'A green pennant with a lantern on it. The sprites say it is for luck. The sprites say many things.', cat: 'decor', price: 0, icon: itemIcon('toy', { c: '#7ac090' }), tags: ['story', 'sv3'] },
});

// ---------------------------------------------------------------- world dressing sprites
spr('sv3_tide_lamp', 22, 40, (R) => {
  R(9, 14, 4, 24, K.metal[1]); R(9, 14, 1, 24, K.metal[3]); R(6, 36, 10, 3, K.metal[0]);
  R(4, 3, 14, 13, K.metal[0]); R(5, 4, 12, 11, K.sky[3]); R(6, 5, 10, 9, K.mint[4]); R(9, 6, 4, 7, '#ffffff'); R(3, 1, 16, 3, K.metal[1]); R(9, 0, 4, 2, K.metal[2]);
});
spr('sv3_mural_glow', 72, 12, (R) => {
  for (let i = 0; i < 6; i++) { const x = 4 + i * 11; R(x, 2, 7, 1, K.mint[4]); R(x + 3, 2, 1, 7, K.sky[4]); R(x + 1, 5, 5, 1, K.mint[3]); R(x, 8, 7, 1, K.sky[3]); }
}, { outline: false });
spr('sv3_ema_row', 56, 22, (R) => {
  R(0, 0, 56, 2, K.wood[1]);
  for (let i = 0; i < 5; i++) { const x = 3 + i * 11; R(x + 4, 2, 1, 4, K.paper[3]); R(x, 6, 9, 11, K.wood[3]); R(x, 6, 9, 1, K.wood[4]); R(x + 2, 9, 5, 1, K.wood[0]); R(x + 2, 12, 4, 1, K.wood[0]); }
});
spr('sv3_gear_chain', 44, 26, (R) => {
  for (const [x, r] of [[4, 5], [18, 7], [34, 5]]) { R(x, 10 - r + 4, r * 2, r * 2, K.butter[3]); R(x + 2, 10 - r + 6, r * 2 - 4, r * 2 - 4, K.butter[2]); R(x + r - 1, 10 + 3, 2, 2, K.wood[0]); for (let i = 0; i < 4; i++) R(x + Math.round(i * (r * 2 / 3)), 10 - r + 2, 2, 2, K.butter[4]); }
  R(10, 12, 8, 2, K.butter[4]); R(26, 12, 8, 2, K.butter[4]);
});
spr('sv3_lantern_string', 96, 26, (R) => {
  R(0, 1, 96, 1, K.wood[1]);
  const cols = [K.coral, K.butter, K.sky, K.mint, K.lilac];
  for (let i = 0; i < 6; i++) { const x = 3 + i * 16, c = cols[i % 5]; R(x + 4, 2, 1, 3, K.wood[1]); R(x, 5, 9, 11, c[2]); R(x + 1, 6, 7, 9, c[3]); R(x + 3, 8, 3, 5, K.butter[4]); R(x + 1, 16, 7, 1, K.wood[0]); }
}, { outline: false });
spr('sv3_lantern_boat', 26, 18, (R) => {
  R(2, 12, 22, 4, K.wood[2]); R(4, 15, 18, 2, K.wood[0]); R(2, 12, 22, 1, K.wood[4]);
  R(10, 3, 6, 9, K.coral[2]); R(11, 4, 4, 7, K.butter[4]); R(12, 6, 2, 3, '#ffffff'); R(10, 2, 6, 1, K.wood[0]);
});
const banner = (name, text, c1, c2) => spr(name, signW(text) + 14, 22, (R) => {
  const w = signW(text) + 14;
  R(0, 0, 2, 22, K.wood[1]); R(w - 2, 0, 2, 22, K.wood[1]); R(2, 2, w - 4, 14, c1); R(2, 2, w - 4, 2, c2); R(2, 14, w - 4, 2, K.wood[0]);
  signText(R, text, 7, 7, '#fffaf0'); R(3, 16, 4, 5, c1); R(w - 7, 16, 4, 5, c1);
});
banner('sv3_banner_hall', 'SAVE THE HALL', K.forest[2], K.forest[3]);
banner('sv3_banner_school', 'SAVE OUR SCHOOL', K.sky[1], K.sky[2]);
banner('sv3_banner_campus', 'OPEN CAMPUS', K.coral[2], K.coral[3]);
banner('sv3_banner_saved', 'HALL SAVED!', K.butter[2], K.butter[3]);
banner('sv3_banner_play', 'THE KEEPERS DAUGHTER', K.lilac[2], K.lilac[3]);
spr('sv3_hoarding', 64, 40, (R) => {
  R(0, 8, 64, 30, K.charcoal[2]); R(0, 8, 64, 3, K.charcoal[3]); R(0, 36, 64, 2, K.charcoal[0]);
  for (let i = 0; i < 8; i++) R(i * 8 + 1, 11, 6, 25, i % 2 ? K.charcoal[2] : K.charcoal[1]);
  R(4, 14, 56, 18, K.sky[3]); R(4, 14, 56, 2, K.sky[4]); signText(R, 'SEAGLASS', 10, 18, K.navy[1]); signText(R, 'MARINA SOON', 10, 25, K.navy[2]);
  R(0, 2, 3, 36, K.wood[1]); R(61, 2, 3, 36, K.wood[1]);
});
spr('sv3_emporium', 76, 64, (R) => {
  R(4, 26, 68, 36, K.paper[3]); R(4, 26, 68, 3, K.paper[4]); R(4, 58, 68, 4, K.wood[1]);
  for (let i = 0; i < 9; i++) R(2 + i * 8, 12, 8, 16, i % 2 ? '#fffaf0' : K.sky[2]);
  R(2, 12, 72, 2, K.sky[3]); R(2, 26, 72, 2, K.sky[1]);
  R(10, 32, 22, 22, K.navy[2]); R(11, 33, 20, 20, K.sky[4]); R(14, 38, 14, 10, K.mint[3]);
  R(40, 34, 28, 24, K.wood[3]); R(41, 35, 26, 4, K.wood[4]); R(44, 42, 8, 10, K.coral[2]); R(56, 42, 8, 10, K.butter[3]);
  R(14, 2, 48, 11, K.navy[1]); signText(R, 'SEAGLASS', 18, 4, '#fffaf0'); signText(R, 'EMPORIUM', 30, 9, K.sky[4]);
});
spr('sv3_tent', 52, 34, (R) => {
  for (let i = 0; i < 17; i++) { const h = 30 - Math.abs(i - 8) * 3; R(2 + i * 3, 33 - h, 3, h, i % 2 ? K.coral[2] : K.coral[3]); }
  R(22, 18, 8, 15, K.coral[0]); R(25, 20, 2, 13, K.butter[4]); R(24, 2, 4, 3, K.wood[1]);
});
spr('sv3_tent_blue', 52, 34, (R) => {
  for (let i = 0; i < 17; i++) { const h = 30 - Math.abs(i - 8) * 3; R(2 + i * 3, 33 - h, 3, h, i % 2 ? K.sky[1] : K.sky[2]); }
  R(22, 18, 8, 15, K.navy[0]); R(25, 20, 2, 13, K.butter[4]); R(24, 2, 4, 3, K.wood[1]);
});
spr('sv3_starry_tree', 56, 80, (R) => {
  R(24, 56, 8, 22, K.wood[1]); R(24, 56, 2, 22, K.wood[2]);
  for (let r = 0; r < 4; r++) { const w = 16 + r * 12, y = 8 + r * 14; R(28 - w / 2 + 0, y, w, 16, r % 2 ? K.forest[1] : K.forest[2]); R(28 - w / 2, y, w, 2, K.forest[3]); }
  R(26, 0, 4, 6, K.butter[4]); R(24, 2, 8, 2, K.butter[3]);
  [[14, 20, K.coral], [34, 24, K.butter], [20, 36, K.sky], [38, 40, K.coral], [12, 50, K.butter], [30, 52, K.mint], [24, 14, K.sky]].forEach(([x, y, c]) => { R(x, y, 4, 4, c[3]); R(x + 1, y + 1, 2, 2, '#ffffff'); });
});
spr('sv3_poster_play', 22, 30, (R) => {
  R(0, 0, 22, 30, K.paper[3]); R(1, 1, 20, 28, K.lilac[3]); R(3, 3, 16, 12, K.navy[1]); R(9, 6, 4, 6, K.butter[4]); R(3, 18, 16, 2, K.paper[4]); R(3, 22, 12, 2, K.paper[4]);
});

// ---------------------------------------------------------------- backdrops (320x224 paintings)
const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const hash = (i, k = 1) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const sky = (g, cols, h = 150) => cols.forEach((c, i) => R(g, c, 0, Math.floor((i * h) / cols.length), 320, Math.ceil(h / cols.length) + 1));
const stars = (g, t, n = 60, maxY = 120, seed = 1) => { for (let i = 0; i < n; i++) R(g, (Math.floor(t * 2 + i) % 9) === 0 ? '#8a7fb0' : '#fffaf0', hash(i, seed) * 320, hash(i, seed + 7) * maxY, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1); };
const sea = (g, y, t, c1 = '#1c2a54', c2 = '#2b3f78', gl = '#8cb8e0') => { R(g, c1, 0, y, 320, 224 - y); for (let r = 0; r < (224 - y) / 6; r++) for (let i = 0; i < 8; i++) R(g, r % 2 ? c2 : gl, ((i * 43 + r * 23 + t * (6 + r * 2)) % 350) - 15, y + 3 + r * 6, 10 + (i % 3) * 6, 1); };
const look = (id) => (get('npc', id) || {}).look || null;
const person = (g, id, x, y, dir = 'down', t = 0) => drawChar(g, id, id === 'misa' ? null : look(id), dir, 'idle', t, x, y);
const lamp = (g, x, y, c = '#ffd08a', r = 1) => { g.save(); g.globalAlpha = 0.25; R(g, c, x - 8 * r, y - 8 * r, 16 * r, 16 * r); g.globalAlpha = 0.5; R(g, c, x - 4 * r, y - 4 * r, 8 * r, 8 * r); g.restore(); R(g, '#fff6c0', x - 2, y - 2, 4, 4); };
const star5 = (g, cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); };
const lighthouse = (g, x, y, lit, t, c = '#fff4c0') => {
  R(g, '#e8e0f0', x - 5, y - 24, 11, 44); R(g, '#c84a4a', x - 5, y - 14, 11, 6); R(g, '#c84a4a', x - 5, y + 2, 11, 6); R(g, '#3b2a40', x - 7, y - 32, 15, 8); R(g, lit ? c : '#4a4060', x - 4, y - 30, 9, 6);
  if (lit) { g.save(); g.globalAlpha = 0.28; g.fillStyle = c; g.beginPath(); g.moveTo(x, y - 27); g.lineTo(x - 260, y - 40 + Math.sin(t) * 20); g.lineTo(x - 260, y + 10 + Math.sin(t) * 20); g.fill(); g.restore(); }
};
const vignette = (g) => { g.save(); for (let i = 0; i < 6; i++) { g.globalAlpha = 0.12; R(g, '#0a0612', 0, 0, 320, 4 + i * 3); R(g, '#0a0612', 0, 220 - i * 3, 320, 4 + i * 3); } g.restore(); };
const board = (g, x, y, w, h, c = '#4a3050') => { R(g, '#1a1226', x - 2, y - 2, w + 4, h + 4); R(g, c, x, y, w, h); };

const BD = {
  sv3_letter_desk: { music: 'night', draw(g, game, t) {
    R(g, '#2a1c30', 0, 0, 320, 224); R(g, '#3a2a40', 0, 140, 320, 84); R(g, '#5a3a3c', 20, 130, 280, 14); lamp(g, 250, 80, '#ffd08a', 3);
    R(g, '#f4ecd8', 90, 70, 140, 80); R(g, '#e0d4b8', 90, 70, 140, 4); for (let i = 0; i < 6; i++) R(g, '#8a7a6a', 104, 90 + i * 9, i % 3 === 2 ? 70 : 112, 2);
    R(g, '#4a8ab8', 196, 128, 22, 14); star5(g, 207, 135, 6, '#cfe8f0'); R(g, '#4a8ab8', 203, 133, 8, 1); R(g, '#e8f4ff', 200 + Math.sin(t * 2) * 1, 132, 14, 1);
    for (let i = 0; i < 18; i++) R(g, '#ffe9a0', 20 + hash(i) * 280, 20 + ((hash(i, 4) * 120 + t * 4) % 120), 1, 1); vignette(g);
  } },
  sv3_cave_stars: { music: 'night', draw(g, game, t) {
    R(g, '#0f0c1c', 0, 0, 320, 224); R(g, '#1e1a34', 0, 130, 320, 94);
    for (let i = 0; i < 70; i++) R(g, i % 7 ? '#6a8ac8' : '#e8f0ff', hash(i, 3) * 320, hash(i, 5) * 120, 1 + (i % 11 === 0), 1 + (i % 11 === 0));
    star5(g, 160, 100, 26 + Math.sin(t * 2) * 2, '#cfe8f0'); star5(g, 160, 100, 14, '#ffffff');
    for (let i = 0; i < 6; i++) R(g, '#2a4a6a', 20 + i * 52, 150 + (i % 2) * 8, 34, 6); R(g, '#1a2a44', 0, 190, 320, 34);
    for (let i = 0; i < 6; i++) R(g, '#8cc8e8', ((i * 61 + t * 12) % 330) - 10, 196 + (i % 3) * 8, 14, 1); person(g, 'hina', 90, 200, 'up', t); person(g, 'misa', 130, 204, 'up', t); vignette(g);
  } },
  sv3_harbour_mural: { music: 'night', draw(g, game, t) {
    R(g, '#14122a', 0, 0, 320, 224); R(g, '#2a2848', 0, 150, 320, 74); board(g, 30, 30, 260, 110, '#3a3858');
    for (let i = 0; i < 8; i++) { const x = 44 + i * 31, a = 0.35 + 0.35 * Math.sin(t * 2 + i); g.save(); g.globalAlpha = a; R(g, '#9cf0e0', x, 56, 22, 3); R(g, '#9cf0e0', x + 9, 56, 3, 30); R(g, '#7fd4f0', x, 72, 22, 3); R(g, '#9cf0e0', x + 4, 90, 14, 3); g.restore(); }
    R(g, '#4a4a78', 40, 108, 240, 4); for (let i = 0; i < 12; i++) R(g, ['#e0707a', '#ffd76a', '#7fb2e0'][i % 3], 50 + i * 20, 118, 8, 8);
    person(g, 'theo', 120, 210, 'up', t); person(g, 'misa', 170, 214, 'up', t); lamp(g, 40, 40, '#9cf0e0', 2); vignette(g);
  } },
  sv3_midsummer: { music: 'beach', draw(g, game, t) {
    sky(g, ['#14143a', '#2a2050', '#4a2a62', '#7a3a6a'], 140); stars(g, t, 40, 90, 5); sea(g, 140, t, '#241c48', '#3a2c66', '#e090b0'); lighthouse(g, 270, 150, true, t);
    for (let k = 0; k < 4; k++) { const ph = (t * 0.6 + k * 0.9) % 3.4, x = 40 + k * 70 + Math.sin(k) * 20, y = 130 - ph * 40; if (ph < 3) { const c = ['#ff7aa0', '#ffd76a', '#7ae8c8', '#9cc8ff'][k]; for (let a = 0; a < 14; a++) { const an = (a / 14) * Math.PI * 2, r = ph * 10; R(g, c, x + Math.cos(an) * r, y + Math.sin(an) * r, 2, 2); } } }
    R(g, '#c8a878', 0, 176, 320, 48); R(g, '#e8c898', 0, 176, 320, 3); R(g, '#e86a2a', 150, 188, 18, 8); R(g, '#ffd04a', 154 + Math.sin(t * 9), 180, 10, 10);
    ['kai', 'hina', 'suzu', 'theo', 'rina'].forEach((id, i) => person(g, id, 60 + i * 44, 206, 'up', t + i)); person(g, 'misa', 160, 216, 'up', t); vignette(g);
  } },
  sv3_typhoon: { music: 'night', draw(g, game, t) {
    sky(g, ['#10121e', '#1c2034', '#2a3048', '#3a4258'], 120); sea(g, 110, t * 3, '#16203a', '#26385c', '#aac4e0');
    for (let i = 0; i < 70; i++) R(g, '#9ab0d0', (hash(i, 8) * 360 + t * 160) % 340 - 10, (hash(i, 9) * 224 + t * 260) % 224, 1, 8);
    lighthouse(g, 90, 112, true, t * 2, '#ffe9a0'); R(g, '#3a3050', 0, 170, 320, 54); R(g, '#4a4060', 0, 170, 320, 3);
    for (let i = 0; i < 4; i++) { R(g, '#6a5a50', 130 + i * 40, 150, 4, 24); R(g, '#8a5a40', 126 + i * 40, 146, 12, 6); }
    if (Math.floor(t * 3) % 11 === 0) R(g, 'rgba(255,255,255,.35)', 0, 0, 320, 224); vignette(g);
  } },
  sv3_hundred_lights: { music: 'title', draw(g, game, t) {
    sky(g, ['#0c1030', '#1a1c4a', '#2c2860', '#5a3a70'], 130); stars(g, t, 70, 100, 9); sea(g, 130, t, '#14204a', '#24366a', '#ffb878'); lighthouse(g, 280, 130, true, t * 0.6, '#d8fff0');
    for (let i = 0; i < 46; i++) { const x = (hash(i, 2) * 340 + t * (6 + hash(i, 3) * 6)) % 340 - 10, y = 140 + hash(i, 4) * 76; R(g, '#5a3a40', x, y + 3, 7, 2); R(g, '#ffb860', x + 2, y, 3, 3); g.save(); g.globalAlpha = 0.3; R(g, '#ffb860', x - 3, y - 3, 13, 9); g.restore(); }
    R(g, '#c8a878', 0, 200, 320, 24); person(g, 'hana', 140, 218, 'up', t); person(g, 'misa', 170, 220, 'up', t); person(g, 'tobias', 110, 218, 'up', t); vignette(g);
  } },
  sv3_council: { music: 'library', draw(g, game, t) {
    R(g, '#2a2030', 0, 0, 320, 224); R(g, '#4a3a3a', 0, 130, 320, 94); R(g, '#6a4a3c', 0, 130, 320, 4);
    for (let i = 0; i < 5; i++) { lamp(g, 30 + i * 65, 30 + (i % 2) * 6, '#ffd08a', 1); R(g, '#7a5a4a', 29 + i * 65, 0, 2, 26 + (i % 2) * 6); }
    R(g, '#6a4030', 70, 100, 180, 24); R(g, '#8a5a40', 70, 100, 180, 4); R(g, '#e8dcc0', 120, 90, 28, 10); R(g, '#9cc8a0', 180, 92, 22, 8);
    ['mika', 'sachiko', 'jun', 'goro', 'kiko'].forEach((id, i) => person(g, id, 40 + i * 54, 160, 'up', t + i)); person(g, 'misa', 160, 204, 'up', t);
    board(g, 114, 14, 92, 34, '#e8dcc0'); drawTextC(g, 'COMMUNITY HALL', 160, 20, '#3a2a30', 1, null); drawTextC(g, 'TOWN MEETING', 160, 32, '#7a3a3a', 1, null); vignette(g);
  } },
  sv3_camp: { music: 'night', draw(g, game, t) {
    sky(g, ['#080a1e', '#10163a', '#1c2050', '#2a2c64'], 120); stars(g, t, 90, 110, 11); R(g, '#e8e8f8', 250, 24, 14, 14); R(g, '#080a1e', 255, 22, 12, 14);
    sea(g, 120, t, '#10183a', '#1c2a58', '#6a88c0'); R(g, '#c8a878', 0, 150, 320, 74); R(g, '#e8c898', 0, 150, 320, 3);
    R(g, '#d85a4a', 28, 156, 54, 36); R(g, '#a83a30', 28, 184, 54, 8); R(g, '#4a88c0', 238, 150, 54, 36); R(g, '#2a5890', 238, 178, 54, 8);
    const f = Math.floor(t * 8) % 3; g.save(); g.globalAlpha = 0.25; R(g, '#ff9a3a', 120, 156, 80, 56); g.restore();
    R(g, '#5a3a28', 144, 196, 32, 5); R(g, '#e86a2a', 148, 182 - f, 24, 14); R(g, '#ffd04a', 154, 176 - f, 12, 12); R(g, '#fff6c0', 158, 184 - f, 4, 6);
    ['kai', 'hina', 'suzu', 'theo', 'rina'].forEach((id, i) => person(g, id, 96 + i * 32, 208 + (i % 2) * 6, 'up', t + i)); person(g, 'misa', 172, 218, 'up', t); vignette(g);
  } },
  sv3_heist: { music: 'night', draw(g, game, t) {
    sky(g, ['#080a18', '#101428', '#1a1e38'], 120); stars(g, t, 30, 90, 13); R(g, '#e8e8f8', 40, 26, 12, 12);
    R(g, '#242038', 0, 120, 320, 104); R(g, '#1a1830', 0, 190, 320, 34); for (let i = 0; i < 4; i++) { R(g, '#3a3450', 20 + i * 80, 80, 60, 70); R(g, '#2a2640', 20 + i * 80, 76, 60, 6); R(g, i === 2 ? '#ffd76a' : '#2a2a48', 36 + i * 80, 96, 10, 12); }
    const sw = Math.sin(t * 1.3) * 100 + 160; g.save(); g.globalAlpha = 0.28; g.fillStyle = '#fff4c0'; g.beginPath(); g.moveTo(sw, 40); g.lineTo(sw - 50, 200); g.lineTo(sw + 50, 200); g.fill(); g.restore();
    R(g, '#6a6a80', 80, 168, 8, 22); person(g, 'misa', 168, 206, 'up', t); person(g, 'kai', 60, 188, 'right', t); vignette(g);
  } },
  sv3_stage: { music: 'school', draw(g, game, t) {
    R(g, '#1a1226', 0, 0, 320, 224); R(g, '#6a2a3c', 0, 0, 60, 224); R(g, '#6a2a3c', 260, 0, 60, 224); R(g, '#8a3a4c', 50, 0, 12, 224); R(g, '#8a3a4c', 258, 0, 12, 224);
    R(g, '#2a2848', 60, 20, 200, 110); for (let i = 0; i < 40; i++) R(g, '#fffaf0', 70 + hash(i, 6) * 180, 26 + hash(i, 7) * 60, 1, 1);
    star5(g, 160, 60, 22 + Math.sin(t * 2) * 2, '#ffe9a0'); R(g, '#8a6a4a', 60, 130, 200, 10); R(g, '#a8845a', 60, 130, 200, 3);
    for (let i = 0; i < 9; i++) lamp(g, 70 + i * 22, 14, i % 2 ? '#ffd08a' : '#f4a0b8', 1);
    person(g, 'misa', 160, 168, 'down', t); person(g, 'suzu', 110, 164, 'down', t); person(g, 'kai', 210, 164, 'down', t);
    for (let i = 0; i < 20; i++) R(g, '#0c0816', i * 17, 200 + (i % 3) * 5, 14, 24); vignette(g);
  } },
  sv3_hearing: { music: 'library', draw(g, game, t) {
    R(g, '#e8dcc0', 0, 0, 320, 224); R(g, '#d0c0a0', 0, 150, 320, 74); for (let i = 0; i < 4; i++) { R(g, '#fff6dc', 24 + i * 78, 20, 48, 70); R(g, '#9cc8e8', 28 + i * 78, 24, 40, 62); }
    R(g, '#6a4a3a', 60, 112, 200, 20); R(g, '#8a6a52', 60, 112, 200, 3);
    R(g, '#2a3a5a', 140, 80, 40, 34); R(g, '#f2c9a4', 152, 68, 16, 16); R(g, '#1a1a2a', 150, 62, 20, 8); drawTextC(g, 'MR. KUROKAWA', 160, 124, '#fffaf0', 1, null);
    ['hana', 'tobias', 'fujita', 'mika'].forEach((id, i) => person(g, id, 50 + i * 40, 178, 'up', t + i)); ['rina', 'kai', 'suzu'].forEach((id, i) => person(g, id, 214 + i * 30, 180, 'up', t + i));
    person(g, 'misa', 160, 210, 'up', t); lamp(g, 160, 14, '#fff4c0', 2); vignette(g);
  } },
  sv3_envelopes: { music: 'night', draw(g, game, t) {
    R(g, '#1a1428', 0, 0, 320, 224); R(g, '#2a2038', 0, 130, 320, 94); lamp(g, 160, 40, '#ffd08a', 4); R(g, '#5a3a3c', 40, 130, 240, 14);
    const cols = ['#9cc8e8', '#f0d878', '#f4a860', '#cfe8f0']; ['SEA', 'SCHOOL', 'TOWN', '???'].forEach((s, i) => { const x = 50 + i * 60, y = 96 + Math.sin(t * 2 + i) * 3; R(g, '#2a1a22', x - 1, y - 1, 50, 36); R(g, cols[i], x, y, 48, 34); R(g, '#00000022', x, y, 48, 2); drawTextC(g, s, x + 24, y + 13, '#2b1d2e', 1, null); if (i === 3) star5(g, x + 24, y + 26, 5, '#4a8ab8'); });
    person(g, 'misa', 160, 210, 'up', t); person(g, 'pip', 260, 214, 'left', t); vignette(g);
  } },
};
for (const [id, d] of Object.entries(BD)) register('backdrop', id, d);
export { BD };
