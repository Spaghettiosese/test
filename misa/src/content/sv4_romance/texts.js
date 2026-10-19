// Texting (sv4_romance): each candidate sends timed messages during the day (once you have their number, 2 hearts); the
// message waits in the Romance app > CHAT tab and Misa picks one of three replies, which moves affection. Twenty threads per
// person across the year, reading weather, time of day, season, festivals and how close you are. Replies are never penalised.
// Console: __misa.sv4r.chat('kai')  (deliver the next eligible message)   __misa.sv4r.reply('kai', 0)
import { API, S, addAff, stageOf, candidates, visibleCands, firstName, isCand, nameOf } from './core.js';
import { DATA } from './texts_b.js';
import { genericThreads } from './texts_b.js';
import { register } from '../../core/registry.js';

export const threadsOf = (id) => (DATA[id] ? DATA[id] : genericThreads(id)).map((th, i) => ({ ...th, id: `${id}_${i}` }));
export const strip = (s) => s.replace(/^[a-z]+\|/, '').replace(/^\(Text\)\s*/, '');
export function chatOf(g, id) {
  const c = (S(g).chat[id] ||= { log: [], pend: null, sent: {}, today: { day: 0, n: 0 } });
  return c;
}
export function pushLog(g, id, e) {
  const c = chatOf(g, id); c.log.push({ me: !!e.me, text: e.text, ico: e.ico || null, day: g.day, min: g.minutes }); if (c.log.length > 40) c.log.shift();
}
export const stageIdx = (g, id) => Math.max(0, stageOf(g, id));
export function eligible(g, id) {
  const c = chatOf(g, id), st = stageIdx(g, id);
  return threadsOf(id).filter((th) => !c.sent[th.id] && th.min <= st && g.check(th.cond));
}
export function deliver(g, id, th) {
  const c = chatOf(g, id);
  th = th || eligible(g, id)[0];
  if (!th || c.pend) return null;
  c.sent[th.id] = g.day; c.pend = { tid: th.id, day: g.day, min: g.minutes };
  pushLog(g, id, { me: false, text: th.msg, ico: th.ico });
  c.today = c.today.day === g.day ? c.today : { day: g.day, n: 0 }; c.today.n++;
  g.toast(`${firstName(id)} sent you a message`, th.ico || 'i_chat');
  g.bus.emit('textReceived', { npc: id, tid: th.id });
  return th;
}
export const pending = (g, id) => { const c = chatOf(g, id); return c.pend ? threadsOf(id).find((t) => t.id === c.pend.tid) || null : null; };
export function reply(g, id, i) {
  const c = chatOf(g, id), th = pending(g, id);
  if (!th) return false;
  const [text, reaction, pts] = th.r[Math.max(0, Math.min(2, i))];
  pushLog(g, id, { me: true, text });
  pushLog(g, id, { me: false, text: strip(reaction), ico: pts >= 8 ? 'heart' : null });
  addAff(g, id, pts); c.pend = null;
  g.stat('textsReplied'); g.bus.emit('chatReply', { npc: id, tid: th.id, pick: i, pts });
  return true;
}
export const unreadCount = (g) => visibleCands(g).filter((id) => chatOf(g, id).pend).length;
export const chatCands = (g) => visibleCands(g).filter((id) => g.hearts(id) >= 2 || chatOf(g, id).log.length);

register('system', 'sv4Texts', {
  init(game) {
    game.bus.on('dayStart', () => {
      for (const id of candidates()) { const c = chatOf(game, id); if (c.pend && c.pend.day < game.day - 2) { pushLog(game, id, { me: true, text: '(Busy day, no reply)' }); c.pend = null; } }
    });
    game.bus.on('hour', ({ h }) => {
      if (h < 8 || h > 21) return;
      for (const id of visibleCands(game)) {
        if (game.hearts(id) < 2) continue;
        const c = chatOf(game, id), st = stageIdx(game, id), cap = st >= 4 ? 2 : 1;
        const today = c.today.day === game.day ? c.today.n : 0;
        if (c.pend || today >= cap) continue;
        if (game.rngFor(`sv4chat:${id}:${game.day}:${h}`)() > 0.18 + 0.06 * st) continue;
        const pool = eligible(game, id);
        if (pool.length) deliver(game, id, pool[Math.floor(game.rngFor(`sv4pick:${id}:${game.day}`)() * Math.min(3, pool.length))]);
      }
    });
  },
});
API.chat = (g, id, tid) => { const th = tid ? threadsOf(id).find((t) => t.id === tid) : null; return deliver(g, id, th); };
API.reply = (g, id, i) => reply(g, id, i || 0);
