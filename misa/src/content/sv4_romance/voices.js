// Assembles the voices: Kai, Suzu, Rina (voices_a), Theo, Hina (voices_b) and a gentle generic voice for newer classmates.
// V shape: { likes[], dislikes[], react{3,1,0}, compliment{prompt,opts[[text,reply,pts]]}, dates{kind:[open,great,ok]}, bye{great,good,low},
//   conf{bd,place,setup,them,ask,yes,hold,wait,friends,notyet}, couple{family,exam,festival,anniv,mix}, post[], perk{morning,lunch,walk} }
import { V } from './voices_a.js';
import { genericVoice } from './voices_b.js';
import { nameOf } from './core.js';

const TWEAK = {
  aoi: { likes: ['active', 'calm', 'food', 'nature', 'sea'], dislikes: ['bold', 'games'], morning: ['(Text) Morning, Misa. Ran the harbour loop at dawn. Thought of you at the lighthouse.', 'happy|(Text) Good morning. New postcard to my old friends. I wrote about you. Good things.', '(Text) Morning. Eat a real breakfast. I burned my egg again. Do not ask.'], cp: ['I really like how you made this town feel like home', 'happy|Home. Yes. That is it. You did that. I did not know I was homesick until you made it stop.'] },
  haru: { likes: ['books', 'funny', 'games', 'quiet', 'art'], dislikes: ['active', 'bold'], morning: ['happy|(Text) EXTRA EXTRA: local girl is wonderful. Source: me. More at eight.', '(Text) Good morning. Today I will only pun twice. Maybe. Hold me to it.', 'happy|(Text) Morning, Misa. The Herald has one more reader today. It is your fault. Thank you.'], cp: ['Your newspaper is my favourite thing to read', 'happy|Wait, really? I will print that on the front page. In small letters. Very small. I am blushing in print.'] },
};
export const voiceOf = (id) => {
  if (V[id]) return V[id];
  const v = (V[id] = genericVoice(id, nameOf(id))), t = TWEAK[id];
  if (t) { v.likes = t.likes; v.dislikes = t.dislikes; v.perk.morning = t.morning; v.compliment.opts[0] = [t.cp[0], t.cp[1], 14]; }
  return v;
};
export { V };
