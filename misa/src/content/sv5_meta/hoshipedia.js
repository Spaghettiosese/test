// Hoshipedia: the in-game encyclopedia. Entries unlock on first obtained (itemGot / collectNew), first met (meet), first visit (mapEnter)
// and first learned (recipeLearned / cooked). Five tabs (Items, People, Places, Recipes, Wild) with A-Z group chips, a category cycle
// and typed search; every row is 16 px tall and the list drag-scrolls. Reads the registries, so later packs appear automatically.
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, wrap, icon } from '../../ui/ui.js';
import { S, nameOf } from './state.js';
import { scrollList, keyNav, listRows, chips, RH } from './ui.js';

const TABS = ['items', 'people', 'places', 'recipes', 'wild'];
const GROUPS = ['ALL', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'YZ'];
const title = (s) => String(s || '').replace(/_/g, ' ');
const mapName = (id) => (get('map', id) || { name: id }).name;
const itemName = (id) => (get('item', id) || { name: id }).name;
const list = (v) => (Array.isArray(v) ? v : []);

let SRC = null;
export function sources() {
  if (SRC) return SRC;
  const m = SRC = {}, add = (id, t) => { (m[id] ||= []).includes(t) || m[id].push(t); };
  for (const s of all('shop')) for (const id of list(s.stock)) add(id, `Sold at ${s.name}`);
  for (const r of all('recipe')) if (r.out) add(r.out, `Cook: ${r.name}`);
  for (const f of all('fish')) add(f.item, `Fish at ${list(f.maps).map(mapName).join(', ') || 'the water'}${f.seasons && f.seasons.length < 4 ? ' in ' + f.seasons.join('/') : ''}`);
  for (const b of all('bug')) add(b.item, `Bug: ${b.habitat || 'grass'}${b.seasons && b.seasons.length < 4 ? ' in ' + b.seasons.join('/') : ''}`);
  for (const c of all('crop')) { add(c.item, `Grow from ${itemName(c.seed)}`); add(c.seed, `Plant in ${list(c.seasons).join('/')}`); }
  for (const c of all('collectible')) add(c.item, `Find at ${list(c.where).map(mapName).join(', ')}`);
  return m;
}
const CATHINT = { gift: 'Gifts, shops and events', clothes: 'Clothes shops and outfits', decor: 'Furniture shops and rewards', book: 'Library and bookstores', tool: 'Tool shops', material: 'Gathered or crafted', key: 'Story and quest items', misc: 'All around Hoshimori', junk: 'Found, fished or dropped' };
export const whereTo = (id) => { const it = get('item', id), s = sources()[id]; return s && s.length ? s : [CATHINT[it && it.cat] || 'Explore Hoshimori to find out']; };

// ---------------------------------------------------------------- discovery
export const found = (g, tab, id) => !!S(g).dex[tab][id];
function mark(g, tab, id, quiet) { const d = S(g).dex[tab]; if (d[id]) return false; d[id] = g.day; if (!quiet) g.stat('dexEntries'); return true; }
export function backfill(g) {
  for (const id of Object.keys(g.state.inv || {})) if (get('item', id)) mark(g, 'item', id, true);
  for (const [kind, c] of Object.entries(g.state.collections || {})) for (const id of Object.keys(c)) { if (kind === 'recipe') mark(g, 'recipe', id, true); else if (get('item', id)) mark(g, 'item', id, true); }
  for (const k of Object.keys(g.state.seen || {})) if (k.startsWith('met:')) mark(g, 'npc', k.slice(4), true);
  for (const r of all('recipe')) if (r.learned) mark(g, 'recipe', r.id, true);
  const v = (g.state.story && g.state.story.visited) || {}; for (const k of Object.keys(v)) if (get('map', k)) mark(g, 'map', k, true);
  if (g.state.map) mark(g, 'map', g.state.map, true);
}
register('system', 'sv5_dex', { init(game) {
  game.bus.on('itemGot', (e) => e && e.item && mark(game, 'item', e.item));
  game.bus.on('collectNew', (e) => { if (!e) return; if (e.kind === 'recipe') mark(game, 'recipe', e.id); else { mark(game, 'item', e.id); mark(game, 'wild', e.id); } });
  game.bus.on('meet', (e) => e && e.npc && mark(game, 'npc', e.npc));
  game.bus.on('mapEnter', (e) => e && e.map && mark(game, 'map', e.map));
  game.bus.on('recipeLearned', (e) => e && e.id && mark(game, 'recipe', e.id));
  game.bus.on('cooked', (e) => e && e.recipe && mark(game, 'recipe', e.recipe));
  for (const ev of ['gameStart', 'gameLoaded']) game.bus.on(ev, () => backfill(game));
} });

// ---------------------------------------------------------------- entry lists
const WILD = () => [...all('fish').map((d) => ({ id: d.item, def: d, kind: 'Fish' })), ...all('bug').map((d) => ({ id: d.item, def: d, kind: 'Bug' })), ...all('crop').map((d) => ({ id: d.item, def: d, kind: 'Crop' })), ...all('collectible').map((d) => ({ id: d.item, def: d, kind: d.kind === 'mineral' ? 'Mineral' : 'Shell' }))];
export function entries(g, tab) {
  const d = S(g).dex;
  if (tab === 'items') return all('item').filter((i) => !i.id.startsWith('leftover_')).map((i) => ({ id: i.id, name: i.name, cat: i.cat, got: !!d.item[i.id], def: i }));
  if (tab === 'people') return all('npc').map((n) => ({ id: n.id, name: n.name, cat: n.hidden ? 'phone' : 'town', got: !!d.npc[n.id], def: n }));
  if (tab === 'places') return all('map').map((m) => ({ id: m.id, name: m.name, cat: m.indoor ? 'indoor' : 'outdoor', got: !!d.map[m.id], def: m }));
  if (tab === 'recipes') return all('recipe').filter((r) => !r.story || d.recipe[r.id]).map((r) => ({ id: r.id, name: r.name, cat: r.station || 'kitchen', got: !!d.recipe[r.id], def: r }));
  return WILD().map((w) => ({ id: w.id, name: w.def.name || itemName(w.id), cat: w.kind, got: !!(d.wild[w.id] || d.item[w.id]), def: w.def, kind: w.kind }));
}
export function progress(g) {
  const per = TABS.map((t) => { const e = entries(g, t); return [e.filter((x) => x.got).length, e.length]; });
  const a = per.reduce((s, p) => s + p[0], 0), b = per.reduce((s, p) => s + p[1], 0);
  return { per, got: a, total: b, pct: b ? Math.floor((a / b) * 100) : 0 };
}
export function filtered(g, st) {
  let e = entries(g, TABS[st.tab]);
  const cats = ['all', ...[...new Set(e.map((x) => x.cat))].sort()]; st.cats = cats;
  if (st.cat > 0 && cats[st.cat]) e = e.filter((x) => x.cat === cats[st.cat]);
  if (st.grp > 0) { const set = GROUPS[st.grp]; e = e.filter((x) => set.includes((x.name || '?')[0].toUpperCase())); }
  if (st.q) e = e.filter((x) => (x.got ? x.name : '').toLowerCase().includes(st.q.toLowerCase()));
  return e.sort((a, b) => (a.got === b.got ? 0 : a.got ? -1 : 1) || (a.cat === b.cat ? 0 : a.cat < b.cat ? -1 : 1) || a.name.localeCompare(b.name));
}

function detail(g, e) {
  const L = [], d = e.def;
  if (!e.got) {
    L.push(['NOT DISCOVERED YET', UI.dim]);
    if (e.cat !== undefined && TABS.length) { /* hints */ }
    return L;
  }
  return L;
}
function lines(g, tab, e) {
  const d = e.def, out = [];
  if (tab === 'items') {
    if (e.got) wrap(d.desc || '', 30).slice(0, 4).forEach((l) => out.push([l, UI.ink]));
    out.push(['', UI.ink], ['HOW TO GET:', UI.accent2]); whereTo(e.id).slice(0, 3).forEach((s) => wrap(s, 30).slice(0, 2).forEach((l) => out.push([l, UI.ink2])));
    if (e.got) out.push(['', UI.ink], [`SELLS FOR ${d.price || 0} COINS`, UI.dim]);
  } else if (tab === 'people') {
    if (!e.got) { out.push(['Meet them around town.', UI.dim]); return out; }
    out.push([d.role || '', UI.ink2]); wrap(d.bio || '', 30).slice(0, 4).forEach((l) => out.push([l, UI.ink]));
    if (d.birthday) out.push(['', UI.ink], [`BIRTHDAY: ${d.birthday.season} ${d.birthday.day}`, UI.accent2]);
    const fr = g.state.friends[e.id] || {}, kg = list(fr.knownGifts);
    out.push([`HEARTS: ${g.hearts ? g.hearts(e.id) : 0}`, UI.ink]);
    out.push([kg.length ? 'LIKES: ' + kg.slice(0, 3).map(itemName).join(', ') : 'LIKES: give gifts to learn', UI.dim]);
  } else if (tab === 'places') {
    if (!e.got) { out.push(['Visit to fill this in.', UI.dim]); return out; }
    out.push([d.indoor ? 'INDOORS' : 'OUTDOORS', UI.ink2], [`${Object.keys(d.spots || {}).length} NAMED SPOTS`, UI.ink], [`${list(d.warps).length} EXITS`, UI.ink]);
  } else if (tab === 'recipes') {
    out.push([`MAKES: ${itemName(d.out)}`, UI.accent2], [`AT: ${(d.station || 'kitchen').toUpperCase()}`, UI.ink]);
    if (e.got) { Object.entries(d.ingredients || {}).slice(0, 6).forEach(([k, n]) => out.push([`${n} x ${k.startsWith('tag:') ? k.slice(4) : itemName(k)}`, UI.ink])); }
    else out.push(['Learn it from a book, a friend or a shop.', UI.dim]);
    if (d.from) out.push([`FROM: ${d.from}`.slice(0, 30), UI.dim]);
  } else {
    out.push([e.kind.toUpperCase(), UI.accent2]);
    if (d.seasons) out.push([`SEASONS: ${d.seasons.length === 4 ? 'ALL' : d.seasons.join(', ')}`, UI.ink]);
    if (d.maps || d.where) out.push([`WHERE: ${list(d.maps || d.where).map(mapName).join(', ')}`.slice(0, 60), UI.ink]);
    if (d.times) out.push([`TIME: ${d.times}`, UI.ink]); if (d.habitat) out.push([`HABITAT: ${d.habitat}`, UI.ink]);
    if (d.days) out.push([`GROWS IN ${d.days} DAYS`, UI.ink]);
  }
  return out;
}

register('phoneApp', 'sv5_dex', {
  name: 'Hoshipedia', icon: 'i_book', order: 33,
  badge: (g) => { const s = S(g); let n = 0; for (const t of ['item', 'npc', 'map', 'recipe']) for (const k of Object.keys(s.dex[t])) if (!s.dexSeen[t + k]) n++; return Math.min(99, n); },
  open(game, app) { Object.assign(app.state, { tab: 0, grp: 0, cat: 0, sel: 0, top: 0, q: '', typing: false, capture: false }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed;
    if (st.typing) {
      for (const key of k) { if (key.length === 1 && /[a-z0-9 ]/.test(key)) st.q += key; else if (key === 'backspace') st.q = st.q.slice(0, -1); else if (key === 'enter' || key === 'escape') { st.typing = false; st.capture = false; } }
      st.sel = 0; st.top = 0; return;
    }
    if (k.has('/')) { st.typing = true; st.capture = true; return; }
    if (k.has('c')) { st.cat = (st.cat + 1) % Math.max(1, (st.cats || [1]).length); st.sel = st.top = 0; }
    if (k.has('v')) { st.grp = (st.grp + 1) % GROUPS.length; st.sel = st.top = 0; }
    if (input.justDown) {
      for (let i = 0; i < TABS.length; i++) if (input.mx >= x + i * 58 && input.mx < x + i * 58 + 56 && input.my >= y && input.my < y + 14) { st.tab = i; st.cat = st.grp = st.sel = st.top = 0; st.q = ''; }
      if (input.my >= y + 32 && input.my < y + 46 && input.mx < x + 76) { st.cat = (st.cat + 1) % Math.max(1, (st.cats || [1]).length); st.sel = st.top = 0; }
      if (input.my >= y + 32 && input.my < y + 46 && input.mx >= x + 80 && input.mx < x + 150) { st.typing = true; st.capture = true; }
    }
    const l = filtered(game, st), zone = { x, y: y + 48, w: 150, h: 7 * RH }, t = scrollList(input, st, l.length, zone);
    if (t >= 0) st.sel = t; keyNav(input, st, l.length, 7);
    const e = l[st.sel]; if (e && e.got) S(game).dexSeen[['item', 'npc', 'map', 'recipe', 'wild'][st.tab] + e.id] = 1;
    if (e && e.got && st.tab === 0) S(game).dexSeen['item' + e.id] = 1;
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, P = progress(game);
    chips(g, null, x, y, 292, TABS.map((t, i) => `${t} ${P.per[i][0]}`), st.tab);
    const gi = chips(g, null, x, y + 16, 292, GROUPS, st.grp, 13); void gi;
    if (st.grp === undefined) st.grp = 0;
    const l = filtered(game, st);
    rect(g, UI.paper2, x, y + 32, 76, 14); drawText(g, `CAT: ${(st.cats || ['all'])[st.cat] || 'all'}`.toUpperCase().slice(0, 18), x + 3, y + 36, UI.ink, 1, null);
    rect(g, st.typing ? UI.gold : UI.paper2, x + 80, y + 32, 70, 14); drawText(g, (st.q ? st.q : 'SEARCH...').toUpperCase().slice(0, 16) + (st.typing && Math.floor(game.clock * 2) % 2 ? '_' : ''), x + 83, y + 36, st.q ? UI.ink : UI.dim, 1, null);
    drawText(g, `${P.pct}% DONE`, x + 160, y + 36, UI.accent2, 1, null); drawText(g, `${P.got}/${P.total}`, x + 214, y + 36, UI.dim, 1, null);
    listRows(g, st, { x, y: y + 48, w: 150, h: 7 * RH }, l.length, (i) => { const e = l[i]; return { text: e.got ? e.name : '???', dim: !e.got, dot: e.got ? UI.good : '#c8c0b0', right: '' }; });
    const e = l[Math.min(st.sel, l.length - 1)], px = x + 164;
    panel(g, px, y + 48, w - 164, 112, 'paper');
    if (!e) { drawText(g, 'NOTHING HERE', px + 6, y + 56, UI.dim, 1, null); return; }
    if (e.got && e.def.icon && st.tab === 0) icon(g, e.def.icon, px + w - 164 - 20, y + 52);
    drawText(g, (e.got ? e.name : '???').toUpperCase().slice(0, 20), px + 5, y + 54, UI.accent2, 1, null);
    drawText(g, e.cat.toUpperCase().slice(0, 20), px + 5, y + 63, UI.dim, 1, null);
    lines(game, TABS[st.tab], e).slice(0, 10).forEach(([t, c], i) => drawText(g, t.toUpperCase(), px + 5, y + 74 + i * 9, c, 1, null));
    drawText(g, 'TAP A TAB / CHIP. C: CATEGORY  /: SEARCH', x, y + 164, UI.dim, 1, null);
  },
});
// A-Z chips need their own hit test (kept apart so draw stays pure)
const _upd = get('phoneApp', 'sv5_dex').update;
get('phoneApp', 'sv5_dex').update = function (dt, input, game, app) {
  const st = app.state, { x, y } = app.area;
  if (input.justDown && !st.typing && input.my >= y + 16 && input.my < y + 29) { const cw = Math.floor(292 / GROUPS.length), i = Math.floor((input.mx - x) / cw); if (i >= 0 && i < GROUPS.length) { st.grp = i; st.sel = st.top = 0; } }
  return _upd.call(this, dt, input, game, app);
};
void detail; void nameOf;

features('Seasons & Meta', [
  'Hoshipedia phone app: an encyclopedia with Items, People, Places, Recipes and Wild tabs and an overall completion percentage',
  'Entries unlock the first time you get an item, meet someone, visit a map, learn or cook a recipe, or catch a fish or bug, and unseen entries show on the app badge',
  'Item entries list how and where to get them (shops, recipes, fishing spots, bug habitats, crop seeds) even before you find the item',
  'People entries show role, bio and birthday once met, plus the gifts they like once you have learned them',
  'Hoshipedia has A-Z group chips, a category cycle and typed search, with 16 px rows that drag-scroll on touch',
]);
