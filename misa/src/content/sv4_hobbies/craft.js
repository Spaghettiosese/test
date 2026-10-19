// Pottery & Weaving: a wheel and kiln in the Community Hall, a shape-the-clay minigame, glazes, firing over days, a loom, finished
// pieces as decor items (furn_sv4h_*) for the decorate menu, and a seasonal craft fair where you sell at a premium.
// Try it: __misa.warp('community_hall', 19, 10, 'up') (wheel and kiln), __misa.warp('community_hall', 20, 10, 'up') (loom).
import { register, get, features } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { itemIcon } from '../../gfx/icons.js';
import { S as spriteS, D as spriteD } from '../interiors/kit.js';
import { CATALOG } from '../interiors/catalog.js';
import { S, clamp, item, gain, say, N, call, has, idle, addObjects, stat } from './state.js';
import { hasBuff } from '../economy/core.js';
import { SHAPES } from '../../minigames/sv4_hobbies/clay.js';
import '../../minigames/sv4_hobbies/clay.js';

// ---------------------------------------------------------------- materials
item('sv4h_clay', 'Pottery clay', 'material', 20, 'rock', K.sand[3], 'A damp block of stoneware clay, enough for one piece.', { c2: K.wood[2], tags: ['material', 'clay'] });
export const GLAZES = { plain: { name: 'Unglazed', ramp: K.sand, price: 0, bonus: 0 }, indigo: { name: 'Indigo', ramp: K.navy, price: 30, bonus: 30 }, celadon: { name: 'Celadon', ramp: K.mint, price: 30, bonus: 30 }, persimmon: { name: 'Persimmon', ramp: K.coral, price: 35, bonus: 35 }, ash: { name: 'Ash white', ramp: K.paper, price: 30, bonus: 30 } };
for (const [id, g] of Object.entries(GLAZES)) if (id !== 'plain') item('sv4h_glaze_' + id, `${g.name} glaze`, 'material', 15, 'bottle', g.ramp[3], `A jar of ${g.name.toLowerCase()} glaze. One piece's worth.`, { tags: ['material', 'glaze'] });
item('sv4h_shard', 'Cracked shard', 'material', 4, 'rock', K.sand[1], 'A cracked pot. Better luck next firing.', { tags: ['material', 'junk'] });
export const SHAPE_INFO = { mug: { name: 'Mug', price: 90, lv: 0, kind: 'floor' }, bowl: { name: 'Bowl', price: 120, lv: 0, kind: 'floor' }, plate: { name: 'Plate', price: 110, lv: 1, kind: 'wall' }, vase: { name: 'Vase', price: 180, lv: 2, kind: 'floor' }, jug: { name: 'Jug', price: 150, lv: 3, kind: 'floor' } };
export const PALETTES = { sunset: { name: 'Sunset', a: K.coral, b: K.butter }, sea: { name: 'Sea', a: K.sky, b: K.mint }, berry: { name: 'Berry', a: K.lilac, b: K.ribbon } };
export const WEAVES = { rug: { name: 'rug', yarn: 4, price: 260, days: 2 }, hang: { name: 'wall hanging', yarn: 2, price: 200, days: 1 }, scarf: { name: 'scarf', yarn: 2, price: 120, days: 1 } };
export const pieceId = (shape, glaze) => `furn_sv4h_${shape}_${glaze}`;

// ---------------------------------------------------------------- decor sprites and catalog entries
function potDraw(shape, ramp) {
  const prof = SHAPES[shape];
  return (R) => {
    if (shape === 'plate') { R.e(11, 11, 11, 11, ramp[1]); R.e(11, 10, 10, 10, ramp[2]); R.e(11, 10, 7, 7, ramp[3]); R.e(10, 9, 3, 3, ramp[4]); return; }
    prof.forEach((hw, i) => {
      const h = Math.max(1, Math.round(hw * 0.75)), y = 1 + i * 2;
      R(12 - h, y, h * 2, 2, ramp[2]); R(12 - h, y, 2, 2, ramp[3]); R(10 + h, y, 2, 2, ramp[1]);
    });
    R(8, 1, 8, 1, ramp[0]);
    if (shape === 'mug') { R(20, 6, 3, 2, ramp[2]); R(22, 8, 1, 8, ramp[2]); R(20, 16, 3, 2, ramp[2]); }
    if (shape === 'jug') { R(2, 4, 2, 2, ramp[2]); R(1, 6, 1, 8, ramp[2]); R(2, 14, 2, 2, ramp[2]); }
    R(10, 14, 2, 8, 'rgba(255,255,255,.18)');
  };
}
const setItem = (id, f) => item(id, f.name, 'decor', f.price, f.shape, f.c, f.desc, { tags: ['decor', ...f.tags], useLabel: 'Put in decor box', use(game) { const st = game.state.homeDecor; st.box[id] = (st.box[id] || 0) + 1; game.toast(`${f.name} went into the decor box`, 'i_star'); return false; } });
for (const [sh, info] of Object.entries(SHAPE_INFO)) {
  for (const [gk, gl] of Object.entries(GLAZES)) {
    const id = pieceId(sh, gk), sprName = spriteS(id, sh === 'plate' ? 24 : 26, sh === 'plate' ? 24 : 32, potDraw(sh, gl.ramp));
    const f = CATALOG[id] = { w: 1, h: 1, kind: info.kind, comfort: sh === 'vase' ? 3 : 2, act: null, name: `${gl.name === 'Unglazed' ? 'Plain' : gl.name} ${info.name.toLowerCase()}`, theme: 'wood', price: info.price + gl.bonus, spr: sprName, desc: `A handmade ${info.name.toLowerCase()}, fired in the Community Hall kiln.`, shape: 'bowl', c: gl.ramp[3], tags: ['pottery', 'handmade'] };
    setItem(id, { ...f, shape: sh === 'plate' ? 'plate' : 'bowl' });
  }
}
for (const [pk, pal] of Object.entries(PALETTES)) {
  const rid = `furn_sv4h_rug_${pk}`, hid = `furn_sv4h_hang_${pk}`, cid = `sv4h_scarf_${pk}`;
  const rs = spriteD(rid, 64, 44, (R) => { R(0, 1, 64, 42, pal.a[1]); R(1, 0, 62, 44, pal.a[1]); R(2, 2, 60, 40, pal.a[2]); for (let y = 4; y < 40; y += 8) R(4, y, 56, 3, pal.b[3]); for (let x = 6; x < 58; x += 12) R(x, 2, 3, 40, pal.a[3]); for (let x = 2; x < 62; x += 3) { R(x, 0, 1, 1, K.paper[3]); R(x, 43, 1, 1, K.paper[3]); } });
  const hs = spriteS(hid, 22, 30, (R) => { R(1, 0, 20, 2, K.wood[3]); R(3, 2, 16, 24, pal.a[2]); for (let y = 5; y < 24; y += 5) R(4, y, 14, 2, pal.b[3]); R.t([3, 26], [11, 30], [19, 26], pal.a[2]); R(10, 8, 2, 14, pal.a[4]); });
  CATALOG[rid] = { w: 2, h: 2, kind: 'rug', comfort: 3, act: null, name: `${pal.name} woven rug`, theme: 'wood', price: WEAVES.rug.price, spr: rs, desc: 'A rug woven by hand on the Community Hall loom.', shape: 'paper', c: pal.a[2] };
  CATALOG[hid] = { w: 1, h: 1, kind: 'wall', comfort: 2, act: null, name: `${pal.name} wall hanging`, theme: 'wood', price: WEAVES.hang.price, spr: hs, desc: 'A woven wall hanging with a cheerful stripe.', shape: 'paper', c: pal.a[2] };
  setItem(rid, { ...CATALOG[rid], tags: ['weaving', 'handmade'] }); setItem(hid, { ...CATALOG[hid], tags: ['weaving', 'handmade'] });
  item(cid, `${pal.name} scarf`, 'gift', WEAVES.scarf.price, 'shirt', pal.a[2], 'A soft scarf woven by hand. A lovely gift.', { c2: pal.b[3], tags: ['weaving', 'handmade', 'cute', 'cloth'] });
}

// ---------------------------------------------------------------- kiln and loom state
const pot = (g) => S(g).pot;
export const kilnCap = (g) => 3 + (g.skillLevel('pottery') >= 3 ? 1 : 0) + (g.skillLevel('pottery') >= 6 ? 1 : 0);
export const fireDays = (g) => (g.skillLevel('pottery') >= 7 || g.hasProf('sv4h_kiln_keeper') ? 1 : 2);
const clayItem = (g) => (g.has('sv4h_clay') ? 'sv4h_clay' : g.has('mat_clay') ? 'mat_clay' : null);
const unlockedShapes = (g) => Object.entries(SHAPE_INFO).filter(([, i]) => g.skillLevel('pottery') >= i.lv);
export function queuePiece(g, shape, glaze, score) {
  const p = pot(g); p.kiln.push({ shape, glaze, score: Math.round(score * 100) / 100, ready: g.day + fireDays(g) }); p.made++;
}
export function collectKiln(g) {
  const p = pot(g), out = [], keep = [];
  for (const k of p.kiln) {
    if (k.ready > g.day) { keep.push(k); continue; }
    if (k.score < 0.3) { g.give('sv4h_shard', 1, true); out.push('a cracked shard'); continue; }
    const id = pieceId(k.shape, k.glaze); g.give(id, 1, true); out.push(get('item', id).name.toLowerCase());
    const master = k.score >= 0.85; if (master) { g.addMoney(40, true); g.addMood(4); }
    p.best[k.shape] = Math.max(p.best[k.shape] || 0, k.score);
    gain(g, 'pottery', 10 + k.score * 18 + (master ? 10 : 0)); g.stat('potsFired'); g.bus.emit('potFired', { item: id, score: k.score });
  }
  p.kiln = keep; return out;
}
export function collectLoom(g) {
  const p = pot(g), L = (p.loom ||= []), out = [], keep = [];
  for (const k of L) {
    if (k.ready > g.day) { keep.push(k); continue; }
    const id = k.kind === 'scarf' ? `sv4h_scarf_${k.pal}` : `furn_sv4h_${k.kind}_${k.pal}`; g.give(id, 1, true); out.push(get('item', id).name.toLowerCase());
    gain(g, 'pottery', 14); p.woven++; g.stat('piecesWoven');
  }
  p.loom = keep; return out;
}
const glazeSteps = (g, shape, score) => {
  const have = Object.keys(GLAZES).filter((k) => k === 'plain' || g.has('sv4h_glaze_' + k));
  return [{ t: 'choice', prompt: 'Glaze?', options: have.map((k) => ({ text: GLAZES[k].name, steps: [call((gg) => { if (k !== 'plain') gg.take('sv4h_glaze_' + k, 1); queuePiece(gg, shape, k, score); return gg.run([N(`The ${GLAZES[k].name.toLowerCase()} ${SHAPE_INFO[shape].name.toLowerCase()} goes into the kiln. It will be ready in ${fireDays(gg)} day${fireDays(gg) > 1 ? 's' : ''}.`)]); })] })) }];
};
register('interaction', 'sv4h_wheel', {
  label: 'Pottery wheel',
  run(g) {
    const p = pot(g);
    if (p.kiln.length >= kilnCap(g)) return g.run([N(`The kiln is full (${kilnCap(g)} pieces). Collect finished pieces first.`)]);
    if (!clayItem(g)) return g.run([N('You need a block of clay. The stationery stall in the shotengai sells it.')]);
    return g.run([{ t: 'choice', prompt: 'Throw a...', options: [...unlockedShapes(g).map(([sh, i]) => ({ text: `${i.name}${p.best[sh] ? '  best ' + Math.round(p.best[sh] * 100) + '%' : ''}`, steps: [call(async (gg) => {
      const c = clayItem(gg); if (!c) return; gg.take(c, 1);
      const r = await gg.minigame('sv4h_clay', { shape: sh, steady: clamp(gg.skillLevel('pottery') * 0.08 + (hasBuff(gg, 'sv4h_steady') ? 0.3 : 0), 0, 1), noResult: true });
      if (!r || r.quit) { gg.give(c, 1, true); return; }
      gg.advance(40); gg.addEnergy(-4);
      await gg.run([N(r.data.text + ` (${Math.round(r.score * 100)}%)`), ...(r.score < 0.3 ? [N('It slumped badly. You will fire it anyway, but expect a cracked shard.')] : []), ...glazeSteps(gg, sh, r.score)]);
    })] })), { text: 'Never mind', steps: [] }] }]);
  },
});
register('interaction', 'sv4h_kiln', {
  label: 'Community kiln',
  run(g) {
    const p = pot(g), out = collectKiln(g);
    const wait = p.kiln.map((k) => `${SHAPE_INFO[k.shape].name} (${k.ready - g.day} day${k.ready - g.day === 1 ? '' : 's'})`).join(', ');
    return g.run([N(out.length ? `You open the kiln and lift out: ${out.join(', ')}.` : p.kiln.length ? `Still firing: ${wait}.` : 'The kiln is cold and empty. Throw something at the wheel first.'), ...(out.length && p.kiln.length ? [N(`Still firing: ${wait}.`)] : [])]);
  },
});
register('interaction', 'sv4h_loom', {
  label: 'Loom',
  run(g) {
    const p = pot(g), L = (p.loom ||= []), out = collectLoom(g);
    const yarn = g.count('mat_yarn') + g.count('mat_rainbow_wool');
    const start = (kind, pk) => call((gg) => {
      const w = WEAVES[kind], n = gg.count('mat_yarn'), rb = gg.count('mat_rainbow_wool');
      if (n + rb < w.yarn) return gg.run([N(`A ${w.name} needs ${w.yarn} yarn. Yarn is sold at the stationery stall.`)]);
      let need = w.yarn; const useRb = Math.min(rb, need); if (pk === 'berry') { if (useRb) gg.take('mat_rainbow_wool', useRb); need -= useRb; } if (need) gg.take('mat_yarn', need);
      L.push({ kind, pal: pk, ready: gg.day + w.days }); gg.advance(30); gg.addEnergy(-3);
      return gg.run([N(`You thread the loom for a ${PALETTES[pk].name.toLowerCase()} ${w.name}. It will be ready in ${w.days} day${w.days > 1 ? 's' : ''}.`)]);
    });
    const lv = g.skillLevel('pottery');
    const pals = Object.keys(PALETTES).filter((_, i) => lv >= i);
    return g.run([N(out.length ? `You take down the finished weaving: ${out.join(', ')}.` : L.length ? `On the loom: ${L.map((k) => `${k.pal} ${WEAVES[k.kind].name} (${Math.max(0, k.ready - g.day)}d)`).join(', ')}.` : `A sturdy floor loom. You have ${yarn} yarn.`), ...(L.length >= 3 ? [N('The loom is busy with three projects already.')] : [{ t: 'choice', prompt: 'Weave a...', options: [...Object.keys(WEAVES).flatMap((k) => pals.map((pk) => ({ text: `${PALETTES[pk].name} ${WEAVES[k].name} (${WEAVES[k].yarn} yarn)`, steps: [start(k, pk)] }))), { text: 'Never mind', steps: [] }] }])]);
  },
});

// ---------------------------------------------------------------- craft fair
function fairSteps(g) {
  const p = pot(g), year = Math.floor((g.day - 1) / 112), key = `${year}-${g.season}`;
  const stock = Object.entries(g.state.inv).filter(([id, n]) => n > 0 && (get('item', id).tags || []).some((t) => t === 'pottery' || t === 'weaving'));
  if (!stock.length) return [N('Your fair stall is bare. Bring pottery or weaving to sell at a premium.')];
  const total = stock.reduce((a, [id, n]) => a + Math.round(g.sellPrice(id) * 1.3) * n, 0);
  return [N(`You lay out ${stock.reduce((a, [, n]) => a + n, 0)} pieces on a cloth. Browsers love handmade things! Offer: ${total} coins (30% fair bonus).`), { t: 'choice', prompt: 'Sell everything?', options: [{ text: `Sell all for ${total}`, steps: [call((gg) => { for (const [id, n] of stock) gg.take(id, n); gg.addMoney(total, true); p.fair[key] = (p.fair[key] || 0) + total; gg.stat('fairSales', total); gain(gg, 'pottery', 20); gg.toast(`+${total} coins at the craft fair`, 'coin'); })] }, { text: 'Keep them', steps: [] }] }];
}
register('festival', 'sv4h_craft_fair', {
  name: 'Craft Fair', icon: 'i_star', date: ['spring-23', 'summer-26', 'autumn-25', 'winter-12'], maps: ['town'], hours: ['10:00', '18:00'], desc: 'Handmade pottery, weaving and treats. Set up a stall and sell your crafts for a fair bonus.',
  activities: [{ id: 'sv4h_craft_stall', map: 'town', spot: 'market_2', dx: 2, dy: 1, label: 'Run your craft stall', daily: true, run: (g) => g.run(fairSteps(g)) }],
});

addObjects('community_hall', [
  { spr: 'sv4h_wheel', x: 19, y: 9, use: 'sv4h_wheel', shadow: 12 },
  { spr: 'sv4h_kiln', x: 21, y: 9, use: 'sv4h_kiln', shadow: 14, light: { kind: 'lamp', y: -8 } },
  { spr: 'sv4h_loom', x: 20, y: 9, use: 'sv4h_loom', shadow: 14 },
]);
features('Creative Hobbies', [
  'Pottery skill (levels 1 to 10): a pottery wheel and a kiln in the Community Hall, plus a loom for weaving',
  'Throw-a-pot minigame: move up the spinning clay and push the walls in or out to match the dotted outline',
  'Five shapes unlock as you level: mug, bowl, plate, vase and jug, each with its own target outline',
  'Four glazes (indigo, celadon, persimmon, ash white) or leave pieces plain; each glazed piece sells for more',
  'Pieces fire in the kiln over one to two days and wait for you; the kiln holds three pieces, up to five at higher levels',
  'A badly shaped pot cracks into a shard, while a masterwork (85% or better) pays a bonus and lifts your mood',
  'Every glazed or plain piece is a decor item (furn_sv4h_*) you can place in your rooms; plates hang on walls',
  'Weave woven rugs, wall hangings and scarves on the loom in three palettes: sunset, sea and berry',
  'Woven rugs and hangings are decor items too, and scarves make lovely handmade gifts',
  'A seasonal Craft Fair in the town square lets you sell pottery and weaving at a 30% bonus',
]);
void has; void itemIcon; void stat;
