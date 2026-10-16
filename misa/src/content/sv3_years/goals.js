// Year goals (the Hoshimori Guild charter, a little harder every year), the "Years" phone app, the Year banner and the
// school-year line in the Calendar app.
import { register, get, features } from '../../core/registry.js';
import { seasonOf, dateOf, yearOf, dateText } from '../../core/time.js';
import { UI, rect, panel, drawText, drawTextC, inside, bar } from '../../ui/ui.js';
import { Y, st, stickers, gradeOf, gradeName, GRAD_DAY, yr, isAlum, nm, first } from './util.js';
import { enrolledKohai } from './kohai.js';
import { ELECTIVES, FEST, isRep, TIERS } from './years.js';
import { trackInfo, TRACKS } from './career.js';
import { CLUBS } from '../school/data.js';

const mineBest = (g) => (g.state.sv_explore && g.state.sv_explore.mine && g.state.sv_explore.mine.best) || 0;
const G = (id, text, fn, need, reward) => ({ id, text, fn, need, reward });
const stat = (k) => (g) => st(g, k);
export const goalsFor = (y) => {
  if (y <= 1) return [G('y1_fish', 'Catch fish', stat('fishCaught'), 25, { money: 500 }), G('y1_crops', 'Harvest crops', stat('harvested'), 30, { money: 500 }), G('y1_mine', 'Reach mine floor', mineBest, 5, { money: 600, stickers: 1 }), G('y1_req', 'Finish town requests', stat('requestsDone'), 5, { money: 600 }), G('y1_cls', 'Attend classes', stat('classesAttended'), 60, { money: 700, stickers: 1 })];
  if (y === 2) return [G('y2_fish', 'Catch fish', stat('fishCaught'), 70, { money: 900 }), G('y2_crops', 'Harvest crops', stat('harvested'), 90, { money: 900 }), G('y2_mine', 'Reach mine floor', mineBest, 12, { money: 1100, stickers: 1 }), G('y2_req', 'Finish town requests', stat('requestsDone'), 15, { money: 1100 }), G('y2_cook', 'Cook dishes', stat('cooked'), 40, { money: 900, stickers: 1 }), G('y2_club', 'Club practices', stat('clubActivities'), 25, { money: 1000 })];
  if (y === 3) return [G('y3_fish', 'Catch fish', stat('fishCaught'), 130, { money: 1400 }), G('y3_crops', 'Harvest crops', stat('harvested'), 180, { money: 1400 }), G('y3_mine', 'Reach mine floor', mineBest, 20, { money: 1800, stickers: 2 }), G('y3_req', 'Finish town requests', stat('requestsDone'), 30, { money: 1800 }), G('y3_cook', 'Cook dishes', stat('cooked'), 90, { money: 1400, stickers: 1 }), G('y3_exam', 'Exams taken', stat('examsTaken'), 20, { money: 1600, stickers: 1 })];
  const k = y - 3;
  return [G(`e${k}_fish`, 'Catch fish', stat('fishCaught'), 130 + 60 * k, { money: 2000 + 400 * k }), G(`e${k}_crops`, 'Harvest crops', stat('harvested'), 180 + 90 * k, { money: 2000 + 400 * k }), G(`e${k}_mine`, 'Reach mine floor', mineBest, Math.min(30, 20 + 2 * k), { money: 2400 + 400 * k, stickers: 2 }), G(`e${k}_req`, 'Finish town requests', stat('requestsDone'), 30 + 12 * k, { money: 2400 + 400 * k }), G(`e${k}_cafe`, 'Serve cafe customers', (g) => Y(g).epi.cafe.served, 40 * k, { money: 3000 + 500 * k, stickers: 1 })];
};
export const goalNow = (g) => goalsFor(yr(g));
export function claim(g, goal) {
  const Z = Y(g);
  if (Z.goalsClaimed[goal.id] || goal.fn(g) < goal.need) return false;
  Z.goalsClaimed[goal.id] = g.day; g.addMoney(goal.reward.money || 0); stickers(g, goal.reward.stickers || 0); g.stat('yearGoals'); g.sfx('chime');
  g.toast(`Goal done: ${goal.text}`, 'i_star'); return true;
}

// ---------------------------------------------------------------- year banner (HUD)
let BANNER = null;
export const showBanner = (g, text, sub) => { BANNER = { text, sub, t0: g.clock || 0 }; };
export const bannerNow = () => BANNER;
register('hud', 'sv3y_banner', {
  draw(gx, g) {
    if (!BANNER) return;
    const t = (g.clock || 0) - BANNER.t0;
    if (t > 6 || t < -1) { BANNER = null; return; }
    const a = Math.max(0, Math.min(1, t * 2, (6 - t) * 2));
    gx.save(); gx.globalAlpha = a * 0.92;
    rect(gx, '#2b1d2e', 0, 70, 320, 52); rect(gx, '#ffd76a', 0, 70, 320, 2); rect(gx, '#ffd76a', 0, 120, 320, 2);
    gx.globalAlpha = a; drawTextC(gx, BANNER.text, 160, 80, '#ffd76a', 3, null); drawTextC(gx, BANNER.sub, 160, 106, '#fff6e6', 1, null); gx.restore();
  },
});

// ---------------------------------------------------------------- calendar: school-year line and school landmarks
export const schoolLabel = (day) => {
  const y = yearOf(day);
  if (day > GRAD_DAY) return `Alumni life (year ${y})`;
  return `School year ${Math.min(3, y)} (${['', 'First', 'Second', 'Third'][Math.min(3, y)]} Year)${y === 4 ? ': final term' : ''}`;
};
export const landmark = (day) => {
  const s = seasonOf(day), d = dateOf(day), y = yearOf(day);
  if (day === GRAD_DAY) return 'GRADUATION DAY';
  if (s === 'spring' && d === 1 && y >= 2 && y <= 4) return 'New April: new class, three new kohai';
  if (s === 'autumn' && d >= 14 && d <= 20 && (y === 2 || y === 3)) return y === 2 ? 'Club Exhibition week' : 'Captain\'s Tournament week';
  if (y === 2 && s === 'autumn' && d >= 8 && d <= 20) return 'School trip window';
  if ((y === 2 || y === 3) && s === 'spring' && d >= 4 && d <= 14) return 'Class rep election week';
  if (s === 'autumn' && (d === 20 || d === 21) && y <= 3) return `Culture Festival: ${FEST[y].name}`;
  if (y === 3 && ((s === 'summer' && d >= 1) || (s === 'autumn' && d >= 3) || (s === 'winter' && d >= 3))) return null;
  return null;
};
const cal = get('phoneApp', 'calendar');
if (cal && !cal.__sv3) {
  const orig = cal.draw; cal.__sv3 = true;
  cal.draw = function drawCal(g, game, app) {
    orig.call(this, g, game, app);
    const { x, y } = app.area, sel = (app.state && app.state.sel) || game.day, lm = landmark(sel);
    drawText(g, schoolLabel(sel), x + 6, y + 176, UI.accent2, 1, null);
    if (lm) drawText(g, lm, x + 6, y + 188, sel === GRAD_DAY ? UI.bad : UI.good, 1, null);
  };
}

// ---------------------------------------------------------------- phone app: Years
const TABS = ['YEAR', 'GOALS', 'KOHAI', 'PATH'];
register('phoneApp', 'sv3y_years', {
  name: 'Years', icon: 'i_school', order: 26,
  open(game, app) { app.state.tab ??= 0; app.state.sel = 0; },
  update(dt, input, game, app) {
    const s = app.state, k = input.pressed;
    if (k.has('c') || k.has('arrowright')) { s.tab = (s.tab + 1) % TABS.length; game.sfx('blip'); }
    if (k.has('arrowleft')) { s.tab = (s.tab + TABS.length - 1) % TABS.length; game.sfx('blip'); }
    if (input.justDown) TABS.forEach((_, i) => { if (inside(input.mx, input.my, app.area.x + i * 58, app.area.y, 56, 14)) s.tab = i; });
    if (s.tab === 1) {
      const list = goalNow(game);
      if (k.has('arrowdown')) s.sel = (s.sel + 1) % list.length;
      if (k.has('arrowup')) s.sel = (s.sel + list.length - 1) % list.length;
      if (k.has('enter') || k.has(' ') || k.has('e')) claim(game, list[s.sel % list.length]);
      if (input.justDown) list.forEach((gl, i) => { if (inside(input.mx, input.my, app.area.x, app.area.y + 34 + i * 20, app.area.w, 19)) { s.sel = i; claim(game, gl); } });
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, s = app.state, Z = Y(game), grade = gradeOf(game);
    TABS.forEach((t, i) => { rect(g, UI.ink, x + i * 58, y, 56, 14); rect(g, i === s.tab ? UI.gold : UI.paper2, x + i * 58 + 1, y + 1, 54, 12); drawTextC(g, t, x + i * 58 + 28, y + 4, UI.ink, 1, null); });
    const T = (t, yy, c = UI.ink, xx = 4) => drawText(g, t, x + xx, y + yy, c, 1, null);
    if (s.tab === 0) {
      T(isAlum(game) ? `ALUMNI YEAR ${yearOf(game.day)}` : `SCHOOL YEAR ${grade}: ${gradeName(game).toUpperCase()}`, 22, UI.accent2);
      T(isAlum(game) ? 'Graduated from Hoshimori High' : `Class ${grade}-B   Exam tier: ${(TIERS[grade] || '').replace('Tier ', 'T')}`, 34);
      T(`Elective: ${Z.elective ? ELECTIVES[Z.elective] : (grade >= 2 ? 'not chosen' : 'from Year 2')}`, 46);
      const r = Z.role[Math.min(3, Math.max(2, grade))];
      T(`Club: ${game.state.school && game.state.school.club ? CLUBS[game.state.school.club].name : 'none'}${r ? ' (' + r.title + ')' : ''}`, 58);
      T(`Class rep: ${isRep(game) ? 'yes, this year' : 'no'}`, 70);
      T(`School trip: ${Z.trip.done ? 'done' : grade >= 2 ? 'Year 2 autumn' : 'Year 2'}`, 82);
      const days = Math.max(0, GRAD_DAY - game.day);
      T(Z.graduated ? `Ending: ${Z.ending || '?'}` : `Graduation: Spring 28, Year 4 (${days} days)`, 94, Z.graduated ? UI.good : UI.dim);
      T(`Path: ${Z.track ? TRACKS[Z.track].name : 'not chosen (talk to Ms. Fujita, Year 3)'}`, 106);
      T(`Kohai enrolled: ${enrolledKohai(game).length}/9   Goals done: ${Object.keys(Z.goalsClaimed).length}`, 118);
      T(`Today: ${dateText(game.day)}`, h - 12, UI.dim);
    } else if (s.tab === 1) {
      const list = goalNow(game);
      T(`YEAR ${yr(game)} GUILD CHARTER (ENTER CLAIMS)`, 20, UI.accent2);
      list.forEach((gl, i) => {
        const yy = 34 + i * 20, v = Math.min(gl.need, gl.fn(game)), done = !!Y(game).goalsClaimed[gl.id], ready = v >= gl.need;
        rect(g, i === s.sel ? UI.gold : UI.paper2, x, y + yy, w, 19);
        T(gl.text.toUpperCase(), yy + 2, UI.ink, 4); bar(g, x + 150, y + yy + 4, 90, 8, gl.need ? v / gl.need : 1, ready ? UI.good : UI.accent);
        T(done ? 'CLAIMED' : ready ? 'CLAIM!' : `${v}/${gl.need}`, yy + 5, done ? UI.dim : ready ? UI.good : UI.ink, 246);
      });
    } else if (s.tab === 2) {
      const ids = enrolledKohai(game);
      T(ids.length ? 'YOUR KOHAI' : 'KOHAI ENROL EACH APRIL (YEARS 2-4)', 20, UI.accent2);
      ids.forEach((id, i) => { const yy = 34 + i * 14; T(first(id).toUpperCase(), yy, UI.ink); bar(g, x + 80, y + yy + 1, 110, 7, game.hearts(id) / 10, '#f29aa0'); T(`${game.hearts(id)}/10`, yy, UI.ink, 196); });
    } else {
      const inf = trackInfo(game);
      T(inf.title, 20, UI.accent2);
      inf.lines.forEach((l, i) => T(l.text.slice(0, 46), 34 + i * 14, l.done ? UI.good : UI.ink));
    }
  },
});

features('Years & Graduation', [
  'A Year banner slides across the screen on Spring 1 of every year',
  'The Calendar app shows the school year and marks election week, trip window, tournament week, the festival and Graduation Day',
  'Years phone app: school year, class, elective, club role, class rep, trip and path at a glance',
  'Guild charter goals every year (fish, crops, mine floor, requests, cooking, classes), harder each year with coin and sticker rewards',
  'Your kohai list in the Years app shows every first-year\'s heart meter',
]);
void get; void nm;
