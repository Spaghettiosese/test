// Small script DSL for story content.
//   L('kai/happy|Morning!')  ->  { t:'say', who:'kai', mood:'happy', text }     L('|Narration.')  -> narrator
//   lines('hana|...', 'misa/happy|...', { t:'give', ... })  -> steps (objects pass through)
import { register, get } from '../../core/registry.js';

export function L(s) {
  if (typeof s !== 'string') return s;
  const i = s.indexOf('|');
  if (i < 0) return { t: 'say', who: 'misa', mood: 'neutral', text: s };
  const head = s.slice(0, i), text = s.slice(i + 1);
  if (!head) return { t: 'say', who: null, mood: null, text };
  const [who, mood = 'neutral'] = head.split('/');
  return { t: 'say', who, mood, text };
}
export const lines = (...xs) => xs.flat().map(L);
export const choice = (prompt, ...opts) => ({ t: 'choice', prompt, options: opts.map(([text, ...steps]) => ({ text, steps: lines(...steps) })) });
export const advance = (quest) => ({ t: 'advance', quest });
export const scene = (name) => ({ t: 'scene', name });
export const fade = (to, dur = 0.6) => ({ t: 'fade', to, dur });
export const wait = (dur) => ({ t: 'wait', dur });
export const sfx = (name) => ({ t: 'sfx', name });
export const emote = (who, icon) => ({ t: 'emote', who, icon });
export const place = (who, o = {}) => ({ t: 'place', who, ...o });
export const walk = (who, o = {}) => ({ t: 'walk', who, ...o });
export const leave = (who) => ({ t: 'leave', who });
export const goto = (map, spot, dir) => ({ t: 'goto', map, spot, dir });
export const give = (item, n = 1) => ({ t: 'give', item, n });
export const take = (item, n = 1) => ({ t: 'take', item, n });
export const set = (flag, v = true) => ({ t: 'set', flag, v });
export const friend = (npc, n) => ({ t: 'friend', npc, n });
export const card = (n, title, sub) => ({ t: 'card', n, title, sub });
export const memory = (id) => ({ t: 'memory', id });
export const clue = (...ids) => ({ t: 'clue', ids });
export const page = (...ids) => ({ t: 'page', ids });
export const call = (fn) => ({ t: 'call', fn });
export const mood = (n) => ({ t: 'mood', n });

// A talk hook replaces normal chatter, so it also grants the daily "talked today" friendship.
export const chatted = (npc) => call((g) => {
  if (!get('npc', npc)) return;
  const f = g.friend(npc);
  g.state.seen['met:' + npc] ||= g.day;
  if (f.talkedDay !== g.day) { f.talkedDay = g.day; g.addFriend(npc, 10); g.stat('talks'); }
});

// Register a script and return its id. memory: a title makes it rewatchable in the Diary's Memories tab.
export function script(id, steps, memoryTitle) {
  register('script', id, { steps, memory: memoryTitle || null });
  return id;
}
// Story talk hooks sit below planned hangouts (40) and above everyday reactions.
export function hook(id, npc, when, steps, priority = 30) {
  register('talkHook', id, { npc, when, priority, steps: (g, n) => [chatted(npc), ...(typeof steps === 'function' ? steps(g, n) : steps)] });
}
export const has = (g, item) => g.has(item);
