// Sleepovers in the guest room: pick a friend (3+ hearts) in the evening, share a night scene, sleep, and wake up to a
// morning scene with breakfast. Pets and guests react to each other. Read by nothing else; sv3_hearts' group sleepover is separate.
import { register, get, all, features } from '../../core/registry.js';
import { SV, say, N, call } from './data.js';
import { isBuilt } from './reno.js';

const FRIENDS = ['kai', 'suzu', 'rina', 'theo', 'hina', 'aoi', 'haru', 'sora', 'momo'];
const NIGHT = {
  kai: ['We built a blanket fort and argued about whether goalkeepers or strikers are cooler. (Strikers. Obviously.)', 'kai/happy|Your guest room is better than my whole house. Do not tell my mum.'],
  suzu: ['We stayed up reading each other the first lines of stories until we ran out of candles... and then used a torch.', 'suzu/happy|I wrote four pages tonight. This house is good for the soul.'],
  rina: ['Rina inspected the guest bed corners like a hotel inspector, then confessed she is a little nervous about sleepovers.', 'rina/happy|Fine. This is... nice. Do not tell anyone I said that.'],
  theo: ['Theo sketched Mochi from the doorway while I read. Neither of us said much. It was perfect.', 'theo/happy|Good quiet. Thank you for the quiet.'],
  hina: ['Hina told me every bug that might live in the walls. Then she told me they are all friendly. Then I could not sleep, happily.', 'hina/happy|It is so peaceful! I can hear a cricket!'],
};
const GENERIC = ['We shared snacks, swapped secrets and laughed until the neighbours probably heard.', 'It felt like the house finally had enough people in it.'];
export const candidates = (g) => FRIENDS.filter((id) => get('npc', id) && g.hearts(id) >= 3 && (SV(g).guest.stays[id] || -9) < g.day - 2);

export function stayOverSteps(g) {
  if (!isBuilt(g, 'guest')) return [N('The bed has no sheets yet.')];
  if (g.minutes < 17 * 60) return [say('misa', 'neutral', 'Sleepovers are an evening thing. Come back after five.')];
  const who = candidates(g).sort((a, b) => g.hearts(b) - g.hearts(a)).slice(0, 5);
  if (!who.length) return [say('misa', 'neutral', 'I need a friend with 3 hearts who has not stayed in the last few days. Time to hang out more!')];
  return [{ t: 'choice', prompt: 'Who stays over?', options: [...who.map((id) => ({ text: get('npc', id).name, steps: [call((gg) => gg.run(nightSteps(gg, id)))] })), { text: 'Not tonight', steps: [] }] }];
}
function nightSteps(g, id) {
  const n = get('npc', id), lines = NIGHT[id] || GENERIC, cat = g.mochi && g.state.mochi;
  const steps = [N(`${n.name} arrives with a sleeping bag and a bag of snacks.`), { t: 'fade', to: 1, dur: 0.5 }, { t: 'wait', dur: 0.5 }, { t: 'fade', to: 0, dur: 0.5 }];
  for (const l of lines) { const m = /^(\w+)\/(\w+)\|(.*)$/.exec(l); steps.push(m ? say(m[1], m[2], m[3]) : N(l)); }
  const pets = Object.keys(SV(g).pets);
  if (cat) steps.push(N(pets.includes('azuki') ? 'Azuki flops across everyone\'s feet while Mochi watches from the shelf with great dignity.' : 'Mochi curls up on the guest pillow as if she planned the whole thing.'));
  steps.push(call((gg) => { SV(gg).guest.stays[id] = gg.day; SV(gg).guest.morning = id; gg.addFriend(id, 30); gg.addMood(10); gg.stat('sleepovers'); gg.stat('hangouts'); gg.bus.emit('sleepoverHeld', { npc: id }); }),
    { t: 'time', add: 120 }, call((gg) => { setTimeout(() => gg.sleep(), 0); }));
  return steps;
}
function morningSteps(g, id) {
  const n = get('npc', id), who = n ? n.name : 'Your friend';
  const food = Object.keys(g.state.inv).find((i) => (get('item', i) || {}).cat === 'food' && ((get('item', i) || {}).tags || []).includes('dish') && g.has(i));
  return [N(`Morning light through the guest room curtains. ${who} is already awake, hair like a haystack.`), say(id, 'happy', 'Good morning! I slept so well. Is that toast I smell? ...No? Is it going to be toast?'),
    { t: 'choice', prompt: 'Breakfast?', options: [
      ...(food ? [{ text: `Share ${get('item', food).name}`, steps: [call((gg) => { gg.take(food, 1); gg.addFriend(id, 20); gg.addMood(8); }), say(id, 'happy', 'You made this?! Best sleepover ever.')] }] : []),
      { text: 'Toast and tea', steps: [call((gg) => { gg.addFriend(id, 8); gg.addMood(4); }), say(id, 'happy', 'Perfect. Toast fixes everything.')] },
      { text: 'Pancakes from the cafe, my treat', when: 'money>=60', steps: [call((gg) => { gg.spend(60); gg.addFriend(id, 14); gg.addMood(6); }), say(id, 'happy', 'Pancakes! You are spoiling me.')] },
    ] },
    say('misa', 'happy', 'Thanks for staying. The house feels fuller when you are in it.'), N(`${who} waves from the garden gate. The guest room smells a little like sleepover.`)];
}
register('system', 'sv4_guest', { init(game) {
  game.bus.on('dayStart', () => { const s = SV(game).guest; if (s.morning) { s.pending = s.morning; s.morning = null; } });
} });
register('worldTick', 'sv4_guest_morning', { update(dt, world, game) {
  const s = game.state.sv4_home && game.state.sv4_home.guest;
  if (!s || !s.pending || world.map.id !== 'home' || game.scenes.top !== world || world.busy) return;
  const id = s.pending; s.pending = null; game.run(morningSteps(game, id));
} });
void all;
features('Home & Pets', [
  'Sleepovers: invite a friend with 3 hearts to the guest room in the evening for a night scene, then sleep',
  'The morning after a sleepover: your guest wakes up and you choose a breakfast (share a dish, toast and tea, or treat them to pancakes)',
  'Guests and pets react to each other during the sleepover night scene',
]);
