// Reputation (Helpful, Studious, Quirky, Dependable, Charming) and passive personality growth. Effects: shop rebates and who greets Misa first.
import { register, get } from '../../core/registry.js';
import { S, REPS, repTier, repScore, addRep, addTrait, nameOf, traitScore } from './state.js';

export const GREETERS = {
  helpful: ['mika', 'sachiko', 'pip', 'hana', 'momo'],
  studious: ['suzu', 'rina', 'fujita', 'haru'],
  quirky: ['hina', 'theo', 'kiko', 'sora', 'aoi'],
  dependable: ['ogawa', 'goro', 'tobias', 'jun'],
  charming: ['kai', 'hana', 'mika', 'momo'],
};
export const REP_TEXT = {
  helpful: 'Mart and post office prices drop 2% per tier. Kind neighbours greet you first.',
  studious: 'Bookish friends greet you first, and teachers trust you with more.',
  quirky: 'Odd and artistic friends greet you first. Funny rumors about you spread faster.',
  dependable: 'Cafe and harbour prices drop 2% per tier. Promises last longer in memory.',
  charming: 'Every shop gives back 3% per tier. Cheerful friends greet you first.',
};
export function rebatePct(g, shop) {
  let p = repTier(g, 'charming') * 0.03;
  if (shop === 'mart' || shop === 'post') p += repTier(g, 'helpful') * 0.02;
  if (shop === 'cafe' || shop === 'bait' || shop === 'fishmarket') p += repTier(g, 'dependable') * 0.02;
  return p;
}
// who would greet Misa first on this map? -> npc id or null (deterministic per day and map)
export function firstGreeter(g, present) {
  const best = REPS.map((c) => [c, repTier(g, c)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  for (const [c] of best) {
    const who = GREETERS[c].filter((id) => present.includes(id) && get('npc', id));
    if (who.length) return { npc: who[Math.floor(g.rngFor('sv4dgreet:' + c)() * who.length) % who.length], cat: c };
  }
  return null;
}

register('system', 'sv4dRep', {
  init(game) {
    const on = (ev, fn) => game.bus.on(ev, (e) => { try { fn(e || {}); } catch (err) { /* never break the host event */ } });
    // reputation
    on('questDone', () => addRep(game, 'helpful', 2));
    on('svOrderDone', () => addRep(game, 'helpful', 1));
    on('jobShift', () => addRep(game, 'dependable', 1));
    on('skillUp', (e) => { if (e.skill === 'study' || e.id === 'study') addRep(game, 'studious', 2); });
    on('classAttended', () => addRep(game, 'studious', 1));
    on('bugCaught', () => addRep(game, 'quirky', 0.5));
    on('collectNew', () => addRep(game, 'quirky', 0.3));
    on('festivalAttend', () => addRep(game, 'charming', 1));
    on('heartUp', () => addRep(game, 'charming', 0.5));
    on('gift', (e) => { if (e.reaction === 'love') addRep(game, 'charming', 0.5); });
    // traits
    on('gift', (e) => { if (e.reaction === 'love' || e.reaction === 'like') addTrait(game, 'kind', 0.4); });
    on('itemUsed', (e) => { const it = e.item && get('item', e.item); if (it && it.cat === 'book') addTrait(game, 'curious', 0.5); });
    on('collectNew', () => addTrait(game, 'curious', 0.3));
    on('fishCaught', () => addTrait(game, 'calm', 0.2));
    on('sleep', () => addTrait(game, 'calm', 0.15));
    on('mapEnter', (e) => {
      const m = (game.world && game.world.map && game.world.map.id) || e.map;
      if (['cave', 'lighthouse', 'shrine'].includes(m) && game.minutes >= 20 * 60) { const s = S(game); if (s.seen.brave !== game.day) { s.seen.brave = game.day; addTrait(game, 'brave', 0.5); } }
    });
    // shop discounts
    on('shopBuy', (e) => {
      if (!e.cost) return;
      const n = Math.round(e.cost * rebatePct(game, e.shop));
      if (n > 0) { game.addMoney(n, true); game.toast(`Reputation discount: ${n} coins back`, 'coin'); }
    });
    // greeting: someone present says hello first
    game.bus.on('mapEnter', () => setTimeout(() => {
      try {
        if (!game.world || !game.world.npcs) return;
        const present = Object.values(game.world.npcs).filter((n) => n.present && n.def && !n.def.hidden && game.state.seen['met:' + n.id]).map((n) => n.id);
        const s = S(game), r = firstGreeter(game, present.filter((id) => s.greeted[id] !== game.day));
        if (!r) return;
        s.greeted[r.npc] = game.day;
        const n = game.world.npcs[r.npc]; n.say('heart', 2.5);
        game.toast(`${nameOf(r.npc)} greets you first (${r.cat})`, 'heart');
        game.stat('sv4dGreetings');
      } catch (err) { /* cosmetic */ }
    }, 900));
  },
});
export { traitScore, repScore };
