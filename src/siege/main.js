// Entry point: builds the app once the page is ready and reports a missing WebGL2 clearly.
import { App } from './ui/app.js';
import { emblem } from './ui/icons.js';

const host = document.getElementById('splashEmblem');
if (host) host.innerHTML = emblem();
try {
  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl2')) throw new Error('WebGL2 is not available in this browser');
  window.app = new App();
} catch (err) {
  console.error(err);
  const s = document.getElementById('splash');
  if (s) s.querySelector('.go').textContent = 'Could not start: ' + err.message;
}
