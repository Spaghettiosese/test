// Assembles the voices: Kai, Suzu, Rina (voices_a), Theo, Hina (voices_b) and a gentle generic voice for newer classmates.
// V shape: { likes[], dislikes[], react{3,1,0}, compliment{prompt,opts[[text,reply,pts]]}, dates{kind:[open,great,ok]}, bye{great,good,low},
//   conf{bd,place,setup,them,ask,yes,hold,wait,friends,notyet}, couple{family,exam,festival,anniv,mix}, post[], perk{morning,lunch,walk} }
import { V } from './voices_a.js';
import { genericVoice } from './voices_b.js';
import { nameOf } from './core.js';

export const voiceOf = (id) => V[id] || (V[id] = genericVoice(id, nameOf(id)));
export { V };
