// Economy area: part-time jobs. Five jobs, each an interaction (job_cafe, job_mart, job_library, job_clock,
// job_fishmarket) that runs a 2-hour shift minigame, then a payday screen. Ranks 1-5 grow with performance and
// make shifts harder and better paid. Shifts can be booked a day ahead in the Jobs phone app.
// Services: game.jobRank(id) -> 0..5, game.jobInfo(id), game.jobBookings() -> [{ job, day }]. Condition: 'job:cafe>=2'.
// Bus: jobShift { job, score, stars, pay, rank }.
import { register, registerMany, get, features } from '../../core/registry.js';
import { parseHM, clockText, WEEKDAYS, dateText } from '../../core/time.js';
import { CafeShift, cafeBot, MartShift, martBot } from '../../minigames/jobs/service.js';
import { LibraryShift, libraryBot, ClockShift, clockBot, FishShift, fishBot } from '../../minigames/jobs/puzzles.js';
import { pay, hasBuff, giveStickers } from './core.js';
import { rect, panel, btn, drawText, drawTextC, measure, wrapPx, fit, C, RAMPS, inside, K, coinGlyph, starGlyph } from './gfx.js';

export const JOBS = {
  cafe: { name: 'Cafe Kumo', role: 'Waitress', boss: 'mika', bossName: 'Mika', minigame: 'job_cafe', wage: 220, energy: 20, xp: { charm: 8, cooking: 5 }, after: ['15:30', '18:00'], free: ['9:00', '18:00'], closed: [2], unlock: () => true, unlockText: 'Open to everyone' },
  mart: { name: 'Sunny Mart', role: 'Cashier', boss: 'sachiko', bossName: 'Sachiko', minigame: 'job_mart', wage: 200, energy: 18, xp: { charm: 5, study: 5 }, after: ['15:30', '19:00'], free: ['9:00', '19:00'], closed: [], unlock: (g) => g.day >= 8, unlockText: 'From Spring 8' },
  library: { name: 'Hoshimori Library', role: 'Shelver', boss: null, bossName: 'Ms. Ito', minigame: 'job_library', wage: 180, energy: 15, xp: { study: 10 }, after: ['15:30', '18:00'], free: ['10:00', '17:00'], closed: [0], unlock: () => true, unlockText: 'Open to everyone' },
  clock: { name: 'Wren\'s Clocks', role: 'Repair helper', boss: 'tobias', bossName: 'Tobias', minigame: 'job_clock', wage: 260, energy: 22, xp: { crafting: 10 }, after: ['15:30', '17:00'], free: ['9:00', '16:00'], closed: [6], unlock: (g) => g.state.story.chapter >= 4 || g.hearts('tobias') >= 2 || g.day >= 15, unlockText: 'After Chapter 4, or once Tobias trusts you' },
  fishmarket: { name: 'Fish Market', role: 'Fish sorter', boss: null, bossName: 'Auntie Tama', minigame: 'job_fishmarket', wage: 240, energy: 25, xp: { fishing: 10 }, after: ['6:00', '7:30'], free: ['6:00', '11:00'], closed: [6], unlock: (g) => g.skillLevel('fishing') >= 2 || g.day >= 10, unlockText: 'At Fishing level 2 (or after a week in town)' },
};
const RANK_PTS = [0, 6, 15, 28, 45];
const jstate = (game, id) => (game.state.economy.jobs[id] ||= { pts: 0, shifts: 0, perfect: 0, lastDay: 0, earned: 0 });
export const rankOf = (pts) => RANK_PTS.filter((p) => pts >= p).length;
export function jobRank(game, id) { const s = game.state.economy.jobs[id]; return s && s.shifts ? rankOf(s.pts) : 0; }
const usesSchool = (game) => game.check('school');
export function shiftWindow(game, job) { const w = usesSchool(game) ? job.after : job.free; return w.map(parseHM); }
export function jobOpenToday(game, job) { return !job.closed.includes(game.weekday); }
export const wageAt = (job, rank) => Math.round(job.wage * (1 + 0.2 * (Math.max(1, rank) - 1)));

function say(game, who, text) { return game.run([{ t: 'say', who: get('npc', who) ? who : null, mood: 'neutral', text }]); }

export async function startShift(game, id) {
  const job = JOBS[id], st = jstate(game, id), boss = job.boss;
  if (!job.unlock(game)) return say(game, boss, `${job.bossName}: Thanks for asking about work! We're not hiring just yet. (${job.unlockText})`);
  if (st.lastDay === game.day) return say(game, boss, `${job.bossName}: You already did a shift today. Go have some fun!`);
  if (!jobOpenToday(game, job)) return say(game, boss, `${job.bossName}: We're closed for shifts on ${WEEKDAYS[game.weekday]}s. See you another day!`);
  const [a, b] = shiftWindow(game, job);
  if (game.minutes < a || game.minutes > b) return say(game, boss, `${job.bossName}: Shifts start between ${clockText(a)} and ${clockText(b)} today. Come back then!`);
  if (game.energy < job.energy) return say(game, boss, `${job.bossName}: You look exhausted, Misa. Eat something and rest first, okay?`);
  const rank = Math.max(1, jobRank(game, id)), tired = game.energy < job.energy + 15;
  let go = false;
  await game.run([{ t: 'choice', prompt: `${job.role} shift: 2 hours, -${job.energy} energy, about ${wageAt(job, rank)} coins + tips${tired ? ' (you are tired)' : ''}`, options: [
    { text: 'Start the shift', steps: [{ t: 'call', fn: () => { go = true; } }] }, { text: 'Not today', steps: [] }] }]);
  if (!go) return;
  const r = await game.minigame(job.minigame, { rank, tired });
  if (r.quit) return say(game, boss, `${job.bossName}: No problem, we'll manage. Go and rest!`);
  finishShift(game, id, r, rank);
}

export function finishShift(game, id, r, rank) {
  const job = JOBS[id], st = jstate(game, id), ec = game.state.economy;
  const before = rankOf(st.pts);
  const wage = wageAt(job, rank), tips = Math.round((r.score || 0) * job.wage * 0.5 * (hasBuff(game, 'calm') ? 1.2 : 1));
  const booked = ec.jobs.booked.some((b) => b.job === id && b.day === game.day);
  const bonus = booked ? Math.round(wage * 0.1) : 0;
  const total = wage + tips + bonus;
  game.useEnergy(job.energy); game.advance(120);
  for (const [sk, n] of Object.entries(job.xp)) game.addXP(sk, n + (r.stars || 1) * 2);
  if (job.boss && get('npc', job.boss)) game.addFriend(job.boss, 10 + (r.stars || 1) * 5);
  st.pts += (r.stars || 1) + (r.stars >= 3 ? 1 : 0); st.shifts++; st.lastDay = game.day; st.earned += total;
  if (r.stars >= 3) st.perfect++;
  ec.jobs.booked = ec.jobs.booked.filter((b) => !(b.job === id && b.day === game.day));
  ec.jobs.log.unshift({ day: game.day, job: id, pay: total, stars: r.stars || 1 }); if (ec.jobs.log.length > 30) ec.jobs.log.length = 30;
  game.stat('jobShifts'); game.stat('jobShifts_' + id);
  pay(game, total, `${job.name} shift wages`, true);
  const after = rankOf(st.pts), info = { job, id, wage, tips, bonus, total, stars: r.stars || 1, rankUp: after > before ? after : 0, rank: after, pts: st.pts, eom: false };
  if (r.stars >= 3 && st.perfect === 4) { info.eom = true; game.setFlag('econ_eom_' + id, game.day); }
  game.bus.emit('jobShift', { job: id, score: r.score, stars: r.stars, pay: total, rank: after });
  return new Promise((res) => game.open('econ_payday', info, res)).then(() => {
    if (info.eom) giveStickers(game, 2, 'employee of the month');
    if (info.rankUp) game.toast(`Promoted at ${job.name}: rank ${info.rankUp}!`, null);
  });
}

// ---------------------------------------------------------------- payday screen (coin-counting animation)
class Payday {
  constructor(game, info, onDone) { Object.assign(this, { name: 'econ_payday', game, info, onDone, t: 0, shown: 0, ticks: 0, opaque: false }); game.sfx('chime'); }
  update(dt, input) {
    this.t += dt;
    const target = this.info.total, prev = this.shown;
    this.shown = Math.min(target, Math.round(target * Math.min(1, Math.max(0, this.t - 0.5) / 1.2)));
    if (Math.floor(this.shown / 25) !== Math.floor(prev / 25)) this.game.sfx('coin');
    if (this.t > 1.9 && (K.ok(input) || input.justDown || K.back(input))) { this.game.scenes.pop(this); this.onDone && this.onDone(); }
  }
  draw(g) {
    const i = this.info;
    rect(g, 'rgba(30,22,36,.6)', 0, 0, 320, 224);
    panel(g, 64, 26, 192, 172, 'paper');
    rect(g, C.coral, 64, 26, 192, 18); drawTextC(g, 'Payday!', 160, 32, C.text, 1, null);
    drawTextC(g, `${i.job.role} at ${i.job.name}`, 160, 50, RAMPS.ink[2], 1, null);
    for (let s = 0; s < 3; s++) starGlyph(g, 145 + s * 10, 60, s < i.stars ? C.gold : RAMPS.paper[1]);
    const rows = [['Wage', i.wage], ['Tips', i.tips]]; if (i.bonus) rows.push(['Booked shift bonus', i.bonus]);
    rows.forEach(([a, b], k) => { drawText(g, a, 80, 76 + k * 10, C.ink, 1, null); const s = `${b}c`; drawText(g, s, 240 - measure(s), 76 + k * 10, RAMPS.wood[1], 1, null); });
    const ty = 80 + rows.length * 10;
    rect(g, RAMPS.paper[1], 80, ty, 160, 1);
    drawText(g, 'Total', 80, ty + 5, C.coralD, 1, null);
    const tot = `${this.shown}c`; drawText(g, tot, 240 - measure(tot), ty + 5, C.coralD, 1, null);
    // coin pile grows with the count
    const coins = Math.min(18, Math.floor(this.shown / 30));
    for (let k = 0; k < coins; k++) coinGlyph(g, 110 + (k % 6) * 12 + ((k / 6) | 0) * 3, ty + 36 - ((k / 6) | 0) * 5);
    const next = RANK_PTS[i.rank] ?? null;
    drawText(g, `Rank ${i.rank}`, 80, ty + 46, C.ink, 1, null);
    rect(g, C.ink, 120, ty + 46, 120, 6); rect(g, RAMPS.paper[2], 121, ty + 47, 118, 4);
    const lo = RANK_PTS[i.rank - 1] || 0, frac = next === null ? 1 : (i.pts - lo) / (next - lo);
    rect(g, C.mint, 121, ty + 47, Math.round(118 * Math.min(1, frac)), 4);
    if (i.rankUp) drawTextC(g, `Promoted to rank ${i.rankUp}! Better pay, busier shifts.`, 160, ty + 58, RAMPS.forest[1], 1, null);
    if (i.eom) drawTextC(g, 'Employee of the month! +2 Star Stickers', 160, ty + 68, C.coralD, 1, null);
    if (this.t > 1.9) drawTextC(g, 'Press Space', 160, 186, RAMPS.ink[3], 1, null);
  }
}
register('scene', 'econ_payday', { make: (game, info, onDone) => new Payday(game, info, onDone) });

// ---------------------------------------------------------------- registry entries
registerMany('minigame', {
  job_cafe: { title: 'Cafe Kumo shift', make: (g, o) => new CafeShift(g, o), bot: cafeBot, resultTitle: 'SHIFT DONE!' },
  job_mart: { title: 'Sunny Mart cashier', make: (g, o) => new MartShift(g, o), bot: martBot, resultTitle: 'SHIFT DONE!' },
  job_library: { title: 'Library shelving', make: (g, o) => new LibraryShift(g, o), bot: libraryBot, resultTitle: 'SHIFT DONE!' },
  job_clock: { title: 'Clock repair', make: (g, o) => new ClockShift(g, o), bot: clockBot, resultTitle: 'SHIFT DONE!' },
  job_fishmarket: { title: 'Fish market sorting', make: (g, o) => new FishShift(g, o), bot: fishBot, resultTitle: 'SHIFT DONE!' },
});
for (const id of Object.keys(JOBS)) {
  register('interaction', 'job_' + id, {
    label: (g) => (jstate(g, id).lastDay === g.day ? `${JOBS[id].name}: shift done` : `Work a shift (${JOBS[id].role.toLowerCase()})`),
    run: (g) => startShift(g, id),
  });
}
register('system', 'econ_jobs', {
  init(game) {
    game.jobRank = (id) => jobRank(game, id);
    game.jobInfo = (id) => JOBS[id];
    game.jobBookings = () => game.state.economy.jobs.booked.slice();
    game.bus.on('dayEnd', ({ day }) => {
      const ec = game.state.economy;
      for (const b of ec.jobs.booked.filter((x) => x.day === day)) {
        const job = JOBS[b.job];
        if (jstate(game, b.job).lastDay === day) continue;
        if (job.boss && get('npc', job.boss)) game.addFriend(job.boss, -10);
        game.mail(`econ_missed_${b.job}_${day}`, job.bossName, `We missed you at your ${job.role.toLowerCase()} shift today! It's okay, things happen. Just let me know next time?`);
      }
      ec.jobs.booked = ec.jobs.booked.filter((x) => x.day > day);
    });
  },
});

// ---------------------------------------------------------------- Jobs phone app
register('phoneApp', 'jobs', {
  name: 'Jobs', icon: 'econ_i_jobs', order: 44,
  badge: (game) => game.state.economy.jobs.booked.filter((b) => b.day === game.day && jstate(game, b.job).lastDay !== game.day).length || 0,
  open(game, app) { app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const ids = Object.keys(JOBS), st = app.state, { x, y, w } = app.area;
    if (K.down(input)) st.sel = (st.sel + 1) % ids.length;
    if (K.up(input)) st.sel = (st.sel + ids.length - 1) % ids.length;
    if (input.justDown) { const i = Math.floor((input.my - y - 2) / 26); if (input.mx < x + 104 && i >= 0 && i < ids.length) st.sel = i; }
    const id = ids[st.sel], job = JOBS[id], bx = x + 110, by = y + app.area.h - 20;
    const book = input.pressed.has('b') || input.pressed.has('enter') || (input.justDown && inside(input.mx, input.my, bx, by, w - 114, 16));
    if (book && job.unlock(game)) {
      const ec = game.state.economy, d = game.day + 1, has = ec.jobs.booked.find((b) => b.job === id && b.day === d);
      if (has) { ec.jobs.booked = ec.jobs.booked.filter((b) => b !== has); game.toast('Booking cancelled', null); }
      else if (job.closed.includes((game.weekday + 1) % 7)) game.toast(`${job.name} has no shifts tomorrow`, null);
      else { ec.jobs.booked.push({ job: id, day: d }); game.toast(`Booked: ${job.role} shift tomorrow (+10% pay)`, null); }
      game.sfx('select');
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, ids = Object.keys(JOBS), st = app.state;
    ids.forEach((id, i) => {
      const job = JOBS[id], yy = y + 2 + i * 26, on = i === st.sel, open = job.unlock(game), rank = jobRank(game, id);
      panel(g, x, yy, 104, 24, on ? { ink: C.ink, fill: RAMPS.butter[3], hi: '#ffffff', lo: RAMPS.butter[2], shadow: 'rgba(30,22,36,.4)' } : 'card');
      drawText(g, fit(job.name, 96), x + 5, yy + 4, open ? C.ink : RAMPS.ink[3], 1, null);
      if (open) for (let r = 0; r < 5; r++) starGlyph(g, x + 5 + r * 9, yy + 13, r < rank ? C.gold : RAMPS.paper[1]);
      else drawText(g, 'Locked', x + 5, yy + 14, RAMPS.ink[3], 1, null);
      if (game.state.economy.jobs.booked.some((b) => b.job === id)) { rect(g, C.coral, x + 88, yy + 13, 12, 7); drawText(g, 'B', x + 92, yy + 14, C.text, 1, null); }
    });
    const id = ids[st.sel], job = JOBS[id], js = jstate(game, id), rank = Math.max(1, jobRank(game, id));
    const dx = x + 110, dw = w - 110;
    panel(g, dx, y, dw, h, 'paper');
    drawText(g, `${job.role} at ${job.name}`, dx + 6, y + 6, C.coralD, 1, null);
    const [a, b] = shiftWindow(game, job);
    const lines = [
      `Boss: ${job.bossName}`,
      job.unlock(game) ? (jobOpenToday(game, job) ? `Today: start ${clockText(a)} - ${clockText(b)}` : 'No shifts today') : job.unlockText,
      `Closed: ${job.closed.length ? job.closed.map((d) => WEEKDAYS[d]).join(', ') : 'never'}`,
      `Pay: ${wageAt(job, rank)}c + tips, ${job.energy} energy`,
      `Shifts: ${js.shifts}   Perfect: ${js.perfect}   Earned: ${js.earned}c`,
    ];
    lines.forEach((l, i) => drawText(g, fit(l, dw - 12), dx + 6, y + 18 + i * 9, C.ink, 1, null));
    const next = RANK_PTS[rankOf(js.pts)];
    drawText(g, `Rank ${jobRank(game, id) || '-'}`, dx + 6, y + 66, C.ink, 1, null);
    rect(g, C.ink, dx + 46, y + 66, dw - 56, 6); rect(g, RAMPS.paper[2], dx + 47, y + 67, dw - 58, 4);
    const lo = RANK_PTS[rankOf(js.pts) - 1] || 0;
    rect(g, C.mint, dx + 47, y + 67, Math.round((dw - 58) * (next === undefined ? 1 : (js.pts - lo) / (next - lo))), 4);
    if (game.flag('econ_eom_' + id)) drawText(g, 'Employee of the month!', dx + 6, y + 76, C.coralD, 1, null);
    drawText(g, 'Recent pay', dx + 6, y + 88, RAMPS.ink[2], 1, null);
    const log = game.state.economy.jobs.log.filter((l) => l.job === id).slice(0, 4);
    if (!log.length) drawText(g, 'No shifts yet', dx + 6, y + 98, RAMPS.ink[3], 1, null);
    log.forEach((l, i) => { drawText(g, dateText(l.day), dx + 6, y + 98 + i * 9, C.ink, 1, null); const s = `${l.pay}c`; drawText(g, s, dx + dw - 8 - measure(s), y + 98 + i * 9, RAMPS.wood[1], 1, null); });
    const booked = game.state.economy.jobs.booked.find((bk) => bk.job === id && bk.day === game.day + 1);
    btn(g, dx + 4, y + h - 20, dw - 8, 16, !job.unlock(game) ? 'Locked' : booked ? 'Cancel tomorrow\'s booking (B)' : 'Book a shift tomorrow (B)', { disabled: !job.unlock(game), tone: booked ? 'coral' : 'mint' });
    void wrapPx;
  },
});

features('Part-time jobs', [
  'Five part-time jobs, each a 2-hour shift with its own hours, wage, energy cost and skill XP: Cafe Kumo, Sunny Mart, the library, Wren\'s Clocks and the fish market',
  'Shifts fit around school: after class on school days (the fish market before school), all day at weekends and in the holidays; most jobs have a closed day',
  'Cafe Kumo shift: customers order drinks (then sizes, then cakes at higher ranks); build each order on the tray and serve it before their patience runs out',
  'Sunny Mart cashier: scan heavy items first so fragile ones end up on top of the bag, then count out the right change with coin buttons',
  'Library shelving: put returned books into the right colour-coded shelf and gap by call number, with gentle hints when you are off',
  'Wren\'s Clocks repair bench: place small, medium and large gears on pegs until every tooth meshes from the motor to the clock; connected gears spin live and gears too close jam',
  'Fish market sorting: send each fish on the conveyor to the crate for its kind and size before it reaches the check-later bin',
  'Job ranks 1-5 per job: better shifts earn points, and each rank pays 20% more and makes shifts busier',
  'Job unlocks: the cafe and library any time, Sunny Mart from Spring 8, the fish market at Fishing 2, Wren\'s Clocks later in the story',
  'Payday screen after every shift: wage, tips by score and bonuses, with a coin-counting animation and your rank progress',
  'Jobs phone app: every job\'s hours, pay, rank, shift count and recent pay history',
  'Book tomorrow\'s shift in the Jobs app for a 10% bonus; missing a booked shift costs a little friendship with the boss and gets a kind message',
  'Shifts cost energy and tired shifts lower the best possible score',
  'Employee of the month after 4 perfect shifts at a job, with 2 Star Stickers',
  'Friendship with the boss grows with every shift',
  'Calm focus (from tea) gives 20% more tips on shifts',
  'Every job minigame plays with the mouse or the keyboard: arrows move a gold focus marker between buttons',
  'Gear puzzles are laid out fresh for every shift, with decoy pegs, and get longer at higher ranks',
  'Fish market fish come in four hand-drawn kinds (mackerel, sea bream, flounder, squid) and two sizes, with more kinds at higher ranks',
]);
