(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III items. Merged into GD.items. Same schema as items.js. =====
GD.items = Object.assign(GD.items || {}, {

  relay_pass: { id:"relay_pass", name:"Relay Pass (Visitor)", type:"key", usable:false, color:"#9aa07a", icon:"Rp",
    desc:"A laminated card with a photograph of somebody who is almost you. It admits the bearer to District Relay No. 4 'for the purposes of maintenance, inspection or lunch'. Guards check the stamp, never the face. Faces are above their pay grade.",
    mods:{ composure:1 } },

  relay_log: { id:"relay_log", name:"Relay Logbook", type:"clue", usable:false, color:"#7f8f86", icon:"Lg",
    desc:"A grease-spotted logbook in an engineer's cramped hand: every Harmony, every duration, every 'inconvenient hour' scheduled for removal, and in the margins, Tomas's small despairing doodles of a bell with a frown. It is the other half of the Ledger. Together they are a case. Alone it is a very incriminating diary.",
    mods:{ archive:1, dialectics:1 } },

  master_tape: { id:"master_tape", name:"Grand Harmony Master Tape", type:"key", usable:false, color:"#4a4a58", icon:"Mt",
    desc:"A heavy reel in a grey tin labelled JUBILEE — 72 HRS — DO NOT PLAY IN DEMOCRATIC COMPANY. Seventy-two hours of a nation's memory will be folded away by this ribbon on Thursday at eight. It is lighter than it has any right to be. So are most weapons of mass forgetting." },

  counter_tone: { id:"counter_tone", name:"The Wake Tone", type:"key", usable:false, color:"#7fd0c0", icon:"Wk",
    desc:"A cylinder of black wax inside a biscuit tin, wrapped in Ilsabet's scarf. Played into the Bell's carrier it rings the other way: instead of folding the hours shut, it opens them. Ilsabet calls it a 'reverse lullaby'. Gregor calls it 'a good solder job'. You call it hope, quietly, so the portraits don't hear.",
    mods:{ senses:1, volition:1 } },

  inspector_card: { id:"inspector_card", name:"Inspector's Card", type:"apparel", usable:false, color:"#3a3f4a", icon:"Ic",
    desc:"A cream card embossed with a lidded eye and the name HALE VOSS, STATE INSPECTORATE, DISTRICT 9. Voss pressed it on you with the air of a man leaving a tip. Show it and doors open; keep it and somebody will wonder why they opened.",
    mods:{ authority:1, charm:1, solidarity:-1 },
    onEquip:{ effects:[ {surv:-3} ] } },

  black_market_ticket: { id:"black_market_ticket", name:"Black Market Ticket", type:"key", usable:false, color:"#a8584a", icon:"Bm",
    desc:"A tram ticket, punched in a pattern that means 'serve this person without asking where they got it'. Nadia's handwriting says GOOD FOR ONE FAVOUR. Nadia's handwriting says a lot of things, most of them invoices.",
    mods:{ sleight:1 } },

  forged_pass: { id:"forged_pass", name:"Forged Pass", type:"key", usable:false, color:"#b9ae8a", icon:"Fp",
    desc:"A district movement pass, forged so well the forgery has a forgery. Dov's work, Nadia's stamp, your face on loan. It will survive a glance, a squint and a bored soldier. It will not survive a clever one. Try not to meet a clever one.",
    mods:{ slip:1, composure:1, charm:-1 } },

  matron_ledger: { id:"matron_ledger", name:"Matron's Ledger", type:"clue", usable:false, color:"#8f7a5a", icon:"Ml",
    desc:"A fat green account book in which Matron Pritt records who came in, who went out and what they were wearing when they did. Fourteen years of footsteps, indexed. It is the finest piece of surveillance in the building and was funded entirely by sherry.",
    mods:{ archive:1, empathy:-1 } },

  banned_book: { id:"banned_book", name:"The Quiet Hours", type:"clue", usable:false, color:"#6b5a4a", icon:"Qh",
    desc:"A slim book with a plain brown cover and no author. Inside: the first account of the Harmony Broadcasts, written by a Ministry clerk who was later wiped for writing it, then, evidently, unwiped by somebody who thought it funny. Possession is a Class Two offence. Reading it is a Class Three, which has no number because the number was forgotten.",
    mods:{ dialectics:1, doublethink:-1 } },

  tram_token: { id:"tram_token", name:"Tram Token", type:"consumable", usable:true, color:"#c0a860", icon:"Tt",
    desc:"A brass disc stamped with the tram of Karsov Avenue, a fare-token that has been fare-token for so long it has acquired opinions. Nadia sells them one at a time. Dov sells them two at a time and calls it a bargain. Spend it and you ride; keep it and you can ride later.",
    stackable:true,
    use:{ consume:false, label:"Rub it for luck",
      effects:[ {morale:1}, {time:2}, {toast:"The brass is warm. Somewhere, a tram is leaving without you. For now."} ] } },

  wrench: { id:"wrench", name:"Pipe Wrench", type:"clue", usable:false, color:"#7a7f86", icon:"Wr",
    desc:"A two-foot iron wrench, much-loved, much-used, faintly oily. It is an excellent tool for turning valves and an even better argument for people who prefer not to be argued with.",
    mods:{ brawn:1, authority:1, charm:-1 } },

  osk_keys: { id:"osk_keys", name:"Osk's Keyring", type:"key", usable:false, color:"#b5a060", icon:"Ok",
    desc:"A ring the size of a saucer, eighty-odd keys, each hand-labelled in the janitor's careful capitals: 'CLASSROOMS (MOST)', 'STORE (HAUNTED)', 'DO NOT'. The man who gave it to you cried a little. The keys are heavier than keys should be.",
    mods:{ slip:2, senses:1 } },

  choir_score: { id:"choir_score", name:"Choir Score", type:"clue", usable:false, color:"#d8cba0", icon:"Cs",
    desc:"Four pages of the Anthem for mixed voices, annotated in Fenwick's trembling pencil. In the margin of page three there is a key change that is not in the official arrangement. It rises, like a question, and stays up." },

  wren_note: { id:"wren_note", name:"Wren's Note", type:"clue", usable:false, color:"#e0d0b8", icon:"Wn",
    desc:"A folded square the size of a matchbox, addressed 'TO WHOEVER IS READING THIS (NOT YOU, MATRON)'. The contents are a map in crayon, three phone numbers, and the sentence 'I SEEN THE MAN WITH THE BLACK CAR ASLEEP IN IT. HE CRIED.'" },

  cylinder_blank: { id:"cylinder_blank", name:"Wax Cylinder Blank", type:"junk", usable:false, color:"#a89a78", icon:"Cb",
    desc:"A blank recording cylinder, black wax in cardboard sleeve, stolen from the Ministry's own supply by someone with a sense of humour. It will hold anything you say to it, including things you should not.",
    mods:{ senses:1 } },

  vasha_letter: { id:"vasha_letter", name:"Vasha's Letter", type:"clue", usable:false, color:"#8b9070", icon:"Vl",
    desc:"An envelope in the lieutenant's squared army hand, addressed to nobody. Inside, three pages beginning 'If you are reading this I did not have the nerve to say it aloud.' The ink is smudged in the places where a person's thumb goes when they are deciding something.",
    mods:{ empathy:1, composure:-1 } },

  fake_bell_schedule: { id:"fake_bell_schedule", name:"Doctored Bell Schedule", type:"clue", usable:false, color:"#c7b98a", icon:"Fs",
    desc:"The Ministry's nightly schedule, altered in three places by someone who learned forgery from a master and manners from nobody. If it reaches the right desk it will make the relay's operator ring the Bell an hour early, or an hour late, or possibly in the wrong key.",
    mods:{ sleight:1, archive:1 } },

  gregor_tubes: { id:"gregor_tubes", name:"Gregor's Spare Tubes", type:"clue", usable:false, color:"#7fb7b0", icon:"Gt",
    desc:"A cardboard box of six glass valves, each in a twist of newspaper dated before you were born. Old Gregor says they are 'the good ones; the Ministry never found them, they were busy finding me'. The glass is warm, which glass should not be.",
    mods:{ senses:1, aim:1 } },

  thermos: { id:"thermos", name:"Battered Thermos", type:"consumable", usable:true, color:"#6a7a8a", icon:"Th",
    desc:"A dented green thermos holding something hot, sweet and ruinously strong. A sticker on the side reads PROPERTY OF THE GREATER UNION RAIL SERVICE and below it, in a different hand, 'PROPERTY OF NADIA, TAKE IT AND DIE'. The tea inside is still hot, which is either a miracle or a lie.",
    use:{ consume:true, label:"Drink",
      effects:[ {hp:3}, {morale:2}, {time:5}, {toast:"Body +3, Nerve +2. You are briefly a person with a plan."} ] } },

  quill_notes: { id:"quill_notes", name:"Quill's Notes", type:"clue", usable:false, color:"#c9b88a", icon:"Qn",
    desc:"Forty index cards in an old historian's elegant hand, tied with a bootlace: the Bell's history, from the first test broadcast to the eve of the Jubilee, with dates, call-signs and a footnote that reads 'See also: me, being fired.' Rigorous, funny, and almost certainly a death sentence.",
    mods:{ archive:2, rote:1, composure:-1 } }
});
})();
