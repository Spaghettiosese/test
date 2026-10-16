// The Story Log phone app (acts, chapters, Tidekeeper letters, Tide Lanterns and the Act III support meter, with a
// "Where to next?" hint line from the story nudge system and progress percent), and a small patch so the older Diary
// only lists the original spring chapters.
import { register, get, features } from '../../core/registry.js';
import { drawText, drawTextC, wrapPx } from '../../font.js';
import { UI, rect, panel } from '../../ui/ui.js';
import { SPRITES } from '../../art.js';
import { sprite } from '../../artcache.js';
import { storyState } from '../../systems/quests.js';
import { CHAPTERS, S, LETTERS, SUPPORT_PARTS, supportParts, supportScore, resultOf, ACT2, ACT3 } from './state.js';
import { TIDE, tideLit } from './dressing.js';

const TABS = ['Chapters', 'Letters', 'Town'];
export const chapterList = () => Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
export const progressOf = (g, act) => {
  const ns = chapterList().filter((n) => (act ? CHAPTERS[n].act === act : true));
  return { done: ns.filter((n) => g.flag(`chapter_${n}_done`)).length, total: ns.length };
};
export const percentOf = (g) => { const p = progressOf(g); return Math.round((100 * p.done) / (p.total || 1)); };
const defOf = (n) => get('chapter', `sv3_ch${n}`);

register('phoneApp', 'sv3_log', {
  name: 'Story Log', icon: 'i_book', order: 22, when: (g) => !!g.flag('chapter_9_done') || !!g.flag('lantern_lit'),
  badge: (g) => Object.values(S(g).letters).filter((d) => d === g.day).length || 0,
  open(game, app) { app.state.tab ??= 0; app.state.sel ??= 0; },
  items(game, app) {
    const st = storyState(game), tab = app.state.tab;
    if (tab === 0) { const ns = chapterList(), shown = ns.filter((n) => st.started[n] !== undefined), next = ns.find((n) => st.started[n] === undefined); return next !== undefined ? [...shown, -next] : shown; }
    if (tab === 1) return LETTERS.map((l, k) => k).filter((k) => k > 0);
    return [];
  },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('c')) { st.tab = (st.tab + 1) % 3; st.sel = 0; }
    if (input.justDown && input.my >= y && input.my < y + 11) { const i = Math.floor((input.mx - x) / 97); if (i >= 0 && i < 3) { st.tab = i; st.sel = 0; } }
    const n = this.items(game, app).length;
    if (n) {
      if (k.has('arrowdown') || k.has('s')) st.sel = (st.sel + 1) % n;
      if (k.has('arrowup') || k.has('w')) st.sel = (st.sel + n - 1) % n;
      if (input.justDown && input.mx < x + 100 && input.my > y + 14) { const top = Math.max(0, Math.min(n - 9, st.sel - 4)), i = top + Math.floor((input.my - y - 16) / 11); if (i >= 0 && i < n) st.sel = i; }
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = this.items(game, app), S3 = storyState(game);
    TABS.forEach((t, i) => { rect(g, i === st.tab ? UI.accent : UI.paper2, x + i * 97, y, 95, 11); drawTextC(g, t, x + i * 97 + 47, y + 2, i === st.tab ? UI.text : UI.ink, 1, null); });
    const body = (title, text, icon) => {
      panel(g, x + 102, y + 14, w - 102, h - 14, 'paper');
      if (icon && SPRITES[icon]) g.drawImage(sprite(icon), x + w - 24, y + 18);
      drawText(g, title, x + 108, y + 20, UI.accent2, 1, null);
      wrapPx(text, w - 116).slice(0, 13).forEach((l, i) => drawText(g, l, x + 108, y + 34 + i * 10, UI.ink, 1, null));
    };
    const rows = (labels, dim) => {
      const top = Math.max(0, Math.min(Math.max(0, labels.length - 9), st.sel - 4));
      labels.slice(top, top + 9).forEach((l, j) => { const i = top + j; if (i === st.sel) rect(g, UI.gold, x, y + 15 + j * 11, 98, 10); drawText(g, l.length > 17 ? l.slice(0, 16) + '.' : l, x + 3, y + 16 + j * 11, dim[i] ? UI.dim : UI.ink, 1, null); });
    };
    const hn = game.story && game.story.hint();
    if (st.tab !== 2) {
      const a2 = progressOf(game, 2), a3 = progressOf(game, 3);
      rect(g, '#2b1d2e', x, y + h - 54, 98, 54);
      drawText(g, `Story ${percentOf(game)}%`, x + 3, y + h - 52, UI.gold, 1, null);
      rect(g, UI.ink, x + 3, y + h - 42, 92, 5); rect(g, UI.good, x + 4, y + h - 41, Math.round(90 * percentOf(game) / 100), 3);
      drawText(g, `II ${a2.done}/${a2.total}  III ${a3.done}/${a3.total}`, x + 3, y + h - 35, UI.text, 1, null);
      drawText(g, 'Where to next?', x + 3, y + h - 24, UI.gold, 1, null);
      wrapPx(hn ? hn.text : 'Enjoy the day.', 92).slice(0, 2).forEach((l, i) => drawText(g, l, x + 3, y + h - 14 + i * 9, UI.text, 1, null));
    }
    if (st.tab === 0) {
      const labels = list.map((n) => (n < 0 ? '???' : `${n} ${defOf(n).name}`)), dim = list.map((n) => n < 0);
      rows(labels, dim);
      const n = list[st.sel];
      if (n === undefined) drawText(g, 'Nothing yet.', x + 4, y + 20, UI.dim, 1, null);
      else if (n < 0) body('Not yet', `Act ${CHAPTERS[-n].act === 2 ? 'II' : 'III'} continues soon. Keep living your days in Hoshimori.`);
      else { const c = defOf(n), fin = game.flag(`chapter_${n}_done`); body(`${CHAPTERS[n].act === 2 ? 'II' : 'III'}.${n} ${c.name}`, (fin ? c.summary : c.teaser) || '', c.art); }
    } else if (st.tab === 1) {
      const labels = list.map((k) => (S(game).letters[k] ? `${k} ${LETTERS[k][0]}` : `${k} ???`)), dim = list.map((k) => !S(game).letters[k]);
      rows(labels, dim);
      const k = list[st.sel];
      if (k !== undefined) { const got = S(game).letters[k]; body(got ? LETTERS[k][0] : 'Unopened', got ? LETTERS[k][1] : 'A letter you have not found yet.', null); }
    } else {
      panel(g, x, y + 14, w, h - 14, 'paper');
      drawText(g, 'Tide Lanterns', x + 6, y + 20, UI.accent2, 1, null);
      TIDE.forEach((t, i) => { const on = game.flag(`a2_tl_${t[0]}`), cx = x + 14 + i * 56; rect(g, UI.ink, cx - 1, y + 32, 14, 18); rect(g, on ? '#bff4e6' : '#5a4a60', cx, y + 33, 12, 16); if (on) rect(g, '#ffffff', cx + 4, y + 36, 4, 9); drawText(g, t[0].toUpperCase().slice(0, 7), cx - 3, y + 54, on ? UI.ink : UI.dim, 1, null); });
      const fin = game.flag('a2_finale');
      drawText(g, fin ? `Finale: ${fin === 'bell' ? 'the Tide Bell' : 'a hundred boats'}` : `${tideLit(game).length}/5 lit`, x + 6, y + 66, UI.ink, 1, null);
      drawText(g, 'Town support', x + 6, y + 80, UI.accent2, 1, null);
      if (!game.flag('chapter_24_done') && !game.flag('chapter_25_done')) { drawText(g, 'Act III has not begun.', x + 6, y + 92, UI.dim, 1, null); return; }
      const parts = supportParts(game);
      SUPPORT_PARTS.forEach(([name, max], i) => { const yy = y + 92 + i * 9; drawText(g, name.toUpperCase().slice(0, 22), x + 6, yy, UI.ink, 1, null); rect(g, UI.ink, x + 150, yy, 80, 6); rect(g, '#e8d9b8', x + 151, yy + 1, 78, 4); rect(g, UI.good, x + 151, yy + 1, Math.round(78 * Math.min(1, parts[i] / max)), 4); drawText(g, `${parts[i]}/${max}`, x + 236, yy, UI.ink, 1, null); });
      const sc = supportScore(game);
      drawText(g, `Support ${sc}/100: ${game.flag('a3_result') ? game.flag('a3_result').toUpperCase() : resultOf(sc).toUpperCase() + ' (so far)'}`, x + 6, y + h - 12, UI.accent2, 1, null);
    }
    drawText(g, 'C: next tab', x + w - 60, y + h - 10, UI.dim, 1, null);
  },
});

// The old Diary lists chapters from the first spring only (it labels everything past 9 "Finale").
const diary = get('phoneApp', 'story_diary');
if (diary && diary.items) { const orig = diary.items; diary.items = function (game, app) { const l = orig.call(this, game, app); return app.state.tab === 0 ? l.filter((c) => c.n <= 9) : l; }; }

features('Story Acts', [
  'Story Log phone app: every Act II and III chapter in order with its teaser, then its summary once finished',
  'Story Log shows overall story percent, Act II and Act III progress bars, and a "Where to next?" hint from the story nudge system',
  'Letters tab: all seventeen Tidekeeper letters, readable again after you find them',
  'Town tab: the five Tide Lanterns, the Act II finale you chose, and the Act III support meter with eight parts and the predicted hearing result',
  'The old Diary keeps only the spring chapters so the new acts live in the Story Log',
  'Twelve new full-screen cutscene backdrops: letter desk, cave stars, harbour mural, midsummer bonfire, typhoon, a hundred lights, council, camp, heist, school play, hearing and the three envelopes',
  'Five new minigames: the wave sigil memory game, the chain of lights, marshmallow roasting, stage cues and the stealth heist',
]);
