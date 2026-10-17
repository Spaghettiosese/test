// Chapter factory for Story Acts II and III. A chapter is declared as data; stages are built from small specs:
//   { text, hint, go: 'map' | [maps] | (m)=>bool, when?, steps }          walk into a map
//   { text, hint, prop: { map, spot, dx?, dy?, label, spr? }, when?, steps }   a sparkle to interact with
//   { text, hint, talk: 'npc', when?, steps }                              talk to someone (a talk hook, advances itself)
//   { text, hint, has: Cond, steps? }                                      a condition becomes true
//   { text, hint, on: Matcher, steps? }                                    any quest matcher
// Chapter: { n, name, sub, trig, on?, by, byMin?, art?, teaser, summary, open: [steps], stages, reward?, flags?, skip?(g), onStart?(g) }
import { register, get } from '../../core/registry.js';
import { L, lines, choice, advance, scene, fade, wait, sfx, emote, place, walk, leave, goto, give, take, set, friend, card, memory, mood, call, script, hook } from '../story/util.js';
import { CHAPTERS, S, letterText, actOf } from './state.js';

export { lines, choice, advance, scene, fade, wait, sfx, emote, place, walk, leave, goto, give, take, set, friend, card, memory, mood, call, script, hook };
export const mg = (id, opts = {}, done) => ({ t: 'minigame', id, opts, done });
export const IF = (cond, then, els = []) => ({ t: 'if', cond, then: [].concat(then), else: [].concat(els) });
export const flagIs = (k, v) => (g) => g.flag(k) === v;
export const setv = (k, v) => ({ t: 'flag', k, v });
export const mail = (id, from, text) => ({ t: 'mail', id, from, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });

// Read Tidekeeper letter k: stores it (Story Log), gives the keepsake item and shows the text.
export function readLetter(k) {
  const [title, text] = letterText(k);
  return [
    sfx('page'), scene('sv3_letter_desk'),
    call((g) => { S(g).letters[k] = S(g).letters[k] || g.day; if (g.has && get('item', `sv3_letter_${k}`) && !g.has(`sv3_letter_${k}`)) g.give(`sv3_letter_${k}`, 1, true); g.bus.emit('sv3Letter', { k }); }),
    ...lines(`|Letter ${k}: "${title}"`, `|${text}`, '|It is signed with a tiny wave and two letters: T.K.'),
    scene(null),
  ];
}
// A "go and read the letter" stage. where: { map, spot, label } (default: the yard mailbox)
export const letterStage = (k, where = {}, extra = []) => ({
  text: where.text || 'Read the letter in the mailbox', hint: where.hint || 'Check the mailbox in your yard',
  prop: { map: where.map || 'yard', spot: where.spot || 'mailbox', dx: where.dx || 0, dy: where.dy || 0, label: where.label || 'A letter with a wave seal' },
  steps: [...readLetter(k), ...extra],
});

const norm = (st) => (typeof st === 'function' ? (...a) => norm(st(...a)) : Array.isArray(st) ? st.flat().map((x) => (typeof x === 'string' ? L(x) : x)) : st);
const arr = (x) => (x === undefined ? [] : [].concat(x));

export function chapterDef(n, d) {
  const qid = `sv3_q${n}`, act = actOf(n);
  const dn = arr(d.trig).map((x) => typeof x === 'string' && x.match(/^dayn>=(\d+)$/)).find(Boolean);
  CHAPTERS[n] = { n, act, name: d.name, qid, by: d.by, byMin: d.byMin, skip: d.skip, letter: d.letter, day: dn ? +dn[1] : ((CHAPTERS[n - 1] || {}).day || 29) + 1 };
  const open = [card(n, d.name, d.sub || (act === 2 ? 'Act II: The Tidekeeper\'s Letters' : 'Act III: The Second Year')), ...(d.open || [])];
  script(`sv3_open${n}`, norm(open), d.name);
  const stages = d.stages.map((sp, i) => {
    const st = { text: sp.text, hint: sp.hint || sp.text };
    const here = [`quest:${qid}=${i}`, ...arr(sp.when)];
    const steps = norm(sp.steps || []);
    if (sp.go !== undefined) { st.done = { on: 'mapEnter', map: sp.go, when: sp.when }; st.script = steps; }
    else if (sp.prop) {
      const id = `sv3_p${n}_${i}`;
      register('storyProp', id, { ...sp.prop, when: here });
      st.done = { on: 'storyProp', id }; st.script = steps;
    } else if (sp.talk) { hook(`sv3_h${n}_${i}`, sp.talk, here, typeof steps === 'function' ? (g, npc) => [...steps(g, npc), advance(qid)] : [...steps, advance(qid)]); }
    else if (sp.has !== undefined) { st.done = { has: sp.has }; st.script = steps; }
    else if (sp.on) { st.done = sp.on; st.script = steps; }
    return st;
  });
  register('chapter', `sv3_ch${n}`, {
    n, name: d.name, quest: qid, trigger: d.trig, on: d.on || ['dayStart', 'mapEnter'], open: `sv3_open${n}`, art: d.art || 'sv3_item_tidechart',
    teaser: d.teaser, summary: d.summary, onStart: d.onStart,
  });
  register('quest', qid, {
    main: true, chapter: n, name: d.name, desc: d.teaser, stages,
    reward: { ...(d.reward || {}), flags: [...(d.flags || []), `a${act}_ch${n}_done`] },
  });
}
