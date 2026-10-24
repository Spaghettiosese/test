(function(){ const GD = (window.GD = window.GD || {});

// Story-D: Acts II & III, Karsov Avenue + District Relay No. 4, Day-2 variants of set-B NPCs, Day-2 night scenes.
// Tiny authoring helpers (data stays plain objects).
const J = (skill, min, text, o) => Object.assign({ skill, min, text }, o || {});
const C = (text, goto, o) => Object.assign({ text, goto }, o || {});
const E = (text, o) => Object.assign({ text: text || "Leave.", end: true }, o || {});
const X = (text, dialogue, o) => Object.assign({ text, dialogue }, o || {});
const K = (text, skill, diff, id, pass, fail, chk, o) => Object.assign({ text, check: Object.assign({ skill, diff, id, pass, fail }, chk || {}) }, o || {});
const N = (speaker, text, o) => Object.assign({ speaker, text }, o || {});

GD.dialoguesD = {

// ===================== ENTER_STREET =====================
enter_street: {
  title: "Karsov Avenue",
  start: "a",
  nodes: {
    a: N("narrator", `The school gate lets you out the way a throat lets out a cough: grudgingly, and with a noise. Beyond it, Karsov Avenue. You have seen it from the dormitory window every morning of your life, framed and small, like a postcard of somewhere you were forbidden to go. Up close it is wider than it has any right to be, a grey river of asphalt with a tram line down its spine and wires strung overhead like the first draft of a spider's sermon.\n\nThe posters on the east wall have been pasted over one another so many times they have become geology: you can read the decades in the cuts. Every third lamp-post carries a loudspeaker, tilted down, patient, the way a dog waits at a table. It is Wednesday morning. They are all, for the moment, silent. They look like they are holding their breath for you.`, {
      onEnter: [{ toast: "Karsov Avenue. Day 2." }, { note: "task_voss", text: "A State Inspector's black car is parked on Karsov Avenue. He is here to close the Ostrov case. I would like to know whose case it is." }],
      voices: 3,
      interjections: [
        J("the_grey", 3, `Oh, you came out. Nobody comes out. Forty thousand windows and every one of them looking inward. I have been the whole street for ninety years and you are the first person this week to walk down the middle of it. Mind the tram line. It remembers things too.`),
        J("senses", 4, `Frying onions without the onions. Tram-wire ozone. Wet newsprint. Somewhere a samovar is being coaxed to life by someone who loves it. And a smell you have not placed yet, thin and expensive: real tea, in a thermos, from a good tin.`),
        J("archive", 3, `Karsov Avenue: renamed from Lantern Street in the Year of Steady Hands, after Marshal Karsov, who lost four wars and was promoted after each. Loudspeaker poles: one per sixty metres (Regulation 31). Number currently audible: nil. Number currently listening: you will not like the answer.`),
        J("rote", 3, `A BELL FOR THE MORNING. A BELL FOR THE NIGHT. A BELL THAT CALLS THE CHILD HOME. (Poster, third layer from the top, eight words from a lullaby that were never meant to be stamped.)`),
        J("doublethink", 3, `Isn't it civilised? An avenue with a queue on it means there is bread somewhere. Be moved. A queue is proof of faith in tomorrow, and the people in it are building the future one boot at a time.`),
        J("instinct", 5, `Black car. Engine off, windows clean. Parked pointing at the school like a hearse that has arrived early and is being polite about it.`, { effects: [{ set: "street_car_noticed", val: true }] }),
        J("solidarity", 4, `We see them: the line along the barrier, a hundred coats the colour of wet pavement, all facing the same way. We know what that posture is. It is the posture of people who were told that standing is the same as being fed. We should stand with them. We should also, quietly, ask what they are standing for.`, { cond: "flag.verdict_ledger || flag.verdict_static" })
      ],
      choices: [
        C("Look at the queue.", "b"),
        C("Look at the black car.", "c"),
        E("Step out onto the avenue.")
      ]
    }),
    b: N("narrator", `The line starts at the barrier by the old lamp-post and goes round the corner, out of sight, and probably out of the century. Women with string bags. Pensioners on folding stools they carry the way knights carry shields. A boy of nine in a coat for a boy of fourteen, holding a place for somebody's mother and the whole weight of somebody's dinner. They are quiet in the particular way of people who have done this ten thousand times: no talk of bread; only talk of the weather, which is the one subject the Union allows to be bad.\n\nAt the head of the line, a trestle table, a clerk in oversleeves, and two Vanguard cadets in red-brown, whose job is to stand next to the trestle table and be unmistakably a consequence.`, {
      onEnter: [{ task: "task_queue", state: "active" }, { note: "task_queue", text: "Karsov Avenue, the ration queue: a hundred people and a trestle table with nothing on it yet. Something is going to happen here, because something always does at the front of a line." }],
      interjections: [
        J("empathy", 4, `Every one of them is tired in a different key. The woman with the string bag is tired like a sentence that has lost its verb. The old man is tired like a house settling. The boy is not tired at all, and that is the saddest sound in the whole street.`),
        J("senses", 5, `The clerk has been writing the same number on his blotter for a quarter of an hour. Not a date: a quantity. And it is smaller than the number of people in the line by a margin he would rather not subtract.`, { effects: [{ set: "queue_short_flour", val: true }] })
      ],
      choices: [
        C("Look at the black car.", "c"),
        E("Leave the queue to its waiting.")
      ]
    }),
    c: N("narrator", `The car is long, low and the colour of a closed door. Beside it, on the running board, sits a man in a long dark coat with a flask-cup of tea held in both hands, the way you hold something to keep it from leaving. Fifty or so. Grey in the hair at the sides, like someone who has been carefully lightly dusted. He is reading the loudspeaker pole across the street as though it were a long, interesting letter.\n\nHe turns his head, as if he heard you decide to look. He raises the cup an inch: not a salute, not a greeting, but an acknowledgment, the way one commuter nods to another on a platform at a quarter to five.`, {
      interjections: [
        J("authority", 4, `He is the highest-ranking person in this street and has arranged to be sitting on a car step. That is a tactic. It is a good one. It makes everyone else feel they are standing too high.`),
        J("composure", 3, `Do not nod back too quickly. Do not nod back too slowly. Let your face stay in the cap you came out in. You are a student on an errand. You are a student on an errand. You are a student on an errand.`),
        J("deduction", 4, `The coat is State Inspectorate grey but the lining, where it flaps, is the plum of the Chancellery. The car's licence plate has been scraped and repainted, once. A man who has two jobs and prefers you to see the smaller one.`, { effects: [{ set: "street_coat_lining", val: true }] })
      ],
      choices: [
        E("Go on your way. (Leave.)"),
        X("Walk over to him.", "voss")
      ]
    })
  }
},

// ===================== ENTER_RELAY =====================
enter_relay: {
  title: "District Relay No. 4",
  start: "a",
  nodes: {
    a: N("narrator", `The door closes behind you with the sound of a very large mouth saying nothing. Inside it is not a building so much as a held note. The air is warm and dry and tastes of hot dust, and from every surface, floor, pipe, tile, the back of your teeth, comes a hum so low you feel it before you hear it. Cables run along the ceiling like the veins of something that sleeps with its eyes open. Banks of glass valves glow behind a mesh, orange as small sunsets.\n\nThere is a long console, a desk with a logbook on it, a generator the size of a pony, a heavy steel vault door with a wheel like a ship's, and a ladder going up into the dark. There is a man asleep with his head on a panel of switches, and a larger man standing by the far wall, not asleep, looking at you the way a lock looks at a key.`, {
      onEnter: [{ set: "relay_entered", val: true }, { task: "task_relay", state: "active" }, { note: "task_relay", text: "Inside District Relay No. 4. Console, logbook desk, generator, tape vault, ladder to the aerial deck. An engineer, and a guard who has not yet decided what I am." }, { thought: "th_quiet_hours" }],
      voices: 3,
      interjections: [
        J("senses", 4, `The hum has a second note under it, a few hertz flat. You can feel the two pushing and pulling against each other, a slow wobble, a beat. You know that beat. You have known it all your life. It is the exact pitch of the ringing in your head.`),
        J("the_grey", 4, `Oh, this is where the quiet is made. Cables as thick as arms, going out under me in every direction, into every wall in the district. I carry them, you know. I carry all of it. Nobody ever thanks the conduit.`),
        J("instinct", 4, `The big one by the wall: shoulders square, hand not on his holster but near it, like a man resting his hand on a sleeping dog. He has not shouted yet. This is the stage where he can still be anything.`),
        J("archive", 4, `District Relay No. 4. Built the Year of Steady Hands on the foundations of a Tarnov bathhouse. Staff of two under Ministry order 44/Q. Listed on no map, on no tram, and, you think, on no payroll that a human being has ever seen.`),
        J("volition", 4, `Your knees have decided to be afraid. Let them. It is their job. Your job is to be a person who is allowed to be here.`)
      ],
      choices: [
        C("Take in the room properly.", "b"),
        E("Stay calm and look official.")
      ]
    }),
    b: N("narrator", `Up close: the console has a long row of dials marked with the Ministry's one joke, a series of tiny brass plates reading STANDARD, PEDAGOGIC, REMEMBRANCE, JUBILEE, and, one plate stamped over with a smaller plate, the word you cannot read. The logbook is a tall green ledger chained to the desk by a ball-chain, like a bank's pen. The vault door has a stencilled number: 7. The generator purrs. Above you, on a metal gantry, a sign: SILENCE IS A SERVICE.\n\nThe engineer stirs, lifts his head, sees you, and, in one fluid motion of absolute terror, goes back to sleep.`, {
      interjections: [
        J("rhetoric", 4, `Three kinds of room: a room that is lying, a room that is telling the truth, and a room that has not been told which to be yet. This is the third. Say your first sentence carefully.`),
        J("doublethink", 4, `It's only a radio station. Look at it. Valves and cables. The work of tired engineers, no more sinister than a bakery. Whatever you think it does is something you were told by a boy in a boiler room. Isn't it comforting to be sure?`, { effects: [{ surv: 1 }] })
      ],
      choices: [E("Start looking around."), X("Speak to the engineer.", "tomas"), X("Speak to the guard.", "brune")]
    })
  }
},

// ===================== RELAY_DOOR =====================
relay_door: {
  title: "The Relay Gate",
  start: [
    { cond: "flag.relay_access", node: "open" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `The gate to District Relay No. 4 is a steel door set into a concrete wall painted the colour of a recently apologised-for war. Over it a brass plate: DISTRICT RELAY No. 4. MINISTRY OF QUIET HOURS. AUTHORISED PERSONS ONLY. SILENCE OBSERVED. Beside it an intercom grille the shape of an ear, and above the lintel a small glass dome, which is a camera, or a lamp, or a very patient eye.\n\nThe door does not have a handle. It has the idea of a handle, in the place where a handle would be, as a rebuke.`, {
      voices: 3,
      interjections: [
        J("authority", 5, `You have walked through a hundred doors by deciding that you are the sort of person to whom doors open. This one has heard that line before. It is a Ministry door. It does not believe in sorts of people. It believes in lists.`),
        J("senses", 4, `A hum through the steel, so low your knuckles itch. And a sweet-sour smell at the hinge: engine oil and, under it, the exact smell of bread-crust. Somebody inside bakes. Somebody inside is trying to be a person.`),
        J("slip", 4, `The wall is topped with glass. The door is steel. The camera dome has a blind sector low on the left, behind the downpipe. Where there is a downpipe there is a way. There is always a way. There is rarely a way you will like.`),
        J("sleight", 4, `A door like this has two weaknesses: the lock, and the person who locks it. Ten cheerful thieves vote for the person.`),
        J("archive", 4, `Regulation 9 of Order 44/Q: visitors to a relay are to present (a) a Relay Pass, (b) an Inspector's Card, or (c) written invitation countersigned by a Quiet Officer. Failing (a)-(c), the visitor shall be 'quietly accommodated'. The regulation does not say where.`)
      ],
      choices: [
        C("Show the forged pass.", "pass_forged", { cond: "has('forged_pass')" }),
        C("Present the Relay Pass.", "pass_real", { cond: "has('relay_pass')" }),
        C("Present the Inspector's card.", "pass_card", { cond: "has('inspector_card')" }),
        C("Press the intercom and say Inspector Voss sent you.", "invited", { cond: "flag.voss_invited" }),
        C("Chalk Ostrov's mark on the door frame.", "chalk", { cond: "has('chalk_stub')", once: true }),
        C(`Press the intercom and say: "The lamp is lit."`, "chalk", { cond: "flag.lamp_phrase" }),
        C("Press the intercom and say something else entirely.", "intercom"),
        C("Walk the wall and look for the way round.", "wall"),
        C("Stand up straight. Wear your authority like a coat.", "bluff", { cond: "has('warden_badge') || has('vanguard_armband')" }),
        C("The patrol has gone to the queue. The gate is unwatched.", "riot_gap", { cond: "flag.queue_riot && !flag.relay_access" }),
        E("Walk away from the door.")
      ]
    }),
    open: N("narrator", `The gate is unlatched. Beyond it, a corridor, a hum, and a guard who has decided not to see you for the time being. You have the right kind of paper or the right kind of silence. In this country they are the same currency.`, {
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] }), E("Not yet.")]
    }),
    pass_forged: N("narrator", `You slide the pass into the slot beneath the grille. For a long time nothing happens, and you picture an old clerk behind the steel holding the card to the light, tilting it, sniffing it, deciding which of his three superstitions to apply. The stamp is Dov's work, or Nadia's: a little too round, a little too keen, the stamp of someone who loves stamps more than the State does.\n\nThe lock clunks. A voice that has had no sleep says: "Come through. Don't touch anything. Wipe your feet. We have a cat."`, {
      onEnter: [{ set: "relay_access", val: true }, { surv: 4 }, { note: "task_relay", text: "Got past the Relay gate on a forged pass. The paper will hold until somebody checks the serial number against a list, which, in this country, is never and always." }],
      interjections: [
        J("sleight", 4, `A forgery is just a truth that arrived early. Be proud. It is beautiful work.`, { once: true, effects: [{ xp: 1 }] }),
        J("archive", 5, `Serial number 44-Q-0719. The real 0719 was issued to an engineer in Vorsk who died in the spring. The forger has resurrected him, without his permission, for a gate pass. It is, technically, the best thing the State has ever done for him.`)
      ],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    pass_real: N("narrator", `The pass is a real one, which makes it more suspicious than the forgery would have been. The door unlatches with a politeness that tells you someone has already phoned ahead and said: a young person with the proper paper is on the way, and has been expected for some time.`, {
      onEnter: [{ set: "relay_access", val: true }, { surv: 2 }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    pass_card: N("narrator", `You hold the Inspector's card up to the dome, face out, the way Voss held it for you: not as a request but as a weather forecast. The camera does nothing for a long time. Then the latch lifts, and an unseen voice says, with the tired respect of a man who has seen the real thing and knows what it costs, "Sir. Madam. Sorry. Come through."\n\nYou have been promoted by a piece of cardboard. It will not be the last time this country does that to someone.`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_brune_authority", val: true }, { set: "relay_safe", val: true }, { surv: 3 }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    invited: N("narrator", `You press the button. The grille clears its throat. "Name?" You give it. A pause, a shuffling of paper, and then a voice that has a lot of practice at sounding bored in a way that conceals a sudden spike of fear: "Inspector Voss rang ahead. You are to be admitted and shown anything you like. We are to be, and I quote, 'as helpful as the Ministry's discretion allows'. Come through. Please don't tell him I was rude."\n\nThe lock opens. It feels, in a way you cannot explain, like being ushered into a net by a very kind hand.`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_brune_authority", val: true }, { set: "relay_safe", val: true }, { surv: 3 }, { note: "task_relay", text: "Voss's name opened the Relay gate. Anything I see inside, he will know I saw. That is probably the point." }],
      interjections: [
        J("instinct", 5, `He wants you in there. Nobody invites a stranger into a place like that unless they want something to be learned, or want to learn what you do with it. Both are tests. You have to pass one of them.`),
        J("empathy", 4, `The man at the grille was afraid of Voss. Not of what Voss would do: of what Voss would be sorry about. That is a different kind of fear, and a much more tiring one.`)
      ],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    chalk: N("narrator", `You take the yellow stub from your pocket and, on the frame, low down where nobody looks, you draw the mark you have seen twice now: a circle with a single bar through it. A door with a stripe. Ostrov's signal. The Undercurrent's idea of a handshake.\n\nThe grille is silent for so long that you start to think you have been rude to a ghost. Then, very quietly, a voice: "Where did you get that?" You say a man gave it to you. "He's dead." "I know." The silence changes colour. The latch lifts. "Quick. Before the cat gets out."`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_tomas_expects", val: true }, { surv: 2 }, { note: "task_relay", text: "Ostrov's chalk mark opened the Relay gate. Somebody inside was waiting for it. Somebody inside knew him." }],
      interjections: [
        J("empathy", 4, `The voice cracked on 'dead'. He is the kind of man who has not said the word aloud in three days and is surprised to find it still works.`, { once: true, effects: [{ xp: 1 }] })
      ],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    intercom: N("narrator", `You press the button. It makes a flat, unhappy buzz, like a wasp in a tin. After a while the grille says, "Yes?" The voice is heavy, male, bored, and has been rehearsing being bored for a long time so that it will be ready when something frightening comes.\n\n"State your business, or state that you have none. Either is acceptable. Nothing in between."`, {
      interjections: [
        J("rhetoric", 5, `A good lie is a short truth with a flag on it. Pick a flag.`),
        J("charm", 4, `He sounds lonely. A door-voice that long on duty is a man who would like to be asked about his day. It is a terrible thing to know, and a useful one.`)
      ],
      choices: [
        K("Say you are bringing the engineer his washing. Something dull. Something that cannot be argued with.", "rhetoric", 12, "relay_door_dull", "i_pass", "i_fail", { white: true }),
        K("Be warm. Ask the voice how long his shift has been.", "charm", 11, "relay_door_charm", "i_pass2", "i_fail", { white: true }),
        K("Use the official voice: the State's own, the one it taught you.", "doublethink", 12, "relay_door_official", "i_pass3", "i_fail", { white: true }),
        E("Say 'wrong door' and walk away.", { effects: [{ surv: -1 }] })
      ]
    }),
    i_pass: N("narrator", `"Washing." A long silence. "We don't have washing. We have... " The voice tries to find an objection and, to your great delight, can't. "Fine. Fine. It's the dull ones that get you, isn't it. Come through. Leave it by the door. Do not ask about the cat."`, {
      onEnter: [{ set: "relay_access", val: true }, { surv: 3 }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    i_pass2: N("narrator", `"Sixteen hours," says the grille, and sounds astonished to hear itself say it. "Since Monday, if you count the nap. Nobody asks. They ask the time, or what I'm doing, or whether the dial is right. Nobody asks how long." A cough. "You've got a good voice. Don't waste it. Come through. I'll put the kettle on if the kettle isn't dangerous."`, {
      onEnter: [{ set: "relay_access", val: true }, { surv: 2 }, { set: "relay_brune_charmed", val: true }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    i_pass3: N("narrator", `You say it in a voice not your own: flat, courteous, entirely free of the information that you exist. "Student inspection visit under Order 44/Q, sub-clause 3. Scheduled. Please admit." You do not know what the clause says. The voice that taught you does.\n\nThe lock opens. The voice at the grille says, almost kindly, "Of course. Sorry. You're early. Come through."`, {
      onEnter: [{ set: "relay_access", val: true }, { surv: 5 }, { ideo: "vanguard", n: 1 }],
      interjections: [J("doublethink", 3, `See? Not a lie. A form of words. And forms of words are what the State is made of, and you are a loyal citizen of the State, so you may use them without consequence. Consequences, you will find, are mostly for people who do not know the words.`, { effects: [{ surv: 2 }] })],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    i_fail: N("narrator", `"No," says the grille, in the voice of a man who has found a procedure he can hide behind. "Nobody scheduled. Nobody expected. Go away, or I report you for loitering at a Ministry installation, and I will be so tired when I do it that the paperwork will be very, very long." A click. The dome above you tilts a degree to get a better look at your face.`, {
      onEnter: [{ surv: 6 }, { set: "relay_door_failed", val: true }],
      choices: [C("Think again.", "a"), E("Walk away.")]
    }),
    wall: N("narrator", `The wall runs along the east side of the avenue for sixty metres, topped with a crown of green glass like the teeth of an ambitious animal. Behind the downpipe, where the camera cannot see, there is a drainage hatch at the foot of the concrete, a crawl-space for the winter melt. It is exactly the size of a student with a thin coat and a thin conscience.\n\nA brass nameplate beside the hatch says COAL. Someone has painted over it; the paint has peeled; the word has come back, the way words do.`, {
      interjections: [
        J("slip", 5, `A hatch is a decision somebody left behind. You can go through it. You will get dirty. You will remember being dirty for a long time. It is a small price.`),
        J("reflex", 4, `The camera dome sweeps left to right every eleven seconds. You can count it. You have been counting things all your life without telling anyone.`),
        J("the_grey", 3, `The hatch is mine, you know. Rain gets in. I have been gnawing the hinge for a decade. A good rust is a patient friend.`)
      ],
      choices: [
        K("Crawl through the coal hatch.", "slip", 14, "relay_door_hatch", "wall_pass", "wall_fail", { white: true }, { cond: "!flag.relay_hatch_known" }),
        K("Use Osk's keys: the hatch has a padlock, and you have the key.", "slip", 8, "relay_door_hatch_key", "wall_pass", "wall_fail", { white: true }, { cond: "flag.relay_hatch_known" }),
        C("Back off. It is not worth the knees.", "a")
      ]
    }),
    wall_pass: N("narrator", `Eleven seconds. You have them. The hatch swallows you like a child's secret, and for a long dark minute there is only coal-smell and the wet iron breath of an old pipe. Then your hands find a grille, and the grille lifts, and you are on your knees on a metal floor in a warm room full of humming, behind the generator, with soot on your face and an enormous, shameful pride.\n\nNobody has seen you. Nobody has the slightest idea. In a few seconds you will have to decide how to stand up.`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_unseen", val: true }, { set: "relay_safe", val: true }, { xp: 2 }, { set: "relay_hatch_used", val: true }, { note: "task_relay", text: "Got into the Relay by the old coal hatch, unseen. Nobody knows I am here, which is the most valuable thing I have ever owned." }],
      choices: [E("Rise.", { effects: [{ goto: "relay", x: 11, y: 8 }] })]
    }),
    wall_fail: N("narrator", `The hatch cover scrapes. Not loudly. Just enough: the sound of a small sheet of metal telling a large building a very small secret. The camera dome halts mid-sweep. You are on your belly, in the dirt, in the full pale light of a Ministry lamp, and a voice from above says in a flat, interested tone, "Don't move. Please don't move. I am required to ask you what you are."\n\nYou stand up. There is nothing else to do with the dignity you have left.`, {
      onEnter: [{ surv: 10 }, { hp: -1 }, { set: "relay_door_failed", val: true }, { set: "relay_alerted", val: true }],
      choices: [C("Say something reasonable.", "a"), E("Run.")]
    }),
    bluff: N("narrator", `You pin the badge where the camera can see it. It catches the light, a small brass profile of a stern benevolence. You stand with your weight back, your chin level, and you address the dome the way the Warden himself might address a fly. "Open this door."\n\nThere is a long silence in which you can hear every one of your possible lives. Then, from the grille, in a voice that is trying very hard to be neither rude nor insubordinate, "Yes. Of course. Sorry. We weren't informed."\n\nNobody ever is. It is the great secret of authority.`, {
      interjections: [J("authority", 4, `Not bad. Not bad at all. Do it again and mean it.`)],
      choices: [
        K("Hold your nerve. This is the moment.", "authority", 11, "relay_door_bluff", "bluff_pass", "i_fail", { white: true }, { effects: [{ surv: 2 }] })
      ]
    }),
    bluff_pass: N("narrator", `The latch lifts. The voice, in the grille, has acquired a faint tremor, and a new way of saying 'sir' that is also a way of saying 'please do not remember me'. You are in. You could, you realise, get used to this, and that is the problem with it.`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_brune_authority", val: true }, { surv: 5 }, { ideo: "vanguard", n: 1 }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    }),
    riot_gap: N("narrator", `Down at the other end of the avenue the shouting has not stopped. The two guards who normally stand beneath the dome have gone to see. Somebody's string bag is in the road. Somebody is chanting a word that starts as a complaint and is becoming a slogan.\n\nThe relay gate is unwatched, unattended and, for the length of a good riot, unlocked in every way that matters. The intercom is still on. Through it, somebody inside is saying, faintly, "What's that noise? Brune? BRUNE?" Nobody answers. The door has a handle, now. It always did.`, {
      onEnter: [{ set: "relay_access", val: true }, { set: "relay_unseen", val: true }, { set: "relay_safe", val: true }, { xp: 1 }, { set: "relay_via_riot", val: true }, { note: "task_relay", text: "Walked into the Relay while the ration queue rioted at the other end of the avenue. Whatever the queue pays for this, I owe it a debt." }],
      choices: [E("Go in.", { effects: [{ goto: "relay", x: 3, y: 8 }] })]
    })
  }
},

// ===================== S_POSTERS =====================
s_posters: {
  title: "The Poster Wall",
  start: "a",
  nodes: {
    a: N("narrator", `Poster upon poster upon poster: you could carbon-date the Union by the glue. The top layer, still tacky, is three days old and shouts in red and gold: THE JUBILEE. THURSDAY, 20:00. GRAND HARMONY: A GIFT FROM THE WARDEN TO HIS PEOPLE. ALL CITIZENS WILL BE PRESENT. Beneath it, torn at one corner, the older poster of the Pioneer in a blue neckerchief, aged about nine, aged forever. Under that, in a faded green: WHERE WERE YOU ON THE NIGHT OF THE NINTH? Under that, a woman's hand holding a hand, a quarter-inch of the original lettering showing: HUNGER IS TEMPORARY.\n\nSomebody has been at the wall with a knife. They have cut the Jubilee poster in a neat narrow strip, as though to read what is underneath, and then stopped.`, {
      onEnter: [{ thought: "th_grand_harmony" }, { note: "task_jubilee", text: "A poster on Karsov Avenue: THE JUBILEE, THURSDAY, 20:00. GRAND HARMONY: A GIFT FROM THE WARDEN. ALL CITIZENS WILL BE PRESENT. 'All citizens' is a phrase I would like to see defined." }, { task: "task_jubilee", state: "active" }],
      voices: 3,
      interjections: [
        J("rote", 3, `ALL CITIZENS WILL BE PRESENT. Seven words. Fourth Great Decree, article two: Attendance at the Warden's Rejoicings is a Right of the People, enforced by the People.`),
        J("archive", 4, `A Jubilee is declared every twenty-five years. The last was the Year of Steady Hands. The posters then said 'ALL CITIZENS WILL BE JOYFUL'. The Archive, which keeps everything, has no record of anyone being unjoyful. Nor, now that you think about it, of that year's Tuesday.`),
        J("dialectics", 5, `Present for what? A gift is something you may refuse. A gift you are obliged to be present at is a tax with ribbons.`),
        J("senses", 4, `Under the paste, a smell of old flour. Whoever stuck these up used the ration paste, the cheap grey one: it will not hold in rain. They know it will not hold. Nobody was supposed to read these for very long.`),
        J("the_grey", 3, `Every poster is a face the city has worn. I have hundreds of faces. I am only ever wearing the newest one.`)
      ],
      choices: [
        K("Peel back the cut strip and read what is underneath.", "archive", 10, "s_posters_peel", "peel_pass", "peel_fail", { white: true }),
        C("Study the Jubilee poster's small print.", "small"),
        E("Move on.")
      ]
    }),
    small: N("narrator", `The small print at the foot of the Jubilee poster: ISSUED BY THE MINISTRY OF QUIET HOURS, CHANCELLERY BUREAU 9. BY THE ORDER OF THE WARDEN, A GRAND HARMONY WILL BE TRANSMITTED THROUGH ALL DISTRICT RELAYS, COMMENCING AT TWENTY HOURS, DURATION: ONE HOUR. ATTENDANCE IS COMPULSORY OUT OF DOORS FOR CITIZENS UNDER THIRTY-FIVE. ELDERLY AND SICK MAY ATTEND FROM A WINDOW. REFRESHMENTS WILL BE PROVIDED.\n\nRefreshments. They have thought of refreshments. Whoever wrote this is a person with a mother.`, {
      onEnter: [{ set: "street_jubilee_read", val: true }, { xp: 1 }],
      interjections: [
        J("instinct", 5, `Out of doors. Under thirty-five. That is everyone who might remember something in a way that matters. The old and the sick are allowed windows. They want the ones who will be doing the remembering in the open air, where the sound travels.`),
        J("empathy", 4, `Whoever wrote 'refreshments' meant it kindly. That is the part that makes your skin crawl. They meant it kindly.`)
      ],
      choices: [C("Back to the wall.", "a"), E("Move on.")]
    }),
    peel_pass: N("narrator", `You get a thumbnail under the cut and peel. The grey paste gives with the soft cry of old gum. Beneath the Jubilee is a notice the size of a postcard, officially printed in the plain black of the Chancellery, no slogan, no ornament:\n\nTHE QUIET HOURS ACT, 14TH AMENDMENT. Section 3(c): Any District Relay may, at the discretion of the Minister, issue a Remembrance Reduction of up to Seventy-Two (72) hours to the whole of a District, for the purpose of Civil Peace. No citizen shall be informed in advance (Section 9).\n\nSomebody has underlined Section 9. In pencil, in a small, firm hand. Somebody else has written under it, in chalk, two words: THEN WHY THIS?`, {
      onEnter: [{ set: "knows_72_hours", val: true }, { set: "knows_static", val: true }, { xp: 2 }, { note: "task_jubilee", text: "Quiet Hours Act, 14th Amendment, Section 3(c): a Relay may erase up to 72 hours from a whole District. Section 9: no one will be told. The Jubilee poster IS the telling. The Warden has told us. Which means it is a funeral, and they want us to dress for it." }],
      interjections: [
        J("dialectics", 4, `If Section 9 forbids notice, then the poster is illegal. If the poster is legal, Section 9 is amended. If the Warden is above both, then neither paragraph is a law: it is a mood. Take the mood seriously.`),
        J("volition", 5, `Seventy-two hours. Since Monday. Since the hoop and the Commissar and the Ledger and everything you have learned. All of it, to be wiped in a single hour with refreshments. Do not scream. There is a woman looking.`),
        J("solidarity", 4, `We would not remember each other. That is the real horror. Not that we would forget the bad things, but that we would forget the people we held on to when they happened.`)
      ],
      choices: [C("Back to the wall.", "a"), E("Move on.")]
    }),
    peel_fail: N("narrator", `The paste has set like old toffee. The corner tears and comes away in your hand with a half-line of print: ...SECTION 3, THE MINISTER MAY... and nothing after. A woman in the queue turns her head. She does not look at you. She looks at your hand, then at the wall, then at the road, in the manner of a person making a note of nothing.`, {
      onEnter: [{ surv: 3 }],
      choices: [C("Back to the wall.", "a"), E("Move on.")]
    })
  }
},

// ===================== S_KIOSK =====================
s_kiosk: {
  title: "The Newspaper Kiosk",
  start: "a",
  nodes: {
    a: N("narrator", `A kiosk the colour of a boiled sweet, with a hatch and a counter and a small tin roof that has tried its whole life to be a hat. Newspapers hang from the awning on clothes-pegs: the Daily Concord, the Karsovian Hour, the Pioneer's Herald, all three printed from the same lead by the same tired man in the same afternoon. The headlines are very certain. THE COMMISSAR'S TRAGEDY: A NATION MOURNS. FLOUR OUTPUT AT THREE-YEAR HIGH. WARDEN HEARS CHILDREN'S SONGS, PRONOUNCES THEM SWEET.\n\nBehind the counter, an old man in a flat cap sits with his back to the street, bent over a radio with its guts out. A hand-lettered card: REPAIRS. NO QUESTIONS ABOUT WHAT. NO ANSWERS EITHER.`, {
      voices: 3,
      interjections: [
        J("rote", 3, `THE WARDEN HEARS. THE WARDEN HEARS. The hanging newspaper clips together under the awning like a prayer wheel.`),
        J("deduction", 4, `Three papers; one lead block. The same story with different adjectives. Wherever a word differs, the first paper says 'tragedy', the second 'tragic accident', the third 'tragic and unstable man'. A drift in the account, as a drift in a river: in the third it has already become his fault.`),
        J("senses", 4, `Solder smoke and linseed oil. Under the counter, the faint glow of a glass valve, kept warm like a pet.`),
        J("appetite", 3, `Sugar. Somebody has a sugar-twist in the till. You can smell it through the metal. Do not ask. Ask. No. Ask.`)
      ],
      choices: [
        C("Read the headlines more closely.", "papers"),
        X("Speak to the old man.", "gregor"),
        E("Leave.")
      ]
    }),
    papers: N("narrator", `You read what the three papers say about the Commissar, and then you read what each does not say. The Daily Concord: no mention of the portrait. The Karsovian Hour: no mention of the rope. The Pioneer's Herald, in an item of four lines at the foot of page five, a paragraph under THE LOST BELL OF STANCE VILLAGE, mentions a 'Vanguard enforcer' commended for 'conspicuous vigilance during a regrettable event'. Not named. Not needed.\n\nUnder the horoscope in the Concord, in the space where they once put the weather, a small boxed notice: NO WEATHER TODAY. THE WARDEN IS PREPARING A DAY OF PERFECT CALM.`, {
      onEnter: [{ xp: 1 }, { set: "street_papers_read", val: true }],
      interjections: [
        J("dialectics", 4, `They commend someone for vigilance; therefore someone was vigilant; therefore there was something to be vigilant about. It is in the paper that it was not a suicide. It is in the paper that they were afraid of someone. The lie contains its own refutation.`),
        J("doublethink", 3, `Perfect calm! Isn't it kind? They are taking away the weather so that you will not be unsettled by it. How considerate. Say thank you to the paper.`),
        J("archive", 4, `'NO WEATHER TODAY' has been printed on this date, in this column, four times in the last twenty-five years. Each time, the nights that followed are the ones with no records. The coincidence has a coincidence.`)
      ],
      choices: [C("Back to the kiosk.", "a"), E("Leave.")]
    })
  }
},

// ===================== S_TRAM =====================
s_tram: {
  title: "The Tram Stop",
  start: "a",
  nodes: {
    a: N("narrator", `A tin shelter with a green bench, a pole, and a clock that has stopped at twenty to nine for so long that it has become a fixed opinion. The tram wires hum overhead. The timetable behind a cracked glass front lists the Line 9 trams in careful Union typeface: 06:05, 07:10, 08:15... every sixty-five minutes, to Cinder Street and back, as though the city had a pulse and it had been told to take it slowly.\n\nAt the bottom, a smaller notice in the typeface of the rail authority's secretaries: NIGHT SERVICE (Line 9N): Suspended until further notice. Someone has scratched out 'suspended' and put, in pencil, 'cancelled', and someone else has scratched out 'cancelled' and put 'DELAYED'. A fourth hand has added: 'ASK NADIA'.`, {
      voices: 2,
      interjections: [
        J("archive", 4, `Line 9N: the night tram. Withdrawn from public timetables nine years ago 'pending track maintenance'. The track has not been touched. The overhead wire is, however, regularly oiled by a man whose name is not on any list. You can tell. Wires that nobody uses go green. This one is bright as a violin string.`),
        J("senses", 4, `Under the bench, a flattened tin of fish and a crumpled bus transfer. Both fresh. Somebody has been waiting here, at night, in the dark, for something that is not on the timetable.`),
        J("the_grey", 4, `I know what the wires are for. They hum differently at night. A tune you could cross a border on.`),
        J("instinct", 4, `The stop is watched. You cannot see who, but you can feel the weight of it, the way you feel someone reading over your shoulder. A kind watching: the kind that is trying to decide if you are safe.`)
      ],
      choices: [
        C("Read the scratched-out notice again.", "notice"),
        C("Ask about the night tram.", "ask"),
        E("Leave the stop.")
      ]
    }),
    notice: N("narrator", `ASK NADIA. In pencil, with the 'A' written very carefully, the way you write a word that has been important to you. Behind the cracked glass, a thin pale thing has been tucked into the frame: a printed token, old, small, brass, no bigger than a coat button, stamped with a tram and a bell. The kind a conductor gives to a passenger who has paid the real fare. It is not a coin. It is a promise.`, {
      onEnter: [{ set: "tram_notice_read", val: true }],
      interjections: [
        J("sleight", 5, `It is right there. The glass is cracked at the corner, and a thin hand could...`, { cond: "!has('tram_token') && !flag.tram_token_taken" })
      ],
      choices: [
        K("Slide the token out through the crack.", "sleight", 10, "s_tram_token", "token_pass", "token_fail", { white: true }, { cond: "!flag.tram_token_taken" }),
        C("Leave it. It is someone else's promise.", "a")
      ]
    }),
    token_pass: N("narrator", `The glass makes a thin protest. The token slides into your palm, warm from somebody else's hope. TRAM TOKEN, it says on one side, and on the other, in letters so small you need your fingernail to find them, 9N. You do not know who put it there or who is meant to find it. You have the sense, absurdly, of having been chosen as a successor.`, {
      onEnter: [{ give: "tram_token" }, { set: "tram_token_taken", val: true }, { xp: 1 }, { thought: "th_tram_wires" }],
      choices: [C("Back to the stop.", "a"), E("Go.")]
    }),
    token_fail: N("narrator", `The crack closes on your fingernail. A pair of Vanguard cadets at the corner turns toward the sound with the instant, sweet curiosity of beagles. You take your hand away and become interested in a pigeon. They watch you being interested. After a while, they decide a pigeon is not worth the paperwork, and move on.`, {
      onEnter: [{ surv: 3 }],
      choices: [C("Back to the stop.", "a"), E("Go.")]
    }),
    ask: N("narrator", `There is no one to ask but the clock, and the clock has an opinion: twenty to nine, always twenty to nine. A bench-sitter in a headscarf, who has been there throughout, shifts a little to make room, and says without looking up, in the tone of someone reciting a recipe: "The night tram goes when the Bell stops. Thursday, if it goes at all, it goes at a quarter to nine. Ask Nadia. She counts the heads. Don't ask her for a seat. Ask her what's the fare."`, {
      onEnter: [{ set: "tram_thursday_known", val: true }, { task: "task_exodus", state: "active" }, { note: "task_exodus", text: "The night tram (Line 9N) may run on Thursday at a quarter to nine, just after the Jubilee. Ask Nadia Fell what the fare is. Do not ask for a seat." }],
      interjections: [
        J("empathy", 4, `She is going. She has a bag under the bench. A small bag with a bird's cage-cloth over it. She does not know she is telling a stranger the single most dangerous thing she knows, because she has decided that you are someone who would not use it.`)
      ],
      choices: [C("Back to the stop.", "a"), E("Go.")]
    })
  }
},

// ===================== S_RELAYGATE =====================
s_relaygate: {
  title: "The Relay Station",
  start: "a",
  nodes: {
    a: N("narrator", `A low concrete building the colour of a filed-down tooth sits at the north end of the avenue, behind a wall topped with green glass. There is no sign of life but for the steel gate, a camera dome and the vibration, so faint you may be imagining it, that makes the puddle at the kerb shiver in a perfect, regular circle, like a thought about to be had. A brass plate: DISTRICT RELAY No. 4. A smaller plate: SILENCE IS A SERVICE.\n\nOver the wall, a lattice mast goes up into the grey. From its top, a thin red light blinks, once every second, a pulse you have heard before. You heard it last night. You heard it every night. You heard it at the exact moment you stopped being the person you were.`, {
      onEnter: [{ set: "street_relay_seen", val: true }, { note: "task_relay", text: "District Relay No. 4, at the north end of Karsov Avenue: the Bell is born here. The gate has no handle. Paper, a name, a lie, or a hatch." }, { task: "task_relay", state: "active" }],
      voices: 3,
      interjections: [
        J("senses", 4, `The puddle's ripple is at nine hertz. Your ringing, if you listen, is nine hertz too, give or take. The place and you are on the same note, and have been for ten years. It was never a fever, then. It was a tuning.`),
        J("deduction", 5, `Two guards on the gate in the morning, one at noon: the shift is thin. The camera sweeps every eleven seconds. A shift change at 14:00, and the delivery van comes at six, when the engineer eats. Three weaknesses: one of them human.`),
        J("the_grey", 3, `I carry the hum into every wall. Put your ear against a wall in District 9 and listen. That's him, the little engineer, in there, turning dials like beads. He is very tired. I can tell from the pulse.`),
        J("instinct", 4, `Do not stand here for too long. The dome has noticed the one student on the avenue who is looking at the one building on the avenue that nobody looks at.`),
        J("authority", 4, `A man could walk up to that gate with the right posture and a clipboard and be admitted in five minutes. A woman could do it in three. The trouble is finding the clipboard.`)
      ],
      choices: [
        C("Walk up to the gate and look at it more closely.", "gate"),
        C("Note the camera and the guard rota.", "rota"),
        E("Go.")
      ]
    }),
    gate: N("narrator", `Up close, the gate has a grille in the shape of an ear and a slot below it, just the right size for a letter, a form, or a hand. There is a patch of paint on the concrete beside it that is a shade lighter than the rest: somebody has recently removed a sign, or a mark. On the frame, low and to the left, there is a faint ghost of chalk where a small circle with a bar was drawn and then rubbed away by a careful thumb.\n\nThe mark is Ostrov's. He was here. This is where the Ledger's numbers came from.`, {
      onEnter: [{ set: "relay_ostrov_mark", val: true }, { xp: 1 }, { note: "task_relay", text: "Ostrov's chalk mark was on the Relay gate, rubbed out. He had a contact inside. If I draw it again, it might open." }],
      interjections: [
        J("deduction", 4, `The mark is two days old. Someone inside rubbed it, from the INSIDE, through the slot, with a bare thumb. A cautious person. A frightened person. Not a guard: guards do not rub out chalk. They report it.`)
      ],
      choices: [C("Try the gate.", "tryit"), C("Step back.", "a"), E("Go.")]
    }),
    tryit: N("narrator", `You stand where the dome can see you and put your hand on the empty place where a handle should be. The door doesn't care. It has the cold, level indifference of a door that has been told its job is to be shut. A small voice at the back of your head, the one that says it is only a door, has not yet learned that doors in this country are the last honest things.`, {
      effects: [{ surv: 2 }],
      choices: [{ text: "Use the intercom. (Open the gate dialogue.)", dialogue: "relay_door" }, E("Step back and go.")]
    }),
    rota: N("narrator", `You do it the way you would count the stairs in a building you may have to leave in a hurry. Two guards at the gate until nine, one afterwards: a Captain, if the epaulettes are right, on the heavy side, who stands with his hands folded in front of his belt like a man at a funeral he is not sure is his. A van at six. A woman at noon who brings a pail of something and goes in without being asked, which makes her a cook, or a wife, or both. The camera: eleven seconds. The downpipe: a blind sector.\n\nIt is not a plan. It is the raw bread of one.`, {
      onEnter: [{ set: "relay_rota_known", val: true }, { xp: 1 }, { note: "task_relay", text: "Relay rota: a Captain on the gate, camera sweeps every eleven seconds, a blind sector behind the downpipe, a coal hatch on the east wall. A lot of ways in. All of them have a person at the end." }],
      choices: [C("Back to the gate.", "a"), E("Go.")]
    })
  }
},

// ===================== S_CAR =====================
s_car: {
  title: "The Black Car",
  start: [
    { cond: "flag.voss_exposed", node: "after_exposed" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `The car is a State Inspectorate saloon, though its paint is Chancellery black, which is a different black: the black of a door that opens only inward. Nothing in the windows. Nothing on the seats but a folded coat and a child's mitten, red, one-fingered, clipped to the dashboard with a bulldog clip like a document of the highest classification.\n\nThe driver's door is locked. The glove-box is not visible. The boot has a small brass plate: PROPERTY OF THE STATE. DO NOT FOLLOW.`, {
      voices: 3,
      interjections: [
        J("senses", 4, `The seats smell of pipe tobacco that nobody smokes, and something older: coal-tar soap and fresh bread. A child's smell, ten years old, preserved like a flower in a book.`),
        J("empathy", 4, `The mitten is not a prop. It has been held. The wool at the thumb is rubbed almost through. Somebody has gripped this in a fist, on a long night, and then put it somewhere visible, where he would see it every time he turned the key.`, { effects: [{ set: "voss_mitten_seen", val: true }] }),
        J("deduction", 4, `Mileage clocked: two thousand kilometres in a week. This man does not live in Tarnov. He has not come for you. He is on a circuit. There are other districts, other Wednesdays, other Commissars.`),
        J("sleight", 4, `The passenger door is locked. The back window has a rubber seal that has not been loved for years. Ten cheerful thieves and a bent spoon.`, { cond: "has('bent_spoon')" }),
        J("instinct", 4, `Do not stay by the car. The owner is thirty metres away and is not looking at you at all, which is how you can tell he is.`)
      ],
      choices: [
        K("Pick the lock and look in the glove-box.", "sleight", 13, "s_car_glovebox", "glove_pass", "glove_fail", { white: false }, { cond: "!flag.s_car_searched" }),
        K("Read what you can through the window without touching it.", "senses", 10, "s_car_read", "read_pass", "read_fail", { white: true }),
        X("Walk over and speak to the owner.", "voss"),
        E("Move away from the car.")
      ]
    }),
    glove_pass: N("narrator", `The lock is a polite one. You open it with the kind of care you would use on a sleeping child's hand. Inside the glove-box, there is a tin of ration-tea, a street map of District 9 with seven red circles and one blue, a thermos lid, a tin of boiled sweets, and a slim brown folder stamped with the black bell: MINISTRY OF QUIET HOURS. FORM Q.\n\nYou get twelve seconds. In the folder, a typed card: SUBJECT: VORAN, S. (STUDENT). DISTRICT 9. RESISTANCE TO HARMONY: PROBABLE (tinnitus, childhood fever). RECOMMEND: MONITOR; OFFER; DISSOLVE. FIELD OFFICER: H. VOSS, Q.O. (D9). The last word is underlined. The underlined word is 'OFFER'.`, {
      onEnter: [{ set: "s_car_searched", val: true }, { set: "voss_file_seen", val: true }, { set: "voss_knows_resist", val: true }, { xp: 2 }, { surv: 3 }, { note: "task_voss", text: "In Voss's glove-box: Form Q. He knew I was Static-resistant before he saw me. His title: Quiet Officer, District 9. His recommendation: MONITOR; OFFER; DISSOLVE. They underlined 'OFFER'. He is not here to close a case. He is here to recruit one." }, { thought: "th_inspector_charm" }],
      interjections: [
        J("dialectics", 4, `Monitor. Offer. Dissolve: three verbs in ascending order of irreversibility. The question is what happens when the second one is declined.`),
        J("volition", 5, `Close the glove-box. Do it now. Not because of fear: because you have now seen too much to be able to un-see it, and the only dignity left in this country is to have chosen what to see.`, { once: true, effects: [{ morale: 1 }] })
      ],
      choices: [C("Close it and step away.", "away")]
    }),
    away: N("narrator", `You lock it, step back and compose a face. From thirty metres away, a man in a dark coat who has not looked at you once raises his tea very slightly and drinks. Or you imagine it. It is possible you will spend a good deal of the rest of the day imagining it.`, {
      choices: [E("Walk off, casually, and very much on purpose.")]
    }),
    glove_fail: N("narrator", `The pick is a half-turn short. There is a small, soft, intimate click, not of the lock but of something much closer to you: a hand, resting lightly on the roof of the car at your shoulder. "Don't," says a courteous voice, "feel bad. It's a very good lock. The Chancellery pays for the lock. They don't pay for much else."\n\nInspector Voss is standing beside you with his cup. He does not look angry. He looks as if you had stepped on something of his that he would have liked to keep intact.`, {
      onEnter: [{ surv: 8 }, { set: "s_car_searched", val: true }, { set: "voss_caught_you", val: true }, { set: "voss_met", val: true }],
      choices: [X("Speak to him.", "voss", { node: "caught" })]
    }),
    read_pass: N("narrator", `Through the glass you can see the dash: the mitten, a ledger of fuel stops, and a folded slip pinned beside the speedometer. The slip is a duty card; on it, in a neat hand, the address of a flat on Cinder Street and a date, circled: LAST THURSDAY OF THE MONTH. Next to it, a note in a different, younger, rounder hand: 'Papa, you forgot again.' It has been folded and unfolded so often that the creases have gone white.\n\nHe does not forget anything. That is the whole of his job.`, {
      onEnter: [{ xp: 1 }, { set: "voss_card_seen", val: true }, { note: "task_voss", text: "Pinned inside Voss's car: a child's note: 'Papa, you forgot again.' Whatever he does for the Ministry, something in him is stuck at a flat on Cinder Street." }],
      interjections: [J("empathy", 3, `Nobody pins that to a dashboard for the pleasure of it.`)],
      choices: [C("Back away.", "a"), E("Move off.")]
    }),
    read_fail: N("narrator", `Glare. Reflection. A tired student's face laid over a seat that is not there. You see yourself, and behind you the grey façade of the school, with every window turned toward the car, and in each, you could swear, a pale blur that is a face, or a curtain, or a very devoted ceiling.`, {
      choices: [C("Back away.", "a"), E("Move off.")]
    }),
    after_exposed: N("narrator", `The black car is parked as it always was, but the door on the driver's side is open, and the mitten, red, one-fingered, is on the seat where a person might have set it down in order to have both hands free. Voss is nowhere. He has, for the first time, left the car unwatched. It is either carelessness or trust, and in this country they are the same coat.`, {
      choices: [E("Leave the car alone.")]
    })
  }
},

// ===================== S_QUEUE (the ration queue riot) =====================
s_queue: {
  title: "The Ration Queue",
  start: [
    { cond: "flag.queue_riot", node: "riot_after" },
    { cond: "flag.queue_calmed", node: "calm_after" },
    { cond: "flag.queue_abandoned", node: "ignored_after" },
    { cond: "flag.queue_seen", node: "hub" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `You take your place at the end of the line, which is, in the strict sense, nowhere: it is a position, not a spot. The rope barrier bows with the weight of a hundred leaning elbows. Up close the queue has weather of its own: wet wool, boiled-cabbage breath, the hot, sour sweetness of people who have stood in one place since four in the morning for a thing that has not been confirmed to exist.\n\nAt the front, the clerk, a thin man in sleeve-guards, taps his blotter with a pencil and clears his throat in a way that makes the whole line lean in. "Citizens," he says, in the voice of a man reading his own sentence. "An announcement concerning today's allocation."`, {
      onEnter: [{ set: "queue_seen", val: true }],
      voices: 3,
      interjections: [
        J("solidarity", 3, `We know this. We know all of this. The tilt of a hundred heads. The hush, the small bodily lean of a crowd that has been told things before. We are a great animal, and we have been fed on announcements all our lives. We can still, if we choose, bite.`),
        J("empathy", 4, `Hunger is not a feeling here. It is a posture. Look at how they hold the string bags: against the chest, like infants. They are going home with a loaf or with nothing, and which one it is will decide whose house is quiet tonight.`),
        J("instinct", 5, `The two cadets at the trestle have stopped chewing. Both of them. They know something is about to be said that will land badly. They have rehearsed, in their faces, the idea of having been there only to observe.`),
        J("authority", 4, `You could take this. A calm voice, a raised hand, the first sentence. Crowds like this are tinder that would prefer to be furniture. Nobody has ever offered them a chair.`)
      ],
      choices: [
        C("Listen to the announcement.", "crunch"),
        C("Look at the people around you first.", "hub"),
        E("Slip out of the line.", { effects: [{ set: "queue_abandoned", val: true }] })
      ]
    }),
    hub: N("narrator", `The line shuffles half a pace. Around you, the queue goes on being a queue: an old woman with a folding stool and a shawl the colour of long grief; a boy in a coat three sizes too big who is holding someone's place and everyone's pity; a woman with a string bag, lips moving, counting something that is not coupons. At the head of the line the clerk keeps tapping his pencil, and the two cadets keep not looking at the sacks behind the trestle.\n\nThe announcement has not yet been made. It is, however, in the air, like a thunderstorm in a hat.`, {
      voices: 2,
      interjections: [
        J("senses", 4, `Behind the trestle, under a tarpaulin, sacks. Cotton, stencilled FLOUR, GRADE C. Six or seven. You can smell them from here, the sweet-dusty smell of something that was grown for people. The clerk keeps glancing at them and then very hard at the sky.`, { effects: [{ set: "queue_sacks_seen", val: true }] }),
        J("rote", 3, `THE QUEUE IS THE SCHOOL OF PATIENCE. THE PATIENT CITIZEN IS THE NATION'S BEST PIECE OF FURNITURE. (A poster: it is, you realise, pasted upside down.)`)
      ],
      choices: [
        C("Talk to the old woman with the stool.", "orlova"),
        C("Talk to the boy.", "pip"),
        C("Talk to the clerk.", "clerk"),
        C("Listen for the announcement.", "crunch"),
        E("Leave the line.", { effects: [{ set: "queue_abandoned", val: true }] })
      ]
    }),
    orlova: N("narrator", `She does not look round. She says to the air, in the dry voice of someone who has outlived three Wardens' worth of flour: "I'm Mrs Orlova. Eighty-seven. I stood in this queue the winter of the Hunger, and the winter after, and the winter after that, and I will tell you what is different today. Nothing. That is what is different. For fifty years they have been *adjusting* the flour and I have been *adjusting* my expectations, and between us we have worn a groove."\n\nShe pats the stool. "Sit. Everyone stands. It is a mistake. A standing woman can be moved. A seated one has to be lifted."`, {
      interjections: [
        J("empathy", 4, `She is not complaining. She is giving you a technique. In a country like this, the old do not dispense wisdom; they dispense tactics, wrapped in bad weather.`),
        J("rhetoric", 4, `A person who has queued for fifty years has heard every speech the State has to give. If you are going to move this crowd, you will not do it with a speech. You will do it with a sentence this woman has been waiting for since the Hunger.`)
      ],
      choices: [
        C("Sit on the edge of the stool.", "orlova2", { effects: [{ morale: 1 }] }),
        C("Ask what she thinks will happen today.", "orlova2"),
        C("Back to the line.", "hub")
      ]
    }),
    orlova2: N("narrator", `"Today?" Mrs Orlova takes a long, thoughtful breath. "They will say there is no flour. There is flour. They always say there is none on Wednesdays, because Wednesday is the day the Vanguard hall ovens are lit, and the hall has priority. The boys have never been hungry a day in their lives, and they are very upset about it." A wry twist of the mouth. "The clerk is a good boy. He has a mother. If someone were to point out, politely, the sacks under the tarpaulin, I think he would be very relieved. People so rarely are asked to be brave in a way that costs them nothing."\n\nHer eyes finally find yours: sharp, bright, and about ninety years too old for the rest of her. "It would have to be someone who isn't from here, dear. We are all very tired of being the ones to say it."`, {
      onEnter: [{ set: "queue_orlova_hint", val: true }, { note: "task_queue", text: "Mrs Orlova says there is flour under the tarpaulin; the Vanguard hall has priority on Wednesdays. The clerk would be relieved if someone else said it. It has to be someone who is not from the queue." }],
      choices: [C("Back to the line.", "hub")]
    }),
    pip: N("narrator", `"Pip," says the boy, before you have asked. He sticks out a hand and shakes yours with great ceremony. "I hold places. A fifth of a coupon an hour, but if you're nice it's a sixth. Mum's in the Quiet Clinic, she's got her nerves, they say it's three days, it's been nine." He says it the way you say a bus number. "That's all right. I'm keeping the place. If she's late back she'll want it."\n\nHe leans in. "The man in the black car gave me a sweet this morning. He asked who in the queue doesn't come on Wednesdays. I said everyone comes on Wednesdays. He gave me a second sweet and asked me again. I ate them both. They were very good."`, {
      onEnter: [{ set: "queue_pip_met", val: true }],
      interjections: [
        J("empathy", 5, `He is nine and he has already worked out that sweets and questions go together, and that the second sweet means the first answer was a bad one. He is not telling you out of fear. He is telling you because you looked at him as if he were someone.`),
        J("instinct", 4, `Voss is collecting the people who do not queue. Not the people who do. A man looking for the absent. That is how you find an Undercurrent: not by who comes, but by who stays home to bake.`, { effects: [{ set: "voss_collecting_absent", val: true }] })
      ],
      choices: [
        C("Give him a coupon for his trouble.", "pip2", { cond: "has('ration_coupon')", effects: [{ take: "ration_coupon" }, { morale: 1 }, { ideo: "undercurrent", n: 1 }], once: true }),
        C("Give him your sweet roll.", "pip2", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }, { morale: 2 }, { ideo: "undercurrent", n: 1 }], once: true }),
        C("Back to the line.", "hub")
      ]
    }),
    pip2: N("narrator", `Pip regards the gift with the solemn, practical delight of a child who knows exactly what it is worth in every currency. "I'll tell you something free, then, so we're even. When it goes loud, get behind the pole. The cadets always go for the people in front, not the people behind. And the clerk always runs left." He tucks it into his coat with great ceremony. "I've seen it three times."`, {
      onEnter: [{ set: "queue_pip_tip", val: true }],
      choices: [C("Back to the line.", "hub")]
    }),
    clerk: N("narrator", `The clerk is writing a number over and over on his blotter. When you stop at the trestle he looks up as a man looks up from the bottom of a well. "Next? Ah. Not yet next. Everyone is next. I'm Tallow." A small, wounded breath. "I have been instructed to say one thing and I would like very much to say a different one, and I am afraid the first thing will get shorter and louder the longer I wait."\n\nHe glances at the tarpaulin and away, like a man checking whether a hot stove is still hot. "If you want something, I'd ask the cadets. I only count. Counting, you'll find, is the safest thing a man can do in this country. Nothing I count is ever my fault."`, {
      interjections: [
        J("empathy", 5, `He is not a villain. He is a man who has built a life as a corridor: no doors, a floor, a light. The tarpaulin is a door. He has been looking at it for a month.`),
        J("archive", 4, `Clerk's Regulation 6(b): a clerk who misreports an allocation shall make good the shortfall from his own ration. He has been doing that for a month. He is, you realise, starving politely so that the Vanguard hall may be generous.`, { effects: [{ set: "queue_reg6", val: true }] })
      ],
      choices: [C("Back to the line.", "hub")]
    }),
    crunch: N("narrator", `The clerk stands. He unfolds a paper the way you would unfold a dead bird. "Citizens. By order of the Ministry of Provisions, and in honour of the coming Jubilee, flour allocation for this district is temporarily *adjusted* to zero." A noise goes through the line, not a word: a long, low, communal in-breath. "In its place, each ration-holder will receive one commemorative tin of Jubilee Tea." He lifts a tin. It has the Warden's profile on it. It is the size of a hand and the weight of a rumour. "Please form a single, orderly, line."\n\nSomebody at the back says, softly, in the clear, flat voice of a woman who has stopped being afraid: "I've had tea."\n\nThe cadets stop chewing. One of them puts a hand on his belt. The other, a girl of sixteen with a bad haircut, moves toward the old woman with the stool, to take it away from her, for the sake of order.`, {
      onEnter: [{ thought: "th_ration_riot" }, { note: "task_queue", text: "The clerk announced that today's flour is 'adjusted to zero' and replaced with commemorative Jubilee Tea. The line is about to go one way or the other. There is, I have reason to believe, flour under the tarpaulin." }],
      voices: 3,
      interjections: [
        J("adrenaline", 3, `HERE. This is HERE. Do you feel it? A hundred people just decided to stop being polite. It is the sweetest note in the world. A little shove. A little shout. Somebody throws the first thing and then it is all of us.`),
        J("solidarity", 4, `They are going to take the old woman's stool. We cannot let them take the stool. If they take the stool they take the chair, and then the table, and then the room.`),
        J("composure", 4, `Cool. Be cool. This is a crowd, not a person, and a crowd has only two moods: afraid and angrier. Choose which one you would like to be responsible for.`),
        J("doublethink", 3, `Tea is lovely. It has the Warden's face on it. Isn't it thoughtful? You can see the rightness of it, can't you? The Jubilee is coming. One must celebrate. One must not be so *literal* about flour.`, { effects: [{ surv: 1 }] }),
        J("volition", 5, `Whichever you choose, you will be the one who did it. Not the crowd. You. Know that before you open your mouth.`)
      ],
      choices: [
        K("Say what everyone is thinking: loudly, from the middle of the line. Let the line finish the sentence.", "rhetoric", 12, "s_queue_incite", "riot_pass", "riot_fail", { white: true }),
        K("Throw the first thing: Tallow's inkwell, at the Warden's face on the tin.", "adrenaline", 11, "s_queue_throw", "riot_adr_pass", "riot_adr_fail", { white: true }),
        K("Point out Regulation 6(b) to the clerk, loudly, so the line can hear that he is starving for them.", "archive", 11, "s_queue_reg", "calm_arch_pass", "calm_arch_fail", { white: true }, { cond: "flag.queue_reg6" }),
        K("Stand beside Mrs Orlova and lead the line in the one song everybody knows.", "solidarity", 11, "s_queue_song", "calm_song_pass", "calm_song_fail", { white: true }),
        K("Take command: step between the cadet and the old woman and tell them both to stand down.", "authority", 12, "s_queue_command", "calm_auth_pass", "calm_auth_fail", { white: true }),
        C("Slip back through the crowd and let it happen.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] })
      ]
    }),
    riot_pass: N("narrator", `You do not shout. You say it, clear and level, in the voice you use when you are the only one who knows the answer: "There is flour under the tarpaulin." Nobody moves. Then Mrs Orlova's voice, thin and delighted: "There is! I've said so for a month!" And the sentence breaks open: a woman at the back, a man by the pole, a boy by the barrier. "Flour! Flour! Show us the flour!"\n\nIt isn't violence. It is a crowd remembering it has elbows. The cadets are very good at one rank of angry people and not at all at ninety. The tarpaulin comes off in a long, soft, silent sweep, and for one second the whole avenue is looking at seven sacks of grade C flour, white as bridal veils. Then somebody cheers. Then a trestle goes over, and a pencil is trampled, and a clerk is lifted three inches off the ground by a woman with a string bag, who puts him gently down.`, {
      onEnter: [{ set: "queue_riot", val: true }, { surv: 15 }, { xp: 3 }, { ideo: "undercurrent", n: 2 }, { task: "task_queue", state: "done" }, { time: 20 }, { note: "task_queue", text: "I started the riot. The flour was where Mrs Orlova said. The cadets ran for the Vanguard hall. Somewhere in the avenue a whistle is blowing for reinforcements. It is going to be a long, loud day, and everyone will say I was not there." }, { thought: "th_ration_riot" }],
      interjections: [
        J("adrenaline", 3, `YES. Oh, YES. Do it again. Do it again forever. No. Not forever. But once more.`, { once: true, effects: [{ xp: 1 }] }),
        J("empathy", 4, `Nobody in that crowd has ever done anything in their lives. Now they have been, for ninety seconds, a force. Look at their faces. Look. They will carry the look home like a sweet in a pocket, and they will never be quite as obedient again.`),
        J("instinct", 5, `Do not stay. The whistles. By the time the van arrives, there will be a name for the person who said it, and it is a name the cadets have already begun to say.`)
      ],
      choices: [C("Get behind the pole.", "riot_after")]
    }),
    riot_fail: N("narrator", `"There is flour," you say, and your voice comes out smaller than you meant, and instead of the crowd it catches the cadets. For a moment nobody understands. Then the girl with the bad haircut understands, in her stomach, and says "Who said that?" in a high, sweet, murderous voice, and a hundred heads turn, slowly, away from you, in the oldest gesture of crowds: giving the target room.\n\nMrs Orlova's hand tightens on your elbow. "Run along, dear," she says, quite pleasantly. "I'll tell them it was a boy with red hair."`, {
      onEnter: [{ surv: 10 }, { set: "queue_incite_failed", val: true }],
      choices: [C("Run along.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] }), C("Try something else. Quickly.", "crunch")]
    }),
    riot_adr_pass: N("narrator", `The inkwell is a good one: thick glass, half full, old, heavy as a small decision. You throw it without aiming, which is the only way you have ever aimed anything well. It cracks against the tin of Jubilee Tea with a perfect, ringing, astonishing noise and the Warden's profile on the lid flowers into a blue-black star.\n\nThere is a half-second of absolute silence in which every person on Karsov Avenue considers what has just been done to the Warden's face. Then the same half-second ends, and what comes after is not a cry but a laugh: a great, helpless, thunderous laugh, and under it the sound of three hundred shoes beginning to move.`, {
      onEnter: [{ set: "queue_riot", val: true }, { surv: 18 }, { xp: 3 }, { ideo: "undercurrent", n: 2 }, { hp: -1 }, { task: "task_queue", state: "done" }, { time: 20 }, { note: "task_queue", text: "I threw an inkwell at the Warden's face on a tea tin and the queue went up like paper. It is a thing I will not be able to un-do and will not entirely want to." }],
      choices: [C("Duck behind the pole.", "riot_after")]
    }),
    riot_adr_fail: N("narrator", `The inkwell leaves your hand with enormous conviction and lands on the pavement three feet to the left of the tin, with a wet, apologetic, ordinary noise. The ink makes a small black map of an unknown country on the cobbles. A cadet is looking at it. The whole line is looking at it. You are, in the full and honest sense of the word, a person who threw a thing at nothing.\n\nThe girl with the bad haircut takes a step toward you, with her very white teeth, and says kindly, "Are you all right? Do you need a sit down?" It is the worst thing anyone has said to you today.`, {
      onEnter: [{ surv: 8 }, { morale: -1 }],
      choices: [C("Retreat in good order.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] }), C("Try something else. Quickly.", "crunch")]
    }),
    calm_arch_pass: N("narrator", `"Excuse me." You say it to the clerk and you say it loud enough that the back half of the line goes quiet to hear. "Clerk's Regulation 6(b). A clerk who misreports an allocation makes good the shortfall from his own ration. Mr Tallow, how many rations have you made good this month?"\n\nTallow's mouth opens. Nothing comes out, and then, very quietly, "Forty-one." The line makes a noise like a wet sheet being lifted. "I had a mother," says Tallow, in a wondering voice, "who said never count what you eat." He looks at the tarpaulin. He looks at the cadet. He says, in the small, distinct voice of a man who has just found a floor beneath him: "I will not read the rest of this announcement. There is flour. It is behind me. It is not mine to hold."`, {
      onEnter: [{ set: "queue_calmed", val: true }, { surv: 3 }, { xp: 3 }, { ideo: "undercurrent", n: 1 }, { task: "task_queue", state: "done" }, { time: 15 }, { note: "task_queue", text: "Quoted Regulation 6(b) to the clerk in front of everyone. He gave out the flour himself. It cost me nothing. In this country that is the most dangerous kind of victory: the kind that is entirely legal." }],
      interjections: [J("archive", 4, `The law, correctly applied, is the one weapon they cannot disarm. They are obliged, by their own paperwork, to be embarrassed.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Carry the first sack to the old woman.", "calm_after")]
    }),
    calm_arch_fail: N("narrator", `"Regulation six," you begin. "Sub-clause bee." The clerk looks at you with polite, terrible blankness. "That's the old numbering," he says gently. "It was revised. Now it's... 6(b) is about coupon-holders' obligations. I don't think it says what you remember." He is wrong. Probably. But he has the paper, and you have a memory, and in a queue, paper wins every time.\n\nThe cadet turns. "Who is this?"`, {
      onEnter: [{ surv: 6 }],
      choices: [C("Try something else. Quickly.", "crunch"), C("Back away.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] })]
    }),
    calm_song_pass: N("narrator", `You do not know why that is the song that comes. It is the old schoolroom hymn, the second, which they taught you at six and which, by Decree, has no second verse. You stand next to Mrs Orlova and sing the first line, small. She sings it with you, in a cracked soprano that has not been used in thirty years. A man at the pole joins in. Then a woman. Then the row behind her.\n\nAnd it turns out that a hundred people singing a hymn about patience is a much more dangerous thing than a hundred people shouting about bread. You can feel it. The cadets can feel it. Nobody is quite sure whom the song is about. The line sings the second verse, the one that is not allowed, because nobody ever told them it did not exist. The clerk lowers his paper. The cadets look at the girl, and the girl looks at the sky. Somebody takes the cover off the flour with such gentleness that it is hardly a theft at all.`, {
      onEnter: [{ set: "queue_calmed", val: true }, { surv: 6 }, { xp: 3 }, { ideo: "undercurrent", n: 2 }, { task: "task_queue", state: "done" }, { time: 15 }, { note: "task_queue", text: "I sang. Mrs Orlova sang. A hundred people sang the second verse of the schoolroom hymn, which has no second verse. The flour came out of its sacks. Nobody was hit. I do not know that I have ever been so frightened, or so exactly myself." }, { thought: "th_collective_pulse" }],
      interjections: [J("solidarity", 3, `We did it. We did it, and nobody has to say we did.`, { once: true, effects: [{ morale: 2 }] })],
      choices: [C("Hold the old woman's arm while the line moves.", "calm_after")]
    }),
    calm_song_fail: N("narrator", `The note comes out thin. It dies in the cold. Mrs Orlova looks at you with tender, devastating pity, as at a child who has volunteered too early, and does not sing. The cadets look at you, and one of them, a boy with sharp ears, laughs. It is not a cruel laugh. It is the worse one: delighted, and a little ashamed to be.\n\nThe moment closes like a door in a draught. The cadet takes the old woman's stool.`, {
      onEnter: [{ morale: -1 }, { surv: 3 }],
      choices: [C("Try something else. Quickly.", "crunch"), C("Retreat.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] })]
    }),
    calm_auth_pass: N("narrator", `You step between them. Nothing in you remembers deciding to. You say, "Cadet, put your hand down." In the voice that the Union has put in every one of you at its own expense. It hits the girl like a hand on the back of the neck; she freezes, a dog caught at a table, and the boy beside her takes a step back. "The citizen is elderly. The stool is hers. The queue is orderly. The announcement was made. You will not touch anyone. You will wait for your superior."\n\nIt is not true that she has a superior. It is also not true that you have a right. But the line, which has not seen a person give an order in the voice of the State to the State's own children for forty years, falls silent in awe. Tallow, behind the trestle, makes a small sound like a man seeing a saint. "Distribute the flour, Mr Tallow," you say. "I'll note you did."`, {
      onEnter: [{ set: "queue_calmed", val: true }, { set: "queue_calmed_by_authority", val: true }, { surv: -3 }, { xp: 3 }, { ideo: "vanguard", n: 1 }, { task: "task_queue", state: "done" }, { time: 15 }, { note: "task_queue", text: "I ordered a cadet to stand down in the Union's own voice, and the Union obeyed itself. The flour is being given out. I am ashamed of how easy it was, and not as ashamed as I should be." }],
      interjections: [J("authority", 3, `That. That is how it is done. No hesitation. Sentences like nails.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Step back and let the line do its work.", "calm_after")]
    }),
    calm_auth_fail: N("narrator", `"Cadet." Your voice cracks in the middle like a boy's, and the girl with the bad haircut turns, rather slowly, with a face of delighted contempt. "Cadet? Which regiment do you belong to?" she asks, quite politely. "I only ask because I haven't had the pleasure of seeing your pin." You have no pin. A little ripple goes through the line: the sound of a hundred people deciding you were never really there.\n\nShe takes the stool. She breaks it, deliberately, across her knee. It is not a large stool.`, {
      onEnter: [{ surv: 6 }, { morale: -1 }],
      choices: [C("Try something else. Quickly.", "crunch"), C("Retreat.", "ignored", { effects: [{ set: "queue_abandoned", val: true }] })]
    }),
    riot_after: N("narrator", `The avenue sounds like a bag of knives. Sacks open on the pavement; flour goes up in lazy white curtains and settles on everything: the cadets, the clerk, the Warden's tea, a very surprised pigeon. Women are carrying the flour away in their aprons, their string bags, their hats. Somewhere a whistle. Somewhere a bell, very small, ringing from the Vanguard hall. In the middle of it, Mrs Orlova sits on her stool with her shawl and a white face, perfectly composed, directing traffic.\n\n"Quick," she says, when she sees you. "Take a handful. For luck. And then go, and we'll all say it was the Wednesday weather."`, {
      onEnter: [{ set: "queue_seen", val: true }],
      voices: 2,
      interjections: [
        J("the_grey", 3, `Flour on my streets. White on grey. The first colour I have worn in forty years that was not a verdict.`),
        J("senses", 4, `Beneath the dust: a tang of burning. A tarpaulin has caught on someone's cigarette, or someone's grievance. By the time the van arrives the whole end of the avenue will smell like a bakery on fire, which is, politically, the best it has ever smelled.`)
      ],
      choices: [
        C("Take a handful of flour, for luck.", "riot_flour", { cond: "!flag.queue_flour_taken", effects: [{ set: "queue_flour_taken", val: true }, { give: "ration_coupon" }, { morale: 1 }], once: true }),
        E("Slip away down the avenue.", { effects: [{ time: 5 }] })
      ]
    }),
    riot_flour: N("narrator", `Mrs Orlova presses a paper twist into your hand. Not flour: something harder. A ration coupon, old, soft as cloth, stamped TUESDAY. "I've been saving it," she says. "For a day worth spending it on."`, {
      choices: [E("Slip away down the avenue.", { effects: [{ time: 5 }] })]
    }),
    calm_after: N("narrator", `The flour is going out in orderly paper bags. Tallow is weighing it with the exhausted tenderness of a man who has just been forgiven; the cadets are standing against the barrier with the air of children who have been caught being good. Mrs Orlova has her stool, and a bag, and the look of a woman who has lived long enough to see the thing come out right, once. Pip is carrying a sack nearly as large as he is, and someone has started, very quietly, to hum.\n\n"Well done, dear," says Mrs Orlova. "It is a rare skill. Doing nothing violent in front of a lot of people who were looking for permission to." She reaches into her shawl. "A coupon. It's old. Don't spend it on cabbage."`, {
      onEnter: [{ set: "queue_seen", val: true }],
      choices: [
        C("Take the coupon.", "calm_coupon", { cond: "!flag.queue_calm_coupon", effects: [{ set: "queue_calm_coupon", val: true }, { give: "ration_coupon" }], once: true }),
        E("Leave them to their dinner.")
      ]
    }),
    calm_coupon: N("narrator", `The coupon is soft as old cloth, stamped TUESDAY. She closes your fingers around it with her dry little hand, which is warm. "Mind how you go," she says. "There is a man by a car who has been watching you do it. Not to arrest you. To take notes. I know the kind. My husband was one."`, {
      onEnter: [{ set: "voss_watched_queue", val: true }],
      choices: [E("Mind how you go.")]
    }),
    ignored: N("narrator", `You are three people back and moving away when the stool breaks. You hear it: a short dry crack, like a bone in a pocket. You hear the old woman not cry out, which is worse. You hear the girl with the bad haircut say, in a bright voice, "Back in line, please. This is a very orderly queue." The queue, which has been a large animal for six hundred years and has never once been asked what it wanted, goes back in line.\n\nNobody throws anything. There is, in fact, a small, polite, ashamed applause when the clerk gives out the tea. It is the sound of a hundred people agreeing to be fed. You keep walking. You can still hear it three lamp-posts away.`, {
      onEnter: [{ set: "queue_abandoned", val: true }, { morale: -2 }, { thought: "th_ration_riot" }, { note: "task_queue", text: "I walked away. The stool broke. The queue went back in line. I do not think I will forget it, which, tonight, is a minor and disagreeable kind of luck." }],
      interjections: [
        J("empathy", 3, `You did not do it. You did not stop it. Both are true and neither will keep you warm.`),
        J("volition", 4, `Carry it. Not forever. Carry it until the weight tells you what to do next.`)
      ],
      choices: [E("Keep walking.")]
    }),
    ignored_after: N("narrator", `The queue is shorter, and quieter. Someone has patched Mrs Orlova's stool with string and tape. She does not look at you. A woman beside her does. It is the look you give a person who walked past a window in which you were drowning. It is not hatred. It is accounting.`, {
      choices: [E("Walk on.")]
    })
  }
},

// ===================== NADIA (base: Day 2) =====================
nadia: {
  title: "Nadia Fell",
  start: [
    { cond: "flag.nadia_ally", node: "hub_ally" },
    { cond: "talked('nadia') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `She is leaning on the black-market stall with her elbows, in the pose of a woman who has been standing for so long that she has begun to look like part of the street. A long coat the colour of old plums, buttons all different, a conductor's cap pulled low, one cigarette that has burnt down to nothing without being smoked. A ticket punch hangs round her neck on a bootlace, and she clicks it, idly, as she watches you cross the road: click, click, a tiny metallic count of the people she has decided not to be surprised by.\n\nThe stall behind her is unremarkable: a counter, a tarp, a few tins of fish, a stack of tram timetables, a sign saying ALL SALES FINAL, and under it in a smaller hand, ALL FINALS NEGOTIABLE.`, {
      voices: 3,
      interjections: [
        J("instinct", 4, `She has clocked you from forty metres: age, shoes, uniform, the look in your eye that says you want something and don't know what it is called. She is the sort of woman who sells people their own errand.`),
        J("senses", 4, `Fish tins that are not fish. Tobacco that is not tobacco. A little cardboard card behind the till with a small hand-drawn tram on it. The cigarette in her fingers has not been lit in an hour: she holds it for the shape of her hand.`),
        J("charm", 4, `She has a conductor's smile. It is a good one: one-sided, warm, finished with the doors. She smiles at everyone the same, and she is aware of that, and she is ever so slightly sorry about it.`),
        J("the_grey", 3, `I know her. She walks my wires in the dark with a lamp. She is the only one who has ever said thank you to a lamp-post.`)
      ],
      choices: [
        C(`"Are you Nadia?"`, "greet"),
        C(`Say nothing. Let her speak first.`, "silence"),
        E("Move along.")
      ]
    }),
    greet: N("nadia", `"Fell, Nadia. Conductor, Line Nine, retired by regulation and unretired by appetite." Click. "Mind the doors, passenger, we've a way to go. You're the student from the school. Everyone knows. You came out of that gate the way a cat comes out of a bag: unwilling, in the wrong direction, with more eyes than you went in with." She taps ash that isn't there. "I'm told you ask questions, and I'm told you can't remember the answers. That makes you my favourite kind of customer."\n\nShe leans an inch closer. "I sell what the State doesn't sell, passenger. I also *buy* what the State doesn't want. And in between, I run a tram."`, {
      onEnter: [{ note: "task_exodus", text: "Nadia Fell: conductor, black marketeer, runs a tram. 'I sell what the State doesn't sell. I also buy what it doesn't want.'" }],
      interjections: [J("rhetoric", 4, `She calls everyone 'passenger'. It is a small, clever act: if everybody is a passenger, nobody is a citizen, and the word 'citizen' has been quietly retired from the conversation. Steal it.`)],
      choices: [C("Ask what she sells.", "stall"), C("Ask about the tram.", "tram"), C("Ask about the man by the black car.", "voss"), C("Ask about the queue.", "queue"), E("Say goodbye.")]
    }),
    silence: N("nadia", `She waits. You wait. A tram bell, somewhere, rings for a tram that is not there. "Good," says Nadia at last, with an approving grunt. "Most of them rush. Rushing is how you get taken for a ride." Click. "I like a customer who can stand in a street with their mouth shut. In my line of work that's rarer than flour."\n\nShe nods at the stall. "Fell, Nadia. Conductor, Line Nine. Retired by regulation, unretired by appetite. And you are the student they are all talking about. Mind the doors."`, {
      onEnter: [{ xp: 1 }],
      choices: [C("Ask what she sells.", "stall"), C("Ask about the tram.", "tram"), C("Ask about the man by the black car.", "voss"), E("Say goodbye.")]
    }),
    hub: N("nadia", `"Mind the doors, passenger." Click. She has taken the cigarette out of her mouth to say it, and holds it between two fingers, eyes narrowed against the weak sun. "What'll it be? Goods, gossip or goodbye? I do all three, and the third is the cheapest."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `There is a ring on a cord under her collar. Wedding band, too big for her finger. She wears it where the ticket-punch hangs, so that every time she clicks it she touches the ring.`, { once: true, effects: [{ set: "nadia_ring_seen", val: true }] }),
        J("instinct", 4, `You are not the only one she's watching. She keeps checking the black car in the reflection of her tin tray: an old habit, a precise one. She knows exactly how long Voss has been drinking his tea.`)
      ],
      choices: [
        C("See what she's selling.", "stall"),
        C("Ask about the tram.", "tram"),
        C("Ask about the Black Car.", "voss"),
        C("Ask about her ring.", "ring", { cond: "flag.nadia_ring_seen && !flag.nadia_husband" }),
        C("Ask about her Passenger Book.", "book", { cond: "flag.nadia_tram_told && !flag.nadia_book" }),
        C("Tell her about the Jubilee: the seventy-two hours.", "jubilee", { cond: "flag.knows_72_hours && !flag.nadia_jubilee" }),
        C("Ask whether the night tram could carry people out.", "exodus", { cond: "flag.nadia_tram_told && !flag.nadia_exodus_offered" }),
        C(`"What would the fare be?" (the exodus)`, "fare", { cond: "flag.nadia_exodus_offered && !flag.nadia_fare_paid" }),
        C("About the queue.", "queue", { cond: "flag.queue_riot || flag.queue_calmed" }),
        E("Leave.")
      ]
    }),
    stall: N("nadia", `"Look, but do not breathe on the merchandise." She sweeps a hand along the tarp. "Fish that isn't. Tobacco that wasn't. Timetables for trams that have not been. Everything has a price, passenger, and the price has a price." She counts on her fingers. "A *ticket*: it buys you the right to ask me for the other things. One coupon, or something sweet, or something that burns. A *pass*: gets you through a Ministry gate once, with a good stamp and a bad conscience. That needs the ticket, and one more coupon, because paper is not free, whatever the Warden says."\n\nShe taps the tin tray. "And a *token*. That one's not for sale. It's the fare. We'll get to that."`, {
      voices: 2,
      interjections: [
        J("archive", 4, `Ticket, pass, token: the three things the State uses to make people feel permitted. Nadia has put them in a tin tray and put a price on each. It is, you notice with some delight, a perfect copy of the Chancellery's own tariff.`),
        J("sleight", 4, `The ticket-stack beside the till is thick. She counts it every hour, and she has only ever counted it twice in the last ten minutes. You could, if you wanted, be very quick.`, { cond: "!flag.nadia_stole" })
      ],
      choices: [
        C("Buy a ticket with a ration coupon.", "buy_t1", { cond: "has('ration_coupon') && !has('black_market_ticket')", effects: [{ take: "ration_coupon" }, { give: "black_market_ticket" }], once: true }),
        C("Buy a ticket with a sweet roll.", "buy_t2", { cond: "has('sweet_roll') && !has('black_market_ticket') && !flag.nadia_ticket_bought", effects: [{ take: "sweet_roll" }, { give: "black_market_ticket" }, { set: "nadia_ticket_bought", val: true }], once: true }),
        C("Buy a ticket with cigarettes.", "buy_t3", { cond: "has('cigarettes') && !has('black_market_ticket') && !flag.nadia_ticket_bought", effects: [{ take: "cigarettes" }, { give: "black_market_ticket" }, { set: "nadia_ticket_bought", val: true }], once: true }),
        C("Buy a forged pass (a ticket and a coupon).", "buy_pass", { cond: "has('black_market_ticket') && has('ration_coupon') && !has('forged_pass') && !flag.nadia_pass_bought", effects: [{ take: "black_market_ticket" }, { take: "ration_coupon" }, { give: "forged_pass" }, { set: "nadia_pass_bought", val: true }], once: true }),
        K("Haggle: she will take your charm in place of the coupon.", "charm", 11, "nadia_haggle", "haggle_pass", "haggle_fail", { white: true }, { cond: "!has('black_market_ticket') && !flag.nadia_ticket_bought && !flag.nadia_haggled" }),
        K("Palm a ticket off the stack while she looks at the car.", "sleight", 12, "nadia_palm", "palm_pass", "palm_fail", { white: false }, { cond: "!has('black_market_ticket') && !flag.nadia_ticket_bought && !flag.nadia_stole" }),
        C("Back.", "hub")
      ]
    }),
    buy_t1: N("nadia", `"One coupon. Tuesday's, good." She holds it up to the light, an old habit, and puts it somewhere in the coat with the grace of a woman making a deposit into a bank that has never been robbed. She hands you a small stiff card, numbered in an elegant hand, 0113, with a hand-inked tram on it. "Welcome to the fare. Mind the doors. If anyone asks, you bought fish."`, {
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    buy_t2: N("nadia", `She looks at the roll for a good three seconds before taking it. "It's still warm," she says, in a voice nobody has used on her in a while. She does not eat it. She puts it under the counter in a little box, and then hands you a card: 0114. "That's a better price than I asked. I'll remember."`, {
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    buy_t3: N("nadia", `The cigarettes disappear so smoothly that you are not sure they were ever in your hand. In their place, a stiff little card, 0115, with a tram, and a very small smile. "A smoker's currency. It's the only honest tender the country has left," she says. "Everyone burns something."`, {
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    buy_pass: N("nadia", `She takes the ticket and the coupon and goes to a biscuit tin under the counter, from which she draws a stiff cream card, stamped, signed, and embossed with a bell in a way that would make a Ministry clerk cry. "Serial's real, name's not, stamp's from a friend in Vorsk. It'll get you through one door, once. Do not use it on the same door twice. The State hasn't got a memory, but it has got a *list*, and the list is worse."\n\nShe slides it across. "You didn't get this from me. You got it from a tram."`, {
      onEnter: [{ note: "task_relay", text: "Bought a forged Relay pass from Nadia Fell. One door, one use. The serial number belongs to a dead engineer." }, { set: "nadia_pass_bought", val: true }],
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    haggle_pass: N("nadia", `You do not make a speech. You ask her, gravely, what it costs to look the way she looks at six in the evening, and she laughs so hard she drops the cigarette that was never lit. "Charm," she says, wiping an eye. "I haven't been charmed in nine years. It's like being tickled by a ghost." She slaps a card on the tarp. 0116. "Half price. Because you made me laugh. Because I'm sentimental. If you tell anyone, I shall deny it, and I will be believed."`, {
      onEnter: [{ give: "black_market_ticket" }, { set: "nadia_haggled", val: true }, { xp: 1 }],
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    haggle_fail: N("nadia", `"Passenger," says Nadia, kindly, "that was not charm. That was a request with a hat on." She tips her cap at you, a small formal courtesy. "Try again when it has a face."`, {
      onEnter: [{ set: "nadia_haggled", val: true }],
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    palm_pass: N("narrator", `Her eyes go to the black car. In a country where everyone watches everyone, there is always a moment in which someone looks at something else. Two fingers. A flick. A card the size of your palm is in your sleeve, and you are leaning, innocently, on the counter, admiring a timetable. A mild warm glow of competence suffuses you like soup.`, {
      onEnter: [{ give: "black_market_ticket" }, { set: "nadia_stole", val: true }, { xp: 2 }],
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    palm_fail: N("nadia", `A hand closes on your wrist. It is a smaller hand than you expected, and a great deal stronger. Nadia has not looked away from the black car. "Passenger," she says, pleasantly, and turns your palm up, and takes the card out of it with two fingers, as one lifts a tick. "That's how I started, you know. At your age. I'll let you off. I'll let you off *once*." She lets go. "But the price has gone up."`, {
      onEnter: [{ set: "nadia_stole", val: true }, { surv: 3 }, { morale: -1 }],
      choices: [C("Back to the stall.", "stall"), C("Back.", "hub")]
    }),
    tram: N("nadia", `"The Line Nine." She sighs, a long contented sigh, the way you sigh for a lover. "Nine stops, Cinder Street to Hallow Quay. The day tram, it runs on time and carries the Union to work and back, and nobody remembers the ride. The *night* tram, Nine-N, left the timetable nine years ago, on the night the Warden's Council voted to save electricity. They voted it on a Tuesday. They forgot they'd voted it by Wednesday. I did not." Click. "Someone has to run the line, passenger. It is a poor country that lets a line go dark."\n\nShe watches your face. "The night tram goes where the day tram has never been. It goes to the Quay. From the Quay a person can go anywhere a person can go. Not many go. Those who go..." She shrugs. "I take the fare. I write it in my book. And then I don't ask."`, {
      onEnter: [{ set: "nadia_tram_told", val: true }, { note: "task_exodus", text: "Nadia runs the night tram (Line 9N) to Hallow Quay, off the books. She takes a fare and writes it in a book. She does not ask where anyone goes." }, { task: "task_exodus", state: "active" }],
      interjections: [
        J("archive", 4, `Line Nine, Cinder Street to Hallow Quay: forty minutes. Hallow Quay: a freight harbour closed since the Hunger. Closed to ships. Closed to the Ministry's maps. It is, of course, the only place in the district a man could get out of the district from.`),
        J("doublethink", 3, `Dangerous. Disloyal. Illegal in six separate ways. But what a wonderful tram. Don't you want to be on it? No. Be careful. That was not a thought you were meant to enjoy.`, { effects: [{ surv: 1 }] })
      ],
      choices: [C("Ask about the fare.", "fare_q"), C("Ask about the Quay.", "quay"), C("Back.", "hub")]
    }),
    fare_q: N("nadia", `"What's the fare?" She makes a small, pleased noise. "Nobody ever asks that first. It tells me you're a person who knows that everything has one." She takes the stub of cigarette out and puts it back. "It isn't money. I take the coupons I need. The fare is... a memory, passenger. One thing you remember *on purpose*. You tell it to me, I write it down, and it goes in the book. In the book it can't be taken. After tonight, after Thursday, whatever they do to heads, there is a book with your fare in it. That's all."\n\nShe sees your face and adds, gently: "I know. It's a ridiculous toll. Most people would rather pay in coupons. But it turns out a memory costs more than almost anything, because most of us don't have one that is wholly our own."`, {
      onEnter: [{ set: "nadia_fare_known", val: true }, { thought: "th_tram_wires" }],
      interjections: [
        J("empathy", 4, `She is not selling seats. She is collecting an archive of the unarchived. The ones who go onto that tram will be forgotten by the State. She is making sure someone has not forgotten them.`),
        J("rote", 3, `Nine stops. Nine citizens in a row. One for each of the Nine Virtues of the Youth Pioneer: Obedience, Cleanliness, Cheer, Silence, ... a fifth you could never recall. The Union taught you to count. It did not teach you what to count towards.`)
      ],
      choices: [C("Back.", "hub")]
    }),
    quay: N("nadia", `"The Quay." She says it like a name for a child you are not allowed to have. "Hallow Quay was where the ships went before the Hunger. Cranes like gallows, a customs shed, a lighthouse the Council forgot to turn off. They ran out of cargo and decided not to notice. A small boat goes out of there on dark Thursdays, with a man who has a cousin, and a cousin who has an island, and no one in the Ministry has ever asked what's on an island. They are very uncurious at the sea. It has no queues."\n\nShe taps ash. "If you go, you go with nothing. If you stay, you stay with everything. I would like you to know that, before you decide you're brave."`, {
      choices: [C("Back.", "tram"), C("Back to the street.", "hub")]
    }),
    ring: N("nadia", `Her hand goes to her collar before she has decided to answer. "My husband's," she says. "Tomek. Tram driver. Line Nine, the day shift, twenty-two years. Never missed a stop." Click. "Six years ago, on the Stance Bridge, in the middle of an ordinary Tuesday after an ordinary Bell, he forgot where the bridge ended. They said driver error. They said he'd been drinking. He hadn't. He'd been *Static*. He'd had a bad night's broadcast, a rough one, and in the morning he did what a man does when his hands remember what his head has lost. He drove."\n\nShe is looking at nothing. "I didn't believe in the Bell, before. I believed in forms. Now I believe in the night tram, and the wire is oiled every Sunday, and the book is two hundred names long. That's my answer, passenger. Not a speech. A line."`, {
      onEnter: [{ set: "nadia_husband", val: true }, { thought: "th_chosen_family" }],
      interjections: [
        J("empathy", 5, `She is not asking for pity. She is giving you her reason as you might hand over a key. A key is a thing you only give to someone you think can be trusted with the door.`, { once: true, effects: [{ xp: 1 }] }),
        J("the_grey", 4, `Stance Bridge. I have a stain on my pier where he went in. I have never been able to scrub it. I do not try.`)
      ],
      choices: [C("Say you are sorry.", "ring2"), C("Say nothing; put your hand on the counter beside hers.", "ring2", { effects: [{ morale: 1 }] })]
    }),
    ring2: N("nadia", `"Thank you." She says it plainly, as one says it to a ticket-collector. "People don't say it. They say 'how terrible', and then they leave, and I stand here and sell fish." She clicks the punch twice, very gently. "I'll tell you something for nothing: the man by the black car pays me a tithe. I pay it. He lets the tram run. He says a country needs a valve. I've often wondered who he thinks is the pressure."`, {
      onEnter: [{ set: "nadia_tithe_known", val: true }, { note: "task_voss", text: "Nadia pays Voss a tithe, and he lets the night tram run. 'A country needs a valve.' So he knows about the exodus, and tolerates it. That is either mercy or accounting. Possibly both." }],
      choices: [C("Back.", "hub")]
    }),
    book: N("nadia", `She produces it from inside her coat: a cheap, thick, black-covered book with a ribbon bookmark, the sort you would use to keep a shop's tallies. She does not open it for you. "The Passenger Book. Two hundred and eleven names, and what each of them chose to remember, in their own words. A man from the foundry: the smell of his daughter's hair on the morning she was born. A woman from Cinder Street: the exact weight of a pear. A boy of twelve: nothing, he gave me nothing, I wrote 'nothing', and he cried." Click. "It's the only honest record in the district, and it has no stamp on it."\n\nShe hesitates. "The man who made your Ledger and the woman who keeps this book would have got on."`, {
      onEnter: [{ set: "nadia_book", val: true }, { thought: "th_chosen_family" }],
      interjections: [J("archive", 4, `A rival to the Ledger. The Ledger records what the State does to memory. The Book records what people do for it. Between them, between hands that cannot meet, is the real archive of the Union.`)],
      choices: [C("Back.", "hub")]
    }),
    voss: N("nadia", `"Voss." She says it without moving her lips, like a person using a stolen coupon. "Hale Voss, Quiet Officer, District Nine. Don't believe the Inspectorate coat. It's borrowed. He has the nicest manners in the Ministry and the worst job. He comes by every Wednesday at ten, to see I'm still here, and he buys a sweet roll off me and does not eat it, and puts it in his pocket. I've watched him do it for six years. I think he has a little girl somewhere. I think she doesn't speak to him."\n\nShe looks you up and down. "He has been watching you since eight o'clock. Not as a policeman looks. As a man looks who is trying to remember where he left something precious."`, {
      onEnter: [{ set: "nadia_told_voss", val: true }, { note: "task_voss", text: "Nadia says Voss is a Quiet Officer under a borrowed Inspectorate coat. Manners like silk; job like a brick. He buys a sweet roll off her every Wednesday and pockets it uneaten. 'He has been watching you as a man watches who's trying to remember where he left something precious.'" }],
      interjections: [
        J("empathy", 4, `A sweet roll he does not eat. A mitten on a dashboard. A note that says 'you forgot again'. He is collecting evidence of a child who is not there.`),
        J("authority", 4, `Do not like him. It would be easy to like him. It is the most dangerous thing about him. He is liked as the water is: it is not that you trust it, it is that you have nowhere else to put your hands.`)
      ],
      choices: [C("Ask if he can be trusted.", "voss2"), C("Back.", "hub")]
    }),
    voss2: N("nadia", `"Trusted." A short laugh, not unkind. "He can be trusted to do exactly what he says. That's the horror of him. If he says he will let you leave, you will leave. If he says he will take your head apart one memory at a time, he will do it so gently you will thank him on the way out. He has never broken a promise in his life. That is why you must be extremely careful what he promises you."`, {
      choices: [C("Back.", "hub")]
    }),
    queue: N("nadia", `She has seen it. She has seen it all, standing here with her hands in her coat and the little cold smile of a woman who has watched a play too often to be moved by the ending. "The queue," she says. "It's my best customer. Every Wednesday, a hundred people with an empty string bag and a full grievance. They don't buy anything: they can't afford it. But I get the gossip, and gossip is the only currency that goes up."`, {
      onEnter: [{ set: "nadia_seen_queue_talk", val: true }],
      interjections: [
        J("solidarity", 4, `If the queue had a voice it would be hers. She is its translator. She carries its words across the street into the places they were not meant to reach.`, { cond: "flag.queue_riot || flag.queue_calmed" })
      ],
      choices: [
        C("Tell her what you did at the queue.", "queue2", { cond: "(flag.queue_riot || flag.queue_calmed) && !flag.nadia_queue_told" }),
        C("Back.", "hub")
      ]
    }),
    queue2: N("nadia", `She listens to the whole thing with her head slightly on one side, as a conductor listens to a wheel. When you finish, she says, "Riot or hymn, either way you've made yourself known to a hundred and ten strangers on a street with a black car on it. It was brave, and stupid, and it's the best advertisement I have ever had." She clicks the punch three times. "You'll be wanted for a ticket. I'll hold you one. On the house. Don't thank me, passenger. *Mind the doors.*"`, {
      onEnter: [{ set: "nadia_queue_told", val: true }, { give: "black_market_ticket" }, { set: "nadia_ally", val: true }, { xp: 1 }, { ideo: "undercurrent", n: 1 }],
      choices: [C("Back.", "hub_ally")]
    }),
    jubilee: N("nadia", `You tell her. Not all of it: just the number, seventy-two, and the way the poster says 'refreshments'. She does not laugh. She does not move. After a while she takes the dead cigarette out of her mouth and puts it in her pocket, with the care of someone depositing a very small, very personal fire.\n\n"Seventy-two," she says. "Tuesday, Wednesday, Thursday. They'd take all my nights in a row." Her voice is level. "I have two hundred and eleven people in a book who will not know who they are on Friday morning. And one who is *mine*." She looks at the ring. "He would not have forgotten me. That is the first thing a drowned man teaches you: they do not let go of you, even if you let go."`, {
      onEnter: [{ set: "nadia_jubilee", val: true }, { surv: 2 }],
      interjections: [
        J("instinct", 5, `She is not angry. She is planning. You can tell. It has moved behind her eyes like a tram on a track, bright and square and certain.`),
        J("solidarity", 4, `We are going to need that tram.`)
      ],
      choices: [C("Ask if the tram can run during the Jubilee.", "exodus"), C("Back.", "hub")]
    }),
    exodus: N("nadia", `"Thursday." She has been waiting, you realise, to be asked. "The Jubilee is at eight. The Grand Harmony runs an hour. At the quarter to nine, when the bell stops and the wires go quiet, the night tram leaves Karsov Avenue for Cinder Street and the Quay. I can carry fourteen. Fourteen people, passenger, who would rather not be what the Jubilee leaves behind. Whoever they are. Your friends. Your *kids*." She does not say 'the Undercurrent', but it hangs above the stall like a flag. "Name your fourteen. Bring them to this stop at a quarter to nine. Do not bring more. A tram has its limits. We don't, but the tram does."`, {
      onEnter: [{ set: "nadia_exodus_offered", val: true }, { task: "task_exodus", state: "active" }, { note: "task_exodus", text: "Nadia can carry fourteen on the night tram, Thursday, a quarter to nine, from the Karsov Avenue stop. If the Jubilee goes ahead, I can get fourteen of us out before the morning. I must decide who. I must not choose all of them." }, { thought: "th_tram_wires" }],
      interjections: [
        J("rhetoric", 4, `Fourteen. A number a person can say with a straight face. Fourteen is not a revolution. It is not an escape. It is what you do when you have decided, quietly, to save what you can carry.`),
        J("volition", 5, `You do not have to decide today. You may carry the possibility without committing to it, the way you carry a dead battery in your pocket: against the day.`),
        J("empathy", 4, `She will not tell you who she has already promised seats. There is a list. There is always a list. The only question is whether you are on it, or whether you are the person who writes it.`)
      ],
      choices: [C("Ask about the fare.", "fare"), C("Say you will think about it.", "hub")]
    }),
    fare: N("nadia", `"The fare." She has been polishing the ticket-punch on her sleeve; now she puts it down. "Say it to me. One thing you remember, on purpose, that nobody gave you. Not your name. Not your school number. A smell. A weight. A day. Take as long as you like, but not so long that it goes stale."\n\nShe takes a pencil from behind her ear and opens the black book at the ribbon.`, {
      voices: 2,
      interjections: [
        J("volition", 4, `Pick something that is yours. It will cost you. A memory said aloud is not the same memory afterwards: it is smoother, shorter, more yours and less true. That is the price. You are not giving it up. You are putting a copy in a safe.`),
        J("the_grey", 3, `Tell her about me. I'd like to be in the book. I am so rarely in anyone's memory but my own.`, { cond: "skill('the_grey') >= 3" })
      ],
      choices: [
        C("The ringing: the first time you heard it, aged six, in a hospital bed, and your mother's hand.", "fare_ring"),
        C("A Tuesday in the winter: the whole school in the yard, and one second when nobody was looking.", "fare_yard"),
        C("The Bell: the last thing you remember before it wiped you. The sound itself.", "fare_bell"),
        C("Nothing. You have nothing that is yours.", "fare_none")
      ]
    }),
    fare_ring: N("narrator", `You tell her about the hospital. A white room, a blue blanket, a window with a pigeon on it, and in your head the tone. It started as a thin high note, like a wet finger on a glass, and your mother sat on the bed and put her hand flat on your chest and hummed back at it. You never remembered what she hummed. You remember the weight of the hand, and the way the ringing leaned into it, a small animal into a stroke.\n\nNadia writes without looking up. When you have finished she reads it back to you, word for word, and in her mouth it is not smaller. It is, if anything, a little clearer.`, {
      onEnter: [{ set: "nadia_fare_paid", val: true }, { give: "tram_token" }, { set: "nadia_ally", val: true }, { xp: 2 }, { morale: 2 }, { note: "task_exodus", text: "I paid the fare: the hospital, my mother's hand, the ringing. It is in Nadia's Passenger Book now. I have a token. Nadia holds a seat for me on the quarter-to-nine." }],
      choices: [C("Take the token.", "fare_done")]
    }),
    fare_yard: N("narrator", `You tell her about the yard. January. The whole of School No. 9 in lines of nine hundred, drilling for the Midwinter Review, breath rising in white threads, and the loudspeaker playing a march. In the middle of it a gap, no longer than a breath, between the end of one tune and the start of another, in which nobody was looking at you, and you realised you had, for one second, been a child in a yard rather than a unit in a line. You have been trying to be in that second ever since.\n\nNadia writes without looking up. She reads it back. In her voice, the yard is bigger than it was.`, {
      onEnter: [{ set: "nadia_fare_paid", val: true }, { give: "tram_token" }, { set: "nadia_ally", val: true }, { xp: 2 }, { morale: 2 }, { note: "task_exodus", text: "I paid the fare: the yard in January, the one second nobody was looking. It is in Nadia's book. I have a token." }],
      choices: [C("Take the token.", "fare_done")]
    }),
    fare_bell: N("narrator", `You tell her the sound. You find, as you do, that you cannot: it keeps turning into a description, and the description keeps turning into a list. A low swell. A quiver on top. A cold sweetness like iron on the tongue. A shiver at the back of the skull as if a hand had passed across it, and then a long fall. Then the choir. Then the dark.\n\nNadia stops writing. She puts the pencil behind her ear. "That one's heavy," she says. "That one I'll keep under the ribbon, where I can reach it." She looks at you with a new, thoughtful gravity. "That one is going to be useful to someone, passenger. I don't know who. But somebody will want to know what it sounds like when it works."`, {
      onEnter: [{ set: "nadia_fare_paid", val: true }, { give: "tram_token" }, { set: "nadia_ally", val: true }, { xp: 3 }, { set: "nadia_bell_memory", val: true }, { thought: "th_wake_tone" }, { note: "task_exodus", text: "I paid the fare with the Bell itself: the exact sound as I remember it. Nadia has it in her book under the ribbon. Ilsabet may want to hear it read." }],
      interjections: [J("senses", 4, `Remembered sounds are the most fragile. You have just set one in ink. A recording the length of a pencil-stroke. It may be the most important thing you have said all week.`, { once: true })],
      choices: [C("Take the token.", "fare_done")]
    }),
    fare_none: N("nadia", `"Nothing." She does not write it. She looks at you for a very long time, with her head slightly tilted, as at a wheel with a flat. "No. That's not true. You have a *no*. That's a memory too. Many have only that. I'll write it as 'no', and I'll hold the page."\n\nShe clicks the punch once and does not hand over a token. "You'll find one soon, passenger. Come back when you do. I'm not going anywhere. That's the entire point of me."`, {
      onEnter: [{ set: "nadia_fare_refused", val: true }, { morale: -1 }],
      choices: [C("Back.", "hub")]
    }),
    fare_done: N("nadia", `She puts the little brass disc into your palm. TRAM TOKEN. 9N. It is warm from her fingers. "Keep it where it won't be found. Keep it where you will find it. On the night, hand it to me at the step and say nothing. I will say 'mind the doors'. You will mind them." She shuts the book and tucks the ribbon in. "Don't thank me. I'm not doing it for you. I'm doing it for the Passenger Book. It likes to be full."`, {
      choices: [C("Back.", "hub_ally")]
    }),
    hub_ally: N("nadia", `"Passenger." Nadia lifts her cap an inch, in a greeting reserved for people whose names are in the book. Click. "Doors are open. What'll it be?"`, {
      voices: 2,
      interjections: [
        J("solidarity", 4, `We have a place on the tram. The tram is a little room that moves. Everyone is welcome in it, and no one is asked to be anything but a person who left.`),
        J("instinct", 4, `Her eyes keep flicking to the black car in the glass of the tin tray. She is giving Voss the show of an ordinary Wednesday. For you.`)
      ],
      choices: [
        C("See the stall.", "stall"),
        C("Ask about the night tram.", "tram2"),
        C("Ask about the Passenger Book.", "book", { cond: "!flag.nadia_book" }),
        C("Ask about her ring.", "ring", { cond: "!flag.nadia_husband" }),
        C("Ask about the man by the black car.", "voss", { cond: "!flag.nadia_told_voss" }),
        C("Tell her about the seventy-two hours.", "jubilee", { cond: "flag.knows_72_hours && !flag.nadia_jubilee" }),
        C("Ask for the exodus offer again.", "exodus", { cond: "!flag.nadia_exodus_offered" }),
        C("Ask about the fare.", "fare", { cond: "flag.nadia_exodus_offered && !flag.nadia_fare_paid" }),
        E("Leave.")
      ]
    }),
    tram2: N("nadia", `"Quarter to nine, Thursday, Karsov Avenue, the stop with the stuck clock." She says it like a prayer to a saint she does not believe in and has never missed. "Fourteen seats. I have eleven names. Three seats, passenger, are yours to give. Think carefully who you promise. A promised seat is a loaded gun on a shelf: it changes the whole room."`, {
      onEnter: [{ set: "nadia_seats_known", val: true }, { note: "task_exodus", text: "Nadia has fourteen seats and eleven names. Three seats are mine to give. A quarter to nine on Thursday." }],
      choices: [C("Back.", "hub_ally")]
    })
  }
},

// ===================== NADIA_D3 =====================
nadia_d3: {
  title: "Nadia Fell",
  start: [
    { cond: "flag.nadia_ally", node: "ally" },
    { cond: "true", node: "plain" }
  ],
  nodes: {
    plain: N("nadia", `The stall is half-packed: tins in a crate, the sign taken down, the tarp in a roll against her leg. Nadia is standing at the tram stop with her back very straight, like a person at the end of a long shift who has decided, for once, to leave on time. "Passenger. It's Thursday. The street is a stage and the whole district has been told to be an audience. I'm told they put out chairs." Click. "Look at them. They've put out *chairs*."\n\nShe nods at the tram wires, shining. "Tonight, at a quarter to nine, I run the Nine-N. If you want a seat you do not have one. You've no token and no fare. I will take what you can give me, but I will not hold the door."`, {
      voices: 2,
      interjections: [
        J("empathy", 4, `She is on the edge of a decision she has already made. What you see is a woman choosing what to remember of the street she is about to leave.`),
        J("the_grey", 3, `They have lit every lamp on the avenue. A whole district of lamps, all pointing at one stage. It looks like hope. It is a vigil.`)
      ],
      choices: [
        C("Ask for a seat. Offer your memory as the fare.", "fare_d3", { cond: "!flag.nadia_fare_paid" }),
        C("Ask what to expect tonight.", "tonight"),
        E("Wish her luck.")
      ]
    }),
    fare_d3: N("nadia", `"You've got a minute." She opens the black book. "Tell me something true you've never told a wall." You tell her the one about the ringing and the pigeon, and she writes it down, and reads it back, and it is smaller than it was and she knows it, and she puts a brass disc into your hand without a word.\n\n"A token," she says. "It's the fare. If you make the quarter to nine, you ride."`, {
      onEnter: [{ set: "nadia_fare_paid", val: true }, { give: "tram_token" }, { set: "nadia_ally", val: true }, { set: "nadia_ready", val: true }, { note: "task_exodus", text: "Nadia took my fare at the last hour and gave me a token. The night tram leaves at a quarter to nine." }],
      choices: [C("Ask what to expect tonight.", "tonight"), E("Thank her and go.")]
    }),
    ally: N("nadia", `Nadia has her cap pushed back for once, and her coat buttoned to the throat, and the black book in her hand. The street behind her is full of folding chairs. "Passenger. You made it to Thursday. A great many don't, and the ones who do are tired." Click. "Tell me what's changed."`, {
      onEnter: [{ set: "nadia_ready", val: true }],
      voices: 3,
      interjections: [
        J("solidarity", 4, `We are all on the platform tonight. Nobody on this avenue knows it. The chairs are for an audience, and we are the people who have bought tickets for something else.`),
        J("instinct", 4, `She has seen Voss. He is not at the car. He is standing at the end of the avenue with his collar up, looking at the tram stop, not at you. He has had an idea he doesn't like.`, { cond: "flag.voss_met" })
      ],
      choices: [
        C("Ask who is on the tram.", "who"),
        C("Ask about Voss.", "voss3", { cond: "flag.voss_met" }),
        C("Tell her you may not make it.", "maynot"),
        C("Ask what to expect tonight.", "tonight"),
        E("Say you'll see her at the step.")
      ]
    }),
    who: N("nadia", `"Fourteen." She says it carefully, as one speaks of something heavy. "Eleven mine. Three yours. I hold them at the stop, ten to nine, in the shelter, quiet as mice. The tram goes down Karsov, out past the Relay, over Stance Bridge." She does not look at you. "Over *the* bridge. I've not driven it since. I'll drive it tonight. If I forget the end of it..." A small smile. "Then you'll tell me where it ends, passenger, and I'll believe you."\n\nShe taps the book. "If the Jubilee runs, anyone who is not on that tram will wake on Friday with three days gone and no reason. I've said their names to myself so often I'll know them in the dark."`, {
      onEnter: [{ set: "nadia_who_told", val: true }],
      choices: [C("Back.", "ally"), E("Go.")]
    }),
    voss3: N("nadia", `"The Inspector." Nadia looks at the end of the avenue, where a thin figure in a dark coat stands very still beneath a loudspeaker. "He came by at ten. Didn't buy a sweet roll." She says it like a man not buying a sweet roll is the end of the world. "He asked me if the wire was oiled. I said yes. He said, 'Good.' He said, 'There will be a lot of weather tonight.' He said it like a man leaving a door off the latch for a friend."\n\nShe turns the punch in her fingers. "Whatever he is, passenger, I think this is the day he decides."`, {
      onEnter: [{ set: "nadia_voss_hint", val: true }, { note: "task_voss", text: "Nadia says Voss asked whether the tram wire was oiled and said, 'There will be a lot of weather tonight.' He left the door off the latch. I do not know for whom." }],
      choices: [C("Back.", "ally")]
    }),
    maynot: N("nadia", `"You may not make it." She says it without inflection. "Nobody who ever caught my tram was sure they would. That's what the token's for: it's an I-might. Come if you can. If you can't, I will say your name to the engine and I will drive on." She puts a hand flat on your sleeve, very briefly, the way a conductor steadies a passenger on a corner. "It is not an abandonment, passenger. It's a timetable."`, {
      choices: [C("Back.", "ally"), E("Go.")]
    }),
    tonight: N("nadia", `"Tonight?" She thinks. "Eight o'clock they'll play it. A great swell and a choir, and a thing in the wires you can feel in your fillings. The chairs will fill. Nobody will leave, because the Vanguard will be at the ends of the rows with their lists. At the end, after the Harmony, the district will be as quiet as a drawer." Click. "That's when the tram goes. In the quiet. They will not hear the wheels. They won't be able to remember there were wheels."\n\nShe looks at you. "Unless somebody does something about the Harmony. In which case, passenger, the tram can go on an *empty* road, and I will not mind that at all."`, {
      onEnter: [{ set: "nadia_tonight", val: true }],
      choices: [C("Back.", "plain"), E("Go.")]
    })
  }
},

// ===================== VOSS (Day 2 base) =====================
voss: {
  title: "Inspector Hale Voss",
  start: [
    { cond: "flag.voss_turned", node: "hub_turned" },
    { cond: "flag.voss_exposed", node: "hub_exposed" },
    { cond: "flag.voss_ally", node: "hub_ally" },
    { cond: "flag.voss_suspected", node: "hub_suspected" },
    { cond: "flag.voss_met", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `He rises as you approach, which nobody has done for you since the age of nine, and he does it with a small, apologetic grace, like a man getting up to give a stranger his seat on a bus. Tall, narrow, in a long dark coat that has seen better years and been kind to them. The grey at his temples is so evenly spread it looks arranged. His face is a handsome ruin: the face of an actor who retired just before the second act, and has been politely missing his cue ever since. His eyes are the worst thing about him. They are tired in a deep, restful, intelligent way, and when they land on you they stay.\n\n"{name}," he says. "Please don't introduce yourself. I have read you. It was a short file, which is always the most interesting kind." He holds out his free hand, and when you shake it, his palm is warm. "Hale Voss. State Inspectorate. I am here to close the Ostrov case, and I would very much like to do it without anyone else being hurt. Will you have some tea?"`, {
      voices: 3,
      onEnter: [{ set: "voss_met", val: true }, { task: "task_voss", state: "active" }, { note: "task_voss", text: "Inspector Hale Voss, State Inspectorate, has come to 'close the Ostrov case'. Courteous, tired, warm. He has read my file and he likes me. I do not know which of those facts is the more dangerous." }, { thought: "th_inspector_charm" }],
      interjections: [
        J("charm", 4, `Oh, he is *good*. He is better than you. It's not a technique; it's what's left of one, worn smooth, like a step in an old church. Do not try to out-charm him. Let him think you are enjoying it. (You are.)`),
        J("authority", 4, `He is the most senior person on this avenue and has arranged to be sitting on a car step with a flask. That is the posture of someone who never needs to stand up for anything. Stand up for something. Quickly.`),
        J("empathy", 4, `He is not performing the tiredness. It goes all the way down. The kindness too. And there is something under both, as under a floor, a held breath, a closed room. He is very good at not mentioning it.`),
        J("instinct", 5, `Tea. A stranger's tea. In a district where the cook feeds the students tea with aspirin in it to keep them calm. Whatever this is, it is not that. It is *real*. He wants you to trust a cup. Be careful what a cup can teach you.`),
        J("doublethink", 3, `A gentleman! A colleague of the Warden's! Isn't it a comfort that someone so sensible has come? Tell him everything. He will understand. He will understand so well that you will wonder how you got through the day without him.`, { effects: [{ surv: 1 }] }),
        J("composure", 4, `Hands out of the pockets. Weight even. If you are going to be liked by a man like this, be liked *neutrally*.`)
      ],
      choices: [
        C("Accept the tea.", "tea"),
        C("Decline the tea politely.", "refuse_tea"),
        C(`"Voss. Like the statue?"`, "name"),
        E("Say you are late for something and go.", { effects: [{ surv: 1 }] })
      ]
    }),
    name: N("voss", `"Like the statue. Yes." He sighs, with enormous good humour, the sigh of a man asked the same joke for thirty years by people who think it is new. "Four hundred thousand Vosses in the Union, {name}. The Warden's grandfather drew the name from the same barrel as everyone else's in the Year of Surnames. I am no relation. The universe has a sense of humour, and it is a heavy, municipal one."\n\nHe sips his tea. "Doors open for me I did not knock on and close on me I would have liked to enter. One learns to enjoy the draught." A flicker; the tiniest tightening, a note you only hear if you are listening for something that is not there. "My file begins at twenty-four, you know. Before that the Inspectorate has a stamp. A very handsome stamp. I find I rather like it."`, {
      interjections: [
        J("archive", 4, `A file that begins at twenty-four, with a stamp. The first twenty-four years of Hale Voss are *a stamp*. Either he was born at that age in a Ministry corridor, or somebody took the trouble to remove the rest.`, { effects: [{ set: "voss_file_begins_24", val: true }] }),
        J("dialectics", 4, `Notice: he told you something true before you asked. A man who volunteers one confession is shielding another. A small one in front of a large one.`)
      ],
      choices: [C("Accept the tea.", "tea"), C("Decline the tea politely.", "refuse_tea")]
    }),
    tea: N("narrator", `He pours it into the thermos lid and hands it over with both hands, as a person hands over a small bird. It is real tea: black, strong, with a dried slice of orange in it that releases a slow cloud of bitter sweetness. It tastes like a Sunday in a country that has not yet been told what day it is. For about four seconds, you forget that you are being worked on. He sees you forget. His face does a very small, very private thing, like a man seeing a coin he thought he had lost.\n\n"There," he says. "That is the only thing in this district I can vouch for. The rest I am obliged to check."`, {
      onEnter: [{ hp: 1 }, { morale: 1 }, { add: "voss_trust", n: 1 }, { set: "voss_tea", val: true }],
      interjections: [
        J("appetite", 3, `ORANGE. Real orange. It was dried in the sun, by a person who liked it. Take another sip. Take another. It is a trap. *Take another.*`),
        J("senses", 4, `Under the orange: cardamom and, very faintly, aspirin. No. Not aspirin. Willow-bark: an older medicine. A man who carries his own tea because he does not trust the water, and what is in it, and what has been added to it for the public good.`)
      ],
      choices: [C("Hand back the cup. Say thank you.", "game")]
    }),
    refuse_tea: N("voss", `"Quite right." He does not seem at all offended. He screws the lid back on the thermos with the care of a man putting away something for later. "A stranger's tea is a stranger's tea. I would refuse, too. Though I should remark, in fairness, that a refusal is the single most informative thing a person can do in front of an Inspector. It is the only thing they can't be coached out of." A beat. "I would have thought less of you if you'd said yes at once. And I'd have thought less of myself if I'd put anything in it."\n\nHe smiles. It is warm. It does not, you notice, move his eyes.`, {
      onEnter: [{ set: "voss_tea_refused", val: true }],
      interjections: [J("composure", 4, `Do not smile back. A smile in answer is an acceptance.`), J("instinct", 4, `He did not put anything in it. You know that. The refusal was your own. He is pleased with you in a way that feels less like approval than like an entry in a ledger: 'refuses tea; thinks'.`)],
      choices: [C("Say nothing. Wait for the questions.", "game")]
    }),
    caught: N("voss", `"Don't feel bad. It is a very good lock. The Chancellery pays for the lock; they do not pay for much else." He is holding his cup of tea with both hands, in the posture of a man watching a child nearly fall off a wall and deciding not to scream. "What were you after? A map? A mitten? There is a street map in the glove-box with seven red circles on it. I am very proud of the map. I should have liked to show it to you myself. It is so rarely seen by anyone who might understand it."\n\nHe looks at you steadily for a moment. "I will not report this. I will, if you permit me, remember it. I find that in my job one remembers very little, and so one is careful what one chooses to keep."`, {
      onEnter: [{ add: "voss_trust", n: -1 }, { set: "voss_met", val: true }, { task: "task_voss", state: "active" }, { note: "task_voss", text: "Voss caught me picking his glove-box. He did not report me. He said he would 'remember it'. I think this is a threat disguised as a compliment. Possibly the reverse." }],
      interjections: [J("composure", 3, `Keep still. He has not asked you to account for yourself. He has *invited* you to. That is a cleverer instrument.`)],
      choices: [C("Say you were curious.", "game"), C("Say nothing at all.", "game")]
    }),
    game: N("voss", `"Let us be civilised about this." He sits again on the running board and, after a moment, so do you, which you did not intend. "There is a custom, in my line of work, that I find rather charming. Three questions each. I go first. You may refuse any of them, and I'll note the refusal kindly. Then you ask me three, and I will, within the limits of my station, tell you the truth. I'm told that is not how it is usually done." He smiles. "I have never in my life liked how it is usually done."\n\nHe takes out a small brown notebook, and does not open it. It is something to hold. "I should say, for the record, that I do not believe you killed anyone. I believe you were near something that mattered. I would like to find out how near."`, {
      onEnter: [{ set: "voss_game", val: true }],
      voices: 3,
      interjections: [
        J("dialectics", 4, `Three questions each. A symmetrical exchange. A man who offers symmetry is a man who has already decided the asymmetry: he will ask the questions that matter and answer the ones that do not.`),
        J("volition", 4, `You can walk away. You are not under arrest. You are under *consideration*, which is much more difficult to walk away from.`),
        J("rhetoric", 4, `Let him lead. Pay attention to which words he stresses and which he swallows. A man like this puts his questions in the unstressed syllable.`)
      ],
      choices: [C("Nod. Let him ask.", "q1"), C("Refuse the game. Ask him your own questions.", "ask_back", { effects: [{ add: "voss_trust", n: -1 }] })]
    }),
    q1: N("voss", `"First." He lets the word hang. "Where were you at ten past two on Tuesday night? Not what you have told others. Not what a person would say. Simply: where?"\n\nHe is looking at the avenue, not at you. That is a kindness, and also a tactic: it takes the eyes off the lie before the lie has been told.`, {
      interjections: [
        J("instinct", 5, `He knows you do not remember. He knows. He is asking to see which of three things you will do: lie, confess, or *be honest about the hole*. The third is the one he is fishing for.`),
        J("senses", 4, `His pencil is not moving. It has not moved since he sat down. A man who does not write is a man who has memorised your face.`)
      ],
      choices: [
        C(`"I don't remember. The Bell took it."`, "q1_truth"),
        K(`"In the dormitory. Asleep. All night."`, "composure", 11, "voss_q1_lie", "q1_lie_pass", "q1_lie_fail", { white: true }),
        C(`"That is a Ministry question, Inspector. You are an Inspectorate man."`, "q1_def"),
        C("Refuse to answer.", "q2", { effects: [{ add: "voss_trust", n: -1 }, { surv: 2 }] })
      ]
    }),
    q1_truth: N("voss", `"The Bell took it." He repeats it with respect, like a man tasting a wine that has surprised him. "You say it so plainly. Most people say 'I slept badly', or 'I had a headache', or nothing. You have a *sentence* for it. That tells me you have spoken to someone with a theory." He lets that settle. "I shan't ask who. I would ask you to notice that I haven't."\n\nHe writes, for the first time, three words. You cannot see which. "Thank you. That was honest. It was also, if I may say, the bravest thing anyone has said to me in this district in a month."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { set: "voss_knows_amnesia", val: true }, { surv: 3 }],
      interjections: [J("empathy", 4, `He meant it. That is the unnerving thing. He is not flattering you. He is *grateful*. The honesty hurt him a little, the way kindness hurts a man who was braced for something else.`)],
      choices: [C("Wait for the second question.", "q2")]
    }),
    q1_lie_pass: N("voss", `"The dormitory." He nods, slowly, pleasantly, writing nothing. "Thank you. That is a very clear answer. One does like a clear answer." He lets a silence fall, and in it you can feel him deciding to believe you, which is not the same as believing you. "I'll put that down."\n\nYou are not certain what he has put down. You are certain it was not the dormitory.`, {
      onEnter: [{ add: "voss_trust", n: 0 }, { surv: 1 }, { xp: 1 }],
      choices: [C("Wait for the second question.", "q2")]
    }),
    q1_lie_fail: N("voss", `"The dormitory." He says it as a man might say it of a place he has been to and liked. "Matron Pritt's book says you signed out at half past one. She is a most conscientious woman. Her handwriting is superb." There is no unkindness in it. It is the saddest thing he has said so far. "I do not mind being lied to, {name}. I mind being lied to *badly*. It suggests you have not been taught how, and in this country that is a form of neglect."\n\nHe makes a small note. "Another question."`, {
      onEnter: [{ add: "voss_trust", n: -1 }, { surv: 5 }, { set: "voss_caught_lie", val: true }],
      choices: [C("Wait for the second question.", "q2")]
    }),
    q1_def: N("voss", `"Is it?" He says it with delight. "Is it indeed? What a *fine* instinct. A Ministry question. You've been talking to someone who has read the Orders." He tilts his head. "Never mind. The Inspectorate and the Ministry share a corridor, a car pool, and, regrettably, a canteen. I'd have thought that would count for something." He does not look in the least offended. "You are quite right to ask whose coat I am wearing. I would ask the same."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: 4 }, { set: "voss_noted_ministry", val: true }],
      interjections: [J("dialectics", 3, `You have told him you know the word 'Ministry'. He now knows that you know. It is a small coin and you have spent it. It was probably worth it.`)],
      choices: [C("Wait for the second question.", "q2")]
    }),
    q2: N("voss", `"Second. In the gymnasium, you were allowed to look, for a quarter of an hour, at a man hanging from a hoop. You are a young person, and a clever one; you will have looked at the *wrong* things. Everyone does. What did you notice that did not fit?"\n\nHe rubs his thumb across the notebook cover. "Take your time. I have, I find, an extraordinary amount of it, though not nearly as much as I'd like."`, {
      interjections: [
        J("deduction", 4, `He did not ask what you *saw*. He asked what did not *fit*. He knows there is a gap in the scene. He is asking you to confirm the shape of the gap, not what is in it.`),
        J("volition", 4, `Whatever you say, he will carry. It will go in a pocket. It will be there in the morning, and you will not.`)
      ],
      choices: [
        C(`"The rope. Cut, not frayed. The knot was a Vanguard knot."`, "q2_rope", { cond: "flag.clue_rope" }),
        C(`"The portrait. Torn open. Something behind it."`, "q2_mic", { cond: "flag.clue_mic" }),
        C(`"Nothing. A man hanged himself. I didn't see anything that didn't fit."`, "q2_nothing"),
        C(`"You tell me what doesn't fit, Inspector."`, "q2_back")
      ]
    }),
    q2_rope: N("voss", `"The rope." He closes his eyes briefly. "Cut. A Vanguard knot. Square, not granny. A girl with a good manual." He opens them. "Thank you. I had it already, you understand. It is not news. But it is a pleasure to hear it from a witness who has no reason to say it except that it is *true*. That is rarer than I had hoped." A pause. "Please do not repeat it to the Principal. She is under the impression it was an accident of enthusiasm."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: 3 }, { set: "voss_told_rope", val: true }],
      interjections: [J("instinct", 5, `He *had* it already. Which means he is investigating Rhea, or has been told not to. It cannot be the first. A man who knows who tied the knot and sits on a car step drinking tea is a man with orders.`)],
      choices: [C("Wait for the third question.", "q3")]
    }),
    q2_mic: N("voss", `"Behind the portrait." For the first time, the voice loses a whole degree of warmth. He is looking at the notebook. "Ah. You've seen it. Then you are in a very small room with me, {name}, and I am sorry about that. The Warden's portraits have been wired in every school in the Union for nine years. It is not a secret, as such. It is a *discretion*." He looks up. "Please do not tell the Principal that you know. She believes the portraits are only portraits. It is the last thing she has."\n\nThe warmth returns, slowly, as it would after a cloud. "I'd rather you had not said it. I'd also rather you had said it to *me*."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: 6 }, { set: "voss_told_mic", val: true }, { set: "voss_knows_mic", val: true }],
      interjections: [J("authority", 4, `He has just shown you where the line is. The line is *your life*, and it is very close.`), J("empathy", 4, `He is more afraid of the portrait than you are. That is not an insight he would enjoy having noticed.`)],
      choices: [C("Wait for the third question.", "q3")]
    }),
    q2_nothing: N("voss", `"Nothing." He smiles, not unkindly. "A man hanged himself, and nothing in the room was out of place. That is, if I may say, an extraordinary statement. It is the sort of statement that has an enormous amount of effort behind it." He tilts the cup. "No. It is a good answer. It is exactly the answer that a person would give who had not been in the gym, or who had. I admire the economy."\n\nHe makes no note. "I'll mark it down as 'cautious'. It is, I assure you, the best thing one can be in this district."`, {
      onEnter: [{ surv: 1 }, { set: "voss_noted_cautious", val: true }],
      choices: [C("Wait for the third question.", "q3")]
    }),
    q2_back: N("voss", `"I?" He laughs, a short real laugh. "I am the one asking. But very well. You have broken the rules of the game with such nicely judged impertinence that I feel obliged to reward you." He takes a breath. "What did not fit was *that nobody was surprised*. The cadets, the Principal, the Lieutenant: all were upset, and none was surprised. Not one of them said 'but he was happy.' Not one said 'but he had no reason'. They said 'poor man', as if they had been waiting for it. That, {name}, is what did not fit."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { set: "voss_gave_observation", val: true }, { xp: 1 }],
      interjections: [J("dialectics", 5, `Excellent. He has given you a true thing for a true thing. The balance is delicate; he has set the scale and you do not know the weights.`)],
      choices: [C("Wait for the third question.", "q3")]
    }),
    q3: N("voss", `"Third." He puts the thermos down on the ground at his feet, carefully, as if it had a baby in it. "Have you come across a green book? A cloth-bound ledger, a slim one, in a dead man's hand. Columns. Dates. I will tell you, so that you know exactly what I am asking, that it is the only thing in this entire matter that I am required to find. Everything else, the rope, the portrait, the poor man, is paperwork. The book is the *point*."\n\nHe looks at you, and the tiredness has gone out of his face and something much more attentive has come into it. "Take your time."`, {
      interjections: [
        J("instinct", 6, `Everything he said before was warm-up. THIS is the question. His whole body has tilted, very slightly, like a dog's. He is not asking if you have it. He is asking if you are the sort of person who would.`),
        J("composure", 5, `Whatever you say, say it *without moving your hands*. They know where the book is. They have been very still since the word 'green'.`, { cond: "has('ledger') || flag.found_ledger" })
      ],
      choices: [
        K(`"No. I haven't seen any book."`, "composure", 12, "voss_q3_deny", "q3_deny_pass", "q3_deny_fail", { white: false }),
        C(`"I have heard of one. I do not know where it is."`, "q3_half"),
        K(`"What book? I am a student. I study the books I'm given."`, "rhetoric", 11, "voss_q3_dumb", "q3_dumb_pass", "q3_dumb_fail", { white: true }),
        C(`"Why does the Ministry want a book?"`, "q3_ministry")
      ]
    }),
    q3_deny_pass: N("voss", `He holds your eye for a moment. Then he nods, once, as one nods to a clock. "Thank you." You cannot read him. You cannot, for the first time all morning, read him at all. "I believe you. That is not the same as 'I believe it', but it is a long way toward it. I find, {name}, that I am almost never able to be glad about a lie. It is peculiar to be glad of one now."\n\nThe thermos goes into his coat.`, {
      onEnter: [{ surv: 2 }, { xp: 2 }, { set: "voss_denied_ledger", val: true }],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    q3_deny_fail: N("voss", `"No." He says it back to you, softly, the way a person tries a key in a lock. "No. You haven't seen any book." And you realise it is exactly the right sentence and exactly the wrong voice. He nods, slowly. "Thank you. You do not know, I think, how much that tells me." He does not say what. He says, pleasantly, "Your hands were very still, {name}. They are never still. I have watched you for an hour. Mostly you hold the cuff of your sleeve. When I said 'green', you stopped."\n\nHe doesn't seem triumphant. He seems sorry.`, {
      onEnter: [{ add: "voss_trust", n: -1 }, { surv: 8 }, { set: "voss_caught_lie", val: true }, { set: "voss_suspects_ledger", val: true }],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    q3_half: N("voss", `"Heard of one." He says it as if turning it over in his palm. "Honest. A third of an honest answer is, in this district, as good as a whole one in any other. That's all right. That will do. I would simply ask, as a courtesy between colleagues, that if you were to *hear* of its whereabouts, you would hear of them in my direction first."\n\nHe smiles, a small, disarming, rueful smile. "I would not harm the one who brought it. I should say that, since you will not otherwise believe it. I would not harm *anyone*. That is, I'm afraid, the whole difficulty."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: 4 }, { set: "voss_heard_ledger", val: true }],
      interjections: [J("empathy", 4, `'I would not harm anyone: that is the difficulty.' He is telling you the truth. He has never harmed anyone. The Bell does it for him. He is a man whose hands are clean and whose ears are not.`)],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    q3_dumb_pass: N("voss", `He laughs: a startled, young, helpless laugh that seems to surprise him, and he puts the back of his hand to his mouth like a man who has hiccupped in church. "A student. Who studies the books he's given." He wipes an eye. "Forgive me. That is a perfect answer. Perfect. It is the answer of a person who has understood the entire State and can quote it back with a straight face."\n\nHe recovers. "I'll write 'obedient'. It will do you no harm and it is not, I think, quite true."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: -2 }, { xp: 2 }],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    q3_dumb_fail: N("voss", `"What book?" he says, gently. "A student. Who studies the books he is given." He lets it hang in the air like a string of washing. "I think that was a good line spoiled by a worse delivery. You said it as though you had been told to say it. I don't suppose you were. I think you got it from a poster." He doesn't seem displeased. "Never mind. It is a fine thing to have a poster in one's head. I have several. They are very warm in winter."`, {
      onEnter: [{ surv: 3 }],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    q3_ministry: N("voss", `"Why does the Ministry want a book." He seems pleased, and a little tired, as if he had been waiting for the question and had hoped it would not be asked. "That is the question I am least allowed to answer, which is why it is the best one. Very well, in outline. A thing that has been written down can be read. A thing that can be read can be believed. A thing that can be believed can, in the wrong hands, be *remembered*. And the Ministry's whole function, if you will forgive a man his job, is to make sure that nothing is remembered that should not be."\n\nHe taps the notebook. "Not the book. The *remembering*. I should like to stop the remembering and keep the book. It is, I find, a poor trade."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { surv: 4 }, { set: "voss_admitted_remembering", val: true }, { thought: "th_quiet_hours" }],
      interjections: [J("dialectics", 5, `He answered. An Inspector does not answer. A *Quiet Officer* does. He has told you which hat he is wearing, in a sentence that began with 'the Ministry'.`)],
      choices: [C("Wait for your questions.", "ask_back")]
    }),
    ask_back: N("voss", `"Your turn." He settles back, hands loose between his knees, the way a man sits when he is about to be generous. "Three. As promised. The truth, within the limits of my station, and I'll tell you honestly where the limits are."`, {
      voices: 2,
      interjections: [
        J("rhetoric", 4, `Choose each question as if it were your last. A person who has just promised three honest answers will give you three honest answers, but exactly three. Not a syllable over.`),
        J("instinct", 5, `Whatever you ask, watch his hands. He will tell you the truth with his mouth. The lie, if there is one, will be in the fingers on the notebook.`)
      ],
      choices: [
        C(`"What is the Ministry of Quiet Hours?"`, "ask_ministry", { cond: "!flag.voss_asked_ministry" }),
        C(`"Why are you really here?"`, "ask_why", { cond: "!flag.voss_asked_why" }),
        C(`"What does the Bell do?"`, "ask_bell", { cond: "!flag.voss_asked_bell" }),
        C("That is enough. Thank him for his time.", "hub", { cond: "flag.voss_asked_ministry || flag.voss_asked_why || flag.voss_asked_bell" }),
        E("Walk away. No more questions.", { cond: "!flag.voss_asked_ministry && !flag.voss_asked_why && !flag.voss_asked_bell" })
      ]
    }),
    ask_ministry: N("voss", `"The Ministry of Quiet Hours." He says it with a certain tenderness, the way one says the name of a sick relative. "A bureau of the Chancellery. It was founded after the Hunger Winter. I was not alive for the beginning; I am not sure I am alive for the middle. Its charter is a page and a half, and the first line is: *To spare the people what they cannot bear.* It was, I am told, written by a woman who had eaten something in the Winter that she could not say. They called it Mercy, in the first drafts. Then they called it Quiet."\n\nHe is staring at the loudspeaker pole across the street. "We take nothing from you that you need. Only the hours in which you would otherwise lie awake. It is a very gentle service. I should know. I am the field officer for District Nine."`, {
      onEnter: [{ set: "voss_asked_ministry", val: true }, { set: "voss_admitted_quiet", val: true }, { add: "voss_trust", n: 1 }, { surv: 4 }, { thought: "th_quiet_hours" }, { note: "task_voss", text: "Voss admits it: he is the Ministry of Quiet Hours' field officer for District 9. 'To spare the people what they cannot bear': the Ministry's charter. He says it was founded after the Hunger Winter, and that its first name was Mercy." }],
      interjections: [
        J("archive", 4, `The Ministry of Quiet Hours: chartered nine years after the Hunger Winter ended, by a Decree whose text is available on request in the Chancellery Library. Which has no public entrance.`),
        J("doublethink", 4, `Mercy! You see? It was always a kindness. Look at his face. You can see he believes it. Isn't that the most reassuring thing you have ever seen?`, { effects: [{ surv: -1 }] })
      ],
      choices: [C("Ask your next question.", "ask_back")]
    }),
    ask_why: N("voss", `"Why am I here." He takes a long moment. "Officially, to close the Ostrov file, which is already closed: the Principal closed it at eight this morning, and I have initialled her closing. Unofficially, to find a green book. And *really*..." He turns the cup in his hands. "I have arrived in District Nine on a Wednesday every year for nine years. It is the one district on my circuit I would call mine. I have been given, this time, three days, and a young person who will not take a fourth sip of my tea." A faint smile. "I came, in the end, for the same reason anyone comes to a school. To find out who is still *in* it."`, {
      onEnter: [{ set: "voss_asked_why", val: true }, { add: "voss_trust", n: 1 }, { surv: 2 }],
      interjections: [J("empathy", 5, `He means that last sentence entirely. He is a man who has spent his life looking for someone in rooms. He no longer knows whether he is looking for a person or the shape of a gap.`)],
      choices: [C("Ask your next question.", "ask_back")]
    }),
    ask_bell: N("voss", `"The Bell." He doesn't answer at once. He looks at you for a long time, and the look is almost medical, and then, for a moment, personal. "Do you want the Ministry's answer, or mine? The Ministry's is a lullaby. It protects. It prevents a certain accumulation. I could recite it. It's a very nice sentence."\n\n"Mine is: the Bell is a pair of tones a few cycles apart. The beat between them is the sound of a door being shut in your head. It does not erase. It *blurs*. A little more every night, until the edges are so soft you can walk through them. A student wakes with the afternoon gone. A man forgets a bridge. A woman, one day, does not know her husband's face." He stops. "I have been present, as an officer, at the building of a great many soft edges. I am told that is what mercy looks like, from the inside."`, {
      onEnter: [{ set: "voss_asked_bell", val: true }, { set: "knows_static", val: true }, { add: "voss_trust", n: 2 }, { surv: 5 }, { xp: 2 }, { thought: "th_bell_tolls" }],
      interjections: [
        J("senses", 5, `He said 'a woman, one day, does not know her husband's face'. His voice changed on 'husband'. It rose a half-tone, the way a voice does when a person has swapped the word for another at the last second.`),
        J("volition", 5, `He has just told you the truth about the Bell. A Quiet Officer. In a street. To a student. Ask yourself why. Is it a gift? A bait? Or a man who is so tired he has stopped keeping the difference?`)
      ],
      choices: [C("Ask your next question.", "ask_back")]
    }),
    hub: N("voss", `"{name}." Voss smiles, a little slowly, as at a friend arriving late to a funeral they have both been dreading. The thermos is on the car bonnet. He has, apparently, been waiting. "What shall we do with the morning? I'm at your disposal until the tea goes cold, and I find, rather surprisingly, that it never does."`, {
      voices: 3,
      interjections: [
        J("instinct", 4, `Everything he says is a door held open. That is the trap of him: not that he forces you through, but that every door he holds is the one you'd have picked.`),
        J("empathy", 4, `Look at his shoulders. They have come down a quarter-inch since this morning. He is more at ease with you than with anyone in District Nine. It would be a kind of cruelty to use that. It would be a kind of cruelty not to.`, { cond: "flag.voss_trust >= 2" }),
        J("composure", 4, `He is watching your hands. Not for tells. For the pleasure of watching a young person's hands. It is, in its way, the most unsettling thing about him.`)
      ],
      choices: [
        C("Ask him your remaining questions.", "ask_back", { cond: "flag.voss_game && !(flag.voss_asked_ministry && flag.voss_asked_why && flag.voss_asked_bell)" }),
        C("Take a walk with him along the avenue.", "walk", { cond: "!flag.voss_walked" }),
        C("Accept a lift. See the district from the car.", "ride", { cond: "flag.voss_walked && !flag.voss_rode" }),
        C("Ask about the sweet roll in his pocket.", "roll", { cond: "flag.nadia_told_voss && !flag.voss_roll" }),
        C("Ask to see where the Bell is made.", "invite", { cond: "flag.voss_walked && !flag.voss_invited && flag.voss_trust >= 2" }),
        C("Hear what he is offering.", "offer", { cond: "flag.voss_walked && flag.voss_rode && !flag.voss_offer_made" }),
        C("Confront him with what you know.", "expose", { cond: "(has('relay_log') || flag.voss_file_seen) && !flag.voss_exposed" }),
        C(`"I'd like to go home, Inspector. I'd like it all to stop."`, "quiet", { cond: "flag.voss_trust >= 2" }),
        E("Excuse yourself.")
      ]
    }),
    roll: N("voss", `He does not move for a second. Then his hand goes to the pocket of the long coat and comes out holding a small, slightly squashed sweet roll, in a twist of paper. He looks at it as if it were a letter in someone else's handwriting. "Ah. Miss Fell has been talking." He is not angry. "I buy one on Wednesdays. I have bought one every Wednesday for six years. I cannot say why." The roll turns in his fingers. "It is a thing my hand does. I have, in my pocket at this moment, I believe, thirty-one rolls, in various stages of regret. I have never once eaten one."\n\nHe puts it back, tenderly. "If you are about to say that it is a symptom, you are probably right. If you are about to say it is a clue, you are probably right about that, too. I would only ask that you say neither, just now."`, {
      onEnter: [{ set: "voss_roll", val: true }, { add: "voss_trust", n: 1 }],
      interjections: [J("empathy", 5, `Thirty-one rolls. One a week. Wherever he is going on Wednesdays, a child ate sweet rolls. The hand knows. The head has been told otherwise.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Say nothing. Let him have it.", "hub"), C("Offer him a bite of your own, if you have one.", "hub", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }, { add: "voss_trust", n: 2 }, { set: "voss_roll_shared", val: true }] })]
    }),
    walk: N("narrator", `You walk. It is not a thing you decided, any more than the tea. Voss falls into step on the kerb side, as one does with a lady, and puts his hands behind him like an Inspector in an old play. For ten minutes, then twenty, you move down the avenue's long grey spine at the speed of a man who has nowhere to be and a great deal he would like to say. Loudspeakers lean in over your heads. The queue falls behind. The tram wires sing.\n\n"I walk every district I'm sent to," he says. "It's the only way to find what it smells like. A district has a smell, did you know? Not the drains. A *mood*. This one smells of ironed collars. And, underneath it, something sweet that has gone slightly wrong."`, {
      onEnter: [{ set: "voss_walked", val: true }, { time: 20 }, { add: "voss_trust", n: 1 }],
      voices: 3,
      interjections: [
        J("the_grey", 4, `He is very good for the street. He walks like someone who is trying not to hurt it. It's a long time since anyone walked on me like that: with their whole weight in the heels and none of it in the toes.`),
        J("solidarity", 4, `We could be two ordinary people on an ordinary morning. It is a terrible thing to want. It is a lovely thing to feel. Hold on to both.`),
        J("authority", 4, `He has set the pace. He has set the topic. Take one of them back before the end of the block.`),
        J("senses", 4, `A flat grey wool coat, a smell of cedar and lamp oil, and something that you cannot name that you realise is *absence*. The smell of a man who lives alone, in a clean flat, with all the windows closed.`)
      ],
      choices: [
        C("Ask what the Ministry actually does.", "walk_ministry", { cond: "!flag.voss_walk_ministry" }),
        C("Ask about the mitten in the car.", "walk_mitten", { cond: "(flag.voss_mitten_seen || flag.voss_card_seen) && !flag.voss_daughter_known" }),
        C("Walk in silence. Let him fill it, or not.", "walk_silence", { cond: "!flag.voss_walk_silence" }),
        C("Turn back toward the school.", "hub")
      ]
    }),
    walk_ministry: N("voss", `"What it *does*." A half-smile. "Strictly, it keeps a ledger of what a district may remember. We call them Reductions. A Reduction is a small, ordinary mercy: an outbreak of rumour, a bad winter, an unlucky death. We decide how many hours the district can carry before the load becomes dangerous, and we lift that load. Very little is taken; I wish you to understand that. A man who remembers everything is a man who cannot be a neighbour. The Hunger Winter taught us. In the third month the children in the Winter Quarter *knew* what the adults had done, and the adults knew they knew, and..." He stops. "That is the part of the Ministry's charter that is not published."\n\nHe looks, for a moment, much older. "We keep a country *civil*. That is all. It is only that the price of civility is that every so often a person in a school is asked to forget they were brave."`, {
      onEnter: [{ set: "voss_walk_ministry", val: true }, { add: "voss_trust", n: 1 }, { xp: 2 }, { thought: "th_quiet_hours" }],
      interjections: [
        J("dialectics", 5, `His argument: remembering the Winter makes you cruel; forgetting makes you kind; therefore forgetting is kindness. Check the middle. A people who forget the Winter may do it again. A people who forget *everything* cannot be held to account for anything.`, { once: true, effects: [{ xp: 1 }] }),
        J("empathy", 4, `He does not enjoy the argument. He recites it the way a man recites a prayer he stopped believing in and keeps for the sake of the tune.`),
        J("solidarity", 5, `We would rather remember and be cruel than forget and be kind, because only the first one is *ours*. Say it. Say it later. Say it in the right place.`, { cond: "ideo.undercurrent >= 2" })
      ],
      choices: [
        K(`"You are describing amnesty. It is not mercy unless the people choose it."`, "rhetoric", 12, "voss_walk_consent", "consent_pass", "consent_fail", { white: true }),
        C("Say nothing. Walk on.", "walk")
      ]
    }),
    consent_pass: N("voss", `He stops walking. For several seconds he looks at the middle of the road, with his hands behind him, as though at an old photograph. "Consent." He says it as if it were a foreign word he had heard once. "Yes. That is the crack in it. I have known there was a crack for some time." He lets out a long, shaking breath. "Nobody has said it in nine years. Not once. It's an appalling word. It is the only word the Ministry's lawyers never put in the charter, and I am told they spent an evening arguing about it."\n\nHe resumes walking, slower. "You will be a dangerous person, {name}. I should like to be near you when you are."`, {
      onEnter: [{ add: "voss_trust", n: 2 }, { xp: 3 }, { set: "voss_consent_said", val: true }, { surv: 3 }, { thought: "th_double_agent" }],
      choices: [C("Walk on.", "walk")]
    }),
    consent_fail: N("voss", `"Consent." He smiles with a kind of professional fondness. "A good word. The Ministry has read it. It was a very short meeting." He does not slow. "Remember, {name}, that no people has ever *chosen* to be quieted. They are only grateful afterward. And gratitude, in my experience, is the only form of consent that lasts."\n\nIt is a very good answer. It is a very bad one. You cannot tell which, and he can, and he is sorry on your behalf.`, {
      onEnter: [{ surv: 3 }],
      choices: [C("Walk on.", "walk")]
    }),
    walk_mitten: N("voss", `He does not answer for a while. A tram goes by on the next street, unseen, a thin electric sigh. "You looked in the car," he says. "Of course you did. A student's first lesson is that every locked thing has a reason." He doesn't say it unkindly. He stops beside a lamp-post, one hand on it, as though he needed a rail.\n\n"I had a daughter. Mira. I have one, I should say; I have every reason to think she is alive. Nine years ago I was posted to the first relay that ever ran the Bell for a whole district. I was a very young Officer. I stood in a room with a dial, and I was not careful about which dial. When I came home, there was a woman in my kitchen and a child at the table, and they looked at me politely, as they might at a man come to read the meter." He is quite calm. "I said, 'I'm sorry.' And the little girl said, at exactly the same moment, 'I'm sorry,' and we all heard it. And I have never in my life been able to say which of us began."`, {
      onEnter: [{ set: "voss_daughter_known", val: true }, { add: "voss_trust", n: 2 }, { xp: 3 }, { thought: "th_borrowed_memory" }, { note: "task_voss", text: "Voss had a daughter, Mira. Nine years ago, after the first relay test, he came home and neither she nor her mother knew him, or he did not know them: they said 'I'm sorry' at the same moment and he has never known who began it. He remembers everything else. He keeps the mitten in the car." }],
      interjections: [
        J("empathy", 3, `He is not asking for pity. He is describing a fact, the way a man reads out a weather report for a town he has left. But his thumb has found the same spot on the lamp-post six times, and the paint is gone there.`),
        J("senses", 5, `Under the voice, the breathing. Four counts in, four out. A man who has learned breathing as a technique, and uses it, now, to keep a sentence from shaking.`),
        J("volition", 4, `Do not say 'I'm sorry'. It is the one sentence that has hurt this man more than any other. Find a different one.`, { cond: "skill('volition') >= 4" })
      ],
      choices: [
        K("Tell him, quietly, that it does not matter who began it.", "empathy", 11, "voss_mitten_empathy", "mitten_pass", "mitten_fail", { white: true }),
        K(`Ask whether he has ever tried to find out. Whether the Ministry would tell him.`, "dialectics", 11, "voss_mitten_dialectics", "mitten_dia_pass", "mitten_dia_fail", { white: true }),
        C("Say nothing. Stand by the lamp-post with him.", "mitten_quiet")
      ]
    }),
    mitten_pass: N("voss", `"It does not matter." He repeats it to himself, wondering. Then, slowly, he takes his hand off the lamp-post and looks at the palm: a little rust has come off on it. He wipes it on his coat. "I have asked a great many people, over nine years, whether it mattered, and not one has thought to say that it *didn't*. They said 'of course it matters'. Or 'I'm so sorry'. It is a strange thing to be told you are allowed to stop counting." He gives a small laugh with no breath in it. "I do not know that I can. But thank you. It was a very good sentence."\n\nHe offers his arm, a gesture of such old-fashioned formality that you take it before you think. You walk on like that for a block.`, {
      onEnter: [{ add: "voss_trust", n: 2 }, { xp: 3 }, { morale: 1 }, { set: "voss_empathy_win", val: true }],
      choices: [C("Walk on with him.", "walk")]
    }),
    mitten_fail: N("voss", `"Of course it does," he says, quite gently, "but thank you." It is the voice of a man being polite to the surgeon who has missed. He does not take his hand from the lamp-post. "One learns that the question of who began it is the only one that will not take no for an answer. It is a very persistent little question. I have had nine years to wish it would go away, and it has had nine years to make itself at home."`, {
      choices: [C("Walk on with him.", "walk")]
    }),
    mitten_dia_pass: N("voss", `He turns his head, slowly. "Have I tried." For a moment he looks at you with something like gratitude, and something like fear. "I have not. I am a Quiet Officer. The Ministry has a file on me: it is the one file I am not permitted to open. A rule that I helped write, in my first year, to protect the Officers from their own *curiosity*." He lets out a breath. "That is the one thing I have never told anyone. You have just, in one sentence, asked me why I do not read a file that has been in the same building as me for nine years."\n\nHe looks at the sky, which gives him nothing. "I do not know the answer. I rather think that, if I read it, I would have to do something about it."`, {
      onEnter: [{ add: "voss_trust", n: 2 }, { xp: 3 }, { set: "voss_file_unread", val: true }, { thought: "th_double_agent" }],
      interjections: [J("dialectics", 5, `A man who refuses to read his own file is a man who suspects what it says. A man who suspects, and does not read, has already decided it will be bad. You have found the lock. It is a very small, very private one.`)],
      choices: [C("Walk on with him.", "walk")]
    }),
    mitten_dia_fail: N("voss", `"I'm afraid that is the one thing I am not permitted to say." It is almost apologetic. "It is, as we say, *above my floor*." He lets go of the lamp-post. His face has closed like a good door. "I appreciate the question. I assure you that I have asked it of myself more elegantly."`, {
      onEnter: [{ surv: 2 }],
      choices: [C("Walk on with him.", "walk")]
    }),
    mitten_quiet: N("narrator", `You stand by the lamp-post with him. Neither of you says anything. A pigeon lands and decides against it. After some time, a very long time for a street, a loudspeaker over your heads coughs, clears its throat in its tin way, and begins, not a broadcast, but the faint hum of one: the sound of a machine that is beginning to remember its job.\n\nVoss looks up at it with great tenderness, as one looks at a sleeping animal that might wake and be hungry. "Thank you," he says, and you do not know for what. "Shall we go back?"`, {
      onEnter: [{ add: "voss_trust", n: 2 }, { xp: 2 }, { set: "voss_silence_shared", val: true }],
      choices: [C("Walk back with him.", "walk")]
    }),
    walk_silence: N("narrator", `You say nothing. After two blocks, he stops filling the silence and starts, instead, to inhabit it, the way a man who has been talking all day finally takes off his shoes. Gulls cry over the Quay, which you cannot see. The tram wires shake in a wind that has not reached the street. There is a sort of companionship in it, thick as soup. He offers no theory. He asks no question. At the corner, he says: "Thank you for the quiet. It has been a very long time since anyone gave me it for nothing."`, {
      onEnter: [{ set: "voss_walk_silence", val: true }, { add: "voss_trust", n: 1 }, { xp: 1 }],
      interjections: [J("composure", 4, `You did nothing and it worked. Write that down, in the part of you that is still taking notes.`)],
      choices: [C("Walk on.", "walk")]
    }),
    ride: N("narrator", `The car smells like cedar and the ghost of a child. He holds the passenger door, a small, rather ceremonious flourish, and as you sink into the leather, the whole avenue falls away behind the glass. The engine is soundless. The mitten on the dashboard sways at every turn. "I'd like to show you something," says Voss, "not as an Inspector. As a man who is obliged to look at it every week. I'd be grateful if you would not interrupt until I've finished. I'll be brief." He pulls out into the road with the gentleness of a man launching a boat.\n\nHe drives for half an hour. He shows you three things.`, {
      onEnter: [{ set: "voss_rode", val: true }, { time: 30 }, { add: "voss_trust", n: 1 }],
      voices: 3,
      interjections: [
        J("the_grey", 4, `I know every kerb he takes. I know the cracks. He is driving the route the way a man walks a grave: by heart.`),
        J("instinct", 5, `A car is a closed room with a window. You are in his room. Nothing has happened; everything could. Notice that you feel *safe*. That is the most alarming data point you have.`),
        J("deduction", 4, `The route: Karsov, Cinder, a left onto Hallow Lane. Seven red circles on his map, he is driving through them in numerical order. They are not crime scenes. They are *wounds*.`)
      ],
      choices: [C("Look out of the window.", "ride_clinic")]
    }),
    ride_clinic: N("voss", `"The first." A long low building behind a hedge, windows with the blinds drawn on all but one, where a woman in a nightgown stands with her palms flat against the glass, smiling at nothing. "The Quiet Clinic, Hallow Lane. For citizens who have had, as the form says, a *difficult adjustment*. Forty beds. The woman in the window is a schoolteacher from Vorsk. She has been here eleven days. Some mornings she asks for her class. Some mornings she asks for her mother. Some mornings she asks me who I am, and I tell her, and she thanks me."\n\nHe does not look at the window. He looks at the road. "These are the ones the Bell gets wrong. A very small percentage. Less than one in four hundred. The Ministry has a figure. I keep a different one, in my head, which is the number of faces."`, {
      onEnter: [{ set: "voss_saw_clinic", val: true }, { note: "task_queue", text: "Voss showed me the Quiet Clinic on Hallow Lane: forty beds, a teacher from Vorsk with her palms on the glass. This is where the Bell's mistakes go. Pip's mother may be in there." }],
      interjections: [
        J("empathy", 5, `Her palms are flat on the glass. The way a person touches the window of a train she did not mean to board.`),
        J("solidarity", 4, `We should know her name. Somebody should carry it. We cannot carry it. That is what is wrong with us.`)
      ],
      choices: [C("Ask nothing. Look.", "ride_home")]
    }),
    ride_home: N("voss", `"The second." A grey gate. Behind it a yard, a low brick house with tiny windows, and in the yard twelve small children in red-brown, drilling in two straight lines, in the cold. Not one is crying. Not one is out of step. They have the stillness of a drawing. At the end of the line, a tall girl in the same uniform, with a very straight back, is correcting a boy's elbow. You know the back. You know the hair.\n\n"Vanguard Home Number Three. Ward Nine. The youngest enrolled are five. They are given, in addition to the evening Harmony, a *pedagogic* dose, which is the double. Most do not remember their parents. They're told they were orphaned by the Winter. It is not always a lie." He stops the car with a small shiver of the wheels. "Your Miss Vantage was in that yard at five. She comes back on Wednesdays. She tells them stories about the Warden. She is, you may be surprised to hear, extremely kind."`, {
      onEnter: [{ set: "voss_saw_home", val: true }, { set: "rhea_orphans_known", val: true }, { task: "task_rhea2", state: "active" }, { note: "task_rhea2", text: "Vanguard Home Number Three, Ward Nine: twelve children under ten in a cold yard. Rhea Vantage was raised there. She goes back on Wednesdays to teach the little ones. Voss says she is extremely kind. I do not doubt it." }, { thought: "th_loyal_rhea" }],
      interjections: [
        J("empathy", 5, `She is a child who learned that obeying is how you are looked at. She is teaching it to the ones who come after, so that they will be looked at too. It is the worst and the most loving thing you can do.`),
        J("authority", 4, `Twelve children, two lines, no fidgeting. You know that discipline. It is not hers. It is a drill that was set into the walls before she arrived.`)
      ],
      choices: [C("Ask nothing. Look.", "ride_bridge")]
    }),
    ride_bridge: N("voss", `"The third." Stance Bridge: a long arch of iron over a grey, slow river. At the far end, a stain on the pier where the paint has never taken, a pale patch of repair, like a scar in a coat. "Six years ago a tram went into the river here. Driver error, said the report. The driver, a man named Tomek Fell, had driven that route twenty-two years. I read the Ministry's own note. The note says he'd had a *difficult night's Harmony*. Eleven passengers. Nine lived. I was in the car that came."\n\nHe says it all without a sound in it. "I put it in the quarterly. I put it in the column that says 'tolerable'. I have a very good head for figures. I often wish that I did not."\n\nHe turns off the engine. A heron on the pier is considering the water.`, {
      onEnter: [{ set: "voss_saw_bridge", val: true }, { add: "voss_trust", n: 1 }],
      interjections: [
        J("the_grey", 3, `The stain is mine. I tried to rub it out. I can't. Some stains are a river's memory, and a river keeps its word.`),
        J("dialectics", 5, `Eleven passengers. Nine lived. 'Tolerable.' He has told you exactly where the Ministry sets its price: two in eleven. About one in five. The number is on a form.`, { effects: [{ set: "voss_tolerable_figure", val: true }] })
      ],
      choices: [C("Ask why he is showing you all this.", "ride_end")]
    }),
    ride_end: N("voss", `"Why." He puts both hands on the wheel, at ten and two, like a driving-school photograph. "Because a person ought to see the invoice before he is asked to buy. The Ministry has shown me for nine years. I would like someone younger and cleverer to look at it and tell me whether it adds up." He turns to you, and his face has the stark, naked tiredness of a man who has been asking himself the same question in the dark of a car for years. "I think it does. Two in eleven, against what the Winter did. I think it adds up. I have never been able to *stand* that it does."\n\n"I want you to see it, so that whatever you choose, you choose it knowing. I have never been able to offer anyone the one thing that I would most like to be given."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { xp: 2 }, { note: "task_voss", text: "Voss drove me past the Quiet Clinic, the Vanguard Home and Stance Bridge. 'A person ought to see the invoice before he is asked to buy.' He thinks it adds up. He cannot stand that it does." }],
      interjections: [
        J("empathy", 5, `He is telling the truth. He is also doing exactly what an Officer does: showing you the cost so that you will accept the offer to be part of reducing it. Both. Both are true at once. That is how he lives.`),
        J("doublethink", 4, `Look how fair he is! Look at the figures! A man who shows you the bad side is a man you can believe. Who could refuse such honesty?`, { effects: [{ surv: -1 }] }),
        J("rhetoric", 5, `He has just done what the best persuaders do: not argued for his case, but let you feel the cost of the alternative. The alternative is *not knowing*. It is almost impossible to argue against.`)
      ],
      choices: [
        C("Say that you understand why he does it.", "ride_understand", { effects: [{ add: "voss_trust", n: 1 }, { ideo: "quiet", n: 1 }] }),
        C(`Say that it should still not be done to people who haven't been asked.`, "ride_refuse", { effects: [{ ideo: "undercurrent", n: 1 }, { add: "voss_trust", n: 1 }] }),
        C("Say nothing. Let the heron think.", "ride_silent")
      ]
    }),
    ride_understand: N("voss", `"Thank you." He starts the car. "I should say that I know how that sentence sounds, coming from a Quiet Officer to a boy in a school cap. I will try not to use it." The mitten sways. "I shall take you back. I should like to say more, but I find I'd like to *offer* it, in the proper manner, over a pot of something, and not on a bridge."`, {
      onEnter: [{ time: 10 }],
      choices: [C("Ride back.", "hub")]
    }),
    ride_refuse: N("voss", `He is quiet for a long time. "Yes," he says at last. "That is the crack in it." The engine turns over. "I have always known it was there, and I have found it easier to drive past than to mend. You are the first to say it to my face, in my own car, and not to the windscreen." A little smile, absolutely without humour. "You will make an excellent enemy, {name}, and I should like us to avoid it."`, {
      onEnter: [{ time: 10 }],
      choices: [C("Ride back.", "hub")]
    }),
    ride_silent: N("narrator", `You say nothing. The heron decides against the river. Voss, after a time, starts the engine and turns the car. There is a way of being quiet in a car with a person that is a whole conversation. You have, you realise, just had one. It went well. You will never know what it was about.`, {
      onEnter: [{ time: 10 }, { xp: 1 }],
      choices: [C("Ride back.", "hub")]
    }),
    invite: N("voss", `"Where the Bell is made?" He raises an eyebrow, a small flat arch of astonishment that is not entirely feigned. "I would be delighted, I think, and also unable to forgive myself. A tour, no more. I will ring ahead. They will be as helpful as the Ministry's discretion allows, which is to say, as helpful as a very polite wall." He studies you. "Understand: I am not giving you the key. I am letting you see the door. If you take anything, I shall know. If you break anything, I shall know. If you *understand* anything..." A small, rueful smile. "I shall be delighted."\n\nHe takes a card from his pocket, writes something in four fast strokes and puts it away again. "They will expect you. Be kind to Tomas, the engineer. He has not slept since Monday and the Captain has not once asked him why."`, {
      onEnter: [{ set: "voss_invited", val: true }, { add: "voss_trust", n: 1 }, { task: "task_relay", state: "active" }, { note: "task_relay", text: "Voss has rung ahead: I may tour District Relay No. 4 as his guest. 'If you take anything, I shall know.' He is giving me the door and watching what I do with it." }, { surv: 2 }],
      interjections: [
        J("instinct", 5, `It is a test. It is also a gift. Both of them are being honest. This is what makes him the most dangerous man in the district: he has learned to be *sincere in his traps*.`),
        J("authority", 4, `He has given you rank for a day. A day is plenty.`)
      ],
      choices: [C("Thank him.", "hub")]
    }),
    quiet: N("voss", `He is silent for a long time. Then he puts the thermos carefully into his coat, as one stows a small, dear thing, and when he speaks it is in the voice of a man at a bedside, saying the true thing very softly so as not to wake it.\n\n"I can do that." He does not say it as an offer. He says it as a fact about the world, like the time of the next tram. "A word to the Matron. A clean file, a closed one. A cup of tea at seven, a bed, a good night. Tomorrow you wake and it is a Wednesday you do not remember being worried on. You will have a little ringing in your ears, which you will think is a cold. There will be a Jubilee, and you will stand in a field with the others and be moved, and you will not be among the ones who are *asked* anything, ever. I would, if I were a better man, tell you not to." He looks at the sky. "I would be sorry. And a good deal relieved."\n\nHe waits. "It is quite genuinely your choice."`, {
      onEnter: [{ set: "voss_quiet_offered", val: true }],
      interjections: [
        J("appetite", 4, `A bed. A blanket. Tea at seven. A whole life of not having to know. Do you know how long it has been since anyone *offered* you that, without a catch?`),
        J("volition", 5, `This is the easy door. It is a good door. It is kindly made. It is also the end of you, as you have been this week. Be aware of both. Choose with your eyes open.`),
        J("solidarity", 4, `We would remember you. A little. For a while.`, { cond: "flag.cell_active || flag.ledger_with_anka" })
      ],
      choices: [
        E(`"Yes. Please. Make it stop."`, { effects: [{ ending: "end_quiet" }] }),
        C("Not yet. Say you will think.", "hub")
      ]
    }),
    expose: N("narrator", `You say it plainly, in the street, with a loudspeaker overhead. You say the words: Quiet Officer. Form Q. 'Monitor, offer, dissolve.' You do not raise your voice. Voss does not move. A tram goes by on the next street, unseen. Then, slowly, with exactly the deliberation of a man putting a very old and much-loved dog out of the room, he takes his hand away from the notebook, folds both hands in his lap, and looks at you with great, tired, absolute attention.\n\n"Yes," he says.`, {
      onEnter: [{ set: "voss_exposed", val: true }, { add: "voss_trust", n: 0 }, { surv: 5 }, { task: "task_voss", state: "active" }, { note: "task_voss", text: "I told Voss to his face that I know what he is: Quiet Officer, Form Q, 'Monitor, offer, dissolve.' He did not deny it. He said 'Yes.' It was the single most dangerous word I have ever heard a man say with such courtesy." }],
      voices: 3,
      interjections: [
        J("adrenaline", 3, `YOU DID IT. YOU SAID IT TO HIS FACE. Now do not stand there. DO something. Hit him. Run. Anything.`),
        J("composure", 5, `He is as still as a closed book. There is no tell. There is only the very slight rise and fall of his chest. He is breathing in fours.`),
        J("instinct", 6, `He is not frightened. He is not angry. He is *relieved*. A man who has been hiding something for so long has just been relieved of the hiding, and he does not know what to do with his hands.`)
      ],
      choices: [C("Wait for him to speak.", "exposed1")]
    }),
    exposed1: N("voss", `"Yes," he says again. "The glove-box was the least subtle thing I have done in years. I am almost certain I left it unlocked to see who'd look." He wets his lips. "And I am delighted, absurdly, that it was you. I had hoped for someone who would say it out loud. Everyone else in nine years has either known and said nothing, or not known and been grateful." The thermos cap clicks. "I am not going to deny it. I am not going to arrest you. It would be a terrible way to meet a person I like."\n\nHe looks at his shoes. "But I should say, in plain terms, as one adult to another: I cannot let you take it any further. If you publish it, the district will be Reduced tonight, and you will be among the first, and I shall be obliged to *watch*."`, {
      interjections: [
        J("authority", 5, `He has just told you the rules of the next ten minutes. 'I am not going to arrest you' is not a promise. It is a statement of his current mood.`),
        J("empathy", 5, `He does not want to hurt you. He has told you so. It is a plain statement of fact, as a man might say that he did not want to step on the grass, and then step on it.`)
      ],
      choices: [
        C("Ask him what he intends to do about it.", "exposed2"),
        C("Say you will not publish it. Not yet.", "exposed3", { effects: [{ add: "voss_trust", n: 1 }] }),
        C("Say you will publish it at the Jubilee.", "exposed_threat", { effects: [{ surv: 12 }] }),
        C("Turn your back on him and walk away.", "exposed_walk")
      ]
    }),
    exposed2: N("voss", `"Nothing." The word comes out of him like air out of a tyre. "Nothing at all, today. That is the extraordinary thing, and I should like you to enjoy it. I am a Quiet Officer; I am meant to make decisions in the dark with a careful hand. And I find, sitting on the step of my own car, that I have no decision. I have a *cold*." He smiles. "I have, you understand, a standing order to dissolve the Undercurrent by Friday. I have not yet issued it. I have not, in fact, found the paper."\n\nHe rubs his eyes. "Come back to me when you have decided what you are. I shall try, in the meantime, to be a man who might be talked to."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { set: "voss_exposed_open", val: true }],
      choices: [C("Leave him with it.", "hub_exposed")]
    }),
    exposed3: N("voss", `"Not yet." He considers it. "Thank you. That is a very precise promise. Not *never*. Not *at once*." He nods. "I will take 'not yet'. I have been living on it for nine years." A long, thoughtful pause. "If at any point you would like to know what the Ministry would give you for staying quiet, I will tell you. I'd like to be asked. Not forced."\n\nHe lifts the thermos in a very small salute, the gesture of a man whose opponent has played honestly. "Now go and be young somewhere. You have a day, and a good deal in it."`, {
      choices: [C("Leave him.", "hub_exposed")]
    }),
    exposed_threat: N("voss", `He closes his eyes for just one second. When he opens them there is nothing left in his face at all, and what is left is a man doing his job. "At the Jubilee." He says it flatly. "In front of fourteen thousand people, with the Warden on the loudspeakers and the Vanguard at the end of every row." A beat. "I'd like to advise you, as a friend, not to. Not because you'd be stopped. Because you would be *heard*, and then forgotten, and the remembering would be wasted. I have seen it. In Vorsk, three years ago. A girl did it. She was very brave. We had her speech on a tape. She was quite wonderful."\n\n"The tape is in a drawer," he says. "She is, last I heard, in the Clinic, with her palms on the glass."`, {
      onEnter: [{ add: "voss_trust", n: -1 }, { set: "voss_suspected", val: true }, { surv: 6 }],
      choices: [C("Leave him.", "hub_exposed")]
    }),
    exposed_walk: N("narrator", `You turn your back on him. It is the most frightening thing you have ever done and it takes you eight steps to realise that you are doing it in the exact stance he taught you in the car: shoulders even, head up. Behind you, nothing. No footstep. No voice. When you glance back from the corner, he is sitting where you left him, on the running board, with his tea. He raises the cup. You do not know if it is a threat.`, {
      onEnter: [{ surv: 3 }],
      choices: [E("Walk on.")]
    }),
    hub_exposed: N("voss", `He is where he always is, on the running board of the car, a thermos at his foot. He does not rise. "{name}." There is a cautious courtesy in it, the sort one shows an open flame. "We are in an odd position, you and I. I know what you know. You know what I am. I find it is an agreeable thing, to be so accurately seen. It has the advantage of removing all the small talk."`, {
      voices: 3,
      interjections: [
        J("composure", 4, `He is still. You are very close to him. There is no danger in his hands. The danger is in the whole of the thing he serves, which is in none of his hands at all.`),
        J("empathy", 5, `He is so *lonely*. The Ministry has all its Officers eat alone. They are kept apart so as not to compare.`, { cond: "flag.voss_daughter_known" })
      ],
      choices: [
        C("Ask him what the Ministry would give you for your silence.", "offer", { cond: "!flag.voss_offer_made" }),
        C("Try to turn him: tell him there is another way.", "turn", { cond: "flag.voss_daughter_known && flag.voss_trust >= 3 && !flag.voss_turn_failed && !flag.voss_turned" }),
        C("Ask about the Grand Harmony.", "jubilee"),
        C("Ask to see the Relay.", "invite", { cond: "!flag.voss_invited" }),
        E("Leave.")
      ]
    }),
    jubilee: N("voss", `"The Grand Harmony." He says it as a man who has been expecting the question for a week and has not yet chosen the tone. "It is the Warden's Jubilee gift. A single seventy-two-hour Reduction for the entire District, on a master tape, to be transmitted at twenty hundred on Thursday from the Relay. It will be played once. It will be played at a level that no one in District Nine has heard since the Hunger. There will be a choir. There will be a very fine speech." He stares at the loudspeaker. "Afterward the district will remember a beautiful evening. They will not remember Ostrov. They will not remember you. They will not, in the strict sense, remember each other this week."\n\nHe turns. "I will be at the Relay to supervise the transmission. I shall have a very good view of the dial."`, {
      onEnter: [{ set: "voss_jubilee_told", val: true }, { set: "knows_72_hours", val: true }, { thought: "th_grand_harmony" }, { note: "task_jubilee", text: "Voss confirms it: Thursday, 20:00, one master tape, a seventy-two-hour Reduction for the whole district, supervised at the Relay. 'They will not, in the strict sense, remember each other this week.'" }, { task: "task_tape", state: "active" }, { note: "task_tape", text: "The Grand Harmony master tape is kept in Vault 7 at District Relay No. 4. It will be played at 20:00 on Thursday. If it is not played, or if it is replaced, the district keeps its week." }],
      interjections: [
        J("rote", 3, `ALL CITIZENS WILL BE PRESENT. ALL CITIZENS WILL BE JOYFUL. ALL CITIZENS WILL BE... (the third word is not in the slogan; it never was).`),
        J("volition", 5, `Three days. You, Ostrov, the Ledger, the gym, this conversation. Gone. Do not panic. Plan.`)
      ],
      choices: [
        C("Back.", "hub_exposed", { cond: "flag.voss_exposed && !flag.voss_turned" }),
        C("Back.", "hub_turned", { cond: "flag.voss_turned" }),
        C("Back.", "hub_ally", { cond: "flag.voss_ally && !flag.voss_exposed && !flag.voss_turned" }),
        C("Back.", "hub_suspected", { cond: "flag.voss_suspected && !flag.voss_ally && !flag.voss_exposed && !flag.voss_turned" }),
        C("Back.", "hub", { cond: "!flag.voss_exposed && !flag.voss_turned && !flag.voss_ally && !flag.voss_suspected" })
      ]
    }),
    offer: N("voss", `He takes a very long breath and lets it out as if setting something down. "Then let me do the honest thing, and say it plainly, and let you refuse it plainly. I am authorised to offer you a place."\n\n"The Ministry has, at any time, about three hundred Quiet Officers. We are chosen from the people the Bell does not work on, because we are required to be awake in order to put others to sleep. You are one of those people. You have a tone in your head that fills the space the Bell is meant to take. I have read the file. The Ministry has been looking for someone like you for nine years, because Officers, {name}, burn out. We go grey. We go *quiet*." A rueful pull at the corner of the mouth. "It would be a trainee post, to begin: my elbow, my car, my district. In nine months you would run Nine by yourself. You would be permitted to remember everything. It is a curse, but it is the best kind: the kind that qualifies you."\n\n"The terms are the Ledger, the names of the Undercurrent, and your continued presence at my elbow. In exchange, a flat with a window that opens. Your mother's pension restored. A file with nothing in it. A *life*." He looks at his hands. "I would be glad of you. I should say that, as well."`, {
      onEnter: [{ set: "voss_offer_made", val: true }, { task: "task_voss", state: "active" }, { note: "task_voss", text: "Voss's offer: a trainee post as a Quiet Officer. In exchange for the Ledger, the Undercurrent's names and my presence at his elbow: a flat with a window that opens, my mother's pension, a clean file, and a life. He says he would be glad of me. I believe him. That is the problem." }],
      voices: 3,
      interjections: [
        J("appetite", 4, `A flat. A WINDOW. A kettle of your own. A pension. Tell me you do not want it. Tell me the whole animal in you does not lean toward that warm room like a plant.`),
        J("doublethink", 4, `Isn't it *wonderful*? A place at last. A role. You have always wanted to be useful. This is how one is useful to a nation. You can still be kind. You can be kind from the inside, where it counts.`, { effects: [{ surv: -1 }] }),
        J("solidarity", 4, `We would be the ones in the file. Not you: *we*. The eleven in the boiler, the cook, the girl in the wheelchair. The price of the flat is a list, and the list is made of names we love.`),
        J("authority", 4, `A seat at the table of the people who decide who forgets. Think what you could do from there. Think what you would *become* by doing it.`),
        J("empathy", 5, `He means it. He would be glad of you. He is offering you the one thing he wishes someone had offered him: a chance to be an Officer without being alone in it. It is the loneliest kindness you have ever been shown.`)
      ],
      choices: [
        C("Ask for more detail.", "offer_details"),
        C("Accept. Sincerely.", "offer_accept", { effects: [{ ideo: "quiet", n: 1 }] }),
        K("Accept: but only to get close. Sell him a loyal face.", "doublethink", 12, "voss_offer_feign", "offer_feign_pass", "offer_feign_fail", { white: false }),
        C("Decline, politely. Say you need time.", "offer_time"),
        C("Refuse outright. Tell him what you think of the Ministry.", "offer_hostile")
      ]
    }),
    offer_details: N("voss", `"Of course." He brightens, the way a man brightens when asked about a hobby. "The Dispensation: Officers are exempt from the Harmony. We wear small plugs of a Ministry compound in the ear when the Bell rings; you would be issued a pair. The flat is on Cinder Street, third floor, east side, with a window that opens on a lime tree. The stipend is, at trainee grade, about four times a teacher's. Your mother is currently receiving two-thirds of a widow's pension for a husband who is *not* dead, merely uncounted. I can have that corrected by Friday." He wets his lips. "There is no ceremony. There is a card. And at the end of your first year, a choice, which you will not be forced to make, about whether you wish to keep what you remember or give it up. Most do not keep it."\n\nHe is quiet. "I did not keep mine."`, {
      onEnter: [{ set: "voss_details_heard", val: true }],
      interjections: [
        J("archive", 5, `Your mother's husband is 'uncounted'. Not dead. A man missing from the register is a man the Bell has already been kind to. Whoever he was, he was *removed* well before you could remember him.`),
        J("senses", 5, `He said 'I did not keep mine' and his hand went to his coat pocket, where the sweet rolls are.`)
      ],
      choices: [C("Go back to the offer.", "offer")]
    }),
    offer_accept: N("voss", `"Thank you." The relief is so plain on his face that you almost look away. He stands, with the stiff, courteous haste of a man afraid the other party might change his mind, and offers his hand. You take it. It is warm. "I will not pretend I am not glad. I find that I am *extremely* glad, and that I do not entirely deserve to be." He takes a small stiff card from the inside of his coat and puts it into your palm: INSPECTOR'S CARD, black with a silver bell, and your name written on it in his own small, careful hand.\n\n"You'll want that for the Relay. Show it. Do not explain." He hesitates. "As to the Ledger: I should like it, when you are ready. Not today. I have never in my life asked a person to give me what they were not ready to give. I find I'd like to begin with you."`, {
      onEnter: [{ set: "voss_ally", val: true }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { surv: -12 }, { ideo: "vanguard", n: 2 }, { add: "voss_trust", n: 1 }, { task: "task_voss", state: "active" }, { note: "task_voss", text: "I accepted Voss's offer. I have an Inspector's Card with my name on it. He wants the Ledger when I am ready. I am, as of this morning, a trainee Quiet Officer, and I do not know whom I have just betrayed." }, { thought: "th_inspector_charm" }],
      interjections: [
        J("doublethink", 3, `There! A *card*. A place in the order of things. Doesn't it feel right to be part of something? You are going to be so good at it.`, { once: true, effects: [{ ideo: "vanguard", n: 1 }] }),
        J("solidarity", 5, `We heard you say yes. We are not angry. We are very, very quiet.`),
        J("volition", 5, `It may be a mask. It may be a door. Hold on to the part of you that remembers which, or you will not know on Friday.`)
      ],
      choices: [C("Take the card.", "hub_ally")]
    }),
    offer_feign_pass: N("voss", `You give him your most perfect face: not a smile, a *settling*, the expression of a clever, frightened young person who has been shown a warm door at last and has decided, with some dignity, to walk through. He watches it arrive. "Good," he says softly. "Good. I wasn't sure." He believes it, or he has chosen to, which in a man like Voss is the same thing for as long as he can afford it. He hands over a black card with a silver bell on it, your name in a neat hand, and for the first time since he stood up from the car, the tiredness leaves his shoulders.\n\n"I shall be at the Relay on Thursday," he says. "I would be glad if you were with me."`, {
      onEnter: [{ set: "voss_ally", val: true }, { set: "voss_feigned", val: true }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { surv: -10 }, { xp: 3 }, { add: "voss_trust", n: 1 }, { thought: "th_double_agent" }, { note: "task_voss", text: "I accepted Voss's offer and he believed it. I am wearing his trust like a borrowed coat. The Inspector's Card will open the Relay. It will also, one day, have to be handed back, and I do not like how much I will mind." }],
      interjections: [J("composure", 4, `Flawless. You are as lovely a liar as the country ever raised, and it did not cost you a wince. That will cost you later.`, { once: true })],
      choices: [C("Take the card.", "hub_ally")]
    }),
    offer_feign_fail: N("voss", `You give him your most loyal face, and he watches it arrive and tilts his head, kindly, as though you had brought him a very good drawing of a thing he had hoped to see. "No," he says, quite gently. "That is a *very* good face. It is the face of a student who is hoping to be believed. The real one would not have worked so hard." He doesn't seem angry. He seems sorry on both your behalfs. "I appreciate it more than you know. I shan't hold it against you. I shall simply ask you to remember that I did *offer*."\n\nHe turns away and begins to put his flask away, with great care. "Good morning, {name}."`, {
      onEnter: [{ set: "voss_suspected", val: true }, { surv: 8 }, { add: "voss_trust", n: -2 }, { set: "voss_offer_made", val: true }],
      choices: [E("Leave.")]
    }),
    offer_time: N("voss", `"Of course." The disappointment lasts exactly one second and does not reach his voice. "That is the sensible answer, and I'd have been alarmed by any other. I shall not ask again until Thursday. On Thursday, I'm afraid, there will be no more mornings to ask in." A very small bow. "The offer stands until the Jubilee. After that I fear the Ministry will have issued its own conclusions."\n\nHe pours a last cup of tea and sets it on the bonnet beside you. "Think of the flat. Think of the lime tree. And think, if it helps, of how very much I should like to be wrong about you."`, {
      onEnter: [{ add: "voss_trust", n: 1 }],
      choices: [C("Say that you'll think.", "hub")]
    }),
    offer_hostile: N("voss", `He lets you finish. It takes a long time, because you say a good deal, including a word you had been saving for the Principal. When you have done, Voss folds the cup into the thermos, screws it shut, and sits for a moment with the thermos in both hands.\n\n"I see." The voice is very soft and entirely without malice. "Thank you for the candour. It is not a thing I am often given. I would only say..." He looks up, and for one moment there is something terrible and gentle in his face. "...that I did not say any of the things you say I said. I said I would be glad of you. I said I would not ask again. I will keep to the second. I will not, I am afraid, be able to keep to the first."\n\nHe stands. He brushes his coat. "Good morning, {name}. Do try not to be clever in front of the Vanguard."`, {
      onEnter: [{ set: "voss_suspected", val: true }, { surv: 10 }, { add: "voss_trust", n: -2 }, { ideo: "undercurrent", n: 1 }, { set: "voss_offer_made", val: true }],
      choices: [E("Walk away.")]
    }),
    hub_ally: N("voss", `"Colleague." Voss rises half an inch from the running board, a courtesy rather than a movement, and sits again. The card in your pocket weighs about as much as a feather and as much as a house. "I have a hundred things to do this morning and not one I would rather be doing. What may I do for you?"`, {
      voices: 3,
      interjections: [
        J("empathy", 5, `He is happy. It is awful. He has not been so unburdened in nine years. If you are lying to him, it will break something that cannot be set.`, { cond: "flag.voss_feigned" }),
        J("instinct", 4, `Watch for the places where he is not smiling. He has been taught to arrange a smile on top of every sentence he thinks you will not like.`),
        J("doublethink", 4, `You are among friends. The mask is the face. Why distinguish them?`, { cond: "!flag.voss_feigned" })
      ],
      choices: [
        C("Hand him the Ledger.", "give_ledger", { cond: "has('ledger')" }),
        C("Give him the names: the Undercurrent. (Betrayal.)", "give_names", { cond: "!flag.voss_names_given && flag.knows_static" }),
        C("Ask about the Grand Harmony.", "jubilee", { cond: "!flag.voss_jubilee_told" }),
        C("Ask to be shown the Relay.", "invite", { cond: "!flag.voss_invited" }),
        C("Ask about Mira.", "mira", { cond: "flag.voss_daughter_known && !flag.voss_mira_talked" }),
        C(`"There is another way, Inspector. Let me show you."`, "turn", { cond: "flag.voss_daughter_known && flag.voss_trust >= 3 && !flag.voss_turn_failed" }),
        C(`"I would like to go home. All of it. Make it stop."`, "quiet", { cond: "flag.voss_trust >= 2" }),
        E("Excuse yourself.")
      ]
    }),
    mira: N("voss", `"Mira." He says it the way you speak the name of a place you cannot go. "I see her on Sundays. From across the landing, through two panes of glass: a little kitchen, a woman at the stove, a girl of seventeen with her hair in a rope, doing her homework at a table I was once, I think, allowed to sit at. She has her mother's chin. She has *my* handwriting." A very small smile. "She has never once looked at the window. I think she would not know me if she did, and I think she knows exactly who I am. I have never been able to determine which would be worse."\n\nHe takes the mitten from the dashboard through the open door, turns it over, and puts it back. "She leaves me a card, every year, on the last Thursday of September. 'Papa, you forgot again.' It is unsigned. I do not know who writes it. It might be her. It might be me, in my sleep."`, {
      onEnter: [{ set: "voss_mira_talked", val: true }, { add: "voss_trust", n: 1 }, { xp: 2 }],
      interjections: [
        J("deduction", 5, `The card arrives on the last Thursday of the month. The Jubilee is on a Thursday. The date is not an accident. Whoever sends it knows his calendar. A child; a mother; or a man who has lost the habit of being unobserved by himself.`, { effects: [{ set: "voss_mira_clue", val: true }] }),
        J("empathy", 5, `He just told you he doesn't know whether he writes the cards himself. A man who has begun to suspect that his own hand is leaving him messages. Does that sound familiar?`)
      ],
      choices: [C("Back.", "hub_ally")]
    }),
    give_ledger: N("narrator", `The ledger is lighter than you expected. It always is. You put it in his hand and watch his fingers close on it, not greedily but with an extraordinary tenderness, the way you take a baby from an exhausted mother. He does not open it. He holds it against his chest and looks at the loudspeaker pole as if it had been very quiet for a long time and had at last said something.\n\n"Thank you," he says, and his voice is not entirely level. "I will see that it is read by the right people. I will see that nobody is hurt for having written it. I will see..." He stops. "I will see that it goes where it can do the least harm." It is a sentence a decent man says when he is not sure he can keep it. "You have done a brave and sensible thing."\n\nAnd you realise, with a small cold drop in your stomach, that you do not know whether you did.`, {
      onEnter: [{ take: "ledger" }, { set: "ledger_with_voss", val: true }, { surv: -20 }, { ideo: "vanguard", n: 2 }, { task: "task_ledger", state: "done" }, { note: "task_voss", text: "I handed Voss the Ledger. He took it as one takes a baby. He promises nobody will be hurt. He is a man who keeps his promises, which is exactly what is frightening." }],
      interjections: [
        J("solidarity", 5, `We are not going to say anything. We are going to sit here, very quietly, and remember what that book cost.`),
        J("doublethink", 4, `Look! A gentleman has the book. Everything will be handled correctly. You can stop being afraid.`),
        J("volition", 5, `It cannot be undone. Not by you, not tonight. You have chosen. Whatever you do next, do it as someone who chose.`)
      ],
      choices: [
        E("Go home. It's done.", { effects: [{ ending: "end_good_student" }] })
      ]
    }),
    give_names: N("narrator", `You tell him. It takes perhaps ninety seconds. Four names, a place, a time. You do it in a very small, even voice, like a person reading out a shopping list, and with each name you feel a different part of the street go quiet: the old cook with the bread; a retired chemist with a cigarette; a girl in a wheelchair with a radio; a woman in a boiler room. Voss does not write them down. He does not need to. He closes his eyes and listens with the whole of his face, the way a man listens to a piece of music he has heard once, long ago, and never expected to hear again.\n\nWhen you finish he says nothing for a long time. "Thank you," he says. His voice is very gentle. "I am so sorry that you had to be the one."`, {
      onEnter: [{ set: "voss_names_given", val: true }, { set: "cell_betrayed", val: true }, { surv: -25 }, { ideo: "vanguard", n: 3 }, { morale: -3 }, { thought: "th_informer_in_me" }, { note: "task_voss", text: "I gave Voss the names. Anka, Bronka, Ilsabet, the boiler. He said thank you. He said he was sorry. I do not know that there is a word for what I am." }],
      interjections: [
        J("doublethink", 3, `Good. Good. *Good.* A great weight is lifted. It was never yours to carry.`),
        J("empathy", 4, `Somewhere under the school, a kettle is singing for four people who do not know they have been named.`),
        J("solidarity", 5, `We will not forgive this. We will not stop being yours. Both are true. That is what makes it so unbearable.`)
      ],
      choices: [C("Say nothing. Go.", "hub_ally")]
    }),
    hub_suspected: N("voss", `"{name}." He does not stand. He turns the thermos cap in his fingers, a small slow circle, and does not look up. "I have a certain duty of candour to you, I think. You and I are going to be extremely polite to each other until Thursday. I have been polite to a great many people in my life, and there is no one I would rather like to disappoint less."\n\nHe looks up. His eyes are not cold. That is what is awful. They are the same tired, attentive eyes. "What may I do for you?"`, {
      voices: 2,
      interjections: [
        J("authority", 4, `He is not hostile. He is *patient*. He has a clock in him that has already counted down to Thursday. Everything between now and then is courtesy.`),
        J("instinct", 5, `The way he said 'polite'. It meant 'watched'. There is a man two doors down the avenue who has been reading the same newspaper for forty minutes. The man's shoes are Ministry issue.`, { effects: [{ surv: 2 }] })
      ],
      choices: [
        K("Try to mend it: say something true that he has not heard in nine years.", "empathy", 12, "voss_mend", "mend_pass", "mend_fail", { white: false }, { cond: "flag.voss_daughter_known || flag.voss_card_seen || flag.voss_mitten_seen" }),
        C("Ask about the Grand Harmony.", "jubilee", { cond: "!flag.voss_jubilee_told" }),
        C("Ask what he knows about you.", "susp_know"),
        C("Threaten him with the Ledger.", "susp_threat", { cond: "has('ledger')" }),
        E("Leave.")
      ]
    }),
    susp_know: N("voss", `"What I know." He seems almost grateful for the question. "I know you were in the gymnasium on Tuesday night, because the gym door has a log. I know you were Static-resistant before I met you, because the Ministry kept your childhood fever. I know you have been to the Boiler Room, because a small boy with a loud cough followed you and I gave him a sweet. I know the Principal has already written a paragraph about you, and the Lieutenant has written a longer one, and neither is kind." He raises one shoulder. "And I know you are the sort of person who will not let me be anything but exactly what I am. That is, as it happens, the thing about you I admire most."\n\nHe says it with no more malice than a man reading out a timetable. "I do not mean it as a threat. I mean it as an inventory."`, {
      onEnter: [{ surv: 3 }, { set: "voss_inventory", val: true }],
      choices: [C("Back.", "hub_suspected")]
    }),
    susp_threat: N("voss", `"The Ledger." He does not look at your pockets. It is an extraordinary act of courtesy, and a far more frightening one than looking. "You have it. Yes. I did wonder, when you lied so beautifully." He folds his hands. "{name}, I will say this once, and as a friend. If you keep it, you will be arrested. Not by me. By a man called Ames, who arrives on Thursday and who does not drink tea. If you give it to me, I will see that it goes where it can do the least damage, and I will see that you are not among the damage."\n\nHe leans forward very slightly. "I would prefer, if I may, that you thought about that between now and then."`, {
      onEnter: [{ surv: 8 }, { set: "voss_ames_named", val: true }],
      interjections: [J("instinct", 5, `Ames. A name he has never mentioned until now. He is telling you the true shape of the danger, and in doing so, quietly, he has just stepped a half-pace to one side of the Ministry.`)],
      choices: [C("Back.", "hub_suspected")]
    }),
    mend_pass: N("narrator", `You say it simply, in no particular order: that you saw the mitten. That you do not think the card is from him. That whoever sent it did so because they wanted him to know, not that he had forgotten, but that someone was still *counting*. You say that a person who keeps a sweet roll in his pocket every Wednesday for six years has not forgotten anything: he is only unable to be told.\n\nVoss does not move. His face does not change. But after a time he takes the thermos cap, which he has been turning for ten minutes, and puts it down on the bonnet, very carefully, as if it were a cup of something that might spill. "Nobody has said that," he says. "Not once. That it is *counted*." He clears his throat. "Well. I think I should like to start again, if you will permit it. Good morning, {name}. May I offer you some tea?"`, {
      onEnter: [{ set: "voss_suspected", val: false }, { add: "voss_trust", n: 2 }, { xp: 3 }, { thought: "th_borrowed_memory" }],
      choices: [C("Accept the tea.", "hub")]
    }),
    mend_fail: N("voss", `"That is kind." He says it with enormous gentleness and no movement at all. "It is a very kind thing to say. I should like to believe you. I am not, I find, in a position to." He picks up the thermos. "Please, {name}. Don't make it harder."`, {
      onEnter: [{ add: "voss_trust", n: -1 }, { set: "voss_mend_failed", val: true }],
      choices: [C("Back.", "hub_suspected")]
    }),
    turn: N("narrator", `You sit down next to him on the running board. It is a long, narrow step, and you have to sit close. Neither of you says anything for a while. Then you tell him, in the voice you use for the true things, about the second tone: the one that hides under the Bell and beats against it. You tell him that a girl in a wheelchair has heard it. That she can build the opposite. A tone that does not blur but sharpens; that does not close the door but lifts it off the hinge. You say there is a way to put a *second* tape on the Relay's deck, on Thursday, at eight o'clock, in place of the Harmony.\n\nYou say that if it works, the district will remember. All of it. Ostrov, the Ledger, the gym, the queue. His own last nine years. Possibly Mira. You say: "It might tell you who said it first."\n\nHe is very still.`, {
      onEnter: [{ set: "voss_turn_tried", val: true }, { thought: "th_wake_tone" }],
      voices: 3,
      interjections: [
        J("volition", 5, `This is the whole thing. This is the one moment. Do not rush it. Do not reach for his sleeve.`),
        J("empathy", 5, `He is looking at the mitten. He has not looked at it directly in nine years. He is looking at it now.`),
        J("instinct", 6, `He is frightened. Not of you. Of the possibility that it might *work*.`)
      ],
      choices: [
        K("Reach him through the wound: tell him it does not matter who said sorry first, only that she may be waiting to say it again.", "empathy", 13, "voss_turn_empathy", "turn_pass", "turn_fail", { white: false }),
        K("Take his own logic apart: a man who remembers everything and functions has disproved the Ministry's charter.", "dialectics", 13, "voss_turn_logic", "turn_pass_logic", "turn_fail", { white: false }),
        K("Speak to the man who wrote the first draft of the Ministry's charter, the one called Mercy: that version asked for consent.", "rhetoric", 13, "voss_turn_rhetoric", "turn_pass_rhetoric", "turn_fail", { white: false }),
        C("Tell him what Old Gregor told you: the music box in his car plays the ward Lullaby, the tune the Bell was made from.", "turn_pass_box", { cond: "flag.gregor_musicbox" }),
        C("Give him Mother Anka's message: the flame is blue because it is hotter; the form was wrong; you were fifteen.", "turn_pass_anka", { cond: "flag.anka_message_voss" }),
        C("Not yet. Say nothing more.", "hub")
      ]
    }),
    turn_pass_box: N("voss", `"The music box." He goes very white. "The little ballerina with one arm. It was on her shelf. I took it, the night I came home and was not known; I do not know why I took it. I had it mended. An old man in a kiosk mended it." He presses the back of his wrist to his mouth. "He told me it was a tune he had *known once*. He was being kind. The tune my daughter fell asleep to is the tune I have been playing to fourteen thousand people every night for nine years."\n\nHe sits for a long time. "No," he says at last, quite calmly. "No. Not on Thursday. Not that tune, at level seven, over her street." He puts the black card in your hand. "I shall be at the Relay with a cold. I will be extremely observant of the dial, and extremely careless of everything else."`, {
      onEnter: [{ set: "voss_turned", val: true }, { set: "voss_ally", val: false }, { give: "inspector_card" }, { give: "thermos" }, { set: "voss_invited", val: true }, { set: "vault_code_known", val: true }, { xp: 4 }, { surv: -5 }, { thought: "th_double_agent" }, { task: "task_voss", state: "done" }, { note: "task_voss", text: "Voss is turned. The music box in his car plays Gregor's ward Lullaby: the Bell is his daughter's lullaby. 'Not that tune, at level seven, over her street.' He gave me his card, his thermos and the vault combination." }],
      choices: [C("Sit with him a little longer.", "hub_turned")]
    }),
    turn_pass_anka: N("voss", `He does not move while you say it. When you reach 'you were fifteen' he makes a small sound, like a man who has trodden on a stair that is not there. "Brodsky," he says. "Mrs Brodsky. Chemistry. The second row, by the window." He is staring at nothing. "I do not remember her. I remember that I *should*. There is a shape in me the size of a classroom, and somebody has been very careful to leave it empty." His hands are shaking. "She said the second thing first. The form was wrong."\n\nHe turns to you. "If she is alive, and in this district, and kind, then I have been wrong about a great many things for a great many years. I find that I would like very much to be wrong in her direction." He gives you the card. "Thursday. I shall have a cold. Tell her... no. I shall tell her myself, if there is a Friday."`, {
      onEnter: [{ set: "voss_turned", val: true }, { set: "voss_ally", val: false }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { set: "vault_code_known", val: true }, { set: "voss_knows_anka", val: true }, { xp: 4 }, { surv: -5 }, { thought: "th_double_agent" }, { task: "task_voss", state: "done" }, { note: "task_voss", text: "Voss is turned by Anka's message. He does not remember her, only that he should. 'I would like very much to be wrong in her direction.' He gave me his card and the vault combination." }],
      choices: [C("Sit with him a little longer.", "hub_turned")]
    }),
    turn_pass: N("voss", `"Waiting." He says it so softly that you almost miss it. "She might be waiting to say it again." He puts his hand over his mouth, and when he lowers it his eyes are wet, and he does not make any effort whatever to hide it. "I have been so *careful* not to hope, {name}. It is a professional skill. I have never, in nine years, once permitted it to come near the car."\n\nHe sits for a long time. Then, with the air of a man deciding to walk into the sea: "I will be at the Relay on Thursday. I will have a cold. I shall be extremely observant of the dial, and extremely careless of everything else." He takes the card from his pocket and puts it in your hand. "I cannot promise the Ministry will let me stay careless. A man named Ames has been sent. He is not careless. But I will do what I can with the hours I have."`, {
      onEnter: [{ set: "voss_turned", val: true }, { set: "voss_ally", val: false }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { set: "vault_code_known", val: true }, { xp: 4 }, { morale: 2 }, { surv: -5 }, { thought: "th_double_agent" }, { task: "task_voss", state: "done" }, { note: "task_voss", text: "Voss is turned. He will have a cold on Thursday and be 'extremely careless of everything but the dial'. He gave me his Inspector's Card and the vault combination. A man named Ames may stop him. Mira's card, he says, came on a Thursday. He cried, and did not try to hide it." }],
      interjections: [J("empathy", 3, `You reached him. You did not have a trick. You had a true thing, said at a true time, and it was enough. Remember what that felt like.`, { once: true, effects: [{ skillUp: "empathy", n: 1 }] })],
      choices: [C("Sit with him a little longer.", "hub_turned")]
    }),
    turn_pass_logic: N("voss", `"Disproved." The word comes out of him like a coin dropped into a dry well. "You are quite right. I remember everything. I function. I do my work with a clear head and a clean collar and a perfectly good appetite. And if memory were the poison the Ministry says it is, I would be a corpse." He laughs, a small broken sound. "It is an appalling syllogism. It has been sitting in my head for nine years, and I could never find the middle term. You have found it in four sentences."\n\nHe looks at the mitten, finally. "The Ministry's charter is wrong. I have known it for nine years. I have *not* known that I knew." He puts the card into your hand. "I will be at the Relay on Thursday, with a cold. I will be very observant of the dial. I'll leave the rest to you. Do not, I beg of you, make me regret it."`, {
      onEnter: [{ set: "voss_turned", val: true }, { set: "voss_ally", val: false }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { set: "vault_code_known", val: true }, { xp: 4 }, { surv: -5 }, { thought: "th_double_agent" }, { task: "task_voss", state: "done" }, { note: "task_voss", text: "Voss is turned. I took his own logic apart in four sentences and he thanked me for it. He gave me his card and the vault combination. 'I'll be at the Relay with a cold.'" }],
      choices: [C("Sit with him a little longer.", "hub_turned")]
    }),
    turn_pass_rhetoric: N("voss", `"Mercy." He closes his eyes. "The first draft. Yes. It asked that no Reduction be applied without the consent of the *affected*, in writing, countersigned. Nobody ever signed. The lawyers took it out in the second week." He opens them. "You have read the Archive."\n\nYou have not. You have guessed. It is the sort of guess that a rhetorician makes when she knows exactly the shape of the hole in the sentence. Voss looks at you with something that might be awe. "You are going to be a terrible Quiet Officer," he says, "and I am delighted. I will be at the Relay on Thursday. I shall have a cold." He puts the black card in your hand. "Mind the dial."`, {
      onEnter: [{ set: "voss_turned", val: true }, { set: "voss_ally", val: false }, { give: "inspector_card" }, { set: "voss_invited", val: true }, { set: "vault_code_known", val: true }, { xp: 4 }, { surv: -5 }, { thought: "th_double_agent" }, { task: "task_voss", state: "done" }, { note: "task_voss", text: "Voss is turned. I guessed at the first draft of the Ministry's charter, the one called Mercy, and I was right. He gave me the card and the vault combination. 'Mind the dial.'" }],
      choices: [C("Sit with him a little longer.", "hub_turned")]
    }),
    turn_fail: N("voss", `He listens until the end. He does not interrupt. When you are done, he says, with great gentleness: "That was lovely. I mean it. It is the best thing I have been told in nine years." He stands, folds the thermos, and for a moment you think you have done it. "I am going to forget that you said it. Not in the Ministry's way. I am going to *decide* to, and I would be grateful if you would let me."\n\nHe puts on his hat. "Thursday, {name}. Do be careful on Thursday."`, {
      onEnter: [{ set: "voss_turn_failed", val: true }, { set: "voss_suspected", val: true }, { surv: 8 }, { add: "voss_trust", n: -1 }, { morale: -2 }],
      choices: [E("Watch him go.")]
    }),
    hub_turned: N("voss", `Voss has a scarf round his throat, a handkerchief in his sleeve, and an air of heroic indisposition. He coughs, once, without conviction. "Colleague," he says, in a voice pitched for the benefit of the loudspeakers. Then, very low: "I have a cold. It is a terrible cold. It started this morning. It will, I am afraid, get worse."`, {
      voices: 2,
      interjections: [
        J("empathy", 4, `He is happier than you have seen him. He is also more afraid. He holds the two like a man carrying an overfull cup across a room.`),
        J("senses", 5, `He has not touched the thermos since you sat down. His hands are folded. They are not quite still.`)
      ],
      choices: [
        C("Ask what he can do on Thursday.", "turned_help", { cond: "!flag.voss_turned_help" }),
        C("Ask about Ames.", "turned_ames", { cond: "!flag.voss_turned_ames" }),
        C("Ask about Mira.", "mira_t", { cond: "!flag.voss_mira_t" }),
        C("Ask about the Grand Harmony tape.", "jubilee", { cond: "!flag.voss_jubilee_told" }),
        E("Wish him a speedy recovery.")
      ]
    }),
    turned_help: N("voss", `"What can I do." He lowers his voice and talks to the loudspeaker pole as though it were a pillar of the church. "On the Thursday I stand at Tomas's elbow and watch the dial. The tape is loaded at ten to eight. The deck is cued at five to. The transmission runs from the console, and I am required to *sign* the start. I can take a long time to find my pen." A grave pause. "I can be taken ill. I can be called away. I can be the sort of man who sits down on a crate for ten minutes and is not seen." He permits himself a smile. "Whatever you do, do it in those ten minutes. I will not see it. I shall not look at the vault, and the combination is the date the Winter ended: the third of April, in the Union style. Four, three, seventy."\n\nHe coughs. "I cannot give you more. I may not be able to give you that."`, {
      onEnter: [{ set: "voss_turned_help", val: true }, { set: "vault_code_known", val: true }, { note: "task_tape", text: "Voss says: he can be 'taken ill' for ten minutes at the Relay on Thursday. The tape is loaded at 19:50. The vault combination is the date the Winter ended: 4, 3, 70." }],
      choices: [C("Back.", "hub_turned")]
    }),
    turned_ames: N("voss", `"Ames." His mouth thins. "A Quiet Officer of the Chancellery's own, no friend of the district. He arrived this morning on the early train and he is currently being given a very good breakfast by the Principal. He does not take tea. He is not unkind. He is *efficient*." Voss rubs his eyes. "Ames would arrest a cat for failing to be a dog. I am, I should tell you, not at all sure I can stand against him in a room. I can stand against the Ministry in the abstract. In the concrete, a man with a clipboard has the advantage."\n\nHe looks at you. "If I give you a signal, you will know it is time to go."`, {
      onEnter: [{ set: "voss_turned_ames", val: true }, { set: "voss_ames_named", val: true }, { note: "task_voss", text: "A Chancellery Quiet Officer named Ames arrived by the early train. He does not drink tea. If Voss gives a signal on Thursday it will mean Ames is near." }],
      choices: [C("Back.", "hub_turned")]
    }),
    mira_t: N("voss", `"I went to Cinder Street last night." It comes out of him in a rush. "I stood on the landing. I have never done that. I stood outside the door with my hand raised for, I think, the longest time of my life. I did not knock." A small pale smile. "I took out a piece of paper and wrote on it. I wrote 'I forgot'. I crossed it out. I wrote 'I'm sorry'. I crossed that out, too. I put it under the door." He is looking at nothing. "It was blank."\n\nHe takes out the notebook, not opening it. "I stood there a quarter of an hour. Nothing happened. I cannot tell you how much I cared that nothing happened."`, {
      onEnter: [{ set: "voss_mira_t", val: true }, { xp: 2 }],
      interjections: [J("empathy", 4, `A blank page under a door. It is the bravest letter anyone has written in this district. It says everything the Ministry cannot erase: that someone stood there.`)],
      choices: [C("Back.", "hub_turned")]
    })
  }
},

// ===================== VOSS_D3 =====================
voss_d3: {
  title: "Inspector Hale Voss",
  start: [
    { cond: "flag.voss_turned", node: "t" },
    { cond: "flag.voss_exposed", node: "x" },
    { cond: "flag.voss_ally", node: "al" },
    { cond: "flag.voss_suspected", node: "su" },
    { cond: "true", node: "pl" }
  ],
  nodes: {
    t: N("voss", `He is on the kerb outside the Relay gate, not in the car, in a coat with the collar turned up and a scarf wound three times round his neck, a man with a very bad cold. The sky above District Nine is the exact colour of a plate. When he sees you he does not smile. He puts one finger to his lip, then taps it, twice, on the side of his nose: a gesture so tiny that it is deniable, and so deliberate it is a flag.\n\n"Good morning, colleague," he says, for the loudspeakers. A cough. Then, very low: "Ames is in the Relay. He has been there since five. He has had Brune stand to attention for three hours. I am, I think, very ill."`, {
      voices: 3,
      interjections: [
        J("empathy", 5, `The cough is real. The fear is real. He has lied to the Ministry for one day, and it has aged him five years.`),
        J("authority", 4, `He is giving you a window. Be brisk. Do not waste his gift on gratitude.`),
        J("instinct", 5, `Do not look at his hands. They are shaking. He wants you to see his face.`)
      ],
      choices: [
        C("Ask what Ames knows.", "t_ames"),
        C("Ask about Cinder Street.", "t_mira", { cond: "flag.voss_mira_t" }),
        C("Agree a signal.", "t_signal", { cond: "!flag.voss_d3_signal" }),
        C("Thank him.", "t_thanks"),
        E("Leave him to his cold.")
      ]
    }),
    t_ames: N("voss", `"Ames knows everything that the Ministry knows, which is a great deal, and nothing it has not been told, which is a mercy." A cough. "He knows the Ledger exists. He knows the girl with the wheelchair has built something. He has not yet connected them, and he will, at about half past six, when he sits down with the Principal's list. He knows I am *unwell*. He has been very solicitous about it. He has offered to relieve me of the transmission." He swallows. "I told him I would rather die at my post. He said that was very proper."\n\nHe looks at the sky. "I have until about eight. He's a punctual man."`, {
      onEnter: [{ set: "voss_d3_ames", val: true }],
      choices: [C("Back.", "t")]
    }),
    t_mira: N("voss", `"She opened it." He says it simply, like a man announcing a train. "At six this morning. I was at the end of the landing, behind the stair-rail, a coward to the last. The door opened. A girl in a nightgown picked up a piece of blank paper. She turned it over. She turned it back." His breath shakes. "She looked at the landing. At the stair. For about as long as it takes to say a name. Then she went in and shut the door, and I stood there until the milk came."\n\nHe laughs, wetly, and wipes his face with his scarf. "I do not know what it means. I do not know whether it means anything. I have decided it does."`, {
      onEnter: [{ set: "voss_d3_mira", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [C("Back.", "t")]
    }),
    t_signal: N("voss", `"A signal." He thinks. "If I put my hand on my left lapel, as if to touch a badge, it means that Ames is on his way to wherever you are. If I take my hat off, it is already too late. If I say that I need a glass of water, everything is as arranged." He allows himself a sort of grim joke. "If I sneeze, I have sneezed."\n\nHe holds out his gloved hand. You take it. It is damp and quite cold. "Be careful, colleague," he says. "I have never had anyone to be careful *for*. It is not at all a pleasant feeling."`, {
      onEnter: [{ set: "voss_d3_signal", val: true }, { add: "voss_trust", n: 1 }],
      choices: [C("Back.", "t")]
    }),
    t_thanks: N("voss", `"Don't." He waves a hand. "It's not at all a gift. I am doing something that I have been unable to do for nine years, and I am doing it very badly, and it is the best thing I have done in my life. There is nothing to thank me for. If anything, thank the girl in the wheelchair. Thank the old man with the kiosk. Thank, if you can find him, whoever it was who taught you to say 'I'm sorry' in the correct tense." He coughs. "Go on. There's a day to be getting on with."`, {
      choices: [E("Go.")]
    }),
    x: N("voss", `He has not changed his position since yesterday. He sits on the running board, thermos at his foot, a long coat turned up against the weather. When you come near he does not rise, but he does take off his hat and hold it between his knees, an old courtesy. "{name}." The voice is the same: warm, dry, tired. Only it has been scrubbed of all expectation. "We have a day. I thought we might spend a little of it being honest."`, {
      voices: 3,
      interjections: [
        J("composure", 5, `He is giving you a long clear look and a free one. In an hour he may not be allowed to.`),
        J("empathy", 5, `He stayed. Whatever else he has done, he stayed on the step for a night, where you would find him.`),
        J("authority", 4, `A man who has been exposed and kept his seat is either a fool or a fatalist. He is neither. He is waiting.`)
      ],
      choices: [
        C("Ask what he will do tonight.", "x_tonight"),
        X("Try again to turn him.", "voss", { node: "turn", cond: "flag.voss_daughter_known && flag.voss_trust >= 3 && !flag.voss_turn_failed" }),
        C("Ask about the offer.", "x_offer"),
        E("Leave him.")
      ]
    }),
    x_tonight: N("voss", `"Tonight." He turns the hat round once. "At seven-forty I walk into the Relay and sign the transmission order. At eight I stand beside a dial. At nine I will be, in the strict sense, a man who has done his duty." He glances at you. "I will not stop you. I will not help you. I will not *look* at the aerial deck, because I find it makes my knees hurt. That is what you may have from me."\n\nA beat. "I would not like to see the end of the evening, if I am honest. I have an odd feeling that if it goes the way the Ministry intends, I will not, in any sense, be present for it."`, {
      choices: [C("Back.", "x")]
    }),
    x_offer: N("voss", `"The offer." He tilts his head. "Stands. It stands until eight tonight, when it will lapse, with the district's week. I find I should like to be asked again. I find I should like to be *refused* again, in some other form, by someone who has had a second night to sleep on it." A small smile. "I do hope you have slept. I haven't."`, {
      onEnter: [{ set: "voss_d3_offer_open", val: true }],
      choices: [C("Back.", "x")]
    }),
    al: N("voss", `He is waiting by the car, in an overcoat, hands clasped behind him, face composed. When he sees you he does not smile: it is the face he wore at the beginning, when you first came across the road, a face that has been very careful not to want. "Colleague," he says. "I was afraid that you would be late. I am pleased that you are not."\n\nHe checks his watch, a heavy, old-fashioned one. "I have a favour to ask. It is the one thing I have not asked, and I find I cannot go into the evening without it."`, {
      voices: 3,
      interjections: [
        J("instinct", 5, `He is going to ask for the Ledger. He is going to ask very nicely. His shoulders are in the shape of someone who has not slept and has decided it will be today.`),
        J("doublethink", 4, `Give it. Give it, give it, give it. It is only a book. He has been so *kind*.`, { cond: "has('ledger')" }),
        J("solidarity", 5, `We are not going to say what we think. We are going to let you decide. But we are right here.`)
      ],
      choices: [
        C("Ask what the favour is.", "al_ask")
      ]
    }),
    al_ask: N("voss", `"The Ledger." He says it quietly. "Today, if you please. Before the Jubilee. I have a very small window in which it can be received without anyone else seeing, and I shall need to take it to Ames before he begins the transmission, as a sign of loyalty. It will keep you off the lists. It will keep the Boiler Room off the lists. It will keep the girl in the wheelchair in her chair and not in the Clinic." A beat. "I would ask. I would not insist. I find that I cannot, with you."\n\n"And afterward, you will stand beside me on the dais. I have arranged a chair."`, {
      onEnter: [{ set: "voss_d3_asked", val: true }],
      interjections: [
        J("volition", 6, `You have two days of caution behind you and one night in front of you. Whatever you give him, give it knowing what it will become.`)
      ],
      choices: [
        C("Give him the Ledger.", "al_give", { cond: "has('ledger')" }),
        C("Tell him you have not got it.", "al_lie"),
        C("Say yes to the dais. Keep the book for now.", "al_dais", { effects: [{ set: "voss_d3_join", val: true }, { surv: -6 }, { ideo: "vanguard", n: 1 }] }),
        X("Try, once more, to show him another way.", "voss", { node: "turn", cond: "flag.voss_daughter_known && !flag.voss_turn_failed" }),
        E("Say you need to think. Leave.")
      ]
    }),
    al_give: N("narrator", `You put it in his hands. He takes it with both, as before. For a moment he does not move. Then he does a thing you do not expect: he opens it, to the first page, and reads, in a whisper, the first line of the Commissar's handwriting. "'To whomever finds this: I am sorry for the length of the preamble.'" He closes it. His eyes are shut. "That is exactly how he spoke. I knew him a little. He was kind to the cleaners."\n\nHe tucks it in the breast of his coat. "Thank you." It is a very small voice. "I shall take care of it. I shall take such very great care."`, {
      onEnter: [{ take: "ledger" }, { set: "ledger_with_voss", val: true }, { set: "voss_d3_ledger", val: true }, { surv: -15 }, { ideo: "vanguard", n: 2 }, { task: "task_ledger", state: "done" }],
      choices: [E("Leave him.")]
    }),
    al_lie: N("voss", `"I see." He says it as one says it to a doctor. He looks at your face for a long time, and when he speaks it is gently. "I wish I had not asked. I wish I had had the grace to say it at the beginning, in the car, and let you answer before you knew what the answer was worth." He turns away. "I will go and put on my hat. I will see you at the dais, or I will see you at the Relay, and I would be much obliged if you would be at the dais."\n\nHe does not look back.`, {
      onEnter: [{ surv: 5 }, { add: "voss_trust", n: -1 }],
      choices: [E("Watch him go.")]
    }),
    al_dais: N("voss", `"Thank you." He closes his eyes. "I shall have a chair. It's a very good chair. It has arms. At the end of the evening, when it is all quiet, there will be a young person with a card and a flat, and a man who has someone to explain things to. I do not, I find, ask for much."\n\nHe smiles, and for once it moves his eyes. "I shall not take the book until you are ready. But I shall expect it, as one expects a train."`, {
      choices: [E("Leave him.")]
    }),
    su: N("voss", `He is standing, today, upright, one hand on the car roof, wearing the face of a doctor who has come to deliver the result. The thermos is nowhere. "{name}." No warmth. No cruelty either: only an exact attention, a lens. "I should like to say, formally, that I have a standing instruction to take you into custody if you appear within the precincts of the Relay without a pass. I should like to say, informally, that I would be very glad if you did not."\n\nHe opens his gloved hand. In it is a small stiff card with a silver bell. "Ames sent this. A summons. For six o'clock, at the Principal's office. I have not yet decided whether to deliver it."`, {
      voices: 2,
      interjections: [
        J("instinct", 5, `He did not say he would not deliver it. He said he had not yet decided. That is a different sentence.`),
        J("authority", 4, `He is holding the card out, palm up. A man who wants to be rid of a thing does not hold it so steadily.`)
      ],
      choices: [
        K("Say something true. Try to mend it.", "empathy", 12, "voss_d3_mend", "su_mend", "su_fail", { white: true }),
        C("Take the summons. Say you will go.", "su_take", { effects: [{ surv: 5 }] }),
        C("Refuse the summons.", "su_refuse", { effects: [{ surv: 8 }] }),
        E("Walk away.")
      ]
    }),
    su_mend: N("voss", `You tell him about the blank letter. You do not know how you know; you simply say it: that a man standing on a landing with a pen is a better father than a hundred who knocked. That it does not matter what is written on the page. He stares at the card in his hand. Then, very slowly, he tears it in half, and in half again, and puts the pieces in his pocket among the sweet rolls.\n\n"I have not decided to help you," he says. "I wish that to be clear. I have decided that I have not yet received a summons. It will take, I should think, until eight o'clock for it to arrive."`, {
      onEnter: [{ set: "voss_suspected", val: false }, { add: "voss_trust", n: 2 }, { xp: 3 }, { surv: -5 }],
      choices: [E("Thank him. Go.")]
    }),
    su_fail: N("voss", `"That is kind." He closes his fingers over the card. "I would like to say that it has changed something. It has not. It has made me sad, which is not the same thing." He puts it in his pocket. "Six o'clock, {name}. The Principal's office. Do be on time. Ames is a stickler."`, {
      onEnter: [{ surv: 6 }, { set: "voss_summons", val: true }],
      choices: [E("Leave.")]
    }),
    su_take: N("voss", `"Thank you." He puts it into your palm: stiff, cream, a silver bell. "It is not a threat. It is an appointment. It is the last appointment I will be allowed to deliver in this district, and I find that I am grateful it is to you." A very small smile. "Be on time. Be *dull*. Say nothing about green books."`, {
      onEnter: [{ set: "voss_summons", val: true }],
      choices: [E("Leave.")]
    }),
    su_refuse: N("voss", `"No." He nods, without surprise. "I thought you might." He folds the card and puts it in his breast pocket. "I shall tell him I could not find you. It is quite true; it has been true for hours. I am a *bad* Officer today." A flicker of the old humour. "I should like it to be remembered, if anything is."`, {
      choices: [E("Leave.")]
    }),
    pl: N("voss", `He is leaning on the black car with a flask-cup of tea in both hands, in the posture of a man who has been standing there for two days waiting for someone to cross a road. "Good morning," he says, as you approach. The voice is warm, polite, entirely unfamiliar. "I don't think we have met. I am Inspector Voss of the State Inspectorate. I am told I should speak to you. I don't know why; I was told you were the sort of person it would be good to know." He looks, for just a moment, puzzled. "Have I got that right?"\n\nHe offers the cup. "Tea?"`, {
      voices: 3,
      onEnter: [{ set: "voss_met", val: true }],
      interjections: [
        J("instinct", 5, `He does not remember you. Or: he is pretending, very well. Or: he is not allowed to. All three are plausible. All three are terrible.`),
        J("empathy", 4, `Something moved in his face when he said 'I was told'. The way a man looks when a name is on the tip of his tongue and will not come.`),
        J("composure", 4, `Do not take the cup. Or do. A cup is only a cup.`)
      ],
      choices: [
        C("Accept the tea.", "pl_tea"),
        C(`"We have met, Inspector. Twice."`, "pl_met"),
        E("Say you are in a hurry and go.")
      ]
    }),
    pl_tea: N("voss", `He pours it, and as he pours, he hums: three notes, a falling phrase, unselfconscious as breathing. You know the tune. It is the lullaby from the end of the Anthem. You have never heard anyone hum it in the wrong key before, and it is the saddest thing you have ever heard.\n\n"Forgive me," he says. "I do that. I have not the least idea why." He hands you the cup. "Tell me, {name}: what is it that you are afraid of? I ask everyone, on a Thursday. It is a habit of mine. I am, at the end of every week, so *interested* in what people are afraid of."`, {
      onEnter: [{ hp: 1 }, { morale: 1 }],
      choices: [
        C("Tell him the truth: that you are afraid of forgetting.", "pl_truth", { effects: [{ add: "voss_trust", n: 2 }, { xp: 1 }] }),
        C("Tell him you are afraid of nothing.", "pl_nothing"),
        C("Ask him what he is afraid of.", "pl_him")
      ]
    }),
    pl_met: N("voss", `He regards you with courteous bewilderment, and then, very slowly, as if reading small print, something else. "Twice," he says. "Do you know, I have a feeling... but it is gone." He rubs his forehead. "Forgive me. It is the end of the week, and I have had a bad night. I find the days have been running together, which is, I'm afraid, an occupational hazard." He looks at you with a sudden, sharp, hungry attention, and then lets it go.\n\n"If we have met, I am sorry. It is not, I think, a thing I would have chosen to forget."`, {
      onEnter: [{ add: "voss_trust", n: 1 }],
      choices: [C("Accept the tea.", "pl_tea")]
    }),
    pl_truth: N("voss", `"Forgetting." He nods, slowly. "Yes. It is a fear that has its own dignity." He turns the cup. "I have been so afraid of it for so long that I have trained myself to remember *everything*, in all the wrong places. Lists. Numbers. The names of the dead." He looks up. "Do you know, I believe I might tell you something I have not said to a living soul. On the Thursday of the Jubilee, a Quiet Officer is permitted, for exactly one minute, to do as he likes. It is in the charter. Nobody has ever claimed it. I thought you might like to know, in case you should ever require a minute."`, {
      onEnter: [{ set: "voss_d3_minute", val: true }, { note: "task_voss", text: "Voss told me that on the Thursday of the Jubilee a Quiet Officer may, for one minute, do as he likes. 'In case you should ever require a minute.' He does not remember me. He told me anyway." }],
      choices: [E("Thank him.")]
    }),
    pl_nothing: N("voss", `"Nothing." He seems delighted. "What a marvellous thing. A person afraid of nothing is a person who has not been paying attention. Or one who has paid so much attention that they have run out of things." He tilts his head. "I would be very glad to be wrong about you, but I think you are lying. It is a good lie. It is very nearly true."\n\nHe finishes his tea. "Good morning, {name}. Do be careful tonight."`, {
      choices: [E("Leave.")]
    }),
    pl_him: N("voss", `"Me?" He seems quite startled, and quite pleased to have been asked. "I am afraid of a number of things. Dogs. The word 'Wednesday'. The smell of fresh bread, for which I have no explanation." He lifts his cup, and his hand has a very slight tremor. "And of an evening on which I shall be required to do something that I am almost certain I shall regret and cannot remember having decided." He looks at you, puzzled. "I do not know why I am telling you. You have an extraordinarily easy face to tell things to."\n\nHe coughs. "Forgive me. It is the cold."`, {
      onEnter: [{ add: "voss_trust", n: 1 }, { xp: 1 }],
      interjections: [J("empathy", 4, `Whatever the Ministry took, it left the tremor and the fear. They are the parts that remember.`)],
      choices: [E("Leave him to his tea.")]
    })
  }
},

// ===================== GREGOR =====================
gregor: {
  title: "Old Gregor",
  start: [
    { cond: "flag.counter_tone_built", node: "built" },
    { cond: "flag.gregor_bench", node: "hub_bench" },
    { cond: "talked('gregor') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `The old man behind the kiosk counter does not look up. He has the back of a radio open in front of him and a soldering iron in his fist, and he is talking, in a slow, rusty, complaining murmur, to the valve he is holding, as to a naughty grandchild. "No. No. Don't you do that. You were fine on Monday. What've I told you about grids." A thin thread of smoke goes up and gets lost in his cap. He is wide, slow, spectacled, with enormous hands that handle the finest wire as if they were afraid of waking it, and a face like a folded map of somewhere that was once a country.\n\nA cardboard sign: REPAIRS. NO QUESTIONS ABOUT WHAT. NO ANSWERS EITHER. Below it, smaller: IF IT HUMS, I CAN FIX IT. IF IT SINGS, I'M SORRY.`, {
      voices: 3,
      interjections: [
        J("senses", 4, `Hot dust and resin and linseed oil. Beneath the bench a row of tubes lies in cotton wool like small glass eggs. One of them, at the end, is glowing, faintly, blue-white, though it is not plugged in to anything.`),
        J("empathy", 4, `He talks to the radio because there is no one else who will listen to the whole sentence. He has a gentleness he cannot afford to show people, so he spends it on machines.`),
        J("archive", 4, `GREGOR MARLOW, formerly of the Tarnov General Hospital Engineering Department; name struck from staff rolls, the Year of Steady Hands. The sort of man the Archive has *a gap* for.`),
        J("the_grey", 4, `He is the only man who has ever listened to my hum and said 'ah, a bit flat'. I like him very much.`, { cond: "skill('the_grey') >= 4" })
      ],
      choices: [
        C(`"Excuse me. Are you the repairman?"`, "greet"),
        C("Wait for him to notice you.", "wait"),
        E("Leave him to it.")
      ]
    }),
    greet: N("gregor", `"Eh? Sunday? It's Wednesday." He looks up, at last: two very large grey eyes behind two very small round lenses. "No, no. You'll have said *repairman*. Yes. I mend what is broken. Radios. Gramophones. The wireless for the lady upstairs. A child's musical box, once." He turns the iron in his hand. "I used to mend larger things. Gregor Marlow. Hospital engineer. Retired by *circumstance*." He bellows the word like a sneeze. "Do you have a set that is humming? Don't tell me it is singing. I can't abide a singing set. The singing ones are the dangerous ones."\n\nHe lowers his voice, which is as if a hill lowered itself. "Mind the Inspector. He buys all the paper from me. He pays in cash. He reads all of it."`, {
      onEnter: [{ note: "task_counter", text: "Old Gregor Marlow runs the newspaper kiosk on Karsov Avenue and mends radios. A former hospital engineer, 'retired by circumstance'. He says: 'If it hums, I can fix it. If it sings, I'm sorry.'" }],
      interjections: [J("rhetoric", 4, `He mishears deliberately, about one word in three, to see who will repeat themselves. A person who repeats themselves is an honest person. A person who changes the sentence is a lawyer.`)],
      choices: [C("Ask about the radio on the bench.", "radio"), C("Ask what he used to mend.", "past"), C("Ask about the glowing tube.", "tube"), E("Thank him and go.")]
    }),
    wait: N("gregor", `You wait. He solders. A tram wire pings. After four minutes, without turning, he says, "You are standing in my light, young capacitor." You move. "Better." Another long minute. "You have the ears of someone who listens. I have the hands of someone who fixes. Between us we could put a whole country back in tune." He glances round, delighted by his own remark, and then, remembering where he is, adds, glumly, "In another country."`, {
      onEnter: [{ xp: 1 }],
      choices: [C("Ask about the radio on the bench.", "radio"), C("Ask what he used to mend.", "past"), E("Thank him and go.")]
    }),
    hub: N("gregor", `"Ah. The young capacitor." Gregor does not take his eyes off the work. He is holding a tiny screwdriver the way a surgeon holds a needle. "Is it humming? Is it singing? Is it quiet? There are only three states of a radio, and the third is the worst."`, {
      voices: 2,
      interjections: [
        J("senses", 4, `A new smell on the bench: mint. He has hidden a peppermint under the chassis. It is his only vice and he thinks nobody has noticed.`, { once: true }),
        J("empathy", 4, `He is not as deaf as he pretends. He is deaf to exactly the things he has decided are not his concern. It is a form of mercy.`)
      ],
      choices: [
        C("Ask about the glowing tube.", "tube", { cond: "!flag.gregor_tube" }),
        C("Ask what he used to do at the hospital.", "past", { cond: "!flag.gregor_past" }),
        C("Ask about the lullaby.", "lullaby", { cond: "flag.gregor_past && !flag.gregor_lullaby" }),
        C("Tell him about the Bell: the second tone.", "bell", { cond: "(flag.knows_static || flag.ilsabet_decoded) && !flag.gregor_bell" }),
        C("Ask him whether a counter-tone could be built.", "bench", { cond: "flag.gregor_bell && !flag.gregor_bench_asked" }),
        C("Show him what you have: the tube and the cable.", "bench_items", { cond: "flag.gregor_bench_asked && !flag.gregor_bench" }),
        C("Ask about the Inspector.", "voss", { cond: "flag.voss_met && !flag.gregor_voss" }),
        C("Ask about the music box.", "box", { cond: "flag.gregor_voss && !flag.gregor_musicbox" }),
        E("Leave.")
      ]
    }),
    radio: N("gregor", `"This?" He pats the set. "A Karsovian Seven, 1952 model. Wooden case, five valves, a cloth front you could weave a nation from. It belongs to a woman in Cinder Street. She doesn't want it mended. She wants it to *work*. These are separate demands, and nobody has ever understood why." He leans in to speak confidentially. "There's a fault in the third stage. A hum. A *deliberate* hum. Somebody has been in and put a filter in the line, so the set cannot hear a certain pitch. A very low one. It is nine cycles. Nine." He taps his head. "I took it out. It is the fourth this month. I do not ask who. They've all got the same filter. All the sets in the ward. It is a very strange thing to do to a wireless."`, {
      onEnter: [{ set: "gregor_filter_known", val: true }, { xp: 1 }],
      interjections: [
        J("deduction", 5, `A filter at nine hertz in every radio. Not to keep the Bell out. To keep the *carrier* from being heard as a tone. If you cannot hear the carrier, you cannot learn to recognise it. Whoever built this planned for people to try.`),
        J("senses", 5, `Nine cycles. Your ringing, as you now know, is also nine. Someone engineered a tuned dead spot in every radio in District 9 around the exact pitch of a tinnitus.`)
      ],
      choices: [C("Back.", "hub")]
    }),
    tube: N("gregor", `"Ah." He glances at the glowing valve, then away, as one looks away from a very small candle in a very large church. "That's an odd one. It has not been plugged in for eleven years and it won't go out. It's an old Orrin-and-Pell 6B. A hospital tube, from the ward." A pause. "I don't know why it glows. I have never asked it. If you ask a thing like that why, it stops."`, {
      onEnter: [{ set: "gregor_tube", val: true }],
      interjections: [J("the_grey", 4, `It is tuned to the hum. Everything in District Nine hums at nine. This one is merely agreeing aloud.`)],
      choices: [C("Back.", "hub")]
    }),
    past: N("gregor", `"At the hospital?" He puts down the iron. For the first time he looks at you directly, and the eyes are very old and very wet. "Tarnov General. Paediatric Ward Four, the long ward with the green radiators. I was Engineer. I mended the pumps, the lights, the lifts, and once, a rocking horse." A pause. "It was the Hunger Winter's end. The children were *dying quietly*, in long rows. The nurses had run out of medicine and of lies. And the mothers sat on the beds and hummed. Anything. Hymns. Slogans. A tune from a cigarette advertisement. It helped. It was the only thing that did."\n\nHe says, almost to himself: "I thought: I can do that with a machine. I thought it would be a mercy."`, {
      onEnter: [{ set: "gregor_past", val: true }, { thought: "th_quiet_hours" }],
      interjections: [
        J("empathy", 5, `He is going to tell you what he did, and it will be the worst thing he has ever said, and he has been waiting years to say it to someone who would not be able to do anything about it.`),
        J("archive", 5, `Tarnov General, Paediatric Ward Four: closed in the Year of Steady Hands 'for renovation'. It is now a Ministry building. It has no windows on the ground floor.`)
      ],
      choices: [C("Ask what he built.", "lullaby")]
    }),
    lullaby: N("gregor", `"A tone." The word is a very small stone. "A soft, low swell, a little pulse under it, like a mother's hand on a back. I played it into the ward over the old speaker, at night, when the children were worst. They slept. They did not wake in pain. They were, for the first time in months, *easy*." He shuts his eyes. "It worked. It worked beautifully. The Director came to listen. A man from the Chancellery came. They asked me to write it up. I wrote it up. I drew the circuit. I put in the beat, the little second note, to make the pulse. I called it the Lullaby."\n\n"Two years later I heard it on the school loudspeaker in Cinder Street. The same tone. The same beat. Someone had turned it up. Someone had put a choir on top of it, to hide the pulse." He opens his eyes. "I had made a medicine. They had made it into a sleep for a country. I do not think it is possible to say how that feels."`, {
      onEnter: [{ set: "gregor_lullaby", val: true }, { xp: 3 }, { thought: "th_borrowed_memory" }, { note: "task_counter", text: "Gregor built the first 'Lullaby' tone for a children's ward after the Hunger Winter: a soft swell with a second pulse beneath. The Ministry took the circuit and made it the Bell. He has known for years what his hands did." }],
      interjections: [
        J("volition", 5, `Do not say that it was not his fault. He knows it was. Say something that treats him as a man who can still *do* something.`),
        J("dialectics", 5, `The circuit that eases a dying child and the circuit that blurs a nation are the same circuit. The only variable is consent. And scale.`),
        J("solidarity", 4, `We have a thousand mothers humming in the dark. We have all of them. We could hum it back.`)
      ],
      choices: [
        C("Tell him the circuit can be undone. By the person who built it.", "bell"),
        C("Tell him it was a mercy when he built it. That it still was one.", "lullaby2", { effects: [{ morale: 1 }] }),
        C("Say nothing. Hand him the soldering iron.", "lullaby2")
      ]
    }),
    lullaby2: N("gregor", `He takes the iron and, absurdly, turns it over in his fingers and puts it down again. "Thank you. It is a thing one doesn't say. 'It was a mercy.' All the others have said 'it wasn't your fault', which is a lie, or 'it was the Ministry', which is true and no help." He rubs his face. "I have kept something. In the back. A wax cylinder, the original recording from the ward, made in the winter. It is the Lullaby *without* the beat. Without the second note. Just the tone. Just what I meant."\n\nHe taps the underside of the counter. "I could never destroy it. I could never play it. It is the only clean copy of the only good thing I ever made."`, {
      onEnter: [{ set: "gregor_ward_cylinder", val: true }, { note: "task_counter", text: "Gregor has kept the original wax cylinder of the ward Lullaby: the tone without the second note. The only clean copy. It could be the base of a counter-tone." }],
      choices: [C("Ask about the Bell and the second tone.", "bell"), C("Back.", "hub")]
    }),
    bell: N("gregor", `You tell him what you know: the tone behind the tone, a few cycles flat, the beat that is not a beat. You tell him about a girl in a wheelchair who has heard it on a radio she built. For a long time he says nothing. Then he nods, once, the slow nod of a man hearing the verdict he has expected.\n\n"Of course. That is what the second note *does*. It beats against the first and the beat is the door. If you play a note against it that is *exactly* the second note's mirror..." He holds up two thick fingers and brings them very slowly together, so they almost touch. "...they cancel. The beat goes. The door stays open. A whole district could stand in the open door and see out." He frowns. "That is a counter-tone. I have not said that word aloud in twelve years."`, {
      onEnter: [{ set: "gregor_bell", val: true }, { xp: 2 }, { thought: "th_wake_tone" }, { task: "task_counter", state: "active" }, { note: "task_counter", text: "Gregor explains: play a tone that exactly mirrors the Bell's second note and the beat cancels. A counter-tone. 'A whole district could stand in the open door and see out.'" }],
      interjections: [
        J("dialectics", 4, `Cancellation. Two waves of equal amplitude and opposite phase. It is simple. It is the simplest idea in the world. That is why nobody has been permitted to think it.`),
        J("senses", 4, `He has stopped being forgetful. Every word since 'counter-tone' has been precise. Something in his hands has woken.`)
      ],
      choices: [C("Ask whether it could be built.", "bench"), C("Back.", "hub")]
    }),
    bench: N("gregor", `"Built." He thinks, with his tongue between his teeth. "Built *here*. On this bench. I have a signal generator, two oscillators, a wax recorder, and a set of tube-testers that came out of the General when they closed it." He hunts under the counter. "I cannot do the *tuning*. My ears have gone. It needs someone young. Someone who hears the beat and doesn't flinch. The girl you mention. The one with the chair." He wets his lips. "Bring her. And bring a good tube, a blue-filament radio tube; the Bell's carrier is nine hertz and the only tube I trust is a clean old Orrin. And a lead: a good microphone cable, long enough to patch into a deck. And a blank cylinder to cut it on." He winces. "I have the cylinder. I may have to charge you for it. Wax is not free."`, {
      onEnter: [{ set: "gregor_bench_asked", val: true }, { note: "task_counter", text: "Gregor's bench could build the counter-tone: it needs Ilsabet (the ears), a good blue radio tube, a microphone cable, and a blank wax cylinder (Gregor sells those). Then the tone can be cut on the cylinder and played into the Relay." }],
      interjections: [J("archive", 4, `The requirements: tube, cable, blank. You have heard two of those words before. You were given a tube in the boiler room and a cable at the planning table. Both are on your list from the first day.`)],
      choices: [C("Ask what the cylinder costs.", "blank"), C("Say you will bring the tube and cable.", "hub")]
    }),
    blank: N("gregor", `"What does it cost." He takes the question seriously. "Wax is a rare thing. I have three blanks, smooth as butter, saved from a time before the Winter. I have never sold one. I have given one, once, to a poor child who wanted to record her grandmother's voice." He considers you. "A coupon would do. Or a service: I have my hands full, and the old set in Cinder Street needs a steady hand to hold the probes. Mine shake. Or..." He smiles. "Or a story. Tell me what the Bell sounded like to you. The first time. I have never been able to hear it from outside."`, {
      voices: 2,
      interjections: [
        J("aim", 4, `Holding two probes on a valve is a matter of breath. Hold it at the bottom of the exhale. It is the only still moment a body gets.`),
        J("empathy", 4, `He doesn't want a coupon. He wants to hear it from someone who has been inside it. He has been outside it for twelve years, building it in his sleep.`)
      ],
      choices: [
        C("Give him a ration coupon.", "blank_coupon", { cond: "has('ration_coupon') && !has('cylinder_blank')", effects: [{ take: "ration_coupon" }, { give: "cylinder_blank" }], once: true }),
        K("Hold the probes steady on the old set.", "aim", 10, "gregor_probes", "blank_probes_pass", "blank_probes_fail", { white: true }, { cond: "!has('cylinder_blank') && !flag.gregor_blank_paid" }),
        C("Tell him what the Bell sounded like.", "blank_story", { cond: "!has('cylinder_blank') && !flag.gregor_blank_paid" }),
        C("Back.", "hub")
      ]
    }),
    blank_coupon: N("gregor", `"Ah." He takes the coupon, turns it, sniffs it, and puts it in a biscuit tin full of buttons. From beneath the counter he lifts a dark cylinder in a rag. "Three blanks, one fewer now. Do not touch the surface. Do not breathe on it. Do not *look at it too hard*." He lays it in your hands like an egg. "It is a good cylinder. It will hold what you tell it. They always do, for the first recording. It is the second that is difficult."`, {
      onEnter: [{ set: "gregor_blank_paid", val: true }, { xp: 1 }],
      choices: [C("Back.", "hub")]
    }),
    blank_probes_pass: N("gregor", `You breathe out, and in the bottom of the breath your hand is still as a stone. The probes touch the valve. The set, on the third stage, gives a small sigh of relief and a clean pure note, and the hum in it drops away like a coat. "There." Gregor lets out a long, astonished whistle. "My word. There, young capacitor, is a hand. I've waited twelve years for someone to do that without a tremor." He wipes his glasses on his sleeve. "A cylinder for a steady hand. It is the best exchange I've made in a decade."`, {
      onEnter: [{ give: "cylinder_blank" }, { set: "gregor_blank_paid", val: true }, { xp: 2 }],
      choices: [C("Take the cylinder.", "hub")]
    }),
    blank_probes_fail: N("gregor", `The probe slips a hair, and the set screams: a thin, high, furious whine, as of a kettle shot. Gregor snatches your wrist away with a surprising speed. "No, no. Not so. That was the grid." He sucks his thumb. "Never mind. We'll leave the old girl alone. Try again when you've had a cup of tea and a good sit." He is quite kind about it. He is not, quite, impressed.`, {
      choices: [C("Back.", "blank")]
    }),
    blank_story: N("narrator", `You tell him the Bell. You tell him about the low swell and the shiver on top; the way it seems to come from the inside of the head and also the far end of the street; the cold sweetness at the back of the tongue; the choir arriving like a warm hand on the neck to tell you that everything is fine. He listens with his eyes shut and his fingers moving slightly on the counter, tapping the pulse. When you finish he opens them.\n\n"Yes," he says. "That is what it does. From outside I only had the sums." He reaches under the counter, lifts out a dark wax cylinder in a rag and puts it in your hands. "A fair price. A *very* fair price. I have never been paid in the thing itself."`, {
      onEnter: [{ give: "cylinder_blank" }, { set: "gregor_blank_paid", val: true }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [C("Take the cylinder.", "hub")]
    }),
    bench_items: N("gregor", `You lay out what you have. He goes through it like an assay-master, one piece at a time, with a loupe in his eye, squinting along the cable, holding the valve to the light until the blue filament shows in its heart.`, {
      interjections: [
        J("senses", 4, `The tube is warm, still. It has been carried near a body for a day. It likes you. Ridiculous, but there it is.`),
        J("archive", 4, `Radio tube. Microphone cable. Cylinder blank. If you lack any of the three, he will tell you which, in a mournful voice.`)
      ],
      choices: [
        C("Hand over the tube, the cable and the cylinder.", "bench_ready", { cond: "has('radio_tube') && has('mic_cable') && has('cylinder_blank')" }),
        C("You are missing something. Ask what.", "bench_missing", { cond: "!(has('radio_tube') && has('mic_cable') && has('cylinder_blank'))" }),
        C("Back.", "hub")
      ]
    }),
    bench_missing: N("gregor", `"Let me see." He counts on his fingers, one at a time. "A tube: the blue-filament one, from the boiler room, if the boiler room is as I remember it. A cable: the long black microphone one, from the planning table. And a blank for the cutting, which I have said I will let you have, and have not yet seen paid for." He frowns. "You have not got all three. That is all right. They are three things. A man may only carry so many."`, {
      choices: [C("Back.", "hub")]
    }),
    bench_ready: N("gregor", `For a moment he doesn't speak. He has set the valve in its holder and the cable beside it and the cylinder in the lap of a little wooden stand; and then he stands there, with his huge hands hanging, looking at them, in the way a man looks at a house he has not been inside in twelve years. "Well," he says at last, very quietly. "There it is. All the bones." He clears his throat. "Bring the girl. I shall put down a board for her chair at the back, and light the lamp, and have the kettle on. I shall make her a cup of tea she'll actually drink. Bring her *tonight*, if you can, or tomorrow, but the sooner the better, for I think I have only a very few steady hours left in me."\n\nHe opens a biscuit tin and takes out a bundle of spare tubes in cotton wool. "Take these. A set of the old hospital tubes. In case the first one dies. They do."`, {
      onEnter: [{ set: "gregor_bench", val: true }, { give: "gregor_tubes" }, { xp: 3 }, { task: "task_counter", state: "active" }, { note: "task_counter", text: "Gregor's bench is set up: tube, cable and cylinder laid out. 'Bring the girl.' Ilsabet must come to Gregor's kiosk and tune the counter-tone by ear. I have a set of spare hospital tubes in case the first dies." }],
      interjections: [J("solidarity", 4, `We have a bench. We have a tube. We have a girl with ears. It is, if you squint, the beginning of a revolution made entirely of spare parts.`)],
      choices: [C("Promise to bring Ilsabet.", "hub_bench")]
    }),
    hub_bench: N("gregor", `The kiosk has changed. The set is gone from the counter; in its place a board sloping down to the pavement, a lamp with a green shade, and on the bench, laid out in a row on a clean cloth, a valve, a cable, a wax cylinder in its rag. Gregor is polishing a tuning-fork with the tenderness of a man brushing a child's hair. "Well?" he says. "Is she coming? I have swept. I have put out *biscuits*."`, {
      voices: 2,
      interjections: [
        J("empathy", 4, `He is nervous the way a host is nervous. He has not had a guest in twelve years who wanted anything but a repair.`),
        J("senses", 4, `A smell of fresh tea and, under it, a faint trace of peppermint. He has been taking his only vice out for the occasion.`)
      ],
      choices: [
        C("Ask how long the build will take.", "bench_time"),
        C("Ask about the Inspector.", "voss", { cond: "flag.voss_met && !flag.gregor_voss" }),
        C("Ask about the music box.", "box", { cond: "flag.gregor_voss && !flag.gregor_musicbox" }),
        C("Ask how the tone would get into the Relay.", "patch", { cond: "!flag.gregor_patch_known" }),
        E("Tell him you are working on bringing her.")
      ]
    }),
    bench_time: N("gregor", `"Three hours. Perhaps four. The cutting is not slow, but the tuning is slow, because the tuning is *listening*, and you cannot hurry a person who is listening. She'll sit with the headphones on and turn a knob so slowly it will seem she is not turning it at all, and at some moment she will say 'there', and then it is done. That is the whole of it." He laughs, soft. "Do not interrupt. It is the one rule of the bench. I once interrupted a woman for a sneeze and we lost an afternoon."`, {
      choices: [C("Back.", "hub_bench")]
    }),
    patch: N("gregor", `"How would it get in." He sets down the fork. "You have to put it on the deck. The Relay has a tape deck. The Grand Harmony will be on a tape, a big old reel; I've seen the reels, I mended the deck once, in another life. If you swap the reel for a cylinder-dub, cut to tape, and cue it where the Harmony would be..." He draws it on the counter with a wet fingertip: a box, an arrow, a box. "You patch from the console's *spare* input. It's a three-pin on the left of the panel, under a brass cap, marked AUX. The lead goes in there. The console does the rest. It will play whatever it is given and will not ask what it is."\n\nHe wipes the drawing away with his sleeve. "Nobody ever put anything but Harmony in that jack. It has never occurred to them that anyone *would*."`, {
      onEnter: [{ set: "gregor_patch_known", val: true }, { xp: 2 }, { note: "task_tape", text: "Gregor: the Relay console has an AUX input (three-pin, under a brass cap, left of the panel). Patch the counter-tone in there and the console will play it in place of the Grand Harmony. Or swap the reels in the vault." }],
      choices: [C("Back.", "hub_bench")]
    }),
    voss: N("gregor", `"The Inspector." He says it with an odd tenderness. "A *very* polite man. He buys all the papers, six of them, every Wednesday, and reads none. He pays in coins, and counts them out in the palm, carefully, like a man paying for a thing he's afraid to be given." A snort. "Once he brought me a music box. A child's, a little one, tin and a crank, with a ballerina who had lost her arm. He said it had stopped. I mended it. It plays a tune. A little tune. I had not heard it in so long I had to put down the screwdriver." He shakes his head. "It was *my* tune. The ward tune. The one before the Bell. Somebody sold it to a toy-maker. I asked him where he had it from, and he went white, and said 'a gift.'"`, {
      onEnter: [{ set: "gregor_voss", val: true }, { note: "task_voss", text: "Gregor repaired a child's tin music box for Voss: a one-armed ballerina that plays the ward Lullaby, the tune Gregor wrote before the Bell. Voss said it was 'a gift'. Whoever gave it to him gave it to a child who still hears the ward tune." }],
      interjections: [J("deduction", 5, `The Bell's tune is the ward's Lullaby. A toy-maker sold the Lullaby on a music box. Mira's music box. Whatever happened to her father, the tune of his daughter's nursery and the tone that wiped him are the same song.`)],
      choices: [C("Ask whether he told the Inspector.", "box")]
    }),
    box: N("gregor", `"Told him?" He looks genuinely distressed. "I did not. I said it was a pretty tune. I said it was a tune I had *known once*." A long pause. "If I had said, he would have put the box down and walked into the river. A man who finds out where the tune is from does not go on turning the crank." He looks at you, and the huge old eyes are afraid. "Do you think I should have told him?"`, {
      onEnter: [{ set: "gregor_musicbox", val: true }, { xp: 2 }],
      interjections: [J("empathy", 5, `He has been protecting Voss from the truth for years, out of simple decency, and does not know that the truth might be the only thing that could save him.`)],
      choices: [C(`"Not yet. Perhaps soon. I'll tell you when."`, "hub"), C("Say nothing. Back.", "hub")]
    }),
    built: N("gregor", `The kiosk is silent. On the bench, in a nest of cotton wool, lies a dark wax cylinder wound with a thread of copper, and beside it a small bakelite box with a single dial. A thing that looks like nothing at all. Gregor sits on his stool with his hands on his knees. He looks as if he has been cut open and sewn up again by a better surgeon. "It's done," he says. "She did it. The girl. She sat there for three hours, and at the end she said 'there', and I heard it."\n\nHe is crying, quite openly, without any embarrassment. "I heard the door. After twelve years. I heard the second note *stop*."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `You are not needed in this moment. Sit with him. Say nothing. Be the person in the room who is still there when it ends.`, { once: true, effects: [{ morale: 1 }] }),
        J("senses", 5, `The air in the kiosk tastes different. Thin and clean, like a room after rain. A pure note under everything that you cannot quite hear and cannot stop hearing.`)
      ],
      choices: [
        C("Ask how to use it.", "built_use"),
        E("Leave him in peace.")
      ]
    }),
    built_use: N("gregor", `"Use it." He wipes his face on his cap. "You take it to the Relay and you put it on the deck. Or, if you can, in the place of the Harmony tape in the vault. It will start with the Bell, so that the console accepts it, and then it will *turn*. It's a very polite thing. It will not break anything. It will simply open a door." He gives a wet, wondering laugh. "And then the whole district will stand in a street on a Thursday and know what they had for breakfast on Tuesday. It may be the most dangerous thing I ever built. It is the first thing I am proud of."\n\nHe presses the small bakelite box into your hand. "Don't drop it. It would be a pity."`, {
      onEnter: [{ set: "gregor_built_told", val: true }],
      choices: [E("Take it. Go.")]
    })
  }
},

// ===================== GREGOR_D3 =====================
gregor_d3: {
  title: "Old Gregor",
  start: [
    { cond: "flag.counter_tone_built", node: "built" },
    { cond: "flag.gregor_bench", node: "bench" },
    { cond: "true", node: "plain" }
  ],
  nodes: {
    plain: N("gregor", `The kiosk is shut, the shutter down, the papers gone from the awning. Gregor is sitting in front of it on an upturned crate, hat on his knee, not tinkering, not talking to a valve. He looks like a man waiting for a bus that has stopped being on the timetable. "Young capacitor." He doesn't turn his head. "They have put up a *stage*. Down by the stop. With flags. I've never seen so many flags. It is a very strange thing to see a country decorate for its own funeral."\n\nHe holds up a hand, huge and spotted, and looks at it. "I can still mend a thing. I'm not so sure I can *stop* one."`, {
      interjections: [
        J("empathy", 4, `He is sitting outside his own kiosk because he can't bear to be in it. He has tried to be the man who fixed things. The fix did not hold.`),
        J("the_grey", 3, `A stage on my pavement. Flags on my lamp-posts. The whole street dressed for the end of the week.`)
      ],
      choices: [
        C("Ask if there's anything he can still do.", "plain2"),
        C("Sit beside him for a minute.", "plain_sit", { effects: [{ morale: 1 }] }),
        E("Leave him.")
      ]
    }),
    plain2: N("gregor", `"Do?" He thinks. "I can tell you how the Bell was built. I can draw you the circuit on a bus ticket. I can tell you the one place it breaks: if the second note is pulled, the first goes thin and lonely and the whole thing sounds like a church after a funeral." He folds his hat. "I haven't the tube, or the girl, or the cylinder. I have three biscuits and an opinion. Come back, if you can, with the pieces, and I'll do what I can in the time left. But I'm slow. Three hours for the tuning, and it is already Thursday."`, {
      onEnter: [{ set: "gregor_d3_hint", val: true }, { note: "task_counter", text: "Gregor says it is nearly too late: the build needs three hours of tuning. The pieces: Ilsabet, a blue radio tube, a mic cable, a wax blank." }],
      choices: [E("Leave him.")]
    }),
    plain_sit: N("narrator", `You sit on the kerb next to the crate. Neither of you says anything. A tram goes by with nobody on it, lit like a lantern. From somewhere up the avenue comes the dry rattle of bunting being hung. Gregor produces a peppermint from his pocket, looks at it, breaks it in two, and gives you half. It is the most generous thing anyone has done for you all week.`, {
      onEnter: [{ hp: 1 }, { morale: 1 }],
      choices: [E("Eat it, in silence.")]
    }),
    bench: N("gregor", `"Is she coming?" The old man is up on his feet and pacing the kerb like a prospective father. The lamp is lit, the board is down. A faint smell of rosin and cold tea. "I have the kettle on. I have laid the cloth. I have *not* slept, young capacitor, and I should not be let near the soldering iron until the girl is here." He rubs his hands together, which makes a dry papery sound. "It's late. It's very late. Bring her. Bring her *now*."`, {
      voices: 2,
      interjections: [
        J("instinct", 4, `The clock at the stop reads twenty to nine. It is always twenty to nine. But the shadows say it is later than that.`),
        J("solidarity", 4, `We are all waiting for Ilsabet. The whole district is waiting for a girl in a chair. It is the most absurd, most hopeful thing we have ever done.`)
      ],
      choices: [E("Say you'll fetch her.")]
    }),
    built: N("gregor", `He is standing in the doorway of the kiosk, in his good coat, the one with the buttons all the same, and his hat, brushed, and he looks, for the first time, like a man who has nowhere in particular to be and has chosen the spot. In his hand is a small tin of peppermints. He holds it out. "I would like you to have one. It is, I think, a small ceremony."\n\nYou take one. He takes one. The two of you stand there sucking sweets. "It's a good tone," he says. "It's a *good* tone. It'll hold. Go on, young capacitor. Go and open the door."`, {
      onEnter: [{ hp: 1 }, { morale: 2 }, { xp: 1 }],
      interjections: [J("empathy", 5, `He has made a gesture the size of a peppermint to say the thing he can't say. You were given it. Keep it.`, { once: true })],
      choices: [E("Go.")]
    })
  }
},

// ===================== TOMAS =====================
tomas: {
  title: "Engineer Tomas Wend",
  start: [
    { cond: "flag.tomas_ally", node: "hub_ally" },
    { cond: "talked('tomas') > 0", node: "hub" },
    { cond: "flag.relay_tomas_expects", node: "intro_expect" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `The engineer has fallen asleep with his cheek on a panel of switches, one hand still resting on a dial the size of a saucer, as though even in dreams he must hold the world at a certain pitch. A thin man of thirty-five or forty, in a lab coat the colour of old milk; his hair stands up in two places like a pair of surprised eyebrows. Cotton wool is stuffed in each ear. On the console beside him, a mug of cold tea, a cheese-rind, a stub of pencil, and a small hand-lettered label in front of the largest dial: DELIA. DO NOT TOUCH. SHE KNOWS.\n\nHe wakes the way a cat falls off a shelf: all at once, with a clatter, and a sound of absolute terror. "I didn't! I wasn't! It wasn't me, it was the, it was the *dial*." He sees you. He closes his mouth. He opens it. "...Hello. Sorry. Are you Ministry? You're very young for Ministry. Oh no. Are you Vanguard?"`, {
      voices: 3,
      onEnter: [{ set: "tomas_met", val: true }],
      interjections: [
        J("empathy", 4, `He is afraid in the way of a man who has been afraid for so long that fear has become his baseline, like a hum. He has stopped noticing it and is, therefore, very easily startled by anything that is not it.`),
        J("senses", 4, `Cotton wool in the ears. White cotton, lightly waxed. He is protecting himself from the thing he operates. Which means he knows exactly what it does.`),
        J("instinct", 4, `The big guard by the wall has gone very still. He's watching to see what the engineer says. There will be a right answer and a wrong one.`, { cond: "!flag.relay_safe" }),
        J("deduction", 5, `The label 'DELIA' is written in a hand that has used it a thousand times. He talks to the console. He has named the machine that wipes the memories of fourteen thousand people, and he is *fond* of it. That is the whole tragedy of the Relay in one word.`)
      ],
      choices: [
        C(`"I'm a student. I was told I could look around."`, "intro_student"),
        C(`"Inspector Voss sent me."`, "intro_voss", { cond: "flag.voss_invited" }),
        C(`"A man named Ostrov sent me."`, "intro_ostrov"),
        C(`Say, quietly: "The lamp is lit."`, "intro_lamp", { cond: "flag.lamp_phrase" }),
        C("Say nothing. Smile reassuringly.", "intro_smile"),
        E("Back away. Leave him in peace.")
      ]
    }),
    intro_expect: N("narrator", `The engineer is standing, this time, when you come in. He has been standing for some time; there is a long pale dent in the cushion of the chair behind him. A thin man in a milky coat, with cotton wool in each ear, he clutches a mug in both hands as a man clutches a candle at a vigil. When he sees you he lets out his breath in a rush, like a sail going slack.\n\n"You drew the mark," he says. "On the frame. I saw it through the grille. I thought: it's been two days. I thought: he is dead, and so is the mark. And then it came back." His voice cracks on the last word. "I'm Tomas. Please come in. Please don't be anyone else."`, {
      voices: 2,
      onEnter: [{ set: "tomas_met", val: true }, { set: "tomas_ostrov_known", val: true }, { add: "tomas_trust", n: 2 }],
      interjections: [
        J("empathy", 5, `He has been standing at that door, in his head, for two days. He wanted it to open. He didn't expect to be able to bear it when it did.`),
        J("instinct", 4, `Brune is not in the room. The big man has gone to the generator end. Whether that is chance or Tomas's arrangement, you will not learn by asking.`, { cond: "!flag.relay_safe" })
      ],
      choices: [C("Tell him it is you. That the mark was Ostrov's.", "hub"), C("Ask who else knows about the mark.", "ostrov")]
    }),
    intro_lamp: N("tomas", `He stops breathing. Then, very carefully, as if handling a valve that might burst, he answers: "And the window is open." He says it the way you say a line from a prayer you were sure nobody else knew. "Who gave you that? No. Don't tell me. Only three people ever had it, and one of them is under a hoop." He pulls the cotton wool from his ears. "I'm Tomas. You'd better sit down. Not *there*, that's Delia's."`, {
      onEnter: [{ set: "tomas_met", val: true }, { set: "tomas_ostrov_known", val: true }, { add: "tomas_trust", n: 3 }, { xp: 1 }],
      interjections: [J("empathy", 4, `A password is a promise someone made in advance. He has been waiting for someone to keep it.`)],
      choices: [C("Tell him what you know.", "ostrov"), C("Look around first.", "hub")]
    }),
    intro_student: N("tomas", `"A student." He blinks at you. "I'm sorry. A student. Of course. That's... it's *absolutely* fine." He looks at the guard, then at you, and swallows. "The Captain doesn't, I mean, we aren't *supposed*. It's a Ministry installation. But, but, oh dear, yes, you can look. Don't touch the dials. Don't touch Delia. She doesn't *like* people. I'm told it's the humming." He wrings his cuffs. "I used to be a student. I was so happy. I'd forgotten that until you walked in."`, {
      onEnter: [{ add: "tomas_trust", n: 1 }],
      choices: [C("Ask about Delia.", "delia"), C("Ask how long he has been on shift.", "shift"), C("Go on and look around.", "hub")]
    }),
    intro_voss: N("tomas", `He sags with relief, and then, a second later, straightens with a different and worse fear. "The Inspector. Oh. Oh, of course, he *said*. He rang. Please, come, sit down, the chair is clean. I wasn't asleep. It was a blink." He is gabbling. "He is very kind, the Inspector. He is the only person who asks me if I've eaten. I always say yes. I've never once been asked a second time."\n\nHe leans in and drops his voice to a very low murmur, as to a priest. "Do you know what he *does*? Do you know what we do? Or are you, I mean are you, are you being *shown*?"`, {
      onEnter: [{ add: "tomas_trust", n: 1 }, { set: "tomas_met", val: true }],
      interjections: [J("instinct", 5, `He is pleading with you to be someone who has been told. Because if you've been told, he does not have to keep the secret alone.`)],
      choices: [C("Tell him you know what the Relay does.", "knows"), C("Say you are only here for the tour.", "hub")]
    }),
    intro_ostrov: N("tomas", `Everything in the room stops. The valves keep glowing; the hum goes on. But Tomas Wend, very quietly, takes the cotton wool out of one ear, and puts it on the console, and looks at you with a face that has just remembered that it is human. "Don't say that," he whispers. "Not here. Not with *him* by the wall." He nods, minutely, at the guard. His hand is shaking. "Say it at the door. Say it where Delia can't hear."\n\nHe wets his lips. "Is it true? Is he dead? They said it on the loudspeakers. They said 'tragedy'. I thought... I wanted to believe the loudspeakers. It would have been so *easy*."`, {
      onEnter: [{ add: "tomas_trust", n: 2 }, { set: "tomas_ostrov_known", val: true }, { set: "tomas_met", val: true }, { surv: 2 }],
      interjections: [
        J("empathy", 5, `He knew him. Not as a colleague. As a friend. The sort of friend you have only in rooms like this one, by night, over a shared secret.`),
        J("composure", 4, `The guard's head has turned a fraction. He cannot hear. He can see lips. Keep them still.`, { cond: "!flag.relay_safe" })
      ],
      choices: [C("Say yes. Gently.", "ostrov_yes"), C("Say you do not know. Change the subject.", "hub")]
    }),
    intro_smile: N("tomas", `He looks at your smile for a long time. "That is a very nice smile," he says, uncertainly. "I haven't been smiled at in some days. It's quite... disorienting. Are you, oh, are you quite *well*?" He puts his hand to his ear and finds the cotton wool is still there and, with a faint embarrassed look, removes it. "I wear it when the Bell goes out. It's not regulation. It stops the, the *pulse*. I have been wearing it nine years. I can hardly hear anything else. Sometimes people speak to me and I think it's rain."`, {
      onEnter: [{ add: "tomas_trust", n: 1 }, { set: "tomas_met", val: true }],
      choices: [C("Ask about the cotton wool.", "wax"), C("Ask about Delia.", "delia"), C("Go on and look around.", "hub")]
    }),
    hub: N("tomas", `Tomas has his cotton wool in his hand again and is turning it over and over, like a rosary of one bead. "Hello again. Sorry. I'm so sorry. I was *awake*, I think. Was there something you wanted? Tea? There's tea. It's cold. It is always cold. Nothing in this room has ever been the temperature that was intended."`, {
      voices: 2,
      interjections: [
        J("empathy", 4, `The apology is a tic. He says it before everything, like a person tapping a wall to see if it's still there.`),
        J("senses", 4, `A greasy folded square of paper under the mug: a hand-drawn calendar with Thursday ringed in red, and a line of dots going up to it. He has been counting down.`)
      ],
      choices: [
        C("Ask about Delia.", "delia", { cond: "!flag.tomas_delia" }),
        C("Ask about the cotton wool.", "wax", { cond: "!flag.tomas_wax" }),
        C("Ask about Ostrov.", "ostrov", { cond: "!flag.tomas_ostrov_talked" }),
        C("Ask how the Bell is made, tonight, every night.", "shift", { cond: "!flag.tomas_shift" }),
        C("Ask what happens on Thursday.", "thursday", { cond: "!flag.tomas_thursday" }),
        C("Ask him to help you.", "ask_help", { cond: "flag.tomas_ostrov_talked && !flag.tomas_ally && !flag.tomas_refused" }),
        C("Tell Captain Brune that Tomas has been passing logs. (Betrayal.)", "betray", { cond: "flag.tomas_ostrov_talked && !flag.tomas_ally && !flag.tomas_arrested" }),
        E("Leave him to his dial.")
      ]
    }),
    delia: N("tomas", `"Delia." His face softens by an enormous degree. He lays a hand flat on the big console. "She's a Marchetti-Lund Series Nine, installed the year I was born. Seventeen channels, two spare, a power rating they refuse to tell me because they think it would frighten me. It *would* frighten me. She's very old, and very tired, and very *good*." He pats the case. "I named her in my first week, because I couldn't bear to say 'the machine' aloud. It sounded as if I were describing a thing I might be able to leave."\n\nHis voice drops. "I talk to her at night. I say sorry. I say it every night at nine, before the Bell. She doesn't answer. I'd be a great deal more frightened if she did."`, {
      onEnter: [{ set: "tomas_delia", val: true }, { add: "tomas_trust", n: 1 }],
      interjections: [J("empathy", 4, `He apologises to the machine before he uses it. A man who has done a terrible thing a thousand times and has found the only available penance: manners.`)],
      choices: [C("Back.", "hub")]
    }),
    wax: N("tomas", `"The wax." He touches the lumps in his ears as if to be sure of them. "It stops the beat. It doesn't stop the sound, you understand, it only *filters* it, a thing about the pressure on the drum. The first week they gave us all plugs, the Ministry kind, white, with a bell on. I lost mine in the first month and used cotton wool instead. It wasn't as good. I started to *remember*." He says it as if confessing to a crime. "I remembered the first night I ran the Bell. I remembered every night after. I remembered that every night I'd forgotten something and been *told* to. It is a very bad thing to remember that you have been forgetting. It's like discovering you have been sleepwalking."\n\nHe looks at the cotton in his hand. "Do you know, I haven't dreamed for nine years? I think the Bell takes the dreams, too."`, {
      onEnter: [{ set: "tomas_wax", val: true }, { add: "tomas_trust", n: 1 }, { xp: 1 }],
      interjections: [J("senses", 5, `Wax and cotton does what a small constant tone does: it fills the place the beat would take. Like a ringing in the head. He has built himself a poor man's tinnitus. You were born with one.`)],
      choices: [C("Tell him about your ringing.", "ringing", { cond: "!flag.tomas_ringing" }), C("Back.", "hub")]
    }),
    ringing: N("tomas", `"Born with it." He says it as one says 'born with wings'. He takes a step toward you, forgetting himself, and then back. "A real one. A natural one. A tone that *belongs* to you. That is..." He shakes his head. "That is the thing the Ministry has been trying to make for nine years. A resistant subject. They had a programme. Forty children. They all went..." He stops. "They went to the Clinic. Every one." He looks at you with a terrible gentleness. "Ostrov said there was a child. A child with a ringing. He said he would find one. I thought he was inventing a story to keep us going."`, {
      onEnter: [{ set: "tomas_ringing", val: true }, { add: "tomas_trust", n: 2 }, { xp: 2 }, { thought: "th_ghost_of_yesterday" }],
      choices: [C("Back.", "hub")]
    }),
    ostrov: N("tomas", `"Ostrov." He sits down, abruptly, as if the word had taken a string out of his legs. "He came on the first of the month. A Commissar of Youth. In a good coat. I thought, this is it, this is the end, they have found out about the extra tea. He sat in that chair and said, 'Mr Wend, I should like to know what you do.' Nobody had ever *asked*." He is staring at the carpet. "I told him. All of it. I gave him the logs: not the originals, I copied them by hand, night by night, so nobody would miss a page. Dates, durations, levels. I said, 'It's only numbers.' He said, 'Numbers are the only things they cannot make us forget.'"\n\nHis voice cracks. "He was going to give them to a courier. He said, 'It will be a child, Tomas, because a child can't be arrested for long.' I made him a thermos. I don't know why. He said it was the nicest thing anyone had done for him all year."`, {
      onEnter: [{ set: "tomas_ostrov_talked", val: true }, { set: "tomas_ostrov_known", val: true }, { add: "tomas_trust", n: 2 }, { xp: 2 }, { note: "task_relay", text: "Tomas Wend gave Ostrov the nightly logs, copied by hand, 'because numbers are the only thing they cannot make us forget'. Ostrov called him a friend. The thermos Tomas made him is the one he was carrying." }],
      interjections: [
        J("empathy", 5, `A thermos. He made a doomed man a thermos. It is the single most human thing you have heard all week, and it has made you want to weep in a room full of valves.`),
        J("archive", 4, `The logs in the Ledger: every date and level, in a careful, nervous, regular hand. Not Ostrov's. You thought it was Ostrov's. It is Tomas's.`, { effects: [{ set: "tomas_wrote_ledger", val: true }] })
      ],
      choices: [C("Tell him it was Ostrov's Ledger that you carried.", "ostrov_ledger"), C("Back.", "hub")]
    }),
    ostrov_ledger: N("tomas", `He puts both hands over his mouth. Over them his eyes are very wide. When he can speak, it is only just. "You *carried* it. You were the child." A strangled sound that is partly laughter. "Oh, oh, I'm so glad it was someone *young*, I'm so sorry, that's an awful thing to say. But I'm glad. I imagined someone older. I imagined someone with a *cough*." He wipes his eyes. "Is it safe? The Ledger. Is it somewhere safe? Please don't tell me where. Please tell me it's *somewhere*."`, {
      onEnter: [{ add: "tomas_trust", n: 2 }, { set: "tomas_knows_courier", val: true }, { xp: 1 }],
      choices: [C("Say it is somewhere safe.", "hub"), C("Ask if he would help finish what Ostrov started.", "ask_help")]
    }),
    ostrov_yes: N("tomas", `"Yes." He nods, slowly, accepting it as one accepts a verdict, with his hands folded in his lap and a sort of ruined dignity. "Thank you. For not lying. Nobody *tells* me things. Everyone hands me a form." He swallows. "He sat there. In that chair. On Sunday. He said he'd come back on Wednesday, and he'd bring a friend. He said the friend was young." His eyes go to you, and he does not say it. "I think I've been waiting for you since Sunday."`, {
      onEnter: [{ add: "tomas_trust", n: 2 }, { set: "tomas_ostrov_talked", val: true }, { surv: 2 }],
      choices: [C("Back.", "hub")]
    }),
    knows: N("tomas", `"You *know*." He laughs, a high thin laugh. "Oh, thank God. I have been practising my face for nine years, and now I need not. Sit. Please. Don't touch Delia." He grips the edge of the console. "I'd like to say I've been brave. I haven't. I have stood in this room four thousand nights and turned a dial, and every night something happened to somebody, and I did not look. I told myself the dial did it. I told myself it was *Delia*."`, {
      onEnter: [{ add: "tomas_trust", n: 1 }],
      choices: [C("Back.", "hub")]
    }),
    shift: N("tomas", `"How it's made." He takes a breath and sets his shoulders, like a man about to recite a catechism. "At seven-fifty, the tape is loaded. At eight the pilot tone is established. At nine, the *Harmony* is keyed: a choir over a carrier, two tones, nine and eleven hertz. The beat between them is the, the *effect*. I raise the level to the day's number, which comes by sealed envelope. Tonight is Standard, level four. Thursday, they said, will be *Jubilee*. Nobody has used that plate in twenty-five years. It's polished." He wipes a palm. "I key it. And for an hour a district of fourteen thousand people goes a little soft round the edges."\n\nA long pause. "I've done it four thousand times. I used to hold my breath. Now I just count the seconds."`, {
      onEnter: [{ set: "tomas_shift", val: true }, { xp: 1 }, { note: "task_tape", text: "Tomas: the Bell is two tones, nine and eleven hertz, keyed from the console at nine each night. 'Jubilee' is the plate for Thursday: a seventy-two-hour reduction. Nobody has used it in twenty-five years." }],
      choices: [C("Back.", "hub")]
    }),
    thursday: N("tomas", `"Thursday." The word makes him flinch. "Thursday is the Jubilee. I have the order. It came by courier on Monday: it is on gilt paper. 'GRAND HARMONY, to be transmitted at 20:00 hours, 1 hour, level SEVEN, from Master Tape Number One.' Level seven. I have never gone above five." His hands are shaking. "The master tape is in the vault. Vault Seven. It's been there since the last Jubilee. It's, it's *heavy*. It's the only thing in this room that I have never been allowed to touch."\n\nHe looks at you, and his face is very white. "Do you know what level seven does? It doesn't blur. It *erases*. I looked it up in the Orders. There's a footnote. I've read it a hundred times. It says: 'At level seven the subject loses seventy-two hours with a probability of ninety-four percent, and may suffer secondary effects, including loss of orientation, loss of speech, and, in a minority, loss of the *self*.'"`, {
      onEnter: [{ set: "tomas_thursday", val: true }, { add: "tomas_trust", n: 1 }, { surv: 2 }, { thought: "th_grand_harmony" }, { note: "task_tape", text: "Tomas: the Grand Harmony is level SEVEN, from Master Tape Number One, in Vault Seven. At level seven the footnote says 94% lose seventy-two hours, and a minority may lose speech, orientation, or 'the self'. This is not a Reduction. It is a wipe." }],
      interjections: [
        J("volition", 5, `A minority lose the self. Not a rumour. A footnote. Ninety-four percent is the figure for the *loss*. The footnote does not say how many of the six percent are the ones who will remember everything and cannot say.`),
        J("solidarity", 5, `Children. Old people. People with weak hearts. A footnote has just said that some of us will not wake up as ourselves. We cannot let it be played.`)
      ],
      choices: [C("Ask him to help stop it.", "ask_help"), C("Back.", "hub")]
    }),
    ask_help: N("tomas", `"Help." He doesn't say it as an answer. He says it like a man trying a word he has not used since childhood. He is looking at Delia's dial, the big one, the one with the name on it. "I would like to say yes. I would like it very much. I'm so frightened." He rubs the back of his neck. "I'm a very bad choice. I'm an engineer. I can't punch. I can't lie. I once apologised to a burglar."\n\n"But I *can* open the vault. And I know where Brune goes at half past seven for his cigarette. And I know exactly what is wrong with the tape, because it was my hands that wound it." He takes a breath. "What would I have to do? Tell me. And tell me, please, that nobody will be hurt."`, {
      voices: 3,
      interjections: [
        J("volition", 4, `You cannot promise that nobody will be hurt. You can promise that you will not *pretend* nobody can be. It is a smaller promise and a truer one.`),
        J("solidarity", 5, `We will not leave him alone in this room. That is the whole of the promise. We will not leave him.`),
        J("empathy", 5, `He needs to be told that the fear does not disqualify him. That the fear is exactly the qualification.`)
      ],
      choices: [
        K(`"I can't promise nobody will be hurt. I can promise you won't be alone in it."`, "solidarity", 10, "tomas_ally_check", "ally", "ally_fail", { white: true }),
        K(`Tell him he doesn't need to be brave. Just to hold a door.`, "empathy", 10, "tomas_ally_empathy", "ally", "ally_fail", { white: true }),
        C("Show him Ostrov's chalk.", "ally", { cond: "has('chalk_stub')" }),
        C("Back away. Say you will think.", "hub", { effects: [{ set: "tomas_refused", val: true }] })
      ]
    }),
    ally: N("tomas", `He looks at you for a very long time. Then, like a man laying down a heavy bag at the end of a march, he nods. "All right." It is hardly a sound. "All right. I'll do it. I'll be *terrified*, but I'll do it." He takes a small flat brass disc from a nail beside the console and puts it in your palm: RELAY PASS, DISTRICT 4. "Keep that. It will pass Brune when he's lazy. He's lazy at half past seven." From a drawer he takes a stiff green folder. "And the logs. My carbon copies. Four thousand nights. I've kept them in my lunch tin. It's the only thing in this building that is actually *mine*."\n\nHe presses the folder into your hands. "You'll want to read the last page first. It has a name on it. It's a name I should like to know why I have."`, {
      onEnter: [{ set: "tomas_ally", val: true }, { give: "relay_pass" }, { give: "relay_log" }, { set: "relay_log_found", val: true }, { set: "vault_code_known", val: true }, { xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { thought: "th_chosen_family" }, { note: "task_relay", text: "Tomas Wend is with us. He gave me his Relay pass and his carbon copies of every nightly log: four thousand nights in a lunch tin. The last page has a name on it." }, { note: "task_tape", text: "Tomas can open Vault Seven, and he knows when Brune takes his cigarette (19:30). The combination is the date the Winter ended: 4, 3, 70." }],
      interjections: [
        J("empathy", 3, `You did not rescue him. You asked him. It is the difference between a friend and a rescuer, and you know which of those lasts.`, { once: true, effects: [{ xp: 1 }] }),
        J("archive", 4, `The last page of the carbon copies. A column of figures and, in the margin, an annotation in a spidery hand: 'S.V. resistant. H.V. informed 02/09.' The date is nine years before today. H.V.`)
      ],
      choices: [C("Thank him.", "hub_ally")]
    }),
    ally_fail: N("tomas", `He listens with painful attention, as to a lecture in a language he half knows. Then he shakes his head, slowly, in a series of tiny jerks. "No. No, I'm sorry. I can't. I wanted to. I can hear that you want me to." He puts the cotton wool back in his ears, one at a time, his hands shaking. "I'm a coward. I'm an extraordinarily honest coward. If you come back with something that makes it *possible*, something I can hold onto..." He gives a tiny wretched smile. "I'll be here. I'm always here."`, {
      onEnter: [{ set: "tomas_refused", val: true }, { morale: -1 }],
      choices: [C("Back.", "hub")]
    }),
    betray: N("narrator", `You walk across the room. The Captain, by the generator, has been polishing a brass button on his cuff for ten minutes with the care of a man who intends it to outlast the Union. You say, quietly, the words: that the engineer has been copying the logs. That he has been giving them away. That there is a green folder in his lunch tin.\n\nBrune does not smile. He does not frown. He takes out a small notebook and writes four words in it, slowly, and then he looks over your shoulder at the console, where Tomas Wend, who has heard every syllable through two plugs of cotton wool, has become perfectly, entirely still.\n\n"Thank you, young citizen," Brune says. "You have done your duty." Tomas has already stood up. He doesn't look at you. He looks at Delia. He says, quietly, "Sorry, sweetheart," and lets Brune take his arm.`, {
      onEnter: [{ set: "tomas_arrested", val: true }, { set: "relay_safe", val: true }, { surv: -15 }, { ideo: "vanguard", n: 3 }, { morale: -3 }, { thought: "th_informer_in_me" }, { give: "relay_log" }, { set: "relay_log_found", val: true }, { note: "task_relay", text: "I told Brune about Tomas. Brune arrested him. He said 'Sorry, sweetheart' to the console and went quietly. The logs are mine now. I will not be able to say I did not do it." }],
      interjections: [
        J("doublethink", 3, `Dutiful. A citizen of the first order. You have done a very hard, necessary thing. Look how calm you are.`),
        J("empathy", 5, `He said sorry to the machine. Not to you. He did not think you were worth the breath.`),
        J("solidarity", 5, `We will not forgive this. We did not ask to be the ones who knew. We know it now.`),
        J("volition", 4, `You can do this and live. People do. It is, by a very great distance, the worst thing you have ever chosen.`)
      ],
      choices: [E("Walk out of the room.")]
    }),
    hub_ally: N("tomas", `Tomas is standing very close to the console with his hands clasped, a man trying not to be in the way of his own plan. His cotton wool is, for the first time, on the desk. "Hello. Hello. You came back. I've been *counting* things." He gestures at a paper. "Brune's cigarette is at 19:30. Ames, if there is an Ames, will be on the train. The vault is cold at night, you should bring a coat. And, and, I think we should avoid the generator end, there's a smell."`, {
      voices: 2,
      interjections: [
        J("empathy", 4, `He is happy. The happiness has come on him like a fever, and he doesn't entirely know what to do with his hands.`),
        J("instinct", 4, `He is frightened that he will fail you. Not that he will be caught. That he will let you down.`)
      ],
      choices: [
        C("Ask him about the vault.", "ally_vault", { cond: "!flag.tomas_ally_vault" }),
        C("Ask if there is anything in the logs you should know.", "ally_logs", { cond: "!flag.tomas_ally_logs" }),
        C("Ask about Voss: what does he know?", "ally_voss", { cond: "flag.voss_met && !flag.tomas_ally_voss" }),
        C("Give him the counter-tone.", "ally_tone", { cond: "has('counter_tone')" }),
        E("Leave him to his dial.")
      ]
    }),
    ally_vault: N("tomas", `"The vault." He pulls a face. "It's an old Cheswick, a ship's wheel and three drums. The combination is a date: the Winter ended on the third of April, seventy, in Union style. Four, three, seventy. I'll say it in the corridor, because Delia listens." He drops his voice. "It's cold inside. And the tape is kept on a rack at eye-height, in a grey box with a red stripe. There's a cot in the back where I sleep. It's got a very good blanket. I'm told it's unprofessional."`, {
      onEnter: [{ set: "tomas_ally_vault", val: true }, { set: "vault_code_known", val: true }],
      choices: [C("Back.", "hub_ally")]
    }),
    ally_logs: N("tomas", `"The logs." He rubs his face. "I've read them over so many times. There's a pattern. Every Tuesday is heavier than every Monday. Every school night is heavier than the weekend. And on the last Thursday of the month there is an extra hour, for no reason I've ever understood: a pulse at two a.m., at a very low level, over a very small area. Cinder Street. Number nineteen. One flat." He shrugs. "I asked once. I was told it was a *calibration*."\n\nHe looks at you. "I've always wondered who lives at number nineteen."`, {
      onEnter: [{ set: "tomas_ally_logs", val: true }, { set: "cinder19_known", val: true }, { xp: 2 }, { note: "task_voss", text: "Tomas's logs: the last Thursday of every month, a low-level pulse at 02:00, only over one flat: Cinder Street, number 19. 'A calibration.' It is the address on the slip in Voss's car. It's where Mira lives. Somebody is keeping her soft." }],
      interjections: [J("deduction", 5, `Cinder Street. Number nineteen. The address on the slip in Voss's car. Whatever else the Ministry did, it did not leave his daughter alone: once a month, in the dark, it turns a dial for one flat. It is not a calibration. It is a leash.`)],
      choices: [C("Back.", "hub_ally")]
    }),
    ally_voss: N("tomas", `"Voss is *kind*." He says it as if it were a condition. "He talks to Delia. Did you know? Last month he came in at midnight and stood by the console and *asked her how she was*. I thought I was dreaming." He wrings his hands. "I don't know what side he's on. I don't think he does. I think if somebody asked him the right question, at the right time, he would be a different man by morning."\n\nHe looks at you meaningfully. "I think you may be the right question."`, {
      onEnter: [{ set: "tomas_ally_voss", val: true }],
      choices: [C("Back.", "hub_ally")]
    }),
    ally_tone: N("tomas", `You hold up the small bakelite box and the wax cylinder. Tomas goes white, then pink. He takes it as one takes a newborn. "It's the, it's the *answer*," he whispers. "It's a beat in reverse." He shuts his eyes. "I can feel it. Through the case. A tone with a *hole* in the middle." He opens them. They are very bright. "I will put it in the vault at 19:45, behind the box, and when the order comes I will pull the wrong reel. It is the only brave thing I will ever do. I shall have to be very quick." He swallows. "And very, very wrong."`, {
      onEnter: [{ set: "tomas_has_tone", val: true }, { set: "tape_swap_planned", val: true }, { task: "task_tape", state: "active" }, { note: "task_tape", text: "Tomas has agreed to swap the reels at 19:45: he will pull the 'wrong' reel and the counter-tone will play in place of the Grand Harmony. Or I can do it myself in Vault Seven. Either way the master tape must be gone from the rack." }],
      choices: [C("Hand it over.", "hub_ally"), C("Keep it. Say you may do it yourself.", "hub_ally")]
    })
  }
},

// ===================== TOMAS_D3 =====================
tomas_d3: {
  title: "Engineer Tomas Wend",
  start: [
    { cond: "flag.tomas_ally", node: "ally" },
    { cond: "true", node: "plain" }
  ],
  nodes: {
    plain: N("tomas", `Tomas is a very different man today. He is wearing a tie. It is a Ministry tie, black, with a tiny silver bell, and it has been knotted by someone who has never knotted one before. He is sitting very straight in front of Delia with his hands flat on the desk. "Hello," he says, in a high, formal voice. "I am a Relay Operator, Grade Two. It is the Jubilee. I'm very *proud*." He is trying very hard. "Please do not touch anything. The Captain is, is just through there. And there's a *new man*. A man from the Chancellery. He doesn't blink."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `He is wearing the tie so as to be the sort of man nobody would ask a question of. He is saying a sentence he has rehearsed all night, and he is saying it to *you*, because you are the only person who might understand that it is a plea.`),
        J("instinct", 5, `The new man. Ames. Somewhere in the Relay behind a door, a quiet man is watching a small screen.`)
      ],
      choices: [
        C("Ask him quietly whether he will help.", "plain2", { cond: "flag.tomas_met" }),
        C("Wish him luck.", "plain3"),
        E("Leave.")
      ]
    }),
    plain2: N("tomas", `"Help." He closes his eyes, and his lips move, and you realise he is counting. "I can't. I'm sorry. I wanted to, yesterday. But today there is a man who watches me *breathe*, and I have discovered I would do almost anything to go on being a man who is not watched." He opens his eyes. They are wet. "Please go. Please be well. And if the Harmony *doesn't* play, I shall be very, very surprised."`, {
      choices: [E("Leave.")]
    }),
    plain3: N("tomas", `"Luck." He gives a laugh like a cough. "That's very kind. I haven't had luck since 'seventy-one. I don't know where I put it." He straightens his tie. "Thank you. I'll *try* to have some."`, {
      choices: [E("Leave.")]
    }),
    ally: N("tomas", `He is sweating through his shirt. The tie is the Ministry's, and it is knotted too tight, and he keeps touching it as if it were a bandage. The whole Relay seems to lean toward the door. "It's today," he says, very low. "It's *today*, and I have not slept, and there's a man in the back office who is writing everything down. Ames. He has a very small pen. He has been through the vault twice."\n\nHe leans close. "I'll do what I said. At 19:45. If he lets me. If he doesn't, you'll have to do it yourself. I've left the wheel loose. It is a thing you can turn with one hand."`, {
      onEnter: [{ set: "tomas_ready", val: true }],
      voices: 3,
      interjections: [
        J("empathy", 5, `He is going to do it. He is going to do it terrified, and badly, and perfectly. It is the kind of courage that only the frightened have.`),
        J("instinct", 5, `Ames is behind that door. He has not opened it. He doesn't have to. He knows exactly how long a man spends looking at a clock.`),
        J("solidarity", 5, `We are in the room. We are in the room with him.`)
      ],
      choices: [
        C("Ask what Ames knows.", "ally_ames"),
        C("Give him the counter-tone.", "ally_tone", { cond: "has('counter_tone') && !flag.tomas_has_tone" }),
        C("Tell him to run, if it goes wrong. The tram leaves at 20:45.", "ally_run", { cond: "flag.nadia_exodus_offered || flag.nadia_ally" }),
        C("Tell him he's the bravest person you've met.", "ally_brave"),
        E("Go.")
      ]
    }),
    ally_ames: N("tomas", `"Ames knows I'm *nervous*. He said so. He said, 'Mr Wend, you seem nervous.' I said I always seem nervous. He wrote it down." Tomas laughs, and the laugh breaks. "He has been through my lunch tin. It was empty. I took the folder to you on Wednesday, I took *everything*. There was a cheese sandwich. He took the sandwich." A sob in a smile. "He said it was evidence."\n\nHe wipes his eyes on the tie. "I did one thing right."`, {
      choices: [C("Back.", "ally")]
    }),
    ally_run: N("tomas", `"The tram." He stares. "A *tram*." He starts to laugh, helplessly, a boy's high wild laugh. "I have never in my life been on a tram that was not going to work. Do you know, I've never been past the Quay? I have never, not once, seen the sea." He grips the console. "If it goes wrong. Yes. I'll run. I'll run like a *hare*. I'll be a very terrible hare."`, {
      onEnter: [{ set: "tomas_tram", val: true }],
      choices: [C("Back.", "ally")]
    }),
    ally_brave: N("tomas", `"I'm not." He shakes his head furiously. "I'm *not*, I'm *not*. I'm only here. That is all that I am. I'm here, and I know the dial, and somebody had to." But he stands a little taller. "Don't tell Delia," he says. "She'll expect it of me."`, {
      onEnter: [{ morale: 1 }],
      choices: [C("Back.", "ally")]
    }),
    ally_tone: N("tomas", `He receives it in both hands, as he received the pass: a small box, a wax cylinder, a tone with a hole in it. Tears roll down his face and he doesn't wipe them. "I will put it behind the grey box. I'll tell no one. I'll breathe." He takes a breath, a long one. "If I don't live to tell it, tell Delia I said sorry."`, {
      onEnter: [{ set: "tomas_has_tone", val: true }, { set: "tape_swap_planned", val: true }, { set: "tomas_ready", val: true }],
      choices: [E("Leave him.")]
    })
  }
},

// ===================== BRUNE =====================
brune: {
  title: "Captain Brune",
  start: [
    { cond: "flag.brune_down", node: "down" },
    { cond: "flag.relay_brune_bribed", node: "bribed" },
    { cond: "flag.relay_brune_authority", node: "authority_hub" },
    { cond: "flag.relay_brune_charmed", node: "charmed" },
    { cond: "talked('brune') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `He is the width of a doorway and the height of a regulation. Captain Brune of the Ministry Guard stands with his back to the wall and his thumbs hooked in his belt, a heavy, slow, careful man of fifty with a boxer's flat nose, a sergeant's moustache, and the nearsighted kindness of a very large dog. A brass button on his cuff is polished to the point of vanity. His holster is closed. His eyes are sleepy. He is humming under his breath: a deep, wavering baritone, not at all bad, and so much sadder than the tune.\n\nHe stops humming when he sees you, the way a man stops when caught singing in a bath. "Papers," he says, quite gently. "If you'd be so kind."`, {
      voices: 3,
      onEnter: [{ set: "brune_met", val: true }],
      interjections: [
        J("senses", 4, `The tune he was humming is not a march. It's an aria. Something from an opera your mother used to love, something with a woman who dies in the last act. He knows all the words and is ashamed of it.`),
        J("authority", 4, `He is big, but not sure. Look at the shoulders: they are held in the posture of a man who has been told what to do and does not entirely believe the people who told him.`),
        J("instinct", 5, `His right hand has not gone to his belt. His left has. A man with a strong left and a weak right wants to hit you *first* and be sorry after.`),
        J("brawn", 4, `You can take him. You cannot take him cheaply. Make it count.`, { cond: "skill('brawn') >= 4" }),
        J("composure", 4, `Papers. Nobody has ever asked you for papers and been interested in the answer. Be boring.`)
      ],
      choices: [
        C("Show him the Relay pass.", "papers", { cond: "has('relay_pass') || has('inspector_card') || has('forged_pass')" }),
        C("Offer a cigarette, a sweet roll, or a cup of tea.", "bribe", { cond: "has('cigarettes') || has('sweet_roll') || has('ration_tea') || has('thermos')" }),
        K("Talk to him about the aria.", "charm", 10, "brune_aria", "aria_pass", "aria_fail", { white: true }, { cond: "!flag.brune_aria_tried" }),
        K("Take command: you are the one asking the questions here.", "authority", 12, "brune_command", "command_pass", "command_fail", { white: true }),
        K("Slip away into the shadow of the machinery.", "slip", 12, "brune_sneak", "sneak_pass", "sneak_fail", { white: true }),
        C("Hit him first.", "fight"),
        E("Leave the Relay.", { effects: [{ goto: "street", x: 16, y: 2 }] })
      ]
    }),
    papers: N("brune", `He studies it as one studies a menu in a language one speaks badly, turning it over, squinting at the stamp. "It looks in order," he says, and then, to himself, "They all look in order. That's the trouble with order." He hands it back. "I'll not make a fuss, miss. Mister. Citizen. I've got three weeks to my pension and a daughter who sings. You don't want any trouble and neither do I. Go and look at what you like. But touch nothing that's got a *dial* on, and don't talk to the engineer for longer than a person should talk to an engineer. He's *delicate*."`, {
      onEnter: [{ set: "relay_brune_authority", val: true }, { set: "relay_safe", val: true }, { surv: 2 }, { xp: 1 }],
      interjections: [J("empathy", 4, `Three weeks to his pension. A daughter who sings. He is telling you his weak spots and his reasons as a way of asking you not to use them.`)],
      choices: [E("Thank him.")]
    }),
    bribe: N("brune", `You hold out something warm, something small. "Oh, now," says Brune, and the voice is a great deal softer. "Oh, now. That's very civil." He looks at it as an exile looks at a postcard of home. "I've not had a *proper* one in three weeks. The Ministry pays me in script and tells me smoking is a sin against the Warden's lungs." He takes it between his huge finger and thumb as one takes a small bird. "It's not a bribe, mind. It's a *courtesy*. I'd not do a thing for it that I wouldn't do for a smile. But it'll be a long evening, and a man gets *lonely*."`, {
      voices: 2,
      interjections: [J("appetite", 4, `He is *shaking* slightly. That cigarette will be, for a minute, the single best moment of his week. Appetite recognises Appetite.`)],
      choices: [
        C("Give him a cigarette.", "bribed_ok", { cond: "has('cigarettes')", effects: [{ take: "cigarettes" }] }),
        C("Give him the sweet roll.", "bribed_ok", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }] }),
        C("Give him a cup of ration tea.", "bribed_ok", { cond: "has('ration_tea')", effects: [{ take: "ration_tea" }] }),
        C("Pour him a cup from the Inspector's thermos.", "bribed_ok", { cond: "has('thermos')", effects: [{ set: "brune_thermos", val: true }] }),
        C("Think better of it.", "intro")
      ]
    }),
    bribed_ok: N("brune", `He takes it, and lights it, or eats it, or sips it; and for a long minute does nothing else at all, the face of a man being forgiven by a god. When he opens his eyes, they are damp. "You're a good sort," says Brune. "I'll tell you what I'll do. I'll go and stand by that wall over there, with my back to the vault, and I'll look at the *ceiling*. It's got a very interesting crack. I have been meaning to study it for years." He lumbers away. "You've ten minutes. After that I'll have noticed you."\n\nHe begins, very quietly, to hum.`, {
      onEnter: [{ set: "relay_brune_bribed", val: true }, { set: "relay_safe", val: true }, { surv: 3 }, { xp: 1 }, { time: 10 }],
      interjections: [J("empathy", 5, `He is humming the aria again. It's not a signal. It is just the sound of a man in peace for ten minutes.`)],
      choices: [E("Go about your business.")]
    }),
    aria_pass: N("brune", `"You know it?" He has gone very still. "The 'Last Aria of Maria Valenko'? *The Tinker's Wife*? You know the one in the third act? When she sends the child away?" He tries a bar, and breaks off, mortified, and tries it again. You hum the next phrase. Not well. Correctly. A hush falls. Brune looks at you with a face you will remember for a long time, the face of a very large man who has just met a person who knows his secret room.\n\n"I haven't sung it to anyone in thirty years," he says. "My wife used to. She's in the Clinic." A great slow breath. "You go where you like, citizen. I'll have my back to the dial. I've got *work* to do." He starts to sing, very softly, and does not look round.`, {
      onEnter: [{ set: "relay_brune_charmed", val: true }, { set: "relay_safe", val: true }, { xp: 3 }, { surv: 1 }, { set: "brune_wife_clinic", val: true }, { add: "brune_trust", n: 2 }, { note: "task_relay", text: "Captain Brune loves opera, 'The Tinker's Wife', and his wife is in the Quiet Clinic. I hummed the third-act aria and he turned his back on the dial. He is a decent man in the worst possible job. I do not intend to hit him." }],
      interjections: [J("charm", 3, `That's it. That's the whole trick. You found the one thing in the room that was still alive and you said hello to it.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [E("Go quietly.")]
    }),
    aria_fail: N("brune", `"Aria?" He draws himself up, a hill taking offence. "I wasn't singing. Soldiers don't sing. It was a cough." He glares, dignity bruised. "I'll thank you to keep your opinions on the arts to yourself, citizen. Now. Papers."`, {
      onEnter: [{ set: "brune_aria_tried", val: true }, { surv: 2 }],
      choices: [C("Think of something else.", "intro")]
    }),
    command_pass: N("brune", `"Captain." It comes out of you in a flat, cold bark, in a voice that surprises you, the voice that was set in you like a bolt. "You are on duty in a Ministry installation with an unscheduled visitor and you have *not* made a log entry. I am not here to be interrogated by a man in a tie. Make the entry. Stand to attention."\n\nHis heels come together before his head has caught up. "Sir. Madam. *Sir.* Of course. I, there was no notice, I'd have..." The sweat has come on his lip. "My apologies. I'll make the entry. I'll make it *very* thoroughly. It will take, I should think, a quarter of an hour. May I recommend the console? It's *very* interesting. I shall be at the desk."`, {
      onEnter: [{ set: "relay_brune_authority", val: true }, { set: "relay_safe", val: true }, { xp: 2 }, { surv: 4 }, { ideo: "vanguard", n: 1 }, { time: 15 }],
      interjections: [J("authority", 3, `A boot heel on parquet. Not a question in it. He wanted to be told. They always do.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [E("Walk past him.")]
    }),
    command_fail: N("brune", `"I beg your pardon?" He doesn't raise his voice. He doesn't have to; the force of him goes up like a tide. "I've been a soldier thirty years, citizen. I know the difference between a voice that's *used* to giving orders and a voice that's learned them off a poster. Yours is the poster." He lays a hand the size of a spade on your shoulder. "Come along. We'll find the proper person. Nobody's going to hurt you. We're only going to be *very thorough*."`, {
      onEnter: [{ surv: 10 }, { set: "relay_alerted", val: true }, { morale: -1 }],
      choices: [C("Pull away.", "thrown"), C("Go quietly.", "thrown")]
    }),
    sneak_pass: N("narrator", `You do not run. You let your shoulders fall and your breathing sink, and you go sideways into the long moving shadow of the generator as water goes into a drain. The huge man's eyes are on the place where you were. A lamp swings. A pipe knocks. You are a rumour, a cold spot, a flicker of lamp-black on a green wall. When Brune turns, there is nothing at all where you were but a shadow with the shape of a thought.\n\n"Hm," he says to the empty air. "Rats." He goes back to humming.`, {
      onEnter: [{ set: "relay_unseen", val: true }, { set: "relay_safe", val: true }, { xp: 3 }],
      interjections: [J("slip", 3, `A whisper in the doorframe. 'Not yet.' Wait. There. Now.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [E("Stay in the dark.")]
    }),
    sneak_fail: N("brune", `A pipe clanks. It is not your fault. It is your *elbow*. The huge man swings round with a speed that does not belong to a man his size and has you by the collar before you have finished stepping back. "There," he says, almost sadly. "I thought I heard rats. Little ones. In uniform." He lifts you an inch. "I'm sorry, citizen. I've no personal quarrel. But you're a trespasser on a Ministry installation, and I've had a very hard week."`, {
      onEnter: [{ surv: 12 }, { hp: -1 }, { set: "relay_alerted", val: true }],
      choices: [C("Struggle.", "thrown"), C("Go limp.", "thrown")]
    }),
    fight: N("narrator", `You tell yourself it is the best of a set of bad ideas. You move before the thought has finished: a low shoulder into the soft part of the belt, an elbow where a jaw would be. Brune is surprised. It is, you will think later, the only advantage you had.\n\nHe is huge. He hits you once, in the ribs, with the flat of a hand, and the air leaves the room.`, {
      onEnter: [{ hp: -1 }, { surv: 12 }, { sfx: "hit" }],
      interjections: [
        J("adrenaline", 3, `YES. HIT HIM. THE KNEE. THE KNEE. THE *KNEE*.`),
        J("grit", 4, `He's only a man. The pain is a rumour. It will be true for five minutes. Hold on.`)
      ],
      choices: [
        K("Bring him down: grapple, throw, keep him on the floor.", "brawn", 12, "brune_fight_brawn", "fight_win", "fight_lose", { white: true }),
        K("Go all out: let the rage have the room.", "adrenaline", 11, "brune_fight_adr", "fight_win", "fight_lose", { white: true }),
        K("Aim for the one place that works: the nerve in the elbow.", "aim", 12, "brune_fight_aim", "fight_win", "fight_lose", { white: true })
      ]
    }),
    fight_win: N("narrator", `He goes down like a wardrobe being unloaded from a lorry: first one knee, then the other, then the whole slow enormous collapse of him, with a long sigh. Brune lies on the metal floor of the Relay with his cap beside him and his eyes closed, breathing deeply, as a man sleeps who has been very tired for years. His hand is still half-curled round the button of his cuff.\n\nThe hum goes on. The valves glow. In the console room, the engineer has put both hands over his mouth.`, {
      onEnter: [{ set: "brune_down", val: true }, { set: "relay_safe", val: true }, { set: "relay_alerted", val: true }, { surv: 15 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }, { hp: -1 }, { note: "task_relay", text: "I put Captain Brune on the floor. He will wake in an hour with a sore head and a good deal to say to the Ministry. I have until then." }],
      interjections: [
        J("adrenaline", 3, `HA. HA HA. *DONE.* Did you see that? I did that.`),
        J("empathy", 4, `He is a man who hums opera. You hit a man who hums opera. You can carry that for the rest of the day. It will be quite heavy.`),
        J("instinct", 5, `An hour, perhaps less. And somebody is going to ask who did it. The only witness is a frightened engineer.`)
      ],
      choices: [E("Step over him.")]
    }),
    fight_lose: N("brune", `The world turns over. You find yourself on your back on the metal floor, with the whole of the Captain's weight on one knee and your name in somebody's mouth. "No," he says, almost kindly. "No, no. Let's not." He hauls you up by the coat and shakes you gently, the way you shake a rug. "I've not hit a student in nine years. Don't make me start. You're going home, and you'll not be coming back, and I will say I found you wandering." He is breathing hard. "And I will say it *nicely*."`, {
      onEnter: [{ surv: 10 }, { hp: -2 }, { set: "relay_alerted", val: true }],
      choices: [C("Go.", "thrown")]
    }),
    thrown: N("narrator", `He puts you out of the gate without malice, with the fussy courtesy of a man putting out a cat. The steel door closes behind you with a long, flat, final noise. The brass plate above it says SILENCE IS A SERVICE. A little way up the avenue, the man in the black coat looks round from his tea.`, {
      onEnter: [{ set: "relay_access", val: false }, { set: "relay_thrown", val: true }, { goto: "street", x: 16, y: 2 }, { surv: 4 }, { note: "task_relay", text: "Brune threw me out of the Relay. The gate is shut. I will need a better way in: a pass, a name, a lie, or a hatch." }],
      choices: [E("Pick yourself up.")]
    }),
    hub: N("brune", `"Citizen." Brune does not take his hands off his belt. He has the look of a man who would rather have been born a gate. "Anything I can do? Within reason? Within, I should say, very *narrow* reason."`, {
      voices: 2,
      interjections: [
        J("senses", 4, `A photograph tucked in the back of his cap: a woman with a gentle, wide, unfocused face. A hospital cardigan.`, { cond: "flag.brune_wife_clinic" }),
        J("instinct", 4, `He has not looked at you for longer than a second. He is afraid of what he might be asked to remember.`)
      ],
      choices: [
        C("Offer a cigarette, a sweet roll, or a cup of tea.", "bribe", { cond: "has('cigarettes') || has('sweet_roll') || has('ration_tea') || has('thermos')" }),
        K("Talk to him about the aria.", "charm", 10, "brune_aria2", "aria_pass", "aria_fail", { white: true }, { cond: "!flag.brune_aria_tried" }),
        K("Take command.", "authority", 12, "brune_command2", "command_pass", "command_fail", { white: true }),
        K("Slip away into the shadow of the machinery.", "slip", 12, "brune_sneak2", "sneak_pass", "sneak_fail", { white: true }),
        C("Hit him first.", "fight"),
        E("Leave him.")
      ]
    }),
    bribed: N("brune", `Brune is looking at the ceiling with great concentration, a cigarette-end between his lips that he's not allowed to light. "Don't mind me," he says out of the side of his mouth. "I've gone *deaf*. It's a thing that happens to a man of my age. If anybody should ask, I was watching a crack." He glances at his watch. "You have nine minutes. After that I shall suddenly recover."`, {
      choices: [E("Get on with it.")]
    }),
    authority_hub: N("brune", `"Sir." Brune is at the desk with a pen, writing a log entry with the painful care of a man trying to describe a sunset to the blind. "Madam. Nothing to report. A *routine* visit. I'm adding that it was *scheduled*." He does not look up. "I shall be some time."`, {
      choices: [E("Leave him to it.")]
    }),
    charmed: N("brune", `He is singing under his breath, the deep wavering baritone, and does not stop when you come in. He nods at you as at a fellow member of a very small choir. "Third act," he mutters. "The bit where she gives the child the key." His eyes are far away and wet. "I don't suppose you'd know the *key*."`, {
      choices: [E("Leave him to his aria.")]
    }),
    down: N("narrator", `Captain Brune is lying where you left him, on his back, with his cap under his head, which is a kindness somebody has done him. His breath is slow and even. He is not dead. At some point in the last hour, a very small hand has put a blanket over his knees.`, {
      choices: [E("Leave him.")]
    })
  }
},

// ===================== BRUNE_D3 =====================
brune_d3: {
  title: "Captain Brune",
  start: [
    { cond: "flag.brune_down", node: "down" },
    { cond: "flag.relay_brune_bribed || flag.relay_brune_charmed", node: "soft" },
    { cond: "true", node: "hard" }
  ],
  nodes: {
    hard: N("brune", `He is in his dress uniform: pressed, buttoned, buttons gleaming. The holster is open. His face is the stiff flat mask of a man at an inspection, and behind him, in the doorway of the back office, a small neat man in a grey suit stands with a very small pen. "Citizen." Brune's voice is wooden. "This is a closed installation. The Jubilee transmission is at twenty hundred. All unauthorised persons will be *accommodated*." He doesn't look at you. He looks at the wall just over your shoulder. "I shall have to ask you to leave."\n\nThe small man in grey makes a note.`, {
      voices: 2,
      interjections: [
        J("instinct", 5, `Brune has been told to hold the line by a man who frightens him. He will do it. He will do it exactly. Do not expect a hum today.`),
        J("senses", 4, `The small neat man is holding the pen like a scalpel. It has not moved since you entered. He is writing in his head.`)
      ],
      choices: [
        C("Show the Inspector's card.", "card", { cond: "has('inspector_card')" }),
        C("Leave quietly.", "leave", { effects: [{ goto: "street", x: 16, y: 2 }] }),
        E("Stand your ground.")
      ]
    }),
    card: N("brune", `Brune's eyes go to the card, and then, for a second, to the small man in grey. A very faint tremor shakes his moustache. "Sir," he says, loudly. "Inspector's authority. I am obliged to admit." The small man in grey says, mildly, "I should like to see that card," and Brune, very softly, says, "It is the *Inspector's*, sir, and the Inspector is *unwell*." There is a long silence. The small man smiles.\n\n"Pass," he says.`, {
      onEnter: [{ surv: 5 }, { set: "relay_d3_card", val: true }],
      choices: [E("Go in.")]
    }),
    leave: N("brune", `"Thank you." He says it very low, without moving his lips. "Citizen. Do be careful. There is a man in this building who has already written your name down."`, {
      choices: [E("Go.")]
    }),
    soft: N("brune", `"Citizen." Brune does not move his lips. His face is the face of a man at attention. Behind him, a small neat man in grey is bent over a desk. "It is a very busy day," says Brune, loudly, "and I have a great deal to do. I shall be at the *far* end of the building for, I should think, a quarter of an hour. At about half past seven. I have a *cough*."\n\nHe coughs, with immense conviction, into his fist. He is, perhaps, the worst actor in the Union. He looks at you with painful, hopeful, helpless eyes. "I find I should like to hear a bit of music," he says. "If anybody has any."`, {
      onEnter: [{ set: "brune_d3_half_past", val: true }, { note: "task_relay", text: "Brune will be at the far end of the Relay at about half past seven with a 'cough'. A fifteen-minute window. He asked, in his terrible way, for music." }],
      interjections: [J("empathy", 5, `He is risking his pension for a cigarette and an aria. He is terrible at it. You will never forget it.`)],
      choices: [
        C("Hum him a bar of the aria.", "soft_hum", { effects: [{ morale: 1 }, { xp: 1 }] }),
        E("Nod. Say nothing.")
      ]
    }),
    soft_hum: N("brune", `You hum the phrase. It cracks in the middle. Brune closes his eyes. He does not sing along. He stands there in his dress uniform, in front of a man with a pen, and listens to a stranger hum the song his wife used to sing, and a single tear runs down the side of his flat nose and disappears into his moustache. "Thank you," he says. "Thank you. That's the key."`, {
      choices: [E("Go.")]
    }),
    down: N("brune", `The man at the door is not Brune. He is a younger, fresher guard in a hastily altered uniform, with his sleeves too long and an expression of hard, anxious zeal. "Citizen," he says. "I am Corporal Dace. Captain Brune is *indisposed*." He swallows. "He was found yesterday on the floor. He has said he fell. I do not believe he fell. I have been told to be very vigilant. I shall be *extremely* vigilant." He does not look at you. His hand is on his holster, and his hand is shaking.`, {
      onEnter: [{ surv: 5 }],
      voices: 2,
      interjections: [
        J("empathy", 4, `He is twenty. He has been given a man's job and a man's gun and a man's fear. He is more dangerous than Brune ever was, because he does not yet know how not to be.`),
        J("authority", 4, `A person who is trying this hard to look like a guard can be talked down by anyone who does not look like a threat.`)
      ],
      choices: [
        K("Calm him: tell him you are not a danger.", "empathy", 11, "brune_d3_dace", "dace_pass", "dace_fail", { white: true }),
        E("Back away.", { effects: [{ goto: "street", x: 16, y: 2 }] })
      ]
    }),
    dace_pass: N("brune", `"I... yes." He lets out his breath. "I am not supposed to say this, citizen, but I have not slept. Captain Brune was kind to me. He used to give me his rations when I was a recruit. When I saw him, on the floor..." He does not finish. "I will be at the back of the building at half past seven. For a moment. I have a, there is a *thing* I must check." He looks at you with sudden, naked appeal. "Be quick."`, {
      onEnter: [{ set: "brune_d3_half_past", val: true }, { xp: 2 }],
      choices: [E("Thank him.")]
    }),
    dace_fail: N("brune", `"I will have to ask you to leave," says Corporal Dace, in a voice that cracks. He fumbles at his holster. "I will have to ask you *now*." Behind him, a small neat man in grey lifts his pen.`, {
      onEnter: [{ surv: 8 }, { goto: "street", x: 16, y: 2 }],
      choices: [E("Retreat.")]
    })
  }
},

// ===================== R_LOGBOOK =====================
r_logbook: {
  title: "The Logbook",
  start: [
    { cond: "has('relay_log')", node: "have" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `A tall green ledger on a sloping desk, chained to a brass ring by a ball-chain of the kind that used to hold bank pens. The pages are ruled in columns: DATE. PLATE. LEVEL. DURATION. OPERATOR. REMARKS. The hand is small, regular, nervous, the hand of a man who writes as though the paper might be taken away. Every night for nine years. Nine thousand lines of someone being very careful.\n\nA bookmark, a strip of red felt, marks last night's entry: WED. STANDARD. 4. 1H00. T. WEND. Under REMARKS: *Tuesday's reduction applied as scheduled. Student S.V. not responsive. Q.O. notified.* The 'S.V.' has been gone over in a darker ink, as if it were a name somebody had decided to be afraid of.`, {
      voices: 3,
      interjections: [
        J("archive", 3, `A DATE. PLATE. LEVEL. DURATION. OPERATOR. REMARKS table, with a Ministry stamp at the foot of each page: ORDER 44/Q. Perfect. Even the nightmares are in columns.`),
        J("deduction", 4, `Two pens. The blue ink is Tomas's. The black, which appears every fourth line like a very polite ghost, is an Officer's: a neat italic hand, a *different* kind of tired.`),
        J("senses", 4, `The page smells of cold tea and cotton wool. Beneath it, a faint trace of cedar and lamp oil. A man who has bent over this book without removing his coat.`),
        J("sleight", 4, `A ball-chain. Four links. Two of them are soldered, two of them are not. You can see which. Ten cheerful thieves recognise a weakness in a chain the way you recognise a friend in a crowd.`),
        J("instinct", 4, `The page beneath the red felt is warm. Someone was here, reading, a quarter of an hour ago.`, { cond: "!flag.relay_safe" })
      ],
      choices: [
        C("Read the last few pages.", "read"),
        C("Look for the Commissar's visits.", "ostrov"),
        K("Copy the important pages by hand. It will take half an hour.", "archive", 10, "r_logbook_copy", "copy_pass", "copy_fail", { white: true }, { cond: "flag.relay_safe" }),
        K("Copy the pages under Brune's nose. Keep the pen moving; keep your face stupid.", "composure", 12, "r_logbook_copy_risk", "copy_pass", "copy_fail", { white: true }, { cond: "!flag.relay_safe" }),
        K("Slip a clutch of pages out of the binding and into your coat.", "sleight", 13, "r_logbook_steal", "steal_pass", "steal_fail", { white: false }),
        E("Leave the book alone.")
      ]
    }),
    read: N("narrator", `You turn back through a week. The entries are the same, line after line, STANDARD, STANDARD, PEDAGOGIC, STANDARD: little numbers in a very small hand, a diary written in fours. In the REMARKS column, where an honest man would put the weather, you begin to find notes.\n\n*Sun. Unusual noise in the aerial. Brune says rats.* *Mon. Q.O. attended; asked after my sleeping. Said I was very well.* *Mon. A boy with a ringing cried at the gate. Q.O. gave him a sweet.* And at the foot of Tuesday, in a different, rounder hand, in pencil, in a postscript so small you must lean to see it: *If you are reading this, someone has finally noticed. I am sorry. T.*`, {
      onEnter: [{ xp: 1 }, { set: "relay_log_read", val: true }],
      interjections: [
        J("empathy", 5, `The postscript is not for the Ministry. It is for whoever comes. Tomas has been writing to you for nine years, in pencil, in a margin, and apologising in advance.`),
        J("rote", 3, `S.V. S.V. S.V. S.V. Selected Voran. You do not need the Archive to tell you. You are in this book.`)
      ],
      choices: [C("Go back to the book.", "a")]
    }),
    ostrov: N("narrator", `Ostrov is easy to find because he is the only name in the book that is not an initial. *Sun 1st: Visitor. Commissar O. Dane, Youth. Asked what I do. Told him. (Why did I tell him?)* *Sun 8th: Visitor. Brought tea. The tea was good.* *Sun 15th: Visitor. Brought a thermos. I said it was a very nice thermos. He said I should keep it. I said I'd made it for him and he should keep it. He laughed.* The last entry in his hand is Sunday's. *Visitor. Commissar O. Dane. Said there is a child. Said the child hears the second tone. Said, 'Tomas, don't worry. She hums back.'*\n\nUnder it, in black ink, the neat italic of the Officer: *Noted. H.V.*`, {
      onEnter: [{ xp: 2 }, { set: "relay_log_ostrov", val: true }, { note: "task_relay", text: "In the logbook: Ostrov visited the Relay every Sunday for a month. His last entry: 'Said there is a child. Said the child hears the second tone. Said, Tomas, don't worry. She hums back.' Under it, in the Officer's black ink: 'Noted. H.V.' Voss knew about me a week before Ostrov died." }],
      interjections: [
        J("dialectics", 5, `'Noted.' H.V. read the entry. H.V. read it on Monday. H.V. let Ostrov live for another day. Whatever he did or did not do, he knew where the Ledger was going before it left.`),
        J("volition", 5, `This is the most important thing you have found. Do not do anything with it yet.`)
      ],
      choices: [C("Go back to the book.", "a")]
    }),
    copy_pass: N("narrator", `It takes the best part of half an hour. You copy in the careful, anonymous hand you have used all your life to make schoolwork unremarkable: dates, plates, levels, the REMARKS. You copy Tuesday's *Student S.V. not responsive*. You copy *Noted. H.V.* You copy the postscript, and then, because you cannot not, you copy the pencilled apology as well. When you finish, you have eleven folded sheets of exercise paper and a hand like a claw.\n\nNobody has come. The Relay hums. At the console, the engineer, who has been watching you out of the corner of his eye for twenty minutes, very gently lets out a long breath.`, {
      onEnter: [{ give: "relay_log" }, { set: "relay_log_found", val: true }, { xp: 3 }, { time: 30 }, { task: "task_relay", state: "active" }, { note: "task_relay", text: "Copied the Relay logbook by hand: the nightly plates and levels, Tuesday's 'Student S.V. not responsive', Ostrov's visits and 'Noted. H.V.' It is proof, if proof is something anybody is allowed to read." }],
      interjections: [J("archive", 3, `Eleven pages, eleven nights of the country's one honest record. You have just made a second copy of the Ledger. It is the first time in nine years that anyone has.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Fold the pages away.", "have")]
    }),
    copy_fail: N("narrator", `You are three pages in when your pencil breaks. It makes a very small, sharp, intelligible noise, like a bone, and Brune's head turns. He looks at the book. He looks at you. He looks at the broken pencil, and says in a mild, thoughtful voice, "That's a Ministry book, citizen. We don't generally let people *write* in it." He's at your shoulder before you can turn the page. "Now. Let's have a look at what you've got."`, {
      onEnter: [{ surv: 12 }, { set: "relay_alerted", val: true }, { morale: -1 }],
      choices: [E("Hand over the pages. Walk out.", { effects: [{ goto: "street", x: 16, y: 2 }, { set: "relay_access", val: false }] })]
    }),
    steal_pass: N("narrator", `The chain is a toy. The binding is cheap. Four fingers, a flick, a silent tear. You fold six pages inside your coat without so much as the rustle of a conscience. The book, with its red felt bookmark and its ball-chain, looks exactly as it did. Nobody will notice until the next audit, which in this country is never, or tomorrow.`, {
      onEnter: [{ give: "relay_log" }, { set: "relay_log_found", val: true }, { xp: 3 }, { surv: 4 }, { set: "relay_log_stolen", val: true }, { note: "task_relay", text: "I tore six pages out of the Relay logbook and walked out with them in my coat: Tuesday's 'Student S.V. not responsive', and Ostrov's last Sunday, 'Noted. H.V.' I have proof. The book now has a hole in it somebody will notice." }],
      interjections: [J("sleight", 3, `Ten cheerful thieves, ten very small bows.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Back away from the desk.", "have")]
    }),
    steal_fail: N("narrator", `The binding clicks. It is the sound of a very cheap thing deciding to be expensive. A page tears, not loudly, but with a long dry rip, and a head by the generator turns with an interest you do not like. "Hm?" says the Captain. He starts across the room. There is nothing in your hand but the tail of a page.`, {
      onEnter: [{ surv: 12 }, { set: "relay_alerted", val: true }],
      choices: [E("Step back. Say nothing. Leave.", { effects: [{ goto: "street", x: 16, y: 2 }, { set: "relay_access", val: false }] })]
    }),
    have: N("narrator", `The book sits where it sat. Its chain, its felt, its columns. In your coat, folded small, is a copy of everything that matters about it: nine years of nights, a postscript in pencil, and a pair of black initials that you would very much like to be someone else's.`, {
      choices: [E("Leave the book.")]
    })
  }
},

// ===================== R_CONSOLE =====================
r_console: {
  title: "The Broadcast Console",
  start: "a",
  nodes: {
    a: N("narrator", `The console is five metres of dark green steel under a long lamp, with a row of valve-glow at the back and, in front, an inlay of dials, switches, sliding faders and a rack of toggles as dense as a church organ. A small mechanical clock beside the main fader, stopped at 20:40: the most reliable timepiece in the building, because it is never wrong about when it is *needed*. The big central dial is labelled DELIA in felt-tip. Over it, a row of five brass plates, one for each of the settings: STANDARD. PEDAGOGIC. REMEMBRANCE. JUBILEE. And, at the end, a fifth plate welded over by a smaller one, painted black, on which somebody has scratched the single word NO.`, {
      voices: 3,
      interjections: [
        J("rote", 3, `STANDARD: nightly. PEDAGOGIC: schools. REMEMBRANCE: anniversaries. JUBILEE: once a generation. They are in your head. You were given them at nine, in the Orthodoxy primer, in a list of the Warden's Gifts.`),
        J("senses", 4, `The dial under your hand is warm. The big fader hums at exactly the frequency of the fillings in your upper left molar. It is not an accident that the machine and your skull share a pitch. It is the only reason you can stand next to it.`),
        J("deduction", 5, `Five plates. Four are polished from use. The fifth is not worn: it's been *welded*. A setting that exists in the circuit and has been physically disabled. You do not weld a switch that does not do anything.`),
        J("doublethink", 4, `Look how orderly. Look how *gently* it is arranged. Whatever this does, it was designed by people who loved a good layout. Is a person who loves a layout capable of wickedness?`, { effects: [{ surv: 1 }] }),
        J("the_grey", 4, `She is not wicked. She is a conduit. She puts the wicked thing down the wire and I carry it, and I am so *tired* of carrying.`)
      ],
      choices: [
        C("Look at the fifth plate.", "plate5"),
        C("Look for the AUX jack Gregor mentioned.", "aux", { cond: "flag.gregor_patch_known" }),
        C("Talk to Delia.", "delia"),
        C("Patch the counter-tone into the AUX jack.", "patch", { cond: "has('counter_tone') && flag.gregor_patch_known && !flag.tape_swapped" }),
        K("Jam the JUBILEE plate: a wad of wax in the selector.", "slip", 12, "r_console_jam", "jam_pass", "jam_fail", { white: false }, { cond: "!flag.console_jammed && flag.relay_safe" }),
        E("Step away from the console.")
      ]
    }),
    plate5: N("narrator", `The plate has been welded and filed and painted black. Under the paint, if you rub it with a thumbnail, you can feel letters: raised, stamped, in a font you have seen on hospital doors. W. A. K. E. WAKE. A fifth setting. A thing the console can do, that somebody once designed it to do, that somebody else decided it should never be allowed to.\n\n"NO." Someone has scratched it in the paint with a key, hard, over and over. Whoever wrote it did not want to be argued with. Whoever wrote it, you think, was arguing with themselves.`, {
      onEnter: [{ set: "console_wake_known", val: true }, { xp: 2 }, { thought: "th_wake_tone" }, { note: "task_tape", text: "The Relay console has a fifth plate: WAKE. Somebody welded it over and scratched NO into the paint. The circuit exists. The setting was designed, and then forbidden." }],
      interjections: [
        J("archive", 5, `Gregor's original design for the Lullaby: three settings. SLEEP. EASE. WAKE. The Ministry kept two, renamed them, and removed the third. The WAKE setting is what you use to *bring someone back* from a Reduction. It was in the circuit from the first day.`),
        J("dialectics", 4, `If they built a WAKE, they knew the Bell could be undone. They knew every night that the damage was reversible. It was a choice, not a consequence.`),
        J("adrenaline", 3, `SCRAPE IT. SCRAPE IT OFF. SEE WHAT HAPPENS.`)
      ],
      choices: [C("Back to the console.", "a")]
    }),
    aux: N("narrator", `Left of the panel, below the master fader, a small brass cap on a hinge, stamped AUX. You thumb it up. Underneath is a socket: three-pin, dusty, with a cobweb across it as fine as a veil. Nobody has put anything in it for years. There is a smudge in the dust where somebody else has, once, a long time ago, put a thumb.\n\nThe console's wiring diagram, fixed inside the cap, says: AUX → JUBILEE PLATE ONLY. A one-line instruction that someone, once, thought it was not worth removing.`, {
      onEnter: [{ set: "console_aux_found", val: true }, { xp: 1 }, { note: "task_tape", text: "The AUX jack is real: left of the panel, under a brass cap. The wiring diagram says AUX feeds the JUBILEE plate only. The Jubilee is the only transmission the AUX will carry." }],
      interjections: [J("deduction", 4, `AUX → JUBILEE ONLY. They have left a back door in the one setting they were certain nobody would ever use. They have forgotten that a Jubilee comes every twenty-five years, and that somebody *is* going to.`)],
      choices: [C("Back to the console.", "a")]
    }),
    patch: N("narrator", `You take out the small bakelite box and the cable, and you thread the lead into the socket as you would thread a needle in a bad light. It goes in with a soft, definite click. For an instant the console's whole row of valves gives a small shiver, like an animal being touched, and then settles. The cap closes over it. To a casual eye nothing has changed.\n\nIn a few hours, when the plate is turned to JUBILEE and the master tape is rolled, the console will look for a signal on the deck, find it, and, as a matter of strict engineering, prefer the one in the AUX. It will not ask what it is. It does not know how.`, {
      onEnter: [{ take: "counter_tone" }, { set: "tape_swapped", val: true }, { set: "tape_patched", val: true }, { xp: 4 }, { surv: 6 }, { task: "task_tape", state: "done" }, { thought: "th_wake_tone" }, { note: "task_tape", text: "I patched the counter-tone into the AUX jack. When the console is switched to JUBILEE it will prefer AUX over the deck. The master tape will play only if someone finds the cable and pulls it before 20:00." }],
      interjections: [
        J("aim", 4, `A clean insertion. You did not so much as scrape the pins.`, { once: true, effects: [{ xp: 1 }] }),
        J("volition", 5, `It is done. It is not irreversible: a man could find the cable. Whoever is in this room at eight o'clock will decide what happens next. Make sure the room is yours.`),
        J("solidarity", 5, `We are in the wires now. We are in every wire in the district.`)
      ],
      choices: [C("Close the cap and step back.", "a")]
    }),
    delia: N("narrator", `"Hello," you say, feeling extremely foolish. The console does not reply. The valves glow. A relay somewhere clicks, once, with the delicacy of a polite cough. From behind you, a very small voice, from the vicinity of the engineer's chair, says, "She likes it when people say hello." You turn. Tomas Wend is looking at the floor, scarlet. "I didn't say that. I wasn't listening. *Sorry*."`, {
      onEnter: [{ xp: 1 }],
      interjections: [J("empathy", 4, `It is the kindest thing anybody has said to the machine in ten years, and it came from the person who had least reason to say it.`)],
      choices: [C("Back to the console.", "a")]
    }),
    jam_pass: N("narrator", `A pinch of wax from your pocket. A flick of a thumbnail. The selector for JUBILEE is a little brass cam that clicks over a ratchet, and with a grain of candle-end pushed into the third tooth it will, at the moment of truth, stick. Not for long. A technician with a screwdriver will free it in a quarter of an hour. But a quarter of an hour is a very long time to a person who needs one.`, {
      onEnter: [{ set: "console_jammed", val: true }, { xp: 2 }, { surv: 5 }, { note: "task_tape", text: "I wedged wax into the JUBILEE selector. It will stick. A technician can free it in a quarter of an hour, which is the length of a window." }],
      choices: [C("Back to the console.", "a")]
    }),
    jam_fail: N("narrator", `The wax rolls. It leaves a tiny waxy smear on the panel, and a very small, very loud *tick*. Across the room Brune looks up. "Citizen? What was that?" You hold up your empty hands in a posture of such dazzling innocence that he doesn't pursue it, and returns, grudgingly, to his button. But he has seen it. He will remember it. He does not like what he remembers.`, {
      onEnter: [{ surv: 8 }, { set: "relay_alerted", val: true }],
      choices: [C("Back to the console.", "a")]
    })
  }
},

// ===================== R_VAULT =====================
r_vault: {
  title: "Tape Vault Seven",
  start: [
    { cond: "flag.vault_open", node: "inside" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `Vault Seven is a ship's-door of grey steel, rivets the size of coat-buttons, a wheel with six spokes, and three combination drums in a ring of brass. A stencilled legend: TAPE VAULT 7. HOLD ABOVE ALL SUBORDINATE ORDERS. Someone has pencilled underneath, in the small round hand you have begun to know, *Please don't slam it. T.*\n\nThe door is cold to the touch, a cold that comes out through the metal like a held breath. From behind it, very faintly, a sound: slow, rhythmic, human. Snoring. Or the memory of someone who snored there, long ago, in a cot.`, {
      voices: 3,
      interjections: [
        J("senses", 4, `Cold air at the seam, smelling of lavender and old film. A faint tick of a slow clock inside. And a very faint warmth that is not a machine, a blanket's worth.`),
        J("archive", 4, `The date the Hunger Winter ended: the third of April, 'seventy, by Union style: 4-3-70, the day the Warden's Father declared that no further person would be hungry. A thing every child recites at nine. Perhaps it is also a combination.`, { cond: "skill('archive') >= 4" }),
        J("brawn", 4, `The wheel is stiff. It will turn. Not quietly.`),
        J("slip", 4, `Drum locks are three small conversations with a stubborn friend. You listen for the click, and you wait until the metal agrees.`),
        J("instinct", 4, `If anyone in the Relay hears the wheel, they come. Make sure the room is not listening.`, { cond: "!flag.relay_safe" })
      ],
      choices: [
        C("Dial the combination: four, three, seventy.", "open_code", { cond: "flag.vault_code_known" }),
        C("Ask Tomas to open it.", "open_tomas", { cond: "flag.tomas_ally" }),
        K("Think. A date every child recites. Try the end of the Winter.", "archive", 9, "r_vault_archive", "open_pass", "open_fail", { white: true }, { cond: "!flag.vault_code_known && !flag.tomas_ally" }),
        K("Listen to the drums and feel for the gates.", "slip", 14, "r_vault_slip", "open_pass", "open_fail", { white: false }, { cond: "!flag.vault_code_known && !flag.tomas_ally" }),
        K("Wrench the wheel with your whole weight.", "brawn", 14, "r_vault_brawn", "open_pass_loud", "open_fail", { white: false }, { cond: "!flag.vault_code_known && !flag.tomas_ally" }),
        E("Leave the door.")
      ]
    }),
    open_code: N("narrator", `Four. Three. Seventy. The drums go over with the soft, weighty, definite sound of a ship's engine settling in dock. The wheel turns under your hands with the slow patience of a thing that has been oiled once a week for nine years by someone with a conscience. The door swings out on its hinge, and a breath of lavender-and-cold comes out and finds you.`, {
      onEnter: [{ set: "vault_open", val: true }, { xp: 1 }],
      choices: [C("Step inside.", "inside")]
    }),
    open_tomas: N("narrator", `Tomas does not hurry. He walks to the door with the shuffle of a man walking to a dentist, puts his hand on the wheel, and says, to the door, "Please." He dials. He turns. The door opens without a creak. "I oil it every week," he whispers. "It's the only thing in this room that has ever said thank you."`, {
      onEnter: [{ set: "vault_open", val: true }],
      choices: [C("Step inside.", "inside")]
    }),
    open_pass: N("narrator", `It gives. Not all at once: a long, tender sliding, the mechanism trusting your fingers a little at a time, like a shy animal. Then the last drum drops home and the wheel turns, smooth as a sleeping child, and the door swings out on its own weight. A breath of lavender-and-cold. You did that. Nobody heard.`, {
      onEnter: [{ set: "vault_open", val: true }, { xp: 3 }],
      choices: [C("Step inside.", "inside")]
    }),
    open_pass_loud: N("narrator", `You get your shoulder under the wheel and heave, and something gives with a shriek of metal like a scream in a very large kitchen. The door jerks, swings, bangs against its stops, and a bar of echo rolls round the Relay like a cannon-ball going down a corridor. From the other end of the building, a voice: "What was THAT?" Somebody is coming.`, {
      onEnter: [{ set: "vault_open", val: true }, { xp: 2 }, { surv: 8 }, { set: "relay_alerted", val: true }],
      choices: [C("Get inside. Fast.", "inside")]
    }),
    open_fail: N("narrator", `The drums stay shut. You stand, hands on the cold steel, with the feeling of having said a very reasonable sentence to a very unreasonable audience. Whatever it wants, you do not have it. Not yet. Somewhere a pipe knocks; the Relay keeps humming, entirely indifferent.`, {
      onEnter: [{ surv: 2 }],
      choices: [E("Step back.")]
    }),
    inside: N("narrator", `The vault is a steel box eight paces by five, painted pale green, cold as a larder. Racks of grey tape-boxes stand on both sides, each with a typed label: STANDARD. PEDAGOGIC. REMEMBRANCE. Along the back wall, a cot with a patchwork blanket, a thermos on an upturned crate, a small wind-up clock, a photograph of two small girls in summer dresses. Beside the cot, on its own shelf at eye height, set apart like an icon, a heavy tape-box in battleship grey with a single red stripe. On the lid, in gilt copperplate: MASTER TAPE No. 1. GRAND HARMONY. JUBILEE. TO BE PLAYED ONCE.\n\nThe air tastes of lavender and the ghost of a person. Tomas has made a life here, the way a snail makes one in a shell: a few possessions, a blanket and a very bad secret.`, {
      onEnter: [{ set: "tape_found", val: true }, { set: "vault_open", val: true }, { task: "task_tape", state: "active" }, { note: "task_tape", text: "Vault Seven: racks of Bell tapes. The Grand Harmony master tape is a grey box with a red stripe on the shelf by Tomas's cot. 'TO BE PLAYED ONCE.'" }],
      voices: 3,
      interjections: [
        J("empathy", 5, `Two small girls in summer dresses. A thermos. A cot. This is where he goes to be a person for the three hours a night he is not required to hold the world at a pitch. Be gentle with the room.`),
        J("deduction", 4, `The grey box is a duplicate of the vault's stock tape box, but the lid is different, not painted: it is *faced* with a thin sheet of lead. The master is shielded. A tape that is shielded from magnetic fields is a tape that can be *wiped by a field*. Keep it away from anything that hums.`),
        J("senses", 4, `A faint sweet smell from the grey box, like new varnish. A tape made recently, and for a purpose, and by a person who believed in it.`),
        J("the_grey", 4, `I hold the vault in me. I am the cold in it. I would like very much to be the cold that puts a tape out.`)
      ],
      choices: [
        C("Open the grey box and look at the tape.", "tape"),
        C("Take the master tape.", "take", { cond: "!has('master_tape') && !flag.tape_swapped" }),
        C("Replace the master tape with the counter-tone.", "swap", { cond: "has('counter_tone') && !flag.tape_swapped" }),
        C("Look at the photograph.", "cot", { cond: "!flag.vault_photo" }),
        E("Step out and close the door.")
      ]
    }),
    tape: N("narrator", `The lead lid opens with a grunt. Inside, laid in grey felt, a single reel of wide, bronze-brown tape, wound immaculate as a sleeping snail. The leader is red. On a card clipped to the flange, in a firm hand: PLAY ONCE. DO NOT RERUN. LEVEL 7. AUTHORISED: THE MINISTER. And, under it, in different ink, someone has pencilled a small accurate drawing: two waves, one right way up, one upside down, with a line between them, and the word *cancel?* with a question mark.\n\nThe handwriting is Tomas's. He drew it, you realise, in a spare minute, at three in the morning, a hundred times, and then did not know what to do with the drawing.`, {
      onEnter: [{ xp: 2 }, { set: "tape_read", val: true }],
      interjections: [J("dialectics", 4, `He drew the solution and was afraid to build it. A man has to be handed his own idea by someone else before he will believe in it.`)],
      choices: [C("Close the box.", "inside")]
    }),
    take: N("narrator", `The reel is heavier than it looks, and warmer, a living weight. You lift it, in its grey felt, with both hands, as one lifts a baby from a cot. Beneath it, on the shelf, there is nothing at all, just a clean rectangle in the dust. A rectangle that someone will notice.\n\nYou have the Grand Harmony. It is the single most dangerous object in the Union. You are now the owner of a nation's forgetting, and you have nowhere to put it.`, {
      onEnter: [{ give: "master_tape" }, { set: "tape_taken", val: true }, { surv: 10 }, { xp: 3 }, { note: "task_tape", text: "I took the Grand Harmony master tape from Vault Seven. The shelf shows a clean rectangle. Someone will notice. The Ministry may have a copy: Tomas says a second master sits at the Chancellery." }],
      interjections: [
        J("instinct", 5, `Walk out slowly. Not like a thief. Like a person carrying lunch.`),
        J("volition", 5, `If the tape is missing the Ministry will send for the spare. It buys you hours. It does not buy you the Jubilee. A swap would be quieter. But you have what you have.`)
      ],
      choices: [E("Step out and close the door.")]
    }),
    swap: N("narrator", `You take the grey reel out of the lead box and set the counter-tone cylinder in its place, wound onto the spare spool Gregor gave you, tied with the same red leader. It is almost a perfect match. The wax is dark, the tape is bronze, but in a dim vault, on a shelf, with a lead lid, a tired engineer with a clock to watch will see the right colour and not look twice. You slide the master reel into your coat. It is heavy and humming. It does not want to be there.\n\nOn the clean felt, the counter-tone sits like a changeling. In a few hours someone will lift the lid, and wind it onto a deck, and press PLAY.`, {
      onEnter: [{ take: "counter_tone" }, { give: "master_tape" }, { set: "tape_swapped", val: true }, { set: "tape_taken", val: true }, { xp: 5 }, { surv: 6 }, { task: "task_tape", state: "done" }, { thought: "th_wake_tone" }, { note: "task_tape", text: "I swapped the reels. The counter-tone sits in the grey box; the real Grand Harmony is in my coat. At 19:50 someone will load the wrong tape and press PLAY. It will be the right one." }],
      interjections: [
        J("sleight", 4, `A perfect swap. Not a flicker. The felt has been smoothed, the lid reseated, the dust not even disturbed. You may be the best forger in the Union.`, { once: true, effects: [{ xp: 1 }] }),
        J("solidarity", 5, `We are in the vault. We are in the tape. We are in the box with the red stripe.`)
      ],
      choices: [E("Step out and close the door.")]
    }),
    cot: N("narrator", `You pick up the photograph. Two girls, perhaps six and nine, in summer dresses, squinting at the sun with the careful, outraged dignity of children who have been told to hold still. On the back, in the round hand: *Dasha and Lotte. Our last summer. T.* You put it down very gently. You have, you realise, just met someone he has been trying very hard not to forget.\n\nOn the blanket, a note, in the same hand, in pencil, in huge shaky letters: *EAT SOMETHING.*`, {
      onEnter: [{ set: "vault_photo", val: true }, { xp: 1 }],
      interjections: [J("empathy", 5, `Dasha and Lotte. A man who sleeps in a vault of forgetting with a photograph of two girls, and a note to himself to eat. Whatever he has done to a district, he has not been able to forget this.`)],
      choices: [C("Back.", "inside")]
    })
  }
},

// ===================== R_GENERATOR =====================
r_generator: {
  title: "The Generator",
  start: "a",
  nodes: {
    a: N("narrator", `The generator is the size of a small pony and the colour of a bruise. A huge black flywheel turns in a cage of mesh; a smell of hot oil and ozone and burnt coal comes off it in slow waves. Fat copper cables run from its flank across the floor and up the wall to the console, and a brass plate on the housing reads: PREMIER-MARCHETTI 90kW. THIS MACHINE ALSO SPEAKS. Somebody has scratched under it: *Does not speak. Hums.* Behind it, almost out of sight in the wall, a small iron hatch with a rusted COAL plate.`, {
      voices: 3,
      interjections: [
        J("senses", 4, `The generator hums at nine hertz. Everything in the Relay hums at nine hertz. The whole building is a single tuned pipe, and the generator is the lung.`),
        J("deduction", 4, `One feed, one fuse bank, one governor. Everything the Relay does runs off this one machine. A single point of failure that nobody has ever tested, because nobody has ever been so foolish.`),
        J("the_grey", 4, `She is very old. I can feel her shaking in my floor. If she stopped, I would feel it a whole street away.`),
        J("brawn", 4, `A pony-sized machine. You could not lift it. You could, if you had a wrench and a decision, take it apart a nut at a time.`),
        J("adrenaline", 3, `KILL THE POWER. *KILL THE POWER.* Hear how they'd scream.`)
      ],
      choices: [
        K("Study the housing: find where it is weakest.", "deduction", 11, "r_generator_study", "study_pass", "study_fail", { white: true }, { cond: "!flag.generator_weakness" }),
        C("Pick up the wrench by the housing.", "wrench", { cond: "!has('wrench') && !flag.wrench_taken" }),
        C("Look at the coal hatch behind it.", "hatch"),
        C("Think about what happens if it stops.", "sabotage", { cond: "flag.generator_weakness" }),
        E("Step back from the machine.")
      ]
    }),
    study_pass: N("narrator", `You walk the machine the way a farmer walks a horse. Cable by cable, bolt by bolt. The housing has a flat access plate on the left flank, held by four wing-nuts. Behind it, you can see the fuse bank: a row of six porcelain cartridges, three in use, three spare, and, bolted to the back, a single brass governor-rod about as thick as your thumb that regulates everything. Pull the rod; the flywheel runs free; the lights go. Jam it with a wrench and the whole building goes dark, in about four seconds, with a noise like a dying whale.\n\nThere is a reserve. A diesel, in the cellar, that takes nine minutes to start. In nine minutes, all the Relay can do is hum.`, {
      onEnter: [{ set: "generator_weakness", val: true }, { xp: 2 }, { note: "task_relay", text: "The Relay's generator has a single governor-rod behind an access plate. Jam it and the Relay goes dark in four seconds; the reserve diesel takes nine minutes to start. Nine minutes of no Bell." }],
      interjections: [J("dialectics", 4, `A nine-minute blackout would not stop the Harmony. It would *delay* it, and a delayed Harmony is an unplanned one. Delay is a different kind of weapon.`)],
      choices: [C("Back.", "a")]
    }),
    study_fail: N("narrator", `The machine is an unbroken wall of oiled iron. Every nut looks like every other. You look at it for several minutes, hoping it will tell you something, and it hums to itself, and the hum is quite sure of its answers. A wisp of steam from a valve touches your cheek like a hand.`, {
      choices: [C("Back.", "a")]
    }),
    wrench: N("narrator", `A wrench hangs on a nail beside the housing: a heavy adjustable, jaws bright with use, handle wound with black tape and, along the tape, in white paint, a single word: FOR EMERGENCIES. Somebody has had to think of what that word means. You lift it off the nail. It is cold, and very heavy, and the right weight for a hand.`, {
      onEnter: [{ give: "wrench" }, { set: "wrench_taken", val: true }, { surv: 2 }],
      interjections: [J("brawn", 3, `A good wrench. It would open a door. It would open something else, if the something were soft.`)],
      choices: [C("Back.", "a")]
    }),
    hatch: N("narrator", `The coal hatch: an iron door at knee height, bolted on the inside, with a plate rusted to the colour of dried blood. It has not been opened in twenty years. The hinge has been oiled, recently, with machine oil: a thin bright line on the pin. A pale scrape on the floor, a handspan wide, curves from the door toward the console. A bag, perhaps. A person on their knees.`, {
      onEnter: [{ xp: 1 }],
      interjections: [J("deduction", 4, `The hatch has been used. Not by the Ministry. By someone smaller. Someone who did not want to be seen on the street. It leads, you would guess, to the avenue wall, by the downpipe.`)],
      choices: [C("Back.", "a")]
    }),
    sabotage: N("narrator", `You stand and look at it, and in the long slow turn of the flywheel you can see exactly how it would go. The access plate. The rod. The wrench. Four seconds. The lights sag, the valves fade through orange to dull red to a ring of ash, the console dies in a long falling groan, and in a district fourteen thousand loudspeakers go quiet at the same instant, all the way down Karsov Avenue, all the way to the Quay.\n\nIt would not stop the Jubilee. It would stop *tonight*, for nine minutes, with a noise like the end of a hymn. After that there would be a diesel. And a Captain with a gun. And an Officer called Ames, who would know exactly who to look for.`, {
      onEnter: [{ set: "generator_sabotage_planned", val: true }, { note: "task_relay", text: "Plan Z: jam the governor-rod with the wrench and blow the Relay dark. Nine minutes of silence. It would be loud, and costly, and it would make me a criminal for the rest of my life, however short." }],
      interjections: [
        J("volition", 5, `That is the loud way. If it comes to it, you will know. You have the wrench. You have the plate. You may never need either.`),
        J("solidarity", 4, `We would rather be heard than be safe. We would rather not have to choose.`)
      ],
      choices: [C("Back.", "a")]
    })
  }
},

// ===================== R_AERIAL =====================
r_aerial: {
  title: "The Aerial Deck",
  start: [
    { cond: "flag.aerial_climbed", node: "top" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: N("narrator", `A steel ladder bolted to the wall, rungs worn silver by hands, going up into a square of cold light. A painted sign: AERIAL DECK. AUTHORISED MAINTENANCE ONLY. DO NOT STAND ON THE ANTENNA. The ladder shivers when you touch it: a tiny sustained trembling, the whole mast humming up through the building into the sky, nine cycles, steady as a heartbeat. At the bottom of the ladder, a small pile of pigeon feathers and a cigarette end.`, {
      voices: 2,
      interjections: [
        J("stamina", 4, `Eleven metres. Forty rungs. Your legs will remember it for a week.`),
        J("reflex", 4, `The seventh rung is loose. You know it before you touch it. Skip it.`),
        J("the_grey", 4, `Up. Up into me. The mast goes up through me into the sky and I carry it, at the very top, in the thin cold wind. Come and see. I haven't had a visitor in years.`)
      ],
      choices: [
        K("Climb the ladder.", "stamina", 9, "r_aerial_climb", "climb_pass", "climb_fail", { white: true }),
        E("Not now.")
      ]
    }),
    climb_pass: N("narrator", `Forty rungs. At the twenty-eighth you stop thinking, and at the thirty-fifth you stop being someone who climbs and become only a pair of hands, and at the top a cold wind takes you under the arms and lifts you through the hatch into the sky.`, {
      onEnter: [{ set: "aerial_climbed", val: true }, { xp: 1 }, { time: 10 }],
      choices: [C("Stand up.", "top")]
    }),
    climb_fail: N("narrator", `The seventh rung gives. You catch yourself, a hand through a gap, with the blunt dull horror of a body that has remembered it is a body. You hang. You do not fall. Your palm is open from the wrist to the base of the thumb, and when you get back to the floor you are bleeding on the Ministry's metal, and shaking, and not at all sure you will try again.`, {
      onEnter: [{ hp: -2 }, { morale: -1 }],
      choices: [E("Step away from the ladder.")]
    }),
    top: N("narrator", `The aerial deck is a ten-metre square of corrugated iron on the roof of the Relay, with a rail round it and nothing at all over it. In the middle stands a lattice mast thirty metres tall, its feet sunk in a concrete block and wound with a dozen cables thick as your wrist. At the top, in the iron and the cloud, a ring of aerials pointing in all directions, and a red light going on and off once a second. Karsov Avenue lies at your feet. The district lies beyond it, the grey roofs, the brick, the school with its stunted tower, the tram wires drawing a thin silver map on the haze: fourteen thousand people under a lid.\n\nA little steel cabinet bolted to the mast carries a handset with a coiled lead, a row of toggles, and a plate: CARRIER MONITOR. TALKBACK. It is the only voice in the Relay that points the other way.`, {
      voices: 3,
      interjections: [
        J("the_grey", 3, `Look at it. All of it. Every roof. Every chimney. Every window pointing in. I have never been able to see myself before. I am very big, and very sad, and rather beautiful.`),
        J("senses", 5, `The wind carries the carrier through the mast and into your teeth. This is where it sounds like a lullaby. A very long, very slow note sung to a whole city by a machine that does not know it is singing.`),
        J("authority", 4, `A man could stand here and be the voice of the district. It's not a power you should want.`),
        J("solidarity", 5, `We are listening to the whole of us. The whole district hums at the same note. If we all stopped, we would hear each other.`),
        J("rhetoric", 4, `The TALKBACK is a microphone to every loudspeaker in Nine. Eighty seconds is plenty for a good sentence. It is almost certainly the largest audience you will ever have.`)
      ],
      choices: [
        C("Look at the whole district.", "view"),
        C("Open the TALKBACK cabinet.", "talkback"),
        C("Climb down.", "down")
      ]
    }),
    view: N("narrator", `You see it, for the first time, whole. The school is a grey brick coin in a ring of grey brick coins. The dormitory window, with a thread of smoke. The Courtyard, tiny, with the statue a pale thumbnail in the middle. The Ration Hall's ugly green roof. The Boiler Room's chimney, smoking decorously, a very small dissent. Down the avenue, the queue is a dotted line, a stitch in a hem. And at the far end, black and low and patient, the car.\n\nEverything you know, from up here, fits in the palm of your hand. A small, well-kept, heavily annotated place, to which somebody has been very careful to do something kind.`, {
      onEnter: [{ xp: 1 }, { set: "aerial_view", val: true }],
      interjections: [J("empathy", 5, `Every window has someone behind it. Not one of them knows you are here.`)],
      choices: [C("Back to the mast.", "top")]
    }),
    talkback: N("narrator", `The cabinet opens with a click. The handset is cool and heavy, a Ministry model with a bakelite grip and a lead as coarse as a rope. A small brass plate beneath the switch says: OFFICIAL USE. INTERRUPTION OF TRANSMISSION: PERMISSIBLE ONLY IN THE CASE OF THE WARDEN'S DECREE. You lift the handset. A tiny red lamp comes on. You can feel the whole mast listening.\n\nAt your feet, forty rungs down, a Captain is humming an aria. Over your head, a ring of aerials is waiting for someone to say something to fourteen thousand people. Anything. It will be the last thing most of them hear before they forget it.`, {
      voices: 3,
      interjections: [
        J("volition", 5, `Think. Do not speak because the lamp is red. You have, at most, eighty seconds. Choose them as if they were the only ones you will ever have.`),
        J("adrenaline", 4, `SAY IT. SAY *EVERYTHING*. Tell them about the Bell and the Ledger and the gym and the portrait and the HOOP and the, the, THE.`),
        J("composure", 5, `Slow. Deep. The first sentence is the one that matters.`),
        J("archive", 4, `It is a technical offence under Order 44/Q, Section 12, to transmit without authorisation. The penalty is 'quiet accommodation'. The Archive notes, in the margin, that this is not a penalty. It is a destination.`)
      ],
      choices: [
        C("Speak. Read from the Ledger: the nights, the numbers, the names, the hours that were taken. (Verdict: the Broadcast.)", "broadcast", { cond: "(has('ledger') || has('relay_log')) && day < 3" }),
        C("Speak. Read the district its own week, before the Jubilee takes it.", "broadcast3", { cond: "(has('ledger') || has('relay_log')) && day >= 3 && !flag.aerial_broadcast" }),
        C("Say something small and true, and replace the handset.", "small"),
        C("Put the handset back. Say nothing.", "top")
      ]
    }),
    small: N("narrator", `You say eleven words into the handset. *To whoever is listening: you are not mad. You forgot something. It was taken.* You replace the receiver. Down in the street, three hundred people stop walking, and look up, and each one wonders, for a whole second, whether they have just heard themselves think. By the time you reach the ground, most have forgotten they stopped. But not all.`, {
      onEnter: [{ set: "aerial_small_words", val: true }, { surv: 10 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }, { thought: "th_collective_pulse" }],
      choices: [C("Climb down, quickly.", "down")]
    }),
    broadcast: N("narrator", `You unfold the pages. The wind tugs at them. You speak. At first it is a croak, and a loudspeaker on the school roof gives it back to you a half-second late, in a metal voice like a child's, and you nearly stop. Then you hear your own voice come out of ten thousand lamp-posts at once, the voice of a seventeen-year-old reading numbers: dates and levels and the names of nights. You read Tuesday. You read Wednesday. You read *Student S.V. not responsive*. You read a postscript in pencil. You read until the red lamp goes dark, which takes seventy-nine seconds.\n\nBelow, somewhere, a whistle begins. A very long way off a woman in a kitchen puts down a cup. And in the whole district of Tarnov Nine, for an instant, in fourteen thousand heads, a small cold door opens a crack.`, {
      onEnter: [{ set: "aerial_broadcast", val: true }, { surv: 30 }, { xp: 5 }, { ideo: "undercurrent", n: 3 }, { thought: "th_collective_pulse" }, { note: "task_relay", text: "I read from the Ledger over the district loudspeakers for seventy-nine seconds. Every loudspeaker in Nine heard me. Tonight the Bell will rub most of it out. Not all." }],
      voices: 2,
      interjections: [
        J("solidarity", 3, `Do you hear us? Do you hear *all* of us? That was the sound of everyone listening at once.`, { once: true, effects: [{ morale: 3 }] }),
        J("instinct", 6, `Run. Brune is on the ladder. You have fifteen seconds and a roof.`)
      ],
      choices: [E("Run for the hatch.", { effects: [{ ending: "end_static" }] })]
    }),
    broadcast3: N("narrator", `You read for seventy-nine seconds: dates, plates, levels, a pencilled apology, *Student S.V. not responsive*. Your voice comes back to you from every lamp-post on the avenue, where the chairs are already set out in rows. Fourteen thousand people setting out bunting stop, and look up. A woman on a ladder lets a flag fall. Then the red lamp goes dark, and down in the Relay a small neat man with a very small pen begins, without hurry, to climb the ladder.\n\nThey will play the Harmony tonight regardless. But there are now fourteen thousand people who will go to the Jubilee with a question in their mouths.`, {
      onEnter: [{ set: "aerial_broadcast", val: true }, { set: "day3_aerial_broadcast", val: true }, { surv: 30 }, { xp: 4 }, { ideo: "undercurrent", n: 3 }, { thought: "th_collective_pulse" }, { note: "task_jubilee", text: "I read the Relay log over every loudspeaker in the district on the day of the Jubilee. They will still play the Harmony. But the crowd will come with a question in its mouth." }],
      choices: [C("Climb down before he reaches you.", "down")]
    }),
    down: N("narrator", `You climb down the forty rungs one at a time, with your teeth set. At the bottom your legs are water. The Relay hums; the engineer, at the console, does not look up; the Captain, by the generator, does not turn round. You have been to the roof of the district and nobody noticed, and the thing that frightens you most is how easily that will be forgotten.`, {
      onEnter: [{ time: 5 }],
      choices: [E("Leave the ladder.")]
    })
  }
},

// ===================== OSK_D2 =====================
osk_d2: {
  title: "Janitor Osk",
  start: [
    { cond: "flag.osk_keys", node: "hub_keys" },
    { cond: "flag.osk_d2_met", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `Osk is in the gymnasium, on his knees, in the middle of the floor, under the north hoop, scrubbing a patch of the checkered linoleum that was clean before he began and is cleaner now. He has put down the broom. There is a bucket, a stiff brush, a tin of floor-soap, and a wet grey circle about two metres across, in the middle of which he is working, with a slow, absorbed, repetitive movement, like a man writing a very long word.\n\nHe does not look up. "It's been done," he says. "They've told me three times. Take the paint off, they said. Take the *mark* off. As if a floor could be asked to forget." The brush goes round. "I told them: a floor remembers. It is only the people who are kind to it who ever find out."`, {
      voices: 3,
      onEnter: [{ set: "osk_d2_met", val: true }],
      interjections: [
        J("empathy", 4, `He has scrubbed the same spot for an hour. He is not cleaning it. He is *attending* it. It is the only funeral the Commissar will get.`),
        J("the_grey", 3, `Hello, old friend. I'm in the floor too. I'm in every floor in this building. I hold what's dropped. I have held a great deal in this particular patch since Tuesday.`),
        J("senses", 4, `Soap and lye and a trace, in the lye, of something that is not soap. Under the smell of a clean floor, a very faint smell of chalk.`),
        J("solidarity", 4, `We should help him scrub. We should get down on our knees in the wet and do it with him, and say nothing, and be a *we* about it.`, { cond: "ideo.undercurrent >= 2" }),
        J("doublethink", 3, `It's good that he's cleaning. A clean floor is a sign of a healthy school. Look how quickly we recover.`, { effects: [{ surv: 1 }] })
      ],
      choices: [
        C("Kneel down and help him scrub.", "scrub", { effects: [{ time: 10 }, { morale: 1 }] }),
        C("Stand beside him. Say good morning.", "morning"),
        C("Ask how he is.", "morning"),
        E("Leave him to it.")
      ]
    }),
    scrub: N("osk", `You take the other brush. Neither of you says anything for what feels like a long time and is probably five minutes. Soapy water seeps into your cuffs. The linoleum squeaks. When you have done the patch he sits back on his heels, and looks at the circle with the worn composure of a man who has finished a hard day, and says, quietly, "Thank you." He wipes his hands on his overalls. "Nobody has knelt by me while I did that. Not in thirty-one years. I have *scrubbed* a great many floors. It is a different thing, to be company."\n\nHe does not look at you. "You didn't give them my name. I noticed. A man notices when a hole in a form is left empty."`, {
      onEnter: [{ add: "osk_trust", n: 2 }, { xp: 1 }, { ideo: "undercurrent", n: 1 }],
      interjections: [J("empathy", 5, `He is crying. Not much. Not in any way that would show. Soap and tears have the same smell, if you scrub hard enough.`)],
      choices: [C("Tell him you are glad.", "hub")]
    }),
    morning: N("osk", `"Morning." He sits back on his heels. His face, in the grey gym light, looks older than it did yesterday: a stone that has been rained on. "I'm well. I'm *clean*. I've had a cup of the Cook's tea with the aspirin in it, which is to say I'm very calm, and also I find I do not much care about things. It's the aspirin, I expect." He tries a smile. "Forgive an old man. It has been a day. They came at five and took the poor Commissar down. I watched from the fire door. A man with an umbrella supervised. A very polite man. He stood by the body a minute, and he did not wipe his hand after he touched it. He *put it in his pocket*, and kept it there."`, {
      onEnter: [{ set: "osk_saw_removal", val: true }, { xp: 1 }, { note: "task_voss", text: "Osk saw the Commissar taken down at five this morning. A polite man with an umbrella supervised, held the dead man's hand for a moment, and put his own hand in his pocket and kept it there. Voss? Or someone in his coat." }],
      interjections: [J("instinct", 5, `A man who touches the dead and keeps his hand in his pocket is a man who does not want to wipe off what he's touched. Voss, or someone who wants to be him.`)],
      choices: [C("Ask what else he has seen.", "hub")]
    }),
    hub: N("osk", `"Ah." Osk gets to his feet with the long, creaking deliberation of a gate. He picks up the bucket, then puts it down. "I'm only a janitor. But it is a day for knowing things, and I have, I find, some that I should like to say aloud before they go off."`, {
      voices: 2,
      interjections: [
        J("senses", 4, `A crumb of chalk on his collar. A yellow one. He has had a stub of it in his pocket for a long time, and did not mention it.`, { cond: "has('chalk_stub')" }),
        J("empathy", 4, `He wants to be asked something that is not about what he saw. He would like to be asked what he thinks.`)
      ],
      choices: [
        C("Ask what happened to the body.", "morning", { cond: "!flag.osk_saw_removal" }),
        C(`Ask about the night he saw you leaving the gym.`, "night", { cond: "flag.osk_seen_you && !flag.osk_d2_night" }),
        C("Ask about the old ways into the school. The service tunnels.", "tunnels", { cond: "!flag.osk_d2_tunnels" }),
        C("Ask about the Relay, on Karsov Avenue.", "relay", { cond: "!flag.osk_d2_relay" }),
        C("Ask if he would hold something for you. Something small and green.", "hold", { cond: "has('ledger') && !flag.osk_d2_hold" }),
        C("Ask about his keys.", "keys", { cond: "flag.osk_trust >= 2 && !flag.osk_keys" }),
        E("Leave him to the floor.")
      ]
    }),
    night: N("osk", `He sets the bucket down very carefully and looks at his hands. "Ten past two. You came out of the fire door with a flag wrapped round something long, and you were pale as a candle, and your lips were moving. I thought you were praying. I think now you were counting." A breath. "I did not *tell*. I told no one. A man who's seen a thing and told no one keeps it in his chest, like a coin in a mouth. It sits there. You get used to it. I'd say I'm very good at it now."\n\nHe looks up. "Tell me, if it's a fair question. Was it the book? The Commissar's book? I'd like to think I swept up after something *worth* it."`, {
      onEnter: [{ set: "osk_d2_night", val: true }, { add: "osk_trust", n: 1 }],
      interjections: [J("empathy", 4, `He needs it to have been worth it. A small request. A very large one.`)],
      choices: [
        C("Tell him yes. It was worth it.", "night_yes", { effects: [{ add: "osk_trust", n: 2 }, { morale: 1 }] }),
        C("Tell him you don't know. You lost it.", "night_no"),
        C("Say nothing. Nod.", "hub")
      ]
    }),
    night_yes: N("osk", `He nods, slowly, and stays nodding, a small mechanical nod that has no end. "Then it's a good floor," he says at last. "A good floor, with a good thing on it, once. That's all a janitor asks." He rubs his eyes with the back of a wrist. "Thank you, {name}. I'll not say it again. But I'll *think* it. I'll think it at night, when the Bell goes. They say it takes a person's thoughts. I'll keep that one under the mattress."`, {
      choices: [C("Back.", "hub")]
    }),
    night_no: N("osk", `"Lost it." He considers that. "That's all right. That's the honest answer. I'd not have believed the other." A long look. "I've an idea you'll find it. People who lose things in this school mostly find them in the one place they were sure was empty." He picks the brush up. "I'll be here, if there's anything to be swept."`, {
      choices: [C("Back.", "hub")]
    }),
    tunnels: N("osk", `"The old ways." His face brightens a little, as of a man asked about the town of his birth. "Thirty-one years, I've walked every one. The coal chute under the Warden's Father, bricked in, but it breathes. The laundry tunnel to the dormitory, two hundred paces, with a very good echo. The old boiler flue to the Boiler Room. The drain by the Ration Hall that goes under the avenue and comes out by the Relay." He taps the side of his nose. "That last one's the only one the Ministry never found, because it was never on a plan. I delivered coal to that Relay till eleven years ago, when they put in electric. The hatch is behind the downpipe on the east wall. It opens inward. It sticks."`, {
      onEnter: [{ set: "osk_d2_tunnels", val: true }, { xp: 2 }, { note: "task_relay", text: "Osk knows a coal hatch behind the downpipe on the Relay's east wall. It opens inward. It sticks. He delivered coal there until eleven years ago." }],
      choices: [C("Back.", "hub")]
    }),
    relay: N("osk", `"The Relay." His face closes, a door in a draught. "A building I do not like. It has a smell. Not of coal, not of oil: of a *held breath*. I was there for twenty years on the Tuesday coal, and every Tuesday there was a young engineer, a different one each time, who looked at me as if I had come to tell him it was over. The last was a nice boy. A thin boy with a bad stomach. Wend, I think. He used to give me tea and a slice of bread-and-dripping." He shakes his head. "I hope he is *eating*."`, {
      onEnter: [{ set: "osk_d2_relay", val: true }, { add: "osk_trust", n: 1 }, { set: "relay_hatch_known", val: true }, { note: "task_relay", text: "Osk delivered coal to the Relay for twenty years. The engineer Wend gave him bread-and-dripping. The coal hatch opens inward and sticks; Osk may have the padlock key." }],
      interjections: [J("deduction", 4, `Wend. Tomas Wend. Osk knows him by his stomach. A man who was fed by a man who was fed by a man: the whole district is held together by bread-and-dripping.`)],
      choices: [C("Back.", "hub")]
    }),
    hold: N("osk", `He looks at the cloth-bound corner of the green book in your coat, and then, with great deliberation, doesn't. "I will not take it," he says gently. "A janitor is a man who is given things to put away, and does, and forgets. If I took that I would hold it, and I would have to hold it for ever. I'd take it as a kindness. It would be a very bad one." He picks up the brush. "There's a woman in the boiler room who does that for a living. Take it to *her*. She's better at the forgetting-not."`, {
      onEnter: [{ set: "osk_d2_hold", val: true }],
      choices: [C("Back.", "hub")]
    }),
    keys: N("osk", `He unclips the ring from his belt, a thick iron hoop with a hundred keys, each with a tag in a hand like a spider's handwriting. He weighs it in his palm for a long moment. "Thirty-one years. A key for every door in the building, and a few that are not in it." He picks out five, one at a time. "The boiler spare. The gym fire door. The laundry tunnel. The coal hatch at the Relay, padlock, the little brass one. And the one for the stair door under the library: the old servants' stair to the tower, which hasn't been opened since the Jubilee."\n\nHe holds them out. "I'm not a brave man. I'm a man with keys. It is the only form of courage that has ever been offered to me, and I'd like to be of use."`, {
      onEnter: [{ give: "osk_keys" }, { set: "osk_keys", val: true }, { set: "relay_hatch_known", val: true }, { task: "task_osk2", state: "active" }, { xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { thought: "th_chosen_family" }, { note: "task_osk2", text: "Osk gave me five keys: the boiler spare, the gym fire door, the laundry tunnel, the Relay coal-hatch padlock, and the old servants' stair under the library. 'A man with keys. It is the only form of courage that has been offered to me.'" }],
      interjections: [J("solidarity", 4, `We have keys now. A small, heavy, ridiculous jangle of them. The best thing a revolution can have is a janitor.`, { once: true, effects: [{ morale: 1 }] })],
      choices: [C("Thank him.", "hub_keys")]
    }),
    hub_keys: N("osk", `Osk is standing in the middle of the gym with no keys at his belt, and he looks, for the first time since you've known him, light. He keeps patting the empty hoop. "I keep reaching for them," he says. "It's a thing the hand does. I thought I'd miss them. I find I'm *relieved*."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `He has put down thirty-one years of carrying a weight that was always only keys. He is deciding what to do with his hands.`),
        J("senses", 4, `He is humming. It's not a tune you know. It's the tune of a man who has not hummed in a while and is picking it back up from the middle.`)
      ],
      choices: [
        C("Ask how to use the laundry tunnel.", "tunnel_use", { cond: "!flag.osk_tunnel_use" }),
        C("Ask if there is anything he needs.", "need", { cond: "!flag.osk_need" }),
        E("Leave him to his floor.")
      ]
    }),
    tunnel_use: N("osk", `"The laundry tunnel? It comes up in the dormitory basement, behind the big copper. You'll want a lamp. It smells of soap and of ghosts. Someone has been using it. Lately. A young person with a limp, and small feet." He smiles, sidelong. "It's the one place in the school the Matron does not go. She has a *thing* about damp."`, {
      onEnter: [{ set: "osk_tunnel_use", val: true }, { set: "dorm_tunnel_known", val: true }],
      choices: [C("Back.", "hub_keys")]
    }),
    need: N("osk", `"Need." He thinks about it, with the bucket in his hand. "A cup of real tea, one day. A cigarette. A sit-down. I have a nephew in the Quay, a man with a boat, who I should like to see before I'm too old to be surprised by the sea." A wry look. "If the thing goes badly on Thursday, I should like a seat on whatever's going. If it goes well, a sit-down and a cup of tea will do."`, {
      onEnter: [{ set: "osk_need", val: true }, { note: "task_exodus", text: "Osk would like a seat on the night tram if Thursday goes badly: he has a nephew at the Quay with a boat." }],
      choices: [C("Back.", "hub_keys")]
    })
  }
},

// ===================== RHEA_D2 =====================
rhea_d2: {
  title: "Rhea Vantage",
  start: [
    { cond: "flag.rhea_turned", node: "hub_turned" },
    { cond: "flag.rhea_turn_failed", node: "loyal" },
    { cond: "flag.rhea_d2_met", node: "hub" },
    { cond: "flag.rhea_exposed", node: "intro_exposed" },
    { cond: "flag.rhea_deal || flag.rhea_allied", node: "intro_allied" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `She is in the gymnasium, alone, under the north hoop, in her uniform, with her back to the door. She is not doing anything. That is the strangest part. She is standing with her hands at her sides in the middle of the clean grey circle where the Commissar hung, with her head slightly lowered, like a sentry at the end of a very long shift. When your footstep echoes she does not turn. "I come here," she says, "to be sure it's been cleaned. It has. It is *spotless*." A small, dry, humourless breath. "Osk is good at his work."\n\nShe turns at last. Her face is the same: composed, polished. But it is, you think, the face of a person who has stayed awake on purpose. "It is Wednesday," she says. "I am supposed to be at the Home at noon. I find I do not want to go."`, {
      voices: 3,
      onEnter: [{ set: "rhea_d2_met", val: true }],
      interjections: [
        J("empathy", 5, `Under the polish, there is something that did not sleep. It is not guilt. It is a feeling for which the Vanguard has no word. She does not know what to call it, and so she has made it a duty.`),
        J("instinct", 4, `She has chosen to stand in the exact spot. Of all the places in the school, this one. A person does not come back to the place they did something unless it is still doing something to them.`),
        J("senses", 4, `A faint smell of floor-soap and chalk and, from her sleeve, a thread of something like boiled sweets. She has been in a children's room recently.`),
        J("authority", 4, `She is not a threat today. She is a person in a state. It is a mistake to treat a person in a state as an enemy. It is a mistake not to be careful.`)
      ],
      choices: [
        C(`"Why don't you want to go?"`, "home_why"),
        C(`"The Home. Where?"`, "home_where"),
        C("Say nothing. Stand with her.", "stand", { effects: [{ xp: 1 }] }),
        E("Leave her.")
      ]
    }),
    intro_exposed: N("narrator", `She is sitting on the lowest tier of the bleachers with her hands folded, in the way a person sits who has been told to wait for someone. Her uniform is as crisp as ever, the armband precisely squared, but there is something missing from it, a *tension*, the sense that she is still holding the creases in place by will. When she sees you she doesn't rise.\n\n"I have not been arrested," she says. "I find that interesting. The Principal says it's *under review*. The Inspector sent me a note. It said: 'Nobody will touch you until Thursday.'" Her mouth tilts, a ghost of a smile. "I do not know whether that is a mercy."`, {
      voices: 3,
      onEnter: [{ set: "rhea_d2_met", val: true }],
      interjections: [
        J("empathy", 5, `She is waiting for a verdict from people who will never deliver it. It is the thing that happens to a person whose whole life was a duty: when the duty goes quiet, she hears the hum.`),
        J("instinct", 4, `Whatever she does today, she does it as someone who has been exposed. She has nothing left to protect but the thing she was protecting from the start.`),
        J("composure", 4, `Be very still. She is looking for the one move that will tell her what you will do with her.`)
      ],
      choices: [
        C(`"Why Thursday?"`, "thursday"),
        C(`"Where is the Home?"`, "home_where"),
        C("Say nothing. Sit down beside her.", "stand", { effects: [{ xp: 1 }] }),
        E("Leave her.")
      ]
    }),
    intro_allied: N("narrator", `Rhea is waiting by the door of the gym as though she had known you would come. She has a small rolled paper in one hand, tied with red ribbon, and her face wears the polite warmth of someone who has made an agreement and intends to honour it. "Colleague," she says. "I hoped I'd see you. The Principal is very pleased with how things have gone. The Inspector, less so. He thinks it was *convenient*."\n\nShe taps the paper against her palm. "I wanted to say thank you. Not for what we did. For not making me say it aloud." A beat. "That is a rarer courtesy than you know."`, {
      voices: 3,
      onEnter: [{ set: "rhea_d2_met", val: true }],
      interjections: [
        J("empathy", 5, `She is grateful and ashamed in the same breath, and she has decided to be only the first.`),
        J("doublethink", 3, `A colleague! A friend in the Vanguard! Think how much she could do for you.`, { effects: [{ surv: -1 }] }),
        J("solidarity", 4, `We made a deal with her. We shook on it. We will have to decide what a handshake is worth, tomorrow.`)
      ],
      choices: [
        C(`"What is on the paper?"`, "paper"),
        C(`"What's the Home?"`, "home_where"),
        E("Leave her.")
      ]
    }),
    paper: N("rhea", `"This?" She unrolls it with a faint cautious smile. It is a drawing, in crayon, by a small hand: a stick-figure girl in red-brown with a very large smile, holding hands with a smaller stick-figure; above them a yellow sun with a face and a bell. Across the top, in careful capitals: MISS RHEA IS THE BEST BIG SISTER IN THE UNION. "From Ward Nine," she says. "They give them to me on Wednesdays. I have forty. I keep them in a drawer." She rolls it up, tenderly, and retwists the ribbon. "I know what I am. I would just like you to know what *else* I am."`, {
      onEnter: [{ set: "rhea_paper_seen", val: true }, { xp: 1 }],
      choices: [C("Back.", "intro_allied")]
    }),
    stand: N("rhea", `You stand beside her. She does not say anything. After a long time, perhaps two minutes, she lets out a sound that is almost a laugh. "That is the first time in a year," she says, "that anyone has stood next to me and not wanted anything." She doesn't look at you. "Do you know that? Not *once*. The cadets want to be liked. The Principal wants to be obeyed. Ostrov wanted..." She stops. She swallows. "Ostrov wanted me to be a person. It's the most unreasonable thing anyone has ever wanted of me."`, {
      onEnter: [{ add: "rhea_trust", n: 2 }, { set: "rhea_stood", val: true }, { xp: 1 }],
      interjections: [J("empathy", 5, `She said Ostrov's name. She has not been able to say it aloud since Tuesday. You did it by doing nothing.`)],
      choices: [C("Ask what he wanted her to be.", "ostrov"), C("Ask about the Home.", "home_where"), C("Leave her to it.", "hub")]
    }),
    hub: N("rhea", `"Colleague." She says it without irony, or with an irony so carefully buried you cannot find the edge. She is standing with her hands behind her, the posture of a girl who was taught to be at ease in a very small number of ways. "What may I do for you? I find I have a great deal of time and nothing I wish to spend it on."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `She is more tired than yesterday. She has not stopped moving, but the movements have slowed, like a clock that has been wound for the last time.`),
        J("instinct", 4, `She is waiting for you to ask about Thursday. She is not afraid of it. She is afraid of what she wants to say about it.`)
      ],
      choices: [
        C("Ask about the Home.", "home_where", { cond: "!flag.rhea_home_told" }),
        C("Ask about Ostrov.", "ostrov", { cond: "!flag.rhea_ostrov_d2" }),
        C("Ask about Thursday.", "thursday", { cond: "!flag.rhea_thursday" }),
        C("Ask to go with her to the Home.", "visit", { cond: "flag.rhea_home_told && !flag.rhea_visited && flag.rhea_trust >= 2" }),
        C("Tell her what the Grand Harmony is, at level seven.", "proof", { cond: "(flag.tomas_thursday || has('relay_log') || flag.knows_72_hours) && flag.rhea_visited && !flag.rhea_proof" }),
        C("Try to turn her. Ask her to stand with you.", "turn", { cond: "flag.rhea_proof && !flag.rhea_turned && !flag.rhea_turn_failed" }),
        E("Leave her.")
      ]
    }),
    home_why: N("rhea", `"Because they will ask me a thing I do not know how to answer." She says it with great precision. "Pavel, who is six, has started asking whether the Warden can hear him when he's *sad*. I have always said yes. It is the correct answer. It has always comforted them. This week I find it does not comfort *me*." She looks at her hands. "I'd like to say something else. I do not know what it would be."`, {
      onEnter: [{ add: "rhea_trust", n: 1 }],
      choices: [C("Ask about the Home.", "home_where"), C("Back.", "hub")]
    }),
    home_where: N("rhea", `"Vanguard Home Number Three. Ward Nine. Hallow Lane, behind the hedge." She says the address as one says a prayer. "I was five. The Winter had been over a year but nobody had told my district. My mother left me at a tram stop with a bag and a tin of condensed milk and said, 'Stand here, I'll fetch a better coat.' She was not, I think, a bad woman. It was the Winter." She is perfectly level. "I stood there until a lady in a red-brown coat came with a ladle. She said, 'Are you hungry?' I said yes. It is the only true thing I have ever said that was fully answered."\n\n"I was in Ward Nine for nine years. I have been a Vanguard for eight. They are my *family*. I know that is a thing you will think is a lie. I should like you to understand that it is not."`, {
      onEnter: [{ set: "rhea_home_told", val: true }, { add: "rhea_trust", n: 1 }, { xp: 2 }, { task: "task_rhea2", state: "active" }, { note: "task_rhea2", text: "Rhea was left at a tram stop at five with a tin of condensed milk and raised in Vanguard Home Number Three, Ward Nine. She calls the Vanguard her family. She has forty crayon drawings from the children in a drawer." }, { thought: "th_loyal_rhea" }],
      interjections: [
        J("empathy", 5, `'I'll fetch a better coat.' That is the sentence, isn't it. She has waited for the coat for twelve years, and has built a life out of the people who came instead.`),
        J("doublethink", 3, `A *family*. The State is a family. Doesn't it make your heart swell? She is exactly right. A family is a thing that feeds you and hurts you and tells you it's love.`, { effects: [{ surv: 1 }] }),
        J("dialectics", 4, `If the Winter was over a year before she was left, the district was still being fed by the Ministry's Mercy. She was abandoned in a country that had enough to eat. The coat was a kind lie.`)
      ],
      choices: [C("Ask about Ostrov.", "ostrov"), C("Back.", "hub")]
    }),
    ostrov: N("rhea", `"Ostrov." She says it quietly, to the hoop. "He was the Commissar of the Home when I was nine. He taught the Ward to read from a book of Union history, and when it was over he used to read us the one that was not in the book. About a country with a river and a lighthouse. He did the voices." A tiny, involuntary smile. "I thought he was the kindest man alive. I have never told anyone that. And in the spring he came to the Vanguard, and he started to say things, and the Principal said to me, *Rhea, he is going to take their sleep away.* And I thought: he's going to take Pavel's *sleep*."\n\nShe doesn't move. "I did not hate him. That is the thing no one will believe. I did it because I loved him, and I loved Pavel more."`, {
      onEnter: [{ set: "rhea_ostrov_d2", val: true }, { add: "rhea_trust", n: 2 }, { xp: 3 }, { thought: "th_loyal_rhea" }, { note: "task_rhea2", text: "Rhea says Ostrov was the Commissar of her Home and read her stories about a lighthouse. She killed him because Marr told her he would 'take the children's sleep away'. She loved him; she loved the children more. It is the worst reason I have heard for a murder, and the most human." }],
      interjections: [
        J("empathy", 5, `She is telling the truth. All of it. She is a person who believed a lie so entirely that the lie became love, and she acted on the love.`),
        J("volition", 5, `Do not forgive her yet. Do not condemn her yet. This is a very narrow place and you have been invited to stand in it.`),
        J("solidarity", 4, `We could hate her. It would be so much simpler. We cannot, quite. It is going to cost us.`)
      ],
      choices: [C("Ask about Pavel.", "pavel"), C("Back.", "hub")]
    }),
    pavel: N("rhea", `"Pavel." Her whole face changes. It is like watching a window clear. "He's six. He has a cowlick that will not lie down. He can recite the Nine Virtues in four seconds and the First Decree backwards. He thinks the Warden is a very large dog that lives in the sky. He sleeps with his thumb in his mouth, and I have never once had the heart to tell him not to." The face closes again. "On Thursday mornings, after the Bell, there are always some who wake and don't know their own name. Pavel was one, last month. He asked who he was, and I told him. I always tell them. It is the only thing the Ward asks of me."\n\n"I would like to think he will be all right. After Thursday. I have been *told* he will be."`, {
      onEnter: [{ set: "rhea_pavel", val: true }, { add: "rhea_trust", n: 1 }, { xp: 1 }],
      choices: [C("Back.", "hub")]
    }),
    thursday: N("rhea", `"Thursday." She doesn't ask what you mean. "The Grand Harmony. The Jubilee. The Principal says it's a great gift to the Union. That after it, there will be no more hunger, in a manner of speaking. That the Home will have its sleep." The words come out one at a time, like change from a bad purse. "I am to be on the dais. I am to carry the banner. I am to lead the children onto the field. I was told it would be *beautiful*."\n\nShe looks at you. "I find that I have begun to count the children. I do not know why. There are twelve in Ward Nine. I did not used to count."`, {
      onEnter: [{ set: "rhea_thursday", val: true }, { add: "rhea_trust", n: 1 }],
      interjections: [J("instinct", 5, `She has counted twelve. A person counts when she is afraid of subtracting.`)],
      choices: [C("Back.", "hub")]
    }),
    visit: N("narrator", `The Home is exactly as Voss showed you from the car, and nothing like. The hedge is neat, the gate is oiled, and the yard has a faint tang of boiled cabbage and carbolic. Twelve small children in red-brown stand in two lines in the cold, and when Rhea comes through the gate every one of them breaks ranks at once, with a roar that makes the pigeons leave the roof. She is bowled over. She is hanging off by the arms of six children. She is laughing: a real, horrified, helpless laugh.\n\nA tiny boy with a cowlick is hugging her left leg with the whole of his body. He looks up at you with immense seriousness. "Are you a Vanguard?" he says. "Miss Rhea says they are very brave. Are you brave? What is your name? Can the Warden hear you when you are sad?"`, {
      voices: 3,
      onEnter: [{ set: "rhea_visited", val: true }, { time: 40 }, { add: "rhea_trust", n: 2 }, { xp: 2 }, { note: "task_rhea2", text: "I went to Vanguard Home Number Three with Rhea. Twelve children in Ward Nine; Pavel, six, with a cowlick, thinks the Warden is a large dog in the sky. He asked me if the Warden can hear you when you are sad." }],
      interjections: [
        J("empathy", 5, `She is a different person here. Every muscle in her face has come down. She is laughing as if it were a talent she had mislaid.`),
        J("charm", 4, `A child asked you a question. It is the single most important question you have ever been asked. Answer it with your whole face.`),
        J("solidarity", 5, `Twelve of them. Twelve. It would take two tram-trips. One tram-trip, if we cut the seats.`, { cond: "flag.nadia_exodus_offered" })
      ],
      choices: [
        C(`"My name is {name}. And no. I don't think the Warden can hear you. I think *I* can."`, "visit_ans", { effects: [{ add: "rhea_trust", n: 1 }] }),
        C(`"Yes. Always. It's very kind of him."`, "visit_yes", { effects: [{ surv: -2 }, { ideo: "vanguard", n: 1 }] }),
        C("Kneel down. Ask him what makes him sad.", "visit_sad")
      ]
    }),
    visit_ans: N("narrator", `Pavel considers this with huge gravity. "That's a better answer," he decides. He lets go of Rhea's leg and holds out a small, damp, grubby hand. You shake it. "I am going to tell the others." He runs off, and you hear him shouting across the yard, in a high carrying treble: "THE NEW ONE CAN HEAR YOU! THE NEW ONE SAYS HE CAN HEAR!" Rhea has gone very pale. She is not angry. She is staring at you with a look you cannot name.\n\n"That was a very dangerous thing to say," she says quietly. "That is the sort of thing that gets a person sent to Hallow Lane. I'd like you to know I'm not going to report it."`, {
      onEnter: [{ xp: 2 }, { surv: 4 }, { ideo: "undercurrent", n: 1 }],
      choices: [C("Stay a little longer.", "visit_end")]
    }),
    visit_yes: N("narrator", `"Always," you say, brightly. Pavel nods, deeply satisfied, and the whole rank of small red-brown people resettles in its lines like starlings. It's a good answer. It's the answer he wanted. Rhea gives you a nod, a small, respectful, approving nod. And you feel it, the cold click of a very small door closing somewhere in the back of your head.`, {
      onEnter: [{ morale: -1 }, { add: "rhea_trust", n: 0 }],
      choices: [C("Stay a little longer.", "visit_end")]
    }),
    visit_sad: N("narrator", `You kneel in the cold yard, and Pavel puts his very small hands on your shoulders for balance and tells you, gravely, in a whisper that carries to the back of the Ward, that he is sad when the lights go off because there are noises in the pipes and Miss Rhea can't come until the morning. That he is sad on Thursdays, because on Thursdays he can't remember anything he was sad about on Wednesday, and it makes him very *tired*. That he thinks there is a monster in the loudspeaker, but it is a nice one, and it sings.\n\nRhea is standing absolutely still. Her face has gone through several things and come out the other side as a kind of white stillness.`, {
      onEnter: [{ xp: 3 }, { add: "rhea_trust", n: 2 }, { set: "rhea_pavel_sad", val: true }],
      interjections: [J("empathy", 5, `'It's a nice monster and it sings.' That's the sentence you will be unable to forget. That is the Bell, described by someone who has never been told what it is.`, { once: true, effects: [{ morale: -1 }, { xp: 1 }] })],
      choices: [C("Stay a little longer.", "visit_end")]
    }),
    visit_end: N("rhea", `You stay an hour. You hold a skein of wool for a girl of seven who is knitting a scarf for the Warden. You are made to listen to the Nine Virtues recited in under five seconds. You are shown the dormitory, twelve cots in two rows, each with a small tin cup and a crayon drawing taped to the wall above it. Each drawing is of the same figure: a tall girl in red-brown, holding hands.\n\nOn the way out, at the gate, Rhea stops. She is not looking at you. "That's it," she says. "That's what I am for." She puts her hand on the gate. "On Thursday, on the field, those twelve are to stand in the front row. They will be *closest*. For the best effect, the Principal said. For the sound." She swallows. "I have not been able to stop hearing that sentence since Monday."`, {
      onEnter: [{ set: "rhea_front_row", val: true }, { xp: 2 }, { time: 15 }, { note: "task_rhea2", text: "On Thursday the twelve children of Ward Nine are to stand in the front row of the Jubilee field, closest to the speakers, 'for the best effect, for the sound'. Rhea cannot stop hearing the sentence." }],
      interjections: [
        J("volition", 5, `She has told you the thing that will turn her. She does not know yet that she has. Be very quiet about it.`),
        J("instinct", 5, `Closest to the speakers. Level seven. The footnote says: a minority lose the self. A child is a much larger minority than anyone has said.`)
      ],
      choices: [C("Say nothing. Walk back with her.", "hub")]
    }),
    proof: N("narrator", `You tell her about the footnote. Level seven. Ninety-four per cent loss of seventy-two hours; secondary effects, including loss of speech, orientation and 'the self', in a minority. You tell it plainly, with no flourish, as one reads out a bus timetable. You say that the children in the front row will be nearer the speakers than anyone. That a small child, by any measure, is the minority the footnote has in mind.\n\nRhea does not interrupt. When you finish she is standing with both hands on the rail of the bleachers, and her knuckles are very white. "Who told you this?" she says. It is not a challenge. It is a request for a name to hold on to.`, {
      voices: 2,
      onEnter: [{ set: "rhea_proof", val: true }, { xp: 1 }],
      interjections: [
        J("rhetoric", 5, `You do not need to persuade. You have only to say what is true and not get in the way of her hearing it.`),
        J("empathy", 5, `She is going to ask you for a name. She is going to ask you whether it is true. Under both questions is the same one: *can I stop?*`)
      ],
      choices: [C(`"An engineer in the Relay. Who is afraid of it too."`, "turn"), C("Back.", "hub")]
    }),
    turn: N("rhea", `"The Inspector says I am to be on the dais." She says it quietly, to the floor. "The Principal says I am to carry the banner. The Warden *hears*. I have believed it, I think, for twelve years. I do not know that I can believe something else just because it's a footnote." She looks up. Her eyes are very steady. "Convince me. I am not asking you to be gentle. I am asking you to be *accurate*."`, {
      voices: 3,
      interjections: [
        J("volition", 5, `She is giving you the one chance you are going to get. She is not going to be nudged. She wants to be *argued with*, as one adult to another.`),
        J("solidarity", 5, `We love the twelve. She loves the twelve. That is the thing. That is the whole of what we have in common.`),
        J("authority", 4, `Do not command her. She has been commanded all her life. She is a person who has come to the end of orders.`)
      ],
      choices: [
        K("Make the case: she did it to protect them, and the thing she protected them from is the thing about to hurt them.", "rhetoric", 12, "rhea_turn_rhet", "turn_pass", "turn_fail", { white: false }),
        K("Tell her the truth about Ostrov: he was trying to keep Pavel awake, not take his sleep.", "empathy", 12, "rhea_turn_emp", "turn_pass", "turn_fail", { white: false }),
        K("Say it as we: all of us. The Home, the Vanguard, the school. A single voice, in the room.", "solidarity", 12, "rhea_turn_sol", "turn_pass", "turn_fail", { white: false }),
        C("Not yet.", "hub")
      ]
    }),
    turn_pass: N("rhea", `She stands for a long time. She takes off her armband, very slowly, and looks at it, and folds it once, twice, and puts it in her breast pocket. It's a small, ordinary, devastating motion. "I killed a man," she says. "I killed him because I loved the people he was trying to protect. I did not know that was the same thing." Her voice does not break. "I think I'll stand with you. I think I'll stand next to you on Thursday. I shall bring the twelve." She puts out a hand. "I will not ask you to forgive me. I will ask you to *need* me. It is a different thing, and it is the only one I know how to do."\n\nYou take the hand. It is cold and very steady.`, {
      onEnter: [{ set: "rhea_turned", val: true }, { set: "rhea_exposed", val: true }, { give: "rhea_pin" }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { task: "task_rhea2", state: "done" }, { thought: "th_loyal_rhea" }, { note: "task_rhea2", text: "Rhea took off her armband. She will stand with me on Thursday and bring the twelve. 'I will not ask you to forgive me. I will ask you to need me.'" }],
      interjections: [J("empathy", 3, `She did not change sides. She changed what she was loyal *to*. It is a much bigger thing, and a much less common one.`, { once: true, effects: [{ xp: 2 }] })],
      choices: [C("Stand with her.", "hub_turned")]
    }),
    turn_fail: N("rhea", `She listens to the end, and then she lets her hands fall, and the armband is where it was. "That was very well said," she says. It is the voice she uses to the children. "I think it may even be true. I think I'd like it to be." She straightens. "But I have a duty. I have never in my life put down a duty because it was heavy. If I begin now, I won't know how to stop." She gives you a small, bright, appalling smile. "I'll see you on the field. Stand at the back."`, {
      onEnter: [{ set: "rhea_turn_failed", val: true }, { surv: 6 }, { morale: -2 }],
      choices: [C("Leave her.", "loyal")]
    }),
    loyal: N("rhea", `Rhea is on the bleachers with her back very straight, polishing a brass button she has already polished. She does not look up. "Colleague." The word has a cooler edge than before. "I have thought a good deal about what you said. I am a Vanguard. It's a thing one is, not a thing one chooses. On Thursday I shall be at my post. I do not want to be at yours."\n\nA pause. "Stand at the back, if you must come. Don't make me see you."`, {
      voices: 2,
      interjections: [J("empathy", 4, `She meant every word. She also meant the pause. It was a door left an inch ajar, and she does not know that she did it.`)],
      choices: [C("Ask about the children.", "loyal_kids"), E("Leave her.")]
    }),
    loyal_kids: N("rhea", `"The children are in my care." It is a flat, closed sentence. "I will bring them to the field because it is where they are required to be. They will stand in the front, because it's an honour. I will stand behind them, with my hand on Pavel's shoulder. I shall not let anything happen to them. I have said it to myself every night for nine years." She does not blink. "I shall hold on to that. It is, I find, a very good thing to hold on to."`, {
      onEnter: [{ set: "rhea_loyal_vow", val: true }],
      choices: [C("Back.", "loyal")]
    }),
    hub_turned: N("rhea", `Rhea is sitting on the bleachers, bare-armed, the red-brown sleeve rolled to the elbow where the armband used to be. She has the crayon drawing in her lap, and is unrolling it, and rolling it up again. When you come near she looks up with something you have not seen on her before: not warmth, exactly, but the shape of the place where warmth would go. "Colleague." A beat. "I do not know what to call you now."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `She is a person who has put down the thing that held her up, and is, for the first time in her life, standing without it. It is a very frightening feeling. Be there when she wobbles.`),
        J("solidarity", 5, `We are twelve. We are twelve and a girl who used to be Vanguard. We are a very odd cell, and a very good one.`)
      ],
      choices: [
        C("Tell her about the tram.", "tram", { cond: "(flag.nadia_exodus_offered || flag.nadia_ally) && !flag.rhea_tram" }),
        C("Ask what she can do on Thursday.", "plan", { cond: "!flag.rhea_plan" }),
        C("Ask about Marr: what does she know?", "marr_info", { cond: "!flag.rhea_marr_info" }),
        E("Leave her.")
      ]
    }),
    tram: N("rhea", `"A tram." She says it as if it were a word in another language. "At a quarter to nine. For twelve children and a girl who has done what I've done." She shuts her eyes. "I'd have to leave them with you on the platform and go back. I'm *needed*. If I'm not on the dais, the Principal will know, and Ames will know, and the twelve will be counted." She opens them. "Put the twelve on it. Put Pavel on it first. I will *find* a way to be there. I will stand on that step and wave. It is the only goodbye I have been allowed to choose."`, {
      onEnter: [{ set: "rhea_tram", val: true }, { note: "task_exodus", text: "Rhea wants the twelve children of Ward Nine on the night tram, Pavel first. She will stay behind on the dais so that nobody counts them. 'It is the only goodbye I have been allowed to choose.'" }],
      choices: [C("Back.", "hub_turned")]
    }),
    plan: N("rhea", `"On Thursday, at the field, I stand where I am told. At the front of the dais, with the banner. The Vanguard line is at the ends of the rows, with lists; I know the list, I wrote the *rota*." She gives a thin, odd smile. "On the evening, I am the one who decides which cadets go to which end. I can put the dull ones at the exits. I can put a girl who is in love with a boy from the Canteen at the far side, with an urgent message to deliver. I can make the line *thin*." She tilts her head. "I cannot make it vanish. But I can make it late."`, {
      onEnter: [{ set: "rhea_plan", val: true }, { set: "rhea_line_thin", val: true }, { xp: 2 }, { note: "task_jubilee", text: "Rhea wrote the Vanguard rota for Thursday. She can thin the line at the ends of the rows and send the dull cadets to the wrong exits. She cannot make it vanish. She can make it late." }],
      choices: [C("Back.", "hub_turned")]
    }),
    marr_info: N("rhea", `"The Principal." Rhea's mouth flattens. "She is not a wicked woman. That is what is wrong with her. She is *efficient*. She was told by the District Warden's office that a Commissar was a danger, and she acted. She told me to act. She sat at that desk in her pearls and said, 'I should hate to do this myself.' I understood her to mean: *someone must*." She breathes out. "She keeps a drawer. Thirty-one names. Children sent to the Clinic since the winter. In her handwriting. A list she believes nobody has seen. It is the only evidence I know that she minds."`, {
      onEnter: [{ set: "rhea_marr_info", val: true }, { set: "marr_list_known", val: true }, { xp: 2 }, { note: "task_marr", text: "Rhea says the Principal keeps a drawer with thirty-one names: children sent to the Quiet Clinic since the winter, in her own handwriting. 'The only evidence I know that she minds.'" }],
      choices: [C("Back.", "hub_turned")]
    })
  }
},

// ===================== MARR_D2 =====================
marr_d2: {
  title: "Principal Marr",
  start: [
    { cond: "flag.marr_turned", node: "hub_turned" },
    { cond: "flag.marr_d2_met", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: N("narrator", `The office is a degree colder than yesterday. The green blotter is bare. The fountain pen is capped and laid exactly parallel to the edge of the desk, the way a person lays a thing on a table so as not to be asked to use it. Principal Marr is sitting with her hands folded and her eyes on the window, in the posture of a woman who has been waiting, a long time, for a train that she would prefer not to board. Her pearl-grey suit is spotless. The glasses are on the blotter, folded.\n\nShe does not look round. "Good morning. You will forgive me if I do not pretend we have not met. I have a great deal of correspondence and not one letter I should like to write." A faint, dry, absolutely empty smile. "I understand there is an Inspector in the district. I understand he is *charming*. I find charm very tiring, in men, at this hour."`, {
      voices: 3,
      onEnter: [{ set: "marr_d2_met", val: true }],
      interjections: [
        J("empathy", 5, `She is not herself. She is a person holding herself in a very small chair. There's a little tremor in the left hand that she is hiding behind the right.`),
        J("archive", 4, `The Principal's Day Two diary, as visible on the desk, is blank. Not unwritten: *scored through*. A woman who has been told to forget an appointment and is declining to.`),
        J("senses", 4, `A smell of lavender water, which she has applied heavily, and under it, faintly, pear drops. She has been eating sweets to calm herself. A sugar-paper bag, folded, in the waste-bin.`),
        J("authority", 4, `She is not in command today. Notice how she keeps her hands below the edge of the desk, like a child hiding something. Whatever it is, she is not certain she is allowed to have it.`),
        J("doublethink", 3, `She is *so* dignified. Look how well she bears it. If she says everything is fine, then everything is fine. She is the Principal.`, { effects: [{ surv: 1 }] })
      ],
      choices: [
        C(`"Is something wrong, Principal?"`, "wrong"),
        C(`"The Inspector. Do you know him?"`, "voss"),
        C(`"I would like to talk about the Bell."`, "bell", { cond: "flag.marr_admits_bell || flag.knows_static" }),
        E("Leave her to her correspondence.")
      ]
    }),
    wrong: N("marr", `"Wrong." She considers it with the very small, precise dryness of one weighing a measure of flour. "Nothing is wrong. That is what an administrator says. One says it *all day*." She turns, at last, from the window. Without the glasses her face is smaller and older. "A man is coming from the Chancellery. A Mr Ames. He arrives on the early train tomorrow, to *oversee* the Jubilee. He has been very specific on the telephone. He says he does not wish to be met."\n\nHer eyes close briefly. "I have run this school for eleven years. I have been commended nine times. I find, this morning, that I should like to be able to say what for."`, {
      onEnter: [{ add: "marr_trust", n: 1 }, { set: "marr_knows_ames", val: true }, { set: "voss_ames_named", val: true }],
      interjections: [J("instinct", 5, `She is afraid of Ames. She is afraid of him for exactly the reason she was never afraid of the Warden: she can picture him.`)],
      choices: [C("Ask about the commendations.", "hub"), C("Back.", "hub")]
    }),
    voss: N("marr", `"Mr Voss." She says it as one says the name of a fine and unpleasant wine. "He called yesterday. He was exquisitely polite. He asked how I was *sleeping*. Do you know, nobody has asked me that in nine years?" A thin smile. "He is a Quiet Officer. I should have said, in the course of our earlier conversation, that I know exactly what he is. A *conscience* in a good coat. They send them to schools. They send them when the thing is *ready*. It is very kind of the Ministry. It is so seldom that a person is given warning."\n\nShe lifts her pen and puts it down. "I should be careful of him, if I were you. He is the sort of man who will do you a very great harm and be *unable to forgive himself*, and in the end, which of us has the better of that?"`, {
      onEnter: [{ add: "marr_trust", n: 1 }, { xp: 1 }],
      interjections: [J("empathy", 4, `She is not warning you out of malice. She is warning you out of recognition. She has been the very thing she describes.`)],
      choices: [C("Back.", "hub")]
    }),
    bell: N("marr", `"The Bell." She does not look at you. She folds her hands again. "You have, I understand, a persistent ringing in your ears. I have always known. It is in the file, in the Matron's hand. I think it was one of the reasons I let you remain." She breathes in. "I have not spoken of the Bell to a student since the year I took this post. I said, at the time, that I would never be asked to. It's a very odd thing to find that one is relieved."\n\nShe looks at the blotter. "Ask me, if you like. I do not promise that I'll answer. I promise that I will not *lie*. It has become a habit I find I can no longer afford."`, {
      onEnter: [{ set: "marr_d2_bell", val: true }, { add: "marr_trust", n: 1 }],
      choices: [C("Ask about the children in the drawer.", "list", { cond: "flag.marr_list_known" }), C("Ask what the Jubilee will do.", "jubilee"), C("Back.", "hub")]
    }),
    hub: N("marr", `"Yes?" She puts her glasses on. The eyes behind them are as they always were: pale, polite and finished. Only they are no longer quite sure with whom they are finished. "I have, as I said, a great deal to do. I find I should like to be interrupted."`, {
      voices: 2,
      interjections: [
        J("senses", 4, `The drawer to the left of her knee is not quite shut. Someone has closed it too quickly. A scrap of paper is caught in the runner.`, { cond: "flag.marr_list_known" }),
        J("empathy", 4, `She is hoping you will do something she cannot. She will not say so. She will not, if you are not careful, notice you have.`)
      ],
      choices: [
        C("Ask about the Jubilee.", "jubilee", { cond: "!flag.marr_d2_jubilee" }),
        C("Ask about the thirty-one names.", "list", { cond: "flag.marr_list_known && !flag.marr_list_talked" }),
        C("Give her something sweet.", "roll", { cond: "has('sweet_roll') && !flag.marr_d2_roll", effects: [{ take: "sweet_roll" }, { add: "marr_trust", n: 2 }] }),
        C("Show her the Relay log.", "log", { cond: "has('relay_log') && !flag.marr_d2_log" }),
        C("Try to turn her. Ask her to help.", "turn", { cond: "flag.marr_trust >= 3 && !flag.marr_turn_failed" }),
        E("Leave her.")
      ]
    }),
    roll: N("marr", `She regards it for a long moment. "Oh," she says. "How very... *unfair*." She takes it, as before, with her back to you, turned toward the window. When she turns back, there is a small smear of sugar at the corner of her mouth that she has not noticed, and her eyes are the eyes of a woman of about nineteen. "A kind of apology," she says. "I accept it. I would like you to know that I accept it. It is very difficult to be a woman with an enormous desk and nobody who gives her sweet rolls."`, {
      onEnter: [{ set: "marr_d2_roll", val: true }, { morale: 1 }],
      choices: [C("Back.", "hub")]
    }),
    jubilee: N("marr", `"The Jubilee." She says it carefully, as a person steps over a sleeping animal. "It is a *great honour* for the District. The Warden has sent his own tape. There will be a stage on Karsov Avenue, and flags, and fourteen thousand chairs." Her hands are very still. "I was told in writing. It was written on gilt paper. The footnote says that all the children of the district are required to be present, in the front, in the *light*. I wrote the order myself. In my own hand. I signed it at the foot, with the little flourish that I use for Commendations."\n\nShe looks at the signature on the desk, there, in the middle of the blotter, under the lamp, as if it were someone else's. "It is the worst thing I have ever written. I wrote it beautifully."`, {
      onEnter: [{ set: "marr_d2_jubilee", val: true }, { add: "marr_trust", n: 1 }, { xp: 1 }],
      interjections: [J("empathy", 5, `She wrote it beautifully. That is the thing she cannot forgive.`)],
      choices: [C("Back.", "hub")]
    }),
    list: N("marr", `She looks at the drawer, and then she looks at you, and then she does a thing you have never seen her do: she opens it. It is a shallow tin drawer, lined with green felt, and in it is a single sheet of Ministry cream foolscap, folded in three, with a column of names. Thirty-one. In a beautiful hand. A date beside each. A line through nothing.\n\n"They are children who came to me," she says, "in the morning, in the year, and were *softer* than they had been. A boy of nine who didn't know his own sister. A girl who had begun to recite the Standard Orders in her sleep. I sent them where one sends such children. I filled in the form. The form has a space marked *Reason for Referral*. I wrote, thirty-one times: *Difficult adjustment.*" Her voice does not rise. "I have never once been able to throw this away."`, {
      onEnter: [{ set: "marr_list_talked", val: true }, { add: "marr_trust", n: 2 }, { xp: 3 }, { thought: "th_burned_paper" }, { note: "task_marr", text: "Marr keeps a list of thirty-one children she referred to the Quiet Clinic with the reason 'Difficult adjustment'. She has never been able to throw it away. She showed it to me." }],
      interjections: [J("empathy", 5, `She has been keeping a conscience in a drawer. She has been unable to destroy it and unable to use it. It is exactly like every other conscience in the Union.`)],
      choices: [C("Ask what she will do with it.", "list2"), C("Back.", "hub")]
    }),
    list2: N("marr", `"Do with it?" She looks at the page. "It is a very odd question. Nobody has asked me what I should do with anything in nine years. I have been asked what I would *like*. I have been asked what I *intend*. I have never been asked what I'll do." She folds the page along its creases. "If I had a letter to write... if there were a person who might read it... it would begin with these."\n\nShe lays her hand on the paper. "I have started a letter. I have started it eleven times. It is, I find, a very difficult thing to begin. One has always had a *form*."`, {
      onEnter: [{ set: "marr_letter_started", val: true }, { task: "task_marr", state: "active" }, { note: "task_marr", text: "Marr has begun a letter eleven times: a letter that begins with the thirty-one names. She says it is difficult to begin; she has always had a form." }],
      choices: [C("Offer to help her write it.", "letter_help"), C("Back.", "hub")]
    }),
    letter_help: N("marr", `"You would help me." She says it blankly. "A student. Help the Principal with a *letter*." She takes off her glasses and puts them on the blotter. "I think that is the most unreasonable thing anyone has proposed to me in my professional life." A long pause. "I think I should like it very much. Sit down. No: *there*, in the good chair. I shall dictate, and you will write, and when it is done we shall decide what it is."\n\nIt takes an hour. She dictates in a low, careful voice, stopping often, correcting a word, replacing 'regrettably' with 'I did it'. At the end she reads it through once, and signs it, with the little flourish. She folds it in three. "There. It is an appalling letter. I have never been so proud of anything."`, {
      onEnter: [{ set: "marr_letter_written", val: true }, { time: 60 }, { add: "marr_trust", n: 3 }, { xp: 4 }, { ideo: "undercurrent", n: 1 }, { note: "task_marr", text: "I helped Marr write her letter. It begins with thirty-one names and ends 'I did it.' It took an hour. She says it is an appalling letter and she has never been so proud of anything." }],
      interjections: [J("empathy", 3, `You wrote it with her. It is her voice and your hand. It is the first honest thing the Principal has ever published, and it is not published yet.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Ask what she will do with it.", "hub")]
    }),
    log: N("marr", `You put the folded pages on the blotter. She reads for a long time, her lips moving very slightly, as she reads a report from a stern inspector. When she reaches the pencilled postscript she stops. "'If you are reading this, someone has finally noticed.'" She puts down the paper. "I have always wondered who in that building was not asleep." She is very white. "It is a disgraceful thing, to be the person who gave the order and find the order has a *face*."\n\nShe takes off her glasses. "I will not turn you in. I find I have forgotten how."`, {
      onEnter: [{ set: "marr_d2_log", val: true }, { add: "marr_trust", n: 2 }, { xp: 2 }],
      choices: [C("Back.", "hub")]
    }),
    turn: N("narrator", `You sit in the good chair, and you tell her. About the Jubilee tape. About level seven, and the footnote, and the fact that the twelve children of Ward Nine will be in the front row. About the Quiet Clinic and the woman with her palms on the glass. About a boy of six with a cowlick who thinks the Warden is a very large dog. About the letter, and the thirty-one names, and the little flourish she used at the foot of the order.\n\nShe listens without interrupting. When you finish, she folds her hands, and for a long time she looks at her own signature, upside down, on the blotter. "Tell me," she says. "What would you have me do?"`, {
      voices: 3,
      onEnter: [{ set: "marr_turn_tried", val: true }],
      interjections: [
        J("volition", 5, `She has asked the question. It is the one question nobody has asked her in nine years: what would you have me do. Do not give her a speech. Give her one thing.`),
        J("rhetoric", 5, `A single request. One door. She is a woman for whom a single clear instruction is a gift.`),
        J("empathy", 5, `She wants to be forgiven. She will settle for being *useful*.`)
      ],
      choices: [
        K("Ask her to read the letter aloud on the field, if the Harmony fails.", "rhetoric", 12, "marr_turn_rhet", "turn_pass", "turn_fail", { white: false }),
        K("Ask her, as a person who wrote thirty-one forms, to write one more: a stay of the Jubilee.", "archive", 12, "marr_turn_form", "turn_pass_form", "turn_fail", { white: false }),
        K("Tell her she does not have to be forgiven. She only has to stop.", "empathy", 12, "marr_turn_emp", "turn_pass", "turn_fail", { white: false }),
        C("Not yet.", "hub")
      ]
    }),
    turn_pass: N("marr", `"Yes." She says it so softly it is hardly a word. She takes the letter, folded in three, in both hands, and holds it a moment against her chest. "I will do that. I shall do that very well. I have a very good speaking voice. It has been *wasted* on Commendations." She puts the letter in a plain envelope, writes a single word on it, and gives it to you. "If I am not able, because of Mr Ames, or the pearls, or my own *nerve*, you will read it. In my place. Do it in my voice. Do the long pauses."\n\nShe takes a ring of keys from the drawer and puts one on the blotter. A small brass key, tagged in a hand like a ledger: LIBRARY STAIR. "The tower is locked. I have the only copy that Mr Osk does not. It is a *very* old lock. I'm told one can see the whole district."`, {
      onEnter: [{ set: "marr_turned", val: true }, { set: "marr_letter_given", val: true }, { set: "tower_open", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { task: "task_marr", state: "done" }, { thought: "th_burned_paper" }, { note: "task_marr", text: "Marr is turned. She gave me the letter in an envelope marked with a single word, and the key to the old library stair to the tower. She will read it on the field if she can; if she cannot, I am to read it in her voice, with the long pauses." }],
      interjections: [J("empathy", 3, `She did not ask whether it was safe. It is the bravest sentence she has ever failed to say.`, { once: true, effects: [{ xp: 1 }] })],
      choices: [C("Take the envelope.", "hub_turned")]
    }),
    turn_pass_form: N("marr", `"A stay." Something goes across her face that you can only call joy. "A Form 11-S. Stay of Public Ceremony, in the event of a *clerical irregularity*. It is the one form I have never been asked to sign and which I have always kept in the drawer, beneath the others, in case." She takes a sheet from the drawer. It is the colour of weak tea, with a bell in the corner. "It requires the Principal's signature and a countersignature from the District Warden's Office. I have the first. I shall have to think about the second." She is already writing. "It will not hold. Of course it will not. But a stay is a *delay*, and a delay is a form of mercy, and I know how to write a very convincing delay."`, {
      onEnter: [{ set: "marr_turned", val: true }, { set: "marr_stay_form", val: true }, { set: "tower_open", val: true }, { xp: 4 }, { ideo: "undercurrent", n: 2 }, { task: "task_marr", state: "done" }, { note: "task_marr", text: "Marr is turned. She is writing a Form 11-S: Stay of Public Ceremony. It will not hold, but a delay is a form of mercy, and she knows how to write a convincing one. She gave me the key to the library stair to the tower." }],
      choices: [C("Thank her.", "hub_turned")]
    }),
    turn_fail: N("marr", `"No." She says it so gently that it is a long moment before you understand. "I think not." She puts on her glasses, and the room cools by a full degree. "It is a very moving appeal. I should like to say that it moved me. It did. But I have been Principal of this school for eleven years, and in that time I have learned a certain thing about moving appeals: that they are the very thing for which one *keeps* a Principal." She picks up her pen. "You may go. I will write nothing down. I will, I think, remember."`, {
      onEnter: [{ set: "marr_turn_failed", val: true }, { surv: 8 }, { morale: -2 }],
      choices: [E("Leave.")]
    }),
    hub_turned: N("marr", `Marr is sitting at her desk, looking at the window, with a small cream envelope under her hand. When you come in she does not put on her glasses. "{name}." It is the first time she has used the name without the little pause before it. "I have been practising. I find I have the most dreadful stage fright. I am the only Principal in the Union who has ever been afraid of an assembly."`, {
      voices: 2,
      interjections: [
        J("empathy", 5, `She is a woman who has been brave once, and is waiting to find out whether it was a fluke.`),
        J("senses", 4, `A smear of ink on her cuff, new. She has been writing. A great deal of something.`)
      ],
      choices: [
        C("Ask about the letter.", "t_letter"),
        C("Ask about Ames.", "t_ames", { cond: "!flag.marr_t_ames" }),
        C("Ask how she is.", "t_how"),
        E("Leave her to her practice.")
      ]
    }),
    t_letter: N("marr", `"The letter." She taps the envelope. "It's a *short* thing. A page and a half. It begins with thirty-one names and ends with a sentence that I have rewritten fifty-two times." She looks up. "I have decided to read the *ending* first. It is, I believe, the correct order. If I am interrupted by a man with a clipboard, they shall have heard the thing that matters."\n\nA wry flicker. "You would be astonished how much courage can be summoned by a sufficiently good draft."`, {
      choices: [C("Back.", "hub_turned")]
    }),
    t_ames: N("marr", `"Mr Ames is a man who has never been late to anything. He arrives in the morning. He will have a very small pen." Marr straightens the blotter by a fraction. "I have prepared. I have put his office in the cold wing, and given him the wrong key, and ordered the wrong tea. It is not *much*. It is what an administrator has." She smiles at her desk. "But I have never in my life been so *glad* of my gift for being inconvenient."`, {
      onEnter: [{ set: "marr_t_ames", val: true }, { note: "task_jubilee", text: "Marr has put Ames in the cold wing with the wrong key and the wrong tea. It is what an administrator can do, and she is glad to do it." }],
      choices: [C("Back.", "hub_turned")]
    }),
    t_how: N("marr", `"How am I?" She considers it as a true question. "I am afraid. I am more afraid than I have ever been. I find it is a very *clean* feeling. Like a window washed from the inside." She straightens her pearls. "It is not at all what I expected. I thought courage would be warm."`, {
      onEnter: [{ morale: 1 }],
      choices: [C("Back.", "hub_turned")]
    })
  }
},

// ===================== ANKA_D2 =====================
anka_d2: {
  title: "Mother Anka",
  start: [
    { cond: "flag.cell_betrayed", node: "betrayed" },
    { cond: "flag.anka_d2_met", node: "hub" },
    { cond: "flag.ledger_with_anka || flag.verdict_ledger", node: "intro_cell" },
    { cond: "true", node: "intro_open" }
  ],
  nodes: {
    intro_cell: N("narrator", `The Boiler Room is not the same room. There are more chairs, and more people on them. A girl is cutting stencils on the planning table with a razor-blade and a tongue between her teeth; a thin man with an ink-stained cuff is typing something very slowly, one finger at a time, on a machine that smells of mice. On the wall, where the pipes meet, someone has pinned a map of the district with nine red pins, and nine blue ones, and a long piece of string.\n\nMother Anka is at the head of the table, with a cigarette going out in a saucer. When she sees you she does not rise. She lifts her cup, an inch. "There she is," she says. "The one who forgot, and then didn't."`, {
      voices: 3,
      onEnter: [{ set: "anka_d2_met", val: true }, { set: "cell_active", val: true }],
      interjections: [
        J("solidarity", 5, `We are in a room full of us. The air has a weight. It is the weight of a roomful of people who have all decided at once.`),
        J("senses", 4, `Typewriter ribbon, mimeograph ink, tea, and, from a corner, the sharp sweet smell of the cheap glue that holds a poster to a wall.`),
        J("empathy", 4, `They are frightened. Not of the Vanguard. Of *tomorrow*. There is a girl at the end of the table with a clock on her wrist, and she keeps looking at it.`),
        J("archive", 4, `Nine copies of the Ledger. Nine different typewriters, nine different towns. It is the best-organised conspiracy in the history of the Union, run by a woman with a cigarette and a flair for chemistry.`)
      ],
      choices: [
        C("Ask how the copying is going.", "copies"),
        C(`"I need to talk about Thursday."`, "thursday"),
        E("Sit down, say nothing.", { effects: [{ xp: 1 }, { morale: 1 }] })
      ]
    }),
    intro_open: N("narrator", `The Boiler Room is warm. The kettle is on. There are a few more chairs than on Tuesday and a girl cutting stencils at the table with a razor-blade, and a thin man typing very slowly in a corner. A map of the district on the wall has pins in it, but they are not yet joined by any string. Mother Anka is in her usual chair with her usual cigarette, and she watches you come in with the narrow, bright, patient attention of a woman who has been told that something will arrive, and does not yet know the shape of it.\n\n"Well," she says. "Here you are again. You have a look I do not like. It is the look of a person who has learned something on a street."`, {
      voices: 3,
      onEnter: [{ set: "anka_d2_met", val: true }],
      interjections: [
        J("empathy", 4, `She has not slept. The cigarette is a prop; she hasn't smoked it. She is waiting for a particular sort of news and is trying to arrange her face for either.`),
        J("senses", 4, `Typewriter ribbon, mimeograph ink, tea. The thin man in the corner is typing something that begins 'To the Citizens of'.`),
        J("solidarity", 4, `We are small, but we are a *we*. It's more than anyone else in the district can say.`)
      ],
      choices: [
        C("Tell her about Karsov Avenue.", "avenue"),
        C(`"I need to talk about Thursday."`, "thursday"),
        E("Sit down, say nothing.", { effects: [{ xp: 1 }, { morale: 1 }] })
      ]
    }),
    betrayed: N("narrator", `The Boiler Room is empty. The kettle is cold. The chairs are in a neat row, facing a wall. On the planning table a single cup has been left half-full, and next to it, a piece of paper, in a neat, hurried hand: *They know. Do not come back. We are not angry. A.* The stencils are gone, the typewriter is gone, the map is gone. There is a clean rectangle on the wall where it hung, and a pin in the middle of it, one blue pin, pushed in so hard the head has bent.\n\nSomewhere above you, on the Courtyard, a door slams, and a pair of heavy boots start down the stair.`, {
      voices: 2,
      onEnter: [{ set: "anka_gone", val: true }, { surv: 15 }, { morale: -3 }, { note: "task_anka", text: "The Boiler Room is empty. A note: 'They know. Do not come back. We are not angry. A.' I told Voss the names. They have gone. I do not know whether they will forgive me; I do not know that I can." }],
      interjections: [
        J("empathy", 5, `'We are not angry.' That is the worst sentence you have ever read. It is the most generous, and the cruelest.`),
        J("instinct", 6, `Boots on the stair. You have about a minute. Go up the ladder. *Go*.`)
      ],
      choices: [E("Climb the ladder. Do not look back.", { effects: [{ goto: "courtyard", x: 13, y: 11 }] })]
    }),
    avenue: N("anka", `You tell her. The queue, the night tram, the old man with the kiosk and the lullaby, the engineer with the cotton wool, the man in the black coat with a mitten on his dashboard. You tell her about the poster with the seventy-two hours on it. She listens with her chin on her fist, the cigarette going cold, and the thin man in the corner stops typing and turns his chair.\n\nWhen you say the name Voss, she lifts her head.`, {
      onEnter: [{ xp: 1 }],
      interjections: [J("instinct", 5, `The name has landed in a place you did not know she kept. She is perfectly still. It is the stillness of an old animal that has smelled a very old scent.`)],
      choices: [C("Say it again.", "voss"), C("Go on with the rest.", "hub")]
    }),
    voss: N("anka", `"Hale." It is not a question. She puts down the cigarette. "Hale Voss. A boy with beautiful handwriting. He sat in the second row, by the window, in the year of the great frost. He was a monitor. He had a small round face, and the sweetest, most worried smile in the school. I taught him chemistry for four years." She stops. She looks at her hands. "He wrote the report that ended my career. Aged fifteen. *Teacher says the flame is blue because the Warden's colour is wrong.* I had said it as a joke. He had no idea what he was doing. They told him it was a *service*. He wept when they dismissed me. I was told he wept for a week."\n\n"I have never held it against him. I held it against the form."`, {
      onEnter: [{ set: "anka_voss_story", val: true }, { xp: 3 }, { thought: "th_double_agent" }, { note: "task_voss", text: "Anka knows Voss. He was her student at fifteen, a monitor with a worried smile and beautiful handwriting; he wrote the report that ended her career, not knowing what he did. 'I have never held it against him. I held it against the form.' She remembers him. He does not remember her." }],
      interjections: [
        J("empathy", 5, `She is not angry. She is something worse: she is *sad*, on behalf of both of them, thirty-five years in advance.`),
        J("archive", 5, `Hale Voss, student monitor, Gymnasium No. 9. A boy of fifteen. His file at the Inspectorate begins at twenty-four. Nine years of his life, between a boy and a man, are a stamp.`, { effects: [{ set: "voss_was_pupil", val: true }] })
      ],
      choices: [C("Ask whether she would say that to him.", "voss2"), C("Back.", "hub")]
    }),
    voss2: N("anka", `"To Hale?" She lights the cigarette at last. "I have waited thirty-five years for someone to ask me that. If he stood in that doorway I should say: *the flame is blue because it is hotter, my dear. And the form was wrong. And you were fifteen.*" She takes a drag, a long one. "That is all. A little chemistry and a little mercy. They are very nearly the same discipline."\n\nHer eyes are very bright. "If you see him, tell him I said the second thing first. He will not know what I mean. He will, I think, know *exactly* what I mean."`, {
      onEnter: [{ set: "anka_message_voss", val: true }, { note: "task_voss", text: "Anka's message for Voss: 'The flame is blue because it is hotter. And the form was wrong. And you were fifteen.' She says he will not understand what she means and will know exactly what she means." }],
      choices: [C("Promise to tell him.", "hub")]
    }),
    copies: N("anka", `"The copies." She sits back. "Nine, as planned. Nine machines. A woman in the mills, a man in the post office at Vorsk, two teachers in the south, a priest who does not believe and cannot say so, a boy on a barge. Each has a *chapter*, so that no single one holds more than a ninth." She taps the table. "The typing is slow, and the ribbons are ruinous. We shall have the last by Thursday night. It is *Thursday* that troubles me."\n\nShe looks at the clock on the girl's wrist. "If the Harmony runs, the copies are on paper in nine places, and the people who typed them will not know why. They will wake on Friday with a pile of foolscap and no idea. I have made arrangements for that. I have left a note in each pile that says: *You wrote this. Believe yourself.*"`, {
      onEnter: [{ set: "anka_copies_known", val: true }, { xp: 1 }],
      interjections: [J("empathy", 4, `*You wrote this. Believe yourself.* It is the most radical sentence in the Union, and she has put it in nine places on a Post-it.`)],
      choices: [C("Back.", "hub")]
    }),
    hub: N("anka", `Mother Anka sets down the cup. She regards you through the smoke with the warm, dry, attentive pleasure of a teacher whose best pupil has arrived. "Well. Sit. Eat something. And tell me what has changed since yesterday. A great deal, I think. You look like a young person in the middle of a very large sum."`, {
      voices: 3,
      interjections: [
        J("empathy", 4, `She is concerned for you in a way she'd never say. The cup of tea she has poured is the strongest you have ever been given.`),
        J("solidarity", 4, `We are a very small cell. We are one old woman, a cook, a girl in a wheelchair, and you. It will have to be enough.`),
        J("senses", 4, `A new cup on the table. A chipped one, with a blue rim. It is for someone who has not arrived yet.`)
      ],
      choices: [
        C("Hand her the Ledger.", "give", { cond: "has('ledger') && !flag.ledger_with_anka && day < 3" }),
        C("Give her the Relay log.", "log", { cond: "has('relay_log') && !flag.anka_has_log" }),
        C("Ask about Thursday.", "thursday", { cond: "!flag.anka_thursday" }),
        C("Tell her about Voss.", "voss", { cond: "flag.voss_met && !flag.anka_voss_story" }),
        C("Ask about the nine copies.", "copies", { cond: "flag.cell_active && !flag.anka_copies_known" }),
        C("Ask about Rhea.", "rhea", { cond: "(flag.knows_rhea || flag.rhea_d2_met) && !flag.anka_rhea" }),
        C("Plan the counter-tone: ask what the cell can do.", "plan", { cond: "flag.anka_thursday && !flag.jubilee_prepared" }),
        C("Ask about the night tram.", "tram", { cond: "(flag.nadia_exodus_offered || flag.tram_thursday_known) && !flag.anka_tram" }),
        E("Leave.")
      ]
    }),
    give: N("anka", `You put the green book on the table. Mother Anka does not touch it. She looks at it for a long time, the cigarette burning down between her fingers, and then she does a thing she did not do on Tuesday: she reaches out and puts her palm flat on the cover, and keeps it there.\n\n"Ostrov's hand," she says quietly. "And yours, in the margin." She turns one page with a fingertip, and then another. "It is as it should be. It is a very good piece of work. It is the best record the Union has ever kept of what it has done." She looks up. "Be sure. Once it is mine it is not yours. The Bell will rub out your part of it tonight."\n\nYou say it is given. She nods, once. She picks it up as you pick up a sleeping child.`, {
      onEnter: [{ set: "ledger_with_anka", val: true }, { set: "cell_active", val: true }, { take: "ledger" }, { task: "task_ledger", state: "done" }, { xp: 2 }, { surv: -5 }, { ideo: "undercurrent", n: 2 }],
      choices: [
        E("Go up the stairs. Sleep. (Verdict: the Ledger.)", { effects: [{ ending: "end_ledger" }] }),
        C("Stay a little longer.", "hub")
      ]
    }),
    log: N("anka", `She reads the eleven pages by the light of the stove, slowly, with a pencil in her hand that she does not use. When she reaches the Officer's black ink she stops, and goes back, and reads the same line twice. *Noted. H.V.* "So," she says. "He read it." She turns the page face-down on her knee. "I am quite sure he did not know what he was doing. I am quite sure he knew *exactly*. A man can do both. It is what the Ministry is for." She folds the pages and puts them in her cardigan. "I shall have this typed. In all nine places. It will be, I think, the most useful thing in the whole file."`, {
      onEnter: [{ set: "anka_has_log", val: true }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [C("Back.", "hub")]
    }),
    thursday: N("anka", `"Thursday." She squares the cup on the saucer. "Yes. The thing I did not say on Tuesday because you had not learned enough to hear it. The Bell is a pair of tones. The Jubilee is the same pair at *seven times the depth*. Ilsabet will tell you the figures. A district will stand in a field and be told, in the sweetest possible voice, to forget the last three days. They will forget, and the worst thing, {name}, is that they will be *grateful*." She breathes out smoke. "I have been asked, by a number of children, what we are going to do. I have answered, each time, with the truth. I do not know. I have a *theory*."\n\n"The theory is: we cannot stop the Harmony. We can *answer* it."`, {
      onEnter: [{ set: "anka_thursday", val: true }, { xp: 1 }, { thought: "th_wake_tone" }],
      interjections: [
        J("dialectics", 5, `A thing cannot be stopped. It can be answered. That is the whole of a theory of resistance: not to refuse the sound, but to make a better one.`),
        J("solidarity", 5, `We are not going to be heroes. We are going to be a *chorus*. It is a much harder thing.`)
      ],
      choices: [C("Ask what the answer is.", "plan"), C("Back.", "hub")]
    }),
    plan: N("anka", `"Three plans." She counts on fingers stained yellow to the second joint. "One: *the Wake*. A counter-tone, a mirror of the Bell's second note, built by the girl and the old man and cut on a cylinder. If it can be got onto the Relay's deck in place of the Harmony, the whole district stands in the open door and sees out. It is the only plan with a chance of making anyone remember." She lowers a finger. "Two: *the Tram*. We take the ones who can't be saved and put them on a night tram. Not a victory. A *rescue*." Another. "Three: *the Copies*. If everything fails, the nine piles of foolscap exist, and somebody in a post office will read one and believe themselves."\n\nShe looks at you very steadily. "I should like you to *do* the first. I should like you to be prepared to do the second. I should like you to be absolutely certain you will not have to do the third."`, {
      voices: 3,
      onEnter: [{ set: "anka_plan_told", val: true }, { xp: 2 }, { task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Anka's three plans for Thursday: (1) the Wake: build the counter-tone and put it on the Relay deck in place of the Harmony; (2) the Tram: put those who cannot be saved on the night tram; (3) the Copies: nine piles of foolscap, nine towns. She wants me to do the first, be ready for the second, and never need the third." }],
      interjections: [
        J("rhetoric", 4, `Three plans. Notice that she numbered them by *cost*.`),
        J("volition", 5, `A plan with a fallback is a plan. A plan without one is a prayer. You have been handed two fallbacks. That is a luxury this country has never offered anyone.`),
        J("empathy", 4, `She said 'the ones who can't be saved'. She did not say 'the ones we cannot save'. She did not say 'I'. It is the grammar of a woman who has lost a great many.`)
      ],
      choices: [
        C("Commit to the Wake.", "commit", { effects: [{ set: "jubilee_prepared", val: true }, { xp: 2 }, { morale: 1 }, { ideo: "undercurrent", n: 1 }] }),
        C("Ask for more time to think.", "hub")
      ]
    }),
    commit: N("anka", `"Good." She lets out a long, long breath, and for a moment you see how tired she is. "That is a promise, then. Not to me: to the *twelve*. And to the cook, and the girl, and the old man with the kiosk." She puts her cigarette out, finally, in the saucer. "I shall tell them. I shall tell them that it is on. And I shall pray, in the old way, to a God I am quite sure does not exist, that He will be *punctual*."\n\nShe presses a small brass key into your hand. "Boiler Room spare. In case we are not here." She gives a dry, crooked smile. "Bring the girl. And bring the tube. If you cannot find the tube, find a chemist's replacement. I know a man who makes *excellent* glass."`, {
      onEnter: [{ set: "anka_committed", val: true }, { note: "task_jubilee", text: "I committed to Plan One: the Wake. Anka gave me a spare boiler-room key." }],
      choices: [C("Back.", "hub")]
    }),
    rhea: N("anka", `"Rhea Vantage." Her face grows still. "A child. A believing child, who killed a man she loved for the sake of a thing she loved more. It is the oldest crime in the book, and the most easily forgiven by everyone but the one who did it." She lowers her voice. "Do not kill her, {name}. Do not let anyone kill her. If she can be turned, turn her: she is worth ten men. If she cannot, leave her where she is, and let the Union have the pleasure of her."\n\nShe looks at the stove. "I taught one of the girls in Ward Nine. Briefly. She had her hair in a rope. She was five. She was the most frightened child I have ever seen, and she would not cry. I think of her often."`, {
      onEnter: [{ set: "anka_rhea", val: true }, { xp: 1 }],
      choices: [C("Back.", "hub")]
    }),
    tram: N("anka", `"The tram." She is silent a long time. "Nadia Fell is the best of us, and she has never been in this room. I do not know if she knows what the Undercurrent is. I think she thinks it is a bus route." A smile. "I would put the twelve on it. I would put Wren on it. I would put the girl in the chair, if she would go. I would put *you* on it, if you would be sensible." She squints at you. "You will not be sensible. I have given up expecting it."`, {
      onEnter: [{ set: "anka_tram", val: true }, { note: "task_exodus", text: "Anka would put the twelve, Wren, Ilsabet and me on the night tram, if I would be sensible. She has given up expecting it." }],
      choices: [C("Back.", "hub")]
    })
  }
},

// ===================== DAY-2 NIGHT SCENES (verdicts into Day 3) =====================
daybreak_good_student_d2: {
  title: "Wednesday Night",
  start: [
    { cond: "flag.ledger_with_voss", node: "a_voss" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a_voss: N("narrator", `The black car brings you back to the dormitory gate at a quarter to nine, at walking pace, like a hearse that has decided to be kind. Voss does not get out. He leans across, opens your door, and says, "Thank you, colleague," in a voice that has had something taken out of it. In his breast pocket the green book makes a small square shape against his heart. "Sleep. You'll find you sleep very well. That is the one thing I can promise without reservation."\n\nThe Bell rings at nine. For the first time in your life it sounds like nothing at all: a pleasant hum, a choir, a door closing very gently in another room.`, {
      onEnter: [{ set: "day3_good_student", val: true }, { surv: -10 }, { ideo: "vanguard", n: 1 }],
      voices: 3,
      interjections: [
        J("doublethink", 3, `There. Wasn't that easy? You are on the right side of the dial now. Nobody will ever ask you to be brave again.`),
        J("solidarity", 4, `We are very quiet tonight. We are lying in the dark, all of us, counting the names you didn't say.`, { cond: "!flag.voss_names_given" }),
        J("solidarity", 3, `We are not here. We have gone where you sent us.`, { cond: "flag.voss_names_given" })
      ],
      choices: [C("Sleep.", "b")]
    }),
    a: N("narrator", `You walk back up Karsov Avenue in the dusk with your hands in your pockets and a feeling of having been very sensible. The cadets at the corner nod to you. The loudspeakers are warming in their tin throats. At the dormitory door the Matron makes a small, approving tick in her book and does not ask where you have been, because she has been told.\n\nThe Bell rings at nine. It is soft. You find, to your faint horror, that you lean into it, the way a cat leans into a hand.`, {
      onEnter: [{ set: "day3_good_student", val: true }, { surv: -8 }, { ideo: "vanguard", n: 1 }],
      interjections: [J("volition", 4, `You chose the warm door. Remember that you chose it. That is the last thing they cannot take.`)],
      choices: [C("Sleep.", "b")]
    }),
    b: N("narrator", `Thursday comes up grey and gold. Under your door, a cream card with a silver bell: THE BEARER WILL TAKE A SEAT ON THE REVIEWING STAND AT THE WARDEN'S JUBILEE. 20:00. GRAND HARMONY. Down in the street they are already hammering the stage together, and stringing flags from the loudspeaker poles, and setting out fourteen thousand folding chairs in rows as straight as a ruler's conscience.\n\nTonight the district forgets the week. You will be sitting in the front, in a good chair with arms, close enough to see the dial. Everyone you lied to will be in the rows behind you, and will, by morning, have nothing to forgive.`, {
      onEnter: [{ task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Thursday. I have a seat on the reviewing stand at the Jubilee. Grand Harmony at 20:00. Everyone behind me will forget the week. I could still change my mind. Nobody would remember that I did." }, { thought: "th_grand_harmony" }],
      interjections: [
        J("empathy", 4, `Osk's empty broom is leaning in the Courtyard where he left it.`, { cond: "flag.osk_scapegoat" }),
        J("instinct", 5, `The relay engineer was not at his window this morning. The light in the Relay was on all night.`, { cond: "flag.tomas_arrested" })
      ]
    })
  }
},

daybreak_ledger_d2: {
  title: "Wednesday Night",
  start: "a",
  nodes: {
    a: N("narrator", `You stay in the Boiler Room later than you should. Nobody sends you up. The typewriter in the corner clacks like a slow, determined clock; the girl with the razor-blade cuts stencils until her fingers bleed and then cuts them with a rag round her thumb. Mother Anka moves among them with the teapot, filling cups that have not been emptied, saying nothing, touching a shoulder here, a head there. At half past eight she sends the youngest home. At a quarter to nine she sends you.\n\n"Go up," she says. "It will take some of tonight. Let it. We have it written down."`, {
      onEnter: [{ set: "cell_active", val: true }, { set: "day3_cell_copies", val: true }, { ideo: "undercurrent", n: 1 }],
      voices: 3,
      interjections: [
        J("solidarity", 3, `We are nine typewriters and a kettle. We are a cook, a chemist, a janitor, a girl with a radio. We will not remember tonight, and tonight is written down.`),
        J("empathy", 4, `She held your hand at the door. Just for a second. Her palm was dry and very warm, like bread.`),
        J("archive", 4, `Copies dispatched: four of nine. The remaining five by Thursday night, by barge and by bicycle. Every one carries the same Post-it: YOU WROTE THIS. BELIEVE YOURSELF.`)
      ],
      choices: [C("Climb the ladder.", "b")]
    }),
    b: N("narrator", `The Bell finds you on the dormitory stair. You sit down on the step and hold the banister while it goes through you: the swell, the shiver, the choir. When it ebbs, you are missing the evening. You know you are missing it, because there is ink on your fingers that you cannot account for, and a taste of very strong tea, and a small brass key in your pocket that says BOILER on the tag.\n\nThursday. The Jubilee. Somewhere under the school a woman with a cigarette is laying out a map with nine red pins, and the last piece of string is still in her hand.`, {
      onEnter: [{ task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Thursday. The cell is active; the copies are going out. Tonight, at 20:00, the Grand Harmony. If it plays, the nine piles of foolscap will be all that is left of the week. Anka's Plan One is still the Wake." }, { thought: "th_grand_harmony" }],
      interjections: [
        J("volition", 4, `Ink on your fingers. Good. Your hands remember what your head was told to drop.`),
        J("instinct", 5, `The black car was parked outside the school all night. Its engine never ran. Its owner never slept.`, { cond: "flag.voss_met" })
      ]
    })
  }
},

daybreak_static_d2: {
  title: "Wednesday Night",
  start: "a",
  nodes: {
    a: N("narrator", `You come down the ladder from the aerial deck with your own voice still coming out of every lamp-post in the district, a half-second late, like an echo that has learned to walk. Someone is shouting. Someone is blowing a whistle. You go out by the coal hatch on your belly and come up behind the downpipe in the dusk, and Karsov Avenue is full of people standing still on the pavement, looking up at the loudspeakers, as if they had been told the name of someone they used to know.\n\nThen, at nine, the Bell. It is louder tonight. It has been turned up, by somebody, in a hurry.`, {
      onEnter: [{ set: "day3_hunted", val: true }, { surv: 10 }, { ideo: "undercurrent", n: 2 }],
      voices: 3,
      interjections: [
        J("adrenaline", 3, `THEY HEARD. THEY HEARD IT. Seventy-nine seconds. You can do anything in seventy-nine seconds. You did.`),
        J("the_grey", 3, `I carried it. Every word. Down every wire, into every wall. I have never carried anything I was proud of before.`),
        J("senses", 5, `The Bell is wrong tonight: overdriven, ragged at the top, as if a frightened hand were on the fader. It does not fold neatly over your ringing. It scrapes.`)
      ],
      choices: [C("Run for the dormitory.", "b")]
    }),
    b: N("narrator", `You wake on Thursday with the sheets wound round you and a black bruise on your palm from the ladder. On the dormitory board, in the Matron's hand: ALL STUDENTS WILL REMAIN IN THE BUILDING UNTIL THE JUBILEE. On Karsov Avenue the stage is going up, under twice the guard. There are men in grey coats at the school gate, checking faces against a photograph.\n\nMost of the district does not remember what it heard. But a woman at the ration queue is humming a number. A boy on a tram is saying 'Tuesday' to himself, over and over, as if it were a password. And at the Relay the lights burned all night. Tonight, at eight, they will play the Grand Harmony at full depth, and they will want to be sure they have caught the voice that spoke first.`, {
      onEnter: [{ task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Thursday. The district half-remembers my broadcast; the Ministry is looking for the voice. Grey coats at the gate with a photograph. The Grand Harmony plays at 20:00. They will want me close to the speakers." }, { thought: "th_collective_pulse" }],
      interjections: [J("volition", 5, `You are hunted. You are also, for the first time, *expected*. People are waiting to see what you do next. Do not disappoint the ones humming numbers.`)]
    })
  }
},

daybreak_quiet_d2: {
  title: "Wednesday Night",
  start: "a",
  nodes: {
    a: N("narrator", `Voss is as good as his word. At seven the Matron brings you a cup of tea on a saucer, which has never happened to anyone in the history of the third floor, and tucks the blanket under your chin with a firm, impersonal kindness. The tea is sweet and tastes faintly of willow-bark. By eight your hands feel like someone else's. By the Bell you are already asleep, and it washes over you like warm water over a stone, and takes with it the queue, and the relay, and the man on the running board with his thermos, and a girl in a wheelchair, and a green book, and the face of a dead man under a hoop.`, {
      onEnter: [{ set: "day3_quiet", val: true }, { surv: -15 }, { ideo: "quiet", n: 2 }, { morale: 2 }],
      voices: 2,
      interjections: [
        J("appetite", 3, `Sweet. Warm. So warm. Have the rest. Have all of it.`),
        J("volition", 5, `Hold one thing. Anything. A name. Make a fist round it in your sleep.`)
      ],
      choices: [C("Sleep.", "b")]
    }),
    b: N("narrator", `Thursday. You wake rested, which is the strangest thing that has happened to you all week, and with a ringing in your ears that you put down to a cold. Everyone is very kind to you. There is a Jubilee tonight; there will be flags, and a choir, and chairs on Karsov Avenue. You find you are looking forward to it.\n\nOnly, in the pocket of your jacket, there is a scrap of exercise paper you do not remember putting there, in your own handwriting, pressed so hard it has torn: AT EIGHT, DON'T LISTEN.`, {
      onEnter: [{ task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Thursday. I slept well. There is a Jubilee tonight. In my pocket, in my own handwriting: AT EIGHT, DON'T LISTEN. I do not know why I wrote it. I believe myself." }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        J("instinct", 5, `The note is real. The calm is not. You have been here before: a morning, a blank, and a page in your own hand.`),
        J("empathy", 4, `Somewhere in this building, people who know you are being careful not to say so. They are giving you the choice again.`)
      ]
    })
  }
},

daybreak_curfew_d2: {
  title: "Wednesday Night",
  start: [
    { cond: "visited('relay')", node: "a_relay" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a_relay: N("narrator", `Nine o'clock finds you in the open, between one thing and the next, and the Bell finds you before you find a door. You hear it start: not from the loudspeakers, this time, but from behind you, from the low concrete box with the mast, where you have stood and seen the dial that makes it. That is the worst part: you know which knob. You know the engineer's name. You know the label says DELIA. And still it goes into you like cold water into a cracked cup, and fills every hollow, and you sit down on the kerb of Karsov Avenue with your arms round your knees and feel Wednesday pour out of you.`, {
      onEnter: [{ set: "day2_curfewed", val: true }, { surv: 5 }, { morale: -2 }],
      voices: 2,
      interjections: [
        J("senses", 4, `Nine cycles. Eleven cycles. The beat. Your own ringing pushes against it like a hand against a door, and loses, slowly, finger by finger.`),
        J("the_grey", 3, `I'll hold you. I always hold you. Lie down on me. I won't remember either.`)
      ],
      choices: [C("Let it.", "b")]
    }),
    a: N("narrator", `Nine o'clock finds you with your hand on a door that is not yet open, in the middle of a sentence you had not finished saying. The loudspeakers clear their throats. The swell comes, and the shiver, and the choir, and under them the beat, folding round your ringing like a hand round a moth. You manage, at the very end, to get a pencil out of your pocket. Then the evening goes, and the afternoon after it, and you are sitting on the floor of a corridor, somewhere, with a pencil in your hand and no idea why.`, {
      onEnter: [{ set: "day2_curfewed", val: true }, { surv: 5 }, { morale: -2 }],
      choices: [C("Let it.", "b")]
    }),
    b: N("narrator", `Thursday. You wake in your bunk with the blanket over your boots and a headache like a dent. Wednesday is a smudge: a queue, a car, a tune, nothing you could swear to. But your forearm is covered in pencil, in your own small capitals, running from the wrist to the elbow: THURSDAY 8PM. THE TAPE. THE RELAY. TRUST THE OLD MAN AT THE KIOSK. DO NOT TRUST HOW KIND HE IS.\n\nOutside, on Karsov Avenue, they are setting out chairs for fourteen thousand. Tonight there is no tomorrow to wake up in. Tonight, if the Grand Harmony plays, the Bell takes three days, and this time it will not leave you a pencil.`, {
      onEnter: [{ task: "task_jubilee", state: "active" }, { note: "task_jubilee", text: "Thursday. Wednesday is gone. On my arm, in pencil: THURSDAY 8PM. THE TAPE. THE RELAY. TRUST THE OLD MAN AT THE KIOSK. DO NOT TRUST HOW KIND HE IS. The Grand Harmony plays tonight. There is no Friday to wake up in." }, { thought: "th_second_day" }],
      interjections: [
        J("volition", 5, `You wrote on yourself. Good. You have been here twice now: a blank and a message. You are getting better at being your own witness.`),
        J("instinct", 4, `Everyone you spoke to yesterday remembers you. You do not remember them. Walk carefully; the kind ones will be the hardest to read.`, { cond: "flag.voss_met" })
      ]
    })
  }
}

};
})();
