// Hobby Journal phone app (skills, best works, ribbons), the stationery & hobby stall (shop), achievements and world hooks.
// Try it: __misa.warp('shotengai', 28, 9, 'up') for the stationery stall.
import { register, get, features } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawText } from '../../font.js';
import { panel, btn, rect, C, inside } from '../economy/gfx.js';
import { chooseProfession, describe, chosen, optionsFor } from '../sv_explore/prof.js';
import { S, HOBBIES, pendingHobbyProfs, addObjects } from './state.js';
import { SONGS } from '../../minigames/sv4_hobbies/songs.js';
import { novelDone } from './writing.js';
import { ALBUMS } from './music.js';
import { FRAMES } from './photo.js';
import './art.js';

// ---------------------------------------------------------------- stationery & hobby stall
const e = (item, price) => ({ item, price });
register('shop', 'sv4h_stationery', {
  name: 'Stationery & Hobby Stall', owner: 'sachiko', keeper: { name: 'Chiyo', look: { hair: '#6a4a3a', top: '#7aa8c8', bottom: '#4a4a5a', skin: '#f8d5b8', accent: '#e87aa0' } }, color: K.sky[1], hours: ['9:00', '19:00'],
  buys: [], buyTags: ['photo', 'album', 'pottery', 'weaving', 'writing', 'bouquet'], bonusCats: ['gift'],
  greet: { default: ['Paper, film, clay and yarn! Whatever you make, I will buy it.', 'Hobbies are the best part of a day. What are you into?'], thanks: ['Make something lovely!', 'Come back with your best work.'] },
  stock: [e('tool_camera', 480), 'sv4h_film', ...FRAMES.slice(1).map((f) => 'sv4h_frame_' + f[0]), 'sv4h_sticker_heart', 'sv4h_sticker_star', 'sv4h_sticker_sparkle', 'sv4h_sticker_cat',
    'sv4h_clay', 'sv4h_glaze_indigo', 'sv4h_glaze_celadon', 'sv4h_glaze_persimmon', 'sv4h_glaze_ash', 'mat_yarn', 'sv4h_notebook', 'sv4h_wrap',
    'sv4h_stem_violet', 'sv4h_stem_zinnia', 'sv4h_stem_dahlia', 'sv4h_stem_narcissus', e('sv4h_stem_orchid', 260), e('sv4h_recorder', 90)].filter((x) => typeof x !== 'string' || get('item', x)),
});
register('interaction', 'sv4h_stationery', { label: 'Stationery and hobby stall', run: (g) => new Promise((res) => g.open('shop', 'sv4h_stationery', res)) });
addObjects('shotengai', [{ spr: 'sv4h_stall', x: 28, y: 8, w: 2, use: 'sv4h_stationery', shadow: 28 }]);

// ---------------------------------------------------------------- phone app
const TABS = ['Skills', 'Best works', 'Ribbons'];
const bestPhoto = (g) => S(g).photo.album.reduce((b, p) => (!b || p.score > b.score ? p : b), null);
export function worksLines(g) {
  const s = S(g), m = s.music, mastered = SONGS.filter((x) => ((m.songs[x.id] || {}).best || 0) >= 0.55).length, bp = bestPhoto(g);
  const bestPot = Object.entries(s.pot.best).sort((a, b) => b[1] - a[1])[0];
  return [
    ['Photography', bp ? `Best: ${bp.title.slice(0, 22)} ${'*'.repeat(bp.stars)}` : 'No photos yet', `${s.photo.album.length} in album, ${s.photo.taken} taken`],
    ['Music', `${mastered}/8 songs mastered, ${Object.keys(m.albums).length}/${ALBUMS.length} albums`, m.band.members.length ? `Band: ${m.band.name || 'unnamed'}` : `Busking total ${m.busk.total} coins`],
    ['Pottery', bestPot ? `Best ${bestPot[0]}: ${Math.round(bestPot[1] * 100)}%` : 'Nothing fired yet', `${s.pot.made} thrown, ${s.pot.woven} woven`],
    ['Writing', `${s.write.stories.length} stories, novel ${novelDone(g)}/8`, `${Object.keys(s.write.shelf).length} on the library shelf`],
    ['Ikebana', `${s.flower.made} bouquets`, `Best ${Math.round(s.flower.best * 100)}%`],
  ];
}
register('phoneApp', 'sv4h_journal', {
  name: 'Hobbies', icon: 'sv4h_i_journal', order: 45, badge: (g) => pendingHobbyProfs(g).length || 0,
  open(game, app) { app.state.tab = 0; app.state.sel = 0; },
  update(dt, input, game, app) {
    const { x, y } = app.area, st = app.state, k = input.pressed; st.mx = input.mx; st.my = input.my;
    if (k.has('arrowright') || k.has('d')) st.tab = (st.tab + 1) % 3;
    if (k.has('arrowleft') || k.has('a')) st.tab = (st.tab + 2) % 3;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(4, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown) {
      TABS.forEach((_, i) => { if (inside(input.mx, input.my, x + 4 + i * 70, y + 2, 66, 14)) st.tab = i; });
      if (st.tab === 0) { const i = Math.floor((input.my - y - 22) / 24); if (input.mx < x + 110 && i >= 0 && i < 5) st.sel = i; }
    }
    const skill = HOBBIES[st.sel], pend = pendingHobbyProfs(game).find((p) => p.skill === skill);
    if (st.tab === 0 && pend) for (const n of ['1', '2']) if (k.has(n)) { const o = optionsFor(game, skill, pend.level)[Number(n) - 1]; if (o && chooseProfession(game, skill, pend.level, o.id)) game.sfx('chime'); }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state;
    panel(g, x, y, w, h, 'paper');
    TABS.forEach((t, i) => btn(g, x + 4 + i * 70, y + 2, 66, 14, t, { focus: st.tab === i, hover: inside(st.mx, st.my, x + 4 + i * 70, y + 2, 66, 14) }));
    if (st.tab === 0) {
      HOBBIES.forEach((id, i) => {
        const sk = get('skill', id), ry = y + 22 + i * 24;
        if (i === st.sel) rect(g, K.butter[3], x + 3, ry - 2, 108, 22);
        drawText(g, sk.name, x + 8, ry + 2, C.ink, 1, null); drawText(g, `LV${game.skillLevel(id)}`, x + 84, ry + 2, K.forest[1], 1, null);
        const [a, b] = chosen(game, id); rect(g, a ? K.butter[2] : K.paper[1], x + 8, ry + 12, 5, 3); rect(g, b ? K.butter[2] : K.paper[1], x + 15, ry + 12, 5, 3);
      });
      const id = HOBBIES[st.sel], sk = get('skill', id), lv = game.skillLevel(id), xp = game.skillXP(id), lo = lv ? 10 * lv * (lv + 1) : 0, hi = 10 * (lv + 1) * (lv + 2), p = lv >= 10 ? 1 : (xp - lo) / (hi - lo), dx = x + 118;
      drawText(g, sk.name, dx, y + 24, C.ink, 1, null); drawText(g, sk.how, dx, y + 34, K.ink[3], 1, null);
      rect(g, C.ink, dx, y + 46, 168, 8); rect(g, K.paper[2], dx + 1, y + 47, 166, 6); rect(g, sk.color, dx + 1, y + 47, Math.round(166 * clamp01(p)), 6);
      const [a, b] = chosen(game, id), pend = pendingHobbyProfs(game).find((q) => q.skill === id);
      drawText(g, `LV5 ${a ? a.name : lv >= 5 ? 'Choose below' : 'Reach level 5'}`, dx, y + 60, C.ink, 1, null);
      if (a) drawText(g, describe(a.fx), dx + 2, y + 69, K.ink[3], 1, null);
      drawText(g, `LV10 ${b ? b.name : lv >= 10 && a ? 'Choose below' : 'Reach level 10'}`, dx, y + 82, C.ink, 1, null);
      if (b) drawText(g, describe(b.fx), dx + 2, y + 91, K.ink[3], 1, null);
      if (pend) optionsFor(game, id, pend.level).forEach((o, j) => { btn(g, dx, y + 104 + j * 18, 168, 16, `${j + 1} ${o.name}`, { tone: 'mint', hover: inside(st.mx, st.my, dx, y + 104 + j * 18, 168, 16) }); drawText(g, describe(o.fx).slice(0, 34), dx, y + 140 + j * 9, K.ink[3], 1, null); });
    } else if (st.tab === 1) {
      worksLines(game).forEach(([n, l1, l2], i) => { const ry = y + 22 + i * 28; drawText(g, n, x + 8, ry, K.coral[1], 1, null); drawText(g, l1, x + 8, ry + 9, C.ink, 1, null); drawText(g, l2, x + 8, ry + 18, K.ink[3], 1, null); });
    } else {
      const list = S(game).ribbons;
      drawText(g, `${list.length} ribbons`, x + 8, y + 22, C.ink, 1, null);
      list.slice(-12).forEach((r, i) => { const rx = x + 8 + (i % 2) * 142, ry = y + 36 + Math.floor(i / 2) * 22; rect(g, [0, '#4a7cd8', '#d84a4a', '#f4f4f4'][r.rank] || K.paper[2], rx, ry, 8, 14); rect(g, K.ink[1], rx, ry + 14, 8, 1); drawText(g, r.name.slice(0, 22), rx + 12, ry + 3, C.ink, 1, null); });
    }
  },
});
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------- achievements
for (const [id, name, desc, cond] of [
  ['sv4h_first_photo', 'Say cheese', 'Take your first photo.', 'stat:photosTaken>=1'], ['sv4h_shutterbug', 'Shutterbug', 'Take 30 photos.', 'stat:photosTaken>=30'], ['sv4h_five_star', 'Perfect shot', 'Take a five-star photo.', 'stat:photos5>=1'],
  ['sv4h_first_song', 'First notes', 'Play your first song.', 'stat:songsPlayed>=1'], ['sv4h_busker', 'Hat full of coins', 'Earn 200 coins busking.', 'stat:buskTips>=200'], ['sv4h_band', 'We are a band', 'Form a band.', 'flag:sv4h_band'],
  ['sv4h_potter', 'Out of the kiln', 'Fire your first piece.', 'stat:potsFired>=1'], ['sv4h_author', 'Published author', 'Write a short story.', 'stat:storiesWritten>=1'], ['sv4h_novelist', 'The end', 'Finish My Novel.', 'flag:sv4h_novel_done'],
  ['sv4h_florist', 'Say it with flowers', 'Make a bouquet.', 'stat:bouquetsMade>=1'], ['sv4h_ribbons', 'Ribbon collector', 'Win 5 hobby ribbons.', 'stat:ribbons>=5'],
]) register('achievement', id, { name, desc, icon: 'i_star', cond });

features('Creative Hobbies', [
  'Stationery and Hobby Stall in the shotengai: camera, film, frames, stickers, clay, glazes, yarn, notebooks, wrapping paper and cut flowers',
  'The stall buys photo prints, CDs, pottery, weaving, your books and bouquets',
  'Hobby Journal phone app with three tabs: five hobby skills with XP bars and profession choices, best works, and a ribbon shelf',
  'Hobby professions at level 5 and 10 for Photography, Music, Pottery, Writing and Ikebana (30 in all) via the Skills profession system',
  'Phone badge when a hobby profession choice is waiting',
  'Eleven hobby achievements hooked to photoTaken, songPlayed, potFired, chapterWritten and bouquetMade style events and stats',
  'Hobby buffs (Inspired, Steady hands, Bookish glow, Humming, Fresh bloom) show in the buff HUD',
  'Hobby ribbons from contests, gigs, shows and the finished novel are collected in one place',
]);
