// Story props: clue sparkles, boxes and statues placed on other areas' maps by spot name, without editing those maps.
//   register('storyProp', id, { map, spot, dx?, dy?, spr?, label, when?: Cond, run?(game), script?, lift? })
// They're drawn by a worldLayer and picked up by a targetProvider (E to interact). Interacting emits
// 'storyProp' { id } on the bus (quest matchers can listen) and then runs the prop.
// The shared interactions owned by the story area (mystery_board, keeper_trunk, lantern_lamp, logbook) are in board.js
// and lighthouse.js.
import { register, all, get, features } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { spotPos } from '../../systems/quests.js';
import { SPRITES } from '../../art.js';

const TILE = 16;
function where(p) {
  const s = p.pos || spotPos(p.map, p.spot);
  if (!s) return null;
  return { x: (s[0] + (p.dx || 0)) * TILE + 8, y: (s[1] + (p.dy || 0)) * TILE + 14 };
}
export function activeProps(world, game) {
  if (!world || !world.map) return [];
  return all('storyProp').filter((p) => p.map === world.map.id && check(p.when, game));
}
export function runProp(game, p) {
  game.bus.emit('storyProp', { id: p.id });
  if (p.run) return p.run(game);
  if (p.script) { const sc = get('script', p.script); if (sc) return game.run(typeof sc.steps === 'function' ? sc.steps(game, {}) : sc.steps); }
  return null;
}

register('worldLayer', 'story_props', {
  sprites(world, game) {
    const out = [];
    for (const p of activeProps(world, game)) {
      const at = where(p);
      if (!at) continue;
      out.push({ y: at.y + (p.depth || 0), draw: (g, w) => {
        const t = game.clock + p.id.length;
        if (p.spr && SPRITES[p.spr]) { if (p.shadow !== false) w.shadow(at.x, at.y, 9); w.drawFeet(p.spr, at.x, at.y - (p.lift || 0)); }
        if (!p.spr || p.sparkle) {
          const bob = Math.round(Math.sin(t * 3) * 1.5);
          w.drawFeet(`story_sparkle_${Math.floor(t * 3) % 2}`, at.x, at.y - (p.spr ? 26 : 6) + bob - (p.lift || 0));
        }
      } });
    }
    return out;
  },
});

register('targetProvider', 'story_props', {
  find(world, game) {
    let best = null, bd = 18;
    const p0 = world.player;
    for (const p of activeProps(world, game)) {
      const at = where(p);
      if (!at) continue;
      const d = Math.hypot(at.x - p0.x, at.y - p0.y);
      if (d < bd) { bd = d; best = { label: typeof p.label === 'function' ? p.label(game) : p.label || 'Look', dist: Math.max(0, d - 6), run: (g) => runProp(g, p), x: at.x, y: at.y - 8 }; }
    }
    return best;
  },
});

features('Story', [
  'Story clues sparkle where they are hidden around town, so the next step is always visible once you know where to look',
]);
