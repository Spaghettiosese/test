// Story Acts world dressing, driven by flags (no edits to other areas' maps):
//   Act II: Tide Lanterns glowing at five places, the harbour mural glyphs, an ema row, a gear chain, midsummer lanterns,
//           lantern strings over the town for the Night of a Hundred Lights, lantern boats at sea, lighthouse beam variants.
//   Act III: the Seaglass Emporium kiosk (and its shop), the Seaglass hoarding, Save-the-Hall and Save-our-School banners,
//           camp tents, the play poster, the Starry Eve tree, string lights after the hearing.
import { register, get, features } from '../../core/registry.js';
import { spotPos } from '../../systems/festivals.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { yearOf, seasonOf } from '../../core/time.js';
import { S } from './state.js';

const started = (g, n) => ((g.state.story && g.state.story.started) || {})[n] !== undefined;
const done = (g, n) => !!g.flag(`chapter_${n}_done`);
const night = (g) => g.minutes >= 19 * 60 || g.minutes < 5 * 60;

// five Tide Lanterns: [flag suffix, map, spot, dx, dy]
export const TIDE = [['cave', 'cave', 'star_mark', 1, 1], ['harbour', 'harbour', 'mural', 4, 2], ['shrine', 'shrine', 'lookout', 1, 1], ['tower', 'clock_tower', 'bell', 2, 2], ['lighthouse', 'lighthouse', 'balcony', 1, 1]];
export const tideLit = (g) => TIDE.filter((t) => g.flag(`a2_tl_${t[0]}`));
const EMP = { spot: 'noticeboard', dx: 7, dy: 1 };

// [sprite, map, spot, dx, dy, when(g)]
const PROPS = [
  ['sv3_mural_glow', 'harbour', 'mural', 0, 0.2, (g) => g.flag('a2_mural')],
  ['sv3_ema_row', 'shrine', 'ema_board', 1, 1.5, (g) => started(g, 15)],
  ['sv3_gear_chain', 'clock_tower', 'gears', 1, 1.5, (g) => g.flag('a2_tower_fixed')],
  ['sv3_lantern_string', 'beach', 'bonfire', 0, -2, (g) => started(g, 14) && !done(g, 15)],
  ['sv3_lantern_string', 'beach', 'bonfire', 6, -2, (g) => started(g, 14) && !done(g, 15)],
  ['sv3_emporium', 'town', EMP.spot, EMP.dx, EMP.dy, (g) => g.flag('a3_emporium')],
  ['sv3_hoarding', 'town', 'ramen_cart', 0, 3, (g) => g.flag('a3_hoarding')],
  ['sv3_banner_hall', 'town', 'ramen_cart', 5, 3, (g) => g.flag('a3_banner_hall') && !g.flag('a3_result')],
  ['sv3_banner_saved', 'town', 'ramen_cart', 5, 3, (g) => g.flag('a3_lights_hall') && ['saved', 'partial'].includes(g.flag('a3_result'))],
  ['sv3_banner_school', 'school_grounds', 'gate', 0, -1, (g) => g.flag('a3_school_notice') && !g.flag('a3_banner_campus')],
  ['sv3_banner_campus', 'school_grounds', 'gate', 0, -1, (g) => g.flag('a3_banner_campus')],
  ['sv3_tent', 'beach', 'bonfire', -4, 1, (g) => g.flag('a3_camp_site')],
  ['sv3_tent_blue', 'beach', 'bonfire', 4, 1, (g) => g.flag('a3_camp_site')],
  ['sv3_poster_play', 'town', 'noticeboard', 1, 0.2, (g) => g.flag('a3_poster')],
  ['sv3_poster_play', 'school_halls', 'notice_board', 1, 1, (g) => g.flag('a3_poster')],
  ['sv3_starry_tree', 'town', 'fountain', 5, 1, (g) => g.flag('a3_tree') && !g.flag('chapter_40_done')],
];

register('worldLayer', 'sv3_dressing', {
  sprites(world, game) {
    const out = [], id = world.map.id, t = game.clock || 0;
    for (const [name, map, spot, dx, dy, when] of PROPS) {
      if (map !== id || !SPRITES[name] || !when(game)) continue;
      const p = spotPos(map, spot, dx, dy);
      if (p) out.push({ y: p.y + (name.includes('banner') || name.includes('string') ? -40 : 0), draw: () => { if (!name.includes('string') && !name.includes('glow')) world.shadow(p.x, p.y, 10); world.drawFeet(name, p.x, p.y); } });
    }
    for (const [name, map, spot, dx, dy] of TIDE) {
      if (map !== id || !game.flag(`a2_tl_${name}`)) continue;
      const p = spotPos(map, spot, dx, dy);
      if (p) out.push({ y: p.y, draw: () => {
        world.shadow(p.x, p.y, 6); world.drawFeet('sv3_tide_lamp', p.x, p.y);
        const g = world.g, a = 0.18 + 0.08 * Math.sin(t * 3 + p.x), cx = world.sx(p.x), cy = world.sy(p.y) - 30;
        g.save(); g.globalAlpha = a; g.fillStyle = '#bff4e6'; g.beginPath(); g.arc(cx, cy, 22, 0, Math.PI * 2); g.fill(); g.restore();
      } });
    }
    if (game.flag('a2_finale') === 'boats' && ['beach', 'harbour'].includes(id) && yearOf(game.day) >= 1 && game.flag('chapter_24_done')) {
      const [sp, dx, dy] = id === 'beach' ? ['sandbar', 0, 1] : ['pier_end', 2, 1];
      for (let i = 0; i < 5; i++) { const p = spotPos(id, sp, dx + i * 1.4, dy + (i % 2) * 1.2); if (p) out.push({ y: p.y, draw: () => world.drawFeet('sv3_lantern_boat', p.x, p.y + Math.sin(t * 1.6 + i * 1.3) * 1.5) }); }
    }
    return out;
  },
  overlay(g, world, game) {
    const def = world.map.def;
    if (!def.outdoor) return;
    const id = world.map.id, lit = tideLit(game).length;
    const strings = (['town', 'harbour', 'beach', 'shotengai'].includes(id) && ((started(game, 24) && !done(game, 24)) || (game.flag('a2_finale') && seasonOf(game.day) === 'winter' && yearOf(game.day) === 1)))
      || (['town', 'lane'].includes(id) && game.flag('a3_lights_hall') && !done(game, 40)) || (id === 'town' && game.flag('a3_tree') && !done(game, 40));
    if (strings) for (let i = 0; i < 4; i++) g.drawImage(sprite('sv3_lantern_string'), i * 96 - (Math.round(world.cam.x / 2) % 96), 0);
    if (night(game) && lit >= 3) {
      const fin = game.flag('a2_finale'), a = game.clock * 0.45 + 1.7, x = 160 + Math.cos(a) * 200;
      g.save(); g.globalAlpha = 0.09 + 0.05 * Math.sin(a * 2) + (lit === 5 ? 0.04 : 0); g.fillStyle = fin === 'boats' ? '#ffc8d0' : '#bff4e6';
      g.beginPath(); g.moveTo(0, -10); g.lineTo(x - 26, 70); g.lineTo(x + 34, 62); g.fill(); g.restore();
    }
  },
});

// ---------------------------------------------------------------- the Seaglass Emporium (town kiosk + shop)
const empPos = () => spotPos('town', EMP.spot, EMP.dx, EMP.dy);
register('shop', 'sv3_emporium', {
  name: 'Seaglass Emporium', owner: 'seaglass', keeper: { name: 'Mr. Kurokawa', look: { hair: '#2a2a3a', top: '#e8e4d8', bottom: '#4a5a6a', skin: '#f2c9a4', eyes: '#2a1a14', accent: '#9cc8e8' } },
  hours: ['10:00', '19:00'], closed: [2], color: '#6aa6c8', when: 'flag:a3_emporium',
  greet: (g) => {
    const r = g.flag('a3_result');
    if (r === 'saved') return 'Welcome. A paper crane? I fold them now. I am getting rather good.';
    if (r === 'partial') return 'Welcome back. Take your time. I am told there is no rush in Hoshimori.';
    if (r === 'reprieve') return 'Welcome. One year, Miss Aoki. In the meantime, may I interest you in a candle?';
    return 'Welcome to the Seaglass Emporium. Small things for good living.';
  },
  thanks: ['A pleasure.', 'Do come again.'],
  stock: ['gift_candle', 'gift_star_chart', 'furn_lamp_star', 'furn_lantern_paper', 'gift_compass', 'gift_wind_chime', 'gift_paper_crane', 'mat_washi', 'mat_ink', 'book_star_atlas', 'gift_pressed_flower', 'furn_candles', 'gift_music_box'],
  buys: ['gift'],
});
register('targetProvider', 'sv3_emporium', {
  find(world, game) {
    if (world.map.id !== 'town' || !game.flag('a3_emporium')) return null;
    const p = empPos();
    if (!p) return null;
    const d = Math.hypot(p.x - world.player.x, p.y - world.player.y);
    return d < 34 ? { label: 'Seaglass Emporium', dist: Math.max(0, d - 14), x: p.x, y: p.y - 30, run: (g) => g.run([{ t: 'shop', id: 'sv3_emporium' }]) } : null;
  },
});
register('system', 'sv3_dressing', {
  init(game) {
    (game.extraLights ||= []).push((world) => {
      const out = [], id = world.map.id;
      for (const [name, map, spot, dx, dy] of TIDE) if (map === id && game.flag(`a2_tl_${name}`)) { const p = spotPos(map, spot, dx, dy); if (p) out.push({ kind: 'lamp', x: p.x, y: p.y - 28 }); }
      if (id === 'town' && game.flag('a3_tree') && !game.flag('chapter_40_done')) { const p = spotPos('town', 'fountain', 5, 1); if (p) out.push({ kind: 'lamp', x: p.x, y: p.y - 40 }); }
      if (id === 'town' && game.flag('a3_emporium')) { const p = empPos(); if (p) out.push({ kind: 'window', x: p.x, y: p.y - 24 }); }
      return out;
    });
    game.bus.on('dayStart', () => {
      if (game.flag('a3_camp_site') && done(game, 29)) game.setFlag('a3_camp_site', false);
      if (game.flag('a3_poster') && done(game, 32)) game.setFlag('a3_poster', false);
    });
  },
});

features('Story Acts', [
  'Five Tide Lanterns glow with a soft light at the cave star, the harbour wall, the shrine lookout, the clock tower bell and the lighthouse balcony as you wake them',
  'The harbour mural shows its sea-green glyph strip once its secret is found',
  'A row of extra ema plaques hangs on the shrine board after the wishes chapter, and a gold gear chain turns in the clock tower once mended',
  'Paper lantern strings go up over the town square, harbour and beach for the Night of a Hundred Lights and the Starry Eve tree',
  'After the Night of a Hundred Lights, lantern boats bob off the beach and the harbour if you chose the boats, and the lighthouse beam turns teal or rose',
  'The Seaglass Emporium kiosk appears on the square and sells star charts, lamps, compasses and paper cranes, with Mr. Kurokawa\'s greeting changing after the hearing',
  'A construction hoarding for Seaglass Marina stands by the Hall lot until the hearing, with a Save the Hall banner that becomes a celebration banner if the Hall is saved',
  'A Save Our School banner hangs on the school gate and becomes an Open Campus banner during the open day quest',
  'Camp tents appear on Shell Beach during the school camping trip, and posters for the school play go up on the town board and school notice board',
  'A great Starry Eve fir tree wrapped in paper stars stands on the town square on Winter 24 in Year 2',
]);
