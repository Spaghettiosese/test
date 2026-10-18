// Small helpers shared by the sv4_newcast modules: the social script shorthand plus a safe mail queue.
import { queueMail } from '../social/mail.js';
export { sc, ch, mark, flag, time, mood, giveOr, open, leave, backdrop, iff, stepBy, fade, wait } from '../social/util.js';
export const queueMailSafe = (game, m) => { try { queueMail(game, m); } catch (e) { game.mail(m.id, m.from, m.text); } };
