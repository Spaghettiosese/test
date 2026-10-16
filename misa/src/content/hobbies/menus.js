// Hobby screens and shared interactions: the stove recipe book (game.openCooking), the yard workbench (craft_bench),
// the library museum corner (museum), telescopes (telescope), the Collections phone app, recipe learning
// (game.learnRecipe), minigame registration and the hobbies system.
import { register, registerMany, get, all, features } from '../../core/registry.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { UI, rect, panel, inside } from '../../ui/ui.js';
import { FishGame, NetGame, StarGame, CookGame } from '../../minigames/hobbies/games.js';
import { HS, BUFFS, wrapPx, fit, drawIcon, hour, hobbySystem, absMin } from './common.js';
import { holding, canMake, consume, ingName, ingIcon, NPC_RECIPE, matches } from './data.js';
import { worldSystem } from './world.js';

const BTN = (g, input, x, y, w, h, text, on = true, hot = false) => {
  const over = on && inside(input.mx, input.my, x, y, w, h);
  rect(g, UI.ink, x, y, w, h); rect(g, !on ? '#9a8a90' : over || hot ? UI.gold : UI.mint, x + 1, y + 1, w - 2, h - 2); rect(g, '#ffffff66', x + 1, y + 1, w - 2, 1);
  drawTextC(g, text, x + w / 2, y + Math.floor(h / 2) - 2, UI.ink, 1, null);
  return on && over && input.justDown;
};
const tabsBar = (g, input, x, y, w, names, cur) => { const tw = Math.floor(w / names.length); let hit = -1; names.forEach((n, i) => { const xx = x + i * tw, on = i === cur; rect(g, UI.ink, xx, y, tw - 1, 12); rect(g, on ? UI.paper : UI.line, xx + 1, y + 1, tw - 3, on ? 11 : 10); drawTextC(g, fit(n, tw - 6), xx + tw / 2 - 1, y + 4, on ? UI.ink : UI.ink2, 1, null); if (input && input.justDown && inside(input.mx, input.my, xx, y, tw - 1, 12)) hit = i; }); return hit; };
const npcName = (id) => (get('npc', id) || { name: id }).name;
const lovedBy = (item) => all('npc').filter((n) => ((n.gifts || {}).love || []).includes(item) || ((n.gifts || {}).like || []).includes(item)).map((n) => n.name);

// =================================================================== RECIPES
export const knows = (game, id) => { const r = get('recipe', id); return !!r && (r.learned || !!HS(game).recipes[id]); };
export function learnRecipe(game, id, from = '') {
  const r = get('recipe', id);
  if (!r || knows(game, id)) return false;
  HS(game).recipes[id] = game.day;
  game.toast(`New recipe${from ? ' from ' + from : ''}: ${r.name}`, get('item', r.out).icon); game.sfx('page');
  game.stat('recipesLearned'); game.bus.emit('recipeLearned', { id, from });
  return true;
}
const autoLearn = (game) => { const lv = game.skillLevel('cooking'); for (const r of all('recipe')) if (r.skill && lv >= r.skill && !knows(game, r.id)) learnRecipe(game, r.id, 'practice'); };
const known = (game) => all('recipe').filter((r) => knows(game, r.id));

function cook(game, r) {
  if (!canMake(game, r.ingredients)) return game.toast('Missing ingredients');
  if (!game.useEnergy(2)) return;
  const out = get('item', r.out);
  return game.minigame('hob_cooking', { recipe: r.id, name: r.name, steps: r.steps, icon: out.icon }).then((res) => {
    if (!res || res.quit) return;
    consume(game, r.ingredients);
    const stars = res.stars || 1, extra = stars >= 3 && game.rng() < 0.4 + game.skillLevel('cooking') * 0.04 ? 1 : 0;
    game.give(r.out, 1 + extra);
    if (extra) game.toast('Perfect cooking: an extra serving!', out.icon);
    game.addXP('cooking', 4 + stars * 2 + Math.ceil(Object.keys(r.ingredients).length * 1.5));
    game.advance(r.time || 20); game.addMood(2);
    HS(game).cooked[r.id] = (HS(game).cooked[r.id] || 0) + 1;
    game.collect('recipe', r.id); game.stat('cooked'); game.bus.emit('cooked', { recipe: r.id, item: r.out, stars });
    autoLearn(game);
  });
}
// Experiment: exactly these ingredients make some recipe you don't know yet?
function experiment(game, sel) {
  const ids = Object.keys(sel).filter((k) => sel[k] > 0);
  if (!ids.length) return;
  const fits = (r) => { const need = Object.entries(r.ingredients); const pool = { ...sel }; for (const [k, n] of need) { let left = n; for (const id of ids) { if (!pool[id] || !matches(id, k)) continue; const t = Math.min(left, pool[id]); pool[id] -= t; left -= t; } if (left > 0) return false; } return Object.values(pool).every((v) => v === 0); };
  const hit = all('recipe').find((r) => !r.story && fits(r));
  for (const id of ids) if (game.count(id) < sel[id]) return game.toast('You don\'t have enough of that');
  if (hit && !knows(game, hit.id)) { learnRecipe(game, hit.id, 'an experiment'); return cook(game, hit); }
  if (hit) return cook(game, hit);
  if (!game.useEnergy(2)) return;
  return game.minigame('hob_cooking', { name: 'Experiment', steps: ['chop', 'stir'], icon: get('item', 'dish_mysterious_lump').icon }).then((res) => {
    if (!res || res.quit) return;
    for (const id of ids) game.take(id, sel[id]);
    game.give('dish_mysterious_lump', 1); game.addXP('cooking', 3); game.advance(15); game.stat('lumps');
    game.say('misa', 'surprised', 'Hmm. That is... a mysterious lump. I\'m sure it\'s edible. Probably.');
  });
}

class CookingScene {
  constructor(game, opts = {}) { Object.assign(this, { name: 'hob_cooking', opaque: false, game, tab: 0, sel: 0, top: 0, ex: {}, mode: opts.mode || 'cook' }); autoLearn(game); }
  list() {
    const g = this.game;
    if (this.tab === 2) return Object.keys(g.state.inv).filter((id) => { const it = get('item', id); return it && (id.startsWith('ing_') || ['crop', 'fish'].includes(it.cat)); }).sort();
    const k = known(g).sort((a, b) => (canMake(g, b.ingredients) ? 1 : 0) - (canMake(g, a.ingredients) ? 1 : 0) || a.name.localeCompare(b.name));
    return this.tab === 0 ? k.filter((r) => canMake(g, r.ingredients)) : k;
  }
  update(dt, input, game) {
    const L = this.list(), k = input.pressed, rows = 15;
    if (k.has('escape') || k.has('tab')) return game.scenes.pop(this);
    if (k.has('c')) { this.tab = (this.tab + 1) % 3; this.sel = 0; this.top = 0; }
    if (k.has('arrowdown') || k.has('s')) this.sel = Math.min(L.length - 1, this.sel + 1);
    if (k.has('arrowup') || k.has('w')) this.sel = Math.max(0, this.sel - 1);
    if (input.wheel) this.top = Math.max(0, Math.min(Math.max(0, L.length - rows), this.top + Math.sign(input.wheel)));
    this.sel = Math.max(0, Math.min(this.sel, L.length - 1));
    if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + rows) this.top = this.sel - rows + 1;
    if (input.justDown && inside(input.mx, input.my, 14, 36, 132, rows * 10)) { const i = this.top + Math.floor((input.my - 36) / 10); if (i < L.length) { if (this.tab === 2 && i === this.sel) this.toggle(L[i]); this.sel = i; } }
    const go = k.has('enter') || k.has(' ') || k.has('e');
    if (this.tab === 2) { if (go) this.toggle(L[this.sel]); if (k.has('backspace') || k.has('x')) this.ex = {}; if (k.has('t')) this.tryIt(); }
    else if (go && L[this.sel]) this.cook(L[this.sel]);
    this.input = input;
  }
  toggle(id) { if (!id) return; const n = this.ex[id] || 0, tot = Object.values(this.ex).reduce((a, b) => a + b, 0); if (n < 2 && n < this.game.count(id) && tot < 4) this.ex[id] = n + 1; else delete this.ex[id]; this.game.sfx('blip'); }
  tryIt() { const sel = { ...this.ex }; if (!Object.keys(sel).length) return; this.game.scenes.pop(this); experiment(this.game, sel); }
  cook(r) { if (!canMake(this.game, r.ingredients)) { this.game.sfx('wrong'); return; } this.game.scenes.pop(this); cook(this.game, r); }
  draw(g, game) {
    const input = this.input || { mx: -1, my: -1, pressed: new Set() };
    rect(g, '#10081888', 0, 0, 320, 224);
    panel(g, 6, 6, 308, 212, 'paper');
    drawText(g, 'RECIPE BOOK', 14, 12, UI.accent2, 1, null);
    const nk = known(game).length, total = all('recipe').filter((r) => !r.story || knows(game, r.id)).length;
    drawText(g, `${nk}/${total} RECIPES`, 306 - measure(`${nk}/${total} RECIPES`), 12, UI.dim, 1, null);
    const hit = tabsBar(g, this.input, 12, 21, 136, ['READY', 'ALL', 'TRY'], this.tab);
    if (hit >= 0) { this.tab = hit; this.sel = 0; this.top = 0; }
    const L = this.list();
    rect(g, UI.paper2, 12, 34, 136, 154);
    L.slice(this.top, this.top + 15).forEach((e, r) => {
      const i = this.top + r, y = 36 + r * 10;
      if (i === this.sel) rect(g, '#ffd76a88', 13, y - 1, 134, 10);
      if (this.tab === 2) { const it = get('item', e), n = this.ex[e] || 0; drawText(g, `${n ? '[' + n + '] ' : ''}${fit(it.name, 100)}`, 16, y + 1, n ? UI.accent2 : UI.ink, 1, null); drawText(g, `x${game.count(e)}`, 144 - measure(`x${game.count(e)}`), y + 1, UI.dim, 1, null); }
      else { const ok = canMake(game, e.ingredients); drawText(g, fit(e.name, 112), 16, y + 1, ok ? UI.ink : UI.dim, 1, null); if (ok) rect(g, UI.good, 140, y + 2, 4, 4); }
    });
    if (!L.length) wrapPx(this.tab === 0 ? 'Nothing you can cook with what you have. Check the ALL tab to see what\'s missing.' : this.tab === 2 ? 'No ingredients in your bag yet. Sunny Mart sells them, and the garden grows them.' : 'No recipes yet.', 124).forEach((l, i) => drawText(g, l, 16, 40 + i * 8, UI.dim, 1, null));
    // detail
    const D = { x: 154, y: 20 };
    panel(g, D.x, D.y, 154, 192, 'paper');
    if (this.tab === 2) {
      drawText(g, 'TRY A NEW COMBINATION', D.x + 6, D.y + 6, UI.accent2, 1, null);
      wrapPx('Pick 1 to 4 ingredients (Enter adds, again removes). If they make a recipe you don\'t know, you learn it. If not... you get a mysterious lump.', 142).forEach((l, i) => drawText(g, l, D.x + 6, D.y + 18 + i * 8, UI.ink, 1, null));
      Object.entries(this.ex).forEach(([id, n], i) => { drawIcon(g, get('item', id).icon, D.x + 14, D.y + 84 + i * 18); drawText(g, `${n} x ${fit(get('item', id).name, 100)}`, D.x + 26, D.y + 82 + i * 18, UI.ink, 1, null); });
      const hidden = all('recipe').filter((r) => r.hidden && !knows(game, r.id)).length;
      drawText(g, `${hidden} SECRET RECIPES LEFT`, D.x + 6, D.y + 158, UI.dim, 1, null);
      if (BTN(g, input, D.x + 6, D.y + 170, 66, 14, 'TRY IT (T)', Object.keys(this.ex).length > 0)) this.tryIt();
      if (BTN(g, input, D.x + 80, D.y + 170, 66, 14, 'CLEAR (X)', Object.keys(this.ex).length > 0)) this.ex = {};
    } else {
      const r = L[this.sel];
      if (r) {
        const out = get('item', r.out);
        drawIcon(g, out.icon, D.x + 16, D.y + 14);
        drawText(g, fit(r.name, 120), D.x + 30, D.y + 8, UI.accent2, 1, null);
        drawText(g, `+${out.energy} ENERGY  +${out.mood} MOOD`, D.x + 30, D.y + 17, UI.good, 1, null);
        drawText(g, 'INGREDIENTS', D.x + 6, D.y + 30, UI.dim, 1, null);
        Object.entries(r.ingredients).forEach(([k, n], i) => { const h = holding(game, k).n, y = D.y + 40 + i * 14; drawIcon(g, ingIcon(k), D.x + 14, y + 3); drawText(g, fit(ingName(k), 92), D.x + 26, y + 1, UI.ink, 1, null); drawText(g, `${Math.min(h, 99)}/${n}`, D.x + 148 - measure(`${h}/${n}`), y + 1, h >= n ? UI.good : UI.bad, 1, null); });
        let y = D.y + 42 + Object.keys(r.ingredients).length * 14;
        if (out.buff && BUFFS[out.buff.id]) { drawText(g, fit(`BUFF: ${BUFFS[out.buff.id].desc} (${Math.round(out.buff.min / 60)}H)`, 144), D.x + 6, y, UI.accent2, 1, null); y += 9; }
        drawText(g, `SELLS FOR ${out.price}  -  ${r.time} MIN`, D.x + 6, y, UI.dim, 1, null); y += 9;
        const lb = lovedBy(r.out);
        if (lb.length) { wrapPx(`LOVED BY: ${lb.slice(0, 4).join(', ')}`, 142).slice(0, 2).forEach((l) => { drawText(g, l, D.x + 6, y, UI.accent, 1, null); y += 8; }); }
        if (HS(game).cooked[r.id]) drawText(g, `COOKED ${HS(game).cooked[r.id]} TIMES`, D.x + 6, y, UI.dim, 1, null);
        if (BTN(g, input, D.x + 40, D.y + 170, 74, 14, 'COOK', canMake(game, r.ingredients), true)) this.cook(r);
      } else drawTextC(g, 'PICK A RECIPE', D.x + 77, D.y + 90, UI.dim, 1, null);
    }
    drawText(g, fit('C: TABS  ESC: CLOSE', 134), 14, 194, UI.dim, 1, null);
    drawText(g, `ENERGY ${Math.round(game.energy)}`, 14, 204, UI.ink2, 1, null);
  }
}
register('scene', 'hob_cooking', { make: (game, opts) => new CookingScene(game, opts) });

// =================================================================== CRAFTING (workbench)
const crafts = () => all('craft').sort((a, b) => (a.skill || 0) - (b.skill || 0));
class CraftScene {
  constructor(game) { Object.assign(this, { name: 'hob_craft', opaque: false, game, sel: 0, top: 0, anim: 0, made: null }); }
  update(dt, input, game) {
    this.input = input;
    if (this.anim > 0) { this.anim -= dt; if (Math.floor(this.anim * 6) !== Math.floor((this.anim + dt) * 6)) game.sfx('dig'); if (this.anim <= 0) this.finish(); return; }
    const L = crafts(), k = input.pressed, rows = 15;
    if (k.has('escape') || k.has('tab')) return game.scenes.pop(this);
    if (k.has('arrowdown') || k.has('s')) this.sel = Math.min(L.length - 1, this.sel + 1);
    if (k.has('arrowup') || k.has('w')) this.sel = Math.max(0, this.sel - 1);
    if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + rows) this.top = this.sel - rows + 1;
    if (input.justDown && inside(input.mx, input.my, 14, 36, 132, rows * 10)) { const i = this.top + Math.floor((input.my - 36) / 10); if (i < L.length) this.sel = i; }
    if (k.has('enter') || k.has(' ') || k.has('e')) this.start(L[this.sel], 1);
    if (k.has('5')) this.start(L[this.sel], 5);
  }
  ok(c, n = 1) { return (this.game.skillLevel('crafting') >= (c.skill || 0)) && canMake(this.game, c.ingredients, n); }
  start(c, n) { if (!c || !this.ok(c, n)) { this.game.sfx('wrong'); return; } if (!this.game.useEnergy(2 * n)) return; this.job = { c, n }; this.anim = 0.9 + n * 0.15; }
  finish() {
    const { c, n } = this.job, game = this.game;
    let saved = 0;
    for (let i = 0; i < n; i++) { if (game.rng() < 0.1 && game.skillLevel('crafting') >= 3) saved++; else consume(game, c.ingredients); }
    game.give(c.out, c.n * n); game.addXP('crafting', (4 + (c.skill || 0) * 2) * n); game.advance(20 * n);
    game.stat('crafted', n); game.collect('craft', c.id); HS(game).crafted[c.id] = (HS(game).crafted[c.id] || 0) + n;
    if (saved) game.toast('Careful work: saved some materials!', 'i_star');
    game.bus.emit('crafted', { recipe: c.id, item: c.out, n });
    this.made = { icon: get('item', c.out).icon, t: 1.2 }; game.sfx('chime');
  }
  draw(g, game) {
    const input = this.input || { mx: -1, my: -1 }, L = crafts(), lv = game.skillLevel('crafting');
    rect(g, '#10081888', 0, 0, 320, 224);
    panel(g, 6, 6, 308, 212, 'paper');
    drawText(g, 'WORKBENCH', 14, 12, UI.accent2, 1, null); drawText(g, `CRAFTING LEVEL ${lv}`, 306 - measure(`CRAFTING LEVEL ${lv}`), 12, UI.dim, 1, null);
    rect(g, UI.paper2, 12, 34, 136, 154);
    L.slice(this.top, this.top + 15).forEach((c, r) => { const i = this.top + r, y = 36 + r * 10; if (i === this.sel) rect(g, '#ffd76a88', 13, y - 1, 134, 10); const lock = (c.skill || 0) > lv; drawText(g, lock ? `LV ${c.skill}: ${fit(c.name, 86)}` : fit(c.name, 112), 16, y + 1, this.ok(c) ? UI.ink : UI.dim, 1, null); if (this.ok(c)) rect(g, UI.good, 140, y + 2, 4, 4); });
    const c = L[this.sel], D = { x: 154, y: 20 };
    panel(g, D.x, D.y, 154, 192, 'paper');
    if (c) {
      const out = get('item', c.out);
      drawIcon(g, out.icon, D.x + 16, D.y + 14); drawText(g, fit(c.name + (c.n > 1 ? ` x${c.n}` : ''), 118), D.x + 30, D.y + 8, UI.accent2, 1, null);
      wrapPx(out.desc || '', 112).slice(0, 2).forEach((l, i) => drawText(g, l, D.x + 30, D.y + 17 + i * 8, UI.ink, 1, null));
      drawText(g, 'MATERIALS', D.x + 6, D.y + 38, UI.dim, 1, null);
      Object.entries(c.ingredients).forEach(([k, n], i) => { const h = holding(game, k).n, y = D.y + 48 + i * 14; drawIcon(g, ingIcon(k), D.x + 14, y + 3); drawText(g, fit(ingName(k), 92), D.x + 26, y + 1, UI.ink, 1, null); drawText(g, `${Math.min(h, 99)}/${n}`, D.x + 148 - measure(`${h}/${n}`), y + 1, h >= n ? UI.good : UI.bad, 1, null); });
      if ((c.skill || 0) > lv) drawText(g, `NEEDS CRAFTING LEVEL ${c.skill}`, D.x + 6, D.y + 120, UI.bad, 1, null);
      if (HS(game).crafted[c.id]) drawText(g, `MADE ${HS(game).crafted[c.id]} SO FAR`, D.x + 6, D.y + 130, UI.dim, 1, null);
      if (this.anim <= 0) {
        if (BTN(g, input, D.x + 8, D.y + 170, 66, 14, 'CRAFT', this.ok(c), true)) this.start(c, 1);
        if (BTN(g, input, D.x + 80, D.y + 170, 66, 14, 'MAKE 5 (5)', this.ok(c, 5))) this.start(c, 5);
      }
    }
    if (this.anim > 0) { // hammering animation
      rect(g, '#2b1d2ee0', 96, 80, 128, 64); rect(g, Rr.wood[2], 116, 124, 88, 8); rect(g, Rr.wood[3], 116, 124, 88, 2);
      const up = Math.floor(this.anim * 6) % 2;
      rect(g, Rr.wood[3], 170, up ? 92 : 104, 4, 22); rect(g, Rr.metal[2], 162, up ? 88 : 100, 20, 8); rect(g, Rr.metal[3], 162, up ? 88 : 100, 20, 2);
      if (!up) for (let i = 0; i < 5; i++) rect(g, '#fff6a0', 150 + i * 8, 116 - (i % 2) * 4, 2, 2);
      drawTextC(g, 'MAKING...', 160, 134, UI.gold, 1, null);
    }
    if (this.made && (this.made.t -= 1 / 60) > 0) { drawIcon(g, this.made.icon, 80, 196 - Math.round((1.2 - this.made.t) * 10)); drawText(g, 'DONE!', 92, 194, UI.good, 1, null); }
    drawText(g, fit('5: MAKE FIVE  ESC: CLOSE', 134), 14, 194, UI.dim, 1, null);
  }
}
register('scene', 'hob_craft', { make: (game) => new CraftScene(game) });

// =================================================================== MUSEUM
export const MUSEUM = [['fish', 'Fish', 'fish'], ['bug', 'Bugs', 'bug'], ['shell', 'Shells', 'shell'], ['mineral', 'Minerals', 'mineral']];
const catItems = (cat) => all('item').filter((it) => it.cat === cat && !it.stub && it.id.split('_')[0] === { fish: 'fish', bug: 'bug', shell: 'shell', mineral: 'min' }[cat]);
const REWARD = { 25: { money: 300, stickers: 1 }, 50: { money: 600, stickers: 2 }, 75: { money: 1000, stickers: 3 }, 100: { money: 2000, stickers: 5 } };
for (const [cat, name, shape] of MUSEUM) if (!get('item', `furn_trophy_${cat}`)) register('item', `furn_trophy_${cat}`, { name: `${name} trophy`, desc: `Awarded by the library for completing the ${name.toLowerCase()} collection.`, cat: 'decor', price: 500, icon: itemIcon('star', { c: Rr.butter[2] }), tags: ['decor', 'trophy', shape] });
const donatedPct = (game, cat) => { const all2 = catItems(cat); return all2.length ? Math.floor(Object.keys(HS(game).donated[cat]).filter((id) => get('item', id)).length / all2.length * 100) : 0; };
function rewards(game, cat, name) {
  const pct = donatedPct(game, cat);
  for (const step of [25, 50, 75, 100]) {
    const key = `${cat}:${step}`;
    if (pct < step || HS(game).rewards[key]) continue;
    HS(game).rewards[key] = game.day;
    const r = REWARD[step];
    game.addMoney(r.money); if (get('item', 'star_sticker')) game.give('star_sticker', r.stickers);
    if (step === 100) { game.give(`furn_trophy_${cat}`, 1); game.setFlag(`title_${cat}_curator`); }
    game.toast(`Museum: ${name} ${step}% complete! Reward received`, 'i_trophy'); game.stat('museumRewards');
  }
}
function donate(game) {
  const st = HS(game).donated, got = [];
  for (const [cat, name] of MUSEUM) for (const it of catItems(cat)) if (game.has(it.id) && !st[cat][it.id]) { game.take(it.id, 1); st[cat][it.id] = game.day; got.push([cat, it]); game.collect(cat, it.id); }
  if (!got.length) return game.say('misa', 'neutral', 'Nothing new to donate right now. Time to explore!');
  game.stat('donated', got.length);
  for (const [cat, it] of got) game.bus.emit('donated', { kind: cat, item: it.id, n: 1 });
  game.sfx('chime');
  const steps = [{ t: 'say', who: null, text: `You donated ${got.length} new find${got.length > 1 ? 's' : ''}: ${got.slice(0, 3).map(([, it]) => it.name.toLowerCase()).join(', ')}${got.length > 3 ? ' and more' : ''}. They go straight into the display cases.` }];
  return game.run(steps).then(() => { for (const [cat, name] of MUSEUM) rewards(game, cat, name); });
}
class MuseumScene {
  constructor(game) { Object.assign(this, { name: 'hob_museum', opaque: false, game, tab: 0, sel: 0 }); }
  update(dt, input, game) {
    this.input = input; const k = input.pressed, L = catItems(MUSEUM[this.tab][0]);
    if (k.has('escape') || k.has('tab') || k.has('enter')) return game.scenes.pop(this);
    if (k.has('c') || k.has('arrowright') && this.sel === L.length - 1) { this.tab = (this.tab + 1) % 4; this.sel = 0; }
    if (k.has('arrowright') || k.has('d')) this.sel = Math.min(L.length - 1, this.sel + 1);
    if (k.has('arrowleft') || k.has('a')) this.sel = Math.max(0, this.sel - 1);
    if (k.has('arrowdown') || k.has('s')) this.sel = Math.min(L.length - 1, this.sel + 10);
    if (k.has('arrowup') || k.has('w')) this.sel = Math.max(0, this.sel - 10);
    if (input.justDown) { const gx = Math.floor((input.mx - 20) / 28), gy = Math.floor((input.my - 50) / 30), i = gy * 10 + gx; if (gx >= 0 && gx < 10 && gy >= 0 && i < L.length) this.sel = i; }
  }
  draw(g, game) {
    const [cat, name] = MUSEUM[this.tab], L = catItems(cat), st = HS(game).donated[cat];
    rect(g, '#10081888', 0, 0, 320, 224);
    rect(g, Rr.woodDark[1], 6, 6, 308, 212); rect(g, Rr.woodDark[2], 8, 8, 304, 208); rect(g, Rr.woodDark[3], 8, 8, 304, 2);
    drawText(g, 'HOSHIMORI LIBRARY MUSEUM', 16, 14, Rr.butter[3], 1, null);
    const hit = tabsBar(g, this.input, 14, 26, 292, MUSEUM.map(([c, n]) => `${n} ${donatedPct(game, c)}%`), this.tab); if (hit >= 0) { this.tab = hit; this.sel = 0; }
    L.forEach((it, i) => {
      const x = 20 + (i % 10) * 28, y = 46 + Math.floor(i / 10) * 30, has = !!st[it.id];
      rect(g, Rr.woodDark[0], x, y, 26, 28); rect(g, Rr.sky[4], x + 1, y + 1, 24, 22); rect(g, '#d8eef8', x + 1, y + 1, 24, 2); rect(g, Rr.wood[2], x + 1, y + 23, 24, 4); rect(g, Rr.butter[1], x + 10, y + 24, 6, 2);
      if (has) drawIcon(g, it.icon, x + 13, y + 12); else drawIcon(g, it.icon, x + 13, y + 12, true);
      rect(g, '#ffffff60', x + 3, y + 3, 1, 6);
      if (i === this.sel) { rect(g, Rr.butter[2], x - 1, y - 1, 28, 1); rect(g, Rr.butter[2], x - 1, y + 28, 28, 1); rect(g, Rr.butter[2], x - 1, y, 1, 28); rect(g, Rr.butter[2], x + 26, y, 1, 28); }
    });
    const it = L[this.sel];
    if (it) { const has = st[it.id]; drawText(g, has ? it.name : '??? (not donated yet)', 16, 188, has ? Rr.paper[4] : Rr.paper[1], 1, null); if (has) drawText(g, fit(it.desc, 288), 16, 197, Rr.paper[2], 1, null); }
    const marks = [25, 50, 75, 100].map((p) => (HS(game).rewards[`${cat}:${p}`] ? `${p}*` : `${p}`)).join(' ');
    drawText(g, `REWARDS ${marks}`, 304 - measure(`REWARDS ${marks}`), 14, Rr.paper[3], 1, null);
    drawText(g, 'C: NEXT CASE  ESC: LEAVE', 16, 207, Rr.paper[1], 1, null);
  }
}
register('scene', 'hob_museum', { make: (game) => new MuseumScene(game) });

// =================================================================== TELESCOPE
function stargaze(game) {
  const h = hour(game);
  if (h >= 5 && h < 19) return game.say('misa', 'neutral', 'Too bright to see any stars. I\'ll come back after dark.');
  if (['rain', 'storm', 'snow', 'cloudy'].includes(game.weather)) return game.say('misa', 'sad', 'Clouds everywhere tonight. The stars will wait.');
  const season = all('constellation').filter((c) => c.season === game.season), fresh = season.filter((c) => !HS(game).stars[c.id]);
  const con = (fresh.length ? fresh : season)[Math.floor(game.rng() * (fresh.length || season.length))];
  return game.minigame('hob_stars', { con: con.id }).then((r) => {
    if (!r || r.quit) return;
    game.advance(30); game.addMood(5); game.addXP('study', 4);
    if (!HS(game).stars[con.id]) {
      HS(game).stars[con.id] = game.day; game.collect('star', con.id); game.stat('constellations'); game.bus.emit('starLogged', { id: con.id });
      if (r.stars >= 3) game.give('gift_star_sketch', 1);
      const left = all('constellation').filter((c) => !HS(game).stars[c.id]).length;
      game.toast(left ? `Star map: ${24 - left}/24 constellations` : 'Star map complete! Every constellation found', 'i_star');
    } else game.toast(`${con.name} again. Still beautiful.`, 'i_star');
  });
}

// =================================================================== COLLECTIONS APP
const APP_TABS = [
  ['fish', 'FISH', () => all('fish').map((f) => get('item', f.item))],
  ['bug', 'BUGS', () => all('bug').map((b) => get('item', b.item))],
  ['shell', 'SHELLS', () => all('collectible').filter((c) => c.kind === 'shell').map((c) => get('item', c.item))],
  ['mineral', 'MINERALS', () => all('collectible').filter((c) => c.kind === 'mineral').map((c) => get('item', c.item))],
  ['star', 'STARS', () => all('constellation')],
  ['recipe', 'RECIPES', () => all('recipe').map((r) => ({ ...get('item', r.out), id: r.id, rec: r }))],
  ['crop', 'GARDEN', () => all('crop').map((c) => get('item', c.item))],
];
const starIcon = itemIcon('star', { c: Rr.butter[2] });
const S_NAME = { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' };
function entryInfo(game, kind, e) {
  if (kind === 'fish') { const f = get('fish', e.id), rec = HS(game).fish[f.id]; return [`${f.maps.join(', ') || 'somewhere'} - ${f.seasons.map((s) => S_NAME[s]).join(' ')}`, `${typeof f.times === 'string' ? f.times : 'set hours'}${f.weather !== 'any' ? ', ' + f.weather : ''}`, rec ? `CAUGHT ${rec.n}  BEST ${rec.best} CM` : '', HS(game).donated.fish[e.id] ? 'IN THE MUSEUM' : ''];
  }
  if (kind === 'bug') { const b = get('bug', e.id), rec = HS(game).bugs[b.id]; return [`On ${b.habitat === 'water' ? 'water edges' : b.habitat === 'tree' ? 'trees' : b.habitat === 'flower' ? 'flowers' : b.habitat}`, `${b.seasons.map((s) => S_NAME[s]).join(' ')} - ${b.times}`, rec ? `CAUGHT ${rec.n}  FREED ${rec.released}` : '', HS(game).donated.bug[e.id] ? 'IN THE MUSEUM' : ''];
  }
  if (kind === 'shell' || kind === 'mineral') { const c = get('collectible', e.id); return [`Found: ${c.where.map((w) => ({ dig: 'dig spots', rock: 'cave rocks', cave: 'the cave', beach: 'the beach' }[w])).join(', ')}`, `Rarity ${'*'.repeat(c.rarity)}`, '', HS(game).donated[kind][e.id] ? 'IN THE MUSEUM' : '']; }
  if (kind === 'recipe') { const r = e.rec; return [r.hidden ? 'Secret recipe' : r.from ? `From ${r.from === 'dad' ? 'Dad' : r.from === 'book' ? 'a cookbook' : npcName(r.from)}` : r.skill ? `Cooking level ${r.skill}` : 'Known from the start', `+${e.energy} energy`, HS(game).cooked[r.id] ? `COOKED ${HS(game).cooked[r.id]}` : '', '']; }
  if (kind === 'crop') { const c = get('crop', e.id); return [`${c.seasons.map((s) => S_NAME[s]).join(' ')}`, `${c.days} days${c.regrow ? `, regrows ${c.regrow}` : ''}`, '', '']; }
  return [S_NAME[e.season] + ' sky', '', '', ''];
}
const isKnown = (game, kind, e) => (kind === 'star' ? !!HS(game).stars[e.id] : kind === 'recipe' ? knows(game, e.rec.id) : !!game.collected(kind, e.id));
register('phoneApp', 'collections', {
  name: 'Collections', icon: 'i_fishicon', order: 45,
  open(game, app) { app.state.tab ??= 0; app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, [kind, , fn] = APP_TABS[st.tab], L = fn(), { x, y } = app.area;
    if (k.has('c')) { st.tab = (st.tab + 1) % APP_TABS.length; st.sel = 0; }
    if (k.has('arrowright') || k.has('d')) st.sel = Math.min(L.length - 1, st.sel + 1);
    if (k.has('arrowleft') || k.has('a')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(L.length - 1, st.sel + 10);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 10);
    if (input.justDown) {
      if (inside(input.mx, input.my, x, y, 292, 11)) { st.tab = Math.min(APP_TABS.length - 1, Math.floor((input.mx - x) / (292 / APP_TABS.length))); st.sel = 0; }
      const gx = Math.floor((input.mx - x - 2) / 19), gy = Math.floor((input.my - y - 26) / 19), i = gy * 10 + gx;
      if (gx >= 0 && gx < 10 && gy >= 0 && i < L.length) st.sel = i;
    }
    st.sel = Math.max(0, Math.min(st.sel, L.length - 1)); void kind;
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, [kind, , fn] = APP_TABS[st.tab], L = fn();
    tabsBar(g, null, x, y, 292, APP_TABS.map((t) => t[1]), st.tab);
    const got = L.filter((e) => isKnown(game, kind, e)).length;
    drawText(g, `FOUND ${got}/${L.length}`, x + 2, y + 15, UI.accent2, 1, null);
    L.forEach((e, i) => {
      const cx = x + 2 + (i % 10) * 19, cy = y + 26 + Math.floor(i / 10) * 19, kn = isKnown(game, kind, e);
      rect(g, i === st.sel ? UI.gold : UI.paper2, cx, cy, 18, 18); rect(g, UI.paper, cx + 1, cy + 1, 16, 16);
      drawIcon(g, kind === 'star' ? starIcon : e.icon, cx + 9, cy + 9, !kn);
    });
    const e = L[st.sel]; if (!e) return;
    const kn = isKnown(game, kind, e), px = x + 196;
    panel(g, px, y + 14, 96, 158, 'paper');
    if (kind === 'star') {
      rect(g, '#1b1b3a', px + 4, y + 18, 88, 56);
      const P = e.stars.map(([sx, sy]) => [px + 8 + sx * 0.8, y + 22 + sy * 0.8]);
      if (kn) { let pen = false; e.path.forEach((ix, j) => { if (ix < 0) { pen = false; return; } const pr = e.path[j - 1]; if (pen && pr >= 0) { const [a, b] = P[pr], [c, d] = P[ix]; for (let s = 0; s <= 20; s++) rect(g, '#7fb2e0', a + (c - a) * s / 20, b + (d - b) * s / 20, 1, 1); } pen = true; }); }
      P.forEach(([sx, sy]) => rect(g, kn ? '#fffaf0' : '#6b5068', sx - 1, sy - 1, 2, 2));
    } else drawIcon(g, e.icon, px + 48, y + 34, !kn);
    const nm = kn ? (e.name || '') : '???';
    wrapPx(nm, 88).slice(0, 2).forEach((l, i) => drawText(g, l, px + 4, y + 78 + i * 8, UI.accent2, 1, null));
    const info = entryInfo(game, kind, e);
    const lines = kn ? [...wrapPx(kind === 'star' ? e.lore : e.desc || '', 88).slice(0, 4), ...info.filter(Boolean)] : ['Not found yet.', ...(kind === 'star' ? [`Look up on a clear ${S_NAME[e.season]} night.`] : kind === 'recipe' ? [info[0]] : [info[0]])];
    lines.slice(0, 9).forEach((l, i) => wrapPx(l, 88).slice(0, 1).forEach((ll) => drawText(g, ll, px + 4, y + 96 + i * 8, UI.ink, 1, null)));
  },
});

// =================================================================== interactions
registerMany('interaction', {
  museum: { label: 'Museum corner', run: (game) => game.run([
    { t: 'if', cond: '!flag:hob_museum_intro', then: [{ t: 'say', who: null, text: 'A little museum run by the library. Fish, bugs, shells and minerals you donate go on display here.' }, { t: 'flag', k: 'hob_museum_intro' }] },
    { t: 'choice', prompt: 'Museum corner', options: [
      { text: 'Donate new finds', steps: [{ t: 'call', fn: (g) => donate(g) }] },
      { text: 'Look at the displays', steps: [{ t: 'call', fn: (g) => new Promise((res) => { const s = g.open('hob_museum'); const ex = s.exit; s.exit = () => { ex && ex(); res(); }; }) }] },
      { text: 'Leave', steps: [] }] }]),
    overlay(game, world, o) {
      if (!game.state.hobbies) return;
      const n = MUSEUM.reduce((a, [c]) => a + Object.keys(HS(game).donated[c]).length, 0); if (!n) return;
      const t = `${n}`, x = world.sx((o.x + o.w / 2) * 16) - Math.round(measure(t) / 2) - 3, y = world.sy(o.y * 16) - 18;
      rect(world.g, Rr.wood[1], x, y, measure(t) + 7, 9); rect(world.g, Rr.butter[2], x + 1, y + 1, measure(t) + 5, 7); drawText(world.g, t, x + 4, y + 2, Rr.ink[1], 1, null);
    } },
  craft_bench: { label: 'Workbench', run: (game) => game.open('hob_craft') },
  telescope: { label: (game) => (hour(game) >= 19 || hour(game) < 5 ? 'Look at the stars' : 'Telescope'), run: (game) => stargaze(game) },
});

// =================================================================== minigames (+ bots for the tests)
const fishOpt = (o) => { const f = get('fish', o.fish) || all('fish')[0]; return f ? { ...f, name: get('item', f.item).name } : null; };
registerMany('minigame', {
  hob_fishing: {
    title: 'Fishing', music: 'minigame', resultTitle: 'FISHING',
    make: (game, o) => new FishGame(game.rng, { ...o, fish: fishOpt(o) }),
    bot(m, t, inp) {
      if (m.phase === 'cast' && m.power > 0.85) inp.pressed = new Set([' ']);
      if (m.phase === 'bite' && m.bt > 0.1) inp.pressed = new Set([' ']);
      if (m.phase === 'reel' && m.zone + m.zoneH / 2 < m.fy) inp.keys = new Set([' ']);
      return inp;
    },
  },
  hob_net: {
    title: 'Bug catching', resultTitle: 'BUG CATCHING',
    make: (game, o) => { const b = get('bug', o.bug) || all('bug')[0]; return new NetGame(game.rng, { ...o, bug: b && { ...b, name: get('item', b.item).name, icon: get('item', b.item).icon } }); },
    bot(m, t, inp) { inp.moved = true; inp.mx = m.bx; inp.my = m.by; if (m.swing <= 0 && Math.hypot(m.cur.x - m.bx, m.cur.y - m.by) < 6) inp.pressed = new Set([' ']); return inp; },
  },
  hob_stars: {
    title: 'Stargazing', music: 'night', resultTitle: 'STAR LOGGED',
    make: (game, o) => new StarGame(game.rng, { con: get('constellation', o.con) || all('constellation').find((c) => c.season === game.season) || all('constellation')[0] }),
    bot(m, t, inp) { const p = m.pts[m.target]; if (!p) return inp; inp.moved = true; inp.mx = p[0]; inp.my = p[1]; if (Math.hypot(m.cur.x - p[0], m.cur.y - p[1]) < 2 && Math.floor(t * 60) % 6 === 0) inp.pressed = new Set([' ']); return inp; },
  },
  hob_cooking: {
    title: 'Cooking', resultTitle: 'BON APPETIT!',
    make: (game, o) => { const r = get('recipe', o.recipe); const out = r && get('item', r.out); return new CookGame(game.rng, { name: o.name || (r && r.name) || 'Onigiri', steps: o.steps || (r && r.steps) || ['chop', 'stir', 'fry'], icon: o.icon || (out && out.icon), colour: (r && Object.keys(r.ingredients).map(ingIcon).length && Rr.butter[2]) || Rr.butter[2] }); },
    bot(m, t, inp) {
      if (m.step === 'chop' && m.notes.some((q) => q.hit === null && Math.abs(q.at - m.st) < 0.03)) inp.pressed = new Set([' ']);
      if (m.step === 'stir' && m.speed < 0.6) inp.keys = new Set([' ']);
      if (m.step === 'fry' && !m.stopped && m.heat >= 0.66) inp.pressed = new Set([' ']);
      return inp;
    },
  },
});

// =================================================================== system
export function menuSystem(game) {
  game.learnRecipe = (id, from) => learnRecipe(game, id, from);
  game.knowsRecipe = (id) => knows(game, id);
  game.openCooking = () => game.open('hob_cooking');
  game.openCrafting = () => game.open('hob_craft');
  game.donateFinds = () => donate(game);
  game.stargaze = () => stargaze(game);
  game.bus.on('skillUp', (e) => { if (e.id === 'cooking') autoLearn(game); });
  game.bus.on('heartUp', ({ npc, hearts }) => { const r = NPC_RECIPE[npc]; if (r && hearts >= 3 && !HS(game).taught[npc]) { HS(game).taught[npc] = r; learnRecipe(game, r, npcName(npc)); } });
  game.bus.on('itemGot', ({ item }) => { if (item === 'book_cookbook') for (const r of all('recipe')) if (r.from === 'book') learnRecipe(game, r.id, 'the cookbook'); });
  game.bus.on('dayStart', () => {
    if (game.weekday !== 4) return;
    const next = all('recipe').find((r) => r.from === 'dad' && !knows(game, r.id));
    if (next) learnRecipe(game, next.id, 'Dad');
  });
  game.bus.on('itemUsed', ({ item, ate }) => { const it = get('item', item); if (ate && it && it.buff && game.addBuff) game.addBuff(it.buff.id, it.buff.min); if (ate && item === 'dish_mysterious_lump') game.toast('It tastes like... adventure.'); });
}
register('system', 'hobbies', { init(game) { hobbySystem(game); worldSystem(game); menuSystem(game); } });

features('Cooking & food', [
  'Recipe book at the stove: known recipes, what you can cook now, and which ingredients are missing with have/need counts',
  '60 recipes: breakfasts, bento, mains, noodles, seafood, desserts, teas and drinks',
  'Cooking minigame: each dish takes 2-3 steps from chop (rhythm taps), stir (keep the speed in the green) and fry (stop at golden)',
  'Dishes restore energy and mood, and the recipe book shows energy, mood, buff, sell price and who loves the dish',
  'Start with 5 recipes; more unlock as your cooking skill levels up',
  'Dad sends a new recipe every Friday',
  'Friends teach you their favourite recipe at 3 hearts (Mika, Jun, Hina, Mr. Hayashi, Kai, Grandma, Suzu, Theo)',
  'Buying the cookbook teaches its recipes',
  'Experiment mode: combine up to 4 ingredients to discover 10 secret recipes',
  'Failed experiments make a Mysterious lump: edible, giftable, and nobody\'s favourite',
  'Starlight mochi: a story recipe of glutinous rice flour, yuzu and sugar',
  'A perfect 3-star cook can give an extra serving',
  'Ingredients from the garden or the shop both work (tomatoes, cabbage, potatoes...)',
  'Any fish can be grilled; fish, flowers and leafy greens count as ingredient groups',
  'Cooking XP grows with the stars and the size of the recipe',
]);
features('Crafting', [
  'Workbench in the yard shed: 19 recipes for gifts, decor, compost and a better bug net',
  'Craft screen with material counts, a craft button and a short hammering animation',
  'Make five at once with one press',
  'Higher crafting levels unlock harder recipes, and careful work sometimes saves materials',
  'Shells, flowers, fish and minerals from your hobbies become crafting materials',
  'Compost: turn spare vegetables into fertiliser for the garden',
  'Crafting XP for every item made',
]);
features('Bugs, shells & collections', [
  'Museum corner in the library: donate all your new fish, bugs, shells and minerals in one go',
  'Museum display cases fill up with every donation, with silhouettes for missing ones',
  'Museum rewards at 25, 50, 75 and 100% of each collection: coins, Star Stickers and a trophy',
  'The museum shows a count of donated finds above the display',
  'Collections phone app: fish, bugs, shells, minerals, constellations, recipes and garden crops with silhouettes for unknown entries',
  'Collections show where and when to find things, catch counts, best sizes and what is in the museum',
]);
features('Minigames & hobbies', [
  'Stargazing at the school roof telescope (and the attic skylight): connect the stars of a constellation in order on clear nights',
  '24 constellations, 6 per season, each with a little story, logged to your star map',
  'A great stargazing session can give you a star sketch to keep or gift',
  'Fishing minigame: power cast, wait for the bobber, strike on the bite, then hold to keep the catch bar on the fish',
  'Bug net minigame: move the net over a flitting bug and swing; three tries before it flies off',
]);

features('Cooking & food', [
  'The recipe book remembers how many times you have cooked each dish',
  'Sweets, desserts and drinks are tagged so friends with a sweet tooth love them',
]);
features('Crafting', [
  'Handmade gifts: friendship bracelet, shell necklace, paper crane, jar of paper stars and knitted scarf',
  'Crafted decor: shell lamp, fish print, bug terrarium, star mobile, scarecrow and flower vase',
]);
features('Minigames & hobbies', [
  'Telescopes only work on clear nights after 7 PM; clouds and rain hide the stars',
  'Each new constellation gives Study XP and a cozy mood boost',
  'Completing a museum collection awards a trophy decor item and a curator title',
]);
