// The Diary phone app (story so far in Misa's words, Hana's Keeper Journal, the prism case, rewatchable memories),
// plus the story's background systems: nudges after 3 quiet days, dreams, the "Previously..." recap, wish bonuses and
// the town reacting to the story (festival bunting, the lantern beam over the bay at night).
import { register, get, all, features } from '../../core/registry.js';
import { drawText, drawTextC, wrapPx, measure } from '../../font.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { UI, rect, panel } from '../../ui/ui.js';
import { storyState, stageDef } from '../../systems/quests.js';
import { lines, scene, fade, wait, sfx, script } from './util.js';
import { PRISMS } from './art.js';

// ---------------------------------------------------------------- Keeper Journal pages
export const PAGES = {
  p1: ['To whoever finds this', 'This is the journal of Hana Aoki, Keeper of the Star Lantern. If you are reading it, you found the key under the cat. Clever you. Please wipe your feet.'],
  p2: ['Riddle one: Vega', '"The first sleeps where the cat keeps watch." Vega stays with me, wrapped in my scarf. It was always my favourite. (Solved!)'],
  p3: ['Riddle two: Altair', '"The second beats in the heart that never stops. Ask the grumpy one who keeps it wound." Bring him tea. He will pretend he does not want it.'],
  p4: ['Riddle three: Deneb', '"The third swims with the luckiest man on the water. He will want a fish that only bites by moonlight."'],
  p5: ['Riddle four: Sirius', '"The fourth waits where the young ones look up. Little Akane always hogged the eyepiece."'],
  p6: ['Riddle five: Spica', '"The fifth is a prayer in six pieces. Put the poem in order and the shrine will give it back."'],
  p7: ['Riddle six: Polaris', '"The sixth is sweet and never moves, like the North Star. Ask whoever keeps the sugar."'],
  p8: ['Starlight Mochi', 'Sakura petals from the big tree in the park. Mochi rice flour. One pinch of salt from the beach rocks, for the sea. Pound it in rhythm and press a star on top. Share it warm.'],
  p9: ['Riddle seven: the Little Lantern', '"The seventh I keep close to my heart, sewn on my coat where I can feel it." If you found my button, you found it too.'],
  p10: ['The Keeper\'s Song', 'Hush now, little lantern, the sea is dark and wide. Shine across the water, and bring the sailors home. (Toby wrote the tune. Do not tell him I said it was lovely.)'],
  p11: ['The night it broke', 'The storm came in fast. Toby said wait, I said light it. The lens cracked into seven. We said things we did not mean. I was too proud to go back.'],
  p12: ['To the next Keeper', 'Light it on the last night of spring. Keep the log. Feed the cat. And if two old fools are still sulking, make them share a cup of tea.'],
};
const PAGE_DOODLE = { p1: 'story_keeper_journal', p2: 'story_prism_vega', p3: 'story_prism_altair', p4: 'story_prism_deneb', p5: 'story_prism_sirius', p6: 'story_prism_spica', p7: 'story_prism_polaris', p8: 'story_starlight_mochi', p9: 'story_prism_little', p10: 'story_music_box', p11: 'story_brass_button', p12: 'story_keeper_badge' };

register('command', 'page', { // { t:'page', ids:[...] } unlock Keeper Journal pages
  run(g, s) {
    const st = storyState(g); let n = 0;
    for (const id of s.ids || [s.id]) if (PAGES[id] && !st.journal[id]) { st.journal[id] = g.day; n++; }
    if (n && g.flag('journal_found')) { g.toast(n > 1 ? `Keeper Journal: ${n} new pages` : `Keeper Journal: "${PAGES[(s.ids || [s.id])[0]][0]}"`, 'i_book'); g.sfx('page'); }
  },
});
register('command', 'memory', { run(g, s) { storyState(g).memories[s.id] = g.day; } }); // { t:'memory', id } (a script id)

// Replays keep only the presentational steps of a memory (no items, money or quest changes).
const SAFE = new Set(['say', 'scene', 'fade', 'wait', 'sfx', 'emote', 'face', 'card']);
export function memorySteps(game, id) {
  const sc = get('script', id);
  if (!sc) return [];
  const raw = typeof sc.steps === 'function' ? sc.steps(game, {}) : sc.steps;
  const out = [];
  const walk = (steps) => { for (const s of steps || []) { if (SAFE.has(s.t)) out.push(s); else if (s.t === 'choice' && s.options[0]) walk(s.options[0].steps); } };
  walk(raw);
  return [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'fade', to: 0, dur: 0.4 }, ...out, { t: 'scene', name: null }];
}

// ---------------------------------------------------------------- the Diary app
const TABS = ['Story', 'Keeper', 'Prisms', 'Memories'];
register('phoneApp', 'story_diary', {
  name: 'Diary', icon: 'i_book', order: 21,
  badge: (game) => { const st = storyState(game); return Object.values(st.journal).filter((d) => d === game.day).length || 0; },
  open(game, app) { app.state.tab ??= 0; app.state.sel ??= 0; },
  memories(game) { const st = storyState(game); return Object.keys(st.memories).filter((id) => get('script', id)).sort((a, b) => st.memories[a] - st.memories[b]); },
  items(game, app) {
    const st = storyState(game), tab = app.state.tab;
    if (tab === 0) return all('chapter').filter((c) => st.started[c.n] !== undefined).sort((a, b) => a.n - b.n);
    if (tab === 1) return game.flag('journal_found') ? Object.keys(PAGES).filter((p) => st.journal[p]) : [];
    if (tab === 2) return PRISMS;
    return this.memories(game);
  },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('c')) { st.tab = (st.tab + 1) % 4; st.sel = 0; }
    if (input.justDown && input.my >= y && input.my < y + 11) { const i = Math.floor((input.mx - x) / 73); if (i >= 0 && i < 4) { st.tab = i; st.sel = 0; } }
    const list = this.items(game, app), n = list.length;
    if (n) {
      if (k.has('arrowdown') || k.has('s')) st.sel = (st.sel + 1) % n;
      if (k.has('arrowup') || k.has('w')) st.sel = (st.sel + n - 1) % n;
      if (input.justDown && input.mx < x + 100) { const i = Math.floor((input.my - y - 16) / 11); if (i >= 0 && i < n) st.sel = i; }
    }
    if (st.tab === 3 && n && (k.has('enter') || k.has('e') || k.has(' '))) {
      const id = list[st.sel]; app.scene.close(); game.run(memorySteps(game, id));
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = this.items(game, app), S = storyState(game);
    TABS.forEach((t, i) => { rect(g, i === st.tab ? UI.accent : UI.paper2, x + i * 73, y, 71, 11); drawTextC(g, t, x + i * 73 + 35, y + 2, i === st.tab ? UI.text : UI.ink, 1, null); });
    const sel = list[st.sel], left = (label, i, done = true) => { if (i === st.sel) rect(g, UI.gold, x, y + 15 + i * 11, 98, 10); drawText(g, label.length > 17 ? label.slice(0, 16) + '.' : label, x + 3, y + 16 + i * 11, done ? UI.ink : UI.dim, 1, null); };
    const body = (title, text, icon) => {
      panel(g, x + 102, y + 14, w - 102, h - 14, 'paper');
      if (icon && SPRITES[icon]) g.drawImage(sprite(icon), x + w - 24, y + 18);
      drawText(g, title, x + 108, y + 20, UI.accent2, 1, null);
      wrapPx(text, w - 116).slice(0, 12).forEach((l, i) => drawText(g, l, x + 108, y + 34 + i * 10, UI.ink, 1, null));
    };
    if (st.tab === 0) {
      list.forEach((c, i) => left(c.n === 0 ? 'Prologue' : c.n === 9 ? 'Finale' : `Ch.${c.n} ${c.name}`, i, game.flag(`chapter_${c.n}_done`)));
      if (!list.length) drawText(g, 'Nothing yet...', x + 4, y + 20, UI.dim, 1, null);
      if (sel) body(sel.name, (game.flag(`chapter_${sel.n}_done`) ? sel.summary : sel.teaser || sel.summary) || '', sel.art);
      const hn = game.story && game.story.hint();
      if (hn) { rect(g, '#2b1d2e', x, y + h - 22, 98, 22); drawText(g, 'Where next?', x + 3, y + h - 20, UI.gold, 1, null); wrapPx(hn.text, 92).slice(0, 1).forEach((l) => drawText(g, l, x + 3, y + h - 10, UI.text, 1, null)); }
    } else if (st.tab === 1) {
      if (!game.flag('journal_found')) { drawText(g, 'Grandma\'s journal is still hidden somewhere...', x + 4, y + 24, UI.dim, 1, null); return; }
      list.forEach((p, i) => left(PAGES[p][0], i));
      drawText(g, `${list.length}/12 pages`, x + 3, y + h - 10, UI.dim, 1, null);
      if (sel) body(PAGES[sel][0], PAGES[sel][1], PAGE_DOODLE[sel]);
    } else if (st.tab === 2) {
      PRISMS.forEach((p, i) => {
        const it = get('item', `story_prism_${p}`), got = game.has(`story_prism_${p}`) || game.flag('lantern_lit'), cx = x + 30 + i * 38;
        rect(g, i === st.sel ? UI.gold : UI.ink, cx - 13, y + 30, 28, 30); rect(g, got ? '#2b2440' : '#5a4a60', cx - 12, y + 31, 26, 28);
        if (got && SPRITES[it.icon]) g.drawImage(sprite(it.icon), cx - 7, y + 37);
        else drawTextC(g, '?', cx + 1, y + 40, UI.dim, 1, null);
      });
      const it = get('item', `story_prism_${list[st.sel]}`), got = game.has(it.id) || game.flag('lantern_lit');
      const n = PRISMS.filter((p) => game.has(`story_prism_${p}`)).length;
      drawTextC(g, game.flag('lantern_lit') ? 'All seven shine in the Star Lantern now.' : `${n} of 7 prisms found`, x + w / 2, y + 70, UI.accent2, 1, null);
      panel(g, x + 20, y + 86, w - 40, 60, 'paper');
      drawText(g, got ? it.name : 'Not found yet', x + 28, y + 92, UI.accent2, 1, null);
      wrapPx(got ? it.desc : 'Somewhere in Hoshimori Bay, someone is keeping it safe.', w - 56).slice(0, 4).forEach((l, i) => drawText(g, l, x + 28, y + 106 + i * 10, UI.ink, 1, null));
      drawText(g, 'Up/down: choose a prism', x + 4, y + h - 10, UI.dim, 1, null);
    } else {
      list.forEach((id, i) => left(get('script', id).memory || id, i));
      if (!list.length) drawText(g, 'Story scenes you see can be rewatched here.', x + 4, y + 24, UI.dim, 1, null);
      if (sel) body(get('script', sel).memory, 'Press Enter to watch this memory again. (Nothing you do in a memory changes the present.)', 'story_paper_star');
    }
    drawText(g, 'C: next tab', x + w - 60, y + h - 10, UI.dim, 1, null);
  },
});

// ---------------------------------------------------------------- dreams and nudges
script('story_dream_ch2', [scene('story_dream'), fade(0, 1), ...lines('|Misa is dreaming. A cat made of starlight pads across the dark, looking back now and then.',
  '|It stops beside a small white statue of a cat with one paw raised, curls up on top of it, and winks.', 'misa/sleepy|Under... the cat...'), fade(1, 1), scene(null), wait(0.3)], 'Dream: the starlight cat');
script('story_dream_ch5', [scene('story_dream'), fade(0, 1), ...lines('|The starlight cat again. This time it walks on water, and every pawprint becomes a ripple of light.',
  '|Far away, a lighthouse with no light. The cat sits at its door and waits, as if it has all the time in the world.', 'misa/sleepy|I\'m coming. I\'m finding them...'), fade(1, 1), scene(null), wait(0.3)], 'Dream: pawprints on the water');
script('story_dream_ch8', [scene('story_dream'), fade(0, 1), ...lines('|In the dream, seven small lights circle the starlight cat like moths around a lamp.',
  '|Two old voices, laughing in the dark. A boy with mutton-chops and a girl with a star in her hair.', '|The cat looks at Misa, then up at the sky, as if to say: soon.'), fade(1, 1), scene(null), wait(0.3)], 'Dream: seven lights');

function nudge(game) {
  const s = storyState(game), h = game.story.hint();
  if (!h) return;
  const kind = s.nudges++ % 3, text = h.text;
  if (kind === 1) {
    const from = game.flag('suzu_number') ? 'Suzu' : 'Mum';
    game.mail(`story_nudge_${game.day}`, from, from === 'Suzu' ? `Detective's notebook, page ${game.day}: have you tried this? ${text}. Just a thought. Not that I've been thinking about it all day.` : `Morning, sweetheart! How's the mystery going? Grandma's letters said you're on the case. Don't forget: ${text}. Love, Mum`);
    return;
  }
  const steps = kind === 0
    ? [scene('story_dream'), fade(0, 0.8), ...lines('|A short dream. The starlight cat sits very still, staring somewhere, as if pointing with its whole body.', `misa/sleepy|...I know, I know. ${text}.`), fade(1, 0.8), scene(null), wait(0.2)]
    : [{ t: 'call', fn: (g) => { if (g.mochi && g.world && g.world.map.id === 'home') { g.mochi.x = g.world.player.x + 20; g.mochi.y = g.world.player.y; g.mochi.set && g.mochi.set('sit', 30); } } },
      { t: 'emote', who: 'mochi', icon: 'i_exclaim' }, sfx('meow'), ...lines('mochi|Mrrp!', '|Mochi is sitting very straight, staring at the door. Then at Misa. Then at the door again.', `misa/happy|Okay, okay. You think I should get going. ${text}?`)];
  game.story.play(steps);
}

// ---------------------------------------------------------------- wishes (finale bonus, applied each morning)
export const WISHES = {
  mochi: ['For Mochi', 'Mochi\'s affection grows a little every morning', (g) => { g.state.mochi.affection = Math.min(100, g.state.mochi.affection + 2); }],
  friends: ['For my friends', 'A friend sends a kind message most mornings (+friendship)', (g) => {
    const pals = ['suzu', 'kai', 'hina', 'theo', 'rina'].filter((n) => get('npc', n));
    if (!pals.length || g.rng() > 0.6) return;
    const n = pals[Math.floor(g.rng() * pals.length)], npc = get('npc', n);
    g.mail(`story_wish_${g.day}`, npc.name, ['Morning! The lantern was so pretty last night. See you later!', 'I saw the beam from my window. It made me think of you. Weird, right?', 'Have a good day, Keeper.'][g.day % 3]);
    g.addFriend(n, 15);
  }],
  family: ['For Mum and Dad', 'A postcard from the Kujira arrives every Monday with a little pocket money', (g) => { if (g.weekday === 0) { g.mail(`story_wish_pc_${g.day}`, 'Mum', 'Postcard from the Kujira: we saw a pod of dolphins at sunrise! Dad tucked some pocket money in. Love you!'); g.addMoney(100); } }],
  warmth: ['For everyone in town', 'The lantern\'s warmth: +20 maximum energy', null],
};

// ---------------------------------------------------------------- background story events
register('system', 'story_life', {
  init(game) {
    game.bus.on('chapterDone', ({ n }) => { if ([2, 5, 8].includes(n)) game.setFlag('dream_pending', `story_dream_ch${n}`); });
    game.bus.on('dayStart', () => {
      const s = storyState(game);
      const d = game.flag('dream_pending');
      if (d) { game.setFlag('dream_pending', false); game.story.play(get('script', d).steps, { front: true }); s.lastProgress = game.day; }
      else if (game.story.activeMain() && game.day - s.lastProgress >= 3) { nudge(game); s.lastProgress = game.day; }
      const w = WISHES[game.flag('wish')]; if (w && w[2]) w[2](game);
    });
    game.bus.on('hour', () => { storyState(game).realT = Date.now(); });
    game.bus.on('gameLoaded', () => {
      const s = storyState(game), away = s.realT ? Date.now() - s.realT : 0;
      s.realT = Date.now();
      if (away < 3 * 86400000 || !s.started[0]) return;
      const c = all('chapter').filter((ch) => s.started[ch.n] !== undefined).sort((a, b) => b.n - a.n)[0], h = game.story.hint();
      if (c) game.story.play([{ t: 'call', fn: (g) => new Promise((res) => g.open('story_recap', { title: c.n === 0 ? `Prologue: ${c.name}` : `${c.n === 9 ? 'Finale' : 'Chapter ' + c.n}: ${c.name}`, text: c.teaser || c.summary, next: h && h.text }, res)) }], { front: true });
    });
    // Hana visit counter (Chapter 7 needs three visits in total)
    game.bus.on('talk', ({ npc }) => { if (npc === 'hana' && game.flag('hana_visit_day') !== game.day) { game.setFlag('hana_visit_day', game.day); game.inc('hana_visits'); } });
  },
});

// ---------------------------------------------------------------- the town reacts
register('worldLayer', 'story_town', {
  overlay(g, world, game) {
    const m = world.map, out = m.def.outdoor;
    if (!out) return;
    if (game.flag('chapter_8_done') && !game.flag('lantern_lit') && ['town', 'shotengai', 'lane'].includes(m.id)) {
      for (let i = 0; i < 12; i++) g.drawImage(sprite('story_bunting'), i * 28 - Math.round(world.cam.x / 2) % 28, 0);
    }
    if (game.flag('lantern_lit') && (game.minutes >= 19 * 60 || game.minutes < 5 * 60)) {
      const a = game.clock * 0.6, x = 160 + Math.cos(a) * 200;
      g.save(); g.globalAlpha = 0.12 + 0.06 * Math.sin(a * 2); g.fillStyle = '#fff4c0';
      g.beginPath(); g.moveTo(320, -10); g.lineTo(x - 30, 60); g.lineTo(x + 30, 70); g.fill(); g.restore();
    }
  },
});

features('Story journal', [
  'Diary phone app: the story so far, one entry per chapter in Misa\'s own words',
  'Keeper Journal: 12 pages of Hana\'s riddles, recipe and song that unlock as the story moves on, each with a doodle',
  'Prism case in the Diary: see which of the seven prisms you have found and where each one came from',
  '"Where next?" hint line in the Diary for the current story step',
  'Memories theatre: rewatch story scenes you have already seen from the Diary',
]);
features('Story', [
  'No-fail pacing: after 3 days without story progress, a gentle nudge (a dream, a text from Suzu or Mum, or Mochi pointing the way)',
  'Three starlit dream sequences after chapters 2, 5 and 8',
  'Festival bunting appears over the square and the shopping street once the Starlight Festival is announced',
  'After the finale, the Star Lantern\'s beam sweeps the night sky over every outdoor map',
  'Meteor-shower wish bonuses: Mochi\'s affection, kind texts from friends, weekly postcards with pocket money, or more energy',
]);
