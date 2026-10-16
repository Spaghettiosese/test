// The town changes as Misa settles in: lamp posts appear along the square, a flower bed blooms in the yard once she has planted
// enough, a bench plaque with her name appears after 50 benches rested, and a town sign tracks the population and the year.
import { register, features } from '../../core/registry.js';
import { spr, RAMPS as K } from '../town/lib.js';
import { spotPos } from '../../systems/festivals.js';
import { drawText, drawTextC } from '../../font.js';
import { yearOf } from '../../core/time.js';
import { S, say, N, call, people } from './state.js';

const st = (g, k) => (g.state.stats && g.state.stats[k]) || 0;
spr('svl_lamp_post', 14, 46, (R) => {
  R(6, 12, 3, 32, K.metal[1]); R(6, 12, 1, 32, K.metal[3]); R(3, 42, 9, 3, K.metal[1]); R(4, 40, 7, 2, K.metal[2]);
  R(1, 2, 13, 11, K.metal[0]); R(2, 3, 11, 9, K.butter[3]); R(3, 4, 9, 7, K.butter[4]); R(0, 1, 15, 2, K.metal[1]); R(5, 0, 5, 2, K.metal[2]); R(7, 4, 1, 7, K.butter[2]);
});
const bedSpr = (name, n) => spr(name, 44, 18, (R) => {
  R(0, 6, 44, 11, K.wood[2]); R(0, 6, 44, 2, K.wood[4]); R(0, 15, 44, 2, K.wood[0]); R(2, 8, 40, 7, K.dirt ? K.dirt[2] : '#6b4a36');
  const cols = [K.coral[3], K.butter[4], K.lilac[3], K.sky[3], K.ribbon[3]];
  for (let i = 0; i < n; i++) { const x = 4 + ((i * 11) % 36), y = 3 + (i % 3) * 2; R(x + 1, y + 3, 1, 5, K.forest[3]); R(x - 1, y, 4, 4, cols[i % 5]); R(x, y + 1, 2, 2, K.butter[4]); }
});
bedSpr('svl_bed_1', 4); bedSpr('svl_bed_2', 8); bedSpr('svl_bed_3', 13);
spr('svl_plaque', 14, 8, (R) => { R(0, 0, 14, 8, K.butter[2]); R(1, 1, 12, 6, K.butter[4]); R(3, 3, 8, 1, K.wood[1]); R(4, 5, 6, 1, K.wood[1]); });
spr('svl_town_sign', 64, 52, (R) => {
  R(8, 30, 4, 22, K.wood[1]); R(52, 30, 4, 22, K.wood[1]);
  R(0, 2, 64, 30, K.wood[3]); R(0, 2, 64, 2, K.wood[4]); R(0, 30, 64, 2, K.wood[0]); R(3, 5, 58, 24, K.forest[1]); R(3, 5, 58, 2, K.forest[2]);
  R(28, 0, 8, 4, K.coral[2]);
});

const LAMPS = [['town', 'bench_1', -2, 0, (g) => st(g, 'daysPlayed') >= 7], ['town', 'bench_2', 2, 0, (g) => st(g, 'daysPlayed') >= 14], ['town', 'fountain', 3, 1, (g) => st(g, 'daysPlayed') >= 28],
  ['town', 'noticeboard', -2, 0, (g) => yearOf(g.day) >= 2], ['town', 'cafe_terrace', 2, 1, (g) => g.flag('community_restored') || st(g, 'requestsDone') >= 20], ['lane', 'crossroad', 2, 0, (g) => st(g, 'daysPlayed') >= 21]];
export const lampsOn = (g) => LAMPS.filter((l) => l[4](g));
const bedLevel = (g) => (st(g, 'planted') >= 60 ? 3 : st(g, 'planted') >= 25 ? 2 : st(g, 'planted') >= 5 ? 1 : 0);
export const popOf = (g) => 1180 + 6 * (st(g, 'peopleMet') || 0) + 40 * (yearOf(g.day) - 1) + Math.floor(st(g, 'daysPlayed') / 2) + 3 * st(g, 'requestsDone');
export const hasPlaque = (g) => st(g, 'benchSits') >= 50;

register('worldLayer', 'svl_town_changes', {
  sprites(world, game) {
    const out = [], id = world.map.id;
    for (const [m, sp, dx, dy] of lampsOn(game)) if (m === id) { const p = spotPos(m, sp, dx, dy); if (p) out.push({ y: p.y, draw: () => { world.shadow(p.x, p.y, 5); world.drawFeet('svl_lamp_post', p.x, p.y); } }); }
    if (id === 'yard' && bedLevel(game)) { const p = spotPos('yard', 'porch', -3, 2); if (p) out.push({ y: p.y, draw: () => world.drawFeet('svl_bed_' + bedLevel(game), p.x, p.y) }); }
    if (id === 'town') {
      if (hasPlaque(game)) { const p = spotPos('town', 'bench_1', 0, 0); if (p) out.push({ y: p.y + 2, draw: () => world.drawFeet('svl_plaque', p.x, p.y - 6) }); }
      const q = spotPos('town', 'noticeboard', -5, 1);
      if (q) out.push({ y: q.y, draw: () => { world.shadow(q.x, q.y, 22); world.drawFeet('svl_town_sign', q.x, q.y); const sx = world.sx(q.x), sy = world.sy(q.y); drawTextC(world.g, 'HOSHIMORI', sx, sy - 42, '#fff6c0', 1, null); drawTextC(world.g, 'POP ' + popOf(game), sx, sy - 33, '#bfe6c8', 1, null); drawTextC(world.g, 'YEAR ' + yearOf(game.day), sx, sy - 24, '#ffd76a', 1, null); } });
    }
    return out;
  },
});
register('targetProvider', 'svl_town_changes', {
  find(world, game) {
    if (world.map.id !== 'town') return null;
    const near = (sp, dx, dy, r) => { const p = spotPos('town', sp, dx, dy); if (!p) return null; const d = Math.hypot(p.x - world.player.x, p.y - world.player.y); return d < r ? { p, d } : null; };
    let n = near('noticeboard', -5, 1, 30);
    if (n) return { label: 'Read the town sign', dist: n.d + 3, x: n.p.x, y: n.p.y - 28, run: (g) => g.run([N(`Welcome to Hoshimori Bay. Population ${popOf(g)}. Year ${yearOf(g.day)}.`), say('misa', 'happy', st(g, 'peopleMet') > 5 ? 'The number keeps going up. I know a lot of those people now!' : 'I wonder how many of those people I will get to know.')]) };
    n = hasPlaque(game) && near('bench_1', 0, 0, 24);
    if (n) return { label: 'Read the bench plaque', dist: n.d + 3, x: n.p.x, y: n.p.y - 14, run: (g) => g.run([N(`A little brass plaque: "Misa's Bench. Rested on ${st(g, 'benchSits')} times and counting. Keep sitting, Misa."`), say('misa', 'happy', 'Who put this here?! ...I love it.')]) };
    return null;
  },
});
register('system', 'svl_town_changes', {
  init(game) {
    (game.extraLights ||= []).push((world) => { const id = world.map.id; return lampsOn(game).filter((l) => l[0] === id).map(([m, sp, dx, dy]) => { const p = spotPos(m, sp, dx, dy); return p ? { kind: 'lamp', x: p.x, y: p.y - 38 } : null; }).filter(Boolean); });
    game.bus.on('stat', ({ k, v }) => { if (k === 'benchSits' && v === 50) game.toast('A brass plaque appeared on the town bench!', 'i_star'); if (k === 'planted' && [5, 25, 60].includes(v)) game.toast('Your flower bed in the yard is blooming a bit more.', 'i_star'); });
    game.bus.on('dayStart', () => { const n = lampsOn(game).length, s = S(game); if (s.lamps !== n) { if (s.lamps !== undefined && n > s.lamps) game.toast('New lamp posts were put up in town.', 'i_star'); s.lamps = n; } });
  },
});
features('Town Life', [
  'Lamp posts appear in the town square and the lane as days pass, in year two, or once the community helps out, and light up at dusk',
  'A flower bed in the yard blooms (three growth stages) after Misa has planted 5, 25 and 60 things',
  'A brass bench plaque with Misa\'s name appears on the town bench after she has rested on 50 benches, and you can read it',
  'A town sign next to the noticeboard shows a population that grows with Misa\'s friendships, the year and her good deeds',
  'Toasts announce new lamp posts, the bench plaque and the flower bed',
]);
