// Side quests and the waystone network. A quest is plain data: who gives it, what steps it takes
// (have an item, kill something, reach a place), and the reward. Dialogue for offering, chasing
// and handing in is generated from the data, so adding a quest is adding an entry.
import { ITEMS } from './items.js';

const hyp = Math.hypot;
const L = (text, o = {}) => ({ text, ...o });
const nameOf = (id) => ITEMS[id]?.name || id;

export const QUESTS = [
  { id: 'q_cael', giver: 'tolliver', title: 'Red Cael\'s toll', xp: 120,
    offer: ['Bandits took the harvest money and the ox with it. Their chief is a man called Red Cael, holed up in the Mirewood, west of the road.', 'End him and I will make it worth your while. I have little, but I am honest with it.'],
    steps: [{ type: 'kill', ids: ['cael'], text: 'Kill Red Cael in the bandit camp (Mirewood, west)' }],
    done: ['You did it? Then the road is a little safer. Take this, and thank you.'], reward: { gold: 90, items: [['hexbane', 1]] } },
  { id: 'q_bloom', giver: 'maren', title: 'A flower for the dead', xp: 90,
    offer: ['My mother is buried out in Blackfen and I have never seen her grave. They say a pale flower blooms at the drowned shrine, only after dark.', 'Bring me a Nightbloom and I will give you what I saved.'],
    steps: [{ type: 'have', item: 'nightbloom', n: 1, text: 'Find a Nightbloom at the drowned shrine (Blackfen, south-west)' }],
    done: ['It is real. Oh... thank you. Here, it is not much.'], reward: { gold: 60, items: [['potion', 2]] }, take: [['nightbloom', 1]] },
  { id: 'q_bandits', giver: 'wulf', title: 'Thin the herd', xp: 100,
    offer: ['Bandits have been snaring my deer and hanging my dogs. Four of their number dead would cool them off.', 'Do it however you like. Just do not lead them back to my door.'],
    steps: [{ type: 'kill', role: 'bandit', n: 4, text: 'Kill four bandits' }],
    done: ['Four. Good. Now the forest can breathe. Take these.'], reward: { gold: 70, items: [['lockpick', 3]] } },
  { id: 'q_diary', giver: 'sable', title: 'Ash for the pyre', xp: 110,
    offer: ['You have the look of a thief who owes something to a dark thing. I can tell.', 'In Cinderwick there was a house where a woman kept a diary. The pages hold a name I need. Bring me the charred diary.'],
    steps: [{ type: 'have', item: 'diary', n: 1, text: 'Find the charred diary in the ruins of Cinderwick (east)' }],
    done: ['Yes... that is her hand. And the name. Take this, and keep away from the letter.'], reward: { gold: 40, items: [['hexbane', 2]], ember: 20 }, take: [['diary', 1]] },
  { id: 'q_ring', giver: 'ilse', title: 'A ring for Joran', xp: 100,
    offer: ['Everyone died here. Everyone but me. My husband Joran is in the pit at the plague ward, with his ring still on his hand.', 'Bring me that ring and I will tell you where the hollows come from.'],
    steps: [{ type: 'have', item: 'ring', n: 1, text: 'Dig through the mass grave in the plague ward for Joran\'s ring' }],
    done: ['His ring. I can leave now. Listen: the hollows rise where the bell tolls thirteen. It is the letter that rings it.'], reward: { gold: 60 }, take: [['ring', 1]], flags: { ilseTold: true } },
  { id: 'q_stones', giver: 'hermit', title: 'The four lights', xp: 200,
    offer: ['Four old stones stand along these roads. Touch each one and they will remember you. A lit stone will carry you to any other lit stone.', 'A hermit has to have some fun. Light them all and come tell me.'],
    steps: [{ type: 'lit', n: 4, text: 'Touch all four waystones (road, Mirewood, Cinderwick, gallows)' }],
    done: ['They sing when you pass. That is the sound of old magic waking. Take a little of it.'], reward: { gold: 50, ember: 30 } },
  { id: 'q_parcel', giver: 'gil', to: 'brandt', title: 'Gil\'s parcel', xp: 60, give: [['parcel', 1]],
    offer: ['I have a parcel for Brandt the smith in Ashgate. Payment on delivery, only I am not walking past those bandits again.', 'Carry it for me. Do not open it. It rattles, which I take as a bad sign.'],
    steps: [{ type: 'have', item: 'parcel', n: 1, text: 'Deliver the parcel to Brandt the smith in Ashgate' }],
    done: ['Ah. The parcel. From Gil. Of course it is. Here, for the trouble.'], reward: { gold: 40 }, take: [['parcel', 1]], hintNpc: 'brandt', immediate: true },
  { id: 'q_hollows', giver: 'ilse', title: 'Put them down', xp: 160, requires: 'q_ring',
    offer: ['You are still here. Good. The hollows in the ash used to be neighbours. I cannot do it myself.', 'Put five of them down, and I will give you what my husband left me.'],
    steps: [{ type: 'kill', role: 'hollow', n: 5, text: 'Put down five hollows' }],
    done: ['Five. It is not enough. It will never be enough. But thank you.'], reward: { gold: 80, items: [['gem', 1]] } },
  { id: 'q_wine', giver: 'gorm', title: 'A better vintage', xp: 60,
    offer: ['My cellar is dry and the merchants will not come past the bandits. Bring me two bottles of wine and drinks are on the house for life.', 'Bandits love their wine. Look in their supply crates.'],
    steps: [{ type: 'have', item: 'wine', n: 2, text: 'Bring Old Gorm two bottles of wine (bandit supply crate?)' }],
    done: ['Ha! Real wine! Take this, and drink whenever you like. Do not tell the mercenary.'], reward: { gold: 45, items: [['potion', 1]] }, take: [['wine', 2]] },
  { id: 'q_cheese', giver: 'hilde', title: 'Cheese for the bake', xp: 50,
    offer: ['Bread is nothing without cheese, and cheese has vanished from Ashgate. Bring me two rounds and I will pay in coin and warm loaves.', 'Farms have cheese. Farms always have cheese.'],
    steps: [{ type: 'have', item: 'cheese', n: 2, text: 'Bring Baker Hilde two rounds of cheese (farms?)' }],
    done: ['Two! You beauty. Here, and take a loaf for the road.'], reward: { gold: 30, items: [['bread', 2]] }, take: [['cheese', 2]] },
  { id: 'q_grave', giver: 'tobbe', title: 'Those who do not stay buried', xp: 90,
    offer: ['They will not stay down, hooded one. Three of them dug their way out of the north row last night.', 'End them for good, and take the mausoleum key I hold. It opens more than a mausoleum.'],
    steps: [{ type: 'kill', role: 'hollow', n: 3, text: 'Put down three hollows' }],
    done: ['Three. My old back thanks you. Here, and mind the dark.'], reward: { gold: 50, items: [['hexbane', 1]] } },
  { id: 'q_snares', giver: 'wulf', title: 'Set the snares', xp: 80, requires: 'q_bandits',
    offer: ['You did well with the bandits. Here is a harder job.', 'Set a bear trap on the trail near their camp and let two of them find it. Snare them; I will hear the screaming from here.'],
    steps: [{ type: 'stat', key: 'traps', n: 2, text: 'Catch two people in traps' }],
    done: ['I heard them. You have a nasty streak, friend. I like it.'], reward: { gold: 60, items: [['beartrap', 2]] }, give: [['beartrap', 2]] },
  { id: 'q_brew', giver: 'sable', title: 'A draught for the dark', xp: 100, requires: 'q_diary',
    offer: ['Since you are so good at fetching, brew me a Night Eye draught. Nightbloom and Hexwort, ground fresh.', 'Bring it back untouched.'],
    steps: [{ type: 'have', item: 'd_night', n: 1, text: 'Brew a Draught of Night Eye (Crafting tab)' }],
    done: ['Yes. Now you can see what I see. Keep the coin; I keep the draught.'], reward: { gold: 70, items: [['d_ghost', 1]] }, take: [['d_night', 1]] },
  { id: 'q_bogs', giver: 'gil', title: 'Bogcap for oil', xp: 60,
    offer: ['Lamps burn oil and oil comes from bogcap. The fen has plenty and I have no boots for it.', 'Bring me four and I will pay in oil and coin.'],
    steps: [{ type: 'have', item: 'h_bog', n: 4, text: 'Gather four Bogcap in Blackfen' }],
    done: ['Four! Oil for a month. Here you are.'], reward: { gold: 35, items: [['oil', 3]] }, take: [['h_bog', 4]] },
  { id: 'q_lore', giver: 'hermit', title: 'The scholar\'s notes', xp: 120, requires: 'q_stones',
    offer: ['I collected writings once. They are scattered now. Read eight of them for me and tell me they were not all nonsense.', 'The truth is in the total, not in any one page.'],
    steps: [{ type: 'lorecount', n: 8, text: 'Read eight writings (Lore tab)' }],
    done: ['Eight. Then you know what I know. Take my old ring; it never helped me.'], reward: { gold: 40, items: [['signet', 1]] } },
  { id: 'q_toll', giver: 'bosk', title: 'The smuggler\'s fee', xp: 80,
    offer: ['Every wagon pays at my bridge. The last carter refused and now my strongbox is light. I want that carter\'s goods back, and I do not care whose back they are on.', 'Look in the wrecked wagon on the road north of here. Bring me what is in the crate.'],
    steps: [{ type: 'have', item: 'potion', n: 1, text: 'Find the wrecked wagon crate on the Old Road' }],
    done: ['That is the carter\'s stock. Fine. I never saw you.'], reward: { gold: 45 }, take: [['potion', 1]] },
];

export class Quests {
  constructor(g) {
    this.g = g; this.state = {}; this.lit = new Set(); this.kills = { role: {}, id: new Set() }; this.t = 0;
  }
  def(id) { return QUESTS.find((q) => q.id === id); }
  status(id) { return this.state[id]?.status || 'new'; }
  active() { return QUESTS.filter((q) => this.status(q.id) === 'active' || this.status(q.id) === 'ready'); }
  accept(id) {
    const q = this.def(id); if (!q || this.state[id]) return;
    this.state[id] = { status: 'active', step: 0, count: 0, killBase: { ...this.kills.role }, statBase: { ...this.g.stats } };
    for (const [it, n] of q.give || []) this.g.player.inv.add(it, n);
    const s = this.g.story;
    s.objectives.push({ id, text: q.title + ': ' + q.steps[0].text, sub: q.offer[0], done: false, side: true, target: () => this.targetOf(q) });
    this.g.toast('New quest: ' + q.title); this.g.sfx.bell?.(1);
  }
  targetOf(q) {
    const st = this.state[q.id]; if (!st) return null;
    if (st.status === 'ready') { const n = this.g.npcs.find((x) => x.id === (q.to || q.giver)); return n ? [n.x, n.z] : null; }
    const step = q.steps[st.step], P = this.g.level.pois;
    if (step.type === 'kill' && step.ids) { const n = this.g.npcs.find((x) => x.id === step.ids[0] && !x.dead); return n ? [n.x, n.z] : null; }
    if (step.type === 'kill' && step.role) { let best = null, bd = 1e9; for (const n of this.g.npcs) if (n.role === step.role && !n.dead && n.dist < bd) { bd = n.dist; best = n; } return best ? [best.x, best.z] : null; }
    if (q.hintNpc) { const n = this.g.npcs.find((x) => x.id === q.hintNpc); if (n) return [n.x, n.z]; }
    if (q.hint) return q.hint;
    return { q_bloom: [-190, -228], q_diary: [162, 66], q_ring: [196, 122], q_stones: [5, -83], q_toll: [-6, -60] }[q.id] || null;
  }
  onKill(n) {
    this.kills.role[n.role] = (this.kills.role[n.role] || 0) + 1; this.kills.id.add(n.id);
  }
  light(name) {
    if (this.lit.has(name)) return false; this.lit.add(name);
    this.g.ui.flashBanner('WAYSTONE ATTUNED', 1800, true); this.g.sfx.bellNote?.(0); this.g.sfx.veil?.();
    this.g.player.ember = this.g.player.maxEmber ?? Math.max(this.g.player.ember, 100);
    this.g.setCheckpoint(this.g.player.pos, this.g.player.yaw);
    return true;
  }
  update(dt) {
    if (this.tf > 0) { this.tf -= dt * 1.8; this.g.pix.fade = Math.max(0, this.tf); }
    this.t -= dt; if (this.t > 0) return; this.t = 0.4;
    const g = this.g, inv = g.player.inv;
    for (const q of QUESTS) {
      const st = this.state[q.id]; if (!st || st.status !== 'active') continue;
      const step = q.steps[st.step]; let ok = false;
      if (step.type === 'have') ok = inv.count(step.item) >= (step.n || 1);
      else if (step.type === 'kill') ok = step.ids ? step.ids.every((i) => this.kills.id.has(i)) : (this.kills.role[step.role] || 0) - (st.killBase[step.role] || 0) >= (step.n || 1);
      else if (step.type === 'lit') ok = this.lit.size >= (step.n || 1);
      else if (step.type === 'stat') ok = (g.stats[step.key] || 0) - (st.statBase?.[step.key] || 0) >= (step.n || 1);
      else if (step.type === 'lorecount') ok = [...g.story.notesFound].filter((x) => x.startsWith('l_')).length >= (step.n || 1);
      else if (step.type === 'reach') { const p = g.level.pois[step.poi]; ok = !!p && hyp(p.x - g.player.pos[0], p.z - g.player.pos[2]) < (step.r || 4); }
      if (ok) {
        st.step++;
        const o = g.story.objectives.find((x) => x.id === q.id);
        if (st.step >= q.steps.length) { st.status = 'ready'; if (o) { o.text = q.title + ': return to ' + (g.npcs.find((n) => n.id === (q.to || q.giver))?.name || 'the giver'); } g.toast(q.title + ': return to the quest giver'); g.sfx.coin?.(); }
        else if (o) o.text = q.title + ': ' + q.steps[st.step].text;
      }
    }
  }
  turnIn(id) {
    const q = this.def(id), st = this.state[id]; if (!q || !st || st.status !== 'ready') return;
    st.status = 'done'; const g = this.g, inv = g.player.inv;
    for (const [it, n] of q.take || []) inv.remove(it, n);
    if (q.reward?.gold) inv.add('gold', q.reward.gold);
    for (const [it, n] of q.reward?.items || []) inv.add(it, n);
    if (q.reward?.ember) g.player.maxEmber = (g.player.maxEmber || 100) + q.reward.ember;
    if (q.flags) Object.assign(g.story.flags, q.flags);
    const o = g.story.objectives.find((x) => x.id === id); if (o) o.done = true;
    g.progress?.addXp(q.xp || 60, q.title);
    g.ui.flashBanner('QUEST COMPLETE', 2000, true); g.sfx.coin?.();
    g.toast(`${q.reward?.gold ? '+' + q.reward.gold + ' gold ' : ''}${(q.reward?.items || []).map(([i, n]) => '+' + n + ' ' + nameOf(i)).join(' ')}`);
  }
  // dialogue lines for an NPC that gives quests (null when none apply)
  dialogue(npc) {
    const mine = QUESTS.filter((q) => q.giver === npc.id && !(q.requires && this.status(q.requires) !== 'done'));
    const turn = QUESTS.filter((q) => q.to === npc.id && this.status(q.id) === 'ready');
    for (const q of turn) return [...q.done.slice(0, -1).map((t) => L(t)), L(q.done[q.done.length - 1], { end: true, onShow: (G) => G.quests.turnIn(q.id) })];
    for (const q of mine) if (this.status(q.id) === 'ready' && !q.to) return [...q.done.slice(0, -1).map((t) => L(t)), L(q.done[q.done.length - 1], { end: true, onShow: (G) => G.quests.turnIn(q.id) })];
    for (const q of mine) if (this.status(q.id) === 'active' || (this.status(q.id) === 'ready' && q.to)) return [L(`${q.title}: ${q.steps[this.state[q.id].step].text}. Have you done it yet?`, { end: true })];
    for (const q of mine) if (this.status(q.id) === 'new') return [
      ...q.offer.slice(0, -1).map((t) => L(t)),
      L(q.offer[q.offer.length - 1], { choices: [{ text: 'I will do it.', next: 'end', action: (G) => G.quests.accept(q.id) }, { text: 'Not now.', next: 'end' }] }),
    ];
    return null;
  }
  // waystone menu: travel to any attuned stone
  waystone(name) {
    const g = this.g, first = this.light(name);
    const stones = { ws_road: ['The Old Road', [5, 0.1, -87]], ws_mire: ['The Mirewood', [-70, 0.1, -97]], ws_cinder: ['Cinderwick', [118, 0.1, 2]], ws_gallows: ['Hangman\'s Hill', [208, 0.1, 169]] };
    const dests = [...this.lit].filter((k) => k !== name && stones[k]);
    const lines = [L(first ? 'The stone hums against your palm. It knows you now.' : 'The stone is warm. Somewhere, its siblings answer.', dests.length ? { choices: [...dests.map((k) => ({ text: `Travel to ${stones[k][0]} (${Math.round(Math.hypot(stones[k][1][0] - g.player.pos[0], stones[k][1][2] - g.player.pos[2]))} m)`, next: 'end', action: (G) => G.quests.travel(stones[k][1]) })), { text: 'Stay.', next: 'end' }] } : { end: true })];
    g.ui.dialogue({ lines, name: 'Waystone', spec: { outfit: 'hollow', skin: 'ashen', hair: { style: 'bald' }, glowEyes: true } });
  }
  travel(pos) {
    const g = this.g, P = g.player;
    g.pix.fade = 1; this.tf = 1.2; g.sfx.veil?.();
    P.cc.position = [pos[0], pos[1], pos[2] + 2]; P.cc.velocity = [0, 0, 0];
    g.setCheckpoint(P.cc.position, P.yaw);
    g.ui.toast('The stones carry you');
    for (const n of g.npcs) if (n.guard && !n.dead && (n.state === 'chase' || n.state === 'attack')) { n.loseTrack(); }
  }
}
