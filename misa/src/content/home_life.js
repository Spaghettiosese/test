// Home life: the original chore minigames become optional daily home tasks (Mom pays a small allowance),
// plus the Mochi petting menu and a few cozy home interactions.
import { register, registerMany, features, get } from '../core/registry.js';
import { DishGame, SweepGame, LaundryGame, PlantGame, FeedGame } from '../minigames/chores.js';
import { PetGame } from '../minigames/pet.js';

registerMany('minigame', {
  dishes: { title: 'Wash the dishes', make: (g, o) => new DishGame(g.rng, { plates: o.plates || 3 }) },
  sweep: { title: 'Sweep the floor', make: (g, o) => new SweepGame(g.rng, o) },
  laundry: { title: 'Fold the laundry', make: (g, o) => new LaundryGame(g.rng, { items: o.items || 4 }) },
  plants: { title: 'Water the plants', make: (g, o) => new PlantGame(g.rng, { pots: o.pots || 3 }) },
  feed: { title: 'Feed Mochi', make: (g) => new FeedGame(g.rng) },
  pet: { title: 'Pet Mochi', result: false, make: (g) => new PetGame(g.rng), music: 'home' },
});

export const TASKS = {
  dishes: { name: 'Wash the dishes', pay: 25, xp: 6 },
  sweep: { name: 'Sweep the living room', pay: 25, xp: 6 },
  laundry: { name: 'Fold the laundry', pay: 25, xp: 6 },
  plants: { name: 'Water the houseplants', pay: 20, xp: 5 },
  feed: { name: 'Feed Mochi', pay: 10, xp: 3 },
};

function rollTasks(game) {
  const ht = game.state.homeTasks;
  if (ht.day === game.day) return;
  const pool = ['dishes', 'sweep', 'laundry', 'plants'].sort(() => game.rng() - 0.5);
  const n = game.isWeekend ? 3 : 1 + (game.rng() < 0.5 ? 1 : 0);
  ht.day = game.day;
  ht.list = ['feed', ...pool.slice(0, n)].map((id) => ({ id, done: false }));
  game.state.mochi.fed = false;
}

function doTask(game, id) {
  const ht = game.state.homeTasks, t = ht.list.find((x) => x.id === id);
  if (!t) return game.toast(id === 'feed' ? 'Mochi already ate today.' : 'All clean here for today!');
  if (t.done) return game.toast('Already done. Nice work!');
  if (!game.useEnergy(id === 'feed' ? 0 : 4)) return;
  const finish = (r) => {
    if (r.quit) return;
    t.done = true;
    const def = TASKS[id], stars = r.stars + (r.bonus || 0);
    game.addXP('homemaking', def.xp + stars * 2);
    game.addMoney(def.pay + stars * 5);
    game.addMood(4 + stars);
    game.advance(20);
    if (id === 'feed') { game.state.mochi.fed = true; game.state.mochi.fedDay = game.day; game.state.mochi.affection = Math.min(100, game.state.mochi.affection + 3); }
    game.stat('homeTasks'); game.stat('task_' + id);
    game.bus.emit('homeTask', { id, stars });
    if (ht.list.every((x) => x.done)) { game.toast('All home tasks done! Mom sends a bonus', 'i_star'); game.addMoney(30); game.stat('perfectHomeDays'); }
  };
  const play = () => game.minigame(id === 'feed' && get('minigame', 'mochi_feed') ? 'mochi_feed' : id, {}).then(finish);
  // Once a chore is mastered (done 5+ times and homemaking 2+) it can be finished quickly for 2 stars.
  if (id !== 'feed' && (game.state.stats['task_' + id] || 0) >= 5 && game.skillLevel('homemaking') >= 2) {
    game.run([{ t: 'choice', prompt: TASKS[id].name, options: [
      { text: 'Quick finish (2 stars)', steps: [{ t: 'call', fn: () => { game.advance(15); finish({ score: 0.7, stars: 2, bonus: 0 }); } }] },
      { text: 'Do it properly', steps: [{ t: 'call', fn: () => { setTimeout(play, 0); } }] },
    ] }]);
  } else play();
}

const pending = (game, id) => { const t = game.state.homeTasks.list.find((x) => x.id === id); return !!t && !t.done; };
registerMany('interaction', {
  task_dishes: { label: (g) => (pending(g, 'dishes') ? 'Wash dishes' : 'Sink'), run: (g) => doTask(g, 'dishes'), overlay: (g, w, o, x, y) => { if (pending(g, 'dishes')) w.drawSpr('dishpile', x + 4, y - 2); } },
  task_sweep: { label: 'Sweep the floor', run: (g) => doTask(g, 'sweep') },
  task_laundry: { label: (g) => (pending(g, 'laundry') ? 'Fold laundry' : 'Laundry'), run: (g) => doTask(g, 'laundry'), sprFn: (g, o) => (o.spr === 'basket' && pending(g, 'laundry') ? 'basket_full' : o.spr) },
  task_plants: { label: 'Water plants', run: (g) => doTask(g, 'plants'), sprFn: (g) => (pending(g, 'plants') ? 'pot_wilt' : 'pot_ok') },
  task_feed: { label: 'Feed Mochi', run: (g) => doTask(g, 'feed'), sprFn: (g) => (g.state.mochi.fedDay === g.day ? 'bowl_full' : 'bowl_empty') },
  sofa: { label: 'Sit and relax', run: (g) => {
    const near = g.mochi && g.mochi.map === 'home' && Math.hypot(g.mochi.x - g.world.player.x, g.mochi.y - g.world.player.y) < 60;
    g.advance(30); g.addEnergy(near ? 12 : 8); g.addMood(near ? 8 : 3);
    g.run(near ? [{ t: 'say', who: 'misa', mood: 'happy', text: 'Come here, you.' }, { t: 'say', who: 'mochi', mood: 'happy', text: 'Purrrrr...' }, { t: 'sfx', name: 'purr' }, { t: 'say', who: 'misa', mood: 'sleepy', text: 'The best part of every day, right here.' }]
      : [{ t: 'say', who: 'misa', mood: 'neutral', text: 'A nice sit. It would be even nicer with a cat on my lap.' }]);
  } },
  bookshelf: { label: 'Bookshelf', run: (g) => g.open('phone', 'books') || g.say('misa', 'happy', 'Grandma\'s old books. They smell like her house always did.') },
  desk: { label: 'Desk', run: (g) => g.studyAtDesk ? g.studyAtDesk() : g.say('misa', 'neutral', 'My desk. Homework goes here... eventually.') },
  stove: { label: 'Stove', run: (g) => g.openCooking ? g.openCooking() : g.say('misa', 'neutral', 'I should learn some recipes.') },
});

register('system', 'homeTasks', {
  init(game) {
    game.homeTaskPending = (id) => pending(game, id);
    game.bus.on('dayStart', () => rollTasks(game));
    game.bus.on('gameStart', () => rollTasks(game));
    game.bus.on('gameLoaded', () => rollTasks(game));
  },
});

features('Home', [
  'Daily home tasks (1-3 a day, more on weekends): feeding Mochi plus a random mix of dishes, sweeping, laundry and houseplants',
  'Mom pays a small allowance for each home task, with a bonus for finishing them all',
  'Visible mess: dirty dishes on the sink, dust bunnies, a full laundry basket and wilted plants until each task is done',
  'Dishes minigame: scrub grime off each plate with the mouse or keys, rinse, and it floats up to the rack',
  'Sweeping minigame: push dust into the pan with a broom; shiny coins hide in the dust',
  'Laundry minigame: fold shirts with timed arrow presses or clicks',
  'Plant watering minigame: hold to pour and let go inside the green band',
  'Feed Mochi minigame: work out today\'s favourite food from her tail wags',
  'Mochi\'s bowl shows whether she has eaten today',
  'Sit on the sofa to rest; cuddling Mochi restores more energy and mood',
  'Homemaking skill levels up as you do home tasks',
  'Mastered home tasks (done 5 times, homemaking level 2) can be quick-finished for 2 stars',
]);
