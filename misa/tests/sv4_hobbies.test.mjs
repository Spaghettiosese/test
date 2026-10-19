import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestGame, inp, DT, get, FEATURES } from './helpers.mjs';
import { S } from '../src/content/sv4_hobbies/state.js';
import { record, shotsLeft, scorePhoto, sceneInfo } from '../src/content/sv4_hobbies/photo.js';
import { recordSong, best, buskCrowd, tips } from '../src/content/sv4_hobbies/music.js';
import { queuePiece, collectKiln, pieceId } from '../src/content/sv4_hobbies/craft.js';
import { addStory, CHAPTERS, writeChapter, chapterReady } from '../src/content/sv4_hobbies/writing.js';
import { makeBouquet } from '../src/content/sv4_hobbies/flowers.js';
import { SONGS, chartOf } from '../src/minigames/sv4_hobbies/songs.js';

test('every hobby minigame bot finishes with a sane score', () => {
  const g = createTestGame();
  for (const id of ['sv4h_frame', 'sv4h_rhythm', 'sv4h_clay', 'sv4h_plot', 'sv4h_ikebana']) {
    const def = get('minigame', id), m = def.make(g, {});
    for (let i = 0; i < 60 * 120 && !m.done; i++) m.update(DT, def.bot(m, i * DT, inp()), g);
    assert.ok(m.done, id + ' finishes'); assert.ok(m.score >= 0 && m.score <= 1);
  }
  assert.equal(SONGS.length, 8); SONGS.forEach((s) => assert.ok(chartOf(s).length > 8));
});
test('rhythm bot scores high on every song', () => {
  const g = createTestGame(), def = get('minigame', 'sv4h_rhythm');
  for (const s of SONGS) { const m = def.make(g, { song: s.id }); for (let i = 0; i < 60 * 120 && !m.done; i++) m.update(DT, def.bot(m, 0, inp()), g); assert.ok(m.score > 0.8, s.id + ' ' + m.score); }
});
test('items, shop stock and skills register', () => {
  const g = createTestGame();
  for (const id of ['tool_camera', 'sv4h_film', 'sv4h_recorder', 'sv4h_guitar', 'book_sv4h_mystery', 'book_sv4h_my_novel', 'gift_sv4h_grand', pieceId('vase', 'indigo'), 'furn_sv4h_rug_sea']) assert.ok(get('item', id), id);
  for (const id of get('shop', 'sv4h_stationery').stock) assert.ok(get('item', typeof id === 'string' ? id : id.item));
  for (const s of ['photography', 'music', 'pottery', 'writing', 'ikebana']) assert.ok(get('skill', s));
  assert.ok(g.skillLevel('music') === 0);
});
test('photos, songs, pots, stories and bouquets progress and persist through save/load', () => {
  const g = createTestGame(); g.give('tool_camera', 1);
  const info = sceneInfo(g), q = shotsLeft(g); const e = record(g, info, 0.9);
  assert.equal(shotsLeft(g), q - 1); assert.ok(e.stars >= 1 && scorePhoto(g, info, 1).total >= scorePhoto(g, info, 0).total);
  recordSong(g, 'twinkle', { acc: 0.9, combo: 10 }); assert.equal(best(g, 'twinkle'), 0.9); assert.ok(g.skillXP('music') > 0);
  assert.ok(buskCrowd(g, 2) >= 0 && tips(g, 5, 1) > tips(g, 5, 0));
  queuePiece(g, 'vase', 'indigo', 0.9); g.state.time.day += 3; assert.equal(collectKiln(g).length, 1); assert.ok(g.has(pieceId('vase', 'indigo')));
  addStory(g, { acc: 0.8, title: 'T', picks: [{ genre: 'mystery', beat: 0, tier: 1 }, { genre: 'mystery', beat: 1, tier: 2 }, { genre: 'mystery', beat: 2, tier: 1 }] }, 1); assert.ok(g.has('book_sv4h_mystery'));
  g.state.time.day = 5; assert.equal(chapterReady(g), 0); writeChapter(g, 0, 'hopeful'); assert.equal(S(g).write.novel.done.length, 1); assert.equal(CHAPTERS.length, 8);
  g.give('crop_tulip', 3); makeBouquet(g, { used: ['crop_tulip', 'crop_tulip', 'crop_tulip'], acc: 0.9 }); assert.ok(g.has('gift_sv4h_grand'));
  const copy = JSON.parse(JSON.stringify(g.state)); assert.equal(copy.sv4h.photo.album.length, 1); assert.equal(copy.sv4h.music.songs.twinkle.best, 0.9);
  assert.ok(FEATURES.filter((f) => f.cat === 'Creative Hobbies').length >= 60);
});
