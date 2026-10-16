// The Mystery Board (attic corkboard of clues with red strings and deductions) and Grandma's trunk.
// Script steps: { t:'clue', ids:[...] } pins clues; deductions open with game.open('story_board', deductionId, onDone).
// Solving a deduction emits 'boardSolved' { id } (quest matchers listen for it).
import { register, get, features } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { drawText, drawTextC, wrapPx, measure } from '../../font.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { UI, rect, panel } from '../../ui/ui.js';
import { storyState } from '../../systems/quests.js';
import { lines, L, advance, give, set, clue, page, memory, sfx, emote, fade, wait, script } from './util.js';

// ---------------------------------------------------------------- clues
export const CLUES = {
  paper_star: { title: 'The paper star', text: '"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch." Pinned on the town noticeboard. Who folds these every spring?', icon: 'story_paper_star', x: 20, y: 22 },
  headline: { title: 'Old headline', text: 'The Hoshimori Gazette, 20 years ago: "Starlight Festival cancelled: Lantern lens damaged in storm."', item: 'story_keeper_journal', x: 92, y: 22 },
  brass_button: { title: 'Brass button', text: 'Mochi brought it on my first night. A tiny star is engraved on it. It feels warm in my hand.', item: 'story_brass_button', x: 164, y: 22 },
  grandma_hint: { title: 'Grandma\'s words', text: 'She hummed an old song and said: "Under the cat, dear." Then she asked if I\'d eaten.', x: 236, y: 22 },
  maneki: { title: 'Lucky cat statue', text: 'The maneki-neko by the door. Mochi sleeps on it. The attic key was hidden underneath.', icon: 'story_neko', x: 20, y: 74 },
  journal: { title: 'Keeper Journal', text: 'Grandma\'s journal. Seven riddles for seven prisms. "Vega stays with me."', item: 'story_keeper_journal', x: 92, y: 74 },
  vega: { title: 'Vega', text: 'Prism one, wrapped in Grandma\'s keeper scarf inside the trunk.', item: 'story_prism_vega', x: 164, y: 74 },
  repair_tag: { title: 'Repair tag', text: 'A tag from Wren\'s Clocks. Tiny, perfect, slanted capitals. Exactly like the paper star.', x: 236, y: 74 },
  altair: { title: 'Altair', text: 'Prism two, the jewel bearing in the clock tower chime. Mr. Wren pretended not to watch.', item: 'story_prism_altair', x: 20, y: 126 },
  star_mark: { title: 'Carved star', text: 'A star carved deep in the tidepool cave, with an anchor beside it. Grandma\'s mark.', x: 92, y: 126 },
  deneb: { title: 'Deneb', text: 'Prism three, set in Captain Jun\'s lucky lure. He traded it for a Moon Bream.', item: 'story_prism_deneb', x: 164, y: 126 },
  sirius: { title: 'Sirius', text: 'Prism four, in the eyepiece of the old school telescope. Ms. Fujita was one of Grandma\'s junior stargazers.', item: 'story_prism_sirius', x: 236, y: 126 },
  spica: { title: 'Spica', text: 'Prism five, behind the shrine\'s ema board, kept by Kiko\'s grandmother.', item: 'story_prism_spica', x: 20, y: 176 },
  polaris: { title: 'Polaris', text: 'Prism six, at the bottom of Mika\'s mother\'s sugar jar.', item: 'story_prism_polaris', x: 92, y: 176 },
  flashback: { title: 'Spring, 1985', text: 'Grandma remembered: she and Tobias built the lens together and lit it for the very first festival.', x: 164, y: 176 },
  little: { title: 'The Little Lantern', text: 'The seventh prism was inside the brass button all along. It glowed in the storm.', item: 'story_prism_little', x: 236, y: 176 },
};
const LINKS = [
  ['paper_star', 'maneki', 'd_cat'], ['grandma_hint', 'maneki'], ['maneki', 'journal'], ['journal', 'vega'], ['headline', 'journal'],
  ['paper_star', 'repair_tag', 'd_hand'], ['repair_tag', 'altair'], ['star_mark', 'deneb'], ['vega', 'sirius'],
  ['spica', 'polaris'], ['polaris', 'flashback'], ['brass_button', 'little'], ['flashback', 'little'], ['altair', 'star_mark'],
];

// ---------------------------------------------------------------- deductions
export const DEDUCTIONS = {
  d_cat: { when: 'flag:journal_found', q: 'The first riddle said "the first sleeps where the cat keeps watch". Which clue solved it?',
    options: ['The lucky cat statue by the door', 'Mochi\'s cushion', 'The cat on the cafe sign', 'Daifuku\'s kennel'], answer: 0,
    yes: 'The cat keeping watch was the maneki-neko. Grandma hid the key right under it!' },
  d_hand: { when: 'flag:tag_found', q: 'Who folds the paper stars? Compare the handwriting with these four samples.',
    options: ['A repair tag from Wren\'s Clocks', 'The Cafe Kumo menu board', 'Pip\'s delivery slip', 'A shrine fortune slip'], answer: 0,
    samples: ['THE FIRST SLEEPS WHERE', 'today: honey toast!', 'Deliver to: Aoki', 'Great blessing'],
    yes: 'Those slanted capitals... Mr. Wren writes the paper stars. But why would he hide it?' },
  d_names: { when: 'flag:chapter_6_done', optional: true, q: 'Vega, Altair, Deneb, Sirius... What do the prism names have in common?',
    options: ['They are all bright stars', 'They are all old fishing boats', 'They are all of Grandma\'s cats'], answer: 0,
    yes: 'Every prism is named after a star. Vega, Altair and Deneb even make the summer triangle!' },
  d_seventh: { when: 'flag:chapter_7_done', optional: true, q: 'Grandma said she kept the seventh prism "close to her heart, on her coat". Where is it?',
    options: ['Inside the brass button from her coat', 'Under the shrine bell', 'In the clock tower gears'], answer: 0,
    yes: 'Her keeper\'s coat is missing a button... the one Mochi brought me. Could the Little Lantern be inside?' },
};
export function pendingDeduction(game) {
  const s = storyState(game);
  return Object.keys(DEDUCTIONS).find((id) => !s.solved[id] && check(DEDUCTIONS[id].when, game)) || null;
}

register('command', 'clue', { // { t:'clue', ids:[...] } pin clues on the Mystery Board
  run(g, s) {
    const st = storyState(g); let n = 0;
    for (const id of s.ids || [s.id]) if (CLUES[id] && !st.clues[id]) { st.clues[id] = g.day; n++; }
    if (n && g.flag('board_found')) g.toast(n > 1 ? `${n} clues pinned on the Mystery Board` : `Clue pinned: ${CLUES[(s.ids || [s.id])[0]].title}`, 'i_quest');
  },
});

// ---------------------------------------------------------------- the board scene
class BoardScene {
  constructor(game, mode, onDone) {
    const st = storyState(game);
    Object.assign(this, { name: 'story_board', game, onDone, t: 0, sel: 0, opt: 0, msg: '', msgT: 0, solvedT: 0, music: 'home' });
    this.ded = DEDUCTIONS[mode] ? mode : null;
    this.known = Object.keys(CLUES).filter((id) => st.clues[id]);
    this.fresh = LINKS.filter((l) => this.linkOn(l) && !st.links[l[0] + '>' + l[1]]);
    game.sfx('page');
  }
  linkOn([a, b, need]) { const st = storyState(this.game); return st.clues[a] && st.clues[b] && (!need || st.solved[need]); }
  close(r) { this.game.scenes.pop(this); const st = storyState(this.game); for (const l of LINKS) if (this.linkOn(l)) st.links[l[0] + '>' + l[1]] = 1; this.onDone && this.onDone(r || { score: 1 }); }
  update(dt, inp) {
    this.t += dt; this.msgT -= dt;
    const k = inp.pressed, d = this.ded && DEDUCTIONS[this.ded];
    if (this.solvedT) { this.solvedT += dt; if (this.solvedT > 2.6 && (k.size || inp.justDown)) this.close({ score: 1, solved: this.ded }); return; }
    if (k.has('escape') || k.has('tab')) return this.close({ score: 0, quit: true });
    if (d) {
      const n = d.options.length;
      if (k.has('arrowup') || k.has('w')) this.opt = (this.opt + n - 1) % n;
      if (k.has('arrowdown') || k.has('s')) this.opt = (this.opt + 1) % n;
      let pick = k.has('enter') || k.has(' ') || k.has('e');
      if (inp.justDown) { const i = Math.floor((inp.my - this.optTop()) / 12); if (i >= 0 && i < n && inp.mx > 30 && inp.mx < 290) { this.opt = i; pick = true; } }
      if (pick) {
        if (this.opt === d.answer) {
          const st = storyState(this.game); st.solved[this.ded] = this.game.day; this.solvedT = 0.01; this.fresh = LINKS.filter((l) => this.linkOn(l) && !st.links[l[0] + '>' + l[1]]); this.t = 0;
          this.game.sfx('chime'); this.game.stat('deductions'); this.game.bus.emit('boardSolved', { id: this.ded });
        } else { this.msg = 'Hmm, not quite. Look at the clues again.'; this.msgT = 1.6; this.game.sfx('wrong'); }
      }
      return;
    }
    const n = this.known.length;
    if (!n) { if (k.size || inp.justDown) this.close(); return; }
    if (k.has('arrowright') || k.has('d')) this.sel = (this.sel + 1) % n;
    if (k.has('arrowleft') || k.has('a')) this.sel = (this.sel + n - 1) % n;
    if (k.has('arrowdown') || k.has('s')) this.sel = Math.min(n - 1, this.sel + 4);
    if (k.has('arrowup') || k.has('w')) this.sel = Math.max(0, this.sel - 4);
    if (inp.justDown) { const i = this.known.findIndex((id) => { const c = CLUES[id]; return inp.mx >= c.x && inp.mx < c.x + 64 && inp.my >= c.y && inp.my < c.y + 44; }); if (i >= 0) this.sel = i; else if (inp.my > 200) this.close(); }
    if (k.has('enter') || k.has(' ')) this.close();
  }
  optTop() { return 150 - (DEDUCTIONS[this.ded].options.length * 12) / 2 + 10; }
  draw(g) {
    const game = this.game, st = storyState(game);
    rect(g, '#7a5a3a', 0, 0, 320, 224); rect(g, '#c8955a', 6, 6, 308, 212);
    for (let i = 0; i < 260; i++) rect(g, i % 3 ? '#b8854a' : '#d8a56a', (i * 73) % 306 + 7, (i * 41) % 210 + 7, 1, 1);
    // strings
    g.lineWidth = 1;
    for (const l of LINKS) {
      if (!this.linkOn(l)) continue;
      const a = CLUES[l[0]], b = CLUES[l[1]], isNew = this.fresh.includes(l), p = isNew ? Math.min(1, this.t / 1.2) : 1;
      g.strokeStyle = '#c83a3a'; g.beginPath(); g.moveTo(a.x + 32, a.y + 6); g.lineTo(a.x + 32 + (b.x - a.x) * p, a.y + 6 + (b.y - a.y) * p); g.stroke();
    }
    for (const [i, id] of Object.keys(CLUES).entries()) {
      const c = CLUES[id], known = !!st.clues[id], on = this.known[this.sel] === id && !this.ded;
      const tilt = ((i * 7) % 3) - 1;
      if (!known) { rect(g, '#b07a44', c.x + 8, c.y + 8 + tilt, 48, 30); drawTextC(g, '?', c.x + 32, c.y + 18, '#8a5a30', 1, null); continue; }
      rect(g, on ? '#ffd76a' : '#5a4030', c.x - 1, c.y + tilt - 1, 66, 46); rect(g, id === 'headline' ? '#e8dcc0' : '#fff6e6', c.x, c.y + tilt, 64, 44);
      const icon = c.icon || (c.item && get('item', c.item) && get('item', c.item).icon);
      if (icon && SPRITES[icon]) { const s = SPRITES[icon]; g.drawImage(sprite(icon), c.x + 32 - Math.round(s.w / 2), c.y + tilt + 20 - Math.round(s.h / 2)); }
      wrapPx(c.title, 60).slice(0, 1).forEach((l) => drawTextC(g, l, c.x + 32, c.y + tilt + 33, '#3a2a30', 1, null));
      rect(g, '#c83a3a', c.x + 30, c.y + tilt + 2, 4, 4);
    }
    if (this.ded) {
      const d = DEDUCTIONS[this.ded], top = this.optTop();
      panel(g, 24, top - 50, 272, d.options.length * 12 + 58, 'paper');
      wrapPx(d.q, 256).slice(0, 3).forEach((l, i) => drawText(g, l, 32, top - 44 + i * 11, UI.accent2, 1, null));
      d.options.forEach((o, i) => { if (i === this.opt) rect(g, UI.gold, 30, top + i * 12 - 2, 260, 11); drawText(g, `${o}${d.samples ? `:  "${d.samples[i]}"` : ''}`, 34, top + i * 12, UI.ink, 1, null); });
      if (this.msgT > 0) drawTextC(g, this.msg, 160, top + d.options.length * 12 + 2, UI.bad, 1, null);
      if (this.solvedT) { panel(g, 30, 186, 260, 32, 'dark'); wrapPx(d.yes, 248).slice(0, 2).forEach((l, i) => drawText(g, l, 36, 191 + i * 11, UI.text, 1, null)); }
      return;
    }
    const id = this.known[this.sel];
    panel(g, 6, 186, 308, 32, 'dark');
    if (id) wrapPx(CLUES[id].text, 296).slice(0, 2).forEach((l, i) => drawText(g, l, 12, 191 + i * 11, UI.text, 1, null));
    else drawText(g, 'Nothing pinned yet. Clues you find will appear here.', 12, 196, UI.text, 1, null);
    drawText(g, `${this.known.length}/${Object.keys(CLUES).length} clues`, 250, 8, '#3a2a30', 1, null);
  }
}
register('scene', 'story_board', { make: (game, mode, onDone) => new BoardScene(game, mode, onDone) });

// ---------------------------------------------------------------- interactions placed in the attic
const boardLabel = (g) => (pendingDeduction(g) ? 'Mystery Board (new deduction!)' : 'Mystery Board');
register('interaction', 'mystery_board', {
  label: (g) => (g.flag('board_found') ? boardLabel(g) : 'Old corkboard'),
  run(g) {
    if (!g.flag('board_found')) return g.run([...lines('|An old corkboard, covered in pin holes. It must have been Grandma\'s.', 'misa|I could pin my clues here, like a real detective. Paper star, button, headline, journal...'), set('board_found'),
      { t: 'call', fn: (g2) => new Promise((res) => { const d = pendingDeduction(g2); if (!d) return res(); g2.open('story_board', d, res); }) }]);
    g.open('story_board', pendingDeduction(g), () => {});
  },
});

const TRUNK = script('story_trunk_open', [
  ...lines('|The trunk is heavy oak with brass corners. The lock opens with the same little star key.', sfx('door'),
    'misa/surprised|Grandma\'s things... a scarf, a coat, a stack of letters tied with ribbon...',
    'misa|And a journal. "Keeper Journal, H. Aoki." Grandma was a lighthouse keeper?'),
  give('story_keeper_journal'), set('journal_found'), page('p1', 'p2', 'p3'),
  ...lines('|Something hard is wrapped in the old scarf. It catches the grey light from the window.', sfx('star')),
  give('story_prism_vega'), memory('story_trunk_open'),
  ...lines('misa/surprised|A glass prism. It\'s glowing, a little. Like it remembers the stars.',
    '|A note is tucked inside the scarf, in Grandma\'s round handwriting.',
    '|"Vega stays with me. The other six went home to people I trust, to keep until someone wants to light the lantern again."',
    'misa|Six more. The paper star said seven lights went home to seven hearts.',
    'misa|And the coat is missing a button. The top one. Just like the one Mochi gave me...',
    'misa/happy|I should pin all of this on that old corkboard. Time to think like Suzu would.'),
  { t: 'clue', ids: ['journal', 'vega', 'headline'] }, advance('main_ch3'),
], 'The trunk in the attic');

register('interaction', 'keeper_trunk', {
  label: (g) => (g.flag('journal_found') ? 'Grandma\'s trunk' : 'Open the old trunk'),
  run(g) {
    if (!g.flag('journal_found')) return g.run(get('script', TRUNK).steps);
    const n = (g.state.story.trunkLook = ((g.state.story.trunkLook || 0) + 1) % 4);
    return g.run(lines([
      'misa|Grandma\'s keeper coat. It still smells of sea salt and lavender.',
      'misa|A bundle of festival programmes. "Starlight Festival, year 1." The cover is a hand-drawn lighthouse.',
      'misa|Photos of the lighthouse crew. Grandma is laughing at something off camera. A man with mutton-chops is scowling.',
      'misa|Her old keeper\'s cap. It\'s much too big for me. For now.',
    ][n]));
  },
});

features('Mystery', [
  'Mystery Board in the attic: a corkboard of 16 pinned clues with icons, notes and descriptions',
  'Red strings draw themselves across the Mystery Board as clues connect',
  'Deductions on the Mystery Board: answer what the clues mean (no penalty for a wrong guess, just try again)',
  'Handwriting deduction: match the paper star to one of four writing samples to unmask its author',
  'Two optional deductions: what the prism names share, and where the seventh prism is hidden',
  'Grandma\'s trunk in the attic: open it for the Keeper Journal and the first prism, then browse her old keepsakes',
]);
