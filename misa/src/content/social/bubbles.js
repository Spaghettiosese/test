// Non-blocking speech bubbles in the world: map-entry greetings, overheard NPC-to-NPC chats, and residents
// turning their heads toward Misa as she passes.
import { register, get, features } from '../../core/registry.js';
import { drawText, wrap, measure } from '../../font.js';
import { TILE } from '../../world/map.js';
import { met } from './util.js';
import { smallTalk, npcMood } from './talk.js';
import { CHATS } from './chats.js';

const bubbles = []; // { who, text, t }
export function bubble(who, text, secs = 2.8) {
  for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].who === who) bubbles.splice(i, 1);
  bubbles.push({ who, text, t: secs });
}

register('worldLayer', 'soc_bubbles', {
  overlay(g, world) {
    for (const b of bubbles) {
      const a = b.who === 'misa' ? world.player : world.npcs[b.who];
      if (!a || (b.who !== 'misa' && !a.present)) continue;
      const lines = wrap(b.text, 26).slice(0, 3), w = Math.max(...lines.map((l) => measure(l))) + 8, h = lines.length * 7 + 5;
      let x = Math.round(world.sx(a.x) - w / 2), y = world.sy(a.y) - 74 - h;
      x = Math.max(2, Math.min(318 - w, x)); y = Math.max(28, y);
      g.globalAlpha = Math.min(1, b.t * 3);
      g.fillStyle = '#2b1d2e'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = '#fff6e6'; g.fillRect(x, y, w, h);
      const tx = Math.max(x + 3, Math.min(x + w - 6, world.sx(a.x) - 2));
      g.fillStyle = '#2b1d2e'; g.fillRect(tx - 1, y + h, 5, 3); g.fillStyle = '#fff6e6'; g.fillRect(tx, y + h, 3, 2);
      lines.forEach((l, i) => drawText(g, l, x + 4, y + 3 + i * 7, '#3a2a30', 1, null));
      g.globalAlpha = 1;
    }
  },
});

const GREET = {
  cheerful: ['Morning, Misa!', 'Hi Misa!', 'Hey there!'],
  calm: ['Oh, hello.', 'Hi, Misa.'],
  sleepy: ['*yawn* Hi...', 'Mm... hello...'],
  grumpy: ['Hm. Hello.', 'Oh. Hi.'],
};
let chat = null, chatCool = 4, greetT = -1;

register('worldTick', 'soc_life', {
  update(dt, world, game) {
    for (let i = bubbles.length - 1; i >= 0; i--) if ((bubbles[i].t -= dt) <= 0) bubbles.splice(i, 1);
    const p = world.player, busy = game.scenes.top !== world;
    // heads turn toward Misa within 2 tiles
    for (const n of world.presentNPCs()) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (!n.moving && !n.path && d < 2.2 * TILE) { n.faceTo(p.x, p.y); n.socLook = true; }
      else if (n.socLook && !n.moving && !n.path) { n.socLook = false; n.dir = (n.stop && n.stop.dir) || 'down'; }
    }
    if (busy) return;
    // greetings shortly after arriving on a map
    if (greetT > 0 && (greetT -= dt) <= 0) {
      let shown = 0;
      for (const n of world.presentNPCs()) {
        if (shown >= 2 || n.moving) continue;
        const id = n.id, f = game.friend(id);
        if (!met(game, id) || f.greetDay === game.day || Math.hypot(n.x - p.x, n.y - p.y) > 9 * TILE) continue;
        f.greetDay = game.day; shown++;
        const own = (n.def.lines && n.def.lines.greet) || [], nick = n.def.social && n.def.social.nickname;
        const pool = game.hearts(id) >= 10 && nick ? [`Hey, ${nick}!`] : own.length && npcMood(game, id) !== 'grumpy' ? own : GREET[npcMood(game, id)];
        setTimeout(() => bubble(id, pool[Math.floor(game.rng() * pool.length)], 2.4), shown * 700);
      }
    }
    // ambient chats between two residents standing near each other
    if (chat) {
      chat.t -= dt;
      const a = world.npcs[chat.a], b = world.npcs[chat.b];
      if (!a || !b || !a.present || !b.present) { chat = null; return; }
      if (Math.hypot(a.x - p.x, a.y - p.y) < 6 * TILE) chat.heard = true;
      if (chat.t <= 0) {
        if (chat.i >= chat.lines.length) {
          if (chat.heard) { smallTalk(game, chat.a, 2); smallTalk(game, chat.b, 2); game.stat('chatsOverheard'); }
          chat = null; chatCool = 8; return;
        }
        const [who, text] = chat.lines[chat.i++], other = who === chat.a ? b : a, me = who === chat.a ? a : b;
        me.faceTo(other.x, other.y); other.faceTo(me.x, me.y);
        bubble(who, text, 2.9); chat.t = 3.1;
      }
      return;
    }
    if ((chatCool -= dt) > 0) return;
    chatCool = 3;
    const here = world.presentNPCs().filter((n) => !n.moving && !n.path && Math.hypot(n.x - p.x, n.y - p.y) < 11 * TILE);
    const seen = game.state.social.chats;
    for (const c of CHATS) {
      const a = here.find((n) => n.id === c.a), b = here.find((n) => n.id === c.b);
      if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) > 7 * TILE) continue;
      if (seen[c.id] === game.day || (c.when && !game.check(c.when))) continue;
      seen[c.id] = game.day;
      chat = { a: c.a, b: c.b, lines: c.lines, i: 0, t: 0.2, heard: false };
      return;
    }
  },
});

register('system', 'socialBubbles', {
  init(game) {
    game.bubble = bubble;
    game.bus.on('mapEnter', () => { chat = null; bubbles.length = 0; greetT = 1.2; chatCool = 3; });
  },
});

features('Town life', [
  'Speech bubbles: residents greet Misa when she walks onto their map, in a tone that fits their mood',
  'Overheard conversations: pairs of friends chat in bubbles when they stand near each other (30+ chats)',
  'Listening in on a chat nudges your friendship with both speakers',
  'Residents turn to look at Misa when she walks past them',
  'Best friends at 10 hearts greet Misa by a special nickname',
]);
