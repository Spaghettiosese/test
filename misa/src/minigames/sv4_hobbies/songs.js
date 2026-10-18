// Eight practice songs with simple note charts. A chart is bars of 8 steps (eighth notes); '0'-'3' is a lane, '.' a rest.
export const SONGS = [
  { id: 'twinkle', name: 'Twinkle on the Bay', bpm: 76, lanes: 2, pats: { A: '0...1...', B: '1...0...', C: '0.0.1.1.' }, order: 'AABABCAB' },
  { id: 'sakura', name: 'Sakura Steps', bpm: 84, lanes: 3, pats: { A: '0.1.2.1.', B: '2.1.0.1.', C: '0.12.0.1' }, order: 'AABAABCA' },
  { id: 'tide', name: 'Tide Waltz', bpm: 92, lanes: 4, pats: { A: '0..1..2.', B: '3..2..1.', C: '0.1.2.3.' }, order: 'AABBCABC' },
  { id: 'lantern', name: 'Lantern Walk', bpm: 100, lanes: 4, pats: { A: '0.1.2.3.', B: '3.2.1.0.', C: '01.23.01' }, order: 'ABABCABC' },
  { id: 'harbour', name: 'Harbour Rush', bpm: 112, lanes: 4, pats: { A: '01230123', B: '3.21.01.', C: '0.30.12.' }, order: 'ABCABCAB' },
  { id: 'moonlit', name: 'Moonlit Jam', bpm: 120, lanes: 4, pats: { A: '0.12.3.2', B: '1.03.20.', C: '0123.321' }, order: 'ABACABCA' },
  { id: 'matsuri', name: 'Matsuri Beat', bpm: 132, lanes: 4, pats: { A: '01.23.01', B: '32.10.32', C: '01230123' }, order: 'ABCABCBC' },
  { id: 'finale', name: 'Star Finale', bpm: 144, lanes: 4, pats: { A: '01230321', B: '03120312', C: '01.23.10' }, order: 'ABCABCCA' },
];
export const songById = (id) => SONGS.find((s) => s.id === id) || SONGS[0];
// Notes as { t: seconds from the downbeat, lane }.
export function chartOf(song) {
  const step = 30 / song.bpm, out = [];
  let i = 0;
  for (const ch of song.order) for (const c of song.pats[ch]) { if (c !== '.') out.push({ t: i * step, lane: Number(c) }); i++; }
  return out;
}
export const songLength = (song) => song.order.length * 8 * (30 / song.bpm);
// A track for the audio engine: the chart's notes as a simple melody over a bass pulse.
export function trackOf(song) {
  const step = 30 / song.bpm, scale = [0, 2, 4, 7], by = new Map();
  chartOf(song).forEach((n) => by.set(Math.round(n.t / step), n.lane));
  return { bpm: song.bpm * 2, type: 'triangle', play(s) {
    const out = [], k = s % (song.order.length * 8);
    if (by.has(k)) out.push({ n: scale[by.get(k)] + 7, len: 1, v: 1 });
    if (k % 4 === 0) out.push({ n: scale[(k >> 3) % 3] - 12, len: 3, v: 0.6, type: 'sine' });
    return out;
  } };
}
