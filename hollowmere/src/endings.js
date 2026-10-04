// How it ends: four endings, an epilogue that remembers who you saved and who you did not, the
// credits, and the last page of numbers. Finishing also unlocks New Game+ (your level, perks,
// gear and blade carried into a harder valley).
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export const ENDINGS = {
  gray: { h: 'THE GRAY HAND\'S KNIFE', tag: 'Ending: The Gray Hand', line: 'You give Sable the letter. She takes your hand in hers, almost gently, and breaks the seal with it. The Stones sing; the hill opens; the Choir comes up singing her name instead of yours. You are paid in full, in gold that never quite warms. You will spend it somewhere very far away, and you will not sleep well there.' },
  saint: { h: 'THE QUIET BELL', tag: 'Ending: The Quiet Bell', line: 'You hold the letter to the heart and it burns black, without smoke. The Choir forgets its own name halfway through a note, and the faces close their mouths one by one. Up in Ashgate the hollows sit down where they stand and do not get up again. The bell of Ravenspire never tolls thirteen again. Some nights it does not toll at all.' },
  unseal: { h: 'KEY OF THE CHOIR', tag: 'Ending: The Choir', line: 'You break the seal. The letter reads you, not the other way round: every name you ever stole, every door you ever opened in the dark. The Choir rises and learns your name, and you understand at last that you were never the thief. You were the door. In Ashgate they still hear the singing, and somewhere in it a voice that sounds like yours.' },
  true: { h: 'THE THIRTEENTH BELL', tag: 'Ending: The Thirteenth Bell', line: 'You set the Binder\'s skull on the rim, and you strike the heart with the bell\'s own tongue: once for the hour, and twelve times for the night. On the thirteenth stroke the hour closes. The Choir does not die; it ends, which is different, and quieter. Every hollow in Hollowmere lies down at once. Up on the hill, with no tongue and nobody on the rope, the bell of Ravenspire tolls one last time, and then never again.' },
};

// the epilogue: one card per life the story touched
function epilogue(g, kind) {
  const F = g.campaign.facts, S = g.story, cards = [];
  const duke = g.npcs.find((n) => n.id === 'duke'), dukeAlive = duke && !duke.dead && S.dukeState !== 'dead';
  cards.push(['Ashgate', F.siegeWon ? 'Ashgate rebuilt its south gate from the timbers of the barricades. Captain Harl kept your pardon in a drawer, and never once took it out to look at it.' : F.siegeFailed ? 'Ashgate\'s south gate fell on the Hollow Night. The town is smaller now, and quieter, and it does not open its gates to strangers.' : 'Ashgate held through the Hollow Night without you. Nobody there says your name, which is the kindest thing a town can do for a thief.']);
  cards.push(['The Duke', dukeAlive ? (F.dukeTalked ? 'Duke Aldric Vorst gave Ravenspire to the Watch and walked north with nothing but a lantern. He was going, he said, to find a grave that would wait for him.' : 'Duke Aldric Vorst never left Fort Greywatch. He sleeps with the candle burning still, and asks every soldier who passes whether the bell has rung.') : 'Ravenspire\'s new lord pulled the Duke\'s tower down stone by stone. Under it they found nothing but salt.']);
  const bran = g.npcs.find((n) => n.id === 'brannoch');
  cards.push(['Brannoch', F.brannochSaved && bran && !bran.dead ? 'Brannoch kept his fire on the south road for twenty years. He never once asked what you did under the stones, and he always kept salve.' : 'They buried Brannoch beside the road, under a cairn with a knife cut into the top stone. Travellers leave coins on it. Nobody knows why.']);
  cards.push(['Sable', kind === 'gray' ? 'Sable sings now, in a voice that makes men kneel. The Gray Hand has never been richer, or more afraid of its Mistress.' : F.sableRedeemed ? 'Sable went back to the Mirewood. The lamp in her mother\'s window burns all night now, and there are two shadows in it.' : F.sableBeaten ? 'The Gray Hand broke apart without its Mistress. Some say Sable crawled out of the Stones before the end; some say she was never there at all.' : 'Nobody saw Sable again.']);
  if (F.vaneSpared) cards.push(['Vane', 'Vane took the Gray Hand\'s boats and coffers and sailed out of Pellmouth one grey morning. The Rookery is a cellar again. Marl charges for it anyway.']);
  else if (F.vaneBeaten) cards.push(['Vane', 'Vane\'s coat hangs in a cabin by the old road. It still smells of oil, and of other people\'s fear.']);
  if (S.flags.locketReturned) cards.push(['Marta', 'Marta wears her daughter\'s locket every day. She tells anyone who will listen about a hooded stranger with kind eyes.']);
  if (F.witchMessage && kind !== 'gray') cards.push(['Old Sable', 'The witch of the Mirewood keeps her lamp lit, as she promised. She brews nothing for the Gray Hand any more.']);
  cards.push(['Rook', kind === 'true' ? 'And Rook? Rook was seen once more, on the road south, whistling. Nobody in Hollowmere has ever heard the tune. It has thirteen notes, and the last one is silence.' : kind === 'saint' ? 'And Rook? Rook was a thief again by spring, and a good one. He never takes letters.' : kind === 'unseal' ? 'And Rook? Rook is everywhere now, and nowhere. Some nights in Ashgate a voice in the singing says the name of whoever is listening.' : 'And Rook? Rook is rich, and alone, and somewhere very far from the sound of bells.']);
  return cards;
}

export function playEnding(g, kind) {
  const S = g.story, T = ENDINGS[kind]; if (!T || S.ended) return; S.ended = true;
  S.complete('fate'); S.complete('c4_heart'); S.complete('c4_stones'); g.player.inv.remove('letter', 1);
  g.profile.sawEnding(kind); g.campaign.facts.ending = kind; g.achievements?.check();
  try { g.profile.setCarry(g.campaign.carry()); } catch (e) { console.warn(e); }
  g.mode = 'cutscene'; g.ui.letterbox(true); g.ui.showHud(false); const P = g.player, p = P.pos;
  S.play([
    { dur: 3.6, fadeTo: 0.25, sub: ['', T.line.split('. ')[0] + '.'], cam: { p0: [p[0], p[1] + 1.7, p[2]], p1: [p[0], p[1] + 2.5, p[2] + 0.6], l0: [p[0] + Math.sin(P.yaw) * 6, p[1] + 1.6, p[2] + Math.cos(P.yaw) * 6], fov: 60 }, enter: () => { g.sfx.bell?.(kind === 'true' ? 13 : 3); if (kind === 'unseal' || kind === 'gray') g.sfx.hollowCry?.(p); else g.sfx.veil?.(); } },
    { dur: 4.6, fadeTo: 0.9, fadeRate: 1.3, title: [T.h, T.tag], cam: { p0: [p[0], p[1] + 2.5, p[2] + 0.6], p1: [p[0], p[1] + 6, p[2] + 2.5], l0: [p[0], p[1] + 7, p[2] + 10], fov: 66 } },
  ], () => showEpilogue(g, kind));
}

function showEpilogue(g, kind) {
  const T = ENDINGS[kind], cards = [['', T.line], ...epilogue(g, kind)]; let i = 0;
  g.mode = 'end'; g.ui.letterbox(false); g.pix.fade = 0.92;
  const el = document.getElementById('end'), card = document.getElementById('endCard'); el.hidden = false;
  const page = () => {
    if (i >= cards.length) return credits(g, kind);
    const [who, text] = cards[i];
    card.innerHTML = `<p class="epi-k">${i === 0 ? esc(T.tag) : 'Afterwards'}</p>${who ? `<h2 style="font-size:clamp(24px,4vw,40px)">${esc(who)}</h2>` : `<h2 style="font-size:clamp(24px,4.5vw,46px)">${esc(T.h)}</h2>`}<p class="epi">${esc(text)}</p><button class="go" id="epiNext" style="min-width:0;justify-self:center">${i === cards.length - 1 ? 'Credits' : 'Continue'}</button>`;
    document.getElementById('epiNext').onclick = () => { g.sfx.pick?.(); i++; page(); };
    g.sfx.bellNote?.(1);
  };
  page();
}

function credits(g, kind) {
  const card = document.getElementById('endCard');
  card.innerHTML = `<div class="credits"><div class="roll">
    <h2>HOLLOWMERE</h2><p class="epi-k">The Thirteenth Bell</p>
    <p>Chapter I · The Duke's Seal<br>Chapter II · The Gray Hand<br>Chapter III · The Hollow Night<br>Chapter IV · The Choir Beneath</p>
    <p class="epi-k">Built on</p><p>The ShapeForge Engine V5</p>
    <p class="epi-k">Every model, animation, portrait, sound and note of music</p><p>made in code, while the game loads</p>
    <p class="epi-k">Type</p><p>Pixelify Sans · Silkscreen · VT323</p>
    <p class="epi-k">Starring</p><p>Rook · Brannoch · Sable · Vane · Captain Harl · Duke Aldric Vorst · Father Ansel · Old Sable · Marl · the people of Ashgate · and the Choir, in its own voice</p>
    <p class="epi-k">Thank you for playing</p><p>Mind the bell.</p>
  </div></div><button class="go" id="credSkip" style="min-width:0;justify-self:center">Continue</button>`;
  document.getElementById('credSkip').onclick = () => { g.sfx.pick?.(); stats(g, kind); };
  g.after?.(26, () => { if (document.getElementById('credSkip')) stats(g, kind); });
}

function stats(g, kind) {
  const T = ENDINGS[kind], st = g.stats, P = g.player, S = g.story, mins = Math.round(S.playTime / 60), F = g.campaign.facts;
  let title = 'Blade in the Dark'; if (st.civKills > 0 || st.guardKills >= 12) title = 'Butcher of Hollowmere'; else if (st.guardKills === 0 && st.civKills === 0) title = 'Ghost of Hollowmere'; else if (st.guardKills <= 4) title = 'Quiet Knife';
  g.pix.fade = 0.85; g.mode = 'end';
  document.getElementById('endCard').innerHTML = `<h2>THE END</h2><p style="color:var(--gold);font-size:22px;margin:0">${esc(T.tag)}</p><p style="color:var(--dim);font-size:20px;margin:0">${title}${g.campaign.ng ? ` · New Game+ ${g.campaign.ng}` : ''}</p>
    <table>
      <tr><td>Time in Hollowmere</td><td>${mins} min</td></tr>
      <tr><td>Level</td><td>${g.progress.level}</td></tr>
      <tr><td>Verses learned</td><td>${g.campaign.verses.size} / 3</td></tr>
      <tr><td>Guards slain · villagers slain</td><td>${st.guardKills} · ${st.civKills}</td></tr>
      <tr><td>Silent kills · executions</td><td>${st.stabs} · ${st.executions || 0}</td></tr>
      <tr><td>Knockouts · parries</td><td>${st.ko || 0} · ${st.parries || 0}</td></tr>
      <tr><td>Hollows put down</td><td>${S.hollowCount}</td></tr>
      <tr><td>Great foes defeated</td><td>${st.bosses || 0}</td></tr>
      <tr><td>Brannoch</td><td>${F.brannochSaved ? 'saved' : 'lost'}</td></tr>
      <tr><td>The Hollow Night</td><td>${F.siegeWon ? 'held the gate' : F.siegeFailed ? 'left the gate' : 'elsewhere'}</td></tr>
      <tr><td>Sable</td><td>${kind === 'gray' ? 'paid you' : F.sableRedeemed ? 'went home' : F.sableBeaten ? 'beaten' : 'gone'}</td></tr>
      <tr><td>Trophies</td><td>${g.achievements.count()} / 40</td></tr>
      <tr><td>Deaths</td><td>${st.deaths}</td></tr>
    </table>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="go" style="min-width:0" onclick="window.__game.keepPlaying()">KEEP EXPLORING</button><button class="go" style="min-width:0" onclick="window.__game.newGamePlus()">NEW GAME+</button><button class="go" style="min-width:0" onclick="window.__game.toTitle()">TITLE</button></div>`;
}
