// Confessions (sv4_romance): the stages acquaintance > crush > close friend > confession > dating > steady.
// From "close friend" (350 affection) Misa can confess from the Romance app (K). At 600 it is returned; earlier it becomes a kind
// "not yet" and the two stay friends. At 800 a friend may confess first, in the evening, when Misa talks to them. Either way Misa
// can say yes, ask for time, or stay friends, and nobody is punished. Console: __misa.sv4r.confess('kai','misa'|'them').
import { register, get } from '../../core/registry.js';
import { sc, ch, flag, fade, backdrop, time, mood } from '../social/util.js';
import { S, API, A, call, noteSeen, rec, aff, stageOf, startDating, stayFriends, stepBack, setCooldown, firstName, nameOf, isCand, addAff, candidates } from './core.js';
import { voiceOf } from './voices.js';

export const CONF_COND = { kai: 'time>=16:00&time<20:00', suzu: 'time>=16:00', rina: 'time>=15:30&!weather:storm', theo: 'time>=17:00', hina: 'time>=16:00&!weather:storm' };
export const THEY_AT = 800, MISA_AT = 350, YES_AT = 600;

export function canConfess(g, id) {
  const s = S(g), st = stageOf(g, id);
  if (!isCand(id) || s.partner) return s.partner === id ? 'dating' : 'taken';
  if (st === -1) return 'friends';
  if (aff(g, id) < MISA_AT) return 'early';
  return null;
}
export const theyReady = (g, id) => {
  const s = S(g);
  return isCand(id) && !s.partner && stageOf(g, id) === 3 && aff(g, id) >= THEY_AT && (s.cool[id] || 0) <= g.day;
};

function finish(g, id, by, accepted, kind) {
  noteSeen(g, `conf_${id}_${by}`, accepted ? `${firstName(id)} and I: ${by === 'them' ? 'their confession' : 'my confession'}` : `${firstName(id)}: just friends`, id);
  g.stat('confessions');
  g.bus.emit('confessed', { npc: id, by, accepted, kind: kind || (accepted ? 'yes' : 'friends') });
}

export function confessSteps(g, id, who) {
  const v = voiceOf(id), c = v.conf, nm = firstName(id);
  const yesBranch = [...c.yes, c.hold ? `@${c.hold.replace(/^@/, '')}` : null, call((gg) => { startDating(gg, id, who); finish(gg, id, who, true, 'yes'); }), A(id, 0)];
  const open = [fade(1, 0.5), backdrop(c.bd), fade(0, 0.5), ...c.setup];
  const close = [backdrop(null), mood(12), time(40)];
  if (who === 'them') {
    return sc(id, ...open, ...c.them,
      ch(`${nm} waits for your answer.`,
        ['I like you too', ...yesBranch, rec(`conf_${id}_them`, 'I like you too')],
        ['Can I have a little time?', ...c.wait, call((gg) => { setCooldown(gg, id, 21); finish(gg, id, 'them', false, 'wait'); }), rec(`conf_${id}_them`, 'A little time')],
        ['I would rather stay friends', ...c.friends, call((gg) => { stayFriends(gg, id); finish(gg, id, 'them', false, 'friends'); }), rec(`conf_${id}_them`, 'Stay friends')]),
      ...close);
  }
  return sc(id, ...open,
    '>sad|Hey. Do you have a minute? I have something to say, and it is a little scary.',
    ch('How do you say it?',
      ['Say it straight', '>happy|I like you. Not only as a friend. I think about you a lot, and I wanted you to know.', A(id, 8), rec(`conf_${id}_misa`, 'Said it straight')],
      ['Give them a small handmade gift first', '@You hold out a little folded paper charm with a heart drawn on it. Your hands are shaking.', '>happy|This is for you. And, um... I like you. A lot.', A(id, 12), rec(`conf_${id}_misa`, 'A handmade gift')],
      ['Ask them to guess', '>surprised|Can you guess what I want to say? ...It is that I like you.', A(id, 5), rec(`conf_${id}_misa`, 'Asked them to guess')]),
    ...c.ask,
    iff2((gg) => aff(gg, id) >= YES_AT, yesBranch, [...c.notyet, call((gg) => { stayFriends(gg, id); finish(gg, id, 'misa', false, 'notyet'); })]),
    ...close);
}
const iff2 = (cond, then, els) => ({ t: 'if', cond, then: sc('misa', ...then), else: sc('misa', ...els) });

// ---------- compliments (flirt-lite): once a day per person ----------
export function complimentSteps(g, id) {
  const v = voiceOf(id), cp = v.compliment;
  return sc(id, { t: 'soc_face', who: id }, '*heart',
    ch(cp.prompt, ...cp.opts.map(([text, reply, pts]) => [`${text}`, `>happy|${text}.`, reply, A(id, pts), rec(`compliment_${id}`, text)])),
    call((gg) => { S(gg).flirt[id] = gg.day; gg.stat('compliments'); gg.addMood(3); }));
}
export const canCompliment = (g, id) => isCand(id) && g.hearts(id) >= 2 && S(g).flirt[id] !== g.day;

// ---------- stepping back, kindly ----------
export function stepBackSteps(g) {
  const id = S(g).partner;
  if (!id) return [{ t: 'say', who: 'misa', mood: 'neutral', text: 'Nothing to change right now.' }];
  const nm = firstName(id);
  return sc(id,
    '>sad|Can we talk? I have been thinking, and I would like us to go back to being friends. I care about you a lot.',
    'sad|...Oh. That is not easy to hear. But thank you for telling me honestly and kindly.',
    `happy|I am glad we had this time. I would not trade it. And I still want you in my life, as my friend.`,
    '>happy|Always. You are important to me.',
    `@${nm} smiles, a little sad and a little relieved. The air between you feels lighter, if quieter.`,
    call((gg) => { const p = stepBack(gg); gg.toast(`You and ${firstName(p)} are friends again`, 'heart'); }),
    mood(-5));
}

// ---------- hooks ----------
export function installConfessHooks() {
  for (const id of candidates()) {
    register('talkHook', 'sv4r_confess_' + id, {
      npc: id, priority: 60,
      when: (g) => theyReady(g, id) && g.check(CONF_COND[id] || 'time>=16:00&time<21:00'),
      steps: (g) => (theyReady(g, id) ? confessSteps(g, id, 'them') : sc(id, 'happy|Oh, hi Misa. I was just thinking about you. In a good way.')),
    });
  }
}
register('system', 'sv4Confess', {
  init(game) {
    game.bus.on('dayStart', () => {
      for (const id of candidates()) {
        const s = S(game);
        if (theyReady(game, id) && s.hintFor !== `${id}:${game.day}`) { s.hintFor = `${id}:${game.day}`; game.toast(`${firstName(id)} seems to have something to tell you. Find them this evening.`, 'heart'); }
      }
    });
  },
});
API.confess = (g, id, who) => g.run(confessSteps(g, id, who || 'misa'));
API.compliment = (g, id) => g.run(complimentSteps(g, id));
API.stepBack = (g) => g.run(stepBackSteps(g));
API.force = (g, id) => { const s = S(g); s.aff[id] = 900; g.friend(id).pts = 1000; };
