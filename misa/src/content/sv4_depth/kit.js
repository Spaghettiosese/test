// Character Study kit: arc(id, [part1, part2, part3]) registers three heart events per person on the registered npc defs.
// A part = { map, when, title, thought, alt, after: [baseLine, altLine], steps: [...] } where steps use the social sc() shorthand
// (no need to open/close the scene: the kit adds arrive/face, the heart/time bonus and leave). Choice options are recorded automatically
// into the Heart Archive picks and the person's memory. Helpers: T('kind') adds a trait point, F('name') sets flag sv4d_name.
import { sc, flag, open, leave, mark, mood, time } from '../social/util.js';
import { addEvents, rec } from '../sv3_hearts/core.js';
import { check } from '../../core/cond.js';
import { S, remember, addTrait, journal, arcPart } from './state.js';

export const T = (t, n = 1) => ({ t: 'call', fn: (g) => addTrait(g, t, n) });
export const F = (name) => flag('sv4d_' + name);
export { sc, ch, iff, face, backdrop, wait, sfx, giveOr, stepBy, fade } from '../social/util.js';

export const ARCS = {};     // id -> parts
export const HEARTS = [3, 6, 9];
export const MIN_GAP = 3;   // days between parts

// walk a converted script and record the choices
function tagChoices(steps, eid, id) {
  return steps.map((s) => {
    if (s.t === 'choice') {
      return { ...s, options: s.options.map((o) => ({ ...o, steps: [
        rec(eid, o.text),
        { t: 'call', fn: (g) => { remember(g, id, 'choice', { ev: eid, text: o.text }); } },
        ...tagChoices(o.steps || [], eid, id)] })) };
    }
    if (s.t === 'if') return { ...s, then: tagChoices(s.then || [], eid, id), else: tagChoices(s.else || [], eid, id) };
    return s;
  });
}

export function arc(id, parts) {
  ARCS[id] = parts;
  const events = parts.map((p, i) => {
    const n = i + 1, eid = `sv4d_${id}_${n}`;
    p.n = n; p.eid = eid;
    const done = { t: 'call', fn: (g) => {
      const s = S(g); s.arc[id] = Math.max(s.arc[id] || 0, n);
      journal(g, id, n, p.title, p.thought);
      remember(g, id, 'arc', { part: n, title: p.title });
      g.stat('sv4dStudies');
      if (n === 3) g.stat('sv4dStudiesDone');
    } };
    return {
      id: eid, hearts: HEARTS[i], map: p.map,
      when: (g) => arcPart(g, id) === n - 1 && (n === 1 || g.day - (g.flag(`sv4d_${id}_${n - 1}_day`) || 0) >= MIN_GAP) && check(p.when, g),
      thanks: p.thanks, // optional thank-you note
      script: () => tagChoices(sc(id, ...open(id), ...p.steps, flag(`sv4d_${id}_${n}`), mark(`sv4d_${id}_${n}_day`), done, mood(8), time(45), leave(id)), eid, id),
    };
  });
  addEvents(id, events);
}
