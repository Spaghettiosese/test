// Secret notes: 30 hidden notes found with "Look for secrets" at named spots, six of which are treasure maps to buried chests
// ("Dig here" at a faint X). A Notes app collects them; milestone notes unlock furniture, titles and Star Stickers.
import { register, get, features } from '../../core/registry.js';
import { spotPos } from '../../systems/festivals.js';
import { UI, rect, panel, drawText, drawTextC, wrap, inside } from '../../ui/ui.js';
import { S, say, N, call, has, giveOr, stickers } from './state.js';

// [id, map, spot, title, text, treasure?: [map, spot, loot]]
const L = (loot) => loot;
export const NOTES = [
  ['mailbox', 'yard', 'mailbox', 'A grumpy letter', 'Dear Mailbox, you ate my homework again. Signed, Not Mochi (it was totally Mochi).'],
  ['cherry', 'yard', 'cherry_tree', 'Carved initials', 'Someone carved I WAS HERE 1987 in the bark. Underneath, in newer letters: SO WAS I.'],
  ['gap', 'yard', 'fence_gap', 'Tuft of fur', 'A tuft of ginger fur on the fence. Evidence of a very smug cat passing through.'],
  ['vending', 'lane', 'vending', 'Sticky note', 'Machine takes coins. Machine keeps coins. Machine knows what you did.'],
  ['tomato', 'lane', 'goro_garden', 'Goro\'s secret', 'The best tomatoes are the ones you compliment. Do not tell the neighbours. Treasure is buried in the Aoki garden, where the sun lands at noon.', ['yard', 'garden', L({ coins: 450, item: 'min_amber', sticker: 1 })]],
  ['bus', 'lane', 'bus_stop', 'Timetable doodle', 'The 7:14 bus is never at 7:14. It is more of a state of mind.'],
  ['wish', 'town', 'fountain', 'A paper wish', 'I wished for more wishes. Please do not tell the fountain.'],
  ['tower', 'town', 'clocktower', 'Tobias\'s memo', 'If the clock is wrong, check the calendar first. If the calendar is wrong, check yourself.'],
  ['bench', 'town', 'bench_2', 'Cat doodle', 'Someone drew a very round cat on the underside of the bench. Round cat approves of sitting.'],
  ['setlist', 'town', 'stage', 'Forgotten set list', 'Song one: Feelings. Song two: More Feelings. Song three: Why Are There So Many Feelings. Buried by the school garden is the band\'s lucky pick.', ['school_grounds', 'garden', L({ coins: 380, item: 'gift_vinyl_record' })]],
  ['frog', 'park', 'pond_edge', 'Frog diary', 'Day 1: pond. Day 2: pond. Day 3: ribbit. Day 4: still pond. Excellent life.'],
  ['band', 'park', 'bandstand', 'Pressed flower', 'A pressed sakura flower between two floorboards, with a tiny label: for the future.'],
  ['chess', 'park', 'chess_table', 'Chess note', 'The black queen has been missing since 2009. Look under the big sakura tree, where she retired.', ['park', 'sakura_tree', L({ coins: 500, item: 'gift_compass', sticker: 1 })]],
  ['swing', 'park', 'playground', 'Scribbled hearts', 'M + K = ... the rest has been furiously crossed out. Whoever wrote this has moved on to soccer.'],
  ['jar', 'harbour', 'pier_end', 'Message in a jar', 'Hello, sea. If you are reading this, you are not the sea. Hello anyway.'],
  ['mural', 'harbour', 'mural', 'Hidden cat', 'In the corner of the mural there is a tiny cat wearing a crown. It looks like Theo\'s signature.'],
  ['captain', 'harbour', 'boat', 'Captain\'s joke log', 'Why was the fish blushing? It saw the ocean\'s bottom. Terrible. I will use it again tomorrow. Treasure waits by the driftwood.', ['beach', 'driftwood', L({ coins: 420, item: 'min_ammonite', sticker: 1 })]],
  ['sand', 'beach', 'sandbar', 'Half-washed message', 'MEET ME AT LOW T... the rest is the sea\'s business.'],
  ['crabhat', 'beach', 'rocks', 'Tiny hat', 'A very small knitted hat on a rock. Crabs do not need hats, but here we are.'],
  ['starmark', 'cave', 'star_mark', 'Glow note', 'The star mark glows faintly when you whisper to it. Do not tell it your secrets, it gossips.'],
  ['pools', 'cave', 'pools', 'Wishes at the bottom', 'Coins in the pool, thrown by fish who wanted legs.'],
  ['ema', 'shrine', 'ema_board', 'Popular wish', 'An ema reads: Please let the bus be on time. It is signed by forty-one people.'],
  ['lookout', 'shrine', 'lookout', 'Carved in stone', 'Look up. Then look further up. Then go down the old path and dig where the roots remember.', ['shrine', 'forest_path', L({ coins: 480, item: 'gift_music_box', sticker: 2 })]],
  ['sandals', 'shrine', 'torii', 'Tiny sandals', 'Two tiny sandals, perfectly placed. Offerings from the spirit of a very small shoe.'],
  ['card', 'library', 'archive', 'Lost library card', 'Library card from 1962, borrowed: How to Be Invisible. Never returned. Presumably nobody noticed.'],
  ['exam', 'library', 'stacks', 'Answer sheet', 'Between two books, an exam sheet. Question four: I do not know. Question five: also no.'],
  ['bike', 'school_grounds', 'bike_rack', 'Self-ringing bell', 'A bike bell that rings on its own at night. Probably the wind. Probably.'],
  ['telescope', 'school_roof', 'telescope', 'Tape on the lens', 'Do not look at the sun. Ms. Fujita means it. She has a PowerPoint about it.'],
  ['gum', 'classroom', 'back', 'Under the desk', 'One hundred and three gum wads, forming a fossil record of boredom. Ask Rina to keep it quiet.'],
  ['hana', 'sunny_pines', 'garden_bench', 'Grandma\'s memo', 'Misa, if you find this, I hid the sweets under the... under the... oh, the garden bench, I think. Love, Hana (I think).', ['sunny_pines', 'garden_bench', L({ coins: 360, item: 'dish_starlight_mochi', sticker: 2 })]],
];
const MILES = [
  [5, 'A purse of 200 coins from the shrine', (g) => { g.addMoney(200); }],
  [10, 'Furniture: star garland', (g) => giveOr(g, 'furn_star_garland', 150)],
  [15, 'Title: Note Sleuth', (g) => title(g, 'Note Sleuth')],
  [20, 'Furniture: star lamp and the title Secret Seeker', (g) => { giveOr(g, 'furn_lamp_star', 250); title(g, 'Secret Seeker'); }],
  [25, 'Furniture: sea chest', (g) => giveOr(g, 'furn_sea_chest', 380)],
  [30, 'The title Hoshimori Detective, a star mobile and 5 Star Stickers', (g) => { title(g, 'Hoshimori Detective'); giveOr(g, 'furn_star_mobile', 300); stickers(g, 5, 'all secrets'); }],
];
function title(g, t) { (g.state.titles ||= []).includes(t) || g.state.titles.push(t); g.toast(`New title: ${t}`, 'i_star'); }
export const foundCount = (g) => Object.keys(S(g).secrets.found).length;
const spotName = (s) => s.replace(/_/g, ' ');
const nearSpot = (world, mapId, spot, r) => { if (world.map.id !== mapId) return null; const p = spotPos(mapId, spot); if (!p) return null; const d = Math.hypot(p.x - world.player.x, p.y - world.player.y); return d < r ? { p, d } : null; };

export function findNote(g, n) {
  const sc = S(g).secrets; if (sc.found[n[0]]) return null;
  sc.found[n[0]] = g.day; g.stat('secretsFound'); g.bus.emit('svNoteFound', { id: n[0] });
  const steps = [{ t: 'sfx', name: 'page' }, N(`You found a secret note: ${n[3]}.`), say(null, null, `"${n[4]}"`)];
  if (n[5]) { sc.maps[n[0]] = g.day; steps.push(say('misa', 'surprised', `A treasure map! Something is buried near ${spotName(n[5][1])} in ${(get('map', n[5][0]) || { name: n[5][0] }).name}. I should dig there.`)); }
  else steps.push(say('misa', 'happy', pickReact(n[0])));
  steps.push(call((gg) => { const c = foundCount(gg); for (const [need, , fn] of MILES) if (c >= need && !sc.claimed[need]) { sc.claimed[need] = 1; fn(gg); gg.toast(`${c} secret notes found!`, 'i_star'); gg.sfx('chime'); } }));
  return g.run(steps);
}
const REACT = ['Hehe. I did not expect that!', 'Hoshimori has so many little secrets.', 'I am keeping this one.', 'Somebody wrote this on purpose. I love it.', 'This town is weird in the best way.'];
const pickReact = (id) => REACT[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % REACT.length];
export function dig(g, n) {
  const sc = S(g).secrets, [, , loot] = n[5]; if (sc.dug[n[0]]) return null;
  sc.dug[n[0]] = g.day; g.stat('chestsDug');
  return g.run([{ t: 'sfx', name: 'select' }, N('You dig with a stick and your bare hands... clunk! A small buried chest!'), call((gg) => { gg.addMoney(loot.coins); const nm = loot.item && has(loot.item) ? (gg.give(loot.item, 1), get('item', loot.item).name) : 'a trinket'; if (loot.sticker) stickers(gg, loot.sticker, 'buried chest'); gg.toast(`Treasure: ${loot.coins} coins and ${nm}`, 'i_star'); gg.sfx('chime'); }), say('misa', 'happy', 'Pirate Misa strikes again!')]);
}
register('targetProvider', 'svl_secrets', {
  find(world, game) {
    const sc = S(game).secrets;
    for (const n of NOTES) { if (n[5] && sc.maps[n[0]] && !sc.dug[n[0]]) { const h = nearSpot(world, n[5][0], n[5][1], 16); if (h) return { label: 'Dig here', dist: h.d, x: h.p.x, y: h.p.y - 8, run: (g) => dig(g, n) }; } }
    for (const n of NOTES) { if (sc.found[n[0]]) continue; const h = nearSpot(world, n[1], n[2], 20); if (h) return { label: 'Look for secrets', dist: h.d + 5, x: h.p.x, y: h.p.y - 12, run: (g) => findNote(g, n) }; }
    return null;
  },
});
register('worldLayer', 'svl_secret_x', {
  below(g, world, game) {
    const sc = S(game).secrets;
    for (const n of NOTES) { if (!n[5] || !sc.maps[n[0]] || sc.dug[n[0]] || n[5][0] !== world.map.id) continue; const p = spotPos(n[5][0], n[5][1]); if (!p) continue; const x = world.sx(p.x), y = world.sy(p.y) - 6; g.fillStyle = '#7a4a3a'; for (let i = -4; i <= 4; i += 2) { g.fillRect(x + i - 1, y + i - 1, 3, 3); g.fillRect(x + i - 1, y - i - 1, 3, 3); } g.fillStyle = '#c98a5a'; g.fillRect(x - 1, y - 1, 3, 3); }
  },
});
register('phoneApp', 'sv_notes', {
  name: 'Notes', icon: 'i_mail', order: 61,
  badge: (g) => Object.keys(S(g).secrets.found).filter((k) => !g.state.seen['svn:' + k]).length,
  open(game, app) { app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(NOTES.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.wheel) st.sel = Math.max(0, Math.min(NOTES.length - 1, st.sel + Math.sign(input.wheel)));
    const top = Math.max(0, Math.min(NOTES.length - 15, st.sel - 7));
    if (input.justDown) { const i = Math.floor((input.my - app.area.y - 12) / 10) + top; if (input.mx < app.area.x + 112 && i >= 0 && i < NOTES.length) st.sel = i; }
    if (S(game).secrets.found[NOTES[st.sel][0]]) game.state.seen['svn:' + NOTES[st.sel][0]] = 1;
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, sc = S(game).secrets, top = Math.max(0, Math.min(NOTES.length - 15, st.sel - 7));
    drawText(g, `FOUND ${foundCount(game)}/30`, x + 2, y + 2, UI.accent2, 1, null);
    NOTES.slice(top, top + 15).forEach((n, r) => { const i = top + r, yy = y + 12 + r * 10, f = sc.found[n[0]]; if (i === st.sel) rect(g, UI.gold, x, yy - 1, 112, 10); drawText(g, f ? `${i + 1}. ${n[3]}`.slice(0, 21) : `${i + 1}. ???`, x + 2, yy, f ? UI.ink : UI.dim, 1, null); if (n[5] && f) rect(g, sc.dug[n[0]] ? UI.good : UI.bad, x + 106, yy + 1, 4, 5); });
    panel(g, x + 116, y, w - 116, h, 'paper');
    const n = NOTES[st.sel], f = sc.found[n[0]];
    if (!f) { drawText(g, 'NOT FOUND YET', x + 122, y + 6, UI.dim, 1, null); wrap(`Hint: look for secrets around ${(get('map', n[1]) || { name: n[1] }).name}, near the ${spotName(n[2])}.`, 32).forEach((l, i) => drawText(g, l, x + 122, y + 20 + i * 8, UI.ink, 1, null)); }
    else {
      drawText(g, n[3].toUpperCase(), x + 122, y + 6, UI.accent2, 1, null);
      wrap(n[4], 32).slice(0, 12).forEach((l, i) => drawText(g, l, x + 122, y + 18 + i * 8, UI.ink, 1, null));
      if (n[5]) drawText(g, sc.dug[n[0]] ? 'TREASURE DUG UP' : `DIG NEAR: ${spotName(n[5][1]).toUpperCase()}`.slice(0, 32), x + 122, y + h - 10, sc.dug[n[0]] ? UI.good : UI.bad, 1, null);
    }
    const nx = MILES.find(([need]) => foundCount(game) < need);
    drawText(g, nx ? `NEXT REWARD AT ${nx[0]} NOTES` : 'ALL REWARDS CLAIMED', x + 2, y + h - 10, UI.dim, 1, null);
  },
});

features('Town Life', [
  'Thirty secret notes hidden around the maps, found with Look for secrets at named spots (yard, lane, town, park, harbour, beach, cave, shrine, library, school and more)',
  'Each note has a short funny or lore text, from Goro\'s tomato secrets to a self-ringing bike bell',
  'Six notes are treasure maps that mark a faint X on the ground where a chest is buried',
  'Dig here at an X to unearth a chest with coins, a rare item and Star Stickers',
  'Notes phone app lists found notes, gives hints for missing ones and marks which treasure maps were dug up',
  'Finding 5, 10, 15, 20, 25 and 30 notes unlocks coins, furniture and the titles Note Sleuth, Secret Seeker and Hoshimori Detective',
]);
