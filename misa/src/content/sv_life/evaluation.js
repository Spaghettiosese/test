// Year-end evaluation (Winter 28, repeats every year) by Grandma Hana in a lantern-lit scene, scored over eight categories
// (1000 each, 8000 total) with four lantern thresholds, a stat summary screen and rewards; plus the Hoshimori Heart Meter phone app
// (perfection tracker: % complete over friendships, collections, recipes, achievements, story, community and secrets).
// Everything reads existing registries and game.state and guards for missing slices. Run it by hand:
//   import('/src/content/sv_life/evaluation.js').then(m => m.runEval(__misa))
import { register, get, all, features } from '../../core/registry.js';
import { yearOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawPortrait } from '../../ui/portraits.js';
import { UI, rect, panel, drawText, drawTextC, wrap, inside } from '../../ui/ui.js';
import { S, say, N, call, has, giveOr, stickers, people, idle, isYearEnd, yr } from './state.js';
import { foundCount } from './secrets.js';

const soft = (v, cap) => Math.max(0, Math.min(1, (v || 0) / cap));
const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const st = (g, k) => (g.state.stats && g.state.stats[k]) || 0;
const coll = (g, kind, total) => soft(Object.keys((g.state.collections || {})[kind] || {}).length, total);
const seenCount = (g, kind) => Object.keys(S(g).seen[kind] || {}).length;
export function pctOf(g) {
  const npcs = people(), hearts = avg(npcs.map((n) => g.hearts(n.id) / 10));
  const items = (cat) => all('item').filter((i) => i.cat === cat).length || 1;
  const recipes = Object.keys((g.state.hobbies && g.state.hobbies.recipes) || {}).length;
  const chapters = Object.keys(g.state.flags || {}).filter((k) => /^chapter_\d+_done$/.test(k) && g.state.flags[k]).length;
  const quests = all('quest'), qDone = quests.filter((q) => g.questDone(q.id)).length;
  const story = avg([soft(chapters, 9), soft(qDone, quests.length || 1)]);
  const community = avg([g.flag('community_restored') ? 1 : 0, soft(st(g, 'requestsDone'), 25), soft(st(g, 'festivalsAttended'), 12), soft(S(g).orders.doneCount, 15), soft(st(g, 'kindDeeds') + st(g, 'litterCollected'), 40)]);
  return {
    friends: hearts, fish: coll(g, 'fish', items('fish')), bugs: coll(g, 'bug', items('bug')), shells: avg([coll(g, 'shell', items('shell')), coll(g, 'mineral', items('mineral'))]),
    crops: soft(seenCount(g, 'crop'), items('crop')), recipes: soft(recipes, all('recipe').length || 1), ach: soft(Object.keys(g.state.achievements || {}).length, all('achievement').length || 1),
    story, community, secrets: avg([soft(foundCount(g), 30), coll(g, 'figurine', 24)]),
  };
}
export const METER = [['friends', 'Friendships', 20], ['story', 'Story', 14], ['ach', 'Achievements', 12], ['recipes', 'Recipes', 10], ['fish', 'Fish', 8], ['bugs', 'Bugs', 8], ['shells', 'Shells and minerals', 8], ['crops', 'Crops', 8], ['community', 'Community', 6], ['secrets', 'Secrets and toys', 6]];
export const heartPct = (g) => { const p = pctOf(g); return Math.round(METER.reduce((a, [k, , w]) => a + p[k] * w, 0)); };

export const CATS = ['Home comfort', 'Friendships', 'School grades', 'Hobbies', 'Community', 'Story', 'Money', 'Collections'];
export const THRESH = [1500, 3000, 4500, 6000], MAX = 8000;
const RANKS = ['Little Sprout', 'Candle Bearer', 'Lantern Walker', 'Lantern Keeper\'s Heir', 'Heart of Hoshimori'];
export function evaluate(g) {
  const p = pctOf(g);
  const f = [
    avg([soft(st(g, 'decorPlaced'), 40), soft(st(g, 'homeTasks'), 150), soft(st(g, 'perfectHomeDays'), 15), soft(st(g, 'homeUpgrades'), 3), soft(st(g, 'furnitureUsed'), 60)]),
    avg([p.friends, p.friends, soft(st(g, 'gifts'), 60), soft(st(g, 'hangouts'), 20)]),
    avg([soft(st(g, 'classesAttended'), 120), soft(st(g, 'examsTaken'), 6), soft(st(g, 'classesTopGrade'), 20), soft(g.skillLevel('study'), 10), soft(st(g, 'studySessions'), 30)]),
    avg([soft(st(g, 'fishCaught'), 80), soft(st(g, 'bugsCaught'), 60), soft(st(g, 'cooked'), 80), soft(st(g, 'harvested'), 120), soft(st(g, 'crafted'), 30)]),
    p.community, p.story,
    soft(st(g, 'coinsEarned'), 60000) * 0.7 + soft(g.money, 15000) * 0.3,
    avg([p.fish, p.bugs, p.shells, p.crops, coll(g, 'figurine', 24)]),
  ];
  const cats = CATS.map((name, i) => ({ name, pct: f[i], score: Math.round(f[i] * 1000) })), total = cats.reduce((a, c) => a + c.score, 0);
  const lanterns = THRESH.filter((t) => total >= t).length;
  return { cats, total, lanterns, rank: RANKS[lanterns], year: yr(g) };
}
const REW_FURN = ['furn_candles', 'furn_lantern_paper', 'furn_lamp_star', 'furn_star_snow_globe', 'furn_star_tree'];
function rewards(g, r) {
  const e = (S(g).evals[r.year] = { total: r.total, lanterns: r.lanterns, rank: r.rank, day: g.day, cats: r.cats.map((c) => c.score) });
  g.addMoney(200 + 300 * r.lanterns); stickers(g, [1, 2, 3, 4, 6][r.lanterns], 'year-end evaluation');
  const title = `${r.rank}${r.year > 1 ? ' ' + r.year : ''}`; (g.state.titles ||= []).includes(title) || g.state.titles.push(title); g.state.title = title;
  giveOr(g, REW_FURN[r.lanterns], 150 + 100 * r.lanterns);
  g.stat('yearEvaluations'); g.addMood(15); g.bus.emit('svEvaluation', { year: r.year, lanterns: r.lanterns, total: r.total });
  return e;
}

// ---------------------------------------------------------------- scene: stat summary with lanterns
const fillL = (g, x, y, lit, t, i) => {
  rect(g, K.wood[1], x + 5, y - 6, 2, 6); rect(g, lit ? '#f4a860' : '#5a4a58', x, y, 12, 14); rect(g, lit ? '#ffe9a0' : '#6a5a68', x + 2, y + 2, 8, 10);
  rect(g, K.wood[0], x, y, 12, 2); rect(g, K.wood[0], x, y + 12, 12, 2); if (lit) { const f = Math.floor(t * 6 + i) % 3; rect(g, '#fff6c0', x + 4, y + 4 + (f ? 1 : 0), 4, 5); }
};
class EvalScene {
  constructor(game, r, onDone) { Object.assign(this, { name: 'sv_eval', opaque: true, game, r, onDone, t: 0, shown: 0 }); }
  update(dt, input, game) {
    this.t += dt; const k = input.pressed, full = this.t > CATS.length * 0.45 + 1.4;
    this.shown = Math.min(CATS.length + 1, Math.floor(this.t / 0.45));
    if (input.justDown || k.has('enter') || k.has(' ') || k.has('e') || k.has('escape')) { if (!full) { this.t = CATS.length * 0.45 + 1.5; game.sfx('blip'); } else { game.scenes.pop(this); this.onDone && this.onDone(); } }
  }
  draw(g) {
    const r = this.r, t = this.t;
    rect(g, '#1f1428', 0, 0, 320, 224); rect(g, '#2d1c38', 0, 0, 320, 40);
    for (let i = 0; i < 9; i++) fillL(g, 14 + i * 36, 18 + (i % 2) * 5, true, t, i);
    drawTextC(g, `YEAR ${r.year} EVALUATION`, 160, 3, UI.gold, 1, null);
    panel(g, 12, 44, 296, 168, 'dark');
    r.cats.forEach((c, i) => {
      const y = 52 + i * 14, on = this.shown > i, w = on ? Math.min(1, (t - i * 0.45) * 2) : 0;
      drawText(g, c.name.toUpperCase(), 20, y + 2, UI.text, 1, null);
      rect(g, UI.ink, 118, y, 140, 9); rect(g, '#3b2a48', 119, y + 1, 138, 7); rect(g, '#f4a860', 119, y + 1, Math.round(138 * c.pct * w), 7);
      if (on) drawText(g, String(Math.round(c.score * w)), 264, y + 2, UI.gold, 1, null);
    });
    const done = this.shown > CATS.length;
    if (done) {
      drawText(g, `TOTAL ${r.total} / ${MAX}`, 20, 168, UI.gold, 1, null); drawText(g, r.rank.toUpperCase(), 20, 179, UI.text, 1, null);
      THRESH.forEach((th, i) => { fillL(g, 196 + i * 26, 170, r.lanterns > i && Math.floor(t * 3) % 8 !== 0 || r.lanterns > i, t, i); drawText(g, String(th), 191 + i * 26, 190, r.total >= th ? UI.gold : UI.dim, 1, null); });
      if (this.t > CATS.length * 0.45 + 1.4) drawText(g, 'TAP OR PRESS ENTER', 20, 199, UI.dim, 1, null);
    }
  }
}
register('scene', 'sv_eval', { make: (game, r, onDone) => new EvalScene(game, r, onDone) });
register('backdrop', 'sv_lantern_room', {
  draw(g, game, t) {
    rect(g, '#1f1428', 0, 0, 320, 224); rect(g, '#33203f', 0, 120, 320, 104); rect(g, '#4a2f3c', 0, 150, 320, 74);
    for (let i = 0; i < 8; i++) { const x = 20 + i * 40, y = 20 + (i % 3) * 12; rect(g, '#6a4a5a', x + 5, 0, 1, y); fillL(g, x, y, true, t, i); rect(g, 'rgba(255,200,120,.10)', x - 10, y - 6, 32, 30); }
    rect(g, '#6a4030', 70, 160, 180, 6); rect(g, '#8a5a40', 70, 160, 180, 2);
    rect(g, '#f4a860', 140, 150, 6, 10); rect(g, '#ffe9a0', 141, 148 + (Math.floor(t * 6) % 2), 4, 4);
    drawPortrait(g, 'hana', 'happy', Math.floor(t * 2) % 2, 0, 128, 92);
  },
});

// ---------------------------------------------------------------- the scene script
export function evalSteps(game, r = evaluate(game)) {
  const prev = S(game).evals[r.year - 1], big = r.lanterns >= 3;
  const react = [
    ['neutral', 'Hm. A little candle. Well, every great lantern began as a small flame, dear. We will light the next one together.'],
    ['happy', 'A warm glow! I can see the oil is nearly full. You work hard and you play hard, and I approve of the playing most.'],
    ['happy', 'Three lanterns! The whole room is glowing. Your grandfather would have cried into his tea. He cried into everything.'],
    ['happy', 'Oh, my star. You have lit the whole garden. This is what a Lantern Keeper looks like.'],
    ['surprised', 'All four lanterns, and a fifth in your heart! I... what was I saying? Oh yes. I am so proud of you, Misa.'],
  ][r.lanterns];
  return [
    { t: 'fade', to: 1, dur: 0.7 }, { t: 'scene', name: 'sv_lantern_room' }, { t: 'fade', to: 0, dur: 0.7 },
    N('Evening. Paper lanterns hang in the Sunny Pines hall. Grandma Hana has set out a pot of tea and a very old notebook.'),
    say('hana', 'happy', 'There you are, dear! Sit, sit. It is the end of the year, and in this family we count our lanterns.'),
    say('hana', 'neutral', `Now then. Year ${r.year}. I wrote everything down. Mostly. Some of it is a recipe for pickles, but the rest is about you.`),
    call((g) => new Promise((res) => { if (g.open('sv_eval', r, res) === null) res(); })),
    say('hana', react[0], react[1]),
    prev ? say('hana', 'neutral', r.total >= prev.total ? `And last year you scored ${prev.total}. This year is ${r.total - prev.total} higher! Look at you grow.` : `Last year you scored ${prev.total}. A little less this time, but it was a quieter year, no? There is always spring.`) : say('hana', 'neutral', 'This is your first year, so there is nothing to compare, except the very small child who arrived at my door last spring.'),
    call((g) => { const e = rewards(g, r); return g.toast(`Evaluation: ${e.rank}`, 'i_star'); }),
    say('hana', 'happy', 'Here, I made you a few things. A title, a gift for your room, and some stickers I found in the sofa.'),
    big ? say('misa', 'happy', 'Thank you, Grandma. I will keep the lantern lit. Promise.') : say('misa', 'happy', 'Thank you, Grandma. Next year I will make it brighter.'),
    { t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.6 },
  ];
}
export function runEval(game) { return game.run(evalSteps(game)); }
function due(g) {
  const y = yr(g), ev = S(g).evals;
  if (isYearEnd(g) && g.minutes >= 17 * 60 + 30 && !ev[y]) return true;
  return y >= 2 && !ev[y - 1] && !isYearEnd(g) && g.season !== 'winter';
}
export function tryEval(g) { if (!idle(g) || !due(g) || S(g).evalBusy) return; S(g).evalBusy = 1; const p = runEval(g); const done = () => { S(g).evalBusy = 0; }; p && p.then ? p.then(done, done) : done(); }

register('system', 'svl_eval', {
  init(game) {
    // catch-all trackers used by the Heart Meter
    game.bus.on('itemGot', (e) => { const it = e && get('item', e.item); if (it && it.cat === 'crop') (S(game).seen.crop ||= {})[e.item] = 1; });
    game.bus.on('harvested', (e) => { if (e && e.item) (S(game).seen.crop ||= {})[e.item] = 1; });
    game.bus.on('hour', () => tryEval(game));
    game.bus.on('mapEnter', () => setTimeout(() => tryEval(game), 1500));
    game.bus.on('dayStart', () => {
      if (game.season === 'winter' && game.day % 28 === 27 && !S(game).evals[yr(game)]) game.mail(`svl_eval_note_${yr(game)}`, 'Grandma Hana', 'Misa, dear! Tomorrow evening is the end of the year. Come to Sunny Pines for tea and the lantern count. I will have my notebook. And possibly my glasses.');
    });
  },
});

// ---------------------------------------------------------------- phone app: Heart Meter (perfection) + year-end preview
const heartIcon = (g, x, y, c) => { rect(g, c, x + 1, y, 3, 2); rect(g, c, x + 6, y, 3, 2); rect(g, c, x, y + 1, 10, 3); rect(g, c, x + 1, y + 4, 8, 2); rect(g, c, x + 3, y + 6, 4, 2); rect(g, c, x + 4, y + 8, 2, 1); };
register('phoneApp', 'sv_heart', {
  name: 'Heart Meter', icon: 'heart', order: 37,
  open(game, app) { app.state.tab ??= 0; },
  update(dt, input, game, app) { const k = input.pressed; if (k.has('c') || (input.justDown && inside(input.mx, input.my, app.area.x + 150, app.area.y, 140, 14))) { app.state.tab = 1 - app.state.tab; game.sfx('blip'); } },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, tab = app.state.tab, pct = heartPct(game);
    rect(g, UI.accent, x, y, 142, 14); drawTextC(g, tab ? 'YEAR-END SCORE (C)' : 'HOSHIMORI HEART METER (C)', x + 71, y + 4, UI.text, 1, null);
    if (!tab) {
      const p = pctOf(game);
      heartIcon(g, x + 154, y + 2, pct >= 50 ? '#f29aa0' : '#c9a6b0'); drawText(g, `${pct}% COMPLETE`, x + 170, y + 5, UI.accent2, 2, null);
      METER.forEach(([k, name], i) => {
        const yy = y + 22 + i * 14, v = p[k];
        drawText(g, name.toUpperCase(), x + 4, yy + 2, UI.ink, 1, null);
        rect(g, UI.ink, x + 118, yy, 120, 9); rect(g, '#e8d9b8', x + 119, yy + 1, 118, 7); rect(g, v >= 1 ? UI.good : '#f29aa0', x + 119, yy + 1, Math.round(118 * v), 7);
        drawText(g, `${Math.round(v * 100)}%`, x + 244, yy + 2, UI.ink, 1, null);
      });
      drawText(g, game.flag('community_restored') ? 'COMMUNITY HALL RESTORED' : 'COMMUNITY HALL: NOT YET RESTORED', x + 4, y + h - 9, game.flag('community_restored') ? UI.good : UI.dim, 1, null);
    } else {
      const r = evaluate(game);
      drawText(g, `YEAR ${r.year}: ${r.total}/${MAX}`, x + 154, y + 3, UI.accent2, 1, null);
      r.cats.forEach((c, i) => { const yy = y + 22 + i * 14; drawText(g, c.name.toUpperCase(), x + 4, yy + 2, UI.ink, 1, null); rect(g, UI.ink, x + 118, yy, 120, 9); rect(g, '#e8d9b8', x + 119, yy + 1, 118, 7); rect(g, '#f4a860', x + 119, yy + 1, Math.round(118 * c.pct), 7); drawText(g, String(c.score), x + 244, yy + 2, UI.ink, 1, null); });
      THRESH.forEach((th, i) => fillL(g, x + 4 + i * 36, y + h - 28, r.lanterns > i, game.clock, i));
      drawText(g, `${r.rank.toUpperCase()}   GRANDMA VISITS WINTER 28`, x + 150, y + h - 22, UI.dim, 1, null);
      const best = Object.entries(S(game).evals).map(([yy, e]) => `Y${yy}:${e.total}`).join('  '); if (best) drawText(g, best, x + 150, y + h - 12, UI.dim, 1, null);
    }
  },
});

features('Town Life', [
  'Year-end evaluation: on Winter 28 evening Grandma Hana hosts a lantern-lit scene and counts how Misa did',
  'Misa is scored over eight categories (home comfort, friendships, school grades, hobbies, community, story, money, collections) out of 8000',
  'Four lantern thresholds (1500, 3000, 4500, 6000) light up on the stat summary screen, with bars that fill category by category',
  'Hana\'s reaction changes with how many lanterns were lit and compares to the previous year',
  'Evaluation rewards: coins, Star Stickers, a furniture piece, and a title from Little Sprout to Heart of Hoshimori',
  'The evaluation repeats every year, and a missed one is held for the next time Misa is free in the open world',
  'A mail from Hana on Winter 27 reminds Misa to come to the lantern count',
  'Hoshimori Heart Meter phone app: overall percent complete over friendships, story, achievements, recipes, fish, bugs, shells, crops, community and secrets',
  'The Heart Meter tracks every crop ever held, and reads fish, bug, shell, mineral and toy collections from the hobbies and economy areas',
  'The Heart Meter also previews this year\'s evaluation score, lanterns and past results',
]);
