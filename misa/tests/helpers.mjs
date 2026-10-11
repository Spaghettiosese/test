// Shared test helpers: load all content once and build a headless game.
import '../src/content/index.js';
import { Game } from '../src/core/game.js';
import { blankInput } from '../src/input.js';
export { R, FEATURES, get, all } from '../src/core/registry.js';

export function createTestGame(seed = 12345) {
  const g = new Game();
  g.state.seed = seed;
  g.initSystems();
  g.newGame(1);
  g.bus.emit('gameStart', {});
  return g;
}
export const inp = (o = {}) => Object.assign(blankInput(), { wheel: 0 }, o);
export const DT = 1 / 60;
